import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { useTreatmentStore } from '../state/use-treatment-store';
import { MedicationReminder, MedicationStatus } from '../../../../types/treatment';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function statusText(s: MedicationStatus): string {
  switch (s) {
    case 'upcoming': return 'À venir';
    case 'pending': return 'En attente';
    case 'confirmed': return 'Pris';
    case 'notConfirmed': return 'Non confirmé';
  }
  }

interface Props {
  reminder: MedicationReminder;
  onNavigate?: (screen: string) => void;
}

const MedicationDetailScreen: React.FC<Props> = ({ reminder, onNavigate }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { todayReminders, confirmingId, confirmReminder } = useTreatmentStore();
  // Get the current reminder from state (may be updated post-confirm)
  const current = todayReminders.find((r) => r.id === reminder.id) ?? reminder;

  const onConfirm = () => {
    Alert.alert(
      'Confirmer la prise ?',
      `${current.medicationLabel}\n\nHoraire: ${formatTime(current.scheduledAt)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => confirmReminder(current.id) },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{current.medicationLabel}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Horaire</Text>
        <Text style={styles.infoValue}>{formatTime(current.scheduledAt)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Fréquence</Text>
        <Text style={styles.infoValue}>{current.frequency}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Statut</Text>
        <Text style={styles.infoValue}>{statusText(current.status)}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          current.status === 'confirmed' && styles.confirmButtonDisabled,
        ]}
        onPress={onConfirm}
        disabled={current.status === 'confirmed' || confirmingId === current.id}
      >
        <Text style={styles.confirmButtonText}>
          {confirmingId === current.id
            ? 'Confirmation...'
            : current.status === 'confirmed'
              ? 'Prise déjà confirmée'
              : 'Confirmer la prise'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.educationLink}
        onPress={() => onNavigate?.('inhalerEducation')}
      >
        <Text style={styles.educationLinkText}>📖 Voir la technique d&rsquo;inhalation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 24 },
  infoRow: {
    backgroundColor: colors.primaryForeground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 14, color: colors.mutedForeground, fontWeight: '500' },
  infoValue: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 48,
    justifyContent: 'center',
  },
  confirmButtonDisabled: { backgroundColor: colors.mutedForeground },
  confirmButtonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  educationLink: { marginTop: 16, alignItems: 'center', padding: 12 },
  educationLinkText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
});
}

export default MedicationDetailScreen;