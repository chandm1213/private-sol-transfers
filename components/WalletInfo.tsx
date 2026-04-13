'use client';
// All wallet context usage is client-only

import React, { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react'

export default function WalletInfo() {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return

      setLoading(true)
      try {
        const bal = await connection.getBalance(publicKey)
        setBalance(bal / LAMPORTS_PER_SOL)
      } catch (error) {
        console.error('Error fetching balance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 5000)
    return () => clearInterval(interval)
  }, [publicKey, connection])

  if (!connected) {
    return (
      <Card className="bg-indigo-950/50 border border-indigo-900/50 shadow-2xl backdrop-blur-lg">
        <CardHeader className="pb-6 border-b border-indigo-900/40">
          <CardTitle className="flex items-center gap-3 text-purple-400 text-xl">
            <Wallet className="w-6 h-6" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <p className="text-gray-400 text-sm">👋 Connect your wallet to begin</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-indigo-950/50 border border-indigo-900/50 shadow-2xl backdrop-blur-lg">
        <CardHeader className="pb-6 border-b border-indigo-900/40">
          <CardTitle className="flex items-center gap-3 text-purple-400 text-xl">
            <Wallet className="w-6 h-6 animate-pulse" />
            Wallet Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="group cursor-pointer hover:border-purple-800/40 border border-transparent rounded-lg p-4 transition-all duration-300">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">📍 Address</label>
            <p className="text-sm font-mono text-gray-300 break-all mt-3">
              {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey?.toBase58() || '')
                alert('✓ Address copied!')
              }}
              className="text-xs text-purple-400 hover:text-purple-300 mt-3 font-semibold transition-colors"
            >
              📋 Copy full address
            </button>
          </div>

          <div className="border-t border-indigo-900/40 pt-6">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">💰 Balance</label>
            <div className="flex items-baseline gap-3 mt-4">
              <p className="text-5xl font-bold text-white">{balance.toFixed(4)}</p>
              <span className="text-gray-400 text-lg">SOL</span>
            </div>
            {loading && <p className="text-xs text-purple-400 mt-2 animate-pulse">🔄 Updating...</p>}
          </div>

          <div className="border-t border-indigo-900/40 pt-6 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-900/10 transition-all duration-300 group cursor-pointer">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs flex-1">
                <p className="font-bold text-gray-200">Non-Custodial</p>
                <p className="text-gray-400 mt-1">Your keys stay in your wallet</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-900/10 transition-all duration-300 group cursor-pointer">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs flex-1">
                <p className="font-bold text-gray-200">Private Transactions</p>
                <p className="text-slate-400 mt-1">Zero-knowledge proofs enabled</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
