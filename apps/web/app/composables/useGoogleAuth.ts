declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: unknown) => void) => void;
          renderButton?: (
            element: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

export function useGoogleAuth() {
  const config = useRuntimeConfig();
  const { loginWithGoogle } = useAuth();
  const { toast, alert } = useNotify();
  const loading = ref(false);
  const error = ref('');

  function loadGoogleScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (window.google?.accounts?.id) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existing = document.getElementById('google-jssdk');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat Google Sign-In SDK.'));
      document.head.appendChild(script);
    });
  }

  async function triggerGoogleSignIn(): Promise<boolean> {
    loading.value = true;
    error.value = '';
    const clientId = (config.public.googleClientId as string) || '';

    if (!clientId) {
      alert.warning(
        'Google Client ID Belum Dikonfigurasi',
        'Silakan lengkapi GOOGLE_CLIENT_ID di file .env untuk mengaktifkan login Google.',
      );
      loading.value = false;
      return false;
    }

    try {
      await loadGoogleScript();

      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services SDK tidak dapat diakses.');
      }

      return await new Promise((resolve) => {
        window.google!.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            try {
              if (!response.credential) {
                throw new Error('Kredensial token Google tidak valid.');
              }
              await loginWithGoogle({ idToken: response.credential });
              toast.success('Berhasil Masuk!', 'Akun Google Anda berhasil terhubung.');
              await navigateTo('/me');
              resolve(true);
            } catch (err: unknown) {
              const msg = getApiErrorMessage(err);
              error.value = msg;
              alert.error('Gagal Masuk dengan Google', msg);
              resolve(false);
            } finally {
              loading.value = false;
            }
          },
          cancel_on_tap_outside: true,
        });

        // Trigger Google One-Tap / Account Selector
        window.google!.accounts.id.prompt(() => {
          // If prompt closes without selection, reset loading state
          setTimeout(() => {
            if (loading.value) loading.value = false;
          }, 3000);
        });
      });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      error.value = msg;
      alert.error('Google Sign-In Terkendala', msg);
      loading.value = false;
      return false;
    }
  }

  return {
    loading,
    error,
    triggerGoogleSignIn,
  };
}
