import { PublicKey } from '@solana/web3.js'

export type Signed = {
  publicKey: PublicKey
  signature?: Uint8Array
  provider: any
}

export async function getSignedSignature(signed: Signed) {
  if (signed.signature) {
    return
  }

  const encodedMessage = new TextEncoder().encode('Privacy Money account sign in')
  const cacheKey = `zkcash-signature-${signed.publicKey.toBase58()}`

  let signature: Uint8Array
  try {
    signature = await signed.provider.signMessage(encodedMessage)
  } catch (err: any) {
    if (err instanceof Error && err.message?.toLowerCase().includes('user rejected')) {
      throw new Error('User rejected the signature request')
    }
    throw new Error('Failed to sign message: ' + err.message)
  }

  // If wallet.signMessage returned an object, extract `signature`
  if (signature && typeof signature === 'object' && 'signature' in signature) {
    signature = (signature as any).signature
  }

  if (!(signature instanceof Uint8Array)) {
    throw new Error('signature is not an Uint8Array type')
  }

  signed.signature = signature
}
