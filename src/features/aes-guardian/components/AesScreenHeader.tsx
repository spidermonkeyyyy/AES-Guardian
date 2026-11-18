/**
 * AES Guardian — Reusable Screen Header
 *
 * Implements editorial typography, optional back navigation,
 * overline category tags, and right action slots per UI Blueprint Section 5.1.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { aesColors, aesTypography, aesSpacing, aesRadii } from '../../../theme/tokens';
import { useLocale, isRTL } from '../../../localization';

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
  titleColor = aesColors.textPrimary,
  testID,
}) => {
  const locale = useLocale();
  const rtl = isRTL(locale);

  return (
    <View style={[styles.headerContainer, style]} testID={testID}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={rtl ? 'chevron-right' : 'chevron-left'}
              size={24}
              color={aesColors.textPrimary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.rightSlot}>{rightElement}</View>
      </View>

      <View style={styles.contentColumn}>
        {overline ? (
          <Text style={[styles.overline, { textAlign: rtl ? 'right' : 'left' }]}>
            {overline}
          </Text>
        ) : null}

        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              { color: titleColor, textAlign: rtl ? 'right' : 'left' },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {badge ? <View style={styles.badgeSlot}>{badge}</View> : null}
        </View>

        {subtitle ? (
          <Text
            style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}
            numberOfLines={3}
          >
            {subtitle}
          </Text>
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
    backgroundColor: aesColors.surfaceSubdued,
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
    ...aesTypography.overline,
    color: aesColors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: aesSpacing.sm,
  },
  title: {
    ...aesTypography.heading1,
  },
  badgeSlot: {
    marginLeft: aesSpacing.xs,
  },
  subtitle: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    marginTop: aesSpacing.xs,
  },
});
