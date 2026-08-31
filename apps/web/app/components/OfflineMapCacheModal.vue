<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    centerLat?: number;
    centerLon?: number;
    areaName?: string;
  }>(),
  {
    centerLat: -6.595,
    centerLon: 106.816,
    areaName: 'Jabodetabek & Sentul Hills',
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { toast } = useNotify();
const {
  isCaching,
  downloadProgress,
  cacheStatus,
  cacheRegion,
  clearOfflineCache,
} = useOfflineMapCache();

async function handleDownloadCache() {
  try {
    const res = await cacheRegion(props.centerLat, props.centerLon, 8);
    toast.success(
      'Peta Offline Berhasil Disimpan!',
      `${res.tileCount} tile peta siap diakses tanpa sinyal internet.`,
    );
  } catch (err: unknown) {
    toast.error(
      'Gagal Mengunduh Peta',
      err instanceof Error ? err.message : 'Silakan coba kembali.',
    );
  }
}

async function handleClearCache() {
  await clearOfflineCache();
  toast.info(
    'Cache Peta Dihapus',
    'Penyimpanan lokal perangkat telah dibersihkan.',
  );
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="offline-modal-card">
      <header class="modal-head">
        <div class="head-title">
          <GIcon name="map" size="sm" color="var(--color-chain-lime)" />
          <strong>Cache Peta Offline Gowes</strong>
        </div>
        <button type="button" class="btn-close" @click="emit('close')">
          <GIcon name="close" size="xs" />
        </button>
      </header>

      <div class="modal-body">
        <div class="status-summary-box">
          <div class="status-icon-col">
            <span v-if="cacheStatus.isAvailable" class="status-indicator active"
              >✓</span
            >
            <span v-else class="status-indicator empty">!</span>
          </div>
          <div class="status-info-col">
            <strong>{{
              cacheStatus.isAvailable
                ? 'Peta Siap Digunakan Offline'
                : 'Belum Ada Peta Tersimpan'
            }}</strong>
            <small
              >{{ cacheStatus.tileCount }} tiles ·
              {{ cacheStatus.approximateSizeMb }} MB
              {{
                cacheStatus.lastUpdated
                  ? `· Update: ${cacheStatus.lastUpdated}`
                  : ''
              }}</small
            >
          </div>
        </div>

        <p class="modal-tip">
          💡 <strong>Tips Gowes Hutan/Pelosok:</strong> Unduh peta area sebelum
          memulai gowes agar navigasi GPS &amp; visual rute tetap tampil
          meskipun kehilangan sinyal seluler di pegunungan.
        </p>

        <!-- Download Progress Bar -->
        <div v-if="isCaching" class="progress-box">
          <div class="progress-label-row">
            <span>Mengunduh tile peta area {{ areaName }}...</span>
            <strong>{{ downloadProgress }}%</strong>
          </div>
          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              :style="{ width: `${downloadProgress}%` }"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-stack">
          <button
            type="button"
            class="btn-cache-primary"
            :disabled="isCaching"
            @click="handleDownloadCache"
          >
            <GIcon name="download" size="xs" />
            <span>{{
              isCaching
                ? 'Sedang Mengunduh Tile Peta...'
                : `Unduh Peta Offline Area Ini (${areaName})`
            }}</span>
          </button>

          <button
            v-if="cacheStatus.isAvailable"
            type="button"
            class="btn-cache-danger"
            :disabled="isCaching"
            @click="handleClearCache"
          >
            <GIcon name="trash" size="xs" />
            <span>Hapus Penyimpanan Cache Peta</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 16, 0.85);
  backdrop-filter: blur(8px);
  z-index: 130;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.offline-modal-card {
  background: #0d1527;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 28rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.head-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 850;
  color: #f8fafc;
}

.btn-close {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #94a3b8;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-summary-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  padding: 0.85rem 1rem;
}

.status-indicator {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 900;
}

.status-indicator.active {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1.5px solid #22c55e;
}

.status-indicator.empty {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
  border: 1.5px solid #eab308;
}

.status-info-col {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.status-info-col strong {
  font-size: 0.88rem;
  color: #f8fafc;
}

.status-info-col small {
  font-size: 0.72rem;
  color: #94a3b8;
}

.modal-tip {
  margin: 0;
  font-size: 0.78rem;
  color: #94a3b8;
  line-height: 1.45;
  background: rgba(201, 243, 106, 0.05);
  border: 1px dashed rgba(201, 243, 106, 0.25);
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.progress-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.progress-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.74rem;
  color: #cbd5e1;
}

.progress-bar-track {
  width: 100%;
  height: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-chain-lime);
  border-radius: 9999px;
  transition: width 150ms ease;
}

.action-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-cache-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 850;
  cursor: pointer;
}

.btn-cache-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cache-danger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 0.6rem;
  border-radius: 0.75rem;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}
</style>
