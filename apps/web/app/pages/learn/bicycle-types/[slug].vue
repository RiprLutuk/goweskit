<script setup lang="ts">
import type {
  BicycleAnatomy,
  BicycleAnatomyResponse,
} from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const anatomy = ref<BicycleAnatomy | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const activeHotspotIndex = ref<number | null>(null);
const categoryFilter = ref('all');

const slug = computed(() => String(route.params.slug));

onMounted(loadAnatomy);

async function loadAnatomy(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await api<BicycleAnatomyResponse>(
      `/learn/bicycle-types/${slug.value}/anatomy`,
    );
    anatomy.value = response.anatomy;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

const activeHotspot = computed(() => {
  if (
    anatomy.value === null ||
    activeHotspotIndex.value === null ||
    activeHotspotIndex.value < 0 ||
    activeHotspotIndex.value >= anatomy.value.hotspots.length
  ) {
    return null;
  }
  return anatomy.value.hotspots[activeHotspotIndex.value];
});

function selectHotspot(index: number | null): void {
  if (index === null || activeHotspotIndex.value === index) {
    activeHotspotIndex.value = null;
  } else {
    activeHotspotIndex.value = index;
  }
}
</script>

<template>
  <div class="page-stack anatomy-page">
    <NuxtLink class="anatomy-back" to="/learn">← Back to Learn Library</NuxtLink>

    <p v-if="loading" class="state-card" role="status">
      Preparing the workshop diagram…
    </p>

    <div
      v-else-if="errorMessage"
      class="state-card state-card--error anatomy-state"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button
        class="button button--secondary"
        type="button"
        @click="loadAnatomy"
      >
        Try again
      </button>
    </div>

    <div v-else-if="anatomy === null" class="state-card anatomy-state">
      <span class="status-chip status-chip--sky">Starter path</span>
      <h1>This anatomy guide is still on the workstand.</h1>
      <p>
        The first interactive guides cover MTB Hardtail and Folding Bike. You
        can still browse every component in the Learn catalog.
      </p>
      <NuxtLink class="button button--primary" to="/learn">
        Browse components
      </NuxtLink>
    </div>

    <template v-else>
      <header class="page-heading anatomy-heading">
        <span class="status-chip status-chip--sky">{{ anatomy.bicycleType.name }}</span>
        <h1>Meet the parts of your bike.</h1>
        <p>{{ anatomy.overview }}</p>
      </header>

      <!-- Interactive Hotspot Workbench -->
      <section class="anatomy-workbench" aria-labelledby="diagram-title">
        <div class="anatomy-workbench__heading">
          <div>
            <p class="technical-label">Direct Interactive Blueprint</p>
            <h2 id="diagram-title">Interactive Anatomy Diagram</h2>
          </div>
          <span class="count-chip">{{ anatomy.hotspots.length }} parts</span>
        </div>

        <div class="bike-diagram-container">
          <RealisticBikeDiagram
            :type-slug="slug"
            :anatomy="anatomy"
            :active-index="activeHotspotIndex"
            @select="selectHotspot"
          />
        </div>

        <p class="diagram-note">
          💡 <strong>Tip:</strong> Click or hover directly on any part of the bicycle illustration above to inspect its specs, or browse the list below.
        </p>
      </section>

      <!-- Parts Guide List -->
      <section aria-labelledby="parts-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">The same parts, in words</p>
            <h2 id="parts-title">Component Guide</h2>
          </div>
        </div>

        <ol class="anatomy-list">
          <li
            v-for="(hotspot, index) in anatomy.hotspots"
            :key="hotspot.component.id"
            class="anatomy-list__item"
            :class="{ 'anatomy-list__item--highlighted': activeHotspotIndex === index }"
            @click="selectHotspot(index)"
          >
            <span class="anatomy-list__number" aria-hidden="true">
              {{ index + 1 }}
            </span>
            <div class="anatomy-list__content">
              <p class="technical-label">{{ hotspot.beginnerLabel }}</p>
              <h3>{{ hotspot.component.name }}</h3>
              <p>{{ hotspot.beginnerSummary }}</p>
              <div class="anatomy-list__actions">
                <NuxtLink
                  class="anatomy-list__link"
                  :to="`/learn/components/${hotspot.component.slug}`"
                  @click.stop
                >
                  Learn about {{ hotspot.component.name }} →
                </NuxtLink>
              </div>
            </div>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<style scoped>
.anatomy-page {
  gap: 2rem;
}

.anatomy-back {
  justify-self: start;
  color: var(--color-asphalt);
  font-weight: 800;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.25rem;
}

.anatomy-heading {
  max-width: 48rem;
}

.anatomy-state {
  display: grid;
  justify-items: start;
  gap: 1rem;
}

.anatomy-state > * {
  margin: 0;
}

.anatomy-workbench {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1rem, 4vw, 2rem);
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background:
    linear-gradient(rgb(255 255 255 / 92%), rgb(255 255 255 / 92%)),
    repeating-linear-gradient(
      90deg,
      transparent 0 31px,
      rgb(64 80 95 / 8%) 31px 32px
    );
  box-shadow: var(--shadow-card);
}

.anatomy-workbench__heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.anatomy-workbench__heading p,
.anatomy-workbench__heading h2 {
  margin: 0;
}

.bike-diagram-container {
  display: grid;
  gap: 1rem;
}

.bike-diagram {
  position: relative;
  width: 100%;
  aspect-ratio: 100 / 78;
  overflow: hidden;
  border: 1px solid rgb(64 80 95 / 15%);
  border-radius: 1rem;
  background:
    radial-gradient(circle at 50% 70%, rgb(201 243 106 / 35%), transparent 50%),
    var(--color-canvas);
}

.bike-diagram__drawing {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: var(--color-asphalt);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.bike-diagram__hotspots {
  margin: 0;
  padding: 0;
  list-style: none;
}

.bike-diagram__hotspots li {
  position: absolute;
  transform: translate(-50%, -50%);
}

.hotspot-pin {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 2px solid var(--color-ink);
  border-radius: 50%;
  background: var(--color-chain-lime);
  box-shadow: 0 5px 0 var(--color-ink);
  color: var(--color-ink);
  font-size: 0.85rem;
  font-weight: 900;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
}

.hotspot-pin:hover,
.hotspot-pin:focus-visible {
  outline: 3px solid var(--color-sky);
  outline-offset: 3px;
  box-shadow: 0 2px 0 var(--color-ink);
  transform: translateY(3px);
}

.hotspot-pin--active {
  background: var(--color-sky);
  box-shadow: 0 0 0 4px var(--color-ink), 0 5px 0 var(--color-ink);
  transform: scale(1.15) translateY(-2px);
}

/* Active Hotspot Preview Card */
.active-hotspot-card {
  padding: 1.15rem;
  border: 2px solid var(--color-ink);
  border-radius: 1rem;
  background: var(--color-white);
  box-shadow: 0 8px 25px rgb(23 32 42 / 12%);
  display: grid;
  gap: 0.65rem;
  animation: fadeIn 150ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.active-hotspot-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.active-hotspot-card__header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.active-hotspot-pin-badge {
  display: grid;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--color-chain-lime);
  font-weight: 900;
  font-size: 0.85rem;
}

.active-hotspot-card__header .text-button {
  margin-left: auto;
  font-size: 1.1rem;
  padding: 0.2rem 0.5rem;
}

.active-hotspot-card__summary {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.9rem;
  line-height: 1.55;
}

.active-hotspot-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.diagram-note {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.84rem;
  line-height: 1.6;
}

.anatomy-list {
  display: grid;
  gap: 0.85rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.anatomy-list__item {
  display: grid;
  grid-template-columns: 2.5rem 1fr;
  gap: 0.85rem;
  padding: 1.15rem;
  border: 1px solid rgb(64 80 95 / 13%);
  border-radius: 1rem;
  background: var(--color-white);
  cursor: pointer;
  transition: border-color 120ms ease, background-color 120ms ease;
}

.anatomy-list__item:hover {
  border-color: var(--color-ink);
}

.anatomy-list__item--highlighted {
  border-color: var(--color-ink);
  background: rgb(201 243 106 / 15%);
  box-shadow: 0 4px 15px rgb(23 32 42 / 8%);
}

.anatomy-list__number {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 0.75rem;
  background: var(--color-sky);
  font-weight: 900;
}

.anatomy-list p,
.anatomy-list h3 {
  margin: 0;
}

.anatomy-list h3 {
  margin-top: 0.2rem;
}

.anatomy-list__content > p:not(.technical-label) {
  margin-top: 0.45rem;
  color: var(--color-asphalt);
  line-height: 1.6;
}

.anatomy-list__actions {
  margin-top: 0.75rem;
}

.anatomy-list__link {
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

.button--sm {
  min-height: 2.25rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
}

@media (min-width: 48rem) {
  .bike-diagram {
    max-width: 58rem;
    margin-inline: auto;
  }

  .anatomy-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
