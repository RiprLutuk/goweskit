<script setup lang="ts">
import {
  MAINTENANCE_EVENT_LABELS,
  MAINTENANCE_EVENT_TYPES,
  type MaintenanceEvent,
  type MaintenanceEventListResponse,
  type MaintenanceEventResponse,
  type MaintenanceEventType,
} from '@goweskit/contracts';

const props = defineProps<{ bikeId: string }>();

const api = useApi();
const events = ref<MaintenanceEvent[]>([]);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const today = new Date().toISOString().slice(0, 10);
const form = reactive<{
  type: MaintenanceEventType;
  performedAt: string;
  notes: string;
  nextDueDate: string;
}>({
  type: 'chain_lube',
  performedAt: today,
  notes: '',
  nextDueDate: '',
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function dueCopy(event: MaintenanceEvent): string {
  if (event.nextDueDate === null) return 'No date reminder';
  const date = formatDate(event.nextDueDate);
  if (event.dueStatus === 'overdue') return `Overdue since ${date}`;
  if (event.dueStatus === 'due') return `Due today · ${date}`;
  return `Next check · ${date}`;
}

async function loadEvents(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await api<MaintenanceEventListResponse>(
      `/bikes/${props.bikeId}/maintenance`,
    );
    events.value = response.events;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function saveEvent(): Promise<void> {
  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const response = await api<MaintenanceEventResponse>(
      `/bikes/${props.bikeId}/maintenance`,
      {
        method: 'POST',
        body: {
          type: form.type,
          performedAt: form.performedAt,
          notes: form.notes.trim() || null,
          nextDueDate: form.nextDueDate || null,
        },
      },
    );
    events.value = [response.event, ...events.value];
    form.notes = '';
    form.nextDueDate = '';
    successMessage.value = 'Maintenance log saved.';
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    saving.value = false;
  }
}

onMounted(loadEvents);
</script>

<template>
  <section class="maintenance" aria-labelledby="maintenance-title">
    <div class="section-heading maintenance__heading">
      <div>
        <p class="section-heading__eyebrow">Service notebook</p>
        <h2 id="maintenance-title">Maintenance</h2>
        <p>Log work by date and add an optional next-check reminder.</p>
      </div>
    </div>

    <form class="maintenance-form" @submit.prevent="saveEvent">
      <label>
        <span>What did you do?</span>
        <select v-model="form.type" required>
          <option
            v-for="type in MAINTENANCE_EVENT_TYPES"
            :key="type"
            :value="type"
          >
            {{ MAINTENANCE_EVENT_LABELS[type] }}
          </option>
        </select>
      </label>

      <div class="maintenance-form__dates">
        <label>
          <span>Service date</span>
          <input v-model="form.performedAt" type="date" :max="today" required />
        </label>
        <label>
          <span>Next check <small>optional</small></span>
          <input
            v-model="form.nextDueDate"
            type="date"
            :min="form.performedAt"
          />
        </label>
      </div>

      <label>
        <span>Notes <small>optional</small></span>
        <textarea
          v-model="form.notes"
          maxlength="2000"
          rows="3"
          placeholder="Parts checked, conditions, or what to watch next."
        />
      </label>

      <button class="button button--primary" type="submit" :disabled="saving">
        {{ saving ? 'Saving log…' : 'Save maintenance log' }}
      </button>
    </form>

    <p v-if="successMessage" class="maintenance__success" role="status">
      {{ successMessage }}
    </p>
    <div v-if="errorMessage" class="state-card state-card--error" role="alert">
      <p>{{ errorMessage }}</p>
      <button
        v-if="!loading"
        class="text-button"
        type="button"
        @click="loadEvents"
      >
        Try loading history again
      </button>
    </div>

    <p v-if="loading" class="state-card" role="status">
      Opening the service notebook…
    </p>
    <div
      v-else-if="events.length === 0 && !errorMessage"
      class="maintenance-empty"
    >
      <span aria-hidden="true">✓</span>
      <div>
        <strong>No maintenance logged yet</strong>
        <p>Your first service note will appear here.</p>
      </div>
    </div>
    <ol
      v-else-if="events.length > 0"
      class="maintenance-list"
      aria-label="Maintenance history"
    >
      <li v-for="event in events" :key="event.id" class="maintenance-event">
        <div class="maintenance-event__marker" aria-hidden="true" />
        <div>
          <div class="maintenance-event__topline">
            <strong>{{ MAINTENANCE_EVENT_LABELS[event.type] }}</strong>
            <time :datetime="event.performedAt">{{
              formatDate(event.performedAt)
            }}</time>
          </div>
          <p v-if="event.notes">{{ event.notes }}</p>
          <span
            class="maintenance-event__due"
            :class="`maintenance-event__due--${event.dueStatus}`"
          >
            {{ dueCopy(event) }}
          </span>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.maintenance {
  display: grid;
  gap: 1.25rem;
  padding-top: 1rem;
}

.maintenance__heading p:last-child {
  max-width: 38rem;
  margin: 0.5rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.6;
}

.maintenance-form {
  display: grid;
  gap: 1rem;
  padding: 1.15rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: rgb(255 255 255 / 82%);
}

.maintenance-form label {
  display: grid;
  gap: 0.45rem;
  color: var(--color-ink);
  font-size: 0.85rem;
  font-weight: 800;
}

.maintenance-form small {
  color: var(--color-asphalt);
  font-weight: 600;
}

.maintenance-form select,
.maintenance-form input,
.maintenance-form textarea {
  width: 100%;
  min-height: 2.9rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.8rem;
  background: var(--color-white);
  color: var(--color-ink);
  font: inherit;
}

.maintenance-form textarea {
  resize: vertical;
}

.maintenance-form__dates {
  display: grid;
  gap: 1rem;
}

.maintenance__success {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 0.85rem;
  background: rgb(201 243 106 / 35%);
  font-weight: 750;
}

.maintenance-empty {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1.1rem;
  border: 1px dashed var(--color-sand);
  border-radius: 1rem;
  background: var(--color-white);
}

.maintenance-empty > span {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: var(--color-chain-lime);
  font-weight: 900;
}

.maintenance-empty p,
.maintenance-event p {
  margin: 0.3rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.55;
}

.maintenance-list {
  display: grid;
  margin: 0;
  padding: 0;
  gap: 0.8rem;
  list-style: none;
}

.maintenance-event {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  padding: 1rem;
  border: 1px solid rgb(64 80 95 / 12%);
  border-radius: 1rem;
  background: var(--color-white);
}

.maintenance-event__marker {
  width: 0.7rem;
  height: 0.7rem;
  margin-top: 0.35rem;
  border: 2px solid var(--color-ink);
  border-radius: 50%;
  background: var(--color-chain-lime);
}

.maintenance-event__topline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
}

.maintenance-event__topline time {
  color: var(--color-asphalt);
  font-size: 0.78rem;
  font-weight: 750;
}

.maintenance-event__due {
  display: inline-flex;
  margin-top: 0.75rem;
  padding: 0.35rem 0.55rem;
  border-radius: 0.55rem;
  background: var(--color-sand);
  font-size: 0.74rem;
  font-weight: 800;
}

.maintenance-event__due--upcoming {
  background: rgb(142 221 244 / 38%);
}

.maintenance-event__due--due,
.maintenance-event__due--overdue {
  background: rgb(255 140 117 / 24%);
  color: #752719;
}

@media (min-width: 42rem) {
  .maintenance-form {
    padding: 1.4rem;
  }

  .maintenance-form__dates {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
