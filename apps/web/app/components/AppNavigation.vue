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
  <nav class="app-navigation" aria-label="Mobile navigation">
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
            <!-- Native Micro-Animated Icon Container -->
            <span class="app-navigation__icon-box" aria-hidden="true">
              <!-- Home Icon -->
              <svg v-if="item.path === '/'" class="tab-icon" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <!-- Learn Icon -->
              <svg v-else-if="item.path === '/learn'" class="tab-icon" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <!-- Garage Icon -->
              <svg v-else-if="item.path === '/garage'" class="tab-icon" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="5.5" cy="17.5" r="3.5" />
                <circle cx="18.5" cy="17.5" r="3.5" />
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 9l3-3h3l2 4" />
                <path d="M9 9 5.5 17.5" />
              </svg>
              <!-- Explore Icon -->
              <svg v-else-if="item.path === '/explore'" class="tab-icon" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <!-- Me Icon -->
              <svg v-else-if="item.path === '/me'" class="tab-icon" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>

            <span class="app-navigation__label">{{ item.label }}</span>
            <span class="app-navigation__marker" aria-hidden="true" />
          </NuxtLink>

          <span
            v-else
            class="app-navigation__item app-navigation__item--unavailable"
            :aria-label="`${item.label}, coming soon`"
          >
            <span class="app-navigation__icon-box" aria-hidden="true">🔒</span>
            <span class="app-navigation__label">{{ item.label }}</span>
          </span>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.app-navigation {
  position: fixed;
  z-index: 50;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  box-sizing: border-box;
  background: rgb(255 253 247 / 96%);
  border-top: 1px solid rgb(23 32 42 / 12%);
  box-shadow: 0 -4px 25px rgb(23 32 42 / 8%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  user-select: none;
  -webkit-user-select: none;
  /* Baseline 0.75rem (12px) padding on bottom + safe-area insets on notch iPhones */
  padding: 0.5rem 0.5rem max(0.85rem, calc(0.5rem + var(--safe-bottom)));
}

@media (min-width: 48rem) {
  .app-navigation {
    display: none !important;
  }
}

.app-navigation__inner {
  max-width: 32rem;
  margin: 0 auto;
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
  padding: 0.15rem 0;
  gap: 0.2rem;
  border-radius: 0.65rem;
  color: var(--color-asphalt);
  text-decoration: none;
  touch-action: manipulation;
  transition: transform 90ms ease, color 120ms ease;
}

.app-navigation__item:active {
  transform: scale(0.92);
}

.app-navigation__icon-box {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  transition: transform 120ms ease;
}

.tab-icon {
  transition: stroke-width 120ms ease;
}

.app-navigation__item--active {
  color: var(--color-ink);
}

.app-navigation__item--active .app-navigation__icon-box {
  transform: translateY(-1px);
}

.app-navigation__item--active .tab-icon {
  stroke-width: 2.7;
}

.app-navigation__label {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1;
}

.app-navigation__marker {
  width: 0.25rem;
  height: 0.2rem;
  border-radius: 50%;
  background: transparent;
  transition: background-color 150ms ease, width 150ms ease;
}

.app-navigation__item--active .app-navigation__marker {
  width: 0.85rem;
  height: 0.2rem;
  border-radius: 1rem;
  background: var(--color-chain-lime);
  border: 1px solid var(--color-ink);
}
</style>
