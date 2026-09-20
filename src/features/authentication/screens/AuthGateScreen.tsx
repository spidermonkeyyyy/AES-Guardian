import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { spacing, typography } from '../../../theme/tokens';
import { BreathingAnimation } from '../widgets/BreathingAnimation';
import { AppButton } from '../../../components';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../../theme/ThemeContext';

export default function AuthGateScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const navigateToSignUp = () => navigation.navigate('signUp');
  const navigateToSignIn = () => navigation.navigate('signIn');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.spacer} />
      <View style={styles.logoContainer}>
        <BreathingAnimation size={140} />
      </View>
      <Text style={[styles.title, { color: colors.primary }]}>Sanad</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Nurse-led respiratory monitoring</Text>
      <View style={styles.spacer} />
      
      <View style={styles.buttonContainer}>
        <AppButton
          title="Get Started"
          onPress={navigateToSignUp}
          variant="primary"
          fullWidth
        />
        <AppButton
          title="I already have an account"
          onPress={navigateToSignIn}
          variant="outline"
          fullWidth
        />
      </View>

      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() =>
          Alert.alert(
            'Emergency',
            'If you are experiencing severe breathing difficulty, please call your local emergency number immediately.\n\nSanad is not a replacement for emergency medical services.',
            [{ text: 'Close' }]
          )
        }
      >
        <View style={styles.emergencyRow}>
          <Icon name="alert-circle" size={16} color="colors.destructive" />
          <Text style={styles.emergencyText}>Need immediate help?</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: any) {
  return {
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  spacer: { flex: 1 },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  buttonContainer: {
    gap: spacing.sm,
    width: '100%',
  },
  emergencyButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emergencyText: {
    color: colors.destructive,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
  },
}
}
