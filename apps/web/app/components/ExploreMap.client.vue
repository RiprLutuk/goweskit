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
}>();

const emit = defineEmits<{
  select: [selection: { kind: 'place' | 'route'; id: string }];
  mapError: [];
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
let map: MapLibreMap | null = null;
let mapLoaded = false;

type MapTheme = 'streets' | 'satellite' | 'topo';
const currentTheme = ref<MapTheme>('streets');
const is3D = ref(false);

const STREETS_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

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

/**
 * Chaikin's corner smoothing algorithm
 * Turns discrete waypoints into continuous, silky-smooth curved lines
 */
function smoothLineCoordinates(
  coords: [number, number][],
  iterations = 3,
): [number, number][] {
  if (coords.length <= 2) return coords;
  let current: [number, number][] = coords;
  for (let iter = 0; iter < iterations; iter++) {
    const first = current[0];
    const last = current[current.length - 1];
    if (!first || !last) break;
    const smoothed: [number, number][] = [first];
    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];
      if (!p0 || !p1) continue;
      const q: [number, number] = [
        0.75 * p0[0] + 0.25 * p1[0],
        0.75 * p0[1] + 0.25 * p1[1],
      ];
      const r: [number, number] = [
        0.25 * p0[0] + 0.75 * p1[0],
        0.25 * p0[1] + 0.75 * p1[1],
      ];
      smoothed.push(q, r);
    }
    smoothed.push(last);
    current = smoothed;
  }
  return current;
}

function placeGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.places.map((place) => ({
      type: 'Feature' as const,
      properties: {
        id: place.id,
        name: place.name.replace(/^Demo\s+/i, ''),
        type: place.type,
        distanceMeters: place.distanceMeters,
        selected: place.id === props.selectedId,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [place.coordinate.longitude, place.coordinate.latitude],
      },
    })),
  };
}

function routeGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.routes.map((route) => ({
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
        coordinates: smoothLineCoordinates(
          route.geometry.coordinates as [number, number][],
          3,
        ),
      },
    })),
  };
}

function routeEndpointsGeoJson() {
  const features: Array<{
    type: 'Feature';
    properties: {
      id: string;
      role: 'start' | 'end';
      name: string;
      selected: boolean;
    };
    geometry: { type: 'Point'; coordinates: [number, number] };
  }> = [];

  for (const route of props.routes) {
    const coords = route.geometry.coordinates;
    if (coords.length > 0) {
      features.push({
        type: 'Feature',
        properties: {
          id: route.id,
          role: 'start',
          name: `${route.name.replace(/^Demo\s+/i, '')} (Start)`,
          selected: route.id === props.selectedId,
        },
        geometry: {
          type: 'Point',
          coordinates: coords[0] as [number, number],
        },
      });
      if (coords.length > 1) {
        features.push({
          type: 'Feature',
          properties: {
            id: route.id,
            role: 'end',
            name: `${route.name.replace(/^Demo\s+/i, '')} (Finish)`,
            selected: route.id === props.selectedId,
          },
          geometry: {
            type: 'Point',
            coordinates: coords[coords.length - 1] as [number, number],
          },
        });
      }
    }
  }

  return {
    type: 'FeatureCollection' as const,
    features,
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

function updateSource(
  id: string,
  data:
    | ReturnType<typeof placeGeoJson>
    | ReturnType<typeof routeGeoJson>
    | ReturnType<typeof routeEndpointsGeoJson>
    | ReturnType<typeof userGeoJson>,
): void {
  if (!mapLoaded || map === null) return;
  const source = map.getSource(id) as GeoJSONSource | undefined;
  source?.setData(data);
}

function updateData(): void {
  updateSource('goweskit-places', placeGeoJson());
  updateSource('goweskit-routes', routeGeoJson());
  updateSource('goweskit-route-endpoints', routeEndpointsGeoJson());
  updateSource('goweskit-user', userGeoJson());
}

function addGowesKitLayers(): void {
  if (!map) return;

  // 1. Subtle Glow Under Selected Route
  if (!map.getSource('goweskit-routes')) {
    map.addSource('goweskit-routes', {
      type: 'geojson',
      data: routeGeoJson(),
    });
  }

  if (!map.getLayer('goweskit-route-casing')) {
    map.addLayer({
      id: 'goweskit-route-casing',
      type: 'line',
      source: 'goweskit-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#0f172a',
        'line-width': ['case', ['get', 'selected'], 5.5, 0],
        'line-opacity': ['case', ['get', 'selected'], 0.45, 0],
      },
    });
  }

  // 2. Crisp & Strava-Style Vibrant Cycling Route Line
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
          '#059669',
          'gravel',
          '#d97706',
          'road',
          '#0284c7',
          '#e11d48',
        ],
        'line-width': ['case', ['get', 'selected'], 3.8, 2.6],
        'line-opacity': 0.95,
      },
    });
  }

  // 3. Compact Start & Finish Markers
  if (!map.getSource('goweskit-route-endpoints')) {
    map.addSource('goweskit-route-endpoints', {
      type: 'geojson',
      data: routeEndpointsGeoJson(),
    });
  }

  if (!map.getLayer('goweskit-route-endpoints-layer')) {
    map.addLayer({
      id: 'goweskit-route-endpoints-layer',
      type: 'circle',
      source: 'goweskit-route-endpoints',
      paint: {
        'circle-radius': ['case', ['get', 'selected'], 5.5, 4],
        'circle-color': [
          'match',
          ['get', 'role'],
          'start',
          '#10b981',
          '#ef4444',
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    });
  }

  // 4. Places & Amenities Points
  if (!map.getSource('goweskit-places')) {
    map.addSource('goweskit-places', {
      type: 'geojson',
      data: placeGeoJson(),
    });
  }

  if (!map.getLayer('goweskit-place-points')) {
    map.addLayer({
      id: 'goweskit-place-points',
      type: 'circle',
      source: 'goweskit-places',
      paint: {
        'circle-radius': ['case', ['get', 'selected'], 8.5, 6],
        'circle-color': [
          'match',
          ['get', 'type'],
          'workshop',
          '#84cc16',
          'store',
          '#38bdf8',
          'water',
          '#06b6d4',
          'coffee',
          '#f59e0b',
          'trailhead',
          '#10b981',
          'bike_park',
          '#f43f5e',
          '#cbd5e1',
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': ['case', ['get', 'selected'], 2.5, 1.5],
      },
    });
  }

  // 5. User Location Point
  if (!map.getSource('goweskit-user')) {
    map.addSource('goweskit-user', {
      type: 'geojson',
      data: userGeoJson(),
    });
  }

  if (!map.getLayer('goweskit-user-point')) {
    map.addLayer({
      id: 'goweskit-user-point',
      type: 'circle',
      source: 'goweskit-user',
      paint: {
        'circle-radius': 7.5,
        'circle-color': '#3b82f6',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2.5,
      },
    });
  }

  // Click & Hover
  map.off('click', 'goweskit-place-points', onPlaceClick);
  map.on('click', 'goweskit-place-points', onPlaceClick);

  map.off('click', 'goweskit-route-lines', onRouteClick);
  map.on('click', 'goweskit-route-lines', onRouteClick);

  for (const layer of ['goweskit-place-points', 'goweskit-route-lines']) {
    map.on('mouseenter', layer, () => {
      if (map !== null) map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layer, () => {
      if (map !== null) map.getCanvas().style.cursor = '';
    });
  }
}

function onPlaceClick(event: { features?: Array<{ properties?: { id?: unknown } }> }): void {
  const id = event.features?.[0]?.properties?.id;
  if (typeof id === 'string') selectFeature('place', id);
}

function onRouteClick(event: { features?: Array<{ properties?: { id?: unknown } }> }): void {
  const id = event.features?.[0]?.properties?.id;
  if (typeof id === 'string') selectFeature('route', id);
}

function switchTheme(theme: MapTheme): void {
  currentTheme.value = theme;
  if (!map) return;

  const style =
    theme === 'satellite'
      ? SATELLITE_STYLE
      : theme === 'topo'
        ? TOPO_STYLE
        : STREETS_STYLE;

  map.setStyle(style);
  map.once('styledata', () => {
    addGowesKitLayers();
    updateData();
  });
}

function cycleTheme(): void {
  const themes: MapTheme[] = ['streets', 'satellite', 'topo'];
  const nextIdx = (themes.indexOf(currentTheme.value) + 1) % themes.length;
  const nextTheme = themes[nextIdx] ?? 'streets';
  switchTheme(nextTheme);
}

function toggle3D(): void {
  is3D.value = !is3D.value;
  if (!map) return;
  map.easeTo({
    pitch: is3D.value ? 45 : 0,
    bearing: is3D.value ? -10 : 0,
    duration: 500,
  });
}

function fitToResults(): void {
  if (!mapLoaded || map === null) return;
  const bounds = new LngLatBounds();
  bounds.extend([props.center.longitude, props.center.latitude]);
  for (const place of props.places) {
    bounds.extend([place.coordinate.longitude, place.coordinate.latitude]);
  }
  for (const route of props.routes) {
    for (const coordinate of route.geometry.coordinates) {
      bounds.extend(coordinate);
    }
  }

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  map.fitBounds(bounds, {
    padding: { top: 80, bottom: 220, left: 30, right: 30 },
    maxZoom: 14.5,
    duration: reduceMotion ? 0 : 500,
  });
}

function selectFeature(kind: 'place' | 'route', id: unknown): void {
  if (typeof id === 'string') emit('select', { kind, id });
}

onMounted(async () => {
  await nextTick();
  if (mapContainer.value === null) {
    emit('mapError');
    return;
  }

  try {
    map = new MapLibreMap({
      container: mapContainer.value,
      style: STREETS_STYLE,
      center: [props.center.longitude, props.center.latitude],
      zoom: 12,
      pitch: 0,
      bearing: 0,
      maplibreLogo: false,
      canvasContextAttributes: { antialias: true },
    });
  } catch {
    emit('mapError');
    return;
  }

  map.addControl(new NavigationControl({ showCompass: true }), 'bottom-right');

  map.on('load', () => {
    if (map === null) return;
    mapLoaded = true;
    addGowesKitLayers();
    fitToResults();
  });

  map.on('error', () => emit('mapError'));

  if (window.ResizeObserver && mapContainer.value) {
    const resizeObserver = new ResizeObserver(() => {
      map?.resize();
    });
    resizeObserver.observe(mapContainer.value);
  }
});

watch(
  () => [props.places, props.routes, props.center],
  () => {
    updateData();
    fitToResults();
  },
);

watch(
  () => [props.selectedId, props.userLocation],
  () => updateData(),
);

onBeforeUnmount(() => {
  map?.remove();
  map = null;
  mapLoaded = false;
});
</script>

<template>
  <div class="explore-map-container">
    <div
      ref="mapContainer"
      class="explore-map"
      role="region"
      aria-label="Peta Rute &amp; Bengkel Gowes"
    />

    <!-- Vertical Floating Stack on the Middle-Right (Apple Maps Style) -->
    <div class="map-floating-stack">
      <!-- 1. Map Theme Cycle Button -->
      <button
        class="map-stack-btn"
        type="button"
        :title="`Gaya Peta: ${currentTheme}`"
        @click="cycleTheme"
      >
        {{ currentTheme === 'streets' ? '🗺️' : (currentTheme === 'satellite' ? '🛰️' : '⛰️') }}
      </button>

      <!-- 2. 3D / 2D Perspective Toggle -->
      <button
        class="map-stack-btn"
        :class="{ 'map-stack-btn--active': is3D }"
        type="button"
        title="Ubah Sudut Pandang 3D/2D"
        @click="toggle3D"
      >
        {{ is3D ? '3D' : '2D' }}
      </button>
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

/* Native Floating Vertical Stack (Middle Right) */
.map-floating-stack {
  position: absolute;
  top: 5.6rem;
  right: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  z-index: 15;
}

.map-stack-btn {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 50%;
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgb(23 32 42 / 12%);
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 14px rgb(0 0 0 / 14%);
  transition: transform 90ms ease, background-color 120ms ease;
}

.map-stack-btn:active {
  transform: scale(0.92);
}

.map-stack-btn--active {
  background: var(--color-chain-lime);
  color: var(--color-ink);
  border-color: var(--color-ink);
}
</style>
