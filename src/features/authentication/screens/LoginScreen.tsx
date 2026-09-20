import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { spacing, shapes, typography } from '../../../theme/tokens';
import { useAuthStore } from '../hooks/use-auth-store';
import { login } from '../hooks/use-auth';
import { SanadLogo, AppInput, AppButton } from '../../../components';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../theme/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorMessage = useAuthStore((s) => s.errorMessage);

  const displayError = clientError || errorMessage;

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Veuillez saisir votre adresse e-mail';
    if (!value.includes('@') || !value.includes('.')) return 'Veuillez saisir une adresse e-mail valide';
    return null;
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) return 'Veuillez saisir votre mot de passe';
    if (value.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
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

      <Text style={[styles.title, { color: colors.foreground }]}>Bienvenue</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Connectez-vous à votre espace Sanad</Text>

      {displayError && (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '4D' }]}>
          <Icon name="alert-circle" size={18} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{displayError}</Text>
        </View>
      )}

      <AppInput
        label="Adresse e-mail"
        placeholder="nom@exemple.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        leftIcon="mail"
      />

      <AppInput
        label="Mot de passe"
        placeholder="••••••••"
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
        <Text style={[styles.forgotText, { color: colors.primary }]}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <AppButton
        title="Se connecter"
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading}
        variant="primary"
        fullWidth
      />

      <View style={styles.registerRow}>
        <Text style={[styles.registerText, { color: colors.mutedForeground }]}>Pas encore de compte ? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('signUp')} accessibilityRole="button">
          <Text style={[styles.registerLink, { color: colors.primary }]}>Créer un compte</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mockBar, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.mockTitle, { color: colors.foreground }]}>Comptes de démonstration (Test rapide)</Text>
        <View style={styles.mockRow}>
          <TouchableOpacity
            style={[styles.mockButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => fillMockCredentials('patient@respiracare.org', 'password123')}
            accessibilityRole="button"
          >
            <Icon name="user" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.mockButtonText, { color: colors.foreground }]}>Compte Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mockButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => fillMockCredentials('nurse@respiracare.org', 'password123')}
            accessibilityRole="button"
          >
            <Icon name="activity" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.mockButtonText, { color: colors.foreground }]}>Compte Infirmier</Text>
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
