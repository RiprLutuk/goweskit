<script setup lang="ts">
import type { NearbyEvent, PublicEvent } from '@goweskit/contracts';

import { formatCommunityDistance } from '../community-display';

const props = defineProps<{ event: NearbyEvent | PublicEvent }>();

const distance = computed(() =>
  'distanceMeters' in props.event
    ? formatCommunityDistance(props.event.distanceMeters)
    : null,
);

const startDate = computed(() => new Date(props.event.startsAt));

const monthLabel = computed(() =>
  startDate.value.toLocaleString('id-ID', { month: 'short' }).toUpperCase(),
);

const dayNumber = computed(() => {
  const d = startDate.value.getDate();
  return d < 10 ? `0${d}` : String(d);
});

const dayName = computed(() =>
  startDate.value.toLocaleString('id-ID', { weekday: 'short' }),
);

const timeLabel = computed(() =>
  startDate.value.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }),
);

const difficultyText = computed(() => {
  switch (props.event.difficulty) {
    case 'easy':
      return '🟢 Santai';
    case 'moderate':
      return '🟡 Sedang';
    case 'hard':
      return '🔴 Nanjak';
    default:
      return props.event.difficulty;
  }
});
</script>

<template>
  <NuxtLink class="clean-ride-card" :to="`/community/events/${event.id}`">
    <!-- Left: Compact Minimalist Date Tile -->
    <div class="clean-date-tile" aria-hidden="true">
      <span class="date-month">{{ monthLabel }}</span>
      <span class="date-day">{{ dayNumber }}</span>
      <span class="date-weekday">{{ dayName }}</span>
    </div>

    <!-- Center: Clear Event Details -->
    <div class="clean-card-body">
      <div class="card-topline">
        <span class="community-name">{{ event.community.name }}</span>
        <span v-if="distance" class="dist-tag">📍 {{ distance }}</span>
      </div>

      <h3 class="event-title">{{ event.title }}</h3>

      <p class="event-meta-line">
        <span>⏰ {{ timeLabel }} WIB</span>
        <span class="dot-sep">·</span>
        <span class="meeting-loc">{{ event.meetingArea }}</span>
      </p>

      <div class="event-tags-row">
        <span class="meta-tag meta-tag--diff">{{ difficultyText }}</span>
        <span class="meta-tag">👥 {{ event.participantCount }}{{ event.capacity ? `/${event.capacity}` : '' }} Riders</span>
        <span v-if="event.bicycleTypes.length" class="meta-tag">
          🚲 {{ event.bicycleTypes.slice(0, 2).map((t) => t.replaceAll('_', ' ')).join(', ') }}
        </span>
      </div>
    </div>

    <!-- Right: Subtle Navigation Chevron -->
    <span class="card-chevron" aria-hidden="true">›</span>
  </NuxtLink>
</template>

<style scoped>
.clean-ride-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 8%);
  box-shadow: 0 2px 10px rgb(23 32 42 / 3%);
  text-decoration: none;
  color: inherit;
  transition: transform 90ms ease, box-shadow 90ms ease, border-color 90ms ease;
  position: relative;
}

.clean-ride-card:hover {
  border-color: rgb(23 32 42 / 18%);
  box-shadow: 0 4px 16px rgb(23 32 42 / 6%);
}

.clean-ride-card:active {
  transform: scale(0.985);
}

/* Date Tile */
.clean-date-tile {
  flex: 0 0 3.2rem;
  height: 3.6rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
  gap: 0.15rem;
}

.date-month {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 850;
  color: var(--color-coral);
  letter-spacing: 0.05em;
}

.date-day {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-ink);
  line-height: 1;
}

.date-weekday {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--color-asphalt);
  text-transform: capitalize;
}

/* Card Body */
.clean-card-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}

.card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.community-name {
  font-size: 0.72rem;
  font-weight: 750;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dist-tag {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-ink);
  flex-shrink: 0;
}

.event-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  letter-spacing: -0.015em;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-meta-line {
  margin: 0;
  font-size: 0.74rem;
  color: var(--color-asphalt);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot-sep {
  opacity: 0.4;
}

.meeting-loc {
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-tags-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.15rem;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 0.66rem;
  font-weight: 750;
  padding: 0.12rem 0.45rem;
  border-radius: 0.35rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  color: var(--color-asphalt);
}

.meta-tag--diff {
  color: var(--color-ink);
  font-weight: 800;
}

/* Chevron */
.card-chevron {
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--color-sand);
  line-height: 1;
  flex-shrink: 0;
  padding-left: 0.25rem;
}
</style>
