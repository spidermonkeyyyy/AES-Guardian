import React, { useEffect, useState } from 'react';
import {
  useSmokingCessationStore,
  selectTodaysEntry,
  selectWeeklyCigarettes,
  formatSmokingDate,
  CRAVING_LABELS,
  TRIGGER_LABELS,
} from '../state/use-smoking-cessation-store';
import { SmokingEntry, CravingIntensity } from '../../../../types/education';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

function cravingColor(intensity: CravingIntensity, colors: any): string {
  switch (intensity) {
    case 'low': return colors.success;
    case 'moderate': return colors.warning;
    case 'high': return colors.destructive;
  }
}

function cravingBg(intensity: CravingIntensity, colors: any): string {
  switch (intensity) {
    case 'low': return colors.secondary;
    case 'moderate': return colors.primaryForeground + '3e0';
    case 'high': return colors.destructive;
  }
}

const SmokingCessationScreen: React.FC<{ onAddEntry: () => void; onViewProgress: () => void }> = ({ onAddEntry, onViewProgress }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isLoading, errorMessage, entries, currentGoal, loadData, deleteEntry } = useSmokingCessationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const onDelete = (entryId: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette entrée ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteEntry(entryId) },
    ]);
  };

  if (isLoading && entries.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingHint}>Chargement de votre carnet...</Text>
      </View>
    );
  }

  if (errorMessage && entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Impossible de charger votre carnet</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}><Text style={styles.retryButtonText}>Réessayer</Text></TouchableOpacity>
      </View>
    );
  }

  const state = { entries, isLoading: false, errorMessage: null, trackedDays: 0, currentGoal: '', educationalContent: [] };
  const todayEntry = selectTodaysEntry(state);
  const weekly = selectWeeklyCigarettes(state);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.header}>Sevrage tabagique</Text>

      <View style={styles.goalCard}>
        <Text style={styles.goalLabel}>Votre objectif</Text>
        <Text style={styles.goalText}>{currentGoal}</Text>
        {todayEntry && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Aujourd'hui : {todayEntry.cigarettesConsumed} cigarette(s)</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onAddEntry}>
          <Text style={styles.actionButtonText}>+ Ajouter une entrée</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={onViewProgress}>
          <Text style={styles.actionButtonTextSecondary}>📊 Progression</Text>
        </TouchableOpacity>
      </View>

      {weekly > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{weekly}</Text><Text style={styles.statLabel}>cigarettes cette semaine</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{entries.length}</Text><Text style={styles.statLabel}>entrées totales</Text></View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Historique</Text>

      {entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune entrée pour le moment.</Text>
          <Text style={styles.emptySubText}>Ajoutez votre première entrée pour commencer le suivi.</Text>
        </View>
      ) : (
        entries.map((entry) => (
          <SmokingEntryCard key={entry.id} entry={entry} onDelete={() => onDelete(entry.id)} />
        ))
      )}
    </ScrollView>
  );
};

function SmokingEntryCard({ entry, onDelete }: { entry: SmokingEntry; onDelete: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const color = cravingColor(entry.cravingIntensity, colors);
  const bg = cravingBg(entry.cravingIntensity, colors);
  return (
    <View style={[styles.entryCard, { borderLeftColor: color }]}>
      <View style={styles.entryRow}>
        <View style={styles.entryMain}>
          <Text style={styles.entryDate}>{formatSmokingDate(entry.date)}</Text>
          <View style={[styles.cravingBadge, { backgroundColor: bg }]}>
            <Text style={[styles.cravingBadgeText, { color }]}>{CRAVING_LABELS[entry.cravingIntensity]}</Text>
          </View>
        </View>
        <View style={styles.entryRight}>
          <Text style={styles.entryCigs}>{entry.cigarettesConsumed}</Text>
          <Text style={styles.entryCigsLabel}>cig.</Text>
        </View>
      </View>
      <View style={styles.entryMeta}>
        <Text style={styles.entryTrigger}>{TRIGGER_LABELS[entry.trigger]}</Text>
        {entry.personalNote && <Text style={styles.entryNote}>{entry.personalNote}</Text>}
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Text style={styles.deleteText}>🗑 Supprimer</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
  loadingHint: { marginTop: 12, fontSize: 14, color: colors.mutedForeground },
  header: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  goalCard: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 16, marginBottom: 12 },
  goalLabel: { fontSize: 12, color: colors.mutedForeground, fontWeight: '600' },
  goalText: { fontSize: 20, fontWeight: '700', color: colors.primary, marginTop: 4 },
  todayBadge: { backgroundColor: colors.secondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 8 },
  todayBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  actionButtonSecondary: { backgroundColor: colors.primaryForeground, borderWidth: 2, borderColor: colors.primary },
  actionButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  actionButtonTextSecondary: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.mutedForeground, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  emptyCard: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  emptySubText: { fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: 4 },
  entryCard: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 4 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  entryMain: { flex: 1 },
  entryDate: { fontSize: 14, fontWeight: '600', color: colors.primary },
  cravingBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  cravingBadgeText: { fontSize: 11, fontWeight: '600' },
  entryRight: { alignItems: 'flex-end' },
  entryCigs: { fontSize: 20, fontWeight: '700', color: colors.primary },
  entryCigsLabel: { fontSize: 10, color: colors.mutedForeground },
  entryMeta: { marginTop: 6 },
  entryTrigger: { fontSize: 12, color: colors.mutedForeground },
  entryNote: { fontSize: 12, color: colors.foreground, marginTop: 2, fontStyle: 'italic' },
  deleteButton: { marginTop: 8, alignSelf: 'flex-start' },
  deleteText: { fontSize: 12, color: colors.destructive },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
});
}

export default SmokingCessationScreen;