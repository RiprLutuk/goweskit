# Tasks

Legend:

```text
P0 = first usable slice
P1 = MVP
P2 = beta
P3 = later
```

## Foundation

- [x] FOUNDATION-001 [P0] pnpm workspace.
- [x] FOUNDATION-002 [P0] TypeScript strict.
- [x] FOUNDATION-003 [P0] PostgreSQL + PostGIS Docker Compose.
- [x] FOUNDATION-004 [P0] API `/health`.
- [x] FOUNDATION-005 [P0] Nuxt shell + mobile nav + design tokens.
- [x] FOUNDATION-006 [P0] lint/format/typecheck/test scripts.
- [x] FOUNDATION-007 [P0] `.env.example` + request IDs.
- [x] FOUNDATION-008 [P1] CI.

## Learn

- [x] LEARN-001 [P0] Bicycle type model.
- [x] LEARN-002 [P0] Seed MTB Hardtail + Folding + Road + Gravel.
- [x] LEARN-003 [P0] Component categories.
- [x] LEARN-004 [P0] Bicycle type UI.
- [x] LEARN-005 [P0] Anatomy hotspot UI.
- [x] LEARN-006 [P0] Component detail.
- [x] LEARN-007 [P1] Glossary/search.
- [ ] LEARN-008 [P1] Admin content workflow.

## Garage

- [x] GARAGE-001 [P0] `user_bikes`.
- [x] GARAGE-002 [P0] Incomplete-bike onboarding.
- [x] GARAGE-003 [P0] Bike detail.
- [x] GARAGE-004 [P0] Normalized specs.
- [x] GARAGE-005 [P0] Installed components.
- [x] GARAGE-006 [P0] Unknown-spec UX.
- [ ] GARAGE-007 [P1] Bike photo.

## Compatibility

- [x] COMPAT-001 [P0] Standard vocabulary.
- [x] COMPAT-002 [P0] Rule schema/evaluator.
- [x] COMPAT-003 [P0] compatible/conditional/unknown/incompatible.
- [x] COMPAT-004 [P0] Missing info output.
- [x] COMPAT-005 [P0] Rule provenance/version.
- [x] COMPAT-006 [P0] Rear axle.
- [x] COMPAT-007 [P0] Front axle.
- [x] COMPAT-008 [P0] Wheel diameter.
- [x] COMPAT-009 [P0] Freehub/cassette.
- [x] COMPAT-010 [P0] Drivetrain speeds/family.
- [x] COMPAT-011 [P1] Crank/BB.
- [x] COMPAT-012 [P1] Fork steerer/headset.
- [x] COMPAT-013 [P1] Fork travel guidance.
- [x] COMPAT-014 [P1] Brake mount/rotor.
- [x] COMPAT-015 [P1] Seatpost.
- [x] COMPAT-016 [P1] Tire clearance.
- [x] COMPAT-017 [P0] Upgrade Lab UI.
- [x] COMPAT-018 [P0] Human-readable result.
- [x] COMPAT-019 [P1] Golden tests.

## Explore

- [x] GEO-001 [P1] PostGIS.
- [x] GEO-002 [P1] Place model.
- [x] GEO-003 [P1] Route model.
- [x] GEO-004 [P1] Nearby place query.
- [x] GEO-005 [P1] Nearby route query.
- [x] GEO-006 [P1] MapLibre.
- [x] GEO-007 [P1] Filters.
- [x] GEO-008 [P1] Place freshness.
- [ ] GEO-009 [P1] Reviews.
- [ ] GEO-010 [P2] Route/hazard reports.
- [ ] GEO-011 [P2] GPX import.

## Community

- [ ] COMM-001 [P1] Directory.
- [ ] COMM-002 [P1] Detail.
- [ ] COMM-003 [P1] Join/request.
- [ ] COMM-004 [P1] Ride events.
- [ ] COMM-005 [P1] Nearby events.
- [ ] COMM-006 [P2] Contributor reputation.
- [ ] COMM-007 [P2] Moderation queue.

## Ride Safety

- [ ] SAFE-001 [P1] Trusted contacts.
- [ ] SAFE-002 [P1] Session state machine.
- [ ] SAFE-003 [P1] Expiring share token.
- [ ] SAFE-004 [P1] Start session UI.
- [ ] SAFE-005 [P1] Location update endpoint.
- [ ] SAFE-006 [P1] Share page.
- [ ] SAFE-007 [P1] Press-and-hold SOS.
- [ ] SAFE-008 [P1] End/revoke.
- [ ] SAFE-009 [P1] Rate limit/audit.
- [ ] SAFE-010 [P1] Retention cleanup.
- [ ] SAFE-011 [P1] Emergency-service disclaimer.

## Maintenance

- [x] MAINT-001 [P1] Event model.
- [x] MAINT-002 [P1] Log service.
- [x] MAINT-003 [P1] Date reminder.
- [ ] MAINT-004 [P2] Distance reminder.

## QA

- [ ] QA-001 [P0] API contract tests.
- [x] QA-002 [P0] Compatibility golden tests.
- [ ] QA-003 [P1] Mobile viewport tests.
- [ ] QA-004 [P1] Accessibility pass.
- [ ] QA-005 [P1] Geo query performance.
- [ ] QA-006 [P1] Safety abuse tests.
- [ ] QA-007 [P1] Closed beta checklist.

## Build slices

### Slice A
```text
Foundation -> Learn -> Garage
```

### Slice B
```text
Standards -> Rule Evaluator -> Upgrade Lab
```

### Slice C
```text
PostGIS -> Places -> Routes -> Map
```

### Slice D
```text
Trusted Contact -> Safety Session -> Share -> SOS/Revoke
```

### Slice E
```text
Community -> Events -> Reviews -> Moderation
```
