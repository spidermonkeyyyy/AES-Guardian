import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { spacing, shapes, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../hooks/use-auth-store';
import { resetPassword } from '../hooks/use-auth';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorMessage = useAuthStore((s) => s.errorMessage);

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!email.includes('@')) return 'Enter a valid email';
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
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Check your email</Text>
        <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
          We have sent a password reset link to:{'\n'}{email}
        </Text>
        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={[styles.backButton, { color: colors.foreground }]}>← Retour</Text>
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <Text style={styles.icon}>🔒</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Forgot your password?</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Enter your email and we will send you a link to reset your password.
      </Text>

      {(clientError || errorMessage) && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{clientError || errorMessage}</Text>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder="your@email.com"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Email for password reset"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>{isLoading ? 'Sending...' : 'Send Reset Link'}</Text>
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
