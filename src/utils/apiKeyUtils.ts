// Simple encryption/decryption utility for API keys
// Note: This provides basic obfuscation. For production apps, consider using a proper encryption library.

const ENCRYPTION_KEY = 'medtech-api-key-2024'; // In production, this should be from environment

export function encryptApiKey(apiKey: string): string {
  try {
    console.log('[encryptApiKey] Input:', {
      inputLength: apiKey.length,
      startsWithAIza: apiKey.startsWith('AIza')
    });

    // Simple XOR encryption with base64 encoding
    const encrypted = Array.from(apiKey)
      .map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
      )
      .join('');

    const result = btoa(encrypted); // Base64 encode

    console.log('[encryptApiKey] Output:', {
      outputLength: result.length
    });

    // Verify encryption works by test decrypting
    const testDecrypt = decryptApiKey(result);
    if (testDecrypt !== apiKey) {
      console.error('[encryptApiKey] ENCRYPTION VERIFICATION FAILED!', {
        originalLength: apiKey.length,
        decryptedLength: testDecrypt.length,
        match: testDecrypt === apiKey
      });
    }

    return result;
  } catch (error) {
    console.error('Error encrypting API key:', error);
    return apiKey; // Return original if encryption fails
  }
}

export function decryptApiKey(encryptedKey: string): string {
  try {
    // If key looks like a plain text API key (starts with common prefixes), return as-is
    if (encryptedKey.startsWith('AIza') || encryptedKey.startsWith('sk-') || encryptedKey.startsWith('gpt-')) {
      console.log('[decryptApiKey] Key appears to be plain text, returning as-is');
      return encryptedKey;
    }

    // Debug: log input
    console.log('[decryptApiKey] Input:', {
      inputLength: encryptedKey.length,
      inputPreview: encryptedKey.substring(0, 20) + '...'
    });

    // Reverse the process: base64 decode then XOR decrypt
    let base64Decoded: string;
    try {
      base64Decoded = atob(encryptedKey);
    } catch (base64Error) {
      console.error('[decryptApiKey] Base64 decode failed:', base64Error);
      // Try returning the key as-is (might already be plain text)
      return encryptedKey;
    }

    console.log('[decryptApiKey] After base64 decode:', {
      decodedLength: base64Decoded.length
    });

    const decrypted = Array.from(base64Decoded)
      .map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length))
      )
      .join('');

    // Debug: log decryption result info (not the actual key)
    console.log('[decryptApiKey] Decryption result:', {
      inputLength: encryptedKey.length,
      base64DecodedLength: base64Decoded.length,
      outputLength: decrypted.length,
      startsWithAIza: decrypted.startsWith('AIza'),
      firstFourChars: decrypted.substring(0, 4)
    });

    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    // If decryption fails, try using the key as-is (might be plain text)
    return encryptedKey;
  }
}