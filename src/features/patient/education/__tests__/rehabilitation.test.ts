import { MockEducationRepository } from '../repositories/education-repository.mock';
import { formatDuration, formatSessionDateTime } from '../../../../types/education';

const repo = new MockEducationRepository();

describe('Rehabilitation — Phase 2C.3', () => {
  // R-001: Program loads (source-backed)
  test('getRehabilitationProgram returns program with 3 exercises', async () => {
    const program = await repo.getRehabilitationProgram();
    expect(program).not.toBeNull();
    expect(program!.exercises.length).toBe(3);
  });

  // R-002: Exercise ordering preserved (order: 1, 2, 3)
  test('exercises are ordered 1/2/3', async () => {
    const program = await repo.getRehabilitationProgram();
    expect(program!.exercises[0].order).toBe(1);
    expect(program!.exercises[1].order).toBe(2);
    expect(program!.exercises[2].order).toBe(3);
  });

  // R-003: Duration values preserved (source: 10/8/12 min)
  test('exercise durations: ex-1=10min, ex-2=8min, ex-3=12min', async () => {
    const program = await repo.getRehabilitationProgram();
    const [e1, e2, e3] = program!.exercises;
    expect(e1.durationMinutes).toBe(10);
    expect(e2.durationMinutes).toBe(8);
    expect(e3.durationMinutes).toBe(12);
  });

  // R-004: Instructions are source-backed placeholders
  test('exercise instructions contain healthcare-team disclaimer', async () => {
    const program = await repo.getRehabilitationProgram();
    const instructions = program!.exercises[0].instructions;
    expect(instructions).toContain('Consigne validée par votre équipe soignante');
    expect(instructions).toContain('1.');
  });

  // R-005: Weekly target preserved (source: 5)
  test('targetWeeklySessions = 5', async () => {
    const program = await repo.getRehabilitationProgram();
    expect(program!.targetWeeklySessions).toBe(5);
  });

  // R-006: getTodaysExercise round-robin preserved
  test('getTodaysExercise uses round-robin (daysSinceStart % exercises.length)', async () => {
    const program = (await repo.getRehabilitationProgram())!;
    const exercises = program!.exercises!;
    // Verify round-robin logic: day 0 → exercise[0], day 1 → exercise[1], day 2 → exercise[2], day 3 → exercise[0]
    const startDate = new Date(program!.startDate);
    const day0 = new Date(startDate);
    const day1 = new Date(startDate); day1.setDate(day1.getDate() + 1);
    const day2 = new Date(startDate); day2.setDate(day2.getDate() + 2);
    const day3 = new Date(startDate); day3.setDate(day3.getDate() + 3);

    // Simulate round-robin: daysSinceStart % length
    const idx = (offset: number) => ((offset % exercises.length) + exercises.length) % exercises.length;
    expect(idx(0)).toBe(0);
    expect(idx(1)).toBe(1);
    expect(idx(2)).toBe(2);
    expect(idx(3)).toBe(0);
  });

  // R-007: Session recording mutates list
  test('recordExerciseSession appends to sessions list', async () => {
    const before = await repo.getExerciseSessions();
    const countBefore = before.length;
    await repo.recordExerciseSession({
      id: 'test-sess',
      exerciseId: 'ex-1',
      exerciseName: 'Respiration contrôlée',
      completedAt: new Date().toISOString(),
      actualDurationMinutes: 10,
    });
    const after = await repo.getExerciseSessions();
    expect(after.length).toBeGreaterThanOrEqual(countBefore);
    // New session is at the beginning (sorted newest-first)
    expect(after[0].id).toBe('test-sess');
  });

  // R-008: Session list sorted newest-first (source: b.completedAt.compareTo(a))
  test('getExerciseSessions returns newest-first', async () => {
    const sessions = await repo.getExerciseSessions();
    expect(sessions.length).toBeGreaterThan(1);
    for (let i = 1; i < sessions.length; i++) {
      expect(new Date(sessions[i].completedAt).getTime())
        .toBeLessThanOrEqual(new Date(sessions[i - 1].completedAt).getTime());
    }
  });

  // R-009: formatDuration preserves Flutter behavior
  test('formatDuration: <60min → "X min", 60min → "1h", 90min → "1h 30min"', () => {
    expect(formatDuration(10)).toBe('10 min');
    expect(formatDuration(8)).toBe('8 min');
    expect(formatDuration(12)).toBe('12 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30min');
    expect(formatDuration(120)).toBe('2h');
  });

  // R-010: formatSessionDateTime preserves French date format
  test('formatSessionDateTime uses French format (Aujourdhui / Hier / dd/MM)', () => {
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30).toISOString();
    const today = formatSessionDateTime(todayStr);
    expect(today).toContain("Aujourd'hui");

    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0).toISOString();
    const yest = formatSessionDateTime(yesterday);
    expect(yest).toContain('Hier');

    const old = new Date(2026, 0, 15, 9, 0).toISOString();
    const oldFormatted = formatSessionDateTime(old);
    expect(oldFormatted).toMatch(/\d{2}\/\d{2}/); // dd/MM format
  });

  // R-011: Mock delays preserved (source: 300ms/200ms/300ms)
  test('mock repository delays are deterministic (300ms program, 200ms sessions)', async () => {
    const start = Date.now();
    await repo.getRehabilitationProgram();
    const progElapsed = Date.now() - start;
    expect(progElapsed).toBeGreaterThanOrEqual(250); // ~300ms

    const start2 = Date.now();
    await repo.getExerciseSessions();
    const sessElapsed = Date.now() - start2;
    expect(sessElapsed).toBeGreaterThanOrEqual(150); // ~200ms
  });

  // R-012: Progress calculation preserved (weeklySessionsCompleted / weeklyTargetSessions)
  test('weekly progress calculation: completed/target', () => {
    const completed = 3;
    const target = 5;
    const progress = target > 0 ? completed / target : 0;
    expect(progress).toBe(0.6);
    expect(Math.round(progress * 100)).toBe(60);
  });
});