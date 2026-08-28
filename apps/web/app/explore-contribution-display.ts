import type { Coordinate, NearbyPlace, NearbyRoute } from '@goweskit/contracts';

export type ExploreContributionItem = NearbyPlace | NearbyRoute;

export function contributionCoordinateForItem(
  item: ExploreContributionItem,
): Coordinate {
  if (item.kind === 'place') return { ...item.coordinate };
  const first = item.geometry.coordinates[0];
  if (first === undefined) {
    throw new Error('A route requires at least one coordinate.');
  }
  return { longitude: first[0], latitude: first[1] };
}

export function contributionLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

export function contributionDate(value: string | null): string {
  if (value === null) return 'Observation time not provided';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}
