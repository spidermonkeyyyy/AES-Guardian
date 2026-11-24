import React, { useMemo } from 'react';
import { ApplicationProvider } from '@ui-kitten/components';
import * as eva from '@ui-kitten/eva';
import type { EvaTheme } from '@ui-kitten/eva';
import { useLocale, SupportedLocale } from '../localization';
import { getAppFontFamily } from './tokens/fontFamilies';
import { getThemeColors } from './tokens/colors';
import { useTheme } from './ThemeContext';

type SanadColors = ReturnType<typeof getThemeColors>;

function withAlpha(hex: string, alpha: number): string {
  const value = hex.slice(1);
  if (!/^([0-9a-f]{6})$/i.test(value)) {
    throw new Error(`Expected a six-digit SANAD theme color, received "${hex}"`);
  }

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function colorScale(
  name: 'primary' | 'success' | 'info' | 'warning' | 'danger',
  colors: [string, string, string, string, string],
): Record<string, string> {
  const [lightest, lighter, light, base, dark] = colors;
  return {
    [`color-${name}-100`]: lightest,
    [`color-${name}-200`]: lighter,
    [`color-${name}-300`]: light,
    [`color-${name}-400`]: base,
    [`color-${name}-500`]: base,
    [`color-${name}-600`]: dark,
    [`color-${name}-700`]: dark,
    [`color-${name}-800`]: dark,
    [`color-${name}-900`]: dark,
    [`color-${name}-transparent-100`]: withAlpha(base, 0.08),
    [`color-${name}-transparent-200`]: withAlpha(base, 0.16),
    [`color-${name}-transparent-300`]: withAlpha(base, 0.24),
    [`color-${name}-transparent-400`]: withAlpha(base, 0.32),
    [`color-${name}-transparent-500`]: withAlpha(base, 0.4),
    [`color-${name}-transparent-600`]: withAlpha(base, 0.48),
  };
}

export function createSanadEvaTheme(baseTheme: EvaTheme, colors: SanadColors): EvaTheme {
  return {
    ...baseTheme,
    ...colorScale('primary', [
      colors.secondary,
      colors.accent,
      colors.accent,
      colors.primary,
      colors.secondaryForeground,
    ]),
    ...colorScale('success', [
      colors.secondary,
      colors.accent,
      colors.success,
      colors.success,
      colors.successForeground,
    ]),
    ...colorScale('info', [
      colors.infoBackground,
      colors.infoBackground,
      colors.info,
      colors.info,
      colors.infoForeground,
    ]),
    ...colorScale('warning', [
      colors.warningBackground,
      colors.warningBackground,
      colors.warning,
      colors.warning,
      colors.warningForeground,
    ]),
    ...colorScale('danger', [
      colors.dangerBackground,
      colors.dangerBackground,
      colors.danger,
      colors.danger,
      colors.dangerForeground,
    ]),
    'color-basic-100': colors.background,
    'color-basic-200': colors.card,
    'color-basic-300': colors.muted,
    'color-basic-400': colors.border,
    'color-basic-500': colors.input,
    'color-basic-600': colors.mutedForeground,
    'color-basic-700': colors.foreground,
    'color-basic-800': colors.foreground,
    'color-basic-900': colors.foreground,
    'color-basic-1000': colors.foreground,
    'color-basic-1100': colors.foreground,
    'color-basic-transparent-100': withAlpha(colors.mutedForeground, 0.08),
    'color-basic-transparent-200': withAlpha(colors.mutedForeground, 0.16),
    'color-basic-transparent-300': withAlpha(colors.mutedForeground, 0.24),
    'color-basic-transparent-400': withAlpha(colors.mutedForeground, 0.32),
    'color-basic-transparent-500': withAlpha(colors.mutedForeground, 0.4),
    'color-basic-transparent-600': withAlpha(colors.mutedForeground, 0.48),
    'color-basic-control-transparent-100': withAlpha(colors.primaryForeground, 0.08),
    'color-basic-control-transparent-200': withAlpha(colors.primaryForeground, 0.16),
    'color-basic-control-transparent-300': withAlpha(colors.primaryForeground, 0.24),
    'color-basic-control-transparent-400': withAlpha(colors.primaryForeground, 0.32),
    'color-basic-control-transparent-500': withAlpha(colors.primaryForeground, 0.4),
    'color-basic-control-transparent-600': withAlpha(colors.primaryForeground, 0.48),
    'background-basic-color-1': colors.background,
    'background-basic-color-2': colors.card,
    'background-basic-color-3': colors.muted,
    'background-basic-color-4': colors.popover,
    'background-alternative-color-1': colors.card,
    'background-alternative-color-2': colors.sidebar,
    'background-alternative-color-3': colors.muted,
    'background-alternative-color-4': colors.sidebar,
    'border-basic-color-1': colors.border,
    'border-basic-color-2': colors.border,
    'border-basic-color-3': colors.border,
    'border-basic-color-4': colors.input,
    'border-basic-color-5': colors.input,
    'text-basic-color': colors.foreground,
    'text-alternate-color': colors.foreground,
    'text-control-color': colors.primaryForeground,
    'text-disabled-color': colors.mutedForeground,
    'text-hint-color': colors.mutedForeground,
    'text-primary-color': colors.primary,
    'text-success-color': colors.success,
    'text-info-color': colors.info,
    'text-warning-color': colors.warning,
    'text-danger-color': colors.danger,
  };
}

export function createSanadEvaMapping(locale: SupportedLocale) {
  const bodyFont = getAppFontFamily('body', locale);
  const headingFont = getAppFontFamily('sectionHeading', locale);
  const subheadingFont = getAppFontFamily('subheading', locale);

  return {
    ...eva.mapping,
    strict: {
      ...eva.mapping.strict,
      'text-font-family': bodyFont,
      'text-heading-1-font-family': headingFont,
      'text-heading-2-font-family': headingFont,
      'text-heading-3-font-family': headingFont,
      'text-heading-4-font-family': headingFont,
      'text-heading-5-font-family': headingFont,
      'text-heading-6-font-family': headingFont,
      'text-heading-1-font-weight': '700',
      'text-heading-2-font-weight': '700',
      'text-heading-3-font-weight': '600',
      'text-heading-4-font-weight': '600',
      'text-heading-5-font-weight': '600',
      'text-heading-6-font-weight': '600',
      'text-subtitle-1-font-family': subheadingFont,
      'text-subtitle-2-font-family': subheadingFont,
      'text-subtitle-1-font-weight': '500',
      'text-subtitle-2-font-weight': '500',
      'text-paragraph-1-font-family': bodyFont,
      'text-paragraph-2-font-family': bodyFont,
      'text-paragraph-1-font-weight': '400',
      'text-paragraph-2-font-weight': '400',
      'text-caption-1-font-family': bodyFont,
      'text-caption-2-font-family': bodyFont,
      'text-caption-1-font-weight': '400',
      'text-caption-2-font-weight': '400',
      'text-label-font-family': bodyFont,
      'text-label-font-weight': '500',
    },
  };
}

export const SanadUiKittenProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { isDark, colors } = useTheme();
  const locale = useLocale();
  const theme = useMemo(
    () => createSanadEvaTheme(isDark ? eva.dark : eva.light, colors),
    [colors, isDark],
  );
  const mapping = useMemo(() => createSanadEvaMapping(locale), [locale]);

  return (
    <ApplicationProvider mapping={mapping} theme={theme}>
      {children}
    </ApplicationProvider>
  );
};

export default SanadUiKittenProvider;
