export const BIKE_SPEC_CODES = [
  'wheel_size',
  'front_axle',
  'rear_axle',
  'freehub',
  'drivetrain_speeds',
  'drivetrain_family',
  'fork_steerer',
  'headset_interface',
  'bottom_bracket_shell',
  'bottom_bracket_spindle',
  'fork_travel_min_mm',
  'fork_travel_max_mm',
  'brake_mount',
  'rotor_min_mm',
  'rotor_max_mm',
  'seatpost_diameter_mm',
  'tire_clearance_max_mm',
] as const;

export type BikeSpecCode = (typeof BIKE_SPEC_CODES)[number];

export interface StandardValueOption {
  code: string;
  label: string;
}

export interface BikeSpecDefinition {
  code: BikeSpecCode;
  category: string;
  label: string;
  description: string;
  guidance: string;
  values: readonly StandardValueOption[];
}

const wheelSizeValues = [
  { code: 'iso_406', label: '20 in (ISO 406)' },
  { code: 'iso_451', label: '20 in (ISO 451)' },
  { code: 'iso_559', label: '26 in (ISO 559)' },
  { code: 'iso_584', label: '27.5 in / 650B (ISO 584)' },
  { code: 'iso_622', label: '29 in / 700C (ISO 622)' },
] as const;

const frontAxleValues = [
  { code: 'qr_100', label: 'Quick release 100 mm' },
  { code: '12x100', label: '12 × 100 mm thru-axle' },
  { code: '15x100', label: '15 × 100 mm thru-axle' },
  { code: '15x110', label: '15 × 110 mm Boost thru-axle' },
] as const;

const rearAxleValues = [
  { code: 'qr_135', label: 'Quick release 135 mm' },
  { code: '12x142', label: '12 × 142 mm thru-axle' },
  { code: '12x148', label: '12 × 148 mm Boost thru-axle' },
] as const;

const freehubValues = [
  { code: 'hg', label: 'Shimano HG' },
  { code: 'micro_spline', label: 'Shimano Micro Spline' },
  { code: 'xd', label: 'SRAM XD' },
  { code: 'xdr', label: 'SRAM XDR' },
] as const;

const drivetrainSpeedValues = [
  { code: '7', label: '7-speed' },
  { code: '8', label: '8-speed' },
  { code: '9', label: '9-speed' },
  { code: '10', label: '10-speed' },
  { code: '11', label: '11-speed' },
  { code: '12', label: '12-speed' },
  { code: '13', label: '13-speed' },
] as const;

const drivetrainFamilyValues = [
  { code: 'shimano_mtb_hg', label: 'Shimano MTB Hyperglide' },
  { code: 'shimano_road_hg', label: 'Shimano Road Hyperglide' },
  { code: 'shimano_cues_linkglide', label: 'Shimano CUES Linkglide' },
  { code: 'sram_eagle_mechanical', label: 'SRAM Eagle mechanical' },
  { code: 'sram_eagle_transmission', label: 'SRAM Eagle Transmission' },
  { code: 'sram_road_axs', label: 'SRAM Road AXS' },
  { code: 'campagnolo_road', label: 'Campagnolo road' },
] as const;

const forkSteererValues = [
  { code: 'straight_1_1_8', label: 'Straight 1 1/8 in' },
  { code: 'tapered_1_1_8_to_1_1_2', label: 'Tapered 1 1/8 to 1 1/2 in' },
] as const;

const headsetInterfaceValues = [
  { code: 'ec34_ec34', label: 'SHIS EC34 / EC34' },
  { code: 'zs44_ec44', label: 'SHIS ZS44 / EC44' },
  { code: 'zs44_zs56', label: 'SHIS ZS44 / ZS56' },
  { code: 'is42_is52', label: 'SHIS IS42 / IS52' },
] as const;

const bottomBracketShellValues = [
  { code: 'bsa_68_73', label: 'BSA threaded 68/73 mm' },
  { code: 't47_68_73', label: 'T47 threaded 68/73 mm' },
  { code: 'bb86_92', label: 'PF41 / BB86–BB92' },
  { code: 'bb30_42', label: 'BB30 / 42 mm press fit' },
  { code: 'pf30_46', label: 'PF30 / 46 mm press fit' },
] as const;

const bottomBracketSpindleValues = [
  { code: 'square_taper', label: 'Square taper' },
  { code: 'octalink', label: 'Shimano Octalink' },
  { code: 'isis', label: 'ISIS Drive' },
  { code: '24mm', label: '24 mm spindle' },
  { code: 'gxp_22_24', label: 'GXP stepped 22/24 mm' },
  { code: 'dub_28_99', label: 'SRAM DUB 28.99 mm' },
  { code: '30mm', label: '30 mm spindle' },
] as const;

const forkTravelValues = [
  60, 80, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200,
].map((millimeters) => ({
  code: String(millimeters),
  label: `${String(millimeters)} mm`,
}));

const brakeMountValues = [
  { code: 'is_51', label: 'International Standard (IS) 51 mm' },
  { code: 'post_mount', label: 'Post Mount' },
  { code: 'flat_mount', label: 'Flat Mount' },
] as const;

const rotorDiameterValues = [140, 160, 180, 183, 200, 203, 220].map(
  (millimeters) => ({
    code: String(millimeters),
    label: `${String(millimeters)} mm`,
  }),
);

const seatpostDiameterValues = [
  { code: '25.4', label: '25.4 mm' },
  { code: '26.8', label: '26.8 mm' },
  { code: '27.2', label: '27.2 mm' },
  { code: '28.6', label: '28.6 mm' },
  { code: '30.9', label: '30.9 mm' },
  { code: '31.6', label: '31.6 mm' },
  { code: '34.9', label: '34.9 mm' },
] as const;

const tireWidthValues = [
  23, 25, 28, 30, 32, 35, 38, 40, 42, 45, 47, 50, 54, 57, 60, 62, 65, 70, 75,
  80,
].map((millimeters) => ({
  code: String(millimeters),
  label: `${String(millimeters)} mm`,
}));

export const BIKE_SPEC_DEFINITIONS = [
  {
    code: 'wheel_size',
    category: 'wheel',
    label: 'Wheel size',
    description: 'The wheel bead-seat diameter used by the frame and wheel.',
    guidance:
      'Look for an ISO/ETRTO number on the tire sidewall, such as 622 or 584.',
    values: wheelSizeValues,
  },
  {
    code: 'front_axle',
    category: 'hub',
    label: 'Front axle',
    description: 'The front hub axle diameter and dropout spacing.',
    guidance:
      'Check the fork leg markings or measure the hub spacing and axle.',
    values: frontAxleValues,
  },
  {
    code: 'rear_axle',
    category: 'hub',
    label: 'Rear axle',
    description: 'The rear hub axle format and frame dropout spacing.',
    guidance:
      'Check the frame or rear hub markings for spacing and axle format.',
    values: rearAxleValues,
  },
  {
    code: 'freehub',
    category: 'cassette',
    label: 'Freehub interface',
    description: 'The spline interface that receives the cassette.',
    guidance:
      'Remove the cassette or check the rear hub documentation for the freehub body.',
    values: freehubValues,
  },
  {
    code: 'drivetrain_speeds',
    category: 'rear_derailleur',
    label: 'Drivetrain speeds',
    description:
      'The number of rear cassette sprockets used by the drivetrain.',
    guidance:
      'Count the cassette sprockets or check the shifter model specification.',
    values: drivetrainSpeedValues,
  },
  {
    code: 'drivetrain_family',
    category: 'rear_derailleur',
    label: 'Drivetrain family',
    description:
      'The documented mechanical family shared by the shifter, derailleur, chain, and cassette.',
    guidance:
      'Use the exact product family from the component compatibility chart; brand alone is not enough.',
    values: drivetrainFamilyValues,
  },
  {
    code: 'fork_steerer',
    category: 'fork',
    label: 'Fork steerer',
    description: 'The steerer-tube shape accepted by the frame and headset.',
    guidance:
      'Check the fork specification and the headset or frame documentation.',
    values: forkSteererValues,
  },
  {
    code: 'headset_interface',
    category: 'fork',
    label: 'Headset interface',
    description:
      'The complete upper/lower SHIS interface required by the frame.',
    guidance:
      'Identify both head-tube bores and cup styles; do not infer SHIS from steerer shape alone.',
    values: headsetInterfaceValues,
  },
  {
    code: 'bottom_bracket_shell',
    category: 'bottom_bracket',
    label: 'Bottom bracket shell',
    description:
      'The frame shell diameter, width, and threaded or press-fit interface.',
    guidance:
      'Identify the complete frame shell standard before choosing a bottom bracket.',
    values: bottomBracketShellValues,
  },
  {
    code: 'bottom_bracket_spindle',
    category: 'crank',
    label: 'Bottom bracket spindle interface',
    description:
      'The spindle interface accepted by the installed or candidate bottom bracket.',
    guidance:
      'Check the crank spindle specification and the bottom bracket bearing interface.',
    values: bottomBracketSpindleValues,
  },
  {
    code: 'fork_travel_min_mm',
    category: 'fork',
    label: 'Minimum approved fork travel',
    description: 'The minimum fork travel documented for the frame.',
    guidance:
      'Use the frame manufacturer’s approved travel range. If it is not documented, record unknown.',
    values: forkTravelValues,
  },
  {
    code: 'fork_travel_max_mm',
    category: 'fork',
    label: 'Maximum approved fork travel',
    description: 'The maximum fork travel documented for the frame.',
    guidance:
      'Use the frame manufacturer’s approved travel range. If it is not documented, record unknown.',
    values: forkTravelValues,
  },
  {
    code: 'brake_mount',
    category: 'brake',
    label: 'Brake mount',
    description: 'The frame or fork brake mounting interface.',
    guidance:
      'Check the mount standard and whether the brake manufacturer documents an adapter.',
    values: brakeMountValues,
  },
  {
    code: 'rotor_min_mm',
    category: 'rotor',
    label: 'Minimum approved rotor diameter',
    description: 'The minimum rotor diameter documented for the frame or fork.',
    guidance: 'Use the frame or fork manufacturer’s approved rotor range.',
    values: rotorDiameterValues,
  },
  {
    code: 'rotor_max_mm',
    category: 'rotor',
    label: 'Maximum approved rotor diameter',
    description: 'The maximum rotor diameter documented for the frame or fork.',
    guidance: 'Use the frame or fork manufacturer’s approved rotor range.',
    values: rotorDiameterValues,
  },
  {
    code: 'seatpost_diameter_mm',
    category: 'seatpost',
    label: 'Seatpost diameter',
    description: 'The round seatpost outside diameter accepted by the frame.',
    guidance:
      'Read the post marking or measure the frame with a caliper. Proprietary non-round posts require manufacturer documentation.',
    values: seatpostDiameterValues,
  },
  {
    code: 'tire_clearance_max_mm',
    category: 'tire',
    label: 'Maximum documented tire width',
    description:
      'The maximum nominal tire width documented for the frame and fork.',
    guidance:
      'Use the frame manufacturer’s limit and remember that measured tire width varies with the rim.',
    values: tireWidthValues,
  },
] as const satisfies readonly BikeSpecDefinition[];

export function getBikeSpecDefinition(
  code: string,
): BikeSpecDefinition | undefined {
  return BIKE_SPEC_DEFINITIONS.find((definition) => definition.code === code);
}

export function isBikeSpecCode(code: string): code is BikeSpecCode {
  return getBikeSpecDefinition(code) !== undefined;
}

export function isAllowedStandardValue(
  code: BikeSpecCode,
  value: string,
): boolean {
  return (
    getBikeSpecDefinition(code)?.values.some(
      (option) => option.code === value,
    ) ?? false
  );
}

export function getStandardValueLabel(
  code: BikeSpecCode,
  value: string,
): string {
  return (
    getBikeSpecDefinition(code)?.values.find((option) => option.code === value)
      ?.label ?? value
  );
}
