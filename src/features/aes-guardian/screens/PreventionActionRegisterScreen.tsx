/**
 * AES Guardian — Prevention Action Register Screen (Phase 2C.6)
 *
 * Filterable list of prevention actions.
 * Access: quality_staff (full CRUD), admin_reviewer, oh_professional (read-only).
 * Strictly prohibited: exposed_professional, tech_admin.
 *
 * Displays synthetic demonstration data only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
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
  PreventionAction,
  PreventionActionStatus,
  PreventionActionType,
  PREVENTION_ACTION_STATUSES,
  PREVENTION_ACTION_TYPES,
} from '../../../core';
import { t } from '../../../localization';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/routes';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const DEMO_ROLES: Array<{ key: string; label: string; context: AuthContext }> = [
  { key: 'quality_staff',       label: 'Qualité',   context: SYNTHETIC_QUALITY_STAFF_CONTEXT },
  { key: 'admin_reviewer',      label: 'Admin RH',  context: SYNTHETIC_ADMIN_REVIEWER_CONTEXT },
  { key: 'oh_professional',     label: 'SST',       context: SYNTHETIC_OH_PROFESSIONAL_CONTEXT },
  { key: 'exposed_professional',label: 'Exposé ✗',  context: SYNTHETIC_DEMO_CONTEXT },
  { key: 'tech_admin',          label: 'Tech ✗',    context: SYNTHETIC_TECH_ADMIN_CONTEXT },
];

const STATUS_COLORS: Record<PreventionActionStatus, string> = {
  proposed:    '#6366F1',
  in_progress: '#F59E0B',
  completed:   '#10B981',
  cancelled:   '#EF4444',
};

const STATUS_LABELS: Record<PreventionActionStatus, string> = {
  proposed:    t('prevention.detail.status.proposed'),
  in_progress: t('prevention.detail.status.in_progress'),
  completed:   t('prevention.detail.status.completed'),
  cancelled:   t('prevention.detail.status.cancelled'),
};

export const PreventionActionRegisterScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const styles = createStyles(colors);

  const [activeRoleContext, setActiveRoleContext] = useState<AuthContext>(SYNTHETIC_QUALITY_STAFF_CONTEXT);
  const isAuthorized = canViewPreventionActions(activeRoleContext);
  const canManage   = canManagePreventionActions(activeRoleContext);

  const [actions,   setActions]   = useState<PreventionAction[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PreventionActionStatus | undefined>(undefined);
  const [filterType,   setFilterType]   = useState<PreventionActionType | undefined>(undefined);

  const loadActions = useCallback(async () => {
    if (!isAuthorized || !activeRoleContext.userId) { setActions([]); return; }
    setLoading(true);
    setError(null);
    try {
      const db = await getDatabase();
      const data = await db.listPreventionActions(activeRoleContext.userId, {
        status: filterStatus,
        action_type: filterType,
      });
      setActions(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [activeRoleContext, isAuthorized, filterStatus, filterType]);

  useEffect(() => { loadActions(); }, [loadActions]);

  const renderItem = ({ item }: { item: PreventionAction }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('preventionActionDetail', { actionId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.refCode}>{item.reference_code}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.cardMeta}>
        <View style={[styles.typeBadge, { borderColor: colors.border }]}>
          <Text style={styles.typeBadgeText}>
            {item.action_type === 'corrective'
              ? t('prevention.detail.type.corrective')
              : t('prevention.detail.type.preventive')}
          </Text>
        </View>
        {item.contributing_factor && (
          <Text style={styles.factorText} numberOfLines={1}>
            {t(`prevention.factor.${item.contributing_factor}` as any)}
          </Text>
        )}
      </View>
      {item.target_date && (
        <Text style={styles.dateText}>Cible : {item.target_date}</Text>
      )}
    </TouchableOpacity>
  );

  const FilterChip: React.FC<{
    label: string;
    active: boolean;
    onPress: () => void;
  }> = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Role switcher */}
      <View style={styles.roleBar}>
        <FlatList
          data={DEMO_ROLES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={r => r.key}
          renderItem={({ item: r }) => (
            <TouchableOpacity
              style={[
                styles.roleChip,
                activeRoleContext.userId === r.context.userId && styles.roleChipActive,
              ]}
              onPress={() => { setActiveRoleContext(r.context); }}
            >
              <Text style={[
                styles.roleChipText,
                activeRoleContext.userId === r.context.userId && styles.roleChipTextActive,
              ]}>{r.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Not authorized */}
      {!isAuthorized && (
        <View style={styles.unauthorizedBox}>
          <Text style={styles.unauthorizedText}>{t('prevention.unauthorized')}</Text>
        </View>
      )}

      {isAuthorized && (
        <>
          {/* Status filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('prevention.register.filterStatus')} :</Text>
            <ScrollViewHorizontal>
              <FilterChip
                label={t('prevention.register.all')}
                active={!filterStatus}
                onPress={() => setFilterStatus(undefined)}
              />
              {PREVENTION_ACTION_STATUSES.map(s => (
                <FilterChip
                  key={s}
                  label={STATUS_LABELS[s]}
                  active={filterStatus === s}
                  onPress={() => setFilterStatus(filterStatus === s ? undefined : s)}
                />
              ))}
            </ScrollViewHorizontal>
          </View>

          {/* Type filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('prevention.register.filterType')} :</Text>
            <ScrollViewHorizontal>
              <FilterChip
                label={t('prevention.register.all')}
                active={!filterType}
                onPress={() => setFilterType(undefined)}
              />
              {PREVENTION_ACTION_TYPES.map(tp => (
                <FilterChip
                  key={tp}
                  label={tp === 'corrective' ? t('prevention.detail.type.corrective') : t('prevention.detail.type.preventive')}
                  active={filterType === tp}
                  onPress={() => setFilterType(filterType === tp ? undefined : tp)}
                />
              ))}
            </ScrollViewHorizontal>
          </View>

          {loading && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <FlatList
            data={actions}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadActions} />}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.emptyText}>{t('prevention.register.empty')}</Text>
              ) : null
            }
          />

          {canManage && (
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('preventionCreate')}
            >
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

// Minimal inline horizontal scroll wrapper
const ScrollViewHorizontal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'nowrap' }}>
        {children}
      </View>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    roleBar: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    roleChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: shapes.full,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.xs,
      backgroundColor: colors.background,
    },
    roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleChipText: { fontSize: typography.fontSize.xs, color: colors.text },
    roleChipTextActive: { color: '#fff' },
    unauthorizedBox: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: '#FEE2E2',
      borderRadius: shapes.md,
    },
    unauthorizedText: { color: '#991B1B', textAlign: 'center' },
    filterSection: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      gap: spacing.xs,
    },
    filterLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      minWidth: 50,
    },
    filterChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: shapes.full,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.xs,
      backgroundColor: colors.card,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { fontSize: typography.fontSize.xs, color: colors.text },
    filterChipTextActive: { color: '#fff' },
    list: { padding: spacing.md, paddingBottom: spacing.xl * 3 },
    card: {
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    refCode: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      fontFamily: typography.fontFamily.openSans,
    },
    statusBadge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: shapes.full,
    },
    statusBadgeText: { color: '#fff', fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold },
    cardTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: 4,
    },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
    typeBadge: {
      borderWidth: 1,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: shapes.sm,
    },
    typeBadgeText: { fontSize: typography.fontSize.xs, color: colors.text },
    factorText: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      flexShrink: 1,
    },
    dateText: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
    errorBox: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: '#FEE2E2',
      borderRadius: shapes.md,
    },
    errorText: { color: '#991B1B' },
    emptyText: {
      textAlign: 'center',
      color: colors.mutedForeground,
      marginTop: spacing.xl,
      fontFamily: typography.fontFamily.openSans,
    },
  });
}
