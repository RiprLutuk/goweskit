import {
  HAZARD_SEVERITIES,
  HAZARD_TYPES,
  ROUTE_REPORT_TYPES,
  ExploreContributionError,
  type CreateHazardReportInput,
  type CreatePlaceReviewInput,
  type CreateRouteReportInput,
  type PublicHazardReport,
  type PublicPlaceReview,
  type PublicRouteReport,
  type StoredHazardReport,
  type StoredPlaceReview,
  type StoredRouteReport,
} from './domain.js';

type NewPlaceReview = Omit<StoredPlaceReview, 'id' | 'createdAt'>;
type NewRouteReport = Omit<StoredRouteReport, 'id' | 'createdAt'>;
type NewHazardReport = Omit<StoredHazardReport, 'id' | 'createdAt'>;

export interface ExploreContributionRepository {
  placeExists(placeId: string): Promise<boolean>;
  routeExists(routeId: string): Promise<boolean>;
  createPlaceReview(input: NewPlaceReview): Promise<StoredPlaceReview>;
  createRouteReport(input: NewRouteReport): Promise<StoredRouteReport>;
  createHazardReport(input: NewHazardReport): Promise<StoredHazardReport>;
  listPlaceReviews(placeId: string): Promise<StoredPlaceReview[]>;
  listRouteReports(routeId: string): Promise<StoredRouteReport[]>;
  listHazardReports(routeId?: string): Promise<StoredHazardReport[]>;
}

function normalizedNotes(notes: string): string {
  const value = notes.trim();
  if (value.length === 0 || value.length > 1_000) {
    throw new ExploreContributionError(
      'INVALID_EXPLORE_CONTRIBUTION',
      'Contribution notes must contain 1 to 1000 characters.',
      400,
    );
  }
  return value;
}

function optionalObservedAt(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ExploreContributionError(
      'INVALID_EXPLORE_CONTRIBUTION',
      'Observed time must be a valid ISO date-time.',
      400,
    );
  }
  return date;
}

function assertCoordinate(longitude: number, latitude: number): void {
  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new ExploreContributionError(
      'INVALID_EXPLORE_CONTRIBUTION',
      'Hazard coordinates are outside longitude/latitude bounds.',
      400,
    );
  }
}

function publicPlaceReview(
  review: StoredPlaceReview,
): PublicPlaceReview | null {
  if (review.moderationStatus !== 'approved') return null;
  return {
    id: review.id,
    placeId: review.placeId,
    rating: review.rating,
    notes: review.notes,
    moderationStatus: 'approved',
    createdAt: review.createdAt.toISOString(),
  };
}

function publicRouteReport(
  report: StoredRouteReport,
): PublicRouteReport | null {
  if (report.moderationStatus !== 'approved') return null;
  return {
    id: report.id,
    routeId: report.routeId,
    reportType: report.reportType,
    notes: report.notes,
    observedAt: report.observedAt?.toISOString() ?? null,
    moderationStatus: 'approved',
    createdAt: report.createdAt.toISOString(),
  };
}

function publicHazardReport(
  report: StoredHazardReport,
): PublicHazardReport | null {
  if (report.moderationStatus !== 'approved') return null;
  return {
    id: report.id,
    routeId: report.routeId,
    hazardType: report.hazardType,
    severity: report.severity,
    coordinate: { ...report.coordinate },
    notes: report.notes,
    observedAt: report.observedAt?.toISOString() ?? null,
    moderationStatus: 'approved',
    locationMeaning: 'reported_hazard',
    createdAt: report.createdAt.toISOString(),
  };
}

export class ExploreContributionService {
  public constructor(
    private readonly repository: ExploreContributionRepository,
  ) {}

  public async submitPlaceReview(
    reporterUserId: string,
    input: CreatePlaceReviewInput,
  ): Promise<StoredPlaceReview> {
    if (!(await this.repository.placeExists(input.placeId))) {
      throw new ExploreContributionError(
        'PLACE_NOT_FOUND',
        'Place not found.',
        404,
      );
    }
    if (
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      throw new ExploreContributionError(
        'INVALID_EXPLORE_CONTRIBUTION',
        'Place review rating must be an integer from 1 to 5.',
        400,
      );
    }
    return this.repository.createPlaceReview({
      reporterUserId,
      placeId: input.placeId,
      rating: input.rating,
      notes: normalizedNotes(input.notes),
      moderationStatus: 'pending',
    });
  }

  public async submitRouteReport(
    reporterUserId: string,
    input: CreateRouteReportInput,
  ): Promise<StoredRouteReport> {
    if (!(await this.repository.routeExists(input.routeId))) {
      throw new ExploreContributionError(
        'ROUTE_NOT_FOUND',
        'Route not found.',
        404,
      );
    }
    if (!ROUTE_REPORT_TYPES.includes(input.reportType)) {
      throw new ExploreContributionError(
        'INVALID_EXPLORE_CONTRIBUTION',
        'Route report type is not recognized.',
        400,
      );
    }
    return this.repository.createRouteReport({
      reporterUserId,
      routeId: input.routeId,
      reportType: input.reportType,
      notes: normalizedNotes(input.notes),
      observedAt: optionalObservedAt(input.observedAt),
      moderationStatus: 'pending',
    });
  }

  public async submitHazardReport(
    reporterUserId: string,
    input: CreateHazardReportInput,
  ): Promise<StoredHazardReport> {
    if (
      input.routeId !== undefined &&
      input.routeId !== null &&
      !(await this.repository.routeExists(input.routeId))
    ) {
      throw new ExploreContributionError(
        'ROUTE_NOT_FOUND',
        'Route not found.',
        404,
      );
    }
    if (!HAZARD_TYPES.includes(input.hazardType)) {
      throw new ExploreContributionError(
        'INVALID_EXPLORE_CONTRIBUTION',
        'Hazard type is not recognized.',
        400,
      );
    }
    if (!HAZARD_SEVERITIES.includes(input.severity)) {
      throw new ExploreContributionError(
        'INVALID_EXPLORE_CONTRIBUTION',
        'Hazard severity is not recognized.',
        400,
      );
    }
    assertCoordinate(input.coordinate.longitude, input.coordinate.latitude);
    return this.repository.createHazardReport({
      reporterUserId,
      routeId: input.routeId ?? null,
      hazardType: input.hazardType,
      severity: input.severity,
      coordinate: { ...input.coordinate },
      notes: normalizedNotes(input.notes),
      observedAt: optionalObservedAt(input.observedAt),
      moderationStatus: 'pending',
    });
  }

  public async listPublicPlaceReviews(
    placeId: string,
  ): Promise<PublicPlaceReview[]> {
    return (await this.repository.listPlaceReviews(placeId)).flatMap(
      (review) => {
        const mapped = publicPlaceReview(review);
        return mapped === null ? [] : [mapped];
      },
    );
  }

  public async listPublicRouteReports(
    routeId: string,
  ): Promise<PublicRouteReport[]> {
    return (await this.repository.listRouteReports(routeId)).flatMap(
      (report) => {
        const mapped = publicRouteReport(report);
        return mapped === null ? [] : [mapped];
      },
    );
  }

  public async listPublicHazardReports(
    routeId?: string,
  ): Promise<PublicHazardReport[]> {
    return (await this.repository.listHazardReports(routeId)).flatMap(
      (report) => {
        const mapped = publicHazardReport(report);
        return mapped === null ? [] : [mapped];
      },
    );
  }
}
