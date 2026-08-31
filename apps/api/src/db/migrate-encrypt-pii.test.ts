import { describe, expect, it } from 'vitest';
import { decryptNullable, decryptText, encryptNullable, encryptText } from '../crypto/encryption.js';

describe('migrateEncryptPii Logic', () => {
  it('correctly identifies unencrypted strings and encrypts them', () => {
    const rawName = 'Budi Hartono';
    expect(rawName.startsWith('enc:v1:')).toBe(false);

    const encrypted = encryptText(rawName);
    expect(encrypted.startsWith('enc:v1:')).toBe(true);
    expect(decryptText(encrypted)).toBe(rawName);
  });

  it('preserves already-encrypted fields without double-encrypting', () => {
    const rawPhone = '081234567890';
    const encryptedOnce = encryptNullable(rawPhone);

    expect(encryptedOnce).not.toBeNull();
    // Simulate migration check
    const isAlreadyEncrypted = encryptedOnce?.startsWith('enc:v1:');
    expect(isAlreadyEncrypted).toBe(true);

    // Should decrypt back to original phone
    expect(decryptNullable(encryptedOnce)).toBe(rawPhone);
  });
});
