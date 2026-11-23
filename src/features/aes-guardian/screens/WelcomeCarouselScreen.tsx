/**
 * AES Guardian — Screen 1.3: Welcome & Introduction Carousel
 *
 * 3-slide value-proposition carousel introducing AES governance,
 * confidential occupational health tracking, and hospital prevention
 * per UI Blueprint Screen 1.3 and Reference Mapping: Hinge iOS Onboarding 1.png.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { useLocale, t, isRTL, TranslationKey } from '../../../localization';
import {
  AesScreenContainer,
  AesButton,
  AesRoundArrowButton,
} from '../components';
import { RootStackParamList } from '../../../navigation/routes';

interface CarouselSlideData {
  iconName: string;
  titleKey: TranslationKey;
  bulletKeys: [TranslationKey, TranslationKey, TranslationKey];
  badgeText: string;
}

const SLIDES: CarouselSlideData[] = [
  {
    iconName: 'shield',
    titleKey: 'onboarding.carousel.slide1.title',
    bulletKeys: [
      'onboarding.carousel.slide1.bullet1',
      'onboarding.carousel.slide1.bullet2',
      'onboarding.carousel.slide1.bullet3',
    ],
    badgeText: '01 / 03',
  },
  {
    iconName: 'activity',
    titleKey: 'onboarding.carousel.slide2.title',
    bulletKeys: [
      'onboarding.carousel.slide2.bullet1',
      'onboarding.carousel.slide2.bullet2',
      'onboarding.carousel.slide2.bullet3',
    ],
    badgeText: '02 / 03',
  },
  {
    iconName: 'bar-chart-2',
    titleKey: 'onboarding.carousel.slide3.title',
    bulletKeys: [
      'onboarding.carousel.slide3.bullet1',
      'onboarding.carousel.slide3.bullet2',
      'onboarding.carousel.slide3.bullet3',
    ],
    badgeText: '03 / 03',
  },
];

export const WelcomeCarouselScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeSlide = SLIDES[currentIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      navigation.navigate('aesDisclaimer' as any);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    navigation.navigate('aesDisclaimer' as any);
  };

  return (
    <AesScreenContainer testID="aes-welcome-carousel-screen">
      <View style={styles.content}>
        {/* Top Bar with Skip Action */}
        <View style={styles.topBar}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{activeSlide.badgeText}</Text>
          </View>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            testID="carousel-skip-button"
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.carousel.skip', locale)}
          >
            <Text style={styles.skipText}>
              {t('onboarding.carousel.skip', locale)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Editorial Value Card (Hinge iOS pattern) */}
        <View style={styles.cardContainer} testID={`carousel-slide-${currentIndex}`}>
          <View style={styles.iconCircle}>
            <Icon
              name={activeSlide.iconName}
              size={36}
              color={aesColors.accentGreen}
            />
          </View>

          <Text
            style={[
              styles.slideTitle,
              { textAlign: rtl ? 'right' : 'left' },
            ]}
          >
            {t(activeSlide.titleKey, locale)}
          </Text>

          {/* Key Value Proposition Bullets */}
          <View style={styles.bulletList}>
            {activeSlide.bulletKeys.map((bKey, idx) => (
              <View
                key={idx}
                style={[
                  styles.bulletRow,
                  { flexDirection: rtl ? 'row-reverse' : 'row' },
                ]}
              >
                <View style={styles.checkCircle}>
                  <Icon name="check" size={14} color={aesColors.accentGreen} />
                </View>
                <Text
                  style={[
                    styles.bulletText,
                    { textAlign: rtl ? 'right' : 'left' },
                  ]}
                >
                  {t(bKey, locale)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Paging & Action Bar */}
        <View style={styles.bottomBar}>
          {/* 3-Dot Pagination Indicator */}
          <View style={styles.paginationRow}>
            {SLIDES.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.paginationDot,
                    isActive && styles.paginationDotActive,
                  ]}
                />
              );
            })}
          </View>

          {/* Action Trigger */}
          <View style={styles.actionContainer}>
            {isLastSlide ? (
              <AesButton
                title={t('onboarding.carousel.start', locale)}
                onPress={handleNext}
                variant="primary"
                fullWidth={false}
                style={styles.startButton}
                testID="carousel-start-button"
              />
            ) : (
              <AesRoundArrowButton
                onPress={handleNext}
                variant="black"
                testID="carousel-next-button"
                accessibilityLabel={t('onboarding.carousel.next', locale)}
              />
            )}
          </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: aesSpacing.sm,
    paddingBottom: aesSpacing.md,
  },
  stepBadge: {
    backgroundColor: aesColors.surfaceSubdued,
    paddingHorizontal: aesSpacing.md,
    paddingVertical: aesSpacing.xs,
    borderRadius: aesRadii.chip,
  },
  stepBadgeText: {
    ...aesTypography.code,
    fontSize: 12,
    color: aesColors.textSecondary,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: aesSpacing.xs,
    paddingHorizontal: aesSpacing.md,
  },
  skipText: {
    ...aesTypography.buttonSmall,
    color: aesColors.textSecondary,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    padding: aesSpacing.xl,
    justifyContent: 'center',
    marginVertical: aesSpacing.md,
    ...aesShadows.card,
    borderWidth: 1,
    borderColor: aesColors.borderSubdued,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: aesColors.accentGreenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: aesSpacing.lg,
  },
  slideTitle: {
    ...aesTypography.heading1,
    color: aesColors.textPrimary,
    marginBottom: aesSpacing.sm,
  },
  bulletList: {
    gap: aesSpacing.md,
    paddingTop: aesSpacing.xs,
  },
  bulletRow: {
    alignItems: 'center',
    gap: aesSpacing.md,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: aesColors.accentGreenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    ...aesTypography.bodySmall,
    color: aesColors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: aesSpacing.lg,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: aesSpacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: aesColors.borderMedium,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: aesColors.primaryAction,
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  startButton: {
    minWidth: 160,
  },
});
