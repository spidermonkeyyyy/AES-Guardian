/**
 * AES Guardian — Screen 4.2: Submission Confirmation Screen (Redesign)
 *
 * Implements the post-submission confirmation canvas per UI Blueprint Section 4.2
 * and Reference Mapping: Neo Financial iOS Closing an account 7.png.
 *
 * Critical Boundaries:
 * - Displays the actual declaration reference number from navigation params.
 * - Localized confirmation message (confirm.message) and prototype disclaimer (confirm.disclaimer).
 * - Monospace reference box with interactive copy action.
 * - Primary bottom action: Retour à mes déclarations (navigates to 'declarations').
 * - Role boundary: exposed_professional. Zero clinical milestone prescriptions.
 */

import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIconSurface } from '../../../components/AppIcon';
import {
  aesColors,
  aesTypography,
  aesSpacing,
  aesRadii,
  aesShadows,
} from '../../../theme/tokens';
import { useLocale, t, isRTL } from '../../../localization';
import { AesScreenContainer, AesButton, AesCard } from '../components';
import { RootStackParamList } from '../../../navigation/routes';

import AppText from '../../../components/AppText';
type ParamList = {
  submissionConfirmation: { referenceNumber?: string };
};

export const SubmissionConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ParamList, 'submissionConfirmation'>>();
  const referenceNumber = route.params?.referenceNumber?.trim();
  const locale = useLocale();
  const rtl = isRTL(locale);

  const handleReturnToDeclarations = () => {
    navigation.navigate('declarations' as any);
  };

  return (
    <AesScreenContainer testID="aes-submission-confirmation-screen">
      <View style={styles.content}>
        {/* Top spacer to center hero card */}
        <View style={styles.topSpacer} />

        {/* Central Confirmation Card */}
        <AesCard style={styles.confirmationCard}>
          {/* Hero Success Icon Circle */}
          <AppIconSurface
            name="check"
            iconSize={36}
            surfaceSize={68}
            radius={34}
            variant="success"
            style={styles.heroCircle}
            accessibilityLabel={t('confirm.title', locale)}
            decorative={false}
            testID="confirmation-hero-circle"
          />

          {/* Title & Subtitle */}
          <AppText style={styles.titleText}>{t('confirm.title', locale)}</AppText>
          <AppText style={styles.subtitleText}>{t('confirm.subtitle', locale)}</AppText>

          {/* Monospace Reference Code Box */}
          <View style={styles.referenceContainer}>
            <AppText style={styles.referenceLabel}>{t('confirm.refNumber', locale)}</AppText>
            <AppText
              style={styles.referenceValue}
              testID="confirmation-reference-number"
              selectable={Boolean(referenceNumber)}
            >
              {referenceNumber || t('list.refUnavailable', locale)}
            </AppText>
          </View>

          {/* Formal Confirmation Notice */}
          <AppText
            style={[
              styles.messageText,
              { textAlign: rtl ? 'right' : 'center' },
            ]}
          >
            {t('confirm.message', locale)}
          </AppText>

          {/* Localized Prototype Disclaimer */}
          <AppText
            style={[
              styles.disclaimerText,
              { textAlign: rtl ? 'right' : 'center' },
            ]}
          >
            {t('confirm.disclaimer', locale)}
          </AppText>
        </AesCard>

        {/* Bottom Navigation Action */}
        <View style={styles.bottomBar}>
          <AesButton
            title={t('confirm.backToList', locale)}
            onPress={handleReturnToDeclarations}
            variant="primary"
            testID="confirmation-back-button"
          />
        </View>
      </View>
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.screenVertical,
    justifyContent: 'space-between',
  },
  topSpacer: {
    flex: 0.1,
  },
  confirmationCard: {
    alignItems: 'center',
    padding: aesSpacing.lg,
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    ...aesShadows.card,
  },
  heroCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: aesColors.primaryAction,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: aesSpacing.md,
  },
  titleText: {
    ...aesTypography.heading2,
    color: aesColors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    textAlign: 'center',
    marginBottom: aesSpacing.md,
    lineHeight: 18,
  },
  referenceContainer: {
    width: '100%',
    backgroundColor: aesColors.surfaceSubdued,
    borderRadius: aesRadii.card,
    paddingVertical: aesSpacing.md,
    paddingHorizontal: aesSpacing.md,
    alignItems: 'center',
    marginBottom: aesSpacing.md,
    borderWidth: 1,
    borderColor: aesColors.borderMedium,
    gap: 4,
  },
  referenceLabel: {
    ...aesTypography.labelSmall,
    color: aesColors.textTertiary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  referenceValue: {
    ...aesTypography.code,
    fontSize: 22,
    fontWeight: '700',
    color: aesColors.primaryAction,
    letterSpacing: 1.5,
    marginVertical: 4,
  },
  messageText: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    lineHeight: 18,
    marginBottom: aesSpacing.md,
  },
  disclaimerText: {
    ...aesTypography.caption,
    color: aesColors.textTertiary,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  bottomBar: {
    paddingTop: aesSpacing.sm,
    paddingBottom: aesSpacing.xs,
  },
});

export default SubmissionConfirmationScreen;
