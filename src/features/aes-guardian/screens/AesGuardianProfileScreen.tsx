/**
 * AES Guardian — Demonstrator Profile & Settings Screen
 *
 * Dedicated screen for managing the active synthetic demonstration account:
 * - Active role profile & credentials disclaimer
 * - Central in-memory demonstration role switching (Zustand)
 * - Authorized vs strictly restricted capabilities list per role
 * - Runtime multilingual language switcher (FR, EN, AR) with immediate UI update
 * - Prototype identity and ethical privacy boundaries
 * - Two-step confirmation maintenance data reset for tech_admin
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing, typography, shapes } from '../../../theme/tokens';
import {
  getDatabase,
  useDemoRoleStore,
  DEMO_ROLE_DEFINITIONS,
  AesGuardianRole,
} from '../../../core';
import {
  t,
  useLocale,
  setLocale,
  persistLocale,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  TranslationKey,
} from '../../../localization';
import { RootStackParamList } from '../../../navigation/routes';

import AppText from '../../../components/AppText';
import { AppIcon, AppIconLabel } from '../../../components/AppIcon';
export const AesGuardianProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const locale = useLocale();
  const styles = createStyles(colors, locale === 'ar');

  const { activeRole, activeContext, setRole } = useDemoRoleStore();
  const [resetting, setResetting] = useState(false);

  const activeDef =
    DEMO_ROLE_DEFINITIONS.find((d) => d.role === activeRole) ?? DEMO_ROLE_DEFINITIONS[0];
  const activeRoleLabel = t(activeDef.labelKey as TranslationKey, locale);

  // Role-specific capability lists
  const capabilitiesByRole: Record<
    AesGuardianRole,
    { authorized: TranslationKey[]; restricted: TranslationKey[] }
  > = {
    exposed_professional: {
      authorized: [
        'profile.cap.declare',
        'profile.cap.myDeclarations',
        'profile.cap.respondCorrection',
      ],
      restricted: [
        'profile.restr.noSurveillance',
        'profile.restr.noCapa',
        'profile.restr.noOtherDeclarations',
      ],
    },
    admin_reviewer: {
      authorized: [
        'profile.cap.adminReview',
        'profile.cap.initiateOH',
        'profile.cap.preventionRegister',
      ],
      restricted: [
        'profile.restr.noClinicalContent',
        'profile.restr.noCapa',
      ],
    },
    oh_professional: {
      authorized: [
        'profile.cap.ohCoordination',
        'profile.cap.ohFollowUp',
        'profile.cap.preventionRegister',
      ],
      restricted: [
        'profile.restr.noAdminQueue',
        'profile.restr.noCapa',
      ],
    },
    quality_staff: {
      authorized: [
        'profile.cap.surveillanceDashboard',
        'profile.cap.preventionRegister',
        'profile.cap.manageCapa',
      ],
      restricted: [
        'profile.restr.noIdentifiableData',
        'profile.restr.noClinicalContent',
      ],
    },
    tech_admin: {
      authorized: [
        'profile.cap.techMaintenance',
      ],
      restricted: [
        'profile.restr.noClinicalContent',
        'profile.restr.noIdentifiableData',
        'profile.restr.noSurveillance',
      ],
    },
  };

  const currentCaps = capabilitiesByRole[activeRole];

  // Two-step confirmation demo reset for tech_admin
  const handleResetData = () => {
    if (activeRole !== 'tech_admin') {
      Alert.alert(
        t('reset.errorTitle', locale),
        t('profile.error.techAdminOnly', locale),
      );
      return;
    }

    // Step 1: Deliberate confirmation
    Alert.alert(
      t('reset.dialog1Title', locale),
      t('reset.dialog1Message', locale),
      [
        { text: t('reset.dialog1Cancel', locale), style: 'cancel' },
        {
          text: t('reset.dialog1Continue', locale),
          style: 'destructive',
          onPress: () => showFinalResetConfirmation(),
        },
      ],
      { cancelable: true },
    );
  };

  // Step 2: Final destructive confirmation
  const showFinalResetConfirmation = () => {
    Alert.alert(
      t('reset.dialog2Title', locale),
      t('reset.dialog2Message', locale),
      [
        { text: t('reset.dialog2Cancel', locale), style: 'cancel' },
        {
          text: t('reset.dialog2Confirm', locale),
          style: 'destructive',
          onPress: () => executeReset(),
        },
      ],
      { cancelable: true },
    );
  };

  const executeReset = async () => {
    if (!activeContext.userId) {
      Alert.alert(
        t('reset.errorTitle', locale),
        t('profile.error.userIdMissing', locale),
      );
      return;
    }
    setResetting(true);
    try {
      const db = getDatabase();
      await db.resetDemoScenario(activeContext.userId);
      setResetting(false);
      Alert.alert(
        t('reset.successTitle', locale),
        t('reset.successMessage', locale),
      );
    } catch (error: unknown) {
      setResetting(false);
      const detail =
        error instanceof Error ? error.message : t('error.generic', locale);
      Alert.alert(
        t('reset.errorTitle', locale),
        `${t('reset.errorMessage', locale)} ${detail}`,
      );
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* Screen Title */}
      <View style={styles.header}>
        <AppText style={styles.title}>{t('profile.title', locale)}</AppText>
        <AppText style={styles.subtitle}>{t('profile.subtitle', locale)}</AppText>
      </View>

      {/* Active Account Identity Card */}
      <View style={styles.card}>
        <AppIconLabel name="user" textStyle={styles.cardSectionTitle}>
          {t('profile.accountSection', locale)}
        </AppIconLabel>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <AppText style={styles.avatarText}>
              {activeRoleLabel.charAt(0).toLocaleUpperCase(locale)}
            </AppText>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <AppText style={styles.displayName}>{activeRoleLabel}</AppText>
            </View>
            <AppText style={styles.roleDescription}>
              {t(activeDef.descriptionKey as TranslationKey, locale) || activeDef.defaultDescription}
            </AppText>
          </View>
        </View>

        <View style={styles.demoNoticeBox}>
          <AppIconLabel name="info" size="sm" textStyle={styles.demoNoticeText}>
            {t('profile.demoAccountNotice', locale)}
          </AppIconLabel>
        </View>
      </View>

      {/* Role Switcher Section */}
      <View style={styles.card}>
        <AppIconLabel name="user-switch" textStyle={styles.cardSectionTitle}>
          {t('profile.roleSection', locale)}
        </AppIconLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleScroll}>
          {DEMO_ROLE_DEFINITIONS.map((def) => {
            const isSelected = def.role === activeRole;
            return (
              <TouchableOpacity
                key={def.role}
                style={[styles.rolePill, isSelected && styles.rolePillActive]}
                onPress={() => setRole(def.role)}
                accessibilityRole="button"
                accessibilityLabel={t(def.labelKey as TranslationKey, locale) || def.defaultLabel}
              >
                <AppText
                  style={[styles.rolePillText, isSelected && styles.rolePillTextActive]}
                >
                  {t(def.labelKey as TranslationKey, locale) || def.defaultLabel}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Permissions & Access Boundaries Card */}
      <View style={styles.card}>
        <AppIconLabel name="shield-check" textStyle={styles.cardSectionTitle}>
          {t('profile.permissionsSection', locale)}
        </AppIconLabel>

        <AppIconLabel name="check" size="sm" color={colors.success} textStyle={styles.subheadingGreen}>
          {t('profile.authorizedCapabilities', locale)} :
        </AppIconLabel>
        {currentCaps.authorized.map((capKey) => (
          <View key={capKey} style={styles.capabilityRow}>
            <AppIcon name="check" size={16} color={colors.success} />
            <AppText style={styles.capabilityText}>{t(capKey, locale)}</AppText>
          </View>
        ))}

        <AppIconLabel name="lock" size="sm" color={colors.destructive} textStyle={styles.subheadingRed}>
          {t('profile.restrictedCapabilities', locale)} :
        </AppIconLabel>
        {currentCaps.restricted.map((restrKey) => (
          <View key={restrKey} style={styles.capabilityRow}>
            <AppIcon name="lock" size={16} color={colors.destructive} />
            <AppText style={styles.restrictedText}>{t(restrKey, locale)}</AppText>
          </View>
        ))}
      </View>

      {/* Language Selector Card */}
      <View style={styles.card}>
        <AppIconLabel name="globe" textStyle={styles.cardSectionTitle}>
          {t('profile.languageSection', locale)}
        </AppIconLabel>
        <AppText style={styles.cardSubtitle}>
          {t('profile.languageSelectorTitle', locale)}
        </AppText>

        <View style={styles.languageButtonsRow}>
          {SUPPORTED_LOCALES.map((loc) => {
            const isSelected = locale === loc;
            return (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.languageButton,
                  isSelected && styles.languageButtonActive,
                ]}
                onPress={() => {
                  setLocale(loc);
                  void persistLocale(loc);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.languageButtonContent}>
                  <AppText style={[
                    styles.languageButtonText,
                    isSelected && styles.languageButtonTextActive,
                  ]}>{LOCALE_LABELS[loc]}</AppText>
                  {isSelected && <AppIcon name="check" size={14} color={colors.primaryForeground} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>

      {/* Documentation & Quick Links Card */}
      <View style={styles.card}>
        <AppIconLabel name="book" textStyle={styles.cardSectionTitle}>
          {t('profile.navigationSection', locale)}
        </AppIconLabel>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('helpGlossary', { initialSection: 'help' })}
          accessibilityRole="button"
        >
          <AppIconLabel name="book-open" textStyle={styles.linkText} style={styles.linkLeft}>
            {t('profile.helpCenterLink', locale)}
          </AppIconLabel>
          <AppIcon name="forward-chevron" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('helpGlossary', { initialSection: 'glossary' })}
          accessibilityRole="button"
        >
          <AppIconLabel name="book" textStyle={styles.linkText} style={styles.linkLeft}>
            {t('profile.glossaryLink', locale)}
          </AppIconLabel>
          <AppIcon name="forward-chevron" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('aesSplash' as any, { replay: true })}
          accessibilityRole="button"
        >
          <AppIconLabel name="sparkles" textStyle={styles.linkText} style={styles.linkLeft}>
            {t('profile.guidedTourLink', locale)}
          </AppIconLabel>
          <AppIcon name="forward-chevron" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Privacy & Ethical Boundaries Card */}
      <View style={styles.card}>
        <AppIconLabel name="lock" textStyle={styles.cardSectionTitle}>
          {t('profile.privacySection', locale)}
        </AppIconLabel>
        <AppText style={styles.privacyBodyText}>
          {t('profile.privacyContent', locale)}
        </AppText>
      </View>

      {/* Technical Maintenance & Demo Reset (tech_admin only) */}
      {activeRole === 'tech_admin' && (
        <View style={[styles.card, styles.techCard]}>
          <AppIconLabel name="settings" textStyle={styles.techTitle}>
            {t('reset.sectionTitle', locale)}
          </AppIconLabel>
          <AppText style={styles.techDesc}>
            {t('reset.sectionDesc', locale)}
          </AppText>

          <TouchableOpacity
            style={[styles.resetButton, resetting && styles.resetButtonDisabled]}
            onPress={handleResetData}
            disabled={resetting}
            accessibilityRole="button"
            accessibilityLabel={t('reset.buttonLabel', locale)}
          >
            {resetting ? (
              <ActivityIndicator color={colors.dangerForeground} size="small" />
            ) : (
              <AppIconLabel name="alert-triangle" size="sm" color={colors.dangerForeground} textStyle={styles.resetButtonText}>
                {t('reset.buttonLabel', locale)}
              </AppIconLabel>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* About the Prototype */}
      <View style={styles.card}>
        <AppIconLabel name="info" textStyle={styles.cardSectionTitle}>
          {t('profile.aboutSection', locale)}
        </AppIconLabel>
        <View style={styles.metaRow}>
          <AppText style={styles.metaLabel}>{t('profile.appNameLabel', locale)}</AppText>
        </View>
        <View style={styles.metaRow}>
          <AppText style={styles.metaLabel}>{t('profile.dbEngineLabel', locale)}</AppText>
        </View>
      </View>
    </ScrollView>
  );
};

function createStyles(colors: any, isRtl: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    header: {
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    cardSectionTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    cardSubtitle: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      marginBottom: spacing.xs,
    },
    profileRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 22,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    profileInfo: {
      flex: 1,
    },
    profileNameRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    displayName: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
    },
    roleDescription: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.mutedForeground,
      lineHeight: 16,
    },
    demoNoticeBox: {
      backgroundColor: colors.surfaceVariant,
      padding: spacing.sm,
      borderRadius: shapes.sm,
    },
    demoNoticeText: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.mutedForeground,
      lineHeight: 16,
    },
    roleScroll: {
      marginTop: spacing.xs,
    },
    rolePill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: shapes.full,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    rolePillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rolePillText: {
      fontSize: typography.fontSize.xs,
      color: colors.foreground,
      fontWeight: typography.fontWeight.medium,
    },
    rolePillTextActive: {
      color: colors.primaryForeground ?? '#ffffff',
      fontWeight: typography.fontWeight.bold,
    },
    subheadingGreen: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: colors.success,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    subheadingRed: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: colors.danger,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    capabilityRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 4,
      paddingLeft: spacing.xs,
    },
    capabilityText: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.foreground,
      flex: 1,
    },
    restrictedText: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.mutedForeground,
      flex: 1,
    },
    languageButtonsRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    languageButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: shapes.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    languageButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    languageButtonText: {
      fontSize: typography.fontSize.xs,
      color: colors.foreground,
      fontWeight: typography.fontWeight.medium,
    },
    languageButtonTextActive: {
      color: colors.primaryForeground ?? '#ffffff',
      fontWeight: typography.fontWeight.bold,
    },
    languageButtonContent: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    linkRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    linkLeft: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    linkText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      color: colors.foreground,
    },
    privacyBodyText: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    techCard: {
      backgroundColor: colors.dangerBackground,
      borderLeftWidth: 4,
      borderLeftColor: colors.danger,
    },
    techTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.danger,
      marginBottom: spacing.xs,
    },
    techDesc: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.danger,
      lineHeight: 16,
      marginBottom: spacing.md,
    },
    resetButton: {
      backgroundColor: colors.danger,
      paddingVertical: spacing.sm,
      borderRadius: shapes.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetButtonDisabled: {
      opacity: 0.6,
    },
    resetButtonText: {
      color: colors.dangerForeground,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
    },
    metaRow: {
      paddingVertical: 2,
    },
    metaLabel: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.mutedForeground,
    },
  });
}
