import React, { useCallback, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppIcon } from '../../../components/AppIcon';
import AppText from '../../../components/AppText';
import { useLocale, t } from '../../../localization';
import { useTheme } from '../../../theme/ThemeContext';
import { aesSpacing } from '../../../theme/tokens';
import { RootStackParamList } from '../../../navigation/routes';
import { isFirstLaunchCompleted } from '../utils/onboardingStorage';
import { AesButton, AesScreenHeader } from '../components';

export const AccessScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const locale = useLocale();
  const { colors } = useTheme();
  const [isEnteringDemo, setIsEnteringDemo] = useState(false);

  const handleSignIn = useCallback(() => {
    Alert.alert(
      t('access.signInNoticeTitle', locale),
      t('access.signInNoticeBody', locale),
      [{ text: t('app.ok', locale) }],
    );
  }, [locale]);

  const handleDemo = useCallback(async () => {
    if (isEnteringDemo) return;
    setIsEnteringDemo(true);
    try {
      const completed = await isFirstLaunchCompleted();
      navigation.navigate(completed ? 'aesDemoPicker' : 'aesDisclaimer');
    } catch (error) {
      console.warn(
        '[SANAD] Could not read onboarding state; requiring the disclaimer before demo access.',
        error,
      );
      navigation.navigate('aesDisclaimer');
    } finally {
      setIsEnteringDemo(false);
    }
  }, [isEnteringDemo, navigation]);

  return (
    <SafeAreaView style={[styles.canvas, { backgroundColor: colors.background }]} testID="sanad-access-screen">
      <AesScreenHeader
        title={t('access.title', locale)}
        subtitle={t('access.subtitle', locale)}
        onBack={() => navigation.goBack()}
        testID="sanad-access-header"
      />
      <View style={styles.actions}>
        <AesButton
          title={t('access.signIn', locale)}
          onPress={handleSignIn}
          variant="outline"
          icon={<AppIcon name="user" size={20} color={colors.primary} />}
          testID="sanad-access-sign-in"
        />
        <AesButton
          title={t('access.demo', locale)}
          onPress={() => void handleDemo()}
          variant="green"
          loading={isEnteringDemo}
          icon={<AppIcon name="play" size={20} color={colors.successForeground} />}
          testID="sanad-access-demo"
        />
        <AppText
          variant="caption"
          tone="muted"
          style={[styles.syntheticNotice, { color: colors.mutedForeground }]}
        >
          {t('onboarding.picker.syntheticNotice', locale)}
        </AppText>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  actions: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: aesSpacing.screenHorizontal,
    gap: aesSpacing.md,
  },
  syntheticNotice: {
    marginTop: aesSpacing.sm,
    textAlign: 'center',
  },
});

export default AccessScreen;
