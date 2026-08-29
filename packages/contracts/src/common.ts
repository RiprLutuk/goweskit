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
  'COMMUNITY_NOT_FOUND',
  'COMMUNITY_FORBIDDEN',
  'COMMUNITY_MEMBERSHIP_NOT_FOUND',
  'COMMUNITY_MEMBERSHIP_REQUIRED',
  'CONTRIBUTION_NOT_FOUND',
  'GPX_IMPORT_INVALID',
  'GPX_IMPORT_TOO_LARGE',
  'INVALID_EXPLORE_CONTRIBUTION',
  'INVALID_MODERATION_TRANSITION',
  'INVALID_BICYCLE_TYPES',
  'MODERATOR_REQUIRED',
  'PLACE_NOT_FOUND',
  'RATE_LIMITED',
  'ROUTE_NOT_FOUND',
  'ROUTE_ELEVATION_NOT_AVAILABLE',
  'RIDE_EVENT_NOT_FOUND',
  'RIDE_EVENT_START_INVALID',
  'INVALID_REQUEST',
  'INVALID_STANDARD_VALUE',
  'INSTALLED_COMPONENT_NOT_FOUND',
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
