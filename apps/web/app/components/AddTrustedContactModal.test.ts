import { describe, expect, it } from 'vitest';

describe('AddTrustedContactModal Logic', () => {
  function validateContactForm(payload: { name: string; phone?: string; email?: string }): { valid: boolean; error?: string } {
    if (!payload.name.trim()) {
      return { valid: false, error: 'Nama lengkap wajib diisi.' };
    }
    return { valid: true };
  }

  function cleanPhone(raw?: string | null): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/gu, '');
    return digits || null;
  }

  it('validates contact name requirement', () => {
    expect(validateContactForm({ name: '' }).valid).toBe(false);
    expect(validateContactForm({ name: '   ' }).valid).toBe(false);
    expect(validateContactForm({ name: 'Budi Hartono' }).valid).toBe(true);
  });

  it('cleans phone numbers properly', () => {
    expect(cleanPhone('0812-3456-7890')).toBe('081234567890');
    expect(cleanPhone('+62 812 3456')).toBe('628123456');
    expect(cleanPhone('')).toBeNull();
  });
});
