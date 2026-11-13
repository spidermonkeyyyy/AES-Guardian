/**
 * AES Guardian Administrative Review Queue Screen
 *
 * Phase 2C.3: Review queue for submitted AES declarations.
 *
 * Requirements:
 * - Restricted to `admin_reviewer` role via `canReview()`.
 * - Displays declarations in `submitted` and `under_review` states.
 * - Sorts newest submissions first.
 * - Filters by status: All, Submitted, Under Review.
 * - Empty, loading, and error states with pull-to-refresh.
 * - Navigates to AdminReviewActionScreen for administrative processing.
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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  AesDeclaration,
  DeclarationStatus,
  canReview,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
} from '../../../core';
import { t } from '../../../localization';

type FilterType = 'all' | 'submitted' | 'under_review' | 'correction_requested' | 'resubmitted';

export const AdminReviewQueueScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Active context: synthetic admin reviewer for demonstration
  const reviewerContext = SYNTHETIC_ADMIN_REVIEWER_CONTEXT;
  const isAuthorized = canReview(reviewerContext);

  const [declarations, setDeclarations] = useState<AesDeclaration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const db = getDatabase();
      const items = await db.getReviewQueue({ limit: 100 });
      setDeclarations(items);
    } catch (err: any) {
      setError(err?.message || t('error.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  if (!isAuthorized) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.unauthorizedCard, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
          <Text style={[styles.unauthorizedTitle, { color: colors.destructive }]}>
            {t('review.unauthorized')}
          </Text>
          <Text style={[styles.unauthorizedText, { color: colors.mutedForeground }]}>
            Cette interface est réservée exclusivement aux réviseurs administratifs (admin_reviewer).
          </Text>
        </View>
      </View>
    );
  }

  const filteredDeclarations = declarations.filter(d => {
    if (filter === 'submitted') return d.status === 'submitted';
    if (filter === 'under_review') return d.status === 'under_review';
    if (filter === 'correction_requested') return d.status === 'correction_requested';
    if (filter === 'resubmitted') return d.status === 'resubmitted';
    return true;
  });

  const getStatusBadge = (status: DeclarationStatus) => {
    switch (status) {
      case 'submitted':
        return {
          bg: colors.primary,
          text: colors.primaryForeground,
          label: t('status.submitted'),
        };
      case 'under_review':
        return {
          bg: colors.accent,
          text: colors.accentForeground,
          label: t('status.under_review'),
        };
      case 'correction_requested':
        return {
          bg: '#f59e0b',
          text: '#ffffff',
          label: t('status.correction_requested'),
        };
      case 'resubmitted':
        return {
          bg: '#8b5cf6',
          text: '#ffffff',
          label: t('status.resubmitted'),
        };
      default:
        return {
          bg: colors.muted,
          text: colors.foreground,
          label: status,
        };
    }
  };

  const renderItem = ({ item }: { item: AesDeclaration }) => {
    const badge = getStatusBadge(item.status);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('adminReviewAction', { declarationId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`Revue déclaration ${item.reference_number}`}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.refNumber, { color: colors.foreground }]}>
            {item.reference_number}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
              {t('list.incidentDate')} :
            </Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>
              {item.incident_date}
            </Text>
          </View>

          {item.submitted_at && (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                {t('reviewQueue.submittedAt')}
              </Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {item.submitted_at}
              </Text>
            </View>
          )}

          {item.department_code && (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
                {t('details.departmentCode')} :
              </Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>
                {item.department_code}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
              {t('reviewQueue.declaredBy')}
            </Text>
            <Text style={[styles.metaValue, { color: colors.foreground }]}>
              ID #{item.declared_by_user_id}
            </Text>
          </View>
          {item.status === 'resubmitted' && (
            <View style={[styles.responseIndicator, { backgroundColor: '#f5f3ff', borderColor: '#c4b5fd' }]}>
              <Text style={[styles.responseIndicatorText, { color: '#6d28d9' }]}>
                ★ {t('reviewQueue.filterResubmitted')} — {t('review.declarantResponseHeader')}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.openReviewText, { color: colors.primary }]}>
            {item.status === 'resubmitted'
              ? `${t('review.rereviewButton')} →`
              : `${t('reviewQueue.openReview')} →`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Reviewer Context Badge */}
      <View style={[styles.reviewerSessionBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sessionDot} />
        <View style={styles.sessionTextContainer}>
          <Text style={[styles.sessionTitle, { color: colors.foreground }]}>
            {t('reviewQueue.reviewerBadge')}
          </Text>
          <Text style={[styles.sessionSubtitle, { color: colors.mutedForeground }]}>
            {reviewerContext.displayName} ({t(`role.${reviewerContext.role}` as any)})
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['all', 'submitted', 'under_review', 'correction_requested', 'resubmitted'] as FilterType[]).map((f) => {
            const isSelected = filter === f;
            const labelKey =
              f === 'all'
                ? 'reviewQueue.filterAll'
                : f === 'submitted'
                ? 'reviewQueue.filterSubmitted'
                : f === 'under_review'
                ? 'reviewQueue.filterUnderReview'
                : f === 'correction_requested'
                ? 'reviewQueue.filterCorrectionRequested'
                : 'reviewQueue.filterResubmitted';

            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isSelected ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {t(labelKey as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadQueue}
          >
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>
              {t('reviewQueue.refresh')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredDeclarations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t('reviewQueue.empty')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                {t('reviewQueue.emptySubtitle')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  reviewerSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: shapes.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  sessionTextContainer: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: typography.fontSize.bodySmall,
    fontWeight: '700',
  },
  sessionSubtitle: {
    fontSize: typography.fontSize.xs,
  },
  filterContainer: {
    paddingVertical: spacing.xxs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  filterPill: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: shapes.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  responseIndicator: {
    marginTop: spacing.xxs,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: shapes.xs,
    borderWidth: 1,
  },
  responseIndicatorText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  card: {
    borderRadius: shapes.md,
    borderWidth: 1,
    padding: spacing.cardPadding,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  refNumber: {
    fontSize: typography.fontSize.bodyLarge,
    fontWeight: '700',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: shapes.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  cardBody: {
    gap: 4,
    paddingVertical: spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xs,
    marginTop: spacing.xxs,
    alignItems: 'flex-end',
  },
  openReviewText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingTop: spacing.huge,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.bodyLarge,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.bodySmall,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorText: {
    fontSize: typography.fontSize.bodyMedium,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: shapes.md,
  },
  retryText: {
    fontWeight: '600',
  },
  unauthorizedCard: {
    padding: spacing.lg,
    borderRadius: shapes.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 320,
  },
  unauthorizedTitle: {
    fontSize: typography.fontSize.bodyLarge,
    fontWeight: '700',
    textAlign: 'center',
  },
  unauthorizedText: {
    fontSize: typography.fontSize.bodySmall,
    textAlign: 'center',
  },
});

export default AdminReviewQueueScreen;
