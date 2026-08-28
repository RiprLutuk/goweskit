import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import type { Database } from '../db/client.js';
import { AppError } from '../errors.js';
import { DrizzleSafetyRepository } from './drizzle-repository.js';

describe('DrizzleSafetyRepository', () => {
  it('parameterizes the token hash lookup without accepting a raw token', async () => {
    const queries: unknown[] = [];
    const database = {
      execute: (query: unknown) => {
        queries.push(query);
        return Promise.resolve({ rows: [] });
      },
    } as unknown as Database;
    const repository = new DrizzleSafetyRepository(database);
    const tokenHash = 'a'.repeat(64);

    await expect(
      repository.findSessionByTokenHash(tokenHash),
    ).resolves.toBeNull();

    const query = new PgDialect().sqlToQuery(
      queries[0] as Parameters<PgDialect['sqlToQuery']>[0],
    );
    expect(query.sql).toContain('s.share_token_hash = $1');
    expect(query.params).toEqual([tokenHash]);
    expect(query.sql).not.toContain(tokenHash);
  });

  it('guards location inserts with active/SOS status and unexpired sharing', async () => {
    const queries: unknown[] = [];
    const database = {
      execute: (query: unknown) => {
        queries.push(query);
        return Promise.resolve({ rows: [] });
      },
    } as unknown as Database;
    const repository = new DrizzleSafetyRepository(database);

    await expect(
      repository.appendLocation('10000000-0000-4000-8000-000000000001', {
        coordinate: { longitude: 107.6191, latitude: -6.9175 },
        accuracyMeters: 12,
        recordedAt: '2026-08-28T01:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(AppError);

    const query = new PgDialect().sqlToQuery(
      queries[0] as Parameters<PgDialect['sqlToQuery']>[0],
    );
    expect(query.sql).toContain("s.status IN ('active', 'sos')");
    expect(query.sql).toContain('s.share_expires_at >');
    expect(query.params).toEqual(
      expect.arrayContaining([107.6191, -6.9175, 12]),
    );
  });
});
