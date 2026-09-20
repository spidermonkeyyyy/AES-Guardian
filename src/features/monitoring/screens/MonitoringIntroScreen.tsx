import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppHeader, AppButton, AppCard } from '../../../components';
import { useMonitoringStore } from '../state/use-monitoring-store';
import { MONITORING_QUESTIONS } from '../data/questions';
import { QuestionType, QuestionOption } from '../../../types/monitoring-question';
import { evaluateSubmission } from '../../../utils/clinical/rule-engine';
import { useTheme } from '../../../theme/ThemeContext';

export default function MonitoringIntroScreen({ navigation }: { navigation: any }) {
  const { colors, isDark } = useTheme();
  // -1 = Intro Landing Screen, 0..N = Questions
  const [step, setStep] = useState<number>(-1);
  const [answers, setAnswers] = useState<Record<string, { value: string | number | null; displayLabel: string }>>({});
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  const reset = () => {
    setStep(-1);
    setAnswers({});
    setResult(null);
    useMonitoringStore.getState().reset();
  };

  const total = MONITORING_QUESTIONS.length;
  const current = step >= 0 ? MONITORING_QUESTIONS[step] : null;

  // Render Result Screen
  if (result) {
    return (
      <View style={[styles.fullContainer, { backgroundColor: colors.background }]}>
        <AppHeader title="Résultat du Suivi" />
        <View style={styles.centerContent}>
          <View style={[styles.resultIconCircle, { backgroundColor: result.status === 'review_required' ? colors.warningBackground : colors.secondary }]}>
            <Icon
              name={result.status === 'review_required' ? 'alert-circle' : 'check-circle'}
              size={48}
              color={result.status === 'review_required' ? colors.warning : colors.primary}
            />
          </View>
          <Text style={[styles.resultTitle, { color: colors.foreground }]}>
            {result.status === 'review_required' ? 'Formulaire transmis à l\'infirmier(e)' : 'Suivi quotidien enregistré'}
          </Text>
          <Text style={[styles.resultMessage, { color: colors.mutedForeground }]}>{result.message}</Text>
          <AppButton
            title="Retour à l'accueil"
            onPress={() => {
              reset();
              navigation.navigate('patientHome');
            }}
            variant="primary"
            fullWidth
          />
        </View>
      </View>
    );
  }

  // Render Intro Landing Screen
  if (step === -1) {
    return (
      <View style={[styles.fullContainer, { backgroundColor: colors.background }]}>
        <AppHeader title="Suivi quotidien" />
        <ScrollView contentContainerStyle={styles.introContent}>
          <View style={styles.introHero}>
            <View style={[styles.heroIconCircle, { backgroundColor: colors.secondary }]}>
              <Icon name="clipboard" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.introTitle, { color: colors.foreground }]}>Questionnaire de suivi</Text>
            <Text style={[styles.introSubtitle, { color: colors.mutedForeground }]}>
              Renseignez vos symptômes et constantes du jour. Cela prend environ 3 minutes et permet à votre équipe soignante de vous suivre à distance.
            </Text>
          </View>

          <AppCard variant="flat" style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Icon name="clock" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>Durée estimée : 2 - 3 minutes</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="shield-check" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.foreground }]}>Données de santé sécurisées</Text>
            </View>
          </AppCard>

          <View style={styles.bottomCta}>
            <AppButton
              title="Commencer le questionnaire"
              onPress={() => setStep(0)}
              variant="primary"
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Render Question Steps
  return (
    <View style={[styles.fullContainer, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Suivi quotidien"
        showBack
        onBackPress={() => {
          if (step > 0) setStep(step - 1);
          else setStep(-1);
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, { color: colors.mutedForeground }]}>Question {step + 1} sur {total}</Text>
          <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${((step + 1) / total) * 100}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        {current && (
          <>
            <Text style={[styles.question, { color: colors.foreground }]}>{current.title}</Text>

            {current.type === QuestionType.numericInput ? (
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="ex: 95"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={answers[current.id]?.displayLabel ?? ''}
                onChangeText={(text: string) => {
                  const num = text === '' ? null : Number(text);
                  setAnswers({ ...answers, [current.id]: { value: num, displayLabel: text } });
                }}
              />
            ) : (
              (current.options || []).map((opt: QuestionOption) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.option,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    answers[current.id]?.value === opt.id && { borderColor: colors.primary, backgroundColor: colors.secondary },
                  ]}
                  onPress={() => setAnswers({ ...answers, [current.id]: { value: opt.id, displayLabel: opt.label } })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: colors.foreground },
                      answers[current.id]?.value === opt.id && { color: colors.primary, fontWeight: typography.fontWeight.semibold },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {answers[current.id]?.value === opt.id && (
                    <Icon name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <View style={styles.navRow}>
          {step > 0 && (
            <TouchableOpacity style={[styles.button, styles.secondary, { borderColor: colors.border }]} onPress={() => setStep(step - 1)}>
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Retour</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              current && !answers[current.id]?.value && styles.buttonDisabled,
            ]}
            onPress={() => {
              if (step === total - 1) {
                const submission = {
                  id: `sub-${Date.now()}`,
                  patientId: 'p1',
                  timestamp: new Date().toISOString(),
                  answers: Object.fromEntries(
                    Object.entries(answers).map(([qid, ans]) => [
                      qid,
                      { questionId: qid, value: ans.value, displayLabel: ans.displayLabel },
                    ])
                  ),
                  spo2Value: typeof answers['spo2']?.value === 'number' ? (answers['spo2'].value as number) : null,
                  measurementSource: 'manual' as const,
                };
                const evaluation = evaluateSubmission(submission as any);
                setResult({ status: evaluation.status, message: evaluation.patientMessage });
                return;
              }
              setStep(step + 1);
            }}
            disabled={current ? !answers[current.id]?.value : true}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{step === total - 1 ? 'Envoyer' : 'Suivant'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  introContent: { padding: spacing.lg, gap: spacing.lg, alignItems: 'center' },
  introHero: { alignItems: 'center', marginTop: spacing.md, textAlign: 'center' },
  heroIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  introTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  introSubtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBox: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
  },
  bottomCta: {
    width: '100%',
    marginTop: spacing.md,
  },
  progressContainer: { marginBottom: spacing.xs },
  progressText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  question: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginVertical: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: shapes.md,
    padding: spacing.md,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
  },
  option: {
    borderWidth: 1,
    borderRadius: shapes.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.md },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  button: { flex: 1, padding: spacing.md, borderRadius: shapes.md, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontWeight: typography.fontWeight.semibold, fontFamily: typography.fontFamily.openSans },
  secondary: { backgroundColor: 'transparent', borderWidth: 1 },
  secondaryText: { fontWeight: typography.fontWeight.semibold, fontFamily: typography.fontFamily.openSans },
  centerContent: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  resultIconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontFamily: typography.fontFamily.urbanist, fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, textAlign: 'center' },
  resultMessage: { fontFamily: typography.fontFamily.openSans, fontSize: typography.fontSize.md, textAlign: 'center', marginBottom: spacing.md },
});
