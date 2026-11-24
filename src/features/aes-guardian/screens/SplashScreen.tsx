/**
 * SANAD — canonical application welcome
 *
 * The database initializes behind this screen so SANAD is the first rendered
 * experience. Navigation remains disabled until initialization succeeds.
 */

import AppText from '../../../components/AppText';
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIcon } from '../../../components/AppIcon';
import { SanadLogo } from '../../../components/SanadLogo';
import { aesColors, aesSpacing, aesRadii } from '../../../theme/tokens';
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
      <StatusBar barStyle="light-content" backgroundColor={aesColors.accentGreen} />
      <View style={styles.page}>
        <View style={styles.languageBar}>
          <View
            style={[
              styles.languageSelector,
              { flexDirection: layoutDirection === 'rtl' ? 'row-reverse' : 'row' },
            ]}
            accessibilityRole="radiogroup"
            accessibilityLabel={t('splash.languageSelector', locale)}
          >
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
          <SanadLogo
            size="large"
            showText={false}
            style={styles.logo}
            testID="sanad-splash-logo"
          />
          <AppText typographyRole="hero" style={styles.wordmark} testID="aes-splash-wordmark">
            {t('splash.wordmark', locale)}
          </AppText>
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
              <ActivityIndicator color={aesColors.textInverse} testID="welcome-db-loading" />
              <AppText variant="caption" tone="inverse" style={styles.databaseStatusText}>
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
              color={aesColors.accentGreen}
              testID="aes-splash-forward-icon"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: aesColors.accentGreen,
  },
  page: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.screenVertical,
  },
  languageBar: {
    alignItems: 'flex-end',
    minHeight: 44,
  },
  languageSelector: {
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: aesRadii.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.14)',
  },
  languageOption: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: aesSpacing.sm,
    borderRadius: aesRadii.pill,
  },
  selectedLanguageOption: {
    backgroundColor: aesColors.textInverse,
  },
  languageLabel: {
    color: aesColors.textInverse,
    fontSize: 11,
    lineHeight: 16,
  },
  selectedLanguageLabel: {
    color: aesColors.accentGreen,
    fontWeight: '700',
  },
  centerBlock: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: aesSpacing.lg,
    gap: aesSpacing.md,
  },
  logo: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aesColors.textInverse,
    borderRadius: aesRadii.modal,
  },
  wordmark: {
    color: aesColors.textInverse,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#E8F5E9',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: aesSpacing.xl,
  },
  description: {
    color: '#E8F5E9',
    maxWidth: 420,
    textAlign: 'center',
    opacity: 0.88,
    paddingHorizontal: aesSpacing.md,
  },
  databaseStatus: {
    alignItems: 'center',
    marginTop: aesSpacing.md,
    gap: aesSpacing.xs,
  },
  databaseStatusText: {
    color: aesColors.textInverse,
    textAlign: 'center',
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: aesSpacing.xl,
  },
  enterPill: {
    alignItems: 'center',
    gap: aesSpacing.sm,
    backgroundColor: aesColors.textInverse,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: aesSpacing.xl,
    borderRadius: aesRadii.pill,
    alignSelf: 'center',
  },
  enterPillText: {
    color: aesColors.accentGreen,
    fontWeight: '700',
  },
});
