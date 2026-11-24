import { Platform } from 'react-native';
import { SupportedLocale } from '../../localization';

export const approvedFontFamilies = {
  latin: 'IBMPlexSans',
  arabic: 'IBMPlexSansArabic',
  readex: 'ReadexPro',
} as const;

export const fontAssetsAvailable = {
  latinRegular: true,
  latinMedium: true,
  latinSemibold: true,
  latinBold: true,
  arabicRegular: true,
  arabicMedium: true,
  arabicSemibold: true,
  arabicBold: true,
  readexVariable: true,
} as const;

export const appFontFamilies = {
  latinRegular: 'IBMPlexSans-Regular',
  latinMedium: 'IBMPlexSans-Medium',
  latinSemibold: 'IBMPlexSans-SemiBold',
  latinBold: 'IBMPlexSans-Bold',
  arabicRegular: 'IBMPlexSansArabic-Regular',
  arabicMedium: 'IBMPlexSansArabic-Medium',
  arabicSemibold: 'IBMPlexSansArabic-SemiBold',
  arabicBold: 'IBMPlexSansArabic-Bold',
  readex: 'ReadexPro-Variable',
  display: 'IBMPlexSans-Bold',
  body: 'IBMPlexSans-Regular',
  arabic: 'IBMPlexSansArabic-Regular',
  monospace: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Menlo' }) ?? 'monospace',
} as const;

export type TypographyRole =
  | 'display'
  | 'hero'
  | 'pageTitle'
  | 'secondaryPageTitle'
  | 'sectionHeading'
  | 'cardHeading'
  | 'subheading'
  | 'body'
  | 'importantBody'
  | 'button'
  | 'formLabel'
  | 'metadata'
  | 'caption';

export interface TypographyRoleTokens {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
}

function safeLocale(locale: SupportedLocale): SupportedLocale {
  return locale === 'ar' || locale === 'en' || locale === 'fr' ? locale : 'en';
}
export function getTypographyRoleTokens(role: TypographyRole, locale: SupportedLocale): TypographyRoleTokens {
  const isArabic = safeLocale(locale) === 'ar';
  const latin = (weight: 'regular' | 'medium' | 'semibold' | 'bold') => {
    if (weight === 'medium') return appFontFamilies.latinMedium;
    if (weight === 'semibold') return appFontFamilies.latinSemibold;
    if (weight === 'bold') return appFontFamilies.latinBold;
    return appFontFamilies.latinRegular;
  };
  const arabic = (weight: 'regular' | 'medium' | 'semibold' | 'bold') => {
    if (weight === 'medium') return appFontFamilies.arabicMedium;
    if (weight === 'semibold') return appFontFamilies.arabicSemibold;
    if (weight === 'bold') return appFontFamilies.arabicBold;
    return appFontFamilies.arabicRegular;
  };
  const interfaceFont = (weight: 'regular' | 'medium' | 'semibold' | 'bold') =>
    isArabic ? arabic(weight) : latin(weight);
  switch (role) {
    case 'hero':
      return { fontFamily: interfaceFont('bold'), fontSize: 36, lineHeight: 44, fontWeight: '700' };
    case 'pageTitle':
      return { fontFamily: interfaceFont('bold'), fontSize: 28, lineHeight: 36, fontWeight: '700' };
    case 'secondaryPageTitle':
      return { fontFamily: interfaceFont('bold'), fontSize: 24, lineHeight: 32, fontWeight: '700' };
    case 'display':
      return { fontFamily: interfaceFont('bold'), fontSize: 28, lineHeight: 36, fontWeight: '700' };
    case 'sectionHeading':
      return { fontFamily: appFontFamilies.readex, fontSize: 20, lineHeight: 28, fontWeight: '600' };
    case 'cardHeading':
      return { fontFamily: appFontFamilies.readex, fontSize: 18, lineHeight: 26, fontWeight: '600' };
    case 'subheading':
      return { fontFamily: appFontFamilies.readex, fontSize: 16, lineHeight: 24, fontWeight: '500' };
    case 'importantBody':
      return { fontFamily: interfaceFont('medium'), fontSize: 15, lineHeight: 24, fontWeight: '500' };
    case 'button':
      return { fontFamily: interfaceFont('medium'), fontSize: 15, lineHeight: 22, fontWeight: '500' };
    case 'formLabel':
      return { fontFamily: interfaceFont('medium'), fontSize: 14, lineHeight: 20, fontWeight: '500' };
    case 'metadata':
      return { fontFamily: interfaceFont('regular'), fontSize: 12, lineHeight: 18, fontWeight: '400' };
    case 'caption':
      return { fontFamily: interfaceFont('regular'), fontSize: 12, lineHeight: 18, fontWeight: '400' };
    case 'body':
    default:
      return { fontFamily: interfaceFont('regular'), fontSize: 15, lineHeight: 24, fontWeight: '400' };
  }
}
export function getAppFontFamily(role: TypographyRole, locale: SupportedLocale): string {
  return getTypographyRoleTokens(role, safeLocale(locale)).fontFamily;
}
export function getAppFontWeight(role: TypographyRole, locale: SupportedLocale): TypographyRoleTokens['fontWeight'] {
  return getTypographyRoleTokens(role, safeLocale(locale)).fontWeight;
}
