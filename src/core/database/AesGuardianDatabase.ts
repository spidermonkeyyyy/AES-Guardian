/**
 * AES Guardian Application Database
 *
 * Schema versioning, initialization, and domain-level accessors for the
 * local SQLite database that backs the AES Guardian offline prototype.
 *
 * DISCLAIMER: This local audit history is NOT legally immutable or
 * tamper-proof. It is intended for demonstration and care-coordination
 * purposes only.
 *
 * Authorization note: UI-layer role checks are NOT a substitute for
 * real authorization. This module enforces domain-level access control.
 *
 * CHANGELOG:
 *   v1 (Phase 2C.1): Initial schema.
 *   v2 (Phase 2C.2): Role model correction.
 *   v3 (Phase 2C.2): Extended declaration schema.
 *   v4 (Phase 2C.3): Administrative review table, review queue indexes,
 *                    review repository methods, and review permission guards.
 *   v5 (Phase 2C.3.2): Correction lifecycle integrity. Safe 12-step table
 *                      recreation for FK safety. UNIQUE on correction_responses.
 *   v6 (Phase 2C.4):   Occupational-health coordination records and follow-up
 *                      events. Partial unique index for one active coordination
 *                      per declaration.
 */

import { DatabaseService } from './DatabaseService';
import type {
  AdministrativeReview,
  AesDeclaration,
  AesGuardianRole,
  AesIncidentType,
  AuditEvent,
  CorrectionResponse,
  DeclarationStatus,
  DemoUser,
  MutationResult,
  OhCoordination,
  ExposedOhCoordinationSummary,
  AdminOhCoordinationSummary,
  OhCoordinationReason,
  OhCoordinationStatus,
  OhFollowUpEvent,
  OhFollowUpEventCategory,
  ReviewOutcome,
  SchemaVersion,
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
  ResetDemoScenarioResult,
  SeedResult,
  NotificationEventType,
  NotificationEntityType,
  InAppNotification,
  CreateNotificationInput,
  NotificationFilters,
  OhQueueFilterOptions,
  SqlQueryExecutor,
  TransactionExecutor,
  CapaCreationOperation,
} from './types';
import {
  canonicalCapaPayload,
  CapaOperationIdCollisionError,
  createCapaOperationId,
  isValidCapaOperationId,
  sha256Hex,
  type CapaPayloadForHash,
} from './capa-operation-utils';
import {
  AES_GUARDIAN_ROLES,
  AES_INCIDENT_TYPES,
  DECLARATION_STATUSES,
  OH_COORDINATION_REASONS,
  OH_COORDINATION_STATUSES,
  OH_FOLLOW_UP_EVENT_CATEGORIES,
  REVIEW_OUTCOMES,
  PREVENTION_ACTION_STATUSES,
  PREVENTION_ACTION_TYPES,
  CONTRIBUTING_FACTOR_CATEGORIES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  EVENT_RECIPIENT_ROLE,
} from './types';

/** Current schema version. Increment when migrations are added. */
const CURRENT_SCHEMA_VERSION = 10;

/**
 * Ordered list of migrations.
 * APPEND-ONLY — never edit a past migration.
 */
export const MIGRATIONS: Array<{
  version: number;
  description: string;
  up: string[];
}> = [
  // Migration 1: Initial schema
  {
    version: 1,
    description: 'Initial schema: schema_versions, demo_users, aes_declarations, audit_events',
    up: [
      `CREATE TABLE IF NOT EXISTS schema_versions (
        version     INTEGER PRIMARY KEY,
        applied_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        description TEXT    NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS demo_users (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        username     TEXT    NOT NULL UNIQUE,
        display_name TEXT    NOT NULL,
        role         TEXT    NOT NULL CHECK (role IN ('clinician','admin','lab_tech','pharmacist')),
        created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE TABLE IF NOT EXISTS aes_declarations (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_number    TEXT    NOT NULL UNIQUE,
        declared_by_user_id INTEGER NOT NULL REFERENCES demo_users(id),
        declaration_date    TEXT    NOT NULL,
        status              TEXT    NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','submitted','under_review','closed')),
        notes               TEXT,
        created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE TABLE IF NOT EXISTS audit_events (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type  TEXT    NOT NULL,
        user_id     INTEGER REFERENCES demo_users(id),
        entity_type TEXT,
        entity_id   INTEGER,
        description TEXT    NOT NULL,
        occurred_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
    ],
  },

  // Migration 2: Role model correction
  {
    version: 2,
    description: 'Role model correction: replace SANAD roles with approved AES Guardian roles',
    up: [
      `ALTER TABLE demo_users RENAME TO demo_users_v1`,
      `CREATE TABLE demo_users (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        username     TEXT    NOT NULL UNIQUE,
        display_name TEXT    NOT NULL,
        role         TEXT    NOT NULL CHECK (role IN (
                       'exposed_professional',
                       'admin_reviewer',
                       'oh_professional',
                       'quality_staff',
                       'tech_admin'
                     )),
        created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `INSERT INTO demo_users (id, username, display_name, role, created_at, updated_at)
       SELECT id, username, display_name, role, created_at, updated_at
       FROM demo_users_v1
       WHERE role IN (
         'exposed_professional','admin_reviewer','oh_professional','quality_staff','tech_admin'
       )`,
      `DROP TABLE demo_users_v1`,
      `INSERT OR IGNORE INTO demo_users (username, display_name, role) VALUES
        ('prof.demo.expose',  'Professionnel Exposé (Démo)',         'exposed_professional'),
        ('admin.demo.review', 'Administrateur RH (Démo)',            'admin_reviewer'),
        ('medecin.demo.sst',  'Médecin du Travail (Démo)',           'oh_professional'),
        ('qualite.demo',      'Responsable Qualité (Démo)',          'quality_staff'),
        ('admin.demo.tech',   'Administrateur Technique (Démo)',     'tech_admin')`,
    ],
  },

  // Migration 3: Extended declaration schema
  {
    version: 3,
    description: 'Extended declaration schema: incident fields, submitted_at, indexes',
    up: [
      `ALTER TABLE aes_declarations RENAME TO aes_declarations_v1`,
      `CREATE TABLE aes_declarations (
        id                        INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_number          TEXT    NOT NULL UNIQUE,
        declared_by_user_id       INTEGER NOT NULL REFERENCES demo_users(id),
        incident_date             TEXT    NOT NULL,
        incident_type             TEXT    NOT NULL DEFAULT 'other'
                                    CHECK (incident_type IN (
                                      'percutaneous_exposure',
                                      'mucocutaneous_exposure',
                                      'sexual_assault',
                                      'other'
                                    )),
        circumstances             TEXT,
        exposure_description      TEXT,
        protective_measures_taken TEXT,
        department_code           TEXT,
        notes                     TEXT,
        status                    TEXT    NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft','submitted','under_review','closed')),
        submitted_at              TEXT,
        created_at                TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at                TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `DROP TABLE aes_declarations_v1`,
      `CREATE INDEX IF NOT EXISTS idx_aes_declarations_status
         ON aes_declarations(status)`,
      `CREATE INDEX IF NOT EXISTS idx_aes_declarations_user
         ON aes_declarations(declared_by_user_id)`,
    ],
  },

  // Migration 4 (Phase 2C.3): Administrative Reviews Table & Indexes
  {
    version: 4,
    description: 'Administrative reviews: table, outcomes, indexes, review queue tracking',
    up: [
      `CREATE TABLE IF NOT EXISTS administrative_reviews (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        declaration_id      INTEGER NOT NULL REFERENCES aes_declarations(id),
        reviewer_user_id    INTEGER NOT NULL REFERENCES demo_users(id),
        outcome             TEXT    NOT NULL CHECK (outcome IN (
                              'acknowledged',
                              'transmission_verified',
                              'correction_requested'
                            )),
        comments            TEXT,
        correction_reason   TEXT,
        reviewed_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_admin_reviews_decl
         ON administrative_reviews(declaration_id)`,
      `CREATE INDEX IF NOT EXISTS idx_admin_reviews_reviewer
         ON administrative_reviews(reviewer_user_id)`,
    ],
  },

  // Migration 5 (Phase 2C.3.1): Correction responses table and expanded declaration status
  {
    version: 5,
    description: 'Correction responses: table, indexes, and declaration status expansion for correction lifecycle',
    up: [
      `CREATE TABLE aes_declarations_new (
        id                        INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_number          TEXT    NOT NULL UNIQUE,
        declared_by_user_id       INTEGER NOT NULL REFERENCES demo_users(id),
        incident_date             TEXT    NOT NULL,
        incident_type             TEXT    NOT NULL DEFAULT 'other'
                                    CHECK (incident_type IN (
                                      'percutaneous_exposure',
                                      'mucocutaneous_exposure',
                                      'sexual_assault',
                                      'other'
                                    )),
        circumstances             TEXT,
        exposure_description      TEXT,
        protective_measures_taken TEXT,
        department_code           TEXT,
        notes                     TEXT,
        status                    TEXT    NOT NULL DEFAULT 'draft'
                                    CHECK (status IN (
                                      'draft',
                                      'submitted',
                                      'under_review',
                                      'correction_requested',
                                      'resubmitted',
                                      'closed'
                                    )),
        submitted_at              TEXT,
        created_at                TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at                TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `INSERT INTO aes_declarations_new (
        id, reference_number, declared_by_user_id, incident_date, incident_type,
        circumstances, exposure_description, protective_measures_taken,
        department_code, notes, status, submitted_at, created_at, updated_at
      )
      SELECT
        id, reference_number, declared_by_user_id, incident_date, incident_type,
        circumstances, exposure_description, protective_measures_taken,
        department_code, notes, status, submitted_at, created_at, updated_at
      FROM aes_declarations`,
      `DROP TABLE aes_declarations`,
      `ALTER TABLE aes_declarations_new RENAME TO aes_declarations`,
      `CREATE INDEX IF NOT EXISTS idx_aes_declarations_status
         ON aes_declarations(status)`,
      `CREATE INDEX IF NOT EXISTS idx_aes_declarations_user
         ON aes_declarations(declared_by_user_id)`,
      `CREATE TABLE IF NOT EXISTS correction_responses (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        declaration_id      INTEGER NOT NULL REFERENCES aes_declarations(id) ON DELETE CASCADE,
        review_id           INTEGER NOT NULL UNIQUE REFERENCES administrative_reviews(id),
        responding_user_id  INTEGER NOT NULL REFERENCES demo_users(id),
        response_text       TEXT    NOT NULL,
        responded_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_corr_resp_decl
         ON correction_responses(declaration_id)`,
      `CREATE INDEX IF NOT EXISTS idx_corr_resp_review
         ON correction_responses(review_id)`,
      `CREATE INDEX IF NOT EXISTS idx_corr_resp_user
         ON correction_responses(responding_user_id)`,
    ],
  },

  // Migration 6 (Phase 2C.4): Occupational-health coordination tables
  {
    version: 6,
    description: 'Occupational-health coordination records and follow-up events (Phase 2C.4)',
    up: [
      `CREATE TABLE IF NOT EXISTS oh_coordinations (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        declaration_id          INTEGER NOT NULL REFERENCES aes_declarations(id),
        created_by_user_id      INTEGER NOT NULL REFERENCES demo_users(id),
        coordination_reason     TEXT    NOT NULL CHECK (coordination_reason IN (
                                  'routine_followup', 'serology_monitoring',
                                  'specialized_evaluation', 'other_coordination'
                                )),
        status                  TEXT    NOT NULL DEFAULT 'pending_acknowledgement'
                                  CHECK (status IN (
                                    'pending_acknowledgement', 'acknowledged',
                                    'completed', 'cancelled'
                                  )),
        acknowledged_by_user_id INTEGER REFERENCES demo_users(id),
        acknowledged_at         TEXT,
        completed_by_user_id    INTEGER REFERENCES demo_users(id),
        completed_at            TEXT,
        created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_oh_coord_active_per_decl
         ON oh_coordinations(declaration_id)
         WHERE status IN ('pending_acknowledgement', 'acknowledged')`,
      `CREATE INDEX IF NOT EXISTS idx_oh_coord_decl ON oh_coordinations(declaration_id)`,
      `CREATE INDEX IF NOT EXISTS idx_oh_coord_created_by ON oh_coordinations(created_by_user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_oh_coord_status ON oh_coordinations(status)`,
      `CREATE TABLE IF NOT EXISTS oh_follow_up_events (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        coordination_id     INTEGER NOT NULL REFERENCES oh_coordinations(id),
        event_category      TEXT    NOT NULL CHECK (event_category IN (
                              'contact_attempt_recorded', 'contact_established',
                              'appointment_coordinated', 'consultation_recorded',
                              'follow_up_continued', 'follow_up_completed'
                            )),
        event_date          TEXT    NOT NULL,
        recorded_by_user_id INTEGER NOT NULL REFERENCES demo_users(id),
        administrative_note TEXT,
        created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_oh_event_coord ON oh_follow_up_events(coordination_id)`,
      `CREATE INDEX IF NOT EXISTS idx_oh_event_recorded_by ON oh_follow_up_events(recorded_by_user_id)`,
    ],
  },

  // Migration 7 (Phase 2C.6): Prevention and Corrective-Action Management (CAPA)
  {
    version: 7,
    description: 'Prevention and corrective actions: register, lifecycle, contributing factors, indexes',
    up: [
      `CREATE TABLE IF NOT EXISTS prevention_actions (
        id                     INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_code         TEXT    NOT NULL UNIQUE,
        title                  TEXT    NOT NULL,
        description            TEXT    NOT NULL,
        action_type            TEXT    NOT NULL CHECK (action_type IN ('corrective', 'preventive')),
        contributing_factor    TEXT    NOT NULL CHECK (contributing_factor IN (
                                 'device_safety_design',
                                 'procedure_compliance',
                                 'workload_fatigue',
                                 'waste_disposal_container',
                                 'protective_equipment',
                                 'training_supervision',
                                 'environment_workspace',
                                 'other_factor'
                               )),
        rationale              TEXT    NOT NULL,
        surveillance_reference TEXT,
        status                 TEXT    NOT NULL DEFAULT 'proposed'
                                 CHECK (status IN ('proposed', 'in_progress', 'completed', 'cancelled')),
        target_date            TEXT,
        completed_at           TEXT,
        completion_notes       TEXT,
        created_by_user_id     INTEGER NOT NULL REFERENCES demo_users(id),
        created_at             TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at             TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_prevention_status ON prevention_actions(status)`,
      `CREATE INDEX IF NOT EXISTS idx_prevention_action_type ON prevention_actions(action_type)`,
      `CREATE INDEX IF NOT EXISTS idx_prevention_factor ON prevention_actions(contributing_factor)`,
      `CREATE INDEX IF NOT EXISTS idx_prevention_created_by ON prevention_actions(created_by_user_id)`,
    ],
  },

  // Migration 8 (Phase 2D.2): In-App Notification System
  {
    version: 8,
    description: 'In-app notification system: notifications table, recipient scoping, idempotency, indexes',
    up: [
      `CREATE TABLE IF NOT EXISTS in_app_notifications (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_user_id   INTEGER NOT NULL REFERENCES demo_users(id) ON DELETE CASCADE,
        event_type          TEXT    NOT NULL CHECK (event_type IN (
                              'declaration_submitted',
                              'review_completed',
                              'correction_requested',
                              'correction_submitted',
                              'oh_coordination_created',
                              'oh_coordination_acknowledged',
                              'oh_milestone_recorded',
                              'oh_coordination_completed',
                              'capa_created',
                              'capa_status_changed',
                              'capa_finalized'
                            )),
        title_key           TEXT    NOT NULL,
        message_key         TEXT    NOT NULL,
        entity_type         TEXT    NOT NULL CHECK (entity_type IN (
                              'aes_declaration',
                              'administrative_review',
                              'correction_response',
                              'oh_coordination',
                              'oh_follow_up_events',
                              'prevention_action'
                            )),
        entity_id           INTEGER NOT NULL,
        entity_reference    TEXT,
        is_read             INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
        created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        read_at             TEXT,
        idempotency_key     TEXT    UNIQUE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON in_app_notifications(recipient_user_id, is_read, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_all ON in_app_notifications(recipient_user_id, created_at)`,
    ],
  },
  {
    version: 9,
    description: 'Durable CAPA creation operations: pending/committed lifecycle, payload binding, linked CAPA',
    up: [
      `CREATE TABLE IF NOT EXISTS capa_creation_operations (
        operation_id          TEXT PRIMARY KEY,
        created_by_user_id    INTEGER NOT NULL REFERENCES demo_users(id),
        payload_json          TEXT NOT NULL,
        payload_hash          TEXT NOT NULL,
        reference_code        TEXT NOT NULL,
        status                TEXT NOT NULL CHECK (status IN ('pending', 'committed')),
        prevention_action_id  INTEGER UNIQUE REFERENCES prevention_actions(id),
        created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_capa_operation_reference
       ON capa_creation_operations(reference_code)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_capa_operation_one_pending_per_creator
       ON capa_creation_operations(created_by_user_id)
       WHERE status = 'pending'`,
      `CREATE INDEX IF NOT EXISTS idx_capa_operation_status
       ON capa_creation_operations(status, updated_at)`,
    ],
  },
  {
    version: 10,
    description: 'Add durable acknowledgement state for committed CAPA creation operations',
    up: [
      `ALTER TABLE capa_creation_operations ADD COLUMN acknowledged_at TEXT`,
      `CREATE INDEX IF NOT EXISTS idx_capa_operation_unacknowledged
       ON capa_creation_operations(created_by_user_id, status, acknowledged_at)`,
    ],
  },
];

function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `AES-${year}-${random}`;
}

function generateCapaReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `CAPA-${year}-${random}`;
}

function getSqliteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

function isCapaReferenceConstraintError(error: unknown): boolean {
  const message = getSqliteErrorMessage(error);
  return (
    /UNIQUE constraint failed:\s*prevention_actions\.reference_code/i.test(message) ||
    /UNIQUE constraint failed:\s*capa_creation_operations\.reference_code/i.test(message) ||
    /idx_capa_operation_reference/i.test(message)
  );
}

function isPendingOperationConstraintError(error: unknown): boolean {
  const message = getSqliteErrorMessage(error);
  return (
    /idx_capa_operation_one_pending_per_creator/i.test(message) ||
    /UNIQUE constraint failed:\s*capa_creation_operations\.created_by_user_id/i.test(message)
  );
}

const VALID_TRANSITIONS: Record<DeclarationStatus, DeclarationStatus[]> = {
  draft: ['submitted'],
  submitted: ['under_review', 'correction_requested'],
  under_review: ['correction_requested', 'closed'],
  correction_requested: ['resubmitted'],
  resubmitted: ['under_review', 'correction_requested'],
  closed: [],
};

export function isValidTransition(from: DeclarationStatus, to: DeclarationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const VALID_PREVENTION_TRANSITIONS: Record<PreventionActionStatus, PreventionActionStatus[]> = {
  proposed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function isValidPreventionTransition(
  from: PreventionActionStatus,
  to: PreventionActionStatus,
): boolean {
  return VALID_PREVENTION_TRANSITIONS[from]?.includes(to) ?? false;
}

export class CapaCreationOperationConflictError extends Error {
  constructor(message?: string) {
    super(message ?? 'CAPA creation operation conflict');
    this.name = 'CapaCreationOperationConflictError';
  }
}

export class CapaCreationOperationIntegrityError extends Error {
  constructor(message?: string) {
    super(message ?? 'CAPA creation operation integrity violation');
    this.name = 'CapaCreationOperationIntegrityError';
  }
}

export class PreventionActionCreationUncertainError extends Error {
  referenceCode?: string | null;
  operationId?: string;
  constructor(message?: string, referenceCode?: string | null, operationId?: string) {
    super(message ?? 'Prevention action creation uncertain');
    this.name = 'PreventionActionCreationUncertainError';
    this.referenceCode = referenceCode;
    this.operationId = operationId;
  }
}

export class AesGuardianDatabase {
  private readonly db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Executes a SQL statement with parameters.
   * Mirrors the older `db.run` used in tests.
   */
  async run(sql: string, params?: any[]) {
    return this.db.execute(sql, params ?? []);
  }

  /**
   * Directly queries the underlying database.
   */
  async query<T = any>(sql: string, params: any[] = []) {
    return this.db.query<T>(sql, params);
  }

  /**
   * Directly executes a statement on the underlying database.
   */
  async execute(sql: string, params: any[] = []) {
    return this.db.execute(sql, params);
  }

  /**
   * Executes a function within an atomic SQLite transaction on the underlying database.
   */
  async transaction<T>(fn: (tx: TransactionExecutor) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  /**
   * Returns the first row matching the query, or undefined.
   * Convenience wrapper for tests.
   */
  async get<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    const result = await this.db.query<T>(sql, params ?? []);
    return result.rows[0];
  }

  /**
   * Returns all rows matching the query.
   * Convenience wrapper for tests.
   */
  async all(sql: string, params?: any[]): Promise<any[]> {
    const result = await this.db.query<any>(sql, params ?? []);
    return result.rows;
  }

  /**
   * Closes the database connection if supported.
   */
  async close(): Promise<void> {
    if (typeof (this.db as any).close === 'function') {
      await (this.db as any).close();
    }
  }

  // ────────────────────────────────────────────────────────────
  //  Schema versioning
  // ────────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    const currentVersion = await this.getSchemaVersion();

    const migrationsToRun = (this as any).MIGRATIONS || MIGRATIONS;
    for (const migration of migrationsToRun) {
      if (migration.version > currentVersion) {
        try {
          await this.db.execute('PRAGMA foreign_keys = OFF;');
        } catch {
          // ignore pragma failure in mock environment
        }
        await this.db.transaction(async tx => {
          for (const sql of migration.up) {
            await tx.execute(sql);
          }
          await tx.execute(
            `INSERT INTO schema_versions (version, description) VALUES (?, ?)`,
            [migration.version, migration.description],
          );
        });
        try {
          await this.db.execute('PRAGMA foreign_keys = ON;');
        } catch {
          // ignore pragma failure in mock environment
        }
      }
    }

    // Repair legacy dangling foreign key on audit_events if present
    try {
      const checkResult = await this.db.query<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'`,
      );
      if (checkResult.rows[0]?.sql?.includes('demo_users_v1')) {
        try {
          await this.db.execute('PRAGMA foreign_keys = OFF;');
        } catch {
          // Migration remains best-effort when the adapter does not support this pragma.
        }
        await this.db.transaction(async tx => {
          await tx.execute(`DROP TABLE IF EXISTS audit_events_fixed`);
          await tx.execute(`CREATE TABLE audit_events_fixed (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type  TEXT    NOT NULL,
            user_id     INTEGER REFERENCES demo_users(id),
            entity_type TEXT,
            entity_id   INTEGER,
            description TEXT    NOT NULL,
            occurred_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
          )`);
          await tx.execute(
            `INSERT INTO audit_events_fixed (id, event_type, user_id, entity_type, entity_id, description, occurred_at)
             SELECT id, event_type, user_id, entity_type, entity_id, description, occurred_at
             FROM audit_events`,
          );
          await tx.execute(`DROP TABLE audit_events`);
          await tx.execute(`ALTER TABLE audit_events_fixed RENAME TO audit_events`);
        });
        try {
          await this.db.execute('PRAGMA foreign_keys = ON;');
        } catch {
          // Migration remains best-effort when the adapter does not support this pragma.
        }
      }
    } catch {
      // ignore in test/mock environment
    }
  }

  private async getSchemaVersion(): Promise<number> {
    try {
      const result = await this.db.query<SchemaVersion>(
        `SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1`,
      );
      return result.rows.length > 0 ? (result.rows[0].version as number) : 0;
    } catch {
      return 0;
    }
  }

  async getAppliedVersions(): Promise<SchemaVersion[]> {
    const result = await this.db.query<SchemaVersion>(
      `SELECT version, applied_at, description FROM schema_versions ORDER BY version ASC`,
    );
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────
  //  Demo users
  // ────────────────────────────────────────────────────────────

  async insertDemoUser(
    user: Omit<DemoUser, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<number> {
    if (!AES_GUARDIAN_ROLES.includes(user.role)) {
      throw new Error(
        `insertDemoUser: invalid role "${user.role}". ` +
          `Approved roles: ${AES_GUARDIAN_ROLES.join(', ')}`,
      );
    }
    const result = await this.db.execute(
      `INSERT INTO demo_users (username, display_name, role) VALUES (?, ?, ?)`,
      [user.username, user.display_name, user.role],
    );
    return result.insertId!;
  }

  async getDemoUser(id: number): Promise<DemoUser | null> {
    const result = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async getDemoUserByUsername(username: string): Promise<DemoUser | null> {
    const result = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE username = ?`,
      [username],
    );
    return result.rows[0] ?? null;
  }

  async listDemoUsers(): Promise<DemoUser[]> {
    const result = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users ORDER BY id ASC`,
    );
    return result.rows;
  }

  async updateDemoUser(
    id: number,
    updates: Partial<Pick<DemoUser, 'display_name' | 'role'>>,
  ): Promise<MutationResult> {
    if (updates.role !== undefined && !AES_GUARDIAN_ROLES.includes(updates.role)) {
      throw new Error(
        `updateDemoUser: invalid role "${updates.role}". ` +
          `Approved roles: ${AES_GUARDIAN_ROLES.join(', ')}`,
      );
    }
    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (updates.display_name !== undefined) {
      fields.push('display_name = ?');
      params.push(updates.display_name);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      params.push(updates.role);
    }
    fields.push('updated_at = ?');
    params.push(now);
    params.push(id);

    return this.db.execute(
      `UPDATE demo_users SET ${fields.join(', ')} WHERE id = ?`,
      params,
    );
  }

  async deleteDemoUser(id: number): Promise<MutationResult> {
    return this.db.execute(`DELETE FROM demo_users WHERE id = ?`, [id]);
  }

  // ────────────────────────────────────────────────────────────
  //  AES declarations — repository operations
  // ────────────────────────────────────────────────────────────

  async createDraft(
    input: {
      declared_by_user_id: number;
      incident_date: string;
      incident_type: AesIncidentType;
      circumstances?: string | null;
      exposure_description?: string | null;
      protective_measures_taken?: string | null;
      department_code?: string | null;
      notes?: string | null;
    },
  ): Promise<number> {
    if (!AES_INCIDENT_TYPES.includes(input.incident_type)) {
      throw new Error(
        `createDraft: invalid incident_type "${input.incident_type}". ` +
          `Valid types: ${AES_INCIDENT_TYPES.join(', ')}`,
      );
    }
    const refNumber = generateReferenceNumber();
    const result = await this.db.execute(
      `INSERT INTO aes_declarations (
         reference_number, declared_by_user_id, incident_date, incident_type,
         circumstances, exposure_description, protective_measures_taken,
         department_code, notes, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        refNumber,
        input.declared_by_user_id,
        input.incident_date,
        input.incident_type,
        input.circumstances ?? null,
        input.exposure_description ?? null,
        input.protective_measures_taken ?? null,
        input.department_code ?? null,
        input.notes ?? null,
      ],
    );
    return result.insertId!;
  }

  async updateDraft(
    id: number,
    updates: Partial<{
      incident_date: string;
      incident_type: AesIncidentType;
      circumstances: string | null;
      exposure_description: string | null;
      protective_measures_taken: string | null;
      department_code: string | null;
      notes: string | null;
    }>,
  ): Promise<MutationResult> {
    const existing = await this.getDeclarationByIdInternal(id);
    if (!existing) {
      throw new Error(`updateDraft: declaration ${id} not found`);
    }
    if (existing.status !== 'draft') {
      throw new Error(
        `updateDraft: declaration ${id} has status "${existing.status}" and cannot be edited. ` +
          `Only draft declarations may be updated.`,
      );
    }
    if (updates.incident_type !== undefined && !AES_INCIDENT_TYPES.includes(updates.incident_type)) {
      throw new Error(
        `updateDraft: invalid incident_type "${updates.incident_type}"`,
      );
    }

    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: unknown[] = [];

    const updatable: Array<keyof typeof updates> = [
      'incident_date', 'incident_type', 'circumstances',
      'exposure_description', 'protective_measures_taken',
      'department_code', 'notes',
    ];

    for (const key of updatable) {
      if (key in updates) {
        fields.push(`${key} = ?`);
        params.push(updates[key] ?? null);
      }
    }

    if (fields.length === 0) {
      return { rowsAffected: 0 };
    }

    fields.push('updated_at = ?');
    params.push(now);
    params.push(id);

    return this.db.execute(
      `UPDATE aes_declarations SET ${fields.join(', ')} WHERE id = ?`,
      params,
    );
  }

  async submitDeclaration(id: number): Promise<MutationResult> {
    const existing = await this.getDeclarationByIdInternal(id);
    if (!existing) {
      throw new Error(`submitDeclaration: declaration ${id} not found`);
    }
    if (!isValidTransition(existing.status, 'submitted')) {
      throw new Error(
        `submitDeclaration: cannot submit declaration ${id} with status "${existing.status}". ` +
          `Only draft declarations can be submitted.`,
      );
    }

    const now = new Date().toISOString();
    let result: MutationResult = { rowsAffected: 0 };

    await this.db.transaction(async tx => {
      const adminReviewerId = await this.getRecipientUserIdByRole('admin_reviewer', tx);
      result = await tx.execute(
        `UPDATE aes_declarations
         SET status = 'submitted', submitted_at = ?, updated_at = ?
         WHERE id = ?`,
        [now, now, id],
      );

      await this.insertNotification(
        {
          recipient_user_id: adminReviewerId,
          event_type: 'declaration_submitted',
          title_key: 'notification.declarationSubmitted.title',
          message_key: 'notification.declarationSubmitted.message',
          entity_type: 'aes_declaration',
          entity_id: id,
          entity_reference: existing.reference_number,
          idempotency_key: `notif:declaration_submitted:aes_declaration:${id}:${adminReviewerId}`,
        },
        tx,
      );
    });

    return result;
  }

  /**
   * Internal privileged query to retrieve a declaration row by ID without caller role checks.
   * Strictly for internal database operations (e.g., status verification within workflows).
   */
  private async getDeclarationByIdInternal(id: number): Promise<AesDeclaration | null> {
    const result = await this.db.query<AesDeclaration>(
      `SELECT * FROM aes_declarations WHERE id = ?`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Retrieves an AES declaration by primary key.
   *
   * ACCESS CONTROL & OWNERSHIP RULES:
   * - tech_admin: strictly prohibited from clinical declaration content.
   * - quality_staff: strictly prohibited from identifiable declaration content.
   * - exposed_professional: may ONLY view declarations they personally authored (declared_by_user_id === requestingUserId).
   * - admin_reviewer: permitted for administrative review triage and processing.
   * - oh_professional: strictly prohibited from direct declaration retrieval (must access via authorized OH coordination).
   */
  async getDeclarationById(id: number, requestingUserId?: number | null): Promise<AesDeclaration | null> {
    if (requestingUserId === undefined || requestingUserId === null) {
      throw new Error('Unauthorized: requesting user ID is required to access declaration content.');
    }
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(`getDeclarationById: requesting user ${requestingUserId} not found`);
    }
    if (user.role === 'tech_admin') {
      throw new Error(
        `Unauthorized: tech_admin user ${requestingUserId} is strictly prohibited from accessing clinical declaration content.`,
      );
    }
    if (user.role === 'quality_staff') {
      throw new Error(
        `Unauthorized: quality_staff user ${requestingUserId} is strictly prohibited from accessing identifiable declaration content.`,
      );
    }
    if (user.role === 'oh_professional') {
      throw new Error(
        `Unauthorized: oh_professional user ${requestingUserId} is strictly prohibited from direct declaration retrieval. Access incident records via authorized OH coordination.`,
      );
    }
    const decl = await this.getDeclarationByIdInternal(id);
    if (!decl) {
      return null;
    }
    if (user.role === 'exposed_professional' && decl.declared_by_user_id !== requestingUserId) {
      throw new Error(
        `Unauthorized: exposed_professional user ${requestingUserId} is not permitted to access declaration ${id} owned by user ${decl.declared_by_user_id}.`,
      );
    }
    return decl;
  }

  async getDeclarations(
    options: { userId?: number | null; limit?: number; requestingUserId?: number | null } = {},
  ): Promise<AesDeclaration[]> {
    const { userId, limit = 100, requestingUserId } = options;
    if (requestingUserId === undefined || requestingUserId === null) {
      throw new Error('Unauthorized: requesting user ID is required to query declarations.');
    }
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(`getDeclarations: requesting user ${requestingUserId} not found`);
    }
    if (user.role === 'tech_admin') {
      throw new Error(
        `Unauthorized: tech_admin user ${requestingUserId} is strictly prohibited from accessing clinical declaration content.`,
      );
    }
    if (user.role === 'quality_staff') {
      throw new Error(
        `Unauthorized: quality_staff user ${requestingUserId} is strictly prohibited from accessing identifiable declaration content.`,
      );
    }
    if (user.role === 'oh_professional') {
      throw new Error(
        `Unauthorized: oh_professional user ${requestingUserId} is not permitted to query general-purpose declaration lists. Access incident records via the OH coordination workflow.`,
      );
    }
    if (user.role === 'exposed_professional') {
      if (userId !== undefined && userId !== null && userId !== requestingUserId) {
        throw new Error(
          `Unauthorized: exposed_professional user ${requestingUserId} is not permitted to access declarations owned by user ${userId}.`,
        );
      }
      const result = await this.db.query<AesDeclaration>(
        `SELECT * FROM aes_declarations
         WHERE declared_by_user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [requestingUserId, limit],
      );
      return result.rows;
    }
    if (userId !== undefined && userId !== null) {
      const result = await this.db.query<AesDeclaration>(
        `SELECT * FROM aes_declarations
         WHERE declared_by_user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [userId, limit],
      );
      return result.rows;
    }
    const result = await this.db.query<AesDeclaration>(
      `SELECT * FROM aes_declarations ORDER BY created_at DESC LIMIT ?`,
      [limit],
    );
    return result.rows;
  }

  async getDeclarationsByStatus(
    status: DeclarationStatus,
    requestingUserId?: number | null,
  ): Promise<AesDeclaration[]> {
    if (!DECLARATION_STATUSES.includes(status)) {
      throw new Error(`getDeclarationsByStatus: invalid status "${status}"`);
    }
    if (requestingUserId === undefined || requestingUserId === null) {
      throw new Error('Unauthorized: requesting user ID is required to query declarations by status.');
    }
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(`getDeclarationsByStatus: requesting user ${requestingUserId} not found`);
    }
    if (user.role === 'tech_admin') {
      throw new Error(
        `Unauthorized: tech_admin user ${requestingUserId} is strictly prohibited from accessing clinical declaration content.`,
      );
    }
    if (user.role === 'quality_staff') {
      throw new Error(
        `Unauthorized: quality_staff user ${requestingUserId} is strictly prohibited from accessing identifiable declaration content.`,
      );
    }
    if (user.role === 'oh_professional') {
      throw new Error(
        `Unauthorized: oh_professional user ${requestingUserId} is not permitted to query declarations by status. Access incident records via the OH coordination workflow.`,
      );
    }
    if (user.role === 'exposed_professional') {
      const result = await this.db.query<AesDeclaration>(
        `SELECT * FROM aes_declarations WHERE status = ? AND declared_by_user_id = ? ORDER BY created_at DESC`,
        [status, requestingUserId],
      );
      return result.rows;
    }
    const result = await this.db.query<AesDeclaration>(
      `SELECT * FROM aes_declarations WHERE status = ? ORDER BY created_at DESC`,
      [status],
    );
    return result.rows;
  }

  async deleteAesDeclaration(id: number): Promise<MutationResult> {
    return this.db.execute(
      `DELETE FROM aes_declarations WHERE id = ?`,
      [id],
    );
  }

  // ────────────────────────────────────────────────────────────
  //  Phase 2C.3 & 2C.3.1: Administrative Review & Correction Repository Operations
  // ────────────────────────────────────────────────────────────

  /**
   * Retrieves declarations eligible for administrative review.
   * Returns declarations with status 'submitted', 'under_review', 'correction_requested', or 'resubmitted',
   * sorted newest first. Can also filter by specific status.
   */
  async getReviewQueue(
    options: { status?: DeclarationStatus; limit?: number; requestingUserId?: number | null } = {},
  ): Promise<AesDeclaration[]> {
    const { status, limit = 100, requestingUserId } = options;
    if (requestingUserId === undefined || requestingUserId === null) {
      throw new Error('Unauthorized: requesting user ID is required to access the review queue.');
    }
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(`getReviewQueue: requesting user ${requestingUserId} not found`);
    }
    if (user.role !== 'admin_reviewer') {
      throw new Error(
        `Unauthorized: only admin_reviewer may access the review queue, got ${user.role}.`,
      );
    }
    if (status) {
      const result = await this.db.query<AesDeclaration>(
        `SELECT * FROM aes_declarations
         WHERE status = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [status, limit],
      );
      return result.rows;
    }
    const result = await this.db.query<AesDeclaration>(
      `SELECT * FROM aes_declarations
       WHERE status IN ('submitted', 'under_review', 'correction_requested', 'resubmitted')
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit],
    );
    return result.rows;
  }

  /**
   * Record an administrative review outcome.
   *
   * Enforces:
   * 1. Declaration existence & status check (must be 'submitted', 'under_review', or 'resubmitted').
   * 2. Reviewer role authorization (must be 'admin_reviewer').
   * 3. Valid review outcome ('acknowledged', 'transmission_verified', 'correction_requested').
   * 4. Lifecycle transition:
   *    - 'correction_requested' → transitions declaration to 'correction_requested'
   *    - 'acknowledged' / 'transmission_verified' → transitions declaration to 'under_review'
   * 5. Preserves original declaration narrative completely intact.
   */
  async createAdministrativeReview(input: {
    declaration_id: number;
    reviewer_user_id: number;
    outcome: ReviewOutcome;
    comments?: string | null;
    correction_reason?: string | null;
  }): Promise<{ reviewId: number; declarationStatus: DeclarationStatus }> {
    // 1. Verify outcome
    if (!REVIEW_OUTCOMES.includes(input.outcome)) {
      throw new Error(
        `createAdministrativeReview: invalid outcome "${input.outcome}". ` +
          `Valid outcomes: ${REVIEW_OUTCOMES.join(', ')}`,
      );
    }

    // 2. Verify reviewer role authorization
    const reviewer = await this.getDemoUser(input.reviewer_user_id);
    if (!reviewer) {
      throw new Error(`createAdministrativeReview: reviewer ${input.reviewer_user_id} not found`);
    }
    if (reviewer.role !== 'admin_reviewer') {
      throw new Error(
        `createAdministrativeReview: user ${input.reviewer_user_id} with role "${reviewer.role}" is NOT authorized. ` +
          `Only "admin_reviewer" may record administrative reviews.`,
      );
    }

    // 3. Verify declaration
    const decl = await this.getDeclarationByIdInternal(input.declaration_id);
    if (!decl) {
      throw new Error(`createAdministrativeReview: declaration ${input.declaration_id} not found`);
    }
    if (
      decl.status !== 'submitted' &&
      decl.status !== 'under_review' &&
      decl.status !== 'resubmitted'
    ) {
      throw new Error(
        `createAdministrativeReview: declaration ${input.declaration_id} has status "${decl.status}". ` +
          `Reviews can only be performed on "submitted", "under_review", or "resubmitted" declarations.`,
      );
    }

    if (input.outcome === 'correction_requested' && !input.correction_reason?.trim()) {
      throw new Error(
        'createAdministrativeReview: correction_reason is required when outcome is "correction_requested"',
      );
    }

    const targetStatus: DeclarationStatus =
      input.outcome === 'correction_requested' ? 'correction_requested' : 'under_review';

    let reviewId = 0;
    const now = new Date().toISOString();

    // 4. Atomic transaction: write review record + transition declaration status + generate notification
    await this.db.transaction(async tx => {
      const reviewRes = await tx.execute(
        `INSERT INTO administrative_reviews (
           declaration_id, reviewer_user_id, outcome, comments,
           correction_reason, reviewed_at, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.declaration_id,
          input.reviewer_user_id,
          input.outcome,
          input.comments ?? null,
          input.correction_reason ?? null,
          now,
          now,
        ],
      );
      reviewId = reviewRes.insertId!;

      await tx.execute(
        `UPDATE aes_declarations SET status = ?, updated_at = ? WHERE id = ?`,
        [targetStatus, now, input.declaration_id],
      );

      const isCorrection = input.outcome === 'correction_requested';
      const eventType: NotificationEventType = isCorrection
        ? 'correction_requested'
        : 'review_completed';
      const titleKey = isCorrection
        ? 'notification.correctionRequested.title'
        : 'notification.reviewCompleted.title';
      const messageKey = isCorrection
        ? 'notification.correctionRequested.message'
        : 'notification.reviewCompleted.message';
      const idempotencyKey = `notif:${eventType}:administrative_review:${reviewId}:${decl.declared_by_user_id}`;

      await this.insertNotification(
        {
          recipient_user_id: decl.declared_by_user_id,
          event_type: eventType,
          title_key: titleKey,
          message_key: messageKey,
          entity_type: 'administrative_review',
          entity_id: reviewId,
          entity_reference: decl.reference_number,
          idempotency_key: idempotencyKey,
        },
        tx,
      );
    });

    return { reviewId, declarationStatus: targetStatus };
  }

  /**
   * Phase 2C.3.1: Record a correction response from the declaring professional.
   *
   * Enforces:
   * 1. Responding user existence & role authorization (must be 'exposed_professional').
   * 2. Declaration existence & ownership (decl.declared_by_user_id === user.id).
   * 3. Declaration lifecycle status check (must be 'correction_requested').
   * 4. Review existence, association, and outcome check (must reference a 'correction_requested' review on this declaration).
   * 5. Uniqueness: prevents duplicate responses to the same review.
   * 6. Non-empty response text.
   * 7. Atomic transaction: inserts into correction_responses and transitions declaration status to 'resubmitted'.
   * 8. Original declaration narrative remains completely intact and immutable.
   */
  async createCorrectionResponse(input: {
    declaration_id: number;
    review_id: number;
    user_id: number;
    response_text: string;
  }): Promise<{ responseId: number; declarationStatus: DeclarationStatus }> {
    // 1. Responding user check
    const user = await this.getDemoUser(input.user_id);
    if (!user) {
      throw new Error(`createCorrectionResponse: user ${input.user_id} not found`);
    }
    if (user.role !== 'exposed_professional') {
      throw new Error(
        `createCorrectionResponse: user ${input.user_id} with role "${user.role}" is NOT authorized. ` +
          `Only "exposed_professional" who owns the declaration may respond to correction requests.`,
      );
    }

    // 2. Declaration existence & ownership check
    const decl = await this.getDeclarationByIdInternal(input.declaration_id);
    if (!decl) {
      throw new Error(`createCorrectionResponse: declaration ${input.declaration_id} not found`);
    }
    if (decl.declared_by_user_id !== user.id) {
      throw new Error(
        `createCorrectionResponse: unauthorized. User ${user.id} does NOT own declaration ${input.declaration_id}. ` +
          `Declaration belongs to user ${decl.declared_by_user_id}.`,
      );
    }

    // 3. Declaration status check
    if (decl.status !== 'correction_requested') {
      throw new Error(
        `createCorrectionResponse: declaration ${input.declaration_id} has status "${decl.status}". ` +
          `Correction responses can only be submitted when declaration status is "correction_requested".`,
      );
    }

    // 4. Review association check
    const reviewResult = await this.db.query<AdministrativeReview>(
      `SELECT * FROM administrative_reviews WHERE id = ?`,
      [input.review_id],
    );
    const review = reviewResult.rows[0];
    if (!review) {
      throw new Error(`createCorrectionResponse: review ${input.review_id} not found`);
    }
    if (review.declaration_id !== input.declaration_id) {
      throw new Error(
        `createCorrectionResponse: review ${input.review_id} belongs to declaration ${review.declaration_id}, ` +
          `not declaration ${input.declaration_id}.`,
      );
    }
    if (review.outcome !== 'correction_requested') {
      throw new Error(
        `createCorrectionResponse: review ${input.review_id} has outcome "${review.outcome}". ` +
          `Responses can only be submitted for reviews with outcome "correction_requested".`,
      );
    }

    // 5. Uniqueness: check if a response already exists for this review
    const existingResp = await this.db.query<CorrectionResponse>(
      `SELECT id FROM correction_responses WHERE review_id = ?`,
      [input.review_id],
    );
    if (existingResp.rows.length > 0) {
      throw new Error(
        `createCorrectionResponse: review ${input.review_id} already has a response recorded (id: ${existingResp.rows[0].id}).`,
      );
    }

    // 6. Non-empty text check
    if (!input.response_text?.trim()) {
      throw new Error('createCorrectionResponse: response_text is required and cannot be empty.');
    }

    let responseId = 0;
    const now = new Date().toISOString();

    // 7. Atomic transaction
    await this.db.transaction(async tx => {
      const adminReviewerId = await this.getRecipientUserIdByRole('admin_reviewer', tx);
      const respRes = await tx.execute(
        `INSERT INTO correction_responses (
           declaration_id, review_id, responding_user_id, response_text, responded_at, created_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          input.declaration_id,
          input.review_id,
          input.user_id,
          input.response_text.trim(),
          now,
          now,
        ],
      );
      responseId = respRes.insertId!;

      await tx.execute(
        `UPDATE aes_declarations SET status = 'resubmitted', updated_at = ? WHERE id = ?`,
        [now, input.declaration_id],
      );

      await this.insertNotification(
        {
          recipient_user_id: adminReviewerId,
          event_type: 'correction_submitted',
          title_key: 'notification.correctionSubmitted.title',
          message_key: 'notification.correctionSubmitted.message',
          entity_type: 'correction_response',
          entity_id: responseId,
          entity_reference: decl.reference_number,
          idempotency_key: `notif:correction_submitted:correction_response:${responseId}:${adminReviewerId}`,
        },
        tx,
      );
    });

    return { responseId, declarationStatus: 'resubmitted' };
  }

  /**
   * Retrieves all correction responses recorded for a given declaration.
   */
  async getCorrectionResponses(
    declarationId: number,
    requestingUserId?: number | null,
  ): Promise<CorrectionResponse[]> {
    if (requestingUserId === undefined || requestingUserId === null) {
      throw new Error('Unauthorized: requesting user ID is required to access correction responses.');
    }
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(`getCorrectionResponses: requesting user ${requestingUserId} not found`);
    }
    if (user.role === 'tech_admin') {
      throw new Error(
        `Unauthorized: tech_admin user ${requestingUserId} is strictly prohibited from accessing correction response content.`,
      );
    }
    if (user.role === 'quality_staff') {
      throw new Error(
        `Unauthorized: quality_staff user ${requestingUserId} is strictly prohibited from accessing correction response content.`,
      );
    }
    if (user.role === 'exposed_professional') {
      const decl = await this.getDeclarationByIdInternal(declarationId);
      if (!decl || decl.declared_by_user_id !== requestingUserId) {
        throw new Error(
          `Unauthorized: exposed_professional user ${requestingUserId} is not permitted to access correction responses for declaration ${declarationId}.`,
        );
      }
    }
    const result = await this.db.query<CorrectionResponse>(
      `SELECT * FROM correction_responses
       WHERE declaration_id = ?
       ORDER BY responded_at DESC, id DESC`,
      [declarationId],
    );
    return result.rows;
  }

  /**
   * Finds the latest pending correction request review for a declaration, if any.
   * Returns null if declaration is not in 'correction_requested' or if request already has a response.
   */
  async getLatestPendingCorrectionRequest(
    declarationId: number,
    userId: number,
  ): Promise<AdministrativeReview | null> {
    const decl = await this.getDeclarationByIdInternal(declarationId);
    if (!decl) throw new Error(`Declaration ${declarationId} not found`);
    if (decl.declared_by_user_id !== userId) {
      throw new Error(`Unauthorized: user ${userId} does not own declaration ${declarationId}`);
    }
    if (decl.status !== 'correction_requested') {
      return null;
    }
    const history = await this.getDeclarationReviewHistory(declarationId, userId);
    const pending = history.find(
      r => r.outcome === 'correction_requested' && !r.response,
    );
    return pending ?? null;
  }

  /**
   * Retrieves review history for a given declaration, including associated
   * correction responses where applicable. Ordered newest first by default.
   */
  async getDeclarationReviewHistory(
    declarationId: number,
    optionsOrUserId?: { order?: 'ASC' | 'DESC'; requestingUserId?: number | null } | number | null,
  ): Promise<AdministrativeReview[]> {
    const requestingUserId =
      typeof optionsOrUserId === 'number'
        ? optionsOrUserId
        : optionsOrUserId?.requestingUserId;
    const order =
      typeof optionsOrUserId === 'object' && optionsOrUserId?.order === 'ASC'
        ? 'ASC'
        : 'DESC';

    if (requestingUserId === undefined || requestingUserId === null) {
      throw new Error('Unauthorized: requesting user ID is required to access review history.');
    }
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(`getDeclarationReviewHistory: requesting user ${requestingUserId} not found`);
    }
    if (user.role === 'tech_admin') {
      throw new Error(
        `Unauthorized: tech_admin user ${requestingUserId} is strictly prohibited from accessing review history content.`,
      );
    }
    if (user.role === 'quality_staff') {
      throw new Error(
        `Unauthorized: quality_staff user ${requestingUserId} is strictly prohibited from accessing review history content.`,
      );
    }
    if (user.role === 'exposed_professional') {
      const decl = await this.getDeclarationByIdInternal(declarationId);
      if (!decl || decl.declared_by_user_id !== requestingUserId) {
        throw new Error(
          `Unauthorized: exposed_professional user ${requestingUserId} is not permitted to access review history for declaration ${declarationId}.`,
        );
      }
    }

    const reviewResult = await this.db.query<AdministrativeReview>(
      `SELECT * FROM administrative_reviews
       WHERE declaration_id = ?
       ORDER BY reviewed_at ${order}, id ${order}`,
      [declarationId],
    );
    const reviews = reviewResult.rows;
    if (reviews.length === 0) return [];

    const responseResult = await this.db.query<CorrectionResponse>(
      `SELECT * FROM correction_responses
       WHERE declaration_id = ?
       ORDER BY responded_at ${order}, id ${order}`,
      [declarationId],
    );
    const responses = responseResult.rows;

    for (const r of reviews) {
      r.response = null;
      if (r.outcome === 'correction_requested') {
        r.response = responses.find(resp => resp.review_id === r.id) ?? null;
      }
    }

    return reviews;
  }

  // ────────────────────────────────────────────────────────────
  //  Audit events
  // ────────────────────────────────────────────────────────────

  async logAuditEvent(
    event: Omit<AuditEvent, 'id' | 'occurred_at'>,
  ): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        event.event_type,
        event.user_id ?? null,
        event.entity_type ?? null,
        event.entity_id ?? null,
        event.description,
      ],
    );
    return result.insertId!;
  }

  async listAuditEvents(limit = 100): Promise<AuditEvent[]> {
    const result = await this.db.query<AuditEvent>(
      `SELECT * FROM audit_events ORDER BY occurred_at DESC LIMIT ?`,
      [limit],
    );
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────
  //  Phase 2C.4 — Occupational-health coordination
  // ────────────────────────────────────────────────────────────

  /**
   * Create an occupational-health coordination record.
   * Only admin_reviewer may create; at most one active record per declaration.
   */
  async createOhCoordination(input: {
    declaration_id: number;
    created_by_user_id: number;
    coordination_reason: OhCoordinationReason;
  }): Promise<number> {
    // Validate coordination_reason
    if (!OH_COORDINATION_REASONS.includes(input.coordination_reason)) {
      throw new Error(`Invalid coordination_reason: ${input.coordination_reason}`);
    }

    // Verify creator has admin_reviewer role
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [input.created_by_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('createOhCoordination: creator user not found');
    }
    const creator = userResult.rows[0];
    if (creator.role !== 'admin_reviewer') {
      throw new Error(
        `createOhCoordination: unauthorized — requires admin_reviewer, got ${creator.role}`,
      );
    }

    // Verify declaration exists
    const declResult = await this.db.query<AesDeclaration>(
      `SELECT id, reference_number FROM aes_declarations WHERE id = ?`,
      [input.declaration_id],
    );
    if (declResult.rows.length === 0) {
      throw new Error(`createOhCoordination: declaration ${input.declaration_id} not found`);
    }
    const decl = declResult.rows[0];

    // Check for existing active coordination (domain-level guard; DB also enforces via partial unique index)
    const activeResult = await this.db.query<{ id: number }>(
      `SELECT id FROM oh_coordinations WHERE declaration_id = ? AND status IN ('pending_acknowledgement', 'acknowledged')`,
      [input.declaration_id],
    );
    if (activeResult.rows.length > 0) {
      throw new Error(
        `createOhCoordination: active coordination already exists for declaration ${input.declaration_id}`,
      );
    }

    let coordId = 0;
    const now = new Date().toISOString();

    await this.db.transaction(async tx => {
      const ohProfessionalId = await this.getRecipientUserIdByRole('oh_professional', tx);
      const result = await tx.execute(
        `INSERT INTO oh_coordinations
           (declaration_id, created_by_user_id, coordination_reason, status, created_at, updated_at)
         VALUES (?, ?, ?, 'pending_acknowledgement', ?, ?)`,
        [input.declaration_id, input.created_by_user_id, input.coordination_reason, now, now],
      );
      coordId = result.insertId!;

      await this.insertNotification(
        {
          recipient_user_id: ohProfessionalId,
          event_type: 'oh_coordination_created',
          title_key: 'notification.ohCoordinationCreated.title',
          message_key: 'notification.ohCoordinationCreated.message',
          entity_type: 'oh_coordination',
          entity_id: coordId,
          entity_reference: decl.reference_number,
          idempotency_key: `notif:oh_coordination_created:oh_coordination:${coordId}:${ohProfessionalId}`,
        },
        tx,
      );
    });

    return coordId;
  }

  /**
   * Acknowledge an OH coordination record (oh_professional only).
   * Transitions: pending_acknowledgement → acknowledged
   */
  async acknowledgeOhCoordination(
    coordination_id: number,
    acknowledging_user_id: number,
  ): Promise<void> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [acknowledging_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('acknowledgeOhCoordination: user not found');
    }
    if (userResult.rows[0].role !== 'oh_professional') {
      throw new Error(
        `acknowledgeOhCoordination: unauthorized — requires oh_professional, got ${userResult.rows[0].role}`,
      );
    }

    const coordResult = await this.db.query<OhCoordination>(
      `SELECT * FROM oh_coordinations WHERE id = ?`,
      [coordination_id],
    );
    if (coordResult.rows.length === 0) {
      throw new Error(`acknowledgeOhCoordination: coordination ${coordination_id} not found`);
    }
    const coord = coordResult.rows[0];
    if (coord.status !== 'pending_acknowledgement') {
      throw new Error(
        `acknowledgeOhCoordination: invalid transition from ${coord.status} — expected pending_acknowledgement`,
      );
    }

    const decl = await this.getDeclarationByIdInternal(coord.declaration_id);
    if (!decl) {
      throw new Error(`acknowledgeOhCoordination: declaration for coordination ${coordination_id} not found`);
    }

    const now = new Date().toISOString();
    await this.db.transaction(async tx => {
      await tx.execute(
        `UPDATE oh_coordinations
         SET status = 'acknowledged', acknowledged_by_user_id = ?, acknowledged_at = ?, updated_at = ?
         WHERE id = ?`,
        [acknowledging_user_id, now, now, coordination_id],
      );

      await this.insertNotification(
        {
          recipient_user_id: decl.declared_by_user_id,
          event_type: 'oh_coordination_acknowledged',
          title_key: 'notification.ohCoordinationAcknowledged.title',
          message_key: 'notification.ohCoordinationAcknowledged.message',
          entity_type: 'oh_coordination',
          entity_id: coordination_id,
          entity_reference: decl.reference_number,
          idempotency_key: `notif:oh_coordination_acknowledged:oh_coordination:${coordination_id}:${decl.declared_by_user_id}`,
        },
        tx,
      );
    });
  }

  /**
   * Complete an OH coordination record (oh_professional only).
   * Transitions: acknowledged → completed
   */
  async completeOhCoordination(
    coordination_id: number,
    completing_user_id: number,
  ): Promise<void> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [completing_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('completeOhCoordination: user not found');
    }
    if (userResult.rows[0].role !== 'oh_professional') {
      throw new Error(
        `completeOhCoordination: unauthorized — requires oh_professional, got ${userResult.rows[0].role}`,
      );
    }

    const coordResult = await this.db.query<OhCoordination>(
      `SELECT * FROM oh_coordinations WHERE id = ?`,
      [coordination_id],
    );
    if (coordResult.rows.length === 0) {
      throw new Error(`completeOhCoordination: coordination ${coordination_id} not found`);
    }
    const coord = coordResult.rows[0];
    if (coord.status !== 'acknowledged') {
      throw new Error(
        `completeOhCoordination: invalid transition from ${coord.status} — expected acknowledged`,
      );
    }

    const decl = await this.getDeclarationByIdInternal(coord.declaration_id);
    if (!decl) {
      throw new Error(`completeOhCoordination: declaration for coordination ${coordination_id} not found`);
    }

    const now = new Date().toISOString();
    await this.db.transaction(async tx => {
      await tx.execute(
        `UPDATE oh_coordinations
         SET status = 'completed', completed_by_user_id = ?, completed_at = ?, updated_at = ?
         WHERE id = ?`,
        [completing_user_id, now, now, coordination_id],
      );

      await this.insertNotification(
        {
          recipient_user_id: decl.declared_by_user_id,
          event_type: 'oh_coordination_completed',
          title_key: 'notification.ohCoordinationCompleted.title',
          message_key: 'notification.ohCoordinationCompleted.message',
          entity_type: 'oh_coordination',
          entity_id: coordination_id,
          entity_reference: decl.reference_number,
          idempotency_key: `notif:oh_coordination_completed:oh_coordination:${coordination_id}:${decl.declared_by_user_id}`,
        },
        tx,
      );
    });
  }

  /**
   * Cancel an OH coordination record.
   * Only admin_reviewer (creator) may cancel from pending_acknowledgement.
   */
  async cancelOhCoordination(
    coordination_id: number,
    cancelling_user_id: number,
  ): Promise<void> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [cancelling_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('cancelOhCoordination: user not found');
    }
    if (userResult.rows[0].role !== 'admin_reviewer') {
      throw new Error(
        `cancelOhCoordination: unauthorized — requires admin_reviewer, got ${userResult.rows[0].role}`,
      );
    }

    const coordResult = await this.db.query<OhCoordination>(
      `SELECT * FROM oh_coordinations WHERE id = ?`,
      [coordination_id],
    );
    if (coordResult.rows.length === 0) {
      throw new Error(`cancelOhCoordination: coordination ${coordination_id} not found`);
    }
    const coord = coordResult.rows[0];
    if (coord.status !== 'pending_acknowledgement') {
      throw new Error(
        `cancelOhCoordination: can only cancel from pending_acknowledgement, current status: ${coord.status}`,
      );
    }

    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE oh_coordinations SET status = 'cancelled', updated_at = ? WHERE id = ?`,
      [now, coordination_id],
    );
  }

  /**
   * Get OH coordination record by ID with role-based field filtering.
   * tech_admin is blocked from all OH coordination data.
   */
  async getOhCoordinationById(
    coordination_id: number,
    requesting_user_id: number | null,
  ): Promise<OhCoordination | AdminOhCoordinationSummary | ExposedOhCoordinationSummary | null> {
    if (requesting_user_id === undefined || requesting_user_id === null) {
      throw new Error('Unauthorized: requesting user ID is required to access coordination data');
    }
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`getOhCoordinationById: requesting user ${requesting_user_id} not found`);
    }
    const user = userResult.rows[0];
    if (user.role === 'tech_admin') {
      throw new Error(
        'getOhCoordinationById: tech_admin is not authorized to access coordination data',
      );
    }
    if (user.role === 'quality_staff') {
      throw new Error(
        'getOhCoordinationById: quality_staff is not authorized to access coordination data',
      );
    }
    if (user.role !== 'oh_professional' && user.role !== 'admin_reviewer' && user.role !== 'exposed_professional') {
      throw new Error(
        `getOhCoordinationById: role ${user.role} is not authorized to access coordination data`,
      );
    }

    const result = await this.db.query<any>(
      `SELECT c.*, d.reference_number AS declaration_reference
       FROM oh_coordinations c
       LEFT JOIN aes_declarations d ON d.id = c.declaration_id
       WHERE c.id = ?`,
      [coordination_id],
    );
    if (result.rows.length === 0) return null;
    const coord = result.rows[0];

    // exposed_professional may only see their own declaration's status
    if (user.role === 'exposed_professional') {
      const declResult = await this.db.query<AesDeclaration>(
        `SELECT * FROM aes_declarations WHERE id = ?`,
        [coord.declaration_id],
      );
      if (declResult.rows.length === 0 || declResult.rows[0].declared_by_user_id !== requesting_user_id) {
        throw new Error(
          'getOhCoordinationById: exposed_professional may only view coordination for their own declaration',
        );
      }
      // Return minimal status-only projection (unauthorized fields completely omitted)
      const exposedSummary: ExposedOhCoordinationSummary = {
        id: coord.id,
        declaration_id: coord.declaration_id,
        status: coord.status,
        created_at: coord.created_at,
        updated_at: coord.updated_at,
      };
      return exposedSummary;
    }

    // admin_reviewer: approved minimal administrative projection (unauthorized fields completely omitted)
    if (user.role === 'admin_reviewer') {
      const adminSummary: AdminOhCoordinationSummary = {
        id: coord.id,
        declaration_id: coord.declaration_id,
        created_by_user_id: coord.created_by_user_id,
        coordination_reason: coord.coordination_reason,
        status: coord.status,
        acknowledged_at: coord.acknowledged_at,
        completed_at: coord.completed_at,
        created_at: coord.created_at,
        updated_at: coord.updated_at,
      };
      const declRef = coord.declaration_reference ?? coord.reference_number;
      if (declRef) {
        adminSummary.declaration_reference = declRef;
      }
      return adminSummary;
    }

    return coord;
  }

  /**
   * Internal coordination detail path: Retrieves the declaration associated with an authorized OH coordination.
   * Scoped strictly to an existing authorized coordination; verifies caller is oh_professional.
   * Cannot be used to query arbitrary declarations.
   */
  async getDeclarationForCoordinationInternal(
    coordination_id: number,
    requesting_user_id: number | null | undefined,
  ): Promise<AesDeclaration | null> {
    if (requesting_user_id === undefined || requesting_user_id === null) {
      throw new Error('Unauthorized: requesting user ID is required to access declaration via coordination.');
    }
    const user = await this.getDemoUser(requesting_user_id);
    if (!user) {
      throw new Error(`getDeclarationForCoordinationInternal: requesting user ${requesting_user_id} not found`);
    }
    if (user.role !== 'oh_professional') {
      throw new Error(
        `Unauthorized: role ${user.role} is not permitted to access declaration via OH coordination internal path.`,
      );
    }
    const coord = (await this.getOhCoordinationById(coordination_id, requesting_user_id)) as OhCoordination | null;
    if (!coord) {
      return null;
    }
    return this.getDeclarationByIdInternal(coord.declaration_id);
  }

  /**
   * Get active OH coordination for a declaration with role filtering.
   */
  async getOhCoordinationByDeclaration(
    declaration_id: number,
    requesting_user_id: number | null,
  ): Promise<OhCoordination | AdminOhCoordinationSummary | ExposedOhCoordinationSummary | null> {
    if (requesting_user_id === undefined || requesting_user_id === null) {
      throw new Error('Unauthorized: requesting user ID is required to access coordination data');
    }
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`getOhCoordinationByDeclaration: requesting user ${requesting_user_id} not found`);
    }
    const user = userResult.rows[0];
    if (user.role === 'tech_admin') {
      throw new Error(
        'getOhCoordinationByDeclaration: tech_admin is not authorized to access coordination data',
      );
    }
    if (user.role === 'quality_staff') {
      throw new Error(
        'getOhCoordinationByDeclaration: quality_staff is not authorized to access coordination data',
      );
    }
    if (user.role !== 'oh_professional' && user.role !== 'admin_reviewer' && user.role !== 'exposed_professional') {
      throw new Error(
        `getOhCoordinationByDeclaration: role ${user.role} is not authorized to access coordination data`,
      );
    }

    const result = await this.db.query<any>(
      `SELECT c.*, d.reference_number AS declaration_reference
       FROM oh_coordinations c
       LEFT JOIN aes_declarations d ON d.id = c.declaration_id
       WHERE c.declaration_id = ? AND c.status IN ('pending_acknowledgement', 'acknowledged')
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [declaration_id],
    );
    if (result.rows.length === 0) return null;
    const coord = result.rows[0];

    // exposed_professional: status-only view, own declarations only
    if (user.role === 'exposed_professional') {
      const declResult = await this.db.query<AesDeclaration>(
        `SELECT * FROM aes_declarations WHERE id = ?`,
        [declaration_id],
      );
      if (declResult.rows.length === 0 || declResult.rows[0].declared_by_user_id !== requesting_user_id) {
        throw new Error(
          'getOhCoordinationByDeclaration: exposed_professional may only view their own declaration',
        );
      }
      // Return minimal status-only projection (unauthorized fields completely omitted)
      const exposedSummary: ExposedOhCoordinationSummary = {
        id: coord.id,
        declaration_id: coord.declaration_id,
        status: coord.status,
        created_at: coord.created_at,
        updated_at: coord.updated_at,
      };
      return exposedSummary;
    }

    // admin_reviewer: approved minimal administrative projection (unauthorized fields completely omitted)
    if (user.role === 'admin_reviewer') {
      const adminSummary: AdminOhCoordinationSummary = {
        id: coord.id,
        declaration_id: coord.declaration_id,
        created_by_user_id: coord.created_by_user_id,
        coordination_reason: coord.coordination_reason,
        status: coord.status,
        acknowledged_at: coord.acknowledged_at,
        completed_at: coord.completed_at,
        created_at: coord.created_at,
        updated_at: coord.updated_at,
      };
      const declRef = coord.declaration_reference ?? coord.reference_number;
      if (declRef) {
        adminSummary.declaration_reference = declRef;
      }
      return adminSummary;
    }

    return coord;
  }

  /**
   * List all non-completed coordination records for the OH professional queue.
   * Returns records with enriched declaration reference.
   */
  /**
   * List OH coordination records for the occupational-health professional queue.
   *
   * Default (options omitted or options.includeCompleted falsy):
   *   Returns pending_acknowledgement and acknowledged records only.
   *   This is the operational active-task inbox used by the workspace badge count.
   *
   * With options.includeCompleted === true:
   *   Also includes completed records (blueprint Tab 3 "Suivi terminé").
   *   cancelled records remain excluded in all invocation modes.
   *
   * Phase 2E.1.6.0.2 — backward-compatible extension.
   * Authorization: oh_professional only. Fails closed for all other identities.
   */
  async listOhCoordinationsQueue(
    requesting_user_id: number | null | undefined,
    options?: OhQueueFilterOptions,
  ): Promise<OhCoordination[]> {
    if (requesting_user_id === undefined || requesting_user_id === null) {
      throw new Error('Unauthorized: requesting user ID is required to list OH queue');
    }
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`listOhCoordinationsQueue: requesting user ${requesting_user_id} not found`);
    }
    const user = userResult.rows[0];
    if (user.role !== 'oh_professional') {
      throw new Error(
        `listOhCoordinationsQueue: unauthorized — requires oh_professional, got ${user.role}`,
      );
    }

    // Use explicit, fixed SQL for the two supported filter modes.
    // Do not interpolate caller-supplied status values into SQL.
    const sql = options?.includeCompleted === true
      ? `SELECT c.*, d.reference_number AS declaration_reference,
                u.display_name AS creator_name
         FROM oh_coordinations c
         LEFT JOIN aes_declarations d ON d.id = c.declaration_id
         LEFT JOIN demo_users u ON u.id = c.created_by_user_id
         WHERE c.status IN ('pending_acknowledgement', 'acknowledged', 'completed')
         ORDER BY c.created_at ASC`
      : `SELECT c.*, d.reference_number AS declaration_reference,
                u.display_name AS creator_name
         FROM oh_coordinations c
         LEFT JOIN aes_declarations d ON d.id = c.declaration_id
         LEFT JOIN demo_users u ON u.id = c.created_by_user_id
         WHERE c.status IN ('pending_acknowledgement', 'acknowledged')
         ORDER BY c.created_at ASC`;

    const result = await this.db.query<OhCoordination>(sql, []);
    return result.rows;
  }

  /**
   * List coordinations created by a specific admin_reviewer.
   */
  async listOhCoordinationsForAdmin(
    requesting_user_id: number | null | undefined,
  ): Promise<AdminOhCoordinationSummary[]> {
    if (requesting_user_id === undefined || requesting_user_id === null) {
      throw new Error('Unauthorized: requesting user ID is required to list coordinations');
    }
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`listOhCoordinationsForAdmin: requesting user ${requesting_user_id} not found`);
    }
    const user = userResult.rows[0];
    if (user.role !== 'admin_reviewer') {
      throw new Error(
        `listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got ${user.role}`,
      );
    }

    const result = await this.db.query<any>(
      `SELECT c.*, d.reference_number AS declaration_reference
       FROM oh_coordinations c
       LEFT JOIN aes_declarations d ON d.id = c.declaration_id
       WHERE c.created_by_user_id = ?
       ORDER BY c.created_at DESC`,
      [requesting_user_id],
    );
    return result.rows.map((coord) => {
      const adminSummary: AdminOhCoordinationSummary = {
        id: coord.id,
        declaration_id: coord.declaration_id,
        created_by_user_id: coord.created_by_user_id,
        coordination_reason: coord.coordination_reason,
        status: coord.status,
        acknowledged_at: coord.acknowledged_at,
        completed_at: coord.completed_at,
        created_at: coord.created_at,
        updated_at: coord.updated_at,
      };
      const declRef = coord.declaration_reference ?? coord.reference_number;
      if (declRef) {
        adminSummary.declaration_reference = declRef;
      }
      return adminSummary;
    });
  }

  /**
   * Record an OH follow-up event (oh_professional only).
   * If event_category === 'follow_up_completed', auto-transitions coordination to 'completed'.
   */
  async createOhFollowUpEvent(input: {
    coordination_id: number;
    event_category: OhFollowUpEventCategory;
    event_date: string;
    recorded_by_user_id: number;
    administrative_note?: string;
  }): Promise<number> {
    if (!OH_FOLLOW_UP_EVENT_CATEGORIES.includes(input.event_category)) {
      throw new Error(`Invalid event_category: ${input.event_category}`);
    }

    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [input.recorded_by_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('createOhFollowUpEvent: recording user not found');
    }
    if (userResult.rows[0].role !== 'oh_professional') {
      throw new Error(
        `createOhFollowUpEvent: unauthorized — requires oh_professional, got ${userResult.rows[0].role}`,
      );
    }

    const coordResult = await this.db.query<OhCoordination>(
      `SELECT * FROM oh_coordinations WHERE id = ?`,
      [input.coordination_id],
    );
    if (coordResult.rows.length === 0) {
      throw new Error(`createOhFollowUpEvent: coordination ${input.coordination_id} not found`);
    }
    const coord = coordResult.rows[0];
    if (coord.status === 'completed' || coord.status === 'cancelled') {
      throw new Error(
        `createOhFollowUpEvent: cannot record events on a ${coord.status} coordination`,
      );
    }

    const decl = await this.getDeclarationByIdInternal(coord.declaration_id);
    if (!decl) {
      throw new Error(`createOhFollowUpEvent: declaration for coordination ${input.coordination_id} not found`);
    }

    let eventId = 0;
    const now = new Date().toISOString();

    await this.db.transaction(async tx => {
      const result = await tx.execute(
        `INSERT INTO oh_follow_up_events
           (coordination_id, event_category, event_date, recorded_by_user_id, administrative_note, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          input.coordination_id,
          input.event_category,
          input.event_date,
          input.recorded_by_user_id,
          input.administrative_note ?? null,
          now,
        ],
      );
      eventId = result.insertId!;

      // Auto-complete coordination and notify when follow_up_completed event is recorded
      if (input.event_category === 'follow_up_completed') {
        await tx.execute(
          `UPDATE oh_coordinations
           SET status = 'completed', completed_by_user_id = ?, completed_at = ?, updated_at = ?
           WHERE id = ?`,
          [input.recorded_by_user_id, now, now, input.coordination_id],
        );

        await this.insertNotification(
          {
            recipient_user_id: decl.declared_by_user_id,
            event_type: 'oh_coordination_completed',
            title_key: 'notification.ohCoordinationCompleted.title',
            message_key: 'notification.ohCoordinationCompleted.message',
            entity_type: 'oh_coordination',
            entity_id: input.coordination_id,
            entity_reference: decl.reference_number,
            idempotency_key: `notif:oh_coordination_completed:oh_coordination:${input.coordination_id}:${decl.declared_by_user_id}`,
          },
          tx,
        );
      } else {
        await this.insertNotification(
          {
            recipient_user_id: decl.declared_by_user_id,
            event_type: 'oh_milestone_recorded',
            title_key: 'notification.ohMilestoneRecorded.title',
            message_key: 'notification.ohMilestoneRecorded.message',
            entity_type: 'oh_follow_up_events',
            entity_id: eventId,
            entity_reference: decl.reference_number,
            idempotency_key: `notif:oh_milestone_recorded:oh_follow_up_events:${eventId}:${decl.declared_by_user_id}`,
          },
          tx,
        );
      }
    });

    return eventId;
  }

  /**
   * Get follow-up events for a coordination record.
   * Strictly oh_professional only (admin_reviewer, quality_staff, exposed_professional, tech_admin denied).
   */
  async getOhFollowUpEvents(
    coordination_id: number,
    requesting_user_id: number | null,
  ): Promise<OhFollowUpEvent[]> {
    if (requesting_user_id === undefined || requesting_user_id === null) {
      throw new Error('Unauthorized: requesting user ID is required to read follow-up events');
    }
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`getOhFollowUpEvents: requesting user ${requesting_user_id} not found`);
    }
    const user = userResult.rows[0];
    if (user.role !== 'oh_professional') {
      throw new Error(
        `getOhFollowUpEvents: role ${user.role} is not authorized to read follow-up events`,
      );
    }

    const result = await this.db.query<OhFollowUpEvent>(
      `SELECT e.*, u.display_name AS recorder_name
       FROM oh_follow_up_events e
       LEFT JOIN demo_users u ON u.id = e.recorded_by_user_id
       WHERE e.coordination_id = ?
       ORDER BY e.event_date ASC, e.created_at ASC`,
      [coordination_id],
    );
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────
  //  Phase 2C.5 — Aggregate Surveillance Dashboard
  // ────────────────────────────────────────────────────────────

  /**
   * Retrieves aggregate surveillance dashboard metrics.
   *
   * Strictly enforces role-based access:
   * - Authorized: quality_staff, admin_reviewer, oh_professional
   * - Prohibited: exposed_professional, tech_admin
   *
   * Returns purely aggregated counts and distributions. Never exposes
   * declarant names, reference numbers, narratives, or identifiable data.
   */
  async getSurveillanceDashboardMetrics(
    requesting_user_id: number,
    filters?: SurveillanceFilters,
  ): Promise<SurveillanceDashboardMetrics> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('getSurveillanceDashboardMetrics: requesting user not found');
    }
    const user = userResult.rows[0];

    if (user.role === 'tech_admin') {
      throw new Error(
        'getSurveillanceDashboardMetrics: tech_admin is strictly prohibited from surveillance metrics',
      );
    }
    if (user.role === 'exposed_professional') {
      throw new Error(
        'getSurveillanceDashboardMetrics: exposed_professional is strictly prohibited from surveillance metrics',
      );
    }
    if (
      user.role !== 'quality_staff' &&
      user.role !== 'admin_reviewer' &&
      user.role !== 'oh_professional'
    ) {
      throw new Error(
        `getSurveillanceDashboardMetrics: unauthorized role "${user.role}"`,
      );
    }

    // 1. Fetch raw declaration rows filtered by user criteria
    const declResult = await this.db.query<AesDeclaration>(
      `SELECT id, incident_date, incident_type, status FROM aes_declarations`,
      [],
    );
    const allDeclarationsCount = declResult.rows.length;
    let declarations = declResult.rows;

    if (filters?.status) {
      declarations = declarations.filter(d => d.status === filters.status);
    }
    if (filters?.incidentType) {
      declarations = declarations.filter(d => d.incident_type === filters.incidentType);
    }
    if (filters?.startDate && filters.startDate.trim().length > 0) {
      const s = filters.startDate.trim();
      declarations = declarations.filter(
        d => d.incident_date && d.incident_date.slice(0, 10) >= s,
      );
    }
    if (filters?.endDate && filters.endDate.trim().length > 0) {
      const e = filters.endDate.trim();
      declarations = declarations.filter(
        d => d.incident_date && d.incident_date.slice(0, 10) <= e,
      );
    }

    const filteredDeclIds = new Set(declarations.map(d => d.id));
    const hasActiveFilters = Boolean(
      filters?.status ||
      filters?.incidentType ||
      (filters?.startDate && filters.startDate.trim().length > 0) ||
      (filters?.endDate && filters.endDate.trim().length > 0),
    );

    // Overview declaration counts
    const totalDeclarations = declarations.length;
    let draftDeclarations = 0;
    let submittedDeclarations = 0;
    let underReviewDeclarations = 0;
    let correctionRequestedDeclarations = 0;
    let resubmittedDeclarations = 0;
    let closedDeclarations = 0;

    const statusCounts: Record<string, number> = {};
    const exposureCounts: Record<string, number> = {};
    const temporalCounts: Record<string, number> = {};

    for (const d of declarations) {
      // Status breakdown
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
      if (d.status === 'draft') draftDeclarations++;
      else if (d.status === 'submitted') submittedDeclarations++;
      else if (d.status === 'under_review') underReviewDeclarations++;
      else if (d.status === 'correction_requested') correctionRequestedDeclarations++;
      else if (d.status === 'resubmitted') resubmittedDeclarations++;
      else if (d.status === 'closed') closedDeclarations++;

      // Exposure breakdown
      exposureCounts[d.incident_type] = (exposureCounts[d.incident_type] || 0) + 1;

      // Temporal breakdown (YYYY-MM) with safe validation
      if (d.incident_date && /^\d{4}-\d{2}/.test(d.incident_date)) {
        const monthKey = d.incident_date.slice(0, 7);
        temporalCounts[monthKey] = (temporalCounts[monthKey] || 0) + 1;
      } else {
        temporalCounts['unknown'] = (temporalCounts['unknown'] || 0) + 1;
      }
    }

    // 2. Fetch Coordination Records linked to filtered declarations
    const coordResult = await this.db.query<OhCoordination>(
      `SELECT id, declaration_id, status FROM oh_coordinations`,
      [],
    );
    const coordinations = coordResult.rows.filter(c => filteredDeclIds.has(c.declaration_id));
    const filteredCoordIds = new Set(coordinations.map(c => c.id));

    let activeOhCoordinations = 0;
    let completedOhCoordinations = 0;
    const ohStatusCounts: Record<string, number> = {};

    for (const c of coordinations) {
      ohStatusCounts[c.status] = (ohStatusCounts[c.status] || 0) + 1;
      if (c.status === 'pending_acknowledgement' || c.status === 'acknowledged') {
        activeOhCoordinations++;
      } else if (c.status === 'completed') {
        completedOhCoordinations++;
      }
    }

    // 3. Fetch Follow-up Events linked to filtered coordinations
    const eventResult = await this.db.query<OhFollowUpEvent>(
      `SELECT id, coordination_id, event_category FROM oh_follow_up_events`,
      [],
    );
    const events = eventResult.rows.filter(e => filteredCoordIds.has(e.coordination_id));
    const eventCategoryCounts: Record<string, number> = {};
    for (const e of events) {
      eventCategoryCounts[e.event_category] = (eventCategoryCounts[e.event_category] || 0) + 1;
    }

    // 4. Fetch Administrative Reviews linked to filtered declarations
    const reviewResult = await this.db.query<AdministrativeReview>(
      `SELECT id, declaration_id, outcome FROM administrative_reviews`,
      [],
    );
    const reviews = reviewResult.rows.filter(r => filteredDeclIds.has(r.declaration_id));
    const outcomeCounts: Record<string, number> = {};
    let correctionRequests = 0;

    for (const r of reviews) {
      outcomeCounts[r.outcome] = (outcomeCounts[r.outcome] || 0) + 1;
      if (r.outcome === 'correction_requested') {
        correctionRequests++;
      }
    }

    // 5. Fetch Correction Responses linked to filtered declarations
    const corrResult = await this.db.query<CorrectionResponse>(
      `SELECT id, declaration_id FROM correction_responses`,
      [],
    );
    const correctionResponses = corrResult.rows.filter(cr =>
      filteredDeclIds.has(cr.declaration_id),
    ).length;

    // Build ordered distributions
    const temporalDistribution = Object.keys(temporalCounts)
      .sort()
      .map(month => ({ month, count: temporalCounts[month] }));

    const exposureDistribution = Object.keys(exposureCounts)
      .sort()
      .map(incidentType => ({ incidentType, count: exposureCounts[incidentType] }));

    const statusDistribution = Object.keys(statusCounts)
      .sort()
      .map(status => ({ status, count: statusCounts[status] }));

    const administrativeOutcomes = Object.keys(outcomeCounts)
      .sort()
      .map(outcome => ({ outcome, count: outcomeCounts[outcome] }));

    const ohStatusDistribution = Object.keys(ohStatusCounts)
      .sort()
      .map(status => ({ status, count: ohStatusCounts[status] }));

    const ohEventCategories = Object.keys(eventCategoryCounts)
      .sort()
      .map(category => ({ category, count: eventCategoryCounts[category] }));

    return {
      overview: {
        totalDeclarations,
        draftDeclarations,
        submittedDeclarations,
        underReviewDeclarations,
        correctionRequestedDeclarations,
        resubmittedDeclarations,
        closedDeclarations,
        activeOhCoordinations,
        completedOhCoordinations,
      },
      temporalDistribution,
      exposureDistribution,
      statusDistribution,
      administrativeReview: {
        totalReviews: reviews.length,
        outcomes: administrativeOutcomes,
        correctionRequests,
        correctionResponses,
      },
      occupationalHealth: {
        statusDistribution: ohStatusDistribution,
        eventCategories: ohEventCategories,
      },
      filterSummary: {
        totalRecords: allDeclarationsCount,
        matchingDeclarations: totalDeclarations,
        hasActiveFilters,
      },
    };
  }

  // ────────────────────────────────────────────────────────────
  //  Phase 2C.6 — Prevention & Corrective-Action Management (CAPA)
  // ────────────────────────────────────────────────────────────

  /**
   * Creates a new prevention or corrective action.
   *
   * STRICT BOUNDARY:
   * Only `quality_staff` is authorized to create prevention actions.
   */
  async createPreventionAction(
    userId: number,
    input: CreatePreventionActionInput,
    referenceCodeArg?: string | null,
  ): Promise<PreventionActionDetail> {
    const operationId = this.createCapaCreationOperationId();
    const reservation = await this.reserveCapaCreationOperation(
      userId,
      input,
      operationId,
      referenceCodeArg || this.createPreventionActionReferenceCode(),
      'new',
    );
    return this.createPreventionActionForOperation(
      userId,
      input,
      operationId,
      reservation.reference_code,
      'new',
    );
  }

  createPreventionActionReferenceCode(): string {
    return generateCapaReferenceNumber();
  }

  createCapaCreationOperationId(): string {
    return createCapaOperationId();
  }

  private async requireCapaCreationRole(
    userId: number,
    method: string,
  ): Promise<DemoUser> {
    const user = await this.getDemoUser(userId);
    if (!user) {
      throw new Error(`${method}: user ${userId} not found`);
    }
    if (user.role !== 'quality_staff') {
      throw new CapaCreationOperationConflictError(
        `${method}: only quality_staff may create or recover prevention actions.`,
      );
    }
    return user;
  }

  private normalizeCapaCreationPayload(input: CreatePreventionActionInput): {
    payload: CapaPayloadForHash;
    canonicalPayload: string;
    payloadHash: string;
  } {
    const title = input.title?.trim();
    if (!title || title.length < 3) {
      throw new Error('createPreventionAction: title must be at least 3 characters');
    }
    const description = input.description?.trim();
    if (!description || description.length < 5) {
      throw new Error('createPreventionAction: description must be at least 5 characters');
    }
    if (!PREVENTION_ACTION_TYPES.includes(input.action_type)) {
      throw new Error(`createPreventionAction: invalid action_type '${input.action_type}'`);
    }
    if (!CONTRIBUTING_FACTOR_CATEGORIES.includes(input.contributing_factor)) {
      throw new Error(`createPreventionAction: invalid contributing_factor '${input.contributing_factor}'`);
    }
    const rationale = input.rationale?.trim();
    if (!rationale || rationale.length < 5) {
      throw new Error('createPreventionAction: rationale must be at least 5 characters');
    }

    let targetDate: string | null = null;
    if (input.target_date && input.target_date.trim().length > 0) {
      targetDate = input.target_date.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        throw new Error('createPreventionAction: target_date must be in YYYY-MM-DD format');
      }
    }
    const surveillanceReference = input.surveillance_reference?.trim() || null;
    if (surveillanceReference && /^AES-\d{4}-\d+/i.test(surveillanceReference)) {
      throw new Error(
        'createPreventionAction: surveillance_reference must not reference individual declarations.',
      );
    }

    const payload: CapaPayloadForHash = {
      title,
      description,
      action_type: input.action_type,
      contributing_factor: input.contributing_factor,
      rationale,
      surveillance_reference: surveillanceReference,
      target_date: targetDate,
    };
    const canonicalPayload = canonicalCapaPayload(payload);
    return { payload, canonicalPayload, payloadHash: sha256Hex(canonicalPayload) };
  }

  private assertCapaOperationRecord(operation: CapaCreationOperation): void {
    if (!isValidCapaOperationId(operation.operation_id)) {
      throw new CapaCreationOperationIntegrityError(
        `Persisted CAPA operation ID '${operation.operation_id}' is invalid.`,
      );
    }
    if (!/^CAPA-\d{4}-\d{5}$/.test(operation.reference_code)) {
      throw new CapaCreationOperationIntegrityError(
        `Persisted CAPA operation ${operation.operation_id} has an invalid reference.`,
      );
    }
    if (operation.status !== 'pending' && operation.status !== 'committed') {
      throw new CapaCreationOperationIntegrityError(
        `Persisted CAPA operation ${operation.operation_id} has an invalid status.`,
      );
    }
    let parsedPayload: CreatePreventionActionInput;
    try {
      parsedPayload = JSON.parse(operation.payload_json) as CreatePreventionActionInput;
    } catch {
      throw new CapaCreationOperationIntegrityError(
        `Persisted CAPA operation ${operation.operation_id} has malformed payload data.`,
      );
    }
    const normalized = this.normalizeCapaCreationPayload(parsedPayload);
    if (
      normalized.canonicalPayload !== operation.payload_json ||
      normalized.payloadHash !== operation.payload_hash
    ) {
      throw new CapaCreationOperationIntegrityError(
        `Persisted CAPA operation ${operation.operation_id} has inconsistent payload data.`,
      );
    }
    if (
      (operation.status === 'pending' && operation.prevention_action_id !== null) ||
      (operation.status === 'committed' &&
        (!Number.isSafeInteger(operation.prevention_action_id) ||
          (operation.prevention_action_id ?? 0) <= 0))
    ) {
      throw new CapaCreationOperationIntegrityError(
        `Persisted CAPA operation ${operation.operation_id} has inconsistent linked CAPA state.`,
      );
    }
    if (operation.acknowledged_at && operation.status !== 'committed') {
      throw new CapaCreationOperationIntegrityError(
        `Pending CAPA operation ${operation.operation_id} cannot be acknowledged.`,
      );
    }
  }

  private async allocateCapaVisibleReference(
    operationId: string,
    preferredReference: string,
  ): Promise<string> {
    let candidate = preferredReference;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (!/^CAPA-\d{4}-\d{5}$/.test(candidate)) {
        throw new CapaCreationOperationIntegrityError(
          `CAPA operation ${operationId} has an invalid reference code.`,
        );
      }
      const actionResult = await this.db.query<{ id: number }>(
        `SELECT id FROM prevention_actions WHERE reference_code = ? LIMIT 2`,
        [candidate],
      );
      const operationResult = await this.db.query<{ operation_id: string }>(
        `SELECT operation_id FROM capa_creation_operations WHERE reference_code = ? LIMIT 2`,
        [candidate],
      );
      if (
        actionResult.rows.length === 0 &&
        (operationResult.rows.length === 0 ||
          (operationResult.rows.length === 1 &&
            operationResult.rows[0].operation_id === operationId))
      ) {
        return candidate;
      }
      candidate = this.createPreventionActionReferenceCode();
    }
    throw new CapaCreationOperationConflictError(
      `Unable to allocate an available CAPA reference code for ${operationId}.`,
    );
  }

  async reconcileCapaCreationOperation(
    userId: number,
    operationId: string,
    input: CreatePreventionActionInput,
  ): Promise<PreventionActionDetail | null> {
    await this.requireCapaCreationRole(userId, 'reconcileCapaCreationOperation');
    if (!isValidCapaOperationId(operationId)) {
      throw new CapaCreationOperationIntegrityError('CAPA operation ID is invalid.');
    }
    const normalized = this.normalizeCapaCreationPayload(input);
    const operationResult = await this.db.query<CapaCreationOperation>(
      `SELECT * FROM capa_creation_operations WHERE operation_id = ?`,
      [operationId],
    );
    if (operationResult.rows.length === 0) return null;
    if (operationResult.rows.length !== 1) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${operationId} is ambiguous.`,
      );
    }
    const operation = operationResult.rows[0];
    this.assertCapaOperationRecord(operation);
    if (operation.created_by_user_id !== userId) {
      throw new CapaCreationOperationConflictError(
        `CAPA operation ${operationId} belongs to a different creator.`,
      );
    }
    if (
      operation.payload_hash !== normalized.payloadHash ||
      operation.payload_json !== normalized.canonicalPayload
    ) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${operationId} payload differs from the persisted operation.`,
      );
    }
    if (operation.status === 'pending') return null;

    const action = await this.getPreventionActionById(
      userId,
      operation.prevention_action_id!,
    );
    if (!action) {
      throw new CapaCreationOperationIntegrityError(
        `Committed CAPA operation ${operationId} is missing its linked action.`,
      );
    }
    if (
      action.reference_code !== operation.reference_code ||
      action.created_by_user_id !== userId ||
      action.title !== normalized.payload.title ||
      action.description !== normalized.payload.description ||
      action.action_type !== normalized.payload.action_type ||
      action.contributing_factor !== normalized.payload.contributing_factor ||
      action.rationale !== normalized.payload.rationale ||
      (action.target_date ?? null) !== normalized.payload.target_date ||
      (action.surveillance_reference ?? null) !== normalized.payload.surveillance_reference
    ) {
      throw new CapaCreationOperationIntegrityError(
        `Linked CAPA action for operation ${operationId} does not match its payload.`,
      );
    }

    const auditResult = await this.db.query<AuditEvent>(
      `SELECT * FROM audit_events
       WHERE event_type = 'prevention_action_created'
         AND user_id = ?
         AND entity_type = 'prevention_action'
         AND entity_id = ?`,
      [userId, action.id],
    );
    if (auditResult.rows.length !== 1) {
      throw new PreventionActionCreationUncertainError(
        'CAPA creation audit evidence is missing or ambiguous.',
        operation.reference_code,
        operationId,
      );
    }
    const notificationResult = await this.db.query<InAppNotification>(
      `SELECT * FROM in_app_notifications
       WHERE idempotency_key = ?
         AND recipient_user_id = ?
         AND event_type = 'capa_created'
         AND entity_type = 'prevention_action'
         AND entity_id = ?
         AND entity_reference = ?`,
      [
        `notif:capa_created:prevention_action:${action.id}:${userId}`,
        userId,
        action.id,
        operation.reference_code,
      ],
    );
    if (notificationResult.rows.length !== 1) {
      throw new PreventionActionCreationUncertainError(
        'CAPA creation notification evidence is missing or ambiguous.',
        operation.reference_code,
        operationId,
      );
    }
    return action;
  }

  async listPendingCapaCreationOperations(
    userId: number,
  ): Promise<CapaCreationOperation[]> {
    await this.requireCapaCreationRole(userId, 'listPendingCapaCreationOperations');
    const result = await this.db.query<CapaCreationOperation>(
      `SELECT * FROM capa_creation_operations
       WHERE created_by_user_id = ? AND status = 'pending'
       ORDER BY created_at ASC, operation_id ASC`,
      [userId],
    );
    if (result.rows.length > 1) {
      throw new CapaCreationOperationIntegrityError(
        `Multiple pending CAPA operations exist for creator ${userId}.`,
      );
    }
    for (const operation of result.rows) this.assertCapaOperationRecord(operation);
    return result.rows;
  }

  async listUnacknowledgedCommittedCapaCreationOperations(
    userId: number,
  ): Promise<CapaCreationOperation[]> {
    await this.requireCapaCreationRole(
      userId,
      'listUnacknowledgedCommittedCapaCreationOperations',
    );
    const result = await this.db.query<CapaCreationOperation>(
      `SELECT * FROM capa_creation_operations
       WHERE created_by_user_id = ?
         AND status = 'committed'
         AND acknowledged_at IS NULL
       ORDER BY updated_at ASC, operation_id ASC`,
      [userId],
    );
    for (const operation of result.rows) {
      this.assertCapaOperationRecord(operation);
      const input = JSON.parse(operation.payload_json) as CreatePreventionActionInput;
      await this.reconcileCapaCreationOperation(userId, operation.operation_id, input);
    }
    return result.rows;
  }

  async getCapaCreationOperation(
    userId: number,
    operationId: string,
  ): Promise<CapaCreationOperation | null> {
    await this.requireCapaCreationRole(userId, 'getCapaCreationOperation');
    if (!isValidCapaOperationId(operationId)) {
      throw new CapaCreationOperationIntegrityError('CAPA operation ID is invalid.');
    }
    const result = await this.db.query<CapaCreationOperation>(
      `SELECT * FROM capa_creation_operations WHERE operation_id = ?`,
      [operationId],
    );
    if (result.rows.length === 0) return null;
    if (result.rows.length !== 1) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${operationId} is ambiguous.`,
      );
    }
    const operation = result.rows[0];
    this.assertCapaOperationRecord(operation);
    if (operation.created_by_user_id !== userId) {
      throw new CapaCreationOperationConflictError(
        `CAPA operation ${operationId} belongs to a different creator.`,
      );
    }
    if (operation.status === 'committed') {
      const input = JSON.parse(operation.payload_json) as CreatePreventionActionInput;
      const reconciled = await this.reconcileCapaCreationOperation(
        userId,
        operationId,
        input,
      );
      if (!reconciled) {
        throw new CapaCreationOperationIntegrityError(
          `Committed CAPA operation ${operationId} could not be reconciled.`,
        );
      }
    }
    return operation;
  }

  async acknowledgeCapaCreationOperation(
    userId: number,
    operationId: string,
  ): Promise<CapaCreationOperation> {
    await this.requireCapaCreationRole(userId, 'acknowledgeCapaCreationOperation');
    const operation = await this.getCapaCreationOperation(userId, operationId);
    if (!operation || operation.status !== 'committed') {
      throw new CapaCreationOperationIntegrityError(
        `Only a committed CAPA operation may be acknowledged.`,
      );
    }
    const input = JSON.parse(operation.payload_json) as CreatePreventionActionInput;
    const reconciled = await this.reconcileCapaCreationOperation(
      userId,
      operationId,
      input,
    );
    if (!reconciled) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${operationId} could not be reconciled before acknowledgement.`,
      );
    }
    if (!operation.acknowledged_at) {
      await this.db.execute(
        `UPDATE capa_creation_operations
         SET acknowledged_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
             updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
         WHERE operation_id = ?
           AND created_by_user_id = ?
           AND status = 'committed'
           AND prevention_action_id = ?
           AND acknowledged_at IS NULL`,
        [operationId, userId, reconciled.id],
      );
    }
    const updated = await this.getCapaCreationOperation(userId, operationId);
    if (!updated?.acknowledged_at) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${operationId} acknowledgement was not persisted.`,
      );
    }
    return updated;
  }

  async reserveCapaCreationOperation(
    userId: number,
    input: CreatePreventionActionInput,
    operationId: string,
    preferredReference: string | undefined,
    intent: 'new' | 'retry',
  ): Promise<CapaCreationOperation> {
    await this.requireCapaCreationRole(userId, 'reserveCapaCreationOperation');
    if (intent !== 'new' && intent !== 'retry') {
      throw new CapaCreationOperationIntegrityError(
        'A reservation intent of new or retry is required.',
      );
    }
    const exactOperationId = operationId?.trim();
    if (!exactOperationId || !isValidCapaOperationId(exactOperationId)) {
      throw new CapaCreationOperationIntegrityError('CAPA operation ID is invalid.');
    }
    const normalized = this.normalizeCapaCreationPayload(input);
    const existingResult = await this.db.query<CapaCreationOperation>(
      `SELECT * FROM capa_creation_operations WHERE operation_id = ?`,
      [exactOperationId],
    );
    if (existingResult.rows.length > 1) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${exactOperationId} is ambiguous.`,
      );
    }
    if (existingResult.rows.length === 1) {
      const existing = existingResult.rows[0];
      this.assertCapaOperationRecord(existing);
      if (intent === 'new') throw new CapaOperationIdCollisionError(exactOperationId);
      if (existing.created_by_user_id !== userId) {
        throw new CapaCreationOperationConflictError(
          `CAPA operation ${exactOperationId} belongs to a different creator.`,
        );
      }
      if (
        existing.payload_hash !== normalized.payloadHash ||
        existing.payload_json !== normalized.canonicalPayload
      ) {
        throw new CapaCreationOperationIntegrityError(
          `CAPA operation ${exactOperationId} payload differs from the persisted operation.`,
        );
      }
      if (existing.status === 'committed') {
        await this.reconcileCapaCreationOperation(userId, exactOperationId, input);
        return existing;
      }
      const availableReference = await this.allocateCapaVisibleReference(
        exactOperationId,
        existing.reference_code,
      );
      if (availableReference !== existing.reference_code) {
        await this.db.execute(
          `UPDATE capa_creation_operations
           SET reference_code = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
           WHERE operation_id = ? AND status = 'pending'`,
          [availableReference, exactOperationId],
        );
      }
      return (await this.getCapaCreationOperation(userId, exactOperationId))!;
    }
    if (intent === 'retry') {
      throw new CapaCreationOperationIntegrityError(
        `Retry requires an existing CAPA operation ${exactOperationId}.`,
      );
    }

    const pendingResult = await this.db.query<CapaCreationOperation>(
      `SELECT * FROM capa_creation_operations
       WHERE created_by_user_id = ? AND status = 'pending'
       LIMIT 2`,
      [userId],
    );
    if (pendingResult.rows.length > 0) {
      throw new CapaCreationOperationConflictError(
        `A different pending CAPA operation already exists for creator ${userId}.`,
      );
    }
    const initialReference =
      preferredReference || this.createPreventionActionReferenceCode();
    let availableReference = await this.allocateCapaVisibleReference(
      exactOperationId,
      initialReference,
    );
    for (let attempt = 0; attempt < 5; attempt++) {
      const now = new Date().toISOString();
      try {
        await this.db.execute(
          `INSERT INTO capa_creation_operations
           (operation_id, created_by_user_id, payload_json, payload_hash,
            reference_code, status, prevention_action_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'pending', NULL, ?, ?)`,
          [
            exactOperationId,
            userId,
            normalized.canonicalPayload,
            normalized.payloadHash,
            availableReference,
            now,
            now,
          ],
        );
        return (await this.getCapaCreationOperation(userId, exactOperationId))!;
      } catch (error) {
        const afterInsert = await this.db.query<CapaCreationOperation>(
          `SELECT * FROM capa_creation_operations WHERE operation_id = ?`,
          [exactOperationId],
        );
        if (afterInsert.rows.length > 0) {
          if (intent === 'new') throw new CapaOperationIdCollisionError(exactOperationId);
          throw new CapaCreationOperationIntegrityError(
            `Retry operation ${exactOperationId} appeared during reservation.`,
          );
        }
        if (isPendingOperationConstraintError(error)) {
          throw new CapaCreationOperationConflictError(
            `A different pending CAPA operation already exists for creator ${userId}.`,
          );
        }
        if (!isCapaReferenceConstraintError(error)) throw error;
        if (attempt === 4) {
          throw new CapaCreationOperationConflictError(
            `Unable to allocate an available CAPA reference code for ${exactOperationId}.`,
          );
        }
        availableReference = await this.allocateCapaVisibleReference(
          exactOperationId,
          this.createPreventionActionReferenceCode(),
        );
      }
    }
    throw new CapaCreationOperationConflictError(
      `Unable to reserve CAPA operation ${exactOperationId}.`,
    );
  }

  async reconcilePreventionActionCreation(
    userId: number,
    input: CreatePreventionActionInput,
    referenceCode: string,
  ): Promise<PreventionActionDetail | null> {
    await this.requireCapaCreationRole(userId, 'reconcilePreventionActionCreation');
    const existing = await this.db.query<PreventionAction>(
      `SELECT * FROM prevention_actions WHERE reference_code = ? LIMIT 2`,
      [referenceCode],
    );
    if (existing.rows.length === 0) return null;
    if (existing.rows.length !== 1) {
      throw new PreventionActionCreationUncertainError(
        'Legacy CAPA reference is ambiguous.',
        referenceCode,
      );
    }
    const action = existing.rows[0];
    const linkedOperation = await this.db.query<{ operation_id: string }>(
      `SELECT operation_id FROM capa_creation_operations
       WHERE prevention_action_id = ? OR reference_code = ?`,
      [action.id, referenceCode],
    );
    if (linkedOperation.rows.length > 0 || action.created_by_user_id !== userId) {
      throw new PreventionActionCreationUncertainError(
        'Reference-only reconciliation cannot establish durable operation identity.',
        referenceCode,
      );
    }
    const normalized = this.normalizeCapaCreationPayload(input);
    if (
      action.title !== normalized.payload.title ||
      action.description !== normalized.payload.description ||
      action.action_type !== normalized.payload.action_type ||
      action.contributing_factor !== normalized.payload.contributing_factor ||
      action.rationale !== normalized.payload.rationale ||
      (action.target_date ?? null) !== normalized.payload.target_date ||
      (action.surveillance_reference ?? null) !== normalized.payload.surveillance_reference
    ) {
      return null;
    }
    return this.getPreventionActionById(userId, action.id);
  }

  async createPreventionActionForOperation(
    userId: number,
    input: CreatePreventionActionInput,
    operationId: string,
    explicitReferenceCode: string | null | undefined,
    intent: 'new' | 'retry',
  ): Promise<PreventionActionDetail> {
    await this.requireCapaCreationRole(userId, 'createPreventionActionForOperation');
    if (intent !== 'new' && intent !== 'retry') {
      throw new CapaCreationOperationIntegrityError(
        'A creation intent of new or retry is required.',
      );
    }
    if (!isValidCapaOperationId(operationId)) {
      throw new CapaCreationOperationIntegrityError('CAPA operation ID is invalid.');
    }
    const normalized = this.normalizeCapaCreationPayload(input);
    const operationResult = await this.db.query<CapaCreationOperation>(
      `SELECT * FROM capa_creation_operations WHERE operation_id = ?`,
      [operationId],
    );
    if (operationResult.rows.length !== 1) {
      throw new CapaCreationOperationIntegrityError(
        `Stage B requires exactly one existing CAPA reservation for operation ${operationId}.`,
      );
    }
    const operation = operationResult.rows[0];
    this.assertCapaOperationRecord(operation);
    if (operation.created_by_user_id !== userId) {
      throw new CapaCreationOperationConflictError(
        `CAPA operation ${operationId} belongs to a different creator.`,
      );
    }
    if (
      operation.payload_hash !== normalized.payloadHash ||
      operation.payload_json !== normalized.canonicalPayload
    ) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${operationId} payload differs from the persisted reservation.`,
      );
    }
    if (
      explicitReferenceCode != null &&
      explicitReferenceCode !== operation.reference_code
    ) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${operationId} reference differs from the persisted reservation.`,
      );
    }
    if (operation.status === 'committed') {
      const reconciled = await this.reconcileCapaCreationOperation(
        userId,
        operation.operation_id,
        input,
      );
      if (!reconciled) {
        throw new PreventionActionCreationUncertainError(
          'Committed CAPA operation could not be reconciled.',
          operation.reference_code,
          operation.operation_id,
        );
      }
      return reconciled;
    }
    if (operation.status !== 'pending' || operation.prevention_action_id !== null) {
      throw new CapaCreationOperationIntegrityError(
        `CAPA operation ${operationId} is not a valid pending reservation.`,
      );
    }
    return this.commitCapaCreationOperation(
      userId,
      input,
      normalized,
      operation,
    );
  }

  private async commitCapaCreationOperation(
    userId: number,
    input: CreatePreventionActionInput,
    normalized: {
      payload: CapaPayloadForHash;
      canonicalPayload: string;
      payloadHash: string;
    },
    operation: CapaCreationOperation,
  ): Promise<PreventionActionDetail> {
    const referenceCode = await this.allocateCapaVisibleReference(
      operation.operation_id,
      operation.reference_code,
    );
    if (referenceCode !== operation.reference_code) {
      await this.db.execute(
        `UPDATE capa_creation_operations
         SET reference_code = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
         WHERE operation_id = ? AND status = 'pending'`,
        [referenceCode, operation.operation_id],
      );
      operation.reference_code = referenceCode;
    }
    const now = new Date().toISOString();
    let transactionBodyCompleted = false;
    let actionId = 0;
    try {
      actionId = await this.db.transaction(async tx => {
        const creatorResult = await tx.query<DemoUser>(
          `SELECT * FROM demo_users WHERE id = ?`,
          [userId],
        );
        if (
          creatorResult.rows.length !== 1 ||
          creatorResult.rows[0].role !== 'quality_staff'
        ) {
          throw new CapaCreationOperationConflictError(
            'CAPA creator is no longer authorized to create prevention actions.',
          );
        }
        const operationResult = await tx.query<CapaCreationOperation>(
          `SELECT * FROM capa_creation_operations WHERE operation_id = ?`,
          [operation.operation_id],
        );
        if (operationResult.rows.length !== 1) {
          throw new CapaCreationOperationIntegrityError(
            `Pending CAPA operation ${operation.operation_id} is missing or ambiguous.`,
          );
        }
        const persisted = operationResult.rows[0];
        this.assertCapaOperationRecord(persisted);
        if (
          persisted.status !== 'pending' ||
          persisted.created_by_user_id !== userId ||
          persisted.payload_hash !== normalized.payloadHash ||
          persisted.payload_json !== normalized.canonicalPayload ||
          persisted.reference_code !== operation.reference_code
        ) {
          throw new CapaCreationOperationIntegrityError(
            `Pending CAPA operation ${operation.operation_id} changed before commit.`,
          );
        }
        const createResult = await tx.execute(
          `INSERT INTO prevention_actions
             (reference_code, title, description, action_type, contributing_factor,
              rationale, surveillance_reference, status, target_date, created_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?)`,
          [
            persisted.reference_code,
            normalized.payload.title,
            normalized.payload.description,
            normalized.payload.action_type,
            normalized.payload.contributing_factor,
            normalized.payload.rationale,
            normalized.payload.surveillance_reference,
            normalized.payload.target_date,
            userId,
          ],
        );
        if (
          typeof createResult.insertId !== 'number' ||
          !Number.isSafeInteger(createResult.insertId) ||
          createResult.insertId <= 0
        ) {
          throw new Error('createPreventionAction: SQLite did not return a valid inserted ID');
        }
        const createdId = createResult.insertId;
        await tx.execute(
          `INSERT INTO audit_events
           (event_type, user_id, entity_type, entity_id, description, occurred_at)
           VALUES ('prevention_action_created', ?, 'prevention_action', ?, ?, ?)`,
          [
            userId,
            createdId,
            `Création de la mesure de prévention: ${persisted.reference_code} (${normalized.payload.title})`,
            now,
          ],
        );
        await this.insertNotification(
          {
            recipient_user_id: userId,
            event_type: 'capa_created',
            title_key: 'notification.capaCreated.title',
            message_key: 'notification.capaCreated.message',
            entity_type: 'prevention_action',
            entity_id: createdId,
            entity_reference: persisted.reference_code,
            idempotency_key: `notif:capa_created:prevention_action:${createdId}:${userId}`,
          },
          tx,
        );
        const updateResult = await tx.execute(
          `UPDATE capa_creation_operations
           SET status = 'committed', prevention_action_id = ?, updated_at = ?
           WHERE operation_id = ? AND created_by_user_id = ?
             AND status = 'pending' AND prevention_action_id IS NULL`,
          [createdId, now, operation.operation_id, userId],
        );
        if (updateResult.rowsAffected !== 1) {
          throw new CapaCreationOperationIntegrityError(
            `CAPA operation ${operation.operation_id} could not be linked to its action.`,
          );
        }
        transactionBodyCompleted = true;
        return createdId;
      });
    } catch (error) {
      if (transactionBodyCompleted) {
        try {
          const reconciled = await this.reconcileCapaCreationOperation(
            userId,
            operation.operation_id,
            input,
          );
          if (reconciled) return reconciled;
        } catch (reconciliationError) {
          if (
            reconciliationError instanceof CapaCreationOperationConflictError ||
            reconciliationError instanceof CapaCreationOperationIntegrityError
          ) {
            throw reconciliationError;
          }
        }
        throw new PreventionActionCreationUncertainError(
          'CAPA transaction outcome is uncertain; reconcile the same operation before retrying.',
          operation.reference_code,
          operation.operation_id,
        );
      }
      if (isCapaReferenceConstraintError(error)) {
        const replacement = await this.allocateCapaVisibleReference(
          operation.operation_id,
          this.createPreventionActionReferenceCode(),
        );
        await this.db.execute(
          `UPDATE capa_creation_operations
           SET reference_code = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
           WHERE operation_id = ? AND created_by_user_id = ? AND status = 'pending'`,
          [replacement, operation.operation_id, userId],
        );
        operation.reference_code = replacement;
        return this.commitCapaCreationOperation(
          userId,
          input,
          normalized,
          operation,
        );
      }
      throw error;
    }

    try {
      const reconciled = await this.reconcileCapaCreationOperation(
        userId,
        operation.operation_id,
        input,
      );
      if (!reconciled || reconciled.id !== actionId) {
        throw new PreventionActionCreationUncertainError(
          'CAPA committed but exact operation readback did not match.',
          operation.reference_code,
          operation.operation_id,
        );
      }
      return reconciled;
    } catch (error) {
      if (
        error instanceof CapaCreationOperationConflictError ||
        error instanceof CapaCreationOperationIntegrityError ||
        error instanceof PreventionActionCreationUncertainError
      ) {
        throw error;
      }
      throw new PreventionActionCreationUncertainError(
        'CAPA committed but exact operation readback failed.',
        operation.reference_code,
        operation.operation_id,
      );
    }
  }

  /**
   * Transitions a prevention action to a new lifecycle status.
   *
   * STRICT BOUNDARY:
   * Only `quality_staff` is authorized to change status.
   */
  async updatePreventionActionStatus(
    userId: number,
    actionId: number,
    newStatus: PreventionActionStatus,
    completionNotes?: string,
  ): Promise<PreventionActionDetail> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`updatePreventionActionStatus: user ${userId} not found`);
    }
    const user = userResult.rows[0];
    if (user.role !== 'quality_staff') {
      throw new Error(
        `UnauthorizedError: role '${user.role}' is not permitted to update prevention actions. ` +
          `Only quality_staff may manage prevention actions.`,
      );
    }

    const actionResult = await this.db.query<PreventionAction>(
      `SELECT * FROM prevention_actions WHERE id = ?`,
      [actionId],
    );
    if (actionResult.rows.length === 0) {
      throw new Error(`updatePreventionActionStatus: prevention action ${actionId} not found`);
    }
    const action = actionResult.rows[0];

    if (!isValidPreventionTransition(action.status, newStatus)) {
      throw new Error(
        `Invalid transition from '${action.status}' to '${newStatus}' for prevention action ${actionId}. ` +
          `Allowed transitions: [${VALID_PREVENTION_TRANSITIONS[action.status].join(', ')}]`,
      );
    }

    let completedAt: string | null = action.completed_at ?? null;
    let notes: string | null = action.completion_notes ?? null;

    if (newStatus === 'completed') {
      const trimmedNotes = completionNotes?.trim();
      if (!trimmedNotes || trimmedNotes.length < 3) {
        throw new Error('updatePreventionActionStatus: completion note must be at least 3 characters when completing an action');
      }
      notes = trimmedNotes;
      completedAt = new Date().toISOString();
    } else if (newStatus === 'cancelled') {
      if (completionNotes && completionNotes.trim().length > 0) {
        notes = completionNotes.trim();
      }
    }

    const now = new Date().toISOString();
    await this.db.transaction(async tx => {
      await tx.execute(
        `UPDATE prevention_actions
         SET status = ?, completed_at = ?, completion_notes = ?,
             updated_at = ?
         WHERE id = ?`,
        [newStatus, completedAt, notes, now, actionId],
      );

      // Inlined atomic audit event
      await tx.execute(
        `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
         VALUES ('prevention_status_changed', ?, 'prevention_action', ?, ?, ?)`,
        [
          userId,
          actionId,
          `Statut de la mesure ${action.reference_code} modifié: ${action.status} -> ${newStatus}`,
          now,
        ],
      );

      const isFinalized = newStatus === 'completed' || newStatus === 'cancelled';
      const eventType: NotificationEventType = isFinalized
        ? 'capa_finalized'
        : 'capa_status_changed';
      const titleKey = isFinalized
        ? 'notification.capaFinalized.title'
        : 'notification.capaStatusChanged.title';
      const messageKey = isFinalized
        ? 'notification.capaFinalized.message'
        : 'notification.capaStatusChanged.message';
      const idempotencyKey = `notif:${eventType}:prevention_action:${actionId}:${userId}:${newStatus}`;

      await this.insertNotification(
        {
          recipient_user_id: userId,
          event_type: eventType,
          title_key: titleKey,
          message_key: messageKey,
          entity_type: 'prevention_action',
          entity_id: actionId,
          entity_reference: action.reference_code,
          idempotency_key: idempotencyKey,
        },
        tx,
      );
    });

    const updated = await this.getPreventionActionById(userId, actionId);
    return updated!;
  }

  /**
   * Retrieves the prevention action register with optional filters.
   *
   * STRICT BOUNDARY:
   * Accessible by quality_staff, admin_reviewer, and oh_professional.
   * Prohibited for exposed_professional and tech_admin.
   */
  async listPreventionActions(
    userId: number,
    filters?: PreventionActionFilters,
  ): Promise<PreventionAction[]> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`listPreventionActions: user ${userId} not found`);
    }
    const user = userResult.rows[0];
    if (
      user.role !== 'quality_staff' &&
      user.role !== 'admin_reviewer' &&
      user.role !== 'oh_professional'
    ) {
      throw new Error(
        `UnauthorizedError: role '${user.role}' is strictly prohibited from accessing the prevention action register.`,
      );
    }

    let sql = `SELECT * FROM prevention_actions WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status) {
      sql += ` AND status = ?`;
      params.push(filters.status);
    }
    if (filters?.action_type) {
      sql += ` AND action_type = ?`;
      params.push(filters.action_type);
    }
    if (filters?.contributing_factor) {
      sql += ` AND contributing_factor = ?`;
      params.push(filters.contributing_factor);
    }

    sql += ` ORDER BY created_at DESC, id DESC`;

    const result = await this.db.query<PreventionAction>(sql, params);
    return result.rows.map(r => ({
      ...r,
      target_date: r.target_date ?? null,
      completed_at: r.completed_at ?? null,
      completion_notes: r.completion_notes ?? null,
      surveillance_reference: r.surveillance_reference ?? null,
    }));
  }

  /**
   * Retrieves a single prevention action with its audit history.
   *
   * STRICT BOUNDARY:
   * Accessible by quality_staff, admin_reviewer, and oh_professional.
   * Prohibited for exposed_professional and tech_admin.
   */
  async getPreventionActionById(
    userId: number,
    actionId: number,
  ): Promise<PreventionActionDetail | null> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`getPreventionActionById: user ${userId} not found`);
    }
    const user = userResult.rows[0];
    if (
      user.role !== 'quality_staff' &&
      user.role !== 'admin_reviewer' &&
      user.role !== 'oh_professional'
    ) {
      throw new Error(
        `UnauthorizedError: role '${user.role}' is strictly prohibited from accessing prevention action details.`,
      );
    }

    const actionResult = await this.db.query<PreventionAction>(
      `SELECT * FROM prevention_actions WHERE id = ?`,
      [actionId],
    );
    if (actionResult.rows.length === 0) {
      return null;
    }

    const auditResult = await this.db.query<AuditEvent>(
      `SELECT * FROM audit_events
       WHERE entity_type = 'prevention_action' AND entity_id = ?
       ORDER BY occurred_at ASC, id ASC`,
      [actionId],
    );

    const raw = actionResult.rows[0];
    return {
      ...raw,
      target_date: raw.target_date ?? null,
      completed_at: raw.completed_at ?? null,
      completion_notes: raw.completion_notes ?? null,
      surveillance_reference: raw.surveillance_reference ?? null,
      audit_history: auditResult.rows,
    };
  }

  /**
   * Computes aggregate counts for the prevention overview.
   *
   * STRICT BOUNDARY:
   * Accessible by quality_staff, admin_reviewer, and oh_professional.
   * Prohibited for exposed_professional and tech_admin.
   */
  async getPreventionOverview(userId: number): Promise<PreventionOverview> {
    const actions = await this.listPreventionActions(userId);

    let proposed = 0;
    let in_progress = 0;
    let completed = 0;
    let cancelled = 0;

    for (const a of actions) {
      if (a.status === 'proposed') proposed++;
      else if (a.status === 'in_progress') in_progress++;
      else if (a.status === 'completed') completed++;
      else if (a.status === 'cancelled') cancelled++;
    }

    return {
      total: actions.length,
      proposed,
      in_progress,
      completed,
      cancelled,
    };
  }

  // ────────────────────────────────────────────────────────────
  //  Phase 2D.2: In-App Notification System Repository Methods
  // ────────────────────────────────────────────────────────────

  /**
   * Helper to resolve the recipient user ID for a role dynamically from demo_users.
   * Uses deterministic selection rule: ORDER BY id ASC LIMIT 1.
   * Throws RecipientResolutionError if no active user with the role exists.
   * Prohibits tech_admin from receiving operational notifications.
   */
  async getRecipientUserIdByRole(
    role: AesGuardianRole,
    executor?: { query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }> },
  ): Promise<number> {
    if (role === 'tech_admin') {
      throw new Error("Unauthorized: operational notifications cannot be addressed to 'tech_admin'.");
    }
    const exec = executor ?? this.db;

    const result = await exec.query<DemoUser>(
      `SELECT id, role FROM demo_users WHERE role = ? ORDER BY id ASC LIMIT 1`,
      [role],
    );
    if (result.rows.length === 0) {
      throw new Error(
        `RecipientResolutionError: No active user found with required role '${role}'. Cannot deliver workflow notification.`,
      );
    }
    return result.rows[0].id;
  }

  /**
   * Internal notification creation primitive used by workflow transactions and seeding.
   *
   * SAFE IDEMPOTENCY STRATEGY:
   * Uses `ON CONFLICT(idempotency_key) DO NOTHING` to gracefully handle duplicate events
   * without suppressing schema constraint violations (CHECK constraints, NOT NULL, FOREIGN KEY).
   *
   * STRICT BOUNDARY:
   * tech_admin is strictly prohibited from receiving operational notifications.
   */
  async insertNotification(
    input: CreateNotificationInput,
    executor?: {
      execute: (sql: string, params?: unknown[]) => Promise<MutationResult>;
      query?: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
    },
  ): Promise<MutationResult> {
    let user: DemoUser | null = null;
    if (executor && typeof executor.query === 'function') {
      const res = await executor.query<DemoUser>(
        `SELECT id, role, display_name FROM demo_users WHERE id = ?`,
        [input.recipient_user_id],
      );
      user = res.rows[0] ?? null;
    } else {
      user = await this.getDemoUser(input.recipient_user_id);
    }
    if (!user) {
      throw new Error(`insertNotification: recipient user ${input.recipient_user_id} not found`);
    }
    if (user.role === 'tech_admin') {
      throw new Error('Unauthorized: operational notifications cannot be created for tech_admin');
    }
    if (!NOTIFICATION_EVENT_TYPES.includes(input.event_type)) {
      throw new Error(`insertNotification: invalid event_type '${input.event_type}'`);
    }
    if (!NOTIFICATION_ENTITY_TYPES.includes(input.entity_type)) {
      throw new Error(`insertNotification: invalid entity_type '${input.entity_type}'`);
    }
    const expectedRole = EVENT_RECIPIENT_ROLE[input.event_type];
    if (user.role !== expectedRole) {
      throw new Error(
        `insertNotification: recipient user ${input.recipient_user_id} has role '${user.role}', but event '${input.event_type}' requires role '${expectedRole}'.`,
      );
    }

    const exec = executor ?? this.db;
    return exec.execute(
      `INSERT INTO in_app_notifications (
         recipient_user_id, event_type, title_key, message_key,
         entity_type, entity_id, entity_reference, idempotency_key
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(idempotency_key) DO NOTHING;`,
      [
        input.recipient_user_id,
        input.event_type,
        input.title_key,
        input.message_key,
        input.entity_type,
        input.entity_id,
        input.entity_reference ?? null,
        input.idempotency_key ?? null,
      ],
    );
  }

  /**
   * Internal database insertion primitive for notifications.
   */
  async createNotification(
    input: CreateNotificationInput,
    executor?: { execute: (sql: string, params?: unknown[]) => Promise<MutationResult> },
  ): Promise<MutationResult> {
    return this.insertNotification(input, executor);
  }

  /**
   * Retrieves notifications for a specific synthetic user, ordered newest first.
   *
   * STRICT BOUNDARY:
   * tech_admin receives an empty array.
   */
  async getNotifications(
    userId: number,
    filters?: NotificationFilters,
  ): Promise<InAppNotification[]> {
    const user = await this.getDemoUser(userId);
    if (!user || user.role === 'tech_admin') {
      return [];
    }

    let sql = `SELECT * FROM in_app_notifications WHERE recipient_user_id = ?`;
    const params: unknown[] = [userId];

    if (filters?.is_read !== undefined) {
      sql += ` AND is_read = ?`;
      params.push(typeof filters.is_read === 'boolean' ? (filters.is_read ? 1 : 0) : filters.is_read);
    }

    sql += ` ORDER BY created_at DESC`;

    if (filters?.limit !== undefined) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);
    }

    const result = await this.db.query<InAppNotification>(sql, params);
    return result.rows;
  }

  /**
   * Retrieves a single in-app notification by ID, strictly scoped to the requesting user.
   *
   * RECIPIENT DOUBLE-GUARD:
   * Enforces WHERE id = ? AND recipient_user_id = ?.
   * If the notification does not exist or belongs to another user, returns null.
   *
   * STRICT BOUNDARY:
   * tech_admin returns null.
   */
  async getNotificationById(
    notificationId: number,
    userId: number,
  ): Promise<InAppNotification | null> {
    const user = await this.getDemoUser(userId);
    if (!user || user.role === 'tech_admin') {
      return null;
    }

    const result = await this.db.query<InAppNotification>(
      `SELECT * FROM in_app_notifications WHERE id = ? AND recipient_user_id = ? LIMIT 1`,
      [notificationId, userId],
    );
    return result.rows[0] ?? null;
  }

  /**
   * Retrieves the unread notification count for a specific synthetic user.
   *
   * Uses an indexed COUNT query: WHERE recipient_user_id = ? AND is_read = 0.
   * STRICT BOUNDARY: tech_admin returns 0.
   */
  async getUnreadNotificationCount(userId: number): Promise<number> {
    const user = await this.getDemoUser(userId);
    if (!user || user.role === 'tech_admin') {
      return 0;
    }

    const result = await this.db.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM in_app_notifications WHERE recipient_user_id = ? AND is_read = 0`,
      [userId],
    );
    return result.rows[0]?.count ?? 0;
  }

  /**
   * Marks a single notification as read.
   *
   * RECIPIENT DOUBLE-GUARD:
   * Enforces WHERE id = ? AND recipient_user_id = ? AND is_read = 0.
   * Cross-user mutation is completely prevented.
   * STRICT BOUNDARY: tech_admin cannot mark notifications read.
   */
  async markNotificationRead(
    notificationId: number,
    userId: number,
  ): Promise<MutationResult> {
    const user = await this.getDemoUser(userId);
    if (!user || user.role === 'tech_admin') {
      return { rowsAffected: 0 };
    }

    const now = new Date().toISOString();
    return this.db.execute(
      `UPDATE in_app_notifications
       SET is_read = 1, read_at = ?
       WHERE id = ? AND recipient_user_id = ? AND is_read = 0`,
      [now, notificationId, userId],
    );
  }

  /**
   * Marks all unread notifications for a specific user as read.
   *
   * STRICT BOUNDARY: tech_admin receives rowsAffected: 0.
   */
  async markAllNotificationsRead(userId: number): Promise<MutationResult> {
    const user = await this.getDemoUser(userId);
    if (!user || user.role === 'tech_admin') {
      return { rowsAffected: 0 };
    }

    const now = new Date().toISOString();
    return this.db.execute(
      `UPDATE in_app_notifications
       SET is_read = 1, read_at = ?
       WHERE recipient_user_id = ? AND is_read = 0`,
      [now, userId],
    );
  }

  // ────────────────────────────────────────────────────────────
  //  Phase 2D.2F — Navigation resolution helpers
  // ────────────────────────────────────────────────────────────

  /**
   * Retrieves a single administrative review by its primary key.
   *
   * AUTHORIZATION:
   * - tech_admin: throws Unauthorized
   * - quality_staff: throws Unauthorized
   * - oh_professional: throws Unauthorized
   * - exposed_professional: allowed only if the review's declaration belongs to them
   * - admin_reviewer: unrestricted (all reviews within system)
   *
   * Returns null if the record does not exist (or the exposed_professional does
   * not own the declaration).
   */
  async getAdministrativeReviewById(
    reviewId: number,
    requestingUserId: number,
  ): Promise<AdministrativeReview | null> {
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(
        `getAdministrativeReviewById: requesting user ${requestingUserId} not found`,
      );
    }
    if (
      user.role === 'tech_admin' ||
      user.role === 'quality_staff' ||
      user.role === 'oh_professional'
    ) {
      throw new Error(
        `Unauthorized: ${user.role} user ${requestingUserId} is prohibited from accessing administrative review records directly.`,
      );
    }

    const reviewResult = await this.db.query<AdministrativeReview>(
      `SELECT * FROM administrative_reviews WHERE id = ?`,
      [reviewId],
    );
    const review = reviewResult.rows[0] ?? null;
    if (!review) return null;

    if (user.role === 'exposed_professional') {
      const decl = await this.getDeclarationByIdInternal(review.declaration_id);
      if (!decl || decl.declared_by_user_id !== requestingUserId) {
        return null;
      }
    }

    // Attach correction response if applicable
    review.response = null;
    if (review.outcome === 'correction_requested') {
      const respResult = await this.db.query<CorrectionResponse>(
        `SELECT * FROM correction_responses WHERE review_id = ? LIMIT 1`,
        [reviewId],
      );
      review.response = respResult.rows[0] ?? null;
    }

    return review;
  }

  /**
   * Retrieves a single correction response by its primary key.
   *
   * AUTHORIZATION:
   * - tech_admin: throws Unauthorized
   * - quality_staff: throws Unauthorized
   * - oh_professional: throws Unauthorized
   * - exposed_professional: allowed only if the response's declaration belongs to them
   * - admin_reviewer: unrestricted (all correction responses within system)
   *
   * Returns null if the record does not exist or access is denied.
   */
  async getCorrectionResponseById(
    responseId: number,
    requestingUserId: number,
  ): Promise<CorrectionResponse | null> {
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(
        `getCorrectionResponseById: requesting user ${requestingUserId} not found`,
      );
    }
    if (
      user.role === 'tech_admin' ||
      user.role === 'quality_staff' ||
      user.role === 'oh_professional'
    ) {
      throw new Error(
        `Unauthorized: ${user.role} user ${requestingUserId} is prohibited from accessing correction response records directly.`,
      );
    }

    const responseResult = await this.db.query<CorrectionResponse>(
      `SELECT * FROM correction_responses WHERE id = ?`,
      [responseId],
    );
    const response = responseResult.rows[0] ?? null;
    if (!response) return null;

    if (user.role === 'exposed_professional') {
      const decl = await this.getDeclarationByIdInternal(response.declaration_id);
      if (!decl || decl.declared_by_user_id !== requestingUserId) {
        return null;
      }
    }

    return response;
  }

  /**
   * Retrieves a single OH follow-up event by its primary key, enriched with
   * coordination_id and declaration_id for navigation resolution.
   *
   * AUTHORIZATION:
   * - tech_admin: throws Unauthorized
   * - quality_staff: throws Unauthorized
   * - admin_reviewer: throws Unauthorized
   * - oh_professional: full event details (coordination_id + declaration_id)
   * - exposed_professional: minimal navigation envelope only if the
   *   coordination's declaration belongs to them
   *
   * Returns null if the record does not exist or access is denied.
   */
  async getOhFollowUpEventById(
    eventId: number,
    requestingUserId: number,
  ): Promise<
    | (OhFollowUpEvent & { declaration_id: number })
    | null
  > {
    const user = await this.getDemoUser(requestingUserId);
    if (!user) {
      throw new Error(
        `getOhFollowUpEventById: requesting user ${requestingUserId} not found`,
      );
    }
    if (
      user.role === 'tech_admin' ||
      user.role === 'quality_staff' ||
      user.role === 'admin_reviewer'
    ) {
      throw new Error(
        `Unauthorized: ${user.role} user ${requestingUserId} is prohibited from accessing OH follow-up event records directly.`,
      );
    }

    // Join to oh_coordinations to retrieve declaration_id
    const eventResult = await this.db.query<
      OhFollowUpEvent & { declaration_id: number }
    >(
      `SELECT e.*, c.declaration_id
       FROM oh_follow_up_events e
       JOIN oh_coordinations c ON c.id = e.coordination_id
       WHERE e.id = ?`,
      [eventId],
    );
    const event = eventResult.rows[0] ?? null;
    if (!event) return null;

    if (user.role === 'exposed_professional') {
      const decl = await this.getDeclarationByIdInternal(event.declaration_id);
      if (!decl || decl.declared_by_user_id !== requestingUserId) {
        return null;
      }
    }

    return event;
  }

  /**
   * Resets the synthetic demonstration dataset back to baseline.
   *
   * AUTHORIZATION:
   * Only synthetic tech_admin (userId with role === 'tech_admin') is authorized.
   * Prohibited for exposed_professional, admin_reviewer, oh_professional, quality_staff.
   *
   * ATOMICITY & FOREIGN KEY GUARANTEES:
   * Runs in an atomic SQLite transaction. PRAGMA foreign_keys remains strictly ON.
   * Deletes dependent records in topological order:
   * 1. in_app_notifications (FK -> demo_users)
   * 2. oh_follow_up_events (FK -> oh_coordinations)
   * 3. oh_coordinations (FK -> aes_declarations)
   * 4. correction_responses (FK -> administrative_reviews, aes_declarations)
   * 5. administrative_reviews (FK -> aes_declarations)
   * 6. aes_declarations (referenced by above)
   * 7. prevention_actions (FK -> demo_users)
   * 8. audit_events (operational events)
   * 9. Reseeds standard baseline scenario within the same transaction.
   * 10. Records DEMO_DATA_RESET audit event within the same transaction.
   *
   * If any step fails, the entire transaction rolls back cleanly, leaving
   * existing records untouched.
   */
  /**
   * Resolves the primary recipient user ID for a required operational role from demo_users.
   * Internal helper for demonstration scenario seeding.
   */
  private async resolveRecipientId(executor: SqlQueryExecutor, role: string): Promise<number> {
    if (role === 'tech_admin') {
      throw new Error(
        `Unauthorized: operational notifications cannot be addressed to 'tech_admin'.`,
      );
    }

    const result = await executor.query<{ id: number; role: string }>(
      `SELECT id, role FROM demo_users WHERE role = ? ORDER BY id ASC LIMIT 1`,
      [role],
    );
    if (!result.rows || result.rows.length === 0) {
      throw new Error(
        `RecipientResolutionError: No active user found with required role '${role}'. Cannot seed baseline notifications.`,
      );
    }
    return result.rows[0].id;
  }

  /**
   * Internal scenario seeding routine.
   * Encapsulated strictly as a private method — cannot be called or bypassed by external modules.
   */
  private async seedStandardScenarioInternal(executor: TransactionExecutor): Promise<SeedResult> {
    if (typeof executor.isCompleted === 'function' && executor.isCompleted()) {
      throw new Error(
        'TransactionContextError: Cannot seed scenario using a completed or rolled back transaction context.',
      );
    }

    // Resolve required operational actors dynamically by role from demo_users.
    // Fails closed if any required operational role is missing.
    const exposedUserId = await this.resolveRecipientId(executor, 'exposed_professional');
    const adminUserId = await this.resolveRecipientId(executor, 'admin_reviewer');
    const ohUserId = await this.resolveRecipientId(executor, 'oh_professional');
    const qualityUserId = await this.resolveRecipientId(executor, 'quality_staff');

    // Check if demonstration scenario declarations already exist
    const existingDecl = await executor.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM aes_declarations WHERE reference_number LIKE 'AES-2026-DEMO-%'`,
    );

    const declCount = existingDecl.rows[0]?.count ?? 0;

    if (declCount < 4) {
      // ────────────────────────────────────────────────────────────────────────
      // 1. Declaration 1: Newly submitted percutaneous incident
      // ────────────────────────────────────────────────────────────────────────
      const res1 = await executor.execute(
        `INSERT OR IGNORE INTO aes_declarations (
           reference_number, declared_by_user_id, incident_date, incident_type,
           circumstances, exposure_description, protective_measures_taken,
           department_code, notes, status, submitted_at, created_at, updated_at
         ) VALUES (
           'AES-2026-DEMO-01', ?, '2026-11-10', 'percutaneous_exposure',
           'Piqûre accidentelle lors du recapuchonnage d''une aiguille usagée après prélèvement veineux.',
           'Aiguille creuse de calibre 21G souillée de sang veineux. Perforation du gant en latex.',
           'Gants simples en latex portés. Collecteur pour objets piquants/tranchants situé à distance.',
           'MED-INT', 'Déclaration immédiate transmise pour examen administratif.',
           'submitted', '2026-11-10T09:15:00Z', '2026-11-10T09:10:00Z', '2026-11-10T09:15:00Z'
         )`,
        [exposedUserId],
      );

      const decl1Id = res1.insertId ?? (await executor.query<{ id: number }>(
        `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-01'`,
      )).rows[0]?.id;

      if (decl1Id) {
        await executor.execute(
          `INSERT OR IGNORE INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
           VALUES ('declaration_submitted', ?, 'aes_declaration', ?, 'Déclaration AES-2026-DEMO-01 soumise par le professionnel', '2026-11-10T09:15:00Z')`,
          [exposedUserId, decl1Id],
        );
      }

      // ────────────────────────────────────────────────────────────────────────
      // 2. Declaration 2: Splash exposure with correction requested
      // ────────────────────────────────────────────────────────────────────────
      const res2 = await executor.execute(
        `INSERT OR IGNORE INTO aes_declarations (
           reference_number, declared_by_user_id, incident_date, incident_type,
           circumstances, exposure_description, protective_measures_taken,
           department_code, notes, status, submitted_at, created_at, updated_at
         ) VALUES (
           'AES-2026-DEMO-02', ?, '2026-11-11', 'mucocutaneous_exposure',
           'Projection oculaire de liquide biologique lors d''une aspiration chez un patient agité en réanimation.',
           'Projection au niveau de l''œil droit sans barrière de protection faciale.',
           'Masque chirurgical et gants portés. Absence de lunettes de protection.',
           'REA-01', 'Attente de précisions suite à revue administrative.',
           'correction_requested', '2026-11-11T14:30:00Z', '2026-11-11T14:20:00Z', '2026-11-11T16:00:00Z'
         )`,
        [exposedUserId],
      );

      const decl2Id = res2.insertId ?? (await executor.query<{ id: number }>(
        `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-02'`,
      )).rows[0]?.id;

      if (decl2Id) {
        await executor.execute(
          `INSERT OR IGNORE INTO administrative_reviews (
              declaration_id, reviewer_user_id, outcome, comments, correction_reason, reviewed_at, created_at
            ) VALUES (
              ?, ?, 'correction_requested',
              'Examen administratif initial : rinçage non précisé.',
              'Veuillez préciser le délai effectif du rinçage oculaire immédiat au sérum physiologique et les mesures prises sur place.',
              '2026-11-11T16:00:00Z', '2026-11-11T16:00:00Z'
            )`,
          [decl2Id, adminUserId],
        );

        await executor.execute(
          `INSERT OR IGNORE INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
           VALUES ('review_recorded', ?, 'aes_declaration', ?, 'Revue administrative enregistrée: correction demandée', '2026-11-11T16:00:00Z')`,
          [adminUserId, decl2Id],
        );
      }

      // ────────────────────────────────────────────────────────────────────────
      // 3. Declaration 3: Incident under review + Active SST Coordination
      // ────────────────────────────────────────────────────────────────────────
      const res3 = await executor.execute(
        `INSERT OR IGNORE INTO aes_declarations (
           reference_number, declared_by_user_id, incident_date, incident_type,
           circumstances, exposure_description, protective_measures_taken,
           department_code, notes, status, submitted_at, created_at, updated_at
         ) VALUES (
           'AES-2026-DEMO-03', ?, '2026-11-05', 'percutaneous_exposure',
           'Blessure avec trocart de perfusion lors d''une pose de voie veineuse périphérique en urgence.',
           'Perforation face palmaire de l''index gauche avec trocart souillé.',
           'Gants en latex.',
           'URG-02', 'Dossier transmis au service de Santé au Travail pour prise en charge.',
           'under_review', '2026-11-05T08:45:00Z', '2026-11-05T08:30:00Z', '2026-11-05T10:30:00Z'
         )`,
        [exposedUserId],
      );

      const decl3Id = res3.insertId ?? (await executor.query<{ id: number }>(
        `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-03'`,
      )).rows[0]?.id;

      if (decl3Id) {
        await executor.execute(
          `INSERT OR IGNORE INTO administrative_reviews (
              declaration_id, reviewer_user_id, outcome, comments, reviewed_at, created_at
            ) VALUES (
              ?, ?, 'acknowledged',
              'Déclaration administrativement recevable. Transmission SST initiée.',
              '2026-11-05T09:30:00Z', '2026-11-05T09:30:00Z'
            )`,
          [decl3Id, adminUserId],
        );

        const coordRes = await executor.execute(
          `INSERT OR IGNORE INTO oh_coordinations (
              declaration_id, created_by_user_id, coordination_reason, status,
              acknowledged_by_user_id, acknowledged_at, created_at, updated_at
            ) VALUES (
              ?, ?, 'specialized_evaluation', 'acknowledged',
              ?, '2026-11-05T10:30:00Z', '2026-11-05T09:35:00Z', '2026-11-05T10:30:00Z'
            )`,
          [decl3Id, adminUserId, ohUserId],
        );

        const coordId = coordRes.insertId ?? (await executor.query<{ id: number }>(
          `SELECT id FROM oh_coordinations WHERE declaration_id = ?`,
          [decl3Id],
        )).rows[0]?.id;

        if (coordId) {
          await executor.execute(
            `INSERT OR IGNORE INTO oh_follow_up_events (
                coordination_id, recorded_by_user_id, event_category, event_date, administrative_note, created_at
              ) VALUES
              (?, ?, 'appointment_coordinated', '2026-11-05T11:00:00Z', 'Bilan sérologique initial réalisé à H+2 (VIH, VHB, VHC). Conforme au protocole.', '2026-11-05T11:00:00Z'),
              (?, ?, 'consultation_recorded', '2026-11-05T11:30:00Z', 'Consultation médicale spécialisée en Santé au Travail. Statut vaccinal vérifié.', '2026-11-05T11:30:00Z')`,
            [coordId, ohUserId, coordId, ohUserId],
          );

          await executor.execute(
            `INSERT OR IGNORE INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
              VALUES ('coordination_acknowledged', ?, 'oh_coordination', ?, 'Coordination SST prise en charge par le médecin du travail', '2026-11-05T10:30:00Z')`,
            [ohUserId, coordId],
          );
        }
      }

      // ────────────────────────────────────────────────────────────────────────
      // 4. Declaration 4: Cut exposure closed with completed SST follow-up
      // ────────────────────────────────────────────────────────────────────────
      const res4 = await executor.execute(
        `INSERT OR IGNORE INTO aes_declarations (
           reference_number, declared_by_user_id, incident_date, incident_type,
           circumstances, exposure_description, protective_measures_taken,
           department_code, notes, status, submitted_at, created_at, updated_at
         ) VALUES (
           'AES-2026-DEMO-04', ?, '2026-10-15', 'percutaneous_exposure',
           'Coupure superficielle avec une lame de bistouri lors du déballage d''un plateau d''instruments.',
           'Plaie superficielle éminence thénar main droite.',
           'Double paire de gants chirurgicaux.',
           'BLOC-CENTRAL', 'Dossier clos après suivi sérologique complet.',
           'closed', '2026-10-15T11:00:00Z', '2026-10-15T10:45:00Z', '2026-11-01T15:00:00Z'
         )`,
        [exposedUserId],
      );

      const decl4Id = res4.insertId ?? (await executor.query<{ id: number }>(
        `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-04'`,
      )).rows[0]?.id;

      if (decl4Id) {
        await executor.execute(
          `INSERT OR IGNORE INTO administrative_reviews (
              declaration_id, reviewer_user_id, outcome, comments, reviewed_at, created_at
            ) VALUES (
              ?, ?, 'acknowledged', 'Déclaration conforme. Prise en charge chirurgicale immédiate et SST.', '2026-10-15T11:30:00Z', '2026-10-15T11:30:00Z'
            )`,
          [decl4Id, adminUserId],
        );

        const coordRes4 = await executor.execute(
          `INSERT OR IGNORE INTO oh_coordinations (
              declaration_id, created_by_user_id, coordination_reason, status,
              acknowledged_by_user_id, acknowledged_at, completed_by_user_id, completed_at,
              created_at, updated_at
            ) VALUES (
              ?, ?, 'serology_monitoring', 'completed',
              ?, '2026-10-15T12:00:00Z', ?, '2026-11-01T15:00:00Z',
              '2026-10-15T11:35:00Z', '2026-11-01T15:00:00Z'
            )`,
          [decl4Id, adminUserId, ohUserId, ohUserId],
        );

        const coordId4 = coordRes4.insertId ?? (await executor.query<{ id: number }>(
          `SELECT id FROM oh_coordinations WHERE declaration_id = ?`,
          [decl4Id],
        )).rows[0]?.id;

        if (coordId4) {
          await executor.execute(
            `INSERT OR IGNORE INTO oh_follow_up_events (
                coordination_id, recorded_by_user_id, event_category, event_date, administrative_note, created_at
              ) VALUES
              (?, ?, 'appointment_coordinated', '2026-10-15T12:30:00Z', 'Prélèvement sérologique initial réalisé.', '2026-10-15T12:30:00Z'),
              (?, ?, 'consultation_recorded', '2026-11-01T14:00:00Z', 'Contrôle sérologique complet négatif.', '2026-11-01T14:00:00Z'),
              (?, ?, 'follow_up_completed', '2026-11-01T15:00:00Z', 'Clôture clinique du dossier SST.', '2026-11-01T15:00:00Z')`,
            [coordId4, ohUserId, coordId4, ohUserId, coordId4, ohUserId],
          );
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. Ensure baseline Prevention & Corrective Actions (CAPA) exist
    // ──────────────────────────────────────────────────────────────────────────
    const existingCapa = await executor.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM prevention_actions`,
    );

    const capaCount = existingCapa.rows[0]?.count ?? 0;

    if (capaCount < 5) {
      await executor.execute(
        `INSERT OR IGNORE INTO prevention_actions (
           id, reference_code, title, description, action_type,
           contributing_factor, rationale, status, created_by_user_id,
           surveillance_reference, created_at, updated_at
         ) VALUES
         (1, 'CAPA-2026-00001', 'Dotation en collecteurs de sécurité',
          'Installation de collecteurs d''aiguilles sécurisés à hauteur des yeux dans chaque box de soins.',
          'preventive', 'waste_disposal_container',
          'Observation récurrente d''accidents lors de l''élimination immédiate des aiguilles en médecine.',
          'in_progress', ?, 'SURV-2026-Q1-SHARPS', '2026-11-12T19:17:00Z', '2026-11-12T19:17:00Z'),

         (2, 'CAPA-2026-00002', 'Protocole port double paire de gants au bloc',
          'Diffusion du protocole standardisé de double gantage pour les interventions à haut risque d''exposition.',
          'corrective', 'procedure_compliance',
          'Incidence de coupures per-opératoires constatée au bloc central.',
          'in_progress', ?, 'SURV-2026-Q1-CUTS', '2026-11-12T19:17:00Z', '2026-11-12T19:17:00Z'),

         (3, 'CAPA-2026-00003', 'Mise à niveau procédure élimination seringues',
          'Rappel des bonnes pratiques d''élimination sans recapuchonnage auprès des équipes soignantes.',
          'corrective', 'training_supervision',
          'Deux piqûres évitables rapportées suite à un recapuchonnage d''aiguille.',
          'completed', ?, 'SURV-2026-Q1-SHARPS', '2026-11-12T19:17:00Z', '2026-11-12T20:00:00Z'),

         (4, 'CAPA-2026-00004', 'Installation de conteneurs sécurisés d''urgence',
          'Dotation des chariots d''urgence en boîtes rigides anti-perforation.',
          'preventive', 'waste_disposal_container',
          'Amélioration de l''accessibilité immédiate du matériel d''élimination en réanimation.',
          'completed', ?, 'SURV-2026-Q1-ERGONOMICS', '2026-11-12T20:19:47Z', '2026-11-12T20:19:47Z'),

         (5, 'CAPA-2026-00005', 'Sensibilisation au port de surblouses',
          'Session de formation sur les équipements de protection individuelle lors des gestes à risque.',
          'preventive', 'protective_equipment',
          'Prévention des projections muqueuses et cutanées.',
          'cancelled', ?, 'SURV-2026-Q1-SPLASH', '2026-11-12T20:19:47Z', '2026-11-12T20:19:47Z')`,
        [qualityUserId, qualityUserId, qualityUserId, qualityUserId, qualityUserId],
      );

      // Update completed_at and notes for completed/cancelled
      await executor.execute(
        `UPDATE prevention_actions
         SET completed_at = '2026-11-10T14:30:00Z', completion_notes = 'Formation réalisée pour 45 soignants. Procédure validée.'
         WHERE id = 3`,
      );
      await executor.execute(
        `UPDATE prevention_actions
         SET completed_at = '2026-11-12T20:19:47Z', completion_notes = 'Installation terminée et vérifiée dans les 12 services prioritaires.'
         WHERE id = 4`,
      );
      await executor.execute(
        `UPDATE prevention_actions
         SET completion_notes = 'Annulation suite à révision du protocole de service.'
         WHERE id = 5`,
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. Seed exactly 4 baseline demonstration notifications
    // ──────────────────────────────────────────────────────────────────────────
    const existingNotif = await executor.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM in_app_notifications`,
    );
    const notifCount = existingNotif.rows[0]?.count ?? 0;

    if (notifCount < 4) {
      const decl1Row = await executor.query<{ id: number }>(
        `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-01'`,
      );
      const decl1Id = decl1Row.rows[0]?.id;
      if (!decl1Id) {
        throw new Error('EntityResolutionError: AES-2026-DEMO-01 not found for declaration_submitted notification.');
      }

      const decl2Row = await executor.query<{ id: number }>(
        `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-02'`,
      );
      const decl2Id = decl2Row.rows[0]?.id;
      if (!decl2Id) {
        throw new Error('EntityResolutionError: AES-2026-DEMO-02 not found for correction_requested notification.');
      }

      const rev2Row = await executor.query<{ id: number }>(
        `SELECT id FROM administrative_reviews WHERE declaration_id = ? AND outcome = 'correction_requested' ORDER BY id DESC LIMIT 1`,
        [decl2Id],
      );
      const review2Id = rev2Row.rows[0]?.id;
      if (!review2Id) {
        throw new Error('EntityResolutionError: Correction-requested review for AES-2026-DEMO-02 not found.');
      }

      const decl3Row = await executor.query<{ id: number }>(
        `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-03'`,
      );
      const decl3Id = decl3Row.rows[0]?.id;
      if (!decl3Id) {
        throw new Error('EntityResolutionError: AES-2026-DEMO-03 not found for oh_coordination_created notification.');
      }

      const c3Row = await executor.query<{ id: number }>(
        `SELECT id FROM oh_coordinations WHERE declaration_id = ? ORDER BY id DESC LIMIT 1`,
        [decl3Id],
      );
      const coord3Id = c3Row.rows[0]?.id;
      if (!coord3Id) {
        throw new Error('EntityResolutionError: OH coordination for AES-2026-DEMO-03 not found.');
      }

      const capa1Row = await executor.query<{ id: number }>(
        `SELECT id FROM prevention_actions WHERE reference_code = 'CAPA-2026-00001'`,
      );
      const capa1Id = capa1Row.rows[0]?.id;
      if (!capa1Id) {
        throw new Error('EntityResolutionError: CAPA-2026-00001 not found for capa_created notification.');
      }

      // ── Notification 1: declaration_submitted → admin_reviewer (unread) ──
      const key1 = `notif:declaration_submitted:aes_declaration:${decl1Id}:${adminUserId}`;
      await executor.execute(
        `INSERT INTO in_app_notifications (
           recipient_user_id, event_type, title_key, message_key,
           entity_type, entity_id, entity_reference,
           is_read, created_at, read_at, idempotency_key
         ) VALUES (?, 'declaration_submitted', 'notification.declarationSubmitted.title', 'notification.declarationSubmitted.message',
                   'aes_declaration', ?, 'AES-2026-DEMO-01',
                   0, '2026-11-10T09:15:00Z', NULL, ?)
         ON CONFLICT(idempotency_key) DO NOTHING`,
        [adminUserId, decl1Id, key1],
      );

      // ── Notification 2: correction_requested → exposed_professional (unread) ──
      const key2 = `notif:correction_requested:administrative_review:${review2Id}:${exposedUserId}`;
      await executor.execute(
        `INSERT INTO in_app_notifications (
           recipient_user_id, event_type, title_key, message_key,
           entity_type, entity_id, entity_reference,
           is_read, created_at, read_at, idempotency_key
         ) VALUES (?, 'correction_requested', 'notification.correctionRequested.title', 'notification.correctionRequested.message',
                   'administrative_review', ?, 'AES-2026-DEMO-02',
                   0, '2026-11-11T16:00:00Z', NULL, ?)
         ON CONFLICT(idempotency_key) DO NOTHING`,
        [exposedUserId, review2Id, key2],
      );

      // ── Notification 3: oh_coordination_created → oh_professional (read) ──
      const key3 = `notif:oh_coordination_created:oh_coordination:${coord3Id}:${ohUserId}`;
      await executor.execute(
        `INSERT INTO in_app_notifications (
           recipient_user_id, event_type, title_key, message_key,
           entity_type, entity_id, entity_reference,
           is_read, created_at, read_at, idempotency_key
         ) VALUES (?, 'oh_coordination_created', 'notification.ohCoordinationCreated.title', 'notification.ohCoordinationCreated.message',
                   'oh_coordination', ?, 'AES-2026-DEMO-03',
                   1, '2026-11-05T09:35:00Z', '2026-11-05T10:30:00Z', ?)
         ON CONFLICT(idempotency_key) DO NOTHING`,
        [ohUserId, coord3Id, key3],
      );

      // ── Notification 4: capa_created → quality_staff (read) ──
      const key4 = `notif:capa_created:prevention_action:${capa1Id}:${qualityUserId}`;
      await executor.execute(
        `INSERT INTO in_app_notifications (
           recipient_user_id, event_type, title_key, message_key,
           entity_type, entity_id, entity_reference,
           is_read, created_at, read_at, idempotency_key
         ) VALUES (?, 'capa_created', 'notification.capaCreated.title', 'notification.capaCreated.message',
                   'prevention_action', ?, 'CAPA-2026-00001',
                   1, '2026-11-12T19:17:00Z', '2026-11-12T20:00:00Z', ?)
         ON CONFLICT(idempotency_key) DO NOTHING`,
        [qualityUserId, capa1Id, key4],
      );
    }

    const finalDecl = await executor.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM aes_declarations`,
    );
    const finalCapa = await executor.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM prevention_actions`,
    );

    return {
      seeded: declCount < 4 || capaCount < 5,
      declarationsCount: finalDecl.rows[0]?.count ?? 0,
      preventionActionsCount: finalCapa.rows[0]?.count ?? 0,
    };
  }

  /**
   * Public standalone scenario seeding method on the database instance.
   * Opens exactly one transaction and executes the baseline demonstration scenario.
   */
  async seedStandardScenario(): Promise<SeedResult> {
    return this.db.transaction(async (tx) => {
      return this.seedStandardScenarioInternal(tx);
    });
  }

  async resetDemoScenario(userId: number): Promise<ResetDemoScenarioResult> {
    const user = await this.getDemoUser(userId);
    if (!user || user.role !== 'tech_admin') {
      throw new Error(
        `Unauthorized: only tech_admin can reset demonstration scenario. User ${userId} has role ${user?.role ?? 'unknown'}.`,
      );
    }

    const resetTimestamp = new Date().toISOString();

    await this.db.transaction(async (tx) => {
      // 1. Delete in-app notifications
      await tx.execute(`DELETE FROM in_app_notifications;`);
      // 2. Delete dependent follow-up events
      await tx.execute(`DELETE FROM oh_follow_up_events;`);
      // 3. Delete coordinations
      await tx.execute(`DELETE FROM oh_coordinations;`);
      // 4. Delete correction responses
      await tx.execute(`DELETE FROM correction_responses;`);
      // 5. Delete administrative reviews
      await tx.execute(`DELETE FROM administrative_reviews;`);
      // 6. Delete declarations
      await tx.execute(`DELETE FROM aes_declarations;`);
      // 7. Delete durable CAPA operation links before their actions
      await tx.execute(`DELETE FROM capa_creation_operations;`);
      // 8. Delete prevention actions
      await tx.execute(`DELETE FROM prevention_actions;`);
      // 9. Delete audit events
      await tx.execute(`DELETE FROM audit_events;`);

      // 10. Reseed standard demonstration dataset within this transaction
      await this.seedStandardScenarioInternal(tx);

      // 11. Record the demonstration reset audit event
      await tx.execute(
        `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
         VALUES ('DEMO_DATA_RESET', ?, 'system', NULL, ?, ?)`,
        [
          userId,
          "Réinitialisation du jeu de données de démonstration et réensemencement étalon exécutés par l'administrateur technique.",
          resetTimestamp,
        ],
      );
    });

    // Verification of resulting dataset
    const declCount =
      (await this.db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`))
        .rows[0]?.count ?? 0;
    const capaCount =
      (await this.db.query<{ count: number }>(`SELECT COUNT(*) as count FROM prevention_actions`))
        .rows[0]?.count ?? 0;
    const auditCount =
      (await this.db.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_events`))
        .rows[0]?.count ?? 0;

    return {
      success: true,
      declarationsCount: declCount,
      preventionActionsCount: capaCount,
      auditEventsCount: auditCount,
      resetAt: resetTimestamp,
    };
  }
}
