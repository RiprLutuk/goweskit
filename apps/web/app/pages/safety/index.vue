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

const api = useApi();
const { user, initialized, refresh } = useAuth();
const { triggerHaptic } = usePwa();
const { toast, alert } = useNotify();

const contacts = ref<TrustedContact[]>([]);
const sessions = ref<SafetySession[]>([]);
const loading = ref(true);
const pageError = ref('');
const contactError = ref('');
const sessionError = ref('');
const contactSaving = ref(false);
const sessionSaving = ref(false);
const locationSaving = ref(false);
const actionPending = ref<'sos' | 'end' | 'revoke' | null>(null);
const shareUrl = ref('');
const copyStatus = ref('');
const holdingSos = ref(false);
const showAddContact = ref(false);

const contactForm = reactive({
  name: '',
  phone: '',
  email: '',
  note: '',
});

const startForm = reactive({
  trustedContactId: '',
  expectedEndAt: '',
  shareDurationMinutes: 180,
  note: '',
  explicitLocationConsent: false,
  disclaimerAcknowledged: false,
});

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

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value !== null) await loadSafety();
  loading.value = false;
});

onBeforeUnmount(cancelSosHold);

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

async function createContact(): Promise<void> {
  contactSaving.value = true;
  contactError.value = '';
  try {
    const response = await api<TrustedContactResponse>('/trusted-contacts', {
      method: 'POST',
      body: {
        name: contactForm.name.trim(),
        phone: contactForm.phone.trim() || null,
        email: contactForm.email.trim() || null,
        note: contactForm.note.trim() || null,
      },
    });
    contacts.value = [response.contact, ...contacts.value];
    startForm.trustedContactId = response.contact.id;
    contactForm.name = '';
    contactForm.phone = '';
    contactForm.email = '';
    contactForm.note = '';
    showAddContact.value = false;
    toast.success('Kontak Ditambahkan', `${response.contact.name} berhasil disimpan.`);
  } catch (error: unknown) {
    contactError.value = getApiErrorMessage(error);
    alert.error('Gagal Menyimpan Kontak', contactError.value);
  } finally {
    contactSaving.value = false;
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
      return { label: '🟢 Sedang Berlangsung', class: 'badge--green' };
    case 'sos':
      return { label: '🚨 SOS Darurat Aktif', class: 'badge--red' };
    case 'ended':
      return { label: '✓ Selesai', class: 'badge--sand' };
    case 'revoked':
      return { label: '🚫 Akses Dicabut', class: 'badge--sand' };
    case 'expired':
      return { label: '⏱️ Kedaluwarsa', class: 'badge--sand' };
  }
}
</script>

<template>
  <div class="native-container safety-container">
    <!-- Header -->
    <header class="native-page-header">
      <div class="header-topline">
        <span class="native-eyebrow">Keselamatan Solo-Ride</span>
        <span
          v-if="activeSession"
          class="live-beacon-pill"
          :class="activeSession.status === 'sos' ? 'live-beacon-pill--sos' : 'live-beacon-pill--active'"
        >
          <span class="beacon-dot" /> {{ activeSession.status === 'sos' ? 'SOS DARURAT' : 'LIVE TRACKING' }}
        </span>
      </div>
      <h1 class="native-title">Ride Safety Beacon</h1>
      <p class="native-sub">
        Bagikan pantauan lokasi langsung sementara secara privat kepada keluarga/rekan saat gowes solo.
      </p>
    </header>

    <p v-if="loading" class="state-card" role="status">Memuat data keselamatan…</p>
    <p v-else-if="pageError" class="state-card state-card--error" role="alert">{{ pageError }}</p>

    <!-- Signed-out state -->
    <div v-else-if="!user" class="native-guest-box">
      <div class="guest-icon">🛡️</div>
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
            {{ activeSession.status === 'sos' ? '🚨 SOS' : '🟢 AKTIF' }}
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

        <!-- Share URL Bar (If available) -->
        <div v-if="shareUrl" class="beacon-share-row">
          <div class="share-url-snippet" :title="shareUrl">
            <span class="share-icon">🔗</span>
            <span class="share-url-text">{{ shareUrl }}</span>
          </div>
          <div class="share-action-buttons">
            <button
              type="button"
              class="share-btn-flex"
              @click="showFlexModal = true"
            >
              📸 Flex Pass
            </button>
            <button
              type="button"
              class="share-btn-copy"
              @click="copyShareLink"
            >
              📋 Salin
            </button>
            <button
              type="button"
              class="share-btn-wa"
              @click="shareViaWhatsApp"
            >
              💬 WhatsApp
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
            @mousedown="beginSosHold"
            @mouseup="cancelSosHold"
            @mouseleave="cancelSosHold"
            @touchstart.passive="beginSosHold"
            @touchend="cancelSosHold"
            @touchcancel="cancelSosHold"
          >
            <div class="sos-btn-content">
              <span class="sos-btn-icon">🚨</span>
              <strong class="sos-btn-title">{{ holdingSos ? 'Tahan...' : 'SOS' }}</strong>
              <span class="sos-btn-sub">Tahan 3 Detik</span>
            </div>
            <div v-if="holdingSos" class="sos-hold-ring" />
          </button>
          <p class="sos-btn-caption">
            Tekan dan tahan tombol untuk mengaktifkan sinyal darurat ke kontak terpercaya.
          </p>
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
            <span v-else>📍 Update Lokasi</span>
          </button>

          <button
            type="button"
            class="beacon-action-btn beacon-action-btn--secondary"
            :disabled="actionPending !== null"
            @click="mutateSession('end')"
          >
            <span v-if="actionPending === 'end'">Menutup…</span>
            <span v-else>⏹️ Selesaikan</span>
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
            🚫 Cabut Akses Tautan (Revoke Token)
          </button>
        </div>

        <p v-if="sessionError" class="state-card state-card--error mt-2">{{ sessionError }}</p>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           2. START A NEW RIDE SAFETY SESSION
           ══════════════════════════════════════════════════════════ -->
      <section v-else class="start-session-card">
        <div class="card-heading">
          <span class="section-icon">🛡️</span>
          <div>
            <h2>Mulai Sesi Gowes Aman</h2>
            <p>Pilih kontak darurat dan bagikan koordinat langsung secara privat.</p>
          </div>
        </div>

        <form class="start-form-grid" @submit.prevent="startRide">
          <label>
            <span>Pilih Kontak Terpercaya *</span>
            <select v-model="startForm.trustedContactId" required>
              <option value="" disabled>Pilih kontak…</option>
              <option v-for="c in contacts" :key="c.id" :value="c.id">
                {{ c.name }} {{ c.phone ? `(${c.phone})` : '' }}
              </option>
            </select>
          </label>

          <div v-if="contacts.length === 0" class="no-contact-warning">
            <span>⚠️ Anda belum memiliki kontak darurat. Silakan tambahkan kontak di bawah terlebih dahulu.</span>
          </div>

          <div class="form-grid-2">
            <label>
              <span>Durasi Tautan Privat</span>
              <select v-model="startForm.shareDurationMinutes">
                <option :value="60">1 Jam</option>
                <option :value="120">2 Jam</option>
                <option :value="180">3 Jam (Standar)</option>
                <option :value="300">5 Jam (Long Ride)</option>
              </select>
            </label>
            <label>
              <span>Estimasi Waktu Selesai (Opsional)</span>
              <input v-model="startForm.expectedEndAt" type="datetime-local" />
            </label>
          </div>

          <label>
            <span>Catatan Rute / Rencana Gowes (Opsional)</span>
            <input v-model="startForm.note" placeholder="Contoh: Rute Dago Atas - Warung Bandrek - Tahura" />
          </label>

          <!-- Explicit Consent Checkboxes -->
          <div class="consent-group">
            <label class="consent-checkbox-row">
              <input v-model="startForm.explicitLocationConsent" type="checkbox" required />
              <span>Saya menyetujui lokasi GPS saya dibagikan secara privat hanya kepada kontak terpercaya yang dipilih.</span>
            </label>
            <label class="consent-checkbox-row">
              <input v-model="startForm.disclaimerAcknowledged" type="checkbox" required />
              <span>Saya memahami GowesKit bukan layanan panggilan darurat kepolisian/ambulans (110/112).</span>
            </label>
          </div>

          <button
            class="button button--primary button--full"
            type="submit"
            :disabled="sessionSaving || contacts.length === 0"
          >
            {{ sessionSaving ? 'Memulai Sesi…' : '🛡️ Mulai Sesi Gowes Aman' }}
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
            @click="showAddContact = !showAddContact"
          >
            {{ showAddContact ? 'Batal' : '＋ Tambah Kontak' }}
          </button>
        </div>

        <!-- Add Contact Inline Form -->
        <form v-if="showAddContact" class="add-contact-card" @submit.prevent="createContact">
          <h4>Tambah Kontak Baru</h4>
          <div class="form-grid-2">
            <label>
              <span>Nama Lengkap *</span>
              <input v-model="contactForm.name" required placeholder="Contoh: Budi (Kakak)" />
            </label>
            <label>
              <span>Nomor WhatsApp / HP</span>
              <input v-model="contactForm.phone" type="tel" placeholder="Contoh: 081234567890" />
            </label>
          </div>
          <div class="form-grid-2">
            <label>
              <span>Alamat Email</span>
              <input v-model="contactForm.email" type="email" placeholder="Contoh: keluarga@example.com" />
            </label>
            <label>
              <span>Catatan Hubungan</span>
              <input v-model="contactForm.note" placeholder="Contoh: Saudara kandung / Rekan Peloton" />
            </label>
          </div>
          <button class="button button--primary" type="submit" :disabled="contactSaving">
            {{ contactSaving ? 'Menyimpan…' : 'Simpan Kontak' }}
          </button>
          <p v-if="contactError" class="state-card state-card--error" role="alert">{{ contactError }}</p>
        </form>

        <!-- Contacts Inset Grouped List -->
        <div class="contacts-grouped-list">
          <p v-if="contacts.length === 0" class="empty-contacts-hint">
            Belum ada kontak darurat yang terdaftar.
          </p>
          <div
            v-for="contact in contacts"
            v-else
            :key="contact.id"
            class="contact-item-row"
          >
            <div class="contact-avatar-box">👤</div>
            <div class="contact-body">
              <strong class="contact-name">{{ contact.name }}</strong>
              <span v-if="contact.phone" class="contact-detail">📱 {{ contact.phone }}</span>
              <span v-if="contact.email" class="contact-detail">✉️ {{ contact.email }}</span>
              <small v-if="contact.note" class="contact-note">Catatan: {{ contact.note }}</small>
            </div>
            <button
              class="contact-delete-btn"
              type="button"
              title="Hapus kontak"
              @click="deleteContact(contact)"
            >
              🗑️
            </button>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           4. PAST SESSIONS LOG & AI RIDE FLEX
           ══════════════════════════════════════════════════════════ -->
      <section v-if="pastSessions.length" class="history-section">
        <div class="history-header-row">
          <h3 class="section-title">Riwayat Sesi Gowes</h3>
          <NuxtLink class="studio-shortcut-link" to="/ride-flex">
            <span>✨ Buka AI Flex Studio</span>
            <span>→</span>
          </NuxtLink>
        </div>
        <div class="history-feed">
          <div v-for="s in pastSessions" :key="s.id" class="history-card">
            <div class="history-top">
              <span class="history-date">📅 {{ formatDate(s.startedAt) }}</span>
              <span class="history-badge" :class="statusBadge(s.status).class">
                {{ statusBadge(s.status).label }}
              </span>
            </div>
            <p v-if="s.note" class="history-note">{{ s.note }}</p>
            <div class="history-footer-row">
              <small class="history-ended">Selesai: {{ formatDate(s.endedAt) }}</small>
              <NuxtLink
                class="card-flex-btn"
                :to="`/ride-flex?note=${encodeURIComponent(s.note || 'Gowes Solo')}`"
              >
                <span>📸 Buat Poster AI</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           5. EMERGENCY DISCLAIMER BANNER
           ══════════════════════════════════════════════════════════ -->
      <aside class="disclaimer-banner" aria-label="Disclaimer Layanan Darurat">
        <span class="disclaimer-icon">⚠️</span>
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
    </template>
  </div>
</template>

<style scoped>
.safety-container {
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

.live-pill {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 900;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.live-pill--active {
  background: rgb(201 243 106 / 50%);
  color: #166534;
}

.live-pill--sos {
  background: #fee2e2;
  color: #dc2626;
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

/* 1. Pro Telemetry Beacon Card (Garmin LiveTrack & Apple Workout style) */
.pro-beacon-card {
  display: grid;
  gap: 0.85rem;
  padding: 1.15rem 1.25rem;
  border-radius: 1.25rem;
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
}

.beacon-status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.beacon-pulse-circle {
  width: 0.6rem;
  height: 0.6rem;
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

/* Compact Timestrip */
.beacon-timestrip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: 0.8rem;
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

/* Share URL Bar */
.beacon-share-row {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.8rem;
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
  box-shadow: 0 1px 4px rgba(201, 243, 106, 0.4);
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

/* Tactile Round SOS Button */
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
  -webkit-user-select: none;
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
  letter-spacing: 0.02em;
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

/* Action Buttons Row */
.beacon-actions-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 0.5rem;
}

.beacon-action-btn {
  padding: 0.6rem 0.85rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 850;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: center;
  transition: transform 90ms ease;
}

.beacon-action-btn:active {
  transform: scale(0.97);
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
}

.beacon-revoke-link:hover {
  opacity: 1;
}

.share-btn--wa {
  background: #25d366;
  color: #ffffff;
}

.share-btn--copy {
  background: var(--color-white);
  color: var(--color-ink);
  border: 1px solid rgb(23 32 42 / 12%);
}

.copy-notice {
  font-size: 0.72rem;
  font-weight: 800;
  color: #166534;
}

/* SOS Hold Button */
.sos-action-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 0;
}

.sos-hold-btn {
  width: 7.5rem;
  height: 7.5rem;
  border-radius: 50%;
  background: #ef4444;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 24px rgb(239 68 68 / 40%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.sos-hold-btn--holding {
  transform: scale(0.92);
  box-shadow: 0 0 0 10px rgb(239 68 68 / 30%);
  background: #dc2626;
}

.sos-hold-label {
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.sos-hold-sub {
  font-size: 0.68rem;
  font-weight: 800;
  opacity: 0.9;
}

.sos-hint {
  font-size: 0.72rem;
  color: var(--color-asphalt);
  text-align: center;
}

/* Active Session Buttons */
.active-session-actions {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 0.45rem;
}

@media (max-width: 32rem) {
  .active-session-actions {
    grid-template-columns: 1fr;
  }
}

.session-btn {
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.78rem;
  font-weight: 850;
  border: 1px solid var(--color-sand);
  cursor: pointer;
  text-align: center;
}

.session-btn--gps {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

.session-btn--end {
  background: var(--color-white);
  color: var(--color-ink);
}

.session-btn--revoke {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

/* Start Session Card */
.start-session-card {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 20px rgb(23 32 42 / 5%);
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  font-size: 1.8rem;
}

.card-heading h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
}

.card-heading p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
}

.start-form-grid {
  display: grid;
  gap: 0.85rem;
}

.start-form-grid label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.start-form-grid input,
.start-form-grid select {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  font-size: 0.82rem;
  outline: none;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

@media (max-width: 32rem) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}

.no-contact-warning {
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: #fffbeb;
  color: #b45309;
  font-size: 0.76rem;
  font-weight: 750;
}

.consent-group {
  display: grid;
  gap: 0.45rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.consent-checkbox-row {
  display: flex !important;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.74rem !important;
  color: var(--color-ink) !important;
  font-weight: 750 !important;
  line-height: 1.35;
  cursor: pointer;
}

.consent-checkbox-row input {
  width: auto !important;
  margin-top: 0.15rem;
  accent-color: var(--color-ink);
}

/* Contacts Section */
.contacts-section {
  display: grid;
  gap: 0.75rem;
}

.contacts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
}

.section-desc {
  margin: 0;
  font-size: 0.76rem;
  color: var(--color-asphalt);
}

.add-contact-btn {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  font-size: 0.75rem;
  font-weight: 850;
  color: var(--color-ink);
  cursor: pointer;
  white-space: nowrap;
}

.add-contact-card {
  display: grid;
  gap: 0.65rem;
  padding: 1.15rem;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.add-contact-card h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 850;
}

.add-contact-card label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.add-contact-card input {
  padding: 0.5rem 0.65rem;
  border-radius: 0.6rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  font-size: 0.8rem;
  outline: none;
}

.contacts-grouped-list {
  display: flex;
  flex-direction: column;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  overflow: hidden;
}

.empty-contacts-hint {
  padding: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  margin: 0;
}

.contact-item-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgb(23 32 42 / 6%);
}

.contact-item-row:last-child {
  border-bottom: none;
}

.contact-avatar-box {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.75rem;
  background: var(--color-sand);
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.contact-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.contact-name {
  font-size: 0.88rem;
  font-weight: 850;
}

.contact-detail {
  font-size: 0.74rem;
  color: var(--color-asphalt);
}

.contact-note {
  font-size: 0.7rem;
  color: var(--color-asphalt);
  font-style: italic;
}

.contact-delete-btn {
  border: none;
  background: none;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.4rem;
  opacity: 0.6;
}

.contact-delete-btn:hover {
  opacity: 1;
}

/* History */
.history-section {
  display: grid;
  gap: 0.65rem;
}

.history-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.studio-shortcut-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 850;
  color: var(--color-ink);
  background: var(--color-chain-lime);
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  text-decoration: none;
  border: 1px solid var(--color-ink);
}

.history-feed {
  display: grid;
  gap: 0.5rem;
}

.history-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.75rem 0.95rem;
  border-radius: 0.95rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.history-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.history-date {
  font-size: 0.8rem;
  font-weight: 850;
}

.history-badge {
  font-size: 0.68rem;
  font-weight: 850;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
}

.history-note {
  margin: 0;
  font-size: 0.76rem;
  color: var(--color-asphalt);
}

.history-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.2rem;
}

.history-ended {
  font-size: 0.68rem;
  color: var(--color-asphalt);
}

.card-flex-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 850;
  color: var(--color-ink);
  background: var(--color-sand);
  border: 1px solid rgb(23 32 42 / 10%);
  padding: 0.2rem 0.55rem;
  border-radius: 0.5rem;
  text-decoration: none;
}

.card-flex-btn:hover {
  background: var(--color-chain-lime);
}

/* Disclaimer Banner */
.disclaimer-banner {
  display: flex;
  gap: 0.75rem;
  padding: 0.95rem 1.15rem;
  border-radius: 1.15rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.disclaimer-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.disclaimer-text strong {
  font-size: 0.8rem;
  display: block;
}

.disclaimer-text p {
  margin: 0.2rem 0 0;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

/* Guest Mode */
.native-guest-box {
  display: grid;
  gap: 1rem;
  text-align: center;
  padding: 2.25rem 1.5rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
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
</style>
