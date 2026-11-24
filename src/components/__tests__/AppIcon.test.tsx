import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import { resolveLayoutDirection, setLocale } from '../../localization';
import { appFontFamilies, getAppFontFamily, getThemeColors } from '../../theme/tokens';
import { ThemeProvider } from '../../theme/ThemeContext';
import AppText from '../AppText';
import AppTextInput from '../AppTextInput';
import AppIcon, {
  AppIconLabel,
  appIconRegistry,
  iconSizes,
  iconStrokeWidths,
  resolveAppIcon,
} from '../AppIcon';

const mockHugeiconsIcon = jest.requireMock('@hugeicons/react-native').HugeiconsIcon as jest.Mock;

describe('shared Hugeicons and typography foundation', () => {
  beforeEach(() => {
    setLocale('fr');
    mockHugeiconsIcon.mockClear();
  });

  it('uses verified registry entries and centralized size and stroke tokens', () => {
    expect(Object.keys(appIconRegistry)).toHaveLength(66);
    expect(Object.values(appIconRegistry).every(Boolean)).toBe(true);
    expect(iconSizes).toEqual({ xs: 12, sm: 16, md: 20, lg: 24, xl: 32, display: 48 });
    expect(iconStrokeWidths).toEqual({ compact: 1.5, standard: 1.75, strong: 2 });
  });

  it('renders decorative icons with themed defaults and hides them from accessibility', () => {
    render(
      <ThemeProvider>
        <AppIcon name="bell" testID="test-bell" />
      </ThemeProvider>,
    );

    const iconProps = mockHugeiconsIcon.mock.calls[0][0];
    expect(iconProps).toEqual(
      expect.objectContaining({
        icon: appIconRegistry.bell,
        size: iconSizes.md,
        strokeWidth: iconStrokeWidths.standard,
        color: getThemeColors(false).foreground,
        accessible: false,
        importantForAccessibility: 'no-hide-descendants',
        testID: 'test-bell',
      }),
    );
  });

  it('keeps meaningful icons accessible and honors explicit size, stroke, and color', () => {
    render(
      <ThemeProvider>
        <AppIcon
          name="warning"
          size="lg"
          strokeWidth="strong"
          color="#b42318"
          accessibilityLabel="Warning"
        />
      </ThemeProvider>,
    );

    const iconProps = mockHugeiconsIcon.mock.calls[0][0];
    expect(iconProps).toEqual(
      expect.objectContaining({
        size: iconSizes.lg,
        strokeWidth: iconStrokeWidths.strong,
        color: '#b42318',
        accessible: true,
        accessibilityLabel: 'Warning',
        accessibilityRole: 'image',
        importantForAccessibility: 'auto',
      }),
    );
  });

  it('maps back and forward icons to the reading direction', () => {
    expect(resolveAppIcon('back', 'ltr')).toBe(ArrowLeft01Icon);
    expect(resolveAppIcon('back', 'rtl')).toBe(ArrowRight01Icon);
    expect(resolveAppIcon('forward', 'ltr')).toBe(ArrowRight01Icon);
    expect(resolveAppIcon('forward', 'rtl')).toBe(ArrowLeft01Icon);
    expect(resolveAppIcon('forward-chevron', 'rtl')).toBe(
      resolveAppIcon('back-chevron', 'ltr'),
    );
    expect(resolveAppIcon('back-chevron', 'ltr')).not.toBe(
      resolveAppIcon('back-chevron', 'rtl'),
    );
    expect(resolveAppIcon('forward-chevron', 'ltr')).not.toBe(
      resolveAppIcon('forward-chevron', 'rtl'),
    );
  });

  it('keeps icon labels readable while treating the adjacent icon as decorative', () => {
    render(
      <ThemeProvider>
        <AppIconLabel name="lock">Private data</AppIconLabel>
      </ThemeProvider>,
    );

    expect(screen.getByText('Private data')).toBeTruthy();
    expect(mockHugeiconsIcon.mock.calls[0][0]).toEqual(
      expect.objectContaining({ accessible: false, importantForAccessibility: 'no-hide-descendants' }),
    );
  });

  it('uses the approved IBM Plex Latin and Arabic font families', () => {
    expect(getAppFontFamily('display', 'fr')).toBe(appFontFamilies.latinBold);
    expect(getAppFontFamily('body', 'en')).toBe(appFontFamilies.latinRegular);
    expect(getAppFontFamily('display', 'ar')).toBe(appFontFamilies.arabicBold);

    setLocale('ar');
    render(
      <ThemeProvider>
        <AppText typographyRole="display" style={{ fontFamily: 'YoungSerif' }}>
          Arabic heading
        </AppText>
      </ThemeProvider>,
    );

    const text = screen.getByText('Arabic heading');
    expect(StyleSheet.flatten(text.props.style).fontFamily).toBe(appFontFamilies.arabicBold);
  });

  it('resolves editable-field typography by locale and overrides Latin faces for Arabic', () => {
    setLocale('fr');
    const component = render(
      <AppTextInput
        placeholder="Search"
        style={{ fontFamily: 'InstrumentSans' }}
      />,
    );
    expect(
      StyleSheet.flatten(component.getByPlaceholderText('Search').props.style).fontFamily,
    ).toBe(appFontFamilies.latinRegular);

    act(() => setLocale('ar'));
    expect(
      StyleSheet.flatten(component.getByPlaceholderText('Search').props.style).fontFamily,
    ).toBe(appFontFamilies.arabic);
  });

  it('resolves the back affordance from the active FR, EN, or AR reading direction', () => {
    expect(resolveAppIcon('back', resolveLayoutDirection('fr'))).toBe(ArrowLeft01Icon);
    expect(resolveAppIcon('back', resolveLayoutDirection('en'))).toBe(ArrowLeft01Icon);
    expect(resolveAppIcon('back', resolveLayoutDirection('ar'))).toBe(ArrowRight01Icon);
  });
});
