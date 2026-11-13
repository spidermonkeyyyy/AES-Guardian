/**
 * AES Guardian — OH Coordination Queue Screen (Phase 2C.4)
 *
 * Shows the occupational-health professional's inbox of pending and
 * acknowledged coordination records awaiting action.
 *
 * Authorization: oh_professional only.
 * Clinical safety: No clinical fields displayed.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  canFollowUp,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  OhCoordination,
} from '../../../core';
import { t } from '../../../localization';

export const OhCoordinationQueueScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const authContext = SYNTHETIC_OH_PROFESSIONAL_CONTEXT;
  const isAuthorized = canFollowUp(authContext);

  const [coordinations, setCoordinations] = useState<OhCoordination[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    try {
      const db = getDatabase();
      const queue = await db.listOhCoordinationsQueue(authContext.userId!);
      setCoordinations(queue);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? t('error.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthorized, authContext]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadQueue();
  }, [loadQueue]);

  const getStatusColor = (status: OhCoordination['status']): string => {
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
        <View style={[styles.unauthorizedBox, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
          <Text style={[styles.unauthorizedText, { color: colors.destructive }]}>{t('oh.error.unauthorized')}</Text>
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

  if (error) {
    return (
      <View style={[styles.container, styles.centeredContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        <TouchableOpacity onPress={loadQueue} style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.primary, fontSize: typography.fontSize.bodySmall }}>{t('oh.queue.refresh')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.badgeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.badgeText, { color: colors.primary }]}>{t('oh.queue.reviewerBadge')}</Text>
      </View>
      <FlatList
        data={coordinations}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={coordinations.length === 0 ? { flex: 1 } : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.centeredContent}>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('oh.queue.empty')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>{t('oh.queue.emptySubtitle')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.declRef, { color: colors.foreground }]} numberOfLines={1}>
                {item.declaration_reference ?? `Décl. #${item.declaration_id}`}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{t(`oh.status.${item.status}` as any)}</Text>
              </View>
            </View>
            <View style={styles.reasonRow}>
              <Text style={[styles.reasonLabel, { color: colors.mutedForeground }]}>{t('oh.queue.reason')}</Text>
              <Text style={[styles.reasonValue, { color: colors.foreground }]}>{t(`oh.reason.${item.coordination_reason}` as any)}</Text>
            </View>
            {item.creator_name && (
              <Text style={[styles.createdText, { color: colors.mutedForeground }]}>
                {t('oh.detail.coordinator')} {item.creator_name}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.detailButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('ohCoordinationDetail', { coordinationId: item.id })}
              activeOpacity={0.8}
            >
              <Text style={[styles.detailButtonText, { color: colors.primaryForeground }]}>{t('oh.queue.openDetail')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  badgeRow: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  badgeText: { fontSize: typography.fontSize.xs, fontWeight: '700' },
  centeredContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPadding },
  emptyTitle: { fontSize: typography.fontSize.bodyLarge, fontWeight: '700', textAlign: 'center', marginBottom: spacing.xs },
  emptySubtitle: { fontSize: typography.fontSize.bodySmall, textAlign: 'center' },
  errorText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center' },
  listContent: { padding: spacing.screenPadding },
  card: {
    borderRadius: shapes.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  declRef: { fontSize: typography.fontSize.bodyMedium, fontWeight: '700', flex: 1, marginRight: spacing.xs },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: shapes.xs,
  },
  statusText: { fontSize: typography.fontSize.xs, color: '#fff', fontWeight: '600' },
  reasonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxs },
  reasonLabel: { fontSize: typography.fontSize.xs, marginRight: spacing.xs },
  reasonValue: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  createdText: { fontSize: typography.fontSize.xs, marginBottom: spacing.sm },
  detailButton: {
    borderRadius: shapes.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  detailButtonText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
  unauthorizedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenPadding,
    margin: spacing.md,
    borderRadius: shapes.md,
    borderWidth: 1,
  },
  unauthorizedText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center' },
});
