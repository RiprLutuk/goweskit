<script setup lang="ts">
import {
  DIAGNOSTIC_SYMPTOMS,
  type DiagnosticCategory,
  type DiagnosticSymptom,
  searchDiagnosticSymptoms,
} from '@goweskit/bike-domain';

const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const activeSymptomId = ref<string | null>(null);

const categories = [
  { key: 'all', label: 'Semua Masalah' },
  { key: 'frame_bottom_bracket', label: 'Bottom Bracket & Crank' },
  { key: 'drivetrain', label: 'Rantai & Operan Gigi' },
  { key: 'brakes', label: 'Rem & Cakram' },
  { key: 'cockpit_headset', label: 'Headset & Setang' },
];

const filteredSymptoms = computed<readonly DiagnosticSymptom[]>(() => {
  let list = searchQuery.value.trim()
    ? searchDiagnosticSymptoms(searchQuery.value)
    : DIAGNOSTIC_SYMPTOMS;

  if (selectedCategory.value !== 'all') {
    list = list.filter((s) => s.category === (selectedCategory.value as DiagnosticCategory));
  }
  return list;
});

function toggleSymptom(id: string) {
  activeSymptomId.value = activeSymptomId.value === id ? null : id;
}

function getSeverityClass(severity: DiagnosticSymptom['severity']) {
  switch (severity) {
    case 'critical':
      return 'severity-badge--critical';
    case 'high':
      return 'severity-badge--high';
    case 'medium':
      return 'severity-badge--medium';
    default:
      return 'severity-badge--low';
  }
}
</script>

<template>
  <div class="native-container diagnostics-page">
    <!-- Header -->
    <header class="diagnostics-header">
      <NuxtLink to="/learn" class="back-link">← Kembali ke Belajar Anatomi</NuxtLink>
      <div class="header-title-row">
        <div>
          <span class="eyebrow">Pusat Diagnostik &amp; Troubleshooting Sepeda</span>
          <h1 class="page-title">Deteksi Suara &amp; Masalah Komponen</h1>
        </div>
      </div>
      <p class="header-desc">
        Sepeda Anda berdecit, operan loncat, atau rem amblas? Temukan sumber masalah, langkah inspeksi mandiri, dan torsi standar sebelum ke bengkel.
      </p>

      <!-- Search Box -->
      <div class="search-bar">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari keluhan (contoh: bunyi klotok, rantai loncat, rem decit, setang oblak)…"
          aria-label="Cari masalah sepeda"
        />
      </div>

      <!-- Filter Pills -->
      <div class="category-pills" role="tablist" aria-label="Filter Kategori Masalah">
        <button
          v-for="cat in categories"
          :key="cat.key"
          type="button"
          role="tab"
          :aria-selected="selectedCategory === cat.key"
          class="cat-pill"
          :class="{ 'cat-pill--active': selectedCategory === cat.key }"
          @click="selectedCategory = cat.key"
        >
          {{ cat.label }}
        </button>
      </div>
    </header>

    <!-- List of Symptoms -->
    <main class="symptoms-container">
      <div v-if="filteredSymptoms.length === 0" class="empty-state">
        <span class="empty-icon">🔧</span>
        <h3>Tidak ada masalah yang cocok</h3>
        <p>Coba gunakan kata kunci lain seperti "rantai", "rem", atau "bottom bracket".</p>
      </div>

      <div
        v-for="symptom in filteredSymptoms"
        :key="symptom.id"
        class="symptom-card"
        :class="{ 'symptom-card--expanded': activeSymptomId === symptom.id }"
      >
        <!-- Card Header (Accordion Trigger) -->
        <button
          type="button"
          class="symptom-card__header"
          :aria-expanded="activeSymptomId === symptom.id"
          @click="toggleSymptom(symptom.id)"
        >
          <div class="symptom-meta-top">
            <span class="category-tag">{{ symptom.categoryName }}</span>
            <span class="severity-badge" :class="[getSeverityClass(symptom.severity)]">
              Tingkat: {{ symptom.severity.toUpperCase() }}
            </span>
          </div>

          <div class="symptom-title-row">
            <h2 class="symptom-title">{{ symptom.title }}</h2>
            <span class="expand-chevron" aria-hidden="true">
              {{ activeSymptomId === symptom.id ? '▲' : '▼' }}
            </span>
          </div>

          <p class="symptom-short-desc">{{ symptom.description }}</p>
        </button>

        <!-- Card Body (Expanded Details) -->
        <div v-if="activeSymptomId === symptom.id" class="symptom-card__body">
          <!-- Probable Causes -->
          <section class="detail-section">
            <h3 class="detail-heading">⚠️ Kemungkinan Penyebab:</h3>
            <ul class="detail-list">
              <li v-for="(cause, i) in symptom.probableCauses" :key="i">{{ cause }}</li>
            </ul>
          </section>

          <!-- Inspection Steps -->
          <section class="detail-section">
            <h3 class="detail-heading">🔍 Langkah Pemeriksaan Mandiri:</h3>
            <ol class="detail-numbered-list">
              <li v-for="(step, i) in symptom.inspectionSteps" :key="i">{{ step }}</li>
            </ol>
          </section>

          <!-- Quick Fix & Standard Torque -->
          <section class="detail-section highlight-box">
            <h3 class="detail-heading">🛠️ Solusi Penanganan:</h3>
            <p class="highlight-text">{{ symptom.quickFix }}</p>
            <div v-if="symptom.standardTorqueNm" class="torque-spec">
              <strong>Torsi Standar:</strong> {{ symptom.standardTorqueNm }}
            </div>
          </section>

          <!-- When to visit bike shop -->
          <section class="shop-callout">
            <strong>🏥 Rekomendasi ke Bengkel Mekanik:</strong>
            <p>{{ symptom.proShopRecommendedIf }}</p>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.diagnostics-page {
  display: grid;
  gap: 1.5rem;
  padding-bottom: 4rem;
}

.back-link {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-asphalt);
  text-decoration: none;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.diagnostics-header {
  display: grid;
  gap: 0.75rem;
}

.eyebrow {
  font-size: 0.7rem;
  font-weight: 800;
  color: #0F766E;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.page-title {
  margin: 0.2rem 0 0 0;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.header-desc {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-asphalt);
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  pointer-events: none;
  font-size: 0.9rem;
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.4rem;
  border-radius: 0.85rem;
  border: 1.5px solid var(--color-sand);
  background: var(--color-white);
  color: var(--color-ink);
  font-size: 0.85rem;
  font-weight: 750;
  outline: none;
}

.search-bar input:focus {
  border-color: var(--color-ink);
}

.category-pills {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
}

.cat-pill {
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
  background: var(--color-sand);
  color: var(--color-asphalt);
  border: none;
  cursor: pointer;
  transition: background 120ms ease;
}

.cat-pill--active {
  background: var(--color-ink);
  color: var(--color-white);
}

.symptoms-container {
  display: grid;
  gap: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-white);
  border-radius: 1.25rem;
  border: 1px solid var(--color-sand);
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.symptom-card {
  background: var(--color-white);
  border-radius: 1rem;
  border: 1.5px solid var(--color-sand);
  overflow: hidden;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.symptom-card--expanded {
  border-color: var(--color-ink);
  box-shadow: 0 8px 24px rgba(23, 32, 42, 0.08);
}

.symptom-card__header {
  width: 100%;
  text-align: left;
  padding: 1.15rem;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.symptom-meta-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-tag {
  font-size: 0.65rem;
  font-weight: 850;
  color: #0F766E;
  text-transform: uppercase;
}

.severity-badge {
  font-size: 0.6rem;
  font-weight: 900;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  letter-spacing: 0.04em;
}

.severity-badge--critical {
  background: #FEE2E2;
  color: #991B1B;
  border: 1px solid #FCA5A5;
}

.severity-badge--high {
  background: #FFEDD5;
  color: #9A3412;
  border: 1px solid #FDBA74;
}

.severity-badge--medium {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FDE68A;
}

.severity-badge--low {
  background: #F1F5F9;
  color: #475569;
  border: 1px solid #CBD5E1;
}

.symptom-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.symptom-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
  color: var(--color-ink);
  letter-spacing: -0.02em;
}

.expand-chevron {
  font-size: 0.75rem;
  color: var(--color-asphalt);
}

.symptom-short-desc {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-asphalt);
}

.symptom-card__body {
  padding: 0 1.15rem 1.25rem 1.15rem;
  border-top: 1px solid var(--color-sand);
  display: grid;
  gap: 1rem;
  margin-top: 0.25rem;
  padding-top: 1rem;
}

.detail-section {
  display: grid;
  gap: 0.35rem;
}

.detail-heading {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 850;
  color: var(--color-ink);
}

.detail-list,
.detail-numbered-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.82rem;
  line-height: 1.5;
  color: #334155;
}

.highlight-box {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 0.85rem;
}

.highlight-text {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #1E293B;
  font-weight: 700;
}

.torque-spec {
  font-size: 0.75rem;
  color: #0F766E;
  margin-top: 0.4rem;
  background: #F0FDFA;
  padding: 0.35rem 0.65rem;
  border-radius: 0.4rem;
  border: 1px solid #CCFBF1;
  display: inline-block;
}

.shop-callout {
  background: #FFFBEB;
  border: 1px solid #FEF3C7;
  border-radius: 0.75rem;
  padding: 0.75rem;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #92400E;
}

.shop-callout p {
  margin: 0.2rem 0 0 0;
}
</style>
