/**
 * AES Guardian — Synthetic Demonstration Reset Test Suite (Phase 2D.1)
 *
 * Exhaustively verifies:
 * - Authorized reset by tech_admin (userId = 5).
 * - Unauthorized reset attempts by other roles and invalid users.
 * - Complete removal of modified / appended records across all tables.
 * - Standard scenario reseeding (4 declarations, 5 CAPAs).
 * - Preservation of referential integrity (PRAGMA foreign_key_check = 0).
 * - DEMO_DATA_RESET audit record creation with timestamp, actor, and summary.
 * - Atomic transaction rollback on injected failure (no partial erase / partial reseed).
 * - Idempotency and repeated resets produce identical baseline dataset.
 */

import { AesGuardianDatabase } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';
import { seedDemoScenarioIfEmpty } from '../demo-scenario-seeder';

describe('AES Guardian — Synthetic Demonstration Reset (resetDemoScenario)', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;
  const TECH_ADMIN_ID = 5;
  const EXPOSED_ID = 1;
  const ADMIN_ID = 2;
  const OH_ID = 3;
  const QUALITY_ID = 4;

  beforeEach(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();
    await seedDemoScenarioIfEmpty(db);
  });

  afterEach(async () => {
    await adapter.close();
  });

  // ─── 1. Authorization ──────────────────────────────────────────

  describe('Authorization checks', () => {
    test('prohibits exposed_professional from resetting demo scenario', async () => {
      await expect(db.resetDemoScenario(EXPOSED_ID)).rejects.toThrow(
        /Unauthorized: only tech_admin/i,
      );
    });

    test('prohibits admin_reviewer from resetting demo scenario', async () => {
      await expect(db.resetDemoScenario(ADMIN_ID)).rejects.toThrow(
        /Unauthorized: only tech_admin/i,
      );
    });

    test('prohibits oh_professional from resetting demo scenario', async () => {
      await expect(db.resetDemoScenario(OH_ID)).rejects.toThrow(
        /Unauthorized: only tech_admin/i,
      );
    });

    test('prohibits quality_staff from resetting demo scenario', async () => {
      await expect(db.resetDemoScenario(QUALITY_ID)).rejects.toThrow(
        /Unauthorized: only tech_admin/i,
      );
    });

    test('prohibits unknown user ID from resetting demo scenario', async () => {
      await expect(db.resetDemoScenario(9999)).rejects.toThrow(
        /Unauthorized: only tech_admin/i,
      );
    });

    test('allows tech_admin to successfully reset demo scenario', async () => {
      const res = await db.resetDemoScenario(TECH_ADMIN_ID);
      expect(res.success).toBe(true);
      expect(res.declarationsCount).toBe(4);
      expect(res.preventionActionsCount).toBe(5);
      expect(res.resetAt).toBeDefined();
    });
  });

  // ─── 2. Data Removal & Reseeding ────────────────────────────────

  describe('Data Removal & Standard Reseeding', () => {
    test('removes user modifications and restores pristine baseline', async () => {
      // 1. Add extra declaration, review, coordination, follow-up, and CAPA
      const extraDecl = await db.execute(
        `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
         VALUES ('AES-2026-CUSTOM-99', 1, '2026-11-12', 'other', 'submitted')`,
      );
      const extraDeclId = extraDecl.insertId as number;

      await db.execute(
        `INSERT INTO administrative_reviews (declaration_id, reviewer_user_id, outcome, comments, reviewed_at)
         VALUES (?, 2, 'acknowledged', 'Custom review test', '2026-11-12T10:00:00Z')`,
        [extraDeclId],
      );

      const extraCoord = await db.execute(
        `INSERT INTO oh_coordinations (declaration_id, created_by_user_id, coordination_reason, status)
         VALUES (?, 2, 'routine_followup', 'acknowledged')`,
        [extraDeclId],
      );
      const extraCoordId = extraCoord.insertId as number;

      await db.execute(
        `INSERT INTO oh_follow_up_events (coordination_id, recorded_by_user_id, event_category, event_date, created_at)
         VALUES (?, 3, 'contact_established', '2026-11-12T11:00:00Z', '2026-11-12T11:00:00Z')`,
        [extraCoordId],
      );

      await db.execute(
        `INSERT INTO prevention_actions (reference_code, title, description, action_type, contributing_factor, rationale, status, created_by_user_id)
         VALUES ('CAPA-2026-CUSTOM', 'Custom Action', 'Desc', 'preventive', 'other_factor', 'Test', 'proposed', 4)`,
      );

      // Verify custom records exist before reset
      const preDecl = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`);
      expect(preDecl.rows[0].count).toBe(5);
      const preCapa = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM prevention_actions`);
      expect(preCapa.rows[0].count).toBe(6);

      // 2. Perform authorized reset
      const resetRes = await db.resetDemoScenario(TECH_ADMIN_ID);
      expect(resetRes.success).toBe(true);

      // 3. Verify exactly 4 declarations and 5 CAPAs exist (custom removed)
      const postDecl = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`);
      expect(postDecl.rows[0].count).toBe(4);

      const postCustom = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM aes_declarations WHERE reference_number = 'AES-2026-CUSTOM-99'`,
      );
      expect(postCustom.rows[0].count).toBe(0);

      const postCapa = await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM prevention_actions`);
      expect(postCapa.rows[0].count).toBe(5);

      const postCustomCapa = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM prevention_actions WHERE reference_code = 'CAPA-2026-CUSTOM'`,
      );
      expect(postCustomCapa.rows[0].count).toBe(0);
    });

    test('preserves PRAGMA foreign_key_check without violations', async () => {
      await db.resetDemoScenario(TECH_ADMIN_ID);
      const fkCheck = await db.query(`PRAGMA foreign_key_check`);
      expect(fkCheck.rows.length).toBe(0);
    });

    test('deletes durable operation links before resetting linked CAPAs', async () => {
      const input = {
        title: 'Reset linked operation',
        description: 'Verify operation links are removed before CAPAs.',
        action_type: 'preventive' as const,
        contributing_factor: 'protective_equipment' as const,
        rationale: 'Preserve foreign-key integrity during reset.',
      };
      const operationId = '25252525-2525-4525-8525-252525252525';
      const reservation = await db.reserveCapaCreationOperation(
        QUALITY_ID,
        input,
        operationId,
        'CAPA-2026-92999',
        'new',
      );
      const action = await db.createPreventionActionForOperation(
        QUALITY_ID,
        input,
        operationId,
        reservation.reference_code,
        'new',
      );
      const linked = await db.query<{ prevention_action_id: number }>(
        `SELECT prevention_action_id FROM capa_creation_operations
         WHERE operation_id = ?`,
        [operationId],
      );
      expect(linked.rows[0].prevention_action_id).toBe(action.id);

      await db.resetDemoScenario(TECH_ADMIN_ID);

      expect((await db.query(
        `SELECT operation_id FROM capa_creation_operations`,
      )).rows).toHaveLength(0);
      expect((await db.query(`PRAGMA foreign_key_check`)).rows).toHaveLength(0);
    });

    test('records DEMO_DATA_RESET audit event with user 5 and timestamp', async () => {
      const resetRes = await db.resetDemoScenario(TECH_ADMIN_ID);

      const resetEvents = await db.query<{
        event_type: string;
        user_id: number;
        entity_type: string;
        description: string;
        occurred_at: string;
      }>(
        `SELECT event_type, user_id, entity_type, description, occurred_at
         FROM audit_events
         WHERE event_type = 'DEMO_DATA_RESET'`,
      );

      expect(resetEvents.rows.length).toBeGreaterThanOrEqual(1);
      const latest = resetEvents.rows[resetEvents.rows.length - 1];
      expect(latest.event_type).toBe('DEMO_DATA_RESET');
      expect(latest.user_id).toBe(TECH_ADMIN_ID);
      expect(latest.entity_type).toBe('system');
      expect(latest.description).toContain('Réinitialisation');
      expect(latest.occurred_at).toBe(resetRes.resetAt);
    });

    test('idempotency: repeated resets produce identical baseline state', async () => {
      await db.resetDemoScenario(TECH_ADMIN_ID);
      const run1Decl = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      const run1Capa = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM prevention_actions`)).rows[0].count;

      await db.resetDemoScenario(TECH_ADMIN_ID);
      const run2Decl = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      const run2Capa = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM prevention_actions`)).rows[0].count;

      expect(run1Decl).toBe(4);
      expect(run2Decl).toBe(4);
      expect(run1Capa).toBe(5);
      expect(run2Capa).toBe(5);

      const fkCheck = await db.query(`PRAGMA foreign_key_check`);
      expect(fkCheck.rows.length).toBe(0);
    });
  });

  // ─── 3. Transaction Rollback & Failure Safety ────────────────────

  describe('Transaction Rollback on Injected Failure', () => {
    test('rolls back completely if an error occurs during reset transaction', async () => {
      // Create a sentinel declaration
      await db.execute(
        `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
         VALUES ('AES-SENTINEL-01', 1, '2026-11-12', 'other', 'submitted')`,
      );

      const countBefore = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      expect(countBefore).toBe(5);

      // Intercept tx.execute inside transaction to inject failure during delete
      const originalTransaction = adapter.transaction.bind(adapter);
      adapter.transaction = async (fn: any) => {
        return originalTransaction(async (tx: any) => {
          const originalTxExec = tx.execute;
          tx.execute = async (sql: string, params?: any[]) => {
            if (sql.includes('prevention_actions') && sql.includes('DELETE')) {
              throw new Error('Injected Disk/I/O Failure during delete');
            }
            return originalTxExec(sql, params);
          };
          return fn(tx);
        });
      };

      await expect(db.resetDemoScenario(TECH_ADMIN_ID)).rejects.toThrow(
        'Injected Disk/I/O Failure during delete',
      );

      // Restore transaction
      adapter.transaction = originalTransaction;

      // Verify that the database was NOT partially wiped; sentinel declaration is still intact!
      const countAfter = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      expect(countAfter).toBe(countBefore);

      const sentinel = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM aes_declarations WHERE reference_number = 'AES-SENTINEL-01'`,
      );
      expect(sentinel.rows[0].count).toBe(1);
    });

    test('rolls back completely when failure is injected specifically during DEMO_DATA_RESET audit insertion', async () => {
      // 1. Create a full set of pre-reset records spanning every operational table
      const declRes = await db.execute(
        `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
         VALUES ('AES-CUSTOM-ROLLBACK-01', 1, '2026-11-13', 'percutaneous_exposure', 'submitted')`,
      );
      const customDeclId = declRes.insertId as number;

      const reviewRes = await db.execute(
        `INSERT INTO administrative_reviews (declaration_id, reviewer_user_id, outcome, comments, reviewed_at)
         VALUES (?, 2, 'acknowledged', 'Pre-reset custom review', '2026-11-13T10:00:00Z')`,
        [customDeclId],
      );

      // Get review_id for declaration 2 (which is in correction_requested status)
      const decl2Review = await db.query<{ id: number }>(
        `SELECT r.id FROM administrative_reviews r
         JOIN aes_declarations d ON d.id = r.declaration_id
         WHERE d.reference_number = 'AES-2026-DEMO-02'`,
      );
      const decl2ReviewId = decl2Review.rows[0].id;

      await db.execute(
        `INSERT INTO correction_responses (declaration_id, review_id, responding_user_id, response_text, responded_at)
         VALUES (2, ?, 1, 'Pre-reset custom correction response', '2026-11-13T10:05:00Z')`,
        [decl2ReviewId],
      );

      const coordRes = await db.execute(
        `INSERT INTO oh_coordinations (declaration_id, created_by_user_id, coordination_reason, status)
         VALUES (?, 2, 'routine_followup', 'acknowledged')`,
        [customDeclId],
      );
      const customCoordId = coordRes.insertId as number;

      await db.execute(
        `INSERT INTO oh_follow_up_events (coordination_id, recorded_by_user_id, event_category, event_date, created_at)
         VALUES (?, 3, 'contact_established', '2026-11-13T10:10:00Z', '2026-11-13T10:10:00Z')`,
        [customCoordId],
      );

      await db.execute(
        `INSERT INTO prevention_actions (reference_code, title, description, action_type, contributing_factor, rationale, status, created_by_user_id)
         VALUES ('CAPA-CUSTOM-ROLLBACK', 'Custom Pre-reset CAPA', 'Desc', 'preventive', 'other_factor', 'Rationale', 'proposed', 4)`,
      );

      // Verify and record pre-reset counts across all tables
      const preDecl = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM aes_declarations`)).rows[0].c;
      const preReview = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM administrative_reviews`)).rows[0].c;
      const preCorr = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM correction_responses`)).rows[0].c;
      const preCoord = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM oh_coordinations`)).rows[0].c;
      const preEvent = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM oh_follow_up_events`)).rows[0].c;
      const preCapa = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM prevention_actions`)).rows[0].c;
      const preAudit = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM audit_events`)).rows[0].c;

      expect(preDecl).toBe(5);    // 4 standard + 1 custom
      expect(preReview).toBe(4);  // 3 standard + 1 custom
      expect(preCorr).toBe(1);    // 0 standard + 1 custom
      expect(preCoord).toBe(3);   // 2 standard + 1 custom
      expect(preEvent).toBe(6);   // 5 standard + 1 custom
      expect(preCapa).toBe(6);    // 5 standard + 1 custom

      // 2. Intercept tx.execute to inject failure ONLY on DEMO_DATA_RESET audit insert
      const originalTransaction = adapter.transaction.bind(adapter);
      adapter.transaction = async (fn: any) => {
        return originalTransaction(async (tx: any) => {
          const originalTxExec = tx.execute;
          tx.execute = async (sql: string, params?: any[]) => {
            if (sql.includes('DEMO_DATA_RESET')) {
              throw new Error('Simulated crash during DEMO_DATA_RESET audit log insertion');
            }
            return originalTxExec(sql, params);
          };
          return fn(tx);
        });
      };

      // 3. Attempt reset and expect rejection
      await expect(db.resetDemoScenario(TECH_ADMIN_ID)).rejects.toThrow(
        'Simulated crash during DEMO_DATA_RESET audit log insertion',
      );

      // Restore adapter
      adapter.transaction = originalTransaction;

      // 4. Verify that ALL original records across all 7 tables remain intact
      const postDecl = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM aes_declarations`)).rows[0].c;
      const postReview = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM administrative_reviews`)).rows[0].c;
      const postCorr = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM correction_responses`)).rows[0].c;
      const postCoord = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM oh_coordinations`)).rows[0].c;
      const postEvent = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM oh_follow_up_events`)).rows[0].c;
      const postCapa = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM prevention_actions`)).rows[0].c;
      const postAudit = (await db.query<{ c: number }>(`SELECT COUNT(*) as c FROM audit_events`)).rows[0].c;

      expect(postDecl).toBe(preDecl);
      expect(postReview).toBe(preReview);
      expect(postCorr).toBe(preCorr);
      expect(postCoord).toBe(preCoord);
      expect(postEvent).toBe(preEvent);
      expect(postCapa).toBe(preCapa);
      expect(postAudit).toBe(preAudit);

      // Verify specific custom entries survived rollback
      const customDecl = await db.query(
        `SELECT id FROM aes_declarations WHERE reference_number = 'AES-CUSTOM-ROLLBACK-01'`,
      );
      expect(customDecl.rows).toHaveLength(1);

      const customCapa = await db.query(
        `SELECT id FROM prevention_actions WHERE reference_code = 'CAPA-CUSTOM-ROLLBACK'`,
      );
      expect(customCapa.rows).toHaveLength(1);

      // 5. Verify NO partial DEMO_DATA_RESET audit record exists
      const resetAudits = await db.query(
        `SELECT id FROM audit_events WHERE event_type = 'DEMO_DATA_RESET'`,
      );
      expect(resetAudits.rows).toHaveLength(0);

      // 6. Verify PRAGMA foreign_key_check passes with 0 violations
      const fkCheck = await db.query(`PRAGMA foreign_key_check`);
      expect(fkCheck.rows).toHaveLength(0);
    });
  });
});
