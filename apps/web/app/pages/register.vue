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
  <section class="form-card" aria-labelledby="register-title">
    <p class="welcome-card__eyebrow">Your first ride</p>
    <h1 id="register-title">Create your GowesKit account.</h1>
    <form class="form-stack" @submit.prevent="submit">
      <label>
        <span>Display name</span>
        <input
          v-model="displayName"
          autocomplete="name"
          required
          minlength="2"
          maxlength="80"
        />
      </label>
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
          autocomplete="new-password"
          required
          minlength="8"
          maxlength="128"
        />
        <small>Use at least 8 characters.</small>
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
        {{ submitting ? 'Creating account…' : 'Create account' }}
      </button>
    </form>
    <p class="form-footer">
      Already registered? <NuxtLink to="/login">Sign in</NuxtLink>.
    </p>
  </section>
</template>
