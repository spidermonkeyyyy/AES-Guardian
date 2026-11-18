/**
 * AES Guardian — Demonstrator Profile & Settings Screen
 *
 * Dedicated screen for managing the active synthetic demonstration account:
 * - Active role profile & credentials disclaimer
 * - Central in-memory demonstration role switching (Zustand)
 * - Authorized vs strictly restricted capabilities list per role
 * - Runtime multilingual language switcher (FR, EN, AR) with immediate UI update
 * - Prototype identity, SQLite schema version (v7) and ethical privacy boundaries
 * - Two-step confirmation maintenance data reset for tech_admin
 */

import React, { useState } from 'react';
import {
  View,
  Text,
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
  SupportedLocale,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  TranslationKey,
} from '../../../localization';
import { RootStackParamList } from '../../../navigation/routes';

export const AesGuardianProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const locale = useLocale();
  const styles = createStyles(colors);

  const { activeRole, activeContext, setRole } = useDemoRoleStore();
  const [resetting, setResetting] = useState(false);

  const activeDef =
    DEMO_ROLE_DEFINITIONS.find((d) => d.role === activeRole) ?? DEMO_ROLE_DEFINITIONS[0];

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
        'Seul l’administrateur technique peut déclencher cette opération.',
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
      Alert.alert(t('reset.errorTitle', locale), 'ID utilisateur introuvable.');
      return;
    }
    setResetting(true);
    try {
      const db = getDatabase();
      const res = await db.resetDemoScenario(activeContext.userId);
      setResetting(false);
      Alert.alert(
        t('reset.successTitle', locale),
        `${t('reset.successMessage', locale)}\n\n• ${res.declarationsCount} déclarations\n• ${res.preventionActionsCount} actions CAPA\n• Journal d'audit réinitialisé`,
      );
    } catch (err: any) {
      setResetting(false);
      Alert.alert(
        t('reset.errorTitle', locale),
        `${t('reset.errorMessage', locale)} ${err?.message || 'Erreur inconnue'}`,
      );
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* Screen Title */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title', locale)}</Text>
        <Text style={styles.subtitle}>{t('profile.subtitle', locale)}</Text>
      </View>

      {/* Active Account Identity Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          👤 {t('profile.accountSection', locale)}
        </Text>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {activeDef.defaultLabel.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.displayName}>{activeContext.displayName}</Text>
              <View style={styles.idChip}>
                <Text style={styles.idChipText}>ID #{activeContext.userId}</Text>
              </View>
            </View>
            <Text style={styles.roleLabel}>
              {t(activeDef.labelKey as any, locale) || activeDef.defaultLabel}
            </Text>
            <Text style={styles.roleDescription}>
              {t(activeDef.descriptionKey as any, locale) || activeDef.defaultDescription}
            </Text>
          </View>
        </View>

        <View style={styles.demoNoticeBox}>
          <Text style={styles.demoNoticeText}>
            ℹ️ {t('profile.demoAccountNotice', locale)}
          </Text>
        </View>
      </View>

      {/* Role Switcher Section */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          🔄 {t('profile.roleSection', locale)}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleScroll}>
          {DEMO_ROLE_DEFINITIONS.map((def) => {
            const isSelected = def.role === activeRole;
            return (
              <TouchableOpacity
                key={def.role}
                style={[styles.rolePill, isSelected && styles.rolePillActive]}
                onPress={() => setRole(def.role)}
                accessibilityRole="button"
                accessibilityLabel={def.defaultLabel}
              >
                <Text
                  style={[styles.rolePillText, isSelected && styles.rolePillTextActive]}
                >
                  {t(def.labelKey as any, locale) || def.defaultLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Permissions & Access Boundaries Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          🛡️ {t('profile.permissionsSection', locale)}
        </Text>

        <Text style={styles.subheadingGreen}>
          ✓ {t('profile.authorizedCapabilities', locale)} :
        </Text>
        {currentCaps.authorized.map((capKey) => (
          <View key={capKey} style={styles.capabilityRow}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.capabilityText}>{t(capKey, locale)}</Text>
          </View>
        ))}

        <Text style={styles.subheadingRed}>
          ✕ {t('profile.restrictedCapabilities', locale)} :
        </Text>
        {currentCaps.restricted.map((restrKey) => (
          <View key={restrKey} style={styles.capabilityRow}>
            <Text style={styles.crossIcon}>🔒</Text>
            <Text style={styles.restrictedText}>{t(restrKey, locale)}</Text>
          </View>
        ))}
      </View>

      {/* Language Selector Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          🌐 {t('profile.languageSection', locale)}
        </Text>
        <Text style={styles.cardSubtitle}>
          {t('profile.languageSelectorTitle', locale)}
        </Text>

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
                onPress={() => setLocale(loc)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    isSelected && styles.languageButtonTextActive,
                  ]}
                >
                  {LOCALE_LABELS[loc]} {isSelected ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.rtlNoticeText}>
          {t('profile.rtlNotice', locale)}
        </Text>
      </View>

      {/* Documentation & Quick Links Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          📚 {t('profile.navigationSection', locale)}
        </Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('helpGlossary', { initialSection: 'help' })}
          accessibilityRole="button"
        >
          <View style={styles.linkLeft}>
            <Text style={styles.linkIcon}>📖</Text>
            <Text style={styles.linkText}>{t('profile.helpCenterLink', locale)}</Text>
          </View>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('helpGlossary', { initialSection: 'glossary' })}
          accessibilityRole="button"
        >
          <View style={styles.linkLeft}>
            <Text style={styles.linkIcon}>📚</Text>
            <Text style={styles.linkText}>{t('profile.glossaryLink', locale)}</Text>
          </View>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('aesSplash' as any, { replay: true })}
          accessibilityRole="button"
        >
          <View style={styles.linkLeft}>
            <Text style={styles.linkIcon}>✨</Text>
            <Text style={styles.linkText}>Visite guidée & Découverte (Onboarding)</Text>
          </View>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy & Ethical Boundaries Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          🔒 {t('profile.privacySection', locale)}
        </Text>
        <Text style={styles.privacyBodyText}>
          {t('profile.privacyContent', locale)}
        </Text>
      </View>

      {/* Technical Maintenance & Demo Reset (tech_admin only) */}
      {activeRole === 'tech_admin' && (
        <View style={[styles.card, styles.techCard]}>
          <Text style={styles.techTitle}>
            ⚙️ {t('reset.sectionTitle', locale)}
          </Text>
          <Text style={styles.techDesc}>
            {t('reset.sectionDesc', locale)}
          </Text>

          <TouchableOpacity
            style={[styles.resetButton, resetting && styles.resetButtonDisabled]}
            onPress={handleResetData}
            disabled={resetting}
            accessibilityRole="button"
          >
            {resetting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.resetButtonText}>
                ⚠️ {t('reset.buttonLabel', locale)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* About the Prototype */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>
          ℹ️ {t('profile.aboutSection', locale)}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('profile.appNameLabel', locale)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('profile.appVersionLabel', locale)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('profile.schemaVersionLabel', locale)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('profile.dbEngineLabel', locale)}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

function createStyles(colors: any) {
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
      fontFamily: typography.fontFamily.urbanist,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      fontFamily: typography.fontFamily.openSans,
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
      flexDirection: 'row',
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    displayName: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
    },
    idChip: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: shapes.sm,
    },
    idChipText: {
      fontSize: typography.fontSize.xs - 2,
      color: colors.mutedForeground,
    },
    roleLabel: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: colors.primary,
      marginBottom: 2,
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
      color: '#059669',
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    subheadingRed: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#DC2626',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    capabilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 4,
      paddingLeft: spacing.xs,
    },
    checkIcon: {
      fontSize: 12,
      color: '#059669',
      fontWeight: 'bold',
    },
    crossIcon: {
      fontSize: 12,
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
      flexDirection: 'row',
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
    rtlNoticeText: {
      fontSize: typography.fontSize.xs - 2,
      color: colors.mutedForeground,
      fontStyle: 'italic',
      marginTop: spacing.xs,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    linkLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    linkIcon: {
      fontSize: 18,
    },
    linkText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      color: colors.foreground,
    },
    linkChevron: {
      fontSize: 18,
      color: colors.mutedForeground,
    },
    privacyBodyText: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.mutedForeground,
      lineHeight: 18,
    },
    techCard: {
      backgroundColor: '#FEF2F2',
      borderLeftWidth: 4,
      borderLeftColor: '#DC2626',
    },
    techTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: '#991B1B',
      marginBottom: spacing.xs,
    },
    techDesc: {
      fontSize: typography.fontSize.xs - 1,
      color: '#B91C1C',
      lineHeight: 16,
      marginBottom: spacing.md,
    },
    resetButton: {
      backgroundColor: '#DC2626',
      paddingVertical: spacing.sm,
      borderRadius: shapes.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetButtonDisabled: {
      opacity: 0.6,
    },
    resetButtonText: {
      color: '#ffffff',
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
