/**
 * Cryptographic utilities for password hashing and verification.
 * Uses the Web Crypto API (PBKDF2 with SHA-256 and a cryptographically secure random salt).
 * Compatible across modern browsers, Vite, and serverless edge runtimes.
 */

const PBKDF2_ITERATIONS = 100000;
const HASH_LENGTH_BITS = 256;
const SALT_LENGTH_BYTES = 16;

/**
 * Derives a PBKDF2 hash using Web Crypto API.
 */
async function derivePbkdf2Hash(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_LENGTH_BITS
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hashes a plaintext password into a salted PBKDF2 string.
 * Output format: `pbkdf2:100000:<salt_hex>:<hash_hex>`
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const hashHex = await derivePbkdf2Hash(password, salt, PBKDF2_ITERATIONS);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored hash.
 * Supports:
 * 1. Standard PBKDF2 format (`pbkdf2:iterations:salt:hash`)
 * 2. Legacy plaintext fallback for backwards compatibility
 */
export async function verifyPassword(password: string, storedHash?: string | null): Promise<boolean> {
  if (!password || !storedHash) return false;

  // Check if hash follows PBKDF2 format
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length === 4 && parts[1] && parts[2] && parts[3]) {
      const iterations = parseInt(parts[1], 10);
      const saltHex = parts[2];
      const expectedHashHex = parts[3];

      if (!saltHex || !expectedHashHex || isNaN(iterations)) {
        return false;
      }

      const saltMatches = saltHex.match(/.{1,2}/g);
      if (!saltMatches) return false;

      const salt = new Uint8Array(saltMatches.map((byte) => parseInt(byte, 16)));
      const actualHashHex = await derivePbkdf2Hash(password, salt, iterations);

      return actualHashHex === expectedHashHex;
    }
  }

  // Graceful fallback for existing legacy plaintext records
  return password === storedHash;
}
