import { EventEmitter } from 'node:events';

import type { FastifyInstance } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { registerGracefulShutdown } from './lifecycle.js';

describe('API lifecycle', () => {
  it('closes once on termination and removes remaining listeners', async () => {
    const signalProcess = new EventEmitter() as EventEmitter & {
      exitCode: number | string | null | undefined;
    };
    signalProcess.exitCode = undefined;
    const close = vi.fn(() => Promise.resolve());
    const app = {
      close,
      log: { error: vi.fn(), info: vi.fn() },
    } as unknown as FastifyInstance;

    const removeHandlers = registerGracefulShutdown(app, signalProcess);
    signalProcess.emit('SIGTERM');
    signalProcess.emit('SIGINT');
    await Promise.resolve();

    expect(close).toHaveBeenCalledTimes(1);
    removeHandlers();
    expect(signalProcess.listenerCount('SIGTERM')).toBe(0);
    expect(signalProcess.listenerCount('SIGINT')).toBe(0);
  });
});
