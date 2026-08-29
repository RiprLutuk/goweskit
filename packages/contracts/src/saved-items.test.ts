import { describe, expect, it } from 'vitest';

import {
  saveItemRequestSchema,
  saveItemResponseSchema,
} from './saved-items.js';

describe('Saved item contracts', () => {
  it('accepts only a place or route UUID and a stable saved response', () => {
    const itemId = '10000000-0000-4000-8000-000000000001';
    expect(
      saveItemRequestSchema.parse({ itemKind: 'place', itemId }).itemKind,
    ).toBe('place');
    expect(
      saveItemRequestSchema.safeParse({ itemKind: 'community', itemId })
        .success,
    ).toBe(false);
    expect(
      saveItemResponseSchema.parse({
        saved: true,
        savedAt: '2026-08-28T21:40:00.000Z',
      }).saved,
    ).toBe(true);
  });
});
