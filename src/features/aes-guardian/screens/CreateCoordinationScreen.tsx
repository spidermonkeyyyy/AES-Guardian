/**
 * AES Guardian — Create OH Coordination Screen (Phase 2C.4)
 *
 * Allows an admin_reviewer to create an occupational-health coordination
 * record linked to an existing AES declaration.
 *
 * PROTOTYPE DISCLAIMER: This creates a local demonstration coordination
 * record only. It does NOT transmit an official referral to any medical
 * service, hospital department, or occupational-health unit.
 *
 * Authorization: admin_reviewer only.
 * Clinical safety: No clinical fields, no diagnoses, no PEP, no lab values.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  canCoordinate,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  OH_COORDINATION_REASONS,
  OhCoordinationReason,
  logAuditEvent,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  createCoordination: { declarationId: number };
};

export const CreateCoordinationScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'createCoordination'>>();
  const { declarationId } = route.params;

  const authContext = SYNTHETIC_ADMIN_REVIEWER_CONTEXT;
  const isAuthorized = canCoordinate(authContext);

  const [selectedReason, setSelectedReason] = useState<OhCoordinationReason>('routine_followup');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!isAuthorized) return;

    Alert.alert(
      t('oh.create.confirm'),
      t('oh.create.confirmMessage'),
      [
        { text: t('review.cancelButton'), style: 'cancel' },
        {
          text: t('review.confirmButton'),
          onPress: async () => {
            setSubmitting(true);
            try {
              const db = getDatabase();
              const coordId = await db.createOhCoordination({
                declaration_id: declarationId,
                created_by_user_id: authContext.userId!,
                coordination_reason: selectedReason,
              });
              await logAuditEvent({
                eventType: 'OH_COORDINATION_CREATED',
                userId: authContext.userId,
                entityType: 'oh_coordination',
                entityId: coordId,
                description: `Coordination record created for declaration ${declarationId}`,
              });
              Alert.alert('', t('oh.create.success'), [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (err: any) {
              const msg: string = err?.message ?? '';
              if (msg.includes('active coordination already exists')) {
                Alert.alert(t('error.generic'), t('oh.error.alreadyActive'));
              } else {
                Alert.alert(t('error.generic'), msg || t('error.saveFailed'));
              }
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }, [isAuthorized, declarationId, selectedReason, authContext, navigation]);

  if (!isAuthorized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.unauthorizedBox, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
          <Text style={[styles.unauthorizedText, { color: colors.destructive }]}>{t('oh.error.unauthorized')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Prototype disclaimer */}
        <View style={[styles.disclaimerBox, { backgroundColor: colors.card, borderColor: colors.accent }]}>
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>{t('oh.create.disclaimer')}</Text>
        </View>

        {/* Reason picker */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('oh.create.reason')}</Text>
        {OH_COORDINATION_REASONS.map(reason => {
          const isSelected = selectedReason === reason;
          return (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedReason(reason)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.reasonLabel,
                  { color: isSelected ? colors.primary : colors.foreground, fontWeight: isSelected ? '700' : '400' },
                ]}
              >
                {t(`oh.reason.${reason}` as any)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: submitting ? colors.muted : colors.primary },
          ]}
          onPress={handleCreate}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.submitLabel, { color: colors.primaryForeground }]}>{t('oh.create.button')}</Text>
          )}
        </TouchableOpacity>

        {/* Clinical safety note */}
        <View style={[styles.clinicalNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.clinicalNoteText, { color: colors.mutedForeground }]}>{t('oh.disclaimer.clinical')}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.screenPadding },
  unauthorizedBox: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: shapes.md,
    borderWidth: 1,
  },
  unauthorizedText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center' },
  sectionTitle: { fontSize: typography.fontSize.bodySmall, fontWeight: '700', marginBottom: spacing.xs },
  disclaimerBox: {
    borderRadius: shapes.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  disclaimerText: { fontSize: typography.fontSize.xs },
  reasonCard: {
    borderRadius: shapes.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1.5,
  },
  reasonLabel: { fontSize: typography.fontSize.bodySmall },
  submitButton: {
    borderRadius: shapes.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitLabel: { fontSize: typography.fontSize.bodyMedium, fontWeight: '700' },
  clinicalNote: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: shapes.md,
    borderWidth: 1,
  },
  clinicalNoteText: { fontSize: typography.fontSize.xs },
});
