export const CONTRIBUTION_MODERATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;
export type ContributionModerationStatus =
  (typeof CONTRIBUTION_MODERATION_STATUSES)[number];

export const ROUTE_REPORT_TYPES = [
  'condition',
  'closure',
  'incorrect_route',
  'difficulty',
  'other',
] as const;
export type RouteReportType = (typeof ROUTE_REPORT_TYPES)[number];

export const HAZARD_TYPES = [
  'road_damage',
  'trail_obstruction',
  'traffic',
  'construction',
  'flooding',
  'animal',
  'other',
] as const;
export type HazardType = (typeof HAZARD_TYPES)[number];

export const HAZARD_SEVERITIES = ['info', 'caution', 'danger'] as const;
export type HazardSeverity = (typeof HAZARD_SEVERITIES)[number];

export interface ContributionCoordinate {
  longitude: number;
  latitude: number;
}

export interface StoredPlaceReview {
  id: string;
  reporterUserId: string;
  placeId: string;
  rating: number;
  notes: string;
  moderationStatus: ContributionModerationStatus;
  createdAt: Date;
}

export interface StoredRouteReport {
  id: string;
  reporterUserId: string;
  routeId: string;
  reportType: RouteReportType;
  notes: string;
  observedAt: Date | null;
  moderationStatus: ContributionModerationStatus;
  createdAt: Date;
}

export interface StoredHazardReport {
  id: string;
  reporterUserId: string;
  routeId: string | null;
  hazardType: HazardType;
  severity: HazardSeverity;
  coordinate: ContributionCoordinate;
  notes: string;
  observedAt: Date | null;
  moderationStatus: ContributionModerationStatus;
  createdAt: Date;
}

export interface CreatePlaceReviewInput {
  placeId: string;
  rating: number;
  notes: string;
}

export interface CreateRouteReportInput {
  routeId: string;
  reportType: RouteReportType;
  notes: string;
  observedAt?: string | null;
}

export interface CreateHazardReportInput {
  routeId?: string | null;
  hazardType: HazardType;
  severity: HazardSeverity;
  coordinate: ContributionCoordinate;
  notes: string;
  observedAt?: string | null;
}

export interface PublicPlaceReview {
  id: string;
  placeId: string;
  rating: number;
  notes: string;
  moderationStatus: 'approved';
  createdAt: string;
}

export interface PublicRouteReport {
  id: string;
  routeId: string;
  reportType: RouteReportType;
  notes: string;
  observedAt: string | null;
  moderationStatus: 'approved';
  createdAt: string;
}

export interface PublicHazardReport {
  id: string;
  routeId: string | null;
  hazardType: HazardType;
  severity: HazardSeverity;
  coordinate: ContributionCoordinate;
  notes: string;
  observedAt: string | null;
  moderationStatus: 'approved';
  locationMeaning: 'reported_hazard';
  createdAt: string;
}

export class ExploreContributionError extends Error {
  public constructor(
    public readonly code:
      'INVALID_EXPLORE_CONTRIBUTION' | 'PLACE_NOT_FOUND' | 'ROUTE_NOT_FOUND',
    message: string,
    public readonly statusCode: 400 | 404,
  ) {
    super(message);
    this.name = 'ExploreContributionError';
  }
}

export function isLegalModerationTransition(
  from: ContributionModerationStatus,
  to: ContributionModerationStatus,
): boolean {
  return from === 'pending' && (to === 'approved' || to === 'rejected');
}
