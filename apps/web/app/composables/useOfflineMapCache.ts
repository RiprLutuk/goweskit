import { ref, onMounted, getCurrentInstance } from 'vue';

export interface OfflineCacheStatus {
  isAvailable: boolean;
  tileCount: number;
  approximateSizeMb: number;
  lastUpdated: string | null;
}

const CACHE_NAME = 'goweskit-offline-maps-v1';
const METADATA_KEY = 'goweskit_offline_map_meta';

export function useOfflineMapCache() {
  const isCaching = ref(false);
  const downloadProgress = ref(0);
  const cacheStatus = ref<OfflineCacheStatus>({
    isAvailable: false,
    tileCount: 0,
    approximateSizeMb: 0,
    lastUpdated: null,
  });

  const isOnline = ref(true);

  if (typeof window !== 'undefined') {
    isOnline.value = navigator.onLine;
    window.addEventListener('online', () => {
      isOnline.value = true;
    });
    window.addEventListener('offline', () => {
      isOnline.value = false;
    });
  }

  async function checkCacheStatus(): Promise<OfflineCacheStatus> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return cacheStatus.value;
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const rawMeta = localStorage.getItem(METADATA_KEY);
      const meta = rawMeta
        ? (JSON.parse(rawMeta) as { lastUpdated: string })
        : null;

      // Estimate ~25KB per tile
      const estimatedBytes = keys.length * 25_000;
      const sizeMb = Number((estimatedBytes / (1024 * 1024)).toFixed(2));

      cacheStatus.value = {
        isAvailable: keys.length > 0,
        tileCount: keys.length,
        approximateSizeMb: sizeMb,
        lastUpdated:
          meta?.lastUpdated ?? (keys.length > 0 ? 'Tersimpan' : null),
      };
    } catch {
      cacheStatus.value.isAvailable = false;
    }

    return cacheStatus.value;
  }

  // Convert lat/lon to OpenStreetMap tile x, y
  function lon2tile(lon: number, zoom: number): number {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  }

  function lat2tile(lat: number, zoom: number): number {
    return Math.floor(
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
        ) /
          Math.PI) /
        2) *
        Math.pow(2, zoom),
    );
  }

  async function cacheRegion(
    centerLat: number,
    centerLon: number,
    radiusKm = 5,
    zoomLevels = [12, 13, 14],
  ): Promise<{ tileCount: number; sizeBytes: number }> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      throw new Error('CacheStorage API tidak didukung di browser ini.');
    }

    isCaching.value = true;
    downloadProgress.value = 0;

    try {
      const cache = await caches.open(CACHE_NAME);
      const urlsToCache: string[] = [];

      // Calculate approximate tile bounding box for radius
      const degRadius = radiusKm / 111; // 1 deg ≈ 111 km

      for (const z of zoomLevels) {
        const minX = lon2tile(centerLon - degRadius, z);
        const maxX = lon2tile(centerLon + degRadius, z);
        const minY = lat2tile(centerLat + degRadius, z);
        const maxY = lat2tile(centerLat - degRadius, z);

        for (let x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
          for (let y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
            // Standard OSM tile mirror
            urlsToCache.push(
              `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
            );
          }
        }
      }

      // Limit batch size to max 80 tiles per download to respect server quotas and device storage
      const selectedUrls = urlsToCache.slice(0, 80);
      let loaded = 0;

      for (const url of selectedUrls) {
        try {
          // Check if already in cache
          const match = await cache.match(url);
          if (!match) {
            const resp = await fetch(url, { mode: 'no-cors' });
            if (resp.ok || resp.type === 'opaque') {
              await cache.put(url, resp);
            }
          }
        } catch {
          // Continue on single tile fetch failure
        }
        loaded++;
        downloadProgress.value = Math.round(
          (loaded / selectedUrls.length) * 100,
        );
      }

      localStorage.setItem(
        METADATA_KEY,
        JSON.stringify({
          lastUpdated: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }),
      );

      await checkCacheStatus();
      return {
        tileCount: cacheStatus.value.tileCount,
        sizeBytes: cacheStatus.value.approximateSizeMb * 1024 * 1024,
      };
    } finally {
      isCaching.value = false;
    }
  }

  async function clearOfflineCache(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    await caches.delete(CACHE_NAME);
    localStorage.removeItem(METADATA_KEY);
    await checkCacheStatus();
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      checkCacheStatus();
    });
  }

  return {
    isOnline,
    isCaching,
    downloadProgress,
    cacheStatus,
    checkCacheStatus,
    cacheRegion,
    clearOfflineCache,
  };
}
