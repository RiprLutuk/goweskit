import type { BikeSpecCode } from '@goweskit/bike-domain';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  customType,
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
