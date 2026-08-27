import {
  getBikeSpecDefinition,
  getStandardValueLabel,
  isAllowedStandardValue,
  type BikeSpecCode,
  type StandardValueOption,
} from './standards.js';

export const COMPATIBILITY_RULE_CODES = [
  'wheel_size',
  'front_axle',
  'rear_axle',
  'freehub_cassette',
  'drivetrain_speeds',
  'drivetrain_family',
  'fork_steerer',
  'headset_interface',
  'bottom_bracket_shell',
  'crank_spindle',
  'fork_travel',
  'brake_mount',
  'rotor_diameter',
  'seatpost_diameter',
  'tire_clearance',
] as const;

export type CompatibilityRuleCode = (typeof COMPATIBILITY_RULE_CODES)[number];
export type CompatibilityStatus =
  'compatible' | 'conditional' | 'unknown' | 'incompatible';
export type CompatibilityCheckStatus =
  'passed' | 'conditional' | 'unknown' | 'failed';
export type CompatibilityRuleStrategy =
  'exact' | 'conditional_exact' | 'inclusive_range' | 'maximum';

export interface RuleProvenance {
  ruleCode: CompatibilityRuleCode;
  ruleVersion: string;
  sourceTitle: string;
  sourceUrl: string;
  reviewedAt: string;
}

export interface CompatibilityRuleDefinition {
  code: CompatibilityRuleCode;
  label: string;
  bikeSpecCode: BikeSpecCode;
  requiredBikeSpecCodes: readonly BikeSpecCode[];
  candidateLabel: string;
  strategy: CompatibilityRuleStrategy;
  provenance: RuleProvenance;
}

export const COMPATIBILITY_RULES = [
  {
    code: 'wheel_size',
    label: 'Wheel size',
    bikeSpecCode: 'wheel_size',
    requiredBikeSpecCodes: ['wheel_size'],
    candidateLabel: 'candidate wheel size',
    strategy: 'exact',
    provenance: {
      ruleCode: 'wheel_size',
      ruleVersion: '1.0.0',
      sourceTitle: 'ISO 5775-1:2023 — Bicycle tyres and rims',
      sourceUrl: 'https://www.iso.org/standard/80740.html',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'front_axle',
    label: 'Front axle',
    bikeSpecCode: 'front_axle',
    requiredBikeSpecCodes: ['front_axle'],
    candidateLabel: 'candidate front hub axle',
    strategy: 'exact',
    provenance: {
      ruleCode: 'front_axle',
      ruleVersion: '1.0.0',
      sourceTitle: 'SRAM MTB hub, fork, wheel and end-cap compatibility map',
      sourceUrl:
        'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb/mtb-hubforkwheelend-cap-compatibilty-.pdf',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'rear_axle',
    label: 'Rear axle',
    bikeSpecCode: 'rear_axle',
    requiredBikeSpecCodes: ['rear_axle'],
    candidateLabel: 'candidate rear hub axle',
    strategy: 'exact',
    provenance: {
      ruleCode: 'rear_axle',
      ruleVersion: '1.0.0',
      sourceTitle: 'SRAM MTB hub, fork, wheel and end-cap compatibility map',
      sourceUrl:
        'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb/mtb-hubforkwheelend-cap-compatibilty-.pdf',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'freehub_cassette',
    label: 'Freehub and cassette interface',
    bikeSpecCode: 'freehub',
    requiredBikeSpecCodes: ['freehub'],
    candidateLabel: 'candidate cassette interface',
    strategy: 'conditional_exact',
    provenance: {
      ruleCode: 'freehub_cassette',
      ruleVersion: '1.0.0',
      sourceTitle: 'SRAM 2021 MTB components compatibility map',
      sourceUrl:
        'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb/2021-mtb-components-compatibility-map.pdf',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'drivetrain_speeds',
    label: 'Drivetrain speeds',
    bikeSpecCode: 'drivetrain_speeds',
    requiredBikeSpecCodes: ['drivetrain_speeds'],
    candidateLabel: 'candidate drivetrain speed count',
    strategy: 'exact',
    provenance: {
      ruleCode: 'drivetrain_speeds',
      ruleVersion: '1.0.0',
      sourceTitle: 'Shimano product compatibility information',
      sourceUrl: 'https://productinfo.shimano.com/en/compatibility',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'drivetrain_family',
    label: 'Drivetrain family',
    bikeSpecCode: 'drivetrain_family',
    requiredBikeSpecCodes: ['drivetrain_family'],
    candidateLabel: 'candidate drivetrain family',
    strategy: 'exact',
    provenance: {
      ruleCode: 'drivetrain_family',
      ruleVersion: '1.0.0',
      sourceTitle: 'Shimano drivetrain compatibility charts',
      sourceUrl: 'https://productinfo.shimano.com/en/compatibility',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'fork_steerer',
    label: 'Fork steerer',
    bikeSpecCode: 'fork_steerer',
    requiredBikeSpecCodes: ['fork_steerer'],
    candidateLabel: 'candidate fork steerer',
    strategy: 'exact',
    provenance: {
      ruleCode: 'fork_steerer',
      ruleVersion: '1.0.0',
      sourceTitle: 'Cane Creek headset identification guide',
      sourceUrl:
        'https://www.canecreek.com/pages/everything-you-need-to-know-about-headsets',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'headset_interface',
    label: 'Headset interface',
    bikeSpecCode: 'headset_interface',
    requiredBikeSpecCodes: ['headset_interface'],
    candidateLabel: 'candidate headset SHIS interface',
    strategy: 'exact',
    provenance: {
      ruleCode: 'headset_interface',
      ruleVersion: '1.0.0',
      sourceTitle: 'Cane Creek headset and SHIS identification guide',
      sourceUrl:
        'https://www.canecreek.com/pages/the-ultimate-guide-to-identifying-and-choosing-a-bicycle-headset',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'bottom_bracket_shell',
    label: 'Bottom bracket shell',
    bikeSpecCode: 'bottom_bracket_shell',
    requiredBikeSpecCodes: ['bottom_bracket_shell'],
    candidateLabel: 'candidate bottom bracket frame interface',
    strategy: 'exact',
    provenance: {
      ruleCode: 'bottom_bracket_shell',
      ruleVersion: '1.0.0',
      sourceTitle: 'Park Tool bottom bracket standards and identification',
      sourceUrl:
        'https://www.parktool.com/en-int/blog/repair-help/bottom-bracket-identification',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'crank_spindle',
    label: 'Crank and bottom bracket spindle',
    bikeSpecCode: 'bottom_bracket_spindle',
    requiredBikeSpecCodes: ['bottom_bracket_spindle'],
    candidateLabel: 'candidate crank spindle interface',
    strategy: 'exact',
    provenance: {
      ruleCode: 'crank_spindle',
      ruleVersion: '1.0.0',
      sourceTitle: 'Park Tool press-fit bottom bracket spindle guide',
      sourceUrl:
        'https://www.parktool.com/en-us/blog/repair-help/bottom-bracket-tool-selection-press-fit',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'fork_travel',
    label: 'Fork travel',
    bikeSpecCode: 'fork_travel_max_mm',
    requiredBikeSpecCodes: ['fork_travel_min_mm', 'fork_travel_max_mm'],
    candidateLabel: 'candidate fork travel',
    strategy: 'inclusive_range',
    provenance: {
      ruleCode: 'fork_travel',
      ruleVersion: '1.0.0',
      sourceTitle: 'RockShox frame and fork compatibility guidance',
      sourceUrl:
        'https://support.rockshox.com/hc/en-us/articles/4412334176027-My-frame-came-with-a-rigid-fork-Will-adding-a-RockShox-Rudy-XPLR-void-the-warranty-on-my-frame',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'brake_mount',
    label: 'Brake mount',
    bikeSpecCode: 'brake_mount',
    requiredBikeSpecCodes: ['brake_mount'],
    candidateLabel: 'candidate brake caliper mount',
    strategy: 'conditional_exact',
    provenance: {
      ruleCode: 'brake_mount',
      ruleVersion: '1.0.0',
      sourceTitle: 'Shimano disc brake installation dealer manual',
      sourceUrl: 'https://si.shimano.com/en/pdfs/dm/TRBR001/DM-TRBR001.pdf',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'rotor_diameter',
    label: 'Brake rotor diameter',
    bikeSpecCode: 'rotor_max_mm',
    requiredBikeSpecCodes: ['rotor_min_mm', 'rotor_max_mm'],
    candidateLabel: 'candidate rotor diameter',
    strategy: 'inclusive_range',
    provenance: {
      ruleCode: 'rotor_diameter',
      ruleVersion: '1.0.0',
      sourceTitle: 'Shimano disc brake rotor adapter manual',
      sourceUrl: 'https://si.shimano.com/en/pdfs/um/8L10A/UM-8L10A.pdf',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'seatpost_diameter',
    label: 'Seatpost diameter',
    bikeSpecCode: 'seatpost_diameter_mm',
    requiredBikeSpecCodes: ['seatpost_diameter_mm'],
    candidateLabel: 'candidate round seatpost diameter',
    strategy: 'exact',
    provenance: {
      ruleCode: 'seatpost_diameter',
      ruleVersion: '1.0.0',
      sourceTitle: 'Park Tool seatpost compatibility guide',
      sourceUrl:
        'https://www.parktool.com/en-us/blog/repair-help/how-to-remove-and-install-a-seatpost',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'tire_clearance',
    label: 'Tire clearance',
    bikeSpecCode: 'tire_clearance_max_mm',
    requiredBikeSpecCodes: ['tire_clearance_max_mm'],
    candidateLabel: 'candidate nominal tire width',
    strategy: 'maximum',
    provenance: {
      ruleCode: 'tire_clearance',
      ruleVersion: '1.0.0',
      sourceTitle: 'Schwalbe bicycle tire dimensions technical information',
      sourceUrl:
        'https://www.schwalbe.com/media/32/85/58/1694006374/Schwalbe-TechInfo-2015_GB.pdf',
      reviewedAt: '2026-08-27',
    },
  },
] as const satisfies readonly CompatibilityRuleDefinition[];

export type KnownOrUnknownValue =
  { knowledge: 'known'; value: string } | { knowledge: 'unknown' };

export type CompatibilityCandidate = KnownOrUnknownValue & {
  ruleCode: CompatibilityRuleCode;
};

export interface CompatibilityBike {
  specs: Partial<Record<BikeSpecCode, KnownOrUnknownValue>>;
}

export interface CompatibilityCheck {
  ruleCode: CompatibilityRuleCode;
  label: string;
  status: CompatibilityCheckStatus;
  bikeValue: string | null;
  candidateValue: string | null;
  humanExplanation: string;
  technicalExplanation: string;
  possibleFix: string | null;
  provenance: RuleProvenance;
}

export interface CompatibilityEvaluation {
  status: CompatibilityStatus;
  checksPerformed: CompatibilityCheck[];
  missingInformation: string[];
  humanExplanation: string;
  technicalExplanation: string;
  possibleFix: string | null;
  ruleProvenance: RuleProvenance[];
}

export function getCompatibilityRule(
  code: CompatibilityRuleCode,
): CompatibilityRuleDefinition {
  const rule = COMPATIBILITY_RULES.find((item) => item.code === code);
  if (rule === undefined)
    throw new Error(`Unknown compatibility rule: ${code}`);
  return rule;
}

export function getCompatibilityCandidateValues(
  code: CompatibilityRuleCode,
): readonly StandardValueOption[] {
  const rule = getCompatibilityRule(code);
  return getBikeSpecDefinition(rule.bikeSpecCode)?.values ?? [];
}

function specLabel(code: BikeSpecCode): string {
  return getBikeSpecDefinition(code)?.label ?? code;
}

function collectMissingInformation(
  rule: CompatibilityRuleDefinition,
  bike: CompatibilityBike,
  candidate: CompatibilityCandidate,
): string[] {
  const missing: string[] = [];

  for (const code of rule.requiredBikeSpecCodes) {
    const bikeValue = bike.specs[code];
    if (bikeValue === undefined) {
      missing.push(`${specLabel(code)} is not recorded for the bike.`);
    } else if (bikeValue.knowledge === 'unknown') {
      missing.push(`${specLabel(code)} is recorded as unknown for the bike.`);
    } else if (!isAllowedStandardValue(code, bikeValue.value)) {
      missing.push(`${specLabel(code)} has an unrecognized normalized value.`);
    }
  }

  if (candidate.knowledge === 'unknown') {
    missing.push(`${rule.candidateLabel} is unknown.`);
  } else if (
    !getCompatibilityCandidateValues(rule.code).some(
      (option) => option.code === candidate.value,
    )
  ) {
    missing.push(
      `${rule.candidateLabel} is not a recognized normalized value.`,
    );
  }

  return missing;
}

function unknownCheck(
  rule: CompatibilityRuleDefinition,
  bike: CompatibilityBike,
  candidate: CompatibilityCandidate,
  missing: string[],
): CompatibilityCheck {
  const primaryBikeValue = bike.specs[rule.bikeSpecCode];
  return {
    ruleCode: rule.code,
    label: rule.label,
    status: 'unknown',
    bikeValue:
      primaryBikeValue?.knowledge === 'known' ? primaryBikeValue.value : null,
    candidateValue: candidate.knowledge === 'known' ? candidate.value : null,
    humanExplanation: `There is not enough verified information to decide ${rule.label.toLowerCase()} compatibility.`,
    technicalExplanation: missing.join(' '),
    possibleFix: `Confirm ${missing.join(' ')}`,
    provenance: rule.provenance,
  };
}

interface ConditionalMatch {
  humanExplanation: string;
  technicalExplanation: string;
  possibleFix: string;
}

function conditionalMatch(
  rule: CompatibilityRuleDefinition,
  bikeValue: string,
  candidateValue: string,
): ConditionalMatch | null {
  if (
    rule.code === 'freehub_cassette' &&
    bikeValue === 'xdr' &&
    candidateValue === 'xd'
  ) {
    return {
      humanExplanation:
        'The cassette can fit this freehub when the specified spacer is used.',
      technicalExplanation:
        'An XD cassette is 1.85 mm shorter at the freehub interface than an XDR cassette position.',
      possibleFix: 'Install the manufacturer-specified 1.85 mm spacer.',
    };
  }

  if (
    rule.code === 'brake_mount' &&
    bikeValue === 'is_51' &&
    candidateValue === 'post_mount'
  ) {
    return {
      humanExplanation:
        'The Post Mount caliper can attach to this IS mount with the correct documented adapter.',
      technicalExplanation:
        'The frame/fork uses IS 51 mm tabs while the caliper uses Post Mount; these interfaces require a rotor-size-specific adapter.',
      possibleFix:
        'Use the brake manufacturer’s IS-to-Post adapter specified for the chosen rotor diameter.',
    };
  }

  return null;
}

function compareExact(
  rule: CompatibilityRuleDefinition,
  bikeValue: string,
  candidateValue: string,
): CompatibilityCheck {
  const conditional = conditionalMatch(rule, bikeValue, candidateValue);
  if (conditional !== null) {
    return {
      ruleCode: rule.code,
      label: rule.label,
      status: 'conditional',
      bikeValue,
      candidateValue,
      ...conditional,
      provenance: rule.provenance,
    };
  }

  const bikeLabel = getStandardValueLabel(rule.bikeSpecCode, bikeValue);
  const candidateLabel = getStandardValueLabel(
    rule.bikeSpecCode,
    candidateValue,
  );
  const matches = bikeValue === candidateValue;
  return {
    ruleCode: rule.code,
    label: rule.label,
    status: matches ? 'passed' : 'failed',
    bikeValue,
    candidateValue,
    humanExplanation: matches
      ? `${candidateLabel} matches the bike.`
      : `${candidateLabel} does not match the bike's ${bikeLabel}.`,
    technicalExplanation: matches
      ? `Normalized values match: ${bikeValue}.`
      : `Normalized values differ: bike=${bikeValue}, candidate=${candidateValue}.`,
    possibleFix: matches
      ? null
      : `Choose a component matching ${bikeLabel}, or use only a conversion explicitly approved by the component and frame manufacturers.`,
    provenance: rule.provenance,
  };
}

function compareRange(
  rule: CompatibilityRuleDefinition,
  bike: CompatibilityBike,
  candidateValue: string,
): CompatibilityCheck {
  const [minimumCode, maximumCode] = rule.requiredBikeSpecCodes;
  if (minimumCode === undefined || maximumCode === undefined) {
    throw new Error(`Range rule ${rule.code} is missing its range specs.`);
  }
  const minimumValue = bike.specs[minimumCode];
  const maximumValue = bike.specs[maximumCode];
  if (
    minimumValue?.knowledge !== 'known' ||
    maximumValue?.knowledge !== 'known'
  ) {
    throw new Error(`Range rule ${rule.code} received unresolved specs.`);
  }

  const minimum = Number(minimumValue.value);
  const maximum = Number(maximumValue.value);
  const candidate = Number(candidateValue);
  if (minimum > maximum) {
    const missing = [
      `${rule.label} range is invalid because its minimum exceeds its maximum.`,
    ];
    return unknownCheck(
      rule,
      bike,
      { ruleCode: rule.code, knowledge: 'known', value: candidateValue },
      missing,
    );
  }

  const matches = candidate >= minimum && candidate <= maximum;
  return {
    ruleCode: rule.code,
    label: rule.label,
    status: matches ? 'passed' : 'failed',
    bikeValue: `${String(minimum)}–${String(maximum)}`,
    candidateValue,
    humanExplanation: matches
      ? `${candidateValue} mm is inside the bike's documented ${String(minimum)}–${String(maximum)} mm range.`
      : `${candidateValue} mm is outside the bike's documented ${String(minimum)}–${String(maximum)} mm range.`,
    technicalExplanation: `Inclusive range check: ${String(minimum)} <= ${candidateValue} <= ${String(maximum)} is ${matches ? 'true' : 'false'}.`,
    possibleFix: matches
      ? null
      : `Choose a value from ${String(minimum)} to ${String(maximum)} mm, or confirm a different approved range with the frame or fork manufacturer.`,
    provenance: rule.provenance,
  };
}

function compareMaximum(
  rule: CompatibilityRuleDefinition,
  bikeValue: string,
  candidateValue: string,
): CompatibilityCheck {
  const maximum = Number(bikeValue);
  const candidate = Number(candidateValue);
  const matches = candidate <= maximum;
  return {
    ruleCode: rule.code,
    label: rule.label,
    status: matches ? 'passed' : 'failed',
    bikeValue,
    candidateValue,
    humanExplanation: matches
      ? `${candidateValue} mm does not exceed the bike's documented ${bikeValue} mm limit.`
      : `${candidateValue} mm exceeds the bike's documented ${bikeValue} mm limit.`,
    technicalExplanation: `Maximum check: ${candidateValue} <= ${bikeValue} is ${matches ? 'true' : 'false'}.`,
    possibleFix: matches
      ? null
      : `Choose a tire no wider than the documented ${bikeValue} mm limit and verify its measured clearance after mounting.`,
    provenance: rule.provenance,
  };
}

function evaluateKnown(
  rule: CompatibilityRuleDefinition,
  bike: CompatibilityBike,
  candidateValue: string,
): CompatibilityCheck {
  const primaryBikeValue = bike.specs[rule.bikeSpecCode];
  if (primaryBikeValue?.knowledge !== 'known') {
    throw new Error(`Rule ${rule.code} received an unresolved primary spec.`);
  }

  if (rule.strategy === 'inclusive_range') {
    return compareRange(rule, bike, candidateValue);
  }
  if (rule.strategy === 'maximum') {
    return compareMaximum(rule, primaryBikeValue.value, candidateValue);
  }
  return compareExact(rule, primaryBikeValue.value, candidateValue);
}

function overallStatus(checks: CompatibilityCheck[]): CompatibilityStatus {
  if (checks.some((check) => check.status === 'failed')) return 'incompatible';
  if (checks.some((check) => check.status === 'unknown')) return 'unknown';
  if (checks.some((check) => check.status === 'conditional'))
    return 'conditional';
  return 'compatible';
}

const STATUS_EXPLANATIONS: Record<CompatibilityStatus, string> = {
  compatible: 'The checked standards match.',
  conditional:
    'The checked standards can work, but a stated condition must be met.',
  unknown:
    'Compatibility cannot be decided until the missing information is confirmed.',
  incompatible: 'At least one checked standard does not match.',
};

export function evaluateCompatibility(
  bike: CompatibilityBike,
  candidates: readonly CompatibilityCandidate[],
): CompatibilityEvaluation {
  if (candidates.length === 0) {
    throw new Error('At least one compatibility candidate is required.');
  }
  if (
    new Set(candidates.map((candidate) => candidate.ruleCode)).size !==
    candidates.length
  ) {
    throw new Error('Each compatibility rule can only be evaluated once.');
  }

  const checks: CompatibilityCheck[] = [];
  const missingInformation: string[] = [];

  for (const candidate of candidates) {
    const rule = getCompatibilityRule(candidate.ruleCode);
    const missing = collectMissingInformation(rule, bike, candidate);
    if (missing.length > 0 || candidate.knowledge === 'unknown') {
      checks.push(unknownCheck(rule, bike, candidate, missing));
      missingInformation.push(...missing);
    } else {
      checks.push(evaluateKnown(rule, bike, candidate.value));
      const check = checks.at(-1);
      if (check?.status === 'unknown') {
        const rangeIssue = check.technicalExplanation;
        missingInformation.push(rangeIssue);
      }
    }
  }

  const status = overallStatus(checks);
  const fixes = checks
    .map((check) => check.possibleFix)
    .filter((fix): fix is string => fix !== null);
  return {
    status,
    checksPerformed: checks,
    missingInformation: [...new Set(missingInformation)],
    humanExplanation: STATUS_EXPLANATIONS[status],
    technicalExplanation: checks
      .map((check) => `${check.label}: ${check.technicalExplanation}`)
      .join(' '),
    possibleFix: fixes.length === 0 ? null : fixes.join(' '),
    ruleProvenance: checks.map((check) => check.provenance),
  };
}
