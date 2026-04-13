'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle2, Lock, Unlock, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getSignedSignature, type Signed } from '@/lib/signature'

interface Recipient {
  id: string
  address: string
}

interface TransferState {
  amount: string
  recipients: Recipient[]
  loading: boolean
  depositTxHash?: string
  withdrawTxHashes?: string[]
  error?: string
  step: 'form' | 'processing' // track which step we're on
}

interface PrivateTransferFormProps {
  recipientAddress?: string
  isPaymentLink?: boolean
}

export default function PrivateTransferForm({ 
  recipientAddress = '', 
  isPaymentLink = false 
}: PrivateTransferFormProps) {
  const { connection } = useConnection()
  const { publicKey, signTransaction, signMessage } = useWallet()
  const [transferState, setTransferState] = useState<TransferState>({
    amount: '',
    recipients: recipientAddress 
      ? [{ id: '1', address: recipientAddress }]
      : [{ id: '1', address: '' }],
    loading: false,
    step: 'form',
  })
  const [encryptionInitialized, setEncryptionInitialized] = useState(false)
  const [encryptionService, setEncryptionService] = useState<any>(null)

  // Update recipient if it changes (for payment links)
  useEffect(() => {
    if (isPaymentLink && recipientAddress) {
      setTransferState((prev) => ({
        ...prev,
        recipients: [{ id: '1', address: recipientAddress }],
      }))
    }
  }, [recipientAddress, isPaymentLink])

  // Initialize encryption from wallet signature
  const initializeEncryption = useCallback(async () => {
    if (!publicKey || !signMessage) {
      alert('Please connect your wallet first')
      return
    }

    try {
      console.log('[v0] Initializing encryption service...')

      const signed: Signed = {
        publicKey,
        provider: { signMessage },
      }

      await getSignedSignature(signed)

      // Dynamically import EncryptionService
      const { EncryptionService } = await import('privacycash/utils')
      const encService = new EncryptionService()
      encService.deriveEncryptionKeyFromSignature(signed.signature!)
      setEncryptionService(encService)
      setEncryptionInitialized(true)

      console.log('[v0] Encryption service initialized')
    } catch (error) {
      console.error('[v0] Error initializing encryption:', error)
      alert(error instanceof Error ? error.message : 'Failed to initialize encryption')
    }
  }, [publicKey, signMessage])

  // Add a new recipient
  const addRecipient = useCallback(() => {
    if (transferState.recipients.length >= 5) {
      alert('Maximum 5 recipients allowed')
      return
    }
    const newId = (Math.max(...transferState.recipients.map(r => parseInt(r.id) || 0)) + 1).toString()
    setTransferState((prev) => ({
      ...prev,
      recipients: [...prev.recipients, { id: newId, address: '' }],
    }))
  }, [transferState.recipients])

  // Remove a recipient
  const removeRecipient = useCallback((id: string) => {
    if (transferState.recipients.length <= 1) {
      alert('You must have at least one recipient')
      return
    }
    setTransferState((prev) => ({
      ...prev,
      recipients: prev.recipients.filter(r => r.id !== id),
    }))
  }, [transferState.recipients])

  // Update recipient address
  const updateRecipient = useCallback((id: string, address: string) => {
    setTransferState((prev) => ({
      ...prev,
      recipients: prev.recipients.map(r => 
        r.id === id ? { ...r, address } : r
      ),
    }))
  }, [])

  // Handle combined deposit + multi-withdraw in one transaction
  const handleDepositAndMultiWithdraw = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      alert('Please connect your wallet first')
      return
    }

    if (!transferState.amount || parseFloat(transferState.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const validRecipients = transferState.recipients.filter(r => r.address.trim())
    if (validRecipients.length === 0) {
      alert('Please enter at least one recipient address')
      return
    }

    // Validate all recipient addresses
    for (const recipient of validRecipients) {
      try {
        new PublicKey(recipient.address)
      } catch {
        alert(`Invalid recipient address: ${recipient.address}`)
        return
      }
    }

    if (!encryptionService) {
      alert('Please initialize encryption first')
      return
    }

    setTransferState((prev) => ({ ...prev, loading: true, error: undefined, step: 'processing' }))

    try {
      console.log('[v0] Starting combined deposit & multi-withdraw...')

      const { WasmFactory } = await import('@lightprotocol/hasher.rs')
      const { deposit, withdraw } = await import('privacycash/utils')

      const lightWasm = await WasmFactory.getInstance()
      const amount = Math.floor(parseFloat(transferState.amount) * LAMPORTS_PER_SOL)

      // Step 1: Deposit to shielded pool
      console.log('[v0] Step 1: Depositing to shielded pool...')
      const depositTxs = await deposit({
        lightWasm,
        connection,
        amount_in_lamports: amount,
        keyBasePath: '/circuit2/transaction2',
        publicKey,
        transactionSigner: async (tx: VersionedTransaction) => {
          try {
            console.log('[v0] Signing deposit transaction...')
            const signed = await signTransaction(tx)
            console.log('[v0] Deposit transaction signed successfully')
            return signed
          } catch (err) {
            console.error('[v0] Failed to sign deposit transaction:', err)
            throw err
          }
        },
        storage: localStorage,
        encryptionService,
      })

      const depositTxHash = Array.isArray(depositTxs) ? depositTxs[0] : depositTxs
      console.log('[v0] Deposit successful:', depositTxHash)

      // Step 2: Withdraw to each recipient
      console.log('[v0] Step 2: Withdrawing to recipients...')
      const withdrawTxHashes: string[] = []
      const amountPerRecipient = amount / validRecipients.length

      for (const recipient of validRecipients) {
        try {
          console.log(`[v0] Withdrawing to ${recipient.address}...`)
          const withdrawTxs = await withdraw({
            amount_in_lamports: amountPerRecipient,
            connection,
            encryptionService,
            keyBasePath: '/circuit2/transaction2',
            publicKey,
            storage: localStorage,
            recipient: recipient.address,
            lightWasm,
            transactionSigner: async (tx: VersionedTransaction) => {
              try {
                console.log('[v0] Signing withdrawal transaction...')
                const signed = await signTransaction(tx)
                console.log('[v0] Withdrawal transaction signed successfully')
                return signed
              } catch (err) {
                console.error('[v0] Failed to sign withdrawal transaction:', err)
                throw err
              }
            },
          })

          const withdrawTxHash = Array.isArray(withdrawTxs) ? withdrawTxs[0] : withdrawTxs
          const withdrawHashStr = getTxHashString(withdrawTxHash)
          withdrawTxHashes.push(withdrawHashStr)
          console.log('[v0] Withdrawal successful to', recipient.address, ':', withdrawHashStr)
        } catch (err) {
          console.error(`[v0] Failed to withdraw to ${recipient.address}:`, err)
          throw new Error(`Failed to send to ${recipient.address}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }

      // Helper function to extract transaction hash string with deep inspection
      const depositHashStr = getTxHashString(depositTxHash)

      console.log('[v0] All withdrawals successful - Hashes:', withdrawTxHashes)

      setTransferState((prev) => ({
        ...prev,
        loading: false,
        step: 'form',
        depositTxHash: depositHashStr,
        withdrawTxHashes,
        amount: '',
        recipients: [{ id: '1', address: '' }],
      }))
    } catch (error: any) {
      console.error('[v0] Transfer error:', error)
      setTransferState((prev) => ({
        ...prev,
        loading: false,
        step: 'form',
        error: error?.message || 'Transfer failed. Please try again.',
      }))
    }
  }, [publicKey, signTransaction, connection, transferState, encryptionService])

  // Helper function to extract transaction hash string with deep inspection
  const getTxHashString = (tx: any): string => {
    try {
      // If it's already a string, return it
      if (typeof tx === 'string') return tx
      
      // Check common properties
      if (tx?.signature && typeof tx.signature === 'string') return tx.signature
      if (tx?.txid && typeof tx.txid === 'string') return tx.txid
      if (tx?.tx && typeof tx.tx === 'string') return tx.tx
      
      // If it's an object, try JSON stringifying to inspect
      const str = JSON.stringify(tx)
      console.log('[v0] TX object:', str)
      
      // Try to extract hash from JSON if it's nested
      try {
        const parsed = JSON.parse(str)
        if (parsed?.signature) return parsed.signature
        if (parsed?.txid) return parsed.txid
      } catch {}
      
      return 'Transaction sent'
    } catch (e) {
      console.error('[v0] Error extracting hash:', e)
      return 'Transaction sent'
    }
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="pb-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isPaymentLink ? 'Send Private Payment' : 'Private Transfer'}
            </CardTitle>
            <CardDescription className="mt-2.5 space-y-1 text-sm">
              {isPaymentLink 
                ? <p className="text-gray-500">Your wallet will remain private and unlinkable to the recipient</p>
                : (
                  <>
                    <p className="font-bold text-emerald-700">Introducing Multi Send.</p>
                    <p className="text-gray-500">Split funds and privately send to up to 5 recipients in one go.</p>
                    <p className="text-gray-400 text-xs">Private, and now more convenient.</p>
                  </>
                )}
            </CardDescription>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6 pb-8 px-6">
        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 block">
            Amount (SOL)
          </label>
          <Input
            type="number"
            placeholder="0.5"
            value={transferState.amount}
            onChange={(e) => setTransferState((prev) => ({ ...prev, amount: e.target.value }))}
            className="bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl h-12 text-base transition-all duration-200"
            disabled={transferState.loading}
            step="0.1"
            min="0"
          />
          <p className="text-xs text-gray-400">This amount will be split equally among all recipients</p>
        </div>

        {/* Recipient Addresses */}
        {!isPaymentLink && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                Recipient Addresses
              </label>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {transferState.recipients.filter(r => r.address.trim()).length}/{transferState.recipients.length}
              </span>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {transferState.recipients.map((recipient, index) => (
                <div key={recipient.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">{index + 1}</span>
                      <Input
                        type="text"
                        placeholder={`Recipient address`}
                        value={recipient.address}
                        onChange={(e) => updateRecipient(recipient.id, e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 text-xs rounded-xl h-11 pl-8 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                        disabled={transferState.loading}
                      />
                    </div>
                    {transferState.amount && parseFloat(transferState.amount) > 0 && (
                      <p className="text-xs text-emerald-600 font-medium pl-1">
                        ≈ {(parseFloat(transferState.amount) / transferState.recipients.length).toFixed(4)} SOL
                      </p>
                    )}
                  </div>
                  {transferState.recipients.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(recipient.id)}
                      disabled={transferState.loading}
                      className="mt-0.5 h-11 w-11 p-0 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {transferState.recipients.length < 5 && (
              <Button
                onClick={addRecipient}
                disabled={transferState.loading}
                variant="outline"
                className="w-full border-dashed border-2 border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all duration-200 font-medium rounded-xl h-11"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient ({transferState.recipients.length}/5)
              </Button>
            )}
          </div>
        )}

        {/* Encryption Alert */}
        {!encryptionInitialized && (
          <Alert className="bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-800 text-sm ml-2">
              Initialize your encryption key first by signing a message with your wallet.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {transferState.error && (
          <Alert className="bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <div className="font-semibold text-sm">Error</div>
              <div className="text-sm mt-1">{transferState.error}</div>
              {transferState.error.includes('Insufficient balance') && (
                <div className="text-xs mt-2 text-red-500">
                  💡 Make sure your wallet has enough SOL for the deposit + fees
                </div>
              )}
              {transferState.error.includes('expired') && (
                <div className="text-xs mt-2 text-red-500">
                  💡 The relayer took too long. Try again with a smaller amount.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alerts */}
        {(transferState.depositTxHash || transferState.withdrawTxHashes?.length) && (
          <Alert className="bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 text-sm font-medium ml-2">
              ✅ Private multi-transfer complete!
            </AlertDescription>
          </Alert>
        )}

        {transferState.depositTxHash && (
          <Alert className="bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertDescription className="text-emerald-700 text-sm">
              {transferState.depositTxHash === 'Transaction sent' ? (
                <>Deposit sent to shielded pool</>
              ) : (
                <>
                  Deposit TX:{' '}
                  <a
                    href={`https://solscan.io/tx/${transferState.depositTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:text-emerald-800 underline font-medium break-all"
                  >
                    {transferState.depositTxHash.slice(0, 20)}...
                  </a>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {transferState.withdrawTxHashes && transferState.withdrawTxHashes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Withdrawal Transactions:</p>
            {transferState.withdrawTxHashes.map((hash, index) => (
              <Alert key={index} className="bg-emerald-50/40 border border-emerald-100 rounded-xl">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <AlertDescription className="text-emerald-700 text-sm">
                  {hash === 'Transaction sent' ? (
                    <>Withdrawal {index + 1} completed</>
                  ) : (
                    <>
                      Withdraw {index + 1}:{' '}
                      <a
                        href={`https://solscan.io/tx/${hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-800 underline font-medium break-all"
                      >
                        {hash.slice(0, 20)}...
                      </a>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Processing Status */}
        {transferState.loading && (
          <Alert className="bg-blue-50 border border-blue-200 rounded-xl">
            <AlertCircle className="h-4 w-4 text-blue-500 animate-spin" />
            <AlertDescription className="text-blue-700 text-sm font-medium">
              {transferState.step === 'processing' ? 'Executing deposit & withdraw...' : 'Ready'}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={initializeEncryption}
            variant="outline"
            disabled={transferState.loading || encryptionInitialized}
            className={`flex-1 rounded-xl h-12 font-semibold transition-all duration-200 ${
              encryptionInitialized 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {encryptionInitialized ? '✓ Encrypted' : '🔐 Init Encryption'}
          </Button>
          <Button
            onClick={handleDepositAndMultiWithdraw}
            disabled={transferState.loading || !publicKey || !encryptionInitialized}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all duration-200 font-bold text-white rounded-xl h-12 text-sm"
          >
            {transferState.loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>
                Send Privately ✈️
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 p-4 rounded-xl">
          <p className="font-bold text-gray-700 mb-2.5 text-sm">How it works</p>
          <ol className="list-decimal list-inside space-y-1.5 text-gray-500 leading-relaxed">
            <li>Enter total amount to distribute</li>
            <li>Add up to 5 recipient addresses</li>
            <li>Sign with your wallet to initialize encryption</li>
            <li>Click "Send Privately" to split funds</li>
            <li>Each recipient gets an equal share — sender remains unlinkable</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
