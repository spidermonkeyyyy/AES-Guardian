import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { spacing, shapes, typography } from '../../../theme/tokens';
import { useAuthStore } from '../hooks/use-auth-store';
import { login } from '../hooks/use-auth';
import { SanadLogo, AppInput, AppButton } from '../../../components';
import { AppIcon } from '../../../components/AppIcon';
import { useTheme } from '../../../theme/ThemeContext';
import { t, useLocale } from '../../../localization';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorMessage = useAuthStore((s) => s.errorMessage);

  const displayError = clientError || errorMessage;

  const validateEmail = (value: string) => {
    if (!value.trim()) return t('auth.error.emailRequired', locale);
    if (!value.includes('@') || !value.includes('.')) return t('auth.error.emailInvalid', locale);
    return null;
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) return t('auth.error.passwordRequired', locale);
    if (value.length < 6) return t('auth.error.passwordMin6', locale);
    return null;
  };

  const handleLogin = async () => {
    setClientError(null);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr || passErr) {
      setClientError(emailErr || passErr);
      return;
    }
    setIsLoading(true);
    await login(email.trim(), password);
    setIsLoading(false);
  };

  const fillMockCredentials = (mockEmail: string, mockPassword: string) => {
    setEmail(mockEmail);
    setPassword(mockPassword);
    setClientError(null);
    useAuthStore.getState().clearError();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.logoRow}>
        <SanadLogo size="medium" />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>{t('auth.login.title', locale)}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t('auth.login.subtitle', locale)}</Text>

      {displayError && (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '4D' }]}>
          <AppIcon name="alert-circle" size={18} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{displayError}</Text>
        </View>
      )}

      <AppInput
        label={t('auth.email', locale)}
        placeholder={t('auth.emailPlaceholder', locale)}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        leftIcon="mail"
      />

      <AppInput
        label={t('auth.password', locale)}
        placeholder={t('auth.passwordPlaceholder', locale)}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        leftIcon="lock"
      />

      <TouchableOpacity
        style={styles.forgotRow}
        onPress={() => navigation.navigate('forgotPassword')}
        accessibilityRole="button"
      >
        <Text style={[styles.forgotText, { color: colors.primary }]}>
          {t('auth.login.forgotPassword', locale)}
        </Text>
      </TouchableOpacity>

      <AppButton
        title={t('auth.signIn', locale)}
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading}
        variant="primary"
        fullWidth
      />

      <View style={styles.registerRow}>
        <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
          {t('auth.login.noAccount', locale)}{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('signUp')} accessibilityRole="button">
          <Text style={[styles.registerLink, { color: colors.primary }]}>
            {t('auth.createAccount', locale)}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mockBar, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.mockTitle, { color: colors.foreground }]}>
          {t('auth.login.demoAccounts', locale)}
        </Text>
        <View style={styles.mockRow}>
          <TouchableOpacity
            style={[styles.mockButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => fillMockCredentials('patient@respiracare.org', 'password123')}
            accessibilityRole="button"
          >
            <AppIcon name="user" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.mockButtonText, { color: colors.foreground }]}>
              {t('auth.login.patientDemo', locale)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mockButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => fillMockCredentials('nurse@respiracare.org', 'password123')}
            accessibilityRole="button"
          >
            <AppIcon name="activity" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.mockButtonText, { color: colors.foreground }]}>
              {t('auth.login.nurseDemo', locale)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  logoRow: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.xs,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: shapes.sm,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  forgotRow: { alignSelf: 'flex-end', marginBottom: spacing.xs },
  forgotText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
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
  mockBar: {
    borderRadius: shapes.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  mockTitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  mockRow: { flexDirection: 'row', gap: spacing.sm },
  mockButton: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: shapes.sm,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockButtonText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
