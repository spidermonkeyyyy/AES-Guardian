import React from 'react';
import { Alert, Image, StyleSheet } from 'react-native';
import { readFileSync } from 'node:fs';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AuthGateScreen from '../screens/AuthGateScreen';
import AccessScreen from '../screens/AccessScreen';
import {
  DEFAULT_LOCALE,
  getLocale,
  initializeLocale,
  LOCALE_STORAGE_KEY,
  setLocale,
  t,
} from '../../../localization';
import {
  aesFontFamilies,
  aesTypography,
  appFontFamilies,
  getAppFontFamily,
  fontAssetsAvailable,
  typography,
} from '../../../theme/tokens';
import { ThemeProvider } from '../../../theme/ThemeContext';

const mockNavigate = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-navigation/native', () => {
  const actualNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualNavigation,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

const AsyncStorage = require('@react-native-async-storage/async-storage');

describe('SANAD welcome and access experience', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    setLocale(DEFAULT_LOCALE);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts in French and presents the original SANAD mark with a single primary action', () => {
    const { getByTestId, getByText, getAllByRole, UNSAFE_getByType } = render(
      <ThemeProvider>
        <AuthGateScreen />
      </ThemeProvider>
    );

    expect(DEFAULT_LOCALE).toBe('fr');
    expect(getLocale()).toBe('fr');
    expect(getByTestId('sanad-welcome-screen')).toBeTruthy();
    expect(getByText('SANAD')).toBeTruthy();
    expect(UNSAFE_getByType(Image).props.source).toEqual(
      require('../../../assets/images/logo/sanad_icon.png'),
    );
    expect(getByText('Déclarer. Suivre. Prévenir.')).toBeTruthy();
    expect(getByText('Une solution dédiée à la déclaration, au suivi et à la prévention des accidents d’exposition au sang chez les professionnels de santé.')).toBeTruthy();
    expect(getAllByRole('button')).toHaveLength(1);
    expect(getByTestId('welcome-language-fr')).toBeTruthy();
    expect(getByTestId('welcome-language-en')).toBeTruthy();
    expect(getByTestId('welcome-language-ar')).toBeTruthy();
  });

  it('switches FR → EN → AR → FR with matching copy and direction', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <AuthGateScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('welcome-language-en'));
    expect(getByText('Declare. Follow up. Prevent.')).toBeTruthy();
    expect(StyleSheet.flatten(getByText('Declare. Follow up. Prevent.').props.style).writingDirection).toBe('ltr');

    fireEvent.press(getByTestId('welcome-language-ar'));
    const arabicTagline = getByText('صرّح. تابع. امنع.');
    expect(StyleSheet.flatten(arabicTagline.props.style).writingDirection).toBe('rtl');
    expect(getLocale()).toBe('ar');

    fireEvent.press(getByTestId('welcome-language-fr'));
    expect(getByText('Déclarer. Suivre. Prévenir.')).toBeTruthy();
    expect(getLocale()).toBe('fr');
  });

  it('persists locale selection and restores it when the application initializes again', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AuthGateScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('welcome-language-en'));
    await waitFor(async () => {
      expect(await AsyncStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    });

    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, 'ar');
    await act(async () => {
      await initializeLocale();
    });
    expect(getLocale()).toBe('ar');
  });

  it('opens the separate access screen from the welcome action', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AuthGateScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('welcome-start'));
    expect(mockNavigate).toHaveBeenCalledWith('access');
  });

  it('reports prototype sign-in honestly and routes demonstration access to the existing picker', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId, queryByPlaceholderText } = render(
      <ThemeProvider>
        <AccessScreen />
      </ThemeProvider>
    );

    fireEvent.press(getByTestId('access-sign-in'));
    expect(alertSpy).toHaveBeenCalledWith(
      t('access.signInUnavailable.title', 'fr'),
      t('access.signInUnavailable.message', 'fr'),
      [{ text: t('access.close', 'fr') }],
    );
    expect(queryByPlaceholderText(/mot de passe/i)).toBeNull();

    fireEvent.press(getByTestId('access-demo'));
    expect(mockNavigate).toHaveBeenCalledWith('aesDemoPicker');
    alertSpy.mockRestore();
  });

  it('assigns centralized IBM Plex display/body tokens and Arabic font assets', () => {
    expect(typography.fontFamily.display).toBe(appFontFamilies.display);
    expect(typography.fontFamily.body).toBe(appFontFamilies.body);
    expect(aesFontFamilies.heading).toBe(appFontFamilies.display);
    expect(aesFontFamilies.body).toBe(appFontFamilies.body);
    expect(aesTypography.heading1.fontFamily).toBe(appFontFamilies.display);
    expect(aesTypography.body.fontFamily).toBe(appFontFamilies.body);
    expect(getAppFontFamily('display', 'ar')).toBe(appFontFamilies.arabicBold);
    expect(getAppFontFamily('body', 'ar')).toBe(appFontFamilies.arabicRegular);
    expect(appFontFamilies.display).toBe(appFontFamilies.latinBold);
    expect(appFontFamilies.body).toBe(appFontFamilies.latinRegular);
    expect(fontAssetsAvailable).toEqual({
      latinRegular: true,
      latinMedium: true,
      latinSemibold: true,
      latinBold: true,
      arabicRegular: true,
      arabicMedium: true,
      arabicSemibold: true,
      arabicBold: true,
      readexVariable: true,
    });
  });

  it('keeps development support enabled only for debug builds', () => {
    const gradle = readFileSync('android/app/build.gradle', 'utf8');
    const application = readFileSync(
      'android/app/src/main/java/com/sanad/MainApplication.java',
      'utf8',
    );

    expect(gradle).toMatch(/release\s*\{[^}]*debuggable\s+false/s);
    expect(gradle).toMatch(/debug\s*\{[^}]*debuggable\s+true/s);
    expect(application).toContain('return BuildConfig.DEBUG;');
  });
});
