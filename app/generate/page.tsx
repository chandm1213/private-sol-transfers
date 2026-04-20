
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
    <div className="min-h-screen bg-[#f7faf7] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-200 bg-white/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.03em] text-gray-950">
                Smart Pay
              </h1>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Generate Private Payment Links</p>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-sm text-gray-500">
              <Link href="/" className="transition-colors hover:text-gray-900">Home</Link>
              <Link href="/docs" className="transition-colors hover:text-gray-900">Docs</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8 md:py-16">
        <Card className="bg-white border border-gray-200 shadow-xl rounded-[28px] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-gray-950">Create a Private Payment Link</CardTitle>
            <CardDescription className="text-xs md:text-sm text-gray-500">
              Generate a link to share with friends. They can send you SOL privately without exposing your wallet address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Section */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">
                📍 Your Solana Wallet Address
              </label>
              <Input
                placeholder="Enter your SOL wallet address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 text-base rounded-xl"
              />
              <p className="text-xs text-gray-500">
                This address will be encrypted in the link. Only the payer will see it.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateLink}
              disabled={loading || !recipientAddress.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 md:py-6 text-base md:text-lg shadow-lg shadow-emerald-100 transition-all duration-300 disabled:opacity-50 touch-none rounded-xl"
            >
              {loading ? '⏳ Generating...' : '🔗 Generate Payment Link'}
            </Button>

            {/* Success & Link Display */}
            {paymentLink && (
              <div className="space-y-4">
                <Alert className="bg-emerald-50 border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <AlertDescription className="text-emerald-700">
                    ✅ Payment link created! Share it with your friends.
                  </AlertDescription>
                </Alert>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="flex flex-col items-center space-y-3 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <QrCode className="h-6 w-6 text-emerald-600" />
                    <p className="text-sm text-gray-500">Scan to pay</p>
                    <img 
                      src={qrCodeUrl} 
                      alt="Payment Link QR Code"
                      className="w-48 h-48 rounded-lg border border-gray-200 p-2 bg-white"
                    />
                  </div>
                )}

                {/* Link Display & Copy */}
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-semibold text-gray-700">Share this link:</label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={paymentLink.url}
                      readOnly
                      className="bg-gray-50 border-gray-200 text-gray-700 text-xs md:text-sm break-all min-h-10 md:min-h-12 rounded-xl"
                    />
                    <Button
                      onClick={handleCopyLink}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-4 whitespace-nowrap min-h-10 md:min-h-12 text-sm md:text-base touch-none rounded-xl"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Link Info */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <p className="text-sm text-gray-700">
                    <strong>Link ID:</strong> <code className="text-emerald-700">{paymentLink.linkId}</code>
                  </p>
                  <p className="text-xs text-gray-500">
                    💡 This link can be shared publicly. Your wallet address is encrypted and safe.
                  </p>
                  <p className="text-xs text-gray-500">
                    🔒 No server storage. Everything stays between you and the payer.
                  </p>
                </div>

                {/* Usage Info */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-700 font-semibold mb-2">How it works:</p>
                  <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
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
                  className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
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


