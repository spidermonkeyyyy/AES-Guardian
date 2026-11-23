/**
 * AES Guardian — Correction Response Screen
 *
 * Phase 2E.1.5.1 — Batch 5: Administrative Review Queue & Actions
 *
 * Allows an exposed_professional to review an administrative correction request
 * and submit a structured clarification/response.
 *
 * Strictly enforces:
 * - Author role: exposed_professional only via canRespondToCorrection().
 * - Ownership: user must be the declaring professional.
 * - Non-destructive: original declaration remains completely immutable.
 * - Audit logging: CORRECTION_RESPONSE_SUBMITTED event logged.
 * - Tri-lingual support (FR/EN/AR).
 * - Standard AES Guardian design system (AesScreenContainer, AesScreenHeader, AesCard, AesButton).
 * - Live character counter and structured quotation-style request card.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  aesColors,
  aesBannerColors,
  aesTypography,
  aesSpacing,
  aesRadii,
  aesShadows,
} from '../../../theme/tokens';
import {
  AesScreenContainer,
  AesScreenHeader,
  AesCard,
  AesButton,
} from '../components';
import {
  getDatabase,
  canRespondToCorrection,
  useDemoRoleStore,
  logAuditEvent,
  AdministrativeReview,
} from '../../../core';
import { t, useLocale } from '../../../localization';

type ParamList = {
  correctionResponse: { declarationId: number; reviewId: number };
};

export const CorrectionResponseScreen: React.FC = () => {
  const locale = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'correctionResponse'>>();
  const { declarationId, reviewId } = route.params;

  const { activeContext } = useDemoRoleStore();
  const userContext = activeContext;
  const isAuthorized = canRespondToCorrection(userContext);

  const [correctionRequest, setCorrectionRequest] = useState<AdministrativeReview | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCorrectionRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isAuthorized || !userContext.userId) {
        setError(t('correction.unauthorized'));
        return;
      }
      const db = getDatabase();
      const request = await db.getLatestPendingCorrectionRequest(declarationId, userContext.userId!);
      if (!request) {
        // Fallback: load specific review by ID from history
        const history = await db.getDeclarationReviewHistory(declarationId, userContext.userId!);
        const match = history.find((r) => r.id === reviewId);
        if (match && match.outcome === 'correction_requested') {
          setCorrectionRequest(match);
        } else {
          setError(t('correction.unauthorized'));
        }
        return;
      }
      setCorrectionRequest(request);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [declarationId, reviewId, isAuthorized, userContext.userId]);

  useEffect(() => {
    loadCorrectionRequest();
  }, [loadCorrectionRequest]);

  const handleSubmit = useCallback(async () => {
    if (!isAuthorized || !userContext.userId) {
      Alert.alert(t('error.generic', locale), t('correction.unauthorized', locale));
      return;
    }

    if (!responseText.trim()) {
      Alert.alert(t('error.generic'), t('correction.errorRequired'));
      return;
    }

    Alert.alert(
      t('correction.confirmTitle'),
      t('correction.confirmMessage'),
      [
        { text: t('review.cancelButton'), style: 'cancel' },
        {
          text: t('correction.submitButton'),
          onPress: async () => {
            const currentContext = useDemoRoleStore.getState().activeContext;
            if (
              !canRespondToCorrection(currentContext) ||
              currentContext.userId !== userContext.userId
            ) {
              Alert.alert(t('error.generic', locale), t('correction.unauthorized', locale));
              return;
            }
            setSubmitting(true);
            setError(null);
            try {
              const db = getDatabase();
              await db.createCorrectionResponse({
                declaration_id: declarationId,
                review_id: correctionRequest?.id ?? reviewId,
                user_id: currentContext.userId!,
                response_text: responseText.trim(),
              });

              await logAuditEvent({
                eventType: 'CORRECTION_RESPONSE_SUBMITTED',
                userId: currentContext.userId!,
                entityType: 'correction_response',
                entityId: declarationId,
                description: `Correction response submitted for declaration #${declarationId}`,
              });

              Alert.alert(
                t('correction.successTitle'),
                t('correction.successMessage'),
                [{ text: t('app.ok'), onPress: () => navigation.goBack() }],
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : t('error.submitFailed'));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }, [responseText, declarationId, reviewId, correctionRequest, userContext.userId, isAuthorized, navigation]);

  if (loading) {
    return (
      <AesScreenContainer testID="correction-response-loading">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
        </View>
      </AesScreenContainer>
    );
  }

  if (error && !correctionRequest) {
    return (
      <AesScreenContainer testID="correction-response-error">
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <AesButton
            title={t('reviewQueue.refresh')}
            onPress={loadCorrectionRequest}
            variant="outline"
            fullWidth={false}
          />
        </View>
      </AesScreenContainer>
    );
  }

  return (
    <AesScreenContainer scrollable testID="correction-response-screen">
      <AesScreenHeader
        title={t('correction.screenTitle')}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.contentContainer}>
        {/* SYNTHETIC DEMO BANNER */}
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            ⚠ {t('correction.demoContext', locale)}
          </Text>
        </View>

        {/* Reviewer's Request Card */}
        {correctionRequest && (
          <View style={styles.requestCard}>
            <Text style={styles.sectionHeader}>
              {t('correction.requestHeader')}
            </Text>

            <Text style={styles.fieldLabel}>
              {t('correction.reasonLabel')}
            </Text>
            <Text style={styles.fieldValue}>
              {correctionRequest.correction_reason || '—'}
            </Text>

            {correctionRequest.comments ? (
              <>
                <Text style={styles.fieldLabel}>
                  {t('correction.commentsLabel')}
                </Text>
                <Text style={styles.fieldValue}>
                  {correctionRequest.comments}
                </Text>
              </>
            ) : null}

            <View style={styles.separationNoticeBox}>
              <Text style={styles.separationNoticeText}>
                {t('review.readOnlyNotice')}
              </Text>
            </View>
          </View>
        )}

        {/* Response Input */}
        <AesCard style={styles.inputSection}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>
              {t('correction.inputLabel')}
            </Text>
            <Text style={styles.characterCount}>
              {t('correction.characterCount', locale).replace(
                '{count}',
                String(responseText.length),
              )}
            </Text>
          </View>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={6}
            placeholder={t('correction.inputPlaceholder')}
            placeholderTextColor={aesColors.textTertiary}
            value={responseText}
            onChangeText={setResponseText}
            editable={!submitting}
            textAlignVertical="top"
            accessibilityLabel={t('correction.inputLabel')}
          />
        </AesCard>

        {error ? (
          <Text style={styles.inlineError}>{error}</Text>
        ) : null}

        <View style={styles.submitContainer}>
          <AesButton
            title={t('correction.submitButton')}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </View>
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingBottom: aesSpacing['5xl'],
    gap: aesSpacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: aesSpacing.xl,
  },
  demoBanner: {
    backgroundColor: aesBannerColors.warning.bg,
    borderRadius: aesRadii.card,
    padding: aesSpacing.sm,
    borderWidth: 1,
    borderColor: aesBannerColors.warning.border,
  },
  demoBannerText: {
    color: aesBannerColors.warning.text,
    ...aesTypography.labelSmall,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: aesBannerColors.warning.bg,
    borderRadius: aesRadii.card,
    padding: aesSpacing.cardPadding,
    borderWidth: 1,
    borderColor: aesBannerColors.warning.border,
    borderLeftWidth: 4,
    borderLeftColor: aesBannerColors.warning.text,
    gap: aesSpacing.xs,
    ...aesShadows.card,
  },
  sectionHeader: {
    ...aesTypography.heading2,
    fontSize: 16,
    color: aesBannerColors.warning.text,
    marginBottom: aesSpacing.xs,
  },
  fieldLabel: {
    ...aesTypography.labelSmall,
    fontSize: 11,
    fontWeight: '700',
    color: aesBannerColors.warning.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    ...aesTypography.body,
    color: aesColors.textPrimary,
    marginBottom: aesSpacing.xs,
    lineHeight: 20,
  },
  separationNoticeBox: {
    marginTop: aesSpacing.xs,
    paddingTop: aesSpacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: aesBannerColors.warning.border,
  },
  separationNoticeText: {
    ...aesTypography.bodySmall,
    color: aesBannerColors.warning.text,
    fontStyle: 'italic',
    fontSize: 11,
  },
  inputSection: {
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    padding: aesSpacing.cardPadding,
    gap: aesSpacing.xs,
    ...aesShadows.card,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: aesSpacing.xs,
  },
  inputLabel: {
    ...aesTypography.label,
    color: aesColors.textPrimary,
    fontWeight: '700',
  },
  characterCount: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
    fontSize: 11,
  },
  textInput: {
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
    borderRadius: aesRadii.card,
    padding: aesSpacing.sm,
    fontSize: 14,
    color: aesColors.textPrimary,
    backgroundColor: aesColors.surfaceSubdued,
    minHeight: 120,
  },
  inlineError: {
    ...aesTypography.bodySmall,
    color: aesColors.banners.error.text,
    textAlign: 'center',
  },
  submitContainer: {
    marginTop: aesSpacing.xs,
  },
  errorText: {
    ...aesTypography.body,
    color: aesColors.banners.error.text,
    textAlign: 'center',
    marginBottom: aesSpacing.md,
  },
});

export default CorrectionResponseScreen;