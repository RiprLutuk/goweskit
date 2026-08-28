<script setup lang="ts">
import type { ContributorReputationResponse } from '@goweskit/contracts';

import { REPUTATION_LEVEL_LABELS } from '../../community-display';

const api = useApi();
const { user, initialized, refresh } = useAuth();
const response = ref<ContributorReputationResponse | null>(null);
const loading = ref(true);
const errorMessage = ref('');

async function loadReputation(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (!initialized.value) await refresh();
    if (!user.value) return;
    response.value = await api<ContributorReputationResponse>(
      '/community/reputation/me',
    );
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(loadReputation);
</script>

<template>
  <div class="page-stack reputation-page">
    <NuxtLink class="back-link" to="/community">← Community directory</NuxtLink>
    <header class="page-heading">
      <span class="status-chip">Community contribution</span>
      <h1>Your reputation is built from useful actions.</h1>
      <p>
        GowesKit counts hosted rides, completed rides, and moderation work. It
        is not a follower count or popularity contest.
      </p>
    </header>

    <p v-if="loading" class="state-card" role="status">
      Loading your contribution record…
    </p>
    <section
      v-else-if="!user"
      class="permission-card"
      aria-labelledby="reputation-sign-in-title"
    >
      <span aria-hidden="true">◎</span>
      <div>
        <h2 id="reputation-sign-in-title">Sign in to view your reputation</h2>
        <p>Your contribution record is private to your account.</p>
        <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
      </div>
    </section>
    <div
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button
        class="button button--secondary"
        type="button"
        @click="loadReputation"
      >
        Try again
      </button>
    </div>
    <template v-else-if="response">
      <section
        class="reputation-score"
        aria-labelledby="reputation-level-title"
      >
        <div class="reputation-score__ring" aria-hidden="true">
          {{ response.reputation.score }}
        </div>
        <div>
          <p class="section-heading__eyebrow">Current level</p>
          <h2 id="reputation-level-title">
            {{ REPUTATION_LEVEL_LABELS[response.reputation.level] }}
          </h2>
          <p>
            Score {{ response.reputation.score }} is calculated from completed
            community contributions.
          </p>
        </div>
      </section>

      <section aria-labelledby="reputation-inputs-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Transparent inputs</p>
            <h2 id="reputation-inputs-title">What counts</h2>
          </div>
        </div>
        <dl class="reputation-grid">
          <div>
            <dt>{{ response.reputation.hostedEvents }}</dt>
            <dd>Rides hosted</dd>
            <small>2 points each</small>
          </div>
          <div>
            <dt>{{ response.reputation.completedEvents }}</dt>
            <dd>Rides completed</dd>
            <small>5 points each</small>
          </div>
          <div>
            <dt>{{ response.reputation.moderationDecisions }}</dt>
            <dd>Requests reviewed</dd>
            <small>1 point each</small>
          </div>
        </dl>
      </section>

      <aside class="reputation-note">
        <strong>Reputation helps establish contribution context.</strong>
        <p>
          It does not guarantee safety, technical expertise, or event quality.
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
.permission-card,
.reputation-score {
  display: grid;
  padding: 1.25rem;
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  gap: 1rem;
}
.permission-card {
  grid-template-columns: auto minmax(0, 1fr);
}
.permission-card > span {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 1rem;
  background: var(--color-sky);
  font-size: 1.5rem;
}
.permission-card h2 {
  margin: 0;
}
.permission-card p {
  color: var(--color-asphalt);
  line-height: 1.5;
}
.reputation-score {
  align-items: center;
  background: linear-gradient(
    135deg,
    rgb(201 243 106 / 28%),
    var(--color-white)
  );
}
.reputation-score__ring {
  display: grid;
  width: 6rem;
  height: 6rem;
  place-items: center;
  border: 0.7rem solid var(--color-chain-lime);
  border-radius: 50%;
  background: var(--color-white);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.65rem;
  font-weight: 900;
}
.reputation-score h2 {
  margin: 0.2rem 0;
  font-size: 1.8rem;
  letter-spacing: -0.04em;
}
.reputation-score p:last-child {
  margin: 0;
  color: var(--color-asphalt);
  line-height: 1.5;
}
.reputation-grid {
  display: grid;
  margin: 0;
  gap: 0.8rem;
}
.reputation-grid div {
  padding: 1rem;
  border: 1px solid var(--color-sand);
  border-radius: 1rem;
  background: var(--color-white);
}
.reputation-grid dt {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 2rem;
  font-weight: 900;
}
.reputation-grid dd {
  margin: 0.25rem 0;
  font-weight: 850;
}
.reputation-grid small {
  color: var(--color-asphalt);
}
.reputation-note {
  padding: 1rem;
  border-left: 0.35rem solid var(--color-coral);
  border-radius: 0 1rem 1rem 0;
  background: rgb(255 140 117 / 12%);
}
.reputation-note p {
  margin: 0.35rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.5;
}
.state-card--error p {
  margin-top: 0;
}
@media (min-width: 40rem) {
  .reputation-score {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .reputation-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
