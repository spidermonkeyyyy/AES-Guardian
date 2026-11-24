import {
  AesGuardianDatabase,
  CapaCreationOperationConflictError,
  CapaCreationOperationIntegrityError,
  PreventionActionCreationUncertainError,
} from '../AesGuardianDatabase';
import { CapaOperationIdCollisionError } from '../capa-operation-utils';
import { NativeSQLiteAdapter } from '../NativeSQLiteAdapter';

describe('Durable CAPA creation operation identity', () => {
  let adapter: NativeSQLiteAdapter;
  let db: AesGuardianDatabase;
  let qualityStaffId: number;

  const input = {
    title: 'Durable operation test',
    description: 'Verify exact operation identity and replay behavior.',
    action_type: 'preventive' as const,
    contributing_factor: 'protective_equipment' as const,
    rationale: 'Ensure the operation remains identical across retries.',
  };

  beforeEach(async () => {
    adapter = new NativeSQLiteAdapter();
    await adapter.open();
    db = new AesGuardianDatabase(adapter as any);
    await db.initialize();
    const users = await db.query<{ id: number; role: string }>(
      `SELECT id, role FROM demo_users`,
    );
    qualityStaffId = users.rows.find(user => user.role === 'quality_staff')!.id;
  });

  afterEach(async () => {
    adapter.close();
  });

  const createNewOperation = async (
    userId: number,
    payload: typeof input,
    operationId: string,
    referenceCode?: string,
  ) => {
    const reservation = await db.reserveCapaCreationOperation(
      userId,
      payload,
      operationId,
      referenceCode,
      'new',
    );
    return db.createPreventionActionForOperation(
      userId,
      payload,
      operationId,
      reservation.reference_code,
      'new',
    );
  };

  test('Stage A new reservation is consumed by Stage B new without a second insert', async () => {
    const operationId = '26262626-2626-4626-8626-262626262626';
    const reservation = await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91029',
      'new',
    );
    const originalExecute = adapter.execute.bind(adapter);
    const reservationInsert = jest.spyOn(adapter, 'execute').mockImplementation(
      async (sql, params = []) => {
        if (sql.includes('INSERT INTO capa_creation_operations')) {
          throw new Error('Stage B attempted a second reservation insert');
        }
        return originalExecute(sql, params);
      },
    );

    const action = await db.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      reservation.reference_code,
      'new',
    );
    reservationInsert.mockRestore();

    expect(action.reference_code).toBe(reservation.reference_code);
    expect((await db.query(
      `SELECT id FROM prevention_actions WHERE reference_code = ?`,
      [reservation.reference_code],
    )).rows).toHaveLength(1);
    expect((await db.query(
      `SELECT operation_id FROM capa_creation_operations WHERE operation_id = ?`,
      [operationId],
    )).rows).toHaveLength(1);
  });

  test('Stage B rejects a mismatched reference without altering the reservation', async () => {
    const operationId = '27272727-2727-4727-8727-272727272727';
    await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91030',
      'new',
    );

    await expect(
      db.createPreventionActionForOperation(
        qualityStaffId,
        input,
        operationId,
        'CAPA-2026-91031',
        'new',
      ),
    ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
    expect((await db.listPendingCapaCreationOperations(qualityStaffId))
      .some(operation => operation.operation_id === operationId)).toBe(true);
  });

  test('valid-looking repeated ID is a collision for a genuinely new operation', async () => {
    const repeatedId = '16161616-1616-4616-8616-161616161616';
    await createNewOperation(
      qualityStaffId,
      input,
      repeatedId,
      'CAPA-2026-91021',
    );
    await expect(
      db.reserveCapaCreationOperation(
        qualityStaffId,
        input,
        repeatedId,
        'CAPA-2026-91021',
        'new',
      ),
    ).rejects.toBeInstanceOf(CapaOperationIdCollisionError);
  });

  test('insert-time primary-key race rejects a genuinely new operation', async () => {
    const operationId = '17171717-1717-4717-8717-171717171717';
    const originalExecute = adapter.execute.bind(adapter);
    let raceInjected = false;
    const executeSpy = jest.spyOn(adapter, 'execute').mockImplementation(async (sql, params = []) => {
      if (!raceInjected && sql.includes('INSERT INTO capa_creation_operations')) {
        raceInjected = true;
        await adapter.execute(
          `INSERT INTO capa_creation_operations
           (operation_id, created_by_user_id, payload_json, payload_hash, reference_code,
            status, prevention_action_id, created_at, updated_at)
           VALUES (?, ?, '{}', 'competing-hash', 'CAPA-2026-91022',
                   'pending', NULL, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
                   strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`,
          [operationId, qualityStaffId],
        );
      }
      return originalExecute(sql, params);
    });

    await expect(
      db.reserveCapaCreationOperation(
        qualityStaffId,
        input,
        operationId,
        'CAPA-2026-91022',
        'new',
      ),
    ).rejects.toBeInstanceOf(CapaOperationIdCollisionError);

    executeSpy.mockRestore();
    const competitors = await db.query(
      `SELECT * FROM capa_creation_operations WHERE operation_id = ?`,
      [operationId],
    );
    expect(competitors.rows).toHaveLength(1);
  });

  test('same operation ID and payload returns the same CAPA', async () => {
    const operationId = '11111111-1111-4111-8111-111111111111';
    const reference = 'CAPA-2026-91001';
    const reservation = await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      reference,
      'new',
    );
    const first = await db.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      reservation.reference_code,
      'new',
    );
    const second = await db.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      reference,
      'retry',
    );
    const repeatedStageB = await db.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      reference,
      'new',
    );

    expect(second.id).toBe(first.id);
    expect(repeatedStageB.id).toBe(first.id);
    expect(second.reference_code).toBe(reference);
    const records = await db.query<{
      actions: number;
      audits: number;
      notifications: number;
    }>(
      `SELECT
         (SELECT COUNT(*) FROM prevention_actions WHERE reference_code = ?) AS actions,
         (SELECT COUNT(*) FROM audit_events WHERE entity_id = ? AND event_type = 'prevention_action_created') AS audits,
         (SELECT COUNT(*) FROM in_app_notifications WHERE entity_id = ? AND event_type = 'capa_created') AS notifications`,
      [reference, first.id, first.id],
    );
    expect(records.rows[0]).toEqual({ actions: 1, audits: 1, notifications: 1 });
  });

  test('same operation ID with changed payload is rejected', async () => {
    const operationId = '22222222-2222-4222-8222-222222222222';
    const reservation = await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91002',
      'new',
    );

    await expect(
      db.createPreventionActionForOperation(
        qualityStaffId,
        { ...input, title: 'Changed operation payload' },
        operationId,
        reservation.reference_code,
        'retry',
      ),
    ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
  });

  test('same operation ID with a different creator is rejected', async () => {
    const operationId = '33333333-3333-4333-8333-333333333333';
    const reservation = await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91003',
      'new',
    );
    const otherCreator = await db.run(
      `INSERT INTO demo_users (username, display_name, role)
       VALUES ('capa.operation.other-quality', 'Other Quality Staff', 'quality_staff')`,
    );

    await expect(
      db.createPreventionActionForOperation(
        otherCreator.insertId!,
        input,
        operationId,
        reservation.reference_code,
        'retry',
      ),
    ).rejects.toBeInstanceOf(CapaCreationOperationConflictError);
  });

  test('distinct operation IDs with identical payload create separate CAPAs', async () => {
    const first = await createNewOperation(
      qualityStaffId,
      input,
      '44444444-4444-4444-8444-444444444444',
      'CAPA-2026-91004',
    );
    const second = await createNewOperation(
      qualityStaffId,
      input,
      '55555555-5555-4555-8555-555555555555',
      'CAPA-2026-91005',
    );

    expect(second.id).not.toBe(first.id);
  });

  test('collision with a legacy CAPA reference allocates a replacement for the same operation', async () => {
    const legacy = await db.run(
      `INSERT INTO prevention_actions
       (reference_code, title, description, action_type, contributing_factor, rationale,
        status, created_by_user_id)
       VALUES ('CAPA-2026-91006', 'Legacy CAPA', 'Existing legacy record',
               'corrective', 'other_factor', 'Legacy compatibility', 'proposed', ?)`,
      [qualityStaffId],
    );
    jest.spyOn(db, 'createPreventionActionReferenceCode')
      .mockReturnValueOnce('CAPA-2026-91007');

    const operationId = '66666666-6666-4666-8666-666666666666';
    const created = await createNewOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91006',
    );

    expect(created.id).not.toBe(legacy.insertId);
    expect(created.reference_code).toBe('CAPA-2026-91007');
  });

  test('collision with another operation never returns its CAPA', async () => {
    const first = await createNewOperation(
      qualityStaffId,
      input,
      '77777777-7777-4777-8777-777777777777',
      'CAPA-2026-91008',
    );
    jest.spyOn(db, 'createPreventionActionReferenceCode')
      .mockReturnValueOnce('CAPA-2026-91009');

    const second = await createNewOperation(
      qualityStaffId,
      input,
      '88888888-8888-4888-8888-888888888888',
      'CAPA-2026-91008',
    );

    expect(second.id).not.toBe(first.id);
    expect(second.reference_code).toBe('CAPA-2026-91009');
  });

  test('post-commit readback failure reconciles by operation ID without duplicate', async () => {
    const operationId = '99999999-9999-4999-8999-999999999999';
    const reference = 'CAPA-2026-91010';
    const readback = jest
      .spyOn(db, 'getPreventionActionById')
      .mockRejectedValueOnce(new Error('Simulated post-commit readback failure'));

    await expect(
      createNewOperation(qualityStaffId, input, operationId, reference),
    ).rejects.toBeInstanceOf(PreventionActionCreationUncertainError);
    readback.mockRestore();

    const recovered = await db.reconcileCapaCreationOperation(
      qualityStaffId,
      operationId,
      input,
    );
    expect(recovered?.reference_code).toBe(reference);

    const retried = await db.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      reference,
      'retry',
    );
    expect(retried.id).toBe(recovered?.id);
  });

  test('pending operation survives repository reconstruction and resumes with retry once', async () => {
    const operationId = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';
    await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91023',
      'new',
    );

    const reconstructed = new AesGuardianDatabase(adapter as any);
    const pending = await reconstructed.listPendingCapaCreationOperations(qualityStaffId);
    expect(pending.some(operation => operation.operation_id === operationId)).toBe(true);

    const completed = await reconstructed.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91023',
      'retry',
    );
    const retried = await reconstructed.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91023',
      'retry',
    );
    expect(retried.id).toBe(completed.id);
  });

  test('Stage B retry consumes the exact pending reservation', async () => {
    const operationId = '28282828-2828-4828-8828-282828282828';
    const reservation = await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91032',
      'new',
    );

    const created = await db.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      reservation.reference_code,
      'retry',
    );

    expect(created.reference_code).toBe(reservation.reference_code);
    expect((await db.getCapaCreationOperation(qualityStaffId, operationId))?.status)
      .toBe('committed');
  });

  test('operation identity survives repository reconstruction', async () => {
    const operationId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const created = await createNewOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91011',
    );

    const reconstructed = new AesGuardianDatabase(adapter as any);
    const replayed = await reconstructed.createPreventionActionForOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91011',
      'retry',
    );
    expect(replayed.id).toBe(created.id);
  });

  test('reservation is durable while a Stage B transaction rolls back', async () => {
    const operationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const reservation = await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91012',
      'new',
    );
    const operationSpy = jest
      .spyOn(db, 'insertNotification')
      .mockRejectedValueOnce(new Error('Simulated notification failure'));

    await expect(
      db.createPreventionActionForOperation(
        qualityStaffId,
        input,
        operationId,
        reservation.reference_code,
        'new',
      ),
    ).rejects.toThrow('Simulated notification failure');
    operationSpy.mockRestore();

    const pending = await db.query(
      `SELECT * FROM capa_creation_operations WHERE operation_id = ?`,
      [operationId],
    );
    expect(pending.rows).toHaveLength(1);
    expect((pending.rows[0] as any).status).toBe('pending');
  });

  test('missing explicit operation ID is rejected before reservation', async () => {
    await expect(
      db.createPreventionActionForOperation(
        qualityStaffId,
        input,
        '',
        'CAPA-2026-91013',
        'new',
      ),
    ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
  });

  test('missing reservation intent is rejected before reservation', async () => {
    await expect(
      (db.createPreventionActionForOperation as any)(
        qualityStaffId,
        input,
        '18181818-1818-4818-8818-181818181818',
        'CAPA-2026-91023',
      ),
    ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
  });

  test.each(['new', 'retry'] as const)(
    'Stage B %s without an existing reservation fails closed',
    async intent => {
      await expect(
        db.createPreventionActionForOperation(
          qualityStaffId,
          input,
          '20202020-2020-4020-8020-202020202020',
          'CAPA-2026-91025',
          intent,
        ),
      ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
    },
  );

  test.each([
    ['CAPA insert', 'INSERT INTO prevention_actions'],
    ['audit insert', 'INSERT INTO audit_events'],
    ['notification insert', 'INSERT INTO in_app_notifications'],
    ['operation commit update', "SET status = 'committed'"],
  ])('rolls back Stage B writes when the %s fails', async (_label, failingSql) => {
    const operationId = '21212121-2121-4121-8121-212121212121';
    const reservation = await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91026',
      'new',
    );
    const originalTransaction = adapter.transaction.bind(adapter);
    adapter.transaction = async callback =>
      originalTransaction(tx => {
        const execute = tx.execute.bind(tx);
        tx.execute = async (sql, params = []) => {
          if (sql.includes(failingSql)) {
            throw new Error(`Injected ${_label} failure`);
          }
          return execute(sql, params);
        };
        return callback(tx);
      });

    await expect(
      db.createPreventionActionForOperation(
        qualityStaffId,
        input,
        operationId,
        reservation.reference_code,
        'new',
      ),
    ).rejects.toThrow(`Injected ${_label} failure`);
    adapter.transaction = originalTransaction;

    const operation = await db.getCapaCreationOperation(qualityStaffId, operationId);
    expect(operation?.status).toBe('pending');
    expect(operation?.prevention_action_id).toBeNull();
    expect((await db.query(
      `SELECT id FROM prevention_actions WHERE reference_code = 'CAPA-2026-91026'`,
    )).rows).toHaveLength(0);
    expect((await db.query(
      `SELECT id FROM audit_events WHERE description LIKE '%CAPA-2026-91026%'`,
    )).rows).toHaveLength(0);
    expect((await db.query(
      `SELECT id FROM in_app_notifications WHERE entity_reference = 'CAPA-2026-91026'`,
    )).rows).toHaveLength(0);
  });

  test('reference-only reconciliation cannot substitute for a durable operation ID', async () => {
    const operationId = '29292929-2929-4929-8929-292929292929';
    const action = await createNewOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91033',
    );

    await expect(
      db.reconcilePreventionActionCreation(
        qualityStaffId,
        input,
        action.reference_code,
      ),
    ).rejects.toBeInstanceOf(PreventionActionCreationUncertainError);
  });

  test('operation recovery and acknowledgement methods reject non-quality roles', async () => {
    const operationId = '23232323-2323-4323-8323-232323232323';
    await createNewOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91027',
    );
    const admin = (await db.query<{ id: number }>(
      `SELECT id FROM demo_users WHERE role = 'admin_reviewer' LIMIT 1`,
    )).rows[0].id;

    await expect(db.listPendingCapaCreationOperations(admin))
      .rejects.toBeInstanceOf(CapaCreationOperationConflictError);
    await expect(db.listUnacknowledgedCommittedCapaCreationOperations(admin))
      .rejects.toBeInstanceOf(CapaCreationOperationConflictError);
    await expect(db.getCapaCreationOperation(admin, operationId))
      .rejects.toBeInstanceOf(CapaCreationOperationConflictError);
    await expect(db.acknowledgeCapaCreationOperation(admin, operationId))
      .rejects.toBeInstanceOf(CapaCreationOperationConflictError);
    await expect(db.reconcileCapaCreationOperation(admin, operationId, input))
      .rejects.toBeInstanceOf(CapaCreationOperationConflictError);
    await expect(db.reserveCapaCreationOperation(
      admin,
      input,
      '24242424-2424-4424-8424-242424242424',
      'CAPA-2026-91028',
      'new',
    )).rejects.toBeInstanceOf(CapaCreationOperationConflictError);
  });

  test('compatibility wrapper ignores optional old-ID argument and creates fresh operations', async () => {
    const oldOperationId = '19191919-1919-4919-8919-191919191919';
    const first = await (db.createPreventionAction as any)(
      qualityStaffId,
      input,
      'CAPA-2026-91024',
      oldOperationId,
    );
    const second = await (db.createPreventionAction as any)(
      qualityStaffId,
      input,
      'CAPA-2026-91025',
      oldOperationId,
    );
    expect(second.id).not.toBe(first.id);
  });

  test('unacknowledged committed operation is recovered exactly and acknowledged once', async () => {
    const operationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const created = await createNewOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91014',
    );
    const recoverable =
      await db.listUnacknowledgedCommittedCapaCreationOperations(qualityStaffId);
    expect(recoverable.some(operation => operation.operation_id === operationId))
      .toBe(true);
    const recovered = await db.reconcileCapaCreationOperation(
      qualityStaffId,
      operationId,
      input,
    );
    expect(recovered?.id).toBe(created.id);

    await db.acknowledgeCapaCreationOperation(qualityStaffId, operationId);
    await db.acknowledgeCapaCreationOperation(qualityStaffId, operationId);
    const acknowledged =
      await db.getCapaCreationOperation(qualityStaffId, operationId);
    expect(acknowledged?.acknowledged_at).toBeTruthy();
    const remaining =
      await db.listUnacknowledgedCommittedCapaCreationOperations(qualityStaffId);
    expect(remaining.some(operation => operation.operation_id === operationId))
      .toBe(false);
  });

  test('pending operation cannot be acknowledged', async () => {
    const operationId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91015',
      'new',
    );
    await expect(
      db.acknowledgeCapaCreationOperation(qualityStaffId, operationId),
    ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
  });

  test('controlled operation-reference race replaces reference for same operation', async () => {
    const admin = (await db.query<{ id: number }>(
      `SELECT id FROM demo_users WHERE role = 'admin_reviewer' LIMIT 1`,
    )).rows[0];
    await db.run(
      `INSERT INTO capa_creation_operations
       (operation_id, created_by_user_id, payload_json, payload_hash, reference_code,
        status, prevention_action_id, created_at, updated_at)
       VALUES ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', ?, '{}', 'hash', 'CAPA-2026-91016',
               'pending', NULL, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
               strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`,
      [admin.id],
    );
    const operationId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const reserved = await db.reserveCapaCreationOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91016',
      'new',
    );
    expect(reserved.operation_id).toBe(operationId);
    expect(reserved.reference_code).not.toBe('CAPA-2026-91016');
  });

  test('committed operation with missing linked CAPA is an integrity failure', async () => {
    const operationId = '12121212-1212-4212-8212-121212121212';
    await createNewOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91017',
    );
    await db.run(
      `UPDATE capa_creation_operations
       SET prevention_action_id = NULL
       WHERE operation_id = ?`,
      [operationId],
    );
    await expect(
      db.reconcileCapaCreationOperation(qualityStaffId, operationId, input),
    ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
    await expect(
      db.getCapaCreationOperation(qualityStaffId, operationId),
    ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
  });

  test.each([
    [
      'creation audit',
      `DELETE FROM audit_events WHERE entity_type = 'prevention_action'
       AND event_type = 'prevention_action_created'
       AND entity_id = ?`,
    ],
    [
      'creation notification',
      `DELETE FROM in_app_notifications WHERE event_type = 'capa_created'
       AND entity_id = ?`,
    ],
  ])('missing %s evidence is not successful reconciliation', async (_label, deleteSql) => {
    const operationId =
      _label === 'creation audit'
        ? '13131313-1313-4313-8313-131313131313'
        : '14141414-1414-4414-8414-141414141414';
    const reference =
      _label === 'creation audit'
        ? 'CAPA-2026-91018'
        : 'CAPA-2026-91019';
    const created = await createNewOperation(
      qualityStaffId,
      input,
      operationId,
      reference,
    );
    await db.run(deleteSql, [created.id]);
    await expect(
      db.reconcileCapaCreationOperation(qualityStaffId, operationId, input),
    ).rejects.toBeInstanceOf(PreventionActionCreationUncertainError);
    await expect(
      db.getCapaCreationOperation(qualityStaffId, operationId),
    ).rejects.toBeInstanceOf(PreventionActionCreationUncertainError);
  });

  test('wrong linked CAPA payload is an integrity failure', async () => {
    const operationId = '15151515-1515-4515-8515-151515151515';
    await createNewOperation(
      qualityStaffId,
      input,
      operationId,
      'CAPA-2026-91020',
    );
    await db.run(
      `UPDATE prevention_actions SET title = 'Wrong linked payload'
       WHERE id = (SELECT prevention_action_id FROM capa_creation_operations
                   WHERE operation_id = ?)`,
      [operationId],
    );
    await expect(
      db.reconcileCapaCreationOperation(qualityStaffId, operationId, input),
    ).rejects.toBeInstanceOf(CapaCreationOperationIntegrityError);
  });
});
