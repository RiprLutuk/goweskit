<script setup lang="ts">
const { isOnline } = usePwa();
const wasOffline = ref(false);
const showRestored = ref(false);

watch(isOnline, (online) => {
  if (!online) {
    wasOffline.value = true;
    showRestored.value = false;
  } else if (wasOffline.value) {
    showRestored.value = true;
    setTimeout(() => {
      showRestored.value = false;
      wasOffline.value = false;
    }, 3500);
  }
});
</script>

<template>
  <div class="offline-banner-wrap" aria-live="polite">
    <!-- Disconnected Offline Pill -->
    <div v-if="!isOnline" class="offline-pill offline-pill--disconnected">
      <span class="offline-dot" aria-hidden="true" />
      <span><strong>Offline Mode</strong> · Viewing cached workshop data</span>
    </div>

    <!-- Reconnected Pill -->
    <div v-else-if="showRestored" class="offline-pill offline-pill--restored">
      <span class="online-dot" aria-hidden="true" />
      <span><strong>Connected</strong> · Synced with GowesKit Cloud</span>
    </div>
  </div>
</template>

<style scoped>
.offline-banner-wrap {
  position: fixed;
  z-index: 98;
  top: max(0.5rem, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.offline-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  box-shadow: 0 4px 15px rgb(23 32 42 / 12%);
  backdrop-filter: blur(8px);
  animation: dropIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

@keyframes dropIn {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.offline-pill--disconnected {
  background: rgb(255 255 255 / 96%);
  border: 1px solid var(--color-coral);
  color: var(--color-ink);
}

.offline-pill--restored {
  background: rgb(255 255 255 / 96%);
  border: 1px solid var(--color-chain-lime);
  color: #2b7a1e;
}

.offline-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--color-coral);
  animation: pulse 1.5s infinite;
}

.online-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #2b7a1e;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.3);
  }
}
</style>
