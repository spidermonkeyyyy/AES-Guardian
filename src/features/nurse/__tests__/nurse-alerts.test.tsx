import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import NurseAlertsScreen from '../screens/NurseAlertsScreen';

describe('Nurse alerts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setLocale('fr');
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('provides localized alert labels and demo disclosure', () => {
    const keys = [
      'nurse.alerts.title',
      'nurse.alerts.demoNotice',
      'nurse.alerts.filter.all',
      'nurse.alerts.filter.critical',
      'nurse.alerts.filter.warning',
      'nurse.alerts.patient.a',
      'nurse.alerts.patient.b',
      'nurse.alerts.patient.c',
      'nurse.alerts.type.criticalSpo2',
      'nurse.alerts.type.dyspnea',
      'nurse.alerts.type.missedCheckIn',
      'nurse.alerts.description.lowSpo2',
      'nurse.alerts.description.dyspnea',
      'nurse.alerts.description.missedCheckIn',
      'nurse.alerts.time.minutesAgo',
      'nurse.alerts.time.hoursAgo',
      'nurse.alerts.severity.urgent',
      'nurse.alerts.severity.warning',
      'nurse.alerts.severity.info',
      'nurse.alerts.acknowledge',
      'nurse.alerts.acknowledged',
      'nurse.alerts.empty',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('clearly marks synthetic alerts and does not expose real identities', () => {
    const { getByText, queryByText } = render(<NurseAlertsScreen />);

    expect(getByText(t('nurse.alerts.demoNotice', 'fr'))).toBeTruthy();
    expect(getByText(t('nurse.alerts.patient.a', 'fr'))).toBeTruthy();
    expect(queryByText('Ahmed Benali')).toBeNull();
    expect(queryByText('Jean Dupont')).toBeNull();
    expect(queryByText('Marie Curie')).toBeNull();
  });

  it('filters alerts and acknowledges them only in the local demo state', () => {
    const { getByLabelText, getByText, queryByText } = render(<NurseAlertsScreen />);

    fireEvent.press(
      getByLabelText(`${t('nurse.alerts.filter.critical', 'fr')} (1)`),
    );
    expect(getByText(t('nurse.alerts.type.criticalSpo2', 'fr'))).toBeTruthy();
    expect(queryByText(t('nurse.alerts.type.dyspnea', 'fr'))).toBeNull();

    fireEvent.press(
      getByLabelText(
        `${t('nurse.alerts.acknowledge', 'fr')}: ${t('nurse.alerts.patient.a', 'fr')}`,
      ),
    );
    expect(getByText(t('nurse.alerts.acknowledged', 'fr'))).toBeTruthy();
  });
});
