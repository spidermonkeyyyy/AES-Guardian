import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import AppIcon from '../../../components/AppIcon';
import { PreventionActionDetailScreen } from '../screens/PreventionActionDetailScreen';
import { useDemoRoleStore } from '../../../core/auth/use-demo-role';
import type { PreventionActionDetail, PreventionActionStatus } from '../../../core/database/types';
import { setLocale, t } from '../../../localization';
import { formatPreventionDate } from '../prevention-date-format';
import { ThemeProvider } from '../../../theme/ThemeContext';

const mockGoBack = jest.fn();
const mockGetPreventionActionById = jest.fn();
const mockUpdatePreventionActionStatus = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack }),
    useRoute: () => ({ params: { actionId: 21 } }),
  };
});

jest.mock('../../../core', () => {
  const actual = jest.requireActual('../../../core');
  return {
    ...actual,
    getDatabase: jest.fn(() => ({
      getPreventionActionById: mockGetPreventionActionById,
      updatePreventionActionStatus: mockUpdatePreventionActionStatus,
    })),
  };
});

const makeAction = (
  status: PreventionActionStatus = 'proposed',
  overrides: Partial<PreventionActionDetail> = {},
): PreventionActionDetail => ({
  id: 21,
  reference_code: 'CAPA-2026-00021',
  title: 'Replace damaged sharps containers',
  description: 'Install compliant containers at each care station.',
  action_type: 'corrective',
  contributing_factor: 'waste_disposal_container',
  rationale: 'Reduce handling of uncontained sharps.',
  surveillance_reference: 'Observation T3-2026',
  status,
  target_date: '2026-12-15',
  completed_at: status === 'completed' ? '2026-11-18T10:00:00.000Z' : null,
  completion_notes: status === 'completed' ? 'Installation verified.' : null,
  created_by_user_id: 4,
  created_at: '2026-10-01T10:00:00.000Z',
  updated_at: '2026-11-18T10:00:00.000Z',
  audit_history: [
    {
      id: 1,
      event_type: 'prevention_action_created',
      user_id: 4,
      entity_type: 'prevention_action',
      entity_id: 21,
      description: 'CAPA action created.',
      occurred_at: '2026-10-01T10:00:00.000Z',
    },
  ],
  ...overrides,
});

const renderDetail = () =>
  render(
    <ThemeProvider>
      <PreventionActionDetailScreen />
    </ThemeProvider>,
  );

describe('PreventionActionDetailScreen AES UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLocale('fr');
    useDemoRoleStore.getState().setRole('quality_staff');
    mockGetPreventionActionById.mockResolvedValue(makeAction());
    mockUpdatePreventionActionStatus.mockImplementation(
      async (_userId: number, _actionId: number, status: PreventionActionStatus, note?: string) =>
        makeAction(status, {
          completion_notes: note ?? null,
          completed_at: status === 'completed' ? '2026-11-18T10:00:00.000Z' : null,
        }),
    );
  });

  test('renders canonical reference, status, fields, optional reference, dates, and audit history', async () => {
    const screen = renderDetail();
    await waitFor(() => expect(screen.queryByTestId('prevention-detail-reference')).toBeTruthy());

    expect(screen.getByText('CAPA-2026-00021')).toBeTruthy();
    expect(screen.getByTestId('prevention-detail-status').props.accessibilityLabel).toBe(
      t('prevention.detail.status.proposed'),
    );
    expect(screen.getByText('Replace damaged sharps containers')).toBeTruthy();
    expect(screen.getByText('Install compliant containers at each care station.')).toBeTruthy();
    expect(screen.getByText(t('prevention.detail.type.corrective'))).toBeTruthy();
    expect(screen.getByText(t('prevention.factor.waste_disposal_container'))).toBeTruthy();
    expect(screen.getByText('Reduce handling of uncontained sharps.')).toBeTruthy();
    expect(screen.getByText('Observation T3-2026')).toBeTruthy();
    expect(screen.getByText(formatPreventionDate('2026-12-15', 'fr')!)).toBeTruthy();
    expect(screen.getByText('CAPA action created.')).toBeTruthy();
  });

  test('shows loading state while the repository request is pending', () => {
    mockGetPreventionActionById.mockReturnValue(new Promise(() => {}));
    const screen = renderDetail();
    expect(screen.getByTestId('prevention-detail-loading')).toBeTruthy();
  });

  test('shows a localized not-found state when the repository returns null', async () => {
    mockGetPreventionActionById.mockResolvedValue(null);
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-not-found')).toBeTruthy());
    expect(screen.getByText(t('prevention.detail.notFound'))).toBeTruthy();
  });

  test('shows a generic load error and retries the repository read', async () => {
    mockGetPreventionActionById
      .mockRejectedValueOnce(new Error('Sensitive database detail'))
      .mockResolvedValueOnce(makeAction());
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-error')).toBeTruthy());
    expect(screen.getByText(t('prevention.detail.loadError'))).toBeTruthy();
    expect(screen.queryByText('Sensitive database detail')).toBeNull();
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-retry')));
    await waitFor(() => expect(screen.getByTestId('prevention-detail-reference')).toBeTruthy());
    expect(mockGetPreventionActionById).toHaveBeenCalledTimes(2);
  });

  test('quality staff receives repository-scoped detail and proposed-state actions', async () => {
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-start')).toBeTruthy());
    expect(mockGetPreventionActionById).toHaveBeenCalledWith(4, 21);
    expect(screen.getByTestId('prevention-detail-cancel')).toBeTruthy();
    expect(screen.queryByTestId('prevention-detail-complete')).toBeNull();
  });

  test.each([
    ['admin_reviewer', 2],
    ['oh_professional', 3],
  ] as const)('%s can read but cannot see lifecycle actions', async (role, userId) => {
    act(() => useDemoRoleStore.getState().setRole(role));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-reference')).toBeTruthy());
    expect(mockGetPreventionActionById).toHaveBeenCalledWith(userId, 21);
    expect(screen.queryByTestId('prevention-detail-start')).toBeNull();
    expect(screen.queryByTestId('prevention-detail-complete')).toBeNull();
    expect(screen.queryByTestId('prevention-detail-cancel')).toBeNull();
  });

  test.each(['exposed_professional', 'tech_admin'] as const)('%s is denied without a repository read', (role) => {
    act(() => useDemoRoleStore.getState().setRole(role));
    const screen = renderDetail();
    expect(screen.getByTestId('prevention-detail-denied')).toBeTruthy();
    expect(mockGetPreventionActionById).not.toHaveBeenCalled();
  });

  test('proposed actions expose only start and cancel transitions', async () => {
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-start')).toBeTruthy());
    expect(screen.queryByTestId('prevention-detail-complete')).toBeNull();
    expect(screen.getByTestId('prevention-detail-cancel')).toBeTruthy();
  });

  test('in-progress actions expose complete and cancel transitions', async () => {
    mockGetPreventionActionById.mockResolvedValue(makeAction('in_progress'));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-complete')).toBeTruthy());
    expect(screen.getByTestId('prevention-detail-cancel')).toBeTruthy();
    expect(screen.queryByTestId('prevention-detail-start')).toBeNull();
  });

  test.each(['completed', 'cancelled'] as const)('%s actions are terminal and expose no lifecycle controls', async (status) => {
    mockGetPreventionActionById.mockResolvedValue(makeAction(status));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-reference')).toBeTruthy());
    expect(screen.queryByTestId('prevention-detail-start')).toBeNull();
    expect(screen.queryByTestId('prevention-detail-complete')).toBeNull();
    expect(screen.queryByTestId('prevention-detail-cancel')).toBeNull();
  });

  test('completion note requires three trimmed characters before repository transition', async () => {
    mockGetPreventionActionById.mockResolvedValue(makeAction('in_progress'));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-complete')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-complete'));
    fireEvent.changeText(screen.getByTestId('prevention-detail-completion-note'), ' a ');
    fireEvent.press(screen.getByTestId('prevention-detail-transition-confirm'));
    expect(screen.getByText(t('prevention.detail.validation.completionNote'))).toBeTruthy();
    expect(mockUpdatePreventionActionStatus).not.toHaveBeenCalled();
  });

  test('completion sends a trimmed note and displays the repository-confirmed result', async () => {
    mockGetPreventionActionById.mockResolvedValue(makeAction('in_progress'));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-complete')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-complete'));
    fireEvent.changeText(screen.getByTestId('prevention-detail-completion-note'), ' Verified ');
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-confirm')));
    await waitFor(() => expect(screen.getByTestId('prevention-detail-status').props.accessibilityLabel).toBe(
      t('prevention.detail.status.completed'),
    ));
    expect(mockUpdatePreventionActionStatus).toHaveBeenCalledWith(4, 21, 'completed', 'Verified');
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  test('cancellation allows an optional trimmed note', async () => {
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-cancel')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-cancel'));
    expect(screen.getByTestId('prevention-detail-cancel-note').props.value).toBe('');
    fireEvent.changeText(screen.getByTestId('prevention-detail-cancel-note'), ' Replaced ');
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-confirm')));
    expect(mockUpdatePreventionActionStatus).toHaveBeenCalledWith(4, 21, 'cancelled', 'Replaced');
  });

  test('cancellation without a note follows the repository optional-note contract', async () => {
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-cancel')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-cancel'));
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-confirm')));
    expect(mockUpdatePreventionActionStatus).toHaveBeenCalledWith(4, 21, 'cancelled', undefined);
  });

  test('duplicate rapid lifecycle taps submit only one mutation', async () => {
    mockUpdatePreventionActionStatus.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(makeAction('in_progress')), 50)),
    );
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-start')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-start'));
    fireEvent.press(screen.getByTestId('prevention-detail-start'));
    await waitFor(() => expect(mockUpdatePreventionActionStatus).toHaveBeenCalledTimes(1));
  });

  test('lifecycle failure keeps the note and shows a non-sensitive refresh retry', async () => {
    mockGetPreventionActionById.mockResolvedValue(makeAction('in_progress'));
    mockUpdatePreventionActionStatus.mockRejectedValueOnce(new Error('Sensitive transaction detail'));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-complete')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-complete'));
    fireEvent.changeText(screen.getByTestId('prevention-detail-completion-note'), 'Verified');
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-confirm')));
    await waitFor(() => expect(screen.getByTestId('prevention-detail-transition-error')).toBeTruthy());
    expect(screen.getByTestId('prevention-detail-completion-note').props.value).toBe('Verified');
    expect(screen.queryByText('Sensitive transaction detail')).toBeNull();
    expect(screen.getByTestId('prevention-detail-transition-retry')).toBeTruthy();
  });

  test('transition retry reloads the actual state before allowing another mutation', async () => {
    mockUpdatePreventionActionStatus.mockRejectedValueOnce(new Error('failure'));
    mockGetPreventionActionById
      .mockResolvedValueOnce(makeAction('in_progress'))
      .mockResolvedValueOnce(makeAction('in_progress'));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-complete')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-complete'));
    fireEvent.changeText(screen.getByTestId('prevention-detail-completion-note'), 'Verified');
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-confirm')));
    await waitFor(() => expect(screen.getByTestId('prevention-detail-transition-retry')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-retry')));
    await waitFor(() => expect(screen.queryByTestId('prevention-detail-transition-error')).toBeNull());
    expect(mockUpdatePreventionActionStatus).toHaveBeenCalledTimes(1);
    expect(mockGetPreventionActionById).toHaveBeenCalledTimes(2);
  });

  test('transition retry recognizes an already-committed status without resubmitting', async () => {
    mockUpdatePreventionActionStatus.mockRejectedValueOnce(new Error('readback failed'));
    mockGetPreventionActionById
      .mockResolvedValueOnce(makeAction('in_progress'))
      .mockResolvedValueOnce(makeAction('completed'));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-complete')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-complete'));
    fireEvent.changeText(screen.getByTestId('prevention-detail-completion-note'), 'Verified');
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-confirm')));
    await waitFor(() => expect(screen.getByTestId('prevention-detail-transition-retry')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-retry')));
    await waitFor(() => expect(screen.getByTestId('prevention-detail-status').props.accessibilityLabel).toBe(
      t('prevention.detail.status.completed'),
    ));
    expect(mockUpdatePreventionActionStatus).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('prevention-detail-transition-panel')).toBeNull();
  });

  test('cancellation failure preserves the optional cancellation note', async () => {
    mockUpdatePreventionActionStatus.mockRejectedValueOnce(new Error('transaction failed'));
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-cancel')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-detail-cancel'));
    fireEvent.changeText(screen.getByTestId('prevention-detail-cancel-note'), ' Replaced ');
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-transition-confirm')));
    await waitFor(() => expect(screen.getByTestId('prevention-detail-transition-error')).toBeTruthy());
    expect(screen.getByTestId('prevention-detail-cancel-note').props.value).toBe(' Replaced ');
  });

  test('does not navigate on success or failure because detail remains in place', async () => {
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-start')).toBeTruthy());
    await act(async () => fireEvent.press(screen.getByTestId('prevention-detail-start')));
    await waitFor(() => expect(screen.getByTestId('prevention-detail-status').props.accessibilityLabel).toBe(
      t('prevention.detail.status.in_progress'),
    ));
    expect(mockUpdatePreventionActionStatus).toHaveBeenCalledWith(4, 21, 'in_progress', undefined);
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('FR, EN, and AR labels are resolved with Arabic-local text alignment', async () => {
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-title')).toBeTruthy());
    expect(screen.getByTestId('prevention-detail-title').props.children).toBe('Replace damaged sharps containers');
    act(() => setLocale('en'));
    expect(screen.getByText('Action Detail')).toBeTruthy();
    act(() => setLocale('ar'));
    expect(screen.getByText('تفاصيل الإجراء')).toBeTruthy();
    expect(screen.getByTestId('prevention-detail-title').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ textAlign: 'right' })]),
    );
  });

  test('lifecycle controls expose accessible labels and minimum 48dp touch targets', async () => {
    const screen = renderDetail();
    await waitFor(() => expect(screen.getByTestId('prevention-detail-start')).toBeTruthy());
    const backButton = screen.getByTestId('prevention-detail-back');
    expect(StyleSheet.flatten(backButton.props.style).width).toBeGreaterThanOrEqual(48);
    expect(screen.getByTestId('prevention-detail-back').findByType(AppIcon).props.name).toBe('back');
    act(() => setLocale('ar'));
    expect(screen.getByTestId('prevention-detail-back').findByType(AppIcon).props.name).toBe('back');
    const startButton = screen.getByTestId('prevention-detail-start');
    expect(startButton.props.accessibilityLabel).toBe(t('prevention.detail.start_action'));
    const startStyle = StyleSheet.flatten(startButton.props.style);
    expect(startStyle.height ?? startStyle.minHeight).toBeGreaterThanOrEqual(48);

    const cancelButton = screen.getByTestId('prevention-detail-cancel');
    const cancelStyle = StyleSheet.flatten(cancelButton.props.style);
    expect(cancelStyle.height ?? cancelStyle.minHeight).toBeGreaterThanOrEqual(48);
  });
});
