import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { PreventionOverviewScreen } from '../screens/PreventionOverviewScreen';
import {
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
} from '../../../core/auth/boundaries';
import { setLocale, t } from '../../../localization';

jest.setTimeout(15000);

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

const mockGetPreventionOverview = jest.fn();

jest.mock('../../../core', () => {
  const actual = jest.requireActual('../../../core');
  return {
    ...actual,
    getDatabase: jest.fn(() => Promise.resolve({
      getPreventionOverview: mockGetPreventionOverview,
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
    setLocale('fr');
    mockGetPreventionOverview.mockResolvedValue(overview);
  });

  test('quality staff renders aggregate metrics', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-total')).toBeTruthy());
    expect(getByTestId('prevention-overview-count-proposed').props.children).toBe(3);
    expect(getByTestId('prevention-overview-count-in_progress').props.children).toBe(2);
    expect(getByTestId('prevention-overview-count-completed').props.children).toBe(3);
    expect(getByTestId('prevention-overview-count-cancelled').props.children).toBe(1);
  });

  test('admin reviewer renders the overview read-only', async () => {
    const { getByTestId, queryByTestId } = render(<PreventionOverviewScreen />);
    fireEvent.press(getByTestId('prevention-role-admin_reviewer'));
    await waitFor(() => expect(getByTestId('prevention-overview')).toBeTruthy());
    expect(queryByTestId('prevention-overview-create-action')).toBeNull();
  });

  test('OH professional renders the overview read-only', async () => {
    const { getByTestId, queryByTestId } = render(<PreventionOverviewScreen />);
    fireEvent.press(getByTestId('prevention-role-oh_professional'));
    await waitFor(() => expect(getByTestId('prevention-overview')).toBeTruthy());
    expect(queryByTestId('prevention-overview-create-action')).toBeNull();
  });

  test('exposed professional is denied', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    fireEvent.press(getByTestId('prevention-role-exposed_professional'));
    await waitFor(() => expect(getByTestId('prevention-overview-unauthorized')).toBeTruthy());
  });

  test('tech admin is denied', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    fireEvent.press(getByTestId('prevention-role-tech_admin'));
    await waitFor(() => expect(getByTestId('prevention-overview-unauthorized')).toBeTruthy());
  });

  test('calls getPreventionOverview with the active quality staff identity', async () => {
    render(<PreventionOverviewScreen />);
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalledWith(
      SYNTHETIC_QUALITY_STAFF_CONTEXT.userId,
    ));
  });

  test('calls getPreventionOverview with the active admin identity', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    fireEvent.press(getByTestId('prevention-role-admin_reviewer'));
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalledWith(
      SYNTHETIC_ADMIN_REVIEWER_CONTEXT.userId,
    ));
  });

  test('calls getPreventionOverview with the active OH identity', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    fireEvent.press(getByTestId('prevention-role-oh_professional'));
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalledWith(
      SYNTHETIC_OH_PROFESSIONAL_CONTEXT.userId,
    ));
  });

  test('displays total count', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-total')).toBeTruthy());
  });

  test('renders CAPA status badges with canonical status values', async () => {
    const { getByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-badge-proposed')).toBeTruthy());
    expect(getByTestId('prevention-overview-badge-in_progress')).toBeTruthy();
    expect(getByTestId('prevention-overview-badge-completed')).toBeTruthy();
    expect(getByTestId('prevention-overview-badge-cancelled')).toBeTruthy();
  });

  test('quality staff can navigate to existing create route', async () => {
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

  test('admin and OH roles do not receive create actions', async () => {
    const admin = render(<PreventionOverviewScreen />);
    fireEvent.press(admin.getByTestId('prevention-role-admin_reviewer'));
    await waitFor(() => expect(admin.queryByTestId('prevention-overview-create-action')).toBeNull());
    admin.unmount();

    const oh = render(<PreventionOverviewScreen />);
    fireEvent.press(oh.getByTestId('prevention-role-oh_professional'));
    await waitFor(() => expect(oh.queryByTestId('prevention-overview-create-action')).toBeNull());
  });

  test('loading state is rendered', async () => {
    mockGetPreventionOverview.mockImplementation(() => new Promise(() => {}));
    const { getByTestId } = render(<PreventionOverviewScreen />);
    expect(getByTestId('prevention-overview-loading')).toBeTruthy();
    expect(getByTestId('prevention-overview-loading-state')).toBeTruthy();
  });

  test('empty state is rendered for a zero total', async () => {
    mockGetPreventionOverview.mockResolvedValue({
      total: 0,
      proposed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    });
    const { getByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-empty')).toBeTruthy());
  });

  test('error state does not display fabricated counts', async () => {
    mockGetPreventionOverview.mockRejectedValue(new Error('load failed'));
    const { getByTestId, queryByTestId } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(getByTestId('prevention-overview-error')).toBeTruthy());
    expect(queryByTestId('prevention-overview-metrics')).toBeNull();
  });

  test('FR, EN, and AR overview labels resolve', async () => {
    setLocale('fr');
    const fr = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(fr.getByText(t('prevention.overview.title', 'fr'))).toBeTruthy());
    fr.unmount();

    await act(async () => setLocale('en'));
    const en = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(en.getByText(t('prevention.overview.title', 'en'))).toBeTruthy());
    en.unmount();

    await act(async () => setLocale('ar'));
    const ar = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(ar.getByText(t('prevention.overview.title', 'ar'))).toBeTruthy());
  });

  test('does not render unsupported action-type or unrelated metrics', async () => {
    const { queryByText } = render(<PreventionOverviewScreen />);
    await waitFor(() => expect(mockGetPreventionOverview).toHaveBeenCalled());
    expect(queryByText(t('prevention.create.corrective'))).toBeNull();
    expect(queryByText(t('prevention.create.preventive'))).toBeNull();
  });

  test('authorization boundary helpers remain separate from repository behavior', () => {
    expect(SYNTHETIC_DEMO_CONTEXT.role).toBe('exposed_professional');
    expect(SYNTHETIC_TECH_ADMIN_CONTEXT.role).toBe('tech_admin');
  });
});
