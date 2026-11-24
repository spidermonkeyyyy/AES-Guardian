import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  setLocale,
  SUPPORTED_LOCALES,
  t,
  translations,
} from '../../../../localization';
import AuthGateScreen from '../AuthGateScreen';

describe('AuthGateScreen', () => {
  beforeEach(() => setLocale('en'));

  it('provides localized gateway and emergency copy in every supported language', () => {
    const keys = [
      'authGate.subtitle',
      'authGate.getStarted',
      'authGate.signIn',
      'authGate.aesDemo',
      'authGate.aesTour',
      'authGate.moreDemoShortcuts',
      'authGate.hideDemoShortcuts',
      'authGate.declarations',
      'authGate.adminReview',
      'authGate.ohCoordination',
      'authGate.surveillance',
      'authGate.prevention',
      'authGate.emergencyTitle',
      'authGate.emergencyMessage',
      'authGate.close',
      'authGate.needImmediateHelp',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('keeps demo shortcuts collapsed until requested, then exposes them', () => {
    const navigation = { navigate: jest.fn() };
    const { getByTestId, queryByText, getByText } = render(
      <AuthGateScreen navigation={navigation} />,
    );

    expect(queryByText(t('authGate.declarations', 'en'))).toBeNull();
    fireEvent.press(getByTestId('auth-demo-shortcuts-toggle'));

    expect(getByText(t('authGate.declarations', 'en'))).toBeTruthy();
    expect(getByText(t('authGate.adminReview', 'en'))).toBeTruthy();
  });
});
