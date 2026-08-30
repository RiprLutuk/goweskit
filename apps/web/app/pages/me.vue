<script setup lang="ts">
import type { BikeListResponse, ContributorReputationResponse } from '@goweskit/contracts';
import type { TrustedContactListResponse } from '@goweskit/contracts/safety';

const api = useApi();
const { user, initialized, refresh, logout, login } = useAuth();
const { canInstall, isStandalone, isIOS, showInstallGuide, installApp, triggerHaptic } = usePwa();
const { toast, alert } = useNotify();

const errorMessage = ref('');
const signingOut = ref(false);
const demoLoggingIn = ref(false);
const hapticFeedbackSent = ref(false);

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
    // stats are optional
  }
}

async function shareRiderProfile(): Promise<void> {
  if (!user.value) return;
  const name = user.value.displayName;
  const url = window.location.origin;

  const text = `🚴 GOWESKIT VERIFIED RIDER PASS
━━━━━━━━━━━━━━━━━━━━
👤 Rider: ${name}
🚲 Garasi Sepeda: ${bikeCount.value} Sepeda Terverifikasi
🛡️ Kontak Darurat: ${contactCount.value} Kontak Terhubung
🏆 Reputasi Komunitas: ${reputationScore.value} Poin

🔗 Digitalisasikan sepeda & eksplorasi rute gowes di:
${url}

#GowesKit #RiderPassport #GowesIndonesia #CyclingProfile`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Rider Pass: ${name} - GowesKit`,
        text,
        url,
      });
      toast.success('Rider Pass Dibagikan!', 'Siap dipajang di media sosial.');
      return;
    } catch {
      // ignore
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success('Rider Pass Disalin!', 'Siap ditempel ke WhatsApp Status.');
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
  }
}

function testHaptic(): void {
  triggerHaptic([30, 60, 30]);
  hapticFeedbackSent.value = true;
  toast.info('Haptic Feedback Aktif', 'Getaran respon perangkat berhasil dipicu.');
  setTimeout(() => {
    hapticFeedbackSent.value = false;
  }, 2000);
}

async function signOut(): Promise<void> {
  const confirmed = await alert.confirm({
    title: 'Keluar dari Akun?',
    text: 'Sesi login Anda akan diakhiri dengan aman.',
    confirmText: 'Ya, Keluar Akun',
    cancelText: 'Tetap Masuk',
    icon: 'warning',
  });
  if (!confirmed) return;

  signingOut.value = true;
  errorMessage.value = '';
  try {
    await logout();
    bikeCount.value = 0;
    contactCount.value = 0;
    reputationScore.value = 0;
    toast.success('Berhasil Keluar', 'Sampai jumpa di gowes berikutnya!');
  } catch (error: unknown) {
    const msg = getApiErrorMessage(error);
    errorMessage.value = msg;
    alert.error('Gagal Keluar Akun', msg);
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
    toast.success('Login Demo Berhasil', 'Masuk sebagai Demo Rider.');
    await loadUserStats();
  } catch (error: unknown) {
    const msg = getApiErrorMessage(error);
    errorMessage.value = msg;
    alert.error('Gagal Masuk Demo', msg);
  } finally {
    demoLoggingIn.value = false;
  }
}
</script>

<template>
  <div class="native-container profile-container">
    <!-- Header -->
    <header class="native-page-header">
      <div class="header-topline">
        <span class="native-eyebrow">Rider Profile</span>
        <span v-if="user" class="status-pill-header">
          <span class="online-dot" /> Online
        </span>
      </div>
      <h1 class="native-title">Pengaturan Saya</h1>
      <p class="native-sub">Kelola garasi sepeda, kontak keselamatan solo, dan preferensi aplikasi GowesKit.</p>
    </header>

    <!-- Skeleton Profile Shimmer during Loading -->
    <div v-if="!initialized" class="pro-rider-card" style="padding: 1.25rem; display: grid; gap: 1rem;">
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="skeleton-shimmer" style="width: 3.5rem; height: 3.5rem; border-radius: 50%;" />
        <div style="flex: 1; display: grid; gap: 0.4rem;">
          <div class="skeleton-shimmer" style="width: 50%; height: 1.2rem; border-radius: 0.35rem;" />
          <div class="skeleton-shimmer" style="width: 70%; height: 0.85rem; border-radius: 0.3rem;" />
        </div>
      </div>
      <div class="skeleton-shimmer" style="width: 100%; height: 3.5rem; border-radius: 0.85rem;" />
    </div>

    <!-- ══════════════════════════════════════════════════════════
         1. LOGGED IN STATE (RIDER COCKPIT)
         ══════════════════════════════════════════════════════════ -->
    <template v-else-if="user">
      <!-- Athlete Profile Hero Card -->
      <section class="pro-rider-card" aria-label="Profil Rider">
        <div class="rider-header-row">
          <div class="rider-avatar">
            <span>{{ user.displayName.slice(0, 1).toUpperCase() }}</span>
          </div>
          <div class="rider-info">
            <div class="rider-name-row">
              <h2>{{ user.displayName }}</h2>
              <span class="rider-verified-badge" title="Rider Terverifikasi">
                <GIcon name="check" size="xs" color="#15803D" filled />
              </span>
            </div>
            <p class="rider-email">{{ user.email }}</p>
            <div class="rider-tags">
              <span class="rider-tag rider-tag--lime">Member GowesKit</span>
              <span class="rider-tag rider-tag--sand">Solo &amp; Pelotons</span>
            </div>
          </div>
        </div>

        <!-- 3-Metric Athletic Counter Strip -->
        <div class="rider-metrics-strip">
          <NuxtLink to="/garage" class="metric-col">
            <span class="metric-num">{{ bikeCount }}</span>
            <span class="metric-label">
              <GIcon name="bike" size="xs" /> Sepeda
            </span>
          </NuxtLink>
          <div class="metric-divider" />
          <NuxtLink to="/safety" class="metric-col">
            <span class="metric-num">{{ contactCount }}</span>
            <span class="metric-label">
              <GIcon name="shield" size="xs" /> Kontak
            </span>
          </NuxtLink>
          <div class="metric-divider" />
          <NuxtLink to="/community/reputation" class="metric-col">
            <span class="metric-num">{{ reputationScore }}</span>
            <span class="metric-label">
              <GIcon name="trophy" size="xs" /> Poin
            </span>
          </NuxtLink>
        </div>

        <div class="rider-card-actions">
          <button
            type="button"
            class="rider-share-btn"
            @click="shareRiderProfile"
          >
            <GIcon name="share" size="xs" />
            <span>Bagikan Rider Pass</span>
            <span>→</span>
          </button>
        </div>
      </section>

      <!-- 2. INSET GROUPED LIST: WORKSHOP & BIKES -->
      <section class="settings-group">
        <h3 class="group-heading">Garasi &amp; Media</h3>
        <div class="inset-list">
          <NuxtLink to="/ride-flex" class="inset-item">
            <div class="item-icon-box item-icon--lime">
              <GIcon name="camera" size="sm" />
            </div>
            <div class="item-body">
              <strong>Ride Flex Studio &amp; Poster AI</strong>
              <small>Buat poster Strava-killer HD &amp; caption medsos otomatis</small>
            </div>
            <GIcon name="chevron-right" size="xs" color="#94A3B8" />
          </NuxtLink>

          <NuxtLink to="/garage" class="inset-item">
            <div class="item-icon-box item-icon--sand">
              <GIcon name="bike" size="sm" />
            </div>
            <div class="item-body">
              <strong>My Garage</strong>
              <small>Kelola koleksi sepeda, foto, &amp; anatomi komponen</small>
            </div>
            <GIcon name="chevron-right" size="xs" color="#94A3B8" />
          </NuxtLink>

          <NuxtLink to="/upgrade-lab" class="inset-item">
            <div class="item-icon-box item-icon--sky">
              <GIcon name="upgrade" size="sm" filled />
            </div>
            <div class="item-body">
              <strong>Upgrade Lab</strong>
              <small>Simulasi kecocokan suku cadang &amp; standar as roda</small>
            </div>
            <GIcon name="chevron-right" size="xs" color="#94A3B8" />
          </NuxtLink>

          <NuxtLink to="/learn" class="inset-item">
            <div class="item-icon-box item-icon--sand">
              <GIcon name="passport" size="sm" />
            </div>
            <div class="item-body">
              <strong>Ensiklopedia Anatomi Sepeda</strong>
              <small>Kamus standar BB, headset, axle, &amp; rantai</small>
            </div>
            <GIcon name="chevron-right" size="xs" color="#94A3B8" />
          </NuxtLink>
        </div>
      </section>

      <!-- 3. INSET GROUPED LIST: SAFETY & COMMUNITY -->
      <section class="settings-group">
        <h3 class="group-heading">Keamanan &amp; Komunitas</h3>
        <div class="inset-list">
          <NuxtLink to="/safety" class="inset-item">
            <div class="item-icon-box item-icon--coral">
              <GIcon name="shield" size="sm" color="#FF8C75" filled />
            </div>
            <div class="item-body">
              <strong>Ride Safety Beacon</strong>
              <small>Live tracking solo-ride, SOS darurat, &amp; kontak</small>
            </div>
            <GIcon name="chevron-right" size="xs" color="#94A3B8" />
          </NuxtLink>

          <NuxtLink to="/community" class="inset-item">
            <div class="item-icon-box item-icon--lime">
              <GIcon name="community" size="sm" color="#17202A" />
            </div>
            <div class="item-body">
              <strong>Komunitas &amp; Jadwal Mabar</strong>
              <small>Grup gowes lokal, mabar bareng, &amp; event</small>
            </div>
            <GIcon name="chevron-right" size="xs" color="#94A3B8" />
          </NuxtLink>

          <NuxtLink to="/community/reputation" class="inset-item">
            <div class="item-icon-box item-icon--amber">
              <GIcon name="trophy" size="sm" color="#D97706" filled />
            </div>
            <div class="item-body">
              <strong>Skor &amp; Riwayat Kontribusi</strong>
              <small>Poin reputasi sharing rute &amp; review bengkel</small>
            </div>
            <GIcon name="chevron-right" size="xs" color="#94A3B8" />
          </NuxtLink>
        </div>
      </section>

      <!-- 4. INSET GROUPED LIST: PREFERENCES -->
      <section class="settings-group">
        <h3 class="group-heading">Preferensi &amp; Display</h3>
        <div class="inset-list">
          <div class="inset-item inset-item--static">
            <div class="item-icon-box item-icon--sand">
              <GIcon name="route" size="sm" />
            </div>
            <div class="item-body">
              <strong>Satuan Jarak</strong>
              <small>Format elevasi dan jarak tempuh rute</small>
            </div>
            <select v-model="distanceUnit" class="custom-select">
              <option value="km">Kilometer (km)</option>
              <option value="miles">Mil (miles)</option>
            </select>
          </div>

          <div class="inset-item inset-item--static">
            <div class="item-icon-box item-icon--sand">
              <GIcon name="pin" size="sm" />
            </div>
            <div class="item-body">
              <strong>Auto GPS Location</strong>
              <small>Otomatis pusatkan peta &amp; cuaca di titik Anda</small>
            </div>
            <input v-model="autoLocation" type="checkbox" class="toggle-checkbox" />
          </div>

          <div class="inset-item inset-item--static">
            <div class="item-icon-box item-icon--sand">
              <GIcon name="sparkles" size="sm" />
            </div>
            <div class="item-body">
              <strong>Kontras Tinggi Anatomi</strong>
              <small>Pertegas garis diagram komponen sepeda</small>
            </div>
            <input v-model="highContrast" type="checkbox" class="toggle-checkbox" />
          </div>
        </div>
      </section>

      <!-- 5. INSET GROUPED LIST: PWA & HARDWARE -->
      <section class="settings-group">
        <h3 class="group-heading">Aplikasi Mobile &amp; PWA</h3>
        <div class="inset-list">
          <div class="inset-item inset-item--static">
            <div class="item-icon-box item-icon--lime">
              <GIcon name="radar" size="sm" color="#16A34A" />
            </div>
            <div class="item-body">
              <strong>Status Aplikasi</strong>
              <small v-if="isStandalone">Telah terpasang sebagai Mobile App (PWA)</small>
              <small v-else-if="canInstall">Siap di-install ke layar utama HP</small>
              <small v-else>Berjalan di browser web mobile</small>
            </div>
            <span class="status-pill-small" :class="isStandalone ? 'pill--green' : 'pill--blue'">
              {{ isStandalone ? 'Standalone' : (canInstall ? 'Siap Install' : 'Web Browser') }}
            </span>
          </div>

          <button
            v-if="!isStandalone && (canInstall || isIOS)"
            class="inset-item"
            type="button"
            @click="isIOS ? (showInstallGuide = true) : installApp()"
          >
            <div class="item-icon-box item-icon--lime">
              <GIcon name="upgrade" size="sm" filled />
            </div>
            <div class="item-body">
              <strong class="text-accent">{{ isIOS ? 'Tambah ke Home Screen (Safari iOS)' : 'Install GowesKit ke HP' }}</strong>
              <small>Akses offline cepat dan tampilan layar penuh</small>
            </div>
            <GIcon name="chevron-right" size="xs" color="#94A3B8" />
          </button>

          <button class="inset-item" type="button" @click="testHaptic">
            <div class="item-icon-box item-icon--sky">
              <GIcon name="wind" size="sm" />
            </div>
            <div class="item-body">
              <strong>Uji Respon Getar (Haptic)</strong>
              <small>{{ hapticFeedbackSent ? '✓ Berhasil Bergetar!' : 'Sentuhan tombol darurat SOS & navigasi' }}</small>
            </div>
            <span class="haptic-chip">{{ hapticFeedbackSent ? '✓ Aktif' : 'Tes' }}</span>
          </button>
        </div>
      </section>

      <!-- 6. LOGOUT BUTTON -->
      <section class="settings-group">
        <div class="inset-list">
          <button
            class="inset-item inset-item--logout"
            type="button"
            :disabled="signingOut"
            @click="signOut"
          >
            <div class="item-icon-box item-icon--danger">
              <GIcon name="close" size="sm" color="#EF4444" />
            </div>
            <div class="item-body">
              <strong class="text-danger">{{ signingOut ? 'Keluar Akun…' : 'Keluar dari Akun' }}</strong>
            </div>
            <GIcon name="chevron-right" size="xs" color="#EF4444" />
          </button>
        </div>
      </section>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         2. GUEST STATE (PROMOTIONAL CLEAN HERO)
         ══════════════════════════════════════════════════════════ -->
    <div v-else class="pro-guest-card">
      <div class="guest-badge-circle">
        <GIcon name="bike" size="xl" color="#17202A" />
      </div>
      <h2 class="guest-title">Buka Fitur Lengkap GowesKit</h2>
      <p class="guest-sub">
        Simpan sepeda di My Garage, verifikasi standar komponen, bagikan live tracking solo-ride, dan gabung mabar komunitas.
      </p>

      <div class="guest-perks-list">
        <div class="perk-item">
          <GIcon name="check" size="xs" color="#15803D" filled />
          <span>Garasi digital &amp; spek komponen terverifikasi</span>
        </div>
        <div class="perk-item">
          <GIcon name="check" size="xs" color="#15803D" filled />
          <span>Live ride safety beacon dengan token kedaluwarsa</span>
        </div>
        <div class="perk-item">
          <GIcon name="check" size="xs" color="#15803D" filled />
          <span>Jadwal gowes mabar &amp; discover rute GPX lokal</span>
        </div>
      </div>

      <div class="guest-action-group">
        <!-- Google Sign In -->
        <GoogleSignInButton text="continue_with" />

        <div class="guest-buttons-row">
          <NuxtLink class="button button--primary button--full" to="/login">
            Masuk ke Akun
          </NuxtLink>
          <NuxtLink class="button button--secondary button--full" to="/register">
            Daftar Akun Baru
          </NuxtLink>
        </div>

        <button
          class="button button--sand button--full demo-pill-btn"
          type="button"
          :disabled="demoLoggingIn"
          @click="quickDemoLogin"
        >
          <GIcon name="bolt" size="xs" color="#D97706" filled />
          <span>{{ demoLoggingIn ? 'Memuat Demo…' : 'Jelajahi Akun Demo (1-Klik)' }}</span>
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
  gap: 1.25rem;
  padding-bottom: 2.5rem;
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

.status-pill-header {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  color: #166534;
  background: rgb(201 243 106 / 40%);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.online-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #22c55e;
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

/* ══════════════════════════════════════════════════════════
   1. PRO RIDER ATHLETE HERO CARD
   ══════════════════════════════════════════════════════════ */
.pro-rider-card {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 20px rgb(23 32 42 / 5%);
}

.rider-header-row {
  display: flex;
  align-items: center;
  gap: 0.95rem;
}

.rider-avatar {
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--color-ink) 0%, #334155 100%);
  color: var(--color-white);
  display: grid;
  place-items: center;
  font-size: 1.4rem;
  font-weight: 900;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgb(23 32 42 / 15%);
}

.rider-info {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.rider-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.rider-name-row h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rider-verified-badge {
  font-size: 0.65rem;
  font-weight: 900;
  color: #166534;
  background: var(--color-chain-lime);
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.rider-email {
  margin: 0;
  font-size: 0.76rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rider-tags {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.2rem;
}

.rider-tag {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
}

.rider-tag--lime {
  background: rgb(201 243 106 / 40%);
  color: #166534;
}

.rider-tag--sand {
  background: var(--color-sand);
  color: var(--color-asphalt);
}

/* Metrics Counter Strip */
.rider-metrics-strip {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0.75rem 0.5rem;
  border-radius: 0.95rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.metric-col {
  display: grid;
  gap: 0.1rem;
  text-align: center;
  text-decoration: none;
  color: var(--color-ink);
  flex: 1;
  transition: transform 90ms ease;
}

.metric-col:active {
  transform: scale(0.95);
}

.metric-num {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.metric-label {
  font-size: 0.68rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

.metric-divider {
  width: 1px;
  height: 1.6rem;
  background: var(--color-sand);
}

.rider-card-actions {
  display: flex;
  justify-content: flex-end;
}

.rider-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-size: 0.78rem;
  font-weight: 850;
  border: 1px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  cursor: pointer;
  transition: transform 90ms ease;
}

.rider-share-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--color-ink);
}

/* ══════════════════════════════════════════════════════════
   2. INSET GROUPED LISTS (iOS Settings Style)
   ══════════════════════════════════════════════════════════ */
.settings-group {
  display: grid;
  gap: 0.4rem;
}

.group-heading {
  margin: 0 0 0 0.35rem;
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.05em;
}

.inset-list {
  display: flex;
  flex-direction: column;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  overflow: hidden;
  box-shadow: 0 2px 8px rgb(23 32 42 / 3%);
}

.inset-item {
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

.inset-item:last-child {
  border-bottom: none;
}

.inset-item:not(.inset-item--static):active {
  background: rgb(23 32 42 / 4%);
}

.inset-item--static {
  cursor: default;
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

.item-icon--lime {
  background: rgb(201 243 106 / 45%);
}

.item-icon--sky {
  background: rgb(142 221 244 / 45%);
}

.item-icon--coral {
  background: rgb(255 140 117 / 30%);
}

.item-icon--amber {
  background: #fef3c7;
}

.item-icon--sand {
  background: var(--color-sand);
}

.item-icon--danger {
  background: #fee2e2;
}

.item-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.item-body strong {
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.item-body small {
  font-size: 0.72rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-chevron {
  font-size: 1.15rem;
  color: var(--color-asphalt);
  opacity: 0.4;
  font-weight: 600;
}

.text-accent {
  color: #166534;
}

.text-danger {
  color: #dc2626;
}

.custom-select {
  padding: 0.35rem 0.6rem;
  border-radius: 0.55rem;
  border: 1px solid var(--color-sand);
  background: var(--color-sand);
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-ink);
  outline: none;
}

.toggle-checkbox {
  width: 2.4rem;
  height: 1.35rem;
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

.haptic-chip {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 0.5rem;
  background: var(--color-sand);
  color: var(--color-ink);
}

/* ══════════════════════════════════════════════════════════
   3. PROMOTIONAL GUEST CARD
   ══════════════════════════════════════════════════════════ */
.pro-guest-card {
  display: grid;
  gap: 1.15rem;
  padding: 2rem 1.35rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 6px 24px rgb(23 32 42 / 5%);
  text-align: center;
}

.guest-badge-circle {
  width: 3.8rem;
  height: 3.8rem;
  border-radius: 50%;
  background: var(--color-canvas);
  border: 2px solid var(--color-chain-lime);
  display: grid;
  place-items: center;
  font-size: 1.8rem;
  margin: 0 auto;
}

.guest-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.guest-sub {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.guest-perks-list {
  display: grid;
  gap: 0.45rem;
  text-align: left;
  padding: 0.85rem 1rem;
  border-radius: 0.95rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.perk-item {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.78rem;
  font-weight: 750;
  color: var(--color-ink);
}

.perk-icon {
  font-weight: 900;
  color: #166534;
  background: var(--color-chain-lime);
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.6rem;
  flex-shrink: 0;
}

.guest-action-group {
  display: grid;
  gap: 0.65rem;
}

.google-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  color: var(--color-ink);
  font-size: 0.86rem;
  font-weight: 850;
  cursor: pointer;
  box-shadow: 0 2px 8px rgb(23 32 42 / 6%);
  transition: transform 90ms ease, background-color 100ms ease;
}

.google-action-btn:active {
  transform: scale(0.98);
}

.google-action-btn:hover {
  background: var(--color-sand);
}

.guest-buttons-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.demo-pill-btn {
  font-size: 0.78rem !important;
}
</style>
