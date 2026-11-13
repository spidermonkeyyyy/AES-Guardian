import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
  DeclarationStatus,
  logAuditEvent,
  SYNTHETIC_DEMO_CONTEXT,
  canRespondToCorrection,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  declarationDetails: { declarationId: number };
};

export const DeclarationDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'declarationDetails'>>();
  const { declarationId } = route.params;

  const [declaration, setDeclaration] = useState<AesDeclaration | null>(null);
  const [reviewHistory, setReviewHistory] = useState<AdministrativeReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const db = getDatabase();
      const [item, history] = await Promise.all([
        db.getDeclarationById(declarationId),
        db.getDeclarationReviewHistory(declarationId),
      ]);
      setDeclaration(item);
      setReviewHistory(history);
    } catch (e) {
      Alert.alert(t('error.generic'), t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [declarationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!declaration || declaration.status !== 'draft') return;
    setSubmitting(true);
    try {
      const db = getDatabase();
      await db.submitDeclaration(declaration.id);

      await logAuditEvent({
        eventType: 'DECLARATION_SUBMITTED',
        userId: SYNTHETIC_DEMO_CONTEXT.userId,
        entityType: 'aes_declaration',
        entityId: declaration.id,
        description: `Declaration ${declaration.reference_number} submitted from details screen`,
      });

      navigation.replace('submissionConfirmation', {
        referenceNumber: declaration.reference_number,
      });
    } catch (err: any) {
      Alert.alert(t('error.submitFailed'), err?.message || t('error.generic'));
      setSubmitting(false);
    }
  };

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

  const isDraft = declaration.status === 'draft';

  const getStatusBadgeStyle = (status: DeclarationStatus) => {
    switch (status) {
      case 'draft':
        return { backgroundColor: colors.muted, textColor: colors.mutedForeground };
      case 'submitted':
        return { backgroundColor: colors.primary, textColor: colors.primaryForeground };
      case 'under_review':
        return { backgroundColor: colors.accent, textColor: colors.accentForeground };
      case 'correction_requested':
        return { backgroundColor: '#f59e0b', textColor: '#ffffff' };
      case 'resubmitted':
        return { backgroundColor: '#8b5cf6', textColor: '#ffffff' };
      case 'closed':
        return { backgroundColor: colors.secondary, textColor: colors.secondaryForeground };
      default:
        return { backgroundColor: colors.muted, textColor: colors.foreground };
    }
  };

  const badgeStyle = getStatusBadgeStyle(declaration.status);
  const statusKey = `status.${declaration.status}` as const;

  const getIncidentTypeLabel = (type: string) => {
    switch (type) {
      case 'percutaneous_exposure':
        return t('form.incidentType.percutaneous');
      case 'mucocutaneous_exposure':
        return t('form.incidentType.mucocutaneous');
      case 'sexual_assault':
        return t('form.incidentType.sexual_assault');
      default:
        return t('form.incidentType.other');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {declaration.reference_number}
        </Text>
        <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: badgeStyle.textColor }]}>
            {t(statusKey as any)}
          </Text>
        </View>
      </View>

      {!isDraft && (
        <View style={[styles.readOnlyBanner, { backgroundColor: colors.muted }]}>
          <Text style={[styles.readOnlyText, { color: colors.mutedForeground }]}>
            {t('details.readOnly')}
          </Text>
        </View>
      )}

      {declaration.status === 'correction_requested' &&
        canRespondToCorrection(SYNTHETIC_DEMO_CONTEXT) &&
        reviewHistory.find((rev) => rev.outcome === 'correction_requested' && !rev.response) && (
          <View style={[styles.correctionBanner, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
            <Text style={[styles.correctionBannerTitle, { color: '#92400e' }]}>
              {t('details.pendingCorrectionTitle')}
            </Text>
            {reviewHistory.find((rev) => rev.outcome === 'correction_requested' && !rev.response)?.correction_reason ? (
              <Text style={[styles.correctionBannerReason, { color: '#b45309' }]}>
                {reviewHistory.find((rev) => rev.outcome === 'correction_requested' && !rev.response)?.correction_reason}
              </Text>
            ) : null}
            {reviewHistory.find((rev) => rev.outcome === 'correction_requested' && !rev.response)?.comments ? (
              <Text style={[styles.correctionBannerComments, { color: '#78350f' }]}>
                {reviewHistory.find((rev) => rev.outcome === 'correction_requested' && !rev.response)?.comments}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[styles.correctionActionButton, { backgroundColor: '#d97706' }]}
              onPress={() => {
                const targetRev = reviewHistory.find(
                  (rev) => rev.outcome === 'correction_requested' && !rev.response,
                );
                if (targetRev) {
                  navigation.navigate('correctionResponse', {
                    declarationId: declaration.id,
                    reviewId: targetRev.id,
                  });
                }
              }}
              accessibilityRole="button"
            >
              <Text style={styles.correctionActionText}>
                {t('details.pendingCorrectionAction')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
            {t('details.incidentDate')}
          </Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {declaration.incident_date}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
            {t('details.incidentType')}
          </Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {getIncidentTypeLabel(declaration.incident_type)}
          </Text>
        </View>

        {declaration.department_code && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.departmentCode')}
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.department_code}
            </Text>
          </View>
        )}

        {declaration.circumstances && (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.circumstances')}
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.circumstances}
            </Text>
          </View>
        )}

        {declaration.exposure_description && (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.exposureDescription')}
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.exposure_description}
            </Text>
          </View>
        )}

        {declaration.protective_measures_taken && (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.protectiveMeasures')}
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.protective_measures_taken}
            </Text>
          </View>
        )}

        {declaration.notes && (
          <View style={styles.detailBlock}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.notes')}
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.notes}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
            {t('details.createdAt')}
          </Text>
          <Text style={[styles.detailValue, { color: colors.foreground }]}>
            {declaration.created_at}
          </Text>
        </View>

        {declaration.submitted_at && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {t('details.submittedAt')}
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {declaration.submitted_at}
            </Text>
          </View>
        )}
      </View>

      {/* Review History */}
      {reviewHistory.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.historyHeading, { color: colors.foreground }]}>
            {t('review.historyTitle')} ({reviewHistory.length})
          </Text>
          {reviewHistory.map((rev) => (
            <View
              key={rev.id}
              style={[
                styles.historyCard,
                { borderLeftColor: colors.primary, backgroundColor: colors.muted },
              ]}
            >
              <View style={styles.historyCardHeader}>
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
              {rev.response && (
                <View style={styles.responseContainer}>
                  <Text style={[styles.responseHeader, { color: colors.primary }]}>
                    {t('review.declarantResponseHeader')}
                  </Text>
                  <Text style={[styles.responseText, { color: colors.foreground }]}>
                    {rev.response.response_text}
                  </Text>
                  <Text style={[styles.responseDate, { color: colors.mutedForeground }]}>
                    {rev.response.responded_at ? new Date(rev.response.responded_at).toLocaleDateString() : ''}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Admin Review Action Button for submitted / under_review / resubmitted declarations */}
      {(declaration.status === 'submitted' ||
        declaration.status === 'under_review' ||
        declaration.status === 'resubmitted') && (
        <View style={styles.adminActionContainer}>
          <TouchableOpacity
            style={[styles.button, styles.reviewButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('adminReviewAction', { declarationId: declaration.id })}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: colors.accentForeground }]}>
              {declaration.status === 'resubmitted'
                ? `${t('review.rereviewButton')} (Admin)`
                : `${t('reviewQueue.openReview')} (Admin)`}
            </Text>
          </TouchableOpacity>
          {/* Phase 2C.4: Admin reviewer can initiate coordination */}
          <TouchableOpacity
            style={[styles.button, styles.reviewButton, { backgroundColor: '#0ea5e9', marginTop: 8 }]}
            onPress={() => navigation.navigate('createCoordination', { declarationId: declaration.id })}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              {t('oh.decl.createCoordination')}
            </Text>
          </TouchableOpacity>
          {/* Phase 2C.4: Show coordination status to exposed_professional */}
          <TouchableOpacity
            style={[styles.button, styles.reviewButton, { backgroundColor: '#6366f1', marginTop: 8 }]}
            onPress={() => navigation.navigate('declarationCoordinationStatus', { declarationId: declaration.id })}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              {t('oh.decl.coordinationStatus')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isDraft && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.editButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('newDeclaration', { declarationId: declaration.id })}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: colors.foreground }]}>
              {t('details.editDraft')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                {t('details.submitDeclaration')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.titleLarge,
    fontWeight: '700',
  },
  badge: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: shapes.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  readOnlyBanner: {
    padding: spacing.sm,
    borderRadius: shapes.sm,
    marginBottom: spacing.md,
  },
  readOnlyText: {
    fontSize: typography.fontSize.bodySmall,
    fontStyle: 'italic',
  },
  section: {
    borderWidth: 1,
    borderRadius: shapes.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  detailBlock: {
    paddingVertical: spacing.xxs,
    gap: spacing.xxs,
  },
  detailLabel: {
    fontSize: typography.fontSize.bodySmall,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: typography.fontSize.bodyMedium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    borderWidth: 1,
  },
  submitButton: {},
  buttonText: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '600',
  },
  errorText: {
    fontSize: typography.fontSize.bodyLarge,
  },
  historyHeading: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  historyCard: {
    borderLeftWidth: 3,
    borderRadius: shapes.sm,
    padding: spacing.xs,
    gap: 2,
    marginBottom: spacing.xs,
  },
  historyCardHeader: {
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
  adminActionContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  reviewButton: {
    paddingVertical: spacing.md,
  },
  correctionBanner: {
    borderWidth: 1,
    borderRadius: shapes.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  correctionBannerTitle: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  correctionBannerReason: {
    fontSize: typography.fontSize.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  correctionBannerComments: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  correctionActionButton: {
    borderRadius: shapes.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  correctionActionText: {
    color: '#ffffff',
    fontSize: typography.fontSize.bodySmall,
    fontWeight: '600',
  },
  responseContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  responseHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  responseText: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  responseDate: {
    fontSize: 10,
  },
});

export default DeclarationDetailsScreen;
