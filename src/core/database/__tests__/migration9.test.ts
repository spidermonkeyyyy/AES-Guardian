import { AesGuardianDatabase, MIGRATIONS } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';

async function initializeUpTo(
  version: number,
  db: AesGuardianDatabase,
): Promise<void> {
  const filtered = MIGRATIONS.filter(migration => migration.version <= version);
  (db as any).MIGRATIONS = filtered;
  await db.initialize();
  (db as any).MIGRATIONS = MIGRATIONS;
}

describe('Migration 9 - Durable CAPA operation identity', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  beforeEach(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
  });

  afterEach(async () => {
    adapter.close();
  });

  test('runs from schema version 8 and preserves existing CAPA rows', async () => {
    await initializeUpTo(8, db);
    const quality = await db.run(
      `INSERT INTO demo_users (username, display_name, role)
       VALUES ('migration9.quality', 'Migration Quality', 'quality_staff')`,
    );
    const legacy = await db.run(
      `INSERT INTO prevention_actions
       (reference_code, title, description, action_type, contributing_factor,
        rationale, status, created_by_user_id)
       VALUES ('CAPA-2026-00001', 'Legacy CAPA', 'Preserved migration record',
               'corrective', 'other_factor', 'Legacy rationale', 'proposed', ?)`,
      [quality.insertId],
    );

    await db.initialize();

    expect((await db.getAppliedVersions()).at(-1)?.version).toBe(10);
    const table = await db.query<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'capa_creation_operations'`,
    );
    expect(table.rows).toHaveLength(1);
    const preserved = await db.query(
      `SELECT * FROM prevention_actions WHERE id = ?`,
      [legacy.insertId],
    );
    expect(preserved.rows).toHaveLength(1);
    expect((preserved.rows[0] as any).reference_code).toBe('CAPA-2026-00001');

    const operationRows = await db.query(
      `SELECT * FROM capa_creation_operations`,
    );
    expect(operationRows.rows).toHaveLength(0);
    const operationColumns = await db.all(`PRAGMA table_info(capa_creation_operations)`);
    expect(operationColumns.map((column: any) => column.name)).toContain('acknowledged_at');
  });

  test('new operation table enforces unique operation IDs, references and pending creators', async () => {
    await db.initialize();
    const quality = await db.run(
      `INSERT INTO demo_users (username, display_name, role)
       VALUES ('migration9.unique', 'Migration Unique', 'quality_staff')`,
    );
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO capa_creation_operations
       (operation_id, created_by_user_id, payload_json, payload_hash, reference_code,
        status, prevention_action_id, created_at, updated_at)
       VALUES ('operation-one', ?, '{}', 'hash-one', 'CAPA-2026-92001',
               'pending', NULL, ?, ?)`,
      [quality.insertId, now, now],
    );

    await expect(
      db.run(
        `INSERT INTO capa_creation_operations
         (operation_id, created_by_user_id, payload_json, payload_hash, reference_code,
          status, prevention_action_id, created_at, updated_at)
         VALUES ('operation-two', ?, '{}', 'hash-two', 'CAPA-2026-92002',
                 'pending', NULL, ?, ?)`,
        [quality.insertId, now, now],
      ),
    ).rejects.toThrow();

    await expect(
      db.run(
        `INSERT INTO capa_creation_operations
         (operation_id, created_by_user_id, payload_json, payload_hash, reference_code,
          status, prevention_action_id, created_at, updated_at)
         VALUES ('operation-three', ?, '{}', 'hash-three', 'CAPA-2026-92001',
                 'committed', NULL, ?, ?)`,
        [quality.insertId, now, now],
      ),
    ).rejects.toThrow();
  });

  test('fresh database initialization records schema versions 9 and 10', async () => {
    await db.initialize();
    const versions = await db.getAppliedVersions();
    expect(versions.map(version => version.version)).toContain(9);
    expect(versions.map(version => version.version)).toContain(10);
  });

  test('Migration 10 preserves v9 pending and committed operations with null acknowledgement', async () => {
    await initializeUpTo(9, db);
    const quality = await db.run(
      `INSERT INTO demo_users (username, display_name, role)
       VALUES ('migration10.quality', 'Migration10 Quality', 'quality_staff')`,
    );
    const legacy = await db.run(
      `INSERT INTO prevention_actions
       (reference_code, title, description, action_type, contributing_factor,
        rationale, status, created_by_user_id)
       VALUES ('CAPA-2026-LEGACY', 'Legacy', 'Legacy unchanged',
               'corrective', 'other_factor', 'Legacy rationale', 'proposed', ?)`,
      [quality.insertId],
    );
    const linked = await db.run(
      `INSERT INTO prevention_actions
       (reference_code, title, description, action_type, contributing_factor,
        rationale, status, created_by_user_id)
       VALUES ('CAPA-2026-93001', 'Linked', 'Linked committed operation',
               'preventive', 'protective_equipment', 'Committed rationale',
               'proposed', ?)`,
      [quality.insertId],
    );
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO capa_creation_operations
       (operation_id, created_by_user_id, payload_json, payload_hash, reference_code,
        status, prevention_action_id, created_at, updated_at)
       VALUES ('operation-pending', ?, '{}', 'pending-hash', 'CAPA-2026-93002',
               'pending', NULL, ?, ?)`,
      [quality.insertId, now, now],
    );
    await db.run(
      `INSERT INTO capa_creation_operations
       (operation_id, created_by_user_id, payload_json, payload_hash, reference_code,
        status, prevention_action_id, created_at, updated_at)
       VALUES ('operation-committed', ?, '{}', 'committed-hash', 'CAPA-2026-93001',
               'committed', ?, ?, ?)`,
      [quality.insertId, linked.insertId, now, now],
    );

    await db.initialize();

    const pending = await db.get(
      `SELECT * FROM capa_creation_operations WHERE operation_id = 'operation-pending'`,
    );
    const committed = await db.get(
      `SELECT * FROM capa_creation_operations WHERE operation_id = 'operation-committed'`,
    );
    expect((pending as any).status).toBe('pending');
    expect((pending as any).acknowledged_at).toBeNull();
    expect((committed as any).status).toBe('committed');
    expect((committed as any).prevention_action_id).toBe(linked.insertId);
    expect((committed as any).acknowledged_at).toBeNull();
    const legacyRow = await db.get(
      `SELECT * FROM prevention_actions WHERE id = ?`,
      [legacy.insertId],
    );
    expect(legacyRow).toBeTruthy();
    const indexes = await db.all(`PRAGMA index_list(capa_creation_operations)`);
    expect(indexes.map((index: any) => index.name))
      .toContain('idx_capa_operation_unacknowledged');
  });
});
