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
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { getDatabase, AesDeclaration, DeclarationStatus } from '../../../core';
import { t } from '../../../localization';

export const DeclarationListScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isFocused = useIsFocused();

  const [declarations, setDeclarations] = useState<AesDeclaration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeclarations = useCallback(async () => {
    try {
      setError(null);
      const db = getDatabase();
      const list = await db.getDeclarations();
      setDeclarations(list);
    } catch (err: any) {
      setError(t('error.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadDeclarations();
    }
  }, [isFocused, loadDeclarations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeclarations();
  };

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

  const renderStatusBadge = (status: DeclarationStatus) => {
    const badgeStyle = getStatusBadgeStyle(status);
    const statusKey = `status.${status}` as const;
    return (
      <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
        <Text style={[styles.badgeText, { color: badgeStyle.textColor }]}>
          {t(statusKey as any)}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: AesDeclaration }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={() => navigation.navigate('declarationDetails', { declarationId: item.id })}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${t('list.refNumber')} ${item.reference_number}`}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.refNumber, { color: colors.foreground }]}>
          {item.reference_number}
        </Text>
        {renderStatusBadge(item.status)}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.incidentDate, { color: colors.mutedForeground }]}>
          {t('list.incidentDate')}: {item.incident_date}
        </Text>
        {item.circumstances ? (
          <Text
            numberOfLines={2}
            style={[styles.circumstances, { color: colors.foreground }]}
          >
            {item.circumstances}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('list.title')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.queueButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('adminReviewQueue')}
            accessibilityRole="button"
            accessibilityLabel={t('nav.reviewQueue')}
          >
            <Text style={[styles.queueButtonText, { color: colors.foreground }]}>
              {t('nav.reviewQueue')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('newDeclaration')}
            accessibilityRole="button"
            accessibilityLabel={t('list.newButton')}
          >
            <Text style={[styles.newButtonText, { color: colors.primaryForeground }]}>
              + {t('list.newButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {t('app.loading')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={declarations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t('list.empty')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                {t('list.emptySubtitle')}
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.titleLarge,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  queueButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: shapes.md,
    borderWidth: 1,
  },
  queueButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  newButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: shapes.md,
  },
  newButtonText: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    padding: spacing.cardPadding,
    borderRadius: shapes.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  refNumber: {
    fontSize: typography.fontSize.titleSmall,
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
  cardBody: {
    gap: spacing.xs,
  },
  incidentDate: {
    fontSize: typography.fontSize.bodySmall,
  },
  circumstances: {
    fontSize: typography.fontSize.bodyMedium,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.bodyMedium,
  },
  emptyContainer: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.titleMedium,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.bodyMedium,
    textAlign: 'center',
  },
  errorContainer: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.bodyMedium,
    textAlign: 'center',
  },
});

export default DeclarationListScreen;
