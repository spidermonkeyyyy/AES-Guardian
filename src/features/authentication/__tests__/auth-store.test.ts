import { useAuthStore } from '../hooks/use-auth-store';

describe('Auth State Machine', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'initializing',
      user: null,
      errorMessage: null,
      isOnboardingCompleted: false,
    });
  });

  it('starts in initializing state', () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('initializing');
    expect(state.user).toBeNull();
    expect(state.errorMessage).toBeNull();
  });

  it('loginSuccess transitions to authenticated', () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'exposed_professional' as const };
    useAuthStore.getState().loginSuccess(user);
    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(user);
    expect(state.errorMessage).toBeNull();
  });

  it('loginFailure transitions to error', () => {
    useAuthStore.getState().loginFailure({ type: 'invalid_credentials', userMessage: 'Invalid credentials' });
    const state = useAuthStore.getState();
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Invalid credentials');
  });

  it('logout transitions to unauthenticated', () => {
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'exposed_professional' as const };
    useAuthStore.getState().loginSuccess(user);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
  });

  it('logout resets onboardingCompleted', () => {
    useAuthStore.setState({ isOnboardingCompleted: true });
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'exposed_professional' as const };
    useAuthStore.getState().loginSuccess(user);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isOnboardingCompleted).toBe(false);
  });

  it('clearError removes error message', () => {
    useAuthStore.getState().loginFailure({ type: 'invalid_credentials', userMessage: 'Invalid' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().errorMessage).toBeNull();
  });

  it('setStatus updates status', () => {
    useAuthStore.getState().setStatus('authenticating');
    expect(useAuthStore.getState().status).toBe('authenticating');
  });
});
