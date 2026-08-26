<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header class="site-header">
      <NuxtLink class="brand" to="/" aria-label="GowesKit home">
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
        <span>GowesKit</span>
      </NuxtLink>
      <NuxtLink class="site-header__note" to="/me">My account</NuxtLink>
    </header>

    <main id="main-content" class="main-content">
      <NuxtPage />
    </main>

    <AppNavigation />
  </div>
</template>
