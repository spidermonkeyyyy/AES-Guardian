import { useState, useEffect } from 'react';
import { login } from './use-auth';
import { AppUser, AuthFailure, AuthStatus } from '../../../types/auth';

export function useLogin() {
  const [status, setStatus] = useState<AuthStatus>('authenticating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);

  const execute = async (email: string, password: string) => {
    setStatus('authenticating');
    setErrorMessage(null);
    try {
      const user = await login(email, password);
      setUser(user as any);
      setStatus('authenticated');
      return true;
    } catch (e) {
      setStatus('error');
      setErrorMessage((e as AuthFailure).userMessage ?? 'Connexion échouée.');
      return false;
    }
  };

  return { status, user, errorMessage, execute, clearError: () => setErrorMessage(null) };
}
