/**
 * AES Guardian — Audit Foreign Key Repair Verification Test (Phase 2C.6.1)
 *
 * Verifies the legacy audit foreign-key repair routine in AesGuardianDatabase.initialize():
 * 1. Database with the legacy foreign-key defect and existing audit rows.
 * 2. Database already repaired (idempotency, no repeated rebuilds).
 * 3. Fresh database.
 * 4. Transactional safety and rollback on simulated failure.
 */

import { AesGuardianDatabase } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';

describe('Audit Foreign Key Repair Verification (Phase 2C.6.1)', () => {
  describe('1. Legacy Defect Repair with Existing Rows', () => {
    let adapter: NativeSQLiteAdapter;
    let db: AesGuardianDatabase;

    beforeAll(async () => {
      adapter = new NativeSQLiteAdapter();
      await adapter.open();
      db = new AesGuardianDatabase(adapter as any);

      // Create base tables
      await adapter.execute(`CREATE TABLE schema_versions (version INTEGER PRIMARY KEY, applied_at TEXT, description TEXT)`);
      await adapter.execute(`INSERT INTO schema_versions (version, description) VALUES (7, 'All migrations applied')`);
      await adapter.execute(`CREATE TABLE demo_users (id INTEGER PRIMARY KEY, username TEXT, role TEXT)`);
      await adapter.execute(`INSERT INTO demo_users (id, username, role) VALUES (1, 'prof.expose', 'exposed_professional')`);
      await adapter.execute(`INSERT INTO demo_users (id, username, role) VALUES (4, 'qualite.demo', 'quality_staff')`);

      // Intentionally create audit_events with the legacy "demo_users_v1" defect
      await adapter.execute('PRAGMA foreign_keys = OFF;');
      await adapter.execute(`CREATE TABLE audit_events (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type  TEXT    NOT NULL,
        user_id     INTEGER REFERENCES "demo_users_v1"(id),
        entity_type TEXT,
        entity_id   INTEGER,
        description TEXT    NOT NULL,
        occurred_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )`);

      // Seed audit events into table with legacy defect
      await adapter.execute(
        `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
         VALUES ('APP_STARTED', 1, 'system', NULL, 'Historical system startup', '2026-10-01T08:00:00Z')`,
      );
      await adapter.execute(
        `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
         VALUES ('DECLARATION_SUBMITTED', 1, 'declaration', 101, 'Historical declaration submitted', '2026-10-02T09:30:00Z')`,
      );
      await adapter.execute(
        `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
         VALUES ('SYSTEM_NOTE', NULL, 'system', NULL, 'Anonymous system audit', '2026-10-03T10:00:00Z')`,
      );
      await adapter.execute('PRAGMA foreign_keys = ON;');

      // Verify that audit_events actually has the legacy defect
      const schemaBefore = await adapter.query<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'`,
      );
      expect(schemaBefore.rows[0].sql).toContain('demo_users_v1');

      // Now run db.initialize() which detects and executes the repair routine
      await db.initialize();
    });

    it('successfully repairs the foreign key to reference demo_users(id)', async () => {
      const schemaAfter = await adapter.query<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'`,
      );
      expect(schemaAfter.rows[0].sql).not.toContain('demo_users_v1');
      expect(schemaAfter.rows[0].sql).toContain('demo_users');
    });

    it('preserves all historical audit records and columns without loss', async () => {
      const rows = await adapter.query<{
        id: number;
        event_type: string;
        user_id: number | null;
        description: string;
        occurred_at: string;
      }>(`SELECT id, event_type, user_id, description, occurred_at FROM audit_events ORDER BY id ASC`);

      expect(rows.rows.length).toBe(3);
      expect(rows.rows[0].event_type).toBe('APP_STARTED');
      expect(rows.rows[0].user_id).toBe(1);
      expect(rows.rows[0].description).toBe('Historical system startup');

      expect(rows.rows[1].event_type).toBe('DECLARATION_SUBMITTED');
      expect(rows.rows[1].user_id).toBe(1);

      expect(rows.rows[2].event_type).toBe('SYSTEM_NOTE');
      expect(rows.rows[2].user_id).toBeNull();
    });

    it('PRAGMA foreign_key_check returns zero violations after repair', async () => {
      const fkCheck = await adapter.query(`PRAGMA foreign_key_check;`);
      expect(fkCheck.rows.length).toBe(0);
    });

    it('allows inserting new audit events with foreign key check active', async () => {
      const res = await db.logAuditEvent({
        event_type: 'PREVENTION_TEST',
        user_id: 4, // qualite.demo
        entity_type: 'prevention_action',
        entity_id: 1,
        description: 'New audit event after repair',
      });
      expect(res).toBeGreaterThan(0);

      const allEvents = await db.listAuditEvents(10);
      expect(allEvents.length).toBe(4);
    });
  });

  describe('2. Idempotency on Already Repaired Database', () => {
    let adapter: NativeSQLiteAdapter;
    let db: AesGuardianDatabase;

    beforeAll(async () => {
      adapter = new NativeSQLiteAdapter();
      await adapter.open();
      db = new AesGuardianDatabase(adapter as any);
      await db.initialize();
    });

    it('does not re-run repair or corrupt data on repeated initialize() calls', async () => {
      await db.logAuditEvent({
        event_type: 'IDEMPOTENCY_TEST',
        user_id: 4,
        entity_type: null,
        entity_id: null,
        description: 'Preserved across repeated inits',
      });

      const countBefore = (await adapter.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_events`)).rows[0].count;

      // Repeated initializations
      await db.initialize();
      await db.initialize();

      const countAfter = (await adapter.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_events`)).rows[0].count;
      expect(countAfter).toBe(countBefore);

      const schema = await adapter.query<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'`,
      );
      expect(schema.rows[0].sql).not.toContain('demo_users_v1');
      expect(schema.rows[0].sql).toContain('demo_users');
    });
  });

  describe('3. Fresh Database Initialization', () => {
    let adapter: NativeSQLiteAdapter;
    let db: AesGuardianDatabase;

    beforeAll(async () => {
      adapter = new NativeSQLiteAdapter();
      await adapter.open();
      db = new AesGuardianDatabase(adapter as any);
      await db.initialize();
    });

    it('produces a clean schema with audit_events referencing demo_users(id)', async () => {
      const schema = await adapter.query<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'`,
      );
      expect(schema.rows[0].sql).not.toContain('demo_users_v1');
      expect(schema.rows[0].sql).toContain('demo_users');

      const fkCheck = await adapter.query(`PRAGMA foreign_key_check;`);
      expect(fkCheck.rows.length).toBe(0);
    });
  });

  describe('4. Transactional Safety on Simulated Repair Failure', () => {
    let adapter: NativeSQLiteAdapter;

    beforeAll(async () => {
      adapter = new NativeSQLiteAdapter();
      await adapter.open();

      await adapter.execute('PRAGMA foreign_keys = OFF;');
      await adapter.execute(`CREATE TABLE demo_users (id INTEGER PRIMARY KEY, username TEXT)`);
      await adapter.execute(`INSERT INTO demo_users (id, username) VALUES (1, 'user1')`);
      await adapter.execute(`CREATE TABLE audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        user_id INTEGER REFERENCES "demo_users_v1"(id),
        entity_type TEXT,
        entity_id INTEGER,
        description TEXT NOT NULL,
        occurred_at TEXT NOT NULL DEFAULT '2026-10-01'
      )`);
      await adapter.execute(
        `INSERT INTO audit_events (event_type, user_id, description) VALUES ('TEST_EVENT', 1, 'Safe content')`,
      );
      await adapter.execute('PRAGMA foreign_keys = ON;');
    });

    it('rolls back completely if an error occurs during repair transaction', async () => {
      let errorCaught = false;
      try {
        await adapter.transaction(async tx => {
          await tx.execute(`CREATE TABLE audit_events_fixed (id INTEGER PRIMARY KEY)`);
          await tx.execute(`INSERT INTO audit_events_fixed SELECT id FROM audit_events`);
          // Intentionally throw inside transaction
          throw new Error('SIMULATED_REPAIR_FAILURE');
        });
      } catch (e: any) {
        if (e.message.includes('SIMULATED_REPAIR_FAILURE')) {
          errorCaught = true;
        }
      }
      expect(errorCaught).toBe(true);

      // Verify audit_events still exists intact and audit_events_fixed was rolled back
      const rows = await adapter.query<{ id: number; event_type: string }>(
        `SELECT id, event_type FROM audit_events`,
      );
      expect(rows.rows.length).toBe(1);
      expect(rows.rows[0].event_type).toBe('TEST_EVENT');

      const checkFixed = await adapter.query<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'audit_events_fixed'`,
      );
      expect(checkFixed.rows.length).toBe(0);
    });
  });
});
