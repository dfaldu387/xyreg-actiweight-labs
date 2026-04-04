/**
 * Generate a cryptographically secure random token
 * @param length The length of the token in bytes (default: 32 bytes = 64 hex characters)
 * @returns A hex-encoded random string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
