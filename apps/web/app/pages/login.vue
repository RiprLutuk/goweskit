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
    </form>
    <p class="form-footer">
      New here? <NuxtLink to="/register">Create an account</NuxtLink>.
    </p>
  </section>
</template>
