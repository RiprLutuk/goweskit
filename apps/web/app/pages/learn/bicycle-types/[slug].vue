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
</script>

<template>
  <div class="page-stack">
    <NuxtLink class="anatomy-back" to="/learn">← Back to Learn</NuxtLink>

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
        <span class="status-chip">{{ anatomy.bicycleType.name }}</span>
        <h1>Meet the parts of your bike.</h1>
        <p>{{ anatomy.overview }}</p>
      </header>

      <section class="anatomy-workbench" aria-labelledby="diagram-title">
        <div class="anatomy-workbench__heading">
          <div>
            <p class="technical-label">Touch, click, or tab</p>
            <h2 id="diagram-title">Interactive anatomy</h2>
          </div>
          <span class="count-chip">{{ anatomy.hotspots.length }} parts</span>
        </div>

        <div class="bike-diagram">
          <svg
            class="bike-diagram__drawing"
            viewBox="0 0 100 78"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="18" cy="59" r="15" />
            <circle cx="82" cy="59" r="15" />
            <path d="M18 59 39 30 52 59 28 59 45 43 68 43 82 59" />
            <path d="M52 59 68 43 62 26 M56 26h13" />
            <path d="M39 30 33 20 25 19 M31 19h-8" />
            <circle cx="52" cy="59" r="4" />
            <path d="M52 59 61 65 M52 59 44 53" />
          </svg>

          <ol class="bike-diagram__hotspots" aria-label="Bike anatomy hotspots">
            <li
              v-for="(hotspot, index) in anatomy.hotspots"
              :key="hotspot.component.id"
              :style="{
                left: `${hotspot.xPercent}%`,
                top: `${hotspot.yPercent}%`,
              }"
            >
              <NuxtLink
                class="hotspot-pin"
                :to="`/learn/components/${hotspot.component.slug}`"
                :aria-label="`${index + 1}. ${hotspot.component.name}: ${hotspot.beginnerLabel}`"
              >
                {{ index + 1 }}
              </NuxtLink>
            </li>
          </ol>
        </div>

        <p class="diagram-note">
          The diagram is a learning aid, not a measurement reference. The full
          component list below provides the same links without relying on the
          picture.
        </p>
      </section>

      <section aria-labelledby="parts-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">The same parts, in words</p>
            <h2 id="parts-title">Component guide</h2>
          </div>
        </div>

        <ol class="anatomy-list">
          <li
            v-for="(hotspot, index) in anatomy.hotspots"
            :key="hotspot.component.id"
            class="anatomy-list__item"
          >
            <span class="anatomy-list__number" aria-hidden="true">
              {{ index + 1 }}
            </span>
            <div>
              <p class="technical-label">{{ hotspot.beginnerLabel }}</p>
              <h3>{{ hotspot.component.name }}</h3>
              <p>{{ hotspot.beginnerSummary }}</p>
              <NuxtLink
                class="anatomy-list__link"
                :to="`/learn/components/${hotspot.component.slug}`"
              >
                Learn about {{ hotspot.component.name }}
                <span aria-hidden="true">→</span>
              </NuxtLink>
            </div>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<style scoped>
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
  gap: 1rem;
  padding: clamp(1rem, 4vw, 2rem);
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background:
    linear-gradient(rgb(255 255 255 / 88%), rgb(255 255 255 / 88%)),
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

.bike-diagram {
  position: relative;
  width: 100%;
  aspect-ratio: 100 / 78;
  overflow: hidden;
  border: 1px solid rgb(64 80 95 / 15%);
  border-radius: 1rem;
  background:
    radial-gradient(circle at 50% 70%, rgb(201 243 106 / 30%), transparent 40%),
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
  text-decoration: none;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.hotspot-pin:hover,
.hotspot-pin:focus-visible {
  outline: 3px solid var(--color-sky);
  outline-offset: 3px;
  box-shadow: 0 2px 0 var(--color-ink);
  transform: translateY(3px);
}

.diagram-note {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.82rem;
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
  padding: 1rem;
  border: 1px solid rgb(64 80 95 / 13%);
  border-radius: 1rem;
  background: var(--color-white);
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

.anatomy-list__item > div > p:not(.technical-label) {
  margin-top: 0.45rem;
  color: var(--color-asphalt);
  line-height: 1.6;
}

.anatomy-list__link {
  display: inline-block;
  min-height: 2.75rem;
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  font-weight: 800;
  text-underline-offset: 0.2rem;
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

@media (prefers-reduced-motion: reduce) {
  .hotspot-pin {
    transition: none;
  }
}
</style>
