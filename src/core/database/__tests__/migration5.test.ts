// Migration 5 Regression Test
// Verifies foreign-key integrity and data preservation after applying migration 5.

import { AesGuardianDatabase, MIGRATIONS } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';

/** Helper to run migrations up to a specific version */
async function initializeUpTo(version: number, db: AesGuardianDatabase) {
  // Use the exported MIGRATIONS array to apply only up to the given version.
  const filtered = MIGRATIONS.filter(m => m.version <= version);
  // Temporarily assign to the db instance for initialization.
  (db as any).MIGRATIONS = filtered;
  await db.initialize();
  // Restore full migrations for later use.
  (db as any).MIGRATIONS = MIGRATIONS;
}

describe('Migration 5 foreign key integrity', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  beforeAll(async () => {
    // Use genuine Native SQLite in-memory instance to test actual SQLite foreign-key behavior
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    // Apply migrations 1‑4 only
    await initializeUpTo(4, db);
  });

  afterAll(async () => {
    adapter?.close();
  });

  test('data survives migration 5', async () => {
    // Insert demo users
    const userIds: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const res = await db.run(
        `INSERT INTO demo_users (username, display_name, role) VALUES (?, ?, ?)`,
        [`demo${i}`, `Demo ${i}`, 'exposed_professional'],
      );
      userIds.push(res.insertId as number);
    }

    // Insert AES declarations with various statuses
    const declIds: number[] = [];
    const statuses = ['draft', 'submitted', 'under_review', 'closed', 'draft', 'submitted'];
    for (let i = 0; i < statuses.length; i++) {
      const res = await db.run(
        `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status) VALUES (?, ?, ?, ?, ?)`,
        [`REF${i}`, userIds[i % userIds.length], '2023-01-01', 'percutaneous_exposure', statuses[i]],
      );
      declIds.push(res.insertId as number);
    }

    // Insert administrative reviews linked to declarations
    const reviewIds: number[] = [];
    for (const declId of declIds) {
      const res = await db.run(
        `INSERT INTO administrative_reviews (declaration_id, reviewer_user_id, outcome) VALUES (?, ?, ?)`,
        [declId, userIds[0], 'acknowledged'],
      );
      reviewIds.push(res.insertId as number);
    }

    // Snapshot IDs for later comparison
    const snapshot = {
      users: [...userIds],
      declarations: [...declIds],
      reviews: [...reviewIds],
    };

    // Apply migration 5 specifically
    await initializeUpTo(5, db);

    // Verify migration version recorded as 5
    const versionRow = await db.get(`SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1`);
    expect(versionRow.version).toBe(5);

    // Verify original rows still exist
    for (const userId of snapshot.users) {
      const row = await db.get(`SELECT * FROM demo_users WHERE id = ?`, [userId]);
      expect(row).toBeDefined();
    }
    for (const declId of snapshot.declarations) {
      const row = await db.get(`SELECT * FROM aes_declarations WHERE id = ?`, [declId]);
      expect(row).toBeDefined();
    }
    for (const revId of snapshot.reviews) {
      const row = await db.get(`SELECT * FROM administrative_reviews WHERE id = ?`, [revId]);
      expect(row).toBeDefined();
    }

    // Foreign‑key checks – should be empty
    const fkCheck = await db.all(`PRAGMA foreign_key_check`);
    expect(fkCheck.length).toBe(0);

    // Verify FK lists for new tables
    const adminFk = await db.all(`PRAGMA foreign_key_list(administrative_reviews)`);
    expect(adminFk.some((fk: any) => fk.table === 'aes_declarations')).toBeTruthy();

    const corrFk = await db.all(`PRAGMA foreign_key_list(correction_responses)`);
    const expectedTables = ['aes_declarations', 'administrative_reviews', 'demo_users'];
    expectedTables.forEach(tbl => {
      expect(corrFk.some((fk: any) => fk.table === tbl)).toBeTruthy();
    });

    // Index existence checks
    const indexes = await db.all(`SELECT name FROM sqlite_master WHERE type='index'`);
    const indexNames = indexes.map((i: any) => i.name);
    expect(indexNames).toContain('idx_aes_declarations_status');
    expect(indexNames).toContain('idx_aes_declarations_user');
    expect(indexNames).toContain('idx_corr_resp_decl');

    // Verify database constraint: UNIQUE constraint on correction_responses(review_id)
    await db.run(
      `INSERT INTO correction_responses (declaration_id, review_id, responding_user_id, response_text) VALUES (?, ?, ?, ?)`,
      [declIds[0], reviewIds[0], userIds[0], 'First response'],
    );
    await expect(
      db.run(
        `INSERT INTO correction_responses (declaration_id, review_id, responding_user_id, response_text) VALUES (?, ?, ?, ?)`,
        [declIds[0], reviewIds[0], userIds[0], 'Duplicate response'],
      ),
    ).rejects.toThrow();

    // Re‑run initialization – version row should not duplicate
    await db.initialize();
    const versions = await db.all(`SELECT version FROM schema_versions`);
    const versionCounts = versions.reduce((acc: any, row: any) => {
      acc[row.version] = (acc[row.version] || 0) + 1;
      return acc;
    }, {});
    expect(versionCounts[5]).toBe(1);
  });
});
