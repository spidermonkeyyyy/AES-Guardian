/**
 * AES Guardian — OH Coordination Detail Screen (Phase 2C.4)
 *
 * Shows full detail for a coordination record and allows the oh_professional
 * to acknowledge, record follow-up events, or complete the follow-up.
 * admin_reviewer sees a read-only status view.
 *
 * Authorization: oh_professional (write), admin_reviewer (read-only).
 * Clinical safety: No clinical fields, no diagnoses.
 */

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
  canFollowUp,
  canCoordinate,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  OhCoordination,
  OhFollowUpEvent,
  logAuditEvent,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  ohCoordinationDetail: { coordinationId: number };
};

export const OhCoordinationDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'ohCoordinationDetail'>>();
  const { coordinationId } = route.params;

  const authContext = SYNTHETIC_OH_PROFESSIONAL_CONTEXT;
  const isOhProfessional = canFollowUp(authContext);
  const isAdminReviewer = canCoordinate(SYNTHETIC_ADMIN_REVIEWER_CONTEXT);
  const isAuthorized = isOhProfessional || isAdminReviewer;

  const [coordination, setCoordination] = useState<OhCoordination | null>(null);
  const [events, setEvents] = useState<OhFollowUpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDatabase();
      const coord = await db.getOhCoordinationById(coordinationId, authContext.userId!);
      setCoordination(coord);
      if (coord && isOhProfessional) {
        const evts = await db.getOhFollowUpEvents(coordinationId, authContext.userId!);
        setEvents(evts);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [coordinationId, authContext, isOhProfessional]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcknowledge = useCallback(async () => {
    if (!isOhProfessional || !coordination) return;
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
      Alert.alert(t('error.generic'), err?.message ?? t('error.saveFailed'));
    } finally {
      setActionLoading(false);
    }
  }, [isOhProfessional, coordination, coordinationId, authContext, loadData]);

  const handleComplete = useCallback(async () => {
    if (!isOhProfessional || !coordination) return;

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
              Alert.alert(t('error.generic'), err?.message ?? t('error.saveFailed'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }, [isOhProfessional, coordination, coordinationId, authContext, loadData]);

  const getStatusColor = (status?: OhCoordination['status']): string => {
    switch (status) {
      case 'pending_acknowledgement': return colors.accent;
      case 'acknowledged': return colors.primary;
      case 'completed': return colors.secondary;
      case 'cancelled': return colors.mutedForeground;
      default: return colors.mutedForeground;
    }
  };

  if (!isAuthorized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{t('oh.error.unauthorized')}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !coordination) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error ?? t('error.loadFailed')}</Text>
      </View>
    );
  }

  const isActive = coordination.status === 'pending_acknowledgement' || coordination.status === 'acknowledged';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll}>
        {/* Coordination summary card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground, flex: 1 }]}>
              {coordination.declaration_reference ?? `Décl. #${coordination.declaration_id}`}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(coordination.status) }]}>
              <Text style={styles.statusText}>{t(`oh.status.${coordination.status}` as any)}</Text>
            </View>
          </View>
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{t('oh.detail.reason')}</Text>
          <Text style={[styles.metaValue, { color: colors.foreground }]}>{t(`oh.reason.${coordination.coordination_reason}` as any)}</Text>

          {coordination.creator_name && (
            <>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{t('oh.detail.coordinator')}</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{coordination.creator_name}</Text>
            </>
          )}
          {coordination.acknowledged_by_user_id && (
            <>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{t('oh.detail.acknowledgedBy')}</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{coordination.acknowledger_name ?? `User #${coordination.acknowledged_by_user_id}`}</Text>
            </>
          )}
          {coordination.completed_by_user_id && (
            <>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{t('oh.detail.completedBy')}</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{coordination.completer_name ?? `User #${coordination.completed_by_user_id}`}</Text>
            </>
          )}
        </View>

        {/* OH Professional actions */}
        {isOhProfessional && isActive && (
          <>
            {coordination.status === 'pending_acknowledgement' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={handleAcknowledge}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>{t('oh.detail.acknowledge')}</Text>
                )}
              </TouchableOpacity>
            )}

            {coordination.status === 'acknowledged' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary }]}
                  onPress={() => navigation.navigate('recordFollowUpEvent', { coordinationId })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>{t('oh.detail.addEvent')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.accent }]}
                  onPress={handleComplete}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator color={colors.accentForeground} />
                  ) : (
                    <Text style={[styles.actionButtonText, { color: colors.accentForeground }]}>{t('oh.detail.complete')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Follow-up events */}
        {isOhProfessional && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('oh.detail.events')}</Text>
            {events.length === 0 ? (
              <Text style={[styles.noEventsText, { color: colors.mutedForeground }]}>{t('oh.detail.noEvents')}</Text>
            ) : (
              events.map(evt => (
                <View key={evt.id} style={[styles.eventItem, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
                  <Text style={[styles.eventCategory, { color: colors.foreground }]}>{t(`oh.event.${evt.event_category}` as any)}</Text>
                  <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
                    {evt.event_date.slice(0, 10)}
                    {evt.recorder_name ? ` — ${evt.recorder_name}` : ''}
                  </Text>
                  {evt.administrative_note ? (
                    <Text style={[styles.eventNote, { color: colors.foreground }]}>{evt.administrative_note}</Text>
                  ) : null}
                </View>
              ))
            )}
          </>
        )}

        {/* Prototype disclaimer */}
        <View style={[styles.disclaimerBox, { backgroundColor: colors.card, borderLeftColor: colors.accent }]}>
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>{t('oh.detail.disclaimer')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.screenPadding },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center', margin: spacing.md },
  card: {
    borderRadius: shapes.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: shapes.xs },
  statusText: { fontSize: typography.fontSize.xs, color: '#fff', fontWeight: '600' },
  metaLabel: { fontSize: typography.fontSize.xs, marginBottom: 2 },
  metaValue: { fontSize: typography.fontSize.bodySmall, fontWeight: '600', marginBottom: spacing.xs },
  sectionTitle: { fontSize: typography.fontSize.bodySmall, fontWeight: '700', marginBottom: spacing.xs },
  eventItem: {
    borderRadius: shapes.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
  },
  eventCategory: { fontSize: typography.fontSize.bodySmall, fontWeight: '700' },
  eventMeta: { fontSize: typography.fontSize.xs },
  eventNote: { fontSize: typography.fontSize.xs, marginTop: spacing.xxs },
  noEventsText: { fontSize: typography.fontSize.bodySmall, fontStyle: 'italic', marginBottom: spacing.md },
  actionButton: {
    borderRadius: shapes.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionButtonText: { fontSize: typography.fontSize.bodySmall, fontWeight: '700' },
  disclaimerBox: {
    borderRadius: shapes.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderLeftWidth: 3,
  },
  disclaimerText: { fontSize: typography.fontSize.xs },
});
