<script setup lang="ts">
import type {
  EventDetailResponse,
  JoinEventResponse,
} from '@goweskit/contracts';

import {
  EVENT_JOIN_MESSAGES,
  formatCommunityDate,
} from '../../../community-display';

const route = useRoute();
const api = useApi();
const { user, initialized, refresh } = useAuth();
const { toast } = useNotify();
const { isReminderActive, toggleReminder, getGoogleCalendarUrl, downloadIcsFile, getCountdownText } = useEventReminder();

const detail = ref<EventDetailResponse | null>(null);
const loading = ref(true);
const joining = ref(false);
const errorMessage = ref('');
const joinMessage = ref('');

const eventIdentifier = computed(() => String(route.params.id));
const isJoined = computed(
  () => detail.value?.viewerParticipation?.status === 'joined',
);

const startDate = computed(() =>
  detail.value?.event.startsAt ? new Date(detail.value.event.startsAt) : null,
);

const countdown = computed(() =>
  detail.value ? getCountdownText(detail.value.event.startsAt) : null,
);

const monthLabel = computed(() =>
  startDate.value
    ? startDate.value.toLocaleString('id-ID', { month: 'short' }).toUpperCase()
    : '',
);

const dayNumber = computed(() => {
  if (!startDate.value) return '';
  const d = startDate.value.getDate();
  return d < 10 ? `0${d}` : String(d);
});

const dayName = computed(() =>
  startDate.value
    ? startDate.value.toLocaleString('id-ID', { weekday: 'long' })
    : '',
);

const timeLabel = computed(() =>
  startDate.value
    ? startDate.value.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '',
);

const pageTitle = computed(() =>
  detail.value
    ? `${detail.value.event.title} - Mabar ${detail.value.event.community.name} · GowesKit`
    : 'Jadwal Gowes Bareng · GowesKit',
);

const pageDescription = computed(() =>
  detail.value
    ? `${detail.value.event.title} bersama ${detail.value.event.community.name}. Titik kumpul: ${detail.value.event.meetingArea}. Tingkat kesulitan: ${detail.value.event.difficulty}.`
    : 'Informasi rute, jadwal kumpul, dan registrasi gowes bareng komunitas sepeda di GowesKit.',
);

const canonicalUrl = computed(() => {
  const slugOrId = detail.value?.event.slug || eventIdentifier.value;
  return `https://goweskit.com/community/events/${slugOrId}`;
});

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: 'website',
  ogUrl: canonicalUrl,
  twitterCard: 'summary_large_image',
});

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        detail.value
          ? JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SportsEvent',
              name: detail.value.event.title,
              description: detail.value.event.description,
              startDate: detail.value.event.startsAt,
              location: {
                '@type': 'Place',
                name: detail.value.event.meetingArea,
              },
              organizer: {
                '@type': 'SportsClub',
                name: detail.value.event.community.name,
                url: `https://goweskit.com/community/${detail.value.event.community.slug || detail.value.event.community.id}`,
              },
            })
          : '{}',
      ),
    },
  ],
});

async function loadEvent(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (!initialized.value) await refresh();
    detail.value = await api<EventDetailResponse>(`/events/${eventIdentifier.value}`);
    if (
      detail.value?.event.slug &&
      typeof window !== 'undefined' &&
      route.params.id !== detail.value.event.slug
    ) {
      window.history.replaceState(
        {},
        '',
        `/community/events/${detail.value.event.slug}`,
      );
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function joinEvent(): Promise<void> {
  if (!user.value) {
    await navigateTo(`/login?redirect=/community/events/${eventIdentifier.value}`);
    return;
  }
  joining.value = true;
  joinMessage.value = '';
  try {
    const response = await api<JoinEventResponse>(
      `/events/${eventIdentifier.value}/join`,
      {
        method: 'POST',
        body: {},
      },
    );
    joinMessage.value = EVENT_JOIN_MESSAGES[response.outcome];
    if (detail.value) detail.value.viewerParticipation = response.participation;
  } catch (error: unknown) {
    joinMessage.value = getApiErrorMessage(error);
  } finally {
    joining.value = false;
  }
}

async function shareEventInvitation(): Promise<void> {
  if (!detail.value) return;
  const evt = detail.value.event;
  const url = window.location.href;

  const text = `🚴 UNDANGAN GOWES BARENG (MABAR) · GOWESKIT
━━━━━━━━━━━━━━━━━━━━
🏆 Event: ${evt.title}
👥 Komunitas: ${evt.community.name}
📅 Tanggal: ${dayName.value}, ${formatCommunityDate(evt.startsAt)}
⏰ Waktu: ${timeLabel.value} WIB
📍 Titik Kumpul: ${evt.meetingArea}
🚴 Tipe Sepeda: ${evt.bicycleTypes.join(', ')}
🎯 Tingkat Kesulitan: ${evt.difficulty.toUpperCase()}

🔗 Info rute lengkap & pendaftaran (gratis) di:
${url}

#GowesBareng #MabarGowes #GowesKit #CyclingIndonesia`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Gowes Bareng: ${evt.title}`,
        text,
        url,
      });
      toast.success('Undangan Dibagikan!', 'Siap dibagikan ke WhatsApp Group atau medsos.');
      return;
    } catch {
      // fallback
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success('Undangan Disalin!', 'Siap ditempel ke WhatsApp Group komunitas.');
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
  }
}

onMounted(loadEvent);
</script>

<template>
  <div class="native-container event-detail-page">
    <NuxtLink class="back-link" to="/community">
      <GIcon name="chevron-left" size="xs" />
      <span>Direktori Komunitas</span>
    </NuxtLink>

    <!-- Skeleton Event Detail Shimmer during Loading -->
    <div v-if="loading" style="display: grid; gap: 1rem;">
      <div class="native-event-hero" style="padding: 1.5rem; display: grid; gap: 0.85rem; border-radius: 1.25rem; background: var(--color-white); border: 1px solid rgb(23 32 42 / 8%);">
        <div style="display: flex; gap: 0.5rem;">
          <div class="skeleton-shimmer" style="width: 35%; height: 1.2rem; border-radius: 0.35rem;" />
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div class="skeleton-shimmer" style="width: 4rem; height: 4rem; border-radius: 0.75rem; flex-shrink: 0;" />
          <div style="flex: 1; display: grid; gap: 0.4rem;">
            <div class="skeleton-shimmer" style="width: 70%; height: 1.5rem; border-radius: 0.4rem;" />
            <div class="skeleton-shimmer" style="width: 50%; height: 0.9rem; border-radius: 0.3rem;" />
          </div>
        </div>
        <div class="skeleton-shimmer" style="width: 100%; height: 3.5rem; border-radius: 0.85rem;" />
      </div>
    </div>
    <div
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button class="button button--secondary" type="button" @click="loadEvent">
        Coba Lagi
      </button>
    </div>

    <template v-else-if="detail">
      <!-- 1. Hero Event Card -->
      <header class="native-event-hero">
        <div class="hero-top-bar">
          <NuxtLink
            class="host-community-badge"
            :to="`/community/${detail.event.community.slug || detail.event.community.id}`"
          >
            <GIcon name="bike" size="xs" />
            <span>{{ detail.event.community.name }}</span>
          </NuxtLink>
          <span class="status-badge" :class="`status-badge--${detail.event.status}`">
            {{ detail.event.status === 'scheduled' ? 'Terjadwal' : detail.event.status }}
          </span>
        </div>

        <div class="hero-content-row">
          <!-- Calendar Stamp -->
          <div class="calendar-hero-stamp" aria-hidden="true">
            <div class="stamp-month">{{ monthLabel }}</div>
            <div class="stamp-day">{{ dayNumber }}</div>
          </div>

          <div class="hero-text-block">
            <h1 class="event-title">{{ detail.event.title }}</h1>
            <p class="event-schedule">
              <GIcon name="history" size="xs" />
              <span>{{ dayName }}, {{ formatCommunityDate(detail.event.startsAt) }} · {{ timeLabel }} WIB</span>
            </p>
          </div>
        </div>

        <!-- Join Action Box -->
        <div class="event-join-box">
          <div class="join-counter">
            <strong class="counter-num">
              {{ detail.event.participantCount }}
              <span v-if="detail.event.capacity">/ {{ detail.event.capacity }}</span>
            </strong>
            <span class="counter-lbl">Riders Terdaftar</span>
          </div>

          <div class="event-join-actions">
            <button
              class="button button--primary join-btn"
              type="button"
              :disabled="joining || isJoined"
              @click="joinEvent"
            >
              <GIcon :name="isJoined ? 'check' : 'bike'" size="xs" />
              <span>
                {{
                  joining
                    ? 'Mendaftarkan…'
                    : isJoined
                      ? 'Anda Terdaftar'
                      : 'Gabung Mabar'
                }}
              </span>
            </button>
            <button
              class="button button--secondary share-invite-btn"
              type="button"
              @click="shareEventInvitation"
            >
              <GIcon name="share" size="xs" />
              <span>Undang Teman</span>
            </button>
          </div>
        </div>

        <!-- Reminder & Calendar Sync Action Strip -->
        <div class="event-calendar-strip">
          <div class="calendar-strip-left">
            <span class="countdown-badge" :class="{ 'countdown-badge--urgent': countdown?.isUrgent }">
              <GIcon name="bell" size="xs" :filled="isReminderActive(detail.event.id)" :color="isReminderActive(detail.event.id) ? '#16A34A' : '#64748B'" />
              <span>{{ countdown?.label }}</span>
            </span>
          </div>

          <div class="calendar-strip-actions">
            <button
              class="cal-action-btn"
              :class="{ 'cal-action-btn--active': isReminderActive(detail.event.id) }"
              type="button"
              @click="toggleReminder(detail.event)"
            >
              <GIcon name="bell" size="xs" :filled="isReminderActive(detail.event.id)" />
              <span>{{ isReminderActive(detail.event.id) ? 'Pengingat Aktif' : 'Set Pengingat' }}</span>
            </button>

            <a
              class="cal-action-btn"
              :href="getGoogleCalendarUrl(detail.event)"
              target="_blank"
              rel="noopener noreferrer"
              title="Tambahkan ke Google Calendar"
            >
              <GIcon name="calendar" size="xs" />
              <span>Google Cal</span>
            </a>

            <button
              class="cal-action-btn"
              type="button"
              title="Download file iCalendar (.ics) untuk Apple Calendar / Garmin"
              @click="downloadIcsFile(detail.event)"
            >
              <GIcon name="download" size="xs" />
              <span>.ICS</span>
            </button>
          </div>
        </div>

        <p v-if="!user" class="permission-note">
          Masuk ke akun Anda untuk ikut bergabung dalam jadwal mabar ini.
        </p>
        <p v-if="joinMessage" class="join-message" role="status">
          {{ joinMessage }}
        </p>
      </header>

      <!-- 2. Details & Specs -->
      <section class="native-section" aria-labelledby="ride-plan-title">
        <h3 id="ride-plan-title" class="section-title">Informasi &amp; Rencana Gowes</h3>

        <div class="specs-grid">
          <div class="spec-tile">
            <span class="tile-lbl">Titik Kumpul</span>
            <strong class="tile-val">
              <GIcon name="pin" size="xs" color="#EF4444" />
              <span>{{ detail.event.meetingArea }}</span>
            </strong>
          </div>

          <div class="spec-tile">
            <span class="tile-lbl">Tingkat Kesulitan</span>
            <strong class="tile-val capitalize">
              <GIcon :name="detail.event.difficulty === 'hard' ? 'mountain' : 'route'" size="xs" />
              <span>{{ detail.event.difficulty === 'easy' ? 'Santai (Easy)' : detail.event.difficulty === 'moderate' ? 'Sedang (Moderate)' : 'Nanjak (Hard)' }}</span>
            </strong>
          </div>

          <div class="spec-tile">
            <span class="tile-lbl">Tipe Sepeda</span>
            <strong class="tile-val capitalize">
              <GIcon name="bike" size="xs" />
              <span>{{ detail.event.bicycleTypes.map((v) => v.replaceAll('_', ' ')).join(', ') }}</span>
            </strong>
          </div>

          <div class="spec-tile">
            <span class="tile-lbl">Visibilitas</span>
            <strong class="tile-val capitalize">
              <GIcon :name="detail.event.visibility === 'public' ? 'community' : 'shield'" size="xs" />
              <span>{{ detail.event.visibility === 'public' ? 'Terbuka Umum' : 'Khusus Member' }}</span>
            </strong>
          </div>
        </div>

        <div v-if="detail.event.requirements" class="requirements-box">
          <span class="req-title">
            <GIcon name="shield" size="xs" color="#EF4444" filled />
            <span>Perlengkapan &amp; Syarat Wajib:</span>
          </span>
          <p class="req-content">{{ detail.event.requirements }}</p>
        </div>
      </section>

      <!-- Safety Disclaimer -->
      <aside class="native-safety-disclaimer">
        <strong>🛡️ Komunitas Mandiri:</strong>
        <p>
          Kegiatan gowes diselenggarakan secara sukarela oleh komunitas. GowesKit bukan penyedia layanan darurat jalan raya. Pastikan kondisi rem, ban, helm, dan penerangan siap sebelum berangkat.
        </p>
      </aside>
    </template>
  </div>
</template>

<style scoped>
.event-detail-page {
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

.native-event-hero {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 20px rgb(23 32 42 / 5%);
}

.hero-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.host-community-badge {
  font-size: 0.76rem;
  font-weight: 850;
  color: var(--color-ink);
  text-decoration: none;
  background: var(--color-sand);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.status-badge {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 900;
  text-transform: uppercase;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: #dcfce7;
  color: #15803d;
}

.status-badge--cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.hero-content-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.calendar-hero-stamp {
  flex: 0 0 3.8rem;
  height: 4.2rem;
  border-radius: 1rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgb(0 0 0 / 5%);
}

.stamp-month {
  width: 100%;
  padding: 0.15rem 0;
  background: var(--color-coral);
  color: var(--color-white);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 900;
  text-align: center;
}

.stamp-day {
  flex: 1;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color-ink);
}

.hero-text-block {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.event-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
  line-height: 1.2;
}

.event-schedule {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  font-weight: 600;
}

/* Join Box */
.event-join-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1.1rem;
  border-radius: 1rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  flex-wrap: wrap;
}

.join-counter {
  display: grid;
  gap: 0.1rem;
}

.counter-num {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  color: var(--color-ink);
}

.counter-lbl {
  font-size: 0.7rem;
  color: var(--color-asphalt);
}

.event-join-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.join-btn {
  padding: 0.55rem 1.15rem;
  font-size: 0.82rem;
  font-weight: 850;
}

.share-invite-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 850;
  background: var(--color-white);
  border: 1px solid var(--color-ink);
  color: var(--color-ink);
  cursor: pointer;
}

.permission-note {
  margin: 0;
  font-size: 0.74rem;
  color: var(--color-asphalt);
}

/* Calendar & Reminder Strip */
.event-calendar-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.95rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  flex-wrap: wrap;
}

.calendar-strip-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.countdown-badge {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  color: var(--color-ink);
}

.countdown-badge--urgent {
  background: rgba(22, 163, 74, 0.1);
  color: #15803D;
  border-color: rgba(22, 163, 74, 0.3);
}

.calendar-strip-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.cal-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.74rem;
  font-weight: 850;
  padding: 0.35rem 0.65rem;
  border-radius: 0.55rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  color: var(--color-ink);
  text-decoration: none;
  cursor: pointer;
  transition: all 120ms ease;
}

.cal-action-btn:hover {
  background: var(--color-sand);
}

.cal-action-btn--active {
  background: rgba(22, 163, 74, 0.12);
  color: #15803D;
  border-color: rgba(22, 163, 74, 0.3);
}

.join-message {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #166534;
}

/* Specs */
.native-section {
  display: grid;
  gap: 0.75rem;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

@media (max-width: 32rem) {
  .specs-grid {
    grid-template-columns: 1fr;
  }
}

.spec-tile {
  padding: 0.8rem;
  border-radius: 0.85rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  display: grid;
  gap: 0.2rem;
}

.tile-lbl {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-asphalt);
  text-transform: uppercase;
}

.tile-val {
  font-size: 0.82rem;
  color: var(--color-ink);
}

.requirements-box {
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: #fefce8;
  border: 1px solid #fef08a;
  display: grid;
  gap: 0.25rem;
}

.req-title {
  font-size: 0.72rem;
  font-weight: 850;
  color: #854d0e;
}

.req-content {
  margin: 0;
  font-size: 0.8rem;
  color: #713f12;
  line-height: 1.4;
}

.native-safety-disclaimer {
  padding: 0.85rem 1rem;
  border-radius: 0.95rem;
  background: var(--color-canvas);
  border: 1px dashed rgb(23 32 42 / 20%);
  display: grid;
  gap: 0.2rem;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.native-safety-disclaimer strong {
  color: var(--color-ink);
}
</style>
