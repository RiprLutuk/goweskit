import { describe, expect, it } from 'vitest';
import {
  COMPATIBILITY_RULE_CODES,
  evaluateCompatibility,
  getCompatibilityCandidateValues,
  getCompatibilityRule,
} from '@goweskit/bike-domain';

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

  it('accepts the centralized normalized vocabulary for every rule', () => {
    const candidates = COMPATIBILITY_RULE_CODES.map((ruleCode) => ({
      ruleCode,
      knowledge: 'known' as const,
      value: getCompatibilityCandidateValues(ruleCode)[0]?.code,
    }));
    expect(candidates.every((candidate) => candidate.value !== undefined)).toBe(
      true,
    );
    expect(
      compatibilityEvaluateRequestSchema.safeParse({
        bikeId: '019c9c80-2896-7593-bd02-509894b90002',
        candidates,
      }).success,
    ).toBe(true);
  });

  it.each([
    ['drivetrain_family', 'brand-only'],
    ['headset_interface', 'tapered'],
    ['bottom_bracket_shell', 'pressfit'],
    ['crank_spindle', 'sram'],
    ['fork_travel', '125'],
    ['brake_mount', 'universal'],
    ['rotor_diameter', '205'],
    ['seatpost_diameter', 'about-31'],
    ['tire_clearance', '2.4-inch'],
  ] as const)('rejects non-normalized %s value', (ruleCode, value) => {
    expect(
      compatibilityEvaluateRequestSchema.safeParse({
        bikeId: '019c9c80-2896-7593-bd02-509894b90002',
        candidates: [{ ruleCode, knowledge: 'known', value }],
      }).success,
    ).toBe(false);
  });

  it('requires explanations, checks, missing information, fixes, and provenance', () => {
    expect(
      compatibilityEvaluationSchema.safeParse({ status: 'compatible' }).success,
    ).toBe(false);
  });

  it('parses a complete multi-rule deterministic evaluation', () => {
    const result = evaluateCompatibility(
      {
        specs: {
          drivetrain_family: {
            knowledge: 'known',
            value: 'shimano_cues_linkglide',
          },
          fork_travel_min_mm: { knowledge: 'known', value: '100' },
          fork_travel_max_mm: { knowledge: 'known', value: '140' },
          tire_clearance_max_mm: { knowledge: 'unknown' },
        },
      },
      [
        {
          ruleCode: 'drivetrain_family',
          knowledge: 'known',
          value: 'shimano_cues_linkglide',
        },
        { ruleCode: 'fork_travel', knowledge: 'known', value: '120' },
        { ruleCode: 'tire_clearance', knowledge: 'known', value: '50' },
      ],
    );
    expect(compatibilityEvaluationSchema.safeParse(result).success).toBe(true);
    expect(result.status).toBe('unknown');
    expect(result.ruleProvenance).toHaveLength(3);
  });

  it('keeps every rule provenance compatible with the response contract', () => {
    for (const ruleCode of COMPATIBILITY_RULE_CODES) {
      const rule = getCompatibilityRule(ruleCode);
      expect(rule.provenance.ruleCode).toBe(ruleCode);
      expect(rule.provenance.ruleVersion).toMatch(/^\d+\.\d+\.\d+$/u);
      expect(() => new URL(rule.provenance.sourceUrl)).not.toThrow();
    }
  });
});
