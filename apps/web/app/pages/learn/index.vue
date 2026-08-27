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
</script>

<template>
  <div class="page-stack">
    <header class="page-heading">
      <span class="status-chip status-chip--sky">Learn</span>
      <h1>Start with the kind of bike you ride.</h1>
      <p>
        Plain-language foundations first. Technical details stay available when
        you need them.
      </p>
    </header>

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
      <section class="learn-search" aria-labelledby="learn-search-title">
        <div>
          <p class="section-heading__eyebrow">Curated knowledge finder</p>
          <h2 id="learn-search-title">What do you want to understand?</h2>
          <p>
            Deterministic matches from published bike types, components, and
            glossary definitions—no AI guesses.
          </p>
        </div>
        <form
          class="learn-search__form"
          role="search"
          @submit.prevent="searchLearn"
        >
          <label for="learn-search-query">Search Learn</label>
          <div class="learn-search__controls">
            <input
              id="learn-search-query"
              v-model="searchQuery"
              name="q"
              type="search"
              autocomplete="off"
              placeholder="Try Boost, freehub, folding…"
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
            Enter 2–60 characters. Matches come only from curated content.
          </p>
        </form>

        <div class="learn-search__status" aria-live="polite" aria-atomic="true">
          <p v-if="searching" role="status">Checking the learning catalog…</p>
          <p v-else-if="searchError" class="learn-search__error" role="alert">
            {{ searchError }}
          </p>
          <p v-else-if="hasSearched && searchResults.length === 0">
            No curated match yet. Try a component name or “axle”.
          </p>
          <p v-else-if="hasSearched">
            {{ searchResults.length }} curated results.
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

      <section aria-labelledby="bike-types-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">First bicycle types</p>
            <h2 id="bike-types-title">Choose a starting point</h2>
          </div>
          <span class="count-chip">{{ bicycleTypes.length }}</span>
        </div>
        <div v-if="bicycleTypes.length" class="card-grid">
          <article
            v-for="bicycleType in bicycleTypes"
            :key="bicycleType.id"
            class="content-card"
          >
            <p class="technical-label">{{ bicycleType.slug }}</p>
            <h3>{{ bicycleType.name }}</h3>
            <p>{{ bicycleType.summary }}</p>
            <dl class="detail-list">
              <div>
                <dt>Good for</dt>
                <dd>{{ bicycleType.typicalUse }}</dd>
              </div>
              <div>
                <dt>Beginner note</dt>
                <dd>{{ bicycleType.beginnerNotes }}</dd>
              </div>
            </dl>
            <NuxtLink
              class="button button--secondary learn-card-link"
              :to="`/learn/bicycle-types/${bicycleType.slug}`"
            >
              Explore anatomy
            </NuxtLink>
          </article>
        </div>
        <p v-else class="state-card">
          No bicycle types have been published yet.
        </p>
      </section>

      <section aria-labelledby="component-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Bike anatomy</p>
            <h2 id="component-title">Component categories</h2>
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
            <strong>{{ category.name }}</strong>
            <span>{{ category.description }}</span>
            <span aria-hidden="true">Learn more →</span>
          </NuxtLink>
        </div>
      </section>

      <section aria-labelledby="glossary-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Words without gatekeeping</p>
            <h2 id="glossary-title">Cycling glossary</h2>
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
            <summary>{{ term.term }}</summary>
            <div class="glossary-item__body">
              <p><strong>Plain language:</strong> {{ term.plainDefinition }}</p>
              <p>
                <strong>Technical detail:</strong>
                {{ term.technicalDefinition }}
              </p>
              <p v-if="term.aliases.length">
                Also called: {{ term.aliases.join(', ') }}
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
                  {{ componentSlug.replaceAll('_', ' ') }}
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

.learn-search__form label {
  font-weight: 800;
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
  min-height: 3.5rem;
  padding: 1rem;
  cursor: pointer;
  font-weight: 850;
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
  min-height: 7rem;
  color: inherit;
  text-decoration: none;
}

.learn-component-link > span:last-child {
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

@media (prefers-reduced-motion: reduce) {
  .learn-component-link {
    transition: none;
  }

  .learn-component-link:hover,
  .learn-component-link:focus-visible {
    transform: none;
  }
}
</style>
