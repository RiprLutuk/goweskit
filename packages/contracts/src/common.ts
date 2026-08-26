import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'AUTH_EMAIL_EXISTS',
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_REQUIRED',
  'AUTH_SESSION_EXPIRED',
  'BIKE_NOT_FOUND',
  'BICYCLE_TYPE_NOT_FOUND',
  'COMPONENT_CATEGORY_NOT_FOUND',
  'COMPATIBILITY_RULE_NOT_FOUND',
  'INVALID_REQUEST',
  'INVALID_STANDARD_VALUE',
  'INTERNAL_ERROR',
]);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.record(z.string(), z.unknown()),
  }),
  requestId: z.string(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

export const successResponseSchema = z.object({ success: z.literal(true) });
export type SuccessResponse = z.infer<typeof successResponseSchema>;
