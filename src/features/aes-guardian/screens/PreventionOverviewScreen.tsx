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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  aesColors,
  aesSpacing,
  aesRadii,
  aesTypography,
} from '../../../theme/tokens';
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
  getLayoutTextAlign,
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
  const locale = useLocale();
  const layoutDirection = useLayoutDirection();
  const rtl = layoutDirection === 'rtl';
  const rowDirection = getLayoutRowDirection(layoutDirection);
  const textAlign = getLayoutTextAlign(layoutDirection);
  const styles = createStyles(rtl);
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
          accentBorderColor={aesColors.banners.error.border}
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
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
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
        <AesCard
          elevated
          accentBorderColor={aesColors.banners.error.border}
          testID="prevention-overview-error-card"
        >
          <AppText style={styles.errorText}>{t('error.generic', locale)}</AppText>
          <AesButton
            title={t('prevention.register.retry', locale)}
            onPress={() => setRetryVersion(version => version + 1)}
            variant="outline"
            testID="prevention-overview-retry"
          />
        </AesCard>
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

      <View style={styles.disclaimerBanner} testID="prevention-overview-disclaimer">
        <AppText style={[styles.disclaimerText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t('prevention.disclaimer')}
        </AppText>
      </View>

      <AesCard elevated testID="prevention-overview-declarations">
        <AppText style={styles.metricLabel}>{t('surveillance.overview.total', locale)}</AppText>
        <AppText style={styles.totalValue} testID="prevention-overview-declaration-count">
          {declarationTotal}
        </AppText>
      </AesCard>

      {overview.total === 0 ? (
        <AesCard elevated testID="prevention-overview-empty">
          <AppText style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('prevention.register.empty')}
          </AppText>
        </AesCard>
      ) : (
        <View style={styles.metricsContainer} testID="prevention-overview-metrics">
          <AesCard elevated testID="prevention-overview-total">
            <AppText style={styles.metricLabel}>{t('prevention.overview.total')}</AppText>
            <AppText style={styles.totalValue}>{overview.total}</AppText>
          </AesCard>

          {statusCards.map(({ status, value, labelKey }) => (
            <AesCard
              key={status}
              elevated
              testID={`prevention-overview-status-${status}`}
              accentBorderColor={aesColors.status.capa[status].border}
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
              </View>
              <AppText style={[styles.statusLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                {t(labelKey)}
              </AppText>
            </AesCard>
          ))}
        </View>
      )}

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

function createStyles(rtl: boolean) {
  return StyleSheet.create({
    containerContent: {
      flexGrow: 1,
    },
    activeRoleContainer: {
      marginHorizontal: aesSpacing.screenHorizontal,
      marginBottom: aesSpacing.sm,
    },
    activeRoleLabel: {
      ...aesTypography.caption,
      color: aesColors.textSecondary,
      textAlign: rtl ? 'right' : 'left',
    },
    disclaimerBanner: {
      backgroundColor: aesColors.banners.warning.bg,
      borderStartWidth: 4,
      borderStartColor: aesColors.banners.warning.border,
      marginHorizontal: aesSpacing.screenHorizontal,
      marginTop: aesSpacing.sm,
      padding: aesSpacing.sm,
      borderRadius: aesRadii.badge,
    },
    disclaimerText: {
      ...aesTypography.bodySmall,
      color: aesColors.banners.warning.text,
    },
    unauthorizedText: {
      ...aesTypography.heading2,
      color: aesColors.banners.error.text,
      textAlign: 'center',
    },
    unauthorizedDetail: {
      ...aesTypography.bodySmall,
      color: aesColors.textSecondary,
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
      color: aesColors.textSecondary,
      marginTop: aesSpacing.md,
      textAlign: 'center',
    },
    errorText: {
      ...aesTypography.body,
      color: aesColors.banners.error.text,
      textAlign: 'center',
    },
    emptyText: {
      ...aesTypography.body,
      color: aesColors.textSecondary,
    },
    metricsContainer: {
      marginHorizontal: aesSpacing.screenHorizontal,
      marginTop: aesSpacing.sm,
    },
    metricLabel: {
      ...aesTypography.label,
      color: aesColors.textSecondary,
      textAlign: rtl ? 'right' : 'left',
    },
    totalValue: {
      ...aesTypography.statValueLarge,
      color: aesColors.accentGreen,
      textAlign: rtl ? 'right' : 'left',
      marginTop: aesSpacing.xs,
    },
    statusCardHeader: {
      flexDirection: rtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusValue: {
      ...aesTypography.statValue,
      color: aesColors.textPrimary,
    },
    statusLabel: {
      ...aesTypography.bodySmall,
      color: aesColors.textSecondary,
      marginTop: aesSpacing.xs,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: aesSpacing.sm,
      marginHorizontal: aesSpacing.screenHorizontal,
      marginVertical: aesSpacing.lg,
    },
  });
}
