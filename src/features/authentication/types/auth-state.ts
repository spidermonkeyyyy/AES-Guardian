import { AuthStatus, AppUser } from '../../../types/auth';

export interface AuthState {
  status: AuthStatus;
  user: AppUser | null;
  errorMessage: string | null;
}
