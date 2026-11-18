/**
 * AES Guardian — Notification Navigation & Record-Level Authorization Tests (Phase 2D.2F.1.1)
 *
 * Verifies:
 * 1. 11 Canonical Event Destinations: Correct route and exact correlated params for authorized roles.
 * 2. Correction A — Removal of Notification Existence Oracle:
 *    - Recipient-scoped lookup is the sole authoritative query (WHERE id = ? AND recipient_user_id = ?).
 *    - Foreign notification IDs and non-existent IDs produce indistinguishable failure outcomes ({ status: 'not_found' }).
 *    - No second existence query (SELECT id FROM in_app_notifications WHERE id = ?) is ever executed.
 *    - No destination route, route parameters, or entity reference is returned on failure.
 *    - No notification read-state mutation occurs on failure.
 *    - Invalid notification IDs fail before database access.
 * 3. Correction B — Active Identity & Persisted Role Consistency:
 *    - Active user verified against demo_users database table.
 *    - Active context role must strictly equal persisted role in database.
 *    - Missing active user from database fails ('unauthorized').
 *    - Role mismatch between context and persisted record fails ('unauthorized').
 *    - Role mismatch reveals no destination and mutates no read state.
 *    - Missing, invalid, or unauthenticated role fails ('unauthorized').
 *    - tech_admin in context or in database fails ('unauthorized').
 * 4. Correlated Route and Parameter Types:
 *    - Every valid route/parameter pair compiles.
 *    - Route narrowing correlates route to exact RootStackParamList params.
 *    - Negative compile-time proofs (cross-route parameter rejection).
 * 5. Strict Role Matrix & tech_admin Blanket Denial across all events.
 * 6. Structural & Target Entity Not Found Handling.
 * 7. Segregation of OH Views: exposed_professional routes to declarationCoordinationStatus, NOT ohCoordinationDetail.
 * 8. Read-State Invariance on all outcomes.
 */

import { AesGuardianDatabase } from '../../../core/database/AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../../../core/database/NativeSQLiteAdapter';
import type { InAppNotification } from '../../../core/database/types';
import type { AuthContext } from '../../../core/auth/boundaries';
import type { RootStackParamList } from '../../../navigation/routes';
import {
  resolveNotificationNavigation,
  NotificationNavigationResult,
  NotificationNavigationSuccess,
  NotificationDestinationRoute,
} from '../navigation/notification-navigation-resolver';

describe('AES Guardian — Notification Navigation & Authorization (Phase 2D.2F.1.1)', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  // Test identities
  let exposed1Id: number;
  let exposed2Id: number;
  let adminReviewerId: number;
  let ohProfessionalId: number;
  let qualityStaffId: number;
  let techAdminId: number;

  let ctxExposed1: AuthContext;
  let ctxExposed2: AuthContext;
  let ctxAdminReviewer: AuthContext;
  let ctxOhProfessional: AuthContext;
  let ctxQualityStaff: AuthContext;
  let ctxTechAdmin: AuthContext;
  let ctxUnauthenticated: AuthContext;

  // Seeded entity IDs
  let decl1Id: number;
  let decl2Id: number;
  let reviewCompletedId: number;
  let reviewCorrectionId: number;
  let correctionRespId: number;
  let ohCoordId: number;
  let ohEventId: number;
  let capaId: number;

  // Seeded persisted notifications for all 11 canonical events
  let notifDeclSubmitted: InAppNotification;
  let notifReviewCompleted: InAppNotification;
  let notifCorrectionRequested: InAppNotification;
  let notifCorrectionSubmitted: InAppNotification;
  let notifOhCoordCreated: InAppNotification;
  let notifOhCoordAck: InAppNotification;
  let notifOhMilestone: InAppNotification;
  let notifOhCoordComp: InAppNotification;
  let notifCapaCreated: InAppNotification;
  let notifCapaStatusChanged: InAppNotification;
  let notifCapaFinalized: InAppNotification;

  beforeAll(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();

    // 1. Seed demo users
    const u1 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('nav.exp1', 'Exposed 1', 'exposed_professional')`,
    );
    exposed1Id = u1.insertId as number;

    const u2 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('nav.exp2', 'Exposed 2', 'exposed_professional')`,
    );
    exposed2Id = u2.insertId as number;

    const u3 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('nav.admin', 'Admin Reviewer', 'admin_reviewer')`,
    );
    adminReviewerId = u3.insertId as number;

    const u4 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('nav.oh', 'OH Professional', 'oh_professional')`,
    );
    ohProfessionalId = u4.insertId as number;

    const u5 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('nav.quality', 'Quality Staff', 'quality_staff')`,
    );
    qualityStaffId = u5.insertId as number;

    const u6 = await db.run(
      `INSERT INTO demo_users (username, display_name, role) VALUES ('nav.tech', 'Tech Admin', 'tech_admin')`,
    );
    techAdminId = u6.insertId as number;

    ctxExposed1 = {
      isAuthenticated: true,
      role: 'exposed_professional',
      displayName: 'Exposed 1',
      userId: exposed1Id,
    };

    ctxExposed2 = {
      isAuthenticated: true,
      role: 'exposed_professional',
      displayName: 'Exposed 2',
      userId: exposed2Id,
    };

    ctxAdminReviewer = {
      isAuthenticated: true,
      role: 'admin_reviewer',
      displayName: 'Admin Reviewer',
      userId: adminReviewerId,
    };

    ctxOhProfessional = {
      isAuthenticated: true,
      role: 'oh_professional',
      displayName: 'OH Professional',
      userId: ohProfessionalId,
    };

    ctxQualityStaff = {
      isAuthenticated: true,
      role: 'quality_staff',
      displayName: 'Quality Staff',
      userId: qualityStaffId,
    };

    ctxTechAdmin = {
      isAuthenticated: true,
      role: 'tech_admin',
      displayName: 'Tech Admin',
      userId: techAdminId,
    };

    ctxUnauthenticated = {
      isAuthenticated: false,
      role: 'unauthenticated',
      displayName: null,
      userId: null,
    };

    // 2. Seed Declarations
    const d1 = await db.run(
      `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
       VALUES ('AES-NAV-001', ?, '2026-11-01', 'percutaneous_exposure', 'submitted')`,
      [exposed1Id],
    );
    decl1Id = d1.insertId as number;

    const d2 = await db.run(
      `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
       VALUES ('AES-NAV-002', ?, '2026-11-02', 'mucocutaneous_exposure', 'submitted')`,
      [exposed2Id],
    );
    decl2Id = d2.insertId as number;

    // 3. Seed Administrative Reviews
    const r1 = await db.run(
      `INSERT INTO administrative_reviews (declaration_id, reviewer_user_id, outcome, comments)
       VALUES (?, ?, 'acknowledged', 'Standard review acknowledge')`,
      [decl1Id, adminReviewerId],
    );
    reviewCompletedId = r1.insertId as number;

    const r2 = await db.run(
      `INSERT INTO administrative_reviews (declaration_id, reviewer_user_id, outcome, correction_reason)
       VALUES (?, ?, 'correction_requested', 'Need more details on exposure context')`,
      [decl1Id, adminReviewerId],
    );
    reviewCorrectionId = r2.insertId as number;

    // 4. Seed Correction Response
    const cr = await db.run(
      `INSERT INTO correction_responses (declaration_id, review_id, responding_user_id, response_text)
       VALUES (?, ?, ?, 'Additional clinical notes provided')`,
      [decl1Id, reviewCorrectionId, exposed1Id],
    );
    correctionRespId = cr.insertId as number;

    // 5. Seed OH Coordination
    const coord = await db.run(
      `INSERT INTO oh_coordinations (declaration_id, created_by_user_id, coordination_reason, status, acknowledged_by_user_id, acknowledged_at)
       VALUES (?, ?, 'routine_followup', 'acknowledged', ?, '2026-11-02T10:00:00Z')`,
      [decl1Id, adminReviewerId, ohProfessionalId],
    );
    ohCoordId = coord.insertId as number;

    // 6. Seed OH Follow-Up Event
    const ev = await db.run(
      `INSERT INTO oh_follow_up_events (coordination_id, event_category, event_date, recorded_by_user_id, administrative_note)
       VALUES (?, 'contact_established', '2026-11-03', ?, 'Phone contact established')`,
      [ohCoordId, ohProfessionalId],
    );
    ohEventId = ev.insertId as number;

    // 7. Seed Prevention Action (CAPA)
    const capa = await db.run(
      `INSERT INTO prevention_actions (reference_code, title, description, action_type, contributing_factor, rationale, status, created_by_user_id)
       VALUES ('CAPA-NAV-01', 'Sharp safety redesign', 'Need better containers', 'corrective', 'waste_disposal_container', 'Protocol review', 'proposed', ?)`,
      [qualityStaffId],
    );
    capaId = capa.insertId as number;

    // 8. Helper to create and retrieve persisted notification
    async function insertAndGet(
      recipientId: number,
      eventType: InAppNotification['event_type'],
      entityType: InAppNotification['entity_type'],
      entityId: number,
      ref: string,
    ): Promise<InAppNotification> {
      const res = await db.createNotification({
        recipient_user_id: recipientId,
        event_type: eventType,
        title_key: `notification.${eventType}.title`,
        message_key: `notification.${eventType}.message`,
        entity_type: entityType,
        entity_id: entityId,
        entity_reference: ref,
        idempotency_key: `test-canonical-${eventType}-${entityId}`,
      });
      const notifId = res.insertId as number;
      const notif = await db.getNotificationById(notifId, recipientId);
      if (!notif) throw new Error(`Failed to insert and retrieve notification for ${eventType}`);
      return notif;
    }

    // Seed 11 canonical notifications in DB with correct recipients
    notifDeclSubmitted = await insertAndGet(adminReviewerId, 'declaration_submitted', 'aes_declaration', decl1Id, 'AES-NAV-001');
    notifReviewCompleted = await insertAndGet(exposed1Id, 'review_completed', 'administrative_review', reviewCompletedId, 'AES-NAV-001');
    notifCorrectionRequested = await insertAndGet(exposed1Id, 'correction_requested', 'administrative_review', reviewCorrectionId, 'AES-NAV-001');
    notifCorrectionSubmitted = await insertAndGet(adminReviewerId, 'correction_submitted', 'correction_response', correctionRespId, 'AES-NAV-001');
    notifOhCoordCreated = await insertAndGet(ohProfessionalId, 'oh_coordination_created', 'oh_coordination', ohCoordId, 'AES-NAV-001');
    notifOhCoordAck = await insertAndGet(exposed1Id, 'oh_coordination_acknowledged', 'oh_coordination', ohCoordId, 'AES-NAV-001');
    notifOhMilestone = await insertAndGet(exposed1Id, 'oh_milestone_recorded', 'oh_follow_up_events', ohEventId, 'AES-NAV-001');
    notifOhCoordComp = await insertAndGet(exposed1Id, 'oh_coordination_completed', 'oh_coordination', ohCoordId, 'AES-NAV-001');
    notifCapaCreated = await insertAndGet(qualityStaffId, 'capa_created', 'prevention_action', capaId, 'CAPA-NAV-01');
    notifCapaStatusChanged = await insertAndGet(qualityStaffId, 'capa_status_changed', 'prevention_action', capaId, 'CAPA-NAV-01');
    notifCapaFinalized = await insertAndGet(qualityStaffId, 'capa_finalized', 'prevention_action', capaId, 'CAPA-NAV-01');
  });

  afterAll(async () => {
    await adapter.close();
  });

  // ────────────────────────────────────────────────────────────
  // 1. All 11 Canonical Event Destinations (Success with authorized role)
  // ────────────────────────────────────────────────────────────
  describe('Canonical Event Destinations (Authorized Roles)', () => {
    test('1. declaration_submitted -> adminReviewAction { declarationId }', async () => {
      const result = await resolveNotificationNavigation(notifDeclSubmitted, ctxAdminReviewer, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('adminReviewAction');
        expect(result.params).toEqual({ declarationId: decl1Id });
      }
    });

    test('2. review_completed -> declarationDetails { declarationId }', async () => {
      const result = await resolveNotificationNavigation(notifReviewCompleted, ctxExposed1, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('declarationDetails');
        expect(result.params).toEqual({ declarationId: decl1Id });
      }
    });

    test('3. correction_requested -> correctionResponse { declarationId, reviewId }', async () => {
      const result = await resolveNotificationNavigation(notifCorrectionRequested, ctxExposed1, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('correctionResponse');
        expect(result.params).toEqual({
          declarationId: decl1Id,
          reviewId: reviewCorrectionId,
        });
      }
    });

    test('4. correction_submitted -> adminReviewAction { declarationId }', async () => {
      const result = await resolveNotificationNavigation(notifCorrectionSubmitted, ctxAdminReviewer, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('adminReviewAction');
        expect(result.params).toEqual({ declarationId: decl1Id });
      }
    });

    test('5. oh_coordination_created -> ohCoordinationDetail { coordinationId }', async () => {
      const result = await resolveNotificationNavigation(notifOhCoordCreated, ctxOhProfessional, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('ohCoordinationDetail');
        expect(result.params).toEqual({ coordinationId: ohCoordId });
      }
    });

    test('6. oh_coordination_acknowledged -> declarationCoordinationStatus { declarationId }', async () => {
      const result = await resolveNotificationNavigation(notifOhCoordAck, ctxExposed1, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('declarationCoordinationStatus');
        expect(result.params).toEqual({ declarationId: decl1Id });
      }
    });

    test('7. oh_milestone_recorded -> declarationCoordinationStatus { declarationId }', async () => {
      const result = await resolveNotificationNavigation(notifOhMilestone, ctxExposed1, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('declarationCoordinationStatus');
        expect(result.params).toEqual({ declarationId: decl1Id });
      }
    });

    test('8. oh_coordination_completed -> declarationCoordinationStatus { declarationId }', async () => {
      const result = await resolveNotificationNavigation(notifOhCoordComp, ctxExposed1, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('declarationCoordinationStatus');
        expect(result.params).toEqual({ declarationId: decl1Id });
      }
    });

    test('9. capa_created -> preventionActionDetail { actionId }', async () => {
      const result = await resolveNotificationNavigation(notifCapaCreated, ctxQualityStaff, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('preventionActionDetail');
        expect(result.params).toEqual({ actionId: capaId });
      }
    });

    test('10. capa_status_changed -> preventionActionDetail { actionId }', async () => {
      const result = await resolveNotificationNavigation(notifCapaStatusChanged, ctxQualityStaff, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('preventionActionDetail');
        expect(result.params).toEqual({ actionId: capaId });
      }
    });

    test('11. capa_finalized -> preventionActionDetail { actionId }', async () => {
      const result = await resolveNotificationNavigation(notifCapaFinalized, ctxQualityStaff, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('preventionActionDetail');
        expect(result.params).toEqual({ actionId: capaId });
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Correction A — Removal of Notification Existence Oracle
  // ────────────────────────────────────────────────────────────
  describe('Correction A — Removal of Notification Existence Oracle', () => {
    test('1. Notification addressed to another user returns generic not_found', async () => {
      // notifReviewCompleted belongs to exposed1 in DB; accessed by exposed2
      const result = await resolveNotificationNavigation(notifReviewCompleted, ctxExposed2, db);
      expect(result.status).toBe('not_found');
      if (result.status !== 'success') {
        expect(result.reason).toBe(`Notification ${notifReviewCompleted.id} was not found.`);
      }
      expect((result as any).route).toBeUndefined();
      expect((result as any).params).toBeUndefined();
    });

    test('2. Non-existent notification ID returns generic not_found', async () => {
      const missingNotification: InAppNotification = {
        id: 999999,
        recipient_user_id: exposed1Id,
        event_type: 'review_completed',
        title_key: 'notification.review_completed.title',
        message_key: 'notification.review_completed.message',
        entity_type: 'administrative_review',
        entity_id: reviewCompletedId,
        entity_reference: 'AES-NAV-001',
        is_read: 0,
        created_at: '2026-11-01T12:00:00Z',
        read_at: null,
        idempotency_key: 'missing-test-key',
      };

      const result = await resolveNotificationNavigation(missingNotification, ctxExposed1, db);
      expect(result.status).toBe('not_found');
      if (result.status !== 'success') {
        expect(result.reason).toBe('Notification 999999 was not found.');
      }
      expect((result as any).route).toBeUndefined();
      expect((result as any).params).toBeUndefined();
    });

    test('3. Foreign notification and nonexistent notification produce indistinguishable failure outcomes (Anti-oracle proof)', async () => {
      // Foreign notification (exists in DB, recipient is exposed1)
      const foreignResult = await resolveNotificationNavigation(notifReviewCompleted, ctxExposed2, db);

      // Nonexistent notification (does not exist in DB at all)
      const nonExistentNotification: InAppNotification = {
        ...notifReviewCompleted,
        id: 888888,
      };
      const nonExistentResult = await resolveNotificationNavigation(nonExistentNotification, ctxExposed2, db);

      // Both must be strictly indistinguishable externally:
      expect(foreignResult.status).toBe('not_found');
      expect(nonExistentResult.status).toBe('not_found');

      expect(foreignResult).toEqual({
        status: 'not_found',
        reason: `Notification ${notifReviewCompleted.id} was not found.`,
      });
      expect(nonExistentResult).toEqual({
        status: 'not_found',
        reason: `Notification ${nonExistentNotification.id} was not found.`,
      });

      // No destination route or params leaked
      expect((foreignResult as any).route).toBeUndefined();
      expect((foreignResult as any).params).toBeUndefined();
      expect((nonExistentResult as any).route).toBeUndefined();
      expect((nonExistentResult as any).params).toBeUndefined();
    });

    test('4. No second existence query is executed during recipient lookup', async () => {
      const querySpy = jest.spyOn(db, 'query');
      querySpy.mockClear();

      // Attempt to resolve foreign notification
      await resolveNotificationNavigation(notifReviewCompleted, ctxExposed2, db);

      // Inspect all executed SQL strings
      const executedSqls = querySpy.mock.calls.map(call => call[0] as string);

      // Verify that no unconstrained query on in_app_notifications (without recipient_user_id) was executed
      const oracleQueries = executedSqls.filter(
        sql => sql.includes('in_app_notifications') && !sql.includes('recipient_user_id'),
      );
      expect(oracleQueries).toHaveLength(0);

      querySpy.mockRestore();
    });

    test('5. Neither foreign nor missing notification resolution changes read state', async () => {
      const foreignNotif = notifReviewCompleted; // recipient = exposed1
      const beforeRecord = await db.getNotificationById(foreignNotif.id, exposed1Id);
      expect(beforeRecord?.is_read).toBe(0);

      // Attempt resolution by foreign user exposed2
      await resolveNotificationNavigation(foreignNotif, ctxExposed2, db);

      // Verify is_read is still 0
      const afterRecord = await db.getNotificationById(foreignNotif.id, exposed1Id);
      expect(afterRecord?.is_read).toBe(0);
    });

    test('6. Stale notification rejection after identity switching: User A -> User B', async () => {
      // User A (exposed1) has a valid notification in DB
      const notifA = notifReviewCompleted;

      // Identity switches to User B (ctxExposed2)
      const result = await resolveNotificationNavigation(notifA, ctxExposed2, db);

      // Must fail closed with generic not_found without revealing destination
      expect(result.status).toBe('not_found');
      expect((result as any).route).toBeUndefined();

      // No read-state mutation occurred for User A's notification
      const record = await db.getNotificationById(notifA.id, exposed1Id);
      expect(record?.is_read).toBe(0);
    });

    test('7. Forged notification object with modified recipient_user_id cannot override database ownership', async () => {
      const forgedNotification: InAppNotification = {
        ...notifReviewCompleted,
        recipient_user_id: exposed2Id, // forged in-memory
      };

      const result = await resolveNotificationNavigation(forgedNotification, ctxExposed2, db);
      expect(result.status).toBe('not_found');
      expect((result as any).route).toBeUndefined();
    });

    test('8. Invalid notification id (0 or negative) returns invalid_event before database access', async () => {
      const querySpy = jest.spyOn(db, 'query');
      querySpy.mockClear();

      const invalidNotif = { ...notifReviewCompleted, id: 0 };
      const result = await resolveNotificationNavigation(invalidNotif, ctxExposed1, db);
      expect(result.status).toBe('invalid_event');

      // Verify no notification query was issued
      const notifQueries = querySpy.mock.calls
        .map(c => c[0] as string)
        .filter(s => s.includes('in_app_notifications'));
      expect(notifQueries).toHaveLength(0);

      querySpy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Correction B — Active Identity & Persisted Role Consistency
  // ────────────────────────────────────────────────────────────
  describe('Correction B — Active Identity & Persisted Role Consistency', () => {
    test('1. Valid active user with matching persisted role succeeds', async () => {
      // ctxExposed1 role 'exposed_professional' matches demo_users role
      const result = await resolveNotificationNavigation(notifReviewCompleted, ctxExposed1, db);
      expect(result.status).toBe('success');
    });

    test('2. Active user missing from the database is rejected with unauthorized', async () => {
      const ctxMissingUser: AuthContext = {
        isAuthenticated: true,
        role: 'exposed_professional',
        displayName: 'Ghost User',
        userId: 777777,
      };

      const result = await resolveNotificationNavigation(notifReviewCompleted, ctxMissingUser, db);
      expect(result.status).toBe('unauthorized');
      if (result.status !== 'success') {
        expect(result.reason).toContain('was not found in database');
      }
      expect((result as any).route).toBeUndefined();
    });

    test('3. Active context role differing from persisted role is rejected with unauthorized', async () => {
      // exposed1Id has persisted role 'exposed_professional'
      // Caller asserts role 'admin_reviewer' in AuthContext
      const ctxTamperedRole: AuthContext = {
        isAuthenticated: true,
        role: 'admin_reviewer',
        displayName: 'Exposed User asserting Admin',
        userId: exposed1Id,
      };

      const result = await resolveNotificationNavigation(notifReviewCompleted, ctxTamperedRole, db);
      expect(result.status).toBe('unauthorized');
      if (result.status !== 'success') {
        expect(result.reason).toContain('does not match persisted role');
      }
      expect((result as any).route).toBeUndefined();

      // Read state must not change
      const record = await db.getNotificationById(notifReviewCompleted.id, exposed1Id);
      expect(record?.is_read).toBe(0);
    });

    test('4. Missing, unauthenticated, or invalid active role is rejected with unauthorized', async () => {
      const ctxInvalidRole: AuthContext = {
        isAuthenticated: true,
        role: 'unauthenticated' as any,
        displayName: 'Invalid Role',
        userId: exposed1Id,
      };

      const result = await resolveNotificationNavigation(notifReviewCompleted, ctxInvalidRole, db);
      expect(result.status).toBe('unauthorized');
      if (result.status !== 'success') {
        expect(result.reason).toContain('missing or unauthenticated');
      }
    });

    test('5. tech_admin remains denied in active context or persisted database record', async () => {
      // In active context
      const res1 = await resolveNotificationNavigation(notifDeclSubmitted, ctxTechAdmin, db);
      expect(res1.status).toBe('unauthorized');
      if (res1.status !== 'success') {
        expect(res1.reason).toContain('tech_admin role is prohibited');
      }

      // Persisted tech_admin even if context asserted another role
      const ctxTechAdminSpoofing: AuthContext = {
        isAuthenticated: true,
        role: 'admin_reviewer',
        displayName: 'Tech Admin Spoofing',
        userId: techAdminId, // persisted role is tech_admin
      };
      const res2 = await resolveNotificationNavigation(notifDeclSubmitted, ctxTechAdminSpoofing, db);
      expect(res2.status).toBe('unauthorized');
    });

    test('6. Role mismatch cannot reveal destination or trigger read-state mutation', async () => {
      const ctxTampered: AuthContext = {
        isAuthenticated: true,
        role: 'oh_professional', // mismatch against exposed_professional
        displayName: 'Tampered OH',
        userId: exposed1Id,
      };

      const result = await resolveNotificationNavigation(notifReviewCompleted, ctxTampered, db);
      expect(result.status).toBe('unauthorized');
      expect((result as any).route).toBeUndefined();
      expect((result as any).params).toBeUndefined();

      const record = await db.getNotificationById(notifReviewCompleted.id, exposed1Id);
      expect(record?.is_read).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Correlated Route and Parameter Types (Compile-time & Runtime)
  // ────────────────────────────────────────────────────────────
  describe('Correlated Route and Parameter Types (Compile-time & Runtime)', () => {
    test('Every valid route/parameter pair compiles without errors', () => {
      const r1: NotificationNavigationSuccess = {
        status: 'success',
        route: 'adminReviewAction',
        params: { declarationId: 1 },
      };
      const r2: NotificationNavigationSuccess = {
        status: 'success',
        route: 'declarationDetails',
        params: { declarationId: 1 },
      };
      const r3: NotificationNavigationSuccess = {
        status: 'success',
        route: 'correctionResponse',
        params: { declarationId: 1, reviewId: 2 },
      };
      const r4: NotificationNavigationSuccess = {
        status: 'success',
        route: 'ohCoordinationDetail',
        params: { coordinationId: 1 },
      };
      const r5: NotificationNavigationSuccess = {
        status: 'success',
        route: 'declarationCoordinationStatus',
        params: { declarationId: 1 },
      };
      const r6: NotificationNavigationSuccess = {
        status: 'success',
        route: 'preventionActionDetail',
        params: { actionId: 1 },
      };
      expect([r1, r2, r3, r4, r5, r6]).toBeDefined();
    });

    test('Type narrowing correctly correlates route to exact params', () => {
      function testNarrowing(res: NotificationNavigationSuccess): number {
        if (res.route === 'correctionResponse') {
          // res.params is strictly { declarationId: number; reviewId: number }
          const declId: number = res.params.declarationId;
          const revId: number = res.params.reviewId;
          return declId + revId;
        } else if (res.route === 'preventionActionDetail') {
          // res.params is strictly { actionId: number }
          const actionId: number = res.params.actionId;
          return actionId;
        } else if (res.route === 'ohCoordinationDetail') {
          const coordId: number = res.params.coordinationId;
          return coordId;
        } else {
          const declId: number = res.params.declarationId;
          return declId;
        }
      }
      expect(testNarrowing).toBeDefined();
    });

    test('Compile-time verification of route and parameter constraints', () => {
      // 1. declarationDetails cannot accept CAPA actionId
      type DeclDetailsParams = Extract<NotificationNavigationSuccess, { route: 'declarationDetails' }>['params'];
      type HasActionId = 'actionId' extends keyof DeclDetailsParams ? true : false;
      const hasActionId: HasActionId = false;
      expect(hasActionId).toBe(false);

      // 2. preventionActionDetail cannot accept declarationId
      type CapaParams = Extract<NotificationNavigationSuccess, { route: 'preventionActionDetail' }>['params'];
      type HasDeclId = 'declarationId' extends keyof CapaParams ? true : false;
      const hasDeclId: HasDeclId = false;
      expect(hasDeclId).toBe(false);

      // 3. correctionResponse requires both declarationId and reviewId
      type CorrParams = Extract<NotificationNavigationSuccess, { route: 'correctionResponse' }>['params'];
      type MissingReviewId = Omit<CorrParams, 'reviewId'> extends CorrParams ? true : false;
      const canOmitReviewId: MissingReviewId = false;
      expect(canOmitReviewId).toBe(false);

      // 4. Invalid route names are not in NotificationDestinationRoute
      type IsInvalidRouteAccepted = 'invalidRoute' extends NotificationDestinationRoute ? true : false;
      const isInvalidAccepted: IsInvalidRouteAccepted = false;
      expect(isInvalidAccepted).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Strict Role Matrix Enforcement
  // ────────────────────────────────────────────────────────────
  describe('Strict Role Matrix Enforcement', () => {
    test('role mismatch against canonical event requirements is rejected', async () => {
      // notifDeclSubmitted is for admin_reviewer; ctxExposed1 is exposed_professional
      // Fails closed (not_found because recipient is adminReviewer, or unauthorized on role)
      const result = await resolveNotificationNavigation(notifDeclSubmitted, ctxExposed1, db);
      expect(['not_found', 'unauthorized']).toContain(result.status);
    });

    test('admin_reviewer cannot navigate to review_completed', async () => {
      const result = await resolveNotificationNavigation(notifReviewCompleted, ctxAdminReviewer, db);
      expect(['not_found', 'unauthorized']).toContain(result.status);
    });

    test('oh_professional cannot navigate to capa_created', async () => {
      const result = await resolveNotificationNavigation(notifCapaCreated, ctxOhProfessional, db);
      expect(['not_found', 'unauthorized']).toContain(result.status);
    });

    test('quality_staff cannot navigate to oh_coordination_created', async () => {
      const result = await resolveNotificationNavigation(notifOhCoordCreated, ctxQualityStaff, db);
      expect(['not_found', 'unauthorized']).toContain(result.status);
    });

    test('exposed_professional cannot navigate to capa_finalized', async () => {
      const result = await resolveNotificationNavigation(notifCapaFinalized, ctxExposed1, db);
      expect(['not_found', 'unauthorized']).toContain(result.status);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. tech_admin Blanket Denial
  // ────────────────────────────────────────────────────────────
  describe('tech_admin Blanket Denial', () => {
    const allNotifs = [
      () => notifDeclSubmitted,
      () => notifReviewCompleted,
      () => notifCorrectionRequested,
      () => notifCorrectionSubmitted,
      () => notifOhCoordCreated,
      () => notifOhCoordAck,
      () => notifOhMilestone,
      () => notifOhCoordComp,
      () => notifCapaCreated,
      () => notifCapaStatusChanged,
      () => notifCapaFinalized,
    ];

    test.each(allNotifs.map((getN, i) => [i + 1, getN]))(
      'tech_admin is denied navigation on event %i',
      async (_, getNotif) => {
        const result = await resolveNotificationNavigation(getNotif(), ctxTechAdmin, db);
        expect(result.status).toBe('unauthorized');
      },
    );
  });

  // ────────────────────────────────────────────────────────────
  // 7. Unauthenticated Caller Denial
  // ────────────────────────────────────────────────────────────
  describe('Unauthenticated Caller Denial', () => {
    test('Unauthenticated session receives status: unauthorized', async () => {
      const result = await resolveNotificationNavigation(notifDeclSubmitted, ctxUnauthenticated, db);
      expect(result.status).toBe('unauthorized');
    });

    test('Context with null userId receives status: unauthorized', async () => {
      const result = await resolveNotificationNavigation(
        notifDeclSubmitted,
        { isAuthenticated: true, role: 'admin_reviewer', displayName: 'Broken', userId: null },
        db,
      );
      expect(result.status).toBe('unauthorized');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. Structural & Mismatch Validation
  // ────────────────────────────────────────────────────────────
  describe('Structural & Mismatch Validation', () => {
    test('Corrupted DB record with missing entity_id returns invalid_event', async () => {
      await db.run(
        `INSERT INTO in_app_notifications (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'declaration_submitted', 't', 'm', 'aes_declaration', 0, 'corrupt-1')`,
        [adminReviewerId],
      );
      const corruptedNotif = (await db.getNotifications(adminReviewerId, { limit: 1 }))[0];
      const result = await resolveNotificationNavigation(corruptedNotif, ctxAdminReviewer, db);
      expect(result.status).toBe('invalid_event');
    });

    test('Corrupted DB record with missing entity_type returns invalid_event', async () => {
      const getNotifSpy = jest.spyOn(db, 'getNotificationById').mockResolvedValueOnce({
        ...notifDeclSubmitted,
        entity_type: '' as any,
      });
      const result = await resolveNotificationNavigation(notifDeclSubmitted, ctxAdminReviewer, db);
      expect(result.status).toBe('invalid_event');
      getNotifSpy.mockRestore();
    });

    test('Mismatched entity_type for declaration_submitted returns invalid_event', async () => {
      await db.run(
        `INSERT INTO in_app_notifications (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'declaration_submitted', 't', 'm', 'prevention_action', ?, 'mismatch-1')`,
        [adminReviewerId, decl1Id],
      );
      const mismatchedNotif = (await db.getNotifications(adminReviewerId, { limit: 1 }))[0];
      const result = await resolveNotificationNavigation(mismatchedNotif, ctxAdminReviewer, db);
      expect(result.status).toBe('invalid_event');
    });

    test('Mismatched entity_type for oh_coordination_created returns invalid_event', async () => {
      await db.run(
        `INSERT INTO in_app_notifications (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'oh_coordination_created', 't', 'm', 'aes_declaration', ?, 'mismatch-2')`,
        [ohProfessionalId, ohCoordId],
      );
      const mismatchedNotif = (await db.getNotifications(ohProfessionalId, { limit: 1 }))[0];
      const result = await resolveNotificationNavigation(mismatchedNotif, ctxOhProfessional, db);
      expect(result.status).toBe('invalid_event');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 9. Target Entity Not Found Handling
  // ────────────────────────────────────────────────────────────
  describe('Target Entity Not Found Handling', () => {
    test('Notification pointing to deleted declaration returns not_found', async () => {
      await db.run(
        `INSERT INTO in_app_notifications (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'declaration_submitted', 't', 'm', 'aes_declaration', 999999, 'deleted-1')`,
        [adminReviewerId],
      );
      const notif = (await db.getNotifications(adminReviewerId, { limit: 1 }))[0];
      const result = await resolveNotificationNavigation(notif, ctxAdminReviewer, db);
      expect(result.status).toBe('not_found');
    });

    test('Notification pointing to deleted review returns not_found', async () => {
      await db.run(
        `INSERT INTO in_app_notifications (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'review_completed', 't', 'm', 'administrative_review', 999999, 'deleted-2')`,
        [exposed1Id],
      );
      const notif = (await db.getNotifications(exposed1Id, { limit: 1 }))[0];
      const result = await resolveNotificationNavigation(notif, ctxExposed1, db);
      expect(result.status).toBe('not_found');
    });

    test('Notification pointing to deleted CAPA returns not_found', async () => {
      await db.run(
        `INSERT INTO in_app_notifications (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'capa_created', 't', 'm', 'prevention_action', 999999, 'deleted-3')`,
        [qualityStaffId],
      );
      const notif = (await db.getNotifications(qualityStaffId, { limit: 1 }))[0];
      const result = await resolveNotificationNavigation(notif, ctxQualityStaff, db);
      expect(result.status).toBe('not_found');
    });

    test('Notification pointing to deleted OH coordination returns not_found', async () => {
      await db.run(
        `INSERT INTO in_app_notifications (recipient_user_id, event_type, title_key, message_key, entity_type, entity_id, idempotency_key)
         VALUES (?, 'oh_coordination_created', 't', 'm', 'oh_coordination', 999999, 'deleted-4')`,
        [ohProfessionalId],
      );
      const notif = (await db.getNotifications(ohProfessionalId, { limit: 1 }))[0];
      const result = await resolveNotificationNavigation(notif, ctxOhProfessional, db);
      expect(result.status).toBe('not_found');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 10. Segregation of OH Views
  // ────────────────────────────────────────────────────────────
  describe('Segregation of OH Views', () => {
    test('exposed_professional never routes to ohCoordinationDetail', async () => {
      const rAck = await resolveNotificationNavigation(notifOhCoordAck, ctxExposed1, db);
      expect(rAck.status).toBe('success');
      if (rAck.status === 'success') {
        expect(rAck.route).toBe('declarationCoordinationStatus');
        expect((rAck as any).route).not.toBe('ohCoordinationDetail');
      }

      const rEvent = await resolveNotificationNavigation(notifOhMilestone, ctxExposed1, db);
      expect(rEvent.status).toBe('success');
      if (rEvent.status === 'success') {
        expect(rEvent.route).toBe('declarationCoordinationStatus');
        expect((rEvent as any).route).not.toBe('ohCoordinationDetail');
      }

      const rComp = await resolveNotificationNavigation(notifOhCoordComp, ctxExposed1, db);
      expect(rComp.status).toBe('success');
      if (rComp.status === 'success') {
        expect(rComp.route).toBe('declarationCoordinationStatus');
        expect((rComp as any).route).not.toBe('ohCoordinationDetail');
      }
    });

    test('oh_professional routes to ohCoordinationDetail for oh_coordination_created', async () => {
      const result = await resolveNotificationNavigation(notifOhCoordCreated, ctxOhProfessional, db);
      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.route).toBe('ohCoordinationDetail');
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // 11. Read-State Contract & Invariance
  // ────────────────────────────────────────────────────────────
  describe('Read-State Invariance', () => {
    test('Navigation resolution does NOT mutate is_read in database', async () => {
      // Insert a fresh notification in DB
      const inserted = await db.createNotification({
        recipient_user_id: exposed1Id,
        event_type: 'review_completed',
        title_key: 'notification.review_completed.title',
        message_key: 'notification.review_completed.message',
        entity_type: 'administrative_review',
        entity_id: reviewCompletedId,
        entity_reference: 'AES-NAV-001',
        idempotency_key: 'test-nav-read-invariance-1',
      });
      expect(inserted.rowsAffected).toBe(1);
      const notifId = inserted.insertId as number;

      const targetBefore = await db.getNotificationById(notifId, exposed1Id);
      expect(targetBefore).not.toBeNull();
      expect(targetBefore?.is_read).toBe(0);

      // Resolve navigation
      const res = await resolveNotificationNavigation(targetBefore!, ctxExposed1, db);
      expect(res.status).toBe('success');

      // Check DB read status is still 0 (unread)
      const targetAfter = await db.getNotificationById(notifId, exposed1Id);
      expect(targetAfter?.is_read).toBe(0);

      // Caller explicitly marks read after navigation
      const markResult = await db.markNotificationRead(notifId, exposed1Id);
      expect(markResult.rowsAffected).toBe(1);

      // Verify now read
      const targetFinal = await db.getNotificationById(notifId, exposed1Id);
      expect(targetFinal?.is_read).toBe(1);
    });

    test('Failed navigation does not mark notification as read', async () => {
      const inserted = await db.createNotification({
        recipient_user_id: adminReviewerId,
        event_type: 'declaration_submitted',
        title_key: 'notification.declaration_submitted.title',
        message_key: 'notification.declaration_submitted.message',
        entity_type: 'aes_declaration',
        entity_id: decl1Id,
        entity_reference: 'AES-NAV-001',
        idempotency_key: 'test-nav-read-invariance-2',
      });
      expect(inserted.rowsAffected).toBe(1);
      const notifId = inserted.insertId as number;

      const target = await db.getNotificationById(notifId, adminReviewerId);
      expect(target).not.toBeNull();
      expect(target?.is_read).toBe(0);

      // Unauthorized user (exposed1) attempts navigation
      const res = await resolveNotificationNavigation(target!, ctxExposed1, db);
      expect(res.status).toBe('not_found');

      // Still unread in database
      const targetAfter = await db.getNotificationById(notifId, adminReviewerId);
      expect(targetAfter?.is_read).toBe(0);
    });
  });
});
