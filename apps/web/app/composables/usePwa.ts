interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const isOnline = ref(true);
const canInstall = ref(false);
const isStandalone = ref(false);
const isIOS = ref(false);
const showInstallGuide = ref(false);
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePwa() {
  if (import.meta.client) {
    // Check initial online status
    isOnline.value = navigator.onLine;

    // Check standalone mode (PWA installed and running)
    const isStandaloneWindow =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator &&
        (navigator as unknown as { standalone: boolean }).standalone === true);
    isStandalone.value = isStandaloneWindow;

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    isIOS.value = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window);

    // Attach online/offline listeners once
    window.addEventListener('online', () => {
      isOnline.value = true;
    });
    window.addEventListener('offline', () => {
      isOnline.value = false;
    });

    // Capture beforeinstallprompt for native install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      canInstall.value = true;
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      canInstall.value = false;
      isStandalone.value = true;
    });
  }

  async function installApp(): Promise<boolean> {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      canInstall.value = false;
      return choice.outcome === 'accepted';
    } else if (isIOS.value) {
      showInstallGuide.value = true;
      return false;
    }
    return false;
  }

  function triggerHaptic(pattern: number | number[] = 15): void {
    if (import.meta.client && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // vibration not supported / denied
      }
    }
  }

  return {
    isOnline,
    canInstall,
    isStandalone,
    isIOS,
    showInstallGuide,
    installApp,
    triggerHaptic,
  };
}
