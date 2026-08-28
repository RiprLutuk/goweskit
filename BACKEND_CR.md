# Backend Change Request (CR) Specification

This document tracks all backend API Change Requests (CR), endpoint proposals, and contract requirements requested by the Frontend team for Codex/Backend coordination.

---

## Change Requests Summary

| CR ID | Module | Endpoint | Method | Priority | Status | Description |
|---|---|---|---|---|---|---|
| **CR-001** | Community | `/api/v1/communities/:id/events` | `POST` | P1 | Proposed | Create new ride event for a community by active member/manager |
| **CR-002** | Garage | `/api/v1/bikes/:id/photo` | `PUT` | P2 | Proposed | Upload or update bike photo URL / avatar key |
| **CR-003** | Explore | `/api/v1/explore/places/:id/bookmark` | `POST` | P2 | Proposed | Bookmark/save favorite places or routes to user profile |
| **CR-004** | Explore | `/api/v1/explore/routes/:id/elevation` | `GET` | P2 | Proposed | Get detailed elevation profile coordinates and waypoint gradient data |

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
