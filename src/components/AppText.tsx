import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/tokens';

export type AppTextVariant = 'display' | 'title' | 'section' | 'body' | 'label' | 'caption';
export type AppTextTone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'danger';

export interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  tone?: AppTextTone;
  typographyRole?: string;
}

const variantStyles: Record<AppTextVariant, TextStyle> = {
  display: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: 38,
  },
  title: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 30,
  },
  section: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 26,
  },
  body: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    lineHeight: 23,
  },
  label: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 20,
  },
  caption: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
};

export const AppText = React.forwardRef<Text, AppTextProps>(({
  variant = 'body',
  tone = 'primary',
  typographyRole,
  style,
  ...props
}, ref) => {
  const { colors } = useTheme();
  const color = {
    primary: colors.foreground,
    secondary: colors.mutedForeground,
    muted: colors.mutedForeground,
    inverse: colors.primaryForeground,
    danger: colors.destructive,
  }[tone];

  return <Text ref={ref} {...props} style={[variantStyles[variant], { color }, style]} />;
});

AppText.displayName = 'AppText';
export default AppText;
