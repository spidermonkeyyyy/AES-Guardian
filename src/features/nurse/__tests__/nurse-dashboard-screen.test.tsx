import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import {
  MockNurseDashboardRepository,
} from '../../../services/repositories/nurse-dashboard.mock';
import { NurseDashboardRepository } from '../../../services/repositories/nurse-dashboard';
import { useNurseDashboardStore, setNurseDashboardRepository } from '../dashboard/state/use-nurse-dashboard-store';
import NurseDashboardScreen from '../screens/NurseDashboardScreen';

const navigation = {
  navigate: jest.fn(),
};

const failedRepository: NurseDashboardRepository = {
  getDashboardSummary: async () => { throw new Error('offline'); },
  getPriorityQueue: async () => [],
  getRecentSubmissions: async () => [],
  getMonitoringRules: async () => [],
};

describe('Nurse dashboard screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setLocale('fr');
    setNurseDashboardRepository(new MockNurseDashboardRepository());
    useNurseDashboardStore.setState({
      isLoading: true,
      errorMessage: null,
      summary: null,
      priorityQueue: [],
      recentSubmissions: [],
      worklistItems: [],
      worklistFilter: 'all',
    });
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    setNurseDashboardRepository(new MockNurseDashboardRepository());
    act(() => {
      useNurseDashboardStore.setState({
        isLoading: true,
        errorMessage: null,
        summary: null,
        priorityQueue: [],
        recentSubmissions: [],
        worklistItems: [],
        worklistFilter: 'all',
      });
    });
  });

  it('provides translated dashboard labels in every locale', () => {
    const keys = [
      'nurse.dashboard.title',
      'nurse.dashboard.subtitle',
      'nurse.dashboard.demoNotice',
      'nurse.dashboard.greeting',
      'nurse.dashboard.greetingGeneric',
      'nurse.dashboard.rules',
      'nurse.dashboard.attentionRequired',
      'nurse.dashboard.attentionCount',
      'nurse.dashboard.category.alerts',
      'nurse.dashboard.category.tasks',
      'nurse.dashboard.category.monitoring',
      'nurse.dashboard.worklist',
      'nurse.dashboard.filter.all',
      'nurse.dashboard.filter.alerts',
      'nurse.dashboard.filter.tasks',
      'nurse.dashboard.filter.monitoring',
      'nurse.dashboard.empty.title',
      'nurse.dashboard.empty.subtitle',
      'nurse.dashboard.error.load',
      'nurse.dashboard.retry',
      'nurse.dashboard.priorityPatients',
      'nurse.dashboard.seeAll',
      'nurse.dashboard.status.newCheckIn',
      'nurse.dashboard.status.noNewCheckIn',
      'nurse.dashboard.status.unavailable',
      'nurse.dashboard.patientFallback',
      'nurse.dashboard.conditionUnavailable',
      'nurse.dashboard.demo.monitorTitle',
      'nurse.dashboard.demo.monitorDescription',
      'nurse.dashboard.demo.monitorStatus',
      'nurse.dashboard.demo.alertTitle',
      'nurse.dashboard.demo.alertDescription',
      'nurse.dashboard.demo.alertStatus',
      'nurse.dashboard.condition.copd',
      'nurse.dashboard.condition.ckd',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('labels mock records as fictional and does not infer a stable clinical state', async () => {
    const screen = render(<NurseDashboardScreen navigation={navigation} />);
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(screen.getByText(t('nurse.dashboard.demoNotice', 'fr'))).toBeTruthy();
    expect(screen.getAllByText(t('nurse.alerts.patient.a', 'fr')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Ahmed Bensalem')).toBeNull();
    expect(screen.queryByText('Marie Dupont')).toBeNull();
    expect(screen.queryByText('Jean Lefebvre')).toBeNull();
    expect(screen.queryByText('Stable')).toBeNull();
  });

  it('filters translated worklist data and presents load errors instead of a false empty state', async () => {
    const screen = render(<NurseDashboardScreen navigation={navigation} />);
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    fireEvent.press(screen.getByLabelText(t('nurse.dashboard.filter.alerts', 'fr')));
    expect(screen.getByText(t('nurse.dashboard.demo.alertTitle', 'fr'))).toBeTruthy();
    expect(screen.queryByText(t('nurse.dashboard.demo.monitorTitle', 'fr'))).toBeNull();

    setNurseDashboardRepository(failedRepository);
    await act(async () => {
      await useNurseDashboardStore.getState().loadDashboard();
    });
    expect(screen.getByText(t('nurse.dashboard.error.load', 'fr'))).toBeTruthy();
    expect(screen.queryByText(t('nurse.dashboard.empty.title', 'fr'))).toBeNull();
  });
});
