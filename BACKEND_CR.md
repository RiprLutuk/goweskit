# Backend Change Request (CR) Specification

This document tracks all backend API Change Requests (CR), endpoint proposals, and contract requirements requested by the Frontend team for Codex/Backend coordination.

---

## Change Requests Summary

| CR ID | Module | Endpoint | Method | Priority | Status | Description |
|---|---|---|---|---|---|---|
| **CR-001** | Community | `/api/v1/communities/:id/events` | `POST` | P1 | **Implemented & Integrated ✅** | Create new ride event for a community by active member/admin |
| **CR-002** | Garage | `PATCH /api/v1/bikes/:id` | `PATCH` | P2 | **Implemented & Integrated ✅** | Added `photoUrl` (max 900 KB base64) to DB, contracts, repository, & UI modal |
| **CR-003** | User/Explore | `/api/v1/user/saved-items` | `POST` | P2 | **Implemented & Integrated ✅** | Bookmark/save favorite places or routes in Explore (`POST /api/v1/user/saved-items`) |
| **CR-004** | Explore | `/api/v1/explore/routes/:id/elevation` | `GET` | P2 | **Implemented & Integrated ✅** | Dynamic elevation profile coordinates & live SVG climb chart in Explore |
| **CR-005** | Auth | `/api/v1/auth/otp/send` & Google OAuth | `POST` | P1 | **Implemented & Integrated ✅** | 6-digit Email OTP validation during registration & 1-tap Google Sign-In |

---

## Detailed Specifications

### CR-001: Create Community Ride Event
- **Endpoint**: `POST /api/v1/communities/:id/events`
- **Auth Required**: Yes (Session cookie, user must be active member or admin of community)
- **Request Body**:
```json
{
  "title": "Sabtu Pagi Dago Ride",
  "description": "Santai rolling ke arah atas, regroup di Warung Bandrek.",
  "startsAt": "2026-09-05T06:30:00.000Z",
  "meetingArea": "Taman Cikapayang Dago",
  "meetingCoordinate": { "longitude": 107.6134, "latitude": -6.8992 },
  "routeId": "30000000-0000-4000-8000-000000000001",
  "difficulty": "moderate",
  "bicycleTypes": ["road", "gravel"],
  "visibility": "public",
  "capacity": 20,
  "requirements": "Helm wajib, bawa ban dalam cadangan dan lampu."
}
```
- **Response `201 Created`**:
```json
{
  "event": {
    "id": "uuid",
    "communityId": "uuid",
    "title": "Sabtu Pagi Dago Ride",
    "status": "scheduled",
    "participantCount": 1,
    "startsAt": "2026-09-05T06:30:00.000Z",
    "meetingArea": "Taman Cikapayang Dago",
    "difficulty": "moderate",
    "bicycleTypes": ["road", "gravel"],
    "visibility": "public",
    "capacity": 20,
    "requirements": "Helm wajib, bawa ban dalam cadangan dan lampu.",
    "createdAt": "2026-08-28T21:40:00.000Z"
  }
}
```

---

### CR-002: Bike Photo & Visual Avatar Key
- **Endpoint**: `PUT /api/v1/bikes/:id/photo`
- **Auth Required**: Yes (Bike owner)
- **Request Body**:
```json
{
  "photoUrl": "https://... or data:image/...",
  "avatarPreset": "hardtail_lime"
}
```
- **Response `200 OK`**:
```json
{
  "bike": {
    "id": "uuid",
    "photoUrl": "...",
    "avatarPreset": "hardtail_lime"
  }
}
```

---

### CR-003: Save/Bookmark Place or Route
- **Endpoint**: `POST /api/v1/user/saved-items`
- **Auth Required**: Yes
- **Request Body**:
```json
{
  "itemKind": "place", // or "route"
  "itemId": "uuid"
}
```
- **Response `200 OK`**:
```json
{
  "saved": true,
  "savedAt": "2026-08-28T21:40:00.000Z"
}
```

---

### CR-004: Elevation & Surface Profile for Routes
- **Endpoint**: `GET /api/v1/explore/routes/:id/elevation`
- **Auth Required**: No
- **Response `200 OK`**:
```json
{
  "routeId": "uuid",
  "elevationProfile": [
    { "distanceMeters": 0, "elevationMeters": 768 },
    { "distanceMeters": 1500, "elevationMeters": 820 },
    { "distanceMeters": 3500, "elevationMeters": 910 },
    { "distanceMeters": 7200, "elevationMeters": 1078 }
  ],
  "maxGradientPercent": 12.5,
  "averageGradientPercent": 4.3
}
```

---

### CR-005: 6-Digit Email OTP Verification & 1-Tap Google Sign-In
- **Endpoints**:
  - `POST /api/v1/auth/otp/send`: Request 6-digit numeric OTP with 5-min TTL and rate limiting cooldown.
  - `POST /api/v1/auth/register`: Requires a valid `register` OTP before creating the user when email verification is enabled.
  - `POST /api/v1/auth/google`: Accepts Google ID token credential for instant 1-tap sign in.
- **Request Body for `POST /api/v1/auth/otp/send`**:
```json
{
  "email": "rider@example.com",
  "purpose": "register"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Kode verifikasi OTP 6-digit telah dikirim ke rider@example.com.",
  "expiresInSeconds": 300,
  "demoOtp": "<local development only>"
}
```
- **Rate Limiting**: Cooldown 30 detik antar permintaan kirim ulang, maksimal 5 email per alamat per jam, dan maksimal 5x percobaan salah per kode OTP.
- **Production boundary**: `OTP_DEMO_ENABLED=false`; demo OTP and the universal
  test code are disabled. Brevo delivery requires `BREVO_API_KEY` plus an active
  `BREVO_SENDER_EMAIL`; provider failures return `OTP_DELIVERY_FAILED` without
  exposing raw errors. OTP records are purpose-bound, HMAC-protected, and
  bounded in memory. Google auth accepts only a signed Google ID token and the
  API verifies it against `GOOGLE_CLIENT_ID` before creating a session.

---

## Cloudflare R2 Object Storage Integration
- **Provider**: Cloudflare R2 (S3-Compatible API via `@aws-sdk/client-s3`).
- **Storage Target**: Bike photos in Garage (`photoUrl` & `photoStorageKey`).
- **File Limits**: Max 700 KB (`BIKE_PHOTO_MAX_BYTES = 700_000`), image types: JPEG, PNG, WebP, GIF with magic byte validation.
- **Environment Variables**:
  - `R2_ACCOUNT_ID`: Cloudflare account ID.
  - `R2_ACCESS_KEY_ID`: R2 S3 access key ID.
  - `R2_SECRET_ACCESS_KEY`: R2 S3 secret access key.
  - `R2_BUCKET_NAME`: R2 bucket name.
  - `R2_PUBLIC_BASE_URL`: Public CDN base URL (e.g. `https://pub-<hash>.r2.dev` or custom domain).
  - `R2_KEY_PREFIX`: Bucket key prefix (default: `goweskit/bike-photos`).
- **Lifecycle**: Uploads with immutable cache-control, auto-deletes old objects from R2 when photo is replaced or removed.
- **Elevation Sample Density**: Titik koordinat elevasi rute saat ini dihitung secara deterministik berbasis titik GPX rute terverifikasi.
