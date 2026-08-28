import { describe, expect, it } from 'vitest';

import {
  ExploreContributionError,
  isLegalModerationTransition,
  type ModerationTransitionInput,
  type ModerationTransitionResult,
  type StoredHazardReport,
  type StoredPlaceReview,
  type StoredRouteReport,
} from './domain.js';
import {
  ExploreContributionService,
  type ExploreContributionRepository,
} from './service.js';

const USER_ID = '019c9c80-2896-7593-bd02-509894b90003';
const PLACE_ID = '019c9c80-2896-7593-bd02-509894b90101';
const ROUTE_ID = '019c9c80-2896-7593-bd02-509894b90102';
const CREATED_AT = new Date('2026-08-28T02:00:00.000Z');

class MemoryContributionRepository implements ExploreContributionRepository {
  public places = new Set([PLACE_ID]);
  public routes = new Set([ROUTE_ID]);
  public placeReviews: StoredPlaceReview[] = [];
  public routeReports: StoredRouteReport[] = [];
  public hazardReports: StoredHazardReport[] = [];
  public moderationTransitions: ModerationTransitionInput[] = [];

  public placeExists(placeId: string): Promise<boolean> {
    return Promise.resolve(this.places.has(placeId));
  }

  public routeExists(routeId: string): Promise<boolean> {
    return Promise.resolve(this.routes.has(routeId));
  }

  public createPlaceReview(
    input: Omit<StoredPlaceReview, 'id' | 'createdAt'>,
  ): Promise<StoredPlaceReview> {
    const stored = {
      ...input,
      id: '019c9c80-2896-7593-bd02-509894b90111',
      createdAt: CREATED_AT,
    };
    this.placeReviews.push(stored);
    return Promise.resolve(stored);
  }

  public createRouteReport(
    input: Omit<StoredRouteReport, 'id' | 'createdAt'>,
  ): Promise<StoredRouteReport> {
    const stored = {
      ...input,
      id: '019c9c80-2896-7593-bd02-509894b90112',
      createdAt: CREATED_AT,
    };
    this.routeReports.push(stored);
    return Promise.resolve(stored);
  }

  public createHazardReport(
    input: Omit<StoredHazardReport, 'id' | 'createdAt'>,
  ): Promise<StoredHazardReport> {
    const stored = {
      ...input,
      id: '019c9c80-2896-7593-bd02-509894b90113',
      createdAt: CREATED_AT,
    };
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
    this.moderationTransitions.push(input);
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

describe('ExploreContributionService', () => {
  it('submits reviews and reports as pending with reporter identity internal', async () => {
    const repository = new MemoryContributionRepository();
    const service = new ExploreContributionService(repository);

    const review = await service.submitPlaceReview(USER_ID, {
      placeId: PLACE_ID,
      rating: 5,
      notes: '  Helpful workshop.  ',
    });
    const routeReport = await service.submitRouteReport(USER_ID, {
      routeId: ROUTE_ID,
      reportType: 'condition',
      notes: 'Loose gravel after rain.',
      observedAt: '2026-08-28T01:30:00.000Z',
    });
    const hazard = await service.submitHazardReport(USER_ID, {
      routeId: ROUTE_ID,
      hazardType: 'trail_obstruction',
      severity: 'danger',
      coordinate: { longitude: 107.6191, latitude: -6.9175 },
      notes: 'Fallen tree across the trail.',
    });

    expect(review).toMatchObject({
      reporterUserId: USER_ID,
      moderationStatus: 'pending',
      notes: 'Helpful workshop.',
    });
    expect(routeReport).toMatchObject({
      reporterUserId: USER_ID,
      moderationStatus: 'pending',
      observedAt: new Date('2026-08-28T01:30:00.000Z'),
    });
    expect(hazard).toMatchObject({
      reporterUserId: USER_ID,
      moderationStatus: 'pending',
      routeId: ROUTE_ID,
    });
  });

  it('uses stable not-found errors for missing contribution targets', async () => {
    const service = new ExploreContributionService(
      new MemoryContributionRepository(),
    );
    await expect(
      service.submitPlaceReview(USER_ID, {
        placeId: '019c9c80-2896-7593-bd02-509894b90999',
        rating: 4,
        notes: 'Missing place.',
      }),
    ).rejects.toMatchObject({ code: 'PLACE_NOT_FOUND', statusCode: 404 });
    await expect(
      service.submitRouteReport(USER_ID, {
        routeId: '019c9c80-2896-7593-bd02-509894b90999',
        reportType: 'closure',
        notes: 'Missing route.',
      }),
    ).rejects.toMatchObject({ code: 'ROUTE_NOT_FOUND', statusCode: 404 });
    await expect(
      service.submitHazardReport(USER_ID, {
        routeId: '019c9c80-2896-7593-bd02-509894b90999',
        hazardType: 'road_damage',
        severity: 'caution',
        coordinate: { longitude: 107, latitude: -6 },
        notes: 'Missing route.',
      }),
    ).rejects.toMatchObject({ code: 'ROUTE_NOT_FOUND', statusCode: 404 });
  });

  it('defensively validates ratings, notes, time, and hazard coordinates', async () => {
    const service = new ExploreContributionService(
      new MemoryContributionRepository(),
    );
    await expect(
      service.submitPlaceReview(USER_ID, {
        placeId: PLACE_ID,
        rating: 4.5,
        notes: 'Fractional rating.',
      }),
    ).rejects.toBeInstanceOf(ExploreContributionError);
    await expect(
      service.submitRouteReport(USER_ID, {
        routeId: ROUTE_ID,
        reportType: 'condition',
        notes: '   ',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EXPLORE_CONTRIBUTION' });
    await expect(
      service.submitRouteReport(USER_ID, {
        routeId: ROUTE_ID,
        reportType: 'condition',
        notes: 'Observed time invalid.',
        observedAt: 'not-a-date',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EXPLORE_CONTRIBUTION' });
    await expect(
      service.submitHazardReport(USER_ID, {
        hazardType: 'flooding',
        severity: 'danger',
        coordinate: { longitude: 181, latitude: -6 },
        notes: 'Out of bounds.',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EXPLORE_CONTRIBUTION' });
  });

  it('publishes approved contributions only and strips reporter identity', async () => {
    const repository = new MemoryContributionRepository();
    const service = new ExploreContributionService(repository);
    const pendingReview = await service.submitPlaceReview(USER_ID, {
      placeId: PLACE_ID,
      rating: 4,
      notes: 'Pending review.',
    });
    repository.placeReviews.push({
      ...pendingReview,
      id: '019c9c80-2896-7593-bd02-509894b90121',
      moderationStatus: 'approved',
    });
    const pendingRoute = await service.submitRouteReport(USER_ID, {
      routeId: ROUTE_ID,
      reportType: 'difficulty',
      notes: 'Pending route report.',
    });
    repository.routeReports.push({
      ...pendingRoute,
      id: '019c9c80-2896-7593-bd02-509894b90122',
      moderationStatus: 'approved',
    });
    const pendingHazard = await service.submitHazardReport(USER_ID, {
      hazardType: 'road_damage',
      severity: 'caution',
      coordinate: { longitude: 107.6191, latitude: -6.9175 },
      notes: 'Pending hazard.',
    });
    repository.hazardReports.push({
      ...pendingHazard,
      id: '019c9c80-2896-7593-bd02-509894b90123',
      moderationStatus: 'approved',
    });

    const publicValues = [
      ...(await service.listPublicPlaceReviews(PLACE_ID)),
      ...(await service.listPublicRouteReports(ROUTE_ID)),
      ...(await service.listPublicHazardReports()),
    ];
    expect(publicValues).toHaveLength(3);
    for (const value of publicValues) {
      expect(value.moderationStatus).toBe('approved');
      expect(JSON.stringify(value)).not.toContain(USER_ID);
      expect(value).not.toHaveProperty('reporterUserId');
    }
    expect(publicValues[2]).toMatchObject({
      locationMeaning: 'reported_hazard',
    });
  });

  it('allows moderation only from pending to one terminal decision', () => {
    expect(isLegalModerationTransition('pending', 'approved')).toBe(true);
    expect(isLegalModerationTransition('pending', 'rejected')).toBe(true);
    expect(isLegalModerationTransition('approved', 'rejected')).toBe(false);
    expect(isLegalModerationTransition('rejected', 'approved')).toBe(false);
    expect(isLegalModerationTransition('pending', 'pending')).toBe(false);
  });

  it('moderates pending contributions and emits a privacy-safe audit hook', async () => {
    const repository = new MemoryContributionRepository();
    const auditEvents: unknown[] = [];
    const service = new ExploreContributionService(repository, {
      record: (event) => {
        auditEvents.push(event);
        return Promise.resolve();
      },
    });
    const review = await service.submitPlaceReview(USER_ID, {
      placeId: PLACE_ID,
      rating: 5,
      notes: 'Ready for moderation.',
    });
    const occurredAt = new Date('2026-08-28T03:00:00.000Z');
    await expect(
      service.moderateContribution({
        moderatorUserId: '019c9c80-2896-7593-bd02-509894b90009',
        kind: 'place_review',
        contributionId: review.id,
        targetStatus: 'approved',
        reason: '  Verified against contribution policy.  ',
        occurredAt,
      }),
    ).resolves.toEqual({
      id: review.id,
      kind: 'place_review',
      moderationStatus: 'approved',
    });
    expect(auditEvents).toEqual([
      {
        action: 'explore_contribution_moderated',
        contributionId: review.id,
        contributionKind: 'place_review',
        moderatorUserId: '019c9c80-2896-7593-bd02-509894b90009',
        previousStatus: 'pending',
        targetStatus: 'approved',
        reason: 'Verified against contribution policy.',
        occurredAt,
      },
    ]);
  });

  it('rejects missing and already-moderated transitions', async () => {
    const repository = new MemoryContributionRepository();
    const service = new ExploreContributionService(repository);
    const common = {
      moderatorUserId: '019c9c80-2896-7593-bd02-509894b90009',
      kind: 'place_review' as const,
      targetStatus: 'rejected' as const,
      occurredAt: new Date('2026-08-28T03:00:00.000Z'),
    };
    await expect(
      service.moderateContribution({
        ...common,
        contributionId: '019c9c80-2896-7593-bd02-509894b90999',
      }),
    ).rejects.toMatchObject({ code: 'CONTRIBUTION_NOT_FOUND' });

    const review = await service.submitPlaceReview(USER_ID, {
      placeId: PLACE_ID,
      rating: 4,
      notes: 'Moderate once.',
    });
    await service.moderateContribution({
      ...common,
      contributionId: review.id,
    });
    await expect(
      service.moderateContribution({
        ...common,
        contributionId: review.id,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_MODERATION_TRANSITION',
      statusCode: 409,
    });
  });
});
