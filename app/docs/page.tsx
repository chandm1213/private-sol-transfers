import Link from 'next/link'
import { BookOpen, Lock, Send, Link2, ShieldCheck, ArrowRight } from 'lucide-react'

const launchFeatures = [
  {
    title: 'Private Send',
    description: 'Send SOL with sender privacy preserved through shielded deposit and withdrawal flows.',
  },
  {
    title: 'Multi Send',
    description: 'Split one amount across up to 5 recipients and keep transfers unlinkable.',
  },
  {
    title: 'Payment Links',
    description: 'Create shareable links so anyone can send you SOL privately without seeing your wallet in plain text.',
  },
  {
    title: 'Wallet-based Encryption',
    description: 'Initialize encryption from your wallet signature without creating extra passwords or accounts.',
  },
]

const roadmap = [
  {
    phase: 'Coming Soon',
    items: 'Private SPL token transfers, address book support, encrypted local transaction history, QR code payments, and a more polished mobile flow.',
  },
  {
    phase: 'Planned Updates',
    items: 'Recurring private payments, multi-token multi-send, stealth addresses, webhook notifications, and an SDK/API for dApp integrations.',
  },
  {
    phase: 'Future Vision',
    items: 'Private NFT transfers, optional compliance view keys, and privacy-native DAO payment tooling.',
  },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7] text-gray-900">
      <div className="border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <Link href="/" className="flex flex-col">
            <span className="text-xl font-semibold tracking-[-0.02em] text-gray-950">Smart Pay</span>
            <span className="text-xs font-medium uppercase tracking-[0.24em] text-gray-400">Documentation</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-gray-500 transition-colors hover:text-gray-900">Home</Link>
            <Link href="/generate" className="text-gray-500 transition-colors hover:text-gray-900">Payment Links</Link>
            <Link href="/docs" className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">Docs</Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <section className="rounded-[28px] border border-gray-200 bg-white px-6 py-8 shadow-sm md:px-10 md:py-12">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              <BookOpen className="h-4 w-4" />
              Smart Pay Docs
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-gray-950 md:text-5xl">
              Private SOL transfers with a cleaner, simpler user flow.
            </h1>
            <p className="text-base leading-7 text-gray-600 md:text-lg">
              Smart Pay helps users send SOL privately on Solana using wallet-based encryption and shielded transfer flows powered by Privacy Cash. The app is non-custodial, direct, and built for private transfers without adding account friction.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                Open App
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/generate" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                Create Payment Link
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <Lock className="h-5 w-5 text-emerald-600" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">How privacy works</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">Funds are deposited into a shielded pool and later withdrawn privately, reducing the on-chain link between sender and recipient.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <Send className="h-5 w-5 text-emerald-600" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Launch features</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">Single private sends, multi-send, payment links, Solana wallet support, and signature-derived encryption are ready now.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Non-custodial by default</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">Users stay in control of their wallet. Smart Pay does not take custody of keys or require a separate account system.</p>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-gray-950">Ready at launch</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {launchFeatures.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-gray-950">Quick start</h2>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-gray-600">
              <li><span className="font-semibold text-gray-900">1.</span> Connect Phantom or Solflare.</li>
              <li><span className="font-semibold text-gray-900">2.</span> Initialize encryption by signing once with your wallet.</li>
              <li><span className="font-semibold text-gray-900">3.</span> Enter an amount and one or more recipients.</li>
              <li><span className="font-semibold text-gray-900">4.</span> Submit the private transfer and monitor the transaction hashes.</li>
            </ol>
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              Payment links follow the same private flow, but let the payer initiate the transfer from a shareable URL.
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[24px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Link2 className="h-4 w-4" />
            Roadmap
          </div>
          <div className="mt-5 space-y-5">
            {roadmap.map((entry) => (
              <div key={entry.phase} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <h3 className="text-base font-semibold text-gray-900">{entry.phase}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{entry.items}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}