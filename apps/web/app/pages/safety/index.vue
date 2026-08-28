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
const { user, initialized, refresh, login } = useAuth();
const { triggerHaptic } = usePwa();

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
        name: contactForm.name,
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
  } catch (error: unknown) {
    contactError.value = getApiErrorMessage(error);
  } finally {
    contactSaving.value = false;
  }
}

async function deleteContact(contact: TrustedContact): Promise<void> {
  if (!window.confirm(`Remove ${contact.name} from trusted contacts?`)) return;
  contactError.value = '';
  try {
    await api(`/trusted-contacts/${contact.id}`, { method: 'DELETE' });
    contacts.value = contacts.value.filter(({ id }) => id !== contact.id);
    if (startForm.trustedContactId === contact.id) {
      startForm.trustedContactId = contacts.value[0]?.id ?? '';
    }
  } catch (error: unknown) {
    contactError.value = getApiErrorMessage(error);
  }
}

async function startRide(): Promise<void> {
  if (
    startForm.trustedContactId === '' ||
    !startForm.explicitLocationConsent ||
    !startForm.disclaimerAcknowledged
  ) {
    sessionError.value =
      'Choose a trusted contact and acknowledge both safety statements.';
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
    copyStatus.value = 'Private link copied.';
  } catch {
    copyStatus.value = 'Copy failed. Select and copy the private link below.';
  }
}

async function updateLocation(): Promise<void> {
  const session = activeSession.value;
  if (session === null) return;
  if (!('geolocation' in navigator)) {
    sessionError.value = 'Location is not available in this browser.';
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
        'Location was not shared. Check browser permission, then try again.';
    } else {
      sessionError.value = getApiErrorMessage(error);
    }
  } finally {
    locationSaving.value = false;
  }
}

async function quickDemoLogin(): Promise<void> {
  try {
    await login({
      email: 'demo@goweskit.local',
      password: 'GowesKitDemo123!',
    });
    await loadSafety();
  } catch (error: unknown) {
    pageError.value = getApiErrorMessage(error);
  }
}

async function simulateLocationUpdate(): Promise<void> {
  const session = activeSession.value;
  if (session === null) return;
  locationSaving.value = true;
  sessionError.value = '';
  try {
    const delta = (Math.random() - 0.5) * 0.005;
    const response = await api<SafetySessionResponse>(
      `/safety/sessions/${session.id}/location`,
      {
        method: 'PUT',
        body: {
          coordinate: {
            longitude: 107.6191 + delta,
            latitude: -6.9175 + delta,
          },
          accuracyMeters: 8,
          batteryPercent: 88,
        },
      },
    );
    replaceSession(response.session);
  } catch (error: unknown) {
    sessionError.value = getApiErrorMessage(error);
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
  triggerHaptic(20);
  sosTimer = setTimeout(() => {
    holdingSos.value = false;
    sosTimer = undefined;
    triggerHaptic([100, 50, 100, 50, 200]);
    void mutateSession('sos');
  }, SOS_HOLD_DURATION_MS);
}

function cancelSosHold(): void {
  if (sosTimer !== undefined) clearTimeout(sosTimer);
  sosTimer = undefined;
  holdingSos.value = false;
}

function onSosKeydown(event: KeyboardEvent): void {
  if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
    event.preventDefault();
    beginSosHold();
  }
}

function onSosKeyup(event: KeyboardEvent): void {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    cancelSosHold();
  }
}

async function mutateSession(action: 'sos' | 'end' | 'revoke'): Promise<void> {
  const session = activeSession.value;
  if (session === null) return;
  cancelSosHold();
  actionPending.value = action;
  sessionError.value = '';
  try {
    const response = await api<SafetySessionResponse>(
      `/safety/sessions/${session.id}/${action}`,
      { method: 'POST' },
    );
    replaceSession(response.session);
    if (action === 'end' || action === 'revoke') shareUrl.value = '';
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
  if (value === null) return 'Not set';
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusLabel(status: SafetySession['status']): string {
  return status === 'sos'
    ? 'SOS marked'
    : status.charAt(0).toUpperCase() + status.slice(1);
}
</script>

<template>
  <div class="page-stack safety-page">
    <header class="page-heading safety-heading">
      <span class="status-chip status-chip--coral">Ride Safety</span>
      <h1>Share a last-known ride check-in.</h1>
      <p>
        You decide when a session starts, when location is updated, and when the
        private link stops working. GowesKit does not track in the background.
      </p>
    </header>

    <aside class="safety-disclaimer" aria-label="Important safety limitation">
      <span aria-hidden="true">!</span>
      <p>
        <strong>Not an emergency service.</strong> GowesKit does not contact or
        dispatch emergency services. Shared locations are last-known updates,
        not a live rider location.
      </p>
    </aside>

    <p v-if="loading" class="state-card" role="status">
      Loading your Ride Safety setup…
    </p>
    <section v-else-if="!user" class="state-card signed-out-state">
      <strong>Private Ride Safety Setup</strong>
      <p>
        Sign in to add trusted contacts and start a private safety session.
      </p>
      <div class="action-row">
        <button class="button button--primary" type="button" @click="quickDemoLogin">
          ⚡ 1-Click Demo Login
        </button>
        <NuxtLink class="button button--secondary" to="/login">Sign in</NuxtLink>
      </div>
    </section>
    <p v-else-if="pageError" class="state-card state-card--error" role="alert">
      {{ pageError }}
    </p>

    <template v-else-if="user">
      <section v-if="activeSession" aria-labelledby="active-ride-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Session in progress</p>
            <h2 id="active-ride-title">Current ride</h2>
          </div>
          <span
            class="safety-status"
            :class="`safety-status--${activeSession.status}`"
          >
            {{ statusLabel(activeSession.status) }}
          </span>
        </div>

        <article class="active-ride-card">
          <dl class="ride-facts">
            <div>
              <dt>Started</dt>
              <dd>{{ formatDate(activeSession.startedAt) }}</dd>
            </div>
            <div>
              <dt>Expected back</dt>
              <dd>{{ formatDate(activeSession.expectedEndAt) }}</dd>
            </div>
            <div>
              <dt>Private link expires</dt>
              <dd>{{ formatDate(activeSession.shareExpiresAt) }}</dd>
            </div>
            <div>
              <dt>Last location</dt>
              <dd v-if="activeSession.lastLocation">
                {{ formatDate(activeSession.lastLocation.recordedAt) }} · ±{{
                  Math.round(activeSession.lastLocation.accuracyMeters)
                }}
                m accuracy
              </dd>
              <dd v-else>Not shared yet</dd>
            </div>
          </dl>

          <div v-if="shareUrl" class="share-link-card">
            <div>
              <strong>Private link ready</strong>
              <p>
                Send only to the trusted contact you selected. The secret stays
                after <code>#</code>, outside request URLs.
              </p>
            </div>
            <label for="safety-share-url" class="visually-hidden"
              >Private safety share link</label
            >
            <input
              id="safety-share-url"
              :value="shareUrl"
              type="text"
              readonly
              @focus="($event.target as HTMLInputElement).select()"
            />
            <button
              class="button button--secondary"
              type="button"
              @click="copyShareLink"
            >
              Copy private link
            </button>
            <p class="copy-status" aria-live="polite">{{ copyStatus }}</p>
          </div>

          <div class="location-panel">
            <div>
              <strong>Last-known location only</strong>
              <p>
                Your browser asks permission each time. No automatic or
                background tracking runs after this update.
              </p>
            </div>
            <div class="action-row">
              <button
                class="button button--secondary"
                type="button"
                :disabled="locationSaving || actionPending !== null"
                @click="updateLocation"
              >
                {{ locationSaving ? 'Updating…' : '📍 Update my location now' }}
              </button>
              <button
                class="button button--secondary"
                type="button"
                :disabled="locationSaving || actionPending !== null"
                @click="simulateLocationUpdate"
              >
                {{ locationSaving ? 'Simulating…' : '🧪 Simulate movement' }}
              </button>
            </div>
          </div>

          <div class="safety-actions">
            <div v-if="activeSession.status === 'active'" class="sos-control">
              <button
                class="sos-button"
                :class="{ 'sos-button--holding': holdingSos }"
                type="button"
                :disabled="actionPending !== null"
                aria-describedby="sos-instruction"
                @pointerdown.prevent="beginSosHold"
                @pointerup="cancelSosHold"
                @pointerleave="cancelSosHold"
                @pointercancel="cancelSosHold"
                @keydown="onSosKeydown"
                @keyup="onSosKeyup"
                @contextmenu.prevent
              >
                <span>{{ holdingSos ? 'Keep holding…' : 'Hold for SOS' }}</span>
              </button>
              <p id="sos-instruction">
                Hold for {{ SOS_HOLD_DURATION_MS / 1000 }} seconds. This marks
                the private page as SOS; it does not dispatch help.
              </p>
            </div>
            <p v-else class="sos-marked" role="status">
              SOS is marked on the private share. Contact local emergency
              services directly if help is needed.
            </p>

            <div class="terminal-actions">
              <button
                class="button button--primary"
                type="button"
                :disabled="actionPending !== null"
                @click="mutateSession('end')"
              >
                {{ actionPending === 'end' ? 'Ending…' : 'End ride now' }}
              </button>
              <button
                class="button button--danger"
                type="button"
                :disabled="actionPending !== null"
                @click="mutateSession('revoke')"
              >
                {{
                  actionPending === 'revoke'
                    ? 'Revoking…'
                    : 'Revoke private link now'
                }}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section v-else aria-labelledby="start-ride-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Explicit start</p>
            <h2 id="start-ride-title">Start Ride Safety</h2>
          </div>
        </div>

        <div v-if="contacts.length === 0" class="state-card empty-safety">
          <strong>Add a trusted contact first.</strong>
          <p>
            The temporary share link is meant for one person you trust, not a
            public feed.
          </p>
        </div>
        <form
          v-else
          class="form-card safety-start-form"
          @submit.prevent="startRide"
        >
          <div class="form-stack">
            <label for="safety-contact">
              Trusted contact
              <select
                id="safety-contact"
                v-model="startForm.trustedContactId"
                required
              >
                <option
                  v-for="contact in contacts"
                  :key="contact.id"
                  :value="contact.id"
                >
                  {{ contact.name }}
                </option>
              </select>
            </label>
            <div class="field-grid">
              <label for="expected-end">
                Expected back (optional)
                <input
                  id="expected-end"
                  v-model="startForm.expectedEndAt"
                  type="datetime-local"
                />
              </label>
              <label for="share-duration">
                Link duration
                <select
                  id="share-duration"
                  v-model.number="startForm.shareDurationMinutes"
                >
                  <option :value="60">1 hour</option>
                  <option :value="180">3 hours</option>
                  <option :value="360">6 hours</option>
                  <option :value="720">12 hours</option>
                  <option :value="1440">24 hours</option>
                </select>
              </label>
            </div>
            <label for="ride-note">
              Ride note (optional)
              <textarea
                id="ride-note"
                v-model="startForm.note"
                maxlength="500"
                placeholder="Planned area or when to check in"
              />
            </label>
            <label class="consent-check">
              <input
                v-model="startForm.explicitLocationConsent"
                type="checkbox"
                required
              />
              <span>
                I choose to start this session. Location is shared only when I
                press “Update my location now”.
              </span>
            </label>
            <label class="consent-check">
              <input
                v-model="startForm.disclaimerAcknowledged"
                type="checkbox"
                required
              />
              <span>
                I understand GowesKit is not an emergency service and does not
                dispatch help.
              </span>
            </label>
            <button
              class="button button--primary"
              type="submit"
              :disabled="sessionSaving"
            >
              {{ sessionSaving ? 'Starting…' : 'Start Ride Safety' }}
            </button>
          </div>
        </form>
      </section>

      <p v-if="sessionError" class="state-card state-card--error" role="alert">
        {{ sessionError }}
      </p>

      <section aria-labelledby="contacts-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Private by default</p>
            <h2 id="contacts-title">Trusted contacts</h2>
          </div>
          <span class="count-chip">{{ contacts.length }}</span>
        </div>

        <p v-if="contacts.length === 0" class="state-card">
          No trusted contacts yet. Add one phone number or email address below.
        </p>
        <div v-else class="contact-grid">
          <article
            v-for="contact in contacts"
            :key="contact.id"
            class="contact-card"
          >
            <div>
              <strong>{{ contact.name }}</strong>
              <p>{{ contact.phone || contact.email }}</p>
              <small v-if="contact.note">{{ contact.note }}</small>
            </div>
            <button
              class="text-button text-button--danger"
              type="button"
              @click="deleteContact(contact)"
            >
              Remove
            </button>
          </article>
        </div>

        <form class="form-card contact-form" @submit.prevent="createContact">
          <h3>Add a trusted contact</h3>
          <div class="form-stack">
            <label for="contact-name">
              Name
              <input
                id="contact-name"
                v-model="contactForm.name"
                type="text"
                maxlength="80"
                required
                autocomplete="name"
              />
            </label>
            <div class="field-grid">
              <label for="contact-phone">
                Phone (phone or email required)
                <input
                  id="contact-phone"
                  v-model="contactForm.phone"
                  type="tel"
                  maxlength="160"
                  autocomplete="tel"
                />
              </label>
              <label for="contact-email">
                Email
                <input
                  id="contact-email"
                  v-model="contactForm.email"
                  type="email"
                  maxlength="320"
                  autocomplete="email"
                />
              </label>
            </div>
            <label for="contact-note">
              Note (optional)
              <textarea
                id="contact-note"
                v-model="contactForm.note"
                maxlength="500"
                placeholder="Relationship or preferred check-in method"
              />
            </label>
            <button
              class="button button--secondary"
              type="submit"
              :disabled="contactSaving"
            >
              {{ contactSaving ? 'Adding…' : 'Add trusted contact' }}
            </button>
          </div>
          <p
            v-if="contactError"
            class="form-message form-message--error"
            role="alert"
          >
            {{ contactError }}
          </p>
        </form>
      </section>

      <section
        v-if="pastSessions.length > 0"
        aria-labelledby="past-rides-title"
      >
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Recent history</p>
            <h2 id="past-rides-title">Ended safety sessions</h2>
          </div>
        </div>
        <ul class="past-session-list">
          <li v-for="session in pastSessions" :key="session.id">
            <span class="safety-status">{{ statusLabel(session.status) }}</span>
            <span>{{ formatDate(session.startedAt) }}</span>
            <span v-if="session.lastLocation">
              Last update {{ formatDate(session.lastLocation.recordedAt) }}
            </span>
            <span v-else>No location was shared</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.safety-page {
  gap: 1.5rem;
}

.safety-heading {
  max-width: 48rem;
}

.status-chip--coral {
  background: var(--color-coral);
}

.safety-disclaimer {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  padding: 1rem;
  border: 1px solid rgb(194 65 42 / 25%);
  border-radius: 1rem;
  background: rgb(255 140 117 / 12%);
  gap: 0.75rem;
}

.safety-disclaimer > span {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--color-coral);
  font-weight: 900;
}

.safety-disclaimer p,
.empty-safety p,
.share-link-card p,
.location-panel p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.84rem;
  line-height: 1.55;
}

.active-ride-card {
  overflow: hidden;
  border: 1px solid rgb(64 80 95 / 12%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}

.safety-status {
  display: inline-flex;
  width: fit-content;
  padding: 0.4rem 0.6rem;
  border-radius: 0.6rem;
  background: var(--color-sand);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  font-weight: 800;
}

.safety-status--active {
  background: var(--color-chain-lime);
}

.safety-status--sos {
  background: var(--color-coral);
}

.ride-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.ride-facts div {
  min-width: 0;
  padding: 1rem;
  border-bottom: 1px solid var(--color-sand);
}

.ride-facts div:nth-child(odd) {
  border-right: 1px solid var(--color-sand);
}

.ride-facts dt {
  margin-bottom: 0.3rem;
  color: var(--color-asphalt);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.ride-facts dd {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.45;
}

.share-link-card,
.location-panel,
.safety-actions {
  display: grid;
  padding: 1rem;
  border-bottom: 1px solid var(--color-sand);
  gap: 0.75rem;
}

.share-link-card {
  background: rgb(201 243 106 / 14%);
}

.share-link-card input {
  width: 100%;
  min-height: 2.8rem;
  padding: 0.65rem;
  border: 1px solid #a7b0b8;
  border-radius: 0.7rem;
  background: var(--color-white);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
}

.copy-status {
  min-height: 1.3em;
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.75rem;
}

.sos-control {
  display: grid;
  justify-items: stretch;
  gap: 0.55rem;
}

.sos-button {
  position: relative;
  isolation: isolate;
  min-height: 4rem;
  overflow: hidden;
  padding: 0.9rem 1rem;
  border: 2px solid #9d301e;
  border-radius: 1rem;
  background: rgb(255 140 117 / 22%);
  color: #752719;
  font: inherit;
  font-weight: 900;
  touch-action: none;
  cursor: pointer;
}

.sos-button::before {
  position: absolute;
  z-index: -1;
  inset: 0 auto 0 0;
  width: 0;
  background: var(--color-coral);
  content: '';
}

.sos-button--holding::before {
  width: 100%;
  transition: width 1.6s linear;
}

.sos-control p,
.sos-marked {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.76rem;
  line-height: 1.5;
}

.sos-marked {
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgb(255 140 117 / 16%);
}

.terminal-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.button--danger {
  border-color: #9d301e;
  background: var(--color-white);
  color: #752719;
}

.safety-start-form,
.contact-form {
  max-width: none;
  margin: 0;
}

.consent-check {
  grid-template-columns: auto 1fr !important;
  align-items: start;
  padding: 0.8rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.8rem;
  background: rgb(237 228 210 / 24%);
  font-weight: 600 !important;
  line-height: 1.5;
}

.consent-check input {
  width: 1.25rem !important;
  min-height: 1.25rem !important;
  margin: 0.12rem 0 0;
}

.empty-safety {
  display: grid;
  gap: 0.45rem;
}

.contact-grid,
.past-session-list {
  display: grid;
  margin: 0;
  padding: 0;
  gap: 0.75rem;
}

.contact-card {
  display: flex;
  align-items: start;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid var(--color-sand);
  border-radius: 1rem;
  background: var(--color-white);
  gap: 1rem;
}

.contact-card p,
.contact-card small {
  display: block;
  margin: 0.25rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.45;
}

.contact-form {
  margin-top: 1rem;
}

.contact-form h3 {
  margin: 0;
}

.past-session-list {
  list-style: none;
}

.past-session-list li {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  padding: 0.8rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.9rem;
  background: var(--color-white);
  gap: 0.4rem 0.75rem;
  color: var(--color-asphalt);
  font-size: 0.78rem;
}

.past-session-list li > span:last-child {
  grid-column: 2;
}

@media (min-width: 700px) {
  .field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .location-panel {
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  .contact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 430px) {
  .ride-facts,
  .terminal-actions {
    grid-template-columns: 1fr;
  }

  .ride-facts div:nth-child(odd) {
    border-right: 0;
  }

  .section-heading {
    align-items: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sos-button--holding::before {
    transition: none;
  }

  .sos-button--holding {
    outline: 4px solid var(--color-coral);
    outline-offset: 2px;
  }
}
</style>
