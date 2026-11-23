/**
 * AES Guardian — Notification Workflow Hardening, Authorization Remediation
 * & Atomicity Verification (Phase 2D.2C.1)
 *
 * Genuine Native SQLite Adapter Tests covering:
 * 1. Remediation A: Strict Recipient Resolution & Two-Tier Role Defense
 * 2. Remediation B: Exposed-Professional Record Ownership & Clinical Isolation
 * 3. Remediation C: Transaction Failure-Injection & Rollback Across All Workflows
 * 4. Remediation D: Completion Path Consistency & Idempotency Alignment
 * 5. Remediation E: Notification Payload Privacy & Reference Audit
 */

import { AesGuardianDatabase, PreventionActionCreationUncertainError } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';
import type {
  AesDeclaration,
  AdminOhCoordinationSummary,
  DemoUser,
  InAppNotification,
  OhCoordination,
  PreventionAction,
} from '../types';

describe('AES Guardian — Phase 2D.2C.1: Hardening & Remediation Verification', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  // Canonical demo users
  let exposedUser1Id: number;
  let adminReviewerId: number;
  let ohProfessionalId: number;
  let qualityStaffId: number;
  let techAdminId: number;

  beforeEach(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();

    const userResult = await db.query<{ id: number; role: string }>(
      `SELECT id, role FROM demo_users`,
    );
    for (const u of userResult.rows) {
      if (u.role === 'exposed_professional') exposedUser1Id = u.id;
      else if (u.role === 'admin_reviewer') adminReviewerId = u.id;
      else if (u.role === 'oh_professional') ohProfessionalId = u.id;
      else if (u.role === 'quality_staff') qualityStaffId = u.id;
      else if (u.role === 'tech_admin') techAdminId = u.id;
    }
  });

  afterEach(async () => {
    await adapter.close();
  });

  // Helper to verify PRAGMA foreign_key_check = 0
  async function assertZeroForeignKeyViolations(): Promise<void> {
    const fkCheck = await db.query(`PRAGMA foreign_key_check;`);
    expect(fkCheck.rows.length).toBe(0);
  }

  // ────────────────────────────────────────────────────────────
  // REMEDIATION A: Strict Recipient Resolution
  // ────────────────────────────────────────────────────────────
  describe('Remediation A: Strict Recipient Resolution & Role Defense', () => {
    test('canonical roles resolve to expected canonical user IDs', async () => {
      expect(await db.getRecipientUserIdByRole('admin_reviewer')).toBe(2);
      expect(await db.getRecipientUserIdByRole('oh_professional')).toBe(3);
      expect(await db.getRecipientUserIdByRole('exposed_professional')).toBe(1);
      expect(await db.getRecipientUserIdByRole('quality_staff')).toBe(4);
    });

    test('resolves to non-canonical ID if canonical ID lacks the role', async () => {
      // Create user 10 with admin_reviewer and change user 2's role to something else
      await adapter.execute(
        `INSERT INTO demo_users (id, username, display_name, role)
         VALUES (10, 'alt_admin', 'Alternate Admin', 'admin_reviewer')`,
      );
      await adapter.execute(
        `UPDATE demo_users SET role = 'exposed_professional' WHERE id = 2`,
      );

      const resolved = await db.getRecipientUserIdByRole('admin_reviewer');
      expect(resolved).toBe(10);
    });

    test('throws RecipientResolutionError when no active user has the required role', async () => {
      // Remove all quality_staff users
      await adapter.execute(`DELETE FROM demo_users WHERE role = 'quality_staff'`);

      await expect(db.getRecipientUserIdByRole('quality_staff')).rejects.toThrow(
        /RecipientResolutionError: No active user found with required role 'quality_staff'/,
      );
    });

    test('strictly bars tech_admin from recipient resolution', async () => {
      await expect(db.getRecipientUserIdByRole('tech_admin')).rejects.toThrow(
        /Unauthorized: operational notifications cannot be addressed to 'tech_admin'/,
      );
    });

    test('submitDeclaration rolls back if recipient resolution fails inside transaction', async () => {
      // Delete admin_reviewer so resolution fails inside submitDeclaration
      await adapter.execute(`DELETE FROM demo_users WHERE role = 'admin_reviewer'`);

      const draftId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-12',
        incident_type: 'mucocutaneous_exposure',
      });

      await expect(db.submitDeclaration(draftId)).rejects.toThrow(
        /RecipientResolutionError/,
      );

      // Verify declaration remains draft
      const decl = await db.getDeclarationById(draftId, exposedUser1Id);
      expect(decl?.status).toBe('draft');

      // Verify 0 notifications
      const notifs = await db.query(`SELECT * FROM in_app_notifications`);
      expect(notifs.rows.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('insertNotification enforces strict role check against EVENT_RECIPIENT_ROLE', async () => {
      // Attempting to deliver declaration_submitted (requires admin_reviewer) to exposed_professional (1)
      await expect(
        db.insertNotification({
          recipient_user_id: exposedUser1Id,
          event_type: 'declaration_submitted',
          title_key: 'notification.declarationSubmitted.title',
          message_key: 'notification.declarationSubmitted.message',
          entity_type: 'aes_declaration',
          entity_id: 1,
          idempotency_key: 'notif:test:1',
        }),
      ).rejects.toThrow(
        /insertNotification: recipient user 1 has role 'exposed_professional', but event 'declaration_submitted' requires role 'admin_reviewer'/,
      );
    });

    test('insertNotification strictly denies tech_admin', async () => {
      await expect(
        db.insertNotification({
          recipient_user_id: techAdminId,
          event_type: 'declaration_submitted',
          title_key: 'notification.declarationSubmitted.title',
          message_key: 'notification.declarationSubmitted.message',
          entity_type: 'aes_declaration',
          entity_id: 1,
          idempotency_key: 'notif:test:techadmin',
        }),
      ).rejects.toThrow(/Unauthorized: operational notifications cannot be created for tech_admin/);
    });
  });

  // ────────────────────────────────────────────────────────────
  // REMEDIATION B: Exposed-Professional Record Ownership & Role Boundaries
  // ────────────────────────────────────────────────────────────
  describe('Remediation B: Exposed-Professional Record Ownership & Confidentiality Boundaries', () => {
    let user6Id: number;
    let declUser1Id: number;
    let declUser6Id: number;

    beforeEach(async () => {
      // Create a second exposed professional
      await adapter.execute(
        `INSERT INTO demo_users (id, username, display_name, role)
         VALUES (6, 'nurse_dupont', 'Claire Dupont', 'exposed_professional')`,
      );
      user6Id = 6;

      declUser1Id = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });

      declUser6Id = await db.createDraft({
        declared_by_user_id: user6Id,
        incident_date: '2026-11-11',
        incident_type: 'mucocutaneous_exposure',
      });
    });

    test('1. quality_staff cannot retrieve an identifiable declaration', async () => {
      await expect(db.getDeclarationById(declUser1Id, qualityStaffId)).rejects.toThrow(
        /Unauthorized: quality_staff user 4 is strictly prohibited from accessing identifiable declaration content/,
      );
    });

    test('2. quality_staff cannot retrieve another professional declaration through alternate repository paths', async () => {
      // Alternate path A: getDeclarations with requestingUserId
      await expect(
        db.getDeclarations({ requestingUserId: qualityStaffId }),
      ).rejects.toThrow(
        /Unauthorized: quality_staff user 4 is strictly prohibited from accessing identifiable declaration content/,
      );

      // Alternate path B: getDeclarationsByStatus with requestingUserId
      await expect(
        db.getDeclarationsByStatus('draft', qualityStaffId),
      ).rejects.toThrow(
        /Unauthorized: quality_staff user 4 is strictly prohibited from accessing identifiable declaration content/,
      );

      // Alternate path C: getReviewQueue with requestingUserId
      await expect(
        db.getReviewQueue({ requestingUserId: qualityStaffId }),
      ).rejects.toThrow(
        /Unauthorized: only admin_reviewer may access the review queue, got quality_staff/,
      );

      // Alternate path D: getCorrectionResponses with requestingUserId
      await expect(
        db.getCorrectionResponses(declUser1Id, qualityStaffId),
      ).rejects.toThrow(
        /Unauthorized: quality_staff user 4 is strictly prohibited from accessing correction response content/,
      );

      // Alternate path E: getDeclarationReviewHistory with requestingUserId
      await expect(
        db.getDeclarationReviewHistory(declUser1Id, qualityStaffId),
      ).rejects.toThrow(
        /Unauthorized: quality_staff user 4 is strictly prohibited from accessing review history content/,
      );

      // Alternate path F: getOhCoordinationById with requesting_user_id
      await expect(
        db.getOhCoordinationById(1, qualityStaffId),
      ).rejects.toThrow(
        /getOhCoordinationById: quality_staff is not authorized to access coordination data/,
      );

      // Alternate path G: getOhFollowUpEvents with requesting_user_id
      await expect(
        db.getOhFollowUpEvents(1, qualityStaffId),
      ).rejects.toThrow(
        /getOhFollowUpEvents: role quality_staff is not authorized to read follow-up events/,
      );
    });

    test('3. quality_staff can still retrieve de-identified aggregate surveillance metrics', async () => {
      const metrics = await db.getSurveillanceDashboardMetrics(qualityStaffId);
      expect(metrics).toBeDefined();
      expect(metrics.overview).toBeDefined();
      expect(typeof metrics.overview.totalDeclarations).toBe('number');
      // Verify aggregate contains zero declarant identifiers or reference numbers
      expect((metrics as any).reference_number).toBeUndefined();
      expect((metrics as any).declared_by_user_id).toBeUndefined();
    });

    test('4. quality_staff can still create a CAPA', async () => {
      const capa = await db.createPreventionAction(qualityStaffId, {
        title: 'Protocole aiguilles sécurisées',
        description: 'Mise en place de collecteurs adaptés',
        action_type: 'preventive',
        contributing_factor: 'device_safety_design',
        rationale: 'Réduction des expositions percutanées',
      });
      expect(capa).toBeDefined();
      expect(capa.status).toBe('proposed');
      expect(capa.created_by_user_id).toBe(qualityStaffId);
    });

    test('5. quality_staff can still update CAPA status', async () => {
      const capa = await db.createPreventionAction(qualityStaffId, {
        title: 'Mise à niveau EPI',
        description: 'Vérification gants et masques',
        action_type: 'preventive',
        contributing_factor: 'protective_equipment',
        rationale: 'Protection mucocutanée',
      });

      const updated = await db.updatePreventionActionStatus(
        qualityStaffId,
        capa.id,
        'in_progress',
      );
      expect(updated.status).toBe('in_progress');
    });

    test('6. admin_reviewer retains authorized declaration access', async () => {
      const decl = await db.getDeclarationById(declUser1Id, adminReviewerId);
      expect(decl?.id).toBe(declUser1Id);
    });

    test('7. oh_professional is rejected from direct declaration retrieval (must access via coordination)', async () => {
      await expect(db.getDeclarationById(declUser1Id, ohProfessionalId)).rejects.toThrow(
        /Unauthorized: oh_professional user \d+ is strictly prohibited from direct declaration retrieval/i,
      );
    });

    test('8. exposed_professional retains access to their own declaration', async () => {
      const decl1 = await db.getDeclarationById(declUser1Id, exposedUser1Id);
      expect(decl1?.id).toBe(declUser1Id);
    });

    test('9. exposed_professional remains blocked from another professional declaration', async () => {
      await expect(db.getDeclarationById(declUser6Id, exposedUser1Id)).rejects.toThrow(
        /Unauthorized: exposed_professional user 1 is not permitted to access declaration \d+ owned by user 6/,
      );
    });

    test('10. tech_admin remains blocked from identifiable operational data', async () => {
      await expect(db.getDeclarationById(declUser1Id, techAdminId)).rejects.toThrow(
        /Unauthorized: tech_admin user 5 is strictly prohibited from accessing clinical declaration content/,
      );
      await expect(
        db.getDeclarations({ requestingUserId: techAdminId }),
      ).rejects.toThrow(
        /Unauthorized: tech_admin user 5 is strictly prohibited from accessing clinical declaration content/,
      );
      await expect(
        db.getOhCoordinationById(1, techAdminId),
      ).rejects.toThrow(
        /getOhCoordinationById: tech_admin is not authorized to access coordination data/,
      );
    });

    test('11. access denials do not mutate database records or generate notifications', async () => {
      const initialNotifs = (await db.query(`SELECT COUNT(*) as cnt FROM in_app_notifications`)).rows[0];
      const initialDecls = (await db.query(`SELECT COUNT(*) as cnt FROM aes_declarations`)).rows[0];

      // Attempt unauthorized access
      await expect(db.getDeclarationById(declUser1Id, qualityStaffId)).rejects.toThrow();
      await expect(db.getDeclarationById(declUser1Id, techAdminId)).rejects.toThrow();

      const postNotifs = (await db.query(`SELECT COUNT(*) as cnt FROM in_app_notifications`)).rows[0];
      const postDecls = (await db.query(`SELECT COUNT(*) as cnt FROM aes_declarations`)).rows[0];

      expect(postNotifs).toEqual(initialNotifs);
      expect(postDecls).toEqual(initialDecls);

      await assertZeroForeignKeyViolations();
    });
  });

  // ────────────────────────────────────────────────────────────
  // PHASE 2D.2C.3: Fail-Closed Repository Authorization & Confidentiality Audit
  // ────────────────────────────────────────────────────────────
  describe('Phase 2D.2C.3: Fail-Closed Repository Authorization Audit', () => {
    let testDeclId: number;
    let otherDeclId: number;
    let coordId: number;
    let otherUserId: number;

    beforeEach(async () => {
      await adapter.execute(
        `INSERT INTO demo_users (id, username, display_name, role)
         VALUES (99, 'other_ep', 'Other EP', 'exposed_professional')`,
      );
      otherUserId = 99;

      testDeclId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-12',
        incident_type: 'percutaneous_exposure',
        exposure_description: 'Needlestick incident',
        circumstances: 'Blood draw',
      });
      await db.submitDeclaration(testDeclId);

      otherDeclId = await db.createDraft({
        declared_by_user_id: otherUserId,
        incident_date: '2026-11-13',
        incident_type: 'mucocutaneous_exposure',
        exposure_description: 'Splash incident',
        circumstances: 'Cleaning',
      });
      await db.submitDeclaration(otherDeclId);

      coordId = await db.createOhCoordination({
        declaration_id: testDeclId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'routine_followup',
      });
    });

    test('1. getDeclarationById: missing identity throws fail-closed Unauthorized', async () => {
      await expect(db.getDeclarationById(testDeclId)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access declaration content/,
      );
      await expect(db.getDeclarationById(testDeclId, undefined)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access declaration content/,
      );
    });

    test('2. getDeclarations: missing identity throws fail-closed Unauthorized', async () => {
      await expect(db.getDeclarations()).rejects.toThrow(
        /Unauthorized: requesting user ID is required to query declarations/,
      );
      await expect(db.getDeclarations({ limit: 10 })).rejects.toThrow(
        /Unauthorized: requesting user ID is required to query declarations/,
      );
    });

    test('3. getDeclarationsByStatus: missing identity throws fail-closed Unauthorized', async () => {
      await expect(db.getDeclarationsByStatus('submitted')).rejects.toThrow(
        /Unauthorized: requesting user ID is required to query declarations by status/,
      );
      await expect(db.getDeclarationsByStatus('submitted', undefined)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to query declarations by status/,
      );
    });

    test('4. getReviewQueue: missing identity throws fail-closed Unauthorized', async () => {
      await expect(db.getReviewQueue()).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access the review queue/,
      );
      await expect(db.getReviewQueue({ limit: 5 })).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access the review queue/,
      );
    });

    test('5. getCorrectionResponses: missing identity throws fail-closed Unauthorized', async () => {
      await expect(db.getCorrectionResponses(testDeclId)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access correction responses/,
      );
      await expect(db.getCorrectionResponses(testDeclId, undefined)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access correction responses/,
      );
    });

    test('6. getDeclarationReviewHistory: missing identity throws fail-closed Unauthorized', async () => {
      await expect(db.getDeclarationReviewHistory(testDeclId)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access review history/,
      );
      await expect(db.getDeclarationReviewHistory(testDeclId, undefined)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access review history/,
      );
      await expect(db.getDeclarationReviewHistory(testDeclId, { order: 'DESC' })).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access review history/,
      );
    });

    test('7. getOhCoordinationById and getOhCoordinationByDeclaration: missing identity throws fail-closed Unauthorized', async () => {
      await expect(db.getOhCoordinationById(coordId, undefined as any)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access coordination data/,
      );
      await expect(db.getOhCoordinationByDeclaration(testDeclId, undefined as any)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to access coordination data/,
      );
    });

    test('8. getOhFollowUpEvents: missing identity throws fail-closed Unauthorized', async () => {
      await expect(db.getOhFollowUpEvents(coordId, undefined as any)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to read follow-up events/,
      );
    });

    test('9. Invalid/non-existent user ID fails closed with not found error', async () => {
      const nonExistentUserId = 888888;
      await expect(db.getDeclarationById(testDeclId, nonExistentUserId)).rejects.toThrow(
        /getDeclarationById: requesting user 888888 not found/,
      );
      await expect(db.getDeclarations({ requestingUserId: nonExistentUserId })).rejects.toThrow(
        /getDeclarations: requesting user 888888 not found/,
      );
      await expect(db.getDeclarationsByStatus('submitted', nonExistentUserId)).rejects.toThrow(
        /getDeclarationsByStatus: requesting user 888888 not found/,
      );
      await expect(db.getReviewQueue({ requestingUserId: nonExistentUserId })).rejects.toThrow(
        /getReviewQueue: requesting user 888888 not found/,
      );
      await expect(db.getCorrectionResponses(testDeclId, nonExistentUserId)).rejects.toThrow(
        /getCorrectionResponses: requesting user 888888 not found/,
      );
      await expect(db.getDeclarationReviewHistory(testDeclId, nonExistentUserId)).rejects.toThrow(
        /getDeclarationReviewHistory: requesting user 888888 not found/,
      );
      await expect(db.getOhCoordinationById(coordId, nonExistentUserId)).rejects.toThrow(
        /getOhCoordinationById: requesting user 888888 not found/,
      );
      await expect(db.getOhFollowUpEvents(coordId, nonExistentUserId)).rejects.toThrow(
        /getOhFollowUpEvents: requesting user 888888 not found/,
      );
      await expect(db.listOhCoordinationsForAdmin(nonExistentUserId)).rejects.toThrow(
        /listOhCoordinationsForAdmin: requesting user 888888 not found/,
      );
      await expect(db.listOhCoordinationsQueue(nonExistentUserId)).rejects.toThrow(
        /listOhCoordinationsQueue: requesting user 888888 not found/,
      );
    });

    test('10. Private Clinical Notes Barrier: getOhFollowUpEvents strictly permits only oh_professional', async () => {
      // Record a follow-up event first
      await db.acknowledgeOhCoordination(coordId, ohProfessionalId);
      await db.createOhFollowUpEvent({
        coordination_id: coordId,
        recorded_by_user_id: ohProfessionalId,
        event_date: '2026-11-13',
        event_category: 'consultation_recorded',
        administrative_note: 'Confidential clinical follow-up notes',
      });

      // oh_professional CAN access events
      const events = await db.getOhFollowUpEvents(coordId, ohProfessionalId);
      expect(events.length).toBe(1);
      expect(events[0].administrative_note).toBe('Confidential clinical follow-up notes');

      // admin_reviewer is STRICTLY PROHIBITED
      await expect(db.getOhFollowUpEvents(coordId, adminReviewerId)).rejects.toThrow(
        /getOhFollowUpEvents: role admin_reviewer is not authorized to read follow-up events/,
      );

      // quality_staff is STRICTLY PROHIBITED
      await expect(db.getOhFollowUpEvents(coordId, qualityStaffId)).rejects.toThrow(
        /getOhFollowUpEvents: role quality_staff is not authorized to read follow-up events/,
      );

      // tech_admin is STRICTLY PROHIBITED
      await expect(db.getOhFollowUpEvents(coordId, techAdminId)).rejects.toThrow(
        /getOhFollowUpEvents: role tech_admin is not authorized to read follow-up events/,
      );

      // exposed_professional is STRICTLY PROHIBITED
      await expect(db.getOhFollowUpEvents(coordId, exposedUser1Id)).rejects.toThrow(
        /getOhFollowUpEvents: role exposed_professional is not authorized to read follow-up events/,
      );
    });

    test('11. exposed_professional getDeclarationsByStatus is strictly scoped to own records', async () => {
      const user1Decls = await db.getDeclarationsByStatus('submitted', exposedUser1Id);
      expect(user1Decls.length).toBe(1);
      expect(user1Decls[0].id).toBe(testDeclId);
      expect(user1Decls.some((d) => d.id === otherDeclId)).toBe(false);

      const user99Decls = await db.getDeclarationsByStatus('submitted', otherUserId);
      expect(user99Decls.length).toBe(1);
      expect(user99Decls[0].id).toBe(otherDeclId);
      expect(user99Decls.some((d) => d.id === testDeclId)).toBe(false);

      // admin_reviewer can see all
      const adminDecls = await db.getDeclarationsByStatus('submitted', adminReviewerId);
      expect(adminDecls.map((d) => d.id)).toContain(testDeclId);
      expect(adminDecls.map((d) => d.id)).toContain(otherDeclId);
    });

    test('12. unauthorized and missing-identity calls never mutate records or emit notifications', async () => {
      const notifsBefore = (await db.query(`SELECT COUNT(*) as cnt FROM in_app_notifications`)).rows[0];
      const declsBefore = (await db.query(`SELECT COUNT(*) as cnt FROM aes_declarations`)).rows[0];
      const auditsBefore = (await db.query(`SELECT COUNT(*) as cnt FROM audit_events`)).rows[0];

      await expect(db.getDeclarationById(testDeclId)).rejects.toThrow();
      await expect(db.getDeclarations()).rejects.toThrow();
      await expect(db.getReviewQueue()).rejects.toThrow();
      await expect(db.getOhFollowUpEvents(coordId, adminReviewerId)).rejects.toThrow();

      const notifsAfter = (await db.query(`SELECT COUNT(*) as cnt FROM in_app_notifications`)).rows[0];
      const declsAfter = (await db.query(`SELECT COUNT(*) as cnt FROM aes_declarations`)).rows[0];
      const auditsAfter = (await db.query(`SELECT COUNT(*) as cnt FROM audit_events`)).rows[0];

      expect(notifsAfter).toEqual(notifsBefore);
      expect(declsAfter).toEqual(declsBefore);
      expect(auditsAfter).toEqual(auditsBefore);

      await assertZeroForeignKeyViolations();
    });
  });

  // ────────────────────────────────────────────────────────────
  // REMEDIATION C: Transaction Failure-Injection & Rollback Atomicity
  // ────────────────────────────────────────────────────────────
  describe('Remediation C: Failure-Injection Rollback Across All Workflows', () => {
    test('createCorrectionResponse: rolls back if notification fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);

      const revRes = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminReviewerId,
        outcome: 'correction_requested',
        correction_reason: 'Préciser les circonstances du contact.',
      });

      // Declaration is now correction_requested
      let decl = await db.getDeclarationById(declId, exposedUser1Id);
      expect(decl?.status).toBe('correction_requested');

      // Inject notification failure
      const spy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated notification delivery crash'));

      await expect(
        db.createCorrectionResponse({
          declaration_id: declId,
          review_id: revRes.reviewId,
          user_id: exposedUser1Id,
          response_text: 'Circonstances complétées en détails.',
        }),
      ).rejects.toThrow('Simulated notification delivery crash');

      spy.mockRestore();

      // State verification: declaration remains correction_requested
      decl = await db.getDeclarationById(declId, exposedUser1Id);
      expect(decl?.status).toBe('correction_requested');

      // Zero correction responses recorded
      const responses = await db.getCorrectionResponses(declId, exposedUser1Id);
      expect(responses.length).toBe(0);

      // No correction_submitted notifications
      const notifs = (
        await db.query(`SELECT * FROM in_app_notifications WHERE event_type = 'correction_submitted'`)
      ).rows;
      expect(notifs.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('createOhCoordination: rolls back if notification fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);

      const spy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated OH coord notif crash'));

      await expect(
        db.createOhCoordination({
          declaration_id: declId,
          created_by_user_id: adminReviewerId,
          coordination_reason: 'serology_monitoring',
        }),
      ).rejects.toThrow('Simulated OH coord notif crash');

      spy.mockRestore();

      // Zero coordination records
      const coords = (await db.query(`SELECT * FROM oh_coordinations`)).rows;
      expect(coords.length).toBe(0);

      // Zero notifications
      const notifs = (
        await db.query(`SELECT * FROM in_app_notifications WHERE event_type = 'oh_coordination_created'`)
      ).rows;
      expect(notifs.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('acknowledgeOhCoordination: rolls back if notification fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      const coordId = await db.createOhCoordination({
        declaration_id: declId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });

      const spy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated acknowledge notif crash'));

      await expect(
        db.acknowledgeOhCoordination(coordId, ohProfessionalId),
      ).rejects.toThrow('Simulated acknowledge notif crash');

      spy.mockRestore();

      // Verify status is still pending_acknowledgement and acknowledged_at is null
      const coord = (await db.getOhCoordinationById(coordId, ohProfessionalId)) as OhCoordination | null;
      expect(coord?.status).toBe('pending_acknowledgement');
      expect(coord?.acknowledged_at).toBeNull();

      // Zero oh_coordination_acknowledged notifications
      const notifs = (
        await db.query(
          `SELECT * FROM in_app_notifications WHERE event_type = 'oh_coordination_acknowledged'`,
        )
      ).rows;
      expect(notifs.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('createOhFollowUpEvent (Milestone): rolls back if notification fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      const coordId = await db.createOhCoordination({
        declaration_id: declId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });
      await db.acknowledgeOhCoordination(coordId, ohProfessionalId);

      const spy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated milestone notif crash'));

      await expect(
        db.createOhFollowUpEvent({
          coordination_id: coordId,
          event_category: 'consultation_recorded',
          event_date: '2026-11-15',
          recorded_by_user_id: ohProfessionalId,
        }),
      ).rejects.toThrow('Simulated milestone notif crash');

      spy.mockRestore();

      // Zero follow-up events in database
      const events = (await db.query(`SELECT * FROM oh_follow_up_events`)).rows;
      expect(events.length).toBe(0);

      // Coordination remains acknowledged
      const coord = await db.getOhCoordinationById(coordId, ohProfessionalId);
      expect(coord?.status).toBe('acknowledged');

      await assertZeroForeignKeyViolations();
    });

    test('createOhFollowUpEvent (Completion): rolls back if notification fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      const coordId = await db.createOhCoordination({
        declaration_id: declId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });
      await db.acknowledgeOhCoordination(coordId, ohProfessionalId);

      const spy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated follow-up completion notif crash'));

      await expect(
        db.createOhFollowUpEvent({
          coordination_id: coordId,
          event_category: 'follow_up_completed',
          event_date: '2026-11-15',
          recorded_by_user_id: ohProfessionalId,
        }),
      ).rejects.toThrow('Simulated follow-up completion notif crash');

      spy.mockRestore();

      // Coordination MUST remain acknowledged (NOT completed)
      const coord = (await db.getOhCoordinationById(coordId, ohProfessionalId)) as OhCoordination | null;
      expect(coord?.status).toBe('acknowledged');
      expect(coord?.completed_at).toBeNull();

      // Zero events recorded
      const events = (await db.query(`SELECT * FROM oh_follow_up_events`)).rows;
      expect(events.length).toBe(0);

      // Zero completion notifications
      const notifs = (
        await db.query(
          `SELECT * FROM in_app_notifications WHERE event_type = 'oh_coordination_completed'`,
        )
      ).rows;
      expect(notifs.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('completeOhCoordination: rolls back if notification fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      const coordId = await db.createOhCoordination({
        declaration_id: declId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });
      await db.acknowledgeOhCoordination(coordId, ohProfessionalId);

      const spy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated direct completion notif crash'));

      await expect(
        db.completeOhCoordination(coordId, ohProfessionalId),
      ).rejects.toThrow('Simulated direct completion notif crash');

      spy.mockRestore();

      // Coordination MUST remain acknowledged
      const coord = (await db.getOhCoordinationById(coordId, ohProfessionalId)) as OhCoordination | null;
      expect(coord?.status).toBe('acknowledged');
      expect(coord?.completed_at).toBeNull();

      // Zero completion notifications
      const notifs = (
        await db.query(
          `SELECT * FROM in_app_notifications WHERE event_type = 'oh_coordination_completed'`,
        )
      ).rows;
      expect(notifs.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('createPreventionAction: rolls back if notification fails', async () => {
      const spy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated CAPA notif crash'));

      await expect(
        db.createPreventionAction(qualityStaffId, {
          title: 'Formation dispositifs sécurisés',
          description: 'Rappel des protocoles',
          action_type: 'preventive',
          contributing_factor: 'training_supervision',
          rationale: 'Prévention des récidives AES',
        }),
      ).rejects.toThrow('Simulated CAPA notif crash');

      spy.mockRestore();

      // Zero prevention actions
      const actions = (await db.query(`SELECT * FROM prevention_actions`)).rows;
      expect(actions.length).toBe(0);

      // Zero audit events for prevention actions
      const audit = (
        await db.query(`SELECT * FROM audit_events WHERE entity_type = 'prevention_action'`)
      ).rows;
      expect(audit.length).toBe(0);

      // Zero notifications
      const notifs = (
        await db.query(`SELECT * FROM in_app_notifications WHERE event_type = 'capa_created'`)
      ).rows;
      expect(notifs.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('createPreventionAction: rolls back if audit insertion fails', async () => {
      // Intercept adapter.transaction to inject a failure on audit_events execution
      const origTransaction = adapter.transaction.bind(adapter);
      jest.spyOn(adapter, 'transaction').mockImplementationOnce(async fn => {
        return origTransaction(async tx => {
          const origExec = tx.execute.bind(tx);
          tx.execute = async (sql: string, params: unknown[] = []) => {
            if (sql.includes('INSERT INTO audit_events')) {
              throw new Error('Simulated audit ledger write failure');
            }
            return origExec(sql, params);
          };
          return fn(tx);
        });
      });

      await expect(
        db.createPreventionAction(qualityStaffId, {
          title: 'Formation dispositifs sécurisés',
          description: 'Rappel des protocoles',
          action_type: 'preventive',
          contributing_factor: 'training_supervision',
          rationale: 'Prévention des récidives AES',
        }),
      ).rejects.toThrow('Simulated audit ledger write failure');

      // Verify zero prevention actions persisted
      const actions = (await db.query(`SELECT * FROM prevention_actions`)).rows;
      expect(actions.length).toBe(0);

      // Verify zero notifications
      const notifs = (await db.query(`SELECT * FROM in_app_notifications`)).rows;
      expect(notifs.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });

    test('stable CAPA reference reconciles a committed action after readback failure without duplicates', async () => {
      const input = {
        title: 'Review protective equipment stock',
        description: 'Review the availability of protective equipment.',
        action_type: 'preventive' as const,
        contributing_factor: 'protective_equipment' as const,
        rationale: 'Maintain availability at each station.',
      };
      const referenceCode = 'CAPA-2026-90001';
      const operationId = '10101010-1010-4010-8010-101010101010';
      const readback = jest
        .spyOn(db, 'getPreventionActionById')
        .mockRejectedValueOnce(new Error('Simulated post-commit readback failure'));

      await expect(db.createPreventionActionForOperation(qualityStaffId, input, operationId, referenceCode, 'new'))
        .rejects.toBeInstanceOf(PreventionActionCreationUncertainError);
      readback.mockRestore();

      const reconciled = await db.reconcilePreventionActionCreation(
        qualityStaffId,
        input,
        referenceCode,
      );
      expect(reconciled?.id).toBeGreaterThan(0);
      expect(reconciled?.reference_code).toBe(referenceCode);
      const retried = await db.createPreventionActionForOperation(qualityStaffId, input, operationId, referenceCode, 'retry');
      expect(retried.id).toBe(reconciled?.id);

      const persisted = await db.query<{ action_count: number; audit_count: number; notification_count: number }>(
        `SELECT
           (SELECT COUNT(*) FROM prevention_actions WHERE reference_code = ?) AS action_count,
           (SELECT COUNT(*) FROM audit_events WHERE entity_id = ? AND event_type = 'prevention_action_created') AS audit_count,
           (SELECT COUNT(*) FROM in_app_notifications WHERE entity_id = ? AND event_type = 'capa_created') AS notification_count`,
        [referenceCode, reconciled?.id, reconciled?.id],
      );
      expect(persisted.rows[0]).toEqual({ action_count: 1, audit_count: 1, notification_count: 1 });
    });

    test.each([
      [
        'creation audit',
        `DELETE FROM audit_events WHERE entity_id = ? AND event_type = 'prevention_action_created'`,
      ],
      [
        'creation notification',
        `DELETE FROM in_app_notifications WHERE entity_id = ? AND event_type = 'capa_created'`,
      ],
    ])('refuses reconciliation without the required %s evidence', async (_label, deleteSql) => {
      const input = {
        title: 'Update the equipment review process',
        description: 'Review equipment stocks monthly.',
        action_type: 'preventive' as const,
        contributing_factor: 'protective_equipment' as const,
        rationale: 'Ensure equipment remains available.',
      };
      const referenceCode = 'CAPA-2026-90002';
      const action = await db.createPreventionAction(qualityStaffId, input, referenceCode);
      await db.run(deleteSql, [action.id]);

      await expect(
        db.reconcilePreventionActionCreation(qualityStaffId, input, referenceCode),
      ).rejects.toBeInstanceOf(PreventionActionCreationUncertainError);
    });

    test('updatePreventionActionStatus: rolls back if notification fails', async () => {
      const capa = await db.createPreventionAction(qualityStaffId, {
        title: 'Contrôle matériel',
        description: 'Vérification des collecteurs',
        action_type: 'corrective',
        contributing_factor: 'waste_disposal_container',
        rationale: 'Prévention des récidives AES',
      });

      const spy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated CAPA status notif crash'));

      await expect(
        db.updatePreventionActionStatus(qualityStaffId, capa.id, 'in_progress'),
      ).rejects.toThrow('Simulated CAPA status notif crash');

      spy.mockRestore();

      // Verify status is still 'proposed'
      const action = await db.getPreventionActionById(qualityStaffId, capa.id);
      expect(action?.status).toBe('proposed');

      // Verify no audit event for status change
      const audit = (
        await db.query(
          `SELECT * FROM audit_events WHERE entity_id = ? AND event_type = 'prevention_action_status_changed'`,
          [capa.id],
        )
      ).rows;
      expect(audit.length).toBe(0);

      await assertZeroForeignKeyViolations();
    });
  });

  // ────────────────────────────────────────────────────────────
  // REMEDIATION D: Completion Path Consistency
  // ────────────────────────────────────────────────────────────
  describe('Remediation D: Completion Path Consistency & Idempotency', () => {
    test('both completeOhCoordination and follow_up_completed produce identical completed state and idempotency keys', async () => {
      // 1. Direct completion setup
      const decl1Id = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(decl1Id);
      const coord1Id = await db.createOhCoordination({
        declaration_id: decl1Id,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });
      await db.acknowledgeOhCoordination(coord1Id, ohProfessionalId);

      // 2. Event completion setup
      const decl2Id = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-11',
        incident_type: 'mucocutaneous_exposure',
      });
      await db.submitDeclaration(decl2Id);
      const coord2Id = await db.createOhCoordination({
        declaration_id: decl2Id,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'routine_followup',
      });
      await db.acknowledgeOhCoordination(coord2Id, ohProfessionalId);

      // Execute Path 1: direct completion
      await db.completeOhCoordination(coord1Id, ohProfessionalId);
      const coord1 = (await db.getOhCoordinationById(coord1Id, ohProfessionalId)) as OhCoordination | null;
      expect(coord1?.status).toBe('completed');
      expect(coord1?.completed_by_user_id).toBe(ohProfessionalId);
      expect(coord1?.completed_at).toBeTruthy();

      // Execute Path 2: event completion
      await db.createOhFollowUpEvent({
        coordination_id: coord2Id,
        event_category: 'follow_up_completed',
        event_date: '2026-11-16',
        recorded_by_user_id: ohProfessionalId,
      });
      const coord2 = (await db.getOhCoordinationById(coord2Id, ohProfessionalId)) as OhCoordination | null;
      expect(coord2?.status).toBe('completed');
      expect(coord2?.completed_by_user_id).toBe(ohProfessionalId);
      expect(coord2?.completed_at).toBeTruthy();

      // Check emitted notifications
      const notifs1 = (
        await db.query<InAppNotification>(
          `SELECT * FROM in_app_notifications WHERE entity_id = ? AND event_type = 'oh_coordination_completed'`,
          [coord1Id],
        )
      ).rows;
      expect(notifs1.length).toBe(1);
      expect(notifs1[0].idempotency_key).toBe(
        `notif:oh_coordination_completed:oh_coordination:${coord1Id}:${exposedUser1Id}`,
      );

      const notifs2 = (
        await db.query<InAppNotification>(
          `SELECT * FROM in_app_notifications WHERE entity_id = ? AND event_type = 'oh_coordination_completed'`,
          [coord2Id],
        )
      ).rows;
      expect(notifs2.length).toBe(1);
      expect(notifs2[0].idempotency_key).toBe(
        `notif:oh_coordination_completed:oh_coordination:${coord2Id}:${exposedUser1Id}`,
      );

      // Verify that createOhFollowUpEvent with follow_up_completed did NOT emit oh_milestone_recorded
      const milestoneNotifs = (
        await db.query<InAppNotification>(
          `SELECT * FROM in_app_notifications WHERE entity_id = ? AND event_type = 'oh_milestone_recorded'`,
          [coord2Id],
        )
      ).rows;
      expect(milestoneNotifs.length).toBe(0);
    });

    test('rejects subsequent completion attempts on already-completed coordinations', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      const coordId = await db.createOhCoordination({
        declaration_id: declId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });
      await db.acknowledgeOhCoordination(coordId, ohProfessionalId);
      await db.completeOhCoordination(coordId, ohProfessionalId);

      // Direct complete again -> throws
      await expect(
        db.completeOhCoordination(coordId, ohProfessionalId),
      ).rejects.toThrow(/invalid transition from completed/);

      // Follow-up event again -> throws
      await expect(
        db.createOhFollowUpEvent({
          coordination_id: coordId,
          event_category: 'consultation_recorded',
          event_date: '2026-11-17',
          recorded_by_user_id: ohProfessionalId,
        }),
      ).rejects.toThrow(/cannot record events on a completed coordination/);
    });
  });

  // ────────────────────────────────────────────────────────────
  // REMEDIATION E: Notification Payload Privacy & Reference Audit
  // ────────────────────────────────────────────────────────────
  describe('Remediation E: Notification Payload Privacy Audit', () => {
    test('all notifications in database conform strictly to neutral translation keys and privacy boundaries', async () => {
      // Trigger representative events
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);

      const revRes = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminReviewerId,
        outcome: 'correction_requested',
        correction_reason: 'Préciser les circonstances du contact.',
      });

      await db.createCorrectionResponse({
        declaration_id: declId,
        review_id: revRes.reviewId,
        user_id: exposedUser1Id,
        response_text: 'Circonstances complétées.',
      });

      const coordId = await db.createOhCoordination({
        declaration_id: declId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });

      await db.acknowledgeOhCoordination(coordId, ohProfessionalId);

      await db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'consultation_recorded',
        event_date: '2026-11-12',
        recorded_by_user_id: ohProfessionalId,
        administrative_note: 'Dossier confidentiel',
      });

      await db.createPreventionAction(qualityStaffId, {
        title: 'Mesure de sécurité',
        description: 'Vérification',
        action_type: 'preventive',
        contributing_factor: 'training_supervision',
        rationale: 'Prévention des récidives AES',
      });

      const allNotifs = (
        await db.query<InAppNotification>(`SELECT * FROM in_app_notifications`)
      ).rows;
      expect(allNotifs.length).toBeGreaterThanOrEqual(6);

      for (const n of allNotifs) {
        // 1. Title and Message keys must strictly be translation keys
        expect(n.title_key).toMatch(/^notification\.[a-zA-Z]+\.title$/);
        expect(n.message_key).toMatch(/^notification\.[a-zA-Z]+\.message$/);

        // 2. Entity reference must not contain free-text notes or sensitive text
        if (n.entity_reference) {
          expect(n.entity_reference).not.toContain('Dossier confidentiel');
          expect(n.entity_reference).not.toContain('Circonstances complétées');
          expect(n.entity_reference).toMatch(/^(AES|CAPA)-\d{4}-\d+/);
        }

        // 3. No notification addressed to tech_admin
        expect(n.recipient_user_id).not.toBe(techAdminId);
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // REMEDIATION F: OH Coordination Data Minimization Verification (Phase 2D.2C.3.1)
  // ────────────────────────────────────────────────────────────
  describe('Remediation F: OH Coordination Data Minimization Verification', () => {
    let declId: number;
    let coordId: number;
    let otherUserId: number;

    beforeEach(async () => {
      await adapter.execute(
        `INSERT INTO demo_users (id, username, display_name, role)
         VALUES (99, 'other_ep', 'Other EP', 'exposed_professional')`,
      );
      otherUserId = 99;

      declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);

      coordId = await db.createOhCoordination({
        declaration_id: declId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'routine_followup',
      });
      await db.acknowledgeOhCoordination(coordId, ohProfessionalId);
      await db.completeOhCoordination(coordId, ohProfessionalId);
    });

    test('oh_professional retrieves full coordination details including internal staff IDs', async () => {
      const coord = (await db.getOhCoordinationById(coordId, ohProfessionalId)) as OhCoordination | null;
      expect(coord).not.toBeNull();
      expect(coord!.status).toBe('completed');
      expect(coord!.acknowledged_by_user_id).toBe(ohProfessionalId);
      expect(coord!.completed_by_user_id).toBe(ohProfessionalId);
      expect(coord!.acknowledged_at).not.toBeNull();
      expect(coord!.completed_at).not.toBeNull();
    });

    test('admin_reviewer receives data-minimized AdminOhCoordinationSummary projection (milestones visible, internal OH staff IDs structurally absent)', async () => {
      const coord = (await db.getOhCoordinationById(coordId, adminReviewerId)) as AdminOhCoordinationSummary | null;
      expect(coord).not.toBeNull();
      expect(coord!.status).toBe('completed');
      expect(coord!.coordination_reason).toBe('routine_followup');
      // Milestone timestamps preserved for administrative tracking
      expect(coord!.acknowledged_at).not.toBeNull();
      expect(coord!.completed_at).not.toBeNull();
      // Internal OH staff identifiers must be structurally absent (not merely null)
      expect(coord).not.toHaveProperty('acknowledged_by_user_id');
      expect(coord).not.toHaveProperty('completed_by_user_id');
      // OH-only fields must be absent
      expect(coord).not.toHaveProperty('events');
      expect(coord).not.toHaveProperty('notes');
      expect(coord).not.toHaveProperty('declarant_name');
      // Exact key set matches AdminOhCoordinationSummary (declaration_reference present from JOIN)
      const keys = Object.keys(coord!).sort();
      expect(keys).toEqual(
        ['acknowledged_at', 'completed_at', 'coordination_reason', 'created_at', 'created_by_user_id',
          'declaration_id', 'declaration_reference', 'id', 'status', 'updated_at'].sort(),
      );
    });

    test('AdminOhCoordinationSummary respects declaration_reference optionality contract when unavailable or empty', async () => {
      const unlinkedDeclId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-02-01',
        incident_type: 'mucocutaneous_exposure',
      });
      const optionalCoordId = await db.createOhCoordination({
        declaration_id: unlinkedDeclId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'routine_followup',
      });

      // Clear reference number to simulate absent declaration reference
      await adapter.execute("UPDATE aes_declarations SET reference_number = '' WHERE id = ?", [unlinkedDeclId]);

      const coord = (await db.getOhCoordinationById(optionalCoordId, adminReviewerId)) as AdminOhCoordinationSummary | null;
      expect(coord).not.toBeNull();
      expect(coord!.id).toBe(optionalCoordId);
      expect(coord!.status).toBe('pending_acknowledgement');
      expect(coord!.coordination_reason).toBe('routine_followup');

      // declaration_reference must be absent when unavailable (optional contract)
      expect(coord).not.toHaveProperty('declaration_reference');

      // Internal OH staff IDs must still be structurally absent
      expect(coord).not.toHaveProperty('acknowledged_by_user_id');
      expect(coord).not.toHaveProperty('completed_by_user_id');
      expect(coord).not.toHaveProperty('events');
      expect(coord).not.toHaveProperty('notes');

      // Exact 9-key set when optional declaration_reference is omitted
      const keys = Object.keys(coord!).sort();
      expect(keys).toEqual(
        ['acknowledged_at', 'completed_at', 'coordination_reason', 'created_at', 'created_by_user_id',
          'declaration_id', 'id', 'status', 'updated_at'].sort(),
      );
    });

    test('admin_reviewer listOhCoordinationsForAdmin shields internal OH staff IDs and strictly enforces admin_reviewer role', async () => {
      const list = await db.listOhCoordinationsForAdmin(adminReviewerId);
      expect(list.length).toBeGreaterThan(0);
      const coord = list.find((c) => c.id === coordId);
      expect(coord).toBeDefined();
      // Internal OH staff identifiers must be structurally absent (not merely null)
      expect(coord).not.toHaveProperty('acknowledged_by_user_id');
      expect(coord).not.toHaveProperty('completed_by_user_id');
      expect(coord!.declaration_reference).toMatch(/^AES-\d{4}-\d+/);
      expect(coord).not.toHaveProperty('events');
      expect(coord).not.toHaveProperty('notes');

      // Fail-closed role checks: non-admin roles MUST be rejected
      await expect(db.listOhCoordinationsForAdmin(exposedUser1Id)).rejects.toThrow(
        /listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got exposed_professional/,
      );
      await expect(db.listOhCoordinationsForAdmin(ohProfessionalId)).rejects.toThrow(
        /listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got oh_professional/,
      );
      await expect(db.listOhCoordinationsForAdmin(qualityStaffId)).rejects.toThrow(
        /listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got quality_staff/,
      );
      await expect(db.listOhCoordinationsForAdmin(techAdminId)).rejects.toThrow(
        /listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got tech_admin/,
      );

      // Fail-closed identity checks: undefined, null, non-existent
      await expect(db.listOhCoordinationsForAdmin(undefined as any)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to list coordinations/,
      );
      await expect(db.listOhCoordinationsForAdmin(null as any)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to list coordinations/,
      );
      await expect(db.listOhCoordinationsForAdmin(99999)).rejects.toThrow(
        /listOhCoordinationsForAdmin: requesting user 99999 not found/,
      );
    });

    test('listOhCoordinationsQueue strictly enforces oh_professional role and fail-closed identity', async () => {
      const queue = await db.listOhCoordinationsQueue(ohProfessionalId);
      expect(Array.isArray(queue)).toBe(true);

      // Fail-closed role checks
      await expect(db.listOhCoordinationsQueue(adminReviewerId)).rejects.toThrow(
        /listOhCoordinationsQueue: unauthorized — requires oh_professional, got admin_reviewer/,
      );
      await expect(db.listOhCoordinationsQueue(exposedUser1Id)).rejects.toThrow(
        /listOhCoordinationsQueue: unauthorized — requires oh_professional, got exposed_professional/,
      );
      await expect(db.listOhCoordinationsQueue(qualityStaffId)).rejects.toThrow(
        /listOhCoordinationsQueue: unauthorized — requires oh_professional, got quality_staff/,
      );
      await expect(db.listOhCoordinationsQueue(techAdminId)).rejects.toThrow(
        /listOhCoordinationsQueue: unauthorized — requires oh_professional, got tech_admin/,
      );

      // Fail-closed identity checks
      await expect(db.listOhCoordinationsQueue(undefined as any)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to list OH queue/,
      );
      await expect(db.listOhCoordinationsQueue(null as any)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to list OH queue/,
      );
      await expect(db.listOhCoordinationsQueue(99999)).rejects.toThrow(
        /listOhCoordinationsQueue: requesting user 99999 not found/,
      );
    });

    test('exposed_professional retrieves genuinely minimal status-only projection with unauthorized fields omitted', async () => {
      const coord = await db.getOhCoordinationById(coordId, exposedUser1Id);
      expect(coord).not.toBeNull();

      // Only status-only keys exist on the object
      const keys = Object.keys(coord!).sort();
      expect(keys).toEqual(['created_at', 'declaration_id', 'id', 'status', 'updated_at'].sort());

      expect(coord!.status).toBe('completed');
      expect(coord!.id).toBe(coordId);
      expect(coord!.declaration_id).toBe(declId);

      // Sensitive fields must NOT exist as properties on the object
      expect(coord).not.toHaveProperty('coordination_reason');
      expect(coord).not.toHaveProperty('created_by_user_id');
      expect(coord).not.toHaveProperty('acknowledged_at');
      expect(coord).not.toHaveProperty('completed_at');
      expect(coord).not.toHaveProperty('acknowledged_by_user_id');
      expect(coord).not.toHaveProperty('completed_by_user_id');
      expect(coord).not.toHaveProperty('events');
      expect(coord).not.toHaveProperty('notes');

      // Ownership check: another exposed professional CANNOT view this coordination
      await expect(db.getOhCoordinationById(coordId, otherUserId)).rejects.toThrow(
        /getOhCoordinationById: exposed_professional may only view coordination for their own declaration/,
      );
    });

    test('getOhCoordinationByDeclaration applies identical data minimization to admin_reviewer and exposed_professional', async () => {
      // Create new active coordination
      const decl2Id = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-11',
        incident_type: 'mucocutaneous_exposure',
      });
      await db.submitDeclaration(decl2Id);

      const activeCoordId = await db.createOhCoordination({
        declaration_id: decl2Id,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });
      await db.acknowledgeOhCoordination(activeCoordId, ohProfessionalId);

      // admin_reviewer receives admin oversight projection (AdminOhCoordinationSummary)
      const adminCoord = (await db.getOhCoordinationByDeclaration(decl2Id, adminReviewerId)) as AdminOhCoordinationSummary | null;
      expect(adminCoord).not.toBeNull();
      expect(adminCoord!.status).toBe('acknowledged');
      expect(adminCoord!.acknowledged_at).not.toBeNull();
      // Internal OH staff identifiers must be structurally absent (not merely null)
      expect(adminCoord).not.toHaveProperty('acknowledged_by_user_id');
      expect(adminCoord).not.toHaveProperty('completed_by_user_id');

      // oh_professional receives full details
      const ohCoord = (await db.getOhCoordinationByDeclaration(decl2Id, ohProfessionalId)) as OhCoordination | null;
      expect(ohCoord).not.toBeNull();
      expect(ohCoord!.acknowledged_by_user_id).toBe(ohProfessionalId);

      // exposed_professional receives genuinely minimal status-only projection
      const exposedCoord = await db.getOhCoordinationByDeclaration(decl2Id, exposedUser1Id);
      expect(exposedCoord).not.toBeNull();
      const exposedKeys = Object.keys(exposedCoord!).sort();
      expect(exposedKeys).toEqual(['created_at', 'declaration_id', 'id', 'status', 'updated_at'].sort());
      expect(exposedCoord).not.toHaveProperty('coordination_reason');
      expect(exposedCoord).not.toHaveProperty('created_by_user_id');
      expect(exposedCoord).not.toHaveProperty('acknowledged_at');
      expect(exposedCoord).not.toHaveProperty('completed_at');
      expect(exposedCoord).not.toHaveProperty('acknowledged_by_user_id');
      expect(exposedCoord).not.toHaveProperty('completed_by_user_id');

      // Ownership check: another exposed professional CANNOT view via declaration
      await expect(db.getOhCoordinationByDeclaration(decl2Id, otherUserId)).rejects.toThrow(
        /getOhCoordinationByDeclaration: exposed_professional may only view their own declaration/,
      );
    });

    test('quality_staff and tech_admin are completely denied from OH coordination retrieval', async () => {
      await expect(db.getOhCoordinationById(coordId, qualityStaffId)).rejects.toThrow(
        /quality_staff.*not authorized/,
      );
      await expect(db.getOhCoordinationById(coordId, techAdminId)).rejects.toThrow(
        /tech_admin.*not authorized/,
      );
      await expect(db.getOhCoordinationByDeclaration(declId, qualityStaffId)).rejects.toThrow(
        /quality_staff.*not authorized/,
      );
      await expect(db.getOhCoordinationByDeclaration(declId, techAdminId)).rejects.toThrow(
        /tech_admin.*not authorized/,
      );
    });
  });
});
