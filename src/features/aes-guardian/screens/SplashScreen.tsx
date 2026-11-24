/**
 * AES Guardian — Screen 1.1: Splash Screen
 *
 * Minimalist full-bleed clinical green branding entry canvas
 * per UI Blueprint Screen 1.1 and Reference Mapping: Phantom iOS Onboarding 0.png.
 *
 * Behavior:
 * - Checks persistent first-launch state via onboardingStorage.
 * - Navigates to `aesLanguageSelect` on first launch or `aesGuardianWorkspace` on return.
 * - Pure branding canvas with zero third-party spinners or logos.
 */

import AppText from '../../../components/AppText';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIcon } from '../../../components/AppIcon';
import { aesColors, aesTypography, aesSpacing, aesRadii } from '../../../theme/tokens';
import { isFirstLaunchCompleted } from '../utils/onboardingStorage';
import { t, useLocale, useLayoutDirection } from '../../../localization';
import { RootStackParamList } from '../../../navigation/routes';

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'aesSplash'>>();
  const locale = useLocale();
  const layoutDirection = useLayoutDirection();
  const [isProceeding, setIsProceeding] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleProceed = useCallback(async () => {
    if (isProceeding) return;
    setIsProceeding(true);

    try {
      // Replay route param from profile/settings bypasses the firstLaunch check to allow re-visiting onboarding
      const isReplay = route.params?.replay === true;
      if (isReplay) {
        if (isMountedRef.current) {
          navigation.replace('aesLanguageSelect' as any);
        }
        return;
      }

      const completed = await isFirstLaunchCompleted();
      if (!isMountedRef.current) return;

      if (!completed) {
        navigation.replace('aesLanguageSelect' as any);
      } else {
        navigation.replace('aesGuardianWorkspace' as any);
      }
    } catch {
      // Storage failure fails closed/safe to the onboarding sequence
      if (isMountedRef.current) {
        navigation.replace('aesLanguageSelect' as any);
      }
    } finally {
      if (isMountedRef.current) {
        setIsProceeding(false);
      }
    }
  }, [navigation, isProceeding, route.params]);

  return (
    <SafeAreaView style={styles.canvas} testID="aes-splash-screen">
      <StatusBar barStyle="light-content" backgroundColor={aesColors.accentGreen} />
      
      <TouchableOpacity
        style={styles.touchableArea}
        activeOpacity={0.95}
        onPress={handleProceed}
        accessibilityRole="button"
        accessibilityLabel="AES Guardian Splash - Appuyer pour continuer"
      >
        <View style={styles.centerBlock}>
          {/* Clinical Shield Mark */}
          <View style={styles.shieldContainer} testID="aes-splash-shield">
            <AppIcon name="shield" size={48} color={aesColors.textInverse} />
          </View>

          {/* Serif Wordmark */}
          <AppText style={styles.wordmark} testID="aes-splash-wordmark">
            {t('splash.wordmark', locale)}
          </AppText>

          {/* Institutional Subtitle */}
          <AppText style={styles.subtitle} testID="aes-splash-subtitle">
            {t('splash.subtitle', locale)}
          </AppText>
        </View>

        {/* Bottom Entry Action */}
        <View style={styles.bottomBar}>
          <View style={styles.enterPill}>
            <AppText style={styles.enterPillText}>
              {t('splash.enter', locale)}
            </AppText>
            <AppIcon
              name="forward"
              size={16}
              color={aesColors.accentGreen}
              testID="aes-splash-forward-icon"
            />
          </View>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: aesColors.accentGreen,
  },
  touchableArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingVertical: aesSpacing.screenVertical,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: aesSpacing.sm,
  },
  shieldContainer: {
    width: 80,
    height: 80,
    borderRadius: aesRadii.card,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: aesSpacing.md,
  },
  wordmark: {
    ...aesTypography.display1,
    color: aesColors.textInverse,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...aesTypography.bodySmall,
    color: '#E8F5E9',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: aesSpacing.xl,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: aesSpacing.xl,
  },
  enterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: aesSpacing.sm,
    backgroundColor: aesColors.textInverse,
    paddingVertical: aesSpacing.sm,
    paddingHorizontal: aesSpacing.xl,
    borderRadius: aesRadii.pill,
  },
  enterPillText: {
    ...aesTypography.buttonSmall,
    color: aesColors.accentGreen,
    fontWeight: '700',
  },
});
