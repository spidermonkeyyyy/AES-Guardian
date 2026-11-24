import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { useLocale } from '../localization';
import { useTheme } from '../theme/ThemeContext';
import { getTypographyRoleTokens } from '../theme/tokens/fontFamilies';
import { shapes, spacing } from '../theme/tokens';

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
  const locale = useLocale();
  const textStyle = getTypographyRoleTokens('body', locale);

  return (
    <TextInput
      ref={ref}
      {...props}
      editable={editable}
      placeholderTextColor={props.placeholderTextColor ?? colors.mutedForeground}
      style={[
        textStyle,
        bare ? styles.bareInput : styles.input,
        bare
          ? { color: colors.foreground }
          : {
            backgroundColor: editable ? colors.card : colors.muted,
            borderColor: invalid ? colors.destructive : colors.border,
            color: colors.foreground,
          },
        style,
        { fontFamily: textStyle.fontFamily },
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
  },
  bareInput: {
    flex: 1,
    minHeight: spacing.minTouchTarget - spacing.sm * 2,
    paddingVertical: spacing.sm,
  },
});
