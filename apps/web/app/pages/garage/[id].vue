<script setup lang="ts">
import {
  BIKE_SPEC_DEFINITIONS,
  type BikeSpecCode,
} from '@goweskit/bike-domain';
import type { Bike, BikeResponse, BikeSpecResponse } from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const { user, initialized, refresh } = useAuth();
const bike = ref<Bike | null>(null);
const loading = ref(true);
const savingCode = ref<BikeSpecCode | null>(null);
const errorMessage = ref('');
const successNotice = ref('');
const activeTab = ref<'specs' | 'components' | 'maintenance'>('specs');
const specGroupFilter = ref('all');
const selections = reactive<Record<string, string>>({});

const bikeId = computed(() => String(route.params.id));

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value === null) {
    loading.value = false;
    return;
  }
  await loadBike();
});

async function loadBike(): Promise<void> {
  try {
    bike.value = (await api<BikeResponse>(`/bikes/${bikeId.value}`)).bike;
    for (const definition of BIKE_SPEC_DEFINITIONS) {
      const spec = bike.value.specs.find(
        ({ standardCode }) => standardCode === definition.code,
      );
      selections[definition.code] =
        spec === undefined
          ? 'missing'
          : spec.knowledge === 'unknown'
            ? 'unknown'
            : (spec.value ?? 'missing');
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function saveSpec(code: BikeSpecCode): Promise<void> {
  const selection = selections[code];
  if (selection === undefined || selection === 'missing') return;
  savingCode.value = code;
  errorMessage.value = '';
  successNotice.value = '';
  try {
    const response = await api<BikeSpecResponse>(
      `/bikes/${bikeId.value}/specs/${code}`,
      {
        method: 'PUT',
        body:
          selection === 'unknown'
            ? { knowledge: 'unknown' }
            : { knowledge: 'known', value: selection },
      },
    );
    if (bike.value !== null) {
      bike.value.specs = [
        ...bike.value.specs.filter(({ standardCode }) => standardCode !== code),
        response.spec,
      ];
      successNotice.value = `Updated ${code.replaceAll('_', ' ')}.`;
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    savingCode.value = null;
  }
}

async function deleteBike(): Promise<void> {
  if (!window.confirm('Remove this bike from your Garage?')) return;
  try {
    await api(`/bikes/${bikeId.value}`, { method: 'DELETE' });
    await navigateTo('/garage');
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  }
}

function bikeTypeIcon(slug: string): string {
  if (slug === 'mtb_hardtail') return '🌲';
  if (slug === 'folding') return '🧲';
  if (slug === 'road') return '⚡';
  if (slug === 'gravel') return '🌾';
  return '🚲';
}

const filteredDefinitions = computed(() => {
  if (specGroupFilter.value === 'all') return BIKE_SPEC_DEFINITIONS;
  return BIKE_SPEC_DEFINITIONS.filter(
    (d) => d.category === specGroupFilter.value,
  );
});

function specStatus(code: string): 'known' | 'unknown' | 'missing' {
  const sel = selections[code];
  if (sel === 'unknown') return 'unknown';
  if (sel && sel !== 'missing') return 'known';
  return 'missing';
}
</script>

<template>
  <div class="page-stack bike-detail-page">
    <NuxtLink class="back-link" to="/garage">← Back to My Garage</NuxtLink>

    <p v-if="loading" class="state-card" role="status">
      Checking bike details…
    </p>
    <div v-else-if="!user" class="state-card signed-out-state">
      <p>Sign in to view this bike.</p>
      <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
    </div>
    <p
      v-else-if="bike === null"
      class="state-card state-card--error"
      role="alert"
    >
      {{ errorMessage || 'Bike not found.' }}
    </p>

    <template v-else>
      <header class="bike-hero-rich">
        <div class="bike-hero-rich__top">
          <div class="bike-hero-rich__icon" aria-hidden="true">
            {{ bikeTypeIcon(bike.bicycleType.slug) }}
          </div>
          <div class="bike-hero-rich__info">
            <span class="status-chip status-chip--lime">{{ bike.bicycleType.name }}</span>
            <h1>{{ bike.nickname }}</h1>
            <p>
              {{
                [bike.brand, bike.model, bike.modelYear]
                  .filter(Boolean)
                  .join(' · ') || 'Custom Build'
              }}
            </p>
          </div>
          <div class="bike-hero-rich__actions">
            <NuxtLink
              class="button button--primary"
              :to="`/upgrade-lab?bike=${bike.id}`"
            >
              ⚡ Check Upgrade
            </NuxtLink>
            <button
              class="text-button text-button--danger"
              type="button"
              @click="deleteBike"
            >
              Remove bike
            </button>
          </div>
        </div>

        <div v-if="bike.notes" class="bike-notes-box">
          <strong>Notes:</strong> {{ bike.notes }}
        </div>
      </header>

      <p v-if="errorMessage" class="state-card state-card--error" role="alert">
        {{ errorMessage }}
      </p>
      <p v-if="successNotice" class="state-card state-card--success" role="status">
        ✓ {{ successNotice }}
      </p>

      <!-- Sub-navigation Tabs -->
      <nav class="bike-tabs-bar" role="tablist" aria-label="Bike management tabs">
        <button
          class="bike-tab"
          :class="{ 'bike-tab--active': activeTab === 'specs' }"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'specs'"
          @click="activeTab = 'specs'"
        >
          📏 Technical Standards
        </button>
        <button
          class="bike-tab"
          :class="{ 'bike-tab--active': activeTab === 'components' }"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'components'"
          @click="activeTab = 'components'"
        >
          ⚙️ Installed Components
        </button>
        <button
          class="bike-tab"
          :class="{ 'bike-tab--active': activeTab === 'maintenance' }"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'maintenance'"
          @click="activeTab = 'maintenance'"
        >
          📒 Service Notebook
        </button>
      </nav>

      <!-- TAB 1: Specs & Standards -->
      <section v-if="activeTab === 'specs'" aria-labelledby="specs-title" class="tab-section">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">100% Deterministic Provenance</p>
            <h2 id="specs-title">Normalized Standards</h2>
            <p class="section-desc">
              Record verified interfaces. "I don't know" is a valid value and will be surfaced
              whenever a check depends on it.
            </p>
          </div>
          <span class="count-chip">{{ bike.specs.length }} / 17</span>
        </div>

        <!-- Spec Group Filter -->
        <div class="spec-category-chips" role="group" aria-label="Filter standards by group">
          <button
            class="filter-pill"
            :class="{ 'filter-pill--active': specGroupFilter === 'all' }"
            type="button"
            @click="specGroupFilter = 'all'"
          >
            All Specs (17)
          </button>
          <button
            class="filter-pill"
            :class="{ 'filter-pill--active': specGroupFilter === 'wheel' }"
            type="button"
            @click="specGroupFilter = 'wheel'"
          >
            Wheels &amp; Axles
          </button>
          <button
            class="filter-pill"
            :class="{ 'filter-pill--active': specGroupFilter === 'drivetrain' }"
            type="button"
            @click="specGroupFilter = 'drivetrain'"
          >
            Drivetrain &amp; BB
          </button>
          <button
            class="filter-pill"
            :class="{ 'filter-pill--active': specGroupFilter === 'frame' }"
            type="button"
            @click="specGroupFilter = 'frame'"
          >
            Fork, Brakes &amp; Frame
          </button>
        </div>

        <div class="spec-list">
          <article
            v-for="definition in filteredDefinitions"
            :key="definition.code"
            class="spec-row"
            :class="`spec-row--${specStatus(definition.code)}`"
          >
            <div class="spec-row__copy">
              <div class="spec-row__topline">
                <strong>{{ definition.label }}</strong>
                <span
                  class="spec-tag"
                  :class="`spec-tag--${specStatus(definition.code)}`"
                >
                  {{
                    specStatus(definition.code) === 'known'
                      ? '✓ Confirmed'
                      : specStatus(definition.code) === 'unknown'
                        ? '? Unknown'
                        : '— Not recorded'
                  }}
                </span>
              </div>
              <span>{{ definition.description }}</span>
            </div>

            <label class="visually-hidden" :for="`spec-${definition.code}`">
              {{ definition.label }} value
            </label>
            <select
              :id="`spec-${definition.code}`"
              v-model="selections[definition.code]"
            >
              <option value="missing">Not recorded</option>
              <option value="unknown">I don’t know</option>
              <option
                v-for="option in definition.values"
                :key="option.code"
                :value="option.code"
              >
                {{ option.label }}
              </option>
            </select>

            <button
              class="button button--secondary"
              type="button"
              :disabled="
                selections[definition.code] === 'missing' ||
                savingCode === definition.code
              "
              @click="saveSpec(definition.code)"
            >
              {{ savingCode === definition.code ? 'Saving…' : 'Save' }}
            </button>

            <p
              v-if="selections[definition.code] === 'unknown'"
              class="unknown-note"
            >
              <strong>Unknown is okay.</strong> {{ definition.guidance }}
            </p>
            <p
              v-else-if="selections[definition.code] === 'missing'"
              class="missing-note"
            >
              This detail has not been recorded yet.
            </p>
          </article>
        </div>
      </section>

      <!-- TAB 2: Installed Components -->
      <section v-else-if="activeTab === 'components'" class="tab-section">
        <InstalledComponents :bike-id="bike.id" />
      </section>

      <!-- TAB 3: Maintenance Service Notebook -->
      <section v-else-if="activeTab === 'maintenance'" class="tab-section">
        <MaintenanceLog :bike-id="bike.id" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.bike-detail-page {
  gap: 2rem;
}

.back-link {
  width: fit-content;
  color: var(--color-asphalt);
  font-weight: 800;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.bike-hero-rich {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.25rem, 5vw, 2.25rem);
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}

.bike-hero-rich__top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.25rem;
}

.bike-hero-rich__icon {
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  border-radius: 1.1rem;
  background: var(--color-chain-lime);
  font-size: 2rem;
}

.bike-hero-rich__info h1 {
  margin: 0.3rem 0 0.15rem;
  font-size: clamp(2rem, 8vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.05em;
}

.bike-hero-rich__info p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.95rem;
}

.bike-hero-rich__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.bike-notes-box {
  padding: 0.85rem 1rem;
  border-radius: 0.85rem;
  background: rgb(237 228 210 / 40%);
  font-size: 0.88rem;
  color: var(--color-asphalt);
}

.bike-tabs-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-bottom: 2px solid var(--color-sand);
  padding-bottom: 0.75rem;
}

.bike-tab {
  padding: 0.65rem 1.1rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.85rem;
  background: var(--color-white);
  color: var(--color-ink);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 120ms ease;
}

.bike-tab:hover {
  border-color: var(--color-ink);
}

.bike-tab--active {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

.tab-section {
  display: grid;
  gap: 1.5rem;
}

.section-desc {
  margin: 0.35rem 0 0;
  color: var(--color-asphalt);
  font-size: 0.88rem;
}

.spec-category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-pill {
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.7rem;
  background: var(--color-white);
  color: var(--color-ink);
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}

.filter-pill--active {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

.spec-row__topline {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.spec-tag {
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  font-family: ui-monospace, monospace;
  font-size: 0.68rem;
  font-weight: 800;
}

.spec-tag--known {
  background: rgb(201 243 106 / 40%);
  color: #2b7a1e;
}

.spec-tag--unknown {
  background: rgb(142 221 244 / 45%);
  color: #176b87;
}

.spec-tag--missing {
  background: var(--color-sand);
  color: var(--color-asphalt);
}

.state-card--success {
  border-color: #7db942;
  background: rgb(201 243 106 / 25%);
  color: #2b7a1e;
  font-weight: 800;
}

@media (max-width: 48rem) {
  .bike-hero-rich__top {
    grid-template-columns: 1fr;
    justify-items: start;
  }
  .bike-hero-rich__actions {
    align-items: flex-start;
  }
}
</style>
