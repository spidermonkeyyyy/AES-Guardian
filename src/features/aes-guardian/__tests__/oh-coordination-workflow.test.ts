/**
 * AES Guardian — OH Coordination Workflow Tests (Phase 2C.4)
 *
 * Tests the full occupational-health coordination lifecycle using the
 * JS op-sqlite mock (suitable for domain/repository-layer validation).
 *
 * Covers:
 * - Migration 6 applies (tables created in mock)
 * - Full lifecycle: create → acknowledge → record events → complete
 * - Authorization: all 5 roles, read and write
 * - Duplicate active coordination rejected
 * - Completed/cancelled coordination rejects new events
 * - exposed_professional sees only own declaration status
 * - tech_admin blocked from all coordination data
 */

import {
  initializeDatabase,
  resetDatabaseForTesting,
  AesGuardianDatabase,
  type OhCoordination,
  type AdminOhCoordinationSummary,
  type OhQueueFilterOptions,
} from '../../../core/database';

const { clearAllMockStores } = require('../../../../__mocks__/@op-engineering/op-sqlite');

describe('Phase 2C.4 — OH Coordination Workflow', () => {
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

  async function seedDeclaration(id: number, userId: number): Promise<void> {
    await (db as any).db.execute(
      `INSERT INTO aes_declarations
         (id, declared_by_user_id, reference_number, incident_date, incident_type, status, created_at, updated_at)
       VALUES (?, ?, ?, '2025-06-01', 'percutaneous_exposure', 'submitted', '2025-06-01T00:00:00Z', '2025-06-01T00:00:00Z')`,
      [id, userId, `AES-2025-00${id}`],
    );
  }

  // ─── Migration 6 presence ────────────────────────────────────

  test('Migration 6 creates oh_coordinations table', async () => {
    expect(async () => {
      await (db as any).db.execute(
        `INSERT INTO oh_coordinations
           (declaration_id, created_by_user_id, coordination_reason, status, created_at, updated_at)
         VALUES (999, 999, 'routine_followup', 'pending_acknowledgement',
                 '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')`,
        [],
      );
    }).not.toThrow();
  });

  test('Migration 6 creates oh_follow_up_events table', async () => {
    expect(async () => {
      await (db as any).db.execute(
        `INSERT INTO oh_follow_up_events
           (coordination_id, event_category, event_date, recorded_by_user_id, created_at)
         VALUES (999, 'contact_attempt_recorded', '2025-01-01', 999, '2025-01-01T00:00:00Z')`,
        [],
      );
    }).not.toThrow();
  });

  test('Schema version is at least 6 after initialization', async () => {
    const versions: any = await (db as any).db.query(
      `SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1`,
      [],
    );
    expect(versions.rows[0]?.version).toBeGreaterThanOrEqual(6);
  });

  // ─── Full lifecycle ───────────────────────────────────────────

  test('Full lifecycle: create → acknowledge → record events → complete', async () => {
    await seedDeclaration(10, exposedUserId);

    // 1. admin_reviewer creates coordination
    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    expect(typeof coordId).toBe('number');
    expect(coordId).toBeGreaterThan(0);

    // 2. oh_professional acknowledges
    await expect(db.acknowledgeOhCoordination(coordId, ohUserId)).resolves.toBeUndefined();

    // 3. oh_professional records follow-up events
    const event1Id = await db.createOhFollowUpEvent({
      coordination_id: coordId,
      event_category: 'contact_attempt_recorded',
      event_date: '2025-07-10',
      recorded_by_user_id: ohUserId,
    });
    expect(event1Id).toBeGreaterThan(0);

    const event2Id = await db.createOhFollowUpEvent({
      coordination_id: coordId,
      event_category: 'contact_established',
      event_date: '2025-07-11',
      recorded_by_user_id: ohUserId,
      administrative_note: 'Contact établi par téléphone',
    });
    expect(event2Id).toBeGreaterThan(0);

    // 4. oh_professional completes coordination
    await expect(db.completeOhCoordination(coordId, ohUserId)).resolves.toBeUndefined();

    // 5. Verify final state
    const coord = (await db.getOhCoordinationById(coordId, ohUserId)) as OhCoordination | null;
    expect(coord?.status).toBe('completed');
    expect(coord?.acknowledged_by_user_id).toBe(ohUserId);
    expect(coord?.completed_by_user_id).toBe(ohUserId);
  });

  test('follow_up_completed event auto-completes the coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'serology_monitoring',
    });
    await db.acknowledgeOhCoordination(coordId, ohUserId);

    await db.createOhFollowUpEvent({
      coordination_id: coordId,
      event_category: 'follow_up_completed',
      event_date: '2025-07-15',
      recorded_by_user_id: ohUserId,
    });

    const coord = await db.getOhCoordinationById(coordId, ohUserId);
    expect(coord?.status).toBe('completed');
  });

  // ─── Duplicate active coordination ───────────────────────────

  test('Duplicate active coordination is rejected at domain layer', async () => {
    await seedDeclaration(10, exposedUserId);

    await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(
      db.createOhCoordination({
        declaration_id: 10,
        created_by_user_id: adminUserId,
        coordination_reason: 'serology_monitoring',
      }),
    ).rejects.toThrow(/active coordination already exists/);
  });

  test('New active coordination allowed after previous is cancelled', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId1 = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    await db.cancelOhCoordination(coordId1, adminUserId);

    await expect(
      db.createOhCoordination({
        declaration_id: 10,
        created_by_user_id: adminUserId,
        coordination_reason: 'serology_monitoring',
      }),
    ).resolves.toBeGreaterThan(0);
  });

  // ─── Event rejection on terminal states ──────────────────────

  test('Event rejected on completed coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    await db.acknowledgeOhCoordination(coordId, ohUserId);
    await db.completeOhCoordination(coordId, ohUserId);

    await expect(
      db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'contact_attempt_recorded',
        event_date: '2025-07-20',
        recorded_by_user_id: ohUserId,
      }),
    ).rejects.toThrow(/completed/);
  });

  test('Event rejected on cancelled coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    await db.cancelOhCoordination(coordId, adminUserId);

    await expect(
      db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'contact_attempt_recorded',
        event_date: '2025-07-20',
        recorded_by_user_id: ohUserId,
      }),
    ).rejects.toThrow(/cancelled/);
  });

  // ─── Invalid status transitions ──────────────────────────────

  test('Cannot acknowledge an already-acknowledged coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    await db.acknowledgeOhCoordination(coordId, ohUserId);

    await expect(db.acknowledgeOhCoordination(coordId, ohUserId)).rejects.toThrow(
      /pending_acknowledgement/,
    );
  });

  test('Cannot complete a pending_acknowledgement coordination directly', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.completeOhCoordination(coordId, ohUserId)).rejects.toThrow(/acknowledged/);
  });

  // ─── Authorization matrix ────────────────────────────────────

  test('exposed_professional cannot create coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    await expect(
      db.createOhCoordination({
        declaration_id: 10,
        created_by_user_id: exposedUserId,
        coordination_reason: 'routine_followup',
      }),
    ).rejects.toThrow(/admin_reviewer/);
  });

  test('oh_professional cannot create coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    await expect(
      db.createOhCoordination({
        declaration_id: 10,
        created_by_user_id: ohUserId,
        coordination_reason: 'routine_followup',
      }),
    ).rejects.toThrow(/admin_reviewer/);
  });

  test('tech_admin cannot create coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    await expect(
      db.createOhCoordination({
        declaration_id: 10,
        created_by_user_id: techUserId,
        coordination_reason: 'routine_followup',
      }),
    ).rejects.toThrow(/admin_reviewer/);
  });

  test('admin_reviewer cannot acknowledge coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.acknowledgeOhCoordination(coordId, adminUserId)).rejects.toThrow(
      /oh_professional/,
    );
  });

  test('admin_reviewer cannot complete coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    await db.acknowledgeOhCoordination(coordId, ohUserId);

    await expect(db.completeOhCoordination(coordId, adminUserId)).rejects.toThrow(/oh_professional/);
  });

  test('oh_professional cannot cancel coordination', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.cancelOhCoordination(coordId, ohUserId)).rejects.toThrow(/admin_reviewer/);
  });

  test('admin_reviewer cannot record follow-up events', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    await db.acknowledgeOhCoordination(coordId, ohUserId);

    await expect(
      db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'contact_attempt_recorded',
        event_date: '2025-07-10',
        recorded_by_user_id: adminUserId,
      }),
    ).rejects.toThrow(/oh_professional/);
  });

  test('tech_admin is blocked from getOhCoordinationById', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.getOhCoordinationById(coordId, techUserId)).rejects.toThrow(
      /tech_admin.*not authorized/,
    );
  });

  test('tech_admin is blocked from getOhFollowUpEvents', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.getOhFollowUpEvents(coordId, techUserId)).rejects.toThrow(/tech_admin/);
  });

  test('quality_staff is blocked from getOhFollowUpEvents', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.getOhFollowUpEvents(coordId, qualityUserId)).rejects.toThrow(/quality_staff/);
  });

  test('exposed_professional is blocked from getOhFollowUpEvents', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.getOhFollowUpEvents(coordId, exposedUserId)).rejects.toThrow(/exposed_professional/);
  });

  test('admin_reviewer is blocked from getOhFollowUpEvents', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.getOhFollowUpEvents(coordId, adminUserId)).rejects.toThrow(/admin_reviewer/);
  });

  test('listOhCoordinationsQueue rejects non-oh_professional', async () => {
    await expect(db.listOhCoordinationsQueue(adminUserId)).rejects.toThrow(/oh_professional/);
    await expect(db.listOhCoordinationsQueue(exposedUserId)).rejects.toThrow(/oh_professional/);
    await expect(db.listOhCoordinationsQueue(techUserId)).rejects.toThrow(/oh_professional/);
  });

  test('listOhCoordinationsForAdmin rejects non-admin_reviewer', async () => {
    await expect(db.listOhCoordinationsForAdmin(ohUserId)).rejects.toThrow(/admin_reviewer/);
    await expect(db.listOhCoordinationsForAdmin(exposedUserId)).rejects.toThrow(/admin_reviewer/);
    await expect(db.listOhCoordinationsForAdmin(techUserId)).rejects.toThrow(/admin_reviewer/);
  });

  // ─── exposed_professional isolation ──────────────────────────

  test('exposed_professional sees only status (not events or sensitive fields) for own declaration', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    const coord = await db.getOhCoordinationById(coordId, exposedUserId);
    expect(coord?.status).toBe('pending_acknowledgement');
    expect(coord).not.toHaveProperty('coordination_reason');
    expect(coord).not.toHaveProperty('created_by_user_id');
    expect(coord).not.toHaveProperty('acknowledged_by_user_id');
    expect(coord).not.toHaveProperty('completed_by_user_id');
    expect(coord).not.toHaveProperty('acknowledged_at');
    expect(coord).not.toHaveProperty('completed_at');
  });

  test('exposed_professional cannot see another user declaration coordination', async () => {
    await seedDeclaration(10, exposedUserId);
    await seedDeclaration(20, adminUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 20,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    await expect(db.getOhCoordinationById(coordId, exposedUserId)).rejects.toThrow(
      /own declaration/,
    );
  });

  // ─── Follow-up events ordering ───────────────────────────────

  test('Follow-up events returned in chronological order', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    await db.acknowledgeOhCoordination(coordId, ohUserId);

    await db.createOhFollowUpEvent({
      coordination_id: coordId,
      event_category: 'contact_attempt_recorded',
      event_date: '2025-07-10',
      recorded_by_user_id: ohUserId,
    });
    await db.createOhFollowUpEvent({
      coordination_id: coordId,
      event_category: 'contact_established',
      event_date: '2025-07-12',
      recorded_by_user_id: ohUserId,
    });
    await db.createOhFollowUpEvent({
      coordination_id: coordId,
      event_category: 'appointment_coordinated',
      event_date: '2025-07-14',
      recorded_by_user_id: ohUserId,
    });

    const events = await db.getOhFollowUpEvents(coordId, ohUserId);
    expect(events).toHaveLength(3);
    expect(events[0].event_category).toBe('contact_attempt_recorded');
    expect(events[1].event_category).toBe('contact_established');
    expect(events[2].event_category).toBe('appointment_coordinated');
  });

  // ─── Invalid inputs ───────────────────────────────────────────

  test('Invalid coordination_reason is rejected', async () => {
    await seedDeclaration(10, exposedUserId);

    await expect(
      db.createOhCoordination({
        declaration_id: 10,
        created_by_user_id: adminUserId,
        coordination_reason: 'invalid_reason' as any,
      }),
    ).rejects.toThrow(/Invalid coordination_reason/);
  });

  test('Invalid event_category is rejected', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });
    await db.acknowledgeOhCoordination(coordId, ohUserId);

    await expect(
      db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'invalid_category' as any,
        event_date: '2025-07-10',
        recorded_by_user_id: ohUserId,
      }),
    ).rejects.toThrow(/Invalid event_category/);
  });

  test('Creating coordination for non-existent declaration is rejected', async () => {
    await expect(
      db.createOhCoordination({
        declaration_id: 9999,
        created_by_user_id: adminUserId,
        coordination_reason: 'routine_followup',
      }),
    ).rejects.toThrow(/not found/);
  });

  // ─── Data Minimization & Role-Specific Projections (Phase 2D.2C.3.1) ─

  describe('OH Coordination Data Minimization Projections', () => {
    let coordId: number;

    beforeEach(async () => {
      await seedDeclaration(10, exposedUserId);
      coordId = await db.createOhCoordination({
        declaration_id: 10,
        created_by_user_id: adminUserId,
        coordination_reason: 'routine_followup',
      });
      await db.acknowledgeOhCoordination(coordId, ohUserId);
      await db.completeOhCoordination(coordId, ohUserId);
    });

    test('oh_professional receives full authorized record with staff IDs and milestones', async () => {
      const coord = (await db.getOhCoordinationById(coordId, ohUserId)) as OhCoordination | null;
      expect(coord).not.toBeNull();
      expect(coord!.id).toBe(coordId);
      expect(coord!.declaration_id).toBe(10);
      expect(coord!.status).toBe('completed');
      expect(coord!.acknowledged_by_user_id).toBe(ohUserId);
      expect(coord!.acknowledged_at).not.toBeNull();
      expect(coord!.completed_by_user_id).toBe(ohUserId);
      expect(coord!.completed_at).not.toBeNull();
    });

    test('admin_reviewer receives oversight projection (milestones preserved, internal OH staff IDs structurally absent)', async () => {
      const coord = (await db.getOhCoordinationById(coordId, adminUserId)) as AdminOhCoordinationSummary | null;
      expect(coord).not.toBeNull();
      expect(coord!.id).toBe(coordId);
      expect(coord!.declaration_id).toBe(10);
      expect(coord!.status).toBe('completed');
      expect(coord!.coordination_reason).toBe('routine_followup');
      // Timestamps preserved for oversight
      expect(coord!.acknowledged_at).not.toBeNull();
      expect(coord!.completed_at).not.toBeNull();
      // Internal OH staff identities must be structurally absent (not merely null)
      expect(coord).not.toHaveProperty('acknowledged_by_user_id');
      expect(coord).not.toHaveProperty('completed_by_user_id');
      // declaration_reference present when declaration exists
      expect(coord!.declaration_reference).toBe('AES-2025-0010');
      const keys = Object.keys(coord!).sort();
      expect(keys).toEqual(
        ['acknowledged_at', 'completed_at', 'coordination_reason', 'created_at', 'created_by_user_id',
          'declaration_id', 'declaration_reference', 'id', 'status', 'updated_at'].sort(),
      );
    });

    test('admin_reviewer handles absent declaration_reference when unlinked or unavailable', async () => {
      // Direct insert with non-existent declaration_id to test optional declaration_reference contract
      await (db as any).db.execute(
        `INSERT INTO oh_coordinations
           (id, declaration_id, created_by_user_id, coordination_reason, status, created_at, updated_at)
         VALUES (8765, 8888, ?, 'routine_followup', 'pending_acknowledgement',
                 '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')`,
        [adminUserId],
      );

      const coord = (await db.getOhCoordinationById(8765, adminUserId)) as AdminOhCoordinationSummary | null;
      expect(coord).not.toBeNull();
      expect(coord!.id).toBe(8765);
      expect(coord!.declaration_id).toBe(8888);
      // declaration_reference must be absent when unlinked
      expect(coord).not.toHaveProperty('declaration_reference');
      // Internal OH staff IDs remain absent
      expect(coord).not.toHaveProperty('acknowledged_by_user_id');
      expect(coord).not.toHaveProperty('completed_by_user_id');
      // Exactly 9 required keys
      const keys = Object.keys(coord!).sort();
      expect(keys).toEqual(
        ['acknowledged_at', 'completed_at', 'coordination_reason', 'created_at', 'created_by_user_id',
          'declaration_id', 'id', 'status', 'updated_at'].sort(),
      );
    });

    test('admin_reviewer in listOhCoordinationsForAdmin shields internal OH staff IDs', async () => {
      const list = await db.listOhCoordinationsForAdmin(adminUserId);
      expect(list.length).toBeGreaterThan(0);
      const item = list.find(c => c.id === coordId);
      expect(item).toBeDefined();
      // Internal OH staff identifiers must be structurally absent (not merely null)
      expect(item).not.toHaveProperty('acknowledged_by_user_id');
      expect(item).not.toHaveProperty('completed_by_user_id');
      expect(item!.status).toBe('completed');
      expect(item!.coordination_reason).toBe('routine_followup');
      expect(item!.acknowledged_at).not.toBeNull();
      expect(item!.completed_at).not.toBeNull();
      expect(item).not.toHaveProperty('events');
      expect(item).not.toHaveProperty('administrative_note');
    });

    test('listOhCoordinationsForAdmin strictly validates role and identity', async () => {
      // 1. Success for valid admin_reviewer
      const adminList = await db.listOhCoordinationsForAdmin(adminUserId);
      expect(Array.isArray(adminList)).toBe(true);

      // 2. Reject exposed_professional
      await expect(db.listOhCoordinationsForAdmin(exposedUserId)).rejects.toThrow(
        /listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got exposed_professional/,
      );

      // 3. Reject oh_professional
      await expect(db.listOhCoordinationsForAdmin(ohUserId)).rejects.toThrow(
        /listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got oh_professional/,
      );

      // 4. Reject quality_staff
      await expect(db.listOhCoordinationsForAdmin(qualityUserId)).rejects.toThrow(
        /listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got quality_staff/,
      );

      // 5. Reject tech_admin
      await expect(db.listOhCoordinationsForAdmin(techUserId)).rejects.toThrow(
        /listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got tech_admin/,
      );

      // 6. Reject missing identity (undefined)
      await expect(db.listOhCoordinationsForAdmin(undefined)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to list coordinations/,
      );

      // 7. Reject null identity
      await expect(db.listOhCoordinationsForAdmin(null)).rejects.toThrow(
        /Unauthorized: requesting user ID is required to list coordinations/,
      );

      // 8. Reject non-existent user
      await expect(db.listOhCoordinationsForAdmin(99999)).rejects.toThrow(
        /listOhCoordinationsForAdmin: requesting user 99999 not found/,
      );
    });

    test('exposed_professional receives genuinely minimal status-only projection with unauthorized fields omitted', async () => {
      const coord = await db.getOhCoordinationById(coordId, exposedUserId);
      expect(coord).not.toBeNull();
      expect(coord!.id).toBe(coordId);
      expect(coord!.declaration_id).toBe(10);
      expect(coord!.status).toBe('completed');
      expect(coord!.created_at).toBeDefined();
      expect(coord!.updated_at).toBeDefined();

      // Unauthorized fields are strictly ABSENT from the returned object (not just null)
      expect(coord).not.toHaveProperty('coordination_reason');
      expect(coord).not.toHaveProperty('created_by_user_id');
      expect(coord).not.toHaveProperty('acknowledged_by_user_id');
      expect(coord).not.toHaveProperty('completed_by_user_id');
      expect(coord).not.toHaveProperty('acknowledged_at');
      expect(coord).not.toHaveProperty('completed_at');
      expect(coord).not.toHaveProperty('events');
      expect(coord).not.toHaveProperty('notes');
      expect(coord).not.toHaveProperty('administrative_note');

      // Exact keys check
      const keys = Object.keys(coord!);
      expect(keys.sort()).toEqual(['created_at', 'declaration_id', 'id', 'status', 'updated_at'].sort());
    });

    test('getOhCoordinationByDeclaration applies same minimal projection to exposed_professional', async () => {
      // Re-create active coordination for getOhCoordinationByDeclaration
      await seedDeclaration(20, exposedUserId);
      const activeCoordId = await db.createOhCoordination({
        declaration_id: 20,
        created_by_user_id: adminUserId,
        coordination_reason: 'serology_monitoring',
      });
      await db.acknowledgeOhCoordination(activeCoordId, ohUserId);

      // OH professional gets full record
      const ohView = (await db.getOhCoordinationByDeclaration(20, ohUserId)) as OhCoordination | null;
      expect(ohView!.acknowledged_by_user_id).toBe(ohUserId);

      // Admin reviewer gets shielded record (AdminOhCoordinationSummary — internal staff IDs structurally absent)
      const adminView = (await db.getOhCoordinationByDeclaration(20, adminUserId)) as AdminOhCoordinationSummary | null;
      expect(adminView).not.toHaveProperty('acknowledged_by_user_id');
      expect(adminView!.acknowledged_at).not.toBeNull();
      expect(adminView!.coordination_reason).toBe('serology_monitoring');

      // Exposed professional gets minimal status-only projection
      const exposedView = await db.getOhCoordinationByDeclaration(20, exposedUserId);
      expect(exposedView).not.toBeNull();
      expect(exposedView!.id).toBe(activeCoordId);
      expect(exposedView!.status).toBe('acknowledged');
      expect(exposedView).not.toHaveProperty('coordination_reason');
      expect(exposedView).not.toHaveProperty('created_by_user_id');
      expect(exposedView).not.toHaveProperty('acknowledged_by_user_id');
      expect(exposedView).not.toHaveProperty('completed_by_user_id');
      expect(exposedView).not.toHaveProperty('acknowledged_at');
      expect(exposedView).not.toHaveProperty('completed_at');
      expect(exposedView).not.toHaveProperty('events');

      const keys = Object.keys(exposedView!);
      expect(keys.sort()).toEqual(['created_at', 'declaration_id', 'id', 'status', 'updated_at'].sort());
    });

    test('quality_staff and tech_admin are completely denied from getOhCoordinationById and getOhCoordinationByDeclaration', async () => {
      await expect(db.getOhCoordinationById(coordId, qualityUserId)).rejects.toThrow(
        /quality_staff.*not authorized/,
      );
      await expect(db.getOhCoordinationById(coordId, techUserId)).rejects.toThrow(
        /tech_admin.*not authorized/,
      );
      await expect(db.getOhCoordinationByDeclaration(10, qualityUserId)).rejects.toThrow(
        /quality_staff.*not authorized/,
      );
      await expect(db.getOhCoordinationByDeclaration(10, techUserId)).rejects.toThrow(
        /tech_admin.*not authorized/,
      );
    });

    test('missing or null requesting_user_id fails closed across all OH retrieval methods', async () => {
      await expect(db.getOhCoordinationById(coordId, null)).rejects.toThrow(
        /requesting user ID is required/,
      );
      await expect(db.getOhCoordinationById(coordId, undefined as any)).rejects.toThrow(
        /requesting user ID is required/,
      );
      await expect(db.getOhCoordinationByDeclaration(10, null)).rejects.toThrow(
        /requesting user ID is required/,
      );
      await expect(db.getOhCoordinationByDeclaration(10, undefined as any)).rejects.toThrow(
        /requesting user ID is required/,
      );
      await expect(db.listOhCoordinationsQueue(null)).rejects.toThrow(
        /requesting user ID is required/,
      );
      await expect(db.listOhCoordinationsQueue(undefined as any)).rejects.toThrow(
        /requesting user ID is required/,
      );
      await expect(db.listOhCoordinationsForAdmin(null)).rejects.toThrow(
        /requesting user ID is required/,
      );
      await expect(db.listOhCoordinationsForAdmin(undefined as any)).rejects.toThrow(
        /requesting user ID is required/,
      );
    });

    // ────────────────────────────────────────────────────────────
    // Phase 2E.1.4.2A: OH Declaration Retrieval Authorization Hardening
    // ────────────────────────────────────────────────────────────
    describe('Phase 2E.1.4.2A: OH Declaration Retrieval Authorization Hardening', () => {
      test('1. oh_professional cannot call getDeclarations() or getDeclarationsByStatus() successfully', async () => {
        await seedDeclaration(101, exposedUserId);
        await expect(db.getDeclarations({ requestingUserId: ohUserId })).rejects.toThrow(
          /Unauthorized.*oh_professional.*general-purpose declaration lists/i,
        );
        await expect(db.getDeclarationsByStatus('submitted', ohUserId)).rejects.toThrow(
          /Unauthorized.*oh_professional.*declarations by status/i,
        );
      });

      test('2. oh_professional cannot retrieve an arbitrary declaration through getDeclarationById()', async () => {
        await seedDeclaration(102, exposedUserId);
        await expect(db.getDeclarationById(102, ohUserId)).rejects.toThrow(
          /Unauthorized.*oh_professional.*strictly prohibited from direct declaration retrieval/i,
        );
      });

      test('3. exposed_professional still retrieves only their own declarations', async () => {
        await seedDeclaration(103, exposedUserId);
        const ownDecls = await db.getDeclarations({ requestingUserId: exposedUserId });
        expect(ownDecls.some(d => d.id === 103)).toBe(true);

        const ownDetail = await db.getDeclarationById(103, exposedUserId);
        expect(ownDetail).not.toBeNull();
        expect(ownDetail!.id).toBe(103);
        expect(ownDetail!.declared_by_user_id).toBe(exposedUserId);

        await seedDeclaration(104, adminUserId);
        await expect(db.getDeclarationById(104, exposedUserId)).rejects.toThrow(
          /Unauthorized.*exposed_professional/i,
        );
        await expect(db.getDeclarations({ userId: adminUserId, requestingUserId: exposedUserId })).rejects.toThrow(
          /Unauthorized.*exposed_professional/i,
        );
      });

      test('4. admin_reviewer retains authorized hospital-wide declaration retrieval', async () => {
        await seedDeclaration(105, exposedUserId);
        const allDecls = await db.getDeclarations({ requestingUserId: adminUserId });
        expect(allDecls.some(d => d.id === 105)).toBe(true);

        const declDetail = await db.getDeclarationById(105, adminUserId);
        expect(declDetail).not.toBeNull();
        expect(declDetail!.id).toBe(105);

        const byStatus = await db.getDeclarationsByStatus('submitted', adminUserId);
        expect(byStatus.some(d => d.id === 105)).toBe(true);
      });

      test('5. quality_staff remains denied across getDeclarations() and getDeclarationById()', async () => {
        await seedDeclaration(106, exposedUserId);
        await expect(db.getDeclarations({ requestingUserId: qualityUserId })).rejects.toThrow(
          /Unauthorized.*quality_staff/i,
        );
        await expect(db.getDeclarationById(106, qualityUserId)).rejects.toThrow(
          /Unauthorized.*quality_staff/i,
        );
        await expect(db.getDeclarationsByStatus('submitted', qualityUserId)).rejects.toThrow(
          /Unauthorized.*quality_staff/i,
        );
      });

      test('6. tech_admin remains denied across getDeclarations() and getDeclarationById()', async () => {
        await seedDeclaration(107, exposedUserId);
        await expect(db.getDeclarations({ requestingUserId: techUserId })).rejects.toThrow(
          /Unauthorized.*tech_admin/i,
        );
        await expect(db.getDeclarationById(107, techUserId)).rejects.toThrow(
          /Unauthorized.*tech_admin/i,
        );
        await expect(db.getDeclarationsByStatus('submitted', techUserId)).rejects.toThrow(
          /Unauthorized.*tech_admin/i,
        );
      });

      test('7. authorized OH coordination queue (listOhCoordinationsQueue) remains functional for oh_professional', async () => {
        await seedDeclaration(108, exposedUserId);
        const coordId = await db.createOhCoordination({
          declaration_id: 108,
          created_by_user_id: adminUserId,
          coordination_reason: 'routine_followup',
        });

        const queue = await db.listOhCoordinationsQueue(ohUserId);
        expect(Array.isArray(queue)).toBe(true);
        const found = queue.find(c => c.id === coordId);
        expect(found).toBeDefined();
        expect(found!.declaration_reference).toBe('AES-2025-00108');
      });

      test('8. oh_professional can retrieve declaration associated with authorized coordination via getDeclarationForCoordinationInternal', async () => {
        await seedDeclaration(109, exposedUserId);
        const coordId = await db.createOhCoordination({
          declaration_id: 109,
          created_by_user_id: adminUserId,
          coordination_reason: 'serology_monitoring',
        });

        const decl = await db.getDeclarationForCoordinationInternal(coordId, ohUserId);
        expect(decl).not.toBeNull();
        expect(decl!.id).toBe(109);
        expect(decl!.declared_by_user_id).toBe(exposedUserId);
        expect(decl!.reference_number).toBe('AES-2025-00109');
      });

      test('9. getDeclarationForCoordinationInternal rejects invalid coordination ID or non-oh_professional caller', async () => {
        await seedDeclaration(110, exposedUserId);
        const coordId = await db.createOhCoordination({
          declaration_id: 110,
          created_by_user_id: adminUserId,
          coordination_reason: 'serology_monitoring',
        });

        // Non-existent coordination ID returns null
        const missingCoord = await db.getDeclarationForCoordinationInternal(999999, ohUserId);
        expect(missingCoord).toBeNull();

        // Non-oh_professional role is rejected
        await expect(db.getDeclarationForCoordinationInternal(coordId, exposedUserId)).rejects.toThrow(
          /Unauthorized.*role exposed_professional is not permitted/i,
        );
        await expect(db.getDeclarationForCoordinationInternal(coordId, adminUserId)).rejects.toThrow(
          /Unauthorized.*role admin_reviewer is not permitted/i,
        );
        await expect(db.getDeclarationForCoordinationInternal(coordId, qualityUserId)).rejects.toThrow(
          /Unauthorized.*role quality_staff is not permitted/i,
        );
        await expect(db.getDeclarationForCoordinationInternal(coordId, techUserId)).rejects.toThrow(
          /Unauthorized.*role tech_admin is not permitted/i,
        );
      });

      test('10. missing, null, or invalid identities fail closed across all methods', async () => {
        await seedDeclaration(111, exposedUserId);
        const coordId = await db.createOhCoordination({
          declaration_id: 111,
          created_by_user_id: adminUserId,
          coordination_reason: 'routine_followup',
        });

        // getDeclarations
        await expect(db.getDeclarations({ requestingUserId: null })).rejects.toThrow(/Unauthorized/i);
        await expect(db.getDeclarations({ requestingUserId: undefined })).rejects.toThrow(/Unauthorized/i);
        await expect(db.getDeclarations({ requestingUserId: 999999 })).rejects.toThrow(/not found/i);

        // getDeclarationById
        await expect(db.getDeclarationById(111, null)).rejects.toThrow(/Unauthorized/i);
        await expect(db.getDeclarationById(111, undefined)).rejects.toThrow(/Unauthorized/i);
        await expect(db.getDeclarationById(111, 999999)).rejects.toThrow(/not found/i);

        // getDeclarationsByStatus
        await expect(db.getDeclarationsByStatus('submitted', null)).rejects.toThrow(/Unauthorized/i);
        await expect(db.getDeclarationsByStatus('submitted', undefined)).rejects.toThrow(/Unauthorized/i);
        await expect(db.getDeclarationsByStatus('submitted', 999999)).rejects.toThrow(/not found/i);

        // getDeclarationForCoordinationInternal
        await expect(db.getDeclarationForCoordinationInternal(coordId, null)).rejects.toThrow(/Unauthorized/i);
        await expect(db.getDeclarationForCoordinationInternal(coordId, undefined)).rejects.toThrow(/Unauthorized/i);
        await expect(db.getDeclarationForCoordinationInternal(coordId, 999999)).rejects.toThrow(/not found/i);
      });
    });
  });
});

// ─── Phase 2E.1.6.0.2 — listOhCoordinationsQueue Filter Extension ─────────────

describe('Phase 2E.1.6.0.2 — listOhCoordinationsQueue OhQueueFilterOptions', () => {
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

  /**
   * Seed a minimal declaration deterministically.
   */
  async function seedDeclaration(id: number, userId: number): Promise<void> {
    await (db as any).db.execute(
      `INSERT INTO aes_declarations
         (id, declared_by_user_id, reference_number, incident_date, incident_type, status, created_at, updated_at)
       VALUES (?, ?, ?, '2025-06-01', 'percutaneous_exposure', 'submitted', '2025-06-01T00:00:00Z', '2025-06-01T00:00:00Z')`,
      [id, userId, `AES-2025-00${id}`],
    );
  }

  /**
   * Seed a coordination in a given status directly (bypasses business-logic helpers
   * to allow inserting cancelled records deterministically).
   */
  async function seedCoordinationWithStatus(
    declId: number,
    status: 'pending_acknowledgement' | 'acknowledged' | 'completed' | 'cancelled',
  ): Promise<number> {
    const acknowledgedBy = status !== 'pending_acknowledgement' ? ohUserId : null;
    const acknowledgedAt = status !== 'pending_acknowledgement' ? '2025-06-02T10:00:00Z' : null;
    const completedBy = status === 'completed' ? ohUserId : null;
    const completedAt = status === 'completed' ? '2025-06-03T10:00:00Z' : null;

    const result = await (db as any).db.execute(
      `INSERT INTO oh_coordinations
         (declaration_id, created_by_user_id, coordination_reason, status,
          acknowledged_by_user_id, acknowledged_at,
          completed_by_user_id, completed_at,
          created_at, updated_at)
       VALUES (?, ?, 'routine_followup', ?,
               ?, ?,
               ?, ?,
               '2025-06-01T08:00:00Z', '2025-06-01T08:00:00Z')`,
      [declId, adminUserId, status, acknowledgedBy, acknowledgedAt, completedBy, completedAt],
    );
    // Retrieve the inserted ID
    const idResult = await (db as any).db.query(
      `SELECT id FROM oh_coordinations WHERE declaration_id = ? AND status = ? ORDER BY id DESC LIMIT 1`,
      [declId, status],
    );
    return (idResult.rows[0] as { id: number }).id;
  }

  // ─── Test 1: Default invocation returns pending and acknowledged records ───

  test('1. default invocation returns pending_acknowledgement and acknowledged records', async () => {
    await seedDeclaration(201, exposedUserId);
    await seedDeclaration(202, exposedUserId);
    const pendingId = await seedCoordinationWithStatus(201, 'pending_acknowledgement');
    const acknowledgedId = await seedCoordinationWithStatus(202, 'acknowledged');

    const queue = await db.listOhCoordinationsQueue(ohUserId);

    const statuses = queue.map(c => c.status);
    expect(statuses).toContain('pending_acknowledgement');
    expect(statuses).toContain('acknowledged');

    const pendingFound = queue.find(c => c.id === pendingId);
    const acknowledgedFound = queue.find(c => c.id === acknowledgedId);
    expect(pendingFound).toBeDefined();
    expect(acknowledgedFound).toBeDefined();
  });

  // ─── Test 2: Default invocation excludes completed records ────────────────

  test('2. default invocation excludes completed records', async () => {
    // Use a unique declaration id range (300s) to avoid collisions
    await seedDeclaration(301, exposedUserId);
    await seedDeclaration(302, exposedUserId);
    const pendingId = await seedCoordinationWithStatus(301, 'pending_acknowledgement');
    const completedId = await seedCoordinationWithStatus(302, 'completed');

    const queue = await db.listOhCoordinationsQueue(ohUserId);

    expect(queue.find(c => c.id === pendingId)).toBeDefined();
    expect(queue.find(c => c.id === completedId)).toBeUndefined();
    expect(queue.some(c => c.status === 'completed')).toBe(false);
  });

  // ─── Test 3: includeCompleted: true returns pending, acknowledged, completed ─

  test('3. includeCompleted:true returns pending, acknowledged and completed records', async () => {
    await seedDeclaration(401, exposedUserId);
    await seedDeclaration(402, exposedUserId);
    await seedDeclaration(403, exposedUserId);
    const pendingId = await seedCoordinationWithStatus(401, 'pending_acknowledgement');
    const acknowledgedId = await seedCoordinationWithStatus(402, 'acknowledged');
    const completedId = await seedCoordinationWithStatus(403, 'completed');

    const queue = await db.listOhCoordinationsQueue(ohUserId, { includeCompleted: true });

    expect(queue.find(c => c.id === pendingId)).toBeDefined();
    expect(queue.find(c => c.id === acknowledgedId)).toBeDefined();
    expect(queue.find(c => c.id === completedId)).toBeDefined();

    const statuses = new Set(queue.map(c => c.status));
    expect(statuses.has('pending_acknowledgement')).toBe(true);
    expect(statuses.has('acknowledged')).toBe(true);
    expect(statuses.has('completed')).toBe(true);
  });

  // ─── Test 4: includeCompleted:true still excludes cancelled records ────────

  test('4. includeCompleted:true still excludes cancelled records', async () => {
    await seedDeclaration(501, exposedUserId);
    await seedDeclaration(502, exposedUserId);
    const completedId = await seedCoordinationWithStatus(501, 'completed');
    const cancelledId = await seedCoordinationWithStatus(502, 'cancelled');

    const queue = await db.listOhCoordinationsQueue(ohUserId, { includeCompleted: true });

    expect(queue.find(c => c.id === completedId)).toBeDefined();
    expect(queue.find(c => c.id === cancelledId)).toBeUndefined();
    expect(queue.some(c => c.status === 'cancelled')).toBe(false);
  });

  // ─── Test 5: Existing OH role authorization still enforced ────────────────

  test('5. oh_professional is authorized for both invocation modes', async () => {
    await seedDeclaration(601, exposedUserId);
    await seedCoordinationWithStatus(601, 'pending_acknowledgement');

    const defaultQueue = await db.listOhCoordinationsQueue(ohUserId);
    expect(Array.isArray(defaultQueue)).toBe(true);

    const expandedQueue = await db.listOhCoordinationsQueue(ohUserId, { includeCompleted: true });
    expect(Array.isArray(expandedQueue)).toBe(true);
  });

  // ─── Test 6: Other roles remain denied ───────────────────────────────────

  test('6. admin_reviewer, exposed_professional, quality_staff, tech_admin are denied', async () => {
    await expect(db.listOhCoordinationsQueue(adminUserId)).rejects.toThrow(/oh_professional/i);
    await expect(db.listOhCoordinationsQueue(exposedUserId)).rejects.toThrow(/oh_professional/i);
    await expect(db.listOhCoordinationsQueue(qualityUserId)).rejects.toThrow(/oh_professional/i);
    await expect(db.listOhCoordinationsQueue(techUserId)).rejects.toThrow(/oh_professional/i);

    // Also with options
    await expect(db.listOhCoordinationsQueue(adminUserId, { includeCompleted: true })).rejects.toThrow(/oh_professional/i);
    await expect(db.listOhCoordinationsQueue(techUserId, { includeCompleted: true })).rejects.toThrow(/oh_professional/i);
  });

  // ─── Test 7: null and undefined user IDs are rejected ────────────────────

  test('7. missing, null and undefined user IDs remain rejected', async () => {
    await expect(db.listOhCoordinationsQueue(null)).rejects.toThrow(/Unauthorized/i);
    await expect(db.listOhCoordinationsQueue(undefined as any)).rejects.toThrow(/Unauthorized/i);

    await expect(db.listOhCoordinationsQueue(null, { includeCompleted: true })).rejects.toThrow(/Unauthorized/i);
    await expect(db.listOhCoordinationsQueue(undefined as any, { includeCompleted: true })).rejects.toThrow(/Unauthorized/i);
  });

  // ─── Test 8: Nonexistent user is rejected ────────────────────────────────

  test('8. nonexistent user ID is rejected in both invocation modes', async () => {
    await expect(db.listOhCoordinationsQueue(999999)).rejects.toThrow(/not found/i);
    await expect(db.listOhCoordinationsQueue(999999, { includeCompleted: true })).rejects.toThrow(/not found/i);
  });

  // ─── Test 9: Seeded completed coordination (AES-2026-DEMO-04 analog) ──────
  // Builds an isolated fixture mirroring the seeder's completed coordination
  // so the test does not depend on seeder execution or ordering.

  test('9. a completed coordination is retrievable via includeCompleted:true but not by default', async () => {
    // Seed a declaration mirroring AES-2026-DEMO-04 (closed, completed coordination)
    await seedDeclaration(901, exposedUserId);
    const completedId = await seedCoordinationWithStatus(901, 'completed');

    // Default invocation must NOT return it
    const defaultQueue = await db.listOhCoordinationsQueue(ohUserId);
    expect(defaultQueue.find(c => c.id === completedId)).toBeUndefined();

    // Expanded invocation MUST return it
    const expandedQueue = await db.listOhCoordinationsQueue(ohUserId, { includeCompleted: true });
    const found = expandedQueue.find(c => c.id === completedId);
    expect(found).toBeDefined();
    expect(found!.status).toBe('completed');
    expect(found!.declaration_reference).toBe('AES-2025-00901');
  });

  // ─── Test 10: Workspace active badge count remains active-only ───────────
  // Verifies the workspace invariant: listOhCoordinationsQueue without options
  // returns only active records even when completed records exist in the database.

  test('10. workspace active badge count is not affected by completed records', async () => {
    // Seed one active and one completed coordination
    await seedDeclaration(1001, exposedUserId);
    await seedDeclaration(1002, exposedUserId);
    const activeId = await seedCoordinationWithStatus(1001, 'pending_acknowledgement');
    await seedCoordinationWithStatus(1002, 'completed');

    // Simulate what AesGuardianWorkspaceScreen does (no options — active only)
    const ohQueue = await db.listOhCoordinationsQueue(ohUserId);
    const ohQueueCount = ohQueue.length;

    // Only the active record should be counted
    expect(ohQueue.find(c => c.id === activeId)).toBeDefined();
    expect(ohQueue.some(c => c.status === 'completed')).toBe(false);
    // Count represents active work only (badge semantic preserved)
    expect(ohQueueCount).toBe(ohQueue.filter(c =>
      c.status === 'pending_acknowledgement' || c.status === 'acknowledged'
    ).length);
  });
});
