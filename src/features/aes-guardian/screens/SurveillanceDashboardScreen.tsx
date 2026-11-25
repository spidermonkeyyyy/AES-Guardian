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

import AppTextInput from '../../../components/AppTextInput';
import AppText from '../../../components/AppText';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  CircleProgress,
} from '../../../components';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { AppIcon } from '../../../components/AppIcon';

import {
  AesScreenContainer,
  AesScreenHeader,
  AesCard,
  AesButton,
  AesStatusBadge,
} from '../components';
import { aesSpacing, aesRadii, aesTypography } from '../../../theme/tokens';
import type { ColorToken } from '../../../theme/tokens/colors';
import { useTheme } from '../../../theme/ThemeContext';
import {
  t,
  useLocale,
  useLayoutDirection,
  getLayoutRowDirection,
  getLayoutTextAlign,
  type TranslationKey,
} from '../../../localization';
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
  DECLARATION_STATUSES,
  AES_INCIDENT_TYPES,
} from '../../../core';

const MIN_TOUCH_TARGET = 48;
const DATE_FIELDS_STACK_BREAKPOINT = 360;

export const SurveillanceDashboardScreen: React.FC = () => {
  const { colors: themeColors } = useTheme();
  const styles = createStyles(themeColors);
  const locale = useLocale();
  const layoutDirection = useLayoutDirection();
  const rowDirection = getLayoutRowDirection(layoutDirection);
  const textAlign = getLayoutTextAlign(layoutDirection);

  const DEMO_ROLES_LOCALIZED = useMemo(() => [
    { key: 'quality_staff', label: t('role.quality_staff', locale), context: SYNTHETIC_QUALITY_STAFF_CONTEXT },
    { key: 'admin_reviewer', label: t('role.admin_reviewer', locale), context: SYNTHETIC_ADMIN_REVIEWER_CONTEXT },
    { key: 'oh_professional', label: t('role.oh_professional', locale), context: SYNTHETIC_OH_PROFESSIONAL_CONTEXT },
    { key: 'exposed_professional', label: t('role.exposed_professional', locale), context: SYNTHETIC_DEMO_CONTEXT },
    { key: 'tech_admin', label: t('role.tech_admin', locale), context: SYNTHETIC_TECH_ADMIN_CONTEXT },
  ], [locale]);
  const statusLabelMap = useMemo<Record<DeclarationStatus, string>>(() => ({
    draft: t('surveillance.overview.draft', locale),
    submitted: t('surveillance.overview.submitted', locale),
    under_review: t('surveillance.overview.underReview', locale),
    correction_requested: t('surveillance.overview.correctionRequested', locale),
    resubmitted: t('surveillance.overview.resubmitted', locale),
    closed: t('surveillance.overview.closed', locale),
  }), [locale]);
  const exposureLabelMap = useMemo<Record<AesIncidentType, string>>(() => ({
    percutaneous_exposure: t('form.incidentType.percutaneous', locale),
    mucocutaneous_exposure: t('form.incidentType.mucocutaneous', locale),
    sexual_assault: t('form.incidentType.sexual_assault', locale),
    other: t('form.incidentType.other', locale),
  }), [locale]);

  const [activeRoleContext, setActiveRoleContext] = useState<AuthContext>(SYNTHETIC_QUALITY_STAFF_CONTEXT);
  const isAuthorized = canViewSurveillanceDashboard(activeRoleContext);

  const [metrics, setMetrics] = useState<SurveillanceDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<DeclarationStatus | undefined>(undefined);
  const [selectedExposure, setSelectedExposure] = useState<AesIncidentType | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateFieldsAvailableWidth, setDateFieldsAvailableWidth] = useState(0);
  const [dateFilterError, setDateFilterError] = useState<
    'surveillance.filters.invalidDate' | 'surveillance.filters.invalidDateRange' | null
  >(null);

  const loadMetrics = useCallback(async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      setDateFilterError(dateError);
      setLoading(false);
      setError(null);
      return;
    }
    setDateFilterError(null);
    setDateFilterError(null);
    try {
      const db = getDatabase();
      const filters: SurveillanceFilters = {};
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedExposure) filters.incidentType = selectedExposure;
      if (startDate.trim()) filters.startDate = startDate.trim();
      if (endDate.trim()) filters.endDate = endDate.trim();

      const data = await db.getSurveillanceDashboardMetrics(activeRoleContext.userId!, filters);
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, activeRoleContext, selectedStatus, selectedExposure, startDate, endDate]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const clearFilters = () => {
    setSelectedStatus(undefined);
    setSelectedExposure(undefined);
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean(selectedStatus || selectedExposure || startDate || endDate);

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
      <AppText style={styles.roleSwitcherLabel}>
        {t('surveillance.roleBadge')} :
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.roleSwitcherScroll, { width: '100%' }]}
        testID="surveillance-role-switcher-scroll"
        contentContainerStyle={[
          styles.roleSwitcherContent,
          { flexDirection: rowDirection },
        ]}
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
                      ? themeColors.dangerBackground
                      : themeColors.primary
                    : themeColors.muted,
                  borderColor: active ? 'transparent' : themeColors.border,
                },
              ]}
              onPress={() => setActiveRoleContext(r.context)}
              disabled={active}
              testID={`role-pill-${r.key}`}
              accessibilityRole="button"
              accessibilityLabel={`${r.label}${isBlocked ? ` (${t('surveillance.unauthorized')})` : ''}`}
              accessibilityState={{ selected: active }}
            >
              <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: aesSpacing.xs }}>
                <AppText
                  style={[
                    styles.rolePillText,
                    {
                      color: active
                        ? isBlocked
                          ? themeColors.danger
                          : themeColors.primaryForeground
                        : themeColors.foreground,
                    },
                  ]}
                >
                  {r.label}
                </AppText>
                {isBlocked && (
                  <AppIcon
                    name="lock"
                    size={14}
                    color={active ? themeColors.danger : themeColors.mutedForeground}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (!isAuthorized) {
    return (
      <AesScreenContainer scrollable testID="surveillance-unauthorized">
        {renderRoleSwitcher()}
        <AesCard
          style={styles.unauthorizedCard}
          elevated={true}
          accentBorderColor={themeColors.destructive}
          testID="surveillance-unauthorized-card"
        >
          <View style={styles.unauthorizedContent}>
            <AppIcon name="alert-circle" size={32} color={themeColors.danger} style={styles.unauthorizedIcon} />
            <AppText style={[styles.unauthorizedTitle, { color: themeColors.danger }]}>
              {t('surveillance.unauthorized')}
            </AppText>
            <AppText style={[styles.unauthorizedSubtext, { color: themeColors.mutedForeground, textAlign: 'center' }]}>
              {t('surveillance.unauthorizedDetails', locale)}
            </AppText>
            {renderRoleSwitcher()}
          </View>
        </AesCard>
      </AesScreenContainer>
    );
  }

  if (loading) {
    return (
      <AesScreenContainer scrollable testID="surveillance-loading">
        {renderRoleSwitcher()}
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <AppText style={styles.loadingText}>{t('app.loading')}</AppText>
        </View>
      </AesScreenContainer>
    );
  }

  if (error || !metrics) {
    return (
      <AesScreenContainer scrollable testID="surveillance-error">
        {renderRoleSwitcher()}
        <Alert
          variant="error"
          accessibilityRole="alert"
          testID="surveillance-error-card"
        >
          <AlertIcon>
            <AppIcon name="alert-triangle" size={32} decorative />
          </AlertIcon>
          <AlertDescription>{error ?? t('error.loadFailed')}</AlertDescription>
          <AlertAction>
            <AesButton
              title={t('oh.queue.refresh')}
              onPress={loadMetrics}
              variant="primary"
              fullWidth={false}
              testID="surveillance-retry-button"
            />
          </AlertAction>
        </Alert>
      </AesScreenContainer>
    );
  }

  // At this point, metrics is guaranteed non-null (TypeScript control flow narrowing)
  const overview = metrics.overview;
  const administrativeReview = metrics.administrativeReview;
  const occupationalHealth = metrics.occupationalHealth;

  // RTL-aware layout styles computed from the `rtl` value
  const filterSummaryRowStyle: ViewStyle = { ...styles.filterSummaryRow, flexDirection: rowDirection };
  const filtersHeaderStyle: ViewStyle = { ...styles.filtersHeader, flexDirection: rowDirection };
  const stackDateFields = dateFieldsAvailableWidth <= DATE_FIELDS_STACK_BREAKPOINT;
  const dateRowStyle: ViewStyle = {
    ...styles.dateRow,
    flexDirection: stackDateFields ? 'column' : rowDirection,
  };
  const kpiGridStyle: ViewStyle = { ...styles.kpiGrid, flexDirection: rowDirection };
  const barRowStyle: ViewStyle = { ...styles.barRow, flexDirection: rowDirection };
  const distributionRowStyle: ViewStyle = { ...styles.distributionRow, flexDirection: rowDirection };
  const adminSummaryRowStyle: ViewStyle = { ...styles.adminSummaryRow, flexDirection: rowDirection };

  return (
    <AesScreenContainer scrollable testID="surveillance-dashboard">
      <AesScreenHeader
        title={t('surveillance.title')}
        subtitle={t('surveillance.disclaimer')}
        overline={t('surveillance.nav.title')}
        testID="surveillance-header"
      />
      {renderRoleSwitcher()}

      <Alert
        variant="info"
        layout="block"
        dismissible={false}
        testID="surveillance-disclaimer"
        accessibilityRole="summary"
      >
        <AlertIcon>
          <AppIcon name="info" size={16} decorative />
        </AlertIcon>
        <AlertDescription>{t('surveillance.disclaimer')}</AlertDescription>
      </Alert>

      {filterSummary?.hasActiveFilters && (
        <AesCard
          style={styles.filterSummaryCard}
          elevated={false}
          accentBorderColor={themeColors.primary}
          testID="surveillance-filter-summary"
        >
          <View style={filterSummaryRowStyle}>
            <AppIcon name="filter" size={16} color={themeColors.primary} />
            <AppText style={[styles.filterSummaryText, { textAlign }]}>
              {t('surveillance.filters.title')} : {filterSummary.matchingDeclarations} / {filterSummary.totalRecords} {t('surveillance.filters.declarationCountLabel', locale)}
            </AppText>
            <AesButton
              title={t('surveillance.filters.clear')}
              onPress={clearFilters}
              variant="outline"
              fullWidth={false}
              testID="surveillance-clear-filters-button"
              style={{ marginStart: aesSpacing.sm }}
            />
          </View>
        </AesCard>
      )}

      {/* ─── FILTERS ─────────────────────────────────────────── */}
      <AesCard style={styles.filtersCard} elevated testID="surveillance-filters">
        <View style={filtersHeaderStyle}>
          <AppText style={[styles.sectionHeading, { textAlign }]}>{t('surveillance.filters.title')}</AppText>
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
        <AppText style={[styles.filterLabel, { textAlign }]}>{t('surveillance.filters.status')}</AppText>
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
                backgroundColor: !selectedStatus ? themeColors.primary : themeColors.muted,
                borderColor: !selectedStatus ? 'transparent' : themeColors.border,
              },
            ]}
            onPress={() => setSelectedStatus(undefined)}
            activeOpacity={0.8}
            testID="surveillance-status-filter-all"
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedStatus }}
            accessibilityLabel={t('surveillance.filters.all')}
          >
            <AppText
              style={[
                styles.filterPillText,
                { color: !selectedStatus ? themeColors.primaryForeground : themeColors.foreground },
              ]}
            >
              {t('surveillance.filters.all')}
            </AppText>
          </TouchableOpacity>
          {DECLARATION_STATUSES.map(st => {
            const active = selectedStatus === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? themeColors.primary : themeColors.muted,
                    borderColor: active ? 'transparent' : themeColors.border,
                  },
                ]}
                onPress={() => setSelectedStatus(active ? undefined : st)}
                activeOpacity={0.8}
                testID={`surveillance-status-filter-${st}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={statusLabelMap[st]}
              >
                <AppText
                  style={[
                    styles.filterPillText,
                    { color: active ? themeColors.primaryForeground : themeColors.foreground },
                  ]}
                >
                  {statusLabelMap[st]}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exposure filter */}
        <AppText style={[styles.filterLabel, { marginTop: aesSpacing.sm, textAlign }]}>{t('surveillance.filters.exposure')}</AppText>
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
                backgroundColor: !selectedExposure ? themeColors.primary : themeColors.muted,
                borderColor: !selectedExposure ? 'transparent' : themeColors.border,
              },
            ]}
            onPress={() => setSelectedExposure(undefined)}
            activeOpacity={0.8}
            testID="surveillance-exposure-filter-all"
            accessibilityRole="button"
            accessibilityState={{ selected: !selectedExposure }}
            accessibilityLabel={t('surveillance.filters.all')}
          >
            <AppText
              style={[
                styles.filterPillText,
                { color: !selectedExposure ? themeColors.primaryForeground : themeColors.foreground },
              ]}
            >
              {t('surveillance.filters.all')}
            </AppText>
          </TouchableOpacity>
          {AES_INCIDENT_TYPES.map(it => {
            const active = selectedExposure === it;
            return (
              <TouchableOpacity
                key={it}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? themeColors.primary : themeColors.muted,
                    borderColor: active ? 'transparent' : themeColors.border,
                  },
                ]}
                onPress={() => setSelectedExposure(active ? undefined : it)}
                activeOpacity={0.8}
                testID={`surveillance-exposure-filter-${it}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={exposureLabelMap[it]}
              >
                <AppText
                  style={[
                    styles.filterPillText,
                    { color: active ? themeColors.primaryForeground : themeColors.foreground },
                  ]}
                >
                  {exposureLabelMap[it]}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date range inputs */}
        <View
          style={dateRowStyle}
          onLayout={(event) => setDateFieldsAvailableWidth(event.nativeEvent.layout.width)}
          testID="surveillance-date-range"
        >
          <View
            style={[styles.dateField, !stackDateFields && styles.dateFieldInline]}
            testID="surveillance-start-date-field"
          >
            <AppTextInput
              style={[
                styles.dateInput,
                { backgroundColor: themeColors.muted, borderColor: themeColors.border, color: themeColors.foreground },
                { textAlign: 'left', writingDirection: 'ltr' },
              ]}
              placeholder={t('surveillance.filters.startDate')}
              placeholderTextColor={themeColors.mutedForeground}
              value={startDate}
              onChangeText={setStartDate}
              maxLength={10}
              testID="surveillance-start-date-input"
              accessibilityLabel={t('surveillance.filters.startDate')}
              accessibilityHint={dateFilterError ? t(dateFilterError, locale) : undefined}
            />
          </View>
          <View
            style={[styles.dateField, !stackDateFields && styles.dateFieldInline]}
            testID="surveillance-end-date-field"
          >
            <AppTextInput
              style={[
                styles.dateInput,
                { backgroundColor: themeColors.muted, borderColor: themeColors.border, color: themeColors.foreground },
                { textAlign: 'left', writingDirection: 'ltr' },
              ]}
              placeholder={t('surveillance.filters.endDate')}
              placeholderTextColor={themeColors.mutedForeground}
              value={endDate}
              onChangeText={setEndDate}
              maxLength={10}
              testID="surveillance-end-date-input"
              accessibilityLabel={t('surveillance.filters.endDate')}
              accessibilityHint={dateFilterError ? t(dateFilterError, locale) : undefined}
            />
          </View>
        </View>
        {dateFilterError && (
          <AppText
            style={[styles.dateFilterError, { textAlign }]}
            testID="surveillance-date-filter-error"
            accessibilityRole="alert"
          >
            {t(dateFilterError, locale)}
          </AppText>
        )}
      </AesCard>

      {/* ─── 1. OVERVIEW INDICATORS ───────────────────────────── */}
      <AppText style={[styles.mainSectionTitle, { textAlign }]}>{t('surveillance.overview.title')}</AppText>
      <View style={kpiGridStyle} testID="surveillance-overview-grid">
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-total">
          <View accessible accessibilityRole="text" accessibilityLabel={`${t('surveillance.overview.total', locale)}: ${overview.totalDeclarations}`}>
          <AppText style={[styles.kpiValue, { color: themeColors.primary }]}>{overview.totalDeclarations}</AppText>
          <AppText style={styles.kpiLabel}>{t('surveillance.overview.total')}</AppText>
          </View>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-submitted">
          <View accessible accessibilityRole="text" accessibilityLabel={`${t('surveillance.overview.submitted', locale)}: ${overview.submittedDeclarations}`}>
          <AppText style={[styles.kpiValue, { color: themeColors.primary }]}>{overview.submittedDeclarations}</AppText>
          <AppText style={styles.kpiLabel}>{t('surveillance.overview.submitted')}</AppText>
          </View>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-under-review">
          <View accessible accessibilityRole="text" accessibilityLabel={`${t('surveillance.overview.underReview', locale)}: ${overview.underReviewDeclarations}`}>
          <AppText style={[styles.kpiValue, { color: themeColors.foreground }]}>{overview.underReviewDeclarations}</AppText>
          <AppText style={styles.kpiLabel}>{t('surveillance.overview.underReview')}</AppText>
          </View>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-correction">
          <View accessible accessibilityRole="text" accessibilityLabel={`${t('surveillance.overview.correctionRequested', locale)}: ${overview.correctionRequestedDeclarations}`}>
          <AppText style={[styles.kpiValue, { color: themeColors.danger }]}>{overview.correctionRequestedDeclarations}</AppText>
          <AppText style={styles.kpiLabel}>{t('surveillance.overview.correctionRequested')}</AppText>
          </View>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-active-oh">
          <View accessible accessibilityRole="text" accessibilityLabel={`${t('surveillance.overview.activeOh', locale)}: ${overview.activeOhCoordinations}`}>
          <AppText style={[styles.kpiValue, { color: themeColors.primary }]}>{overview.activeOhCoordinations}</AppText>
          <AppText style={styles.kpiLabel}>{t('surveillance.overview.activeOh')}</AppText>
          </View>
        </AesCard>
        <AesCard style={styles.kpiCard} elevated testID="surveillance-kpi-completed-oh">
          <View accessible accessibilityRole="text" accessibilityLabel={`${t('surveillance.overview.completedOh', locale)}: ${overview.completedOhCoordinations}`}>
          <AppText style={[styles.kpiValue, { color: themeColors.primary }]}>{overview.completedOhCoordinations}</AppText>
          <AppText style={styles.kpiLabel}>{t('surveillance.overview.completedOh')}</AppText>
          {(() => {
            const active = Number.isFinite(overview.activeOhCoordinations)
              ? Math.max(0, overview.activeOhCoordinations)
              : 0;
            const completed = Number.isFinite(overview.completedOhCoordinations)
              ? Math.max(0, overview.completedOhCoordinations)
              : 0;
            const denominator = active + completed;
            if (denominator <= 0) return null;
            return (
              <CircleProgress
                value={completed}
                maxValue={denominator}
                size={48}
                strokeWidth={5}
                showValue
                accessibilityLabel={t('progress.oh.completed', locale)}
                accessibilityValueText={`${completed} / ${denominator}`}
                testID="surveillance-oh-completion-progress"
              />
            );
          })()}
          </View>
        </AesCard>
      </View>

      {/* ─── 2. TEMPORAL DISTRIBUTION (MONTHLY BARS) ──────────── */}
      <AesCard style={styles.distributionCard} elevated testID="surveillance-temporal">
        <AppText style={styles.sectionHeading}>{t('surveillance.temporal.title')}</AppText>
        {temporalDistribution.length === 0 ? (
          <AppText style={styles.emptyNote}>{t('surveillance.temporal.empty')}</AppText>
        ) : (
          temporalDistribution.map(item => (
            <View key={item.month} style={barRowStyle} testID={`surveillance-temporal-bar-${item.month}`} accessible accessibilityRole="text" accessibilityLabel={`${item.month}: ${item.count}`}>
              <AppText style={[styles.barLabel, { textAlign: 'left', writingDirection: 'ltr' }]}>{item.month}</AppText>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((item.count / maxTemporalCount) * 100)}%`, backgroundColor: themeColors.primary },
                  ]}
                />
              </View>
              <AppText style={[styles.barCount, { textAlign: 'right', writingDirection: 'ltr' }]}>{item.count}</AppText>
            </View>
          ))
        )}
      </AesCard>

      {/* ─── 3. EXPOSURE CATEGORY DISTRIBUTION ────────────────── */}
      <AesCard style={styles.distributionCard} elevated testID="surveillance-exposure">
        <AppText style={styles.sectionHeading}>{t('surveillance.exposure.title')}</AppText>
        {exposureDistribution.length === 0 ? (
          <AppText style={styles.emptyNote}>{t('surveillance.exposure.empty')}</AppText>
        ) : (
          exposureDistribution.map(item => (
            <View key={item.incidentType} style={barRowStyle} testID={`surveillance-exposure-bar-${item.incidentType}`} accessible accessibilityRole="text" accessibilityLabel={`${exposureLabelMap[item.incidentType as AesIncidentType]}: ${item.count}`}>
              <AppText
                style={[styles.barLabel, styles.exposureBarLabel, { textAlign }]}
              >
                {exposureLabelMap[item.incidentType as AesIncidentType]}
              </AppText>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((item.count / maxExposureCount) * 100)}%`, backgroundColor: themeColors.primary },
                  ]}
                />
              </View>
              <AppText style={[styles.barCount, { textAlign: 'right', writingDirection: 'ltr' }]}>{item.count}</AppText>
            </View>
          ))
        )}
      </AesCard>

      {/* ─── 4. DECLARATION STATUS DISTRIBUTION ──────────────── */}
      <AesCard style={styles.distributionCard} elevated testID="surveillance-status-distribution">
        <AppText style={styles.sectionHeading}>{t('surveillance.status.title')}</AppText>
        {statusDistribution.length === 0 ? (
          <AppText style={styles.emptyNote}>{t('surveillance.status.empty', locale)}</AppText>
        ) : statusDistribution.map(item => (
          <View key={item.status} style={distributionRowStyle} testID={`surveillance-status-row-${item.status}`} accessible accessibilityRole="text" accessibilityLabel={`${statusLabelMap[item.status as DeclarationStatus]}: ${item.count}`}>
            <View style={styles.statusBadgeContainer}>
              <AesStatusBadge status={item.status as DeclarationStatus} domain="declaration" testID={`surveillance-status-badge-${item.status}`} />
            </View>
            <AppText style={[styles.distributionLabel, { textAlign }]}>{statusLabelMap[item.status as DeclarationStatus]}</AppText>
            <AppText style={[styles.distributionValue, { textAlign: 'right', writingDirection: 'ltr' }]}>{item.count}</AppText>
          </View>
        ))}
      </AesCard>

      {/* ─── 5. ADMINISTRATIVE REVIEW INDICATORS ──────────────── */}
      <AesCard style={styles.distributionCard} elevated testID="surveillance-admin">
        <AppText style={styles.sectionHeading}>{t('surveillance.admin.title')}</AppText>

        <View
          style={adminSummaryRowStyle}
          testID="surveillance-admin-summary"
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${t('surveillance.admin.totalReviews', locale)}: ${administrativeReview.totalReviews}; ${t('surveillance.admin.correctionRequests', locale)}: ${administrativeReview.correctionRequests}; ${t('surveillance.admin.correctionResponses', locale)}: ${administrativeReview.correctionResponses}`}
        >
          <View style={styles.adminSummaryItem}>
            <AppText style={styles.adminSummaryValue}>{administrativeReview.totalReviews}</AppText>
            <AppText style={styles.adminSummaryLabel}>{t('surveillance.admin.totalReviews')}</AppText>
          </View>
          <View style={styles.adminSummaryItem}>
            <AppText style={[styles.adminSummaryValue, { color: themeColors.danger }]}>{administrativeReview.correctionRequests}</AppText>
            <AppText style={styles.adminSummaryLabel}>{t('surveillance.admin.correctionRequests')}</AppText>
          </View>
          <View style={styles.adminSummaryItem}>
            <AppText style={[styles.adminSummaryValue, { color: themeColors.primary }]}>{administrativeReview.correctionResponses}</AppText>
            <AppText style={styles.adminSummaryLabel}>{t('surveillance.admin.correctionResponses')}</AppText>
          </View>
        </View>

        {administrativeReview.outcomes.length > 0 && (
          <View style={{ marginTop: aesSpacing.sm }} testID="surveillance-admin-outcomes">
            <AppText style={styles.filterLabel}>{t('surveillance.admin.outcomes')}</AppText>
            {administrativeReview.outcomes.map(item => (
              <View key={item.outcome} style={distributionRowStyle} testID={`surveillance-admin-outcome-${item.outcome}`} accessible accessibilityRole="text" accessibilityLabel={`${t(`review.outcome.${item.outcome}` as TranslationKey, locale)}: ${item.count}`}>
                <View style={styles.statusBadgeContainer}>
                  <AesStatusBadge status={item.outcome as ReviewOutcome} domain="declaration" testID={`surveillance-admin-outcome-badge-${item.outcome}`} />
                </View>
                <AppText style={[styles.distributionLabel, { textAlign }]}>{t(`review.outcome.${item.outcome}` as TranslationKey)}</AppText>
                <AppText style={[styles.distributionValue, { textAlign: 'right', writingDirection: 'ltr' }]}>{item.count}</AppText>
              </View>
            ))}
          </View>
        )}
      </AesCard>

      {/* ─── 6. OCCUPATIONAL HEALTH INDICATORS ────────────────── */}
      <AesCard style={[styles.distributionCard, { marginBottom: aesSpacing.xl }]} elevated testID="surveillance-oh">
        <AppText style={styles.sectionHeading}>{t('surveillance.oh.title')}</AppText>

        {/* Coordination status */}
        <AppText style={styles.filterLabel}>{t('surveillance.oh.status')}</AppText>
        {occupationalHealth.statusDistribution.map(item => (
          <View key={item.status} style={distributionRowStyle} testID={`surveillance-oh-status-${item.status}`} accessible accessibilityRole="text" accessibilityLabel={`${t(`oh.status.${item.status}` as TranslationKey, locale)}: ${item.count}`}>
            <View style={styles.statusBadgeContainer}>
              <AesStatusBadge status={item.status as OhCoordinationStatus} domain="ohCoordination" testID={`surveillance-oh-status-badge-${item.status}`} />
            </View>
            <AppText style={[styles.distributionLabel, { textAlign }]}>{t(`oh.status.${item.status}` as TranslationKey)}</AppText>
            <AppText style={[styles.distributionValue, { textAlign: 'right', writingDirection: 'ltr' }]}>{item.count}</AppText>
          </View>
        ))}

        {/* Follow-up events */}
        <AppText style={[styles.filterLabel, { marginTop: aesSpacing.sm }]}>{t('surveillance.oh.events')}</AppText>
        {occupationalHealth.eventCategories.length === 0 ? (
          <AppText style={styles.emptyNote}>{t('oh.detail.noEvents')}</AppText>
        ) : (
          occupationalHealth.eventCategories.map(item => (
            <View key={item.category} style={distributionRowStyle} testID={`surveillance-oh-event-${item.category}`} accessible accessibilityRole="text" accessibilityLabel={`${t(`oh.event.${item.category}` as TranslationKey, locale)}: ${item.count}`}>
              <AppText style={[styles.distributionLabel, { textAlign }]}>{t(`oh.event.${item.category}` as TranslationKey)}</AppText>
              <AppText style={[styles.distributionValue, { textAlign: 'right', writingDirection: 'ltr' }]}>{item.count}</AppText>
            </View>
          ))
        )}
      </AesCard>
    </AesScreenContainer>
  );
};

function validateDateRange(startDate: string, endDate: string): 'surveillance.filters.invalidDate' | 'surveillance.filters.invalidDateRange' | null {
  const isValidIsoDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const start = startDate.trim();
  const end = endDate.trim();
  if ((start && !isValidIsoDate(start)) || (end && !isValidIsoDate(end))) {
    return 'surveillance.filters.invalidDate';
  }
  if (start && end && start > end) {
    return 'surveillance.filters.invalidDateRange';
  }
  return null;
}

function createStyles(themeColors: ColorToken) {
  return StyleSheet.create({
  roleSwitcherContainer: {
    paddingHorizontal: 0,
    paddingVertical: aesSpacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border,
  },
  roleSwitcherLabel: {
    ...aesTypography.labelSmall,
    color: themeColors.mutedForeground,
    marginBottom: aesSpacing.xs,
  },
  roleSwitcherScroll: {
    height: MIN_TOUCH_TARGET + aesSpacing.xs,
  },
  roleSwitcherContent: {
    gap: aesSpacing.xs,
    alignItems: 'center',
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
    color: themeColors.mutedForeground,
  },
  unauthorizedCard: {
    marginHorizontal: 0,
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
    marginHorizontal: 0,
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
    marginHorizontal: 0,
    marginTop: aesSpacing.md,
    marginBottom: aesSpacing.sm,
    borderStartWidth: 4,
    borderStartColor: themeColors.primary,
  },
  disclaimerRow: {
    alignItems: 'flex-start',
    gap: aesSpacing.xs,
  },
  disclaimerIcon: { marginTop: 2 },
  disclaimerText: {
    ...aesTypography.caption,
    color: themeColors.mutedForeground,
    flex: 1,
  },
  filterSummaryCard: {
    marginHorizontal: 0,
    marginBottom: aesSpacing.md,
  },
  filterSummaryRow: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: aesSpacing.sm,
  },
  filterSummaryText: {
    ...aesTypography.bodySmall,
    color: themeColors.primary,
    fontWeight: '600',
    flex: 1,
  },
  filtersCard: {
    marginHorizontal: 0,
    marginBottom: aesSpacing.md,
  },
  filtersHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: aesSpacing.sm,
  },
  sectionHeading: {
    ...aesTypography.heading2,
    color: themeColors.foreground,
  },
  filterLabel: {
    ...aesTypography.labelSmall,
    color: themeColors.mutedForeground,
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
    gap: aesSpacing.sm,
  },
  dateField: {
    minWidth: 0,
  },
  dateFieldInline: {
    flex: 1,
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
  dateFilterError: {
    ...aesTypography.bodySmall,
    color: themeColors.danger,
    marginTop: aesSpacing.xs,
    textAlign: 'left',
  },
  mainSectionTitle: {
    ...aesTypography.heading1,
    color: themeColors.foreground,
    marginHorizontal: 0,
    marginBottom: aesSpacing.xs,
    marginTop: aesSpacing.md,
  },
  kpiGrid: {
    flexWrap: 'wrap',
    gap: aesSpacing.xs,
    marginHorizontal: 0,
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
    color: themeColors.mutedForeground,
    textAlign: 'center',
    marginTop: aesSpacing.xs,
  },
  distributionCard: {
    marginHorizontal: 0,
    marginBottom: aesSpacing.md,
  },
  barRow: {
    alignItems: 'center',
    marginBottom: aesSpacing.xs,
  },
  barLabel: {
    flexBasis: 80,
    flexShrink: 1,
    ...aesTypography.caption,
    color: themeColors.mutedForeground,
  },
  exposureBarLabel: {
    flexBasis: 112,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: themeColors.border,
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
    color: themeColors.foreground,
    fontWeight: '600',
    textAlign: 'right',
  },
  distributionRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: aesSpacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border,
  },
  statusBadgeContainer: {
    marginEnd: aesSpacing.sm,
    minWidth: 80,
  },
  distributionLabel: {
    flex: 1,
    ...aesTypography.bodySmall,
    color: themeColors.foreground,
    fontWeight: '500',
  },
  distributionValue: {
    ...aesTypography.bodySmall,
    color: themeColors.foreground,
    fontWeight: '700',
    marginStart: aesSpacing.sm,
  },
  emptyNote: {
    ...aesTypography.caption,
    color: themeColors.mutedForeground,
    fontStyle: 'italic',
    marginVertical: aesSpacing.xs,
    textAlign: 'center',
  },
  adminSummaryRow: {
    justifyContent: 'space-between',
    marginBottom: aesSpacing.sm,
    paddingBottom: aesSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border,
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
    color: themeColors.mutedForeground,
    textAlign: 'center',
    marginTop: aesSpacing.xs,
  },
  });
}

export default SurveillanceDashboardScreen;