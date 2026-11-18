/**
 * AES Guardian — End-to-End Workflow Integration & Workspace Tests (Phase 2C.7)
 *
 * Verifies:
 * 1. Central demonstration role store (useDemoRoleStore) and derived permissions for all 5 synthetic roles.
 * 2. Independent domain authorization enforcement: UI role selection does NOT bypass repository boundaries.
 * 3. Idempotent demonstration scenario seeder: seeds 4 representative declarations and 5 CAPA actions once,
 *    and repeated calls do not duplicate records.
 * 4. Full end-to-end multi-role lifecycle flow:
 *    Exposed professional declares -> Admin reviewer requests correction ->
 *    Exposed professional responds -> Admin reviewer approves & initiates OH coordination ->
 *    OH professional manages follow-up & completes -> Quality staff monitors surveillance & creates CAPA.
 * 5. Full localization coverage for workspace keys across French, English, and Arabic.
 */

import {
  initializeDatabase,
  resetDatabaseForTesting,
  AesGuardianDatabase,
  seedDemoScenarioIfEmpty,
} from '../../../core/database';
import {
  useDemoRoleStore,
  DEMO_ROLE_DEFINITIONS,
} from '../../../core/auth/use-demo-role';
import {
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
} from '../../../core/auth/boundaries';
import { t } from '../../../localization';

const { clearAllMockStores } = require('../../../../__mocks__/@op-engineering/op-sqlite');

describe('Phase 2C.7 — End-to-End Workflow Integration & Demonstration Readiness', () => {
  let db: AesGuardianDatabase;
  let exposedUserId: number;
  let adminUserId: number;
  let ohUserId: number;
  let qualityUserId: number;
  let techUserId: number;

  beforeEach(async () => {
    clearAllMockStores();
    resetDatabaseForTesting();
    db = await initializeDatabase({ seedDemoScenario: true });

    const users = await db.listDemoUsers();
    exposedUserId = users.find((u) => u.role === 'exposed_professional')!.id;
    adminUserId = users.find((u) => u.role === 'admin_reviewer')!.id;
    ohUserId = users.find((u) => u.role === 'oh_professional')!.id;
    qualityUserId = users.find((u) => u.role === 'quality_staff')!.id;
    techUserId = users.find((u) => u.role === 'tech_admin')!.id;

    // Reset role store to default
    useDemoRoleStore.getState().setRole('exposed_professional');
  });

  afterEach(() => {
    clearAllMockStores();
    resetDatabaseForTesting();
  });

  // ─── 1. Role Store & Permission Derivation ───────────────────

  describe('Demonstration Role Store & Permission Derivation', () => {
    test('defines all 5 synthetic roles with valid metadata', () => {
      expect(DEMO_ROLE_DEFINITIONS).toHaveLength(5);
      const roles = DEMO_ROLE_DEFINITIONS.map((d) => d.role);
      expect(roles).toEqual([
        'exposed_professional',
        'admin_reviewer',
        'oh_professional',
        'quality_staff',
        'tech_admin',
      ]);

      for (const def of DEMO_ROLE_DEFINITIONS) {
        expect(def.labelKey).toBeTruthy();
        expect(def.defaultLabel).toBeTruthy();
        expect(def.descriptionKey).toBeTruthy();
        expect(def.defaultDescription).toBeTruthy();
        expect(def.context.role).toBe(def.role);
      }
    });

    test('exposed_professional has only declaration and correction permissions', () => {
      const store = useDemoRoleStore.getState();
      store.setRole('exposed_professional');
      const state = useDemoRoleStore.getState();

      expect(state.activeRole).toBe('exposed_professional');
      expect(state.canDeclare).toBe(true);
      expect(state.canRespondToCorrection).toBe(true);
      expect(state.canReview).toBe(false);
      expect(state.canCoordinate).toBe(false);
      expect(state.canFollowUp).toBe(false);
      expect(state.canViewSurveillance).toBe(false);
      expect(state.canViewPrevention).toBe(false);
      expect(state.canManagePrevention).toBe(false);
    });

    test('admin_reviewer has review, coordination, surveillance and read-only prevention permissions', () => {
      const store = useDemoRoleStore.getState();
      store.setRole('admin_reviewer');
      const state = useDemoRoleStore.getState();

      expect(state.activeRole).toBe('admin_reviewer');
      expect(state.canDeclare).toBe(false);
      expect(state.canRespondToCorrection).toBe(false);
      expect(state.canReview).toBe(true);
      expect(state.canCoordinate).toBe(true);
      expect(state.canFollowUp).toBe(false);
      expect(state.canViewSurveillance).toBe(true);
      expect(state.canViewPrevention).toBe(true);
      expect(state.canManagePrevention).toBe(false);
    });

    test('oh_professional has follow-up, surveillance and read-only prevention permissions', () => {
      const store = useDemoRoleStore.getState();
      store.setRole('oh_professional');
      const state = useDemoRoleStore.getState();

      expect(state.activeRole).toBe('oh_professional');
      expect(state.canDeclare).toBe(false);
      expect(state.canRespondToCorrection).toBe(false);
      expect(state.canReview).toBe(false);
      expect(state.canCoordinate).toBe(false);
      expect(state.canFollowUp).toBe(true);
      expect(state.canViewSurveillance).toBe(true);
      expect(state.canViewPrevention).toBe(true);
      expect(state.canManagePrevention).toBe(false);
    });

    test('quality_staff has surveillance and full CAPA management permissions', () => {
      const store = useDemoRoleStore.getState();
      store.setRole('quality_staff');
      const state = useDemoRoleStore.getState();

      expect(state.activeRole).toBe('quality_staff');
      expect(state.canDeclare).toBe(false);
      expect(state.canRespondToCorrection).toBe(false);
      expect(state.canReview).toBe(false);
      expect(state.canCoordinate).toBe(false);
      expect(state.canFollowUp).toBe(false);
      expect(state.canViewSurveillance).toBe(true);
      expect(state.canViewPrevention).toBe(true);
      expect(state.canManagePrevention).toBe(true);
    });

    test('tech_admin has zero domain operational permissions', () => {
      const store = useDemoRoleStore.getState();
      store.setRole('tech_admin');
      const state = useDemoRoleStore.getState();

      expect(state.activeRole).toBe('tech_admin');
      expect(state.canDeclare).toBe(false);
      expect(state.canRespondToCorrection).toBe(false);
      expect(state.canReview).toBe(false);
      expect(state.canCoordinate).toBe(false);
      expect(state.canFollowUp).toBe(false);
      expect(state.canViewSurveillance).toBe(false);
      expect(state.canViewPrevention).toBe(false);
      expect(state.canManagePrevention).toBe(false);
    });
  });

  // ─── 2. Independent Domain Authorization Enforcement ────────

  describe('Independent Domain Authorization Enforcement', () => {
    test('UI role store does not grant database access to unauthorized roles', async () => {
      // Set UI role to admin_reviewer in store
      useDemoRoleStore.getState().setRole('admin_reviewer');

      // Attempting to call repository methods using tech_admin context fails at domain level
      await expect(
        db.getDeclarationById(1, techUserId),
      ).rejects.toThrow(/prohibited/i);

      // Exposed professional cannot access surveillance metrics
      await expect(
        db.getSurveillanceDashboardMetrics(exposedUserId),
      ).rejects.toThrow();

      // Exposed professional cannot create prevention action
      await expect(
        db.createPreventionAction(exposedUserId, {
          title: 'Unauthorized Action',
          description: 'Should fail',
          action_type: 'corrective',
          contributing_factor: 'other_factor',
          rationale: 'Test rationale',
        }),
      ).rejects.toThrow();

      // Tech admin cannot access prevention overview
      await expect(db.getPreventionOverview(techUserId)).rejects.toThrow();
    });
  });

  // ─── 3. Idempotent Demonstration Scenario Seeding ─────────────

  describe('Idempotent Demonstration Scenario Seeder', () => {
    test('seeds 4 declarations and 5 CAPA records on initialization', async () => {
      const declCount = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM aes_declarations`,
      );
      expect(declCount.rows[0].count).toBe(4);

      const capaCount = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM prevention_actions`,
      );
      expect(capaCount.rows[0].count).toBe(5);
    });

    test('re-running seeder does not duplicate records (idempotent)', async () => {
      const result = await seedDemoScenarioIfEmpty(db);
      expect(result.seeded).toBe(false);
      expect(result.declarationsCount).toBe(4);
      expect(result.preventionActionsCount).toBe(5);

      const declCount = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM aes_declarations`,
      );
      expect(declCount.rows[0].count).toBe(4);

      const capaCount = await db.query<{ count: number }>(
        `SELECT COUNT(*) as count FROM prevention_actions`,
      );
      expect(capaCount.rows[0].count).toBe(5);
    });

    test('seeded declarations have correct lifecycle stages', async () => {
      const demo1 = await db.get(
        `SELECT status FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-01'`,
      );
      expect(demo1.status).toBe('submitted');

      const demo2 = await db.get(
        `SELECT status FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-02'`,
      );
      expect(demo2.status).toBe('correction_requested');

      const demo3 = await db.get(
        `SELECT status FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-03'`,
      );
      expect(demo3.status).toBe('under_review');

      const demo4 = await db.get(
        `SELECT status FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-04'`,
      );
      expect(demo4.status).toBe('closed');
    });
  });

  // ─── 4. End-to-End Multi-Role Workflow ────────────────────────

  describe('Complete End-to-End Operational Lifecycle', () => {
    test('full progression: declaration -> review -> correction -> OH follow-up -> surveillance -> CAPA', async () => {
      // ── Step 1: Exposed Professional creates and submits an AES declaration
      const draftId = await db.createDraft({
        declared_by_user_id: exposedUserId,
        incident_date: '2026-11-12T14:30:00Z',
        incident_type: 'percutaneous_exposure',
        circumstances: 'Prélèvement sanguin per-opératoire',
        exposure_description: 'Piqûre profonde avec aiguille creuse 21G',
        protective_measures_taken: 'Gants chirurgicaux',
        department_code: 'CHIR-ORTHO',
      });
      expect(draftId).toBeGreaterThan(0);

      const draftDecl = await db.getDeclarationById(draftId, exposedUserId);
      expect(draftDecl!.status).toBe('draft');

      await db.submitDeclaration(draftId);
      const submittedDecl = await db.getDeclarationById(draftId, exposedUserId);
      expect(submittedDecl!.status).toBe('submitted');

      // ── Step 2: Administrative Reviewer discovers in queue and requests correction
      const queue = await db.getReviewQueue({ requestingUserId: adminUserId });
      const foundInQueue = queue.find((q) => q.id === draftId);
      expect(foundInQueue).toBeDefined();

      const reviewReq = await db.createAdministrativeReview({
        declaration_id: draftId,
        reviewer_user_id: adminUserId,
        outcome: 'correction_requested',
        correction_reason: 'Préciser si le dispositif de sécurité actif était enclenché.',
      });
      expect(reviewReq.declarationStatus).toBe('correction_requested');

      const declAfterReview = await db.getDeclarationById(draftId, adminUserId);
      expect(declAfterReview!.status).toBe('correction_requested');

      // ── Step 3: Exposed Professional submits correction response
      const correctionResp = await db.createCorrectionResponse({
        declaration_id: draftId,
        review_id: reviewReq.reviewId,
        user_id: exposedUserId,
        response_text: 'Le clapet de sécurité n’a pas pu être enclenché avant le geste.',
      });
      expect(correctionResp.declarationStatus).toBe('resubmitted');

      // ── Step 4: Admin Reviewer completes validation and initiates OH coordination
      const approveReview = await db.createAdministrativeReview({
        declaration_id: draftId,
        reviewer_user_id: adminUserId,
        outcome: 'transmission_verified',
        comments: 'Informations complétées. Transmission au service de Santé au Travail.',
      });
      expect(approveReview.declarationStatus).toBe('under_review');

      const coordId = await db.createOhCoordination({
        declaration_id: draftId,
        created_by_user_id: adminUserId,
        coordination_reason: 'serology_monitoring',
      });
      expect(coordId).toBeGreaterThan(0);

      // ── Step 5: OH Professional manages coordination and records follow-up
      const ohQueue = await db.listOhCoordinationsQueue(ohUserId);
      const foundCoord = ohQueue.find((c) => c.id === coordId);
      expect(foundCoord).toBeDefined();

      await db.acknowledgeOhCoordination(coordId, ohUserId);

      const eventId = await db.createOhFollowUpEvent({
        coordination_id: coordId,
        recorded_by_user_id: ohUserId,
        event_category: 'appointment_coordinated',
        event_date: '2026-11-13T09:00:00Z',
        administrative_note: 'Bilan sérologique initial programmé pour le soignant.',
      });
      expect(eventId).toBeGreaterThan(0);

      await db.completeOhCoordination(coordId, ohUserId);
      const completedCoord = await db.getOhCoordinationById(coordId, ohUserId);
      expect(completedCoord!.status).toBe('completed');

      // ── Step 6: Quality Staff reviews surveillance and creates a CAPA action
      const metrics = await db.getSurveillanceDashboardMetrics(qualityUserId);
      expect(metrics.overview.totalDeclarations).toBeGreaterThanOrEqual(5);

      const capa = await db.createPreventionAction(qualityUserId, {
        title: 'Formation au maniement des aiguilles avec dispositif de sécurité',
        description: 'Organiser une session pratique pour les équipes chirurgicales sur les aiguilles de sécurité.',
        action_type: 'preventive',
        contributing_factor: 'device_safety_design',
        rationale: 'Signalement d’une non-activation du clapet de sécurité lors d’un prélèvement.',
        target_date: '2026-12-31',
      });
      expect(capa.status).toBe('proposed');

      // Transition CAPA to in_progress then completed
      await db.updatePreventionActionStatus(qualityUserId, capa.id, 'in_progress');
      const finishedCapa = await db.updatePreventionActionStatus(
        qualityUserId,
        capa.id,
        'completed',
        'Session réalisée auprès de 24 soignants le 10/12/2026.',
      );
      expect(finishedCapa.status).toBe('completed');
      expect(finishedCapa.completed_at).toBeTruthy();
    });
  });

  // ─── 5. Localization Consistency ─────────────────────────────

  describe('Localization & Workspace Strings', () => {
    test('French workspace strings render properly without missing keys', () => {
      expect(t('workspace.tagline', 'fr')).toContain('Accidents avec Exposition au Sang');
      expect(t('workspace.disclaimerTitle', 'fr')).toContain('Prototype de Démonstration PFE');
      expect(t('workspace.roleSelectorTitle', 'fr')).toContain('Sélecteur de Rôle');
      expect(t('workspace.module.newDeclaration', 'fr')).toBe('Déclarer un AES');
      expect(t('workspace.module.surveillanceDashboard', 'fr')).toBe('Tableau de Bord Épidémiologique');
      expect(t('workspace.step1.title', 'fr')).toContain('1. Déclaration AES');
      expect(t('workspace.step6.title', 'fr')).toContain("6. Plan d'Actions CAPA");
    });

    test('English workspace strings render properly', () => {
      expect(t('workspace.tagline', 'en')).toContain('Blood Exposure Incident');
      expect(t('workspace.disclaimerTitle', 'en')).toContain('PFE Demonstration Prototype');
      expect(t('workspace.roleSelectorTitle', 'en')).toBe('Demonstration Role Selector');
      expect(t('workspace.module.newDeclaration', 'en')).toBe('Report an AES Incident');
      expect(t('workspace.module.surveillanceDashboard', 'en')).toBe(
        'Epidemiological Surveillance Dashboard',
      );
    });

    test('Arabic workspace strings render properly', () => {
      expect(t('workspace.tagline', 'ar')).toContain('حوادث التعرض للدم');
      expect(t('workspace.disclaimerTitle', 'ar')).toContain('نموذج تجريبي لمشروع التخرج');
      expect(t('workspace.roleSelectorTitle', 'ar')).toBe('محدد الأدوار التجريبي');
      expect(t('workspace.module.newDeclaration', 'ar')).toBe('تسجيل بلاغ حادث تعرض (AES)');
      expect(t('workspace.module.surveillanceDashboard', 'ar')).toBe('لوحة الترصد الوبائي');
    });
  });
});
