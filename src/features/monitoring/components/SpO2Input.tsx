import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { MeasurementSource } from '../../../types/monitoring';
import { useLocale, t } from '../../../localization';

interface SpO2InputProps {
  initialValue: number | null | undefined;
  measurementSource: MeasurementSource;
  onChanged: (value: number | null) => void;
}

export default function SpO2Input({ initialValue, measurementSource, onChanged }: SpO2InputProps) {
  const { colors } = useTheme();
  const locale = useLocale();
  const [text, setText] = useState(initialValue !== null && initialValue !== undefined ? String(initialValue) : '');
  const [error, setError] = useState<string | null>(null);
  const hasText = text.trim().length > 0;

  const validate = (raw: string) => {
    if (raw.trim().length === 0) {
      setError(t('monitoring.spo2.errorRequired', locale));
      onChanged(null);
      return;
    }
    const val = Number(raw.trim());
    if (!Number.isFinite(val) || val < 70 || val > 100) {
      setError(t('monitoring.spo2.errorRange', locale));
      onChanged(null);
      return;
    }
    setError(null);
    onChanged(val);
  };

  const step = (delta: number) => {
    const current = Number(text);
    if (!text.trim() || !Number.isFinite(current)) return;
    const next = Math.max(70, Math.min(100, current + delta));
    const nextStr = String(next);
    setText(nextStr);
    validate(nextStr);
  };

  return (
    <View>
      <View style={[styles.badge, { borderColor: colors.primary + '33', backgroundColor: colors.primary + '14' }]}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>
          {t(
            measurementSource === 'bluetooth'
              ? 'monitoring.spo2.modeBluetooth'
              : 'monitoring.spo2.modeManual',
            locale,
          )}
        </Text>
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => step(-1)}
          style={[styles.stepperButton, { backgroundColor: colors.secondary }, !hasText && styles.disabled]}
          disabled={!hasText}
          accessibilityRole="button"
          accessibilityLabel={t('monitoring.spo2.decrease', locale)}
        >
          <Text style={[styles.stepperText, { color: colors.foreground }]}>−</Text>
        </TouchableOpacity>

        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            value={text}
            onChangeText={(t) => { setText(t); validate(t); }}
            keyboardType="numeric"
            placeholder={t('monitoring.spo2.placeholder', locale)}
            placeholderTextColor={colors.mutedForeground}
            textAlign="center"
            style={[styles.input, { color: colors.foreground }]}
            accessibilityLabel={t('monitoring.spo2.accessibility', locale)}
          />
          <Text style={[styles.suffix, { color: colors.mutedForeground }]}>%</Text>
        </View>

        <TouchableOpacity
          onPress={() => step(1)}
          style={[styles.stepperButton, { backgroundColor: colors.secondary }, !hasText && styles.disabled]}
          disabled={!hasText}
          accessibilityRole="button"
          accessibilityLabel={t('monitoring.spo2.increase', locale)}
        >
          <Text style={[styles.stepperText, { color: colors.foreground }]}>+</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text
          style={[styles.error, { color: colors.destructive }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={() => { setText(''); setError(null); onChanged(null); }}
        style={styles.noMeasure}
        accessibilityRole="button"
        accessibilityLabel={t('monitoring.spo2.noMeasurement', locale)}
      >
        <Text style={[styles.noMeasureText, { color: colors.mutedForeground }]}>
          {t('monitoring.spo2.noMeasurement', locale)}
        </Text>
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
  disabled: { opacity: 0.45 },
  stepperText: { fontSize: 24, fontWeight: typography.fontWeight.medium },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: 120, borderWidth: 1, borderRadius: shapes.sm, paddingHorizontal: spacing[2] },
  input: { flex: 1, fontSize: 32, fontWeight: typography.fontWeight.bold, textAlign: 'center', fontFamily: typography.fontFamily.urbanist, paddingVertical: spacing[2] },
  suffix: { fontSize: typography.fontSize.lg, marginLeft: spacing[1] },
  error: { fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, textAlign: 'center', marginTop: spacing[3] },
  noMeasure: { marginTop: spacing[4], alignSelf: 'center' },
  noMeasureText: { fontSize: typography.fontSize.sm },
});
