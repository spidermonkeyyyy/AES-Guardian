/**
 * AES Guardian — OH Coordination Queue Screen
 *
 * Phase 2E.1.6.1 — Batch 6: Occupational Health Coordination UI Transformation
 *
 * Strictly enforces:
 * - Restricted to `oh_professional` role via `canFollowUp()`.
 * - Retrieval with { includeCompleted: true } covering all three active/closed workflow states.
 * - 3 In-memory filter tabs:
 *     1. En attente de prise en charge ('pending_acknowledgement')
 *     2. Suivi en cours ('acknowledged')
 *     3. Suivi terminé ('completed')
 * - Cancelled records are excluded from display tabs.
 * - Tab switching filters memory dataset; no repetitive database queries.
 * - Data Minimization: strictly NO internal user IDs, NO clinical data, NO overdue badges.
 * - Standard AES Guardian design system (AesScreenContainer, AesScreenHeader, AesCard, AesStatusBadge).
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useNavigation, useIsFocused } from '@react-navigation/native';
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
  useDemoRoleStore,
  type OhCoordination,
} from '../../../core';
import { t } from '../../../localization';

export type OhQueueTab = 'pending_acknowledgement' | 'acknowledged' | 'completed';

export const OhCoordinationQueueScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isFocused = useIsFocused();

  const { activeContext } = useDemoRoleStore();
  const authContext = activeContext;
  const isAuthorized = canFollowUp(authContext);

  const [coordinations, setCoordinations] = useState<OhCoordination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<OhQueueTab>('pending_acknowledgement');
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!isAuthorized || !authContext.userId) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const db = getDatabase();
      const queue = await db.listOhCoordinationsQueue(authContext.userId, {
        includeCompleted: true,
      });
      setCoordinations(queue);
    } catch (err: any) {
      setError(err?.message || t('error.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthorized, authContext.userId]);

  const hasMounted = useRef(false);

  // Reset and reload on role or identity change
  useEffect(() => {
    setCoordinations([]);
    setActiveTab('pending_acknowledgement');
    loadQueue();
  }, [authContext.userId, authContext.role, loadQueue]);

  // Reload on screen focus (subsequent focus transitions)
  useEffect(() => {
    if (hasMounted.current) {
      if (isFocused) {
        loadQueue();
      }
    } else {
      hasMounted.current = true;
    }
  }, [isFocused, loadQueue]);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  // In-memory filtered list — does NOT issue repeated database queries on tab switch
  const filteredCoordinations = useMemo(() => {
    return coordinations.filter(
      (item) => (item.status as string) === activeTab && item.status !== 'cancelled'
    );
  }, [coordinations, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      pending_acknowledgement: coordinations.filter(
        (c) => c.status === 'pending_acknowledgement'
      ).length,
      acknowledged: coordinations.filter((c) => c.status === 'acknowledged').length,
      completed: coordinations.filter((c) => c.status === 'completed').length,
    };
  }, [coordinations]);

  if (!isAuthorized) {
    return (
      <AesScreenContainer testID="oh-coordination-queue-unauthorized">
        <AesScreenHeader title={t('oh.queue.title')} />
        <View style={styles.centerContainer}>
          <View style={styles.unauthorizedCard} testID="oh-unauthorized-card">
            <Text style={styles.unauthorizedTitle}>{t('oh.error.unauthorized')}</Text>
            <Text style={styles.unauthorizedText}>
              {t('oh.detail.unauthorizedMessage')}
            </Text>
          </View>
        </View>
      </AesScreenContainer>
    );
  }

  const renderItem = ({ item }: { item: OhCoordination }) => {
    const declRef =
      item.declaration_reference || `Décl. #${item.declaration_id}`;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ohCoordinationDetail', { coordinationId: item.id })
        }
        accessibilityRole="button"
        accessibilityLabel={`${declRef}, ${t(`oh.status.${item.status}` as any)}`}
        activeOpacity={0.85}
        testID={`oh-coordination-card-${item.id}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.refNumber} numberOfLines={1}>
            {declRef}
          </Text>
          <AesStatusBadge
            status={item.status}
            domain="ohCoordination"
            testID={`oh-status-badge-${item.id}`}
          />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{t('oh.queue.reason')}</Text>
            <Text style={styles.metaValue}>
              {t(`oh.reason.${item.coordination_reason}` as any)}
            </Text>
          </View>

          {item.creator_name && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t('oh.detail.coordinator')}</Text>
              <Text style={styles.metaValue}>{item.creator_name}</Text>
            </View>
          )}

          {item.created_at && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t('oh.detail.createdAt')}</Text>
              <Text style={styles.metaValue}>{item.created_at.slice(0, 10)}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.openDetailText}>
            {item.status === 'pending_acknowledgement'
              ? `${t('oh.detail.acknowledge')} →`
              : `${t('oh.queue.openDetail')} →`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'pending_acknowledgement':
        return {
          title: t('oh.queue.empty'),
          subtitle: t('oh.queue.emptyPending'),
        };
      case 'acknowledged':
        return {
          title: t('oh.queue.tabAcknowledged'),
          subtitle: t('oh.queue.emptyAcknowledged'),
        };
      case 'completed':
        return {
          title: t('oh.queue.tabCompleted'),
          subtitle: t('oh.queue.emptyCompleted'),
        };
    }
  };

  return (
    <AesScreenContainer testID="oh-coordination-queue-screen">
      <AesScreenHeader title={t('oh.queue.title')} />

      {/* Reviewer / OH Session Banner */}
      <View style={styles.sessionBanner} testID="oh-session-banner">
        <View style={styles.sessionDot} />
        <View style={styles.sessionTextContainer}>
          <Text style={styles.sessionTitle}>{t('oh.queue.reviewerBadge')}</Text>
          <Text style={styles.sessionSubtitle}>
            {authContext.displayName} ({t(`role.${authContext.role}` as any)})
          </Text>
        </View>
      </View>

      {/* Three Status Tabs */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarRow}
        >
          {(
            [
              'pending_acknowledgement',
              'acknowledged',
              'completed',
            ] as OhQueueTab[]
          ).map((tab) => {
            const isSelected = activeTab === tab;
            const count = tabCounts[tab];
            const tabLabelKey =
              tab === 'pending_acknowledgement'
                ? 'oh.queue.tabPending'
                : tab === 'acknowledged'
                ? 'oh.queue.tabAcknowledged'
                : 'oh.queue.tabCompleted';

            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabPill,
                  isSelected ? styles.tabPillActive : styles.tabPillInactive,
                ]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${t(tabLabelKey as any)}, ${count}`}
                testID={`oh-tab-${tab}`}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    isSelected
                      ? styles.tabPillTextActive
                      : styles.tabPillTextInactive,
                  ]}
                >
                  {t(tabLabelKey as any)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerContainer} testID="oh-queue-loading">
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer} testID="oh-queue-error">
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>{t('error.generic')}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <AesButton
              title={t('oh.queue.refresh')}
              onPress={loadQueue}
              variant="outline"
              style={styles.retryButton}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredCoordinations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={
            filteredCoordinations.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={aesColors.accentGreen}
              colors={[aesColors.accentGreen]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer} testID="oh-queue-empty">
              <Text style={styles.emptyTitle}>{getEmptyMessage().title}</Text>
              <Text style={styles.emptySubtitle}>{getEmptyMessage().subtitle}</Text>
            </View>
          }
          testID="oh-coordination-flatlist"
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
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: aesColors.accentGreenMuted,
    marginHorizontal: aesSpacing.lg,
    marginBottom: aesSpacing.sm,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.sm,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.status.ohCoordination.completed.border,
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: aesColors.accentGreen,
    marginRight: aesSpacing.sm,
  },
  sessionTextContainer: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: aesTypography.labelSmall.fontSize,
    fontWeight: '700',
    color: aesColors.accentGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionSubtitle: {
    fontSize: aesTypography.bodySmall.fontSize,
    color: aesColors.textPrimary,
    fontWeight: '500',
  },
  tabBarContainer: {
    marginBottom: aesSpacing.sm,
  },
  tabBarRow: {
    paddingHorizontal: aesSpacing.lg,
    paddingVertical: aesSpacing.xs,
    gap: aesSpacing.xs,
  },
  tabPill: {
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.sm,
    borderRadius: aesRadii.pill,
    borderWidth: 1,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: aesColors.primaryAction,
    borderColor: aesColors.primaryAction,
  },
  tabPillInactive: {
    backgroundColor: aesColors.surface,
    borderColor: aesColors.borderMedium,
  },
  tabPillText: {
    fontSize: aesTypography.label.fontSize,
  },
  tabPillTextActive: {
    color: aesColors.textInverse,
    fontWeight: '700',
  },
  tabPillTextInactive: {
    color: aesColors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: aesSpacing.lg,
    paddingBottom: aesSpacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: aesSpacing.lg,
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
    marginBottom: aesSpacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: aesSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: aesColors.borderSubdued,
  },
  openDetailText: {
    fontSize: aesTypography.label.fontSize,
    fontWeight: '700',
    color: aesColors.accentGreen,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: aesSpacing.xl,
  },
  emptyTitle: {
    fontSize: aesTypography.subheading.fontSize,
    fontWeight: '700',
    color: aesColors.textPrimary,
    textAlign: 'center',
    marginBottom: aesSpacing.xs,
  },
  emptySubtitle: {
    fontSize: aesTypography.body.fontSize,
    color: aesColors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
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
