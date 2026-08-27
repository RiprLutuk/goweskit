import {
  BIKE_SPEC_DEFINITIONS,
  COMPATIBILITY_RULES,
  type BikeSpecCode,
} from '@goweskit/bike-domain';

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
