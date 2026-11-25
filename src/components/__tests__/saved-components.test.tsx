import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { ThemeProvider } from '../../theme/ThemeContext';
import { setLocale } from '../../localization';
import { AppIcon } from '../AppIcon';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '../saved/Alert';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../saved/Empty';

jest.mock('react-native-reanimated', () => {
  const ReactRuntime = require('react');
  const { View } = require('react-native');
  const identity = (value: unknown) => value;
  return {
    __esModule: true,
    default: {
      View: (props: Record<string, unknown>) => ReactRuntime.createElement(View, props),
    },
    Easing: {
      out: () => identity,
      cubic: identity,
      bezier: () => identity,
    },
    runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
    useAnimatedStyle: (callback: () => Record<string, unknown>) => callback(),
    useReducedMotion: () => true,
    useSharedValue: (initialValue: unknown) => ({ value: initialValue }),
    withDelay: (_delay: number, value: unknown) => value,
    withTiming: (value: unknown) => value,
  };
});

describe('Saved Alert and Empty components', () => {
  beforeEach(() => setLocale('fr'));

  test.each([
    ['info', 'Information'],
    ['warning', 'Attention'],
    ['error', 'Échec'],
  ] as const)('renders %s alert content and semantics', (variant, text) => {
    const { getByText, getByTestId } = render(
      <ThemeProvider>
        <Alert variant={variant} testID={`alert-${variant}`} accessibilityRole="alert">
          <AlertIcon><AppIcon name="info" size={16} decorative /></AlertIcon>
          <AlertTitle>{text}</AlertTitle>
          <AlertDescription>Contenu localisé</AlertDescription>
        </Alert>
      </ThemeProvider>,
    );
    expect(getByTestId(`alert-${variant}`)).toBeTruthy();
    expect(getByText(text)).toBeTruthy();
    expect(getByText('Contenu localisé')).toBeTruthy();
  });

  test('mandatory alert remains non-dismissible', () => {
    const { queryByTestId, getByText } = render(
      <ThemeProvider>
        <Alert variant="warning" dismissible={false} testID="mandatory-alert">
          <AlertDescription>Données synthétiques</AlertDescription>
        </Alert>
      </ThemeProvider>,
    );
    expect(getByText('Données synthétiques')).toBeTruthy();
    expect(queryByTestId('alert-close')).toBeNull();
  });

  test('dismiss action invokes open-change callback and retry action invokes callback', () => {
    const onOpenChange = jest.fn();
    const onRetry = jest.fn();
    const { getByLabelText, getByText } = render(
      <ThemeProvider>
        <Alert
          variant="error"
          dismissible
          closeLabel="Fermer"
          onOpenChange={onOpenChange}
        >
          <AlertDescription>Erreur</AlertDescription>
          <AlertAction>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              testID="saved-alert-retry"
            >
              <Text>Réessayer</Text>
            </Pressable>
          </AlertAction>
        </Alert>
      </ThemeProvider>,
    );
    fireEvent.press(getByText('Réessayer'));
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.press(getByLabelText('Fermer'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('renders Empty in Arabic RTL with localized text', () => {
    setLocale('ar');
    const { getByText, getByTestId } = render(
      <ThemeProvider>
        <Empty testID="notification-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AppIcon name="bell" size={24} decorative />
            </EmptyMedia>
            <EmptyTitle>لا توجد إشعارات</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>ليس لديك أي إشعارات في الوقت الحالي.</EmptyDescription>
        </Empty>
      </ThemeProvider>,
    );
    expect(getByTestId('notification-empty')).toBeTruthy();
    expect(getByText('لا توجد إشعارات')).toBeTruthy();
    expect(getByText('ليس لديك أي إشعارات في الوقت الحالي.')).toBeTruthy();
  });
});
