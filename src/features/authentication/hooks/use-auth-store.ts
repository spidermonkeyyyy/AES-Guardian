import { create } from 'zustand';
import { AppUser, AuthStatus, AuthFailure } from '../../../types/auth';

interface AuthStore {
  status: AuthStatus;
  user: AppUser | null;
  errorMessage: string | null;
  isOnboardingCompleted: boolean;
  setStatus: (status: AuthStatus) => void;
  setUser: (user: AppUser | null) => void;
  setError: (message: string | null) => void;
  loginSuccess: (user: AppUser) => void;
  loginFailure: (failure: AuthFailure) => void;
  logout: () => void;
  completeOnboarding: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'unauthenticated',
  user: null,
  errorMessage: null,
  isOnboardingCompleted: false,

  setStatus: (status) => set({ status }),
  setUser: (user) => set({ user }),
  setError: (errorMessage) => set({ errorMessage }),
  loginSuccess: (user) => set({ status: 'authenticated', user, errorMessage: null }),
  loginFailure: (failure) => set({ status: 'error', errorMessage: failure.userMessage }),
  logout: () => set({ status: 'unauthenticated', user: null, isOnboardingCompleted: false }),
  completeOnboarding: () => set({ isOnboardingCompleted: true }),
  clearError: () => set({ errorMessage: null }),
}));
