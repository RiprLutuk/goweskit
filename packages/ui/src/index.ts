export const COMPATIBILITY_STATUS_PRESENTATION = {
  compatible: {
    label: 'Compatible',
    tone: 'positive',
    symbol: '✓',
  },
  conditional: {
    label: 'Compatible with conditions',
    tone: 'caution',
    symbol: '◇',
  },
  unknown: {
    label: 'More information needed',
    tone: 'neutral',
    symbol: '?',
  },
  incompatible: {
    label: 'Incompatible',
    tone: 'negative',
    symbol: '×',
  },
} as const;

export type CompatibilityPresentationStatus =
  keyof typeof COMPATIBILITY_STATUS_PRESENTATION;
