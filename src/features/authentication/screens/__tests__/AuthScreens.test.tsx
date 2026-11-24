import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../../localization';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import LoginScreen from '../LoginScreen';
import RegisterScreen from '../RegisterScreen';

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('Authentication screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLocale('fr');
  });

  it('provides complete localized copy for authentication flows', () => {
    const keys = [
      'auth.back',
      'auth.email',
      'auth.emailPlaceholder',
      'auth.password',
      'auth.passwordPlaceholder',
      'auth.signIn',
      'auth.createAccount',
      'auth.error.emailRequired',
      'auth.error.emailInvalid',
      'auth.login.title',
      'auth.login.subtitle',
      'auth.login.forgotPassword',
      'auth.login.noAccount',
      'auth.login.demoAccounts',
      'auth.login.patientDemo',
      'auth.login.nurseDemo',
      'auth.error.passwordRequired',
      'auth.error.passwordMin6',
      'auth.register.title',
      'auth.register.subtitle',
      'auth.register.fullName',
      'auth.register.namePlaceholder',
      'auth.register.passwordHelper',
      'auth.register.confirmPassword',
      'auth.register.terms',
      'auth.register.submitting',
      'auth.register.alreadyAccount',
      'auth.error.nameRequired',
      'auth.error.passwordMin8',
      'auth.error.passwordComplex',
      'auth.error.passwordMismatch',
      'auth.error.termsRequired',
      'auth.forgot.title',
      'auth.forgot.subtitle',
      'auth.forgot.emailSentTitle',
      'auth.forgot.emailSentBody',
      'auth.forgot.backToSignIn',
      'auth.forgot.sending',
      'auth.forgot.sendResetLink',
      'auth.forgot.emailAccessibility',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('shows localized email validation on sign in', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);

    fireEvent.press(getByText(t('auth.signIn', 'fr')));

    expect(getByText(t('auth.error.emailRequired', 'fr'))).toBeTruthy();
  });

  it('shows localized name validation on registration', () => {
    const { getByText } = render(<RegisterScreen navigation={navigation} />);

    fireEvent.press(getByText(t('auth.createAccount', 'fr')));

    expect(getByText(t('auth.error.nameRequired', 'fr'))).toBeTruthy();
  });

  it('shows localized email validation on password reset', () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={navigation} />);

    fireEvent.press(getByText(t('auth.forgot.sendResetLink', 'fr')));

    expect(getByText(t('auth.error.emailRequired', 'fr'))).toBeTruthy();
  });
});
