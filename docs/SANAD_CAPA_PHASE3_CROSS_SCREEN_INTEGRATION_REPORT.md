# SANAD CAPA Phase 3 — Cross-Screen Integration Report

## Final disposition

**Partially complete.** The Overview, Register, and Detail integration changes are implemented and their focused UI, durable-operation, and notification-navigation checks pass. The complete existing CAPA workflow regression suite was also run and has five failures caused by expectations that do not match the pre-existing, already-modified database implementation. Those unrelated database and test contracts were not changed in this phase.

Phase 4 and native/device acceptance have not begun.

## Baseline and preservation

| Item | Initial | Final |
|---|---|---|
| Repository | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2` | unchanged |
| Branch | `migration/aes-guardian` | `migration/aes-guardian` |
| HEAD | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` |
| Git status entries | 288: 28 tracked modifications/deletions, 260 untracked | 295: 34 tracked modifications/deletions, 261 untracked |

The complete initial porcelain status was captured at `%TEMP%\sanad-phase3-status-before.txt`. The final status differs only by six authorized tracked screen/test files and this new report. No pre-existing worktree entries were removed or overwritten. In particular, `src/core/database/AesGuardianDatabase.ts` and other previously modified or untracked project files were preserved.

The Git index is unchanged. No files were staged, no commits were made, no refs or branches were changed, and no reset, clean, stash, checkout, or other destructive Git operation was performed.

## Files changed in Phase 3

| File | Purpose |
|---|---|
| `src/features/aes-guardian/screens/PreventionOverviewScreen.tsx` | Reads persisted CAPA status totals and the existing aggregate surveillance declaration total together; refreshes on navigation focus and shows no partial statistics on either query's failure. |
| `src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx` | Refreshes the filtered persisted register when regaining navigation focus. Existing status/type/factor filters, localized status/date presentation, stable integer CAPA navigation, and role-gated create control remain in place. |
| `src/features/aes-guardian/screens/PreventionActionDetailScreen.tsx` | Refreshes persisted detail on focus; rejects invalid runtime action IDs before database access; exposes persisted audit rows with stable test IDs. Existing database status transition and audit APIs remain authoritative. |
| `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx` | Tests persisted CAPA/declaration metrics, empty/loading/error/retry/focus behavior, and accurate localized title alignment. |
| `src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx` | Tests persisted status refresh on focus while retaining existing filter/navigation coverage. |
| `src/features/aes-guardian/__tests__/prevention-action-detail-ui.test.tsx` | Tests invalid IDs, focus refresh, chronological persisted audit presentation, and localized title alignment. |
| `docs/SANAD_CAPA_PHASE3_CROSS_SCREEN_INTEGRATION_REPORT.md` | This report. |

No database implementation, API contract, Create-screen lifecycle, unrelated screen, dependency, or Git index content was changed in Phase 3.

## Integration results

### Overview

CAPA totals and the four canonical status counts come from `getPreventionOverview(userId)`. A separate “total declarations” value comes from the existing authorized `getSurveillanceDashboardMetrics(userId)` aggregate. These values are displayed as distinct statistics; no incident-to-CAPA relationship is implied. Both queries must succeed before either set of statistics is presented. Empty CAPA data, loading, failure, retry, and focus refresh are covered.

The data model does not expose a supported CAPA-to-incident foreign-key relationship. Therefore no CAPA-linked incident trend, causal analysis, percentage, prediction, or effectiveness metric was invented.

### Register

The Register continues to query `listPreventionActions` with typed canonical filters for status, action type, and contributing factor. It presents persisted references, descriptions, status badges, categories, and localized deadlines. It passes the persisted numeric CAPA `id` to Detail, not the display reference, and refreshes the current filters when it regains focus after Create or Detail.

Search and sort controls, priority, responsible-person fields, and an overdue calculation were not present in the existing screen/model, so this phase did not fabricate or add them. The current record type does not provide priority or an assignee. No unsupported due-date interpretation was introduced; completed actions are not locally classified as overdue.

### Detail

Detail loads through `getPreventionActionById(userId, actionId)`, handles invalid IDs, missing records, load failures, and retry, and refreshes persisted status and audit history on focus. The database query orders audit events by `occurred_at ASC, id ASC`; the UI displays those persisted rows in that order. Status controls use `isValidPreventionTransition`, and `updatePreventionActionStatus` enforces authorization, validates transitions, and writes status, audit, and notification data transactionally.

Detail navigation and reads use stable persisted action identity. References are display identifiers only; the screens do not use reference-only reconciliation. Durable operation UUID and acknowledgement lifecycle remain managed by the Phase 2 Create/recovery APIs. The current register/detail read interfaces do not provide an operation-metadata lookup by action ID, so no operation UUID or acknowledgement state is fabricated for legacy records or added to these screens.

The data model does not contain linked incident IDs, assignee, priority, progress percentage, or effectiveness-evaluation fields. Those values are not displayed. Existing audit event descriptions and timestamps are shown as persisted; actors or events are not synthesized.

### Cross-screen and authorization

Overview→Register navigation and Register→Detail navigation retain existing routes. Returning to Overview/Register/Detail refreshes persisted data. UI tests verify the Register passes the selected CAPA ID and that status/audit data refreshes. The Node database workflow and operation suites separately verify persisted creation/list/detail/overview, operation identity, and status/audit behavior.

Create remains unchanged. Its acknowledgement/recovery lifecycle is not duplicated. Read access is hidden for unauthorized roles in the UI, while database APIs continue enforcing read and mutation roles. Detail status mutation still checks the current authenticated context and relies on the database/business layer for final authorization.

## Verification

Commands and actual results:

```text
npm test -- --runInBand --silent --testTimeout=30000 src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx src/features/aes-guardian/__tests__/prevention-action-detail-ui.test.tsx
Test Suites: 3 passed, 3 total
Tests:       65 passed, 65 total

npm test -- --runInBand --silent --testTimeout=30000 src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/notification-e2e-journeys.test.ts src/features/aes-guardian/__tests__/notification-navigation.test.ts
Test Suites: 3 passed, 3 total
Tests:       121 passed, 121 total

npm test -- --runInBand --silent --testTimeout=30000 src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts --testNamePattern="Calculates prevention overview accurately|Audit log records creation and status change events"
Test Suites: 1 passed, 1 total
Tests:       2 passed, 21 skipped, 23 total

npm run typecheck
tsc --noEmit: passed

git diff --check
passed
```

The complete relevant workflow/operation/notification run was also executed:

```text
npm test -- --runInBand --silent --testTimeout=30000 src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/notification-e2e-journeys.test.ts src/features/aes-guardian/__tests__/notification-navigation.test.ts
Test Suites: 1 failed, 3 passed, 4 total
Tests:       139 passed, 5 failed, 144 total
```

All five failures are in the unchanged `prevention-action-workflow.test.ts` expectations against the pre-existing modified `AesGuardianDatabase.ts`: one expects older surveillance-reference validation wording, and four expect older quality-staff authorization wording. The current implementation rejects those requests; the failures are message-pattern mismatches, not authorization bypasses. The database source was already modified at baseline. This phase did not alter either file or weaken/change those tests. The two directly relevant aggregate/audit tests pass when selected.

An initial UI test attempt stalled because the navigation mocks returned a new object on each render after adding focus subscriptions. The mocks were made stable with listener cleanup; the final focused screen run above completed successfully.

## Limitations and remaining blockers

- The five pre-existing database workflow assertion mismatches remain unresolved and prevent claiming a completely green full CAPA regression run. Correcting database error-contract expectations is outside this phase's screen-only scope.
- UI tests use mocked screen APIs. CAPA database tests use the repository's `NativeSQLiteAdapter` under Node; these are not native op-sqlite validation.
- No Android build, native/device acceptance, real process-restart test, device crypto validation, or live multi-screen runtime session was performed.
- The model does not support CAPA-linked incident analysis or priority/assignee/effectiveness displays. No relationship or value was inferred.

## Recommended next phase

Review the five stale workflow-test expectations and authorize any database-contract/test reconciliation separately. After review, Phase 4 may be separately authorized for native/device acceptance. Neither activity was started here.
