# AES Guardian — Phase 2E.1.7.2.5.6
## Independent Durable CAPA Operation Identity & Migration 9 Acceptance Audit

## Executive decision

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**

Migration 9 and the exact-operation reconciliation model are substantial improvements,
but the implementation is not safe enough for acceptance. Three decisive findings remain:

1. **BLOCKER — weak operation-ID fallback**
   `createCapaOperationId()` silently uses `Math.random()` when secure crypto is unavailable.
   This can generate a duplicated operation ID and is not fail-closed.
2. **BLOCKER — restart recovery cannot discover uncertain/committed operations**
   The Create screen only lists `pending` operations. A process termination after commit,
   or after commit/readback ambiguity, can leave a `committed` operation with an ID that
   the remounted screen cannot rediscover.
3. **BLOCKER — legacy/reference-only reservation can inherit an existing operation**
   `reserveCapaCreationOperation()` has a branch that matches a reference plus creator
   plus payload without a caller-supplied operation ID and returns that existing operation.
   A separate logical operation with the same visible reference and identical payload can
   therefore be false-matched unless the normal UI always supplies an explicit ID.
   The repository API has optional operation-ID support and existing callers may omit it.

The implementation is **not** accepted for cross-screen closure.

## Repository identity and read-only verification

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD verified: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- `package-lock.json` SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

The initial HEAD observed directly was:
`c81a50c98e4e7330fad479a51a48a2fea7f912a1`.

The Git status contained the implementation changes and existing report/source
untracked files. No source or test file was edited during this audit.
No commit, staging, reset, branch change, dependency change, remote operation or
emulator launch was performed.

## Files and functions inspected

- `src/core/database/AesGuardianDatabase.ts`
  - Migration 9
  - `createCapaCreationOperationId`
  - `normalizeCapaCreationPayload`
  - `allocateCapaVisibleReference`
  - `listPendingCapaCreationOperations`
  - `reserveCapaCreationOperation`
  - `createPreventionAction`
  - `reconcileCapaCreationOperation`
  - `reconcilePreventionActionCreation`
  - demo reset
- `src/core/database/capa-operation-utils.ts`
- `src/core/database/types.ts`
- `src/core/database/DatabaseService.ts`
- `src/core/database/NativeSQLiteAdapter.ts`
- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/core/database/__tests__/capa-operation-idempotency.test.ts`
- `src/core/database/__tests__/migration9.test.ts`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `src/core/database/__tests__/notification-workflow-hardening.test.ts`
- Migration/reset/database/E2E/CAPA workflow tests.

## Migration 9 assessment

### PASS — Additive migration and schema version

`CURRENT_SCHEMA_VERSION` is `9`, and migration 9 is appended after migrations 1–8.
The migration test initializes through version 8, applies migration 9, verifies the
table exists, verifies legacy CAPA preservation and records schema version 9.

This is direct actual-v8-to-v9 coverage.

### PASS — Table constraints

The operation table has:

- primary-key `operation_id`;
- unique linked-CAPA ID;
- unique visible reference;
- pending-only unique partial index per creator;
- creator, status and linked-CAPA foreign-key relationships.

The migration leaves `prevention_actions.reference_code` unchanged and gives legacy
CAPAs no operation identity.

### PASS — Reset compatibility

Demo reset now deletes operation records before linked prevention actions and reseeds
inside the same transaction. No orphaned-operation source evidence was found.
Foreign keys are enabled in `DatabaseService.open()`.

### PARTIAL — Migration failure behavior

The migration runner uses a SQLite migration transaction and records the schema version
inside that transaction. Source behavior is consistent with full rollback on migration
failure, but native bridge failure semantics remain unverified.

## Operation-ID entropy assessment

### BLOCKER — Weak fallback

The generator is:

```text
crypto.randomUUID()
crypto.getRandomValues()
Math.random() 16 bytes
```

Source evidence:

- `createCapaOperationId()` supports `randomUUID`.
- It supports `getRandomValues`.
- It also silently emits a `-fallback` string from `Math.random()`.
- No explicit secure-entropy availability check rejects fallback.
- No test disables crypto and verifies fail-closed behavior.

The fallback is not collision-resistant operation identity. Two independent submissions
can receive the same fallback ID. The primary-key constraint can make a second insertion
hit the existing record, and the reservation code would compare creator/payload. If all
match, it would return the existing operation as an exact replay.

This is the adversarial same-ID/same-creator/same-payload collision described in the
audit authority and is not prevented.

**Minimum corrective requirement:** remove the weak fallback. Require a verified secure
runtime crypto API. If no acceptable API is available, fail before reservation and
do not generate or persist an operation ID. Cover unavailable-entropy behavior with
a deterministic test.

## Durable reservation analysis

### PARTIAL/PASS — Stage A

Source evidence supports:

- operation ID before reservation;
- canonical payload and payload hash persisted;
- visible reference persisted;
- pending record written before Stage B;
- exact operation ID lookup on retry;
- creator and canonical payload verification;
- pending record remains outside Stage B transaction.

Reservation ambiguity reconciles exact operation ID by querying the operation record.

### BLOCKER — Reference/payload/creator fallback in reservation

In `reserveCapaCreationOperation()`, this branch exists:

- no caller operation ID;
- preferred reference found;
- exactly one operation row with that reference;
- same creator;
- same payload hash and canonical payload;
- then return the existing pending/committed operation.

This branch never proves the incoming call is the same logical operation. It substitutes
creator, payload and visible reference for operation identity.

It is reachable through `createPreventionAction()` because `operationId` is optional.
Many legacy repository calls and tests call `createPreventionAction()` without an
operation ID. A reference collision or supplied reference could hit the branch.

**Minimum corrective requirement:** make operation ID mandatory for logical creation
or ensure that calls without an ID always generate a newly reserved opaque operation
and can never inherit an existing operation solely through reference/payload/creator.

## Stage B and transaction analysis

### PASS — Atomic transaction shape

Within one `DatabaseService.transaction()`:

- pending operation is reloaded;
- creator/payload/status are revalidated;
- CAPA row is inserted;
- inserted ID is validated;
- creation audit is inserted;
- creation notification is inserted;
- operation is updated to committed and linked to the CAPA ID;
- COMMIT follows.

Prevention-action, audit, notification and operation link are therefore in the same
transaction callback.

### PASS — Pre-commit rollback

Notification-failure injection and audit-failure injection produce transaction rollback
tests in `notification-workflow-hardening.test.ts`. These tests demonstrate zero
partial CAPA/audit/notification records in Node SQLite.

The exact Stage-A pending reservation is also verified by
`reservation is durable while a Stage B transaction rolls back`.

### PASS — Readback ambiguity

The operation row is committed atomically with the linked CAPA. Post-commit readback
failure can be reconciled through exact operation ID and exact linked row.
The test mocks readback after a real Node SQLite commit.

### PARTIAL — Commit/rollback adapter evidence

`DatabaseService` starts the transaction before a try block:

- begin failure occurs outside callback and no rollback attempt;
- callback/commit/rollbacks are caught;
- commit exceptions trigger rollback attempt;
- rollback failure is swallowed.

This leaves pending reservation intact because reservation is separate.
It can leave commit ambiguous, but exact operation reconciliation can recover if the
transaction actually committed.

Native adapter behavior and bridge promise propagation remain unverified.

## Reference collision and concurrency analysis

### PASS — Legacy and operation-reference collisions

`allocateCapaVisibleReference()` checks both:

- existing `prevention_actions.reference_code`;
- existing `capa_creation_operations.reference_code`.

It replaces a collided reference and persists the replacement on the same operation.
No unrelated operation ID or payload is substituted.

Tests cover legacy and separate-operation reference collisions with controlled values.

### PARTIAL — Stage A race

Preflight plus unique constraints protect reference allocation. A concurrent reference
insert can lose on the unique operation-reference index.

The losing reservation currently returns its database insert error instead of
automatically allocating and persisting a replacement. This can remain uncertain or
require caller retry, but it does not create a duplicate. It is not false success.

**Severity: MEDIUM**. Minimum corrective requirement: explicitly classify reference
unique conflicts and retry allocation within a serial reservation transaction.

### NOT VERIFIED — Two Stage B operations racing

The unique CAPA reference and operation reference constraints serialize winners,
but no concurrent test proves race behavior.

The retry catch detects a unique constraint and allocates a replacement, then recursively
retries the same operation. It does not change operation ID or payload.

Concurrent behavior is source-supported only and not directly tested.

## Canonical payload and reconciliation

### PASS — Normalization

The canonical payload includes:

- trimmed title;
- trimmed description;
- action type;
- contributing factor;
- trimmed rationale;
- normalized optional surveillance reference;
- normalized optional target date.

Null/undefined/omitted/empty optional values converge to `null`.
JSON field ordering is fixed. Hash and canonical JSON are persisted.

### PASS — Exact reconciliation

`reconcileCapaCreationOperation()`:

- loads exact operation ID;
- checks creator;
- compares canonical payload and hash;
- distinguishes pending and committed;
- requires linked CAPA ID;
- loads exact linked CAPA;
- verifies all business fields and reference;
- verifies creation audit evidence;
- verifies creation notification evidence.

It does not fall back to creator/payload/reference for success.

### PARTIAL — Missing audit/notification test coverage

Source distinguishes missing evidence as uncertain.
The old reference-based hardening suite tests missing creation audit/notification
after a reference-only action was created, but the new operation-ID reconciliation
path does not have explicit delete-audit/delete-notification tests.

## Restart and navigation recovery

### PASS — Pending remount

The Create screen loads all `pending` operations for the quality creator.
One pending operation restores the original payload, reference and operation ID.
Multiple pending operations block submission.

The repository also enforces at most one pending operation per creator with a
partial unique index.

### BLOCKER — Committed restart/uncertain recovery

`listPendingCapaCreationOperations()` excludes committed operations.
No operation journal/listing for uncertain or committed recovery is exposed to the UI.
After process termination:

- pending operation: restorable;
- committed operation after normal success: app can navigate away and does not need
  recovery;
- committed operation after post-commit readback ambiguity: the operation record
  is committed, but `operationId` and uncertain state are React-only and lost;
- remounted screen: no pending operation to restore, so the operation cannot be rediscovered.

This prevents the UI from deterministically reconciling the ambiguous operation after
restart.

**Minimum corrective requirement:** expose pending and recoverable committed/uncertain
operations through durable SQLite recovery APIs and restore or present the original
operation ID. Do not require payload/reference heuristics.

### PARTIAL — Navigation away

Pending operation state remains in SQLite. Normal navigation away/back remount restores
it when one pending row exists. No test for navigation away/back is mapped directly;
the remount test is equivalent for component state but not navigation lifecycle.

### PARTIAL — Changed form values

Changed form values on a restored pending operation are sent with the original operation
ID. `reserveCapaCreationOperation()` rejects payload mismatch. This prevents an altered
payload from being silently committed under the original operation. The UI generic error
does not offer a dedicated conflict-resolution path.

**Severity: MEDIUM**. Minimum corrective requirement: show a precise localized
payload-conflict state and require explicit discard/start-new operation.

## Legacy compatibility and reset

### PASS — Legacy CAPA preservation

The migration test proves an existing CAPA survives Migration 9 unchanged.
No legacy row receives an operation ID or operation-table record.
The existing lifecycle methods operate on legacy CAPAs.

### PASS — Demo reset

Reset deletes operation records before linked CAPAs and reseeds within the transaction.
The reset test suite passed in the full run.

## Adversarial test matrix

| Scenario | Classification | Evidence |
|---|---|---|
| Same ID, same payload | PASS | `capa-operation-idempotency.test.ts`: same operation ID and payload returns same CAPA |
| Same ID, changed payload | PASS | `same operation ID with changed payload is rejected` |
| Same ID, different creator | PASS | `same operation ID with a different creator is rejected` |
| Different IDs, identical payload | PASS | `distinct operation IDs with identical payload create separate CAPAs` |
| Committed replay | PASS | Same-ID test calls replay and verifies one ID |
| Repository reconstruction | PASS | `operation identity survives repository reconstruction` |
| Weak entropy unavailable | FAIL | No test or fail-closed behavior; fallback uses `Math.random()` |
| Simulated ID collision | FAIL | No test forces secure-ID collision with identical payload |
| Legacy reference collision | PASS | `collision with a legacy CAPA reference allocates a replacement` |
| Other pending reference collision | PASS | `collision with another operation never returns its CAPA` |
| Concurrent reservation | NOT VERIFIED | No concurrency test |
| Stage B rollback | PASS | Reservation remains pending in `reservation is durable while a Stage B transaction rolls back` |
| Audit insertion failure | PASS | Existing hardening test verifies zero partial records in Node SQLite |
| Notification insertion failure | PASS | Existing hardening test verifies zero partial records in Node SQLite |
| Commit succeeds/readback fails | PARTIAL | Node SQLite mocked post-commit readback test passes; native bridge unverified |
| Operation commit/link fails | PARTIAL | Operation update is in same transaction; no direct injected update-failure test |
| Missing linked CAPA | PARTIAL | Source throws integrity error; no direct test deletes the link/CAPA |
| Missing audit evidence | PARTIAL | Source uncertain; old reference reconciliation test, no new operation-ID test |
| Missing notification evidence | PARTIAL | Source uncertain; old reference reconciliation test, no new operation-ID test |
| Process/repository restart pending | PASS/PARTIAL | Repository reconstruction test plus pending remount UI test; no process restart test |
| Screen remount | PASS | Remount test restores one pending operation |
| Navigation away/back | PARTIAL | Source and remount test support behavior; no direct navigation lifecycle test |
| Multiple pending records | PASS/PARTIAL | UI blocks arbitrary selection; DB partial index is source-enforced, no multi-record injection test |
| Migration 8 to 9 | PASS | Actual initialization-through-8 then apply-9 test |
| Legacy compatibility | PASS | Migration test preserves existing row |
| Demo reset | PASS | Reset/E2E suites pass |

## Production adapter/native limitations

`DatabaseService.ts` uses `@op-engineering/op-sqlite`, enables WAL and foreign keys,
executes `BEGIN;`, callback statements and `COMMIT;`, and attempts rollback.

Verified from source:

- reservations are durable in SQLite before Stage B;
- Stage B callback operations are one SQLite transaction;
- commit success is followed by reconciliation;
- native close/reopen preserves named database state by source path.

Not verified:

- native bridge behavior after a commit succeeds but a promise throws;
- begin failure/connection closure timing;
- rollback failure semantics;
- production WAL/foreign-key behavior under process death;
- physical process termination immediately between reservation and transaction.

The test suite uses `NativeSQLiteAdapter` and Node `node:sqlite`, not the production
native package. No emulator or physical device was launched.

## Regression verification

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- Suites: `3 passed`
- Tests: `39 passed`

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- Suites: `55 passed`
- Tests: `1181 passed`
- Failed: `0`
- Skipped: `0`

A passing suite does not prove the blocking entropy, false-replay or restart findings.

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 diagnostics
- 0 changed-file diagnostics in the implementation paths
- The remaining diagnostics are historical inherited SANAD diagnostics.

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 did not find `eslint.config.js`, `.mjs` or `.cjs`.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Remaining defects

### 1. BLOCKER — Weak operation ID fallback

- **Evidence:** `capa-operation-utils.ts` uses `Math.random()` with no secure fallback.
- **Consequence:** independent submissions may share an operation ID and be replayed.
- **Minimum corrective requirement:** fail closed if secure entropy is unavailable.

### 2. BLOCKER — Committed ambiguous operations are undiscoverable after restart

- **Evidence:** UI recovery lists only pending operations.
- **Consequence:** process restart after commit/readback ambiguity loses the
  operation-identity recovery path.
- **Minimum corrective requirement:** durable recovery list for all operations requiring
  reconciliation, with exact operation ID and payload.

### 3. BLOCKER — Optional-ID/reference fallback can inherit existing operation

- **Evidence:** `reserveCapaCreationOperation()` matches existing
  reference/creator/payload when no exact operation ID is supplied.
- **Consequence:** separate logical submission can be false-matched to an existing
  operation when it has a colliding reference and identical payload.
- **Minimum corrective requirement:** exact operation ID mandatory for logical creation,
  or no reference/payload fallback when operation ID is absent.

### 4. MEDIUM — Reservation collision race is not automatically replacement-safe

- **Evidence:** a race can make the operation-table reference insert unique-conflict.
- **Consequence:** caller receives conflict rather than a replacement; no duplicate,
  but recovery UX is incomplete.
- **Minimum corrective requirement:** reserve and collision allocation atomically or
  retry allocation with explicit conflict classification.

### 5. MEDIUM — Missing direct adversarial and native tests

- **Evidence:** no secure-entropy, concurrency, update-failure, missing-evidence,
  restart-uncertain or native adapter test in the implementation suite.
- **Consequence:** critical behavior is source-supported or Node-SQLite-supported only.
- **Minimum corrective requirement:** add deterministic test cases before re-audit.

## Exact final repository status

HEAD remains:
`c81a50c98e4e7330fad479a51a48a2fea7f912a1`

Tree remains:
`983733927b18bf30b8377f84c9c1813c74c4bf6b`

Lockfile SHA-256 remains:
`59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No audit file or implementation file was modified during the audit beyond the report
creation itself.

## Final disposition

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**

The implementation is not accepted for cross-screen CAPA closure until:

1. operation ID generation fails closed without secure entropy;
2. no optional-ID/reference/payload fallback can inherit another logical operation;
3. committed/uncertain operations are rediscoverable after restart.
