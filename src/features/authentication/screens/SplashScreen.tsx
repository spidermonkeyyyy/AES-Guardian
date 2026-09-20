import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { spacing, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuthStore } from '../hooks/use-auth-store';
import { BreathingAnimation } from '../widgets/BreathingAnimation';

export default function SplashScreen({ navigation }: any) {
  const { colors } = useTheme();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'authenticated' && user) {
        if (user.role === 'nurse' || user.role === 'pneumologist' || user.role === 'admin') {
          navigation.replace('nurseTabs');
        } else {
          navigation.replace('patientTabs');
        }
      } else if (status === 'unauthenticated' || status === 'error') {
        navigation.replace('authGate');
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [status, user, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.spacer} />
      <View style={styles.logoContainer}>
        <BreathingAnimation size={140} />
      </View>
      <Text style={[styles.wordmark, { color: colors.primary }]}>Sanad</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>سند — RespiraCare</Text>
      <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Breathe easier with remote care</Text>
      <View style={styles.spacer} />
      <ActivityIndicator size="small" color={colors.primary} style={styles.indicator} />
      <Text style={[styles.version, { color: colors.mutedForeground }]}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.screenPadding,
    alignItems: 'center',
  },
  spacer: { flex: 1 },
  logoContainer: {
    marginBottom: spacing.md,
  },
  wordmark: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: 2,
  },
  tagline: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  indicator: {
    marginVertical: spacing.sm,
  },
  version: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing.md,
    opacity: 0.5,
  },
});
