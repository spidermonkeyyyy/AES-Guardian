/**
 * AES Guardian — Declaration Coordination Status Screen (Phase 2C.4)
 *
 * Shows an exposed_professional the occupational-health coordination status
 * for their own declaration. Status label only — no events, no details,
 * no identifying clinical information.
 *
 * Authorization: exposed_professional (own declaration only).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  useDemoRoleStore,
  OhCoordination,
  ExposedOhCoordinationSummary,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  declarationCoordinationStatus: { declarationId: number };
};

export const DeclarationCoordinationStatusScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<ParamList, 'declarationCoordinationStatus'>>();
  const { declarationId } = route.params;

  const { activeContext } = useDemoRoleStore();
  const authContext = activeContext;

  const [coordination, setCoordination] = useState<
    OhCoordination | ExposedOhCoordinationSummary | null | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDatabase();
      const result = await db.getOhCoordinationByDeclaration(
        declarationId,
        authContext.userId!,
      );
      setCoordination(result);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [declarationId, authContext]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const getStatusColor = (status?: OhCoordination['status']): string => {
    switch (status) {
      case 'pending_acknowledgement': return colors.accent;
      case 'acknowledged': return colors.primary;
      case 'completed': return colors.secondary;
      case 'cancelled': return colors.mutedForeground;
      default: return colors.mutedForeground;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStatus}>
          <Text style={{ color: colors.primary, fontSize: typography.fontSize.bodySmall }}>{t('oh.queue.refresh')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('oh.decl.coordinationStatus')}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {coordination ? (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(coordination.status) }]}>
            <Text style={styles.statusText}>{t(`oh.status.${coordination.status}` as any)}</Text>
          </View>
        ) : (
          <Text style={[styles.noCoordText, { color: colors.mutedForeground }]}>{t('oh.decl.noActiveCoordination')}</Text>
        )}
      </View>
      <View style={[styles.noteBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>{t('oh.disclaimer.clinical')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.screenPadding },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: typography.fontSize.bodySmall, fontWeight: '700', marginBottom: spacing.xs },
  card: {
    borderRadius: shapes.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: shapes.sm,
    marginBottom: spacing.xs,
  },
  statusText: { fontSize: typography.fontSize.bodyLarge, color: '#fff', textAlign: 'center', fontWeight: '700' },
  noCoordText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center', marginBottom: spacing.xs },
  errorText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center' },
  noteBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: shapes.md,
    borderWidth: 1,
  },
  noteText: { fontSize: typography.fontSize.xs },
  retryButton: { marginTop: spacing.sm, alignSelf: 'center' },
});
