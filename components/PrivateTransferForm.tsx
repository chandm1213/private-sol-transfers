'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle2, Lock, Unlock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getSignedSignature, type Signed } from '@/lib/signature'

interface TransferState {
  amount: string
  recipient: string
  loading: boolean
  depositTxHash?: string
  withdrawTxHash?: string
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
    recipient: recipientAddress,
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
        recipient: recipientAddress,
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

  // Handle combined deposit + withdraw in one transaction
  const handleDepositAndWithdraw = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      alert('Please connect your wallet first')
      return
    }

    if (!transferState.amount || parseFloat(transferState.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!transferState.recipient) {
      alert('Please enter a recipient address')
      return
    }

    try {
      new PublicKey(transferState.recipient)
    } catch {
      alert('Invalid recipient address')
      return
    }

    if (!encryptionService) {
      alert('Please initialize encryption first')
      return
    }

    setTransferState((prev) => ({ ...prev, loading: true, error: undefined, step: 'processing' }))

    try {
      console.log('[v0] Starting combined deposit & withdraw...')

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

      // Step 2: Withdraw to recipient
      console.log('[v0] Step 2: Withdrawing to recipient...')
      const withdrawTxs = await withdraw({
        amount_in_lamports: amount,
        connection,
        encryptionService,
        keyBasePath: '/circuit2/transaction2',
        publicKey,
        storage: localStorage,
        recipient: transferState.recipient,
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
      console.log('[v0] Withdrawal successful:', withdrawTxHash)

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

      const depositHashStr = getTxHashString(depositTxHash)
      const withdrawHashStr = getTxHashString(withdrawTxHash)

      console.log('[v0] Extracted hashes - Deposit:', depositHashStr, 'Withdraw:', withdrawHashStr)

      setTransferState((prev) => ({
        ...prev,
        loading: false,
        step: 'form',
        depositTxHash: depositHashStr,
        withdrawTxHash: withdrawHashStr,
        amount: '',
        recipient: '',
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

  return (
    <Card className={`${isPaymentLink ? 'bg-slate-900/50' : 'bg-gradient-to-br from-black via-black to-slate-900/20'} border-teal-900/30 shadow-2xl shadow-teal-500/10 backdrop-blur-xl`}>
      <CardHeader className="pb-8 border-b border-teal-900/20">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-3xl bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              {isPaymentLink ? 'Send Private Payment' : 'Private SOL Transfer'}
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              {isPaymentLink 
                ? 'Your wallet will remain private and unlinkable to the recipient'
                : 'Deposit and instantly withdraw to any address in one private transaction'}
            </CardDescription>
          </div>
          <div className="text-4xl animate-bounce">🔒</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-8">
        {/* Amount Input */}
        <div className="space-y-3 group">
          <label className="text-sm font-semibold text-slate-300 block group-hover:text-teal-300 transition-colors">
            💰 Amount (SOL)
          </label>
          <Input
            type="number"
            placeholder="0.5"
            value={transferState.amount}
            onChange={(e) => setTransferState((prev) => ({ ...prev, amount: e.target.value }))}
            className="bg-slate-950/50 border-teal-900/30 text-white placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-300 hover:border-teal-900/50"
            disabled={transferState.loading}
            step="0.1"
            min="0"
          />
          <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">This amount will be deposited to shielded pool and withdrawn to recipient</p>
        </div>

        {/* Recipient Address Input - Hidden for payment links */}
        {!isPaymentLink && (
          <div className="space-y-3 group">
            <label className="text-sm font-semibold text-slate-300 block group-hover:text-teal-300 transition-colors">
              👤 Recipient Address
            </label>
            <Input
              type="text"
              placeholder="SOL address (e.g., 9B5X...)"
              value={transferState.recipient}
              onChange={(e) => setTransferState((prev) => ({ ...prev, recipient: e.target.value }))}
              className="bg-slate-950/50 border-teal-900/30 text-white placeholder:text-slate-600 text-xs focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-300 hover:border-teal-900/50"
              disabled={transferState.loading}
            />
            <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">This address will receive the withdrawn SOL</p>
          </div>
        )}

        {/* Encryption Alert */}
        {!encryptionInitialized && (
          <Alert className="bg-teal-900/20 border-teal-800/50 backdrop-blur-sm hover:bg-teal-900/30 transition-colors">
            <AlertCircle className="h-4 w-4 text-teal-400 animate-pulse" />
            <AlertDescription className="text-teal-300 ml-2">
              🔑 Initialize your encryption key first by signing a message with your wallet.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {transferState.error && (
          <Alert className="bg-red-900/30 border-red-700">
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
        {(transferState.depositTxHash || transferState.withdrawTxHash) && (
          <Alert className="bg-teal-900/30 border-teal-700">
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
            <AlertDescription className="text-teal-300">
              ✅ Private transfer complete! Check transaction hashes below.
            </AlertDescription>
          </Alert>
        )}

        {transferState.depositTxHash && (
          <Alert className="bg-green-900/30 border-green-700">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              {transferState.depositTxHash === 'Transaction sent' ? (
                <>✅ Deposit sent to shielded pool</>
              ) : (
                <>
                  ✅ Deposit TX:{' '}
                  <a
                    href={`https://solscan.io/tx/${transferState.depositTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-200 hover:text-green-100 underline break-all"
                  >
                    {transferState.depositTxHash.slice(0, 16)}...
                  </a>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {transferState.withdrawTxHash && (
          <Alert className="bg-green-900/30 border-green-700">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              {transferState.withdrawTxHash === 'Transaction sent' ? (
                <>✅ Withdrawal completed - SOL sent to recipient</>
              ) : (
                <>
                  ✅ Withdraw TX:{' '}
                  <a
                    href={`https://solscan.io/tx/${transferState.withdrawTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-200 hover:text-green-100 underline break-all"
                  >
                    {transferState.withdrawTxHash.slice(0, 16)}...
                  </a>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Processing Status */}
        {transferState.loading && (
          <Alert className="bg-teal-900/20 border-teal-800/50">
            <AlertCircle className="h-4 w-4 text-teal-400 animate-spin" />
            <AlertDescription className="text-teal-300">
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
            className="flex-1 bg-slate-900/50 border-teal-900/30 text-teal-400 hover:bg-slate-800/50 hover:text-teal-300 hover:border-teal-900/50 transition-all duration-300 shadow-lg hover:shadow-teal-500/10"
          >
            🔐 Initialize Encryption
          </Button>
          <Button
            onClick={handleDepositAndWithdraw}
            disabled={transferState.loading || !publicKey || !encryptionInitialized}
            className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all duration-300 font-semibold"
          >
            {transferState.loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processing...
              </>
            ) : (
              <>
                ✈️ Send Privately
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="text-xs text-slate-400 bg-gradient-to-br from-slate-900/50 to-teal-900/10 border border-teal-900/20 p-5 rounded-lg backdrop-blur-sm hover:border-teal-900/40 transition-all duration-300">
          <p className="font-semibold text-teal-400 mb-3 flex items-center gap-2">
            <span>💡</span> How it works:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-400 hover:text-slate-300 transition-colors">
            <li>Enter amount and recipient address</li>
            <li>Sign with your wallet to initialize encryption</li>
            <li>Click "Send Privately" to deposit & withdraw in one transaction</li>
            <li>SOL arrives at recipient - sender remains unlinkable</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
