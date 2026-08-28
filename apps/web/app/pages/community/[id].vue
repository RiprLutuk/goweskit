<script setup lang="ts">
import type {
  CommunityDetailResponse,
  CommunityEventsResponse,
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
const errorMessage = ref('');
const joinMessage = ref('');

const communityId = computed(() => String(route.params.id));
const isManager = computed(() =>
  ['owner', 'admin'].includes(detail.value?.viewerMembership?.role ?? ''),
);
const isActiveMember = computed(
  () => detail.value?.viewerMembership?.status === 'active',
);
const joinLabel = computed(() => {
  const membership = detail.value?.viewerMembership;
  if (membership?.status === 'active') return 'Already a member';
  if (membership?.status === 'requested') return 'Request pending';
  return detail.value?.community.joinMode === 'open'
    ? 'Join community'
    : 'Request to join';
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

onMounted(loadCommunity);
</script>

<template>
  <div class="page-stack community-detail-page">
    <NuxtLink class="back-link" to="/community">← Community directory</NuxtLink>
    <p v-if="loading" class="state-card" role="status">Loading community…</p>
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
        Try again
      </button>
    </div>
    <template v-else-if="detail">
      <header class="community-hero">
        <div>
          <div class="community-hero__chips">
            <span class="status-chip status-chip--sky">{{
              detail.community.locality
            }}</span>
            <span class="verification-chip">{{
              detail.community.verificationStatus.replaceAll('_', ' ')
            }}</span>
          </div>
          <h1>{{ detail.community.name }}</h1>
          <p>{{ detail.community.description }}</p>
        </div>
        <div class="community-join-card">
          <strong>{{ detail.community.memberCount }} members</strong>
          <span>{{
            detail.community.joinMode === 'open'
              ? 'Open to join'
              : 'Requests reviewed by the community'
          }}</span>
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
            {{ joining ? 'Saving…' : joinLabel }}
          </button>
          <p v-if="!user" class="permission-note">
            Sign in is required before joining.
          </p>
          <p v-if="joinMessage" class="join-message" role="status">
            {{ joinMessage }}
          </p>
        </div>
      </header>

      <section class="community-facts" aria-labelledby="community-facts-title">
        <div>
          <p class="section-heading__eyebrow">Good to know</p>
          <h2 id="community-facts-title">Community details</h2>
        </div>
        <dl>
          <div>
            <dt>Bicycles</dt>
            <dd>
              {{
                detail.community.bicycleTypes
                  .map((value) => value.replaceAll('_', ' '))
                  .join(', ')
              }}
            </dd>
          </div>
          <div>
            <dt>Visibility</dt>
            <dd>{{ detail.community.visibility }}</dd>
          </div>
          <div>
            <dt>Your status</dt>
            <dd>
              {{
                detail.viewerMembership
                  ? `${detail.viewerMembership.role} · ${detail.viewerMembership.status}`
                  : 'Not a member'
              }}
            </dd>
          </div>
        </dl>
        <NuxtLink
          v-if="isManager"
          class="button button--secondary"
          :to="`/community/${communityId}/moderation`"
        >
          Review join requests
        </NuxtLink>
      </section>

      <section aria-labelledby="community-rides-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Ride calendar</p>
            <h2 id="community-rides-title">Upcoming and recent rides</h2>
          </div>
          <span class="count-chip">{{ events.length }}</span>
        </div>
        <p v-if="events.length === 0" class="state-card">
          No rides are visible right now. Members-only rides appear after an
          active membership is confirmed.
        </p>
        <div v-else class="ride-list">
          <RideEventCard
            v-for="event in events"
            :key="event.id"
            :event="event"
          />
        </div>
      </section>
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
.community-hero {
  display: grid;
  padding: clamp(1.25rem, 5vw, 2.2rem);
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  gap: 1.5rem;
}
.community-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.verification-chip {
  padding: 0.4rem 0.65rem;
  border-radius: 0.65rem;
  background: rgb(237 228 210 / 65%);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: capitalize;
}
.community-hero h1 {
  margin: 0.8rem 0;
  font-size: clamp(2.2rem, 10vw, 4.2rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}
.community-hero > div > p {
  max-width: 42rem;
  margin: 0;
  color: var(--color-asphalt);
  line-height: 1.7;
}
.community-join-card {
  display: grid;
  align-content: start;
  padding: 1rem;
  border-radius: 1rem;
  background: rgb(201 243 106 / 23%);
  gap: 0.7rem;
}
.community-join-card > span,
.permission-note {
  color: var(--color-asphalt);
  font-size: 0.78rem;
  line-height: 1.45;
}
.permission-note,
.join-message {
  margin: 0;
}
.join-message {
  padding: 0.65rem;
  border-radius: 0.65rem;
  background: var(--color-white);
  font-size: 0.8rem;
  line-height: 1.45;
}
.community-facts {
  display: grid;
  padding: 1.25rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: rgb(255 255 255 / 76%);
  gap: 1rem;
}
.community-facts h2 {
  margin: 0.25rem 0 0;
}
.community-facts dl {
  display: grid;
  margin: 0;
  gap: 0.75rem;
}
.community-facts dl div {
  padding-top: 0.7rem;
  border-top: 1px solid var(--color-sand);
}
.community-facts dt {
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
}
.community-facts dd {
  margin: 0.25rem 0 0;
  color: var(--color-asphalt);
  text-transform: capitalize;
}
.community-facts .button {
  justify-self: start;
}
.ride-list {
  display: grid;
  gap: 1rem;
}
.state-card--error p {
  margin-top: 0;
}
@media (min-width: 48rem) {
  .community-hero {
    grid-template-columns: minmax(0, 1fr) minmax(15rem, 20rem);
  }
  .ride-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
