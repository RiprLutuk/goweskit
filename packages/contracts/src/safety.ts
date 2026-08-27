import { z } from 'zod';

export const SAFETY_SESSION_STATUSES = [
  'active',
  'sos',
  'ended',
  'revoked',
  'expired',
] as const;

export const SAFETY_SHARE_TOKEN_BYTES = 32;
export const SAFETY_SHARE_TOKEN_LENGTH = 43;
export const SAFETY_SHARE_MIN_DURATION_MINUTES = 15;
export const SAFETY_SHARE_MAX_DURATION_MINUTES = 24 * 60;
export const SAFETY_LOCATION_MAX_ACCURACY_METERS = 10_000;

export const SAFETY_DISCLAIMER = {
  code: 'NOT_AN_EMERGENCY_SERVICE',
  message:
    'GowesKit shares last-known ride information with the holder of this private link. It does not contact or dispatch emergency services.',
  emergencyDispatchProvided: false,
} as const;

export const safetySessionStatusSchema = z.enum(SAFETY_SESSION_STATUSES);
export type SafetySessionStatus = z.infer<typeof safetySessionStatusSchema>;

export const safetyShareTokenSchema = z
  .string()
  .length(SAFETY_SHARE_TOKEN_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/u);

export const safetyDisclaimerSchema = z
  .object({
    code: z.literal(SAFETY_DISCLAIMER.code),
    message: z.literal(SAFETY_DISCLAIMER.message),
    emergencyDispatchProvided: z.literal(false),
  })
  .strict();

export const startSafetySessionRequestSchema = z
  .object({
    trustedContactId: z.uuid(),
    expectedEndAt: z.iso.datetime().nullable().optional(),
    shareDurationMinutes: z
      .number()
      .int()
      .min(SAFETY_SHARE_MIN_DURATION_MINUTES)
      .max(SAFETY_SHARE_MAX_DURATION_MINUTES),
    note: z.string().trim().max(500).nullable().optional(),
    explicitLocationConsent: z.literal(true),
    disclaimerAcknowledged: z.literal(true),
  })
  .strict();
export type StartSafetySessionRequest = z.infer<
  typeof startSafetySessionRequestSchema
>;

export const safetyCoordinateSchema = z
  .object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
  })
  .strict();

export const safetyLocationUpdateRequestSchema = z
  .object({
    coordinate: safetyCoordinateSchema,
    accuracyMeters: z
      .number()
      .nonnegative()
      .max(SAFETY_LOCATION_MAX_ACCURACY_METERS),
    batteryPercent: z.number().min(0).max(100).nullable().optional(),
  })
  .strict();
export type SafetyLocationUpdateRequest = z.infer<
  typeof safetyLocationUpdateRequestSchema
>;

export const safetyLocationSchema = safetyLocationUpdateRequestSchema
  .extend({
    recordedAt: z.iso.datetime(),
  })
  .strict();
export type SafetyLocation = z.infer<typeof safetyLocationSchema>;

export const safetySessionSchema = z
  .object({
    id: z.uuid(),
    status: safetySessionStatusSchema,
    startedAt: z.iso.datetime(),
    expectedEndAt: z.iso.datetime().nullable(),
    endedAt: z.iso.datetime().nullable(),
    shareExpiresAt: z.iso.datetime(),
    sosTriggeredAt: z.iso.datetime().nullable(),
    note: z.string().nullable(),
    lastLocation: safetyLocationSchema.nullable(),
  })
  .strict();
export type SafetySession = z.infer<typeof safetySessionSchema>;

export const createSafetySessionResponseSchema = z
  .object({
    session: safetySessionSchema,
    shareToken: safetyShareTokenSchema,
    disclaimer: safetyDisclaimerSchema,
  })
  .strict();
export type CreateSafetySessionResponse = z.infer<
  typeof createSafetySessionResponseSchema
>;

export const safetyShareResponseSchema = z
  .object({
    riderDisplayName: z.string().trim().min(1).max(80),
    status: safetySessionStatusSchema,
    startedAt: z.iso.datetime(),
    expectedEndAt: z.iso.datetime().nullable(),
    endedAt: z.iso.datetime().nullable(),
    shareExpiresAt: z.iso.datetime(),
    sosTriggeredAt: z.iso.datetime().nullable(),
    lastLocation: safetyLocationSchema.nullable(),
    locationIsLive: z.literal(false),
    disclaimer: safetyDisclaimerSchema,
  })
  .strict();
export type SafetyShareResponse = z.infer<typeof safetyShareResponseSchema>;
