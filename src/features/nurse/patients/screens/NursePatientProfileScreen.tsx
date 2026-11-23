import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useNursePatientsStore } from '../state/use-nurse-patients-store';
import { spacing, typography, shapes } from '../../../../theme/tokens';
import { useTheme } from '../../../../theme/ThemeContext';
import { NurseTabParamList } from '../../../../navigation/routes';
import { isRTL, t, useLocale } from '../../../../localization';
import { AppCard, AppHeader } from '../../../../components';

type Route = RouteProp<NurseTabParamList, 'patientDetail'>;

function relativeTime(iso: string, locale: 'fr' | 'en' | 'ar'): string {
  const elapsed = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.max(1, Math.floor(elapsed / 60000));
  if (minutes < 60) return locale === 'ar' ? `${minutes} د` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'ar' ? `${hours} س` : `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
}

export default function NursePatientProfileScreen({ route }: { route: Route }) {
  const { colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const { patientId } = route.params;
  const { selectedPatient, isLoading, errorMessage, selectPatient } = useNursePatientsStore();

  useEffect(() => {
    selectPatient(patientId);
  }, [patientId, selectPatient]);

  if (isLoading && !selectedPatient) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
          {t('nurse.patientDetail.loading', locale)}
        </Text>
      </View>
    );
  }

  if (errorMessage && !selectedPatient) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.foreground }]}>
          {t('nurse.patientDetail.profileNotFound', locale)}
        </Text>
        <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{errorMessage}</Text>
        <TouchableOpacity
          onPress={() => selectPatient(patientId)}
          accessibilityRole="button"
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.retryLabel, { color: colors.primaryForeground }]}>
            {t('nurse.patientDetail.retry', locale)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const patient = selectedPatient;
  if (!patient) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
          {t('nurse.patientDetail.notFound', locale)}
        </Text>
      </View>
    );
  }

  const latest = patient.latestSubmission;
  const duration = latest ? relativeTime(latest.timestamp, locale) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={patient.fullName} />
      <ScrollView
        contentContainerStyle={[styles.content, { direction: rtl ? 'rtl' : 'ltr' }]}
      >
        <AppCard variant="flat" style={[styles.demoNotice, { backgroundColor: colors.infoBackground }]}>
          <Text style={[styles.body, { color: colors.foreground }]}>
            {t('nurse.patientDetail.demoNotice', locale)}
          </Text>
        </AppCard>

        <AppCard variant="elevated" style={styles.headerCard}>
          <Text style={[styles.patientName, { color: colors.foreground }]}>{patient.fullName}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {[patient.condition, patient.classification].filter(Boolean).join(' · ')}
          </Text>
        </AppCard>

        <AppCard variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('nurse.patientDetail.lastFollowUp', locale)}
          </Text>
          <Text style={[styles.body, { color: colors.foreground }]}>
            {duration
              ? t('nurse.patientDetail.sentAgo', locale).replace('{duration}', duration)
              : t('nurse.patientDetail.noFollowUp', locale)}
          </Text>
        </AppCard>

        <AppCard variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('nurse.patientDetail.observation', locale)}
          </Text>
          <Text style={[styles.body, { color: colors.foreground }]}>
            {patient.latestObservation || t('nurse.patientDetail.noObservation', locale)}
          </Text>
        </AppCard>

        <AppCard variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('nurse.patientDetail.data', locale)}
          </Text>
          {latest ? (
            <View>
              {[
                [t('nurse.patientDetail.spo2', locale), latest.spo2Value != null ? `${latest.spo2Value}%` : null],
                [t('nurse.patientDetail.dyspnea', locale), latest.answers.dyspnea?.displayLabel],
                [t('nurse.patientDetail.cough', locale), latest.answers.cough?.displayLabel],
              ].map(([label, value]) => (
                <View key={label} style={[styles.metricRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.metricLabel, { color: colors.foreground }]}>{label}</Text>
                  <Text style={[styles.metricValue, { color: colors.foreground }]}>
                    {value || t('nurse.patients.notAvailable', locale)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.body, { color: colors.foreground }]}>
              {t('nurse.patientDetail.noMeasurement', locale)}
            </Text>
          )}
        </AppCard>

        <AppCard variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('nurse.patientDetail.education', locale)}
          </Text>
          <Text style={[styles.body, { color: colors.foreground }]}>
            {t('nurse.patientDetail.educationUnavailable', locale)}
          </Text>
        </AppCard>

        <AppCard variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('nurse.patientDetail.history', locale)}
          </Text>
          {patient.timeline.length === 0 ? (
            <Text style={[styles.body, { color: colors.foreground }]}>
              {t('nurse.patientDetail.noHistory', locale)}
            </Text>
          ) : (
            <View>
              <Text style={[styles.timelineNotice, { color: colors.mutedForeground }]}>
                {t('nurse.patientDetail.fictionalTimeline', locale)}
              </Text>
              {patient.timeline.map((event, index) => (
                <View key={`${event.createdAt}-${index}`} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{event.title}</Text>
                    <Text style={[styles.body, { color: colors.mutedForeground }]}>{event.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  demoNotice: { padding: spacing.md },
  headerCard: { padding: spacing.lg },
  patientName: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  meta: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.sm, marginTop: spacing.xs },
  section: { padding: spacing.md },
  sectionTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.sm },
  body: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.sm, lineHeight: 20 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  metricLabel: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.sm },
  metricValue: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  timelineNotice: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.xs, marginBottom: spacing.sm },
  timelineRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  timelineDot: { width: 10, height: 10, borderRadius: shapes.pill, marginTop: spacing.xs },
  timelineContent: { flex: 1 },
  timelineTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold },
  stateTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.sm, textAlign: 'center' },
  stateText: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.md, textAlign: 'center' },
  retryButton: { marginTop: spacing.md, borderRadius: shapes.md, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  retryLabel: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
});
