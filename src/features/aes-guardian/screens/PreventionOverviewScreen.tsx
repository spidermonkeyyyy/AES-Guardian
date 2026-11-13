/**
 * AES Guardian — Prevention Overview Screen (Phase 2C.6)
 *
 * Aggregate counts for the prevention-action register.
 * Access: quality_staff (full CRUD), admin_reviewer, oh_professional (read-only).
 * Strictly prohibited: exposed_professional, tech_admin.
 *
 * Displays synthetic demonstration data only.
 * Does not perform clinical analysis or risk scoring.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  canManagePreventionActions,
  canViewPreventionActions,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  AuthContext,
  PreventionOverview,
} from '../../../core';
import { t } from '../../../localization';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/routes';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const DEMO_ROLES: Array<{ key: string; label: string; context: AuthContext }> = [
  { key: 'quality_staff',       label: 'Qualité (Autorisé)',   context: SYNTHETIC_QUALITY_STAFF_CONTEXT },
  { key: 'admin_reviewer',      label: 'Admin RH (Autorisé)',  context: SYNTHETIC_ADMIN_REVIEWER_CONTEXT },
  { key: 'oh_professional',     label: 'SST (Autorisé)',       context: SYNTHETIC_OH_PROFESSIONAL_CONTEXT },
  { key: 'exposed_professional',label: 'Exposé (Bloqué)',      context: SYNTHETIC_DEMO_CONTEXT },
  { key: 'tech_admin',          label: 'Tech Admin (Bloqué)',  context: SYNTHETIC_TECH_ADMIN_CONTEXT },
];

export const PreventionOverviewScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const styles = createStyles(colors);

  const [activeRoleContext, setActiveRoleContext] = useState<AuthContext>(SYNTHETIC_QUALITY_STAFF_CONTEXT);
  const isAuthorized = canViewPreventionActions(activeRoleContext);
  const canManage   = canManagePreventionActions(activeRoleContext);

  const [overview, setOverview] = useState<PreventionOverview | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!isAuthorized || !activeRoleContext.userId) { setOverview(null); return; }
    setLoading(true);
    setError(null);
    try {
      const db = await getDatabase();
      const data = await db.getPreventionOverview(activeRoleContext.userId);
      setOverview(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [activeRoleContext, isAuthorized]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const StatCard: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color ?? colors.primary }]}>
      <Text style={[styles.statValue, { color: color ?? colors.primary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOverview} />}
    >
      {/* Disclaimer */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>{t('prevention.disclaimer')}</Text>
      </View>

      {/* Role switcher */}
      <View style={styles.roleBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DEMO_ROLES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.roleChip,
                activeRoleContext.userId === r.context.userId && styles.roleChipActive,
              ]}
              onPress={() => setActiveRoleContext(r.context)}
            >
              <Text style={[
                styles.roleChipText,
                activeRoleContext.userId === r.context.userId && styles.roleChipTextActive,
              ]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Not authorized */}
      {!isAuthorized && (
        <View style={styles.unauthorizedBox}>
          <Text style={styles.unauthorizedText}>{t('prevention.unauthorized')}</Text>
        </View>
      )}

      {isAuthorized && (
        <>
          <Text style={styles.sectionTitle}>{t('prevention.overview.title')}</Text>

          {loading && !overview && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {overview && (
            <View style={styles.statsGrid}>
              <StatCard label={t('prevention.overview.total')}       value={overview.total}       color={colors.primary} />
              <StatCard label={t('prevention.overview.proposed')}    value={overview.proposed}    color="#6366F1" />
              <StatCard label={t('prevention.overview.in_progress')} value={overview.in_progress} color="#F59E0B" />
              <StatCard label={t('prevention.overview.completed')}   value={overview.completed}   color="#10B981" />
              <StatCard label={t('prevention.overview.cancelled')}   value={overview.cancelled}   color="#EF4444" />
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('preventionRegister')}
            >
              <Text style={styles.actionBtnText}>{t('prevention.overview.viewRegister')}</Text>
            </TouchableOpacity>
            {canManage && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                onPress={() => navigation.navigate('preventionCreate')}
              >
                <Text style={styles.actionBtnText}>{t('prevention.overview.newAction')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    disclaimerBanner: {
      backgroundColor: '#FEF3C7',
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
      margin: spacing.md,
      padding: spacing.sm,
      borderRadius: shapes.sm,
    },
    disclaimerText: {
      fontSize: typography.fontSize.xs,
      color: '#92400E',
      fontFamily: typography.fontFamily.openSans,
    },
    roleBar: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    roleChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: shapes.full,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.xs,
      backgroundColor: colors.card,
    },
    roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleChipText: { fontSize: typography.fontSize.xs, color: colors.text },
    roleChipTextActive: { color: '#fff', fontWeight: typography.fontWeight.bold },
    unauthorizedBox: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: '#FEE2E2',
      borderRadius: shapes.md,
    },
    unauthorizedText: { color: '#991B1B', textAlign: 'center' },
    sectionTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      fontFamily: typography.fontFamily.urbanist,
    },
    statsGrid: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      padding: spacing.md,
      borderLeftWidth: 4,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    statValue: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      minWidth: 50,
      textAlign: 'center',
    },
    statLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.mutedForeground,
      fontFamily: typography.fontFamily.openSans,
      flexShrink: 1,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginVertical: spacing.lg,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: shapes.md,
      alignItems: 'center',
    },
    actionBtnText: {
      color: '#fff',
      fontWeight: typography.fontWeight.bold,
      fontSize: typography.fontSize.sm,
    },
    errorBox: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: '#FEE2E2',
      borderRadius: shapes.md,
    },
    errorText: { color: '#991B1B' },
  });
}
