<script setup lang="ts">
import type { NearbyEvent, PublicEvent } from '@goweskit/contracts';

import {
  formatCommunityDate,
  formatCommunityDistance,
} from '../community-display';

const props = defineProps<{ event: NearbyEvent | PublicEvent }>();

const distance = computed(() =>
  'distanceMeters' in props.event
    ? formatCommunityDistance(props.event.distanceMeters)
    : null,
);
</script>

<template>
  <NuxtLink class="ride-card" :to="`/community/events/${event.id}`">
    <div class="ride-card__date" aria-hidden="true">
      <span>{{
        new Date(event.startsAt).toLocaleString('en', { month: 'short' })
      }}</span>
      <strong>{{ new Date(event.startsAt).getDate() }}</strong>
    </div>
    <div class="ride-card__body">
      <div class="ride-card__topline">
        <span>{{ event.community.name }}</span>
        <span v-if="distance">{{ distance }}</span>
      </div>
      <h3>{{ event.title }}</h3>
      <p>{{ formatCommunityDate(event.startsAt) }} · {{ event.meetingArea }}</p>
      <div class="ride-card__meta">
        <span>{{ event.difficulty }}</span>
        <span
          >{{ event.participantCount
          }}{{ event.capacity ? `/${event.capacity}` : '' }} riders</span
        >
        <span>{{ event.visibility.replace('_', ' ') }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.ride-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  padding: 1rem;
  border: 1px solid rgb(64 80 95 / 14%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  gap: 0.9rem;
  text-decoration: none;
}

.ride-card:focus-visible {
  outline: 3px solid var(--color-sky);
  outline-offset: 3px;
}

.ride-card__date {
  display: grid;
  width: 3.4rem;
  height: 3.4rem;
  place-content: center;
  border-radius: 0.85rem;
  background: var(--color-coral);
  text-align: center;
}

.ride-card__date span {
  font-size: 0.65rem;
  font-weight: 850;
  text-transform: uppercase;
}

.ride-card__date strong {
  font-size: 1.25rem;
  line-height: 1;
}

.ride-card__body {
  min-width: 0;
}

.ride-card__topline,
.ride-card__meta {
  display: flex;
  flex-wrap: wrap;
  color: var(--color-asphalt);
  font-size: 0.7rem;
  font-weight: 750;
  gap: 0.45rem 0.75rem;
}

.ride-card__topline {
  justify-content: space-between;
}

h3 {
  margin: 0.35rem 0 0.3rem;
  font-size: 1.05rem;
  letter-spacing: -0.025em;
}

p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.78rem;
  line-height: 1.45;
}

.ride-card__meta {
  margin-top: 0.65rem;
}

.ride-card__meta span {
  padding: 0.25rem 0.4rem;
  border-radius: 0.4rem;
  background: rgb(237 228 210 / 55%);
  text-transform: capitalize;
}
</style>
