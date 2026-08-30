<script setup lang="ts">
import { useOfflineNavigator, type OfflineSavedRoute } from '~/composables/useOfflineNavigator';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'selectRoute', route: OfflineSavedRoute): void;
}>();

const { savedRoutes, removeOfflineRoute, exportGpxFile, isOnline } = useOfflineNavigator();

function formatDist(km: number): string {
  return `${km.toFixed(1)} km`;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="offline-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-modal-title"
      @click.self="emit('close')"
    >
      <div class="offline-modal">
        <!-- Header -->
        <div class="offline-modal__header">
          <div>
            <div class="offline-status-pill" :class="{ 'offline-status-pill--offline': !isOnline }">
              <span class="status-dot"/>
              {{ isOnline ? 'Tersambung Internet' : 'Mode Offline (Tanpa Sinyal)' }}
            </div>
            <h2 id="offline-modal-title" class="offline-title">Rute Tersimpan Offline</h2>
          </div>
          <button
            type="button"
            class="modal-close-btn"
            aria-label="Tutup"
            @click="emit('close')"
          >
            <GIcon name="close" size="xs" />
          </button>
        </div>

        <!-- Body -->
        <div class="offline-modal__body">
          <div v-if="savedRoutes.length === 0" class="empty-offline-box">
            <div class="empty-icon-box">
              <GIcon name="route" size="2xl" color="#94A3B8" />
            </div>
            <h3>Belum Ada Rute Offline</h3>
            <p>
              Simpan rute favorit saat terhubung internet agar peta elevasi dan titik koordinat tetap bisa diakses di puncak bukit atau pegunungan.
            </p>
          </div>

          <div v-else class="offline-routes-list">
            <div
              v-for="route in savedRoutes"
              :key="route.id"
              class="offline-route-card"
            >
              <div class="route-header-line">
                <span class="difficulty-chip" :class="[`difficulty-chip--${route.difficulty}`]">
                  {{ route.difficulty.toUpperCase() }}
                </span>
                <span class="route-dist-tag">{{ formatDist(route.distanceKm) }} · +{{ route.elevationGainMeters }}m</span>
              </div>

              <h3 class="route-title">{{ route.title }}</h3>
              <p v-if="route.description" class="route-desc">{{ route.description }}</p>

              <!-- Sparkline Elevation if exists -->
              <div v-if="route.elevationProfile && route.elevationProfile.length > 1" class="elevation-mini-preview">
                <span class="elevation-label">
                  <GIcon name="mountain" size="xs" /> Profil Kontur Ketinggian Tersimpan
                </span>
              </div>

              <!-- Action Bar -->
              <div class="route-action-row">
                <button
                  type="button"
                  class="btn-action btn-action--gpx"
                  title="Unduh GPX untuk Head Unit"
                  @click="exportGpxFile(route)"
                >
                  <GIcon name="download" size="xs" /> Export GPX
                </button>
                <button
                  type="button"
                  class="btn-action btn-action--delete"
                  title="Hapus dari penyimpanan lokal"
                  @click="removeOfflineRoute(route.id)"
                >
                  <GIcon name="trash" size="xs" /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="offline-modal__footer">
          <span>Data tersimpan di penyimpanan browser lokal (IndexedDB / LocalStorage).</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.offline-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.offline-modal {
  position: relative;
  width: 100%;
  max-width: 32rem;
  background: #FFFFFF;
  border-radius: 1.25rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 85vh;
}

.offline-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;
}

.offline-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  font-weight: 800;
  color: #0F766E;
  background: #F0FDFA;
  border: 1px solid #CCFBF1;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  margin-bottom: 0.35rem;
}

.offline-status-pill--offline {
  color: #B45309;
  background: #FFFBEB;
  border-color: #FDE68A;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.offline-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: #17202A;
  letter-spacing: -0.02em;
}

.modal-close-btn {
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.offline-modal__body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.empty-offline-box {
  text-align: center;
  padding: 2.5rem 1rem;
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-offline-box h3 {
  margin: 0 0 0.4rem 0;
  font-size: 1.1rem;
  font-weight: 850;
  color: #17202A;
}

.empty-offline-box p {
  margin: 0;
  font-size: 0.82rem;
  color: #64748B;
  line-height: 1.45;
}

.offline-routes-list {
  display: grid;
  gap: 1rem;
}

.offline-route-card {
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.route-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.difficulty-chip {
  font-size: 0.6rem;
  font-weight: 900;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.difficulty-chip--easy {
  background: #DCFCE7;
  color: #166534;
}

.difficulty-chip--moderate {
  background: #FEF3C7;
  color: #92400E;
}

.difficulty-chip--hard {
  background: #FFEDD5;
  color: #9A3412;
}

.difficulty-chip--extreme {
  background: #FEE2E2;
  color: #991B1B;
}

.route-dist-tag {
  font-size: 0.72rem;
  font-weight: 800;
  color: #475569;
}

.route-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 850;
  color: #17202A;
}

.route-desc {
  margin: 0;
  font-size: 0.78rem;
  color: #64748B;
  line-height: 1.4;
}

.elevation-mini-preview {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  padding: 0.35rem 0.6rem;
  margin-top: 0.2rem;
}

.elevation-label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #0F766E;
}

.route-action-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-action {
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: transform 90ms ease;
}

.btn-action:active {
  transform: scale(0.97);
}

.btn-action--gpx {
  background: #17202A;
  color: #FFFFFF;
  border: none;
  flex: 1;
  justify-content: center;
}

.btn-action--delete {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #64748B;
}

.offline-modal__footer {
  padding: 0.75rem 1.5rem;
  background: #F8FAFC;
  border-top: 1px solid #E2E8F0;
  font-size: 0.68rem;
  color: #94A3B8;
  text-align: center;
}
</style>
