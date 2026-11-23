/**
 * AES Guardian — Create OH Coordination Screen
 *
 * Phase 2E.1.6.1 — Batch 6: Occupational Health Coordination UI Transformation
 *
 * Strictly enforces:
 * - Restricted to `admin_reviewer` role via `canCoordinate()`.
 * - Links to an existing AES declaration record via route params.
 * - 4 Canonical coordination reasons:
 *     1. 'routine_followup'
 *     2. 'serology_monitoring'
 *     3. 'specialized_evaluation'
 *     4. 'other_coordination'
 * - Duplicate active coordination guard: preserves repository rejection and user feedback.
 * - Prototype disclaimer and clinical safety notices.
 * - Synchronous submission guard preventing duplicate submits.
 * - Standard AES Guardian design system (AesScreenContainer, AesScreenHeader, AesOptionCard, AesButton).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
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
  canCoordinate,
  useDemoRoleStore,
  OH_COORDINATION_REASONS,
  type OhCoordinationReason,
  logAuditEvent,
} from '../../../core';
import { t, useLocale } from '../../../localization';

type ParamList = {
  createCoordination: { declarationId: number };
};

export const CreateCoordinationScreen: React.FC = () => {
  const locale = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'createCoordination'>>();
  const { declarationId } = route.params;

  const { activeContext } = useDemoRoleStore();
  const authContext = activeContext;
  const isAuthorized = canCoordinate(authContext);

  const [selectedReason, setSelectedReason] = useState<OhCoordinationReason>(
    'routine_followup'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleCreate = useCallback(async () => {
    if (!isAuthorized || submitting) return;

    Alert.alert(
      t('oh.create.confirm'),
      t('oh.create.confirmMessage'),
      [
        { text: t('review.cancelButton'), style: 'cancel' },
        {
          text: t('review.confirmButton'),
          onPress: async () => {
            if (submitting) return;
            const currentContext = useDemoRoleStore.getState().activeContext;
            if (
              !canCoordinate(currentContext) ||
              currentContext.userId !== authContext.userId
            ) {
              Alert.alert(t('error.generic', locale), t('oh.error.unauthorized', locale));
              return;
            }
            setSubmitting(true);
            try {
              const db = getDatabase();
              const coordId = await db.createOhCoordination({
                declaration_id: declarationId,
                created_by_user_id: currentContext.userId!,
                coordination_reason: selectedReason,
              });
              await logAuditEvent({
                eventType: 'OH_COORDINATION_CREATED',
                userId: currentContext.userId,
                entityType: 'oh_coordination',
                entityId: coordId,
                description: `Coordination record created for declaration ${declarationId}`,
              });
              Alert.alert('', t('oh.create.success'), [
                {
                  text: t('app.ok', locale),
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (err: any) {
              const msg: string = err?.message || '';
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
      ]
    );
  }, [isAuthorized, submitting, declarationId, selectedReason, authContext, navigation, locale]);

  if (!isAuthorized) {
    return (
      <AesScreenContainer testID="create-coordination-unauthorized">
        <AesScreenHeader
          title={t('oh.create.title')}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <View style={styles.unauthorizedCard} testID="create-oh-unauthorized-card">
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
    <AesScreenContainer scrollable testID="create-coordination-screen">
      <AesScreenHeader
        title={t('oh.create.title')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.formContainer}>
        {/* Prototype Disclaimer Banner */}
        <View style={styles.disclaimerCard} testID="create-oh-disclaimer">
          <Text style={styles.disclaimerTitle}>{t('oh.create.disclaimer')}</Text>
          <Text style={styles.disclaimerBody}>{t('oh.create.disclaimerDetail')}</Text>
        </View>

        {/* Reason Picker Section */}
        <Text style={styles.sectionLabel}>{t('oh.create.reasonHelp')}</Text>
        <View style={styles.optionsGroup} testID="create-oh-reason-options">
          {OH_COORDINATION_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <AesOptionCard
                key={reason}
                title={t(`oh.reason.${reason}` as any)}
                selected={isSelected}
                onPress={() => setSelectedReason(reason)}
                variant="radio"
                testID={`create-oh-reason-${reason}`}
                style={styles.optionCard}
              />
            );
          })}
        </View>

        {/* Clinical Safety Disclaimer */}
        <View style={styles.clinicalNoticeCard} testID="create-oh-clinical-notice">
          <Text style={styles.clinicalNoticeText}>
            {t('oh.disclaimer.clinical')}
          </Text>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          <AesButton
            title={t('oh.create.button')}
            onPress={handleCreate}
            loading={submitting}
            disabled={submitting}
            variant="primary"
            testID="create-oh-submit-button"
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
  disclaimerCard: {
    backgroundColor: aesColors.accentGreenMuted,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.status.ohCoordination.completed.border,
    padding: aesSpacing.md,
    marginBottom: aesSpacing.md,
  },
  disclaimerTitle: {
    fontSize: aesTypography.subheading.fontSize,
    fontWeight: '700',
    color: aesColors.accentGreen,
    marginBottom: 4,
  },
  disclaimerBody: {
    fontSize: aesTypography.bodySmall.fontSize,
    color: aesColors.textPrimary,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: aesTypography.subheading.fontSize,
    fontWeight: '700',
    color: aesColors.textPrimary,
    marginBottom: aesSpacing.sm,
  },
  optionsGroup: {
    gap: aesSpacing.xs,
    marginBottom: aesSpacing.md,
  },
  optionCard: {
    marginBottom: 0,
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
