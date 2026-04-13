
'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
const PrivateTransferForm = dynamic(() => import('@/components/PrivateTransferForm'), { ssr: false });
const WalletInfo = dynamic(() => import('@/components/WalletInfo'), { ssr: false });
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import '@solana/wallet-adapter-react-ui/styles.css';


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
          <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/60 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-gray-200 bg-white/80 backdrop-blur-xl shadow-sm">
              <div className="max-w-6xl mx-auto px-4 py-5 md:py-6 flex items-center justify-between gap-4">
                <div className="group cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
                      <span className="text-white text-lg font-bold">S</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Smart Pay
                    </h1>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-[46px] font-medium tracking-wide uppercase">Private SOL Transfers</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-100 transition-all duration-200 w-full md:w-auto rounded-xl"
                  >
                    <Link href="/generate">🔗 Payment Links</Link>
                  </Button>
                  <WalletMultiButton className="!bg-gray-900 hover:!bg-gray-800 !shadow-md !rounded-xl transition-all duration-200 w-full md:w-auto" />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-14">
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
            <footer className="relative z-10 border-t border-gray-200 bg-white/60 backdrop-blur-lg mt-20 py-10">
              <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
                <p>
                  Smart Pay enables private SOL transfers using{' '}
                  <a
                    href="https://privacy.cash"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                  >
                    Privacy Cash SDK
                  </a>
                </p>
                <div className="mt-4 flex items-center justify-center gap-6 text-xs font-medium text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Non-custodial</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Zero-knowledge</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Unlinkable</span>
                </div>
              </div>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
