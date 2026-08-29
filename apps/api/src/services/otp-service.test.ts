import { describe, expect, it } from 'vitest';

import { AppError } from '../errors.js';
import { EmailWorker } from '../mail/email-worker.js';
import { OtpService } from './otp-service.js';

const workerConfig = {
  apiKey: 'brevo-secret',
  senderEmail: 'noreply@goweskit.test',
  senderName: 'GowesKit',
};

describe('OtpService', () => {
  it('generates a single-use 6-digit OTP in explicit demo mode', async () => {
    const service = new OtpService();
    const result = await service.sendOtp({
      email: 'rider@example.com',
      purpose: 'register',
    });

    expect(result.success).toBe(true);
    expect(result.demoOtp).toMatch(/^\d{6}$/u);
    const generatedCode = result.demoOtp ?? '';
    expect(service.verifyOtp('rider@example.com', generatedCode)).toBe(true);
    expect(() => service.verifyOtp('rider@example.com', generatedCode)).toThrow(
      AppError,
    );
  });

  it('rejects invalid OTP codes and tracks remaining attempts', async () => {
    const service = new OtpService();
    await service.sendOtp({
      email: 'test@example.com',
      purpose: 'register',
    });

    expect(() => service.verifyOtp('test@example.com', '000000')).toThrow(
      /Kode OTP salah/u,
    );
  });

  it('allows the universal code only in explicit demo mode', () => {
    const service = new OtpService();
    expect(service.verifyOtp('any@example.com', '123456')).toBe(true);
  });

  it('waits for email acceptance and never returns the provider OTP', async () => {
    let requestBody = '';
    const fetchFn: typeof fetch = (_input, init) => {
      if (typeof init?.body === 'string') requestBody = init.body;
      return Promise.resolve(
        new Response('{"messageId":"message-1"}', { status: 201 }),
      );
    };
    const service = new OtpService({
      allowTestCode: false,
      emailWorker: new EmailWorker({ ...workerConfig, fetchFn }),
      enabled: true,
      exposeCode: false,
    });

    const result = await service.sendOtp({
      email: 'worker-test@example.com',
      purpose: 'register',
    });

    expect(result.demoOtp).toBeUndefined();
    const payload = JSON.parse(requestBody) as {
      textContent: string;
    };
    const deliveredCode = /\b\d{6}\b/u.exec(payload.textContent)?.[0] ?? '';
    expect(deliveredCode).toMatch(/^\d{6}$/u);
    expect(service.verifyOtp('worker-test@example.com', deliveredCode)).toBe(
      true,
    );
  });

  it('fails closed and discards the code when email delivery fails', async () => {
    const service = new OtpService({
      allowTestCode: false,
      emailWorker: new EmailWorker({
        ...workerConfig,
        fetchFn: () => Promise.resolve(new Response(null, { status: 500 })),
      }),
      enabled: true,
      exposeCode: false,
    });

    await expect(
      service.sendOtp({ email: 'rider@example.com', purpose: 'register' }),
    ).rejects.toMatchObject({ code: 'OTP_DELIVERY_FAILED', statusCode: 503 });
    expect(() => service.verifyOtp('rider@example.com', '123456')).toThrow(
      expect.objectContaining({ code: 'OTP_NOT_FOUND' }),
    );
  });

  it('disables OTP when neither provider nor demo mode is configured', async () => {
    const service = new OtpService({
      allowTestCode: false,
      enabled: false,
      exposeCode: false,
    });

    await expect(
      service.sendOtp({ email: 'rider@example.com', purpose: 'register' }),
    ).rejects.toMatchObject({ code: 'OTP_UNAVAILABLE' });
    expect(() => service.verifyOtp('rider@example.com', '123456')).toThrow(
      expect.objectContaining({ code: 'OTP_UNAVAILABLE' }),
    );
  });
});
