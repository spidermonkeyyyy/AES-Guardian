import { create } from 'zustand';
import {
  MonitoringAnswer,
  EvaluationResult,
  MeasurementSource,
} from '../../../types/monitoring';
import { MonitoringQuestion } from '../../../types/monitoring-question';
import { ClinicalMeasurement, MeasurementType } from '../../../types/measurement';
import { evaluateSubmission } from '../../../utils/clinical/rule-engine';
import { MockMonitoringRepository } from '../../../services/repositories/monitoring-repository.mock';

export interface MonitoringState {
  isLoading: boolean;
  questions: MonitoringQuestion[];
  currentStepIndex: number;
  answers: Record<string, MonitoringAnswer>;
  measurementSource: MeasurementSource;
  isSubmitting: boolean;
  evaluationResult: EvaluationResult | null;
  errorMessage: string | null;
  history: ClinicalMeasurement[];
  historyLoading: boolean;
  historyError: string | null;
  selectedRange: '7d' | '30d' | '90d';
  selectedTypes: Set<MeasurementType>;
  selectedPatientId: string | null;
}

export interface MonitoringActions {
  loadQuestions: () => Promise<void>;
  loadHistory: (patientId: string) => Promise<void>;
  refreshHistory: (patientId: string) => Promise<void>;
  selectPatient: (patientId: string) => Promise<void>;
  setRange: (range: '7d' | '30d' | '90d') => Promise<void>;
  toggleType: (type: MeasurementType) => void;
  saveAnswer: (questionId: string, value: MonitoringAnswer) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  submitMonitoring: (resolutionNote?: string) => Promise<boolean>;
  reset: () => void;
}

type MonitoringStore = MonitoringState & MonitoringActions;

function getRangeDates(range: '7d' | '30d' | '90d') {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  const diffMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const diff = diffMap[range];
  const start = new Date(now.getTime() - diff * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { start, end };
}

export const useMonitoringStore = create<MonitoringStore>((set, get) => ({
  isLoading: false,
  questions: [],
  currentStepIndex: 0,
  answers: {},
  measurementSource: 'manual',
  isSubmitting: false,
  evaluationResult: null,
  errorMessage: null,
  history: [],
  historyLoading: false,
  historyError: null,
  selectedRange: '7d',
  selectedTypes: new Set<MeasurementType>([MeasurementType.spo2]),
  selectedPatientId: null,

  loadQuestions: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const repo = new MockMonitoringRepository();
      const questions = await repo.getQuestions();
      set({ questions, isLoading: false });
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Failed to load questions', isLoading: false });
    }
  },

  loadHistory: async (patientId: string) => {
    set({ historyLoading: true, historyError: null });
    try {
      const state = get();
      const { start, end } = getRangeDates(state.selectedRange);
      const repo = new MockMonitoringRepository();
      const measurements = await repo.getHistoricalMeasurements({
        start: new Date(start),
        end: new Date(end),
        types: state.selectedTypes,
        patientId,
      });
      set({ history: measurements, historyLoading: false });
    } catch (error) {
      set({ historyError: error instanceof Error ? error.message : 'Failed to load history', historyLoading: false });
    }
  },

  refreshHistory: async (patientId: string) => {
    get().loadHistory(patientId);
  },

  selectPatient: async (patientId: string) => {
    set({ selectedPatientId: patientId, errorMessage: null });
    get().loadHistory(patientId);
  },

  setRange: async (range: '7d' | '30d' | '90d') => {
    set({ selectedRange: range, historyLoading: true });
    try {
      const state = get();
      const patientId = state.selectedPatientId || 'patient-1';
      const repo = new MockMonitoringRepository();
      const { start, end } = getRangeDates(range);
      const measurements = await repo.getHistoricalMeasurements({
        start: new Date(start),
        end: new Date(end),
        types: state.selectedTypes,
        patientId,
      });
      set({ history: measurements, historyLoading: false });
    } catch (error) {
      set({ historyError: error instanceof Error ? error.message : 'Failed to load history', historyLoading: false });
    }
  },

  toggleType: (type: MeasurementType) => {
    const current = new Set(get().selectedTypes);
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    if (current.size === 0) current.add(MeasurementType.spo2);
    set({ selectedTypes: current, historyLoading: true });

    const state = get();
    const patientId = state.selectedPatientId || 'patient-1';
    const repo = new MockMonitoringRepository();
    const { start, end } = getRangeDates(state.selectedRange);
    repo.getHistoricalMeasurements({
      start: new Date(start),
      end: new Date(end),
      types: current,
      patientId,
    }).then((measurements) => {
      set({ history: measurements, historyLoading: false });
    }).catch((error) => {
      set({ historyError: error instanceof Error ? error.message : 'Failed to load history', historyLoading: false });
    });
  },

  saveAnswer: (questionId: string, value: MonitoringAnswer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: value },
    }));
  },

  nextStep: () => {
    set((state) => ({
      currentStepIndex: Math.min(state.currentStepIndex + 1, state.questions.length - 1),
    }));
  },

  previousStep: () => {
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
    }));
  },

  goToStep: (step: number) => {
    set({ currentStepIndex: step });
  },

  submitMonitoring: async (resolutionNote?: string) => {
    set({ isSubmitting: true, errorMessage: null });
    try {
      const state = get();
      const spo2Answer = state.answers['spo2'];
      const spo2Value = spo2Answer?.value as number | null | undefined;
      
      const evaluation = evaluateSubmission({
        id: `submission-${Date.now()}`,
        patientId: state.selectedPatientId || 'patient-1',
        timestamp: new Date().toISOString(),
        answers: state.answers,
        spo2Value: spo2Value ?? null,
        measurementSource: state.measurementSource,
      });
      set({ evaluationResult: evaluation, isSubmitting: false });
      return evaluation.status === 'normal';
    } catch (error) {
      set({ errorMessage: error instanceof Error ? error.message : 'Erreur', isSubmitting: false });
      return false;
    }
  },

  reset: () => {
    set({
      currentStepIndex: 0,
      answers: {},
      evaluationResult: null,
      isSubmitting: false,
      errorMessage: null,
    });
  },
}));