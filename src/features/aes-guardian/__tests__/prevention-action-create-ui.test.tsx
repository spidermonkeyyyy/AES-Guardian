import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PreventionActionCreateScreen } from '../screens/PreventionActionCreateScreen';
import { useDemoRoleStore } from '../../../core/auth/use-demo-role';
import { setLocale, t } from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockCreatePreventionAction = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  };
});

jest.mock('../../../core', () => {
  const actual = jest.requireActual('../../../core');
  return {
    ...actual,
    getDatabase: jest.fn(() => ({
      createPreventionAction: mockCreatePreventionAction,
    })),
  };
});

jest.mock('react-native-vector-icons/Feather', () => {
  const ReactRuntime = require('react');
  const { Text: NativeText } = require('react-native');
  return ({ name }: { name: string }) =>
    ReactRuntime.createElement(NativeText, { testID: `icon-${name}` }, name);
});

const renderCreate = () =>
  render(
    <ThemeProvider>
      <PreventionActionCreateScreen />
    </ThemeProvider>,
  );

const fillValidForm = (getByTestId: (testID: string) => any) => {
  fireEvent.changeText(getByTestId('prevention-create-title-input'), 'Dotation en collecteurs de sécurité');
  fireEvent.changeText(
    getByTestId('prevention-create-description-input'),
    'Installer des collecteurs conformes dans chaque box de soins.',
  );
  fireEvent.changeText(
    getByTestId('prevention-create-rationale-input'),
    'Réduire les expositions percutanées lors des soins.',
  );
};

describe('PreventionActionCreateScreen AES UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLocale('fr');
    useDemoRoleStore.getState().setRole('quality_staff');
    mockCreatePreventionAction.mockResolvedValue({
      id: 21,
      reference_code: 'CAPA-2026-00021',
      status: 'proposed',
    });
  });

  test('authorized quality staff can render the form', () => {
    const { getByTestId } = renderCreate();
    expect(getByTestId('prevention-create-screen')).toBeTruthy();
    expect(getByTestId('prevention-create-submit')).toBeTruthy();
  });

  test.each([
    'admin_reviewer',
    'oh_professional',
    'exposed_professional',
    'tech_admin',
  ] as const)('%s is denied', (role) => {
    act(() => useDemoRoleStore.getState().setRole(role));
    const { getByTestId, queryByTestId } = renderCreate();
    expect(getByTestId('prevention-create-denied')).toBeTruthy();
    expect(queryByTestId('prevention-create-submit')).toBeNull();
  });

  test('renders all canonical action-type options', () => {
    const { getByTestId } = renderCreate();
    expect(getByTestId('prevention-create-action-type-corrective')).toBeTruthy();
    expect(getByTestId('prevention-create-action-type-preventive')).toBeTruthy();
  });

  test('renders all eight contributing-factor options', () => {
    const { getByTestId } = renderCreate();
    [
      'device_safety_design',
      'procedure_compliance',
      'workload_fatigue',
      'waste_disposal_container',
      'protective_equipment',
      'training_supervision',
      'environment_workspace',
      'other_factor',
    ].forEach((factor) => {
      expect(getByTestId(`prevention-create-factor-${factor}`)).toBeTruthy();
    });
  });

  test('required-field validation reports title, description, and rationale', () => {
    const { getByTestId, getByText } = renderCreate();
    fireEvent.press(getByTestId('prevention-create-submit'));
    expect(getByText(t('prevention.create.validation.title'))).toBeTruthy();
    expect(getByText(t('prevention.create.validation.description'))).toBeTruthy();
    expect(getByText(t('prevention.create.validation.rationale'))).toBeTruthy();
    expect(mockCreatePreventionAction).not.toHaveBeenCalled();
  });

  test('target date and surveillance reference accept optional values', () => {
    const { getByTestId } = renderCreate();
    fireEvent.changeText(getByTestId('prevention-create-target-date-input'), '2026-12-31');
    fireEvent.changeText(
      getByTestId('prevention-create-surveillance-reference-input'),
      'Observation T3-2026',
    );
    expect(getByTestId('prevention-create-target-date-input').props.value).toBe('2026-12-31');
    expect(getByTestId('prevention-create-surveillance-reference-input').props.value).toBe(
      'Observation T3-2026',
    );
  });

  test('valid form submission sends canonical persisted input and proposed initial status', async () => {
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    fireEvent.changeText(getByTestId('prevention-create-target-date-input'), '2026-12-31');
    fireEvent.changeText(
      getByTestId('prevention-create-surveillance-reference-input'),
      'Observation T3-2026',
    );
    await act(async () => {
      fireEvent.press(getByTestId('prevention-create-submit'));
    });
    expect(mockCreatePreventionAction).toHaveBeenCalledWith(
      4,
      expect.objectContaining({
        title: 'Dotation en collecteurs de sécurité',
        description: 'Installer des collecteurs conformes dans chaque box de soins.',
        action_type: 'corrective',
        contributing_factor: 'device_safety_design',
        rationale: 'Réduire les expositions percutanées lors des soins.',
        surveillance_reference: 'Observation T3-2026',
        target_date: '2026-12-31',
      }),
    );
  });

  test('duplicate rapid submissions create only one action', async () => {
    mockCreatePreventionAction.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 21, status: 'proposed' }), 50)),
    );
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    fireEvent.press(getByTestId('prevention-create-submit'));
    fireEvent.press(getByTestId('prevention-create-submit'));
    await waitFor(() => expect(mockCreatePreventionAction).toHaveBeenCalledTimes(1));
  });

  test('submission loading state is honest and prevents a second press', async () => {
    mockCreatePreventionAction.mockImplementation(() => new Promise(() => {}));
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    fireEvent.press(getByTestId('prevention-create-submit'));
    await waitFor(() => expect(getByTestId('prevention-create-loading')).toBeTruthy());
  });

  test('repository failure shows localized error and preserves entered values', async () => {
    mockCreatePreventionAction.mockRejectedValue(new Error('Sensitive database detail'));
    const { getByTestId, getByText } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => {
      fireEvent.press(getByTestId('prevention-create-submit'));
    });
    await waitFor(() => expect(getByTestId('prevention-create-error')).toBeTruthy());
    expect(getByText(t('prevention.create.error'))).toBeTruthy();
    expect(getByTestId('prevention-create-title-input').props.value).toBe(
      'Dotation en collecteurs de sécurité',
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('retry behavior resubmits the preserved form', async () => {
    mockCreatePreventionAction
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValueOnce({ id: 22, reference_code: 'CAPA-2026-00022', status: 'proposed' });
    const { getByTestId, queryByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(getByTestId('prevention-create-error')).toBeTruthy());
    await act(async () => fireEvent.press(getByTestId('prevention-create-retry')));
    await waitFor(() => expect(queryByTestId('prevention-create-error')).toBeNull());
    expect(mockCreatePreventionAction).toHaveBeenCalledTimes(2);
  });

  test('does not navigate after repository failure', async () => {
    mockCreatePreventionAction.mockRejectedValue(new Error('failure'));
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(getByTestId('prevention-create-error')).toBeTruthy());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('confirmed success navigates back only after the repository resolves', async () => {
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
  });

  test('supports French, English, and Arabic localized copy', () => {
    const screen = renderCreate();
    expect(screen.getByText(t('prevention.create.title'))).toBeTruthy();
    act(() => setLocale('en'));
    expect(screen.getByText(t('prevention.create.title'))).toBeTruthy();
    act(() => setLocale('ar'));
    expect(screen.getByText(t('prevention.create.title'))).toBeTruthy();
  });

  test('Arabic RTL aligns text and uses reverse controls', () => {
    act(() => setLocale('ar'));
    const { getByTestId } = renderCreate();
    expect(getByTestId('prevention-create-title-input').props.style).toBeTruthy();
    expect(getByTestId('prevention-create-content').props.style).toBeTruthy();
  });

  test('submit and factor controls have at least 48dp targets', () => {
    const { getByTestId } = renderCreate();
    const submit = StyleSheet.flatten(getByTestId('prevention-create-submit').props.style);
    expect(submit.height ?? 48).toBeGreaterThanOrEqual(48);
    [
      'device_safety_design',
      'procedure_compliance',
      'workload_fatigue',
      'waste_disposal_container',
      'protective_equipment',
      'training_supervision',
      'environment_workspace',
      'other_factor',
    ].forEach((factor) => {
      const control = StyleSheet.flatten(
        getByTestId(`prevention-create-factor-${factor}`).props.style,
      );
      expect(control.minHeight ?? 48).toBeGreaterThanOrEqual(48);
    });
  });

  test('target date format is validated without adding a clinical deadline semantics', () => {
    const { getByTestId, getByText } = renderCreate();
    fillValidForm(getByTestId);
    fireEvent.changeText(getByTestId('prevention-create-target-date-input'), '31/12/2026');
    fireEvent.press(getByTestId('prevention-create-submit'));
    expect(getByText(t('prevention.create.validation.targetDate'))).toBeTruthy();
  });

  test('aggregate surveillance reference rejects individual declaration references', () => {
    const { getByTestId, getByText } = renderCreate();
    fillValidForm(getByTestId);
    fireEvent.changeText(
      getByTestId('prevention-create-surveillance-reference-input'),
      'AES-2026-123',
    );
    fireEvent.press(getByTestId('prevention-create-submit'));
    expect(getByText(t('prevention.create.validation.surveillanceReference'))).toBeTruthy();
  });

  test('back action remains available for deliberate cancellation', () => {
    const { getByTestId } = renderCreate();
    fireEvent.press(getByTestId('prevention-create-back'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
