<script setup lang="ts">
import type { SendOtpResponse } from '@goweskit/contracts';

const api = useApi();
const { register, login } = useAuth();

// Step 1: Form Data | Step 2: OTP Verification
const step = ref<1 | 2>(1);
const displayName = ref('');
const email = ref('');
const password = ref('');
const otpCode = ref('');
const submitting = ref(false);
const sendingOtp = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');
const resendCountdown = ref(0);
const demoOtpHint = ref('');

let timerInterval: ReturnType<typeof setInterval> | undefined;

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval);
});

function startCountdown(seconds: number): void {
  resendCountdown.value = seconds;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (resendCountdown.value > 0) {
      resendCountdown.value -= 1;
    } else {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }
  }, 1000);
}

async function requestOtp(): Promise<void> {
  if (!email.value || !displayName.value || password.value.length < 8) return;
  errorMessage.value = '';
  infoMessage.value = '';
  sendingOtp.value = true;
  try {
    const res = await api<SendOtpResponse>('/auth/otp/send', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase(), purpose: 'register' },
    });
    infoMessage.value = res.message;
    if (res.demoOtp) {
      demoOtpHint.value = res.demoOtp;
    }
    step.value = 2;
    startCountdown(30);
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    sendingOtp.value = false;
  }
}

async function resendOtp(): Promise<void> {
  if (resendCountdown.value > 0) return;
  errorMessage.value = '';
  sendingOtp.value = true;
  try {
    const res = await api<SendOtpResponse>('/auth/otp/send', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase(), purpose: 'register' },
    });
    infoMessage.value = 'Kode OTP baru telah dikirimkan.';
    if (res.demoOtp) {
      demoOtpHint.value = res.demoOtp;
    }
    startCountdown(30);
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    sendingOtp.value = false;
  }
}

async function submitOtpRegistration(): Promise<void> {
  if (otpCode.value.trim().length !== 6) {
    errorMessage.value = 'Masukkan 6 digit kode OTP.';
    return;
  }

  errorMessage.value = '';
  submitting.value = true;
  try {
    await register({
      displayName: displayName.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value,
      otp: otpCode.value.trim(),
    });
    // Auto login after successful registration
    await login({
      email: email.value.trim().toLowerCase(),
      password: password.value,
    });
    await navigateTo('/me');
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

function continueWithGoogle(): void {
  // Placeholder / Trigger for Google OAuth2 Redirect or Google One Tap
  alert('Integrasi Google OAuth (Sign-in with Google) segera aktif.');
}
</script>

<template>
  <div class="native-container auth-container">
    <section class="native-auth-card" aria-labelledby="register-title">
      <!-- Header -->
      <div class="auth-header">
        <span class="auth-icon">🚴‍♂️</span>
        <span class="auth-eyebrow">Gabung Bersama Kami</span>
        <h1 id="register-title" class="auth-title">
          {{ step === 1 ? 'Daftar Akun Baru' : 'Verifikasi Kode OTP' }}
        </h1>
        <p class="auth-sub">
          {{ step === 1 ? 'Mulai catat spesifikasi sepeda, kompatibilitas komponen, dan rute gowes Anda.' : `Masukkan 6-digit kode verifikasi yang dikirim ke ${email}` }}
        </p>
      </div>

      <!-- 1-Tap Google Sign In -->
      <div v-if="step === 1" class="google-auth-wrap">
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
          <span>atau daftar dengan email</span>
        </div>
      </div>

      <!-- STEP 1: Registration Form -->
      <form v-if="step === 1" class="auth-form" @submit.prevent="requestOtp">
        <label>
          <span>Nama Lengkap / Panggilan</span>
          <input
            v-model="displayName"
            autocomplete="name"
            required
            minlength="2"
            maxlength="80"
            placeholder="Contoh: Budi Santoso"
          />
        </label>
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
            autocomplete="new-password"
            required
            minlength="8"
            maxlength="128"
            placeholder="Minimal 8 karakter"
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
          :disabled="sendingOtp"
        >
          {{ sendingOtp ? 'Mengirim Kode OTP…' : 'Kirim Kode OTP (6-Digit) →' }}
        </button>
      </form>

      <!-- STEP 2: OTP Verification Form -->
      <form v-else class="auth-form" @submit.prevent="submitOtpRegistration">
        <!-- Demo OTP quick helper if available -->
        <div v-if="demoOtpHint" class="demo-otp-helper">
          <span>Kode verifikasi Anda: <strong>{{ demoOtpHint }}</strong></span>
          <button type="button" class="btn-copy-otp" @click="otpCode = demoOtpHint">
            Gunakan Kode
          </button>
        </div>

        <label>
          <span>Kode Verifikasi 6 Digit</span>
          <input
            v-model="otpCode"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            required
            autofocus
            placeholder="123456"
            class="otp-digit-input"
          />
        </label>

        <div class="otp-resend-row">
          <button
            type="button"
            class="otp-resend-btn"
            :disabled="resendCountdown > 0 || sendingOtp"
            @click="resendOtp"
          >
            {{ resendCountdown > 0 ? `Kirim ulang kode (${resendCountdown}d)` : 'Kirim Ulang Kode OTP' }}
          </button>

          <button
            type="button"
            class="otp-back-btn"
            @click="step = 1"
          >
            ← Ubah Email
          </button>
        </div>

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
          :disabled="submitting || otpCode.length !== 6"
        >
          {{ submitting ? 'Memverifikasi…' : 'Verifikasi & Buat Akun' }}
        </button>
      </form>

      <div class="auth-footer">
        <span>Sudah punya akun? <NuxtLink to="/login">Masuk ke Akun</NuxtLink></span>
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
  gap: 1.15rem;
}

.auth-header {
  text-align: center;
  display: grid;
  gap: 0.25rem;
}

.auth-icon {
  font-size: 2.5rem;
  margin-bottom: 0.15rem;
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
  font-size: 1.45rem;
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

/* Form Styles */
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

.otp-digit-input {
  font-family: var(--font-mono);
  font-size: 1.5rem !important;
  font-weight: 900 !important;
  letter-spacing: 0.4em;
  text-align: center;
  padding: 0.75rem !important;
}

.demo-otp-helper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  font-size: 0.76rem;
}

.btn-copy-otp {
  background: #166534;
  color: #ffffff;
  border: none;
  padding: 0.25rem 0.55rem;
  border-radius: 0.45rem;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
}

.otp-resend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.otp-resend-btn,
.otp-back-btn {
  background: none;
  border: none;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  padding: 0.2rem 0;
}

.otp-resend-btn {
  color: var(--color-ink);
}

.otp-resend-btn:disabled {
  color: var(--color-asphalt);
  cursor: default;
}

.otp-back-btn {
  color: var(--color-asphalt);
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

