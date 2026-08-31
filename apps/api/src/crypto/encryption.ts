import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ALGORITHM_CBC = 'aes-256-cbc';
const ALGORITHM_GCM = 'aes-256-gcm';
const IV_LENGTH_CBC = 16;
const PREFIX_CBC = 'enc:v1:cbc:';
const PREFIX_GCM = 'enc:v1:';

// Default fallback key used for local development and unit tests if not supplied in env
const DEFAULT_FALLBACK_SECRET = 'goweskit-dev-fallback-encryption-master-secret-key-32bytes';

function getMasterKey(customKey?: string | Buffer): Buffer {
  if (customKey !== undefined) {
    if (Buffer.isBuffer(customKey) && customKey.length === 32) {
      return customKey;
    }
    return createHash('sha256')
      .update(typeof customKey === 'string' ? customKey : customKey.toString())
      .digest();
  }

  const envKey = process.env.DATA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || DEFAULT_FALLBACK_SECRET;
  return createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts a sensitive plaintext string with AES-256-CBC.
 * Output format: enc:v1:cbc:<iv_hex>:<ciphertext_hex>
 * This format is 100% decryptable directly via PostgreSQL pgcrypto decrypt_iv() SQL query.
 */
export function encryptText(plaintext: string, customKey?: string | Buffer): string {
  if (!plaintext) {
    return plaintext;
  }

  const key = getMasterKey(customKey);
  const iv = randomBytes(IV_LENGTH_CBC);
  const cipher = createCipheriv(ALGORITHM_CBC, key, iv);

  const encryptedBuffer = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  return `${PREFIX_CBC}${iv.toString('hex')}:${encryptedBuffer.toString('hex')}`;
}

/**
 * Decrypts an encrypted string (supports both enc:v1:cbc: and legacy enc:v1: GCM).
 * Gracefully returns original plaintext if not encrypted.
 */
export function decryptText(ciphertext: string, customKey?: string | Buffer): string {
  if (!ciphertext || typeof ciphertext !== 'string') {
    return ciphertext;
  }

  // 1. Handle AES-256-CBC format (PostgreSQL pgcrypto compatible)
  if (ciphertext.startsWith(PREFIX_CBC)) {
    const payload = ciphertext.slice(PREFIX_CBC.length);
    const parts = payload.split(':');
    if (parts.length !== 2) return ciphertext;

    const [ivHex, cipherHex] = parts;
    if (!ivHex || !cipherHex) return ciphertext;

    try {
      const key = getMasterKey(customKey);
      const iv = Buffer.from(ivHex, 'hex');
      const encryptedData = Buffer.from(cipherHex, 'hex');

      const decipher = createDecipheriv(ALGORITHM_CBC, key, iv);
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch {
      return ciphertext;
    }
  }

  // 2. Handle legacy AES-256-GCM format
  if (ciphertext.startsWith(PREFIX_GCM)) {
    const payload = ciphertext.slice(PREFIX_GCM.length);
    const parts = payload.split(':');
    if (parts.length !== 3) return ciphertext;

    const [ivBase64, tagBase64, dataBase64] = parts;
    if (!ivBase64 || !tagBase64 || !dataBase64) return ciphertext;

    try {
      const key = getMasterKey(customKey);
      const iv = Buffer.from(ivBase64, 'base64url');
      const authTag = Buffer.from(tagBase64, 'base64url');
      const encryptedData = Buffer.from(dataBase64, 'base64url');

      const decipher = createDecipheriv(ALGORITHM_GCM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch {
      return ciphertext;
    }
  }

  // 3. Gracefully handle unencrypted legacy text
  return ciphertext;
}

/**
 * Nullable helper to encrypt a field value if present.
 */
export function encryptNullable(value: string | null | undefined, customKey?: string | Buffer): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }
  return encryptText(value.trim(), customKey);
}

/**
 * Nullable helper to decrypt a field value if present.
 */
export function decryptNullable(value: string | null | undefined, customKey?: string | Buffer): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return decryptText(value, customKey);
}
