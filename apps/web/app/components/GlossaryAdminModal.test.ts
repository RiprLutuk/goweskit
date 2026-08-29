import { describe, expect, it } from 'vitest';

describe('GlossaryAdminModal Logic', () => {
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/gu, '_')
      .replace(/^_+|_+$/gu, '');
  }

  it('slugifies term names reliably', () => {
    expect(slugify('Universal Derailleur Hanger (UDH)')).toBe('universal_derailleur_hanger_udh');
    expect(slugify('Boost 148 Spacing!')).toBe('boost_148_spacing');
    expect(slugify('  T-Type Direct Mount  ')).toBe('t_type_direct_mount');
  });
});
