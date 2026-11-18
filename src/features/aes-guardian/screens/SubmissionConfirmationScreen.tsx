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

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
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

type ParamList = {
  submissionConfirmation: { referenceNumber: string };
};

export const SubmissionConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ParamList, 'submissionConfirmation'>>();
  const referenceNumber = route.params?.referenceNumber || 'AES-REF';
  const locale = useLocale();
  const rtl = isRTL(locale);

  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyReference = () => {
    setCopied(true);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

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
          <View style={styles.heroCircle} testID="confirmation-hero-circle">
            <Icon name="check" size={36} color={aesColors.textInverse} />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.titleText}>{t('confirm.title', locale)}</Text>
          <Text style={styles.subtitleText}>{t('confirm.subtitle', locale)}</Text>

          {/* Monospace Reference Code Box */}
          <View style={styles.referenceContainer}>
            <Text style={styles.referenceLabel}>{t('confirm.refNumber', locale)}</Text>
            <Text style={styles.referenceValue} testID="confirmation-reference-number">
              {referenceNumber}
            </Text>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyReference}
              accessibilityRole="button"
              accessibilityLabel={t('confirm.copy', locale)}
              testID="confirmation-copy-button"
            >
              <Icon
                name={copied ? 'check' : 'copy'}
                size={14}
                color={copied ? aesColors.accentGreen : aesColors.textSecondary}
              />
              <Text
                style={[
                  styles.copyButtonText,
                  copied && styles.copyButtonTextCopied,
                ]}
              >
                {copied ? t('confirm.copied', locale) : t('confirm.copy', locale)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Formal Confirmation Notice */}
          <Text
            style={[
              styles.messageText,
              { textAlign: rtl ? 'right' : 'center' },
            ]}
          >
            {t('confirm.message', locale)}
          </Text>

          {/* Localized Prototype Disclaimer */}
          <Text
            style={[
              styles.disclaimerText,
              { textAlign: rtl ? 'right' : 'center' },
            ]}
          >
            {t('confirm.disclaimer', locale)}
          </Text>
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
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: aesRadii.chip,
    backgroundColor: aesColors.surface,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    marginTop: 2,
  },
  copyButtonText: {
    ...aesTypography.caption,
    color: aesColors.textSecondary,
    fontWeight: '500',
  },
  copyButtonTextCopied: {
    color: aesColors.accentGreen,
    fontWeight: '600',
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
