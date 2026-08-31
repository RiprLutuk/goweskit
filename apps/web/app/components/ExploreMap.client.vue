<script setup lang="ts">
import type { Coordinate, NearbyPlace, NearbyRoute } from '@goweskit/contracts';
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const props = defineProps<{
  center: Coordinate;
  places: NearbyPlace[];
  routes: NearbyRoute[];
  selectedId: string | null;
  userLocation: Coordinate | null;
  hoveredElevationDistance?: number | null;
}>();

const emit = defineEmits<{
  select: [selection: { kind: 'place' | 'route'; id: string }];
  mapError: [];
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
let map: MapLibreMap | null = null;
let mapLoaded = false;
let mapLoadTimeout: number | null = null;
const showFallbackMap = ref(false);

type MapTheme = 'streets' | 'satellite' | 'topo' | 'radar';
const currentTheme = ref<MapTheme>('streets');
const is3D = ref(false);

// ── Road-Snapped Geometry Cache ──────────────────────────────
const snappedGeometries = new Map<string, [number, number][]>();

// ── Simulation / Peloton State ────────────────────────────────
interface ActiveRider {
  id: string;
  name: string;
  avatar: string;
  bikeModel: string;
  routeId: string;
  routeName: string;
  progress: number; // 0 to 1
  baseSpeedKmh: number;
  currentSpeedKmh: number;
  distanceTraveledMeters: number;
  movingSeconds: number;
  currentAltitudeMeters: number;
  bearing: number;
  currentCoord: [number, number];
}

const isSimulationPlaying = ref(true);
const simulationSpeedMultiplier = ref(1); // 1x, 2x, 5x
const isFollowCamera = ref(false);
const showRiders = ref(true);
const selectedRider = ref<ActiveRider | null>(null);

const DEMO_RIDERS_DATA: Omit<
  ActiveRider,
  | 'progress'
  | 'currentSpeedKmh'
  | 'bearing'
  | 'currentCoord'
  | 'distanceTraveledMeters'
  | 'movingSeconds'
  | 'currentAltitudeMeters'
  | 'routeName'
>[] = [
  {
    id: 'rider-1',
    name: 'Rudi Pratama',
    avatar: '🚴‍♂️',
    bikeModel: 'Si Rimba (Hardtail MTB)',
    routeId: '',
    baseSpeedKmh: 24.5,
  },
  {
    id: 'rider-2',
    name: 'Siti Rahma',
    avatar: '🚴‍♀️',
    bikeModel: 'Polygon Bend Gravel E5',
    routeId: '',
    baseSpeedKmh: 21.0,
  },
  {
    id: 'rider-3',
    name: 'Dimas Serpong',
    avatar: '🚴‍♂️',
    bikeModel: 'Giant TCR Advanced Road',
    routeId: '',
    baseSpeedKmh: 29.2,
  },
];

const activeRiders = ref<ActiveRider[]>([]);
let animationFrameId: number | null = null;
let lastTimestamp = 0;

// ── Map Styles ───────────────────────────────────────────────
const STREETS_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-streets': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap',
    },
  },
  layers: [
    {
      id: 'esri-streets-layer',
      type: 'raster',
      source: 'esri-streets',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: 'Esri, Maxar',
    },
    'carto-labels': {
      type: 'raster',
      tiles: [
        'https://cartodb-basemaps-a.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'esri-imagery-layer',
      type: 'raster',
      source: 'esri-imagery',
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: 'carto-labels-layer',
      type: 'raster',
      source: 'carto-labels',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const TOPO_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'opentopo-tiles': {
      type: 'raster',
      tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenTopoMap',
    },
  },
  layers: [
    {
      id: 'opentopo-layer',
      type: 'raster',
      source: 'opentopo-tiles',
      minzoom: 0,
      maxzoom: 17,
    },
  ],
};

const RADAR_DARK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: 'CARTO Dark Matter',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const fallbackMapUrl = computed(() => {
  const longitudeDelta = 0.08;
  const latitudeDelta = 0.06;
  const longitude = props.center.longitude;
  const latitude = props.center.latitude;
  const params = new URLSearchParams({
    bbox: [
      longitude - longitudeDelta,
      latitude - latitudeDelta,
      longitude + longitudeDelta,
      latitude + latitudeDelta,
    ].join(','),
    layer: 'mapnik',
    marker: `${latitude},${longitude}`,
  });

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
});

function supportsWebGl2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

function clearMapLoadTimeout(): void {
  if (mapLoadTimeout === null) return;
  window.clearTimeout(mapLoadTimeout);
  mapLoadTimeout = null;
}

function enableFallbackMap(): void {
  clearMapLoadTimeout();
  showFallbackMap.value = true;
  try {
    map?.remove();
  } catch {
    // ignore
  }
  map = null;
  mapLoaded = false;
  emit('mapError');
}

// ── Math & Geometry Interpolation ─────────────────────────────
function distanceMetersBetween(
  p1: [number, number],
  p2: [number, number],
): number {
  const R = 6371000;
  const lat1 = (p1[1] * Math.PI) / 180;
  const lat2 = (p2[1] * Math.PI) / 180;
  const deltaLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const deltaLng = ((p2[0] - p1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(p1: [number, number], p2: [number, number]): number {
  const lng1 = (p1[0] * Math.PI) / 180;
  const lat1 = (p1[1] * Math.PI) / 180;
  const lng2 = (p2[0] * Math.PI) / 180;
  const lat2 = (p2[1] * Math.PI) / 180;

  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function getRouteCoordinates(route: NearbyRoute): [number, number][] {
  return (
    snappedGeometries.get(route.id) ??
    (route.geometry.coordinates as [number, number][])
  );
}

/**
 * Automated Road Snapper via OSRM Bicycle Routing
 */
async function snapRouteToRoads(
  route: NearbyRoute,
): Promise<[number, number][]> {
  if (snappedGeometries.has(route.id)) {
    return snappedGeometries.get(route.id)!;
  }

  const rawCoords = route.geometry.coordinates as [number, number][];
  if (rawCoords.length < 2) return rawCoords;

  const step = Math.max(1, Math.floor(rawCoords.length / 10));
  const sampled: [number, number][] = [];
  for (let i = 0; i < rawCoords.length; i += step) {
    sampled.push(rawCoords[i]!);
  }
  if (sampled[sampled.length - 1] !== rawCoords[rawCoords.length - 1]) {
    sampled.push(rawCoords[rawCoords.length - 1]!);
  }

  const waypointsStr = sampled
    .map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`)
    .join(';');
  const url = `https://router.project-osrm.org/route/v1/bicycle/${waypointsStr}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      const coords = data.routes?.[0]?.geometry?.coordinates as
        [number, number][] | undefined;
      if (coords && coords.length >= 2) {
        snappedGeometries.set(route.id, coords);
        return coords;
      }
    }
  } catch {
    // Fallback to raw coords
  }

  snappedGeometries.set(route.id, rawCoords);
  return rawCoords;
}

async function snapAllRoutes(): Promise<void> {
  if (props.routes.length === 0) return;
  let hasNewSnaps = false;
  await Promise.all(
    props.routes.map(async (route) => {
      if (!snappedGeometries.has(route.id)) {
        await snapRouteToRoads(route);
        hasNewSnaps = true;
      }
    }),
  );
  if (hasNewSnaps && mapLoaded && map) {
    updateSource('goweskit-routes', routeGeoJson());
    setupSimulationRiders();
  }
}

function getRoutePointAtFraction(
  coords: [number, number][],
  fraction: number,
): { coord: [number, number]; bearing: number } {
  if (coords.length === 0) {
    return { coord: [0, 0], bearing: 0 };
  }
  if (coords.length === 1) {
    return { coord: coords[0] as [number, number], bearing: 0 };
  }

  const distances: number[] = [0];
  let totalDistance = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    if (!p1 || !p2) continue;
    const dist = distanceMetersBetween(p1, p2);
    totalDistance += dist;
    distances.push(totalDistance);
  }

  if (totalDistance === 0) {
    return { coord: coords[0] as [number, number], bearing: 0 };
  }

  const targetDist = Math.max(0, Math.min(1, fraction)) * totalDistance;

  let segIndex = 0;
  for (let i = 0; i < distances.length - 1; i++) {
    const currentDist = distances[i] ?? 0;
    const nextDist = distances[i + 1] ?? 0;
    if (targetDist >= currentDist && targetDist <= nextDist) {
      segIndex = i;
      break;
    }
  }

  const pA = coords[segIndex] ?? coords[0]!;
  const pB = coords[segIndex + 1] ?? coords[coords.length - 1]!;
  const segStartDist = distances[segIndex] ?? 0;
  const segEndDist = distances[segIndex + 1] ?? totalDistance;
  const segLen = segEndDist - segStartDist;

  const segFraction = segLen > 0 ? (targetDist - segStartDist) / segLen : 0;
  const lng = pA[0] + (pB[0] - pA[0]) * segFraction;
  const lat = pA[1] + (pB[1] - pA[1]) * segFraction;
  const bearing = calculateBearing(pA, pB);

  return { coord: [lng, lat], bearing };
}

// ── Native WebGL Vector Icons & Textures ───────────────────────
const SVG_WORKSHOP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.38"/></filter><g filter="url(#s)"><path d="M40 10a11 11 0 0 0-10.5 7.7l-15 15a5.5 5.5 0 1 0 7.8 7.8l15-15A11 11 0 1 0 40 10zm-2 7.7a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><path d="M40 10a11 11 0 0 0-10.5 7.7l-15 15a5.5 5.5 0 1 0 7.8 7.8l15-15A11 11 0 1 0 40 10zm-2 7.7a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" fill="#C9F36A" stroke="#17202A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="43" cy="19" r="3.5" fill="#17202A"/></g></svg>`;

const SVG_STORE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.38"/></filter><g filter="url(#s)"><path d="M10 22l6-12h32l6 12v6a7 7 0 0 1-14 0 7 7 0 0 1-14 0 7 7 0 0 1-14 0v-6zm4 12v16a3 3 0 0 0 3 3h30a3 3 0 0 0 3-3V34" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><path d="M10 22l6-12h32l6 12v6a7 7 0 0 1-14 0 7 7 0 0 1-14 0 7 7 0 0 1-14 0v-6zm4 12v16a3 3 0 0 0 3 3h30a3 3 0 0 0 3-3V34" fill="#8EDDF4" stroke="#17202A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><path d="M26 53v-12h12v12" fill="#17202A"/></g></svg>`;

const SVG_COFFEE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.38"/></filter><g filter="url(#s)"><path d="M14 22h28v14a12 12 0 0 1-12 12h-4a12 12 0 0 1-12-12V22zm28 4h6a6 6 0 0 1 0 12h-6v-12zm-32 26h36" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 22h28v14a12 12 0 0 1-12 12h-4a12 12 0 0 1-12-12V22zm28 4h6a6 6 0 0 1 0 12h-6v-12zm-32 26h36" fill="#F59E0B" stroke="#17202A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><path d="M20 10c0 4 3 4 3 8M28 10c0 4 3 4 3 8M36 10c0 4 3 4 3 8" fill="none" stroke="#17202A" stroke-width="4.5" stroke-linecap="round"/></g></svg>`;

const SVG_WATER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.38"/></filter><g filter="url(#s)"><path d="M32 8S14 30 14 42a18 18 0 0 0 36 0c0-12-18-34-18-34z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 8S14 30 14 42a18 18 0 0 0 36 0c0-12-18-34-18-34z" fill="#06B6D4" stroke="#17202A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><path d="M24 38a8 8 0 0 0 8 8" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/></g></svg>`;

const SVG_TRAILHEAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.38"/></filter><g filter="url(#s)"><path d="M32 8l-14 20h8l-10 16h32l-10-16h8L32 8z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 8l-14 20h8l-10 16h32l-10-16h8L32 8z" fill="#10B981" stroke="#17202A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><path d="M28 44v10h8V44" fill="#17202A"/></g></svg>`;

const SVG_BIKE_PARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.38"/></filter><g filter="url(#s)"><path d="M8 50l18-30 10 14 8-8 12 24H8z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 50l18-30 10 14 8-8 12 24H8z" fill="#FF8C75" stroke="#17202A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><path d="M18 50l8-14 8 14" fill="#FFFFFF" opacity="0.6"/></g></svg>`;

const SVG_MEETING_POINT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.38"/></filter><g filter="url(#s)"><path d="M14 12v42M14 12c10-4 18 6 28 0v22c-10 6-18-4-28 0" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><path d="M14 12v42M14 12c10-4 18 6 28 0v22c-10 6-18-4-28 0" fill="#A78BFA" stroke="#17202A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="14" cy="10" r="4" fill="#17202A"/></g></svg>`;

const SVG_REST = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.38"/></filter><g filter="url(#s)"><path d="M8 28h48v8H8zm6 8v14m36-14v14M14 28l6-14h24l6 14" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 28h48v8H8zm6 8v14m36-14v14M14 28l6-14h24l6 14" fill="#EDE4D2" stroke="#17202A" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/></g></svg>`;

const SVG_CYCLIST = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.45"/></filter><g filter="url(#s)"><circle cx="32" cy="32" r="26" fill="#FFFFFF" stroke="#17202A" stroke-width="5"/><circle cx="32" cy="32" r="22" fill="#C9F36A"/><circle cx="21" cy="38" r="7" fill="none" stroke="#17202A" stroke-width="3.5"/><circle cx="43" cy="38" r="7" fill="none" stroke="#17202A" stroke-width="3.5"/><path d="M21 38l7-11h7l-4 11h-10zm11 0l4-11 6 3" fill="none" stroke="#17202A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="38" cy="19" r="4" fill="#17202A"/></g></svg>`;

async function registerAllMapIcons(m: MapLibreMap): Promise<void> {
  const iconList = [
    { id: 'icon-place-workshop', svg: SVG_WORKSHOP },
    { id: 'icon-place-store', svg: SVG_STORE },
    { id: 'icon-place-coffee', svg: SVG_COFFEE },
    { id: 'icon-place-water', svg: SVG_WATER },
    { id: 'icon-place-trailhead', svg: SVG_TRAILHEAD },
    { id: 'icon-place-bike_park', svg: SVG_BIKE_PARK },
    { id: 'icon-place-meeting_point', svg: SVG_MEETING_POINT },
    { id: 'icon-place-rest', svg: SVG_REST },
    { id: 'icon-cyclist-bike', svg: SVG_CYCLIST },
  ];

  await Promise.all(
    iconList.map(
      ({ id, svg }) =>
        new Promise<void>((resolve) => {
          if (m.hasImage(id)) {
            resolve();
            return;
          }
          const img = new Image(64, 64);
          const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          img.onload = () => {
            URL.revokeObjectURL(url);
            if (!m.hasImage(id)) {
              m.addImage(id, img, { pixelRatio: 2 });
            }
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        }),
    ),
  );
}

// ── GeoJSON Generation ─────────────────────────────────────────
function cleanName(rawName: string): string {
  return rawName
    .replace(/^\[(Place|Route)\]\s*/i, '')
    .replace(/^Demo\s+/i, '')
    .trim();
}

function getPlaceThemeColor(type: string): string {
  switch (type) {
    case 'workshop':
      return '#C9F36A';
    case 'store':
      return '#8EDDF4';
    case 'coffee':
      return '#F59E0B';
    case 'water':
      return '#06B6D4';
    case 'trailhead':
      return '#10B981';
    case 'bike_park':
      return '#FF8C75';
    case 'meeting_point':
      return '#A78BFA';
    default:
      return '#EDE4D2';
  }
}

function formatDist(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

function placesGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.places.map((place) => {
      const isSelected = place.id === props.selectedId;
      return {
        type: 'Feature' as const,
        properties: {
          id: place.id,
          name: cleanName(place.name),
          type: place.type,
          iconImage: `icon-place-${place.type}`,
          themeColor: getPlaceThemeColor(place.type),
          distanceText: formatDist(place.distanceMeters),
          selected: isSelected,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [place.coordinate.longitude, place.coordinate.latitude],
        },
      };
    }),
  };
}

function cyclistsGeoJson() {
  if (!showRiders.value || activeRiders.value.length === 0) {
    return { type: 'FeatureCollection' as const, features: [] };
  }

  return {
    type: 'FeatureCollection' as const,
    features: activeRiders.value.map((rider) => ({
      type: 'Feature' as const,
      properties: {
        id: rider.id,
        name: rider.name,
        avatar: rider.avatar,
        bikeModel: rider.bikeModel,
        speedText: `${rider.currentSpeedKmh.toFixed(1)} km/h`,
        bearing: rider.bearing,
        distanceTraveledMeters: rider.distanceTraveledMeters,
        movingSeconds: rider.movingSeconds,
        currentAltitudeMeters: rider.currentAltitudeMeters,
        currentSpeedKmh: rider.currentSpeedKmh,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: rider.currentCoord,
      },
    })),
  };
}

function routeGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.routes.map((route) => {
      const coords = getRouteCoordinates(route);
      return {
        type: 'Feature' as const,
        properties: {
          id: route.id,
          name: route.name.replace(/^Demo\s+/i, ''),
          routeType: route.routeType,
          distanceMeters: route.distanceMeters,
          elevationGainMeters: route.elevationGainMeters,
          difficulty: route.difficulty,
          selected: route.id === props.selectedId,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: coords,
        },
      };
    }),
  };
}

function userGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features:
      props.userLocation === null
        ? []
        : [
            {
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'Point' as const,
                coordinates: [
                  props.userLocation.longitude,
                  props.userLocation.latitude,
                ],
              },
            },
          ],
  };
}

function hoveredWaypointGeoJson() {
  if (
    props.hoveredElevationDistance === null ||
    props.hoveredElevationDistance === undefined ||
    !props.selectedId
  ) {
    return { type: 'FeatureCollection' as const, features: [] };
  }

  const selectedRoute = props.routes.find((r) => r.id === props.selectedId);
  if (!selectedRoute) {
    return { type: 'FeatureCollection' as const, features: [] };
  }

  const fraction = Math.min(
    1,
    Math.max(0, props.hoveredElevationDistance / selectedRoute.distanceMeters),
  );
  const coords = getRouteCoordinates(selectedRoute);
  const pt = getRoutePointAtFraction(coords, fraction);

  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {
          distanceMeters: props.hoveredElevationDistance,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: pt.coord,
        },
      },
    ],
  };
}

// ── Rider Simulation & Peloton Setup ─────────────────────────
function setupSimulationRiders(): void {
  if (props.routes.length === 0) {
    activeRiders.value = [];
    return;
  }

  const assigned: ActiveRider[] = [];
  const selectedRoute = props.routes.find((r) => r.id === props.selectedId);

  DEMO_RIDERS_DATA.forEach((seed, idx) => {
    const targetRoute =
      idx === 0 && selectedRoute
        ? selectedRoute
        : props.routes[idx % props.routes.length]!;

    const coords = getRouteCoordinates(targetRoute);
    const initialProgress = (idx * 0.33) % 1;
    const pt = getRoutePointAtFraction(coords, initialProgress);
    const initialDistance = initialProgress * targetRoute.distanceMeters;

    assigned.push({
      ...seed,
      routeId: targetRoute.id,
      routeName: cleanName(targetRoute.name),
      progress: initialProgress,
      baseSpeedKmh: seed.baseSpeedKmh,
      currentSpeedKmh: seed.baseSpeedKmh,
      distanceTraveledMeters: Math.round(initialDistance),
      movingSeconds: Math.round(initialDistance / (seed.baseSpeedKmh / 3.6)),
      currentAltitudeMeters: Math.round(
        20 + Math.sin(initialProgress * Math.PI * 2) * 12,
      ),
      bearing: pt.bearing,
      currentCoord: pt.coord,
    });
  });

  activeRiders.value = assigned;
}

// ── Smooth Animation Loop (60 FPS via GPU GeoJSON Buffer) ─────
function animationTick(timestamp: number): void {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  if (
    isSimulationPlaying.value &&
    activeRiders.value.length > 0 &&
    mapLoaded &&
    map
  ) {
    const speedMult = simulationSpeedMultiplier.value;

    for (const rider of activeRiders.value) {
      const route = props.routes.find((r) => r.id === rider.routeId);
      if (!route || route.distanceMeters === 0) continue;

      const coords = getRouteCoordinates(route);
      const metersPerSec = (rider.baseSpeedKmh / 3.6) * speedMult;
      const progressDelta =
        (metersPerSec * deltaSeconds) / route.distanceMeters;

      rider.progress = (rider.progress + progressDelta) % 1;

      const pt = getRoutePointAtFraction(coords, rider.progress);
      rider.currentCoord = pt.coord;
      rider.bearing = pt.bearing;
      rider.currentSpeedKmh =
        rider.baseSpeedKmh +
        Math.sin(timestamp / 1000 + rider.progress * 10) * 2.5;

      rider.distanceTraveledMeters = Math.round(
        rider.progress * route.distanceMeters,
      );
      rider.movingSeconds = Math.round(
        rider.distanceTraveledMeters / (rider.baseSpeedKmh / 3.6),
      );
      rider.currentAltitudeMeters = Math.round(
        20 + Math.sin(rider.progress * Math.PI * 2) * 12,
      );

      if (
        isFollowCamera.value &&
        map &&
        (rider.id === 'rider-1' || rider.id === selectedRider.value?.id)
      ) {
        map.easeTo({
          center: rider.currentCoord,
          duration: 120,
          easing: (t) => t,
        });
      }
    }

    // Push updated cyclist coordinates directly to WebGL GPU buffer (Zero-Drift 60fps)
    updateSource('goweskit-cyclists', cyclistsGeoJson());
  }

  animationFrameId = requestAnimationFrame(animationTick);
}

// ── Map Layers & Sources ──────────────────────────────────────
function updateSource(
  id: string,
  data:
    | ReturnType<typeof routeGeoJson>
    | ReturnType<typeof userGeoJson>
    | ReturnType<typeof hoveredWaypointGeoJson>
    | ReturnType<typeof placesGeoJson>
    | ReturnType<typeof cyclistsGeoJson>,
): void {
  if (!mapLoaded || map === null) return;
  const source = map.getSource(id) as GeoJSONSource | undefined;
  source?.setData(data);
}

function updateData(): void {
  updateSource('goweskit-routes', routeGeoJson());
  updateSource('goweskit-user', userGeoJson());
  updateSource('goweskit-hover-waypoint', hoveredWaypointGeoJson());
  updateSource('goweskit-places', placesGeoJson());
  setupSimulationRiders();
  updateSource('goweskit-cyclists', cyclistsGeoJson());
}

async function addGowesKitLayers(): Promise<void> {
  if (!map) return;

  // 0. Register High-DPI Vector Icons into WebGL Image Registry
  await registerAllMapIcons(map);

  // 1. Routes Data Source & Layers
  if (!map.getSource('goweskit-routes')) {
    map.addSource('goweskit-routes', {
      type: 'geojson',
      data: routeGeoJson(),
    });
  }

  // 2. Bold Outer Glow / Casing for Routes (Thick & Zoom-Scaled)
  if (!map.getLayer('goweskit-route-shadow')) {
    map.addLayer({
      id: 'goweskit-route-shadow',
      type: 'line',
      source: 'goweskit-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#0f172a',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          ['case', ['get', 'selected'], 14, 8],
          13,
          ['case', ['get', 'selected'], 20, 12],
          16,
          ['case', ['get', 'selected'], 28, 18],
        ],
        'line-opacity': ['case', ['get', 'selected'], 0.55, 0.22],
        'line-blur': 2,
      },
    });
  }

  // 3. Vibrant Thick Cycling Ribbon Core (Strava/Garmin Pro Bold Style)
  if (!map.getLayer('goweskit-route-lines')) {
    map.addLayer({
      id: 'goweskit-route-lines',
      type: 'line',
      source: 'goweskit-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': [
          'match',
          ['get', 'routeType'],
          'mtb',
          '#10b981',
          'gravel',
          '#f59e0b',
          'road',
          '#0284c7',
          '#8b5cf6',
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          ['case', ['get', 'selected'], 8, 5],
          13,
          ['case', ['get', 'selected'], 12, 8],
          16,
          ['case', ['get', 'selected'], 18, 12],
        ],
        'line-opacity': 1.0,
      },
    });
  }

  // 4. Directional Flow Dash Overlay (Bold White Pulses)
  if (!map.getLayer('goweskit-route-pulse')) {
    map.addLayer({
      id: 'goweskit-route-pulse',
      type: 'line',
      source: 'goweskit-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#ffffff',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          ['case', ['get', 'selected'], 3, 2],
          13,
          ['case', ['get', 'selected'], 4.5, 2.8],
          16,
          ['case', ['get', 'selected'], 6.5, 4.0],
        ],
        'line-opacity': 0.85,
        'line-dasharray': [1, 2.5],
      },
    });
  }

  // 5. Native WebGL Place Markers (ZERO-DRIFT)
  if (!map.getSource('goweskit-places')) {
    map.addSource('goweskit-places', {
      type: 'geojson',
      data: placesGeoJson(),
    });
  }

  // Place Selection Radar Halo
  if (!map.getLayer('goweskit-places-halo')) {
    map.addLayer({
      id: 'goweskit-places-halo',
      type: 'circle',
      source: 'goweskit-places',
      paint: {
        'circle-radius': ['case', ['get', 'selected'], 24, 0],
        'circle-color': ['get', 'themeColor'],
        'circle-opacity': 0.35,
        'circle-stroke-width': ['case', ['get', 'selected'], 2, 0],
        'circle-stroke-color': '#17202A',
      },
    });
  }

  // Place Vector Die-Cut Icons Layer
  if (!map.getLayer('goweskit-places-symbol')) {
    map.addLayer({
      id: 'goweskit-places-symbol',
      type: 'symbol',
      source: 'goweskit-places',
      layout: {
        'icon-image': ['get', 'iconImage'],
        'icon-size': ['case', ['get', 'selected'], 1.25, 0.95],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'center',
        'text-field': [
          'concat',
          ['get', 'name'],
          ' (',
          ['get', 'distanceText'],
          ')',
        ],
        'text-size': 11,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-anchor': 'top',
        'text-offset': [0, 1.4],
        'text-allow-overlap': false,
        'text-optional': true,
      },
      paint: {
        'text-color': '#17202A',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 2.8,
      },
    });
  }

  // 6. Native WebGL Animated Cyclists Layer (ZERO-DRIFT)
  if (!map.getSource('goweskit-cyclists')) {
    map.addSource('goweskit-cyclists', {
      type: 'geojson',
      data: cyclistsGeoJson(),
    });
  }

  // Cyclist Beacon Halo
  if (!map.getLayer('goweskit-cyclists-halo')) {
    map.addLayer({
      id: 'goweskit-cyclists-halo',
      type: 'circle',
      source: 'goweskit-cyclists',
      paint: {
        'circle-radius': 22,
        'circle-color': '#38bdf8',
        'circle-opacity': 0.3,
      },
    });
  }

  // Cyclist Symbol with Rotating Bike & Name/Speed Tag
  if (!map.getLayer('goweskit-cyclists-symbol')) {
    map.addLayer({
      id: 'goweskit-cyclists-symbol',
      type: 'symbol',
      source: 'goweskit-cyclists',
      layout: {
        'icon-image': 'icon-cyclist-bike',
        'icon-size': 1.15,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'center',
        'text-field': ['concat', ['get', 'name'], ' · ', ['get', 'speedText']],
        'text-size': 11,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-anchor': 'bottom',
        'text-offset': [0, -1.5],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-halo-color': '#17202A',
        'text-halo-width': 3.5,
      },
    });
  }

  // 7. User Location Pulse & Marker
  if (!map.getSource('goweskit-user')) {
    map.addSource('goweskit-user', {
      type: 'geojson',
      data: userGeoJson(),
    });
  }

  if (!map.getLayer('goweskit-user-halo')) {
    map.addLayer({
      id: 'goweskit-user-halo',
      type: 'circle',
      source: 'goweskit-user',
      paint: {
        'circle-radius': 16,
        'circle-color': '#3b82f6',
        'circle-opacity': 0.25,
      },
    });
  }

  if (!map.getLayer('goweskit-user-point')) {
    map.addLayer({
      id: 'goweskit-user-point',
      type: 'circle',
      source: 'goweskit-user',
      paint: {
        'circle-radius': 8.5,
        'circle-color': '#2563eb',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
      },
    });
  }

  // 8. Hovered Elevation Waypoint Marker (Sync with elevation scrub)
  if (!map.getSource('goweskit-hover-waypoint')) {
    map.addSource('goweskit-hover-waypoint', {
      type: 'geojson',
      data: hoveredWaypointGeoJson(),
    });
  }

  if (!map.getLayer('goweskit-hover-waypoint-layer')) {
    map.addLayer({
      id: 'goweskit-hover-waypoint-layer',
      type: 'circle',
      source: 'goweskit-hover-waypoint',
      paint: {
        'circle-radius': 9,
        'circle-color': '#c9f36a',
        'circle-stroke-color': '#17202a',
        'circle-stroke-width': 3,
      },
    });
  }

  // ── Interactivity & Click Handlers ────────────────────────────
  // Route Clicks
  map.off('click', 'goweskit-route-lines', onRouteClick);
  map.on('click', 'goweskit-route-lines', onRouteClick);

  // Place Marker Clicks
  map.off('click', 'goweskit-places-symbol', onPlaceClick);
  map.on('click', 'goweskit-places-symbol', onPlaceClick);

  // Cyclist Clicks
  map.off('click', 'goweskit-cyclists-symbol', onCyclistClick);
  map.on('click', 'goweskit-cyclists-symbol', onCyclistClick);

  // Cursors
  [
    'goweskit-route-lines',
    'goweskit-places-symbol',
    'goweskit-cyclists-symbol',
  ].forEach((layerId) => {
    map?.on('mouseenter', layerId, () => {
      if (map !== null) map.getCanvas().style.cursor = 'pointer';
    });
    map?.on('mouseleave', layerId, () => {
      if (map !== null) map.getCanvas().style.cursor = '';
    });
  });
}

function onRouteClick(event: {
  features?: Array<{ properties?: { id?: unknown } }>;
}): void {
  const id = event.features?.[0]?.properties?.id;
  if (typeof id === 'string') emit('select', { kind: 'route', id });
}

function onPlaceClick(event: {
  features?: Array<{ properties?: { id?: unknown } }>;
}): void {
  const id = event.features?.[0]?.properties?.id;
  if (typeof id === 'string') emit('select', { kind: 'place', id });
}

function onCyclistClick(event: {
  features?: Array<{ properties?: { id?: unknown } }>;
}): void {
  const id = event.features?.[0]?.properties?.id;
  if (typeof id === 'string') {
    const rider = activeRiders.value.find((r) => r.id === id);
    if (rider) selectedRider.value = rider;
  }
}

// ── Camera & Style Controls ───────────────────────────────────
function switchTheme(theme: MapTheme): void {
  currentTheme.value = theme;
  if (!map) return;
  mapLoaded = false;

  const style =
    theme === 'satellite'
      ? SATELLITE_STYLE
      : theme === 'topo'
        ? TOPO_STYLE
        : theme === 'radar'
          ? RADAR_DARK_STYLE
          : STREETS_STYLE;

  map.setStyle(style);
  map.once('style.load', async () => {
    mapLoaded = true;
    await addGowesKitLayers();
    updateData();
    map?.resize();
  });
}

function cycleTheme(): void {
  const themes: MapTheme[] = ['streets', 'satellite', 'topo', 'radar'];
  const nextIdx = (themes.indexOf(currentTheme.value) + 1) % themes.length;
  const nextTheme = themes[nextIdx] ?? 'streets';
  switchTheme(nextTheme);
}

function toggle3D(): void {
  is3D.value = !is3D.value;
  if (!map) return;
  map.easeTo({
    pitch: is3D.value ? 45 : 0,
    bearing: is3D.value ? -15 : 0,
    duration: 600,
  });
}

function cycleSpeed(): void {
  if (simulationSpeedMultiplier.value === 1) {
    simulationSpeedMultiplier.value = 2;
  } else if (simulationSpeedMultiplier.value === 2) {
    simulationSpeedMultiplier.value = 5;
  } else {
    simulationSpeedMultiplier.value = 1;
  }
}

function fitToResults(): void {
  if (!mapLoaded || map === null) return;
  const bounds = new LngLatBounds();
  bounds.extend([props.center.longitude, props.center.latitude]);

  for (const place of props.places) {
    bounds.extend([place.coordinate.longitude, place.coordinate.latitude]);
  }
  for (const route of props.routes) {
    const coords = getRouteCoordinates(route);
    for (const coordinate of coords) {
      bounds.extend(coordinate);
    }
  }

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  map.fitBounds(bounds, {
    padding: { top: 90, bottom: 220, left: 40, right: 40 },
    maxZoom: 14.5,
    duration: reduceMotion ? 0 : 500,
  });
}

// ── Lifecycle & Watchers ──────────────────────────────────────
onMounted(async () => {
  await nextTick();
  if (mapContainer.value === null) {
    emit('mapError');
    return;
  }

  if (!supportsWebGl2()) {
    enableFallbackMap();
    return;
  }

  try {
    map = new MapLibreMap({
      container: mapContainer.value,
      style: STREETS_STYLE,
      center: [props.center.longitude, props.center.latitude],
      zoom: 12.5,
      pitch: 0,
      bearing: 0,
      maplibreLogo: false,
      canvasContextAttributes: { antialias: true },
    });
  } catch {
    enableFallbackMap();
    return;
  }

  map.addControl(new NavigationControl({ showCompass: true }), 'bottom-right');

  map.on('load', async () => {
    if (map === null) return;
    clearMapLoadTimeout();
    mapLoaded = true;
    await addGowesKitLayers();
    updateData();
    fitToResults();
    map.resize();
    void snapAllRoutes();
  });

  map.on('error', () => emit('mapError'));

  if (map.isStyleLoaded()) {
    clearMapLoadTimeout();
    mapLoaded = true;
    await addGowesKitLayers();
    updateData();
    fitToResults();
    map.resize();
    void snapAllRoutes();
  } else {
    mapLoadTimeout = window.setTimeout(enableFallbackMap, 8_000);
  }

  if (window.ResizeObserver && mapContainer.value) {
    const resizeObserver = new ResizeObserver(() => {
      map?.resize();
    });
    resizeObserver.observe(mapContainer.value);
  }

  animationFrameId = requestAnimationFrame(animationTick);
});

watch(
  () => [props.places, props.routes, props.center],
  () => {
    updateData();
    fitToResults();
    void snapAllRoutes();
  },
);

watch(
  () => [props.selectedId, props.userLocation, showRiders.value],
  () => {
    updateData();
  },
);

watch(
  () => props.hoveredElevationDistance,
  () => {
    updateSource('goweskit-hover-waypoint', hoveredWaypointGeoJson());
  },
);

onBeforeUnmount(() => {
  clearMapLoadTimeout();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  map?.remove();
  map = null;
  mapLoaded = false;
});
</script>

<template>
  <div class="explore-map-container">
    <iframe
      v-if="showFallbackMap"
      class="explore-map explore-map--fallback"
      :src="fallbackMapUrl"
      title="Peta lokasi GowesKit"
      loading="eager"
      referrerpolicy="strict-origin-when-cross-origin"
    />
    <div
      v-else
      ref="mapContainer"
      class="explore-map"
      role="region"
      aria-label="Peta Rute &amp; Bengkel Gowes Interaktif"
    />

    <!-- Native Floating HUD Action Stack (Middle-Right) -->
    <div class="map-hud-stack">
      <!-- 1. Map Theme Cycle Button -->
      <button
        class="map-hud-btn"
        type="button"
        :title="`Gaya Peta: ${currentTheme.toUpperCase()}`"
        @click="cycleTheme"
      >
        <GIcon
          :name="
            currentTheme === 'streets'
              ? 'map'
              : currentTheme === 'satellite'
                ? 'radar'
                : currentTheme === 'topo'
                  ? 'mountain'
                  : 'sparkles'
          "
          size="sm"
        />
        <span class="hud-sub-label">{{ currentTheme }}</span>
      </button>

      <!-- 2. 3D / 2D Perspective Toggle -->
      <button
        class="map-hud-btn"
        :class="{ 'map-hud-btn--active': is3D }"
        type="button"
        title="Sudut Pandang 3D / 2D"
        @click="toggle3D"
      >
        <span class="hud-main-text">{{ is3D ? '3D' : '2D' }}</span>
        <span class="hud-sub-label">Tilt</span>
      </button>

      <!-- 3. Live Peloton / Rider Simulation Toggle -->
      <button
        class="map-hud-btn"
        :class="{ 'map-hud-btn--active': showRiders }"
        type="button"
        title="Tampilkan / Sembunyikan Goweser"
        @click="showRiders = !showRiders"
      >
        <GIcon name="bike" size="sm" />
        <span class="hud-sub-label">Rider</span>
      </button>

      <!-- 4. Play / Pause & Speed Multiplier for Simulation -->
      <div
        v-if="showRiders && activeRiders.length > 0"
        class="hud-simulation-controls"
      >
        <button
          class="map-hud-btn"
          type="button"
          :title="isSimulationPlaying ? 'Jeda Simulasi' : 'Jalankan Simulasi'"
          @click="isSimulationPlaying = !isSimulationPlaying"
        >
          <span class="hud-main-text">{{
            isSimulationPlaying ? '⏸' : '▶'
          }}</span>
        </button>
        <button
          class="map-hud-btn"
          type="button"
          :title="`Kecepatan: ${simulationSpeedMultiplier}x`"
          @click="cycleSpeed"
        >
          <span class="hud-main-text">{{ simulationSpeedMultiplier }}x</span>
        </button>
        <button
          class="map-hud-btn"
          :class="{ 'map-hud-btn--active': isFollowCamera }"
          type="button"
          title="Kamera Mengikuti Goweser"
          @click="isFollowCamera = !isFollowCamera"
        >
          <GIcon name="radar" size="xs" />
          <span class="hud-sub-label">Follow</span>
        </button>
      </div>
    </div>

    <!-- Active Rider Telemetry Detail Card Modal -->
    <div
      v-if="selectedRider"
      class="rider-telemetry-backdrop"
      @click.self="selectedRider = null"
    >
      <div class="rider-telemetry-card">
        <div class="telemetry-header">
          <div class="rider-avatar-large">{{ selectedRider.avatar }}</div>
          <div class="rider-title-stack">
            <h3>{{ selectedRider.name }}</h3>
            <span class="rider-status-pill"
              >● Sedang Gowes · {{ selectedRider.routeName }}</span
            >
          </div>
          <button
            class="telemetry-close-btn"
            type="button"
            @click="selectedRider = null"
          >
            ✕
          </button>
        </div>

        <div class="telemetry-grid">
          <div class="telemetry-item">
            <span class="telemetry-label">Kecepatan (GPS)</span>
            <span class="telemetry-value highlight"
              >{{ selectedRider.currentSpeedKmh.toFixed(1) }}
              <small>km/h</small></span
            >
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Jarak Sesi</span>
            <span class="telemetry-value"
              >{{ (selectedRider.distanceTraveledMeters / 1000).toFixed(1) }}
              <small>km</small></span
            >
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Waktu Gowes</span>
            <span class="telemetry-value">{{
              formatDuration(selectedRider.movingSeconds)
            }}</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Elevasi (GPS)</span>
            <span class="telemetry-value"
              >{{ selectedRider.currentAltitudeMeters }}
              <small>mdpl</small></span
            >
          </div>
        </div>

        <div class="telemetry-bike-banner">
          <div class="telemetry-bike-icon">🚲</div>
          <div class="telemetry-bike-info">
            <span class="telemetry-bike-label">Sepeda Terpasang</span>
            <span class="telemetry-bike-name">{{
              selectedRider.bikeModel
            }}</span>
          </div>
        </div>

        <div class="telemetry-footer-actions">
          <button
            class="telemetry-action-btn"
            :class="{ 'telemetry-action-btn--active': isFollowCamera }"
            type="button"
            @click="isFollowCamera = !isFollowCamera"
          >
            🎥 {{ isFollowCamera ? 'Lepas Kamera' : 'Ikuti Goweser Ini' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.explore-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
}

.explore-map {
  width: 100%;
  height: 100%;
  min-height: 100%;
}

.explore-map--fallback {
  display: block;
  border: 0;
  background: #ede4d2;
}

/* ═════════════════════════════════════════════════════════════
   MAP HUD STACK (Floating Controls on Middle Right)
   ═════════════════════════════════════════════════════════════ */
.map-hud-stack {
  position: absolute;
  top: 5.6rem;
  right: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  z-index: 25;
}

.hud-simulation-controls {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-top: 0.35rem;
  border-top: 1px dashed rgb(23 32 42 / 15%);
}

.map-hud-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 95%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgb(23 32 42 / 12%);
  color: var(--color-ink);
  cursor: pointer;
  box-shadow: 0 4px 14px rgb(0 0 0 / 14%);
  transition:
    transform 100ms ease,
    background-color 140ms ease;
  user-select: none;
}

.map-hud-btn:active {
  transform: scale(0.92);
}

.map-hud-btn--active {
  background: var(--color-chain-lime);
  color: var(--color-ink);
  border-color: var(--color-ink);
  box-shadow: 0 4px 14px rgb(201 243 106 / 40%);
}

.hud-main-text {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 900;
  line-height: 1;
}

.hud-sub-label {
  font-size: 0.52rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  opacity: 0.75;
  margin-top: 0.1rem;
}

/* ═════════════════════════════════════════════════════════════
   RIDER TELEMETRY MODAL CARD
   ═════════════════════════════════════════════════════════════ */
.rider-telemetry-backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 35%);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: grid;
  place-content: center;
  padding: 1rem;
}

.rider-telemetry-card {
  width: 21rem;
  max-width: calc(100vw - 2rem);
  background: var(--color-white);
  border-radius: 1.25rem;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 16px 40px rgb(0 0 0 / 25%);
  padding: 1.15rem;
  display: grid;
  gap: 0.85rem;
  animation: telemetry-pop 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes telemetry-pop {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.telemetry-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.rider-avatar-large {
  font-size: 1.8rem;
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-content: center;
  background: var(--color-sand);
  border-radius: 0.75rem;
  border: 1px solid var(--color-ink);
}

.rider-title-stack {
  flex: 1;
  overflow: hidden;
}

.rider-title-stack h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 850;
  color: var(--color-ink);
}

.rider-status-pill {
  font-size: 0.65rem;
  font-weight: 800;
  color: #16a34a;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.telemetry-close-btn {
  border: none;
  background: var(--color-sand);
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  cursor: pointer;
  font-weight: 850;
}

.telemetry-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.telemetry-item {
  background: rgb(237 228 210 / 45%);
  padding: 0.55rem 0.65rem;
  border-radius: 0.65rem;
  border: 1px solid rgb(23 32 42 / 08%);
  display: flex;
  flex-direction: column;
}

.telemetry-label {
  font-size: 0.62rem;
  font-weight: 800;
  color: var(--color-asphalt);
  text-transform: uppercase;
  letter-spacing: -0.01em;
}

.telemetry-value {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--color-ink);
}

.telemetry-value.highlight {
  color: #0284c7;
}

.telemetry-bike-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: rgb(201 243 106 / 25%);
  border: 1px dashed var(--color-ink);
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
}

.telemetry-bike-icon {
  font-size: 1.2rem;
}

.telemetry-bike-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.telemetry-bike-label {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--color-asphalt);
  text-transform: uppercase;
}

.telemetry-bike-name {
  font-size: 0.8rem;
  font-weight: 850;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.telemetry-action-btn {
  width: 100%;
  padding: 0.6rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-ink);
  background: var(--color-sand);
  color: var(--color-ink);
  font-size: 0.8rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
}

.telemetry-action-btn--active {
  background: var(--color-chain-lime);
}
</style>
