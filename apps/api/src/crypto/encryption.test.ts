import { describe, expect, it } from 'vitest';
import {
  decryptNullable,
  decryptText,
  encryptNullable,
  encryptText,
} from './encryption.js';

describe('AES-256-GCM Field-Level Encryption', () => {
  it('encrypts and decrypts text strings losslessly', () => {
    const original = '+62 812-3456-7890';
    const encrypted = encryptText(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted.startsWith('enc:v1:')).toBe(true);

    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(original);
  });

  it('handles unicode, emojis, and multiline text', () => {
    const complex =
      'Nama: Pak Budi 🚲 | Catatan: "Hati-hati tanjakan Sentul! #gowes"';
    const encrypted = encryptText(complex);
    expect(decryptText(encrypted)).toBe(complex);
  });

  it('produces unique ciphertexts for identical inputs due to random IV', () => {
    const input = 'keluarga@goweskit.id';
    const enc1 = encryptText(input);
    const enc2 = encryptText(input);

    expect(enc1).not.toBe(enc2);
    expect(decryptText(enc1)).toBe(input);
    expect(decryptText(enc2)).toBe(input);
  });

  it('gracefully handles unencrypted legacy text (backward compatibility)', () => {
    const legacyPlaintext = '081299998888';
    expect(decryptText(legacyPlaintext)).toBe(legacyPlaintext);
  });

  it('handles null and undefined nullable fields safely', () => {
    expect(encryptNullable(null)).toBeNull();
    expect(encryptNullable(undefined)).toBeNull();
    expect(encryptNullable('')).toBeNull();
    expect(encryptNullable('   ')).toBeNull();

    expect(decryptNullable(null)).toBeNull();
    expect(decryptNullable(undefined)).toBeNull();
    expect(decryptNullable('')).toBeNull();

    const encrypted = encryptNullable('Saudara Kandung');
    expect(encrypted).not.toBeNull();
    expect(decryptNullable(encrypted)).toBe('Saudara Kandung');
  });

  it('supports custom encryption master keys', () => {
    const secret = 'custom-user-dedicated-master-key-2026';
    const text = 'catatan-rahasia-darurat';
    const encrypted = encryptText(text, secret);

    expect(decryptText(encrypted, secret)).toBe(text);
    // Attempting decryption with default key should fail gracefully
    expect(decryptText(encrypted)).not.toBe(text);
  });
});
