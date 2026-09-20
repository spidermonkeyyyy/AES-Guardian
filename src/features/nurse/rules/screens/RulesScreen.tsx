import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRuleStore } from '../state/use-rule-store';
import { useTheme } from '../../../../theme/ThemeContext';

export function RulesScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const loadRules = useRuleStore((state) => state.loadRules);
  const setShowEnabledOnly = useRuleStore((state) => state.setShowEnabledOnly);
  const ruleById = useRuleStore((state) => state.ruleById);
  const setRuleEnabled = useRuleStore((state) => state.setRuleEnabled);
  const isLoading = useRuleStore((state) => state.isLoading);
  const errorMessage = useRuleStore((state) => state.errorMessage);
  const showEnabledOnly = useRuleStore((state) => state.showEnabledOnly);
  const filteredRules = useRuleStore((state) => state.filteredRules);
  const enabledCount = useRuleStore((state) => state.enabledCount);
  const rules = useRuleStore((state) => state.rules);

  React.useEffect(() => {
    loadRules();
  }, [loadRules]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: 48 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Règles de surveillance</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
            {enabledCount} règle{enabledCount !== 1 ? 's' : ''} active{enabledCount !== 1 ? 's' : ''} sur {rules.length}.
          </Text>
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: colors.primary }]}
            onPress={() => setShowEnabledOnly(!showEnabledOnly)}
          >
            <Text style={[styles.filterText, { color: colors.primary }]}>{showEnabledOnly ? 'Toutes' : 'Actives'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.stateContainer}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text>
          <TouchableOpacity style={[styles.retryButton, { borderColor: colors.destructive }]} onPress={loadRules}>
            <Text style={[styles.retryText, { color: colors.destructive }]}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !errorMessage && (
        <View style={[styles.content, { paddingHorizontal: 24, paddingBottom: 80 }]}>
          {filteredRules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune règle</Text>
              <Text style={[styles.emptyMessage, { color: colors.mutedForeground }]}>
                Créez une règle pour déclencher des alertes de surveillance.
              </Text>
            </View>
          ) : (
            filteredRules.map((rule) => (
              <TouchableOpacity
                key={rule.id}
                style={[styles.ruleCard, { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 }]}
                onPress={() => navigation.navigate('ruleDetail', { ruleId: rule.id })}
              >
                <View style={styles.ruleCardHeader}>
                  <Text style={[styles.ruleName, { color: colors.foreground }]}>{rule.name}</Text>
                  <View style={[styles.statusBadge, rule.enabled ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, rule.enabled ? styles.statusTextActive : styles.statusTextInactive]}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.ruleDescription, { color: colors.mutedForeground, marginBottom: 8 }]} numberOfLines={2}>
                  {rule.description}
                </Text>
                <View style={styles.ruleMetaRow}>
                  <Text style={[styles.rulePriority, { color: colors.foreground }]}>
                    Priorité: {rule.priority === 'high' ? 'Élevée' : rule.priority === 'medium' ? 'À revoir' : rule.priority === 'low' ? 'Faible' : 'Information'}
                  </Text>
                  <Text style={[styles.ruleAction, { color: colors.foreground }]}>
                    Action: {rule.action === 'create_alert' ? 'Créer une alerte' : 'Signaler pour revue'}
                  </Text>
                </View>
                <Text style={[styles.ruleConditions, { color: colors.mutedForeground }]}>
                  {rule.conditionGroup.conditions.map((c) => `${c.metricLabel} ${c.operator} ${c.value}${c.unit ? ` ${c.unit}` : ''}`).join(rule.conditionGroup.mode === 'all' ? ' ET ' : ' OU ')}
                </Text>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', marginTop: 16 }]}
            onPress={() => navigation.navigate('ruleBuilder', { ruleId: 'new' })}
          >
            <Text style={[styles.fabText, { color: colors.primaryForeground }]}>+ Nouvelle règle</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors: any) {
  return {
  container: { flex: 1 },
  header: { padding: 24 },
  title: { fontFamily: 'Urbanist', fontSize: 28, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryText: { fontFamily: 'Urbanist', fontSize: 14 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  filterText: { fontFamily: 'Urbanist', fontSize: 14 },
  stateContainer: { padding: 24, alignItems: 'center' },
  errorText: { fontFamily: 'Urbanist', fontSize: 16, marginBottom: 12, textAlign: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1 },
  retryText: { fontFamily: 'Urbanist', fontSize: 14 },
  content: { paddingHorizontal: 24 },
  ruleCard: {},
  ruleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ruleName: { fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  statusInactive: { backgroundColor: 'rgba(107, 114, 128, 0.2)' },
  statusText: { fontFamily: 'Urbanist', fontSize: 12, fontWeight: '500' },
  statusTextActive: { color: colors.success },
  statusTextInactive: { color: colors.mutedForeground },
  ruleDescription: { fontFamily: 'Urbanist', fontSize: 14, marginBottom: 8 },
  ruleMetaRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  rulePriority: { fontFamily: 'Urbanist', fontSize: 12 },
  ruleAction: { fontFamily: 'Urbanist', fontSize: 12 },
  ruleConditions: { fontFamily: 'Urbanist', fontSize: 12 },
  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontFamily: 'Urbanist', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyMessage: { fontFamily: 'Urbanist', fontSize: 14, textAlign: 'center' },
  fab: {},
  fabText: { fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600' },
}

}
