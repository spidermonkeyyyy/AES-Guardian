/**
 * AES Guardian — Prevention Action Detail Screen (Phase 2C.6)
 *
 * Full detail view for a prevention action with status transitions
 * and audit history timeline.
 * Access: quality_staff (full CRUD), admin_reviewer, oh_professional (read-only).
 * Strictly prohibited: exposed_professional, tech_admin.
 *
 * Contributing-factor categories are PROVISIONAL.
 * No personal identifiers or clinical narratives are displayed.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
  PreventionActionDetail,
  PreventionActionStatus,
  isValidPreventionTransition,
} from '../../../core';
import { t } from '../../../localization';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/routes';

type RouteProps = RouteProp<RootStackParamList, 'preventionActionDetail'>;

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

export const PreventionActionDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<RouteProps>();
  const { actionId } = route.params;
  const styles = createStyles(colors);

  const [activeRoleContext, setActiveRoleContext] = useState<AuthContext>(SYNTHETIC_QUALITY_STAFF_CONTEXT);
  const isAuthorized = canViewPreventionActions(activeRoleContext);
  const canManage   = canManagePreventionActions(activeRoleContext);

  const [action,       setAction]       = useState<PreventionActionDetail | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [transitioning,setTransitioning]= useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [showNoteInput, setShowNoteInput]   = useState(false);

  const loadAction = useCallback(async () => {
    if (!isAuthorized || !activeRoleContext.userId) { setAction(null); return; }
    setLoading(true);
    setError(null);
    try {
      const db = getDatabase();
      const data = await db.getPreventionActionById(activeRoleContext.userId, actionId);
      setAction(data);
    } catch (e: any) {
      console.error('[PreventionDetail] loadAction error:', e?.message);
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [actionId, activeRoleContext, isAuthorized]);

  useEffect(() => { loadAction(); }, [loadAction]);

  const performTransition = async (newStatus: PreventionActionStatus, note?: string) => {
    console.log('[PreventionDetail] performTransition called:', { newStatus, note, userId: activeRoleContext.userId, actionId });
    if (!activeRoleContext.userId) {
      console.warn('[PreventionDetail] blocked: userId is null');
      Alert.alert('Debug', 'userId est null — contexte de rôle non initialisé');
      return;
    }
    setTransitioning(true);
    try {
      const db = getDatabase();
      console.log('[PreventionDetail] calling updatePreventionActionStatus...');
      await db.updatePreventionActionStatus(activeRoleContext.userId, actionId, newStatus, note);
      console.log('[PreventionDetail] transition succeeded');
      setShowNoteInput(false);
      setCompletionNote('');
      await loadAction();
    } catch (e: any) {
      console.error('[PreventionDetail] transition error:', e?.message);
      Alert.alert('Erreur de transition', e?.message ?? 'Transition impossible');
    } finally {
      setTransitioning(false);
    }
  };

  const handleStart = () => performTransition('in_progress');
  const handleCancel = () => {
    Alert.alert('Confirmation', 'Annuler cette action ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', onPress: () => performTransition('cancelled', 'Action annulée.') },
    ]);
  };
  const handleComplete = () => {
    if (!showNoteInput) { setShowNoteInput(true); return; }
    if (completionNote.trim().length < 3) {
      Alert.alert('Validation', 'La note de clôture doit comporter au moins 3 caractères.');
      return;
    }
    performTransition('completed', completionNote.trim());
  };

  const InfoRow: React.FC<{ label: string; value?: string | null; provisional?: boolean }> = ({
    label, value, provisional,
  }) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
        {provisional && (
          <Text style={styles.provisionalNote}>{t('prevention.provisional.disclaimer')}</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.root}>
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

      {!isAuthorized && (
        <View style={styles.unauthorizedBox}>
          <Text style={styles.unauthorizedText}>{t('prevention.unauthorized')}</Text>
        </View>
      )}

      {isAuthorized && loading && !action && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      )}

      {isAuthorized && error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      )}

      {isAuthorized && action && (
        <View style={styles.content}>
          {/* Status badge + reference */}
          <View style={styles.headerRow}>
            <Text style={styles.refText}>{action.reference_code}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[action.status] }]}>
              <Text style={styles.statusBadgeText}>{STATUS_LABELS[action.status]}</Text>
            </View>
          </View>

          <Text style={styles.actionTitle}>{action.title}</Text>

          {/* Detail fields */}
          <InfoRow label={t('prevention.detail.referenceCode')} value={action.reference_code} />
          <InfoRow label={t('prevention.create.action_type')}
            value={action.action_type === 'corrective'
              ? t('prevention.detail.type.corrective')
              : t('prevention.detail.type.preventive')}
          />
          <InfoRow
            label={t('prevention.detail.factor')}
            value={action.contributing_factor
              ? t(`prevention.factor.${action.contributing_factor}` as any)
              : undefined}
            provisional
          />
          <InfoRow label={t('prevention.create.description')} value={action.description} />
          <InfoRow label={t('prevention.detail.rationale')} value={action.rationale} />
          <InfoRow label={t('prevention.detail.createdAt')} value={action.created_at} />
          <InfoRow label={t('prevention.detail.targetDate')} value={action.target_date} />
          <InfoRow label={t('prevention.detail.completedAt')} value={action.completed_at} />
          <InfoRow label={t('prevention.detail.completionNotes')} value={action.completion_notes} />
          {action.surveillance_reference && (
            <InfoRow label={t('prevention.create.surveillance_reference')} value={action.surveillance_reference} />
          )}

          {/* Transition buttons — quality_staff only, non-terminal states */}
          {canManage && action.status !== 'completed' && action.status !== 'cancelled' && (
            <View style={styles.transitionSection}>
              {isValidPreventionTransition(action.status, 'in_progress') && (
                <TouchableOpacity
                  style={[styles.transBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={handleStart}
                  disabled={transitioning}
                >
                  <Text style={styles.transBtnText}>{t('prevention.detail.start_action')}</Text>
                </TouchableOpacity>
              )}
              {isValidPreventionTransition(action.status, 'completed') && (
                <TouchableOpacity
                  style={[styles.transBtn, { backgroundColor: '#10B981' }]}
                  onPress={handleComplete}
                  disabled={transitioning}
                >
                  <Text style={styles.transBtnText}>{t('prevention.detail.complete_action')}</Text>
                </TouchableOpacity>
              )}
              {isValidPreventionTransition(action.status, 'cancelled') && (
                <TouchableOpacity
                  style={[styles.transBtn, { backgroundColor: '#EF4444' }]}
                  onPress={handleCancel}
                  disabled={transitioning}
                >
                  <Text style={styles.transBtnText}>{t('prevention.detail.cancel_action')}</Text>
                </TouchableOpacity>
              )}
              {transitioning && <ActivityIndicator color={colors.primary} style={{ marginLeft: spacing.sm }} />}
            </View>
          )}

          {/* Completion note input */}
          {showNoteInput && (
            <View style={styles.noteInputSection}>
              <Text style={styles.label}>{t('prevention.detail.completion_note_prompt')}</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={completionNote}
                onChangeText={setCompletionNote}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.mutedForeground}
                placeholder="Note de clôture de l'action…"
              />
              <TouchableOpacity
                style={[styles.transBtn, { backgroundColor: '#10B981', marginTop: spacing.sm }]}
                onPress={handleComplete}
                disabled={transitioning}
              >
                <Text style={styles.transBtnText}>Confirmer la clôture</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Audit history */}
          <Text style={styles.sectionTitle}>{t('prevention.detail.audit_history')}</Text>
          {action.audit_history.length === 0 && (
            <Text style={styles.emptyText}>Aucun événement d'audit enregistré.</Text>
          )}
          {action.audit_history.map((evt, idx) => (
            <View key={evt.id ?? idx} style={styles.auditRow}>
              <View style={styles.auditDot} />
              <View style={styles.auditContent}>
                <Text style={styles.auditType}>{evt.event_type}</Text>
                <Text style={styles.auditDate}>{evt.occurred_at}</Text>
                {evt.description && (
                  <Text style={styles.auditDetails} numberOfLines={3}>{evt.description}</Text>
                )}
              </View>
            </View>
          ))}

          {/* Disclaimer */}
          <View style={styles.disclaimerBanner}>
            <Text style={styles.disclaimerText}>{t('prevention.disclaimer')}</Text>
          </View>
        </View>
      )}
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
    content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    refText: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      fontFamily: typography.fontFamily.openSans,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: shapes.full,
    },
    statusBadgeText: {
      color: '#fff',
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
    },
    actionTitle: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.md,
      fontFamily: typography.fontFamily.urbanist,
    },
    infoRow: {
      marginBottom: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      marginBottom: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: typography.fontSize.sm,
      color: colors.text,
      fontFamily: typography.fontFamily.openSans,
    },
    provisionalNote: {
      fontSize: typography.fontSize.xs,
      color: '#92400E',
      marginTop: 2,
    },
    transitionSection: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    transBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: shapes.md,
      minWidth: 100,
      alignItems: 'center',
    },
    transBtnText: { color: '#fff', fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },
    noteInputSection: {
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.card,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: shapes.md,
      padding: spacing.sm,
      color: colors.text,
      backgroundColor: colors.background,
    },
    multiline: { minHeight: 70, textAlignVertical: 'top' },
    sectionTitle: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    auditRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    auditDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
      marginTop: 4,
      marginRight: spacing.sm,
      flexShrink: 0,
    },
    auditContent: { flex: 1 },
    auditType: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.text,
    },
    auditDate: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
    },
    auditDetails: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    disclaimerBanner: {
      backgroundColor: '#FEF3C7',
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
      marginTop: spacing.xl,
      padding: spacing.sm,
      borderRadius: shapes.sm,
    },
    disclaimerText: {
      fontSize: typography.fontSize.xs,
      color: '#92400E',
    },
    errorBox: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: '#FEE2E2',
      borderRadius: shapes.md,
    },
    errorText: { color: '#991B1B' },
    emptyText: {
      color: colors.mutedForeground,
      fontFamily: typography.fontFamily.openSans,
      fontSize: typography.fontSize.sm,
      marginBottom: spacing.sm,
    },
  });
}
