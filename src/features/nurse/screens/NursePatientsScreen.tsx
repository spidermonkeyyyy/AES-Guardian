import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppCard, RespiBadge, AppHeader, AppInput } from '../../../components';
import { useNursePatientsStore } from '../patients/state/use-nurse-patients-store';
import { PatientRosterFilter } from '../../../types/patient';
import { useTheme } from '../../../theme/ThemeContext';

export default function NursePatientsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const {
    isLoading,
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

  const filteredPatients = patients.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.fullName?.toLowerCase().includes(q);
      const matchCond = p.condition?.toLowerCase().includes(q);
      if (!matchName && !matchCond) return false;
    }
    if (filter === 'toReview') return p.hasNewSubmission || p.priority !== 'informational';
    if (filter === 'followed') return p.lastSubmissionAt !== null;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Patients assignés" subtitle={`${filteredPatients.length} patient(s)`} />

      <View style={[styles.searchSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <AppInput
          placeholder="Rechercher un patient, pathologie..."
          value={searchQuery}
          onChangeText={searchPatients}
          leftIcon={<Icon name="search" size={20} color={colors.mutedForeground} />}
          containerStyle={styles.searchInput}
        />

        <View style={styles.filterRow}>
          {(['all', 'toReview', 'followed'] as const).map((f: PatientRosterFilter) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                { backgroundColor: colors.surfaceVariant },
                filter === f && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.mutedForeground },
                  filter === f && { color: colors.primaryForeground, fontWeight: typography.fontWeight.semibold },
                ]}
              >
                {f === 'all' ? 'Tous' : f === 'toReview' ? 'À revoir' : 'Suivis'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
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
                    {item.fullName?.substring(0, 2).toUpperCase() || 'PT'}
                  </Text>
                </View>
                <View style={styles.patientMainInfo}>
                  <Text style={[styles.patientName, { color: colors.foreground }]}>{item.fullName}</Text>
                  <Text style={[styles.patientDetails, { color: colors.mutedForeground }]}>
                    {item.condition || 'BPCO Sévère'} • {item.classification || 'GOLD 3'}
                  </Text>
                </View>
                <RespiBadge
                  label={item.hasNewSubmission ? 'Nouveau' : 'Stable'}
                  variant={item.hasNewSubmission ? 'warning' : 'success'}
                />
              </View>

              <View style={[styles.vitalsRow, { backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.vitalBox}>
                  <Text style={[styles.vitalLabel, { color: colors.mutedForeground }]}>SpO₂ récent</Text>
                  <Text style={[styles.vitalValue, { color: colors.foreground }]}>
                    {item.latestSubmission?.spo2Value != null ? `${item.latestSubmission.spo2Value} %` : '96 %'}
                  </Text>
                </View>
                <View style={styles.vitalBox}>
                  <Text style={[styles.vitalLabel, { color: colors.mutedForeground }]}>Dernier suivi</Text>
                  <Text style={[styles.vitalValue, { color: colors.foreground }]}>
                    {item.lastSubmissionAt ? new Date(item.lastSubmissionAt).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                  </Text>
                </View>
                <View style={styles.vitalBox}>
                  <Text style={[styles.vitalLabel, { color: colors.mutedForeground }]}>Priorité</Text>
                  <Text style={[styles.vitalValue, { color: item.priority === 'high' ? colors.destructive : colors.primary }]}>
                    {item.priority === 'high' ? 'Élevée' : item.priority === 'reviewRequired' ? 'Moyenne' : 'Basse'}
                  </Text>
                </View>
              </View>
            </AppCard>
          )}
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
  searchInput: {
    marginBottom: spacing.xs,
  },
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
  listContent: {
    padding: spacing.screenPadding,
    gap: spacing.md,
  },
  patientCard: {
    padding: spacing.md,
  },
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
    marginLeft: spacing.md,
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
  vitalBox: {
    alignItems: 'center',
  },
  vitalLabel: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: 11,
  },
  vitalValue: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
});
