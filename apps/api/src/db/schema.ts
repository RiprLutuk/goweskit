import type { BikeSpecCode } from '@goweskit/bike-domain';
import type {
  CommunityJoinMode,
  CommunityMembershipStatus,
  CommunityModerationDecision,
  CommunityRole,
  CommunityVisibility,
  ContributionKind,
  ContributionModerationStatus,
  EventParticipationStatus,
  EventStatus,
  EventVisibility,
  HazardSeverity,
  HazardType,
  InstalledComponentStandardInput,
  MaintenanceEventType,
  RouteReportType,
  RouteElevationPoint,
} from '@goweskit/contracts';
import type { SafetySessionStatus } from '@goweskit/contracts/safety';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  customType,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const geographyPoint = customType<{ data: string }>({
  dataType: () => 'geography(Point,4326)',
});

const geographyLineString = customType<{ data: string }>({
  dataType: () => 'geography(LineString,4326)',
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    displayName: varchar('display_name', { length: 80 }).notNull(),
    email: varchar('email', { length: 320 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
);

export const bicycleTypes = pgTable('bicycle_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  summary: text('summary').notNull(),
  typicalUse: text('typical_use').notNull(),
  beginnerNotes: text('beginner_notes').notNull(),
});

export const componentCategories = pgTable('component_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
});

export const standardDefinitions = pgTable('standard_definitions', {
  code: varchar('code', { length: 80 }).primaryKey().$type<BikeSpecCode>(),
  category: varchar('category', { length: 80 }).notNull(),
  label: varchar('label', { length: 120 }).notNull(),
  description: text('description').notNull(),
  guidance: text('guidance').notNull(),
  sourceUrl: text('source_url').notNull(),
  reviewStatus: varchar('review_status', { length: 30 })
    .notNull()
    .default('reviewed'),
  version: varchar('version', { length: 30 }).notNull(),
});

export const places = pgTable(
  'places',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 40 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description').notNull(),
    location: geographyPoint('location').notNull(),
    address: text('address').notNull(),
    bicycleTypes: text('bicycle_types').array().notNull(),
    beginnerFriendly: boolean('beginner_friendly').notNull().default(false),
    verificationStatus: varchar('verification_status', { length: 30 })
      .notNull()
      .default('unverified'),
    lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('places_location_gist_idx').using('gist', table.location),
    index('places_discovery_idx').on(
      table.type,
      table.verificationStatus,
      table.lastConfirmedAt,
    ),
  ],
);

export const routes = pgTable(
  'routes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routeType: varchar('route_type', { length: 40 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description').notNull(),
    geometry: geographyLineString('geometry').notNull(),
    distanceMeters: integer('distance_meters').notNull(),
    elevationGainMeters: integer('elevation_gain_meters').notNull(),
    elevationProfile: jsonb('elevation_profile').$type<RouteElevationPoint[]>(),
    difficulty: varchar('difficulty', { length: 30 }).notNull(),
    surface: varchar('surface', { length: 30 }).notNull(),
    bicycleTypes: text('bicycle_types').array().notNull(),
    beginnerFriendly: boolean('beginner_friendly').notNull().default(false),
    verificationStatus: varchar('verification_status', { length: 30 })
      .notNull()
      .default('unverified'),
    lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('routes_geometry_gist_idx').using('gist', table.geometry),
    index('routes_discovery_idx').on(
      table.routeType,
      table.difficulty,
      table.surface,
      table.verificationStatus,
      table.lastConfirmedAt,
    ),
  ],
);

export const userSavedItems = pgTable(
  'user_saved_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    placeId: uuid('place_id').references(() => places.id, {
      onDelete: 'cascade',
    }),
    routeId: uuid('route_id').references(() => routes.id, {
      onDelete: 'cascade',
    }),
    savedAt: timestamp('saved_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('user_saved_items_user_place_unique')
      .on(table.userId, table.placeId)
      .where(sql`${table.placeId} IS NOT NULL`),
    uniqueIndex('user_saved_items_user_route_unique')
      .on(table.userId, table.routeId)
      .where(sql`${table.routeId} IS NOT NULL`),
    index('user_saved_items_user_saved_idx').on(table.userId, table.savedAt),
    check(
      'user_saved_items_exactly_one_target_check',
      sql`num_nonnulls(${table.placeId}, ${table.routeId}) = 1`,
    ),
  ],
);

export const placeReviews = pgTable(
  'place_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    notes: text('notes').notNull(),
    moderationStatus: varchar('moderation_status', { length: 20 })
      .notNull()
      .$type<ContributionModerationStatus>()
      .default('pending'),
    moderatedBy: uuid('moderated_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    moderatedAt: timestamp('moderated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('place_reviews_place_public_idx').on(
      table.placeId,
      table.moderationStatus,
      table.createdAt,
    ),
    index('place_reviews_reporter_idx').on(
      table.reporterUserId,
      table.createdAt,
    ),
    check('place_reviews_rating_check', sql`${table.rating} BETWEEN 1 AND 5`),
    check(
      'place_reviews_moderation_status_check',
      sql`${table.moderationStatus} IN ('pending', 'approved', 'rejected')`,
    ),
  ],
);

export const routeReports = pgTable(
  'route_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    routeId: uuid('route_id')
      .notNull()
      .references(() => routes.id, { onDelete: 'cascade' }),
    reportType: varchar('report_type', { length: 30 })
      .notNull()
      .$type<RouteReportType>(),
    notes: text('notes').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }),
    moderationStatus: varchar('moderation_status', { length: 20 })
      .notNull()
      .$type<ContributionModerationStatus>()
      .default('pending'),
    moderatedBy: uuid('moderated_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    moderatedAt: timestamp('moderated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('route_reports_route_public_idx').on(
      table.routeId,
      table.moderationStatus,
      table.createdAt,
    ),
    index('route_reports_reporter_idx').on(
      table.reporterUserId,
      table.createdAt,
    ),
    check(
      'route_reports_type_check',
      sql`${table.reportType} IN ('condition', 'closure', 'incorrect_route', 'difficulty', 'other')`,
    ),
    check(
      'route_reports_moderation_status_check',
      sql`${table.moderationStatus} IN ('pending', 'approved', 'rejected')`,
    ),
  ],
);

export const hazardReports = pgTable(
  'hazard_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    routeId: uuid('route_id').references(() => routes.id, {
      onDelete: 'set null',
    }),
    hazardType: varchar('hazard_type', { length: 30 })
      .notNull()
      .$type<HazardType>(),
    severity: varchar('severity', { length: 20 })
      .notNull()
      .$type<HazardSeverity>(),
    location: geographyPoint('location').notNull(),
    notes: text('notes').notNull(),
    observedAt: timestamp('observed_at', { withTimezone: true }),
    moderationStatus: varchar('moderation_status', { length: 20 })
      .notNull()
      .$type<ContributionModerationStatus>()
      .default('pending'),
    moderatedBy: uuid('moderated_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    moderatedAt: timestamp('moderated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('hazard_reports_location_gist_idx').using('gist', table.location),
    index('hazard_reports_route_public_idx').on(
      table.routeId,
      table.moderationStatus,
      table.createdAt,
    ),
    index('hazard_reports_reporter_idx').on(
      table.reporterUserId,
      table.createdAt,
    ),
    check(
      'hazard_reports_type_check',
      sql`${table.hazardType} IN ('road_damage', 'trail_obstruction', 'traffic', 'construction', 'flooding', 'animal', 'other')`,
    ),
    check(
      'hazard_reports_severity_check',
      sql`${table.severity} IN ('info', 'caution', 'danger')`,
    ),
    check(
      'hazard_reports_moderation_status_check',
      sql`${table.moderationStatus} IN ('pending', 'approved', 'rejected')`,
    ),
  ],
);

export const exploreModerationAudits = pgTable(
  'explore_moderation_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contributionKind: varchar('contribution_kind', { length: 30 })
      .notNull()
      .$type<ContributionKind>(),
    contributionId: uuid('contribution_id').notNull(),
    moderatorUserId: uuid('moderator_user_id')
      .notNull()
      .references(() => users.id),
    previousStatus: varchar('previous_status', { length: 20 })
      .notNull()
      .$type<ContributionModerationStatus>(),
    targetStatus: varchar('target_status', { length: 20 })
      .notNull()
      .$type<ContributionModerationStatus>(),
    reason: varchar('reason', { length: 500 }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('explore_moderation_audits_contribution_idx').on(
      table.contributionKind,
      table.contributionId,
      table.occurredAt,
    ),
    index('explore_moderation_audits_moderator_idx').on(
      table.moderatorUserId,
      table.occurredAt,
    ),
    check(
      'explore_moderation_audits_transition_check',
      sql`${table.previousStatus} = 'pending' AND ${table.targetStatus} IN ('approved', 'rejected')`,
    ),
  ],
);

export const userBikes = pgTable(
  'user_bikes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nickname: varchar('nickname', { length: 80 }).notNull(),
    bicycleTypeId: uuid('bicycle_type_id')
      .notNull()
      .references(() => bicycleTypes.id),
    brand: varchar('brand', { length: 100 }),
    model: varchar('model', { length: 100 }),
    modelYear: integer('model_year'),
    photoUrl: text('photo_url'),
    photoStorageKey: text('photo_storage_key'),
    avatarPreset: varchar('avatar_preset', { length: 80 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('user_bikes_user_id_idx').on(table.userId)],
);

export interface StoredSpecValue {
  value: string;
}

export const bikeSpecs = pgTable(
  'bike_specs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userBikeId: uuid('user_bike_id')
      .notNull()
      .references(() => userBikes.id, { onDelete: 'cascade' }),
    standardCode: varchar('standard_code', { length: 80 })
      .notNull()
      .$type<BikeSpecCode>()
      .references(() => standardDefinitions.code),
    valueJson: jsonb('value_json').$type<StoredSpecValue>(),
    confidence: varchar('confidence', { length: 30 })
      .notNull()
      .$type<'confirmed' | 'user_entered' | 'inferred' | 'unknown'>(),
    source: varchar('source', { length: 80 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('bike_specs_bike_standard_unique').on(
      table.userBikeId,
      table.standardCode,
    ),
    index('bike_specs_user_bike_id_idx').on(table.userBikeId),
    check(
      'bike_specs_unknown_value_check',
      sql`(${table.confidence} = 'unknown' AND ${table.valueJson} IS NULL) OR (${table.confidence} <> 'unknown' AND ${table.valueJson} IS NOT NULL)`,
    ),
  ],
);

export const bikeComponentInstalls = pgTable(
  'bike_component_installs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userBikeId: uuid('user_bike_id')
      .notNull()
      .references(() => userBikes.id, { onDelete: 'cascade' }),
    componentCategoryId: uuid('component_category_id')
      .notNull()
      .references(() => componentCategories.id),
    customName: varchar('custom_name', { length: 120 }).notNull(),
    brand: varchar('brand', { length: 100 }),
    model: varchar('model', { length: 120 }),
    serialNumber: varchar('serial_number', { length: 160 }),
    notes: text('notes'),
    installedAt: date('installed_at', { mode: 'string' }),
    standards: jsonb('standards')
      .$type<InstalledComponentStandardInput[]>()
      .notNull()
      .default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('bike_component_installs_bike_idx').on(table.userBikeId),
    index('bike_component_installs_category_idx').on(table.componentCategoryId),
  ],
);

export const maintenanceEvents = pgTable(
  'maintenance_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userBikeId: uuid('user_bike_id')
      .notNull()
      .references(() => userBikes.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 40 })
      .notNull()
      .$type<MaintenanceEventType>(),
    performedAt: date('performed_at', { mode: 'string' }).notNull(),
    notes: text('notes'),
    nextDueDate: date('next_due_date', { mode: 'string' }),
    performedAtDistanceKm: integer('performed_at_distance_km'),
    nextDueDistanceKm: integer('next_due_distance_km'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('maintenance_events_bike_performed_idx').on(
      table.userBikeId,
      table.performedAt,
    ),
    index('maintenance_events_user_due_idx').on(
      table.userId,
      table.nextDueDate,
    ),
    check(
      'maintenance_events_due_after_performed_check',
      sql`${table.nextDueDate} IS NULL OR ${table.nextDueDate} >= ${table.performedAt}`,
    ),
  ],
);

export const communities = pgTable(
  'communities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description').notNull(),
    locality: varchar('locality', { length: 160 }).notNull(),
    homeLocation: geographyPoint('home_location').notNull(),
    bicycleTypes: text('bicycle_types').array().notNull(),
    visibility: varchar('visibility', { length: 20 })
      .notNull()
      .$type<CommunityVisibility>(),
    joinMode: varchar('join_mode', { length: 20 })
      .notNull()
      .$type<CommunityJoinMode>(),
    verificationStatus: varchar('verification_status', { length: 30 })
      .notNull()
      .default('unverified'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('communities_slug_unique').on(table.slug),
    index('communities_home_location_gist_idx').using(
      'gist',
      table.homeLocation,
    ),
    index('communities_discovery_idx').on(
      table.visibility,
      table.verificationStatus,
    ),
  ],
);

export const communityMemberships = pgTable(
  'community_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull().$type<CommunityRole>(),
    status: varchar('status', { length: 20 })
      .notNull()
      .$type<CommunityMembershipStatus>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('community_memberships_community_user_unique').on(
      table.communityId,
      table.userId,
    ),
    index('community_memberships_queue_idx').on(
      table.communityId,
      table.status,
      table.createdAt,
    ),
    index('community_memberships_user_idx').on(table.userId, table.status),
  ],
);

export const rideEvents = pgTable(
  'ride_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 180 }).notNull(),
    description: text('description').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    meetingLocation: geographyPoint('meeting_location').notNull(),
    meetingArea: varchar('meeting_area', { length: 200 }).notNull(),
    routeId: uuid('route_id').references(() => routes.id, {
      onDelete: 'set null',
    }),
    difficulty: varchar('difficulty', { length: 30 }).notNull(),
    bicycleTypes: text('bicycle_types').array().notNull(),
    capacity: integer('capacity'),
    requirements: text('requirements').notNull(),
    visibility: varchar('visibility', { length: 20 })
      .notNull()
      .$type<EventVisibility>(),
    status: varchar('status', { length: 20 }).notNull().$type<EventStatus>(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('ride_events_meeting_location_gist_idx').using(
      'gist',
      table.meetingLocation,
    ),
    index('ride_events_discovery_idx').on(
      table.status,
      table.visibility,
      table.startsAt,
    ),
    index('ride_events_community_idx').on(table.communityId, table.startsAt),
    check(
      'ride_events_capacity_positive_check',
      sql`${table.capacity} IS NULL OR ${table.capacity} > 0`,
    ),
  ],
);

export const rideEventParticipations = pgTable(
  'ride_event_participations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => rideEvents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 })
      .notNull()
      .$type<EventParticipationStatus>(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('ride_event_participations_event_user_unique').on(
      table.eventId,
      table.userId,
    ),
    index('ride_event_participations_event_status_idx').on(
      table.eventId,
      table.status,
    ),
    index('ride_event_participations_user_idx').on(table.userId, table.status),
  ],
);

export const communityModerationAudits = pgTable(
  'community_moderation_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => communityMemberships.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id),
    decision: varchar('decision', { length: 20 })
      .notNull()
      .$type<CommunityModerationDecision>(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('community_moderation_audits_community_idx').on(
      table.communityId,
      table.createdAt,
    ),
    index('community_moderation_audits_reviewer_idx').on(
      table.reviewerId,
      table.createdAt,
    ),
  ],
);

export const trustedContacts = pgTable(
  'trusted_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 80 }).notNull(),
    phone: varchar('phone', { length: 160 }),
    email: varchar('email', { length: 320 }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('trusted_contacts_user_created_idx').on(
      table.userId,
      table.createdAt,
    ),
    check(
      'trusted_contacts_reachable_check',
      sql`${table.phone} IS NOT NULL OR ${table.email} IS NOT NULL`,
    ),
  ],
);

export const safetySessions = pgTable(
  'safety_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    riderDisplayName: varchar('rider_display_name', { length: 80 }).notNull(),
    trustedContactId: uuid('trusted_contact_id').references(
      () => trustedContacts.id,
      { onDelete: 'set null' },
    ),
    status: varchar('status', { length: 20 })
      .notNull()
      .$type<SafetySessionStatus>()
      .default('active'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    expectedEndAt: timestamp('expected_end_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    shareTokenHash: varchar('share_token_hash', { length: 64 }).notNull(),
    shareExpiresAt: timestamp('share_expires_at', {
      withTimezone: true,
    }).notNull(),
    sosTriggeredAt: timestamp('sos_triggered_at', { withTimezone: true }),
    note: text('note'),
  },
  (table) => [
    uniqueIndex('safety_sessions_share_token_hash_unique').on(
      table.shareTokenHash,
    ),
    index('safety_sessions_user_started_idx').on(table.userId, table.startedAt),
    index('safety_sessions_expiry_idx').on(table.status, table.shareExpiresAt),
    check(
      'safety_sessions_status_check',
      sql`${table.status} IN ('active', 'sos', 'ended', 'revoked', 'expired')`,
    ),
    check(
      'safety_sessions_share_expiry_check',
      sql`${table.shareExpiresAt} > ${table.startedAt}`,
    ),
    check(
      'safety_sessions_expected_end_check',
      sql`${table.expectedEndAt} IS NULL OR (${table.expectedEndAt} > ${table.startedAt} AND ${table.expectedEndAt} <= ${table.shareExpiresAt})`,
    ),
  ],
);

export const safetyLocations = pgTable(
  'safety_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => safetySessions.id, { onDelete: 'cascade' }),
    location: geographyPoint('location').notNull(),
    accuracyMeters: doublePrecision('accuracy_meters').notNull(),
    batteryPercent: doublePrecision('battery_percent'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('safety_locations_session_recorded_idx').on(
      table.sessionId,
      table.recordedAt,
    ),
    index('safety_locations_retention_idx').on(table.recordedAt),
    check(
      'safety_locations_accuracy_check',
      sql`${table.accuracyMeters} >= 0 AND ${table.accuracyMeters} <= 10000`,
    ),
    check(
      'safety_locations_battery_check',
      sql`${table.batteryPercent} IS NULL OR (${table.batteryPercent} >= 0 AND ${table.batteryPercent} <= 100)`,
    ),
  ],
);

export const safetyAudits = pgTable(
  'safety_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    action: varchar('action', { length: 40 }).notNull(),
    sessionId: uuid('session_id').references(() => safetySessions.id, {
      onDelete: 'set null',
    }),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    metadata: jsonb('metadata')
      .$type<Record<string, string | number | boolean | null>>()
      .notNull()
      .default({}),
  },
  (table) => [
    index('safety_audits_session_occurred_idx').on(
      table.sessionId,
      table.occurredAt,
    ),
    index('safety_audits_retention_idx').on(table.occurredAt),
  ],
);
