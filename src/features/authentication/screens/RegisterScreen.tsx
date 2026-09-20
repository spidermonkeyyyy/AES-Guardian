import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { spacing, shapes, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../hooks/use-auth-store';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
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
    if (!name.trim()) return 'Full name is required';
    if (!email.trim() || !email.includes('@') || !email.includes('.')) return 'Enter a valid email address';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Include both letters and numbers';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!agreedToTerms) return 'Please agree to the terms to continue';
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
      <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={[styles.backButton, { color: colors.foreground }]}>← Retour</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.foreground }]}>Join Sanad</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create your account to start monitoring your health.</Text>

      {displayError && (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '4D' }]}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{displayError}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder="Jane Doe"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
          textContentType="name"
          accessibilityLabel="Full name"
        />
      </View>

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
          accessibilityLabel="Email"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder="••••••••"
          placeholderTextColor={colors.mutedForeground}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          accessibilityLabel="Password"
        />
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>At least 8 characters with letters and numbers</Text>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>Confirm Password</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder="••••••••"
          placeholderTextColor={colors.mutedForeground}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          accessibilityLabel="Confirm password"
        />
      </View>

      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreedToTerms }}
        accessibilityLabel="Agree to terms"
      >
        <View style={[styles.checkbox, { borderColor: colors.border }, agreedToTerms && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          {agreedToTerms && <Text style={[styles.checkmark, { color: colors.primaryForeground }]}>✓</Text>}
        </View>
        <Text style={[styles.termsText, { color: colors.foreground }]}>
          I agree to the Terms of Service and Privacy Policy
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel="Create account"
      >
        <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>{isLoading ? 'Creating...' : 'Create Account'}</Text>
      </TouchableOpacity>

      <View style={styles.registerRow}>
        <Text style={[styles.registerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('signIn')} accessibilityRole="button" accessibilityLabel="Sign in">
          <Text style={[styles.registerLink, { color: colors.primary }]}>Sign In</Text>
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
