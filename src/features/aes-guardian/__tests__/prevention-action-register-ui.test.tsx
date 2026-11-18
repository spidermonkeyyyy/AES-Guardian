import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PreventionActionRegisterScreen } from '../screens/PreventionActionRegisterScreen';
import { useDemoRoleStore } from '../../../core/auth/use-demo-role';
import { setLocale, t } from '../../../localization';
import type { PreventionAction } from '../../../core/database/types';

const mockNavigate = jest.fn();
const mockListPreventionActions = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

jest.mock('../../../core', () => {
  const actual = jest.requireActual('../../../core');
  return {
    ...actual,
    getDatabase: jest.fn(() => ({
      listPreventionActions: mockListPreventionActions,
    })),
  };
});

jest.mock('react-native-vector-icons/Feather', () => {
  const ReactRuntime = require('react');
  const { Text: NativeText } = require('react-native');
  return ({ name }: { name: string }) =>
    ReactRuntime.createElement(NativeText, { testID: `icon-${name}` }, name);
});

const actions: PreventionAction[] = [
  {
    id: 21,
    reference_code: 'CAPA-2026-00021',
    title: 'Replace damaged sharps containers',
    description: 'Install compliant containers at each care station.',
    action_type: 'corrective',
    contributing_factor: 'waste_disposal_container',
    rationale: 'Reduce handling of uncontained sharps.',
    surveillance_reference: 'Observation T3-2026',
    status: 'proposed',
    target_date: '2026-12-15',
    completed_at: null,
    completion_notes: null,
    created_by_user_id: 4,
    created_at: '2026-10-01T10:00:00.000Z',
    updated_at: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 22,
    reference_code: 'CAPA-2026-00022',
    title: 'Review protective equipment stock',
    description: 'Review the availability of protective equipment.',
    action_type: 'preventive',
    contributing_factor: 'protective_equipment',
    rationale: 'Maintain availability.',
    status: 'in_progress',
    created_by_user_id: 4,
    created_at: '2026-10-02T10:00:00.000Z',
    updated_at: '2026-10-02T10:00:00.000Z',
  },
  {
    id: 23,
    reference_code: 'CAPA-2026-00023',
    title: 'Update device safety checklist',
    description: 'Update the approved device safety checklist.',
    action_type: 'corrective',
    contributing_factor: 'device_safety_design',
    rationale: 'Align the checklist with current equipment.',
    status: 'completed',
    created_by_user_id: 4,
    created_at: '2026-10-03T10:00:00.000Z',
    updated_at: '2026-10-03T10:00:00.000Z',
  },
  {
    id: 24,
    reference_code: 'CAPA-2026-00024',
    title: 'Retire obsolete procedure',
    description: 'Retire the obsolete procedure from local stations.',
    action_type: 'preventive',
    contributing_factor: 'procedure_compliance',
    rationale: 'Avoid reliance on obsolete instructions.',
    status: 'cancelled',
    created_by_user_id: 4,
    created_at: '2026-10-04T10:00:00.000Z',
    updated_at: '2026-10-04T10:00:00.000Z',
  },
];

const waitForAct = async (assertion: () => void) => {
  await act(async () => {
    await waitFor(assertion);
  });
};

const renderRegister = async () => {
  const screen = render(<PreventionActionRegisterScreen />);
  await act(async () => {
    await Promise.resolve();
  });
  return screen;
};

describe('PreventionActionRegisterScreen AES UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLocale('fr');
    useDemoRoleStore.getState().setRole('quality_staff');
    mockListPreventionActions.mockResolvedValue(actions);
  });

  test('renders source-backed action reference, title, description, factor, type, and target date', async () => {
    const { getByTestId, getByText, queryByTestId } = await renderRegister();

    await act(async () => {
      await waitFor(() => expect(getByTestId('prevention-register-action-21')).toBeTruthy());
      await waitFor(() => expect(queryByTestId('prevention-register-loading')).toBeNull());
    });
    expect(getByText('CAPA-2026-00021')).toBeTruthy();
    expect(getByText('Replace damaged sharps containers')).toBeTruthy();
    expect(getByText('Install compliant containers at each care station.')).toBeTruthy();
    expect(getByTestId('prevention-register-action-factor-21').props.children).toBe(
      t('prevention.factor.waste_disposal_container'),
    );
    expect(getByTestId('prevention-register-action-type-21').props.children).toBe(
      t('prevention.detail.type.corrective'),
    );
    expect(getByTestId('prevention-register-action-target-date-21').props.children).toEqual([
      t('prevention.detail.targetDate'),
      ': ',
      '2026-12-15',
    ]);
  });

  test('renders all four canonical status badges', async () => {
    const { getByTestId, queryByTestId } = await renderRegister();

    await waitForAct(() => expect(getByTestId('prevention-register-status-21')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());
    expect(getByTestId('prevention-register-status-22')).toBeTruthy();
    expect(getByTestId('prevention-register-status-23')).toBeTruthy();
    expect(getByTestId('prevention-register-status-24')).toBeTruthy();
    expect(getByTestId('prevention-register-status-21-text').props.children).toBe(
      t('prevention.detail.status.proposed'),
    );
    expect(getByTestId('prevention-register-status-22-text').props.children).toBe(
      t('prevention.detail.status.in_progress'),
    );
    expect(getByTestId('prevention-register-status-23-text').props.children).toBe(
      t('prevention.detail.status.completed'),
    );
    expect(getByTestId('prevention-register-status-24-text').props.children).toBe(
      t('prevention.detail.status.cancelled'),
    );
  });

  test('shows a loading state while the repository request is pending', async () => {
    mockListPreventionActions.mockReturnValue(new Promise(() => {}));
    const { getByTestId, getByText } = await renderRegister();

    expect(getByTestId('prevention-register-loading')).toBeTruthy();
    expect(getByText(t('app.loading'))).toBeTruthy();
  });

  test('shows the empty state when the repository returns no actions', async () => {
    mockListPreventionActions.mockResolvedValue([]);
    const { getByTestId, getByText } = await renderRegister();

    await waitForAct(() => expect(getByTestId('prevention-register-empty')).toBeTruthy());
    expect(getByText(t('prevention.register.empty'))).toBeTruthy();
  });

  test('shows a generic error and retries the repository request', async () => {
    mockListPreventionActions
      .mockRejectedValueOnce(new Error('database details remain private'))
      .mockResolvedValueOnce(actions);
    const { getByTestId, getByText, queryByText, queryByTestId } = await renderRegister();

    await waitForAct(() => expect(getByTestId('prevention-register-error')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());
    expect(getByText(t('error.generic'))).toBeTruthy();
    expect(queryByText('database details remain private')).toBeNull();
    fireEvent.press(getByTestId('prevention-register-retry'));
    await waitForAct(() => expect(getByTestId('prevention-register-action-21')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());
    expect(mockListPreventionActions).toHaveBeenCalledTimes(2);
  });

  test('quality staff sees the create action', async () => {
    const { getByTestId, queryByTestId } = await renderRegister();
    await waitForAct(() => expect(getByTestId('prevention-register-create')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());
  });

  test('admin reviewer can view the register but receives no management control', async () => {
    useDemoRoleStore.getState().setRole('admin_reviewer');
    const { getByTestId, queryByTestId } = await renderRegister();

    await waitForAct(() => expect(getByTestId('prevention-register-action-21')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());
    expect(queryByTestId('prevention-register-create')).toBeNull();
  });

  test('OH professional can view the register but receives no management control', async () => {
    useDemoRoleStore.getState().setRole('oh_professional');
    const { getByTestId, queryByTestId } = await renderRegister();

    await waitForAct(() => expect(getByTestId('prevention-register-action-21')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());
    expect(queryByTestId('prevention-register-create')).toBeNull();
  });

  test('exposed professional is denied without requesting register data', async () => {
    useDemoRoleStore.getState().setRole('exposed_professional');
    const { getByTestId, queryByTestId } = await renderRegister();

    expect(getByTestId('prevention-register-unauthorized')).toBeTruthy();
    expect(queryByTestId('prevention-register-create')).toBeNull();
    expect(mockListPreventionActions).not.toHaveBeenCalled();
  });

  test('technical administrator is denied without requesting register data', async () => {
    useDemoRoleStore.getState().setRole('tech_admin');
    const { getByTestId, queryByTestId } = await renderRegister();

    expect(getByTestId('prevention-register-unauthorized')).toBeTruthy();
    expect(queryByTestId('prevention-register-create')).toBeNull();
    expect(mockListPreventionActions).not.toHaveBeenCalled();
  });

  test('detail action navigates with the canonical actionId parameter', async () => {
    const { getByTestId, queryByTestId } = await renderRegister();
    await waitForAct(() => expect(getByTestId('prevention-register-detail-21')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());

    fireEvent.press(getByTestId('prevention-register-detail-21'));
    expect(mockNavigate).toHaveBeenCalledWith('preventionActionDetail', { actionId: 21 });
  });

  test('quality staff create action navigates to the existing create route', async () => {
    const { getByTestId, queryByTestId } = render(<PreventionActionRegisterScreen />);
    await waitForAct(() => expect(getByTestId('prevention-register-create')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());

    fireEvent.press(getByTestId('prevention-register-create'));
    expect(mockNavigate).toHaveBeenCalledWith('preventionCreate');
  });

  test('register title and controls resolve in French, English, and Arabic', async () => {
    for (const locale of ['fr', 'en', 'ar'] as const) {
      await act(async () => setLocale(locale));
      const screen = await renderRegister();
      expect(screen.getByText(t('prevention.register.title', locale))).toBeTruthy();
      expect(screen.getByText(t('prevention.register.filterStatus', locale))).toBeTruthy();
      screen.unmount();
    }
  });

  test('Arabic applies RTL alignment and ordering to register filters', async () => {
    await act(async () => setLocale('ar'));
    const { getByTestId } = await renderRegister();

    expect(StyleSheet.flatten(getByTestId('prevention-register-filter-status-group').props.style).flexDirection)
      .toBe('row-reverse');
    expect(StyleSheet.flatten(getByTestId('prevention-register-filter-status-options').props.style).flexDirection)
      .toBe('row-reverse');
    expect(StyleSheet.flatten(getByTestId('prevention-register-filter-status-label').props.style).textAlign)
      .toBe('right');
  });

  test('filter selections pass only canonical repository filter values', async () => {
    const { getByTestId, queryByTestId } = await renderRegister();
    await waitForAct(() => expect(mockListPreventionActions).toHaveBeenCalledTimes(1));
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());

    fireEvent.press(getByTestId('prevention-register-filter-status-in_progress'));
    await waitForAct(() => expect(mockListPreventionActions).toHaveBeenLastCalledWith(4, {
      status: 'in_progress',
      action_type: undefined,
      contributing_factor: undefined,
    }));
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());

    fireEvent.press(getByTestId('prevention-register-filter-factor-device_safety_design'));
    await waitForAct(() => expect(mockListPreventionActions).toHaveBeenLastCalledWith(4, {
      status: 'in_progress',
      action_type: undefined,
      contributing_factor: 'device_safety_design',
    }));
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());
  });

  test('filter and navigation controls meet the 48dp minimum target', async () => {
    const { getByTestId, queryByTestId } = await renderRegister();
    await waitForAct(() => expect(getByTestId('prevention-register-detail-21')).toBeTruthy());
    await waitForAct(() => expect(queryByTestId('prevention-register-loading')).toBeNull());

    const chipStyle = StyleSheet.flatten(getByTestId('prevention-register-filter-status-proposed').props.style);
    const detailStyle = StyleSheet.flatten(getByTestId('prevention-register-detail-21').props.style);
    const createStyle = StyleSheet.flatten(getByTestId('prevention-register-create').props.style);
    expect(chipStyle.minHeight).toBeGreaterThanOrEqual(48);
    expect(detailStyle.width).toBeGreaterThanOrEqual(48);
    expect(detailStyle.height).toBeGreaterThanOrEqual(48);
    expect(createStyle.height).toBeGreaterThanOrEqual(48);
  });
});
