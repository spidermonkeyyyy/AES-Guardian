import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import { RulesScreen } from '../rules/screens/RulesScreen';
import RuleBuilderScreen from '../rules/screens/RuleBuilderScreen';
import { useRuleStore } from '../rules/state/use-rule-store';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const ReactRuntime = require('react');
  return {
    ...actual,
    useRoute: () => ({ params: { ruleId: 'new' } }),
    useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      ReactRuntime.useEffect(() => callback(), [callback]);
    },
  };
});

describe('Nurse rule screens', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setLocale('fr');
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('has localized rule workflow copy in every locale', () => {
    const keys = [
      'nurse.rules.title',
      'nurse.rules.summary',
      'nurse.rules.filterAll',
      'nurse.rules.filterActive',
      'nurse.rules.emptyTitle',
      'nurse.rules.emptyMessage',
      'nurse.rules.create',
      'nurse.rules.builderName',
      'nurse.rules.builderDescription',
      'nurse.rules.builderPriority',
      'nurse.rules.save',
      'nurse.rules.cancel',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('renders the rule list and opens the builder route', async () => {
    const navigation = { navigate: jest.fn() };
    const screen = render(
      <ThemeProvider>
        <RulesScreen navigation={navigation} />
      </ThemeProvider>,
    );

    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => {
      expect(screen.getByText(t('nurse.rules.create', 'fr'))).toBeTruthy();
    });
    fireEvent.press(screen.getByText(t('nurse.rules.create', 'fr')));
    expect(navigation.navigate).toHaveBeenCalledWith('ruleBuilder', { ruleId: 'new' });
  });

  it('allows name and description editing in the rule builder', async () => {
    useRuleStore.setState({
      availableMetrics: [
        { key: 'spo2', label: 'SpO₂', unit: '%', supportedOperators: ['less_than'], valueHint: '' },
      ],
    });
    const screen = render(
      <ThemeProvider>
        <RuleBuilderScreen />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(t('nurse.rules.builderName', 'fr'))).toBeTruthy();
    });
    fireEvent.changeText(
      screen.getByPlaceholderText(t('nurse.rules.builderName', 'fr')),
      'Nouvelle règle test',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText(t('nurse.rules.builderDescription', 'fr')),
      'Description test',
    );
    expect(useRuleStore.getState().name).toBe('Nouvelle règle test');
    expect(useRuleStore.getState().description).toBe('Description test');
  });
});
