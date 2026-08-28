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

// Tab Navigation: 'types' | 'components' | 'glossary'
const activeTab = ref<'types' | 'components' | 'glossary'>('types');

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

async function searchLearn(): Promise<void> {
  if (searchQuery.value.trim().length < LEARN_SEARCH_MIN_QUERY_LENGTH) return;
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

function clearSearch(): void {
  searchQuery.value = '';
  hasSearched.value = false;
  searchResults.value = [];
}

function searchResultHref(result: LearnSearchResult): string {
  if (result.kind === 'bicycle_type')
    return `/learn/bicycle-types/${result.slug}`;
  if (result.kind === 'component') return `/learn/components/${result.slug}`;
  return `#glossary-${result.slug}`;
}

function searchKindLabel(kind: LearnSearchResult['kind']): string {
  if (kind === 'bicycle_type') return 'Tipe Sepeda';
  if (kind === 'component') return 'Komponen';
  return 'Glosarium';
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

function bikeTypeEmoji(slug: string): string {
  if (slug === 'mtb_hardtail') return '🌲';
  if (slug === 'folding') return '🧲';
  if (slug === 'road') return '⚡';
  if (slug === 'gravel') return '🌾';
  return '🚲';
}

// Guided Identification Logic
function runWizardEvaluation(): void {
  if (wizardFolding.value === 'yes') {
    wizardResult.value = {
      typeSlug: 'folding',
      typeName: 'Sepeda Lipat (Folding Bike)',
      matchScore: '99% Cocok',
      summary:
        'Sepeda dengan engsel rangka lipat di bagian tengah, dirancang ringkas untuk komuter kota dan mudah dibawa ke kendaraan umum/bagasi.',
      commonSpecs: [
        'Roda ISO 406 (20 inci) / ISO 305 (16 inci)',
        'As roda Quick-Release 135mm / 130mm',
        'Bottom bracket ulir BSA 68/73',
        'Drivetrain HG 8–10 speed',
      ],
    };
  } else if (wizardTerrain.value === 'trail') {
    wizardResult.value = {
      typeSlug: 'mtb_hardtail',
      typeName: 'MTB Hardtail',
      matchScore: '98% Cocok',
      summary:
        'Sepeda gunung dengan suspensi depan dan rangka belakang kaku, tangguh untuk melibas jalur tanah, bebatuan, dan tanjakan off-road.',
      commonSpecs: [
        'Roda 29 inci (ISO 622) atau 27.5 inci (ISO 584)',
        'As roda Thru-Axle 15×110 Boost (depan) & 12×148 Boost (belakang)',
        'Fork Tapered (1⅛" ke 1½") dengan travel 100–140mm',
        'Drivetrain 1×12 wide-range dengan Micro Spline / HG',
      ],
    };
  } else if (wizardHandlebar.value === 'drop' && wizardTerrain.value === 'gravel') {
    wizardResult.value = {
      typeSlug: 'gravel',
      typeName: 'Sepeda Gravel',
      matchScore: '95% Cocok',
      summary:
        'Stang melengkung (drop bar) dengan ruang ban lebar dan geometri endurance, nyaman untuk gowes jarak jauh lintas aspal dan tanah kering.',
      commonSpecs: [
        'Roda 700c (ISO 622) dengan profil ban 38–50mm',
        'Thru-Axle 12×100 (depan) & 12×142 (belakang)',
        'Rem cakram Flat Mount (rotor 140/160mm)',
        'Drivetrain 1× atau 2× dengan clutch rear derailleur',
      ],
    };
  } else {
    wizardResult.value = {
      typeSlug: 'road',
      typeName: 'Road Bike (Sepeda Balap)',
      matchScore: '94% Cocok',
      summary:
        'Rangka ringan dan stang balap aerodinamis yang dirancang untuk efisiensi kecepatan dan jarak tempuh di jalan aspal mulus.',
      commonSpecs: [
        'Roda 700c (ISO 622) dengan profil ban 25–32mm',
        'Thru-Axle 12×100 (depan) & 12×142 (belakang) atau QR',
        'Rem Flat Mount Hydraulic Disc atau Rim Caliper',
        'Drivetrain 2×11 / 2×12 close-ratio',
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
  <div class="native-container learn-container">
    <!-- Header -->
    <header class="native-page-header">
      <div class="header-topline">
        <span class="native-eyebrow">Pusat Pengetahuan Gowes</span>
        <button
          class="wizard-open-pill"
          type="button"
          @click="showWizard = true"
        >
          🧭 Deteksi Tipe Sepeda
        </button>
      </div>
      <h1 class="native-title">Anatomi &amp; Standar Sepeda</h1>
      <p class="native-sub">
        Pelajari tipe sepeda, kompatibilitas komponen as roda, BB, headset, dan kamus istilah mekanik secara transparan.
      </p>

      <!-- Instant Search Field -->
      <form class="native-search-bar" @submit.prevent="searchLearn">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari Boost, Freehub, Tapered, BSA, Ban…"
          :minlength="LEARN_SEARCH_MIN_QUERY_LENGTH"
          :maxlength="LEARN_SEARCH_MAX_QUERY_LENGTH"
          class="search-input"
          @input="searchQuery ? null : clearSearch()"
        />
        <button v-if="searchQuery" class="clear-btn" type="button" @click="clearSearch">✕</button>
        <button class="search-submit-btn" type="submit" :disabled="searching">
          {{ searching ? '…' : 'Cari' }}
        </button>
      </form>
    </header>

    <!-- Search Results View (If searched) -->
    <div v-if="hasSearched" class="search-results-section">
      <div class="search-results-header">
        <span>Hasil Pencarian untuk <strong>"{{ searchQuery }}"</strong> ({{ searchResults.length }})</span>
        <button class="clear-text-btn" type="button" @click="clearSearch">Tutup Hasil</button>
      </div>

      <p v-if="searchError" class="state-card state-card--error" role="alert">{{ searchError }}</p>
      <p v-else-if="searchResults.length === 0" class="state-card state-card--empty">
        Tidak ditemukan istilah yang cocok. Coba cari kata kunci seperti "axle", "freehub", "travel", atau "bb".
      </p>
      <div v-else class="search-results-grid">
        <NuxtLink
          v-for="res in searchResults"
          :key="`${res.kind}-${res.slug}`"
          :to="searchResultHref(res)"
          class="search-result-card"
        >
          <div class="result-topline">
            <span class="result-badge">{{ searchKindLabel(res.kind) }}</span>
          </div>
          <strong class="result-title">{{ res.title }}</strong>
          <p class="result-desc">{{ res.summary }}</p>
        </NuxtLink>
      </div>
    </div>

    <!-- Segmented Control Navigation Tabs -->
    <nav v-if="!hasSearched" class="native-segmented-bar" role="tablist" aria-label="Menu Belajar">
      <button
        class="segment-tab"
        :class="{ 'segment-tab--active': activeTab === 'types' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'types'"
        @click="activeTab = 'types'"
      >
        🚲 Tipe Sepeda ({{ bicycleTypes.length }})
      </button>
      <button
        class="segment-tab"
        :class="{ 'segment-tab--active': activeTab === 'components' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'components'"
        @click="activeTab = 'components'"
      >
        🔩 Komponen ({{ componentCategories.length }})
      </button>
      <button
        class="segment-tab"
        :class="{ 'segment-tab--active': activeTab === 'glossary' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'glossary'"
        @click="activeTab = 'glossary'"
      >
        📚 Glosarium ({{ glossaryTerms.length }})
      </button>
    </nav>

    <p v-if="loading" class="state-card" role="status">Memuat ensiklopedia sepeda…</p>
    <p v-else-if="errorMessage" class="state-card state-card--error" role="alert">{{ errorMessage }}</p>

    <template v-else-if="!hasSearched">
      <!-- ══════════════════════════════════════════════════════════
           TAB 1: BICYCLE TYPES (ANATOMY & STANDARDS)
           ══════════════════════════════════════════════════════════ -->
      <section v-if="activeTab === 'types'" class="tab-content-grid">
        <article
          v-for="bType in bicycleTypes"
          :key="bType.id"
          class="native-type-card"
        >
          <div class="type-card-top">
            <span class="type-emoji-box">{{ bikeTypeEmoji(bType.slug) }}</span>
            <div class="type-card-header">
              <span class="type-slug-pill">{{ bType.slug.replace('_', ' ') }}</span>
              <h2>{{ bType.name }}</h2>
            </div>
          </div>

          <p class="type-card-desc">{{ bType.summary }}</p>

          <NuxtLink
            class="native-action-link"
            :to="`/learn/bicycle-types/${bType.slug}`"
          >
            <span>Buka Diagram Anatomi &amp; Standar</span>
            <span class="action-arrow">→</span>
          </NuxtLink>
        </article>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           TAB 2: 20 COMPONENT CATEGORIES GRID
           ══════════════════════════════════════════════════════════ -->
      <section v-else-if="activeTab === 'components'" class="components-tab-section">
        <div class="components-grid">
          <NuxtLink
            v-for="cat in componentCategories"
            :key="cat.id"
            :to="`/learn/components/${cat.slug}`"
            class="component-cell-card"
          >
            <div class="component-icon">{{ categoryIcon(cat.slug) }}</div>
            <div class="component-info">
              <strong>{{ cat.name }}</strong>
              <small>{{ cat.description }}</small>
            </div>
            <span class="cell-arrow">›</span>
          </NuxtLink>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           TAB 3: GLOSSARY TERMS
           ══════════════════════════════════════════════════════════ -->
      <section v-else-if="activeTab === 'glossary'" class="glossary-tab-section">
        <div class="glossary-feed">
          <article
            v-for="term in glossaryTerms"
            :id="`glossary-${term.slug}`"
            :key="term.slug"
            class="glossary-card"
          >
            <div class="glossary-top">
              <h3 class="glossary-term">{{ term.term }}</h3>
              <span class="glossary-code">{{ term.slug }}</span>
            </div>
            <p class="glossary-def">{{ term.plainDefinition }}</p>
          </article>
        </div>
      </section>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         GUIDED IDENTIFICATION WIZARD MODAL
         ══════════════════════════════════════════════════════════ -->
    <div
      v-if="showWizard"
      class="native-modal-backdrop"
      @click.self="showWizard = false"
    >
      <div class="native-modal-sheet">
        <div class="modal-header">
          <div class="modal-header-titles">
            <span class="modal-step-badge">Langkah {{ wizardStep <= 3 ? `${wizardStep}/3` : 'Selesai' }}</span>
            <h2>Deteksi Tipe Sepeda Anda</h2>
          </div>
          <button class="modal-close" type="button" @click="showWizard = false">✕</button>
        </div>

        <!-- Step 1 -->
        <div v-if="wizardStep === 1" class="wizard-step-body">
          <p class="step-question">Di medan mana Anda paling sering bersepeda?</p>
          <div class="step-buttons-stack">
            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardTerrain = 'trail'; wizardStep = 2"
            >
              <span class="btn-icon">🌲</span>
              <div>
                <strong>Jalur Tanah &amp; Bebatuan (Off-road)</strong>
                <small>Singletrack, turunan bukit, tanah basah, dan bike park</small>
              </div>
            </button>

            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardTerrain = 'paved'; wizardStep = 2"
            >
              <span class="btn-icon">🛣️</span>
              <div>
                <strong>Jalan Aspal Mulus &amp; Perkotaan</strong>
                <small>Jalan raya, rute komuter kota, dan putaran velodrome</small>
              </div>
            </button>

            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardTerrain = 'gravel'; wizardStep = 2"
            >
              <span class="btn-icon">🌾</span>
              <div>
                <strong>Kombinasi Aspal &amp; Jalan Makadam / Kerikil</strong>
                <small>Eksplorasi jalan pedesaan, perkebunan, dan aspal tambalan</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 2 -->
        <div v-else-if="wizardStep === 2" class="wizard-step-body">
          <p class="step-question">Apakah rangka sepeda Anda memiliki engsel lipat?</p>
          <div class="step-buttons-stack">
            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardFolding = 'yes'; runWizardEvaluation()"
            >
              <span class="btn-icon">🧲</span>
              <div>
                <strong>Ya, Rangka Bisa Dilipat</strong>
                <small>Memiliki klem engsel di tengah untuk masuk bagasi/KRL</small>
              </div>
            </button>

            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardFolding = 'no'; wizardStep = 3"
            >
              <span class="btn-icon">🚲</span>
              <div>
                <strong>Tidak, Rangka Utuh (Non-folding)</strong>
                <small>Rangka sepeda rigid atau suspensi standar</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 3 -->
        <div v-else-if="wizardStep === 3" class="wizard-step-body">
          <p class="step-question">Bagaimana bentuk stang (handlebar) sepeda Anda?</p>
          <div class="step-buttons-stack">
            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardHandlebar = 'flat'; runWizardEvaluation()"
            >
              <span class="btn-icon">➖</span>
              <div>
                <strong>Stang Lurus / Riser (Flat Bar)</strong>
                <small>Posisi berkendara tegak dengan tuas rem dan shifter jempol</small>
              </div>
            </button>

            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardHandlebar = 'drop'; runWizardEvaluation()"
            >
              <span class="btn-icon">➰</span>
              <div>
                <strong>Stang Melengkung Balap (Drop Bar)</strong>
                <small>Posisi aerodinamis dengan tuas rem-shifter terintegrasi</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 4 Result -->
        <div v-else-if="wizardStep === 4 && wizardResult" class="wizard-result-box">
          <div class="result-score-badge">✓ {{ wizardResult.matchScore }}</div>
          <h3 class="result-bike-name">{{ wizardResult.typeName }}</h3>
          <p class="result-bike-summary">{{ wizardResult.summary }}</p>

          <div class="common-standards-box">
            <strong>Standar Umum Sepeda Ini:</strong>
            <ul>
              <li v-for="spec in wizardResult.commonSpecs" :key="spec">{{ spec }}</li>
            </ul>
          </div>

          <div class="wizard-action-group">
            <NuxtLink
              class="button button--primary button--full"
              :to="`/learn/bicycle-types/${wizardResult.typeSlug}`"
              @click="showWizard = false"
            >
              📐 Buka Diagram Anatomi Interaktif
            </NuxtLink>
            <NuxtLink
              class="button button--secondary button--full"
              to="/garage/new"
              @click="showWizard = false"
            >
              ＋ Daftarkan Sepeda ke My Garage
            </NuxtLink>
            <button class="button button--sand button--full" type="button" @click="resetWizard">
              Ulangi Deteksi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.learn-container {
  display: grid;
  gap: 1.25rem;
  padding-bottom: 2.5rem;
}

.native-page-header {
  display: grid;
  gap: 0.45rem;
}

.header-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.native-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.05em;
}

.wizard-open-pill {
  border: 1px solid var(--color-ink);
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-size: 0.74rem;
  font-weight: 850;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: 0 2px 0 var(--color-ink);
  transition: transform 90ms ease;
}

.wizard-open-pill:active {
  transform: scale(0.96);
}

.native-title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.native-sub {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* Search Bar */
.native-search-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.45rem 0.35rem 0.85rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 2px 10px rgb(23 32 42 / 4%);
  margin-top: 0.45rem;
}

.search-icon {
  font-size: 0.85rem;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.82rem;
  font-weight: 750;
  color: var(--color-ink);
}

.clear-btn {
  border: none;
  background: none;
  font-size: 0.75rem;
  color: var(--color-asphalt);
  cursor: pointer;
}

.search-submit-btn {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: var(--color-ink);
  color: var(--color-white);
  border: none;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
}

/* Segmented Bar */
.native-segmented-bar {
  display: flex;
  gap: 0.35rem;
  padding: 0.3rem;
  border-radius: 0.95rem;
  background: var(--color-sand);
}

.segment-tab {
  flex: 1;
  padding: 0.5rem 0.65rem;
  border-radius: 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-asphalt);
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
  text-align: center;
}

.segment-tab--active {
  background: var(--color-white);
  color: var(--color-ink);
  box-shadow: 0 2px 6px rgb(23 32 42 / 8%);
}

/* TAB 1: Bike Types Grid */
.tab-content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 1rem;
}

.native-type-card {
  display: flex;
  flex-direction: column;
  padding: 1.15rem;
  border-radius: 1.25rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 16px rgb(23 32 42 / 5%);
  gap: 0.85rem;
}

.type-card-top {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.type-emoji-box {
  width: 3rem;
  height: 3rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  display: grid;
  place-items: center;
  font-size: 1.6rem;
  flex-shrink: 0;
}

.type-card-header {
  display: grid;
  gap: 0.15rem;
}

.type-slug-pill {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  text-transform: uppercase;
  color: #0369a1;
  background: #e0f2fe;
  padding: 0.1rem 0.4rem;
  border-radius: 0.35rem;
  display: inline-block;
  width: fit-content;
}

.type-card-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.type-card-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  line-height: 1.4;
  flex: 1;
}

.native-action-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 850;
  color: var(--color-ink);
  transition: transform 90ms ease, background-color 100ms ease;
}

.native-action-link:active {
  transform: scale(0.98);
  background: var(--color-chain-lime);
}

.action-arrow {
  font-size: 0.95rem;
}

/* TAB 2: Components Grid */
.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: 0.65rem;
}

.component-cell-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.95rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  text-decoration: none;
  color: var(--color-ink);
  transition: all 120ms ease;
}

.component-cell-card:hover {
  border-color: var(--color-ink);
}

.component-cell-card:active {
  transform: scale(0.98);
  background: var(--color-canvas);
}

.component-icon {
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 0.65rem;
  background: var(--color-sand);
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.component-info {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.1rem;
}

.component-info strong {
  font-size: 0.86rem;
  font-weight: 850;
}

.component-info small {
  font-size: 0.72rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-arrow {
  font-size: 1.15rem;
  color: var(--color-asphalt);
  opacity: 0.45;
}

/* TAB 3: Glossary */
.glossary-feed {
  display: grid;
  gap: 0.75rem;
}

.glossary-card {
  display: grid;
  gap: 0.35rem;
  padding: 0.95rem 1.15rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.glossary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.glossary-term {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
}

.glossary-code {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: var(--color-asphalt);
  background: var(--color-sand);
  padding: 0.1rem 0.4rem;
  border-radius: 0.35rem;
}

.glossary-def {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* Search Results */
.search-results-section {
  display: grid;
  gap: 0.75rem;
}

.search-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-asphalt);
}

.clear-text-btn {
  border: none;
  background: none;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-ink);
  cursor: pointer;
  text-decoration: underline;
}

.search-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.65rem;
}

.search-result-card {
  display: grid;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  text-decoration: none;
  color: var(--color-ink);
}

.result-badge {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 850;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  padding: 0.1rem 0.4rem;
  border-radius: 0.3rem;
  text-transform: uppercase;
}

.result-title {
  font-size: 0.9rem;
  font-weight: 850;
}

.result-desc {
  margin: 0;
  font-size: 0.74rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

/* Wizard Modal Sheet */
.native-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 60%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 1rem;
}

.native-modal-sheet {
  width: 100%;
  max-width: 28rem;
  background: var(--color-white);
  border-radius: 1.35rem;
  padding: 1.35rem;
  box-shadow: 0 16px 48px rgb(0 0 0 / 25%);
  display: grid;
  gap: 1rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header-titles {
  display: grid;
  gap: 0.15rem;
}

.modal-step-badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: #166534;
  background: rgb(201 243 106 / 50%);
  padding: 0.1rem 0.45rem;
  border-radius: 0.35rem;
  width: fit-content;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 850;
}

.modal-close {
  border: none;
  background: none;
  font-size: 1rem;
  color: var(--color-asphalt);
  cursor: pointer;
}

.wizard-step-body {
  display: grid;
  gap: 0.85rem;
}

.step-question {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--color-ink);
}

.step-buttons-stack {
  display: grid;
  gap: 0.5rem;
}

.wizard-btn-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  text-align: left;
  cursor: pointer;
  transition: all 100ms ease;
}

.wizard-btn-card:active {
  transform: scale(0.98);
  background: var(--color-chain-lime);
}

.btn-icon {
  font-size: 1.6rem;
}

.wizard-btn-card strong {
  font-size: 0.84rem;
  font-weight: 850;
  display: block;
}

.wizard-btn-card small {
  font-size: 0.72rem;
  color: var(--color-asphalt);
}

.wizard-result-box {
  display: grid;
  gap: 0.85rem;
}

.result-score-badge {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 900;
  color: #166534;
  background: rgb(201 243 106 / 60%);
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  width: fit-content;
}

.result-bike-name {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 850;
}

.result-bike-summary {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.common-standards-box {
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  font-size: 0.76rem;
}

.common-standards-box ul {
  margin: 0.35rem 0 0;
  padding-left: 1.15rem;
  display: grid;
  gap: 0.25rem;
}

.wizard-action-group {
  display: grid;
  gap: 0.5rem;
}
</style>
