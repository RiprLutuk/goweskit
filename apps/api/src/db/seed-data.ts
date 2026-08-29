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
  type CommunityJoinMode,
  type CommunityMembershipStatus,
  type CommunityRole,
  type CommunityVisibility,
  type ContributionKind,
  type ContributionModerationStatus,
  type EventParticipationStatus,
  type EventStatus,
  type EventVisibility,
  type HazardSeverity,
  type HazardType,
  type InstalledComponentStandardInput,
  type MaintenanceEventType,
  type RouteElevationPoint,
  type RouteReportType,
  type SavedItemKind,
} from '@goweskit/contracts';
import type { SafetySessionStatus } from '@goweskit/contracts/safety';
import type { SafetyAuditAction } from '../safety/repository.js';

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
    const rule = COMPATIBILITY_RULES.find(({ requiredBikeSpecCodes }) =>
      requiredBikeSpecCodes.some((code) => code === definition.code),
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
  photoUrl: string | null;
  avatarPreset: string;
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
    photoUrl: null,
    avatarPreset: 'hardtail_lime',
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
        standardCode: 'drivetrain_family',
        knowledge: 'known',
        value: 'shimano_mtb_hg',
      },
      {
        standardCode: 'fork_steerer',
        knowledge: 'known',
        value: 'tapered_1_1_8_to_1_1_2',
      },
      {
        standardCode: 'headset_interface',
        knowledge: 'known',
        value: 'zs44_zs56',
      },
      {
        standardCode: 'bottom_bracket_shell',
        knowledge: 'known',
        value: 'bsa_68_73',
      },
      {
        standardCode: 'bottom_bracket_spindle',
        knowledge: 'known',
        value: '24mm',
      },
      {
        standardCode: 'fork_travel_min_mm',
        knowledge: 'known',
        value: '100',
      },
      {
        standardCode: 'fork_travel_max_mm',
        knowledge: 'known',
        value: '140',
      },
      {
        standardCode: 'brake_mount',
        knowledge: 'known',
        value: 'post_mount',
      },
      { standardCode: 'rotor_min_mm', knowledge: 'known', value: '160' },
      { standardCode: 'rotor_max_mm', knowledge: 'known', value: '203' },
      {
        standardCode: 'seatpost_diameter_mm',
        knowledge: 'known',
        value: '30.9',
      },
      {
        standardCode: 'tire_clearance_max_mm',
        knowledge: 'known',
        value: '65',
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
    photoUrl: null,
    avatarPreset: 'folding_sky',
    notes:
      'Incomplete folding-bike example that demonstrates explicit unknown values.',
    specs: [
      { standardCode: 'wheel_size', knowledge: 'known', value: 'iso_406' },
      { standardCode: 'front_axle', knowledge: 'unknown' },
      { standardCode: 'rear_axle', knowledge: 'known', value: 'qr_135' },
      { standardCode: 'freehub', knowledge: 'known', value: 'hg' },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '8' },
      {
        standardCode: 'drivetrain_family',
        knowledge: 'known',
        value: 'shimano_mtb_hg',
      },
      { standardCode: 'fork_steerer', knowledge: 'unknown' },
      { standardCode: 'headset_interface', knowledge: 'unknown' },
      {
        standardCode: 'bottom_bracket_shell',
        knowledge: 'known',
        value: 'bsa_68_73',
      },
      {
        standardCode: 'bottom_bracket_spindle',
        knowledge: 'known',
        value: 'square_taper',
      },
      { standardCode: 'fork_travel_min_mm', knowledge: 'unknown' },
      { standardCode: 'fork_travel_max_mm', knowledge: 'unknown' },
      { standardCode: 'brake_mount', knowledge: 'unknown' },
      { standardCode: 'rotor_min_mm', knowledge: 'unknown' },
      { standardCode: 'rotor_max_mm', knowledge: 'unknown' },
      { standardCode: 'seatpost_diameter_mm', knowledge: 'unknown' },
      {
        standardCode: 'tire_clearance_max_mm',
        knowledge: 'known',
        value: '50',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    nickname: 'Kilometer Pagi',
    bicycleTypeSlug: 'road',
    brand: 'Peloton',
    model: 'Endurance',
    modelYear: 2025,
    photoUrl: null,
    avatarPreset: 'road_coral',
    notes:
      'Road example with an XDR freehub. An XD cassette produces a conditional spacer result.',
    specs: [
      { standardCode: 'wheel_size', knowledge: 'known', value: 'iso_622' },
      { standardCode: 'front_axle', knowledge: 'known', value: '12x100' },
      { standardCode: 'rear_axle', knowledge: 'known', value: '12x142' },
      { standardCode: 'freehub', knowledge: 'known', value: 'xdr' },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '12' },
      {
        standardCode: 'drivetrain_family',
        knowledge: 'known',
        value: 'sram_road_axs',
      },
      {
        standardCode: 'fork_steerer',
        knowledge: 'known',
        value: 'tapered_1_1_8_to_1_1_2',
      },
      {
        standardCode: 'headset_interface',
        knowledge: 'known',
        value: 'is42_is52',
      },
      {
        standardCode: 'bottom_bracket_shell',
        knowledge: 'known',
        value: 't47_68_73',
      },
      {
        standardCode: 'bottom_bracket_spindle',
        knowledge: 'known',
        value: 'dub_28_99',
      },
      { standardCode: 'fork_travel_min_mm', knowledge: 'unknown' },
      { standardCode: 'fork_travel_max_mm', knowledge: 'unknown' },
      {
        standardCode: 'brake_mount',
        knowledge: 'known',
        value: 'flat_mount',
      },
      { standardCode: 'rotor_min_mm', knowledge: 'known', value: '140' },
      { standardCode: 'rotor_max_mm', knowledge: 'known', value: '160' },
      {
        standardCode: 'seatpost_diameter_mm',
        knowledge: 'known',
        value: '27.2',
      },
      {
        standardCode: 'tire_clearance_max_mm',
        knowledge: 'known',
        value: '35',
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
    photoUrl: null,
    avatarPreset: 'gravel_sand',
    notes: 'Mixed-surface example with complete normalized standards.',
    specs: [
      { standardCode: 'wheel_size', knowledge: 'known', value: 'iso_622' },
      { standardCode: 'front_axle', knowledge: 'known', value: '12x100' },
      { standardCode: 'rear_axle', knowledge: 'known', value: '12x142' },
      { standardCode: 'freehub', knowledge: 'known', value: 'hg' },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '11' },
      {
        standardCode: 'drivetrain_family',
        knowledge: 'known',
        value: 'shimano_road_hg',
      },
      {
        standardCode: 'fork_steerer',
        knowledge: 'known',
        value: 'tapered_1_1_8_to_1_1_2',
      },
      {
        standardCode: 'headset_interface',
        knowledge: 'known',
        value: 'is42_is52',
      },
      {
        standardCode: 'bottom_bracket_shell',
        knowledge: 'known',
        value: 'bb86_92',
      },
      {
        standardCode: 'bottom_bracket_spindle',
        knowledge: 'known',
        value: '24mm',
      },
      { standardCode: 'fork_travel_min_mm', knowledge: 'unknown' },
      { standardCode: 'fork_travel_max_mm', knowledge: 'unknown' },
      {
        standardCode: 'brake_mount',
        knowledge: 'known',
        value: 'flat_mount',
      },
      { standardCode: 'rotor_min_mm', knowledge: 'known', value: '140' },
      { standardCode: 'rotor_max_mm', knowledge: 'known', value: '180' },
      {
        standardCode: 'seatpost_diameter_mm',
        knowledge: 'known',
        value: '27.2',
      },
      {
        standardCode: 'tire_clearance_max_mm',
        knowledge: 'known',
        value: '50',
      },
    ],
  },
] as const satisfies readonly DemoBikeSeed[];

interface DemoInstalledComponentSeed {
  id: string;
  bikeId: (typeof DEMO_BIKE_SEEDS)[number]['id'];
  categorySlug: (typeof COMPONENT_CATEGORY_SEEDS)[number]['slug'];
  customName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  notes: string;
  installedAt: string | null;
  standards: readonly InstalledComponentStandardInput[];
}

export const DEMO_INSTALLED_COMPONENT_SEEDS = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    bikeId: '10000000-0000-4000-8000-000000000001',
    categorySlug: 'fork',
    customName: 'Trail suspension fork',
    brand: 'RockShox',
    model: 'Recon Silver RL',
    serialNumber: null,
    notes: 'Demo component with confirmed axle and steerer interfaces.',
    installedAt: '2025-11-15',
    standards: [
      { standardCode: 'front_axle', knowledge: 'known', value: '15x110' },
      {
        standardCode: 'fork_steerer',
        knowledge: 'known',
        value: 'tapered_1_1_8_to_1_1_2',
      },
      { standardCode: 'fork_travel_max_mm', knowledge: 'known', value: '120' },
    ],
  },
  {
    id: '40000000-0000-4000-8000-000000000002',
    bikeId: '10000000-0000-4000-8000-000000000001',
    categorySlug: 'wheel',
    customName: 'Current rear trail wheel',
    brand: 'Shimano',
    model: 'MTB Boost wheel',
    serialNumber: null,
    notes:
      'Demo wheel: compatibility comes from the recorded standards, not the brand.',
    installedAt: '2026-02-10',
    standards: [
      { standardCode: 'wheel_size', knowledge: 'known', value: 'iso_622' },
      { standardCode: 'rear_axle', knowledge: 'known', value: '12x148' },
      { standardCode: 'freehub', knowledge: 'known', value: 'micro_spline' },
    ],
  },
  {
    id: '40000000-0000-4000-8000-000000000003',
    bikeId: '10000000-0000-4000-8000-000000000002',
    categorySlug: 'folding_hinge',
    customName: 'Main frame hinge',
    brand: null,
    model: null,
    serialNumber: null,
    notes:
      'Demo folding-specific part; no normalized interface has been confirmed.',
    installedAt: null,
    standards: [],
  },
  {
    id: '40000000-0000-4000-8000-000000000004',
    bikeId: '10000000-0000-4000-8000-000000000002',
    categorySlug: 'cassette',
    customName: '8-speed cassette',
    brand: 'Shimano',
    model: 'HG-range cassette',
    serialNumber: null,
    notes: 'Demo cassette with explicit freehub and speed standards.',
    installedAt: '2025-08-05',
    standards: [
      { standardCode: 'freehub', knowledge: 'known', value: 'hg' },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '8' },
      { standardCode: 'drivetrain_family', knowledge: 'unknown' },
    ],
  },
  {
    id: '40000000-0000-4000-8000-000000000005',
    bikeId: '10000000-0000-4000-8000-000000000003',
    categorySlug: 'cassette',
    customName: 'Road 12-speed cassette',
    brand: 'SRAM',
    model: 'XDR road cassette',
    serialNumber: null,
    notes: 'Demo road cassette with independently recorded standards.',
    installedAt: '2026-01-20',
    standards: [
      { standardCode: 'freehub', knowledge: 'known', value: 'xdr' },
      { standardCode: 'drivetrain_speeds', knowledge: 'known', value: '12' },
      {
        standardCode: 'drivetrain_family',
        knowledge: 'known',
        value: 'sram_road_axs',
      },
    ],
  },
  {
    id: '40000000-0000-4000-8000-000000000006',
    bikeId: '10000000-0000-4000-8000-000000000004',
    categorySlug: 'brake',
    customName: 'Front flat-mount brake',
    brand: 'Shimano',
    model: 'Hydraulic road caliper',
    serialNumber: null,
    notes:
      'Demo brake with mount recorded; rotor limits remain a bike-level check.',
    installedAt: '2025-10-12',
    standards: [
      { standardCode: 'brake_mount', knowledge: 'known', value: 'flat_mount' },
    ],
  },
] as const satisfies readonly DemoInstalledComponentSeed[];

interface DemoMaintenanceEventSeed {
  id: string;
  bikeId: (typeof DEMO_BIKE_SEEDS)[number]['id'];
  type: MaintenanceEventType;
  performedAt: string;
  notes: string;
  nextDueDate: string | null;
}

export const DEMO_MAINTENANCE_EVENT_SEEDS = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    bikeId: '10000000-0000-4000-8000-000000000001',
    type: 'chain_lube',
    performedAt: '2026-08-18',
    notes: 'Demo log: cleaned and lubricated after a wet trail ride.',
    nextDueDate: '2026-09-18',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    bikeId: '10000000-0000-4000-8000-000000000001',
    type: 'brake_pads',
    performedAt: '2026-05-10',
    notes: 'Demo log: inspected pad thickness and rotor condition.',
    nextDueDate: '2026-08-10',
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    bikeId: '10000000-0000-4000-8000-000000000002',
    type: 'folding_hinge',
    performedAt: '2026-08-12',
    notes: 'Demo log: checked hinge play and safety latch engagement.',
    nextDueDate: '2026-11-12',
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    bikeId: '10000000-0000-4000-8000-000000000004',
    type: 'sealant',
    performedAt: '2026-08-01',
    notes: 'Demo log: refreshed tubeless sealant.',
    nextDueDate: null,
  },
] as const satisfies readonly DemoMaintenanceEventSeed[];

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
    name: 'Demo Workshop Karawaci',
    description:
      'Practice listing for tune-ups, brake checks, and beginner-friendly bike inspection.',
    coordinate: { longitude: 106.6052, latitude: -6.1812 },
    address: 'Karawaci, Tangerang · demo data',
    bicycleTypes: ['mtb_hardtail', 'road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    type: 'store',
    name: 'Demo Bike Store Lippo Village',
    description:
      'Practice listing for parts, helmets, lights, tubes, and basic cycling supplies.',
    coordinate: { longitude: 106.5998, latitude: -6.1978 },
    address: 'Lippo Village, Tangerang · demo data',
    bicycleTypes: ['road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'community_verified',
    lastConfirmedAt: '2026-08-12T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    type: 'water',
    name: 'Demo Refill Point Karawaci',
    description:
      'Practice public-water marker near a popular morning-ride gathering area.',
    coordinate: { longitude: 106.6086, latitude: -6.1802 },
    address: 'Karawaci, Tangerang · demo data',
    bicycleTypes: ['mtb_hardtail', 'road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'community_verified',
    lastConfirmedAt: '2026-04-15T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    type: 'coffee',
    name: 'Demo Coffee Stop Lippo Village',
    description:
      'Practice coffee-stop marker with bicycle parking and a gentle regroup point.',
    coordinate: { longitude: 106.594, latitude: -6.1545 },
    address: 'Lippo Village, Tangerang · demo data',
    bicycleTypes: ['road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'unverified',
    lastConfirmedAt: '2025-12-01T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    type: 'trailhead',
    name: 'Demo Cisadane Trailhead',
    description:
      'Practice trail entry marker. Check local access and conditions before riding.',
    coordinate: { longitude: 106.6222, latitude: -6.1366 },
    address: 'Cisadane corridor, Tangerang · demo data',
    bicycleTypes: ['mtb_hardtail', 'gravel'],
    beginnerFriendly: false,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-08-18T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    type: 'bike_park',
    name: 'Demo Gading Serpong Bike Park',
    description:
      'Practice skills-area marker for controlled MTB drills and short sessions.',
    coordinate: { longitude: 106.673, latitude: -6.1955 },
    address: 'Gading Serpong, Tangerang · demo data',
    bicycleTypes: ['mtb_hardtail'],
    beginnerFriendly: false,
    verificationStatus: 'community_verified',
    lastConfirmedAt: '2026-08-08T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000007',
    type: 'meeting_point',
    name: 'Demo Meeting Point Pasar Lama',
    description:
      'Practice group-ride meeting marker in the city center. No live rider locations are shown.',
    coordinate: { longitude: 106.5987, latitude: -6.2018 },
    address: 'Pasar Lama, Tangerang · demo data',
    bicycleTypes: ['road', 'gravel', 'folding'],
    beginnerFriendly: true,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000008',
    type: 'rest',
    name: 'Demo Rest Stop Panunggangan',
    description:
      'Practice rest marker along a longer flat loop. Carry water and verify opening conditions yourself.',
    coordinate: { longitude: 106.6072, latitude: -6.1237 },
    address: 'Panunggangan, Tangerang · demo data',
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
  elevationProfile: readonly RouteElevationPoint[];
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
    name: 'Demo Karawaci Morning Loop',
    description:
      'Practice road loop on broad Karawaci corridors with controlled regroup points.',
    coordinates: [
      [106.6086, -6.1802],
      [106.6128, -6.1788],
      [106.6172, -6.178],
      [106.6215, -6.1805],
      [106.6238, -6.185],
      [106.621, -6.1902],
      [106.6165, -6.1935],
      [106.6112, -6.1948],
      [106.6065, -6.192],
      [106.6045, -6.187],
      [106.6086, -6.1802],
    ],
    distanceMeters: 7200,
    elevationGainMeters: 42,
    elevationProfile: [
      { distanceMeters: 0, elevationMeters: 20 },
      { distanceMeters: 1200, elevationMeters: 24 },
      { distanceMeters: 2600, elevationMeters: 31 },
      { distanceMeters: 4100, elevationMeters: 27 },
      { distanceMeters: 5600, elevationMeters: 34 },
      { distanceMeters: 7200, elevationMeters: 20 },
    ],
    difficulty: 'easy',
    surface: 'paved',
    bicycleTypes: ['road', 'gravel'],
    beginnerFriendly: true,
    verificationStatus: 'staff_verified',
    lastConfirmedAt: '2026-08-21T00:00:00.000Z',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    routeType: 'gravel',
    name: 'Demo Cisadane Gravel Intro',
    description:
      'Practice mixed-surface route near the broad Cisadane corridor with planned regroup points.',
    coordinates: [
      [106.6052, -6.1812],
      [106.6088, -6.175],
      [106.6125, -6.168],
      [106.617, -6.1585],
      [106.6222, -6.148],
      [106.6255, -6.139],
      [106.6222, -6.1366],
      [106.616, -6.143],
      [106.6105, -6.152],
      [106.606, -6.164],
      [106.6052, -6.1812],
    ],
    distanceMeters: 9800,
    elevationGainMeters: 68,
    elevationProfile: [
      { distanceMeters: 0, elevationMeters: 19 },
      { distanceMeters: 1800, elevationMeters: 24 },
      { distanceMeters: 3600, elevationMeters: 31 },
      { distanceMeters: 5200, elevationMeters: 38 },
      { distanceMeters: 7000, elevationMeters: 29 },
      { distanceMeters: 8400, elevationMeters: 23 },
      { distanceMeters: 9800, elevationMeters: 19 },
    ],
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
    name: 'Demo Pasar Lama Coffee Loop',
    description:
      'Practice short city loop linking broad Tangerang heritage and coffee-stop areas.',
    coordinates: [
      [106.5987, -6.2018],
      [106.602, -6.201],
      [106.6055, -6.1995],
      [106.609, -6.196],
      [106.6115, -6.191],
      [106.6086, -6.186],
      [106.604, -6.184],
      [106.5995, -6.187],
      [106.5968, -6.193],
      [106.5987, -6.2018],
    ],
    distanceMeters: 4800,
    elevationGainMeters: 24,
    elevationProfile: [
      { distanceMeters: 0, elevationMeters: 14 },
      { distanceMeters: 900, elevationMeters: 17 },
      { distanceMeters: 1900, elevationMeters: 22 },
      { distanceMeters: 2900, elevationMeters: 20 },
      { distanceMeters: 3900, elevationMeters: 16 },
      { distanceMeters: 4800, elevationMeters: 14 },
    ],
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
    name: 'Demo Gading Serpong MTB Practice',
    description:
      'Practice MTB singletrack trail with berms and natural switchbacks.',
    coordinates: [
      [106.664, -6.202],
      [106.6685, -6.199],
      [106.673, -6.1955],
      [106.678, -6.191],
      [106.682, -6.185],
      [106.679, -6.18],
      [106.6735, -6.182],
      [106.668, -6.187],
      [106.663, -6.194],
      [106.664, -6.202],
    ],
    distanceMeters: 6100,
    elevationGainMeters: 95,
    elevationProfile: [
      { distanceMeters: 0, elevationMeters: 25 },
      { distanceMeters: 1100, elevationMeters: 38 },
      { distanceMeters: 2200, elevationMeters: 52 },
      { distanceMeters: 3400, elevationMeters: 44 },
      { distanceMeters: 4500, elevationMeters: 62 },
      { distanceMeters: 5300, elevationMeters: 45 },
      { distanceMeters: 6100, elevationMeters: 26 },
    ],
    difficulty: 'moderate',
    surface: 'trail',
    bicycleTypes: ['mtb_hardtail'],
    beginnerFriendly: false,
    verificationStatus: 'unverified',
    lastConfirmedAt: '2025-11-15T00:00:00.000Z',
  },
] as const satisfies readonly DemoRouteSeed[];

interface DemoSavedItemSeed {
  id: string;
  itemKind: SavedItemKind;
  itemId: string;
  savedAt: string;
}

export const DEMO_SAVED_ITEM_SEEDS = [
  {
    id: '75000000-0000-4000-8000-000000000001',
    itemKind: 'place',
    itemId: '20000000-0000-4000-8000-000000000001',
    savedAt: '2026-08-25T08:00:00.000Z',
  },
  {
    id: '75000000-0000-4000-8000-000000000002',
    itemKind: 'place',
    itemId: '20000000-0000-4000-8000-000000000003',
    savedAt: '2026-08-26T08:00:00.000Z',
  },
  {
    id: '75000000-0000-4000-8000-000000000003',
    itemKind: 'route',
    itemId: '30000000-0000-4000-8000-000000000001',
    savedAt: '2026-08-27T08:00:00.000Z',
  },
  {
    id: '75000000-0000-4000-8000-000000000004',
    itemKind: 'route',
    itemId: '30000000-0000-4000-8000-000000000003',
    savedAt: '2026-08-28T08:00:00.000Z',
  },
] as const satisfies readonly DemoSavedItemSeed[];

export const DEMO_COMMUNITY_USERS = [
  {
    key: 'ayu',
    id: '50000000-0000-4000-8000-000000000001',
    displayName: 'Ayu Demo',
    email: 'ayu.community@goweskit.local',
  },
  {
    key: 'bima',
    id: '50000000-0000-4000-8000-000000000002',
    displayName: 'Bima Demo',
    email: 'bima.community@goweskit.local',
  },
] as const;

interface DemoCommunitySeed {
  id: string;
  slug: string;
  name: string;
  description: string;
  locality: string;
  coordinate: Coordinate;
  bicycleTypes: readonly string[];
  visibility: CommunityVisibility;
  joinMode: CommunityJoinMode;
  verificationStatus: (typeof VERIFICATION_STATUSES)[number];
  createdByKey: 'demo' | (typeof DEMO_COMMUNITY_USERS)[number]['key'];
}

export const DEMO_COMMUNITY_SEEDS = [
  {
    id: '51000000-0000-4000-8000-000000000001',
    slug: 'karawaci-morning-roll-demo',
    name: 'Karawaci Morning Roll · Demo',
    description:
      'Beginner-friendly morning rides with regroup points and a no-drop pace.',
    locality: 'Karawaci, Tangerang',
    coordinate: { longitude: 106.6086, latitude: -6.1802 },
    bicycleTypes: ['road', 'folding', 'city'],
    visibility: 'public',
    joinMode: 'open',
    verificationStatus: 'staff_verified',
    createdByKey: 'demo',
  },
  {
    id: '51000000-0000-4000-8000-000000000002',
    slug: 'lipat-kota-tangerang-demo',
    name: 'Lipat Kota Tangerang · Demo',
    description:
      'A compact-bike community practicing calm urban routes and folding-bike basics.',
    locality: 'Tangerang Kota',
    coordinate: { longitude: 106.5987, latitude: -6.2018 },
    bicycleTypes: ['folding', 'city'],
    visibility: 'public',
    joinMode: 'request',
    verificationStatus: 'community_verified',
    createdByKey: 'demo',
  },
  {
    id: '51000000-0000-4000-8000-000000000003',
    slug: 'cisadane-trail-circle-demo',
    name: 'Cisadane Trail Circle · Demo',
    description:
      'A private practice group for intermediate trail skills. The directory only shows a broad locality.',
    locality: 'Cisadane, Tangerang',
    coordinate: { longitude: 106.6222, latitude: -6.1366 },
    bicycleTypes: ['mtb_hardtail'],
    visibility: 'private',
    joinMode: 'request',
    verificationStatus: 'community_verified',
    createdByKey: 'ayu',
  },
  {
    id: '51000000-0000-4000-8000-000000000004',
    slug: 'tangerang-gravel-collective-demo',
    name: 'Tangerang Gravel Collective · Demo',
    description:
      'Mixed-surface rides focused on route awareness, self-sufficiency, and inclusive pacing.',
    locality: 'Tangerang Raya',
    coordinate: { longitude: 106.6035, latitude: -6.169 },
    bicycleTypes: ['gravel', 'road'],
    visibility: 'public',
    joinMode: 'open',
    verificationStatus: 'unverified',
    createdByKey: 'bima',
  },
] as const satisfies readonly DemoCommunitySeed[];

interface DemoCommunityMembershipSeed {
  id: string;
  communityId: string;
  userKey: 'demo' | (typeof DEMO_COMMUNITY_USERS)[number]['key'];
  role: CommunityRole;
  status: CommunityMembershipStatus;
}

export const DEMO_COMMUNITY_MEMBERSHIP_SEEDS = [
  {
    id: '52000000-0000-4000-8000-000000000001',
    communityId: '51000000-0000-4000-8000-000000000001',
    userKey: 'demo',
    role: 'owner',
    status: 'active',
  },
  {
    id: '52000000-0000-4000-8000-000000000002',
    communityId: '51000000-0000-4000-8000-000000000001',
    userKey: 'ayu',
    role: 'member',
    status: 'active',
  },
  {
    id: '52000000-0000-4000-8000-000000000003',
    communityId: '51000000-0000-4000-8000-000000000002',
    userKey: 'demo',
    role: 'owner',
    status: 'active',
  },
  {
    id: '52000000-0000-4000-8000-000000000004',
    communityId: '51000000-0000-4000-8000-000000000002',
    userKey: 'bima',
    role: 'member',
    status: 'requested',
  },
  {
    id: '52000000-0000-4000-8000-000000000005',
    communityId: '51000000-0000-4000-8000-000000000003',
    userKey: 'ayu',
    role: 'owner',
    status: 'active',
  },
  {
    id: '52000000-0000-4000-8000-000000000006',
    communityId: '51000000-0000-4000-8000-000000000003',
    userKey: 'demo',
    role: 'member',
    status: 'requested',
  },
  {
    id: '52000000-0000-4000-8000-000000000007',
    communityId: '51000000-0000-4000-8000-000000000004',
    userKey: 'bima',
    role: 'owner',
    status: 'active',
  },
  {
    id: '52000000-0000-4000-8000-000000000008',
    communityId: '51000000-0000-4000-8000-000000000004',
    userKey: 'demo',
    role: 'member',
    status: 'active',
  },
] as const satisfies readonly DemoCommunityMembershipSeed[];

interface DemoRideEventSeed {
  id: string;
  communityId: string;
  title: string;
  description: string;
  startsAt: string;
  coordinate: Coordinate;
  meetingArea: string;
  routeId: string | null;
  difficulty: (typeof ROUTE_DIFFICULTIES)[number];
  bicycleTypes: readonly string[];
  capacity: number | null;
  requirements: string;
  visibility: EventVisibility;
  status: EventStatus;
  createdByKey: 'demo' | (typeof DEMO_COMMUNITY_USERS)[number]['key'];
}

export const DEMO_RIDE_EVENT_SEEDS = [
  {
    id: '53000000-0000-4000-8000-000000000001',
    communityId: '51000000-0000-4000-8000-000000000001',
    title: 'Demo Sunday Beginner Loop',
    description:
      'Beginner-paced city loop with regular regroup points and a short bike check before departure.',
    startsAt: '2026-09-06T00:00:00.000Z',
    coordinate: { longitude: 106.6086, latitude: -6.1802 },
    meetingArea: 'Karawaci area, Tangerang',
    routeId: '30000000-0000-4000-8000-000000000003',
    difficulty: 'easy',
    bicycleTypes: ['road', 'folding'],
    capacity: 24,
    requirements: 'Helmet, water, working brakes, and a roadworthy bicycle.',
    visibility: 'public',
    status: 'scheduled',
    createdByKey: 'demo',
  },
  {
    id: '53000000-0000-4000-8000-000000000002',
    communityId: '51000000-0000-4000-8000-000000000001',
    title: 'Demo Member Bike Check',
    description:
      'Members-only workshop for checking brakes, tire pressure, and incomplete bike specifications.',
    startsAt: '2026-09-12T01:00:00.000Z',
    coordinate: { longitude: 106.6086, latitude: -6.1802 },
    meetingArea: 'Karawaci area, Tangerang',
    routeId: null,
    difficulty: 'easy',
    bicycleTypes: ['road', 'folding', 'city'],
    capacity: 16,
    requirements: 'Bring the bicycle and any specification notes you have.',
    visibility: 'members_only',
    status: 'scheduled',
    createdByKey: 'demo',
  },
  {
    id: '53000000-0000-4000-8000-000000000003',
    communityId: '51000000-0000-4000-8000-000000000002',
    title: 'Demo Folding Bike Social Ride',
    description:
      'Relaxed folding-bike ride through central Tangerang with a coffee regroup.',
    startsAt: '2026-09-20T00:30:00.000Z',
    coordinate: { longitude: 106.5987, latitude: -6.2018 },
    meetingArea: 'Pasar Lama area, Tangerang',
    routeId: '30000000-0000-4000-8000-000000000003',
    difficulty: 'easy',
    bicycleTypes: ['folding'],
    capacity: 20,
    requirements: 'Helmet and a secure folding hinge latch.',
    visibility: 'public',
    status: 'scheduled',
    createdByKey: 'demo',
  },
  {
    id: '53000000-0000-4000-8000-000000000004',
    communityId: '51000000-0000-4000-8000-000000000003',
    title: 'Demo Trail Skills Session',
    description:
      'Controlled trail practice covering braking, body position, and safe cornering.',
    startsAt: '2026-09-13T00:00:00.000Z',
    coordinate: { longitude: 106.6222, latitude: -6.1366 },
    meetingArea: 'Cisadane corridor, Tangerang',
    routeId: null,
    difficulty: 'moderate',
    bicycleTypes: ['mtb_hardtail'],
    capacity: 12,
    requirements: 'Active membership, helmet, gloves, and trail-ready brakes.',
    visibility: 'members_only',
    status: 'scheduled',
    createdByKey: 'ayu',
  },
  {
    id: '53000000-0000-4000-8000-000000000005',
    communityId: '51000000-0000-4000-8000-000000000004',
    title: 'Demo Mixed Surface Intro',
    description:
      'Introductory gravel ride with paved and unpaved sections plus planned regroup points.',
    startsAt: '2026-09-27T00:00:00.000Z',
    coordinate: { longitude: 106.594, latitude: -6.1545 },
    meetingArea: 'Lippo Village area, Tangerang',
    routeId: '30000000-0000-4000-8000-000000000002',
    difficulty: 'moderate',
    bicycleTypes: ['gravel'],
    capacity: null,
    requirements: 'Helmet, two spare tubes or repair plugs, water, and snacks.',
    visibility: 'public',
    status: 'scheduled',
    createdByKey: 'bima',
  },
  {
    id: '53000000-0000-4000-8000-000000000006',
    communityId: '51000000-0000-4000-8000-000000000001',
    title: 'Demo August Morning Roll',
    description:
      'Completed demo ride retained for event history and contributor reputation.',
    startsAt: '2026-08-16T00:00:00.000Z',
    coordinate: { longitude: 106.6086, latitude: -6.1802 },
    meetingArea: 'Karawaci area, Tangerang',
    routeId: null,
    difficulty: 'easy',
    bicycleTypes: ['road', 'folding'],
    capacity: 20,
    requirements: 'Helmet and water.',
    visibility: 'public',
    status: 'completed',
    createdByKey: 'demo',
  },
] as const satisfies readonly DemoRideEventSeed[];

interface DemoEventParticipationSeed {
  id: string;
  eventId: string;
  userKey: 'demo' | (typeof DEMO_COMMUNITY_USERS)[number]['key'];
  status: EventParticipationStatus;
}

export const DEMO_EVENT_PARTICIPATION_SEEDS = [
  {
    id: '54000000-0000-4000-8000-000000000001',
    eventId: '53000000-0000-4000-8000-000000000001',
    userKey: 'demo',
    status: 'joined',
  },
  {
    id: '54000000-0000-4000-8000-000000000002',
    eventId: '53000000-0000-4000-8000-000000000001',
    userKey: 'ayu',
    status: 'joined',
  },
  {
    id: '54000000-0000-4000-8000-000000000003',
    eventId: '53000000-0000-4000-8000-000000000003',
    userKey: 'demo',
    status: 'joined',
  },
  {
    id: '54000000-0000-4000-8000-000000000004',
    eventId: '53000000-0000-4000-8000-000000000005',
    userKey: 'demo',
    status: 'joined',
  },
  {
    id: '54000000-0000-4000-8000-000000000005',
    eventId: '53000000-0000-4000-8000-000000000006',
    userKey: 'demo',
    status: 'joined',
  },
] as const satisfies readonly DemoEventParticipationSeed[];

export const DEMO_COMMUNITY_MODERATION_AUDIT_SEEDS = [
  {
    id: '55000000-0000-4000-8000-000000000001',
    communityId: '51000000-0000-4000-8000-000000000001',
    membershipId: '52000000-0000-4000-8000-000000000002',
    reviewerKey: 'demo' as const,
    decision: 'approve' as const,
    note: 'Demo audit: approved after reviewing the request.',
  },
] as const;

export const DEMO_TRUSTED_CONTACT_SEEDS = [
  {
    id: '61000000-0000-4000-8000-000000000001',
    name: 'Ayu — keluarga',
    phone: '+6281211112222',
    email: 'ayu.contact@example.test',
    note: 'Demo contact: call when the private share shows SOS.',
  },
  {
    id: '61000000-0000-4000-8000-000000000002',
    name: 'Bima — teman gowes',
    phone: '+6281233334444',
    email: null,
    note: 'Demo contact for the morning loop.',
  },
  {
    id: '61000000-0000-4000-8000-000000000003',
    name: 'Rumah',
    phone: null,
    email: 'home.contact@example.test',
    note: 'Demo email-only trusted contact.',
  },
] as const;

interface DemoSafetySessionSeed {
  id: string;
  trustedContactId: (typeof DEMO_TRUSTED_CONTACT_SEEDS)[number]['id'];
  status: SafetySessionStatus;
  startedOffsetMinutes: number;
  expectedEndOffsetMinutes: number | null;
  endedOffsetMinutes: number | null;
  shareExpiresOffsetMinutes: number;
  sosOffsetMinutes: number | null;
  shareTokenHash: string;
  note: string;
}

export const DEMO_SAFETY_SESSION_SEEDS = [
  {
    id: '62000000-0000-4000-8000-000000000001',
    trustedContactId: '61000000-0000-4000-8000-000000000001',
    status: 'active',
    startedOffsetMinutes: -30,
    expectedEndOffsetMinutes: 120,
    endedOffsetMinutes: null,
    shareExpiresOffsetMinutes: 360,
    sosOffsetMinutes: null,
    shareTokenHash: 'a'.repeat(64),
    note: 'Demo active session. The location shown is last-known, not live.',
  },
  {
    id: '62000000-0000-4000-8000-000000000002',
    trustedContactId: '61000000-0000-4000-8000-000000000002',
    status: 'sos',
    startedOffsetMinutes: -90,
    expectedEndOffsetMinutes: 60,
    endedOffsetMinutes: null,
    shareExpiresOffsetMinutes: 240,
    sosOffsetMinutes: -10,
    shareTokenHash: 'b'.repeat(64),
    note: 'Demo SOS state. GowesKit does not dispatch emergency services.',
  },
  {
    id: '62000000-0000-4000-8000-000000000003',
    trustedContactId: '61000000-0000-4000-8000-000000000003',
    status: 'ended',
    startedOffsetMinutes: -2_880,
    expectedEndOffsetMinutes: -2_700,
    endedOffsetMinutes: -2_760,
    shareExpiresOffsetMinutes: -2_400,
    sosOffsetMinutes: null,
    shareTokenHash: 'c'.repeat(64),
    note: 'Demo ride ended normally.',
  },
  {
    id: '62000000-0000-4000-8000-000000000004',
    trustedContactId: '61000000-0000-4000-8000-000000000001',
    status: 'revoked',
    startedOffsetMinutes: -4_320,
    expectedEndOffsetMinutes: -4_200,
    endedOffsetMinutes: -4_260,
    shareExpiresOffsetMinutes: -3_600,
    sosOffsetMinutes: null,
    shareTokenHash: 'd'.repeat(64),
    note: 'Demo revoked private share.',
  },
  {
    id: '62000000-0000-4000-8000-000000000005',
    trustedContactId: '61000000-0000-4000-8000-000000000002',
    status: 'expired',
    startedOffsetMinutes: -3_000,
    expectedEndOffsetMinutes: null,
    endedOffsetMinutes: null,
    shareExpiresOffsetMinutes: -1_560,
    sosOffsetMinutes: null,
    shareTokenHash: 'e'.repeat(64),
    note: 'Demo share expired automatically.',
  },
] as const satisfies readonly DemoSafetySessionSeed[];

export const DEMO_SAFETY_LOCATION_SEEDS = [
  {
    id: '63000000-0000-4000-8000-000000000001',
    sessionId: '62000000-0000-4000-8000-000000000001',
    coordinate: { longitude: 106.6086, latitude: -6.1802 },
    accuracyMeters: 14,
    batteryPercent: 82,
    recordedOffsetMinutes: -5,
  },
  {
    id: '63000000-0000-4000-8000-000000000002',
    sessionId: '62000000-0000-4000-8000-000000000002',
    coordinate: { longitude: 106.6052, latitude: -6.1812 },
    accuracyMeters: 21,
    batteryPercent: 54,
    recordedOffsetMinutes: -3,
  },
  {
    id: '63000000-0000-4000-8000-000000000003',
    sessionId: '62000000-0000-4000-8000-000000000003',
    coordinate: { longitude: 106.5987, latitude: -6.2018 },
    accuracyMeters: 10,
    batteryPercent: null,
    recordedOffsetMinutes: -2_765,
  },
] as const;

interface DemoSafetyAuditSeed {
  id: string;
  action: SafetyAuditAction;
  sessionId: string | null;
  occurredOffsetMinutes: number;
  metadata: Record<string, string | number | boolean | null>;
}

export const DEMO_SAFETY_AUDIT_SEEDS = [
  {
    id: '64000000-0000-4000-8000-000000000001',
    action: 'session_started',
    sessionId: '62000000-0000-4000-8000-000000000001',
    occurredOffsetMinutes: -30,
    metadata: { demo: true, expectedReturnProvided: true },
  },
  {
    id: '64000000-0000-4000-8000-000000000002',
    action: 'location_updated',
    sessionId: '62000000-0000-4000-8000-000000000001',
    occurredOffsetMinutes: -5,
    metadata: { demo: true, accuracyMeters: 14, batteryProvided: true },
  },
  {
    id: '64000000-0000-4000-8000-000000000003',
    action: 'session_started',
    sessionId: '62000000-0000-4000-8000-000000000002',
    occurredOffsetMinutes: -90,
    metadata: { demo: true, expectedReturnProvided: true },
  },
  {
    id: '64000000-0000-4000-8000-000000000004',
    action: 'sos_triggered',
    sessionId: '62000000-0000-4000-8000-000000000002',
    occurredOffsetMinutes: -10,
    metadata: { demo: true },
  },
  {
    id: '64000000-0000-4000-8000-000000000005',
    action: 'session_ended',
    sessionId: '62000000-0000-4000-8000-000000000003',
    occurredOffsetMinutes: -2_760,
    metadata: { demo: true },
  },
  {
    id: '64000000-0000-4000-8000-000000000006',
    action: 'session_revoked',
    sessionId: '62000000-0000-4000-8000-000000000004',
    occurredOffsetMinutes: -4_260,
    metadata: { demo: true },
  },
  {
    id: '64000000-0000-4000-8000-000000000007',
    action: 'session_expired',
    sessionId: '62000000-0000-4000-8000-000000000005',
    occurredOffsetMinutes: -1_560,
    metadata: { demo: true },
  },
] as const satisfies readonly DemoSafetyAuditSeed[];

type DemoContributionUserKey =
  'demo' | (typeof DEMO_COMMUNITY_USERS)[number]['key'];

interface DemoPlaceReviewSeed {
  id: string;
  reporterKey: DemoContributionUserKey;
  placeId: (typeof DEMO_PLACE_SEEDS)[number]['id'];
  rating: number;
  notes: string;
  moderationStatus: ContributionModerationStatus;
  createdAt: string;
}

export const DEMO_PLACE_REVIEW_SEEDS = [
  {
    id: '71000000-0000-4000-8000-000000000001',
    reporterKey: 'ayu',
    placeId: '20000000-0000-4000-8000-000000000001',
    rating: 5,
    notes:
      'Staff explained the brake check clearly and welcomed a beginner question.',
    moderationStatus: 'approved',
    createdAt: '2026-08-23T03:00:00.000Z',
  },
  {
    id: '71000000-0000-4000-8000-000000000002',
    reporterKey: 'bima',
    placeId: '20000000-0000-4000-8000-000000000001',
    rating: 4,
    notes: 'Useful inspection stop; confirm opening hours before a long ride.',
    moderationStatus: 'approved',
    createdAt: '2026-08-21T04:30:00.000Z',
  },
  {
    id: '71000000-0000-4000-8000-000000000003',
    reporterKey: 'demo',
    placeId: '20000000-0000-4000-8000-000000000002',
    rating: 5,
    notes: 'Pending demo review for moderation testing.',
    moderationStatus: 'pending',
    createdAt: '2026-08-27T06:00:00.000Z',
  },
  {
    id: '71000000-0000-4000-8000-000000000004',
    reporterKey: 'bima',
    placeId: '20000000-0000-4000-8000-000000000003',
    rating: 2,
    notes: 'Rejected demo content retained for audit coverage.',
    moderationStatus: 'rejected',
    createdAt: '2026-08-18T01:00:00.000Z',
  },
  {
    id: '71000000-0000-4000-8000-000000000005',
    reporterKey: 'demo',
    placeId: '20000000-0000-4000-8000-000000000005',
    rating: 4,
    notes:
      'Clear trail entry marker, but riders should verify access and weather themselves.',
    moderationStatus: 'approved',
    createdAt: '2026-08-24T02:15:00.000Z',
  },
] as const satisfies readonly DemoPlaceReviewSeed[];

interface DemoRouteReportSeed {
  id: string;
  reporterKey: DemoContributionUserKey;
  routeId: (typeof DEMO_ROUTE_SEEDS)[number]['id'];
  reportType: RouteReportType;
  notes: string;
  observedAt: string | null;
  moderationStatus: ContributionModerationStatus;
  createdAt: string;
}

export const DEMO_ROUTE_REPORT_SEEDS = [
  {
    id: '72000000-0000-4000-8000-000000000001',
    reporterKey: 'ayu',
    routeId: '30000000-0000-4000-8000-000000000001',
    reportType: 'condition',
    notes: 'Paved climb was dry in the morning; traffic increased after 08:00.',
    observedAt: '2026-08-25T00:30:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-25T01:15:00.000Z',
  },
  {
    id: '72000000-0000-4000-8000-000000000002',
    reporterKey: 'demo',
    routeId: '30000000-0000-4000-8000-000000000002',
    reportType: 'condition',
    notes: 'Several loose gravel patches; reduce speed before shaded bends.',
    observedAt: '2026-08-26T02:00:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-26T03:00:00.000Z',
  },
  {
    id: '72000000-0000-4000-8000-000000000003',
    reporterKey: 'bima',
    routeId: '30000000-0000-4000-8000-000000000002',
    reportType: 'difficulty',
    notes: 'The middle climb may feel hard for first-time gravel riders.',
    observedAt: '2026-08-24T01:00:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-24T02:00:00.000Z',
  },
  {
    id: '72000000-0000-4000-8000-000000000004',
    reporterKey: 'demo',
    routeId: '30000000-0000-4000-8000-000000000003',
    reportType: 'incorrect_route',
    notes: 'Pending demo report: one practice line may need a geometry review.',
    observedAt: null,
    moderationStatus: 'pending',
    createdAt: '2026-08-27T05:00:00.000Z',
  },
  {
    id: '72000000-0000-4000-8000-000000000005',
    reporterKey: 'ayu',
    routeId: '30000000-0000-4000-8000-000000000004',
    reportType: 'closure',
    notes:
      'Rejected demo closure because the observation could not be verified.',
    observedAt: '2026-08-10T03:00:00.000Z',
    moderationStatus: 'rejected',
    createdAt: '2026-08-10T04:00:00.000Z',
  },
  {
    id: '72000000-0000-4000-8000-000000000006',
    reporterKey: 'bima',
    routeId: '30000000-0000-4000-8000-000000000003',
    reportType: 'condition',
    notes: 'City loop surface was mostly smooth with busy crossings.',
    observedAt: '2026-08-22T00:30:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-22T01:10:00.000Z',
  },
] as const satisfies readonly DemoRouteReportSeed[];

interface DemoHazardReportSeed {
  id: string;
  reporterKey: DemoContributionUserKey;
  routeId: (typeof DEMO_ROUTE_SEEDS)[number]['id'] | null;
  hazardType: HazardType;
  severity: HazardSeverity;
  coordinate: Coordinate;
  notes: string;
  observedAt: string | null;
  moderationStatus: ContributionModerationStatus;
  createdAt: string;
}

export const DEMO_HAZARD_REPORT_SEEDS = [
  {
    id: '73000000-0000-4000-8000-000000000001',
    reporterKey: 'ayu',
    routeId: '30000000-0000-4000-8000-000000000001',
    hazardType: 'traffic',
    severity: 'caution',
    coordinate: { longitude: 106.6172, latitude: -6.178 },
    notes: 'Busy merge point during the morning commute; approach visibly.',
    observedAt: '2026-08-25T00:35:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-25T01:20:00.000Z',
  },
  {
    id: '73000000-0000-4000-8000-000000000002',
    reporterKey: 'demo',
    routeId: '30000000-0000-4000-8000-000000000002',
    hazardType: 'trail_obstruction',
    severity: 'caution',
    coordinate: { longitude: 106.6222, latitude: -6.1366 },
    notes: 'Small fallen branch near the edge of the practice line.',
    observedAt: '2026-08-26T02:05:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-26T03:10:00.000Z',
  },
  {
    id: '73000000-0000-4000-8000-000000000003',
    reporterKey: 'bima',
    routeId: '30000000-0000-4000-8000-000000000003',
    hazardType: 'road_damage',
    severity: 'danger',
    coordinate: { longitude: 106.609, latitude: -6.196 },
    notes: 'Deep pothole on the left side of the demo route line.',
    observedAt: '2026-08-22T00:40:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-22T01:15:00.000Z',
  },
  {
    id: '73000000-0000-4000-8000-000000000004',
    reporterKey: 'demo',
    routeId: null,
    hazardType: 'construction',
    severity: 'info',
    coordinate: { longitude: 106.5998, latitude: -6.1978 },
    notes: 'Pending standalone construction marker for moderation testing.',
    observedAt: null,
    moderationStatus: 'pending',
    createdAt: '2026-08-27T07:00:00.000Z',
  },
  {
    id: '73000000-0000-4000-8000-000000000005',
    reporterKey: 'ayu',
    routeId: '30000000-0000-4000-8000-000000000004',
    hazardType: 'animal',
    severity: 'caution',
    coordinate: { longitude: 106.673, latitude: -6.1955 },
    notes: 'Rejected demo marker after the observation became outdated.',
    observedAt: '2026-07-01T02:00:00.000Z',
    moderationStatus: 'rejected',
    createdAt: '2026-07-01T03:00:00.000Z',
  },
  {
    id: '73000000-0000-4000-8000-000000000006',
    reporterKey: 'bima',
    routeId: '30000000-0000-4000-8000-000000000002',
    hazardType: 'flooding',
    severity: 'info',
    coordinate: { longitude: 106.617, latitude: -6.1585 },
    notes: 'Shallow water after rain; conditions can change quickly.',
    observedAt: '2026-08-24T01:10:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-24T02:10:00.000Z',
  },
  {
    id: '73000000-0000-4000-8000-000000000007',
    reporterKey: 'demo',
    routeId: null,
    hazardType: 'other',
    severity: 'info',
    coordinate: { longitude: 106.6086, latitude: -6.1802 },
    notes: 'Temporary event activity near the demo meeting area.',
    observedAt: '2026-08-23T00:00:00.000Z',
    moderationStatus: 'approved',
    createdAt: '2026-08-23T01:00:00.000Z',
  },
] as const satisfies readonly DemoHazardReportSeed[];

interface DemoExploreModerationAuditSeed {
  id: string;
  contributionKind: ContributionKind;
  contributionId: string;
  moderatorKey: DemoContributionUserKey;
  targetStatus: 'approved' | 'rejected';
  reason: string;
  occurredAt: string;
}

function decidedModerationStatus(
  status: ContributionModerationStatus,
): 'approved' | 'rejected' {
  if (status === 'pending') {
    throw new Error('Pending contribution cannot have a moderation audit.');
  }
  return status;
}

export const DEMO_EXPLORE_MODERATION_AUDIT_SEEDS = [
  ...DEMO_PLACE_REVIEW_SEEDS.filter(
    (seed) => seed.moderationStatus !== 'pending',
  ).map((seed, index) => ({
    id: `74000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    contributionKind: 'place_review' as const,
    contributionId: seed.id,
    moderatorKey: 'demo' as const,
    targetStatus: decidedModerationStatus(seed.moderationStatus),
    reason: 'Demo moderation decision for a seeded place review.',
    occurredAt: seed.createdAt,
  })),
  ...DEMO_ROUTE_REPORT_SEEDS.filter(
    (seed) => seed.moderationStatus !== 'pending',
  ).map((seed, index) => ({
    id: `74100000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    contributionKind: 'route_report' as const,
    contributionId: seed.id,
    moderatorKey: 'demo' as const,
    targetStatus: decidedModerationStatus(seed.moderationStatus),
    reason: 'Demo moderation decision for a seeded route report.',
    occurredAt: seed.createdAt,
  })),
  ...DEMO_HAZARD_REPORT_SEEDS.filter(
    (seed) => seed.moderationStatus !== 'pending',
  ).map((seed, index) => ({
    id: `74200000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    contributionKind: 'hazard_report' as const,
    contributionId: seed.id,
    moderatorKey: 'demo' as const,
    targetStatus: decidedModerationStatus(seed.moderationStatus),
    reason: 'Demo moderation decision for a seeded hazard report.',
    occurredAt: seed.createdAt,
  })),
] as const satisfies readonly DemoExploreModerationAuditSeed[];
