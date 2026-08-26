---
name: backend-api
description: Implement or review GowesKit Fastify API, validation, services, DB access, authorization, errors, and migrations.
---

# Backend API

1. Read architecture/data/API docs.
2. Thin handlers.
3. Validate all request data.
4. Stable error codes.
5. Authorization in service layer.
6. Request IDs in logs.
7. Use transactions for multi-write use cases.
8. Prefer SQL/PostGIS where clearer.
9. No Redis/queue/new service without measured need.
10. Test validation, permissions, edge cases.
