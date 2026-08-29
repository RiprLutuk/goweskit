import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { textArraySql } from './community-repository.js';

describe('community repository SQL helpers', () => {
  it('binds bicycle types as a PostgreSQL text array', () => {
    const query = new PgDialect().sqlToQuery(
      textArraySql(['mtb_hardtail', 'road']),
    );

    expect(query.sql).toBe('ARRAY[$1, $2]::text[]');
    expect(query.params).toEqual(['mtb_hardtail', 'road']);
  });
});
