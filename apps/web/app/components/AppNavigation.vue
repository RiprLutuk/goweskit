<script setup lang="ts">
import { NAVIGATION_ITEMS } from '../navigation';

const route = useRoute();
const { triggerHaptic } = usePwa();

function isActive(path: string): boolean {
  return path === '/' ? route.path === '/' : route.path.startsWith(path);
}

function handleTabClick(): void {
  triggerHaptic(10);
}
</script>

<template>
  <nav class="app-navigation" aria-label="Navigasi aplikasi">
    <div class="app-navigation__inner">
      <ul class="app-navigation__list">
        <li v-for="item in NAVIGATION_ITEMS" :key="item.path" class="app-navigation__li">
          <NuxtLink
            v-if="item.available"
            class="app-navigation__item"
            :class="{ 'app-navigation__item--active': isActive(item.path) }"
            :to="item.path"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            @click="handleTabClick"
          >
            <!-- Clean Minimalist Cycling Icon -->
            <div class="app-navigation__icon-box" aria-hidden="true">
              <!-- 1. Home / Ride: Clean Minimalist Road Bike -->
              <svg
                v-if="item.path === '/'"
                class="tab-icon"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="5.5" cy="16.5" r="3.5" />
                <circle cx="18.5" cy="16.5" r="3.5" />
                <circle cx="11.5" cy="16.5" r="1.5" />
                <path d="M5.5 16.5L10 9h4.5l4 7.5" />
                <path d="M10 9l1.5 7.5h7" />
                <path d="M10 9L8.5 6.5h2.5" />
                <path d="M14.5 9l1-2.5h2.2" />
              </svg>

              <!-- 2. Learn: Clean Handbook / Spec Guide -->
              <svg
                v-else-if="item.path === '/learn'"
                class="tab-icon"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="M6 14h6" />
              </svg>

              <!-- 3. Garage: Clean Bike Workshop Stand / Frame -->
              <svg
                v-else-if="item.path === '/garage'"
                class="tab-icon"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <!-- Double Wheels -->
                <circle cx="6" cy="16" r="3.5" />
                <circle cx="18" cy="16" r="3.5" />
                <!-- Frame & Seat -->
                <path d="M6 16l4-7h4l4 7" />
                <path d="M10 9l2 7h6" />
                <path d="M10 9L8.5 6h3" />
                <path d="M14 9l1-2.5h2" />
                <!-- Tool/Service Accent -->
                <path d="M12 2v3" />
              </svg>

              <!-- 4. Explore: Clean Compass & Route Waypoint -->
              <svg
                v-else-if="item.path === '/explore'"
                class="tab-icon"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <polygon points="16 8 13.5 13.5 8 16 10.5 10.5 16 8" />
              </svg>

              <!-- 5. Me: Clean Rider Profile with Helmet -->
              <svg
                v-else-if="item.path === '/me'"
                class="tab-icon"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M19 21v-1a5 5 0 0 0-5-5h-4a5 5 0 0 0-5 5v1" />
                <!-- Helmet & Visor -->
                <circle cx="12" cy="8" r="4" />
                <path d="M8 8.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
              </svg>
            </div>

            <!-- Clean Titlecase Label -->
            <span class="app-navigation__label">{{ item.label }}</span>

            <!-- Minimalist Active Accent Bar -->
            <span class="app-navigation__active-bar" aria-hidden="true" />
          </NuxtLink>

          <span
            v-else
            class="app-navigation__item app-navigation__item--unavailable"
            :aria-label="`${item.label}, segera hadir`"
          >
            <div class="app-navigation__icon-box" aria-hidden="true">🔒</div>
            <span class="app-navigation__label">{{ item.label }}</span>
          </span>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   CLEAN, FRESH, ELEGANT CYCLING TAB BAR (APPLE & STRAVA NATIVE)
   ═══════════════════════════════════════════════════════════════ */
.app-navigation {
  position: fixed;
  z-index: 50;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  box-sizing: border-box;
  background: rgb(255 253 247 / 94%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgb(23 32 42 / 8%);
  box-shadow: 0 -2px 16px rgb(23 32 42 / 4%);
  user-select: none;
  -webkit-user-select: none;
  /* Safe-area insets for notched iPhones / Android gesture bars */
  padding: 0.35rem 0.5rem max(0.55rem, calc(0.35rem + var(--safe-bottom)));
}

@media (min-width: 48rem) {
  .app-navigation {
    display: none !important;
  }
}

.app-navigation__inner {
  max-width: 32rem;
  margin: 0 auto;
  width: 100%;
}

.app-navigation__list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin: 0;
  padding: 0;
  list-style: none;
  align-items: center;
}

.app-navigation__li {
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-navigation__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.2rem 0;
  gap: 0.15rem;
  color: var(--color-asphalt);
  text-decoration: none;
  touch-action: manipulation;
  transition: transform 90ms ease, color 120ms ease;
  position: relative;
}

.app-navigation__item:active {
  transform: scale(0.92);
}

.app-navigation__icon-box {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.5rem;
  transition: transform 120ms ease;
}

.tab-icon {
  transition: stroke-width 120ms ease, transform 120ms ease;
}

.app-navigation__label {
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 650;
  line-height: 1.1;
  text-align: center;
  color: var(--color-asphalt);
  transition: color 120ms ease, font-weight 120ms ease;
}

/* Minimalist Clean Active Bar Indicator */
.app-navigation__active-bar {
  width: 0;
  height: 3px;
  border-radius: 9999px;
  background: transparent;
  transition: width 150ms ease, background-color 150ms ease;
  margin-top: 1px;
}

/* ═══════════════════════════════════════════════════════════════
   CLEAN ACTIVE STATE (INK COLOR + ACCENT BAR)
   ═══════════════════════════════════════════════════════════════ */
.app-navigation__item--active {
  color: var(--color-ink);
}

.app-navigation__item--active .app-navigation__icon-box {
  transform: translateY(-1px);
}

.app-navigation__item--active .tab-icon {
  stroke: var(--color-ink);
  stroke-width: 2.3;
}

.app-navigation__item--active .app-navigation__label {
  font-weight: 850;
  color: var(--color-ink);
}

.app-navigation__item--active .app-navigation__active-bar {
  width: 1.1rem;
  background: var(--color-chain-lime);
  border: 1px solid var(--color-ink);
}

.app-navigation__item--unavailable {
  opacity: 0.35;
}
</style>
