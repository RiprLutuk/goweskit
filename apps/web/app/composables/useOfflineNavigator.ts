import { ref } from 'vue';
import { useNotify } from './useNotify.js';

export interface OfflineRoutePoint {
  latitude: number;
  longitude: number;
  elevationMeters?: number;
}

export interface OfflineElevationStep {
  distanceMeters: number;
  elevationMeters: number;
}

export interface OfflineSavedRoute {
  id: string;
  title: string;
  description: string;
  distanceKm: number;
  elevationGainMeters: number;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  bicycleTypes: string[];
  savedAt: string;
  coordinates: [number, number][];
  elevationProfile?: OfflineElevationStep[] | undefined;
  startArea?: string | undefined;
}

const STORAGE_KEY = 'goweskit_offline_routes_v1';

export function useOfflineNavigator() {
  const { toast } = useNotify();
  const savedRoutes = ref<OfflineSavedRoute[]>([]);
  const isOnline = ref(true);

  function loadSavedRoutes(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        savedRoutes.value = JSON.parse(raw) as OfflineSavedRoute[];
      } else {
        savedRoutes.value = [];
      }
    } catch {
      savedRoutes.value = [];
    }
  }

  function saveRouteOffline(route: {
    id: string;
    title: string;
    description?: string | undefined;
    distanceKm: number;
    elevationGainMeters: number;
    difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
    bicycleTypes?: string[] | undefined;
    coordinates: [number, number][];
    elevationProfile?: OfflineElevationStep[] | undefined;
    startArea?: string | undefined;
  }): boolean {
    if (typeof localStorage === 'undefined') return false;
    loadSavedRoutes();

    const existsIndex = savedRoutes.value.findIndex((r) => r.id === route.id);
    const item: OfflineSavedRoute = {
      id: route.id,
      title: route.title,
      description: route.description || '',
      distanceKm: route.distanceKm,
      elevationGainMeters: route.elevationGainMeters,
      difficulty: route.difficulty,
      bicycleTypes: route.bicycleTypes || ['all'],
      savedAt: new Date().toISOString(),
      coordinates: route.coordinates,
      elevationProfile: route.elevationProfile,
      startArea: route.startArea,
    };

    if (existsIndex >= 0) {
      savedRoutes.value[existsIndex] = item;
    } else {
      savedRoutes.value.push(item);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoutes.value));
      toast.success(
        'Rute Disimpan Offline',
        `"${route.title}" siap diakses tanpa internet di medan gowes.`,
      );
      return true;
    } catch (err: unknown) {
      toast.error('Gagal Menyimpan', 'Penyimpanan lokal browser penuh.');
      return false;
    }
  }

  function isRouteSavedOffline(routeId: string): boolean {
    return savedRoutes.value.some((r) => r.id === routeId);
  }

  function removeOfflineRoute(routeId: string): void {
    if (typeof localStorage === 'undefined') return;
    savedRoutes.value = savedRoutes.value.filter((r) => r.id !== routeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoutes.value));
    toast.info('Rute Dihapus dari Offline', 'Penyimpanan lokal telah diperbarui.');
  }

  function exportGpxFile(route: OfflineSavedRoute): void {
    if (typeof localStorage === 'undefined') return;

    const trkpts = route.coordinates
      .map(
        ([lng, lat]) =>
          `      <trkpt lat="${lat}" lon="${lng}"><name>Point</name></trkpt>`,
      )
      .join('\n');

    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GowesKit Offline Navigator" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${route.title}</name>
    <desc>${route.description || 'Exported from GowesKit'}</desc>
    <time>${route.savedAt}</time>
  </metadata>
  <trk>
    <name>${route.title}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${route.title.toLowerCase().replace(/[^a-z0-9]/gu, '_')}_goweskit.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('GPX Terunduh', 'File siap dimasukkan ke head unit Garmin/Wahoo.');
  }

  if (typeof window !== 'undefined') {
    loadSavedRoutes();
    isOnline.value = navigator.onLine;
    window.addEventListener('online', () => {
      isOnline.value = true;
    });
    window.addEventListener('offline', () => {
      isOnline.value = false;
    });
  }

  return {
    savedRoutes,
    isOnline,
    loadSavedRoutes,
    saveRouteOffline,
    isRouteSavedOffline,
    removeOfflineRoute,
    exportGpxFile,
  };
}
