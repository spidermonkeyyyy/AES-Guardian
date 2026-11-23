/**
 * AES Guardian Administrative Review Action Screen
 *
 * Phase 2E.1.5.1 — Batch 5: Administrative Review Queue & Actions
 *
 * Strictly enforces:
 * - Reviewer role: admin_reviewer only.
 * - Non-destructive review: original declaration data is read-only and immutable.
 * - Review outcomes: acknowledged, transmission_verified, correction_requested.
 * - Mandatory correction reason when outcome is correction_requested.
 * - Full audit event logging: ADMIN_REVIEW_RECORDED / CORRECTION_REQUESTED / ADMIN_REREVIEW_RECORDED.
 * - Design system: AesScreenContainer, AesScreenHeader, AesCard, AesButton.
 * - Accessibility: decision options with >= 48dp touch target, accessibilityRole="radio", accessibilityState={{ checked }}.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  aesColors,
  aesDeclarationStatusColors,
  aesBannerColors,
  aesTypography,
  aesSpacing,
  aesRadii,
  aesShadows,
} from '../../../theme/tokens';
import {
  AesScreenContainer,
  AesScreenHeader,
  AesCard,
  AesButton,
} from '../components';
import {
  getDatabase,
  AesDeclaration,
  AdministrativeReview,
  CorrectionResponse,
  ReviewOutcome,
  logAuditEvent,
  canReview,
  useDemoRoleStore,
} from '../../../core';
import { t, useLocale, TranslationKey } from '../../../localization';

type ParamList = {
  adminReviewAction: { declarationId: number };
};

const DATE_LOCALES = {
  fr: 'fr-FR',
  en: 'en-GB',
  ar: 'ar',
} as const;

const INCIDENT_TYPE_LABELS: Record<string, TranslationKey> = {
  percutaneous_exposure: 'form.incidentType.percutaneous',
  mucocutaneous_exposure: 'form.incidentType.mucocutaneous',
  sexual_assault: 'form.incidentType.sexual_assault',
  other: 'form.incidentType.other',
};

function formatReviewDate(
  value: string,
  locale: keyof typeof DATE_LOCALES,
  includeTime = false,
): string {
  const dateInput = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return value;
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' } as const;
  return includeTime
    ? date.toLocaleString(DATE_LOCALES[locale], {
        ...options,
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleDateString(DATE_LOCALES[locale], options);
}

export const AdminReviewActionScreen: React.FC = () => {
  const locale = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'adminReviewAction'>>();
  const { declarationId } = route.params;

  const { activeContext } = useDemoRoleStore();
  const reviewerContext = activeContext;
  const isAuthorized = canReview(reviewerContext);

  const [declaration, setDeclaration] = useState<AesDeclaration | null>(null);
  const [reviewHistory, setReviewHistory] = useState<AdministrativeReview[]>([]);
  const [correctionResponses, setCorrectionResponses] = useState<CorrectionResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Review form state
  const [selectedOutcome, setSelectedOutcome] = useState<ReviewOutcome>('acknowledged');
  const [comments, setComments] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    try {
      const db = getDatabase();
      const [decl, history, responses] = await Promise.all([
        db.getDeclarationById(declarationId, reviewerContext.userId),
        db.getDeclarationReviewHistory(declarationId, reviewerContext.userId),
        db.getCorrectionResponses(declarationId, reviewerContext.userId),
      ]);
      setDeclaration(decl);
      setReviewHistory(history);
      setCorrectionResponses(responses);
    } catch (e) {
      Alert.alert(t('error.generic'), t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [declarationId, isAuthorized, reviewerContext.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitReview = async () => {
    if (!isAuthorized) {
      Alert.alert(t('error.generic'), t('review.unauthorized'));
      return;
    }

    if (!declaration) return;

    if (
      declaration.status !== 'submitted' &&
      declaration.status !== 'under_review' &&
      declaration.status !== 'resubmitted'
    ) {
      Alert.alert(
        t('error.generic'),
        t('review.notReviewable'),
      );
      return;
    }

    // Validation
    if (selectedOutcome === 'correction_requested' && !correctionReason.trim()) {
      setValidationError(t('review.correctionReasonRequired'));
      return;
    }
    setValidationError(null);

    // Confirmation dialog
    Alert.alert(
      t('review.confirmTitle'),
      t('review.confirmMessage'),
      [
        { text: t('review.cancelButton'), style: 'cancel' },
        {
          text: t('review.confirmButton'),
          onPress: async () => {
            setSubmitting(true);
            try {
              const db = getDatabase();
              const reviewRes = await db.createAdministrativeReview({
                declaration_id: declaration.id,
                reviewer_user_id: reviewerContext.userId!,
                outcome: selectedOutcome,
                comments: comments.trim() || null,
                correction_reason:
                  selectedOutcome === 'correction_requested'
                    ? correctionReason.trim()
                    : null,
              });

              // Log audit event
              const auditEventType =
                declaration.status === 'resubmitted'
                  ? 'ADMIN_REREVIEW_RECORDED'
                  : selectedOutcome === 'correction_requested'
                  ? 'CORRECTION_REQUESTED'
                  : 'ADMIN_REVIEW_RECORDED';

              await logAuditEvent({
                eventType: auditEventType,
                userId: reviewerContext.userId,
                entityType: 'administrative_review',
                entityId: reviewRes.reviewId,
                description: `Admin review recorded for decl #${declaration.reference_number}: outcome=${selectedOutcome}`,
              });

              Alert.alert(
                t('confirm.title'),
                t('review.success'),
                [
                  {
                    text: t('app.ok'),
                    onPress: () => navigation.goBack(),
                  },
                ],
              );
            } catch (error: unknown) {
              const message =
                error instanceof Error ? error.message : t('error.generic');
              Alert.alert(t('error.saveFailed'), message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (!isAuthorized) {
    return (
      <AesScreenContainer testID="admin-review-action-unauthorized">
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {t('review.unauthorized')}
          </Text>
        </View>
      </AesScreenContainer>
    );
  }

  if (loading) {
    return (
      <AesScreenContainer testID="admin-review-action-loading">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
        </View>
      </AesScreenContainer>
    );
  }

  if (!declaration) {
    return (
      <AesScreenContainer testID="admin-review-action-error">
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {t('error.loadFailed')}
          </Text>
        </View>
      </AesScreenContainer>
    );
  }

  const outcomes: Array<{
    key: ReviewOutcome;
    titleKey: any;
    descKey: any;
    statusEffect: string;
  }> = [
    {
      key: 'acknowledged',
      titleKey: 'review.outcome.acknowledged',
      descKey: 'review.outcome.acknowledgedDesc',
      statusEffect: t('reviewAction.outcome.approvedEffect'),
    },
    {
      key: 'transmission_verified',
      titleKey: 'review.outcome.transmission_verified',
      descKey: 'review.outcome.transmission_verifiedDesc',
      statusEffect: t('reviewAction.outcome.approvedEffect'),
    },
    {
      key: 'correction_requested',
      titleKey: 'review.outcome.correction_requested',
      descKey: 'review.outcome.correction_requestedDesc',
      statusEffect: t('reviewAction.outcome.correctionEffect'),
    },
  ];

  return (
    <AesScreenContainer scrollable testID="admin-review-action-screen">
      <AesScreenHeader
        title={t('review.title')}
        subtitle={declaration.reference_number ?? t('list.refUnavailable', locale)}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* Read-only Notice Banner */}
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>
            {t('review.readOnlyNotice')}
          </Text>
        </View>

        {/* Declaration Summary (Read-Only) */}
        <AesCard style={styles.card}>
          <Text style={styles.sectionHeading}>
            {t('reviewAction.declarationSummaryTitle')}
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t('details.incidentDate')} :
            </Text>
            <Text style={styles.detailValue}>
              {formatReviewDate(declaration.incident_date, locale)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {t('details.incidentType')} :
            </Text>
            <Text style={styles.detailValue}>
              {INCIDENT_TYPE_LABELS[declaration.incident_type]
                ? t(INCIDENT_TYPE_LABELS[declaration.incident_type], locale)
                : '—'}
            </Text>
          </View>

          {declaration.department_code && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {t('details.departmentCode')} :
              </Text>
              <Text style={styles.detailValue}>
                {declaration.department_code}
              </Text>
            </View>
          )}

          {declaration.exposure_description && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>
                {t('details.exposureDescription')} :
              </Text>
              <Text style={styles.detailValue}>
                {declaration.exposure_description}
              </Text>
            </View>
          )}

          {declaration.circumstances && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>
                {t('details.circumstances')} :
              </Text>
              <Text style={styles.detailValue}>
                {declaration.circumstances}
              </Text>
            </View>
          )}
        </AesCard>

        {/* Declarant Response for Re-Review (if resubmitted / existing responses) */}
        {correctionResponses.length > 0 && (
          <View style={styles.responseHighlightCard}>
            <Text style={styles.responseHighlightHeader}>
              ★ {t('review.declarantResponseHeader')}
            </Text>
            <Text style={styles.responseHighlightText}>
              {correctionResponses[0].response_text}
            </Text>
            <Text style={styles.responseHighlightDate}>
              {t('reviewQueue.submittedAt')}{' '}
              {formatReviewDate(correctionResponses[0].responded_at, locale, true)}
            </Text>
          </View>
        )}

        {/* Review History */}
        <AesCard style={styles.card}>
          <Text style={styles.sectionHeading}>
            {t('review.historyTitle')} ({reviewHistory.length})
          </Text>

          {reviewHistory.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              {t('review.noHistory')}
            </Text>
          ) : (
            reviewHistory.map((rev) => (
              <View key={rev.id} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyOutcome}>
                    {t(`review.outcome.${rev.outcome}` as any)}
                  </Text>
                  <Text style={styles.historyDate}>
                    {rev.reviewed_at
                      ? formatReviewDate(rev.reviewed_at, locale)
                      : ''}
                  </Text>
                </View>

                {rev.correction_reason && (
                  <Text style={styles.historyReason}>
                    {t('reviewAction.correctionReasonLabel')}{rev.correction_reason}
                  </Text>
                )}

                {rev.comments && (
                  <Text style={styles.historyComments}>
                    {t('reviewAction.commentsLabel')}{rev.comments}
                  </Text>
                )}
              </View>
            ))
          )}
        </AesCard>

        {/* Review Decision Form */}
        <AesCard style={styles.card}>
          <Text style={styles.sectionHeading}>
            {t('review.selectOutcome')}
          </Text>

          {outcomes.map((item) => {
            const isSelected = selectedOutcome === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.outcomeOption,
                  isSelected ? styles.outcomeOptionSelected : styles.outcomeOptionUnselected,
                ]}
                onPress={() => {
                  setSelectedOutcome(item.key);
                  setValidationError(null);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                activeOpacity={0.85}
              >
                <View style={styles.radioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected ? styles.radioOuterSelected : styles.radioOuterUnselected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.outcomeTextContainer}>
                    <Text style={styles.outcomeTitle}>
                      {t(item.titleKey)}
                    </Text>
                    <Text style={styles.outcomeDesc}>
                      {t(item.descKey)}
                    </Text>
                    <Text style={styles.statusEffectText}>
                      {item.statusEffect}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Correction reason input (mandatory when correction_requested) */}
          {selectedOutcome === 'correction_requested' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t('review.correctionReason')}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  validationError ? styles.textAreaError : null,
                ]}
                multiline
                numberOfLines={3}
                placeholder={t('review.correctionReasonPlaceholder')}
                placeholderTextColor={aesColors.textTertiary}
                value={correctionReason}
                onChangeText={(text) => {
                  setCorrectionReason(text);
                  if (validationError) setValidationError(null);
                }}
                accessibilityLabel={t('review.correctionReason')}
              />
              {validationError && (
                <Text style={styles.errorSubtext}>{validationError}</Text>
              )}
            </View>
          )}

          {/* Optional general comments */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {t('review.comments')}
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={2}
              placeholder={t('review.commentsPlaceholder')}
              placeholderTextColor={aesColors.textTertiary}
              value={comments}
              onChangeText={setComments}
              accessibilityLabel={t('review.comments')}
            />
          </View>

          {/* Submit Review Button */}
          <View style={styles.submitContainer}>
            <AesButton
              title={
                declaration?.status === 'resubmitted'
                  ? t('review.rereviewButton')
                  : t('review.submitButton')
              }
              onPress={handleSubmitReview}
              loading={submitting}
              disabled={submitting}
            />
          </View>
        </AesCard>
      </View>
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingBottom: aesSpacing['5xl'],
    gap: aesSpacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: aesSpacing.lg,
  },
  noticeBanner: {
    padding: aesSpacing.md,
    borderRadius: aesRadii.card,
    backgroundColor: aesColors.banners.info.bg,
    borderWidth: 1,
    borderColor: aesColors.banners.info.border,
  },
  noticeText: {
    ...aesTypography.bodySmall,
    color: aesColors.banners.info.text,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  card: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.cardPadding,
    gap: aesSpacing.sm,
    ...aesShadows.card,
  },
  sectionHeading: {
    ...aesTypography.heading2,
    fontSize: 16,
    color: aesColors.textPrimary,
    marginBottom: aesSpacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: aesSpacing.xs,
  },
  detailBlock: {
    gap: 2,
    marginTop: aesSpacing.xs,
  },
  detailLabel: {
    ...aesTypography.bodySmall,
    fontWeight: '600',
    color: aesColors.textSecondary,
  },
  detailValue: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
  },
  emptyHistoryText: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    fontStyle: 'italic',
  },
  historyItem: {
    borderLeftWidth: 3,
    borderLeftColor: aesColors.accentGreen,
    borderRadius: aesRadii.badge,
    backgroundColor: aesColors.surfaceSubdued,
    padding: aesSpacing.xs,
    gap: 2,
    marginVertical: aesSpacing.xs,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyOutcome: {
    ...aesTypography.labelSmall,
    fontWeight: '700',
    color: aesColors.textPrimary,
  },
  historyDate: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
  },
  historyReason: {
    ...aesTypography.bodySmall,
    color: aesColors.banners.error.text,
    fontWeight: '500',
  },
  historyComments: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
  },
  responseHighlightCard: {
    backgroundColor: aesDeclarationStatusColors.resubmitted.bg,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesDeclarationStatusColors.resubmitted.border,
    borderLeftWidth: 4,
    borderLeftColor: aesDeclarationStatusColors.resubmitted.text,
    padding: aesSpacing.cardPadding,
    gap: aesSpacing.xs,
    ...aesShadows.card,
  },
  responseHighlightHeader: {
    ...aesTypography.label,
    color: aesDeclarationStatusColors.resubmitted.text,
    fontWeight: '700',
  },
  responseHighlightText: {
    ...aesTypography.body,
    color: aesColors.textPrimary,
    lineHeight: 20,
  },
  responseHighlightDate: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
  },
  outcomeOption: {
    borderRadius: aesRadii.card,
    borderWidth: 1.5,
    padding: aesSpacing.md,
    minHeight: 56, // >= 48dp touch target
    marginVertical: aesSpacing.xs,
  },
  outcomeOptionSelected: {
    borderColor: aesColors.accentGreen,
    backgroundColor: '#FAFDF9',
  },
  outcomeOptionUnselected: {
    borderColor: aesColors.borderSubdued,
    backgroundColor: aesColors.surface,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: aesSpacing.sm,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioOuterUnselected: {
    borderColor: aesColors.borderStrong,
  },
  radioOuterSelected: {
    borderColor: aesColors.accentGreen,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: aesColors.accentGreen,
  },
  outcomeTextContainer: {
    flex: 1,
    gap: 2,
  },
  outcomeTitle: {
    ...aesTypography.label,
    color: aesColors.textPrimary,
    fontWeight: '700',
  },
  outcomeDesc: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    lineHeight: 18,
  },
  statusEffectText: {
    ...aesTypography.labelSmall,
    color: aesColors.accentGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  inputGroup: {
    marginTop: aesSpacing.sm,
    gap: aesSpacing.xs,
  },
  inputLabel: {
    ...aesTypography.label,
    color: aesColors.textPrimary,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    borderRadius: aesRadii.card,
    padding: aesSpacing.sm,
    fontSize: 14,
    color: aesColors.textPrimary,
    backgroundColor: aesColors.surfaceSubdued,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  textAreaError: {
    borderColor: aesColors.banners.error.border,
    backgroundColor: aesColors.banners.error.bg,
  },
  errorSubtext: {
    ...aesTypography.labelSmall,
    color: aesColors.banners.error.text,
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: aesSpacing.md,
  },
  errorText: {
    ...aesTypography.body,
    color: aesColors.banners.error.text,
    textAlign: 'center',
  },
});

export default AdminReviewActionScreen;