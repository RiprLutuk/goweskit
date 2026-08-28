<script setup lang="ts">
import type { Bike, BikeListResponse } from '@goweskit/contracts';

const api = useApi();
const { user, initialized, refresh, login } = useAuth();
const bikes = ref<Bike[]>([]);
const loading = ref(true);
const demoLoggingIn = ref(false);

const activeBike = computed(() => bikes.value[0] ?? null);

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value) {
    try {
      bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
    } catch {
      bikes.value = [];
    }
  }
  loading.value = false;
});

async function quickDemoLogin(): Promise<void> {
  demoLoggingIn.value = true;
  try {
    await login({
      email: 'demo@goweskit.local',
      password: 'GowesKitDemo123!',
    });
    bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
  } catch {
    // fallback
  } finally {
    demoLoggingIn.value = false;
  }
}
</script>

<template>
  <div class="mobile-page-stack home-screen">
    <!-- 1. Hero Greeting Banner (DESIGN_SYSTEM.md Section 12) -->
    <section class="home-greeting-card" aria-labelledby="home-greeting">
      <div class="greeting-badge-row">
        <span class="sticker-chip sticker-chip--lime">GowesKit v0.1</span>
        <span class="sticker-chip sticker-chip--sand">🚴 Workshop Edition</span>
      </div>

      <div class="greeting-copy">
        <h1 id="home-greeting">
          Good morning <span class="wave-emoji" aria-hidden="true">👋</span>
        </h1>
        <p class="greeting-subtitle">
          Which bike are we riding today?
        </p>
      </div>

      <!-- Quick 1-Click Demo Login Banner if Guest -->
      <ClientOnly>
        <div v-if="!user" class="demo-quick-banner">
          <div class="demo-quick-banner__content">
            <span class="demo-badge">QUICK DEMO</span>
            <strong>Explore full workshop with 4 bikes</strong>
          </div>
          <button
            class="button button--primary button--sm"
            type="button"
            :disabled="demoLoggingIn"
            @click="quickDemoLogin"
          >
            {{ demoLoggingIn ? 'Loading…' : '1-Click Sign In' }}
          </button>
        </div>
      </ClientOnly>
    </section>

    <!-- 2. Active Bike Card (Featured Workshop Vehicle) -->
    <section class="workshop-bike-section" aria-labelledby="bike-section-title">
      <div class="section-title-row">
        <span class="technical-label">My Active Bike</span>
        <ClientOnly>
          <NuxtLink v-if="user && bikes.length" class="section-link" to="/garage">
            All Bikes ({{ bikes.length }}) →
          </NuxtLink>
        </ClientOnly>
      </div>

      <ClientOnly>
        <!-- If User has an Active Bike -->
        <article v-if="user && activeBike" class="active-bike-card">
          <div class="active-bike-card__top">
            <span class="bike-type-tag">{{ activeBike.bicycleType.name }}</span>
            <span class="ready-badge">
              <span class="pulse-dot" /> Ready to ride
            </span>
          </div>

          <div class="active-bike-card__info">
            <h2 class="bike-name">{{ activeBike.nickname }}</h2>
            <p class="bike-model">
              {{ [activeBike.brand, activeBike.model, activeBike.modelYear].filter(Boolean).join(' ') || 'Custom Workshop Build' }}
            </p>
          </div>

          <!-- Monospace Technical Standards Summary -->
          <div class="specs-preview-row">
            <span class="spec-tag"><strong>{{ activeBike.specs.length }}</strong> specs recorded</span>
            <span class="spec-tag spec-tag--highlight">100% deterministic</span>
          </div>

          <div class="active-bike-card__actions">
            <NuxtLink class="button button--secondary button--sm" :to="`/garage/${activeBike.id}`">
              Inspect Specs
            </NuxtLink>
            <NuxtLink class="button button--primary button--sm" :to="`/upgrade-lab?bike=${activeBike.id}`">
              Check Upgrade ⚡
            </NuxtLink>
          </div>
        </article>

        <!-- If User is logged in but has no bikes -->
        <article v-else-if="user" class="empty-garage-card">
          <div class="empty-garage-icon">🚲</div>
          <div class="empty-garage-copy">
            <h3>Your garage is ready</h3>
            <p>Add your first bike to verify upgrades and track standards.</p>
          </div>
          <NuxtLink class="button button--primary button--sm" to="/garage/new">
            + Add a Bike
          </NuxtLink>
        </article>

        <!-- Guest State Preview -->
        <article v-else class="guest-preview-card">
          <div class="guest-preview-top">
            <span class="bike-type-tag">MTB Hardtail</span>
            <strong>Si Rimba (29er Boost 148)</strong>
          </div>
          <p class="guest-preview-desc">
            Tapered fork, 12×148 Boost rear axle, 1×12 Shimano Micro Spline.
          </p>
          <div class="guest-preview-actions">
            <NuxtLink class="button button--primary button--sm" to="/garage">
              View Sample Garage
            </NuxtLink>
            <NuxtLink class="button button--secondary button--sm" to="/login">
              Sign In
            </NuxtLink>
          </div>
        </article>

        <template #fallback>
          <article class="guest-preview-card">
            <div class="guest-preview-top">
              <span class="bike-type-tag">MTB Hardtail</span>
              <strong>Si Rimba (29er Boost 148)</strong>
            </div>
            <p class="guest-preview-desc">
              Tapered fork, 12×148 Boost rear axle, 1×12 Shimano Micro Spline.
            </p>
            <div class="guest-preview-actions">
              <NuxtLink class="button button--primary button--sm" to="/garage">
                View Sample Garage
              </NuxtLink>
              <NuxtLink class="button button--secondary button--sm" to="/login">
                Sign In
              </NuxtLink>
            </div>
          </article>
        </template>
      </ClientOnly>
    </section>

    <!-- 3. Primary Mobile 2x2 Feature Grid (Big Tactile Thumb Targets) -->
    <section class="feature-grid-section" aria-label="Core Workshop Tools">
      <div class="section-title-row">
        <span class="technical-label">Workshop Tools</span>
      </div>

      <div class="tactile-grid">
        <!-- Upgrade Lab -->
        <NuxtLink class="tactile-card tactile-card--upgrade" to="/upgrade-lab">
          <div class="tactile-card__icon-box">
            <span>🔬</span>
          </div>
          <div class="tactile-card__content">
            <h3>Upgrade Lab</h3>
            <p>Check candidate parts before buying.</p>
          </div>
          <span class="tactile-card__arrow">→</span>
        </NuxtLink>

        <!-- Learn Anatomy -->
        <NuxtLink class="tactile-card tactile-card--learn" to="/learn">
          <div class="tactile-card__icon-box">
            <span>📖</span>
          </div>
          <div class="tactile-card__content">
            <h3>Learn Anatomy</h3>
            <p>Interactive blueprints &amp; specs guide.</p>
          </div>
          <span class="tactile-card__arrow">→</span>
        </NuxtLink>

        <!-- Ride Safety -->
        <NuxtLink class="tactile-card tactile-card--safety" to="/safety">
          <div class="tactile-card__icon-box">
            <span>🛡️</span>
          </div>
          <div class="tactile-card__content">
            <h3>Ride Safety</h3>
            <p>Solo session check-in &amp; instant SOS.</p>
          </div>
          <span class="tactile-card__arrow">→</span>
        </NuxtLink>

        <!-- Explore Trails -->
        <NuxtLink class="tactile-card tactile-card--explore" to="/explore">
          <div class="tactile-card__icon-box">
            <span>🗺️</span>
          </div>
          <div class="tactile-card__content">
            <h3>Explore Trails</h3>
            <p>Bandung routes &amp; verified shops.</p>
          </div>
          <span class="tactile-card__arrow">→</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 4. Continue Learning (Bite-sized Technical Stickers) -->
    <section class="continue-learning-section" aria-labelledby="learning-section-title">
      <div class="section-title-row">
        <span class="technical-label">Continue Learning</span>
        <NuxtLink class="section-link" to="/learn">All Guides →</NuxtLink>
      </div>

      <div class="learning-horizontal-scroll">
        <!-- Card 1 -->
        <NuxtLink class="knowledge-chip-card" to="/learn/bicycle-types/mtb_hardtail">
          <span class="knowledge-chip-badge">Interactive Blueprint</span>
          <h4>MTB Hardtail Anatomy</h4>
          <p>Explore tapered steerer, Boost axles, and disc calipers.</p>
          <span class="knowledge-chip-link">Launch Diagram →</span>
        </NuxtLink>

        <!-- Card 2 -->
        <NuxtLink class="knowledge-chip-card" to="/learn/bicycle-types/folding">
          <span class="knowledge-chip-badge">Interactive Blueprint</span>
          <h4>Folding Bike Anatomy</h4>
          <p>Master central hinges, 20" wheels, and long seatposts.</p>
          <span class="knowledge-chip-link">Launch Diagram →</span>
        </NuxtLink>

        <!-- Card 3 -->
        <NuxtLink class="knowledge-chip-card" to="/learn">
          <span class="knowledge-chip-badge">Technical FAQ</span>
          <h4>What does Boost mean?</h4>
          <p>15×110 front and 12×148 rear hub spacing explained.</p>
          <span class="knowledge-chip-link">Read Standard →</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 5. Solo Ride Safety Prompt Card -->
    <section class="safety-prompt-card" aria-label="Solo ride safety quick start">
      <div class="safety-prompt-header">
        <span class="safety-shield-icon">🚨</span>
        <div>
          <span class="technical-label">Solo today?</span>
          <h3>Start Ride Safety</h3>
        </div>
      </div>
      <p class="safety-prompt-desc">
        Share your snapshot with one trusted contact via private expiring link. No silent background tracking.
      </p>
      <NuxtLink class="button button--primary button--full" to="/safety">
        Launch Solo Safety Session
      </NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.mobile-page-stack {
  display: grid;
  gap: 1.35rem;
  max-width: 56rem;
  margin: 0 auto 3.5rem;
}

@media (min-width: 48rem) {
  .mobile-page-stack {
    margin: 0 auto 4rem;
    gap: 1.75rem;
  }
}

/* 1. Hero Greeting Card */
.home-greeting-card {
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem 1.35rem;
  border-radius: var(--radius-card);
  border: 1px solid rgb(23 32 42 / 10%);
  background:
    radial-gradient(circle at 90% 15%, rgb(201 243 106 / 45%), transparent 12rem),
    radial-gradient(circle at 10% 90%, rgb(142 221 244 / 30%), transparent 12rem),
    var(--color-white);
  box-shadow: 0 4px 20px rgb(23 32 42 / 4%);
}

.greeting-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.sticker-chip {
  padding: 0.2rem 0.5rem;
  border-radius: 0.45rem;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.sticker-chip--lime {
  background: var(--color-chain-lime);
  color: var(--color-ink);
}

.sticker-chip--sand {
  background: var(--color-sand);
  color: var(--color-asphalt);
}

.greeting-copy h1 {
  margin: 0;
  font-size: clamp(1.6rem, 5vw, 2.2rem);
  line-height: 1.08;
  letter-spacing: -0.035em;
  color: var(--color-ink);
}

.greeting-subtitle {
  margin: 0.3rem 0 0;
  color: var(--color-asphalt);
  font-size: 0.92rem;
  font-weight: 600;
}

.demo-quick-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.35rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.85rem;
  background: rgb(201 243 106 / 25%);
  border: 1px solid rgb(201 243 106 / 80%);
}

.demo-quick-banner__content {
  display: grid;
  gap: 0.1rem;
}

.demo-badge {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 800;
  color: #166534;
}

.demo-quick-banner strong {
  font-size: 0.82rem;
  color: var(--color-ink);
}

/* Section Title Row */
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0 0.15rem;
}

.section-link {
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

/* 2. Active Bike Card */
.active-bike-card {
  display: grid;
  gap: 0.75rem;
  padding: 1.2rem;
  border-radius: var(--radius-card);
  border: 1px solid rgb(23 32 42 / 14%);
  background: var(--color-white);
  box-shadow: 0 6px 24px rgb(23 32 42 / 6%);
}

.active-bike-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bike-type-tag {
  padding: 0.2rem 0.5rem;
  border-radius: 0.45rem;
  background: var(--color-sky);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
}

.ready-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #15803d;
}

.pulse-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #22c55e;
}

.bike-name {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: -0.025em;
}

.bike-model {
  margin: 0.1rem 0 0;
  color: var(--color-asphalt);
  font-size: 0.85rem;
}

.specs-preview-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.spec-tag {
  padding: 0.2rem 0.45rem;
  border-radius: 0.4rem;
  background: rgb(237 228 210 / 45%);
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.spec-tag--highlight {
  background: rgb(201 243 106 / 35%);
  font-weight: 800;
}

.active-bike-card__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.25rem;
  width: 100%;
}

.active-bike-card__actions .button,
.guest-preview-actions .button {
  width: 100%;
  min-width: 0;
  padding: 0.45rem 0.35rem;
  font-size: 0.8rem;
  text-align: center;
}

/* Empty & Guest Bike Cards */
.empty-garage-card,
.guest-preview-card {
  display: grid;
  gap: 0.75rem;
  padding: 1.2rem;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  box-shadow: 0 4px 20px rgb(23 32 42 / 5%);
  width: 100%;
  min-width: 0;
}

.empty-garage-icon {
  font-size: 2rem;
}

.empty-garage-copy h3 {
  margin: 0;
  font-size: 1.1rem;
}

.empty-garage-copy p {
  margin: 0.2rem 0 0;
  color: var(--color-asphalt);
  font-size: 0.84rem;
}

.guest-preview-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.guest-preview-desc {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.84rem;
  line-height: 1.45;
}

.guest-preview-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  width: 100%;
}

/* 3. Tactile 2x2 Feature Grid */
.tactile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  width: 100%;
}

@media (min-width: 48rem) {
  .tactile-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }
}

.tactile-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 7.6rem;
  min-width: 0;
  padding: 0.85rem;
  border-radius: var(--radius-card);
  border: 1px solid rgb(23 32 42 / 10%);
  background: var(--color-white);
  text-decoration: none;
  color: var(--color-ink);
  box-shadow: 0 4px 18px rgb(23 32 42 / 5%);
  overflow: hidden;
  word-break: break-word;
  transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1), border-color 120ms ease;
}

.tactile-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-ink);
}

.tactile-card:active {
  transform: scale(0.96);
}

.tactile-card__icon-box {
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.65rem;
  font-size: 1.15rem;
}

.tactile-card--upgrade .tactile-card__icon-box {
  background: rgb(142 221 244 / 35%);
}

.tactile-card--learn .tactile-card__icon-box {
  background: rgb(201 243 106 / 45%);
}

.tactile-card--safety .tactile-card__icon-box {
  background: rgb(255 140 117 / 35%);
}

.tactile-card--explore .tactile-card__icon-box {
  background: rgb(237 228 210 / 65%);
}

.tactile-card__content h3 {
  margin: 0.5rem 0 0.1rem;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.tactile-card__content p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.72rem;
  line-height: 1.35;
}

.tactile-card__arrow {
  align-self: flex-end;
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--color-ink);
}

/* 4. Continue Learning Horizontal Scroll */
.learning-horizontal-scroll {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 0.25rem 0 0.5rem;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  max-width: 100%;
}

.knowledge-chip-card {
  flex: 0 0 min(15.5rem, 72vw);
  max-width: 75vw;
  min-width: 0;
  scroll-snap-align: start;
  display: grid;
  gap: 0.3rem;
  padding: 1rem;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  color: var(--color-ink);
  text-decoration: none;
  box-shadow: 0 4px 18px rgb(23 32 42 / 5%);
  word-break: break-word;
  transition: border-color 120ms ease;
}

.knowledge-chip-card:hover {
  border-color: var(--color-ink);
}

.knowledge-chip-badge {
  font-family: var(--font-mono);
  font-size: 0.63rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-asphalt);
}

.knowledge-chip-card h4 {
  margin: 0;
  font-size: 1rem;
}

.knowledge-chip-card p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.78rem;
  line-height: 1.38;
}

.knowledge-chip-link {
  margin-top: 0.35rem;
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-ink);
}

/* 5. Solo Safety Prompt Card */
.safety-prompt-card {
  display: grid;
  gap: 0.7rem;
  padding: 1.2rem;
  border-radius: var(--radius-card);
  border: 1px solid rgb(255 140 117 / 40%);
  background: rgb(255 140 117 / 12%);
}

.safety-prompt-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.safety-shield-icon {
  font-size: 1.6rem;
}

.safety-prompt-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.safety-prompt-desc {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.82rem;
  line-height: 1.45;
}

.button--full {
  width: 100%;
}

.button--sm {
  min-height: 2.4rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}
</style>
