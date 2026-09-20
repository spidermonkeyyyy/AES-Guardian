import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { evaluateSubmission } from '../../../utils/clinical/rule-engine';
import { MeasurementSource } from '../../../types/monitoring';

interface SpO2InputProps {
  initialValue: number | null | undefined;
  measurementSource: MeasurementSource;
  onChanged: (value: number | null) => void;
}

export default function SpO2Input({ initialValue, measurementSource, onChanged }: SpO2InputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(initialValue !== null && initialValue !== undefined ? String(initialValue) : '');
  const [error, setError] = useState<string | null>(null);

  const validate = (raw: string) => {
    if (raw.trim().length === 0) {
      setError('Veuillez saisir une valeur de SpO₂');
      onChanged(null);
      return;
    }
    const val = Number(raw.trim());
    if (!Number.isFinite(val) || val < 70 || val > 100) {
      setError('Veuillez entrer une valeur valide entre 70% et 100%');
      onChanged(null);
      return;
    }
    setError(null);
    onChanged(val);
  };

  const step = (delta: number) => {
    const current = Number.isFinite(Number(text)) ? Number(text) : 95;
    const next = Math.max(70, Math.min(100, current + delta));
    const nextStr = String(next);
    setText(nextStr);
    validate(nextStr);
  };

  return (
    <View>
      <View style={[styles.badge, { borderColor: colors.primary + '33', backgroundColor: colors.primary + '14' }]}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>
          {measurementSource === 'bluetooth' ? 'Mesure Oxymètre Bluetooth' : 'Mode de saisie : Manuelle'}
        </Text>
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => step(-1)}
          style={[styles.stepperButton, { backgroundColor: colors.secondary }]}
          accessibilityRole="button"
          accessibilityLabel="Diminuer la saturation"
        >
          <Text style={[styles.stepperText, { color: colors.foreground }]}>−</Text>
        </TouchableOpacity>

        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            value={text}
            onChangeText={(t) => { setText(t); validate(t); }}
            keyboardType="numeric"
            textAlign="center"
            style={[styles.input, { color: colors.foreground }]}
            accessibilityLabel="Valeur de SpO₂ en pourcentage"
          />
          <Text style={[styles.suffix, { color: colors.mutedForeground }]}>%</Text>
        </View>

        <TouchableOpacity
          onPress={() => step(1)}
          style={[styles.stepperButton, { backgroundColor: colors.secondary }]}
          accessibilityRole="button"
          accessibilityLabel="Augmenter la saturation"
        >
          <Text style={[styles.stepperText, { color: colors.foreground }]}>+</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

      <TouchableOpacity
        onPress={() => { setText(''); setError(null); onChanged(null); }}
        style={styles.noMeasure}
        accessibilityRole="button"
        accessibilityLabel="Je n'ai pas de mesure pour le moment"
      >
        <Text style={[styles.noMeasureText, { color: colors.mutedForeground }]}>Je n'ai pas de mesure pour le moment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: shapes.lg,
    borderWidth: 1,
    marginBottom: spacing[6],
  },
  badgeText: { fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.openSans },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  stepperButton: { width: 48, height: 48, borderRadius: shapes.sm, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 24, fontWeight: typography.fontWeight.medium },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: 120, borderWidth: 1, borderRadius: shapes.sm, paddingHorizontal: spacing[2] },
  input: { flex: 1, fontSize: 32, fontWeight: typography.fontWeight.bold, textAlign: 'center', fontFamily: typography.fontFamily.urbanist, paddingVertical: spacing[2] },
  suffix: { fontSize: typography.fontSize.lg, marginLeft: spacing[1] },
  error: { fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, textAlign: 'center', marginTop: spacing[3] },
  noMeasure: { marginTop: spacing[4], alignSelf: 'center' },
  noMeasureText: { fontSize: typography.fontSize.sm },
});
