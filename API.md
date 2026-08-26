# API Outline

Base:

```text
/api/v1
```

## Auth

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

## Learn

```text
GET /learn/bicycle-types
GET /learn/bicycle-types/:slug
GET /learn/components
GET /learn/components/:slug
GET /learn/lessons
GET /learn/lessons/:slug
GET /learn/glossary
GET /learn/search?q=
```

## Garage

```text
GET    /bikes
POST   /bikes
GET    /bikes/:bikeId
PATCH  /bikes/:bikeId
DELETE /bikes/:bikeId

GET /bikes/:bikeId/specs
PUT /bikes/:bikeId/specs/:standardCode

GET    /bikes/:bikeId/components
POST   /bikes/:bikeId/components
PATCH  /bikes/:bikeId/components/:installId
DELETE /bikes/:bikeId/components/:installId
```

## Compatibility

```text
POST /compatibility/evaluate
GET  /compatibility/standards
GET  /compatibility/rules/:code
```

Example response:

```json
{
  "status": "incompatible",
  "checksPerformed": [
    {
      "ruleCode": "freehub_cassette",
      "label": "Freehub and cassette interface",
      "status": "failed",
      "bikeValue": "hg",
      "candidateValue": "micro_spline",
      "humanExplanation": "Shimano Micro Spline does not match the bike's Shimano HG.",
      "technicalExplanation": "Normalized values differ: bike=hg, candidate=micro_spline.",
      "possibleFix": "Choose a component matching Shimano HG, or use a manufacturer-approved conversion where one exists.",
      "provenance": {
        "ruleCode": "freehub_cassette",
        "ruleVersion": "1.0.0",
        "sourceTitle": "SRAM 2021 MTB components compatibility map",
        "sourceUrl": "https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb/2021-mtb-components-compatibility-map.pdf",
        "reviewedAt": "2026-08-27"
      }
    }
  ],
  "missingInformation": [],
  "humanExplanation": "At least one checked standard does not match.",
  "technicalExplanation": "Freehub and cassette interface: Normalized values differ: bike=hg, candidate=micro_spline.",
  "possibleFix": "Choose a component matching Shimano HG, or use a manufacturer-approved conversion where one exists.",
  "ruleProvenance": [
    {
      "ruleCode": "freehub_cassette",
      "ruleVersion": "1.0.0",
      "sourceTitle": "SRAM 2021 MTB components compatibility map",
      "sourceUrl": "https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb/2021-mtb-components-compatibility-map.pdf",
      "reviewedAt": "2026-08-27"
    }
  ]
}
```

Compatibility status is produced only by deterministic rules. Explanatory AI,
if added later, may paraphrase this result but cannot change it.

## Explore

```text
GET  /places/nearby?lat=&lng=&radius=&type=
GET  /places/:placeId
POST /places
POST /places/:placeId/reviews

GET  /routes/nearby?lat=&lng=&radius=&bikeType=&difficulty=
GET  /routes/:routeId
POST /routes
POST /routes/:routeId/reports
POST /hazards
```

## Community

```text
GET  /communities/nearby
GET  /communities/:communityId
POST /communities/:communityId/join

GET  /events/nearby
GET  /events/:eventId
POST /events/:eventId/join
```

## Safety

```text
GET    /trusted-contacts
POST   /trusted-contacts
DELETE /trusted-contacts/:id

POST /safety/sessions
PUT  /safety/sessions/:id/location
POST /safety/sessions/:id/sos
POST /safety/sessions/:id/end

GET /safety/share/:token
```

Safety share:

- unauthenticated by token;
- token high entropy;
- token stored hashed;
- expiration required;
- rate limited;
- only safe session fields returned.

## Error envelope

```json
{
  "error": {
    "code": "COMPATIBILITY_MISSING_SPEC",
    "message": "Rear axle standard is required.",
    "details": {}
  },
  "requestId": "..."
}
```
