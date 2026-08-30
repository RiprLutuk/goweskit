import {
  COMMUNITY_NEARBY_MAX_RESULTS,
  createdCommunityEventSchema,
  nearbyCommunitySchema,
  nearbyEventSchema,
  publicCommunitySchema,
  publicEventSchema,
  type CommunityMembershipStatus,
  type CommunityModerationDecision,
  type CommunityRole,
  type CreateCommunityEventRequest,
  type CreatedCommunityEvent,
  type NearbyCommunitiesRequest,
  type NearbyCommunity,
  type NearbyEvent,
  type NearbyEventsRequest,
  type PublicCommunity,
  type PublicEvent,
} from '@goweskit/contracts';
import { and, eq, inArray, sql, type SQL } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import {
  bicycleTypes,
  communityMemberships,
  communityModerationAudits,
  rideEventParticipations,
  routes,
  users,
} from '../db/schema.js';

interface CommunityRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  locality: string;
  bicycle_types: string[];
  visibility: string;
  join_mode: string;
  verification_status: string;
  member_count: number;
  distance_meters?: number;
}

interface EventRow {
  id: string;
  community_id: string;
  community_slug: string;
  community_name: string;
  community_verification_status: string;
  title: string;
  description: string;
  starts_at: Date | string;
  meeting_area: string;
  route_id: string | null;
  difficulty: string;
  bicycle_types: string[];
  capacity: number | null;
  participant_count: number;
  requirements: string;
  visibility: string;
  status: string;
  created_by: string;
  created_at: Date | string;
  distance_meters?: number;
}

export interface StoredCommunityMembership {
  id: string;
  communityId: string;
  userId: string;
  role: CommunityRole;
  status: CommunityMembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredEventParticipation {
  id: string;
  eventId: string;
  userId: string;
  status: 'joined' | 'cancelled';
  joinedAt: Date;
  updatedAt: Date;
}

export interface StoredPublicEvent {
  event: PublicEvent;
  communityId: string;
  createdBy: string;
}

export interface PendingMembershipRow {
  membershipId: string;
  communityId: string;
  requesterId: string;
  requesterDisplayName: string;
  requestedAt: Date;
}

export interface CommunityReputationCounts {
  hostedEvents: number;
  completedEvents: number;
  moderationDecisions: number;
}

export interface CommunityRepository {
  findNearbyCommunities(
    input: NearbyCommunitiesRequest,
  ): Promise<NearbyCommunity[]>;
  findCommunityById(id: string): Promise<PublicCommunity | null>;
  findMembership(
    communityId: string,
    userId: string,
  ): Promise<StoredCommunityMembership | null>;
  saveMembership(
    communityId: string,
    userId: string,
    role: CommunityRole,
    status: CommunityMembershipStatus,
  ): Promise<StoredCommunityMembership>;
  findNearbyEvents(input: NearbyEventsRequest): Promise<NearbyEvent[]>;
  listCommunityEvents(
    communityId: string,
    includeMembersOnly: boolean,
  ): Promise<PublicEvent[]>;
  findEventById(id: string): Promise<StoredPublicEvent | null>;
  findParticipation(
    eventId: string,
    userId: string,
  ): Promise<StoredEventParticipation | null>;
  joinEventAtomically(
    eventId: string,
    userId: string,
    capacity: number | null,
  ): Promise<StoredEventParticipation | null>;
  createEvent(
    communityId: string,
    createdByUserId: string,
    input: CreateCommunityEventRequest,
  ): Promise<CreatedCommunityEvent>;
  routeExists(routeId: string): Promise<boolean>;
  bicycleTypesExist(slugs: string[]): Promise<boolean>;
  listPendingMemberships(communityId: string): Promise<PendingMembershipRow[]>;
  moderateMembership(
    communityId: string,
    membershipId: string,
    reviewerId: string,
    decision: CommunityModerationDecision,
    note: string | null,
  ): Promise<{ membershipId: string; auditId: string } | null>;
  getReputationCounts(userId: string): Promise<CommunityReputationCounts>;
}

function bikeTypesMatch(column: SQL, values: string[] | undefined): SQL {
  return values === undefined || values.length === 0
    ? sql`TRUE`
    : sql`${column} && ARRAY[${sql.join(
        values.map((value) => sql`${value}`),
        sql`, `,
      )}]::text[]`;
}

export function textArraySql(values: readonly string[]): SQL {
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;
}

function mapCommunity(row: CommunityRow): PublicCommunity {
  return publicCommunitySchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    locality: row.locality,
    bicycleTypes: row.bicycle_types,
    visibility: row.visibility,
    joinMode: row.join_mode,
    verificationStatus: row.verification_status,
    memberCount: row.member_count,
  });
}

function mapEvent(row: EventRow): PublicEvent {
  return publicEventSchema.parse({
    id: row.id,
    community: {
      id: row.community_id,
      slug: row.community_slug,
      name: row.community_name,
      verificationStatus: row.community_verification_status,
    },
    title: row.title,
    description: row.description,
    startsAt: new Date(row.starts_at).toISOString(),
    meetingArea: row.meeting_area,
    routeId: row.route_id,
    difficulty: row.difficulty,
    bicycleTypes: row.bicycle_types,
    capacity: row.capacity,
    participantCount: row.participant_count,
    requirements: row.requirements,
    visibility: row.visibility,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  });
}

const communityColumns = sql`
  c.id, c.slug, c.name, c.description, c.locality,
  c.bicycle_types, c.visibility, c.join_mode, c.verification_status,
  COUNT(cm.id) FILTER (WHERE cm.status = 'active')::integer AS member_count
`;

const eventColumns = sql`
  e.id, e.community_id, c.slug AS community_slug, c.name AS community_name,
  c.verification_status AS community_verification_status,
  e.title, e.description, e.starts_at, e.meeting_area, e.route_id, e.difficulty,
  e.bicycle_types, e.capacity, e.requirements, e.visibility, e.status,
  e.created_by, e.created_at,
  COUNT(ep.id) FILTER (WHERE ep.status = 'joined')::integer AS participant_count
`;

export class DrizzleCommunityRepository implements CommunityRepository {
  public constructor(private readonly database: Database) {}

  public async findNearbyCommunities(
    input: NearbyCommunitiesRequest,
  ): Promise<NearbyCommunity[]> {
    const center = sql`ST_SetSRID(ST_MakePoint(${input.center.longitude}, ${input.center.latitude}), 4326)::geography`;
    const radiusMeters = input.radiusKm * 1000;
    const verification =
      input.verificationStatus === undefined
        ? sql`TRUE`
        : sql`c.verification_status = ${input.verificationStatus}`;
    const result = await this.database.execute(sql`
      SELECT ${communityColumns},
      CASE WHEN c.visibility = 'private'
        THEN ROUND(ST_Distance(c.home_location, ${center}) / 1000) * 1000
        ELSE ROUND(ST_Distance(c.home_location, ${center}))
      END::integer AS distance_meters
      FROM communities c
      LEFT JOIN community_memberships cm ON cm.community_id = c.id
      WHERE ST_DWithin(c.home_location, ${center}, ${radiusMeters})
        AND ${bikeTypesMatch(sql`c.bicycle_types`, input.bicycleTypes)}
        AND ${verification}
      GROUP BY c.id
      ORDER BY
        CASE c.verification_status
          WHEN 'staff_verified' THEN 0
          WHEN 'community_verified' THEN 1
          ELSE 2
        END,
        distance_meters,
        member_count DESC
      LIMIT ${COMMUNITY_NEARBY_MAX_RESULTS}
    `);

    return (result.rows as unknown as CommunityRow[]).map((row) =>
      nearbyCommunitySchema.parse({
        ...mapCommunity(row),
        distanceMeters: row.distance_meters,
      }),
    );
  }

  public async findCommunityById(identifier: string): Promise<PublicCommunity | null> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );
    const filter = isUuid
      ? sql`c.id = ${identifier}::uuid OR c.slug = ${identifier}`
      : sql`c.slug = ${identifier}`;

    const result = await this.database.execute(sql`
      SELECT ${communityColumns}
      FROM communities c
      LEFT JOIN community_memberships cm ON cm.community_id = c.id
      WHERE ${filter}
      GROUP BY c.id
      LIMIT 1
    `);
    const [row] = result.rows as unknown as CommunityRow[];
    return row === undefined ? null : mapCommunity(row);
  }

  public async findMembership(
    communityId: string,
    userId: string,
  ): Promise<StoredCommunityMembership | null> {
    const [membership] = await this.database
      .select()
      .from(communityMemberships)
      .where(
        and(
          eq(communityMemberships.communityId, communityId),
          eq(communityMemberships.userId, userId),
        ),
      )
      .limit(1);
    return membership ?? null;
  }

  public async saveMembership(
    communityId: string,
    userId: string,
    role: CommunityRole,
    status: CommunityMembershipStatus,
  ): Promise<StoredCommunityMembership> {
    const [membership] = await this.database
      .insert(communityMemberships)
      .values({ communityId, userId, role, status })
      .onConflictDoUpdate({
        target: [communityMemberships.communityId, communityMemberships.userId],
        set: { role, status, updatedAt: new Date() },
      })
      .returning();
    if (membership === undefined)
      throw new Error('Membership write returned no row.');
    return membership;
  }

  public async findNearbyEvents(
    input: NearbyEventsRequest,
  ): Promise<NearbyEvent[]> {
    const center = sql`ST_SetSRID(ST_MakePoint(${input.center.longitude}, ${input.center.latitude}), 4326)::geography`;
    const radiusMeters = input.radiusKm * 1000;
    const difficulty =
      input.difficulty === undefined
        ? sql`TRUE`
        : sql`e.difficulty = ${input.difficulty}`;
    const startsAfter =
      input.startsAfter === undefined
        ? sql`e.starts_at > NOW()`
        : sql`e.starts_at >= ${new Date(input.startsAfter)}`;
    const startsBefore =
      input.startsBefore === undefined
        ? sql`TRUE`
        : sql`e.starts_at < ${new Date(input.startsBefore)}`;
    const result = await this.database.execute(sql`
      SELECT ${eventColumns},
      (ROUND(ST_Distance(e.meeting_location, ${center}) / 500) * 500)::integer
        AS distance_meters
      FROM ride_events e
      INNER JOIN communities c ON c.id = e.community_id
      LEFT JOIN ride_event_participations ep ON ep.event_id = e.id
      WHERE e.status = 'scheduled'
        AND e.visibility = 'public'
        AND ST_DWithin(e.meeting_location, ${center}, ${radiusMeters})
        AND ${bikeTypesMatch(sql`e.bicycle_types`, input.bicycleTypes)}
        AND ${difficulty}
        AND ${startsAfter}
        AND ${startsBefore}
      GROUP BY e.id, c.id
      ORDER BY e.starts_at, distance_meters
      LIMIT ${COMMUNITY_NEARBY_MAX_RESULTS}
    `);

    return (result.rows as unknown as EventRow[]).map((row) =>
      nearbyEventSchema.parse({
        ...mapEvent(row),
        distanceMeters: row.distance_meters,
      }),
    );
  }

  public async listCommunityEvents(
    communityId: string,
    includeMembersOnly: boolean,
  ): Promise<PublicEvent[]> {
    const visibility = includeMembersOnly
      ? sql`TRUE`
      : sql`e.visibility = 'public'`;
    const result = await this.database.execute(sql`
      SELECT ${eventColumns}
      FROM ride_events e
      INNER JOIN communities c ON c.id = e.community_id
      LEFT JOIN ride_event_participations ep ON ep.event_id = e.id
      WHERE e.community_id = ${communityId} AND ${visibility}
      GROUP BY e.id, c.id
      ORDER BY e.starts_at DESC
      LIMIT ${COMMUNITY_NEARBY_MAX_RESULTS}
    `);
    return (result.rows as unknown as EventRow[]).map(mapEvent);
  }

  public async findEventById(id: string): Promise<StoredPublicEvent | null> {
    const result = await this.database.execute(sql`
      SELECT ${eventColumns}
      FROM ride_events e
      INNER JOIN communities c ON c.id = e.community_id
      LEFT JOIN ride_event_participations ep ON ep.event_id = e.id
      WHERE e.id = ${id}
      GROUP BY e.id, c.id
      LIMIT 1
    `);
    const [row] = result.rows as unknown as EventRow[];
    return row === undefined
      ? null
      : {
          event: mapEvent(row),
          communityId: row.community_id,
          createdBy: row.created_by,
        };
  }

  public async findParticipation(
    eventId: string,
    userId: string,
  ): Promise<StoredEventParticipation | null> {
    const [participation] = await this.database
      .select()
      .from(rideEventParticipations)
      .where(
        and(
          eq(rideEventParticipations.eventId, eventId),
          eq(rideEventParticipations.userId, userId),
        ),
      )
      .limit(1);
    return participation ?? null;
  }

  public async joinEventAtomically(
    eventId: string,
    userId: string,
    capacity: number | null,
  ): Promise<StoredEventParticipation | null> {
    return this.database.transaction(async (transaction) => {
      await transaction.execute(
        sql`SELECT id FROM ride_events WHERE id = ${eventId} FOR UPDATE`,
      );
      if (capacity !== null) {
        const countResult = await transaction.execute(sql`
          SELECT COUNT(*)::integer AS count
          FROM ride_event_participations
          WHERE event_id = ${eventId} AND status = 'joined'
        `);
        const count = (countResult.rows[0] as { count: number }).count;
        if (count >= capacity) return null;
      }
      const [participation] = await transaction
        .insert(rideEventParticipations)
        .values({ eventId, userId, status: 'joined' })
        .onConflictDoUpdate({
          target: [
            rideEventParticipations.eventId,
            rideEventParticipations.userId,
          ],
          set: {
            status: 'joined',
            joinedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning();
      if (participation === undefined)
        throw new Error('Event participation write returned no row.');
      return participation;
    });
  }

  public async createEvent(
    communityId: string,
    createdByUserId: string,
    input: CreateCommunityEventRequest,
  ): Promise<CreatedCommunityEvent> {
    return this.database.transaction(async (transaction) => {
      const result = await transaction.execute(sql`
        INSERT INTO ride_events (
          community_id, title, description, starts_at, meeting_location,
          meeting_area, route_id, difficulty, bicycle_types, capacity,
          requirements, visibility, status, created_by
        ) VALUES (
          ${communityId}, ${input.title}, ${input.description},
          ${new Date(input.startsAt)},
          ST_SetSRID(ST_MakePoint(
            ${input.meetingCoordinate.longitude},
            ${input.meetingCoordinate.latitude}
          ), 4326)::geography,
          ${input.meetingArea}, ${input.routeId ?? null}, ${input.difficulty},
          ${textArraySql(input.bicycleTypes)}, ${input.capacity ?? null},
          ${input.requirements}, ${input.visibility}, 'scheduled',
          ${createdByUserId}
        )
        RETURNING
          id, community_id, title, description, starts_at, meeting_area,
          difficulty, bicycle_types, visibility, capacity, requirements,
          created_at
      `);
      const row = result.rows[0] as
        | {
            id: string;
            community_id: string;
            title: string;
            description: string;
            starts_at: Date | string;
            meeting_area: string;
            difficulty: string;
            bicycle_types: string[];
            visibility: string;
            capacity: number | null;
            requirements: string;
            created_at: Date | string;
          }
        | undefined;
      if (row === undefined) throw new Error('Event insert returned no row.');

      await transaction.insert(rideEventParticipations).values({
        eventId: row.id,
        userId: createdByUserId,
        status: 'joined',
      });

      return createdCommunityEventSchema.parse({
        id: row.id,
        communityId: row.community_id,
        title: row.title,
        description: row.description,
        status: 'scheduled',
        participantCount: 1,
        startsAt: new Date(row.starts_at).toISOString(),
        meetingArea: row.meeting_area,
        difficulty: row.difficulty,
        bicycleTypes: row.bicycle_types,
        visibility: row.visibility,
        capacity: row.capacity,
        requirements: row.requirements,
        createdAt: new Date(row.created_at).toISOString(),
      });
    });
  }

  public async routeExists(routeId: string): Promise<boolean> {
    const [route] = await this.database
      .select({ id: routes.id })
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);
    return route !== undefined;
  }

  public async bicycleTypesExist(slugs: string[]): Promise<boolean> {
    const rows = await this.database
      .select({ slug: bicycleTypes.slug })
      .from(bicycleTypes)
      .where(inArray(bicycleTypes.slug, slugs));
    return rows.length === slugs.length;
  }

  public async listPendingMemberships(
    communityId: string,
  ): Promise<PendingMembershipRow[]> {
    return this.database
      .select({
        membershipId: communityMemberships.id,
        communityId: communityMemberships.communityId,
        requesterId: users.id,
        requesterDisplayName: users.displayName,
        requestedAt: communityMemberships.createdAt,
      })
      .from(communityMemberships)
      .innerJoin(users, eq(users.id, communityMemberships.userId))
      .where(
        and(
          eq(communityMemberships.communityId, communityId),
          eq(communityMemberships.status, 'requested'),
        ),
      )
      .orderBy(communityMemberships.createdAt)
      .limit(COMMUNITY_NEARBY_MAX_RESULTS);
  }

  public async moderateMembership(
    communityId: string,
    membershipId: string,
    reviewerId: string,
    decision: CommunityModerationDecision,
    note: string | null,
  ): Promise<{ membershipId: string; auditId: string } | null> {
    return this.database.transaction(async (transaction) => {
      const [membership] = await transaction
        .select({ id: communityMemberships.id })
        .from(communityMemberships)
        .where(
          and(
            eq(communityMemberships.id, membershipId),
            eq(communityMemberships.communityId, communityId),
            eq(communityMemberships.status, 'requested'),
          ),
        )
        .limit(1);
      if (membership === undefined) return null;
      await transaction
        .update(communityMemberships)
        .set({
          status: decision === 'approve' ? 'active' : 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(communityMemberships.id, membershipId));
      const [audit] = await transaction
        .insert(communityModerationAudits)
        .values({ communityId, membershipId, reviewerId, decision, note })
        .returning({ id: communityModerationAudits.id });
      if (audit === undefined)
        throw new Error('Moderation audit insert returned no row.');
      return { membershipId, auditId: audit.id };
    });
  }

  public async getReputationCounts(
    userId: string,
  ): Promise<CommunityReputationCounts> {
    const result = await this.database.execute(sql`
      SELECT
        (SELECT COUNT(*)::integer FROM ride_events WHERE created_by = ${userId}) AS hosted_events,
        (SELECT COUNT(*)::integer FROM ride_events WHERE created_by = ${userId} AND status = 'completed') AS completed_events,
        (SELECT COUNT(*)::integer FROM community_moderation_audits WHERE reviewer_id = ${userId}) AS moderation_decisions
    `);
    const row = result.rows[0] as {
      hosted_events: number;
      completed_events: number;
      moderation_decisions: number;
    };
    return {
      hostedEvents: row.hosted_events,
      completedEvents: row.completed_events,
      moderationDecisions: row.moderation_decisions,
    };
  }
}
