import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import { useMonitoringStore } from '../state/use-monitoring-store';
import MonitoringIntroScreen from '../screens/MonitoringIntroScreen';

const navigation = {
  navigate: jest.fn(),
};

const openSpO2Question = () => {
  const screen = render(<MonitoringIntroScreen navigation={navigation} />);
  fireEvent.press(screen.getByText(t('monitoring.start', 'fr')));
  fireEvent.press(screen.getByText(t('monitoring.option.mmrc_4', 'fr')));
  fireEvent.press(screen.getByText(t('monitoring.next', 'fr')));
  fireEvent.press(screen.getByText(t('monitoring.option.cough_normal', 'fr')));
  fireEvent.press(screen.getByText(t('monitoring.next', 'fr')));
  fireEvent.press(screen.getByText(t('monitoring.option.sputum_normal', 'fr')));
  fireEvent.press(screen.getByText(t('monitoring.next', 'fr')));
  return screen;
};

describe('Monitoring introduction and questionnaire', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setLocale('fr');
    useMonitoringStore.getState().reset();
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('provides complete localized copy for all supported locales', () => {
    const keys = [
      'monitoring.headerTitle',
      'monitoring.resultHeader',
      'monitoring.introTitle',
      'monitoring.introSubtitle',
      'monitoring.demoDisclosure',
      'monitoring.estimatedDuration',
      'monitoring.start',
      'monitoring.questionProgress',
      'monitoring.next',
      'monitoring.submit',
      'monitoring.previous',
      'monitoring.result.reviewTitle',
      'monitoring.result.normalTitle',
      'monitoring.result.reviewMessage',
      'monitoring.result.normalMessage',
      'monitoring.backHome',
      'monitoring.question.dyspnea',
      'monitoring.question.cough',
      'monitoring.question.sputum',
      'monitoring.question.spo2',
      'monitoring.option.mmrc_0',
      'monitoring.option.mmrc_1',
      'monitoring.option.mmrc_2',
      'monitoring.option.mmrc_3',
      'monitoring.option.mmrc_4',
      'monitoring.option.cough_normal',
      'monitoring.option.cough_mild',
      'monitoring.option.cough_severe',
      'monitoring.option.sputum_normal',
      'monitoring.option.sputum_amount',
      'monitoring.option.sputum_color',
      'monitoring.spo2.placeholder',
      'monitoring.spo2.modeBluetooth',
      'monitoring.spo2.modeManual',
      'monitoring.spo2.errorRequired',
      'monitoring.spo2.errorRange',
      'monitoring.spo2.decrease',
      'monitoring.spo2.increase',
      'monitoring.spo2.accessibility',
      'monitoring.spo2.noMeasurement',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('discloses that demo answers are local-only and localizes the questionnaire', () => {
    const screen = render(<MonitoringIntroScreen navigation={navigation} />);

    expect(screen.getByText(t('monitoring.demoDisclosure', 'fr'))).toBeTruthy();
    act(() => setLocale('en'));
    expect(screen.getByText(t('monitoring.demoDisclosure', 'en'))).toBeTruthy();
    expect(screen.getByText(t('monitoring.start', 'en'))).toBeTruthy();
  });

  it('allows the optional SpO2 question to be skipped without claiming data was sent', () => {
    const screen = openSpO2Question();

    fireEvent.press(screen.getByText(t('monitoring.spo2.noMeasurement', 'fr')));
    fireEvent.press(screen.getByText(t('monitoring.submit', 'fr')));

    expect(screen.getByText(t('monitoring.result.reviewTitle', 'fr'))).toBeTruthy();
    expect(screen.getByText(t('monitoring.result.reviewMessage', 'fr'))).toBeTruthy();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('validates manually entered SpO2 values', () => {
    const screen = openSpO2Question();
    const input = screen.getByLabelText(t('monitoring.spo2.accessibility', 'fr'));

    fireEvent.changeText(input, '101');
    expect(screen.getByText(t('monitoring.spo2.errorRange', 'fr'))).toBeTruthy();

    fireEvent.changeText(input, '94');
    expect(screen.queryByText(t('monitoring.spo2.errorRange', 'fr'))).toBeNull();
  });
});
