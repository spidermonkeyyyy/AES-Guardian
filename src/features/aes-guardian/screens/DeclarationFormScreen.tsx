import React, { useState, useEffect } from 'react';
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
  AesIncidentType,
  AES_INCIDENT_TYPES,
  logAuditEvent,
  SYNTHETIC_DEMO_CONTEXT,
} from '../../../core';
import { t } from '../../../localization';

type ParamList = {
  newDeclaration: { declarationId?: number };
};

export const DeclarationFormScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<ParamList, 'newDeclaration'>>();
  const editId = route.params?.declarationId;

  const [incidentDate, setIncidentDate] = useState<string>('');
  const [incidentType, setIncidentType] = useState<AesIncidentType>('percutaneous_exposure');
  const [circumstances, setCircumstances] = useState<string>('');
  const [exposureDescription, setExposureDescription] = useState<string>('');
  const [protectiveMeasures, setProtectiveMeasures] = useState<string>('');
  const [departmentCode, setDepartmentCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!!editId);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editId) {
      (async () => {
        try {
          const db = getDatabase();
          const decl = await db.getDeclarationById(editId);
          if (decl) {
            if (decl.status !== 'draft') {
              Alert.alert(t('error.generic'), t('details.readOnly'));
              navigation.goBack();
              return;
            }
            setIncidentDate(decl.incident_date || '');
            setIncidentType(decl.incident_type || 'percutaneous_exposure');
            setCircumstances(decl.circumstances || '');
            setExposureDescription(decl.exposure_description || '');
            setProtectiveMeasures(decl.protective_measures_taken || '');
            setDepartmentCode(decl.department_code || '');
            setNotes(decl.notes || '');
          }
        } catch (e) {
          Alert.alert(t('error.generic'), t('error.loadFailed'));
        } finally {
          setLoading(false);
        }
      })();
    } else {
      // Default incident date to current date ISO
      setIncidentDate(new Date().toISOString().split('T')[0]);
    }
  }, [editId, navigation]);

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!incidentDate.trim()) {
      errs.incidentDate = t('validation.incidentDateRequired');
    }
    if (!incidentType) {
      errs.incidentType = t('validation.incidentTypeRequired');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const db = getDatabase();
      if (editId) {
        await db.updateDraft(editId, {
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
          userId: SYNTHETIC_DEMO_CONTEXT.userId,
          entityType: 'aes_declaration',
          entityId: editId,
          description: `Draft declaration ${editId} updated locally`,
        });

        Alert.alert(t('form.savedDraft'), '', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const newId = await db.createDraft({
          declared_by_user_id: SYNTHETIC_DEMO_CONTEXT.userId || 1,
          incident_date: incidentDate.trim(),
          incident_type: incidentType,
          circumstances: circumstances.trim() || null,
          exposure_description: exposureDescription.trim() || null,
          protective_measures_taken: protectiveMeasures.trim() || null,
          department_code: departmentCode.trim() || null,
          notes: notes.trim() || null,
        });

        await logAuditEvent({
          eventType: 'DECLARATION_DRAFT_CREATED',
          userId: SYNTHETIC_DEMO_CONTEXT.userId,
          entityType: 'aes_declaration',
          entityId: newId,
          description: `New draft declaration ${newId} created locally`,
        });

        Alert.alert(t('form.savedDraft'), '', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert(t('error.saveFailed'), err?.message || t('error.generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const db = getDatabase();
      let targetId = editId;

      if (!targetId) {
        targetId = await db.createDraft({
          declared_by_user_id: SYNTHETIC_DEMO_CONTEXT.userId || 1,
          incident_date: incidentDate.trim(),
          incident_type: incidentType,
          circumstances: circumstances.trim() || null,
          exposure_description: exposureDescription.trim() || null,
          protective_measures_taken: protectiveMeasures.trim() || null,
          department_code: departmentCode.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        await db.updateDraft(targetId, {
          incident_date: incidentDate.trim(),
          incident_type: incidentType,
          circumstances: circumstances.trim() || null,
          exposure_description: exposureDescription.trim() || null,
          protective_measures_taken: protectiveMeasures.trim() || null,
          department_code: departmentCode.trim() || null,
          notes: notes.trim() || null,
        });
      }

      await db.submitDeclaration(targetId);

      const decl = await db.getDeclarationById(targetId);

      await logAuditEvent({
        eventType: 'DECLARATION_SUBMITTED',
        userId: SYNTHETIC_DEMO_CONTEXT.userId,
        entityType: 'aes_declaration',
        entityId: targetId,
        description: `Declaration ${decl?.reference_number || targetId} submitted locally`,
      });

      navigation.replace('submissionConfirmation', {
        referenceNumber: decl?.reference_number || 'AES-REF',
      });
    } catch (err: any) {
      Alert.alert(t('error.submitFailed'), err?.message || t('error.generic'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>
        {editId ? t('form.title.edit') : t('form.title.new')}
      </Text>

      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        {t('form.disclaimer')}
      </Text>

      {/* Incident Date */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t('form.incidentDate')}
          </Text>
          <Text style={[styles.requiredBadge, { color: colors.destructive }]}>
            * {t('form.required')}
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: errors.incidentDate ? colors.destructive : colors.border,
              color: colors.foreground,
            },
          ]}
          value={incidentDate}
          onChangeText={(val) => {
            setIncidentDate(val);
            if (errors.incidentDate) setErrors((prev) => ({ ...prev, incidentDate: '' }));
          }}
          placeholder={t('form.incidentDate.placeholder')}
          placeholderTextColor={colors.mutedForeground}
        />
        {errors.incidentDate ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {errors.incidentDate}
          </Text>
        ) : null}
      </View>

      {/* Incident Type */}
      <View style={styles.formGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t('form.incidentType')}
          </Text>
          <Text style={[styles.requiredBadge, { color: colors.destructive }]}>
            * {t('form.required')}
          </Text>
        </View>
        <View style={styles.typeOptions}>
          {AES_INCIDENT_TYPES.map((type) => {
            const isSelected = incidentType === type;
            let labelKey = 'form.incidentType.other';
            if (type === 'percutaneous_exposure') labelKey = 'form.incidentType.percutaneous';
            if (type === 'mucocutaneous_exposure') labelKey = 'form.incidentType.mucocutaneous';
            if (type === 'sexual_assault') labelKey = 'form.incidentType.sexual_assault';

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setIncidentType(type)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    {
                      color: isSelected ? colors.primaryForeground : colors.foreground,
                      fontWeight: isSelected ? '700' : '400',
                    },
                  ]}
                >
                  {t(labelKey as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Circumstances */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('form.circumstances')}
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={circumstances}
          onChangeText={setCircumstances}
          placeholder={t('form.circumstances.placeholder')}
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Exposure Description */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('form.exposureDescription')}
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={exposureDescription}
          onChangeText={setExposureDescription}
          placeholder={t('form.exposureDescription.placeholder')}
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Protective Measures Taken */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('form.protectiveMeasures')}
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={protectiveMeasures}
          onChangeText={setProtectiveMeasures}
          placeholder={t('form.protectiveMeasures.placeholder')}
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Department Code */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('form.departmentCode')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={departmentCode}
          onChangeText={setDepartmentCode}
          placeholder={t('form.departmentCode.placeholder')}
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('form.notes')}
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('form.notes.placeholder')}
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.draftButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handleSaveDraft}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.foreground }]}>
              {t('form.saveDraft')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {t('form.submit')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.huge,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.headlineSmall,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  disclaimer: {
    fontSize: typography.fontSize.bodySmall,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  label: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  requiredBadge: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: shapes.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.bodyMedium,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: shapes.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.bodyMedium,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
  typeOptions: {
    gap: spacing.xs,
  },
  typeOption: {
    borderWidth: 1,
    borderRadius: shapes.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  typeOptionText: {
    fontSize: typography.fontSize.bodyMedium,
  },
  buttonContainer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButton: {
    borderWidth: 1,
  },
  submitButton: {},
  buttonText: {
    fontSize: typography.fontSize.bodyMedium,
    fontWeight: '600',
  },
});

export default DeclarationFormScreen;
