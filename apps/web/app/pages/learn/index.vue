<script setup lang="ts">
import type {
  BicycleType,
  BicycleTypeListResponse,
  ComponentCategory,
  ComponentCategoryListResponse,
} from '@goweskit/contracts';

const api = useApi();
const bicycleTypes = ref<BicycleType[]>([]);
const componentCategories = ref<ComponentCategory[]>([]);
const loading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  try {
    const [typesResponse, categoriesResponse] = await Promise.all([
      api<BicycleTypeListResponse>('/learn/bicycle-types'),
      api<ComponentCategoryListResponse>('/learn/components'),
    ]);
    bicycleTypes.value = typesResponse.bicycleTypes;
    componentCategories.value = categoriesResponse.componentCategories;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page-stack">
    <header class="page-heading">
      <span class="status-chip status-chip--sky">Learn</span>
      <h1>Start with the kind of bike you ride.</h1>
      <p>
        Plain-language foundations first. Technical details stay available when
        you need them.
      </p>
    </header>

    <p v-if="loading" class="state-card" role="status">
      Loading bicycle basics…
    </p>
    <p
      v-else-if="errorMessage"
      class="state-card state-card--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <template v-else>
      <section aria-labelledby="bike-types-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">First bicycle types</p>
            <h2 id="bike-types-title">Choose a starting point</h2>
          </div>
          <span class="count-chip">{{ bicycleTypes.length }}</span>
        </div>
        <div v-if="bicycleTypes.length" class="card-grid">
          <article
            v-for="bicycleType in bicycleTypes"
            :key="bicycleType.id"
            class="content-card"
          >
            <p class="technical-label">{{ bicycleType.slug }}</p>
            <h3>{{ bicycleType.name }}</h3>
            <p>{{ bicycleType.summary }}</p>
            <dl class="detail-list">
              <div>
                <dt>Good for</dt>
                <dd>{{ bicycleType.typicalUse }}</dd>
              </div>
              <div>
                <dt>Beginner note</dt>
                <dd>{{ bicycleType.beginnerNotes }}</dd>
              </div>
            </dl>
          </article>
        </div>
        <p v-else class="state-card">
          No bicycle types have been published yet.
        </p>
      </section>

      <section aria-labelledby="component-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Bike anatomy</p>
            <h2 id="component-title">Component categories</h2>
          </div>
          <span class="count-chip">{{ componentCategories.length }}</span>
        </div>
        <div class="chip-grid">
          <article
            v-for="category in componentCategories"
            :key="category.id"
            class="part-chip"
          >
            <strong>{{ category.name }}</strong>
            <span>{{ category.description }}</span>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
