<script setup lang="ts">
import {
  BIKE_SPEC_DEFINITIONS,
  type BikeSpecCode,
} from '@goweskit/bike-domain';
import type {
  ComponentCategory,
  ComponentCategoryListResponse,
  CreateInstalledComponentRequest,
  InstalledComponent,
  InstalledComponentListResponse,
  InstalledComponentResponse,
  InstalledComponentStandardInput,
} from '@goweskit/contracts';

const props = defineProps<{ bikeId: string }>();

const api = useApi();
const categories = ref<ComponentCategory[]>([]);
const components = ref<InstalledComponent[]>([]);
const loading = ref(true);
const saving = ref(false);
const deletingId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const errorMessage = ref('');
const successMessage = ref('');
const today = new Date().toISOString().slice(0, 10);
const standardSelections = reactive<Record<BikeSpecCode, string>>(
  Object.fromEntries(
    BIKE_SPEC_DEFINITIONS.map(({ code }) => [code, 'not_recorded']),
  ) as Record<BikeSpecCode, string>,
);
const form = reactive({
  componentCategoryId: '',
  customName: '',
  brand: '',
  model: '',
  serialNumber: '',
  notes: '',
  installedAt: '',
});

const categoryById = computed(
  () => new Map(categories.value.map((category) => [category.id, category])),
);

function nullable(value: string): string | null {
  return value.trim() || null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function resetForm(): void {
  editingId.value = null;
  form.componentCategoryId = categories.value[0]?.id ?? '';
  form.customName = '';
  form.brand = '';
  form.model = '';
  form.serialNumber = '';
  form.notes = '';
  form.installedAt = '';
  for (const definition of BIKE_SPEC_DEFINITIONS) {
    standardSelections[definition.code] = 'not_recorded';
  }
}

function standardsPayload(): InstalledComponentStandardInput[] {
  const standards: InstalledComponentStandardInput[] = [];
  for (const definition of BIKE_SPEC_DEFINITIONS) {
    const selection = standardSelections[definition.code];
    if (selection === 'not_recorded' || selection === undefined) continue;
    if (selection === 'unknown') {
      standards.push({
        standardCode: definition.code,
        knowledge: 'unknown',
      });
      continue;
    }
    standards.push({
      standardCode: definition.code,
      knowledge: 'known',
      value: selection,
    });
  }
  return standards;
}

async function loadComponents(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    const [categoryResponse, componentResponse] = await Promise.all([
      api<ComponentCategoryListResponse>('/learn/components'),
      api<InstalledComponentListResponse>(`/bikes/${props.bikeId}/components`),
    ]);
    categories.value = categoryResponse.componentCategories;
    components.value = componentResponse.components;
    if (form.componentCategoryId === '') resetForm();
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function editComponent(component: InstalledComponent): void {
  editingId.value = component.id;
  form.componentCategoryId = component.componentCategoryId;
  form.customName = component.customName;
  form.brand = component.brand ?? '';
  form.model = component.model ?? '';
  form.serialNumber = component.serialNumber ?? '';
  form.notes = component.notes ?? '';
  form.installedAt = component.installedAt ?? '';
  for (const definition of BIKE_SPEC_DEFINITIONS) {
    const standard = component.standards.find(
      ({ standardCode }) => standardCode === definition.code,
    );
    standardSelections[definition.code] =
      standard === undefined
        ? 'not_recorded'
        : standard.knowledge === 'unknown'
          ? 'unknown'
          : standard.value;
  }
  document
    .querySelector('#installed-component-form')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveComponent(): Promise<void> {
  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  const payload: CreateInstalledComponentRequest = {
    componentCategoryId: form.componentCategoryId,
    customName: form.customName,
    brand: nullable(form.brand),
    model: nullable(form.model),
    serialNumber: nullable(form.serialNumber),
    notes: nullable(form.notes),
    installedAt: form.installedAt || null,
    standards: standardsPayload(),
  };

  try {
    const response = await api<InstalledComponentResponse>(
      editingId.value === null
        ? `/bikes/${props.bikeId}/components`
        : `/bikes/${props.bikeId}/components/${editingId.value}`,
      {
        method: editingId.value === null ? 'POST' : 'PATCH',
        body: payload,
      },
    );
    components.value = [
      response.component,
      ...components.value.filter(({ id }) => id !== response.component.id),
    ];
    successMessage.value =
      editingId.value === null
        ? 'Installed component saved.'
        : 'Installed component updated.';
    resetForm();
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    saving.value = false;
  }
}

async function deleteComponent(component: InstalledComponent): Promise<void> {
  if (!window.confirm(`Remove “${component.customName}” from this bike?`)) {
    return;
  }
  deletingId.value = component.id;
  errorMessage.value = '';
  try {
    await api(`/bikes/${props.bikeId}/components/${component.id}`, {
      method: 'DELETE',
    });
    components.value = components.value.filter(({ id }) => id !== component.id);
    if (editingId.value === component.id) resetForm();
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadComponents);
</script>

<template>
  <section class="installed" aria-labelledby="installed-title">
    <div class="section-heading installed__heading">
      <div>
        <p class="section-heading__eyebrow">What is on the bike now?</p>
        <h2 id="installed-title">Installed components</h2>
        <p>
          Save the part label and only the standards you can confirm. Unknown
          stays visible instead of being guessed from a brand.
        </p>
      </div>
      <span class="count-chip">{{ components.length }}</span>
    </div>

    <form
      id="installed-component-form"
      class="installed-form"
      @submit.prevent="saveComponent"
    >
      <div class="installed-form__title">
        <strong>{{ editingId ? 'Edit component' : 'Add a component' }}</strong>
        <button
          v-if="editingId"
          class="text-button"
          type="button"
          @click="resetForm"
        >
          Cancel edit
        </button>
      </div>

      <div class="installed-form__grid">
        <label>
          <span>Part category</span>
          <select v-model="form.componentCategoryId" required>
            <option disabled value="">Choose a category</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </label>
        <label>
          <span>Your label</span>
          <input
            v-model="form.customName"
            maxlength="120"
            placeholder="Current rear wheel"
            required
          />
        </label>
        <label>
          <span>Brand <small>optional</small></span>
          <input v-model="form.brand" maxlength="100" placeholder="Shimano" />
        </label>
        <label>
          <span>Model <small>optional</small></span>
          <input
            v-model="form.model"
            maxlength="120"
            placeholder="Model name"
          />
        </label>
        <label>
          <span>Installed date <small>optional</small></span>
          <input v-model="form.installedAt" type="date" :max="today" />
        </label>
        <label>
          <span>Serial number <small>private, optional</small></span>
          <input v-model="form.serialNumber" maxlength="160" />
        </label>
      </div>

      <label>
        <span>Notes <small>optional</small></span>
        <textarea
          v-model="form.notes"
          maxlength="2000"
          rows="3"
          placeholder="Condition, service note, or where you found the specification."
        />
      </label>

      <details class="installed-standards">
        <summary>Record technical standards</summary>
        <p>
          Select “I don’t know yet” when the interface is relevant but not
          confirmed.
        </p>
        <div class="installed-standards__grid">
          <label
            v-for="definition in BIKE_SPEC_DEFINITIONS"
            :key="definition.code"
          >
            <span>{{ definition.label }}</span>
            <select v-model="standardSelections[definition.code]">
              <option value="not_recorded">Not recorded for this part</option>
              <option value="unknown">I don’t know yet</option>
              <option
                v-for="option in definition.values"
                :key="option.code"
                :value="option.code"
              >
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </details>

      <button
        class="button button--primary"
        type="submit"
        :disabled="saving || categories.length === 0"
      >
        {{
          saving
            ? 'Saving component…'
            : editingId
              ? 'Save changes'
              : 'Add component'
        }}
      </button>
    </form>

    <p v-if="successMessage" class="installed__success" role="status">
      {{ successMessage }}
    </p>
    <div v-if="errorMessage" class="state-card state-card--error" role="alert">
      <p>{{ errorMessage }}</p>
      <button class="text-button" type="button" @click="loadComponents">
        Try loading components again
      </button>
    </div>

    <p v-if="loading" class="state-card" role="status">
      Checking installed components…
    </p>
    <div
      v-else-if="components.length === 0 && !errorMessage"
      class="installed-empty"
    >
      <span aria-hidden="true">＋</span>
      <div>
        <strong>No installed components recorded</strong>
        <p>
          Start with one part you can identify. Incomplete details are okay.
        </p>
      </div>
    </div>
    <div v-else-if="components.length > 0" class="installed-list">
      <article
        v-for="component in components"
        :key="component.id"
        class="installed-card"
      >
        <header>
          <div>
            <span>{{
              categoryById.get(component.componentCategoryId)?.name ??
              'Component'
            }}</span>
            <h3>{{ component.customName }}</h3>
          </div>
          <div class="installed-card__actions">
            <button
              class="text-button"
              type="button"
              @click="editComponent(component)"
            >
              Edit
            </button>
            <button
              class="text-button text-button--danger"
              type="button"
              :disabled="deletingId === component.id"
              @click="deleteComponent(component)"
            >
              {{ deletingId === component.id ? 'Removing…' : 'Remove' }}
            </button>
          </div>
        </header>
        <p class="installed-card__identity">
          {{
            [component.brand, component.model].filter(Boolean).join(' · ') ||
            'Brand and model not recorded'
          }}
        </p>
        <p v-if="component.notes">{{ component.notes }}</p>
        <p v-if="component.installedAt" class="installed-card__date">
          Installed {{ formatDate(component.installedAt) }}
        </p>
        <dl v-if="component.standards.length" class="installed-card__standards">
          <div
            v-for="standard in component.standards"
            :key="standard.standardCode"
          >
            <dt>
              {{
                BIKE_SPEC_DEFINITIONS.find(
                  ({ code }) => code === standard.standardCode,
                )?.label ?? standard.standardCode
              }}
            </dt>
            <dd
              :class="{
                'installed-card__unknown': standard.knowledge === 'unknown',
              }"
            >
              {{
                standard.knowledge === 'unknown'
                  ? 'Unknown — confirm later'
                  : standard.valueLabel
              }}
            </dd>
          </div>
        </dl>
        <p v-else class="installed-card__unknown">
          No technical standards recorded for this part yet.
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.installed {
  display: grid;
  gap: 1.25rem;
  padding-top: 1rem;
}

.installed__heading p:last-child {
  max-width: 42rem;
  margin: 0.5rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.6;
}

.installed-form {
  display: grid;
  gap: 1rem;
  padding: 1.15rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: rgb(255 255 255 / 82%);
}

.installed-form__title,
.installed-card header,
.installed-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.installed-form__grid,
.installed-standards__grid {
  display: grid;
  gap: 1rem;
}

.installed-form label,
.installed-standards label {
  display: grid;
  gap: 0.45rem;
  color: var(--color-ink);
  font-size: 0.84rem;
  font-weight: 800;
}

.installed-form small {
  color: var(--color-asphalt);
  font-weight: 600;
}

.installed-form input,
.installed-form select,
.installed-form textarea {
  width: 100%;
  min-height: 2.9rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.8rem;
  background: var(--color-white);
  color: var(--color-ink);
  font: inherit;
}

.installed-form textarea {
  resize: vertical;
}

.installed-standards {
  padding: 0.9rem;
  border-radius: 0.9rem;
  background: rgb(237 228 210 / 36%);
}

.installed-standards summary {
  font-weight: 850;
  cursor: pointer;
}

.installed-standards > p {
  margin: 0.65rem 0 1rem;
  color: var(--color-asphalt);
  line-height: 1.5;
}

.installed__success {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 0.85rem;
  background: rgb(201 243 106 / 35%);
  font-weight: 750;
}

.installed-empty {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1.1rem;
  border: 1px dashed var(--color-sand);
  border-radius: 1rem;
  background: var(--color-white);
}

.installed-empty > span {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: var(--color-sky);
  font-weight: 900;
}

.installed-empty p,
.installed-card p {
  margin: 0.35rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.55;
}

.installed-list {
  display: grid;
  gap: 0.85rem;
}

.installed-card {
  padding: 1rem;
  border: 1px solid rgb(64 80 95 / 12%);
  border-radius: 1rem;
  background: var(--color-white);
}

.installed-card header {
  align-items: flex-start;
}

.installed-card header span {
  color: var(--color-asphalt);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.installed-card h3 {
  margin: 0.2rem 0 0;
}

.installed-card__actions {
  flex: 0 0 auto;
}

.installed-card__date {
  font-size: 0.78rem;
  font-weight: 750;
}

.installed-card__standards {
  display: grid;
  margin: 1rem 0 0;
  padding: 0;
  gap: 0.55rem;
}

.installed-card__standards div {
  display: grid;
  gap: 0.2rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.7rem;
  background: rgb(237 228 210 / 35%);
}

.installed-card__standards dt {
  color: var(--color-asphalt);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.installed-card__standards dd {
  margin: 0;
  font-weight: 800;
}

.installed-card__unknown {
  color: #752719 !important;
  font-size: 0.82rem;
  font-weight: 750;
}

@media (min-width: 42rem) {
  .installed-form {
    padding: 1.4rem;
  }

  .installed-form__grid,
  .installed-standards__grid,
  .installed-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .installed-form {
    scroll-behavior: auto;
  }
}
</style>
