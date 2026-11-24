import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { setLocale, SUPPORTED_LOCALES, t, translations } from '../../../localization';
import {
  MockNursePatientRepository,
} from '../../../services/repositories/nurse-patient-repository.mock';
import { NursePatientRepository } from '../../../services/repositories/nurse-patient-repository.interface';
import { setNursePatientRepository, useNursePatientsStore } from '../patients/state/use-nurse-patients-store';
import NursePatientsScreen from '../screens/NursePatientsScreen';

const navigation = {
  navigate: jest.fn(),
};

const failedRepository: NursePatientRepository = {
  getPatients: async () => { throw new Error('offline'); },
  searchPatients: async () => { throw new Error('offline'); },
  getPatient: async () => null,
  getAssignedPatients: async () => [],
  getPatientAssignments: async () => [],
};

describe('Nurse patients screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    setLocale('fr');
    setNursePatientRepository(new MockNursePatientRepository());
    useNursePatientsStore.setState({
      isLoading: true,
      errorMessage: null,
      patients: [],
      searchQuery: '',
      selectedPatient: null,
      filter: 'all',
    });
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
    setNursePatientRepository(new MockNursePatientRepository());
    act(() => {
      useNursePatientsStore.setState({
        isLoading: true,
        errorMessage: null,
        patients: [],
        searchQuery: '',
        selectedPatient: null,
        filter: 'all',
      });
    });
  });

  it('provides patient list labels in every locale', () => {
    const keys = [
      'nurse.patients.title',
      'nurse.patients.count',
      'nurse.patients.searchPlaceholder',
      'nurse.patients.filter.all',
      'nurse.patients.filter.review',
      'nurse.patients.filter.followed',
      'nurse.patients.demoNotice',
      'nurse.patients.status.newCheckIn',
      'nurse.patients.status.noNewCheckIn',
      'nurse.patients.measurement.spo2',
      'nurse.patients.measurement.lastCheckIn',
      'nurse.patients.measurement.priority',
      'nurse.patients.notAvailable',
      'nurse.patients.priority.high',
      'nurse.patients.priority.review',
      'nurse.patients.priority.info',
      'nurse.patients.condition.copd',
      'nurse.patients.condition.severeAsthma',
      'nurse.patients.conditionUnavailable',
      'nurse.patients.error.load',
      'nurse.patients.error.search',
      'nurse.patients.error.generic',
      'nurse.patients.retry',
      'nurse.patients.empty',
    ] as const;

    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('discloses fictional records and does not fabricate a missing reading or date', async () => {
    const screen = render(<NursePatientsScreen navigation={navigation} />);
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(screen.getByText(t('nurse.patients.demoNotice', 'fr'))).toBeTruthy();
    expect(screen.getByText('91 %')).toBeTruthy();
    expect(screen.getByText('94 %')).toBeTruthy();
    expect(screen.queryByText('96 %')).toBeNull();
    expect(screen.queryByText('Stable')).toBeNull();
    expect(screen.queryByText('Aujourd’hui')).toBeNull();
    expect(
      screen.getAllByText(t('nurse.patients.notAvailable', 'fr')).length,
    ).toBeGreaterThan(0);
  });

  it('filters patients and presents a retry state when loading fails', async () => {
    const screen = render(<NursePatientsScreen navigation={navigation} />);
    await act(async () => {
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    fireEvent.press(screen.getByLabelText(t('nurse.patients.filter.review', 'fr')));
    expect(screen.queryByText('Karim Meziane')).toBeNull();

    setNursePatientRepository(failedRepository);
    await act(async () => {
      await useNursePatientsStore.getState().loadPatients();
    });
    expect(screen.getByText(t('nurse.patients.error.generic', 'fr'))).toBeTruthy();
    expect(screen.getByText(t('nurse.patients.retry', 'fr'))).toBeTruthy();
  });
});
