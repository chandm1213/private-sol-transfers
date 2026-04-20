
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
          <div className="min-h-screen bg-[#f7faf7] relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_60%)]" />
              <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-gray-200 bg-white/85 backdrop-blur-xl shadow-sm">
              <div className="max-w-6xl mx-auto px-4 py-5 md:py-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex flex-col">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.03em] text-gray-950">
                      Smart Pay
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 font-medium tracking-[0.24em] uppercase">Private SOL Transfers</p>
                  </Link>
                  <nav className="hidden md:flex items-center gap-5 text-sm text-gray-500">
                    <Link href="/" className="transition-colors hover:text-gray-900">Home</Link>
                    <Link href="/docs" className="transition-colors hover:text-gray-900">Docs</Link>
                    <Link href="/generate" className="transition-colors hover:text-gray-900">Payment Links</Link>
                  </nav>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-100 transition-all duration-200 w-full md:w-auto rounded-xl"
                  >
                    <Link href="/generate">🔗 Payment Links</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 w-full md:w-auto rounded-xl"
                  >
                    <Link href="/docs">Docs</Link>
                  </Button>
                  <WalletMultiButton className="!bg-gray-900 hover:!bg-gray-800 !shadow-md !rounded-xl transition-all duration-200 w-full md:w-auto" />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-14">
              <section className="mb-8 rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-sm md:px-8 md:py-10">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    Private payments on Solana
                  </div>
                  <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-gray-950">
                    A cleaner way to send SOL privately.
                  </h2>
                  <p className="mt-4 text-base md:text-lg leading-7 text-gray-600">
                    Smart Pay combines wallet-based encryption, private transfers, multi-send, and payment links into one simple Solana experience designed for real users.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-semibold">
                      <Link href="/docs">Read Documentation</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50">
                      <Link href="/generate">Create Payment Link</Link>
                    </Button>
                  </div>
                </div>
              </section>

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

              <section className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">Docs</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">Read the product overview, privacy model, quick start steps, and roadmap.</p>
                  <Link href="/docs" className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800">Open docs →</Link>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">Launch utilities</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">Private send, multi-send, payment links, wallet-based encryption, and mainnet Solana support.</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">Built for simplicity</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">Professional, clean flows designed to keep privacy features understandable for normal users.</p>
                </div>
              </section>
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
