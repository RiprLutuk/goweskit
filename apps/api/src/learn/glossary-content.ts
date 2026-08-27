import {
  LEARN_SEARCH_MAX_RESULTS,
  type BicycleType,
  type ComponentCategory,
  type GlossaryTerm,
  type LearnSearchResponse,
  type LearnSearchResult,
} from '@goweskit/contracts';

export const CURATED_GLOSSARY: readonly GlossaryTerm[] = [
  {
    slug: 'axle-standard',
    term: 'Axle standard',
    plainDefinition:
      'The axle diameter, width, and fastening style used to hold a wheel in the bike.',
    technicalDefinition:
      'An axle standard combines interface type and hub/dropout dimensions, such as quick release 9 × 135 mm or thru-axle 12 × 148 mm.',
    aliases: ['hub spacing', 'thru axle', 'quick release', 'qr'],
    relatedComponentSlugs: ['hub', 'wheel', 'fork', 'frame'],
  },
  {
    slug: 'boost',
    term: 'Boost',
    plainDefinition:
      'A wider mountain-bike hub layout that changes how the wheel fits the fork or frame.',
    technicalDefinition:
      'Boost commonly means 15 × 110 mm at the front and 12 × 148 mm at the rear. Both axle diameter and spacing must match.',
    aliases: ['boost spacing', '110 boost', '148 boost'],
    relatedComponentSlugs: ['hub', 'wheel', 'fork', 'frame'],
  },
  {
    slug: 'bottom-bracket',
    term: 'Bottom bracket',
    plainDefinition:
      'The bearing system that lets the crank turn inside or next to the frame.',
    technicalDefinition:
      'Bottom-bracket compatibility depends on the frame shell interface, shell width, crank spindle interface, and required spacers.',
    aliases: ['bb', 'crank bearing'],
    relatedComponentSlugs: ['bottom_bracket', 'crank', 'frame'],
  },
  {
    slug: 'cassette',
    term: 'Cassette',
    plainDefinition:
      'The stack of rear sprockets that gives the bike its rear gear choices.',
    technicalDefinition:
      'A cassette must match the freehub interface, drivetrain speed/family, and the derailleur capacity for its tooth range.',
    aliases: ['rear gears', 'sprocket stack'],
    relatedComponentSlugs: ['cassette', 'hub', 'rear_derailleur', 'chain'],
  },
  {
    slug: 'drivetrain-speed',
    term: 'Drivetrain speed',
    plainDefinition:
      'The number of sprockets at the rear, such as 8-speed, 11-speed, or 12-speed.',
    technicalDefinition:
      'The speed count affects cassette spacing and the compatible chain, shifter, and derailleur family. Equal counts alone do not prove full compatibility.',
    aliases: ['speed count', 'gears', 'groupset speed'],
    relatedComponentSlugs: ['cassette', 'chain', 'rear_derailleur', 'shifter'],
  },
  {
    slug: 'folding-hinge',
    term: 'Folding hinge',
    plainDefinition:
      'The joint and safety latch that let a folding-bike frame close for storage.',
    technicalDefinition:
      'Hinge parts and adjustments are frame-specific safety interfaces. Use manufacturer-approved parts and service limits.',
    aliases: ['frame hinge', 'folding latch'],
    relatedComponentSlugs: ['folding_hinge', 'frame'],
  },
  {
    slug: 'freehub',
    term: 'Freehub',
    plainDefinition:
      'The splined part of the rear hub that the cassette slides onto.',
    technicalDefinition:
      'Common interfaces include HG, Micro Spline, XD, and XDR. Brand name alone does not identify the installed interface.',
    aliases: [
      'freehub body',
      'cassette body',
      'hg',
      'micro spline',
      'xd',
      'xdr',
    ],
    relatedComponentSlugs: ['hub', 'cassette'],
  },
  {
    slug: 'headset',
    term: 'Headset',
    plainDefinition:
      'The bearings and cups that let the fork turn smoothly inside the frame.',
    technicalDefinition:
      'The headset connects frame head-tube interfaces to the fork steerer. Cup type, bearing seat, and steerer dimensions must be confirmed.',
    aliases: ['head tube bearing', 'shis'],
    relatedComponentSlugs: ['frame', 'fork', 'stem'],
  },
  {
    slug: 'iso-etrto',
    term: 'ISO / ETRTO tire size',
    plainDefinition:
      'A precise tire-size marking such as 50-622: tire width first, rim diameter second.',
    technicalDefinition:
      'The second number is the bead-seat diameter in millimetres and must match the rim. The first is nominal inflated tire width.',
    aliases: ['etrto', 'iso 5775', 'bead seat diameter', 'bsd'],
    relatedComponentSlugs: ['tire', 'wheel'],
  },
  {
    slug: 'rotor',
    term: 'Brake rotor',
    plainDefinition:
      'The metal disc on a wheel that a disc-brake caliper squeezes to slow the bike.',
    technicalDefinition:
      'Rotor diameter must stay within frame/fork and brake limits; changing diameter can require the correct mount adapter.',
    aliases: ['disc rotor', 'brake disc'],
    relatedComponentSlugs: ['rotor', 'brake', 'hub'],
  },
  {
    slug: 'steerer-tube',
    term: 'Steerer tube',
    plainDefinition:
      'The upper tube of the fork that passes through the frame and connects to the stem.',
    technicalDefinition:
      'Common shapes include straight 1 1/8 inch and tapered 1 1/8-to-1 1/2 inch. Frame, headset, crown race, and stem interfaces all matter.',
    aliases: ['fork steerer', 'tapered steerer', 'straight steerer'],
    relatedComponentSlugs: ['fork', 'frame', 'stem'],
  },
  {
    slug: 'tire-clearance',
    term: 'Tire clearance',
    plainDefinition:
      'The safe free space around an inflated tire inside the frame, fork, brakes, and fenders.',
    technicalDefinition:
      'Clearance depends on actual mounted tire width and height, rim width, wheel accuracy, flex, debris, and manufacturer limits.',
    aliases: ['maximum tire width', 'frame clearance'],
    relatedComponentSlugs: ['tire', 'wheel', 'frame', 'fork'],
  },
  {
    slug: 'unknown-spec',
    term: 'Unknown specification',
    plainDefinition:
      'A bike detail you have not confirmed yet. Unknown is safer than a confident guess.',
    technicalDefinition:
      'GowesKit preserves unknown as an explicit state so deterministic compatibility rules can request missing information instead of inventing a standard.',
    aliases: ['i do not know', 'missing spec', 'unconfirmed'],
    relatedComponentSlugs: [],
  },
];

interface RankedResult {
  rank: number;
  result: LearnSearchResult;
}

const KIND_ORDER: Record<LearnSearchResult['kind'], number> = {
  glossary: 0,
  component: 1,
  bicycle_type: 2,
};

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchRank(
  query: string,
  title: string,
  aliases: readonly string[],
  content: readonly string[],
): number | null {
  const normalizedTitle = normalize(title);
  const normalizedAliases = aliases.map(normalize);
  if (normalizedTitle === query) return 0;
  if (normalizedAliases.includes(query)) return 1;
  if (normalizedTitle.startsWith(query)) return 2;
  if (normalizedAliases.some((alias) => alias.startsWith(query))) return 3;
  if (normalizedTitle.includes(query)) return 4;
  if (
    [...normalizedAliases, ...content.map(normalize)].some((value) =>
      value.includes(query),
    )
  )
    return 5;
  return null;
}

export function searchLearnCatalog(
  query: string,
  bicycleTypes: readonly BicycleType[],
  componentCategories: readonly ComponentCategory[],
): LearnSearchResponse {
  const trimmedQuery = query.trim();
  const normalizedQuery = normalize(trimmedQuery);
  const ranked: RankedResult[] = [];

  for (const term of CURATED_GLOSSARY) {
    const rank = matchRank(normalizedQuery, term.term, term.aliases, [
      term.plainDefinition,
      term.technicalDefinition,
      ...term.relatedComponentSlugs,
    ]);
    if (rank !== null) {
      ranked.push({
        rank,
        result: {
          kind: 'glossary',
          slug: term.slug,
          title: term.term,
          summary: term.plainDefinition,
        },
      });
    }
  }

  for (const category of componentCategories) {
    const rank = matchRank(
      normalizedQuery,
      category.name,
      [category.slug],
      [category.description],
    );
    if (rank !== null) {
      ranked.push({
        rank,
        result: {
          kind: 'component',
          slug: category.slug,
          title: category.name,
          summary: category.description,
        },
      });
    }
  }

  for (const bicycleType of bicycleTypes) {
    const rank = matchRank(
      normalizedQuery,
      bicycleType.name,
      [bicycleType.slug],
      [bicycleType.summary, bicycleType.typicalUse, bicycleType.beginnerNotes],
    );
    if (rank !== null) {
      ranked.push({
        rank,
        result: {
          kind: 'bicycle_type',
          slug: bicycleType.slug,
          title: bicycleType.name,
          summary: bicycleType.summary,
        },
      });
    }
  }

  ranked.sort(
    (left, right) =>
      left.rank - right.rank ||
      KIND_ORDER[left.result.kind] - KIND_ORDER[right.result.kind] ||
      left.result.title.localeCompare(right.result.title, 'en'),
  );

  return {
    query: trimmedQuery,
    results: ranked
      .slice(0, LEARN_SEARCH_MAX_RESULTS)
      .map(({ result }) => result),
  };
}
