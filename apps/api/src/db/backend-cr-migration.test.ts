import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const migrationUrl = new URL(
  '../../drizzle/0008_unknown_blindfold.sql',
  import.meta.url,
);
const savedItemFkMigrationUrl = new URL(
  '../../drizzle/0009_special_mole_man.sql',
  import.meta.url,
);

describe('Backend CR persistence migration', () => {
  it('adds event descriptions safely for existing rows', async () => {
    const migration = await readFile(migrationUrl, 'utf8');

    expect(migration).toContain(
      'ALTER TABLE "ride_events" ADD COLUMN "description" text;',
    );
    expect(migration).toContain(
      'UPDATE "ride_events" SET "description" = "requirements"',
    );
    expect(migration).toContain('ALTER COLUMN "description" SET NOT NULL');
  });

  it('adds bike visuals, route profiles, and unique user saved items', async () => {
    const migration = await readFile(migrationUrl, 'utf8');

    expect(migration).toContain(
      'ALTER TABLE "user_bikes" ADD COLUMN "avatar_preset" varchar(80)',
    );
    expect(migration).toContain(
      'ALTER TABLE "routes" ADD COLUMN "elevation_profile" jsonb',
    );
    expect(migration).toContain('CREATE TABLE "user_saved_items"');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "user_saved_items_user_kind_item_unique"',
    );
    expect(migration).toContain('CONSTRAINT "user_saved_items_kind_check"');
  });

  it('backfills saved-item targets before enforcing foreign keys', async () => {
    const migration = await readFile(savedItemFkMigrationUrl, 'utf8');

    expect(migration).toContain(
      'UPDATE "user_saved_items" SET "place_id" = "item_id"',
    );
    expect(migration).toContain(
      'UPDATE "user_saved_items" SET "route_id" = "item_id"',
    );
    expect(migration).toContain(
      'CONSTRAINT "user_saved_items_place_id_places_id_fk"',
    );
    expect(migration).toContain(
      'CONSTRAINT "user_saved_items_route_id_routes_id_fk"',
    );
    expect(migration).toContain(
      'CONSTRAINT "user_saved_items_exactly_one_target_check"',
    );
  });
});
