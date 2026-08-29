import { describe, expect, it } from 'vitest';

import { registerRequestSchema, sendOtpRequestSchema } from './auth.js';

describe('authentication contracts', () => {
  it('requires a six-digit OTP for password registration', () => {
    const registration = {
      displayName: 'Ayu Rider',
      email: 'ayu@example.com',
      password: 'safe-password',
    };

    expect(registerRequestSchema.safeParse(registration).success).toBe(false);
    expect(
      registerRequestSchema.safeParse({ ...registration, otp: '482915' })
        .success,
    ).toBe(true);
  });

  it('supports only the implemented registration OTP purpose', () => {
    expect(
      sendOtpRequestSchema.parse({ email: 'ayu@example.com' }).purpose,
    ).toBe('register');
    expect(
      sendOtpRequestSchema.safeParse({
        email: 'ayu@example.com',
        purpose: 'reset_password',
      }).success,
    ).toBe(false);
  });
});
