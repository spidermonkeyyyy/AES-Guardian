import { create } from 'zustand';
import {
  TreatmentState,
  TreatmentActions,
  MedicationReminder,
  AdherenceRecord,
} from '../../../../types/treatment';
import { MockTreatmentRepository } from '../repositories/treatment-repository.mock';

// ─── Derived helpers (mirrors Flutter TreatmentState getters) ───────────────────

function calcAnyLoading(s: TreatmentState): boolean {
  return s.isLoadingReminders || s.isLoadingHistory || s.isLoadingAdherence;
}
function calcPendingCount(reminders: MedicationReminder[]): number {
  return reminders.filter(
    (r) => r.status === 'pending' || r.status === 'notConfirmed',
  ).length;
}
function calcConfirmedCount(reminders: MedicationReminder[]): number {
  return reminders.filter((r) => r.status === 'confirmed').length;
}
function calcWeeklyRate(records: AdherenceRecord[]): number {
  if (records.length === 0) return 0.0;
  const total = records.reduce((sum, r) => sum + r.scheduledCount, 0);
  const confirmed = records.reduce((sum, r) => sum + r.confirmedCount, 0);
  return total === 0 ? 1.0 : confirmed / total;
}
function patchReminder(
  reminders: MedicationReminder[],
  id: string,
  updated: MedicationReminder,
): MedicationReminder[] {
  return reminders.map((r) => (r.id === id ? updated : r));
}

// ─── Store ────────────────────────────────────────────────────────────────────

type TreatmentStore = TreatmentState &
  TreatmentActions & {
    weeklyAdherenceRate: number;
    pendingReminderCount: number;
    confirmedTodayCount: number;
    isAnyLoading: boolean;
  };

export const useTreatmentStore = create<TreatmentStore>((set, get) => ({
  // ─── State ───────────────────────────────────────────────────────────────
  isLoadingReminders: true,
  isLoadingHistory: true,
  isLoadingAdherence: true,
  todayReminders: [],
  history: [],
  adherenceRecords: [],
  confirmingId: null,
  errorMessage: null,

  // ─── Derived (computed on access — mirrors Flutter TreatmentState getters) ─
  get weeklyAdherenceRate(): number {
    return calcWeeklyRate(get().adherenceRecords);
  },
  get pendingReminderCount(): number {
    return calcPendingCount(get().todayReminders);
  },
  get confirmedTodayCount(): number {
    return calcConfirmedCount(get().todayReminders);
  },
  get isAnyLoading(): boolean {
    return calcAnyLoading(get());
  },

  // ─── Actions ─────────────────────────────────────────────────────────────

  loadAll: async () => {
    await Promise.all([
      get().loadTodayReminders(),
      get().loadAdherence(),
      get().loadHistory(),
    ]);
  },

  loadTodayReminders: async () => {
    set({ isLoadingReminders: true, errorMessage: null });
    try {
      const repo = new MockTreatmentRepository();
      const reminders = await repo.getTodaysReminders();
      set({ isLoadingReminders: false, todayReminders: reminders });
    } catch (_e) {
      set({
        isLoadingReminders: false,
        errorMessage: 'Impossible de charger le planning de traitement.',
      });
    }
  },

  loadAdherence: async () => {
    set({ isLoadingAdherence: true });
    try {
      const repo = new MockTreatmentRepository();
      const records = await repo.getWeeklyAdherence();
      set({ isLoadingAdherence: false, adherenceRecords: records });
    } catch (_e) {
      set({ isLoadingAdherence: false });
    }
  },

  loadHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const repo = new MockTreatmentRepository();
      const history = await repo.getHistory();
      set({ isLoadingHistory: false, history });
    } catch (_e) {
      set({ isLoadingHistory: false });
    }
  },

  confirmReminder: async (reminderId: string) => {
    set({ confirmingId: reminderId });
    try {
      const repo = new MockTreatmentRepository();
      const updated = await repo.confirmReminder(reminderId);
      set({
        todayReminders: patchReminder(
          get().todayReminders,
          reminderId,
          updated,
        ),
        confirmingId: null,
      });
    } catch (e) {
      set({
        confirmingId: null,
        errorMessage:
          e instanceof Error
            ? e.message
            : 'La confirmation a échoué. Veuillez réessayer.',
      });
    }
  },

  reset: () => {
    set({
      isLoadingReminders: true,
      isLoadingHistory: true,
      isLoadingAdherence: true,
      todayReminders: [],
      history: [],
      adherenceRecords: [],
      confirmingId: null,
      errorMessage: null,
    });
  },
}));