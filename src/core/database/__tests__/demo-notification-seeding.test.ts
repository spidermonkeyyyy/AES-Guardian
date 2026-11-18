/**
 * AES Guardian — Phase 2D.2D.1: Demo Seeding and Reset Transactional Failure-Proof Verification
 *
 * Exhaustively proves:
 * 1. Granular correctness of all 4 baseline notifications, dynamic role/entity resolution, and idempotency.
 * 2. Reset rollback after destructive operations have actually executed across multiple tables.
 * 3. Complete scenario rollback after business records and partial notifications are created.
 * 4. Fail-closed and deterministic recipient resolution (missing roles, duplicate candidates, scan order).
 * 5. Correct dynamic primary-key resolution across at least three reset/reseed cycles with AUTOINCREMENT advancement.
 * 6. Referential integrity preservation (PRAGMA foreign_key_check = 0).
 *
 * Uses genuine native SQLite (NativeSQLiteAdapter) throughout.
 */

import { AesGuardianDatabase } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';
import { DatabaseService } from '../DatabaseService';
import { seedStandardScenario, seedDemoScenarioIfEmpty } from '../demo-scenario-seeder';
import {
  isTransactionExecutor,
  isTransactionalDatabase,
  type TransactionExecutor,
} from '../types';

// ─── Helper types ────────────────────────────────────────────────────────────
interface NotifRow {
  id: number;
  recipient_user_id: number;
  event_type: string;
  entity_type: string;
  entity_id: number;
  entity_reference: string | null;
  is_read: number;
  read_at: string | null;
  idempotency_key: string;
  title_key: string;
  message_key: string;
  created_at: string;
}

// ─── Shared setup ───────────────────────────────────────────────────────────

describe('AES Guardian — Phase 2D.2D.1: Transactional Failure-Proof Verification', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  // Canonical role → user ID resolved dynamically from demo_users
  let exposedUserId: number;
  let adminUserId: number;
  let ohUserId: number;
  let qualityUserId: number;
  let techAdminId: number;

  async function resolveUserIds(): Promise<void> {
    const rows = await db.query<{ id: number; role: string }>(
      `SELECT id, role FROM demo_users`,
    );
    for (const u of rows.rows) {
      if (u.role === 'exposed_professional') exposedUserId = u.id;
      else if (u.role === 'admin_reviewer') adminUserId = u.id;
      else if (u.role === 'oh_professional') ohUserId = u.id;
      else if (u.role === 'quality_staff') qualityUserId = u.id;
      else if (u.role === 'tech_admin') techAdminId = u.id;
    }
  }

  async function getAllNotifications(): Promise<NotifRow[]> {
    const result = await db.query<NotifRow>(
      `SELECT * FROM in_app_notifications ORDER BY created_at ASC, id ASC`,
    );
    return result.rows;
  }

  async function assertZeroForeignKeyViolations(): Promise<void> {
    const fkCheck = await db.query(`PRAGMA foreign_key_check;`);
    expect(fkCheck.rows.length).toBe(0);
  }

  beforeEach(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();
    await resolveUserIds();
  });

  afterEach(async () => {
    await adapter.close();
  });

  // ─── PART 1: Baseline demonstration scenario & notifications ───────────────

  describe('Part 1: Baseline notification count & granular specifications', () => {
    test('1. Exactly 4 baseline notifications exist after standard scenario seeding', async () => {
      await seedStandardScenario(db);
      const rows = await getAllNotifications();
      expect(rows).toHaveLength(4);
    });

    test('2. Notification 1: admin_reviewer receives declaration_submitted for AES-2026-DEMO-01', async () => {
      await seedStandardScenario(db);
      const rows = await getAllNotifications();
      const n = rows.find(r => r.event_type === 'declaration_submitted')!;
      expect(n).toBeDefined();
      expect(n.recipient_user_id).toBe(adminUserId);
      expect(n.entity_type).toBe('aes_declaration');
      expect(n.entity_reference).toBe('AES-2026-DEMO-01');
      expect(n.is_read).toBe(0);
      expect(n.read_at).toBeNull();
    });

    test('3. Notification 2: exposed_professional receives correction_requested for AES-2026-DEMO-02', async () => {
      await seedStandardScenario(db);
      const rows = await getAllNotifications();
      const n = rows.find(r => r.event_type === 'correction_requested')!;
      expect(n).toBeDefined();
      expect(n.recipient_user_id).toBe(exposedUserId);
      expect(n.entity_type).toBe('administrative_review');
      expect(n.entity_reference).toBe('AES-2026-DEMO-02');
      expect(n.is_read).toBe(0);
      expect(n.read_at).toBeNull();
    });

    test('4. Notification 3: oh_professional receives oh_coordination_created for AES-2026-DEMO-03', async () => {
      await seedStandardScenario(db);
      const rows = await getAllNotifications();
      const n = rows.find(r => r.event_type === 'oh_coordination_created')!;
      expect(n).toBeDefined();
      expect(n.recipient_user_id).toBe(ohUserId);
      expect(n.entity_type).toBe('oh_coordination');
      expect(n.entity_reference).toBe('AES-2026-DEMO-03');
      expect(n.is_read).toBe(1);
      expect(n.read_at).toBe('2026-11-05T10:30:00Z');
    });

    test('5. Notification 4: quality_staff receives capa_created for CAPA-2026-00001', async () => {
      await seedStandardScenario(db);
      const rows = await getAllNotifications();
      const n = rows.find(r => r.event_type === 'capa_created')!;
      expect(n).toBeDefined();
      expect(n.recipient_user_id).toBe(qualityUserId);
      expect(n.entity_type).toBe('prevention_action');
      expect(n.entity_reference).toBe('CAPA-2026-00001');
      expect(n.is_read).toBe(1);
      expect(n.read_at).toBe('2026-11-12T20:00:00Z');
    });

    test('6. Read states are correct (1 & 2 unread, 3 & 4 read)', async () => {
      await seedStandardScenario(db);
      const rows = await getAllNotifications();
      const n1 = rows.find(r => r.event_type === 'declaration_submitted')!;
      const n2 = rows.find(r => r.event_type === 'correction_requested')!;
      const n3 = rows.find(r => r.event_type === 'oh_coordination_created')!;
      const n4 = rows.find(r => r.event_type === 'capa_created')!;

      expect(n1.is_read).toBe(0);
      expect(n1.read_at).toBeNull();
      expect(n2.is_read).toBe(0);
      expect(n2.read_at).toBeNull();
      expect(n3.is_read).toBe(1);
      expect(n3.read_at).not.toBeNull();
      expect(n4.is_read).toBe(1);
      expect(n4.read_at).not.toBeNull();
    });

    test('7. All 4 notifications have valid translation keys and format-compliant idempotency keys', async () => {
      await seedStandardScenario(db);
      const rows = await getAllNotifications();
      for (const n of rows) {
        expect(n.title_key).toBeTruthy();
        expect(n.message_key).toBeTruthy();
        expect(n.idempotency_key).toMatch(/^notif:[a-z_]+:[a-z_]+:\d+:\d+$/);
      }
    });

    test('8. Dynamic recipient resolution correctly identifies target users by role', async () => {
      await seedStandardScenario(db);
      const notifications = await getAllNotifications();

      const userMap = new Map<number, string>();
      const rows = await db.query<{ id: number; role: string }>(`SELECT id, role FROM demo_users`);
      for (const u of rows.rows) userMap.set(u.id, u.role);

      expect(userMap.get(notifications.find(r => r.event_type === 'declaration_submitted')!.recipient_user_id)).toBe('admin_reviewer');
      expect(userMap.get(notifications.find(r => r.event_type === 'correction_requested')!.recipient_user_id)).toBe('exposed_professional');
      expect(userMap.get(notifications.find(r => r.event_type === 'oh_coordination_created')!.recipient_user_id)).toBe('oh_professional');
      expect(userMap.get(notifications.find(r => r.event_type === 'capa_created')!.recipient_user_id)).toBe('quality_staff');
    });

    test('9. Dynamic entity ID resolution correctly identifies target entities by stable reference', async () => {
      await seedStandardScenario(db);
      const notifications = await getAllNotifications();

      const decl1 = (await db.query<{ id: number }>(`SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-01'`)).rows[0];
      const review2 = (await db.query<{ id: number }>(
        `SELECT ar.id FROM administrative_reviews ar
         JOIN aes_declarations d ON ar.declaration_id = d.id
         WHERE d.reference_number = 'AES-2026-DEMO-02' AND ar.outcome = 'correction_requested'
         ORDER BY ar.id DESC LIMIT 1`,
      )).rows[0];
      const decl3 = (await db.query<{ id: number }>(`SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-03'`)).rows[0];
      const coord3 = (await db.query<{ id: number }>(`SELECT id FROM oh_coordinations WHERE declaration_id = ? ORDER BY id DESC LIMIT 1`, [decl3.id])).rows[0];
      const capa1 = (await db.query<{ id: number }>(`SELECT id FROM prevention_actions WHERE reference_code = 'CAPA-2026-00001'`)).rows[0];

      expect(notifications.find(r => r.event_type === 'declaration_submitted')!.entity_id).toBe(decl1.id);
      expect(notifications.find(r => r.event_type === 'correction_requested')!.entity_id).toBe(review2.id);
      expect(notifications.find(r => r.event_type === 'oh_coordination_created')!.entity_id).toBe(coord3.id);
      expect(notifications.find(r => r.event_type === 'capa_created')!.entity_id).toBe(capa1.id);
    });

    test('10. Seeding is idempotent and keys are unique across the dataset', async () => {
      await seedStandardScenario(db);
      await seedStandardScenario(db);
      const rows = await getAllNotifications();
      expect(rows).toHaveLength(4);

      const keys = rows.map(r => r.idempotency_key);
      expect(new Set(keys).size).toBe(4);
    });
  });

  // ─── PART 2: Reset rollback after destructive operations ───────────────────

  describe('Part 2: Reset rollback after destructive operations', () => {
    test('rolls back completely when failure occurs after destructive deletions have executed', async () => {
      // 1. Create and verify a complete seeded scenario with its 4 baseline notifications
      await seedStandardScenario(db);
      const beforeNotifs = await getAllNotifications();
      expect(beforeNotifs).toHaveLength(4);

      // 2. Capture complete pre-reset state across all 8 operational tables
      const beforeDeclarations = (await db.query(`SELECT * FROM aes_declarations ORDER BY id ASC`)).rows;
      const beforeReviews = (await db.query(`SELECT * FROM administrative_reviews ORDER BY id ASC`)).rows;
      const beforeResponses = (await db.query(`SELECT * FROM correction_responses ORDER BY id ASC`)).rows;
      const beforeCoordinations = (await db.query(`SELECT * FROM oh_coordinations ORDER BY id ASC`)).rows;
      const beforeEvents = (await db.query(`SELECT * FROM oh_follow_up_events ORDER BY id ASC`)).rows;
      const beforeCapa = (await db.query(`SELECT * FROM prevention_actions ORDER BY id ASC`)).rows;
      const beforeAudit = (await db.query(`SELECT * FROM audit_events ORDER BY id ASC`)).rows;

      expect(beforeDeclarations.length).toBeGreaterThanOrEqual(4);
      expect(beforeReviews.length).toBeGreaterThanOrEqual(2);
      expect(beforeCoordinations.length).toBeGreaterThanOrEqual(2);
      expect(beforeEvents.length).toBeGreaterThanOrEqual(4);
      expect(beforeCapa.length).toBeGreaterThanOrEqual(5);
      expect(beforeAudit.length).toBeGreaterThanOrEqual(3);

      // 3. Begin authorized reset with tech_admin
      // Intercept transaction: allow in_app_notifications, oh_follow_up_events, and oh_coordinations
      // to be deleted, then deliberately throw before transaction commit
      let deletedNotifications = false;
      let deletedEvents = false;
      let deletedCoordinations = false;

      const originalTransaction = adapter.transaction.bind(adapter);
      adapter.transaction = async (fn: any) => {
        return originalTransaction(async (tx: any) => {
          const origExec = tx.execute.bind(tx);
          tx.execute = async (sql: string, params?: unknown[]) => {
            if (sql.includes('in_app_notifications') && sql.includes('DELETE')) {
              deletedNotifications = true;
              return origExec(sql, params);
            }
            if (sql.includes('oh_follow_up_events') && sql.includes('DELETE')) {
              deletedEvents = true;
              return origExec(sql, params);
            }
            if (sql.includes('oh_coordinations') && sql.includes('DELETE')) {
              deletedCoordinations = true;
              await origExec(sql, params);
              // Destructive operations have executed: notifications, events, and coordinations deleted!
              // Now throw deliberately before reset completion and transaction commit
              throw new Error('Deterministic failure injected after destructive deletions');
            }
            return origExec(sql, params);
          };
          return fn(tx);
        });
      };

      try {
        await expect(db.resetDemoScenario(techAdminId)).rejects.toThrow(
          'Deterministic failure injected after destructive deletions',
        );
      } finally {
        adapter.transaction = originalTransaction;
      }

      // Confirm that the destructive steps actually ran inside the aborted transaction
      expect(deletedNotifications).toBe(true);
      expect(deletedEvents).toBe(true);
      expect(deletedCoordinations).toBe(true);

      // 4. Assert full rollback and state restoration
      // All 4 original notifications are restored with identical IDs, recipients, read states, and keys
      const afterNotifs = await getAllNotifications();
      expect(afterNotifs).toEqual(beforeNotifs);

      // All original business records are restored
      const afterDeclarations = (await db.query(`SELECT * FROM aes_declarations ORDER BY id ASC`)).rows;
      expect(afterDeclarations).toEqual(beforeDeclarations);

      const afterReviews = (await db.query(`SELECT * FROM administrative_reviews ORDER BY id ASC`)).rows;
      expect(afterReviews).toEqual(beforeReviews);

      const afterResponses = (await db.query(`SELECT * FROM correction_responses ORDER BY id ASC`)).rows;
      expect(afterResponses).toEqual(beforeResponses);

      const afterCoordinations = (await db.query(`SELECT * FROM oh_coordinations ORDER BY id ASC`)).rows;
      expect(afterCoordinations).toEqual(beforeCoordinations);

      const afterEvents = (await db.query(`SELECT * FROM oh_follow_up_events ORDER BY id ASC`)).rows;
      expect(afterEvents).toEqual(beforeEvents);

      const afterCapa = (await db.query(`SELECT * FROM prevention_actions ORDER BY id ASC`)).rows;
      expect(afterCapa).toEqual(beforeCapa);

      const afterAudit = (await db.query(`SELECT * FROM audit_events ORDER BY id ASC`)).rows;
      expect(afterAudit).toEqual(beforeAudit);

      // Assert no partial DEMO_DATA_RESET event was committed
      const resetAudit = (await db.query(`SELECT * FROM audit_events WHERE event_type = 'DEMO_DATA_RESET'`)).rows;
      expect(resetAudit).toHaveLength(0);

      // Assert foreign key checks pass completely
      await assertZeroForeignKeyViolations();
    });

    test('reset cleans up notifications before deleting referenced entities', async () => {
      await seedStandardScenario(db);
      expect((await getAllNotifications()).length).toBe(4);

      // Reset must succeed cleanly without FK violations
      await expect(db.resetDemoScenario(techAdminId)).resolves.not.toThrow();

      // Exactly 4 notifications re-seeded
      expect((await getAllNotifications()).length).toBe(4);
      await assertZeroForeignKeyViolations();
    });

    test('unauthorized reset attempt is rejected and leaves all records intact', async () => {
      await seedStandardScenario(db);
      expect((await getAllNotifications()).length).toBe(4);

      await expect(db.resetDemoScenario(exposedUserId)).rejects.toThrow(/Unauthorized/);
      expect((await getAllNotifications()).length).toBe(4);
    });
  });

  // ─── PART 3: Complete seed rollback ───────────────────────────────────────

  describe('Part 3: Complete seed rollback', () => {
    test('rolls back all business records and partial notifications if failure occurs mid-notification seeding', async () => {
      // Create pre-existing sentinel records to verify pre-transaction state remains intact
      await db.execute(
        `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
         VALUES ('AES-PRE-EXISTING-01', 1, '2026-11-01', 'percutaneous_exposure', 'submitted')`,
      );
      await db.execute(
        `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
         VALUES ('PRE_EXISTING_SENTINEL', 1, 'system', NULL, 'Pre-existing audit sentinel', '2026-11-01T00:00:00Z')`,
      );

      const preDeclCount = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      const preAuditCount = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM audit_events`)).rows[0].count;
      expect(preDeclCount).toBe(1);
      expect(preAuditCount).toBe(1);

      // Intercept transaction: let all declarations, reviews, coordinations, CAPA,
      // and the first notification be inserted, then throw on the second notification
      let notifsInserted = 0;
      let declsInserted = 0;
      let capasInserted = 0;

      const originalTransaction = adapter.transaction.bind(adapter);
      adapter.transaction = async (fn: any) => {
        return originalTransaction(async (tx: any) => {
          const origExec = tx.execute.bind(tx);
          tx.execute = async (sql: string, params?: unknown[]) => {
            if (sql.includes('aes_declarations') && sql.includes('INSERT')) {
              declsInserted++;
            }
            if (sql.includes('prevention_actions') && sql.includes('INSERT')) {
              capasInserted++;
            }
            if (sql.includes('in_app_notifications') && sql.includes('INSERT')) {
              notifsInserted++;
              const res = await origExec(sql, params);
              if (notifsInserted === 1) {
                // First baseline notification has been successfully inserted.
                // Now throw deliberately to abort the entire scenario transaction!
                throw new Error('Deterministic failure injected during notification insertion');
              }
              return res;
            }
            return origExec(sql, params);
          };
          return fn(tx);
        });
      };

      try {
        await expect(seedStandardScenario(db)).rejects.toThrow(
          'Deterministic failure injected during notification insertion',
        );
      } finally {
        adapter.transaction = originalTransaction;
      }

      expect(declsInserted).toBeGreaterThanOrEqual(4);
      expect(capasInserted).toBeGreaterThanOrEqual(1);
      expect(notifsInserted).toBe(1);

      // Assert complete transactional rollback:
      // No partially seeded declarations remain (only pre-existing sentinel)
      const postDeclarations = (await db.query<{ reference_number: string }>(`SELECT reference_number FROM aes_declarations`)).rows;
      expect(postDeclarations).toHaveLength(1);
      expect(postDeclarations[0].reference_number).toBe('AES-PRE-EXISTING-01');

      // No reviews or correction responses remain
      const postReviews = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM administrative_reviews`)).rows[0].count;
      expect(postReviews).toBe(0);
      const postResponses = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM correction_responses`)).rows[0].count;
      expect(postResponses).toBe(0);

      // No OH coordinations or follow-up events remain
      const postCoordinations = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM oh_coordinations`)).rows[0].count;
      expect(postCoordinations).toBe(0);
      const postEvents = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM oh_follow_up_events`)).rows[0].count;
      expect(postEvents).toBe(0);

      // No CAPA records remain
      const postCapa = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM prevention_actions`)).rows[0].count;
      expect(postCapa).toBe(0);

      // No partial baseline notifications remain
      const postNotifs = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM in_app_notifications`)).rows[0].count;
      expect(postNotifs).toBe(0);

      // Pre-existing audit records remain unchanged; no partial seed audit events remain
      const postAudit = (await db.query<{ event_type: string }>(`SELECT event_type FROM audit_events`)).rows;
      expect(postAudit).toHaveLength(1);
      expect(postAudit[0].event_type).toBe('PRE_EXISTING_SENTINEL');

      await assertZeroForeignKeyViolations();
    });
  });

  // ─── PART 4: Recipient-resolution hardening ────────────────────────────────

  describe('Part 4: Recipient resolution invariant and hardening', () => {
    test('missing required role fails the seed transaction and aborts without partial seeding', async () => {
      // Reassign quality_staff to tech_admin so that no user possesses the quality_staff role,
      // while keeping user row 4 intact for foreign key satisfaction.
      await db.execute(`UPDATE demo_users SET role = 'tech_admin' WHERE role = 'quality_staff'`);

      await expect(seedStandardScenario(db)).rejects.toThrow(
        /RecipientResolutionError.*quality_staff/i,
      );

      // Transaction rolled back: zero notifications, zero declarations
      const notifs = await getAllNotifications();
      expect(notifs).toHaveLength(0);

      const declCount = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      expect(declCount).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('missing admin_reviewer role fails the seed transaction and aborts without partial seeding', async () => {
      await db.execute(`UPDATE demo_users SET role = 'tech_admin' WHERE role = 'admin_reviewer'`);

      await expect(seedStandardScenario(db)).rejects.toThrow(
        /RecipientResolutionError.*admin_reviewer/i,
      );

      const notifs = await getAllNotifications();
      expect(notifs).toHaveLength(0);

      const declCount = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      expect(declCount).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('missing oh_professional role fails the seed transaction and aborts without partial seeding', async () => {
      await db.execute(`UPDATE demo_users SET role = 'tech_admin' WHERE role = 'oh_professional'`);

      await expect(seedStandardScenario(db)).rejects.toThrow(
        /RecipientResolutionError.*oh_professional/i,
      );

      const notifs = await getAllNotifications();
      expect(notifs).toHaveLength(0);

      const declCount = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      expect(declCount).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('missing exposed_professional role fails the seed transaction and aborts without partial seeding', async () => {
      await db.execute(`UPDATE demo_users SET role = 'tech_admin' WHERE role = 'exposed_professional'`);

      await expect(seedStandardScenario(db)).rejects.toThrow(
        /RecipientResolutionError.*exposed_professional/i,
      );

      const notifs = await getAllNotifications();
      expect(notifs).toHaveLength(0);

      const declCount = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      expect(declCount).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('multiple candidate users for same role deterministically resolves to canonical user', async () => {
      // Add a secondary admin_reviewer with a higher ID
      await db.execute(
        `INSERT INTO demo_users (username, display_name, role) VALUES ('admin.extra', 'Second Admin', 'admin_reviewer')`,
      );

      await seedStandardScenario(db);
      const notifs = await getAllNotifications();

      const declNotif = notifs.find(n => n.event_type === 'declaration_submitted')!;
      expect(declNotif).toBeDefined();

      // Canonical user 2 is chosen, not the newly inserted higher ID
      expect(declNotif.recipient_user_id).toBe(2);
    });

    test('deterministic resolution is invariant to table query scan order', async () => {
      // Insert duplicate users for multiple roles
      await db.execute(
        `INSERT INTO demo_users (username, display_name, role) VALUES
         ('user.alt.exposed', 'Alt Exposed', 'exposed_professional'),
         ('user.alt.oh', 'Alt OH', 'oh_professional')`,
      );

      await seedStandardScenario(db);
      const notifs = await getAllNotifications();

      const nExposed = notifs.find(n => n.event_type === 'correction_requested')!;
      const nOh = notifs.find(n => n.event_type === 'oh_coordination_created')!;

      // Canonical IDs: exposed = 1, oh = 3
      expect(nExposed.recipient_user_id).toBe(1);
      expect(nOh.recipient_user_id).toBe(3);
    });
  });

  // ─── PART 5: Repeated reset/reseed & AUTOINCREMENT verification ───────────

  describe('Part 5: Repeated reset/reseed across at least 3 cycles', () => {
    test('three complete reset/reseed cycles verify dynamic PK resolution and AUTOINCREMENT advancement', async () => {
      await seedStandardScenario(db);

      interface CycleSnapshot {
        cycle: number;
        decl1Id: number;
        decl2Id: number;
        decl3Id: number;
        review2Id: number;
        coord3Id: number;
        capa1Id: number;
        notifications: NotifRow[];
      }

      const cycles: CycleSnapshot[] = [];

      for (let c = 1; c <= 3; c++) {
        if (c > 1) {
          await db.resetDemoScenario(techAdminId);
        }

        const decl1 = (await db.query<{ id: number; reference_number: string }>(
          `SELECT id, reference_number FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-01'`,
        )).rows[0];
        const decl2 = (await db.query<{ id: number; reference_number: string }>(
          `SELECT id, reference_number FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-02'`,
        )).rows[0];
        const decl3 = (await db.query<{ id: number; reference_number: string }>(
          `SELECT id, reference_number FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-03'`,
        )).rows[0];

        const rev2 = (await db.query<{ id: number }>(
          `SELECT ar.id FROM administrative_reviews ar
           JOIN aes_declarations d ON ar.declaration_id = d.id
           WHERE d.reference_number = 'AES-2026-DEMO-02' AND ar.outcome = 'correction_requested'
           ORDER BY ar.id DESC LIMIT 1`,
        )).rows[0];

        const coord3 = (await db.query<{ id: number }>(
          `SELECT c.id FROM oh_coordinations c
           JOIN aes_declarations d ON c.declaration_id = d.id
           WHERE d.reference_number = 'AES-2026-DEMO-03'
           ORDER BY c.id DESC LIMIT 1`,
        )).rows[0];

        const capa1 = (await db.query<{ id: number; reference_code: string }>(
          `SELECT id, reference_code FROM prevention_actions WHERE reference_code = 'CAPA-2026-00001'`,
        )).rows[0];

        const notifs = await getAllNotifications();

        cycles.push({
          cycle: c,
          decl1Id: decl1.id,
          decl2Id: decl2.id,
          decl3Id: decl3.id,
          review2Id: rev2.id,
          coord3Id: coord3.id,
          capa1Id: capa1.id,
          notifications: notifs,
        });

        // Exact baseline assertions per cycle:
        expect(notifs).toHaveLength(4);

        const n1 = notifs.find(n => n.event_type === 'declaration_submitted')!;
        const n2 = notifs.find(n => n.event_type === 'correction_requested')!;
        const n3 = notifs.find(n => n.event_type === 'oh_coordination_created')!;
        const n4 = notifs.find(n => n.event_type === 'capa_created')!;

        // 1. New primary keys are resolved from newly created records of THIS cycle
        expect(n1.entity_id).toBe(decl1.id);
        expect(n2.entity_id).toBe(rev2.id);
        expect(n3.entity_id).toBe(coord3.id);
        expect(n4.entity_id).toBe(capa1.id);

        // 2. Stable reference strings remain constant
        expect(n1.entity_reference).toBe('AES-2026-DEMO-01');
        expect(n2.entity_reference).toBe('AES-2026-DEMO-02');
        expect(n3.entity_reference).toBe('AES-2026-DEMO-03');
        expect(n4.entity_reference).toBe('CAPA-2026-00001');

        // 3. Read states remain correct
        expect(n1.is_read).toBe(0);
        expect(n2.is_read).toBe(0);
        expect(n3.is_read).toBe(1);
        expect(n4.is_read).toBe(1);

        // 4. Recipient IDs match expected canonical roles
        expect(n1.recipient_user_id).toBe(adminUserId);
        expect(n2.recipient_user_id).toBe(exposedUserId);
        expect(n3.recipient_user_id).toBe(ohUserId);
        expect(n4.recipient_user_id).toBe(qualityUserId);

        // 5. No duplicate idempotency keys exist
        const keys = notifs.map(n => n.idempotency_key);
        expect(new Set(keys).size).toBe(4);

        // 6. Referential integrity verified
        await assertZeroForeignKeyViolations();
      }

      // Cross-cycle comparisons:
      // AUTOINCREMENT advancement: In cycle 2 & 3, declaration IDs and notification IDs advance
      expect(cycles[1].decl1Id).toBeGreaterThan(cycles[0].decl1Id);
      expect(cycles[2].decl1Id).toBeGreaterThan(cycles[1].decl1Id);

      expect(cycles[1].notifications[0].id).toBeGreaterThan(cycles[0].notifications[0].id);
      expect(cycles[2].notifications[0].id).toBeGreaterThan(cycles[1].notifications[0].id);

      // In cycle 2 & 3, notification entity_ids NEVER point to a deleted previous cycle ID
      expect(cycles[1].notifications.find(n => n.event_type === 'declaration_submitted')!.entity_id)
        .not.toBe(cycles[0].decl1Id);
      expect(cycles[2].notifications.find(n => n.event_type === 'declaration_submitted')!.entity_id)
        .not.toBe(cycles[1].decl1Id);
    });

    test('15. PRAGMA foreign_key_check returns 0 violations after seeding', async () => {
      await seedStandardScenario(db);
      await assertZeroForeignKeyViolations();
    });
  });

  // ─── PART 6: Dynamic recipient invariant & non-canonical user IDs (Phase 2D.2D.2) ─

  describe('Part 6: Dynamic recipient invariant & non-canonical user IDs (Phase 2D.2D.2)', () => {
    test('seeder dynamically resolves non-canonical, non-sequential user IDs (101, 202, 303, 404, 505)', async () => {
      // 1. Wipe all operational tables and default demo_users
      await db.execute(`DELETE FROM in_app_notifications;`);
      await db.execute(`DELETE FROM oh_follow_up_events;`);
      await db.execute(`DELETE FROM oh_coordinations;`);
      await db.execute(`DELETE FROM correction_responses;`);
      await db.execute(`DELETE FROM administrative_reviews;`);
      await db.execute(`DELETE FROM aes_declarations;`);
      await db.execute(`DELETE FROM prevention_actions;`);
      await db.execute(`DELETE FROM audit_events;`);
      await db.execute(`DELETE FROM demo_users;`);

      // 2. Insert synthetic users with non-canonical, non-sequential primary keys
      const CUSTOM_EXPOSED_ID = 101;
      const CUSTOM_ADMIN_ID = 202;
      const CUSTOM_OH_ID = 303;
      const CUSTOM_QUALITY_ID = 404;
      const CUSTOM_TECH_ADMIN_ID = 505;

      await db.execute(
        `INSERT INTO demo_users (id, username, display_name, role) VALUES
         (?, 'dr.custom.exposed', 'Dr. Custom Exposed', 'exposed_professional'),
         (?, 'dr.custom.admin', 'Dr. Custom Admin', 'admin_reviewer'),
         (?, 'dr.custom.oh', 'Dr. Custom OH', 'oh_professional'),
         (?, 'mme.custom.quality', 'Mme. Custom Quality', 'quality_staff'),
         (?, 'admin.custom.tech', 'Admin Custom Tech', 'tech_admin')`,
        [
          CUSTOM_EXPOSED_ID,
          CUSTOM_ADMIN_ID,
          CUSTOM_OH_ID,
          CUSTOM_QUALITY_ID,
          CUSTOM_TECH_ADMIN_ID,
        ],
      );

      // Verify default users with IDs 1, 2, 3, 4 do NOT exist
      const checkUsers = await db.query<{ id: number }>(
        `SELECT id FROM demo_users WHERE id IN (1, 2, 3, 4)`,
      );
      expect(checkUsers.rows).toHaveLength(0);

      // 3. Seed scenario
      const result = await seedStandardScenario(db);
      expect(result.seeded).toBe(true);
      expect(result.declarationsCount).toBe(4);
      expect(result.preventionActionsCount).toBe(5);

      // 4. Verify baseline notifications resolved to the EXACT custom non-canonical IDs
      const notifs = await getAllNotifications();
      expect(notifs).toHaveLength(4);

      const nDecl = notifs.find(n => n.event_type === 'declaration_submitted')!;
      const nCorr = notifs.find(n => n.event_type === 'correction_requested')!;
      const nOh = notifs.find(n => n.event_type === 'oh_coordination_created')!;
      const nCapa = notifs.find(n => n.event_type === 'capa_created')!;

      expect(nDecl.recipient_user_id).toBe(CUSTOM_ADMIN_ID);
      expect(nCorr.recipient_user_id).toBe(CUSTOM_EXPOSED_ID);
      expect(nOh.recipient_user_id).toBe(CUSTOM_OH_ID);
      expect(nCapa.recipient_user_id).toBe(CUSTOM_QUALITY_ID);

      // None of the notifications have hardcoded 1, 2, 3, 4
      expect([1, 2, 3, 4]).not.toContain(nDecl.recipient_user_id);
      expect([1, 2, 3, 4]).not.toContain(nCorr.recipient_user_id);
      expect([1, 2, 3, 4]).not.toContain(nOh.recipient_user_id);
      expect([1, 2, 3, 4]).not.toContain(nCapa.recipient_user_id);

      // 5. Verify referential integrity and foreign keys
      await assertZeroForeignKeyViolations();

      // 6. Verify declarations and dependent records also reference the custom IDs
      const declRows = await db.query<{ declared_by_user_id: number }>(
        `SELECT declared_by_user_id FROM aes_declarations`,
      );
      for (const d of declRows.rows) {
        expect(d.declared_by_user_id).toBe(CUSTOM_EXPOSED_ID);
      }

      const reviewRows = await db.query<{ reviewer_user_id: number }>(
        `SELECT reviewer_user_id FROM administrative_reviews`,
      );
      for (const r of reviewRows.rows) {
        expect(r.reviewer_user_id).toBe(CUSTOM_ADMIN_ID);
      }

      const coordRows = await db.query<{ created_by_user_id: number; acknowledged_by_user_id: number }>(
        `SELECT created_by_user_id, acknowledged_by_user_id FROM oh_coordinations`,
      );
      for (const c of coordRows.rows) {
        expect(c.created_by_user_id).toBe(CUSTOM_ADMIN_ID);
        expect(c.acknowledged_by_user_id).toBe(CUSTOM_OH_ID);
      }

      const capaRows = await db.query<{ created_by_user_id: number }>(
        `SELECT created_by_user_id FROM prevention_actions`,
      );
      for (const p of capaRows.rows) {
        expect(p.created_by_user_id).toBe(CUSTOM_QUALITY_ID);
      }
    });

    test('proving that hardcoded numeric IDs (1, 2, 3, 4) would violate foreign keys and fail test assertions', async () => {
      // In this setup, demo_users contains only user 999.
      // Any attempt to insert notifications or entities pointing to fixed IDs 1, 2, 3, 4
      // throws a SQLite foreign key constraint violation.
      await db.execute(`DELETE FROM in_app_notifications;`);
      await db.execute(`DELETE FROM oh_follow_up_events;`);
      await db.execute(`DELETE FROM oh_coordinations;`);
      await db.execute(`DELETE FROM correction_responses;`);
      await db.execute(`DELETE FROM administrative_reviews;`);
      await db.execute(`DELETE FROM aes_declarations;`);
      await db.execute(`DELETE FROM prevention_actions;`);
      await db.execute(`DELETE FROM audit_events;`);
      await db.execute(`DELETE FROM demo_users;`);

      await db.execute(
        `INSERT INTO demo_users (id, username, display_name, role)
         VALUES (999, 'admin.only', 'Admin Only', 'tech_admin')`,
      );

      // Attempting to insert a notification with hardcoded recipient 2 (when only 999 exists) fails with FOREIGN KEY error
      await expect(
        db.execute(
          `INSERT INTO in_app_notifications (
             recipient_user_id, event_type, title_key, message_key,
             entity_type, entity_id, is_read, created_at, idempotency_key
           ) VALUES (2, 'declaration_submitted', 't', 'm', 'aes_declaration', 1, 0, '2026-11-10T09:15:00Z', 'k')`,
        ),
      ).rejects.toThrow(/FOREIGN KEY constraint failed/i);
    });

    test('tech_admin is strictly prohibited from operational notification resolution', async () => {
      await expect(db.getRecipientUserIdByRole('tech_admin')).rejects.toThrow(
        /Unauthorized: operational notifications cannot be addressed to 'tech_admin'/i,
      );
    });
  });

  // ─── PART 7: Transaction boundary, ownership & nesting verification (Phase 2D.2D.2) ─

  describe('Part 7: Transaction boundary, ownership & nesting verification (Phase 2D.2D.2)', () => {
    test('standalone seedStandardScenario(db) executes in exactly one atomic transaction', async () => {
      let transactionCallCount = 0;
      const originalTransaction = adapter.transaction.bind(adapter);
      adapter.transaction = async (fn: any) => {
        transactionCallCount++;
        return originalTransaction(fn);
      };

      try {
        await seedStandardScenario(db);
        // Standalone seed must invoke transaction exactly once
        expect(transactionCallCount).toBe(1);
      } finally {
        adapter.transaction = originalTransaction;
      }

      // Verify all 4 declarations, 5 CAPAs, and 4 notifications are seeded
      const notifs = await getAllNotifications();
      expect(notifs).toHaveLength(4);
      const declCount = (await db.query<{ count: number }>(`SELECT COUNT(*) as count FROM aes_declarations`)).rows[0].count;
      expect(declCount).toBe(4);
    });

    test('resetDemoScenario(techAdminId) executes in exactly one outer transaction with no nested transaction', async () => {
      // First seed baseline
      await seedStandardScenario(db);

      let outerTransactionCount = 0;
      const originalTransaction = adapter.transaction.bind(adapter);
      adapter.transaction = async (fn: any) => {
        outerTransactionCount++;
        return originalTransaction(fn);
      };

      try {
        const resetResult = await db.resetDemoScenario(techAdminId);
        expect(resetResult.success).toBe(true);

        // Exactly one outer transaction owned the entire reset and reseed!
        expect(outerTransactionCount).toBe(1);
      } finally {
        adapter.transaction = originalTransaction;
      }

      // Verify state was correctly reseeded
      const notifs = await getAllNotifications();
      expect(notifs).toHaveLength(4);
      await assertZeroForeignKeyViolations();
    });

    test('[Phase 2D.2D.6] standalone seedStandardScenario opens exactly one transaction', async () => {
      let outerCount = 0;
      const originalTransaction = adapter.transaction.bind(adapter);
      adapter.transaction = async (fn: any) => {
        outerCount++;
        return originalTransaction(fn);
      };

      try {
        const res = await seedStandardScenario(db);
        expect(res.declarationsCount).toBeGreaterThanOrEqual(4);
        // Exactly one transaction was opened — no nested transactions
        expect(outerCount).toBe(1);
      } finally {
        adapter.transaction = originalTransaction;
      }
    });

    test('passing { inTransaction: true } to an ordinary executor cannot bypass transaction ownership', async () => {
      // Phase 2D.2D.5: seedStandardScenario only accepts TransactionalDatabase.
      // Objects without a .transaction() method are rejected immediately.
      const fakeExecutor: any = {
        execute: jest.fn(),
        query: jest.fn(),
        inTransaction: true,
      };

      await expect(seedStandardScenario(fakeExecutor)).rejects.toThrow(
        /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
      );
      expect(fakeExecutor.execute).not.toHaveBeenCalled();
    });

    test('genuine transaction contexts created by both DatabaseService and NativeSQLiteAdapter satisfy TransactionExecutor contract', async () => {
      // 1. NativeSQLiteAdapter.transaction provides authentic TransactionExecutor
      await adapter.transaction(async (tx: TransactionExecutor) => {
        expect(isTransactionExecutor(tx)).toBe(true);
        expect(isTransactionalDatabase(tx)).toBe(false);
        expect(typeof tx.execute).toBe('function');
        expect(typeof tx.query).toBe('function');
        expect(typeof tx.isCompleted).toBe('function');
        expect(tx.isCompleted()).toBe(false);
      });

      // 2. DatabaseService.transaction provides authentic TransactionExecutor
      DatabaseService.resetForTesting();
      const service = DatabaseService.getInstance({ name: 'test-db-service-authentic' });
      await service.open();

      await service.transaction(async (tx: TransactionExecutor) => {
        expect(isTransactionExecutor(tx)).toBe(true);
        expect(isTransactionalDatabase(tx)).toBe(false);
        expect(typeof tx.execute).toBe('function');
        expect(typeof tx.query).toBe('function');
        expect(typeof tx.isCompleted).toBe('function');
        expect(tx.isCompleted()).toBe(false);
      });

      service.close();
      DatabaseService.resetForTesting();
    });

    test('[Phase 2D.2D.5] seedStandardScenario only accepts TransactionalDatabase — not TransactionExecutor or plain objects', async () => {
      // 1. Plain executor (no transaction() method) is rejected
      const plainExecutor: any = { execute: jest.fn(), query: jest.fn() };
      await expect(seedStandardScenario(plainExecutor)).rejects.toThrow(
        /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
      );
      expect(plainExecutor.execute).not.toHaveBeenCalled();

      // 2. A genuine TransactionExecutor (registered, authenticated) is also rejected
      //    because it lacks a .transaction() method and seedStandardScenario is DB-only now.
      await adapter.transaction(async (tx: TransactionExecutor) => {
        expect(isTransactionExecutor(tx)).toBe(true);
        // Passing a TransactionExecutor to the public seedStandardScenario is rejected
        await expect(seedStandardScenario(tx as any)).rejects.toThrow(
          /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
        );
      });

      // 3. Object with fabricated transaction-shaped methods is rejected
      const fakeTransactional: any = {
        execute: jest.fn(),
        query: jest.fn(),
        transaction: 'not-a-function',
      };
      await expect(seedStandardScenario(fakeTransactional)).rejects.toThrow(
        /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
      );
      expect(fakeTransactional.execute).not.toHaveBeenCalled();
    });

    test('[Phase 2D.2D.6] no exported registerTransactionExecutor or seedStandardScenarioInTransaction in any module or barrel', async () => {
      // 1. Database barrel (index.ts)
      const databaseBarrel = require('../index');
      expect(typeof databaseBarrel.registerTransactionExecutor).toBe('undefined');
      expect(typeof databaseBarrel.isRegisteredTransactionExecutor).toBe('undefined');
      expect(typeof databaseBarrel.seedStandardScenarioInTransaction).toBe('undefined');
      expect(typeof databaseBarrel.isTransactionExecutor).toBe('undefined');
      expect(typeof databaseBarrel.isTransactionalDatabase).toBe('undefined');

      // 2. Core barrel (src/core/index.ts)
      const coreBarrel = require('../../../core');
      expect(typeof coreBarrel.registerTransactionExecutor).toBe('undefined');
      expect(typeof coreBarrel.isRegisteredTransactionExecutor).toBe('undefined');
      expect(typeof coreBarrel.seedStandardScenarioInTransaction).toBe('undefined');
      expect(typeof coreBarrel.isTransactionExecutor).toBe('undefined');
      expect(typeof coreBarrel.isTransactionalDatabase).toBe('undefined');

      // 3. Demo scenario seeder module directly
      const seederModule = require('../demo-scenario-seeder');
      expect(typeof seederModule.registerTransactionExecutor).toBe('undefined');
      expect(typeof seederModule.seedStandardScenarioInTransaction).toBe('undefined');
      expect(typeof seederModule.runSeedStandardScenario).toBe('undefined');
      expect(typeof seederModule.resolveRecipientId).toBe('undefined');
      expect(typeof seederModule.seedStandardScenario).toBe('function');
      expect(typeof seederModule.seedDemoScenarioIfEmpty).toBe('function');

      // 4. Transaction registry module must not exist on disk
      const fs = require('fs');
      const path = require('path');
      const registryPath = path.resolve(__dirname, '../transaction-registry.ts');
      expect(fs.existsSync(registryPath)).toBe(false);

      // 5. Codebase-wide source audit: 0 imports of registration or internal bypass
      const coreDir = path.resolve(__dirname, '../../..');
      const scanFile = (filePath: string) => {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toMatch(/registerTransactionExecutor/);
        expect(content).not.toMatch(/seedStandardScenarioInTransaction/);
        expect(content).not.toMatch(/transaction-registry/);
      };
      const walk = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            walk(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            // exclude this test file itself from the literal pattern match test
            if (!fullPath.includes('demo-notification-seeding.test.ts')) {
              scanFile(fullPath);
            }
          }
        }
      };
      walk(coreDir);
    });

    test('[Phase 2D.2D.6] resetDemoScenario executes scenario insertion inside its own outer transaction without nested transactions', async () => {
      let outerCount = 0;
      const originalTransaction = adapter.transaction.bind(adapter);
      adapter.transaction = async (fn: any) => {
        outerCount++;
        return originalTransaction(fn);
      };

      try {
        const res = await db.resetDemoScenario(techAdminId);
        expect(res.success).toBe(true);
        expect(res.declarationsCount).toBe(4);
        expect(res.auditEventsCount).toBe(4);
        // Exactly one transaction was opened — no nested transactions from scenario insertion
        expect(outerCount).toBe(1);
      } finally {
        adapter.transaction = originalTransaction;
      }

      // Verify all 4 declarations and 4 notifications are present
      const notifs = await getAllNotifications();
      expect(notifs).toHaveLength(4);
    });

    test('[Phase 2D.2D.6] a copied or cloned transaction-shaped object is rejected by seedStandardScenario (lacks .transaction())', async () => {
      await adapter.transaction(async (tx: TransactionExecutor) => {
        expect(isTransactionExecutor(tx)).toBe(true);

        const spreadClone = { ...tx };
        expect(isTransactionalDatabase(spreadClone)).toBe(false);
        await expect(seedStandardScenario(spreadClone as any)).rejects.toThrow(
          /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
        );

        const assignedClone = Object.assign({}, tx);
        expect(isTransactionalDatabase(assignedClone)).toBe(false);
        await expect(seedStandardScenario(assignedClone as any)).rejects.toThrow(
          /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
        );
      });
    });

    test('[Phase 2D.2D.6] an executor-shaped object without a .transaction() method is rejected by seedStandardScenario', async () => {
      const impostor: any = {
        execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
        query: jest.fn().mockResolvedValue({ rows: [] }),
        isCompleted: () => false,
      };

      expect(isTransactionalDatabase(impostor)).toBe(false);
      await expect(seedStandardScenario(impostor)).rejects.toThrow(
        /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
      );
      expect(impostor.execute).not.toHaveBeenCalled();
      expect(impostor.query).not.toHaveBeenCalled();
    });

    test('DatabaseService.transaction returns callback result unchanged upon commit', async () => {
      DatabaseService.resetForTesting();
      const service = DatabaseService.getInstance({ name: 'test-db-service' });
      await service.open();

      const expectedValue = { success: true, count: 42, label: 'atomic-test' };
      const actualValue = await service.transaction(async (tx: TransactionExecutor) => {
        expect(isTransactionExecutor(tx)).toBe(true);
        return expectedValue;
      });

      expect(actualValue).toBe(expectedValue);
      service.close();
      DatabaseService.resetForTesting();
    });

    test('DatabaseService.transaction rolls back on error and re-throws the exception', async () => {
      DatabaseService.resetForTesting();
      const service = DatabaseService.getInstance({ name: 'test-db-service-rollback' });
      await service.open();

      await service.execute(`CREATE TABLE IF NOT EXISTS test_boundary (id INTEGER PRIMARY KEY, val TEXT)`);
      await service.execute(`DELETE FROM test_boundary`);

      await expect(
        service.transaction(async tx => {
          await tx.execute(`INSERT INTO test_boundary (id, val) VALUES (1, 'initial')`);
          throw new Error('Intentional transaction failure for rollback verification');
        }),
      ).rejects.toThrow('Intentional transaction failure for rollback verification');

      const query = await service.query<{ count: number }>(`SELECT COUNT(*) as count FROM test_boundary`);
      expect(query.rows[0].count).toBe(0);

      service.close();
      DatabaseService.resetForTesting();
    });

    test('NativeSQLiteAdapter.transaction rolls back on error and re-throws the exception', async () => {
      await adapter.execute(`CREATE TABLE IF NOT EXISTS native_boundary (id INTEGER PRIMARY KEY, val TEXT)`);
      await adapter.execute(`DELETE FROM native_boundary`);

      await expect(
        adapter.transaction(async tx => {
          await tx.execute(`INSERT INTO native_boundary (id, val) VALUES (1, 'native-val')`);
          throw new Error('Native failure injected to verify rollback');
        }),
      ).rejects.toThrow('Native failure injected to verify rollback');

      const query = await adapter.query<{ count: number }>(`SELECT COUNT(*) as count FROM native_boundary`);
      expect(query.rows[0].count).toBe(0);
    });

    test('commit failure is propagated rather than reported as success (DatabaseService & NativeSQLiteAdapter)', async () => {
      // 1. DatabaseService commit failure
      DatabaseService.resetForTesting();
      const service = DatabaseService.getInstance({ name: 'test-db-commit-fail' });
      await service.open();
      await service.execute(`CREATE TABLE IF NOT EXISTS commit_fail_test (id INTEGER PRIMARY KEY, val TEXT)`);

      const origExecute = (service as any).db.execute.bind((service as any).db);
      (service as any).db.execute = (sql: string, params: any[]) => {
        if (sql.trim().toUpperCase() === 'COMMIT;') {
          throw new Error('Simulated SQLite disk error on COMMIT');
        }
        return origExecute(sql, params);
      };

      try {
        await expect(
          service.transaction(async tx => {
            await tx.execute(`INSERT INTO commit_fail_test (id, val) VALUES (1, 'pending')`);
            return 'should-not-be-returned';
          }),
        ).rejects.toThrow('Simulated SQLite disk error on COMMIT');
      } finally {
        (service as any).db.execute = origExecute;
      }

      const qService = await service.query<{ count: number }>(`SELECT COUNT(*) as count FROM commit_fail_test`);
      expect(qService.rows[0].count).toBe(0);
      service.close();
      DatabaseService.resetForTesting();

      // 2. NativeSQLiteAdapter commit failure
      await adapter.execute(`CREATE TABLE IF NOT EXISTS native_commit_fail (id INTEGER PRIMARY KEY, val TEXT)`);
      const origExec = (adapter as any).db.exec.bind((adapter as any).db);
      (adapter as any).db.exec = (sql: string) => {
        if (sql.includes('COMMIT')) {
          throw new Error('Simulated native disk full on COMMIT');
        }
        return origExec(sql);
      };

      try {
        await expect(
          adapter.transaction(async tx => {
            await tx.execute(`INSERT INTO native_commit_fail (id, val) VALUES (1, 'native-pending')`);
            return 'should-not-be-returned';
          }),
        ).rejects.toThrow('Simulated native disk full on COMMIT');
      } finally {
        (adapter as any).db.exec = origExec;
      }

      const qNative = await adapter.query<{ count: number }>(`SELECT COUNT(*) as count FROM native_commit_fail`);
      expect(qNative.rows[0].count).toBe(0);
    });

    test('the transaction context cannot be reused after completion (commit or rollback)', async () => {
      // 1. Reuse after successful commit
      let savedCommitTx: TransactionExecutor | null = null;
      await adapter.transaction(async tx => {
        savedCommitTx = tx;
        expect(tx.isCompleted()).toBe(false);
      });

      expect(savedCommitTx).not.toBeNull();
      expect(savedCommitTx!.isCompleted()).toBe(true);
      await expect(savedCommitTx!.execute(`SELECT 1`)).rejects.toThrow(
        /TransactionContextError: Cannot execute statement on completed or rolled back transaction/i,
      );
      await expect(savedCommitTx!.query(`SELECT 1`)).rejects.toThrow(
        /TransactionContextError: Cannot execute query on completed or rolled back transaction/i,
      );
      // Attempting to pass completed transaction context to seedStandardScenario is also rejected
      await expect(seedStandardScenario(savedCommitTx! as any)).rejects.toThrow(
        /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
      );

      // 2. Reuse after rollback
      let savedRollbackTx: TransactionExecutor | null = null;
      try {
        await adapter.transaction(async tx => {
          savedRollbackTx = tx;
          expect(tx.isCompleted()).toBe(false);
          throw new Error('Forced failure to trigger rollback');
        });
      } catch {
        // Expected
      }

      expect(savedRollbackTx).not.toBeNull();
      expect(savedRollbackTx!.isCompleted()).toBe(true);
      await expect(savedRollbackTx!.execute(`SELECT 1`)).rejects.toThrow(
        /TransactionContextError: Cannot execute statement on completed or rolled back transaction/i,
      );
      await expect(savedRollbackTx!.query(`SELECT 1`)).rejects.toThrow(
        /TransactionContextError: Cannot execute query on completed or rolled back transaction/i,
      );
      // Attempting to pass completed transaction context to seedStandardScenario is also rejected
      await expect(seedStandardScenario(savedRollbackTx! as any)).rejects.toThrow(
        /TransactionContractError: Cannot seed standard scenario without a valid transaction context/i,
      );
    });
  });
});
