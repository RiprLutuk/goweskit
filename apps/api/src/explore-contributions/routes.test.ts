import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { AppError } from '../errors.js';
import {
  type ModerationTransitionInput,
  type ModerationTransitionResult,
  type StoredHazardReport,
  type StoredPlaceReview,
  type StoredRouteReport,
} from './domain.js';
import { ExploreContributionHttpError } from './http-errors.js';
import {
  registerExploreContributionRoutes,
  type ExploreContributionActor,
  type ExploreContributionRateLimitScope,
} from './routes.js';
import {
  ExploreContributionService,
  type ExploreContributionRepository,
} from './service.js';

const USER_ID = '019c9c80-2896-7593-bd02-509894b90003';
const MODERATOR_ID = '019c9c80-2896-7593-bd02-509894b90009';
const PLACE_ID = '019c9c80-2896-7593-bd02-509894b90101';
const ROUTE_ID = '019c9c80-2896-7593-bd02-509894b90102';
const REVIEW_ID = '019c9c80-2896-7593-bd02-509894b90111';
const REPORT_ID = '019c9c80-2896-7593-bd02-509894b90112';
const HAZARD_ID = '019c9c80-2896-7593-bd02-509894b90113';
const NOW = new Date('2026-08-28T03:00:00.000Z');
const VALID_GPX =
  '<gpx version="1.1"><trk><trkseg><trkpt lat="-6.9175" lon="107.6191"/><trkpt lat="-6.9180" lon="107.6200"/></trkseg></trk></gpx>';

class MemoryContributionRepository implements ExploreContributionRepository {
  public placeReviews: StoredPlaceReview[] = [];
  public routeReports: StoredRouteReport[] = [];
  public hazardReports: StoredHazardReport[] = [];

  public placeExists(placeId: string): Promise<boolean> {
    return Promise.resolve(placeId === PLACE_ID);
  }

  public routeExists(routeId: string): Promise<boolean> {
    return Promise.resolve(routeId === ROUTE_ID);
  }

  public createPlaceReview(
    input: Omit<StoredPlaceReview, 'id' | 'createdAt'>,
  ): Promise<StoredPlaceReview> {
    const stored = { ...input, id: REVIEW_ID, createdAt: NOW };
    this.placeReviews.push(stored);
    return Promise.resolve(stored);
  }

  public createRouteReport(
    input: Omit<StoredRouteReport, 'id' | 'createdAt'>,
  ): Promise<StoredRouteReport> {
    const stored = { ...input, id: REPORT_ID, createdAt: NOW };
    this.routeReports.push(stored);
    return Promise.resolve(stored);
  }

  public createHazardReport(
    input: Omit<StoredHazardReport, 'id' | 'createdAt'>,
  ): Promise<StoredHazardReport> {
    const stored = { ...input, id: HAZARD_ID, createdAt: NOW };
    this.hazardReports.push(stored);
    return Promise.resolve(stored);
  }

  public listPlaceReviews(placeId: string): Promise<StoredPlaceReview[]> {
    return Promise.resolve(
      this.placeReviews.filter((review) => review.placeId === placeId),
    );
  }

  public listRouteReports(routeId: string): Promise<StoredRouteReport[]> {
    return Promise.resolve(
      this.routeReports.filter((report) => report.routeId === routeId),
    );
  }

  public listHazardReports(routeId?: string): Promise<StoredHazardReport[]> {
    return Promise.resolve(
      routeId === undefined
        ? this.hazardReports
        : this.hazardReports.filter((report) => report.routeId === routeId),
    );
  }

  public transitionModeration(
    input: ModerationTransitionInput,
  ): Promise<ModerationTransitionResult> {
    const collection =
      input.kind === 'place_review'
        ? this.placeReviews
        : input.kind === 'route_report'
          ? this.routeReports
          : this.hazardReports;
    const stored = collection.find(
      (contribution) => contribution.id === input.contributionId,
    );
    if (stored === undefined) return Promise.resolve({ outcome: 'not_found' });
    if (stored.moderationStatus !== input.expectedStatus) {
      return Promise.resolve({
        outcome: 'conflict',
        currentStatus: stored.moderationStatus,
      });
    }
    stored.moderationStatus = input.targetStatus;
    return Promise.resolve({
      outcome: 'updated',
      contribution: {
        id: stored.id,
        kind: input.kind,
        moderationStatus: input.targetStatus,
      },
    });
  }
}

interface RouteFixture {
  app: FastifyInstance;
  repository: MemoryContributionRepository;
  rateCalls: { scope: ExploreContributionRateLimitScope; key: string }[];
  auditEvents: unknown[];
}

const openApps: FastifyInstance[] = [];

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

function fixture(
  actor: ExploreContributionActor | null,
  blockedScope?: ExploreContributionRateLimitScope,
): RouteFixture {
  const repository = new MemoryContributionRepository();
  const rateCalls: RouteFixture['rateCalls'] = [];
  const auditEvents: unknown[] = [];
  const service = new ExploreContributionService(repository, {
    record: (event) => {
      auditEvents.push(event);
      return Promise.resolve();
    },
  });
  const app = Fastify({ logger: false });
  openApps.push(app);
  app.setErrorHandler((error, _request, reply) => {
    if (
      error instanceof ExploreContributionHttpError ||
      error instanceof AppError
    ) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }
    return reply.send(error);
  });
  registerExploreContributionRoutes(app, service, {
    authPolicy: {
      authenticate: () => {
        if (actor === null) {
          throw new ExploreContributionHttpError(
            'AUTH_REQUIRED',
            'Authentication is required.',
            401,
          );
        }
        return Promise.resolve(actor);
      },
    },
    rateLimitPolicy: {
      enforce: ({ scope, key }) => {
        rateCalls.push({ scope, key });
        if (scope === blockedScope) {
          throw new ExploreContributionHttpError(
            'RATE_LIMITED',
            'Too many requests.',
            429,
          );
        }
        return Promise.resolve();
      },
    },
    clock: () => NOW,
  });
  return { app, repository, rateCalls, auditEvents };
}

describe('Explore contribution routes', () => {
  it('requires authentication and rate limits contribution submissions', async () => {
    const unauthenticated = fixture(null);
    const denied = await unauthenticated.app.inject({
      method: 'POST',
      url: `/api/v1/places/${PLACE_ID}/reviews`,
      payload: { rating: 5, notes: 'Useful stop.' },
    });
    expect(denied.statusCode).toBe(401);
    expect(denied.json()).toMatchObject({ error: { code: 'AUTH_REQUIRED' } });

    const limited = fixture(
      { id: USER_ID, role: 'member' },
      'contribution_submit',
    );
    const throttled = await limited.app.inject({
      method: 'POST',
      url: `/api/v1/places/${PLACE_ID}/reviews`,
      payload: { rating: 5, notes: 'Useful stop.' },
    });
    expect(throttled.statusCode).toBe(429);
    expect(throttled.json()).toMatchObject({ error: { code: 'RATE_LIMITED' } });
    expect(limited.repository.placeReviews).toHaveLength(0);
  });

  it('creates pending reviews without exposing reporter identity', async () => {
    const { app, rateCalls } = fixture({ id: USER_ID, role: 'member' });
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/places/${PLACE_ID}/reviews`,
      payload: { rating: 5, notes: '  Useful repair stop.  ' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      contribution: {
        kind: 'place_review',
        id: REVIEW_ID,
        placeId: PLACE_ID,
        rating: 5,
        notes: 'Useful repair stop.',
        moderationStatus: 'pending',
        createdAt: NOW.toISOString(),
      },
    });
    expect(response.body).not.toContain(USER_ID);
    expect(rateCalls).toEqual([{ scope: 'contribution_submit', key: USER_ID }]);
  });

  it('creates route and hazard reports with strict bounded inputs', async () => {
    const { app } = fixture({ id: USER_ID, role: 'member' });
    const report = await app.inject({
      method: 'POST',
      url: `/api/v1/routes/${ROUTE_ID}/reports`,
      payload: {
        reportType: 'condition',
        notes: 'Loose gravel.',
        observedAt: '2026-08-28T02:00:00.000Z',
      },
    });
    const hazard = await app.inject({
      method: 'POST',
      url: '/api/v1/hazards',
      payload: {
        routeId: ROUTE_ID,
        hazardType: 'road_damage',
        severity: 'caution',
        coordinate: { longitude: 107.6191, latitude: -6.9175 },
        notes: 'Deep pothole.',
      },
    });
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/v1/hazards',
      payload: {
        hazardType: 'road_damage',
        severity: 'danger',
        coordinate: { longitude: 181, latitude: -6 },
        notes: 'Invalid coordinate.',
      },
    });

    expect(report.statusCode).toBe(201);
    expect(hazard.statusCode).toBe(201);
    expect(report.body).not.toContain(USER_ID);
    expect(hazard.body).not.toContain(USER_ID);
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('returns approved public contributions only and preserves reporter privacy', async () => {
    const { app, repository, rateCalls } = fixture(null);
    repository.placeReviews.push(
      {
        id: REVIEW_ID,
        reporterUserId: USER_ID,
        placeId: PLACE_ID,
        rating: 4,
        notes: 'Approved.',
        moderationStatus: 'approved',
        createdAt: NOW,
      },
      {
        id: '019c9c80-2896-7593-bd02-509894b90121',
        reporterUserId: USER_ID,
        placeId: PLACE_ID,
        rating: 1,
        notes: 'Still pending.',
        moderationStatus: 'pending',
        createdAt: NOW,
      },
    );

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/places/${PLACE_ID}/reviews`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      reviews: [
        {
          id: REVIEW_ID,
          placeId: PLACE_ID,
          rating: 4,
          notes: 'Approved.',
          moderationStatus: 'approved',
          createdAt: NOW.toISOString(),
        },
      ],
    });
    expect(response.body).not.toContain(USER_ID);
    expect(rateCalls).toEqual([
      { scope: 'public_contribution_read', key: '127.0.0.1' },
    ]);
  });

  it('enforces moderator roles, atomic transitions, and audit hooks', async () => {
    const member = fixture({ id: USER_ID, role: 'member' });
    const forbidden = await member.app.inject({
      method: 'PATCH',
      url: `/api/v1/moderation/explore/place_review/${REVIEW_ID}`,
      payload: { moderationStatus: 'approved' },
    });
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.json()).toMatchObject({
      error: { code: 'MODERATOR_REQUIRED' },
    });

    const moderator = fixture({ id: MODERATOR_ID, role: 'moderator' });
    moderator.repository.placeReviews.push({
      id: REVIEW_ID,
      reporterUserId: USER_ID,
      placeId: PLACE_ID,
      rating: 5,
      notes: 'Ready.',
      moderationStatus: 'pending',
      createdAt: NOW,
    });
    const approved = await moderator.app.inject({
      method: 'PATCH',
      url: `/api/v1/moderation/explore/place_review/${REVIEW_ID}`,
      payload: { moderationStatus: 'approved', reason: 'Verified.' },
    });
    const repeated = await moderator.app.inject({
      method: 'PATCH',
      url: `/api/v1/moderation/explore/place_review/${REVIEW_ID}`,
      payload: { moderationStatus: 'rejected' },
    });

    expect(approved.statusCode).toBe(200);
    expect(approved.json()).toEqual({
      contribution: {
        id: REVIEW_ID,
        kind: 'place_review',
        moderationStatus: 'approved',
      },
    });
    expect(repeated.statusCode).toBe(409);
    expect(repeated.json()).toMatchObject({
      error: { code: 'INVALID_MODERATION_TRANSITION' },
    });
    expect(moderator.auditEvents).toEqual([
      {
        action: 'explore_contribution_moderated',
        contributionId: REVIEW_ID,
        contributionKind: 'place_review',
        moderatorUserId: MODERATOR_ID,
        previousStatus: 'pending',
        targetStatus: 'approved',
        reason: 'Verified.',
        occurredAt: NOW,
      },
    ]);
  });

  it('imports bounded GPX from JSON and XML text deterministically', async () => {
    const { app, rateCalls } = fixture({ id: USER_ID, role: 'member' });
    const jsonResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/explore/gpx/import',
      payload: { fileName: 'route.gpx', content: VALID_GPX },
    });
    const textResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/explore/gpx/import',
      headers: {
        'content-type': 'application/gpx+xml',
        'x-gpx-file-name': 'track.gpx',
      },
      payload: VALID_GPX,
    });

    expect(jsonResponse.statusCode).toBe(200);
    expect(jsonResponse.json()).toMatchObject({
      fileName: 'route.gpx',
      pointCount: 2,
      geometry: { type: 'LineString' },
    });
    expect(textResponse.statusCode).toBe(200);
    expect(textResponse.json()).toMatchObject({
      fileName: 'track.gpx',
      pointCount: 2,
    });
    expect(rateCalls).toEqual([
      { scope: 'gpx_import', key: USER_ID },
      { scope: 'gpx_import', key: USER_ID },
    ]);
  });

  it('uses stable errors for unsafe and oversized GPX content', async () => {
    const { app } = fixture({ id: USER_ID, role: 'member' });
    const unsafe = await app.inject({
      method: 'POST',
      url: '/api/v1/explore/gpx/import',
      payload: {
        fileName: 'unsafe.gpx',
        content:
          '<!DOCTYPE gpx [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><gpx>&xxe;</gpx>',
      },
    });
    const oversized = await app.inject({
      method: 'POST',
      url: '/api/v1/explore/gpx/import',
      headers: {
        'content-type': 'application/gpx+xml',
        'x-gpx-file-name': 'large.gpx',
      },
      payload: `<gpx>${'é'.repeat(1_000_000)}</gpx>`,
    });

    expect(unsafe.statusCode).toBe(400);
    expect(unsafe.json()).toMatchObject({
      error: {
        code: 'GPX_IMPORT_INVALID',
        details: { parserCode: 'GPX_UNSAFE_XML' },
      },
    });
    expect(oversized.statusCode).toBe(413);
    expect(oversized.json()).toMatchObject({
      error: {
        code: 'GPX_IMPORT_TOO_LARGE',
        details: { parserCode: 'GPX_TOO_LARGE' },
      },
    });
  });
});
