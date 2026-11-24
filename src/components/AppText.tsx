import React from 'react';
import {
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../localization';
import { getTypographyRoleTokens, TypographyRole } from '../theme/tokens/fontFamilies';

export type AppTextVariant =
  | 'display'
  | 'title'
  | 'section'
  | 'card'
  | 'subheading'
  | 'body'
  | 'bodyEmphasis'
  | 'label'
  | 'button'
  | 'caption'
  | 'metadata';
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
  card: 'cardHeading',
  subheading: 'subheading',
  body: 'body',
  bodyEmphasis: 'importantBody',
  label: 'formLabel',
  button: 'button',
  caption: 'caption',
  metadata: 'metadata',
};

function inferTypographyRole(style: AppTextProps['style']): TypographyRole {
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontSize = typeof flattened?.fontSize === 'number' ? flattened.fontSize : 15;
  const fontWeight = flattened?.fontWeight;
  const isEmphasized = fontWeight === '500'
    || fontWeight === '600'
    || fontWeight === '700'
    || fontWeight === 'bold'
    || fontWeight === 'semibold';

  if (fontSize >= 28) return 'pageTitle';
  if (fontSize >= 20 && isEmphasized) return 'sectionHeading';
  if (fontSize >= 18 && isEmphasized) return 'cardHeading';
  if (fontSize >= 16 && isEmphasized) return 'subheading';
  if (isEmphasized) return 'importantBody';
  return 'body';
}

export const AppText = React.forwardRef<Text, AppTextProps>(({
  variant,
  tone = 'primary',
  typographyRole,
  style,
  ...props
}, ref) => {
  const { colors } = useTheme();
  const locale = useLocale();
  const role = typographyRole ?? (variant ? variantRoles[variant] : inferTypographyRole(style));
  const textStyle = getTypographyRoleTokens(role, locale);
  const headingWeight = role === 'sectionHeading'
    || role === 'cardHeading'
    || role === 'subheading'
    ? textStyle.fontWeight
    : undefined;
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
      style={[
        textStyle,
        { color },
        style,
        {
          fontFamily: textStyle.fontFamily,
          ...(headingWeight ? { fontWeight: headingWeight } : {}),
        },
      ]}
    />
  );
});

AppText.displayName = 'AppText';
export default AppText;
