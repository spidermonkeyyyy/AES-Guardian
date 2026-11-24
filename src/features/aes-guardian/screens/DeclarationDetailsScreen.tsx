/**
 * AES Guardian — Declaration Details Screen
 *
 * Phase 2E.1.4.3 — Batch 4
 *
 * 5-tab details view for exposed_professional and admin_reviewer.
 * Tabs: Résumé | Incident | Mesures | Statut | Suivi
 * No Timeline/Chronologie tab (explicitly deferred per blueprint).
 *
 * Follow-up tab data projections:
 *   exposed_professional: id, declaration_id, status, created_at, updated_at ONLY
 *   admin_reviewer: AdminOhCoordinationSummary fields (no OH staff IDs or events)
 *   All other roles: blocked entirely
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { aesColors, aesSpacing, aesTypography, aesRadii, aesBannerColors } from '../../../theme/tokens';
import {
  getDatabase,
  AesDeclaration,
  AdministrativeReview,
  OhCoordination,
  AdminOhCoordinationSummary,
  ExposedOhCoordinationSummary,
  useDemoRoleStore,
  canRespondToCorrection,
} from '../../../core';
import { t, useLocale, type SupportedLocale } from '../../../localization';
import { AesScreenContainer, AesScreenHeader, AesStatusBadge } from '../components';

import AppText from '../../../components/AppText';
// ─── Types ───────────────────────────────────────────────────────────────────

type ParamList = {
  declarationDetails: { declarationId: number };
};

type TabKey = 'summary' | 'incident' | 'measures' | 'status' | 'followup';

const TAB_KEYS: TabKey[] = ['summary', 'incident', 'measures', 'status', 'followup'];

const TAB_LABEL_KEYS: Record<TabKey, string> = {
  summary: 'details.tab.summary',
  incident: 'details.tab.incident',
  measures: 'details.tab.measures',
  status: 'details.tab.status',
  followup: 'details.tab.followup',
};

const PERMITTED_ROLES = ['exposed_professional', 'admin_reviewer'] as const;
const DATE_LOCALES: Record<SupportedLocale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  ar: 'ar',
};

function formatAppDate(value: string, locale: SupportedLocale): string {
  const dateInput = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(DATE_LOCALES[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Helper components ────────────────────────────────────────────────────────

const LabelValue: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.labelValueRow}>
    <AppText style={[styles.fieldLabel, { color: aesColors.textSecondary }]}>{label}</AppText>
    <AppText style={[styles.fieldValue, { color: aesColors.textPrimary }]}>{value}</AppText>
  </View>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const DeclarationDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'declarationDetails'>>();
  const { declarationId } = route.params;
  const { activeContext } = useDemoRoleStore();
  const { role, userId } = activeContext;
  const locale = useLocale();

  const [declaration, setDeclaration] = useState<AesDeclaration | null>(null);
  const [reviewHistory, setReviewHistory] = useState<AdministrativeReview[]>([]);
  const [ohCoordination, setOhCoordination] = useState<
    OhCoordination | AdminOhCoordinationSummary | ExposedOhCoordinationSummary | null
  >(null);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPermitted = (PERMITTED_ROLES as readonly string[]).includes(role);

  // ─── Load ─────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!isPermitted) return;
    setLoading(true);
    setNotFound(false);
    try {
      const db = getDatabase();

      // Load declaration — catch Unauthorized separately
      let decl: AesDeclaration | null = null;
      try {
        decl = await db.getDeclarationById(declarationId, userId);
      } catch (e: any) {
        const msg: string = e?.message ?? '';
        if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('not found')) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        throw e;
      }

      if (!decl) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setDeclaration(decl);

      // Load review history — graceful fallback
      try {
        const history = await db.getDeclarationReviewHistory(declarationId, userId);
        setReviewHistory(history ?? []);
      } catch {
        setReviewHistory([]);
      }

      // Load OH coordination — graceful null
      try {
        const coord = await db.getOhCoordinationByDeclaration(declarationId, userId);
        setOhCoordination(coord ?? null);
      } catch {
        setOhCoordination(null);
      }
    } catch (e: any) {
      Alert.alert(t('error.generic'), e?.message ?? t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [declarationId, userId, role, isPermitted]);

  useEffect(() => {
    setDeclaration(null);
    setReviewHistory([]);
    setOhCoordination(null);
    setActiveTab('summary');
    loadData();
  }, [declarationId, userId, role]);

  // ─── Restricted ───────────────────────────────────────────────────────────

  if (!isPermitted) {
    return (
      <AesScreenContainer>
        <AesScreenHeader
          title={t('details.restrictedAccess')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centeredState}>
          <AppText style={[styles.stateText, { color: aesColors.textSecondary }]}>
            {t('details.restrictedAccess')}
          </AppText>
        </View>
      </AesScreenContainer>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AesScreenContainer>
        <AesScreenHeader title="" onBack={() => navigation.goBack()} />
        <View style={styles.centeredState}>
          <ActivityIndicator color={aesColors.accentGreen} />
        </View>
      </AesScreenContainer>
    );
  }

  // ─── Not found / unauthorized ─────────────────────────────────────────────

  if (notFound || !declaration) {
    return (
      <AesScreenContainer>
        <AesScreenHeader
          title={t('details.notFound')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centeredState}>
          <AppText style={[styles.stateText, { color: aesColors.textSecondary }]}>
            {t('details.notFound')}
          </AppText>
        </View>
      </AesScreenContainer>
    );
  }

  // ─── Derived state ────────────────────────────────────────────────────────

  // Find pending correction review for exposed_professional
  const pendingCorrectionReview = reviewHistory.find(
    (r) => r.outcome === 'correction_requested' && !r.response,
  );

  const canCorrect =
    role === 'exposed_professional' &&
    declaration.status === 'correction_requested' &&
    pendingCorrectionReview != null &&
    canRespondToCorrection(activeContext);

  const canAdminReview =
    role === 'admin_reviewer' &&
    ['submitted', 'under_review', 'resubmitted'].includes(declaration.status);

  // ─── Tab content renderers ────────────────────────────────────────────────

  const renderSummaryTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
      {/* Header card */}
      <View style={[styles.sectionCard]}>
        <View style={styles.cardTopRow}>
          <AppText style={[styles.referenceText, { color: aesColors.textPrimary }]}>
            {declaration.reference_number || t('list.refUnavailable')}
          </AppText>
          <AesStatusBadge status={declaration.status} domain="declaration" />
        </View>
        {declaration.created_at ? (
          <LabelValue
            label={t('details.createdAt')}
            value={formatAppDate(declaration.created_at, locale)}
          />
        ) : null}
        {declaration.submitted_at ? (
          <LabelValue
            label={t('details.submittedAt')}
            value={formatAppDate(declaration.submitted_at, locale)}
          />
        ) : null}
      </View>

      {/* Correction pending banner */}
      {canCorrect && pendingCorrectionReview ? (
        <View
          style={[
            styles.banner,
            { backgroundColor: aesBannerColors.warning.bg, borderColor: aesBannerColors.warning.border },
          ]}
        >
          <AppText style={[styles.sectionLabel, { color: aesBannerColors.warning.text }]}>
            {t('details.pendingCorrectionTitle')}
          </AppText>
          {pendingCorrectionReview.correction_reason ? (
            <AppText style={[styles.bannerText, { color: aesBannerColors.warning.text }]}>
              {pendingCorrectionReview.correction_reason}
            </AppText>
          ) : (
            <AppText style={[styles.bannerText, { color: aesBannerColors.warning.text }]}>
              {t('details.correctionPending')}
            </AppText>
          )}
          <TouchableOpacity
            disabled={submitting}
            onPress={() =>
              navigation.navigate('correctionResponse', {
                declarationId: declaration.id,
                reviewId: pendingCorrectionReview.id,
              })
            }
            style={[styles.actionButton, submitting && styles.actionButtonDisabled]}
            accessibilityRole="button"
            testID="respond-correction-button"
          >
            <AppText style={styles.actionButtonText}>{t('details.respondToCorrection')}</AppText>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Draft edit action */}
      {role === 'exposed_professional' && declaration.status === 'draft' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            disabled={submitting}
            onPress={() => navigation.navigate('newDeclaration', { declarationId: declaration.id })}
            style={[styles.actionButton, submitting && styles.actionButtonDisabled]}
            accessibilityRole="button"
            testID="edit-draft-button"
          >
            <AppText style={styles.actionButtonText}>{t('details.editDraft')}</AppText>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );

  const renderIncidentTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
      <View style={styles.sectionCard}>
        {declaration.incident_date ? (
          <LabelValue
            label={t('details.incidentDate')}
            value={formatAppDate(declaration.incident_date, locale)}
          />
        ) : null}
        {declaration.incident_type ? (
          <LabelValue
            label={t('details.incidentType')}
            value={
              (t as any)(`form.incidentType.${declaration.incident_type.replace('_exposure', '')}`) ??
              declaration.incident_type
            }
          />
        ) : null}
        {declaration.department_code ? (
          <LabelValue
            label={t('details.departmentCode')}
            value={declaration.department_code}
          />
        ) : null}
        {declaration.circumstances ? (
          <LabelValue
            label={t('details.circumstances')}
            value={declaration.circumstances}
          />
        ) : null}
        {declaration.exposure_description ? (
          <LabelValue
            label={t('details.exposureDescription')}
            value={declaration.exposure_description}
          />
        ) : null}
      </View>
    </ScrollView>
  );

  const renderMeasuresTab = () => {
    const hasData = declaration.protective_measures_taken || declaration.notes;
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
        <View style={styles.sectionCard}>
          {declaration.protective_measures_taken ? (
            <LabelValue
              label={t('details.protectiveMeasures')}
              value={declaration.protective_measures_taken}
            />
          ) : null}
          {declaration.notes ? (
            <LabelValue label={t('details.notes')} value={declaration.notes} />
          ) : null}
          {!hasData ? (
            <AppText style={[styles.emptyTabText, { color: aesColors.textSecondary }]}>
              {t('details.notSet')}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    );
  };

  const renderStatusTab = () => (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
      <View style={styles.sectionCard}>
        {/* Current status badge */}
        <View style={styles.badgeRow}>
          <AppText style={[styles.fieldLabel, { color: aesColors.textSecondary }]}>
            {t('details.status')}
          </AppText>
          <AesStatusBadge status={declaration.status} domain="declaration" />
        </View>

        {/* Review history */}
        {reviewHistory.length > 0 ? (
          <>
            <AppText style={[styles.sectionLabel, { color: aesColors.textPrimary }]}>
              {t('details.reviewHistory')}
            </AppText>
            {reviewHistory.map((review, idx) => (
              <View key={review.id ?? idx} style={styles.reviewRow}>
                <View style={styles.reviewRowHeader}>
                  <AppText style={[styles.reviewDate, { color: aesColors.textSecondary }]}>
                    {review.reviewed_at
                      ? formatAppDate(review.reviewed_at, locale)
                      : review.created_at
                      ? formatAppDate(review.created_at, locale)
                      : ''}
                  </AppText>
                  <AesStatusBadge
                    status={review.outcome ?? 'acknowledged'}
                    domain="declaration"
                  />
                </View>
                {review.comments ? (
                  <AppText style={[styles.reviewComment, { color: aesColors.textSecondary }]}>
                    {review.comments}
                  </AppText>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {/* Admin reviewer actions */}
        {canAdminReview ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              disabled={submitting}
              onPress={() =>
                navigation.navigate('adminReviewAction', { declarationId: declaration.id })
              }
              style={[styles.actionButton, submitting && styles.actionButtonDisabled]}
              accessibilityRole="button"
              testID="admin-review-action-button"
            >
              <AppText style={styles.actionButtonText}>{t('details.reviewAction')}</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={submitting}
              onPress={() =>
                navigation.navigate('createCoordination', { declarationId: declaration.id })
              }
              style={[styles.actionButtonSecondary, submitting && styles.actionButtonDisabled]}
              accessibilityRole="button"
              testID="create-coordination-button"
            >
              <AppText style={[styles.actionButtonText, { color: aesColors.textPrimary }]}>
                {t('details.createCoordination')}
              </AppText>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Exposed professional correction response */}
        {canCorrect && pendingCorrectionReview ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              disabled={submitting}
              onPress={() =>
                navigation.navigate('correctionResponse', {
                  declarationId: declaration.id,
                  reviewId: pendingCorrectionReview.id,
                })
              }
              style={[styles.actionButton, submitting && styles.actionButtonDisabled]}
              accessibilityRole="button"
              testID="correction-response-button-status"
            >
              <AppText style={styles.actionButtonText}>{t('details.respondToCorrection')}</AppText>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );

  const renderFollowupTab = () => {
    if (!ohCoordination) {
      return (
        <View style={styles.centeredState}>
          <AppText style={[styles.emptyTabText, { color: aesColors.textSecondary }]}>
            {t('details.followup.noCoordination')}
          </AppText>
        </View>
      );
    }

    if (role === 'exposed_professional') {
      // Exposed: show ONLY 5 safe fields (id, declaration_id, status, created_at, updated_at)
      // Do NOT render: coordination_reason, staff IDs, events, clinical info
      const c = ohCoordination as ExposedOhCoordinationSummary;
      return (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
          <View style={styles.sectionCard}>
            <View style={styles.badgeRow}>
              <AppText style={[styles.fieldLabel, { color: aesColors.textSecondary }]}>
                {t('details.followup.coordinationStatus')}
              </AppText>
              <AesStatusBadge
                status={c.status}
                domain="ohCoordination"
                testID="followup-status-badge"
              />
            </View>
            {c.created_at ? (
              <LabelValue
                label={t('details.followup.coordinationDate')}
                value={formatAppDate(c.created_at, locale)}
              />
            ) : null}
            {c.updated_at ? (
              <LabelValue
                label={t('details.followup.updatedAt')}
                value={formatAppDate(c.updated_at, locale)}
              />
            ) : null}
          </View>
        </ScrollView>
      );
    }

    // admin_reviewer: AdminOhCoordinationSummary
    // Show: status, coordination_reason, acknowledged_at, completed_at, created_at, updated_at
    // Do NOT show: acknowledged_by_user_id, completed_by_user_id, oh_follow_up_events
    const admin = ohCoordination as AdminOhCoordinationSummary;
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
        <View style={styles.sectionCard}>
          <AppText style={[styles.sectionLabel, { color: aesColors.textPrimary }]}>
            {t('details.followup.adminSummary')}
          </AppText>
          <View style={styles.badgeRow}>
            <AppText style={[styles.fieldLabel, { color: aesColors.textSecondary }]}>
              {t('details.followup.coordinationStatus')}
            </AppText>
            <AesStatusBadge
              status={admin.status}
              domain="ohCoordination"
              testID="admin-followup-status-badge"
            />
          </View>
          {admin.coordination_reason ? (
            <LabelValue
              label={t('details.followup.reason')}
              value={
                (t as any)(`oh.reason.${admin.coordination_reason}`) ??
                admin.coordination_reason
              }
            />
          ) : null}
          {admin.created_at ? (
            <LabelValue
              label={t('details.followup.coordinationDate')}
              value={formatAppDate(admin.created_at, locale)}
            />
          ) : null}
          {admin.acknowledged_at ? (
            <LabelValue
              label={t('details.followup.acknowledgedAt')}
              value={formatAppDate(admin.acknowledged_at, locale)}
            />
          ) : null}
          {admin.completed_at ? (
            <LabelValue
              label={t('details.followup.completedAt')}
              value={formatAppDate(admin.completed_at, locale)}
            />
          ) : null}
          {admin.updated_at ? (
            <LabelValue
              label={t('details.followup.updatedAt')}
              value={formatAppDate(admin.updated_at, locale)}
            />
          ) : null}
        </View>
      </ScrollView>
    );
  };

  const renderActiveTab = (): React.ReactNode => {
    switch (activeTab) {
      case 'summary':  return renderSummaryTab();
      case 'incident': return renderIncidentTab();
      case 'measures': return renderMeasuresTab();
      case 'status':   return renderStatusTab();
      case 'followup': return renderFollowupTab();
      default:         return null;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AesScreenContainer>
      <AesScreenHeader
        title={declaration.reference_number || t('list.refUnavailable')}
        onBack={() => navigation.goBack()}
      />

      {/* Tab bar — 5 tabs only, no Timeline tab */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { borderBottomColor: aesColors.borderSubdued }]}
        contentContainerStyle={styles.tabBarContent}
        testID="details-tab-bar"
      >
        {TAB_KEYS.map((tabKey) => {
          const isActive = activeTab === tabKey;
          return (
            <TouchableOpacity
              key={tabKey}
              onPress={() => setActiveTab(tabKey)}
              style={[
                styles.tabItem,
                isActive && {
                  borderBottomColor: aesColors.accentGreen,
                  borderBottomWidth: 2,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              testID={`tab-${tabKey}`}
            >
              <AppText
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? aesColors.accentGreen : aesColors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {t(TAB_LABEL_KEYS[tabKey] as any)}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab content */}
      <View style={styles.tabContentContainer}>{renderActiveTab()}</View>
    </AesScreenContainer>
  );
};

export default DeclarationDetailsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: aesSpacing.xl,
  },
  stateText: {
    ...aesTypography.body,
    textAlign: 'center',
  },
  // Tab bar
  tabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingHorizontal: aesSpacing.sm,
  },
  tabItem: {
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.sm,
    marginBottom: -1,
  },
  tabLabel: {
    ...aesTypography.bodySmall,
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  tabContentPadding: {
    padding: aesSpacing.screenHorizontal,
    gap: aesSpacing.md,
  },
  // Cards and sections
  sectionCard: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.cardPadding,
    gap: aesSpacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: aesSpacing.xs,
  },
  referenceText: {
    ...aesTypography.heading2,
    flex: 1,
    marginRight: aesSpacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: aesSpacing.sm,
    flexWrap: 'wrap',
  },
  sectionLabel: {
    ...aesTypography.labelSmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: aesSpacing.xs,
  },
  // Label-value
  labelValueRow: {
    gap: 2,
  },
  fieldLabel: {
    ...aesTypography.labelSmall,
    fontWeight: '600',
  },
  fieldValue: {
    ...aesTypography.bodySmall,
  },
  // Review history
  reviewRow: {
    paddingVertical: aesSpacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: aesColors.borderSubdued,
    gap: aesSpacing.xs,
  },
  reviewRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDate: {
    ...aesTypography.labelSmall,
  },
  reviewComment: {
    ...aesTypography.bodySmall,
    fontStyle: 'italic',
  },
  // Actions
  actionRow: {
    marginTop: aesSpacing.sm,
    gap: aesSpacing.sm,
  },
  actionButton: {
    backgroundColor: aesColors.primaryAction,
    padding: aesSpacing.md,
    borderRadius: aesRadii.pill,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: aesColors.secondaryAction,
    padding: aesSpacing.md,
    borderRadius: aesRadii.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: aesColors.borderMedium,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: aesColors.textInverse,
    ...aesTypography.bodySmall,
    fontWeight: '600',
  },
  // Banner
  banner: {
    borderRadius: aesRadii.card,
    borderWidth: 1,
    padding: aesSpacing.cardPadding,
    gap: aesSpacing.sm,
  },
  bannerText: {
    ...aesTypography.bodySmall,
  },
  // Empty
  emptyTabText: {
    ...aesTypography.body,
    textAlign: 'center',
    padding: aesSpacing.xl,
  },
});
