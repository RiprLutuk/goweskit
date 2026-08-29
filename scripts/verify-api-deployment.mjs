const positionalOrigin = process.argv.slice(2).find((value) => value !== '--');
const apiOrigin = (positionalOrigin ?? process.env.API_ORIGIN ?? '').replace(
  /\/+$/u,
  '',
);

if (
  !apiOrigin.startsWith('https://') &&
  !apiOrigin.startsWith('http://localhost')
) {
  throw new Error(
    'Pass an HTTPS API origin (or localhost), e.g. pnpm release:verify -- https://api.goweskit.com',
  );
}

async function verify(path, expectedBody) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${apiOrigin}${path}`, {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      const body = await response.json();
      if (
        !response.ok ||
        JSON.stringify(body) !== JSON.stringify(expectedBody)
      ) {
        throw new Error(
          `${path} failed: HTTP ${String(response.status)} ${JSON.stringify(body)}`,
        );
      }
      console.log(`${path}: HTTP ${String(response.status)} OK`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

await verify('/health', { status: 'ok' });
await verify('/health/ready', {
  status: 'ok',
  checks: { database: 'ok' },
});
