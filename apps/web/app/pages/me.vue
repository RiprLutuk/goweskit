<script setup lang="ts">
const { user, initialized, refresh, logout } = useAuth();
const errorMessage = ref('');
const signingOut = ref(false);

onMounted(async () => {
  if (!initialized.value) await refresh();
});

async function signOut(): Promise<void> {
  signingOut.value = true;
  errorMessage.value = '';
  try {
    await logout();
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    signingOut.value = false;
  }
}
</script>

<template>
  <section class="form-card" aria-labelledby="account-title">
    <p class="welcome-card__eyebrow">Me</p>
    <h1 id="account-title">Your GowesKit account</h1>

    <p v-if="!initialized" class="state-card" role="status">
      Checking your session…
    </p>
    <div v-else-if="user" class="profile-block">
      <span class="profile-block__avatar" aria-hidden="true">{{
        user.displayName.slice(0, 1)
      }}</span>
      <div>
        <strong>{{ user.displayName }}</strong>
        <p>{{ user.email }}</p>
      </div>
      <button
        class="button button--secondary"
        type="button"
        :disabled="signingOut"
        @click="signOut"
      >
        {{ signingOut ? 'Signing out…' : 'Sign out' }}
      </button>
      <NuxtLink class="button button--secondary" to="/safety">
        Manage Ride Safety
      </NuxtLink>
    </div>
    <div v-else class="signed-out-state">
      <p>Sign in to create bikes, save unknown specs, and use Upgrade Lab.</p>
      <div class="action-row">
        <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
        <NuxtLink class="button button--secondary" to="/register"
          >Create account</NuxtLink
        >
      </div>
    </div>
    <p
      v-if="errorMessage"
      class="form-message form-message--error"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </section>
</template>
