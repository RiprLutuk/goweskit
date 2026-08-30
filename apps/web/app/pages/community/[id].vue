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
const copiedLink = ref(false);

const communityIdentifier = computed(() =>
  String(route.params.slug || route.params.id),
);

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

const initials = computed(() => {
  if (!detail.value?.community.name) return 'GK';
  const words = detail.value.community.name.split(' ').filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase();
  }
  return detail.value.community.name.slice(0, 2).toUpperCase();
});

const isVerified = computed(() => {
  const status = detail.value?.community.verificationStatus;
  return status === 'staff_verified' || status === 'community_verified';
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

// ── SEO & Structured Data for Google Crawler ───────────────────
watchEffect(() => {
  if (detail.value?.community) {
    const c = detail.value.community;
    useSeoMeta({
      title: `${c.name} · Komunitas Sepeda GowesKit`,
      description:
        c.description ||
        `Komunitas sepeda ${c.name} berbasis di ${c.locality}. Temukan jadwal gowes bersama dan bergabung di GowesKit.`,
      ogTitle: `${c.name} · Komunitas GowesKit`,
      ogDescription:
        c.description ||
        `Komunitas ${c.name} (${c.locality}) di platform GowesKit.`,
      ogType: 'website',
      twitterCard: 'summary',
    });

    // Auto-update browser URL to clean slug if accessed via raw UUID
    if (
      import.meta.client &&
      c.slug &&
      route.params.id &&
      route.params.id !== c.slug
    ) {
      window.history.replaceState({}, '', `/community/${c.slug}`);
    }
  }
});

useHead(() => {
  if (!detail.value?.community) return {};
  const c = detail.value.community;
  return {
    link: [
      {
        rel: 'canonical',
        href: `https://goweskit.com/community/${c.slug}`,
      },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SportsClub',
          name: c.name,
          description: c.description,
          address: {
            '@type': 'PostalAddress',
            addressLocality: c.locality,
          },
          memberOf: {
            '@type': 'Organization',
            name: 'GowesKit',
          },
        }),
      },
    ],
  };
});

async function loadCommunity(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (!initialized.value) await refresh();
    const [communityResponse, eventResponse] = await Promise.all([
      api<CommunityDetailResponse>(`/communities/${communityIdentifier.value}`),
      api<CommunityEventsResponse>(
        `/communities/${communityIdentifier.value}/events`,
      ),
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
    await navigateTo(
      `/login?redirect=/community/${communityIdentifier.value}`,
    );
    return;
  }
  joining.value = true;
  joinMessage.value = '';
  try {
    const response = await api<JoinCommunityResponse>(
      `/communities/${communityIdentifier.value}/join`,
      { method: 'POST', body: {} },
    );
    joinMessage.value = COMMUNITY_JOIN_MESSAGES[response.outcome];
    if (detail.value) detail.value.viewerMembership = response.membership;
    if (response.membership?.status === 'active') {
      const eventResponse = await api<CommunityEventsResponse>(
        `/communities/${communityIdentifier.value}/events`,
      );
      events.value = eventResponse.events;
    }
  } catch (error: unknown) {
    joinMessage.value = getApiErrorMessage(error);
  } finally {
    joining.value = false;
  }
}

async function shareCommunity(): Promise<void> {
  if (!detail.value) return;
  const c = detail.value.community;
  const url = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `${c.name} · GowesKit`,
        text: `Gabung komunitas gowes ${c.name} (${c.locality}) di GowesKit!`,
        url,
      });
      return;
    } catch {
      // fallback
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    copiedLink.value = true;
    setTimeout(() => {
      copiedLink.value = false;
    }, 2000);
  } catch {
    // ignore
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
      `/communities/${communityIdentifier.value}/events`,
      {
        method: 'POST',
        body: payload,
      },
    );

    const eventResponse = await api<CommunityEventsResponse>(
      `/communities/${communityIdentifier.value}/events`,
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
    <nav aria-label="Navigasi Halaman">
      <NuxtLink class="back-link" to="/community">
        <GIcon name="chevron-left" size="xs" />
        <span>Direktori Komunitas</span>
      </NuxtLink>
    </nav>

    <!-- Skeleton Community Detail Shimmer during Loading -->
    <div v-if="loading" class="skeleton-stack">
      <div class="skeleton-shimmer" style="width: 100%; height: 12rem; border-radius: 1.25rem;" />
      <div class="skeleton-grid-row">
        <div v-for="i in 3" :key="i" class="skeleton-shimmer" style="height: 6rem; border-radius: 1rem;" />
      </div>
    </div>

    <!-- Error State -->
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
      <!-- ── HERO CARD ───────────────────────────────────────── -->
      <header class="community-hero-card">
        <!-- Top Status Bar: Badges Row -->
        <div class="hero-top-badges">
          <span class="locality-badge">
            <GIcon name="pin" size="xs" color="#EF4444" />
            <span>{{ detail.community.locality }}</span>
          </span>
          <span v-if="isVerified" class="verified-pill">
            <GIcon name="check" size="xs" color="#15803D" filled />
            <span>Terverifikasi</span>
          </span>
          <span class="members-badge">
            <GIcon name="users" size="xs" />
            <span>{{ detail.community.memberCount }} Anggota</span>
          </span>
        </div>

        <!-- Main Identity Row -->
        <div class="hero-identity-row">
          <div class="community-avatar-box">
            <span>{{ initials }}</span>
          </div>

          <div class="hero-identity-text">
            <h1 class="community-title">{{ detail.community.name }}</h1>
            <div class="community-handle-bar">
              <span class="community-handle-pill">@{{ detail.community.slug }}</span>
              <button
                class="share-handle-btn"
                type="button"
                title="Bagikan Tautan Komunitas"
                @click="shareCommunity"
              >
                <GIcon name="share" size="xs" />
                <span>{{ copiedLink ? 'Tersalin' : 'Bagikan' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p v-if="detail.community.description" class="community-description">
          {{ detail.community.description }}
        </p>

        <!-- Bicycle Types Discipline Chips -->
        <div v-if="detail.community.bicycleTypes.length" class="discipline-chips-row">
          <span
            v-for="bType in detail.community.bicycleTypes"
            :key="bType"
            class="discipline-chip"
          >
            <GIcon
              :name="
                bType === 'road'
                  ? 'bike-road'
                  : bType === 'gravel'
                    ? 'bike-gravel'
                    : bType === 'folding'
                      ? 'bike-folding'
                      : 'bike-mtb'
              "
              size="xs"
            />
            <span>{{ bType.replaceAll('_', ' ') }}</span>
          </span>
        </div>

        <!-- Join & Membership Action Card -->
        <div class="membership-action-box">
          <div class="membership-status-info">
            <span class="membership-status-title">
              {{ detail.community.joinMode === 'open' ? 'Pendaftaran Terbuka (Instan)' : 'Pendaftaran dengan Persetujuan' }}
            </span>
            <small v-if="detail.viewerMembership" class="membership-role-tag">
              Status Anda: <strong>{{ detail.viewerMembership.role.toUpperCase() }}</strong> ({{ detail.viewerMembership.status === 'active' ? 'Anggota Aktif' : detail.viewerMembership.status }})
            </small>
            <small v-else class="membership-guest-tag">
              Belum bergabung dalam komunitas ini
            </small>
          </div>

          <button
            class="button button--primary join-action-btn"
            type="button"
            :disabled="
              joining ||
              isActiveMember ||
              detail.viewerMembership?.status === 'requested'
            "
            @click="joinCommunity"
          >
            <GIcon :name="isActiveMember ? 'check' : 'community'" size="xs" />
            <span>{{ joining ? 'Memproses…' : joinLabel }}</span>
          </button>
        </div>

        <p v-if="joinMessage" class="join-toast" role="status">
          {{ joinMessage }}
        </p>
      </header>

      <!-- ── ADMIN MODERATION BANNER (If Manager) ─────────────── -->
      <aside v-if="isManager" class="admin-callout-banner">
        <div class="admin-icon-box">
          <GIcon name="shield" size="md" color="#D97706" filled />
        </div>
        <div class="admin-copy">
          <strong>Akses Pengurus Komunitas</strong>
          <p>Kelola verifikasi calon anggota dan peninjauan permintaan mabar.</p>
        </div>
        <NuxtLink
          class="admin-link-btn"
          :to="`/community/${detail.community.slug}/moderation`"
        >
          <span>Buka Antrean Moderasi</span>
          <span>→</span>
        </NuxtLink>
      </aside>

      <!-- ── COMMUNITY QUICK FACTS (2-COLUMN GRID) ─────────────── -->
      <section class="facts-section" aria-labelledby="community-facts-title">
        <h2 id="community-facts-title" class="section-heading">
          <GIcon name="passport" size="sm" />
          <span>Informasi Komunitas</span>
        </h2>
        <div class="facts-grid">
          <div class="fact-tile">
            <div class="fact-icon-box">
              <GIcon name="pin" size="xs" color="#EF4444" />
            </div>
            <div class="fact-body">
              <span class="fact-label">Wilayah Base</span>
              <strong class="fact-value">{{ detail.community.locality }}</strong>
            </div>
          </div>

          <div class="fact-tile">
            <div class="fact-icon-box">
              <GIcon name="bike" size="xs" />
            </div>
            <div class="fact-body">
              <span class="fact-label">Kategori / Disiplin</span>
              <strong class="fact-value capitalize">
                {{ detail.community.bicycleTypes.map((v) => v.replaceAll('_', ' ')).join(', ') }}
              </strong>
            </div>
          </div>

          <div class="fact-tile">
            <div class="fact-icon-box">
              <GIcon name="community" size="xs" />
            </div>
            <div class="fact-body">
              <span class="fact-label">Visibilitas Publik</span>
              <strong class="fact-value capitalize">
                {{ detail.community.visibility === 'public' ? 'Publik (Dapat Ditemukan)' : 'Komunitas Privat' }}
              </strong>
            </div>
          </div>

          <div class="fact-tile">
            <div class="fact-icon-box">
              <GIcon name="shield" size="xs" color="#15803D" filled />
            </div>
            <div class="fact-body">
              <span class="fact-label">Sistem Pendaftaran</span>
              <strong class="fact-value capitalize">
                {{ detail.community.joinMode === 'open' ? 'Langsung Aktif (Instan)' : 'Persetujuan Pengurus' }}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SCHEDULED RIDES / EVENTS SECTION ────────────────── -->
      <section class="events-section" aria-labelledby="community-rides-title">
        <div class="events-section-header">
          <div class="title-wrap">
            <h2 id="community-rides-title" class="section-heading">
              <GIcon name="history" size="sm" />
              <span>Jadwal Gowes Bersama</span>
            </h2>
            <span class="events-count-badge">{{ events.length }}</span>
          </div>

          <button
            v-if="isActiveMember"
            class="create-mabar-btn"
            type="button"
            @click="showCreateEventModal = true"
          >
            <GIcon name="plus" size="xs" color="#17202A" />
            <span>Buat Jadwal Mabar</span>
          </button>
        </div>

        <div v-if="events.length === 0" class="empty-events-box">
          <div class="empty-icon-circle">
            <GIcon name="bike" size="lg" color="#94A3B8" />
          </div>
          <h3>Belum Ada Jadwal Mabar</h3>
          <p>Komunitas ini belum memiliki jadwal gowes terencana dalam waktu dekat.</p>
        </div>
        <div v-else class="events-feed">
          <RideEventCard
            v-for="event in events"
            :key="event.id"
            :event="event"
          />
        </div>
      </section>

      <!-- ── CREATE EVENT MODAL SHEET ────────────────────────── -->
      <Teleport to="body">
        <div
          v-if="showCreateEventModal"
          class="native-modal-backdrop"
          @click.self="showCreateEventModal = false"
        >
          <div class="native-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="create-event-modal-title">
            <div class="modal-header">
              <div>
                <span class="modal-eyebrow">Event Komunitas</span>
                <h2 id="create-event-modal-title">Buat Jadwal Gowes Baru</h2>
              </div>
              <button class="modal-close" type="button" @click="showCreateEventModal = false">
                <GIcon name="close" size="xs" />
              </button>
            </div>

            <form class="create-event-form" @submit.prevent="submitCreateEvent">
              <p v-if="createEventError" class="state-card state-card--error" role="alert">
                {{ createEventError }}
              </p>
              <p v-if="createEventSuccess" class="state-card state-card--success" role="status">
                {{ createEventSuccess }}
              </p>

              <label class="form-field">
                <span>Judul Jadwal / Mabar *</span>
                <input
                  v-model="newEventForm.title"
                  required
                  placeholder="Contoh: Sabtu Pagi Dago Clifftop Ride"
                />
              </label>

              <label class="form-field">
                <span>Deskripsi &amp; Rencana Rute *</span>
                <textarea
                  v-model="newEventForm.description"
                  required
                  rows="2"
                  placeholder="Contoh: Rolling santai naik ke atas, regroup di warung kopi."
                />
              </label>

              <div class="form-grid-2">
                <label class="form-field">
                  <span>Waktu &amp; Tanggal Mulai *</span>
                  <input
                    v-model="newEventForm.startsAt"
                    type="datetime-local"
                    required
                  />
                </label>
                <label class="form-field">
                  <span>Tingkat Kesulitan</span>
                  <select v-model="newEventForm.difficulty">
                    <option value="easy">Santai (Easy)</option>
                    <option value="moderate">Sedang (Moderate)</option>
                    <option value="hard">Nanjak Berat (Hard)</option>
                  </select>
                </label>
              </div>

              <label class="form-field">
                <span>Titik Kumpul (Meeting Area) *</span>
                <input
                  v-model="newEventForm.meetingArea"
                  required
                  placeholder="Contoh: Taman Cikapayang Dago"
                />
              </label>

              <div class="form-grid-2">
                <label class="form-field">
                  <span>Visibilitas</span>
                  <select v-model="newEventForm.visibility">
                    <option value="public">Publik (Semua Rider)</option>
                    <option value="members_only">Khusus Member Komunitas</option>
                  </select>
                </label>
                <label class="form-field">
                  <span>Kapasitas Peserta (Opsional)</span>
                  <input
                    v-model.number="newEventForm.capacity"
                    type="number"
                    min="2"
                    max="500"
                    placeholder="Maksimal peserta"
                  />
                </label>
              </div>

              <label class="form-field">
                <span>Syarat &amp; Perlengkapan Wajib</span>
                <textarea
                  v-model="newEventForm.requirements"
                  rows="2"
                  placeholder="Contoh: Helm wajib, lampu depan/belakang, ban dalam cadangan."
                />
              </label>

              <button
                class="button button--primary button--full"
                type="submit"
                :disabled="creatingEvent"
              >
                <GIcon name="check" size="xs" />
                <span>{{ creatingEvent ? 'Menyimpan…' : 'Terbitkan Jadwal Mabar' }}</span>
              </button>
            </form>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
.community-detail-page {
  display: grid;
  gap: 1.25rem;
  padding-bottom: 3.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
  color: var(--color-asphalt);
  transition: color 120ms ease;
}

.back-link:hover {
  color: var(--color-ink);
}

/* ── Skeletons ───────────────────────────────────────────── */
.skeleton-stack {
  display: grid;
  gap: 1rem;
}

.skeleton-grid-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

/* ── Hero Card ───────────────────────────────────────────── */
.community-hero-card {
  display: grid;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 20px rgb(23 32 42 / 5%);
}

.hero-top-badges {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.hero-identity-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.community-avatar-box {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(201, 243, 106, 0.45), rgba(15, 118, 110, 0.2));
  border: 2px solid var(--color-chain-lime);
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-ink);
  flex-shrink: 0;
}

.hero-identity-text {
  flex: 1;
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.community-handle-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.community-handle-pill {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-asphalt);
  background: var(--color-canvas);
  padding: 0.15rem 0.5rem;
  border-radius: 0.4rem;
  border: 1px solid var(--color-sand);
}

.share-handle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-ink);
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  padding: 0.15rem 0.5rem;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: all 120ms ease;
}

.share-handle-btn:hover {
  background: var(--color-sand);
}

.locality-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-ink);
  background: var(--color-canvas);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  border: 1px solid var(--color-sand);
}

.verified-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #15803D;
  background: rgba(21, 128, 61, 0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.members-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-asphalt);
  background: var(--color-sand);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.community-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 850;
  letter-spacing: -0.025em;
  color: var(--color-ink);
  line-height: 1.25;
}

.community-description {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-asphalt);
  line-height: 1.5;
}

/* ── Discipline Chips ────────────────────────────────────── */
.discipline-chips-row {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.discipline-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 0.55rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  color: var(--color-ink);
  text-transform: capitalize;
}

/* ── Membership Action Box ───────────────────────────────── */
.membership-action-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.15rem;
  border-radius: 1.1rem;
  background: linear-gradient(135deg, rgba(201, 243, 106, 0.15), var(--color-canvas));
  border: 1px solid var(--color-sand);
  flex-wrap: wrap;
}

.membership-status-info {
  display: grid;
  gap: 0.2rem;
}

.membership-status-title {
  font-size: 0.85rem;
  font-weight: 850;
  color: var(--color-ink);
}

.membership-role-tag {
  font-size: 0.74rem;
  color: #15803D;
}

.membership-guest-tag {
  font-size: 0.74rem;
  color: var(--color-asphalt);
}

.join-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.15rem;
  font-size: 0.82rem;
  font-weight: 850;
  border-radius: 0.75rem;
}

.join-toast {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 800;
  color: #15803D;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(21, 128, 61, 0.1);
}

/* ── Admin Moderation Banner ─────────────────────────────── */
.admin-callout-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem 1.35rem;
  border-radius: 1.15rem;
  background: rgba(217, 119, 6, 0.08);
  border: 1px solid rgba(217, 119, 6, 0.2);
  flex-wrap: wrap;
}

.admin-icon-box {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: rgba(217, 119, 6, 0.15);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.admin-copy {
  flex: 1;
  display: grid;
  gap: 0.15rem;
  min-width: 12rem;
}

.admin-copy strong {
  font-size: 0.88rem;
  font-weight: 850;
  color: #B45309;
}

.admin-copy p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-ink);
}

.admin-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 850;
  color: var(--color-ink);
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  padding: 0.45rem 0.85rem;
  border-radius: 0.65rem;
  text-decoration: none;
  box-shadow: 0 1px 4px rgb(23 32 42 / 6%);
}

/* ── Facts Section ───────────────────────────────────────── */
.facts-section {
  display: grid;
  gap: 0.75rem;
}

.section-heading {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
  color: var(--color-ink);
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (max-width: 580px) {
  .facts-grid {
    grid-template-columns: 1fr;
  }
}

.fact-tile {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 2px 8px rgb(23 32 42 / 3%);
}

.fact-icon-box {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.65rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.fact-body {
  flex: 1;
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.fact-label {
  font-size: 0.68rem;
  font-weight: 850;
  color: var(--color-asphalt);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fact-value {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Events Section ──────────────────────────────────────── */
.events-section {
  display: grid;
  gap: 0.85rem;
}

.events-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.events-count-badge {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: var(--color-sand);
}

.create-mabar-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-size: 0.76rem;
  font-weight: 850;
  border: 1px solid var(--color-ink);
  cursor: pointer;
  box-shadow: 0 1px 0 var(--color-ink);
  transition: transform 90ms ease;
}

.create-mabar-btn:active {
  transform: scale(0.96);
}

.empty-events-box {
  padding: 2.5rem 1.5rem;
  border-radius: 1.25rem;
  background: var(--color-white);
  border: 1.5px dashed var(--color-sand);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.empty-icon-circle {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: var(--color-canvas);
  display: grid;
  place-items: center;
  margin-bottom: 0.25rem;
}

.empty-events-box h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
  color: var(--color-ink);
}

.empty-events-box p {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-asphalt);
}

.events-feed {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.75rem;
}

/* ── Modal Sheet ─────────────────────────────────────────── */
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
  margin: 0.15rem 0 0;
  font-size: 1.2rem;
  font-weight: 850;
}

.modal-close {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-asphalt);
  display: grid;
  place-items: center;
}

.create-event-form {
  display: grid;
  gap: 0.85rem;
}

.form-field {
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

@media (max-width: 480px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
