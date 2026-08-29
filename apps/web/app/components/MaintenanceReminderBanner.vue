<script setup lang="ts">
import type { Bike } from '@goweskit/contracts';

interface MaintenanceSchedule {
  id: string;
  taskName: string;
  intervalDays: number;
  intervalKm: number;
  lastDate?: string;
  urgency: 'ok' | 'due_soon' | 'overdue';
  daysOverdue?: number;
}

const props = defineProps<{
  bike: Bike;
}>();

const emit = defineEmits<{
  (e: 'logService', taskName: string): void;
}>();

const schedules = computed<MaintenanceSchedule[]>(() => {
  // Common cycling maintenance intervals
  return [
    {
      id: 'chain_lube',
      taskName: 'Pelumasan Rantai & Drivetrain',
      intervalDays: 30,
      intervalKm: 200,
      urgency: 'overdue',
      daysOverdue: 5,
    },
    {
      id: 'brake_check',
      taskName: 'Inspeksi Ketebalan Kampas Rem & Rotor',
      intervalDays: 60,
      intervalKm: 600,
      urgency: 'due_soon',
      daysOverdue: 0,
    },
    {
      id: 'tubeless_sealant',
      taskName: 'Top-up Sealant Cairan Tubeless Ban',
      intervalDays: 90,
      intervalKm: 1000,
      urgency: 'ok',
      daysOverdue: 0,
    },
  ];
});

const overdueCount = computed(() => schedules.value.filter((s) => s.urgency === 'overdue').length);
</script>

<template>
  <div class="maint-banner" :class="{ 'maint-banner--alert': overdueCount > 0 }">
    <div class="maint-banner__header">
      <div class="maint-banner__title-group">
        <span class="maint-icon">{{ overdueCount > 0 ? '⚠️' : '🛡️' }}</span>
        <div>
          <h3 class="maint-title">Jadwal Servis Berkala &amp; Perawatan</h3>
          <p class="maint-subtitle">
            {{ overdueCount > 0 ? `${overdueCount} perawatan membutuhkan perhatian Anda.` : 'Semua komponen dalam kondisi terawat.' }}
          </p>
        </div>
      </div>
    </div>

    <div class="maint-items-grid">
      <div
        v-for="item in schedules"
        :key="item.id"
        class="maint-item-card"
        :class="[`maint-item-card--${item.urgency}`]"
      >
        <div class="item-top">
          <span class="item-name">{{ item.taskName }}</span>
          <span class="urgency-tag" :class="[`urgency-tag--${item.urgency}`]">
            {{ item.urgency === 'overdue' ? 'Lewat Jadwal' : item.urgency === 'due_soon' ? 'Segera' : 'Prima' }}
          </span>
        </div>

        <div class="item-interval">
          Interval: tiap {{ item.intervalDays }} hari / {{ item.intervalKm }} km
        </div>

        <button
          type="button"
          class="log-service-btn"
          @click="emit('logService', item.taskName)"
        >
          ＋ Catat Selesai Servis
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.maint-banner {
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  border-radius: 1.25rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.maint-banner--alert {
  border-color: #FDE68A;
  background: #FFFDF5;
}

.maint-banner__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.maint-banner__title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.maint-icon {
  font-size: 1.5rem;
}

.maint-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
  color: var(--color-ink);
  letter-spacing: -0.02em;
}

.maint-subtitle {
  margin: 0.15rem 0 0 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
}

.maint-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: 0.75rem;
}

.maint-item-card {
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  border-radius: 0.85rem;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.maint-item-card--overdue {
  border-color: #FCA5A5;
  background: #FFF5F5;
}

.maint-item-card--due_soon {
  border-color: #FDE68A;
  background: #FFFFF0;
}

.item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.item-name {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-ink);
  line-height: 1.3;
}

.urgency-tag {
  font-size: 0.58rem;
  font-weight: 900;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.urgency-tag--overdue {
  background: #FEE2E2;
  color: #991B1B;
}

.urgency-tag--due_soon {
  background: #FEF3C7;
  color: #92400E;
}

.urgency-tag--ok {
  background: #DCFCE7;
  color: #166534;
}

.item-interval {
  font-size: 0.7rem;
  color: var(--color-asphalt);
}

.log-service-btn {
  margin-top: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 0.5rem;
  font-size: 0.72rem;
  font-weight: 800;
  background: var(--color-ink);
  color: var(--color-white);
  border: none;
  cursor: pointer;
  align-self: flex-start;
  transition: transform 90ms ease;
}

.log-service-btn:active {
  transform: scale(0.96);
}
</style>
