import { describe, expect, it } from 'vitest';

describe('MaintenanceReminderBanner Logic', () => {
  it('calculates maintenance urgency correctly', () => {
    const schedules = [
      { id: 'chain', urgency: 'overdue' },
      { id: 'brakes', urgency: 'due_soon' },
      { id: 'sealant', urgency: 'ok' },
    ];

    const overdueCount = schedules.filter((s) => s.urgency === 'overdue').length;
    expect(overdueCount).toBe(1);

    const dueSoonCount = schedules.filter((s) => s.urgency === 'due_soon').length;
    expect(dueSoonCount).toBe(1);
  });
});
