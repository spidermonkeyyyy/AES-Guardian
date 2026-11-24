import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import PatientHomeScreen from '../screens/PatientHomeScreen';
import PatientTreatmentScreen from '../screens/PatientTreatmentScreen';

const navigation = {
  navigate: jest.fn(),
};

describe('Patient screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLocale('fr');
    useAuthStore.setState({ user: null });
  });

  it('provides patient home and treatment copy in every supported locale', () => {
    const keys = [
      'patient.home.greeting',
      'patient.home.greetingGeneric',
      'patient.home.profileButton',
      'patient.home.demoNotice',
      'patient.home.monitorTitle',
      'patient.home.monitorSubtitle',
      'patient.home.monitorAction',
      'patient.home.carePlanTitle',
      'patient.home.carePlanSubtitle',
      'patient.home.carePlanAction',
      'patient.home.careTeamTitle',
      'patient.home.careTeamSubtitle',
      'patient.home.messagesAction',
      'patient.treatment.title',
      'patient.treatment.demoNotice',
      'patient.treatment.messagesAction',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('shows no fabricated health readings, patient, nurse, or medication details', () => {
    const { getByText, queryByText } = render(
      <PatientHomeScreen navigation={navigation} />,
    );

    expect(getByText(t('patient.home.greetingGeneric', 'fr'))).toBeTruthy();
    expect(getByText(t('patient.home.demoNotice', 'fr'))).toBeTruthy();
    expect(queryByText('96')).toBeNull();
    expect(queryByText('72')).toBeNull();
    expect(queryByText('Amina')).toBeNull();
    expect(queryByText('Sarah Benali')).toBeNull();
    expect(queryByText(/Spiriva|SpO₂/)).toBeNull();
  });

  it('routes patient home actions to the corresponding screens', () => {
    const { getByLabelText, getByText } = render(
      <PatientHomeScreen navigation={navigation} />,
    );

    fireEvent.press(getByLabelText(t('patient.home.profileButton', 'fr')));
    fireEvent.press(getByText(t('patient.home.monitorAction', 'fr')));
    fireEvent.press(getByText(t('patient.home.carePlanAction', 'fr')));
    fireEvent.press(getByText(t('patient.home.messagesAction', 'fr')));

    expect(navigation.navigate.mock.calls).toEqual([
      ['profile'],
      ['monitor'],
      ['treatment'],
      ['messages'],
    ]);
  });

  it('replaces placeholder prescriptions and exercises with an honest demo notice', () => {
    const { getByText, queryByText } = render(
      <PatientTreatmentScreen navigation={navigation} />,
    );

    expect(getByText(t('patient.treatment.demoNotice', 'fr'))).toBeTruthy();
    expect(queryByText(/Spiriva|Ventoline|Prednisolone|Respiration/)).toBeNull();

    fireEvent.press(getByText(t('patient.treatment.messagesAction', 'fr')));
    expect(navigation.navigate).toHaveBeenCalledWith('messages');
  });
});
