# PrivatePay: Copilot Instructions

## Project Overview
PrivatePay is a Next.js-based web application enabling private SOL transfers on Solana using Privacy Cash SDK. It combines zero-knowledge cryptography with Solana wallet integration for non-custodial, unlinkable transactions.

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS + Radix UI + Solana Web3.js

## Critical Architecture Patterns

### WASM Module Handling
- **Problem:** Privacy Cash SDK and @lightprotocol/hasher.rs use WASM modules that cause issues in SSR contexts
- **Solution:** Dynamic imports with `ssr: false` in `next/dynamic` (see `app/page.tsx` line 12)
- **Key Files:** `next.config.mjs` configures webpack for async WASM handling; `scripts/setup-wasm.js` copies WASM files post-install
- **Pattern to follow:** Always lazy-load Privacy Cash components; never import them at module level in server-rendered contexts

### Solana Wallet Integration
- **Architecture:** Wallet adapter context providers wrap the entire app (`app/page.tsx`)
- **Providers stack:** `ConnectionProvider` → `WalletProvider` → `WalletModalProvider` → UI
- **Configured wallets:** Phantom and Solflare only (avoid duplicates in v0 UI)
- **RPC endpoint:** Hardcoded Helius mainnet endpoint for reliability
- **Pattern:** Always check `publicKey` and capability existence (`signTransaction`, `signMessage`) before wallet operations

### Encryption & Signature Flow
1. User connects wallet → clicks "Initialize Encryption"
2. `lib/signature.ts:getSignedSignature()` prompts signature with message "Privacy Money account sign in"
3. Signature derives encryption key in `EncryptionService` (from privacycash SDK)
4. Encryption service initialized; ready for deposit/withdraw operations
- **Key file:** `lib/signature.ts` - handles error cases like user rejection, signature type coercion

### Component Structure
- **`PrivateTransferForm.tsx`:** Main stateful component managing deposit/withdraw tabs, encryption initialization, Privacy Cash SDK calls
- **`WalletInfo.tsx`:** Display-only companion component showing connected wallet balance in real-time
- **UI Components:** Radix UI + custom shadcn components in `components/ui/` - use Card, Tabs, Input, Button, Alert patterns throughout

## Development Workflows

### Build & Run
```bash
npm run dev        # Start Next.js dev server (port 3000)
npm run build      # Production build with TS strict mode ignored
npm run lint       # ESLint (see .eslintrc if present)
npm start          # Run production build
```

### WASM Setup
`scripts/setup-wasm.js` runs automatically via `postinstall`. Copies hasher_wasm files to expected browser location. If WASM loading fails in dev, clear `.next/` and node_modules and reinstall.

### TypeScript Config
- `@/*` paths map to workspace root (import from `@/lib`, `@/components` not relative paths)
- Strict mode enabled; build ignores TS errors intentionally
- Target: ES2020, module: esnext

## Project-Specific Conventions

### State Management
- Local React `useState` for component-level deposit/withdraw forms (see `PrivateTransferForm.tsx`)
- No global store; wallet context from Solana adapter suffices
- Form state shape mirrors UI structure: `{ amount, recipient, loading, txHash, error }`

### Error Handling
- Try-catch wraps Privacy Cash and wallet operations
- User-facing alerts for validation and rejections
- Console logs prefixed with `[v0]` for debugging (consistent pattern in codebase)
- Common error: "User rejected the signature request" caught and re-thrown with clarity

### Component Patterns
- All transfer forms are `'use client'` (client-side interaction required)
- Radix UI Tabs for deposit/withdraw split logic (single component, state-driven tabs)
- Icons from lucide-react: `AlertCircle`, `CheckCircle2`, `Lock`, `Unlock` for status indicators
- Tailwind utility classes; no custom CSS except globals

### Dynamic Imports
- Privacy Cash components **must** use `dynamic(() => import(...), { ssr: false })`
- Prevents WASM bundle bloat at build time and SSR errors
- Loading state: simple skeletal UI while component mounts

## Integration Points & Dependencies

### External Services
- **Solana Mainnet-Beta:** Via Helius RPC (`https://mainnet.helius-rpc.com/?api-key=...`)
- **Privacy Cash SDK (`privacycash`):** Provides `EncryptionService`, deposit/withdraw circuit implementations
- **@lightprotocol/hasher.rs:** WASM-based hashing for circuit proofs

### Cross-Component Communication
- Wallet state flows via Solana adapter context (no prop drilling)
- `PrivateTransferForm` reads `connection`, `publicKey`, `signTransaction`, `signMessage` from hooks
- `WalletInfo` independently reads `connection` and `publicKey` for real-time balance

## Common Gotchas & Tips

1. **WASM loading fails:** Clear `.next/` and reinstall if hasher.rs paths are wrong
2. **Wallet not connecting:** Ensure `wallets` array includes user's installed wallet adapter
3. **Encryption not initialized:** Form prevents deposit/withdraw until `encryptionService` is set; check signature cache key logic
4. **Types on `privacycash`:** SDK exports as any; use `type Signed` wrapper in `lib/signature.ts` for type safety
5. **Mainnet hardcoded:** Switching networks requires code change (not dynamically configurable)

## Files Exemplifying Key Patterns

| Pattern | File |
|---------|------|
| WASM dynamic loading | `app/page.tsx` (line 12-14) |
| Wallet initialization | `app/page.tsx` (line 24-31) |
| Encryption flow | `PrivateTransferForm.tsx` (line 47-76) |
| Error handling | `lib/signature.ts` (line 14-25) |
| Form state shape | `PrivateTransferForm.tsx` (line 16-26) |
| Radix UI + Tailwind | `components/ui/*` + `PrivateTransferForm.tsx` styling |
