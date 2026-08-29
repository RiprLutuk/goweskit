const apiOrigin = (process.argv[2] ?? process.env.API_ORIGIN ?? '').replace(
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${apiOrigin}${path}`, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    const body = await response.json();
    if (!response.ok || JSON.stringify(body) !== JSON.stringify(expectedBody)) {
      throw new Error(
        `${path} failed: HTTP ${String(response.status)} ${JSON.stringify(body)}`,
      );
    }
    console.log(`${path}: HTTP ${String(response.status)} OK`);
  } finally {
    clearTimeout(timeout);
  }
}

await verify('/health', { status: 'ok' });
await verify('/health/ready', {
  status: 'ok',
  checks: { database: 'ok' },
});
