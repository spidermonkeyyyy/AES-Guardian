import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useTreatmentStore } from '../state/use-treatment-store';
import { MedicationReminder, MedicationStatus } from '../../../../types/treatment';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function statusLabel(s: MedicationStatus): string {
  switch (s) {
    case 'upcoming':
      return 'À venir';
    case 'pending':
      return 'En attente';
    case 'confirmed':
      return 'Pris';
    case 'notConfirmed':
      return 'Non confirmé';
  }
}

const TreatmentScreen: React.FC<{ onNavigate?: (screen: string, params?: unknown) => void }> = ({ onNavigate }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const {
    todayReminders,
    adherenceRecords,
    errorMessage,
    confirmingId,
    pendingReminderCount,
    isAnyLoading,
    loadAll,
    confirmReminder,
  } = useTreatmentStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  if (isAnyLoading && todayReminders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="colors.primary" />
      </View>
    );
  }

  if (errorMessage && todayReminders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Impossible de charger le traitement</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadAll()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (todayReminders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Aucun traitement prévu aujourd&rsquo;hui</Text>
        <Text style={styles.emptyBody}>Votre planning de traitement sera affiché ici.</Text>
      </View>
    );
  }

  // Next reminder (not confirmed, sorted by time)
  const nextReminder = todayReminders
    .filter((r) => r.status !== 'confirmed')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const handleConfirm = (reminder: MedicationReminder) => {
    if (reminder.status === 'confirmed') return;
    Alert.alert(
      'Confirmer la prise ?',
      `${reminder.medicationLabel}\n\nHoraire: ${formatTime(reminder.scheduledAt)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => confirmReminder(reminder.id),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="colors.primary" />
      }
    >
      {/* Today summary card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aujourd&rsquo;hui</Text>
        <Text style={styles.cardSubtitle}>
          {pendingReminderCount} rappels restants
        </Text>
        {nextReminder && (
          <View style={styles.nextRow}>
            <Text style={styles.nextIcon}>🔔</Text>
            <Text style={styles.nextText}>
              Prochain rappel {formatTime(nextReminder.scheduledAt)}
            </Text>
          </View>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => onNavigate?.('adherenceHistory')}
          >
            <Text style={styles.buttonOutlineText}>Voir l&rsquo;observance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => onNavigate?.('inhalerEducation')}
          >
            <Text style={styles.buttonPrimaryText}>Technique d&rsquo;inhalation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reminders list */}
      {todayReminders.map((reminder) => (
        <TouchableOpacity
          key={reminder.id}
          style={styles.reminderCard}
          onPress={() => onNavigate?.('medicationDetail', { reminder })}
          activeOpacity={0.7}
        >
          <View style={styles.reminderHeader}>
            <Text style={styles.reminderLabel}>{reminder.medicationLabel}</Text>
            <Text style={styles.reminderTime}>{formatTime(reminder.scheduledAt)}</Text>
          </View>
          <Text style={styles.reminderStatus}>Statut: {statusLabel(reminder.status)}</Text>
          {reminder.status !== 'confirmed' && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={(e) => {
                e.stopPropagation();
                handleConfirm(reminder);
              }}
              disabled={confirmingId === reminder.id}
            >
              <Text style={styles.confirmButtonText}>
                {confirmingId === reminder.id ? 'Confirmation...' : 'Confirmer la prise'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}

      {/* Education hub link (preserved from Flutter TreatmentScreen) */}
      <TouchableOpacity
        style={styles.educationCard}
        onPress={() => onNavigate?.('education')}
      >
        <Text style={styles.educationTitle}>📚 Éducation</Text>
        <Text style={styles.educationSubtitle}>
          Rééducation, sevrage tabagique et tutoriels pour votre quotidien
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return {
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.primaryForeground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: { fontSize: 20, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 8 },
  nextRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  nextIcon: { fontSize: 16, marginRight: 6 },
  nextText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', marginTop: 12 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44, // accessibility: ≥44pt touch target
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginRight: 8,
  },
  buttonOutlineText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonPrimaryText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  reminderCard: {
    backgroundColor: colors.primaryForeground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reminderLabel: { fontSize: 16, fontWeight: '600', color: colors.primary },
  reminderTime: { fontSize: 16, fontWeight: '500', color: colors.primary },
  reminderStatus: { fontSize: 14, color: colors.mutedForeground, marginBottom: 8 },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  confirmButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  educationCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  educationTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  educationSubtitle: { fontSize: 14, color: colors.foreground },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  retryButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
}
}

export default TreatmentScreen;