import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  getDatabase,
  useDemoRoleStore,
  canManagePreventionActions,
  PreventionActionType,
  ContributingFactorCategory,
  PREVENTION_ACTION_TYPES,
  CONTRIBUTING_FACTOR_CATEGORIES,
  CreatePreventionActionInput,
} from '../../../core';
import { isRTL, t, useLocale } from '../../../localization';
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
  const rtl = isRTL(locale);
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
  const [error, setError] = useState(false);
  const [validation, setValidation] = useState<string[]>([]);
  const submissionLock = useRef(false);

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

  const handleSubmit = async () => {
    if (submissionLock.current) return;
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
    submissionLock.current = true;
    setSubmitting(true);
    try {
      const db = getDatabase();
      const input: CreatePreventionActionInput = {
        title: title.trim(),
        description: description.trim(),
        action_type: actionType,
        contributing_factor: factor,
        rationale: rationale.trim(),
        target_date: targetDate.trim() || undefined,
        surveillance_reference: survRef.trim() || undefined,
      };
      await db.createPreventionAction(userId, input);
      navigation.goBack();
    } catch {
      setError(true);
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
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
            <Icon
              name={rtl ? 'chevron-right' : 'chevron-left'}
              size={24}
              color={aesColors.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      {!isAuthorized ? (
        <AesCard testID="prevention-create-denied" style={styles.deniedCard}>
          <Text style={styles.deniedText}>{t('prevention.create.denied', locale)}</Text>
        </AesCard>
      ) : (
        <View testID="prevention-create-content" style={styles.form}>
          <AesCard style={styles.sectionCard}>
            <Text style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.actionTitle', locale)}</Text>
            <TextInput
              testID="prevention-create-title-input"
              style={[styles.input, rtl && styles.rtlText]}
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setValidation([]);
              }}
              placeholder={t('prevention.create.placeholder.title', locale)}
              placeholderTextColor={aesColors.textTertiary}
              textAlign={rtl ? 'right' : 'left'}
            />

            <Text style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.description', locale)}</Text>
            <TextInput
              testID="prevention-create-description-input"
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
              textAlign={rtl ? 'right' : 'left'}
              textAlignVertical="top"
            />
          </AesCard>

          <AesCard style={styles.sectionCard}>
            <Text style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.action_type', locale)}</Text>
            <View style={styles.optionRow}>
              {PREVENTION_ACTION_TYPES.map((type) => (
                <AesOptionCard
                  key={type}
                  testID={`prevention-create-action-type-${type}`}
                  title={t(`prevention.create.${type}`, locale)}
                  selected={actionType === type}
                  onPress={() => setActionType(type)}
                  style={styles.optionCard}
                />
              ))}
            </View>
          </AesCard>

          <AesCard style={styles.sectionCard}>
            <Text style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.factor.label', locale)}</Text>
            <View style={styles.factorDisclaimer}>
              <Text style={[styles.factorDisclaimerText, rtl && styles.rtlText]}>
                {t('prevention.create.factor.disclaimer', locale)}
              </Text>
            </View>
            <View style={styles.factorGrid}>
              {CONTRIBUTING_FACTOR_CATEGORIES.map((category) => (
                <AesOptionCard
                  key={category}
                  testID={`prevention-create-factor-${category}`}
                  title={t(`prevention.factor.${category}`, locale)}
                  selected={factor === category}
                  onPress={() => setFactor(category)}
                  variant="radio"
                  style={styles.factorOption}
                />
              ))}
            </View>
          </AesCard>

          <AesCard style={styles.sectionCard}>
            <Text style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.rationale', locale)}</Text>
            <TextInput
              testID="prevention-create-rationale-input"
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
              textAlign={rtl ? 'right' : 'left'}
              textAlignVertical="top"
            />

            <Text style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.target_date', locale)}</Text>
            <TextInput
              testID="prevention-create-target-date-input"
              style={[styles.input, rtl && styles.rtlText]}
              value={targetDate}
              onChangeText={(value) => {
                setTargetDate(value);
                setValidation([]);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={aesColors.textTertiary}
              textAlign={rtl ? 'right' : 'left'}
            />

            <Text style={[styles.label, rtl && styles.rtlText]}>{t('prevention.create.surveillance_reference', locale)}</Text>
            <TextInput
              testID="prevention-create-surveillance-reference-input"
              style={[styles.input, rtl && styles.rtlText]}
              value={survRef}
              onChangeText={(value) => {
                setSurvRef(value);
                setValidation([]);
              }}
              placeholder={t('prevention.create.placeholder.surveillanceReference', locale)}
              placeholderTextColor={aesColors.textTertiary}
              textAlign={rtl ? 'right' : 'left'}
            />
          </AesCard>

          {validation.length > 0 ? (
            <AesCard testID="prevention-create-validation" style={styles.errorCard}>
              {validation.map((message) => (
                <Text key={message} style={[styles.errorText, rtl && styles.rtlText]}>{message}</Text>
              ))}
            </AesCard>
          ) : null}

          {error ? (
            <AesCard testID="prevention-create-error" style={styles.errorCard}>
              <Text style={[styles.errorText, rtl && styles.rtlText]}>
                {t('prevention.create.error', locale)}
              </Text>
              <AesButton
                testID="prevention-create-retry"
                title={t('prevention.create.retry', locale)}
                onPress={handleSubmit}
                variant="outline"
                disabled={submitting}
              />
            </AesCard>
          ) : null}

          {submitting ? (
            <View testID="prevention-create-loading" style={styles.loadingRow}>
              <ActivityIndicator color={aesColors.accentGreen} />
              <Text style={[styles.loadingText, rtl && styles.rtlText]}>
                {t('prevention.create.submitting', locale)}
              </Text>
            </View>
          ) : null}

          <AesButton
            testID="prevention-create-submit"
            title={t('prevention.create.submit', locale)}
            onPress={handleSubmit}
            variant="green"
            loading={submitting}
            disabled={submitting}
          />
        </View>
      )}
    </AesScreenContainer>
  );
};

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
