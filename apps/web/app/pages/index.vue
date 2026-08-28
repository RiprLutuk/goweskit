<script setup lang="ts">
import type {
  Bike,
  BikeListResponse,
  NearbyEvent,
  NearbyEventsResponse,
  NearbyExploreResponse,
  NearbyPlace,
  NearbyRoute,
} from '@goweskit/contracts';
import {
  formatCommunityDate,
  formatCommunityDistance,
} from '../community-display';

const api = useApi();
const { user, initialized, refresh } = useAuth();

const bikes = ref<Bike[]>([]);
const routes = ref<NearbyRoute[]>([]);
const places = ref<NearbyPlace[]>([]);
const events = ref<NearbyEvent[]>([]);
const loading = ref(true);

const activeBike = computed(() => bikes.value[0] ?? null);
const featuredRoute = computed(() => routes.value[0] ?? null);
const otherRoutes = computed(() => routes.value.slice(1, 6));

// Fallback seed data in case API is offline or returns empty
const fallbackFeaturedRoute = {
  id: 'fallback-tahura',
  name: 'Tahura Gravel Loop',
  description: 'Jalur hutan pinus Dago dengan tanjakan gravel ramah pemula.',
  routeType: 'gravel',
  distanceMeters: 24500,
  elevationGainMeters: 620,
  difficulty: 'moderate',
  surface: 'mixed',
  beginnerFriendly: true,
  verificationStatus: 'community_verified',
};

const fallbackEvents = [
  {
    id: 'fallback-event-1',
    title: 'Sunday Morning Coffee Ride',
    startsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    meetingArea: 'Gedung Sate Bandung',
    difficulty: 'easy',
    participantCount: 14,
    capacity: 25,
    community: { name: 'Bandung Gravel Society' },
    distanceMeters: 2400,
  },
  {
    id: 'fallback-event-2',
    title: 'Dago Giri Hill Climb Challenge',
    startsAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    meetingArea: 'Simpang Dago',
    difficulty: 'hard',
    participantCount: 8,
    capacity: 15,
    community: { name: 'Puncak Climbers Club' },
    distanceMeters: 4100,
  },
];

onMounted(async () => {
  if (!initialized.value) await refresh();

  // Load bikes if logged in
  if (user.value) {
    try {
      bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
    } catch {
      bikes.value = [];
    }
  }

  // Load nearby routes & workshops (Center: Bandung)
  try {
    const exploreRes = await api<NearbyExploreResponse>('/explore/nearby', {
      method: 'POST',
      body: {
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 25,
      },
    });
    routes.value = exploreRes.routes;
    places.value = exploreRes.places;
  } catch {
    routes.value = [];
    places.value = [];
  }

  // Load nearby community events
  try {
    const eventsRes = await api<NearbyEventsResponse>('/events/nearby', {
      method: 'POST',
      body: {
        center: { longitude: 107.6191, latitude: -6.9175 },
        radiusKm: 25,
      },
    });
    events.value = eventsRes.events;
  } catch {
    events.value = [];
  }

  loading.value = false;
});

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}
</script>

<template>
  <div class="native-container">
    <!-- 1. Pure Native Top Greeting Bar -->
    <header class="native-hero-card">
      <div class="native-greeting-row">
        <div class="native-greeting-text">
          <span class="greeting-eyebrow">Gowes Hari Ini</span>
          <h1 class="greeting-title">
            {{ user ? `Halo, ${user.displayName.split(' ')[0]}` : 'Halo, Rider' }} 👋
          </h1>
        </div>
        <NuxtLink class="native-avatar-btn" to="/me" aria-label="Profile">
          {{ user ? user.displayName.charAt(0).toUpperCase() : '👤' }}
        </NuxtLink>
      </div>

      <!-- Compact Guest Callout -->
      <ClientOnly>
        <div v-if="!user" class="native-guest-bar">
          <div class="guest-bar-text">
            <strong>Buka Garasi Pribadi</strong>
            <span>Simpan spek sepeda &amp; cek upgrade</span>
          </div>
          <NuxtLink class="button button--primary button--xs" to="/login">
            Masuk →
          </NuxtLink>
        </div>
      </ClientOnly>
    </header>

    <!-- 2. SECTION: Rute Pilihan Hari Ini -->
    <section class="native-section" aria-labelledby="sec-routes">
      <div class="native-section-head">
        <h2 id="sec-routes" class="native-section-title">Rute Pilihan</h2>
        <NuxtLink class="native-section-link" to="/explore">Lihat Peta →</NuxtLink>
      </div>

      <!-- Featured Hero Route Card -->
      <article class="native-card route-featured-card">
        <div class="card-pills-row">
          <span class="badge badge--lime">
            {{ (featuredRoute || fallbackFeaturedRoute).routeType.toUpperCase() }}
          </span>
          <span class="badge badge--sand">
            {{ (featuredRoute || fallbackFeaturedRoute).surface }}
          </span>
          <span class="verified-indicator">
            <span class="dot-green" /> Verified
          </span>
        </div>

        <div class="route-info-block">
          <h3 class="route-title">{{ (featuredRoute || fallbackFeaturedRoute).name }}</h3>
          <p class="route-desc">{{ (featuredRoute || fallbackFeaturedRoute).description }}</p>
        </div>

        <!-- Metric Grid -->
        <div class="native-metric-grid">
          <div class="metric-item">
            <span class="metric-lbl">JARAK</span>
            <strong class="metric-val">{{ formatKm((featuredRoute || fallbackFeaturedRoute).distanceMeters) }}</strong>
          </div>
          <div class="metric-item">
            <span class="metric-lbl">ELEVASI</span>
            <strong class="metric-val">+{{ (featuredRoute || fallbackFeaturedRoute).elevationGainMeters }}m</strong>
          </div>
          <div class="metric-item">
            <span class="metric-lbl">TINGKAT</span>
            <strong class="metric-val capitalize">{{ (featuredRoute || fallbackFeaturedRoute).difficulty }}</strong>
          </div>
        </div>

        <div class="native-card-actions">
          <NuxtLink class="button button--primary button--sm" to="/explore">
            Buka Track GPX
          </NuxtLink>
          <NuxtLink class="button button--secondary button--sm" to="/safety">
            Safety 🛡️
          </NuxtLink>
        </div>
      </article>

      <!-- Horizontal Swipeable Mini Routes -->
      <div v-if="otherRoutes.length" class="native-h-scroll">
        <NuxtLink
          v-for="r in otherRoutes"
          :key="r.id"
          class="mini-route-pill"
          to="/explore"
        >
          <div class="mini-route-top">
            <span class="badge badge--xs">{{ r.routeType }}</span>
            <span class="mini-difficulty">{{ r.difficulty }}</span>
          </div>
          <strong class="mini-title">{{ r.name }}</strong>
          <span class="mini-stats">{{ formatKm(r.distanceMeters) }} · +{{ r.elevationGainMeters }}m</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 3. SECTION: Event Komunitas Terdekat -->
    <section class="native-section" aria-labelledby="sec-events">
      <div class="native-section-head">
        <h2 id="sec-events" class="native-section-title">Gowes Bareng</h2>
        <NuxtLink class="native-section-link" to="/explore">Semua Event →</NuxtLink>
      </div>

      <div class="native-events-list">
        <NuxtLink
          v-for="evt in (events.length ? events.slice(0, 2) : fallbackEvents)"
          :key="evt.id"
          class="native-card event-card-row"
          to="/explore"
        >
          <div class="event-cal-box" aria-hidden="true">
            <span class="cal-month">{{ new Date(evt.startsAt).toLocaleString('id-ID', { month: 'short' }) }}</span>
            <strong class="cal-day">{{ new Date(evt.startsAt).getDate() }}</strong>
          </div>
          <div class="event-detail-box">
            <div class="event-host-line">
              <span class="host-name">{{ evt.community.name }}</span>
              <span v-if="'distanceMeters' in evt && evt.distanceMeters" class="host-dist">
                {{ formatCommunityDistance(evt.distanceMeters) }}
              </span>
            </div>
            <h3 class="event-title">{{ evt.title }}</h3>
            <p class="event-loc">📍 {{ evt.meetingArea }} · {{ formatCommunityDate(evt.startsAt) }}</p>
            <div class="event-pill-row">
              <span class="badge badge--sky">{{ evt.difficulty }} pace</span>
              <span class="badge badge--sand">👥 {{ evt.participantCount }} riders</span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- 4. SECTION: Garasi & Active Bike -->
    <section class="native-section" aria-labelledby="sec-garage">
      <div class="native-section-head">
        <h2 id="sec-garage" class="native-section-title">Garasi &amp; Spek</h2>
        <ClientOnly>
          <NuxtLink v-if="user && bikes.length" class="native-section-link" to="/garage">
            Garasi ({{ bikes.length }}) →
          </NuxtLink>
        </ClientOnly>
      </div>

      <ClientOnly>
        <!-- Active Bike -->
        <article v-if="user && activeBike" class="native-card bike-card">
          <div class="card-pills-row">
            <span class="badge badge--sky">{{ activeBike.bicycleType.name }}</span>
            <span class="status-ready"><span class="dot-green" /> Siap Gowes</span>
          </div>

          <div class="bike-info">
            <h3 class="bike-name">{{ activeBike.nickname }}</h3>
            <p class="bike-sub">
              {{ [activeBike.brand, activeBike.model, activeBike.modelYear].filter(Boolean).join(' ') || 'Custom Build' }}
            </p>
          </div>

          <div class="bike-specs-tag-row">
            <span class="spec-chip"><strong>{{ activeBike.specs.length }}</strong> spek tercatat</span>
            <span class="spec-chip spec-chip--highlight">100% deterministik</span>
          </div>

          <div class="native-card-actions">
            <NuxtLink class="button button--secondary button--sm" :to="`/garage/${activeBike.id}`">
              Lihat Spek
            </NuxtLink>
            <NuxtLink class="button button--primary button--sm" :to="`/upgrade-lab?bike=${activeBike.id}`">
              Cek Upgrade ⚡
            </NuxtLink>
          </div>
        </article>

        <!-- No Bike yet -->
        <article v-else-if="user" class="native-card empty-card">
          <strong>Garasi siap digunakan</strong>
          <p>Daftarkan sepedamu untuk cek kecocokan part &amp; servis.</p>
          <NuxtLink class="button button--primary button--sm" to="/garage/new">
            + Tambah Sepeda
          </NuxtLink>
        </article>

        <!-- Guest Preview -->
        <article v-else class="native-card guest-bike-card">
          <div class="card-pills-row">
            <span class="badge badge--sky">MTB Hardtail</span>
            <span class="guest-tag">Contoh Spek</span>
          </div>
          <h3 class="bike-name">Si Rimba (29er Boost 148)</h3>
          <p class="bike-sub">Tapered fork, 12×148 Boost, 1×12 Micro Spline.</p>
          <div class="native-card-actions">
            <NuxtLink class="button button--primary button--sm" to="/garage">
              Buka Garasi
            </NuxtLink>
            <NuxtLink class="button button--secondary button--sm" to="/login">
              Masuk
            </NuxtLink>
          </div>
        </article>

        <template #fallback>
          <article class="native-card guest-bike-card">
            <div class="card-pills-row">
              <span class="badge badge--sky">MTB Hardtail</span>
              <span class="guest-tag">Contoh Spek</span>
            </div>
            <h3 class="bike-name">Si Rimba (29er Boost 148)</h3>
            <p class="bike-sub">Tapered fork, 12×148 Boost, 1×12 Micro Spline.</p>
            <div class="native-card-actions">
              <NuxtLink class="button button--primary button--sm" to="/garage">
                Buka Garasi
              </NuxtLink>
              <NuxtLink class="button button--secondary button--sm" to="/login">
                Masuk
              </NuxtLink>
            </div>
          </article>
        </template>
      </ClientOnly>
    </section>

    <!-- 5. TACTILE WORKSHOP TOOLS (4 App Tiles) -->
    <section class="native-section" aria-label="Tools">
      <div class="native-section-head">
        <h2 class="native-section-title">Tools &amp; Utilitas</h2>
      </div>

      <div class="native-tools-grid">
        <NuxtLink class="native-tool-tile tile--upgrade" to="/upgrade-lab">
          <span class="tool-icon">🔬</span>
          <strong>Upgrade Lab</strong>
          <small>Cek part PNP</small>
        </NuxtLink>

        <NuxtLink class="native-tool-tile tile--learn" to="/learn">
          <span class="tool-icon">📖</span>
          <strong>Anatomi</strong>
          <small>Panduan part</small>
        </NuxtLink>

        <NuxtLink class="native-tool-tile tile--safety" to="/safety">
          <span class="tool-icon">🛡️</span>
          <strong>Ride Safety</strong>
          <small>Live tracking</small>
        </NuxtLink>

        <NuxtLink class="native-tool-tile tile--explore" to="/explore">
          <span class="tool-icon">🗺️</span>
          <strong>Bengkel</strong>
          <small>Lokasi sekitar</small>
        </NuxtLink>
      </div>
    </section>

    <!-- 6. SECTION: Solo Safety Quick Action -->
    <section class="native-card safety-native-card" aria-label="Safety">
      <div class="safety-native-row">
        <span class="safety-icon-large">🚨</span>
        <div class="safety-text">
          <strong>Gowes Solo Subuh / Malam?</strong>
          <p>Bagikan snapshot posisi terenkripsi ke kontak terpercaya.</p>
        </div>
      </div>
      <NuxtLink class="button button--primary button--full button--sm" to="/safety">
        Mulai Safety Session 🛡️
      </NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.native-container {
  display: grid;
  gap: 1.15rem;
  max-width: 56rem;
  margin: 0 auto 3rem;
}

@media (min-width: 48rem) {
  .native-container {
    gap: 1.5rem;
    margin: 0 auto 3.5rem;
  }
}

/* 1. Native Top Greeting Header */
.native-hero-card {
  display: grid;
  gap: 0.65rem;
  padding: 1rem 1.15rem;
  border-radius: var(--radius-card);
  border: 1px solid rgb(23 32 42 / 10%);
  background:
    radial-gradient(circle at 90% 10%, rgb(201 243 106 / 45%), transparent 10rem),
    radial-gradient(circle at 10% 90%, rgb(142 221 244 / 30%), transparent 10rem),
    var(--color-white);
  box-shadow: 0 2px 12px rgb(23 32 42 / 4%);
}

.native-greeting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.native-greeting-text {
  display: grid;
  gap: 0.1rem;
}

.greeting-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-asphalt);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.greeting-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  color: var(--color-ink);
  line-height: 1.15;
}

.native-avatar-btn {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 50%;
  background: var(--color-chain-lime);
  border: 1.5px solid var(--color-ink);
  color: var(--color-ink);
  font-weight: 900;
  font-size: 0.95rem;
  text-decoration: none;
}

.native-guest-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  margin-top: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  background: rgb(201 243 106 / 30%);
  border: 1px solid rgb(201 243 106 / 85%);
}

.guest-bar-text {
  display: grid;
  gap: 0.05rem;
}

.guest-bar-text strong {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--color-ink);
}

.guest-bar-text span {
  font-size: 0.7rem;
  color: var(--color-asphalt);
}

.button--xs {
  min-height: 1.9rem;
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 800;
  border-radius: 0.55rem;
}

/* Common Section Styles */
.native-section {
  display: grid;
  gap: 0.55rem;
}

.native-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.2rem;
}

.native-section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.native-section-link {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 0.15rem;
}

/* Common Native Card */
.native-card {
  display: grid;
  gap: 0.65rem;
  padding: 1rem;
  border-radius: var(--radius-card);
  border: 1px solid rgb(23 32 42 / 10%);
  background: var(--color-white);
  box-shadow: 0 2px 12px rgb(23 32 42 / 4%);
}

.card-pills-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
}

.badge--lime {
  background: var(--color-chain-lime);
  color: var(--color-ink);
}

.badge--sand {
  background: rgb(237 228 210 / 70%);
  color: var(--color-asphalt);
}

.badge--sky {
  background: var(--color-sky);
  color: var(--color-ink);
}

.badge--xs {
  font-size: 0.58rem;
  padding: 0.1rem 0.35rem;
}

.verified-indicator,
.status-ready {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #15803d;
}

.dot-green {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: #22c55e;
}

.guest-tag {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

/* Route Featured Card */
.route-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.route-desc {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.native-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  background: rgb(237 228 210 / 35%);
  border: 1px solid var(--color-sand);
}

.metric-item {
  display: grid;
  gap: 0.05rem;
}

.metric-lbl {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.metric-val {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--color-ink);
}

.capitalize {
  text-transform: capitalize;
}

.native-card-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.native-card-actions .button {
  width: 100%;
  min-width: 0;
  padding: 0.45rem 0.35rem;
  font-size: 0.78rem;
  text-align: center;
}

/* Horizontal Scroll Mini Routes */
.native-h-scroll {
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0.15rem 0 0.35rem;
  -webkit-overflow-scrolling: touch;
}

.mini-route-pill {
  flex: 0 0 min(13.5rem, 62vw);
  scroll-snap-align: start;
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  text-decoration: none;
  color: var(--color-ink);
  box-shadow: 0 2px 8px rgb(23 32 42 / 3%);
}

.mini-route-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mini-difficulty {
  font-size: 0.65rem;
  font-weight: 750;
  color: var(--color-asphalt);
  text-transform: capitalize;
}

.mini-title {
  font-size: 0.88rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-stats {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-asphalt);
}

/* Community Events */
.native-events-list {
  display: grid;
  gap: 0.6rem;
}

.event-card-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0.85rem;
  text-decoration: none;
  color: var(--color-ink);
}

.event-cal-box {
  display: grid;
  place-content: center;
  width: 2.85rem;
  height: 2.85rem;
  border-radius: 0.65rem;
  background: var(--color-coral);
  color: var(--color-white);
  text-align: center;
}

.cal-month {
  font-size: 0.58rem;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1;
}

.cal-day {
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.05;
}

.event-detail-box {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.event-host-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.host-name {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.host-dist {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

.event-title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 850;
  letter-spacing: -0.015em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-loc {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-pill-row {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.15rem;
}

/* Active Bike Card */
.bike-name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.bike-sub {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
}

.bike-specs-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.spec-chip {
  padding: 0.15rem 0.4rem;
  border-radius: 0.35rem;
  background: rgb(237 228 210 / 50%);
  font-family: var(--font-mono);
  font-size: 0.65rem;
}

.spec-chip--highlight {
  background: rgb(201 243 106 / 40%);
  font-weight: 800;
}

/* 4 App Tiles (2x2 Grid) */
.native-tools-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

@media (min-width: 48rem) {
  .native-tools-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }
}

.native-tool-tile {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 5.5rem;
  padding: 0.75rem 0.5rem;
  border-radius: var(--radius-card);
  border: 1px solid rgb(23 32 42 / 10%);
  background: var(--color-white);
  text-decoration: none;
  color: var(--color-ink);
  box-shadow: 0 2px 10px rgb(23 32 42 / 4%);
  transition: transform 90ms ease;
}

.native-tool-tile:active {
  transform: scale(0.95);
}

.tool-icon {
  font-size: 1.4rem;
  margin-bottom: 0.2rem;
}

.native-tool-tile strong {
  font-size: 0.82rem;
  font-weight: 850;
  line-height: 1.2;
}

.native-tool-tile small {
  font-size: 0.65rem;
  color: var(--color-asphalt);
  margin-top: 0.1rem;
}

/* Safety Card */
.safety-native-card {
  border: 1px solid rgb(255 140 117 / 50%);
  background: rgb(255 140 117 / 10%);
  gap: 0.65rem;
}

.safety-native-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.safety-icon-large {
  font-size: 1.5rem;
}

.safety-text strong {
  display: block;
  font-size: 0.88rem;
  font-weight: 850;
}

.safety-text p {
  margin: 0.1rem 0 0;
  font-size: 0.74rem;
  color: var(--color-asphalt);
}

.button--full {
  width: 100%;
}

.button--sm {
  min-height: 2.3rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
}
</style>
