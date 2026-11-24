import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../localization';
import { getTypographyRoleTokens, TypographyRole } from '../theme/tokens/fontFamilies';

export type AppTextVariant = 'display' | 'title' | 'section' | 'body' | 'label' | 'caption';
export type AppTextTone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'danger';

export interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  tone?: AppTextTone;
  typographyRole?: TypographyRole;
}

const variantRoles: Record<AppTextVariant, TypographyRole> = {
  display: 'hero',
  title: 'pageTitle',
  section: 'sectionHeading',
  body: 'body',
  label: 'formLabel',
  caption: 'caption',
};

export const AppText = React.forwardRef<Text, AppTextProps>(({
  variant = 'body',
  tone = 'primary',
  typographyRole,
  style,
  ...props
}, ref) => {
  const { colors } = useTheme();
  const locale = useLocale();
  const textStyle = getTypographyRoleTokens(typographyRole ?? variantRoles[variant], locale);
  const color = {
    primary: colors.foreground,
    secondary: colors.mutedForeground,
    muted: colors.mutedForeground,
    inverse: colors.primaryForeground,
    danger: colors.destructive,
  }[tone];

  return (
    <Text
      ref={ref}
      {...props}
      style={[textStyle, { color }, style, { fontFamily: textStyle.fontFamily }]}
    />
  );
});

AppText.displayName = 'AppText';
export default AppText;
