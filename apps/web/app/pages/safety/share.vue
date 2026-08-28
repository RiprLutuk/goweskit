<script setup lang="ts">
import type { SafetyShareResponse } from '@goweskit/contracts/safety';

import { formatAccuracy, readSafetyShareToken } from '../../safety';

const api = useApi();
const share = ref<SafetyShareResponse | null>(null);
const loading = ref(true);
const errorMessage = ref('');

onMounted(resolveShare);

async function resolveShare(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  share.value = null;
  const token = readSafetyShareToken(window.location.hash);
  if (token === null) {
    errorMessage.value =
      'This private safety link is invalid, incomplete, or no longer available.';
    loading.value = false;
    return;
  }

  try {
    share.value = await api<SafetyShareResponse>('/safety/share', {
      method: 'POST',
      body: { token },
    });
  } catch {
    errorMessage.value =
      'This private safety link is invalid, expired, revoked, or temporarily unavailable.';
  } finally {
    loading.value = false;
  }
}

function formatDate(value: string | null): string {
  if (value === null) return 'Not set';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

function statusLabel(status: SafetyShareResponse['status']): string {
  return status === 'sos'
    ? 'SOS marked'
    : status.charAt(0).toUpperCase() + status.slice(1);
}
</script>

<template>
  <div class="page-stack share-page">
    <header class="page-heading">
      <span class="status-chip status-chip--sky">Private ride check-in</span>
      <h1>Last-known Ride Safety update</h1>
      <p>
        This page is available only to someone holding the private link. It does
        not show a live rider location.
      </p>
    </header>

    <aside class="public-warning" aria-label="Important safety limitation">
      <span aria-hidden="true">!</span>
      <p>
        <strong>Not an emergency service.</strong> GowesKit does not contact or
        dispatch emergency services. If someone may be in danger, contact the
        appropriate local services directly.
      </p>
    </aside>

    <p v-if="loading" class="state-card" role="status">
      Checking this private link…
    </p>
    <section
      v-else-if="errorMessage"
      class="state-card state-card--error unavailable-card"
      role="alert"
    >
      <strong>Share unavailable</strong>
      <p>{{ errorMessage }}</p>
      <button
        class="button button--secondary"
        type="button"
        @click="resolveShare"
      >
        Try again
      </button>
    </section>

    <template v-else-if="share">
      <section
        class="rider-status-card"
        :class="{ 'rider-status-card--sos': share.status === 'sos' }"
        aria-labelledby="rider-status-title"
      >
        <div class="rider-status-card__heading">
          <div>
            <p class="technical-label">Ride Safety status</p>
            <h2 id="rider-status-title">{{ share.riderDisplayName }}</h2>
          </div>
          <span class="share-status" :class="`share-status--${share.status}`">
            {{ statusLabel(share.status) }}
          </span>
        </div>

        <p v-if="share.status === 'sos'" class="sos-notice">
          The rider deliberately marked SOS in GowesKit. This is only a shared
          status and did not dispatch emergency help.
        </p>

        <dl class="share-facts">
          <div>
            <dt>Ride started</dt>
            <dd>{{ formatDate(share.startedAt) }}</dd>
          </div>
          <div>
            <dt>Expected back</dt>
            <dd>{{ formatDate(share.expectedEndAt) }}</dd>
          </div>
          <div>
            <dt>Status changed</dt>
            <dd>
              {{
                share.sosTriggeredAt
                  ? `SOS marked ${formatDate(share.sosTriggeredAt)}`
                  : share.endedAt
                    ? `Ended ${formatDate(share.endedAt)}`
                    : 'Session is still open'
              }}
            </dd>
          </div>
          <div>
            <dt>Link expires</dt>
            <dd>{{ formatDate(share.shareExpiresAt) }}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="location-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Not live</p>
            <h2 id="location-title">Last-known location</h2>
          </div>
          <span class="not-live-chip">Snapshot</span>
        </div>

        <article v-if="share.lastLocation" class="location-card">
          <div class="location-marker" aria-hidden="true">·</div>
          <div>
            <strong>
              {{ formatCoordinate(share.lastLocation.coordinate.latitude) }},
              {{ formatCoordinate(share.lastLocation.coordinate.longitude) }}
            </strong>
            <p>
              Recorded {{ formatDate(share.lastLocation.recordedAt) }} with
              {{ formatAccuracy(share.lastLocation.accuracyMeters) }} accuracy.
            </p>
            <p class="snapshot-note">
              The rider may have moved since this timestamp. This page does not
              poll or track them in real time.
            </p>
          </div>
        </article>
        <div v-else class="state-card empty-location">
          <strong>No location update shared.</strong>
          <p>
            The rider started a safety session but has not explicitly shared a
            location snapshot.
          </p>
        </div>
      </section>

      <button
        class="button button--secondary refresh-button"
        type="button"
        @click="resolveShare"
      >
        Refresh last-known update
      </button>
      <p class="fragment-note">
        For privacy, the secret part of this link stays in the browser URL
        fragment and is sent only in the protected request body.
      </p>
    </template>
  </div>
</template>

<style scoped>
.share-page {
  max-width: 48rem;
  margin: 0 auto;
  gap: 1.25rem;
}

.public-warning {
  display: grid;
  grid-template-columns: auto 1fr;
  padding: 1rem;
  border: 1px solid rgb(194 65 42 / 25%);
  border-radius: 1rem;
  background: rgb(255 140 117 / 12%);
  gap: 0.75rem;
}

.public-warning > span {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--color-coral);
  font-weight: 900;
}

.public-warning p,
.unavailable-card p,
.empty-location p,
.fragment-note,
.location-card p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.84rem;
  line-height: 1.55;
}

.unavailable-card {
  display: grid;
  justify-items: start;
  gap: 0.75rem;
}

.rider-status-card {
  overflow: hidden;
  border: 2px solid var(--color-chain-lime);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}

.rider-status-card--sos {
  border-color: var(--color-coral);
}

.rider-status-card__heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  padding: 1.2rem;
  gap: 1rem;
}

.rider-status-card__heading h2 {
  margin: 0.25rem 0 0;
  font-size: clamp(1.8rem, 8vw, 2.8rem);
  letter-spacing: -0.045em;
}

.share-status,
.not-live-chip {
  display: inline-flex;
  padding: 0.4rem 0.6rem;
  border-radius: 0.6rem;
  background: var(--color-sand);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  font-weight: 800;
}

.share-status--active {
  background: var(--color-chain-lime);
}

.share-status--sos {
  background: var(--color-coral);
}

.sos-notice {
  margin: 0;
  padding: 0.9rem 1.2rem;
  background: rgb(255 140 117 / 20%);
  color: #752719;
  font-weight: 750;
  line-height: 1.5;
}

.share-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--color-sand);
}

.share-facts div {
  min-width: 0;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--color-sand);
}

.share-facts div:nth-child(odd) {
  border-right: 1px solid var(--color-sand);
}

.share-facts dt {
  margin-bottom: 0.3rem;
  color: var(--color-asphalt);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.share-facts dd {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.45;
}

.not-live-chip {
  background: var(--color-sky);
}

.location-card {
  display: grid;
  grid-template-columns: auto 1fr;
  padding: 1.2rem;
  border: 1px solid rgb(41 136 165 / 25%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  gap: 0.9rem;
}

.location-marker {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 0.7rem solid var(--color-sky);
  border-radius: 50% 50% 50% 0;
  background: var(--color-ink);
  color: var(--color-white);
  font-size: 0;
  transform: rotate(-45deg);
}

.location-card strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.location-card .snapshot-note {
  margin-top: 0.55rem;
  padding: 0.65rem;
  border-radius: 0.7rem;
  background: rgb(142 221 244 / 18%);
}

.empty-location {
  display: grid;
  gap: 0.4rem;
}

.refresh-button {
  justify-self: start;
}

.fragment-note {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-sand);
  font-size: 0.72rem;
}

@media (max-width: 430px) {
  .rider-status-card__heading {
    display: grid;
  }

  .share-facts {
    grid-template-columns: 1fr;
  }

  .share-facts div:nth-child(odd) {
    border-right: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .location-marker {
    transform: none;
  }
}
</style>
