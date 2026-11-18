/**
 * AES Guardian — Screen 1.4: Prototype Disclaimer Screen
 *
 * Mandatory academic prototype disclaimer & ethical boundaries sheet
 * per UI Blueprint Screen 1.4 and Reference Mapping: Phantom iOS Onboarding 1.png.
 *
 * Rules:
 * - Terms clearly establish academic PFE prototype, synthetic data, local SQLite offline mode.
 * - Confirms not a certified medical device and no autonomous clinical prescription.
 * - Emergency advice in case of real accidental blood exposure.
 * - Button is strictly disabled until the acknowledgement checkbox is checked.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { AesScreenContainer, AesButton } from '../components';
import { RootStackParamList } from '../../../navigation/routes';

export const PrototypeDisclaimerScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAccept = () => {
    if (!acknowledged) return;
    navigation.navigate('aesDemoPicker' as any);
  };

  return (
    <AesScreenContainer testID="aes-prototype-disclaimer-screen">
      <View style={styles.content}>
        {/* Header Notice Card */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.amberBadge}>
              <Icon name="alert-triangle" size={14} color="#7C4400" />
              <Text style={styles.amberBadgeText}>
                {t('onboarding.disclaimer.badge', locale)}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.title,
              { textAlign: rtl ? 'right' : 'left' },
            ]}
          >
            {t('onboarding.disclaimer.title', locale)}
          </Text>
        </View>

        {/* Scrollable Terms & Clauses Container */}
        <View style={styles.card}>
          <ScrollView
            style={styles.termsScroll}
            contentContainerStyle={styles.termsContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.clauseItem}>
              <Text style={styles.clauseText}>
                {t('onboarding.disclaimer.p1', locale)}
              </Text>
            </View>

            <View style={styles.clauseItem}>
              <Text style={styles.clauseText}>
                {t('onboarding.disclaimer.p2', locale)}
              </Text>
            </View>

            <View style={styles.clauseItem}>
              <Text style={styles.clauseText}>
                {t('onboarding.disclaimer.p3', locale)}
              </Text>
            </View>

            <View style={[styles.clauseItem, styles.emergencyClause]}>
              <Text style={styles.emergencyText}>
                {t('onboarding.disclaimer.p4', locale)}
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Interactive Checkbox Acknowledgement */}
        <TouchableOpacity
          style={[
            styles.checkboxRow,
            { flexDirection: rtl ? 'row-reverse' : 'row' },
          ]}
          onPress={() => setAcknowledged((prev) => !prev)}
          activeOpacity={0.8}
          testID="disclaimer-checkbox"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acknowledged }}
          accessibilityLabel={t('onboarding.disclaimer.checkbox', locale)}
        >
          <View
            style={[
              styles.checkboxBox,
              acknowledged ? styles.checkboxChecked : styles.checkboxUnchecked,
            ]}
          >
            {acknowledged && (
              <Icon name="check" size={16} color={aesColors.textInverse} />
            )}
          </View>
          <Text
            style={[
              styles.checkboxLabel,
              { textAlign: rtl ? 'right' : 'left' },
            ]}
          >
            {t('onboarding.disclaimer.checkbox', locale)}
          </Text>
        </TouchableOpacity>

        {/* Bottom Accept Action */}
        <View style={styles.bottomBar}>
          <AesButton
            title={t('onboarding.disclaimer.accept', locale)}
            onPress={handleAccept}
            variant="primary"
            disabled={!acknowledged}
            testID="disclaimer-accept-button"
          />
        </View>
      </View>
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.screenVertical,
  },
  header: {
    paddingTop: aesSpacing.sm,
    marginBottom: aesSpacing.md,
    gap: aesSpacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: aesSpacing.xs,
  },
  amberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: aesSpacing.xs,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: aesSpacing.md,
    paddingVertical: 4,
    borderRadius: aesRadii.chip,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  amberBadgeText: {
    ...aesTypography.code,
    fontSize: 11,
    color: '#7C4400',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    ...aesTypography.heading1,
    color: aesColors.textPrimary,
  },
  card: {
    flex: 1,
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    marginVertical: aesSpacing.sm,
    ...aesShadows.card,
    overflow: 'hidden',
  },
  termsScroll: {
    flex: 1,
  },
  termsContent: {
    padding: aesSpacing.xl,
    gap: aesSpacing.lg,
  },
  clauseItem: {
    paddingBottom: aesSpacing.xs,
  },
  clauseText: {
    ...aesTypography.body,
    color: aesColors.textSecondary,
    lineHeight: 22,
  },
  emergencyClause: {
    backgroundColor: '#FFEBEE',
    padding: aesSpacing.md,
    borderRadius: aesRadii.input,
    borderLeftWidth: 3,
    borderLeftColor: aesColors.banners.error.text,
  },
  emergencyText: {
    ...aesTypography.bodySmall,
    color: '#B71C1C',
    fontWeight: '600',
    lineHeight: 19,
  },
  checkboxRow: {
    alignItems: 'center',
    gap: aesSpacing.md,
    paddingVertical: aesSpacing.md,
    paddingHorizontal: aesSpacing.xs,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    borderColor: aesColors.borderStrong,
    backgroundColor: aesColors.surface,
  },
  checkboxChecked: {
    borderColor: aesColors.accentGreen,
    backgroundColor: aesColors.accentGreen,
  },
  checkboxLabel: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  bottomBar: {
    paddingTop: aesSpacing.xs,
    paddingBottom: aesSpacing.xs,
  },
});
