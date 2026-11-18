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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
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
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  AuthContext,
  PreventionOverview,
} from '../../../core';
import { t, useLocale, isRTL } from '../../../localization';
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

const DEMO_ROLES: Array<{ key: string; label: string; context: AuthContext }> = [
  { key: 'quality_staff',       label: 'Qualité (Autorisé)',   context: SYNTHETIC_QUALITY_STAFF_CONTEXT },
  { key: 'admin_reviewer',      label: 'Admin RH (Autorisé)',  context: SYNTHETIC_ADMIN_REVIEWER_CONTEXT },
  { key: 'oh_professional',     label: 'SST (Autorisé)',       context: SYNTHETIC_OH_PROFESSIONAL_CONTEXT },
  { key: 'exposed_professional',label: 'Exposé (Bloqué)',      context: SYNTHETIC_DEMO_CONTEXT },
  { key: 'tech_admin',          label: 'Tech Admin (Bloqué)',  context: SYNTHETIC_TECH_ADMIN_CONTEXT },
];

export const PreventionOverviewScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const styles = createStyles(rtl);
  const DEMO_ROLES_LOCALIZED = useMemo(() => DEMO_ROLES, [locale]);

  const [activeRoleContext, setActiveRoleContext] = useState<AuthContext>(SYNTHETIC_QUALITY_STAFF_CONTEXT);
  const isAuthorized = canViewPreventionActions(activeRoleContext);
  const canManage   = canManagePreventionActions(activeRoleContext);

  const [overview, setOverview] = useState<PreventionOverview | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setOverview(null);
    setError(null);
    if (!isAuthorized || !activeRoleContext.userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = await getDatabase();
      const data = await db.getPreventionOverview(activeRoleContext.userId);
      setOverview(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [activeRoleContext, isAuthorized]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const renderRoleSwitcher = () => (
    <View style={styles.roleSwitcherContainer} testID="prevention-role-switcher">
      <Text style={styles.roleSwitcherLabel}>{activeRoleContext.displayName}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roleSwitcherContent}
      >
          {DEMO_ROLES_LOCALIZED.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.roleChip,
                activeRoleContext.role === r.context.role
                  ? styles.roleChipActive
                  : styles.roleChipInactive,
              ]}
              onPress={() => setActiveRoleContext(r.context)}
              testID={`prevention-role-${r.key}`}
              accessibilityRole="button"
              accessibilityLabel={`${r.context.displayName}${canViewPreventionActions(r.context) ? '' : ` (${t('prevention.unauthorized')})`}`}
              accessibilityState={{ selected: activeRoleContext.role === r.context.role }}
            >
              <Text style={[
                styles.roleChipText,
                activeRoleContext.role === r.context.role
                  ? styles.roleChipTextActive
                  : styles.roleChipTextInactive,
              ]}>{r.context.displayName}</Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
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
        {renderRoleSwitcher()}
        <AesCard
          elevated
          accentBorderColor={aesColors.banners.error.border}
          testID="prevention-overview-unauthorized-card"
        >
          <Text style={styles.unauthorizedText}>{t('prevention.unauthorized')}</Text>
          <Text style={styles.unauthorizedDetail}>
            {activeRoleContext.displayName} ({activeRoleContext.role})
          </Text>
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
        {renderRoleSwitcher()}
        <View style={styles.centeredState} testID="prevention-overview-loading-state">
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
          <Text style={styles.loadingText}>{t('app.loading')}</Text>
        </View>
      </AesScreenContainer>
    );
  }

  if (error || !overview) {
    return (
      <AesScreenContainer scrollable testID="prevention-overview-error">
        <AesScreenHeader
          title={t('prevention.overview.title')}
          subtitle={t('prevention.title')}
          testID="prevention-overview-header"
        />
        {renderRoleSwitcher()}
        <AesCard
          elevated
          accentBorderColor={aesColors.banners.error.border}
          testID="prevention-overview-error-card"
        >
          <Text style={styles.errorText}>{error ?? t('error.generic')}</Text>
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
      {renderRoleSwitcher()}

      <View style={styles.disclaimerBanner} testID="prevention-overview-disclaimer">
        <Text style={[styles.disclaimerText, { textAlign: rtl ? 'right' : 'left' }]}>
          {t('prevention.disclaimer')}
        </Text>
      </View>

      {overview.total === 0 ? (
        <AesCard elevated testID="prevention-overview-empty">
          <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('prevention.register.empty')}
          </Text>
        </AesCard>
      ) : (
        <View style={styles.metricsContainer} testID="prevention-overview-metrics">
          <AesCard elevated testID="prevention-overview-total">
            <Text style={styles.metricLabel}>{t('prevention.overview.total')}</Text>
            <Text style={styles.totalValue}>{overview.total}</Text>
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
                <Text
                  style={styles.statusValue}
                  testID={`prevention-overview-count-${status}`}
                >
                  {value}
                </Text>
              </View>
              <Text style={[styles.statusLabel, { textAlign: rtl ? 'right' : 'left' }]}>
                {t(labelKey)}
              </Text>
            </AesCard>
          ))}
        </View>
      )}

      <View style={styles.actionRow}>
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
    roleSwitcherContainer: {
      flexDirection: rtl ? 'column' : 'column',
      marginHorizontal: aesSpacing.screenHorizontal,
      marginBottom: aesSpacing.sm,
    },
    roleSwitcherLabel: {
      ...aesTypography.caption,
      color: aesColors.textSecondary,
      marginBottom: aesSpacing.xs,
      textAlign: rtl ? 'right' : 'left',
    },
    roleSwitcherContent: {
      flexDirection: rtl ? 'row-reverse' : 'row',
    },
    roleChip: {
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: aesSpacing.md,
      borderRadius: aesRadii.pill,
      borderWidth: 1,
      marginRight: rtl ? 0 : aesSpacing.xs,
      marginLeft: rtl ? aesSpacing.xs : 0,
    },
    roleChipActive: {
      backgroundColor: aesColors.primaryAction,
      borderColor: aesColors.primaryAction,
    },
    roleChipInactive: {
      backgroundColor: aesColors.surfaceSubdued,
      borderColor: aesColors.borderMedium,
    },
    roleChipText: {
      ...aesTypography.labelSmall,
    },
    roleChipTextActive: {
      color: aesColors.textInverse,
    },
    roleChipTextInactive: {
      color: aesColors.textPrimary,
    },
    disclaimerBanner: {
      backgroundColor: aesColors.banners.warning.bg,
      borderLeftWidth: 4,
      borderLeftColor: aesColors.banners.warning.border,
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
