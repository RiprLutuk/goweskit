<script setup lang="ts">
import type { Bike, BikeListResponse } from '@goweskit/contracts';

const api = useApi();
const { user, initialized, refresh, login } = useAuth();
const bikes = ref<Bike[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const demoLoggingIn = ref(false);
const filterQuery = ref('');

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value === null) {
    loading.value = false;
    return;
  }

  try {
    bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
});

const filteredBikes = computed(() => {
  if (!filterQuery.value.trim()) return bikes.value;
  const q = filterQuery.value.toLowerCase();
  return bikes.value.filter(
    (b) =>
      b.nickname.toLowerCase().includes(q) ||
      b.bicycleType.name.toLowerCase().includes(q) ||
      (b.brand && b.brand.toLowerCase().includes(q)) ||
      (b.model && b.model.toLowerCase().includes(q)),
  );
});

async function quickDemoLogin(): Promise<void> {
  demoLoggingIn.value = true;
  errorMessage.value = '';
  try {
    await login({
      email: 'demo@goweskit.local',
      password: 'GowesKitDemo123!',
    });
    bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    demoLoggingIn.value = false;
  }
}

function bikeTypeIcon(slug: string): string {
  if (slug === 'mtb_hardtail') return '🌲';
  if (slug === 'folding') return '🧲';
  if (slug === 'road') return '⚡';
  if (slug === 'gravel') return '🌾';
  return '🚲';
}

function specsBreakdown(bike: Bike): { known: number; unknown: number } {
  let known = 0;
  let unknown = 0;
  for (const s of bike.specs) {
    if (s.knowledge === 'known') known++;
    else if (s.knowledge === 'unknown') unknown++;
  }
  return { known, unknown };
}
</script>

<template>
  <div class="native-container garage-container">
    <!-- Header with Action Button -->
    <header class="native-page-header">
      <div class="header-topline">
        <span class="native-eyebrow">Workshop Pribadi</span>
        <span v-if="user && bikes.length" class="counter-chip">{{ bikes.length }} Sepeda Aktif</span>
      </div>
      <div class="header-main-row">
        <h1 class="native-title">My Garage</h1>
        <NuxtLink v-if="user" class="add-bike-fab" to="/garage/new" title="Tambah Sepeda">
          ＋ Tambah Sepeda
        </NuxtLink>
      </div>
      <p class="native-sub">
        Simpan anatomi sepeda, pantau standar teknis terverifikasi, dan catat servis secara digital tanpa tebak-tebakan merek.
      </p>
    </header>

    <p v-if="loading" class="state-card" role="status">Membuka Garasi Anda…</p>

    <!-- Signed-out state with 1-click Demo helper -->
    <div v-else-if="!user" class="native-guest-box">
      <div class="guest-icon">🚲</div>
      <h2>Buka Garasi Sepeda Anda</h2>
      <p>
        Simpan spesifikasi komponen as roda, headset, BB, rantai, dan catatan servis rutin sepeda Anda di GowesKit.
      </p>

      <div class="guest-btn-group">
        <NuxtLink class="button button--primary button--full" to="/login">Masuk ke Akun</NuxtLink>
        <NuxtLink class="button button--secondary button--full" to="/register">Daftar Akun Baru</NuxtLink>
        <button
          class="button button--sand button--full"
          type="button"
          :disabled="demoLoggingIn"
          @click="quickDemoLogin"
        >
          {{ demoLoggingIn ? 'Memuat Demo…' : '⚡ Buka Contoh Garasi Demo (1-Klik)' }}
        </button>
      </div>
    </div>

    <p
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <!-- Bike List / Empty State -->
    <template v-else-if="bikes.length">
      <!-- Search Input if multiple bikes -->
      <div class="search-bar-wrap">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="filterQuery"
          type="search"
          placeholder="Cari sepeda berdasarkan nama, merek, atau tipe…"
          class="search-field"
        />
        <button
          v-if="filterQuery"
          class="clear-search-btn"
          type="button"
          @click="filterQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Native Cards Grid -->
      <div class="bike-cards-feed">
        <article
          v-for="bike in filteredBikes"
          :key="bike.id"
          class="native-bike-card"
        >
          <!-- Visual Photo / Illustration -->
          <div class="card-cover">
            <img
              v-if="bike.photoUrl"
              :src="bike.photoUrl"
              :alt="bike.nickname"
              class="cover-image"
            />
            <div v-else class="cover-placeholder">
              <span class="cover-placeholder-icon">{{ bikeTypeIcon(bike.bicycleType.slug) }}</span>
            </div>

            <div class="cover-pills">
              <span class="type-pill">
                {{ bikeTypeIcon(bike.bicycleType.slug) }} {{ bike.bicycleType.name }}
              </span>
              <span v-if="bike.modelYear" class="year-pill">{{ bike.modelYear }}</span>
            </div>
          </div>

          <!-- Content Body -->
          <div class="card-body">
            <h2 class="bike-name">
              <NuxtLink :to="`/garage/${bike.id}`">{{ bike.nickname }}</NuxtLink>
            </h2>

            <p class="bike-spec-sub">
              {{ [bike.brand, bike.model].filter(Boolean).join(' · ') || 'Custom Build / Rakitan' }}
            </p>

            <!-- Verified Standards Progress Gauge -->
            <div class="standards-gauge">
              <div class="gauge-labels">
                <span class="gauge-known">
                  <strong>{{ specsBreakdown(bike).known }}</strong> Standar Terverifikasi
                </span>
                <span v-if="specsBreakdown(bike).unknown" class="gauge-unknown">
                  {{ specsBreakdown(bike).unknown }} belum tahu
                </span>
              </div>
              <div class="gauge-track">
                <div
                  class="gauge-fill"
                  :style="{ width: `${Math.min(100, Math.round((specsBreakdown(bike).known / 17) * 100))}%` }"
                />
              </div>
            </div>

            <!-- Native 1-Tap Action Buttons -->
            <div class="card-actions-row">
              <NuxtLink class="native-btn native-btn--secondary" :to="`/garage/${bike.id}`">
                🔧 Spesifikasi &amp; Servis
              </NuxtLink>
              <NuxtLink class="native-btn native-btn--primary" :to="`/upgrade-lab?bike=${bike.id}`">
                ⚡ Cek Upgrade Lab
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>
    </template>

    <!-- Empty Garage State -->
    <div v-else class="empty-garage-box">
      <div class="empty-icon">🚲</div>
      <h2>Garasi Anda Masih Kosong</h2>
      <p>Tambahkan sepeda pertama Anda untuk mulai memetakan standar teknis dan riwayat servis.</p>
      <NuxtLink class="button button--primary" to="/garage/new">
        ＋ Daftarkan Sepeda Pertama
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.garage-container {
  display: grid;
  gap: 1.25rem;
  padding-bottom: 2rem;
}

.native-page-header {
  display: grid;
  gap: 0.35rem;
}

.header-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.native-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.05em;
}

.counter-chip {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  background: var(--color-sand);
  color: var(--color-ink);
}

.header-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.native-title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.add-bike-fab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-size: 0.78rem;
  font-weight: 850;
  text-decoration: none;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  transition: transform 90ms ease;
  white-space: nowrap;
}

.add-bike-fab:active {
  transform: scale(0.96);
}

.native-sub {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* Search Bar */
.search-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.85rem;
  border-radius: 0.95rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 2px 8px rgb(23 32 42 / 3%);
}

.search-icon {
  font-size: 0.85rem;
  opacity: 0.5;
}

.search-field {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.82rem;
  font-weight: 750;
  color: var(--color-ink);
}

.clear-search-btn {
  border: none;
  background: none;
  font-size: 0.75rem;
  color: var(--color-asphalt);
  cursor: pointer;
}

/* Bike Cards Feed */
.bike-cards-feed {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 1rem;
}

.native-bike-card {
  display: flex;
  flex-direction: column;
  border-radius: 1.25rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  overflow: hidden;
  box-shadow: 0 4px 18px rgb(23 32 42 / 6%);
  transition: transform 120ms ease, border-color 120ms ease;
}

.native-bike-card:hover {
  border-color: var(--color-ink);
}

.card-cover {
  position: relative;
  width: 100%;
  height: 9.5rem;
  background: var(--color-sand);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, #ffffff 0%, #ede4d2 100%);
}

.cover-placeholder-icon {
  font-size: 3.5rem;
}

.cover-pills {
  position: absolute;
  top: 0.65rem;
  left: 0.65rem;
  right: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.type-pill {
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--color-ink);
  border: 1px solid rgb(23 32 42 / 10%);
}

.year-pill {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  padding: 0.15rem 0.45rem;
  border-radius: 0.45rem;
  background: rgb(23 32 42 / 75%);
  color: var(--color-white);
}

.card-body {
  padding: 1rem;
  display: grid;
  gap: 0.65rem;
  flex: 1;
}

.bike-name {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.bike-name a {
  text-decoration: none;
  color: var(--color-ink);
}

.bike-spec-sub {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  font-weight: 700;
}

/* Standards Progress */
.standards-gauge {
  display: grid;
  gap: 0.25rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.gauge-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 750;
}

.gauge-known strong {
  color: #166534;
}

.gauge-unknown {
  color: #0369a1;
  background: #e0f2fe;
  padding: 0.05rem 0.35rem;
  border-radius: 0.35rem;
}

.gauge-track {
  width: 100%;
  height: 0.35rem;
  border-radius: 9999px;
  background: var(--color-sand);
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  background: var(--color-chain-lime);
  border-radius: 9999px;
  transition: width 300ms ease;
}

/* 1-Tap Action Buttons */
.card-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
  margin-top: 0.35rem;
}

.native-btn {
  display: grid;
  place-items: center;
  text-align: center;
  padding: 0.5rem 0.65rem;
  border-radius: 0.75rem;
  font-size: 0.76rem;
  font-weight: 850;
  text-decoration: none;
  transition: transform 90ms ease;
}

.native-btn:active {
  transform: scale(0.96);
}

.native-btn--primary {
  background: var(--color-ink);
  color: var(--color-white);
}

.native-btn--secondary {
  background: var(--color-sand);
  color: var(--color-ink);
}

/* Guest & Empty */
.native-guest-box,
.empty-garage-box {
  display: grid;
  gap: 1rem;
  text-align: center;
  padding: 2.25rem 1.5rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.guest-icon,
.empty-icon {
  font-size: 3.2rem;
}

.native-guest-box h2,
.empty-garage-box h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 850;
}

.native-guest-box p,
.empty-garage-box p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.guest-btn-group {
  display: grid;
  gap: 0.65rem;
}
</style>
