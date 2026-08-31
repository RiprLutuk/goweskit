import type {
  AuthUserResponse,
  GoogleAuthRequest,
  LoginRequest,
  RegisterRequest,
  User,
} from '@goweskit/contracts';

export function useAuth() {
  const api = useApi();
  const user = useState<User | null>('auth-user', () => null);
  const initialized = useState('auth-initialized', () => false);

  async function refresh(): Promise<User | null> {
    try {
      const response = await api<AuthUserResponse>('/auth/me');
      user.value = response.user;
    } catch {
      user.value = null;
    } finally {
      initialized.value = true;
    }
    return user.value;
  }

  async function register(input: RegisterRequest): Promise<User> {
    const response = await api<AuthUserResponse>('/auth/register', {
      method: 'POST',
      body: input,
    });
    return response.user;
  }

  async function login(input: LoginRequest): Promise<User> {
    const response = await api<AuthUserResponse>('/auth/login', {
      method: 'POST',
      body: input,
    });
    user.value = response.user;
    initialized.value = true;
    return response.user;
  }

  async function loginWithGoogle(input: GoogleAuthRequest): Promise<User> {
    const response = await api<AuthUserResponse>('/auth/google', {
      method: 'POST',
      body: input,
    });
    user.value = response.user;
    initialized.value = true;
    return response.user;
  }

  async function logout(): Promise<void> {
    await api('/auth/logout', { method: 'POST' });
    user.value = null;
    initialized.value = true;
  }

  return {
    user,
    initialized,
    refresh,
    register,
    login,
    loginWithGoogle,
    logout,
  };
}
