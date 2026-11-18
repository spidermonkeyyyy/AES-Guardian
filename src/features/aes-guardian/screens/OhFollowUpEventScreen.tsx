/**
 * AES Guardian — OH Record Follow-Up Event Screen
 *
 * Phase 2E.1.6.1 — Batch 6: Occupational Health Coordination UI Transformation
 *
 * Strictly enforces:
 * - Restricted to `oh_professional` role via `canFollowUp()`.
 * - 6 Canonical event categories:
 *     1. 'contact_attempt_recorded'
 *     2. 'contact_established'
 *     3. 'appointment_coordinated'
 *     4. 'consultation_recorded'
 *     5. 'follow_up_continued'
 *     6. 'follow_up_completed'
 * - ISO event date input with validation (YYYY-MM-DD).
 * - Administrative non-clinical note with 300 character limit and counter.
 * - Synchronous submission guard preventing duplicate submits.
 * - Failure preserves form state.
 * - Standard AES Guardian design system (AesScreenContainer, AesScreenHeader, AesOptionCard, AesButton).
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
  AesOptionCard,
  AesButton,
} from '../components';
import {
  getDatabase,
  canFollowUp,
  useDemoRoleStore,
  OH_FOLLOW_UP_EVENT_CATEGORIES,
  type OhFollowUpEventCategory,
  logAuditEvent,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  recordFollowUpEvent: { coordinationId: number };
};

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const OhFollowUpEventScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'recordFollowUpEvent'>>();
  const { coordinationId } = route.params;

  const { activeContext } = useDemoRoleStore();
  const authContext = activeContext;
  const isAuthorized = canFollowUp(authContext);

  const [selectedCategory, setSelectedCategory] = useState<OhFollowUpEventCategory>(
    'contact_attempt_recorded'
  );
  const [eventDate, setEventDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [dateError, setDateError] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const submittingRef = useRef(false);

  const handleDateChange = (val: string) => {
    setEventDate(val);
    if (dateError) {
      setDateError(null);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!isAuthorized || submitting || submittingRef.current) return;

    // Validate ISO date format YYYY-MM-DD
    const trimmedDate = eventDate.trim();
    if (!ISO_DATE_REGEX.test(trimmedDate)) {
      setDateError(t('oh.event.dateInvalid'));
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const db = getDatabase();
      const eventId = await db.createOhFollowUpEvent({
        coordination_id: coordinationId,
        event_category: selectedCategory,
        event_date: trimmedDate,
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
      Alert.alert(t('error.generic'), err?.message || t('error.saveFailed'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [
    isAuthorized,
    submitting,
    eventDate,
    coordinationId,
    selectedCategory,
    adminNote,
    authContext,
    navigation,
  ]);

  if (!isAuthorized) {
    return (
      <AesScreenContainer testID="record-follow-up-event-unauthorized">
        <AesScreenHeader
          title={t('oh.event.title')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <View style={styles.unauthorizedCard} testID="oh-event-unauthorized-card">
            <Text style={styles.unauthorizedTitle}>{t('oh.error.unauthorized')}</Text>
            <Text style={styles.unauthorizedText}>
              {t('oh.detail.unauthorizedMessage')}
            </Text>
          </View>
        </View>
      </AesScreenContainer>
    );
  }

  return (
    <AesScreenContainer scrollable testID="record-follow-up-event-screen">
      <AesScreenHeader
        title={t('oh.event.title')}
        subtitle={`${t('oh.detail.title')} #${coordinationId}`}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.formContainer}>
        {/* Category Selection */}
        <Text style={styles.sectionLabel}>{t('oh.event.category')}</Text>
        <View style={styles.optionsGroup} testID="oh-event-category-options">
          {OH_FOLLOW_UP_EVENT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <AesOptionCard
                key={cat}
                title={t(`oh.event.${cat}` as any)}
                selected={isSelected}
                onPress={() => setSelectedCategory(cat)}
                variant="radio"
                testID={`oh-event-category-${cat}`}
                style={styles.optionCard}
              />
            );
          })}
        </View>

        {/* Date Input Section */}
        <View style={styles.fieldSection}>
          <Text style={styles.sectionLabel}>{t('oh.event.date')}</Text>
          <TextInput
            style={[
              styles.textInput,
              dateError ? styles.textInputError : null,
            ]}
            value={eventDate}
            onChangeText={handleDateChange}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={aesColors.textPlaceholder}
            maxLength={10}
            accessibilityLabel={t('oh.event.date')}
            testID="oh-event-date-input"
          />
          {dateError ? (
            <Text style={styles.errorCaption} testID="oh-event-date-error">
              {dateError}
            </Text>
          ) : null}
        </View>

        {/* Administrative Note Section */}
        <View style={styles.fieldSection}>
          <View style={styles.noteHeaderRow}>
            <Text style={styles.sectionLabel}>{t('oh.event.note')}</Text>
            <Text
              style={[
                styles.charCounter,
                adminNote.length >= 280 ? styles.charCounterWarning : null,
              ]}
              testID="oh-event-char-counter"
            >
              {adminNote.length} / 300 {t('oh.event.charCount')}
            </Text>
          </View>
          <Text style={styles.noteCaption}>{t('oh.event.noteDescription')}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={adminNote}
            onChangeText={setAdminNote}
            placeholder={t('oh.event.notePlaceholder')}
            placeholderTextColor={aesColors.textPlaceholder}
            multiline
            maxLength={300}
            numberOfLines={4}
            accessibilityLabel={t('oh.event.note')}
            testID="oh-event-note-input"
          />
        </View>

        {/* Clinical Safety Disclaimer */}
        <View style={styles.clinicalNoticeCard} testID="oh-event-clinical-notice">
          <Text style={styles.clinicalNoticeText}>
            {t('oh.disclaimer.clinical')}
          </Text>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          <AesButton
            title={t('oh.event.submit')}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            variant="primary"
            testID="oh-event-submit-button"
          />
        </View>
      </View>
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    paddingHorizontal: aesSpacing.lg,
    paddingBottom: aesSpacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: aesSpacing.lg,
  },
  sectionLabel: {
    fontSize: aesTypography.subheading.fontSize,
    fontWeight: '700',
    color: aesColors.textPrimary,
    marginBottom: aesSpacing.xs,
  },
  optionsGroup: {
    gap: aesSpacing.xs,
    marginBottom: aesSpacing.md,
  },
  optionCard: {
    marginBottom: 0,
  },
  fieldSection: {
    marginBottom: aesSpacing.md,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: aesTypography.labelSmall.fontSize,
    color: aesColors.textTertiary,
  },
  charCounterWarning: {
    color: aesColors.banners.error.text,
    fontWeight: '700',
  },
  noteCaption: {
    fontSize: aesTypography.labelSmall.fontSize,
    color: aesColors.textSecondary,
    marginBottom: aesSpacing.xs,
  },
  textInput: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.input,
    borderWidth: 1,
    borderColor: aesColors.borderMedium,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.sm,
    fontSize: aesTypography.body.fontSize,
    color: aesColors.textPrimary,
    minHeight: 48,
  },
  textInputError: {
    borderColor: aesColors.banners.error.text,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  errorCaption: {
    fontSize: aesTypography.labelSmall.fontSize,
    color: aesColors.banners.error.text,
    marginTop: 4,
  },
  clinicalNoticeCard: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.md,
    marginBottom: aesSpacing.lg,
  },
  clinicalNoticeText: {
    fontSize: aesTypography.labelSmall.fontSize,
    color: aesColors.textSecondary,
    lineHeight: 16,
  },
  actionContainer: {
    marginBottom: aesSpacing.xl,
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
});
