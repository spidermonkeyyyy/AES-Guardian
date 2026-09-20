import { create } from 'zustand';
import {
  RehabilitationProgram,
  ExerciseSession,
  SmokingEntry,
  EducationalContent,
} from '../../../../types/education';
import { MockEducationRepository } from '../repositories/education-repository.mock';

export interface EducationState {
  program: RehabilitationProgram | null;
  exerciseSessions: ExerciseSession[];
  smokingEntries: SmokingEntry[];
  educationalContent: EducationalContent[];
  isLoading: boolean;
  errorMessage: string | null;
}

export interface EducationActions {
  loadProgram: () => Promise<void>;
  loadExerciseSessions: (limit?: number) => Promise<void>;
  recordExerciseSession: (session: ExerciseSession) => Promise<void>;
  loadSmokingEntries: (limit?: number) => Promise<void>;
  addSmokingEntry: (entry: SmokingEntry) => Promise<void>;
  deleteSmokingEntry: (entryId: string) => Promise<void>;
  loadTrackedDaysCount: () => Promise<void>;
  loadCurrentGoal: () => Promise<void>;
  loadEducationalContent: (category?: string) => Promise<void>;
  loadEducationalContentById: (id: string) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

export const useEducationStore = create<EducationState & EducationActions>((set, get) => ({
  program: null,
  exerciseSessions: [],
  smokingEntries: [],
  educationalContent: [],
  isLoading: false,
  errorMessage: null,

  loadProgram: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockEducationRepository();
      const program = await repo.getRehabilitationProgram();
      set({ program, isLoading: false });
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Failed to load program', isLoading: false });
    }
  },

  loadExerciseSessions: async (limit?: number) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockEducationRepository();
      const sessions = await repo.getExerciseSessions(limit);
      set({ exerciseSessions: sessions, isLoading: false });
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Failed to load sessions', isLoading: false });
    }
  },

  recordExerciseSession: async (session: ExerciseSession) => {
    try {
      const repo = new MockEducationRepository();
      await repo.recordExerciseSession(session);
      // Refresh sessions list
      const repo2 = new MockEducationRepository();
      const sessions = await repo2.getExerciseSessions();
      set({ exerciseSessions: sessions });
    } catch (error) {
      // In a real app, we'd handle this better, but for mock we'll just log
    }
  },

  loadSmokingEntries: async (limit?: number) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockEducationRepository();
      const entries = await repo.getSmokingEntries(limit);
      set({ smokingEntries: entries, isLoading: false });
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Failed to load smoking entries', isLoading: false });
    }
  },

  addSmokingEntry: async (entry: SmokingEntry) => {
    try {
      const repo = new MockEducationRepository();
      await repo.addSmokingEntry(entry);
      const repo2 = new MockEducationRepository();
      const entries = await repo2.getSmokingEntries();
      set({ smokingEntries: entries });
    } catch (error) {
    }
  },

  deleteSmokingEntry: async (entryId: string) => {
    try {
      const repo = new MockEducationRepository();
      await repo.deleteSmokingEntry(entryId);
      const repo2 = new MockEducationRepository();
      const entries = await repo2.getSmokingEntries();
      set({ smokingEntries: entries });
    } catch (error) {
    }
  },

  loadTrackedDaysCount: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockEducationRepository();
      await repo.getTrackedDaysCount();
      // In a real app, we'd store this in state, but for now just verify it works
      set({ isLoading: false });
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Failed to load tracked days count', isLoading: false });
    }
  },

  loadCurrentGoal: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockEducationRepository();
      await repo.getCurrentGoal();
      set({ isLoading: false });
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Failed to load current goal', isLoading: false });
    }
  },

  loadEducationalContent: async (category?: string) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockEducationRepository();
      const content = await repo.getEducationalContent(category);
      set({ educationalContent: content, isLoading: false });
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Failed to load educational content', isLoading: false });
    }
  },

  loadEducationalContentById: async (id: string) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockEducationRepository();
      const content = await repo.getEducationalContentById(id);
      // For now, we're not storing selected content in state, just verifying it works
      set({ isLoading: false });
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Failed to load educational content by ID', isLoading: false });
    }
  },

  reset: () => {
    set({
      program: null,
      exerciseSessions: [],
      smokingEntries: [],
      educationalContent: [],
      isLoading: false,
      errorMessage: null,
    });
  },

  clearError: () => {
    set({ errorMessage: null });
  },
}));