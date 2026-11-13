/**
 * AES Guardian — OH Follow-Up Event Screen (Phase 2C.4)
 *
 * Allows the oh_professional to record a follow-up event milestone
 * on an acknowledged coordination record.
 *
 * Authorization: oh_professional only.
 * Clinical safety: Controlled category list only. No clinical fields,
 * no diagnoses, no PEP recommendations, no lab values.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
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
  canFollowUp,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  OH_FOLLOW_UP_EVENT_CATEGORIES,
  OhFollowUpEventCategory,
  logAuditEvent,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  recordFollowUpEvent: { coordinationId: number };
};

export const OhFollowUpEventScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'recordFollowUpEvent'>>();
  const { coordinationId } = route.params;

  const authContext = SYNTHETIC_OH_PROFESSIONAL_CONTEXT;
  const isAuthorized = canFollowUp(authContext);

  const [selectedCategory, setSelectedCategory] = useState<OhFollowUpEventCategory>(
    'contact_attempt_recorded',
  );
  const [eventDate, setEventDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [adminNote, setAdminNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!isAuthorized) return;

    setSubmitting(true);
    try {
      const db = getDatabase();
      const eventId = await db.createOhFollowUpEvent({
        coordination_id: coordinationId,
        event_category: selectedCategory,
        event_date: eventDate || new Date().toISOString(),
        recorded_by_user_id: authContext.userId!,
        administrative_note: adminNote.trim() || undefined,
      });
      await logAuditEvent({
        eventType: 'OH_FOLLOW_UP_EVENT_RECORDED',
        userId: authContext.userId,
        entityType: 'oh_follow_up_event',
        entityId: eventId,
        description: `Follow-up event '${selectedCategory}' recorded on coordination ${coordinationId}`,
      });
      Alert.alert('', t('oh.create.success'), [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert(t('error.generic'), err?.message ?? t('error.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [isAuthorized, coordinationId, selectedCategory, eventDate, adminNote, authContext, navigation]);

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
        {/* Category picker */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('oh.event.category')}</Text>
        {OH_FOLLOW_UP_EVENT_CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryLabel, { color: isSelected ? colors.primary : colors.foreground, fontWeight: isSelected ? '700' : '400' }]}>
                {t(`oh.event.${cat}` as any)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Date input */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('oh.event.date')}</Text>
        <TextInput
          style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={eventDate}
          onChangeText={setEventDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
          maxLength={10}
        />

        {/* Administrative note */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('oh.event.note')}</Text>
        <Text style={[styles.noteCaption, { color: colors.mutedForeground }]}>{t('oh.disclaimer.clinical')}</Text>
        <TextInput
          style={[styles.noteInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={adminNote}
          onChangeText={setAdminNote}
          placeholder={t('oh.event.notePlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={300}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: submitting ? colors.muted : colors.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.submitLabel, { color: colors.primaryForeground }]}>{t('oh.event.submit')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.screenPadding },
  sectionTitle: {
    fontSize: typography.fontSize.bodySmall,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  categoryCard: {
    borderRadius: shapes.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1.5,
  },
  categoryLabel: { fontSize: typography.fontSize.bodySmall },
  dateInput: {
    borderRadius: shapes.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.bodyMedium,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  noteInput: {
    borderRadius: shapes.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.bodyMedium,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noteCaption: { fontSize: typography.fontSize.xs, marginBottom: spacing.xs },
  submitButton: {
    borderRadius: shapes.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitLabel: { fontSize: typography.fontSize.bodyMedium, fontWeight: '700' },
  unauthorizedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screenPadding,
    margin: spacing.md,
    borderRadius: shapes.md,
    borderWidth: 1,
  },
  unauthorizedText: { fontSize: typography.fontSize.bodyMedium, textAlign: 'center' },
});
