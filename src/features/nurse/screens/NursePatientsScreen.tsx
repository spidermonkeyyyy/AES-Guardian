import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppButton, AppCard, AppHeader, AppInput, RespiBadge } from '../../../components';
import { useNursePatientsStore } from '../patients/state/use-nurse-patients-store';
import { PatientRosterFilter, PriorityLevel } from '../../../types/patient';
import { useTheme } from '../../../theme/ThemeContext';
import { TranslationKey, useLocale, t, isRTL } from '../../../localization';

const rosterFilters: { value: PatientRosterFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'nurse.patients.filter.all' },
  { value: 'toReview', labelKey: 'nurse.patients.filter.review' },
  { value: 'followed', labelKey: 'nurse.patients.filter.followed' },
];

const priorityLabels: Record<PriorityLevel, TranslationKey> = {
  high: 'nurse.patients.priority.high',
  reviewRequired: 'nurse.patients.priority.review',
  informational: 'nurse.patients.priority.info',
};

export default function NursePatientsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const {
    isLoading,
    errorMessage,
    patients,
    searchQuery,
    filter,
    loadPatients,
    searchPatients,
    setFilter,
    selectPatient,
  } = useNursePatientsStore();

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = patients.filter((patient) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = patient.fullName?.toLowerCase().includes(query);
      const matchCondition = patient.condition?.toLowerCase().includes(query);
      if (!matchName && !matchCondition) return false;
    }
    if (filter === 'toReview') return patient.hasNewSubmission || patient.priority !== 'informational';
    if (filter === 'followed') return patient.lastSubmissionAt !== null;
    return true;
  });

  const displayCondition = (condition: string, classification: string) => {
    const localizedCondition = condition === 'BPCO'
      ? t('nurse.patients.condition.copd', locale)
      : condition === 'Asthme sévère'
        ? t('nurse.patients.condition.severeAsthma', locale)
        : condition || t('nurse.patients.conditionUnavailable', locale);
    return [localizedCondition, classification].filter(Boolean).join(' · ');
  };

  const formatDate = (value: string | null) => {
    if (!value) return t('nurse.patients.notAvailable', locale);
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? t('nurse.patients.notAvailable', locale)
      : date.toLocaleDateString({ fr: 'fr-FR', en: 'en-GB', ar: 'ar' }[locale]);
  };

  const retry = () => {
    if (searchQuery.trim()) {
      searchPatients(searchQuery);
    } else {
      loadPatients();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={t('nurse.patients.title', locale)}
        subtitle={t('nurse.patients.count', locale).replace(
          '{count}',
          String(filteredPatients.length),
        )}
      />

      <View style={[styles.searchSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.demoNotice, { backgroundColor: colors.infoBackground }]}>
          <AppIcon name="info" size={18} color={colors.info} />
          <Text style={[styles.demoNoticeText, { color: colors.foreground }]}>
            {t('nurse.patients.demoNotice', locale)}
          </Text>
        </View>
        <AppInput
          placeholder={t('nurse.patients.searchPlaceholder', locale)}
          value={searchQuery}
          onChangeText={searchPatients}
          leftIcon={<AppIcon name="search" size={20} color={colors.mutedForeground} />}
          containerStyle={styles.searchInput}
        />

        <View style={[styles.filterRow, { direction: rtl ? 'rtl' : 'ltr' }]}>
          {rosterFilters.map((option) => {
            const selected = filter === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.surfaceVariant },
                  selected && { backgroundColor: colors.primary },
                ]}
                onPress={() => setFilter(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t(option.labelKey, locale)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.mutedForeground },
                    selected && {
                      color: colors.primaryForeground,
                      fontWeight: typography.fontWeight.semibold,
                    },
                  ]}
                >
                  {t(option.labelKey, locale)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {errorMessage ? (
        <AppCard variant="flat" style={styles.stateCard}>
          <Text style={[styles.stateText, { color: colors.foreground }]}>
            {t('nurse.patients.error.generic', locale)}
          </Text>
          <AppButton
            title={t('nurse.patients.retry', locale)}
            onPress={retry}
            variant="outline"
          />
        </AppCard>
      ) : isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { direction: rtl ? 'rtl' : 'ltr' }]}
          ListEmptyComponent={
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
              {t('nurse.patients.empty', locale)}
            </Text>
          }
          renderItem={({ item }) => {
            const oxygenSaturation = item.latestSubmission?.spo2Value;
            const priorityVariant = item.priority === 'high'
              ? 'danger'
              : item.priority === 'reviewRequired'
                ? 'warning'
                : 'info';
            return (
              <AppCard
                variant="outlined"
                style={styles.patientCard}
                onPress={async () => {
                  await selectPatient(item.id);
                  navigation.navigate('patientDetail', { patientId: item.id });
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                      {item.fullName?.substring(0, 2).toUpperCase() || '—'}
                    </Text>
                  </View>
                  <View style={styles.patientMainInfo}>
                    <Text style={[styles.patientName, { color: colors.foreground }]}>
                      {item.fullName || t('nurse.dashboard.patientFallback', locale)}
                    </Text>
                    <Text style={[styles.patientDetails, { color: colors.mutedForeground }]}>
                      {displayCondition(item.condition, item.classification)}
                    </Text>
                  </View>
                  <RespiBadge
                    label={t(
                      item.hasNewSubmission
                        ? 'nurse.patients.status.newCheckIn'
                        : 'nurse.patients.status.noNewCheckIn',
                      locale,
                    )}
                    variant={item.hasNewSubmission ? 'warning' : 'info'}
                  />
                </View>

                <View style={[styles.vitalsRow, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={styles.vitalBox}>
                    <Text style={[styles.vitalLabel, { color: colors.mutedForeground }]}>
                      {t('nurse.patients.measurement.spo2', locale)}
                    </Text>
                    <Text style={[styles.vitalValue, { color: colors.foreground }]}>
                      {oxygenSaturation != null
                        ? `${oxygenSaturation} %`
                        : t('nurse.patients.notAvailable', locale)}
                    </Text>
                  </View>
                  <View style={styles.vitalBox}>
                    <Text style={[styles.vitalLabel, { color: colors.mutedForeground }]}>
                      {t('nurse.patients.measurement.lastCheckIn', locale)}
                    </Text>
                    <Text style={[styles.vitalValue, { color: colors.foreground }]}>
                      {formatDate(item.lastSubmissionAt)}
                    </Text>
                  </View>
                  <View style={styles.vitalBox}>
                    <Text style={[styles.vitalLabel, { color: colors.mutedForeground }]}>
                      {t('nurse.patients.measurement.priority', locale)}
                    </Text>
                    <Text style={[styles.vitalValue, { color: item.priority === 'high' ? colors.destructive : colors.foreground }]}>
                      {t(priorityLabels[item.priority], locale)}
                    </Text>
                  </View>
                </View>
              </AppCard>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: shapes.md,
    marginBottom: spacing.sm,
  },
  demoNoticeText: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  searchInput: { marginBottom: spacing.xs },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: shapes.pill,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  loading: { marginTop: spacing.xl },
  listContent: {
    flexGrow: 1,
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  patientCard: { padding: spacing.md },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },
  patientMainInfo: {
    flex: 1,
    marginStart: spacing.md,
  },
  patientName: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  patientDetails: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: shapes.sm,
    padding: spacing.sm,
  },
  vitalBox: { alignItems: 'center', flex: 1 },
  vitalLabel: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: 11,
    textAlign: 'center',
  },
  vitalValue: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
    textAlign: 'center',
  },
  stateCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
    padding: spacing.lg,
    textAlign: 'center',
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});
