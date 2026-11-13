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
    const coord = await db.getOhCoordinationById(coordId, ohUserId);
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

  test('exposed_professional sees only status (not events) for own declaration', async () => {
    await seedDeclaration(10, exposedUserId);

    const coordId = await db.createOhCoordination({
      declaration_id: 10,
      created_by_user_id: adminUserId,
      coordination_reason: 'routine_followup',
    });

    const coord = await db.getOhCoordinationById(coordId, exposedUserId);
    expect(coord?.status).toBe('pending_acknowledgement');
    expect(coord?.acknowledged_by_user_id).toBeNull();
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
});
