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
PUT    /bikes/:bikeId/photo
DELETE /bikes/:bikeId

GET /bikes/:bikeId/specs
PUT /bikes/:bikeId/specs/:standardCode

GET    /bikes/:bikeId/components
POST   /bikes/:bikeId/components
PATCH  /bikes/:bikeId/components/:installId
DELETE /bikes/:bikeId/components/:installId
```

`PUT /bikes/:bikeId/photo` is authenticated and ownership-scoped. Send at
least one visual field; either may be omitted or set to `null`:

```json
{
  "photoUrl": "https://images.example.test/my-bike.webp",
  "avatarPreset": null
}
```

Photo sources accept HTTPS URLs or bounded PNG/JPEG/WebP/GIF data URLs. SVG,
plain HTTP, and script URLs are rejected. The response is
`{ "bike": { "id", "photoUrl", "avatarPreset" } }`.

Base64 image data is validated by file signature, decoded to at most 700 KB,
and uploaded to Cloudflare R2. PostgreSQL stores only the R2 object key and
cache-busted public URL; base64 data is never persisted. Existing HTTPS image
URLs remain supported as externally managed photos. Replacing or clearing a
managed photo updates or deletes the corresponding R2 object. Storage failures
use stable `BIKE_PHOTO_*` error codes without exposing provider errors.

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
POST /explore/nearby
GET  /explore/routes/:routeId/elevation
POST /user/saved-items
```

The request center is sent in the body so an exact user coordinate is not
written into request URLs or access logs. It is used for the current search and
is not persisted. Radius is capped at 50 km and each result kind is capped at
100 records.

```json
{
  "center": { "longitude": 107.6191, "latitude": -6.9175 },
  "radiusKm": 15,
  "placeTypes": ["workshop", "water"],
  "routeTypes": ["mtb", "gravel"],
  "bikeType": "mtb_hardtail",
  "difficulty": "easy",
  "surface": "trail",
  "beginnerFriendly": true,
  "verificationStatus": "staff_verified",
  "freshness": "fresh"
}
```

All filters are optional except `center`. Coordinates always use explicit
longitude/latitude naming. The response contains separately ranked `places`
and `routes`, their distance from the request center, verification status, and
freshness. Invalid coordinates, filters, or radius return `INVALID_REQUEST`.

Route elevation returns a curated, distance-ordered profile and deterministic
maximum/average gradient percentages. A route without curated profile data
returns `ROUTE_ELEVATION_NOT_AVAILABLE`; the API never invents missing points.

`POST /user/saved-items` is authenticated and idempotent:

```json
{
  "itemKind": "place",
  "itemId": "20000000-0000-4000-8000-000000000001"
}
```

Supported kinds are `place` and `route`. Repeating the same save returns the
original `{ "saved": true, "savedAt": "..." }` result.

## Community

```text
GET  /communities/nearby
GET  /communities/:communityId
POST /communities/:communityId/join
GET  /communities/:communityId/events
POST /communities/:communityId/events

GET  /events/nearby
GET  /events/:eventId
POST /events/:eventId/join
```

Creating an event requires authentication plus active community membership.
The start time must be in the future, route IDs and bicycle type slugs must
exist, and the creator is joined atomically as participant one. The successful
response is `201 Created` and includes the created event.

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
