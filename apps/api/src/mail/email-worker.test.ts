import { describe, expect, it, vi } from 'vitest';

import { EmailWorker } from './email-worker.js';

const options = {
  apiKey: 'brevo-secret',
  senderEmail: 'noreply@goweskit.test',
  senderName: 'GowesKit',
};

describe('EmailWorker', () => {
  it('waits for Brevo acceptance before reporting delivery', async () => {
    const fetchFn = vi.fn(() =>
      Promise.resolve(new Response('{"messageId":"message-1"}', { status: 201 })),
    );
    const worker = new EmailWorker({ ...options, fetchFn });

    await worker.send({
      to: 'rider@example.com',
      subject: 'Kode OTP GowesKit',
      html: '<p>482915</p>',
      text: '482915',
    });

    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, request] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(request).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({ 'api-key': options.apiKey }),
    });
    expect(JSON.parse(String(request?.body))).toMatchObject({
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
      fetchFn: vi.fn(() =>
        Promise.resolve(
          new Response('{"message":"sensitive provider detail"}', {
            status: 401,
          }),
        ),
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
