/**
 * AES Guardian Administrative Review Action Screen
 *
 * Phase 2C.3: Review decision recording for submitted AES declarations.
 *
 * Strictly enforces:
 * - Reviewer role: admin_reviewer only.
 * - Non-destructive review: original declaration data is read-only and immutable.
 * - Review outcomes: acknowledged, transmission_verified, correction_requested.
 * - Mandatory correction reason when outcome is correction_requested.
 * - Full audit event logging: ADMIN_REVIEW_RECORDED / CORRECTION_REQUESTED.
 * - Audit disclaimer: local records are not legally binding.
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
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  AesDeclaration,
  AdministrativeReview,
  CorrectionResponse,
  ReviewOutcome,
  logAuditEvent,
  canReview,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  adminReviewAction: { declarationId: number };
};

export const AdminReviewActionScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'adminReviewAction'>>();
  const { declarationId } = route.params;

  const reviewerContext = SYNTHETIC_ADMIN_REVIEWER_CONTEXT;
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
        db.getDeclarationById(declarationId),
        db.getDeclarationReviewHistory(declarationId),
        db.getCorrectionResponses(declarationId),
      ]);
      setDeclaration(decl);
      setReviewHistory(history);
      setCorrectionResponses(responses);
    } catch (e) {
      Alert.alert(t('error.generic'), t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [declarationId, isAuthorized]);

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
        `Cette déclaration a le statut "${declaration.status}" et ne peut pas faire l'objet d'une révision.`,
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
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ],
              );
            } catch (err: any) {
              Alert.alert(t('error.saveFailed'), err?.message || t('error.generic'));
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          {t('review.unauthorized')}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!declaration) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          {t('error.loadFailed')}
        </Text>
      </View>
    );
  }

  const outcomes: Array<{ key: ReviewOutcome; titleKey: any; descKey: any }> = [
    {
      key: 'acknowledged',
      titleKey: 'review.outcome.acknowledged',
      descKey: 'review.outcome.acknowledgedDesc',
    },
    {
      key: 'transmission_verified',
      titleKey: 'review.outcome.transmission_verified',
      descKey: 'review.outcome.transmission_verifiedDesc',
    },
    {
      key: 'correction_requested',
      titleKey: 'review.outcome.correction_requested',
      descKey: 'review.outcome.correction_requestedDesc',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('review.title')}
        </Text>
        <Text style={[styles.refNumber, { color: colors.primary }]}>
          {declaration.reference_number}
        </Text>
      </View>

      {/* Read-only Notice */}
      <View style={[styles.noticeBanner, { backgroundColor: colors.muted }]}>
        <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
          {t('review.readOnlyNotice')}
        </Text>
      </View>

      {/* Declaration Summary (Read-Only) */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
          Résumé de la déclaration (Lecture seule)
        </Text>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
            {t('details.incidentDate')} :
          </Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {declaration.incident_date}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
            {t('details.incidentType')} :
          </Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {declaration.incident_type}
          </Text>
        </View>

        {declaration.department_code && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.departmentCode')} :
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.department_code}
            </Text>
          </View>
        )}

        {declaration.exposure_description && (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.exposureDescription')} :
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.exposure_description}
            </Text>
          </View>
        )}

        {declaration.circumstances && (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.circumstances')} :
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.circumstances}
            </Text>
          </View>
        )}
      </View>

      {/* Review History */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
          {t('review.historyTitle')} ({reviewHistory.length})
        </Text>

        {reviewHistory.length === 0 ? (
          <Text style={[styles.emptyHistoryText, { color: colors.mutedForeground }]}>
            {t('review.noHistory')}
          </Text>
        ) : (
          reviewHistory.map((rev) => (
            <View
              key={rev.id}
              style={[styles.historyItem, { borderLeftColor: colors.primary, backgroundColor: colors.muted }]}
            >
              <View style={styles.historyItemHeader}>
                <Text style={[styles.historyOutcome, { color: colors.foreground }]}>
                  {t(`review.outcome.${rev.outcome}` as any)}
                </Text>
                <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>
                  {rev.reviewed_at ? new Date(rev.reviewed_at).toLocaleDateString() : ''}
                </Text>
              </View>

              {rev.correction_reason && (
                <Text style={[styles.historyReason, { color: colors.destructive }]}>
                  Motif : {rev.correction_reason}
                </Text>
              )}

              {rev.comments && (
                <Text style={[styles.historyComments, { color: colors.mutedForeground }]}>
                  Notes : {rev.comments}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Declarant Response for Re-Review */}
      {correctionResponses.length > 0 && (
        <View style={[styles.card, styles.responseHighlightCard, { backgroundColor: '#f5f3ff', borderColor: '#8b5cf6' }]}>
          <Text style={[styles.sectionHeading, { color: '#6d28d9' }]}>
            ★ {t('review.declarantResponseHeader')}
          </Text>
          <Text style={[styles.responseHighlightText, { color: '#1e293b' }]}>
            {correctionResponses[0].response_text}
          </Text>
          <Text style={[styles.responseHighlightDate, { color: '#64748b' }]}>
            {t('reviewQueue.submittedAt')} {new Date(correctionResponses[0].responded_at).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Review Decision Form */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
          {t('review.selectOutcome')}
        </Text>

        {outcomes.map((item) => {
          const isSelected = selectedOutcome === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.outcomeOption,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? colors.primary + '15' : colors.card,
                },
              ]}
              onPress={() => {
                setSelectedOutcome(item.key);
                setValidationError(null);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={styles.radioRow}>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: isSelected ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {isSelected && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={styles.outcomeTextContainer}>
                  <Text style={[styles.outcomeTitle, { color: colors.foreground }]}>
                    {t(item.titleKey)}
                  </Text>
                  <Text style={[styles.outcomeDesc, { color: colors.mutedForeground }]}>
                    {t(item.descKey)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Correction reason input (mandatory when correction_requested) */}
        {selectedOutcome === 'correction_requested' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              {t('review.correctionReason')}
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: colors.foreground,
                  borderColor: validationError ? colors.destructive : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              multiline
              numberOfLines={3}
              placeholder={t('review.correctionReasonPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={correctionReason}
              onChangeText={(text) => {
                setCorrectionReason(text);
                if (validationError) setValidationError(null);
              }}
              accessibilityLabel={t('review.correctionReason')}
            />
            {validationError && (
              <Text style={[styles.errorSubtext, { color: colors.destructive }]}>
                {validationError}
              </Text>
            )}
          </View>
        )}

        {/* Optional general comments */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>
            {t('review.comments')}
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            multiline
            numberOfLines={2}
            placeholder={t('review.commentsPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            value={comments}
            onChangeText={setComments}
            accessibilityLabel={t('review.comments')}
          />
        </View>

        {/* Submit Review Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmitReview}
          disabled={submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
              {declaration?.status === 'resubmitted'
                ? t('review.rereviewButton')
                : t('review.submitButton')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.titleLarge,
    fontWeight: '700',
  },
  refNumber: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '600',
    marginTop: 2,
  },
  noticeBanner: {
    padding: spacing.sm,
    borderRadius: shapes.sm,
  },
  noticeText: {
    fontSize: typography.fontSize.bodySmall,
    fontStyle: 'italic',
  },
  card: {
    borderRadius: shapes.md,
    borderWidth: 1,
    padding: spacing.cardPadding,
    gap: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailBlock: {
    gap: 2,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: typography.fontSize.bodySmall,
  },
  emptyHistoryText: {
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  },
  historyItem: {
    borderLeftWidth: 3,
    borderRadius: shapes.sm,
    padding: spacing.xs,
    gap: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyOutcome: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: typography.fontSize.xs,
  },
  historyReason: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  historyComments: {
    fontSize: typography.fontSize.xs,
  },
  outcomeOption: {
    borderRadius: shapes.md,
    borderWidth: 1.5,
    padding: spacing.sm,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  outcomeTextContainer: {
    flex: 1,
    gap: 2,
  },
  outcomeTitle: {
    fontSize: typography.fontSize.bodySmall,
    fontWeight: '700',
  },
  outcomeDesc: {
    fontSize: typography.fontSize.xs,
  },
  inputGroup: {
    marginTop: spacing.xs,
    gap: 4,
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: shapes.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.bodySmall,
    textAlignVertical: 'top',
  },
  errorSubtext: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: shapes.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitButtonText: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '700',
  },
  errorText: {
    fontSize: typography.fontSize.bodyMedium,
    textAlign: 'center',
  },
  responseHighlightCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  responseHighlightText: {
    fontSize: typography.fontSize.bodySmall,
    marginVertical: spacing.xs,
    lineHeight: 20,
  },
  responseHighlightDate: {
    fontSize: typography.fontSize.xs,
  },
});

export default AdminReviewActionScreen;
