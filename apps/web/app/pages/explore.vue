<script setup lang="ts">
import {
  FRESHNESS_STATUSES,
  PLACE_TYPES,
  ROUTE_DIFFICULTIES,
  ROUTE_SURFACES,
  ROUTE_TYPES,
  VERIFICATION_STATUSES,
  type Coordinate,
  type NearbyExploreResponse,
  type NearbyPlace,
  type NearbyRoute,
} from '@goweskit/contracts';

type ExploreItem = NearbyPlace | NearbyRoute;

const BANDUNG_CENTER: Coordinate = {
  longitude: 107.6191,
  latitude: -6.9175,
};

const api = useApi();
const center = ref<Coordinate>(BANDUNG_CENTER);
const userLocation = ref<Coordinate | null>(null);
const centerLabel = ref('Bandung demo area');
const radiusKm = ref(15);
const category = ref('all');
const bikeType = ref('all');
const difficulty = ref('all');
const surface = ref('all');
const verificationStatus = ref('all');
const freshness = ref('all');
const beginnerOnly = ref(false);
const places = ref<NearbyPlace[]>([]);
const routes = ref<NearbyRoute[]>([]);
const selectedId = ref<string | null>(null);
const loading = ref(true);
const locating = ref(false);
const errorMessage = ref('');
const locationMessage = ref('');
const mapError = ref(false);

const allItems = computed<ExploreItem[]>(() => [
  ...places.value,
  ...routes.value,
]);
const selectedItem = computed<ExploreItem | null>(
  () => allItems.value.find(({ id }) => id === selectedId.value) ?? null,
);

function optionalFilter(value: string): string | undefined {
  return value === 'all' ? undefined : value;
}

async function loadNearby(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  selectedId.value = null;
  try {
    const selectedPlaceType = PLACE_TYPES.find(
      (value) => value === category.value,
    );
    const selectedRouteType = ROUTE_TYPES.find(
      (value) => value === category.value,
    );
    const response = await api<NearbyExploreResponse>('/explore/nearby', {
      method: 'POST',
      body: {
        center: center.value,
        radiusKm: radiusKm.value,
        placeTypes:
          selectedPlaceType === undefined ? undefined : [selectedPlaceType],
        routeTypes:
          selectedRouteType === undefined ? undefined : [selectedRouteType],
        bikeType: optionalFilter(bikeType.value),
        difficulty: optionalFilter(difficulty.value),
        surface: optionalFilter(surface.value),
        verificationStatus: optionalFilter(verificationStatus.value),
        freshness: optionalFilter(freshness.value),
        beginnerFriendly: beginnerOnly.value ? true : undefined,
      },
    });
    places.value =
      category.value === 'routes' || selectedRouteType !== undefined
        ? []
        : response.places;
    routes.value =
      category.value === 'places' || selectedPlaceType !== undefined
        ? []
        : response.routes;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function useMyLocation(): void {
  locationMessage.value = '';
  if (!('geolocation' in navigator)) {
    locationMessage.value = 'This browser does not provide location access.';
    return;
  }

  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coordinate = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      };
      userLocation.value = coordinate;
      center.value = coordinate;
      centerLabel.value = 'Your one-time location';
      locating.value = false;
      locationMessage.value =
        'Location used for this search only. GowesKit does not save or share it.';
      void loadNearby();
    },
    () => {
      locating.value = false;
      locationMessage.value =
        'Location was not available. The Bandung demo area is still usable.';
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
  );
}

function resetToDemoArea(): void {
  center.value = BANDUNG_CENTER;
  userLocation.value = null;
  centerLabel.value = 'Bandung demo area';
  locationMessage.value = 'Showing seeded demo data around Bandung.';
  void loadNearby();
}

function selectItem(selection: { kind: 'place' | 'route'; id: string }): void {
  selectedId.value = selection.id;
}

function formatDistance(meters: number): string {
  return meters < 1000
    ? `${String(Math.round(meters))} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function typeLabel(item: ExploreItem): string {
  return (item.kind === 'place' ? item.type : item.routeType).replaceAll(
    '_',
    ' ',
  );
}

function itemDistance(item: ExploreItem): number {
  return item.kind === 'place'
    ? item.distanceMeters
    : item.distanceFromUserMeters;
}

function applyQuickPreset(preset: 'workshop' | 'water' | 'trail' | 'coffee'): void {
  category.value = preset;
  void loadNearby();
}

onMounted(loadNearby);
</script>

<template>
  <div class="page-stack explore-page">
    <header class="page-heading explore-heading">
      <span class="status-chip status-chip--sky">Explore Bandung · demo</span>
      <h1>Find a ride, workshop, or good place to pause.</h1>
      <p>
        Nearby results use PostGIS and favor verified, recently confirmed data.
        Seeded locations and route lines are demonstrations, not turn-by-turn navigation.
      </p>
    </header>

    <div class="privacy-strip">
      <span aria-hidden="true">⌖</span>
      <p>
        <strong>Your exact location stays private.</strong> Location access only
        happens after you explicitly press the button, is used once for nearby radius search, and is never published.
      </p>
    </div>

    <!-- Quick Preset Filter Chips -->
    <div class="explore-presets-row">
      <span class="presets-label">Quick filter:</span>
      <button class="preset-pill" type="button" @click="applyQuickPreset('workshop')">
        🔧 Workshops
      </button>
      <button class="preset-pill" type="button" @click="applyQuickPreset('water')">
        💧 Water Refills
      </button>
      <button class="preset-pill" type="button" @click="applyQuickPreset('coffee')">
        ☕ Coffee Stops
      </button>
      <button class="preset-pill" type="button" @click="category = 'routes'; loadNearby()">
        ⛰️ Routes Only
      </button>
      <button class="preset-pill" type="button" @click="category = 'all'; loadNearby()">
        ✨ Show All
      </button>
    </div>

    <div class="explore-layout">
      <aside class="explore-filters" aria-labelledby="explore-filter-title">
        <div class="section-heading explore-filters__heading">
          <div>
            <p class="section-heading__eyebrow">Search area</p>
            <h2 id="explore-filter-title">Tune the map</h2>
          </div>
          <span class="count-chip">{{ places.length + routes.length }}</span>
        </div>

        <div class="location-actions">
          <button
            class="button button--primary"
            type="button"
            :disabled="locating"
            @click="useMyLocation"
          >
            {{ locating ? 'Finding you…' : '⌖ Use my location once' }}
          </button>
          <button class="text-button" type="button" @click="resetToDemoArea">
            Reset to Bandung demo
          </button>
        </div>
        <p class="area-label">⌖ {{ centerLabel }}</p>
        <p v-if="locationMessage" class="location-message" role="status">
          {{ locationMessage }}
        </p>

        <form class="explore-filter-form" @submit.prevent="loadNearby">
          <label for="explore-radius">
            Radius
            <select id="explore-radius" v-model="radiusKm">
              <option :value="5">5 km</option>
              <option :value="10">10 km</option>
              <option :value="15">15 km</option>
              <option :value="25">25 km</option>
              <option :value="50">50 km maximum</option>
            </select>
          </label>

          <label for="explore-category">
            Map layer
            <select id="explore-category" v-model="category">
              <option value="all">All places and routes</option>
              <option value="places">All places</option>
              <option value="routes">All routes</option>
              <optgroup label="Places">
                <option
                  v-for="value in PLACE_TYPES"
                  :key="value"
                  :value="value"
                >
                  {{ value.replaceAll('_', ' ') }}
                </option>
              </optgroup>
              <optgroup label="Routes">
                <option
                  v-for="value in ROUTE_TYPES"
                  :key="value"
                  :value="value"
                >
                  {{ value }} route
                </option>
              </optgroup>
            </select>
          </label>

          <label for="explore-bike-type">
            Bicycle type
            <select id="explore-bike-type" v-model="bikeType">
              <option value="all">Any bicycle</option>
              <option value="mtb_hardtail">MTB Hardtail</option>
              <option value="folding">Folding Bike</option>
              <option value="road">Road Bike</option>
              <option value="gravel">Gravel Bike</option>
            </select>
          </label>

          <div class="filter-pair">
            <label for="explore-difficulty">
              Difficulty
              <select id="explore-difficulty" v-model="difficulty">
                <option value="all">Any</option>
                <option
                  v-for="value in ROUTE_DIFFICULTIES"
                  :key="value"
                  :value="value"
                >
                  {{ value }}
                </option>
              </select>
            </label>
            <label for="explore-surface">
              Surface
              <select id="explore-surface" v-model="surface">
                <option value="all">Any</option>
                <option
                  v-for="value in ROUTE_SURFACES"
                  :key="value"
                  :value="value"
                >
                  {{ value }}
                </option>
              </select>
            </label>
          </div>

          <div class="filter-pair">
            <label for="explore-verification">
              Verification
              <select id="explore-verification" v-model="verificationStatus">
                <option value="all">Any</option>
                <option
                  v-for="value in VERIFICATION_STATUSES"
                  :key="value"
                  :value="value"
                >
                  {{ value.replaceAll('_', ' ') }}
                </option>
              </select>
            </label>
            <label for="explore-freshness">
              Freshness
              <select id="explore-freshness" v-model="freshness">
                <option value="all">Any</option>
                <option
                  v-for="value in FRESHNESS_STATUSES"
                  :key="value"
                  :value="value"
                >
                  {{ value }}
                </option>
              </select>
            </label>
          </div>

          <label class="check-control">
            <input v-model="beginnerOnly" type="checkbox" />
            Beginner-friendly only
          </label>

          <button
            class="button button--primary"
            type="submit"
            :disabled="loading"
          >
            {{ loading ? 'Searching…' : 'Apply filters' }}
          </button>
        </form>
      </aside>

      <section class="explore-results" aria-labelledby="explore-map-title">
        <div class="map-heading">
          <div>
            <p class="section-heading__eyebrow">Nearby now</p>
            <h2 id="explore-map-title">{{ centerLabel }}</h2>
          </div>
          <span>{{ radiusKm }} km radius</span>
        </div>

        <p
          v-if="errorMessage"
          class="state-card state-card--error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <div v-else class="map-frame" :aria-busy="loading">
          <ClientOnly>
            <ExploreMap
              :center="center"
              :places="places"
              :routes="routes"
              :selected-id="selectedId"
              :user-location="userLocation"
              @select="selectItem"
              @map-error="mapError = true"
            />
            <template #fallback>
              <div class="map-fallback">Preparing the cycling map…</div>
            </template>
          </ClientOnly>
          <div class="map-legend" aria-label="Map legend">
            <span><i class="legend-dot legend-dot--place" /> Place</span>
            <span><i class="legend-line" /> Route</span>
            <span v-if="userLocation"
              ><i class="legend-dot legend-dot--you" /> You</span
            >
          </div>
        </div>

        <!-- Selected Item Detail Modal/Card -->
        <article v-if="selectedItem" class="explore-detail">
          <div class="explore-detail__topline">
            <span class="result-type">{{ typeLabel(selectedItem) }}</span>
            <button
              class="text-button"
              type="button"
              @click="selectedId = null"
            >
              ✕ Close
            </button>
          </div>
          <h3>{{ selectedItem.name }}</h3>
          <p>{{ selectedItem.description }}</p>

          <!-- Elevation Profile if Route -->
          <div v-if="selectedItem.kind === 'route'" class="route-elevation-card">
            <strong>Elevation Profile (Climb Preview)</strong>
            <div class="elevation-graph">
              <svg viewBox="0 0 300 80" class="elevation-svg" aria-label="Route elevation profile">
                <path
                  d="M0 65 Q 60 50, 120 40 T 240 20 L 300 15 L 300 80 L 0 80 Z"
                  fill="rgb(142 221 244 / 35%)"
                />
                <path
                  d="M0 65 Q 60 50, 120 40 T 240 20 L 300 15"
                  fill="none"
                  stroke="#2988a5"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <circle cx="0" cy="65" r="4" fill="#17202a" />
                <circle cx="300" cy="15" r="4" fill="#c9f36a" stroke="#17202a" stroke-width="2" />
              </svg>
              <div class="elevation-labels">
                <span>Start: ~760m</span>
                <span>Peak: ~{{ 760 + selectedItem.elevationGainMeters }}m</span>
              </div>
            </div>
          </div>

          <dl class="explore-facts">
            <div>
              <dt>From Search Point</dt>
              <dd>{{ formatDistance(itemDistance(selectedItem)) }}</dd>
            </div>
            <div>
              <dt>Freshness</dt>
              <dd>{{ selectedItem.freshness }}</dd>
            </div>
            <div>
              <dt>Verification</dt>
              <dd>
                {{ selectedItem.verificationStatus.replaceAll('_', ' ') }}
              </dd>
            </div>
            <div v-if="selectedItem.kind === 'route'">
              <dt>Route Distance</dt>
              <dd>
                {{ formatDistance(selectedItem.distanceMeters) }} ·
                {{ selectedItem.elevationGainMeters }} m climbing ·
                {{ selectedItem.difficulty }}
              </dd>
            </div>
            <div v-else>
              <dt>Address</dt>
              <dd>{{ selectedItem.address }}</dd>
            </div>
          </dl>
        </article>

        <!-- Result List Sheet -->
        <div class="result-sheet">
          <div class="result-sheet__handle" aria-hidden="true" />
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Map results</p>
              <h2>Places and routes</h2>
            </div>
            <span class="count-chip">{{ allItems.length }}</span>
          </div>

          <p v-if="loading" class="state-card" role="status">
            Measuring nearby cycling spots…
          </p>
          <p v-else-if="allItems.length === 0" class="state-card">
            No demo results match these filters. Try a wider radius or fewer
            filters.
          </p>
          <div v-else class="explore-card-list">
            <button
              v-for="item in allItems"
              :key="item.id"
              class="explore-card"
              :class="{ 'explore-card--selected': item.id === selectedId }"
              type="button"
              @click="selectItem({ kind: item.kind, id: item.id })"
            >
              <span class="result-type">{{ typeLabel(item) }}</span>
              <strong>{{ item.name }}</strong>
              <span>{{ item.description }}</span>
              <small>
                {{ formatDistance(itemDistance(item)) }} away ·
                {{ item.freshness }} ·
                {{ item.verificationStatus.replaceAll('_', ' ') }}
              </small>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Community Reviews, Hazards & GPX Section -->
    <ExploreContributions :selected-item="selectedItem" />
  </div>
</template>

<style scoped>
.explore-presets-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 0.9rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.presets-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-asphalt);
  margin-right: 0.25rem;
}

.preset-pill {
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.6rem;
  background: var(--color-white);
  color: var(--color-ink);
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 120ms ease;
}

.preset-pill:hover {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

.route-elevation-card {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.9rem;
  background: rgb(237 228 210 / 30%);
  border: 1px solid var(--color-sand);
}

.elevation-graph {
  margin-top: 0.5rem;
}

.elevation-svg {
  width: 100%;
  height: 4.5rem;
  border-radius: 0.5rem;
  background: var(--color-white);
}

.elevation-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  font-family: ui-monospace, monospace;
}
</style>
