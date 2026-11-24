# AES Guardian — Phase 2E.1.7.2.5.7
## CAPA Operation Identity, Committed Recovery & False-Replay Correction Report

## Final status

**IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT RE-AUDIT**

This report does not claim independent acceptance or cross-screen closure.

## 1. Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- Initial and final HEAD:
  `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Initial and final tree:
  `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Initial and final lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- Existing tracked/untracked CAPA work and reports were preserved.
- No commit, staging, branch change, reset, remote operation or dependency change occurred.

## 2. BLOCKER A — secure operation ID generation

### Change

`src/core/database/capa-operation-utils.ts` no longer contains a `Math.random()`,
timestamp or counter fallback.

`createCapaOperationId()` now accepts only:

1. `globalThis.crypto.randomUUID()`;
2. `globalThis.crypto.getRandomValues()`.

If neither usable secure API is available, or if either throws, it throws
`CapaOperationEntropyUnavailableError` before any operation record is created.

The implementation does not silently generate or persist a placeholder/fallback ID.

Runtime evidence remains source-based: React Native's `globalThis.crypto` availability
was not proven on a device. The fail-closed behavior removes the weak-fallback risk,
but native-device availability remains unverified.

### Deterministic tests

`src/core/database/__tests__/capa-operation-entropy.test.ts`

- fails closed when crypto is unavailable;
- fails closed when crypto methods throw;
- uses `randomUUID` when available.

No operation reservation is performed in these tests because generation fails before
reservation.

## 3. BLOCKER B — committed and unacknowledged recovery

### Migration 10

Migration 10 is additive and required. It appends:

```sql
ALTER TABLE capa_creation_operations
ADD COLUMN acknowledged_at TEXT
```

It also adds an index for status/creator/unacknowledged recovery.

Existing Migration 9 operation records receive `acknowledged_at = NULL` naturally.
They are therefore not fabricated as acknowledged. Legacy CAPA rows receive no
operation identity.

### Operation states

- `pending`: reserved and not transactionally committed;
- `committed`, `acknowledged_at NULL`: committed CAPA, not yet durably presented;
- `committed`, `acknowledged_at NOT NULL`: committed CAPA after successful presentation.

The acknowledged timestamp is not inferred from mounting or navigation.

### Defined presentation event

The Create screen presents a committed-result card through
`prevention-create-recovered-committed`.

After that card is committed to React rendering, the repository acknowledgement
method is called. The method:

- verifies the exact operation belongs to the creator;
- verifies status is committed;
- verifies a linked CAPA ID;
- revalidates payload, CAPA, audit and notification evidence;
- persists `acknowledged_at` only for that exact operation;
- is idempotent on repeated call.

A pending operation cannot be acknowledged.

### Recovery APIs

Added:

- `listPendingCapaCreationOperations(userId)`
- `listUnacknowledgedCommittedCapaCreationOperations(userId)`
- `getCapaCreationOperation(userId, operationId)`
- `acknowledgeCapaCreationOperation(userId, operationId)`

All creator filtering and exact operation lookup are repository-enforced.

### Create-screen recovery

The Create screen now loads both pending and unacknowledged committed operations.

At most one recoverable operation may be present. If there are multiple or a payload
cannot be parsed, it blocks arbitrary selection and shows an error.

If exactly one committed unacknowledged operation exists:

- it parses the persisted canonical payload;
- reconciles the exact operation ID;
- presents the original linked CAPA result;
- acknowledges it after presentation.

Already acknowledged operations are not listed as unresolved.

## 4. Interruption scenarios

| Scenario | Next launch behavior |
|---|---|
| Reservation succeeds; stop before Stage B | `pending` row remains recoverable; no CAPA exists |
| Stage B commits; stop before readback | Operation is `committed`, linked to CAPA, `acknowledged_at NULL`; exact recovery API discovers it |
| Commit then readback throws | Operation remains committed/unacknowledged; exact operation reconciliation recovers it |
| Readback succeeds; stop before result presentation | Operation remains committed/unacknowledged; result card is not yet durable acknowledgement |
| Result presented; stop before acknowledgement persistence | Operation remains committed/unacknowledged; acknowledgement is retried on next launch |
| Acknowledgement persists; stop afterward | Operation remains committed/acknowledged; it is not relisted as unresolved |

## 5. BLOCKER C — false-replay elimination

### API contract

`createPreventionActionForOperation(userId, input, operationId, referenceCode?)`
is the mandatory explicit-operation creation API.

It rejects an empty operation ID before reservation.

The legacy `createPreventionAction(userId, input, referenceCode?)` wrapper remains only
for compatibility. It:

- generates a secure new operation ID for each genuinely new invocation;
- never reuses an operation by reference/creator/payload;
- delegates to the explicit operation API.

This wrapper must not be used by the production Create screen.

The production Create screen reserves with an explicit ID and calls
`createPreventionActionForOperation(...)`.

### False-replay branch removal

The prior branch that matched:

- visible reference;
- creator;
- payload hash;
- canonical payload;

and returned an existing operation was removed.

The retry path now resolves only through exact operation ID.

## 6. Reservation reference collision race

Stage A now:

- validates and normalizes the payload;
- persists an explicit operation ID;
- checks existing CAPA references;
- checks operation-table reference uniqueness;
- serializes reference attempts in a bounded five-insertion loop;
- distinguishes `UNIQUE` reference conflicts from other database failures;
- allocates a replacement for the same operation ID;
- persists the replacement;
- retries no more than five times;
- returns a typed conflict if allocation is exhausted.

Pending creator uniqueness is distinguished from reference uniqueness.
A second pending operation for the same creator remains a typed conflict.

No database error is blindly retried.

## 7. Atomic transaction correctness

Within one transaction:

- exact pending operation is reloaded;
- creator and canonical payload are revalidated;
- CAPA row is inserted;
- positive safe integer insert ID is required;
- creation audit is inserted;
- creation notification is inserted;
- operation is linked and changed to committed;
- commit occurs.

A Stage B rollback leaves the pending reservation intact.
No pending/committed operation update occurs outside the transaction.

## 8. Reconciliation integrity

`reconcileCapaCreationOperation()` verifies:

- exact operation existence;
- creator;
- canonical payload;
- payload hash;
- status;
- exact linked CAPA ID;
- linked CAPA payload/reference;
- creation audit evidence;
- creation notification evidence.

It throws:

- `CapaCreationOperationIntegrityError` for structural or payload inconsistency;
- `PreventionActionCreationUncertainError` for missing audit/notification evidence;
- `CapaCreationOperationConflictError` for creator conflict.

Missing evidence is never reported as success.

## 9. Caller audit

Production caller:

- `PreventionActionCreateScreen.tsx` — uses generated explicit ID, reservation,
  explicit creation, exact reconciliation and acknowledgement.

Existing repository/test compatibility callers:

- `prevention-action-workflow.test.ts`
- `notification-workflow-hardening.test.ts`
- `notification-workflow.test.ts`
- `notification-e2e-journeys.test.ts`
- `workspace-integration.test.ts`

These use the legacy compatibility wrapper only where no explicit UI operation
context exists. The wrapper generates a genuinely new operation ID and does not
inherit an existing operation through reference/payload/creator.

The reference-only `reconcilePreventionActionCreation()` remains a compatibility
read/reconcile method and does not create or invent operation identity.

## 10. Test evidence

### Focused entropy, migration, operation and UI tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- Suites: `4 passed`
- Tests: `46 passed`

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- Suites: `56 passed`
- Tests: `1193 passed`
- Failed: `0`
- Skipped: `0`

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- Diagnostics: `769`
- Changed-file diagnostics: `0`
- Historical inherited SANAD diagnostics remain.

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- Missing ESLint 9 flat configuration remains.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## 11. Added adversarial coverage

- unavailable crypto;
- crypto throwing;
- secure UUID generation;
- missing explicit operation ID;
- committed replay;
- changed payload;
- changed creator;
- identical payload with distinct IDs;
- legacy and other-operation reference collision;
- operation reconstruction;
- Stage B notification rollback with durable pending reservation;
- post-commit readback reconciliation;
- pending operation acknowledgement rejection;
- committed operation acknowledgement and repeated acknowledgement;
- unacknowledged operation recovery;
- missing linked CAPA;
- missing audit evidence;
- missing notification evidence;
- wrong linked CAPA payload;
- remount pending recovery;
- committed unacknowledged UI recovery;
- multiple pending blocking.

No concurrent adapter test claims genuine multi-connection concurrency.
No emulator or physical-device native bridge test was performed.

## 12. Native and runtime limitations

React Native runtime availability of `crypto.randomUUID` or
`crypto.getRandomValues` remains unverified on a native build.

The implementation now fails closed when unavailable, rather than risking weak IDs.

No emulator or physical device was launched.
Node `node:sqlite` tests do not prove native `@op-engineering/op-sqlite` commit,
rollback or bridge semantics.

## 13. Remaining defects

None of the three previous blockers remain at source level:

1. weak entropy fallback removed;
2. committed/unacknowledged operations are durably recoverable and acknowledged;
3. no reference/creator/payload fallback returns an existing operation.

Remaining independent-audit risks:

- native runtime crypto availability;
- native bridge commit/rollback semantics;
- genuine concurrent connection reservation proof.

## 14. Final repository state

Final HEAD and tree remain at the expected baseline.
Lockfile SHA-256 remains unchanged.
Pre-existing work and reports were preserved.

No GitHub publication, commit or staging occurred.
