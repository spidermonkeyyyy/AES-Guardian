import React from 'react';
import { act, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';
import NurseMessagesScreen from '../../communication/screens/NurseMessagesScreen';
import NursePatientProfileScreen from '../patients/screens/NursePatientProfileScreen';
import { useNursePatientsStore } from '../patients/state/use-nurse-patients-store';

describe('Nurse messages and patient detail', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setLocale('fr');
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('localizes nurse message and patient-detail copy', () => {
    const keys = [
      'nurse.messages.title',
      'nurse.messages.demoNotice',
      'nurse.messages.previewOnly',
      'nurse.patientDetail.loading',
      'nurse.patientDetail.profileNotFound',
      'nurse.patientDetail.retry',
      'nurse.patientDetail.demoNotice',
      'nurse.patientDetail.lastFollowUp',
      'nurse.patientDetail.noFollowUp',
      'nurse.patientDetail.data',
      'nurse.patientDetail.educationUnavailable',
      'nurse.patientDetail.noHistory',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('shows a local-only fictional nurse messages preview', () => {
    const screen = render(
      <ThemeProvider>
        <NurseMessagesScreen navigation={{ navigate: jest.fn() }} />
      </ThemeProvider>,
    );

    expect(screen.getByText(t('nurse.messages.title', 'fr'))).toBeTruthy();
    expect(screen.getByText(t('nurse.messages.demoNotice', 'fr'))).toBeTruthy();
    expect(screen.getAllByLabelText(t('nurse.messages.previewOnly', 'fr')).length).toBe(3);
  });

  it('renders a mock patient detail without invented live or education claims', () => {
    useNursePatientsStore.setState({
      isLoading: false,
      errorMessage: null,
      selectedPatient: {
        id: 'p-demo',
        fullName: 'Patient exemple',
        condition: 'BPCO',
        classification: 'GOLD',
        lastSubmissionAt: null,
        priority: 'reviewRequired',
        hasNewSubmission: false,
        latestSubmission: null,
        submissions: [],
        timeline: [],
        latestObservation: null,
      },
    });

    const screen = render(
      <ThemeProvider>
        <NursePatientProfileScreen
          route={{ params: { patientId: 'p-demo' } } as any}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText(t('nurse.patientDetail.demoNotice', 'fr'))).toBeTruthy();
    expect(screen.getByText(t('nurse.patientDetail.noFollowUp', 'fr'))).toBeTruthy();
    expect(screen.getByText(t('nurse.patientDetail.noMeasurement', 'fr'))).toBeTruthy();
    expect(screen.getByText(t('nurse.patientDetail.educationUnavailable', 'fr'))).toBeTruthy();
  });
});
