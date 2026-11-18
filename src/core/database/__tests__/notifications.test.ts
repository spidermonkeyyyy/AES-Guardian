/**
 * AES Guardian — In-App Notifications & Ownership Integration Tests (Phase 2D.2B)
 *
 * Uses genuine native SQLite via NativeSQLiteAdapter + AesGuardianDatabase to verify:
 * 1. Mandatory Condition A — Declaration Ownership & Role Scoping
 * 2. Mandatory Condition B — Safe Idempotency & Constraint Surfacing
 * 3. Notification Repository Methods (get, count, markRead, markAllRead)
 * 4. tech_admin Role Boundaries
 * 5. Demonstration Reset Integration & Rollback Atomicity
 */

import { AesGuardianDatabase } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';
import type { CreateNotificationInput } from '../types';

describe('AES Guardian — Notification Database Foundation & Repository', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  // Canonical user IDs
  let exposedUser1Id: number;
  let exposedUser2Id: number;
  let adminReviewerId: number;
  let ohProfessionalId: number;
  let qualityStaffId: number;
  let techAdminId: number;

  beforeAll(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();

    // Create synthetic demo users with explicit roles
    const u1 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('user1.expose', 'Exposed User 1', 'exposed_professional')`,
    );
    exposedUser1Id = u1.insertId as number;

    const u2 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('user2.expose', 'Exposed User 2', 'exposed_professional')`,
    );
    exposedUser2Id = u2.insertId as number;

    const u3 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('admin.reviewer', 'Admin Reviewer', 'admin_reviewer')`,
    );
    adminReviewerId = u3.insertId as number;

    const u4 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('oh.doc', 'OH Professional', 'oh_professional')`,
    );
    ohProfessionalId = u4.insertId as number;

    const u5 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('quality.lead', 'Quality Staff', 'quality_staff')`,
    );
    qualityStaffId = u5.insertId as number;

    const u6 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('tech.admin', 'Tech Admin', 'tech_admin')`,
    );
    techAdminId = u6.insertId as number;
  });

  afterAll(async () => {
    await adapter.close();
  });

  // ────────────────────────────────────────────────────────────
  // 1. Mandatory Condition A — Declaration Ownership & Role Scoping
  // ────────────────────────────────────────────────────────────
  describe('Mandatory Condition A — Declaration Ownership', () => {
    let declUser1Id: number;
    let declUser2Id: number;

    beforeAll(async () => {
      const d1 = await db.run(
        `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
         VALUES ('AES-OWN-01', ?, '2026-11-01', 'percutaneous_exposure', 'submitted')`,
        [exposedUser1Id],
      );
      declUser1Id = d1.insertId as number;

      const d2 = await db.run(
        `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
         VALUES ('AES-OWN-02', ?, '2026-11-02', 'mucocutaneous_exposure', 'submitted')`,
        [exposedUser2Id],
      );
      declUser2Id = d2.insertId as number;
    });

    test('Exposed professional can retrieve their own declaration', async () => {
      const decl = await db.getDeclarationById(declUser1Id, exposedUser1Id);
      expect(decl).not.toBeNull();
      expect(decl?.id).toBe(declUser1Id);
      expect(decl?.declared_by_user_id).toBe(exposedUser1Id);
      expect(decl?.reference_number).toBe('AES-OWN-01');
    });

    test('Exposed professional cannot retrieve another user declaration by supplying its ID', async () => {
      await expect(
        db.getDeclarationById(declUser2Id, exposedUser1Id),
      ).rejects.toThrow(
        `Unauthorized: exposed_professional user ${exposedUser1Id} is not permitted to access declaration ${declUser2Id} owned by user ${exposedUser2Id}.`,
      );
    });

    test('Exposed professional cannot retrieve another user declaration even if UI is bypassed', async () => {
      await expect(
        db.getDeclarationById(declUser1Id, exposedUser2Id),
      ).rejects.toThrow('Unauthorized: exposed_professional user');
    });

    test('Admin reviewer can retrieve declarations for administrative review triage', async () => {
      const decl = await db.getDeclarationById(declUser1Id, adminReviewerId);
      expect(decl).not.toBeNull();
      expect(decl?.id).toBe(declUser1Id);
    });

    test('OH professional is prohibited from direct declaration retrieval (must access via coordination)', async () => {
      await expect(
        db.getDeclarationById(declUser1Id, ohProfessionalId),
      ).rejects.toThrow('Unauthorized: oh_professional user');
    });

    test('Quality staff is strictly prohibited from accessing identifiable declarations', async () => {
      await expect(
        db.getDeclarationById(declUser1Id, qualityStaffId),
      ).rejects.toThrow('strictly prohibited from accessing identifiable declaration content');
    });

    test('tech_admin remains strictly blocked from clinical declaration content', async () => {
      await expect(
        db.getDeclarationById(declUser1Id, techAdminId),
      ).rejects.toThrow('strictly prohibited from accessing clinical declaration content');
    });

    test('Non-existent declaration returns null for authorized user', async () => {
      const decl = await db.getDeclarationById(999999, adminReviewerId);
      expect(decl).toBeNull();
    });

    test('Unknown requesting user throws error', async () => {
      await expect(
        db.getDeclarationById(declUser1Id, 888888),
      ).rejects.toThrow('requesting user 888888 not found');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Mandatory Condition B — Safe Idempotency & Constraint Surfacing
  // ────────────────────────────────────────────────────────────
  describe('Mandatory Condition B — Safe Idempotency & Constraints', () => {
    test('1. First insertion creates one notification', async () => {
      const input: CreateNotificationInput = {
        recipient_user_id: adminReviewerId,
        event_type: 'declaration_submitted',
        title_key: 'notification.declarationSubmitted.title',
        message_key: 'notification.declarationSubmitted.message',
        entity_type: 'aes_declaration',
        entity_id: 101,
        entity_reference: 'AES-2026-IDEM-01',
        idempotency_key: 'notif:declaration_submitted:aes_declaration:101:2',
      };

      const res = await db.createNotification(input);
      expect(res.rowsAffected).toBe(1);
      expect(res.insertId).toBeDefined();
    });

    test('2. Repeating the same idempotency key creates no second notification', async () => {
      const input: CreateNotificationInput = {
        recipient_user_id: adminReviewerId,
        event_type: 'declaration_submitted',
        title_key: 'notification.declarationSubmitted.title',
        message_key: 'notification.declarationSubmitted.message',
        entity_type: 'aes_declaration',
        entity_id: 101,
        entity_reference: 'AES-2026-IDEM-01',
        idempotency_key: 'notif:declaration_submitted:aes_declaration:101:2',
      };

      const res = await db.createNotification(input);
      expect(res.rowsAffected).toBe(0);

      const rows = await db.all(
        `SELECT * FROM in_app_notifications WHERE idempotency_key = ?`,
        [input.idempotency_key],
      );
      expect(rows.length).toBe(1);
    });

    test('3. A different event ID on the same entity creates a new notification', async () => {
      // Multiple reviews on declaration 101
      const review1Notif: CreateNotificationInput = {
        recipient_user_id: exposedUser1Id,
        event_type: 'correction_requested',
        title_key: 'notification.correctionRequested.title',
        message_key: 'notification.correctionRequested.message',
        entity_type: 'administrative_review',
        entity_id: 501, // reviewId 501
        entity_reference: 'AES-2026-IDEM-01',
        idempotency_key: 'notif:correction_requested:administrative_review:501:1',
      };

      const review2Notif: CreateNotificationInput = {
        recipient_user_id: exposedUser1Id,
        event_type: 'review_completed',
        title_key: 'notification.reviewCompleted.title',
        message_key: 'notification.reviewCompleted.message',
        entity_type: 'administrative_review',
        entity_id: 502, // reviewId 502
        entity_reference: 'AES-2026-IDEM-01',
        idempotency_key: 'notif:review_completed:administrative_review:502:1',
      };

      const res1 = await db.createNotification(review1Notif);
      const res2 = await db.createNotification(review2Notif);

      expect(res1.rowsAffected).toBe(1);
      expect(res2.rowsAffected).toBe(1);
    });

    test('4. Invalid event type fails and surfaces error', async () => {
      const badInput: any = {
        recipient_user_id: adminReviewerId,
        event_type: 'invalid_event_type',
        title_key: 'title',
        message_key: 'msg',
        entity_type: 'aes_declaration',
        entity_id: 101,
        idempotency_key: 'bad-event-key',
      };

      await expect(db.createNotification(badInput)).rejects.toThrow('invalid event_type');
    });

    test('5. Invalid entity type fails and surfaces error', async () => {
      const badInput: any = {
        recipient_user_id: adminReviewerId,
        event_type: 'declaration_submitted',
        title_key: 'title',
        message_key: 'msg',
        entity_type: 'invalid_entity_type',
        entity_id: 101,
        idempotency_key: 'bad-entity-key',
      };

      await expect(db.createNotification(badInput)).rejects.toThrow('invalid entity_type');
    });

    test('6. Missing required recipient fails', async () => {
      const badInput: any = {
        recipient_user_id: undefined,
        event_type: 'declaration_submitted',
        title_key: 'title',
        message_key: 'msg',
        entity_type: 'aes_declaration',
        entity_id: 101,
        idempotency_key: 'missing-recipient-key',
      };

      await expect(db.createNotification(badInput)).rejects.toThrow();
    });

    test('7. Invalid recipient foreign key fails', async () => {
      const badInput: CreateNotificationInput = {
        recipient_user_id: 999999, // non-existent user
        event_type: 'declaration_submitted',
        title_key: 'title',
        message_key: 'msg',
        entity_type: 'aes_declaration',
        entity_id: 101,
        idempotency_key: 'bad-fk-key',
      };

      await expect(db.createNotification(badInput)).rejects.toThrow('recipient user 999999 not found');
    });

    test('8. Failed insertion in a transaction rolls back completely', async () => {
      const initialCount = (
        await db.get<{ count: number }>(`SELECT COUNT(*) AS count FROM in_app_notifications`)
      )?.count ?? 0;

      await expect(
        (db as any).db.transaction(async (tx: any) => {
          await db.createNotification(
            {
              recipient_user_id: adminReviewerId,
              event_type: 'declaration_submitted',
              title_key: 't',
              message_key: 'm',
              entity_type: 'aes_declaration',
              entity_id: 999,
              idempotency_key: 'tx-fail-test-1',
            },
            tx,
          );

          // Force an error inside transaction
          throw new Error('Simulated transaction failure');
        }),
      ).rejects.toThrow('Simulated transaction failure');

      const afterCount = (
        await db.get<{ count: number }>(`SELECT COUNT(*) AS count FROM in_app_notifications`)
      )?.count ?? 0;

      expect(afterCount).toBe(initialCount);
    });

    test('9. A genuine duplicate is handled without aborting an otherwise valid transaction', async () => {
      const dupKey = 'tx-duplicate-safe-key';

      // Seed initial notification
      await db.createNotification({
        recipient_user_id: adminReviewerId,
        event_type: 'declaration_submitted',
        title_key: 't',
        message_key: 'm',
        entity_type: 'aes_declaration',
        entity_id: 888,
        idempotency_key: dupKey,
      });

      // Run transaction attempting to re-insert the duplicate
      await (db as any).db.transaction(async (tx: any) => {
        const res = await db.createNotification(
          {
            recipient_user_id: adminReviewerId,
            event_type: 'declaration_submitted',
            title_key: 't',
            message_key: 'm',
            entity_type: 'aes_declaration',
            entity_id: 888,
            idempotency_key: dupKey,
          },
          tx,
        );
        expect(res.rowsAffected).toBe(0); // Safely ignored

        // Other work in tx succeeds
        await tx.execute(
          `INSERT INTO in_app_notifications (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
           VALUES (?, 'declaration_submitted', 't2', 'm2', 'aes_declaration', 889, 'tx-success-other-work')`,
          [adminReviewerId],
        );
      });

      const check = await db.all(
        `SELECT * FROM in_app_notifications WHERE idempotency_key = 'tx-success-other-work'`,
      );
      expect(check.length).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Notification Repository Methods
  // ────────────────────────────────────────────────────────────
  describe('Notification Repository Methods', () => {
    let notif1Id: number;
    let notif2Id: number;
    let notif3Id: number;

    beforeAll(async () => {
      // Clear notifications for testing repository methods cleanly
      await db.run(`DELETE FROM in_app_notifications;`);

      // Seed notifications for ohProfessionalId
      const r1 = await db.createNotification({
        recipient_user_id: ohProfessionalId,
        event_type: 'oh_coordination_created',
        title_key: 'notif.oh.title1',
        message_key: 'notif.oh.msg1',
        entity_type: 'oh_coordination',
        entity_id: 1,
        idempotency_key: 'repo-test-oh-1',
      });
      notif1Id = r1.insertId as number;

      const r2 = await db.createNotification({
        recipient_user_id: ohProfessionalId,
        event_type: 'oh_coordination_created',
        title_key: 'notif.oh.title2',
        message_key: 'notif.oh.msg2',
        entity_type: 'oh_coordination',
        entity_id: 2,
        idempotency_key: 'repo-test-oh-2',
      });
      notif2Id = r2.insertId as number;

      // Seed notification for qualityStaffId
      const r3 = await db.createNotification({
        recipient_user_id: qualityStaffId,
        event_type: 'capa_created',
        title_key: 'notif.capa.title',
        message_key: 'notif.capa.msg',
        entity_type: 'prevention_action',
        entity_id: 1,
        idempotency_key: 'repo-test-quality-1',
      });
      notif3Id = r3.insertId as number;
    });

    test('getNotifications returns only records belonging to the supplied user, newest first', async () => {
      const notifs = await db.getNotifications(ohProfessionalId);
      expect(notifs.length).toBe(2);
      expect(notifs.every(n => n.recipient_user_id === ohProfessionalId)).toBe(true);
      expect(notifs[0].id).toBe(notif2Id); // newest first
      expect(notifs[1].id).toBe(notif1Id);
    });

    test('getUnreadNotificationCount returns accurate unread count', async () => {
      const count = await db.getUnreadNotificationCount(ohProfessionalId);
      expect(count).toBe(2);

      const qualityCount = await db.getUnreadNotificationCount(qualityStaffId);
      expect(qualityCount).toBe(1);
    });

    test('markNotificationRead updates only the specified notification and sets read_at', async () => {
      const res = await db.markNotificationRead(notif1Id, ohProfessionalId);
      expect(res.rowsAffected).toBe(1);

      const updated = await db.get<any>(
        `SELECT * FROM in_app_notifications WHERE id = ?`,
        [notif1Id],
      );
      expect(updated.is_read).toBe(1);
      expect(updated.read_at).toBeTruthy();

      const newCount = await db.getUnreadNotificationCount(ohProfessionalId);
      expect(newCount).toBe(1);
    });

    test('markNotificationRead prevents cross-user mutation (double guard)', async () => {
      // qualityStaffId tries to mark ohProfessionalId's notification as read
      const res = await db.markNotificationRead(notif2Id, qualityStaffId);
      expect(res.rowsAffected).toBe(0);

      const unchanged = await db.get<any>(
        `SELECT * FROM in_app_notifications WHERE id = ?`,
        [notif2Id],
      );
      expect(unchanged.is_read).toBe(0);
      expect(unchanged.read_at).toBeNull();
    });

    test('markNotificationRead on already read notification no-ops cleanly', async () => {
      const res = await db.markNotificationRead(notif1Id, ohProfessionalId);
      expect(res.rowsAffected).toBe(0);
    });

    test('getNotifications with filters supports is_read and limit', async () => {
      const unreadList = await db.getNotifications(ohProfessionalId, { is_read: 0 });
      expect(unreadList.length).toBe(1);
      expect(unreadList[0].id).toBe(notif2Id);

      const readList = await db.getNotifications(ohProfessionalId, { is_read: 1 });
      expect(readList.length).toBe(1);
      expect(readList[0].id).toBe(notif1Id);

      const limited = await db.getNotifications(ohProfessionalId, { limit: 1 });
      expect(limited.length).toBe(1);
    });

    test('markAllNotificationsRead updates all unread notifications for that user', async () => {
      const res = await db.markAllNotificationsRead(ohProfessionalId);
      expect(res.rowsAffected).toBe(1); // notif2 was the only remaining unread

      const count = await db.getUnreadNotificationCount(ohProfessionalId);
      expect(count).toBe(0);

      // qualityStaff notification should remain unread
      const qCount = await db.getUnreadNotificationCount(qualityStaffId);
      expect(qCount).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. tech_admin Role Boundaries
  // ────────────────────────────────────────────────────────────
  describe('tech_admin Role Boundaries', () => {
    test('getNotifications for tech_admin returns empty list', async () => {
      const notifs = await db.getNotifications(techAdminId);
      expect(notifs).toEqual([]);
    });

    test('getUnreadNotificationCount for tech_admin returns 0', async () => {
      const count = await db.getUnreadNotificationCount(techAdminId);
      expect(count).toBe(0);
    });

    test('markNotificationRead for tech_admin returns rowsAffected 0', async () => {
      const res = await db.markNotificationRead(1, techAdminId);
      expect(res.rowsAffected).toBe(0);
    });

    test('markAllNotificationsRead for tech_admin returns rowsAffected 0', async () => {
      const res = await db.markAllNotificationsRead(techAdminId);
      expect(res.rowsAffected).toBe(0);
    });

    test('insertNotification explicitly prohibits tech_admin as recipient', async () => {
      await expect(
        db.createNotification({
          recipient_user_id: techAdminId,
          event_type: 'declaration_submitted',
          title_key: 't',
          message_key: 'm',
          entity_type: 'aes_declaration',
          entity_id: 1,
          idempotency_key: 'tech-admin-prohibited',
        }),
      ).rejects.toThrow('Unauthorized: operational notifications cannot be created for tech_admin');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Demonstration Reset Integration & Rollback Atomicity
  // ────────────────────────────────────────────────────────────
  describe('Demonstration Reset Integration', () => {
    test('Notifications are deleted during a successful reset', async () => {
      // Seed a notification before reset
      await db.createNotification({
        recipient_user_id: adminReviewerId,
        event_type: 'declaration_submitted',
        title_key: 't',
        message_key: 'm',
        entity_type: 'aes_declaration',
        entity_id: 1,
        idempotency_key: 'reset-test-before-reset',
      });

      const beforeCount = await db.all(`SELECT * FROM in_app_notifications;`);
      expect(beforeCount.length).toBeGreaterThan(0);

      const resetResult = await db.resetDemoScenario(techAdminId);
      expect(resetResult.success).toBe(true);

      // In Phase 2D.2D, resetDemoScenario reseeds exactly 4 baseline notifications
      const afterCount = await db.all(`SELECT * FROM in_app_notifications;`);
      expect(afterCount.length).toBe(4);

      // Existing synthetic users remain intact
      const users = await db.all(`SELECT * FROM demo_users;`);
      expect(users.length).toBeGreaterThanOrEqual(5);

      // Foreign key check passes with zero violations
      const fkViolations = await db.all(`PRAGMA foreign_key_check;`);
      expect(fkViolations).toEqual([]);
    });

    test('Notification deletion is rolled back if a later reset operation fails', async () => {
      // Seed a notification
      await db.createNotification({
        recipient_user_id: adminReviewerId,
        event_type: 'declaration_submitted',
        title_key: 't',
        message_key: 'm',
        entity_type: 'aes_declaration',
        entity_id: 1,
        idempotency_key: 'reset-rollback-test-key',
      });

      const countBefore = (await db.all(`SELECT * FROM in_app_notifications;`)).length;
      expect(countBefore).toBe(5); // 4 baseline seeded notifications + 1 test notification

      // Spy or inject a failure in transaction during reset
      const originalExecute = (adapter as any).transaction;
      jest.spyOn(adapter as any, 'transaction').mockImplementationOnce(async (fn: any) => {
        await originalExecute.call(adapter, async (tx: any) => {
          // Call the normal fn which deletes in_app_notifications
          await fn(tx);
          // Simulate fatal failure at the end of reset transaction
          throw new Error('Simulated failure during reset audit event insert');
        });
      });

      await expect(db.resetDemoScenario(techAdminId)).rejects.toThrow(
        'Simulated failure during reset audit event insert',
      );

      // Notification should NOT have been deleted due to atomic rollback
      const countAfter = (await db.all(`SELECT * FROM in_app_notifications;`)).length;
      expect(countAfter).toBe(countBefore);

      const stillThere = await db.all(
        `SELECT * FROM in_app_notifications WHERE idempotency_key = 'reset-rollback-test-key'`,
      );
      expect(stillThere.length).toBe(1);

      // PRAGMA foreign_key_check passes
      const fkViolations = await db.all(`PRAGMA foreign_key_check;`);
      expect(fkViolations).toEqual([]);
    });
  });
});
