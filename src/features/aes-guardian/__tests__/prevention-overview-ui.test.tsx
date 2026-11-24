import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PreventionOverviewScreen } from '../screens/PreventionOverviewScreen';
import { useDemoRoleStore } from '../../../core/auth/use-demo-role';
import { setLocale, t } from '../../../localization';

jest.setTimeout(15000);

const mockNavigate = jest.fn();
const mockGetPreventionOverview = jest.fn();
const mockGetSurveillanceMetrics = jest.fn();
const mockFocusListeners: Array<() => void> = [];
const mockNavigation = {
  navigate: mockNavigate,
  addListener: (_event: string, listener: () => void) => {
    mockFocusListeners.push(listener);
    return () => {
      const index = mockFocusListeners.indexOf(listener);
      if (index >= 0) mockFocusListeners.splice(index, 1);
    };
  },
};

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => mockNavigation,
  };
});

jest.mock('../../../core', () => {
  const actual = jest.requireActual('../../../core');
  return {
    ...actual,
    getDatabase: jest.fn(() => ({
      getPreventionOverview: mockGetPreventionOverview,
      getSurveillanceDashboardMetrics: mockGetSurveillanceMetrics,
    })),
  };
});

const overview = {
  total: 9,
  proposed: 3,
  in_progress: 2,
  completed: 3,
  cancelled: 1,
};

describe('PreventionOverviewScreen AES UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusListeners.length = 0;
    setLocale('fr');
    useDemoRoleStore.getState().setRole('quality_staff');
    mockGetPreventionOverview.mockResolvedValue(overview);
    mockGetSurveillanceMetrics.mockResolvedValue({
      overview: { totalDeclarations: 6 },
    });
  });

  test('quality staff renders aggregate metrics', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-total')).toBeTruthy());
    expect(getByTestId('prevention-overview-count-proposed').props.children).toBe(3);
    expect(getByTestId('prevention-overview-count-in_progress').props.children).toBe(2);
    expect(getByTestId('prevention-overview-count-completed').props.children).toBe(3);
    expect(getByTestId('prevention-overview-count-cancelled').props.children).toBe(1);
    expect(getByTestId('prevention-overview-declaration-count').props.children).toBe(6);
  });

  test('Overview reads the globally active identity and has no independent role selector', async () => {
    const screen = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalledWith(4));
    expect(screen.queryByTestId('prevention-role-switcher')).toBeNull();
    expect(screen.queryByTestId('prevention-role-quality_staff')).toBeNull();

    act(() => useDemoRoleStore.getState().setRole('admin_reviewer'));
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenLastCalledWith(2));
    expect(screen.queryByTestId('prevention-overview-create-action')).toBeNull();
    expect(screen.getByTestId('prevention-overview-active-role').props.children).toBeTruthy();
  });

  test.each([
    ['oh_professional', 3],
    ['admin_reviewer', 2],
  ] as const)('%s renders the overview read-only from global state', async (role, userId) => {
    act(() => useDemoRoleStore.getState().setRole(role));
    const { getByTestId, queryByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalledWith(userId));
    expect(getByTestId('prevention-overview')).toBeTruthy();
    expect(queryByTestId('prevention-overview-create-action')).toBeNull();
  });

  test.each(['exposed_professional', 'tech_admin'] as const)('%s is denied from global state', (role) => {
    act(() => useDemoRoleStore.getState().setRole(role));
    const { getByTestId } = render(<PreventionOverviewScreen />);
    expect(getByTestId('prevention-overview-unauthorized')).toBeTruthy();
    expect(mockGetPreventionOverview).not.toHaveBeenCalled();
  });

  test.each([
    ['fr', 'quality_staff'],
    ['en', 'admin_reviewer'],
    ['ar', 'oh_professional'],
  ] as const)('localizes the active %s role label', async (locale, role) => {
    await act(async () => setLocale(locale));
    act(() => useDemoRoleStore.getState().setRole(role));
    const { getByTestId } = render(<PreventionOverviewScreen />);
    const roleKey = `role.${role}` as const;
    await waitFor(() => expect(getByTestId('prevention-overview-active-role').children).toBeTruthy());
    expect(getByTestId('prevention-overview-active-role').props.children.props.children).toBe(
      t(roleKey, locale),
    );
  });

  test('does not let a stale request replace data for a newer active role', async () => {
    let resolveQuality: ((value: typeof overview) => void) | undefined;
    let resolveAdmin: ((value: typeof overview) => void) | undefined;
    mockGetPreventionOverview
      .mockImplementationOnce(() => new Promise(resolve => { resolveQuality = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveAdmin = resolve; }));

    const screen = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalledTimes(1));
    act(() => useDemoRoleStore.getState().setRole('admin_reviewer'));
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalledTimes(2));

    const adminOverview = { ...overview, total: 5, proposed: 5 };
    await act(async () => resolveAdmin?.(adminOverview));
    await waitFor(() => expect(screen.getByTestId('prevention-overview-count-proposed').props.children).toBe(5));

    await act(async () => resolveQuality?.({ ...overview, total: 99, proposed: 99 }));
    expect(screen.getByTestId('prevention-overview-count-proposed').props.children).toBe(5);
  });

  test('renders canonical CAPA status badges', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-badge-proposed')).toBeTruthy());
    expect(getByTestId('prevention-overview-badge-in_progress')).toBeTruthy();
    expect(getByTestId('prevention-overview-badge-completed')).toBeTruthy();
    expect(getByTestId('prevention-overview-badge-cancelled')).toBeTruthy();
  });

  test('quality staff can navigate to the existing create route', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-create-action')).toBeTruthy());
    fireEvent.press(getByTestId('prevention-overview-create-action'));
    expect(mockNavigate).toHaveBeenCalledWith('preventionCreate');
  });

  test('register navigation remains correct', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-view-register')).toBeTruthy());
    fireEvent.press(getByTestId('prevention-overview-view-register'));
    expect(mockNavigate).toHaveBeenCalledWith('preventionRegister');
  });

  test('refreshes persisted overview metrics when returning to the screen', async () => {
    const screen = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(screen.getByTestId('prevention-overview-count-proposed').props.children).toBe(3));
    mockGetSurveillanceMetrics.mockResolvedValue({
      overview: { totalDeclarations: 7 },
    });
    mockGetPreventionOverview.mockResolvedValue({
      total: 10,
      proposed: 4,
      in_progress: 2,
      completed: 3,
      cancelled: 1,
    });

    await act(async () => mockFocusListeners[0]?.());

    await waitFor(() => expect(screen.getByTestId('prevention-overview-count-proposed').props.children).toBe(4));
    expect(screen.getByTestId('prevention-overview-declaration-count').props.children).toBe(7);
    expect(mockGetPreventionOverview).toHaveBeenCalledTimes(2);
    expect(mockGetSurveillanceMetrics).toHaveBeenCalledTimes(2);
  });

  test('does not present partial statistics when the persisted declaration query fails', async () => {
    mockGetSurveillanceMetrics.mockRejectedValueOnce(new Error('database details remain private'));
    const screen = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(screen.getByTestId('prevention-overview-error-card')).toBeTruthy());
    expect(screen.queryByTestId('prevention-overview-declaration-count')).toBeNull();
    expect(screen.queryByTestId('prevention-overview-total')).toBeNull();
  });

  test('shows loading and empty states', async () => {
    mockGetPreventionOverview.mockImplementation(() => new Promise(() => {}));
    const loading = render(<PreventionOverviewScreen />);
    expect(loading.getByTestId('prevention-overview-loading-state')).toBeTruthy();
    loading.unmount();

    mockGetPreventionOverview.mockResolvedValue({
      total: 0,
      proposed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    });
    mockGetSurveillanceMetrics.mockResolvedValue({
      overview: { totalDeclarations: 0 },
    });
    const empty = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(empty.getByTestId('prevention-overview-empty')).toBeTruthy());
    expect(empty.getByTestId('prevention-overview-declaration-count').props.children).toBe(0);
  });

  test('uses localized generic error text and retries', async () => {
    await act(async () => setLocale('ar'));
    mockGetPreventionOverview
      .mockRejectedValueOnce(new Error('Sensitive database detail'))
      .mockResolvedValueOnce(overview);
    const screen = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(screen.getByTestId('prevention-overview-error-card')).toBeTruthy());
    expect(screen.getByText(t('error.generic', 'ar'))).toBeTruthy();
    expect(screen.queryByText('Sensitive database detail')).toBeNull();

    fireEvent.press(screen.getByTestId('prevention-overview-retry'));
    await waitFor(() => expect(screen.getByTestId('prevention-overview-total')).toBeTruthy());
    expect(mockGetPreventionOverview).toHaveBeenCalledTimes(2);
    expect(mockGetSurveillanceMetrics).toHaveBeenCalledTimes(2);
  });

  test('renders localized overview labels in French, English and Arabic', async () => {
    for (const locale of ['fr', 'en', 'ar'] as const) {
      await act(async () => setLocale(locale));
      const screen = render(<PreventionOverviewScreen />);
      await waitFor(() => expect(screen.getByText(t('prevention.overview.title', locale))).toBeTruthy());
      screen.unmount();
    }
  });

  test('FR, EN and AR localize header alignment without changing metrics', async () => {
    const screen = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(screen.getByTestId('prevention-overview-metrics')).toBeTruthy());
    expect(screen.getByTestId('prevention-overview-count-proposed').props.children).toBe(3);

    for (const locale of ['fr', 'en', 'ar'] as const) {
      await act(async () => setLocale(locale));
      await waitFor(() => {
        expect(
          StyleSheet.flatten(
            screen.getByText(t('prevention.overview.title', locale)).props.style,
          ).textAlign,
        ).toBe(locale === 'ar' ? 'right' : 'left');
      });
      expect(screen.getByTestId('prevention-overview-count-proposed').props.children).toBe(3);
    }
  });

  test('does not render unsupported action-type or unrelated metrics', async () => {
    const { queryByText } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalled());
    expect(queryByText(t('prevention.create.corrective'))).toBeNull();
    expect(queryByText(t('prevention.create.preventive'))).toBeNull();
  });
});
