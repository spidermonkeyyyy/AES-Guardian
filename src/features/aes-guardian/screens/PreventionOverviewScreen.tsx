/**
 * AES Guardian — Prevention Overview Screen (Phase 2C.6)
 *
 * Aggregate counts for the prevention-action register.
 * Access: quality_staff (full CRUD), admin_reviewer, oh_professional (read-only).
 * Strictly prohibited: exposed_professional, tech_admin.
 *
 * Displays synthetic demonstration data only.
 * Does not perform clinical analysis or risk scoring.
 */

import AppText from '../../../components/AppText';
import { AppIcon } from '../../../components/AppIcon';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
} from '../../../components';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  aesSpacing,
  aesRadii,
  aesTypography,
} from '../../../theme/tokens';
import type { ColorToken } from '../../../theme/tokens/colors';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  canManagePreventionActions,
  canViewPreventionActions,
  useDemoRoleStore,
  type AesGuardianRole,
  type PreventionOverview,
  type SurveillanceDashboardMetrics,
} from '../../../core';
import {
  t,
  useLocale,
  useLayoutDirection,
  getLayoutRowDirection,
  type TranslationKey,
} from '../../../localization';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/routes';
import {
  AesScreenContainer,
  AesScreenHeader,
  AesCard,
  AesStatusBadge,
  AesButton,
} from '../components';
import { AnimatedProgressCard, CircleProgress } from '../../../components';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ROLE_LABEL_KEYS: Record<AesGuardianRole, TranslationKey> = {
  exposed_professional: 'role.exposed_professional',
  admin_reviewer: 'role.admin_reviewer',
  oh_professional: 'role.oh_professional',
  quality_staff: 'role.quality_staff',
  tech_admin: 'role.tech_admin',
};

export const PreventionOverviewScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { colors: themeColors } = useTheme();
  const locale = useLocale();
  const layoutDirection = useLayoutDirection();
  const rtl = layoutDirection === 'rtl';
  const rowDirection = getLayoutRowDirection(layoutDirection);
  const styles = createStyles(themeColors, rtl);
  const activeRole = useDemoRoleStore(state => state.activeRole);
  const activeContext = useDemoRoleStore(state => state.activeContext);
  const userId = activeContext.userId;
  const isAuthorized = canViewPreventionActions(activeContext);
  const canManage = canManagePreventionActions(activeContext);
  const requestVersion = useRef(0);

  const [overview, setOverview] = useState<PreventionOverview | null>(null);
  const [declarationTotal, setDeclarationTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryVersion, setRetryVersion] = useState(0);

  const loadOverview = useCallback(async () => {
    const request = ++requestVersion.current;
    setOverview(null);
    setDeclarationTotal(null);
    setError(false);
    if (!isAuthorized || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase();
      const [data, surveillance]: [
        PreventionOverview,
        SurveillanceDashboardMetrics,
      ] = await Promise.all([
        db.getPreventionOverview(userId),
        db.getSurveillanceDashboardMetrics(userId),
      ]);
      const currentContext = useDemoRoleStore.getState().activeContext;
      if (request === requestVersion.current && currentContext === activeContext) {
        setOverview(data);
        setDeclarationTotal(surveillance.overview.totalDeclarations);
      }
    } catch {
      const currentContext = useDemoRoleStore.getState().activeContext;
      if (request === requestVersion.current && currentContext === activeContext) {
        setError(true);
      }
    } finally {
      const currentContext = useDemoRoleStore.getState().activeContext;
      if (request === requestVersion.current && currentContext === activeContext) {
        setLoading(false);
      }
    }
  }, [activeContext, isAuthorized, userId]);

  useEffect(() => {
    void loadOverview();
    const unsubscribe = navigation.addListener('focus', () => {
      void loadOverview();
    });
    return () => {
      unsubscribe();
      requestVersion.current += 1;
    };
  }, [loadOverview, navigation, retryVersion]);

  const renderActiveRole = () => (
    <View style={styles.activeRoleContainer} testID="prevention-overview-active-role">
      <AppText style={styles.activeRoleLabel}>{t(ROLE_LABEL_KEYS[activeRole], locale)}</AppText>
    </View>
  );

  if (!isAuthorized) {
    return (
      <AesScreenContainer scrollable testID="prevention-overview-unauthorized">
        <AesScreenHeader
          title={t('prevention.overview.title')}
          subtitle={t('prevention.title')}
          overline={t('prevention.title')}
          testID="prevention-overview-header"
        />
        {renderActiveRole()}
        <AesCard
          elevated
          accentBorderColor={themeColors.destructive}
          testID="prevention-overview-unauthorized-card"
        >
          <AppText style={styles.unauthorizedText}>{t('prevention.unauthorized')}</AppText>
          <AppText style={styles.unauthorizedDetail}>
            {t(ROLE_LABEL_KEYS[activeRole], locale)}
          </AppText>
        </AesCard>
      </AesScreenContainer>
    );
  }

  if (loading) {
    return (
      <AesScreenContainer scrollable testID="prevention-overview-loading">
        <AesScreenHeader
          title={t('prevention.overview.title')}
          subtitle={t('prevention.title')}
          testID="prevention-overview-header"
        />
        {renderActiveRole()}
        <View style={styles.centeredState} testID="prevention-overview-loading-state">
          <ActivityIndicator size="large" color={themeColors.primary} />
          <AppText style={styles.loadingText}>{t('app.loading')}</AppText>
        </View>
      </AesScreenContainer>
    );
  }

  if (error || !overview || declarationTotal === null) {
    return (
      <AesScreenContainer scrollable testID="prevention-overview-error">
        <AesScreenHeader
          title={t('prevention.overview.title')}
          subtitle={t('prevention.title')}
          testID="prevention-overview-header"
        />
        {renderActiveRole()}
        <Alert
          variant="error"
          accessibilityRole="alert"
          testID="prevention-overview-error-card"
        >
          <AlertIcon>
            <AppIcon name="alert-triangle" size={32} decorative />
          </AlertIcon>
          <AlertDescription>{t('error.generic', locale)}</AlertDescription>
          <AlertAction>
            <AesButton
              title={t('prevention.register.retry', locale)}
              onPress={() => setRetryVersion(version => version + 1)}
              variant="outline"
              testID="prevention-overview-retry"
            />
          </AlertAction>
        </Alert>
      </AesScreenContainer>
    );
  }

  const statusCards: Array<{ status: 'proposed' | 'in_progress' | 'completed' | 'cancelled'; value: number; labelKey: 'prevention.overview.proposed' | 'prevention.overview.in_progress' | 'prevention.overview.completed' | 'prevention.overview.cancelled' }> = [
    { status: 'proposed', value: overview.proposed, labelKey: 'prevention.overview.proposed' },
    { status: 'in_progress', value: overview.in_progress, labelKey: 'prevention.overview.in_progress' },
    { status: 'completed', value: overview.completed, labelKey: 'prevention.overview.completed' },
    { status: 'cancelled', value: overview.cancelled, labelKey: 'prevention.overview.cancelled' },
  ];

  return (
    <AesScreenContainer
      scrollable
      testID="prevention-overview"
      contentContainerStyle={styles.containerContent}
    >
      <AesScreenHeader
        title={t('prevention.overview.title')}
        subtitle={t('prevention.title')}
        overline={t('prevention.title')}
        testID="prevention-overview-header"
      />
      {renderActiveRole()}

      <Alert
        variant="warning"
        layout="block"
        dismissible={false}
        testID="prevention-overview-disclaimer"
        accessibilityRole="summary"
      >
        <AlertIcon>
          <AppIcon name="alert-triangle" size={16} decorative />
        </AlertIcon>
        <AlertDescription>{t('prevention.disclaimer')}</AlertDescription>
      </Alert>

      <AesCard
        elevated
        testID="prevention-overview-declarations"
      >
        <View
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${t('surveillance.overview.total', locale)}: ${declarationTotal}`}
        >
          <AppText style={styles.metricLabel}>{t('surveillance.overview.total', locale)}</AppText>
          <AppText style={styles.totalValue} testID="prevention-overview-declaration-count">
            {declarationTotal}
          </AppText>
        </View>
      </AesCard>

      {overview.total === 0 && (
        <AesCard elevated testID="prevention-overview-empty">
          <AppText style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('prevention.register.empty')}
          </AppText>
        </AesCard>
      )}
      <View
        style={[styles.metricsContainer, { flexDirection: rowDirection }]}
        testID="prevention-overview-metrics"
      >
          <AesCard
            elevated
            style={styles.metricCard}
            testID="prevention-overview-total"
          >
            <View
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${t('prevention.overview.total', locale)}: ${overview.total}`}
            >
              <AppText style={styles.metricLabel}>{t('prevention.overview.total')}</AppText>
              <AppText style={styles.totalValue}>{overview.total}</AppText>
            </View>
          </AesCard>

          {statusCards.map(({ status, value, labelKey }) => (
            <AesCard
              key={status}
              elevated
              style={styles.metricCard}
              testID={`prevention-overview-status-${status}`}
            >
              <View
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${t(labelKey, locale)}: ${value}`}
                style={styles.statusCardContent}
              >
                <View style={styles.statusCardHeader}>
                  <AesStatusBadge
                    status={status}
                    domain="capa"
                    testID={`prevention-overview-badge-${status}`}
                  />
                  <AppText
                    style={styles.statusValue}
                    testID={`prevention-overview-count-${status}`}
                  >
                    {value}
                  </AppText>
                  {status === 'completed' &&
                    Number.isFinite(overview.total) &&
                    overview.total > 0 &&
                    Number.isFinite(value) &&
                    value >= 0 ? (
                      <CircleProgress
                        value={Math.min(value, overview.total)}
                        maxValue={overview.total}
                        size={48}
                        strokeWidth={5}
                        showValue
                        accessibilityLabel={t('prevention.progress.title', locale)}
                        accessibilityValueText={`${Math.min(value, overview.total)} / ${overview.total}`}
                        testID="prevention-overview-completion-progress"
                      />
                    ) : null}
                </View>
                <AppText style={[styles.statusLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                  {t(labelKey)}
                </AppText>
              </View>
            </AesCard>
          ))}
      </View>

      {Number.isFinite(overview.total) &&
        overview.total > 0 &&
        Number.isFinite(overview.completed) &&
        overview.completed >= 0 ? (
          <View testID="prevention-overview-animated-progress">
            <AnimatedProgressCard
              icon={<AppIcon name="check-circle" size={18} color={themeColors.primaryForeground} decorative />}
              title={t('prevention.progress.title', locale)}
              progressLabel={t('prevention.progress.label', locale)}
              progressSubLabel={t('prevention.progress.subLabel', locale)}
              currentValue={Math.min(overview.completed, overview.total)}
              maxValue={overview.total}
              testID="prevention-overview-capa-progress-card"
            />
          </View>
        ) : null}

      <View style={[styles.actionRow, { flexDirection: rowDirection }]}>
        <AesButton
          title={t('prevention.overview.viewRegister')}
          onPress={() => navigation.navigate('preventionRegister')}
          variant="outline"
          fullWidth
          testID="prevention-overview-view-register"
        />
        {canManage && (
          <AesButton
            title={t('prevention.overview.newAction')}
            onPress={() => navigation.navigate('preventionCreate')}
            variant="green"
            fullWidth
            testID="prevention-overview-create-action"
          />
        )}
      </View>
    </AesScreenContainer>
  );
};

function createStyles(themeColors: ColorToken, rtl: boolean) {
  return StyleSheet.create({
    containerContent: {
      flexGrow: 1,
    },
    activeRoleContainer: {
      marginBottom: aesSpacing.sm,
    },
    activeRoleLabel: {
      ...aesTypography.caption,
      color: themeColors.mutedForeground,
      textAlign: rtl ? 'right' : 'left',
    },
    disclaimerBanner: {
      backgroundColor: themeColors.warningBackground,
      borderStartWidth: 4,
      borderStartColor: themeColors.warning,
      marginTop: aesSpacing.sm,
      padding: aesSpacing.sm,
      borderRadius: aesRadii.badge,
    },
    disclaimerText: {
      ...aesTypography.bodySmall,
      color: themeColors.foreground,
    },
    unauthorizedText: {
      ...aesTypography.heading2,
      color: themeColors.danger,
      textAlign: 'center',
    },
    unauthorizedDetail: {
      ...aesTypography.bodySmall,
      color: themeColors.mutedForeground,
      textAlign: 'center',
      marginTop: aesSpacing.sm,
    },
    centeredState: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 160,
      marginHorizontal: aesSpacing.screenHorizontal,
    },
    loadingText: {
      ...aesTypography.body,
      color: themeColors.mutedForeground,
      marginTop: aesSpacing.md,
      textAlign: 'center',
    },
    errorText: {
      ...aesTypography.body,
      color: themeColors.danger,
      textAlign: 'center',
    },
    emptyText: {
      ...aesTypography.body,
      color: themeColors.mutedForeground,
    },
    metricsContainer: {
      marginTop: aesSpacing.sm,
      flexWrap: 'wrap',
      gap: aesSpacing.xs,
    },
    metricCard: {
      flexBasis: '48%',
      flexGrow: 1,
      minWidth: 132,
    },
    metricLabel: {
      ...aesTypography.label,
      color: themeColors.mutedForeground,
      textAlign: rtl ? 'right' : 'left',
    },
    totalValue: {
      ...aesTypography.statValueLarge,
      color: themeColors.primary,
      textAlign: rtl ? 'right' : 'left',
      marginTop: aesSpacing.xs,
    },
    statusCardHeader: {
      flexDirection: rtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusCardContent: {
      minHeight: 72,
      justifyContent: 'center',
    },
    statusValue: {
      ...aesTypography.statValue,
      color: themeColors.foreground,
    },
    statusLabel: {
      ...aesTypography.bodySmall,
      color: themeColors.mutedForeground,
      marginTop: aesSpacing.xs,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: aesSpacing.sm,
      marginVertical: aesSpacing.lg,
    },
  });
}
