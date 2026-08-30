<script setup lang="ts">
const { login } = useAuth();
const { toast, alert } = useNotify();

const email = ref('');
const password = ref('');
const submitting = ref(false);
const demoLoggingIn = ref(false);
const errorMessage = ref('');

const errors = reactive({
  email: '',
  password: '',
});

function validate(): boolean {
  errors.email = '';
  errors.password = '';

  const cleanEmail = email.value.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail) {
    errors.email = 'Alamat email wajib diisi.';
  } else if (!emailRegex.test(cleanEmail)) {
    errors.email = 'Format email tidak valid (contoh: rider@goweskit.id).';
  }

  if (!password.value) {
    errors.password = 'Kata sandi wajib diisi.';
  }

  return !errors.email && !errors.password;
}

async function submit(): Promise<void> {
  if (!validate()) return;

  errorMessage.value = '';
  submitting.value = true;
  try {
    await login({ email: email.value.trim().toLowerCase(), password: password.value });
    toast.success('Berhasil Masuk!', 'Selamat datang kembali di GowesKit.');
    await navigateTo('/me');
  } catch (error: unknown) {
    const msg = getApiErrorMessage(error);
    errorMessage.value = msg;
    alert.error('Gagal Masuk', msg);
  } finally {
    submitting.value = false;
  }
}

async function quickDemoLogin(): Promise<void> {
  demoLoggingIn.value = true;
  errorMessage.value = '';
  try {
    await login({
      email: 'demo@goweskit.local',
      password: 'GowesKitDemo123!',
    });
    toast.success('Login Demo Berhasil', 'Masuk sebagai Demo Rider.');
    await navigateTo('/me');
  } catch (error: unknown) {
    const msg = getApiErrorMessage(error);
    errorMessage.value = msg;
    alert.error('Gagal Masuk Demo', msg);
  } finally {
    demoLoggingIn.value = false;
  }
}
</script>

<template>
  <div class="native-container auth-container">
    <section class="native-auth-card" aria-labelledby="login-title">
      <div class="auth-header">
        <BrandLogo size="lg" :show-tagline="false" class="auth-brand-center" />
        <span class="auth-eyebrow">Selamat Datang Kembali</span>
        <h1 id="login-title" class="auth-title">Masuk ke Akun</h1>
        <p class="auth-sub">Kelola garasi, catatan servis, dan kontak darurat solo-ride Anda.</p>
      </div>

      <!-- Google Sign In -->
      <div class="google-auth-wrap">
        <GoogleSignInButton text="continue_with" />

        <div class="auth-divider">
          <span>atau masuk dengan email</span>
        </div>
      </div>

      <form class="auth-form" novalidate @submit.prevent="submit">
        <div class="form-field">
          <label>
            <span class="field-label">Alamat Email</span>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              maxlength="320"
              placeholder="nama@email.com"
              class="input-control"
              :class="{ 'is-invalid': errors.email }"
              @input="errors.email = ''"
            />
          </label>
          <span v-if="errors.email" class="field-error-msg">
            <GIcon name="shield" size="xs" color="#EF4444" filled />
            <span>{{ errors.email }}</span>
          </span>
        </div>

        <div class="form-field">
          <label>
            <span class="field-label">Kata Sandi</span>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              maxlength="128"
              placeholder="••••••••"
              class="input-control"
              :class="{ 'is-invalid': errors.password }"
              @input="errors.password = ''"
            />
          </label>
          <span v-if="errors.password" class="field-error-msg">
            <GIcon name="shield" size="xs" color="#EF4444" filled />
            <span>{{ errors.password }}</span>
          </span>
        </div>

        <button
          class="button button--primary button--full"
          type="submit"
          :disabled="submitting"
        >
          {{ submitting ? 'Memproses Masuk…' : 'Masuk ke Akun' }}
        </button>

        <button
          class="button button--sand button--full"
          type="button"
          :disabled="demoLoggingIn"
          @click="quickDemoLogin"
        >
          <GIcon name="bolt" size="xs" color="#D97706" filled />
          <span>{{ demoLoggingIn ? 'Memuat Demo…' : 'Masuk Akun Demo (1-Klik)' }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <span>Belum punya akun? <NuxtLink to="/register">Daftar Akun Baru</NuxtLink></span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.auth-container {
  display: grid;
  place-items: center;
  min-height: calc(80vh - var(--header-height));
  padding-bottom: 2.5rem;
}

.native-auth-card {
  width: 100%;
  max-width: 26rem;
  padding: 1.5rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 6px 24px rgb(23 32 42 / 6%);
  display: grid;
  gap: 1.25rem;
}

.auth-header {
  text-align: center;
  display: grid;
  gap: 0.25rem;
}

.auth-brand-center {
  justify-content: center;
  margin-bottom: 0.35rem;
}

.auth-icon {
  font-size: 2.5rem;
  margin-bottom: 0.25rem;
}

.auth-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.04em;
}

.auth-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.auth-sub {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

/* Google Sign-in */
.google-auth-wrap {
  display: grid;
  gap: 0.85rem;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-white);
  border: 1.5px solid var(--color-sand);
  color: var(--color-ink);
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 6px rgb(23 32 42 / 4%);
  transition: background-color 120ms ease;
}

.google-btn:hover {
  background: var(--color-sand);
}

.auth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--color-asphalt);
  font-size: 0.72rem;
  font-weight: 750;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-sand);
}

.auth-divider span {
  padding: 0 0.65rem;
}

.auth-form {
  display: grid;
  gap: 0.85rem;
}

.auth-form label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.auth-form input {
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-sand);
  background: var(--color-canvas);
  font-size: 0.84rem;
  font-weight: 750;
  color: var(--color-ink);
  outline: none;
}

.auth-footer {
  text-align: center;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  padding-top: 0.5rem;
  border-top: 1px solid rgb(23 32 42 / 6%);
}

.auth-footer a {
  color: var(--color-ink);
  font-weight: 850;
}
</style>
