import {
  apiErrorResponseSchema,
  compatibilityEvaluationSchema,
  compatibilityRuleListResponseSchema,
  compatibilityRuleSchema,
  type Bike,
  type User,
} from '@goweskit/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp, type AppServices } from '../app.js';
import { AppError } from '../errors.js';
import { CompatibilityService } from '../services/compatibility-service.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000010',
  displayName: 'Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const bike: Bike = {
  id: '10000000-0000-4000-8000-000000000001',
  nickname: 'Trail Buddy',
  bicycleType: {
    id: '10000000-0000-4000-8000-000000000002',
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

const openApps: ReturnType<typeof buildApp>[] = [];

function makeApp(options: { authenticated?: boolean } = {}) {
  const getBike = vi.fn(() => Promise.resolve(bike));
  const app = buildApp({
    logger: false,
    services: {
      auth: {
        authenticate: () =>
          options.authenticated === false
            ? Promise.reject(
                new AppError('AUTH_REQUIRED', 'Sign in to continue.', 401),
              )
            : Promise.resolve(user),
      } as unknown as AppServices['auth'],
      catalog: {} as AppServices['catalog'],
      compatibility: new CompatibilityService({ getBike }),
      explore: {} as AppServices['explore'],
      garage: {} as AppServices['garage'],
      installedComponents: {} as AppServices['installedComponents'],
      maintenance: {} as AppServices['maintenance'],
    },
  });
  openApps.push(app);
  return { app, getBike };
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('compatibility routes', () => {
  it('publishes all normalized rules and their provenance', async () => {
    const response = await makeApp().app.inject({
      method: 'GET',
      url: '/api/v1/compatibility/standards',
    });
    const body = compatibilityRuleListResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(body.rules).toHaveLength(15);
    expect(
      body.rules.every((rule) => rule.provenance.sourceUrl.length > 0),
    ).toBe(true);
  });

  it('returns one rule using the shared response contract', async () => {
    const response = await makeApp().app.inject({
      method: 'GET',
      url: '/api/v1/compatibility/rules/fork_travel',
    });

    expect(response.statusCode).toBe(200);
    expect(compatibilityRuleSchema.parse(response.json())).toMatchObject({
      code: 'fork_travel',
      bikeSpecCode: 'fork_travel_max_mm',
    });
  });

  it('evaluates only after authentication and loads the owned bike', async () => {
    const { app, getBike } = makeApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/compatibility/evaluate',
      payload: {
        bikeId: bike.id,
        candidates: [
          { ruleCode: 'wheel_size', knowledge: 'known', value: 'iso_622' },
        ],
      },
    });
    const body = compatibilityEvaluationSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(body.status).toBe('compatible');
    expect(body.checksPerformed[0]).toMatchObject({
      bikeValue: 'iso_622',
      candidateValue: 'iso_622',
    });
    expect(getBike).toHaveBeenCalledWith(user, bike.id);
  });

  it('rejects anonymous and invalid evaluations with stable errors', async () => {
    const anonymous = await makeApp({ authenticated: false }).app.inject({
      method: 'POST',
      url: '/api/v1/compatibility/evaluate',
      payload: {
        bikeId: bike.id,
        candidates: [{ ruleCode: 'wheel_size', knowledge: 'unknown' }],
      },
    });
    const invalid = await makeApp().app.inject({
      method: 'POST',
      url: '/api/v1/compatibility/evaluate',
      payload: {
        bikeId: bike.id,
        candidates: [
          { ruleCode: 'wheel_size', knowledge: 'known', value: '29er-ish' },
        ],
      },
    });

    expect(anonymous.statusCode).toBe(401);
    expect(apiErrorResponseSchema.parse(anonymous.json()).error.code).toBe(
      'AUTH_REQUIRED',
    );
    expect(invalid.statusCode).toBe(400);
    expect(apiErrorResponseSchema.parse(invalid.json()).error.code).toBe(
      'INVALID_REQUEST',
    );
  });
});
