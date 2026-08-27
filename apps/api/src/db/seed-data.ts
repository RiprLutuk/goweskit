import {
  BIKE_SPEC_DEFINITIONS,
  COMPATIBILITY_RULES,
  type BikeSpecCode,
} from '@goweskit/bike-domain';
import {
  PLACE_TYPES,
  ROUTE_DIFFICULTIES,
  ROUTE_SURFACES,
  ROUTE_TYPES,
  VERIFICATION_STATUSES,
  type Coordinate,
} from '@goweskit/contracts';

export const BICYCLE_TYPE_SEEDS = [
  {
    slug: 'mtb_hardtail',
    name: 'MTB Hardtail',
    summary: 'A mountain bike with front suspension and a rigid rear frame.',
    typicalUse:
      'Trail riding, mixed surfaces, commuting, and learning off-road skills.',
    beginnerNotes:
      'A simple, versatile first mountain bike. Confirm wheel, axle, fork, and drivetrain standards before upgrading.',
  },
  {
    slug: 'folding',
    name: 'Folding Bike',
    summary:
      'A compact bicycle with a frame designed to fold for storage and transport.',
    typicalUse:
      'Urban trips, public-transport connections, short commutes, and limited storage.',
    beginnerNotes:
      'Wheel sizes and folding-specific parts vary widely. Measure and confirm standards instead of relying on the brand name.',
  },
  {
    slug: 'road',
    name: 'Road Bike',
    summary: 'A lightweight bicycle built for efficient riding on paved roads.',
    typicalUse:
      'Fitness rides, longer paved routes, group rides, and road racing.',
    beginnerNotes:
      'Fit and riding position matter as much as weight. Check axle, freehub, drivetrain, and steerer standards before replacing parts.',
  },
  {
    slug: 'gravel',
    name: 'Gravel Bike',
    summary:
      'A drop-bar bicycle that combines road efficiency with room for wider tires and mixed surfaces.',
    typicalUse:
      'Mixed paved and unpaved roads, light touring, commuting, and long-distance exploration.',
    beginnerNotes:
      'Gravel bikes can mix road and MTB standards. Confirm every interface rather than assuming parts from either family will fit.',
  },
] as const;

export const COMPONENT_CATEGORY_SEEDS = [
  {
    slug: 'frame',
    name: 'Frame',
    description:
      'The main structure that determines rider fit and most component interfaces.',
  },
  {
    slug: 'fork',
    name: 'Fork',
    description:
      'Holds the front wheel, steers the bike, and may provide suspension.',
  },
  {
    slug: 'rear_shock',
    name: 'Rear Shock',
    description:
      'Controls rear suspension movement on full-suspension bicycles.',
  },
  {
    slug: 'wheel',
    name: 'Wheel',
    description:
      'The rim, spokes, and hub assembly whose diameter must match the bike.',
  },
  {
    slug: 'hub',
    name: 'Hub',
    description:
      'The wheel center containing bearings, axle interfaces, and often a freehub.',
  },
  {
    slug: 'tire',
    name: 'Tire',
    description:
      'The rubber contact surface whose diameter and width must suit the rim and frame.',
  },
  {
    slug: 'cassette',
    name: 'Cassette',
    description:
      'The rear sprocket cluster that must match the freehub and drivetrain.',
  },
  {
    slug: 'chain',
    name: 'Chain',
    description:
      'Transfers pedaling force and must match the drivetrain speed family.',
  },
  {
    slug: 'crank',
    name: 'Crank',
    description:
      'Connects the pedals to the bottom bracket and carries the chainring.',
  },
  {
    slug: 'bottom_bracket',
    name: 'Bottom Bracket',
    description:
      'The bearing interface joining a crank spindle to the bicycle frame.',
  },
  {
    slug: 'rear_derailleur',
    name: 'Rear Derailleur',
    description:
      'Moves the chain across the cassette and controls chain tension.',
  },
  {
    slug: 'shifter',
    name: 'Shifter',
    description:
      'Controls gear changes and must communicate with the matching derailleur system.',
  },
  {
    slug: 'brake',
    name: 'Brake',
    description: 'Slows the bicycle through a rim or disc braking system.',
  },
  {
    slug: 'rotor',
    name: 'Rotor',
    description:
      'The disc-brake surface attached to the hub and gripped by the caliper.',
  },
  {
    slug: 'handlebar',
    name: 'Handlebar',
    description:
      'The main steering contact point that affects control and riding position.',
  },
  {
    slug: 'stem',
    name: 'Stem',
    description:
      'Connects the handlebar to the fork steerer and helps set reach.',
  },
  {
    slug: 'seatpost',
    name: 'Seatpost',
    description:
      'Connects the saddle to the frame and must match the seat-tube diameter.',
  },
  {
    slug: 'saddle',
    name: 'Saddle',
    description:
      'The seated contact point supporting the rider on the bicycle.',
  },
  {
    slug: 'pedal',
    name: 'Pedal',
    description:
      'The rider foot contact attached to the crank with a threaded axle.',
  },
  {
    slug: 'folding_hinge',
    name: 'Folding Hinge',
    description:
      'The frame mechanism and safety latch that allow a folding bike to fold.',
  },
] as const;

export const STANDARD_DEFINITION_SEEDS = BIKE_SPEC_DEFINITIONS.map(
  (definition) => {
    const rule = COMPATIBILITY_RULES.find(
      ({ bikeSpecCode }) => bikeSpecCode === definition.code,
    );
    if (rule === undefined) {
      throw new Error(
        `No compatibility provenance found for ${definition.code}.`,
      );
    }

    return {
      code: definition.code,
      category: definition.category,
      label: definition.label,
      description: definition.description,
      guidance: definition.guidance,
      sourceUrl: rule.provenance.sourceUrl,
      reviewStatus: 'reviewed',
      version: rule.provenance.ruleVersion,
    };
  },
);

export const DEMO_ACCOUNT = {
  displayName: 'GowesKit Demo',
  email: 'demo@goweskit.local',
  password: 'GowesKitDemo123!',
} as const;

type DemoBikeSpec =
  | {
      standardCode: BikeSpecCode;
      knowledge: 'known';
      value: string;
    }
  | { standardCode: BikeSpecCode; knowledge: 'unknown' };

interface DemoBikeSeed {
  id: string;
  nickname: string;
  bicycleTypeSlug: (typeof BICYCLE_TYPE_SEEDS)[number]['slug'];
  brand: string;
  model: string;
  modelYear: number;
  notes: string;
  specs: readonly DemoBikeSpec[];
}

export const DEMO_BIKE_SEEDS = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    nickname: 'Si Rimba',
    bicycleTypeSlug: 'mtb_hardtail',
    brand: 'Nusantara',
    model: 'Trail 29',
    modelYear: 2024,
    notes:
      'Complete modern hardtail example. Matching candidates pass; different standards fail.',
    specs: [
      { standardCode: 'wheel_size', knowledge: 'known', value: 'iso_622' },
      { standardCode: 'front_axle', knowledge: 'known', value: '15x110' },
      { standardCode: 'rear_axle', knowledge: 'known', value: '12x148' },
      {
        standardCode: 'freehub',
        knowledge: 'known',
        value: 'micro_spline',
      },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '12' },
      {
        standardCode: 'fork_steerer',
        knowledge: 'known',
        value: 'tapered_1_1_8_to_1_1_2',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    nickname: 'Si Lipat',
    bicycleTypeSlug: 'folding',
    brand: 'Kota',
    model: 'Compact 20',
    modelYear: 2022,
    notes:
      'Incomplete folding-bike example that demonstrates explicit unknown values.',
    specs: [
      { standardCode: 'wheel_size', knowledge: 'known', value: 'iso_406' },
      { standardCode: 'front_axle', knowledge: 'unknown' },
      { standardCode: 'rear_axle', knowledge: 'known', value: 'qr_135' },
      { standardCode: 'freehub', knowledge: 'known', value: 'hg' },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '8' },
      { standardCode: 'fork_steerer', knowledge: 'unknown' },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    nickname: 'Kilometer Pagi',
    bicycleTypeSlug: 'road',
    brand: 'Peloton',
    model: 'Endurance',
    modelYear: 2025,
    notes:
      'Road example with an XDR freehub. An XD cassette produces a conditional spacer result.',
    specs: [
      { standardCode: 'wheel_size', knowledge: 'known', value: 'iso_622' },
      { standardCode: 'front_axle', knowledge: 'known', value: '12x100' },
      { standardCode: 'rear_axle', knowledge: 'known', value: '12x142' },
      { standardCode: 'freehub', knowledge: 'known', value: 'xdr' },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '12' },
      {
        standardCode: 'fork_steerer',
        knowledge: 'known',
        value: 'tapered_1_1_8_to_1_1_2',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    nickname: 'Jalur Campur',
    bicycleTypeSlug: 'gravel',
    brand: 'Lintas',
    model: 'Allroad',
    modelYear: 2023,
    notes: 'Mixed-surface example with complete normalized standards.',
    specs: [
      { standardCode: 'wheel_size', knowledge: 'known', value: 'iso_622' },
      { standardCode: 'front_axle', knowledge: 'known', value: '12x100' },
      { standardCode: 'rear_axle', knowledge: 'known', value: '12x142' },
      { standardCode: 'freehub', knowledge: 'known', value: 'hg' },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '11' },
      {
        standardCode: 'fork_steerer',
        knowledge: 'known',
        value: 'tapered_1_1_8_to_1_1_2',
      },
    ],
  },
] as const satisfies readonly DemoBikeSeed[];

interface DemoPlaceSeed {
  id: string;
  type: (typeof PLACE_TYPES)[number];
  name: string;
  description: string;
  coordinate: Coordinate;
  address: string;
  bicycleTypes: readonly string[];
  beginnerFriendly: boolean;
  verificationStatus: (typeof VERIFICATION_STATUSES)[number];
  lastConfirmedAt: string;
}

export const DEMO_PLACE_SEEDS = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    type: 'workshop',
    name: 'Demo Workshop Dago',
    description:
      'Practice listing for tune-ups, brake checks, and beginner-friendly bike inspection.',
    coordinate: { longitude: 107.6134, latitude: -6.8863 },
    address: 'Dago, Bandung · demo data',
    bicycleTypes: ['mtb_hardtail', 'road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    type: 'store',
    name: 'Demo Bike Store Braga',
    description:
      'Practice listing for parts, helmets, lights, tubes, and basic cycling supplies.',
    coordinate: { longitude: 107.6098, latitude: -6.9178 },
    address: 'Braga, Bandung · demo data',
    bicycleTypes: ['road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'community_verified',
    lastConfirmedAt: '2026-08-12T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    type: 'water',
    name: 'Demo Refill Point Gasibu',
    description:
      'Practice public-water marker near a popular morning-ride gathering area.',
    coordinate: { longitude: 107.6186, latitude: -6.9002 },
    address: 'Gasibu, Bandung · demo data',
    bicycleTypes: ['mtb_hardtail', 'road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'community_verified',
    lastConfirmedAt: '2026-04-15T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    type: 'coffee',
    name: 'Demo Coffee Stop Ciumbuleuit',
    description:
      'Practice coffee-stop marker with bicycle parking and a gentle regroup point.',
    coordinate: { longitude: 107.604, latitude: -6.8745 },
    address: 'Ciumbuleuit, Bandung · demo data',
    bicycleTypes: ['road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'unverified',
    lastConfirmedAt: '2025-12-01T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    type: 'trailhead',
    name: 'Demo Tahura Trailhead',
    description:
      'Practice trail entry marker. Check local access and conditions before riding.',
    coordinate: { longitude: 107.6322, latitude: -6.8566 },
    address: 'North Bandung · demo data',
    bicycleTypes: ['mtb_hardtail', 'gravel'],
    beginnerFriendly: false,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-08-18T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    type: 'bike_park',
    name: 'Demo Arcamanik Bike Park',
    description:
      'Practice skills-area marker for controlled MTB drills and short sessions.',
    coordinate: { longitude: 107.683, latitude: -6.9155 },
    address: 'Arcamanik, Bandung · demo data',
    bicycleTypes: ['mtb_hardtail'],
    beginnerFriendly: false,
    verificationStatus: 'community_verified',
    lastConfirmedAt: '2026-08-08T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    type: 'meeting_point',
    name: 'Demo Meeting Point Asia Afrika',
    description:
      'Practice group-ride meeting marker in the city center. No live rider locations are shown.',
    coordinate: { longitude: 107.6087, latitude: -6.9218 },
    address: 'Asia Afrika, Bandung · demo data',
    bicycleTypes: ['road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    type: 'rest',
    name: 'Demo Rest Stop Punclut',
    description:
      'Practice rest marker after a climb. Carry water and verify opening conditions yourself.',
    coordinate: { longitude: 107.6172, latitude: -6.8437 },
    address: 'Punclut, Bandung · demo data',
    bicycleTypes: ['road', 'gravel', 'mtb_hardtail'],
    beginnerFriendly: false,
    verificationStatus: 'unverified',
    lastConfirmedAt: '2026-04-20T00:00:00.000Z',
  },
] as const satisfies readonly DemoPlaceSeed[];

interface DemoRouteSeed {
  id: string;
  routeType: (typeof ROUTE_TYPES)[number];
  name: string;
  description: string;
  coordinates: readonly (readonly [number, number])[];
  distanceMeters: number;
  elevationGainMeters: number;
  difficulty: (typeof ROUTE_DIFFICULTIES)[number];
  surface: (typeof ROUTE_SURFACES)[number];
  bicycleTypes: readonly string[];
  beginnerFriendly: boolean;
  verificationStatus: (typeof VERIFICATION_STATUSES)[number];
  lastConfirmedAt: string;
}

export const DEMO_ROUTE_SEEDS = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    routeType: 'road',
    name: 'Demo Dago Morning Climb',
    description:
      'Practice road climb with sustained elevation. This demo line is not turn-by-turn navigation.',
    coordinates: [
      [107.6186, -6.9002],
      [107.6161, -6.888],
      [107.6134, -6.875],
      [107.6165, -6.858],
      [107.6172, -6.8437],
    ],
    distanceMeters: 7200,
    elevationGainMeters: 310,
    difficulty: 'hard',
    surface: 'paved',
    bicycleTypes: ['road', 'gravel'],
    beginnerFriendly: false,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-08-21T00:00:00.000Z',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    routeType: 'gravel',
    name: 'Demo Tahura Gravel Intro',
    description:
      'Practice mixed-surface route for learning how gravel filters and route geometry work.',
    coordinates: [
      [107.6134, -6.8863],
      [107.6205, -6.875],
      [107.6322, -6.8566],
      [107.6405, -6.865],
      [107.626, -6.881],
    ],
    distanceMeters: 9800,
    elevationGainMeters: 240,
    difficulty: 'moderate',
    surface: 'mixed',
    bicycleTypes: ['gravel', 'mtb_hardtail'],
    beginnerFriendly: true,
    verificationStatus: 'community_verified',
    lastConfirmedAt: '2026-08-10T00:00:00.000Z',
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    routeType: 'city',
    name: 'Demo Braga Coffee Loop',
    description:
      'Practice short city loop linking a meeting point, store, and coffee stop.',
    coordinates: [
      [107.6087, -6.9218],
      [107.6098, -6.9178],
      [107.6145, -6.907],
      [107.6186, -6.9002],
      [107.609, -6.9075],
      [107.6087, -6.9218],
    ],
    distanceMeters: 4800,
    elevationGainMeters: 45,
    difficulty: 'easy',
    surface: 'paved',
    bicycleTypes: ['folding', 'road', 'gravel'],
    beginnerFriendly: true,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-04-12T00:00:00.000Z',
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    routeType: 'mtb',
    name: 'Demo Arcamanik MTB Practice',
    description:
      'Practice MTB route line near the demo skills area. Verify real trail access before riding.',
    coordinates: [
      [107.674, -6.922],
      [107.683, -6.9155],
      [107.689, -6.907],
      [107.68, -6.9],
      [107.671, -6.91],
    ],
    distanceMeters: 6100,
    elevationGainMeters: 170,
    difficulty: 'moderate',
    surface: 'trail',
    bicycleTypes: ['mtb_hardtail'],
    beginnerFriendly: false,
    verificationStatus: 'unverified',
    lastConfirmedAt: '2025-11-15T00:00:00.000Z',
  },
] as const satisfies readonly DemoRouteSeed[];
