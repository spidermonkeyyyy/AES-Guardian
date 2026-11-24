import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppButton, AppCard, AppHeader, RespiBadge } from '../../../components';
import { useNurseDashboardStore } from '../dashboard/state/use-nurse-dashboard-store';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import { NurseWorklistFilter } from '../../../types/dashboard';
import { useTheme } from '../../../theme/ThemeContext';
import { TranslationKey, useLocale, t, isRTL } from '../../../localization';

const filterOptions: { value: NurseWorklistFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'nurse.dashboard.filter.all' },
  { value: 'alerts', labelKey: 'nurse.dashboard.filter.alerts' },
  { value: 'tasks', labelKey: 'nurse.dashboard.filter.tasks' },
  { value: 'monitoring', labelKey: 'nurse.dashboard.filter.monitoring' },
];

const demoPatientKeys: Record<string, TranslationKey> = {
  p1: 'nurse.alerts.patient.a',
  p2: 'nurse.alerts.patient.b',
  p3: 'nurse.alerts.patient.c',
};

const demoPatientLetters: Record<string, string> = { p1: 'A', p2: 'B', p3: 'C' };

const demoWorklistCopy: Record<string, { titleKey: TranslationKey; descriptionKey: TranslationKey; statusKey: TranslationKey }> = {
  'monitoring:ms-1': {
    titleKey: 'nurse.dashboard.demo.monitorTitle',
    descriptionKey: 'nurse.dashboard.demo.monitorDescription',
    statusKey: 'nurse.dashboard.demo.monitorStatus',
  },
  'alert:alert_001': {
    titleKey: 'nurse.dashboard.demo.alertTitle',
    descriptionKey: 'nurse.dashboard.demo.alertDescription',
    statusKey: 'nurse.dashboard.demo.alertStatus',
  },
};

export default function NurseDashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const user = useAuthStore((s) => s.user);
  const {
    isLoading,
    errorMessage,
    summary,
    priorityQueue,
    worklistItems,
    worklistFilter,
    loadDashboard,
    setWorklistFilter,
  } = useNurseDashboardStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };
  const nurseName = user?.name?.trim();
  const greeting = nurseName
    ? t('nurse.dashboard.greeting', locale).replace('{name}', nurseName)
    : t('nurse.dashboard.greetingGeneric', locale);
  const dateLocale = { fr: 'fr-FR', en: 'en-GB', ar: 'ar' }[locale];
  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(dateLocale);
  };
  const displayPatientName = (patientId: string, name: string) => {
    const key = demoPatientKeys[patientId];
    return key ? t(key, locale) : name || t('nurse.dashboard.patientFallback', locale);
  };
  const displayCondition = (condition: string | undefined) => {
    if (condition === 'BPCO') return t('nurse.dashboard.condition.copd', locale);
    if (condition === 'IRC') return t('nurse.dashboard.condition.ckd', locale);
    return condition || t('nurse.dashboard.conditionUnavailable', locale);
  };

  const filteredItems = worklistItems.filter((item) => {
    if (worklistFilter === 'all') return true;
    if (worklistFilter === 'alerts') return item.type === 'alert';
    if (worklistFilter === 'tasks') return item.type === 'task';
    if (worklistFilter === 'monitoring') return item.type === 'monitoring';
    if (worklistFilter === 'needsAttention') return item.isActionable;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={t('nurse.dashboard.title', locale)}
        subtitle={nurseName || t('nurse.dashboard.subtitle', locale)}
        rightAction={
          <TouchableOpacity
            style={[styles.ruleButton, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('rules')}
            accessibilityRole="button"
            accessibilityLabel={t('nurse.dashboard.rules', locale)}
          >
            <AppIcon name="sliders" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { direction: rtl ? 'rtl' : 'ltr' }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={[styles.demoNotice, { backgroundColor: colors.infoBackground }]}>
          <AppIcon name="info" size={18} color={colors.info} />
          <Text style={[styles.demoNoticeText, { color: colors.foreground }]}>
            {t('nurse.dashboard.demoNotice', locale)}
          </Text>
        </View>

        {/* 1. Nurse Greeting */}
        <View style={styles.greetingRow}>
          <Text style={[styles.greetingText, { color: colors.foreground }]}>{greeting}</Text>
          <Text style={[styles.subGreetingText, { color: colors.mutedForeground }]}>
            {t('nurse.dashboard.subtitle', locale)}
          </Text>
        </View>

        {/* 2. Attention Summary */}
        <AppCard variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <AppIcon name="bell" size={20} color={colors.warning} />
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                {t('nurse.dashboard.attentionRequired', locale)}
              </Text>
            </View>
            <RespiBadge
              label={t('nurse.dashboard.attentionCount', locale).replace(
                '{count}',
                String(summary?.reviewRequiredCount ?? 0),
              )}
              variant="warning"
            />
          </View>
          <View style={styles.categoriesRow}>
            <TouchableOpacity
              style={[
                styles.categoryBox,
                { backgroundColor: colors.surfaceVariant },
                worklistFilter === 'alerts' && { borderColor: colors.primary, backgroundColor: colors.secondary },
              ]}
              onPress={() => setWorklistFilter('alerts')}
              accessibilityRole="button"
              accessibilityState={{ selected: worklistFilter === 'alerts' }}
            >
              <Text style={[styles.categoryCount, { color: colors.foreground }]}>
                {summary?.highPriorityCount ?? 0}
              </Text>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>
                {t('nurse.dashboard.category.alerts', locale)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryBox,
                { backgroundColor: colors.surfaceVariant },
                worklistFilter === 'tasks' && { borderColor: colors.primary, backgroundColor: colors.secondary },
              ]}
              onPress={() => setWorklistFilter('tasks')}
              accessibilityRole="button"
              accessibilityState={{ selected: worklistFilter === 'tasks' }}
            >
              <Text style={[styles.categoryCount, { color: colors.foreground }]}>
                {summary?.newSubmissionsCount ?? 0}
              </Text>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>
                {t('nurse.dashboard.category.tasks', locale)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryBox,
                { backgroundColor: colors.surfaceVariant },
                worklistFilter === 'monitoring' && { borderColor: colors.primary, backgroundColor: colors.secondary },
              ]}
              onPress={() => setWorklistFilter('monitoring')}
              accessibilityRole="button"
              accessibilityState={{ selected: worklistFilter === 'monitoring' }}
            >
              <Text style={[styles.categoryCount, { color: colors.foreground }]}>
                {summary?.reviewRequiredCount ?? 0}
              </Text>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>
                {t('nurse.dashboard.category.monitoring', locale)}
              </Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* 3. Clinical Worklist */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('nurse.dashboard.worklist', locale)}
          </Text>
          <View style={styles.filterChipsRow}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.surfaceVariant },
                  worklistFilter === option.value && { backgroundColor: colors.primary },
                ]}
                onPress={() => setWorklistFilter(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: worklistFilter === option.value }}
                accessibilityLabel={t(option.labelKey, locale)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.mutedForeground },
                    worklistFilter === option.value && { color: colors.primaryForeground, fontWeight: typography.fontWeight.semibold },
                  ]}
                >
                  {t(option.labelKey, locale)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {errorMessage ? (
          <AppCard variant="flat" style={styles.emptyCard}>
            <Text style={[styles.emptySubtitle, { color: colors.foreground }]}>
              {t('nurse.dashboard.error.load', locale)}
            </Text>
            <AppButton
              title={t('nurse.dashboard.retry', locale)}
              onPress={loadDashboard}
              variant="outline"
              style={styles.retryButton}
            />
          </AppCard>
        ) : isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : filteredItems.length === 0 ? (
          <AppCard variant="flat" style={styles.emptyCard}>
            <AppIcon name="check-circle" size={32} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('nurse.dashboard.empty.title', locale)}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {t('nurse.dashboard.empty.subtitle', locale)}
            </Text>
          </AppCard>
        ) : (
          filteredItems.map((item, idx) => {
            const copy = demoWorklistCopy[item.id];
            return (
              <AppCard
                key={item.id || idx}
                variant="outlined"
                style={styles.workItemCard}
                onPress={() => {
                  if (item.patientId) {
                    navigation.navigate('patients', {
                      screen: 'patientDetail',
                      params: { patientId: item.patientId },
                    });
                  }
                }}
              >
                <View style={styles.workItemHeader}>
                  <View style={styles.patientInfoRow}>
                    <Text style={[styles.patientName, { color: colors.foreground }]}>
                      {displayPatientName(item.patientId, item.patientName)}
                    </Text>
                    <Text style={[styles.itemTime, { color: colors.mutedForeground }]}>
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </View>
                  <RespiBadge
                    label={copy
                      ? t(copy.statusKey, locale)
                      : item.statusLabel || t('nurse.dashboard.status.unavailable', locale)}
                    variant={item.priorityRank === 1 ? 'danger' : 'info'}
                  />
                </View>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                  {copy ? t(copy.titleKey, locale) : item.title}
                </Text>
                {item.description ? (
                  <Text style={[styles.itemSubtitle, { color: colors.mutedForeground }]}>
                    {copy ? t(copy.descriptionKey, locale) : item.description}
                  </Text>
                ) : null}
              </AppCard>
            );
          })
        )}

        {/* 4. Priority Roster Quick Access */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('nurse.dashboard.priorityPatients', locale)}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('patients')}
            accessibilityRole="button"
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              {t('nurse.dashboard.seeAll', locale)} →
            </Text>
          </TouchableOpacity>
        </View>

        {priorityQueue.slice(0, 3).map((patient, idx) => (
          <AppCard
            key={patient.patientId || idx}
            variant="outlined"
            style={styles.rosterCard}
            onPress={() =>
              navigation.navigate('patients', {
                screen: 'patientDetail',
                params: { patientId: patient.patientId },
              })
            }
          >
            <View style={styles.rosterRow}>
              <View style={[styles.rosterAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.rosterAvatarText, { color: colors.primaryForeground }]}>
                  {demoPatientLetters[patient.patientId] || '•'}
                </Text>
              </View>
              <View style={styles.rosterInfo}>
                <Text style={[styles.rosterName, { color: colors.foreground }]}>
                  {displayPatientName(patient.patientId, patient.patientName)}
                </Text>
                <Text style={[styles.rosterCondition, { color: colors.mutedForeground }]}>
                  {displayCondition(patient.condition)}
                </Text>
              </View>
              <RespiBadge
                label={t(
                  patient.hasNewSubmission
                    ? 'nurse.dashboard.status.newCheckIn'
                    : 'nurse.dashboard.status.noNewCheckIn',
                  locale,
                )}
                variant={patient.hasNewSubmission ? 'warning' : 'info'}
              />
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.screenPadding, gap: spacing.md },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: shapes.md,
  },
  demoNoticeText: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  ruleButton: {
    padding: spacing.xs,
    borderRadius: shapes.sm,
  },
  greetingRow: {
    marginTop: spacing.xs,
  },
  greetingText: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  subGreetingText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  summaryCard: {
    padding: spacing.cardPadding,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryBox: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: shapes.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryCount: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  categoryLabel: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  seeAllText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: shapes.pill,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  workItemCard: {
    padding: spacing.md,
  },
  workItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  patientInfoRow: {
    flex: 1,
  },
  patientName: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  itemTime: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  itemTitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xxs,
  },
  itemSubtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  rosterCard: {
    padding: spacing.md,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rosterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterAvatarText: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  rosterInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rosterName: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  rosterCondition: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
});
