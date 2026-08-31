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

const slug = computed(() => String(route.params.slug));

const activeHotspot = computed(() => {
  if (activeHotspotIndex.value === null || !anatomy.value) return null;
  return anatomy.value.hotspots[activeHotspotIndex.value] ?? null;
});

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

function selectHotspot(index: number | null): void {
  if (index === null || activeHotspotIndex.value === index) {
    activeHotspotIndex.value = null;
  } else {
    activeHotspotIndex.value = index;
  }
}
</script>

<template>
  <div class="anatomy-page-wrapper">
    <!-- Top Navigation Row -->
    <div class="anatomy-nav-bar">
      <NuxtLink class="back-nav-btn" to="/learn">
        <span>←</span>
        <span>Kembali ke Ensiklopedia</span>
      </NuxtLink>
    </div>

    <!-- Skeleton Anatomy Shimmer during Loading -->
    <div v-if="loading" style="display: grid; gap: 1rem">
      <div
        class="anatomy-hero"
        style="
          padding: 1.5rem;
          display: grid;
          gap: 0.85rem;
          border-radius: 1.25rem;
          background: var(--color-white);
          border: 1px solid rgb(23 32 42 / 8%);
        "
      >
        <div
          class="skeleton-shimmer"
          style="width: 30%; height: 1.1rem; border-radius: 0.35rem"
        />
        <div
          class="skeleton-shimmer"
          style="width: 60%; height: 2rem; border-radius: 0.5rem"
        />
        <div
          class="skeleton-shimmer"
          style="width: 85%; height: 1rem; border-radius: 0.35rem"
        />
      </div>
      <div
        class="skeleton-shimmer"
        style="width: 100%; height: 16rem; border-radius: 1.25rem"
      />
    </div>

    <!-- Error State -->
    <div
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button class="retry-btn" type="button" @click="loadAnatomy">
        Coba Lagi
      </button>
    </div>

    <!-- Not Found / Work In Progress State -->
    <div v-else-if="anatomy === null" class="empty-anatomy-card">
      <span class="type-badge">DALAM PENGEMBANGAN</span>
      <h2>Diagram Anatomi Masih Disiapkan</h2>
      <p>
        Panduan interaktif saat ini tersedia lengkap untuk MTB Hardtail, Folding
        Bike, Gravel Bike, dan Road Bike. Anda tetap dapat menjelajahi seluruh
        katalog komponen.
      </p>
      <NuxtLink class="cta-link-btn" to="/learn">
        Jelajahi Katalog Komponen →
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Page Hero Header -->
      <header class="anatomy-hero">
        <div class="anatomy-hero__inner">
          <div class="anatomy-hero__top">
            <div class="category-badge">
              <span class="badge-dot" />
              <span>ANATOMI &amp; STANDAR</span>
            </div>
            <span class="type-pill-tag">
              {{ anatomy.bicycleType.name }}
            </span>
          </div>

          <h1 class="anatomy-hero__title">
            Anatomi Komponen {{ anatomy.bicycleType.name }}
          </h1>
          <p class="anatomy-hero__subtitle">
            {{ anatomy.overview }}
          </p>
        </div>
      </header>

      <div class="anatomy-content-container">
        <!-- Interactive Hotspot Workbench -->
        <section class="blueprint-workbench" aria-labelledby="diagram-title">
          <div class="blueprint-workbench__header">
            <div>
              <span class="blueprint-eyebrow">🔬 BLUEPRINT INTERAKTIF</span>
              <h2 id="diagram-title" class="blueprint-title">
                Diagram Titik Komponen
              </h2>
            </div>
            <span class="parts-counter-badge">
              {{ anatomy.hotspots.length }} Titik Standar
            </span>
          </div>

          <!-- Diagram Component -->
          <div class="bike-diagram-container">
            <RealisticBikeDiagram
              :type-slug="slug"
              :anatomy="anatomy"
              :active-index="activeHotspotIndex"
              @select="selectHotspot"
            />
          </div>

          <!-- Interactive Tip Banner -->
          <div class="diagram-tip-banner">
            <span class="tip-icon">
              <GIcon name="sparkles" size="sm" color="#EAB308" />
            </span>
            <p>
              <strong>Petunjuk:</strong> Sentuh atau klik langsung pada bagian
              sepeda di atas untuk memeriksa spesifikasi teknisnya, atau pilih
              dari daftar komponen di bawah.
            </p>
          </div>
        </section>

        <!-- Selected Component Inspector Card (if selected) -->
        <div v-if="activeHotspot !== null" class="selected-inspector-card">
          <div class="inspector-card__header">
            <div class="inspector-badge">
              {{ (activeHotspotIndex ?? 0) + 1 }}
            </div>
            <div>
              <span class="inspector-cat-pill">
                {{ activeHotspot.beginnerLabel }}
              </span>
              <h3 class="inspector-title">
                {{ activeHotspot.component.name }}
              </h3>
            </div>
            <button
              class="inspector-close-btn"
              type="button"
              aria-label="Tutup Inspektor"
              @click="activeHotspotIndex = null"
            >
              <GIcon name="close" size="xs" />
            </button>
          </div>

          <p class="inspector-desc">
            {{ activeHotspot.beginnerSummary }}
          </p>

          <div class="inspector-actions">
            <NuxtLink
              class="inspector-action-btn"
              :to="`/learn/components/${activeHotspot.component.slug}`"
            >
              <span>Pelajari Standar Komponen Ini</span>
              <span>→</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Parts Guide List Section -->
        <section class="components-list-section" aria-labelledby="parts-title">
          <div class="components-list-header">
            <div>
              <span class="section-eyebrow">PANDUAN LENGKAP</span>
              <h2 id="parts-title" class="section-title">
                Daftar Komponen &amp; Fungsi
              </h2>
            </div>
            <span class="counter-chip">
              {{ anatomy.hotspots.length }} Komponen
            </span>
          </div>

          <div class="anatomy-list-grid">
            <article
              v-for="(hotspot, index) in anatomy.hotspots"
              :key="hotspot.component.id"
              class="component-item-card"
              :class="{
                'component-item-card--active': activeHotspotIndex === index,
              }"
              @click="selectHotspot(index)"
            >
              <div class="component-item__top">
                <span class="component-number-badge">
                  {{ index + 1 }}
                </span>
                <span class="component-label-tag">
                  {{ hotspot.beginnerLabel }}
                </span>
              </div>

              <h3 class="component-item__name">
                {{ hotspot.component.name }}
              </h3>
              <p class="component-item__summary">
                {{ hotspot.beginnerSummary }}
              </p>

              <NuxtLink
                class="component-item__link"
                :to="`/learn/components/${hotspot.component.slug}`"
                @click.stop
              >
                <span>Detail Standar</span>
                <span>→</span>
              </NuxtLink>
            </article>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.anatomy-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 3rem;
}

/* ══════════════════════════════════════════════════════════
   TOP NAVIGATION
   ══════════════════════════════════════════════════════════ */
.anatomy-nav-bar {
  display: flex;
  align-items: center;
}

.back-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  color: var(--color-ink);
  font-size: 0.78rem;
  font-weight: 850;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(23, 32, 42, 0.03);
  transition: all 100ms ease;
}

.back-nav-btn:hover {
  border-color: var(--color-ink);
  background: var(--color-canvas);
}

.back-nav-btn:active {
  transform: translateY(1px);
}

/* ══════════════════════════════════════════════════════════
   HERO / HEADER SECTION
   ══════════════════════════════════════════════════════════ */
.anatomy-hero {
  background: var(--color-white);
  border-bottom: 1.5px solid var(--color-sand);
  padding: 1.25rem 1rem 1.5rem;
  margin: -1rem -1rem 0 -1rem;
}

@media (min-width: 640px) {
  .anatomy-hero {
    border-radius: 1.5rem;
    border: 1.5px solid var(--color-sand);
    margin: 0;
    padding: 1.5rem 1.75rem 1.75rem;
  }
}

.anatomy-hero__inner {
  max-width: 54rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.anatomy-hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-asphalt);
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.badge-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #16a34a;
}

.type-pill-tag {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  color: #0284c7;
  background: #e0f2fe;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid rgba(2, 132, 199, 0.2);
}

.anatomy-hero__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--color-ink);
  line-height: 1.2;
}

.anatomy-hero__subtitle {
  margin: 0;
  font-size: 0.86rem;
  color: var(--color-asphalt);
  line-height: 1.5;
  max-width: 44rem;
}

/* ══════════════════════════════════════════════════════════
   CONTENT CONTAINER & BLUEPRINT WORKBENCH
   ══════════════════════════════════════════════════════════ */
.anatomy-content-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 54rem;
  margin: 0 auto;
  width: 100%;
}

.blueprint-workbench {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.5rem;
  padding: 1.25rem;
  box-shadow: 0 8px 32px rgba(23, 32, 42, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .blueprint-workbench {
    padding: 1.75rem;
  }
}

.blueprint-workbench__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.blueprint-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-asphalt);
  display: block;
}

.blueprint-title {
  margin: 0.15rem 0 0;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.parts-counter-badge {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 900;
  color: var(--color-ink);
  background: var(--color-chain-lime);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
}

.bike-diagram-container {
  width: 100%;
  border-radius: 1.25rem;
  background: #f8fafc;
  border: 1.5px solid var(--color-sand);
  overflow: hidden;
}

/* Tip Banner */
.diagram-tip-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  line-height: 1.45;
}

.tip-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.diagram-tip-banner p {
  margin: 0;
}

/* ══════════════════════════════════════════════════════════
   SELECTED INSPECTOR CARD
   ══════════════════════════════════════════════════════════ */
.selected-inspector-card {
  background: var(--color-white);
  border: 2px solid var(--color-ink);
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: 0 8px 24px rgba(23, 32, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: slideDown 150ms ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.inspector-card__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.inspector-badge {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  border: 1.5px solid var(--color-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.95rem;
  color: var(--color-ink);
  flex-shrink: 0;
}

.inspector-cat-pill {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: var(--color-asphalt);
  text-transform: uppercase;
}

.inspector-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--color-ink);
}

.inspector-close-btn {
  margin-left: auto;
  border: none;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: var(--color-asphalt);
}

.inspector-desc {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.45;
}

.inspector-actions {
  display: flex;
  margin-top: 0.25rem;
}

.inspector-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-ink);
  color: var(--color-white);
  font-size: 0.8rem;
  font-weight: 850;
  text-decoration: none;
  transition: transform 90ms ease;
}

.inspector-action-btn:active {
  transform: scale(0.97);
}

/* ══════════════════════════════════════════════════════════
   COMPONENTS LIST GRID
   ══════════════════════════════════════════════════════════ */
.components-list-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.components-list-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

.section-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-asphalt);
  display: block;
}

.section-title {
  margin: 0.15rem 0 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-ink);
}

.counter-chip {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: var(--color-sand);
  color: var(--color-ink);
}

.anatomy-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.85rem;
}

.component-item-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.25rem;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  cursor: pointer;
  transition: all 120ms ease;
}

.component-item-card:hover {
  border-color: var(--color-ink);
  box-shadow: 0 4px 16px rgba(23, 32, 42, 0.05);
}

.component-item-card--active {
  border-color: var(--color-ink);
  background: rgba(201, 243, 106, 0.15);
  box-shadow: 0 6px 20px rgba(23, 32, 42, 0.08);
}

.component-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.component-number-badge {
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 0.55rem;
  background: #e0f2fe;
  color: #0369a1;
  font-family: var(--font-mono);
  font-weight: 900;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.component-item-card--active .component-number-badge {
  background: var(--color-chain-lime);
  color: var(--color-ink);
}

.component-label-tag {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: var(--color-asphalt);
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  padding: 0.15rem 0.45rem;
  border-radius: 0.35rem;
}

.component-item__name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--color-ink);
}

.component-item__summary {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  line-height: 1.45;
  flex: 1;
}

.component-item__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.25rem;
  font-size: 0.78rem;
  font-weight: 850;
  color: var(--color-ink);
  text-decoration: none;
  padding: 0.35rem 0.65rem;
  border-radius: 0.55rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  width: fit-content;
  transition: all 100ms ease;
}

.component-item__link:hover {
  background: var(--color-chain-lime);
  border-color: var(--color-ink);
}

/* State & Empty */
.state-card {
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  text-align: center;
  font-size: 0.85rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

.state-card--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-sand);
  border-top-color: var(--color-ink);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.state-card--error {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.empty-anatomy-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.5rem;
  padding: 2rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
}

.type-badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 900;
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.empty-anatomy-card h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--color-ink);
}

.empty-anatomy-card p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-asphalt);
  max-width: 32rem;
  line-height: 1.5;
}

.cta-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.25rem;
  border-radius: 0.85rem;
  background: var(--color-ink);
  color: var(--color-white);
  font-size: 0.84rem;
  font-weight: 850;
  text-decoration: none;
  margin-top: 0.5rem;
}
</style>
