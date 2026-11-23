import AppText from '../../../components/AppText';
import { View, StyleSheet } from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';

interface MonitoringProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function MonitoringProgress({ currentStep, totalSteps }: MonitoringProgressProps) {
  const { colors } = useTheme();
  const progress = totalSteps === 0 ? 0 : currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppText style={[styles.label, { color: colors.primary }]}>Suivi respiratoire</AppText>
        <AppText style={[styles.stepCount, { color: colors.mutedForeground }]}>
          Étape {currentStep} sur {totalSteps}
        </AppText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[1] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.openSans },
  stepCount: { fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.openSans },
  track: { height: 8, borderRadius: shapes.lg, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: shapes.lg },
});
