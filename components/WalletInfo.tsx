'use client';

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
      <Card className="bg-gradient-to-br from-black via-black to-slate-900/20 border-teal-900/30 shadow-2xl shadow-teal-500/10 backdrop-blur-xl">
        <CardHeader className="pb-6 border-b border-teal-900/20">
          <CardTitle className="flex items-center gap-3 text-teal-400 text-2xl">
            <Wallet className="w-6 h-6" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <p className="text-slate-400 text-sm hover:text-slate-300 transition-colors">👋 Connect your wallet to begin</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-black via-black to-slate-900/20 border-teal-900/30 shadow-2xl shadow-teal-500/10 backdrop-blur-xl">
        <CardHeader className="pb-6 border-b border-teal-900/20">
          <CardTitle className="flex items-center gap-3 text-teal-400 text-2xl">
            <Wallet className="w-6 h-6 animate-pulse" />
            Wallet Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="group cursor-pointer hover:border-teal-900/50 border border-transparent rounded-lg p-4 transition-all duration-300 hover:bg-teal-900/10">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide group-hover:text-teal-300 transition-colors">📍 Address</label>
            <p className="text-sm font-mono text-slate-200 break-all mt-3 group-hover:text-slate-100 transition-colors">
              {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey?.toBase58() || '')
                alert('✓ Address copied!')
              }}
              className="text-xs text-teal-400 hover:text-teal-300 mt-3 font-semibold transition-colors"
            >
              📋 Copy full address
            </button>
          </div>

          <div className="border-t border-teal-900/20 pt-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">💰 Balance</label>
            <div className="flex items-baseline gap-3 mt-4">
              <p className="text-5xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">{balance.toFixed(4)}</p>
              <span className="text-slate-400 text-lg">SOL</span>
            </div>
            {loading && <p className="text-xs text-teal-500 mt-2 animate-pulse">🔄 Updating...</p>}
          </div>

          <div className="border-t border-teal-900/20 pt-6 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-teal-900/10 transition-all duration-300 group cursor-pointer">
              <CheckCircle2 className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="text-xs flex-1">
                <p className="font-bold text-slate-200 group-hover:text-teal-300 transition-colors">Non-Custodial</p>
                <p className="text-slate-400 mt-1">Your keys stay in your wallet</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-teal-900/10 transition-all duration-300 group cursor-pointer">
              <CheckCircle2 className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="text-xs flex-1">
                <p className="font-bold text-slate-200 group-hover:text-teal-300 transition-colors">Private Transactions</p>
                <p className="text-slate-400 mt-1">Zero-knowledge proofs enabled</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
