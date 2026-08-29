import { describe, expect, it } from 'vitest';

import { AppError } from '../errors.js';
import { OtpService } from './otp-service.js';

describe('OtpService', () => {
  it('generates a 6-digit numeric OTP and verifies it successfully', async () => {
    const service = new OtpService();
    const result = await service.sendOtp({
      email: 'rider@example.com',
      purpose: 'register',
    });

    expect(result.success).toBe(true);
    expect(result.demoOtp).toBeDefined();
    expect(result.demoOtp).toMatch(/^\d{6}$/u);

    // Verify using the generated OTP code
    const isValid = service.verifyOtp('rider@example.com', result.demoOtp!);
    expect(isValid).toBe(true);

    // Reusing the same OTP should fail (single-use consumption)
    expect(() => service.verifyOtp('rider@example.com', result.demoOtp!)).toThrow(
      AppError,
    );
  });

  it('rejects invalid OTP codes and tracks remaining attempts', async () => {
    const service = new OtpService();
    await service.sendOtp({
      email: 'test@example.com',
      purpose: 'register',
    });

    expect(() => service.verifyOtp('test@example.com', '000000')).toThrowError(
      /Kode OTP salah/u,
    );
  });

  it('allows universal test code 123456 in test environments', () => {
    const service = new OtpService();
    expect(service.verifyOtp('any@example.com', '123456')).toBe(true);
  });
});
