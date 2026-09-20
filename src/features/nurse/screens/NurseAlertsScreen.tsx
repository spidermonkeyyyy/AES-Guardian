import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppHeader, AppCard, RespiBadge, AppButton } from '../../../components';
import { useTheme } from '../../../theme/ThemeContext';

interface AlertItem {
  id: string;
  patientName: string;
  type: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  status: 'new' | 'acknowledged';
}

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    patientName: 'Ahmed Benali',
    type: 'SpO2 critique (<90%)',
    description: 'Baisse importante de la saturation : 88% mesuré à 14:15.',
    severity: 'critical',
    timestamp: 'Il y a 15 min',
    status: 'new',
  },
  {
    id: '2',
    patientName: 'Jean Dupont',
    type: 'Dyspnée modérée',
    description: 'Score de dyspnée 3/4 déclaré lors du suivi quotidien.',
    severity: 'warning',
    timestamp: 'Il y a 1h',
    status: 'new',
  },
  {
    id: '3',
    patientName: 'Marie Curie',
    type: 'Questionnaire non rempli',
    description: 'Aucun questionnaire reçu depuis 48h.',
    severity: 'info',
    timestamp: 'Ce matin',
    status: 'acknowledged',
  },
];

export default function NurseAlertsScreen() {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const acknowledgeAlert = (id: string) => {
  const { colors } = useTheme();
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a))
    );
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Centre d'Alertes" />

      {/* Filter Chips */}
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: colors.card, borderColor: colors.border },
            filter === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.chipText,
              { color: colors.foreground },
              filter === 'all' && { color: colors.primaryForeground, fontWeight: typography.fontWeight.bold },
            ]}
          >
            Toutes ({alerts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: colors.card, borderColor: colors.border },
            filter === 'critical' && { backgroundColor: colors.destructive, borderColor: colors.destructive },
          ]}
          onPress={() => setFilter('critical')}
        >
          <Text
            style={[
              styles.chipText,
              { color: colors.foreground },
              filter === 'critical' && { color: colors.primaryForeground, fontWeight: typography.fontWeight.bold },
            ]}
          >
            Critiques ({alerts.filter((a) => a.severity === 'critical').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: colors.card, borderColor: colors.border },
            filter === 'warning' && { backgroundColor: colors.warning, borderColor: colors.warning },
          ]}
          onPress={() => setFilter('warning')}
        >
          <Text
            style={[
              styles.chipText,
              { color: colors.foreground },
              filter === 'warning' && { color: colors.primaryForeground, fontWeight: typography.fontWeight.bold },
            ]}
          >
            Modérées ({alerts.filter((a) => a.severity === 'warning').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alert List */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AppCard
            variant="outlined"
            style={[
              styles.alertCard,
              item.severity === 'critical' ? { borderColor: colors.destructive + '80', borderWidth: 1.5 } : {},
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.patientRow}>
                <Icon
                  name={item.severity === 'critical' ? 'alert-triangle' : 'alert-circle'}
                  size={20}
                  color={item.severity === 'critical' ? colors.destructive : colors.warning}
                />
                <Text style={[styles.patientName, { color: colors.foreground }]}>{item.patientName}</Text>
              </View>
              <RespiBadge
                label={item.severity === 'critical' ? 'Urgent' : 'Avertissement'}
                variant={item.severity === 'critical' ? 'danger' : 'warning'}
              />
            </View>

            <Text style={[styles.alertType, { color: colors.foreground }]}>{item.type}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{item.description}</Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                <Icon name="clock" size={12} /> {item.timestamp}
              </Text>
              {item.status === 'new' ? (
                <TouchableOpacity
                  style={[styles.ackButton, { backgroundColor: colors.primary }]}
                  onPress={() => acknowledgeAlert(item.id)}
                >
                  <Text style={[styles.ackText, { color: colors.primaryForeground }]}>Prendre en charge</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.ackBadge}>
                  <Icon name="check" size={14} color={colors.primary} />
                  <Text style={[styles.ackBadgeText, { color: colors.primary }]}>Pris en charge</Text>
                </View>
              )}
            </View>
          </AppCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chipRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: shapes.pill,
    borderWidth: 1,
  },
  chipText: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.xs },
  list: { padding: spacing.lg, gap: spacing.sm },
  alertCard: { padding: spacing.md, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  patientName: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  alertType: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  alertDesc: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.xs, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  timestamp: { fontFamily: typography.fontFamily.openSans, fontSize: 11 },
  ackButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: shapes.sm },
  ackText: { fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.openSans, fontWeight: typography.fontWeight.semibold },
  ackBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ackBadgeText: { fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.openSans, fontWeight: typography.fontWeight.semibold },
});
