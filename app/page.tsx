'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import WalletInfo from '@/components/WalletInfo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import '@solana/wallet-adapter-react-ui/styles.css'

// Dynamically import PrivateTransferForm to avoid bundling WASM modules at build time
const PrivateTransferForm = dynamic(() => import('@/components/PrivateTransferForm'), {
  loading: () => <div className="h-96 bg-slate-800/50 border border-slate-700 rounded-lg animate-pulse" />,
  ssr: false,
})

export default function Page() {
  const network = 'mainnet-beta'
  // Using Helius RPC endpoint for reliable mainnet access
  const endpoint = 'https://mainnet.helius-rpc.com/?api-key=59f7f4c5-24e2-4ecd-a46e-9bcccda806d6'
  // Only include Phantom and Solflare to avoid wallet duplication
  const wallets = React.useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-teal-900/20 bg-black/40 backdrop-blur-xl">
              <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex items-center justify-between gap-4">
                <div className="group cursor-pointer">
                  <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent hover:from-teal-300 hover:to-cyan-300 transition-all duration-300">
                    PrivatePay
                  </h1>
                  <p className="text-sm text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">Private SOL Transfers on Solana</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all duration-300 w-full md:w-auto"
                  >
                    <Link href="/generate">🔗 Payment Links</Link>
                  </Button>
                  <WalletMultiButton className="!bg-gradient-to-r !from-teal-600 !to-cyan-600 hover:!from-teal-500 hover:!to-cyan-500 !shadow-lg !shadow-teal-500/20 transition-all duration-300 w-full md:w-auto" />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column - Transfer Form */}
                <div className="lg:col-span-2">
                  <PrivateTransferForm />
                </div>

                {/* Right Column - Wallet Info */}
                <div>
                  <WalletInfo />
                </div>
              </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-teal-900/20 bg-black/40 backdrop-blur-xl mt-20 py-12">
              <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
                <p className="hover:text-slate-300 transition-colors">
                  PrivatePay enables private SOL transfers using{' '}
                  <a
                    href="https://privacy.cash"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
                  >
                    Privacy Cash SDK
                  </a>
                </p>
                <p className="mt-3 space-x-3">
                  <span className="inline-block hover:text-slate-300 transition-colors">✓ Non-custodial</span>
                  <span className="inline-block hover:text-slate-300 transition-colors">✓ Zero-knowledge</span>
                  <span className="inline-block hover:text-slate-300 transition-colors">✓ Unlinkable</span>
                </p>
              </div>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
