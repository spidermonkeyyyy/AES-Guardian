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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/routes';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing, typography, shapes } from '../../../theme/tokens';
import type { ColorToken } from '../../../theme/tokens/colors';
import {
  getDatabase,
  useDemoRoleStore,
  DEMO_ROLE_DEFINITIONS,
  AesGuardianRole,
} from '../../../core';
import { t, useLocale, type TranslationKey } from '../../../localization';

import AppText from '../../../components/AppText';
import { AppIcon, AppIconLabel, type AppIconName } from '../../../components/AppIcon';
import { AesButton, AesCard, DashboardMetricCard } from '../components';

type WorkspaceDashboardData =
  | {
      role: 'exposed_professional';
      declarationsLoaded: number;
      correctionRequestsLoaded: number;
      unreadNotificationCount: number;
    }
  | {
      role: 'admin_reviewer';
      reviewItemsLoaded: number;
      unreadNotificationCount: number;
    }
  | {
      role: 'oh_professional';
      activeCoordinations: number;
      unreadNotificationCount: number;
    }
  | {
      role: 'quality_staff';
      surveillanceDeclarations: number;
      preventionActions: number;
      unreadNotificationCount: number;
    }
  | {
      role: 'tech_admin';
      schemaVersion?: number;
    };

type WorkspaceDashboardState = {
  identityKey: string;
  status: 'loading' | 'success' | 'error';
  data?: WorkspaceDashboardData;
};

interface ModuleCardProps {
  iconName: AppIconName;
  title: string;
  description: string;
  onPress: () => void;
  accentColor?: string;
}

export const AesGuardianWorkspaceScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const locale = useLocale();
  const styles = createStyles(colors, locale);

  const {
    activeRole,
    activeContext,
    setRole,
  } = useDemoRoleStore();

  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dashboardState, setDashboardState] = useState<WorkspaceDashboardState | null>(null);
  const dashboardRequestId = useRef(0);
  const identityKey = `${activeRole}:${activeContext.userId ?? 'unavailable'}`;

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
            } catch (error) {
              setResetting(false);
              const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
              Alert.alert(
                t('reset.errorTitle', locale),
                `${t('reset.errorMessage', locale)} ${errorMessage}`,
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const loadRoleStats = useCallback(async () => {
    const requestId = ++dashboardRequestId.current;
    const currentIdentityKey = `${activeRole}:${activeContext.userId ?? 'unavailable'}`;
    setDashboardState({ identityKey: currentIdentityKey, status: 'loading' });

    try {
      if (activeContext.userId == null) {
        throw new Error('Active demonstration user is unavailable.');
      }

      const db = getDatabase();
      let data: WorkspaceDashboardData;

      if (activeRole === 'exposed_professional') {
        const declarations = await db.getDeclarations({
          userId: activeContext.userId,
          requestingUserId: activeContext.userId,
          limit: 100,
        });
        const unreadNotificationCount = await db.getUnreadNotificationCount(activeContext.userId);
        data = {
          role: activeRole,
          declarationsLoaded: declarations.length,
          correctionRequestsLoaded: declarations.filter(
            (declaration) => declaration.status === 'correction_requested',
          ).length,
          unreadNotificationCount,
        };
      } else if (activeRole === 'admin_reviewer') {
        const reviewQueue = await db.getReviewQueue({
          requestingUserId: activeContext.userId,
          limit: 100,
        });
        const unreadNotificationCount = await db.getUnreadNotificationCount(activeContext.userId);
        data = {
          role: activeRole,
          reviewItemsLoaded: reviewQueue.length,
          unreadNotificationCount,
        };
      } else if (activeRole === 'oh_professional') {
        const coordinations = await db.listOhCoordinationsQueue(activeContext.userId);
        const unreadNotificationCount = await db.getUnreadNotificationCount(activeContext.userId);
        data = {
          role: activeRole,
          activeCoordinations: coordinations.length,
          unreadNotificationCount,
        };
      } else if (activeRole === 'quality_staff') {
        const [surveillance, preventionActions, unreadNotificationCount] = await Promise.all([
          db.getSurveillanceDashboardMetrics(activeContext.userId),
          db.getPreventionOverview(activeContext.userId),
          db.getUnreadNotificationCount(activeContext.userId),
        ]);
        data = {
          role: activeRole,
          surveillanceDeclarations: surveillance.overview.totalDeclarations,
          preventionActions: preventionActions.total,
          unreadNotificationCount,
        };
      } else {
        const versionRes = await db.query<{ version: number | null }>(
          `SELECT MAX(version) as version FROM schema_versions`,
        );
        const schemaVersion = versionRes.rows[0]?.version;
        data = {
          role: 'tech_admin',
          ...(schemaVersion != null ? { schemaVersion } : {}),
        };
      }

      if (dashboardRequestId.current === requestId) {
        setDashboardState({
          identityKey: currentIdentityKey,
          status: 'success',
          data,
        });
      }
    } catch (error) {
      console.warn('[Workspace] loadRoleStats error:', error);
      if (dashboardRequestId.current === requestId) {
        setDashboardState({ identityKey: currentIdentityKey, status: 'error' });
      }
    }
  }, [activeRole, activeContext.userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadRoleStats();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isFocused) {
      dashboardRequestId.current += 1;
      return undefined;
    }
    void loadRoleStats();
    return () => {
      dashboardRequestId.current += 1;
    };
  }, [isFocused, loadRoleStats]);

  const roleDashboardState = dashboardState?.identityKey === identityKey
    ? dashboardState
    : null;
  const dashboardData = roleDashboardState?.status === 'success'
    ? roleDashboardState.data
    : undefined;
  const unreadNotificationCount = dashboardData && dashboardData.role !== 'tech_admin'
    ? dashboardData.unreadNotificationCount
    : 0;

  const activeDef =
    DEMO_ROLE_DEFINITIONS.find((d) => d.role === activeRole) ?? DEMO_ROLE_DEFINITIONS[0];
  const activeRoleLabel = t(activeDef.labelKey as TranslationKey, locale);

  const ModuleCard: React.FC<ModuleCardProps> = ({
    iconName,
    title,
    description,
    onPress,
    accentColor,
  }) => (
    <TouchableOpacity
      style={[
        styles.moduleCard,
        accentColor
          ? locale === 'ar'
            ? { borderRightColor: accentColor, borderRightWidth: 4 }
            : { borderLeftColor: accentColor, borderLeftWidth: 4 }
          : null,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.moduleHeaderRow}>
        <View style={styles.iconCircle}>
          <AppIcon name={iconName} size={22} color={colors.primary} />
        </View>
        <View style={styles.moduleTitleBox}>
          <View style={styles.moduleTitleRow}>
            <AppText style={styles.moduleTitle}>{title}</AppText>
          </View>
          <AppText style={styles.moduleDescription}>{description}</AppText>
        </View>
        <AppIcon name="forward-chevron" size={20} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safeArea}
      testID="workspace-safe-area"
    >
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
            <AppIcon name="shield-check" size={24} color={colors.primary} />
          </View>
          <View style={styles.brandTextContainer}>
            <AppText style={styles.appName}>SANAD</AppText>
            <AppText style={styles.appTagline}>{t('workspace.tagline', locale)}</AppText>
          </View>
          <View style={styles.headerActionsRow} testID="workspace-header-actions">
            {activeRole !== 'tech_admin' && (
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => navigation.navigate('notificationCentre')}
                accessibilityRole="button"
                accessibilityLabel={t('notificationCentre.a11y.unreadBadge', locale)}
                testID="workspace-header-notifications"
              >
                <View style={styles.headerActionSurface}>
                  <AppIcon name="bell" size={20} color={colors.foreground} />
                  {unreadNotificationCount > 0 && (
                    <View style={styles.notifBadge} testID="workspace-unread-badge">
                      <AppText style={styles.notifBadgeText}>
                        {unreadNotificationCount > 99 ? '99+' : String(unreadNotificationCount)}
                      </AppText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('helpGlossary')}
              accessibilityRole="button"
              accessibilityLabel={t('helpGlossary.tabHelp', locale)}
              testID="workspace-header-help"
            >
              <View style={styles.headerActionSurface}>
                <AppIcon name="help-circle" size={20} color={colors.foreground} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => navigation.navigate('aesGuardianProfile')}
              accessibilityRole="button"
              accessibilityLabel={t('profile.title', locale)}
              testID="workspace-header-profile"
            >
              <View style={styles.headerActionSurface}>
                <AppIcon name="user" size={20} color={colors.foreground} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Persistent Prototype Banner */}
      <View style={styles.disclaimerBanner}>
        <View style={styles.bannerRow}>
          <AppIcon name="alert-triangle" size={22} color={colors.warning} />
          <View style={styles.bannerTextBox}>
            <AppText style={styles.bannerTitle}>{t('workspace.disclaimerTitle')}</AppText>
            <AppText style={styles.bannerSubtitle}>{t('workspace.disclaimerText')}</AppText>
          </View>
        </View>
      </View>

      {/* Unified Demonstration Role Selector */}
      <View style={styles.roleSelectorSection}>
        <AppText style={styles.sectionHeaderTitle}>{t('workspace.roleSelectorTitle')}</AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.roleScrollView}
          testID="workspace-role-selector"
          contentContainerStyle={[
            styles.roleScrollContent,
            { flexDirection: locale === 'ar' ? 'row-reverse' : 'row' },
          ]}
        >
          {DEMO_ROLE_DEFINITIONS.map((def) => {
            const isSelected = def.role === activeRole;
            const roleLabel = t(def.labelKey as TranslationKey, locale) || def.defaultLabel;
            return (
              <TouchableOpacity
                key={def.role}
                style={[
                  styles.rolePill,
                  isSelected && styles.rolePillActive,
                ]}
                onPress={() => setRole(def.role)}
                accessibilityRole="button"
                accessibilityLabel={roleLabel}
                accessibilityState={{ selected: isSelected }}
                testID={`workspace-role-${def.role}`}
              >
                <AppText
                  style={[
                    styles.rolePillText,
                    isSelected && styles.rolePillTextActive,
                  ]}
                >
                  {roleLabel}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Current Active Role Profile Card */}
        <View style={styles.activeRoleCard}>
          <View style={styles.activeRoleRow}>
            <View style={styles.avatarCircle}>
              <AppText style={styles.avatarText}>
                {activeRoleLabel.charAt(0).toLocaleUpperCase(locale)}
              </AppText>
            </View>
            <View style={styles.activeRoleInfo}>
              <View style={styles.roleBadgeRow}>
                <AppText style={styles.activeRoleName}>{activeRoleLabel}</AppText>
                <View style={styles.roleChipSmall}>
                  <AppText style={styles.roleChipSmallText}>ID #{activeContext.userId}</AppText>
                </View>
              </View>
              <AppText style={styles.activeRoleDescription}>
                {t(activeDef.descriptionKey as TranslationKey, locale) || activeDef.defaultDescription}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.dashboardSection} testID="workspace-dashboard">
        <AppText variant="section" style={styles.sectionHeaderTitle}>
          {t('workspace.dashboard.title', locale)}
        </AppText>

        {roleDashboardState?.status === 'error' ? (
          <AesCard elevated style={styles.dashboardStateCard}>
            <AppText variant="body" style={styles.dashboardStateText}>
              {t('workspace.dashboard.error', locale)}
            </AppText>
            <AesButton
              title={t('workspace.dashboard.retry', locale)}
              onPress={() => void loadRoleStats()}
              variant="outline"
              style={styles.dashboardRetryButton}
              testID="workspace-dashboard-retry"
            />
          </AesCard>
        ) : !dashboardData ? (
          <AesCard elevated style={styles.dashboardStateCard}>
            <ActivityIndicator
              color={colors.primary}
              accessibilityLabel={t('workspace.dashboard.loading', locale)}
              testID="workspace-dashboard-loading"
            />
            <AppText
              variant="body"
              tone="muted"
              style={styles.dashboardStateText}
              accessibilityLiveRegion="polite"
            >
              {t('workspace.dashboard.loading', locale)}
            </AppText>
          </AesCard>
        ) : (
          <>
            <View
              style={styles.dashboardMetricGrid}
              testID="workspace-dashboard-metric-grid"
            >
              {dashboardData.role === 'exposed_professional' ? (
                <>
                  <DashboardMetricCard
                    icon="document"
                    label={t('workspace.dashboard.ownDeclarations', locale)}
                    value={dashboardData.declarationsLoaded}
                    detail={t('workspace.dashboard.loadedLimit', locale)}
                    testID="workspace-metric-own-declarations"
                  />
                  <DashboardMetricCard
                    icon="alert-circle"
                    label={t('workspace.dashboard.correctionRequests', locale)}
                    value={dashboardData.correctionRequestsLoaded}
                    detail={t('workspace.dashboard.loadedLimit', locale)}
                    testID="workspace-metric-corrections"
                  />
                </>
              ) : null}
              {dashboardData.role === 'admin_reviewer' ? (
                <DashboardMetricCard
                  icon="clipboard-list"
                  label={t('workspace.dashboard.reviewItems', locale)}
                  value={dashboardData.reviewItemsLoaded}
                  detail={t('workspace.dashboard.loadedLimit', locale)}
                  testID="workspace-metric-review-items"
                />
              ) : null}
              {dashboardData.role === 'oh_professional' ? (
                <DashboardMetricCard
                  icon="medical"
                  label={t('workspace.dashboard.activeCoordinations', locale)}
                  value={dashboardData.activeCoordinations}
                  detail={t('workspace.dashboard.activeCoordinationDetail', locale)}
                  testID="workspace-metric-active-coordinations"
                />
              ) : null}
              {dashboardData.role === 'quality_staff' ? (
                <>
                  <DashboardMetricCard
                    icon="chart"
                    label={t('workspace.dashboard.surveillanceDeclarations', locale)}
                    value={dashboardData.surveillanceDeclarations}
                    detail={t('workspace.dashboard.deidentifiedAggregate', locale)}
                    testID="workspace-metric-surveillance"
                  />
                  <DashboardMetricCard
                    icon="target"
                    label={t('workspace.dashboard.preventionActions', locale)}
                    value={dashboardData.preventionActions}
                    detail={t('workspace.dashboard.registeredActions', locale)}
                    testID="workspace-metric-prevention-actions"
                  />
                </>
              ) : null}
              {dashboardData.role === 'tech_admin' ? (
                <>
                  <DashboardMetricCard
                    icon="settings"
                    label={t('workspace.dashboard.databaseEngine', locale)}
                    value="op-sqlite"
                    testID="workspace-metric-database-engine"
                  />
                  <DashboardMetricCard
                    icon="settings"
                    label={t('workspace.dashboard.schemaVersion', locale)}
                    value={dashboardData.schemaVersion != null
                      ? `v${dashboardData.schemaVersion}`
                      : t('workspace.dashboard.unavailable', locale)}
                    testID="workspace-metric-schema-version"
                  />
                </>
              ) : null}
              {dashboardData.role !== 'tech_admin' ? (
                <DashboardMetricCard
                  icon="bell"
                  label={t('workspace.dashboard.unreadNotifications', locale)}
                  value={dashboardData.unreadNotificationCount}
                  testID="workspace-metric-unread-notifications"
                />
              ) : null}
            </View>

            {dashboardData.role !== 'tech_admin' ? (
              <AesCard elevated style={styles.nextActionCard}>
                <AppText variant="label" tone="muted" style={styles.nextActionLabel}>
                  {t('workspace.dashboard.nextAction', locale)}
                </AppText>
                <AesButton
                  title={
                    dashboardData.role === 'exposed_professional'
                      && dashboardData.correctionRequestsLoaded > 0
                      ? t('workspace.dashboard.openCorrections', locale)
                      : dashboardData.role === 'exposed_professional'
                        ? t('workspace.dashboard.openDeclarations', locale)
                        : dashboardData.role === 'admin_reviewer'
                          ? t('workspace.dashboard.openReviewQueue', locale)
                          : dashboardData.role === 'oh_professional'
                            ? t('workspace.dashboard.openOhQueue', locale)
                            : t('workspace.dashboard.openSurveillance', locale)
                  }
                  onPress={() => {
                    if (dashboardData.role === 'exposed_professional') {
                      navigation.navigate('declarations');
                    } else if (dashboardData.role === 'admin_reviewer') {
                      navigation.navigate('adminReviewQueue');
                    } else if (dashboardData.role === 'oh_professional') {
                      navigation.navigate('ohCoordinationQueue');
                    } else if (dashboardData.role === 'quality_staff') {
                      navigation.navigate('surveillanceDashboard');
                    }
                  }}
                  variant="green"
                  style={styles.nextActionButton}
                  testID="workspace-dashboard-next-action"
                />
              </AesCard>
            ) : null}
          </>
        )}
      </View>

      {/* Role-Permitted Modules Grid */}
      <View style={styles.modulesSection}>
        <AppText style={styles.sectionHeaderTitle}>{t('workspace.permittedModulesTitle')}</AppText>

        {/* 1. EXPOSED PROFESSIONAL MODULES */}
        {activeRole === 'exposed_professional' && (
          <>
            <ModuleCard
              iconName="document-add"
              title={t('workspace.module.newDeclaration')}
              description={t('workspace.module.newDeclarationDesc')}
              accentColor={colors.success}
              onPress={() => navigation.navigate('newDeclaration')}
            />
            <ModuleCard
              iconName="clipboard-list"
              title={t('workspace.module.myDeclarations')}
              description={t('workspace.module.myDeclarationsDesc')}
              onPress={() => navigation.navigate('declarations')}
            />
            <View style={styles.privacyNoticeBox}>
              <AppIconLabel name="lock" size="sm" textStyle={styles.privacyNoticeText} style={styles.privacyNoticeRow}>
                {t('workspace.notice.exposedRestrictions')}
              </AppIconLabel>
            </View>
          </>
        )}

        {/* 2. ADMINISTRATIVE REVIEWER MODULES */}
        {activeRole === 'admin_reviewer' && (
          <>
            <ModuleCard
              iconName="scale"
              title={t('workspace.module.adminQueue')}
              description={t('workspace.module.adminQueueDesc')}
              accentColor={colors.warning}
              onPress={() => navigation.navigate('adminReviewQueue')}
            />
            <ModuleCard
              iconName="document"
              title={t('workspace.module.allDeclarations')}
              description={t('workspace.module.allDeclarationsDesc')}
              onPress={() => navigation.navigate('declarations')}
            />
            <ModuleCard
              iconName="chart"
              title={t('workspace.module.surveillanceDashboard')}
              description={t('workspace.module.surveillanceDashboardDesc')}
              accentColor={colors.info}
              onPress={() => navigation.navigate('surveillanceDashboard')}
            />
            <ModuleCard
              iconName="shield-check"
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
              iconName="medical"
              title={t('workspace.module.ohQueue')}
              description={t('workspace.module.ohQueueDesc')}
              accentColor={colors.info}
              onPress={() => navigation.navigate('ohCoordinationQueue')}
            />
            <ModuleCard
              iconName="document"
              title={t('workspace.module.allDeclarations')}
              description={t('workspace.module.allDeclarationsDesc')}
              onPress={() => navigation.navigate('declarations')}
            />
            <ModuleCard
              iconName="chart"
              title={t('workspace.module.surveillanceDashboard')}
              description={t('workspace.module.surveillanceDashboardDesc')}
              accentColor={colors.info}
              onPress={() => navigation.navigate('surveillanceDashboard')}
            />
            <ModuleCard
              iconName="shield-check"
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
              iconName="chart"
              title={t('workspace.module.surveillanceDashboard')}
              description={t('workspace.module.surveillanceDashboardDesc')}
              accentColor={colors.info}
              onPress={() => navigation.navigate('surveillanceDashboard')}
            />
            <ModuleCard
              iconName="target"
              title={t('workspace.module.preventionOverview')}
              description={t('workspace.module.preventionOverviewDesc')}
              accentColor={colors.success}
              onPress={() => navigation.navigate('preventionOverview')}
            />
            <ModuleCard
              iconName="clipboard-list"
              title={t('workspace.module.preventionRegister')}
              description={t('workspace.module.preventionRegisterDesc')}
              onPress={() => navigation.navigate('preventionRegister')}
            />
            <ModuleCard
              iconName="add"
              title={t('workspace.module.preventionCreate')}
              description={t('workspace.module.preventionCreateDesc')}
              onPress={() => navigation.navigate('preventionCreate')}
            />
            <View style={styles.privacyNoticeBox}>
              <AppIconLabel name="lock" size="sm" textStyle={styles.privacyNoticeText} style={styles.privacyNoticeRow}>
                {t('workspace.notice.qualityRestrictions')}
              </AppIconLabel>
            </View>
          </>
        )}

        {/* 5. TECHNICAL ADMINISTRATOR MODULES */}
        {activeRole === 'tech_admin' && (
          <>
            {/* Technical Maintenance Reset Card */}
            <View style={styles.techResetCard}>
              <AppIconLabel name="settings" textStyle={styles.techResetTitle}>
                {t('reset.sectionTitle', locale)}
              </AppIconLabel>
              <AppText style={styles.techResetDesc}>
                {t('reset.sectionDesc', locale)}
              </AppText>

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
                  <AppIconLabel name="alert-triangle" size="sm" color="#ffffff" textStyle={styles.techResetBtnText}>
                    {t('reset.buttonLabel', locale)}
                  </AppIconLabel>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.privacyNoticeBox}>
              <AppIconLabel name="lock" size="sm" textStyle={styles.privacyNoticeText} style={styles.privacyNoticeRow}>
                {t('workspace.notice.techRestrictions')}
              </AppIconLabel>
            </View>
          </>
        )}
      </View>

      {/* Guided Demonstration Roadmap */}
      <View style={styles.scenarioSection}>
        <AppText style={styles.sectionHeaderTitle}>{t('workspace.scenarioTitle')}</AppText>
        <AppText style={styles.sectionHeaderSubtitle}>{t('workspace.scenarioSubtitle')}</AppText>

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
                <AppText style={[styles.stepNumberText, activeRole === item.role ? styles.stepNumberTextActive : null]}>
                  {item.step}
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.stepTitleText}>{item.title}</AppText>
                <AppText style={styles.stepDescText}>{item.desc}</AppText>
              </View>
              {activeRole !== item.role ? (
                <TouchableOpacity
                  style={styles.stepSwitchBtn}
                  onPress={() => setRole(item.role)}
                >
                  <AppText style={styles.stepSwitchBtnText}>{t('workspace.switchRole')}</AppText>
                </TouchableOpacity>
              ) : (
                <View style={styles.stepActiveBadge}>
                  <AppText style={styles.stepActiveBadgeText}>{t('workspace.activeRoleIndicator')}</AppText>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(colors: ColorToken, locale: 'fr' | 'en' | 'ar') {
  const isRtl = locale === 'ar';
  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const textAlign = isRtl ? 'right' : 'left';
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
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
      flexDirection: rowDirection,
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
      letterSpacing: 0.5,
    },
    appTagline: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
    },
    headerActionsRow: {
      flexDirection: rowDirection,
      alignItems: 'center',
      gap: spacing.xs,
    },
    headerActionButton: {
      width: spacing.minTouchTarget,
      height: spacing.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActionSurface: {
      position: 'relative',
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
      backgroundColor: colors.warningBackground,
      ...(isRtl
        ? { borderRightWidth: 4, borderRightColor: colors.warning }
        : { borderLeftWidth: 4, borderLeftColor: colors.warning }),
      borderRadius: shapes.sm,
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    bannerRow: {
      flexDirection: rowDirection,
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    bannerTextBox: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: colors.warning,
      marginBottom: 2,
      textAlign,
    },
    bannerSubtitle: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.warning,
      lineHeight: 16,
      textAlign,
    },
    roleSelectorSection: {
      marginBottom: spacing.lg,
    },
    sectionHeaderTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
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
    roleScrollContent: {
      alignItems: 'center',
    },
    rolePill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      minHeight: spacing.minTouchTarget,
      borderRadius: shapes.full,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
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
      flexDirection: rowDirection,
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
      flexDirection: rowDirection,
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    activeRoleName: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      textAlign,
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
      textAlign,
    },
    dashboardSection: {
      marginBottom: spacing.lg,
    },
    dashboardMetricGrid: {
      flexDirection: rowDirection,
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    dashboardStateCard: {
      alignItems: 'center',
      marginTop: spacing.sm,
      padding: spacing.md,
    },
    dashboardStateText: {
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    dashboardRetryButton: {
      marginTop: spacing.sm,
    },
    nextActionCard: {
      marginTop: spacing.sm,
    },
    nextActionLabel: {
      textAlign,
    },
    nextActionButton: {
      marginTop: spacing.sm,
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
      flexDirection: rowDirection,
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
    moduleTitleBox: {
      flex: 1,
    },
    moduleTitleRow: {
      flexDirection: rowDirection,
      alignItems: 'center',
      marginBottom: 2,
    },
    moduleTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.foreground,
      textAlign,
    },
    moduleDescription: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      lineHeight: 16,
      textAlign,
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
    privacyNoticeRow: {
      flexDirection: rowDirection,
      alignItems: 'flex-start',
      gap: spacing.xs,
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
      flexDirection: rowDirection,
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
      textAlign,
    },
    stepDescText: {
      fontSize: typography.fontSize.xs - 2,
      color: colors.mutedForeground,
      textAlign,
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
      backgroundColor: colors.success,
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      borderRadius: shapes.sm,
    },
    stepActiveBadgeText: {
      fontSize: typography.fontSize.xs - 2,
      color: colors.successForeground,
      fontWeight: typography.fontWeight.bold,
    },
    techResetCard: {
      backgroundColor: colors.dangerBackground,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.danger,
      ...(isRtl
        ? { borderRightWidth: 4, borderRightColor: colors.danger }
        : { borderLeftWidth: 4, borderLeftColor: colors.danger }),
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    techResetTitle: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: colors.danger,
      marginBottom: spacing.xs,
    },
    techResetDesc: {
      fontSize: typography.fontSize.xs - 1,
      color: colors.danger,
      lineHeight: 16,
      marginBottom: spacing.sm,
    },
    techResetBtn: {
      backgroundColor: colors.danger,
      paddingVertical: spacing.sm,
      borderRadius: shapes.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    techResetBtnDisabled: {
      opacity: 0.6,
    },
    techResetBtnText: {
      color: colors.dangerForeground,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
    },
  });
}
