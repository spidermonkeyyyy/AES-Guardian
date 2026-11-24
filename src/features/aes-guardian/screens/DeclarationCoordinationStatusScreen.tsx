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
  canDeclare,
} from '../../../core';
import { t } from '../../../localization';

import AppText from '../../../components/AppText';
type ParamList = {
  declarationCoordinationStatus: { declarationId: number };
};

export const DeclarationCoordinationStatusScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<ParamList, 'declarationCoordinationStatus'>>();
  const { declarationId } = route.params;

  const { activeContext } = useDemoRoleStore();
  const authContext = activeContext;
  const isAuthorized = canDeclare(authContext);

  const [coordination, setCoordination] = useState<
    OhCoordination | ExposedOhCoordinationSummary | null | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!isAuthorized || !authContext.userId) {
      setCoordination(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = getDatabase();
      const result = await db.getOhCoordinationByDeclaration(
        declarationId,
        authContext.userId,
      );
      setCoordination(result);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [declarationId, authContext.userId, isAuthorized]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const getStatusColors = (status?: OhCoordination['status']) => {
    switch (status) {
      case 'pending_acknowledgement':
        return { backgroundColor: colors.warningBackground, color: colors.warning };
      case 'acknowledged':
        return { backgroundColor: colors.infoBackground, color: colors.info };
      case 'completed':
        return { backgroundColor: colors.success, color: colors.successForeground };
      case 'cancelled':
      default:
        return { backgroundColor: colors.surfaceVariant, color: colors.mutedForeground };
    }
  };

  if (!isAuthorized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppText style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t('oh.error.unauthorized')}
        </AppText>
        <AppText style={[styles.errorText, { color: colors.mutedForeground }]}>
          {t('oh.detail.unauthorizedMessage')}
        </AppText>
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

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppText style={[styles.errorText, { color: colors.destructive }]}>{error}</AppText>
        <TouchableOpacity style={styles.retryButton} onPress={loadStatus}>
          <AppText style={{ color: colors.primary, fontSize: typography.fontSize.bodySmall }}>
            {t('oh.queue.refresh')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppText style={[styles.sectionTitle, { color: colors.foreground }]}>{t('oh.decl.coordinationStatus')}</AppText>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {coordination ? (
          <View style={[styles.statusBadge, getStatusColors(coordination.status)]}>
            <AppText style={[styles.statusText, { color: getStatusColors(coordination.status).color }]}>
              {t(`oh.status.${coordination.status}` as any)}
            </AppText>
          </View>
        ) : (
          <AppText style={[styles.noCoordText, { color: colors.mutedForeground }]}>{t('oh.decl.noActiveCoordination')}</AppText>
        )}
      </View>
      <View style={[styles.noteBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AppText style={[styles.noteText, { color: colors.mutedForeground }]}>{t('oh.disclaimer.clinical')}</AppText>
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
  statusText: { fontSize: typography.fontSize.bodyLarge, textAlign: 'center', fontWeight: '700' },
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
