import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppHeader, AppCard, RespiBadge } from '../../../components';
import { useLocale, t, isRTL, TranslationKey } from '../../../localization';
import { useTheme } from '../../../theme/ThemeContext';

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertFilter = 'all' | 'critical' | 'warning';

interface AlertItem {
  id: string;
  patientKey: TranslationKey;
  typeKey: TranslationKey;
  descriptionKey: TranslationKey;
  severity: AlertSeverity;
  minutesAgo: number;
  status: 'new' | 'acknowledged';
}

const demoAlerts: AlertItem[] = [
  {
    id: '1',
    patientKey: 'nurse.alerts.patient.a',
    typeKey: 'nurse.alerts.type.criticalSpo2',
    descriptionKey: 'nurse.alerts.description.lowSpo2',
    severity: 'critical',
    minutesAgo: 15,
    status: 'new',
  },
  {
    id: '2',
    patientKey: 'nurse.alerts.patient.b',
    typeKey: 'nurse.alerts.type.dyspnea',
    descriptionKey: 'nurse.alerts.description.dyspnea',
    severity: 'warning',
    minutesAgo: 60,
    status: 'new',
  },
  {
    id: '3',
    patientKey: 'nurse.alerts.patient.c',
    typeKey: 'nurse.alerts.type.missedCheckIn',
    descriptionKey: 'nurse.alerts.description.missedCheckIn',
    severity: 'info',
    minutesAgo: 360,
    status: 'acknowledged',
  },
];

const severityLabelKeys: Record<AlertSeverity, TranslationKey> = {
  critical: 'nurse.alerts.severity.urgent',
  warning: 'nurse.alerts.severity.warning',
  info: 'nurse.alerts.severity.info',
};

const filterOptions: { value: AlertFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'nurse.alerts.filter.all' },
  { value: 'critical', labelKey: 'nurse.alerts.filter.critical' },
  { value: 'warning', labelKey: 'nurse.alerts.filter.warning' },
];

export default function NurseAlertsScreen() {
  const { colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const [alerts, setAlerts] = useState<AlertItem[]>(demoAlerts);
  const [filter, setFilter] = useState<AlertFilter>('all');

  const acknowledgeAlert = (id: string) => {
    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === id ? { ...alert, status: 'acknowledged' } : alert,
      ),
    );
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'critical') return alert.severity === 'critical';
    if (filter === 'warning') return alert.severity === 'warning';
    return true;
  });

  const formatRelativeTime = (minutesAgo: number) => {
    const key = minutesAgo < 60
      ? 'nurse.alerts.time.minutesAgo'
      : 'nurse.alerts.time.hoursAgo';
    const count = minutesAgo < 60
      ? minutesAgo
      : Math.floor(minutesAgo / 60);
    return t(key, locale).replace('{count}', String(count));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('nurse.alerts.title', locale)} />
      <View style={[styles.demoNotice, { backgroundColor: colors.infoBackground }]}>
        <Icon name="info" size={18} color={colors.info} />
        <Text style={[styles.demoNoticeText, { color: colors.foreground }]}>
          {t('nurse.alerts.demoNotice', locale)}
        </Text>
      </View>

      <View style={[styles.chipRow, { direction: rtl ? 'rtl' : 'ltr' }]}>
        {filterOptions.map((option) => {
          const selected = filter === option.value;
          const count = option.value === 'all'
            ? alerts.length
            : alerts.filter((alert) => alert.severity === option.value).length;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chip,
                { backgroundColor: colors.card, borderColor: colors.border },
                selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                option.value === 'critical' && selected && {
                  backgroundColor: colors.destructive,
                  borderColor: colors.destructive,
                },
              ]}
              onPress={() => setFilter(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t(option.labelKey, locale)} (${count})`}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: colors.foreground },
                  selected && {
                    color: colors.primaryForeground,
                    fontWeight: typography.fontWeight.bold,
                  },
                ]}
              >
                {t(option.labelKey, locale)} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { direction: rtl ? 'rtl' : 'ltr' }]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {t('nurse.alerts.empty', locale)}
          </Text>
        }
        renderItem={({ item }) => {
          const critical = item.severity === 'critical';
          const badgeVariant = critical
            ? 'danger'
            : item.severity === 'warning'
              ? 'warning'
              : 'info';
          return (
            <AppCard
              variant="outlined"
              style={[
                styles.alertCard,
                critical ? {
                  borderColor: colors.destructive + '80',
                  borderWidth: 1.5,
                } : {},
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.patientRow}>
                  <Icon
                    name={critical ? 'alert-triangle' : 'alert-circle'}
                    size={20}
                    color={critical ? colors.destructive : colors.warning}
                  />
                  <Text style={[styles.patientName, { color: colors.foreground }]}>
                    {t(item.patientKey, locale)}
                  </Text>
                </View>
                <RespiBadge
                  label={t(severityLabelKeys[item.severity], locale)}
                  variant={badgeVariant}
                />
              </View>

              <Text style={[styles.alertType, { color: colors.foreground }]}>
                {t(item.typeKey, locale)}
              </Text>
              <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
                {t(item.descriptionKey, locale)}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(item.minutesAgo)}
                </Text>
                {item.status === 'new' ? (
                  <TouchableOpacity
                    style={[styles.ackButton, { backgroundColor: colors.primary }]}
                    onPress={() => acknowledgeAlert(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('nurse.alerts.acknowledge', locale)}: ${t(item.patientKey, locale)}`}
                  >
                    <Text style={[styles.ackText, { color: colors.primaryForeground }]}>
                      {t('nurse.alerts.acknowledge', locale)}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.ackBadge}>
                    <Icon name="check" size={14} color={colors.primary} />
                    <Text style={[styles.ackBadgeText, { color: colors.primary }]}>
                      {t('nurse.alerts.acknowledged', locale)}
                    </Text>
                  </View>
                )}
              </View>
            </AppCard>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: shapes.md,
  },
  demoNoticeText: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: shapes.pill,
    borderWidth: 1,
  },
  chipText: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.xs },
  list: { flexGrow: 1, padding: spacing.lg, gap: spacing.sm },
  alertCard: { padding: spacing.md, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  patientName: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  alertType: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  alertDesc: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  timestamp: { fontFamily: typography.fontFamily.openSans, fontSize: 11 },
  ackButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: shapes.sm },
  ackText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.openSans,
    fontWeight: typography.fontWeight.semibold,
  },
  ackBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ackBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.openSans,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyText: {
    padding: spacing.lg,
    textAlign: 'center',
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
  },
});
