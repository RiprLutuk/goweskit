import { z } from 'zod';

export const CONTRIBUTION_MODERATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;
export const ROUTE_REPORT_TYPES = [
  'condition',
  'closure',
  'incorrect_route',
  'difficulty',
  'other',
] as const;
export const HAZARD_TYPES = [
  'road_damage',
  'trail_obstruction',
  'traffic',
  'construction',
  'flooding',
  'animal',
  'other',
] as const;
export const HAZARD_SEVERITIES = ['info', 'caution', 'danger'] as const;

export const GPX_MAX_FILE_BYTES = 2_000_000;
export const GPX_MIN_POINTS = 2;
export const GPX_MAX_POINTS = 10_000;

export const contributionModerationStatusSchema = z.enum(
  CONTRIBUTION_MODERATION_STATUSES,
);
export const routeReportTypeSchema = z.enum(ROUTE_REPORT_TYPES);
export const hazardTypeSchema = z.enum(HAZARD_TYPES);
export const hazardSeveritySchema = z.enum(HAZARD_SEVERITIES);

const contributionNotesSchema = z.string().trim().min(1).max(1_000);
const contributionSubmissionFields = {
  id: z.uuid(),
  moderationStatus: contributionModerationStatusSchema,
  createdAt: z.iso.datetime(),
};

export const createPlaceReviewRequestSchema = z
  .object({
    placeId: z.uuid(),
    rating: z.number().int().min(1).max(5),
    notes: contributionNotesSchema,
  })
  .strict();
export type CreatePlaceReviewRequest = z.infer<
  typeof createPlaceReviewRequestSchema
>;

export const placeReviewSubmissionSchema = z
  .object({
    ...contributionSubmissionFields,
    placeId: z.uuid(),
    rating: z.number().int().min(1).max(5),
    notes: contributionNotesSchema,
  })
  .strict();
export type PlaceReviewSubmission = z.infer<typeof placeReviewSubmissionSchema>;

export const publicPlaceReviewSchema = z
  .object({
    id: z.uuid(),
    placeId: z.uuid(),
    rating: z.number().int().min(1).max(5),
    notes: contributionNotesSchema,
    moderationStatus: z.literal('approved'),
    createdAt: z.iso.datetime(),
  })
  .strict();
export type PublicPlaceReview = z.infer<typeof publicPlaceReviewSchema>;

export const createRouteReportRequestSchema = z
  .object({
    routeId: z.uuid(),
    reportType: routeReportTypeSchema,
    notes: contributionNotesSchema,
    observedAt: z.iso.datetime().nullable().optional(),
  })
  .strict();
export type CreateRouteReportRequest = z.infer<
  typeof createRouteReportRequestSchema
>;

export const routeReportSubmissionSchema = z
  .object({
    ...contributionSubmissionFields,
    routeId: z.uuid(),
    reportType: routeReportTypeSchema,
    notes: contributionNotesSchema,
    observedAt: z.iso.datetime().nullable(),
  })
  .strict();
export type RouteReportSubmission = z.infer<typeof routeReportSubmissionSchema>;

export const publicRouteReportSchema = z
  .object({
    id: z.uuid(),
    routeId: z.uuid(),
    reportType: routeReportTypeSchema,
    notes: contributionNotesSchema,
    observedAt: z.iso.datetime().nullable(),
    moderationStatus: z.literal('approved'),
    createdAt: z.iso.datetime(),
  })
  .strict();
export type PublicRouteReport = z.infer<typeof publicRouteReportSchema>;

export const contributionCoordinateSchema = z
  .object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
  })
  .strict();

export const createHazardReportRequestSchema = z
  .object({
    routeId: z.uuid().nullable().optional(),
    hazardType: hazardTypeSchema,
    severity: hazardSeveritySchema,
    coordinate: contributionCoordinateSchema,
    notes: contributionNotesSchema,
    observedAt: z.iso.datetime().nullable().optional(),
  })
  .strict();
export type CreateHazardReportRequest = z.infer<
  typeof createHazardReportRequestSchema
>;

export const hazardReportSubmissionSchema = z
  .object({
    ...contributionSubmissionFields,
    routeId: z.uuid().nullable(),
    hazardType: hazardTypeSchema,
    severity: hazardSeveritySchema,
    coordinate: contributionCoordinateSchema,
    notes: contributionNotesSchema,
    observedAt: z.iso.datetime().nullable(),
  })
  .strict();
export type HazardReportSubmission = z.infer<
  typeof hazardReportSubmissionSchema
>;

export const publicHazardReportSchema = z
  .object({
    id: z.uuid(),
    routeId: z.uuid().nullable(),
    hazardType: hazardTypeSchema,
    severity: hazardSeveritySchema,
    coordinate: contributionCoordinateSchema,
    notes: contributionNotesSchema,
    observedAt: z.iso.datetime().nullable(),
    moderationStatus: z.literal('approved'),
    locationMeaning: z.literal('reported_hazard'),
    createdAt: z.iso.datetime(),
  })
  .strict();
export type PublicHazardReport = z.infer<typeof publicHazardReportSchema>;

export const contributionSubmissionResponseSchema = z
  .object({
    contribution: z.discriminatedUnion('kind', [
      placeReviewSubmissionSchema.extend({ kind: z.literal('place_review') }),
      routeReportSubmissionSchema.extend({ kind: z.literal('route_report') }),
      hazardReportSubmissionSchema.extend({ kind: z.literal('hazard_report') }),
    ]),
  })
  .strict();

const gpxPositionSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

export const gpxImportRequestSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    content: z.string().min(1).max(GPX_MAX_FILE_BYTES),
  })
  .strict();
export type GpxImportRequest = z.infer<typeof gpxImportRequestSchema>;

export const gpxImportResultSchema = z
  .object({
    fileName: z.string(),
    pointCount: z.number().int().min(GPX_MIN_POINTS).max(GPX_MAX_POINTS),
    distanceMeters: z.number().int().nonnegative(),
    geometry: z
      .object({
        type: z.literal('LineString'),
        coordinates: z
          .array(gpxPositionSchema)
          .min(GPX_MIN_POINTS)
          .max(GPX_MAX_POINTS),
      })
      .strict(),
  })
  .strict();
export type GpxImportResult = z.infer<typeof gpxImportResultSchema>;
