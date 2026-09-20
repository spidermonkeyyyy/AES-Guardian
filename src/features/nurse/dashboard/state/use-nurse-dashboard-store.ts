import { create } from 'zustand';
import { NurseDashboardRepository } from '../../../../services/repositories/nurse-dashboard';
import { MockNurseDashboardRepository } from '../../../../services/repositories/nurse-dashboard.mock';
import {
  DashboardSummary,
  NurseAssignment,
  NurseWorklistItem,
  NurseWorklistFilter,
  matchesWorklistFilter,
} from '../../../../types/dashboard';

let repository: NurseDashboardRepository = new MockNurseDashboardRepository();

export function setNurseDashboardRepository(repo: NurseDashboardRepository): void {
  repository = repo;
}

export function getNurseDashboardRepository(): NurseDashboardRepository {
  return repository;
}

export interface NurseDashboardState {
  isLoading: boolean;
  errorMessage: string | null;
  summary: DashboardSummary | null;
  priorityQueue: NurseAssignment[];
  recentSubmissions: NurseWorklistItem[];
  monitoringRules: NurseMonitoringRule[];
  worklistItems: NurseWorklistItem[];
  worklistFilter: NurseWorklistFilter;
  loadDashboard: () => Promise<void>;
  setWorklistFilter: (filter: NurseWorklistFilter) => void;
  get filteredWorklistItems(): NurseWorklistItem[];
}

interface NurseMonitoringRule {
  id: string;
  title: string;
  description: string;
  condition: {
    field: string;
    operator: string;
    value: string;
    description: string | null;
  };
  action: {
    type: string;
    label: string;
    priority: string;
  };
}

export const useNurseDashboardStore = create<NurseDashboardState>((set, get) => ({
  isLoading: true,
  errorMessage: null,
  summary: null,
  priorityQueue: [],
  recentSubmissions: [],
  monitoringRules: [],
  worklistItems: [],
  worklistFilter: 'all',

  loadDashboard: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const [summary, priorityQueue, recentSubmissions, monitoringRules] = await Promise.all([
        repository.getDashboardSummary(),
        repository.getPriorityQueue(),
        repository.getRecentSubmissions(),
        repository.getMonitoringRules(),
      ]);
      const worklistItems = [...recentSubmissions];
      set({
        isLoading: false,
        summary,
        priorityQueue,
        recentSubmissions,
        monitoringRules,
        worklistItems,
        errorMessage: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: 'Impossible de charger le tableau de bord infirmier.',
      });
    }
  },

  setWorklistFilter: (filter: NurseWorklistFilter) => {
    set({ worklistFilter: filter });
  },

  get filteredWorklistItems() {
    const state = get();
    return state.worklistItems.filter((item) => matchesWorklistFilter(item, state.worklistFilter));
  },
}));
