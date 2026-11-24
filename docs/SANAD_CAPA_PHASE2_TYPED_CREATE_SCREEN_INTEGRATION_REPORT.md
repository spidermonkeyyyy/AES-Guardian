# SANAD CAPA Phase 2 — Typed Create-Screen Integration Report

## Disposition

**Complete.** The Create screen uses the durable CAPA operation APIs through the typed database interface. This phase did not begin Phase 3.

## Changes

| File | Purpose |
|---|---|
| `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx` | Replaced unsafe database casts and optional-method fallbacks with typed API calls. Retained the exact reservation payload, operation ID, and reference for retries; enforced exact-ID reconciliation and verified acknowledgement before clearing operation state. |
| `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx` | Reworked the database mock so Stage A and Stage B are independent, and added/strengthened lifecycle, collision, recovery, retry, reconciliation, acknowledgement, and fresh-operation coverage. |
| `docs/SANAD_CAPA_PHASE2_TYPED_CREATE_SCREEN_INTEGRATION_REPORT.md` | Recorded this phase's results and preservation evidence. |

No database implementation, database exports, unrelated screens, Create-screen UI behavior outside the authorized lifecycle, recovered reference source, dependencies, or unrelated tests were changed by this phase.

## Lifecycle behavior

- **Initial submission:** Form validation and the synchronous submission lock run first. The screen creates one operation ID, calls Stage A once with explicit `new` intent, and verifies the returned operation ID, creator, pending status, reference, and payload. Stage B then receives that same ID, reference, and payload with explicit `new` intent. Stage B never reserves.
- **Stage A failure:** The failure is shown without treating a collision as success or proceeding to Stage B. Because the reservation outcome cannot be assumed after an error, the screen blocks another submission on that mount until the user leaves and returns through durable recovery.
- **Retry:** After a verified reservation exists, Stage B failures retain the exact ID, reference, and payload. Retrying calls Stage B with explicit `retry` intent and does not call Stage A or generate a new ID. Form fields are locked while that reservation is active.
- **Uncertain outcomes and recovery:** Pending and committed-but-unacknowledged operations are loaded through typed APIs. The screen checks the authenticated creator and parses the persisted payload. Pending operations continue through Stage B retry, which validates the reservation; committed operations are reconciled using exact operation ID, creator, and payload before presentation. Uncertain outcomes are reconciled only with `reconcileCapaCreationOperation`; reference-only reconciliation is removed.
- **Presentation and acknowledgement:** A persisted result is shown before the existing explicit confirmation action. The returned acknowledgement must match the operation ID and creator, be committed, and include an acknowledgement timestamp. Any error or invalid response retains the result and active operation. Only verified acknowledgement clears that state; the next submission generates a fresh ID.

## Regression coverage

The Create UI tests now use independent Stage A and Stage B mocks; Stage B no longer delegates to the legacy create API. Added and strengthened coverage proves:

- Stage A `new` runs once and Stage B `new` consumes that exact ID, reference, and payload without a second reservation.
- Stage A collision fails closed and never reaches Stage B.
- Concurrent presses produce only one logical submission.
- A Stage B failure followed by retry uses the same ID, reference, and payload, with `retry` intent.
- Uncertain outcomes use exact operation-ID reconciliation; a mocked legacy/reference-only match cannot produce a result.
- Pending recovery reuses its exact reservation; a reservation attributed to another creator is rejected.
- A committed, unacknowledged operation is reconciled by exact ID and presented without duplicate creation.
- Failed acknowledgement keeps the result for retry; successful acknowledgement retires the operation, and a subsequent new submission receives a fresh ID.
- Existing validation, navigation, localization, RTL, accessibility, and layout checks remain in the focused suite.

The existing database operation, notification-hardening, and reset regression suites were run without modifying them.

## Verification

Executed:

```text
npm test -- --runInBand --silent src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx src/core/database/__tests__/capa-operation-idempotency.test.ts src/core/database/__tests__/notification-workflow-hardening.test.ts src/core/database/__tests__/demo-reset.test.ts
Test Suites: 4 passed, 4 total
Tests:       134 passed, 134 total
Snapshots:   0 total

npm run typecheck
tsc --noEmit: passed

git diff --check
passed
```

The CAPA database tests use the repository's `NativeSQLiteAdapter` in Node. They are **not native op-sqlite validation**. The UI tests exercise typed database API mocks, not a device database.

No full test suite, Android build, device installation, or native acceptance was run. Native op-sqlite behavior, Android/runtime integration, device crypto and UUID behavior, native concurrency, and process-death/restart behavior remain unverified.

## Preservation verification

| Item | Before | After |
|---|---|---|
| Branch | `migration/aes-guardian` | `migration/aes-guardian` |
| HEAD | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` |
| Git status entries | 285: 26 tracked modifications/deletions, 259 untracked | 288: 28 tracked modifications/deletions, 260 untracked |

The two additional tracked changes are the authorized Create screen and its UI test. The additional untracked entry is this report. All pre-existing worktree modifications, deletions, and untracked files remain present. The Git index remained unchanged; no file was staged, no commit or ref/branch operation was performed, and no destructive Git operation was used.

## Next action

Stop here for review. Any subsequent CAPA cross-screen work requires its own explicit authorization; Phase 3 and native/device acceptance have not begun.
