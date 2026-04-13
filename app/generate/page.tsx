
'use client';
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Copy, QrCode } from 'lucide-react';
import { generatePaymentLink, generateQRCode } from '@/lib/paymentLink';
import Link from 'next/link';

export default function GeneratePaymentLinkPage() {
  const { publicKey } = useWallet()
  const [recipientAddress, setRecipientAddress] = useState('')
  const [paymentLink, setPaymentLink] = useState<{
    url: string
    linkId: string
    key: string
  } | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerateLink = async () => {
    setError(null)
    setLoading(true)

    try {
      if (!recipientAddress.trim()) {
        throw new Error('Please enter a recipient address')
      }

      // Generate the payment link
      const link = generatePaymentLink(recipientAddress)
      setPaymentLink(link)

      // Generate QR code
      const qr = await generateQRCode(link.url)
      setQrCodeUrl(qr)

      console.log('[v0] Payment link generated:', link.linkId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link')
      console.error('[v0] Error generating link:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-teal-900/20 bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex items-center justify-between">
          <Link href="/" className="group cursor-pointer">
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent hover:from-teal-300 hover:to-cyan-300 transition-all duration-300">
              Smart Pay
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">Generate Private Payment Links</p>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-16">
        <Card className="bg-slate-900/50 border-teal-900/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-teal-300">Create a Private Payment Link</CardTitle>
            <CardDescription className="text-xs md:text-sm text-slate-400">
              Generate a link to share with friends. They can send you SOL privately without exposing your wallet address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300">
                📍 Your Solana Wallet Address
              </label>
              <Input
                placeholder="Enter your SOL wallet address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="bg-slate-800 border-teal-500/30 text-white placeholder-slate-500 text-base"
              />
              <p className="text-xs text-slate-400">
                This address will be encrypted in the link. Only the payer will see it.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-900/30 border-red-700">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateLink}
              disabled={loading || !recipientAddress.trim()}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold py-4 md:py-6 text-base md:text-lg shadow-lg shadow-teal-500/20 transition-all duration-300 disabled:opacity-50 touch-none"
            >
              {loading ? '⏳ Generating...' : '🔗 Generate Payment Link'}
            </Button>

            {/* Success & Link Display */}
            {paymentLink && (
              <div className="space-y-4">
                <Alert className="bg-teal-900/30 border-teal-700">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                  <AlertDescription className="text-teal-300">
                    ✅ Payment link created! Share it with your friends.
                  </AlertDescription>
                </Alert>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="flex flex-col items-center space-y-3 p-6 bg-slate-800/50 rounded-lg border border-teal-500/20">
                    <QrCode className="h-6 w-6 text-teal-400" />
                    <p className="text-sm text-slate-400">Scan to pay</p>
                    <img 
                      src={qrCodeUrl} 
                      alt="Payment Link QR Code"
                      className="w-48 h-48 rounded-lg border border-teal-500/30 p-2 bg-white"
                    />
                  </div>
                )}

                {/* Link Display & Copy */}
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-semibold text-slate-300">Share this link:</label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={paymentLink.url}
                      readOnly
                      className="bg-slate-800 border-teal-500/30 text-slate-300 text-xs md:text-sm break-all min-h-10 md:min-h-12"
                    />
                    <Button
                      onClick={handleCopyLink}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-3 md:px-4 whitespace-nowrap min-h-10 md:min-h-12 text-sm md:text-base touch-none"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Link Info */}
                <div className="p-4 bg-slate-800/50 rounded-lg border border-teal-500/20 space-y-2">
                  <p className="text-sm text-slate-300">
                    <strong>Link ID:</strong> <code className="text-teal-300">{paymentLink.linkId}</code>
                  </p>
                  <p className="text-xs text-slate-400">
                    💡 This link can be shared publicly. Your wallet address is encrypted and safe.
                  </p>
                  <p className="text-xs text-slate-400">
                    🔒 No server storage. Everything stays between you and the payer.
                  </p>
                </div>

                {/* Usage Info */}
                <div className="p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/20">
                  <p className="text-sm text-cyan-300 font-semibold mb-2">How it works:</p>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                    <li>Friend clicks the link or scans QR code</li>
                    <li>They enter the amount they want to send</li>
                    <li>SOL gets deposited into privacy pool</li>
                    <li>SOL is withdrawn to your wallet (unlinkable)</li>
                    <li>Complete privacy - no connection between sender and you</li>
                  </ol>
                </div>

                {/* Back to Home */}
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-teal-500/30 text-teal-300 hover:bg-teal-500/10"
                >
                  <Link href="/">← Back to Smart Pay</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


