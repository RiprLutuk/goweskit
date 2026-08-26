# PRD — GowesKit

## 1. Summary

GowesKit is a mobile-first cycling learning and utility platform for MTB, road,
gravel, folding, city, touring, BMX, and e-bike riders.

It combines:

- bicycle education;
- personal bike garage;
- component compatibility;
- maintenance;
- local tracks/routes;
- recommended bike shops/workshops;
- communities and group rides;
- solo-ride safety tools.

## 2. Problem

Cycling knowledge is fragmented. Beginners often do not understand:

- bicycle categories and geometry;
- component names;
- axle, hub, freehub, cassette, BB, headset, brake, fork standards;
- what can and cannot be upgraded;
- where to ride locally;
- which workshop/shop is trusted;
- how to share safety information during a solo ride.

Most cycling apps begin with tracking or competition. GowesKit begins with
**understanding the bike**.

## 3. Vision

> Make bicycle knowledge approachable enough that a beginner can make safer,
> smarter upgrade and riding decisions without becoming a mechanic first.

## 4. Personas

### Beginner
Owns or wants a first bike and does not know many technical terms.

### Upgrade learner
Wants to upgrade fork, drivetrain, wheelset, brake, cockpit, tire, or folding-bike parts.

### Social rider
Wants routes, workshops, stores, communities, and beginner-friendly rides.

### Solo rider
Wants a lightweight trusted-contact safety flow.

### Contributor
Experienced rider/mechanic/community member contributing routes, explanations, and reviews.

## 5. Principles

1. Explain before recommending.
2. Compatibility must be deterministic and traceable.
3. Unknown is better than guessing.
4. Mobile-first.
5. Local knowledge needs freshness and provenance.
6. Exact location is private by default.
7. Safety features assist; they are not emergency dispatch.
8. Keep infrastructure boring until usage proves otherwise.

## 6. Core modules

### Learn

Hierarchy:

```text
Bike Type
  -> Anatomy
     -> Component Category
        -> Component
           -> Standard
              -> Compatibility + Maintenance
```

Example lesson:

```text
Cassette
├── What it does
├── Speeds
├── Tooth range
├── Freehub
│   ├── HG
│   ├── Micro Spline
│   └── XD/XDR
├── Shifter/derailleur relationship
└── Upgrade checklist
```

### My Garage

A bike may contain:

- nickname;
- category;
- brand/model/year;
- wheel size;
- frame size/material;
- key standards;
- installed components;
- photos;
- service history;
- notes.

**Unknown is a valid value.**

### Upgrade Lab

Input:

```text
My Bike + Candidate Component
```

Output:

```text
Compatible
Likely Compatible
Needs Adapter / Additional Part
Unknown / Need More Info
Not Compatible
```

Each result explains:

- checks performed;
- matches;
- conflicts;
- missing information;
- required adapters;
- rule source/version.

Initial rule families:

- wheel diameter;
- tire clearance;
- front/rear axle;
- freehub/cassette;
- drivetrain speed/family;
- derailleur capacity;
- crank/bottom bracket;
- brake mount/rotor;
- fork steerer/headset/travel;
- seatpost diameter;
- handlebar/stem diameter.

### Explore

Map layers:

- MTB trails;
- road/gravel routes;
- bike parks;
- workshops;
- stores;
- meeting points;
- water/refill;
- rest/coffee;
- hazards.

Filters:

- distance;
- bicycle type;
- difficulty;
- surface;
- beginner friendly;
- freshness;
- community verification.

### Community

MVP:

- community profile;
- ride events;
- join/request;
- route reports;
- place/workshop reviews;
- contributor reputation.

No infinite social feed in MVP.

### Ride Safety

Flow:

1. choose trusted contact;
2. optionally set expected return;
3. start session;
4. create expiring share link;
5. share link;
6. optionally send location updates;
7. trigger SOS state if needed;
8. trusted contact sees last known location + timestamp;
9. end/revoke session.

Requirements:

- explicit opt-in;
- expiring high-entropy token;
- no public live location;
- immediate revoke;
- bounded retention;
- access rate limiting;
- clear "not an emergency service" copy.

### Maintenance

Track:

- chain clean/lube/replacement;
- brake pads;
- tires;
- sealant;
- bearings;
- fork/shock service;
- drivetrain;
- folding hinge;
- general tune-up.

## 7. Information architecture

Mobile nav:

```text
Home
Learn
Garage
Explore
Me
```

Context actions:

```text
Check Fit
Plan Upgrade
Start Ride
SOS
```

## 8. MVP must-have

- auth;
- Learn content structure;
- MTB hardtail + folding content starter;
- Garage;
- incomplete bike specs;
- compatibility engine;
- explanation and provenance;
- Explore map;
- routes/workshops/stores;
- basic reviews;
- community directory/events;
- trusted contacts;
- temporary safety session;
- moderation primitives;
- admin CRUD.

## 9. Later

- ride recording;
- GPX import/export;
- gamification;
- AI search over curated content;
- used-bike inspection wizard;
- upgrade cost/weight calculator;
- marketplace integrations;
- shop inventory;
- group chat.

## 10. Success metrics

Activation:

- create first bike;
- complete first lesson;
- first compatibility check.

Quality:

- compatibility unknown rate;
- correction rate;
- stale-place/route reports;
- safety share success.

## 11. Beta exit criteria

- MTB hardtail learning path;
- folding-bike learning path;
- > = 12 compatibility rule families;
- incomplete Garage specs supported;
- compatibility explanation;
- nearby map;
- contributor moderation;
- safety session start/share/revoke;
- core mobile flows verified at 360–430 px.
