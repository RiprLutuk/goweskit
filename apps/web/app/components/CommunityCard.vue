<script setup lang="ts">
import type { NearbyCommunity, PublicCommunity } from '@goweskit/contracts';

import { formatCommunityDistance } from '../community-display';

const props = defineProps<{ community: NearbyCommunity | PublicCommunity }>();

const distance = computed(() =>
  'distanceMeters' in props.community
    ? formatCommunityDistance(props.community.distanceMeters)
    : null,
);
</script>

<template>
  <NuxtLink
    class="community-card"
    :to="`/community/${community.id}`"
    :aria-label="`View ${community.name} community`"
  >
    <div class="community-card__topline">
      <span class="community-sticker">{{ community.locality }}</span>
      <span v-if="distance" class="community-card__distance">{{
        distance
      }}</span>
    </div>
    <h3>{{ community.name }}</h3>
    <p>{{ community.description }}</p>
    <ul class="community-chip-list" aria-label="Supported bicycle types">
      <li v-for="bikeType in community.bicycleTypes" :key="bikeType">
        {{ bikeType.replaceAll('_', ' ') }}
      </li>
    </ul>
    <div class="community-card__footer">
      <span>{{ community.memberCount }} members</span>
      <span>{{
        community.joinMode === 'open' ? 'Open join' : 'Join by request'
      }}</span>
      <strong>View →</strong>
    </div>
  </NuxtLink>
</template>

<style scoped>
.community-card {
  display: grid;
  padding: 1.2rem;
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  gap: 0.75rem;
  text-decoration: none;
}

.community-card:focus-visible {
  outline: 3px solid var(--color-sky);
  outline-offset: 3px;
}

.community-card__topline,
.community-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.community-sticker {
  padding: 0.35rem 0.55rem;
  border-radius: 0.55rem;
  background: var(--color-sky);
  font-size: 0.72rem;
  font-weight: 850;
}

.community-card__distance {
  color: var(--color-asphalt);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  font-weight: 750;
}

h3 {
  margin: 0.15rem 0 0;
  font-size: 1.3rem;
  letter-spacing: -0.035em;
}

p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-asphalt);
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.community-chip-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  gap: 0.45rem;
  list-style: none;
}

.community-chip-list li {
  padding: 0.3rem 0.5rem;
  border-radius: 0.5rem;
  background: rgb(237 228 210 / 55%);
  font-size: 0.7rem;
  font-weight: 750;
  text-transform: capitalize;
}

.community-card__footer {
  margin-top: 0.2rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-sand);
  color: var(--color-asphalt);
  font-size: 0.75rem;
}

.community-card__footer strong {
  margin-left: auto;
  color: var(--color-ink);
}
</style>
