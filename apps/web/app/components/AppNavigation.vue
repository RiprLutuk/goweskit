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
        <li
          v-for="item in NAVIGATION_ITEMS"
          :key="item.path"
          class="app-navigation__li"
        >
          <NuxtLink
            v-if="item.available"
            class="app-navigation__item"
            :class="{ 'app-navigation__item--active': isActive(item.path) }"
            :to="item.path"
            :aria-current="isActive(item.path) ? 'page' : undefined"
            @click="handleTabClick"
          >
            <!-- Clean Signature Cycling Icon -->
            <div class="app-navigation__icon-box" aria-hidden="true">
              <GIcon
                v-if="item.path === '/'"
                name="bike"
                size="md"
                class="tab-icon"
              />
              <GIcon
                v-else-if="item.path === '/learn'"
                name="passport"
                size="md"
                class="tab-icon"
              />
              <GIcon
                v-else-if="item.path === '/garage'"
                name="wrench"
                size="md"
                class="tab-icon"
              />
              <GIcon
                v-else-if="item.path === '/explore'"
                name="route"
                size="md"
                class="tab-icon"
              />
              <GIcon
                v-else-if="item.path === '/me'"
                name="community"
                size="md"
                class="tab-icon"
              />
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
  transition:
    transform 90ms ease,
    color 120ms ease;
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
  transition:
    stroke-width 120ms ease,
    transform 120ms ease;
}

.app-navigation__label {
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 650;
  line-height: 1.1;
  text-align: center;
  color: var(--color-asphalt);
  transition:
    color 120ms ease,
    font-weight 120ms ease;
}

/* Minimalist Clean Active Bar Indicator */
.app-navigation__active-bar {
  width: 0;
  height: 3px;
  border-radius: 9999px;
  background: transparent;
  transition:
    width 150ms ease,
    background-color 150ms ease;
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
