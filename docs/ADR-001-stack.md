# ADR-001 — Initial Stack

Status: Accepted

Use:

```text
Nuxt + Vue + TypeScript
Fastify + TypeScript
PostgreSQL + PostGIS
Zod
pnpm workspace
MapLibre
```

Why:

- strong mobile web;
- explicit API boundary;
- geospatial support;
- easy local development;
- limited operational complexity.

Not now:

- microservices;
- Elasticsearch;
- Redis by default;
- Kubernetes;
- native mobile first.

Revisit only when measured needs justify it.
