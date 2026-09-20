import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useNurseDashboardStore } from '../state/use-nurse-dashboard-store';
import { WorklistFilterBar } from '../widgets/worklist-filter-bar';
import { WorklistItemCard } from '../widgets/worklist-item-card';
import { NurseAssignment, NurseWorklistItem, matchesWorklistFilter } from '../../../../types/dashboard';

export function NurseDashboardScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const {
    isLoading, errorMessage, summary, priorityQueue, recentSubmissions,
    monitoringRules, worklistItems, worklistFilter, loadDashboard,
  } = useNurseDashboardStore((s) => ({
    isLoading: s.isLoading, errorMessage: s.errorMessage, summary: s.summary,
    priorityQueue: s.priorityQueue, recentSubmissions: s.recentSubmissions,
    monitoringRules: s.monitoringRules, worklistItems: s.worklistItems,
    worklistFilter: s.worklistFilter, loadDashboard: s.loadDashboard,
  }));

  useFocusEffect(
    useCallback(() => { loadDashboard(); }, [loadDashboard])
  );

  const counts = {
    all: worklistItems.length,
    alerts: worklistItems.filter((i) => i.type === 'alert').length,
    tasks: worklistItems.filter((i) => i.type === 'task').length,
    monitoring: worklistItems.filter((i) => i.type === 'monitoring').length,
    needsAttention: worklistItems.filter((i) => i.isActionable).length,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de bord</Text>
        <Text style={styles.subtitle}>Vue d'ensemble infirmiere</Text>
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="colors.info" />
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
            <Text style={styles.retryText}>Reessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !errorMessage && summary ? (
        <View style={styles.body}>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
              <Text style={styles.summaryLabel}>Patients assignes</Text>
              <Text style={styles.summaryValue}>{summary.totalPatients}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardAccent]}>
              <Text style={styles.summaryLabel}>Haute priorite</Text>
              <Text style={styles.summaryValue}>{summary.highPriorityCount}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardWarning]}>
              <Text style={styles.summaryLabel}>A revoir</Text>
              <Text style={styles.summaryValue}>{summary.reviewRequiredCount}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardNeutral]}>
              <Text style={styles.summaryLabel}>Nouvelles mesures</Text>
              <Text style={styles.summaryValue}>{summary.newSubmissionsCount}</Text>
            </View>
          </View>

          <View style={styles.attentionSection}>
            <Text style={styles.sectionTitle}>Attention</Text>
            <WorklistFilterBar selected={worklistFilter} counts={counts} onSelected={(f) => useNurseDashboardStore.getState().setWorklistFilter(f)} />
            <WorklistList items={worklistItems.filter((i) => i.type === 'alert')} navigation={navigation} />
          </View>

          <View style={styles.attentionSection}>
            <Text style={styles.sectionTitle}>Suivis</Text>
            <WorklistList items={worklistItems.filter((i) => i.type === 'monitoring')} navigation={navigation} />
          </View>

          <View style={styles.attentionSection}>
            <Text style={styles.sectionTitle}>Taches</Text>
            <WorklistList items={worklistItems.filter((i) => i.type === 'task')} navigation={navigation} />
          </View>

          <View style={styles.attentionSection}>
            <Text style={styles.sectionTitle}>File de travail</Text>
            <WorklistFilterBar selected={worklistFilter} counts={counts} onSelected={(f) => useNurseDashboardStore.getState().setWorklistFilter(f)} />
            <WorklistList items={worklistItems.filter((i) => matchesWorklistFilter(i, worklistFilter))} navigation={navigation} />
          </View>

          <View style={styles.attentionSection}>
            <Text style={styles.sectionTitle}>Regles de surveillance</Text>
            {monitoringRules.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <Text style={styles.ruleTitle}>{rule.title}</Text>
                <Text style={styles.ruleDescription}>{rule.description}</Text>
                <Text style={styles.ruleMeta}>
                  {rule.condition.field} {rule.condition.operator} {rule.condition.value}
                </Text>
                <Text style={styles.ruleAction}>{rule.action.label} · {rule.action.priority}</Text>
              </View>
            ))}
          </View>

          <View style={styles.attentionSection}>
            <Text style={styles.sectionTitle}>Patients assignes</Text>
            {priorityQueue.length === 0 ? (
              <Text style={styles.emptyText}>Aucun patient assigne.</Text>
            ) : (
              priorityQueue.map((a) => (
                <TouchableOpacity key={a.patientId} style={styles.patientCard} onPress={() => navigation.navigate('patientDetail', { patientId: a.patientId })}>
                  <View style={styles.patientRow}>
                    <Text style={styles.patientName}>{a.patientName}</Text>
                    {a.pendingTaskCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{a.pendingTaskCount}</Text></View> : null}
                  </View>
                  <Text style={styles.patientMeta}>{a.condition} · {a.classification}</Text>
                  <Text style={styles.patientMeta}>Priorite: {a.priority}{a.hasNewSubmission ? ' · Nouvelle mesure' : ''}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Worklist')}>
              <Text style={styles.actionText}>Worklist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('NursePatients')}>
              <Text style={styles.actionText}>Patients</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function WorklistList({ items, navigation }: { items: NurseWorklistItem[]; navigation: any }) {
  if (items.length === 0) return <Text style={styles.emptyText}>Aucun element</Text>;
  return (
    <View>
      {items.map((item) => (
        <WorklistItemCard key={item.id} item={item} onPress={(it) => {
          if (it.actionRoute) {
            const route = it.actionRoute.replace('/nurse/', '').split('/')[0];
            navigation.navigate(route, { patientId: it.patientId });
          }
        }} />
      ))}
    </View>
  );
}

function createStyles(colors: any) {
  return {
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48 },
  header: { marginBottom: 24 },
  title: { fontFamily: 'Urbanist', fontSize: 32, fontWeight: '700', color: colors.foreground },
  subtitle: { fontFamily: 'Urbanist', fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  stateContainer: { padding: 24, alignItems: 'center' },
  errorText: { fontFamily: 'Urbanist', fontSize: 16, color: colors.destructive, marginBottom: 8 },
  retryButton: { marginTop: 16, padding: 12, backgroundColor: colors.card, borderRadius: 8 },
  retryText: { fontFamily: 'Urbanist', fontSize: 14, color: colors.destructive, textAlign: 'center' },
  body: { gap: 24 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { width: '48%', backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  summaryCardPrimary: { borderWidth: 1, borderColor: colors.info },
  summaryCardAccent: { borderWidth: 1, borderColor: colors.warning },
  summaryCardWarning: { borderWidth: 1, borderColor: colors.destructive },
  summaryCardNeutral: { borderWidth: 1, borderColor: colors.mutedForeground },
  summaryLabel: { fontFamily: 'Urbanist', fontSize: 12, color: colors.mutedForeground },
  summaryValue: { fontFamily: 'Urbanist', fontSize: 24, fontWeight: '600', color: colors.foreground, marginTop: 4 },
  attentionSection: { marginTop: 8 },
  sectionTitle: { fontFamily: 'Urbanist', fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 12 },
  ruleCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  ruleTitle: { fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  ruleDescription: { fontFamily: 'Urbanist', fontSize: 13, color: colors.mutedForeground, marginBottom: 6 },
  ruleMeta: { fontFamily: 'Urbanist', fontSize: 12, color: colors.mutedForeground, marginBottom: 2 },
  ruleAction: { fontFamily: 'Urbanist', fontSize: 12, color: colors.mutedForeground },
  patientCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12 },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  patientName: { fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600', color: colors.foreground },
  badge: { backgroundColor: colors.destructive + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontFamily: 'Urbanist', fontSize: 12, color: colors.destructive, fontWeight: '600' },
  patientMeta: { fontFamily: 'Urbanist', fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  emptyText: { fontFamily: 'Urbanist', fontSize: 13, color: colors.mutedForeground, paddingVertical: 8 },
  footerActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  actionButton: { flex: 1, backgroundColor: colors.info, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  actionText: { fontFamily: 'Urbanist', fontSize: 14, fontWeight: '600', color: colors.primaryForeground },
}
}
