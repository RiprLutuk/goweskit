import type { User } from '@goweskit/contracts';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { AppError } from '../errors.js';
import type { AuthService } from '../services/auth-service.js';
import { OtpService } from '../services/otp-service.js';
import { registerAuthRoutes } from './auth.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000002',
  displayName: 'Rider Tangerang',
  email: 'rider@example.com',
  createdAt: '2026-08-29T00:00:00.000Z',
};
const hashSecret = 'test-otp-hmac-secret-with-at-least-32-characters';
const openApps: FastifyInstance[] = [];

function buildRegistrationApp(otpService: OtpService) {
  let registrationCount = 0;
  const app = Fastify({ logger: false });
  const authService = {
    register: () => {
      registrationCount += 1;
      return Promise.resolve(user);
    },
  } as unknown as AuthService;
  app.setErrorHandler((error, request, reply) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Something went wrong.', 500);
    return reply.status(appError.statusCode).send({
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
      requestId: request.id,
    });
  });
  registerAuthRoutes(app, {
    authService,
    cookieSecure: false,
    otpService,
  });
  openApps.push(app);
  return { app, registrationCount: () => registrationCount };
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map((app) => app.close()));
});

describe('POST /api/v1/auth/register OTP policy', () => {
  const registration = {
    displayName: user.displayName,
    email: user.email,
    password: 'safe-password',
  };

  it('requires an OTP when email verification is enabled', async () => {
    const { app, registrationCount } = buildRegistrationApp(
      new OtpService({
        allowTestCode: true,
        enabled: true,
        exposeCode: true,
        hashSecret,
      }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: registration,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    });
    expect(registrationCount()).toBe(0);
  });

  it('allows password registration without OTP when verification is disabled', async () => {
    const { app, registrationCount } = buildRegistrationApp(new OtpService());

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: registration,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ user });
    expect(registrationCount()).toBe(1);
  });
});
