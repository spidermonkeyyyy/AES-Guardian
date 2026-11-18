/**
 * AES Guardian — Phase 2D.2G
 * Notification Centre Screen
 *
 * Displays the recipient-scoped in-app notification feed for the current
 * active synthetic identity. Provides mark-one-read and mark-all-read
 * capabilities, and delegates navigation to the verified resolver.
 *
 * SECURITY CONTRACTS:
 * - Notifications are always loaded using the active userId from useDemoRoleStore,
 *   never from notification payload fields.
 * - Navigation is dispatched only after resolveNotificationNavigation returns 'success'.
 * - Notifications are marked read only after a successful navigation dispatch.
 * - tech_admin receives an empty, restricted view — no operational data.
 * - No clinical details, internal IDs, or raw DB keys are displayed in cards.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../../theme/ThemeContext';
import { spacing, typography, shapes } from '../../../theme/tokens';
import {
  getDatabase,
  useDemoRoleStore,
  InAppNotification,
} from '../../../core';
import { formatNotification, useLocale, t } from '../../../localization';
import { resolveNotificationNavigation } from '../navigation/notification-navigation-resolver';
import type { RootStackParamList } from '../../../navigation/routes';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type BulkReadLockState = 'idle' | 'dialog' | 'confirming';

// ─── Date formatting helper ───────────────────────────────────────────────────

function formatNotificationDate(createdAt: string, locale: string): string {
  try {
    const date = new Date(createdAt);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const itemStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (itemStart.getTime() === todayStart.getTime()) {
      // Return time only for today
      return date.toLocaleTimeString(locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (itemStart.getTime() === yesterdayStart.getTime()) {
      return t('notificationCentre.yesterday', locale as any);
    }
    return date.toLocaleDateString(locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return createdAt;
  }
}

// ─── Notification Item ────────────────────────────────────────────────────────

interface NotificationItemProps {
  item: InAppNotification;
  locale: string;
  onPress: (item: InAppNotification) => void;
  processing: boolean;
  colors: any;
}

function NotificationItem({ item, locale, onPress, processing, colors }: NotificationItemProps) {
  const styles = createStyles(colors);
  const isUnread = item.is_read === 0;
  const formatted = formatNotification(item, { locale: locale as any });
  const dateLabel = formatNotificationDate(item.created_at, locale);

  return (
    <TouchableOpacity
      style={[styles.notificationItem, isUnread && styles.notificationItemUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      disabled={processing}
      accessibilityRole="button"
      accessibilityLabel={`${t('notificationCentre.a11y.notificationItem', locale as any)}: ${formatted.title}${isUnread ? ` — ${t('notificationCentre.unread', locale as any)}` : ''}`}
      accessibilityHint={t('notificationCentre.tapToOpen', locale as any)}
    >
      <View style={styles.notifRow}>
        {/* Unread indicator dot */}
        <View style={styles.unreadDotContainer}>
          {isUnread ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          ) : (
            <View style={styles.readDot} />
          )}
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text
              style={[
                styles.notifTitle,
                { color: isUnread ? colors.foreground : colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {formatted.title}
            </Text>
            <Text style={styles.notifDate}>{dateLabel}</Text>
          </View>
          <Text
            style={[styles.notifMessage, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {formatted.message}
          </Text>
          {isUnread && (
            <View style={styles.unreadBadgeRow}>
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadBadgeText}>
                  {t('notificationCentre.unread', locale as any)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Chevron */}
        <Text style={[styles.chevron, { color: colors.mutedForeground }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const NotificationCentreScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const isFocused = useIsFocused();
  const locale = useLocale();
  const styles = createStyles(colors);

  const { activeRole, activeContext } = useDemoRoleStore();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  // Phase 2D.2G.3: Synchronous concurrency lock state machine
  const bulkReadStateRef = useRef<BulkReadLockState>('idle');

  // ── Load notifications and unread count ─────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!activeContext.userId || activeRole === 'tech_admin') {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const db = getDatabase();
      const [list, count] = await Promise.all([
        db.getNotifications(activeContext.userId),
        db.getUnreadNotificationCount(activeContext.userId),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      setError(t('notificationCentre.errorLoad', locale));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeContext.userId, activeRole, locale]);

  // Correction C — Localized navigation header title
  useEffect(() => {
    navigation.setOptions({ title: t('notificationCentre.title', locale) });
  }, [navigation, locale]);

  // Refresh on focus or identity change
  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      loadData();
    }
  }, [isFocused, loadData]);

  // ── Handle notification tap ──────────────────────────────────────────────────
  const handleNotificationPress = useCallback(
    async (notification: InAppNotification) => {
      if (processing) return;
      // Re-read active context at tap time — not from closure
      const { activeContext: currentContext } = useDemoRoleStore.getState();
      if (!currentContext.userId || !currentContext.isAuthenticated) {
        return;
      }
      setProcessing(true);
      try {
        const db = getDatabase();
        const result = await resolveNotificationNavigation(notification, currentContext, db);

        if (result.status === 'success') {
          // Navigate first, then mark read
          navigation.navigate(result.route as any, result.params as any);
          await db.markNotificationRead(notification.id, currentContext.userId);
          // Refresh state after marking read
          await loadData();
        } else {
          // Determine user-facing message based on failure type
          const msg =
            result.status === 'not_found'
              ? t('notificationCentre.errorStale', locale)
              : t('notificationCentre.errorNavigation', locale);
          Alert.alert('', msg, [{ text: 'OK' }]);
          // Do NOT navigate, do NOT mark read; refresh list in case record disappeared
          await loadData();
        }
      } catch {
        Alert.alert('', t('notificationCentre.errorNavigation', locale), [{ text: 'OK' }]);
      } finally {
        setProcessing(false);
      }
    },
    [processing, navigation, loadData, locale],
  );

  // ── Handle mark all as read ──────────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    // Phase 2D.2G.3: Synchronous Concurrency Lock
    // 1. Reject invocation immediately unless lock state is strictly 'idle'
    if (bulkReadStateRef.current !== 'idle') return;

    // 2. Synchronously acquire lock before any state updates or async work
    bulkReadStateRef.current = 'dialog';

    // 3. Pre-dialog validations
    if (unreadCount === 0) {
      bulkReadStateRef.current = 'idle';
      return;
    }

    const { activeContext: initiatingContext, activeRole: initiatingRole } = useDemoRoleStore.getState();
    if (!initiatingContext.userId || !initiatingContext.isAuthenticated || initiatingRole === 'tech_admin') {
      bulkReadStateRef.current = 'idle';
      return;
    }
    const initiatingUserId = initiatingContext.userId;

    // Update React state for visual presentation (loading indicator / disabled buttons)
    setProcessing(true);

    // Present localized native confirmation dialog
    Alert.alert(
      t('notificationCentre.markAllRead', locale),
      t('notificationCentre.markAllReadConfirm', locale),
      [
        {
          text: t('notificationCentre.cancel', locale),
          style: 'cancel',
          onPress: () => {
            // Cancel callback: release lock only if currently in 'dialog' state
            if (bulkReadStateRef.current === 'dialog') {
              bulkReadStateRef.current = 'idle';
              setProcessing(false);
            }
          },
        },
        {
          text: t('notificationCentre.confirm', locale),
          style: 'destructive',
          onPress: async () => {
            // Confirm callback: accept ONLY while state is 'dialog'
            if (bulkReadStateRef.current !== 'dialog') return;

            // Synchronously transition to 'confirming' before starting async work
            bulkReadStateRef.current = 'confirming';

            try {
              // Re-acquire active identity at confirmation execution time
              const { activeContext: confirmedContext, activeRole: confirmedRole } = useDemoRoleStore.getState();

              // Revalidation: Active identity must be authenticated, eligible, non-tech_admin,
              // and strictly match the identity that initiated the confirmation dialog.
              if (
                !confirmedContext.userId ||
                !confirmedContext.isAuthenticated ||
                confirmedRole === 'tech_admin' ||
                confirmedContext.userId !== initiatingUserId ||
                confirmedRole !== initiatingRole
              ) {
                // Identity switched or became ineligible while confirmation was pending.
                // Fail closed: do NOT perform bulk mutation for either user.
                await loadData();
                return;
              }

              const db = getDatabase();
              await db.markAllNotificationsRead(confirmedContext.userId);
              await loadData();
            } catch {
              // silent — loadData will show any persistent error
            } finally {
              // Release lock in all completion/error paths
              bulkReadStateRef.current = 'idle';
              setProcessing(false);
            }
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          // Dialog dismissed (e.g. Android back/outside tap):
          // Release lock ONLY if state is still 'dialog' (not transitioned to 'confirming')
          if (bulkReadStateRef.current === 'dialog') {
            bulkReadStateRef.current = 'idle';
            setProcessing(false);
          }
        },
      },
    );
  }, [unreadCount, loadData, locale]);

  // ── Pull-to-refresh ──────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  // ── Render helpers ───────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<InAppNotification>) => (
      <NotificationItem
        item={item}
        locale={locale}
        onPress={handleNotificationPress}
        processing={processing}
        colors={colors}
      />
    ),
    [locale, handleNotificationPress, processing, colors],
  );

  const keyExtractor = (item: InAppNotification) => String(item.id);

  // ── Tech admin view ──────────────────────────────────────────────────────────
  if (activeRole === 'tech_admin') {
    return (
      <View style={[styles.root, styles.centeredContainer]}>
        <Text style={styles.restrictedIcon}>🔒</Text>
        <Text style={[styles.restrictedText, { color: colors.mutedForeground }]}>
          {t('notificationCentre.techAdminRestricted', locale)}
        </Text>
      </View>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, styles.centeredContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error && notifications.length === 0) {
    return (
      <View style={[styles.root, styles.centeredContainer]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => { setLoading(true); loadData(); }}
        >
          <Text style={[styles.retryButtonText, { color: colors.primaryForeground ?? '#fff' }]}>
            Réessayer
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main list view ───────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Summary header bar */}
      {unreadCount > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.summaryLeft}>
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countBadgeText}>{unreadCount}</Text>
            </View>
            <Text style={[styles.summaryText, { color: colors.foreground }]}>
              {t('notificationCentre.unread', locale)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={processing}
            accessibilityRole="button"
            accessibilityLabel={t('notificationCentre.a11y.markAllRead', locale)}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              {t('notificationCentre.markAllRead', locale)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('notificationCentre.empty', locale)}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {t('notificationCentre.emptySubtitle', locale)}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContentContainer : undefined}
      />

      {/* Processing overlay */}
      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(colors: any) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centeredContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    summaryBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    summaryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    countBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    countBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#ffffff',
    },
    summaryText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      fontFamily: typography.fontFamily.openSans,
    },
    markAllText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      fontFamily: typography.fontFamily.openSans,
    },
    notificationItem: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    notificationItemUnread: {
      backgroundColor: colors.card,
    },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    unreadDotContainer: {
      width: 10,
      marginTop: 6,
      alignItems: 'center',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    readDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'transparent',
    },
    notifContent: {
      flex: 1,
      gap: 2,
    },
    notifTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    notifTitle: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      fontFamily: typography.fontFamily.openSans,
    },
    notifDate: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      fontFamily: typography.fontFamily.openSans,
      flexShrink: 0,
    },
    notifMessage: {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.openSans,
      lineHeight: 18,
      marginTop: 2,
    },
    unreadBadgeRow: {
      flexDirection: 'row',
      marginTop: spacing.xs,
    },
    unreadBadge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: shapes.sm,
    },
    unreadBadgeText: {
      fontSize: typography.fontSize.xs - 1,
      fontWeight: typography.fontWeight.bold,
      color: '#ffffff',
    },
    chevron: {
      fontSize: 20,
      marginTop: 2,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      marginLeft: spacing.md + 10 + spacing.sm, // align with content start
    },
    emptyContentContainer: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      marginTop: spacing.xxl,
    },
    emptyIcon: {
      fontSize: 40,
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      fontFamily: typography.fontFamily.urbanist,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.openSans,
      textAlign: 'center',
      lineHeight: 20,
    },
    restrictedIcon: {
      fontSize: 32,
      marginBottom: spacing.md,
    },
    restrictedText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.openSans,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorIcon: {
      fontSize: 32,
      marginBottom: spacing.md,
    },
    errorText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.openSans,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    retryButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: shapes.sm,
    },
    retryButtonText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
    processingOverlay: {
      position: 'absolute',
      bottom: spacing.lg,
      alignSelf: 'center',
      backgroundColor: colors.card,
      borderRadius: shapes.full,
      padding: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  });
}
