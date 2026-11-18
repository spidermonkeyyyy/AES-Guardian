/**
 * AES Guardian — Reusable Button Component
 *
 * Implements 48px height pill action buttons across primary (near-black),
 * secondary (light grey surface), clinical green, and outline variants
 * per UI Blueprint Section 5.1 & Section 5.2.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import {
  aesColors,
  aesTypography,
  aesSpacing,
  aesRadii,
} from '../../../theme/tokens';

export type AesButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'green'
  | 'danger';

export interface AesButtonProps {
  title: string;
  onPress: () => void;
  variant?: AesButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const AesButton: React.FC<AesButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
  testID,
  accessibilityLabel,
}) => {
  const isInteractive = !disabled && !loading;

  const getContainerStyle = (): ViewStyle => {
    if (disabled) {
      return styles.disabledContainer;
    }
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'green':
        return styles.greenContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = (): TextStyle => {
    if (disabled) {
      return styles.disabledText;
    }
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'green':
        return styles.greenText;
      case 'danger':
        return styles.dangerText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        fullWidth && styles.fullWidth,
        getContainerStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.85}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'secondary' || variant === 'outline'
              ? aesColors.textPrimary
              : aesColors.textInverse
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <View style={styles.iconLeft}>{icon}</View>
          ) : null}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' ? (
            <View style={styles.iconRight}>{icon}</View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    height: 48,
    borderRadius: aesRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: aesSpacing.xl,
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    ...aesTypography.button,
    textAlign: 'center',
  },
  // Variants
  primaryContainer: {
    backgroundColor: aesColors.primaryAction,
  },
  primaryText: {
    color: aesColors.textInverse,
  },
  secondaryContainer: {
    backgroundColor: aesColors.secondaryAction,
  },
  secondaryText: {
    color: aesColors.textPrimary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: aesColors.borderMedium,
  },
  outlineText: {
    color: aesColors.textPrimary,
  },
  greenContainer: {
    backgroundColor: aesColors.accentGreen,
  },
  greenText: {
    color: aesColors.textInverse,
  },
  dangerContainer: {
    backgroundColor: aesColors.banners.error.text,
  },
  dangerText: {
    color: aesColors.textInverse,
  },
  // Disabled
  disabledContainer: {
    backgroundColor: aesColors.primaryActionDisabled,
    borderColor: aesColors.primaryActionDisabled,
  },
  disabledText: {
    color: aesColors.textTertiary,
  },
  iconLeft: {
    marginRight: aesSpacing.sm,
  },
  iconRight: {
    marginLeft: aesSpacing.sm,
  },
});
