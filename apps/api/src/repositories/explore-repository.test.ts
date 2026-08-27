import type { NearbyExploreRequest } from '@goweskit/contracts';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import type { Database } from '../db/client.js';
import { DrizzleExploreRepository } from './explore-repository.js';

describe('DrizzleExploreRepository', () => {
  it('parameterizes multi-value place and route type filters', async () => {
    const capturedQueries: unknown[] = [];
    const database = {
      execute: (query: unknown) => {
        capturedQueries.push(query);
        return Promise.resolve({ rows: [] });
      },
    } as unknown as Database;
    const repository = new DrizzleExploreRepository(database);
    const input: NearbyExploreRequest = {
      center: { longitude: 107.6191, latitude: -6.9175 },
      radiusKm: 15,
      placeTypes: ['workshop', 'water'],
      routeTypes: ['gravel', 'mtb'],
    };

    await repository.findNearbyPlaces(input);
    await repository.findNearbyRoutes(input);

    const dialect = new PgDialect();
    const [placeQuery, routeQuery] = capturedQueries.map((query) =>
      dialect.sqlToQuery(query as Parameters<PgDialect['sqlToQuery']>[0]),
    );

    expect(placeQuery?.sql).toContain('"places"."type"::text IN (');
    expect(placeQuery?.params).toEqual(
      expect.arrayContaining(['workshop', 'water']),
    );
    expect(routeQuery?.sql).toContain('"routes"."route_type"::text IN (');
    expect(routeQuery?.params).toEqual(
      expect.arrayContaining(['gravel', 'mtb']),
    );
  });
});
