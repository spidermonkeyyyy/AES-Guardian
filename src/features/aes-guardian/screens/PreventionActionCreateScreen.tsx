/**
 * AES Guardian — Prevention Action Create Screen (Phase 2C.6)
 *
 * Form to create a new prevention or corrective action.
 * Access: quality_staff ONLY.
 *
 * Contributing-factor categories are PROVISIONAL and require
 * institutional validation before official use.
 *
 * Displays synthetic demonstration data only.
 * Does not perform clinical analysis or risk scoring.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import {
  getDatabase,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  PreventionActionType,
  ContributingFactorCategory,
  PREVENTION_ACTION_TYPES,
  CONTRIBUTING_FACTOR_CATEGORIES,
  CreatePreventionActionInput,
} from '../../../core';
import { t } from '../../../localization';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/routes';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// Use quality_staff context since only they can create
const userId = SYNTHETIC_QUALITY_STAFF_CONTEXT.userId;

export const PreventionActionCreateScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const styles = createStyles(colors);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [actionType,  setActionType]  = useState<PreventionActionType>('corrective');
  const [factor,      setFactor]      = useState<ContributingFactorCategory>('device_safety_design');
  const [rationale,   setRationale]   = useState('');
  const [targetDate,  setTargetDate]  = useState('');
  const [survRef,     setSurvRef]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const handleSubmit = async () => {
    if (title.trim().length < 3) {
      Alert.alert('Validation', 'Le titre doit comporter au moins 3 caractères.');
      return;
    }
    if (description.trim().length < 5) {
      Alert.alert('Validation', 'La description doit comporter au moins 5 caractères.');
      return;
    }
    if (rationale.trim().length < 5) {
      Alert.alert('Validation', 'La justification doit comporter au moins 5 caractères.');
      return;
    }
    if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate.trim())) {
      Alert.alert('Validation', 'La date cible doit être au format YYYY-MM-DD.');
      return;
    }
    if (survRef.trim() && /^AES-/i.test(survRef.trim())) {
      Alert.alert(
        'Confidentialité',
        'La référence surveillance doit être une observation agrégée (ex: Observation T3-2026) et ne doit pas contenir de numéro de déclaration individuelle (AES-XXXX).',
      );
      return;
    }

    setSubmitting(true);
    try {
      const db = await getDatabase();
      const input: CreatePreventionActionInput = {
        title: title.trim(),
        description: description.trim(),
        action_type: actionType,
        contributing_factor: factor,
        rationale: rationale.trim(),
        target_date: targetDate.trim() || undefined,
        surveillance_reference: survRef.trim() || undefined,
      };
      await db.createPreventionAction(userId!, input);
      Alert.alert('Succès', t('prevention.create.success'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const TypeBtn: React.FC<{ type: PreventionActionType; label: string }> = ({ type, label }) => (
    <TouchableOpacity
      style={[styles.typeBtn, actionType === type && styles.typeBtnActive]}
      onPress={() => setActionType(type)}
    >
      <Text style={[styles.typeBtnText, actionType === type && styles.typeBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.root} keyboardShouldPersistTaps="handled">
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>{t('prevention.disclaimer')}</Text>
      </View>

      <View style={styles.form}>
        {/* Title */}
        <Text style={styles.label}>{t('prevention.create.actionTitle')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="ex: Dotation en collecteurs de sécurité"
          placeholderTextColor={colors.mutedForeground}
        />

        {/* Description */}
        <Text style={styles.label}>{t('prevention.create.description')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Description détaillée de la mesure…"
          placeholderTextColor={colors.mutedForeground}
        />

        {/* Action type */}
        <Text style={styles.label}>{t('prevention.create.action_type')}</Text>
        <View style={styles.typeRow}>
          <TypeBtn type="corrective" label={t('prevention.create.corrective')} />
          <TypeBtn type="preventive" label={t('prevention.create.preventive')} />
        </View>

        {/* Contributing factor */}
        <Text style={styles.label}>{t('prevention.create.factor.label')}</Text>
        <View style={styles.factorDisclaimer}>
          <Text style={styles.factorDisclaimerText}>{t('prevention.create.factor.disclaimer')}</Text>
        </View>
        <View style={styles.factorGrid}>
          {CONTRIBUTING_FACTOR_CATEGORIES.map(fc => (
            <TouchableOpacity
              key={fc}
              style={[styles.factorChip, factor === fc && styles.factorChipActive]}
              onPress={() => setFactor(fc)}
            >
              <Text style={[styles.factorChipText, factor === fc && styles.factorChipTextActive]}>
                {t(`prevention.factor.${fc}` as any)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rationale */}
        <Text style={styles.label}>{t('prevention.create.rationale')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={rationale}
          onChangeText={setRationale}
          multiline
          numberOfLines={3}
          placeholder="Justification de la mesure…"
          placeholderTextColor={colors.mutedForeground}
        />

        {/* Target date */}
        <Text style={styles.label}>{t('prevention.create.target_date')}</Text>
        <TextInput
          style={styles.input}
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
        />

        {/* Surveillance reference */}
        <Text style={styles.label}>{t('prevention.create.surveillance_reference')}</Text>
        <TextInput
          style={styles.input}
          value={survRef}
          onChangeText={setSurvRef}
          placeholder="ex: Observation T3-2026"
          placeholderTextColor={colors.mutedForeground}
        />
        <Text style={styles.fieldHint}>
          Observation agrégée issue de la surveillance. Ne pas inclure de numéro de déclaration individuelle (AES-...), de nom ou d'élément clinique.
        </Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && styles.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>{t('prevention.create.submit')}</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    disclaimerBanner: {
      backgroundColor: '#FEF3C7',
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
      margin: spacing.md,
      padding: spacing.sm,
      borderRadius: shapes.sm,
    },
    disclaimerText: {
      fontSize: typography.fontSize.xs,
      color: '#92400E',
    },
    fieldHint: {
      fontSize: typography.fontSize.xs,
      color: colors.mutedForeground,
      marginTop: spacing.xs,
    },
    form: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 },
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: shapes.md,
      padding: spacing.sm,
      color: colors.text,
      backgroundColor: colors.card,
      fontFamily: typography.fontFamily.openSans,
    },
    multiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    typeRow: { flexDirection: 'row', gap: spacing.sm },
    typeBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeBtnText: { fontSize: typography.fontSize.sm, color: colors.text },
    typeBtnTextActive: { color: '#fff', fontWeight: typography.fontWeight.bold },
    factorDisclaimer: {
      backgroundColor: '#FEF3C7',
      padding: spacing.xs,
      borderRadius: shapes.sm,
      marginBottom: spacing.xs,
    },
    factorDisclaimerText: { fontSize: typography.fontSize.xs, color: '#92400E' },
    factorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    factorChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: shapes.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    factorChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    factorChipText: { fontSize: typography.fontSize.xs, color: colors.text },
    factorChipTextActive: { color: '#fff' },
    submitBtn: {
      marginTop: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: shapes.md,
      alignItems: 'center',
    },
    submitBtnText: { color: '#fff', fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.md },
    disabled: { opacity: 0.6 },
  });
}
