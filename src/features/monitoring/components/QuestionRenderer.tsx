import AppText from '../../../components/AppText';
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, shapes, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { MonitoringQuestion, QuestionType } from '../../../types/monitoring-question';
import QuestionOptionCard from './QuestionOptionCard';
import SpO2Input from './SpO2Input';

interface QuestionRendererProps {
  question: MonitoringQuestion;
  currentAnswer: string | number | null | undefined;
  measurementSource: 'manual' | 'bluetooth';
  onAnswerChanged: (value: string | number | null) => void;
}

export default function QuestionRenderer({
  question,
  currentAnswer,
  measurementSource,
  onAnswerChanged,
}: QuestionRendererProps) {
  const { colors } = useTheme();

  if (question.type === QuestionType.singleChoice) {
    return (
      <View>
        {question.description ? (
          <View style={[styles.descriptionChip, { backgroundColor: colors.secondary }]}>
            <AppText style={[styles.descriptionText, { color: colors.mutedForeground }]}>{question.description}</AppText>
          </View>
        ) : null}
        <View style={{ marginTop: spacing[6] }}>
          {question.options.map((option) => (
            <QuestionOptionCard
              key={option.id}
              option={option}
              isSelected={currentAnswer === option.id}
              onTap={() => onAnswerChanged(option.id)}
            />
          ))}
        </View>
      </View>
    );
  }

  if (question.type === QuestionType.numericInput) {
    return (
      <SpO2Input
        initialValue={typeof currentAnswer === 'number' ? currentAnswer : null}
        measurementSource={measurementSource}
        onChanged={onAnswerChanged}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  descriptionChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: shapes.sm,
    marginBottom: spacing[6],
  },
  descriptionText: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.openSans },
});
