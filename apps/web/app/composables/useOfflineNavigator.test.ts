import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfflineNavigator } from './useOfflineNavigator.js';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('useOfflineNavigator', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('saves, checks, and removes routes offline correctly', () => {
    const { saveRouteOffline, isRouteSavedOffline, removeOfflineRoute, savedRoutes } = useOfflineNavigator();

    const success = saveRouteOffline({
      id: 'route-dago-atas',
      title: 'Tanjakan Dago Atas & Tebing Keraton',
      description: 'Rute tanjakan aspal dan makadam',
      distanceKm: 14.5,
      elevationGainMeters: 580,
      difficulty: 'hard',
      bicycleTypes: ['road', 'gravel', 'mountain'],
      coordinates: [
        [107.6134, -6.8992],
        [107.625, -6.85],
      ],
      elevationProfile: [
        { distanceMeters: 0, elevationMeters: 750 },
        { distanceMeters: 14500, elevationMeters: 1330 },
      ],
    });

    expect(success).toBe(true);
    expect(isRouteSavedOffline('route-dago-atas')).toBe(true);
    expect(savedRoutes.value).toHaveLength(1);
    expect(savedRoutes.value[0]?.title).toBe('Tanjakan Dago Atas & Tebing Keraton');

    removeOfflineRoute('route-dago-atas');
    expect(isRouteSavedOffline('route-dago-atas')).toBe(false);
    expect(savedRoutes.value).toHaveLength(0);
  });
});
