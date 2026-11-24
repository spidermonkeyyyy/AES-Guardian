/**
 * AES Guardian — OH Coordination Detail Screen
 *
 * Phase 2E.1.6.1 — Batch 6: Occupational Health Coordination UI Transformation
 *
 * Strictly enforces:
 * - Role-specific projections:
 *     * `oh_professional`: full details, follow-up events, acknowledge / complete actions.
 *     * `admin_reviewer`: limited read-only summary (declaration ref, status, reason, created_at).
 *     * `exposed_professional`: exact 5-field status-only projection (no reason, no notes, no events).
 *     * `quality_staff` & `tech_admin`: denied access.
 * - Internal user-ID fallback REMOVED: display names used, or neutral localized wording.
 *   Never exposes `User #${id}` database IDs.
 * - Workflow actions strictly guarded by role and valid status:
 *     * 'pending_acknowledgement': Acknowledge button.
 *     * 'acknowledged': Add follow-up event + Complete follow-up buttons.
 *     * 'completed' / 'cancelled': No action buttons.
 * - Standard AES Guardian design system (AesScreenContainer, AesScreenHeader, AesCard, AesStatusBadge, AesButton).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  aesColors,
  aesTypography,
  aesSpacing,
  aesRadii,
  aesShadows,
} from '../../../theme/tokens';
import {
  AesScreenContainer,
  AesScreenHeader,
  AesStatusBadge,
  AesButton,
  AesCard,
} from '../components';
import {
  getDatabase,
  canFollowUp,
  canCoordinate,
  canDeclare,
  useDemoRoleStore,
  type OhCoordination,
  type OhFollowUpEvent,
  type AdminOhCoordinationSummary,
  type ExposedOhCoordinationSummary,
  logAuditEvent,
} from '../../../core';
import { t } from '../../../localization';

import AppText from '../../../components/AppText';
type ParamList = {
  ohCoordinationDetail: { coordinationId: number };
};

export const OhCoordinationDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'ohCoordinationDetail'>>();
  const { coordinationId } = route.params;

  const { activeContext } = useDemoRoleStore();
  const authContext = activeContext;
  const isOhProfessional = canFollowUp(authContext);
  const isAdminReviewer = canCoordinate(authContext);
  const isExposedProfessional = canDeclare(authContext);
  const isAuthorized = isOhProfessional || isAdminReviewer || isExposedProfessional;

  const [coordination, setCoordination] = useState<
    OhCoordination | AdminOhCoordinationSummary | ExposedOhCoordinationSummary | null
  >(null);
  const [events, setEvents] = useState<OhFollowUpEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isAuthorized || !authContext.userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const db = getDatabase();
      const coord = await db.getOhCoordinationById(coordinationId, authContext.userId);
      setCoordination(coord);

      // Only oh_professional is authorized to query private follow-up events
      if (coord && isOhProfessional) {
        const evts = await db.getOhFollowUpEvents(coordinationId, authContext.userId);
        setEvents(evts);
      }
    } catch (err: any) {
      setError(err?.message || t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [coordinationId, authContext.userId, isAuthorized, isOhProfessional]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcknowledge = useCallback(async () => {
    if (!isOhProfessional || !coordination || actionLoading) return;
    setActionLoading(true);
    try {
      const db = getDatabase();
      await db.acknowledgeOhCoordination(coordinationId, authContext.userId!);
      await logAuditEvent({
        eventType: 'OH_COORDINATION_ACKNOWLEDGED',
        userId: authContext.userId,
        entityType: 'oh_coordination',
        entityId: coordinationId,
        description: `Coordination ${coordinationId} acknowledged by oh_professional`,
      });
      await loadData();
    } catch (err: any) {
      Alert.alert(t('error.generic'), err?.message || t('error.saveFailed'));
    } finally {
      setActionLoading(false);
    }
  }, [isOhProfessional, coordination, actionLoading, coordinationId, authContext, loadData]);

  const handleComplete = useCallback(async () => {
    if (!isOhProfessional || !coordination || actionLoading) return;

    Alert.alert(
      t('oh.detail.completeConfirm'),
      t('oh.detail.completeConfirmMessage'),
      [
        { text: t('review.cancelButton'), style: 'cancel' },
        {
          text: t('review.confirmButton'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const db = getDatabase();
              await db.completeOhCoordination(coordinationId, authContext.userId!);
              await logAuditEvent({
                eventType: 'OH_COORDINATION_COMPLETED',
                userId: authContext.userId,
                entityType: 'oh_coordination',
                entityId: coordinationId,
                description: `Coordination ${coordinationId} completed by oh_professional`,
              });
              await loadData();
            } catch (err: any) {
              Alert.alert(t('error.generic'), err?.message || t('error.saveFailed'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [isOhProfessional, coordination, actionLoading, coordinationId, authContext, loadData]);

  if (!isAuthorized) {
    return (
      <AesScreenContainer testID="oh-coordination-detail-unauthorized">
        <AesScreenHeader
          title={t('oh.detail.title')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <View style={styles.unauthorizedCard} testID="oh-detail-unauthorized-card">
            <AppText style={styles.unauthorizedTitle}>{t('oh.error.unauthorized')}</AppText>
            <AppText style={styles.unauthorizedText}>
              {t('oh.detail.unauthorizedMessage')}
            </AppText>
          </View>
        </View>
      </AesScreenContainer>
    );
  }

  if (loading) {
    return (
      <AesScreenContainer testID="oh-coordination-detail-loading">
        <AesScreenHeader
          title={t('oh.detail.title')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
        </View>
      </AesScreenContainer>
    );
  }

  if (error || !coordination) {
    return (
      <AesScreenContainer testID="oh-coordination-detail-error">
        <AesScreenHeader
          title={t('oh.detail.title')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <View style={styles.errorCard}>
            <AppText style={styles.errorTitle}>{t('error.generic')}</AppText>
            <AppText style={styles.errorText}>{error || t('error.loadFailed')}</AppText>
            <AesButton
              title={t('oh.queue.refresh')}
              onPress={loadData}
              variant="outline"
              style={styles.retryButton}
            />
          </View>
        </View>
      </AesScreenContainer>
    );
  }

  // Derive reference label
  const declRef =
    'declaration_reference' in coordination && coordination.declaration_reference
      ? coordination.declaration_reference
      : t('oh.detail.noReference');

  const isActive =
    coordination.status === 'pending_acknowledgement' ||
    coordination.status === 'acknowledged';

  return (
    <AesScreenContainer scrollable testID="oh-coordination-detail-screen">
      <AesScreenHeader
        title={t('oh.detail.title')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.contentContainer}>
        {/* Role-specific Notice Banner */}
        {isExposedProfessional && (
          <View style={styles.infoBanner} testID="oh-exposed-notice">
            <AppText style={styles.infoBannerText}>
              {t('oh.detail.exposedNotice')}
            </AppText>
          </View>
        )}

        {isAdminReviewer && !isOhProfessional && (
          <View style={styles.infoBanner} testID="oh-admin-notice">
            <AppText style={styles.infoBannerText}>
              {t('oh.detail.adminNotice')}
            </AppText>
          </View>
        )}

        {/* Primary Coordination Card */}
        <View style={styles.card} testID="oh-detail-card">
          <View style={styles.cardHeader}>
            <AppText style={styles.refNumber} numberOfLines={1}>
              {declRef}
            </AppText>
            <AesStatusBadge
              status={coordination.status}
              domain="ohCoordination"
              testID="oh-detail-status-badge"
            />
          </View>

          <View style={styles.cardBody}>
            {/* Reason: available to OH Professional and Admin Reviewer only */}
            {(isOhProfessional || isAdminReviewer) &&
              'coordination_reason' in coordination &&
              coordination.coordination_reason && (
                <View style={styles.metaRow}>
                  <AppText style={styles.metaLabel}>{t('oh.detail.reason')}</AppText>
                  <AppText style={styles.metaValue}>
                    {t(`oh.reason.${coordination.coordination_reason}` as any)}
                  </AppText>
                </View>
              )}

            {/* Created date */}
            {coordination.created_at && (
              <View style={styles.metaRow}>
                <AppText style={styles.metaLabel}>{t('oh.detail.createdAt')}</AppText>
                <AppText style={styles.metaValue}>
                  {coordination.created_at.slice(0, 10)}
                </AppText>
              </View>
            )}

            {/* OH-Professional authorized identity projections */}
            {isOhProfessional && (
              <>
                {(coordination as OhCoordination).creator_name && (
                  <View style={styles.metaRow}>
                    <AppText style={styles.metaLabel}>{t('oh.detail.coordinator')}</AppText>
                    <AppText style={styles.metaValue}>
                      {(coordination as OhCoordination).creator_name}
                    </AppText>
                  </View>
                )}

                {/* Acknowledged by: uses display name if available, neutral wording if absent. Never User #${id} */}
                {(coordination as OhCoordination).acknowledged_by_user_id ? (
                  <View style={styles.metaRow}>
                    <AppText style={styles.metaLabel}>
                      {t('oh.detail.acknowledgedBy')}
                    </AppText>
                    <AppText style={styles.metaValue}>
                      {(coordination as OhCoordination).acknowledger_name ||
                        t('oh.detail.acknowledgedStatus')}
                    </AppText>
                  </View>
                ) : null}

                {/* Completed by: uses display name if available, neutral wording if absent. Never User #${id} */}
                {(coordination as OhCoordination).completed_by_user_id ? (
                  <View style={styles.metaRow}>
                    <AppText style={styles.metaLabel}>{t('oh.detail.completedBy')}</AppText>
                    <AppText style={styles.metaValue}>
                      {(coordination as OhCoordination).completer_name ||
                        t('oh.detail.completedStatus')}
                    </AppText>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>

        {/* OH Professional Actions — only shown when status allows action */}
        {isOhProfessional && isActive && (
          <View style={styles.actionsSection} testID="oh-actions-section">
            {coordination.status === 'pending_acknowledgement' && (
              <AesButton
                title={t('oh.detail.acknowledge')}
                onPress={handleAcknowledge}
                loading={actionLoading}
                disabled={actionLoading}
                variant="green"
                testID="oh-acknowledge-button"
              />
            )}

            {coordination.status === 'acknowledged' && (
              <View style={styles.actionButtonGroup}>
                <AesButton
                  title={t('oh.detail.addEvent')}
                  onPress={() =>
                    navigation.navigate('recordFollowUpEvent', { coordinationId })
                  }
                  variant="outline"
                  testID="oh-add-event-button"
                />
                <AesButton
                  title={t('oh.detail.complete')}
                  onPress={handleComplete}
                  loading={actionLoading}
                  disabled={actionLoading}
                  variant="primary"
                  style={{ marginTop: aesSpacing.sm }}
                  testID="oh-complete-button"
                />
              </View>
            )}
          </View>
        )}

        {/* Follow-Up Event Timeline — strictly for oh_professional only */}
        {isOhProfessional && (
          <View style={styles.eventsSection} testID="oh-events-section">
            <AppText style={styles.sectionHeader}>{t('oh.detail.events')}</AppText>

            {events.length === 0 ? (
              <View style={styles.noEventsBox} testID="oh-no-events">
                <AppText style={styles.noEventsText}>{t('oh.detail.noEvents')}</AppText>
              </View>
            ) : (
              events.map((evt) => (
                <View
                  key={evt.id}
                  style={styles.eventCard}
                  testID={`oh-event-item-${evt.id}`}
                >
                  <View style={styles.eventHeader}>
                    <AppText style={styles.eventCategory}>
                      {t(`oh.event.${evt.event_category}` as any)}
                    </AppText>
                    <AppText style={styles.eventDate}>
                      {evt.event_date.slice(0, 10)}
                    </AppText>
                  </View>

                  {evt.recorder_name && (
                    <AppText style={styles.eventRecorder}>
                      {evt.recorder_name}
                    </AppText>
                  )}

                  {evt.administrative_note && (
                    <View style={styles.eventNoteBox}>
                      <AppText style={styles.eventNoteText}>
                        {evt.administrative_note}
                      </AppText>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Prototype Disclaimer Notice */}
        <View style={styles.disclaimerBox} testID="oh-detail-disclaimer">
          <AppText style={styles.disclaimerText}>{t('oh.detail.disclaimer')}</AppText>
        </View>
      </View>
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: aesSpacing.lg,
    paddingBottom: aesSpacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: aesSpacing.lg,
  },
  infoBanner: {
    backgroundColor: aesColors.accentGreenMuted,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.status.ohCoordination.completed.border,
    padding: aesSpacing.md,
    marginBottom: aesSpacing.md,
  },
  infoBannerText: {
    fontSize: aesTypography.bodySmall.fontSize,
    color: aesColors.accentGreen,
    lineHeight: 18,
  },
  card: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.md,
    marginBottom: aesSpacing.md,
    ...aesShadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: aesSpacing.sm,
    paddingBottom: aesSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: aesColors.borderSubdued,
  },
  refNumber: {
    fontSize: aesTypography.subheading.fontSize,
    fontWeight: '700',
    color: aesColors.textPrimary,
    flex: 1,
    marginRight: aesSpacing.sm,
  },
  cardBody: {
    gap: aesSpacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  metaLabel: {
    fontSize: aesTypography.bodySmall.fontSize,
    color: aesColors.textSecondary,
  },
  metaValue: {
    fontSize: aesTypography.bodySmall.fontSize,
    fontWeight: '600',
    color: aesColors.textPrimary,
  },
  actionsSection: {
    marginBottom: aesSpacing.md,
  },
  actionButtonGroup: {
    gap: aesSpacing.xs,
  },
  eventsSection: {
    marginBottom: aesSpacing.md,
  },
  sectionHeader: {
    fontSize: aesTypography.subheading.fontSize,
    fontWeight: '700',
    color: aesColors.textPrimary,
    marginBottom: aesSpacing.sm,
  },
  noEventsBox: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.md,
    alignItems: 'center',
  },
  noEventsText: {
    fontSize: aesTypography.bodySmall.fontSize,
    color: aesColors.textSecondary,
    fontStyle: 'italic',
  },
  eventCard: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    borderLeftWidth: 4,
    borderLeftColor: aesColors.accentGreen,
    padding: aesSpacing.md,
    marginBottom: aesSpacing.sm,
    ...aesShadows.card,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventCategory: {
    fontSize: aesTypography.bodySmall.fontSize,
    fontWeight: '700',
    color: aesColors.textPrimary,
    flex: 1,
  },
  eventDate: {
    fontSize: aesTypography.labelSmall.fontSize,
    color: aesColors.textSecondary,
    fontWeight: '500',
  },
  eventRecorder: {
    fontSize: aesTypography.labelSmall.fontSize,
    color: aesColors.textTertiary,
    marginBottom: 4,
  },
  eventNoteBox: {
    backgroundColor: aesColors.surfaceSubdued,
    borderRadius: aesRadii.badge,
    padding: aesSpacing.xs + 2,
    marginTop: aesSpacing.xs,
  },
  eventNoteText: {
    fontSize: aesTypography.bodySmall.fontSize,
    color: aesColors.textPrimary,
    lineHeight: 18,
  },
  disclaimerBox: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.md,
    marginTop: aesSpacing.sm,
  },
  disclaimerText: {
    fontSize: aesTypography.labelSmall.fontSize,
    color: aesColors.textSecondary,
    lineHeight: 16,
  },
  unauthorizedCard: {
    backgroundColor: aesColors.surface,
    padding: aesSpacing.lg,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.banners.error.border,
    width: '100%',
    maxWidth: 360,
  },
  unauthorizedTitle: {
    fontSize: aesTypography.subheading.fontSize,
    fontWeight: '700',
    color: aesColors.banners.error.text,
    marginBottom: aesSpacing.xs,
    textAlign: 'center',
  },
  unauthorizedText: {
    fontSize: aesTypography.body.fontSize,
    color: aesColors.textSecondary,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: aesColors.surface,
    padding: aesSpacing.lg,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.banners.error.border,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  errorTitle: {
    fontSize: aesTypography.subheading.fontSize,
    fontWeight: '700',
    color: aesColors.banners.error.text,
    marginBottom: aesSpacing.xs,
  },
  errorText: {
    fontSize: aesTypography.body.fontSize,
    color: aesColors.textSecondary,
    textAlign: 'center',
    marginBottom: aesSpacing.md,
  },
  retryButton: {
    minWidth: 140,
  },
});
