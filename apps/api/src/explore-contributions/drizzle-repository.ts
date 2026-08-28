import { and, desc, eq, sql } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import {
  communityMemberships,
  exploreModerationAudits,
  placeReviews,
  places,
  routeReports,
  routes,
} from '../db/schema.js';
import type {
  ContributionKind,
  ContributionModerationStatus,
  HazardSeverity,
  HazardType,
  ModerationTransitionInput,
  ModerationTransitionResult,
  StoredHazardReport,
  StoredPlaceReview,
  StoredRouteReport,
} from './domain.js';
import type { ExploreContributionRepository } from './service.js';

const PUBLIC_RESULT_LIMIT = 100;

interface HazardRow {
  id: string;
  reporter_user_id: string;
  route_id: string | null;
  hazard_type: HazardType;
  severity: HazardSeverity;
  longitude: number | string;
  latitude: number | string;
  notes: string;
  observed_at: Date | string | null;
  moderation_status: ContributionModerationStatus;
  created_at: Date | string;
}

interface StatusRow {
  moderation_status: ContributionModerationStatus;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function nullableDate(value: Date | string | null): Date | null {
  return value === null ? null : toDate(value);
}

function mapPlaceReview(
  row: typeof placeReviews.$inferSelect,
): StoredPlaceReview {
  return {
    id: row.id,
    reporterUserId: row.reporterUserId,
    placeId: row.placeId,
    rating: row.rating,
    notes: row.notes,
    moderationStatus: row.moderationStatus,
    createdAt: row.createdAt,
  };
}

function mapRouteReport(
  row: typeof routeReports.$inferSelect,
): StoredRouteReport {
  return {
    id: row.id,
    reporterUserId: row.reporterUserId,
    routeId: row.routeId,
    reportType: row.reportType,
    notes: row.notes,
    observedAt: row.observedAt,
    moderationStatus: row.moderationStatus,
    createdAt: row.createdAt,
  };
}

function mapHazardReport(row: HazardRow): StoredHazardReport {
  return {
    id: row.id,
    reporterUserId: row.reporter_user_id,
    routeId: row.route_id,
    hazardType: row.hazard_type,
    severity: row.severity,
    coordinate: {
      longitude: Number(row.longitude),
      latitude: Number(row.latitude),
    },
    notes: row.notes,
    observedAt: nullableDate(row.observed_at),
    moderationStatus: row.moderation_status,
    createdAt: toDate(row.created_at),
  };
}

function contributionTable(kind: ContributionKind): string {
  switch (kind) {
    case 'place_review':
      return 'place_reviews';
    case 'route_report':
      return 'route_reports';
    case 'hazard_report':
      return 'hazard_reports';
  }
}

export class DrizzleExploreContributionRepository implements ExploreContributionRepository {
  public constructor(private readonly database: Database) {}

  public async placeExists(placeId: string): Promise<boolean> {
    const [place] = await this.database
      .select({ id: places.id })
      .from(places)
      .where(eq(places.id, placeId))
      .limit(1);
    return place !== undefined;
  }

  public async routeExists(routeId: string): Promise<boolean> {
    const [route] = await this.database
      .select({ id: routes.id })
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);
    return route !== undefined;
  }

  public async createPlaceReview(
    input: Omit<StoredPlaceReview, 'id' | 'createdAt'>,
  ): Promise<StoredPlaceReview> {
    const [review] = await this.database
      .insert(placeReviews)
      .values(input)
      .returning();
    if (review === undefined)
      throw new Error('Place review insert returned no row.');
    return mapPlaceReview(review);
  }

  public async createRouteReport(
    input: Omit<StoredRouteReport, 'id' | 'createdAt'>,
  ): Promise<StoredRouteReport> {
    const [report] = await this.database
      .insert(routeReports)
      .values(input)
      .returning();
    if (report === undefined)
      throw new Error('Route report insert returned no row.');
    return mapRouteReport(report);
  }

  public async createHazardReport(
    input: Omit<StoredHazardReport, 'id' | 'createdAt'>,
  ): Promise<StoredHazardReport> {
    const result = await this.database.execute(sql`
      INSERT INTO hazard_reports (
        reporter_user_id, route_id, hazard_type, severity, location, notes,
        observed_at, moderation_status
      ) VALUES (
        ${input.reporterUserId}, ${input.routeId}, ${input.hazardType},
        ${input.severity},
        ST_SetSRID(ST_MakePoint(
          ${input.coordinate.longitude}, ${input.coordinate.latitude}
        ), 4326)::geography,
        ${input.notes}, ${input.observedAt}, ${input.moderationStatus}
      )
      RETURNING
        id, reporter_user_id, route_id, hazard_type, severity,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude,
        notes, observed_at, moderation_status, created_at
    `);
    const row = result.rows[0] as unknown as HazardRow | undefined;
    if (row === undefined)
      throw new Error('Hazard report insert returned no row.');
    return mapHazardReport(row);
  }

  public async listPlaceReviews(placeId: string): Promise<StoredPlaceReview[]> {
    const reviews = await this.database
      .select()
      .from(placeReviews)
      .where(
        and(
          eq(placeReviews.placeId, placeId),
          eq(placeReviews.moderationStatus, 'approved'),
        ),
      )
      .orderBy(desc(placeReviews.createdAt))
      .limit(PUBLIC_RESULT_LIMIT);
    return reviews.map(mapPlaceReview);
  }

  public async listRouteReports(routeId: string): Promise<StoredRouteReport[]> {
    const reports = await this.database
      .select()
      .from(routeReports)
      .where(
        and(
          eq(routeReports.routeId, routeId),
          eq(routeReports.moderationStatus, 'approved'),
        ),
      )
      .orderBy(desc(routeReports.createdAt))
      .limit(PUBLIC_RESULT_LIMIT);
    return reports.map(mapRouteReport);
  }

  public async listHazardReports(
    routeId?: string,
  ): Promise<StoredHazardReport[]> {
    const routeCondition =
      routeId === undefined ? sql`TRUE` : sql`route_id = ${routeId}`;
    const result = await this.database.execute(sql`
      SELECT
        id, reporter_user_id, route_id, hazard_type, severity,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude,
        notes, observed_at, moderation_status, created_at
      FROM hazard_reports
      WHERE moderation_status = 'approved' AND ${routeCondition}
      ORDER BY created_at DESC
      LIMIT ${PUBLIC_RESULT_LIMIT}
    `);
    return (result.rows as unknown as HazardRow[]).map(mapHazardReport);
  }

  public async transitionModeration(
    input: ModerationTransitionInput,
  ): Promise<ModerationTransitionResult> {
    const table = sql.raw(contributionTable(input.kind));
    return this.database.transaction(async (transaction) => {
      const updateResult = await transaction.execute(sql`
        UPDATE ${table}
        SET moderation_status = ${input.targetStatus},
            moderated_by = ${input.moderatorUserId},
            moderated_at = ${input.moderatedAt}
        WHERE id = ${input.contributionId}
          AND moderation_status = ${input.expectedStatus}
        RETURNING id
      `);
      if (updateResult.rows.length === 0) {
        const currentResult = await transaction.execute(sql`
          SELECT moderation_status
          FROM ${table}
          WHERE id = ${input.contributionId}
          LIMIT 1
        `);
        const current = currentResult.rows[0] as StatusRow | undefined;
        return current === undefined
          ? { outcome: 'not_found' as const }
          : {
              outcome: 'conflict' as const,
              currentStatus: current.moderation_status,
            };
      }

      await transaction.insert(exploreModerationAudits).values({
        contributionKind: input.kind,
        contributionId: input.contributionId,
        moderatorUserId: input.moderatorUserId,
        previousStatus: input.expectedStatus,
        targetStatus: input.targetStatus,
        reason: input.reason,
        occurredAt: input.moderatedAt,
      });
      return {
        outcome: 'updated' as const,
        contribution: {
          id: input.contributionId,
          kind: input.kind,
          moderationStatus: input.targetStatus,
        },
      };
    });
  }

  public async hasModeratorAccess(userId: string): Promise<boolean> {
    const [membership] = await this.database
      .select({ id: communityMemberships.id })
      .from(communityMemberships)
      .where(
        and(
          eq(communityMemberships.userId, userId),
          eq(communityMemberships.status, 'active'),
          sql`${communityMemberships.role} IN ('owner', 'moderator')`,
        ),
      )
      .limit(1);
    return membership !== undefined;
  }
}
