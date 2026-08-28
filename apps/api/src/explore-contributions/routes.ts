import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { parseInput } from '../http/validation.js';
import {
  CONTRIBUTION_KINDS,
  HAZARD_SEVERITIES,
  HAZARD_TYPES,
  ROUTE_REPORT_TYPES,
  ExploreContributionError,
  type ContributionKind,
  type StoredHazardReport,
  type StoredPlaceReview,
  type StoredRouteReport,
} from './domain.js';
import { GPX_MAX_FILE_BYTES, GpxImportError, parseGpxImport } from './gpx.js';
import {
  ExploreContributionHttpError,
  toExploreContributionHttpError,
} from './http-errors.js';
import type { ExploreContributionService } from './service.js';

export type ExploreContributionRole = 'member' | 'moderator' | 'admin';

export interface ExploreContributionActor {
  id: string;
  role: ExploreContributionRole;
}

export interface ExploreContributionAuthPolicy {
  authenticate(request: FastifyRequest): Promise<ExploreContributionActor>;
}

export type ExploreContributionRateLimitScope =
  | 'contribution_submit'
  | 'gpx_import'
  | 'moderation'
  | 'public_contribution_read';

export interface ExploreContributionRateLimitPolicy {
  enforce(input: {
    scope: ExploreContributionRateLimitScope;
    key: string;
    request: FastifyRequest;
  }): Promise<void>;
}

export interface ExploreContributionRouteOptions {
  authPolicy: ExploreContributionAuthPolicy;
  rateLimitPolicy: ExploreContributionRateLimitPolicy;
  clock?: () => Date;
}

const placeParamsSchema = z.object({ placeId: z.uuid() }).strict();
const routeParamsSchema = z.object({ routeId: z.uuid() }).strict();
const hazardQuerySchema = z.object({ routeId: z.uuid().optional() }).strict();
const reviewBodySchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    notes: z.string().trim().min(1).max(1_000),
  })
  .strict();
const routeReportBodySchema = z
  .object({
    reportType: z.enum(ROUTE_REPORT_TYPES),
    notes: z.string().trim().min(1).max(1_000),
    observedAt: z.iso.datetime().nullable().optional(),
  })
  .strict();
const coordinateSchema = z
  .object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
  })
  .strict();
const hazardBodySchema = z
  .object({
    routeId: z.uuid().nullable().optional(),
    hazardType: z.enum(HAZARD_TYPES),
    severity: z.enum(HAZARD_SEVERITIES),
    coordinate: coordinateSchema,
    notes: z.string().trim().min(1).max(1_000),
    observedAt: z.iso.datetime().nullable().optional(),
  })
  .strict();
const gpxJsonBodySchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    content: z.string().min(1).max(GPX_MAX_FILE_BYTES),
  })
  .strict();
const moderationParamsSchema = z
  .object({
    kind: z.enum(CONTRIBUTION_KINDS),
    contributionId: z.uuid(),
  })
  .strict();
const moderationBodySchema = z
  .object({
    moderationStatus: z.enum(['approved', 'rejected']),
    reason: z.string().trim().min(1).max(500).nullable().optional(),
  })
  .strict();
const GPX_HTTP_BODY_LIMIT_BYTES = GPX_MAX_FILE_BYTES * 2 + 10_000;

export function isExploreModeratorRole(role: ExploreContributionRole): boolean {
  return role === 'moderator' || role === 'admin';
}

function submission(
  kind: ContributionKind,
  contribution: StoredPlaceReview | StoredRouteReport | StoredHazardReport,
): Record<string, unknown> {
  const common = {
    kind,
    id: contribution.id,
    moderationStatus: contribution.moderationStatus,
    createdAt: contribution.createdAt.toISOString(),
  };
  if (kind === 'place_review') {
    const review = contribution as StoredPlaceReview;
    return {
      ...common,
      placeId: review.placeId,
      rating: review.rating,
      notes: review.notes,
    };
  }
  if (kind === 'route_report') {
    const report = contribution as StoredRouteReport;
    return {
      ...common,
      routeId: report.routeId,
      reportType: report.reportType,
      notes: report.notes,
      observedAt: report.observedAt?.toISOString() ?? null,
    };
  }
  const hazard = contribution as StoredHazardReport;
  return {
    ...common,
    routeId: hazard.routeId,
    hazardType: hazard.hazardType,
    severity: hazard.severity,
    coordinate: { ...hazard.coordinate },
    notes: hazard.notes,
    observedAt: hazard.observedAt?.toISOString() ?? null,
  };
}

async function withLocalErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (
      error instanceof ExploreContributionError ||
      error instanceof GpxImportError
    ) {
      throw toExploreContributionHttpError(error);
    }
    throw error;
  }
}

async function enforceRateLimit(
  options: ExploreContributionRouteOptions,
  scope: ExploreContributionRateLimitScope,
  key: string,
  request: FastifyRequest,
): Promise<void> {
  await options.rateLimitPolicy.enforce({ scope, key, request });
}

function registerGpxContentTypes(app: FastifyInstance): void {
  for (const contentType of [
    'application/gpx+xml',
    'application/xml',
    'text/xml',
  ]) {
    if (!app.hasContentTypeParser(contentType)) {
      app.addContentTypeParser(
        contentType,
        { parseAs: 'string', bodyLimit: GPX_HTTP_BODY_LIMIT_BYTES },
        (_request, body, done) => {
          done(null, body);
        },
      );
    }
  }
}

export function registerExploreContributionRoutes(
  app: FastifyInstance,
  service: ExploreContributionService,
  options: ExploreContributionRouteOptions,
): void {
  const clock = options.clock ?? (() => new Date());
  registerGpxContentTypes(app);

  app.get('/api/v1/places/:placeId/reviews', async (request) => {
    const { placeId } = parseInput(placeParamsSchema, request.params);
    await enforceRateLimit(
      options,
      'public_contribution_read',
      request.ip,
      request,
    );
    return { reviews: await service.listPublicPlaceReviews(placeId) };
  });

  app.post('/api/v1/places/:placeId/reviews', async (request, reply) => {
    const actor = await options.authPolicy.authenticate(request);
    await enforceRateLimit(options, 'contribution_submit', actor.id, request);
    const { placeId } = parseInput(placeParamsSchema, request.params);
    const body = parseInput(reviewBodySchema, request.body);
    const contribution = await withLocalErrors(() =>
      service.submitPlaceReview(actor.id, { placeId, ...body }),
    );
    return reply
      .status(201)
      .send({ contribution: submission('place_review', contribution) });
  });

  app.get('/api/v1/routes/:routeId/reports', async (request) => {
    const { routeId } = parseInput(routeParamsSchema, request.params);
    await enforceRateLimit(
      options,
      'public_contribution_read',
      request.ip,
      request,
    );
    return { reports: await service.listPublicRouteReports(routeId) };
  });

  app.post('/api/v1/routes/:routeId/reports', async (request, reply) => {
    const actor = await options.authPolicy.authenticate(request);
    await enforceRateLimit(options, 'contribution_submit', actor.id, request);
    const { routeId } = parseInput(routeParamsSchema, request.params);
    const body = parseInput(routeReportBodySchema, request.body);
    const contribution = await withLocalErrors(() =>
      service.submitRouteReport(actor.id, {
        routeId,
        reportType: body.reportType,
        notes: body.notes,
        observedAt: body.observedAt ?? null,
      }),
    );
    return reply
      .status(201)
      .send({ contribution: submission('route_report', contribution) });
  });

  app.get('/api/v1/hazards', async (request) => {
    const { routeId } = parseInput(hazardQuerySchema, request.query);
    await enforceRateLimit(
      options,
      'public_contribution_read',
      request.ip,
      request,
    );
    return { hazards: await service.listPublicHazardReports(routeId) };
  });

  app.post('/api/v1/hazards', async (request, reply) => {
    const actor = await options.authPolicy.authenticate(request);
    await enforceRateLimit(options, 'contribution_submit', actor.id, request);
    const body = parseInput(hazardBodySchema, request.body);
    const contribution = await withLocalErrors(() =>
      service.submitHazardReport(actor.id, {
        routeId: body.routeId ?? null,
        hazardType: body.hazardType,
        severity: body.severity,
        coordinate: body.coordinate,
        notes: body.notes,
        observedAt: body.observedAt ?? null,
      }),
    );
    return reply
      .status(201)
      .send({ contribution: submission('hazard_report', contribution) });
  });

  app.post(
    '/api/v1/explore/gpx/import',
    { bodyLimit: GPX_HTTP_BODY_LIMIT_BYTES },
    async (request) => {
      const actor = await options.authPolicy.authenticate(request);
      await enforceRateLimit(options, 'gpx_import', actor.id, request);
      const parsed =
        typeof request.body === 'string'
          ? {
              fileName: parseInput(
                z.string().trim().min(1).max(255),
                request.headers['x-gpx-file-name'],
              ),
              content: request.body,
            }
          : parseInput(gpxJsonBodySchema, request.body);
      return withLocalErrors(() =>
        Promise.resolve(parseGpxImport(parsed.fileName, parsed.content)),
      );
    },
  );

  app.patch(
    '/api/v1/moderation/explore/:kind/:contributionId',
    async (request) => {
      const actor = await options.authPolicy.authenticate(request);
      if (!isExploreModeratorRole(actor.role)) {
        throw new ExploreContributionHttpError(
          'MODERATOR_REQUIRED',
          'Moderator role is required.',
          403,
        );
      }
      await enforceRateLimit(options, 'moderation', actor.id, request);
      const params = parseInput(moderationParamsSchema, request.params);
      const body = parseInput(moderationBodySchema, request.body);
      const contribution = await withLocalErrors(() =>
        service.moderateContribution({
          moderatorUserId: actor.id,
          kind: params.kind,
          contributionId: params.contributionId,
          targetStatus: body.moderationStatus,
          reason: body.reason ?? null,
          occurredAt: clock(),
        }),
      );
      return { contribution };
    },
  );
}
