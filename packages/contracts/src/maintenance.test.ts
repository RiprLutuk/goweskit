import { describe, expect, it } from 'vitest';

import {
  createMaintenanceEventRequestSchema,
  maintenanceEventSchema,
} from './maintenance.js';

describe('maintenance contracts', () => {
  it('accepts a dated maintenance log with an optional reminder', () => {
    expect(
      createMaintenanceEventRequestSchema.parse({
        type: 'chain_lube',
        performedAt: '2026-08-20',
        notes: 'Cleaned before applying wet-condition lube.',
        nextDueDate: '2026-09-20',
      }),
    ).toEqual({
      type: 'chain_lube',
      performedAt: '2026-08-20',
      notes: 'Cleaned before applying wet-condition lube.',
      nextDueDate: '2026-09-20',
    });
  });

  it('rejects a reminder before the service date', () => {
    expect(
      createMaintenanceEventRequestSchema.safeParse({
        type: 'tires',
        performedAt: '2026-08-20',
        nextDueDate: '2026-08-19',
      }).success,
    ).toBe(false);
  });

  it('rejects unknown types and oversized notes', () => {
    expect(
      createMaintenanceEventRequestSchema.safeParse({
        type: 'wash',
        performedAt: '2026-08-20',
      }).success,
    ).toBe(false);
    expect(
      createMaintenanceEventRequestSchema.safeParse({
        type: 'chain_clean',
        performedAt: '2026-08-20',
        notes: 'x'.repeat(2001),
      }).success,
    ).toBe(false);
  });

  it('keeps reminder status explicit in responses', () => {
    expect(
      maintenanceEventSchema.parse({
        id: '10000000-0000-4000-8000-000000000301',
        bikeId: '10000000-0000-4000-8000-000000000001',
        type: 'general_tune_up',
        performedAt: '2026-08-20',
        notes: null,
        nextDueDate: null,
        dueStatus: 'none',
        createdAt: '2026-08-20T08:00:00.000Z',
      }).dueStatus,
    ).toBe('none');
  });
});
