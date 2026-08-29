<script setup lang="ts">
const { register } = useAuth();
const displayName = ref('');
const email = ref('');
const password = ref('');
const submitting = ref(false);
const errorMessage = ref('');

async function submit(): Promise<void> {
  errorMessage.value = '';
  submitting.value = true;
  try {
    await register({
      displayName: displayName.value,
      email: email.value,
      password: password.value,
    });
    await navigateTo('/login');
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="native-container auth-container">
    <section class="native-auth-card" aria-labelledby="register-title">
      <div class="auth-header">
        <span class="auth-icon">🚴‍♂️</span>
        <span class="auth-eyebrow">Gabung Bersama Kami</span>
        <h1 id="register-title" class="auth-title">Daftar Akun Baru</h1>
        <p class="auth-sub">Mulai catat spesifikasi sepeda, kompatibilitas suku cadang, dan rute gowes Anda.</p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
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
          :disabled="submitting"
        >
          {{ submitting ? 'Membuat Akun…' : 'Daftar Akun' }}
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
