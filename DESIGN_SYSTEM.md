# Design System — Clean, Cute, Fresh Cycling

## Direction

```text
clean workshop
+
fresh morning ride
+
playful cycling stickers
+
technical but approachable
```

Avoid:

- generic SaaS dashboard;
- racing telemetry overload;
- crypto-style dark cards;
- childish cartoon UI.

## Palette

| Token | Hex | Use |
|---|---|---|
| canvas | #FFFDF7 | warm background |
| ink | #17202A | main text |
| asphalt | #40505F | secondary text |
| chain-lime | #C9F36A | primary accent |
| sky | #8EDDF4 | info / route |
| coral | #FF8C75 | caution / social |
| sand | #EDE4D2 | soft surfaces |
| white | #FFFFFF | cards |

Accessibility wins over aesthetics.

## Typography

GowesKit signature cycling typography system:

```text
Headings & Aerodynamic UI: Outfit (Geometric, circular curves mirroring wheels & chainrings)
Technical Route & Display: Space Grotesk (Precision engineering & route telemetry)
Body UI & Guide Text: Plus Jakarta Sans (Clean, highly legible neo-grotesque)
Component Specs & Numbers: JetBrains Mono (Precision tabular figures: 12×148 Boost, 50-34T, 700×28c)
```

Technical values should be obvious:

```text
12 × 148 mm
120 mm travel
29 × 2.35"
1 × 12
```

## Iconography — Signature Cycling Line System

Replace generic emojis with GowesKit bespoke SVG icons (`<GIcon />`):

- **Disciplines**: `bike` (Road), `bike-gravel` (Gravel), `bike-mtb` (Mountain), `bike-folding` (Folding).
- **Navigation & Telemetry**: `route` (GPS topo ribbon), `radar` (Live beacon pulse), `pin` (Location mark), `mountain` (Climb summit), `tree` (Trail pine).
- **Workshop & Anatomy**: `frame` (Diamond geo), `fork` (Suspension crown & stanchions), `rear_shock` (Damper), `wheel`, `hub` (Through-axle), `tire` (Knobby tread), `cassette`, `chain`, `crank`, `bottom_bracket`, `rear_derailleur`, `shifter`, `disc_brake`, `headset`, `wrench`.
- **Social & Safety**: `community` (Peloton), `trophy` (KOM), `shield` (Safety beacon), `sos` (Emergency alert), `coffee` (Pitstop cafe), `water` (Hydration bidon).

## Shape language

- card radius: 16–22 px;
- buttons rounded but not pill-only;
- sticker-like chips;
- technical line diagrams;
- subtle chainring/spoke motifs.

## Signature components

### Bike Part Card

```text
[Fork illustration]

Fork
Controls the front wheel and absorbs impacts.

120 mm travel
Tapered steerer
Boost 15×110

[Learn] [Check Upgrade]
```

### Compatibility

Never only green/red.

```text
✓ Compatible

Rear axle matches
Bike      12×148 Boost
Candidate 12×148 Boost

Why this matters
The hub spacing and thru-axle diameter match the frame.
```

### Unknown

```text
? Need one more detail

We need your freehub type before checking this cassette.

[Show me where to find it]
```

## Navigation

```text
Home | Learn | Garage | Explore | Me
```

Context actions:

```text
Start Ride
SOS
```

SOS must be visually distinct and require deliberate interaction.

## Home

```text
Good morning 👋
Which bike are we riding?

[My Hardtail]
Ready to ride

Continue learning
"What does Boost mean?"

Upgrade Lab
Check a part before buying

Nearby
3 beginner-friendly places

Solo today?
Start Ride Safety
```

## Mobile targets

Test:

```text
360
375
390
430
768
1280
```

Primary target: 390 px.
