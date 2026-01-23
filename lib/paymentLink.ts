import { PublicKey } from '@solana/web3.js'

/**
 * Encryption/decryption utility for private payment links
 * Uses simple base64 encoding with XOR cipher for lightweight encryption
 * All data stays in URL - no server storage
 */

// Generate a random encryption key (hex string)
function generateRandomKey(length: number = 32): string {
  const chars = '0123456789abcdef'
  let key = ''
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

// Simple XOR cipher for encryption
function xorEncrypt(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    )
  }
  return btoa(result) // base64 encode
}

// XOR cipher for decryption
function xorDecrypt(encoded: string, key: string): string {
  const text = atob(encoded) // base64 decode
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    )
  }
  return result
}

// URL-safe encoding
function toUrlSafe(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromUrlSafe(str: string): string {
  // Restore padding
  const padding = (4 - (str.length % 4)) % 4
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  return str + '='.repeat(padding)
}

/**
 * Generate a private payment link
 * @param recipientAddress - Solana wallet address to receive payment
 * @returns Object with full URL and components
 */
export function generatePaymentLink(recipientAddress: string): {
  url: string
  linkId: string
  key: string
} {
  // Validate address
  try {
    new PublicKey(recipientAddress)
  } catch {
    throw new Error('Invalid Solana address')
  }

  // Generate encryption key
  const key = generateRandomKey(32)

  // Encrypt recipient address
  const encrypted = xorEncrypt(recipientAddress, key)
  const urlSafeEncrypted = toUrlSafe(encrypted)
  const urlSafeKey = toUrlSafe(key)

  // Create link ID (short identifier)
  const linkId = Math.random().toString(36).substring(2, 10)

  // Build full URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://privatetransfer.site'
  const url = `${baseUrl}/pay?id=${linkId}&data=${urlSafeEncrypted}&key=${urlSafeKey}`

  return { url, linkId, key }
}

/**
 * Decrypt recipient address from payment link
 * @param encryptedData - URL-safe encrypted data
 * @param key - Encryption key
 * @returns Recipient wallet address
 */
export function decryptRecipientAddress(
  encryptedData: string,
  key: string
): string {
  try {
    const decoded = fromUrlSafe(encryptedData)
    const urlSafeKey = fromUrlSafe(key)
    const recipientAddress = xorDecrypt(decoded, urlSafeKey)

    // Validate it's a valid address
    new PublicKey(recipientAddress)
    return recipientAddress
  } catch (error) {
    throw new Error('Invalid or corrupted payment link')
  }
}

/**
 * Generate QR code data URL
 * Uses qr-code library (can be added via npm if needed)
 */
export async function generateQRCode(url: string): Promise<string> {
  // Simple implementation using qr server API (no library needed)
  const encodedUrl = encodeURIComponent(url)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`
}

/**
 * Extract payment link parameters from URL
 */
export function extractPaymentLinkParams(searchParams: URLSearchParams): {
  id: string
  data: string
  key: string
} | null {
  const id = searchParams.get('id')
  const data = searchParams.get('data')
  const key = searchParams.get('key')

  if (!id || !data || !key) {
    return null
  }

  return { id, data, key }
}
