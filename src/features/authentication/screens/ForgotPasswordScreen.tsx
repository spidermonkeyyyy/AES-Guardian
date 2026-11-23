import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { spacing, shapes, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../hooks/use-auth-store';
import { resetPassword } from '../hooks/use-auth';
import { formatNotificationText, t, useLocale } from '../../../localization';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorMessage = useAuthStore((s) => s.errorMessage);

  const validate = () => {
    if (!email.trim()) return t('auth.error.emailRequired', locale);
    if (!email.includes('@')) return t('auth.error.emailInvalid', locale);
    return null;
  };

  const handleSubmit = async () => {
    setClientError(null);
    const err = validate();
    if (err) {
      setClientError(err);
      return;
    }
    setIsLoading(true);
    await resetPassword(email.trim());
    setIsLoading(false);
    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>📧</Text>
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          {t('auth.forgot.emailSentTitle', locale)}
        </Text>
        <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
          {formatNotificationText('auth.forgot.emailSentBody', { email }, locale)}
        </Text>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('auth.forgot.backToSignIn', locale)}
        >
          <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
            {t('auth.forgot.backToSignIn', locale)}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel={t('auth.back', locale)}
      >
        <Text style={[styles.backButton, { color: colors.foreground }]}>
          ← {t('auth.back', locale)}
        </Text>
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <Text style={styles.icon}>🔒</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {t('auth.forgot.title', locale)}
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {t('auth.forgot.subtitle', locale)}
      </Text>

      {(clientError || errorMessage) && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{clientError || errorMessage}</Text>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.email', locale)}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder={t('auth.emailPlaceholder', locale)}
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel={t('auth.forgot.emailAccessibility', locale)}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={t('auth.forgot.sendResetLink', locale)}
      >
        <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
          {isLoading
            ? t('auth.forgot.sending', locale)
            : t('auth.forgot.sendResetLink', locale)}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing[6], gap: spacing[4] },
  backButton: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
  },
  iconRow: { alignItems: 'center', marginVertical: spacing[4] },
  icon: { fontSize: 48 },
  title: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  field: { marginBottom: spacing[3] },
  label: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: shapes.sm,
    padding: spacing[4],
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    minHeight: 48,
  },
  submitButton: {
    padding: spacing[4],
    borderRadius: shapes.sm,
    alignItems: 'center',
    minHeight: 48,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: {
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
  },
  successIcon: { alignItems: 'center', marginTop: spacing[12] },
  successIconText: { fontSize: 56 },
  successTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  successBody: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
