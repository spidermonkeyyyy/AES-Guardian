import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import AppText from '../../components/AppText';
import { AppTextInput } from '../../components/AppTextInput';
import { setLocale } from '../../localization';
import { ThemeProvider } from '../ThemeContext';
import {
  appFontFamilies,
  getAppFontFamily,
  getAppFontWeight,
  getTypographyRoleTokens,
} from '../tokens';

describe('bilingual typography foundation', () => {
  beforeEach(() => setLocale('fr'));

  it('resolves Latin, Arabic, heading, weight, and fallback roles', () => {
    expect(getAppFontFamily('body', 'fr')).toBe(appFontFamilies.latinRegular);
    expect(getAppFontFamily('importantBody', 'en')).toBe(appFontFamilies.latinMedium);
    expect(getAppFontFamily('button', 'fr')).toBe(appFontFamilies.latinMedium);
    expect(getAppFontFamily('body', 'ar')).toBe(appFontFamilies.arabicRegular);
    expect(getAppFontFamily('importantBody', 'ar')).toBe(appFontFamilies.arabicMedium);
    expect(getAppFontFamily('display', 'ar')).toBe(appFontFamilies.arabicBold);
    expect(getAppFontFamily('sectionHeading', 'ar')).toBe(appFontFamilies.readex);
    expect(getAppFontFamily('cardHeading', 'fr')).toBe(appFontFamilies.readex);
    expect(getAppFontWeight('body', 'fr')).toBe('400');
    expect(getAppFontWeight('subheading', 'en')).toBe('500');
    expect(getAppFontWeight('sectionHeading', 'ar')).toBe('600');
    expect(getAppFontFamily('body', 'unknown' as any)).toBe(appFontFamilies.latinRegular);
  });

  it('exposes the approved initial scale and line heights', () => {
    expect(getTypographyRoleTokens('hero', 'en')).toMatchObject({
      fontFamily: appFontFamilies.latinBold,
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '700',
    });
    expect(getTypographyRoleTokens('pageTitle', 'en')).toMatchObject({
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700',
    });
    expect(getTypographyRoleTokens('sectionHeading', 'en')).toMatchObject({
      fontFamily: appFontFamilies.readex,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600',
    });
    expect(getTypographyRoleTokens('body', 'en')).toMatchObject({
      fontSize: 15,
      lineHeight: 24,
      fontWeight: '400',
    });
  });

  it('applies Arabic, Latin, mixed-script, accented, and diacritic text predictably', () => {
    setLocale('fr');
    const fr = render(
      <ThemeProvider>
        <AppText typographyRole="body" testID="fr-text">
          Déclaration sécurisée — référence 2026
        </AppText>
      </ThemeProvider>,
    );
    expect(StyleSheet.flatten(screen.getByTestId('fr-text').props.style).fontFamily)
      .toBe(appFontFamilies.latinRegular);
    fr.unmount();

    setLocale('ar');
    const ar = render(
      <ThemeProvider>
        <AppText typographyRole="body" testID="ar-text">
          تصريح آمن — رقم 2026 / Mixed Latin
        </AppText>
        <AppTextInput testID="ar-input" placeholder="الاسم مَع الدلالة" />
      </ThemeProvider>,
    );
    expect(StyleSheet.flatten(screen.getByTestId('ar-text').props.style).fontFamily)
      .toBe(appFontFamilies.arabicRegular);
    expect(StyleSheet.flatten(screen.getByTestId('ar-input').props.style).fontFamily)
      .toBe(appFontFamilies.arabicRegular);
    ar.unmount();
  });
});
