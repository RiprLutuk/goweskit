import { apiErrorResponseSchema, type User } from '@goweskit/contracts';
import {
  SAFETY_DISCLAIMER,
  createSafetySessionResponseSchema,
  safetyShareResponseSchema,
} from '@goweskit/contracts/safety';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp, type AppServices } from '../app.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000010',
  displayName: 'Demo Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const contactId = '10000000-0000-4000-8000-000000000020';
const sessionId = '10000000-0000-4000-8000-000000000030';
const shareToken = 'A'.repeat(43);
const session = {
  id: sessionId,
  status: 'active' as const,
  startedAt: '2026-08-28T01:00:00.000Z',
  expectedEndAt: '2026-08-28T02:00:00.000Z',
  endedAt: null,
  shareExpiresAt: '2026-08-28T03:00:00.000Z',
  sosTriggeredAt: null,
  note: 'Morning loop.',
  lastLocation: null,
};
const openApps: ReturnType<typeof buildApp>[] = [];

function buildSafetyApp() {
  const authenticate = vi.fn(() => Promise.resolve(user));
  const startSession = vi.fn(() =>
    Promise.resolve({ session, shareToken, disclaimer: SAFETY_DISCLAIMER }),
  );
  const getPublicShare = vi.fn(() =>
    Promise.resolve({
      riderDisplayName: user.displayName,
      status: session.status,
      startedAt: session.startedAt,
      expectedEndAt: session.expectedEndAt,
      endedAt: session.endedAt,
      shareExpiresAt: session.shareExpiresAt,
      sosTriggeredAt: session.sosTriggeredAt,
      lastLocation: null,
      locationIsLive: false as const,
      disclaimer: SAFETY_DISCLAIMER,
    }),
  );
  const safety = {
    listTrustedContacts: () => Promise.resolve([]),
    createTrustedContact: () => Promise.reject(new Error('not used')),
    deleteTrustedContact: () => Promise.resolve(),
    listSessions: () => Promise.resolve([]),
    startSession,
    updateLocation: () =>
      Promise.resolve({ session, disclaimer: SAFETY_DISCLAIMER }),
    triggerSos: () =>
      Promise.resolve({ session, disclaimer: SAFETY_DISCLAIMER }),
    endSession: () =>
      Promise.resolve({ session, disclaimer: SAFETY_DISCLAIMER }),
    revokeSession: () =>
      Promise.resolve({ session, disclaimer: SAFETY_DISCLAIMER }),
    getPublicShare,
  } as unknown as NonNullable<AppServices['safety']>;
  const app = buildApp({
    logger: false,
    services: {
      auth: { authenticate } as unknown as AppServices['auth'],
      catalog: {} as AppServices['catalog'],
      compatibility: {} as AppServices['compatibility'],
      community: {} as AppServices['community'],
      explore: {} as AppServices['explore'],
      garage: {} as AppServices['garage'],
      installedComponents: {} as AppServices['installedComponents'],
      maintenance: {} as AppServices['maintenance'],
      safety,
    },
  });
  openApps.push(app);
  return { app, authenticate, startSession, getPublicShare };
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('Ride Safety routes', () => {
  it('requires explicit consent and disclaimer acknowledgement to start', async () => {
    const context = buildSafetyApp();
    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/safety/sessions',
      payload: {
        trustedContactId: contactId,
        shareDurationMinutes: 120,
        explicitLocationConsent: false,
        disclaimerAcknowledged: true,
      },
    });
    const body = apiErrorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(context.startSession).not.toHaveBeenCalled();
  });

  it('returns a high-entropy share token once when starting explicitly', async () => {
    const context = buildSafetyApp();
    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/safety/sessions',
      payload: {
        trustedContactId: contactId,
        shareDurationMinutes: 120,
        explicitLocationConsent: true,
        disclaimerAcknowledged: true,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createSafetySessionResponseSchema.parse(response.json())).toEqual(
      expect.objectContaining({ shareToken }),
    );
    expect(context.authenticate).toHaveBeenCalledOnce();
  });

  it('resolves a public share from a POST body without authentication', async () => {
    const context = buildSafetyApp();
    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/safety/share',
      payload: { token: shareToken },
      remoteAddress: '203.0.113.10',
    });
    const body = safetyShareResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(body.locationIsLive).toBe(false);
    expect(body.disclaimer.emergencyDispatchProvided).toBe(false);
    expect(context.authenticate).not.toHaveBeenCalled();
    expect(context.getPublicShare).toHaveBeenCalledWith(
      shareToken,
      '203.0.113.10',
    );
  });

  it('rejects malformed share tokens without placing them in the URL', async () => {
    const context = buildSafetyApp();
    const response = await context.app.inject({
      method: 'POST',
      url: '/api/v1/safety/share',
      payload: { token: 'short' },
    });
    const body = apiErrorResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(context.getPublicShare).not.toHaveBeenCalled();
  });
});
