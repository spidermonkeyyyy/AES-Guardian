import { create } from 'zustand';
import { NursePatientRepository } from '../../../../services/repositories/nurse-patient-repository.interface';
import { Patient, PatientRosterFilter, matchesPatientRosterFilter } from '../../../../types/patient';
import { MockNursePatientRepository } from '../../../../services/repositories/nurse-patient-repository.mock';

export { matchesPatientRosterFilter } from '../../../../types/patient';

export interface NursePatientsState {
  isLoading: boolean;
  errorMessage: string | null;
  patients: Patient[];
  searchQuery: string;
  selectedPatient: Patient | null;
  filter: PatientRosterFilter;
  loadPatients: () => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  selectPatient: (patientId: string) => Promise<void>;
  setFilter: (filter: PatientRosterFilter) => void;
  clearSelection: () => void;
  filteredPatients: Patient[];
}

let repository: NursePatientRepository = new MockNursePatientRepository();

export function setNursePatientRepository(repo: NursePatientRepository): void {
  repository = repo;
}

export function getNursePatientRepository(): NursePatientRepository {
  return repository;
}

export const useNursePatientsStore = create<NursePatientsState>((set, get) => ({
  isLoading: true,
  errorMessage: null,
  patients: [],
  searchQuery: '',
  selectedPatient: null,
  filter: 'all',

  loadPatients: async () => {
    set({ isLoading: true, errorMessage: null, searchQuery: '' });
    try {
      const patients = await repository.getPatients();
      set({ patients, isLoading: false, errorMessage: null });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: 'Impossible de charger la liste des patients.',
      });
    }
  },

  searchPatients: async (query: string) => {
    set({ isLoading: true, errorMessage: null, searchQuery: query });
    try {
      const patients = await repository.searchPatients(query);
      set({ patients, isLoading: false, errorMessage: null });
    } catch (error) {
      set({
        isLoading: false,
        errorMessage: 'Impossible de filtrer les patients.',
      });
    }
  },

  selectPatient: async (patientId: string) => {
    const state = get();
    if (state.selectedPatient?.id === patientId) return;
    set({ errorMessage: null });
    try {
      const patient = await repository.getPatient(patientId);
      set({ selectedPatient: patient });
    } catch (error) {
      set({ errorMessage: "Impossible d'ouvrir le profil du patient." });
    }
  },

  setFilter: (filter: PatientRosterFilter) => {
    set({ filter });
  },

  clearSelection: () => {
    set({ selectedPatient: null });
  },

  get filteredPatients() {
    const state = get();
    return state.patients.filter((patient) => matchesPatientRosterFilter(patient, state.filter));
  },
}));
