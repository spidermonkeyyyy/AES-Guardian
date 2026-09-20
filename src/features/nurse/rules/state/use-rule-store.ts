import { create } from 'zustand';
import { RuleRepository } from '../../../../services/repositories/rule';
import { MockRuleRepository } from '../../../../services/repositories/rule-repository.mock';
import {
  MonitoringRule,
  RuleGroup,
  RuleCondition,
  AlertPriority,
  RuleAction,
  ConditionGroupMode,
} from '../../../../types/rule';

let repository: RuleRepository = new MockRuleRepository();

export function setRuleRepository(repo: RuleRepository): void {
  repository = repo;
}

export function getRuleRepository(): RuleRepository {
  return repository;
}

export interface RuleListState {
  isLoading: boolean;
  errorMessage: string | null;
  rules: MonitoringRule[];
  showEnabledOnly: boolean;
  pendingRuleId: string | null;
}

export interface RuleListActions {
  loadRules: () => Promise<void>;
  setShowEnabledOnly: (value: boolean) => void;
  ruleById: (ruleId: string) => MonitoringRule | undefined;
  setRuleEnabled: (ruleId: string, enabled: boolean) => Promise<boolean>;
  createRule: (rule: MonitoringRule) => Promise<MonitoringRule | null>;
  updateRule: (rule: MonitoringRule) => Promise<MonitoringRule | null>;
  clearError: () => void;
}

export interface RuleDraftState {
  id: string | null;
  name: string;
  description: string;
  enabled: boolean;
  conditionGroup: RuleGroup;
  action: RuleAction;
  priority: AlertPriority;
  availableMetrics: { key: string; label: string; unit: string; supportedOperators: string[]; valueHint: string }[];
  isLoadingMetrics: boolean;
}

export interface RuleDraftActions {
  startDraft: (source?: MonitoringRule | undefined) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setDraftEnabled: (value: boolean) => void;
  setDraftAction: (value: RuleAction) => void;
  setDraftPriority: (value: AlertPriority) => void;
  setGroupMode: (mode: ConditionGroupMode) => void;
  addCondition: () => void;
  removeCondition: (conditionId: string) => void;
  changeConditionMetric: (conditionId: string, metricKey: string) => void;
  changeConditionOperator: (conditionId: string, operator: string) => void;
  changeConditionValue: (conditionId: string, value: string) => void;
  changeConditionComparisonMode: (conditionId: string, mode: 'absolute' | 'baseline' | 'trend') => void;
  loadMetrics: () => Promise<void>;
}

export interface RuleStore extends RuleListState, RuleListActions, RuleDraftState, RuleDraftActions {
  get filteredRules(): MonitoringRule[];
  get enabledCount(): number;
  get canSave(): boolean;
  get validationMessage(): string | null;
  toRule: () => MonitoringRule;
}

function createDefaultRuleGroup(): RuleGroup {
  return {
    id: `group_${Date.now()}`,
    mode: 'all',
    conditions: [],
  };
}

function createDefaultCondition(metricKey?: string, metricLabel?: string): RuleCondition {
  return {
    id: `cond_${Date.now()}`,
    metric: metricKey ?? '',
    metricLabel: metricLabel ?? '',
    operator: 'equals',
    value: '',
    unit: '',
    comparisonMode: 'absolute',
  };
}

function findCondition(conditions: RuleCondition[], conditionId: string): RuleCondition | undefined {
  return conditions.find((c) => c.id === conditionId);
}

function isRuleConditionComplete(condition: RuleCondition): boolean {
  if (condition.metric.trim().length === 0) return false;
  if (condition.operator === 'changed') return true;
  return condition.value.trim().length > 0;
}

function isRuleGroupValid(group: RuleGroup): boolean {
  return group.conditions.length > 0 && group.conditions.every(isRuleConditionComplete);
}

function getRuleValidationMessage(name: string, group: RuleGroup): string | null {
  if (name.trim().length === 0) return 'Donnez un nom à la règle.';
  if (group.conditions.length === 0) return 'Ajoutez au moins une condition.';
  if (!isRuleGroupValid(group)) return 'Complétez toutes les conditions.';
  return null;
}

function sortRules(rules: MonitoringRule[]): MonitoringRule[] {
  return [...rules].sort((a, z) => {
    if (a.enabled !== z.enabled) return a.enabled ? -1 : 1;
    const aWeight = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : a.priority === 'low' ? 2 : 3;
    const zWeight = z.priority === 'high' ? 0 : z.priority === 'medium' ? 1 : z.priority === 'low' ? 2 : 3;
    if (aWeight !== zWeight) return aWeight - zWeight;
    return a.name.localeCompare(z.name);
  });
}

export const useRuleStore = create<RuleStore>((set, get) => ({
  // List state
  isLoading: false,
  errorMessage: null,
  rules: [],
  showEnabledOnly: false,
  pendingRuleId: null,

  // Draft state
  id: null,
  name: '',
  description: '',
  enabled: true,
  conditionGroup: createDefaultRuleGroup(),
  action: 'create_alert',
  priority: 'medium',
  availableMetrics: [],
  isLoadingMetrics: false,

  loadRules: async () => {
    set({ isLoading: true, errorMessage: null });
    try {
      const rules = await repository.getRules();
      set({ rules, isLoading: false, errorMessage: null });
    } catch {
      set({ isLoading: false, errorMessage: 'Impossible de charger les règles de surveillance.' });
    }
  },

  setShowEnabledOnly: (value) => set({ showEnabledOnly: value }),

  ruleById: (ruleId) => get().rules.find((r) => r.id === ruleId),

  setRuleEnabled: async (ruleId, enabled) => {
    set({ pendingRuleId: ruleId, errorMessage: null });
    try {
      const updated = await repository.setRuleEnabled(ruleId, enabled);
      set({
        rules: get().rules.map((r) => (r.id === updated.id ? updated : r)),
        pendingRuleId: null,
        errorMessage: null,
      });
      return true;
    } catch {
      set({ pendingRuleId: null, errorMessage: "Impossible de modifier l'état de la règle." });
      return false;
    }
  },

  createRule: async (rule) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const created = await repository.createRule(rule);
      set({ rules: [...get().rules, created], isLoading: false, errorMessage: null });
      return created;
    } catch (error) {
      set({ isLoading: false, errorMessage: error instanceof Error ? error.message : "Impossible d'enregistrer la règle." });
      return null;
    }
  },

  updateRule: async (rule) => {
    set({ pendingRuleId: rule.id, errorMessage: null });
    try {
      const updated = await repository.updateRule(rule);
      set({
        rules: get().rules.map((r) => (r.id === updated.id ? updated : r)),
        pendingRuleId: null,
        errorMessage: null,
      });
      return updated;
    } catch (error) {
      set({ pendingRuleId: null, errorMessage: error instanceof Error ? error.message : "Impossible d'enregistrer la règle." });
      return null;
    }
  },

  clearError: () => {
    if (get().errorMessage !== null) {
      set({ errorMessage: null });
    }
  },

  startDraft: (source) => {
    if (!source) {
      set({
        id: null,
        name: '',
        description: '',
        enabled: true,
        conditionGroup: createDefaultRuleGroup(),
        action: 'create_alert',
        priority: 'medium',
        availableMetrics: get().availableMetrics,
        isLoadingMetrics: false,
      });
      return;
    }
    set({
      id: source.id,
      name: source.name,
      description: source.description,
      enabled: source.enabled,
      conditionGroup: source.conditionGroup,
      action: source.action,
      priority: source.priority,
      availableMetrics: get().availableMetrics,
      isLoadingMetrics: false,
    });
  },

  setName: (value) => set({ name: value }),

  setDescription: (value) => set({ description: value }),

  setDraftEnabled: (value) => set({ enabled: value }),

  setDraftAction: (value) => set({ action: value }),

  setDraftPriority: (value) => set({ priority: value }),

  setGroupMode: (mode) =>
    set({
      conditionGroup: { ...get().conditionGroup, mode },
    }),

  addCondition: () => {
    const metrics = get().availableMetrics;
    if (metrics.length === 0) return;
    const metric = metrics[0];
    const operator = metric.supportedOperators[0];
    const condition: RuleCondition = {
      id: `cond_${Date.now()}`,
      metric: metric.key,
      metricLabel: metric.label,
      operator,
      value: '',
      unit: metric.unit,
      comparisonMode: operator === 'less_than_baseline' || operator === 'greater_than_baseline' || operator === 'changed' ? 'baseline' : 'absolute',
    };
    set({
      conditionGroup: {
        ...get().conditionGroup,
        conditions: [...get().conditionGroup.conditions, condition],
      },
    });
  },

  removeCondition: (conditionId) =>
    set({
      conditionGroup: {
        ...get().conditionGroup,
        conditions: get().conditionGroup.conditions.filter((c) => c.id !== conditionId),
      },
    }),

  changeConditionMetric: (conditionId, metricKey) => {
    const metrics = get().availableMetrics;
    const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0];
    const current = findCondition(get().conditionGroup.conditions, conditionId);
    if (!current) return;
    const operator = metric.supportedOperators.includes(current.operator) ? current.operator : metric.supportedOperators[0];
    const updated: RuleCondition = {
      ...current,
      metric: metric.key,
      metricLabel: metric.label,
      unit: metric.unit,
      operator,
      value: operator === 'changed' ? '' : current.value,
      comparisonMode: operator === 'less_than_baseline' || operator === 'greater_than_baseline' || operator === 'changed' ? 'baseline' : current.comparisonMode,
    };
    set({
      conditionGroup: {
        ...get().conditionGroup,
        conditions: get().conditionGroup.conditions.map((c) => (c.id === conditionId ? updated : c)),
      },
    });
  },

  changeConditionOperator: (conditionId, operator) => {
    const current = findCondition(get().conditionGroup.conditions, conditionId);
    if (!current) return;
    const updated: RuleCondition = {
      ...current,
      operator,
      value: operator === 'changed' ? '' : current.value,
      comparisonMode: operator === 'less_than_baseline' || operator === 'greater_than_baseline' || operator === 'changed' ? 'baseline' : current.comparisonMode,
    };
    set({
      conditionGroup: {
        ...get().conditionGroup,
        conditions: get().conditionGroup.conditions.map((c) => (c.id === conditionId ? updated : c)),
      },
    });
  },

  changeConditionValue: (conditionId, value) =>
    set({
      conditionGroup: {
        ...get().conditionGroup,
        conditions: get().conditionGroup.conditions.map((c) => (c.id === conditionId ? { ...c, value } : c)),
      },
    }),

  changeConditionComparisonMode: (conditionId, mode) =>
    set({
      conditionGroup: {
        ...get().conditionGroup,
        conditions: get().conditionGroup.conditions.map((c) => (c.id === conditionId ? { ...c, comparisonMode: mode } : c)),
      },
    }),

  loadMetrics: async () => {
    set({ isLoadingMetrics: true });
    try {
      const metrics = await repository.getAvailableMetrics();
      set({ availableMetrics: metrics, isLoadingMetrics: false });
    } catch {
      set({ availableMetrics: [], isLoadingMetrics: false });
    }
  },

  get filteredRules() {
    const rules = get().rules;
    const showEnabledOnly = get().showEnabledOnly;
    const result = showEnabledOnly ? rules.filter((r) => r.enabled) : [...rules];
    return sortRules(result);
  },

  get enabledCount() {
    return get().rules.filter((r) => r.enabled).length;
  },

  get canSave() {
    const name = get().name.trim();
    const group = get().conditionGroup;
    return name.length > 0 && isRuleGroupValid(group);
  },

  get validationMessage() {
    return getRuleValidationMessage(get().name, get().conditionGroup);
  },

  toRule: () => {
    const state = get();
    return {
      id: state.id ?? `rule_${Date.now()}`,
      name: state.name.trim(),
      description: state.description.trim(),
      enabled: state.enabled,
      conditionGroup: state.conditionGroup,
      action: state.action,
      priority: state.priority,
      createdAt: state.id ? '2026-01-01T00:00:00.000Z' : new Date().toISOString(),
      updatedAt: state.id ? new Date().toISOString() : undefined,
    } as MonitoringRule;
  },
}));
