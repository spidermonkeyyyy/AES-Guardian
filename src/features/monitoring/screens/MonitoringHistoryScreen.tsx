import { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { useMonitoringStore } from '../state/use-monitoring-store';
import { MeasurementType, measurementTypeInfo } from '../../../types/measurement';

const RANGES = [
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
] as const;

export default function MonitoringHistoryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { history, historyLoading, historyError, selectedRange, selectedTypes, loadHistory, refreshHistory, setRange, toggleType } =
    useMonitoringStore();

  const onRefresh = useCallback(async () => {
    await refreshHistory('patient-1');
  }, [refreshHistory]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.foreground }]}>Historique de vos mesures</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Évolution de vos mesures</Text>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '33' }]}>
        <Text style={[styles.infoText, { color: colors.foreground }]}>
          Ces courbes reflètent vos mesures saisies. Elles sont présentées à titre informatif et ne remplacent pas un avis médical.
        </Text>
      </View>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[
              styles.rangeChip,
              { borderColor: colors.border, backgroundColor: colors.card },
              selectedRange === r.key && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setRange(r.key as any)}
          >
            <Text style={[
              styles.rangeText,
              { color: colors.foreground },
              selectedRange === r.key && { color: colors.primaryForeground, fontWeight: typography.fontWeight.semibold },
            ]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {Object.values(MeasurementType).map((type) => {
          const info = measurementTypeInfo(type);
          const selected = selectedTypes.has(type);
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                { borderColor: colors.border, backgroundColor: colors.card },
                selected && { backgroundColor: colors.secondary, borderColor: colors.primary },
              ]}
              onPress={() => toggleType(type)}
            >
              <Text style={[
                styles.filterText,
                { color: colors.foreground },
                selected && { color: colors.primary, fontWeight: typography.fontWeight.semibold },
              ]}>{info.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {historyLoading ? <Text style={[styles.loading, { color: colors.mutedForeground }]}>Chargement...</Text> : null}

      {historyError ? (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '33' }]}>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Impossible de charger vos mesures</Text>
          <Text style={[styles.errorBody, { color: colors.mutedForeground }]}>Vérifiez votre connexion puis réessayez.</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={onRefresh}>
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!historyLoading && !historyError && history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune mesure sur cette période</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            Modifiez la période ou les mesures affichées, ou enregistrez une nouvelle saturation pour voir apparaître votre courbe.
          </Text>
        </View>
      ) : null}

      {!historyLoading && !historyError && history.length > 0 ? (
        <View style={styles.chartList}>
          {history
            .filter((m) => selectedTypes.has(m.type))
            .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime())
            .map((m) => (
              <View key={m.id} style={[styles.chartCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.foreground }]}>{measurementTypeInfo(m.type).label}</Text>
                <Text style={[styles.chartValue, { color: colors.primary }]}>
                  {m.value} {m.unit}
                </Text>
                <Text style={[styles.chartDate, { color: colors.mutedForeground }]}>
                  {m.measuredAt.toLocaleDateString()} {m.measuredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing[6] },
  title: { fontFamily: typography.fontFamily.urbanist, fontSize: 20, fontWeight: typography.fontWeight.bold, marginBottom: spacing[1] },
  subtitle: { fontSize: typography.fontSize.md, marginBottom: spacing[4] },
  infoBox: { padding: spacing[4], borderRadius: shapes.md, borderWidth: 1, marginBottom: spacing[4] },
  infoText: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  rangeRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
  rangeChip: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: shapes.sm, borderWidth: 1 },
  rangeText: { fontSize: typography.fontSize.sm },
  filterRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap' },
  filterChip: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: shapes.sm, borderWidth: 1 },
  filterText: { fontSize: typography.fontSize.sm },
  loading: { textAlign: 'center', marginTop: spacing[6] },
  errorBox: { padding: spacing[5], borderRadius: shapes.md, borderWidth: 1, alignItems: 'center' },
  errorTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] },
  errorBody: { fontSize: typography.fontSize.md, marginBottom: spacing[4], textAlign: 'center' },
  retryButton: { paddingVertical: spacing[3], paddingHorizontal: spacing[6], borderRadius: shapes.sm },
  retryText: { fontWeight: typography.fontWeight.semibold },
  emptyBox: { paddingVertical: spacing[10], alignItems: 'center' },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] },
  emptyBody: { fontSize: typography.fontSize.md, textAlign: 'center', paddingHorizontal: spacing[4] },
  chartList: { gap: spacing[3] },
  chartCard: { padding: spacing[4], borderRadius: shapes.md, borderWidth: 1, marginBottom: spacing[3] },
  chartTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[1] },
  chartValue: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  chartDate: { fontSize: typography.fontSize.sm, marginTop: spacing[1] },
});
