import React, { useState } from 'react';
import { useSmokingCessationStore, CRAVING_LABELS, TRIGGER_LABELS } from '../state/use-smoking-cessation-store';
import { CravingIntensity, SmokingTrigger } from '../../../../types/education';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

const CRAVING_OPTIONS: CravingIntensity[] = ['low', 'moderate', 'high'];
const TRIGGER_OPTIONS: SmokingTrigger[] = ['stress', 'habit', 'social', 'emotion', 'other'];

const SmokingEntryScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { addEntry } = useSmokingCessationStore();
  const [cigarettes, setCigarettes] = useState('0');
  const [craving, setCraving] = useState<CravingIntensity>('moderate');
  const [trigger, setTrigger] = useState<SmokingTrigger>('habit');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const cig = parseInt(cigarettes, 10);
    if (isNaN(cig) || cig < 0) {
      Alert.alert('Valeur invalide', 'Le nombre de cigarettes doit être ≥ 0.');
      return;
    }
    setSaving(true);
    await addEntry({
      date: new Date().toISOString(),
      cigarettesConsumed: cig,
      cravingIntensity: craving,
      trigger,
      personalNote: notes.trim() || undefined,
    });
    setSaving(false);
    onBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Nouvelle entrée</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre de cigarettes</Text>
        <TextInput
          style={styles.input}
          value={cigarettes}
          onChangeText={setCigarettes}
          keyboardType="numeric"
          placeholder="0"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Intensité de l'envie</Text>
        <View style={styles.optionRow}>
          {CRAVING_OPTIONS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.option, craving === c && styles.optionSelected]}
              onPress={() => setCraving(c)}
            >
              <Text style={[styles.optionText, craving === c && styles.optionTextSelected]}>{CRAVING_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Déclencheur</Text>
        <View style={styles.optionGrid}>
          {TRIGGER_OPTIONS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.option, trigger === t && styles.optionSelected]}
              onPress={() => setTrigger(t)}
            >
              <Text style={[styles.optionText, trigger === t && styles.optionTextSelected]}>{TRIGGER_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Notes personnelles (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Comment vous sentiez-vous ?"
          multiline
        />
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={onSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  header: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  card: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  input: { backgroundColor: colors.background, borderRadius: 8, padding: 12, fontSize: 16 },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4, minHeight: 44, justifyContent: 'center' },
  optionSelected: { backgroundColor: colors.primary },
  optionText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  optionTextSelected: { color: colors.primaryForeground },
  saveButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonDisabled: { backgroundColor: colors.mutedForeground },
  saveButtonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  cancelButton: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
});
}

export default SmokingEntryScreen;