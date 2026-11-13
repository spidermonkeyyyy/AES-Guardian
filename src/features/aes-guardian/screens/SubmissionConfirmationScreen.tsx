import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { t } from '../../../localization';

type ParamList = {
  submissionConfirmation: { referenceNumber: string };
};

export const SubmissionConfirmationScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'submissionConfirmation'>>();
  const referenceNumber = route.params?.referenceNumber || 'AES-REF';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
          <Text style={[styles.checkmark, { color: colors.primaryForeground }]}>✓</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('confirm.title')}
        </Text>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t('confirm.subtitle')}
        </Text>

        <View style={[styles.refBox, { backgroundColor: colors.muted }]}>
          <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>
            {t('confirm.refNumber')}
          </Text>
          <Text style={[styles.refValue, { color: colors.foreground }]}>
            {referenceNumber}
          </Text>
        </View>

        <Text style={[styles.message, { color: colors.foreground }]}>
          {t('confirm.message')}
        </Text>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          {t('confirm.disclaimer')}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('declarations')}
        accessibilityRole="button"
        accessibilityLabel={t('confirm.backToList')}
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          {t('confirm.backToList')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.screenPadding,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: shapes.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  checkmark: {
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    fontSize: typography.fontSize.headlineSmall,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.bodyMedium,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  refBox: {
    width: '100%',
    padding: spacing.md,
    borderRadius: shapes.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  refLabel: {
    fontSize: typography.fontSize.bodySmall,
    marginBottom: spacing.xxs,
  },
  refValue: {
    fontSize: typography.fontSize.titleLarge,
    fontWeight: '700',
    letterSpacing: 1,
  },
  message: {
    fontSize: typography.fontSize.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: shapes.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '600',
  },
});

export default SubmissionConfirmationScreen;
