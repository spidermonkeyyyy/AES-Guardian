import React, { useEffect } from 'react';
import { View } from 'react-native';
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
});
