# AES Guardian — Phase 2E.1.7.2.5.14
## Independent Create-Screen Intent Lifecycle Audit

## Executive recommendation

**CONDITIONALLY ACCEPTED — SOURCE-LEVEL CLOSURE WITH EXPLICIT NATIVE VALIDATION LIMITATIONS**

Phase 2E.1.7.2.5.13 resolves the source-level Create-screen intent mismatch:
initial Stage A and Stage B submit with `new`, restored/pending/uncertain operations
submit with `retry`, duplicate call arguments are removed, and the UI tests assert
intent and operation ID.

No source-level correctness blocker remains for this lifecycle. Native React crypto
availability and native `@op-engineering/op-sqlite` behavior remain explicitly
unverified.

## Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

Audit was read-only. No source, test, migration, configuration or documentation file
was changed except this report.

## API signature audit

`reserveCapaCreationOperation(...)` signature:

- `userId`
- `input`
- `operationId`
- `preferredReference: string | undefined`
- `reservationIntent: 'new' | 'retry'`

`createPreventionActionForOperation(...)` signature:

- `userId`
- `input`
- `operationId`
- `referenceCode`
- `reservationIntent: 'new' | 'retry'`

Both repository methods validate intent at runtime.
Both validate operation-ID UUID format.

The compatibility wrapper `createPreventionAction(...)`:

- generates a fresh secure operation ID;
- passes `new`;
- does not accept an optional old operation ID as a retry selector.

The Create screen no longer calls `createPreventionAction(...)`.

## New-submission lifecycle

The screen now:

1. generates one operation ID only if `activeOperationId` is absent;
2. sets explicit operation lifecycle state to `new`;
3. calls Stage A with:
   - exact operation ID;
   - canonical form of current input;
   - `new`;
4. preserves the same ID in `operationId` and `creationReference`;
5. calls Stage B with:
   - the same operation ID;
   - the same input;
   - `new`.

The duplicate/extraneous argument calls reported earlier are absent.

## Restored pending lifecycle

The mount/recovery effect loads pending and unacknowledged committed operations.

For one pending operation:

- exact persisted operation ID is restored;
- canonical payload is restored;
- reference is restored;
- operation lifecycle is set to `retry`;
- Stage B uses `retry`;
- no new ID is generated.

For multiple recoverable operations, the screen blocks arbitrary selection.

Malformed persisted payload JSON blocks recovery safely instead of selecting another
operation.

## Uncertain-outcome lifecycle

Before Stage A, no `operationId` exists and no retry intent is set.

After Stage A succeeds:

- the exact ID and reference are retained;
- catch paths set lifecycle intent to `retry`;
- subsequent retry paths preserve the original ID;
- uncertain reconciliation uses the exact operation-ID repository method.

Generic Stage B errors after reservation set retry intent and preserve the operation.
The UI does not generate a replacement ID for the same submission.

Before/after repository reservation states are distinguishable because
`creationReference.current`/`operationId` are set only after the reservation returns.

## Post-acknowledgement lifecycle

Acknowledgement:

- requires explicit confirmation;
- is not called on mount, state commit or navigation;
- calls the repository by exact operation ID;
- navigation occurs only after persistence succeeds.

After acknowledgement:

- the operation is removed from unacknowledged recovery;
- the Create screen normally unmounts through navigation;
- a later genuine submission generates a fresh ID;
- `new` is used for both Stage A and Stage B.

## Insert-race source/test evidence

At Stage A:

- an existing exact ID with `new` throws `CapaOperationIdCollisionError`;
- an exact-ID insert collision after precheck throws collision for `new`;
- `retry` allows reconciliation of the exact original operation;
- changed creator/payload remains integrity/conflict error.

The deterministic test intercepts `NativeSQLiteAdapter.execute()`:

- precheck sees no operation;
- a competing operation is inserted for the same ID;
- the original insert proceeds;
- collision is expected;
- exactly one competing row remains;
- no competing CAPA or result is returned.

This is deterministic fault injection, not genuine multi-connection concurrency.

## UI test assertion audit

The UI suite asserts:

- initial Stage A is called with `new`;
- initial Stage B is called with `new`;
- restored pending operation does not call Stage A and resumes Stage B with `retry`;
- uncertain reconciliation uses the exact operation ID;
- mount/recovery does not acknowledge before confirmation;
- explicit confirmation calls acknowledgement;
- failed acknowledgement keeps the result visible and permits retry;
- no navigation occurs before acknowledgement.

The test suite should still be strengthened to assert:

- Stage A and Stage B payload objects are identical;
- uncertain retry never generates a second ID;
- post-acknowledgement next submission receives a new ID.

These are evidence gaps, not confirmed source-level defects.

## Reconstruction evidence

The test creates a pending operation and constructs a new
`AesGuardianDatabase` over the same `NativeSQLiteAdapter`/in-memory repository state.
It verifies:

- pending operation remains listable;
- exact operation ID is recovered;
- `retry` completes once;
- replay returns the same CAPA ID.

It does not close and reopen the same on-disk native database. It is therefore
repository reconstruction evidence, not physical process-restart evidence.

## Previous safeguard audit

Preserved:

- UUID-v4 validation;
- secure entropy fail-close;
- no weak operation-ID fallback;
- insert-race collision handling;
- exact retry reconciliation;
- Stage B transaction atomicity;
- audit/notification evidence;
- Migration 9/10 compatibility;
- legacy CAPA compatibility;
- role boundaries;
- explicit presentation acknowledgement.

## Verification

### Focused tests

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- 4 suites passed
- 60 tests passed

### Full Jest suite

`npm test -- --runInBand`

- Exit: `0`
- 56 suites passed
- 1204 tests passed
- 0 failed

### TypeScript

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 inherited SANAD diagnostics
- 0 changed-file diagnostics

### Lint

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 cannot find a flat ESLint configuration.

### Diff

`git diff --check`

- Exit: `0`

## Native and concurrency limitations

- Native React crypto availability remains unverified.
- Production `@op-engineering/op-sqlite` commit/rollback semantics remain unverified.
- Genuine two-connection SQLite concurrency remains unverified.
- Real process restart/native database reopen remains unverified.

These are bounded verification limitations, not source-level lifecycle blockers.

## Repository preservation

HEAD, committed tree and lockfile are unchanged.
No audit source/test/configuration modification occurred.
Pre-existing working-tree changes and reports remain preserved.

## Final findings

| Finding | Severity |
|---|---|
| Initial Stage A uses `new`; initial Stage B uses `new`; intent mismatch corrected | RESOLVED |
| Duplicate extraneous UI call arguments | RESOLVED |
| Restored pending operation uses `retry` | RESOLVED |
| Uncertain outcome preserves operation ID and retry intent | RESOLVED |
| New submission after acknowledgement uses fresh ID and `new` | SOURCE-CORRECT / TEST GAP |
| Real process/native database reconstruction | INFORMATIONAL LIMITATION |
| Native crypto/SQLite semantics | INFORMATIONAL LIMITATION |

## Final decision

**CONDITIONALLY ACCEPTED — SOURCE-LEVEL CLOSURE WITH EXPLICIT NATIVE VALIDATION LIMITATIONS**

There is no source-level CAPA lifecycle blocker in the implementation reviewed.
The remaining conditions are bounded native/runtime and full physical process-restart
verification gaps, not source correctness defects.
