/**
 * AES Guardian Design System — Unified Theme Object
 *
 * Combines isolated colors, typography, spacing, radii, shadows, and status mapping
 * functions per Phase 2E UI Implementation Blueprint Section 4.
 *
 * This theme module is fully decoupled from legacy SANAD global theme state
 * and has zero business logic or database dependencies.
 */

import {
  aesColors,
  AesColors,
  AesDeclarationStatusKey,
  OhCoordinationStatusKey,
  CapaActionStatusKey,
  StatusColorPair,
} from './aesColors';
import { aesTypography, AesTypography } from './aesTypography';

/**
 * Spacing Grid (Strict 4px Base)
 */
export const aesSpacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  // Semantic layout aliases
  screenHorizontal: 16,
  screenVertical: 16,
  cardPadding: 16,
  sectionGap: 24,
  elementGap: 12,
  inlineGap: 8,
} as const;

export type AesSpacing = typeof aesSpacing;

/**
 * Surface & Element Corner Radii
 */
export const aesRadii = {
  none: 0,
  badge: 8,
  chip: 8,
  input: 12,
  card: 16,
  container: 16,
  modal: 24,
  bottomSheet: 24,
  pill: 9999,
  roundButton: 9999,
} as const;

export type AesRadii = typeof aesRadii;

/**
 * Elevation & Shadow Tokens
 */
export const aesShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export type AesShadows = typeof aesShadows;

/**
 * Domain-Specific Status Color Resolution Helper
 */
export type AesStatusDomain = 'aesDecl' | 'ohCoord' | 'capa';

export function getAesStatusBadgeColors(
  domain: 'aesDecl',
  status: AesDeclarationStatusKey | string
): StatusColorPair;
export function getAesStatusBadgeColors(
  domain: 'ohCoord',
  status: OhCoordinationStatusKey | string
): StatusColorPair;
export function getAesStatusBadgeColors(
  domain: 'capa',
  status: CapaActionStatusKey | string
): StatusColorPair;
export function getAesStatusBadgeColors(
  domain: AesStatusDomain,
  status: string
): StatusColorPair;
export function getAesStatusBadgeColors(
  domain: AesStatusDomain,
  status: string
): StatusColorPair {
  if (domain === 'aesDecl') {
    const pair = aesColors.status.aesDeclaration[status as AesDeclarationStatusKey];
    if (pair) return pair;
  } else if (domain === 'ohCoord') {
    const pair = aesColors.status.ohCoordination[status as OhCoordinationStatusKey];
    if (pair) return pair;
  } else if (domain === 'capa') {
    const pair = aesColors.status.capa[status as CapaActionStatusKey];
    if (pair) return pair;
  }

  // Safe neutral fallback
  return { bg: '#EEEEEE', text: '#616161', border: '#E0E0E0' };
}

/**
 * Unified AES Guardian Theme Object
 */
export const aesTheme = {
  colors: aesColors,
  typography: aesTypography,
  spacing: aesSpacing,
  radii: aesRadii,
  shadows: aesShadows,
  getStatusBadgeColors: getAesStatusBadgeColors,
} as const;

export type AesTheme = typeof aesTheme;
