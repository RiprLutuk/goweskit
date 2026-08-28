import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const migrationUrl = new URL(
  '../../drizzle/0006_fearless_aaron_stack.sql',
  import.meta.url,
);

describe('Explore contribution persistence migration', () => {
  it('uses PostGIS, spatial indexing, moderation constraints, and audits', async () => {
    const migration = await readFile(migrationUrl, 'utf8');

    expect(migration).toContain('"location" geography(Point,4326) NOT NULL');
    expect(migration).not.toContain('"geography(Point,4326)"');
    expect(migration).toContain(
      'CREATE INDEX "hazard_reports_location_gist_idx"',
    );
    expect(migration).toContain('"moderation_status" varchar(20)');
    expect(migration).toContain('"explore_moderation_audits"');
    expect(migration).toContain('"place_reviews_rating_check"');
  });
});
