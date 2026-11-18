/**
 * AES Guardian — Phase 2D.2H: End-to-End Synthetic Multi-Role Notification Acceptance
 *
 * Verifies all 5 canonical synthetic user journeys, 11 event-to-destination mappings,
 * transaction rollback boundaries, and strict cross-role isolation against native SQLite.
 *
 * Synthetic Journeys:
 * - Journey A: Exposed Professional (declaration -> admin notification -> correction cycle -> review complete -> status-only OH)
 * - Journey B: Administrative Reviewer (declaration alert -> review action -> OH referral initiation -> privacy minimization)
 * - Journey C: Occupational Health (OH alert -> clinical coordination -> ack -> milestones -> completion -> zero clinical leak)
 * - Journey D: Quality Staff (CAPA created -> status changed -> finalized -> idempotency -> clinical data denial)
 * - Journey E: Tech Administrator (blanket notification exclusion -> zero operational data -> technical diagnostics isolated)
 */

import { AesGuardianDatabase } from '../../../core/database/AesGuardianDatabase';
import { NativeSQLiteAdapter } from '../../../core/database/NativeSQLiteAdapter';
import {
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
} from '../../../core/auth/boundaries';
import {
  resolveNotificationNavigation,
} from '../navigation/notification-navigation-resolver';
import { formatNotification, SUPPORTED_LOCALES } from '../../../localization';

describe('AES Guardian — Phase 2D.2H: End-to-End Synthetic Multi-Role Acceptance', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;

  // Canonical user IDs
  let exposedId: number;
  let adminId: number;
  let ohId: number;
  let qualityId: number;
  let techAdminId: number;

  beforeAll(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();

    const users = (await db.query<{ id: number; role: string }>('SELECT id, role FROM demo_users')).rows;
    exposedId = users.find((u) => u.role === 'exposed_professional')!.id;
    adminId = users.find((u) => u.role === 'admin_reviewer')!.id;
    ohId = users.find((u) => u.role === 'oh_professional')!.id;
    qualityId = users.find((u) => u.role === 'quality_staff')!.id;
    techAdminId = users.find((u) => u.role === 'tech_admin')!.id;

    expect(exposedId).toBe(1);
    expect(adminId).toBe(2);
    expect(ohId).toBe(3);
    expect(qualityId).toBe(4);
    expect(techAdminId).toBe(5);
  });

  afterAll(async () => {
    await adapter.close();
  });

  // ────────────────────────────────────────────────────────────
  // Journey A: Exposed Professional
  // ────────────────────────────────────────────────────────────
  describe('Journey A — Exposed Professional Workflow & Status Projection', () => {
    let declId: number;
    let corrReviewId: number;

    test('1. Exposed professional submits an AES declaration; admin receives declaration_submitted notification', async () => {
      declId = await db.createDraft({
        declared_by_user_id: exposedId,
        incident_date: '2026-11-15T08:00:00Z',
        incident_type: 'percutaneous_exposure',
        department_code: 'URG',
        circumstances: 'Accident d’exposition percutané lors d’un prélèvement avec aiguille creuse',
      });

      const initialAdminCount = await db.getUnreadNotificationCount(adminId);

      // Submit declaration
      const submitRes = await db.submitDeclaration(declId);
      expect(submitRes.rowsAffected).toBe(1);

      // Admin reviewer received notification
      const adminCountAfter = await db.getUnreadNotificationCount(adminId);
      expect(adminCountAfter).toBe(initialAdminCount + 1);

      const adminNotifs = await db.getNotifications(adminId, { is_read: 0 });
      const submitNotif = adminNotifs.find((n) => n.event_type === 'declaration_submitted' && n.entity_id === declId);
      expect(submitNotif).toBeDefined();
      expect(submitNotif!.entity_type).toBe('aes_declaration');

      // Admin resolves navigation
      const navResult = await resolveNotificationNavigation(submitNotif!, SYNTHETIC_ADMIN_REVIEWER_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('adminReviewAction');
        expect(navResult.params).toEqual({ declarationId: declId });
      }
    });

    test('2. Admin reviewer requests correction; exposed professional receives correction_requested notification', async () => {
      const initialExpCount = await db.getUnreadNotificationCount(exposedId);

      // Admin requests correction
      const revRes = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminId,
        outcome: 'correction_requested',
        correction_reason: 'Préciser la référence exacte du matériel de sécurité utilisé.',
        comments: 'Veuillez préciser la référence exacte du matériel de sécurité.',
      });
      corrReviewId = revRes.reviewId;

      const expCountAfter = await db.getUnreadNotificationCount(exposedId);
      expect(expCountAfter).toBe(initialExpCount + 1);

      const expNotifs = await db.getNotifications(exposedId, { is_read: 0 });
      const corrNotif = expNotifs.find((n) => n.event_type === 'correction_requested' && n.entity_id === corrReviewId);
      expect(corrNotif).toBeDefined();
      expect(corrNotif!.entity_type).toBe('administrative_review');

      // Exposed user resolves navigation to correctionResponse
      const navResult = await resolveNotificationNavigation(corrNotif!, SYNTHETIC_DEMO_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('correctionResponse');
        expect(navResult.params).toEqual({ declarationId: declId, reviewId: corrReviewId });
      }
    });

    test('3. Exposed professional responds to correction; admin receives correction_submitted notification', async () => {
      const initialAdminCount = await db.getUnreadNotificationCount(adminId);

      const respRes = await db.createCorrectionResponse({
        declaration_id: declId,
        review_id: corrReviewId,
        user_id: exposedId,
        response_text: 'Matériel utilisé : aiguille à ailette avec dispositif de mise en sécurité manuelle.',
      });

      const adminCountAfter = await db.getUnreadNotificationCount(adminId);
      expect(adminCountAfter).toBe(initialAdminCount + 1);

      const adminNotifs = await db.getNotifications(adminId, { is_read: 0 });
      const respNotif = adminNotifs.find((n) => n.event_type === 'correction_submitted' && n.entity_id === respRes.responseId);
      expect(respNotif).toBeDefined();

      // Admin resolves navigation
      const navResult = await resolveNotificationNavigation(respNotif!, SYNTHETIC_ADMIN_REVIEWER_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('adminReviewAction');
        expect(navResult.params).toEqual({ declarationId: declId });
      }
    });

    test('4. Admin reviewer acknowledges review; exposed professional receives review_completed notification', async () => {
      const initialExpCount = await db.getUnreadNotificationCount(exposedId);

      const finalRevRes = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminId,
        outcome: 'acknowledged',
        comments: 'Déclaration validée suite aux précisions fournies.',
      });

      const expCountAfter = await db.getUnreadNotificationCount(exposedId);
      expect(expCountAfter).toBe(initialExpCount + 1);

      const expNotifs = await db.getNotifications(exposedId, { is_read: 0 });
      const reviewNotif = expNotifs.find((n) => n.event_type === 'review_completed' && n.entity_id === finalRevRes.reviewId);
      expect(reviewNotif).toBeDefined();

      // Exposed user navigates to declarationDetails
      const navResult = await resolveNotificationNavigation(reviewNotif!, SYNTHETIC_DEMO_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('declarationDetails');
        expect(navResult.params).toEqual({ declarationId: declId });
      }
    });

    test('5. Exposed professional querying OH status receives exactly the 5-field status projection', async () => {
      // Create and acknowledge coordination for this declaration
      const coordId = await db.createOhCoordination({
        declaration_id: declId,
        coordination_reason: 'serology_monitoring',
        created_by_user_id: adminId,
      });
      await db.acknowledgeOhCoordination(coordId, ohId);

      // Verify exposed user projection
      const statusProjection = await db.getOhCoordinationByDeclaration(declId, exposedId);
      expect(statusProjection).toBeDefined();
      const keys = Object.keys(statusProjection!);
      expect(keys.sort()).toEqual(['created_at', 'declaration_id', 'id', 'status', 'updated_at'].sort());
      expect(keys.length).toBe(5);

      // Clinical notes and staff IDs must NOT be present
      expect((statusProjection as any).notes).toBeUndefined();
      expect((statusProjection as any).created_by_user_id).toBeUndefined();
      expect((statusProjection as any).acknowledged_by_user_id).toBeUndefined();
      expect((statusProjection as any).coordination_reason).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Journey B: Administrative Reviewer
  // ────────────────────────────────────────────────────────────
  describe('Journey B — Administrative Reviewer & Privacy Minimization', () => {
    let declId: number;
    let coordId: number;

    beforeAll(async () => {
      declId = await db.createDraft({
        declared_by_user_id: exposedId,
        incident_date: '2026-11-15T09:00:00Z',
        incident_type: 'mucocutaneous_exposure',
        department_code: 'MED',
        circumstances: 'Projection oculaire lors d’un soin',
      });
      await db.submitDeclaration(declId);
    });

    test('1. Admin receives declaration notification and navigates to review action', async () => {
      const adminNotifs = await db.getNotifications(adminId, { is_read: 0 });
      const notif = adminNotifs.find((n) => n.event_type === 'declaration_submitted' && n.entity_id === declId);
      expect(notif).toBeDefined();

      const navResult = await resolveNotificationNavigation(notif!, SYNTHETIC_ADMIN_REVIEWER_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('adminReviewAction');
        expect(navResult.params).toEqual({ declarationId: declId });
      }
    });

    test('2. Admin initiates OH coordination; notification is sent to oh_professional, NOT exposed professional', async () => {
      const initialOhCount = await db.getUnreadNotificationCount(ohId);
      const initialExpCount = await db.getUnreadNotificationCount(exposedId);

      coordId = await db.createOhCoordination({
        declaration_id: declId,
        coordination_reason: 'serology_monitoring',
        created_by_user_id: adminId,
      });

      const ohCountAfter = await db.getUnreadNotificationCount(ohId);
      const expCountAfter = await db.getUnreadNotificationCount(exposedId);

      expect(ohCountAfter).toBe(initialOhCount + 1);
      expect(expCountAfter).toBe(initialExpCount); // Exposed user does not receive creation alert

      const ohNotifs = await db.getNotifications(ohId, { is_read: 0 });
      const coordNotif = ohNotifs.find((n) => n.event_type === 'oh_coordination_created' && n.entity_id === coordId);
      expect(coordNotif).toBeDefined();
    });

    test('3. Admin is rejected if attempting to navigate to clinical OH coordination detail', async () => {
      // Find the OH coordination notification
      const ohNotifs = await db.getNotifications(ohId);
      const coordNotif = ohNotifs.find((n) => n.event_type === 'oh_coordination_created' && n.entity_id === coordId);
      expect(coordNotif).toBeDefined();

      // Admin attempts to resolve OH notification
      const navResult = await resolveNotificationNavigation(coordNotif!, SYNTHETIC_ADMIN_REVIEWER_CONTEXT, db);
      // Fails closed as not_found (since ownership check rejects admin as recipient)
      expect(navResult.status).toBe('not_found');
    });

    test('4. Admin accessing OH coordination list receives sanitized administrative projection', async () => {
      const adminProjectionList = await db.listOhCoordinationsForAdmin(adminId);
      expect(Array.isArray(adminProjectionList)).toBe(true);
      const record = adminProjectionList.find((r) => r.id === coordId);
      expect(record).toBeDefined();

      // Must NOT contain sensitive clinical follow-up details
      expect((record as any).administrative_note).toBeUndefined();
      expect((record as any).notes).toBeUndefined();
      expect((record as any).serology_results).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Journey C: Occupational Health Professional
  // ────────────────────────────────────────────────────────────
  describe('Journey C — Occupational Health & Follow-Up Lifecycle', () => {
    let declId: number;
    let coordId: number;

    beforeAll(async () => {
      declId = await db.createDraft({
        declared_by_user_id: exposedId,
        incident_date: '2026-11-15T10:00:00Z',
        incident_type: 'percutaneous_exposure',
        department_code: 'BLOC',
        circumstances: 'Blessure par aiguille de suture en fermeture cutanée',
      });
      await db.submitDeclaration(declId);
      coordId = await db.createOhCoordination({
        declaration_id: declId,
        coordination_reason: 'serology_monitoring',
        created_by_user_id: adminId,
      });
    });

    test('1. OH professional resolves oh_coordination_created to ohCoordinationDetail', async () => {
      const ohNotifs = await db.getNotifications(ohId, { is_read: 0 });
      const coordNotif = ohNotifs.find((n) => n.event_type === 'oh_coordination_created' && n.entity_id === coordId);
      expect(coordNotif).toBeDefined();

      const navResult = await resolveNotificationNavigation(coordNotif!, SYNTHETIC_OH_PROFESSIONAL_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('ohCoordinationDetail');
        expect(navResult.params).toEqual({ coordinationId: coordId });
      }
    });

    test('2. OH professional acknowledges coordination; exposed user receives status notification', async () => {
      const initialExpCount = await db.getUnreadNotificationCount(exposedId);

      await db.acknowledgeOhCoordination(coordId, ohId);

      const expCountAfter = await db.getUnreadNotificationCount(exposedId);
      expect(expCountAfter).toBe(initialExpCount + 1);

      const expNotifs = await db.getNotifications(exposedId, { is_read: 0 });
      const ackNotif = expNotifs.find((n) => n.event_type === 'oh_coordination_acknowledged' && n.entity_id === coordId);
      expect(ackNotif).toBeDefined();

      // Exposed user navigates to declarationCoordinationStatus, NOT ohCoordinationDetail
      const navResult = await resolveNotificationNavigation(ackNotif!, SYNTHETIC_DEMO_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('declarationCoordinationStatus');
        expect(navResult.params).toEqual({ declarationId: declId });
      }
    });

    test('3. OH professional records milestone; exposed user receives oh_milestone_recorded notification', async () => {
      const initialExpCount = await db.getUnreadNotificationCount(exposedId);

      const eventId = await db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'consultation_recorded',
        event_date: '2026-11-15T11:00:00Z',
        recorded_by_user_id: ohId,
        administrative_note: 'Bilan sérologique M1 conforme — aucun signe de séroconversion.',
      });

      const expCountAfter = await db.getUnreadNotificationCount(exposedId);
      expect(expCountAfter).toBe(initialExpCount + 1);

      const expNotifs = await db.getNotifications(exposedId, { is_read: 0 });
      const milestoneNotif = expNotifs.find((n) => n.event_type === 'oh_milestone_recorded' && n.entity_id === eventId);
      expect(milestoneNotif).toBeDefined();

      // Verify no clinical details in notification payload
      expect(milestoneNotif!.title_key).toBe('notification.ohMilestoneRecorded.title');
      expect(milestoneNotif!.message_key).toBe('notification.ohMilestoneRecorded.message');

      const formatted = formatNotification(milestoneNotif!, { locale: 'fr' });
      expect(formatted.message).not.toContain('séroconversion');
      expect(formatted.message).not.toContain('Bilan sérologique');

      // Navigates to declarationCoordinationStatus
      const navResult = await resolveNotificationNavigation(milestoneNotif!, SYNTHETIC_DEMO_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('declarationCoordinationStatus');
        expect(navResult.params).toEqual({ declarationId: declId });
      }
    });

    test('4. OH professional completes coordination; exposed user receives oh_coordination_completed notification', async () => {
      const initialExpCount = await db.getUnreadNotificationCount(exposedId);

      await db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'follow_up_completed',
        event_date: '2026-11-15T12:00:00Z',
        recorded_by_user_id: ohId,
        administrative_note: 'Clôture du suivi SST — statut vaccinal VHB protecteur.',
      });

      const expCountAfter = await db.getUnreadNotificationCount(exposedId);
      expect(expCountAfter).toBe(initialExpCount + 1);

      const expNotifs = await db.getNotifications(exposedId, { is_read: 0 });
      const completedNotif = expNotifs.find((n) => n.event_type === 'oh_coordination_completed' && n.entity_id === coordId);
      expect(completedNotif).toBeDefined();

      // Verify no clinical details leaked
      const formatted = formatNotification(completedNotif!, { locale: 'fr' });
      expect(formatted.message).not.toContain('vaccinal');
      expect(formatted.message).not.toContain('VHB');

      // Resolves to declarationCoordinationStatus
      const navResult = await resolveNotificationNavigation(completedNotif!, SYNTHETIC_DEMO_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('declarationCoordinationStatus');
        expect(navResult.params).toEqual({ declarationId: declId });
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // Journey D: Quality Staff
  // ────────────────────────────────────────────────────────────
  describe('Journey D — Quality Staff CAPA Workflow & Epidemiological Boundaries', () => {
    let capaId: number;

    test('1. Quality staff creates CAPA; receives capa_created notification', async () => {
      const initialCount = await db.getUnreadNotificationCount(qualityId);

      const action = await db.createPreventionAction(qualityId, {
        title: 'Mise en place de collecteurs d’aiguilles sécurisés',
        description: 'Déploiement de conteneurs anti-perforation conformes NF X 30-500',
        action_type: 'corrective',
        contributing_factor: 'waste_disposal_container',
        rationale: 'Diminution des piqûres lors de l’élimination',
      });
      capaId = action.id;

      const countAfter = await db.getUnreadNotificationCount(qualityId);
      expect(countAfter).toBe(initialCount + 1);

      const qualityNotifs = await db.getNotifications(qualityId, { is_read: 0 });
      const capaNotif = qualityNotifs.find((n) => n.event_type === 'capa_created' && n.entity_id === capaId);
      expect(capaNotif).toBeDefined();

      // Navigation resolves to preventionActionDetail
      const navResult = await resolveNotificationNavigation(capaNotif!, SYNTHETIC_QUALITY_STAFF_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('preventionActionDetail');
        expect(navResult.params).toEqual({ actionId: capaId });
      }
    });

    test('2. Quality staff transitions CAPA to in_progress; receives capa_status_changed notification', async () => {
      const initialCount = await db.getUnreadNotificationCount(qualityId);

      await db.updatePreventionActionStatus(qualityId, capaId, 'in_progress');

      const countAfter = await db.getUnreadNotificationCount(qualityId);
      expect(countAfter).toBe(initialCount + 1);

      const qualityNotifs = await db.getNotifications(qualityId, { is_read: 0 });
      const statusNotif = qualityNotifs.find((n) => n.event_type === 'capa_status_changed' && n.entity_id === capaId);
      expect(statusNotif).toBeDefined();

      const navResult = await resolveNotificationNavigation(statusNotif!, SYNTHETIC_QUALITY_STAFF_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('preventionActionDetail');
        expect(navResult.params).toEqual({ actionId: capaId });
      }
    });

    test('3. Quality staff finalizes CAPA; receives capa_finalized notification', async () => {
      const initialCount = await db.getUnreadNotificationCount(qualityId);

      await db.updatePreventionActionStatus(qualityId, capaId, 'completed', 'Clôture de la mesure avec succès');

      const countAfter = await db.getUnreadNotificationCount(qualityId);
      expect(countAfter).toBe(initialCount + 1);

      const qualityNotifs = await db.getNotifications(qualityId, { is_read: 0 });
      const finalNotif = qualityNotifs.find((n) => n.event_type === 'capa_finalized' && n.entity_id === capaId);
      expect(finalNotif).toBeDefined();

      const navResult = await resolveNotificationNavigation(finalNotif!, SYNTHETIC_QUALITY_STAFF_CONTEXT, db);
      expect(navResult.status).toBe('success');
      if (navResult.status === 'success') {
        expect(navResult.route).toBe('preventionActionDetail');
        expect(navResult.params).toEqual({ actionId: capaId });
      }
    });

    test('4. Quality staff cannot perform administrative reviews or OH follow-ups', async () => {
      // Quality staff cannot perform administrative reviews
      await expect(
        db.createAdministrativeReview({
          declaration_id: 1,
          reviewer_user_id: qualityId,
          outcome: 'acknowledged',
          comments: 'Tentative non autorisée',
        }),
      ).rejects.toThrow();

      // Quality staff cannot perform OH follow-up actions
      await expect(
        db.createOhFollowUpEvent({
          coordination_id: 1,
          event_category: 'consultation_recorded',
          event_date: '2026-11-15T12:00:00Z',
          recorded_by_user_id: qualityId,
        }),
      ).rejects.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────────
  // Journey E: Tech Administrator
  // ────────────────────────────────────────────────────────────
  describe('Journey E — Tech Administrator Total Isolation & Diagnostics', () => {
    test('1. tech_admin has zero operational notifications and unread count is always 0', async () => {
      const notifs = await db.getNotifications(techAdminId);
      expect(notifs.length).toBe(0);

      const unreadCount = await db.getUnreadNotificationCount(techAdminId);
      expect(unreadCount).toBe(0);
    });

    test('2. Attempting to create an operational notification addressed to tech_admin fails closed', async () => {
      await expect(
        db.insertNotification({
          recipient_user_id: techAdminId,
          event_type: 'declaration_submitted',
          title_key: 'notification.declarationSubmitted.title',
          message_key: 'notification.declarationSubmitted.message',
          entity_type: 'aes_declaration',
          entity_id: 1,
          idempotency_key: 'tech-admin-forbidden-notif',
        }),
      ).rejects.toThrow(/tech_admin/i);
    });

    test('3. tech_admin resolving any notification navigation receives unauthorized', async () => {
      // Create a dummy notification addressed to user 1
      await db.insertNotification({
        recipient_user_id: exposedId,
        event_type: 'review_completed',
        title_key: 'notification.reviewCompleted.title',
        message_key: 'notification.reviewCompleted.message',
        entity_type: 'administrative_review',
        entity_id: 1,
        idempotency_key: 'tech-admin-nav-check-unique',
      });

      const notif = (await db.getNotifications(exposedId)).find((n) => n.idempotency_key === 'tech-admin-nav-check-unique');
      expect(notif).toBeDefined();

      const navResult = await resolveNotificationNavigation(notif!, SYNTHETIC_TECH_ADMIN_CONTEXT, db);
      expect(navResult.status).toBe('unauthorized');
    });

    test('4. Technical diagnostics and schema verification succeed independently of operational data', async () => {
      const appliedVersions = await db.getAppliedVersions();
      const versionNumbers = appliedVersions.map((v) => v.version);
      expect(versionNumbers).toContain(8);
      expect(versionNumbers.length).toBe(8);

      const fkCheck = await db.query('PRAGMA foreign_key_check');
      expect(fkCheck.rows.length).toBe(0);

      const integrityCheck = await db.query<{ integrity_check: string }>('PRAGMA integrity_check');
      expect(integrityCheck.rows[0].integrity_check).toBe('ok');
    });
  });

  // ────────────────────────────────────────────────────────────
  // Transaction Rollback & Failure-Injection Tests
  // ────────────────────────────────────────────────────────────
  describe('Transactional Failure Injection & Atomicity', () => {
    test('1. Declaration submission rolls back atomically if notification insertion fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedId,
        incident_date: '2026-11-15T13:00:00Z',
        incident_type: 'percutaneous_exposure',
        department_code: 'URG',
      });

      const spy = jest.spyOn(db, 'insertNotification').mockRejectedValueOnce(new Error('Simulated SQLite disk error'));
      try {
        await expect(db.submitDeclaration(declId)).rejects.toThrow('Simulated SQLite disk error');

        // Declaration must remain in 'draft' status (not transitioned to 'submitted')
        const decl = await db.getDeclarationById(declId, exposedId);
        expect(decl?.status).toBe('draft');
      } finally {
        spy.mockRestore();
      }
    });

    test('2. Administrative review rolls back atomically if notification insertion fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedId,
        incident_date: '2026-11-15T13:10:00Z',
        incident_type: 'percutaneous_exposure',
        department_code: 'URG',
      });
      await db.submitDeclaration(declId);

      const spy = jest.spyOn(db, 'insertNotification').mockRejectedValueOnce(new Error('Simulated notification failure'));
      try {
        await expect(
          db.createAdministrativeReview({
            declaration_id: declId,
            reviewer_user_id: adminId,
            outcome: 'acknowledged',
            comments: 'Review should roll back',
          }),
        ).rejects.toThrow('Simulated notification failure');

        // Declaration status must remain 'submitted'
        const decl = await db.getDeclarationById(declId, exposedId);
        expect(decl?.status).toBe('submitted');
      } finally {
        spy.mockRestore();
      }
    });

    test('3. OH coordination rolls back atomically if notification insertion fails', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: exposedId,
        incident_date: '2026-11-15T13:20:00Z',
        incident_type: 'percutaneous_exposure',
        department_code: 'URG',
      });
      await db.submitDeclaration(declId);

      const spy = jest.spyOn(db, 'insertNotification').mockRejectedValueOnce(new Error('Simulated OH notif failure'));
      try {
        await expect(
          db.createOhCoordination({
            declaration_id: declId,
            coordination_reason: 'serology_monitoring',
            created_by_user_id: adminId,
          }),
        ).rejects.toThrow('Simulated OH notif failure');

        // No coordination record created
        const coords = await db.query('SELECT * FROM oh_coordinations WHERE declaration_id = ?', [declId]);
        expect(coords.rows.length).toBe(0);
      } finally {
        spy.mockRestore();
      }
    });

    test('4. Duplicate idempotency key safely handles duplicate notification insertions', async () => {
      const idempotencyKey = 'unique-test-key-2d2h';

      await db.insertNotification({
        recipient_user_id: exposedId,
        event_type: 'review_completed',
        title_key: 'notification.reviewCompleted.title',
        message_key: 'notification.reviewCompleted.message',
        entity_type: 'administrative_review',
        entity_id: 1,
        idempotency_key: idempotencyKey,
      });

      // Attempting to insert duplicate notification with same idempotency key does not insert duplicate row
      await db.insertNotification({
        recipient_user_id: exposedId,
        event_type: 'review_completed',
        title_key: 'notification.reviewCompleted.title',
        message_key: 'notification.reviewCompleted.message',
        entity_type: 'administrative_review',
        entity_id: 1,
        idempotency_key: idempotencyKey,
      });

      // Query database: exactly 1 record with this key exists
      const rows = (await db.query('SELECT * FROM in_app_notifications WHERE idempotency_key = ?', [idempotencyKey])).rows;
      expect(rows.length).toBe(1);
    });
  });

  // ────────────────────────────────────────────────────────────
  // Trilingual Localization Verification (FR, EN, AR)
  // ────────────────────────────────────────────────────────────
  describe('Trilingual Notification Content Verification (FR, EN, AR)', () => {
    const allEventTypes = [
      'declaration_submitted',
      'review_completed',
      'correction_requested',
      'correction_submitted',
      'oh_coordination_created',
      'oh_coordination_acknowledged',
      'oh_milestone_recorded',
      'oh_coordination_completed',
      'capa_created',
      'capa_status_changed',
      'capa_finalized',
    ] as const;

    test('all 11 event types render formatted, non-empty title and message in FR, EN, and AR', () => {
      for (const event_type of allEventTypes) {
        const dummyNotif = {
          id: 999,
          recipient_user_id: 1,
          event_type,
          title_key: `notification.${event_type.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}.title`,
          message_key: `notification.${event_type.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}.message`,
          entity_type: 'aes_declaration',
          entity_id: 1,
          entity_reference: 'AES-2026-TEST',
          idempotency_key: `loc-check-${event_type}`,
          is_read: 0,
          created_at: '2026-11-15T12:00:00Z',
        };

        for (const locale of SUPPORTED_LOCALES) {
          const formatted = formatNotification(dummyNotif as any, { locale });
          expect(formatted.title).toBeDefined();
          expect(typeof formatted.title).toBe('string');
          expect(formatted.title.trim().length).toBeGreaterThan(0);
          expect(formatted.title).not.toContain('notification.'); // Must resolve, not fall back to key

          expect(formatted.message).toBeDefined();
          expect(typeof formatted.message).toBe('string');
          expect(formatted.message.trim().length).toBeGreaterThan(0);
          expect(formatted.message).not.toContain('notification.');
        }
      }
    });

    test('notifications persist language-independent keys and references rather than static localized strings', async () => {
      const rows = (await db.query<any>('SELECT title_key, message_key FROM in_app_notifications LIMIT 5')).rows;
      for (const row of rows) {
        expect(row.title_key).toMatch(/^notification\.[a-zA-Z]+\.title$/);
        expect(row.message_key).toMatch(/^notification\.[a-zA-Z]+\.message$/);
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // Seeding, Baseline & Reset Integrity
  // ────────────────────────────────────────────────────────────
  describe('Demo Seeding Baseline & Reset Verification', () => {
    test('non-tech_admin is unauthorized to execute demo reset', async () => {
      await expect(db.resetDemoScenario(adminId)).rejects.toThrow(/only tech_admin/);
      await expect(db.resetDemoScenario(exposedId)).rejects.toThrow(/only tech_admin/);
    });

    test('tech_admin resets and reseeds demo database with exact deterministic 4-notification baseline', async () => {
      const resetRes = await db.resetDemoScenario(techAdminId);
      expect(resetRes.success).toBe(true);
      expect(resetRes.declarationsCount).toBeGreaterThan(0);
      expect(resetRes.resetAt).toBeDefined();

      const allNotifs = (await db.query<any>('SELECT * FROM in_app_notifications ORDER BY id ASC')).rows;
      expect(allNotifs.length).toBe(4);

      // Baseline 1: User 2 — admin_reviewer — declaration_submitted — AES-2026-DEMO-01 — unread
      expect(allNotifs[0].recipient_user_id).toBe(adminId);
      expect(allNotifs[0].event_type).toBe('declaration_submitted');
      expect(allNotifs[0].entity_reference).toBe('AES-2026-DEMO-01');
      expect(allNotifs[0].is_read).toBe(0);

      // Baseline 2: User 1 — exposed_professional — correction_requested — AES-2026-DEMO-02 — unread
      expect(allNotifs[1].recipient_user_id).toBe(exposedId);
      expect(allNotifs[1].event_type).toBe('correction_requested');
      expect(allNotifs[1].entity_reference).toBe('AES-2026-DEMO-02');
      expect(allNotifs[1].is_read).toBe(0);

      // Baseline 3: User 3 — oh_professional — oh_coordination_created — AES-2026-DEMO-03 — read
      expect(allNotifs[2].recipient_user_id).toBe(ohId);
      expect(allNotifs[2].event_type).toBe('oh_coordination_created');
      expect(allNotifs[2].entity_reference).toBe('AES-2026-DEMO-03');
      expect(allNotifs[2].is_read).toBe(1);

      // Baseline 4: User 4 — quality_staff — capa_created — CAPA-2026-00001 — read
      expect(allNotifs[3].recipient_user_id).toBe(qualityId);
      expect(allNotifs[3].event_type).toBe('capa_created');
      expect(allNotifs[3].entity_reference).toBe('CAPA-2026-00001');
      expect(allNotifs[3].is_read).toBe(1);

      // Foreign key check passes cleanly
      const fkCheck = await db.query('PRAGMA foreign_key_check');
      expect(fkCheck.rows.length).toBe(0);
    });

    test('re-seeding is idempotent and does not accumulate duplicate rows', async () => {
      // Run seedStandardScenario again
      await db.seedStandardScenario();

      const allNotifs = (await db.query<any>('SELECT * FROM in_app_notifications ORDER BY id ASC')).rows;
      expect(allNotifs.length).toBe(4);
    });
  });
});
