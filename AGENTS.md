# GowesKit — Codex Repository Instructions

Read before coding:

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `DATA_MODEL.md`
4. `API.md`
5. `DESIGN_SYSTEM.md`
6. `TASKS.md`

Load relevant repo skill under `.agents/skills` for domain-specific tasks.

## Mission

Build a lightweight, learning-first cycling platform.

## Product boundaries

MVP is not:

- Strava;
- marketplace;
- group chat platform;
- full navigation engine;
- microservice showcase.

## Engineering rules

- TypeScript strict.
- Prefer boring readable code.
- Web and API independently runnable.
- Shared API contracts in `packages/contracts`.
- Bike domain/rules in `packages/bike-domain`.
- Avoid duplicate domain constants.
- Add tests for business rules.
- Prefer additive DB migrations.
- Never silently default unknown bike standards.

## API

- validate all external input;
- stable error codes;
- no raw DB errors;
- request IDs in logs;
- thin route handlers.

## Compatibility

Critical rules:

- deterministic rules only;
- AI may explain, not decide;
- every rule has provenance/version;
- `unknown` is valid;
- missing info must be surfaced;
- never use brand alone as compatibility truth.

## Geo

- exact user location is private;
- use PostGIS;
- max nearby radius;
- no public live rider location.

## Ride Safety

- explicit user action starts tracking;
- expiring high-entropy share tokens;
- revoke/end required;
- bounded retention;
- no silent background tracking;
- never claim emergency dispatch.

## Design

Follow `DESIGN_SYSTEM.md`.

The product should feel:

```text
clean
fresh
friendly
cycling-specific
technical without intimidating beginners
```

## Performance

Before adding cache/service:

1. measure;
2. identify bottleneck;
3. optimize query/data shape;
4. only then add infrastructure.

## Completion format

```text
Implemented
Files changed
Tests run
Known limitations
Next dependency
```

Never claim tests passed unless actually run.
