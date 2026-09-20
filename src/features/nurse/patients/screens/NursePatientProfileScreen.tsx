import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { useNursePatientsStore } from '../state/use-nurse-patients-store';
import { spacing, typography } from '../../../../theme/tokens';
import { useTheme } from '../../../../theme/ThemeContext';
import { NurseTabParamList } from '../../../../navigation/routes';
import { PatientTimelineEvent } from '../../../../types/patient';

type NursePatientProfileRoute = RouteProp<NurseTabParamList, 'patientDetail'>;

type Props = {
  route: NursePatientProfileRoute;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffDays > 0) return `${diffDays}j`;
  if (diffHours > 0) return `${diffHours}h`;
  return `${diffMinutes}min`;
}

export default function NursePatientProfileScreen({ route }: Props) {
  const { colors } = useTheme();
  const { patientId } = route.params;
  const { selectedPatient, isLoading, errorMessage, selectPatient } = useNursePatientsStore();

  useEffect(() => {
  const { colors } = useTheme();
    selectPatient(patientId);
  }, [patientId, selectPatient]);

  if (isLoading && !selectedPatient) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateText, { color: colors.mutedForeground }]}>Chargement…</Text>
      </View>
    );
  }

  if (errorMessage && !selectedPatient) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.foreground }]}>Profil introuvable</Text>
        <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{errorMessage}</Text>
        <TouchableOpacity onPress={() => selectPatient(patientId)} accessibilityRole="button" style={[styles.retryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.retryLabel, { color: colors.primaryForeground }]}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const patient = selectedPatient;
  if (!patient) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateText, { color: colors.mutedForeground }]}>Patient introuvable.</Text>
      </View>
    );
  }

  const latest = patient.latestSubmission;
  const timeline = patient.timeline;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.patientName, { color: colors.foreground }]}>{patient.fullName}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{patient.condition} · {patient.classification}</Text>
        <View style={styles.badges}>
          <View style={[styles.priorityBadge, { backgroundColor: colors.border }]}>
            <Text style={[styles.priorityText, { color: colors.foreground }]}>{patient.priority}</Text>
          </View>
          {patient.hasNewSubmission ? (
            <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.newBadgeText, { color: colors.primaryForeground }]}>Nouveau suivi</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dernier suivi</Text>
        <Text style={[styles.sectionBody, { color: colors.foreground }]}>{latest ? `Envoyé il y a ${formatDate(latest.timestamp)}` : 'Aucun suivi disponible'}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dernière observation</Text>
        <Text style={[styles.sectionBody, { color: colors.foreground }]}>{patient.latestObservation ?? 'Pas d\'observation récente.'}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Données</Text>
        {latest ? (
          <View style={styles.metricList}>
            <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.foreground }]}>SpO₂</Text>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{latest.spo2Value != null ? `${latest.spo2Value}%` : '—'}</Text>
            </View>
            <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.foreground }]}>Dyspnée</Text>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{latest.answers.dyspnea?.displayLabel ?? '—'}</Text>
            </View>
            <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.foreground }]}>Toux</Text>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{latest.answers.cough?.displayLabel ?? '—'}</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.sectionBody, { color: colors.foreground }]}>Aucune mesure disponible</Text>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Éducation</Text>
        <Text style={[styles.sectionBody, { color: colors.foreground }, { marginTop: spacing[2] }]}>Rééducation respiratoire: programme disponible</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Historique</Text>
        {timeline.length === 0 ? (
          <Text style={[styles.sectionBody, { color: colors.foreground }]}>Aucun événement disponible.</Text>
        ) : (
          <View style={styles.timeline}>
            {timeline.map((event: PatientTimelineEvent, index: number) => (
              <View key={index} style={styles.timelineRow}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                <View style={[styles.timelineContent, { borderLeftColor: colors.border }]}>
                  <Text style={[styles.timelineTitle, { color: colors.foreground }]}>{event.title}</Text>
                  <Text style={[styles.timelineDescription, { color: colors.mutedForeground }]}>{event.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing[6], paddingBottom: spacing[10] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  headerCard: { borderRadius: spacing[4], borderWidth: 1, padding: spacing[6], marginBottom: spacing[4] },
  patientName: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold },
  meta: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, marginTop: spacing[1] },
  badges: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] },
  priorityBadge: { borderRadius: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  priorityText: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, textTransform: 'uppercase' },
  newBadge: { borderRadius: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  newBadgeText: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
  section: { borderRadius: spacing[4], borderWidth: 1, padding: spacing[5], marginBottom: spacing[3] },
  sectionTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] },
  sectionBody: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md },
  metricList: { gap: spacing[2] },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing[2], borderBottomWidth: StyleSheet.hairlineWidth },
  metricLabel: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md },
  metricValue: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
  timeline: { gap: spacing[3] },
  timelineRow: { flexDirection: 'row', gap: spacing[3] },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: spacing[2] },
  timelineContent: { flex: 1, paddingBottom: spacing[3], borderLeftWidth: StyleSheet.hairlineWidth, paddingLeft: spacing[3] },
  timelineTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
  timelineDescription: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.sm, marginTop: spacing[1] },
  stateTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, textAlign: 'center', marginBottom: spacing[2] },
  stateText: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, textAlign: 'center' },
  retryButton: { marginTop: spacing[3], borderRadius: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[3], minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  retryLabel: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
});
