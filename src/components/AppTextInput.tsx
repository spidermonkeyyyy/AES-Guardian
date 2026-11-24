import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { shapes, spacing, typography } from '../theme/tokens';

export interface AppTextInputProps extends TextInputProps {
  invalid?: boolean;
  bare?: boolean;
}

export const AppTextInput = React.forwardRef<TextInput, AppTextInputProps>(({
  invalid = false,
  bare = false,
  editable = true,
  style,
  ...props
}, ref) => {
  const { colors } = useTheme();

  return (
    <TextInput
      ref={ref}
      {...props}
      editable={editable}
      placeholderTextColor={props.placeholderTextColor ?? colors.mutedForeground}
      style={[
        bare ? styles.bareInput : styles.input,
        bare
          ? { color: colors.foreground }
          : {
            backgroundColor: editable ? colors.card : colors.muted,
            borderColor: invalid ? colors.destructive : colors.border,
            color: colors.foreground,
          },
        style,
      ]}
    />
  );
});

AppTextInput.displayName = 'AppTextInput';
export default AppTextInput;

const styles = StyleSheet.create({
  input: {
    minHeight: spacing.minTouchTarget,
    borderWidth: 1,
    borderRadius: shapes.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
  },
  bareInput: {
    flex: 1,
    minHeight: spacing.minTouchTarget - spacing.sm * 2,
    paddingVertical: spacing.sm,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
  },
});
