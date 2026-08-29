import { describe, expect, it } from 'vitest';

import { AppError } from '../errors.js';
import { OtpService } from './otp-service.js';

describe('OtpService', () => {
  it('generates a 6-digit numeric OTP and verifies it successfully', () => {
    const service = new OtpService();
    const result = service.sendOtp({
      email: 'rider@example.com',
      purpose: 'register',
    });

    expect(result.success).toBe(true);
    expect(result.demoOtp).toBeDefined();
    expect(result.demoOtp).toMatch(/^\d{6}$/u);
    const generatedCode = result.demoOtp ?? '';

    // Verify using the generated OTP code
    const isValid = service.verifyOtp('rider@example.com', generatedCode);
    expect(isValid).toBe(true);

    // Reusing the same OTP should fail (single-use consumption)
    expect(() => service.verifyOtp('rider@example.com', generatedCode)).toThrow(
      AppError,
    );
  });

  it('rejects invalid OTP codes and tracks remaining attempts', () => {
    const service = new OtpService();
    service.sendOtp({
      email: 'test@example.com',
      purpose: 'register',
    });

    expect(() => service.verifyOtp('test@example.com', '000000')).toThrow(
      /Kode OTP salah/u,
    );
  });

  it('allows universal test code 123456 in test environments', () => {
    const service = new OtpService();
    expect(service.verifyOtp('any@example.com', '123456')).toBe(true);
  });

  it('disables demo OTP completely for production wiring', () => {
    const service = new OtpService({
      allowTestCode: false,
      enabled: false,
      exposeCode: false,
    });

    expect(() =>
      service.sendOtp({ email: 'rider@example.com', purpose: 'register' }),
    ).toThrow(expect.objectContaining({ code: 'OTP_UNAVAILABLE' }));
    expect(() => service.verifyOtp('rider@example.com', '123456')).toThrow(
      expect.objectContaining({ code: 'OTP_UNAVAILABLE' }),
    );
  });
});
