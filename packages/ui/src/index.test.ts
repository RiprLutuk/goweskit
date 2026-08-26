import { describe, expect, it } from 'vitest';

import { COMPATIBILITY_STATUS_PRESENTATION } from './index.js';

describe('compatibility status presentation', () => {
  it('provides text and a symbol for every non-color status cue', () => {
    expect(Object.values(COMPATIBILITY_STATUS_PRESENTATION)).toHaveLength(4);
    for (const presentation of Object.values(
      COMPATIBILITY_STATUS_PRESENTATION,
    )) {
      expect(presentation.label.length).toBeGreaterThan(0);
      expect(presentation.symbol.length).toBeGreaterThan(0);
    }
  });
});
