import {
  MedicationReminder,
  AdherenceRecord,
} from '../../../../types/treatment';

export interface TreatmentRepository {
  getTodaysReminders(): Promise<MedicationReminder[]>;
  confirmReminder(reminderId: string): Promise<MedicationReminder>;
  getWeeklyAdherence(days?: number): Promise<AdherenceRecord[]>;
  getHistory(limit?: number): Promise<MedicationReminder[]>;
}