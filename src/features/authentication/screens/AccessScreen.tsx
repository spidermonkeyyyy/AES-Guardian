import AppText from '../../../components/AppText';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/routes';
import {
  getLayoutTextAlign,
  t,
  useLayoutDirection,
  useLocale,
} from '../../../localization';
import { getAppFontFamily, spacing, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';

type AccessNavigation = NativeStackNavigationProp<RootStackParamList, 'access'>;

export default function AccessScreen() {
  const navigation = useNavigation<AccessNavigation>();
  const locale = useLocale();
  const direction = useLayoutDirection();
  const { colors } = useTheme();
  const styles = createStyles(colors, direction, locale);

  const showPrototypeSignInNotice = () => {
    Alert.alert(
      t('access.signInUnavailable.title', locale),
      t('access.signInUnavailable.message', locale),
      [{ text: t('access.close', locale) }],
    );
  };

  return (
    <SafeAreaView style={styles.container} testID="sanad-access-screen">
      <View style={styles.content}>
        <AppText style={styles.title} accessibilityRole="header">
          {t('access.title', locale)}
        </AppText>
        <AppText style={styles.subtitle}>{t('access.subtitle', locale)}</AppText>

        <View style={styles.choices}>
          <TouchableOpacity
            testID="access-sign-in"
            accessibilityRole="button"
            accessibilityLabel={`${t('access.signIn', locale)}. ${t('access.signInDescription', locale)}`}
            onPress={showPrototypeSignInNotice}
            style={styles.choice}
          >
            <AppText style={styles.choiceTitle}>{t('access.signIn', locale)}</AppText>
            <AppText style={styles.choiceDescription}>{t('access.signInDescription', locale)}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            testID="access-demo"
            accessibilityRole="button"
            accessibilityLabel={`${t('access.demo', locale)}. ${t('access.demoDescription', locale)}`}
            onPress={() => navigation.navigate('aesDemoPicker')}
            style={[styles.choice, styles.demoChoice]}
          >
            <AppText style={styles.demoTitle}>{t('access.demo', locale)}</AppText>
            <AppText style={styles.demoDescription}>{t('access.demoDescription', locale)}</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  direction: 'ltr' | 'rtl',
  locale: ReturnType<typeof useLocale>,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.xl,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: spacing.xl,
    },
    title: {
      color: colors.foreground,
      fontFamily: getAppFontFamily('display', locale),
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      textAlign: getLayoutTextAlign(direction),
    },
    subtitle: {
      color: colors.mutedForeground,
      fontFamily: getAppFontFamily('body', locale),
      fontSize: typography.fontSize.md,
      lineHeight: 24,
      marginTop: spacing.sm,
      textAlign: getLayoutTextAlign(direction),
      writingDirection: direction,
    },
    choices: {
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    choice: {
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      backgroundColor: colors.card,
      minHeight: 104,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    choiceTitle: {
      color: colors.foreground,
      fontFamily: getAppFontFamily('body', locale),
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      textAlign: getLayoutTextAlign(direction),
      writingDirection: direction,
    },
    choiceDescription: {
      color: colors.mutedForeground,
      fontFamily: getAppFontFamily('body', locale),
      fontSize: typography.fontSize.sm,
      lineHeight: 21,
      marginTop: spacing.xs,
      textAlign: getLayoutTextAlign(direction),
      writingDirection: direction,
    },
    demoChoice: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    demoTitle: {
      color: colors.primaryForeground,
      fontFamily: getAppFontFamily('body', locale),
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      textAlign: getLayoutTextAlign(direction),
      writingDirection: direction,
    },
    demoDescription: {
      color: colors.primaryForeground,
      fontFamily: getAppFontFamily('body', locale),
      fontSize: typography.fontSize.sm,
      lineHeight: 21,
      marginTop: spacing.xs,
      opacity: 0.9,
      textAlign: getLayoutTextAlign(direction),
      writingDirection: direction,
    },
  });
}
