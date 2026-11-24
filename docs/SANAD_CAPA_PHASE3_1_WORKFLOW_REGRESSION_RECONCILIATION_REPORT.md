# SANAD CAPA Phase 3.1 — Workflow Regression Reconciliation Report

## Disposition

**Complete.** Independent inspection confirmed that the five Phase 3 workflow failures were stale error-message expectations, not authorization or validation bypasses. The affected expectations now match the current intentional database errors. Added persistence-state assertions verify that rejected validation and role checks do not create or alter CAPA records, operation reservations, audit events, or notifications. The relevant Phase 3 and Phase 2 test gates, typecheck, and whitespace check pass.

This report reassesses Phase 3 as **Complete within its authorized source/test scope**. The Phase 3 report remains an unchanged historical record of its then-current partial disposition; this reconciliation report supplies the subsequent passing evidence. No Phase 4 or native/device acceptance was started.

## Baseline and pre-existing changes

| Item | Before Phase 3.1 changes |
|---|---|
| Repository | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2` |
| Branch | `migration/aes-guardian` |
| HEAD | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` |
| Worktree status | 296 entries: 34 tracked modifications/deletions, 262 untracked |
| Index | Clean; no staged changes |

`src/core/database/AesGuardianDatabase.ts` was already modified at baseline. `prevention-action-workflow.test.ts` was clean at baseline. Inspection of the actual source and tests, rather than relying on the Phase 3 explanation alone, established the following current contract:

- The test fixture uses synthetic demo users for `quality_staff`, `admin_reviewer`, `oh_professional`, `exposed_professional`, and `tech_admin`.
- `canManagePreventionActions` allows only authenticated `quality_staff`; the database independently checks the persisted role.
- CAPA reservation checks the role before payload normalization or reservation writes. Status updates check the role before querying or mutating the action.
- Individual declaration references matching `AES-YYYY-...` are rejected by payload normalization. The direct create path reserves only after this normalization succeeds.

## Five failure causes and verification

| Case | Stale expectation | Actual intentional contract | Verification |
|---|---|---|---|
| Individual `surveillance_reference` (`AES-2026-00042`) | Expected “must be an aggregate surveillance observation” | `createPreventionAction: surveillance_reference must not reference individual declarations.` | The input is rejected during normalization before reservation or CAPA persistence. Counts for CAPAs, operations, CAPA audit events, and CAPA notifications remain unchanged. |
| `admin_reviewer` create | Expected “Only quality_staff may create and manage prevention actions” | `reserveCapaCreationOperation: only quality_staff may create or recover prevention actions.` | Database role check rejects before reservation. Persistence counts remain unchanged. |
| `oh_professional` create | Expected the old create/manage wording | Same reservation-role rejection as above | Database role check rejects before reservation. Persistence counts remain unchanged. |
| `exposed_professional` create | Expected the old create/manage wording | Same reservation-role rejection as above | Read access is also denied by the database. The create call is rejected before reservation; persistence counts remain unchanged. |
| `tech_admin` create | Expected the old create/manage wording | Same reservation-role rejection as above | Read access is also denied by the database. The create call is rejected before reservation; persistence counts remain unchanged. |

The admin status-update assertion already matched the actual `Only quality_staff may manage prevention actions` error. It now also verifies that CAPA, operation, audit, and notification counts and the action status remain unchanged after the rejected update. The tests preserve meaningful specific-message assertions; none were reduced to generic rejection checks.

No authorization bypass, incorrect validation acceptance, mutation after rejection, operation-contract defect, or data-integrity defect was found in the inspected paths.

## Changes

Only `src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts` was modified:

- Replaced the five obsolete message patterns with the current specific validation/reservation errors.
- Added a typed persistence-count helper and assertions around validation and unauthorized create/update attempts.
- No production code, database contract, screens, dependencies, migrations, or unrelated tests were changed.

## Verification

Commands actually executed and results:

```text
npm test -- --runInBand --silent --testTimeout=30000 src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts --testNamePattern='Rejects surveillance_reference|admin_reviewer has read-only|oh_professional has read-only|exposed_professional is strictly|tech_admin is strictly'
Test Suites: 1 passed, 1 total
Tests:       5 passed, 18 skipped, 23 total

npm test -- --runInBand --silent --testTimeout=30000 src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/notification-e2e-journeys.test.ts src/features/aes-guardian/__tests__/notification-navigation.test.ts
Test Suites: 4 passed, 4 total
Tests:       144 passed, 144 total

npm test -- --runInBand --silent --testTimeout=30000 src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx src/features/aes-guardian/__tests__/prevention-action-detail-ui.test.tsx
Test Suites: 3 passed, 3 total
Tests:       65 passed, 65 total

npm test -- --runInBand --silent --testTimeout=30000 src/core/database/__tests__/capa-operation-idempotency.test.ts src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/demo-reset.test.ts src/core/database/__tests__/migration9.test.ts
Test Suites: 4 passed, 4 total
Tests:       55 passed, 55 total

npm test -- --runInBand --silent --testTimeout=30000 src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx
Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total

npm run typecheck
Passed (tsc --noEmit; exit code 0)

git diff --check
Passed (exit code 0)
```

The focused persistence tests use the repository's existing Node test adapter/mocks; they do not establish native SQLite or Android behavior. No full-project test suite, Android build, native/device acceptance, process-death recovery, or device crypto validation was run.

## Phase 3 completion reassessment

The required Phase 3 source/test criteria are now satisfied:

- Overview, Register, and Detail focused suites pass: 65/65 tests.
- Relevant durable-operation, notification, and navigation tests pass in the prescribed combined run: 144/144 tests.
- All five previously failing assertions pass; the additional focused CAPA persistence/reset set passes: 55/55 tests.
- The Phase 2 typed Create UI suite passes: 35/35 tests.
- Typecheck and `git diff --check` pass.
- No authorization or data-integrity defect remains unresolved within the tested scope.
- Pre-existing worktree entries remain present; only the authorized workflow test and this report were added to the status.

Accordingly, Phase 3 is reassessed as **Complete for the approved integration scope**. This does not claim native Android acceptance or that all project tests pass.

## Preservation verification

| Item | Before changes | After changes and report |
|---|---|---|
| Branch | `migration/aes-guardian` | `migration/aes-guardian` |
| HEAD | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` |
| Status entries | 296 (34 tracked, 262 untracked) | 298 (35 tracked, 263 untracked) |
| Index | Clean | Clean |

The two added status entries are this authorized test modification and this new report. The initial full status was captured outside the repository and compared after the test edit; no baseline entry disappeared. All pre-existing modifications and untracked files remain preserved. No files were staged or committed; no refs or branches were changed; no reset, clean, stash, checkout, or destructive operation occurred.

## Remaining limitations and recommended next gate

The focused test results do not validate native op-sqlite, Android runtime behavior, application process-death recovery, or device acceptance. The next step may be Phase 4 acceptance only under its separate authorization and after its required gate is satisfied; this phase did not perform or begin it.
