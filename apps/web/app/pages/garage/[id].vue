<script setup lang="ts">
import {
  BIKE_SPEC_DEFINITIONS,
  type BikeSpecCode,
} from '@goweskit/bike-domain';
import type { Bike, BikeResponse, BikeSpecResponse } from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const { user, initialized, refresh } = useAuth();
const bike = ref<Bike | null>(null);
const loading = ref(true);
const savingCode = ref<BikeSpecCode | null>(null);
const errorMessage = ref('');
const selections = reactive<Record<string, string>>({});

const bikeId = computed(() => String(route.params.id));

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value === null) {
    loading.value = false;
    return;
  }
  await loadBike();
});

async function loadBike(): Promise<void> {
  try {
    bike.value = (await api<BikeResponse>(`/bikes/${bikeId.value}`)).bike;
    for (const definition of BIKE_SPEC_DEFINITIONS) {
      const spec = bike.value.specs.find(
        ({ standardCode }) => standardCode === definition.code,
      );
      selections[definition.code] =
        spec === undefined
          ? 'missing'
          : spec.knowledge === 'unknown'
            ? 'unknown'
            : (spec.value ?? 'missing');
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function saveSpec(code: BikeSpecCode): Promise<void> {
  const selection = selections[code];
  if (selection === undefined || selection === 'missing') return;
  savingCode.value = code;
  errorMessage.value = '';
  try {
    const response = await api<BikeSpecResponse>(
      `/bikes/${bikeId.value}/specs/${code}`,
      {
        method: 'PUT',
        body:
          selection === 'unknown'
            ? { knowledge: 'unknown' }
            : { knowledge: 'known', value: selection },
      },
    );
    if (bike.value !== null) {
      bike.value.specs = [
        ...bike.value.specs.filter(({ standardCode }) => standardCode !== code),
        response.spec,
      ];
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    savingCode.value = null;
  }
}

async function deleteBike(): Promise<void> {
  if (!window.confirm('Remove this bike from your Garage?')) return;
  try {
    await api(`/bikes/${bikeId.value}`, { method: 'DELETE' });
    await navigateTo('/garage');
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  }
}
</script>

<template>
  <div class="page-stack">
    <p v-if="loading" class="state-card" role="status">
      Checking bike details…
    </p>
    <div v-else-if="!user" class="state-card signed-out-state">
      <p>Sign in to view this bike.</p>
      <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
    </div>
    <p
      v-else-if="bike === null"
      class="state-card state-card--error"
      role="alert"
    >
      {{ errorMessage || 'Bike not found.' }}
    </p>

    <template v-else>
      <header class="bike-hero">
        <div>
          <span class="status-chip">{{ bike.bicycleType.name }}</span>
          <h1>{{ bike.nickname }}</h1>
          <p>
            {{
              [bike.brand, bike.model, bike.modelYear]
                .filter(Boolean)
                .join(' ') || 'Details can be added later.'
            }}
          </p>
        </div>
        <button
          class="text-button text-button--danger"
          type="button"
          @click="deleteBike"
        >
          Remove bike
        </button>
      </header>

      <p v-if="errorMessage" class="state-card state-card--error" role="alert">
        {{ errorMessage }}
      </p>

      <section aria-labelledby="specs-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Normalized standards</p>
            <h2 id="specs-title">Bike specs</h2>
          </div>
          <NuxtLink
            class="button button--secondary"
            :to="`/upgrade-lab?bike=${bike.id}`"
          >
            Check an upgrade
          </NuxtLink>
        </div>

        <div class="spec-list">
          <article
            v-for="definition in BIKE_SPEC_DEFINITIONS"
            :key="definition.code"
            class="spec-row"
          >
            <div class="spec-row__copy">
              <strong>{{ definition.label }}</strong>
              <span>{{ definition.description }}</span>
            </div>
            <label class="visually-hidden" :for="`spec-${definition.code}`">
              {{ definition.label }} value
            </label>
            <select
              :id="`spec-${definition.code}`"
              v-model="selections[definition.code]"
            >
              <option value="missing">Not recorded</option>
              <option value="unknown">I don’t know</option>
              <option
                v-for="option in definition.values"
                :key="option.code"
                :value="option.code"
              >
                {{ option.label }}
              </option>
            </select>
            <button
              class="button button--secondary"
              type="button"
              :disabled="
                selections[definition.code] === 'missing' ||
                savingCode === definition.code
              "
              @click="saveSpec(definition.code)"
            >
              {{ savingCode === definition.code ? 'Saving…' : 'Save' }}
            </button>
            <p
              v-if="selections[definition.code] === 'unknown'"
              class="unknown-note"
            >
              <strong>Unknown is okay.</strong> {{ definition.guidance }}
            </p>
            <p
              v-else-if="selections[definition.code] === 'missing'"
              class="missing-note"
            >
              This detail has not been recorded yet.
            </p>
          </article>
        </div>
      </section>

      <InstalledComponents :bike-id="bike.id" />
      <MaintenanceLog :bike-id="bike.id" />
    </template>
  </div>
</template>
