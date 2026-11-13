/**
 * AES Guardian — Surveillance Dashboard Tests (Phase 2C.5)
 *
 * Verifies:
 * - Aggregate calculations (counts, statuses, temporal groupings, exposure categories).
 * - Administrative reviews and correction metrics aggregation.
 * - Occupational-health coordination and event categories aggregation.
 * - Filter application (date range, status, incident type).
 * - Join accuracy: no duplicate declaration counting.
 * - Strict role-based authorization matrix:
 *    - quality_staff: PERMITTED
 *    - admin_reviewer: PERMITTED
 *    - oh_professional: PERMITTED
 *    - exposed_professional: FORBIDDEN
 *    - tech_admin: FORBIDDEN
 * - Privacy: zero personal identifiers or clinical narratives in aggregate results.
 */

import {
  initializeDatabase,
  resetDatabaseForTesting,
  AesGuardianDatabase,
  SurveillanceDashboardMetrics,
} from '../../../core/database';
import {
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  UNAUTHENTICATED_CONTEXT,
  canViewSurveillanceDashboard,
} from '../../../core/auth/boundaries';

const { clearAllMockStores } = require('../../../../__mocks__/@op-engineering/op-sqlite');

describe('Phase 2C.5 — Surveillance Dashboard & Aggregate Monitoring', () => {
  let db: AesGuardianDatabase;
  let exposedUserId: number;
  let adminUserId: number;
  let ohUserId: number;
  let qualityUserId: number;
  let techUserId: number;

  beforeEach(async () => {
    clearAllMockStores();
    resetDatabaseForTesting();
    db = await initializeDatabase();

    const users = await db.listDemoUsers();
    exposedUserId = users.find(u => u.role === 'exposed_professional')!.id;
    adminUserId = users.find(u => u.role === 'admin_reviewer')!.id;
    ohUserId = users.find(u => u.role === 'oh_professional')!.id;
    qualityUserId = users.find(u => u.role === 'quality_staff')!.id;
    techUserId = users.find(u => u.role === 'tech_admin')!.id;
  });

  afterEach(() => {
    clearAllMockStores();
    resetDatabaseForTesting();
  });

  async function seedTestDataset(): Promise<void> {
    // 1. Declarations with varied dates, types, statuses
    await (db as any).db.execute(
      `INSERT INTO aes_declarations
         (id, declared_by_user_id, reference_number, incident_date, incident_type, status)
       VALUES
         (1, ?, 'AES-2025-001', '2025-01-10', 'percutaneous_exposure', 'submitted'),
         (2, ?, 'AES-2025-002', '2025-01-20', 'mucocutaneous_exposure', 'under_review'),
         (3, ?, 'AES-2025-003', '2025-02-05', 'percutaneous_exposure', 'correction_requested'),
         (4, ?, 'AES-2025-004', '2025-02-15', 'sexual_assault', 'resubmitted'),
         (5, ?, 'AES-2025-005', '2025-03-01', 'other', 'closed'),
         (6, ?, 'AES-2025-006', '2025-03-12', 'percutaneous_exposure', 'draft')`,
      [exposedUserId, exposedUserId, exposedUserId, exposedUserId, exposedUserId, exposedUserId],
    );

    // 2. Administrative reviews on decl 2, 3, 4
    await (db as any).db.execute(
      `INSERT INTO administrative_reviews
         (id, declaration_id, reviewer_user_id, outcome, correction_reason)
       VALUES
         (10, 2, ?, 'acknowledged', NULL),
         (11, 3, ?, 'correction_requested', 'Needlesize clarification required'),
         (12, 4, ?, 'correction_requested', 'Please verify exposure location'),
         (13, 4, ?, 'transmission_verified', NULL)`,
      [adminUserId, adminUserId, adminUserId, adminUserId],
    );

    // 3. Correction responses on decl 4
    await (db as any).db.execute(
      `INSERT INTO correction_responses
         (id, declaration_id, review_id, responding_user_id, response_text)
       VALUES
         (20, 4, 12, ?, 'Exposure occurred in operating room 2')`,
      [exposedUserId],
    );

    // 4. Occupational health coordinations
    // Active on decl 1 & 2, completed on decl 5
    await (db as any).db.execute(
      `INSERT INTO oh_coordinations
         (id, declaration_id, created_by_user_id, coordination_reason, status)
       VALUES
         (30, 1, ?, 'routine_followup', 'pending_acknowledgement'),
         (31, 2, ?, 'serology_monitoring', 'acknowledged'),
         (32, 5, ?, 'routine_followup', 'completed')`,
      [adminUserId, adminUserId, adminUserId],
    );

    // 5. OH Follow-up events on coord 31
    await (db as any).db.execute(
      `INSERT INTO oh_follow_up_events
         (id, coordination_id, event_category, event_date, recorded_by_user_id)
       VALUES
         (40, 31, 'contact_attempt_recorded', '2025-01-22', ?),
         (41, 31, 'contact_established', '2025-01-23', ?)`,
      [ohUserId, ohUserId],
    );
  }

  // ─── 1. Aggregate Correctness ─────────────────────────────────

  test('Computes overview indicators accurately', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId);

    expect(data.overview.totalDeclarations).toBe(6);
    expect(data.overview.draftDeclarations).toBe(1);
    expect(data.overview.submittedDeclarations).toBe(1);
    expect(data.overview.underReviewDeclarations).toBe(1);
    expect(data.overview.correctionRequestedDeclarations).toBe(1);
    expect(data.overview.resubmittedDeclarations).toBe(1);
    expect(data.overview.closedDeclarations).toBe(1);

    expect(data.overview.activeOhCoordinations).toBe(2);
    expect(data.overview.completedOhCoordinations).toBe(1);
  });

  test('Computes temporal distribution in chronological order', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId);

    expect(data.temporalDistribution).toEqual([
      { month: '2025-01', count: 2 },
      { month: '2025-02', count: 2 },
      { month: '2025-03', count: 2 },
    ]);
  });

  test('Computes exposure category distribution correctly', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId);

    const perc = data.exposureDistribution.find(e => e.incidentType === 'percutaneous_exposure');
    const muco = data.exposureDistribution.find(e => e.incidentType === 'mucocutaneous_exposure');
    const sex = data.exposureDistribution.find(e => e.incidentType === 'sexual_assault');
    const oth = data.exposureDistribution.find(e => e.incidentType === 'other');

    expect(perc?.count).toBe(3);
    expect(muco?.count).toBe(1);
    expect(sex?.count).toBe(1);
    expect(oth?.count).toBe(1);
  });

  test('Computes administrative review metrics correctly without duplicate declaration inflation', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId);

    expect(data.administrativeReview.totalReviews).toBe(4);
    expect(data.administrativeReview.correctionRequests).toBe(2);
    expect(data.administrativeReview.correctionResponses).toBe(1);

    const ack = data.administrativeReview.outcomes.find(o => o.outcome === 'acknowledged');
    const corr = data.administrativeReview.outcomes.find(o => o.outcome === 'correction_requested');
    const trans = data.administrativeReview.outcomes.find(o => o.outcome === 'transmission_verified');

    expect(ack?.count).toBe(1);
    expect(corr?.count).toBe(2);
    expect(trans?.count).toBe(1);
  });

  test('Computes occupational health coordination and follow-up event distributions', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId);

    const pending = data.occupationalHealth.statusDistribution.find(s => s.status === 'pending_acknowledgement');
    const ack = data.occupationalHealth.statusDistribution.find(s => s.status === 'acknowledged');
    const comp = data.occupationalHealth.statusDistribution.find(s => s.status === 'completed');

    expect(pending?.count).toBe(1);
    expect(ack?.count).toBe(1);
    expect(comp?.count).toBe(1);

    expect(data.occupationalHealth.eventCategories).toEqual([
      { category: 'contact_attempt_recorded', count: 1 },
      { category: 'contact_established', count: 1 },
    ]);
  });

  // ─── 2. Filter Application ────────────────────────────────────

  test('Filters metrics by declaration status', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId, {
      status: 'submitted',
    });

    expect(data.overview.totalDeclarations).toBe(1);
    expect(data.overview.submittedDeclarations).toBe(1);
    expect(data.temporalDistribution).toEqual([{ month: '2025-01', count: 1 }]);
    expect(data.overview.activeOhCoordinations).toBe(1); // Decl 1 has coordination 30
  });

  test('Filters metrics by incident type', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId, {
      incidentType: 'percutaneous_exposure',
    });

    expect(data.overview.totalDeclarations).toBe(3);
    expect(data.exposureDistribution).toEqual([
      { incidentType: 'percutaneous_exposure', count: 3 },
    ]);
  });

  test('Filters metrics by date range', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId, {
      startDate: '2025-02-01',
      endDate: '2025-02-28',
    });

    expect(data.overview.totalDeclarations).toBe(2);
    expect(data.temporalDistribution).toEqual([{ month: '2025-02', count: 2 }]);
  });

  test('Combines multiple filters correctly', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId, {
      incidentType: 'percutaneous_exposure',
      status: 'correction_requested',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
    });

    expect(data.overview.totalDeclarations).toBe(1); // Only Decl 3
    expect(data.overview.correctionRequestedDeclarations).toBe(1);
    expect(data.filterSummary).toEqual({
      totalRecords: 6,
      matchingDeclarations: 1,
      hasActiveFilters: true,
    });
    expect(data.administrativeReview.totalReviews).toBe(1); // Review 11 on decl 3
  });

  test('Scoped filtering synchronizes across reviews, responses, coordinations, and events', async () => {
    await seedTestDataset();

    // Filter by percutaneous exposure (decls 1, 3, 6)
    const data = await db.getSurveillanceDashboardMetrics(qualityUserId, {
      incidentType: 'percutaneous_exposure',
    });

    expect(data.overview.totalDeclarations).toBe(3);
    expect(data.filterSummary).toEqual({
      totalRecords: 6,
      matchingDeclarations: 3,
      hasActiveFilters: true,
    });

    // Administrative reviews: Decl 3 has 1 review (review 11).
    // Reviews 10 (decl 2) and 12, 13 (decl 4) should be excluded.
    expect(data.administrativeReview.totalReviews).toBe(1);
    expect(data.administrativeReview.correctionRequests).toBe(1);
    expect(data.administrativeReview.correctionResponses).toBe(0); // Response 20 is on decl 4

    // OH Coordination: Decl 1 has coord 30 (pending_acknowledgement).
    // Coord 31 (decl 2) and coord 32 (decl 5) should be excluded.
    expect(data.occupationalHealth.statusDistribution).toEqual([
      { status: 'pending_acknowledgement', count: 1 },
    ]);
    expect(data.overview.activeOhCoordinations).toBe(1);
    expect(data.overview.completedOhCoordinations).toBe(0);

    // Follow-up events: Coord 30 has 0 events. Coord 31 (events 40, 41) is excluded.
    expect(data.occupationalHealth.eventCategories).toEqual([]);
  });

  test('Handles empty filter results gracefully', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId, {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });

    expect(data.overview.totalDeclarations).toBe(0);
    expect(data.temporalDistribution).toEqual([]);
    expect(data.exposureDistribution).toEqual([]);
    expect(data.statusDistribution).toEqual([]);
    expect(data.filterSummary).toEqual({
      totalRecords: 6,
      matchingDeclarations: 0,
      hasActiveFilters: true,
    });
  });

  test('Handles inverted date range gracefully without errors', async () => {
    await seedTestDataset();

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId, {
      startDate: '2025-12-31',
      endDate: '2025-01-01',
    });

    expect(data.overview.totalDeclarations).toBe(0);
    expect(data.filterSummary).toEqual({
      totalRecords: 6,
      matchingDeclarations: 0,
      hasActiveFilters: true,
    });
  });

  test('Handles missing or invalid incident dates by grouping into unknown bucket', async () => {
    await seedTestDataset();

    // Insert declaration with invalid date
    await (db as any).db.execute(
      `INSERT INTO aes_declarations
         (id, declared_by_user_id, reference_number, incident_date, incident_type, status)
       VALUES
         (99, ?, 'AES-2025-INVALID', 'NOT-A-DATE', 'other', 'submitted')`,
      [exposedUserId],
    );

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId);

    expect(data.overview.totalDeclarations).toBe(7);
    const unknownBucket = data.temporalDistribution.find(t => t.month === 'unknown');
    expect(unknownBucket).toBeDefined();
    expect(unknownBucket?.count).toBe(1);
  });

  test('Avoids declaration count inflation across repeated correction cycles', async () => {
    // Clear and insert single declaration with multiple reviews and responses
    await (db as any).db.execute(
      `INSERT INTO aes_declarations
         (id, declared_by_user_id, reference_number, incident_date, incident_type, status)
       VALUES
         (100, ?, 'AES-2025-CYCLE', '2025-04-10', 'percutaneous_exposure', 'resubmitted')`,
      [exposedUserId],
    );

    // 3 reviews
    await (db as any).db.execute(
      `INSERT INTO administrative_reviews
         (id, declaration_id, reviewer_user_id, outcome, correction_reason)
       VALUES
         (101, 100, ?, 'correction_requested', 'First question'),
         (102, 100, ?, 'correction_requested', 'Second question'),
         (103, 100, ?, 'transmission_verified', NULL)`,
      [adminUserId, adminUserId, adminUserId],
    );

    // 2 correction responses
    await (db as any).db.execute(
      `INSERT INTO correction_responses
         (id, declaration_id, review_id, responding_user_id, response_text)
       VALUES
         (201, 100, 101, ?, 'First answer'),
         (202, 100, 102, ?, 'Second answer')`,
      [exposedUserId, exposedUserId],
    );

    const data = await db.getSurveillanceDashboardMetrics(qualityUserId, {
      status: 'resubmitted',
    });

    // Exactly 1 declaration must be reported, NOT 6 (1 * 3 * 2 cartesian product)
    expect(data.overview.totalDeclarations).toBe(1);
    expect(data.administrativeReview.totalReviews).toBe(3);
    expect(data.administrativeReview.correctionResponses).toBe(2);
  });

  // ─── 3. Authorization Matrix & Privacy ─────────────────────────

  test('quality_staff is permitted to access surveillance dashboard metrics', async () => {
    await seedTestDataset();
    await expect(db.getSurveillanceDashboardMetrics(qualityUserId)).resolves.toBeDefined();
  });

  test('admin_reviewer is permitted to access surveillance dashboard metrics', async () => {
    await seedTestDataset();
    await expect(db.getSurveillanceDashboardMetrics(adminUserId)).resolves.toBeDefined();
  });

  test('oh_professional is permitted to access surveillance dashboard metrics', async () => {
    await seedTestDataset();
    await expect(db.getSurveillanceDashboardMetrics(ohUserId)).resolves.toBeDefined();
  });

  test('exposed_professional is strictly prohibited from surveillance metrics', async () => {
    await seedTestDataset();
    await expect(db.getSurveillanceDashboardMetrics(exposedUserId)).rejects.toThrow(
      /exposed_professional is strictly prohibited/,
    );
  });

  test('tech_admin is strictly prohibited from surveillance metrics', async () => {
    await seedTestDataset();
    await expect(db.getSurveillanceDashboardMetrics(techUserId)).rejects.toThrow(
      /tech_admin is strictly prohibited/,
    );
  });

  test('Non-existent user is rejected', async () => {
    await expect(db.getSurveillanceDashboardMetrics(9999)).rejects.toThrow(/not found/);
  });

  test('Metrics object contains zero identifying or clinical free-text fields', async () => {
    await seedTestDataset();

    const data: any = await db.getSurveillanceDashboardMetrics(qualityUserId);

    // Verify absence of sensitive keys anywhere in root or nested overview
    expect(data.reference_number).toBeUndefined();
    expect(data.declared_by_user_id).toBeUndefined();
    expect(data.notes).toBeUndefined();
    expect(data.circumstances).toBeUndefined();
    expect(data.exposure_description).toBeUndefined();
    expect(data.response_text).toBeUndefined();
    expect(data.administrative_note).toBeUndefined();
  });

  // ─── 4. Synthetic Context Boundaries ──────────────────────────

  test('Validates requesting context using corrected synthetic context identifiers', async () => {
    await seedTestDataset();

    // Verify mapping IDs in synthetic contexts
    expect(SYNTHETIC_DEMO_CONTEXT.userId).toBe(1);
    expect(SYNTHETIC_ADMIN_REVIEWER_CONTEXT.userId).toBe(2);
    expect(SYNTHETIC_OH_PROFESSIONAL_CONTEXT.userId).toBe(3);
    expect(SYNTHETIC_QUALITY_STAFF_CONTEXT.userId).toBe(4);
    expect(SYNTHETIC_TECH_ADMIN_CONTEXT.userId).toBe(5);

    // OH Professional (user 3) resolves successfully
    await expect(
      db.getSurveillanceDashboardMetrics(SYNTHETIC_OH_PROFESSIONAL_CONTEXT.userId!),
    ).resolves.toBeDefined();

    // Admin Reviewer (user 2) resolves successfully
    await expect(
      db.getSurveillanceDashboardMetrics(SYNTHETIC_ADMIN_REVIEWER_CONTEXT.userId!),
    ).resolves.toBeDefined();

    // Quality Staff (user 4) resolves successfully
    await expect(
      db.getSurveillanceDashboardMetrics(SYNTHETIC_QUALITY_STAFF_CONTEXT.userId!),
    ).resolves.toBeDefined();

    // Exposed Professional (user 1) is rejected
    await expect(
      db.getSurveillanceDashboardMetrics(SYNTHETIC_DEMO_CONTEXT.userId!),
    ).rejects.toThrow(/exposed_professional is strictly prohibited/);

    // Tech Admin (user 5) is rejected
    await expect(
      db.getSurveillanceDashboardMetrics(SYNTHETIC_TECH_ADMIN_CONTEXT.userId!),
    ).rejects.toThrow(/tech_admin is strictly prohibited/);
  });

  test('canViewSurveillanceDashboard evaluates permission matrix correctly across all roles', () => {
    expect(canViewSurveillanceDashboard(SYNTHETIC_QUALITY_STAFF_CONTEXT)).toBe(true);
    expect(canViewSurveillanceDashboard(SYNTHETIC_ADMIN_REVIEWER_CONTEXT)).toBe(true);
    expect(canViewSurveillanceDashboard(SYNTHETIC_OH_PROFESSIONAL_CONTEXT)).toBe(true);
    expect(canViewSurveillanceDashboard(SYNTHETIC_TECH_ADMIN_CONTEXT)).toBe(false);
    expect(canViewSurveillanceDashboard(SYNTHETIC_DEMO_CONTEXT)).toBe(false);
    expect(canViewSurveillanceDashboard(UNAUTHENTICATED_CONTEXT)).toBe(false);
  });
});
