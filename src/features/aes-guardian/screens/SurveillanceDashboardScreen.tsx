/**
 * AES Guardian — Surveillance Dashboard Screen (Phase 2E.1.7.1 Batch 7)
 *
 * Aggregate monitoring and surveillance view across declarations,
 * administrative reviews, and occupational-health coordination events.
 *
 * Strict Privacy & Clinical Safety:
 * - Displays aggregate metrics, distributions, and percentages only.
 * - Zero personal identifiers, names, reference numbers, or clinical narratives.
 * - Role-scoped access: quality_staff, admin_reviewer, oh_professional.
 * - Disallowed: exposed_professional, tech_admin.
 * - Interactive filters: Status, Incident Type, Date Range.
 *
 * UI Transformation: Uses AES shared components (AesScreenContainer, AesScreenHeader,
 * AesCard, AesButton, AesStatusBadge) and design tokens per Phase 2E UI Blueprint.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import {
  AesScreenContainer,
  AesScreenHeader,
  AesCard,
  AesButton,
  AesStatusBadge,
} from '../components';
import { aesColors, aesSpacing, aesRadii, aesTypography, aesShadows } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { useLocale, isRTL } from '../../../localization';
import {
  getDatabase,
  canViewSurveillanceDashboard,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  AuthContext,
  SurveillanceDashboardMetrics,
  SurveillanceFilters,
  DeclarationStatus,
  AesIncidentType,
  ReviewOutcome,
  OhCoordinationStatus,
  OhFollowUpEventCategory,
  DECLARATION_STATUSES,
  AES_INCIDENT_TYPES,
} from '../../../core';
import { t } from '../../../localization';

const DEMO_ROLES: Array<{ key: string; label: string; context: AuthContext }> = [
  { key: 'quality_staff', label: t('surveillance.filters.all'), context: SYNTHETIC_QUALITY_STAFF_CONTEXT },
  { key: 'admin_reviewer', label: t('surveillance.filters.all'), context: SYNTHETIC_ADMIN_REVIEWER_CONTEXT },
  { key: 'oh_professional', label: t('surveillance.filters.all'), context: SYNTHETIC_OH_PROFESSIONAL_CONTEXT },
  { key: 'exposed_professional', label: t('surveillance.filters.all'), context: SYNTHETIC_DEMO_CONTEXT },
  { key: 'tech_admin', label: t('surveillance.filters.all'), context: SYNTHETIC_TECH_ADMIN_CONTEXT },
];

const STATUS_LABEL_MAP: Record<DeclarationStatus, string> = {
  draft: t('surveillance.overview.draft'),
  submitted: t('surveillance.overview.submitted'),
  under_review: t('surveillance.overview.underReview'),
  correction_requested: t('surveillance.overview.correctionRequested'),
  resubmitted: t('surveillance.overview.resubmitted'),
  closed: t('surveillance.overview.closed'),
};

const EXPOSURE_LABEL_MAP: Record<AesIncidentType, string> = {
  percutaneous_exposure: t('form.incidentType.percutaneous'),
  mucocutaneous_exposure: t('form.incidentType.mucocutaneous'),
  sexual_assault: t('form.incidentType.sexual_assault'),
  other: t('form.incidentType.other'),
};

const MIN_TOUCH_TARGET = 48;

const getRowDirection = (rtl: boolean): 'row' | 'row-reverse' => (rtl ? 'row-reverse' : 'row');

export const SurveillanceDashboardScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);

  const DEMO_ROLES_LOCALIZED = useMemo(() => [
    { key: 'quality_staff', label: t('surveillance.filters.all'), context: SYNTHETIC_QUALITY_STAFF_CONTEXT },
    { key: 'admin_reviewer', label: t('surveillance.filters.all'), context: SYNTHETIC_ADMIN_REVIEWER_CONTEXT },
    { key: 'oh_professional', label: t('surveillance.filters.all'), context: SYNTHETIC_OH_PROFESSIONAL_CONTEXT },
    { key: 'exposed_professional', label: t('surveillance.filters.all'), context: SYNTHETIC_DEMO_CONTEXT },
    { key: 'tech_admin', label: t('surveillance.filters.all'), context: SYNTHETIC_TECH_ADMIN_CONTEXT },
  ], [locale]);

  const [activeRoleContext, setActiveRoleContext] = useState<AuthContext>(SYNTHETIC_QUALITY_STAFF_CONTEXT);
  const isAuthorized = canViewSurveillanceDashboard(activeRoleContext);

  const [metrics, setMetrics] = useState<SurveillanceDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<DeclarationStatus | undefined>(undefined);
  const [selectedExposure, setSelectedExposure] = useState<AesIncidentType | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadMetrics = useCallback(async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    try {
      const db = getDatabase();
      const filters: SurveillanceFilters = {};
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedExposure) filters.incidentType = selectedExposure;
      if (startDate.trim().length === 10) filters.startDate = startDate.trim();
      if (endDate.trim().length === 10) filters.endDate = endDate.trim();

      const data = await db.getSurveillanceDashboardMetrics(activeRoleContext.userId!, filters);
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? t('error.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthorized, activeRoleContext, selectedStatus, selectedExposure, startDate, endDate]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadMetrics();
  }, [loadMetrics]);

  const clearFilters = () => {
    setSelectedStatus(undefined);
    setSelectedExposure(undefined);
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = selectedStatus || selectedExposure || startDate || endDate;

  // Destructure metrics arrays with defaults (used in useMemo hooks that must be called unconditionally)
  const temporalDistribution = metrics?.temporalDistribution ?? [];
  const exposureDistribution = metrics?.exposureDistribution ?? [];
  const statusDistribution = metrics?.statusDistribution ?? [];
  const filterSummary = metrics?.filterSummary;

  // These useMemo hooks MUST be called unconditionally before any early returns
  // to maintain consistent hook call order across all render paths
  const maxTemporalCount = useMemo(
    () => Math.max(...temporalDistribution.map(t => t.count), 1),
    [temporalDistribution],
  );
  const maxExposureCount = useMemo(
    () => Math.max(...exposureDistribution.map(e => e.count), 1),
    [exposureDistribution],
  );

  const renderRoleSwitcher = () => (
    <View style={styles.roleSwitcherContainer} testID="surveillance-role-switcher">
      <Text style={styles.roleSwitcherLabel}>
        {t('surveillance.roleBadge')} :
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.roleSwitcherScroll}
        contentContainerStyle={styles.roleSwitcherContent}
      >
        {DEMO_ROLES_LOCALIZED.map(r => {
          const active = activeRoleContext.role === r.context.role;
          const isBlocked = !canViewSurveillanceDashboard(r.context);
          return (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.rolePill,
                {
                  backgroundColor: active
                    ? isBlocked
                      ? aesColors.banners.error.bg
                      : aesColors.primaryAction
                    : aesColors.surfaceSubdued,
                  borderColor: active ? 'transparent' : aesColors.borderMedium,
                },
              ]}
              onPress={() => setActiveRoleContext(r.context)}
              disabled={active}
              testID={`role-pill-${r.key}`}
              accessibilityRole="button"
              accessibilityLabel={`${r.label}${isBlocked ? ` (${t('surveillance.unauthorized')})` : ''}`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.rolePillText,
                  {
                    color: active
                      ? isBlocked
                        ? aesColors.banners.error.text
                        : aesColors.textInverse
                      : aesColors.textPrimary,
                  },
                ]}
              >
                {r.context.displayName} {isBlocked ? '🚫' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (!isAuthorized) {
    return (
      <AesScreenContainer scrollable testID="surveillance-unauthorized">
        <StatusBar barStyle="dark-content" backgroundColor={aesColors.canvas} animated />
        {renderRoleSwitcher()}
        <AesCard
          style={styles.unauthorizedCard}
          elevated={true}
          accentBorderColor={aesColors.banners.error.border}
          testID="surveillance-unauthorized-card"
        >
          <View style={styles.unauthorizedContent}>
            <Icon name="alert-circle" size={32} color={aesColors.banners.error.text} style={styles.unauthorizedIcon} />
            <Text style={[styles.unauthorizedTitle, { color: aesColors.banners.error.text }]}>
              {t('surveillance.unauthorized')}
            </Text>
            <Text style={[styles.unauthorizedSubtext, { color: aesColors.textSecondary, textAlign: 'center' }]}>
              {t('surveillance.unauthorized')}
              {'\n\n'}
              Profil sélectionné : {activeRoleContext.displayName} ({activeRoleContext.role}).
              Ce profil ne dispose pas des autorisations nécessaires pour accéder aux indicateurs agrégés de surveillance.
            </Text>
            {renderRoleSwitcher()}
          </View>
        </AesCard>
      </AesScreenContainer>
    );
  }

  if (loading) {
    return (
      <AesScreenContainer scrollable testID="surveillance-loading">
        <StatusBar barStyle="dark-content" backgroundColor={aesColors.canvas} animated />
        {renderRoleSwitcher()}
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="large" color={aesColors.primaryAction} />
          <Text style={styles.loadingText}>{t('app.loading')}</Text>
        </View>
      </AesScreenContainer>
    );
  }

  if (error || !metrics) {
    return (
      <AesScreenContainer scrollable testID="surveillance-error">
        <StatusBar barStyle="dark-content" backgroundColor={aesColors.canvas} animated />
        {renderRoleSwitcher()}
        <AesCard style={styles.errorCard} elevated testID="surveillance-error-card">
          <View style={styles.errorContent}>
            <Icon name="alert-triangle" size={32} color={aesColors.banners.error.text} style={styles.errorIcon} />
            <Text style={[styles.errorTitle, { color: aesColors.banners.error.text }]}>{error ?? t('error.loadFailed')}</Text>
            <AesButton
              title={t('oh.queue.refresh')}
              onPress={loadMetrics}
              variant="primary"
              fullWidth={false}
              testID="surveillance-retry-button"
            />
          </View>
        </AesCard>
      </AesScreenContainer>
    );
  }

  // At this point, metrics is guaranteed non-null (TypeScript control flow narrowing)
  const overview = metrics.overview;
  const administrativeReview = metrics.administrativeReview;
  const occupationalHealth = metrics.occupationalHealth;

  // RTL-aware layout styles computed from the `rtl` value
  const disclaimerRowStyle: ViewStyle = { ...styles.disclaimerRow, flexDirection: getRowDirection(rtl) };
  const filterSummaryRowStyle: ViewStyle = { ...styles.filterSummaryRow, flexDirection: getRowDirection(rtl) };
  const filtersHeaderStyle: ViewStyle = { ...styles.filtersHeader, flexDirection: getRowDirection(rtl) };
  const dateRowStyle: ViewStyle = { ...styles.dateRow, flexDirection: getRowDirection(rtl) };
  const kpiGridStyle: ViewStyle = { ...styles.kpiGrid, flexDirection: getRowDirection(rtl) };
  const barRowStyle: ViewStyle = { ...styles.barRow, flexDirection: getRowDirection(rtl) };
  const distributionRowStyle: ViewStyle = { ...styles.distributionRow, flexDirection: getRowDirection(rtl) };
  const adminSummaryRowStyle: ViewStyle = { ...styles.adminSummaryRow, flexDirection: getRowDirection(rtl) };

  return (
    <AesScreenContainer scrollable testID="surveillance-dashboard">
      <StatusBar barStyle="dark-content" backgroundColor={aesColors.canvas} animated />

      <AesScreenHeader
        title={t('surveillance.title')}
        subtitle={t('surveillance.disclaimer')}
        overline={t('surveillance.nav.title')}
        rightElement={renderRoleSwitcher()}
        testID="surveillance-header"
      />

      <AesCard style={styles.disclaimerCard} elevated={false} testID="surveillance-disclaimer">
        <View style={disclaimerRowStyle}>
          <Icon name="info" size={16} color={aesColors.accentGreen} style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerText}>{t('surveillance.disclaimer')}</Text>
        </View>
      </AesCard>

      {filterSummary?.hasActiveFilters && (
        <AesCard
          style={styles.filterSummaryCard}
          elevated={false}
          accentBorderColor={aesColors.accentGreen}
          testID="surveillance-filter-summary"
        >
          <View style={filterSummaryRowStyle}>
            <Icon name="filter" size={16} color={aesColors.accentGreen} />
            <Text style={styles.filterSummaryText}>
              {t('surveillance.filters.title')} : {filterSummary.matchingDeclarations} / {filterSummary.totalRecords} déclarations
            </Text>
            <AesButton
              title={t('surveillance.filters.clear')}
              onPress={clearFilters}
              variant="outline"
              fullWidth={false}
              testID="surveillance-clear-filters-button"
              style={{ marginLeft: rtl ? 0 : aesSpacing.sm, marginRight: rtl ? aesSpacing.sm : 0 }}
            />
          </View>
        </AesCard>
      )}

      {/* ─── FILTERS ─────────────────────────────────────────── */}
      <AesCard style={styles.filtersCard} elevated testID="surveillance-filters">
        <View style={filtersHeaderStyle}>
          <Text style={styles.sectionHeading}>{t('surveillance.filters.title')}</Text>
          {hasActiveFilters && (
            <AesButton
              title={t('surveillance.filters.clear')}
              onPress={clearFilters}
              variant="outline"
              fullWidth={false}
              testID="surveillance-clear-filters-button-header"
            />
          )}
        </View>

        {/* Status filter */}
        <Text style={styles.filterLabel}>{t('surveillance.filters.status')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
          contentContainerStyle={styles.pillContent}
          testID="surveillance-status-filter"
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: !selectedStatus ? aesColors.primaryAction : aesColors.surfaceSubdued,
                borderColor: !selectedStatus ? 'transparent' : aesColors.borderMedium,
              },
            ]}
            onPress={() => setSelectedStatus(undefined)}
            activeOpacity={0.8}
            testID="surveillance-status-filter-all"
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedStatus }}
            accessibilityLabel={t('surveillance.filters.all')}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: !selectedStatus ? aesColors.textInverse : aesColors.textPrimary },
              ]}
            >
              {t('surveillance.filters.all')}
            </Text>
          </TouchableOpacity>
          {DECLARATION_STATUSES.map(st => {
            const active = selectedStatus === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? aesColors.primaryAction : aesColors.surfaceSubdued,
                    borderColor: active ? 'transparent' : aesColors.borderMedium,
                  },
                ]}
                onPress={() => setSelectedStatus(active ? undefined : st)}
                activeOpacity={0.8}
                testID={`surveillance-status-filter-${st}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={STATUS_LABEL_MAP[st]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? aesColors.textInverse : aesColors.textPrimary },
                  ]}
                >
                  {STATUS_LABEL_MAP[st]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exposure filter */}
        <Text style={[styles.filterLabel, { marginTop: aesSpacing.sm }]}>{t('surveillance.filters.exposure')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
          contentContainerStyle={styles.pillContent}
          testID="surveillance-exposure-filter"
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor: !selectedExposure ? aesColors.primaryAction : aesColors.surfaceSubdued,
                borderColor: !selectedExposure ? 'transparent' : aesColors.borderMedium,
              },
            ]}
            onPress={() => setSelectedExposure(undefined)}
            activeOpacity={0.8}
            testID="surveillance-exposure-filter-all"
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedExposure }}
            accessibilityLabel={t('surveillance.filters.all')}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: !selectedExposure ? aesColors.textInverse : aesColors.textPrimary },
              ]}
            >
              {t('surveillance.filters.all')}
            </Text>
          </TouchableOpacity>
          {AES_INCIDENT_TYPES.map(it => {
            const active = selectedExposure === it;
            return (
              <TouchableOpacity
                key={it}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? aesColors.primaryAction : aesColors.surfaceSubdued,
                    borderColor: active ? 'transparent' : aesColors.borderMedium,
                  },
                ]}
                onPress={() => setSelectedExposure(active ? undefined : it)}
                activeOpacity={0.8}
                testID={`surveillance-exposure-filter-${it}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={EXPOSURE_LABEL_MAP[it]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? aesColors.textInverse : aesColors.textPrimary },
                  ]}
                >
                  {EXPOSURE_LABEL_MAP[it]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date range inputs */}
        <View style={dateRowStyle}>
          <View style={{ flex: 1, marginRight: rtl ? 0 : aesSpacing.xs, marginLeft: rtl ? aesSpacing.xs : 0 }}>
            <TextInput
              style={[
                styles.dateInput,
                { backgroundColor: aesColors.surfaceSubdued, borderColor: aesColors.borderMedium, color: aesColors.textPrimary },
              ]}
              placeholder={t('surveillance.filters.startDate')}
              placeholderTextColor={aesColors.textTertiary}
              value={startDate}
              onChangeText={setStartDate}
              maxLength={10}
              testID="surveillance-start-date-input"
              accessibilityLabel={t('surveillance.filters.startDate')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[
                styles.dateInput,
                { backgroundColor: aesColors.surfaceSubdued, borderColor: aesColors.borderMedium, color: aesColors.textPrimary },
              ]}
              placeholder={t('surveillance.filters.endDate')}
              placeholderTextColor={aesColors.textTertiary}
              value={endDate}
              onChangeText={setEndDate}
              maxLength={10}
              testID="surveillance-end-date-input"
              accessibilityLabel={t('surveillance.filters.endDate')}
            />
          </View>
        </View>
      </AesCard>

      {/* ─── 1. OVERVIEW INDICATORS ───────────────────────────── */}
      <Text style={styles.mainSectionTitle}>{t('surveillance.overview.title')}</Text>
      <View style={kpiGridStyle} testID="surveillance-overview-grid">
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-total">
          <Text style={[styles.kpiValue, { color: aesColors.primaryAction }]}>{overview.totalDeclarations}</Text>
          <Text style={styles.kpiLabel}>{t('surveillance.overview.total')}</Text>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-submitted">
          <Text style={[styles.kpiValue, { color: aesColors.accentGreen }]}>{overview.submittedDeclarations}</Text>
          <Text style={styles.kpiLabel}>{t('surveillance.overview.submitted')}</Text>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-under-review">
          <Text style={[styles.kpiValue, { color: aesColors.banners.warning.text }]}>{overview.underReviewDeclarations}</Text>
          <Text style={styles.kpiLabel}>{t('surveillance.overview.underReview')}</Text>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-correction">
          <Text style={[styles.kpiValue, { color: aesColors.banners.error.text }]}>{overview.correctionRequestedDeclarations}</Text>
          <Text style={styles.kpiLabel}>{t('surveillance.overview.correctionRequested')}</Text>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-active-oh">
          <Text style={[styles.kpiValue, { color: aesColors.primaryAction }]}>{overview.activeOhCoordinations}</Text>
          <Text style={styles.kpiLabel}>{t('surveillance.overview.activeOh')}</Text>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-completed-oh">
          <Text style={[styles.kpiValue, { color: aesColors.accentGreen }]}>{overview.completedOhCoordinations}</Text>
          <Text style={styles.kpiLabel}>{t('surveillance.overview.completedOh')}</Text>
        </AesCard>
      </View>

      {/* ─── 2. TEMPORAL DISTRIBUTION (MONTHLY BARS) ──────────── */}
      <AesCard style={styles.distributionCard} elevated testID="surveillance-temporal">
        <Text style={styles.sectionHeading}>{t('surveillance.temporal.title')}</Text>
        {temporalDistribution.length === 0 ? (
          <Text style={styles.emptyNote}>{t('surveillance.temporal.empty')}</Text>
        ) : (
          temporalDistribution.map(item => (
            <View key={item.month} style={barRowStyle} testID={`surveillance-temporal-bar-${item.month}`}>
              <Text style={styles.barLabel}>{item.month}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((item.count / maxTemporalCount) * 100)}%`, backgroundColor: aesColors.primaryAction },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{item.count}</Text>
            </View>
          ))
        )}
      </AesCard>

      {/* ─── 3. EXPOSURE CATEGORY DISTRIBUTION ────────────────── */}
      <AesCard style={styles.distributionCard} elevated testID="surveillance-exposure">
        <Text style={styles.sectionHeading}>{t('surveillance.exposure.title')}</Text>
        {exposureDistribution.length === 0 ? (
          <Text style={styles.emptyNote}>{t('surveillance.exposure.empty')}</Text>
        ) : (
          exposureDistribution.map(item => (
            <View key={item.incidentType} style={barRowStyle} testID={`surveillance-exposure-bar-${item.incidentType}`}>
              <Text style={styles.barLabel} numberOfLines={1}>{EXPOSURE_LABEL_MAP[item.incidentType as AesIncidentType]}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((item.count / maxExposureCount) * 100)}%`, backgroundColor: aesColors.accentGreen },
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{item.count}</Text>
            </View>
          ))
        )}
      </AesCard>

      {/* ─── 4. DECLARATION STATUS DISTRIBUTION ──────────────── */}
      <AesCard style={styles.distributionCard} elevated testID="surveillance-status-distribution">
        <Text style={styles.sectionHeading}>{t('surveillance.status.title')}</Text>
        {statusDistribution.map(item => (
          <View key={item.status} style={distributionRowStyle} testID={`surveillance-status-row-${item.status}`}>
            <View style={styles.statusBadgeContainer}>
              <AesStatusBadge status={item.status as DeclarationStatus} domain="declaration" testID={`surveillance-status-badge-${item.status}`} />
            </View>
            <Text style={styles.distributionLabel}>{STATUS_LABEL_MAP[item.status as DeclarationStatus]}</Text>
            <Text style={styles.distributionValue}>{item.count}</Text>
          </View>
        ))}
      </AesCard>

      {/* ─── 5. ADMINISTRATIVE REVIEW INDICATORS ──────────────── */}
      <AesCard style={styles.distributionCard} elevated testID="surveillance-admin">
        <Text style={styles.sectionHeading}>{t('surveillance.admin.title')}</Text>

        <View style={adminSummaryRowStyle} testID="surveillance-admin-summary">
          <View style={styles.adminSummaryItem}>
            <Text style={styles.adminSummaryValue}>{administrativeReview.totalReviews}</Text>
            <Text style={styles.adminSummaryLabel}>{t('surveillance.admin.totalReviews')}</Text>
          </View>
          <View style={styles.adminSummaryItem}>
            <Text style={[styles.adminSummaryValue, { color: aesColors.banners.error.text }]}>{administrativeReview.correctionRequests}</Text>
            <Text style={styles.adminSummaryLabel}>{t('surveillance.admin.correctionRequests')}</Text>
          </View>
          <View style={styles.adminSummaryItem}>
            <Text style={[styles.adminSummaryValue, { color: aesColors.accentGreen }]}>{administrativeReview.correctionResponses}</Text>
            <Text style={styles.adminSummaryLabel}>{t('surveillance.admin.correctionResponses')}</Text>
          </View>
        </View>

        {administrativeReview.outcomes.length > 0 && (
          <View style={{ marginTop: aesSpacing.sm }} testID="surveillance-admin-outcomes">
            <Text style={styles.filterLabel}>{t('surveillance.admin.outcomes')}</Text>
            {administrativeReview.outcomes.map(item => (
              <View key={item.outcome} style={distributionRowStyle} testID={`surveillance-admin-outcome-${item.outcome}`}>
                <View style={styles.statusBadgeContainer}>
                  <AesStatusBadge status={item.outcome as ReviewOutcome} domain="declaration" testID={`surveillance-admin-outcome-badge-${item.outcome}`} />
                </View>
                <Text style={styles.distributionLabel}>{t(`review.outcome.${item.outcome}` as any)}</Text>
                <Text style={styles.distributionValue}>{item.count}</Text>
              </View>
            ))}
          </View>
        )}
      </AesCard>

      {/* ─── 6. OCCUPATIONAL HEALTH INDICATORS ────────────────── */}
      <AesCard style={[styles.distributionCard, { marginBottom: aesSpacing.xl }]} elevated testID="surveillance-oh">
        <Text style={styles.sectionHeading}>{t('surveillance.oh.title')}</Text>

        {/* Coordination status */}
        <Text style={styles.filterLabel}>{t('surveillance.oh.status')}</Text>
        {occupationalHealth.statusDistribution.map(item => (
          <View key={item.status} style={distributionRowStyle} testID={`surveillance-oh-status-${item.status}`}>
            <View style={styles.statusBadgeContainer}>
              <AesStatusBadge status={item.status as OhCoordinationStatus} domain="ohCoordination" testID={`surveillance-oh-status-badge-${item.status}`} />
            </View>
            <Text style={styles.distributionLabel}>{t(`oh.status.${item.status}` as any)}</Text>
            <Text style={styles.distributionValue}>{item.count}</Text>
          </View>
        ))}

        {/* Follow-up events */}
        <Text style={[styles.filterLabel, { marginTop: aesSpacing.sm }]}>{t('surveillance.oh.events')}</Text>
        {occupationalHealth.eventCategories.length === 0 ? (
          <Text style={styles.emptyNote}>{t('oh.detail.noEvents')}</Text>
        ) : (
          occupationalHealth.eventCategories.map(item => (
            <View key={item.category} style={distributionRowStyle} testID={`surveillance-oh-event-${item.category}`}>
              <Text style={styles.distributionLabel}>{t(`oh.event.${item.category}` as any)}</Text>
              <Text style={styles.distributionValue}>{item.count}</Text>
            </View>
          ))
        )}
      </AesCard>
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  roleSwitcherContainer: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: aesColors.borderSubdued,
  },
  roleSwitcherLabel: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
    marginBottom: aesSpacing.xs,
  },
  roleSwitcherScroll: {},
  roleSwitcherContent: {
    gap: aesSpacing.xs,
    paddingBottom: aesSpacing.xs,
  },
  rolePill: {
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.xs,
    borderRadius: aesRadii.pill,
    borderWidth: 1,
    minWidth: 100,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePillText: {
    ...aesTypography.labelSmall,
    fontWeight: '600',
  },
  centeredLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: aesSpacing.md,
  },
  loadingText: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
  },
  unauthorizedCard: {
    marginHorizontal: aesSpacing.screenHorizontal,
    marginTop: aesSpacing.md,
    marginBottom: aesSpacing.md,
  },
  unauthorizedContent: {
    alignItems: 'center',
    gap: aesSpacing.sm,
  },
  unauthorizedIcon: { marginTop: aesSpacing.xs },
  unauthorizedTitle: {
    ...aesTypography.heading2,
    textAlign: 'center',
  },
  unauthorizedSubtext: {
    ...aesTypography.bodySmall,
    textAlign: 'center',
  },
  errorCard: {
    marginHorizontal: aesSpacing.screenHorizontal,
    marginTop: aesSpacing.md,
    marginBottom: aesSpacing.md,
  },
  errorContent: {
    alignItems: 'center',
    gap: aesSpacing.md,
  },
  errorIcon: { marginTop: aesSpacing.xs },
  errorTitle: {
    ...aesTypography.body,
    textAlign: 'center',
  },
  disclaimerCard: {
    marginHorizontal: aesSpacing.screenHorizontal,
    marginTop: aesSpacing.md,
    marginBottom: aesSpacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: aesColors.accentGreen,
  },
  disclaimerRow: {
    alignItems: 'flex-start',
    gap: aesSpacing.xs,
  },
  disclaimerIcon: { marginTop: 2 },
  disclaimerText: {
    ...aesTypography.caption,
    color: aesColors.textSecondary,
    flex: 1,
  },
  filterSummaryCard: {
    marginHorizontal: aesSpacing.screenHorizontal,
    marginBottom: aesSpacing.md,
  },
  filterSummaryRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: aesSpacing.sm,
  },
  filterSummaryText: {
    ...aesTypography.bodySmall,
    color: aesColors.accentGreen,
    fontWeight: '600',
    flex: 1,
  },
  filtersCard: {
    marginHorizontal: aesSpacing.screenHorizontal,
    marginBottom: aesSpacing.md,
  },
  filtersHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: aesSpacing.sm,
  },
  sectionHeading: {
    ...aesTypography.heading2,
    color: aesColors.textPrimary,
  },
  filterLabel: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
    fontWeight: '600',
    marginBottom: aesSpacing.xs,
  },
  pillScroll: {
    marginBottom: aesSpacing.sm,
  },
  pillContent: {
    gap: aesSpacing.xs,
    paddingBottom: aesSpacing.xs,
  },
  filterPill: {
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.xs,
    borderRadius: aesRadii.pill,
    borderWidth: 1,
    minWidth: 80,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    ...aesTypography.labelSmall,
    fontWeight: '600',
  },
  dateRow: {
    marginTop: aesSpacing.xs,
  },
  dateInput: {
    borderRadius: aesRadii.input,
    paddingHorizontal: aesSpacing.sm,
    paddingVertical: aesSpacing.xs,
    fontSize: aesTypography.bodySmall?.fontSize ?? 13,
    borderWidth: 1,
    height: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
  },
  mainSectionTitle: {
    ...aesTypography.heading1,
    color: aesColors.textPrimary,
    marginHorizontal: aesSpacing.screenHorizontal,
    marginBottom: aesSpacing.xs,
    marginTop: aesSpacing.md,
  },
  kpiGrid: {
    flexWrap: 'wrap',
    gap: aesSpacing.xs,
    marginHorizontal: aesSpacing.screenHorizontal,
    marginBottom: aesSpacing.md,
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '31%',
    minWidth: 100,
    alignItems: 'center',
    padding: aesSpacing.sm,
  },
  kpiValue: {
    ...aesTypography.heading2,
    fontSize: 24,
    fontWeight: '700',
  },
  kpiLabel: {
    ...aesTypography.caption,
    color: aesColors.textSecondary,
    textAlign: 'center',
    marginTop: aesSpacing.xs,
  },
  distributionCard: {
    marginHorizontal: aesSpacing.screenHorizontal,
    marginBottom: aesSpacing.md,
  },
  barRow: {
    alignItems: 'center',
    marginBottom: aesSpacing.xs,
  },
  barLabel: {
    width: 80,
    ...aesTypography.caption,
    color: aesColors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: aesColors.borderSubdued,
    borderRadius: aesRadii.pill,
    overflow: 'hidden',
    marginHorizontal: aesSpacing.sm,
  },
  barFill: {
    height: '100%',
    borderRadius: aesRadii.pill,
  },
  barCount: {
    width: 30,
    ...aesTypography.caption,
    color: aesColors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
  },
  distributionRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: aesSpacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: aesColors.borderSubdued,
  },
  statusBadgeContainer: {
    marginRight: aesSpacing.sm,
    minWidth: 80,
  },
  distributionLabel: {
    flex: 1,
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    fontWeight: '500',
  },
  distributionValue: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    fontWeight: '700',
    marginLeft: aesSpacing.sm,
  },
  emptyNote: {
    ...aesTypography.caption,
    color: aesColors.textTertiary,
    fontStyle: 'italic',
    marginVertical: aesSpacing.xs,
    textAlign: 'center',
  },
  adminSummaryRow: {
    justifyContent: 'space-between',
    marginBottom: aesSpacing.sm,
    paddingBottom: aesSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: aesColors.borderSubdued,
  },
  adminSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  adminSummaryValue: {
    ...aesTypography.heading2,
    fontSize: 20,
    fontWeight: '700',
  },
  adminSummaryLabel: {
    ...aesTypography.caption,
    color: aesColors.textSecondary,
    textAlign: 'center',
    marginTop: aesSpacing.xs,
  },
});

export default SurveillanceDashboardScreen;