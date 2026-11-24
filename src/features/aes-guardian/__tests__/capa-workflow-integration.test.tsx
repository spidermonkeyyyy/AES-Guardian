import React from 'react';
import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native';
import type { DatabaseService } from '../../../core/database/DatabaseService';
import { AesGuardianDatabase } from '../../../core/database/AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../../../core/database/NativeSQLiteAdapter';
import { useDemoRoleStore } from '../../../core/auth/use-demo-role';
import { setLocale, t } from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { PreventionOverviewScreen } from '../screens/PreventionOverviewScreen';
import { PreventionActionRegisterScreen } from '../screens/PreventionActionRegisterScreen';
import { PreventionActionDetailScreen } from '../screens/PreventionActionDetailScreen';

let mockDatabase: AesGuardianDatabase | null = null;
let mockActionId = 0;
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockFocusListeners: Array<() => void> = [];
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
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
    useRoute: () => ({ params: { actionId: mockActionId } }),
  };
});

jest.mock('../../../core', () => {
  const actual = jest.requireActual('../../../core');
  return {
    ...actual,
    getDatabase: () => {
      if (!mockDatabase) throw new Error('Integration test database is not initialized.');
      return mockDatabase;
    },
  };
});

const payload = {
  title: 'Synthetic CAPA integration action',
  description: 'Validate one persisted action across all prevention screens.',
  action_type: 'preventive' as const,
  contributing_factor: 'protective_equipment' as const,
  rationale: 'Synthetic integration test for durable CAPA workflow.',
  surveillance_reference: 'Synthetic aggregate observation',
};
const operationId = 'c4a4bced-3b4e-4e31-9df3-3182db6c1a21';
const referenceCode = 'CAPA-2026-94101';

const getQualityStaffUserId = (): number => {
  const context = useDemoRoleStore.getState().activeContext;
  if (context.role !== 'quality_staff' || typeof context.userId !== 'number') {
    throw new Error('The integration test requires the synthetic quality-staff identity.');
  }
  return context.userId;
};

type WorkflowScreen = 'overview' | 'register' | 'detail';

const WorkflowHost: React.FC = () => {
  const [stack, setStack] = React.useState<WorkflowScreen[]>(['overview']);
  React.useEffect(() => {
    mockNavigate.mockImplementation((route: string, params?: { actionId?: number }) => {
      if (route === 'preventionOverview') {
        setStack(current => [...current, 'overview']);
      } else if (route === 'preventionRegister') {
        setStack(current => [...current, 'register']);
      } else if (route === 'preventionActionDetail') {
        mockActionId = params?.actionId ?? 0;
        setStack(current => [...current, 'detail']);
      }
    });
    mockGoBack.mockImplementation(() => {
      setStack(current => current.length > 1 ? current.slice(0, -1) : current);
    });
    return () => {
      mockNavigate.mockReset();
      mockGoBack.mockReset();
    };
  }, []);

  const currentScreen = stack[stack.length - 1];
  return (
    <ThemeProvider>
      {currentScreen === 'overview' ? <PreventionOverviewScreen />
        : currentScreen === 'register' ? <PreventionActionRegisterScreen />
          : <PreventionActionDetailScreen />}
    </ThemeProvider>
  );
};

describe('CAPA persisted workflow screen integration', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockFocusListeners.length = 0;
    mockActionId = 0;
    setLocale('fr');
    useDemoRoleStore.getState().setRole('quality_staff');
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as unknown as DatabaseService);
    await db.initialize();
    mockDatabase = db;
  });

  afterEach(() => {
    mockDatabase = null;
    adapter.close();
    jest.restoreAllMocks();
  });

  const persistedCounts = async (
    actionId: number,
    exactOperationId = operationId,
    exactReferenceCode = referenceCode,
  ) => {
    const [actions, operations, audits, notifications] = await Promise.all([
      db.query<{ count: number }>(
        'SELECT COUNT(*) AS count FROM prevention_actions WHERE reference_code = ?',
        [exactReferenceCode],
      ),
      db.query<{ count: number }>(
        'SELECT COUNT(*) AS count FROM capa_creation_operations WHERE operation_id = ?',
        [exactOperationId],
      ),
      db.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM audit_events
         WHERE entity_type = 'prevention_action' AND entity_id = ?`,
        [actionId],
      ),
      db.query<{ count: number }>(
        `SELECT COUNT(*) AS count FROM in_app_notifications
         WHERE entity_type = 'prevention_action' AND entity_id = ?`,
        [actionId],
      ),
    ]);
    return {
      actions: actions.rows[0].count,
      operations: operations.rows[0].count,
      audits: audits.rows[0].count,
      notifications: notifications.rows[0].count,
    };
  };

  test('one persisted CAPA flows through Overview, Register, Detail, mutation, and refreshed screens', async () => {
    const creatorId = getQualityStaffUserId();
    const creator = await db.getDemoUser(creatorId);
    expect(creator?.role).toBe('quality_staff');

    const reservation = await db.reserveCapaCreationOperation(
      creatorId,
      payload,
      operationId,
      referenceCode,
      'new',
    );
    const action = await db.createPreventionActionForOperation(
      creatorId,
      payload,
      operationId,
      reservation.reference_code,
      'new',
    );
    expect(action.reference_code).toBe(referenceCode);
    expect((await db.getCapaCreationOperation(creatorId, operationId))?.prevention_action_id)
      .toBe(action.id);
    const initialCounts = await persistedCounts(action.id);
    expect(initialCounts).toEqual({ actions: 1, operations: 1, audits: 1, notifications: 1 });

    const workflow = render(<WorkflowHost />);
    await waitFor(() => {
      expect(workflow.getByTestId('prevention-overview-count-proposed').props.children).toBe(1);
    });
    expect(within(workflow.getByTestId('prevention-overview-total')).getByText('1')).toBeTruthy();
    expect(await persistedCounts(action.id)).toEqual(initialCounts);
    fireEvent.press(workflow.getByTestId('prevention-overview-view-register'));
    expect(mockNavigate).toHaveBeenLastCalledWith('preventionRegister');

    await waitFor(() => expect(workflow.getByTestId(`prevention-register-action-${action.id}`)).toBeTruthy());
    expect(workflow.getByText(referenceCode)).toBeTruthy();
    expect(workflow.getByTestId(`prevention-register-status-${action.id}`).props.accessibilityLabel)
      .toBe(t('prevention.detail.status.proposed'));
    expect(await persistedCounts(action.id)).toEqual(initialCounts);
    fireEvent.press(workflow.getByTestId(`prevention-register-detail-${action.id}`));
    expect(mockNavigate).toHaveBeenLastCalledWith(
      'preventionActionDetail',
      { actionId: action.id },
    );

    await waitFor(() => expect(workflow.getByTestId('prevention-detail-reference')).toBeTruthy());
    expect(workflow.getByText(payload.title)).toBeTruthy();
    expect(workflow.getByText(payload.description)).toBeTruthy();
    const creationAudit = await db.query<{ id: number; user_id: number; event_type: string }>(
      `SELECT id, user_id, event_type FROM audit_events
       WHERE entity_type = 'prevention_action' AND entity_id = ?`,
      [action.id],
    );
    expect(creationAudit.rows).toHaveLength(1);
    expect(creationAudit.rows[0]).toMatchObject({
      user_id: creatorId,
      event_type: 'prevention_action_created',
    });
    expect(workflow.getByTestId(`prevention-detail-audit-event-${creationAudit.rows[0].id}`))
      .toBeTruthy();

    await act(async () => fireEvent.press(workflow.getByTestId('prevention-detail-start')));
    await waitFor(() => {
      expect(workflow.getByTestId('prevention-detail-status').props.accessibilityLabel)
        .toBe(t('prevention.detail.status.in_progress'));
    });
    const updated = await db.getPreventionActionById(creatorId, action.id);
    expect(updated?.status).toBe('in_progress');
    expect(updated?.audit_history).toHaveLength(2);
    expect(updated?.audit_history[1]).toMatchObject({
      user_id: creatorId,
      event_type: 'prevention_status_changed',
      entity_id: action.id,
    });
    const persistedNotifications = await db.query<{
      event_type: string;
      entity_reference: string;
      entity_id: number;
    }>(
      `SELECT event_type, entity_reference, entity_id
       FROM in_app_notifications
       WHERE entity_type = 'prevention_action' AND entity_id = ?
       ORDER BY id ASC`,
      [action.id],
    );
    expect(persistedNotifications.rows).toEqual([
      { event_type: 'capa_created', entity_reference: referenceCode, entity_id: action.id },
      { event_type: 'capa_status_changed', entity_reference: referenceCode, entity_id: action.id },
    ]);
    const afterTransitionCounts = await persistedCounts(action.id);
    expect(afterTransitionCounts).toEqual({ actions: 1, operations: 1, audits: 2, notifications: 2 });

    fireEvent.press(workflow.getByTestId('prevention-detail-back'));
    await waitFor(() => {
      expect(
        workflow.getByTestId(`prevention-register-status-${action.id}`).props.accessibilityLabel,
      ).toBe(t('prevention.detail.status.in_progress'));
    });
    act(() => mockNavigate('preventionOverview'));
    await waitFor(() => {
      expect(workflow.getByTestId('prevention-overview-count-proposed').props.children).toBe(0);
      expect(workflow.getByTestId('prevention-overview-count-in_progress').props.children).toBe(1);
    });
    expect(await persistedCounts(action.id)).toEqual(afterTransitionCounts);
    expect((await db.listPreventionActions(creatorId)).filter(row => row.id === action.id)).toHaveLength(1);
    expect((await db.getPreventionActionById(creatorId, action.id))?.status).toBe('in_progress');
  });

  test('local CAPA create, retrieve, and status update work while network fetch is denied', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('Network access is disabled in this test.');
    });
    const xhrSendSpy = typeof XMLHttpRequest === 'undefined'
      ? null
      : jest.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {
        throw new Error('Network access is disabled in this test.');
      });
    const creatorId = getQualityStaffUserId();
    const offlineOperationId = 'c5b5cbed-3b4e-4e31-9df3-3182db6c1a22';
    const offlineReferenceCode = 'CAPA-2026-94102';

    const reservation = await db.reserveCapaCreationOperation(
      creatorId,
      payload,
      offlineOperationId,
      offlineReferenceCode,
      'new',
    );
    const created = await db.createPreventionActionForOperation(
      creatorId,
      payload,
      offlineOperationId,
      reservation.reference_code,
      'new',
    );
    const persisted = await db.getPreventionActionById(creatorId, created.id);
    expect(persisted?.reference_code).toBe(offlineReferenceCode);
    const updated = await db.updatePreventionActionStatus(
      creatorId,
      created.id,
      'in_progress',
    );
    expect(updated.status).toBe('in_progress');
    expect((await db.getPreventionActionById(creatorId, created.id))?.status).toBe('in_progress');
    expect(await persistedCounts(created.id, offlineOperationId, offlineReferenceCode)).toEqual({
      actions: 1,
      operations: 1,
      audits: 2,
      notifications: 2,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    if (xhrSendSpy) expect(xhrSendSpy).not.toHaveBeenCalled();
  });
});
