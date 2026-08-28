<script setup lang="ts">
import type {
  CommunityDetailResponse,
  CommunityMembershipModerationItem,
  CommunityModerationDecision,
  CommunityModerationQueueResponse,
  ModerateCommunityMembershipResponse,
} from '@goweskit/contracts';

import { formatCommunityDate } from '../../../community-display';

const route = useRoute();
const api = useApi();
const { user, initialized, refresh } = useAuth();
const community = ref<CommunityDetailResponse | null>(null);
const requests = ref<CommunityMembershipModerationItem[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const permissionDenied = ref(false);
const activeMembershipId = ref<string | null>(null);
const actionMessage = ref('');

const communityId = computed(() => String(route.params.id));

async function loadQueue(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  permissionDenied.value = false;
  try {
    if (!initialized.value) await refresh();
    if (!user.value) return;
    const [detailResponse, queueResponse] = await Promise.all([
      api<CommunityDetailResponse>(`/communities/${communityId.value}`),
      api<CommunityModerationQueueResponse>(
        `/communities/${communityId.value}/moderation/requests`,
      ),
    ]);
    community.value = detailResponse;
    requests.value = queueResponse.requests;
  } catch (error: unknown) {
    const apiError = getApiError(error);
    permissionDenied.value = apiError?.error.code === 'COMMUNITY_FORBIDDEN';
    if (!permissionDenied.value) errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function decide(
  item: CommunityMembershipModerationItem,
  decision: CommunityModerationDecision,
): Promise<void> {
  activeMembershipId.value = item.membershipId;
  actionMessage.value = '';
  try {
    const response = await api<ModerateCommunityMembershipResponse>(
      `/communities/${communityId.value}/moderation/requests/${item.membershipId}`,
      { method: 'POST', body: { decision } },
    );
    requests.value = requests.value.filter(
      ({ membershipId }) => membershipId !== item.membershipId,
    );
    actionMessage.value = `${item.requester.displayName}'s request was ${response.status === 'active' ? 'approved' : 'rejected'}.`;
  } catch (error: unknown) {
    actionMessage.value = getApiErrorMessage(error);
  } finally {
    activeMembershipId.value = null;
  }
}

onMounted(loadQueue);
</script>

<template>
  <div class="page-stack moderation-page">
    <NuxtLink class="back-link" :to="`/community/${communityId}`"
      >← Community detail</NuxtLink
    >
    <header class="page-heading">
      <span class="status-chip status-chip--coral"
        >Owner &amp; admin tools</span
      >
      <h1>Review join requests carefully.</h1>
      <p>
        Only the requester's display name and request time are shown. Every
        decision is recorded in the moderation audit.
      </p>
    </header>

    <p v-if="loading" class="state-card" role="status">
      Checking your permission and loading requests…
    </p>
    <section
      v-else-if="!user"
      class="permission-card"
      aria-labelledby="moderation-sign-in-title"
    >
      <h2 id="moderation-sign-in-title">Sign in is required</h2>
      <p>Only an active community owner or admin can open this queue.</p>
      <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
    </section>
    <section
      v-else-if="permissionDenied"
      class="permission-card permission-card--denied"
      role="alert"
    >
      <h2>You do not have moderation access</h2>
      <p>
        This queue is limited to the community owner and admins. No requester
        information was loaded.
      </p>
      <NuxtLink
        class="button button--secondary"
        :to="`/community/${communityId}`"
        >Return to community</NuxtLink
      >
    </section>
    <div
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button class="button button--secondary" type="button" @click="loadQueue">
        Try again
      </button>
    </div>
    <template v-else>
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Moderation queue</p>
          <h2>{{ community?.community.name ?? 'Community' }}</h2>
        </div>
        <span class="count-chip">{{ requests.length }}</span>
      </div>
      <p v-if="actionMessage" class="action-message" role="status">
        {{ actionMessage }}
      </p>
      <section v-if="requests.length === 0" class="queue-empty">
        <span aria-hidden="true">✓</span>
        <div>
          <h2>Queue clear</h2>
          <p>There are no pending join requests to review.</p>
        </div>
      </section>
      <ul
        v-else
        class="request-list"
        aria-label="Pending community join requests"
      >
        <li
          v-for="request in requests"
          :key="request.membershipId"
          class="request-card"
        >
          <span class="request-card__avatar" aria-hidden="true">{{
            request.requester.displayName.slice(0, 1)
          }}</span>
          <div class="request-card__copy">
            <strong>{{ request.requester.displayName }}</strong>
            <span
              >Requested {{ formatCommunityDate(request.requestedAt) }}</span
            >
          </div>
          <div class="request-card__actions">
            <button
              class="button button--primary"
              type="button"
              :disabled="activeMembershipId !== null"
              @click="decide(request, 'approve')"
            >
              {{
                activeMembershipId === request.membershipId
                  ? 'Saving…'
                  : 'Approve'
              }}
            </button>
            <button
              class="button button--secondary button--reject"
              type="button"
              :disabled="activeMembershipId !== null"
              @click="decide(request, 'reject')"
            >
              Reject
            </button>
          </div>
        </li>
      </ul>
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
}
.permission-card,
.queue-empty {
  display: grid;
  justify-items: start;
  padding: 1.25rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  gap: 0.75rem;
}
.permission-card--denied {
  border-color: var(--color-coral);
  background: rgb(255 140 117 / 10%);
}
.permission-card h2,
.permission-card p,
.queue-empty h2,
.queue-empty p {
  margin: 0;
}
.permission-card p,
.queue-empty p {
  color: var(--color-asphalt);
  line-height: 1.5;
}
.queue-empty {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}
.queue-empty > span {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 1rem;
  background: var(--color-chain-lime);
  font-size: 1.5rem;
  font-weight: 900;
}
.action-message {
  margin: 0;
  padding: 0.8rem;
  border-radius: 0.8rem;
  background: rgb(201 243 106 / 25%);
  line-height: 1.5;
}
.request-list {
  display: grid;
  margin: 0;
  padding: 0;
  gap: 0.8rem;
  list-style: none;
}
.request-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-sand);
  border-radius: 1rem;
  background: var(--color-white);
  gap: 0.8rem;
}
.request-card__avatar {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  border-radius: 0.85rem;
  background: var(--color-sky);
  font-weight: 900;
}
.request-card__copy {
  display: grid;
  gap: 0.2rem;
}
.request-card__copy span {
  color: var(--color-asphalt);
  font-size: 0.75rem;
}
.request-card__actions {
  display: flex;
  grid-column: 1 / -1;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.request-card__actions .button {
  flex: 1;
}
.button--reject {
  border-color: var(--color-coral);
}
.state-card--error p {
  margin-top: 0;
}
@media (min-width: 42rem) {
  .request-card {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .request-card__actions {
    grid-column: auto;
  }
  .request-card__actions .button {
    flex: none;
  }
}
</style>
