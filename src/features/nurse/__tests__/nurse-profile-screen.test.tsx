import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import NurseProfileScreen from '../screens/NurseProfileScreen';

const navigation = {
  navigate: jest.fn(),
};

describe('Nurse profile screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setLocale('fr');
    useAuthStore.setState({ user: null });
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('provides localized profile and tool labels', () => {
    const keys = [
      'nurse.profile.title',
      'nurse.profile.nameUnavailable',
      'nurse.profile.emailUnavailable',
      'nurse.profile.role',
      'nurse.profile.themeSection',
      'nurse.profile.displayMode',
      'nurse.profile.theme.system',
      'nurse.profile.theme.dark',
      'nurse.profile.theme.light',
      'nurse.profile.languageSection',
      'nurse.profile.toolsSection',
      'nurse.profile.rules.title',
      'nurse.profile.rules.subtitle',
      'nurse.profile.design.title',
      'nurse.profile.design.subtitle',
      'nurse.profile.preferencesNotice',
      'nurse.profile.logout',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('does not show fabricated identity details or build metadata', () => {
    const screen = render(
      <ThemeProvider>
        <NurseProfileScreen navigation={navigation} />
      </ThemeProvider>,
    );

    expect(screen.getByText(t('nurse.profile.nameUnavailable', 'fr'))).toBeTruthy();
    expect(screen.getByText(t('nurse.profile.emailUnavailable', 'fr'))).toBeTruthy();
    expect(screen.queryByText('Infirmière Sarah Benali')).toBeNull();
    expect(screen.queryByText('nurse@respiracare.org')).toBeNull();
    expect(screen.queryByText(/v1\.0\.0|Espace Soignant/)).toBeNull();
  });

  it('changes the language and preserves routes to available tools', () => {
    const screen = render(
      <ThemeProvider>
        <NurseProfileScreen navigation={navigation} />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByLabelText('English'));
    expect(screen.getByText(t('nurse.profile.title', 'en'))).toBeTruthy();
    fireEvent.press(screen.getByLabelText(t('nurse.profile.rules.title', 'en')));
    fireEvent.press(screen.getByLabelText(t('nurse.profile.design.title', 'en')));

    expect(navigation.navigate.mock.calls).toEqual([
      ['rules'],
      ['designSystem'],
    ]);
  });
});
