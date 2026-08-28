<script setup lang="ts">
import {
  VERIFICATION_STATUSES,
  type Coordinate,
  type NearbyCommunitiesResponse,
  type NearbyCommunity,
  type NearbyEvent,
  type NearbyEventsResponse,
} from '@goweskit/contracts';

const BANDUNG_CENTER: Coordinate = {
  longitude: 107.6191,
  latitude: -6.9175,
};

const api = useApi();
const center = ref<Coordinate>(BANDUNG_CENTER);
const centerLabel = ref('Bandung Area');
const radiusKm = ref(15);
const bicycleType = ref('all');
const verificationStatus = ref('all');
const communities = ref<NearbyCommunity[]>([]);
const events = ref<NearbyEvent[]>([]);
const loading = ref(true);
const locating = ref(false);
const errorMessage = ref('');
const locationMessage = ref('');

async function loadDirectory(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  const commonFilters = {
    center: center.value,
    radiusKm: radiusKm.value,
    bicycleTypes: bicycleType.value === 'all' ? undefined : [bicycleType.value],
  };
  try {
    const [communityResponse, eventResponse] = await Promise.all([
      api<NearbyCommunitiesResponse>('/communities/nearby', {
        method: 'POST',
        body: {
          ...commonFilters,
          verificationStatus:
            verificationStatus.value === 'all'
              ? undefined
              : verificationStatus.value,
        },
      }),
      api<NearbyEventsResponse>('/events/nearby', {
        method: 'POST',
        body: commonFilters,
      }),
    ]);
    communities.value = communityResponse.communities;
    events.value = eventResponse.events;
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
      center.value = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      };
      centerLabel.value = 'Your one-time location';
      locating.value = false;
      locationMessage.value =
        'Used for this search only. Your exact location is not published.';
      void loadDirectory();
    },
    () => {
      locating.value = false;
      locationMessage.value =
        'Lokasi tidak dapat diakses. Menampilkan komunitas area Bandung.';
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
  );
}

function resetLocation(): void {
  center.value = BANDUNG_CENTER;
  centerLabel.value = 'Bandung Area';
  locationMessage.value = 'Menampilkan komunitas dan event di Bandung.';
  void loadDirectory();
}

onMounted(loadDirectory);
</script>

<template>
  <div class="page-stack community-page">
    <header class="page-heading community-heading">
      <span class="status-chip status-chip--coral">Ride together</span>
      <h1>Find people who ride like you do.</h1>
      <p>
        Browse cycling communities and scheduled rides nearby. Joining a
        community never exposes your live location.
      </p>
      <div class="action-row">
        <NuxtLink class="button button--secondary" to="/community/reputation">
          My contributor reputation
        </NuxtLink>
      </div>
    </header>

    <section class="community-search" aria-labelledby="community-search-title">
      <div class="community-search__heading">
        <div>
          <p class="section-heading__eyebrow">Nearby directory</p>
          <h2 id="community-search-title">Search from {{ centerLabel }}</h2>
        </div>
        <span class="count-chip">{{ communities.length }}</span>
      </div>

      <div class="location-strip">
        <p>
          <strong>⌖ Privacy first.</strong> Location is requested only when you
          press the button.
        </p>
        <div class="location-strip__actions">
          <button
            class="button button--primary"
            type="button"
            :disabled="locating"
            @click="useMyLocation"
          >
            {{ locating ? 'Finding you…' : 'Use my location once' }}
          </button>
          <button class="text-button" type="button" @click="resetLocation">
            Reset ke Area Bandung
          </button>
        </div>
        <p v-if="locationMessage" class="location-message" role="status">
          {{ locationMessage }}
        </p>
      </div>

      <form class="community-filter-form" @submit.prevent="loadDirectory">
        <label>
          Radius
          <select v-model="radiusKm">
            <option :value="5">5 km</option>
            <option :value="10">10 km</option>
            <option :value="15">15 km</option>
            <option :value="25">25 km</option>
            <option :value="50">50 km maximum</option>
          </select>
        </label>
        <label>
          Bicycle type
          <select v-model="bicycleType">
            <option value="all">Any bicycle</option>
            <option value="mtb_hardtail">MTB Hardtail</option>
            <option value="folding">Folding Bike</option>
            <option value="road">Road Bike</option>
            <option value="gravel">Gravel Bike</option>
          </select>
        </label>
        <label>
          Verification
          <select v-model="verificationStatus">
            <option value="all">Any status</option>
            <option
              v-for="status in VERIFICATION_STATUSES"
              :key="status"
              :value="status"
            >
              {{ status.replaceAll('_', ' ') }}
            </option>
          </select>
        </label>
        <button
          class="button button--primary"
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Searching…' : 'Apply filters' }}
        </button>
      </form>
    </section>

    <p v-if="loading" class="state-card" role="status">
      Loading nearby communities and rides…
    </p>
    <div
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button
        class="button button--secondary"
        type="button"
        @click="loadDirectory"
      >
        Try again
      </button>
    </div>
    <template v-else>
      <section aria-labelledby="communities-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">People and places</p>
            <h2 id="communities-title">Communities near you</h2>
          </div>
          <span class="count-chip">{{ communities.length }}</span>
        </div>
        <p v-if="communities.length === 0" class="state-card">
          No communities match these filters yet. Try a wider radius or another
          bicycle type.
        </p>
        <div v-else class="community-grid">
          <CommunityCard
            v-for="community in communities"
            :key="community.id"
            :community="community"
          />
        </div>
      </section>

      <section aria-labelledby="nearby-rides-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Next on the calendar</p>
            <h2 id="nearby-rides-title">Nearby rides</h2>
          </div>
          <span class="count-chip count-chip--coral">{{ events.length }}</span>
        </div>
        <p v-if="events.length === 0" class="state-card">
          No scheduled public rides match this search. Community detail pages
          may have members-only rides.
        </p>
        <div v-else class="ride-grid">
          <RideEventCard
            v-for="event in events"
            :key="event.id"
            :event="event"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.status-chip--coral,
.count-chip--coral {
  background: var(--color-coral);
}
.community-heading h1 {
  max-width: 100%;
}
.community-search {
  padding: 1.2rem;
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: rgb(255 255 255 / 88%);
  box-shadow: var(--shadow-card);
}
.community-search__heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}
.community-search__heading h2 {
  margin: 0.25rem 0 0;
  letter-spacing: -0.035em;
}
.location-strip {
  display: grid;
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgb(142 221 244 / 20%);
  gap: 0.75rem;
}
.location-strip p {
  margin: 0;
  color: var(--color-asphalt);
  line-height: 1.5;
}
.location-strip__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.location-message {
  font-size: 0.8rem;
}
.community-filter-form {
  display: grid;
  margin-top: 1rem;
  gap: 0.85rem;
}
.community-filter-form label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 800;
}
.community-filter-form select {
  width: 100%;
  min-height: 2.9rem;
  padding: 0.65rem;
  border: 1px solid #a7b0b8;
  border-radius: 0.75rem;
  background: var(--color-white);
  color: var(--color-ink);
  font: inherit;
  text-transform: capitalize;
}
.community-filter-form .button {
  align-self: end;
}
.community-grid,
.ride-grid {
  display: grid;
  gap: 1rem;
}
.state-card--error p {
  margin-top: 0;
}
@media (min-width: 48rem) {
  .community-search {
    padding: 1.5rem;
  }
  .community-filter-form {
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  }
  .community-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ride-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto;
  }
}
</style>
