import { AuthRepository, AppUser, UserRole } from '../../types/auth';

export class MockAuthRepository implements AuthRepository {
  private currentUser: AppUser | null = null;
  private onboardingCompleted = false;

  async login(email: string, _password: string): Promise<AppUser> {
    await new Promise((r) => setTimeout(r, 200));
    const lowerEmail = email.toLowerCase().trim();

    let role: UserRole = 'exposed_professional';
    if (lowerEmail.includes('admin') || lowerEmail.includes('review')) role = 'admin_reviewer';
    else if (lowerEmail.includes('occupational') || lowerEmail.includes('work-health')) role = 'oh_professional';
    else if (lowerEmail.includes('quality')) role = 'quality_staff';
    else if (lowerEmail.includes('tech')) role = 'tech_admin';

    const user: AppUser = {
      id: `${role}-demo`,
      name: 'Utilisateur de démonstration',
      email: lowerEmail,
      role,
    };

    this.currentUser = user;
    return user;
  }

  async register(params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<AppUser> {
    await new Promise((r) => setTimeout(r, 200));
    const user: AppUser = {
      id: `user-${Date.now()}`,
      name: params.name,
      email: params.email.toLowerCase().trim(),
      role: params.role,
    };
    this.currentUser = user;
    return user;
  }

  async resetPassword(_email: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
  }

  async logout(): Promise<void> {
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<AppUser | null> {
    return this.currentUser;
  }

  async isOnboardingCompleted(): Promise<boolean> {
    return this.onboardingCompleted;
  }

  async setOnboardingCompleted(): Promise<void> {
    this.onboardingCompleted = true;
  }

  authStateChanges(): { next: (callback: (event: string, session: unknown) => void) => { cancel: () => void } } {
    const queue: { event: string; session: unknown }[] = [];
    return {
      next: (callback: (event: string, session: unknown) => void) => {
        const interval = setInterval(() => {
          if (queue.length > 0) {
            const item = queue.shift()!;
            callback(item.event, item.session);
          }
        }, 1000);
        return { cancel: () => clearInterval(interval) };
      },
    };
  }
}
