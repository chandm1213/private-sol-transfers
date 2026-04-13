"use client";

import React, { useState, useEffect } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import '@solana/wallet-adapter-react-ui/styles.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock } from 'lucide-react'
import { extractPaymentLinkParams, decryptRecipientAddress } from '@/lib/paymentLink'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import PrivateTransferForm to avoid WASM bundling at build time
const PrivateTransferForm = dynamic(() => import('@/components/PrivateTransferForm'), { ssr: false })

interface PaymentState {
  amount: string
  recipientAddress: string | null
  linkId: string | null
  loading: boolean
  error: string | null
  decrypted: boolean
}

export default function PaymentLinkContent() {
  const searchParams = useSearchParams()
  // Wallet context removed from SSR
  const [paymentState, setPaymentState] = useState<PaymentState>({
    amount: '',
    recipientAddress: null,
    linkId: null,
    loading: false,
    error: null,
    decrypted: false,
  })

  // Wallet providers for the standalone payment link page
  const network = 'mainnet-beta'
  const endpoint = 'https://mainnet.helius-rpc.com/?api-key=59f7f4c5-24e2-4ecd-a46e-9bcccda806d6'
  const wallets = React.useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])

  // Decrypt recipient from URL on mount
  useEffect(() => {
    const params = extractPaymentLinkParams(searchParams)

    if (!params) {
      setPaymentState((prev) => ({
        ...prev,
        error: 'Invalid payment link. Missing parameters.',
      }))
      return
    }

    try {
      const recipientAddress = decryptRecipientAddress(params.data, params.key)
      setPaymentState((prev) => ({
        ...prev,
        recipientAddress,
        linkId: params.id,
        decrypted: true,
        error: null,
      }))
      console.log('[v0] Payment link decrypted successfully')
    } catch (err) {
      setPaymentState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to decrypt payment link',
        decrypted: false,
      }))
      console.error('[v0] Decryption error:', err)
    }
  }, [searchParams])

  if (!paymentState.decrypted) {
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-teal-900/20 bg-black/40 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
            <Link href="/" className="group cursor-pointer">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent hover:from-teal-300 hover:to-cyan-300 transition-all duration-300">
                Smart Pay
              </h1>
              <p className="text-sm text-slate-400 mt-1">Private Payment Link</p>
            </Link>
            <div className="ml-4">
              <WalletMultiButton className="!bg-gradient-to-r !from-teal-600 !to-cyan-600 hover:!from-teal-500 hover:!to-cyan-500 !shadow-lg !shadow-teal-500/20 transition-all duration-300" />
            </div>
          </div>
        </header>

        {/* Error Content */}
        <main className="relative z-10 max-w-2xl mx-auto px-4 py-16">
          <Card className="bg-slate-900/50 border-red-900/30 backdrop-blur-xl">
            <CardContent className="pt-6">
              <Alert className="bg-red-900/30 border-red-700">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {paymentState.error || 'Loading payment link...'}
                </AlertDescription>
              </Alert>
              <Button
                asChild
                className="w-full mt-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
              >
                <Link href="/">← Back to Smart Pay</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    )
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-teal-900/20 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
          <Link href="/" className="group cursor-pointer">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent hover:from-teal-300 hover:to-cyan-300 transition-all duration-300">
              Smart Pay
            </h1>
            <p className="text-sm text-slate-400 mt-1">Private Payment Link</p>
          </Link>
          <div className="ml-4">
            <WalletMultiButton className="!bg-gradient-to-r !from-teal-600 !to-cyan-600 hover:!from-teal-500 hover:!to-cyan-500 !shadow-lg !shadow-teal-500/20 transition-all duration-300" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        {/* Payment Transfer Form - Centered */}
        <div className="transform hover:scale-105 transition-transform duration-300">
          <PrivateTransferForm
            recipientAddress={paymentState.recipientAddress || ''}
            isPaymentLink={true}
          />
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-teal-900/20 bg-black/40 backdrop-blur-xl mt-20 py-12">
          <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
            <p className="hover:text-slate-300 transition-colors">
              Private payments powered by{' '}
              <a
                href="https://privacy.cash"
                target="_blank"
                rel="noreferrer"
                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                Privacy Cash SDK
              </a>
            </p>
            <p className="mt-3">🔒 No server storage • 💯 100% private • ⚡ Non-custodial</p>
          </div>
        </footer>
          </main>
        </div>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
  )
}
