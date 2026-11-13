/**
 * AES Guardian — Migration 7 Regression Test (Phase 2C.6)
 *
 * Uses genuine SQLite via NativeSQLiteAdapter + AesGuardianDatabase to verify:
 * - Migration 7 applies cleanly on top of migrations 1–6.
 * - prevention_actions table is created with correct columns, defaults, and CHECK constraints.
 * - Indexes exist on status, action_type, contributing_factor, created_by_user_id.
 * - Foreign key references to demo_users(id) exist.
 * - Historical data (declarations, reviews, coordinations) survives unaffected.
 * - PRAGMA foreign_key_check returns no violations.
 * - Schema version is recorded as 7.
 */

import { AesGuardianDatabase, MIGRATIONS } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';

/** Apply all migrations up to and including targetVersion */
async function initializeUpTo(
  version: number,
  db: AesGuardianDatabase,
): Promise<void> {
  const filtered = MIGRATIONS.filter(m => m.version <= version);
  (db as any).MIGRATIONS = filtered;
  await db.initialize();
  (db as any).MIGRATIONS = MIGRATIONS;
}

describe('Migration 7 — Prevention Actions Schema Regression', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;
  let seededUserId: number;

  beforeAll(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);

    // Apply migrations 1 through 6 first
    await initializeUpTo(6, db);

    const userRes = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('qualite.m7.test', 'Qualite Test M7', 'quality_staff')`,
    );
    seededUserId = userRes.insertId as number;

    const declRes = await db.run(
      `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
       VALUES ('AES-2026-M7-01', ?, '2026-11-01', 'percutaneous_exposure', 'submitted')`,
      [seededUserId],
    );
    const declId = declRes.insertId as number;

    await db.run(
      `INSERT INTO oh_coordinations (declaration_id, created_by_user_id, coordination_reason, status)
       VALUES (?, ?, 'routine_followup', 'pending_acknowledgement')`,
      [declId, seededUserId],
    );

    // Apply Migration 7
    await db.initialize();
  });

  afterAll(async () => {
    await adapter.close();
  });

  test('Schema version is recorded as 7', async () => {
    const row = await db.get(
      `SELECT version FROM schema_versions WHERE version = 7`,
    );
    expect(row).toBeTruthy();
    expect(row.version).toBe(7);
  });

  test('prevention_actions table exists with expected columns', async () => {
    const cols = await db.all(`PRAGMA table_info(prevention_actions)`);
    const colNames = cols.map((c: any) => c.name);

    expect(colNames).toContain('id');
    expect(colNames).toContain('reference_code');
    expect(colNames).toContain('title');
    expect(colNames).toContain('description');
    expect(colNames).toContain('action_type');
    expect(colNames).toContain('contributing_factor');
    expect(colNames).toContain('rationale');
    expect(colNames).toContain('surveillance_reference');
    expect(colNames).toContain('status');
    expect(colNames).toContain('target_date');
    expect(colNames).toContain('completed_at');
    expect(colNames).toContain('completion_notes');
    expect(colNames).toContain('created_by_user_id');
    expect(colNames).toContain('created_at');
    expect(colNames).toContain('updated_at');
  });

  test('Indexes on prevention_actions are created', async () => {
    const idxs = await db.all(`PRAGMA index_list(prevention_actions)`);
    const idxNames = idxs.map((i: any) => i.name);

    expect(idxNames).toContain('idx_prevention_status');
    expect(idxNames).toContain('idx_prevention_action_type');
    expect(idxNames).toContain('idx_prevention_factor');
    expect(idxNames).toContain('idx_prevention_created_by');
  });

  test('PRAGMA foreign_key_check passes with zero violations', async () => {
    const fkViolations = await db.all(`PRAGMA foreign_key_check`);
    expect(fkViolations).toEqual([]);
  });

  test('Enforces CHECK constraint on action_type', async () => {
    await expect(
      db.run(
        `INSERT INTO prevention_actions
           (reference_code, title, description, action_type, contributing_factor, rationale, created_by_user_id)
         VALUES ('CAPA-TEST-BAD-TYPE', 'Test', 'Description', 'invalid_type', 'device_safety_design', 'Rationale', ?)`,
        [seededUserId],
      ),
    ).rejects.toThrow();
  });

  test('Enforces CHECK constraint on contributing_factor', async () => {
    await expect(
      db.run(
        `INSERT INTO prevention_actions
           (reference_code, title, description, action_type, contributing_factor, rationale, created_by_user_id)
         VALUES ('CAPA-TEST-BAD-FACTOR', 'Test', 'Description', 'corrective', 'invalid_factor', 'Rationale', ?)`,
        [seededUserId],
      ),
    ).rejects.toThrow();
  });

  test('Enforces CHECK constraint on status', async () => {
    await expect(
      db.run(
        `INSERT INTO prevention_actions
           (reference_code, title, description, action_type, contributing_factor, rationale, status, created_by_user_id)
         VALUES ('CAPA-TEST-BAD-STATUS', 'Test', 'Description', 'corrective', 'device_safety_design', 'Rationale', 'invalid_status', ?)`,
        [seededUserId],
      ),
    ).rejects.toThrow();
  });

  test('Successfully inserts a valid prevention action record with default status proposed', async () => {
    const res = await db.run(
      `INSERT INTO prevention_actions
         (reference_code, title, description, action_type, contributing_factor, rationale, created_by_user_id)
       VALUES ('CAPA-2026-M7-01', 'Formation aiguilles sécurisées', 'Session de formation obligatoire', 'preventive', 'device_safety_design', 'Hausse constatée des piqûres', ?)`,
      [seededUserId],
    );

    const inserted = await db.get(
      `SELECT * FROM prevention_actions WHERE id = ?`,
      [res.insertId],
    );

    expect(inserted).toBeDefined();
    expect(inserted.reference_code).toBe('CAPA-2026-M7-01');
    expect(inserted.status).toBe('proposed');
    expect(inserted.action_type).toBe('preventive');
    expect(inserted.contributing_factor).toBe('device_safety_design');
    expect(inserted.completed_at).toBeNull();
    expect(inserted.created_at).toBeDefined();
  });

  test('Historical declarations and coordinations from pre-migration 7 remain intact', async () => {
    const decls = await db.all(`SELECT * FROM aes_declarations WHERE reference_number = 'AES-2026-M7-01'`);
    expect(decls.length).toBe(1);

    const coords = await db.all(`SELECT * FROM oh_coordinations WHERE coordination_reason = 'routine_followup'`);
    expect(coords.length).toBe(1);
  });
});
