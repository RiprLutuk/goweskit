<script setup lang="ts">
import { BIKE_SPEC_DEFINITIONS } from '@goweskit/bike-domain';
import type {
  BicycleType,
  BicycleTypeListResponse,
  BikeResponse,
  BikeSpecMutation,
} from '@goweskit/contracts';

const api = useApi();
const { user, initialized, refresh } = useAuth();
const bicycleTypes = ref<BicycleType[]>([]);
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref('');
const nickname = ref('');
const bicycleTypeId = ref('');
const brand = ref('');
const model = ref('');
const modelYear = ref<number | null>(null);
const notes = ref('');
const specSelections = reactive<Record<string, string>>(
  Object.fromEntries(
    BIKE_SPEC_DEFINITIONS.map(({ code }) => [code, 'missing']),
  ),
);

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value === null) {
    loading.value = false;
    return;
  }

  try {
    bicycleTypes.value = (
      await api<BicycleTypeListResponse>('/learn/bicycle-types')
    ).bicycleTypes;
    bicycleTypeId.value = bicycleTypes.value[0]?.id ?? '';
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
});

function selectedSpecs(): BikeSpecMutation[] {
  const specs: BikeSpecMutation[] = [];
  for (const { code } of BIKE_SPEC_DEFINITIONS) {
    const selection = specSelections[code];
    if (selection === undefined || selection === 'missing') continue;
    if (selection === 'unknown') {
      specs.push({ standardCode: code, input: { knowledge: 'unknown' } });
      continue;
    }
    specs.push({
      standardCode: code,
      input: { knowledge: 'known', value: selection },
    });
  }
  return specs;
}

async function submit(): Promise<void> {
  errorMessage.value = '';
  submitting.value = true;
  try {
    const response = await api<BikeResponse>('/bikes', {
      method: 'POST',
      body: {
        nickname: nickname.value,
        bicycleTypeId: bicycleTypeId.value,
        brand: brand.value || null,
        model: model.value || null,
        modelYear: modelYear.value,
        notes: notes.value || null,
        specs: selectedSpecs(),
      },
    });
    await navigateTo(`/garage/${response.bike.id}`);
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="form-card form-card--wide" aria-labelledby="new-bike-title">
    <p class="welcome-card__eyebrow">Incomplete is okay</p>
    <h1 id="new-bike-title">Add a bike to your Garage.</h1>

    <p v-if="loading" class="state-card" role="status">
      Preparing the bike form…
    </p>
    <div v-else-if="!user" class="state-card signed-out-state">
      <p>Sign in before adding a bike.</p>
      <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
    </div>
    <form v-else class="form-stack" @submit.prevent="submit">
      <div class="field-grid">
        <label>
          <span>Bike nickname *</span>
          <input
            v-model="nickname"
            required
            maxlength="80"
            placeholder="Trail Buddy"
          />
        </label>
        <label>
          <span>Bicycle type *</span>
          <select v-model="bicycleTypeId" required>
            <option
              v-for="type in bicycleTypes"
              :key="type.id"
              :value="type.id"
            >
              {{ type.name }}
            </option>
          </select>
        </label>
        <label>
          <span>Brand <small>optional</small></span>
          <input v-model="brand" maxlength="100" />
        </label>
        <label>
          <span>Model <small>optional</small></span>
          <input v-model="model" maxlength="100" />
        </label>
        <label>
          <span>Model year <small>optional</small></span>
          <input v-model="modelYear" type="number" min="1900" max="2100" />
        </label>
      </div>

      <fieldset class="spec-fieldset">
        <legend>What standards do you know?</legend>
        <p>
          Choose “I don’t know” when you checked but could not identify it.
          Leave “Not recorded” for later.
        </p>
        <div class="spec-form-grid">
          <label
            v-for="definition in BIKE_SPEC_DEFINITIONS"
            :key="definition.code"
          >
            <span>{{ definition.label }}</span>
            <select v-model="specSelections[definition.code]">
              <option value="missing">Not recorded yet</option>
              <option value="unknown">I don’t know</option>
              <option
                v-for="option in definition.values"
                :key="option.code"
                :value="option.code"
              >
                {{ option.label }}
              </option>
            </select>
            <small>{{ definition.guidance }}</small>
          </label>
        </div>
      </fieldset>

      <label>
        <span>Notes <small>optional</small></span>
        <textarea v-model="notes" maxlength="2000" />
      </label>

      <p
        v-if="errorMessage"
        class="form-message form-message--error"
        role="alert"
      >
        {{ errorMessage }}
      </p>
      <div class="action-row">
        <button
          class="button button--primary"
          type="submit"
          :disabled="submitting"
        >
          {{ submitting ? 'Saving bike…' : 'Save bike' }}
        </button>
        <NuxtLink class="button button--secondary" to="/garage"
          >Cancel</NuxtLink
        >
      </div>
    </form>
  </section>
</template>
