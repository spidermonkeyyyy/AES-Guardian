# SANAD CAPA Phase 1.1 — Stage A / Stage B Contract Correction

## Result

The Stage A reservation / Stage B consumption contract is corrected without weakening new-operation collision handling. Stage B now loads the exact persisted operation and verifies creator, canonical payload/hash, reference, status, and linked-action state before entering the existing atomic transaction. It no longer calls `reserveCapaCreationOperation`.

The legacy `createPreventionAction` API now explicitly performs Stage A and passes that reservation into Stage B, preserving its public signature and existing callers.

## Behavior after the correction

- **Stage A `new`:** unchanged. Inserts a pending operation; an existing ID or insert race still fails as a collision.
- **Stage A `retry`:** unchanged. Reuses only the exact existing creator/payload reservation.
- **Stage B `new` or `retry`:** requires exactly one existing reservation for the supplied operation ID; validates creator, canonical payload and hash, reference, status, and pending linkage. Missing or inconsistent reservations fail closed.
- **Committed operation:** returns only after exact operation-ID reconciliation verifies the linked CAPA, audit event and notification; no second CAPA is created.
- **Atomic writes:** CAPA, audit, notification and operation commit/link remain in the existing transaction. Failure injection confirms pending reservation and absence of partial Stage B records after rollback.
- **Legacy wrapper:** reserves a fresh secure operation, then consumes it through Stage B. Its existing arguments and return type are unchanged.

## Files changed for this correction

- `src/core/database/AesGuardianDatabase.ts` — separated reservation from consumption; updated the legacy `createPreventionAction` wrapper to perform both stages explicitly.
- `src/core/database/__tests__/capa-operation-idempotency.test.ts` — added Stage A→B, no-second-insert, missing-reservation, exact retry, collision, mismatched creator/payload/reference, duplicate prevention, rollback and reference-only rejection coverage.
- `src/core/database/__tests__/demo-reset.test.ts` — updated linked-operation setup to reserve before Stage B.
- `src/core/database/__tests__/notification-workflow-hardening.test.ts` — updated the uncertain-outcome case to reserve before Stage B.

The test files other than the idempotency suite already had Phase 1 changes in the worktree before this correction. The idempotency suite and utility were pre-existing untracked files. No Create screen, UI test, recovered source, or unrelated feature was changed.

## Regression coverage

The added/adjusted tests establish that:

- Stage A `new` followed by Stage B `new` succeeds and Stage B does not issue another reservation insert.
- Stage A still rejects reuse of an existing operation ID with `new`.
- Stage B `new` and `retry` both fail without a prior reservation.
- Wrong reference, payload, or creator cannot consume another reservation.
- Stage B retry can consume the exact pending reservation.
- Repeated committed Stage B calls return the same reconciled result and leave one CAPA, audit record and notification.
- Insert failures across the Stage B writes roll back, leaving the reservation pending.
- Reference-only reconciliation cannot establish durable operation identity.
- Existing reset and notification rollback behavior remains covered.

## Verification

Command:

```text
npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/core/database/__tests__/demo-reset.test.ts src/core/database/__tests__/notification-workflow-hardening.test.ts src/core/database/__tests__/notification-workflow.test.ts
```

**Result:** 6 suites passed; 123 tests passed; 0 failed.

`npm run typecheck` passed. `git diff --check` passed for tracked changed files; `git diff --no-index --check -- NUL src/core/database/__tests__/capa-operation-idempotency.test.ts` passed for the pre-existing untracked idempotency test.

These database tests use `NativeSQLiteAdapter` backed by Node `node:sqlite`. They do not prove native op-sqlite behavior, native concurrency, process-death/restart behavior, device crypto, or Android runtime behavior. No full test suite, Android build, or device operation was run.

## Git and preservation

- HEAD before and after: `fbbc94136652bd4f8efe1b8d1fa85e14932692ca`.
- Before the correction: 284 worktree status entries (26 tracked modifications/deletions and 258 untracked files). This included pre-existing Phase 1 edits in `AesGuardianDatabase.ts`, `demo-reset.test.ts`, and `notification-workflow-hardening.test.ts`, as well as many unrelated existing files.
- After writing this report: 285 entries (26 tracked modifications/deletions and 259 untracked files). The additional entry is this report; the targeted test edits were made within already-modified or already-untracked files.
- No staging, commits, branch/ref/index changes, destructive Git operations, screen/UI test changes, recovered-source changes, or unrelated modifications occurred.

## Next step

Resume **Phase 2 typed Create-screen integration** after review and separate authorization. Do not begin Phase 3 or native/device acceptance as part of this correction.
