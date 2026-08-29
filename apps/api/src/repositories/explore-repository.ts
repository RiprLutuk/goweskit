import {
  EXPLORE_MAX_RESULTS_PER_KIND,
  nearbyPlaceSchema,
  nearbyRouteSchema,
  routeElevationProfileSchema,
  type NearbyExploreRequest,
  type NearbyPlace,
  type NearbyRoute,
  type RouteElevationPoint,
} from '@goweskit/contracts';
import { eq, sql, type SQL } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import { places, routes } from '../db/schema.js';

interface PlaceQueryRow {
  id: string;
  type: string;
  name: string;
  description: string;
  address: string;
  bicycle_types: string[];
  beginner_friendly: boolean;
  verification_status: string;
  freshness: string;
  last_confirmed_at: Date | string;
  longitude: number;
  latitude: number;
  distance_meters: number;
}

interface RouteQueryRow {
  id: string;
  route_type: string;
  name: string;
  description: string;
  geometry: unknown;
  distance_meters: number;
  elevation_gain_meters: number;
  difficulty: string;
  surface: string;
  bicycle_types: string[];
  beginner_friendly: boolean;
  verification_status: string;
  freshness: string;
  last_confirmed_at: Date | string;
  distance_from_user_meters: number;
}

export interface ExploreRepository {
  findNearbyPlaces(input: NearbyExploreRequest): Promise<NearbyPlace[]>;
  findNearbyRoutes(input: NearbyExploreRequest): Promise<NearbyRoute[]>;
  findRouteElevationProfile(
    routeId: string,
  ): Promise<StoredRouteElevationProfile | null>;
}

export interface StoredRouteElevationProfile {
  routeId: string;
  elevationProfile: RouteElevationPoint[] | null;
}

export function validateRouteElevationProfile(
  value: unknown,
  routeDistanceMeters: number,
): RouteElevationPoint[] {
  const profile = routeElevationProfileSchema.parse(value);
  if (profile.at(-1)?.distanceMeters !== routeDistanceMeters) {
    throw new Error('Elevation profile must end at the route distance.');
  }
  return profile;
}

function optionalTextArrayMatch(
  column: SQL,
  values: readonly string[] | undefined,
): SQL {
  return values === undefined || values.length === 0
    ? sql`TRUE`
    : sql`${column}::text IN (${sql.join(
        values.map((value) => sql`${value}`),
        sql`, `,
      )})`;
}

function optionalTextMatch(column: SQL, value: string | undefined): SQL {
  return value === undefined ? sql`TRUE` : sql`${column}::text = ${value}`;
}

function optionalBooleanMatch(column: SQL, value: boolean | undefined): SQL {
  return value === undefined ? sql`TRUE` : sql`${column} = ${value}`;
}

function bikeTypeMatch(column: SQL, value: string | undefined): SQL {
  return value === undefined
    ? sql`TRUE`
    : sql`${column} @> ARRAY[${value}]::text[]`;
}

function freshnessSql(lastConfirmedAt: SQL): SQL {
  return sql`CASE
    WHEN ${lastConfirmedAt} >= NOW() - INTERVAL '90 days' THEN 'fresh'
    WHEN ${lastConfirmedAt} >= NOW() - INTERVAL '180 days' THEN 'aging'
    ELSE 'stale'
  END`;
}

function freshnessMatch(lastConfirmedAt: SQL, value: string | undefined): SQL {
  if (value === 'fresh') {
    return sql`${lastConfirmedAt} >= NOW() - INTERVAL '90 days'`;
  }
  if (value === 'aging') {
    return sql`${lastConfirmedAt} < NOW() - INTERVAL '90 days'
      AND ${lastConfirmedAt} >= NOW() - INTERVAL '180 days'`;
  }
  if (value === 'stale') {
    return sql`${lastConfirmedAt} < NOW() - INTERVAL '180 days'`;
  }
  return sql`TRUE`;
}

function verificationRankSql(verificationStatus: SQL): SQL {
  return sql`CASE ${verificationStatus}
    WHEN 'staff_verified' THEN 0
    WHEN 'community_verified' THEN 1
    ELSE 2
  END`;
}

function toIsoDate(value: Date | string): string {
  return (typeof value === 'string' ? new Date(value) : value).toISOString();
}

export class DrizzleExploreRepository implements ExploreRepository {
  public constructor(private readonly database: Database) {}

  public async findNearbyPlaces(
    input: NearbyExploreRequest,
  ): Promise<NearbyPlace[]> {
    const center = sql`ST_SetSRID(ST_MakePoint(${input.center.longitude}, ${input.center.latitude}), 4326)::geography`;
    const radiusMeters = input.radiusKm * 1000;
    const conditions = [
      sql`ST_DWithin(${places.location}, ${center}, ${radiusMeters})`,
      optionalTextArrayMatch(sql`${places.type}`, input.placeTypes),
      bikeTypeMatch(sql`${places.bicycleTypes}`, input.bikeType),
      optionalBooleanMatch(
        sql`${places.beginnerFriendly}`,
        input.beginnerFriendly,
      ),
      optionalTextMatch(
        sql`${places.verificationStatus}`,
        input.verificationStatus,
      ),
      freshnessMatch(sql`${places.lastConfirmedAt}`, input.freshness),
    ];

    const result = await this.database.execute(sql`
      SELECT
        ${places.id} AS id,
        ${places.type} AS type,
        ${places.name} AS name,
        ${places.description} AS description,
        ${places.address} AS address,
        ${places.bicycleTypes} AS bicycle_types,
        ${places.beginnerFriendly} AS beginner_friendly,
        ${places.verificationStatus} AS verification_status,
        ${freshnessSql(sql`${places.lastConfirmedAt}`)} AS freshness,
        ${places.lastConfirmedAt} AS last_confirmed_at,
        ST_X(${places.location}::geometry) AS longitude,
        ST_Y(${places.location}::geometry) AS latitude,
        ROUND(ST_Distance(${places.location}, ${center}))::integer AS distance_meters
      FROM ${places}
      WHERE ${sql.join(conditions, sql` AND `)}
      ORDER BY
        ${verificationRankSql(sql`${places.verificationStatus}`)},
        ${places.lastConfirmedAt} DESC,
        distance_meters ASC
      LIMIT ${EXPLORE_MAX_RESULTS_PER_KIND}
    `);

    return (result.rows as unknown as PlaceQueryRow[]).map((row) =>
      nearbyPlaceSchema.parse({
        id: row.id,
        kind: 'place',
        type: row.type,
        name: row.name,
        description: row.description,
        address: row.address,
        bicycleTypes: row.bicycle_types,
        beginnerFriendly: row.beginner_friendly,
        verificationStatus: row.verification_status,
        freshness: row.freshness,
        lastConfirmedAt: toIsoDate(row.last_confirmed_at),
        coordinate: {
          longitude: row.longitude,
          latitude: row.latitude,
        },
        distanceMeters: row.distance_meters,
      }),
    );
  }

  public async findNearbyRoutes(
    input: NearbyExploreRequest,
  ): Promise<NearbyRoute[]> {
    const center = sql`ST_SetSRID(ST_MakePoint(${input.center.longitude}, ${input.center.latitude}), 4326)::geography`;
    const radiusMeters = input.radiusKm * 1000;
    const conditions = [
      sql`ST_DWithin(${routes.geometry}, ${center}, ${radiusMeters})`,
      optionalTextArrayMatch(sql`${routes.routeType}`, input.routeTypes),
      optionalTextMatch(sql`${routes.difficulty}`, input.difficulty),
      optionalTextMatch(sql`${routes.surface}`, input.surface),
      bikeTypeMatch(sql`${routes.bicycleTypes}`, input.bikeType),
      optionalBooleanMatch(
        sql`${routes.beginnerFriendly}`,
        input.beginnerFriendly,
      ),
      optionalTextMatch(
        sql`${routes.verificationStatus}`,
        input.verificationStatus,
      ),
      freshnessMatch(sql`${routes.lastConfirmedAt}`, input.freshness),
    ];

    const result = await this.database.execute(sql`
      SELECT
        ${routes.id} AS id,
        ${routes.routeType} AS route_type,
        ${routes.name} AS name,
        ${routes.description} AS description,
        ST_AsGeoJSON(${routes.geometry}::geometry)::json AS geometry,
        ${routes.distanceMeters} AS distance_meters,
        ${routes.elevationGainMeters} AS elevation_gain_meters,
        ${routes.difficulty} AS difficulty,
        ${routes.surface} AS surface,
        ${routes.bicycleTypes} AS bicycle_types,
        ${routes.beginnerFriendly} AS beginner_friendly,
        ${routes.verificationStatus} AS verification_status,
        ${freshnessSql(sql`${routes.lastConfirmedAt}`)} AS freshness,
        ${routes.lastConfirmedAt} AS last_confirmed_at,
        ROUND(ST_Distance(${routes.geometry}, ${center}))::integer AS distance_from_user_meters
      FROM ${routes}
      WHERE ${sql.join(conditions, sql` AND `)}
      ORDER BY
        ${verificationRankSql(sql`${routes.verificationStatus}`)},
        ${routes.lastConfirmedAt} DESC,
        distance_from_user_meters ASC
      LIMIT ${EXPLORE_MAX_RESULTS_PER_KIND}
    `);

    return (result.rows as unknown as RouteQueryRow[]).map((row) =>
      nearbyRouteSchema.parse({
        id: row.id,
        kind: 'route',
        routeType: row.route_type,
        name: row.name,
        description: row.description,
        geometry: row.geometry,
        distanceMeters: row.distance_meters,
        elevationGainMeters: row.elevation_gain_meters,
        difficulty: row.difficulty,
        surface: row.surface,
        bicycleTypes: row.bicycle_types,
        beginnerFriendly: row.beginner_friendly,
        verificationStatus: row.verification_status,
        freshness: row.freshness,
        lastConfirmedAt: toIsoDate(row.last_confirmed_at),
        distanceFromUserMeters: row.distance_from_user_meters,
      }),
    );
  }

  public async findRouteElevationProfile(
    routeId: string,
  ): Promise<StoredRouteElevationProfile | null> {
    const [route] = await this.database
      .select({
        routeId: routes.id,
        distanceMeters: routes.distanceMeters,
        elevationProfile: routes.elevationProfile,
      })
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);
    if (route === undefined) return null;
    const elevationProfile =
      route.elevationProfile === null
        ? null
        : validateRouteElevationProfile(
            route.elevationProfile,
            route.distanceMeters,
          );
    return {
      routeId: route.routeId,
      elevationProfile,
    };
  }
}
