import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';
import { setLocale } from '../../localization';
import {
  DirectionalStackBackButton,
  DirectionalStackHeaderTitle,
  getDirectionalStackBackSide,
  getLocalizedStackTitle,
} from '../DirectionalStackBackButton';
import { StyleSheet } from 'react-native';
import AppIcon from '../../components/AppIcon';

const mockNavigation = {
  canGoBack: jest.fn(() => true),
  goBack: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock('../../theme/ThemeContext', () => ({
  useTheme: () => ({ colors: { foreground: '#111111' } }),
}));

describe('DirectionalStackBackButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigation.canGoBack.mockReturnValue(true);
  });

  it.each([
    ['fr', 'left', 'Retour'],
    ['en', 'left', 'Back'],
    ['ar', 'right', 'رجوع'],
  ] as const)('renders the %s back control on the %s side', (locale, side, label) => {
    setLocale(locale);
    const { getByRole, getByTestId, queryByTestId } = render(
      <>
        <DirectionalStackBackButton side="left" />
        <DirectionalStackBackButton side="right" />
      </>,
    );

    expect(getByTestId(`stack-back-${side}`).findByType(AppIcon).props.name).toBe('back');
    expect(getByRole('button').props.accessibilityLabel).toBe(label);
    expect(getByTestId(`stack-back-${side}`)).toBeTruthy();
    expect(queryByTestId(`stack-back-${side === 'left' ? 'right' : 'left'}`)).toBeNull();
  });

  it('does not render a back control when there is no previous route', () => {
    setLocale('fr');
    mockNavigation.canGoBack.mockReturnValue(false);
    const { queryByRole } = render(<DirectionalStackBackButton side="left" />);
    expect(queryByRole('button')).toBeNull();
  });

  it('uses the navigation action when pressed', () => {
    setLocale('fr');
    const { getByRole } = render(<DirectionalStackBackButton side="left" />);
    fireEvent.press(getByRole('button'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['fr', 'Espace SANAD'],
    ['en', 'SANAD Workspace'],
    ['ar', 'مساحة SANAD'],
  ] as const)('uses the active %s workspace title', (locale, title) => {
    expect(getLocalizedStackTitle('aesGuardianWorkspace', 'stale title', locale)).toBe(title);
  });

  it.each([
    ['fr', 'Tableau de bord de surveillance'],
    ['en', 'Surveillance Dashboard'],
    ['ar', 'لوحة بيانات المراقبة'],
  ] as const)('localizes a dashboard native-stack title in %s', (locale, title) => {
    expect(getLocalizedStackTitle('surveillanceDashboard', 'stale title', locale)).toBe(title);
  });

  it('uses the fallback for routes without an AES title mapping', () => {
    expect(getLocalizedStackTitle('signIn', 'Sign in', 'en')).toBe('Sign in');
  });

  it.each([
    ['fr', 'left'],
    ['en', 'left'],
    ['ar', 'right'],
  ] as const)('selects one physical back-control side for %s', (locale, side) => {
    expect(getDirectionalStackBackSide(locale)).toBe(side);
  });

  it('updates title alignment and writing direction when the active locale changes', () => {
    setLocale('fr');
    const component = render(<DirectionalStackHeaderTitle>Workspace</DirectionalStackHeaderTitle>);
    expect(StyleSheet.flatten(component.getByText('Workspace').props.style)).toMatchObject({
      textAlign: 'left',
      writingDirection: 'ltr',
      flexShrink: 1,
    });

    act(() => setLocale('ar'));
    expect(StyleSheet.flatten(component.getByText('Workspace').props.style)).toMatchObject({
      textAlign: 'right',
      writingDirection: 'rtl',
      flexShrink: 1,
    });
  });
});
