import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const migrationUrl = new URL(
  '../../drizzle/0005_smooth_firestar.sql',
  import.meta.url,
);

describe('Ride Safety persistence migration', () => {
  it('stores only hashed share tokens and enforces bounded lifecycle data', async () => {
    const migration = await readFile(migrationUrl, 'utf8');

    expect(migration).toContain('"share_token_hash" varchar(64) NOT NULL');
    expect(migration).not.toMatch(/"share_token"\s/u);
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "safety_sessions_share_token_hash_unique"',
    );
    expect(migration).toContain('"location" geography(Point,4326)');
    expect(migration).toContain(
      'CREATE INDEX "safety_locations_retention_idx"',
    );
    expect(migration).toContain('CREATE INDEX "safety_audits_retention_idx"');
    expect(migration).toContain('ON DELETE set null');
  });
});
