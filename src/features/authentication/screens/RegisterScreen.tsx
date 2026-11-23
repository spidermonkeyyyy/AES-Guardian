import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { spacing, shapes, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../hooks/use-auth-store';
import { t, useLocale } from '../../../localization';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const locale = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const isLoading = useAuthStore((s) => s.status) === 'authenticating';
  const errorMessage = useAuthStore((s) => s.errorMessage);
  const user = useAuthStore((s) => s.user);

  const displayError = clientError || errorMessage;

  const validate = () => {
    if (!name.trim()) return t('auth.error.nameRequired', locale);
    if (!email.trim() || !email.includes('@') || !email.includes('.')) return t('auth.error.emailInvalid', locale);
    if (password.length < 8) return t('auth.error.passwordMin8', locale);
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return t('auth.error.passwordComplex', locale);
    if (password !== confirmPassword) return t('auth.error.passwordMismatch', locale);
    if (!agreedToTerms) return t('auth.error.termsRequired', locale);
    return null;
  };

  const handleSubmit = async () => {
    setClientError(null);
    const err = validate();
    if (err) {
      setClientError(err);
      return;
    }
    const { register } = await import('../hooks/use-auth');
    await register({
      name: name.trim(),
      email: email.trim(),
      password,
      role: 'patient',
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={t('auth.back', locale)}>
        <Text style={[styles.backButton, { color: colors.foreground }]}>← {t('auth.back', locale)}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.foreground }]}>{t('auth.register.title', locale)}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t('auth.register.subtitle', locale)}</Text>

      {displayError && (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '4D' }]}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{displayError}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.register.fullName', locale)}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder={t('auth.register.namePlaceholder', locale)}
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
          textContentType="name"
          accessibilityLabel={t('auth.register.fullName', locale)}
        />
      </View>

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
          accessibilityLabel={t('auth.email', locale)}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>{t('auth.password', locale)}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder={t('auth.passwordPlaceholder', locale)}
          placeholderTextColor={colors.mutedForeground}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          accessibilityLabel={t('auth.password', locale)}
        />
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>
          {t('auth.register.passwordHelper', locale)}
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('auth.register.confirmPassword', locale)}
        </Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder={t('auth.passwordPlaceholder', locale)}
          placeholderTextColor={colors.mutedForeground}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          accessibilityLabel={t('auth.register.confirmPassword', locale)}
        />
      </View>

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreedToTerms }}
        accessibilityLabel={t('auth.register.terms', locale)}
      >
        <View style={[styles.checkbox, { borderColor: colors.border }, agreedToTerms && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          {agreedToTerms && <Text style={[styles.checkmark, { color: colors.primaryForeground }]}>✓</Text>}
        </View>
        <Text style={[styles.termsText, { color: colors.foreground }]}>
          {t('auth.register.terms', locale)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={t('auth.createAccount', locale)}
      >
        <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
          {isLoading ? t('auth.register.submitting', locale) : t('auth.createAccount', locale)}
        </Text>
      </TouchableOpacity>

      <View style={styles.registerRow}>
        <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
          {t('auth.register.alreadyAccount', locale)}{' '}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('signIn')}
          accessibilityRole="button"
          accessibilityLabel={t('auth.signIn', locale)}
        >
          <Text style={[styles.registerLink, { color: colors.primary }]}>
            {t('auth.signIn', locale)}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing[6], gap: spacing[3] },
  backButton: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    marginBottom: spacing[4],
  },
  title: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    marginBottom: spacing[4],
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: shapes.sm,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  errorIcon: { fontSize: 18 },
  errorText: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
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
  helper: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: spacing[1],
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginVertical: spacing[3],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { fontWeight: 'bold', fontSize: 14 },
  termsText: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[4],
  },
  registerText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
  },
  registerLink: {
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
  },
});
