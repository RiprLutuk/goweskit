import type { FastifyInstance } from 'fastify';

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;
type ShutdownSignal = (typeof SHUTDOWN_SIGNALS)[number];

interface SignalProcess {
  exitCode: number | string | null | undefined;
  once(signal: ShutdownSignal, listener: () => void): unknown;
  removeListener(signal: ShutdownSignal, listener: () => void): unknown;
}

export function registerGracefulShutdown(
  app: FastifyInstance,
  signalProcess: SignalProcess = process,
): () => void {
  let shuttingDown = false;
  const listeners = new Map<ShutdownSignal, () => void>();

  for (const signal of SHUTDOWN_SIGNALS) {
    const listener = (): void => {
      if (shuttingDown) return;
      shuttingDown = true;
      app.log.info({ signal }, 'Graceful API shutdown started');
      void app.close().catch((error: unknown) => {
        signalProcess.exitCode = 1;
        app.log.error({ err: error, signal }, 'Graceful API shutdown failed');
      });
    };
    listeners.set(signal, listener);
    signalProcess.once(signal, listener);
  }

  return () => {
    for (const [signal, listener] of listeners) {
      signalProcess.removeListener(signal, listener);
    }
    listeners.clear();
  };
}
