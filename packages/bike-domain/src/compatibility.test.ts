import { describe, expect, it } from 'vitest';

import {
  COMPATIBILITY_RULE_CODES,
  COMPATIBILITY_RULES,
  evaluateCompatibility,
  getCompatibilityCandidateValues,
  getCompatibilityRule,
  type CompatibilityBike,
  type CompatibilityCandidate,
  type CompatibilityRuleCode,
} from './compatibility.js';
import { BIKE_SPEC_CODES, type BikeSpecCode } from './standards.js';

interface GoldenCase {
  bikeSpecs: Partial<Record<BikeSpecCode, string>>;
  passing: string;
  failing: string;
}

const GOLDEN_CASES: Record<CompatibilityRuleCode, GoldenCase> = {
  wheel_size: {
    bikeSpecs: { wheel_size: 'iso_622' },
    passing: 'iso_622',
    failing: 'iso_584',
  },
  front_axle: {
    bikeSpecs: { front_axle: '15x110' },
    passing: '15x110',
    failing: '15x100',
  },
  rear_axle: {
    bikeSpecs: { rear_axle: '12x148' },
    passing: '12x148',
    failing: '12x142',
  },
  freehub_cassette: {
    bikeSpecs: { freehub: 'hg' },
    passing: 'hg',
    failing: 'micro_spline',
  },
  drivetrain_speeds: {
    bikeSpecs: { drivetrain_speeds: '12' },
    passing: '12',
    failing: '11',
  },
  drivetrain_family: {
    bikeSpecs: { drivetrain_family: 'shimano_cues_linkglide' },
    passing: 'shimano_cues_linkglide',
    failing: 'shimano_mtb_hg',
  },
  fork_steerer: {
    bikeSpecs: { fork_steerer: 'straight_1_1_8' },
    passing: 'straight_1_1_8',
    failing: 'tapered_1_1_8_to_1_1_2',
  },
  headset_interface: {
    bikeSpecs: { headset_interface: 'zs44_zs56' },
    passing: 'zs44_zs56',
    failing: 'zs44_ec44',
  },
  bottom_bracket_shell: {
    bikeSpecs: { bottom_bracket_shell: 'bsa_68_73' },
    passing: 'bsa_68_73',
    failing: 'bb86_92',
  },
  crank_spindle: {
    bikeSpecs: { bottom_bracket_spindle: 'dub_28_99' },
    passing: 'dub_28_99',
    failing: '24mm',
  },
  fork_travel: {
    bikeSpecs: { fork_travel_min_mm: '100', fork_travel_max_mm: '140' },
    passing: '120',
    failing: '160',
  },
  brake_mount: {
    bikeSpecs: { brake_mount: 'post_mount' },
    passing: 'post_mount',
    failing: 'flat_mount',
  },
  rotor_diameter: {
    bikeSpecs: { rotor_min_mm: '160', rotor_max_mm: '203' },
    passing: '180',
    failing: '220',
  },
  seatpost_diameter: {
    bikeSpecs: { seatpost_diameter_mm: '27.2' },
    passing: '27.2',
    failing: '30.9',
  },
  tire_clearance: {
    bikeSpecs: { tire_clearance_max_mm: '50' },
    passing: '47',
    failing: '54',
  },
};

function bike(specs: Partial<Record<BikeSpecCode, string>>): CompatibilityBike {
  const normalized: CompatibilityBike['specs'] = {};
  for (const code of BIKE_SPEC_CODES) {
    const value = specs[code];
    if (value !== undefined) normalized[code] = { knowledge: 'known', value };
  }
  return { specs: normalized };
}

function known(
  ruleCode: CompatibilityRuleCode,
  value: string,
): CompatibilityCandidate {
  return { ruleCode, knowledge: 'known', value };
}

describe('deterministic compatibility golden cases', () => {
  it('ships at least the twelve rule families required by the PRD', () => {
    expect(COMPATIBILITY_RULE_CODES.length).toBeGreaterThanOrEqual(12);
    expect(COMPATIBILITY_RULES).toHaveLength(COMPATIBILITY_RULE_CODES.length);
  });

  for (const ruleCode of COMPATIBILITY_RULE_CODES) {
    const golden = GOLDEN_CASES[ruleCode];

    it(`${ruleCode}: the documented passing case is compatible`, () => {
      const result = evaluateCompatibility(bike(golden.bikeSpecs), [
        known(ruleCode, golden.passing),
      ]);
      expect(result).toMatchObject({
        status: 'compatible',
        missingInformation: [],
        possibleFix: null,
        checksPerformed: [{ ruleCode, status: 'passed' }],
      });
      expect(result.humanExplanation).not.toBe('');
      expect(result.technicalExplanation).not.toBe('');
      const provenance = result.ruleProvenance[0];
      expect(provenance?.ruleCode).toBe(ruleCode);
      expect(provenance?.ruleVersion).toBe('1.0.0');
      expect(provenance?.sourceTitle.length).toBeGreaterThan(0);
      expect(provenance?.sourceUrl).toMatch(/^https:\/\//u);
      expect(provenance?.reviewedAt).toBe('2026-08-27');
    });

    it(`${ruleCode}: the documented failing case is incompatible`, () => {
      const result = evaluateCompatibility(bike(golden.bikeSpecs), [
        known(ruleCode, golden.failing),
      ]);
      expect(result.status).toBe('incompatible');
      expect(result.checksPerformed[0]).toMatchObject({
        ruleCode,
        status: 'failed',
      });
      expect(result.possibleFix).not.toBeNull();
    });

    for (const missingCode of getCompatibilityRule(ruleCode)
      .requiredBikeSpecCodes) {
      it(`${ruleCode}: missing ${missingCode} returns unknown`, () => {
        const remainingSpecs = Object.fromEntries(
          Object.entries(golden.bikeSpecs).filter(
            ([code]) => code !== missingCode,
          ),
        );
        const result = evaluateCompatibility(bike(remainingSpecs), [
          known(ruleCode, golden.passing),
        ]);
        expect(result.status).toBe('unknown');
        expect(result.checksPerformed[0]?.status).toBe('unknown');
        expect(result.missingInformation).toEqual([
          expect.stringContaining('not recorded'),
        ]);
        expect(result.possibleFix).not.toBeNull();
      });
    }

    it(`${ruleCode}: explicit candidate unknown remains unknown`, () => {
      const result = evaluateCompatibility(bike(golden.bikeSpecs), [
        { ruleCode, knowledge: 'unknown' },
      ]);
      expect(result.status).toBe('unknown');
      expect(result.missingInformation).toEqual([
        expect.stringContaining('is unknown'),
      ]);
    });

    it(`${ruleCode}: invented candidate vocabulary returns unknown`, () => {
      const result = evaluateCompatibility(bike(golden.bikeSpecs), [
        known(ruleCode, 'invented-standard'),
      ]);
      expect(result.status).toBe('unknown');
      expect(result.missingInformation).toEqual([
        expect.stringContaining('not a recognized normalized value'),
      ]);
    });
  }

  for (const rule of COMPATIBILITY_RULES.filter(
    (candidate) =>
      candidate.strategy === 'exact' ||
      candidate.strategy === 'conditional_exact',
  )) {
    const values = getCompatibilityCandidateValues(rule.code);
    for (const bikeOption of values) {
      for (const candidateOption of values) {
        const isConditional =
          (rule.code === 'freehub_cassette' &&
            bikeOption.code === 'xdr' &&
            candidateOption.code === 'xd') ||
          (rule.code === 'brake_mount' &&
            bikeOption.code === 'is_51' &&
            candidateOption.code === 'post_mount');
        const expected = isConditional
          ? 'conditional'
          : bikeOption.code === candidateOption.code
            ? 'compatible'
            : 'incompatible';

        it(`${rule.code}: ${bikeOption.code} -> ${candidateOption.code} is ${expected}`, () => {
          const result = evaluateCompatibility(
            bike({ [rule.bikeSpecCode]: bikeOption.code }),
            [known(rule.code, candidateOption.code)],
          );
          expect(result.status).toBe(expected);
        });
      }
    }
  }

  it('surfaces explicit bike unknown separately from an absent spec', () => {
    const result = evaluateCompatibility(
      { specs: { wheel_size: { knowledge: 'unknown' } } },
      [known('wheel_size', 'iso_622')],
    );
    expect(result.missingInformation).toEqual([
      'Wheel size is recorded as unknown for the bike.',
    ]);
  });

  it('surfaces every missing value when both sides are unknown', () => {
    const result = evaluateCompatibility(
      { specs: { fork_travel_min_mm: { knowledge: 'unknown' } } },
      [{ ruleCode: 'fork_travel', knowledge: 'unknown' }],
    );
    expect(result.missingInformation).toEqual([
      'Minimum approved fork travel is recorded as unknown for the bike.',
      'Maximum approved fork travel is not recorded for the bike.',
      'candidate fork travel is unknown.',
    ]);
  });

  it('does not treat an invented bike value as compatible', () => {
    const result = evaluateCompatibility(
      bike({ wheel_size: 'brand-says-29er' }),
      [known('wheel_size', 'iso_622')],
    );
    expect(result.status).toBe('unknown');
    expect(result.missingInformation[0]).toContain(
      'unrecognized normalized value',
    );
  });

  it('allows an XD cassette on XDR only with the documented spacer', () => {
    const result = evaluateCompatibility(bike({ freehub: 'xdr' }), [
      known('freehub_cassette', 'xd'),
    ]);
    expect(result.status).toBe('conditional');
    expect(result.checksPerformed[0]).toMatchObject({
      status: 'conditional',
      possibleFix: 'Install the manufacturer-specified 1.85 mm spacer.',
    });

    expect(
      evaluateCompatibility(bike({ freehub: 'xd' }), [
        known('freehub_cassette', 'xdr'),
      ]).status,
    ).toBe('incompatible');
  });

  it('requires a documented adapter for IS to Post Mount', () => {
    const result = evaluateCompatibility(bike({ brake_mount: 'is_51' }), [
      known('brake_mount', 'post_mount'),
    ]);
    expect(result.status).toBe('conditional');
    expect(result.possibleFix).toContain('IS-to-Post adapter');
  });

  it.each([
    [
      'fork_travel',
      { fork_travel_min_mm: '100', fork_travel_max_mm: '140' },
      '100',
    ],
    [
      'fork_travel',
      { fork_travel_min_mm: '100', fork_travel_max_mm: '140' },
      '140',
    ],
    ['rotor_diameter', { rotor_min_mm: '160', rotor_max_mm: '203' }, '160'],
    ['rotor_diameter', { rotor_min_mm: '160', rotor_max_mm: '203' }, '203'],
  ] as const)('%s includes its %s boundary', (ruleCode, specs, value) => {
    expect(
      evaluateCompatibility(bike(specs), [known(ruleCode, value)]).status,
    ).toBe('compatible');
  });

  it('returns unknown for an invalid recorded range', () => {
    const result = evaluateCompatibility(
      bike({ fork_travel_min_mm: '140', fork_travel_max_mm: '100' }),
      [known('fork_travel', '120')],
    );
    expect(result.status).toBe('unknown');
    expect(result.missingInformation).toEqual([
      expect.stringContaining('minimum exceeds its maximum'),
    ]);
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

  it('rejects empty and duplicate rule evaluations at the domain boundary', () => {
    expect(() => evaluateCompatibility({ specs: {} }, [])).toThrow(
      'At least one compatibility candidate is required.',
    );
    expect(() =>
      evaluateCompatibility(bike({ wheel_size: 'iso_622' }), [
        known('wheel_size', 'iso_622'),
        known('wheel_size', 'iso_584'),
      ]),
    ).toThrow('Each compatibility rule can only be evaluated once.');
  });

  it('keeps rule input specs inside the normalized bike vocabulary', () => {
    for (const rule of COMPATIBILITY_RULES) {
      for (const code of rule.requiredBikeSpecCodes) {
        expect(code satisfies BikeSpecCode).toBe(code);
      }
      expect(getCompatibilityCandidateValues(rule.code).length).toBeGreaterThan(
        0,
      );
    }
  });
});
