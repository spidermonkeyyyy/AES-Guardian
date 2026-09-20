import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAlertStore } from '../state/use-alert-store';
import { AlertRepository } from '../../../services/repositories/alert';
import { AlertFilter, AlertPriority, AlertStatus } from '../../../types/alert';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';

interface AlertsListScreenProps {
  repository?: AlertRepository;
}

const FILTERS: { label: string; value: AlertFilter }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'Non traitées', value: 'unhandled' },
  { label: 'Priorité élevée', value: 'highPriority' },
  { label: 'À revoir', value: 'toReview' },
  { label: 'Résolues', value: 'resolved' },
];

export default function AlertsListScreen({ repository }: AlertsListScreenProps) {
  const { colors } = useTheme();

  if (repository) {
    useAlertStore.setState({ repository });
  }

  const loadAlerts = useAlertStore((s) => s.loadAlerts);
  const setFilter = useAlertStore((s) => s.setFilter);
  const filteredGroups = useAlertStore((s) => s.filteredGroups);
  const isLoading = useAlertStore((s) => s.isLoading);
  const errorMessage = useAlertStore((s) => s.errorMessage);
  const filter = useAlertStore((s) => s.filter);
  const openCount = useAlertStore((s) => s.openCount());
  const clearError = useAlertStore((s) => s.clearError);

  useFocusEffect(
    useCallback(() => {
      clearError();
      loadAlerts();
    }, [loadAlerts, clearError]),
  );

  const renderGroup = ({ item }: { item: { patientId: string; patientName: string; patientSummary: string; alerts: any[] } }) => {
    const mostUrgent = item.alerts[0];
    const priorityColor =
      mostUrgent.priority === AlertPriority.high
        ? colors.destructive
        : mostUrgent.priority === AlertPriority.medium
          ? colors.warning
          : colors.mutedForeground;

    return (
      <TouchableOpacity
        style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
        }}
        accessibilityRole="button"
        accessibilityLabel={`Alertes pour ${item.patientName}, ${item.alerts.length} alerte(s)`}
      >
        <View style={styles.groupHeader}>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: colors.foreground }]}>{item.patientName}</Text>
            {item.patientSummary ? (
              <Text style={[styles.patientSummary, { color: colors.mutedForeground }]}>{item.patientSummary}</Text>
            ) : null}
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {mostUrgent.priority === AlertPriority.high ? 'Haute' : mostUrgent.priority === AlertPriority.medium ? 'Moyenne' : 'Basse'}
            </Text>
          </View>
        </View>

        <View style={styles.alertsList}>
          {item.alerts.map((alert) => (
            <View key={alert.id} style={[styles.alertRow, { borderTopColor: colors.border }]}>
              <View style={styles.alertInfo}>
                <Text style={[styles.alertReason, { color: colors.foreground }]} numberOfLines={2}>
                  {alert.reason}
                </Text>
                <Text style={[styles.alertMeta, { color: colors.mutedForeground }]}>
                  {new Date(alert.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                  {alert.status === AlertStatus.unread
                    ? 'Non lue'
                    : alert.status === AlertStatus.acknowledged
                      ? 'Pris en charge'
                      : alert.status === AlertStatus.inProgress
                        ? 'En cours'
                        : 'Résolue'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Chargement des alertes...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Impossible de charger les alertes</Text>
        <Text style={[styles.errorMessage, { color: colors.mutedForeground }]}>{errorMessage}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            clearError();
            loadAlerts();
          }}
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
        >
          <Text style={[styles.retryButtonText, { color: colors.primaryForeground }]}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const groups = filteredGroups();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {openCount > 0 && (
        <View style={[styles.openCountBanner, { backgroundColor: colors.destructive + '20' }]}>
          <Text style={[styles.openCountText, { color: colors.destructive }]}>
            {openCount} ouverte{openCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = filter === item.value;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  isSelected && { backgroundColor: colors.primary + '30', borderColor: colors.primary },
                ]}
                onPress={() => setFilter(item.value)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrer: ${item.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: colors.foreground },
                  isSelected && { color: colors.primary, fontWeight: typography.fontWeight.semibold },
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {groups.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune alerte</Text>
          <Text style={[styles.emptyMessage, { color: colors.mutedForeground }]}>Les alertes de surveillance s'afficheront ici.</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.patientId}
          contentContainerStyle={styles.listContent}
          renderItem={renderGroup}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  loadingText: { marginTop: spacing[3], fontSize: typography.fontSize.md },
  errorTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: spacing[2], textAlign: 'center' },
  errorMessage: { fontSize: typography.fontSize.md, marginBottom: spacing[4], textAlign: 'center' },
  retryButton: { paddingVertical: spacing[3], paddingHorizontal: spacing[6], borderRadius: shapes.sm, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  retryButtonText: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
  openCountBanner: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], alignItems: 'center' },
  openCountText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  filterRow: { paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderBottomWidth: 1 },
  filterChip: { paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: shapes.sm, borderWidth: 1, marginRight: spacing[2] },
  filterChipText: { fontSize: typography.fontSize.sm },
  listContent: { padding: spacing[3] },
  listSeparator: { height: spacing[3] },
  groupCard: { borderRadius: shapes.md, borderWidth: 1, padding: spacing[3] },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] },
  patientInfo: { flex: 1, marginRight: spacing[2] },
  patientName: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[1] },
  patientSummary: { fontSize: typography.fontSize.sm },
  priorityBadge: { paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: shapes.sm },
  priorityText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold },
  alertsList: { gap: spacing[2] },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing[2], borderTopWidth: 1 },
  alertInfo: { flex: 1, marginRight: spacing[2] },
  alertReason: { fontSize: typography.fontSize.sm, marginBottom: spacing[1] },
  alertMeta: { fontSize: typography.fontSize.xs },
  statusBadge: { paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: shapes.sm },
  statusText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, marginBottom: spacing[2] },
  emptyMessage: { fontSize: typography.fontSize.md, textAlign: 'center' },
});
