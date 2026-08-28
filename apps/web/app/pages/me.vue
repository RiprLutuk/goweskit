<script setup lang="ts">
import type { BikeListResponse, ContributorReputationResponse } from '@goweskit/contracts';
import type { TrustedContactListResponse } from '@goweskit/contracts/safety';

const api = useApi();
const { user, initialized, refresh, logout, login } = useAuth();
const { canInstall, isStandalone, isIOS, showInstallGuide, installApp, triggerHaptic } = usePwa();
const errorMessage = ref('');
const signingOut = ref(false);
const demoLoggingIn = ref(false);
const hapticFeedbackSent = ref(false);

function testHaptic(): void {
  triggerHaptic([30, 60, 30]);
  hapticFeedbackSent.value = true;
  setTimeout(() => {
    hapticFeedbackSent.value = false;
  }, 2000);
}

const bikeCount = ref(0);
const contactCount = ref(0);
const reputationScore = ref(0);

// Preferences
const distanceUnit = ref('km');
const highContrast = ref(false);

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value) {
    await loadUserStats();
  }
});

async function loadUserStats(): Promise<void> {
  try {
    const [bikesRes, contactsRes, repRes] = await Promise.allSettled([
      api<BikeListResponse>('/bikes'),
      api<TrustedContactListResponse>('/trusted-contacts'),
      api<ContributorReputationResponse>('/community/reputation/me'),
    ]);
    if (bikesRes.status === 'fulfilled') bikeCount.value = bikesRes.value.bikes.length;
    if (contactsRes.status === 'fulfilled') contactCount.value = contactsRes.value.contacts.length;
    if (repRes.status === 'fulfilled') reputationScore.value = repRes.value.reputation.score;
  } catch {
    // optional stats
  }
}

async function signOut(): Promise<void> {
  signingOut.value = true;
  errorMessage.value = '';
  try {
    await logout();
    bikeCount.value = 0;
    contactCount.value = 0;
    reputationScore.value = 0;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    signingOut.value = false;
  }
}

async function quickDemoLogin(): Promise<void> {
  demoLoggingIn.value = true;
  errorMessage.value = '';
  try {
    await login({
      email: 'demo@goweskit.local',
      password: 'GowesKitDemo123!',
    });
    await loadUserStats();
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    demoLoggingIn.value = false;
  }
}
</script>

<template>
  <div class="page-stack profile-page">
    <header class="page-heading">
      <span class="status-chip status-chip--lime">Rider Profile</span>
      <h1>My Account &amp; Preferences</h1>
      <p>
        Manage your personal account, saved garage assets, safety contacts,
        and platform display settings.
      </p>
    </header>

    <p v-if="!initialized" class="state-card" role="status">
      Checking your session…
    </p>

    <!-- Logged in State -->
    <template v-else-if="user">
      <section class="profile-card" aria-labelledby="profile-card-title">
        <div class="profile-card__header">
          <span class="profile-card__avatar" aria-hidden="true">
            {{ user.displayName.slice(0, 1) }}
          </span>
          <div class="profile-card__details">
            <h2 id="profile-card-title">{{ user.displayName }}</h2>
            <p>{{ user.email }}</p>
            <span class="status-chip status-chip--sky">Verified Rider</span>
          </div>
          <button
            class="button button--secondary button--sm"
            type="button"
            :disabled="signingOut"
            @click="signOut"
          >
            {{ signingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </div>

        <!-- Stats Overview -->
        <dl class="profile-stats-grid">
          <div class="profile-stat-box">
            <dt>Garage Bikes</dt>
            <dd>{{ bikeCount }}</dd>
            <NuxtLink to="/garage" class="stat-link">Open Garage →</NuxtLink>
          </div>
          <div class="profile-stat-box">
            <dt>Trusted Contacts</dt>
            <dd>{{ contactCount }}</dd>
            <NuxtLink to="/safety" class="stat-link">Manage Safety →</NuxtLink>
          </div>
          <div class="profile-stat-box">
            <dt>Contribution Score</dt>
            <dd>{{ reputationScore }}</dd>
            <NuxtLink to="/community/reputation" class="stat-link">View Record →</NuxtLink>
          </div>
        </dl>
      </section>

      <!-- Quick Navigation Grid -->
      <section class="menu-cards-grid" aria-label="Account shortcuts">
        <NuxtLink class="menu-tile" to="/garage">
          <span class="menu-tile__icon">🚲</span>
          <div>
            <strong>My Garage</strong>
            <small>Manage bikes, installed components, and service notebook</small>
          </div>
        </NuxtLink>

        <NuxtLink class="menu-tile" to="/upgrade-lab">
          <span class="menu-tile__icon">⚡</span>
          <div>
            <strong>Upgrade Lab</strong>
            <small>Evaluate candidate component compatibility</small>
          </div>
        </NuxtLink>

        <NuxtLink class="menu-tile" to="/safety">
          <span class="menu-tile__icon">🛡️</span>
          <div>
            <strong>Ride Safety</strong>
            <small>Trusted contacts and expiring private share links</small>
          </div>
        </NuxtLink>

        <NuxtLink class="menu-tile" to="/community/reputation">
          <span class="menu-tile__icon">🏆</span>
          <div>
            <strong>Contributor Reputation</strong>
            <small>Transparent activity score and moderation audit</small>
          </div>
        </NuxtLink>
      </section>

      <!-- Preferences & Settings -->
      <section class="preferences-card" aria-labelledby="pref-title">
        <h2 id="pref-title">Display Preferences</h2>
        <div class="pref-options-stack">
          <label class="pref-row">
            <div>
              <strong>Distance Unit</strong>
              <small>Choose your preferred measurement scale</small>
            </div>
            <select v-model="distanceUnit">
              <option value="km">Kilometers (km / m)</option>
              <option value="miles">Miles (mi / ft)</option>
            </select>
          </label>

          <label class="pref-row">
            <div>
              <strong>High Contrast Borders</strong>
              <small>Sharpen component diagrams and spec chips</small>
            </div>
            <input v-model="highContrast" type="checkbox" />
          </label>
        </div>
      </section>

      <!-- Native PWA App Status & Hardware Controls -->
      <section class="pwa-settings-card" aria-labelledby="pwa-status-title">
        <div class="pwa-settings-card__header">
          <span class="pwa-settings-icon" aria-hidden="true">📲</span>
          <div>
            <p class="technical-label">Progressive Web App</p>
            <h2 id="pwa-status-title">Native App Experience</h2>
          </div>
        </div>

        <div class="pwa-status-row">
          <div v-if="isStandalone" class="pwa-badge pwa-badge--installed">
            <span>✓ Installed in Standalone App Mode</span>
          </div>
          <div v-else-if="canInstall" class="pwa-badge pwa-badge--ready">
            <span>⚡ Ready to install on your device</span>
          </div>
          <div v-else class="pwa-badge pwa-badge--browser">
            <span>🌐 Running in Mobile Browser</span>
          </div>
        </div>

        <p class="pwa-desc">
          GowesKit operates completely offline with service worker caching,
          fullscreen standalone window mode, and haptic feedback.
        </p>

        <div class="action-row">
          <button
            v-if="!isStandalone && (canInstall || isIOS)"
            class="button button--primary"
            type="button"
            @click="isIOS ? (showInstallGuide = true) : installApp()"
          >
            {{ isIOS ? '📱 Add to Home Screen (iOS)' : '⚡ Install App on Device' }}
          </button>
          <button
            class="button button--secondary"
            type="button"
            @click="testHaptic"
          >
            {{ hapticFeedbackSent ? '✓ Vibrated!' : '📳 Test Haptic Feedback' }}
          </button>
        </div>
      </section>
    </template>

    <!-- Signed out State -->
    <div v-else class="state-card guest-me-card">
      <span class="guest-me-icon">👤</span>
      <h2>You are currently in Guest Mode</h2>
      <p>
        Sign in to save your personal bikes, record maintenance history, and
        start private solo-ride safety sessions.
      </p>

      <div class="action-row">
        <button
          class="button button--primary"
          type="button"
          :disabled="demoLoggingIn"
          @click="quickDemoLogin"
        >
          {{ demoLoggingIn ? 'Signing in…' : '⚡ 1-Click Demo Login' }}
        </button>
        <NuxtLink class="button button--secondary" to="/login">Sign in with email</NuxtLink>
        <NuxtLink class="button button--secondary" to="/register">Create new account</NuxtLink>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="form-message form-message--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.profile-page {
  gap: 2rem;
}

.profile-card {
  display: grid;
  gap: 1.5rem;
  padding: clamp(1.25rem, 5vw, 2.25rem);
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}

.profile-card__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.25rem;
}

.profile-card__avatar {
  display: grid;
  width: 4.5rem;
  height: 4.5rem;
  place-items: center;
  border-radius: 1.25rem;
  background: var(--color-chain-lime);
  font-size: 2rem;
  font-weight: 900;
}

.profile-card__details h2 {
  margin: 0 0 0.2rem;
  font-size: 1.6rem;
  letter-spacing: -0.03em;
}

.profile-card__details p {
  margin: 0 0 0.5rem;
  color: var(--color-asphalt);
}

.profile-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.85rem;
  margin: 0;
  padding-top: 1rem;
  border-top: 1px solid var(--color-sand);
}

.profile-stat-box {
  padding: 1rem;
  border-radius: 1rem;
  background: rgb(237 228 210 / 35%);
}

.profile-stat-box dt {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-asphalt);
}

.profile-stat-box dd {
  margin: 0.25rem 0 0.5rem;
  font-family: ui-monospace, monospace;
  font-size: 1.8rem;
  font-weight: 900;
}

.stat-link {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-ink);
  text-decoration: none;
}

.stat-link:hover {
  text-decoration: underline;
}

.menu-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 0.85rem;
}

.menu-tile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: var(--color-white);
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow-card);
  transition: border-color 120ms ease, transform 120ms ease;
}

.menu-tile:hover {
  border-color: var(--color-ink);
  transform: translateY(-2px);
}

.menu-tile__icon {
  font-size: 1.8rem;
}

.menu-tile strong {
  display: block;
  font-size: 1rem;
}

.menu-tile small {
  color: var(--color-asphalt);
  font-size: 0.78rem;
  line-height: 1.4;
}

.preferences-card {
  padding: 1.35rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}

.preferences-card h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
}

.pref-options-stack {
  display: grid;
  gap: 1rem;
}

.pref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: rgb(237 228 210 / 25%);
  cursor: pointer;
}

.pref-row strong {
  display: block;
  font-size: 0.9rem;
}

.pref-row small {
  color: var(--color-asphalt);
  font-size: 0.78rem;
}

.pref-row select {
  padding: 0.45rem 0.65rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  font: inherit;
}

.pref-row input[type='checkbox'] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--color-ink);
}

.guest-me-card {
  display: grid;
  gap: 1rem;
  padding: clamp(1.5rem, 5vw, 2.5rem);
  text-align: left;
}

.guest-me-icon {
  font-size: 2.5rem;
}

.guest-me-card h2 {
  margin: 0;
}

.guest-me-card p {
  margin: 0;
  color: var(--color-asphalt);
}

.button--sm {
  min-height: 2.3rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}

.pwa-settings-card {
  display: grid;
  gap: 1rem;
  padding: 1.35rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}

.pwa-settings-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pwa-settings-icon {
  font-size: 1.8rem;
}

.pwa-settings-card__header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.pwa-status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pwa-badge {
  padding: 0.35rem 0.65rem;
  border-radius: 0.6rem;
  font-size: 0.76rem;
  font-weight: 800;
}

.pwa-badge--installed {
  background: rgb(201 243 106 / 40%);
  color: #2b7a1e;
}

.pwa-badge--ready {
  background: rgb(142 221 244 / 45%);
  color: #176b87;
}

.pwa-badge--browser {
  background: var(--color-sand);
  color: var(--color-asphalt);
}

.pwa-desc {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.85rem;
  line-height: 1.5;
}

@media (max-width: 48rem) {
  .profile-card__header {
    grid-template-columns: 1fr;
    justify-items: start;
  }
}
</style>
