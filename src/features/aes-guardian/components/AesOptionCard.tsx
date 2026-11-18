/**
 * AES Guardian — Reusable Option Card Component
 *
 * Implements large selectable option cards with radio or checkbox indicator,
 * code badge slot, bold title, and descriptive subtitle per UI Blueprint
 * Section 5.1 & Section 5.2 (used in DemoAccountPickerScreen and form steps).
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  aesColors,
  aesTypography,
  aesSpacing,
  aesRadii,
  aesShadows,
} from '../../../theme/tokens';
import { useLocale, isRTL } from '../../../localization';

export type AesOptionCardVariant = 'radio' | 'checkbox';

export interface AesOptionCardProps {
  title: string;
  subtitle?: string;
  badgeCode?: string;
  selected: boolean;
  onPress: () => void;
  variant?: AesOptionCardVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const AesOptionCard: React.FC<AesOptionCardProps> = ({
  title,
  subtitle,
  badgeCode,
  selected,
  onPress,
  variant = 'radio',
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}) => {
  const locale = useLocale();
  const rtl = isRTL(locale);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected ? styles.selectedContainer : styles.unselectedContainer,
        disabled && styles.disabledContainer,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      testID={testID}
      accessibilityRole={variant === 'checkbox' ? 'checkbox' : 'radio'}
      accessibilityLabel={accessibilityLabel ?? `${title} - ${subtitle ?? ''}`}
      accessibilityState={{ selected, disabled }}
    >
      <View style={styles.indicatorSlot}>
        {variant === 'radio' ? (
          <View
            style={[
              styles.radioOuter,
              selected ? styles.radioOuterSelected : styles.radioOuterUnselected,
            ]}
          >
            {selected && <View style={styles.radioInner} />}
          </View>
        ) : (
          <View
            style={[
              styles.checkboxBox,
              selected ? styles.checkboxSelected : styles.checkboxUnselected,
            ]}
          >
            {selected && (
              <Icon name="check" size={14} color={aesColors.textInverse} />
            )}
          </View>
        )}
      </View>

      <View style={styles.contentColumn}>
        <View style={styles.titleRow}>
          {badgeCode ? (
            <View
              style={[
                styles.badge,
                selected ? styles.badgeSelected : styles.badgeUnselected,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  selected && styles.badgeTextSelected,
                ]}
              >
                {badgeCode}
              </Text>
            </View>
          ) : null}
          <Text
            style={[
              styles.title,
              { textAlign: rtl ? 'right' : 'left' },
              selected && styles.titleSelected,
            ]}
          >
            {title}
          </Text>
        </View>

        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { textAlign: rtl ? 'right' : 'left' },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: aesColors.surface,
    borderRadius: aesRadii.card,
    borderWidth: 1.5,
    padding: aesSpacing.cardPadding,
    marginVertical: aesSpacing.xs,
    ...aesShadows.card,
  },
  unselectedContainer: {
    borderColor: aesColors.borderSubdued,
  },
  selectedContainer: {
    borderColor: aesColors.accentGreen,
    backgroundColor: '#FAFDF9',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  indicatorSlot: {
    marginTop: 2,
    marginRight: aesSpacing.md,
  },
  contentColumn: {
    flex: 1,
    gap: aesSpacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: aesSpacing.sm,
  },
  badge: {
    paddingHorizontal: aesSpacing.sm,
    paddingVertical: 2,
    borderRadius: aesRadii.chip,
  },
  badgeUnselected: {
    backgroundColor: aesColors.surfaceSubdued,
  },
  badgeSelected: {
    backgroundColor: aesColors.accentGreenMuted,
  },
  badgeText: {
    ...aesTypography.code,
    fontSize: 11,
    color: aesColors.textSecondary,
    fontWeight: '600',
  },
  badgeTextSelected: {
    color: aesColors.accentGreen,
  },
  title: {
    ...aesTypography.heading2,
    fontSize: 16,
    color: aesColors.textPrimary,
  },
  titleSelected: {
    color: aesColors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
    lineHeight: 18,
  },
  // Radio visual indicators
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterUnselected: {
    borderColor: aesColors.borderStrong,
  },
  radioOuterSelected: {
    borderColor: aesColors.accentGreen,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: aesColors.accentGreen,
  },
  // Checkbox visual indicators
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnselected: {
    borderColor: aesColors.borderStrong,
    backgroundColor: aesColors.surface,
  },
  checkboxSelected: {
    borderColor: aesColors.accentGreen,
    backgroundColor: aesColors.accentGreen,
  },
});
