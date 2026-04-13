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
    <Card className={`bg-indigo-950/50 border border-indigo-900/50 shadow-2xl backdrop-blur-lg`}>
      <CardHeader className="pb-6 border-b border-indigo-900/40">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl text-blue-400">
              {isPaymentLink ? 'Send Private Payment' : 'Private Transfer'}
            </CardTitle>
            <CardDescription className="text-gray-400 mt-3 space-y-1 text-sm">
              {isPaymentLink 
                ? 'Your wallet will remain private and unlinkable to the recipient'
                : (
                  <>
                    <p className="font-semibold text-gray-300">Introducing Multi Send.</p>
                    <p className="text-gray-400">Split funds and privately send to up to 5 recipients in one go.</p>
                    <p className="text-gray-400">Private, and now more convenient.</p>
                  </>
                )}
            </CardDescription>
          </div>
          <div className="text-4xl animate-bounce">🔒</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Amount Input */}
        <div className="space-y-2 group">
          <label className="text-sm font-semibold text-white block">
            Amount (SOL)
          </label>
          <Input
            type="number"
            placeholder="0.5"
            value={transferState.amount}
            onChange={(e) => setTransferState((prev) => ({ ...prev, amount: e.target.value }))}
            className="bg-indigo-900/40 border border-indigo-800/60 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-300"
            disabled={transferState.loading}
            step="0.1"
            min="0"
          />
          <p className="text-xs text-gray-500">This amount will be split and sent to all recipients</p>
        </div>

        {/* Recipient Addresses - Hidden for payment links */}
        {!isPaymentLink && (
          <div className="space-y-3 group">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white">
                Recipient Addresses
              </label>
              <span className="text-xs text-gray-500">
                {transferState.recipients.filter(r => r.address.trim()).length} of {transferState.recipients.length} recipients
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {transferState.recipients.map((recipient, index) => (
                <div key={recipient.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Input
                      type="text"
                      placeholder={`Recipient ${index + 1} (SOL address)`}
                      value={recipient.address}
                      onChange={(e) => updateRecipient(recipient.id, e.target.value)}
                      className="bg-indigo-900/40 border border-indigo-800/60 text-white placeholder:text-gray-500 text-xs focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-300"
                      disabled={transferState.loading}
                    />
                    {transferState.amount && parseFloat(transferState.amount) > 0 && (
                      <p className="text-xs text-blue-400">
                        ~{(parseFloat(transferState.amount) / transferState.recipients.length).toFixed(4)} SOL per recipient
                      </p>
                    )}
                  </div>
                  {transferState.recipients.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(recipient.id)}
                      disabled={transferState.loading}
                      className="mt-1 h-10 px-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
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
                className="w-full bg-white text-purple-600 hover:bg-slate-100 transition-all duration-300 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            )}
            <p className="text-xs text-gray-500">
              Each recipient will receive an equal share of the total amount
            </p>
          </div>
        )}

        {/* Encryption Alert */}
        {!encryptionInitialized && (
          <Alert className="bg-purple-950/50 border-purple-800/40 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-purple-400" />
            <AlertDescription className="text-gray-300 ml-2">
              🔑 Initialize your encryption key first by signing a message with your wallet.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {transferState.error && (
          <Alert className="bg-red-950/30 border-red-800/50">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <div className="font-semibold">Error:</div>
              <div className="text-sm mt-1">{transferState.error}</div>
              {transferState.error.includes('Insufficient balance') && (
                <div className="text-xs mt-2 text-red-200">
                  💡 Tip: Make sure your wallet has enough SOL for the deposit amount + transaction fees
                </div>
              )}
              {transferState.error.includes('expired') && (
                <div className="text-xs mt-2 text-red-200">
                  💡 Tip: The Privacy Cash relayer took too long. Try again with a smaller amount or wait a moment before retrying.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alerts */}
        {(transferState.depositTxHash || transferState.withdrawTxHashes?.length) && (
          <Alert className="bg-purple-950/40 border-purple-800/50">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            <AlertDescription className="text-slate-200">
              ✅ Private multi-transfer complete! Check transaction hashes below.
            </AlertDescription>
          </Alert>
        )}

        {transferState.depositTxHash && (
          <Alert className="bg-emerald-950/30 border-emerald-800/50">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300">
              {transferState.depositTxHash === 'Transaction sent' ? (
                <>✅ Deposit sent to shielded pool</>
              ) : (
                <>
                  ✅ Deposit TX:{' '}
                  <a
                    href={`https://solscan.io/tx/${transferState.depositTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-200 hover:text-emerald-100 underline break-all"
                  >
                    {transferState.depositTxHash.slice(0, 16)}...
                  </a>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {transferState.withdrawTxHashes && transferState.withdrawTxHashes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-300">Withdrawal Transactions:</p>
            {transferState.withdrawTxHashes.map((hash, index) => (
              <Alert key={index} className="bg-emerald-950/20 border-emerald-800/40">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <AlertDescription className="text-emerald-300">
                  {hash === 'Transaction sent' ? (
                    <>✅ Withdrawal {index + 1} completed - SOL sent to recipient</>
                  ) : (
                    <>
                      ✅ Withdraw TX {index + 1}:{' '}
                      <a
                        href={`https://solscan.io/tx/${hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-200 hover:text-emerald-100 underline break-all"
                      >
                        {hash.slice(0, 16)}...
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
          <Alert className="bg-purple-950/40 border-purple-800/50">
            <AlertCircle className="h-4 w-4 text-purple-400 animate-spin" />
            <AlertDescription className="text-slate-300">
              Processing: {transferState.step === 'processing' ? 'Executing deposit & withdraw...' : 'Ready'}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={initializeEncryption}
            variant="outline"
            disabled={transferState.loading || encryptionInitialized}
            className="flex-1 bg-indigo-900/60 border-indigo-800/60 text-gray-300 hover:bg-indigo-800/60 hover:text-gray-200 hover:border-indigo-700/80 transition-all duration-300"
          >
            🔐 Initialize Encryption
          </Button>
          <Button
            onClick={handleDepositAndMultiWithdraw}
            disabled={transferState.loading || !publicKey || !encryptionInitialized}
            className="flex-1 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/40 transition-all duration-300 font-semibold text-white"
          >
            {transferState.loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>
                ✈️ Deposit & Withdraw
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="text-xs text-gray-400 bg-indigo-900/30 border border-indigo-800/40 p-4 rounded-lg backdrop-blur-sm">
          <p className="font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span>💡</span> How it works:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>Enter total amount to distribute</li>
            <li>Add up to 5 recipient addresses</li>
            <li>Sign with your wallet to initialize encryption</li>
            <li>Click "Deposit & Withdraw" to split funds and send privately</li>
            <li>Each recipient gets an equal share - sender remains unlinkable</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
