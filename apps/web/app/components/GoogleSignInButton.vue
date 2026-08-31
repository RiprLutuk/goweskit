<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text?: 'signin_with' | 'signup_with' | 'continue_with';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    width?: string;
  }>(),
  {
    text: 'continue_with',
    theme: 'outline',
    width: '100%',
  },
);

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'error', message: string): void;
}>();

const config = useRuntimeConfig();
const { loginWithGoogle } = useAuth();
const { toast, alert } = useNotify();

const buttonContainer = ref<HTMLElement | null>(null);
const loading = ref(false);
const sdkReady = ref(false);

const clientId = computed(() => (config.public.googleClientId as string) || '');

function loadGoogleSdk(): Promise<void> {
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
    script.onerror = () =>
      reject(new Error('Gagal memuat Google Sign-In SDK.'));
    document.head.appendChild(script);
  });
}

async function handleCredentialResponse(response: {
  credential: string;
}): Promise<void> {
  if (!response.credential) {
    emit('error', 'Token kredensial Google tidak ditemukan.');
    return;
  }

  loading.value = true;
  try {
    await loginWithGoogle({ idToken: response.credential });
    toast.success('Berhasil Masuk!', 'Akun Google Anda berhasil terhubung.');
    emit('success');
    await navigateTo('/me');
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err);
    alert.error('Gagal Masuk dengan Google', msg);
    emit('error', msg);
  } finally {
    loading.value = false;
  }
}

async function renderGoogleButton(): Promise<void> {
  if (!clientId.value || !buttonContainer.value) return;

  try {
    await loadGoogleSdk();
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId.value,
      callback: handleCredentialResponse,
      auto_select: false,
    });

    buttonContainer.value.innerHTML = '';
    window.google.accounts.id.renderButton?.(buttonContainer.value, {
      type: 'standard',
      shape: 'pill',
      theme: props.theme,
      text: props.text,
      size: 'large',
      logo_alignment: 'left',
      width: buttonContainer.value.offsetWidth || 340,
    });
    sdkReady.value = true;
  } catch (err) {
    console.error('Failed to initialize Google Sign-In button:', err);
  }
}

onMounted(() => {
  renderGoogleButton();
});
</script>

<template>
  <div class="google-btn-wrapper">
    <div
      ref="buttonContainer"
      class="google-rendered-target"
      :class="{ 'is-loading': loading }"
    />

    <!-- Fallback if client ID is missing -->
    <div v-if="!clientId" class="google-missing-warning">
      <small>Google Client ID belum dikonfigurasi di file .env</small>
    </div>
  </div>
</template>

<style scoped>
.google-btn-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
}

.google-rendered-target {
  width: 100%;
  display: flex;
  justify-content: center;
  transition: opacity 150ms ease;
}

.google-rendered-target.is-loading {
  opacity: 0.5;
  pointer-events: none;
}

.google-missing-warning {
  font-size: 0.72rem;
  color: #94a3b8;
  text-align: center;
}
</style>
