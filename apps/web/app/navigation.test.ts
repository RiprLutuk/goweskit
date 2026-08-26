import { describe, expect, it } from 'vitest';

import { NAVIGATION_ITEMS } from './navigation';

describe('mobile navigation', () => {
  it('contains the product navigation in its defined order', () => {
    expect(NAVIGATION_ITEMS.map(({ label }) => label)).toEqual([
      'Home',
      'Learn',
      'Garage',
      'Explore',
      'Me',
    ]);
  });

  it('only links to product areas implemented in this milestone', () => {
    expect(NAVIGATION_ITEMS.filter(({ available }) => available)).toEqual([
      { label: 'Home', path: '/', available: true },
      { label: 'Learn', path: '/learn', available: true },
      { label: 'Garage', path: '/garage', available: true },
      { label: 'Me', path: '/me', available: true },
    ]);
  });
});
