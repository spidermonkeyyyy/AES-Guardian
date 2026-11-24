# SANAD CAPA Phase 2 — Create-Screen Integration Status

## Status: blocked before implementation

No Phase 2 source or test changes were made. Inspection found a concrete Phase 1 API contract defect that makes the required Stage A / Stage B flow fail for every new submission. The Phase 2 stop condition requires stopping rather than changing the database implementation or silently weakening the reservation invariant.

## Blocking evidence

The Create screen currently:

1. Generates an operation ID and calls `reserveCapaCreationOperation(..., 'new')` in `PreventionActionCreateScreen.tsx:239-257`.
2. Then calls `createPreventionActionForOperation(..., 'new')` in `:263-270`.

The database method `createPreventionActionForOperation` unconditionally calls `reserveCapaCreationOperation` again with the same intent (`AesGuardianDatabase.ts:3116-3139`). The reservation method treats any existing operation ID with `new` intent as a collision (`:2960-2966`). Therefore Stage B rejects the reservation created moments earlier in Stage A; it cannot reach the atomic CAPA/audit/notification transaction.

This also explains why the existing UI test did not expose the defect: `prevention-action-create-ui.test.tsx:94-100` configures `mockCreateForOperation` to delegate both `new` and `retry` to the legacy `mockCreatePreventionAction`, rather than representing operation-bound database behavior independently.

Other requested integration work remains pending, including removing the screen's `getDatabase() as any` casts (`PreventionActionCreateScreen.tsx:113, 239, 300`) and removing its reference-only reconciliation fallback (`:300-315`). These changes should follow once the Stage A / Stage B database API contract is corrected and explicitly authorized.

## API signatures inspected

- `reserveCapaCreationOperation(userId, input, operationId, preferredReference, intent): Promise<CapaCreationOperation>`
- `createPreventionActionForOperation(userId, input, operationId, explicitReferenceCode, intent): Promise<PreventionActionDetail>`
- `reconcileCapaCreationOperation(userId, operationId, input): Promise<PreventionActionDetail | null>`
- `listPendingCapaCreationOperations(userId): Promise<CapaCreationOperation[]>`
- `listUnacknowledgedCommittedCapaCreationOperations(userId): Promise<CapaCreationOperation[]>`
- `getCapaCreationOperation(userId, operationId): Promise<CapaCreationOperation | null>`
- `acknowledgeCapaCreationOperation(userId, operationId): Promise<CapaCreationOperation>`
- `createCapaCreationOperationId(): string`

`src/core/database/index.ts` exports `getDatabase(): AesGuardianDatabase`, and the root `src/core` barrel already re-exports the database API. No missing export was identified.

## Changes and verification

- Production files changed: none.
- Test files changed: none.
- Tests, typecheck, and diff checks were not run because implementation stopped at the authorized blocker.
- No test result from this blocked Phase 2 attempt is claimed.

## Git and preservation

- HEAD before and after: `fbbc94136652bd4f8efe1b8d1fa85e14932692ca`.
- Before worktree counts: 283 status entries (26 tracked modifications/deletions and 257 untracked), all pre-existing.
- After writing this report: 284 entries (26 tracked modifications/deletions and 258 untracked). The only new entry is this report; no other Phase 2 source or test file was modified.
- No staging, commit, branch/ref/index operation, destructive Git command, or unrelated modification occurred. Existing Phase 1 changes and all unrelated worktree changes were preserved.

## Required next authorization

Before Phase 2 integration can proceed, authorize a narrowly scoped Phase 1 API correction. The database must expose a safe Stage B operation that validates and consumes the exact already-reserved pending operation without treating it as a second `new` reservation, while preserving the rule that a genuinely new request cannot adopt an existing operation ID. Add database regression coverage proving both the successful Stage A→Stage B path and collision rejection. Once that API correction is complete, separately authorize continuation of Phase 2 typed Create-screen integration and its requested UI/database regression tests.

Phase 3 cross-screen regression and notification consistency is **not recommended yet**; the Create operation path must first be made executable end-to-end.
