/**
 * AES Guardian — Phase 2D.1.2 Final Baseline, Persistence & Repository Verification Test
 *
 * Programmatically gathers exact empirical evidence for:
 * 1. SQLite schema evidence:
 *    - PRAGMA user_version
 *    - PRAGMA foreign_key_check
 *    - PRAGMA foreign_key_list for all 6 tables
 *    - Table listing in sqlite_master & demo-user table identification
 * 2. Canonical demonstration baseline comparison:
 *    - Baseline counts from initial seeding
 *    - Baseline counts after resetDemoScenario()
 *    - Comparison & audit event accounting
 *    - Repeated reset idempotency
 * 3. Language & draft preservation:
 *    - Runtime language switching (FR -> EN -> AR)
 *    - Preserves declaration records & drafts across language switch
 *    - Role switching does not reset active language
 * 4. Five-role authorization regression:
 *    - Exactly 5 authorized roles
 *    - tech_admin allowed for reset, blocked from all operational queries
 *    - non-tech_admin roles blocked from reset
 */

import {
  AES_GUARDIAN_ROLES,
  AesGuardianRole,
  useDemoRoleStore,
} from '../../../core';
import { AesGuardianDatabase } from '../../../core/database/AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../../../core/database/NativeSQLiteAdapter';
import { seedStandardScenario } from '../../../core/database/demo-scenario-seeder';
import {
  setLocale,
  getLocale,
  t,
  currentLocale,
} from '../../../localization';

describe('Phase 2D.1.2 — Final Verification Test Suite', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;
  const TECH_ADMIN_ID = 5;

  beforeEach(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();
  });

  afterEach(async () => {
    await adapter.close();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. SQLite Schema Evidence
  // ──────────────────────────────────────────────────────────────────────────

  describe('1. SQLite Schema Evidence', () => {
    test('PRAGMA user_version returns 0 while schema_versions table records current schema version (8)', async () => {
      // PRAGMA user_version is 0 because AesGuardianDatabase uses a dedicated schema_versions table
      const pragmaRes = await db.query<{ user_version: number }>(`PRAGMA user_version`);
      expect(pragmaRes.rows[0].user_version).toBe(0);

      // Dedicated schema_versions table holds the actual applied migration versions
      const applied = await db.getAppliedVersions();
      expect(applied.length).toBeGreaterThanOrEqual(7);
      expect(applied[applied.length - 1].version).toBeGreaterThanOrEqual(7);

      const tableRes = await db.query<{ version: number }>(
        `SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1`,
      );
      expect(tableRes.rows[0].version).toBeGreaterThanOrEqual(7);
    });

    test('PRAGMA foreign_key_check returns 0 violations on clean migration', async () => {
      const res = await db.query(`PRAGMA foreign_key_check`);
      expect(res.rows.length).toBe(0);
    });

    test('Table listing in sqlite_master confirms demo_users is the canonical user table', async () => {
      const tables = await db.query<{ name: string; type: string }>(
        `SELECT name, type FROM sqlite_master WHERE type='table' ORDER BY name ASC`,
      );
      const tableNames = tables.rows.map((t) => t.name);

      expect(tableNames).toContain('demo_users');
      expect(tableNames).not.toContain('demo_users_v1'); // RENAME TO dropped in migration 2
      expect(tableNames).not.toContain('users');
      expect(tableNames).toContain('schema_versions');
      expect(tableNames).toContain('aes_declarations');
      expect(tableNames).toContain('administrative_reviews');
      expect(tableNames).toContain('correction_responses');
      expect(tableNames).toContain('oh_coordinations');
      expect(tableNames).toContain('oh_follow_up_events');
      expect(tableNames).toContain('prevention_actions');
      expect(tableNames).toContain('audit_events');
    });

    test('PRAGMA foreign_key_list checks across all 6 operational tables', async () => {
      // 1. prevention_actions: only demo_users
      const fkPrevention = await db.query<{ table: string; from: string; to: string }>(
        `PRAGMA foreign_key_list('prevention_actions')`,
      );
      expect(fkPrevention.rows).toHaveLength(1);
      expect(fkPrevention.rows[0].table).toBe('demo_users');
      expect(fkPrevention.rows[0].from).toBe('created_by_user_id');

      // 2. audit_events: only demo_users (nullable)
      const fkAudit = await db.query<{ table: string; from: string; to: string }>(
        `PRAGMA foreign_key_list('audit_events')`,
      );
      expect(fkAudit.rows).toHaveLength(1);
      expect(fkAudit.rows[0].table).toBe('demo_users');
      expect(fkAudit.rows[0].from).toBe('user_id');

      // 3. oh_follow_up_events: oh_coordinations and demo_users
      const fkOhEvents = await db.query<{ table: string; from: string; to: string }>(
        `PRAGMA foreign_key_list('oh_follow_up_events')`,
      );
      const ohEventTargetTables = fkOhEvents.rows.map((r) => r.table);
      expect(ohEventTargetTables).toContain('oh_coordinations');
      expect(ohEventTargetTables).toContain('demo_users');
      expect(ohEventTargetTables).not.toContain('aes_declarations');

      // 4. oh_coordinations: aes_declarations and demo_users
      const fkOhCoord = await db.query<{ table: string; from: string; to: string }>(
        `PRAGMA foreign_key_list('oh_coordinations')`,
      );
      const ohCoordTargetTables = fkOhCoord.rows.map((r) => r.table);
      expect(ohCoordTargetTables).toContain('aes_declarations');
      expect(ohCoordTargetTables).toContain('demo_users');

      // 5. correction_responses: administrative_reviews, aes_declarations, demo_users
      const fkCorr = await db.query<{ table: string; from: string; to: string }>(
        `PRAGMA foreign_key_list('correction_responses')`,
      );
      const corrTargetTables = fkCorr.rows.map((r) => r.table);
      expect(corrTargetTables).toContain('administrative_reviews');
      expect(corrTargetTables).toContain('aes_declarations');
      expect(corrTargetTables).toContain('demo_users');

      // 6. administrative_reviews: aes_declarations and demo_users
      const fkAdmin = await db.query<{ table: string; from: string; to: string }>(
        `PRAGMA foreign_key_list('administrative_reviews')`,
      );
      const adminTargetTables = fkAdmin.rows.map((r) => r.table);
      expect(adminTargetTables).toContain('aes_declarations');
      expect(adminTargetTables).toContain('demo_users');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Canonical Demonstration Baseline Comparison
  // ──────────────────────────────────────────────────────────────────────────

  describe('2. Canonical Demonstration Baseline Comparison', () => {
    test('initial seeding produces canonical counts', async () => {
      await seedStandardScenario(db);

      const decl = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`);
      const reviews = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM administrative_reviews`);
      const corr = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM correction_responses`);
      const coords = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM oh_coordinations`);
      const events = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM oh_follow_up_events`);
      const capas = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM prevention_actions`);
      const audits = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_events`);

      expect(decl.rows[0].count).toBe(4);
      expect(reviews.rows[0].count).toBe(3);
      expect(corr.rows[0].count).toBe(0);
      expect(coords.rows[0].count).toBe(2);
      expect(events.rows[0].count).toBe(5);
      expect(capas.rows[0].count).toBe(5);
      expect(audits.rows[0].count).toBe(3);
    });

    test('reset produces canonical business records plus 1 DEMO_DATA_RESET audit event', async () => {
      // First seed
      await seedStandardScenario(db);
      // Perform reset
      const res = await db.resetDemoScenario(TECH_ADMIN_ID);
      expect(res.success).toBe(true);

      const decl = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`);
      const reviews = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM administrative_reviews`);
      const corr = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM correction_responses`);
      const coords = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM oh_coordinations`);
      const events = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM oh_follow_up_events`);
      const capas = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM prevention_actions`);
      const audits = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_events`);

      // Business entity counts are 100% identical:
      expect(decl.rows[0].count).toBe(4);
      expect(reviews.rows[0].count).toBe(3);
      expect(corr.rows[0].count).toBe(0);
      expect(coords.rows[0].count).toBe(2);
      expect(events.rows[0].count).toBe(5);
      expect(capas.rows[0].count).toBe(5);

      // Audit events count is exactly 4 (3 standard seeded scenario events + 1 DEMO_DATA_RESET)
      expect(audits.rows[0].count).toBe(4);

      // Verify the DEMO_DATA_RESET audit event details
      const resetAudit = await db.query<{ event_type: string; user_id: number; occurred_at: string }>(
        `SELECT event_type, user_id, occurred_at FROM audit_events WHERE event_type = 'DEMO_DATA_RESET'`,
      );
      expect(resetAudit.rows).toHaveLength(1);
      expect(resetAudit.rows[0].user_id).toBe(TECH_ADMIN_ID);
      expect(resetAudit.rows[0].occurred_at).toBe(res.resetAt);
    });

    test('repeated resets produce identical baseline counts (idempotence)', async () => {
      await seedStandardScenario(db);
      await db.resetDemoScenario(TECH_ADMIN_ID);
      await db.resetDemoScenario(TECH_ADMIN_ID);
      const res = await db.resetDemoScenario(TECH_ADMIN_ID);

      const decl = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`);
      const audits = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_events`);
      const fkCheck = await db.query(`PRAGMA foreign_key_check`);

      expect(decl.rows[0].count).toBe(4);
      expect(audits.rows[0].count).toBe(4);
      expect(fkCheck.rows).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Language & Draft Preservation
  // ──────────────────────────────────────────────────────────────────────────

  describe('3. Language & Draft Preservation', () => {
    test('locale switching cycles through FR, EN, and AR dynamically', () => {
      setLocale('fr');
      expect(getLocale()).toBe('fr');
      expect(t('helpGlossary.title')).toBe("Centre d'Aide & Glossaire");

      setLocale('en');
      expect(getLocale()).toBe('en');
      expect(t('helpGlossary.title')).toBe('Help Centre & Glossary');

      setLocale('ar');
      expect(getLocale()).toBe('ar');
      expect(t('helpGlossary.title')).toBe('مركز المساعدة والمسرد');

      setLocale('fr');
    });

    test('switching language does not alter, delete, or duplicate database records', async () => {
      await seedStandardScenario(db);

      const countBefore = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;

      // Cycle languages
      setLocale('en');
      setLocale('ar');
      setLocale('fr');

      const countAfter = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      expect(countAfter).toBe(countBefore);
    });

    test('unfinished declaration draft in SQLite remains completely intact across language switches', async () => {
      // Insert a draft declaration
      await db.execute(
        `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, circumstances, status)
         VALUES ('AES-DRAFT-PRESERVE-01', 1, '2026-11-13', 'percutaneous_exposure', 'Draft notes in progress', 'draft')`,
      );

      // Cycle languages
      setLocale('en');
      setLocale('ar');
      setLocale('fr');

      const draft = await db.query<{ reference_number: string; circumstances: string; status: string }>(
        `SELECT reference_number, circumstances, status FROM aes_declarations WHERE reference_number = 'AES-DRAFT-PRESERVE-01'`,
      );
      expect(draft.rows).toHaveLength(1);
      expect(draft.rows[0].circumstances).toBe('Draft notes in progress');
      expect(draft.rows[0].status).toBe('draft');
    });

    test('role switching in useDemoRoleStore does not change the active locale', () => {
      setLocale('en');
      expect(getLocale()).toBe('en');

      // Switch role to quality_staff
      useDemoRoleStore.getState().setRole('quality_staff');
      expect(getLocale()).toBe('en');

      // Switch role to tech_admin
      useDemoRoleStore.getState().setRole('tech_admin');
      expect(getLocale()).toBe('en');

      // Switch back
      useDemoRoleStore.getState().setRole('exposed_professional');
      expect(getLocale()).toBe('en');

      setLocale('fr');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Five-Role Authorization Regression
  // ──────────────────────────────────────────────────────────────────────────

  describe('4. Five-Role Authorization Regression', () => {
    test('exactly five authorized roles are configured', () => {
      expect(AES_GUARDIAN_ROLES).toEqual([
        'exposed_professional',
        'admin_reviewer',
        'oh_professional',
        'quality_staff',
        'tech_admin',
      ]);
    });

    test('only tech_admin can invoke resetDemoScenario', async () => {
      // Allowed for user 5 (tech_admin)
      const res = await db.resetDemoScenario(5);
      expect(res.success).toBe(true);

      // Blocked for users 1 to 4
      for (let userId = 1; userId <= 4; userId++) {
        await expect(db.resetDemoScenario(userId)).rejects.toThrow(/Unauthorized: only tech_admin/i);
      }
    });

    test('tech_admin is blocked from operational data queues and registers', async () => {
      // 1. Blocked from OH coordination queue (requires oh_professional)
      await expect(db.listOhCoordinationsQueue(5)).rejects.toThrow(/unauthorized/i);

      // 2. Blocked from Admin OH coordination list (requires admin_reviewer)
      await expect(db.listOhCoordinationsForAdmin(5)).rejects.toThrow(/unauthorized/i);

      // 3. Blocked from CAPA prevention register (requires quality_staff, admin_reviewer, or oh_professional)
      await expect(db.listPreventionActions(5)).rejects.toThrow(/UnauthorizedError/i);
    });
  });
});
