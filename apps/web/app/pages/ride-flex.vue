<script setup lang="ts">
import type { Bike, BikeListResponse } from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const { user, initialized, refresh } = useAuth();
const bikes = ref<Bike[]>([]);
const isStudioOpen = ref(true);

const initialDistance = computed(() => Number(route.query.distance) || 45.8);
const initialElevation = computed(() => Number(route.query.elevation) || 580);
const initialDuration = computed(() => Number(route.query.duration) || 105);
const initialNote = computed(() => String(route.query.note || 'Morning Gravel Loop Sentul'));
const initialBike = computed(() => String(route.query.bike || 'Polygon Siskiu T7'));

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value) {
    try {
      bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
    } catch {
      // fallback
    }
  }
});
</script>

<template>
  <div class="ride-flex-page-wrapper">
    <header class="page-header">
      <NuxtLink class="back-link" to="/safety">← Kembali</NuxtLink>
      <div class="header-content">
        <span class="header-badge">✨ AGENTIC AI &amp; STRAVA-STYLE FLEX</span>
        <h1>Ride Flex Studio</h1>
        <p>
          Ubah hasil gowes Anda menjadi poster estetis siap flexing di Instagram Story, WhatsApp Status, dan Strava dengan bantuan kecerdasan buatan (AI).
        </p>
        <button
          type="button"
          class="open-studio-btn"
          @click="isStudioOpen = true"
        >
          <span>📸 Buka Studio Poster &amp; AI Coach</span>
          <span>→</span>
        </button>
      </div>
    </header>

    <!-- Universal Studio Modal -->
    <RideFlexStudioModal
      :is-open="isStudioOpen"
      :initial-distance="initialDistance"
      :initial-elevation="initialElevation"
      :initial-duration-minutes="initialDuration"
      :initial-route-note="initialNote"
      :bike-nickname="initialBike"
      @close="isStudioOpen = false"
    />
  </div>
</template>

<style scoped>
.ride-flex-page-wrapper {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.back-link {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-asphalt);
  text-decoration: none;
  width: fit-content;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(23, 32, 42, 0.04);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.header-badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 900;
  color: #0284C7;
  background: #E0F2FE;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  width: fit-content;
}

.header-content h1 {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 900;
  color: var(--color-ink);
  letter-spacing: -0.03em;
}

.header-content p {
  margin: 0;
  font-size: 0.86rem;
  color: var(--color-asphalt);
  line-height: 1.5;
}

.open-studio-btn {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.85rem;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-size: 0.86rem;
  font-weight: 900;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 3px 0 var(--color-ink);
  cursor: pointer;
  width: fit-content;
  transition: all 100ms ease;
}

.open-studio-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--color-ink);
}
</style>
