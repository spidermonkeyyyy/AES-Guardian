/**
 * AES Guardian — Phase 2C.3.1
 * CorrectionResponseScreen
 *
 * Allows an exposed_professional to review an administrative correction request
 * and submit a structured clarification/response.
 *
 * Strictly enforces:
 * - Author role: exposed_professional only.
 * - Ownership: user must be the declaring professional.
 * - Non-destructive: original declaration remains completely immutable.
 * - Audit logging: CORRECTION_RESPONSE_SUBMITTED event logged.
 * - Tri-lingual support (FR/EN/AR).
 * - Synthetic demonstration context banner.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  canRespondToCorrection,
  SYNTHETIC_DEMO_CONTEXT,
  logAuditEvent,
  AdministrativeReview,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  correctionResponse: { declarationId: number; reviewId: number };
};

export const CorrectionResponseScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'correctionResponse'>>();
  const { declarationId, reviewId } = route.params;

  const userContext = SYNTHETIC_DEMO_CONTEXT;
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
      if (!isAuthorized) {
        setError(t('correction.unauthorized'));
        return;
      }
      const db = getDatabase();
      const request = await db.getLatestPendingCorrectionRequest(declarationId, userContext.userId!);
      if (!request) {
        // Fallback: load specific review by ID from history
        const history = await db.getDeclarationReviewHistory(declarationId);
        const match = history.find(r => r.id === reviewId);
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
            setSubmitting(true);
            setError(null);
            try {
              const db = getDatabase();
              await db.createCorrectionResponse({
                declaration_id: declarationId,
                review_id: correctionRequest?.id ?? reviewId,
                user_id: userContext.userId!,
                response_text: responseText.trim(),
              });

              await logAuditEvent({
                eventType: 'CORRECTION_RESPONSE_SUBMITTED',
                userId: userContext.userId!,
                entityType: 'correction_response',
                entityId: declarationId,
                description: `Correction response submitted for declaration #${declarationId}`,
              });

              Alert.alert(
                t('correction.successTitle'),
                t('correction.successMessage'),
                [{ text: 'OK', onPress: () => navigation.goBack() }],
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
  }, [responseText, declarationId, reviewId, correctionRequest, userContext.userId, navigation]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !correctionRequest) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadCorrectionRequest}
        >
          <Text style={styles.retryButtonText}>{t('reviewQueue.refresh')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* SYNTHETIC DEMO BANNER */}
      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>
          ⚠ DEMO — Contexte synthétique : {userContext.displayName} ({userContext.role})
        </Text>
      </View>

      <Text style={[styles.screenTitle, { color: colors.foreground }]}>
        {t('correction.screenTitle')}
      </Text>

      {/* Reviewer's Request Card */}
      {correctionRequest && (
        <View style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.sectionHeader}>{t('correction.requestHeader')}</Text>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            {t('correction.reasonLabel')}
          </Text>
          <Text style={[styles.fieldValue, { color: colors.foreground }]}>
            {correctionRequest.correction_reason || '—'}
          </Text>

          {correctionRequest.comments ? (
            <>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                {t('correction.commentsLabel')}
              </Text>
              <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                {correctionRequest.comments}
              </Text>
            </>
          ) : null}
        </View>
      )}

      {/* Response Input */}
      <View style={[styles.inputSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          {t('correction.inputLabel')}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          multiline
          numberOfLines={6}
          placeholder={t('correction.inputPlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          value={responseText}
          onChangeText={setResponseText}
          editable={!submitting}
          textAlignVertical="top"
        />
      </View>

      {error ? (
        <Text style={[styles.inlineError, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          submitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{t('correction.submitButton')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: spacing.md, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  demoBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: shapes.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  demoBannerText: {
    color: '#92400e',
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  screenTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  requestCard: {
    borderRadius: shapes.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    borderWidth: 1,
  },
  sectionHeader: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#d97706',
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  inputSection: {
    borderRadius: shapes.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: shapes.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.sm,
    minHeight: 120,
  },
  inlineError: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  submitButton: {
    borderRadius: shapes.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    borderRadius: shapes.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

export default CorrectionResponseScreen;
