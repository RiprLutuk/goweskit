<script setup lang="ts">
import type {
  CreateSafetySessionResponse,
  SafetySession,
  SafetySessionListResponse,
  SafetySessionResponse,
  TrustedContact,
  TrustedContactListResponse,
  TrustedContactResponse,
} from '@goweskit/contracts/safety';

import { buildSafetyShareUrl, SOS_HOLD_DURATION_MS } from '../../safety';
import { downloadGpxFile, generateGpxXml } from '../../gpx-export';
import { useBluetoothSensors } from '../../composables/useBluetoothSensors';

const api = useApi();
const { user, initialized, refresh } = useAuth();
const { triggerHaptic } = usePwa();
const { toast, alert } = useNotify();
const {
  heartRate,
  cadenceRpm,
  powerWatts,
  hrDeviceName,
  cscDeviceName,
  powerDeviceName,
  isHrConnected,
  isCscConnected,
  isPowerConnected,
  connectHeartRate,
  connectCadence,
  connectPower,
  disconnectAll,
} = useBluetoothSensors();

const contacts = ref<TrustedContact[]>([]);
const sessions = ref<SafetySession[]>([]);
const loading = ref(true);
const pageError = ref('');
const contactError = ref('');
const sessionError = ref('');
const sessionSaving = ref(false);
const locationSaving = ref(false);
const actionPending = ref<'sos' | 'end' | 'revoke' | null>(null);
const shareUrl = ref('');
const copyStatus = ref('');
const holdingSos = ref(false);
const showAddModal = ref(false);
const isAutoTracking = ref(true);
const wakeLockActive = ref(false);
const gpxExporting = ref<string | null>(null);

let watchId: number | null = null;
let wakeLockSentinel: any = null;
let lastSentCoords: { lat: number; lng: number } | null = null;
let lastSentTime = 0;

function handleContactCreated(contact: TrustedContact): void {
  contacts.value = [contact, ...contacts.value];
  startForm.trustedContactId = contact.id;
}

const startForm = reactive({
  trustedContactId: '',
  expectedEndAt: '',
  shareDurationMinutes: 180,
  note: '',
  explicitLocationConsent: false,
  disclaimerAcknowledged: false,
});

const DURATION_OPTIONS = [
  { value: 60, label: '1 Jam' },
  { value: 120, label: '2 Jam' },
  { value: 180, label: '3 Jam (Standar)' },
  { value: 300, label: '5 Jam (Long Ride)' },
] as const;

let sosTimer: ReturnType<typeof setTimeout> | undefined;
const showFlexModal = ref(false);

const activeSession = computed(
  () =>
    sessions.value.find(
      ({ status }) => status === 'active' || status === 'sos',
    ) ?? null,
);

const pastSessions = computed(() =>
  sessions.value.filter(
    ({ status }) => status !== 'active' && status !== 'sos',
  ),
);

async function requestWakeLock(): Promise<void> {
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockActive.value = true;
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockActive.value = false;
      });
    } catch {
      wakeLockActive.value = false;
    }
  }
}

function releaseWakeLock(): void {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release().catch(() => {});
    } catch {}
    wakeLockSentinel = null;
  }
  wakeLockActive.value = false;
}

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function sendPosition(
  latitude: number,
  longitude: number,
  accuracy: number,
): Promise<void> {
  const session = activeSession.value;
  if (!session) return;
  try {
    const response = await api<SafetySessionResponse>(
      `/safety/sessions/${session.id}/location`,
      {
        method: 'PUT',
        body: {
          coordinate: { longitude, latitude },
          accuracyMeters: accuracy,
          batteryPercent: null,
        },
      },
    );
    replaceSession(response.session);
  } catch (err) {
    console.warn('Failed to stream location update:', err);
  }
}

function startContinuousTracking(): void {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
  if (watchId !== null) return;

  void requestWakeLock();
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const now = Date.now();
      const distance = lastSentCoords
        ? calculateDistanceMeters(
            lastSentCoords.lat,
            lastSentCoords.lng,
            latitude,
            longitude,
          )
        : 999;

      if (distance >= 10 || now - lastSentTime >= 10_000) {
        lastSentCoords = { lat: latitude, lng: longitude };
        lastSentTime = now;
        void sendPosition(latitude, longitude, accuracy);
      }
    },
    (err) => {
      console.warn('GPS watch error:', err);
    },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 12_000 },
  );
}

function stopContinuousTracking(): void {
  if (
    typeof navigator !== 'undefined' &&
    watchId !== null &&
    'geolocation' in navigator
  ) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  releaseWakeLock();
}

watch(
  () => activeSession.value?.status,
  (status) => {
    if (status === 'active' || status === 'sos') {
      if (isAutoTracking.value) {
        startContinuousTracking();
      }
    } else {
      stopContinuousTracking();
    }
  },
  { immediate: true },
);

watch(isAutoTracking, (active) => {
  if (
    active &&
    (activeSession.value?.status === 'active' ||
      activeSession.value?.status === 'sos')
  ) {
    startContinuousTracking();
  } else {
    stopContinuousTracking();
  }
});

async function exportSessionGpx(session: SafetySession): Promise<void> {
  gpxExporting.value = session.id;
  try {
    const res = await api<{
      locations: Array<{
        coordinate: { latitude: number; longitude: number };
        recordedAt: string;
      }>;
    }>(`/safety/sessions/${session.id}/locations`);
    if (!res.locations || res.locations.length === 0) {
      toast.warning(
        'Data Rute Kosong',
        'Belum ada titik GPS yang terekam pada sesi ini.',
      );
      return;
    }
    const points = res.locations.map((loc) => ({
      latitude: loc.coordinate.latitude,
      longitude: loc.coordinate.longitude,
      time: loc.recordedAt,
    }));
    const gpxXml = generateGpxXml(
      session.note ||
        `Gowes Solo ${new Date(session.startedAt).toLocaleDateString('id-ID')}`,
      points,
    );
    downloadGpxFile(
      `GowesKit_Track_${session.id.slice(0, 8)}.gpx`,
      gpxXml,
    );
    toast.success(
      'GPX Berhasil Diunduh',
      `${points.length} titik koordinat rute diekspor.`,
    );
  } catch (err: unknown) {
    toast.error('Gagal Mengunduh GPX', getApiErrorMessage(err));
  } finally {
    gpxExporting.value = null;
  }
}

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value !== null) await loadSafety();
  loading.value = false;
});

onBeforeUnmount(() => {
  cancelSosHold();
  stopContinuousTracking();
});

async function loadSafety(): Promise<void> {
  pageError.value = '';
  try {
    const [contactResponse, sessionResponse] = await Promise.all([
      api<TrustedContactListResponse>('/trusted-contacts'),
      api<SafetySessionListResponse>('/safety/sessions'),
    ]);
    contacts.value = contactResponse.contacts;
    sessions.value = sessionResponse.sessions;
    if (
      startForm.trustedContactId === '' &&
      contactResponse.contacts[0] !== undefined
    ) {
      startForm.trustedContactId = contactResponse.contacts[0].id;
    }
  } catch (error: unknown) {
    pageError.value = getApiErrorMessage(error);
  }
}

async function deleteContact(contact: TrustedContact): Promise<void> {
  const confirmed = await alert.confirm({
    title: 'Hapus Kontak Darurat?',
    text: `Hapus ${contact.name} dari daftar kontak darurat?`,
    confirmText: 'Hapus',
    cancelText: 'Batal',
    icon: 'warning',
  });
  if (!confirmed) return;
  contactError.value = '';
  try {
    await api(`/trusted-contacts/${contact.id}`, { method: 'DELETE' });
    contacts.value = contacts.value.filter(({ id }) => id !== contact.id);
    if (startForm.trustedContactId === contact.id) {
      startForm.trustedContactId = contacts.value[0]?.id ?? '';
    }
    toast.success('Kontak Dihapus', `${contact.name} telah dihapus.`);
  } catch (error: unknown) {
    contactError.value = getApiErrorMessage(error);
    alert.error('Gagal Menghapus Kontak', contactError.value);
  }
}

async function startRide(): Promise<void> {
  if (
    startForm.trustedContactId === '' ||
    !startForm.explicitLocationConsent ||
    !startForm.disclaimerAcknowledged
  ) {
    sessionError.value =
      'Pilih kontak darurat dan setujui kedua pernyataan privasi & keselamatan.';
    return;
  }

  sessionSaving.value = true;
  sessionError.value = '';
  shareUrl.value = '';
  copyStatus.value = '';
  try {
    const expectedEndAt = startForm.expectedEndAt
      ? new Date(startForm.expectedEndAt).toISOString()
      : null;
    const response = await api<CreateSafetySessionResponse>(
      '/safety/sessions',
      {
        method: 'POST',
        body: {
          trustedContactId: startForm.trustedContactId,
          expectedEndAt,
          shareDurationMinutes: Number(startForm.shareDurationMinutes),
          note: startForm.note.trim() || null,
          explicitLocationConsent: true,
          disclaimerAcknowledged: true,
        },
      },
    );
    replaceSession(response.session);
    shareUrl.value = buildSafetyShareUrl(
      window.location.origin,
      response.shareToken,
    );
    startForm.expectedEndAt = '';
    startForm.note = '';
    startForm.explicitLocationConsent = false;
    startForm.disclaimerAcknowledged = false;
    // Auto-prompt and update GPS coordinates on session start
    void updateLocation();
  } catch (error: unknown) {
    sessionError.value = getApiErrorMessage(error);
  } finally {
    sessionSaving.value = false;
  }
}

async function copyShareLink(): Promise<void> {
  if (shareUrl.value === '') return;
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copyStatus.value = '✓ Tautan privat berhasil disalin!';
  } catch {
    copyStatus.value = 'Gagal menyalin. Silakan pilih dan salin teks manual.';
  }
}

function shareViaWhatsApp(): void {
  if (!shareUrl.value) return;
  const msg = encodeURIComponent(
    `Halo! Saya sedang gowes solo dan membagikan pantauan lokasi langsung privat saya di GowesKit:\n${shareUrl.value}\n\nTautan ini terenkripsi dan otomatis kedaluwarsa setelah sesi selesai.`,
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

async function updateLocation(): Promise<void> {
  const session = activeSession.value;
  if (session === null) return;
  if (!('geolocation' in navigator)) {
    sessionError.value = 'Fitur GPS tidak didukung di browser ini.';
    return;
  }

  locationSaving.value = true;
  sessionError.value = '';
  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15_000,
        });
      },
    );
    const response = await api<SafetySessionResponse>(
      `/safety/sessions/${session.id}/location`,
      {
        method: 'PUT',
        body: {
          coordinate: {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
          },
          accuracyMeters: position.coords.accuracy,
          batteryPercent: null,
        },
      },
    );
    replaceSession(response.session);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'number'
    ) {
      sessionError.value =
        'Gagal membaca koordinat GPS. Pastikan izin lokasi telah diaktifkan.';
    } else {
      sessionError.value = getApiErrorMessage(error);
    }
  } finally {
    locationSaving.value = false;
  }
}

function beginSosHold(): void {
  if (
    activeSession.value?.status !== 'active' ||
    actionPending.value !== null ||
    holdingSos.value
  ) {
    return;
  }
  holdingSos.value = true;
  triggerHaptic(25);
  sosTimer = setTimeout(() => {
    holdingSos.value = false;
    sosTimer = undefined;
    triggerHaptic([100, 50, 100, 50, 200]);
    void mutateSession('sos');
  }, SOS_HOLD_DURATION_MS);
}

function cancelSosHold(): void {
  if (sosTimer !== undefined) {
    clearTimeout(sosTimer);
    sosTimer = undefined;
  }
  holdingSos.value = false;
}

async function mutateSession(action: 'sos' | 'end' | 'revoke'): Promise<void> {
  const session = activeSession.value;
  if (session === null) return;
  actionPending.value = action;
  sessionError.value = '';
  try {
    const response = await api<SafetySessionResponse>(
      `/safety/sessions/${session.id}/${action}`,
      { method: 'POST' },
    );
    replaceSession(response.session);
    if (action === 'end' || action === 'revoke') {
      shareUrl.value = '';
      copyStatus.value = '';
    }
  } catch (error: unknown) {
    sessionError.value = getApiErrorMessage(error);
  } finally {
    actionPending.value = null;
  }
}

function replaceSession(session: SafetySession): void {
  sessions.value = [
    session,
    ...sessions.value.filter(({ id }) => id !== session.id),
  ];
}

function formatDate(value: string | null): string {
  if (value === null) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusBadge(status: SafetySession['status']): { label: string; class: string } {
  switch (status) {
    case 'active':
      return { label: 'Sedang Berlangsung', class: 'badge--green' };
    case 'sos':
      return { label: 'SOS Darurat Aktif', class: 'badge--red' };
    case 'ended':
      return { label: 'Selesai', class: 'badge--sand' };
    case 'revoked':
      return { label: 'Akses Dicabut', class: 'badge--sand' };
    case 'expired':
      return { label: 'Kedaluwarsa', class: 'badge--sand' };
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() || 'GS';
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return digits;
}

function openContactWhatsApp(phone: string): void {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const msg = encodeURIComponent(
    'Halo! Nomor Anda terdaftar sebagai kontak darurat GowesKit saya untuk keselamatan solo ride.',
  );
  window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
}
</script>

<template>
  <div class="native-container safety-container">
    <!-- Header -->
    <header class="native-page-header">
      <div class="header-topline">
        <span class="native-eyebrow">
          <GIcon name="radar" size="xs" color="var(--color-asphalt)" />
          <span>Keselamatan Solo-Ride</span>
        </span>
        <span
          v-if="activeSession"
          class="live-beacon-pill"
          :class="activeSession.status === 'sos' ? 'live-beacon-pill--sos' : 'live-beacon-pill--active'"
        >
          <span class="beacon-dot" /> {{ activeSession.status === 'sos' ? 'SOS DARURAT' : 'LIVE TRACKING' }}
        </span>
        <span v-else class="beacon-ready-pill">
          <span class="ready-dot" /> BEACON STANDBY
        </span>
      </div>
      <h1 class="native-title">Ride Safety Beacon</h1>
      <p class="native-sub">
        Bagikan pantauan lokasi langsung sementara secara privat &amp; terenkripsi kepada keluarga/rekan saat gowes solo.
      </p>
    </header>

    <!-- Skeleton Safety Shimmer during Loading -->
    <div v-if="loading" class="safety-skeleton-grid">
      <div class="skeleton-shimmer" style="width: 100%; height: 8rem; border-radius: 1.25rem;" />
      <div class="skeleton-shimmer" style="width: 100%; height: 16rem; border-radius: 1.25rem;" />
    </div>
    <p v-else-if="pageError" class="state-card state-card--error" role="alert">{{ pageError }}</p>

    <!-- Signed-out state -->
    <div v-else-if="!user" class="native-guest-box">
      <div class="guest-icon">
        <GIcon name="shield" size="2xl" color="#FF8C75" filled />
      </div>
      <h2>Aktifkan Ride Safety Beacon</h2>
      <p>Masuk ke akun GowesKit Anda untuk mendaftarkan kontak darurat dan memulai sesi pemantauan gowes solo.</p>
      <div class="guest-actions">
        <NuxtLink class="button button--primary button--full" to="/login">Masuk ke Akun</NuxtLink>
        <NuxtLink class="button button--secondary button--full" to="/register">Daftar Akun Baru</NuxtLink>
      </div>
    </div>

    <!-- LOGGED IN USER CONTENT -->
    <template v-else>
      <!-- ══════════════════════════════════════════════════════════
           1. ACTIVE RIDE SESSION BANNER & CONTROLS (CLEAN HUD)
           ══════════════════════════════════════════════════════════ -->
      <section
        v-if="activeSession"
        class="pro-beacon-card"
        :class="{ 'pro-beacon-card--sos': activeSession.status === 'sos' }"
      >
        <!-- Telemetry Top Row -->
        <div class="beacon-header-row">
          <div class="beacon-status-indicator">
            <span class="beacon-pulse-circle" :class="{ 'beacon-pulse-circle--sos': activeSession.status === 'sos' }" />
            <h2 class="beacon-heading">
              {{ activeSession.status === 'sos' ? 'Darurat (SOS) Aktif' : 'Sesi Gowes Sedang Berjalan' }}
            </h2>
          </div>
          <span class="beacon-status-tag" :class="activeSession.status === 'sos' ? 'tag-sos' : 'tag-active'">
            <GIcon v-if="activeSession.status === 'sos'" name="sos" size="xs" filled />
            <GIcon v-else name="radar" size="xs" color="#16A34A" />
            {{ activeSession.status === 'sos' ? 'SOS' : 'AKTIF' }}
          </span>
        </div>

        <p v-if="activeSession.status === 'sos'" class="sos-banner-note">
          Status darurat telah dikirim ke kontak terpercaya Anda. Tetap tenang dan cari lokasi yang aman.
        </p>

        <!-- Compact Time Strip -->
        <div class="beacon-timestrip">
          <div class="timestrip-col">
            <span class="timestrip-label">MULAI</span>
            <strong class="timestrip-val">{{ formatDate(activeSession.startedAt) }}</strong>
          </div>
          <div class="timestrip-sep" />
          <div class="timestrip-col">
            <span class="timestrip-label">ESTIMASI</span>
            <strong class="timestrip-val">{{ formatDate(activeSession.expectedEndAt) }}</strong>
          </div>
          <div class="timestrip-sep" />
          <div class="timestrip-col">
            <span class="timestrip-label">KEDALUWARSA</span>
            <strong class="timestrip-val">{{ formatDate(activeSession.shareExpiresAt) }}</strong>
          </div>
        </div>

        <!-- Live Bluetooth Cycling Telemetry HUD Strip (Web Bluetooth API) -->
        <div class="beacon-bluetooth-strip">
          <div class="ble-metric-box" :class="{ 'ble-metric--live': isHrConnected }">
            <div class="ble-metric-header">
              <span class="ble-icon">❤️</span>
              <span class="ble-label">DETAK JANTUNG</span>
            </div>
            <div class="ble-metric-value">
              <strong v-if="heartRate">{{ heartRate }}</strong>
              <span v-else-if="isHrConnected" class="ble-waiting">--</span>
              <button
                v-else
                type="button"
                class="ble-connect-btn"
                title="Hubungkan Heart Rate Monitor Bluetooth"
                @click="connectHeartRate"
              >
                + Hubungkan
              </button>
              <small v-if="heartRate">BPM</small>
            </div>
          </div>

          <div class="ble-metric-box" :class="{ 'ble-metric--live': isCscConnected }">
            <div class="ble-metric-header">
              <span class="ble-icon">⚡</span>
              <span class="ble-label">KADENS</span>
            </div>
            <div class="ble-metric-value">
              <strong v-if="cadenceRpm">{{ cadenceRpm }}</strong>
              <span v-else-if="isCscConnected" class="ble-waiting">--</span>
              <button
                v-else
                type="button"
                class="ble-connect-btn"
                title="Hubungkan Sensor Kadens Bluetooth"
                @click="connectCadence"
              >
                + Hubungkan
              </button>
              <small v-if="cadenceRpm">RPM</small>
            </div>
          </div>

          <div class="ble-metric-box" :class="{ 'ble-metric--live': isPowerConnected }">
            <div class="ble-metric-header">
              <span class="ble-icon">🔋</span>
              <span class="ble-label">POWER</span>
            </div>
            <div class="ble-metric-value">
              <strong v-if="powerWatts">{{ powerWatts }}</strong>
              <span v-else-if="isPowerConnected" class="ble-waiting">--</span>
              <button
                v-else
                type="button"
                class="ble-connect-btn"
                title="Hubungkan Power Meter Bluetooth"
                @click="connectPower"
              >
                + Hubungkan
              </button>
              <small v-if="powerWatts">W</small>
            </div>
          </div>
        </div>

        <!-- Share URL Bar (If available) -->
        <div v-if="shareUrl" class="beacon-share-row">
          <div class="share-url-snippet" :title="shareUrl">
            <span class="share-icon">
              <GIcon name="route" size="xs" />
            </span>
            <span class="share-url-text">{{ shareUrl }}</span>
          </div>
          <div class="share-action-buttons">
            <button
              type="button"
              class="share-btn-flex"
              @click="showFlexModal = true"
            >
              <GIcon name="camera" size="xs" /> Flex Pass
            </button>
            <button
              type="button"
              class="share-btn-copy"
              @click="copyShareLink"
            >
              <GIcon name="download" size="xs" /> Salin
            </button>
            <button
              type="button"
              class="share-btn-wa"
              @click="shareViaWhatsApp"
            >
              <GIcon name="share" size="xs" /> WhatsApp
            </button>
          </div>
        </div>
        <p v-if="copyStatus" class="share-copy-toast">{{ copyStatus }}</p>

        <!-- Tactile SOS Beacon Area -->
        <div v-if="activeSession.status === 'active'" class="beacon-sos-trigger-area">
          <button
            type="button"
            class="sos-round-btn"
            :class="{ 'sos-round-btn--holding': holdingSos }"
            :disabled="actionPending !== null"
            @click.prevent
            @mousedown="beginSosHold"
            @mouseup="cancelSosHold"
            @mouseleave="cancelSosHold"
            @touchstart.passive="beginSosHold"
            @touchend="cancelSosHold"
            @touchcancel="cancelSosHold"
          >
            <div class="sos-btn-content">
              <span class="sos-btn-icon">
                <GIcon name="sos" size="xl" filled />
              </span>
              <strong class="sos-btn-title">{{ holdingSos ? 'Tahan...' : 'SOS' }}</strong>
              <span class="sos-btn-sub">Tahan 3 Detik</span>
            </div>
            <div v-if="holdingSos" class="sos-hold-ring" />
          </button>
          <p class="sos-btn-caption">
            Tekan dan tahan tombol untuk mengaktifkan sinyal darurat ke kontak terpercaya.
          </p>
        </div>

        <!-- Auto-Tracker & WakeLock Status Bar -->
        <div class="tracking-status-bar">
          <div class="tracking-mode-info">
            <span class="tracking-dot" :class="{ 'tracking-dot--active': isAutoTracking }" />
            <div class="tracking-labels">
              <strong class="tracking-main-label">{{ isAutoTracking ? 'Auto GPS Streaming Aktif' : 'GPS Manual' }}</strong>
              <small class="tracking-sub-label">
                {{ wakeLockActive ? 'Layar Terjaga (WakeLock Aktif)' : 'Kirim otomatis tiap >10m' }}
              </small>
            </div>
          </div>
          <button
            type="button"
            class="tracking-toggle-btn"
            :class="{ 'tracking-toggle-btn--on': isAutoTracking }"
            @click="isAutoTracking = !isAutoTracking"
          >
            {{ isAutoTracking ? 'Auto ON' : 'Auto OFF' }}
          </button>
        </div>

        <!-- Primary Action Buttons Row -->
        <div class="beacon-actions-row">
          <button
            type="button"
            class="beacon-action-btn beacon-action-btn--primary"
            :disabled="locationSaving || actionPending !== null"
            @click="updateLocation"
          >
            <span v-if="locationSaving">Memperbarui GPS…</span>
            <span v-else>
              <GIcon name="pin" size="xs" /> Update Lokasi
            </span>
          </button>

          <button
            type="button"
            class="beacon-action-btn beacon-action-btn--secondary"
            :disabled="actionPending !== null"
            @click="mutateSession('end')"
          >
            <span v-if="actionPending === 'end'">Menutup…</span>
            <span v-else>
              <GIcon name="check" size="xs" /> Selesaikan
            </span>
          </button>
        </div>

        <!-- Revoke Link -->
        <div class="beacon-revoke-row">
          <button
            type="button"
            class="beacon-revoke-link"
            :disabled="actionPending !== null"
            @click="mutateSession('revoke')"
          >
            <GIcon name="close" size="xs" color="#EF4444" /> Cabut Akses Tautan (Revoke Token)
          </button>
        </div>

        <p v-if="sessionError" class="state-card state-card--error mt-2">{{ sessionError }}</p>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           2. START A NEW RIDE SAFETY SESSION
           ══════════════════════════════════════════════════════════ -->
      <section v-else class="start-session-card">
        <!-- Quick Alert Hero if 0 contacts -->
        <div v-if="contacts.length === 0" class="no-contact-alert-box">
          <div class="no-contact-alert-icon">
            <GIcon name="shield" size="md" color="#EF4444" filled />
          </div>
          <div class="no-contact-alert-content">
            <strong class="no-contact-alert-title">Belum Ada Kontak Terdaftar</strong>
            <p class="no-contact-alert-text">
              Tambahkan minimal 1 kontak darurat (keluarga / rekan peloton) agar koordinat GPS dapat dibagikan saat solo ride.
            </p>
            <button
              type="button"
              class="no-contact-alert-btn"
              @click="showAddModal = true"
            >
              <GIcon name="plus" size="xs" />
              <span>Tambah Kontak Darurat Sekarang</span>
            </button>
          </div>
        </div>

        <div class="card-heading">
          <div class="section-icon-box">
            <GIcon name="shield" size="md" color="#17202A" filled />
          </div>
          <div>
            <h2 class="card-title">Mulai Sesi Gowes Aman</h2>
            <p class="card-sub">Pilih kontak darurat dan bagikan koordinat langsung secara privat.</p>
          </div>
        </div>

        <form class="start-form-grid" @submit.prevent="startRide">
          <!-- Field 1: Trusted Contact Selector -->
          <div class="form-field-group">
            <label class="field-label" for="trusted-contact-select">
              <span class="field-label-text">PILIH KONTAK TERPERCAYA</span>
              <span class="field-required">*</span>
            </label>
            <div class="custom-select-wrap">
              <span class="select-icon-prefix">
                <GIcon name="users" size="xs" color="var(--color-asphalt)" />
              </span>
              <select
                id="trusted-contact-select"
                v-model="startForm.trustedContactId"
                class="custom-select"
                required
                :disabled="contacts.length === 0"
              >
                <option value="" disabled>
                  {{ contacts.length === 0 ? 'Belum ada kontak terdaftar' : 'Pilih kontak darurat…' }}
                </option>
                <option v-for="c in contacts" :key="c.id" :value="c.id">
                  {{ c.name }} {{ c.phone ? `(${c.phone})` : (c.email ? `(${c.email})` : '') }}
                </option>
              </select>
            </div>
          </div>

          <!-- Field 2: Share Duration Segmented Pills -->
          <div class="form-field-group">
            <label class="field-label">
              <span class="field-label-text">DURASI TAUTAN PRIVAT</span>
            </label>
            <div class="duration-pills-row" role="radiogroup" aria-label="Durasi Tautan">
              <button
                v-for="opt in DURATION_OPTIONS"
                :key="opt.value"
                type="button"
                role="radio"
                class="duration-pill"
                :class="{ active: startForm.shareDurationMinutes === opt.value }"
                :aria-checked="startForm.shareDurationMinutes === opt.value"
                @click="startForm.shareDurationMinutes = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Field 3: Expected End & Route Notes Grid -->
          <div class="form-grid-2">
            <div class="form-field-group">
              <label class="field-label" for="expected-end-input">
                <span class="field-label-text">ESTIMASI SELESAI</span>
                <span class="field-optional">(OPSIONAL)</span>
              </label>
              <div class="custom-input-wrap">
                <span class="input-icon-prefix">
                  <GIcon name="calendar" size="xs" color="var(--color-asphalt)" />
                </span>
                <input
                  id="expected-end-input"
                  v-model="startForm.expectedEndAt"
                  type="datetime-local"
                  class="custom-input"
                />
              </div>
            </div>

            <div class="form-field-group">
              <label class="field-label" for="route-note-input">
                <span class="field-label-text">CATATAN RUTE / RENCANA</span>
                <span class="field-optional">(OPSIONAL)</span>
              </label>
              <div class="custom-input-wrap">
                <span class="input-icon-prefix">
                  <GIcon name="route" size="xs" color="var(--color-asphalt)" />
                </span>
                <input
                  id="route-note-input"
                  v-model="startForm.note"
                  class="custom-input"
                  placeholder="Contoh: Sentul KM 0 - KM 10 - Kopi Daong"
                />
              </div>
            </div>
          </div>

          <!-- Field 4: Tactile Consent Checkbox Cards -->
          <div class="consent-cards-stack">
            <div
              class="consent-card"
              :class="{ 'consent-card--checked': startForm.explicitLocationConsent }"
              tabindex="0"
              role="checkbox"
              :aria-checked="startForm.explicitLocationConsent"
              @click="startForm.explicitLocationConsent = !startForm.explicitLocationConsent"
              @keydown.space.prevent="startForm.explicitLocationConsent = !startForm.explicitLocationConsent"
            >
              <div class="custom-check-box" :class="{ checked: startForm.explicitLocationConsent }">
                <GIcon v-if="startForm.explicitLocationConsent" name="check" size="xs" color="#17202A" />
              </div>
              <div class="consent-card-body">
                <strong class="consent-card-title">Persetujuan Lokasi GPS Privat</strong>
                <p class="consent-card-desc">
                  Lokasi GPS saya dibagikan secara privat &amp; terenkripsi hanya kepada kontak terpercaya yang dipilih.
                </p>
              </div>
            </div>

            <div
              class="consent-card"
              :class="{ 'consent-card--checked': startForm.disclaimerAcknowledged }"
              tabindex="0"
              role="checkbox"
              :aria-checked="startForm.disclaimerAcknowledged"
              @click="startForm.disclaimerAcknowledged = !startForm.disclaimerAcknowledged"
              @keydown.space.prevent="startForm.disclaimerAcknowledged = !startForm.disclaimerAcknowledged"
            >
              <div class="custom-check-box" :class="{ checked: startForm.disclaimerAcknowledged }">
                <GIcon v-if="startForm.disclaimerAcknowledged" name="check" size="xs" color="#17202A" />
              </div>
              <div class="consent-card-body">
                <strong class="consent-card-title">Bukan Layanan Darurat Kepolisian (110/112)</strong>
                <p class="consent-card-desc">
                  GowesKit adalah sistem monitoring mandiri gowes, bukan pusat komando darurat atau ambulans resmi.
                </p>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            class="btn-start-ride"
            type="submit"
            :disabled="sessionSaving || contacts.length === 0 || !startForm.explicitLocationConsent || !startForm.disclaimerAcknowledged"
          >
            <GIcon name="shield" size="xs" color="currentColor" filled />
            <span>{{ sessionSaving ? 'Memulai Sesi…' : 'Mulai Sesi Gowes Aman' }}</span>
          </button>
        </form>

        <p v-if="sessionError" class="state-card state-card--error" role="alert">{{ sessionError }}</p>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           3. TRUSTED CONTACTS MANAGEMENT
           ══════════════════════════════════════════════════════════ -->
      <section class="contacts-section">
        <div class="contacts-header">
          <div>
            <h3 class="section-title">Kontak Darurat Terpercaya</h3>
            <p class="section-desc">Keluarga atau rekan gowes yang akan menerima tautan pemantauan lokasi.</p>
          </div>
          <button
            class="add-contact-btn"
            type="button"
            @click="showAddModal = true"
          >
            <GIcon name="plus" size="xs" />
            <span>Tambah Kontak</span>
          </button>
        </div>

        <!-- Contacts Grouped List -->
        <div class="contacts-grouped-list">
          <div v-if="contacts.length === 0" class="empty-contacts-box">
            <div class="empty-contacts-icon">
              <GIcon name="users" size="xl" color="var(--color-asphalt)" />
            </div>
            <strong class="empty-contacts-title">Belum Ada Kontak Darurat</strong>
            <p class="empty-contacts-hint">
              Daftarkan keluarga atau sahabat gowes Anda agar mereka dapat memantau perjalanan solo ride Anda secara aman.
            </p>
            <button
              type="button"
              class="empty-contacts-action-btn"
              @click="showAddModal = true"
            >
              <GIcon name="plus" size="xs" />
              <span>Tambah Kontak Pertama</span>
            </button>
          </div>

          <div
            v-for="contact in contacts"
            v-else
            :key="contact.id"
            class="contact-item-row"
          >
            <div class="contact-avatar-box">
              <span>{{ getInitials(contact.name) }}</span>
            </div>
            <div class="contact-body">
              <div class="contact-name-row">
                <strong class="contact-name">{{ contact.name }}</strong>
                <span v-if="contact.note" class="relation-badge">{{ contact.note }}</span>
              </div>
              <div class="contact-chips-row">
                <span v-if="contact.phone" class="contact-chip">
                  <GIcon name="radar" size="xs" color="var(--color-asphalt)" />
                  <span>{{ contact.phone }}</span>
                </span>
                <span v-if="contact.email" class="contact-chip">
                  <GIcon name="share" size="xs" color="var(--color-asphalt)" />
                  <span>{{ contact.email }}</span>
                </span>
              </div>
            </div>
            <div class="contact-actions-right">
              <button
                v-if="contact.phone"
                class="contact-wa-btn"
                type="button"
                title="Buka WhatsApp"
                @click="openContactWhatsApp(contact.phone)"
              >
                <GIcon name="share" size="xs" color="#16A34A" />
              </button>
              <button
                class="contact-delete-btn"
                type="button"
                title="Hapus kontak"
                @click="deleteContact(contact)"
              >
                <GIcon name="trash" size="xs" color="#EF4444" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           4. PAST SESSIONS LOG & AI RIDE FLEX
           ══════════════════════════════════════════════════════════ -->
      <section v-if="pastSessions.length" class="history-section">
        <div class="history-header-row">
          <div>
            <h3 class="section-title">Riwayat Sesi Gowes</h3>
            <p class="section-desc">Log pemantauan sesi solo ride sebelumnya.</p>
          </div>
          <NuxtLink class="studio-shortcut-link" to="/ride-flex">
            <GIcon name="camera" size="xs" />
            <span>AI Flex Studio</span>
            <span>→</span>
          </NuxtLink>
        </div>
        <div class="history-feed">
          <div v-for="s in pastSessions" :key="s.id" class="history-card">
            <div class="history-top">
              <span class="history-date">
                <GIcon name="history" size="xs" color="var(--color-asphalt)" />
                <span>{{ formatDate(s.startedAt) }}</span>
              </span>
              <span class="history-badge" :class="statusBadge(s.status).class">
                {{ statusBadge(s.status).label }}
              </span>
            </div>
            <p v-if="s.note" class="history-note">{{ s.note }}</p>
            <div class="history-footer-row">
              <small class="history-ended">Selesai: {{ formatDate(s.endedAt) }}</small>
              <div class="history-actions-wrap">
                <button
                  type="button"
                  class="card-gpx-btn"
                  :disabled="gpxExporting === s.id"
                  @click="exportSessionGpx(s)"
                >
                  <GIcon name="download" size="xs" />
                  <span>{{ gpxExporting === s.id ? 'Mengunduh…' : 'Unduh GPX' }}</span>
                </button>
                <NuxtLink
                  class="card-flex-btn"
                  :to="`/ride-flex?note=${encodeURIComponent(s.note || 'Gowes Solo')}`"
                >
                  <GIcon name="camera" size="xs" />
                  <span>Buat Poster AI</span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           5. EMERGENCY DISCLAIMER BANNER
           ══════════════════════════════════════════════════════════ -->
      <aside class="disclaimer-banner" aria-label="Disclaimer Layanan Darurat">
        <div class="disclaimer-icon-box">
          <GIcon name="shield" size="sm" color="#FF8C75" filled />
        </div>
        <div class="disclaimer-text">
          <strong>Pernyataan Privasi &amp; Batasan Layanan</strong>
          <p>
            GowesKit membagikan koordinat GPS secara privat melalui tautan acak terenkripsi hanya kepada kontak yang Anda pilih. GowesKit bukan penyedia layanan darurat terpusat. Untuk kondisi kecelakaan gawat darurat, segera hubungi layanan 112 atau fasilitas medis terdekat.
          </p>
        </div>
      </aside>

      <!-- Solo Ride Flex Pass Modal -->
      <SoloRideFlexCard
        :session="activeSession"
        :is-open="showFlexModal"
        :rider-name="user?.displayName"
        :share-url="shareUrl"
        @close="showFlexModal = false"
      />

      <!-- Add Trusted Contact Modal -->
      <AddTrustedContactModal
        :is-open="showAddModal"
        @close="showAddModal = false"
        @created="handleContactCreated"
      />
    </template>
  </div>
</template>

<style scoped>
.safety-container {
  display: grid;
  gap: 1.25rem;
  padding-bottom: 3rem;
  width: 100%;
  max-width: 100%;
}

.native-page-header {
  display: grid;
  gap: 0.35rem;
}

.header-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.native-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.live-beacon-pill {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 900;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.live-beacon-pill--active {
  background: rgb(201 243 106 / 60%);
  color: #166534;
  border: 1px solid #16a34a;
}

.live-beacon-pill--sos {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #ef4444;
}

.beacon-ready-pill {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  background: var(--color-sand);
  color: var(--color-asphalt);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.ready-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #10b981;
}

.beacon-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
  animation: beacon-pulse 1.6s infinite;
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

.safety-skeleton-grid {
  display: grid;
  gap: 1rem;
}

/* ══════════════════════════════════════════════════════════
   1. PRO TELEMETRY BEACON CARD (ACTIVE HUD)
   ══════════════════════════════════════════════════════════ */
.pro-beacon-card {
  display: grid;
  gap: 0.85rem;
  padding: 1.25rem;
  border-radius: var(--radius-card, 20px);
  background: var(--color-white);
  border: 1.5px solid var(--color-chain-lime);
  box-shadow: 0 4px 20px rgb(23 32 42 / 6%);
}

.pro-beacon-card--sos {
  border-color: #ef4444;
  background: #fffafa;
}

.beacon-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.beacon-status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.beacon-pulse-circle {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  animation: beacon-pulse 1.8s infinite;
}

.beacon-pulse-circle--sos {
  background: #ef4444;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  animation: sos-pulse 1.2s infinite;
}

@keyframes beacon-pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

@keyframes sos-pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.8); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.beacon-heading {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
  color: var(--color-ink);
}

.beacon-status-tag {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 900;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.tag-active {
  background: rgb(201 243 106 / 60%);
  color: #166534;
}

.tag-sos {
  background: #fee2e2;
  color: #dc2626;
}

.sos-banner-note {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #dc2626;
  background: #fee2e2;
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
}

.beacon-timestrip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.timestrip-col {
  display: grid;
  gap: 0.1rem;
  text-align: center;
  flex: 1;
}

.timestrip-label {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 850;
  color: var(--color-asphalt);
  letter-spacing: 0.04em;
}

.timestrip-val {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 850;
  color: var(--color-ink);
}

.timestrip-sep {
  width: 1px;
  height: 1.4rem;
  background: var(--color-sand);
}

.beacon-bluetooth-strip {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}

.ble-metric-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.6rem 0.65rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  border-radius: 0.75rem;
  transition: all 150ms ease;
}

.ble-metric--live {
  background: #f0fdf4;
  border-color: #86efac;
}

.ble-metric-header {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.ble-icon {
  font-size: 0.75rem;
  line-height: 1;
}

.ble-label {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 850;
  color: var(--color-asphalt);
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.ble-metric-value {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  min-height: 1.4rem;
}

.ble-metric-value strong {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--color-ink);
  line-height: 1;
}

.ble-metric-value small {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

.ble-waiting {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: #94a3b8;
}

.ble-connect-btn {
  border: 1px dashed var(--color-sand);
  background: var(--color-canvas);
  color: var(--color-ink);
  padding: 0.2rem 0.35rem;
  border-radius: 0.35rem;
  font-size: 0.62rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: all 120ms ease;
}

.ble-connect-btn:hover {
  background: var(--color-sand);
}

.beacon-share-row {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-sand);
}

.share-url-snippet {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  overflow: hidden;
}

.share-url-text {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.35rem;
}

.share-btn-copy,
.share-btn-wa,
.share-btn-flex {
  padding: 0.45rem 0.5rem;
  border-radius: 0.55rem;
  font-size: 0.72rem;
  font-weight: 850;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.share-btn-flex {
  background: var(--color-chain-lime);
  color: var(--color-ink);
  border: 1px solid var(--color-ink);
}

.share-btn-copy {
  background: var(--color-white);
  color: var(--color-ink);
  border: 1px solid rgb(23 32 42 / 10%);
}

.share-btn-wa {
  background: #25d366;
  color: #ffffff;
}

.share-copy-toast {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 850;
  color: #166534;
  text-align: center;
}

.beacon-sos-trigger-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0;
}

.sos-round-btn {
  position: relative;
  width: 6.8rem;
  height: 6.8rem;
  border-radius: 50%;
  background: radial-gradient(circle, #ef4444 0%, #dc2626 100%);
  border: 3.5px solid #ffffff;
  box-shadow: 0 6px 20px rgb(239 68 68 / 38%);
  color: #ffffff;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  transition: transform 120ms ease, box-shadow 120ms ease;
  display: grid;
  place-items: center;
}

.sos-round-btn--holding {
  transform: scale(0.92);
  box-shadow: 0 0 0 10px rgb(239 68 68 / 30%);
  background: #b91c1c;
}

.sos-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
}

.sos-btn-icon {
  font-size: 1.2rem;
}

.sos-btn-title {
  font-size: 1.2rem;
  font-weight: 900;
}

.sos-btn-sub {
  font-size: 0.6rem;
  font-weight: 800;
  opacity: 0.9;
}

.sos-btn-caption {
  margin: 0;
  font-size: 0.7rem;
  color: var(--color-asphalt);
  text-align: center;
  max-width: 18rem;
}

.beacon-actions-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 0.5rem;
}

.beacon-action-btn {
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 850;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.beacon-action-btn--primary {
  background: var(--color-ink);
  color: var(--color-white);
}

.beacon-action-btn--secondary {
  background: var(--color-canvas);
  border-color: var(--color-sand);
  color: var(--color-ink);
}

.beacon-revoke-row {
  display: flex;
  justify-content: center;
  padding-top: 0.15rem;
}

.beacon-revoke-link {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  text-decoration: underline;
  opacity: 0.85;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* ══════════════════════════════════════════════════════════
   2. START SESSION CARD & REFACTORED INPUTS
   ══════════════════════════════════════════════════════════ */
.start-session-card {
  display: grid;
  gap: 1.15rem;
  padding: 1.35rem;
  border-radius: var(--radius-card, 20px);
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 24px rgb(23 32 42 / 5%);
}

/* Smart Quick Alert Box if 0 Contacts */
.no-contact-alert-box {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  background: #fff8f5;
  border: 1.5px dashed #ff8c75;
}

.no-contact-alert-icon {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.65rem;
  background: #fee2e2;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.no-contact-alert-content {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.no-contact-alert-title {
  font-size: 0.88rem;
  font-weight: 850;
  color: #b91c1c;
}

.no-contact-alert-text {
  margin: 0;
  font-size: 0.76rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

.no-contact-alert-btn {
  margin-top: 0.25rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.55rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  font-size: 0.74rem;
  font-weight: 850;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  width: fit-content;
}

.no-contact-alert-btn:hover {
  background: #fecaca;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon-box {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
  color: var(--color-ink);
}

.card-sub {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
}

.start-form-grid {
  display: grid;
  gap: 0.95rem;
}

.form-field-group {
  display: grid;
  gap: 0.35rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-label-text {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  color: var(--color-asphalt);
  letter-spacing: 0.04em;
}

.field-required {
  color: #ef4444;
  font-weight: 900;
}

.field-optional {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: #94a3b8;
  font-weight: 700;
}

.custom-select-wrap,
.custom-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.select-icon-prefix,
.input-icon-prefix {
  position: absolute;
  left: 0.85rem;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.custom-select,
.custom-input {
  width: 100%;
  padding: 0.65rem 0.85rem 0.65rem 2.35rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--color-sand);
  background: var(--color-white);
  color: var(--color-ink);
  font-size: 0.84rem;
  font-weight: 600;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.custom-select:focus,
.custom-input:focus {
  border-color: var(--color-ink);
  box-shadow: 0 0 0 3px rgba(201, 243, 106, 0.45);
}

.custom-select:disabled {
  background: var(--color-canvas);
  color: #94a3b8;
  cursor: not-allowed;
}

/* Duration Segmented Pills */
.duration-pills-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

@media (max-width: 32rem) {
  .duration-pills-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.duration-pill {
  padding: 0.55rem 0.4rem;
  border-radius: 0.65rem;
  background: var(--color-canvas);
  border: 1.5px solid var(--color-sand);
  color: var(--color-asphalt);
  font-size: 0.74rem;
  font-weight: 750;
  cursor: pointer;
  text-align: center;
  transition: all 120ms ease;
  white-space: nowrap;
}

.duration-pill.active {
  background: var(--color-chain-lime);
  border-color: var(--color-ink);
  color: var(--color-ink);
  font-weight: 850;
  box-shadow: 0 2px 8px rgba(201, 243, 106, 0.35);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 34rem) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}

/* Tactile Consent Checkbox Cards */
.consent-cards-stack {
  display: grid;
  gap: 0.5rem;
}

.consent-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1.5px solid var(--color-sand);
  cursor: pointer;
  user-select: none;
  transition: border-color 120ms ease, background-color 120ms ease;
}

.consent-card:hover {
  border-color: #cbd5e1;
}

.consent-card--checked {
  background: #f7fee7;
  border-color: #84cc16;
}

.custom-check-box {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.35rem;
  border: 2px solid #94a3b8;
  background: var(--color-white);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 0.1rem;
  transition: all 120ms ease;
}

.custom-check-box.checked {
  background: var(--color-chain-lime);
  border-color: var(--color-ink);
}

.consent-card-body {
  display: grid;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.consent-card-title {
  font-size: 0.78rem;
  font-weight: 850;
  color: var(--color-ink);
}

.consent-card-desc {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

.btn-start-ride {
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 0.85rem;
  background: var(--color-ink);
  color: var(--color-white);
  border: none;
  font-size: 0.88rem;
  font-weight: 850;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  transition: transform 90ms ease, opacity 120ms ease;
  box-shadow: 0 4px 14px rgba(23, 32, 42, 0.15);
}

.btn-start-ride:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* ══════════════════════════════════════════════════════════
   3. CONTACTS MANAGEMENT SECTION
   ══════════════════════════════════════════════════════════ */
.contacts-section {
  display: grid;
  gap: 0.85rem;
}

.contacts-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.contacts-header > div {
  flex: 1 1 12rem;
  min-width: 0;
}

.section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 850;
  color: var(--color-ink);
}

.section-desc {
  margin: 0;
  font-size: 0.76rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

.add-contact-btn {
  flex-shrink: 0;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  font-size: 0.74rem;
  font-weight: 850;
  color: var(--color-ink);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  align-self: flex-start;
}

.add-contact-btn:hover {
  background: var(--color-canvas);
  border-color: var(--color-ink);
}

.contacts-grouped-list {
  display: flex;
  flex-direction: column;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(23, 32, 42, 0.03);
}

.empty-contacts-box {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.45rem;
}

.empty-contacts-icon {
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 1rem;
  background: var(--color-canvas);
  display: grid;
  place-items: center;
  margin-bottom: 0.25rem;
}

.empty-contacts-title {
  font-size: 0.95rem;
  font-weight: 850;
  color: var(--color-ink);
}

.empty-contacts-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  max-width: 20rem;
  line-height: 1.35;
}

.empty-contacts-action-btn {
  margin-top: 0.5rem;
  padding: 0.45rem 0.95rem;
  border-radius: 9999px;
  background: var(--color-ink);
  color: var(--color-white);
  border: none;
  font-size: 0.76rem;
  font-weight: 850;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.contact-item-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgb(23 32 42 / 6%);
  transition: background-color 100ms ease;
}

.contact-item-row:last-child {
  border-bottom: none;
}

.contact-item-row:hover {
  background: var(--color-canvas);
}

.contact-avatar-box {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--color-sand);
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--color-ink);
  flex-shrink: 0;
}

.contact-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}

.contact-name-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.contact-name {
  font-size: 0.88rem;
  font-weight: 850;
  color: var(--color-ink);
}

.relation-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 0.4rem;
  background: var(--color-sand);
  color: var(--color-asphalt);
}

.contact-chips-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.contact-chip {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--color-asphalt);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.contact-actions-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.contact-wa-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-sand);
  background: var(--color-canvas);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.contact-wa-btn:hover {
  background: #dcfce7;
  border-color: #86efac;
}

.contact-delete-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  opacity: 0.7;
}

.contact-delete-btn:hover {
  background: #fee2e2;
  opacity: 1;
}

/* ══════════════════════════════════════════════════════════
   4. PAST SESSIONS LOG & AI FLEX STUDIO
   ══════════════════════════════════════════════════════════ */
.history-section {
  display: grid;
  gap: 0.75rem;
}

.history-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.history-header-row > div {
  flex: 1 1 12rem;
  min-width: 0;
}

.studio-shortcut-link {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 850;
  color: var(--color-ink);
  background: var(--color-chain-lime);
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  text-decoration: none;
  border: 1px solid var(--color-ink);
  box-shadow: 0 1px 4px rgba(201, 243, 106, 0.4);
  align-self: flex-start;
}

.history-feed {
  display: grid;
  gap: 0.55rem;
}

.history-card {
  display: grid;
  gap: 0.45rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 2px 8px rgba(23, 32, 42, 0.02);
}

.history-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.history-date {
  font-size: 0.8rem;
  font-weight: 850;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.history-badge {
  font-size: 0.68rem;
  font-weight: 850;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  flex-shrink: 0;
}

.history-note {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
}

.history-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.15rem;
  flex-wrap: wrap;
}

.history-ended {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: var(--color-asphalt);
}

.card-flex-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 850;
  color: var(--color-ink);
  background: var(--color-sand);
  border: 1px solid rgb(23 32 42 / 10%);
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  text-decoration: none;
  flex-shrink: 0;
}

.card-flex-btn:hover {
  background: var(--color-chain-lime);
  border-color: var(--color-ink);
}

/* ══════════════════════════════════════════════════════════
   5. DISCLAIMER BANNER & GUEST MODE
   ══════════════════════════════════════════════════════════ */
.disclaimer-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem 1.25rem;
  border-radius: 1.15rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.disclaimer-icon-box {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.65rem;
  background: #fee2e2;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.disclaimer-text {
  flex: 1;
  min-width: 0;
}

.disclaimer-text strong {
  font-size: 0.82rem;
  color: var(--color-ink);
  display: block;
}

.disclaimer-text p {
  margin: 0.25rem 0 0;
  font-size: 0.74rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.native-guest-box {
  display: grid;
  gap: 1rem;
  text-align: center;
  padding: 2.5rem 1.5rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 20px rgba(23, 32, 42, 0.05);
}

.guest-icon {
  font-size: 3.2rem;
}

.native-guest-box h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 850;
}

.native-guest-box p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.guest-actions {
  display: grid;
  gap: 0.65rem;
}

.tracking-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
}

.tracking-mode-info {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.tracking-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}

.tracking-dot--active {
  background: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
  animation: pulse-dot 2s infinite ease-in-out;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.15);
  }
}

.tracking-labels {
  display: flex;
  flex-direction: column;
}

.tracking-main-label {
  font-size: 0.82rem;
  font-weight: 750;
  color: #1e293b;
}

.tracking-sub-label {
  font-size: 0.72rem;
  color: #64748b;
}

.tracking-toggle-btn {
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 150ms ease;
}

.tracking-toggle-btn--on {
  background: #16a34a;
  border-color: #16a34a;
  color: #ffffff;
}

.history-actions-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-gpx-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  cursor: pointer;
  transition: background 150ms ease;
}

.card-gpx-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.card-gpx-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
