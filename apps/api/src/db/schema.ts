import type { BikeSpecCode } from '@goweskit/bike-domain';
import type {
  CommunityJoinMode,
  CommunityMembershipStatus,
  CommunityModerationDecision,
  CommunityRole,
  CommunityVisibility,
  EventParticipationStatus,
  EventStatus,
  EventVisibility,
  InstalledComponentStandardInput,
  MaintenanceEventType,
} from '@goweskit/contracts';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  customType,
  date,
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
