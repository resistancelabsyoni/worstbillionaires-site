/**
 * Hash an email address using HMAC-SHA256 with a secret key.
 * This prevents rainbow table attacks by requiring the secret key.
 *
 * @param email - Email address to hash
 * @param secret - Secret key for HMAC (from environment)
 * @returns Hexadecimal hash string
 */
export async function hashEmail(email: string, secret: string): Promise<string> {
  const normalized = email.toLowerCase().trim();

  // Import secret key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the email with HMAC
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(normalized)
  );

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
