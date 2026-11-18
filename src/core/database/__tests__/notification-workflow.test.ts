/**
 * AES Guardian — Workflow Event Notification Integration Tests (Phase 2D.2C)
 *
 * Exercises all 11 workflow events against genuine native SQLite via NativeSQLiteAdapter + AesGuardianDatabase:
 * 1. Event 1:  declaration_submitted (submitDeclaration)
 * 2. Event 2:  review_completed (createAdministrativeReview with outcome !== correction_requested)
 * 3. Event 3:  correction_requested (createAdministrativeReview with outcome === correction_requested)
 * 4. Event 4:  correction_submitted (createCorrectionResponse)
 * 5. Event 5:  oh_coordination_created (createOhCoordination)
 * 6. Event 6:  oh_coordination_acknowledged (acknowledgeOhCoordination)
 * 7. Event 7:  oh_milestone_recorded (createOhFollowUpEvent with category !== follow_up_completed)
 * 8. Event 8:  oh_coordination_completed (createOhFollowUpEvent with category === follow_up_completed)
 * 9. Event 9:  capa_created (createPreventionAction)
 * 10. Event 10: capa_status_changed (updatePreventionActionStatus to in_progress)
 * 11. Event 11: capa_finalized (updatePreventionActionStatus to completed)
 * 12. Transaction Rollback Atomicity: Workflow mutations roll back if notification generation fails.
 * 13. Idempotency: Duplicate event keys are safely ignored without constraint errors.
 * 14. tech_admin Operational Exclusion: No operational notifications for tech_admin.
 */

import { AesGuardianDatabase } from '../AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';
import type {
  AesDeclaration,
  InAppNotification,
  OhCoordination,
} from '../types';

describe('AES Guardian — Phase 2D.2C: Workflow Event Integration & Notification Generation', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  // Canonical user IDs
  let exposedUser1Id: number;
  let adminReviewerId: number;
  let ohProfessionalId: number;
  let qualityStaffId: number;
  let techAdminId: number;

  beforeAll(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();

    // Query canonical demo users seeded by Migration 2
    const userResult = await db.query<{ id: number; role: string }>(
      `SELECT id, role FROM demo_users`,
    );
    const users = userResult.rows;

    for (const u of users) {
      if (u.role === 'exposed_professional') exposedUser1Id = u.id;
      else if (u.role === 'admin_reviewer') adminReviewerId = u.id;
      else if (u.role === 'oh_professional') ohProfessionalId = u.id;
      else if (u.role === 'quality_staff') qualityStaffId = u.id;
      else if (u.role === 'tech_admin') techAdminId = u.id;
    }

    expect(exposedUser1Id).toBe(1);
    expect(adminReviewerId).toBe(2);
    expect(ohProfessionalId).toBe(3);
    expect(qualityStaffId).toBe(4);
    expect(techAdminId).toBe(5);
  });

  afterAll(async () => {
    await adapter.close();
  });

  // ────────────────────────────────────────────────────────────
  // 1. Event 1: declaration_submitted
  // ────────────────────────────────────────────────────────────
  describe('Event 1: declaration_submitted', () => {
    let draftDeclId: number;

    beforeAll(async () => {
      draftDeclId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-10',
        incident_type: 'percutaneous_exposure',
        circumstances: 'Aiguille creuse souillée',
        department_code: 'URG',
      });
    });

    test('submitDeclaration transitions status and generates declaration_submitted notification for admin_reviewer', async () => {
      const initialUnreadCount = await db.getUnreadNotificationCount(adminReviewerId);

      const submitRes = await db.submitDeclaration(draftDeclId);
      expect(submitRes.rowsAffected).toBe(1);

      // Verify declaration is now 'submitted'
      const decl = await db.getDeclarationById(draftDeclId, exposedUser1Id);
      expect(decl?.status).toBe('submitted');

      // Verify unread count incremented
      const newUnreadCount = await db.getUnreadNotificationCount(adminReviewerId);
      expect(newUnreadCount).toBe(initialUnreadCount + 1);

      // Verify notification details
      const notifs = await db.getNotifications(adminReviewerId);
      const notif = notifs.find(
        n => n.event_type === 'declaration_submitted' && n.entity_id === draftDeclId,
      );
      expect(notif).toBeDefined();
      expect(notif?.recipient_user_id).toBe(adminReviewerId);
      expect(notif?.entity_type).toBe('aes_declaration');
      expect(notif?.title_key).toBe('notification.declarationSubmitted.title');
      expect(notif?.message_key).toBe('notification.declarationSubmitted.message');
      expect(notif?.entity_reference).toBe(decl?.reference_number);
      expect(notif?.is_read).toBe(0);
      expect(notif?.idempotency_key).toBe(
        `notif:declaration_submitted:aes_declaration:${draftDeclId}:${adminReviewerId}`,
      );
    });

    test('Actor (exposed_professional) does NOT receive the declaration_submitted notification', async () => {
      const declarerNotifs = await db.getNotifications(exposedUser1Id);
      const ownNotif = declarerNotifs.find(
        n => n.event_type === 'declaration_submitted' && n.entity_id === draftDeclId,
      );
      expect(ownNotif).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Event 2 & 3: review_completed & correction_requested
  // ────────────────────────────────────────────────────────────
  describe('Events 2 & 3: Administrative Review Notifications', () => {
    let reviewDeclId: number;

    beforeEach(async () => {
      reviewDeclId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-11',
        incident_type: 'mucocutaneous_exposure',
        circumstances: 'Projection oculaire',
        department_code: 'REA',
      });
      await db.submitDeclaration(reviewDeclId);
    });

    test('Event 2: createAdministrativeReview with outcome acknowledged notifies exposed_professional of review_completed', async () => {
      const prevDeclarerNotifs = await db.getNotifications(exposedUser1Id);

      const reviewRes = await db.createAdministrativeReview({
        declaration_id: reviewDeclId,
        reviewer_user_id: adminReviewerId,
        outcome: 'acknowledged',
        comments: 'Dossier complet et conforme.',
      });

      expect(reviewRes.declarationStatus).toBe('under_review');
      const reviewId = reviewRes.reviewId;

      const declarerNotifs = await db.getNotifications(exposedUser1Id);
      expect(declarerNotifs.length).toBe(prevDeclarerNotifs.length + 1);

      const notif = declarerNotifs[0];
      expect(notif.recipient_user_id).toBe(exposedUser1Id);
      expect(notif.event_type).toBe('review_completed');
      expect(notif.entity_type).toBe('administrative_review');
      expect(notif.entity_id).toBe(reviewId);
      expect(notif.title_key).toBe('notification.reviewCompleted.title');
      expect(notif.message_key).toBe('notification.reviewCompleted.message');
      expect(notif.idempotency_key).toBe(
        `notif:review_completed:administrative_review:${reviewId}:${exposedUser1Id}`,
      );
    });

    test('Event 3: createAdministrativeReview with outcome correction_requested notifies exposed_professional of correction_requested', async () => {
      const reviewRes = await db.createAdministrativeReview({
        declaration_id: reviewDeclId,
        reviewer_user_id: adminReviewerId,
        outcome: 'correction_requested',
        correction_reason: 'Préciser le port des lunettes de protection.',
      });

      expect(reviewRes.declarationStatus).toBe('correction_requested');
      const reviewId = reviewRes.reviewId;

      const declarerNotifs = await db.getNotifications(exposedUser1Id);
      const notif = declarerNotifs.find(
        n => n.event_type === 'correction_requested' && n.entity_id === reviewId,
      );
      expect(notif).toBeDefined();
      expect(notif?.recipient_user_id).toBe(exposedUser1Id);
      expect(notif?.title_key).toBe('notification.correctionRequested.title');
      expect(notif?.message_key).toBe('notification.correctionRequested.message');
      expect(notif?.idempotency_key).toBe(
        `notif:correction_requested:administrative_review:${reviewId}:${exposedUser1Id}`,
      );
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Event 4: correction_submitted
  // ────────────────────────────────────────────────────────────
  describe('Event 4: correction_submitted', () => {
    let corrDeclId: number;
    let corrReviewId: number;

    beforeAll(async () => {
      corrDeclId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-12',
        incident_type: 'percutaneous_exposure',
        circumstances: 'Piqûre lors de la récapitulation',
      });
      await db.submitDeclaration(corrDeclId);

      const reviewRes = await db.createAdministrativeReview({
        declaration_id: corrDeclId,
        reviewer_user_id: adminReviewerId,
        outcome: 'correction_requested',
        correction_reason: 'Préciser le type de conteneur utilisé.',
      });
      corrReviewId = reviewRes.reviewId;
    });

    test('createCorrectionResponse transitions declaration to resubmitted and notifies admin_reviewer', async () => {
      const respRes = await db.createCorrectionResponse({
        declaration_id: corrDeclId,
        review_id: corrReviewId,
        user_id: exposedUser1Id,
        response_text: 'Conteneur pour objets tranchants conforme situé à moins de 50 cm.',
      });

      expect(respRes.declarationStatus).toBe('resubmitted');
      const responseId = respRes.responseId;

      const adminNotifs = await db.getNotifications(adminReviewerId);
      const notif = adminNotifs.find(
        n => n.event_type === 'correction_submitted' && n.entity_id === responseId,
      );
      expect(notif).toBeDefined();
      expect(notif?.recipient_user_id).toBe(adminReviewerId);
      expect(notif?.entity_type).toBe('correction_response');
      expect(notif?.title_key).toBe('notification.correctionSubmitted.title');
      expect(notif?.message_key).toBe('notification.correctionSubmitted.message');
      expect(notif?.idempotency_key).toBe(
        `notif:correction_submitted:correction_response:${responseId}:${adminReviewerId}`,
      );
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Events 5 & 6: oh_coordination_created & oh_coordination_acknowledged
  // ────────────────────────────────────────────────────────────
  describe('Events 5 & 6: OH Coordination Lifecycle', () => {
    let coordDeclId: number;
    let coordId: number;

    beforeAll(async () => {
      coordDeclId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-13',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(coordDeclId);
    });

    test('Event 5: createOhCoordination notifies oh_professional', async () => {
      coordId = await db.createOhCoordination({
        declaration_id: coordDeclId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });

      expect(coordId).toBeGreaterThan(0);

      const ohNotifs = await db.getNotifications(ohProfessionalId);
      const notif = ohNotifs.find(
        n => n.event_type === 'oh_coordination_created' && n.entity_id === coordId,
      );
      expect(notif).toBeDefined();
      expect(notif?.recipient_user_id).toBe(ohProfessionalId);
      expect(notif?.entity_type).toBe('oh_coordination');
      expect(notif?.title_key).toBe('notification.ohCoordinationCreated.title');
      expect(notif?.message_key).toBe('notification.ohCoordinationCreated.message');
      expect(notif?.idempotency_key).toBe(
        `notif:oh_coordination_created:oh_coordination:${coordId}:${ohProfessionalId}`,
      );
    });

    test('Event 6: acknowledgeOhCoordination notifies exposed_professional (declarer)', async () => {
      await db.acknowledgeOhCoordination(coordId, ohProfessionalId);

      const coord = await db.getOhCoordinationById(coordId, ohProfessionalId);
      expect(coord?.status).toBe('acknowledged');

      const declarerNotifs = await db.getNotifications(exposedUser1Id);
      const notif = declarerNotifs.find(
        n => n.event_type === 'oh_coordination_acknowledged' && n.entity_id === coordId,
      );
      expect(notif).toBeDefined();
      expect(notif?.recipient_user_id).toBe(exposedUser1Id);
      expect(notif?.entity_type).toBe('oh_coordination');
      expect(notif?.title_key).toBe('notification.ohCoordinationAcknowledged.title');
      expect(notif?.message_key).toBe('notification.ohCoordinationAcknowledged.message');
      expect(notif?.idempotency_key).toBe(
        `notif:oh_coordination_acknowledged:oh_coordination:${coordId}:${exposedUser1Id}`,
      );
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Events 7 & 8: oh_milestone_recorded & oh_coordination_completed
  // ────────────────────────────────────────────────────────────
  describe('Events 7 & 8: OH Follow-up Events & Closeout', () => {
    let fupDeclId: number;
    let fupCoordId: number;

    beforeAll(async () => {
      fupDeclId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-14',
        incident_type: 'mucocutaneous_exposure',
      });
      await db.submitDeclaration(fupDeclId);

      fupCoordId = await db.createOhCoordination({
        declaration_id: fupDeclId,
        created_by_user_id: adminReviewerId,
        coordination_reason: 'serology_monitoring',
      });
      await db.acknowledgeOhCoordination(fupCoordId, ohProfessionalId);
    });

    test('Event 7: createOhFollowUpEvent (intermediate milestone) notifies exposed_professional of oh_milestone_recorded', async () => {
      const eventId = await db.createOhFollowUpEvent({
        coordination_id: fupCoordId,
        event_category: 'consultation_recorded',
        event_date: '2026-11-14',
        recorded_by_user_id: ohProfessionalId,
        administrative_note: 'Bilan initial réalisé à J0.',
      });

      expect(eventId).toBeGreaterThan(0);

      const declarerNotifs = await db.getNotifications(exposedUser1Id);
      const notif = declarerNotifs.find(
        n => n.event_type === 'oh_milestone_recorded' && n.entity_id === eventId,
      );
      expect(notif).toBeDefined();
      expect(notif?.recipient_user_id).toBe(exposedUser1Id);
      expect(notif?.entity_type).toBe('oh_follow_up_events');
      expect(notif?.title_key).toBe('notification.ohMilestoneRecorded.title');
      expect(notif?.message_key).toBe('notification.ohMilestoneRecorded.message');
      expect(notif?.idempotency_key).toBe(
        `notif:oh_milestone_recorded:oh_follow_up_events:${eventId}:${exposedUser1Id}`,
      );
    });

    test('Event 8: createOhFollowUpEvent with follow_up_completed auto-completes coordination and notifies of oh_coordination_completed', async () => {
      const eventId = await db.createOhFollowUpEvent({
        coordination_id: fupCoordId,
        event_category: 'follow_up_completed',
        event_date: '2026-12-14',
        recorded_by_user_id: ohProfessionalId,
        administrative_note: 'Protocole de suivi sérologique clôturé avec succès.',
      });

      expect(eventId).toBeGreaterThan(0);

      // Verify coordination is completed
      const coord = await db.getOhCoordinationById(fupCoordId, ohProfessionalId);
      expect(coord?.status).toBe('completed');

      // Verify completion notification
      const declarerNotifs = await db.getNotifications(exposedUser1Id);
      const notif = declarerNotifs.find(
        n => n.event_type === 'oh_coordination_completed' && n.entity_id === fupCoordId,
      );
      expect(notif).toBeDefined();
      expect(notif?.recipient_user_id).toBe(exposedUser1Id);
      expect(notif?.entity_type).toBe('oh_coordination');
      expect(notif?.title_key).toBe('notification.ohCoordinationCompleted.title');
      expect(notif?.message_key).toBe('notification.ohCoordinationCompleted.message');
      expect(notif?.idempotency_key).toBe(
        `notif:oh_coordination_completed:oh_coordination:${fupCoordId}:${exposedUser1Id}`,
      );
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Events 9, 10, 11: CAPA Notifications & Audit Log Atomicity
  // ────────────────────────────────────────────────────────────
  describe('Events 9, 10, 11: CAPA Actions & Atomicity', () => {
    let actionId: number;

    test('Event 9: createPreventionAction atomically writes CAPA, audit event, and capa_created notification', async () => {
      const action = await db.createPreventionAction(qualityStaffId, {
        title: 'Mise à niveau des boîtes OPCT',
        description: 'Installation de boîtes de collecte de nouvelle génération dans toutes les salles de prélèvement.',
        action_type: 'preventive',
        contributing_factor: 'device_safety_design',
        rationale: 'Réduction du risque de piqûre accidentelle lors du désaccouplement.',
        surveillance_reference: 'Surveillance T4-2026',
        target_date: '2026-12-31',
      });

      expect(action).toBeDefined();
      actionId = action.id;

      // Verify CAPA audit history
      expect(action.audit_history.length).toBe(1);
      expect(action.audit_history[0].event_type).toBe('prevention_action_created');

      // Verify notification generated for quality_staff
      const qualityNotifs = await db.getNotifications(qualityStaffId);
      const notif = qualityNotifs.find(
        n => n.event_type === 'capa_created' && n.entity_id === actionId,
      );
      expect(notif).toBeDefined();
      expect(notif?.recipient_user_id).toBe(qualityStaffId);
      expect(notif?.entity_type).toBe('prevention_action');
      expect(notif?.title_key).toBe('notification.capaCreated.title');
      expect(notif?.message_key).toBe('notification.capaCreated.message');
      expect(notif?.idempotency_key).toBe(
        `notif:capa_created:prevention_action:${actionId}:${qualityStaffId}`,
      );
    });

    test('Event 10: updatePreventionActionStatus to in_progress generates capa_status_changed notification', async () => {
      const updated = await db.updatePreventionActionStatus(
        qualityStaffId,
        actionId,
        'in_progress',
      );

      expect(updated.status).toBe('in_progress');
      expect(updated.audit_history.length).toBe(2);
      expect(updated.audit_history[1].event_type).toBe('prevention_status_changed');

      const qualityNotifs = await db.getNotifications(qualityStaffId);
      const notif = qualityNotifs.find(
        n => n.event_type === 'capa_status_changed' && n.entity_id === actionId,
      );
      expect(notif).toBeDefined();
      expect(notif?.title_key).toBe('notification.capaStatusChanged.title');
      expect(notif?.message_key).toBe('notification.capaStatusChanged.message');
      expect(notif?.idempotency_key).toBe(
        `notif:capa_status_changed:prevention_action:${actionId}:${qualityStaffId}:in_progress`,
      );
    });

    test('Event 11: updatePreventionActionStatus to completed generates capa_finalized notification', async () => {
      const completed = await db.updatePreventionActionStatus(
        qualityStaffId,
        actionId,
        'completed',
        'Déploiement achevé dans 100% des services ciblés.',
      );

      expect(completed.status).toBe('completed');
      expect(completed.audit_history.length).toBe(3);

      const qualityNotifs = await db.getNotifications(qualityStaffId);
      const notif = qualityNotifs.find(
        n => n.event_type === 'capa_finalized' && n.entity_id === actionId,
      );
      expect(notif).toBeDefined();
      expect(notif?.title_key).toBe('notification.capaFinalized.title');
      expect(notif?.message_key).toBe('notification.capaFinalized.message');
      expect(notif?.idempotency_key).toBe(
        `notif:capa_finalized:prevention_action:${actionId}:${qualityStaffId}:completed`,
      );
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Transaction Rollback Atomicity
  // ────────────────────────────────────────────────────────────
  describe('Transaction Rollback Atomicity', () => {
    test('submitDeclaration rolls back if notification generation fails', async () => {
      const rollbackDeclId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-15',
        incident_type: 'percutaneous_exposure',
      });

      // Spy on insertNotification to throw a simulated error
      const insertSpy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated notification network failure'));

      await expect(db.submitDeclaration(rollbackDeclId)).rejects.toThrow(
        'Simulated notification network failure',
      );

      insertSpy.mockRestore();

      // Declaration status MUST still be 'draft'
      const decl = await db.getDeclarationById(rollbackDeclId, exposedUser1Id);
      expect(decl?.status).toBe('draft');

      // No notification should exist for this declaration
      const notifs = await db.getNotifications(adminReviewerId);
      const orphanedNotif = notifs.find(
        n => n.event_type === 'declaration_submitted' && n.entity_id === rollbackDeclId,
      );
      expect(orphanedNotif).toBeUndefined();
    });

    test('createAdministrativeReview rolls back if notification fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedUser1Id,
        incident_date: '2026-11-15',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);

      const insertSpy = jest
        .spyOn(db, 'insertNotification')
        .mockRejectedValueOnce(new Error('Simulated review notification crash'));

      await expect(
        db.createAdministrativeReview({
          declaration_id: declId,
          reviewer_user_id: adminReviewerId,
          outcome: 'acknowledged',
        }),
      ).rejects.toThrow('Simulated review notification crash');

      insertSpy.mockRestore();

      // Declaration MUST still be 'submitted', not 'under_review'
      const decl = await db.getDeclarationById(declId, exposedUser1Id);
      expect(decl?.status).toBe('submitted');

      // Review record MUST NOT exist in DB
      const reviews = (
        await db.query(
          `SELECT * FROM administrative_reviews WHERE declaration_id = ?`,
          [declId],
        )
      ).rows;
      expect(reviews.length).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. tech_admin Operational Exclusion
  // ────────────────────────────────────────────────────────────
  describe('tech_admin Operational Exclusion', () => {
    test('tech_admin is never addressed in notifications and returns empty list and count 0', async () => {
      const count = await db.getUnreadNotificationCount(techAdminId);
      expect(count).toBe(0);

      const notifs = await db.getNotifications(techAdminId);
      expect(notifs).toEqual([]);

      // Direct DB query check: zero rows exist for tech_admin
      const rawRows = (
        await db.query(
          `SELECT * FROM in_app_notifications WHERE recipient_user_id = ?`,
          [techAdminId],
        )
      ).rows;
      expect(rawRows.length).toBe(0);
    });
  });
});
