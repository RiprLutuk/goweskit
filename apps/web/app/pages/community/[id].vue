<script setup lang="ts">
import type {
  CommunityDetailResponse,
  CommunityEventsResponse,
  CreateCommunityEventRequest,
  CreateCommunityEventResponse,
  JoinCommunityResponse,
  PublicEvent,
} from '@goweskit/contracts';

import { COMMUNITY_JOIN_MESSAGES } from '../../community-display';

const route = useRoute();
const api = useApi();
const { user, initialized, refresh } = useAuth();
const detail = ref<CommunityDetailResponse | null>(null);
const events = ref<PublicEvent[]>([]);
const loading = ref(true);
const joining = ref(false);
const creatingEvent = ref(false);
const showCreateEventModal = ref(false);
const errorMessage = ref('');
const joinMessage = ref('');
const createEventError = ref('');
const createEventSuccess = ref('');

const communityId = computed(() => String(route.params.id));
const isManager = computed(() =>
  ['owner', 'admin'].includes(detail.value?.viewerMembership?.role ?? ''),
);
const isActiveMember = computed(
  () => detail.value?.viewerMembership?.status === 'active',
);
const joinLabel = computed(() => {
  const membership = detail.value?.viewerMembership;
  if (membership?.status === 'active') return 'Sudah Menjadi Member';
  if (membership?.status === 'requested') return 'Menunggu Persetujuan';
  return detail.value?.community.joinMode === 'open'
    ? 'Gabung Komunitas'
    : 'Minta Izin Gabung';
});

const newEventForm = reactive({
  title: '',
  description: '',
  startsAt: '',
  meetingArea: '',
  meetingLongitude: 107.6191,
  meetingLatitude: -6.9175,
  difficulty: 'moderate' as 'easy' | 'moderate' | 'hard',
  bicycleTypes: ['road', 'gravel'],
  visibility: 'public' as 'public' | 'members_only',
  capacity: 20 as number | null,
  requirements: '',
});

async function loadCommunity(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (!initialized.value) await refresh();
    const [communityResponse, eventResponse] = await Promise.all([
      api<CommunityDetailResponse>(`/communities/${communityId.value}`),
      api<CommunityEventsResponse>(`/communities/${communityId.value}/events`),
    ]);
    detail.value = communityResponse;
    events.value = eventResponse.events;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function joinCommunity(): Promise<void> {
  if (!user.value) {
    await navigateTo(`/login?redirect=/community/${communityId.value}`);
    return;
  }
  joining.value = true;
  joinMessage.value = '';
  try {
    const response = await api<JoinCommunityResponse>(
      `/communities/${communityId.value}/join`,
      { method: 'POST', body: {} },
    );
    joinMessage.value = COMMUNITY_JOIN_MESSAGES[response.outcome];
    if (detail.value) detail.value.viewerMembership = response.membership;
    if (response.membership?.status === 'active') {
      const eventResponse = await api<CommunityEventsResponse>(
        `/communities/${communityId.value}/events`,
      );
      events.value = eventResponse.events;
    }
  } catch (error: unknown) {
    joinMessage.value = getApiErrorMessage(error);
  } finally {
    joining.value = false;
  }
}

async function submitCreateEvent(): Promise<void> {
  creatingEvent.value = true;
  createEventError.value = '';
  createEventSuccess.value = '';
  try {
    const payload: CreateCommunityEventRequest = {
      title: newEventForm.title.trim(),
      description: newEventForm.description.trim(),
      startsAt: new Date(newEventForm.startsAt).toISOString(),
      meetingArea: newEventForm.meetingArea.trim(),
      meetingCoordinate: {
        longitude: Number(newEventForm.meetingLongitude),
        latitude: Number(newEventForm.meetingLatitude),
      },
      difficulty: newEventForm.difficulty,
      bicycleTypes: newEventForm.bicycleTypes,
      visibility: newEventForm.visibility,
      capacity: newEventForm.capacity ? Number(newEventForm.capacity) : null,
      requirements: newEventForm.requirements.trim(),
    };

    await api<CreateCommunityEventResponse>(
      `/communities/${communityId.value}/events`,
      {
        method: 'POST',
        body: payload,
      },
    );

    const eventResponse = await api<CommunityEventsResponse>(
      `/communities/${communityId.value}/events`,
    );
    events.value = eventResponse.events;
    createEventSuccess.value = '✓ Jadwal gowes berhasil dibuat!';
    setTimeout(() => {
      showCreateEventModal.value = false;
      createEventSuccess.value = '';
    }, 1200);
  } catch (error: unknown) {
    createEventError.value = getApiErrorMessage(error);
  } finally {
    creatingEvent.value = false;
  }
}

onMounted(loadCommunity);
</script>

<template>
  <div class="native-container community-detail-page">
    <NuxtLink class="back-link" to="/community">← Direktori Komunitas</NuxtLink>

    <p v-if="loading" class="state-card" role="status">Memuat data komunitas…</p>
    <div
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button
        class="button button--secondary"
        type="button"
        @click="loadCommunity"
      >
        Coba Lagi
      </button>
    </div>

    <template v-else-if="detail">
      <!-- Hero Card -->
      <header class="native-community-hero">
        <div class="hero-top-row">
          <div class="hero-chips">
            <span class="status-chip status-chip--sky">{{ detail.community.locality }}</span>
            <span class="verification-chip">{{ detail.community.verificationStatus.replaceAll('_', ' ') }}</span>
          </div>
          <span class="member-count-badge">👥 {{ detail.community.memberCount }} Anggota</span>
        </div>

        <h1 class="community-name">{{ detail.community.name }}</h1>
        <p class="community-desc">{{ detail.community.description }}</p>

        <!-- Join Card -->
        <div class="join-action-card">
          <div class="join-info">
            <strong>{{ detail.community.joinMode === 'open' ? 'Gabung Terbuka' : 'Perlu Persetujuan Pengurus' }}</strong>
            <small v-if="detail.viewerMembership">
              Status Anda: {{ detail.viewerMembership.role }} · {{ detail.viewerMembership.status }}
            </small>
            <small v-else>Belum bergabung dalam komunitas ini</small>
          </div>

          <button
            class="button button--primary"
            type="button"
            :disabled="
              joining ||
              isActiveMember ||
              detail.viewerMembership?.status === 'requested'
            "
            @click="joinCommunity"
          >
            {{ joining ? 'Memproses…' : joinLabel }}
          </button>
        </div>

        <p v-if="joinMessage" class="join-message" role="status">
          {{ joinMessage }}
        </p>
      </header>

      <!-- Details Section -->
      <section class="native-section" aria-labelledby="community-facts-title">
        <div class="section-heading-row">
          <h3 id="community-facts-title" class="section-title">Informasi Komunitas</h3>
          <NuxtLink
            v-if="isManager"
            class="mod-queue-link"
            :to="`/community/${communityId}/moderation`"
          >
            🛡️ Antrean Moderasi
          </NuxtLink>
        </div>

        <div class="facts-grid">
          <div class="fact-card">
            <span class="fact-lbl">Tipe Sepeda</span>
            <strong class="fact-val">
              {{ detail.community.bicycleTypes.map((v) => v.replaceAll('_', ' ')).join(', ') }}
            </strong>
          </div>
          <div class="fact-card">
            <span class="fact-lbl">Visibilitas</span>
            <strong class="fact-val capitalize">{{ detail.community.visibility }}</strong>
          </div>
          <div class="fact-card">
            <span class="fact-lbl">Mode Gabung</span>
            <strong class="fact-val capitalize">{{ detail.community.joinMode }}</strong>
          </div>
        </div>
      </section>

      <!-- Events & Rides Section with Create Button -->
      <section class="native-section" aria-labelledby="community-rides-title">
        <div class="section-heading-row">
          <div class="title-with-badge">
            <h3 id="community-rides-title" class="section-title">Jadwal Gowes Bersama</h3>
            <span class="count-badge">{{ events.length }}</span>
          </div>

          <button
            v-if="isActiveMember"
            class="create-event-btn"
            type="button"
            @click="showCreateEventModal = true"
          >
            ＋ Buat Jadwal Mabar
          </button>
        </div>

        <p v-if="events.length === 0" class="state-card state-card--empty">
          Belum ada jadwal gowes terencana untuk komunitas ini.
        </p>
        <div v-else class="events-feed">
          <RideEventCard
            v-for="event in events"
            :key="event.id"
            :event="event"
          />
        </div>
      </section>

      <!-- Create Event Modal Sheet -->
      <div
        v-if="showCreateEventModal"
        class="native-modal-backdrop"
        @click.self="showCreateEventModal = false"
      >
        <div class="native-modal-sheet">
          <div class="modal-header">
            <div>
              <span class="modal-eyebrow">Event Komunitas</span>
              <h2>Buat Jadwal Gowes Baru</h2>
            </div>
            <button class="modal-close" type="button" @click="showCreateEventModal = false">✕</button>
          </div>

          <form class="create-event-form" @submit.prevent="submitCreateEvent">
            <label>
              <span>Judul Jadwal / Mabar *</span>
              <input
                v-model="newEventForm.title"
                required
                placeholder="Contoh: Sabtu Pagi Dago Clifftop Ride"
              />
            </label>

            <label>
              <span>Deskripsi / Rencana Rute *</span>
              <textarea
                v-model="newEventForm.description"
                required
                rows="2"
                placeholder="Contoh: Rolling santai naik ke atas, regroup di warung kopi."
              />
            </label>

            <div class="form-grid-2">
              <label>
                <span>Waktu &amp; Tanggal Mulai *</span>
                <input
                  v-model="newEventForm.startsAt"
                  type="datetime-local"
                  required
                />
              </label>
              <label>
                <span>Tingkat Kesulitan</span>
                <select v-model="newEventForm.difficulty">
                  <option value="easy">Easy (Santai)</option>
                  <option value="moderate">Moderate (Sedang)</option>
                  <option value="hard">Hard (Nanjak Berat)</option>
                </select>
              </label>
            </div>

            <label>
              <span>Tempat Titik Kumpul (Meeting Area) *</span>
              <input
                v-model="newEventForm.meetingArea"
                required
                placeholder="Contoh: Taman Cikapayang Dago"
              />
            </label>

            <div class="form-grid-2">
              <label>
                <span>Visibilitas</span>
                <select v-model="newEventForm.visibility">
                  <option value="public">Publik (Semua Rider)</option>
                  <option value="members_only">Khusus Member Komunitas</option>
                </select>
              </label>
              <label>
                <span>Kapasitas Peserta (Opsional)</span>
                <input
                  v-model="newEventForm.capacity"
                  type="number"
                  placeholder="Contoh: 25"
                  min="1"
                />
              </label>
            </div>

            <label>
              <span>Perlengkapan Wajib / Syarat</span>
              <input
                v-model="newEventForm.requirements"
                placeholder="Contoh: Helm wajib, ban dalam cadangan, lampu depan/belakang."
              />
            </label>

            <p v-if="createEventError" class="state-card state-card--error" role="alert">
              {{ createEventError }}
            </p>
            <p v-if="createEventSuccess" class="state-card state-card--success" role="status">
              {{ createEventSuccess }}
            </p>

            <button
              class="button button--primary button--full"
              type="submit"
              :disabled="creatingEvent"
            >
              {{ creatingEvent ? 'Membuat Jadwal…' : '＋ Terbitkan Jadwal Gowes' }}
            </button>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.community-detail-page {
  display: grid;
  gap: 1.25rem;
  padding-bottom: 2.5rem;
}

.back-link {
  font-size: 0.78rem;
  font-weight: 850;
  text-decoration: none;
  color: var(--color-asphalt);
}

.native-community-hero {
  display: grid;
  gap: 0.85rem;
  padding: 1.25rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 20px rgb(23 32 42 / 5%);
}

.hero-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.hero-chips {
  display: flex;
  gap: 0.35rem;
}

.member-count-badge {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: var(--color-sand);
  color: var(--color-ink);
}

.community-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.community-desc {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.join-action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  flex-wrap: wrap;
}

.join-info {
  display: grid;
  gap: 0.15rem;
}

.join-info strong {
  font-size: 0.82rem;
  color: var(--color-ink);
}

.join-info small {
  font-size: 0.72rem;
  color: var(--color-asphalt);
}

.join-message {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #166534;
}

/* Facts Grid */
.native-section {
  display: grid;
  gap: 0.65rem;
}

.section-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
}

.count-badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  background: var(--color-sand);
}

.mod-queue-link {
  font-size: 0.74rem;
  font-weight: 850;
  text-decoration: none;
  color: var(--color-ink);
  background: var(--color-sand);
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
}

.create-event-btn {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-size: 0.74rem;
  font-weight: 850;
  border: 1px solid var(--color-ink);
  cursor: pointer;
  box-shadow: 0 1px 0 var(--color-ink);
  transition: transform 90ms ease;
}

.create-event-btn:active {
  transform: scale(0.96);
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

@media (max-width: 32rem) {
  .facts-grid {
    grid-template-columns: 1fr;
  }
}

.fact-card {
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  display: grid;
  gap: 0.15rem;
}

.fact-lbl {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-asphalt);
  text-transform: uppercase;
}

.fact-val {
  font-size: 0.82rem;
  color: var(--color-ink);
}

.events-feed {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.75rem;
}

/* Modal Sheet */
.native-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 60%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 1rem;
}

.native-modal-sheet {
  width: 100%;
  max-width: 30rem;
  background: var(--color-white);
  border-radius: 1.35rem;
  padding: 1.35rem;
  box-shadow: 0 16px 48px rgb(0 0 0 / 25%);
  display: grid;
  gap: 1rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  color: var(--color-asphalt);
  text-transform: uppercase;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 850;
}

.modal-close {
  border: none;
  background: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--color-asphalt);
}

.create-event-form {
  display: grid;
  gap: 0.75rem;
}

.create-event-form label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.create-event-form input,
.create-event-form select,
.create-event-form textarea {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
  border: 1px solid var(--color-sand);
  background: var(--color-canvas);
  font-size: 0.82rem;
  outline: none;
  font-family: inherit;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

@media (max-width: 32rem) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}

.state-card--success {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}
</style>
