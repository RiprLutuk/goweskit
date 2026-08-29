import { describe, expect, it } from 'vitest';

import { EmailWorker } from './email-worker.js';

const options = {
  apiKey: 'brevo-secret',
  senderEmail: 'noreply@goweskit.test',
  senderName: 'GowesKit',
};

describe('EmailWorker', () => {
  it('waits for Brevo acceptance before reporting delivery', async () => {
    let requestedUrl: string | URL | Request | undefined;
    let requestedOptions: RequestInit | undefined;
    let requestCount = 0;
    const fetchFn: typeof fetch = (input, init) => {
      requestCount += 1;
      requestedUrl = input;
      requestedOptions = init;
      return Promise.resolve(
        new Response('{"messageId":"message-1"}', { status: 201 }),
      );
    };
    const worker = new EmailWorker({ ...options, fetchFn });

    await worker.send({
      to: 'rider@example.com',
      subject: 'Kode OTP GowesKit',
      html: '<p>482915</p>',
      text: '482915',
    });

    expect(requestCount).toBe(1);
    expect(requestedUrl).toBe('https://api.brevo.com/v3/smtp/email');
    expect(requestedOptions?.method).toBe('POST');
    expect(new Headers(requestedOptions?.headers).get('api-key')).toBe(
      options.apiKey,
    );
    const requestBody = requestedOptions?.body;
    if (typeof requestBody !== 'string') {
      throw new Error('Expected a JSON string request body.');
    }
    const parsedBody: unknown = JSON.parse(requestBody);
    expect(parsedBody).toMatchObject({
      sender: {
        email: options.senderEmail,
        name: options.senderName,
      },
      subject: 'Kode OTP GowesKit',
      to: [{ email: 'rider@example.com' }],
    });
  });

  it('rejects provider failures without exposing the provider response body', async () => {
    const worker = new EmailWorker({
      ...options,
      fetchFn: () =>
        Promise.resolve(
          new Response('{"message":"sensitive provider detail"}', {
            status: 401,
          }),
        ),
    });

    await expect(
      worker.send({
        to: 'rider@example.com',
        subject: 'Kode OTP GowesKit',
        html: '<p>482915</p>',
        text: '482915',
      }),
    ).rejects.toThrow('Transactional email delivery was rejected.');
  });
});
