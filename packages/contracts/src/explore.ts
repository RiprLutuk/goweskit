import { z } from 'zod';

export const EXPLORE_MAX_RADIUS_KM = 50;
export const EXPLORE_MAX_RESULTS_PER_KIND = 100;

export const PLACE_TYPES = [
  'workshop',
  'store',
  'trailhead',
  'bike_park',
  'meeting_point',
  'water',
  'coffee',
  'rest',
] as const;

export const ROUTE_TYPES = ['road', 'gravel', 'mtb', 'city'] as const;
export const ROUTE_DIFFICULTIES = ['easy', 'moderate', 'hard'] as const;
export const ROUTE_SURFACES = ['paved', 'mixed', 'gravel', 'trail'] as const;
export const VERIFICATION_STATUSES = [
  'staff_verified',
  'community_verified',
  'unverified',
] as const;
export const FRESHNESS_STATUSES = ['fresh', 'aging', 'stale'] as const;

export const coordinateSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});
export type Coordinate = z.infer<typeof coordinateSchema>;

const linePositionSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

export const nearbyExploreRequestSchema = z.object({
  center: coordinateSchema,
  radiusKm: z.number().min(1).max(EXPLORE_MAX_RADIUS_KM).default(10),
  placeTypes: z.array(z.enum(PLACE_TYPES)).max(PLACE_TYPES.length).optional(),
  routeTypes: z.array(z.enum(ROUTE_TYPES)).max(ROUTE_TYPES.length).optional(),
  bikeType: z.string().trim().min(1).max(80).optional(),
  difficulty: z.enum(ROUTE_DIFFICULTIES).optional(),
  surface: z.enum(ROUTE_SURFACES).optional(),
  beginnerFriendly: z.boolean().optional(),
  verificationStatus: z.enum(VERIFICATION_STATUSES).optional(),
  freshness: z.enum(FRESHNESS_STATUSES).optional(),
});
export type NearbyExploreRequest = z.infer<typeof nearbyExploreRequestSchema>;

const discoverableBaseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  bicycleTypes: z.array(z.string()),
  beginnerFriendly: z.boolean(),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  freshness: z.enum(FRESHNESS_STATUSES),
  lastConfirmedAt: z.iso.datetime(),
});

export const nearbyPlaceSchema = discoverableBaseSchema.extend({
  kind: z.literal('place'),
  type: z.enum(PLACE_TYPES),
  address: z.string(),
  coordinate: coordinateSchema,
  distanceMeters: z.number().nonnegative(),
});
export type NearbyPlace = z.infer<typeof nearbyPlaceSchema>;

export const nearbyRouteSchema = discoverableBaseSchema.extend({
  kind: z.literal('route'),
  routeType: z.enum(ROUTE_TYPES),
  geometry: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(linePositionSchema).min(2),
  }),
  distanceMeters: z.number().positive(),
  elevationGainMeters: z.number().nonnegative(),
  difficulty: z.enum(ROUTE_DIFFICULTIES),
  surface: z.enum(ROUTE_SURFACES),
  distanceFromUserMeters: z.number().nonnegative(),
});
export type NearbyRoute = z.infer<typeof nearbyRouteSchema>;

export const nearbyExploreResponseSchema = z.object({
  center: coordinateSchema,
  radiusKm: z.number().min(1).max(EXPLORE_MAX_RADIUS_KM),
  places: z.array(nearbyPlaceSchema).max(EXPLORE_MAX_RESULTS_PER_KIND),
  routes: z.array(nearbyRouteSchema).max(EXPLORE_MAX_RESULTS_PER_KIND),
});
export type NearbyExploreResponse = z.infer<typeof nearbyExploreResponseSchema>;
