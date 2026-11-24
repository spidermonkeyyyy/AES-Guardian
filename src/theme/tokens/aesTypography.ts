/**
 * AES Guardian Design System — Typography Tokens
 *
 * Central SANAD typography scale using IBM Plex for interface text and Readex Pro
 * for section-level headings. Locale-aware shared text components select Arabic IBM Plex.
 */

import { Platform, TextStyle } from 'react-native';
import { typography } from './typography';

export const aesFontFamilies = {
  heading: typography.fontFamily.display,
  body: typography.fontFamily.openSans,
  readex: typography.fontFamily.heading,
  monospace: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
  arabic: Platform.select({
    ios: 'Geeza Pro',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
} as const;

export const aesFontSizes = {
  caption: 11,
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
} as const;

export const aesFontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const aesLineHeights = {
  caption: 14,
  xs: 16,
  sm: 18,
  md: 20,
  base: 22,
  lg: 22,
  xl: 24,
  '2xl': 28,
  '3xl': 30,
  '4xl': 34,
  '5xl': 38,
} as const;

export const aesTypography = {
  display1: {
    fontFamily: aesFontFamilies.heading,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: aesFontWeights.bold,
  } satisfies TextStyle,
  displayLarge: {
    fontFamily: aesFontFamilies.heading,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: aesFontWeights.bold,
  } satisfies TextStyle,
  heading1: {
    fontFamily: aesFontFamilies.heading,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: aesFontWeights.bold,
  } satisfies TextStyle,
  heading2: {
    fontFamily: aesFontFamilies.readex,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: aesFontWeights.semibold,
  } satisfies TextStyle,
  subheading: {
    fontFamily: aesFontFamilies.readex,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: aesFontWeights.medium,
  } satisfies TextStyle,
  body: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes.base,
    lineHeight: aesLineHeights.base,
    fontWeight: aesFontWeights.regular,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: aesFontFamilies.body,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: aesFontWeights.regular,
  } satisfies TextStyle,
  caption: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes.xs,
    lineHeight: aesLineHeights.xs,
    fontWeight: aesFontWeights.regular,
  } satisfies TextStyle,
  overline: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes.caption,
    lineHeight: aesLineHeights.caption,
    fontWeight: aesFontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,
  label: {
    fontFamily: aesFontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: aesFontWeights.medium,
  } satisfies TextStyle,
  labelSmall: {
    fontFamily: aesFontFamilies.body,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: aesFontWeights.medium,
  } satisfies TextStyle,
  button: {
    fontFamily: aesFontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: aesFontWeights.medium,
  } satisfies TextStyle,
  buttonSmall: {
    fontFamily: aesFontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: aesFontWeights.medium,
  } satisfies TextStyle,
  statValue: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes['3xl'],
    lineHeight: aesLineHeights['3xl'],
    fontWeight: aesFontWeights.bold,
  } satisfies TextStyle,
  statValueLarge: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes['5xl'],
    lineHeight: aesLineHeights['5xl'],
    fontWeight: aesFontWeights.bold,
  } satisfies TextStyle,
  code: {
    fontFamily: aesFontFamilies.monospace,
    fontSize: aesFontSizes.sm,
    lineHeight: aesLineHeights.sm,
    fontWeight: aesFontWeights.medium,
  } satisfies TextStyle,
} as const;

export type AesTypography = typeof aesTypography;
export type AesTypographyKey = keyof AesTypography;
