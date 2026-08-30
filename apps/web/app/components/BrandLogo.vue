<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    showTagline?: boolean;
    tagline?: string;
    compact?: boolean;
    to?: string;
  }>(),
  {
    size: 'md',
    showTagline: true,
    tagline: 'Workshop & Safety',
    compact: false,
    to: '/',
  },
);
</script>

<template>
  <NuxtLink :to="to" class="brand-lockup" :class="[`brand-lockup--${size}`]" aria-label="GowesKit Home">
    <!-- Pro Cycling Monogram Mark (G + Velocity Wheel + Aero Dart) -->
    <div class="brand-mark-box">
      <svg
        class="brand-mark-svg"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <!-- Dark Superellipse Shield -->
        <rect width="40" height="40" rx="12" class="brand-mark-bg" />
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          class="brand-mark-border"
          stroke-width="1.5"
        />

        <!-- Kinetic Monogram 'G' / Aero Velocity Wheel -->
        <path
          d="M27 15.2C25.3 13.2 22.8 12 20 12C15.0294 12 11 16.0294 11 21C11 25.9706 15.0294 30 20 30C24.4 30 28.1 26.8 28.8 22.5H19"
          class="brand-mark-wheel"
          stroke-width="3.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Forward Speed Arrow / Chainlink Apex -->
        <path
          d="M23 17.5L28.2 22.5L23 27.5"
          class="brand-mark-arrow"
          stroke-width="2.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Precision Center Hub -->
        <circle cx="20" cy="21" r="2.2" class="brand-mark-hub" />
      </svg>
    </div>

    <!-- Wordmark & Cycling Identity Tagline -->
    <div v-if="!compact" class="brand-text">
      <div class="brand-title">
        <span class="brand-title__gowes">Gowes</span><span class="brand-title__kit">Kit</span>
        <span class="brand-title__dot" aria-hidden="true" />
      </div>
      <span v-if="showTagline" class="brand-sub">{{ tagline }}</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  color: var(--color-ink);
  user-select: none;
  transition: opacity 120ms ease, transform 120ms ease;
}

.brand-lockup:active {
  transform: scale(0.98);
}

.brand-mark-box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 0.85rem;
  box-shadow: 0 4px 12px rgb(23 32 42 / 16%);
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.brand-lockup:hover .brand-mark-box {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgb(23 32 42 / 22%);
}

.brand-mark-svg {
  display: block;
}

/* SVG Palette Tokens */
.brand-mark-bg {
  fill: #17202A;
}

.brand-mark-border {
  stroke: #C9F36A;
  stroke-opacity: 0.35;
}

.brand-mark-wheel {
  stroke: #C9F36A;
}

.brand-mark-arrow {
  stroke: #8EDDF4;
}

.brand-mark-hub {
  fill: #FFFFFF;
}

/* Sizing Variants */
.brand-lockup--sm .brand-mark-svg {
  width: 1.85rem;
  height: 1.85rem;
}
.brand-lockup--sm .brand-title {
  font-size: 1rem;
}
.brand-lockup--sm .brand-sub {
  font-size: 0.58rem;
}

.brand-lockup--md .brand-mark-svg {
  width: 2.35rem;
  height: 2.35rem;
}
.brand-lockup--md .brand-title {
  font-size: 1.22rem;
}
.brand-lockup--md .brand-sub {
  font-size: 0.64rem;
}

.brand-lockup--lg .brand-mark-svg {
  width: 3rem;
  height: 3rem;
}
.brand-lockup--lg .brand-title {
  font-size: 1.55rem;
}
.brand-lockup--lg .brand-sub {
  font-size: 0.72rem;
}

/* Typography & Wordmark */
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
  gap: 0.15rem;
}

.brand-title {
  display: inline-flex;
  align-items: baseline;
  font-family: var(--font-heading);
  font-weight: 900;
  letter-spacing: -0.04em;
  color: var(--color-ink);
}

.brand-title__gowes {
  color: #17202A;
}

.brand-title__kit {
  color: #0F766E;
  margin-left: 0.05em;
  position: relative;
}

.brand-title__dot {
  display: inline-block;
  width: 0.35em;
  height: 0.35em;
  border-radius: 9999px;
  background: #C9F36A;
  border: 1px solid #17202A;
  margin-left: 0.15em;
  transform: translateY(-0.05em);
}

.brand-sub {
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748B;
  font-family: var(--font-heading);
}
</style>
