import AppText from '../../../components/AppText';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import Icon from '../../../components/AppIcon';
import { useMonitoringStore } from '../state/use-monitoring-store';

export default function MonitoringResultScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { evaluationResult, reset } = useMonitoringStore();

  const handleHome = () => {
    reset();
    navigation?.navigate('patientHome');
  };

  const isNormal = evaluationResult?.status === 'normal';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Icon name={isNormal ? 'check-circle' : 'info'} size={48} color={colors.primary} />
      <AppText style={[styles.title, { color: colors.foreground }]}>{isNormal ? 'Suivi envoyé' : 'Suivi transmis'}</AppText>

      <View style={[
        styles.messageBox,
        isNormal
          ? { backgroundColor: colors.primary + '14', borderColor: colors.primary + '33' }
          : { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}>
        <AppText style={[styles.messageText, { color: colors.foreground }]}>{evaluationResult?.patientMessage}</AppText>
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleHome}>
        <AppText style={[styles.buttonText, { color: colors.primaryForeground }]}>Retour à l'accueil</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6], gap: spacing[6] },
  icon: { fontSize: 64, marginBottom: spacing[4] },
  title: { fontFamily: typography.fontFamily.urbanist, fontSize: 24, fontWeight: typography.fontWeight.bold, textAlign: 'center' },
  messageBox: { padding: spacing[5], borderRadius: shapes.lg, borderWidth: 1, width: '100%' },
  messageText: { fontSize: typography.fontSize.md, textAlign: 'center', lineHeight: 22 },
  button: { paddingVertical: spacing[4], paddingHorizontal: spacing[8], borderRadius: shapes.sm, minWidth: 200, alignItems: 'center' },
  buttonText: { fontWeight: typography.fontWeight.semibold, fontFamily: typography.fontFamily.openSans },
});
