export interface NavigationItem {
  label: string;
  path: string;
  available: boolean;
}

export const NAVIGATION_ITEMS = [
  { label: 'Home', path: '/', available: true },
  { label: 'Learn', path: '/learn', available: true },
  { label: 'Garage', path: '/garage', available: true },
  { label: 'Explore', path: '/explore', available: true },
  { label: 'Me', path: '/me', available: true },
] as const satisfies readonly NavigationItem[];
