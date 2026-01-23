Payment Link (recipient) — quick notes

- Route: `app/pay/page.tsx` renders `components/PaymentLinkContent.tsx` which decrypts recipient data from the URL and mounts `PrivateTransferForm` (client-only, WASM-safe).
- Wallet connect: recipients visiting a shared link can connect and pay directly — `components/PaymentLinkContent.tsx` instantiates `ConnectionProvider` → `WalletProvider` → `WalletModalProvider` and shows a `WalletMultiButton` in the header. Wallets included: Phantom + Solflare. The page re-uses the Helius RPC endpoint used on the main page.
- Rationale: payment links must be usable standalone (no sender session). Providers on the pay page let a visitor connect, initialize encryption, and execute the private transfer.
- Maintainer notes: consider centralizing providers in `app/layout.tsx` and moving the Helius endpoint into an env var to avoid duplication.

Example snippet (where to look):
- `components/PaymentLinkContent.tsx` — header now contains `WalletMultiButton` and the page wraps itself with the Solana providers.

If you'd like, I can attempt a safe merge into the canonical `.github/copilot-instructions.md` (overwrite or intelligently insert this block).