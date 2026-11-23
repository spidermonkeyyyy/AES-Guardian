import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useNursePatientsStore, matchesPatientRosterFilter } from '../state/use-nurse-patients-store';
import { useTheme } from '../../../../theme/ThemeContext';
import { PatientRosterFilter } from '../../../../types/patient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NurseTabParamList } from '../../../../navigation/routes';
import { Patient, PatientTimelineEvent } from '../../../../types/patient';
import { spacing, typography, shapes } from '../../../../theme/tokens';

type Navigation = NativeStackNavigationProp<NurseTabParamList, 'patients'>;

const FILTERS: { label: string; value: PatientRosterFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'À revoir', value: 'toReview' },
  { label: 'Suivis', value: 'followed' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return 'non disponible';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffDays > 0) return `Il y a ${diffDays}j`;
  if (diffHours > 0) return `Il y a ${diffHours}h`;
  return `Il y a ${diffMinutes}min`;
}


export default function NursePatientsScreen() {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isLoading, errorMessage, patients, filter, searchQuery, loadPatients, searchPatients, setFilter } =
    useNursePatientsStore();

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const visiblePatients = patients.filter((patient) => matchesPatientRosterFilter(patient, filter));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Patients</Text>

      <TextInput
        style={styles.search}
        placeholder="Rechercher un patient"
        placeholderTextColor={colors.mutedForeground}
        value={searchQuery}
        onChangeText={searchPatients}
        accessibilityLabel="Rechercher un patient"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((item) => {
          const selected = filter === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => setFilter(item.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={item.label}
              style={[styles.filterChip, selected ? styles.filterChipSelected : styles.filterChipUnselected]}
            >
              <Text style={[styles.filterLabel, selected ? styles.filterLabelSelected : styles.filterLabelUnselected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>Chargement…</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={loadPatients} style={styles.retryButton}>
            <Text style={styles.retryLabel}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : visiblePatients.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>
            {filter === 'all' ? 'Aucun patient trouvé' : `Aucun patient « ${FILTERS.find((f) => f.value === filter)?.label } »`}
          </Text>
          <Text style={styles.stateText}>
            {filter === 'all' ? 'Essayez une autre recherche.' : 'Aucun patient ne correspond à ce filtre.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visiblePatients.map((patient: Patient) => (
            <TouchableOpacity
              key={patient.id}
              onPress={() => navigation.navigate('patientDetail', { patientId: patient.id })}
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir le profil de ${patient.fullName}`}
              style={styles.card}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(patient.fullName)}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patientName}>{patient.fullName}</Text>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>{patient.priority}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{patient.condition} · {patient.classification}</Text>
                <Text style={styles.timestamp}>{formatRelativeDate(patient.lastSubmissionAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing[6], paddingBottom: spacing[8] },
  title: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: colors.foreground, marginBottom: spacing[4] },
  search: {
    backgroundColor: colors.card,
    color: colors.foreground,
    borderRadius: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    marginBottom: spacing[3],
  },
  filterRow: { gap: spacing[2], marginBottom: spacing[4] },
  filterChip: { borderRadius: spacing[10], paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderWidth: 1 },
  filterChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipUnselected: { backgroundColor: colors.card, borderColor: colors.border },
  filterLabel: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium },
  filterLabelSelected: { color: colors.primaryForeground },
  filterLabelUnselected: { color: colors.foreground },
  list: { gap: spacing[3] },
  card: {
    flexDirection: 'row',
    gap: spacing[4],
    backgroundColor: colors.card,
    borderRadius: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    minHeight: 72,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryForeground, fontFamily: typography.fontFamily.urbanist, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] },
  patientName: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.foreground },
  priorityBadge: { borderRadius: spacing[2], paddingHorizontal: spacing[2], paddingVertical: spacing[1], backgroundColor: colors.border },
  priorityText: { color: colors.foreground, fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, textTransform: 'uppercase' },
  meta: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.sm, color: colors.mutedForeground, marginBottom: spacing[1] },
  timestamp: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.xs, color: colors.mutedForeground },
  stateContainer: { paddingVertical: spacing[8], alignItems: 'center', gap: spacing[3] },
  stateTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.foreground, textAlign: 'center' },
  stateText: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, color: colors.mutedForeground, textAlign: 'center' },
  retryButton: { marginTop: spacing[3], backgroundColor: colors.primary, borderRadius: spacing[3], paddingHorizontal: spacing[4], paddingVertical: spacing[2], minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  retryLabel: { color: colors.primaryForeground, fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold },
});
}
