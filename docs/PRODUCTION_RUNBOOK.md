# GowesKit API Production Runbook

This runbook covers the single Fastify API, PostgreSQL/PostGIS, and Cloudflare
R2 deployment described in `ARCHITECTURE.md`. It intentionally adds no Redis,
queue, or microservice.

## Required production configuration

Store values in the hosting platform's secret manager, not in Git.

```text
NODE_ENV=production
API_PORT=<platform port>
DATABASE_URL=<PostgreSQL connection string with TLS as required by the host>
WEB_ORIGIN=https://<public web domain>
SESSION_COOKIE_SECURE=true
TRUST_PROXY_HOPS=1
GOOGLE_CLIENT_ID=<Google Web OAuth client ID>
OTP_DEMO_ENABLED=false
OTP_HMAC_SECRET=<at least 32 random bytes, encoded for environment storage>
BREVO_API_KEY=<Brevo REST API key>
BREVO_SENDER_NAME=GowesKit
BREVO_SENDER_EMAIL=<active verified Brevo sender>
R2_ACCOUNT_ID=<Cloudflare account ID>
R2_ACCESS_KEY_ID=<R2 S3 access key>
R2_SECRET_ACCESS_KEY=<R2 S3 secret>
R2_BUCKET_NAME=<bucket>
R2_PUBLIC_BASE_URL=https://<public R2 or CDN domain>
R2_KEY_PREFIX=goweskit/bike-photos
```

Use the exact reverse-proxy hop count supplied by the host. The API refuses to
start in production with insecure cookies, an HTTP web origin, no trusted
proxy, no Google client ID, or demo OTP enabled.

In Google Cloud Console, configure a Web OAuth client for the real web origin.
The frontend sends the Google Identity Services ID token to
`POST /api/v1/auth/google`; the API verifies it against `GOOGLE_CLIENT_ID`.

Deploy the web and API on same-site HTTPS domains, for example
`app.goweskit.com` and `api.goweskit.com`. The host-only session cookie uses
`SameSite=Lax`; unrelated platform domains such as `*.vercel.app` and
`*.onrender.com` will not carry that cookie on cross-site API requests.

## Build and release

1. Run `pnpm install --frozen-lockfile` with Node.js 22 and pnpm 10.34.5.
2. Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
   `pnpm build`.
3. Back up PostgreSQL before applying a release migration:

   ```sh
   pg_dump --format=custom --no-owner --file=goweskit-before-release.dump "$DATABASE_URL"
   ```

4. Run `pnpm db:migrate` exactly once as a release job. Never run
   `pnpm db:seed` in production; the seeder also refuses production mode.
5. Start the API with `pnpm --filter @goweskit/api start`.
6. Configure the load balancer readiness probe to `GET /health/ready` and the
   liveness probe to `GET /health`.
7. Verify from outside the host:

   ```sh
   pnpm release:verify -- https://api.example.com
   ```

## Rollback

If readiness fails, stop routing traffic to the new application version and
restore the previous application artifact. Migrations are additive; do not
manually drop the new columns while either version may still be running. If a
data restore is genuinely required, stop writes first and restore the reviewed
`pg_dump` backup into a replacement database before switching traffic.

## Operational checks

- A `503` from `/health/ready` means PostgreSQL/PostGIS is unavailable; inspect
  database reachability and credentials. The public response never exposes raw
  database errors.
- Rotate session-impacting credentials and R2 keys after suspected exposure.
- Watch structured API logs by request ID. Do not log Google tokens, session
  cookies, R2 secrets, or exact live rider locations.
- The process handles `SIGTERM`/`SIGINT`, stops accepting traffic, clears the
  safety cleanup timer, and closes the PostgreSQL pool.
- Auth rate limiting is per API process. Keep a single API instance initially;
  replace it with a shared limiter only after scaling requires it.

## Current provider boundary

Email OTP uses Brevo's transactional REST API and is enabled only when both the
API key and verified sender email are configured. Registration requires a valid
purpose-bound OTP. The API stores only an HMAC of each code, limits delivery to
five messages per recipient per hour, bounds in-memory records, and never
returns the OTP when Brevo is active. OTP state remains process-local in v0.1,
so keep a single API instance; moving to multiple API instances requires a
shared bounded one-time-code store first.
