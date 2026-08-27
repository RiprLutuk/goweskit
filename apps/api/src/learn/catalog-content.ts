import type { BicycleType, ComponentCategory } from '@goweskit/contracts';

interface AnatomyHotspotContent {
  componentSlug: string;
  xPercent: number;
  yPercent: number;
  beginnerLabel: string;
  beginnerSummary: string;
}

interface AnatomyContent {
  overview: string;
  hotspots: readonly AnatomyHotspotContent[];
}

export interface ComponentGuideContent {
  beginnerSummary: string;
  identificationSteps: string[];
  upgradeChecks: string[];
  unknownGuidance: string;
}

export const STARTER_ANATOMY_CONTENT = {
  mtb_hardtail: {
    overview:
      'A hardtail has suspension at the front and no rear shock. Start with the contact points, then follow the drivetrain from the crank to the rear wheel.',
    hotspots: [
      {
        componentSlug: 'handlebar',
        xPercent: 27,
        yPercent: 17,
        beginnerLabel: 'Steering control',
        beginnerSummary:
          'The handlebar is where your hands steer, brake, and shift.',
      },
      {
        componentSlug: 'fork',
        xPercent: 24,
        yPercent: 43,
        beginnerLabel: 'Front suspension',
        beginnerSummary:
          'The fork steers the front wheel and absorbs trail impacts.',
      },
      {
        componentSlug: 'brake',
        xPercent: 19,
        yPercent: 62,
        beginnerLabel: 'Stopping system',
        beginnerSummary:
          'The brake caliper squeezes the rotor to slow the wheel.',
      },
      {
        componentSlug: 'frame',
        xPercent: 48,
        yPercent: 47,
        beginnerLabel: 'Main structure',
        beginnerSummary:
          'The frame connects the bike and determines many component interfaces.',
      },
      {
        componentSlug: 'saddle',
        xPercent: 60,
        yPercent: 18,
        beginnerLabel: 'Seated contact point',
        beginnerSummary: 'The saddle supports you while seated.',
      },
      {
        componentSlug: 'crank',
        xPercent: 51,
        yPercent: 68,
        beginnerLabel: 'Pedaling input',
        beginnerSummary:
          'The crank turns your pedaling force into chain movement.',
      },
      {
        componentSlug: 'cassette',
        xPercent: 80,
        yPercent: 59,
        beginnerLabel: 'Rear gears',
        beginnerSummary:
          'The cassette is the stack of sprockets on the rear wheel.',
      },
      {
        componentSlug: 'rear_derailleur',
        xPercent: 85,
        yPercent: 72,
        beginnerLabel: 'Gear changer',
        beginnerSummary:
          'The rear derailleur moves the chain between cassette sprockets.',
      },
      {
        componentSlug: 'tire',
        xPercent: 89,
        yPercent: 50,
        beginnerLabel: 'Trail contact',
        beginnerSummary:
          'The tire provides grip and must match the rim and available clearance.',
      },
    ],
  },
  folding: {
    overview:
      'A folding bike uses compact wheels and one or more folding joints. Confirm measurements directly because folding-bike standards vary widely.',
    hotspots: [
      {
        componentSlug: 'handlebar',
        xPercent: 27,
        yPercent: 17,
        beginnerLabel: 'Steering control',
        beginnerSummary:
          'The handlebar may fold or telescope as part of the compact package.',
      },
      {
        componentSlug: 'stem',
        xPercent: 32,
        yPercent: 33,
        beginnerLabel: 'Folding cockpit support',
        beginnerSummary:
          'The stem connects the handlebar and often contains a folding joint.',
      },
      {
        componentSlug: 'frame',
        xPercent: 47,
        yPercent: 50,
        beginnerLabel: 'Compact main structure',
        beginnerSummary:
          'The frame carries the rider and surrounds the main folding joint.',
      },
      {
        componentSlug: 'folding_hinge',
        xPercent: 51,
        yPercent: 49,
        beginnerLabel: 'Main folding joint',
        beginnerSummary:
          'The hinge and safety latch lock the frame open for riding.',
      },
      {
        componentSlug: 'seatpost',
        xPercent: 59,
        yPercent: 34,
        beginnerLabel: 'Adjustable seat support',
        beginnerSummary:
          'The long seatpost lowers for storage and must match the frame diameter.',
      },
      {
        componentSlug: 'saddle',
        xPercent: 61,
        yPercent: 17,
        beginnerLabel: 'Seated contact point',
        beginnerSummary: 'The saddle supports you while seated.',
      },
      {
        componentSlug: 'crank',
        xPercent: 51,
        yPercent: 69,
        beginnerLabel: 'Pedaling input',
        beginnerSummary:
          'The crank drives the chain just as it does on a full-size bike.',
      },
      {
        componentSlug: 'cassette',
        xPercent: 79,
        yPercent: 61,
        beginnerLabel: 'Rear gears',
        beginnerSummary:
          'The cassette or freewheel supplies the rear gear choices.',
      },
      {
        componentSlug: 'tire',
        xPercent: 88,
        yPercent: 53,
        beginnerLabel: 'Road contact',
        beginnerSummary:
          'Compact tires use exact ISO diameters that cannot be guessed from inches alone.',
      },
    ],
  },
} as const satisfies Record<string, AnatomyContent>;

const COMPONENT_GUIDES: Partial<Record<string, ComponentGuideContent>> = {
  frame: {
    beginnerSummary:
      'The frame is the bike’s main structure and the reference point for fit and most upgrade interfaces.',
    identificationSteps: [
      'Find the brand, model, and size label on the frame.',
      'Look around the head tube, bottom bracket, dropouts, and seat tube for standard markings.',
    ],
    upgradeChecks: [
      'Confirm the exact mounting interface instead of relying on model name alone.',
      'Check clearance and cable or hose routing before buying a part.',
    ],
    unknownGuidance:
      'Record unknown for any measurement you cannot verify. A workshop can measure the interface without guessing.',
  },
  fork: {
    beginnerSummary:
      'The fork holds and steers the front wheel; suspension forks also control impacts.',
    identificationSteps: [
      'Look for a model label and travel marking on a fork leg.',
      'Check the axle marking and whether the steerer is straight or tapered.',
    ],
    upgradeChecks: [
      'Match the front axle and wheel size.',
      'Confirm steerer/headset fit and manufacturer-approved travel range.',
    ],
    unknownGuidance:
      'Leave axle, steerer, or travel unknown until the fork or frame documentation confirms them.',
  },
  wheel: {
    beginnerSummary:
      'A wheel combines rim, spokes, and hub; its diameter and axle interfaces must suit the bike.',
    identificationSteps: [
      'Read the ISO/ETRTO diameter on the tire sidewall.',
      'Check the hub or axle for diameter and spacing markings.',
    ],
    upgradeChecks: [
      'Match wheel diameter and axle standard.',
      'Confirm brake rotor and cassette/freehub interfaces.',
    ],
    unknownGuidance:
      'Use the ISO number and measured axle interface; inch labels alone can be ambiguous.',
  },
  tire: {
    beginnerSummary:
      'The tire is the bike’s contact with the ground and must fit both rim diameter and available clearance.',
    identificationSteps: [
      'Read both numbers in the ISO/ETRTO marking on the sidewall.',
      'Check the narrowest gaps at the frame, fork, fenders, and brakes.',
    ],
    upgradeChecks: [
      'Match the rim bead-seat diameter exactly.',
      'Confirm inflated width and safe frame/fork clearance.',
    ],
    unknownGuidance:
      'If clearance is not documented, measure it or ask a workshop before choosing a wider tire.',
  },
  cassette: {
    beginnerSummary:
      'The cassette is the rear sprocket stack and must suit the freehub and the rest of the drivetrain.',
    identificationSteps: [
      'Count the sprockets to identify the speed count.',
      'Find the cassette model code, then check its manufacturer specification.',
    ],
    upgradeChecks: [
      'Match the freehub interface.',
      'Match drivetrain speeds/family and derailleur capacity.',
    ],
    unknownGuidance:
      'Do not infer a freehub from brand alone. Confirm the cassette or hub model first.',
  },
  crank: {
    beginnerSummary:
      'The crank connects the pedals to the bottom-bracket spindle and carries the chainring.',
    identificationSteps: [
      'Look for a model code on the inside of a crank arm.',
      'Record chainring count and tooth count if visible.',
    ],
    upgradeChecks: [
      'Confirm spindle and bottom-bracket compatibility.',
      'Check chainline, frame clearance, and drivetrain family.',
    ],
    unknownGuidance:
      'A model code is safer than estimating spindle dimensions while the crank is installed.',
  },
  rear_derailleur: {
    beginnerSummary:
      'The rear derailleur moves the chain across the cassette and keeps it tensioned.',
    identificationSteps: [
      'Find the model code on the derailleur body.',
      'Count cassette sprockets and note the largest sprocket.',
    ],
    upgradeChecks: [
      'Match the shifter’s drivetrain family and speed count.',
      'Confirm maximum sprocket and total capacity.',
    ],
    unknownGuidance:
      'Keep the family or capacity unknown until the exact model specification is available.',
  },
  brake: {
    beginnerSummary:
      'The brake converts lever input into stopping force at a rim or disc rotor.',
    identificationSteps: [
      'Identify rim brake versus disc brake first.',
      'For disc brakes, find the caliper model and frame/fork mount shape.',
    ],
    upgradeChecks: [
      'Match brake mount and approved rotor size.',
      'Confirm lever/caliper system and required adapter.',
    ],
    unknownGuidance:
      'Brake fit is safety-critical. Ask a qualified workshop when mount or rotor limits are unclear.',
  },
  handlebar: {
    beginnerSummary:
      'The handlebar is a primary control point and determines hand position and steering leverage.',
    identificationSteps: [
      'Look for width and clamp-diameter markings near the center.',
      'Note rise, sweep, and bar shape.',
    ],
    upgradeChecks: [
      'Match the stem clamp diameter.',
      'Check control clamp space and a comfortable width.',
    ],
    unknownGuidance:
      'Measure the clamp area with proper tools rather than measuring the grip section.',
  },
  stem: {
    beginnerSummary:
      'The stem connects the handlebar to the fork steerer and affects reach and steering feel.',
    identificationSteps: [
      'Look for length and clamp markings on the stem.',
      'On a folding bike, inspect the hinge and safety latch separately.',
    ],
    upgradeChecks: [
      'Match handlebar and steerer clamp diameters.',
      'Use only approved folding-stem interfaces where applicable.',
    ],
    unknownGuidance:
      'Do not substitute a visually similar folding stem without manufacturer-confirmed fit.',
  },
  seatpost: {
    beginnerSummary:
      'The seatpost supports the saddle and slides into a precisely sized frame opening.',
    identificationSteps: [
      'Remove enough of the post to find its diameter marking.',
      'Check the minimum-insertion line and usable length.',
    ],
    upgradeChecks: [
      'Match seatpost diameter exactly.',
      'Confirm length, insertion depth, and saddle-rail clamp.',
    ],
    unknownGuidance:
      'Measure with calipers or ask a workshop; a near match can damage the frame or slip.',
  },
  folding_hinge: {
    beginnerSummary:
      'The folding hinge and secondary latch keep the frame securely open while riding.',
    identificationSteps: [
      'Find the frame model and inspect the hinge for wear or play.',
      'Confirm that the safety latch closes completely.',
    ],
    upgradeChecks: [
      'Use only manufacturer-approved hinge and latch parts.',
      'Check adjustment and torque using the service instructions.',
    ],
    unknownGuidance:
      'Treat unknown hinge fit or damage as a stop-riding condition until a qualified workshop checks it.',
  },
};

export function getComponentGuide(
  category: ComponentCategory,
): ComponentGuideContent {
  return (
    COMPONENT_GUIDES[category.slug] ?? {
      beginnerSummary: category.description,
      identificationSteps: [
        `Look for a model code or size marking on the ${category.name.toLowerCase()}.`,
        'Check the bicycle or component manufacturer documentation.',
      ],
      upgradeChecks: [
        'Record the exact interface and measurement before choosing a replacement.',
        'Confirm connected components and mounting hardware.',
      ],
      unknownGuidance:
        'Unknown is a valid answer. Save what you can verify and ask a workshop to confirm the remaining standard.',
    }
  );
}

export function getAnatomyContent(
  bicycleType: BicycleType,
): AnatomyContent | null {
  const contentBySlug: Readonly<Record<string, AnatomyContent>> =
    STARTER_ANATOMY_CONTENT;
  return contentBySlug[bicycleType.slug] ?? null;
}
