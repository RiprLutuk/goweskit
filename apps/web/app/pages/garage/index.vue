<script setup lang="ts">
import type { Bike, BikeListResponse } from '@goweskit/contracts';

const api = useApi();
const { user, initialized, refresh } = useAuth();
const bikes = ref<Bike[]>([]);
const loading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value === null) {
    loading.value = false;
    return;
  }

  try {
    bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page-stack">
    <header class="page-heading page-heading--action">
      <div>
        <span class="status-chip">My Garage</span>
        <h1>Your bikes, including what you don’t know yet.</h1>
        <p>
          Incomplete details are welcome. GowesKit will keep missing standards
          visible.
        </p>
      </div>
      <NuxtLink v-if="user" class="button button--primary" to="/garage/new"
        >Add a bike</NuxtLink
      >
    </header>

    <p v-if="loading" class="state-card" role="status">Opening your Garage…</p>
    <div v-else-if="!user" class="state-card signed-out-state">
      <strong>Sign in to use My Garage.</strong>
      <p>
        Your saved bikes and technical standards are private to your account.
      </p>
      <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
    </div>
    <p
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
    <div v-else-if="bikes.length" class="card-grid">
      <NuxtLink
        v-for="bike in bikes"
        :key="bike.id"
        class="bike-card"
        :to="`/garage/${bike.id}`"
      >
        <span class="bike-card__type">{{ bike.bicycleType.name }}</span>
        <h2>{{ bike.nickname }}</h2>
        <p>
          {{
            [bike.brand, bike.model].filter(Boolean).join(' ') ||
            'Brand and model not recorded'
          }}
        </p>
        <div class="bike-card__footer">
          <span>{{ bike.specs.length }} specs recorded</span>
          <strong>Open bike →</strong>
        </div>
      </NuxtLink>
    </div>
    <div v-else class="state-card empty-garage">
      <span class="empty-garage__wheel" aria-hidden="true">○</span>
      <div>
        <strong>Your Garage is ready for its first bike.</strong>
        <p>Start with a nickname and bike type. Every other field can wait.</p>
      </div>
      <NuxtLink class="button button--primary" to="/garage/new"
        >Add first bike</NuxtLink
      >
    </div>
  </div>
</template>
