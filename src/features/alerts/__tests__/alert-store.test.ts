import { useAlertStore } from '../state/use-alert-store';
import {
  Alert,
  AlertStatus,
  AlertPriority,
  NurseAction,
  NurseDecision,
  groupAlertsByPatient,
  matchesFilter,
} from '../../../types/alert';
import { MockAlertRepository } from '../../../services/repositories/alert-repository.mock';

function createAlert(
  id: string,
  status: AlertStatus = AlertStatus.unread,
  priority: AlertPriority = 'high',
  createdAt: string = '2026-08-12T10:00:00.000Z',
  patientId: string = 'p1',
): Alert {
  return {
    id,
    patientId,
    patientName: 'Ahmed Bensalem',
    patientSummary: 'BPCO · GOLD III',
    reason: 'Test alert',
    priority,
    status,
    createdAt,
    acknowledgedAt: null,
    resolvedAt: null,
    triggeredRules: [],
    supportingMeasurements: [],
    submissionId: 'ms-1',
  };
}

const resetStore = () => {
  useAlertStore.setState({
    alerts: [],
    isLoading: false,
    errorMessage: null,
    filter: 'all',
    pendingAlertId: null,
    repository: new MockAlertRepository(),
  });
};

describe('useAlertStore', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('unreadCount counts unread alerts only', () => {
    useAlertStore.setState({
      alerts: [createAlert('a1', AlertStatus.unread), createAlert('a2', AlertStatus.acknowledged), createAlert('a3', AlertStatus.unread)],
    });
    expect(useAlertStore.getState().unreadCount()).toBe(2);
  });

  test('openCount excludes resolved alerts', () => {
    useAlertStore.setState({
      alerts: [createAlert('a1', AlertStatus.unread), createAlert('a2', AlertStatus.acknowledged), createAlert('a3', AlertStatus.resolved)],
    });
    expect(useAlertStore.getState().openCount()).toBe(2);
  });

  test('highPriorityOpenCount filters by open AND high priority', () => {
    useAlertStore.setState({
      alerts: [
        createAlert('a1', AlertStatus.unread, 'high'),
        createAlert('a2', AlertStatus.unread, 'low'),
        createAlert('a3', AlertStatus.resolved, 'high'),
      ],
    });
    expect(useAlertStore.getState().highPriorityOpenCount()).toBe(1);
  });

  test('filteredAlerts respects unhandled filter', () => {
    useAlertStore.setState({
      alerts: [createAlert('a1', AlertStatus.unread), createAlert('a2', AlertStatus.acknowledged)],
      filter: 'unhandled',
    });
    expect(useAlertStore.getState().filteredAlerts()).toHaveLength(1);
    expect(useAlertStore.getState().filteredAlerts()[0].id).toBe('a1');
  });

  test('filteredAlerts respects resolved filter', () => {
    useAlertStore.setState({
      alerts: [createAlert('a1', AlertStatus.unread), createAlert('a2', AlertStatus.resolved)],
      filter: 'resolved',
    });
    expect(useAlertStore.getState().filteredAlerts()).toHaveLength(1);
    expect(useAlertStore.getState().filteredAlerts()[0].id).toBe('a2');
  });

  test('filteredAlerts sorts by priority then recency', () => {
    useAlertStore.setState({
      alerts: [
        createAlert('a1', AlertStatus.unread, 'low', '2026-08-12T10:00:00.000Z'),
        createAlert('a2', AlertStatus.unread, 'high', '2026-08-12T09:00:00.000Z'),
        createAlert('a3', AlertStatus.unread, 'high', '2026-08-12T11:00:00.000Z'),
      ],
    });
    const sorted = useAlertStore.getState().filteredAlerts();
    expect(sorted[0].id).toBe('a3');
    expect(sorted[1].id).toBe('a2');
    expect(sorted[2].id).toBe('a1');
  });

  test('acknowledge transitions unread -> acknowledged', async () => {
    const a1 = createAlert('a1', AlertStatus.unread);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    const result = await useAlertStore.getState().acknowledge('a1', 'nurse_001');
    expect(result).toBe(true);
    expect(useAlertStore.getState().alerts[0].status).toBe(AlertStatus.acknowledged);
  });

  test('acknowledge rejects non-unread alert', async () => {
    const a1 = createAlert('a1', AlertStatus.acknowledged);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    const result = await useAlertStore.getState().acknowledge('a1', 'nurse_001');
    expect(result).toBe(false);
    expect(useAlertStore.getState().errorMessage).toBeTruthy();
  });

  test('acknowledge handles not-found error', async () => {
    const a1 = createAlert('a1', AlertStatus.unread);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    await useAlertStore.getState().acknowledge('missing', 'nurse_001');
    const state = useAlertStore.getState();
    expect(state.errorMessage).toBeTruthy();
    expect(state.pendingAlertId).toBeNull();
  });

  test('resolve transitions inProgress -> resolved', async () => {
    const a1 = createAlert('a1', AlertStatus.inProgress);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    const result = await useAlertStore.getState().resolve('a1', 'Note de résolution');
    expect(result).toBe(true);
    expect(useAlertStore.getState().alerts[0].status).toBe(AlertStatus.resolved);
  });

  test('resolve rejects unread alert', async () => {
    const a1 = createAlert('a1', AlertStatus.unread);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    const result = await useAlertStore.getState().resolve('a1');
    expect(result).toBe(false);
    expect(useAlertStore.getState().alerts[0].status).toBe(AlertStatus.unread);
    expect(useAlertStore.getState().errorMessage).toBeTruthy();
  });

  test('recordAction requires justification for notConcerning', async () => {
    const a1 = createAlert('a1', AlertStatus.acknowledged);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    const result = await useAlertStore.getState().recordAction('a1', 'monitoring', 'notConcerning');
    expect(result).toBe(false);
    expect(useAlertStore.getState().errorMessage).toBeTruthy();
  });

  test('recordAction transitions to inProgress', async () => {
    const a1 = createAlert('a1', AlertStatus.acknowledged);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    const result = await useAlertStore.getState().recordAction('a1', 'monitoring', 'enhancedMonitoring', 'Note');
    expect(result).toBe(true);
    expect(useAlertStore.getState().alerts[0].status).toBe(AlertStatus.inProgress);
  });

  test('recordAction requires note for other action', async () => {
    const a1 = createAlert('a1', AlertStatus.acknowledged);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    const result = await useAlertStore.getState().recordAction('a1', 'other', 'actionRequired');
    expect(result).toBe(false);
    expect(useAlertStore.getState().errorMessage).toBeTruthy();
  });

  test('alertById finds alert by id', () => {
    useAlertStore.setState({ alerts: [createAlert('a1'), createAlert('a2')] });
    expect(useAlertStore.getState().alertById('a1')).toBeDefined();
    expect(useAlertStore.getState().alertById('missing')).toBeUndefined();
  });

  test('alertsForPatient filters by patient id', () => {
    useAlertStore.setState({
      alerts: [
        createAlert('a1', AlertStatus.unread, 'high', '2026-08-12T10:00:00.000Z', 'p1'),
        createAlert('a2', AlertStatus.unread, 'high', '2026-08-12T11:00:00.000Z', 'p2'),
      ],
    });
    expect(useAlertStore.getState().alertsForPatient('p1')).toHaveLength(1);
    expect(useAlertStore.getState().alertsForPatient('p2')).toHaveLength(1);
    expect(useAlertStore.getState().alertsForPatient('p3')).toHaveLength(0);
  });

  test('isEmpty is true when not loading, no error, and no filtered alerts', () => {
    useAlertStore.setState({ alerts: [], isLoading: false, errorMessage: null, filter: 'all' });
    expect(useAlertStore.getState().isEmpty()).toBe(true);
  });

  test('isEmpty is false while loading', () => {
    useAlertStore.setState({ alerts: [], isLoading: true, errorMessage: null, filter: 'all' });
    expect(useAlertStore.getState().isEmpty()).toBe(false);
  });

  test('loadAlerts sets alerts from seeded repository', async () => {
    const a1 = createAlert('a1', AlertStatus.unread);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [], isLoading: false, errorMessage: 'Previous error', repository: repo });
    await useAlertStore.getState().loadAlerts();
    expect(useAlertStore.getState().alerts).toHaveLength(1);
    expect(useAlertStore.getState().errorMessage).toBeNull();
    expect(useAlertStore.getState().isLoading).toBe(false);
  });

  test('setFilter changes current filter', () => {
    useAlertStore.getState().setFilter('highPriority');
    expect(useAlertStore.getState().filter).toBe('highPriority');
  });

  test('clearError clears errorMessage', () => {
    useAlertStore.setState({ errorMessage: 'Some error' });
    useAlertStore.getState().clearError();
    expect(useAlertStore.getState().errorMessage).toBeNull();
  });

  test('acknowledge sets pending state during mutation', async () => {
    const a1 = createAlert('a1', AlertStatus.unread);
    const repo = new MockAlertRepository([a1]);
    useAlertStore.setState({ alerts: [a1], repository: repo });
    const acknowledgePromise = useAlertStore.getState().acknowledge('a1', 'nurse_001');
    expect(useAlertStore.getState().pendingAlertId).toBe('a1');
    await acknowledgePromise;
    expect(useAlertStore.getState().pendingAlertId).toBeNull();
  });
});

describe('groupAlertsByPatient', () => {
  test('groups alerts by patient id', () => {
    const alerts: Alert[] = [
      createAlert('a1', AlertStatus.unread, 'high', '2026-08-12T10:00:00.000Z', 'p1'),
      createAlert('a2', AlertStatus.unread, 'high', '2026-08-12T11:00:00.000Z', 'p2'),
      createAlert('a3', AlertStatus.unread, 'high', '2026-08-12T09:00:00.000Z', 'p1'),
    ];
    const groups = groupAlertsByPatient(alerts);
    expect(groups).toHaveLength(2);
  });

  test('sorts groups by priority then recency', () => {
    const alerts: Alert[] = [
      createAlert('a1', AlertStatus.unread, 'low', '2026-08-12T10:00:00.000Z', 'p1'),
      createAlert('a2', AlertStatus.unread, 'high', '2026-08-12T09:00:00.000Z', 'p2'),
    ];
    const groups = groupAlertsByPatient(alerts);
    expect(groups[0].patientId).toBe('p2');
    expect(groups[1].patientId).toBe('p1');
  });
});

describe('matchesFilter', () => {
  test('all matches any alert', () => {
    expect(matchesFilter(createAlert('a1'), 'all')).toBe(true);
  });
});
