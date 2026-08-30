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
const showAdminModal = ref(false);

function onTermCreated(term: GlossaryTerm): void {
  glossaryTerms.value.unshift(term);
  activeTab.value = 'glossary';
}

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

function categoryIconName(slug: string): string {
  const iconMap: Record<string, string> = {
    frame: 'frame',
    fork: 'fork',
    rear_shock: 'rear_shock',
    wheel: 'wheel',
    hub: 'hub',
    tire: 'tire',
    cassette: 'cassette',
    chain: 'chain',
    crank: 'crank',
    bottom_bracket: 'bottom_bracket',
    rear_derailleur: 'rear_derailleur',
    shifter: 'shifter',
    brake: 'disc_brake',
    rotor: 'disc_brake',
    headset: 'headset',
    handlebar: 'bike-road',
    stem: 'wrench',
    seatpost: 'frame',
    saddle: 'bike',
    pedal: 'crank',
    folding_hinge: 'bike-folding',
  };
  return iconMap[slug] ?? 'wrench';
}

function bikeTypeSvg(slug: string): string {
  const map: Record<string, string> = {
    folding: '/bikes/folding.svg',
    gravel: '/bikes/gravel.svg',
    mtb_hardtail: '/bikes/mtb_hardtail.svg',
    road: '/bikes/road.svg',
  };
  return map[slug] ?? '/bikes/mtb_hardtail.svg';
}

function bikeTypeHighlights(slug: string): string[] {
  if (slug === 'mtb_hardtail') {
    return ['Boost 15×110 / 12×148', 'Fork Tapered', '1×12 Wide Range', 'Dropper 30.9/31.6'];
  }
  if (slug === 'folding') {
    return ['ISO 406 / ISO 305', 'QR 135mm / 130mm', 'BB BSA 68mm', 'Seatpost 33.9mm'];
  }
  if (slug === 'road') {
    return ['700c (ISO 622)', 'Thru-Axle 12×100/142', 'Flat Mount Disc', '2×11 / 2×12 Speed'];
  }
  if (slug === 'gravel') {
    return ['Ban 38–50mm', 'Drop Bar Flare', 'Thru-Axle 12mm', 'Clutch Derailleur'];
  }
  return ['Standar Terverifikasi'];
}

function bikeTypeTerrainLabel(slug: string): string {
  if (slug === 'mtb_hardtail') return 'Singletrack • Off-road • Jalur Tanah';
  if (slug === 'folding') return 'Perkotaan • Komuter • Multi-modal';
  if (slug === 'road') return 'Aspal Mulus • Balap • Endurance';
  if (slug === 'gravel') return 'Aspal & Kerikil • Bikepacking • All-Road';
  return 'Jalur Serbaguna';
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
  <div class="learn-page-wrapper">
    <!-- HERO / PAGE HEADER -->
    <header class="learn-hero">
      <div class="learn-hero__inner">
        <!-- Eyebrow -->
        <div class="learn-badge">
          <span class="learn-badge__dot" />
          <span>Pusat Pengetahuan Gowes</span>
        </div>

        <!-- Main Title & Sub -->
        <h1 class="learn-hero__title">Anatomi &amp; Standar Sepeda</h1>
        <p class="learn-hero__subtitle">
          Pelajari tipe sepeda, kompatibilitas komponen as roda, bottom bracket, headset, dan standar teknis secara transparan tanpa bingung.
        </p>

        <!-- Quick Action Tools Row -->
        <div class="learn-quick-actions">
          <NuxtLink to="/learn/diagnostics" class="action-pill action-pill--alert">
            <span class="pill-icon">
              <GIcon name="wrench" size="xs" color="#EF4444" />
            </span>
            <span>Diagnostik</span>
          </NuxtLink>
          <button
            class="action-pill action-pill--wizard"
            type="button"
            @click="showWizard = true"
          >
            <span class="pill-icon">
              <GIcon name="radar" size="xs" color="#16A34A" />
            </span>
            <span>Deteksi</span>
          </button>
          <button
            class="action-pill action-pill--curate"
            type="button"
            @click="showAdminModal = true"
          >
            <span class="pill-icon">
              <GIcon name="plus" size="xs" color="#17202A" />
            </span>
            <span>Tambah</span>
          </button>
        </div>

        <!-- Search Bar -->
        <form class="learn-search" @submit.prevent="searchLearn">
          <span class="learn-search__icon" aria-hidden="true">
            <GIcon name="search" size="xs" />
          </span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari Boost, Freehub, Tapered, BSA, Ban, Rotor…"
            :minlength="LEARN_SEARCH_MIN_QUERY_LENGTH"
            :maxlength="LEARN_SEARCH_MAX_QUERY_LENGTH"
            class="learn-search__input"
            @input="searchQuery ? null : clearSearch()"
          />
          <button v-if="searchQuery" class="learn-search__clear" type="button" @click="clearSearch">
            <GIcon name="close" size="xs" />
          </button>
          <button class="learn-search__submit" type="submit" :disabled="searching">
            {{ searching ? '…' : 'Cari' }}
          </button>
        </form>
      </div>
    </header>

    <div class="learn-content-container">
      <!-- Search Results View (If searched) -->
      <div v-if="hasSearched" class="search-results-section">
        <div class="search-results-header">
          <span>Hasil Pencarian untuk <strong>"{{ searchQuery }}"</strong> ({{ searchResults.length }})</span>
          <button class="clear-text-btn" type="button" @click="clearSearch">
            <GIcon name="close" size="xs" /> Tutup Pencarian
          </button>
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

      <!-- Segmented Control Navigation Tabs (Perfect fit, never cut off) -->
      <div v-if="!hasSearched" class="segmented-tabs-wrapper">
        <nav class="segmented-tabs" role="tablist" aria-label="Menu Belajar">
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'types' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'types'"
            @click="activeTab = 'types'"
          >
            <span class="tab-btn__icon">
              <GIcon name="bike" size="xs" />
            </span>
            <span class="tab-btn__label">
              <span class="label-short">Sepeda</span>
              <span class="label-full">Tipe Sepeda</span>
            </span>
            <span class="tab-btn__badge">{{ bicycleTypes.length }}</span>
          </button>

          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'components' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'components'"
            @click="activeTab = 'components'"
          >
            <span class="tab-btn__icon">
              <GIcon name="cassette" size="xs" />
            </span>
            <span class="tab-btn__label">
              <span class="label-short">Komponen</span>
              <span class="label-full">Komponen Anatomi</span>
            </span>
            <span class="tab-btn__badge">{{ componentCategories.length }}</span>
          </button>

          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'glossary' }"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'glossary'"
            @click="activeTab = 'glossary'"
          >
            <span class="tab-btn__icon">
              <GIcon name="passport" size="xs" />
            </span>
            <span class="tab-btn__label">
              <span class="label-short">Glosarium</span>
              <span class="label-full">Kamus Glosarium</span>
            </span>
            <span class="tab-btn__badge">{{ glossaryTerms.length }}</span>
          </button>
        </nav>
      </div>

      <!-- Loading Skeleton Shimmer Grid -->
      <div v-if="loading" class="types-grid">
        <div v-for="i in 4" :key="i" class="bike-type-card skeleton-card-box">
          <div class="skeleton-shimmer" style="width: 100%; height: 10rem; border-radius: 0.85rem;" />
          <div style="padding: 1rem; display: grid; gap: 0.65rem;">
            <div class="skeleton-shimmer" style="width: 35%; height: 1.1rem; border-radius: 0.35rem;" />
            <div class="skeleton-shimmer" style="width: 60%; height: 1.5rem; border-radius: 0.4rem;" />
            <div class="skeleton-shimmer" style="width: 90%; height: 0.85rem; border-radius: 0.35rem;" />
            <div class="skeleton-shimmer" style="width: 100%; height: 2.6rem; border-radius: 0.75rem; margin-top: 0.5rem;" />
          </div>
        </div>
      </div>
      <p v-else-if="errorMessage" class="state-card state-card--error" role="alert">{{ errorMessage }}</p>

      <template v-else-if="!hasSearched">
        <!-- ══════════════════════════════════════════════════════════
             TAB 1: BICYCLE TYPES (WITH VECTOR ARTWORK ASSETS)
             ══════════════════════════════════════════════════════════ -->
        <section v-if="activeTab === 'types'" class="types-section">
          <div class="types-grid">
            <article
              v-for="bType in bicycleTypes"
              :key="bType.id"
              class="bike-type-card"
            >
              <!-- Vector Illustration Banner Artwork -->
              <div class="bike-type-illustration-box">
                <img
                  :src="bikeTypeSvg(bType.slug)"
                  :alt="bType.name"
                  class="bike-type-svg"
                  loading="lazy"
                />
              </div>

              <!-- Card Content -->
              <div class="bike-type-card__body">
                <div class="bike-type-header-content">
                  <div class="bike-type-category-pill">
                    {{ bType.slug.replace('_', ' ').toUpperCase() }}
                  </div>
                  <h2 class="bike-type-title">{{ bType.name }}</h2>
                  <div class="bike-type-terrain">
                    {{ bikeTypeTerrainLabel(bType.slug) }}
                  </div>
                </div>

                <!-- Summary -->
                <p class="bike-type-summary">{{ bType.summary }}</p>

                <!-- Technical Standards Highlights Chips -->
                <div class="bike-type-specs-shelf">
                  <div class="specs-shelf-label">Standar Kunci:</div>
                  <div class="specs-chips-row">
                    <span
                      v-for="badge in bikeTypeHighlights(bType.slug)"
                      :key="badge"
                      class="spec-chip"
                    >
                      {{ badge }}
                    </span>
                  </div>
                </div>

                <!-- Card Action Button -->
                <NuxtLink
                  class="bike-type-action-btn"
                  :to="`/learn/bicycle-types/${bType.slug}`"
                >
                  <span>Buka Diagram Anatomi &amp; Standar</span>
                  <span class="action-btn-arrow">→</span>
                </NuxtLink>
              </div>
            </article>
          </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             TAB 2: 20 COMPONENT CATEGORIES GRID
             ══════════════════════════════════════════════════════════ -->
        <section v-else-if="activeTab === 'components'" class="components-section">
          <div class="components-grid">
            <NuxtLink
              v-for="cat in componentCategories"
              :key="cat.id"
              :to="`/learn/components/${cat.slug}`"
              class="component-card"
            >
              <div class="component-card__icon-box">
                <GIcon :name="categoryIconName(cat.slug)" size="lg" color="#17202A" />
              </div>
              <div class="component-card__details">
                <h3 class="component-card__name">{{ cat.name }}</h3>
                <p class="component-card__desc">{{ cat.description }}</p>
              </div>
              <span class="component-card__arrow">›</span>
            </NuxtLink>
          </div>
        </section>

        <!-- ══════════════════════════════════════════════════════════
             TAB 3: GLOSSARY TERMS
             ══════════════════════════════════════════════════════════ -->
        <section v-else-if="activeTab === 'glossary'" class="glossary-section">
          <div class="glossary-header-banner">
            <div class="glossary-banner-text">
              <h3>Kamus Standar &amp; Istilah Bengkel Sepeda</h3>
              <p>Pelajari arti istilah mekanik seperti Boost, UDH, Tapered, BSA, Micro Spline, dan HG.</p>
            </div>
            <button
              class="curate-button"
              type="button"
              @click="showAdminModal = true"
            >
              <GIcon name="plus" size="xs" color="#17202A" />
              <span>Tambah Istilah Baru</span>
            </button>
          </div>

          <div class="glossary-grid">
            <article
              v-for="term in glossaryTerms"
              :id="`glossary-${term.slug}`"
              :key="term.slug"
              class="glossary-card"
            >
              <div class="glossary-card__top">
                <h3 class="glossary-card__title">{{ term.term }}</h3>
                <span class="glossary-card__code">{{ term.slug }}</span>
              </div>
              <p class="glossary-card__plain">{{ term.plainDefinition }}</p>
              
              <div v-if="term.technicalDefinition" class="glossary-card__tech">
                <span class="tech-label">Spesifikasi Teknis:</span>
                <p>{{ term.technicalDefinition }}</p>
              </div>

              <div v-if="term.aliases && term.aliases.length > 0" class="glossary-card__aliases">
                <span class="alias-label">Alias:</span>
                <span v-for="alias in term.aliases" :key="alias" class="alias-pill">{{ alias }}</span>
              </div>
            </article>
          </div>
        </section>
      </template>

      <!-- ══════════════════════════════════════════════════════════
           OFFICIAL ENGINEERING STANDARDS PROVENANCE BANNER
           ══════════════════════════════════════════════════════════ -->
      <section class="standards-provenance-section" aria-labelledby="standards-provenance-title">
        <div class="provenance-section-header">
          <div class="provenance-header-left">
            <span class="provenance-chip">
              <GIcon name="shield" size="xs" color="#15803D" filled />
              <span>Standar Terverifikasi</span>
            </span>
            <h2 id="standards-provenance-title" class="provenance-section-title">
              Transparansi &amp; Rujukan Standar Resmi
            </h2>
            <p class="provenance-section-sub">
              Seluruh aturan kompatibilitas dan dimensi mekanik di GowesKit diverifikasi dari dokumen teknis resmi industri sepeda internasional:
            </p>
          </div>
        </div>

        <div class="standards-cards-grid">
          <a
            href="https://www.iso.org/standard/80740.html"
            target="_blank"
            rel="noopener noreferrer"
            class="standard-ref-card"
          >
            <div class="standard-card-head">
              <span class="standard-org">ISO &amp; ETRTO</span>
              <span class="ext-icon">↗</span>
            </div>
            <strong class="standard-title">ISO 5775-1 / ISO 4210</strong>
            <p class="standard-desc">Standar dimensi pelek, Bead Seat Diameter (BSD ban), dan uji keselamatan rangka sepeda.</p>
          </a>

          <a
            href="https://www.canecreek.com/pages/everything-you-need-to-know-about-headsets"
            target="_blank"
            rel="noopener noreferrer"
            class="standard-ref-card"
          >
            <div class="standard-card-head">
              <span class="standard-org">SHIS (Standard Headset)</span>
              <span class="ext-icon">↗</span>
            </div>
            <strong class="standard-title">Cane Creek, FSA &amp; Park Tool</strong>
            <p class="standard-desc">Standardized Headset Identification System untuk kecocokan fork steerer (EC, ZS, IS).</p>
          </a>

          <a
            href="https://www.parktool.com/en-int/blog/repair-help/bottom-bracket-identification"
            target="_blank"
            rel="noopener noreferrer"
            class="standard-ref-card"
          >
            <div class="standard-card-head">
              <span class="standard-org">Bottom Bracket Standards</span>
              <span class="ext-icon">↗</span>
            </div>
            <strong class="standard-title">Park Tool &amp; Manufacturer Specs</strong>
            <p class="standard-desc">Identifikasi shell ulir BSA/T47 dan pressfit BB86/92, BB30, DUB 28.99mm, 24mm.</p>
          </a>

          <a
            href="https://productinfo.shimano.com/en/compatibility"
            target="_blank"
            rel="noopener noreferrer"
            class="standard-ref-card"
          >
            <div class="standard-card-head">
              <span class="standard-org">Shimano &amp; SRAM Tech</span>
              <span class="ext-icon">↗</span>
            </div>
            <strong class="standard-title">Groupset &amp; Axle Compatibility</strong>
            <p class="standard-desc">Matriks kompatibilitas drivetrain Micro Spline, HG, XD/XDR, Boost 148, dan Linkglide CUES.</p>
          </a>
        </div>
      </section>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         GUIDED IDENTIFICATION WIZARD MODAL
         ══════════════════════════════════════════════════════════ -->
    <div
      v-if="showWizard"
      class="native-modal-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="showWizard = false"
    >
      <div class="wizard-modal-sheet">
        <div class="modal-header">
          <div class="modal-header-titles">
            <span class="modal-step-badge">Langkah {{ wizardStep <= 3 ? `${wizardStep}/3` : 'Selesai' }}</span>
            <h2>Deteksi Tipe Sepeda Anda</h2>
          </div>
          <button class="modal-close" type="button" aria-label="Tutup" @click="showWizard = false">
            <GIcon name="close" size="xs" />
          </button>
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
              <div class="btn-icon-box">
                <GIcon name="tree" size="md" color="#16A34A" />
              </div>
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
              <div class="btn-icon-box">
                <GIcon name="bike-road" size="md" color="#0284C7" />
              </div>
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
              <div class="btn-icon-box">
                <GIcon name="bike-gravel" size="md" color="#D97706" />
              </div>
              <div>
                <strong>Kombinasi Aspal &amp; Jalan Makadam / Kerikil</strong>
                <small>Jalur pedesaan, perkebunan, dan rute jarak jauh all-road</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 2 -->
        <div v-else-if="wizardStep === 2" class="wizard-step-body">
          <p class="step-question">Apakah rangka sepeda Anda memiliki engsel lipat di bagian tengah?</p>
          <div class="step-buttons-stack">
            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardFolding = 'yes'; runWizardEvaluation()"
            >
              <div class="btn-icon-box">
                <GIcon name="bike-folding" size="md" color="#7C3AED" />
              </div>
              <div>
                <strong>Ya, Sepeda Bisa Dilipat (Folding)</strong>
                <small>Rangka berengsel, roda kecil (16–20 inci), mudah disimpan</small>
              </div>
            </button>

            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardFolding = 'no'; wizardStep = 3"
            >
              <div class="btn-icon-box">
                <GIcon name="bike" size="md" color="#17202A" />
              </div>
              <div>
                <strong>Tidak, Rangka Standar / Kaku (Rigid / Fixed)</strong>
                <small>Rangka MTB, Road, Gravel, atau Hybrid standar</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 3 -->
        <div v-else-if="wizardStep === 3" class="wizard-step-body">
          <p class="step-question">Model setang (handlebar) seperti apa yang terpasang?</p>
          <div class="step-buttons-stack">
            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardHandlebar = 'flat'; runWizardEvaluation()"
            >
              <div class="btn-icon-box">
                <GIcon name="bike-mtb" size="md" color="#059669" />
              </div>
              <div>
                <strong>Setang Lurus / Riser (Flat Bar)</strong>
                <small>Posisi gowes tegak, kontrol stabil di medan off-road / kota</small>
              </div>
            </button>

            <button
              class="wizard-btn-card"
              type="button"
              @click="wizardHandlebar = 'drop'; runWizardEvaluation()"
            >
              <div class="btn-icon-box">
                <GIcon name="bike-road" size="md" color="#EA580C" />
              </div>
              <div>
                <strong>Setang Balap Melengkung (Drop Bar)</strong>
                <small>Posisi gowes aerodinamis untuk kecepatan dan jarak jauh</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 4: Result -->
        <div v-else-if="wizardStep === 4 && wizardResult" class="wizard-result-box">
          <div class="result-score-badge">
            ✓ {{ wizardResult.matchScore }}
          </div>
          <h3 class="result-bike-name">{{ wizardResult.typeName }}</h3>
          <p class="result-bike-summary">{{ wizardResult.summary }}</p>

          <div class="common-standards-box">
            <strong>Standar Komponen Umum:</strong>
            <ul>
              <li v-for="spec in wizardResult.commonSpecs" :key="spec">{{ spec }}</li>
            </ul>
          </div>

          <div class="wizard-action-group">
            <NuxtLink
              class="button button--primary"
              :to="`/learn/bicycle-types/${wizardResult.typeSlug}`"
              @click="showWizard = false"
            >
              Buka Anatomi {{ wizardResult.typeName }} →
            </NuxtLink>
            <button class="button button--secondary" type="button" @click="resetWizard">
              Ulangi Deteksi
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Glossary Admin & Curation Modal -->
    <GlossaryAdminModal
      :is-open="showAdminModal"
      @close="showAdminModal = false"
      @term-created="onTermCreated"
    />
  </div>
</template>

<style scoped>
.learn-page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 3rem;
}

/* ══════════════════════════════════════════════════════════
   HERO / HEADER SECTION
   ══════════════════════════════════════════════════════════ */
.learn-hero {
  background: var(--color-white);
  border-bottom: 1.5px solid var(--color-sand);
  padding: 1.25rem 1rem 1.5rem;
  margin: -1rem -1rem 0 -1rem;
}

@media (min-width: 640px) {
  .learn-hero {
    border-radius: 1.5rem;
    border: 1.5px solid var(--color-sand);
    margin: 0;
    padding: 1.5rem 1.75rem 1.75rem;
  }
}

.learn-hero__inner {
  max-width: 54rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.learn-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-asphalt);
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  width: fit-content;
}

.learn-badge__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #16A34A;
}

.learn-hero__title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--color-ink);
  line-height: 1.2;
}

.learn-hero__subtitle {
  margin: 0;
  font-size: 0.86rem;
  color: var(--color-asphalt);
  line-height: 1.45;
  max-width: 44rem;
}

/* Quick Tools Row (Clean 3-pill balanced fit) */
.learn-quick-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
}

.action-pill {
  flex: 1 1 0%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.45rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 850;
  text-decoration: none;
  cursor: pointer;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  transition: transform 90ms ease, box-shadow 90ms ease;
  white-space: nowrap;
  min-width: 0;
  box-sizing: border-box;
}

.action-pill:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--color-ink);
}

.action-pill--alert {
  background: #FEF3C7;
  color: #92400E;
  border-color: #92400E;
  box-shadow: 0 2px 0 #92400E;
}

.action-pill--wizard {
  background: var(--color-chain-lime);
  color: var(--color-ink);
}

.action-pill--curate {
  background: var(--color-canvas);
  color: var(--color-ink);
}

.pill-icon {
  font-size: 0.85rem;
}

/* Search Bar */
.learn-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.45rem 0.35rem 0.85rem;
  border-radius: 9999px;
  background: var(--color-canvas);
  border: 1.5px solid var(--color-sand);
  box-shadow: 0 2px 8px rgba(23, 32, 42, 0.03);
  margin-top: 0.35rem;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.learn-search:focus-within {
  border-color: var(--color-ink);
  background: var(--color-white);
}

.learn-search__icon {
  font-size: 0.9rem;
  opacity: 0.6;
}

.learn-search__input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--color-ink);
  font-family: inherit;
}

.learn-search__clear {
  border: none;
  background: none;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  cursor: pointer;
  padding: 0.2rem 0.4rem;
}

.learn-search__submit {
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  background: var(--color-ink);
  color: var(--color-white);
  border: none;
  font-size: 0.76rem;
  font-weight: 850;
  cursor: pointer;
  transition: transform 90ms ease;
}

.learn-search__submit:active {
  transform: scale(0.96);
}

/* ══════════════════════════════════════════════════════════
   SEGMENTED NAVIGATION TABS (ADAPTIVE PERFECT-FIT)
   ══════════════════════════════════════════════════════════ */
.learn-content-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 54rem;
  margin: 0 auto;
  width: 100%;
}

.segmented-tabs-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.segmented-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 9999px;
  background: var(--color-sand);
  width: 100%;
  max-width: 38rem;
  box-sizing: border-box;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 0.25rem;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: var(--color-asphalt);
  font-size: 0.8rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.tab-btn--active {
  background: var(--color-white);
  color: var(--color-ink);
  box-shadow: 0 2px 6px rgba(23, 32, 42, 0.08);
}

.tab-btn__icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.tab-btn__label {
  display: flex;
  align-items: center;
}

.label-full {
  display: none;
}

.label-short {
  display: inline;
}

@media (min-width: 520px) {
  .label-full {
    display: inline;
  }
  .label-short {
    display: none;
  }
  .tab-btn {
    padding: 0.55rem 0.75rem;
    gap: 0.45rem;
  }
}

.tab-btn__badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  padding: 0.1rem 0.38rem;
  border-radius: 9999px;
  background: rgba(23, 32, 42, 0.08);
  color: var(--color-ink);
  flex-shrink: 0;
}

.tab-btn--active .tab-btn__badge {
  background: var(--color-chain-lime);
  color: var(--color-ink);
}

/* ══════════════════════════════════════════════════════════
   TAB 1: BICYCLE TYPE CARDS (CLEAN VECTOR ARTWORK AESTHETIC)
   ══════════════════════════════════════════════════════════ */
.types-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1.25rem;
}

.bike-type-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.35rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(23, 32, 42, 0.03);
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
}

.bike-type-card:hover {
  border-color: var(--color-ink);
  box-shadow: 0 8px 24px rgba(23, 32, 42, 0.07);
}

/* Vector Illustration Box */
.bike-type-illustration-box {
  width: 100%;
  height: 9.5rem;
  background: #F8FAFC;
  border-bottom: 1.5px solid var(--color-sand);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.bike-type-svg {
  width: 100%;
  height: 100%;
  max-width: 15rem;
  object-fit: contain;
}

/* Card Body */
.bike-type-card__body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex: 1;
}

.bike-type-header-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.bike-type-category-pill {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: #0284C7;
  background: #E0F2FE;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  width: fit-content;
  letter-spacing: 0.03em;
}

.bike-type-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-ink);
  letter-spacing: -0.02em;
}

.bike-type-terrain {
  font-size: 0.72rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

.bike-type-summary {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-asphalt);
  line-height: 1.45;
  flex: 1;
}

/* Specs Chips Shelf */
.bike-type-specs-shelf {
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  border-radius: 0.85rem;
  padding: 0.65rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.specs-shelf-label {
  font-size: 0.68rem;
  font-weight: 850;
  color: var(--color-asphalt);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.specs-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.spec-chip {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-ink);
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  padding: 0.15rem 0.5rem;
  border-radius: 0.4rem;
}

.bike-type-action-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1.5px solid var(--color-ink);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 850;
  color: var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  transition: all 100ms ease;
  margin-top: 0.25rem;
}

.bike-type-action-btn:hover {
  background: var(--color-chain-lime);
}

.bike-type-action-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--color-ink);
}

.action-btn-arrow {
  font-size: 1rem;
  font-weight: 900;
}

/* ══════════════════════════════════════════════════════════
   TAB 2: COMPONENTS GRID
   ══════════════════════════════════════════════════════════ */
.components-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 0.75rem;
}

.component-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  text-decoration: none;
  color: var(--color-ink);
  transition: all 120ms ease;
}

.component-card:hover {
  border-color: var(--color-ink);
  box-shadow: 0 4px 12px rgba(23, 32, 42, 0.05);
}

.component-card:active {
  transform: scale(0.98);
  background: var(--color-canvas);
}

.component-card__icon-box {
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.component-card__details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.component-card__name {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 850;
  color: var(--color-ink);
}

.component-card__desc {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.component-card__arrow {
  font-size: 1.25rem;
  color: var(--color-asphalt);
  opacity: 0.4;
}

/* ══════════════════════════════════════════════════════════
   TAB 3: GLOSSARY SECTION
   ══════════════════════════════════════════════════════════ */
.glossary-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.glossary-header-banner {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.25rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.glossary-banner-text h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
  color: var(--color-ink);
}

.glossary-banner-text p {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
}

.curate-button {
  padding: 0.45rem 0.85rem;
  border-radius: 0.65rem;
  background: var(--color-ink);
  color: var(--color-white);
  border: none;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.glossary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
  gap: 0.85rem;
}

.glossary-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.15rem;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.glossary-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.glossary-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--color-ink);
}

.glossary-card__code {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: var(--color-asphalt);
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  padding: 0.15rem 0.45rem;
  border-radius: 0.35rem;
}

.glossary-card__plain {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-ink);
  line-height: 1.45;
}

.glossary-card__tech {
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  border-radius: 0.65rem;
  padding: 0.65rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.tech-label {
  font-weight: 850;
  color: var(--color-ink);
  display: block;
  margin-bottom: 0.15rem;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.glossary-card__tech p {
  margin: 0;
}

.glossary-card__aliases {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  font-size: 0.72rem;
}

.alias-label {
  font-weight: 800;
  color: var(--color-asphalt);
}

.alias-pill {
  font-size: 0.68rem;
  font-weight: 750;
  background: var(--color-sand);
  color: var(--color-ink);
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
}

/* ══════════════════════════════════════════════════════════
   SEARCH RESULTS
   ══════════════════════════════════════════════════════════ */
.search-results-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.search-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--color-asphalt);
}

.clear-text-btn {
  border: none;
  background: none;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-ink);
  cursor: pointer;
  text-decoration: underline;
}

.search-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.75rem;
}

.search-result-card {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.15rem;
  padding: 1rem;
  text-decoration: none;
  color: var(--color-ink);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.result-badge {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  padding: 0.15rem 0.45rem;
  border-radius: 0.3rem;
  text-transform: uppercase;
}

.result-title {
  font-size: 0.95rem;
  font-weight: 850;
}

.result-desc {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* State Cards */
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
  background: #FEE2E2;
  border-color: #FCA5A5;
  color: #991B1B;
}

/* ══════════════════════════════════════════════════════════
   WIZARD MODAL SHEET
   ══════════════════════════════════════════════════════════ */
.native-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 1rem;
}

.wizard-modal-sheet {
  width: 100%;
  max-width: 30rem;
  background: var(--color-white);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-header-titles {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal-step-badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: #166534;
  background: rgba(201, 243, 106, 0.6);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  width: fit-content;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-ink);
}

.modal-close {
  border: none;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wizard-step-body {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.step-question {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 850;
  color: var(--color-ink);
  line-height: 1.35;
}

.step-buttons-stack {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.wizard-btn-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.95rem 1.15rem;
  border-radius: 1.15rem;
  background: var(--color-canvas);
  border: 1.5px solid var(--color-sand);
  text-align: left;
  cursor: pointer;
  transition: all 100ms ease;
}

.wizard-btn-card:hover {
  border-color: var(--color-ink);
  background: var(--color-white);
}

.wizard-btn-card:active {
  transform: scale(0.98);
  background: var(--color-chain-lime);
}

.btn-icon {
  font-size: 1.75rem;
}

.wizard-btn-card strong {
  font-size: 0.88rem;
  font-weight: 850;
  color: var(--color-ink);
  display: block;
}

.wizard-btn-card small {
  font-size: 0.75rem;
  color: var(--color-asphalt);
  line-height: 1.3;
}

.wizard-result-box {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.result-score-badge {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 900;
  color: #166534;
  background: var(--color-chain-lime);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  width: fit-content;
}

.result-bike-name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: var(--color-ink);
}

.result-bike-summary {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-asphalt);
  line-height: 1.45;
}

.common-standards-box {
  padding: 0.95rem;
  border-radius: 0.95rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  font-size: 0.78rem;
}

.common-standards-box ul {
  margin: 0.45rem 0 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--color-ink);
}

.wizard-action-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

/* Standards Provenance Section */
.standards-provenance-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 18px rgb(23 32 42 / 4%);
  display: grid;
  gap: 1.15rem;
}

.provenance-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
  color: #15803d;
  background: rgba(22, 163, 74, 0.12);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  width: fit-content;
  margin-bottom: 0.35rem;
}

.provenance-section-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.provenance-section-sub {
  margin: 0.3rem 0 0;
  font-size: 0.82rem;
  color: var(--color-asphalt);
  line-height: 1.45;
}

.standards-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 0.85rem;
}

.standard-ref-card {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  text-decoration: none;
  color: inherit;
  transition: border-color 120ms ease, transform 120ms ease;
}

.standard-ref-card:hover {
  border-color: var(--color-ink);
  transform: translateY(-2px);
}

.standard-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.standard-org {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  color: #0284c7;
  text-transform: uppercase;
}

.ext-icon {
  font-size: 0.75rem;
  color: var(--color-asphalt);
}

.standard-title {
  font-size: 0.92rem;
  font-weight: 850;
  color: var(--color-ink);
}

.standard-desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}
</style>
