import { describe, expect, it } from 'vitest';

import {
  COMPATIBILITY_RULE_CODES,
  evaluateCompatibility,
  getCompatibilityRule,
  type CompatibilityCandidate,
  type CompatibilityRuleCode,
} from './compatibility.js';

const VALUES: Record<CompatibilityRuleCode, [string, string]> = {
  wheel_size: ['iso_622', 'iso_584'],
  front_axle: ['15x110', '15x100'],
  rear_axle: ['12x148', '12x142'],
  freehub_cassette: ['hg', 'micro_spline'],
  drivetrain_speeds: ['12', '11'],
  fork_steerer: ['straight_1_1_8', 'tapered_1_1_8_to_1_1_2'],
};

function known(
  ruleCode: CompatibilityRuleCode,
  value: string,
): CompatibilityCandidate {
  return { ruleCode, knowledge: 'known', value };
}

describe('deterministic compatibility golden cases', () => {
  for (const ruleCode of COMPATIBILITY_RULE_CODES) {
    const [matching, different] = VALUES[ruleCode];
    const specCode = getCompatibilityRule(ruleCode).bikeSpecCode;

    it(`${ruleCode}: matching normalized values are compatible`, () => {
      const result = evaluateCompatibility(
        { specs: { [specCode]: { knowledge: 'known', value: matching } } },
        [known(ruleCode, matching)],
      );
      expect(result).toMatchObject({
        status: 'compatible',
        missingInformation: [],
        possibleFix: null,
        checksPerformed: [{ ruleCode, status: 'passed' }],
      });
      expect(result.ruleProvenance[0]?.ruleVersion).toBe('1.0.0');
    });

    it(`${ruleCode}: different normalized values are incompatible`, () => {
      const result = evaluateCompatibility(
        { specs: { [specCode]: { knowledge: 'known', value: matching } } },
        [known(ruleCode, different)],
      );
      expect(result.status).toBe('incompatible');
      expect(result.checksPerformed[0]?.status).toBe('failed');
      expect(result.possibleFix).not.toBeNull();
    });

    it(`${ruleCode}: unrecorded bike data returns unknown`, () => {
      const result = evaluateCompatibility({ specs: {} }, [
        known(ruleCode, matching),
      ]);
      expect(result.status).toBe('unknown');
      expect(result.checksPerformed[0]?.status).toBe('unknown');
      expect(result.missingInformation).toHaveLength(1);
    });
  }

  it('distinguishes explicit candidate unknown from a known candidate', () => {
    const result = evaluateCompatibility(
      { specs: { wheel_size: { knowledge: 'known', value: 'iso_622' } } },
      [{ ruleCode: 'wheel_size', knowledge: 'unknown' }],
    );
    expect(result.status).toBe('unknown');
    expect(result.missingInformation).toEqual([
      'candidate wheel size is unknown.',
    ]);
  });

  it('allows an XD cassette on XDR only with the documented spacer', () => {
    const result = evaluateCompatibility(
      { specs: { freehub: { knowledge: 'known', value: 'xdr' } } },
      [known('freehub_cassette', 'xd')],
    );
    expect(result.status).toBe('conditional');
    expect(result.checksPerformed[0]).toMatchObject({
      status: 'conditional',
      possibleFix: 'Install the manufacturer-specified 1.85 mm spacer.',
    });
  });

  it('uses incompatible > unknown > conditional > compatible precedence', () => {
    const result = evaluateCompatibility(
      {
        specs: {
          freehub: { knowledge: 'known', value: 'xdr' },
          wheel_size: { knowledge: 'known', value: 'iso_622' },
        },
      },
      [
        known('freehub_cassette', 'xd'),
        { ruleCode: 'front_axle', knowledge: 'unknown' },
        known('wheel_size', 'iso_584'),
      ],
    );
    expect(result.status).toBe('incompatible');
  });
});
