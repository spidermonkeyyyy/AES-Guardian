import React from 'react';
import {
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { shapes, spacing, typography } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode | string;
  rightIcon?: React.ReactNode | string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const { colors } = useTheme();

  const renderIcon = (icon?: React.ReactNode | string) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <AppIcon name={icon} size={18} color={colors.mutedForeground} />;
    }
    return icon;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <AppText variant="label" style={styles.label}>{label}</AppText>}
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: colors.card },
          error ? { borderColor: colors.destructive } : { borderColor: colors.border },
          props.editable === false && { backgroundColor: colors.muted },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{renderIcon(leftIcon)}</View>}
        <AppTextInput
          bare
          invalid={Boolean(error)}
          style={[styles.input, inputStyle]}
          {...props}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{renderIcon(rightIcon)}</View>}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" style={styles.errorText}>{error}</AppText>
      ) : helperText ? (
        <AppText variant="caption" tone="muted" style={styles.helperText}>{helperText}</AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: shapes.input,
    paddingHorizontal: spacing.md,
    minHeight: spacing.minTouchTarget,
  },
  leftIconContainer: {
    marginRight: spacing.xs,
  },
  rightIconContainer: {
    marginLeft: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
  helperText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xxs,
  },
});
