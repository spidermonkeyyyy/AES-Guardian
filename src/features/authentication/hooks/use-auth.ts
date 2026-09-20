import { AppUser, AuthStatus } from '../../../types/auth';
import { useAuthStore } from '../hooks/use-auth-store';
import { MockAuthRepository } from '../../../services/repositories/auth-repository.mock';

const repo = new MockAuthRepository();

export async function login(email: string, password: string): Promise<boolean> {
  useAuthStore.getState().setStatus('authenticating');
  useAuthStore.getState().setError(null);
  try {
    const user = await repo.login(email, password);
    useAuthStore.getState().loginSuccess(user);
    return true;
  } catch (e) {
    useAuthStore.getState().loginFailure({
      type: 'invalid_credentials',
      userMessage: 'Email ou mot de passe incorrect.',
    });
    return false;
  }
}

export async function register(params: {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'nurse' | 'pneumologist' | 'admin';
  phone?: string;
  dateOfBirth?: string;
}): Promise<boolean> {
  useAuthStore.getState().setStatus('authenticating');
  useAuthStore.getState().setError(null);
  try {
    const user = await repo.register(params);
    useAuthStore.getState().loginSuccess(user);
    return true;
  } catch (e) {
    useAuthStore.getState().loginFailure({
      type: 'unknown',
      userMessage: 'Inscription échouée. Veuillez réessayer.',
    });
    return false;
  }
}

export async function logout(): Promise<void> {
  await repo.logout();
  useAuthStore.getState().logout();
}

export async function resetPassword(email: string): Promise<void> {
  useAuthStore.getState().setError(null);
  await repo.resetPassword(email);
}

export async function restoreSession(): Promise<void> {
  useAuthStore.getState().setStatus('initializing');
  try {
    const user = await repo.getCurrentUser();
    if (user) {
      useAuthStore.getState().loginSuccess(user);
    } else {
      useAuthStore.getState().setStatus('unauthenticated');
    }
  } catch {
    useAuthStore.getState().setStatus('unauthenticated');
  }
}

export function getCurrentAuthState(): { status: AuthStatus; user: AppUser | null; errorMessage: string | null } {
  const s = useAuthStore.getState();
  return { status: s.status, user: s.user, errorMessage: s.errorMessage };
}
