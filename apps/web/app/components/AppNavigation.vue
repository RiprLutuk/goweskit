<script setup lang="ts">
import { NAVIGATION_ITEMS } from '../navigation';

const route = useRoute();

function isActive(path: string): boolean {
  return path === '/' ? route.path === '/' : route.path.startsWith(path);
}
</script>

<template>
  <nav class="app-navigation" aria-label="Primary navigation">
    <ul class="app-navigation__list">
      <li v-for="item in NAVIGATION_ITEMS" :key="item.path">
        <NuxtLink
          v-if="item.available"
          class="app-navigation__item"
          :class="{ 'app-navigation__item--active': isActive(item.path) }"
          :to="item.path"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <span class="app-navigation__marker" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
        <span
          v-else
          class="app-navigation__item app-navigation__item--unavailable"
          :aria-label="`${item.label}, coming soon`"
        >
          <span class="app-navigation__marker" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </span>
      </li>
    </ul>
  </nav>
</template>
