<script setup lang="ts">
import type { BikeListResponse, ContributorReputationResponse } from '@goweskit/contracts';
import type { TrustedContactListResponse } from '@goweskit/contracts/safety';

const api = useApi();
const { user, initialized, refresh, logout, login } = useAuth();
const { canInstall, isStandalone, isIOS, showInstallGuide, installApp, triggerHaptic } = usePwa();
const errorMessage = ref('');
const signingOut = ref(false);
const demoLoggingIn = ref(false);
const hapticFeedbackSent = ref(false);

function testHaptic(): void {
  triggerHaptic([30, 60, 30]);
  hapticFeedbackSent.value = true;
  setTimeout(() => {
    hapticFeedbackSent.value = false;
  }, 2000);
}

const bikeCount = ref(0);
const contactCount = ref(0);
const reputationScore = ref(0);

// Preferences
const distanceUnit = ref('km');
const highContrast = ref(false);
const autoLocation = ref(true);

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value) {
    await loadUserStats();
  }
});

async function loadUserStats(): Promise<void> {
  try {
    const [bikesRes, contactsRes, repRes] = await Promise.allSettled([
      api<BikeListResponse>('/bikes'),
      api<TrustedContactListResponse>('/trusted-contacts'),
      api<ContributorReputationResponse>('/community/reputation/me'),
    ]);
    if (bikesRes.status === 'fulfilled') bikeCount.value = bikesRes.value.bikes.length;
    if (contactsRes.status === 'fulfilled') contactCount.value = contactsRes.value.contacts.length;
    if (repRes.status === 'fulfilled') reputationScore.value = repRes.value.reputation.score;
  } catch {
    // optional stats
  }
}

async function signOut(): Promise<void> {
  if (!window.confirm('Yakin ingin keluar dari akun GowesKit?')) return;
  signingOut.value = true;
  errorMessage.value = '';
  try {
    await logout();
    bikeCount.value = 0;
    contactCount.value = 0;
    reputationScore.value = 0;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    signingOut.value = false;
  }
}

async function quickDemoLogin(): Promise<void> {
  demoLoggingIn.value = true;
  errorMessage.value = '';
  try {
    await login({
      email: 'demo@goweskit.local',
      password: 'GowesKitDemo123!',
    });
    await loadUserStats();
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    demoLoggingIn.value = false;
  }
}
</script>

<template>
  <div class="native-container profile-container">
    <!-- Header -->
    <header class="native-page-header">
      <span class="native-eyebrow">Profil &amp; Akun</span>
      <h1 class="native-title">Pengaturan Saya</h1>
      <p class="native-sub">Kelola garasi sepeda, kontak darurat, preferensi display, dan aplikasi PWA.</p>
    </header>

    <p v-if="!initialized" class="state-card" role="status">
      Memeriksa sesi akun…
    </p>

    <!-- 1. LOGGED IN STATE -->
    <template v-else-if="user">
      <!-- Profile Hero Card (Apple Health / Strava Style) -->
      <section class="native-hero-card" aria-label="Profil Rider">
        <div class="hero-user-row">
          <div class="hero-avatar">
            <span>{{ user.displayName.slice(0, 1).toUpperCase() }}</span>
          </div>
          <div class="hero-user-info">
            <h2>{{ user.displayName }}</h2>
            <p>{{ user.email }}</p>
            <div class="hero-badge-row">
              <span class="status-chip status-chip--lime">✓ Rider Terverifikasi</span>
              <span class="status-chip status-chip--sand">Member GowesKit</span>
            </div>
          </div>
        </div>

        <!-- 3-Metric Quick Counters -->
        <div class="hero-metrics-grid">
          <NuxtLink to="/garage" class="metric-card">
            <span class="metric-icon">🚲</span>
            <span class="metric-value">{{ bikeCount }}</span>
            <span class="metric-label">Sepeda Garasi</span>
          </NuxtLink>

          <NuxtLink to="/safety" class="metric-card">
            <span class="metric-icon">🛡️</span>
            <span class="metric-value">{{ contactCount }}</span>
            <span class="metric-label">Kontak Darurat</span>
          </NuxtLink>

          <NuxtLink to="/community/reputation" class="metric-card">
            <span class="metric-icon">🏆</span>
            <span class="metric-value">{{ reputationScore }}</span>
            <span class="metric-label">Skor Reputasi</span>
          </NuxtLink>
        </div>
      </section>

      <!-- 2. INSET GROUPED LIST: WORKSHOP & GARAGE -->
      <section class="native-section">
        <h3 class="section-label">Garasi &amp; Workshop</h3>
        <div class="native-grouped-list">
          <NuxtLink to="/garage" class="list-item">
            <div class="item-icon-box bg-lime">🚲</div>
            <div class="item-content">
              <strong>My Garage</strong>
              <small>Kelola sepeda, spesifikasi komponen, &amp; foto</small>
            </div>
            <span class="item-chevron">›</span>
          </NuxtLink>

          <NuxtLink to="/upgrade-lab" class="list-item">
            <div class="item-icon-box bg-sky">⚡</div>
            <div class="item-content">
              <strong>Upgrade Lab</strong>
              <small>Simulasi kecocokan komponen &amp; standar teknis</small>
            </div>
            <span class="item-chevron">›</span>
          </NuxtLink>

          <NuxtLink to="/learn" class="list-item">
            <div class="item-icon-box bg-sand">📚</div>
            <div class="item-content">
              <strong>Katalog Anatomi &amp; Tipe Sepeda</strong>
              <small>Pelajari standar as roda, headset, bottom bracket</small>
            </div>
            <span class="item-chevron">›</span>
          </NuxtLink>
        </div>
      </section>

      <!-- 3. INSET GROUPED LIST: SAFETY & COMMUNITY -->
      <section class="native-section">
        <h3 class="section-label">Keamanan &amp; Komunitas</h3>
        <div class="native-grouped-list">
          <NuxtLink to="/safety" class="list-item">
            <div class="item-icon-box bg-coral">🛡️</div>
            <div class="item-content">
              <strong>Ride Safety &amp; Live Tracking</strong>
              <small>Kontak terpercaya &amp; sesi gowes solo aman</small>
            </div>
            <span class="item-chevron">›</span>
          </NuxtLink>

          <NuxtLink to="/community" class="list-item">
            <div class="item-icon-box bg-lime">👥</div>
            <div class="item-content">
              <strong>Komunitas &amp; Event Gowes</strong>
              <small>Jadwal mabar, rute bersama, &amp; teman se-hobi</small>
            </div>
            <span class="item-chevron">›</span>
          </NuxtLink>

          <NuxtLink to="/community/reputation" class="list-item">
            <div class="item-icon-box bg-sand">🏅</div>
            <div class="item-content">
              <strong>Skor &amp; Riwayat Kontribusi</strong>
              <small>Poin reputasi laporan rute, review spot, &amp; GPX</small>
            </div>
            <span class="item-chevron">›</span>
          </NuxtLink>
        </div>
      </section>

      <!-- 4. INSET GROUPED LIST: PREFERENCES & DISPLAY -->
      <section class="native-section">
        <h3 class="section-label">Preferensi Tampilan</h3>
        <div class="native-grouped-list">
          <div class="list-item no-click">
            <div class="item-icon-box bg-sand">📏</div>
            <div class="item-content">
              <strong>Satuan Jarak</strong>
              <small>Format pengukuran rute dan servis</small>
            </div>
            <select v-model="distanceUnit" class="native-inline-select">
              <option value="km">Kilometer (km)</option>
              <option value="miles">Mil (miles)</option>
            </select>
          </div>

          <div class="list-item no-click">
            <div class="item-icon-box bg-sand">📍</div>
            <div class="item-content">
              <strong>Deteksi GPS Otomatis</strong>
              <small>Fokuskan peta ke lokasi saya saat dibuka</small>
            </div>
            <input v-model="autoLocation" type="checkbox" class="native-toggle" />
          </div>

          <div class="list-item no-click">
            <div class="item-icon-box bg-sand">🎨</div>
            <div class="item-content">
              <strong>Kontras Tinggi Diagram</strong>
              <small>Pertegas garis anatomi rangka sepeda</small>
            </div>
            <input v-model="highContrast" type="checkbox" class="native-toggle" />
          </div>
        </div>
      </section>

      <!-- 5. INSET GROUPED LIST: NATIVE PWA & HARDWARE -->
      <section class="native-section">
        <h3 class="section-label">Aplikasi PWA &amp; Fitur Native</h3>
        <div class="native-grouped-list">
          <div class="list-item no-click">
            <div class="item-icon-box bg-lime">📲</div>
            <div class="item-content">
              <strong>Status Mode Aplikasi</strong>
              <small v-if="isStandalone">Telah terpasang sebagai Standalone PWA</small>
              <small v-else-if="canInstall">Siap di-install ke layar beranda HP</small>
              <small v-else>Berjalan di browser web mobile</small>
            </div>
            <span class="status-pill-small" :class="isStandalone ? 'pill--green' : 'pill--blue'">
              {{ isStandalone ? 'Standalone' : (canInstall ? 'Siap Install' : 'Web') }}
            </span>
          </div>

          <button
            v-if="!isStandalone && (canInstall || isIOS)"
            class="list-item list-item--action"
            type="button"
            @click="isIOS ? (showInstallGuide = true) : installApp()"
          >
            <div class="item-icon-box bg-lime">⚡</div>
            <div class="item-content">
              <strong class="text-primary">{{ isIOS ? 'Tambah ke Home Screen (iOS Safari)' : 'Install GowesKit ke HP' }}</strong>
              <small>Nikmati akses offline cepat dan layar penuh</small>
            </div>
            <span class="item-chevron">›</span>
          </button>

          <button class="list-item list-item--action" type="button" @click="testHaptic">
            <div class="item-icon-box bg-sky">📳</div>
            <div class="item-content">
              <strong>Uji Respon Getar (Haptic Feedback)</strong>
              <small>{{ hapticFeedbackSent ? '✓ Berhasil Bergetar!' : 'Sentuhan tombol SOS & navigasi' }}</small>
            </div>
            <span class="test-badge">{{ hapticFeedbackSent ? '✓ Aktif' : 'Tes' }}</span>
          </button>
        </div>
      </section>

      <!-- 6. LOGOUT BUTTON -->
      <section class="native-section">
        <div class="native-grouped-list">
          <button
            class="list-item list-item--danger"
            type="button"
            :disabled="signingOut"
            @click="signOut"
          >
            <div class="item-icon-box bg-danger">🚪</div>
            <div class="item-content">
              <strong>{{ signingOut ? 'Keluar Akun…' : 'Keluar dari Akun' }}</strong>
            </div>
            <span class="item-chevron">›</span>
          </button>
        </div>
      </section>
    </template>

    <!-- 7. SIGNED OUT / GUEST STATE -->
    <div v-else class="native-guest-card">
      <div class="guest-icon">🚲</div>
      <h2>Anda Berada dalam Mode Tamu</h2>
      <p>
        Masuk akun GowesKit untuk menyimpan sepeda di My Garage, mencatat riwayat servis, dan mengaktifkan fitur keselamatan solo-ride.
      </p>

      <div class="guest-actions">
        <NuxtLink class="button button--primary button--full" to="/login">
          Masuk ke Akun
        </NuxtLink>
        <NuxtLink class="button button--secondary button--full" to="/register">
          Daftar Akun Baru
        </NuxtLink>
        <button
          class="button button--sand button--full"
          type="button"
          :disabled="demoLoggingIn"
          @click="quickDemoLogin"
        >
          {{ demoLoggingIn ? 'Memuat Demo…' : '⚡ Masuk dengan Akun Demo (1-Klik)' }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="state-card state-card--error" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.profile-container {
  display: grid;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.native-page-header {
  display: grid;
  gap: 0.25rem;
}

.native-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.05em;
}

.native-title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.native-sub {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* Hero Profile Card */
.native-hero-card {
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 20px rgb(23 32 42 / 5%);
}

.hero-user-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero-avatar {
  width: 3.8rem;
  height: 3.8rem;
  border-radius: 1rem;
  background: var(--color-chain-lime);
  border: 2px solid var(--color-ink);
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  flex-shrink: 0;
}

.hero-user-info {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.hero-user-info h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-user-info p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-badge-row {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.2rem;
  flex-wrap: wrap;
}

/* 3-Metrics Grid */
.hero-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.65rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-sand);
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.65rem 0.4rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  text-decoration: none;
  color: var(--color-ink);
  transition: transform 90ms ease, background-color 120ms ease;
}

.metric-card:active {
  transform: scale(0.96);
  background: rgb(201 243 106 / 20%);
}

.metric-icon {
  font-size: 1.15rem;
  margin-bottom: 0.15rem;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.metric-label {
  font-size: 0.66rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

/* Native Inset Grouped Lists (iOS Settings Style) */
.native-section {
  display: grid;
  gap: 0.45rem;
}

.section-label {
  margin: 0 0 0 0.35rem;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.04em;
}

.native-grouped-list {
  display: flex;
  flex-direction: column;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  overflow: hidden;
  box-shadow: 0 2px 10px rgb(23 32 42 / 3%);
}

.list-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: var(--color-ink);
  background: var(--color-white);
  border: none;
  border-bottom: 1px solid rgb(23 32 42 / 6%);
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color 100ms ease;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:not(.no-click):active {
  background: rgb(23 32 42 / 4%);
}

.list-item--danger strong {
  color: #dc2626;
}

.item-icon-box {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.65rem;
  display: grid;
  place-items: center;
  font-size: 1.05rem;
  flex-shrink: 0;
}

.bg-lime {
  background: rgb(201 243 106 / 40%);
}

.bg-sky {
  background: rgb(142 221 244 / 45%);
}

.bg-coral {
  background: rgb(255 140 117 / 30%);
}

.bg-sand {
  background: var(--color-sand);
}

.bg-danger {
  background: #fee2e2;
}

.item-content {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.item-content strong {
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.item-content small {
  font-size: 0.72rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-chevron {
  font-size: 1.15rem;
  color: var(--color-asphalt);
  opacity: 0.45;
  font-weight: 600;
}

.native-inline-select {
  padding: 0.35rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-sand);
  background: var(--color-sand);
  font-size: 0.78rem;
  font-weight: 750;
  color: var(--color-ink);
  outline: none;
}

.native-toggle {
  width: 2.5rem;
  height: 1.4rem;
  accent-color: var(--color-ink);
  cursor: pointer;
}

.status-pill-small {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.pill--green {
  background: rgb(201 243 106 / 50%);
  color: #166534;
}

.pill--blue {
  background: #e0f2fe;
  color: #0369a1;
}

.test-badge {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 0.5rem;
  background: var(--color-sand);
  color: var(--color-ink);
}

/* Guest Card */
.native-guest-card {
  display: grid;
  gap: 1rem;
  text-align: center;
  padding: 2rem 1.5rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.guest-icon {
  font-size: 3rem;
}

.native-guest-card h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 850;
}

.native-guest-card p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.guest-actions {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.5rem;
}
</style>
