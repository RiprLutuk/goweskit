import { describe, expect, it } from 'vitest';

import {
  buildSafetyShareUrl,
  formatAccuracy,
  readSafetyShareToken,
  SOS_HOLD_DURATION_MS,
} from './safety';

const token = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde';

describe('safety UI privacy helpers', () => {
  it('keeps a share token in the URL fragment only', () => {
    const url = new URL(buildSafetyShareUrl('https://goweskit.test/', token));

    expect(url.pathname).toBe('/safety/share');
    expect(url.search).toBe('');
    expect(url.hash).toBe(`#${token}`);
    expect(`${url.origin}${url.pathname}${url.search}`).not.toContain(token);
  });

  it('accepts only a valid high-entropy fragment token', () => {
    expect(readSafetyShareToken(`#${token}`)).toBe(token);
    expect(readSafetyShareToken('#too-short')).toBeNull();
    expect(readSafetyShareToken('#contains+unsafe/characters===')).toBeNull();
  });

  it('defines a deliberate hold and readable accuracy', () => {
    expect(SOS_HOLD_DURATION_MS).toBeGreaterThanOrEqual(1_500);
    expect(formatAccuracy(14.6)).toBe('±15 m');
  });
});
