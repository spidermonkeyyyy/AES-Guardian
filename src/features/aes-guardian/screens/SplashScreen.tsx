/**
 * SANAD — canonical application welcome
 *
 * The database initializes behind this screen so SANAD is the first rendered
 * experience. Navigation remains disabled until initialization succeeds.
 */

import AppText from '../../../components/AppText';
import React, { useState, useCallback } from 'react';
import {
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIcon } from '../../../components/AppIcon';
import { SanadLogo } from '../../../components/SanadLogo';
import { aesSpacing, aesRadii, darkTheme } from '../../../theme/tokens';
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  SupportedLocale,
  persistLocale,
  setLocale,
  t,
  useLocale,
  useLayoutDirection,
} from '../../../localization';
import { RootStackParamList } from '../../../navigation/routes';

interface SplashScreenProps {
  databaseReady?: boolean;
  databaseError?: string | null;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  databaseReady = true,
  databaseError = null,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'aesSplash'>>();
  const locale = useLocale();
  const layoutDirection = useLayoutDirection();
  const { width, height } = useWindowDimensions();
  const heroSize = Math.max(164, Math.min(340, width * 0.88, height * 0.38));
  const [isProceeding, setIsProceeding] = useState(false);

  const handleProceed = useCallback(async () => {
    if (isProceeding || !databaseReady || databaseError) return;
    setIsProceeding(true);
    if (route.params?.replay === true) {
      navigation.replace('aesLanguageSelect');
    } else {
      navigation.navigate('aesAccess');
    }
    setIsProceeding(false);
  }, [navigation, isProceeding, route.params, databaseReady, databaseError]);

  return (
    <SafeAreaView style={styles.canvas} testID="aes-splash-screen">
      <StatusBar barStyle="light-content" backgroundColor={welcomeColors.canvas} />
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={[styles.brand, { flexDirection: layoutDirection === 'rtl' ? 'row-reverse' : 'row' }]}>
            <SanadLogo
              size="small"
              showText={false}
              style={styles.logoSurface}
              testID="sanad-splash-logo"
            />
            <AppText
              typographyRole="display"
              style={[styles.wordmark, { writingDirection: 'ltr' }]}
              testID="aes-splash-wordmark"
            >
              {t('splash.wordmark', locale)}
            </AppText>
          </View>
          <View
            style={[
              styles.languageSelector,
              { flexDirection: layoutDirection === 'rtl' ? 'row-reverse' : 'row' },
            ]}
            accessibilityRole="radiogroup"
            accessibilityLabel={t('splash.languageSelector', locale)}
            testID="welcome-language-selector"
          >
            <AppIcon
              name="globe"
              size={16}
              color={welcomeColors.secondaryText}
              decorative
              testID="welcome-language-globe"
            />
            {SUPPORTED_LOCALES.map((supportedLocale: SupportedLocale) => {
              const selected = locale === supportedLocale;
              return (
                <TouchableOpacity
                  key={supportedLocale}
                  style={[styles.languageOption, selected && styles.selectedLanguageOption]}
                  onPress={() => {
                    setLocale(supportedLocale);
                    void persistLocale(supportedLocale);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={LOCALE_LABELS[supportedLocale]}
                  accessibilityState={{ selected }}
                  testID={`welcome-language-${supportedLocale}`}
                >
                  <AppText
                    variant="caption"
                    style={[
                      styles.languageLabel,
                      selected && styles.selectedLanguageLabel,
                      { writingDirection: supportedLocale === 'ar' ? 'rtl' : 'ltr' },
                    ]}
                  >
                    {LOCALE_LABELS[supportedLocale]}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.centerBlock}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Image
            source={require('../../../assets/images/welcome/sanad-welcome-illustration.png')}
            style={{ width: heroSize, height: heroSize }}
            resizeMode="contain"
            accessible
            accessibilityRole="image"
            accessibilityLabel={t('splash.heroAccessibility', locale)}
            testID="sanad-welcome-hero"
          />
          <AppText
            variant="section"
            style={styles.tagline}
            testID="aes-splash-tagline"
          >
            {t('splash.tagline', locale)}
          </AppText>
          <AppText
            variant="body"
            style={[
              styles.description,
              { writingDirection: layoutDirection === 'rtl' ? 'rtl' : 'ltr' },
            ]}
            testID="aes-splash-description"
          >
            {t('splash.description', locale)}
          </AppText>
          {databaseError ? (
            <AppText tone="danger" style={styles.databaseStatus} accessibilityRole="alert">
              {`${t('db.error', locale)}: ${databaseError}`}
            </AppText>
          ) : !databaseReady ? (
            <View style={styles.databaseStatus}>
              <ActivityIndicator color={welcomeColors.accent} testID="welcome-db-loading" />
              <AppText variant="caption" style={styles.databaseStatusText}>
                {t('db.initializing', locale)}
              </AppText>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.enterPill,
              { flexDirection: layoutDirection === 'rtl' ? 'row-reverse' : 'row' },
            ]}
            activeOpacity={0.85}
            onPress={handleProceed}
            disabled={!databaseReady || Boolean(databaseError) || isProceeding}
            accessibilityRole="button"
            accessibilityLabel={t('splash.enter', locale)}
            accessibilityState={{ disabled: !databaseReady || Boolean(databaseError) || isProceeding }}
            testID="aes-splash-enter-button"
          >
            <AppText typographyRole="button" style={styles.enterPillText}>
              {t('splash.enter', locale)}
            </AppText>
            <AppIcon
              name="forward"
              size={16}
              color={welcomeColors.buttonText}
              decorative
              testID="aes-splash-forward-icon"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const welcomeColors = {
  canvas: darkTheme.colors.background,
  surface: darkTheme.colors.card,
  border: darkTheme.colors.border,
  primaryText: darkTheme.colors.foreground,
  secondaryText: darkTheme.colors.mutedForeground,
  accent: darkTheme.colors.primary,
  buttonText: darkTheme.colors.primaryForeground,
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: welcomeColors.canvas,
  },
  page: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 30,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: aesSpacing.sm,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
  },
  logoSurface: {
    padding: 4,
    borderRadius: aesRadii.pill,
    borderWidth: 1,
    borderColor: welcomeColors.border,
    backgroundColor: welcomeColors.surface,
  },
  wordmark: {
    color: welcomeColors.primaryText,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 1.1,
  },
  languageSelector: {
    alignItems: 'center',
    gap: 3,
    padding: 4,
    paddingHorizontal: 7,
    borderRadius: aesRadii.pill,
    borderWidth: 1,
    borderColor: welcomeColors.border,
    backgroundColor: welcomeColors.surface,
  },
  languageOption: {
    minWidth: 34,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderRadius: aesRadii.pill,
  },
  selectedLanguageOption: {
    backgroundColor: welcomeColors.accent,
  },
  languageLabel: {
    color: welcomeColors.secondaryText,
    fontSize: 11,
    lineHeight: 16,
  },
  selectedLanguageLabel: {
    color: welcomeColors.buttonText,
    fontWeight: '700',
  },
  centerBlock: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 14,
  },
  tagline: {
    color: welcomeColors.primaryText,
    textAlign: 'center',
    fontSize: 29,
    lineHeight: 38,
    paddingHorizontal: 4,
    maxWidth: 360,
  },
  description: {
    color: welcomeColors.secondaryText,
    maxWidth: 340,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  databaseStatus: {
    alignItems: 'center',
    marginTop: aesSpacing.md,
    gap: aesSpacing.xs,
  },
  databaseStatusText: {
    color: welcomeColors.secondaryText,
    textAlign: 'center',
  },
  bottomBar: {
    alignItems: 'center',
    paddingTop: 8,
  },
  enterPill: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: welcomeColors.accent,
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 18,
    alignSelf: 'stretch',
  },
  enterPillText: {
    color: welcomeColors.buttonText,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
});
