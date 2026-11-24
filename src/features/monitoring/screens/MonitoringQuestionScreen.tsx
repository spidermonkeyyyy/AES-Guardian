import AppText from '../../../components/AppText';
import { useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { AppIcon } from '../../../components/AppIcon';
import { useMonitoringStore } from '../state/use-monitoring-store';
import MonitoringProgress from '../components/MonitoringProgress';
import QuestionRenderer from '../components/QuestionRenderer';
import { QuestionType, QuestionOption } from '../../../types/monitoring-question';

export default function MonitoringQuestionScreen() {
  const { colors } = useTheme();
  const {
    questions,
    currentStepIndex,
    answers,
    measurementSource,
    errorMessage,
    isLoading,
    saveAnswer,
    nextStep,
    previousStep,
    goToStep,
  } = useMonitoringStore();

  const [validationError, setValidationError] = useState<string | null>(null);

  const question = questions[currentStepIndex];
  if (!question) return null;

  const currentAnswer = question.type === QuestionType.numericInput
    ? (answers[question.id]?.value as number | null | undefined)
    : answers[question.id]?.value;

  const handleNext = () => {
    if (question.type === QuestionType.singleChoice) {
      if (question.required && !answers[question.id]) {
        setValidationError('Veuillez sélectionner une réponse pour continuer.');
        return;
      }
    }

    if (question.type === QuestionType.numericInput) {
      if (question.required && !answers[question.id]) {
        setValidationError('Veuillez entrer une valeur valide pour continuer.');
        return;
      }
    }

    setValidationError(null);

    if (currentStepIndex === questions.length - 1) {
      goToStep(currentStepIndex);
      return;
    }

    nextStep();
  };

  const handleBack = () => {
    if (currentStepIndex === 0) {
      return;
    }
    setValidationError(null);
    previousStep();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <AppText style={[styles.loadingText, { color: colors.mutedForeground }]}>Chargement du questionnaire...</AppText>
      </View>
    );
  }

  if (errorMessage && questions.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <AppText style={[styles.errorTitle, { color: colors.foreground }]}>Questionnaire indisponible</AppText>
        <AppText style={[styles.errorBody, { color: colors.mutedForeground }]}>{errorMessage}</AppText>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => useMonitoringStore.getState().loadQuestions()}>
          <AppText style={[styles.retryText, { color: colors.primaryForeground }]}>Réessayer</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const isLast = currentStepIndex === questions.length - 1;
  const isFirst = currentStepIndex === 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Retour">
          <AppIcon name="back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <MonitoringProgress currentStep={currentStepIndex + 1} totalSteps={questions.length} />
      </View>

      <AppText style={[styles.title, { color: colors.foreground }]}>{question.title}</AppText>
      <View style={styles.spacer} />

      <QuestionRenderer
        question={question}
        currentAnswer={currentAnswer}
        measurementSource={measurementSource}
        onAnswerChanged={(value) => {
          setValidationError(null);
          if (question.type === QuestionType.singleChoice) {
            const option = question.options.find((o) => o.id === value);
            if (option) {
              saveAnswer(question.id, { questionId: question.id, value, displayLabel: option.label });
            }
          } else {
            saveAnswer(question.id, { questionId: question.id, value, displayLabel: typeof value === 'number' ? `${value} %` : '' });
          }
        }}
      />

      {validationError ? <AppText style={[styles.validationError, { color: colors.destructive }]}>{validationError}</AppText> : null}

      <View style={styles.navRow}>
        {!isFirst && (
          <TouchableOpacity style={[styles.button, styles.secondary, { borderColor: colors.border }]} onPress={handleBack}>
            <AppText style={[styles.secondaryText, { color: colors.foreground }]}>Retour</AppText>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, !answers[question.id]?.value && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!answers[question.id]?.value}
        >
          <AppText style={[styles.buttonText, { color: colors.primaryForeground }]}>{isLast ? 'Vérifier mes réponses' : 'Suivant'}</AppText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing[6] },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20 },
  title: { fontFamily: typography.fontFamily.urbanist, fontSize: 22, fontWeight: typography.fontWeight.semibold, lineHeight: 28, marginBottom: spacing[2] },
  spacer: { height: spacing[6] },
  loadingText: { fontSize: typography.fontSize.md },
  errorTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing[3] },
  errorBody: { fontSize: typography.fontSize.md, marginBottom: spacing[4] },
  retryButton: { paddingVertical: spacing[3], paddingHorizontal: spacing[6], borderRadius: shapes.sm },
  retryText: { fontWeight: typography.fontWeight.semibold },
  validationError: { fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, marginTop: spacing[3] },
  navRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[6] },
  button: { flex: 1, paddingVertical: spacing[4], borderRadius: shapes.sm, alignItems: 'center', minHeight: 48 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontWeight: typography.fontWeight.semibold, fontFamily: typography.fontFamily.openSans },
  secondary: { backgroundColor: 'transparent', borderWidth: 1 },
  secondaryText: { fontWeight: typography.fontWeight.semibold, fontFamily: typography.fontFamily.openSans },
});
