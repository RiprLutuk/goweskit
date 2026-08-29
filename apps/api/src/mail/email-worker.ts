import { randomUUID } from 'node:crypto';

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  text?: string;
  id?: string;
  attempts?: number;
  createdAt?: number;
}

export interface EmailWorkerOptions {
  apiKey?: string;
  senderName?: string;
  senderEmail?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  fetchFn?: typeof fetch;
}

export class EmailWorker {
  private readonly queue: EmailJob[] = [];
  private readonly sentJobs: EmailJob[] = [];
  private isProcessing = false;
  private readonly apiKey?: string;
  private readonly senderName: string;
  private readonly senderEmail: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly fetch: typeof fetch;

  public constructor(options: EmailWorkerOptions = {}) {
    this.apiKey = options.apiKey?.trim() || undefined;
    this.senderName = options.senderName || 'GowesKit';
    this.senderEmail =
      options.senderEmail || 'no-reply@goweskit.demo.pandanteknik.com';
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.fetch = options.fetchFn ?? globalThis.fetch;
  }

  /**
   * Non-blocking enqueue. Immediately returns so API request handlers are never blocked.
   */
  public enqueue(job: Omit<EmailJob, 'id' | 'attempts' | 'createdAt'>): void {
    const fullJob: EmailJob = {
      ...job,
      id: randomUUID(),
      attempts: 0,
      createdAt: Date.now(),
    };
    this.queue.push(fullJob);
    void this.processNext();
  }

  /**
   * Waits for all queued email jobs to finish sending. Useful for graceful shutdown & tests.
   */
  public async waitForDrained(): Promise<void> {
    while (this.queue.length > 0 || this.isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  public getSentJobs(): readonly EmailJob[] {
    return this.sentJobs;
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift()!;

    try {
      await this.deliverEmail(job);
      this.sentJobs.push(job);
    } catch (error: unknown) {
      job.attempts = (job.attempts ?? 0) + 1;
      if (job.attempts < this.maxRetries) {
        setTimeout(() => {
          this.queue.push(job);
          void this.processNext();
        }, this.retryDelayMs * Math.pow(2, job.attempts - 1));
      } else {
        console.error(
          `[EmailWorker] Failed to send email to ${job.to} after ${String(job.attempts)} attempts:`,
          error,
        );
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        void this.processNext();
      }
    }
  }

  private async deliverEmail(job: EmailJob): Promise<void> {
    if (!this.apiKey) {
      return;
    }

    const payload = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: [
        {
          email: job.to,
        },
      ],
      subject: job.subject,
      htmlContent: job.html,
      textContent: job.text,
    };

    const response = await this.fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Brevo API responded with status ${String(response.status)}: ${errorText}`,
      );
    }
  }
}
