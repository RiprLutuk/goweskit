import type {
  ContributionKind,
  ContributionModerationStatus,
  HazardSeverity,
  HazardType,
  RouteReportType,
} from '@goweskit/contracts';

export {
  CONTRIBUTION_KINDS,
  CONTRIBUTION_MODERATION_STATUSES,
  HAZARD_SEVERITIES,
  HAZARD_TYPES,
  ROUTE_REPORT_TYPES,
} from '@goweskit/contracts';
export type {
  ContributionKind,
  ContributionModerationStatus,
  HazardSeverity,
  HazardType,
  RouteReportType,
} from '@goweskit/contracts';

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
      | 'CONTRIBUTION_NOT_FOUND'
      | 'INVALID_EXPLORE_CONTRIBUTION'
      | 'INVALID_MODERATION_TRANSITION'
      | 'PLACE_NOT_FOUND'
      | 'ROUTE_NOT_FOUND',
    message: string,
    public readonly statusCode: 400 | 404 | 409,
  ) {
    super(message);
    this.name = 'ExploreContributionError';
  }
}

export interface ModerationTransitionInput {
  kind: ContributionKind;
  contributionId: string;
  expectedStatus: 'pending';
  targetStatus: 'approved' | 'rejected';
  moderatorUserId: string;
  moderatedAt: Date;
  reason: string | null;
}

export type ModerationTransitionResult =
  | {
      outcome: 'updated';
      contribution: {
        id: string;
        kind: ContributionKind;
        moderationStatus: 'approved' | 'rejected';
      };
    }
  | { outcome: 'not_found' }
  | {
      outcome: 'conflict';
      currentStatus: ContributionModerationStatus;
    };

export interface ContributionModerationAuditEvent {
  action: 'explore_contribution_moderated';
  contributionId: string;
  contributionKind: ContributionKind;
  moderatorUserId: string;
  previousStatus: 'pending';
  targetStatus: 'approved' | 'rejected';
  reason: string | null;
  occurredAt: Date;
}

export function isLegalModerationTransition(
  from: ContributionModerationStatus,
  to: ContributionModerationStatus,
): boolean {
  return from === 'pending' && (to === 'approved' || to === 'rejected');
}
