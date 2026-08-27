import { describe, expect, it } from 'vitest';

import {
  CONTRIBUTION_MODERATION_STATUSES,
  GPX_MAX_FILE_BYTES,
  createHazardReportRequestSchema,
  createPlaceReviewRequestSchema,
  createRouteReportRequestSchema,
  gpxImportRequestSchema,
  publicHazardReportSchema,
  publicPlaceReviewSchema,
  publicRouteReportSchema,
} from './explore-contributions.js';

const PLACE_ID = '019c9c80-2896-7593-bd02-509894b90101';
const ROUTE_ID = '019c9c80-2896-7593-bd02-509894b90102';
const CONTRIBUTION_ID = '019c9c80-2896-7593-bd02-509894b90103';

describe('Explore contribution contracts', () => {
  it('accepts place reviews only with an integer 1-5 rating and notes', () => {
    expect(
      createPlaceReviewRequestSchema.safeParse({
        placeId: PLACE_ID,
        rating: 5,
        notes: 'Helpful workshop and clear pricing.',
      }).success,
    ).toBe(true);
    for (const rating of [0, 6, 4.5]) {
      expect(
        createPlaceReviewRequestSchema.safeParse({
          placeId: PLACE_ID,
          rating,
          notes: 'A review.',
        }).success,
      ).toBe(false);
    }
    expect(
      createPlaceReviewRequestSchema.safeParse({
        placeId: PLACE_ID,
        rating: 4,
        notes: '   ',
      }).success,
    ).toBe(false);
  });

  it('validates route and hazard report vocabularies and explicit coordinates', () => {
    expect(
      createRouteReportRequestSchema.safeParse({
        routeId: ROUTE_ID,
        reportType: 'closure',
        notes: 'Bridge closed during inspection.',
        observedAt: '2026-08-28T02:00:00.000Z',
      }).success,
    ).toBe(true);
    expect(
      createHazardReportRequestSchema.safeParse({
        routeId: ROUTE_ID,
        hazardType: 'trail_obstruction',
        severity: 'danger',
        coordinate: { longitude: 107.6191, latitude: -6.9175 },
        notes: 'Fallen tree blocks the full trail width.',
      }).success,
    ).toBe(true);
    expect(
      createHazardReportRequestSchema.safeParse({
        hazardType: 'live_rider',
        severity: 'critical',
        coordinate: { longitude: 181, latitude: -91 },
        notes: 'Invalid.',
      }).success,
    ).toBe(false);
  });

  it('keeps public outputs approved-only and strict against reporter identity', () => {
    const common = {
      id: CONTRIBUTION_ID,
      moderationStatus: 'approved',
      createdAt: '2026-08-28T02:00:00.000Z',
    } as const;
    const placeReview = {
      ...common,
      placeId: PLACE_ID,
      rating: 5,
      notes: 'Helpful workshop.',
    };
    const routeReport = {
      ...common,
      routeId: ROUTE_ID,
      reportType: 'condition',
      notes: 'Loose gravel after rain.',
      observedAt: null,
    };
    const hazardReport = {
      ...common,
      routeId: ROUTE_ID,
      hazardType: 'road_damage',
      severity: 'caution',
      coordinate: { longitude: 107.6191, latitude: -6.9175 },
      notes: 'Deep pothole near the bend.',
      observedAt: null,
      locationMeaning: 'reported_hazard',
    };

    expect(publicPlaceReviewSchema.safeParse(placeReview).success).toBe(true);
    expect(publicRouteReportSchema.safeParse(routeReport).success).toBe(true);
    expect(publicHazardReportSchema.safeParse(hazardReport).success).toBe(true);

    for (const schemaAndValue of [
      [publicPlaceReviewSchema, placeReview],
      [publicRouteReportSchema, routeReport],
      [publicHazardReportSchema, hazardReport],
    ] as const) {
      const [schema, value] = schemaAndValue;
      expect(
        schema.safeParse({
          ...value,
          reporterUserId: '019c9c80-2896-7593-bd02-509894b90003',
        }).success,
      ).toBe(false);
      expect(
        schema.safeParse({ ...value, moderationStatus: 'pending' }).success,
      ).toBe(false);
    }
    expect(CONTRIBUTION_MODERATION_STATUSES).toEqual([
      'pending',
      'approved',
      'rejected',
    ]);
  });

  it('bounds GPX request shape before parsing', () => {
    expect(
      gpxImportRequestSchema.safeParse({
        fileName: 'morning-loop.gpx',
        content: '<gpx><trk><trkseg /></trk></gpx>',
      }).success,
    ).toBe(true);
    expect(
      gpxImportRequestSchema.safeParse({
        fileName: 'morning-loop.gpx',
        content: 'x'.repeat(GPX_MAX_FILE_BYTES + 1),
      }).success,
    ).toBe(false);
    expect(
      gpxImportRequestSchema.safeParse({
        fileName: '',
        content: '<gpx />',
        userLocation: { longitude: 107, latitude: -6 },
      }).success,
    ).toBe(false);
  });
});
