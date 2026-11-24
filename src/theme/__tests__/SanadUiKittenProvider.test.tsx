import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Button, Text as UiKittenText, useTheme as useEvaTheme } from '@ui-kitten/components';
import { AppIcon } from '../../components/AppIcon';
import AppText from '../../components/AppText';
import { AppTextInput } from '../../components/AppTextInput';
import { getLocale, resolveLayoutDirection, setLocale } from '../../localization';
import { ThemeProvider, useTheme as useSanadTheme } from '../ThemeContext';
import { darkTheme, getThemeColors, lightTheme } from '../tokens/colors';
import { appFontFamilies, getAppFontFamily } from '../tokens/fontFamilies';
import {
  createSanadEvaMapping,
  createSanadEvaTheme,
  SanadUiKittenProvider,
} from '../SanadUiKittenProvider';
import * as eva from '@ui-kitten/eva';

function Wrapper({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider>
      <SanadUiKittenProvider>{children}</SanadUiKittenProvider>
    </ThemeProvider>
  );
}

function ThemeProbe() {
  const evaTheme = useEvaTheme();
  const { isDark, toggleTheme } = useSanadTheme();

  return (
    <>
      <UiKittenText category="p1" testID="ui-kitten-text">
        Provider ready
      </UiKittenText>
      <UiKittenText category="h1" testID="eva-heading">
        Heading
      </UiKittenText>
      <Button testID="toggle-theme" onPress={toggleTheme}>
        Toggle theme
      </Button>
      <UiKittenText testID="sanad-mode">{isDark ? 'dark' : 'light'}</UiKittenText>
      <UiKittenText testID="eva-primary">{evaTheme['color-primary-500']}</UiKittenText>
      <UiKittenText testID="eva-surface">{evaTheme['background-basic-color-1']}</UiKittenText>
      <AppText testID="sanad-app-text">SANAD typography</AppText>
      <AppTextInput testID="sanad-app-input" placeholder="Input" />
      <AppIcon name="back" testID="sanad-app-icon" />
    </>
  );
}

describe('SANAD UI Kitten provider foundation', () => {
  beforeEach(() => {
    act(() => setLocale('fr'));
  });

  afterEach(() => {
    act(() => setLocale('fr'));
  });

  it('renders real UI Kitten components and preserves the SANAD provider and shared component layer', () => {
    render(
      <Wrapper>
        <ThemeProbe />
      </Wrapper>,
    );

    expect(screen.getByText('Provider ready')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('eva-heading').props.style).fontFamily)
      .toBe(getAppFontFamily('sectionHeading', 'fr'));
    expect(screen.getByTestId('toggle-theme')).toBeTruthy();
    expect(screen.getByTestId('sanad-app-text')).toBeTruthy();
    expect(screen.getByTestId('sanad-app-input')).toBeTruthy();
    expect(screen.getByTestId('sanad-app-icon', { includeHiddenElements: true })).toBeTruthy();
  });

  it('maps SANAD light and dark semantic tokens onto the corresponding Eva palettes', () => {
    const light = createSanadEvaTheme(eva.light, getThemeColors(false));
    const dark = createSanadEvaTheme(eva.dark, getThemeColors(true));

    expect(light['color-primary-500']).toBe(lightTheme.colors.primary);
    expect(light['background-basic-color-1']).toBe(lightTheme.colors.background);
    expect(light['text-basic-color']).toBe(lightTheme.colors.foreground);
    expect(light['color-danger-500']).toBe(getThemeColors(false).danger);
    expect(dark['color-primary-500']).toBe(darkTheme.colors.primary);
    expect(dark['background-basic-color-1']).toBe(darkTheme.colors.background);
    expect(dark['text-basic-color']).toBe(darkTheme.colors.foreground);
    expect(dark['color-danger-500']).toBe(getThemeColors(true).danger);
  });

  it('propagates SANAD theme changes into the real UI Kitten theme', () => {
    render(
      <Wrapper>
        <ThemeProbe />
      </Wrapper>,
    );

    expect(screen.getByTestId('sanad-mode').props.children).toBe('light');
    expect(screen.getByTestId('eva-primary').props.children).toBe(lightTheme.colors.primary);
    expect(screen.getByTestId('eva-surface').props.children).toBe(lightTheme.colors.background);

    fireEvent.press(screen.getByTestId('toggle-theme'));

    expect(screen.getByTestId('sanad-mode').props.children).toBe('dark');
    expect(screen.getByTestId('eva-primary').props.children).toBe(darkTheme.colors.primary);
    expect(screen.getByTestId('eva-surface').props.children).toBe(darkTheme.colors.background);
  });

  it('keeps UI Kitten typography mapped to SANAD font tokens for every locale', () => {
    const latin = createSanadEvaMapping('en').strict;
    const arabic = createSanadEvaMapping('ar').strict;

    expect(latin['text-font-family']).toBe(appFontFamilies.body);
    expect(latin['text-heading-1-font-family']).toBe(appFontFamilies.readex);
    expect(arabic['text-font-family']).toBe(getAppFontFamily('body', 'ar'));
    expect(arabic['text-heading-1-font-family']).toBe(getAppFontFamily('sectionHeading', 'ar'));
    expect(arabic['text-heading-1-font-family']).toBe(appFontFamilies.readex);
  });

  it('preserves AppText and AppTextInput font resolution and locale direction changes', () => {
    const view = render(
      <Wrapper>
        <ThemeProbe />
      </Wrapper>,
    );

    expect(StyleSheet.flatten(screen.getByTestId('sanad-app-text').props.style).fontFamily)
      .toBe(getAppFontFamily('body', 'fr'));
    expect(StyleSheet.flatten(screen.getByTestId('sanad-app-input').props.style).fontFamily)
      .toBe(getAppFontFamily('body', 'fr'));
    expect(resolveLayoutDirection(getLocale())).toBe('ltr');

    act(() => setLocale('en'));
    expect(resolveLayoutDirection(getLocale())).toBe('ltr');
    expect(StyleSheet.flatten(screen.getByTestId('sanad-app-text').props.style).fontFamily)
      .toBe(getAppFontFamily('body', 'en'));

    act(() => setLocale('ar'));
    expect(resolveLayoutDirection(getLocale())).toBe('rtl');
    expect(StyleSheet.flatten(screen.getByTestId('sanad-app-text').props.style).fontFamily)
      .toBe(getAppFontFamily('body', 'ar'));
    expect(StyleSheet.flatten(screen.getByTestId('eva-heading').props.style).fontFamily)
      .toBe(getAppFontFamily('sectionHeading', 'ar'));

    view.unmount();
  });
});
