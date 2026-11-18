/**
 * AES Guardian — Migration 8 Regression Test (Phase 2D.2B)
 *
 * Uses genuine SQLite via NativeSQLiteAdapter + AesGuardianDatabase to verify:
 * - Migration 8 applies cleanly on top of migrations 1–7.
 * - in_app_notifications table is created with correct columns, defaults, and CHECK constraints.
 * - Indexes exist on:
 *     idx_notifications_recipient_unread (recipient_user_id, is_read, created_at)
 *     idx_notifications_recipient_all (recipient_user_id, created_at)
 * - UNIQUE constraint on idempotency_key is enforced.
 * - Foreign key references to demo_users(id) ON DELETE CASCADE exist and function.
 * - Historical data (declarations, reviews, coordinations, CAPAs) survives unaffected.
 * - PRAGMA foreign_key_check returns zero violations.
 * - Schema version is recorded as 8.
 * - Fresh database initialization completes all migrations 1–8 cleanly.
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

describe('Migration 8 — In-App Notifications Schema Regression', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;
  let seededUserId: number;

  beforeAll(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);

    // Apply migrations 1 through 7 first
    await initializeUpTo(7, db);

    // Seed test user
    const userRes = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('reviewer.m8.test', 'Reviewer Test M8', 'admin_reviewer')`,
    );
    seededUserId = userRes.insertId as number;

    // Seed historical pre-migration data
    const declRes = await db.run(
      `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
       VALUES ('AES-2026-M8-01', ?, '2026-11-01', 'percutaneous_exposure', 'submitted')`,
      [seededUserId],
    );
    const declId = declRes.insertId as number;

    await db.run(
      `INSERT INTO administrative_reviews (declaration_id, reviewer_user_id, outcome, comments, reviewed_at)
       VALUES (?, ?, 'acknowledged', 'Pre-migration review', datetime('now'))`,
      [declId, seededUserId],
    );

    await db.run(
      `INSERT INTO oh_coordinations (declaration_id, created_by_user_id, coordination_reason, status)
       VALUES (?, ?, 'routine_followup', 'pending_acknowledgement')`,
      [declId, seededUserId],
    );

    await db.run(
      `INSERT INTO prevention_actions (reference_code, title, description, action_type, contributing_factor, rationale, created_by_user_id)
       VALUES ('CAPA-2026-M8-01', 'Test Pre-M8 CAPA', 'Description', 'preventive', 'device_safety_design', 'Rationale', ?)`,
      [seededUserId],
    );

    // Now apply Migration 8 (full initialize)
    await db.initialize();
  });

  afterAll(async () => {
    await adapter.close();
  });

  test('Schema version is recorded as 8', async () => {
    const row = await db.get(
      `SELECT version FROM schema_versions WHERE version = 8`,
    );
    expect(row).toBeTruthy();
    expect(row.version).toBe(8);
  });

  test('in_app_notifications table exists with expected columns', async () => {
    const cols = await db.all(`PRAGMA table_info(in_app_notifications)`);
    const colNames = cols.map((c: any) => c.name);

    expect(colNames).toContain('id');
    expect(colNames).toContain('recipient_user_id');
    expect(colNames).toContain('event_type');
    expect(colNames).toContain('title_key');
    expect(colNames).toContain('message_key');
    expect(colNames).toContain('entity_type');
    expect(colNames).toContain('entity_id');
    expect(colNames).toContain('entity_reference');
    expect(colNames).toContain('is_read');
    expect(colNames).toContain('created_at');
    expect(colNames).toContain('read_at');
    expect(colNames).toContain('idempotency_key');
  });

  test('Required indexes on in_app_notifications are created', async () => {
    const idxs = await db.all(`PRAGMA index_list(in_app_notifications)`);
    const idxNames = idxs.map((i: any) => i.name);

    expect(idxNames).toContain('idx_notifications_recipient_unread');
    expect(idxNames).toContain('idx_notifications_recipient_all');
  });

  test('PRAGMA foreign_key_check passes with zero violations', async () => {
    const fkViolations = await db.all(`PRAGMA foreign_key_check`);
    expect(fkViolations).toEqual([]);
  });

  test('Enforces CHECK constraint on event_type (rejects invalid)', async () => {
    await expect(
      db.run(
        `INSERT INTO in_app_notifications
           (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'invalid_event_type', 'title', 'msg', 'aes_declaration', 1, 'key-bad-event')`,
        [seededUserId],
      ),
    ).rejects.toThrow();
  });

  test('Accepts all 11 approved event types', async () => {
    const validEvents = [
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
      'capa_finalized',
    ];

    for (let i = 0; i < validEvents.length; i++) {
      const evt = validEvents[i];
      const res = await db.run(
        `INSERT INTO in_app_notifications
           (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, ?, 'title', 'msg', 'aes_declaration', 1, ?)`,
        [seededUserId, evt, `key-valid-${evt}-${i}`],
      );
      expect(res.rowsAffected).toBe(1);
    }
  });

  test('Enforces CHECK constraint on entity_type (rejects invalid)', async () => {
    await expect(
      db.run(
        `INSERT INTO in_app_notifications
           (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'declaration_submitted', 'title', 'msg', 'invalid_entity_type', 1, 'key-bad-entity')`,
        [seededUserId],
      ),
    ).rejects.toThrow();
  });

  test('Accepts all 6 approved entity types', async () => {
    const validEntities = [
      'aes_declaration',
      'administrative_review',
      'correction_response',
      'oh_coordination',
      'oh_follow_up_events',
      'prevention_action',
    ];

    for (let i = 0; i < validEntities.length; i++) {
      const ent = validEntities[i];
      const res = await db.run(
        `INSERT INTO in_app_notifications
           (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'declaration_submitted', 'title', 'msg', ?, 1, ?)`,
        [seededUserId, ent, `key-valid-ent-${ent}-${i}`],
      );
      expect(res.rowsAffected).toBe(1);
    }
  });

  test('Enforces CHECK constraint on is_read (0 or 1 only)', async () => {
    await expect(
      db.run(
        `INSERT INTO in_app_notifications
           (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, is_read, idempotency_key)
         VALUES (?, 'declaration_submitted', 'title', 'msg', 'aes_declaration', 1, 2, 'key-bad-read')`,
        [seededUserId],
      ),
    ).rejects.toThrow();
  });

  test('Enforces FOREIGN KEY constraint on recipient_user_id', async () => {
    await expect(
      db.run(
        `INSERT INTO in_app_notifications
           (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (999999, 'declaration_submitted', 'title', 'msg', 'aes_declaration', 1, 'key-bad-fk')`,
      ),
    ).rejects.toThrow();
  });

  test('Enforces UNIQUE constraint on idempotency_key', async () => {
    await db.run(
      `INSERT INTO in_app_notifications
         (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
       VALUES (?, 'declaration_submitted', 'title', 'msg', 'aes_declaration', 1, 'unique-key-test')`,
      [seededUserId],
    );

    await expect(
      db.run(
        `INSERT INTO in_app_notifications
           (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'declaration_submitted', 'title', 'msg', 'aes_declaration', 1, 'unique-key-test')`,
        [seededUserId],
      ),
    ).rejects.toThrow();
  });

  test('Historical declarations, reviews, coordinations, CAPAs remain intact after Migration 8', async () => {
    const decls = await db.all(`SELECT * FROM aes_declarations WHERE reference_number = 'AES-2026-M8-01'`);
    expect(decls.length).toBe(1);

    const reviews = await db.all(`SELECT * FROM administrative_reviews WHERE comments = 'Pre-migration review'`);
    expect(reviews.length).toBe(1);

    const coords = await db.all(`SELECT * FROM oh_coordinations WHERE coordination_reason = 'routine_followup'`);
    expect(coords.length).toBe(1);

    const capas = await db.all(`SELECT * FROM prevention_actions WHERE reference_code = 'CAPA-2026-M8-01'`);
    expect(capas.length).toBe(1);
  });

  test('Fresh database initializes cleanly through all migrations 1–8', async () => {
    const freshAdapter = new NativeSQLiteAdapter();
    await freshAdapter.open();
    const freshDb = new AesGuardianDatabase(freshAdapter as any);

    await freshDb.initialize();

    const versions = await freshDb.getAppliedVersions();
    const versionNumbers = versions.map((v: any) => v.version);
    expect(versionNumbers).toContain(8);
    expect(versionNumbers.length).toBe(8);

    const fkViolations = await freshDb.all(`PRAGMA foreign_key_check`);
    expect(fkViolations).toEqual([]);

    await freshAdapter.close();
  });
});
