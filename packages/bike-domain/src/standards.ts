export const BIKE_SPEC_CODES = [
  'wheel_size',
  'front_axle',
  'rear_axle',
  'freehub',
  'drivetrain_speeds',
  'fork_steerer',
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

export const BIKE_SPEC_DEFINITIONS = [
  {
    code: 'wheel_size',
    category: 'wheel',
    label: 'Wheel size',
    description: 'The wheel bead-seat diameter used by the frame and wheel.',
    guidance:
      'Look for an ISO/ETRTO number on the tire sidewall, such as 622 or 584.',
    values: [
      { code: 'iso_406', label: '20 in (ISO 406)' },
      { code: 'iso_451', label: '20 in (ISO 451)' },
      { code: 'iso_559', label: '26 in (ISO 559)' },
      { code: 'iso_584', label: '27.5 in / 650B (ISO 584)' },
      { code: 'iso_622', label: '29 in / 700C (ISO 622)' },
    ],
  },
  {
    code: 'front_axle',
    category: 'hub',
    label: 'Front axle',
    description: 'The front hub axle diameter and dropout spacing.',
    guidance:
      'Check the fork leg markings or measure the hub spacing and axle.',
    values: [
      { code: 'qr_100', label: 'Quick release 100 mm' },
      { code: '12x100', label: '12 × 100 mm thru-axle' },
      { code: '15x100', label: '15 × 100 mm thru-axle' },
      { code: '15x110', label: '15 × 110 mm Boost thru-axle' },
    ],
  },
  {
    code: 'rear_axle',
    category: 'hub',
    label: 'Rear axle',
    description: 'The rear hub axle format and frame dropout spacing.',
    guidance:
      'Check the frame or rear hub markings for spacing and axle format.',
    values: [
      { code: 'qr_135', label: 'Quick release 135 mm' },
      { code: '12x142', label: '12 × 142 mm thru-axle' },
      { code: '12x148', label: '12 × 148 mm Boost thru-axle' },
    ],
  },
  {
    code: 'freehub',
    category: 'cassette',
    label: 'Freehub interface',
    description: 'The spline interface that receives the cassette.',
    guidance:
      'Remove the cassette or check the rear hub documentation for the freehub body.',
    values: [
      { code: 'hg', label: 'Shimano HG' },
      { code: 'micro_spline', label: 'Shimano Micro Spline' },
      { code: 'xd', label: 'SRAM XD' },
      { code: 'xdr', label: 'SRAM XDR' },
    ],
  },
  {
    code: 'drivetrain_speeds',
    category: 'rear_derailleur',
    label: 'Drivetrain speeds',
    description:
      'The number of rear cassette sprockets used by the drivetrain.',
    guidance:
      'Count the cassette sprockets or check the shifter model specification.',
    values: [7, 8, 9, 10, 11, 12, 13].map((speed) => ({
      code: String(speed),
      label: `${String(speed)}-speed`,
    })),
  },
  {
    code: 'fork_steerer',
    category: 'fork',
    label: 'Fork steerer',
    description: 'The steerer-tube shape accepted by the frame and headset.',
    guidance:
      'Check the fork specification and the headset or frame documentation.',
    values: [
      { code: 'straight_1_1_8', label: 'Straight 1 1/8 in' },
      { code: 'tapered_1_1_8_to_1_1_2', label: 'Tapered 1 1/8 to 1 1/2 in' },
    ],
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
