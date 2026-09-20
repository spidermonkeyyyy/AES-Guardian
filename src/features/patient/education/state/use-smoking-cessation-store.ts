import { create } from 'zustand';
import {
  SmokingEntry,
  CravingIntensity,
  SmokingTrigger,
  EducationalContent,
} from '../../../../types/education';
import { MockEducationRepository } from '../repositories/education-repository.mock';

export interface SmokingCessationState {
  isLoading: boolean;
  errorMessage: string | null;
  entries: SmokingEntry[];
  trackedDays: number;
  currentGoal: string;
  educationalContent: EducationalContent[];
}

export interface SmokingCessationActions {
  loadData: () => Promise<void>;
  addEntry: (entry: Omit<SmokingEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type SmokingCessationStore = SmokingCessationState & SmokingCessationActions;

// Derived getters (mirrors Flutter SmokingCessationState getters)
export const selectTodaysEntry = (state: SmokingCessationState): SmokingEntry | undefined => {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return state.entries.find(e => {
    const d = new Date(e.date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() === todayDate;
  });
};

export const selectWeeklyCigarettes = (state: SmokingCessationState): number => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return state.entries
    .filter(e => new Date(e.date) > weekAgo)
    .reduce((sum, e) => sum + e.cigarettesConsumed, 0);
};

export const selectAverageDaily = (state: SmokingCessationState): number => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recent = state.entries.filter(e => new Date(e.date) > weekAgo);
  if (recent.length === 0) return 0;
  const total = recent.reduce((sum, e) => sum + e.cigarettesConsumed, 0);
  return total / recent.length;
};

export const selectTrackingCompletion = (state: SmokingCessationState): number => {
  if (state.trackedDays === 0) return 0;
  const uniqueDates = new Set(
    state.entries.map(e => {
      const d = new Date(e.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  return uniqueDates.size / state.trackedDays;
};

export const useSmokingCessationStore = create<SmokingCessationStore>((set, get) => ({
  isLoading: true,
  errorMessage: null,
  entries: [],
  trackedDays: 0,
  currentGoal: 'Arrêt progressif',
  educationalContent: [],

  loadData: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockEducationRepository();
      const [entries, trackedDays, goal, content] = await Promise.all([
        repo.getSmokingEntries(),
        repo.getTrackedDaysCount(),
        repo.getCurrentGoal(),
        repo.getEducationalContent('sevrage'),
      ]);
      set({ isLoading: false, entries, trackedDays, currentGoal: goal, educationalContent: content });
    } catch (e) {
      set({ isLoading: false, errorMessage: 'Impossible de charger vos données de sevrage.' });
    }
  },

  addEntry: async (entry) => {
    const entryWithId: SmokingEntry = {
      ...entry,
      id: `smk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    try {
      const repo = new MockEducationRepository();
      const saved = await repo.addSmokingEntry(entryWithId);
      const updatedEntries = [saved, ...get().entries];
      const trackedDays = await repo.getTrackedDaysCount();
      set({ entries: updatedEntries, trackedDays });
    } catch (e) {
      set({ errorMessage: "Impossible d'enregistrer votre entrée." });
    }
  },

  deleteEntry: async (entryId) => {
    try {
      const repo = new MockEducationRepository();
      await repo.deleteSmokingEntry(entryId);
      const updatedEntries = get().entries.filter(e => e.id !== entryId);
      const trackedDays = await repo.getTrackedDaysCount();
      set({ entries: updatedEntries, trackedDays });
    } catch (e) {
      set({ errorMessage: 'Impossible de supprimer cette entrée.' });
    }
  },

  clearError: () => set({ errorMessage: null }),

  reset: () => set({
    isLoading: true,
    errorMessage: null,
    entries: [],
    trackedDays: 0,
    currentGoal: 'Arrêt progressif',
    educationalContent: [],
  }),
}));

/** Formatted date label matching Flutter source:
 *   "Aujourd'hui" / "Hier" / weekday / "dd/MM"
 */
export function formatSmokingDate(dateStr: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(dateStr);
  const entryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (entryDate.getTime() === today.getTime()) return "Aujourd'hui";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (entryDate.getTime() === yesterday.getTime()) return 'Hier';
  const diff = Math.floor((today.getTime() - entryDate.getTime()) / (24 * 60 * 60 * 1000));
  if (diff < 7) {
    const weekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    return weekdays[entryDate.getDay() - 1];
  }
  const dd = String(entryDate.getDate()).padStart(2, '0');
  const mm = String(entryDate.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/** CravingIntensity label mapping (French source) */
export const CRAVING_LABELS: Record<CravingIntensity, string> = {
  low: 'Faible',
  moderate: 'Modérée',
  high: 'Forte',
};

/** SmokingTrigger label mapping (French source) */
export const TRIGGER_LABELS: Record<SmokingTrigger, string> = {
  stress: 'Stress',
  habit: 'Habitude',
  social: 'Social',
  emotion: 'Émotion',
  other: 'Autre',
};
