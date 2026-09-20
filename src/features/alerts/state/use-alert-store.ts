import { create } from 'zustand';
import {
  Alert,
  AlertFilter,
  AlertPriority,
  AlertStatus,
  NurseAction,
  NurseDecision,
} from '../../../types/alert';
import { AlertRepository } from '@/services/repositories/alert';
import {
  matchesFilter,
  sortAlerts,
  groupAlertsByPatient,
  isAlertStatusOpen,
} from '../../../types/alert';

export interface AlertState {
  alerts: Alert[];
  isLoading: boolean;
  errorMessage: string | null;
  filter: AlertFilter;
  pendingAlertId: string | null;
  repository: AlertRepository;
  loadAlerts: () => Promise<void>;
  setFilter: (filter: AlertFilter) => void;
  alertById: (alertId: string) => Alert | undefined;
  alertsForPatient: (patientId: string) => Alert[];
  acknowledge: (alertId: string, nurseId: string) => Promise<boolean>;
  recordAction: (
    alertId: string,
    action: NurseAction,
    decision: NurseDecision,
    actionNote?: string,
    justification?: string,
  ) => Promise<boolean>;
  resolve: (alertId: string, resolutionNote?: string) => Promise<boolean>;
  clearError: () => void;
  filteredAlerts: () => Alert[];
  filteredGroups: () => {
    patientId: string;
    patientName: string;
    patientSummary: string;
    alerts: Alert[];
  }[];
  unreadCount: () => number;
  openCount: () => number;
  highPriorityOpenCount: () => number;
  isEmpty: () => boolean;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  isLoading: false,
  errorMessage: null,
  filter: 'all',
  pendingAlertId: null,
  repository: {} as AlertRepository,
  loadAlerts: async () => {
    set({ isLoading: true, errorMessage: null, pendingAlertId: null });
    try {
      const alerts = await get().repository.getAlerts();
      set({ alerts, isLoading: false, errorMessage: null });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to load alerts',
      });
    }
  },
  setFilter: (filter: AlertFilter) => {
    set({ filter });
  },
  alertById: (alertId: string) => {
    return get().alerts.find((a) => a.id === alertId);
  },
  alertsForPatient: (patientId: string) => {
    const state = get();
    return state.filteredAlerts().filter((a) => a.patientId === patientId);
  },
  acknowledge: async (alertId: string, nurseId: string) => {
    const state = get();
    const alert = state.alerts.find((a) => a.id === alertId);
    if (!alert || alert.status !== AlertStatus.unread) {
      set({
        errorMessage: 'Only unread alerts can be acknowledged',
        pendingAlertId: null,
      });
      return false;
    }
    set({ pendingAlertId: alertId, errorMessage: null });
    try {
      const updated = await state.repository.acknowledgeAlert(alertId, nurseId);
      set({
        alerts: state.alerts.map((a) => (a.id === alertId ? updated : a)),
        pendingAlertId: null,
      });
      return true;
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : 'Acknowledge failed',
        pendingAlertId: null,
      });
      return false;
    }
  },
  recordAction: async (
    alertId: string,
    action: NurseAction,
    decision: NurseDecision,
    actionNote?: string,
    justification?: string,
  ) => {
    const state = get();
    const alert = state.alerts.find((a) => a.id === alertId);
    if (!alert) {
      set({
        errorMessage: 'Alert not found',
        pendingAlertId: null,
      });
      return false;
    }
    if (action === 'other' && decision === 'notConcerning' && !justification) {
      set({
        errorMessage: 'Justification is required for notConcerning decisions',
        pendingAlertId: null,
      });
      return false;
    }
    if (action !== 'other' && !actionNote) {
      set({
        errorMessage: 'Action note is required',
        pendingAlertId: null,
      });
      return false;
    }
    set({ pendingAlertId: alertId, errorMessage: null });
    try {
      const updated = await state.repository.recordAction(
        alertId,
        action,
        decision,
        actionNote,
        justification,
      );
      set({
        alerts: state.alerts.map((a) => (a.id === alertId ? updated : a)),
        pendingAlertId: null,
      });
      return true;
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : 'Action failed',
        pendingAlertId: null,
      });
      return false;
    }
  },
  resolve: async (alertId: string, resolutionNote?: string) => {
    const state = get();
    const alert = state.alerts.find((a) => a.id === alertId);
    if (!alert) {
      set({
        errorMessage: 'Alert not found',
        pendingAlertId: null,
      });
      return false;
    }
    if (alert.status !== AlertStatus.inProgress) {
      set({
        errorMessage: 'Only alerts in progress can be resolved',
        pendingAlertId: null,
      });
      return false;
    }
    set({ pendingAlertId: alertId, errorMessage: null });
    try {
      const updated = await state.repository.resolveAlert(alertId, resolutionNote);
      set({
        alerts: state.alerts.map((a) => (a.id === alertId ? updated : a)),
        pendingAlertId: null,
      });
      return true;
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : 'Resolution failed',
        pendingAlertId: null,
      });
      return false;
    }
  },
  clearError: () => {
    set({ errorMessage: null });
  },
  filteredAlerts: () => {
    const state = get();
    return sortAlerts(state.alerts.filter((a) => matchesFilter(a, state.filter)));
  },
  filteredGroups: () => {
    return groupAlertsByPatient(get().filteredAlerts());
  },
  unreadCount: () => {
    return get().alerts.filter((a) => a.status === AlertStatus.unread).length;
  },
  openCount: () => {
    return get().alerts.filter((a) => isAlertStatusOpen(a.status)).length;
  },
  highPriorityOpenCount: () => {
    return get()
      .alerts.filter((a) => isAlertStatusOpen(a.status) && a.priority === AlertPriority.high)
      .length;
  },
  isEmpty: () => {
    const state = get();
    return !state.isLoading && state.errorMessage === null && state.filteredAlerts().length === 0;
  },
}));
