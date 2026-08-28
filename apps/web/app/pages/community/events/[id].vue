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
const detail = ref<EventDetailResponse | null>(null);
const loading = ref(true);
const joining = ref(false);
const errorMessage = ref('');
const joinMessage = ref('');

const eventId = computed(() => String(route.params.id));
const isJoined = computed(
  () => detail.value?.viewerParticipation?.status === 'joined',
);

async function loadEvent(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (!initialized.value) await refresh();
    detail.value = await api<EventDetailResponse>(`/events/${eventId.value}`);
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function joinEvent(): Promise<void> {
  if (!user.value) {
    await navigateTo(`/login?redirect=/community/events/${eventId.value}`);
    return;
  }
  joining.value = true;
  joinMessage.value = '';
  try {
    const response = await api<JoinEventResponse>(
      `/events/${eventId.value}/join`,
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

onMounted(loadEvent);
</script>

<template>
  <div class="page-stack event-detail-page">
    <NuxtLink class="back-link" to="/community">← Community directory</NuxtLink>
    <p v-if="loading" class="state-card" role="status">Loading ride details…</p>
    <div
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button class="button button--secondary" type="button" @click="loadEvent">
        Try again
      </button>
    </div>
    <template v-else-if="detail">
      <header class="event-hero">
        <div class="event-hero__copy">
          <span class="status-chip status-chip--coral">{{
            detail.event.status
          }}</span>
          <p class="event-hero__community">
            Hosted by
            <NuxtLink :to="`/community/${detail.event.community.id}`">{{
              detail.event.community.name
            }}</NuxtLink>
          </p>
          <h1>{{ detail.event.title }}</h1>
          <p>{{ formatCommunityDate(detail.event.startsAt) }}</p>
        </div>
        <div class="event-join-card">
          <span class="event-join-card__count"
            >{{ detail.event.participantCount
            }}{{
              detail.event.capacity ? ` / ${detail.event.capacity}` : ''
            }}</span
          >
          <strong>riders joined</strong>
          <button
            class="button button--primary"
            type="button"
            :disabled="joining || isJoined"
            @click="joinEvent"
          >
            {{
              joining
                ? 'Saving your place…'
                : isJoined
                  ? 'You joined this ride'
                  : 'Join this ride'
            }}
          </button>
          <p v-if="!user">Sign in is required before joining.</p>
          <p v-if="joinMessage" class="join-message" role="status">
            {{ joinMessage }}
          </p>
        </div>
      </header>

      <section class="event-specs" aria-labelledby="ride-plan-title">
        <div>
          <p class="section-heading__eyebrow">Ride plan</p>
          <h2 id="ride-plan-title">Know before you go</h2>
        </div>
        <dl>
          <div>
            <dt>Meeting area</dt>
            <dd>{{ detail.event.meetingArea }}</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{{ detail.event.difficulty }}</dd>
          </div>
          <div>
            <dt>Bicycles</dt>
            <dd>
              {{
                detail.event.bicycleTypes
                  .map((value) => value.replaceAll('_', ' '))
                  .join(', ')
              }}
            </dd>
          </div>
          <div>
            <dt>Visibility</dt>
            <dd>{{ detail.event.visibility.replace('_', ' ') }}</dd>
          </div>
          <div>
            <dt>Requirements</dt>
            <dd>
              {{
                detail.event.requirements ||
                'No additional requirements were provided.'
              }}
            </dd>
          </div>
        </dl>
      </section>

      <aside class="ride-safety-note">
        <strong
          >This is a community listing, not navigation or emergency
          support.</strong
        >
        <p>
          Confirm the route, weather, equipment, and organizer instructions
          before leaving.
        </p>
      </aside>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  width: fit-content;
  color: var(--color-asphalt);
  font-size: 0.85rem;
  font-weight: 800;
}
.status-chip--coral {
  background: var(--color-coral);
  text-transform: capitalize;
}
.event-hero {
  display: grid;
  padding: clamp(1.25rem, 5vw, 2.2rem);
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  gap: 1.5rem;
}
.event-hero__community {
  margin: 1rem 0 0;
  color: var(--color-asphalt);
  font-size: 0.8rem;
  font-weight: 750;
}
.event-hero h1 {
  margin: 0.5rem 0 0.75rem;
  font-size: clamp(2.2rem, 10vw, 4.3rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}
.event-hero__copy > p:last-child {
  margin: 0;
  color: var(--color-asphalt);
}
.event-join-card {
  display: grid;
  align-content: start;
  padding: 1.15rem;
  border-radius: 1rem;
  background: rgb(255 140 117 / 17%);
  gap: 0.5rem;
}
.event-join-card__count {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 2.2rem;
  font-weight: 900;
  line-height: 1;
}
.event-join-card p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.78rem;
  line-height: 1.45;
}
.event-join-card .join-message {
  padding: 0.65rem;
  border-radius: 0.65rem;
  background: var(--color-white);
  color: var(--color-ink);
}
.event-specs {
  padding: 1.25rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: var(--color-white);
}
.event-specs h2 {
  margin: 0.25rem 0 0;
}
.event-specs dl {
  display: grid;
  margin: 1rem 0 0;
  gap: 0.8rem;
}
.event-specs dl div {
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-sand);
}
.event-specs dt {
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
}
.event-specs dd {
  margin: 0.25rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.55;
  text-transform: capitalize;
}
.ride-safety-note {
  padding: 1rem;
  border-left: 0.35rem solid var(--color-sky);
  border-radius: 0 1rem 1rem 0;
  background: rgb(142 221 244 / 17%);
}
.ride-safety-note p {
  margin: 0.35rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.5;
}
.state-card--error p {
  margin-top: 0;
}
@media (min-width: 48rem) {
  .event-hero {
    grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
  }
  .event-specs dl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
