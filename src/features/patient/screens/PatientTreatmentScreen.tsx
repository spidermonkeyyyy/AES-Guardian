import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppHeader, AppCard, RespiBadge, AppButton } from '../../../components';
import { useTheme } from '../../../theme/ThemeContext';

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

export default function PatientTreatmentScreen() {
  const { colors } = useTheme();
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: '1', name: 'Inhalateur Spiriva', dosage: '2 bouffées', time: '09:00', taken: true },
    { id: '2', name: 'Ventoline (au besoin)', dosage: '1 to 2 bouffées', time: 'En cas de crise', taken: false },
    { id: '3', name: 'Prednisolone 20mg', dosage: '1 comprimé', time: '20:00', taken: false },
  ]);

  const toggleMedication = (id: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m))
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mes Traitements" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Prescribed Medications */}
        <View style={styles.sectionHeader}>
          <Icon name="package" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Prescriptions du jour</Text>
        </View>

        {medications.map((med) => (
          <AppCard key={med.id} variant="outlined" style={styles.medCard}>
            <View style={styles.medRow}>
              <View style={[styles.medIconBox, { backgroundColor: colors.secondary }]}>
                <Icon name="disc" size={24} color={med.taken ? colors.primary : colors.warning} />
              </View>
              <View style={styles.medInfo}>
                <Text style={[styles.medName, { color: colors.foreground }]}>{med.name}</Text>
                <Text style={[styles.medDosage, { color: colors.mutedForeground }]}>{med.dosage} · {med.time}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.checkCircle,
                  { borderColor: med.taken ? colors.primary : colors.border },
                  med.taken && { backgroundColor: colors.primary },
                ]}
                onPress={() => toggleMedication(med.id)}
              >
                <Icon name="check" size={16} color={med.taken ? colors.primaryForeground : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </AppCard>
        ))}

        {/* Rehabilitation Exercises */}
        <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
          <Icon name="activity" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exercices de réhabilitation</Text>
        </View>

        <AppCard variant="elevated" style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>Respiration lèvre pincée</Text>
            <RespiBadge label="10 min" variant="info" />
          </View>
          <Text style={[styles.exerciseDesc, { color: colors.mutedForeground }]}>
            Inspirez lentement par le nez pendant 2 secondes, puis expirez doucement par les lèvres pincées pendant 4 secondes.
          </Text>
          <AppButton
            title="Démarrer la session"
            onPress={() => {}}
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </AppCard>

        <AppCard variant="elevated" style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>Respiration diaphragmique</Text>
            <RespiBadge label="5 min" variant="info" />
          </View>
          <Text style={[styles.exerciseDesc, { color: colors.mutedForeground }]}>
            Main sur le ventre, inspirez en gonflant l'abdomen sans faire monter les épaules.
          </Text>
          <AppButton
            title="Démarrer la session"
            onPress={() => {}}
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  sectionTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
  medCard: { padding: spacing.md },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  medIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  medInfo: { flex: 1 },
  medName: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  medDosage: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.xs, marginTop: 2 },
  checkCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkCircleTaken: {},
  exerciseCard: { padding: spacing.md, gap: spacing.xs },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.bold },
  exerciseDesc: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.xs, lineHeight: 18 },
});
