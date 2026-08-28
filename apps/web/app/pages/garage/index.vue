<script setup lang="ts">
import type { Bike, BikeListResponse } from '@goweskit/contracts';

const api = useApi();
const { user, initialized, refresh, login } = useAuth();
const bikes = ref<Bike[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const demoLoggingIn = ref(false);
const filterQuery = ref('');

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value === null) {
    loading.value = false;
    return;
  }

  try {
    bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
});

const filteredBikes = computed(() => {
  if (!filterQuery.value.trim()) return bikes.value;
  const q = filterQuery.value.toLowerCase();
  return bikes.value.filter(
    (b) =>
      b.nickname.toLowerCase().includes(q) ||
      b.bicycleType.name.toLowerCase().includes(q) ||
      (b.brand && b.brand.toLowerCase().includes(q)) ||
      (b.model && b.model.toLowerCase().includes(q)),
  );
});

async function quickDemoLogin(): Promise<void> {
  demoLoggingIn.value = true;
  errorMessage.value = '';
  try {
    await login({
      email: 'demo@goweskit.local',
      password: 'GowesKitDemo123!',
    });
    bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    demoLoggingIn.value = false;
  }
}

function bikeTypeIcon(slug: string): string {
  if (slug === 'mtb_hardtail') return '🌲';
  if (slug === 'folding') return '🧲';
  if (slug === 'road') return '⚡';
  if (slug === 'gravel') return '🌾';
  return '🚲';
}

function specsBreakdown(bike: Bike): { known: number; unknown: number } {
  let known = 0;
  let unknown = 0;
  for (const s of bike.specs) {
    if (s.knowledge === 'known') known++;
    else if (s.knowledge === 'unknown') unknown++;
  }
  return { known, unknown };
}
</script>

<template>
  <div class="page-stack garage-page">
    <header class="page-heading page-heading--action">
      <div>
        <span class="status-chip status-chip--lime">My Garage</span>
        <h1>Your bikes, including what you don’t know yet.</h1>
        <p>
          Incomplete details are welcome. GowesKit tracks verified standards,
          keeps unknowns actionable, and never guesses from brand names alone.
        </p>
      </div>
      <NuxtLink v-if="user" class="button button--primary" to="/garage/new">
        ＋ Add a Bike
      </NuxtLink>
    </header>

    <p v-if="loading" class="state-card" role="status">Opening your Garage…</p>

    <!-- Signed-out state with 1-click Demo helper -->
    <div v-else-if="!user" class="garage-guest-box">
      <div class="garage-guest-box__content">
        <span class="garage-guest-icon" aria-hidden="true">🚲</span>
        <div>
          <h2>Sign in to open your personal Garage</h2>
          <p>
            Save your bicycle specifications, installed components, and service
            notebook privately.
          </p>
        </div>
      </div>

      <div class="garage-guest-actions">
        <button
          class="button button--primary"
          type="button"
          :disabled="demoLoggingIn"
          @click="quickDemoLogin"
        >
          {{ demoLoggingIn ? 'Opening Demo Garage…' : '⚡ 1-Click Demo Garage' }}
        </button>
        <NuxtLink class="button button--secondary" to="/login">Sign In</NuxtLink>
        <NuxtLink class="button button--secondary" to="/register">Create Account</NuxtLink>
      </div>
    </div>

    <p
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <template v-else-if="bikes.length">
      <!-- Search/Filter if multiple bikes -->
      <div v-if="bikes.length > 2" class="garage-filter-bar">
        <label for="garage-search" class="visually-hidden">Search bikes</label>
        <input
          id="garage-search"
          v-model="filterQuery"
          type="search"
          placeholder="Filter your bikes by nickname, brand, model, or type…"
        />
      </div>

      <div class="card-grid garage-grid">
        <article
          v-for="bike in filteredBikes"
          :key="bike.id"
          class="bike-card-rich"
        >
          <div class="bike-card-rich__top">
            <span class="bike-type-badge">
              <span aria-hidden="true">{{ bikeTypeIcon(bike.bicycleType.slug) }}</span>
              {{ bike.bicycleType.name }}
            </span>
            <span class="bike-year-tag" v-if="bike.modelYear">{{ bike.modelYear }}</span>
          </div>

          <h2 class="bike-card-rich__title">
            <NuxtLink :to="`/garage/${bike.id}`">{{ bike.nickname }}</NuxtLink>
          </h2>

          <p class="bike-card-rich__model">
            {{
              [bike.brand, bike.model].filter(Boolean).join(' ') ||
              'Brand and model not recorded'
            }}
          </p>

          <div class="bike-specs-meter">
            <div class="bike-specs-meter__stats">
              <span><strong>{{ specsBreakdown(bike).known }}</strong> confirmed</span>
              <span v-if="specsBreakdown(bike).unknown" class="unknown-pill">
                {{ specsBreakdown(bike).unknown }} unknown
              </span>
            </div>
            <div class="meter-bar">
              <div
                class="meter-bar__fill"
                :style="{ width: `${Math.min(100, Math.round((bike.specs.length / 17) * 100))}%` }"
              />
            </div>
          </div>

          <div class="bike-card-rich__actions">
            <NuxtLink class="button button--secondary button--sm" :to="`/garage/${bike.id}`">
              Specs &amp; Service →
            </NuxtLink>
            <NuxtLink class="button button--primary button--sm" :to="`/upgrade-lab?bike=${bike.id}`">
              Check Upgrade
            </NuxtLink>
          </div>
        </article>
      </div>
    </template>

    <div v-else class="state-card empty-garage">
      <span class="empty-garage__wheel" aria-hidden="true">○</span>
      <div>
        <strong>Your Garage is ready for its first bike.</strong>
        <p>Start with a nickname and bike type. Every other standard can wait.</p>
      </div>
      <NuxtLink class="button button--primary" to="/garage/new">Add first bike</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.garage-page {
  gap: 2rem;
}

.status-chip--lime {
  background: var(--color-chain-lime);
}

.garage-guest-box {
  display: grid;
  gap: 1.5rem;
  padding: clamp(1.25rem, 5vw, 2.5rem);
  border: 2px dashed var(--color-ink);
  border-radius: var(--radius-card);
  background: rgb(201 243 106 / 18%);
}

.garage-guest-box__content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.garage-guest-icon {
  font-size: 2.8rem;
}

.garage-guest-box h2 {
  margin: 0;
  font-size: clamp(1.4rem, 5vw, 2rem);
  letter-spacing: -0.035em;
}

.garage-guest-box p {
  margin: 0.35rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.55;
}

.garage-guest-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.garage-filter-bar input {
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.85rem;
  background: var(--color-white);
  font: inherit;
}

.bike-card-rich {
  display: grid;
  gap: 0.85rem;
  padding: 1.35rem;
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  transition: transform 120ms ease, border-color 120ms ease;
}

.bike-card-rich:hover {
  border-color: var(--color-ink);
}

.bike-card-rich__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bike-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border-radius: 0.55rem;
  background: var(--color-sky);
  font-size: 0.75rem;
  font-weight: 800;
}

.bike-year-tag {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.bike-card-rich__title {
  margin: 0.2rem 0 0;
  font-size: 1.5rem;
  letter-spacing: -0.03em;
}

.bike-card-rich__title a {
  text-decoration: none;
  color: inherit;
}

.bike-card-rich__title a:hover {
  text-decoration: underline;
}

.bike-card-rich__model {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.9rem;
}

.bike-specs-meter {
  display: grid;
  gap: 0.4rem;
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: rgb(237 228 210 / 35%);
}

.bike-specs-meter__stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--color-asphalt);
}

.unknown-pill {
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: rgb(142 221 244 / 45%);
  color: var(--color-ink);
  font-weight: 800;
  font-size: 0.7rem;
}

.meter-bar {
  width: 100%;
  height: 0.45rem;
  border-radius: 1rem;
  background: var(--color-sand);
  overflow: hidden;
}

.meter-bar__fill {
  height: 100%;
  background: var(--color-chain-lime);
  border-radius: 1rem;
}

.bike-card-rich__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.button--sm {
  min-height: 2.4rem;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
}
</style>
