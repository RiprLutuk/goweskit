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
  performedAtDistanceKm: number | null;
  nextDueDistanceKm: number | null;
}>({
  type: 'chain_lube',
  performedAt: today,
  notes: '',
  nextDueDate: '',
  performedAtDistanceKm: null,
  nextDueDistanceKm: null,
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function dueCopy(event: MaintenanceEvent): string {
  const parts: string[] = [];
  if (event.nextDueDate !== null) {
    const date = formatDate(event.nextDueDate);
    if (event.dueStatus === 'overdue') parts.push(`Lewat jadwal (${date})`);
    else if (event.dueStatus === 'due') parts.push(`Jatuh tempo hari ini (${date})`);
    else parts.push(`Cek berikutnya ${date}`);
  }
  if (event.nextDueDistanceKm !== null) {
    parts.push(`Target ${event.nextDueDistanceKm.toLocaleString()} km`);
  }
  return parts.join(' · ') || 'Catatan reguler';
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
          performedAtDistanceKm:
            form.performedAtDistanceKm !== null &&
            form.performedAtDistanceKm >= 0
              ? Number(form.performedAtDistanceKm)
              : null,
          nextDueDistanceKm:
            form.nextDueDistanceKm !== null && form.nextDueDistanceKm >= 0
              ? Number(form.nextDueDistanceKm)
              : null,
        },
      },
    );
    events.value = [response.event, ...events.value];
    form.notes = '';
    form.nextDueDate = '';
    form.performedAtDistanceKm = null;
    form.nextDueDistanceKm = null;
    successMessage.value = 'Catatan perawatan berhasil disimpan.';
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
        <p class="section-heading__eyebrow">Buku Servis Digital</p>
        <h2 id="maintenance-title">Riwayat Perawatan</h2>
        <p>Catat servis rantai, rem, suspensi, dan pasang pengingat tanggal &amp; jarak tempuh (odometer).</p>
      </div>
    </div>

    <!-- Form Input Servis -->
    <form class="maintenance-form" @submit.prevent="saveEvent">
      <label>
        <span>Jenis Perawatan</span>
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

      <div class="maintenance-form__grid-2">
        <label>
          <span>Tanggal Servis</span>
          <input v-model="form.performedAt" type="date" required />
        </label>
        <label>
          <span>Ingatkan Kembali Pada</span>
          <input v-model="form.nextDueDate" type="date" :min="form.performedAt" />
        </label>
      </div>

      <!-- Distance / Odometer Reminder (MAINT-004) -->
      <div class="maintenance-form__grid-2">
        <label>
          <span>Odometer Saat Servis (km)</span>
          <input
            v-model.number="form.performedAtDistanceKm"
            type="number"
            min="0"
            step="1"
            placeholder="Contoh: 1200"
          />
        </label>
        <label>
          <span>Ingatkan Pada Odometer (km)</span>
          <input
            v-model.number="form.nextDueDistanceKm"
            type="number"
            min="0"
            step="1"
            placeholder="Contoh: 1500 (tiap 300 km)"
          />
        </label>
      </div>

      <label>
        <span>Catatan Tambahan (Merek pelumas, tekanan ban, dll.)</span>
        <textarea
          v-model="form.notes"
          rows="2"
          placeholder="Contoh: Menggunakan dry lube Squirt, rantai dibersihkan total..."
        />
      </label>

      <button
        class="button button--primary button--full"
        type="submit"
        :disabled="saving"
      >
        {{ saving ? 'Menyimpan…' : 'Simpan Catatan Servis' }}
      </button>

      <p v-if="errorMessage" class="state-card state-card--error" role="alert">
        {{ errorMessage }}
      </p>
      <p
        v-if="successMessage"
        class="state-card state-card--success"
        role="status"
      >
        ✓ {{ successMessage }}
      </p>
    </form>

    <!-- List of Service Records -->
    <div class="maintenance-list">
      <p v-if="loading" class="state-card" role="status">
        Memuat riwayat servis…
      </p>
      <p
        v-else-if="events.length === 0"
        class="state-card state-card--empty"
        role="status"
      >
        Belum ada riwayat servis untuk sepeda ini.
      </p>
      <article
        v-for="event in events"
        v-else
        :key="event.id"
        class="maintenance-card"
        :class="{
          'maintenance-card--overdue': event.dueStatus === 'overdue',
          'maintenance-card--due': event.dueStatus === 'due',
        }"
      >
        <div class="maintenance-card__top">
          <span class="type-badge">{{ MAINTENANCE_EVENT_LABELS[event.type] }}</span>
          <span
            class="due-pill"
            :class="`due-pill--${event.dueStatus}`"
          >
            {{ dueCopy(event) }}
          </span>
        </div>

        <div class="maintenance-card__meta">
          <span class="meta-date">📅 {{ formatDate(event.performedAt) }}</span>
          <span v-if="event.performedAtDistanceKm !== null" class="meta-dist">
            🛣️ Odometer: {{ event.performedAtDistanceKm.toLocaleString() }} km
          </span>
        </div>

        <p v-if="event.notes" class="maintenance-card__notes">
          {{ event.notes }}
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.maintenance {
  display: grid;
  gap: 1.25rem;
}

.maintenance-form {
  display: grid;
  gap: 0.85rem;
  padding: 1.15rem;
  border-radius: 1.15rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.maintenance-form label {
  display: grid;
  gap: 0.3rem;
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.maintenance-form input,
.maintenance-form select,
.maintenance-form textarea {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  font-size: 0.82rem;
  box-sizing: border-box;
  outline: none;
}

.maintenance-form input:focus,
.maintenance-form select:focus,
.maintenance-form textarea:focus {
  border-color: var(--color-ink);
}

.maintenance-form__grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

@media (max-width: 32rem) {
  .maintenance-form__grid-2 {
    grid-template-columns: 1fr;
  }
}

.maintenance-list {
  display: grid;
  gap: 0.65rem;
}

.maintenance-card {
  display: grid;
  gap: 0.45rem;
  padding: 0.95rem 1.15rem;
  border-radius: 1rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  transition: all 120ms ease;
}

.maintenance-card--overdue {
  border-left: 4px solid #ef4444;
}

.maintenance-card--due {
  border-left: 4px solid #f59e0b;
}

.maintenance-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-badge {
  font-size: 0.86rem;
  font-weight: 850;
  color: var(--color-ink);
}

.due-pill {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: var(--color-sand);
  color: var(--color-asphalt);
}

.due-pill--overdue {
  background: #fef2f2;
  color: #dc2626;
}

.due-pill--due {
  background: #fffbeb;
  color: #d97706;
}

.due-pill--upcoming {
  background: rgb(201 243 106 / 35%);
  color: #166534;
}

.maintenance-card__meta {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  font-weight: 750;
}

.maintenance-card__notes {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-ink);
  line-height: 1.35;
  background: var(--color-sand);
  padding: 0.45rem 0.65rem;
  border-radius: 0.5rem;
}
</style>
