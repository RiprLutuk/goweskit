<script setup lang="ts">
import type { ContributorReputationLevel, ContributorReputationResponse } from '@goweskit/contracts';

const api = useApi();
const { user, initialized, refresh } = useAuth();
const response = ref<ContributorReputationResponse | null>(null);
const loading = ref(true);
const errorMessage = ref('');

const LEVEL_CONFIG: Record<
  ContributorReputationLevel,
  { label: string; tier: string; color: string; desc: string; nextScore: number }
> = {
  new_contributor: {
    label: 'Goweser Baru',
    tier: 'Tier 1 · Starter',
    color: '#64748B',
    desc: 'Baru memulai perjalanan kontribusi di ekosistem GowesKit.',
    nextScore: 20,
  },
  contributor: {
    label: 'Kontributor Aktif',
    tier: 'Tier 2 · Enthusiast',
    color: '#0F766E',
    desc: 'Rutin memimpin atau menyelesaikan rute gowes bersama.',
    nextScore: 50,
  },
  trusted_contributor: {
    label: 'Kapten Terpercaya',
    tier: 'Tier 3 · Peloton Leader',
    color: '#15803D',
    desc: 'Pilar utama komunitas dengan rekam jejak mabar dan moderasi terverifikasi.',
    nextScore: 100,
  },
};

const currentLevelConfig = computed(() => {
  if (!response.value) return LEVEL_CONFIG.new_contributor;
  return LEVEL_CONFIG[response.value.reputation.level] ?? LEVEL_CONFIG.new_contributor;
});

const progressPercent = computed(() => {
  if (!response.value) return 0;
  const score = response.value.reputation.score;
  const max = currentLevelConfig.value.nextScore;
  return Math.min(100, Math.round((score / max) * 100));
});

async function loadReputation(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (!initialized.value) await refresh();
    if (!user.value) return;
    response.value = await api<ContributorReputationResponse>(
      '/community/reputation/me',
    );
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(loadReputation);
</script>

<template>
  <div class="page-stack reputation-page">
    <!-- Breadcrumbs Navigation -->
    <nav aria-label="Navigasi Halaman">
      <NuxtLink class="back-link" to="/community">
        <GIcon name="chevron-left" size="xs" />
        <span>Direktori Komunitas</span>
      </NuxtLink>
    </nav>

    <!-- Hero Header -->
    <header class="reputation-hero">
      <div class="hero-topline">
        <span class="eyebrow-pill">
          <GIcon name="trophy" size="xs" color="#EAB308" filled />
          <span>REPUTASI &amp; KONTRIBUSI</span>
        </span>
      </div>
      <h1 class="page-title">Poin Kontribusi Komunitas</h1>
      <p class="page-desc">
        Poin GowesKit dibangun murni dari aksi nyata di jalan: memimpin mabar, menyelesaikan rute bersama, dan menjaga keamanan komunitas.
      </p>
    </header>

    <!-- Skeleton Loading Shimmer -->
    <div v-if="loading" class="reputation-skeleton-stack">
      <div class="skeleton-shimmer score-skeleton-card" />
      <div class="grid-skeleton-row">
        <div v-for="i in 3" :key="i" class="skeleton-shimmer metric-skeleton-card" />
      </div>
    </div>

    <!-- Signed-out Guest Callout -->
    <section
      v-else-if="!user"
      class="reputation-guest-card"
      aria-labelledby="reputation-sign-in-title"
    >
      <div class="guest-icon-box">
        <GIcon name="community" size="xl" color="#0F766E" />
      </div>
      <div class="guest-content">
        <h2 id="reputation-sign-in-title">Masuk untuk Melihat Reputasi Anda</h2>
        <p>Rekam jejak kontribusi tersimpan secara aman di akun pribadi Anda.</p>
        <NuxtLink class="button button--primary" to="/login">
          <span>Masuk ke Akun</span>
          <span>→</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Error State -->
    <div
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
      <button
        class="button button--secondary"
        type="button"
        @click="loadReputation"
      >
        Coba Lagi
      </button>
    </div>

    <!-- Authenticated User Content -->
    <template v-else-if="response">
      <!-- Main Reputation Level Hero Card -->
      <section class="reputation-card" aria-labelledby="reputation-level-title">
        <div class="score-circle-box">
          <div class="score-ring">
            <span class="score-number font-mono">{{ response.reputation.score }}</span>
            <span class="score-label">POIN</span>
          </div>
        </div>

        <div class="level-details">
          <div class="level-badge-row">
            <span class="tier-pill">{{ currentLevelConfig.tier }}</span>
          </div>
          <h2 id="reputation-level-title" class="level-title">
            {{ currentLevelConfig.label }}
          </h2>
          <p class="level-desc">
            {{ currentLevelConfig.desc }}
          </p>

          <!-- Progress Bar to Next Tier -->
          <div class="tier-progress-box">
            <div class="progress-labels">
              <span>Progres Tier</span>
              <span class="font-mono">{{ response.reputation.score }} / {{ currentLevelConfig.nextScore }} Poin</span>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Transparent Point Inputs Grid -->
      <section class="metrics-section" aria-labelledby="reputation-inputs-title">
        <div class="section-header">
          <div>
            <span class="section-eyebrow">METRIK TRANSPARAN</span>
            <h2 id="reputation-inputs-title" class="section-title">
              Sumber Perolehan Poin
            </h2>
          </div>
        </div>

        <div class="metrics-grid">
          <!-- Metric 1: Hosted Rides -->
          <article class="metric-card">
            <div class="metric-top">
              <div class="metric-icon-box metric-icon-box--green">
                <GIcon name="flag" size="sm" color="#15803D" />
              </div>
              <span class="point-rate-badge">+2 Poin</span>
            </div>
            <div class="metric-value font-mono">{{ response.reputation.hostedEvents }}</div>
            <h3 class="metric-label">Gowes yang Dipimpin</h3>
            <p class="metric-sub">Penyelenggaraan event mabar publik.</p>
          </article>

          <!-- Metric 2: Completed Rides -->
          <article class="metric-card">
            <div class="metric-top">
              <div class="metric-icon-box metric-icon-box--blue">
                <GIcon name="bike" size="sm" color="#0284C7" />
              </div>
              <span class="point-rate-badge">+5 Poin</span>
            </div>
            <div class="metric-value font-mono">{{ response.reputation.completedEvents }}</div>
            <h3 class="metric-label">Gowes Diselesaikan</h3>
            <p class="metric-sub">Kehadiran dan penyelesaian rute mabar.</p>
          </article>

          <!-- Metric 3: Moderation -->
          <article class="metric-card">
            <div class="metric-top">
              <div class="metric-icon-box metric-icon-box--amber">
                <GIcon name="shield" size="sm" color="#D97706" filled />
              </div>
              <span class="point-rate-badge">+1 Poin</span>
            </div>
            <div class="metric-value font-mono">{{ response.reputation.moderationDecisions }}</div>
            <h3 class="metric-label">Moderasi Komunitas</h3>
            <p class="metric-sub">Pemeriksaan &amp; persetujuan anggota.</p>
          </article>
        </div>
      </section>

      <!-- Integrity Notice -->
      <aside class="integrity-banner">
        <div class="integrity-icon">
          <GIcon name="shield" size="md" color="#0F766E" filled />
        </div>
        <div class="integrity-text">
          <strong>Sistem Terbuka &amp; Anti-Spam</strong>
          <p>
            Reputasi GowesKit tidak dapat dibeli atau dimanipulasi dengan bot. Metrik ini murni mencerminkan partisipasi aktif goweser untuk menciptakan rasa saling percaya saat mabar.
          </p>
        </div>
      </aside>
    </template>
  </div>
</template>

<style scoped>
.reputation-page {
  display: grid;
  gap: 1.25rem;
  padding-bottom: 3.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-asphalt);
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
  transition: color 120ms ease;
}

.back-link:hover {
  color: var(--color-ink);
}

/* ── Hero Header ─────────────────────────────────────────── */
.reputation-hero {
  display: grid;
  gap: 0.4rem;
}

.eyebrow-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background: var(--color-sand);
  font-size: 0.72rem;
  font-weight: 850;
  color: var(--color-ink);
}

.page-title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.page-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-asphalt);
  line-height: 1.5;
}

/* ── Skeleton Loading ────────────────────────────────────── */
.reputation-skeleton-stack {
  display: grid;
  gap: 1rem;
}

.score-skeleton-card {
  width: 100%;
  height: 11rem;
  border-radius: 1.25rem;
}

.grid-skeleton-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.metric-skeleton-card {
  height: 8rem;
  border-radius: 1rem;
}

/* ── Guest Card ─────────────────────────────────────────── */
.reputation-guest-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 16px rgb(23 32 42 / 6%);
}

.guest-icon-box {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 1rem;
  background: rgba(15, 118, 110, 0.1);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.guest-content h2 {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-ink);
}

.guest-content p {
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  color: var(--color-asphalt);
}

/* ── Main Reputation Hero Card ───────────────────────────── */
.reputation-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 1.35rem;
  background: linear-gradient(135deg, rgba(201, 243, 106, 0.22), #FFFFFF 65%);
  border: 1.5px solid rgba(23, 32 42, 0.08);
  box-shadow: 0 8px 24px rgb(23 32 42 / 6%);
}

.score-circle-box {
  display: flex;
  justify-content: center;
}

.score-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 6.5rem;
  height: 6.5rem;
  border-radius: 50%;
  background: #FFFFFF;
  border: 4px solid var(--color-chain-lime);
  box-shadow: 0 6px 20px rgb(201 243 106 / 35%);
  line-height: 1;
}

.score-number {
  font-size: 1.85rem;
  font-weight: 900;
  color: var(--color-ink);
}

.score-label {
  font-size: 0.62rem;
  font-weight: 850;
  color: #64748B;
  letter-spacing: 0.06em;
  margin-top: 0.2rem;
}

.level-details {
  display: grid;
  gap: 0.35rem;
}

.tier-pill {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0F766E;
  background: rgba(15, 118, 110, 0.12);
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.level-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.level-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.tier-progress-box {
  margin-top: 0.5rem;
  display: grid;
  gap: 0.3rem;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 750;
  color: var(--color-asphalt);
}

.progress-track {
  height: 0.45rem;
  border-radius: 9999px;
  background: rgba(23, 32, 42, 0.08);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #15803D;
  border-radius: 9999px;
  transition: width 300ms ease;
}

/* ── Metrics Grid ────────────────────────────────────────── */
.metrics-section {
  display: grid;
  gap: 0.75rem;
}

.section-eyebrow {
  font-size: 0.7rem;
  font-weight: 850;
  color: var(--color-asphalt);
  letter-spacing: 0.05em;
}

.section-title {
  margin: 0.1rem 0 0;
  font-size: 1.15rem;
  font-weight: 850;
  color: var(--color-ink);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.metric-card {
  padding: 1.15rem;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 2px 8px rgb(23 32 42 / 4%);
  display: flex;
  flex-direction: column;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.metric-icon-box {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.65rem;
  display: grid;
  place-items: center;
}

.metric-icon-box--green {
  background: rgba(21, 128, 61, 0.12);
}

.metric-icon-box--blue {
  background: rgba(2, 132, 199, 0.12);
}

.metric-icon-box--amber {
  background: rgba(217, 119, 6, 0.12);
}

.point-rate-badge {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  background: var(--color-sand);
  color: var(--color-ink);
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 900;
  color: var(--color-ink);
  line-height: 1.1;
}

.metric-label {
  margin: 0.25rem 0 0.15rem;
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--color-ink);
}

.metric-sub {
  margin: 0;
  font-size: 0.74rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

/* ── Integrity Notice ────────────────────────────────────── */
.integrity-banner {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  padding: 1.15rem;
  border-radius: 1.15rem;
  background: rgba(15, 118, 110, 0.08);
  border: 1px solid rgba(15, 118, 110, 0.18);
}

.integrity-icon {
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.integrity-text strong {
  display: block;
  font-size: 0.85rem;
  font-weight: 850;
  color: #0F766E;
  margin-bottom: 0.2rem;
}

.integrity-text p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-ink);
  line-height: 1.45;
}

@media (max-width: 480px) {
  .reputation-card {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 1rem;
  }
  .progress-labels {
    text-align: left;
  }
}
</style>
