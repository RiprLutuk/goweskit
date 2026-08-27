# GowesKit 🚲

A learning-first cycling platform to help riders understand bicycles, plan upgrades,
discover routes/shops/workshops/communities, maintain bikes, and ride more safely.

## v0.1 scope

The current vertical slice is deliberately narrow:

```text
Learn -> My Garage -> Upgrade Lab
```

It includes account sessions, MTB Hardtail, Folding Bike, Road Bike, and Gravel
Bike learning content, incomplete bike profiles, explicit unknown
specifications, and deterministic compatibility checks for wheel size,
front/rear axle, freehub/cassette, drivetrain speeds, and fork steerer. Explore,
Community, Ride Safety, and Maintenance are not implemented in v0.1.

## Run locally

Requirements: Node.js 22+, pnpm 10.34.5, PostgreSQL 18, and PostGIS.

### Native PostgreSQL (macOS with Homebrew)

Install and start PostgreSQL/PostGIS. On Apple Silicon, explicitly use the ARM
Homebrew process so the extensions are installed into the same prefix:

```bash
arch -arm64 brew install postgresql@18 postgis
brew services start postgresql@18
```

Set `port = 1921` in
`/opt/homebrew/var/postgresql@18/postgresql.conf`, then restart PostgreSQL:

```bash
brew services restart postgresql@18
createdb -h localhost -p 1921 -U lutuk goweskit
```

Skip `createdb` when the `goweskit` database already exists. Then install the
application dependencies and apply the additive migrations:

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

`pnpm db:seed` is safe to run repeatedly in local development. It refreshes the
four P0 bicycle types, 20 component categories, six normalized standards, and a
demo Garage with four bikes. Sign in with:

```text
Email: demo@goweskit.local
Password: GowesKitDemo123!
```

The demo bikes cover complete and explicitly unknown specs. Their data can
produce compatible, incompatible, conditional, and unknown Upgrade Lab results;
the deterministic evaluator still calculates every result at request time.

PostgreSQL with PostGIS listens at `localhost:1921`; the local development
database uses user `lutuk` with no password. The Nuxt web app defaults to port
3000 and the Fastify API to port 4000.

If those application ports are occupied, run the processes separately, for
example on 3001 and 4001:

```bash
API_PORT=4001 WEB_ORIGIN=http://localhost:3001 pnpm --filter @goweskit/api dev
PUBLIC_API_BASE_URL=http://localhost:4001/api/v1 pnpm --filter @goweskit/web dev --port 3001
```

Docker Compose remains an optional database alternative:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Quality gates:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Product pillars

1. **Learn** — bicycle types, anatomy, parts, standards, glossary, maintenance.
2. **My Garage** — save bikes, specs, components, service history.
3. **Upgrade Lab** — deterministic compatibility checks before buying parts.
4. **Explore** — trails, routes, workshops, stores, rest/water/coffee points.
5. **Community** — groups, rides, reviews, local route condition reports.
6. **Ride Safety** — trusted contacts, expiring live-location share, SOS state.
7. **Maintenance** — service logs and reminders.

## Suggested stack

| Layer | Choice |
|---|---|
| Web | Nuxt + Vue + TypeScript |
| API | Fastify + TypeScript |
| DB | PostgreSQL + PostGIS |
| Contracts | Zod |
| DB Access | Drizzle ORM + SQL for geospatial |
| Maps | MapLibre |
| Search | PostgreSQL FTS + pg_trgm |
| Monorepo | pnpm workspaces |

## Repo map

```text
.
├── AGENTS.md
├── PRD.md
├── ARCHITECTURE.md
├── FLOWS.md
├── TASKS.md
├── DESIGN_SYSTEM.md
├── DATA_MODEL.md
├── API.md
├── docs/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── contracts/
│   ├── ui/
│   └── bike-domain/
├── infra/
└── .agents/skills/
```

## First prompt for Codex

```text
Read AGENTS.md, PRD.md, ARCHITECTURE.md, DATA_MODEL.md,
DESIGN_SYSTEM.md and TASKS.md.

Do not code yet.
Summarize the MVP boundaries and propose the smallest vertical slice
that proves Learn -> Garage -> Compatibility.
```

Then:

```text
Implement FOUNDATION-001 through FOUNDATION-006 only.
Do not add features outside TASKS.md.
```

## MVP test

A beginner can:

- understand a bike component;
- create a bike with incomplete specs;
- record key standards;
- check whether a candidate component fits;
- understand *why* it fits or not;
- discover nearby cycling places;
- start a temporary trusted-contact safety session.
