<script setup lang="ts">
import type { ComponentDetail } from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const component = ref<ComponentDetail | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const slug = computed(() => String(route.params.slug));

onMounted(loadComponent);

async function loadComponent(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    component.value = await api<ComponentDetail>(
      `/learn/components/${slug.value}`,
    );
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page-stack">
    <NuxtLink class="component-back" to="/learn">← Back to Learn</NuxtLink>

    <!-- Skeleton Component Shimmer during Loading -->
    <div v-if="loading" style="display: grid; gap: 1rem;">
      <div class="component-hero" style="display: flex; gap: 1.25rem; align-items: center;">
        <div class="skeleton-shimmer" style="width: 5rem; height: 5rem; border-radius: 1.25rem; flex-shrink: 0;" />
        <div style="flex: 1; display: grid; gap: 0.5rem;">
          <div class="skeleton-shimmer" style="width: 30%; height: 1rem; border-radius: 0.35rem;" />
          <div class="skeleton-shimmer" style="width: 55%; height: 1.8rem; border-radius: 0.5rem;" />
          <div class="skeleton-shimmer" style="width: 80%; height: 0.9rem; border-radius: 0.35rem;" />
        </div>
      </div>
      <div class="skeleton-shimmer" style="width: 100%; height: 10rem; border-radius: 1.15rem;" />
    </div>

    <div
      v-else-if="component === null"
      class="state-card state-card--error component-state"
      role="alert"
    >
      <p>{{ errorMessage || 'This component guide is not available.' }}</p>
      <button
        class="button button--secondary"
        type="button"
        @click="loadComponent"
      >
        Try again
      </button>
    </div>

    <template v-else>
      <header class="component-hero">
        <div class="component-hero__sticker" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="28" />
            <circle cx="50" cy="50" r="8" />
            <path d="M50 10v20M50 70v20M10 50h20M70 50h20" />
            <path d="m22 22 14 14M64 64l14 14M78 22 64 36M36 64 22 78" />
          </svg>
        </div>
        <div>
          <p class="technical-label">{{ component.slug }}</p>
          <span class="status-chip">Bike component</span>
          <h1>{{ component.name }}</h1>
          <p>{{ component.beginnerSummary }}</p>
        </div>
      </header>

      <section class="component-basics" aria-labelledby="purpose-title">
        <div>
          <p class="section-heading__eyebrow">What it does</p>
          <h2 id="purpose-title">Its job on the bike</h2>
        </div>
        <p>{{ component.description }}</p>
      </section>

      <div class="component-guide-grid">
        <section class="guide-card" aria-labelledby="identify-title">
          <span class="guide-card__number" aria-hidden="true">01</span>
          <p class="technical-label">Look, read, confirm</p>
          <h2 id="identify-title">How to identify it</h2>
          <ol>
            <li v-for="step in component.identificationSteps" :key="step">
              {{ step }}
            </li>
          </ol>
        </section>

        <section class="guide-card" aria-labelledby="upgrade-title">
          <span class="guide-card__number" aria-hidden="true">02</span>
          <p class="technical-label">Before you buy</p>
          <h2 id="upgrade-title">Upgrade checks</h2>
          <ul>
            <li v-for="check in component.upgradeChecks" :key="check">
              {{ check }}
            </li>
          </ul>
        </section>
      </div>

      <aside class="unknown-guide" aria-labelledby="unknown-title">
        <div class="unknown-guide__mark" aria-hidden="true">?</div>
        <div>
          <p class="technical-label">No guessing needed</p>
          <h2 id="unknown-title">It is okay not to know yet.</h2>
          <p>{{ component.unknownGuidance }}</p>
        </div>
      </aside>

      <section class="component-actions" aria-labelledby="next-title">
        <div>
          <p class="section-heading__eyebrow">Use what you learned</p>
          <h2 id="next-title">Next step</h2>
          <p>
            Record only confirmed details in My Garage, then let deterministic
            rules check supported upgrades.
          </p>
        </div>
        <div class="component-actions__buttons">
          <NuxtLink class="button button--primary" to="/garage">
            Open My Garage
          </NuxtLink>
          <NuxtLink class="button button--secondary" to="/upgrade-lab">
            Open Upgrade Lab
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.component-back {
  justify-self: start;
  color: var(--color-asphalt);
  font-weight: 800;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.25rem;
}

.component-state {
  display: grid;
  justify-items: start;
  gap: 1rem;
}

.component-state > * {
  margin: 0;
}

.component-hero {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.25rem, 5vw, 2.5rem);
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background:
    radial-gradient(
      circle at 90% 10%,
      rgb(201 243 106 / 48%),
      transparent 14rem
    ),
    var(--color-white);
  box-shadow: var(--shadow-card);
}

.component-hero__sticker {
  display: grid;
  width: 6rem;
  height: 6rem;
  place-items: center;
  border: 2px solid var(--color-ink);
  border-radius: 1.6rem;
  background: var(--color-sky);
  box-shadow: 6px 6px 0 var(--color-ink);
  transform: rotate(-3deg);
}

.component-hero__sticker svg {
  width: 4.5rem;
  fill: none;
  stroke: var(--color-ink);
  stroke-linecap: round;
  stroke-width: 5;
}

.component-hero h1 {
  margin: 0.75rem 0 0;
  font-size: clamp(2.4rem, 10vw, 4.8rem);
  line-height: 1;
  letter-spacing: -0.055em;
}

.component-hero p:last-child {
  max-width: 42rem;
  margin: 1rem 0 0;
  color: var(--color-asphalt);
  font-size: 1.05rem;
  line-height: 1.7;
}

.component-basics {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-left: 0.45rem solid var(--color-chain-lime);
  background: rgb(237 228 210 / 45%);
}

.component-basics p,
.component-basics h2 {
  margin: 0;
}

.component-basics > p {
  color: var(--color-asphalt);
  line-height: 1.7;
}

.component-guide-grid {
  display: grid;
  gap: 1rem;
}

.guide-card {
  position: relative;
  overflow: hidden;
  padding: 1.25rem;
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}

.guide-card__number {
  position: absolute;
  top: -0.65rem;
  right: 0.75rem;
  color: rgb(64 80 95 / 10%);
  font-size: 5rem;
  font-weight: 900;
  line-height: 1;
}

.guide-card p,
.guide-card h2 {
  position: relative;
  margin: 0;
}

.guide-card h2 {
  margin-top: 0.3rem;
}

.guide-card ol,
.guide-card ul {
  display: grid;
  gap: 0.8rem;
  margin: 1.25rem 0 0;
  padding-left: 1.25rem;
  color: var(--color-asphalt);
  line-height: 1.55;
}

.guide-card li::marker {
  color: var(--color-ink);
  font-weight: 900;
}

.unknown-guide {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px dashed var(--color-ink);
  border-radius: var(--radius-card);
  background: rgb(142 221 244 / 22%);
}

.unknown-guide__mark {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.8rem;
  background: var(--color-sky);
  font-size: 1.5rem;
  font-weight: 900;
}

.unknown-guide p,
.unknown-guide h2 {
  margin: 0;
}

.unknown-guide h2 {
  margin-top: 0.3rem;
}

.unknown-guide div > p:last-child {
  margin-top: 0.65rem;
  color: var(--color-asphalt);
  line-height: 1.65;
}

.component-actions {
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
  border-radius: var(--radius-card);
  background: var(--color-ink);
  color: var(--color-white);
}

.component-actions p,
.component-actions h2 {
  margin: 0;
}

.component-actions > div > p:last-child {
  margin-top: 0.5rem;
  color: rgb(255 255 255 / 72%);
  line-height: 1.6;
}

.component-actions__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (min-width: 48rem) {
  .component-hero {
    grid-template-columns: 7rem 1fr;
    align-items: center;
  }

  .component-basics,
  .component-actions {
    grid-template-columns: minmax(12rem, 0.7fr) minmax(16rem, 1fr);
    align-items: center;
  }

  .component-guide-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .component-actions__buttons {
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .component-hero__sticker {
    transform: none;
  }
}
</style>
