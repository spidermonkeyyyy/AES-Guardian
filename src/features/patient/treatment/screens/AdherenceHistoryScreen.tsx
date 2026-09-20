import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { useTheme } from '../../../theme/ThemeContext';
import { useTreatmentStore } from '../state/use-treatment-store';
import { MedicationReminder, MedicationStatus } from '../../../../types/treatment';

function statusLabel(s: MedicationStatus): string {
  switch (s) {
    case 'upcoming': return 'À venir';
    case 'pending': return 'En attente';
    case 'confirmed': return 'Pris';
    case 'notConfirmed': return 'Non confirmé';
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const AdherenceHistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const {
    adherenceRecords,
    history,
    weeklyAdherenceRate,
    isLoadingAdherence,
    isLoadingHistory,
    loadAdherence,
    loadHistory,
  } = useTreatmentStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadAdherence(), loadHistory()]).then(() => setLoaded(true));
  }, [loadAdherence, loadHistory]);

  if (!loaded || (isLoadingAdherence && isLoadingHistory)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="colors.primary" />
      </View>
    );
  }

  const confirmedTotal = adherenceRecords.reduce((sum, r) => sum + r.confirmedCount, 0);
  const notConfirmedTotal = adherenceRecords.reduce((sum, r) => sum + (r.scheduledCount - r.confirmedCount), 0);
  const adherencePct = Math.round(weeklyAdherenceRate * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Observance</Text>

      {/* Summary card — mirrors Flutter AdherenceSummary widget */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryRate}>
          {adherencePct}%
        </Text>
        <Text style={styles.summaryLabel}>Taux d&rsquo;observance (7 jours)</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryStat}>
            <Text style={styles.statValue}>{confirmedTotal}</Text>
            <Text style={styles.statLabel}>Confirmés</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.statValue}>{notConfirmedTotal}</Text>
            <Text style={styles.statLabel}>Non confirmés</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.statValue}>{adherenceRecords.length}</Text>
            <Text style={styles.statLabel}>Jours</Text>
          </View>
        </View>
      </View>

      {/* Daily breakdown */}
      <Text style={styles.sectionTitle}>Détail par jour</Text>
      {adherenceRecords.map((r, i) => {
        const rate = r.scheduledCount === 0 ? 1.0 : r.confirmedCount / r.scheduledCount;
        const pct = Math.round(rate * 100);
        const missed = r.scheduledCount - r.confirmedCount;
        return (
          <View key={i} style={styles.dayRow}>
            <View style={styles.dayInfo}>
              <Text style={styles.dayDate}>
                {new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </Text>
              <Text style={styles.dayStats}>
                {r.confirmedCount}/{r.scheduledCount} confirmés
              </Text>
            </View>
            <View style={styles.dayRight}>
              <Text style={styles.dayPct}>{pct}%</Text>
              {missed > 0 && <Text style={styles.dayMissed}>{missed} non confirmé(s)</Text>}
            </View>
          </View>
        );
      })}

      {/* Historical reminders */}
      <Text style={styles.sectionTitle}>Historique</Text>
      {history.length === 0 ? (
        <Text style={styles.empty}>Aucun rappel historique</Text>
      ) : (
        history.map((r: MedicationReminder) => (
          <View key={r.id} style={styles.historyRow}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyLabel}>{r.medicationLabel}</Text>
              <Text style={styles.historyTime}>{formatDateTime(r.scheduledAt)}</Text>
            </View>
            <Text style={[styles.historyStatus, r.status === 'confirmed' ? styles.statusConfirmed : styles.statusOther]}>
              {statusLabel(r.status)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return {
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryRate: { fontSize: 48, fontWeight: '700', color: colors.primaryForeground },
  summaryLabel: { fontSize: 14, color: colors.accent, marginTop: 4, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  summaryStat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.primaryForeground },
  statLabel: { fontSize: 12, color: colors.accent, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginTop: 16, marginBottom: 8 },
  dayRow: {
    backgroundColor: colors.primaryForeground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayInfo: { flex: 1 },
  dayDate: { fontSize: 14, fontWeight: '500', color: colors.primary },
    dayStats: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    dayRight: { alignItems: 'flex-end' },
    dayPct: { fontSize: 16, fontWeight: '700', color: colors.primary },
    dayMissed: { fontSize: 11, color: colors.destructive, marginTop: 2 },
    historyRow: {
      backgroundColor: colors.primaryForeground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyInfo: { flex: 1 },
    historyLabel: { fontSize: 14, fontWeight: '500', color: colors.primary },
    historyTime: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    historyStatus: { fontSize: 13, fontWeight: '500', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusConfirmed: { color: colors.success, backgroundColor: colors.secondary },
      statusOther: { color: colors.mutedForeground, backgroundColor: colors.accent },
      empty: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', padding: 16 },
    }
}

export default AdherenceHistoryScreen;