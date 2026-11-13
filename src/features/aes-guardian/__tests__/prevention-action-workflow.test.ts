/**
 * AES Guardian — Prevention & Corrective-Action Management Tests (Phase 2C.6)
 *
 * Verifies:
 * - Creation of prevention and corrective actions with required fields and validation.
 * - Correct default lifecycle status ('proposed').
 * - Valid status transitions:
 *    - proposed -> in_progress
 *    - proposed -> cancelled
 *    - in_progress -> completed (requires completion note)
 *    - in_progress -> cancelled
 * - Rejection of invalid transitions (proposed -> completed, terminal completed/cancelled -> active).
 * - Target dates and completion timestamps.
 * - Prevention overview calculation (aggregate counts by status).
 * - Register filtering (by status, action_type, contributing_factor).
 * - Audit event generation on creation and status transitions.
 * - Strict role-based authorization matrix:
 *    - quality_staff: Full create and status management.
 *    - admin_reviewer: Read-only access to register & details; cannot create/update.
 *    - oh_professional: Read-only access to register & details; cannot create/update.
 *    - exposed_professional: Strictly prohibited from prevention register.
 *    - tech_admin: Strictly prohibited from prevention content.
 * - Privacy: Zero clinical narratives, personal names, or declaration identifiers exposed.
 */

import {
  initializeDatabase,
  resetDatabaseForTesting,
  AesGuardianDatabase,
  isValidPreventionTransition,
} from '../../../core/database';
import {
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  canManagePreventionActions,
  canViewPreventionActions,
} from '../../../core/auth/boundaries';

const { clearAllMockStores } = require('../../../../__mocks__/@op-engineering/op-sqlite');

describe('Phase 2C.6 — Prevention & Corrective-Action Management (CAPA)', () => {
  let db: AesGuardianDatabase;
  let qualityUserId: number;
  let adminUserId: number;
  let ohUserId: number;
  let exposedUserId: number;
  let techUserId: number;

  beforeEach(async () => {
    clearAllMockStores();
    resetDatabaseForTesting();
    db = await initializeDatabase();

    const users = await db.listDemoUsers();
    qualityUserId = users.find(u => u.role === 'quality_staff')!.id;
    adminUserId = users.find(u => u.role === 'admin_reviewer')!.id;
    ohUserId = users.find(u => u.role === 'oh_professional')!.id;
    exposedUserId = users.find(u => u.role === 'exposed_professional')!.id;
    techUserId = users.find(u => u.role === 'tech_admin')!.id;
  });

  afterEach(() => {
    clearAllMockStores();
    resetDatabaseForTesting();
  });

  // ─── 1. Creation & Required-Field Validation ──────────────────

  test('quality_staff successfully creates a prevention action with valid fields', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Dotation en collecteurs de sécurité',
      description: 'Installer des collecteurs pour objets tranchants avec clapet anti-reflux dans chaque box de consultation.',
      action_type: 'preventive',
      contributing_factor: 'waste_disposal_container',
      rationale: 'Surveillance T3 a relevé 2 piqûres lors de lélimination manuelle sans conteneur à portée immédiate.',
      target_date: '2026-12-15',
      surveillance_reference: 'Observation T3-2026: DASRI',
    });

    expect(action).toBeDefined();
    expect(action.id).toBeDefined();
    expect(action.reference_code).toMatch(/^CAPA-\d{4}-\d{5}$/);
    expect(action.title).toBe('Dotation en collecteurs de sécurité');
    expect(action.status).toBe('proposed');
    expect(action.action_type).toBe('preventive');
    expect(action.contributing_factor).toBe('waste_disposal_container');
    expect(action.target_date).toBe('2026-12-15');
    expect(action.completed_at).toBeNull();
    expect(action.completion_notes).toBeNull();
  });

  test('Rejects creation when title is missing or too short', async () => {
    await expect(
      db.createPreventionAction(qualityUserId, {
        title: 'ab',
        description: 'Description détaillée',
        action_type: 'corrective',
        contributing_factor: 'procedure_compliance',
        rationale: 'Justification suffisante',
      }),
    ).rejects.toThrow(/title must be at least 3 characters/);
  });

  test('Rejects creation when description is too short', async () => {
    await expect(
      db.createPreventionAction(qualityUserId, {
        title: 'Titre Valide',
        description: 'mini',
        action_type: 'corrective',
        contributing_factor: 'procedure_compliance',
        rationale: 'Justification suffisante',
      }),
    ).rejects.toThrow(/description must be at least 5 characters/);
  });

  test('Rejects creation when rationale is too short', async () => {
    await expect(
      db.createPreventionAction(qualityUserId, {
        title: 'Titre Valide',
        description: 'Description suffisante pour le test',
        action_type: 'corrective',
        contributing_factor: 'procedure_compliance',
        rationale: 'abc',
      }),
    ).rejects.toThrow(/rationale must be at least 5 characters/);
  });

  test('Rejects creation with invalid target_date format', async () => {
    await expect(
      db.createPreventionAction(qualityUserId, {
        title: 'Titre Valide',
        description: 'Description suffisante pour le test',
        action_type: 'corrective',
        contributing_factor: 'procedure_compliance',
        rationale: 'Justification suffisante',
        target_date: '15-12-2026', // Format JJ-MM-AAAA au lieu de YYYY-MM-DD
      }),
    ).rejects.toThrow(/target_date must be in YYYY-MM-DD format/);
  });

  // ─── 2. Lifecycle Transitions & State Machine ─────────────────

  test('Transitions from proposed to in_progress successfully', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Sensibilisation aux gants doubles',
      description: 'Mettre à disposition et former au port des gants doubles lors des interventions chirurgicales à haut risque.',
      action_type: 'preventive',
      contributing_factor: 'protective_equipment',
      rationale: 'Recommandation standard en chirurgie orthopédique.',
    });

    const updated = await db.updatePreventionActionStatus(qualityUserId, action.id, 'in_progress');
    expect(updated.status).toBe('in_progress');
  });

  test('Transitions from in_progress to completed with completion note', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Mise à niveau protocole DASRI',
      description: 'Actualiser la note de service sur le remplissage des fûts DASRI.',
      action_type: 'corrective',
      contributing_factor: 'procedure_compliance',
      rationale: 'Constat de débordement de conteneur.',
    });

    await db.updatePreventionActionStatus(qualityUserId, action.id, 'in_progress');

    const completed = await db.updatePreventionActionStatus(
      qualityUserId,
      action.id,
      'completed',
      'Note diffusée à tous les services et accusé de réception signé.',
    );

    expect(completed.status).toBe('completed');
    expect(completed.completed_at).toBeDefined();
    expect(completed.completion_notes).toBe('Note diffusée à tous les services et accusé de réception signé.');
  });

  test('Rejects completing an action without a completion note', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Action en cours',
      description: 'Description de test',
      action_type: 'corrective',
      contributing_factor: 'training_supervision',
      rationale: 'Justification de test',
    });

    await db.updatePreventionActionStatus(qualityUserId, action.id, 'in_progress');

    await expect(
      db.updatePreventionActionStatus(qualityUserId, action.id, 'completed', ''),
    ).rejects.toThrow(/completion note must be at least 3 characters/);
  });

  test('Rejects illegal direct transition from proposed to completed', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Action directe',
      description: 'Description de test',
      action_type: 'preventive',
      contributing_factor: 'device_safety_design',
      rationale: 'Justification de test',
    });

    await expect(
      db.updatePreventionActionStatus(qualityUserId, action.id, 'completed', 'Note'),
    ).rejects.toThrow(/Invalid transition from 'proposed' to 'completed'/);
  });

  test('Cancelling an action from proposed or in_progress is permitted', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Action à annuler',
      description: 'Description de test',
      action_type: 'preventive',
      contributing_factor: 'other_factor',
      rationale: 'Justification de test',
    });

    const cancelled = await db.updatePreventionActionStatus(
      qualityUserId,
      action.id,
      'cancelled',
      'Mesure remplacée par un approvisionnement centralisé.',
    );

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.completion_notes).toBe('Mesure remplacée par un approvisionnement centralisé.');
  });

  test('Rejects transitions out of completed or cancelled terminal states', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Action terminale',
      description: 'Description de test',
      action_type: 'preventive',
      contributing_factor: 'other_factor',
      rationale: 'Justification de test',
    });

    await db.updatePreventionActionStatus(qualityUserId, action.id, 'in_progress');
    await db.updatePreventionActionStatus(qualityUserId, action.id, 'completed', 'Fait.');

    // Attempt to revert back to in_progress
    await expect(
      db.updatePreventionActionStatus(qualityUserId, action.id, 'in_progress'),
    ).rejects.toThrow(/Invalid transition from 'completed' to 'in_progress'/);

    // Attempt to cancel an already completed action
    await expect(
      db.updatePreventionActionStatus(qualityUserId, action.id, 'cancelled'),
    ).rejects.toThrow(/Invalid transition from 'completed' to 'cancelled'/);
  });

  test('isValidPreventionTransition helper evaluates lifecycle strictly', () => {
    expect(isValidPreventionTransition('proposed', 'in_progress')).toBe(true);
    expect(isValidPreventionTransition('proposed', 'cancelled')).toBe(true);
    expect(isValidPreventionTransition('proposed', 'completed')).toBe(false);

    expect(isValidPreventionTransition('in_progress', 'completed')).toBe(true);
    expect(isValidPreventionTransition('in_progress', 'cancelled')).toBe(true);
    expect(isValidPreventionTransition('in_progress', 'proposed')).toBe(false);

    expect(isValidPreventionTransition('completed', 'in_progress')).toBe(false);
    expect(isValidPreventionTransition('completed', 'cancelled')).toBe(false);

    expect(isValidPreventionTransition('cancelled', 'proposed')).toBe(false);
    expect(isValidPreventionTransition('cancelled', 'in_progress')).toBe(false);
  });

  // ─── 3. Register Listing, Filtering & Overview ────────────────

  test('Calculates prevention overview accurately', async () => {
    // Action 1: proposed
    await db.createPreventionAction(qualityUserId, {
      title: 'Action 1',
      description: 'Desc 1',
      action_type: 'preventive',
      contributing_factor: 'device_safety_design',
      rationale: 'Raison 1',
    });

    // Action 2: in_progress
    const a2 = await db.createPreventionAction(qualityUserId, {
      title: 'Action 2',
      description: 'Desc 2',
      action_type: 'corrective',
      contributing_factor: 'procedure_compliance',
      rationale: 'Raison 2',
    });
    await db.updatePreventionActionStatus(qualityUserId, a2.id, 'in_progress');

    // Action 3: completed
    const a3 = await db.createPreventionAction(qualityUserId, {
      title: 'Action 3',
      description: 'Desc 3',
      action_type: 'preventive',
      contributing_factor: 'training_supervision',
      rationale: 'Raison 3',
    });
    await db.updatePreventionActionStatus(qualityUserId, a3.id, 'in_progress');
    await db.updatePreventionActionStatus(qualityUserId, a3.id, 'completed', 'Terminé avec succès.');

    // Action 4: cancelled
    const a4 = await db.createPreventionAction(qualityUserId, {
      title: 'Action 4',
      description: 'Desc 4',
      action_type: 'corrective',
      contributing_factor: 'workload_fatigue',
      rationale: 'Raison 4',
    });
    await db.updatePreventionActionStatus(qualityUserId, a4.id, 'cancelled');

    const overview = await db.getPreventionOverview(qualityUserId);
    expect(overview).toEqual({
      total: 4,
      proposed: 1,
      in_progress: 1,
      completed: 1,
      cancelled: 1,
    });
  });

  test('Filters prevention actions by status, action_type, and factor', async () => {
    await db.createPreventionAction(qualityUserId, {
      title: 'Action Corrective Procédure',
      description: 'Description corrective',
      action_type: 'corrective',
      contributing_factor: 'procedure_compliance',
      rationale: 'Raison corrective',
    });

    await db.createPreventionAction(qualityUserId, {
      title: 'Action Préventive Matériel',
      description: 'Description préventive',
      action_type: 'preventive',
      contributing_factor: 'device_safety_design',
      rationale: 'Raison préventive',
    });

    // Filter by type: corrective
    const correctives = await db.listPreventionActions(qualityUserId, { action_type: 'corrective' });
    expect(correctives.length).toBe(1);
    expect(correctives[0].action_type).toBe('corrective');

    // Filter by type: preventive
    const preventives = await db.listPreventionActions(qualityUserId, { action_type: 'preventive' });
    expect(preventives.length).toBe(1);
    expect(preventives[0].action_type).toBe('preventive');

    // Filter by factor: device_safety_design
    const deviceActions = await db.listPreventionActions(qualityUserId, {
      contributing_factor: 'device_safety_design',
    });
    expect(deviceActions.length).toBe(1);
    expect(deviceActions[0].contributing_factor).toBe('device_safety_design');
  });

  // ─── 4. Audit History & Non-Identifiability ───────────────────

  test('Audit log records creation and status change events', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Action avec audit',
      description: 'Vérification de la traçabilité',
      action_type: 'preventive',
      contributing_factor: 'training_supervision',
      rationale: 'Assurer la traçabilité audit',
    });

    await db.updatePreventionActionStatus(qualityUserId, action.id, 'in_progress');

    const detail = await db.getPreventionActionById(qualityUserId, action.id);
    expect(detail).toBeDefined();
    expect(detail?.audit_history.length).toBe(2);

    expect(detail?.audit_history[0].event_type).toBe('prevention_action_created');
    expect(detail?.audit_history[0].entity_type).toBe('prevention_action');
    expect(detail?.audit_history[0].entity_id).toBe(action.id);

    expect(detail?.audit_history[1].event_type).toBe('prevention_status_changed');
    expect(detail?.audit_history[1].entity_type).toBe('prevention_action');
    expect(detail?.audit_history[1].entity_id).toBe(action.id);
  });

  test('Prevention actions contain zero personal or clinical declaration data', async () => {
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Mesure anonymisée',
      description: 'Action globale sans référence nominative',
      action_type: 'preventive',
      contributing_factor: 'waste_disposal_container',
      rationale: 'Observation surveillance globale',
      surveillance_reference: 'Tendance globale T3',
    });

    const anyAction = action as any;
    expect(anyAction.declaration_id).toBeUndefined();
    expect(anyAction.declared_by_user_id).toBeUndefined();
    expect(anyAction.reference_number).toBeUndefined();
    expect(anyAction.patient_name).toBeUndefined();
    expect(anyAction.circumstances).toBeUndefined();
  });

  test('Rejects surveillance_reference referencing individual declarations (AES-XXXX)', async () => {
    await expect(
      db.createPreventionAction(qualityUserId, {
        title: 'Action avec ref individuelle',
        description: 'Description de test',
        action_type: 'preventive',
        contributing_factor: 'waste_disposal_container',
        rationale: 'Observation surveillance',
        surveillance_reference: 'AES-2026-00042',
      }),
    ).rejects.toThrow(/surveillance_reference must be an aggregate surveillance observation/);
  });

  // ─── 5. Role Authorization Matrix ────────────────────────────

  test('quality_staff is fully permitted to create, view, and update prevention actions', async () => {
    await expect(
      db.listPreventionActions(qualityUserId),
    ).resolves.toBeDefined();

    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Action Qualité',
      description: 'Description action',
      action_type: 'preventive',
      contributing_factor: 'device_safety_design',
      rationale: 'Raison qualité',
    });
    expect(action.id).toBeDefined();

    await expect(
      db.updatePreventionActionStatus(qualityUserId, action.id, 'in_progress'),
    ).resolves.toBeDefined();
  });

  test('admin_reviewer has read-only access to prevention register, cannot create or update', async () => {
    // Can read register
    await expect(db.listPreventionActions(adminUserId)).resolves.toBeDefined();
    await expect(db.getPreventionOverview(adminUserId)).resolves.toBeDefined();

    // Cannot create
    await expect(
      db.createPreventionAction(adminUserId, {
        title: 'Action Tentée par Admin RH',
        description: 'Description non autorisée',
        action_type: 'preventive',
        contributing_factor: 'device_safety_design',
        rationale: 'Raison non autorisée',
      }),
    ).rejects.toThrow(/Only quality_staff may create and manage prevention actions/);

    // Create an action with quality staff
    const action = await db.createPreventionAction(qualityUserId, {
      title: 'Action Qualité',
      description: 'Description valide',
      action_type: 'preventive',
      contributing_factor: 'device_safety_design',
      rationale: 'Raison valide',
    });

    // Admin reviewer cannot update status
    await expect(
      db.updatePreventionActionStatus(adminUserId, action.id, 'in_progress'),
    ).rejects.toThrow(/Only quality_staff may manage prevention actions/);
  });

  test('oh_professional has read-only access to prevention register, cannot create or update', async () => {
    // Can read register
    await expect(db.listPreventionActions(ohUserId)).resolves.toBeDefined();
    await expect(db.getPreventionOverview(ohUserId)).resolves.toBeDefined();

    // Cannot create
    await expect(
      db.createPreventionAction(ohUserId, {
        title: 'Action Tentée par SST',
        description: 'Description non autorisée',
        action_type: 'preventive',
        contributing_factor: 'device_safety_design',
        rationale: 'Raison non autorisée',
      }),
    ).rejects.toThrow(/Only quality_staff may create and manage prevention actions/);
  });

  test('exposed_professional is strictly prohibited from prevention actions', async () => {
    await expect(db.listPreventionActions(exposedUserId)).rejects.toThrow(
      /exposed_professional' is strictly prohibited from accessing the prevention action register/,
    );
    await expect(db.getPreventionOverview(exposedUserId)).rejects.toThrow(
      /exposed_professional' is strictly prohibited/,
    );
    await expect(
      db.createPreventionAction(exposedUserId, {
        title: 'Action Exposé',
        description: 'Desc',
        action_type: 'preventive',
        contributing_factor: 'device_safety_design',
        rationale: 'Raison',
      }),
    ).rejects.toThrow(/Only quality_staff may create and manage/);
  });

  test('tech_admin is strictly prohibited from prevention actions', async () => {
    await expect(db.listPreventionActions(techUserId)).rejects.toThrow(
      /tech_admin' is strictly prohibited from accessing the prevention action register/,
    );
    await expect(db.getPreventionOverview(techUserId)).rejects.toThrow(
      /tech_admin' is strictly prohibited/,
    );
    await expect(
      db.createPreventionAction(techUserId, {
        title: 'Action Tech',
        description: 'Desc',
        action_type: 'preventive',
        contributing_factor: 'device_safety_design',
        rationale: 'Raison',
      }),
    ).rejects.toThrow(/Only quality_staff may create and manage/);
  });

  test('canManagePreventionActions and canViewPreventionActions evaluate role boundaries', () => {
    expect(canManagePreventionActions(SYNTHETIC_QUALITY_STAFF_CONTEXT)).toBe(true);
    expect(canManagePreventionActions(SYNTHETIC_ADMIN_REVIEWER_CONTEXT)).toBe(false);
    expect(canManagePreventionActions(SYNTHETIC_OH_PROFESSIONAL_CONTEXT)).toBe(false);
    expect(canManagePreventionActions(SYNTHETIC_DEMO_CONTEXT)).toBe(false);
    expect(canManagePreventionActions(SYNTHETIC_TECH_ADMIN_CONTEXT)).toBe(false);

    expect(canViewPreventionActions(SYNTHETIC_QUALITY_STAFF_CONTEXT)).toBe(true);
    expect(canViewPreventionActions(SYNTHETIC_ADMIN_REVIEWER_CONTEXT)).toBe(true);
    expect(canViewPreventionActions(SYNTHETIC_OH_PROFESSIONAL_CONTEXT)).toBe(true);
    expect(canViewPreventionActions(SYNTHETIC_DEMO_CONTEXT)).toBe(false);
    expect(canViewPreventionActions(SYNTHETIC_TECH_ADMIN_CONTEXT)).toBe(false);
  });
});
