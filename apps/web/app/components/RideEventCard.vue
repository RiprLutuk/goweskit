<script setup lang="ts">
import type { NearbyEvent, PublicEvent } from '@goweskit/contracts';
import { formatCommunityDistance } from '../community-display';

const props = defineProps<{ event: NearbyEvent | PublicEvent }>();

const { isReminderActive, toggleReminder, getCountdownText } = useEventReminder();

const distance = computed(() =>
  'distanceMeters' in props.event
    ? formatCommunityDistance(props.event.distanceMeters)
    : null,
);

const startDate = computed(() => new Date(props.event.startsAt));

const countdown = computed(() => getCountdownText(props.event.startsAt));

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
      return 'Santai';
    case 'moderate':
      return 'Sedang';
    case 'hard':
      return 'Nanjak';
    default:
      return props.event.difficulty;
  }
});
</script>

<template>
  <NuxtLink class="clean-ride-card" :to="`/community/events/${event.slug || event.id}`">
    <!-- Left: Compact Date Box -->
    <div class="card-date-badge" aria-hidden="true">
      <span class="badge-month">{{ monthLabel }}</span>
      <span class="badge-day">{{ dayNumber }}</span>
      <span class="badge-dayname">{{ dayName }}</span>
    </div>

    <!-- Right: Complete Event Details -->
    <div class="card-main">
      <!-- Top Row: Community Name + Reminder Button -->
      <div class="card-top-row">
        <div class="community-info">
          <span class="card-community">{{ event.community.name }}</span>
          <span v-if="distance" class="card-dist">
            <GIcon name="pin" size="xs" />
            <span>{{ distance }}</span>
          </span>
        </div>

        <div class="card-action-slot" @click.prevent.stop>
          <button
            v-if="!countdown.isPast"
            class="reminder-pill"
            :class="{ 'reminder-pill--active': isReminderActive(event.id) }"
            type="button"
            :title="isReminderActive(event.id) ? 'Pengingat Aktif (Klik untuk mematikan)' : 'Pasang Pengingat Jadwal'"
            @click="toggleReminder(event)"
          >
            <GIcon
              name="bell"
              size="xs"
              :filled="isReminderActive(event.id)"
              :color="isReminderActive(event.id) ? '#15803D' : '#64748B'"
            />
            <span>{{ isReminderActive(event.id) ? 'Aktif' : countdown.label }}</span>
          </button>
          <span v-else class="past-pill">Selesai</span>
        </div>
      </div>

      <!-- Title: Wraps gracefully without ugly truncation -->
      <h3 class="card-title">{{ event.title }}</h3>

      <!-- Time & Location Details: Flex Wrap prevents cutting text -->
      <div class="card-time-loc-row">
        <span class="detail-tag">
          <GIcon name="history" size="xs" />
          <span>{{ timeLabel }} WIB</span>
        </span>
        <span class="detail-dot">·</span>
        <span class="detail-tag">
          <GIcon name="pin" size="xs" color="#EF4444" />
          <span>{{ event.meetingArea }}</span>
        </span>
      </div>

      <!-- Category & Participant Chips -->
      <div class="card-pills-row">
        <span class="spec-pill spec-pill--diff">
          <GIcon :name="event.difficulty === 'hard' ? 'mountain' : 'route'" size="xs" />
          <span>{{ difficultyText }}</span>
        </span>
        <span class="spec-pill">
          <GIcon name="users" size="xs" />
          <span>{{ event.participantCount }}{{ event.capacity ? `/${event.capacity}` : '' }} Riders</span>
        </span>
        <span v-if="event.bicycleTypes.length" class="spec-pill">
          <GIcon name="bike" size="xs" />
          <span>{{ event.bicycleTypes.slice(0, 2).map((t) => t.replaceAll('_', ' ')).join(', ') }}</span>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.clean-ride-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.95rem 1.1rem;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
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
  transform: scale(0.99);
}

/* Date Badge */
.card-date-badge {
  width: 3.2rem;
  padding: 0.45rem 0.2rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.05rem;
  flex-shrink: 0;
  text-align: center;
}

.badge-month {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: var(--color-coral);
  letter-spacing: 0.04em;
  line-height: 1;
}

.badge-day {
  font-family: var(--font-mono);
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--color-ink);
  line-height: 1.1;
}

.badge-dayname {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--color-asphalt);
  text-transform: capitalize;
  line-height: 1;
}

/* Main Content Area */
.card-main {
  flex: 1;
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.community-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  min-width: 0;
}

.card-community {
  font-weight: 750;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-dist {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-family: var(--font-mono);
  font-weight: 800;
  color: var(--color-ink);
  flex-shrink: 0;
}

.card-action-slot {
  flex-shrink: 0;
}

.reminder-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-asphalt);
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  padding: 0.18rem 0.5rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.reminder-pill:hover {
  background: var(--color-sand);
}

.reminder-pill--active {
  background: rgba(22, 163, 74, 0.1);
  color: #15803D;
  border-color: rgba(22, 163, 74, 0.3);
}

.past-pill {
  font-size: 0.66rem;
  font-weight: 750;
  color: #94A3B8;
  background: var(--color-canvas);
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.card-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 850;
  color: var(--color-ink);
  line-height: 1.3;
  word-break: break-word;
}

.card-time-loc-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  color: var(--color-asphalt);
  flex-wrap: wrap;
}

.detail-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.detail-dot {
  opacity: 0.4;
}

.card-pills-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 0.1rem;
}

.spec-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.66rem;
  font-weight: 750;
  color: var(--color-asphalt);
  background: var(--color-canvas);
  padding: 0.12rem 0.45rem;
  border-radius: 0.35rem;
  border: 1px solid var(--color-sand);
}

.spec-pill--diff {
  color: var(--color-ink);
  font-weight: 800;
}
</style>
