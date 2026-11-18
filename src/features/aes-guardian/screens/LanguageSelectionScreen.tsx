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
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import {
  aesColors,
  aesTypography,
  aesSpacing,
  aesRadii,
  aesShadows,
} from '../../../theme/tokens';
import {
  useLocale,
  setLocale,
  SupportedLocale,
  SUPPORTED_LOCALES,
  t,
  isRTL,
} from '../../../localization';
import { AesScreenContainer, AesButton } from '../components';
import { RootStackParamList } from '../../../navigation/routes';

interface LanguageOption {
  code: SupportedLocale;
  nativeLabel: string;
  sublabel: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'fr', nativeLabel: 'Français', sublabel: 'Langue par défaut du protocole' },
  { code: 'en', nativeLabel: 'English', sublabel: 'International demonstration' },
  { code: 'ar', nativeLabel: 'العربية', sublabel: 'النسخة العربية الكاملة' },
];

export const LanguageSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeLocale = useLocale();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLocale>(activeLocale);
  const rtl = isRTL(selectedLanguage);

  const handleSelectLanguage = (code: SupportedLocale) => {
    setSelectedLanguage(code);
    setLocale(code);
  };

  const handleContinue = () => {
    navigation.navigate('aesWelcomeCarousel' as any);
  };

  return (
    <AesScreenContainer testID="aes-language-selection-screen">
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.overline, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('onboarding.lang.overline', selectedLanguage)}
          </Text>
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('onboarding.lang.title', selectedLanguage)}
          </Text>
          <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('onboarding.lang.subtitle', selectedLanguage)}
          </Text>
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
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
                activeOpacity={0.8}
                testID={`lang-select-${lang.code}`}
                accessibilityRole="button"
                accessibilityLabel={`${lang.nativeLabel} - ${lang.sublabel}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.cardTextColumn}>
                  <Text
                    style={[
                      styles.massiveWord,
                      isSelected ? styles.massiveWordSelected : styles.massiveWordUnselected,
                      { textAlign: lang.code === 'ar' ? 'right' : 'left' },
                    ]}
                  >
                    {lang.nativeLabel}
                  </Text>
                  <Text
                    style={[
                      styles.langSublabel,
                      isSelected ? styles.langSublabelSelected : styles.langSublabelUnselected,
                      { textAlign: lang.code === 'ar' ? 'right' : 'left' },
                    ]}
                  >
                    {lang.sublabel}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected ? styles.radioCircleSelected : styles.radioCircleUnselected,
                  ]}
                >
                  {isSelected ? (
                    <Icon name="check" size={16} color={aesColors.textInverse} />
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

const styles = StyleSheet.create({
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
    color: aesColors.accentGreen,
    letterSpacing: 1.2,
  },
  title: {
    ...aesTypography.heading1,
    color: aesColors.textPrimary,
  },
  subtitle: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
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
    backgroundColor: aesColors.surface,
    ...aesShadows.card,
  },
  languageCardUnselected: {
    borderColor: aesColors.borderSubdued,
  },
  languageCardSelected: {
    borderColor: aesColors.accentGreen,
    backgroundColor: '#FAFDF9',
  },
  cardTextColumn: {
    flex: 1,
    gap: aesSpacing.xs,
  },
  massiveWord: {
    fontFamily: aesTypography.displayLarge.fontFamily,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  massiveWordSelected: {
    color: aesColors.textPrimary,
  },
  massiveWordUnselected: {
    color: aesColors.textSecondary,
    opacity: 0.8,
  },
  langSublabel: {
    ...aesTypography.bodySmall,
    fontSize: 13,
  },
  langSublabelSelected: {
    color: aesColors.accentGreen,
    fontWeight: '500',
  },
  langSublabelUnselected: {
    color: aesColors.textTertiary,
  },
  radioCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: aesSpacing.md,
  },
  radioCircleUnselected: {
    borderColor: aesColors.borderMedium,
    backgroundColor: 'transparent',
  },
  radioCircleSelected: {
    borderColor: aesColors.accentGreen,
    backgroundColor: aesColors.accentGreen,
  },
  bottomBar: {
    paddingTop: aesSpacing.md,
    paddingBottom: aesSpacing.sm,
  },
});
