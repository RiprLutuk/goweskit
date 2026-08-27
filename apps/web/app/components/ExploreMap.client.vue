<script setup lang="ts">
import type { Coordinate, NearbyPlace, NearbyRoute } from '@goweskit/contracts';
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  type GeoJSONSource,
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

function placeGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.places.map((place) => ({
      type: 'Feature' as const,
      properties: {
        id: place.id,
        type: place.type,
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
        routeType: route.routeType,
        selected: route.id === props.selectedId,
      },
      geometry: route.geometry,
    })),
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
    | ReturnType<typeof userGeoJson>,
): void {
  if (!mapLoaded || map === null) return;
  const source = map.getSource(id) as GeoJSONSource | undefined;
  source?.setData(data);
}

function updateData(): void {
  updateSource('goweskit-places', placeGeoJson());
  updateSource('goweskit-routes', routeGeoJson());
  updateSource('goweskit-user', userGeoJson());
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
    padding: 52,
    maxZoom: 14,
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
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [props.center.longitude, props.center.latitude],
      zoom: 11,
      maplibreLogo: true,
      canvasContextAttributes: { antialias: true },
    });
  } catch {
    emit('mapError');
    return;
  }
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

  map.on('load', () => {
    if (map === null) return;
    mapLoaded = true;
    map.addSource('goweskit-routes', {
      type: 'geojson',
      data: routeGeoJson(),
    });
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
          '#40505f',
          'gravel',
          '#d19a2c',
          'road',
          '#2988a5',
          '#ff8c75',
        ],
        'line-width': ['case', ['get', 'selected'], 7, 4],
        'line-opacity': ['case', ['get', 'selected'], 1, 0.75],
      },
    });

    map.addSource('goweskit-places', {
      type: 'geojson',
      data: placeGeoJson(),
    });
    map.addLayer({
      id: 'goweskit-place-points',
      type: 'circle',
      source: 'goweskit-places',
      paint: {
        'circle-radius': ['case', ['get', 'selected'], 11, 8],
        'circle-color': [
          'match',
          ['get', 'type'],
          'workshop',
          '#c9f36a',
          'store',
          '#8eddf4',
          'water',
          '#3d9fc1',
          'coffee',
          '#d19a2c',
          'trailhead',
          '#40505f',
          'bike_park',
          '#ff8c75',
          '#ede4d2',
        ],
        'circle-stroke-color': '#17202a',
        'circle-stroke-width': ['case', ['get', 'selected'], 4, 2],
      },
    });

    map.addSource('goweskit-user', {
      type: 'geojson',
      data: userGeoJson(),
    });
    map.addLayer({
      id: 'goweskit-user-point',
      type: 'circle',
      source: 'goweskit-user',
      paint: {
        'circle-radius': 7,
        'circle-color': '#ffffff',
        'circle-stroke-color': '#17202a',
        'circle-stroke-width': 4,
      },
    });

    map.on('click', 'goweskit-place-points', (event) => {
      selectFeature('place', event.features?.[0]?.properties.id);
    });
    map.on('click', 'goweskit-route-lines', (event) => {
      selectFeature('route', event.features?.[0]?.properties.id);
    });
    for (const layer of ['goweskit-place-points', 'goweskit-route-lines']) {
      map.on('mouseenter', layer, () => {
        if (map !== null) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layer, () => {
        if (map !== null) map.getCanvas().style.cursor = '';
      });
    }
    fitToResults();
  });
  map.on('error', () => emit('mapError'));
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
  <div
    ref="mapContainer"
    class="explore-map"
    role="region"
    aria-label="Map of nearby cycling places and routes"
  />
</template>
