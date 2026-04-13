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
      <Card className="bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-5 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-gray-800 text-lg font-extrabold">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-gray-500" />
            </div>
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Connect your wallet to begin</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
          <CardTitle className="flex items-center gap-3 text-gray-800 text-lg font-extrabold">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            Wallet Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5 pb-6">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</label>
            <p className="text-sm font-mono text-gray-800 break-all mt-2 leading-relaxed">
              {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicKey?.toBase58() || '')
                alert('✓ Address copied!')
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 mt-2.5 font-semibold transition-colors"
            >
              📋 Copy full address
            </button>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance</label>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-4xl font-extrabold text-gray-900">{balance.toFixed(4)}</p>
              <span className="text-gray-400 text-sm font-semibold">SOL</span>
            </div>
            {loading && <p className="text-xs text-emerald-600 mt-2 animate-pulse font-medium">Updating...</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs flex-1">
                <p className="font-bold text-gray-700">Non-Custodial</p>
                <p className="text-gray-500 mt-0.5">Your keys stay in your wallet</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs flex-1">
                <p className="font-bold text-gray-700">Private Transactions</p>
                <p className="text-gray-500 mt-0.5">Zero-knowledge proofs enabled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
