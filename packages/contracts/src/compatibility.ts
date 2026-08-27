import {
  COMPATIBILITY_RULE_CODES,
  getCompatibilityCandidateValues,
} from '@goweskit/bike-domain';
import { z } from 'zod';

export const compatibilityRuleCodeSchema = z.enum(COMPATIBILITY_RULE_CODES);
export type CompatibilityRuleCode = z.infer<typeof compatibilityRuleCodeSchema>;
export const compatibilityStatusSchema = z.enum([
  'compatible',
  'conditional',
  'unknown',
  'incompatible',
]);
export const compatibilityCheckStatusSchema = z.enum([
  'passed',
  'conditional',
  'unknown',
  'failed',
]);
export type CompatibilityStatus = z.infer<typeof compatibilityStatusSchema>;

const unknownCandidateSchema = z.object({ knowledge: z.literal('unknown') });
const candidateFor = <T extends (typeof COMPATIBILITY_RULE_CODES)[number]>(
  ruleCode: T,
) =>
  z.object({
    ruleCode: z.literal(ruleCode),
    knowledge: z.literal('known'),
    value: z
      .string()
      .refine(
        (value) =>
          getCompatibilityCandidateValues(ruleCode).some(
            (option) => option.code === value,
          ),
        `Value is not part of the normalized ${ruleCode} vocabulary.`,
      ),
  });

export const compatibilityCandidateSchema = z.union([
  candidateFor('wheel_size'),
  candidateFor('front_axle'),
  candidateFor('rear_axle'),
  candidateFor('freehub_cassette'),
  candidateFor('drivetrain_speeds'),
  candidateFor('drivetrain_family'),
  candidateFor('fork_steerer'),
  candidateFor('headset_interface'),
  candidateFor('bottom_bracket_shell'),
  candidateFor('crank_spindle'),
  candidateFor('fork_travel'),
  candidateFor('brake_mount'),
  candidateFor('rotor_diameter'),
  candidateFor('seatpost_diameter'),
  candidateFor('tire_clearance'),
  z.object({
    ruleCode: compatibilityRuleCodeSchema,
    ...unknownCandidateSchema.shape,
  }),
]);

export type CompatibilityCandidateInput = z.infer<
  typeof compatibilityCandidateSchema
>;

export const compatibilityEvaluateRequestSchema = z.object({
  bikeId: z.uuid(),
  candidates: z
    .array(compatibilityCandidateSchema)
    .min(1)
    .max(COMPATIBILITY_RULE_CODES.length)
    .refine(
      (candidates) =>
        new Set(candidates.map((candidate) => candidate.ruleCode)).size ===
        candidates.length,
      'Each compatibility rule can only be evaluated once.',
    ),
});

export type CompatibilityEvaluateRequest = z.infer<
  typeof compatibilityEvaluateRequestSchema
>;

export const ruleProvenanceSchema = z.object({
  ruleCode: compatibilityRuleCodeSchema,
  ruleVersion: z.string(),
  sourceTitle: z.string(),
  sourceUrl: z.url(),
  reviewedAt: z.iso.date(),
});

export const compatibilityCheckSchema = z.object({
  ruleCode: compatibilityRuleCodeSchema,
  label: z.string(),
  status: compatibilityCheckStatusSchema,
  bikeValue: z.string().nullable(),
  candidateValue: z.string().nullable(),
  humanExplanation: z.string(),
  technicalExplanation: z.string(),
  possibleFix: z.string().nullable(),
  provenance: ruleProvenanceSchema,
});

export const compatibilityEvaluationSchema = z.object({
  status: compatibilityStatusSchema,
  checksPerformed: z.array(compatibilityCheckSchema),
  missingInformation: z.array(z.string()),
  humanExplanation: z.string(),
  technicalExplanation: z.string(),
  possibleFix: z.string().nullable(),
  ruleProvenance: z.array(ruleProvenanceSchema),
});

export type CompatibilityEvaluationResponse = z.infer<
  typeof compatibilityEvaluationSchema
>;

export const compatibilityRuleSchema = z.object({
  code: compatibilityRuleCodeSchema,
  label: z.string(),
  bikeSpecCode: z.string(),
  candidateLabel: z.string(),
  values: z.array(z.object({ code: z.string(), label: z.string() })),
  provenance: ruleProvenanceSchema,
});

export type CompatibilityRule = z.infer<typeof compatibilityRuleSchema>;

export const compatibilityRuleListResponseSchema = z.object({
  rules: z.array(compatibilityRuleSchema),
});
export type CompatibilityRuleListResponse = z.infer<
  typeof compatibilityRuleListResponseSchema
>;
