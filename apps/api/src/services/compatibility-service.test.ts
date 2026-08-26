import type { Bike, User } from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import { CompatibilityService } from './compatibility-service.js';

const user: User = {
  id: '019c9c80-2896-7593-bd02-509894b90003',
  displayName: 'Ayu',
  email: 'ayu@example.com',
  createdAt: '2026-08-27T00:00:00.000Z',
};

const bike: Bike = {
  id: '019c9c80-2896-7593-bd02-509894b90002',
  nickname: 'Trail Buddy',
  bicycleType: {
    id: '019c9c80-2896-7593-bd02-509894b90001',
    slug: 'mtb_hardtail',
    name: 'MTB Hardtail',
  },
  brand: null,
  model: null,
  modelYear: null,
  notes: null,
  specs: [
    {
      standardCode: 'wheel_size',
      label: 'Wheel size',
      knowledge: 'known',
      value: 'iso_622',
      valueLabel: '29 in / 700C (ISO 622)',
      confidence: 'user_entered',
      source: 'garage_edit',
      updatedAt: '2026-08-27T00:00:00.000Z',
    },
  ],
  createdAt: '2026-08-27T00:00:00.000Z',
  updatedAt: '2026-08-27T00:00:00.000Z',
};

describe('CompatibilityService', () => {
  it('loads the owned bike and delegates status to deterministic rules', async () => {
    const service = new CompatibilityService({
      getBike: () => Promise.resolve(bike),
    });
    const result = await service.evaluate(user, bike.id, [
      { ruleCode: 'wheel_size', knowledge: 'known', value: 'iso_622' },
    ]);
    expect(result.status).toBe('compatible');
    expect(result.checksPerformed[0]?.provenance.ruleCode).toBe('wheel_size');
  });

  it('publishes candidate values and provenance with each rule', () => {
    const service = new CompatibilityService({
      getBike: () => Promise.resolve(bike),
    });
    expect(service.listRules()).toHaveLength(6);
    expect(service.getRule('freehub_cassette')).toMatchObject({
      bikeSpecCode: 'freehub',
      provenance: { ruleVersion: '1.0.0' },
    });
  });
});
