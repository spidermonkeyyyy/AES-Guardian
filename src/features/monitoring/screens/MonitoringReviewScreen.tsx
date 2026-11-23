import AppText from '../../../components/AppText';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { useMonitoringStore } from '../state/use-monitoring-store';
import { QuestionType } from '../../../types/monitoring-question';

export default function MonitoringReviewScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { questions, answers, isSubmitting, errorMessage, submitMonitoring } = useMonitoringStore();

  const handleSubmit = async () => {
    const success = await submitMonitoring('patient-1');
    if (success && navigation) {
      navigation.navigate('monitorResult');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <AppText style={[styles.title, { color: colors.foreground }]}>Vérification de vos réponses</AppText>
      <AppText style={[styles.subtitle, { color: colors.mutedForeground }]}>Vérifiez vos réponses avant d'envoyer.</AppText>

      {questions.map((question, index) => {
        const answer = answers[question.id];
        return (
          <View key={question.id} style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <AppText style={[styles.questionTitle, { color: colors.foreground }]}>{question.title}</AppText>
            <View style={styles.answerRow}>
              <AppText style={[styles.answerLabel, { color: colors.mutedForeground }]}>Réponse:</AppText>
              <AppText style={[styles.answerValue, { color: colors.foreground }]}>
                {answer?.displayLabel || (
                  <AppText style={[styles.noAnswer, { color: colors.destructive }]}>Aucune réponse</AppText>
                )}
              </AppText>
            </View>
          </View>
        );
      })}

      {errorMessage ? (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '33' }]}>
          <AppText style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</AppText>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <AppText style={[styles.submitText, { color: colors.primaryForeground }]}>{isSubmitting ? 'Envoi en cours...' : 'Envoyer mon suivi'}</AppText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing[6] },
  title: { fontFamily: typography.fontFamily.urbanist, fontSize: 22, fontWeight: typography.fontWeight.bold, marginBottom: spacing[2] },
  subtitle: { fontSize: typography.fontSize.md, marginBottom: spacing[6] },
  summaryCard: {
    padding: spacing[4],
    borderRadius: shapes.md,
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  questionTitle: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[2] },
  answerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  answerLabel: { fontSize: typography.fontSize.sm, width: 80 },
  answerValue: { flex: 1, fontSize: typography.fontSize.md },
  noAnswer: { fontStyle: 'italic' },
  errorBox: { padding: spacing[4], borderRadius: shapes.sm, borderWidth: 1, marginBottom: spacing[4] },
  errorText: { fontSize: typography.fontSize.sm },
  submitButton: { paddingVertical: spacing[4], borderRadius: shapes.sm, alignItems: 'center', marginTop: spacing[6], minHeight: 48 },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { fontWeight: typography.fontWeight.semibold, fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.md },
});
