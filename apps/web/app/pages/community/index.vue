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
const centerLabel = ref('Area Bandung');
const radiusKm = ref(15);
const bicycleType = ref('all');
const verificationStatus = ref('all');
const showFilterModal = ref(false);
const communities = ref<NearbyCommunity[]>([]);
const events = ref<NearbyEvent[]>([]);
const loading = ref(true);
const locating = ref(false);
const errorMessage = ref('');
const locationMessage = ref('');
const activeView = ref<'all' | 'communities' | 'events'>('all');

const activeFilterCount = computed(() => {
  let count = 0;
  if (radiusKm.value !== 15) count++;
  if (bicycleType.value !== 'all') count++;
  if (verificationStatus.value !== 'all') count++;
  return count;
});

const bikeFilterOptions = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'road', label: '🚴 Road Bike' },
  { value: 'gravel', label: '🌾 Gravel Bike' },
  { value: 'mtb_hardtail', label: '🏔️ MTB' },
  { value: 'folding', label: '🚲 Sepeda Lipat' },
];

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

function resetAllFilters(): void {
  radiusKm.value = 15;
  bicycleType.value = 'all';
  verificationStatus.value = 'all';
  showFilterModal.value = false;
  void loadDirectory();
}

function applyModalFilters(): void {
  showFilterModal.value = false;
  void loadDirectory();
}

function useMyLocation(): void {
  locationMessage.value = '';
  if (!('geolocation' in navigator)) {
    locationMessage.value = 'Fitur GPS tidak didukung di peramban ini.';
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      center.value = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      };
      centerLabel.value = 'Lokasi Saya';
      locating.value = false;
      locationMessage.value = 'Radius dihitung dari koordinat GPS Anda.';
      void loadDirectory();
    },
    () => {
      locating.value = false;
      locationMessage.value = 'Lokasi tidak dapat diakses. Menampilkan area Bandung.';
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
  );
}

onMounted(() => {
  useMyLocation();
});
</script>

<template>
  <div class="native-container community-container">
    <!-- Header -->
    <header class="native-page-header">
      <div class="header-topline">
        <span class="native-eyebrow">Komunitas &amp; Event</span>
        <NuxtLink class="rep-pill" to="/community/reputation">
          🏆 Kontributor
        </NuxtLink>
      </div>
      <h1 class="native-title">Temukan Teman Gowes</h1>
      <p class="native-sub">
        Jelajahi klub sepeda lokal dan jadwal mabar di sekitar Anda.
      </p>
    </header>

    <!-- Clean Unified Action Bar: Tabs on Left, Filter on Right -->
    <div class="unified-control-bar">
      <!-- Segmented Tabs -->
      <nav class="clean-segmented-tabs" role="tablist" aria-label="Tampilan Komunitas">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeView === 'all' }"
          type="button"
          @click="activeView = 'all'"
        >
          Semua ({{ communities.length + events.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeView === 'communities' }"
          type="button"
          @click="activeView = 'communities'"
        >
          Komunitas ({{ communities.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeView === 'events' }"
          type="button"
          @click="activeView = 'events'"
        >
          Jadwal ({{ events.length }})
        </button>
      </nav>

      <!-- Minimalist Location & Filter Trigger -->
      <button
        class="clean-filter-btn"
        :class="{ 'clean-filter-btn--filtered': activeFilterCount > 0 }"
        type="button"
        title="Buka opsi filter & radius jarak"
        @click="showFilterModal = true"
      >
        <span class="filter-pin">📍</span>
        <span class="filter-loc-label">{{ radiusKm }}km</span>
        <span class="filter-icon">🎚️</span>
        <span v-if="activeFilterCount > 0" class="filter-badge">
          {{ activeFilterCount }}
        </span>
      </button>
    </div>

    <p v-if="locationMessage" class="loc-toast" role="status">{{ locationMessage }}</p>

    <!-- Loading & Error States -->
    <p v-if="loading" class="state-card" role="status">Memuat jadwal dan komunitas…</p>
    <p v-else-if="errorMessage" class="state-card state-card--error" role="alert">{{ errorMessage }}</p>

    <div v-else class="content-feed-stack">
      <!-- 1. SCHEDULED RIDES / EVENTS -->
      <section v-if="activeView === 'all' || activeView === 'events'" class="feed-section">
        <div v-if="activeView === 'all'" class="feed-section-header">
          <h2 class="feed-heading">📅 Jadwal Gowes Bersama</h2>
        </div>

        <p v-if="events.length === 0" class="empty-feed-card">
          Belum ada jadwal gowes publik di radius {{ radiusKm }} km ini.
        </p>
        <div v-else class="feed-cards-list">
          <RideEventCard
            v-for="event in events"
            :key="event.id"
            :event="event"
          />
        </div>
      </section>

      <!-- 2. COMMUNITIES DIRECTORY -->
      <section v-if="activeView === 'all' || activeView === 'communities'" class="feed-section">
        <div v-if="activeView === 'all'" class="feed-section-header">
          <h2 class="feed-heading">👥 Komunitas &amp; Klub Sepeda</h2>
        </div>

        <p v-if="communities.length === 0" class="empty-feed-card">
          Tidak ada komunitas yang cocok dengan filter di radius {{ radiusKm }} km.
        </p>
        <div v-else class="feed-cards-list">
          <CommunityCard
            v-for="community in communities"
            :key="community.id"
            :community="community"
          />
        </div>
      </section>
    </div>

    <!-- ── NATIVE MOBILE BOTTOM-SHEET FILTER MODAL ────────────────── -->
    <Teleport to="body">
      <div
        v-if="showFilterModal"
        class="native-modal-backdrop"
        @click.self="showFilterModal = false"
      >
        <div class="native-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-sheet-title">
          <div class="sheet-grabber" aria-hidden="true" />

          <div class="sheet-header">
            <h3 id="filter-sheet-title" class="sheet-title">Filter &amp; Lokasi</h3>
            <button class="sheet-close" type="button" @click="showFilterModal = false">✕</button>
          </div>

          <div class="sheet-content">
            <!-- Location Button -->
            <div class="filter-group">
              <label class="group-label">Pusat Pencarian</label>
              <div class="loc-action-box">
                <span class="loc-current">📍 {{ centerLabel }}</span>
                <button
                  class="loc-gps-btn"
                  type="button"
                  :disabled="locating"
                  @click="useMyLocation"
                >
                  {{ locating ? 'Mencari GPS…' : '⌖ Pakai Lokasi Saya' }}
                </button>
              </div>
            </div>

            <!-- Radius Stepper / Selector -->
            <div class="filter-group">
              <label class="group-label">Radius Jarak ({{ radiusKm }} km)</label>
              <div class="radius-row">
                <button
                  v-for="r in [5, 10, 15, 25, 50]"
                  :key="r"
                  class="radius-pill"
                  :class="{ 'radius-pill--active': radiusKm === r }"
                  type="button"
                  @click="radiusKm = r"
                >
                  {{ r }} km
                </button>
              </div>
            </div>

            <!-- Bicycle Type Selector -->
            <div class="filter-group">
              <label class="group-label">Kategori Tipe Sepeda</label>
              <div class="bike-select-grid">
                <button
                  v-for="opt in bikeFilterOptions"
                  :key="opt.value"
                  class="bike-select-btn"
                  :class="{ 'bike-select-btn--active': bicycleType === opt.value }"
                  type="button"
                  @click="bicycleType = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Verification Status -->
            <div class="filter-group">
              <label class="group-label">Status Verifikasi</label>
              <select v-model="verificationStatus" class="clean-select">
                <option value="all">Semua Status</option>
                <option
                  v-for="status in VERIFICATION_STATUSES"
                  :key="status"
                  :value="status"
                >
                  {{ status.replaceAll('_', ' ') }}
                </option>
              </select>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="sheet-actions">
            <button class="action-btn action-btn--ghost" type="button" @click="resetAllFilters">
              Reset
            </button>
            <button class="action-btn action-btn--primary" type="button" @click="applyModalFilters">
              Tampilkan {{ communities.length + events.length }} Hasil
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.community-container {
  display: grid;
  gap: 0.85rem;
  padding-bottom: 3.5rem;
}

.native-page-header {
  display: grid;
  gap: 0.25rem;
}

.header-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.native-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.04em;
}

.rep-pill {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  background: var(--color-sand);
  color: var(--color-ink);
  text-decoration: none;
}

.native-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  color: var(--color-ink);
}

.native-sub {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* Unified Control Bar: Tabs + Filter Button on 1 Row */
.unified-control-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.clean-segmented-tabs {
  flex: 1;
  display: flex;
  gap: 0.2rem;
  padding: 0.25rem;
  border-radius: 0.75rem;
  background: rgb(237 228 210 / 55%);
}

.tab-btn {
  flex: 1;
  padding: 0.35rem 0.25rem;
  border-radius: 0.55rem;
  border: none;
  background: transparent;
  color: var(--color-asphalt);
  font-size: 0.72rem;
  font-weight: 750;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  transition: all 120ms ease;
}

.tab-btn--active {
  background: var(--color-white);
  color: var(--color-ink);
  font-weight: 850;
  box-shadow: 0 1px 4px rgb(23 32 42 / 8%);
}

.clean-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.65rem;
  border-radius: 0.75rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 12%);
  box-shadow: 0 1px 4px rgb(23 32 42 / 4%);
  color: var(--color-ink);
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 90ms ease;
}

.clean-filter-btn:active {
  transform: scale(0.96);
}

.clean-filter-btn--filtered {
  border-color: var(--color-ink);
  background: rgb(201 243 106 / 20%);
}

.filter-badge {
  display: grid;
  place-items: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-white);
  font-size: 0.58rem;
  font-weight: 900;
}

.loc-toast {
  margin: 0;
  font-size: 0.7rem;
  color: #166534;
  background: #f0fdf4;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #bbf7d0;
}

/* Feed Stack */
.content-feed-stack {
  display: grid;
  gap: 1.15rem;
}

.feed-section {
  display: grid;
  gap: 0.55rem;
}

.feed-section-header {
  padding: 0 0.15rem;
}

.feed-heading {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  color: var(--color-ink);
}

.empty-feed-card {
  margin: 0;
  padding: 1.25rem;
  text-align: center;
  border-radius: 0.85rem;
  background: var(--color-white);
  border: 1px dashed var(--color-sand);
  font-size: 0.78rem;
  color: var(--color-asphalt);
}

.feed-cards-list {
  display: grid;
  gap: 0.55rem;
}

/* Modal Bottom Sheet */
.native-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgb(15 23 42 / 40%);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 48rem) {
  .native-modal-backdrop {
    align-items: center;
  }
}

.native-modal-sheet {
  width: 100%;
  max-width: 28rem;
  background: var(--color-white);
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  padding: 0.65rem 1.15rem max(1.5rem, calc(1rem + var(--safe-bottom)));
  display: grid;
  gap: 1rem;
  box-shadow: 0 -8px 30px rgb(0 0 0 / 15%);
  animation: slideUp 180ms ease-out;
}

@media (min-width: 48rem) {
  .native-modal-sheet {
    border-radius: 1.25rem;
    padding: 1.25rem;
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-grabber {
  width: 2.25rem;
  height: 0.22rem;
  border-radius: 9999px;
  background: rgb(23 32 42 / 20%);
  margin: 0 auto;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
}

.sheet-close {
  border: none;
  background: var(--color-sand);
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 850;
  cursor: pointer;
}

.sheet-content {
  display: grid;
  gap: 0.85rem;
}

.filter-group {
  display: grid;
  gap: 0.35rem;
}

.group-label {
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.03em;
}

.loc-action-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.loc-current {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-ink);
}

.loc-gps-btn {
  padding: 0.25rem 0.55rem;
  border-radius: 0.5rem;
  background: var(--color-ink);
  color: var(--color-white);
  border: none;
  font-size: 0.68rem;
  font-weight: 800;
  cursor: pointer;
}

.radius-row {
  display: flex;
  gap: 0.3rem;
}

.radius-pill {
  flex: 1;
  padding: 0.4rem 0.2rem;
  border-radius: 0.55rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-ink);
  cursor: pointer;
  transition: all 100ms ease;
}

.radius-pill--active {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

.bike-select-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.35rem;
}

.bike-select-btn {
  padding: 0.45rem 0.55rem;
  border-radius: 0.55rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  transition: all 100ms ease;
}

.bike-select-btn--active {
  background: rgb(201 243 106 / 45%);
  border-color: var(--color-ink);
  color: var(--color-ink);
}

.clean-select {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem;
  border: 1px solid var(--color-sand);
  background: var(--color-canvas);
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-ink);
  outline: none;
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.45rem;
  margin-top: 0.25rem;
}

.action-btn {
  padding: 0.6rem 0.85rem;
  border-radius: 0.75rem;
  font-size: 0.78rem;
  font-weight: 850;
  cursor: pointer;
  border: none;
}

.action-btn--ghost {
  background: var(--color-sand);
  color: var(--color-ink);
}

.action-btn--primary {
  background: var(--color-ink);
  color: var(--color-white);
}
</style>
