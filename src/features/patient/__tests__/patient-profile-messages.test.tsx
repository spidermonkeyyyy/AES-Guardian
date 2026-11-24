import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import PatientMessagesScreen from '../../communication/screens/PatientMessagesScreen';
import PatientProfileScreen from '../screens/PatientProfileScreen';

describe('Patient profile and messages', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setLocale('fr');
    useAuthStore.setState({ user: null });
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('provides localized profile and messaging copy', () => {
    const keys = [
      'patient.messages.title',
      'patient.messages.demoNotice',
      'patient.messages.empty',
      'patient.messages.composerPlaceholder',
      'patient.messages.composerLabel',
      'patient.messages.addPreview',
      'patient.profile.title',
      'patient.profile.nameUnavailable',
      'patient.profile.emailUnavailable',
      'patient.profile.role',
      'patient.profile.themeSection',
      'patient.profile.displayMode',
      'patient.profile.theme.system',
      'patient.profile.theme.dark',
      'patient.profile.theme.light',
      'patient.profile.languageSection',
      'patient.profile.preferencesSection',
      'patient.profile.preferencesNotice',
      'patient.profile.logout',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('does not show fabricated identity details or build metadata', () => {
    const { getByText, queryByText } = render(
      <ThemeProvider>
        <PatientProfileScreen />
      </ThemeProvider>,
    );

    expect(getByText(t('patient.profile.nameUnavailable', 'fr'))).toBeTruthy();
    expect(getByText(t('patient.profile.emailUnavailable', 'fr'))).toBeTruthy();
    expect(queryByText('Jean Dupont')).toBeNull();
    expect(queryByText('patient@respiracare.org')).toBeNull();
    expect(queryByText(/Build 76|v1\.0\.0/)).toBeNull();
  });

  it('lets the patient change the app language from the profile', () => {
    const { getByLabelText, getByText } = render(
      <ThemeProvider>
        <PatientProfileScreen />
      </ThemeProvider>,
    );

    fireEvent.press(getByLabelText('English'));
    expect(getByText(t('patient.profile.title', 'en'))).toBeTruthy();
    expect(getByText(t('patient.profile.preferencesNotice', 'en'))).toBeTruthy();
  });

  it('starts with no fabricated conversation and labels messages as local-only', () => {
    const { getByText, queryByText } = render(<PatientMessagesScreen />);

    expect(getByText(t('patient.messages.demoNotice', 'fr'))).toBeTruthy();
    expect(getByText(t('patient.messages.empty', 'fr'))).toBeTruthy();
    expect(queryByText(/Jean Dupont|Sarah|Spiriva|Ventoline|96%/)).toBeNull();
    expect(queryByText(/sécurisés/)).toBeNull();
  });

  it('keeps entered test messages in the local preview without claiming delivery', () => {
    const { getByLabelText, getByText } = render(<PatientMessagesScreen />);
    const input = getByLabelText(t('patient.messages.composerLabel', 'fr'));

    fireEvent.changeText(input, 'Message de test');
    fireEvent.press(getByLabelText(t('patient.messages.addPreview', 'fr')));

    expect(getByText('Message de test')).toBeTruthy();
    expect(getByText(t('patient.messages.demoNotice', 'fr'))).toBeTruthy();
  });
});
