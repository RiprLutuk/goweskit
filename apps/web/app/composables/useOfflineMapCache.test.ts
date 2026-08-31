import { describe, expect, it } from 'vitest';
import { useOfflineMapCache } from './useOfflineMapCache.js';

describe('useOfflineMapCache', () => {
  it('initializes with default online and offline cache states', () => {
    const { isOnline, isCaching, cacheStatus } = useOfflineMapCache();

    expect(isOnline.value).toBe(true);
    expect(isCaching.value).toBe(false);
    expect(cacheStatus.value.isAvailable).toBe(false);
  });
});
