<script setup lang="ts">
import { NAVIGATION_ITEMS } from './navigation';

const route = useRoute();
const { user, initialized, refresh } = useAuth();
const { isOnline } = usePwa();

onMounted(async () => {
  if (!initialized.value) await refresh();
});

function isActive(path: string): boolean {
  return path === '/' ? route.path === '/' : route.path.startsWith(path);
}

const userPillName = computed(() => {
  if (!user.value) return 'Account';
  if (user.value.displayName.toLowerCase().includes('demo')) return 'Demo Rider';
  return user.value.displayName.split(' ')[0];
});
</script>

<template>
  <div class="app-root">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <!-- Client-Side PWA Utilities Container -->
    <div class="pwa-teleports">
      <ClientOnly>
        <OfflineBannerClient />
        <PwaInstallPromptClient />
        <template #fallback>
          <div class="pwa-teleports-fallback" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <!-- 100% Full-Bleed Sticky Top App Bar -->
    <header class="site-header">
      <div class="site-header__container">
        <!-- Left: Brand Logo Lockup -->
        <NuxtLink class="brand" to="/" aria-label="GowesKit home">
          <div class="brand__mark-box">
            <svg
              class="brand__mark"
              viewBox="0 0 48 48"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="14" cy="30" r="9" />
              <circle cx="35" cy="30" r="9" />
              <path d="m14 30 8-14 7 14H14Zm8-14h8m-11-4h6" />
            </svg>
          </div>
          <div class="brand__text-group">
            <span class="brand__name">GowesKit</span>
            <span class="brand__tagline">Workshop &amp; Safety</span>
          </div>
        </NuxtLink>

        <!-- Center: Desktop Navigation Bar (Only on screens >= 768px) -->
        <nav class="desktop-nav" aria-label="Desktop primary navigation">
          <NuxtLink
            v-for="item in NAVIGATION_ITEMS"
            :key="item.path"
            class="desktop-nav__link"
            :class="{ 'desktop-nav__link--active': isActive(item.path) }"
            :to="item.path"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Right: Profile / Online Status Pill -->
        <div class="site-header__right">
          <NuxtLink class="header-user-pill" to="/me" aria-label="My Account">
            <ClientOnly>
              <span class="network-dot" :class="{ 'network-dot--offline': !isOnline }" aria-hidden="true" />
              <span class="user-pill-label">{{ userPillName }}</span>
              <span class="user-pill-avatar" aria-hidden="true">
                {{ user ? (user.displayName.charAt(0).toUpperCase()) : '👤' }}
              </span>
              <template #fallback>
                <span class="network-dot" aria-hidden="true" />
                <span class="user-pill-label">Account</span>
                <span class="user-pill-avatar" aria-hidden="true">👤</span>
              </template>
            </ClientOnly>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <div class="app-shell">
      <main id="main-content" class="main-content">
        <NuxtPage />
      </main>
    </div>

    <!-- Mobile-Only Bottom Docked Tab Bar (Hidden on Desktop) -->
    <AppNavigation />
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.pwa-teleports {
  position: relative;
  z-index: 999;
}

.pwa-teleports-fallback {
  display: none;
}

/* 100% Full-Bleed Sticky Top Bar */
.site-header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 40;
  background: rgb(255 253 247 / 85%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgb(23 32 42 / 8%);
  padding-top: var(--safe-top);
  box-shadow: 0 1px 10px rgb(23 32 42 / 3%);
}

.site-header__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3.75rem;
  max-width: 60rem;
  margin: 0 auto;
  padding: 0 1.25rem;
  gap: 1rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: var(--color-ink);
}

.brand__mark-box {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.65rem;
  background: var(--color-chain-lime);
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
}

.brand__mark {
  width: 1.3rem;
  height: 1.3rem;
  fill: none;
  stroke: var(--color-ink);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.5;
}

.brand__text-group {
  display: flex;
  flex-direction: column;
}

.brand__name {
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.brand__tagline {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--color-asphalt);
  letter-spacing: 0.02em;
}

/* Center Desktop Navigation */
.desktop-nav {
  display: none;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.35rem;
  border-radius: 9999px;
  background: rgb(237 228 210 / 40%);
  border: 1px solid rgb(23 32 42 / 6%);
}

@media (min-width: 48rem) {
  .desktop-nav {
    display: flex;
  }
}

.desktop-nav__link {
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  color: var(--color-asphalt);
  font-size: 0.82rem;
  font-weight: 750;
  text-decoration: none;
  transition: color 120ms ease, background-color 120ms ease;
}

.desktop-nav__link:hover {
  color: var(--color-ink);
}

.desktop-nav__link--active {
  color: var(--color-ink);
  background: var(--color-white);
  box-shadow: 0 1px 4px rgb(23 32 42 / 8%);
}

/* User Account Status Pill */
.header-user-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.25rem 0.35rem 0.25rem 0.65rem;
  border: 1.5px solid var(--color-sand);
  border-radius: 9999px;
  background: var(--color-white);
  color: var(--color-ink);
  text-decoration: none;
  font-size: 0.76rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgb(23 32 42 / 6%);
  transition: border-color 120ms ease, transform 120ms ease;
}

.header-user-pill:hover {
  border-color: var(--color-ink);
  transform: translateY(-1px);
}

.network-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #22c55e;
}

.network-dot--offline {
  background: #eab308;
}

.user-pill-label {
  font-weight: 800;
  color: var(--color-ink);
}

.user-pill-avatar {
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: var(--color-sky);
  font-size: 0.72rem;
  font-weight: 900;
}
</style>
