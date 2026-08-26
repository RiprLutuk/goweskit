<template>
  <section class="welcome-card" aria-labelledby="welcome-title">
    <span class="status-chip">GowesKit v0.1</span>
    <p class="welcome-card__eyebrow">A fresh start for every rider</p>
    <h1 id="welcome-title">Understand your bike, one part at a time.</h1>
    <p class="welcome-card__summary">
      Learn the language of bicycle parts, save what you know, and keep unknown
      details visible until you can confirm them.
    </p>
    <div class="action-row">
      <NuxtLink class="button button--primary" to="/learn"
        >Explore bike types</NuxtLink
      >
      <NuxtLink class="button button--secondary" to="/register"
        >Create an account</NuxtLink
      >
      <NuxtLink class="button button--secondary" to="/upgrade-lab"
        >Check an upgrade</NuxtLink
      >
    </div>
    <div class="workbench-line" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  </section>
</template>
