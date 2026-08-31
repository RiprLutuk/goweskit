<script setup lang="ts">
const {
  canInstall,
  isStandalone,
  isIOS,
  showInstallGuide,
  installApp,
  triggerHaptic,
} = usePwa();
const dismissed = ref(false);

const shouldShowBanner = computed(() => {
  if (dismissed.value || isStandalone.value) return false;
  return canInstall.value || isIOS.value;
});

async function handleInstall(): Promise<void> {
  triggerHaptic(25);
  await installApp();
}

function dismissBanner(): void {
  triggerHaptic(10);
  dismissed.value = true;
  showInstallGuide.value = false;
}
</script>

<template>
  <div>
    <!-- Native App Install Floating Strip / Banner -->
    <aside
      v-if="shouldShowBanner && !showInstallGuide"
      class="pwa-banner"
      role="region"
      aria-label="Install GowesKit app"
    >
      <div class="pwa-banner__icon">
        <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden="true">
          <rect width="48" height="48" rx="10" fill="#17202a" />
          <circle
            cx="14"
            cy="30"
            r="8"
            fill="none"
            stroke="#8eddf4"
            stroke-width="3"
          />
          <circle
            cx="34"
            cy="30"
            r="8"
            fill="none"
            stroke="#8eddf4"
            stroke-width="3"
          />
          <path
            d="m14 30 8-14 7 14H14Zm8-14h8m-11-4h6"
            fill="none"
            stroke="#c9f36a"
            stroke-width="3"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <div class="pwa-banner__text">
        <strong>Install GowesKit App</strong>
        <p>Works offline on remote trails · Instant access from home screen</p>
      </div>

      <div class="pwa-banner__actions">
        <button
          v-if="canInstall"
          class="button button--primary button--sm pwa-install-btn"
          type="button"
          @click="handleInstall"
        >
          Install
        </button>
        <button
          v-else-if="isIOS"
          class="button button--primary button--sm pwa-install-btn"
          type="button"
          @click="showInstallGuide = true"
        >
          Add to Home
        </button>
        <button
          class="pwa-close-btn"
          type="button"
          aria-label="Dismiss install banner"
          @click="dismissBanner"
        >
          ✕
        </button>
      </div>
    </aside>

    <!-- iOS Add to Home Screen Step-by-Step Modal -->
    <div
      v-if="showInstallGuide"
      class="pwa-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-guide-title"
      @click.self="showInstallGuide = false"
    >
      <div class="pwa-modal">
        <div class="pwa-modal__header">
          <div class="pwa-modal__brand">
            <span class="pwa-modal__icon">📱</span>
            <div>
              <p class="technical-label">iOS / iPadOS Guide</p>
              <h2 id="ios-guide-title">Install GowesKit on iPhone</h2>
            </div>
          </div>
          <button
            class="text-button pwa-modal__close"
            type="button"
            aria-label="Close guide"
            @click="showInstallGuide = false"
          >
            ✕
          </button>
        </div>

        <p class="pwa-modal__desc">
          Install GowesKit on your home screen for full-screen offline access
          without browser address bars:
        </p>

        <ol class="ios-steps-list">
          <li class="ios-step">
            <span class="ios-step__num">1</span>
            <div>
              <strong>Tap the Share button</strong>
              <p>
                In Safari's bottom or top navigation bar (the square with an
                arrow pointing up <span class="ios-icon">⎙</span>).
              </p>
            </div>
          </li>
          <li class="ios-step">
            <span class="ios-step__num">2</span>
            <div>
              <strong>Select "Add to Home Screen"</strong>
              <p>
                Scroll down the share sheet and tap
                <strong>Add to Home Screen</strong> (<span class="ios-icon"
                  >⊞</span
                >).
              </p>
            </div>
          </li>
          <li class="ios-step">
            <span class="ios-step__num">3</span>
            <div>
              <strong>Tap "Add" in top-right</strong>
              <p>
                Confirm the name. GowesKit will appear on your home screen ready
                to ride!
              </p>
            </div>
          </li>
        </ol>

        <div class="action-row">
          <button
            class="button button--primary"
            type="button"
            @click="showInstallGuide = false"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pwa-banner {
  position: fixed;
  z-index: 99;
  top: max(0.75rem, env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(100% - 1.5rem), 38rem);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgb(23 32 42 / 18%);
  border-radius: 1.1rem;
  background: rgb(255 255 255 / 96%);
  box-shadow: 0 10px 30px rgb(23 32 42 / 16%);
  backdrop-filter: blur(12px);
  animation: slideDown 250ms cubic-bezier(0.16, 1, 0.3, 1);
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

.pwa-banner__icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.pwa-banner__text {
  flex: 1;
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.pwa-banner__text strong {
  font-size: 0.85rem;
  color: var(--color-ink);
}

.pwa-banner__text p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pwa-banner__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pwa-install-btn {
  min-height: 2.2rem;
  padding: 0.3rem 0.75rem;
  font-size: 0.78rem;
  background: var(--color-ink);
  color: var(--color-white);
  border-radius: 0.65rem;
}

.pwa-close-btn {
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border: none;
  background: transparent;
  color: var(--color-asphalt);
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 50%;
}

.pwa-close-btn:hover {
  background: var(--color-sand);
  color: var(--color-ink);
}

/* Modal */
.pwa-modal-overlay {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(23 32 42 / 60%);
  backdrop-filter: blur(8px);
  animation: fadeIn 180ms ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.pwa-modal {
  width: min(100%, 32rem);
  padding: 1.5rem;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-card);
  background: var(--color-canvas);
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 1.2rem;
  animation: popIn 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  from {
    transform: scale(0.94);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.pwa-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pwa-modal__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pwa-modal__icon {
  font-size: 1.8rem;
}

.pwa-modal__brand h2 {
  margin: 0;
  font-size: 1.25rem;
}

.pwa-modal__desc {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.88rem;
  line-height: 1.55;
}

.ios-steps-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.85rem;
}

.ios-step {
  display: grid;
  grid-template-columns: 2rem 1fr;
  gap: 0.85rem;
  align-items: start;
  padding: 0.75rem;
  border-radius: 0.85rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.ios-step__num {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  background: var(--color-chain-lime);
  font-weight: 900;
  font-size: 0.85rem;
}

.ios-step strong {
  display: block;
  font-size: 0.88rem;
}

.ios-step p {
  margin: 0.2rem 0 0;
  color: var(--color-asphalt);
  font-size: 0.78rem;
  line-height: 1.4;
}

.ios-icon {
  display: inline-block;
  padding: 0.1rem 0.35rem;
  border-radius: 0.3rem;
  background: var(--color-sand);
  font-family: ui-monospace, monospace;
}
</style>
