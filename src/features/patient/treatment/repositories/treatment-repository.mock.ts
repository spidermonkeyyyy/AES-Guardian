import { TreatmentRepository } from './treatment-repository';
import {
  MedicationReminder,
  AdherenceRecord,
  MedicationStatus,
} from '../../../../types/treatment';

const DAY_MS = 24 * 60 * 60 * 1000;

function dateCopyWith(
  date: Date,
  opts: { hour?: number; minute?: number },
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    opts.hour ?? date.getHours(),
    opts.minute ?? date.getMinutes(),
    0,
    0,
  );
}

function todayAt(hour: number, minute: number): Date {
  const now = new Date();
  return dateCopyWith(now, { hour, minute });
}

function todayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isoDate(date: Date): string {
  return date.toISOString();
}

/**
 * Mock implementation of TreatmentRepository.
 * Reproduces the audited Flutter MockTreatmentRepository behavior:
 * - 2 reminders per day (morning 08:00, evening 20:00)
 * - Morning reminder: already confirmed at 08:02
 * - Evening reminder: pending until patient confirms
 * - Mutable in-memory state for confirmation actions
 * - getHistory: 7 days back, morning always confirmed, evening missed on day 4
 * - getWeeklyAdherence: 7 records, scheduledCount=2 always, one day with confirmed=1
 * - Artificial delays ~300-400ms
 * - Throws on unknown reminder ID in confirmReminder
 */
export class MockTreatmentRepository implements TreatmentRepository {
  // Mutable in-memory reminders (Flutter: _todayReminders field)
  private _todayReminders: MedicationReminder[];

  constructor() {
    const today = todayMidnight();
    this._todayReminders = [
      {
        id: 'reminder-morning',
        medicationId: 'med-001',
        medicationLabel: 'Traitement inhalé 1',
        scheduledAt: isoDate(dateCopyWith(today, { hour: 8, minute: 0 })),
        status: 'confirmed',
        frequency: 'Selon prescription',
        confirmedAt: isoDate(dateCopyWith(today, { hour: 8, minute: 2 })),
      },
      {
        id: 'reminder-evening',
        medicationId: 'med-001',
        medicationLabel: 'Traitement inhalé 1',
        scheduledAt: isoDate(dateCopyWith(today, { hour: 20, minute: 0 })),
        status: 'pending',
        frequency: 'Selon prescription',
      },
    ];
  }

  async getTodaysReminders(): Promise<MedicationReminder[]> {
    await delay(400);
    // Flutter returns List.unmodifiable(_todayReminders)
    return this._todayReminders.map((r) => ({ ...r }));
  }

  async confirmReminder(reminderId: string): Promise<MedicationReminder> {
    await delay(300);
    const index = this._todayReminders.findIndex((r) => r.id === reminderId);
    if (index === -1) {
      throw new Error(`Reminder ${reminderId} not found`);
    }
    const updated: MedicationReminder = {
      ...this._todayReminders[index],
      status: 'confirmed',
      confirmedAt: isoDate(new Date()),
    };
    this._todayReminders[index] = updated;
    return { ...updated };
  }

  async getWeeklyAdherence(days = 7): Promise<AdherenceRecord[]> {
    await delay(300);
    const now = new Date();
    const records: AdherenceRecord[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      date.setDate(date.getDate() - (days - 1 - i));
      // Flutter: simulated missed dose on day index 3 (day 4, "Thursday equivalent")
      // confirmed = (i == 3) ? 1 : 2
      const confirmedCount = i === 3 ? 1 : 2;
      records.push({
        date: isoDate(date),
        scheduledCount: 2,
        confirmedCount,
      });
    }
    return records;
  }

  async getHistory(limit = 30): Promise<MedicationReminder[]> {
    await delay(400);
    const now = new Date();
    const history: MedicationReminder[] = [];

    for (let day = 1; day <= 7; day++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      date.setDate(date.getDate() - day);
      const missedEvening = day === 4;

      // Morning dose — always confirmed in history
      history.push({
        id: `hist-${day}-morning`,
        medicationId: 'med-001',
        medicationLabel: 'Traitement inhalé 1',
        scheduledAt: isoDate(dateCopyWith(date, { hour: 8, minute: 0 })),
        status: 'confirmed',
        frequency: 'Selon prescription',
        confirmedAt: isoDate(dateCopyWith(date, { hour: 8, minute: 2 })),
      });

      // Evening dose — missed on day 4 (missedEvening = true)
      history.push({
        id: `hist-${day}-evening`,
        medicationId: 'med-001',
        medicationLabel: 'Traitement inhalé 1',
        scheduledAt: isoDate(dateCopyWith(date, { hour: 20, minute: 0 })),
        status: missedEvening ? 'notConfirmed' : 'confirmed',
        frequency: 'Selon prescription',
        confirmedAt: missedEvening
          ? undefined
          : isoDate(dateCopyWith(date, { hour: 20, minute: 3 })),
      });
    }

    // Sort descending (most recent first) — Flutter: history.sort((a,b) => b.scheduledAt.compareTo(a.scheduledAt))
    history.sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() -
        new Date(a.scheduledAt).getTime(),
    );
    return history.slice(0, limit);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}