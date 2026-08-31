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

const api = useApi();
const { user, initialized, refresh } = useAuth();
const { weather, fetchLiveWeather } = useWeather();
const { cityName: userCityName, isLiveGps, requestLocation } = useUserLocation();

const bikes = ref<Bike[]>([]);
const routes = ref<NearbyRoute[]>([]);
const places = ref<NearbyPlace[]>([]);
const events = ref<NearbyEvent[]>([]);
const loading = ref(true);

const featuredRoute = computed(() => routes.value[0] ?? null);
const otherRoutes = computed(() => routes.value.slice(1));
const activeBike = computed(() => bikes.value[0] ?? null);

const fallbackFeaturedRoute: NearbyRoute = {
  id: '30000000-0000-4000-8000-000000000001',
  kind: 'route',
  name: 'Dago Pakar Morning Climb',
  description: 'Rute tanjakan legendaris Bandung dari Dago Cikapayang menuju Dago Pakar dengan panorama sejuk.',
  bicycleTypes: ['road', 'gravel'],
  beginnerFriendly: false,
  verificationStatus: 'staff_verified',
  freshness: 'fresh',
  lastConfirmedAt: new Date().toISOString(),
  routeType: 'road',
  geometry: {
    type: 'LineString',
    coordinates: [
      [107.6134, -6.8992],
      [107.6258, -6.8654],
    ],
  },
  distanceMeters: 7200,
  elevationGainMeters: 310,
  difficulty: 'moderate',
  surface: 'paved',
  distanceFromUserMeters: 1400,
};

const fallbackEvents: NearbyEvent[] = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    slug: 'sunday-morning-coffee-ride',
    community: {
      id: '20000000-0000-4000-8000-000000000001',
      slug: 'bandung-gravel-society',
      name: 'Bandung Gravel Society',
      verificationStatus: 'community_verified',
    },
    title: 'Sunday Morning Coffee Ride',
    description: 'Santai pagi keliling kota lanjut ngopi santai di Dago.',
    status: 'scheduled',
    startsAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    meetingArea: 'Gedung Sate Bandung',
    difficulty: 'easy',
    bicycleTypes: ['gravel', 'road'],
    visibility: 'public',
    participantCount: 14,
    capacity: 25,
    requirements: 'Helm wajib, bawa ban cadangan.',
    routeId: null,
    createdAt: new Date().toISOString(),
    distanceMeters: 2400,
  },
  {
    id: '40000000-0000-4000-8000-000000000002',
    slug: 'dago-giri-hill-climb-challenge',
    community: {
      id: '20000000-0000-4000-8000-000000000002',
      slug: 'puncak-climbers-club',
      name: 'Puncak Climbers Club',
      verificationStatus: 'staff_verified',
    },
    title: 'Dago Giri Hill Climb Challenge',
    description: 'Tanjakan endurance tanjakan Dago Giri.',
    status: 'scheduled',
    startsAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    meetingArea: 'Simpang Dago',
    difficulty: 'hard',
    bicycleTypes: ['road', 'gravel'],
    visibility: 'public',
    participantCount: 8,
    capacity: 15,
    requirements: 'Kondisi rem prima, lampu depan & belakang.',
    routeId: null,
    createdAt: new Date().toISOString(),
    distanceMeters: 4100,
  },
];

const detectingLocation = ref(false);

async function loadNearbyForCoordinates(center: { latitude: number; longitude: number }): Promise<void> {
  // 1. Fetch nearby explore routes & workshops around location
  try {
    const exploreRes = await api<NearbyExploreResponse>('/explore/nearby', {
      method: 'POST',
      body: {
        center: { longitude: center.longitude, latitude: center.latitude },
        radiusKm: 25,
      },
    });
    routes.value = exploreRes.routes;
    places.value = exploreRes.places;
  } catch {
    routes.value = [];
    places.value = [];
  }

  // 2. Fetch nearby community ride events around location
  try {
    const eventsRes = await api<NearbyEventsResponse>('/events/nearby', {
      method: 'POST',
      body: {
        center: { longitude: center.longitude, latitude: center.latitude },
        radiusKm: 25,
      },
    });
    events.value = eventsRes.events;
  } catch {
    events.value = [];
  }
}

async function handleRefreshLocation(): Promise<void> {
  detectingLocation.value = true;
  try {
    const loc = await requestLocation(true);
    const center = { latitude: loc.latitude, longitude: loc.longitude };
    void fetchLiveWeather(center.latitude, center.longitude, userCityName.value);
    await loadNearbyForCoordinates(center);
  } finally {
    detectingLocation.value = false;
  }
}

onMounted(async () => {
  if (!initialized.value) await refresh();

  // 1. Auto-request real device GPS location immediately
  const loc = await requestLocation();
  const center = { latitude: loc.latitude, longitude: loc.longitude };

  // 2. Fetch real-time Open-Meteo weather with actual GPS coordinates & reverse geocoded city
  void fetchLiveWeather(center.latitude, center.longitude, userCityName.value);

  // 3. Load user bikes if authenticated
  if (user.value) {
    try {
      bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
    } catch {
      bikes.value = [];
    }
  }

  // 4. Fetch nearby explore routes & community ride events
  await loadNearbyForCoordinates(center);

  loading.value = false;
});

function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}
</script>

<template>
  <div class="native-container home-container">
    <!-- 1. Minimalist Rider Cockpit Bar (Real-Time Open-Meteo Weather & Live GPS) -->
    <header class="rider-cockpit-bar">
      <div class="cockpit-left">
        <span class="cockpit-eyebrow">
          {{ user ? `Halo, ${user.displayName.split(' ')[0]}` : 'Selamat Pagi, Rider' }}
        </span>
        <button
          type="button"
          class="weather-chip"
          :class="{ 'weather-chip--interactive': true, 'weather-chip--live': isLiveGps }"
          :title="isLiveGps ? `GPS Aktif (${weather.cityName}). Klik untuk perbarui cuaca.` : 'Klik untuk mengaktifkan izin GPS & mendeteksi kotamu'"
          :disabled="detectingLocation"
          @click="handleRefreshLocation"
        >
          <GIcon :name="weather.icon === '☀️' ? 'sun' : (weather.icon === '🌧️' ? 'rain' : 'cloud')" size="sm" class="weather-icon-svg" />
          <span class="weather-text">
            {{ detectingLocation ? 'Mendeteksi GPS…' : `${weather.cityName} · ${weather.temperatureC}°C · ${weather.cyclingAdvice}` }}
          </span>
          <GIcon v-if="isLiveGps" name="radar" size="xs" color="#16A34A" class="live-gps-dot" title="GPS Terverifikasi" />
          <span v-else-if="!detectingLocation" class="gps-ask-badge">
            <GIcon name="pin" size="xs" /> Izinkan GPS
          </span>
        </button>
      </div>
      <NuxtLink to="/safety" class="sos-quick-badge" title="Solo Ride Safety">
        <GIcon name="shield" size="xs" color="#FF8C75" filled /> Live Safety
      </NuxtLink>
    </header>

    <!-- 2. Quick Action Hub (5 Clean Cycling Shortcuts with Signature SVG Icons) -->
    <nav class="quick-shortcuts-row" aria-label="Aksi Cepat">
      <NuxtLink to="/explore" class="shortcut-pill">
        <div class="shortcut-icon-box">
          <GIcon name="route" size="md" color="#0F766E" />
        </div>
        <span class="shortcut-label">Rute</span>
      </NuxtLink>
      <NuxtLink to="/community" class="shortcut-pill">
        <div class="shortcut-icon-box">
          <GIcon name="community" size="md" color="#2563EB" />
        </div>
        <span class="shortcut-label">Mabar</span>
      </NuxtLink>
      <NuxtLink to="/upgrade-lab" class="shortcut-pill">
        <div class="shortcut-icon-box">
          <GIcon name="upgrade" size="md" color="#D97706" filled />
        </div>
        <span class="shortcut-label">Upgrade</span>
      </NuxtLink>
      <NuxtLink to="/garage" class="shortcut-pill">
        <div class="shortcut-icon-box">
          <GIcon name="bike" size="md" color="#17202A" />
        </div>
        <span class="shortcut-label">Garasi</span>
      </NuxtLink>
      <NuxtLink to="/ride-flex" class="shortcut-pill shortcut-pill--flex">
        <div class="shortcut-icon-box">
          <GIcon name="flex" size="md" color="#17202A" />
        </div>
        <span class="shortcut-label">Flex AI</span>
      </NuxtLink>
    </nav>

    <!-- 2.5 Agentic AI Ride Flex Spotlight Banner -->
    <section class="home-flex-spotlight">
      <div class="flex-spotlight-content">
        <span class="spotlight-chip">
          <GIcon name="sparkles" size="xs" color="#C9F36A" /> AGENTIC AI &amp; STRAVA-STYLE FLEX
        </span>
        <h2 class="spotlight-title">Pamerkan Hasil Gowes dengan Poster Sinematik</h2>
        <p class="spotlight-desc">
          Gabungkan foto gowes, telemetri live, sticker KOM, dan caption AI otomatis untuk Instagram Story &amp; WhatsApp.
        </p>
      </div>
      <NuxtLink to="/ride-flex" class="spotlight-action-btn">
        <GIcon name="camera" size="sm" />
        <span>Buka Studio</span>
        <span>→</span>
      </NuxtLink>
    </section>

    <!-- 3. FEATURED ROUTE HERO (Komoot & Strava Elevation Style) -->
    <section class="home-section" aria-labelledby="sec-featured-route">
      <div class="section-topline">
        <h2 id="sec-featured-route" class="section-title">Rute Pilihan Hari Ini</h2>
        <NuxtLink to="/explore" class="section-link">Semua Rute →</NuxtLink>
      </div>

      <!-- Skeleton Route Shimmer during Loading -->
      <article v-if="loading" class="clean-featured-route-card skeleton-card-box">
        <div class="route-header-tags">
          <div class="skeleton-shimmer skeleton-badge" />
          <div class="skeleton-shimmer skeleton-badge skeleton-badge--sm" />
        </div>
        <div class="skeleton-shimmer skeleton-title-bar" />
        <div class="skeleton-shimmer skeleton-desc-line" />
        <div class="skeleton-shimmer skeleton-desc-line skeleton-desc-line--short" />
        <div class="skeleton-shimmer skeleton-spark-box" />
        <div class="route-metrics-strip">
          <div class="metric-col"><div class="skeleton-shimmer skeleton-metric-val" /></div>
          <div class="metric-divider" />
          <div class="metric-col"><div class="skeleton-shimmer skeleton-metric-val" /></div>
          <div class="metric-divider" />
          <div class="metric-col"><div class="skeleton-shimmer skeleton-metric-val" /></div>
        </div>
        <div class="skeleton-shimmer skeleton-btn-bar" />
      </article>

      <!-- Loaded Featured Route -->
      <article v-else-if="featuredRoute || fallbackFeaturedRoute" class="clean-featured-route-card">
        <!-- Top Tags -->
        <div class="route-header-tags">
          <span class="route-type-badge">
            <GIcon name="bike" size="xs" /> {{ (featuredRoute || fallbackFeaturedRoute).routeType.toUpperCase() }}
          </span>
          <span class="route-surface-badge">
            {{ (featuredRoute || fallbackFeaturedRoute).surface }}
          </span>
          <span class="route-verified-badge">
            <GIcon name="check" size="xs" color="#15803d" /> Verified GPX
          </span>
        </div>

        <!-- Title & Bio -->
        <h3 class="route-hero-title">{{ (featuredRoute || fallbackFeaturedRoute).name }}</h3>
        <p class="route-hero-desc">{{ (featuredRoute || fallbackFeaturedRoute).description }}</p>

        <!-- Clean Integrated Elevation Sparkline -->
        <div class="elevation-spark-box">
          <div class="spark-labels">
            <span class="spark-gain">+{{ (featuredRoute || fallbackFeaturedRoute).elevationGainMeters }}m Climb</span>
            <span class="spark-diff capitalize">{{ (featuredRoute || fallbackFeaturedRoute).difficulty }} Pace</span>
          </div>
          <svg viewBox="0 0 300 40" class="spark-svg" aria-hidden="true">
            <path
              d="M0 35 Q 75 32, 150 18 T 270 8 L 300 4 L 300 40 L 0 40 Z"
              fill="rgba(201, 243, 106, 0.4)"
            />
            <path
              d="M0 35 Q 75 32, 150 18 T 270 8 L 300 4"
              fill="none"
              stroke="#17202A"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <!-- Key Metrics Strip -->
        <div class="route-metrics-strip">
          <div class="metric-col">
            <span class="metric-label">JARAK</span>
            <strong class="metric-value">{{ formatKm((featuredRoute || fallbackFeaturedRoute).distanceMeters) }}</strong>
          </div>
          <div class="metric-divider" />
          <div class="metric-col">
            <span class="metric-label">ELEVASI</span>
            <strong class="metric-value">+{{ (featuredRoute || fallbackFeaturedRoute).elevationGainMeters }}m</strong>
          </div>
          <div class="metric-divider" />
          <div class="metric-col">
            <span class="metric-label">TINGKAT</span>
            <strong class="metric-value capitalize">{{ (featuredRoute || fallbackFeaturedRoute).difficulty }}</strong>
          </div>
        </div>

        <!-- Clean CTA Button -->
        <NuxtLink to="/explore" class="route-cta-btn">
          <span>Buka Navigasi &amp; GPX Track</span>
          <span class="cta-arrow">→</span>
        </NuxtLink>
      </article>

      <!-- Mini Horizontal Routes -->
      <div v-if="!loading && otherRoutes.length" class="mini-routes-scroll">
        <NuxtLink
          v-for="r in otherRoutes"
          :key="r.id"
          to="/explore"
          class="mini-route-card"
        >
          <div class="mini-route-header">
            <span class="mini-type-tag">{{ r.routeType }}</span>
            <span class="mini-diff-tag">{{ r.difficulty }}</span>
          </div>
          <strong class="mini-route-name">{{ r.name }}</strong>
          <span class="mini-route-stats">{{ formatKm(r.distanceMeters) }} · +{{ r.elevationGainMeters }}m</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 4. GOWES BARENG FEED -->
    <section class="home-section" aria-labelledby="sec-home-events">
      <div class="section-topline">
        <h2 id="sec-home-events" class="section-title">Jadwal Gowes Bersama</h2>
        <NuxtLink to="/community" class="section-link">Semua Event →</NuxtLink>
      </div>

      <!-- Skeleton Event Shimmer during Loading -->
      <div v-if="loading" class="events-feed-list">
        <div v-for="i in 2" :key="i" class="skeleton-event-card">
          <div class="skeleton-shimmer skeleton-event-header" />
          <div class="skeleton-shimmer skeleton-event-title" />
          <div class="skeleton-shimmer skeleton-event-meta" />
        </div>
      </div>

      <div v-else class="events-feed-list">
        <RideEventCard
          v-for="evt in (events.length ? events.slice(0, 2) : fallbackEvents)"
          :key="evt.id"
          :event="evt"
        />
      </div>
    </section>

    <!-- 5. ACTIVE BIKE OR GUEST GARAGE CALLOUT -->
    <section class="home-section" aria-labelledby="sec-home-garage">
      <div class="section-topline">
        <h2 id="sec-home-garage" class="section-title">Workshop Sepeda</h2>
        <NuxtLink to="/garage" class="section-link">Garasi →</NuxtLink>
      </div>

      <!-- Skeleton Garage during Loading -->
      <div v-if="loading || !initialized" class="skeleton-garage-banner">
        <div class="skeleton-shimmer skeleton-garage-icon" />
        <div class="skeleton-garage-info">
          <div class="skeleton-shimmer skeleton-garage-title" />
          <div class="skeleton-shimmer skeleton-garage-sub" />
        </div>
      </div>

      <!-- Logged In: Active Bike Snapshot -->
      <NuxtLink v-else-if="activeBike" :to="`/garage/${activeBike.id}`" class="active-bike-banner">
        <div class="bike-banner-icon">
          <GIcon name="bike" size="lg" color="#17202A" />
        </div>
        <div class="bike-banner-info">
          <div class="bike-banner-title-row">
            <strong class="bike-banner-name">{{ activeBike.nickname }}</strong>
            <span class="bike-health-badge">🟢 Siap Gowes</span>
          </div>
          <span class="bike-banner-sub">{{ activeBike.brand }} {{ activeBike.model }} · Standar Terverifikasi</span>
        </div>
        <span class="banner-chevron">›</span>
      </NuxtLink>

      <!-- Guest: Clean 1-Tap Callout -->
      <div v-else class="guest-garage-banner">
        <div class="guest-banner-text">
          <strong>Digitalisasikan Sepeda Anda</strong>
          <p>Catat standar as roda, headset, BB, dan riwayat servis tanpa tebak merek.</p>
        </div>
        <NuxtLink to="/login" class="guest-banner-btn">
          Buka Garasi
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  display: grid;
  gap: 1.15rem;
  padding-bottom: 4rem;
}

/* 1. Rider Cockpit Header */
.rider-cockpit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.25rem 0.15rem 0.1rem;
}

.cockpit-left {
  display: grid;
  gap: 0.15rem;
}

.cockpit-eyebrow {
  font-size: 1.25rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.weather-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  font-weight: 650;
  background: transparent;
  border: none;
  padding: 0.15rem 0.35rem 0.15rem 0;
  text-align: left;
  border-radius: 0.5rem;
  transition: transform 90ms ease, opacity 90ms ease;
}

.weather-chip--interactive {
  cursor: pointer;
}

.weather-chip--interactive:active {
  transform: scale(0.97);
}

.gps-ask-badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 900;
  color: #17202A;
  background: var(--color-chain-lime);
  padding: 0.1rem 0.35rem;
  border-radius: 0.35rem;
  border: 1px solid rgba(23, 32, 42, 0.2);
  margin-left: 0.2rem;
  animation: pulseGps 2s infinite ease-in-out;
}

@keyframes pulseGps {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.weather-icon {
  font-size: 0.85rem;
}

.sos-quick-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1px solid rgb(255 140 117 / 50%);
  color: var(--color-ink);
  font-size: 0.7rem;
  font-weight: 850;
  text-decoration: none;
  box-shadow: 0 1px 4px rgb(23 32 42 / 4%);
}

.sos-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--color-coral);
}

/* 2. Quick Shortcuts Row */
.quick-shortcuts-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.35rem;
}

.shortcut-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.6rem 0.2rem;
  border-radius: 0.85rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 8%);
  box-shadow: 0 2px 8px rgb(23 32 42 / 3%);
  text-decoration: none;
  color: var(--color-ink);
  transition: transform 90ms ease;
}

.shortcut-pill:active {
  transform: scale(0.95);
}

.shortcut-pill--flex {
  background: rgba(201, 243, 106, 0.2);
  border-color: var(--color-chain-lime);
}

.shortcut-icon {
  font-size: 1.15rem;
}

.shortcut-label {
  font-size: 0.65rem;
  font-weight: 850;
  color: var(--color-ink);
  white-space: nowrap;
}

/* 2.5 Agentic AI Flex Spotlight */
.home-flex-spotlight {
  background: linear-gradient(135deg, #17202A 0%, #0F172A 100%);
  border: 1.5px solid rgba(201, 243, 106, 0.4);
  border-radius: 1.25rem;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

@media (min-width: 640px) {
  .home-flex-spotlight {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.flex-spotlight-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.spotlight-chip {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  background: rgba(201, 243, 106, 0.12);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  width: fit-content;
  border: 1px solid rgba(201, 243, 106, 0.25);
}

.spotlight-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: #FFFFFF;
  letter-spacing: -0.02em;
}

.spotlight-desc {
  margin: 0;
  font-size: 0.78rem;
  color: #94A3B8;
  line-height: 1.4;
}

.spotlight-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem 1.15rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: #17202A;
  font-size: 0.8rem;
  font-weight: 900;
  text-decoration: none;
  white-space: nowrap;
  border: 1px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  transition: transform 90ms ease;
}

.spotlight-action-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--color-ink);
}

/* 3. Section Commons */
.home-section {
  display: grid;
  gap: 0.65rem;
}

.section-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.15rem;
}

.section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: -0.015em;
  color: var(--color-ink);
}

.section-link {
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-ink);
  text-decoration: none;
}

/* Featured Route Card */
.clean-featured-route-card {
  display: grid;
  gap: 0.65rem;
  padding: 1rem 1.15rem;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 8%);
  box-shadow: 0 4px 18px rgb(23 32 42 / 4%);
}

.route-header-tags {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.route-type-badge {
  font-family: var(--font-mono);
  font-size: 0.64rem;
  font-weight: 850;
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: var(--color-chain-lime);
  color: var(--color-ink);
}

.route-surface-badge {
  font-size: 0.65rem;
  font-weight: 750;
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  color: var(--color-asphalt);
  text-transform: capitalize;
}

.route-verified-badge {
  margin-left: auto;
  font-size: 0.66rem;
  font-weight: 850;
  color: #15803d;
}

.route-hero-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.route-hero-desc {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* Integrated Elevation Sparkline */
.elevation-spark-box {
  display: grid;
  gap: 0.2rem;
  padding: 0.55rem 0.75rem 0.25rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.spark-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--color-ink);
}

.spark-svg {
  width: 100%;
  height: 2.2rem;
}

/* Metrics Strip */
.route-metrics-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 0.5rem;
}

.metric-col {
  display: grid;
  gap: 0.1rem;
  text-align: center;
  flex: 1;
}

.metric-label {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.metric-value {
  font-family: var(--font-mono);
  font-size: 0.88rem;
  font-weight: 900;
  color: var(--color-ink);
}

.metric-divider {
  width: 1px;
  height: 1.5rem;
  background: var(--color-sand);
}

.route-cta-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-ink);
  color: var(--color-white);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 850;
  transition: transform 90ms ease;
}

.route-cta-btn:active {
  transform: scale(0.98);
}

.cta-arrow {
  font-size: 1rem;
  transition: transform 120ms ease;
}

/* Mini Routes Scroll */
.mini-routes-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
  scrollbar-width: none;
}

.mini-routes-scroll::-webkit-scrollbar {
  display: none;
}

.mini-route-card {
  flex: 0 0 13rem;
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 8%);
  box-shadow: 0 2px 8px rgb(23 32 42 / 3%);
  text-decoration: none;
  color: var(--color-ink);
}

.mini-route-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  font-weight: 800;
}

.mini-type-tag {
  font-family: var(--font-mono);
  color: var(--color-asphalt);
  text-transform: uppercase;
}

.mini-diff-tag {
  text-transform: capitalize;
  color: var(--color-asphalt);
}

.mini-route-name {
  font-size: 0.85rem;
  font-weight: 850;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-route-stats {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-asphalt);
}

/* Events Feed */
.events-feed-list {
  display: grid;
  gap: 0.55rem;
}

/* Active Bike Banner */
.active-bike-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 8%);
  box-shadow: 0 2px 10px rgb(23 32 42 / 3%);
  text-decoration: none;
  color: inherit;
}

.bike-banner-icon {
  font-size: 1.5rem;
}

.bike-banner-info {
  display: grid;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
}

.bike-banner-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bike-banner-name {
  font-size: 0.92rem;
  font-weight: 850;
  color: var(--color-ink);
}

.bike-health-badge {
  font-size: 0.65rem;
  font-weight: 750;
  padding: 0.15rem 0.45rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  border-radius: 9999px;
  white-space: nowrap;
}

.bike-banner-sub {
  font-size: 0.72rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-chevron {
  font-size: 1.25rem;
  color: var(--color-sand);
}

/* Guest Garage Banner */
.guest-garage-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 8%);
  box-shadow: 0 2px 10px rgb(23 32 42 / 3%);
}

.guest-banner-text {
  flex: 1 1 auto;
  min-width: 0;
}

.guest-banner-text strong {
  display: block;
  font-size: 0.88rem;
  font-weight: 850;
  color: var(--color-ink);
  line-height: 1.25;
}

.guest-banner-text p {
  margin: 0.2rem 0 0;
  font-size: 0.73rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

.guest-banner-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-ink);
  color: var(--color-white);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 850;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgb(23 32 42 / 12%);
  transition: transform 90ms ease, opacity 90ms ease;
}

.guest-banner-btn:active {
  transform: scale(0.96);
  opacity: 0.9;
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON SHIMMER LOADERS (CLEAN & FLICKER-FREE UX)
   ═══════════════════════════════════════════════════════════════ */
.skeleton-card-box {
  border: 1px solid rgb(23 32 42 / 8%);
  pointer-events: none;
  display: grid;
  gap: 0.85rem;
}

.skeleton-badge {
  width: 4.5rem;
  height: 1.25rem;
  border-radius: 0.4rem;
}

.skeleton-badge--sm {
  width: 3.5rem;
}

.skeleton-title-bar {
  width: 65%;
  height: 1.5rem;
  border-radius: 0.5rem;
}

.skeleton-desc-line {
  width: 95%;
  height: 0.85rem;
  border-radius: 0.4rem;
}

.skeleton-desc-line--short {
  width: 75%;
}

.skeleton-spark-box {
  width: 100%;
  height: 5rem;
  border-radius: 0.85rem;
}

.skeleton-metric-val {
  width: 3.5rem;
  height: 1.25rem;
  margin: 0.2rem auto;
  border-radius: 0.35rem;
}

.skeleton-btn-bar {
  width: 100%;
  height: 2.85rem;
  border-radius: 0.85rem;
}

.skeleton-event-card {
  padding: 1rem 1.15rem;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 8%);
  display: grid;
  gap: 0.65rem;
}

.skeleton-event-header {
  width: 40%;
  height: 0.9rem;
}

.skeleton-event-title {
  width: 70%;
  height: 1.2rem;
}

.skeleton-event-meta {
  width: 55%;
  height: 0.85rem;
}

.skeleton-garage-banner {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 8%);
}

.skeleton-garage-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.skeleton-garage-info {
  display: grid;
  gap: 0.4rem;
  flex: 1;
}

.skeleton-garage-title {
  width: 45%;
  height: 1rem;
}

.skeleton-garage-sub {
  width: 65%;
  height: 0.75rem;
}
</style>
