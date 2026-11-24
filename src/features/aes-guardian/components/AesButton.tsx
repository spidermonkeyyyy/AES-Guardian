/**
 * AES Guardian — Reusable Button Component
 *
 * Theme-aware pill action buttons with primary, secondary, outline, green, and danger variants.
 */

import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { aesSpacing, aesRadii } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';
import { AppText } from '../../../components/AppText';
import { useLayoutDirection } from '../../../localization';

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
  const { colors } = useTheme();
  const layoutDirection = useLayoutDirection();
  const isInteractive = !disabled && !loading;
  const palette =
    disabled
      ? { backgroundColor: colors.muted, color: colors.mutedForeground, borderColor: colors.muted }
      : variant === 'secondary'
        ? { backgroundColor: colors.secondary, color: colors.secondaryForeground, borderColor: colors.secondary }
        : variant === 'outline'
          ? { backgroundColor: 'transparent', color: colors.primary, borderColor: colors.border }
          : variant === 'danger'
            ? { backgroundColor: colors.destructive, color: colors.destructiveForeground, borderColor: colors.destructive }
              : variant === 'green'
                ? { backgroundColor: colors.success, color: colors.successForeground, borderColor: colors.success }
                : { backgroundColor: colors.primary, color: colors.primaryForeground, borderColor: colors.primary };

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
        },
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
              ? colors.primary
              : palette.color
          }
        />
      ) : (
        <View
          style={[
            styles.contentRow,
            { flexDirection: layoutDirection === 'rtl' ? 'row-reverse' : 'row' },
          ]}
        >
          {icon && iconPosition === 'left' ? (
            <View style={styles.iconLeft} testID={testID ? `${testID}-icon-left` : undefined}>
              {icon}
            </View>
          ) : null}
          <AppText variant="label" style={[styles.baseText, { color: palette.color }, textStyle]}>
            {title}
          </AppText>
          {icon && iconPosition === 'right' ? (
            <View style={styles.iconRight} testID={testID ? `${testID}-icon-right` : undefined}>
              {icon}
            </View>
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
    textAlign: 'center',
  },
  iconLeft: {
    marginEnd: aesSpacing.sm,
  },
  iconRight: {
    marginStart: aesSpacing.sm,
  },
});
