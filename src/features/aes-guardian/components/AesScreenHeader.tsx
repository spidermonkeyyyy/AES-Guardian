/**
 * AES Guardian — Reusable Screen Header
 *
 * Implements editorial typography, optional back navigation,
 * overline category tags, and right action slots per UI Blueprint Section 5.1.
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { aesSpacing, aesRadii } from '../../../theme/tokens';
import { useLocale, isRTL, t } from '../../../localization';
import { useTheme } from '../../../theme/ThemeContext';
import { AppIcon } from '../../../components/AppIcon';
import { AppText } from '../../../components/AppText';

export interface AesScreenHeaderProps {
  title: string;
  subtitle?: string;
  overline?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  badge?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleColor?: string;
  testID?: string;
}

export const AesScreenHeader: React.FC<AesScreenHeaderProps> = ({
  title,
  subtitle,
  overline,
  onBack,
  rightElement,
  badge,
  style,
  titleColor,
  testID,
}) => {
  const locale = useLocale();
  const rtl = isRTL(locale);
  const { colors } = useTheme();

  return (
    <View style={[styles.headerContainer, style]} testID={testID}>
      <View
        style={[styles.topRow, { flexDirection: rtl ? 'row-reverse' : 'row' }]}
        testID={testID ? `${testID}-top-row` : undefined}
      >
        {onBack ? (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.muted }]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('app.back', locale)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="back-chevron" size={22} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View
          style={[styles.rightSlot, { alignItems: rtl ? 'flex-start' : 'flex-end' }]}
        >
          {rightElement}
        </View>
      </View>

      <View style={styles.contentColumn}>
        {overline ? (
          <AppText
            variant="caption"
            tone="muted"
            style={[styles.overline, { textAlign: rtl ? 'right' : 'left' }]}
          >
            {overline}
          </AppText>
        ) : null}

        <View
          style={[
            styles.titleRow,
            { flexDirection: rtl ? 'row-reverse' : 'row' },
          ]}
          testID={testID ? `${testID}-title-row` : undefined}
        >
          <AppText
            variant="title"
            style={[
              styles.title,
              { color: titleColor ?? colors.foreground, textAlign: rtl ? 'right' : 'left' },
            ]}
            numberOfLines={2}
          >
            {title}
          </AppText>
          {badge ? <View style={styles.badgeSlot}>{badge}</View> : null}
        </View>

        {subtitle ? (
          <AppText
            variant="body"
            tone="muted"
            style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}
            numberOfLines={3}
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: aesSpacing.screenHorizontal,
    paddingTop: aesSpacing.sm,
    paddingBottom: aesSpacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
    marginBottom: aesSpacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: aesRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: 40,
    height: 40,
  },
  rightSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  contentColumn: {
    gap: aesSpacing.xs,
  },
  overline: {
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: aesSpacing.sm,
  },
  title: {
    flexShrink: 1,
  },
  badgeSlot: {
    marginStart: aesSpacing.xs,
  },
  subtitle: {
    marginTop: aesSpacing.xs,
  },
});
