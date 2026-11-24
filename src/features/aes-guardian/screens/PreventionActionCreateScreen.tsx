import AppTextInput from '../../../components/AppTextInput';
import AppText from '../../../components/AppText';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import {
  getDatabase,
  useDemoRoleStore,
  canManagePreventionActions,
  PreventionActionType,
  ContributingFactorCategory,
  PREVENTION_ACTION_TYPES,
  CONTRIBUTING_FACTOR_CATEGORIES,
  CreatePreventionActionInput,
  PreventionActionCreationUncertainError,
  CapaCreationOperation,
  PreventionActionDetail,
} from '../../../core';
import {
  t,
  useLocale,
  useLayoutDirection,
  getLayoutRowDirection,
  getLayoutTextAlign,
} from '../../../localization';
import { aesColors, aesSpacing, aesRadii, aesTypography } from '../../../theme/tokens';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/routes';
import {
  AesScreenContainer,
  AesScreenHeader,
  AesCard,
  AesButton,
  AesOptionCard,
} from '../components';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const PreventionActionCreateScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const locale = useLocale();
  const layoutDirection = useLayoutDirection();
  const rtl = layoutDirection === 'rtl';
  const rowDirection = getLayoutRowDirection(layoutDirection);
  const textAlign = getLayoutTextAlign(layoutDirection);
  const styles = createStyles(rtl);
  const { activeContext } = useDemoRoleStore();
  const isAuthorized = canManagePreventionActions(activeContext);
  const userId = activeContext.userId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState<PreventionActionType>('corrective');
  const [factor, setFactor] = useState<ContributingFactorCategory>('device_safety_design');
  const [rationale, setRationale] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [survRef, setSurvRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [confirmedAbsent, setConfirmedAbsent] = useState(false);
  const [operationId, setOperationId] = useState<string | null>(null);
  const [operationIntent, setOperationIntent] = useState<'new' | 'retry' | null>(null);
  const [recoveryConflict, setRecoveryConflict] = useState(false);
  const [recoveredCommittedAction, setRecoveredCommittedAction] =
    useState<PreventionActionDetail | null>(null);
  const [presentedAction, setPresentedAction] = useState<PreventionActionDetail | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledgementError, setAcknowledgementError] = useState(false);
  const [validation, setValidation] = useState<string[]>([]);
  const submissionLock = useRef(false);
  const acknowledgementLock = useRef(false);
  const creationReference = useRef<string | null>(null);
  const operationPayload = useRef<CreatePreventionActionInput | null>(null);

  const restoreOperationPayload = (operation: CapaCreationOperation) => {
    if (operation.created_by_user_id !== userId) return null;
    return parseOperationPayload(operation.payload_json);
  };

  const validate = (): string[] => {
    const messages: string[] = [];
    if (title.trim().length < 3) {
      messages.push(t('prevention.create.validation.title', locale));
    }
    if (description.trim().length < 5) {
      messages.push(t('prevention.create.validation.description', locale));
    }
    if (rationale.trim().length < 5) {
      messages.push(t('prevention.create.validation.rationale', locale));
    }
    if (targetDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
      messages.push(t('prevention.create.validation.targetDate', locale));
    }
    if (survRef.trim() && /^AES-\d{4}-\d+/i.test(survRef.trim())) {
      messages.push(t('prevention.create.validation.surveillanceReference', locale));
    }
    return messages;
  };

  const createInput = (): CreatePreventionActionInput => ({
    title: title.trim(),
    description: description.trim(),
    action_type: actionType,
    contributing_factor: factor,
    rationale: rationale.trim(),
    target_date: targetDate.trim() || undefined,
    surveillance_reference: survRef.trim() || undefined,
  });

  useEffect(() => {
    if (!isAuthorized || !userId) return;
    let cancelled = false;
    const db = getDatabase();
    Promise.all([
      db.listPendingCapaCreationOperations(userId),
      db.listUnacknowledgedCommittedCapaCreationOperations(userId),
    ])
      .then(async ([pending, committed]) => {
        if (cancelled) return;
        if (pending.length + committed.length > 1) {
          setRecoveryConflict(true);
          setError(true);
          return;
        }
        if (pending.length === 1) {
          const operation = pending[0];
          const payload = restoreOperationPayload(operation);
          if (!payload || !operation.reference_code) {
            setError(true);
            setRecoveryConflict(true);
            return;
          }
          operationPayload.current = payload;
          setTitle(payload.title);
          setDescription(payload.description);
          setActionType(payload.action_type);
          setFactor(payload.contributing_factor);
          setRationale(payload.rationale);
          setTargetDate(payload.target_date ?? '');
          setSurvRef(payload.surveillance_reference ?? '');
          setOperationId(operation.operation_id);
          setOperationIntent('retry');
          creationReference.current = operation.reference_code;
        } else if (committed.length === 1) {
          const operation = committed[0];
          const payload = restoreOperationPayload(operation);
          if (!payload || !operation.reference_code) {
            setRecoveryConflict(true);
            setError(true);
            return;
          }
          const action = await db.reconcileCapaCreationOperation(
            userId,
            operation.operation_id,
            payload,
          );
          if (!cancelled && action) {
            operationPayload.current = payload;
            creationReference.current = operation.reference_code;
            setOperationId(operation.operation_id);
            setOperationIntent('retry');
            setRecoveredCommittedAction(action);
            setPresentedAction(action);
          } else if (!cancelled) {
            setRecoveryConflict(true);
            setError(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setRecoveryConflict(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthorized, userId]);

  const handleConfirmPresentation = async () => {
    if (
      !presentedAction ||
      !operationId ||
      !isAuthorized ||
      !userId ||
      acknowledging ||
      acknowledgementLock.current
    ) return;
    acknowledgementLock.current = true;
    setAcknowledging(true);
    setAcknowledgementError(false);
    try {
      const acknowledged = await getDatabase().acknowledgeCapaCreationOperation(userId, operationId);
      if (
        acknowledged.operation_id !== operationId ||
        acknowledged.created_by_user_id !== userId ||
        acknowledged.status !== 'committed' ||
        !acknowledged.acknowledged_at
      ) {
        throw new Error('CAPA operation acknowledgement was not verified.');
      }
      setPresentedAction(null);
      setRecoveredCommittedAction(null);
      setOperationId(null);
      setOperationIntent(null);
      creationReference.current = null;
      operationPayload.current = null;
      setAcknowledgementError(false);
      navigation.goBack();
    } catch {
      setAcknowledgementError(true);
    } finally {
      acknowledgementLock.current = false;
      setAcknowledging(false);
    }
  };

  const handleSubmit = async () => {
    if (submissionLock.current || uncertain || recoveryConflict) return;
    if (!isAuthorized || !userId) {
      setError(true);
      return;
    }

    const validationMessages = validate();
    if (validationMessages.length > 0) {
      setValidation(validationMessages);
      setError(false);
      return;
    }

    setValidation([]);
    setError(false);
    setConfirmedAbsent(false);
    submissionLock.current = true;
    setSubmitting(true);
    let reservationAttempted = false;
    try {
      const db = getDatabase();
      let activeOperationId = operationId;
      let payload = operationPayload.current;
      let operationReference = creationReference.current;
      let stageIntent: 'new' | 'retry' = operationIntent ?? 'new';
      if (!activeOperationId) {
        payload = createInput();
        activeOperationId = db.createCapaCreationOperationId();
        reservationAttempted = true;
        const reserved = await db.reserveCapaCreationOperation(
          userId,
          payload,
          activeOperationId,
          undefined,
          'new',
        );
        if (
          reserved.operation_id !== activeOperationId ||
          reserved.created_by_user_id !== userId ||
          reserved.status !== 'pending' ||
          !reserved.reference_code ||
          !payloadMatchesOperation(reserved.payload_json, payload)
        ) {
          throw new Error('CAPA operation reservation could not be verified.');
        }
        operationReference = reserved.reference_code;
        operationPayload.current = payload;
        creationReference.current = reserved.reference_code;
        setOperationId(activeOperationId);
        setOperationIntent('new');
        stageIntent = 'new';
      }
      if (!activeOperationId || !payload || !operationReference) {
        throw new Error('A verified CAPA reservation is required before creation.');
      }
      const action = await db.createPreventionActionForOperation(
        userId,
        payload,
        activeOperationId,
        operationReference,
        stageIntent,
      );
      setPresentedAction(action);
    } catch (caught) {
      setError(true);
      if (reservationAttempted && !operationPayload.current) {
        setRecoveryConflict(true);
      }
      if (operationId || (operationPayload.current && creationReference.current)) {
        setOperationIntent('retry');
      }
      if (caught instanceof PreventionActionCreationUncertainError) {
        if (caught.operationId && caught.operationId === operationId) {
          setOperationId(caught.operationId);
        }
        if (operationPayload.current && creationReference.current) {
          setUncertain(true);
          setOperationIntent('retry');
        } else {
          setRecoveryConflict(true);
        }
      }
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  const handleReconcile = async () => {
    if (
      submissionLock.current ||
      !uncertain ||
      !isAuthorized ||
      !userId ||
      !operationId ||
      !operationPayload.current
    ) return;
    submissionLock.current = true;
    setReconciling(true);
    try {
      const db = getDatabase();
      const action = await db.reconcileCapaCreationOperation(
        userId,
        operationId,
        operationPayload.current,
      );
      if (action) {
        setPresentedAction(action);
        setUncertain(false);
        setError(false);
        return;
      }
      setUncertain(false);
      setError(true);
      setConfirmedAbsent(true);
    } catch {
      setError(true);
    } finally {
      submissionLock.current = false;
      setReconciling(false);
    }
  };

  return (
    <AesScreenContainer
      scrollable
      testID="prevention-create-screen"
      contentContainerStyle={styles.content}
    >
      <AesScreenHeader
        title={t('prevention.create.title', locale)}
        subtitle={t('prevention.create.subtitle', locale)}
        overline={t('workspace.module.preventionCreate', locale)}
        testID="prevention-create-header"
        rightElement={
          <TouchableOpacity
            testID="prevention-create-back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('app.back', locale)}
          >
            <AppIcon
              name="back-chevron"
              size={24}
              color={aesColors.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      {!isAuthorized ? (
        <AesCard testID="prevention-create-denied" style={styles.deniedCard}>
          <AppText style={styles.deniedText}>{t('prevention.create.denied', locale)}</AppText>
        </AesCard>
      ) : (
        <View testID="prevention-create-content" style={styles.form}>
          <AesCard style={styles.sectionCard}>
            <AppText style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.actionTitle', locale)}</AppText>
            <AppTextInput
              testID="prevention-create-title-input"
              accessibilityLabel={t('prevention.create.actionTitle', locale)}
              editable={!uncertain && !operationId}
              style={[styles.input, rtl && styles.rtlText, { textAlign: 'left', writingDirection: 'ltr' }]}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setValidation([]);
              }}
              placeholder={t('prevention.create.placeholder.title', locale)}
              placeholderTextColor={aesColors.textTertiary}
              textAlign={textAlign}
            />

            <AppText style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.description', locale)}</AppText>
            <AppTextInput
              testID="prevention-create-description-input"
              accessibilityLabel={t('prevention.create.description', locale)}
              editable={!uncertain && !operationId}
              style={[styles.input, styles.multiline, rtl && styles.rtlText]}
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                setValidation([]);
              }}
              placeholder={t('prevention.create.placeholder.description', locale)}
              placeholderTextColor={aesColors.textTertiary}
              multiline
              numberOfLines={4}
              textAlign={textAlign}
              textAlignVertical="top"
            />
          </AesCard>

          <AesCard style={styles.sectionCard}>
            <AppText style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.action_type', locale)}</AppText>
            <View style={[styles.optionRow, { flexDirection: rowDirection }]}>
              {PREVENTION_ACTION_TYPES.map((type) => (
                <AesOptionCard
                  key={type}
                  testID={`prevention-create-action-type-${type}`}
                  title={t(`prevention.create.${type}`, locale)}
                  selected={actionType === type}
                  disabled={uncertain || !!operationId}
                  onPress={() => setActionType(type)}
                  style={styles.optionCard}
                />
              ))}
            </View>
          </AesCard>

          <AesCard style={styles.sectionCard}>
            <AppText style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.factor.label', locale)}</AppText>
            <View style={[styles.factorDisclaimer, { flexDirection: rowDirection, alignItems: 'flex-start', gap: aesSpacing.xs }]}>
              <AppIcon name="warning" size={18} color={aesColors.banners.warning.text} />
              <AppText style={[styles.factorDisclaimerText, rtl && styles.rtlText, { flex: 1 }]}>
                {t('prevention.create.factor.disclaimer', locale)}
              </AppText>
            </View>
            <View style={[styles.factorGrid, { flexDirection: rowDirection }]}>
              {CONTRIBUTING_FACTOR_CATEGORIES.map((category) => (
                <AesOptionCard
                  key={category}
                  testID={`prevention-create-factor-${category}`}
                  title={t(`prevention.factor.${category}`, locale)}
                  selected={factor === category}
                  disabled={uncertain || !!operationId}
                  onPress={() => setFactor(category)}
                  variant="radio"
                  style={styles.factorOption}
                />
              ))}
            </View>
          </AesCard>

          <AesCard style={styles.sectionCard}>
            <AppText style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.rationale', locale)}</AppText>
            <AppTextInput
              testID="prevention-create-rationale-input"
              accessibilityLabel={t('prevention.create.rationale', locale)}
              editable={!uncertain && !operationId}
              style={[styles.input, styles.multiline, rtl && styles.rtlText]}
              value={rationale}
              onChangeText={(value) => {
                setRationale(value);
                setValidation([]);
              }}
              placeholder={t('prevention.create.placeholder.rationale', locale)}
              placeholderTextColor={aesColors.textTertiary}
              multiline
              numberOfLines={3}
              textAlign={textAlign}
              textAlignVertical="top"
            />

            <AppText style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.target_date', locale)}</AppText>
            <AppTextInput
              testID="prevention-create-target-date-input"
              accessibilityLabel={t('prevention.create.target_date', locale)}
              editable={!uncertain && !operationId}
              style={[styles.input, rtl && styles.rtlText]}
              value={targetDate}
              onChangeText={(value) => {
                setTargetDate(value);
                setValidation([]);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={aesColors.textTertiary}
              textAlign="left"
            />

            <AppText style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.surveillance_reference', locale)}</AppText>
            <AppTextInput
              testID="prevention-create-surveillance-reference-input"
              accessibilityLabel={t('prevention.create.surveillance_reference', locale)}
              editable={!uncertain && !operationId}
              style={[styles.input, rtl && styles.rtlText, { textAlign: 'left', writingDirection: 'ltr' }]}
              value={survRef}
              onChangeText={(value) => {
                setSurvRef(value);
                setValidation([]);
              }}
              placeholder={t('prevention.create.placeholder.surveillanceReference', locale)}
              placeholderTextColor={aesColors.textTertiary}
              textAlign="left"
            />
          </AesCard>

          {presentedAction ? (
            <AesCard testID="prevention-create-result" style={styles.errorCard}>
              <AppText style={[styles.errorText, rtl && styles.rtlText]}>
                {t('prevention.create.result.title', locale)}
              </AppText>
              {recoveredCommittedAction ? (
                <AppText style={[styles.errorText, rtl && styles.rtlText]}>
                  {t('prevention.create.result.recovery', locale)}
                </AppText>
              ) : null}
              <AppText style={[styles.errorText, rtl && styles.rtlText]}>
                {t('prevention.create.reference', locale)}: {presentedAction.reference_code}
              </AppText>
              {acknowledgementError ? (
                <AppText
                  testID="prevention-create-acknowledgement-error"
                  style={[styles.errorText, rtl && styles.rtlText]}
                >
                  {t('prevention.create.acknowledgement.error', locale)}
                </AppText>
              ) : null}
              <AesButton
                testID="prevention-create-confirm-presentation"
                title={
                  acknowledging
                    ? t('prevention.create.acknowledgement.inProgress', locale)
                    : t('prevention.create.acknowledgement.confirm', locale)
                }
                accessibilityLabel={t('prevention.create.acknowledgement.confirm', locale)}
                onPress={handleConfirmPresentation}
                variant="green"
                loading={acknowledging}
                disabled={acknowledging}
              />
            </AesCard>
          ) : null}

          {validation.length > 0 ? (
            <AesCard testID="prevention-create-validation" style={styles.errorCard}>
              {validation.map((message) => (
                <AppText key={message} style={[styles.errorText, rtl && styles.rtlText]}>{message}</AppText>
              ))}
            </AesCard>
          ) : null}

          {error ? (
            <AesCard testID="prevention-create-error" style={styles.errorCard}>
              <AppText style={[styles.errorText, rtl && styles.rtlText]}>
                {recoveryConflict
                  ? t('prevention.create.error', locale)
                  : uncertain
                  ? t('prevention.create.uncertain', locale)
                  : confirmedAbsent
                    ? t('prevention.create.reconcileAbsent', locale)
                    : t('prevention.create.error', locale)}
              </AppText>
              {uncertain ? (
                <>
                  <AppText style={[styles.errorText, rtl && styles.rtlText]}>
                    {t('prevention.create.reference', locale)}: {creationReference.current}
                  </AppText>
                  <AesButton
                    testID="prevention-create-reconcile"
                    title={t('prevention.create.reconcile', locale)}
                    onPress={handleReconcile}
                    variant="outline"
                    loading={reconciling}
                    disabled={submitting || reconciling}
                  />
                </>
              ) : recoveryConflict ? null : (
                <AesButton
                  testID="prevention-create-retry"
                  title={t('prevention.create.retry', locale)}
                  onPress={handleSubmit}
                  variant="outline"
                  disabled={submitting || reconciling}
                />
              )}
            </AesCard>
          ) : null}

          {submitting ? (
            <View testID="prevention-create-loading" style={styles.loadingRow}>
              <ActivityIndicator color={aesColors.accentGreen} />
              <AppText style={[styles.loadingText, rtl && styles.rtlText]}>
                {t('prevention.create.submitting', locale)}
              </AppText>
            </View>
          ) : null}

          <AesButton
            testID="prevention-create-submit"
            title={t('prevention.create.submit', locale)}
            onPress={handleSubmit}
            variant="green"
            loading={submitting}
            disabled={submitting || reconciling || uncertain || recoveryConflict || !!presentedAction}
          />
        </View>
      )}
    </AesScreenContainer>
  );
};

function parseOperationPayload(payloadJson: string): CreatePreventionActionInput | null {
  let value: unknown;
  try {
    value = JSON.parse(payloadJson);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object') return null;

  const payload = value as Record<string, unknown>;
  if (
    typeof payload.title !== 'string' ||
    typeof payload.description !== 'string' ||
    typeof payload.rationale !== 'string' ||
    !isPreventionActionType(payload.action_type) ||
    !isContributingFactorCategory(payload.contributing_factor) ||
    (payload.target_date !== undefined &&
      payload.target_date !== null &&
      typeof payload.target_date !== 'string') ||
    (payload.surveillance_reference !== undefined &&
      payload.surveillance_reference !== null &&
      typeof payload.surveillance_reference !== 'string')
  ) {
    return null;
  }

  return {
    title: payload.title,
    description: payload.description,
    action_type: payload.action_type,
    contributing_factor: payload.contributing_factor,
    rationale: payload.rationale,
    target_date: typeof payload.target_date === 'string' ? payload.target_date : undefined,
    surveillance_reference:
      typeof payload.surveillance_reference === 'string'
        ? payload.surveillance_reference
        : undefined,
  };
}

function isPreventionActionType(value: unknown): value is PreventionActionType {
  return typeof value === 'string' &&
    PREVENTION_ACTION_TYPES.some((item) => item === value);
}

function isContributingFactorCategory(
  value: unknown,
): value is ContributingFactorCategory {
  return typeof value === 'string' &&
    CONTRIBUTING_FACTOR_CATEGORIES.some((item) => item === value);
}

function payloadMatchesOperation(
  payloadJson: string,
  expected: CreatePreventionActionInput,
): boolean {
  const actual = parseOperationPayload(payloadJson);
  return !!actual &&
    actual.title === expected.title &&
    actual.description === expected.description &&
    actual.action_type === expected.action_type &&
    actual.contributing_factor === expected.contributing_factor &&
    actual.rationale === expected.rationale &&
    (actual.target_date ?? null) === (expected.target_date ?? null) &&
    (actual.surveillance_reference ?? null) === (expected.surveillance_reference ?? null);
}

function createStyles(rtl: boolean) {
  return StyleSheet.create({
    content: { paddingHorizontal: 0 },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: aesRadii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: aesColors.surfaceSubdued,
    },
    deniedCard: { marginHorizontal: aesSpacing.screenHorizontal },
    deniedText: {
      ...aesTypography.body,
      color: aesColors.textPrimary,
      textAlign: rtl ? 'right' : 'left',
    },
    form: { paddingHorizontal: aesSpacing.screenHorizontal, paddingBottom: aesSpacing['2xl'] },
    sectionCard: { marginBottom: aesSpacing.sm },
    label: {
      ...aesTypography.label,
      color: aesColors.textPrimary,
      marginTop: aesSpacing.xs,
      marginBottom: aesSpacing.sm,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: aesColors.borderMedium,
      borderRadius: aesRadii.input,
      paddingHorizontal: aesSpacing.md,
      paddingVertical: aesSpacing.sm,
      color: aesColors.textPrimary,
      backgroundColor: aesColors.surface,
      marginBottom: aesSpacing.md,
    },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    optionRow: { flexDirection: rtl ? 'row-reverse' : 'row', gap: aesSpacing.sm },
    optionCard: { flex: 1, minHeight: 48 },
    factorDisclaimer: {
      backgroundColor: aesColors.banners.warning.bg,
      padding: aesSpacing.sm,
      borderRadius: aesRadii.badge,
      marginBottom: aesSpacing.sm,
    },
    factorDisclaimerText: {
      ...aesTypography.bodySmall,
      color: aesColors.banners.warning.text,
    },
    factorGrid: { flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap' },
    factorOption: { width: '48%', minHeight: 48, marginHorizontal: aesSpacing.xs },
    errorCard: { borderColor: aesColors.banners.error.border },
    errorText: {
      ...aesTypography.bodySmall,
      color: aesColors.banners.error.text,
      marginBottom: aesSpacing.sm,
      textAlign: rtl ? 'right' : 'left',
    },
    loadingRow: {
      minHeight: 48,
      flexDirection: rtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: aesSpacing.sm,
      marginBottom: aesSpacing.sm,
    },
    loadingText: {
      ...aesTypography.body,
      color: aesColors.textSecondary,
      textAlign: rtl ? 'right' : 'left',
    },
    rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  });
}
