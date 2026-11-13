/**
 * AES Guardian Database — Public API
 */

import { DatabaseService } from './DatabaseService';
import { AesGuardianDatabase } from './AesGuardianDatabase';
import { seedDemoScenarioIfEmpty } from './demo-scenario-seeder';

export type {
  DatabaseOptions,
  MutationResult,
  QueryResult,
  QueryRow,
  SchemaVersion,
  DemoUser,
  AesDeclaration,
  AesIncidentType,
  AesGuardianRole,
  DeclarationStatus,
  AuditEvent,
  ReviewOutcome,
  AdministrativeReview,
  CorrectionResponse,
  OhCoordination,
  OhCoordinationReason,
  OhCoordinationStatus,
  OhFollowUpEvent,
  OhFollowUpEventCategory,
  SurveillanceDashboardMetrics,
  SurveillanceFilters,
  PreventionAction,
  PreventionActionStatus,
  PreventionActionType,
  ContributingFactorCategory,
  CreatePreventionActionInput,
  PreventionActionFilters,
  PreventionOverview,
  PreventionActionDetail,
} from './types';

export {
  AES_GUARDIAN_ROLES,
  AES_INCIDENT_TYPES,
  DECLARATION_STATUSES,
  REVIEW_OUTCOMES,
  OH_COORDINATION_REASONS,
  OH_COORDINATION_STATUSES,
  OH_FOLLOW_UP_EVENT_CATEGORIES,
  PREVENTION_ACTION_STATUSES,
  PREVENTION_ACTION_TYPES,
  CONTRIBUTING_FACTOR_CATEGORIES,
} from './types';

export { DatabaseService } from './DatabaseService';
export {
  AesGuardianDatabase,
  isValidTransition,
  isValidPreventionTransition,
} from './AesGuardianDatabase';
export { seedDemoScenarioIfEmpty, type SeedResult } from './demo-scenario-seeder';

let _aesDb: AesGuardianDatabase | null = null;

export interface InitializeDatabaseOptions {
  seedDemoScenario?: boolean;
}

export async function initializeDatabase(
  options: InitializeDatabaseOptions = {},
): Promise<AesGuardianDatabase> {
  if (_aesDb) {
    return _aesDb;
  }

  const service = DatabaseService.getInstance({
    name: 'aes_guardian.db',
    enableWAL: true,
  });

  await service.open();

  const db = new AesGuardianDatabase(service);
  await db.initialize();

  const shouldSeed = options.seedDemoScenario ?? (process.env.NODE_ENV !== 'test');
  if (shouldSeed) {
    await seedDemoScenarioIfEmpty(db);
  }

  _aesDb = db;
  return _aesDb;
}

export function getDatabase(): AesGuardianDatabase {
  if (!_aesDb) {
    throw new Error(
      'getDatabase: database has not been initialized. ' +
        'Call initializeDatabase() during app startup.',
    );
  }
  return _aesDb;
}

export function resetDatabaseForTesting(): void {
  DatabaseService.resetForTesting();
  _aesDb = null;
}
