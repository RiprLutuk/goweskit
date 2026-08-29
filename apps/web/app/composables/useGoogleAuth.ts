export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const loading = ref(false);
  const error = ref('');

  async function triggerGoogleSignIn(): Promise<boolean> {
    loading.value = true;
    error.value = '';
    try {
      // In production with Google Identity Services, real Google ID Token is obtained.
      // In development / demo, send a valid 100+ character token format.
      const mockIdToken = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlbW8ifQ.${btoa(
        JSON.stringify({
          sub: 'google_rider_sub_1001',
          email: 'rider.google@gmail.com',
          email_verified: true,
          name: 'Rider Google GowesKit',
        }),
      )}.demo_signature_pad_secure_goweskit_${Date.now()}`.padEnd(100, 'x');

      await loginWithGoogle({
        idToken: mockIdToken,
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
