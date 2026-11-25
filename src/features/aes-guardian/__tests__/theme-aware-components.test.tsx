import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { AppText } from '../../../components/AppText';
import { AppTextInput } from '../../../components/AppTextInput';
import { ThemeProvider, useTheme } from '../../../theme/ThemeContext';
import { AesScreenContainer } from '../components/AesScreenContainer';
import { AesStatusBadge } from '../components/AesStatusBadge';
import { AesButton } from '../components/AesButton';

function SetDarkModeOnMount() {
  const { setThemeMode } = useTheme();
  useEffect(() => {
    setThemeMode('dark');
  }, []);
  return null;
}

describe('theme-aware presentation components', () => {
  it('uses the active semantic text colors and supports text input theming', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AppText testID="primary">Heading</AppText>
        <AppTextInput testID="input" placeholder="Search" />
      </ThemeProvider>,
    );

    expect(getByTestId('primary').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#3e2723' })]),
    );
    expect(getByTestId('input').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#3e2723' })]),
    );
  });

  it('switches screen surfaces and status badges with the canonical theme', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <SetDarkModeOnMount />
        <AesScreenContainer testID="screen">
          <View />
        </AesScreenContainer>
        <AesStatusBadge status="closed" domain="declaration" />
        <AesButton title="Green action" onPress={() => {}} variant="green" testID="green-action" />
      </ThemeProvider>,
    );

    expect(getByTestId('screen').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#1c2a1f' })]),
    );
    expect(getByTestId('aes-status-badge').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#3e4a3d' })]),
    );
    expect(getByTestId('green-action').props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#81C784' }),
    );
  });

  it('applies top and landscape-side safe-area edges without claiming the bottom inset', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AesScreenContainer testID="safe-area-screen">
          <View />
        </AesScreenContainer>
      </ThemeProvider>,
    );

    expect(getByTestId('safe-area-screen').props.edges).toEqual({
      top: 'additive',
      right: 'additive',
      bottom: 'off',
      left: 'additive',
    });
  });

  it('uses live semantic status colors with readable contrast in both themes', () => {
    const light = render(
      <ThemeProvider>
        <AesStatusBadge status="under_review" domain="declaration" testID="light-warning" />
      </ThemeProvider>,
    );
    expect(StyleSheet.flatten(light.getByTestId('light-warning').props.style).backgroundColor)
      .toBe('#FFF3E0');
    expect(StyleSheet.flatten(light.getByTestId('light-warning-text').props.style).color)
      .toBe('#3e2723');
    light.unmount();

    const dark = render(
      <ThemeProvider>
        <SetDarkModeOnMount />
        <AesStatusBadge status="under_review" domain="declaration" testID="dark-warning" />
      </ThemeProvider>,
    );
    expect(StyleSheet.flatten(dark.getByTestId('dark-warning').props.style).backgroundColor)
      .toBe('#3E2A14');
    expect(StyleSheet.flatten(dark.getByTestId('dark-warning-text').props.style).color)
      .toBe('#f0ebe5');
  });
});
