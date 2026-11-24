/**
 * AES Guardian — Screen 1.2: Language Selection Screen
 *
 * Dedicated first-launch language selector before role selection
 * per UI Blueprint Screen 1.2 and Reference Mapping: Doji iOS Updating shopping preferences 1.png.
 *
 * Visual Pattern:
 * - Massive stacked words in editorial typography (Français, English, العربية).
 * - Real-time locale switching upon selection via localization store.
 * - Sticky bottom pill action to proceed to Welcome Carousel.
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIcon } from '../../../components/AppIcon';
import { aesTypography, aesSpacing, aesRadii } from '../../../theme/tokens';
import {
  useLocale,
  setLocale,
  persistLocale,
  SupportedLocale,
  t,
  isRTL,
} from '../../../localization';
import { AesScreenContainer, AesButton } from '../components';
import { RootStackParamList } from '../../../navigation/routes';
import { useTheme } from '../../../theme/ThemeContext';

import AppText from '../../../components/AppText';
interface LanguageOption {
  code: SupportedLocale;
  nativeLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'fr', nativeLabel: 'Français' },
  { code: 'en', nativeLabel: 'English' },
  { code: 'ar', nativeLabel: 'العربية' },
];

export const LanguageSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeLocale = useLocale();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLocale>(activeLocale);
  const rtl = isRTL(selectedLanguage);

  const handleSelectLanguage = (code: SupportedLocale) => {
    setSelectedLanguage(code);
    setLocale(code);
    void persistLocale(code);
  };

  const handleContinue = () => {
    navigation.navigate('aesDisclaimer');
  };

  return (
    <AesScreenContainer testID="aes-language-selection-screen">
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <AppText style={[styles.overline, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('onboarding.lang.overline', selectedLanguage)}
          </AppText>
          <AppText style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('onboarding.lang.title', selectedLanguage)}
          </AppText>
          <AppText style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('onboarding.lang.subtitle', selectedLanguage)}
          </AppText>
        </View>

        {/* Stacked Massive Words (Doji iOS pattern) */}
        <View style={styles.languageList}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageCard,
                  isSelected ? styles.languageCardSelected : styles.languageCardUnselected,
                  { flexDirection: rtl ? 'row-reverse' : 'row' },
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
                activeOpacity={0.8}
                testID={`lang-select-${lang.code}`}
                accessibilityRole="button"
                accessibilityLabel={lang.nativeLabel}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.cardTextColumn}>
                  <AppText
                    style={[
                      styles.massiveWord,
                      isSelected ? styles.massiveWordSelected : styles.massiveWordUnselected,
                      { textAlign: lang.code === 'ar' ? 'right' : 'left' },
                    ]}
                  >
                    {lang.nativeLabel}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected ? styles.radioCircleSelected : styles.radioCircleUnselected,
                  ]}
                  testID={`lang-radio-${lang.code}`}
                >
                  {isSelected ? (
                      <AppIcon name="check" size={16} color={colors.primaryForeground} />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sticky Bottom Action */}
        <View style={styles.bottomBar}>
          <AesButton
            title={t('onboarding.continue', selectedLanguage)}
            onPress={handleContinue}
            variant="primary"
            testID="lang-continue-button"
          />
        </View>
      </View>
    </AesScreenContainer>
  );
};

function createStyles(colors: ReturnType<typeof import('../../../theme/tokens/colors').getThemeColors>) {
  return StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: aesSpacing.screenHorizontal,
      paddingVertical: aesSpacing.screenVertical,
    },
    header: {
      paddingTop: aesSpacing.md,
      marginBottom: aesSpacing.xl,
      gap: aesSpacing.xs,
    },
    overline: {
      ...aesTypography.overline,
      color: colors.primary,
      letterSpacing: 1.2,
    },
    title: {
      ...aesTypography.heading1,
      color: colors.foreground,
    },
    subtitle: {
      ...aesTypography.bodySmall,
      color: colors.mutedForeground,
      marginTop: aesSpacing.xs,
    },
    languageList: {
      flex: 1,
      justifyContent: 'center',
      gap: aesSpacing.md,
    },
    languageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: aesSpacing.xl,
      paddingHorizontal: aesSpacing.xl,
      borderRadius: aesRadii.card,
      borderWidth: 1.5,
    },
    languageCardUnselected: {
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    languageCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.secondary,
    },
    cardTextColumn: {
      flex: 1,
    },
    massiveWord: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
    },
    massiveWordSelected: {
      color: colors.foreground,
    },
    massiveWordUnselected: {
      color: colors.mutedForeground,
    },
    radioCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginStart: aesSpacing.md,
    },
    radioCircleUnselected: {
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    radioCircleSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    bottomBar: {
      paddingTop: aesSpacing.md,
      paddingBottom: aesSpacing.sm,
    },
  });
}
