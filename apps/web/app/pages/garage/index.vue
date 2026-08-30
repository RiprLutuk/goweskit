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

function bikeTypeSvg(slug: string): string {
  const map: Record<string, string> = {
    folding: '/bikes/folding.svg',
    gravel: '/bikes/gravel.svg',
    mtb_hardtail: '/bikes/mtb_hardtail.svg',
    road: '/bikes/road.svg',
  };
  return map[slug] ?? '/bikes/mtb_hardtail.svg';
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
  <div class="garage-page-wrapper">
    <!-- PAGE HERO HEADER -->
    <header class="garage-hero">
      <div class="garage-hero__inner">
        <div class="garage-hero__top">
          <div class="garage-badge">
            <span class="garage-badge__dot" />
            <span>Workshop Pribadi</span>
          </div>
          <span v-if="user && bikes.length" class="counter-chip">
            {{ bikes.length }} Sepeda Terdaftar
          </span>
        </div>

        <div class="garage-hero__main">
          <div>
            <h1 class="garage-hero__title">My Garage</h1>
            <p class="garage-hero__subtitle">
              Simpan anatomi sepeda, pantau standar teknis terverifikasi, dan catat servis secara digital tanpa tebak-tebakan merek.
            </p>
          </div>
          <NuxtLink v-if="user" class="add-bike-btn" to="/garage/new">
            <GIcon name="plus" size="xs" color="#17202A" />
            <span>Tambah Sepeda</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <div class="garage-content-container">
      <!-- Loading Skeleton State -->
      <div v-if="loading" class="bike-cards-grid">
        <div v-for="i in 2" :key="i" class="bike-card skeleton-card-box">
          <div class="skeleton-shimmer" style="width: 100%; height: 11rem; border-radius: 0.85rem;" />
          <div style="padding: 1rem; display: grid; gap: 0.65rem;">
            <div class="skeleton-shimmer" style="width: 55%; height: 1.4rem; border-radius: 0.4rem;" />
            <div class="skeleton-shimmer" style="width: 75%; height: 0.9rem; border-radius: 0.35rem;" />
            <div class="skeleton-shimmer" style="width: 100%; height: 2.2rem; border-radius: 0.65rem; margin-top: 0.5rem;" />
          </div>
        </div>
      </div>

      <!-- SIGNED-OUT SHOWCASE HERO CARD (CLEAN WORKSHOP DESIGN) -->
      <div v-else-if="!user" class="garage-guest-card">
        <!-- Artwork Illustration Banner -->
        <div class="guest-card__artwork">
          <img
            src="/bikes/mtb_hardtail.svg"
            alt="Ilustrasi Garasi Sepeda"
            class="guest-artwork-svg"
          />
        </div>

        <!-- Content Details -->
        <div class="guest-card__body">
          <div class="guest-card__header">
            <span class="guest-pill">FITUR WORKSHOP</span>
            <h2>Buka Garasi Sepeda Anda</h2>
            <p>
              Simpan spesifikasi 17 titik komponen (as roda, headset, BB, rantai) dan pantau jadwal servis berkala sepeda Anda secara digital di GowesKit.
            </p>
          </div>

          <!-- Feature Value Badges -->
          <div class="guest-features-grid">
            <div class="feature-chip">
              <div class="feature-icon-box">
                <GIcon name="frame" size="sm" color="#17202A" />
              </div>
              <div>
                <strong>17 Standar Terverifikasi</strong>
                <small>As roda, BB, Freehub, Headset</small>
              </div>
            </div>
            <div class="feature-chip">
              <div class="feature-icon-box">
                <GIcon name="wrench" size="sm" color="#17202A" />
              </div>
              <div>
                <strong>Buku Servis Digital</strong>
                <small>Riwayat rantai &amp; part berkala</small>
              </div>
            </div>
            <div class="feature-chip">
              <div class="feature-icon-box">
                <GIcon name="upgrade" size="sm" color="#D97706" filled />
              </div>
              <div>
                <strong>Simulasi Upgrade Lab</strong>
                <small>Cek kecocokan komponen 1-klik</small>
              </div>
            </div>
          </div>

          <!-- Auth CTA Actions -->
          <div class="guest-cta-stack">
            <div class="guest-main-actions">
              <NuxtLink class="cta-btn cta-btn--primary" to="/login">
                <span>Masuk ke Akun</span>
                <span>→</span>
              </NuxtLink>
              <NuxtLink class="cta-btn cta-btn--secondary" to="/register">
                <span>Daftar Akun Baru</span>
              </NuxtLink>
            </div>

            <!-- 1-Click Instant Demo Helper -->
            <button
              class="demo-quick-btn"
              type="button"
              :disabled="demoLoggingIn"
              @click="quickDemoLogin"
            >
              <GIcon name="bolt" size="xs" color="#C9F36A" filled class="demo-bolt" />
              <span class="demo-text">
                {{ demoLoggingIn ? 'Membuka Garasi Demo…' : 'Coba Garasi Demo (1-Klik Tanpa Daftar)' }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <p
        v-else-if="errorMessage"
        class="state-card state-card--error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <!-- Bike List Section -->
      <template v-else-if="bikes.length">
        <!-- Search Filter Input -->
        <div class="garage-search-bar">
          <span class="search-icon" aria-hidden="true">
            <GIcon name="search" size="xs" />
          </span>
          <input
            v-model="filterQuery"
            type="search"
            placeholder="Cari sepeda berdasarkan nama, merek, atau tipe…"
            class="garage-search-input"
          />
          <button
            v-if="filterQuery"
            class="clear-search-btn"
            type="button"
            @click="filterQuery = ''"
          >
            <GIcon name="close" size="xs" />
          </button>
        </div>

        <!-- Bike Cards Grid -->
        <div class="bike-cards-grid">
          <article
            v-for="bike in filteredBikes"
            :key="bike.id"
            class="bike-card"
          >
            <!-- Card Cover (Photo or Vector Artwork) -->
            <div class="bike-card__cover">
              <img
                v-if="bike.photoUrl"
                :src="bike.photoUrl"
                :alt="bike.nickname"
                class="cover-image"
              />
              <div v-else class="cover-vector-box">
                <img
                  :src="bikeTypeSvg(bike.bicycleType.slug)"
                  :alt="bike.bicycleType.name"
                  class="cover-vector-svg"
                />
              </div>

              <!-- Badges on cover -->
              <div class="cover-badges-overlay">
                <span class="type-pill">
                  {{ bike.bicycleType.name }}
                </span>
                <span v-if="bike.modelYear" class="year-pill">{{ bike.modelYear }}</span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="bike-card__body">
              <div class="bike-identity">
                <h2 class="bike-name">
                  <NuxtLink :to="`/garage/${bike.id}`">{{ bike.nickname }}</NuxtLink>
                </h2>
                <p class="bike-spec-sub">
                  {{ [bike.brand, bike.model].filter(Boolean).join(' · ') || 'Custom Build / Rakitan' }}
                </p>
              </div>

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

              <!-- Card Action Buttons -->
              <div class="bike-card-actions">
                <NuxtLink class="action-link action-link--secondary" :to="`/garage/${bike.id}`">
                  <GIcon name="wrench" size="xs" />
                  <span>Spesifikasi &amp; Servis</span>
                </NuxtLink>
                <NuxtLink class="action-link action-link--primary" :to="`/upgrade-lab?bike=${bike.id}`">
                  <GIcon name="upgrade" size="xs" filled />
                  <span>Cek Upgrade</span>
                </NuxtLink>
              </div>
            </div>
          </article>
        </div>
      </template>

      <!-- Empty Garage State for Signed-in user with 0 bikes -->
      <div v-else class="empty-garage-card">
        <div class="empty-artwork-box">
          <img src="/bikes/gravel.svg" alt="Garasi Kosong" class="empty-artwork-svg" />
        </div>
        <div class="empty-garage-content">
          <span class="guest-pill">GARASI SIAP DIGUNAKAN</span>
          <h2>Garasi Anda Masih Kosong</h2>
          <p>
            Daftarkan sepeda pertama Anda untuk mulai mencatat anatomi komponen, riwayat servis berkala, dan memeriksa kompatibilitas upgrade.
          </p>
          <NuxtLink class="cta-btn cta-btn--primary" to="/garage/new">
            <GIcon name="plus" size="xs" color="#17202A" />
            <span>Daftarkan Sepeda Pertama</span>
            <span>→</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.garage-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 3rem;
}

/* ══════════════════════════════════════════════════════════
   HERO / HEADER SECTION
   ══════════════════════════════════════════════════════════ */
.garage-hero {
  background: var(--color-white);
  border-bottom: 1.5px solid var(--color-sand);
  padding: 1.25rem 1rem 1.5rem;
  margin: -1rem -1rem 0 -1rem;
}

@media (min-width: 640px) {
  .garage-hero {
    border-radius: 1.5rem;
    border: 1.5px solid var(--color-sand);
    margin: 0;
    padding: 1.5rem 1.75rem 1.75rem;
  }
}

.garage-hero__inner {
  max-width: 54rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.garage-hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.garage-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-asphalt);
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  width: fit-content;
}

.garage-badge__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #16A34A;
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

.garage-hero__main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.garage-hero__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--color-ink);
  line-height: 1.2;
}

.garage-hero__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.86rem;
  color: var(--color-asphalt);
  line-height: 1.45;
  max-width: 40rem;
}

.add-bike-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-size: 0.8rem;
  font-weight: 850;
  text-decoration: none;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  transition: transform 90ms ease, box-shadow 90ms ease;
  white-space: nowrap;
}

.add-bike-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--color-ink);
}

/* ══════════════════════════════════════════════════════════
   CONTAINER & GUEST SHOWCASE CARD
   ══════════════════════════════════════════════════════════ */
.garage-content-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 54rem;
  margin: 0 auto;
  width: 100%;
}

.garage-guest-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(23, 32, 42, 0.05);
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .garage-guest-card {
    flex-direction: row;
  }
}

.guest-card__artwork {
  background: #F8FAFC;
  border-bottom: 1.5px solid var(--color-sand);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .guest-card__artwork {
    width: 42%;
    border-bottom: none;
    border-right: 1.5px solid var(--color-sand);
    padding: 2rem;
  }
}

.guest-artwork-svg {
  width: 100%;
  max-width: 16rem;
  height: auto;
  object-fit: contain;
}

.guest-card__body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
}

.guest-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.guest-pill {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #0284C7;
  background: #E0F2FE;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  width: fit-content;
}

.guest-card__header h2 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.guest-card__header p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.45;
}

/* Feature Value Badges */
.guest-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.65rem;
}

.feature-chip {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.feature-icon {
  font-size: 1.25rem;
}

.feature-chip strong {
  font-size: 0.78rem;
  font-weight: 850;
  color: var(--color-ink);
  display: block;
}

.feature-chip small {
  font-size: 0.68rem;
  color: var(--color-asphalt);
  display: block;
}

/* CTA Stack */
.guest-cta-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.guest-main-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1rem;
  border-radius: 0.85rem;
  font-size: 0.84rem;
  font-weight: 850;
  text-decoration: none;
  cursor: pointer;
  transition: all 100ms ease;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
}

.cta-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--color-ink);
}

.cta-btn--primary {
  background: var(--color-ink);
  color: var(--color-white);
}

.cta-btn--secondary {
  background: var(--color-white);
  color: var(--color-ink);
}

.demo-quick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  font-size: 0.82rem;
  font-weight: 850;
  cursor: pointer;
  transition: transform 90ms ease, box-shadow 90ms ease;
}

.demo-quick-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--color-ink);
}

.demo-bolt {
  font-size: 0.95rem;
}

/* ══════════════════════════════════════════════════════════
   AUTHENTICATED BIKE LIST
   ══════════════════════════════════════════════════════════ */
.garage-search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  box-shadow: 0 2px 8px rgba(23, 32, 42, 0.03);
}

.search-icon {
  font-size: 0.9rem;
  opacity: 0.6;
}

.garage-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--color-ink);
}

.clear-search-btn {
  border: none;
  background: none;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  cursor: pointer;
}

/* Bike Cards Grid */
.bike-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1.25rem;
}

.bike-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.35rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(23, 32, 42, 0.04);
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.bike-card:hover {
  border-color: var(--color-ink);
  box-shadow: 0 8px 24px rgba(23, 32, 42, 0.07);
}

.bike-card__cover {
  position: relative;
  width: 100%;
  height: 10rem;
  background: #F8FAFC;
  border-bottom: 1.5px solid var(--color-sand);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-vector-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.cover-vector-svg {
  width: 100%;
  height: 100%;
  max-width: 15rem;
  object-fit: contain;
}

.cover-badges-overlay {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.type-pill {
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--color-ink);
  border: 1px solid rgba(23, 32, 42, 0.12);
}

.year-pill {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: rgba(23, 32, 42, 0.85);
  color: var(--color-white);
}

.bike-card__body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex: 1;
}

.bike-identity {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.bike-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
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
  font-weight: 750;
}

/* Standards Gauge */
.standards-gauge {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.gauge-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 800;
}

.gauge-known strong {
  color: #166534;
}

.gauge-unknown {
  color: #0369a1;
  background: #e0f2fe;
  padding: 0.05rem 0.35rem;
  border-radius: 0.35rem;
  font-size: 0.65rem;
}

.gauge-track {
  width: 100%;
  height: 0.4rem;
  border-radius: 9999px;
  background: var(--color-sand);
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  background: #16A34A;
  border-radius: 9999px;
  transition: width 300ms ease;
}

.bike-card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.action-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.76rem;
  font-weight: 850;
  text-decoration: none;
  transition: all 100ms ease;
  text-align: center;
}

.action-link:active {
  transform: scale(0.96);
}

.action-link--primary {
  background: var(--color-ink);
  color: var(--color-white);
  border: 1.5px solid var(--color-ink);
}

.action-link--secondary {
  background: var(--color-canvas);
  color: var(--color-ink);
  border: 1.5px solid var(--color-sand);
}

/* ══════════════════════════════════════════════════════════
   EMPTY GARAGE STATE
   ══════════════════════════════════════════════════════════ */
.empty-garage-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.5rem;
  overflow: hidden;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.25rem;
}

.empty-artwork-box {
  width: 100%;
  max-width: 14rem;
}

.empty-artwork-svg {
  width: 100%;
  height: auto;
}

.empty-garage-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  max-width: 28rem;
}

.empty-garage-content h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--color-ink);
}

.empty-garage-content p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.45;
}

/* State Cards */
.state-card {
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  text-align: center;
  font-size: 0.85rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

.state-card--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-sand);
  border-top-color: var(--color-ink);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.state-card--error {
  background: #FEE2E2;
  border-color: #FCA5A5;
  color: #991B1B;
}
</style>
