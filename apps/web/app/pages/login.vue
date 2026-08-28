<script setup lang="ts">
const { login } = useAuth();
const email = ref('');
const password = ref('');
const submitting = ref(false);
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

async function fillDemoAndLogin(): Promise<void> {
  email.value = 'demo@goweskit.local';
  password.value = 'GowesKitDemo123!';
  await submit();
}
</script>

<template>
  <section class="form-card" aria-labelledby="login-title">
    <p class="welcome-card__eyebrow">Welcome back</p>
    <h1 id="login-title">Sign in to your Garage.</h1>
    <form class="form-stack" @submit.prevent="submit">
      <label>
        <span>Email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          maxlength="320"
        />
      </label>
      <label>
        <span>Password</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          maxlength="128"
        />
      </label>
      <p
        v-if="errorMessage"
        class="form-message form-message--error"
        role="alert"
      >
        {{ errorMessage }}
      </p>
      <button
        class="button button--primary"
        type="submit"
        :disabled="submitting"
      >
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>

      <div class="demo-login-box">
        <p class="demo-login-box__title">🧪 Quick Testing Mode</p>
        <p class="demo-login-box__desc">
          Sign in instantly using the pre-seeded GowesKit demo account (with 4
          bikes, maintenance logs, and trusted contacts).
        </p>
        <button
          class="button button--secondary button--demo"
          type="button"
          :disabled="submitting"
          @click="fillDemoAndLogin"
        >
          Sign in with Demo Account
        </button>
      </div>
    </form>
    <p class="form-footer">
      New here? <NuxtLink to="/register">Create an account</NuxtLink>.
    </p>
  </section>
</template>

<style scoped>
.demo-login-box {
  margin-top: 1.25rem;
  padding: 1rem;
  border: 1px dashed rgb(64 80 95 / 24%);
  border-radius: 0.9rem;
  background: rgb(201 243 106 / 20%);
}
.demo-login-box__title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 800;
}
.demo-login-box__desc {
  margin: 0.35rem 0 0.75rem;
  color: var(--color-asphalt);
  font-size: 0.78rem;
  line-height: 1.45;
}
.button--demo {
  width: 100%;
  border-color: var(--color-ink);
  background: var(--color-white);
  font-weight: 800;
}
</style>
