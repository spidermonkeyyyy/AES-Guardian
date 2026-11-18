/**
 * AES Guardian Demonstration Scenario Seeder
 *
 * Standalone seeding entry point.
 * Accepts only a TransactionalDatabase instance and executes seeding within
 * an atomic SQLite transaction managed by that database.
 *
 * Phase 2D.2D.6:
 * - Removed transaction registration functions and any external registration mechanism.
 * - Removed within-transaction seeder bypass exports.
 * - Full scenario seeding implementation is encapsulated privately within AesGuardianDatabase.
 * - This module exposes exclusively seedStandardScenario, seedDemoScenarioIfEmpty, and the SeedResult type.
 */

import { AesGuardianDatabase } from './AesGuardianDatabase';
import {
  type TransactionalDatabase,
  type SeedResult,
} from './types';

export { type SeedResult } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Public standalone seeding entry point.
 *
 * Accepts only a TransactionalDatabase instance. Opens exactly one transaction and
 * runs the full seed implementation within it. The caller cannot supply an
 * arbitrary executor or claim that a transaction already exists.
 */
export async function seedStandardScenario(db: TransactionalDatabase): Promise<SeedResult> {
  const candidate: unknown = db;
  if (!isRecord(candidate) || typeof candidate.transaction !== 'function') {
    throw new Error(
      'TransactionContractError: Cannot seed standard scenario without a valid transaction context. ' +
      'A TransactionalDatabase instance is required.',
    );
  }

  if (candidate instanceof AesGuardianDatabase) {
    return candidate.seedStandardScenario();
  }

  // Otherwise, wrap in an AesGuardianDatabase instance with candidate as the underlying service
  const aesDb = new AesGuardianDatabase(candidate as any);
  return aesDb.seedStandardScenario();
}

export async function seedDemoScenarioIfEmpty(db: AesGuardianDatabase): Promise<SeedResult> {
  return seedStandardScenario(db);
}
