/**
 * AES Guardian — Migration 6 Regression Test (Phase 2C.4)
 *
 * Uses genuine SQLite via NativeSQLiteAdapter + AesGuardianDatabase to verify:
 * - Migration 6 applies cleanly on top of migrations 1–5.
 * - oh_coordinations and oh_follow_up_events tables are created.
 * - Correct FK references exist.
 * - Partial unique index enforces one active coordination per declaration.
 * - Existing data (declarations, reviews) survives.
 * - PRAGMA foreign_key_check returns no violations.
 * - Schema version recorded as 6.
 *
 * NOTE: This test uses node:sqlite (Node.js ≥ 22) via NativeSQLiteAdapter.
 * The JS mock cannot test real FK constraints, partial unique indexes, or PRAGMA.
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

describe('Migration 6 — Native SQLite Regression', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;
  let seededUserId: number;
  let seededDeclId1: number;
  let seededDeclId2: number;

  beforeAll(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    // Seed through migration 5 first
    await initializeUpTo(5, db);

    // Insert user without specifying fixed ID to avoid collision with seeded users
    const userRes = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('prof.test.m6', 'Prof Test M6', 'exposed_professional')`,
    );
    seededUserId = userRes.insertId as number;

    const decl1Res = await db.run(
      `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
       VALUES ('AES-2025-M6-1', ?, '2025-06-01', 'percutaneous_exposure', 'submitted')`,
      [seededUserId],
    );
    seededDeclId1 = decl1Res.insertId as number;

    const decl2Res = await db.run(
      `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
       VALUES ('AES-2025-M6-2', ?, '2025-06-15', 'mucocutaneous_exposure', 'under_review')`,
      [seededUserId],
    );
    seededDeclId2 = decl2Res.insertId as number;

    await db.run(
      `INSERT INTO administrative_reviews (declaration_id, reviewer_user_id, outcome)
       VALUES (?, ?, 'acknowledged')`,
      [seededDeclId2, seededUserId],
    );
  });

  afterAll(() => {
    adapter?.close();
  });

  test('Migration 6 applies cleanly on top of migrations 1–5', async () => {
    await initializeUpTo(6, db);
  });

  test('oh_coordinations table exists after migration 6', async () => {
    const row = await db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='oh_coordinations'`,
    );
    expect(row).toBeTruthy();
    expect(row.name).toBe('oh_coordinations');
  });

  test('oh_follow_up_events table exists after migration 6', async () => {
    const row = await db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='oh_follow_up_events'`,
    );
    expect(row).toBeTruthy();
  });

  test('Schema version 6 is recorded', async () => {
    const row = await db.get(
      `SELECT version FROM schema_versions WHERE version = 6`,
    );
    expect(row).toBeTruthy();
    expect(row.version).toBe(6);
  });

  test('All 6 schema versions are recorded', async () => {
    const rows = await db.all(
      `SELECT version FROM schema_versions ORDER BY version ASC`,
    );
    const versions = rows.map((r: any) => r.version);
    expect(versions).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('Pre-existing declarations survive migration 6 unchanged', async () => {
    const rows = await db.all(
      `SELECT id, reference_number, status FROM aes_declarations WHERE id IN (?, ?) ORDER BY id`,
      [seededDeclId1, seededDeclId2],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].reference_number).toBe('AES-2025-M6-1');
    expect(rows[0].status).toBe('submitted');
    expect(rows[1].reference_number).toBe('AES-2025-M6-2');
    expect(rows[1].status).toBe('under_review');
  });

  test('Pre-existing administrative reviews survive migration 6', async () => {
    const rows = await db.all(
      `SELECT id, declaration_id, outcome FROM administrative_reviews WHERE declaration_id = ?`,
      [seededDeclId2],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].declaration_id).toBe(seededDeclId2);
    expect(rows[0].outcome).toBe('acknowledged');
  });

  test('PRAGMA foreign_key_check returns no violations after seeding coordination data', async () => {
    const coordRes = await db.run(
      `INSERT INTO oh_coordinations
         (declaration_id, created_by_user_id, coordination_reason, status)
       VALUES (?, ?, 'routine_followup', 'pending_acknowledgement')`,
      [seededDeclId1, seededUserId],
    );
    const coordId = coordRes.insertId as number;

    await db.run(
      `INSERT INTO oh_follow_up_events
         (coordination_id, event_category, event_date, recorded_by_user_id)
       VALUES (?, 'contact_attempt_recorded', '2025-07-02', ?)`,
      [coordId, seededUserId],
    );

    const violations = await db.all(`PRAGMA foreign_key_check`);
    expect(violations).toHaveLength(0);
  });

  test('FK list for oh_coordinations references aes_declarations and demo_users', async () => {
    const fkList = await db.all(`PRAGMA foreign_key_list(oh_coordinations)`);
    const refTables = fkList.map((r: any) => r.table);
    expect(refTables).toContain('aes_declarations');
    expect(refTables).toContain('demo_users');
  });

  test('FK list for oh_follow_up_events references oh_coordinations and demo_users', async () => {
    const fkList = await db.all(`PRAGMA foreign_key_list(oh_follow_up_events)`);
    const refTables = fkList.map((r: any) => r.table);
    expect(refTables).toContain('oh_coordinations');
    expect(refTables).toContain('demo_users');
  });

  test('Partial unique index enforces one active coordination per declaration', async () => {
    // seededDeclId2 has no coordination yet
    await db.run(
      `INSERT INTO oh_coordinations
         (declaration_id, created_by_user_id, coordination_reason, status)
       VALUES (?, ?, 'serology_monitoring', 'acknowledged')`,
      [seededDeclId2, seededUserId],
    );

    // Second active coordination for seededDeclId2 should fail
    await expect(
      db.run(
        `INSERT INTO oh_coordinations
           (declaration_id, created_by_user_id, coordination_reason, status)
         VALUES (?, ?, 'routine_followup', 'pending_acknowledgement')`,
        [seededDeclId2, seededUserId],
      ),
    ).rejects.toThrow();
  });

  test('Partial unique index allows new coordination after previous is completed', async () => {
    const newDecl = await db.run(
      `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
       VALUES ('AES-2025-M6-3', ?, '2025-08-01', 'percutaneous_exposure', 'submitted')`,
      [seededUserId],
    );
    const newDeclId = newDecl.insertId as number;

    await db.run(
      `INSERT INTO oh_coordinations
         (declaration_id, created_by_user_id, coordination_reason, status)
       VALUES (?, ?, 'routine_followup', 'completed')`,
      [newDeclId, seededUserId],
    );

    // New active coordination for same declaration should succeed
    await expect(
      db.run(
        `INSERT INTO oh_coordinations
           (declaration_id, created_by_user_id, coordination_reason, status)
         VALUES (?, ?, 'serology_monitoring', 'pending_acknowledgement')`,
        [newDeclId, seededUserId],
      ),
    ).resolves.toBeDefined();
  });

  test('Coordination required indexes exist', async () => {
    const indexes = await db.all(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name IN ('oh_coordinations','oh_follow_up_events')`,
    );
    const names = indexes.map((r: any) => r.name);
    expect(names).toContain('idx_oh_coord_active_per_decl');
    expect(names).toContain('idx_oh_coord_decl');
    expect(names).toContain('idx_oh_coord_status');
    expect(names).toContain('idx_oh_event_coord');
    expect(names).toContain('idx_oh_event_recorded_by');
  });
});
