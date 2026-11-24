/**
 * AES Guardian — Screen 2.1: Demo Account Selection Screen
 *
 * First-launch synthetic demonstration persona picker
 * per UI Blueprint Screen 2.1 and Reference Mapping: Phantom iOS Accounts 1.png.
 *
 * Critical Security & Identity Boundaries:
 * - Exactly the 5 canonical demonstration roles:
 *   1. NURSE-001: exposed_professional
 *   2. ADMIN-001: admin_reviewer
 *   3. OCC-001:   oh_professional
 *   4. QUAL-001:  quality_staff
 *   5. ADMIN-TECH: tech_admin
 * - Codes (e.g. NURSE-001) are UI demonstration labels for evaluators.
 * - Selection sets active role in the authoritative `useDemoRoleStore`.
 * - Zero real passwords, PINs, or secondary authentication stores.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIcon } from '../../../components/AppIcon';
import {
  aesColors,
  aesTypography,
  aesSpacing,
  aesRadii,
} from '../../../theme/tokens';
import { useLocale, t, isRTL, TranslationKey } from '../../../localization';
import {
  useDemoRoleStore,
  AesGuardianRole,
} from '../../../core';
import { setFirstLaunchCompleted } from '../utils/onboardingStorage';
import { AesScreenContainer, AesButton, AesOptionCard } from '../components';
import { RootStackParamList } from '../../../navigation/routes';

import AppText from '../../../components/AppText';
export interface DemoAccountItem {
  role: AesGuardianRole;
  codeKey: TranslationKey;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

export const DEMO_ACCOUNTS: DemoAccountItem[] = [
  {
    role: 'exposed_professional',
    codeKey: 'onboarding.picker.role1.code',
    titleKey: 'onboarding.picker.role1.title',
    descKey: 'onboarding.picker.role1.desc',
  },
  {
    role: 'admin_reviewer',
    codeKey: 'onboarding.picker.role2.code',
    titleKey: 'onboarding.picker.role2.title',
    descKey: 'onboarding.picker.role2.desc',
  },
  {
    role: 'oh_professional',
    codeKey: 'onboarding.picker.role3.code',
    titleKey: 'onboarding.picker.role3.title',
    descKey: 'onboarding.picker.role3.desc',
  },
  {
    role: 'quality_staff',
    codeKey: 'onboarding.picker.role4.code',
    titleKey: 'onboarding.picker.role4.title',
    descKey: 'onboarding.picker.role4.desc',
  },
  {
    role: 'tech_admin',
    codeKey: 'onboarding.picker.role5.code',
    titleKey: 'onboarding.picker.role5.title',
    descKey: 'onboarding.picker.role5.desc',
  },
];

export const DemoAccountPickerScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const locale = useLocale();
  const rtl = isRTL(locale);

  const { activeRole, setRole } = useDemoRoleStore();
  const [selectedRole, setSelectedRole] = useState<AesGuardianRole>(activeRole);
  const [isEntering, setIsEntering] = useState(false);

  const handleEnterWorkspace = async () => {
    if (isEntering) return;
    setIsEntering(true);
    try {
      // 1. Authoritative in-memory role selection
      setRole(selectedRole);

      // 2. Mark first launch completed with fail-safe error handling
      try {
        await setFirstLaunchCompleted(true);
      } catch {
        // Non-fatal: in-memory state remains valid, never lock the user out
      }

      // 3. Navigate to workspace
      navigation.replace('aesGuardianWorkspace' as any);
    } finally {
      setIsEntering(false);
    }
  };

  return (
    <AesScreenContainer testID="aes-demo-account-picker-screen">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <AppText
            style={[
              styles.title,
              { textAlign: rtl ? 'right' : 'left' },
            ]}
          >
            {t('onboarding.picker.title', locale)}
          </AppText>
        </View>

        {/* Informative Synthetic Identity Banner */}
        <View style={styles.infoBanner}>
          <AppIcon name="info" size={16} color="#0D47A1" style={styles.bannerIcon} />
          <AppText style={styles.bannerText}>
            {t('onboarding.picker.syntheticNotice', locale)}
          </AppText>
        </View>

        {/* List of 5 Canonical Demo Accounts */}
        <ScrollView
          style={styles.accountScroll}
          contentContainerStyle={styles.accountList}
          showsVerticalScrollIndicator={false}
        >
          {DEMO_ACCOUNTS.map((account) => {
            const isSelected = selectedRole === account.role;
            const code = t(account.codeKey, locale);
            const title = t(account.titleKey, locale);
            const desc = t(account.descKey, locale);

            return (
              <AesOptionCard
                key={account.role}
                title={title}
                subtitle={desc}
                badgeCode={code}
                selected={isSelected}
                onPress={() => setSelectedRole(account.role)}
                variant="radio"
                testID={`demo-account-card-${account.role}`}
                accessibilityLabel={`${code} - ${title} - ${desc}`}
              />
            );
          })}
        </ScrollView>

        {/* Bottom Enter Workspace Action */}
        <View style={styles.bottomBar}>
          <AesButton
            title={t('onboarding.picker.enter', locale)}
            onPress={handleEnterWorkspace}
            variant="primary"
            disabled={isEntering}
            testID="demo-picker-enter-button"
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
    marginBottom: aesSpacing.sm,
    gap: aesSpacing.xs,
  },
  title: {
    ...aesTypography.heading1,
    color: aesColors.textPrimary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: aesSpacing.md,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: '#90CAF9',
    marginBottom: aesSpacing.sm,
  },
  bannerIcon: {
    marginEnd: aesSpacing.sm,
  },
  bannerText: {
    ...aesTypography.bodySmall,
    fontSize: 12,
    color: '#0D47A1',
    flex: 1,
    lineHeight: 16,
  },
  accountScroll: {
    flex: 1,
  },
  accountList: {
    paddingVertical: aesSpacing.xs,
    gap: aesSpacing.xs,
  },
  bottomBar: {
    paddingTop: aesSpacing.md,
    paddingBottom: aesSpacing.xs,
  },
});
