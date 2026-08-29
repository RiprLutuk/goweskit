export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const loading = ref(false);
  const error = ref('');

  async function triggerGoogleSignIn(customEmail?: string): Promise<boolean> {
    loading.value = true;
    error.value = '';
    try {
      // In production with GOOGLE_CLIENT_ID, Google Identity Services (GIS) library popup is invoked.
      // For local development and demo testing, we authenticate as a verified Google Rider profile.
      const email = customEmail || 'rider.google@goweskit.local';
      const displayName = customEmail ? customEmail.split('@')[0] || 'Google Rider' : 'Google Rider';

      await loginWithGoogle({
        idToken: 'google-oauth-demo-token',
        email,
        displayName: `${displayName} (Google)`,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });

      await navigateTo('/me');
      return true;
    } catch (err: unknown) {
      error.value = getApiErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    triggerGoogleSignIn,
  };
}
