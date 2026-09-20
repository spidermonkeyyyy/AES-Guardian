import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRuleStore } from '../state/use-rule-store';
import { useTheme } from '../../../../theme/ThemeContext';
import { MonitoringRule, RuleCondition, ConditionGroupMode, AlertPriority } from '../../../../types/rule';

interface RuleBuilderScreenProps {
  // Navigation params injected by React Navigation
}

const AVAILABLE_METRICS = [
  { id: 'spo2', label: 'SpO₂ (%)' },
  { id: 'mmrc', label: 'mMRC' },
  { id: 'cough', label: 'Toux' },
  { id: 'sputum', label: 'Expectorations' },
  { id: 'dyspnea', label: 'Dyspnée' },
  { id: 'treatment_adherence', label: 'Observance traitement (%)' },
] as const;

const OPERATORS = ['<', '<=', '==', '>=', '>'] as const;

export default function RuleBuilderScreen(_props: RuleBuilderScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();
  const existingRuleId = (route.params as any)?.ruleId as string | undefined;
  const ruleById = useRuleStore((s) => s.ruleById);
  const startDraft = useRuleStore((s) => s.startDraft);
  const setName = useRuleStore((s) => s.setName);
  const setDescription = useRuleStore((s) => s.setDescription);
  const setDraftEnabled = useRuleStore((s) => s.setDraftEnabled);
  const setDraftAction = useRuleStore((s) => s.setDraftAction);
  const setDraftPriority = useRuleStore((s) => s.setDraftPriority);
  const setGroupMode = useRuleStore((s) => s.setGroupMode);
  const addCondition = useRuleStore((s) => s.addCondition);
  const removeCondition = useRuleStore((s) => s.removeCondition);
  const changeConditionMetric = useRuleStore((s) => s.changeConditionMetric);
  const changeConditionOperator = useRuleStore((s) => s.changeConditionOperator);
  const changeConditionValue = useRuleStore((s) => s.changeConditionValue);
  const changeConditionComparisonMode = useRuleStore((s) => s.changeConditionComparisonMode);
  const canSave = useRuleStore((s) => s.canSave);
  const validationMessage = useRuleStore((s) => s.validationMessage);
  const createRule = useRuleStore((s) => s.createRule);
  const updateRule = useRuleStore((s) => s.updateRule);
  const toRule = useRuleStore((s) => s.toRule);

  const existingRule = existingRuleId ? ruleById(existingRuleId) : undefined;

  useFocusEffect(
    useCallback(() => {
      if (existingRule) {
        startDraft(existingRule);
      } else {
        startDraft(undefined);
      }
    }, [existingRule, startDraft]),
  );

  const draft = useRuleStore((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    enabled: s.enabled,
    conditionGroup: s.conditionGroup,
    action: s.action,
    priority: s.priority,
    availableMetrics: s.availableMetrics,
    isLoadingMetrics: s.isLoadingMetrics,
  }));

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    const ruleData = toRule();
    if (existingRuleId) {
      updateRule(ruleData);
    } else {
      createRule(ruleData);
    }
    navigation.goBack();
  };

  const handleCancel = () => {
    startDraft(existingRule);
    navigation.goBack();
  };

  const handleAddCondition = () => {
    addCondition();
  };

  const handleRemoveCondition = (conditionId: string) => {
    removeCondition(conditionId);
  };

  const handleChangeCondition = (
    conditionId: string,
    field: 'metric' | 'operator' | 'value' | 'comparisonMode',
    value: string,
  ) => {
    switch (field) {
      case 'metric':
        changeConditionMetric(conditionId, value);
        break;
      case 'operator':
        changeConditionOperator(conditionId, value);
        break;
      case 'value':
        changeConditionValue(conditionId, value);
        break;
      case 'comparisonMode':
        changeConditionComparisonMode(conditionId, value as any);
        break;
    }
  };

  const handleAddGroup = () => {
    // The current store uses a single conditionGroup; create a new group by resetting
    // and adding a fresh condition. This matches the existing single-group store shape.
    startDraft(undefined);
  };

  const handleChangeGroupMode = (mode: ConditionGroupMode) => {
    setGroupMode(mode);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nom de la règle</Text>
          <TouchableOpacity
            style={styles.textInput}
            onPress={() => {
              // In a real implementation, use a TextInput component
            }}
          >
            <Text style={draft.name ? styles.inputText : styles.inputPlaceholder}>
              {draft.name || 'Entrez le nom de la règle...'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TouchableOpacity
            style={[styles.textInput, styles.textInputMultiline]}
            onPress={() => {
              // In a real implementation, use a TextInput component
            }}
          >
            <Text style={draft.description ? styles.inputText : styles.inputPlaceholder}>
              {draft.description || 'Entrez une description (optionnel)...'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Priorité</Text>
          <View style={styles.chipRow}>
            {(['low', 'medium', 'high'] as AlertPriority[]).map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[styles.chip, draft.priority === priority && styles.chipSelected]}
                onPress={() => setDraftPriority(priority)}
              >
                <Text style={[styles.chipText, draft.priority === priority && styles.chipTextSelected]}>
                  {priority === 'low' ? 'Basse' : priority === 'medium' ? 'Moyenne' : 'Haute'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Condition</Text>
            <TouchableOpacity
              style={styles.addGroupButton}
              onPress={handleAddGroup}
              accessibilityRole="button"
              accessibilityLabel="Ajouter un groupe de conditions"
            >
              <Text style={styles.addGroupButtonText}>+ Groupe</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.groupBlock}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupLabel}>
                  {draft.conditionGroup.conditions.length} condition{draft.conditionGroup.conditions.length > 1 ? 's' : ''}
                </Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, draft.conditionGroup.mode === 'all' && styles.chipSelected]}
                    onPress={() => handleChangeGroupMode('all')}
                  >
                    <Text style={[styles.chipText, draft.conditionGroup.mode === 'all' && styles.chipTextSelected]}>
                      ET
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, draft.conditionGroup.mode === 'any' && styles.chipSelected]}
                    onPress={() => handleChangeGroupMode('any')}
                  >
                    <Text style={[styles.chipText, draft.conditionGroup.mode === 'any' && styles.chipTextSelected]}>
                      OU
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {draft.conditionGroup.conditions.map((condition) => (
                <View key={condition.id} style={styles.conditionCard}>
                  <View style={styles.conditionRow}>
                    <View style={styles.conditionField}>
                      <Text style={styles.conditionFieldLabel}>Champ</Text>
                      <View style={styles.chipRow}>
                        {AVAILABLE_METRICS.map((metric) => (
                          <TouchableOpacity
                            key={metric.id}
                            style={[styles.chip, condition.metric === metric.id && styles.chipSelected]}
                            onPress={() => handleChangeCondition(condition.id, 'metric', metric.id)}
                          >
                            <Text style={[styles.chipText, condition.metric === metric.id && styles.chipTextSelected]}>
                              {metric.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.conditionField}>
                      <Text style={styles.conditionFieldLabel}>Opérateur</Text>
                      <View style={styles.chipRow}>
                        {OPERATORS.map((operator) => (
                          <TouchableOpacity
                            key={operator}
                            style={[styles.chip, condition.operator === operator && styles.chipSelected]}
                            onPress={() => handleChangeCondition(condition.id, 'operator', operator)}
                          >
                            <Text style={[styles.chipText, condition.operator === operator && styles.chipTextSelected]}>
                              {operator}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.conditionField}>
                      <Text style={styles.conditionFieldLabel}>Valeur</Text>
                      <TouchableOpacity
                        style={styles.textInput}
                        onPress={() => {
                          // In a real implementation, use a TextInput or picker component
                        }}
                      >
                        <Text style={condition.value ? styles.inputText : styles.inputPlaceholder}>
                          {condition.value || 'Entrez une valeur...'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.removeConditionButton}
                      onPress={() => handleRemoveCondition(condition.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Supprimer la condition"
                    >
                      <Text style={styles.removeConditionText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addConditionButton}
                onPress={handleAddCondition}
                accessibilityRole="button"
                accessibilityLabel="Ajouter une condition"
              >
                <Text style={styles.addConditionText}>+ Ajouter une condition</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action</Text>
          <View style={styles.card}>
            <View style={styles.actionRow}>
              <Text style={styles.actionLabel}>
                {draft.action === 'create_alert' ? 'Créer une alerte' : 'Signaler pour revue'}
              </Text>
              <View style={[styles.actionPriorityBadge, draft.priority === 'high' ? styles.actionPriorityHigh : styles.actionPriorityMedium]}>
                <Text style={styles.actionPriorityText}>
                  {draft.priority === 'high' ? 'Haute' : draft.priority === 'medium' ? 'Moyenne' : 'Basse'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {validationMessage ? (
          <View style={styles.validationBanner}>
            <Text style={styles.validationText}>{validationMessage}</Text>
          </View>
        ) : null}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.primaryButton, !canSave && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Enregistrer la règle"
          >
            <Text style={styles.primaryButtonText}>Enregistrer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlinedButton}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
          >
            <Text style={styles.outlinedButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: any) {
  return {
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  form: {
    padding: spacing[3],
  },
  field: {
    marginBottom: spacing[3],
  },
  fieldLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  textInput: {
    backgroundColor: colors.card,
    borderRadius: shapes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    minHeight: 48,
    justifyContent: 'center',
  },
  textInputMultiline: {
    minHeight: 80,
  },
  inputText: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  inputPlaceholder: {
    fontSize: typography.fontSize.sm,
    color: colors.mutedForeground,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: shapes.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
  },
  addGroupButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: shapes.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  addGroupButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: shapes.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
  },
  groupBlock: {
    marginBottom: spacing[3],
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  groupLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
  },
  conditionCard: {
    backgroundColor: colors.muted,
    borderRadius: shapes.sm,
    padding: spacing[2],
    marginBottom: spacing[2],
  },
  conditionRow: {
    gap: spacing[2],
  },
  conditionField: {
    marginBottom: spacing[2],
  },
  conditionFieldLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  removeConditionButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: shapes.sm,
    backgroundColor: colors.destructive + '20',
    marginTop: spacing[1],
  },
  removeConditionText: {
    fontSize: typography.fontSize.xs,
    color: colors.destructive,
    fontWeight: typography.fontWeight.medium,
  },
  addConditionButton: {
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  addConditionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
  },
  actionPriorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: shapes.sm,
  },
  actionPriorityHigh: {
    backgroundColor: colors.destructive + '20',
  },
  actionPriorityMedium: {
    backgroundColor: colors.warning + '20',
  },
  actionPriorityText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  validationBanner: {
    backgroundColor: colors.destructive + '20',
    borderRadius: shapes.sm,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.destructive + '40',
  },
  validationText: {
    fontSize: typography.fontSize.sm,
    color: colors.destructive,
  },
  buttonRow: {
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing[3],
    borderRadius: shapes.sm,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  outlinedButton: {
    backgroundColor: colors.card,
    paddingVertical: spacing[3],
    borderRadius: shapes.sm,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlinedButtonText: {
    color: colors.foreground,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}
}
