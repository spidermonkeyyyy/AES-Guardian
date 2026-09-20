import {
  RehabilitationProgram,
  Exercise,
  ExerciseSession,
  SmokingEntry,
  EducationalContent,
} from '../../../../types/education';

export interface EducationRepository {
  getRehabilitationProgram(): Promise<RehabilitationProgram | null>;
  getExerciseSessions(limit?: number): Promise<ExerciseSession[]>;
  recordExerciseSession(session: ExerciseSession): Promise<ExerciseSession>;
  getSmokingEntries(limit?: number): Promise<SmokingEntry[]>;
  addSmokingEntry(entry: SmokingEntry): Promise<SmokingEntry>;
  deleteSmokingEntry(entryId: string): Promise<void>;
  getTrackedDaysCount(): Promise<number>;
  getCurrentGoal(): Promise<string>;
  getEducationalContent(category?: string): Promise<EducationalContent[]>;
  getEducationalContentById(id: string): Promise<EducationalContent | null>;
}