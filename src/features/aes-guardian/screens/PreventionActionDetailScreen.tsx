import AppTextInput from '../../../components/AppTextInput';
import AppText from '../../../components/AppText';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  canManagePreventionActions,
  canViewPreventionActions,
  getDatabase,
  PreventionActionDetail,
  PreventionActionStatus,
  useDemoRoleStore,
  isValidPreventionTransition,
} from '../../../core';
import {
  t,
  useLocale,
  useLayoutDirection,
  getLayoutRowDirection,
  getLayoutTextAlign,
} from '../../../localization';
import {
  aesColors,
  aesRadii,
  aesSpacing,
  aesTypography,
} from '../../../theme/tokens';
import { RootStackParamList } from '../../../navigation/routes';
import { formatPreventionDate } from '../prevention-date-format';
import {
  AesButton,
  AesCard,
  AesRoundArrowButton,
  AesScreenContainer,
  AesScreenHeader,
  AesStatusBadge,
} from '../components';

type RouteProps = RouteProp<RootStackParamList, 'preventionActionDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const PreventionActionDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const locale = useLocale();
  const layoutDirection = useLayoutDirection();
  const rtl = layoutDirection === 'rtl';
  const rowDirection = getLayoutRowDirection(layoutDirection);
  const textAlign = getLayoutTextAlign(layoutDirection);
  const styles = createStyles(rtl);
  const { activeContext } = useDemoRoleStore();
  const canView = canViewPreventionActions(activeContext);
  const canManage = canManagePreventionActions(activeContext);
  const userId = activeContext.userId;
  const { actionId } = route.params;

  const [action, setAction] = useState<PreventionActionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [transitionStatus, setTransitionStatus] = useState<PreventionActionStatus | null>(null);
  const [transitionFromStatus, setTransitionFromStatus] = useState<PreventionActionStatus | null>(null);
  const [transitionNote, setTransitionNote] = useState('');
  const [transitionError, setTransitionError] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const requestId = useRef(0);
  const transitionLock = useRef(false);

  const loadAction = useCallback(async (): Promise<PreventionActionDetail | null> => {
    const request = ++requestId.current;
    if (!userId || !canView) {
      setAction(null);
      setLoading(false);
      setLoadError(false);
      return null;
    }

    setAction(null);
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getDatabase().getPreventionActionById(userId, actionId);
      const current = useDemoRoleStore.getState().activeContext;
      if (
        request !== requestId.current ||
        current.userId !== userId ||
        !canViewPreventionActions(current)
      ) {
        return null;
      }
      setAction(data);
      return data;
    } catch {
      if (request === requestId.current) {
        setLoadError(true);
      }
      return null;
    } finally {
      if (request === requestId.current) {
        setLoading(false);
      }
    }
  }, [actionId, canView, userId]);

  useEffect(() => {
    void loadAction();
    return () => {
      requestId.current += 1;
    };
  }, [loadAction]);

  const closeTransition = () => {
    setTransitionStatus(null);
    setTransitionFromStatus(null);
    setTransitionNote('');
    setTransitionError(false);
    setValidationError(false);
  };

  const performTransition = async (
    status: PreventionActionStatus,
    note?: string,
    fromStatus = action?.status,
  ) => {
    if (transitionLock.current || !fromStatus) return;
    const current = useDemoRoleStore.getState();
    if (!current.activeContext.userId || !canManagePreventionActions(current.activeContext)) {
      setTransitionError(true);
      return;
    }
    if (!isValidPreventionTransition(fromStatus, status)) return;
    if (status === 'completed' && (!note?.trim() || note.trim().length < 3)) {
      setValidationError(true);
      return;
    }

    transitionLock.current = true;
    setTransitioning(true);
    setTransitionError(false);
    setValidationError(false);
    setTransitionStatus(status);
    setTransitionFromStatus(fromStatus);
    try {
      const updated = await getDatabase().updatePreventionActionStatus(
        current.activeContext.userId,
        actionId,
        status,
        note?.trim() || undefined,
      );
      if (useDemoRoleStore.getState().activeContext.userId === current.activeContext.userId) {
        setAction(updated);
        closeTransition();
      }
    } catch {
      setTransitionError(true);
    } finally {
      transitionLock.current = false;
      setTransitioning(false);
    }
  };

  const confirmTransition = () => {
    if (!transitionStatus) return;
    const note = transitionStatus === 'completed' ? transitionNote.trim() : transitionNote.trim() || undefined;
    void performTransition(transitionStatus, note, transitionFromStatus ?? action?.status);
  };

  const retryTransition = async () => {
    const target = transitionStatus;
    const original = transitionFromStatus;
    setTransitionError(false);
    const currentAction = await loadAction();
    if (!currentAction || !target) {
      setTransitionError(true);
      return;
    }
    if (
      currentAction.status === target ||
      (original !== null && currentAction.status !== original &&
        !isValidPreventionTransition(currentAction.status, target))
    ) {
      closeTransition();
      return;
    }
    if (original !== null && currentAction.status === original) {
      setTransitionError(false);
    }
  };

  const openTransition = (status: PreventionActionStatus) => {
    setTransitionStatus(status);
    setTransitionFromStatus(action?.status ?? null);
    setTransitionNote('');
    setTransitionError(false);
    setValidationError(false);
  };

  const factorLabel = (factor: PreventionActionDetail['contributing_factor']) => {
    switch (factor) {
      case 'device_safety_design':
        return t('prevention.factor.device_safety_design', locale);
      case 'procedure_compliance':
        return t('prevention.factor.procedure_compliance', locale);
      case 'workload_fatigue':
        return t('prevention.factor.workload_fatigue', locale);
      case 'waste_disposal_container':
        return t('prevention.factor.waste_disposal_container', locale);
      case 'protective_equipment':
        return t('prevention.factor.protective_equipment', locale);
      case 'training_supervision':
        return t('prevention.factor.training_supervision', locale);
      case 'environment_workspace':
        return t('prevention.factor.environment_workspace', locale);
      case 'other_factor':
        return t('prevention.factor.other_factor', locale);
    }
  };

  const InfoRow: React.FC<{ label: string; value?: string | null; testID: string }> = ({
    label,
    value,
    testID,
  }) => {
    if (!value) return null;
    const technical =
      testID === 'prevention-detail-reference' ||
      testID === 'prevention-detail-surveillance-reference' ||
      testID === 'prevention-detail-target-date' ||
      testID === 'prevention-detail-created-at' ||
      testID === 'prevention-detail-updated-at' ||
      testID === 'prevention-detail-completed-at';
    return (
      <View
        style={[styles.infoRow, { flexDirection: rowDirection }]}
        testID={testID}
      >
        <AppText style={[styles.infoLabel, { textAlign }]}>{label}</AppText>
        <AppText
          style={[
            styles.infoValue,
            technical
              ? { textAlign: 'left', writingDirection: 'ltr' }
              : { textAlign },
          ]}
        >
          {value}
        </AppText>
      </View>
    );
  };

  return (
    <AesScreenContainer
      scrollable
      testID="prevention-detail-screen"
      contentContainerStyle={styles.content}
    >
      <AesScreenHeader
        title={t('prevention.detail.title', locale)}
        subtitle={t('prevention.detail.subtitle', locale)}
        overline={t('prevention.overview.title', locale)}
        rightElement={
          <AesRoundArrowButton
            direction="back"
            testID="prevention-detail-back"
            onPress={() => navigation.goBack()}
            accessibilityLabel={t('app.back', locale)}
          />
        }
      />

      {!canView ? (
        <AesCard testID="prevention-detail-denied" style={styles.outerCard}>
          <AppText style={[styles.bodyText, rtl && styles.rtlText]}>
            {t('prevention.unauthorized', locale)}
          </AppText>
        </AesCard>
      ) : loading ? (
        <View testID="prevention-detail-loading" style={styles.stateContainer}>
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
          <AppText style={[styles.bodyText, rtl && styles.rtlText]}>{t('app.loading', locale)}</AppText>
        </View>
      ) : loadError ? (
        <AesCard testID="prevention-detail-error" style={styles.outerCard}>
          <AppText style={[styles.errorText, rtl && styles.rtlText]}>
            {t('prevention.detail.loadError', locale)}
          </AppText>
          <AesButton
            testID="prevention-detail-retry"
            title={t('prevention.detail.retry', locale)}
            onPress={() => void loadAction()}
            variant="outline"
          />
        </AesCard>
      ) : !action ? (
        <AesCard testID="prevention-detail-not-found" style={styles.outerCard}>
          <AppText style={[styles.bodyText, rtl && styles.rtlText]}>
            {t('prevention.detail.notFound', locale)}
          </AppText>
        </AesCard>
      ) : (
        <View style={styles.contentBody}>
          <AesCard testID="prevention-detail-summary" style={styles.summaryCard}>
            <View style={[styles.referenceRow, { flexDirection: rowDirection }]}>
              <AppText
                testID="prevention-detail-reference"
                style={[styles.reference, { textAlign: 'left', writingDirection: 'ltr' }]}
              >
                {action.reference_code}
              </AppText>
              <AesStatusBadge
                status={action.status}
                domain="capa"
                testID="prevention-detail-status"
              />
            </View>
            <AppText
              testID="prevention-detail-title"
              style={[styles.title, rtl && styles.rtlText]}
            >
              {action.title}
            </AppText>
            <AppText style={[styles.description, rtl && styles.rtlText]}>{action.description}</AppText>
          </AesCard>

          <AesCard style={styles.detailCard}>
            <AppText style={[styles.sectionTitle, rtl && styles.rtlText]}>
              {t('prevention.detail.actionInformation', locale)}
            </AppText>
            <InfoRow
              testID="prevention-detail-type"
              label={t('prevention.create.action_type', locale)}
              value={t(
                action.action_type === 'corrective'
                  ? 'prevention.detail.type.corrective'
                  : 'prevention.detail.type.preventive',
                locale,
              )}
            />
            <InfoRow
              testID="prevention-detail-factor"
              label={t('prevention.detail.factor', locale)}
              value={factorLabel(action.contributing_factor)}
            />
            <InfoRow
              testID="prevention-detail-rationale"
              label={t('prevention.detail.rationale', locale)}
              value={action.rationale}
            />
            <InfoRow
              testID="prevention-detail-surveillance-reference"
              label={t('prevention.create.surveillance_reference', locale)}
              value={action.surveillance_reference}
            />
            <InfoRow
              testID="prevention-detail-target-date"
              label={t('prevention.detail.targetDate', locale)}
              value={formatPreventionDate(action.target_date, locale)}
            />
          </AesCard>

          <AesCard style={styles.detailCard}>
            <AppText style={[styles.sectionTitle, rtl && styles.rtlText]}>
              {t('prevention.detail.recordInformation', locale)}
            </AppText>
            <InfoRow
              testID="prevention-detail-created-at"
              label={t('prevention.detail.createdAt', locale)}
              value={formatPreventionDate(action.created_at, locale, true)}
            />
            <InfoRow
              testID="prevention-detail-updated-at"
              label={t('prevention.detail.updatedAt', locale)}
              value={formatPreventionDate(action.updated_at, locale, true)}
            />
            <InfoRow
              testID="prevention-detail-completed-at"
              label={t('prevention.detail.completedAt', locale)}
              value={formatPreventionDate(action.completed_at, locale, true)}
            />
            <InfoRow
              testID="prevention-detail-completion-notes"
              label={t('prevention.detail.completionNotes', locale)}
              value={action.completion_notes}
            />
          </AesCard>

          {canManage ? (
            <AesCard testID="prevention-detail-actions" style={styles.detailCard}>
              <AppText style={[styles.sectionTitle, rtl && styles.rtlText]}>
                {t('prevention.detail.lifecycleActions', locale)}
              </AppText>
              <View style={[styles.actionRow, { flexDirection: rowDirection }]}>
                {isValidPreventionTransition(action.status, 'in_progress') ? (
                  <AesButton
                    testID="prevention-detail-start"
                    title={t('prevention.detail.start_action', locale)}
                    onPress={() => void performTransition('in_progress')}
                    variant="green"
                    loading={transitioning && transitionStatus === 'in_progress'}
                    disabled={transitioning}
                    style={styles.actionButton}
                  />
                ) : null}
                {isValidPreventionTransition(action.status, 'completed') ? (
                  <AesButton
                    testID="prevention-detail-complete"
                    title={t('prevention.detail.complete_action', locale)}
                    onPress={() => openTransition('completed')}
                    variant="primary"
                    disabled={transitioning}
                    style={styles.actionButton}
                  />
                ) : null}
                {isValidPreventionTransition(action.status, 'cancelled') ? (
                  <AesButton
                    testID="prevention-detail-cancel"
                    title={t('prevention.detail.cancel_action', locale)}
                    onPress={() => openTransition('cancelled')}
                    variant="danger"
                    disabled={transitioning}
                    style={styles.actionButton}
                  />
                ) : null}
              </View>
              {transitionError ? (
                <View testID="prevention-detail-transition-error" style={styles.errorBanner}>
                  <AppText style={[styles.errorText, rtl && styles.rtlText]}>
                    {t('prevention.detail.transitionError', locale)}
                  </AppText>
                  <AesButton
                    testID="prevention-detail-transition-retry"
                    title={t('prevention.detail.refreshRetry', locale)}
                    onPress={() => void retryTransition()}
                    variant="outline"
                    disabled={transitioning}
                  />
                </View>
              ) : null}
              {transitionStatus === 'completed' || transitionStatus === 'cancelled' ? (
                <View testID="prevention-detail-transition-panel" style={styles.transitionPanel}>
                  <AppText style={[styles.panelTitle, rtl && styles.rtlText]}>
                    {transitionStatus === 'completed'
                      ? t('prevention.detail.completion_note_prompt', locale)
                      : t('prevention.detail.cancelConfirmation', locale)}
                  </AppText>
                  <AppText style={[styles.fieldLabel, rtl && styles.rtlText]}>
                    {transitionStatus === 'completed'
                      ? t('prevention.detail.completionNoteLabel', locale)
                      : t('prevention.detail.cancelNoteLabel', locale)}
                  </AppText>
                  <AppTextInput
                    testID={
                      transitionStatus === 'completed'
                        ? 'prevention-detail-completion-note'
                        : 'prevention-detail-cancel-note'
                    }
                    style={[styles.noteInput, rtl && styles.rtlText]}
                    value={transitionNote}
                    onChangeText={(value) => {
                      setTransitionNote(value);
                      setValidationError(false);
                    }}
                    multiline
                    textAlign={rtl ? 'right' : 'left'}
                    textAlignVertical="top"
                    accessibilityLabel={
                      transitionStatus === 'completed'
                        ? t('prevention.detail.completionNoteLabel', locale)
                        : t('prevention.detail.cancelNoteLabel', locale)
                    }
                  />
                  {validationError ? (
                    <AppText testID="prevention-detail-transition-validation" style={styles.errorText}>
                      {t('prevention.detail.validation.completionNote', locale)}
                    </AppText>
                  ) : null}
                  <View style={[styles.actionRow, { flexDirection: rowDirection }]}>
                    <AesButton
                      testID="prevention-detail-transition-confirm"
                      title={
                        transitionStatus === 'completed'
                          ? t('prevention.detail.complete_action', locale)
                          : t('prevention.detail.confirmCancellation', locale)
                      }
                      onPress={confirmTransition}
                      variant={transitionStatus === 'completed' ? 'green' : 'danger'}
                      loading={transitioning}
                      disabled={transitioning}
                      style={styles.actionButton}
                    />
                    <AesButton
                      testID="prevention-detail-transition-dismiss"
                      title={t('prevention.detail.keepAction', locale)}
                      onPress={closeTransition}
                      variant="outline"
                      disabled={transitioning}
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              ) : null}
            </AesCard>
          ) : null}

          <AesCard style={styles.detailCard}>
            <AppText style={[styles.sectionTitle, rtl && styles.rtlText]}>
              {t('prevention.detail.audit_history', locale)}
            </AppText>
            {action.audit_history.length === 0 ? (
              <AppText style={[styles.bodyText, rtl && styles.rtlText]}>
                {t('prevention.detail.auditEmpty', locale)}
              </AppText>
            ) : (
              action.audit_history.map((event) => (
                <View key={event.id} style={[styles.auditRow, { flexDirection: rowDirection }]}>
                  <View style={styles.auditMarker} />
                  <View style={styles.auditContent}>
                    <AppText style={[styles.auditDescription, rtl && styles.rtlText]}>
                      {event.description}
                    </AppText>
                    <AppText
                      style={[
                        styles.auditDate,
                        { textAlign: 'left', writingDirection: 'ltr' },
                      ]}
                    >
                      {formatPreventionDate(event.occurred_at, locale, true)}
                    </AppText>
                  </View>
                </View>
              ))
            )}
          </AesCard>
          <AppText style={[styles.disclaimer, rtl && styles.rtlText]}>
            {t('prevention.disclaimer', locale)}
          </AppText>
        </View>
      )}
    </AesScreenContainer>
  );
};

function createStyles(rtl: boolean) {
  return StyleSheet.create({
    content: { paddingHorizontal: 0 },
    contentBody: {
      paddingHorizontal: aesSpacing.screenHorizontal,
      paddingBottom: aesSpacing['2xl'],
    },
    outerCard: { marginHorizontal: aesSpacing.screenHorizontal },
    stateContainer: {
      flex: 1,
      minHeight: 180,
      alignItems: 'center',
      justifyContent: 'center',
      gap: aesSpacing.md,
    },
    summaryCard: {
      padding: aesSpacing.lg,
      marginBottom: aesSpacing.md,
    },
    referenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: aesSpacing.sm,
      marginBottom: aesSpacing.md,
    },
    rowReverse: { flexDirection: 'row-reverse' },
    reference: {
      ...aesTypography.code,
      color: aesColors.textSecondary,
    },
    title: {
      ...aesTypography.heading1,
      color: aesColors.textPrimary,
      marginBottom: aesSpacing.sm,
    },
    description: {
      ...aesTypography.body,
      color: aesColors.textSecondary,
      lineHeight: 24,
    },
    detailCard: { marginBottom: aesSpacing.md },
    sectionTitle: {
      ...aesTypography.heading2,
      color: aesColors.textPrimary,
      marginBottom: aesSpacing.md,
    },
    infoRow: {
      paddingVertical: aesSpacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: aesColors.borderSubdued,
    },
    infoLabel: {
      ...aesTypography.label,
      color: aesColors.textSecondary,
      marginBottom: aesSpacing.xs,
    },
    infoValue: {
      ...aesTypography.body,
      color: aesColors.textPrimary,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: aesSpacing.sm,
      marginTop: aesSpacing.sm,
    },
    actionButton: { flexGrow: 1, minWidth: 120 },
    transitionPanel: {
      marginTop: aesSpacing.md,
      padding: aesSpacing.md,
      borderWidth: 1,
      borderColor: aesColors.borderMedium,
      borderRadius: aesRadii.card,
      backgroundColor: aesColors.surfaceSubdued,
    },
    panelTitle: {
      ...aesTypography.heading2,
      color: aesColors.textPrimary,
      marginBottom: aesSpacing.sm,
    },
    fieldLabel: {
      ...aesTypography.label,
      color: aesColors.textPrimary,
      marginBottom: aesSpacing.xs,
    },
    noteInput: {
      minHeight: 80,
      borderWidth: 1,
      borderColor: aesColors.borderMedium,
      borderRadius: aesRadii.input,
      padding: aesSpacing.md,
      backgroundColor: aesColors.surface,
      color: aesColors.textPrimary,
    },
    errorBanner: {
      marginTop: aesSpacing.md,
      padding: aesSpacing.md,
      borderWidth: 1,
      borderColor: aesColors.banners.error.border,
      borderRadius: aesRadii.card,
      backgroundColor: aesColors.banners.error.bg,
    },
    errorText: {
      ...aesTypography.bodySmall,
      color: aesColors.banners.error.text,
      textAlign: rtl ? 'right' : 'left',
      marginBottom: aesSpacing.sm,
    },
    bodyText: {
      ...aesTypography.body,
      color: aesColors.textPrimary,
    },
    auditRow: {
      flexDirection: 'row',
      gap: aesSpacing.sm,
      paddingVertical: aesSpacing.sm,
    },
    auditMarker: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: aesSpacing.xs,
      backgroundColor: aesColors.accentGreen,
    },
    auditContent: { flex: 1 },
    auditDescription: {
      ...aesTypography.bodySmall,
      color: aesColors.textPrimary,
    },
    auditDate: {
      ...aesTypography.caption,
      color: aesColors.textSecondary,
      marginTop: aesSpacing.xs,
    },
    disclaimer: {
      ...aesTypography.caption,
      color: aesColors.textSecondary,
      textAlign: rtl ? 'right' : 'left',
      paddingVertical: aesSpacing.md,
    },
    rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  });
}
