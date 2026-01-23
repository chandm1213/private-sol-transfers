import React, { useState, useCallback, useEffect } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import PrivateTransferForm from './components/PrivateTransferForm'
import WalletInfo from './components/WalletInfo'
import '@solana/wallet-adapter-react-ui/styles.css'

function App() {
  const network = 'mainnet-beta'
  const endpoint = clusterApiUrl(network)
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()]

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
              <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    PrivatePay
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">Private SOL Transfers on Solana</p>
                </div>
                <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700" />
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
            <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-20 py-8">
              <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
                <p>
                  PrivatePay enables private SOL transfers using{' '}
                  <a
                    href="https://privacy.cash"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Privacy Cash SDK
                  </a>
                </p>
                <p className="mt-2">Non-custodial • Zero-knowledge • Sender & Recipient Unlinkable</p>
              </div>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
