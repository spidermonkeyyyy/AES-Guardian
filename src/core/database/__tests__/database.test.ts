/**
 * AES Guardian Database Integration Tests
 *
 * Tests the SQLite layer using @op-engineering/op-sqlite.
 * Uses the in-memory mock at __mocks__/@op-engineering/op-sqlite.js.
 *
 * Coverage:
 *   Phase 2C.1 — schema init, demo user CRUD, declaration CRUD,
 *                persistence simulation, audit events, guard
 *   Phase 2C.2 — role model correction, declaration workflow repository,
 *                status transitions, invalid input rejection
 */

import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  isValidTransition,
} from '../index';
import type { AesGuardianDatabase } from '../AesGuardianDatabase';

const originalWarn = console.warn;
beforeAll(() => { console.warn = jest.fn(); });
afterAll(() => { console.warn = originalWarn; });

afterEach(() => {
  resetDatabaseForTesting();
});

// ─────────────────────────────────────────────────────────────────────
//  1. Schema initialization
// ─────────────────────────────────────────────────────────────────────
describe('Schema initialization', () => {
  it('initializes without throwing', async () => {
    await expect(initializeDatabase()).resolves.toBeDefined();
  });

  it('applies all migrations (versions 1..8)', async () => {
    const db = await initializeDatabase();
    const versions = await db.getAppliedVersions();
    expect(versions.map(v => v.version)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('is idempotent — re-initialization does not duplicate versions', async () => {
    await initializeDatabase();
    resetDatabaseForTesting();
    const db = await initializeDatabase();
    const versions = await db.getAppliedVersions();
    expect(versions.length).toBe(8);
  });

  it('seeds synthetic demo users during migration 2', async () => {
    const db = await initializeDatabase();
    const users = await db.listDemoUsers();
    const roles = users.map(u => u.role);
    expect(roles).toContain('exposed_professional');
    expect(roles).toContain('admin_reviewer');
    expect(roles).toContain('oh_professional');
    expect(roles).toContain('quality_staff');
    expect(roles).toContain('tech_admin');
  });
});

// ─────────────────────────────────────────────────────────────────────
//  2. Role model correction — approved AES Guardian roles
// ─────────────────────────────────────────────────────────────────────
describe('Role model (Phase 2C.2)', () => {
  let db: AesGuardianDatabase;

  beforeEach(async () => {
    db = await initializeDatabase();
  });

  it('accepts exposed_professional role', async () => {
    const id = await db.insertDemoUser({
      username: 'ep.test',
      display_name: 'EP Test',
      role: 'exposed_professional',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('accepts admin_reviewer role', async () => {
    const id = await db.insertDemoUser({
      username: 'ar.test',
      display_name: 'AR Test',
      role: 'admin_reviewer',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('accepts oh_professional role', async () => {
    const id = await db.insertDemoUser({
      username: 'ohp.test',
      display_name: 'OHP Test',
      role: 'oh_professional',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('accepts quality_staff role', async () => {
    const id = await db.insertDemoUser({
      username: 'qs.test',
      display_name: 'QS Test',
      role: 'quality_staff',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('accepts tech_admin role', async () => {
    const id = await db.insertDemoUser({
      username: 'ta.test',
      display_name: 'TA Test',
      role: 'tech_admin',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('rejects old SANAD role: clinician', async () => {
    await expect(
      db.insertDemoUser({ username: 'x', display_name: 'X', role: 'clinician' as never })
    ).rejects.toThrow('invalid role');
  });

  it('rejects old SANAD role: admin', async () => {
    await expect(
      db.insertDemoUser({ username: 'y', display_name: 'Y', role: 'admin' as never })
    ).rejects.toThrow('invalid role');
  });

  it('rejects old SANAD role: lab_tech', async () => {
    await expect(
      db.insertDemoUser({ username: 'z', display_name: 'Z', role: 'lab_tech' as never })
    ).rejects.toThrow('invalid role');
  });

  it('rejects old SANAD role: pharmacist', async () => {
    await expect(
      db.insertDemoUser({ username: 'w', display_name: 'W', role: 'pharmacist' as never })
    ).rejects.toThrow('invalid role');
  });

  it('rejects an entirely unknown role', async () => {
    await expect(
      db.insertDemoUser({ username: 'bad', display_name: 'Bad', role: 'superuser' as never })
    ).rejects.toThrow('invalid role');
  });

  it('rejects invalid role on updateDemoUser', async () => {
    const id = await db.insertDemoUser({
      username: 'update.test',
      display_name: 'Update Test',
      role: 'exposed_professional',
    });
    await expect(
      db.updateDemoUser(id, { role: 'pharmacist' as never })
    ).rejects.toThrow('invalid role');
  });
});

// ─────────────────────────────────────────────────────────────────────
//  3. Demo user CRUD (using approved roles)
// ─────────────────────────────────────────────────────────────────────
describe('Demo user CRUD', () => {
  let db: AesGuardianDatabase;

  beforeEach(async () => {
    db = await initializeDatabase();
  });

  it('inserts a demo user and returns an ID', async () => {
    const id = await db.insertDemoUser({
      username: 'prof.ali',
      display_name: 'Dr. Ali Benmansour',
      role: 'exposed_professional',
    });
    expect(typeof id).toBe('number');
    expect(id).toBeGreaterThan(0);
  });

  it('reads back an inserted user', async () => {
    const id = await db.insertDemoUser({
      username: 'prof.fatima',
      display_name: 'Fatima Zahra',
      role: 'exposed_professional',
    });
    const user = await db.getDemoUser(id);
    expect(user).not.toBeNull();
    expect(user!.username).toBe('prof.fatima');
    expect(user!.display_name).toBe('Fatima Zahra');
    expect(user!.role).toBe('exposed_professional');
  });

  it('lists all demo users (includes seeded + inserted)', async () => {
    await db.insertDemoUser({ username: 'admin.sara', display_name: 'Sara Admin', role: 'admin_reviewer' });
    const users = await db.listDemoUsers();
    expect(users.length).toBeGreaterThanOrEqual(2);
  });

  it('updates a demo user display name', async () => {
    const id = await db.insertDemoUser({
      username: 'ohp.leila',
      display_name: 'Leila Old',
      role: 'oh_professional',
    });
    const result = await db.updateDemoUser(id, { display_name: 'Leila Benali' });
    expect(result.rowsAffected).toBe(1);
    const updated = await db.getDemoUser(id);
    expect(updated!.display_name).toBe('Leila Benali');
  });

  it('updates a demo user role to another approved role', async () => {
    const id = await db.insertDemoUser({
      username: 'qs.youssef',
      display_name: 'Youssef Lab',
      role: 'quality_staff',
    });
    const result = await db.updateDemoUser(id, { role: 'admin_reviewer' });
    expect(result.rowsAffected).toBe(1);
    const updated = await db.getDemoUser(id);
    expect(updated!.role).toBe('admin_reviewer');
  });

  it('deletes a demo user', async () => {
    const id = await db.insertDemoUser({
      username: 'temp.user',
      display_name: 'Temp User',
      role: 'tech_admin',
    });
    const result = await db.deleteDemoUser(id);
    expect(result.rowsAffected).toBe(1);
    const gone = await db.getDemoUser(id);
    expect(gone).toBeNull();
  });

  it('returns null for a non-existent user', async () => {
    const user = await db.getDemoUser(99999);
    expect(user).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────
//  4. Declaration workflow repository (Phase 2C.2)
// ─────────────────────────────────────────────────────────────────────
describe('Declaration workflow repository', () => {
  let db: AesGuardianDatabase;
  let userId: number;

  beforeEach(async () => {
    db = await initializeDatabase();
    userId = await db.insertDemoUser({
      username: 'ep.workflow',
      display_name: 'Workflow Test EP',
      role: 'exposed_professional',
    });
  });

  it('createDraft returns a positive ID', async () => {
    const id = await db.createDraft({
      declared_by_user_id: userId,
      incident_date: '2024-03-15',
      incident_type: 'percutaneous_exposure',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('createDraft generates a reference number', async () => {
    const id = await db.createDraft({
      declared_by_user_id: userId,
      incident_date: '2024-03-15',
      incident_type: 'percutaneous_exposure',
    });
    const decl = await db.getDeclarationById(id, userId);
    expect(decl).not.toBeNull();
    expect(decl!.reference_number).toMatch(/^AES-\d{4}-\d{6}$/);
  });

  it('createDraft sets status to draft', async () => {
    const id = await db.createDraft({
      declared_by_user_id: userId,
      incident_date: '2024-03-15',
      incident_type: 'mucocutaneous_exposure',
    });
    const decl = await db.getDeclarationById(id, userId);
    expect(decl!.status).toBe('draft');
  });

  it('updateDraft modifies an editable draft', async () => {
    const id = await db.createDraft({
      declared_by_user_id: userId,
      incident_date: '2024-03-15',
      incident_type: 'other',
      circumstances: 'Initial circumstances',
    });
    const result = await db.updateDraft(id, {
      circumstances: 'Updated circumstances',
      exposure_description: 'Blood contact on broken skin',
    });
    expect(result.rowsAffected).toBe(1);
    const updated = await db.getDeclarationById(id, userId);
    expect(updated!.circumstances).toBe('Updated circumstances');
    expect(updated!.exposure_description).toBe('Blood contact on broken skin');
  });

  it('updateDraft rejects update on a submitted declaration', async () => {
    const id = await db.createDraft({
      declared_by_user_id: userId,
      incident_date: '2024-03-15',
      incident_type: 'percutaneous_exposure',
    });
    await db.submitDeclaration(id);
    await expect(
      db.updateDraft(id, { circumstances: 'Attempt to edit' })
    ).rejects.toThrow('cannot be edited');
  });

  it('submitDeclaration transitions draft → submitted', async () => {
    const id = await db.createDraft({
      declared_by_user_id: userId,
      incident_date: '2024-04-01',
      incident_type: 'percutaneous_exposure',
    });
    const result = await db.submitDeclaration(id);
    expect(result.rowsAffected).toBe(1);
    const submitted = await db.getDeclarationById(id, userId);
    expect(submitted!.status).toBe('submitted');
    expect(submitted!.submitted_at).not.toBeNull();
  });

  it('submitDeclaration rejects re-submission of a submitted declaration', async () => {
    const id = await db.createDraft({
      declared_by_user_id: userId,
      incident_date: '2024-04-01',
      incident_type: 'percutaneous_exposure',
    });
    await db.submitDeclaration(id);
    await expect(db.submitDeclaration(id)).rejects.toThrow('cannot submit');
  });

  it('getDeclarations returns declarations for a user', async () => {
    await db.createDraft({ declared_by_user_id: userId, incident_date: '2024-01-01', incident_type: 'other' });
    await db.createDraft({ declared_by_user_id: userId, incident_date: '2024-02-01', incident_type: 'other' });
    const list = await db.getDeclarations({ userId, requestingUserId: userId });
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('getDeclarationsByStatus returns only matching declarations', async () => {
    const id1 = await db.createDraft({ declared_by_user_id: userId, incident_date: '2024-01-01', incident_type: 'other' });
    const id2 = await db.createDraft({ declared_by_user_id: userId, incident_date: '2024-02-01', incident_type: 'other' });
    await db.submitDeclaration(id2);

    const drafts = await db.getDeclarationsByStatus('draft', userId);
    const submitted = await db.getDeclarationsByStatus('submitted', userId);

    expect(drafts.map(d => d.id)).toContain(id1);
    expect(submitted.map(d => d.id)).toContain(id2);
    expect(drafts.some(d => d.id === id2)).toBe(false);
  });

  it('createDraft rejects invalid incident_type', async () => {
    await expect(
      db.createDraft({
        declared_by_user_id: userId,
        incident_date: '2024-01-01',
        incident_type: 'unknown_type' as never,
      })
    ).rejects.toThrow('invalid incident_type');
  });

  it('getDeclarationsByStatus rejects invalid status', async () => {
    await expect(
      db.getDeclarationsByStatus('invalid_status' as never, userId)
    ).rejects.toThrow('invalid status');
  });
});

// ─────────────────────────────────────────────────────────────────────
//  5. Status transition guard
// ─────────────────────────────────────────────────────────────────────
describe('Status transition guard (isValidTransition)', () => {
  it('draft → submitted is valid', () => {
    expect(isValidTransition('draft', 'submitted')).toBe(true);
  });

  it('submitted → under_review is valid', () => {
    expect(isValidTransition('submitted', 'under_review')).toBe(true);
  });

  it('draft → draft is invalid', () => {
    expect(isValidTransition('draft', 'draft')).toBe(false);
  });

  it('draft → closed is invalid', () => {
    expect(isValidTransition('draft', 'closed')).toBe(false);
  });

  it('submitted → draft is invalid', () => {
    expect(isValidTransition('submitted', 'draft')).toBe(false);
  });

  it('closed → any is invalid', () => {
    expect(isValidTransition('closed', 'submitted')).toBe(false);
    expect(isValidTransition('closed', 'draft')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
//  6. Persistence simulation
// ─────────────────────────────────────────────────────────────────────
describe('Persistence simulation', () => {
  it('data persists across close and re-open', async () => {
    let db = await initializeDatabase();
    const userId = await db.insertDemoUser({
      username: 'persist.ep',
      display_name: 'Persistence EP',
      role: 'exposed_professional',
    });
    const declId = await db.createDraft({
      declared_by_user_id: userId,
      incident_date: '2024-06-01',
      incident_type: 'percutaneous_exposure',
      circumstances: 'Persistence check',
    });
    await db.submitDeclaration(declId);

    // Simulate restart
    resetDatabaseForTesting();
    db = await initializeDatabase();

    const user = await db.getDemoUser(userId);
    expect(user).not.toBeNull();
    expect(user!.username).toBe('persist.ep');

    const decl = await db.getDeclarationById(declId, userId);
    expect(decl).not.toBeNull();
    expect(decl!.status).toBe('submitted');
    expect(decl!.submitted_at).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────
//  7. Audit event logging
// ─────────────────────────────────────────────────────────────────────
describe('Audit event logging', () => {
  it('logs a DECLARATION_DRAFT_CREATED event and retrieves it', async () => {
    const db = await initializeDatabase();
    const id = await db.logAuditEvent({
      event_type: 'DECLARATION_DRAFT_CREATED',
      user_id: 1,
      entity_type: 'aes_declaration',
      entity_id: 42,
      description: 'Draft declaration created by synthetic demo user (not real patient data)',
    });
    expect(id).toBeGreaterThan(0);
    const events = await db.listAuditEvents(10);
    const found = events.find(e => e.id === id);
    expect(found).toBeDefined();
    expect(found!.event_type).toBe('DECLARATION_DRAFT_CREATED');
    // Confirm description does not contain complete form data (not assertion of correctness,
    // just a check that we followed the guideline)
    expect(found!.description).not.toContain('{"id":');
  });

  it('logs a DECLARATION_SUBMITTED event', async () => {
    const db = await initializeDatabase();
    const id = await db.logAuditEvent({
      event_type: 'DECLARATION_SUBMITTED',
      user_id: null, // null until authentication implemented
      entity_type: 'aes_declaration',
      entity_id: 1,
      description: 'Declaration submitted — actor: synthetic demo context (not authenticated)',
    });
    expect(id).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
//  8. Phase 2C.3: Administrative Review Repository
// ─────────────────────────────────────────────────────────────────────
describe('Phase 2C.3: Administrative Review Repository', () => {
  let db: AesGuardianDatabase;
  let declaringUserId: number;
  let adminReviewerId: number;
  let otherUserId: number;

  beforeEach(async () => {
    db = await initializeDatabase();
    // Use seeded demo users
    const users = await db.listDemoUsers();
    const ep = users.find(u => u.role === 'exposed_professional');
    const ar = users.find(u => u.role === 'admin_reviewer');
    const ohp = users.find(u => u.role === 'oh_professional');

    declaringUserId = ep!.id;
    adminReviewerId = ar!.id;
    otherUserId = ohp!.id;
  });

  describe('getReviewQueue', () => {
    it('returns submitted and under_review declarations, excludes draft', async () => {
      // Create draft
      const draftId = await db.createDraft({
        declared_by_user_id: declaringUserId,
        incident_date: '2024-05-10',
        incident_type: 'percutaneous_exposure',
      });

      // Create submitted
      const submittedId = await db.createDraft({
        declared_by_user_id: declaringUserId,
        incident_date: '2024-05-11',
        incident_type: 'mucocutaneous_exposure',
      });
      await db.submitDeclaration(submittedId);

      const queue = await db.getReviewQueue({ requestingUserId: adminReviewerId });
      const ids = queue.map(d => d.id);
      expect(ids).toContain(submittedId);
      expect(ids).not.toContain(draftId);
    });

    it('respects limit parameter', async () => {
      const q1 = await db.createDraft({
        declared_by_user_id: declaringUserId,
        incident_date: '2024-05-10',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(q1);

      const q2 = await db.createDraft({
        declared_by_user_id: declaringUserId,
        incident_date: '2024-05-11',
        incident_type: 'other',
      });
      await db.submitDeclaration(q2);

      const queue = await db.getReviewQueue({ limit: 1, requestingUserId: adminReviewerId });
      expect(queue.length).toBe(1);
    });
  });

  describe('createAdministrativeReview', () => {
    let submittedDeclId: number;

    beforeEach(async () => {
      submittedDeclId = await db.createDraft({
        declared_by_user_id: declaringUserId,
        incident_date: '2024-05-12',
        incident_type: 'percutaneous_exposure',
        exposure_description: 'Needlestick in phlebotomy',
        circumstances: 'Recapping attempt',
      });
      await db.submitDeclaration(submittedDeclId);
    });

    it('records acknowledged review and transitions status to under_review', async () => {
      const result = await db.createAdministrativeReview({
        declaration_id: submittedDeclId,
        reviewer_user_id: adminReviewerId,
        outcome: 'acknowledged',
        comments: 'Declaration administrativement reçue et complète.',
      });

      expect(result.reviewId).toBeGreaterThan(0);
      expect(result.declarationStatus).toBe('under_review');

      const decl = await db.getDeclarationById(submittedDeclId, adminReviewerId);
      expect(decl!.status).toBe('under_review');
      // Original data must remain strictly intact
      expect(decl!.incident_type).toBe('percutaneous_exposure');
      expect(decl!.exposure_description).toBe('Needlestick in phlebotomy');
      expect(decl!.circumstances).toBe('Recapping attempt');
    });

    it('records transmission_verified review', async () => {
      const result = await db.createAdministrativeReview({
        declaration_id: submittedDeclId,
        reviewer_user_id: adminReviewerId,
        outcome: 'transmission_verified',
        comments: 'Transmission hiérarchique et médecine du travail validée.',
      });

      expect(result.reviewId).toBeGreaterThan(0);
      const history = await db.getDeclarationReviewHistory(submittedDeclId, adminReviewerId);
      expect(history.length).toBe(1);
      expect(history[0].outcome).toBe('transmission_verified');
    });

    it('records correction_requested when structured reason is provided', async () => {
      const result = await db.createAdministrativeReview({
        declaration_id: submittedDeclId,
        reviewer_user_id: adminReviewerId,
        outcome: 'correction_requested',
        correction_reason: 'Préciser la localisation anatomique exacte et le service d origine.',
        comments: 'Demande de complément transmise au déclarant.',
      });

      expect(result.reviewId).toBeGreaterThan(0);
      expect(result.declarationStatus).toBe('correction_requested');

      const decl = await db.getDeclarationById(submittedDeclId, adminReviewerId);
      expect(decl!.status).toBe('correction_requested');

      const history = await db.getDeclarationReviewHistory(submittedDeclId, adminReviewerId);
      expect(history[0].outcome).toBe('correction_requested');
      expect(history[0].correction_reason).toContain('Préciser la localisation');
    });

    it('rejects correction_requested if correction_reason is empty or missing', async () => {
      await expect(
        db.createAdministrativeReview({
          declaration_id: submittedDeclId,
          reviewer_user_id: adminReviewerId,
          outcome: 'correction_requested',
          correction_reason: '',
        }),
      ).rejects.toThrow('correction_reason is required');

      await expect(
        db.createAdministrativeReview({
          declaration_id: submittedDeclId,
          reviewer_user_id: adminReviewerId,
          outcome: 'correction_requested',
        }),
      ).rejects.toThrow('correction_reason is required');
    });

    it('rejects review by non-admin_reviewer role (e.g. oh_professional)', async () => {
      await expect(
        db.createAdministrativeReview({
          declaration_id: submittedDeclId,
          reviewer_user_id: otherUserId, // oh_professional
          outcome: 'acknowledged',
        }),
      ).rejects.toThrow('Only "admin_reviewer" may record administrative reviews');
    });

    it('rejects review on a draft declaration', async () => {
      const draftId = await db.createDraft({
        declared_by_user_id: declaringUserId,
        incident_date: '2024-05-13',
        incident_type: 'mucocutaneous_exposure',
      });

      await expect(
        db.createAdministrativeReview({
          declaration_id: draftId,
          reviewer_user_id: adminReviewerId,
          outcome: 'acknowledged',
        }),
      ).rejects.toThrow('Reviews can only be performed on "submitted", "under_review", or "resubmitted" declarations');
    });

    it('rejects invalid review outcome', async () => {
      await expect(
        db.createAdministrativeReview({
          declaration_id: submittedDeclId,
          reviewer_user_id: adminReviewerId,
          outcome: 'invalid_status' as never,
        }),
      ).rejects.toThrow('invalid outcome');
    });

    it('rejects non-existent declaration', async () => {
      await expect(
        db.createAdministrativeReview({
          declaration_id: 999999,
          reviewer_user_id: adminReviewerId,
          outcome: 'acknowledged',
        }),
      ).rejects.toThrow('not found');
    });
  });

  describe('getDeclarationReviewHistory', () => {
    it('returns review items ordered by reviewed_at DESC', async () => {
      const declId = await db.createDraft({
        declared_by_user_id: declaringUserId,
        incident_date: '2024-05-14',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);

      await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminReviewerId,
        outcome: 'acknowledged',
        comments: 'Première revue',
      });

      await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminReviewerId,
        outcome: 'correction_requested',
        correction_reason: 'Manque l heure exacte',
      });

      const history = await db.getDeclarationReviewHistory(declId, adminReviewerId);
      expect(history.length).toBe(2);
      expect(history[0].outcome).toBe('correction_requested');
      expect(history[1].outcome).toBe('acknowledged');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
//  9. Phase 2C.3.1: Correction Response Workflow
// ─────────────────────────────────────────────────────────────────────
describe('Phase 2C.3.1 — Correction Response Workflow', () => {
  let db: AesGuardianDatabase;
  let declarerId: number;
  let adminId: number;
  let otherUserId: number;
  let declId: number;
  let reviewId: number;

  beforeEach(async () => {
    db = await initializeDatabase();

    declarerId = await db.insertDemoUser({
      username: 'decl.test',
      display_name: 'Declarant Test',
      role: 'exposed_professional',
    });

    adminId = await db.insertDemoUser({
      username: 'admin.rev.test',
      display_name: 'Admin Test',
      role: 'admin_reviewer',
    });

    otherUserId = await db.insertDemoUser({
      username: 'other.test',
      display_name: 'Other User Test',
      role: 'exposed_professional',
    });

    // Create and submit a declaration
    declId = await db.createDraft({
      declared_by_user_id: declarerId,
      incident_date: '2024-06-01',
      incident_type: 'percutaneous_exposure',
      exposure_description: 'Needlestick during disposal',
      circumstances: 'Safety shield failure',
    });
    await db.submitDeclaration(declId);

    // Record a correction_requested review
    const reviewRes = await db.createAdministrativeReview({
      declaration_id: declId,
      reviewer_user_id: adminId,
      outcome: 'correction_requested',
      correction_reason: 'Préciser le type de matériel à l origine de la piqûre.',
      comments: 'Détails manquants pour évaluation.',
    });
    reviewId = reviewRes.reviewId;
  });

  it('rejects response if user does not own the declaration', async () => {
    await expect(
      db.createCorrectionResponse({
        declaration_id: declId,
        review_id: reviewId,
        user_id: otherUserId, // Different user
        response_text: 'Aiguille creuse à prélèvement 21G.',
      }),
    ).rejects.toThrow('does NOT own declaration');
  });

  it('rejects response if user role is not exposed_professional', async () => {
    await expect(
      db.createCorrectionResponse({
        declaration_id: declId,
        review_id: reviewId,
        user_id: adminId, // admin_reviewer
        response_text: 'Aiguille creuse.',
      }),
    ).rejects.toThrow('Only "exposed_professional" who owns the declaration may respond');
  });

  it('rejects response if declaration status is not correction_requested', async () => {
    // Create a new declaration in submitted state
    const submittedId = await db.createDraft({
      declared_by_user_id: declarerId,
      incident_date: '2024-06-02',
      incident_type: 'mucocutaneous_exposure',
    });
    await db.submitDeclaration(submittedId);

    await expect(
      db.createCorrectionResponse({
        declaration_id: submittedId,
        review_id: reviewId,
        user_id: declarerId,
        response_text: 'Clarification',
      }),
    ).rejects.toThrow('status is "correction_requested"');
  });

  it('rejects response if text is empty or whitespace only', async () => {
    await expect(
      db.createCorrectionResponse({
        declaration_id: declId,
        review_id: reviewId,
        user_id: declarerId,
        response_text: '   ',
      }),
    ).rejects.toThrow('response_text is required');
  });

  it('successfully creates correction response and transitions status to resubmitted', async () => {
    const result = await db.createCorrectionResponse({
      declaration_id: declId,
      review_id: reviewId,
      user_id: declarerId,
      response_text: 'Il s agissait d une aiguille vacutainer de prélèvement 21G.',
    });

    expect(result.responseId).toBeGreaterThan(0);
    expect(result.declarationStatus).toBe('resubmitted');

    // Verify declaration state
    const decl = await db.getDeclarationById(declId, declarerId);
    expect(decl!.status).toBe('resubmitted');
    // Original narrative strictly preserved and untouched
    expect(decl!.exposure_description).toBe('Needlestick during disposal');
    expect(decl!.circumstances).toBe('Safety shield failure');

    // Verify stored response
    const responses = await db.getCorrectionResponses(declId, declarerId);
    expect(responses.length).toBe(1);
    expect(responses[0].response_text).toContain('aiguille vacutainer');
    expect(responses[0].review_id).toBe(reviewId);
    expect(responses[0].responding_user_id).toBe(declarerId);
  });

  it('rejects duplicate response to the same review', async () => {
    await db.createCorrectionResponse({
      declaration_id: declId,
      review_id: reviewId,
      user_id: declarerId,
      response_text: 'Première réponse.',
    });

    await expect(
      db.createCorrectionResponse({
        declaration_id: declId,
        review_id: reviewId,
        user_id: declarerId,
        response_text: 'Deuxième réponse.',
      }),
    ).rejects.toThrow();
  });

  it('getLatestPendingCorrectionRequest finds pending request for owner', async () => {
    const pending = await db.getLatestPendingCorrectionRequest(declId, declarerId);
    expect(pending).not.toBeNull();
    expect(pending!.id).toBe(reviewId);
    expect(pending!.outcome).toBe('correction_requested');
  });

  it('getLatestPendingCorrectionRequest rejects non-owner', async () => {
    await expect(
      db.getLatestPendingCorrectionRequest(declId, otherUserId),
    ).rejects.toThrow('Unauthorized');
  });

  it('getLatestPendingCorrectionRequest returns null once response is recorded', async () => {
    await db.createCorrectionResponse({
      declaration_id: declId,
      review_id: reviewId,
      user_id: declarerId,
      response_text: 'Réponse complétée.',
    });

    const pending = await db.getLatestPendingCorrectionRequest(declId, declarerId);
    expect(pending).toBeNull();
  });

  it('getDeclarationReviewHistory joins correction response to review', async () => {
    await db.createCorrectionResponse({
      declaration_id: declId,
      review_id: reviewId,
      user_id: declarerId,
      response_text: 'Réponse avec détails du matériel.',
    });

    const history = await db.getDeclarationReviewHistory(declId, declarerId);
    expect(history.length).toBe(1);
    expect(history[0].response).toBeDefined();
    expect(history[0].response!.response_text).toContain('détails du matériel');
  });

  it('allows administrative re-review on a resubmitted declaration', async () => {
    // 1. Declarant responds
    await db.createCorrectionResponse({
      declaration_id: declId,
      review_id: reviewId,
      user_id: declarerId,
      response_text: 'Explications fournies.',
    });

    // 2. Admin re-reviews
    const reReviewRes = await db.createAdministrativeReview({
      declaration_id: declId,
      reviewer_user_id: adminId,
      outcome: 'acknowledged',
      comments: 'Compléments reçus et validés.',
    });

    expect(reReviewRes.reviewId).toBeGreaterThan(0);
    expect(reReviewRes.declarationStatus).toBe('under_review');

    const decl = await db.getDeclarationById(declId, adminId);
    expect(decl!.status).toBe('under_review');

    const history = await db.getDeclarationReviewHistory(declId, adminId);
    expect(history.length).toBe(2);
    expect(history[0].outcome).toBe('acknowledged');
  });

  it('validates status transitions with isValidTransition', () => {
    expect(isValidTransition('correction_requested', 'resubmitted')).toBe(true);
    expect(isValidTransition('resubmitted', 'under_review')).toBe(true);
    expect(isValidTransition('resubmitted', 'correction_requested')).toBe(true);
    expect(isValidTransition('draft', 'correction_requested')).toBe(false);
    expect(isValidTransition('resubmitted', 'closed')).toBe(false);
  });

  describe('Phase 2C.3.2 Integrity — Repeated Cycles, Authorization Matrix, and History', () => {
    let techAdminId: number;
    let ohProfId: number;
    let qualityStaffId: number;

    beforeEach(async () => {
      techAdminId = await db.insertDemoUser({
        username: 'tech.admin.integrity',
        display_name: 'Tech Admin',
        role: 'tech_admin',
      });
      ohProfId = await db.insertDemoUser({
        username: 'oh.prof.integrity',
        display_name: 'OH Prof',
        role: 'oh_professional',
      });
      qualityStaffId = await db.insertDemoUser({
        username: 'quality.staff.integrity',
        display_name: 'Quality Staff',
        role: 'quality_staff',
      });
    });

    it('rejects response against another declaration correction request', async () => {
      const decl2Id = await db.createDraft({
        declared_by_user_id: declarerId,
        incident_date: '2024-06-03',
        incident_type: 'mucocutaneous_exposure',
      });
      await db.submitDeclaration(decl2Id);
      const review2 = await db.createAdministrativeReview({
        declaration_id: decl2Id,
        reviewer_user_id: adminId,
        outcome: 'correction_requested',
        correction_reason: 'Specify PPE',
      });

      // Try to submit review2 against declId
      await expect(
        db.createCorrectionResponse({
          declaration_id: declId,
          review_id: review2.reviewId,
          user_id: declarerId,
          response_text: 'Wrong association',
        }),
      ).rejects.toThrow('belongs to declaration');
    });

    it('executes repeated correction cycles and links distinct reviews/responses correctly', async () => {
      // Cycle 1: correction_requested -> resubmitted -> under_review
      const resp1 = await db.createCorrectionResponse({
        declaration_id: declId,
        review_id: reviewId,
        user_id: declarerId,
        response_text: 'Response 1 details.',
      });
      expect(resp1.declarationStatus).toBe('resubmitted');

      const review2 = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminId,
        outcome: 'acknowledged',
        comments: 'Acknowledged review 1',
      });
      expect(review2.declarationStatus).toBe('under_review');

      // Cycle 2: under_review -> correction_requested -> resubmitted -> under_review
      const review3 = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminId,
        outcome: 'correction_requested',
        correction_reason: 'Additional follow-up question',
      });
      expect(review3.declarationStatus).toBe('correction_requested');
      expect(review3.reviewId).not.toBe(reviewId);

      // Verify that reviewId 1 cannot receive another response (already responded)
      await expect(
        db.createCorrectionResponse({
          declaration_id: declId,
          review_id: reviewId,
          user_id: declarerId,
          response_text: 'Late response to old review',
        }),
      ).rejects.toThrow('already has a response');

      // Declarant responds to review 3
      const resp2 = await db.createCorrectionResponse({
        declaration_id: declId,
        review_id: review3.reviewId,
        user_id: declarerId,
        response_text: 'Response 2 details.',
      });
      expect(resp2.declarationStatus).toBe('resubmitted');
      expect(resp2.responseId).not.toBe(resp1.responseId);

      // Admin re-reviews review 3 response
      const review4 = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: adminId,
        outcome: 'transmission_verified',
        comments: 'Final verification complete',
      });
      expect(review4.declarationStatus).toBe('under_review');

      // Verify deterministic chronological timeline (DESC)
      const historyDesc = await db.getDeclarationReviewHistory(declId, { order: 'DESC', requestingUserId: adminId });
      expect(historyDesc.length).toBe(4);
      expect(historyDesc[0].id).toBe(review4.reviewId);
      expect(historyDesc[1].id).toBe(review3.reviewId);
      expect(historyDesc[1].response?.id).toBe(resp2.responseId);
      expect(historyDesc[1].response?.response_text).toBe('Response 2 details.');
      expect(historyDesc[2].id).toBe(review2.reviewId);
      expect(historyDesc[2].response).toBeNull();
      expect(historyDesc[3].id).toBe(reviewId);
      expect(historyDesc[3].response?.id).toBe(resp1.responseId);
      expect(historyDesc[3].response?.response_text).toBe('Response 1 details.');

      // Also verify ASC chronological order
      const historyAsc = await db.getDeclarationReviewHistory(declId, { order: 'ASC', requestingUserId: adminId });
      expect(historyAsc.length).toBe(4);
      expect(historyAsc[0].id).toBe(reviewId);
      expect(historyAsc[3].id).toBe(review4.reviewId);
    });

    it('enforces authorization matrix across all five roles for correction-related operations', async () => {
      // 1. exposed_professional: CAN respond to their own declaration (verified in lifecycle test)

      // 2. admin_reviewer: CANNOT write correction responses
      await expect(
        db.createCorrectionResponse({
          declaration_id: declId,
          review_id: reviewId,
          user_id: adminId,
          response_text: 'Admin response',
        }),
      ).rejects.toThrow('Only "exposed_professional"');

      // 3. oh_professional: CANNOT write correction responses
      await expect(
        db.createCorrectionResponse({
          declaration_id: declId,
          review_id: reviewId,
          user_id: ohProfId,
          response_text: 'OH response',
        }),
      ).rejects.toThrow('Only "exposed_professional"');

      // 4. quality_staff: CANNOT write correction responses
      await expect(
        db.createCorrectionResponse({
          declaration_id: declId,
          review_id: reviewId,
          user_id: qualityStaffId,
          response_text: 'QS response',
        }),
      ).rejects.toThrow('Only "exposed_professional"');

      // 5. tech_admin: CANNOT write correction responses
      await expect(
        db.createCorrectionResponse({
          declaration_id: declId,
          review_id: reviewId,
          user_id: techAdminId,
          response_text: 'Tech Admin response',
        }),
      ).rejects.toThrow('Only "exposed_professional"');

      // tech_admin CANNOT write administrative reviews
      await expect(
        db.createAdministrativeReview({
          declaration_id: declId,
          reviewer_user_id: techAdminId,
          outcome: 'correction_requested',
          correction_reason: 'Tech admin review',
        }),
      ).rejects.toThrow('Only "admin_reviewer"');

      // tech_admin CANNOT read clinical declaration content
      await expect(
        db.getDeclarationById(declId, techAdminId),
      ).rejects.toThrow('strictly prohibited');

      // tech_admin CANNOT read correction responses
      await expect(
        db.getCorrectionResponses(declId, techAdminId),
      ).rejects.toThrow('strictly prohibited');

      // tech_admin CANNOT read review history
      await expect(
        db.getDeclarationReviewHistory(declId, techAdminId),
      ).rejects.toThrow('strictly prohibited');

      // Non-tech-admin users CAN read content
      const decl = await db.getDeclarationById(declId, adminId);
      expect(decl).not.toBeNull();
      const history = await db.getDeclarationReviewHistory(declId, adminId);
      expect(history.length).toBeGreaterThan(0);
    });

    it('rejects invalid state transitions at domain layer', () => {
      expect(isValidTransition('draft', 'closed')).toBe(false);
      expect(isValidTransition('draft', 'under_review')).toBe(false);
      expect(isValidTransition('submitted', 'closed')).toBe(false);
      expect(isValidTransition('submitted', 'resubmitted')).toBe(false);
      expect(isValidTransition('closed', 'draft')).toBe(false);
      expect(isValidTransition('closed', 'under_review')).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
//  10. getDatabase() guard
// ─────────────────────────────────────────────────────────────────────
describe('getDatabase() guard', () => {
  it('throws if database has not been initialized', () => {
    expect(() => getDatabase()).toThrow('database has not been initialized');
  });
});
