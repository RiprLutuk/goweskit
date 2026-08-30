import { describe, expect, it } from 'vitest';

import { registerRequestSchema, sendOtpRequestSchema } from './auth.js';

describe('authentication contracts', () => {
  it('accepts an optional OTP while validating its six-digit format', () => {
    const registration = {
      displayName: 'Ayu Rider',
      email: 'ayu@example.com',
      password: 'safe-password',
    };

    expect(registerRequestSchema.safeParse(registration).success).toBe(true);
    expect(
      registerRequestSchema.safeParse({ ...registration, otp: '482915' })
        .success,
    ).toBe(true);
    expect(
      registerRequestSchema.safeParse({ ...registration, otp: '48291' })
        .success,
    ).toBe(false);
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
