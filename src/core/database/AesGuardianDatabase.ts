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
} from './types';
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
} from './types';

/** Current schema version. Increment when migrations are added. */
const CURRENT_SCHEMA_VERSION = 7;

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
   * Returns the first row matching the query, or undefined.
   * Convenience wrapper for tests.
   */
  async get(sql: string, params?: any[]): Promise<any> {
    const result = await this.db.query<any>(sql, params ?? []);
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
        } catch {}
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
        } catch {}
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
    const existing = await this.getDeclarationById(id);
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
    const existing = await this.getDeclarationById(id);
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
    return this.db.execute(
      `UPDATE aes_declarations
       SET status = 'submitted', submitted_at = ?, updated_at = ?
       WHERE id = ?`,
      [now, now, id],
    );
  }

  async getDeclarationById(id: number, requestingUserId?: number): Promise<AesDeclaration | null> {
    if (requestingUserId !== undefined) {
      const user = await this.getDemoUser(requestingUserId);
      if (user && user.role === 'tech_admin') {
        throw new Error(
          `Unauthorized: tech_admin user ${requestingUserId} is strictly prohibited from accessing clinical declaration content.`,
        );
      }
    }
    const result = await this.db.query<AesDeclaration>(
      `SELECT * FROM aes_declarations WHERE id = ?`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async getDeclarations(
    options: { userId?: number; limit?: number } = {},
  ): Promise<AesDeclaration[]> {
    const { userId, limit = 100 } = options;
    if (userId !== undefined) {
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

  async getDeclarationsByStatus(status: DeclarationStatus): Promise<AesDeclaration[]> {
    if (!DECLARATION_STATUSES.includes(status)) {
      throw new Error(`getDeclarationsByStatus: invalid status "${status}"`);
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
    options: { status?: DeclarationStatus; limit?: number } = {},
  ): Promise<AesDeclaration[]> {
    const { status, limit = 100 } = options;
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
    const decl = await this.getDeclarationById(input.declaration_id);
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

    // 4. Atomic transaction: write review record + transition declaration status
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
    const decl = await this.getDeclarationById(input.declaration_id);
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
    });

    return { responseId, declarationStatus: 'resubmitted' };
  }

  /**
   * Retrieves all correction responses recorded for a given declaration.
   */
  async getCorrectionResponses(
    declarationId: number,
    requestingUserId?: number,
  ): Promise<CorrectionResponse[]> {
    if (requestingUserId !== undefined) {
      const user = await this.getDemoUser(requestingUserId);
      if (user && user.role === 'tech_admin') {
        throw new Error(
          `Unauthorized: tech_admin user ${requestingUserId} is strictly prohibited from accessing correction response content.`,
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
    const decl = await this.getDeclarationById(declarationId);
    if (!decl) throw new Error(`Declaration ${declarationId} not found`);
    if (decl.declared_by_user_id !== userId) {
      throw new Error(`Unauthorized: user ${userId} does not own declaration ${declarationId}`);
    }
    if (decl.status !== 'correction_requested') {
      return null;
    }
    const history = await this.getDeclarationReviewHistory(declarationId);
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
    optionsOrUserId?: { order?: 'ASC' | 'DESC'; requestingUserId?: number } | number,
  ): Promise<AdministrativeReview[]> {
    const requestingUserId =
      typeof optionsOrUserId === 'number'
        ? optionsOrUserId
        : optionsOrUserId?.requestingUserId;
    const order =
      typeof optionsOrUserId === 'object' && optionsOrUserId?.order === 'ASC'
        ? 'ASC'
        : 'DESC';

    if (requestingUserId !== undefined) {
      const user = await this.getDemoUser(requestingUserId);
      if (user && user.role === 'tech_admin') {
        throw new Error(
          `Unauthorized: tech_admin user ${requestingUserId} is strictly prohibited from accessing review history content.`,
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
      `SELECT id FROM aes_declarations WHERE id = ?`,
      [input.declaration_id],
    );
    if (declResult.rows.length === 0) {
      throw new Error(`createOhCoordination: declaration ${input.declaration_id} not found`);
    }

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

    const now = new Date().toISOString();
    const result = await this.db.execute(
      `INSERT INTO oh_coordinations
         (declaration_id, created_by_user_id, coordination_reason, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending_acknowledgement', ?, ?)`,
      [input.declaration_id, input.created_by_user_id, input.coordination_reason, now, now],
    );
    return result.insertId!;
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

    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE oh_coordinations
       SET status = 'acknowledged', acknowledged_by_user_id = ?, acknowledged_at = ?, updated_at = ?
       WHERE id = ?`,
      [acknowledging_user_id, now, now, coordination_id],
    );
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

    const now = new Date().toISOString();
    await this.db.execute(
      `UPDATE oh_coordinations
       SET status = 'completed', completed_by_user_id = ?, completed_at = ?, updated_at = ?
       WHERE id = ?`,
      [completing_user_id, now, now, coordination_id],
    );
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
    requesting_user_id: number,
  ): Promise<OhCoordination | null> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('getOhCoordinationById: requesting user not found');
    }
    const user = userResult.rows[0];
    if (user.role === 'tech_admin') {
      throw new Error(
        'getOhCoordinationById: tech_admin is not authorized to access coordination data',
      );
    }

    const result = await this.db.query<OhCoordination>(
      `SELECT * FROM oh_coordinations WHERE id = ?`,
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
      // Return minimal status-only view
      return {
        id: coord.id,
        declaration_id: coord.declaration_id,
        created_by_user_id: coord.created_by_user_id,
        coordination_reason: coord.coordination_reason,
        status: coord.status,
        acknowledged_by_user_id: null,
        acknowledged_at: null,
        completed_by_user_id: null,
        completed_at: null,
        created_at: coord.created_at,
        updated_at: coord.updated_at,
      };
    }

    return coord;
  }

  /**
   * Get active OH coordination for a declaration with role filtering.
   */
  async getOhCoordinationByDeclaration(
    declaration_id: number,
    requesting_user_id: number,
  ): Promise<OhCoordination | null> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('getOhCoordinationByDeclaration: requesting user not found');
    }
    const user = userResult.rows[0];
    if (user.role === 'tech_admin') {
      throw new Error(
        'getOhCoordinationByDeclaration: tech_admin is not authorized to access coordination data',
      );
    }

    const result = await this.db.query<OhCoordination>(
      `SELECT * FROM oh_coordinations
       WHERE declaration_id = ? AND status IN ('pending_acknowledgement', 'acknowledged')
       ORDER BY created_at DESC
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
      return {
        id: coord.id,
        declaration_id: coord.declaration_id,
        created_by_user_id: coord.created_by_user_id,
        coordination_reason: coord.coordination_reason,
        status: coord.status,
        acknowledged_by_user_id: null,
        acknowledged_at: null,
        completed_by_user_id: null,
        completed_at: null,
        created_at: coord.created_at,
        updated_at: coord.updated_at,
      };
    }

    return coord;
  }

  /**
   * List all non-completed coordination records for the OH professional queue.
   * Returns records with enriched declaration reference.
   */
  async listOhCoordinationsQueue(requesting_user_id: number): Promise<OhCoordination[]> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('listOhCoordinationsQueue: requesting user not found');
    }
    const user = userResult.rows[0];
    if (user.role !== 'oh_professional') {
      throw new Error(
        `listOhCoordinationsQueue: unauthorized — requires oh_professional, got ${user.role}`,
      );
    }

    const result = await this.db.query<OhCoordination>(
      `SELECT c.*, d.reference_number AS declaration_reference,
              u.display_name AS creator_name
       FROM oh_coordinations c
       LEFT JOIN aes_declarations d ON d.id = c.declaration_id
       LEFT JOIN demo_users u ON u.id = c.created_by_user_id
       WHERE c.status IN ('pending_acknowledgement', 'acknowledged')
       ORDER BY c.created_at ASC`,
      [],
    );
    return result.rows;
  }

  /**
   * List coordinations created by a specific admin_reviewer.
   */
  async listOhCoordinationsForAdmin(requesting_user_id: number): Promise<OhCoordination[]> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('listOhCoordinationsForAdmin: requesting user not found');
    }
    const user = userResult.rows[0];
    if (user.role !== 'admin_reviewer') {
      throw new Error(
        `listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got ${user.role}`,
      );
    }

    const result = await this.db.query<OhCoordination>(
      `SELECT c.*, d.reference_number AS declaration_reference
       FROM oh_coordinations c
       LEFT JOIN aes_declarations d ON d.id = c.declaration_id
       WHERE c.created_by_user_id = ?
       ORDER BY c.created_at DESC`,
      [requesting_user_id],
    );
    return result.rows;
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

    const now = new Date().toISOString();
    const result = await this.db.execute(
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

    // Auto-complete coordination when follow_up_completed event is recorded
    if (input.event_category === 'follow_up_completed') {
      await this.db.execute(
        `UPDATE oh_coordinations
         SET status = 'completed', completed_by_user_id = ?, completed_at = ?, updated_at = ?
         WHERE id = ?`,
        [input.recorded_by_user_id, now, now, input.coordination_id],
      );
    }

    return result.insertId!;
  }

  /**
   * Get follow-up events for a coordination record.
   * Only oh_professional or admin_reviewer may read events.
   */
  async getOhFollowUpEvents(
    coordination_id: number,
    requesting_user_id: number,
  ): Promise<OhFollowUpEvent[]> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [requesting_user_id],
    );
    if (userResult.rows.length === 0) {
      throw new Error('getOhFollowUpEvents: requesting user not found');
    }
    const user = userResult.rows[0];
    if (user.role === 'tech_admin' || user.role === 'quality_staff' || user.role === 'exposed_professional') {
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
  ): Promise<PreventionAction> {
    const userResult = await this.db.query<DemoUser>(
      `SELECT * FROM demo_users WHERE id = ?`,
      [userId],
    );
    if (userResult.rows.length === 0) {
      throw new Error(`createPreventionAction: user ${userId} not found`);
    }
    const user = userResult.rows[0];
    if (user.role !== 'quality_staff') {
      throw new Error(
        `UnauthorizedError: role '${user.role}' is not permitted to create prevention actions. ` +
          `Only quality_staff may create and manage prevention actions.`,
      );
    }

    // Required fields validation
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

    // Optional target date validation (YYYY-MM-DD)
    let targetDate: string | null = null;
    if (input.target_date && input.target_date.trim().length > 0) {
      const td = input.target_date.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(td)) {
        throw new Error('createPreventionAction: target_date must be in YYYY-MM-DD format');
      }
      targetDate = td;
    }

    const surveillanceRef = input.surveillance_reference?.trim() || null;
    if (surveillanceRef) {
      if (/^AES-\d{4}-\d+/i.test(surveillanceRef)) {
        throw new Error(
          'createPreventionAction: surveillance_reference must be an aggregate surveillance observation (e.g., "Tendance T3-2026") and must not reference individual declarations (AES-XXXX).',
        );
      }
    }
    const referenceCode = generateCapaReferenceNumber();

    const result = await this.db.execute(
      `INSERT INTO prevention_actions
         (reference_code, title, description, action_type, contributing_factor,
          rationale, surveillance_reference, status, target_date, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'proposed', ?, ?)`,
      [
        referenceCode,
        title,
        description,
        input.action_type,
        input.contributing_factor,
        rationale,
        surveillanceRef,
        targetDate,
        userId,
      ],
    );

    const actionId = result.insertId!;

    // Audit event
    await this.logAuditEvent({
      event_type: 'prevention_action_created',
      user_id: userId,
      entity_type: 'prevention_action',
      entity_id: actionId,
      description: `Création de la mesure de prévention: ${referenceCode} (${title})`,
    });

    const action = await this.getPreventionActionById(userId, actionId);
    return action!;
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
  ): Promise<PreventionAction> {
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

    await this.db.execute(
      `UPDATE prevention_actions
       SET status = ?, completed_at = ?, completion_notes = ?,
           updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
       WHERE id = ?`,
      [newStatus, completedAt, notes, actionId],
    );

    await this.logAuditEvent({
      event_type: 'prevention_status_changed',
      user_id: userId,
      entity_type: 'prevention_action',
      entity_id: actionId,
      description: `Statut de la mesure ${action.reference_code} modifié: ${action.status} -> ${newStatus}`,
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
}
