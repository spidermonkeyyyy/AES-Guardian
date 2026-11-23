import AppText from '../../../components/AppText';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, shapes, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { QuestionOption, QuestionType } from '../../../types/monitoring-question';

interface QuestionOptionCardProps {
  option: QuestionOption;
  isSelected: boolean;
  onTap: () => void;
}

export default function QuestionOptionCard({ option, isSelected, onTap }: QuestionOptionCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onTap}
      accessible
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${option.label}${option.description ? ': ' + option.description : ''}`}
      style={[
        styles.card,
        { borderColor: colors.border, backgroundColor: colors.card },
        isSelected && { borderColor: colors.primary, backgroundColor: colors.secondary },
      ]}
    >
      <View style={[
        styles.radio,
        { borderColor: colors.mutedForeground },
        isSelected && { borderColor: colors.primary, backgroundColor: colors.primary },
      ]}>
        {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primaryForeground }]} />}
      </View>
      <View style={styles.textContainer}>
        <AppText style={[styles.label, { color: colors.foreground }, isSelected && { color: colors.primary, fontWeight: typography.fontWeight.semibold }]}>
          {option.label}
        </AppText>
        {option.description ? <AppText style={[styles.description, { color: colors.mutedForeground }]}>{option.description}</AppText> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: shapes.md,
    borderWidth: 1,
    marginBottom: spacing[3],
    minHeight: 56,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  textContainer: { flex: 1 },
  label: { fontSize: typography.fontSize.md, fontFamily: typography.fontFamily.openSans },
  description: { fontSize: typography.fontSize.sm, marginTop: 2, lineHeight: 20 },
});
