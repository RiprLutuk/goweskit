import {
  googleAuthRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  sendOtpRequestSchema,
  type AuthUserResponse,
  type SendOtpResponse,
  type SuccessResponse,
} from '@goweskit/contracts';
import type { FastifyInstance } from 'fastify';

import { SESSION_COOKIE_NAME } from '../auth/session.js';
import type { GoogleIdentityVerifier } from '../auth/google-identity.js';
import { AppError } from '../errors.js';
import { parseInput } from '../http/validation.js';
import type { AuthService } from '../services/auth-service.js';
import { OtpService } from '../services/otp-service.js';

export interface AuthRoutesOptions {
  authService: AuthService;
  googleIdentityVerifier?: GoogleIdentityVerifier;
  otpService?: OtpService;
  cookieSecure: boolean;
}

export function registerAuthRoutes(
  app: FastifyInstance,
  options: AuthRoutesOptions,
): void {
  const otpService = options.otpService ?? new OtpService();
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: options.cookieSecure,
    path: '/',
  };

  app.post<{ Reply: SendOtpResponse }>(
    '/api/v1/auth/otp/send',
    async (request) => {
      const input = parseInput(sendOtpRequestSchema, request.body);
      return await otpService.sendOtp(input);
    },
  );

  app.post<{ Reply: AuthUserResponse }>(
    '/api/v1/auth/register',
    async (request, reply) => {
      const input = parseInput(registerRequestSchema, request.body);
      otpService.verifyOtp(input.email, input.otp, 'register');
      const user = await options.authService.register(input);
      return reply.status(201).send({ user });
    },
  );

  app.post<{ Reply: AuthUserResponse }>(
    '/api/v1/auth/login',
    async (request, reply) => {
      const input = parseInput(loginRequestSchema, request.body);
      const session = await options.authService.login(input);

      reply.setCookie(SESSION_COOKIE_NAME, session.token, {
        ...cookieOptions,
        expires: session.expiresAt,
      });
      return { user: session.user };
    },
  );

  app.post<{ Reply: AuthUserResponse }>(
    '/api/v1/auth/google',
    async (request, reply) => {
      const input = parseInput(googleAuthRequestSchema, request.body);
      if (options.googleIdentityVerifier === undefined) {
        throw new AppError(
          'AUTH_GOOGLE_UNAVAILABLE',
          'Google sign-in is not configured.',
          503,
        );
      }
      const identity = await options.googleIdentityVerifier.verify(
        input.idToken,
      );
      const session = await options.authService.loginWithGoogle(identity);

      reply.setCookie(SESSION_COOKIE_NAME, session.token, {
        ...cookieOptions,
        expires: session.expiresAt,
      });
      return { user: session.user };
    },
  );

  app.post<{ Reply: SuccessResponse }>(
    '/api/v1/auth/logout',
    async (request, reply) => {
      await options.authService.logout(request.cookies[SESSION_COOKIE_NAME]);
      reply.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
      return { success: true };
    },
  );

  app.get<{ Reply: AuthUserResponse }>('/api/v1/auth/me', async (request) => ({
    user: await options.authService.authenticate(
      request.cookies[SESSION_COOKIE_NAME],
    ),
  }));
}
