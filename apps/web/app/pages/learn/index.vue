<script setup lang="ts">
import {
  LEARN_SEARCH_MAX_QUERY_LENGTH,
  LEARN_SEARCH_MIN_QUERY_LENGTH,
} from '@goweskit/contracts';
import type {
  BicycleType,
  BicycleTypeListResponse,
  ComponentCategory,
  ComponentCategoryListResponse,
  GlossaryListResponse,
  GlossaryTerm,
  LearnSearchResponse,
  LearnSearchResult,
} from '@goweskit/contracts';

const api = useApi();
const bicycleTypes = ref<BicycleType[]>([]);
const componentCategories = ref<ComponentCategory[]>([]);
const glossaryTerms = ref<GlossaryTerm[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const searchQuery = ref('');
const searchResults = ref<LearnSearchResult[]>([]);
const searching = ref(false);
const hasSearched = ref(false);
const searchError = ref('');

// Filter state
const selectedTypeFilter = ref('all');

// Guided Identification Wizard state
const showWizard = ref(false);
const wizardStep = ref(1);
const wizardTerrain = ref('');
const wizardFolding = ref('');
const wizardHandlebar = ref('');
const wizardResult = ref<{
  typeSlug: string;
  typeName: string;
  matchScore: string;
  summary: string;
  commonSpecs: string[];
} | null>(null);

onMounted(async () => {
  try {
    const [typesResponse, categoriesResponse, glossaryResponse] =
      await Promise.all([
        api<BicycleTypeListResponse>('/learn/bicycle-types'),
        api<ComponentCategoryListResponse>('/learn/components'),
        api<GlossaryListResponse>('/learn/glossary'),
      ]);
    bicycleTypes.value = typesResponse.bicycleTypes;
    componentCategories.value = categoriesResponse.componentCategories;
    glossaryTerms.value = glossaryResponse.terms;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
});

const filteredBicycleTypes = computed(() => {
  if (selectedTypeFilter.value === 'all') return bicycleTypes.value;
  return bicycleTypes.value.filter(
    (b) => b.slug === selectedTypeFilter.value,
  );
});

async function searchLearn(): Promise<void> {
  searching.value = true;
  searchError.value = '';
  hasSearched.value = true;
  try {
    const response = await api<LearnSearchResponse>(
      `/learn/search?q=${encodeURIComponent(searchQuery.value)}`,
    );
    searchResults.value = response.results;
  } catch (error: unknown) {
    searchResults.value = [];
    searchError.value = getApiErrorMessage(error);
  } finally {
    searching.value = false;
  }
}

function searchResultHref(result: LearnSearchResult): string {
  if (result.kind === 'bicycle_type')
    return `/learn/bicycle-types/${result.slug}`;
  if (result.kind === 'component') return `/learn/components/${result.slug}`;
  return `#glossary-${result.slug}`;
}

function searchKindLabel(kind: LearnSearchResult['kind']): string {
  if (kind === 'bicycle_type') return 'Bike type';
  if (kind === 'component') return 'Component';
  return 'Glossary';
}

function categoryIcon(slug: string): string {
  const iconMap: Record<string, string> = {
    frame: '📐',
    fork: '🍴',
    rear_shock: '🔄',
    wheel: '⭕',
    hub: '⚙️',
    tire: '🛞',
    cassette: '⛓️',
    chain: '🔗',
    crank: '⚡',
    bottom_bracket: '🔩',
    rear_derailleur: '🕹️',
    shifter: '🎮',
    brake: '🛑',
    rotor: '💿',
    handlebar: '🛵',
    stem: '📏',
    seatpost: '🪑',
    saddle: '🛋️',
    pedal: '🦶',
    folding_hinge: '🧲',
  };
  return iconMap[slug] ?? '🚲';
}

// Guided Identification Logic
function runWizardEvaluation(): void {
  if (wizardFolding.value === 'yes') {
    wizardResult.value = {
      typeSlug: 'folding',
      typeName: 'Folding Bike',
      matchScore: '99% Match',
      summary:
        'Your bike features a central frame hinge and compact folding geometry built for easy storage and multi-modal commuting.',
      commonSpecs: [
        'ISO 406 (20-inch) or ISO 305 (16-inch) wheels',
        'Quick-release 135mm or 130mm rear axle',
        'BSA threaded 68/73 bottom bracket',
        'HG 8-speed to 10-speed drivetrain',
      ],
    };
  } else if (wizardTerrain.value === 'trail') {
    wizardResult.value = {
      typeSlug: 'mtb_hardtail',
      typeName: 'MTB Hardtail',
      matchScore: '98% Match',
      summary:
        'A mountain bike with front suspension fork and rigid rear frame, built for trails, rocky paths, and off-road control.',
      commonSpecs: [
        'ISO 622 (29-inch) or ISO 584 (27.5-inch) wheels',
        '15×110 Boost front axle / 12×148 Boost rear axle',
        'Tapered steerer (1⅛" to 1½") with 100–140mm travel',
        '1×11 or 1×12 wide-range drivetrain with Micro Spline or HG freehub',
      ],
    };
  } else if (wizardHandlebar.value === 'drop' && wizardTerrain.value === 'gravel') {
    wizardResult.value = {
      typeSlug: 'gravel',
      typeName: 'Gravel Bike',
      matchScore: '95% Match',
      summary:
        'Drop handlebars paired with wide tire clearance and endurance geometry, optimized for long rides across asphalt and dirt.',
      commonSpecs: [
        'ISO 622 (700c) wheels with 38–50mm tires',
        '12×100 front / 12×142 rear thru-axles',
        'Flat-mount disc brakes (140/160mm rotors)',
        '1× or 2× drivetrain with clutch derailleur',
      ],
    };
  } else {
    wizardResult.value = {
      typeSlug: 'road',
      typeName: 'Road Bike',
      matchScore: '94% Match',
      summary:
        'Lightweight frame and aerodynamic drop handlebars engineered for speed, efficiency, and pavement endurance.',
      commonSpecs: [
        'ISO 622 (700c) wheels with 25–32mm tires',
        '12×100 front / 12×142 rear thru-axles or QR',
        'Flat-mount hydraulic disc brakes or rim calipers',
        '2×11 or 2×12 close-ratio drivetrain',
      ],
    };
  }
  wizardStep.value = 4;
}

function resetWizard(): void {
  wizardStep.value = 1;
  wizardTerrain.value = '';
  wizardFolding.value = '';
  wizardHandlebar.value = '';
  wizardResult.value = null;
}
</script>

<template>
  <div class="page-stack learn-page">
    <header class="page-heading">
      <span class="status-chip status-chip--sky">Learn Library</span>
      <h1>Start with the kind of bike you ride.</h1>
      <p>
        Plain-language foundations first. Interactive anatomy diagrams, component
        guides, and curated glossary definitions without mechanics gatekeeping.
      </p>

      <!-- Guided Identification Helper Action -->
      <div class="action-row">
        <button
          class="button button--primary button--wizard"
          type="button"
          @click="showWizard = !showWizard"
        >
          {{ showWizard ? 'Close Identification Wizard' : '🧭 Guided Bike Identification' }}
        </button>
      </div>
    </header>

    <!-- Guided Identification Wizard Drawer/Card -->
    <section
      v-if="showWizard"
      class="wizard-card"
      aria-labelledby="wizard-title"
    >
      <div class="wizard-card__header">
        <span class="technical-label">Beginner Flow · 3 Quick Questions</span>
        <h2 id="wizard-title">Identify Your Bike &amp; Standards</h2>
      </div>

      <!-- Step 1: Terrain -->
      <div v-if="wizardStep === 1" class="wizard-step">
        <p class="wizard-question">1. Where do you mostly ride your bike?</p>
        <div class="wizard-options">
          <button
            class="wizard-option"
            type="button"
            @click="wizardTerrain = 'trail'; wizardStep = 2"
          >
            <span class="wizard-option__icon">🌲</span>
            <strong>Dirt trails &amp; off-road terrain</strong>
            <small>Singletrack, rocks, mud, and bike parks</small>
          </button>
          <button
            class="wizard-option"
            type="button"
            @click="wizardTerrain = 'paved'; wizardStep = 2"
          >
            <span class="wizard-option__icon">🛣️</span>
            <strong>Paved city streets &amp; highways</strong>
            <small>Smooth roads, commuting, and fitness laps</small>
          </button>
          <button
            class="wizard-option"
            type="button"
            @click="wizardTerrain = 'gravel'; wizardStep = 2"
          >
            <span class="wizard-option__icon">🌾</span>
            <strong>Mixed gravel, asphalt &amp; light dirt</strong>
            <small>Exploring backroads and mixed country trails</small>
          </button>
        </div>
      </div>

      <!-- Step 2: Folding Frame -->
      <div v-else-if="wizardStep === 2" class="wizard-step">
        <p class="wizard-question">2. Does your bicycle frame fold in half for storage?</p>
        <div class="wizard-options">
          <button
            class="wizard-option"
            type="button"
            @click="wizardFolding = 'yes'; runWizardEvaluation()"
          >
            <span class="wizard-option__icon">🧲</span>
            <strong>Yes, it has folding hinges &amp; quick clamps</strong>
            <small>Folds for trunk, train, or under-desk storage</small>
          </button>
          <button
            class="wizard-option"
            type="button"
            @click="wizardFolding = 'no'; wizardStep = 3"
          >
            <span class="wizard-option__icon">🚲</span>
            <strong>No, it has a solid non-folding frame</strong>
            <small>Standard full-size rigid or suspension frame</small>
          </button>
        </div>
      </div>

      <!-- Step 3: Handlebar Type -->
      <div v-else-if="wizardStep === 3" class="wizard-step">
        <p class="wizard-question">3. What shape is your handlebar?</p>
        <div class="wizard-options">
          <button
            class="wizard-option"
            type="button"
            @click="wizardHandlebar = 'flat'; runWizardEvaluation()"
          >
            <span class="wizard-option__icon">➖</span>
            <strong>Straight or riser bar (Flat bar)</strong>
            <small>Wide bar with thumb shifters and lever brakes</small>
          </button>
          <button
            class="wizard-option"
            type="button"
            @click="wizardHandlebar = 'drop'; runWizardEvaluation()"
          >
            <span class="wizard-option__icon">➰</span>
            <strong>Curved drop bar (Road style)</strong>
            <small>Multiple hand positions with integrated brake-shifters</small>
          </button>
        </div>
      </div>

      <!-- Step 4: Result -->
      <div v-else-if="wizardStep === 4 && wizardResult" class="wizard-result">
        <div class="wizard-result__badge">
          <span class="status-chip status-chip--lime">{{ wizardResult.matchScore }}</span>
          <span class="technical-label">Identification Complete</span>
        </div>
        <h3>You ride a {{ wizardResult.typeName }}!</h3>
        <p>{{ wizardResult.summary }}</p>

        <div class="wizard-result__specs">
          <strong>Common Standards for this Bike:</strong>
          <ul>
            <li v-for="spec in wizardResult.commonSpecs" :key="spec">{{ spec }}</li>
          </ul>
        </div>

        <div class="action-row">
          <NuxtLink
            class="button button--primary"
            :to="`/learn/bicycle-types/${wizardResult.typeSlug}`"
          >
            Explore Interactive Anatomy →
          </NuxtLink>
          <NuxtLink
            class="button button--secondary"
            :to="`/garage/new`"
          >
            Add this Bike to My Garage
          </NuxtLink>
          <button
            class="text-button"
            type="button"
            @click="resetWizard"
          >
            Start Over
          </button>
        </div>
      </div>
    </section>

    <p v-if="loading" class="state-card" role="status">
      Loading bicycle basics…
    </p>
    <p
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <template v-else>
      <!-- Search Box -->
      <section class="learn-search" aria-labelledby="learn-search-title">
        <div>
          <p class="section-heading__eyebrow">Curated knowledge finder</p>
          <h2 id="learn-search-title">What do you want to understand?</h2>
          <p>
            Deterministic matches from published bike types, components, and
            glossary definitions—no AI hallucinations.
          </p>
        </div>
        <form
          class="learn-search__form"
          role="search"
          @submit.prevent="searchLearn"
        >
          <label for="learn-search-query" class="visually-hidden">Search Learn</label>
          <div class="learn-search__controls">
            <input
              id="learn-search-query"
              v-model="searchQuery"
              name="q"
              type="search"
              autocomplete="off"
              placeholder="Try Boost, freehub, folding hinge, tapered…"
              :minlength="LEARN_SEARCH_MIN_QUERY_LENGTH"
              :maxlength="LEARN_SEARCH_MAX_QUERY_LENGTH"
              required
              aria-describedby="learn-search-hint"
            />
            <button
              class="button button--primary"
              type="submit"
              :disabled="searching"
            >
              {{ searching ? 'Searching…' : 'Search' }}
            </button>
          </div>
          <p id="learn-search-hint" class="learn-search__hint">
            Enter 2–60 characters. Matches come directly from validated standards.
          </p>
        </form>

        <div class="learn-search__status" aria-live="polite" aria-atomic="true">
          <p v-if="searching" role="status">Checking the learning catalog…</p>
          <p v-else-if="searchError" class="learn-search__error" role="alert">
            {{ searchError }}
          </p>
          <p v-else-if="hasSearched && searchResults.length === 0">
            No curated match yet. Try searching for “axle”, “cassette”, or “steerer”.
          </p>
          <p v-else-if="hasSearched">
            {{ searchResults.length }} curated results found.
          </p>
        </div>

        <ol v-if="searchResults.length" class="learn-search__results">
          <li
            v-for="result in searchResults"
            :key="`${result.kind}-${result.slug}`"
          >
            <NuxtLink :to="searchResultHref(result)">
              <span class="technical-label">{{
                searchKindLabel(result.kind)
              }}</span>
              <strong>{{ result.title }}</strong>
              <span>{{ result.summary }}</span>
            </NuxtLink>
          </li>
        </ol>
      </section>

      <!-- Bicycle Types Section with Tabs -->
      <section aria-labelledby="bike-types-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Interactive Learning Paths</p>
            <h2 id="bike-types-title">Bicycle Types</h2>
          </div>
          <span class="count-chip">{{ filteredBicycleTypes.length }}</span>
        </div>

        <!-- Filter Chips -->
        <div class="type-filter-bar" role="tablist" aria-label="Bicycle type filter">
          <button
            class="filter-pill"
            :class="{ 'filter-pill--active': selectedTypeFilter === 'all' }"
            type="button"
            @click="selectedTypeFilter = 'all'"
          >
            All Bikes
          </button>
          <button
            v-for="bt in bicycleTypes"
            :key="bt.slug"
            class="filter-pill"
            :class="{ 'filter-pill--active': selectedTypeFilter === bt.slug }"
            type="button"
            @click="selectedTypeFilter = bt.slug"
          >
            {{ bt.name }}
          </button>
        </div>

        <div v-if="filteredBicycleTypes.length" class="card-grid">
          <article
            v-for="bicycleType in filteredBicycleTypes"
            :key="bicycleType.id"
            class="content-card bike-type-card"
          >
            <div class="bike-type-card__header">
              <span class="bike-icon-badge" aria-hidden="true">🚲</span>
              <div>
                <p class="technical-label">{{ bicycleType.slug }}</p>
                <h3>{{ bicycleType.name }}</h3>
              </div>
            </div>
            <p>{{ bicycleType.summary }}</p>
            <dl class="detail-list">
              <div>
                <dt>Best For</dt>
                <dd>{{ bicycleType.typicalUse }}</dd>
              </div>
              <div>
                <dt>Beginner Note</dt>
                <dd>{{ bicycleType.beginnerNotes }}</dd>
              </div>
            </dl>
            <NuxtLink
              class="button button--primary learn-card-link"
              :to="`/learn/bicycle-types/${bicycleType.slug}`"
            >
              Explore Hotspot Anatomy →
            </NuxtLink>
          </article>
        </div>
        <p v-else class="state-card">
          No bicycle types matched this filter.
        </p>
      </section>

      <!-- Component Categories Section -->
      <section aria-labelledby="component-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Anatomy Explorer</p>
            <h2 id="component-title">Component Categories</h2>
          </div>
          <span class="count-chip">{{ componentCategories.length }}</span>
        </div>
        <div class="chip-grid">
          <NuxtLink
            v-for="category in componentCategories"
            :key="category.id"
            class="part-chip learn-component-link"
            :to="`/learn/components/${category.slug}`"
          >
            <div class="part-chip__icon" aria-hidden="true">{{ categoryIcon(category.slug) }}</div>
            <strong>{{ category.name }}</strong>
            <span>{{ category.description }}</span>
            <span class="part-chip__arrow" aria-hidden="true">Learn standards →</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Glossary Section -->
      <section aria-labelledby="glossary-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Words without gatekeeping</p>
            <h2 id="glossary-title">Cycling Glossary</h2>
          </div>
          <span class="count-chip">{{ glossaryTerms.length }}</span>
        </div>
        <div v-if="glossaryTerms.length" class="glossary-list">
          <details
            v-for="term in glossaryTerms"
            :id="`glossary-${term.slug}`"
            :key="term.slug"
            class="glossary-item"
          >
            <summary>
              <span>{{ term.term }}</span>
              <span v-if="term.aliases.length" class="glossary-item__alias">
                aka {{ term.aliases[0] }}
              </span>
            </summary>
            <div class="glossary-item__body">
              <p><strong>Plain language:</strong> {{ term.plainDefinition }}</p>
              <p>
                <strong>Technical detail:</strong>
                {{ term.technicalDefinition }}
              </p>
              <p v-if="term.aliases.length">
                <strong>Also called:</strong> {{ term.aliases.join(', ') }}
              </p>
              <div
                v-if="term.relatedComponentSlugs.length"
                class="glossary-item__links"
              >
                <NuxtLink
                  v-for="componentSlug in term.relatedComponentSlugs"
                  :key="componentSlug"
                  :to="`/learn/components/${componentSlug}`"
                >
                  {{ componentSlug.replaceAll('_', ' ') }} Guide →
                </NuxtLink>
              </div>
            </div>
          </details>
        </div>
        <p v-else class="state-card">
          No glossary terms have been published yet.
        </p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.learn-page {
  gap: 2.25rem;
}

.button--wizard {
  background: var(--color-chain-lime);
  color: var(--color-ink);
  border: 1px solid var(--color-ink);
}

.wizard-card {
  padding: clamp(1.25rem, 5vw, 2.25rem);
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-card);
  background: rgb(201 243 106 / 20%);
  box-shadow: 0 12px 30px rgb(23 32 42 / 10%);
}

.wizard-card__header h2 {
  margin: 0.25rem 0 1rem;
}

.wizard-question {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 850;
}

.wizard-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.85rem;
}

.wizard-option {
  display: grid;
  gap: 0.35rem;
  padding: 1.15rem;
  border: 2px solid var(--color-sand);
  border-radius: 1rem;
  background: var(--color-white);
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease;
}

.wizard-option:hover {
  border-color: var(--color-ink);
  transform: translateY(-2px);
}

.wizard-option__icon {
  font-size: 1.5rem;
}

.wizard-option small {
  color: var(--color-asphalt);
  line-height: 1.4;
}

.wizard-result {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-white);
}

.wizard-result__badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.wizard-result h3 {
  margin: 0;
  font-size: 1.6rem;
  letter-spacing: -0.03em;
}

.wizard-result__specs {
  padding: 1rem;
  border-radius: 0.85rem;
  background: rgb(142 221 244 / 20%);
  font-size: 0.88rem;
}

.wizard-result__specs ul {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}

.type-filter-bar {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
  gap: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.filter-pill {
  flex: 0 0 auto;
  scroll-snap-align: start;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.75rem;
  background: var(--color-white);
  color: var(--color-ink);
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, border-color 120ms ease;
}

.filter-pill:hover,
.filter-pill--active {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

.bike-type-card {
  display: grid;
  gap: 0.85rem;
}

.bike-type-card__header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.bike-icon-badge {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.85rem;
  background: var(--color-sky);
  font-size: 1.4rem;
}

.learn-search {
  display: grid;
  gap: 1rem;
  padding: clamp(1rem, 4vw, 2rem);
  border: 1px solid rgb(64 80 95 / 15%);
  border-radius: var(--radius-card);
  background: rgb(142 221 244 / 18%);
}

.learn-search h2,
.learn-search p {
  margin: 0;
}

.learn-search__form,
.learn-search__controls,
.learn-search__results,
.glossary-list {
  display: grid;
  gap: 0.65rem;
}

.learn-search__controls input {
  min-height: 3rem;
  padding: 0.75rem;
  border: 1px solid var(--color-asphalt);
  border-radius: 0.8rem;
  background: var(--color-white);
  color: var(--color-ink);
  font: inherit;
}

.learn-search__controls input:focus-visible,
.learn-search__results a:focus-visible,
.glossary-item summary:focus-visible {
  outline: 3px solid var(--color-chain-lime);
  outline-offset: 2px;
}

.learn-search__hint,
.learn-search__status {
  color: var(--color-asphalt);
  font-size: 0.82rem;
}

.learn-search__error {
  color: #8b261c;
  font-weight: 800;
}

.learn-search__results {
  margin: 0;
  padding: 0;
  list-style: none;
}

.learn-search__results a {
  display: grid;
  gap: 0.25rem;
  min-height: 4.5rem;
  padding: 0.85rem;
  border: 1px solid rgb(64 80 95 / 15%);
  border-radius: 0.8rem;
  background: var(--color-white);
  color: inherit;
  text-decoration: none;
}

.learn-search__results a > span:last-child {
  color: var(--color-asphalt);
}

.glossary-item {
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: 1rem;
  background: var(--color-white);
}

.glossary-item summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3.5rem;
  padding: 1rem;
  cursor: pointer;
  font-weight: 850;
}

.glossary-item__alias {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--color-asphalt);
  font-weight: 600;
}

.glossary-item__body {
  display: grid;
  gap: 0.75rem;
  padding: 0 1rem 1rem;
  color: var(--color-asphalt);
  line-height: 1.6;
}

.glossary-item__body p {
  margin: 0;
}

.glossary-item__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.glossary-item__links a {
  min-height: 2.75rem;
  padding: 0.7rem;
  border-radius: 0.65rem;
  background: var(--color-sand);
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: capitalize;
}

.learn-card-link {
  margin-top: auto;
  align-self: flex-start;
}

.learn-component-link {
  min-height: 8rem;
  color: inherit;
  text-decoration: none;
}

.part-chip__icon {
  font-size: 1.4rem;
}

.part-chip__arrow {
  color: var(--color-asphalt);
  font-size: 0.78rem;
  font-weight: 800;
}

.learn-component-link:hover,
.learn-component-link:focus-visible {
  border-color: var(--color-ink);
  outline: 3px solid rgb(142 221 244 / 55%);
  outline-offset: 3px;
  transform: translateY(-2px);
}

@media (min-width: 36rem) {
  .learn-search__controls {
    grid-template-columns: 1fr auto;
  }

  .learn-search__results {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
