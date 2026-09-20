import React from 'react';
import {
  useSmokingCessationStore,
  selectWeeklyCigarettes,
  selectAverageDaily,
  selectTrackingCompletion,
  formatSmokingDate,
} from '../state/use-smoking-cessation-store';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

const SmokingProgressScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { entries, currentGoal, trackedDays, isLoading, errorMessage, loadData } = useSmokingCessationStore();

  const weekly = selectWeeklyCigarettes({ entries, isLoading: false, errorMessage: null, trackedDays: 0, currentGoal: '', educationalContent: [] });
  const avg = selectAverageDaily({ entries, isLoading: false, errorMessage: null, trackedDays: 0, currentGoal: '', educationalContent: [] });
  const completion = selectTrackingCompletion({ entries, isLoading: false, errorMessage: null, trackedDays: 0, currentGoal: '', educationalContent: [] });

  // Weekly breakdown for last 7 days
  const last7Days: { date: string; cigarettes: number; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString();
    const dayEntries = entries.filter(e => {
      const ed = new Date(e.date);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth() && ed.getDate() === d.getDate();
    });
    const total = dayEntries.reduce((sum, e) => sum + e.cigarettesConsumed, 0);
    last7Days.push({ date: formatSmokingDate(dateStr), cigarettes: total, label: formatSmokingDate(dateStr) });
  }

  if (isLoading && entries.length === 0) {
    return (
      <View style={styles.center}><Text style={styles.loadingText}>Chargement...</Text></View>
    );
  }

  if (errorMessage && entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Impossible de charger votre progression</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}><Text style={styles.retryButtonText}>Réessayer</Text></TouchableOpacity>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Aucune donnée de suivi</Text>
        <Text style={styles.emptyBody}>Ajoutez votre première entrée pour visualiser votre progression.</Text>
        <TouchableOpacity onPress={onBack}><Text style={styles.backLink}>← Retour</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Votre progression</Text>
      <Text style={styles.subHeader}>Objectif : {currentGoal || 'Aucun objectif défini'}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{weekly}</Text>
          <Text style={styles.statLabel}>cigarettes / 7 j</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{avg.toFixed(1)}</Text>
          <Text style={styles.statLabel}>moyenne / jour</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{(completion * 100).toFixed(0)}%</Text>
          <Text style={styles.statLabel}>suivi / jours</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Semaine en cours</Text>
      {last7Days.map((day, i) => (
        <View key={i} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{day.label}</Text>
          <View style={styles.dayProgress}>
            <View style={[styles.dayProgressFill, { width: Math.max(day.cigarettes * 8, 8) }]} />
          </View>
          <Text style={styles.dayCount}>{day.cigarettes} cig.</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Dernières entrées</Text>
      {entries.slice(0, 5).map((entry) => (
        <View key={entry.id} style={styles.historyRow}>
          <View style={styles.historyDate}><Text style={styles.historyDateText}>{formatSmokingDate(entry.date)}</Text></View>
          <View style={styles.historyBody}>
            <Text style={styles.historyCig}>{entry.cigarettesConsumed} cigarette(s)</Text>
            <Text style={styles.historyTrigger}>{entry.trigger}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.backButton} onPress={onBack}><Text style={styles.backButtonText}>← Retour au journal</Text></TouchableOpacity>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return {
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
  loadingText: { fontSize: 14, color: colors.mutedForeground },
  header: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  subHeader: { fontSize: 14, color: colors.mutedForeground, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  backLink: { fontSize: 16, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.mutedForeground, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryForeground, borderRadius: 8, padding: 10, marginBottom: 6 },
  dayLabel: { width: 60, fontSize: 11, color: colors.primary, fontWeight: '600', flexShrink: 0 },
  dayProgress: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, marginHorizontal: 8 },
  dayProgressFill: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  dayCount: { fontSize: 12, color: colors.foreground, fontWeight: '600', width: 50, textAlign: 'right', flexShrink: 0 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.primaryForeground, borderRadius: 8, padding: 10, marginBottom: 6 },
  historyDate: { width: 60 },
  historyDateText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  historyBody: { flex: 1 },
  historyCig: { fontSize: 13, fontWeight: '600', color: colors.primary },
  historyTrigger: { fontSize: 11, color: colors.mutedForeground },
  backButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  backButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
}
}

export default SmokingProgressScreen;