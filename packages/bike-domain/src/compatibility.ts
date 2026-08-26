import { getStandardValueLabel, type BikeSpecCode } from './standards.js';

export const COMPATIBILITY_RULE_CODES = [
  'wheel_size',
  'front_axle',
  'rear_axle',
  'freehub_cassette',
  'drivetrain_speeds',
  'fork_steerer',
] as const;

export type CompatibilityRuleCode = (typeof COMPATIBILITY_RULE_CODES)[number];
export type CompatibilityStatus =
  'compatible' | 'conditional' | 'unknown' | 'incompatible';
export type CompatibilityCheckStatus =
  'passed' | 'conditional' | 'unknown' | 'failed';

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
  candidateLabel: string;
  provenance: RuleProvenance;
}

export const COMPATIBILITY_RULES = [
  {
    code: 'wheel_size',
    label: 'Wheel size',
    bikeSpecCode: 'wheel_size',
    candidateLabel: 'candidate wheel size',
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
    candidateLabel: 'candidate front hub axle',
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
    candidateLabel: 'candidate rear hub axle',
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
    candidateLabel: 'candidate cassette interface',
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
    candidateLabel: 'candidate drivetrain speed count',
    provenance: {
      ruleCode: 'drivetrain_speeds',
      ruleVersion: '1.0.0',
      sourceTitle: 'Shimano product compatibility information',
      sourceUrl: 'https://productinfo.shimano.com/en/compatibility',
      reviewedAt: '2026-08-27',
    },
  },
  {
    code: 'fork_steerer',
    label: 'Fork steerer',
    bikeSpecCode: 'fork_steerer',
    candidateLabel: 'candidate fork steerer',
    provenance: {
      ruleCode: 'fork_steerer',
      ruleVersion: '1.0.0',
      sourceTitle: 'Cane Creek headset identification guide',
      sourceUrl:
        'https://canecreek.com/everything-you-need-to-know-about-headsets/',
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

function unknownCheck(
  rule: CompatibilityRuleDefinition,
  bikeValue: KnownOrUnknownValue | undefined,
  candidate: CompatibilityCandidate,
): { check: CompatibilityCheck; missing: string[] } {
  const missing: string[] = [];
  if (bikeValue === undefined)
    missing.push(`${rule.label} is not recorded for the bike.`);
  else if (bikeValue.knowledge === 'unknown')
    missing.push(`${rule.label} is recorded as unknown for the bike.`);
  if (candidate.knowledge === 'unknown')
    missing.push(`${rule.candidateLabel} is unknown.`);

  return {
    missing,
    check: {
      ruleCode: rule.code,
      label: rule.label,
      status: 'unknown',
      bikeValue: bikeValue?.knowledge === 'known' ? bikeValue.value : null,
      candidateValue: candidate.knowledge === 'known' ? candidate.value : null,
      humanExplanation: `There is not enough information to decide ${rule.label.toLowerCase()} compatibility.`,
      technicalExplanation: missing.join(' '),
      possibleFix: `Confirm both the bike's ${rule.label.toLowerCase()} and the ${rule.candidateLabel}.`,
      provenance: rule.provenance,
    },
  };
}

function compareKnown(
  rule: CompatibilityRuleDefinition,
  bikeValue: string,
  candidateValue: string,
): CompatibilityCheck {
  const bikeLabel = getStandardValueLabel(rule.bikeSpecCode, bikeValue);
  const candidateLabel = getStandardValueLabel(
    rule.bikeSpecCode,
    candidateValue,
  );

  if (
    rule.code === 'freehub_cassette' &&
    bikeValue === 'xdr' &&
    candidateValue === 'xd'
  ) {
    return {
      ruleCode: rule.code,
      label: rule.label,
      status: 'conditional',
      bikeValue,
      candidateValue,
      humanExplanation:
        'The cassette can fit this freehub when the specified spacer is used.',
      technicalExplanation:
        'An XD cassette is 1.85 mm shorter at the freehub interface than an XDR cassette position.',
      possibleFix: 'Install the manufacturer-specified 1.85 mm spacer.',
      provenance: rule.provenance,
    };
  }

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
      : `Choose a component matching ${bikeLabel}, or use a manufacturer-approved conversion where one exists.`,
    provenance: rule.provenance,
  };
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
  const checks: CompatibilityCheck[] = [];
  const missingInformation: string[] = [];

  for (const candidate of candidates) {
    const rule = getCompatibilityRule(candidate.ruleCode);
    const bikeValue = bike.specs[rule.bikeSpecCode];
    if (
      bikeValue === undefined ||
      bikeValue.knowledge === 'unknown' ||
      candidate.knowledge === 'unknown'
    ) {
      const unknown = unknownCheck(rule, bikeValue, candidate);
      checks.push(unknown.check);
      missingInformation.push(...unknown.missing);
    } else {
      checks.push(compareKnown(rule, bikeValue.value, candidate.value));
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
