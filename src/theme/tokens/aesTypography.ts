/**
 * AES Guardian Design System — Typography Tokens
 *
 * Implements the editorial serif heading and legible sans-serif body scale
 * per Phase 2E UI Implementation Blueprint Section 4.2.
 *
 * Font selections rely strictly on pre-existing platform and project assets:
 * - Serifs: System serif ('Georgia' on iOS, 'serif' on Android)
 * - Sans: System sans-serif ('System' / 'SF Pro' on iOS, 'sans-serif' / 'Roboto' on Android)
 * - Monospace: System monospace ('Menlo' on iOS, 'monospace' on Android)
 * - Arabic: Fallback to system Arabic fonts ('Geeza Pro' on iOS, 'sans-serif' on Android)
 */

import { Platform, TextStyle } from 'react-native';
import { typography } from './typography';

export const aesFontFamilies = {
  heading: typography.fontFamily.urbanist,
  body: typography.fontFamily.openSans,
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
    fontSize: aesFontSizes['4xl'],
    lineHeight: aesLineHeights['4xl'],
    fontWeight: aesFontWeights.bold,
  } satisfies TextStyle,
  displayLarge: {
    fontFamily: aesFontFamilies.heading,
    fontSize: aesFontSizes['5xl'],
    lineHeight: aesLineHeights['5xl'],
    fontWeight: aesFontWeights.bold,
  } satisfies TextStyle,
  heading1: {
    fontFamily: aesFontFamilies.heading,
    fontSize: aesFontSizes['2xl'],
    lineHeight: aesLineHeights['2xl'],
    fontWeight: aesFontWeights.semibold,
  } satisfies TextStyle,
  heading2: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes.xl,
    lineHeight: aesLineHeights.xl,
    fontWeight: aesFontWeights.semibold,
  } satisfies TextStyle,
  subheading: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes.lg,
    lineHeight: aesLineHeights.lg,
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
    fontSize: aesFontSizes.sm,
    lineHeight: aesLineHeights.sm,
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
    fontSize: aesFontSizes.sm,
    lineHeight: aesLineHeights.sm,
    fontWeight: aesFontWeights.semibold,
  } satisfies TextStyle,
  labelSmall: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes.caption,
    lineHeight: aesLineHeights.caption,
    fontWeight: aesFontWeights.semibold,
  } satisfies TextStyle,
  button: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes.base,
    lineHeight: aesLineHeights.md,
    fontWeight: aesFontWeights.semibold,
  } satisfies TextStyle,
  buttonSmall: {
    fontFamily: aesFontFamilies.body,
    fontSize: aesFontSizes.sm,
    lineHeight: aesLineHeights.sm,
    fontWeight: aesFontWeights.semibold,
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
