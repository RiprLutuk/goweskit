import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('Google authentication migration', () => {
  it('adds a stable Google subject while allowing passwordless provider users', async () => {
    const migration = await readFile(
      new URL('../../drizzle/0011_sturdy_starfox.sql', import.meta.url),
      'utf8',
    );
    expect(migration).toContain(
      'ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL',
    );
    expect(migration).toContain('ADD COLUMN "google_subject" varchar(255)');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "users_google_subject_unique"',
    );
    expect(migration).not.toMatch(/DROP TABLE|DROP COLUMN/iu);
  });
});
