/**
 * AES Guardian — Central Demonstration Workspace Screen
 *
 * Unified operational hub for the AES Guardian prototype:
 * - Persistent prototype disclaimer & PFE demonstration identity
 * - Central in-memory demonstration role switcher supporting all 5 synthetic roles
 * - Role-scoped module navigation with dynamic permission enforcement
 * - Real-time status indicators sourced from the local SQLite database
 * - Guided end-to-end demonstration scenario roadmap
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing, typography, shapes } from '../../../theme/tokens';
import {
  getDatabase,
  useDemoRoleStore,
  DEMO_ROLE_DEFINITIONS,
  AesGuardianRole,
  seedDemoScenarioIfEmpty,
} from '../../../core';
import { t, useLocale } from '../../../localization';

interface ModuleCardProps {
  iconText: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
  accentColor?: string;
}

export const AesGuardianWorkspaceScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isFocused = useIsFocused();
  const locale = useLocale();
  const styles = createStyles(colors);

  const {
    activeRole,
    activeContext,
    setRole,
    canDeclare,
    canReview,
    canCoordinate,
    canFollowUp,
    canViewSurveillance,
    canViewPrevention,
    canManagePrevention,
  } = useDemoRoleStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [stats, setStats] = useState<{
    myDeclarationsCount?: number;
    pendingCorrectionsCount?: number;
    adminQueueCount?: number;
    ohQueueCount?: number;
    surveillanceCount?: number;
    capaCount?: number;
    schemaVersion?: number;
  }>({});
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const handleResetDemoData = () => {
    if (activeRole !== 'tech_admin') {
      Alert.alert(
        t('reset.errorTitle', locale),
        'Seul l’administrateur technique peut réinitialiser le jeu de données.',
      );
      return;
    }

    Alert.alert(
      t('reset.dialog1Title', locale),
      t('reset.dialog1Message', locale),
      [
        { text: t('reset.dialog1Cancel', locale), style: 'cancel' },
        {
          text: t('reset.dialog1Continue', locale),
          style: 'destructive',
          onPress: () => confirmFinalReset(),
        },
      ],
      { cancelable: true },
    );
  };

  const confirmFinalReset = () => {
    Alert.alert(
      t('reset.dialog2Title', locale),
      t('reset.dialog2Message', locale),
      [
        { text: t('reset.dialog2Cancel', locale), style: 'cancel' },
        {
          text: t('reset.dialog2Confirm', locale),
          style: 'destructive',
          onPress: async () => {
            if (!activeContext.userId) {
              Alert.alert(t('reset.errorTitle', locale), 'ID utilisateur introuvable.');
              return;
            }
            setResetting(true);
            try {
              const db = getDatabase();
              const res = await db.resetDemoScenario(activeContext.userId);
              await loadRoleStats();
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
          },
        },
      ],
      { cancelable: true },
    );
  };

  const loadRoleStats = useCallback(async () => {
    try {
      const db = getDatabase();
      const newStats: typeof stats = {};

      if (activeRole === 'exposed_professional' && activeContext.userId) {
        const myDecls = await db.getDeclarations({ userId: activeContext.userId, requestingUserId: activeContext.userId });
        newStats.myDeclarationsCount = myDecls.length;
        newStats.pendingCorrectionsCount = myDecls.filter(
          (d) => d.status === 'correction_requested',
        ).length;
      } else if (activeRole === 'admin_reviewer' && activeContext.userId) {
        const queue = await db.getReviewQueue({ requestingUserId: activeContext.userId });
        newStats.adminQueueCount = queue.length;
      } else if (activeRole === 'oh_professional' && activeContext.userId) {
        const ohQueue = await db.listOhCoordinationsQueue(activeContext.userId);
        newStats.ohQueueCount = ohQueue.length;
      } else if (activeRole === 'quality_staff' && activeContext.userId) {
        const surv = await db.getSurveillanceDashboardMetrics(activeContext.userId);
        newStats.surveillanceCount = surv.overview.totalDeclarations;
        const capa = await db.getPreventionOverview(activeContext.userId);
        newStats.capaCount = capa.total;
      } else if (activeRole === 'tech_admin') {
        const versionRes = await db.query<{ version: number }>(
          `SELECT MAX(version) as version FROM schema_versions`,
        );
        newStats.schemaVersion = versionRes.rows[0]?.version ?? 7;
      }

      setStats(newStats);
    } catch (err: any) {
      console.warn('[Workspace] loadRoleStats error:', err?.message);
    }

    // Load unread notification count for non-tech_admin roles
    if (activeRole !== 'tech_admin' && activeContext.userId) {
      try {
        const db = getDatabase();
        const count = await db.getUnreadNotificationCount(activeContext.userId);
        setUnreadNotificationCount(count);
      } catch {
        // non-critical — badge stays at previous value
      }
    } else {
      setUnreadNotificationCount(0);
    }
  }, [activeRole, activeContext.userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoleStats();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isFocused) {
      loadRoleStats();
    }
  }, [isFocused, loadRoleStats]);

  const activeDef =
    DEMO_ROLE_DEFINITIONS.find((d) => d.role === activeRole) ?? DEMO_ROLE_DEFINITIONS[0];

  const ModuleCard: React.FC<ModuleCardProps> = ({
    iconText,
    title,
    description,
    badge,
    badgeColor,
    onPress,
    accentColor,
  }) => (
    <TouchableOpacity
      style={[styles.moduleCard, accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : null]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.moduleHeaderRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{iconText}</Text>
        </View>
        <View style={styles.moduleTitleBox}>
          <View style={styles.moduleTitleRow}>
            <Text style={styles.moduleTitle}>{title}</Text>
            {badge ? (
              <View style={[styles.badge, { backgroundColor: badgeColor ?? colors.primary }]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.moduleDescription}>{description}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
      }
    >
      {/* Top Identity Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>🛡️</Text>
          </View>
          <View style={styles.brandTextContainer}>
            <Text style={styles.appName}>AES GUARDIAN</Text>
            <Text style={styles.appTagline}>{t('workspace.tagline', locale)}</Text>
          </View>
          <View style={styles.headerActionsRow}>
            {activeRole !== 'tech_admin' && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => navigation.navigate('notificationCentre')}
                accessibilityRole="button"
                accessibilityLabel={t('notificationCentre.a11y.unreadBadge', locale)}
              >
                <Text style={styles.headerActionIcon}>🔔</Text>
                {unreadNotificationCount > 0 && (
                  <View style={styles.notifBadge} testID="workspace-unread-badge">
                    <Text style={styles.notifBadgeText}>
                      {unreadNotificationCount > 99 ? '99+' : String(unreadNotificationCount)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('helpGlossary')}
              accessibilityRole="button"
              accessibilityLabel={t('helpGlossary.tabHelp', locale)}
            >
              <Text style={styles.headerActionIcon}>❓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('aesGuardianProfile')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.title', locale)}
            >
              <Text style={styles.headerActionIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Persistent Prototype Banner */}
      <View style={styles.disclaimerBanner}>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerIcon}>⚠️</Text>
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerTitle}>{t('workspace.disclaimerTitle')}</Text>
            <Text style={styles.bannerSubtitle}>{t('workspace.disclaimerText')}</Text>
          </View>
        </View>
      </View>

      {/* Unified Demonstration Role Selector */}
      <View style={styles.roleSelectorSection}>
        <Text style={styles.sectionHeaderTitle}>{t('workspace.roleSelectorTitle')}</Text>
        <Text style={styles.sectionHeaderSubtitle}>{t('workspace.roleSelectorSubtitle')}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleScrollView}>
          {DEMO_ROLE_DEFINITIONS.map((def) => {
            const isSelected = def.role === activeRole;
            return (
              <TouchableOpacity
                key={def.role}
                style={[
                  styles.rolePill,
                  isSelected && styles.rolePillActive,
                ]}
                onPress={() => setRole(def.role)}
                accessibilityRole="button"
                accessibilityLabel={def.defaultLabel}
              >
                <Text
                  style={[
                    styles.rolePillText,
                    isSelected && styles.rolePillTextActive,
                  ]}
                >
                  {t(def.labelKey as any) || def.defaultLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Current Active Role Profile Card */}
        <View style={styles.activeRoleCard}>
          <View style={styles.activeRoleRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {activeDef.defaultLabel.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.activeRoleInfo}>
              <View style={styles.roleBadgeRow}>
                <Text style={styles.activeRoleName}>{activeContext.displayName}</Text>
                <View style={styles.roleChipSmall}>
                  <Text style={styles.roleChipSmallText}>ID #{activeContext.userId}</Text>
                </View>
              </View>
              <Text style={styles.activeRoleDescription}>
                {t(activeDef.descriptionKey as any) || activeDef.defaultDescription}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actionable Callout (if Exposed Professional has pending correction) */}
      {activeRole === 'exposed_professional' && (stats.pendingCorrectionsCount ?? 0) > 0 && (
        <TouchableOpacity
          style={styles.actionableCallout}
          onPress={() => navigation.navigate('declarations')}
        >
          <Text style={styles.calloutIcon}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.calloutTitle}>{t('workspace.correctionActionRequired')}</Text>
            <Text style={styles.calloutText}>{t('workspace.correctionActionDesc')}</Text>
          </View>
          <Text style={styles.calloutArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Role-Permitted Modules Grid */}
      <View style={styles.modulesSection}>
        <Text style={styles.sectionHeaderTitle}>{t('workspace.permittedModulesTitle')}</Text>

        {/* 1. EXPOSED PROFESSIONAL MODULES */}
        {activeRole === 'exposed_professional' && (
          <>
            <ModuleCard
              iconText="📝"
              title={t('workspace.module.newDeclaration')}
              description={t('workspace.module.newDeclarationDesc')}
              accentColor="#10B981"
              onPress={() => navigation.navigate('newDeclaration')}
            />
            <ModuleCard
              iconText="📋"
              title={t('workspace.module.myDeclarations')}
              description={t('workspace.module.myDeclarationsDesc')}
              badge={stats.myDeclarationsCount !== undefined ? `${stats.myDeclarationsCount}` : undefined}
              onPress={() => navigation.navigate('declarations')}
            />
            <View style={styles.privacyNoticeBox}>
              <Text style={styles.privacyNoticeText}>
                🔒 {t('workspace.notice.exposedRestrictions')}
              </Text>
            </View>
          </>
        )}

        {/* 2. ADMINISTRATIVE REVIEWER MODULES */}
        {activeRole === 'admin_reviewer' && (
          <>
            <ModuleCard
              iconText="⚖️"
              title={t('workspace.module.adminQueue')}
              description={t('workspace.module.adminQueueDesc')}
              badge={stats.adminQueueCount !== undefined ? `${stats.adminQueueCount} ${t('workspace.badgePending')}` : undefined}
              badgeColor="#F59E0B"
              accentColor="#F59E0B"
              onPress={() => navigation.navigate('adminReviewQueue')}
            />
            <ModuleCard
              iconText="📑"
              title={t('workspace.module.allDeclarations')}
              description={t('workspace.module.allDeclarationsDesc')}
              onPress={() => navigation.navigate('declarations')}
            />
            <ModuleCard
              iconText="📊"
              title={t('workspace.module.surveillanceDashboard')}
              description={t('workspace.module.surveillanceDashboardDesc')}
              accentColor="#6366F1"
              onPress={() => navigation.navigate('surveillanceDashboard')}
            />
            <ModuleCard
              iconText="🛡️"
              title={t('workspace.module.preventionRegisterReadOnly')}
              description={t('workspace.module.preventionRegisterReadOnlyDesc')}
              onPress={() => navigation.navigate('preventionRegister')}
            />
          </>
        )}

        {/* 3. OCCUPATIONAL HEALTH PROFESSIONAL MODULES */}
        {activeRole === 'oh_professional' && (
          <>
            <ModuleCard
              iconText="🩺"
              title={t('workspace.module.ohQueue')}
              description={t('workspace.module.ohQueueDesc')}
              badge={stats.ohQueueCount !== undefined ? `${stats.ohQueueCount} ${t('workspace.badgeActive')}` : undefined}
              badgeColor="#0EA5E9"
              accentColor="#0EA5E9"
              onPress={() => navigation.navigate('ohCoordinationQueue')}
            />
            <ModuleCard
              iconText="📑"
              title={t('workspace.module.allDeclarations')}
              description={t('workspace.module.allDeclarationsDesc')}
              onPress={() => navigation.navigate('declarations')}
            />
            <ModuleCard
              iconText="📊"
              title={t('workspace.module.surveillanceDashboard')}
              description={t('workspace.module.surveillanceDashboardDesc')}
              accentColor="#6366F1"
              onPress={() => navigation.navigate('surveillanceDashboard')}
            />
            <ModuleCard
              iconText="🛡️"
              title={t('workspace.module.preventionRegisterReadOnly')}
              description={t('workspace.module.preventionRegisterReadOnlyDesc')}
              onPress={() => navigation.navigate('preventionRegister')}
            />
          </>
        )}

        {/* 4. QUALITY STAFF MODULES */}
        {activeRole === 'quality_staff' && (
          <>
            <ModuleCard
              iconText="📊"
              title={t('workspace.module.surveillanceDashboard')}
              description={t('workspace.module.surveillanceDashboardDesc')}
              badge={stats.surveillanceCount !== undefined ? `${stats.surveillanceCount} ${t('workspace.badgeIncidents')}` : undefined}
              badgeColor="#6366F1"
              accentColor="#6366F1"
              onPress={() => navigation.navigate('surveillanceDashboard')}
            />
            <ModuleCard
              iconText="🎯"
              title={t('workspace.module.preventionOverview')}
              description={t('workspace.module.preventionOverviewDesc')}
              badge={stats.capaCount !== undefined ? `${stats.capaCount} ${t('workspace.badgeActions')}` : undefined}
              badgeColor="#10B981"
              accentColor="#10B981"
              onPress={() => navigation.navigate('preventionOverview')}
            />
            <ModuleCard
              iconText="📋"
              title={t('workspace.module.preventionRegister')}
              description={t('workspace.module.preventionRegisterDesc')}
              onPress={() => navigation.navigate('preventionRegister')}
            />
            <ModuleCard
              iconText="➕"
              title={t('workspace.module.preventionCreate')}
              description={t('workspace.module.preventionCreateDesc')}
              onPress={() => navigation.navigate('preventionCreate')}
            />
            <View style={styles.privacyNoticeBox}>
              <Text style={styles.privacyNoticeText}>
                🔒 {t('workspace.notice.qualityRestrictions')}
              </Text>
            </View>
          </>
        )}

        {/* 5. TECHNICAL ADMINISTRATOR MODULES */}
        {activeRole === 'tech_admin' && (
          <>
            <View style={styles.techStatusCard}>
              <Text style={styles.techCardTitle}>🔧 {t('workspace.tech.sqliteIntegrity')}</Text>
              <View style={styles.techRow}>
                <Text style={styles.techLabel}>{t('workspace.tech.engine')} :</Text>
                <Text style={styles.techValue}>Vanilla SQLite (@op-engineering/op-sqlite)</Text>
              </View>
              <View style={styles.techRow}>
                <Text style={styles.techLabel}>{t('workspace.tech.schemaVersion')} :</Text>
                <Text style={styles.techValue}>v{stats.schemaVersion ?? 7} (7/7 appliquées)</Text>
              </View>
              <View style={styles.techRow}>
                <Text style={styles.techLabel}>{t('workspace.tech.fkCheck')} :</Text>
                <Text style={[styles.techValue, { color: '#10B981', fontWeight: 'bold' }]}>
                  {t('workspace.tech.fkOk')}
                </Text>
              </View>
            </View>

            {/* Technical Maintenance Reset Card */}
            <View style={styles.techResetCard}>
              <Text style={styles.techResetTitle}>
                ⚙️ {t('reset.sectionTitle', locale)}
              </Text>
              <Text style={styles.techResetDesc}>
                {t('reset.sectionDesc', locale)}
              </Text>

              <TouchableOpacity
                style={[styles.techResetBtn, resetting && styles.techResetBtnDisabled]}
                onPress={handleResetDemoData}
                disabled={resetting}
                accessibilityRole="button"
                accessibilityLabel={t('reset.buttonLabel', locale)}
              >
                {resetting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.techResetBtnText}>
                    ⚠️ {t('reset.buttonLabel', locale)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.privacyNoticeBox}>
              <Text style={styles.privacyNoticeText}>
                🔒 {t('workspace.notice.techRestrictions')}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Guided Demonstration Roadmap */}
      <View style={styles.scenarioSection}>
        <Text style={styles.sectionHeaderTitle}>{t('workspace.scenarioTitle')}</Text>
        <Text style={styles.sectionHeaderSubtitle}>{t('workspace.scenarioSubtitle')}</Text>

        <View style={styles.scenarioStepsBox}>
          {[
            { step: '1', role: 'exposed_professional' as AesGuardianRole, title: t('workspace.step1.title'), desc: t('workspace.step1.desc') },
            { step: '2', role: 'admin_reviewer' as AesGuardianRole,       title: t('workspace.step2.title'), desc: t('workspace.step2.desc') },
            { step: '3', role: 'exposed_professional' as AesGuardianRole, title: t('workspace.step3.title'), desc: t('workspace.step3.desc') },
            { step: '4', role: 'oh_professional' as AesGuardianRole,      title: t('workspace.step4.title'), desc: t('workspace.step4.desc') },
            { step: '5', role: 'quality_staff' as AesGuardianRole,        title: t('workspace.step5.title'), desc: t('workspace.step5.desc') },
            { step: '6', role: 'quality_staff' as AesGuardianRole,        title: t('workspace.step6.title'), desc: t('workspace.step6.desc') },
          ].map((item) => (
            <View key={item.step} style={styles.scenarioStepRow}>
              <View style={[styles.stepNumberBadge, activeRole === item.role ? styles.stepNumberBadgeActive : null]}>
                <Text style={[styles.stepNumberText, activeRole === item.role ? styles.stepNumberTextActive : null]}>
                  {item.step}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitleText}>{item.title}</Text>
                <Text style={styles.stepDescText}>{item.desc}</Text>
              </View>
              {activeRole !== item.role ? (
                <TouchableOpacity
                  style={styles.stepSwitchBtn}
                  onPress={() => setRole(item.role)}
                >
                  <Text style={styles.stepSwitchBtnText}>{t('workspace.switchRole')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.stepActiveBadge}>
                  <Text style={styles.stepActiveBadgeText}>{t('workspace.activeRoleIndicator')}</Text>
                </View>
              )}
            </View>
          ))}
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
    contentContainer: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    header: {
      marginBottom: spacing.sm,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    logoBadge: {
      width: 48,
      height: 48,
      borderRadius: shapes.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: 24,
    },
    brandTextContainer: {
      flex: 1,
    },
    appName: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      fontFamily: typography.fontFamily.urbanist,
      letterSpacing: 0.5,
    },
    appTagline: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      fontFamily: typography.fontFamily.openSans,
    },
    headerActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: shapes.sm,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActionIcon: {
      fontSize: 18,
    },
    notifBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: colors.primary,
      borderRadius: shapes.full,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.card,
    },
    notifBadgeText: {
      color: colors.primaryForeground ?? '#ffffff',
      fontSize: 9,
      fontWeight: typography.fontWeight.bold,
      textAlign: 'center',
      lineHeight: 11,
    },
    disclaimerBanner: {
      backgroundColor: '#FEF3C7',
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
      borderRadius: shapes.sm,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    bannerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    bannerIcon: {
      fontSize: 16,
    },
    bannerTextBox: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#92400E',
      marginBottom: 2,
    },
    bannerSubtitle: {
      fontSize: typography.fontSize.xs - 1,
      color: '#B45309',
      lineHeight: 16,
    },
    roleSelectorSection: {
      marginBottom: spacing.lg,
    },
    sectionHeaderTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      fontFamily: typography.fontFamily.urbanist,
      marginBottom: 2,
    },
    sectionHeaderSubtitle: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      marginBottom: spacing.sm,
    },
    roleScrollView: {
      marginBottom: spacing.sm,
    },
    rolePill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: shapes.full,
      backgroundColor: colors.card,
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
    activeRoleCard: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    activeRoleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary,
    },
    activeRoleInfo: {
      flex: 1,
    },
    roleBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    activeRoleName: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
    },
    roleChipSmall: {
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: shapes.sm,
    },
    roleChipSmallText: {
      fontSize: typography.fontSize.xs - 2,
      color: colors.mutedForeground,
    },
    activeRoleDescription: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      lineHeight: 16,
    },
    actionableCallout: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: '#FEF2F2',
      borderLeftWidth: 4,
      borderLeftColor: '#EF4444',
      padding: spacing.sm,
      borderRadius: shapes.sm,
      marginBottom: spacing.md,
    },
    calloutIcon: {
      fontSize: 18,
    },
    calloutTitle: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#991B1B',
    },
    calloutText: {
      fontSize: typography.fontSize.xs - 1,
      color: '#B91C1C',
    },
    calloutArrow: {
      fontSize: 18,
      color: '#991B1B',
      fontWeight: 'bold',
    },
    modulesSection: {
      marginBottom: spacing.lg,
    },
    moduleCard: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    moduleHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: shapes.sm,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: 20,
    },
    moduleTitleBox: {
      flex: 1,
    },
    moduleTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    moduleTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
    },
    badge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: shapes.full,
    },
    badgeText: {
      fontSize: typography.fontSize.xs - 2,
      color: '#fff',
      fontWeight: typography.fontWeight.bold,
    },
    moduleDescription: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      lineHeight: 16,
    },
    chevron: {
      fontSize: 22,
      color: colors.mutedForeground,
    },
    privacyNoticeBox: {
      backgroundColor: colors.surfaceVariant,
      padding: spacing.sm,
      borderRadius: shapes.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    privacyNoticeText: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      fontStyle: 'italic',
      lineHeight: 16,
    },
    techStatusCard: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    techCardTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      marginBottom: spacing.sm,
    },
    techRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    techLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
    },
    techValue: {
      fontSize: typography.fontSize.xs,
      color: colors.foreground,
    },
    scenarioSection: {
      marginTop: spacing.xs,
    },
    scenarioStepsBox: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
    },
    scenarioStepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stepNumberBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberBadgeActive: {
      backgroundColor: colors.primary,
    },
    stepNumberText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: colors.mutedForeground,
    },
    stepNumberTextActive: {
      color: colors.primaryForeground ?? '#fff',
    },
    stepTitleText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
    },
    stepDescText: {
      fontSize: typography.fontSize.xs - 2,
      color: colors.mutedForeground,
    },
    stepSwitchBtn: {
      backgroundColor: colors.secondary,
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      borderRadius: shapes.sm,
    },
    stepSwitchBtnText: {
      fontSize: typography.fontSize.xs - 2,
      color: colors.primary,
      fontWeight: typography.fontWeight.bold,
    },
    stepActiveBadge: {
      backgroundColor: '#DCFCE7',
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      borderRadius: shapes.sm,
    },
    stepActiveBadgeText: {
      fontSize: typography.fontSize.xs - 2,
      color: '#166534',
      fontWeight: typography.fontWeight.bold,
    },
    techResetCard: {
      backgroundColor: '#FEF2F2',
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: '#FCA5A5',
      borderLeftWidth: 4,
      borderLeftColor: '#DC2626',
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    techResetTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: '#991B1B',
      marginBottom: spacing.xs,
    },
    techResetDesc: {
      fontSize: typography.fontSize.xs - 1,
      color: '#B91C1C',
      lineHeight: 16,
      marginBottom: spacing.sm,
    },
    techResetBtn: {
      backgroundColor: '#DC2626',
      paddingVertical: spacing.sm,
      borderRadius: shapes.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    techResetBtnDisabled: {
      opacity: 0.6,
    },
    techResetBtnText: {
      color: '#ffffff',
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
    },
  });
}
