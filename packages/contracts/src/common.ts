import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'AUTH_EMAIL_EXISTS',
  'AUTH_GOOGLE_ACCOUNT_CONFLICT',
  'AUTH_GOOGLE_INVALID',
  'AUTH_GOOGLE_LINK_REQUIRED',
  'AUTH_GOOGLE_UNAVAILABLE',
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_REQUIRED',
  'AUTH_SESSION_EXPIRED',
  'BIKE_NOT_FOUND',
  'BIKE_PHOTO_DELETE_FAILED',
  'BIKE_PHOTO_STORAGE_UNAVAILABLE',
  'BIKE_PHOTO_UPLOAD_FAILED',
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
  'OTP_RATE_LIMITED',
  'OTP_NOT_FOUND',
  'OTP_EXPIRED',
  'OTP_MAX_ATTEMPTS_EXCEEDED',
  'OTP_INVALID',
  'OTP_UNAVAILABLE',
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
