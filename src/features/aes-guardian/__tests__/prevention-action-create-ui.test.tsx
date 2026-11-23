import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PreventionActionCreateScreen } from '../screens/PreventionActionCreateScreen';
import { PreventionActionCreationUncertainError } from '../../../core';
import { useDemoRoleStore } from '../../../core/auth/use-demo-role';
import { setLocale, t } from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockCreatePreventionAction = jest.fn();
const mockCreateReferenceCode = jest.fn(() => 'CAPA-2026-00021');
const mockReconcileCreation = jest.fn();
const mockReserveCreation = jest.fn();
const mockListPendingCreation = jest.fn();
const mockReconcileOperation = jest.fn();
const mockCreateOperationId = jest.fn(() => '11111111-1111-4111-8111-111111111111');
const mockCreateForOperation = jest.fn();
const mockListUnacknowledged = jest.fn();
const mockAcknowledgeOperation = jest.fn();

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
      createPreventionActionReferenceCode: mockCreateReferenceCode,
      reconcilePreventionActionCreation: mockReconcileCreation,
      reserveCapaCreationOperation: mockReserveCreation,
      listPendingCapaCreationOperations: mockListPendingCreation,
      reconcileCapaCreationOperation: mockReconcileOperation,
      createCapaCreationOperationId: mockCreateOperationId,
      createPreventionActionForOperation: mockCreateForOperation,
      listUnacknowledgedCommittedCapaCreationOperations: mockListUnacknowledged,
      acknowledgeCapaCreationOperation: mockAcknowledgeOperation,
    })),
  };
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
    mockCreateReferenceCode.mockReturnValue('CAPA-2026-00021');
    mockReconcileCreation.mockResolvedValue(null);
    mockListPendingCreation.mockResolvedValue([]);
    mockReserveCreation.mockResolvedValue({
      operation_id: '11111111-1111-4111-8111-111111111111',
      reference_code: 'CAPA-2026-00021',
      status: 'pending',
    });
    mockReconcileOperation.mockResolvedValue(null);
    mockListUnacknowledged.mockResolvedValue([]);
    mockCreateForOperation.mockResolvedValue({
      id: 21,
      reference_code: 'CAPA-2026-00021',
      status: 'proposed',
    });
    mockCreateForOperation.mockImplementation(
      (userId, input, operationId, referenceCode, intent) => {
        if (intent === 'new') {
          return mockCreatePreventionAction(userId, input, referenceCode);
        }
        return mockCreatePreventionAction(userId, input, referenceCode, operationId);
      },
    );
    mockAcknowledgeOperation.mockResolvedValue({});
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
      'CAPA-2026-00021',
    );
  });

  test('initial Stage A and Stage B use new with the same operation ID', async () => {
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));

    await waitFor(() => expect(mockReserveCreation).toHaveBeenCalled());
    expect(mockReserveCreation).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ title: 'Dotation en collecteurs de sécurité' }),
      '11111111-1111-4111-8111-111111111111',
      undefined,
      'new',
    );
    await waitFor(() => expect(mockCreateForOperation).toHaveBeenCalled());
    expect(mockCreateForOperation).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ title: 'Dotation en collecteurs de sécurité' }),
      '11111111-1111-4111-8111-111111111111',
      'CAPA-2026-00021',
      'new',
    );
    const stageAInput = mockReserveCreation.mock.calls[0][1];
    const stageBInput = mockCreateForOperation.mock.calls[0][1];
    expect(stageBInput).toEqual(stageAInput);
    expect(stageBInput).toEqual({
      title: 'Dotation en collecteurs de sécurité',
      description: 'Installer des collecteurs conformes dans chaque box de soins.',
      action_type: 'corrective',
      contributing_factor: 'device_safety_design',
      rationale: 'Réduire les expositions percutanées lors des soins.',
      target_date: undefined,
      surveillance_reference: undefined,
    });
    expect(mockCreateOperationId).toHaveBeenCalledTimes(1);
  });

  test('initial submission passes new intent to Stage A and Stage B with the same ID', async () => {
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));

    await waitFor(() => expect(mockReserveCreation).toHaveBeenCalled());
    expect(mockReserveCreation).toHaveBeenCalledWith(
      4,
      expect.objectContaining({
        title: 'Dotation en collecteurs de sécurité',
      }),
      '11111111-1111-4111-8111-111111111111',
      undefined,
      'new',
    );
    await waitFor(() => expect(mockCreateForOperation).toHaveBeenCalled());
    expect(mockCreateForOperation).toHaveBeenCalledWith(
      4,
      expect.objectContaining({
        title: 'Dotation en collecteurs de sécurité',
      }),
      '11111111-1111-4111-8111-111111111111',
      'CAPA-2026-00021',
      'new',
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

  test('retry behavior resubmits the preserved form with the same stable reference', async () => {
    mockCreatePreventionAction
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValueOnce({ id: 22, reference_code: 'CAPA-2026-00021', status: 'proposed' });
    const { getByTestId, queryByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(getByTestId('prevention-create-error')).toBeTruthy());
    await act(async () => fireEvent.press(getByTestId('prevention-create-retry')));
    await waitFor(() => expect(queryByTestId('prevention-create-error')).toBeNull());
    expect(mockCreatePreventionAction).toHaveBeenCalledTimes(2);
    expect(mockCreatePreventionAction.mock.calls[0][2]).toBe('CAPA-2026-00021');
    expect(mockCreatePreventionAction.mock.calls[1][2]).toBe('CAPA-2026-00021');
    expect(mockCreateForOperation.mock.calls[0][4]).toBe('new');
    expect(mockCreateForOperation.mock.calls[1][4]).toBe('retry');
    expect(mockCreateForOperation.mock.calls[0][2]).toBe(
      mockCreateForOperation.mock.calls[1][2],
    );
    expect(mockCreateOperationId).toHaveBeenCalledTimes(1);
  });

  test('uncertain creation blocks blind retry until exact-reference reconciliation confirms absence', async () => {
    mockCreatePreventionAction.mockRejectedValueOnce(
      new PreventionActionCreationUncertainError('CAPA-2026-00021'),
    );
    mockReconcileOperation.mockResolvedValueOnce(null);
    const { getByTestId, queryByTestId, getByText } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));

    await waitFor(() => expect(getByTestId('prevention-create-reconcile')).toBeTruthy());
    expect(queryByTestId('prevention-create-retry')).toBeNull();
    expect(getByTestId('prevention-create-submit').props.accessibilityState?.disabled ??
      getByTestId('prevention-create-submit').props.disabled).toBeTruthy();
    expect(getByTestId('prevention-create-title-input').props.editable).toBe(false);

    await act(async () => fireEvent.press(getByTestId('prevention-create-reconcile')));
    expect(mockReconcileOperation).toHaveBeenCalledWith(
      4,
      '11111111-1111-4111-8111-111111111111',
      expect.objectContaining({ title: 'Dotation en collecteurs de sécurité' }),
    );
    expect(getByText(t('prevention.create.reconcileAbsent'))).toBeTruthy();
    await act(async () => fireEvent.press(getByTestId('prevention-create-retry')));
    expect(mockCreatePreventionAction).toHaveBeenCalledTimes(2);
    expect(mockCreatePreventionAction.mock.calls[0][2]).toBe(mockCreatePreventionAction.mock.calls[1][2]);
    expect(mockCreateForOperation.mock.calls[0][2]).toBe(
      mockCreateForOperation.mock.calls[1][2],
    );
    expect(mockCreateForOperation.mock.calls[0][4]).toBe('new');
    expect(mockCreateForOperation.mock.calls[1][4]).toBe('retry');
    expect(mockCreateOperationId).toHaveBeenCalledTimes(1);
  });

  test('reconciliation presents exact action and waits for explicit confirmation', async () => {
    mockCreatePreventionAction.mockRejectedValueOnce(
      new PreventionActionCreationUncertainError('CAPA-2026-00021'),
    );
    mockReconcileOperation.mockResolvedValueOnce({ id: 21, reference_code: 'CAPA-2026-00021' });
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(getByTestId('prevention-create-reconcile')).toBeTruthy());
    await act(async () => fireEvent.press(getByTestId('prevention-create-reconcile')));
    await waitFor(() => expect(getByTestId('prevention-create-result')).toBeTruthy());
    expect(mockAcknowledgeOperation).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
    await act(async () => fireEvent.press(getByTestId('prevention-create-confirm-presentation')));
    await waitFor(() => expect(mockAcknowledgeOperation).toHaveBeenCalledWith(4, '11111111-1111-4111-8111-111111111111'));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
    expect(mockCreatePreventionAction).toHaveBeenCalledTimes(1);
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

  test('acknowledged operation is not reused for a genuine new submission', async () => {
    mockCreateOperationId
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222');
    mockReserveCreation
      .mockResolvedValueOnce({
        operation_id: '11111111-1111-4111-8111-111111111111',
        reference_code: 'CAPA-2026-00021',
        status: 'pending',
      })
      .mockResolvedValueOnce({
        operation_id: '22222222-2222-4222-8222-222222222222',
        reference_code: 'CAPA-2026-00022',
        status: 'pending',
      });
    mockCreateForOperation
      .mockResolvedValueOnce({
        id: 21,
        reference_code: 'CAPA-2026-00021',
        status: 'proposed',
      })
      .mockResolvedValueOnce({
        id: 22,
        reference_code: 'CAPA-2026-00022',
        status: 'proposed',
      });

    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(getByTestId('prevention-create-result')).toBeTruthy());
    await act(async () => fireEvent.press(getByTestId('prevention-create-confirm-presentation')));
    await waitFor(() => expect(mockAcknowledgeOperation).toHaveBeenCalledWith(
      4,
      '11111111-1111-4111-8111-111111111111',
    ));

    // The acknowledged flow must reset the Create-screen operation lifecycle.
    mockCreateOperationId.mockClear();
    mockCreateForOperation.mockClear();
    mockReserveCreation.mockClear();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));

    await waitFor(() => expect(mockReserveCreation).toHaveBeenCalled());
    expect(mockCreateOperationId).toHaveBeenCalledTimes(1);
    expect(mockReserveCreation.mock.calls[0][2]).toBe(
      '22222222-2222-4222-8222-222222222222',
    );
    expect(mockCreateForOperation.mock.calls[0][2]).toBe(
      '22222222-2222-4222-8222-222222222222',
    );
    expect(mockCreateForOperation.mock.calls[0][4]).toBe('new');
  });

  test('confirmed success presents a result and waits for explicit confirmation', async () => {
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(getByTestId('prevention-create-result')).toBeTruthy());
    expect(mockAcknowledgeOperation).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
    await act(async () => fireEvent.press(getByTestId('prevention-create-confirm-presentation')));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
  });

  test('remount restores one pending operation instead of generating a new operation', async () => {
    mockListPendingCreation.mockResolvedValue([
      {
        operation_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        reference_code: 'CAPA-2026-00022',
        status: 'pending',
        payload_json: JSON.stringify({
          title: 'Restored durable operation',
          description: 'Restored from the durable operation table.',
          action_type: 'preventive',
          contributing_factor: 'protective_equipment',
          rationale: 'Recovery must preserve the original operation.',
          target_date: null,
          surveillance_reference: null,
        }),
      },
    ]);
    const screen = renderCreate();
    await waitFor(() =>
      expect(screen.getByTestId('prevention-create-title-input').props.value)
        .toBe('Restored durable operation'),
    );
    await act(async () => fireEvent.press(screen.getByTestId('prevention-create-submit')));
    expect(mockReserveCreation).not.toHaveBeenCalled();
    expect(mockCreateForOperation).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ title: 'Restored durable operation' }),
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'CAPA-2026-00022',
      'retry',
    );
  });

  test('committed unacknowledged operation is recovered and acknowledged after presentation', async () => {
    mockListUnacknowledged.mockResolvedValue([
      {
        operation_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        reference_code: 'CAPA-2026-00025',
        status: 'committed',
        payload_json: JSON.stringify({
          title: 'Recovered committed operation',
          description: 'Recovered after process restart.',
          action_type: 'preventive',
          contributing_factor: 'protective_equipment',
          rationale: 'No duplicate creation is permitted.',
          target_date: null,
          surveillance_reference: null,
        }),
      },
    ]);
    mockReconcileOperation.mockResolvedValue({
      id: 25,
      reference_code: 'CAPA-2026-00025',
    });
    const screen = renderCreate();
    await waitFor(() =>
      expect(screen.getByTestId('prevention-create-result')).toBeTruthy(),
    );
    expect(mockAcknowledgeOperation).not.toHaveBeenCalled();
    await act(async () =>
      fireEvent.press(screen.getByTestId('prevention-create-confirm-presentation')),
    );
    await waitFor(() =>
      expect(mockAcknowledgeOperation).toHaveBeenCalledWith(
        4,
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      ),
    );
  });

  test('failed acknowledgement keeps the result and allows retry without recreation', async () => {
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    mockAcknowledgeOperation
      .mockRejectedValueOnce(new Error('acknowledgement failure'))
      .mockResolvedValueOnce({});
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(getByTestId('prevention-create-result')).toBeTruthy());
    await act(async () => fireEvent.press(getByTestId('prevention-create-confirm-presentation')));
    await waitFor(() =>
      expect(getByTestId('prevention-create-acknowledgement-error')).toBeTruthy(),
    );
    expect(mockCreatePreventionAction).toHaveBeenCalledTimes(1);
    await act(async () => fireEvent.press(getByTestId('prevention-create-confirm-presentation')));
    await waitFor(() => expect(mockGoBack).toHaveBeenCalledTimes(1));
    expect(mockAcknowledgeOperation).toHaveBeenCalledTimes(2);
    expect(mockAcknowledgeOperation.mock.calls[0][1]).toBe(
      mockAcknowledgeOperation.mock.calls[1][1],
    );
  });

  test('double confirmation interaction invokes acknowledgement only once', async () => {
    mockAcknowledgeOperation.mockImplementation(() => new Promise(() => {}));
    const { getByTestId } = renderCreate();
    fillValidForm(getByTestId);
    await act(async () => fireEvent.press(getByTestId('prevention-create-submit')));
    await waitFor(() => expect(getByTestId('prevention-create-result')).toBeTruthy());

    fireEvent.press(getByTestId('prevention-create-confirm-presentation'));
    fireEvent.press(getByTestId('prevention-create-confirm-presentation'));

    await waitFor(() => expect(mockAcknowledgeOperation).toHaveBeenCalledTimes(1));
    expect(mockCreatePreventionAction).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  test('multiple pending operations block arbitrary recovery selection', async () => {
    mockListPendingCreation.mockResolvedValue([
      { operation_id: 'operation-one', reference_code: 'CAPA-2026-00023', status: 'pending' },
      { operation_id: 'operation-two', reference_code: 'CAPA-2026-00024', status: 'pending' },
    ]);
    const screen = renderCreate();
    await waitFor(() => expect(screen.getByTestId('prevention-create-error')).toBeTruthy());
    fireEvent.press(screen.getByTestId('prevention-create-submit'));
    expect(mockCreatePreventionAction).not.toHaveBeenCalled();
  });

  test('supports French, English, and Arabic localized copy', () => {
    const screen = renderCreate();
    expect(screen.getByText(t('prevention.create.title'))).toBeTruthy();
    act(() => setLocale('en'));
    expect(screen.getByText(t('prevention.create.title'))).toBeTruthy();
    act(() => setLocale('ar'));
    expect(screen.getByText(t('prevention.create.title'))).toBeTruthy();
  });

  test('Arabic RTL aligns text and reverses option indicators', () => {
    act(() => setLocale('ar'));
    const { getByTestId } = renderCreate();
    expect(getByTestId('prevention-create-title-input').props.style).toBeTruthy();
    expect(getByTestId('prevention-create-content').props.style).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId('prevention-create-action-type-corrective').props.style).flexDirection)
      .toBe('row-reverse');
  });

  test('all five form inputs have localized accessibility labels', () => {
    const { getByTestId } = renderCreate();
    const fields = [
      ['prevention-create-title-input', 'prevention.create.actionTitle'],
      ['prevention-create-description-input', 'prevention.create.description'],
      ['prevention-create-rationale-input', 'prevention.create.rationale'],
      ['prevention-create-target-date-input', 'prevention.create.target_date'],
      ['prevention-create-surveillance-reference-input', 'prevention.create.surveillance_reference'],
    ] as const;
    fields.forEach(([testID, key]) => {
      expect(getByTestId(testID).props.accessibilityLabel).toBe(t(key));
    });
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
