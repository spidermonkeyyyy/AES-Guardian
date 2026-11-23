/**
 * AES Guardian — Screen 4.1: Guided Declaration Wizard (Redesign)
 *
 * Implements the 5-step guided adverse exposure declaration workflow
 * per UI Blueprint Section 4.1 and Reference Mappings:
 * - Cal AI iOS Customizing a diet 0.png
 * - Neo Completing basic info 0.png
 *
 * Critical Boundaries:
 * - Step 1: General Information (date, department code, notes)
 * - Step 2: Exposure Characteristics (selectable incident type cards)
 * - Step 3: Circumstances & Exposure Nature (circumstances, exposure description)
 * - Step 4: Protective Measures Taken (FREE-TEXT ONLY: no clinical taxonomy, checklists, or automated severity)
 * - Step 5: Summary & Honor Attestation (recap of all values + mandatory attestation checkbox)
 * - Auto-saves draft on step transitions (db.createDraft / db.updateDraft)
 * - Role boundary: exposed_professional
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import {
  aesColors,
  aesTypography,
  aesSpacing,
  aesRadii,
  aesShadows,
} from '../../../theme/tokens';
import {
  getDatabase,
  AesIncidentType,
  AES_INCIDENT_TYPES,
  logAuditEvent,
  useDemoRoleStore,
  canDeclare,
} from '../../../core';
import { useLocale, t, isRTL } from '../../../localization';
import {
  AesScreenContainer,
  AesButton,
  AesCard,
  AesOptionCard,
} from '../components';
import { RootStackParamList } from '../../../navigation/routes';

type ParamList = {
  newDeclaration: { declarationId?: number };
};

export const DeclarationFormScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ParamList, 'newDeclaration'>>();
  const editId = route.params?.declarationId;
  const locale = useLocale();
  const rtl = isRTL(locale);

  const { activeContext } = useDemoRoleStore();
  const isAuthorized = canDeclare(activeContext);
  const currentUserId = activeContext.userId ?? 0;

  // Wizard State (Steps 1 to 5)
  const [step, setStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<number | undefined>(editId);

  // Form Fields
  const [incidentDate, setIncidentDate] = useState<string>('');
  const [incidentType, setIncidentType] = useState<AesIncidentType>('percutaneous_exposure');
  const [departmentCode, setDepartmentCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [circumstances, setCircumstances] = useState<string>('');
  const [exposureDescription, setExposureDescription] = useState<string>('');
  const [protectiveMeasures, setProtectiveMeasures] = useState<string>('');
  const [isAttested, setIsAttested] = useState<boolean>(false);

  // Status & Progress Flags
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!!editId);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<boolean>(false);
  const [autoSaveError, setAutoSaveError] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isMountedRef = useRef<boolean>(true);
  const draftIdRef = useRef<number | undefined>(editId);
  const isSavingRef = useRef<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  // Guard to ensure the new-declaration date default is only applied once on mount,
  // not on every dependency change (which would overwrite user edits).
  const dateDefaultAppliedRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initial load when editing an existing draft
  useEffect(() => {
    if (!isAuthorized || !currentUserId) {
      setLoading(false);
      return;
    }

    if (editId) {
      (async () => {
        try {
          const db = getDatabase();
          const decl = await db.getDeclarationById(editId, currentUserId);
          if (!isMountedRef.current) return;

          if (decl) {
            if (decl.status !== 'draft') {
              Alert.alert(t('error.generic', locale), t('details.readOnly', locale));
              navigation.goBack();
              return;
            }
            draftIdRef.current = decl.id;
            setDraftId(decl.id);
            setIncidentDate(decl.incident_date || '');
            setIncidentType(decl.incident_type || 'percutaneous_exposure');
            setCircumstances(decl.circumstances || '');
            setExposureDescription(decl.exposure_description || '');
            setProtectiveMeasures(decl.protective_measures_taken || '');
            setDepartmentCode(decl.department_code || '');
            setNotes(decl.notes || '');
            setLastSaved(true);
          }
        } catch {
          if (isMountedRef.current) {
            Alert.alert(t('error.generic', locale), t('error.loadFailed', locale));
          }
        } finally {
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      })();
    } else if (!dateDefaultAppliedRef.current) {
      // Default incident date to current date ISO — applied only once on mount,
      // not on subsequent dependency changes, to avoid overwriting user edits.
      dateDefaultAppliedRef.current = true;
      setIncidentDate(new Date().toISOString().split('T')[0]);
    }
  }, [editId, navigation, currentUserId, isAuthorized, locale]);

  // Validation per step
  const validateStep = (currentStep: number): boolean => {
    const errs: { [key: string]: string } = {};

    if (currentStep === 1) {
      if (!incidentDate.trim()) {
        errs.incidentDate = t('validation.incidentDateRequired', locale);
      }
    }

    if (currentStep === 2) {
      if (!incidentType) {
        errs.incidentType = t('validation.incidentTypeRequired', locale);
      }
    }

    if (currentStep === 5) {
      if (!isAttested) {
        errs.attestation = t('form.attestation.required', locale);
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Full validation before submission
  const validateAll = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!incidentDate.trim()) {
      errs.incidentDate = t('validation.incidentDateRequired', locale);
    }
    if (!incidentType) {
      errs.incidentType = t('validation.incidentTypeRequired', locale);
    }
    if (!isAttested) {
      errs.attestation = t('form.attestation.required', locale);
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Persistence handler (create or update draft)
  // Non-silent saves throw on failure so callers (e.g. handleSaveDraft) can display an error alert.
  // Silent auto-saves return undefined on failure without blocking wizard step transitions.
  const persistDraft = async (options: { silent?: boolean } = {}): Promise<number | undefined> => {
    const saveContext = useDemoRoleStore.getState().activeContext;
    if (!canDeclare(saveContext) || !saveContext.userId) {
      throw new Error(t('form.unauthorized', locale));
    }

    if (!incidentDate.trim()) return draftIdRef.current;

    if (isSavingRef.current) {
      // Avoid duplicate concurrent draft creation or updates
      return draftIdRef.current;
    }

    isSavingRef.current = true;
    if (!options.silent) setIsAutoSaving(true);

    try {
      const db = getDatabase();
      const currentDraftId = draftIdRef.current;
      const saveUserId = saveContext.userId;

      if (currentDraftId) {
        await db.updateDraft(currentDraftId, {
          incident_date: incidentDate.trim(),
          incident_type: incidentType,
          circumstances: circumstances.trim() || null,
          exposure_description: exposureDescription.trim() || null,
          protective_measures_taken: protectiveMeasures.trim() || null,
          department_code: departmentCode.trim() || null,
          notes: notes.trim() || null,
        });

        await logAuditEvent({
          eventType: 'DECLARATION_DRAFT_UPDATED',
          userId: saveUserId,
          entityType: 'aes_declaration',
          entityId: currentDraftId,
          description: `Draft declaration ${currentDraftId} updated locally`,
        });

        if (isMountedRef.current) {
          setLastSaved(true);
          setAutoSaveError(false);
        }
        return currentDraftId;
      } else {
        const newId = await db.createDraft({
          declared_by_user_id: saveUserId,
          incident_date: incidentDate.trim(),
          incident_type: incidentType,
          circumstances: circumstances.trim() || null,
          exposure_description: exposureDescription.trim() || null,
          protective_measures_taken: protectiveMeasures.trim() || null,
          department_code: departmentCode.trim() || null,
          notes: notes.trim() || null,
        });

        draftIdRef.current = newId;

        await logAuditEvent({
          eventType: 'DECLARATION_DRAFT_CREATED',
          userId: saveUserId,
          entityType: 'aes_declaration',
          entityId: newId,
          description: `New draft declaration ${newId} created locally`,
        });

        if (isMountedRef.current) {
          setDraftId(newId);
          setLastSaved(true);
          setAutoSaveError(false);
        }
        return newId;
      }
    } catch (err) {
      if (isMountedRef.current) {
        setLastSaved(false);
        setAutoSaveError(true);
      }
      if (!options.silent) {
        // Re-throw for explicit actions so caller shows localized error
        throw err;
      }
      // On silent auto-save failure, return undefined to indicate unpersisted state
      return undefined;
    } finally {
      isSavingRef.current = false;
      if (isMountedRef.current && !options.silent) {
        setIsAutoSaving(false);
      }
    }
  };

  // Explicit Save Draft Button
  const handleSaveDraft = async () => {
    if (!validateStep(step)) return;
    setSaving(true);
    try {
      const savedId = await persistDraft({ silent: false });
      if (savedId) {
        Alert.alert(t('form.savedDraft', locale), '', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      // Do not silently report success; preserve in-memory form values; show localized non-clinical error
      Alert.alert(t('error.saveFailed', locale), t('form.saveDraftError', locale));
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  // Forward Navigation
  const handleNextStep = async () => {
    if (!validateStep(step)) return;

    // Auto-save on step transition
    await persistDraft({ silent: true });

    if (step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  // Backward Navigation
  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  // Submission Handler
  const handleSubmit = async () => {
    const submitContext = useDemoRoleStore.getState().activeContext;
    if (!canDeclare(submitContext) || !submitContext.userId) {
      Alert.alert(t('error.generic', locale), t('form.unauthorized', locale));
      return;
    }
    if (!validateAll()) return;
    if (submitting || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      let targetId = draftIdRef.current;
      if (!targetId) {
        targetId = await persistDraft({ silent: false });
      } else {
        await persistDraft({ silent: false });
      }

      if (!targetId) {
        throw new Error('Unable to create draft record for submission');
      }

      const activeSubmitContext = useDemoRoleStore.getState().activeContext;
      if (
        !canDeclare(activeSubmitContext) ||
        activeSubmitContext.userId !== submitContext.userId
      ) {
        throw new Error(t('form.unauthorized', locale));
      }

      const db = getDatabase();
      await db.submitDeclaration(targetId);

      const decl = await db.getDeclarationById(targetId, activeSubmitContext.userId);

      await logAuditEvent({
        eventType: 'DECLARATION_SUBMITTED',
        userId: activeSubmitContext.userId,
        entityType: 'aes_declaration',
        entityId: targetId,
        description: `Declaration ${decl?.reference_number || targetId} submitted locally`,
      });

      navigation.replace('submissionConfirmation', {
        referenceNumber: decl?.reference_number || t('list.refUnavailable', locale),
      });
    } catch (error: unknown) {
      // Submission failure: does not navigate to confirmation; preserves in-memory values; displays alert
      const message =
        error instanceof Error ? error.message : t('error.generic', locale);
      Alert.alert(t('error.submitFailed', locale), message);
    } finally {
      isSubmittingRef.current = false;
      if (isMountedRef.current) setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AesScreenContainer testID="declaration-form-loading">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={aesColors.primaryAction} />
        </View>
      </AesScreenContainer>
    );
  }

  if (!isAuthorized || !currentUserId) {
    return (
      <AesScreenContainer testID="declaration-form-unauthorized">
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t('form.unauthorized', locale)}</Text>
          <AesButton
            title={t('app.back', locale)}
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </AesScreenContainer>
    );
  }

  // Localized Step Heading Text
  const getStepTitle = () => {
    switch (step) {
      case 1:
        return t('form.step1.title', locale);
      case 2:
        return t('form.step2.title', locale);
      case 3:
        return t('form.step3.title', locale);
      case 4:
        return t('form.step4.title', locale);
      case 5:
        return t('form.step5.title', locale);
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return t('form.step1.subtitle', locale);
      case 2:
        return t('form.step2.subtitle', locale);
      case 3:
        return t('form.step3.subtitle', locale);
      case 4:
        return t('form.step4.subtitle', locale);
      case 5:
        return t('form.step5.subtitle', locale);
      default:
        return '';
    }
  };

  const stepCounterText = t('form.step.counter', locale).replace('{step}', String(step));

  return (
    <AesScreenContainer testID="aes-declaration-form-screen">
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Wizard Header */}
        <View style={styles.wizardHeader}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePrevStep}
              accessibilityRole="button"
              accessibilityLabel={t('form.step.prev', locale)}
              testID="declaration-back-button"
            >
              <Icon
                name={rtl ? 'chevron-right' : 'chevron-left'}
                size={24}
                color={aesColors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.stepIndicatorText}>{stepCounterText}</Text>
              <Text style={styles.headerTitleText}>
                {editId ? t('form.title.edit', locale) : t('form.title.new', locale)}
              </Text>
            </View>

            <View style={styles.headerRight}>
              {isAutoSaving ? (
                <Text style={styles.syncText}>{t('form.saving', locale)}</Text>
              ) : autoSaveError ? (
                <View style={styles.syncErrorBadge} testID="declaration-sync-error">
                  <Icon name="alert-circle" size={12} color={aesColors.banners.error.text} />
                  <Text style={styles.syncErrorText}>{t('form.autoSaveFailed', locale)}</Text>
                </View>
              ) : lastSaved ? (
                <View style={styles.syncedBadge} testID="declaration-sync-success">
                  <Icon name="check" size={12} color={aesColors.accentGreen} />
                  <Text style={styles.syncText}>{t('form.autoSaved', locale)}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* 5-Segment Progress Bar */}
          <View style={styles.progressBarRow} testID="declaration-progress-bar">
            {[1, 2, 3, 4, 5].map((segIndex) => {
              const isFilled = segIndex <= step;
              return (
                <View
                  key={segIndex}
                  style={[
                    styles.progressSegment,
                    isFilled ? styles.progressSegmentFilled : styles.progressSegmentEmpty,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Scrollable Step Content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step Section Title & Subtitle */}
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { textAlign: rtl ? 'right' : 'left' },
              ]}
            >
              {getStepTitle()}
            </Text>
            <Text
              style={[
                styles.sectionSubtitle,
                { textAlign: rtl ? 'right' : 'left' },
              ]}
            >
              {getStepSubtitle()}
            </Text>
          </View>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 1: Informations Générales */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.stepContainer} testID="declaration-step-1">
              {/* Incident Date */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>{t('form.incidentDate', locale)}</Text>
                  <Text style={styles.requiredMark}>* {t('form.required', locale)}</Text>
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    errors.incidentDate && styles.inputErrorBorder,
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                  value={incidentDate}
                  onChangeText={(val) => {
                    setIncidentDate(val);
                    if (errors.incidentDate) {
                      setErrors((prev) => ({ ...prev, incidentDate: '' }));
                    }
                  }}
                  placeholder={t('form.incidentDate.placeholder', locale)}
                  placeholderTextColor={aesColors.textPlaceholder}
                  testID="declaration-incident-date-input"
                  accessibilityLabel={t('form.incidentDate', locale)}
                />
                {errors.incidentDate ? (
                  <Text style={styles.errorText}>{errors.incidentDate}</Text>
                ) : null}
              </View>

              {/* Department Code */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>{t('form.departmentCode', locale)}</Text>
                  <Text style={styles.optionalMark}>({t('form.optional', locale)})</Text>
                </View>
                <TextInput
                  style={[
                    styles.textInput,
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                  value={departmentCode}
                  onChangeText={setDepartmentCode}
                  placeholder={t('form.departmentCode.placeholder', locale)}
                  placeholderTextColor={aesColors.textPlaceholder}
                  testID="declaration-department-code-input"
                  accessibilityLabel={t('form.departmentCode', locale)}
                />
              </View>

              {/* Incident Notes / Specific Location */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>{t('form.notes', locale)}</Text>
                  <Text style={styles.optionalMark}>({t('form.optional', locale)})</Text>
                </View>
                <TextInput
                  style={[
                    styles.textArea,
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('form.notes.placeholder', locale)}
                  placeholderTextColor={aesColors.textPlaceholder}
                  multiline
                  numberOfLines={3}
                  testID="declaration-notes-input"
                  accessibilityLabel={t('form.notes', locale)}
                />
              </View>
            </View>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 2: Caractéristiques de l'Exposition */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.stepContainer} testID="declaration-step-2">
              <View style={styles.optionsList}>
                {/* Percutaneous */}
                <AesOptionCard
                  title={t('form.incidentType.percutaneous', locale)}
                  subtitle={t('form.incidentType.percutaneous.desc', locale)}
                  badgeCode="PERC"
                  selected={incidentType === 'percutaneous_exposure'}
                  onPress={() => setIncidentType('percutaneous_exposure')}
                  variant="radio"
                  testID="incident-type-percutaneous_exposure"
                />

                {/* Mucocutaneous */}
                <AesOptionCard
                  title={t('form.incidentType.mucocutaneous', locale)}
                  subtitle={t('form.incidentType.mucocutaneous.desc', locale)}
                  badgeCode="MUCO"
                  selected={incidentType === 'mucocutaneous_exposure'}
                  onPress={() => setIncidentType('mucocutaneous_exposure')}
                  variant="radio"
                  testID="incident-type-mucocutaneous_exposure"
                />

                {/* Other */}
                <AesOptionCard
                  title={t('form.incidentType.other', locale)}
                  subtitle={t('form.incidentType.other.desc', locale)}
                  badgeCode="AUTRE"
                  selected={incidentType === 'other'}
                  onPress={() => setIncidentType('other')}
                  variant="radio"
                  testID="incident-type-other"
                />

                {/* Backward-compatible sexual assault option if supported by schema */}
                {AES_INCIDENT_TYPES.includes('sexual_assault') && (
                  <AesOptionCard
                    title={t('form.incidentType.sexual_assault', locale)}
                    subtitle={t('form.incidentType.sexual_assault.desc', locale)}
                    badgeCode="SPEC"
                    selected={incidentType === 'sexual_assault'}
                    onPress={() => setIncidentType('sexual_assault')}
                    variant="radio"
                    testID="incident-type-sexual_assault"
                  />
                )}
              </View>
              {errors.incidentType ? (
                <Text style={styles.errorText}>{errors.incidentType}</Text>
              ) : null}
            </View>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 3: Matériel & Circonstances */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === 3 && (
            <View style={styles.stepContainer} testID="declaration-step-3">
              {/* Circumstances */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>{t('form.circumstances', locale)}</Text>
                  <Text style={styles.optionalMark}>({t('form.optional', locale)})</Text>
                </View>
                <TextInput
                  style={[
                    styles.textArea,
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                  value={circumstances}
                  onChangeText={setCircumstances}
                  placeholder={t('form.circumstances.placeholder', locale)}
                  placeholderTextColor={aesColors.textPlaceholder}
                  multiline
                  numberOfLines={4}
                  testID="declaration-circumstances-input"
                  accessibilityLabel={t('form.circumstances', locale)}
                />
              </View>

              {/* Exposure Nature */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>{t('form.exposureDescription', locale)}</Text>
                  <Text style={styles.optionalMark}>({t('form.optional', locale)})</Text>
                </View>
                <TextInput
                  style={[
                    styles.textArea,
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                  value={exposureDescription}
                  onChangeText={setExposureDescription}
                  placeholder={t('form.exposureDescription.placeholder', locale)}
                  placeholderTextColor={aesColors.textPlaceholder}
                  multiline
                  numberOfLines={4}
                  testID="declaration-exposure-desc-input"
                  accessibilityLabel={t('form.exposureDescription', locale)}
                />
              </View>
            </View>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 4: Mesures de Protection (FREE-TEXT ONLY BOUNDARY) */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === 4 && (
            <View style={styles.stepContainer} testID="declaration-step-4">
              <View style={styles.freeTextNotice}>
                <Icon name="info" size={16} color="#0D47A1" style={styles.noticeIcon} />
                <Text style={styles.noticeText}>
                  {t('form.step4.advisory', locale)}
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>{t('form.protectiveMeasures', locale)}</Text>
                  <Text style={styles.optionalMark}>({t('form.optional', locale)})</Text>
                </View>
                <TextInput
                  style={[
                    styles.textAreaLarge,
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                  value={protectiveMeasures}
                  onChangeText={setProtectiveMeasures}
                  placeholder={t('form.protectiveMeasures.placeholder', locale)}
                  placeholderTextColor={aesColors.textPlaceholder}
                  multiline
                  numberOfLines={6}
                  testID="declaration-protective-measures-input"
                  accessibilityLabel={t('form.protectiveMeasures', locale)}
                />
              </View>
            </View>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 5: Récapitulatif & Attestation */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === 5 && (
            <View style={styles.stepContainer} testID="declaration-step-5">
              {/* Summary Card */}
              <AesCard style={styles.summaryCard}>
                <Text style={styles.summaryCardHeader}>{t('form.summary.title', locale)}</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('form.incidentDate', locale)} :</Text>
                  <Text style={styles.summaryValue}>{incidentDate || '—'}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('form.incidentType', locale)} :</Text>
                  <Text style={styles.summaryValue}>
                    {t(`form.incidentType.${incidentType === 'percutaneous_exposure' ? 'percutaneous' : incidentType === 'mucocutaneous_exposure' ? 'mucocutaneous' : incidentType === 'sexual_assault' ? 'sexual_assault' : 'other'}` as any, locale)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('form.departmentCode', locale)} :</Text>
                  <Text style={styles.summaryValue}>{departmentCode || t('form.departmentCode.notSpecified', locale)}</Text>
                </View>

                {circumstances ? (
                  <View style={styles.summaryBlock}>
                    <Text style={styles.summaryLabel}>{t('form.circumstances', locale)} :</Text>
                    <Text style={styles.summaryBlockText}>{circumstances}</Text>
                  </View>
                ) : null}

                {exposureDescription ? (
                  <View style={styles.summaryBlock}>
                    <Text style={styles.summaryLabel}>{t('form.exposureDescription', locale)} :</Text>
                    <Text style={styles.summaryBlockText}>{exposureDescription}</Text>
                  </View>
                ) : null}

                {protectiveMeasures ? (
                  <View style={styles.summaryBlock}>
                    <Text style={styles.summaryLabel}>{t('form.protectiveMeasures', locale)} :</Text>
                    <Text style={styles.summaryBlockText}>{protectiveMeasures}</Text>
                  </View>
                ) : null}

                {notes ? (
                  <View style={styles.summaryBlock}>
                    <Text style={styles.summaryLabel}>{t('form.notes', locale)} :</Text>
                    <Text style={styles.summaryBlockText}>{notes}</Text>
                  </View>
                ) : null}
              </AesCard>

              {/* Honor Attestation Checkbox */}
              <View style={styles.attestationContainer}>
                <AesOptionCard
                  title={t('form.attestation.label', locale)}
                  subtitle={t('form.attestation.subtitle', locale)}
                  selected={isAttested}
                  onPress={() => {
                    setIsAttested(!isAttested);
                    if (errors.attestation) {
                      setErrors((prev) => ({ ...prev, attestation: '' }));
                    }
                  }}
                  variant="checkbox"
                  testID="declaration-attestation-checkbox"
                />
                {errors.attestation ? (
                  <Text style={styles.errorText}>{errors.attestation}</Text>
                ) : null}
              </View>

              {/* Institutional Disclaimer */}
              <Text style={styles.disclaimerText}>
                {t('form.disclaimer', locale)}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Wizard Footer Navigation Actions */}
        <View style={styles.footerBar}>
          <View style={styles.footerButtonsRow}>
            {step > 1 && (
              <AesButton
                title={t('form.step.prev', locale)}
                onPress={handlePrevStep}
                variant="outline"
                style={styles.halfButton}
                testID="declaration-prev-step-button"
              />
            )}

            <AesButton
              title={t('form.saveDraft', locale)}
              onPress={handleSaveDraft}
              variant="secondary"
              loading={saving}
              disabled={submitting}
              style={styles.halfButton}
              testID="declaration-save-draft-button"
            />

            {step < 5 ? (
              <AesButton
                title={t('form.step.next', locale)}
                onPress={handleNextStep}
                variant="primary"
                style={styles.halfButton}
                testID="declaration-next-step-button"
              />
            ) : (
              <AesButton
                title={t('form.submit', locale)}
                onPress={handleSubmit}
                variant="primary"
                loading={submitting}
                disabled={saving}
                style={styles.halfButton}
                testID="declaration-submit-button"
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardHeader: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingTop: aesSpacing.sm,
    paddingBottom: aesSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: aesColors.borderSubdued,
    backgroundColor: aesColors.surface,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicatorText: {
    ...aesTypography.labelSmall,
    color: aesColors.accentGreen,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitleText: {
    ...aesTypography.label,
    color: aesColors.textPrimary,
    fontWeight: '600',
  },
  headerRight: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncText: {
    ...aesTypography.caption,
    fontSize: 10,
    color: aesColors.accentGreen,
  },
  syncErrorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncErrorText: {
    ...aesTypography.caption,
    fontSize: 10,
    color: aesColors.banners.error.text,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: aesSpacing.xs,
    paddingHorizontal: 2,
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressSegmentFilled: {
    backgroundColor: aesColors.primaryAction,
  },
  progressSegmentEmpty: {
    backgroundColor: '#E0E0E0',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.md,
    paddingBottom: aesSpacing.xl,
  },
  sectionHeader: {
    marginBottom: aesSpacing.md,
    gap: 4,
  },
  sectionTitle: {
    ...aesTypography.heading2,
    color: aesColors.textPrimary,
  },
  sectionSubtitle: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    lineHeight: 18,
  },
  stepContainer: {
    gap: aesSpacing.md,
  },
  fieldGroup: {
    gap: aesSpacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    ...aesTypography.label,
    color: aesColors.textPrimary,
    fontWeight: '600',
  },
  requiredMark: {
    ...aesTypography.caption,
    color: aesColors.banners.error.text,
    fontWeight: '600',
  },
  optionalMark: {
    ...aesTypography.caption,
    color: aesColors.textTertiary,
  },
  textInput: {
    backgroundColor: aesColors.surface,
    borderWidth: 1,
    borderColor: aesColors.borderMedium,
    borderRadius: aesRadii.input,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.sm,
    ...aesTypography.body,
    color: aesColors.textPrimary,
  },
  textArea: {
    backgroundColor: aesColors.surface,
    borderWidth: 1,
    borderColor: aesColors.borderMedium,
    borderRadius: aesRadii.input,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.sm,
    ...aesTypography.body,
    color: aesColors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  textAreaLarge: {
    backgroundColor: aesColors.surface,
    borderWidth: 1,
    borderColor: aesColors.borderMedium,
    borderRadius: aesRadii.input,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.sm,
    ...aesTypography.body,
    color: aesColors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 140,
  },
  inputErrorBorder: {
    borderColor: aesColors.banners.error.text,
  },
  errorText: {
    ...aesTypography.caption,
    color: aesColors.banners.error.text,
    marginTop: 2,
  },
  optionsList: {
    gap: aesSpacing.xs,
  },
  freeTextNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: aesSpacing.md,
    borderRadius: aesRadii.card,
    borderWidth: 1,
    borderColor: '#90CAF9',
    gap: aesSpacing.xs,
  },
  noticeIcon: {
    marginRight: 4,
  },
  noticeText: {
    ...aesTypography.caption,
    color: '#0D47A1',
    flex: 1,
    lineHeight: 16,
  },
  summaryCard: {
    gap: aesSpacing.xs,
    padding: aesSpacing.md,
    backgroundColor: aesColors.surface,
  },
  summaryCardHeader: {
    ...aesTypography.subheading,
    color: aesColors.textPrimary,
    marginBottom: aesSpacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: aesColors.borderSubdued,
  },
  summaryLabel: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    fontWeight: '500',
  },
  summaryBlock: {
    paddingVertical: 4,
    gap: 2,
  },
  summaryBlockText: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    backgroundColor: aesColors.surfaceSubdued,
    padding: aesSpacing.xs,
    borderRadius: aesRadii.chip,
  },
  attestationContainer: {
    marginTop: aesSpacing.xs,
    gap: aesSpacing.xs,
  },
  disclaimerText: {
    ...aesTypography.caption,
    color: aesColors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: aesSpacing.xs,
    lineHeight: 16,
  },
  footerBar: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingTop: aesSpacing.sm,
    paddingBottom: aesSpacing.md,
    backgroundColor: aesColors.surface,
    borderTopWidth: 1,
    borderTopColor: aesColors.borderSubdued,
    ...aesShadows.card,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: aesSpacing.sm,
  },
  halfButton: {
    flex: 1,
  },
});

export default DeclarationFormScreen;
