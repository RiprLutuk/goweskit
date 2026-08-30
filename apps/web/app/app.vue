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
  if (!user.value) return 'Sign In';
  return user.value.displayName.split(' ')[0];
});
</script>

<template>
  <div class="app-root">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <!-- Client-Side PWA Utilities Container -->
    <div class="pwa-teleports">
      <ClientOnly>
        <OfflineBanner />
        <PwaInstallPrompt />
        <template #fallback>
          <div class="pwa-teleports-fallback" aria-hidden="true" />
        </template>
      </ClientOnly>
    </div>

    <!-- 100% Full-Bleed Sticky Top App Bar (Hidden on /explore and /ride-flex for full-screen experience) -->
    <header v-if="!route.path.startsWith('/explore') && !route.path.startsWith('/ride-flex')" class="site-header">
      <div class="site-header__container">
        <!-- Left: Pro Cycling Brand Lockup -->
        <BrandLogo />

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
    <div class="app-shell" :class="{ 'app-shell--explore': route.path.startsWith('/explore'), 'app-shell--ride-flex': route.path.startsWith('/ride-flex') }">
      <main id="main-content" class="main-content" :class="{ 'main-content--explore': route.path.startsWith('/explore'), 'main-content--ride-flex': route.path.startsWith('/ride-flex') }">
        <NuxtPage />
      </main>
    </div>

    <!-- Mobile-Only Bottom Docked Tab Bar (Hidden on Desktop, /explore, and /ride-flex) -->
    <AppNavigation v-if="!route.path.startsWith('/ride-flex')" />
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

.app-shell--explore,
.app-shell--ride-flex {
  max-width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

.main-content--explore,
.main-content--ride-flex {
  padding-top: 0 !important;
  min-height: 100vh;
  min-height: 100dvh;
}
</style>
