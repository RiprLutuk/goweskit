<script setup lang="ts">
const {
  isLiveGps,
  gpsStatus,
  showPromptBanner,
  dismissPromptBanner,
  requestLocation,
} = useUserLocation();
const { triggerHaptic } = usePwa();
const requesting = ref(false);

async function handleAllowLocation(): Promise<void> {
  triggerHaptic(20);
  requesting.value = true;
  try {
    await requestLocation(true);
  } finally {
    requesting.value = false;
  }
}

function handleDismiss(): void {
  triggerHaptic(10);
  dismissPromptBanner();
}
</script>

<template>
  <aside
    v-if="showPromptBanner && !isLiveGps"
    class="location-banner"
    role="region"
    aria-label="Izin Akses Lokasi GPS"
  >
    <div class="location-banner__icon-box" aria-hidden="true">
      <div class="location-beacon-pulse" />
      <GIcon
        name="radar"
        size="sm"
        color="#0F766E"
        class="location-beacon-icon"
      />
    </div>

    <div class="location-banner__body">
      <div class="location-banner__top">
        <strong class="location-banner__title">Aktifkan Lokasi GPS</strong>
        <span class="location-banner__pill">Live Cockpit</span>
      </div>
      <p
        v-if="gpsStatus === 'denied'"
        class="location-banner__desc location-banner__desc--warn"
      >
        Akses lokasi diblokir di browser. Klik ikon setelan di URL bar untuk
        mengizinkan.
      </p>
      <p v-else class="location-banner__desc">
        Dapatkan ramalan cuaca real-time &amp; rute gowes terdekat di kotamu.
      </p>
    </div>

    <div class="location-banner__actions">
      <button
        v-if="gpsStatus !== 'denied'"
        type="button"
        class="location-allow-btn"
        :disabled="requesting"
        @click="handleAllowLocation"
      >
        <span v-if="requesting">Mendeteksi…</span>
        <span v-else>Izinkan Lokasi</span>
      </button>
      <button
        type="button"
        class="location-close-btn"
        aria-label="Tutup pemberitahuan lokasi"
        @click="handleDismiss"
      >
        ✕
      </button>
    </div>
  </aside>
</template>

<style scoped>
.location-banner {
  position: fixed;
  z-index: 98;
  top: max(0.75rem, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(100% - 1.5rem), 38rem);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid rgba(201, 243, 106, 0.45);
  border-radius: 1.15rem;
  background: rgba(23, 32, 42, 0.96);
  color: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  animation: slideDown 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.location-banner__icon-box {
  position: relative;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.75rem;
  background: rgba(201, 243, 106, 0.15);
  border: 1px solid rgba(201, 243, 106, 0.3);
}

.location-beacon-pulse {
  position: absolute;
  inset: -2px;
  border-radius: 0.85rem;
  border: 1.5px solid var(--color-chain-lime);
  opacity: 0.6;
  animation: radarPing 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes radarPing {
  0% {
    transform: scale(0.95);
    opacity: 0.8;
  }
  70%,
  100% {
    transform: scale(1.25);
    opacity: 0;
  }
}

.location-beacon-icon {
  font-size: 1.15rem;
  position: relative;
  z-index: 2;
}

.location-banner__body {
  flex: 1;
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.location-banner__top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.location-banner__title {
  font-size: 0.84rem;
  font-weight: 850;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.location-banner__pill {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-chain-lime);
  background: rgba(201, 243, 106, 0.15);
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  border: 1px solid rgba(201, 243, 106, 0.3);
}

.location-banner__desc {
  margin: 0;
  color: #94a3b8;
  font-size: 0.72rem;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location-banner__desc--warn {
  color: #fbbf24;
}

.location-banner__actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.location-allow-btn {
  min-height: 2.15rem;
  padding: 0.3rem 0.8rem;
  font-size: 0.76rem;
  font-weight: 850;
  background: var(--color-chain-lime);
  color: #17202a;
  border: 1px solid #17202a;
  border-radius: 0.65rem;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 90ms ease,
    opacity 90ms ease;
}

.location-allow-btn:hover {
  opacity: 0.92;
}

.location-allow-btn:active {
  transform: scale(0.96);
}

.location-close-btn {
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 50%;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}

.location-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}
</style>
