import { describe, expect, it } from 'vitest';

import {
  compatibilityEvaluateRequestSchema,
  compatibilityEvaluationSchema,
} from './compatibility.js';

describe('compatibility API contracts', () => {
  it('accepts one normalized candidate per rule', () => {
    expect(
      compatibilityEvaluateRequestSchema.safeParse({
        bikeId: '019c9c80-2896-7593-bd02-509894b90002',
        candidates: [
          {
            ruleCode: 'rear_axle',
            knowledge: 'known',
            value: '12x148',
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('rejects invented values and duplicate rules at the boundary', () => {
    const base = {
      bikeId: '019c9c80-2896-7593-bd02-509894b90002',
    };
    expect(
      compatibilityEvaluateRequestSchema.safeParse({
        ...base,
        candidates: [
          {
            ruleCode: 'front_axle',
            knowledge: 'known',
            value: 'brand-boost',
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      compatibilityEvaluateRequestSchema.safeParse({
        ...base,
        candidates: [
          { ruleCode: 'wheel_size', knowledge: 'unknown' },
          { ruleCode: 'wheel_size', knowledge: 'unknown' },
        ],
      }).success,
    ).toBe(false);
  });

  it('requires explanations, checks, missing information, fixes, and provenance', () => {
    expect(
      compatibilityEvaluationSchema.safeParse({ status: 'compatible' }).success,
    ).toBe(false);
  });
});
