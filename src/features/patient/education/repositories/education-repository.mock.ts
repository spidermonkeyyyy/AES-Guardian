import { EducationRepository } from './education-repository';
import {
  RehabilitationProgram,
  Exercise,
  ExerciseSession,
  SmokingEntry,
  EducationalContent,
} from '../../../../types/education';

const DAY_MS = 24 * 60 * 60 * 1000;

export class MockEducationRepository implements EducationRepository {
  private _program: RehabilitationProgram | null = null;
  private _exerciseSessions: ExerciseSession[] = [];
  private _smokingEntries: SmokingEntry[] = [];
  private _educationalContent: EducationalContent[] = [];
  private _currentGoal: string = 'Arrêt progressif';

  constructor() {
    this._initializeMockData();
  }

  private _initializeMockData() {
    // Rehabilitation Program
    const exercises: Exercise[] = [
      {
        id: 'ex-1',
        name: 'Respiration contrôlée',
        description:
            'Exercice de base pour contrôler la respiration et réduire l\'essoufflement.',
        durationMinutes: 10,
        instructions:
            '1. Asseyez-vous confortablement, dos droit\n2. Inspirez lentement par le nez pendant 2 temps\n3. Expirez doucement par la bouche entrouverte pendant 4 temps\n4. Répétez pendant 10 minutes\n\nConsigne validée par votre équipe soignante.',
        order: 1,
      },
      {
        id: 'ex-2',
        name: 'Mobilité thoracique',
        description:
            'Améliorer la souplesse et l\'amplitude respiratoire.',
        durationMinutes: 8,
        instructions:
            '1. Debout, pieds écartés largeur épaules\n2. Bras croisés sur la poitrine\n3. Inspirez en ouvrant les coudes\n4. Expirez en ramenant les coudes\n5. Répétez 10 fois\n\nConsigne validée par votre équipe soignante.',
        order: 2,
      },
      {
        id: 'ex-3',
        name: 'Exercices respiratoires',
        description: 'Renforcer les muscles respiratoires.',
        durationMinutes: 12,
        instructions:
            '1. Respiration diaphragmatique (5 min)\n2. Respiration à lèvres pincées (4 min)\n3. Exercices de toux efficace (3 min)\n\nConsigne validée par votre équipe soignante.',
        order: 3,
      },
    ];

    this._program = {
      id: 'prog-1',
      title: 'Programme de rééducation respiratoire',
      description:
          'Votre programme personnalisé établi par l\'équipe de rééducation. Les exercices sont adaptés à votre condition.',
      exercises: exercises,
      targetWeeklySessions: 5,
      startDate: new Date(Date.now() - 10 * DAY_MS).toISOString(),
      endDate: new Date(Date.now() + 60 * DAY_MS).toISOString(),
    };

    // Exercise Sessions (3 completed sessions matching Flutter mock data)
    this._exerciseSessions = [
      {
        id: 'sess-1',
        exerciseId: 'ex-1',
        exerciseName: 'Respiration contrôlée',
        completedAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
        actualDurationMinutes: 10,
        perceivedEffort: 3,
        notes: 'Bien ressenti',
      },
      {
        id: 'sess-2',
        exerciseId: 'ex-2',
        exerciseName: 'Mobilité thoracique',
        completedAt: new Date(Date.now() - 1 * DAY_MS).toISOString(),
        actualDurationMinutes: 8,
        perceivedEffort: 4,
        notes: undefined,
      },
      {
        id: 'sess-3',
        exerciseId: 'ex-1',
        exerciseName: 'Respiration contrôlée',
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actualDurationMinutes: 10,
        perceivedEffort: 2,
        notes: "Plus facile aujourd'hui",
      },
    ];

    // Smoking Entries (matching Flutter mock data - 12 entries)
    const now = new Date();
    const intensityMap: Record<string, 'low' | 'moderate' | 'high'> = {
      'Faible': 'low',
      'Modérée': 'moderate',
      'Forte': 'high',
    };
    const intensityLabels = { low: 'Faible', moderate: 'Modérée', high: 'Forte' };
    const triggerLabels = {
      habit: 'Habitude',
      stress: 'Stress',
      social: 'Social',
      emotion: 'Émotion',
      other: 'Autre',
    };

    const entries: SmokingEntry[] = [
      { id: 'smk-1', date: new Date(now.getTime() - 11 * DAY_MS).toISOString(), cigarettesConsumed: 8, cravingIntensity: 'moderate', trigger: 'habit', personalNote: 'Matin au café', createdAt: new Date(now.getTime() - 11 * DAY_MS - 2 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-2', date: new Date(now.getTime() - 10 * DAY_MS).toISOString(), cigarettesConsumed: 6, cravingIntensity: 'low', trigger: 'stress', personalNote: 'Stress au travail', createdAt: new Date(now.getTime() - 10 * DAY_MS - 3 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-3', date: new Date(now.getTime() - 9 * DAY_MS).toISOString(), cigarettesConsumed: 5, cravingIntensity: 'low', trigger: 'habit', personalNote: undefined, createdAt: new Date(now.getTime() - 9 * DAY_MS - 1 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-4', date: new Date(now.getTime() - 8 * DAY_MS).toISOString(), cigarettesConsumed: 4, cravingIntensity: 'low', trigger: 'social', personalNote: 'Déjeuner entre collègues', createdAt: new Date(now.getTime() - 8 * DAY_MS - 4 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-5', date: new Date(now.getTime() - 7 * DAY_MS).toISOString(), cigarettesConsumed: 3, cravingIntensity: 'moderate', trigger: 'emotion', personalNote: 'Anxiété soirée', createdAt: new Date(now.getTime() - 7 * DAY_MS - 5 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-6', date: new Date(now.getTime() - 6 * DAY_MS).toISOString(), cigarettesConsumed: 3, cravingIntensity: 'low', trigger: 'habit', personalNote: undefined, createdAt: new Date(now.getTime() - 6 * DAY_MS - 2 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-7', date: new Date(now.getTime() - 5 * DAY_MS).toISOString(), cigarettesConsumed: 2, cravingIntensity: 'low', trigger: 'habit', personalNote: 'Progression', createdAt: new Date(now.getTime() - 5 * DAY_MS - 1 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-8', date: new Date(now.getTime() - 4 * DAY_MS).toISOString(), cigarettesConsumed: 2, cravingIntensity: 'low', trigger: 'habit', personalNote: undefined, createdAt: new Date(now.getTime() - 4 * DAY_MS - 3 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-9', date: new Date(now.getTime() - 3 * DAY_MS).toISOString(), cigarettesConsumed: 2, cravingIntensity: 'moderate', trigger: 'stress', personalNote: 'Grosse journée', createdAt: new Date(now.getTime() - 3 * DAY_MS - 2 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-10', date: new Date(now.getTime() - 2 * DAY_MS).toISOString(), cigarettesConsumed: 1, cravingIntensity: 'low', trigger: 'habit', personalNote: 'Presque là', createdAt: new Date(now.getTime() - 2 * DAY_MS - 1 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-11', date: new Date(now.getTime() - 1 * DAY_MS).toISOString(), cigarettesConsumed: 1, cravingIntensity: 'low', trigger: 'habit', personalNote: undefined, createdAt: new Date(now.getTime() - 1 * DAY_MS - 2 * 60 * 60 * 1000).toISOString() },
      { id: 'smk-12', date: new Date(now.getTime()).toISOString(), cigarettesConsumed: 2, cravingIntensity: 'moderate', trigger: 'stress', personalNote: 'Reprise difficile', createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString() },
    ];
    this._smokingEntries = entries;

    // Educational Content (5 items, all placeholder - matching Flutter mock)
    this._educationalContent = [
      { id: 'edu-1', title: 'Comprendre le sevrage tabagique', summary: 'Pourquoi arrêter de fumer est bénéfique pour votre santé respiratoire.', content: 'Le sevrage tabagique est un processus par lequel votre corps élimine la nicotine et ses effets. Attention : ce contenu est provisoire. Le contenu validé par l\'équipe médicale remplacera cette version.', category: 'sevrage', imageUrl: undefined, isPlaceholder: true },
      { id: 'edu-2', title: 'Gérer une envie de fumer', summary: 'Techniques concrètes pour traverser une envie intense de fumer.', content: 'Les envies de fumer durent généralement 3 à 5 minutes. Voici des stratégies pour les traverser. Attention : contenu provisoire.', category: 'sevrage', imageUrl: undefined, isPlaceholder: true },
      { id: 'edu-3', title: 'Identifier vos déclencheurs', summary: 'Reconnaître les situations, émotions et habitudes qui provoquent l\'envie de fumer.', content: 'Un déclencheur est une situation, une émotion ou une habitude qui crée automatiquement l\'envie de fumer. Attention : contenu provisoire.', category: 'sevrage', imageUrl: undefined, isPlaceholder: true },
      { id: 'edu-4', title: 'Préparer votre environnement', summary: 'Modifier votre domicile et votre routine pour faciliter l\'arrêt du tabac.', content: 'Votre environnement peut vous aider ou vous piéger. Quelques ajustements simples. Attention : contenu provisoire.', category: 'sevrage', imageUrl: undefined, isPlaceholder: true },
      { id: 'edu-5', title: 'Pourquoi la rééducation respiratoire ?', summary: 'Comprendre les bénéfices des exercices respiratoires pour la BPCO.', content: 'La rééducation respiratoire ne guérit pas la maladie mais améliore significativement votre qualité de vie. Attention : contenu provisoire.', category: 'rehabilitation', imageUrl: undefined, isPlaceholder: true },
    ];
  }

  async getRehabilitationProgram(): Promise<RehabilitationProgram | null> {
    await new Promise((r) => setTimeout(r, 300));
    return this._program ? { ...this._program } : null;
  }

  async getExerciseSessions(limit?: number): Promise<ExerciseSession[]> {
    await new Promise((r) => setTimeout(r, 200));
    const sessions = [...this._exerciseSessions];
    sessions.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return limit ? sessions.slice(0, limit) : sessions;
  }

  async recordExerciseSession(session: ExerciseSession): Promise<ExerciseSession> {
    await new Promise((r) => setTimeout(r, 300));
    this._exerciseSessions.unshift({ ...session });
    return { ...session };
  }

  async getSmokingEntries(limit?: number): Promise<SmokingEntry[]> {
    await new Promise((r) => setTimeout(r, 200));
    const entries = [...this._smokingEntries];
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return limit ? entries.slice(0, limit) : entries;
  }

  async addSmokingEntry(entry: SmokingEntry): Promise<SmokingEntry> {
    await new Promise((r) => setTimeout(r, 300));
    this._smokingEntries.unshift({ ...entry });
    return { ...entry };
  }

  async deleteSmokingEntry(entryId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    this._smokingEntries = this._smokingEntries.filter((e) => e.id !== entryId);
  }

  async getTrackedDaysCount(): Promise<number> {
    await new Promise((r) => setTimeout(r, 100));
    const uniqueDates = new Set(
      this._smokingEntries.map((e) => {
        const dt = new Date(e.date);
        return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      })
    );
    return uniqueDates.size;
  }

  async getCurrentGoal(): Promise<string> {
    await new Promise((r) => setTimeout(r, 100));
    return this._currentGoal;
  }

  async getEducationalContent(category?: string): Promise<EducationalContent[]> {
    await new Promise((r) => setTimeout(r, 300));
    if (category) {
      return this._educationalContent.filter((c) => c.category === category);
    }
    return [...this._educationalContent];
  }

  async getEducationalContentById(id: string): Promise<EducationalContent | null> {
    await new Promise((r) => setTimeout(r, 100));
    const item = this._educationalContent.find((c) => c.id === id);
    return item ? { ...item } : null;
  }
}