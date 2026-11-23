import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { spacing } from '../../../theme/tokens';
import { BreathingAnimation } from '../widgets/BreathingAnimation';
import { AppButton } from '../../../components';
import { AppIcon } from '../../../components/AppIcon';
import { AppText } from '../../../components/AppText';
import { useTheme } from '../../../theme/ThemeContext';
import { t, useLocale } from '../../../localization';

export default function AuthGateScreen({ navigation }: any) {
  const { colors } = useTheme();
  const locale = useLocale();
  const styles = createStyles(colors);
  const [showDemoShortcuts, setShowDemoShortcuts] = useState(false);
  const navigateToSignUp = () => navigation.navigate('signUp');
  const navigateToSignIn = () => navigation.navigate('signIn');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.brand}>
        <BreathingAnimation size={112} />
        <AppText variant="display" style={{ color: colors.primary }}>Sanad</AppText>
        <AppText variant="body" tone="muted" style={styles.subtitle}>
          {t('authGate.subtitle', locale)}
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppButton title={t('authGate.getStarted', locale)} onPress={navigateToSignUp} variant="primary" fullWidth />
        <AppButton title={t('authGate.signIn', locale)} onPress={navigateToSignIn} variant="outline" fullWidth />
        <AppButton
          title={t('authGate.aesDemo', locale)}
          onPress={() => navigation.navigate('aesGuardianWorkspace')}
          variant="secondary"
          fullWidth
        />
        <TouchableOpacity
          style={styles.secondaryLink}
          onPress={() => navigation.navigate('aesSplash')}
          accessibilityRole="button"
        >
          <AppText variant="label" tone="secondary">{t('authGate.aesTour', locale)}</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoToggle}
          onPress={() => setShowDemoShortcuts((visible) => !visible)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showDemoShortcuts }}
          accessibilityLabel={t(
            showDemoShortcuts ? 'authGate.hideDemoShortcuts' : 'authGate.moreDemoShortcuts',
            locale,
          )}
          testID="auth-demo-shortcuts-toggle"
        >
          <AppText variant="label" tone="muted">
            {t(
              showDemoShortcuts ? 'authGate.hideDemoShortcuts' : 'authGate.moreDemoShortcuts',
              locale,
            )}
          </AppText>
          <AppIcon
            name={showDemoShortcuts ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
        {showDemoShortcuts ? (
          <View style={styles.demoShortcuts}>
            <AppButton title={t('authGate.declarations', locale)} onPress={() => navigation.navigate('declarations')} variant="ghost" fullWidth />
            <AppButton title={t('authGate.adminReview', locale)} onPress={() => navigation.navigate('adminReviewQueue')} variant="ghost" fullWidth />
            <AppButton title={t('authGate.ohCoordination', locale)} onPress={() => navigation.navigate('ohCoordinationQueue')} variant="ghost" fullWidth />
            <AppButton title={t('authGate.surveillance', locale)} onPress={() => navigation.navigate('surveillanceDashboard')} variant="ghost" fullWidth />
            <AppButton title={t('authGate.prevention', locale)} onPress={() => navigation.navigate('preventionOverview')} variant="ghost" fullWidth />
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => Alert.alert(
          t('authGate.emergencyTitle', locale),
          t('authGate.emergencyMessage', locale),
          [{ text: t('authGate.close', locale) }],
        )}
        accessibilityRole="button"
      >
        <View style={styles.emergencyRow}>
          <AppIcon name="alert-circle" size={16} color={colors.destructive} />
          <AppText variant="label" style={styles.emergencyText}>
            {t('authGate.needImmediateHelp', locale)}
          </AppText>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      padding: spacing.lg,
      justifyContent: 'space-between',
    },
    brand: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    subtitle: {
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    actions: {
      gap: spacing.sm,
      width: '100%',
    },
    secondaryLink: {
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    demoToggle: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      marginTop: spacing.xs,
    },
    demoShortcuts: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    emergencyButton: {
      marginTop: spacing.md,
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
    },
  });
}
