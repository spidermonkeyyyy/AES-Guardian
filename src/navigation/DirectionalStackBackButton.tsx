import AppText from '../components/AppText';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppIcon } from '../components/AppIcon';
import { aesColors, aesRadii } from '../theme/tokens';
import {
  getLayoutTextAlign,
  t,
  TranslationKey,
  useLayoutDirection,
  useLocale,
} from '../localization';
import { useTheme } from '../theme/ThemeContext';

const STACK_TITLE_KEYS: Partial<Record<string, TranslationKey>> = {
  aesGuardianWorkspace: 'workspace.nav.title',
  declarations: 'list.title',
  newDeclaration: 'form.title.new',
  declarationDetails: 'details.title',
  adminReviewQueue: 'reviewQueue.title',
  adminReviewAction: 'review.title',
  correctionResponse: 'correction.screenTitle',
  ohCoordinationQueue: 'oh.queue.title',
  ohCoordinationDetail: 'oh.detail.title',
  createCoordination: 'oh.create.title',
  recordFollowUpEvent: 'oh.event.title',
  declarationCoordinationStatus: 'oh.decl.coordinationStatus',
  surveillanceDashboard: 'surveillance.nav.title',
  preventionOverview: 'prevention.nav.title',
  preventionRegister: 'prevention.register.title',
  preventionCreate: 'prevention.create.title',
  preventionActionDetail: 'prevention.detail.title',
  helpGlossary: 'helpGlossary.title',
  aesGuardianProfile: 'profile.title',
  notificationCentre: 'notificationCentre.title',
};

export function getDirectionalStackBackSide(locale: Parameters<typeof t>[1]): 'left' | 'right' {
  return locale === 'ar' ? 'right' : 'left';
}

export function getLocalizedStackTitle(
  routeName: string,
  fallback: React.ReactNode,
  locale: Parameters<typeof t>[1],
): React.ReactNode {
  const key = STACK_TITLE_KEYS[routeName];
  return key ? t(key, locale) : fallback;
}

export interface DirectionalStackBackButtonProps {
  side: 'left' | 'right';
}

export const DirectionalStackBackButton: React.FC<DirectionalStackBackButtonProps> = ({ side }) => {
  const navigation = useNavigation();
  const locale = useLocale();
  const rtl = useLayoutDirection() === 'rtl';
  const expectedSide = rtl ? 'right' : 'left';

  if (side !== expectedSide || !navigation.canGoBack()) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel={t('navigation.back', locale)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      testID={`stack-back-${side}`}
    >
      <AppIcon
        name="back"
        size={22}
        color={aesColors.textPrimary}
      />
    </TouchableOpacity>
  );
};

export interface DirectionalStackHeaderTitleProps {
  children: React.ReactNode;
}

export const DirectionalStackHeaderTitle: React.FC<DirectionalStackHeaderTitleProps> = ({ children }) => {
  const layoutDirection = useLayoutDirection();
  const { colors } = useTheme();

  return (
    <AppText
      numberOfLines={1}
      style={[
        styles.title,
        {
          color: colors.foreground,
          textAlign: getLayoutTextAlign(layoutDirection),
          writingDirection: layoutDirection,
        },
      ]}
    >
      {children}
    </AppText>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: aesRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flexShrink: 1,
  },
});
