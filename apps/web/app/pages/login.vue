<script setup lang="ts">
const { login } = useAuth();
const { loading: googleLoading, triggerGoogleSignIn } = useGoogleAuth();
const email = ref('');
const password = ref('');
const submitting = ref(false);
const demoLoggingIn = ref(false);
const errorMessage = ref('');

async function submit(): Promise<void> {
  errorMessage.value = '';
  submitting.value = true;
  try {
    await login({ email: email.value, password: password.value });
    await navigateTo('/me');
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
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
    await navigateTo('/me');
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    demoLoggingIn.value = false;
  }
}

async function continueWithGoogle(): Promise<void> {
  errorMessage.value = '';
  await triggerGoogleSignIn();
}
</script>

<template>
  <div class="native-container auth-container">
    <section class="native-auth-card" aria-labelledby="login-title">
      <div class="auth-header">
        <span class="auth-icon">🚲</span>
        <span class="auth-eyebrow">Selamat Datang Kembali</span>
        <h1 id="login-title" class="auth-title">Masuk ke Akun</h1>
        <p class="auth-sub">Kelola garasi, catatan servis, dan kontak darurat solo-ride Anda.</p>
      </div>

      <!-- 1-Tap Google Sign In -->
      <div class="google-auth-wrap">
        <button
          type="button"
          class="google-btn"
          @click="continueWithGoogle"
        >
          <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        <div class="auth-divider">
          <span>atau masuk dengan email</span>
        </div>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label>
          <span>Alamat Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            maxlength="320"
            placeholder="nama@email.com"
          />
        </label>
        <label>
          <span>Kata Sandi</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            maxlength="128"
            placeholder="••••••••"
          />
        </label>

        <p
          v-if="errorMessage"
          class="state-card state-card--error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

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
          {{ demoLoggingIn ? 'Memuat Demo…' : '⚡ Masuk Akun Demo (1-Klik)' }}
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
