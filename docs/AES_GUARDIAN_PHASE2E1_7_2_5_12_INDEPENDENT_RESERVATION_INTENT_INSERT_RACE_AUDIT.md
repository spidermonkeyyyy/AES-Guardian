# AES Guardian — Phase 2E.1.7.2.5.12
## Independent Reservation Intent and Insert-Race Re-audit

## Executive recommendation

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**

The insert-race test and Stage A collision handling substantiate a real improvement:
a new exact-ID primary-key collision is converted to `CapaOperationIdCollisionError`.
The repository also has a working explicit `new`/`retry` API contract in the database
layer. However, the Create screen misclassifies initial newly reserved submissions:
it reserves the ID with `new`, then calls `createPreventionActionForOperation` with
`retry` instead of preserving `new` for that initial logical operation.

This means the UI can pass the wrong intent even though the database API itself rejects
missing intent. The Phase 2E.1.7.2.5.11 blocker is therefore not completely resolved.

## Repository identity and preservation

- Root: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No source or test file was modified during this read-only audit.
No GitHub operation, commit, staging, branch change or reset was performed.

## Changed-file inventory

Phase 2E.1.7.2.5.11 relevant files include:

- `src/core/database/AesGuardianDatabase.ts`
- `src/core/database/capa-operation-utils.ts`
- `src/core/database/types.ts`
- `src/core/database/index.ts`
- `src/core/index.ts`
- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/core/database/__tests__/capa-operation-idempotency.test.ts`
- `src/core/database/__tests__/capa-operation-entropy.test.ts`
- `src/core/database/__tests__/migration9.test.ts`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `src/localization/index.ts`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_11_RESERVATION_INTENT_INSERT_RACE_CORRECTION_REPORT.md`

Earlier Phase 2E.1.7.2.5.2–.10 implementation and reports remain in the working tree.

## Finding B1 — BLOCKER: Create-screen initial submission uses retry intent

**Source:** `PreventionActionCreateScreen.tsx`,
`handleSubmit()` around the new submission branch

When no active operation ID exists, the screen generates an ID and reserves it:

- calls `reserveCapaCreationOperation(...)` with `'new'`;
- receives the same pending operation;
- sets `activeOperationId`.

It then calls `createPreventionActionForOperation(...)` with `'retry'`.

This is incorrect because the Stage B call belongs to the original `new` logical
operation, not to a retry of an already retained submission.

**Consequences:**

- A retry-state intent is used for a first Stage B attempt.
- The intent contract is inconsistent across the two calls.
- An implementation of `createPreventionActionForOperation` could permit reconciliation
  or a different collision interpretation than the original `new` reservation.
- The UI tests do not prove that initial submission passes `new` to both Stage A and
  Stage B.

**Minimum corrective scope:**

- Track whether `activeOperationId` was newly generated or restored.
- Pass `'new'` for the initial generated operation.
- Pass `'retry'` only for:
  - an existing pending operation restored on remount/restart;
  - an uncertain outcome retry;
  - an explicitly retained original operation.
- Assert intent arguments in the Create UI tests.

## Finding B2 — MAJOR: fallback branch is absent but extra arguments are suspicious

**Source:** `PreventionActionCreateScreen.tsx`, submit block

The legacy fallback to `createPreventionAction(...)` is absent. This satisfies the
screen-side fallback requirement.

The submit block passes extra JavaScript arguments:

- reserve call supplies the intent twice;
- create call supplies the intent twice.

JavaScript ignores extra arguments, and the effective argument values are:

- reservation intent `'new'` at the actual intent parameter;
- creation intent `'retry'` at the actual intent parameter.

The duplicate arguments are not a security bypass, but they indicate a malformed
call shape and can confuse TypeScript/mock/test evidence.

**Minimum corrective scope:** remove duplicate arguments and pass the actual signature
only.

## Finding B3 — MAJOR: remount test proves state restoration, not process restart

**Source:** `prevention-action-create-ui.test.tsx`

The remount test uses mocked pending-operation data and verifies form/operation
restoration. It does not start a real process or reconstruct the actual database,
navigation stack and screen state together.

The repository test for operation reconstruction and the pending table provide stronger
source evidence, but no complete process-restart test is present.

**Minimum corrective scope:** add an integration test that closes/reconstructs the
database/repository and remounts the screen to recover pending/committed operations.

## API and intent contract

`reserveCapaCreationOperation()` and
`createPreventionActionForOperation()` require runtime intent values.

The types are explicit:

- `reservationIntent: 'new' | 'retry'`
- no implicit retry default.

`createPreventionAction()` is now a compatibility wrapper that generates a fresh
secure ID and passes `'new'`.

This prevents compatibility callers from selecting an old operation ID.

## Insert-race control flow

`reserveCapaCreationOperation()`:

1. validates exact operation ID;
2. performs exact-ID lookup;
3. if absent, checks pending-per-creator;
4. allocates a reference;
5. inserts the operation.

On an insert catch:

1. checks whether the exact operation ID now exists;
2. for `new`, throws `CapaOperationIdCollisionError`;
3. for `retry`, recursively reserves the exact original operation.

This preserves intent in the recursive catch and prevents a `new` operation from
being reconciled after another row wins the primary key.

The race test intercepts `NativeSQLiteAdapter.execute()` at the operation insert,
writes a competing operation row, then permits the original insert. It verifies:

- `CapaOperationIdCollisionError`;
- exactly one competing operation row remains;
- no competing CAPA or reconciliation is returned.

This is deterministic fault-injection, not genuine multi-connection concurrency.

## Compatibility caller audit

The compatibility wrapper's ordinary callers in tests and workflow code do not pass an
optional old operation ID. Those callers receive a fresh operation ID and `'new'`.

No repository caller was found that passes an old ID to `createPreventionAction()`.

The UI does not use the wrapper; it uses
`reserveCapaCreationOperation` and `createPreventionActionForOperation`.

## Create-screen audit

The legacy fallback is absent.

Normal success:

- no navigation before exact result reconciliation;
- result card appears;
- acknowledgement occurs only on explicit confirmation;
- navigation occurs after successful acknowledgement.

Recovered success:

- committed unacknowledged operations are listed;
- exact operation reconciliation is performed;
- same result card/confirmation is used;
- failed acknowledgement keeps state recoverable.

The remaining source defect is intent selection for initial Stage B submission:
the new operation should pass `'new'`, not `'retry'`.

## UUID and entropy audit

Source evidence:

- strict UUID-v4 validator;
- `randomUUID()` validation;
- `getRandomValues()` validation;
- all-zero/unusable output rejection;
- no `Math.random()` or weak fallback.

Native crypto API availability remains unverified.

## Migration 10 audit

Migration 10 adds nullable `acknowledged_at` and the unacknowledged index.

The Migration 10 test initializes through version 9, adds pending and committed
operation rows, applies migration 10 and asserts:

- pending remains pending;
- committed remains committed and linked;
- both have null acknowledgement;
- legacy CAPA remains;
- index exists.

Rollback/failure injection remains not directly tested.

## Stage B and reconciliation audit

Stage B remains transactionally atomic for:

- pending operation reload;
- payload/creator/status validation;
- CAPA insert;
- insert-ID validation;
- audit insert;
- notification insert;
- operation link;
- committed status;
- commit.

Reconciliation validates exact ID, creator, payload/hash, linked CAPA, reference,
audit and notification evidence.

Node SQLite tests are not proof of native bridge behavior.

## Verification

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- 4 suites passed
- 59 tests passed

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- 56 suites passed
- 1201 tests passed
- 0 failed

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 inherited diagnostics
- 0 changed-file diagnostics

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- Missing ESLLint 9 flat configuration.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Historical finding comparison

| Finding | Result |
|---|---|
| Insert-race false replay | **RESOLVED at Stage A source/test level**, with UI intent misuse remaining |
| Implicit retry default | **RESOLVED** in repository APIs |
| Legacy Create fallback | **RESOLVED** |
| Stage A intent loss | **PARTIALLY RESOLVED**: repository preserves intent; Create UI misuses retry |
| UUID validation | **RESOLVED** |
| Explicit presentation acknowledgement | **RESOLVED** |
| Migration 10 fixture quality | **RESOLVED**, rollback injection not added |
| Stage B uniqueness classification | **RESOLVED for recognizable reference conflicts** |

## Native limitations

- Native React cryptographic runtime availability is unverified.
- Native `@op-engineering/op-sqlite` commit/rollback behavior is unverified.
- Genuine multi-connection concurrency is unverified.
- Migration rollback injection is unverified.

## Final repository status

HEAD, tree and lockfile remain unchanged.
Pre-existing work and reports remain in the working tree.
No audit source/test change was made.

## Final decision

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**

The repository insert-race protection is materially improved and the deterministic race
test passes, but the Create screen passes retry intent for a newly reserved initial
logical operation. That explicit intent mismatch prevents source-level closure.

---

## Supplementary Re-audit — Current Direct Verification

This supplement records the direct source and test findings after comparing the
current Create-screen call arguments with the repository API signatures.

### BLOCKER — Initial Stage B intent mismatch

The Create screen first reserves a new operation with:

- `reservationIntent = 'new'`.

It then calls `createPreventionActionForOperation(...)` with an extra duplicate intent
argument. JavaScript passes the first intent argument encountered after the reference:
the screen supplies `'retry'`, and that becomes the actual intent in the repository
method signature. The generated and reserved ID is therefore used for Stage B with
`retry` instead of `new`.

This mismatch is source-visible and is not corrected by the result card or insert-race
test.

### BLOCKER — Duplicate call arguments

The Create screen passes extra arguments to:

- `reserveCapaCreationOperation(...)`;
- `createPreventionActionForOperation(...)`.

The repository methods declare five arguments. The screen call sites pass additional
arguments. JavaScript ignores excess arguments, so runtime behavior is unstable only
in intent clarity and maintainability: it can diverge silently if signatures change.
It does not satisfy the exact-signature requirement.

### Minimum corrective scope

- Make initial Stage A and Stage B both receive `'new'`.
- Resume an existing pending/uncertain operation with `'retry'`.
- Remove duplicate/extraneous arguments.
- Add UI test assertions for exact Stage A intent, Stage B intent and operation ID.
- Add a test that initial submission never reaches Stage B with `retry`.

### Confirmed insert-race result

The repository race catch now throws `CapaOperationIdCollisionError` for
`reservationIntent === 'new'` after an exact operation row appears.
For `retry`, the catch recursively resolves the exact retained operation.

The deterministic race test:

- intercepts the operation reservation insert;
- inserts a competing operation ID;
- verifies `CapaOperationIdCollisionError`;
- verifies exactly one competing operation row remains.

This is deterministic fault-injection evidence, not genuine concurrent SQLite testing.

### Current final decision

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**

The insert-race invariant is fixed at repository level, but the Create screen's initial
submission and duplicate call signatures prevent source-level closure.
