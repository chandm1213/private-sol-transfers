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
            <div className="min-h-screen bg-[#f7faf7] relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_60%)]" />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-gray-200 bg-white/85 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
            <Link href="/" className="flex flex-col">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-gray-950">
                Smart Pay
              </h1>
              <p className="text-sm text-gray-400 mt-1">Private Payment Link</p>
            </Link>
            <div className="ml-4">
              <WalletMultiButton className="!bg-gray-900 hover:!bg-gray-800 !shadow-md !rounded-xl transition-all duration-300" />
            </div>
          </div>
        </header>

        {/* Error Content */}
        <main className="relative z-10 max-w-2xl mx-auto px-4 py-16">
          <Card className="bg-white border border-red-200 shadow-xl rounded-[28px]">
            <CardContent className="pt-6">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-700">
                  {paymentState.error || 'Loading payment link...'}
                </AlertDescription>
              </Alert>
              <Button
                asChild
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
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
          <div className="min-h-screen bg-[#f7faf7] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-200 bg-white/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex flex-col">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-gray-950">
                Smart Pay
              </h1>
              <p className="text-sm text-gray-400 mt-1">Private Payment Link</p>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-sm text-gray-500">
              <Link href="/" className="transition-colors hover:text-gray-900">Home</Link>
              <Link href="/docs" className="transition-colors hover:text-gray-900">Docs</Link>
            </nav>
          </div>
          <div className="ml-4">
            <WalletMultiButton className="!bg-gray-900 hover:!bg-gray-800 !shadow-md !rounded-xl transition-all duration-300" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        {/* Payment Transfer Form - Centered */}
        <div>
          <PrivateTransferForm
            recipientAddress={paymentState.recipientAddress || ''}
            isPaymentLink={true}
          />
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-200 bg-white/70 backdrop-blur-xl mt-20 py-12">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>
              Private payments powered by{' '}
              <a
                href="https://privacy.cash"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
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
