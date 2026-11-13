/**
 * AES Guardian — Surveillance Dashboard Screen (Phase 2C.5)
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
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
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
  DECLARATION_STATUSES,
  AES_INCIDENT_TYPES,
} from '../../../core';
import { t } from '../../../localization';

const DEMO_ROLES: Array<{ key: string; label: string; context: AuthContext }> = [
  { key: 'quality_staff', label: 'Qualité (Autorisé)', context: SYNTHETIC_QUALITY_STAFF_CONTEXT },
  { key: 'admin_reviewer', label: 'Admin RH (Autorisé)', context: SYNTHETIC_ADMIN_REVIEWER_CONTEXT },
  { key: 'oh_professional', label: 'SST (Autorisé)', context: SYNTHETIC_OH_PROFESSIONAL_CONTEXT },
  { key: 'exposed_professional', label: 'Exposé (Bloqué)', context: SYNTHETIC_DEMO_CONTEXT },
  { key: 'tech_admin', label: 'Tech Admin (Bloqué)', context: SYNTHETIC_TECH_ADMIN_CONTEXT },
];

export const SurveillanceDashboardScreen: React.FC = () => {
  const { colors } = useTheme();

  // Synthetic demonstration role context with role switcher
  const [activeRoleContext, setActiveRoleContext] = useState<AuthContext>(SYNTHETIC_QUALITY_STAFF_CONTEXT);
  const isAuthorized = canViewSurveillanceDashboard(activeRoleContext);

  const [metrics, setMetrics] = useState<SurveillanceDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
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

  const renderRoleBar = () => (
    <View style={[styles.badgeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginBottom: 4 }]}>
        {t('surveillance.roleBadge')} (Changer de profil démo) :
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        {DEMO_ROLES.map(r => {
          const active = activeRoleContext.role === r.context.role;
          return (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? colors.primary : colors.background,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveRoleContext(r.context)}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: active ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (!isAuthorized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderRoleBar()}
        <View style={[styles.unauthorizedBox, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
          <Text style={[styles.unauthorizedText, { color: colors.destructive }]}>
            {t('surveillance.unauthorized')}
          </Text>
          <Text style={[styles.unauthorizedSubtext, { color: colors.mutedForeground, marginTop: spacing.xs, textAlign: 'center' }]}>
            Profil sélectionné : {activeRoleContext.displayName} ({activeRoleContext.role}).
            Ce profil ne dispose pas des autorisations nécessaires pour accéder aux indicateurs agrégés de surveillance.
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centeredContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !metrics) {
    return (
      <View style={[styles.container, styles.centeredContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error ?? t('error.loadFailed')}</Text>
        <TouchableOpacity onPress={loadMetrics} style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.primary, fontSize: typography.fontSize.bodySmall }}>
            {t('oh.queue.refresh')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { overview, temporalDistribution, exposureDistribution, statusDistribution, administrativeReview, occupationalHealth, filterSummary } = metrics;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Role banner with interactive switcher */}
      {renderRoleBar()}

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Synthetic Data Disclaimer */}
        <View style={[styles.disclaimerBox, { backgroundColor: colors.card, borderLeftColor: colors.accent }]}>
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            {t('surveillance.disclaimer')}
          </Text>
        </View>

        {filterSummary?.hasActiveFilters && (
          <View style={[styles.filterSummaryBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            <Text style={[styles.filterSummaryText, { color: colors.primary }]}>
              Filtres actifs : {filterSummary.matchingDeclarations} sur {filterSummary.totalRecords} déclarations au total
            </Text>
          </View>
        )}

        {/* ─── FILTERS ─────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
              {t('surveillance.filters.title')}
            </Text>
            {(selectedStatus || selectedExposure || startDate || endDate) && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={[styles.clearFilterText, { color: colors.primary }]}>
                  {t('surveillance.filters.clear')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Status filter pills */}
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
            {t('surveillance.filters.status')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            <TouchableOpacity
              style={[
                styles.pill,
                {
                  backgroundColor: !selectedStatus ? colors.primary : colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedStatus(undefined)}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: !selectedStatus ? colors.primaryForeground : colors.foreground },
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
                    styles.pill,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setSelectedStatus(active ? undefined : st)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {t(`status.${st}` as any)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Exposure filter pills */}
          <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
            {t('surveillance.filters.exposure')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            <TouchableOpacity
              style={[
                styles.pill,
                {
                  backgroundColor: !selectedExposure ? colors.primary : colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedExposure(undefined)}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: !selectedExposure ? colors.primaryForeground : colors.foreground },
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
                    styles.pill,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setSelectedExposure(active ? undefined : it)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {it.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Date range inputs */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: spacing.xs }}>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('surveillance.filters.startDate')}
                placeholderTextColor={colors.mutedForeground}
                value={startDate}
                onChangeText={setStartDate}
                maxLength={10}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder={t('surveillance.filters.endDate')}
                placeholderTextColor={colors.mutedForeground}
                value={endDate}
                onChangeText={setEndDate}
                maxLength={10}
              />
            </View>
          </View>
        </View>

        {/* ─── 1. OVERVIEW INDICATORS ───────────────────────────── */}
        <Text style={[styles.mainSectionTitle, { color: colors.foreground }]}>
          {t('surveillance.overview.title')}
        </Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{overview.totalDeclarations}</Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{t('surveillance.overview.total')}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.kpiValue, { color: colors.accent }]}>{overview.submittedDeclarations}</Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{t('surveillance.overview.submitted')}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.kpiValue, { color: colors.secondary }]}>{overview.underReviewDeclarations}</Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{t('surveillance.overview.underReview')}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.kpiValue, { color: colors.destructive }]}>{overview.correctionRequestedDeclarations}</Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{t('surveillance.overview.correctionRequested')}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{overview.activeOhCoordinations}</Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{t('surveillance.overview.activeOh')}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.kpiValue, { color: colors.secondary }]}>{overview.completedOhCoordinations}</Text>
            <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>{t('surveillance.overview.completedOh')}</Text>
          </View>
        </View>

        {/* ─── 2. TEMPORAL DISTRIBUTION (MONTHLY BARS) ──────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            {t('surveillance.temporal.title')}
          </Text>
          {temporalDistribution.length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>{t('surveillance.temporal.empty')}</Text>
          ) : (
            temporalDistribution.map(item => {
              const max = Math.max(...temporalDistribution.map(t => t.count), 1);
              const widthPct = Math.round((item.count / max) * 100);
              return (
                <View key={item.month} style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{item.month}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={[styles.barCount, { color: colors.foreground }]}>{item.count}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* ─── 3. EXPOSURE CATEGORY DISTRIBUTION ────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            {t('surveillance.exposure.title')}
          </Text>
          {exposureDistribution.length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>{t('surveillance.exposure.empty')}</Text>
          ) : (
            exposureDistribution.map(item => {
              const max = Math.max(...exposureDistribution.map(e => e.count), 1);
              const widthPct = Math.round((item.count / max) * 100);
              return (
                <View key={item.incidentType} style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.incidentType.replace('_', ' ')}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: colors.accent }]} />
                  </View>
                  <Text style={[styles.barCount, { color: colors.foreground }]}>{item.count}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* ─── 4. DECLARATION STATUS DISTRIBUTION ──────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            {t('surveillance.status.title')}
          </Text>
          {statusDistribution.map(item => (
            <View key={item.status} style={styles.distributionRow}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t(`status.${item.status}` as any)}</Text>
              <Text style={[styles.rowValue, { color: colors.primary }]}>{item.count}</Text>
            </View>
          ))}
        </View>

        {/* ─── 5. ADMINISTRATIVE REVIEW INDICATORS ──────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            {t('surveillance.admin.title')}
          </Text>
          <View style={styles.distributionRow}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('surveillance.admin.totalReviews')}</Text>
            <Text style={[styles.rowValue, { color: colors.primary }]}>{administrativeReview.totalReviews}</Text>
          </View>
          <View style={styles.distributionRow}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('surveillance.admin.correctionRequests')}</Text>
            <Text style={[styles.rowValue, { color: colors.destructive }]}>{administrativeReview.correctionRequests}</Text>
          </View>
          <View style={styles.distributionRow}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('surveillance.admin.correctionResponses')}</Text>
            <Text style={[styles.rowValue, { color: colors.secondary }]}>{administrativeReview.correctionResponses}</Text>
          </View>

          {administrativeReview.outcomes.length > 0 && (
            <View style={{ marginTop: spacing.xs }}>
              <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>{t('surveillance.admin.outcomes')}</Text>
              {administrativeReview.outcomes.map(item => (
                <View key={item.outcome} style={styles.distributionRow}>
                  <Text style={[styles.subRowLabel, { color: colors.mutedForeground }]}>
                    {t(`review.outcome.${item.outcome}` as any)}
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.foreground }]}>{item.count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── 6. OCCUPATIONAL HEALTH INDICATORS ────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: spacing.xl }]}>
          <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
            {t('surveillance.oh.title')}
          </Text>

          {/* Coordination status */}
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>{t('surveillance.oh.status')}</Text>
          {occupationalHealth.statusDistribution.map(item => (
            <View key={item.status} style={styles.distributionRow}>
              <Text style={[styles.subRowLabel, { color: colors.mutedForeground }]}>{t(`oh.status.${item.status}` as any)}</Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>{item.count}</Text>
            </View>
          ))}

          {/* Follow-up events */}
          <Text style={[styles.filterLabel, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
            {t('surveillance.oh.events')}
          </Text>
          {occupationalHealth.eventCategories.length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.mutedForeground }]}>{t('oh.detail.noEvents')}</Text>
          ) : (
            occupationalHealth.eventCategories.map(item => (
              <View key={item.category} style={styles.distributionRow}>
                <Text style={[styles.subRowLabel, { color: colors.mutedForeground }]}>{t(`oh.event.${item.category}` as any)}</Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>{item.count}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.screenPadding },
  centeredContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  badgeRow: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  badgeText: { fontSize: typography.fontSize.xs, fontWeight: '700' },
  disclaimerBox: {
    borderRadius: shapes.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  disclaimerText: { fontSize: typography.fontSize.xs },
  card: {
    borderRadius: shapes.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  mainSectionTitle: { fontSize: typography.fontSize.bodyLarge, fontWeight: '700', marginBottom: spacing.xs },
  sectionHeading: { fontSize: typography.fontSize.bodyMedium, fontWeight: '700', marginBottom: spacing.xs },
  clearFilterText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  filterLabel: { fontSize: typography.fontSize.xs, fontWeight: '600', marginBottom: spacing.xxs },
  pillScroll: { flexDirection: 'row', marginBottom: spacing.xs },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: shapes.full,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  pillText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  dateRow: { flexDirection: 'row', marginTop: spacing.xs },
  dateInput: {
    borderRadius: shapes.sm,
    padding: spacing.xs,
    fontSize: typography.fontSize.xs,
    borderWidth: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  kpiCard: {
    width: '31%',
    borderRadius: shapes.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  kpiValue: { fontSize: typography.fontSize.bodyLarge, fontWeight: '700' },
  kpiLabel: { fontSize: typography.fontSize.xs, textAlign: 'center', marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  barLabel: { width: 75, fontSize: typography.fontSize.xs },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: shapes.full,
    overflow: 'hidden',
    marginHorizontal: spacing.xs,
  },
  barFill: { height: '100%', borderRadius: shapes.full },
  barCount: { width: 25, fontSize: typography.fontSize.xs, textAlign: 'right', fontWeight: '600' },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowLabel: { fontSize: typography.fontSize.bodySmall, fontWeight: '500' },
  subRowLabel: { fontSize: typography.fontSize.xs },
  rowValue: { fontSize: typography.fontSize.bodySmall, fontWeight: '700' },
  emptyNote: { fontSize: typography.fontSize.xs, fontStyle: 'italic', marginVertical: spacing.xs },
  unauthorizedBox: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: shapes.md,
    borderWidth: 1,
  },
  unauthorizedText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center' },
  unauthorizedSubtext: { fontSize: typography.fontSize.xs },
  filterSummaryBanner: {
    marginHorizontal: spacing.screenPadding,
    padding: spacing.xs,
    borderRadius: shapes.sm,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  filterSummaryText: { fontSize: typography.fontSize.xs, fontWeight: '600', textAlign: 'center' },
  errorText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center' },
});
