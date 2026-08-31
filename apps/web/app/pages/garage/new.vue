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
const { toast, alert } = useNotify();

const bicycleTypes = ref<BicycleType[]>([]);
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref('');
const nickname = ref('');
const bicycleTypeId = ref('');
const brand = ref('');
const model = ref('');
const modelYear = ref<number | null>(null);
const photoUrl = ref('');
const notes = ref('');
const specSelections = reactive<Record<string, string>>(
  Object.fromEntries(
    BIKE_SPEC_DEFINITIONS.map(({ code }) => [code, 'missing']),
  ),
);

const errors = reactive({
  nickname: '',
  bicycleTypeId: '',
});

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

function applyPreset(
  presetKey: 'mtb_boost' | 'folding_20' | 'road_disc',
): void {
  if (presetKey === 'mtb_boost') {
    nickname.value = 'Trail Explorer 29';
    brand.value = 'Trek';
    model.value = 'Marlin / Roscoe';
    modelYear.value = 2024;
    const mtbType = bicycleTypes.value.find((t) => t.slug === 'mtb_hardtail');
    if (mtbType) bicycleTypeId.value = mtbType.id;
    specSelections.wheel_size = 'iso_622';
    specSelections.front_axle = '15x110';
    specSelections.rear_axle = '12x148';
    specSelections.freehub = 'micro_spline';
    specSelections.drivetrain_speeds = '12';
    specSelections.drivetrain_family = 'shimano_mtb_hg';
    specSelections.fork_steerer = 'tapered_1_1_8_to_1_1_2';
    specSelections.headset_interface = 'zs44_zs56';
    specSelections.bottom_bracket_shell = 'bsa_68_73';
    specSelections.bottom_bracket_spindle = '24mm';
    specSelections.fork_travel_min_mm = '100';
    specSelections.fork_travel_max_mm = '130';
    specSelections.brake_mount = 'post_mount';
    specSelections.rotor_min_mm = '160';
    specSelections.rotor_max_mm = '203';
    specSelections.seatpost_diameter_mm = '31.6';
    specSelections.tire_clearance_max_mm = '65';
  } else if (presetKey === 'folding_20') {
    nickname.value = 'City Commuter 20';
    brand.value = 'Dahon / Tern';
    model.value = 'Link / Boardwalk';
    modelYear.value = 2023;
    const foldType = bicycleTypes.value.find((t) => t.slug === 'folding');
    if (foldType) bicycleTypeId.value = foldType.id;
    specSelections.wheel_size = 'iso_406';
    specSelections.front_axle = 'unknown';
    specSelections.rear_axle = 'qr_135';
    specSelections.freehub = 'hg';
    specSelections.drivetrain_speeds = '8';
    specSelections.drivetrain_family = 'shimano_mtb_hg';
    specSelections.fork_steerer = 'unknown';
    specSelections.headset_interface = 'unknown';
    specSelections.bottom_bracket_shell = 'bsa_68_73';
    specSelections.bottom_bracket_spindle = 'square_taper';
    specSelections.fork_travel_min_mm = 'unknown';
    specSelections.fork_travel_max_mm = 'unknown';
    specSelections.brake_mount = 'unknown';
    specSelections.rotor_min_mm = 'unknown';
    specSelections.rotor_max_mm = 'unknown';
    specSelections.seatpost_diameter_mm = '33.9';
    specSelections.tire_clearance_max_mm = '45';
  } else if (presetKey === 'road_disc') {
    nickname.value = 'Morning Peloton';
    brand.value = 'Giant';
    model.value = 'Defy Advanced';
    modelYear.value = 2025;
    const roadType = bicycleTypes.value.find((t) => t.slug === 'road');
    if (roadType) bicycleTypeId.value = roadType.id;
    specSelections.wheel_size = 'iso_622';
    specSelections.front_axle = '12x100';
    specSelections.rear_axle = '12x142';
    specSelections.freehub = 'hg';
    specSelections.drivetrain_speeds = '11';
    specSelections.drivetrain_family = 'shimano_road_hg';
    specSelections.fork_steerer = 'tapered_1_1_8_to_1_1_2';
    specSelections.headset_interface = 'is42_is52';
    specSelections.bottom_bracket_shell = 'bb86_92';
    specSelections.bottom_bracket_spindle = '24mm';
    specSelections.fork_travel_min_mm = 'unknown';
    specSelections.fork_travel_max_mm = 'unknown';
    specSelections.brake_mount = 'flat_mount';
    specSelections.rotor_min_mm = '140';
    specSelections.rotor_max_mm = '160';
    specSelections.seatpost_diameter_mm = '27.2';
    specSelections.tire_clearance_max_mm = '35';
  }
}

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

function validate(): boolean {
  errors.nickname = '';
  errors.bicycleTypeId = '';

  if (!nickname.value.trim()) {
    errors.nickname = 'Nama panggilan sepeda wajib diisi.';
  }
  if (!bicycleTypeId.value) {
    errors.bicycleTypeId = 'Pilih tipe sepeda.';
  }

  return !errors.nickname && !errors.bicycleTypeId;
}

async function submit(): Promise<void> {
  if (!validate()) return;

  errorMessage.value = '';
  submitting.value = true;
  try {
    const response = await api<BikeResponse>('/bikes', {
      method: 'POST',
      body: {
        nickname: nickname.value.trim(),
        bicycleTypeId: bicycleTypeId.value,
        brand: brand.value.trim() || null,
        model: model.value.trim() || null,
        modelYear: modelYear.value,
        photoUrl: photoUrl.value.trim() || null,
        notes: notes.value.trim() || null,
        specs: selectedSpecs(),
      },
    });
    toast.success(
      'Sepeda Ditambahkan!',
      `"${response.bike.nickname}" siap dikelola di garasi.`,
    );
    await navigateTo(`/garage/${response.bike.id}`);
  } catch (error: unknown) {
    const msg = getApiErrorMessage(error);
    errorMessage.value = msg;
    alert.error('Gagal Menambah Sepeda', msg);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section
    class="form-card form-card--wide new-bike-card"
    aria-labelledby="new-bike-title"
  >
    <p class="welcome-card__eyebrow">Incomplete is 100% okay</p>
    <h1 id="new-bike-title">Add a bike to your Garage.</h1>
    <p class="new-bike-lead">
      Start with what you know. Unknown details remain visible without blocking
      you.
    </p>

    <p v-if="loading" class="state-card" role="status">
      Preparing the bike form…
    </p>
    <div v-else-if="!user" class="state-card signed-out-state">
      <p>Sign in before adding a bike.</p>
      <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
    </div>

    <form v-else class="form-stack" novalidate @submit.prevent="submit">
      <!-- Quick Presets Helper -->
      <div class="presets-banner">
        <strong>
          <GIcon name="sparkles" size="xs" color="#16A34A" /> Quick Presets
          (Optional)
        </strong>
        <p>Pre-fill standard interfaces from common builds to save time:</p>
        <div class="preset-buttons-row">
          <button
            class="button button--secondary button--sm"
            type="button"
            @click="applyPreset('mtb_boost')"
          >
            <GIcon name="bike-mtb" size="xs" /> 29er Boost Hardtail
          </button>
          <button
            class="button button--secondary button--sm"
            type="button"
            @click="applyPreset('folding_20')"
          >
            <GIcon name="bike-folding" size="xs" /> 20-inch Folding Bike
          </button>
          <button
            class="button button--secondary button--sm"
            type="button"
            @click="applyPreset('road_disc')"
          >
            <GIcon name="bike-road" size="xs" /> Modern Road Disc
          </button>
        </div>
      </div>

      <div class="field-grid">
        <div class="form-field">
          <label>
            <span class="field-label">Bike nickname *</span>
            <input
              v-model="nickname"
              maxlength="80"
              placeholder="e.g. Si Rimba, Blue Comet, Daily Commuter"
              class="input-control"
              :class="{ 'is-invalid': errors.nickname }"
              @input="errors.nickname = ''"
            />
          </label>
          <span v-if="errors.nickname" class="field-error-msg">
            <GIcon name="shield" size="xs" color="#EF4444" filled />
            {{ errors.nickname }}
          </span>
        </div>

        <div class="form-field">
          <label>
            <span class="field-label">Bicycle type *</span>
            <select
              v-model="bicycleTypeId"
              class="input-control"
              :class="{ 'is-invalid': errors.bicycleTypeId }"
              @change="errors.bicycleTypeId = ''"
            >
              <option
                v-for="type in bicycleTypes"
                :key="type.id"
                :value="type.id"
              >
                {{ type.name }}
              </option>
            </select>
          </label>
          <span v-if="errors.bicycleTypeId" class="field-error-msg">
            <GIcon name="shield" size="xs" color="#EF4444" filled />
            {{ errors.bicycleTypeId }}
          </span>
        </div>

        <label>
          <span>Brand <small>optional</small></span>
          <input
            v-model="brand"
            maxlength="100"
            placeholder="e.g. Polygon, Trek, Giant, Dahon"
          />
        </label>
        <label>
          <span>Model <small>optional</small></span>
          <input
            v-model="model"
            maxlength="100"
            placeholder="e.g. Siskiu, Marlin, Boardwalk"
          />
        </label>
        <label>
          <span>Model year <small>optional</small></span>
          <input
            v-model="modelYear"
            type="number"
            min="1900"
            max="2100"
            placeholder="e.g. 2024"
          />
        </label>
        <label>
          <span>Bike photo URL <small>optional</small></span>
          <input
            v-model="photoUrl"
            type="url"
            placeholder="https://... image link"
          />
        </label>
      </div>

      <fieldset class="spec-fieldset">
        <legend>What standards do you know?</legend>
        <p>
          Choose “I don’t know” when you checked but could not identify it.
          Leave “Not recorded” for later.
        </p>
        <div class="spec-form-grid">
          <div
            v-for="definition in BIKE_SPEC_DEFINITIONS"
            :key="definition.code"
            class="spec-form-field"
          >
            <label :for="`spec-${definition.code}`">
              <span>{{ definition.label }}</span>
            </label>
            <select
              :id="`spec-${definition.code}`"
              v-model="specSelections[definition.code]"
            >
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
            <small class="spec-guidance">{{ definition.guidance }}</small>
          </div>
        </div>
      </fieldset>

      <label>
        <span>Notes <small>optional</small></span>
        <textarea
          v-model="notes"
          maxlength="2000"
          placeholder="Service history notes, custom tire setup, or where you ride."
        />
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
          {{ submitting ? 'Saving bike…' : 'Save Bike to Garage' }}
        </button>
        <NuxtLink class="button button--secondary" to="/garage">
          Cancel
        </NuxtLink>
      </div>
    </form>
  </section>
</template>

<style scoped>
.new-bike-card {
  max-width: 52rem;
}

.new-bike-lead {
  margin: 0.5rem 0 1.5rem;
  color: var(--color-asphalt);
  font-size: 0.95rem;
}

.presets-banner {
  display: grid;
  gap: 0.5rem;
  padding: 1.15rem;
  border: 1px dashed rgb(64 80 95 / 24%);
  border-radius: 1rem;
  background: rgb(201 243 106 / 20%);
}

.presets-banner strong {
  font-size: 0.9rem;
}

.presets-banner p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.82rem;
}

.preset-buttons-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.spec-form-field {
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.85rem;
  background: var(--color-white);
}

.spec-guidance {
  color: var(--color-asphalt);
  font-size: 0.75rem;
  line-height: 1.4;
}

.button--sm {
  min-height: 2.3rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  background: var(--color-white);
}
</style>
