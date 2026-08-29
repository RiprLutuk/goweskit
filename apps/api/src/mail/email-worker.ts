export interface EmailJob {
  html: string;
  subject: string;
  text: string;
  to: string;
}

export interface EmailWorkerOptions {
  apiKey: string;
  fetchFn?: typeof fetch;
  senderEmail: string;
  senderName: string;
  timeoutMs?: number;
}

export class EmailWorker {
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  public constructor(private readonly options: EmailWorkerOptions) {
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  public async send(job: EmailJob): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetchFn(
        'https://api.brevo.com/v3/smtp/email',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': this.options.apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: this.options.senderName,
              email: this.options.senderEmail,
            },
            to: [{ email: job.to }],
            subject: job.subject,
            htmlContent: job.html,
            textContent: job.text,
            tags: ['goweskit', 'authentication', 'otp'],
          }),
          signal: controller.signal,
        },
      );
      if (response.status !== 201) {
        await response.body?.cancel();
        throw new Error('Transactional email delivery was rejected.');
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
