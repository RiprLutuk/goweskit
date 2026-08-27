import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const migrationUrl = new URL(
  '../../drizzle/0001_violet_katie_power.sql',
  import.meta.url,
);

describe('Explore PostGIS migration', () => {
  it('uses WGS84 geography columns and GiST spatial indexes', async () => {
    const migration = await readFile(migrationUrl, 'utf8');

    expect(migration).toContain('geography(Point,4326)');
    expect(migration).toContain('geography(LineString,4326)');
    expect(migration).toContain(
      'CREATE INDEX "places_location_gist_idx" ON "places" USING gist',
    );
    expect(migration).toContain(
      'CREATE INDEX "routes_geometry_gist_idx" ON "routes" USING gist',
    );
  });
});
