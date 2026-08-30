<script setup lang="ts">
import type { NearbyCommunity, PublicCommunity } from '@goweskit/contracts';

import { formatCommunityDistance } from '../community-display';

const props = defineProps<{ community: NearbyCommunity | PublicCommunity }>();

const distance = computed(() =>
  'distanceMeters' in props.community
    ? formatCommunityDistance(props.community.distanceMeters)
    : null,
);

const initials = computed(() => {
  const words = props.community.name.split(' ').filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase();
  }
  return props.community.name.slice(0, 2).toUpperCase();
});

const isVerified = computed(() =>
  props.community.verificationStatus === 'staff_verified' ||
  props.community.verificationStatus === 'community_verified',
);
</script>

<template>
  <NuxtLink
    class="clean-community-card"
    :to="`/community/${community.slug || community.id}`"
    :aria-label="`Buka komunitas ${community.name}`"
  >
    <!-- Left: Soft Initial Avatar -->
    <div class="community-avatar" aria-hidden="true">
      {{ initials }}
    </div>

    <!-- Center: Community Content -->
    <div class="clean-card-body">
      <div class="card-title-row">
        <h3 class="community-title">{{ community.name }}</h3>
        <span v-if="isVerified" class="verified-dot" title="Terverifikasi">
          <GIcon name="check" size="xs" color="#15803d" />
        </span>
        <span v-if="distance" class="dist-tag">
          <GIcon name="pin" size="xs" /> {{ distance }}
        </span>
      </div>

      <p class="community-meta-line">
        <span>{{ community.locality }}</span>
        <span class="dot-sep">·</span>
        <span>
          <GIcon name="community" size="xs" /> {{ community.memberCount }} Anggota
        </span>
        <span class="dot-sep">·</span>
        <span>{{ community.joinMode === 'open' ? 'Publik' : 'Privat' }}</span>
      </p>

      <p v-if="community.description" class="community-bio">
        {{ community.description }}
      </p>

      <div v-if="community.bicycleTypes.length" class="bike-pills-row">
        <span
          v-for="bType in community.bicycleTypes.slice(0, 3)"
          :key="bType"
          class="bike-pill"
        >
          {{ bType.replaceAll('_', ' ') }}
        </span>
      </div>
    </div>

    <!-- Right: Subtle Navigation Chevron -->
    <span class="card-chevron" aria-hidden="true">
      <GIcon name="chevron-right" size="xs" color="#94A3B8" />
    </span>
  </NuxtLink>
</template>

<style scoped>
.clean-community-card {
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

.clean-community-card:hover {
  border-color: rgb(23 32 42 / 18%);
  box-shadow: 0 4px 16px rgb(23 32 42 / 6%);
}

.clean-community-card:active {
  transform: scale(0.985);
}

/* Soft Avatar */
.community-avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  color: var(--color-ink);
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  font-weight: 850;
  flex-shrink: 0;
}

/* Body */
.clean-card-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.community-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  letter-spacing: -0.015em;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.verified-dot {
  display: inline-grid;
  place-items: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #dcfce7;
  color: #15803d;
  font-size: 0.62rem;
  font-weight: 900;
  flex-shrink: 0;
}

.dist-tag {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-ink);
  flex-shrink: 0;
}

.community-meta-line {
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

.community-bio {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}

.bike-pills-row {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.2rem;
  flex-wrap: wrap;
}

.bike-pill {
  font-size: 0.64rem;
  font-weight: 750;
  padding: 0.1rem 0.4rem;
  border-radius: 0.35rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  color: var(--color-asphalt);
  text-transform: capitalize;
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
