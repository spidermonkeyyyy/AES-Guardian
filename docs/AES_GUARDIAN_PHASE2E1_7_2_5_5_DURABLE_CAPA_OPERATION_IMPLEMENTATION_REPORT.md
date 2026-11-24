# AES Guardian — Phase 2E.1.7.2.5.5
## Durable CAPA Operation Identity and Migration 9 Implementation Report

## Final status

**IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT RE-AUDIT**

This report records implementation only. It does not declare the independent CAPA
finding closed or accepted.

## 1. Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- Initial and final HEAD:
  `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Initial and final committed tree:
  `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Initial and final `package-lock.json` SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No remote fetch, pull, push, commit, staging, branch change, merge, rebase,
  reset, clean, stash or dependency change occurred.

Initial pre-existing tracked modifications and untracked reports/source files were
preserved. The exact initial manifest is retained in this implementation session
and the final status was compared against it.

Pre-existing untracked reports:

- `docs/AES_GUARDIAN_PHASE0_2_DEDICATED_REPOSITORY_REVIEW.md`
- `docs/AES_GUARDIAN_PHASE0_3_LOCAL_BASELINE_VERIFICATION.md`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_2_CAPA_CORRECTIVE_REENTRY_REPORT.md`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_3_CAPA_CROSS_SCREEN_REAUDIT.md`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_4_DURABLE_CAPA_IDEMPOTENCY_DESIGN.md`

Pre-existing untracked source:

- `src/features/aes-guardian/prevention-date-format.ts`
- `src/features/aes-guardian/__tests__/prevention-date-format.test.ts`

## 2. Migration 9 schema design

Schema version is now `9`.

Migration 9 appends one additive table:

`capa_creation_operations`

- `operation_id TEXT PRIMARY KEY`
- `created_by_user_id INTEGER NOT NULL REFERENCES demo_users(id)`
- `payload_json TEXT NOT NULL`
- `payload_hash TEXT NOT NULL`
- `reference_code TEXT NOT NULL`
- `status TEXT NOT NULL CHECK(status IN ('pending', 'committed'))`
- `prevention_action_id INTEGER UNIQUE REFERENCES prevention_actions(id)`
- nullable only on a pending operation
- created/updated UTC timestamps

Indexes/constraints:

- unique reference code across operation records;
- unique pending operation per creator using a partial SQLite index;
- status/updated-at index.

Migration 9 does not alter `prevention_actions`, historical migrations or existing
reference-code uniqueness. Legacy CAPA rows remain unchanged and receive no operation
record or fabricated operation ID.

No CAPA-table `operation_id` column was added. This keeps the relationship normalized:
the operation table owns the unique operation identity and the unique link to the
committed CAPA. It avoids a second relationship to maintain.

The operation table is deleted atomically during demo reset before linked
`prevention_actions` are deleted, preserving foreign-key integrity.

## 3. Operation lifecycle

Only two authoritative states are used:

| State | Meaning |
|---|---|
| `pending` | The logical operation is durably reserved but has not been confirmed committed |
| `committed` | The operation is transactionally linked to an exact CAPA row |

No transient failure is stored permanently as failed or uncertain. An uncertain
result remains a reconciliation outcome, not a database lifecycle state.

The pending-per-creator partial index enforces at most one pending operation per
creator. This is the documented recovery policy. If multiple pending records already
exist, the UI blocks arbitrary recovery selection.

## 4. Operation identity generation

`createCapaOperationId()` is in
`src/core/database/capa-operation-utils.ts`.

It uses:

1. `crypto.randomUUID()` when available;
2. `crypto.getRandomValues()` to construct UUID v4 when available;
3. a local random fallback only when neither facility is available.

The current RN runtime/dependency environment is not required to introduce a package.
The fallback is not a claim of native cryptographic guarantee; operation collisions
are additionally prevented by the primary-key UNIQUE constraint and reservation
reconciliation.

The payload canonical form is deterministic JSON containing normalized title,
description, action type, contributing factor, rationale, optional target date,
and optional surveillance reference.

An implementation SHA-256 helper produces `payload_hash`. Canonical JSON is also
persisted, enabling exact mismatch detection. Payload hash alone is not identity.

## 5. Stage A — operation reservation

`reserveCapaCreationOperation()`:

- verifies `quality_staff`;
- normalizes and validates the payload;
- generates or accepts an explicit operation ID;
- verifies an existing operation ID belongs to the creator;
- verifies creator, canonical payload, and hash for retries;
- applies the one-pending-operation-per-creator policy;
- allocates a visible reference that is not used by another CAPA or operation;
- persists the pending operation before Stage B.

An existing exact operation row is reused. An exact operation ID with changed payload
or creator is rejected with typed conflict/integrity errors.

Ambiguous reservation insertion reconciles the exact operation ID instead of creating
a replacement identity.

## 6. Stage B — atomic CAPA transaction

`createPreventionAction()` now accepts an explicit fourth `operationId` argument.
Existing repository calls remain source-compatible through the optional argument.

Within one transaction:

1. re-load and verify the exact pending operation;
2. verify creator, payload hash and canonical payload;
3. allocate/check the operation's visible reference;
4. insert `prevention_actions`;
5. validate a positive safe integer insert ID;
6. insert `prevention_action_created` audit evidence;
7. insert `capa_created` notification evidence;
8. update the operation to `committed`;
9. link `prevention_action_id`;
10. commit all records together.

Pre-commit rollback leaves the pending reservation intact and no CAPA/audit/
notification/committed link. Post-commit readback is reconciled by operation ID.

## 7. Reference-collision handling

Before reservation and again before transaction insertion:

- legacy and new CAPA reference rows are checked;
- operation-table reference rows are checked;
- the same operation may retain its existing reference;
- an unrelated reference collision causes deterministic replacement allocation;
- the replacement is persisted on the same operation record;
- no unrelated CAPA is returned as a reconciliation result.

Deterministic tests inject the replacement reference through
`createPreventionActionReferenceCode()`. Random chance is not used for collision
coverage.

## 8. Exact reconciliation

`reconcileCapaCreationOperation()`:

- loads the operation ID exactly;
- verifies creator and canonical payload/hash;
- distinguishes pending versus committed;
- follows the operation's unique linked CAPA ID;
- verifies row payload and reference;
- verifies creation audit evidence;
- verifies creation notification evidence;
- returns the exact linked CAPA or remains uncertain.

Payload mismatch and creator mismatch are integrity/conflict errors, not
uncertain outcomes or duplicate success.

Missing audit/notification evidence remains uncertain rather than false success.
The existing reference-only reconciliation method now detects operation-table
references first, preserving compatibility for legacy calls.

## 9. Create-screen integration

`PreventionActionCreateScreen.tsx` now:

- loads pending operations from SQLite on mount;
- restores exactly one pending operation's payload, reference and operation ID;
- blocks submission when more than one pending operation exists;
- reserves a pending operation before Stage B;
- retries using the same operation ID;
- restores pending form data after remount/restart;
- reconciles committed/pending/uncertain outcomes by operation ID;
- preserves existing uncertain-state locking and navigation behavior;
- preserves global role state, accessibility labels, RTL handling and date formatting.

The operation table is authoritative; React state and refs are presentation/recovery
convenience only.

Navigation away does not delete the pending operation. On remount or process restart,
the database pending-operation recovery list restores the operation.

If multiple pending operations exist, implementation policy is deterministic blocking:
no arbitrary pending operation is selected. The existing partial index normally
prevents this state for new writes.

## 10. Production SQLite considerations

`DatabaseService.ts` uses `@op-engineering/op-sqlite`, WAL, foreign keys,
`BEGIN;`, callback execution, `COMMIT;`, and `ROLLBACK;` on caught errors.

The wrapper cannot independently prove the native bridge outcome if commit returns
an exception after SQLite has committed. Operation reconciliation is therefore
used to recover state exactly.

The test-only `NativeSQLiteAdapter.ts` uses Node `node:sqlite`. It proves SQLite
transaction state and in-memory operation persistence but does not establish native
bridge promise/commit semantics.

No emulator or physical device was launched. Native commit ambiguity remains an
explicit verification limitation.

## 11. Added and changed implementation files

### New files

- `src/core/database/capa-operation-utils.ts`
- `src/core/database/__tests__/capa-operation-idempotency.test.ts`
- `src/core/database/__tests__/migration9.test.ts`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_5_DURABLE_CAPA_OPERATION_IMPLEMENTATION_REPORT.md`

### Primary implementation changes

- `src/core/database/AesGuardianDatabase.ts`
- `src/core/database/types.ts`
- `src/core/database/index.ts`
- `src/core/index.ts`
- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`

### Related tests updated

- `src/core/database/__tests__/database.test.ts`
- `src/core/database/__tests__/migration8.test.ts`
- `src/core/database/__tests__/notification-workflow-hardening.test.ts`
- `src/features/aes-guardian/__tests__/notification-e2e-journeys.test.ts`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

Existing Phase 2E.1.7.2.5.2 implementation files and earlier reports remain.

## 12. Automated test evidence

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- Suites: `3/3 passed`
- Tests: `39/39 passed`

### Previously failing regression suites

Exact command covered:

`database.test.ts`, `migration8.test.ts`, `notification-e2e-journeys.test.ts`,
and `prevention-action-workflow.test.ts`

- Exit: `0`
- Suites: `4/4 passed`
- Tests: `136/136 passed`

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- Test suites: `55 passed, 55 total`
- Tests: `1181 passed, 0 failed, 0 skipped`
- Snapshots: `0 total`
- Time: `124.386 s`

The previous Notification Centre issue did not fail in this run. It was not changed
for this implementation and is not declared fixed.

## 13. Required verification

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- Diagnostics: `769`
- Changed-file diagnostics: `0`
- All 769 remain inherited SANAD module diagnostics, matching the historical baseline.
- The repository-wide project is not TypeScript-clean.

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 stopped because no `eslint.config.js`, `.mjs`, or `.cjs` exists.
- No lint-rule finding count was emitted.

### Diff

Exact command:

`git diff --check`

- Exit: `0`
- No whitespace errors.

Migration 9 and operation tests ran through the genuine Node SQLite adapter.
No native emulator/device validation was performed.

## 14. Required test coverage

Covered by implementation tests:

- same operation ID/same payload replay;
- changed payload rejection;
- changed creator rejection;
- distinct operation IDs with identical payload;
- repeated committed replay;
- repository reconstruction;
- legacy reference collision;
- other-operation reference collision;
- post-commit readback uncertainty;
- pending reservation surviving Stage B rollback;
- Migration 9 application from schema 8;
- existing CAPA survival;
- operation unique constraints;
- Create-screen pending remount recovery;
- Create-screen multiple-pending blocking;
- pre-existing role boundary workflow tests;
- migration/reset compatibility tests.

Native bridge commit semantics remain unverified.

## 15. Final repository state

Final HEAD and tree remain unchanged from the baseline.
The lockfile SHA-256 remains unchanged.
All implementation changes are confined to CAPA operation, migration, tests,
exports, reset compatibility and Create-screen recovery.

No source/test file outside the scoped implementation was modified as part of this
phase, apart from baseline migration expectation updates required by Migration 9.

No commit or GitHub publication occurred.

## 16. Completion statement

**IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT RE-AUDIT**

The implementation adds durable operation identity, Migration 9, exact operation
reconciliation, reference-collision handling, restart-safe pending recovery and
atomic operation/CAPA/audit/notification commit.

Independent audit is still required to determine whether finding B and
cross-screen behavior are accepted.
