/**
 * AES Guardian Administrative Review Queue Screen
 *
 * Phase 2E.1.5.1 — Batch 5: Administrative Review Queue & Actions
 *
 * Strictly enforces:
 * - Restricted to `admin_reviewer` role via `canReview()`.
 * - Displays declarations in reviewable states ('submitted', 'under_review', 'correction_requested', 'resubmitted').
 * - Sorts newest submissions first.
 * - Filters by status: All, Submitted, Under Review, Correction Requested, Resubmitted.
 * - Privacy & Data Minimization: strictly NO internal user IDs, NO elapsed-days or overdue badges.
 * - Standard AES Guardian design system (AesScreenContainer, AesScreenHeader, AesCard, AesStatusBadge).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  aesColors,
  aesDeclarationStatusColors,
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
} from '../components';
import {
  getDatabase,
  AesDeclaration,
  canReview,
  useDemoRoleStore,
} from '../../../core';
import { t, useLocale } from '../../../localization';

import AppText from '../../../components/AppText';
import { AppIconLabel } from '../../../components/AppIcon';
type FilterType = 'all' | 'submitted' | 'under_review' | 'correction_requested' | 'resubmitted';

const DATE_LOCALES = {
  fr: 'fr-FR',
  en: 'en-GB',
  ar: 'ar',
} as const;

function formatQueueDate(value: string, locale: keyof typeof DATE_LOCALES, includeTime = false) {
  const dateInput = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return value;
  const dateOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  } as const;
  return includeTime
    ? date.toLocaleString(DATE_LOCALES[locale], {
        ...dateOptions,
        hour: '2-digit',
        minute: '2-digit',
      })
    : date.toLocaleDateString(DATE_LOCALES[locale], dateOptions);
}

export const AdminReviewQueueScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const locale = useLocale();

  // Active context from demo role store
  const { activeContext } = useDemoRoleStore();
  const reviewerContext = activeContext;
  const isAuthorized = canReview(reviewerContext);

  const [declarations, setDeclarations] = useState<AesDeclaration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!isAuthorized || !reviewerContext.userId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const db = getDatabase();
      const items = await db.getReviewQueue({ limit: 100, requestingUserId: reviewerContext.userId });
      setDeclarations(items);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : t('error.loadFailed', locale));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthorized, reviewerContext.userId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  if (!isAuthorized) {
    return (
      <AesScreenContainer testID="admin-review-queue-unauthorized">
        <View style={styles.centerContainer}>
          <View style={styles.unauthorizedCard}>
            <AppText style={styles.unauthorizedTitle}>
              {t('review.unauthorized')}
            </AppText>
            <AppText style={styles.unauthorizedText}>
              {t('reviewAction.unauthorizedNotice')}
            </AppText>
          </View>
        </View>
      </AesScreenContainer>
    );
  }

  const filteredDeclarations = declarations.filter((d) => {
    if (filter === 'submitted') return d.status === 'submitted';
    if (filter === 'under_review') return d.status === 'under_review';
    if (filter === 'correction_requested') return d.status === 'correction_requested';
    if (filter === 'resubmitted') return d.status === 'resubmitted';
    return true;
  });

  const renderItem = ({ item }: { item: AesDeclaration }) => {
    const isResubmitted = item.status === 'resubmitted';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('adminReviewAction', { declarationId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`${t('reviewQueue.openReview', locale)} ${item.reference_number}`}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <AppText style={styles.refNumber}>{item.reference_number}</AppText>
          <AesStatusBadge status={item.status} domain="declaration" />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <AppText style={styles.metaLabel}>{t('list.incidentDate')} :</AppText>
            <AppText style={styles.metaValue}>{formatQueueDate(item.incident_date, locale)}</AppText>
          </View>

          {item.submitted_at && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('reviewQueue.submittedAt')}</AppText>
              <AppText style={styles.metaValue}>
                {formatQueueDate(item.submitted_at, locale, true)}
              </AppText>
            </View>
          )}

          {item.department_code && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('details.departmentCode')} :</AppText>
              <AppText style={styles.metaValue}>{item.department_code}</AppText>
            </View>
          )}

          {isResubmitted && (
            <View style={styles.responseIndicator}>
              <AppIconLabel name="sparkles" size="sm" textStyle={styles.responseIndicatorText}>
                {t('reviewQueue.filterResubmitted')} — {t('review.declarantResponseHeader')}
              </AppIconLabel>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <AppIconLabel name="forward" size="sm" textStyle={styles.openReviewText}>
            {isResubmitted ? t('review.rereviewButton') : t('reviewQueue.openReview')}
          </AppIconLabel>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AesScreenContainer testID="admin-review-queue-screen">
      <AesScreenHeader
        title={t('reviewQueue.title')}
      />

      {/* Reviewer Session Banner */}
      <View style={styles.reviewerSessionBanner}>
        <View style={styles.sessionDot} />
        <View style={styles.sessionTextContainer}>
          <AppText style={styles.sessionTitle}>
            {t('reviewQueue.reviewerBadge')}
          </AppText>
          <AppText style={styles.sessionSubtitle}>
            {reviewerContext.displayName} ({t(`role.${reviewerContext.role}` as any, locale)})
          </AppText>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(
            ['all', 'submitted', 'under_review', 'correction_requested', 'resubmitted'] as FilterType[]
          ).map((f) => {
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
                  isSelected ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityLabel={t(labelKey as any, locale)}
                accessibilityState={{ selected: isSelected }}
              >
                <AppText
                  style={[
                    styles.filterText,
                    isSelected ? styles.filterTextActive : styles.filterTextInactive,
                  ]}
                >
                  {t(labelKey as any, locale)}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AppText style={styles.errorText}>{error}</AppText>
          <AesButton
            title={t('reviewQueue.refresh')}
            onPress={loadQueue}
            variant="outline"
            fullWidth={false}
          />
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
              tintColor={aesColors.accentGreen}
              colors={[aesColors.accentGreen]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppText style={styles.emptyTitle}>
                {t('reviewQueue.empty')}
              </AppText>
              <AppText style={styles.emptySubtitle}>
                {t('reviewQueue.emptySubtitle')}
              </AppText>
            </View>
          }
        />
      )}
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: aesSpacing.lg,
  },
  reviewerSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: aesSpacing.md,
    marginHorizontal: aesSpacing.screenHorizontal,
    marginTop: aesSpacing.xs,
    marginBottom: aesSpacing.xs,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    backgroundColor: aesColors.surface,
    gap: aesSpacing.sm,
    ...aesShadows.card,
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: aesColors.accentGreen,
  },
  sessionTextContainer: {
    flex: 1,
  },
  sessionTitle: {
    ...aesTypography.label,
    color: aesColors.textPrimary,
    fontWeight: '700',
  },
  sessionSubtitle: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    fontSize: 12,
  },
  filterContainer: {
    paddingVertical: aesSpacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.xs,
    gap: aesSpacing.xs,
  },
  filterPill: {
    paddingVertical: aesSpacing.xs,
    paddingHorizontal: aesSpacing.md,
    borderRadius: aesRadii.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: aesColors.primaryAction,
    borderColor: aesColors.primaryAction,
  },
  filterPillInactive: {
    backgroundColor: aesColors.surface,
    borderColor: aesColors.borderSubdued,
  },
  filterText: {
    ...aesTypography.labelSmall,
    fontSize: 12,
  },
  filterTextActive: {
    color: aesColors.textInverse,
    fontWeight: '700',
  },
  filterTextInactive: {
    color: aesColors.textPrimary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingTop: aesSpacing.xs,
    paddingBottom: aesSpacing['5xl'],
    gap: aesSpacing.md,
  },
  card: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.cardPadding,
    gap: aesSpacing.xs,
    ...aesShadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: aesSpacing.xs,
  },
  refNumber: {
    ...aesTypography.heading2,
    fontSize: 16,
    color: aesColors.textPrimary,
  },
  cardBody: {
    gap: 4,
    paddingVertical: aesSpacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: aesSpacing.xs,
  },
  metaLabel: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    fontWeight: '600',
  },
  responseIndicator: {
    marginTop: aesSpacing.xs,
    paddingVertical: 4,
    paddingHorizontal: aesSpacing.sm,
    borderRadius: aesRadii.badge,
    borderWidth: 1,
    backgroundColor: aesDeclarationStatusColors.resubmitted.bg,
    borderColor: aesDeclarationStatusColors.resubmitted.border,
  },
  responseIndicatorText: {
    ...aesTypography.labelSmall,
    fontSize: 11,
    fontWeight: '700',
    color: aesDeclarationStatusColors.resubmitted.text,
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: aesColors.borderSubdued,
    paddingTop: aesSpacing.xs,
    marginTop: aesSpacing.xs,
    alignItems: 'flex-end',
  },
  openReviewText: {
    ...aesTypography.label,
    color: aesColors.accentGreen,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingTop: aesSpacing['5xl'],
    alignItems: 'center',
    gap: aesSpacing.xs,
  },
  emptyTitle: {
    ...aesTypography.heading2,
    fontSize: 16,
    color: aesColors.textPrimary,
  },
  emptySubtitle: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  errorText: {
    ...aesTypography.body,
    color: aesColors.banners.error.text,
    marginBottom: aesSpacing.md,
    textAlign: 'center',
  },
  unauthorizedCard: {
    padding: aesSpacing.lg,
    borderRadius: aesRadii.card,
    borderWidth: 1.5,
    borderColor: aesColors.banners.error.border,
    backgroundColor: aesColors.banners.error.bg,
    alignItems: 'center',
    gap: aesSpacing.sm,
    maxWidth: 320,
    ...aesShadows.card,
  },
  unauthorizedTitle: {
    ...aesTypography.heading2,
    fontSize: 16,
    color: aesColors.banners.error.text,
    textAlign: 'center',
  },
  unauthorizedText: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    textAlign: 'center',
  },
});

export default AdminReviewQueueScreen;