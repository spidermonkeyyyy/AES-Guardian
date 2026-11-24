# AES Guardian — Phase 2E.1.7.2.5.8
## Independent Operation Recovery Acceptance Audit

## Executive recommendation

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**

The implementation removes the `Math.random()` operation-ID fallback and adds durable
pending/committed recovery and acknowledgement. However, the acceptance evidence does
not establish two required invariants:

1. The operation-ID generator validates malformed and unusable `randomUUID` output.
2. Result acknowledgement is tied to a sufficiently conservative presentation event,
   not merely React state/render commit.

The implementation also has incomplete direct Migration 9-to-10 and invalid-output test
coverage. Because these are source-level acceptance defects, this is **BLOCKED**, not
conditionally accepted.

## Repository identity and preservation

- Root: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No remote operation, branch/history operation, source edit, test edit or dependency
change was performed during this audit.

## Phase 2E.1.7.2.5.7 changed inventory

Primary new or materially changed implementation and tests:

- `src/core/database/capa-operation-utils.ts`
- `src/core/database/__tests__/capa-operation-entropy.test.ts`
- `src/core/database/__tests__/capa-operation-idempotency.test.ts`
- `src/core/database/__tests__/migration9.test.ts`
- `src/core/database/AesGuardianDatabase.ts`
- `src/core/database/types.ts`
- `src/core/database/index.ts`
- `src/core/index.ts`
- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `src/core/database/__tests__/notification-workflow-hardening.test.ts`
- `src/core/database/__tests__/database.test.ts`
- `src/core/database/__tests__/migration8.test.ts`
- `src/features/aes-guardian/__tests__/notification-e2e-journeys.test.ts`
- Migration 10 implementation and related schema expectations.
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_7_OPERATION_IDENTITY_AND_COMMITTED_RECOVERY_CORRECTION_REPORT.md`

Pre-existing Phase 2E.1.7.2.5.2 CAPA corrections, earlier reports, formatter source and
other prior tracked modifications remain in the working tree.

## Findings

### BLOCKER 1 — Invalid `randomUUID` output is accepted

**Severity:** BLOCKER

**Evidence:** `src/core/database/capa-operation-utils.ts`,
`createCapaOperationId()`

The generator checks that `randomUUID` returned a string with length greater than zero,
but does not validate:

- UUID shape;
- valid hexadecimal characters;
- UUID version/variant;
- 128-bit length;
- malformed or static test output.

It may therefore return an invalid non-empty string. `reserveCapaCreationOperation()`
only checks length <=128; it does not require a UUID format.

The entropy test uses a valid-looking ID but has no invalid-output case.
No test proves that malformed output fails before reservation.

**Consequence:** A broken or mocked crypto implementation can generate an accepted
identifier that is not an adequate UUID and may break the security/uniqueness contract.
The implementation is fail-closed only for unavailable or throwing APIs, not malformed
API output.

**Minimum corrective scope:** Validate `randomUUID()` output against a strict UUID
shape, then fail with the typed entropy error for malformed output. Apply the same
format validation to the explicit-ID repository boundary. Add tests for empty,
malformed, oversized, static and throwing output. Prove no operation row is written.

### MAJOR 1 — Recovered-result acknowledgement may precede actual presentation

**Severity:** MAJOR

**Evidence:**
`src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`

The UI performs reconciliation, calls `setRecoveredCommittedAction(action)`, renders
`prevention-create-recovered-committed`, and a second effect calls
`acknowledgeCapaCreationOperation()`.

This is an effect tied to React state, not a verified paint/user-visible presentation
event. It can execute after React commit but before an observable frame or in a state
where a later lifecycle interruption prevents the card from being visible.

The repository acknowledgement revalidates exact operation, linked CAPA, payload,
audit and notification evidence, and is idempotent. It is also not applied to pending
operations. These controls are good, but the presentation gate is insufficient.

**Consequence:** A process interruption after React commit or acknowledgement may
leave the successful result acknowledged before the user could reliably observe it.
The operation would then be excluded from recovery even though presentation was
interrupted.

**Minimum corrective scope:** Define and implement a durable positive confirmation
event that is demonstrably later than visible presentation, such as an explicit
"Result confirmed" action or a documented screen-lifecycle/presentation promise that
the prototype can establish. The card itself must remain recoverable until that event
completes. Add process-interruption tests around it.

### MAJOR 2 — Normal success does not present and acknowledge the operation immediately

**Severity:** MAJOR

**Evidence:** `PreventionActionCreateScreen.tsx` handleSubmit

After `createPreventionActionForOperation()` succeeds, the screen calls
`navigation.goBack()` and does not acknowledge the operation.

The operation remains `committed`, `acknowledged_at NULL`, and is discovered later
when the Create screen remounts.

This does prevent false result loss, and repeated remount recovers the exact operation,
but it means the original successful navigation is not itself the presentation event.
The later recovered-result card becomes the only acknowledgement path.

**Consequence:** Normal user success is recovered as an unresolved card instead of
being acknowledged immediately after known success. This is a conservative state
model, but the UI should explicitly distinguish that normal success was not
acknowledged and why it will be recovered.

**Minimum corrective scope:** Either acknowledge normal success only after an exact
presented-state event, or maintain an explicit presentation state for successful
navigation and defer acknowledgement until the screen definitively presents it.

### MINOR 1 — Migration test does not migrate a real committed operation from v9 to v10

**Severity:** MINOR

**Evidence:** `src/core/database/__tests__/migration9.test.ts`

The test initializes through schema 8, inserts a legacy CAPA, then runs migrations
9 and 10. It verifies `acknowledged_at` exists and legacy records survive.

It does not construct an existing Migration 9 `capa_creation_operations` row and verify
that Migration 10 preserves it with `acknowledged_at NULL`.

Source `ALTER TABLE ADD COLUMN` is the correct SQLite behavior, but direct test
coverage is incomplete.

**Minimum corrective scope:** Add an actual version-9 database fixture containing
pending and committed operation rows, apply version 10, and assert row/payload/status/
link preservation and null acknowledgement.

### MINOR 2 — Reference allocation lacks a direct controlled-unique-conflict test

**Severity:** MINOR

**Evidence:** `capa-operation-idempotency.test.ts`,
`controlled operation-reference race replaces reference for same operation`

The test pre-inserts a different pending operation and then expects allocation to
replace the preferred reference. It does not create a real concurrent insert or inject
a unique-constraint failure at the reservation insert itself.

The bounded loop exists, but this scenario is not a genuine race proof.

**Minimum corrective scope:** Inject a deterministic unique-constraint exception
from the operation insert or, where supported, execute concurrent reservations in
two adapter connections. Verify the same operation ID/payload and exactly one row.

### INFORMATIONAL 1 — React Native crypto availability remains unverified

**Severity:** INFORMATIONAL

No emulator or native device was launched. It is unverified that React Native 0.76.9,
the Hermes/JSC runtime, and Metro expose a usable `crypto.randomUUID` or
`crypto.getRandomValues`.

The fail-closed behavior is source-correct, but a release build could stop CAPA creation
if neither API is available.

## Secure operation identity audit

### Source evidence

`src/core/database/capa-operation-utils.ts`

- No `Math.random()` or fallback operation-ID expression remains.
- No timestamp/counter/static fallback remains.
- `randomUUID` is preferred.
- `getRandomValues` is used to construct UUID v4 if `randomUUID` is unavailable.
- Exceptions throw `CapaOperationEntropyUnavailableError`.
- No reservation/API call occurs after entropy failure.

### Missing evidence

- `randomUUID` output is not format-validated.
- Invalid `getRandomValues` output is not externally testable beyond runtime behavior.
- The entropy test has unavailable and throwing API cases but no malformed return.
- There is no no-reservation assertion coupled to entropy failure beyond function-level
  isolation.

### Caller contract

`createCapaCreationOperationId()` is the new-ID source.

`createPreventionActionForOperation()` rejects an empty explicit ID.
`reserveCapaCreationOperation()` requires an explicit ID parameter.
`createPreventionAction()` is a compatibility wrapper that generates a fresh ID for
each omitted-ID invocation.

The wrapper does not search by reference/creator/payload. It also permits callers to
pass an operation ID in the fourth argument, but that ID is validated as exact retry
by payload/creator rather than being adopted by heuristics.

## Migration 10 audit

Migration 10 appends one column and one index:

- `acknowledged_at TEXT`, nullable;
- index `(created_by_user_id, status, acknowledged_at)`.

Existing rows receive null acknowledgement under SQLite `ALTER TABLE`.
The migration is appended after migration 9 and uses the existing migration transaction.
It does not use `PRAGMA user_version` for schema tracking.
Legacy CAPA rows are untouched.

Migration test `runs from schema version 8 and preserves existing CAPA rows`
does prove schema 8-to-10 preservation, table creation and the new column.
It does not prove migration of an existing operation record.

## Acknowledgement semantics

The repository acknowledgement method:

- loads exact operation ID;
- rejects wrong creator;
- rejects pending or missing-link operations;
- parses canonical payload;
- reconciles exact linked CAPA and evidence;
- updates `acknowledged_at` only under exact status/link/creator predicates;
- returns the already acknowledged operation idempotently.

Missing/inconsistent evidence prevents acknowledgement.
Failed acknowledgement leaves `acknowledged_at NULL`, except if a separate concurrent
caller updates it first. Concurrent acknowledgement is idempotent.

The UI effect occurs after state commit. It does not prove durable frame/visual
presentation. This is the significant acceptance gap.

## Six-scenario recovery matrix

| Scenario | Database state | Next-launch result | Assessment |
|---|---|---|---|
| Reservation succeeds; stop before Stage B | Pending operation only | Pending listed exactly by creator/ID | PASS |
| Stage B commits; stop before readback | CAPA/audit/notification/committed link persisted | Unacknowledged committed operation listed | PASS |
| Commit succeeds; readback throws | Same committed state | Exact operation reconciliation/linked CAPA recovers | PASS |
| Readback succeeds; stop before presentation | Committed, unacknowledged | Exact operation remains recoverable | PASS |
| Result presented; stop before acknowledgement | Committed, unacknowledged if persistence has not run | Exact recovery remains available | PASS/PARTIAL |
| Acknowledgement persists; stop afterward | Committed, acknowledged | Excluded from unresolved recovery | PASS |

The UI no-acknowledgement gap is not a duplicate risk; it is primarily a presentation
acknowledgement precision issue.

## False-replay and caller audit

All repository creation paths were inspected.

The reference/creator/payload fallback that inherited an existing operation was removed.

`createPreventionActionForOperation()` enforces a non-empty operation ID.
`reserveCapaCreationOperation()` requires an exact operation ID and verifies:

- creator;
- canonical payload;
- payload hash;
- existing operation status/reference.

It does not adopt a record through reference, creator and payload alone.

The compatibility wrapper generates a fresh ID for omitted-ID invocations.
The Create screen uses `createCapaCreationOperationId()` before reservation and passes
that exact ID to `createPreventionActionForOperation()`.

Reference-only `reconcilePreventionActionCreation()` remains read-only compatibility;
it can reconcile an exact operation record or legacy reference, but does not create or
invent an identity.

## Reference collision and bounded retry

The Stage A loop:

- validates both operation references and CAPA references;
- distinguishes pending-per-creator and reference unique conflicts;
- allocates a replacement for the same operation ID;
- retries no more than five times;
- propagates unrelated database errors.

The Stage B unique catch is broader than reference-only: it treats any `UNIQUE` error
as a reference collision and retries after allocating a replacement. This is a source
classification weakness.

The only likely operation-specific conflicts in Stage B are the CAPA reference and
operation link constraints, but the implementation does not classify SQLite constraint
names precisely before retry.

No bounded retry test demonstrates multi-connection concurrency. The existing test is
a sequential collision setup.

## Transaction and reconciliation integrity

The Stage B transaction includes:

- exact pending operation reload;
- CAPA insert;
- insert-ID validation;
- creation audit;
- creation notification;
- operation link and committed status update;
- commit.

Pre-commit failure leaves the pending operation record.
Existing Node SQLite tests verify pre-commit audit/notification rollback.
The post-commit readback test is Node SQLite with a mocked readback method.

Exact reconciliation verifies:

- exact operation ID;
- creator;
- canonical payload/hash;
- status;
- linked CAPA ID;
- reference and all business fields;
- audit evidence;
- notification evidence.

Missing evidence is uncertain or integrity-failing rather than successful.

Native `@op-engineering/op-sqlite` transaction and bridge semantics remain unverified.

## Adversarial test matrix

| Scenario | Result |
|---|---|
| Secure entropy unavailable | PASS |
| Secure API throws | PASS |
| Invalid secure entropy output | NOT TESTED / FAIL |
| No reservation after entropy failure | PARTIAL |
| Missing explicit ID | PASS |
| Same payload/preferred reference, distinct IDs | PASS |
| Exact operation-ID retry | PASS |
| Changed payload | PASS |
| Changed creator | PASS |
| Legacy reference collision | PASS |
| Other operation reference collision | PASS |
| Bounded retry exhaustion | NOT DIRECTLY TESTED |
| Non-reference DB error not retried | NOT DIRECTLY TESTED |
| Pending acknowledgement rejected | PASS |
| Repeated acknowledgement idempotent | PASS |
| Missing linked CAPA | PASS |
| Missing creation audit | PASS |
| Missing creation notification | PASS |
| Wrong linked CAPA payload/reference | PASS |
| Committed unacknowledged restart | PARTIAL |
| Already acknowledged excluded | PASS |
| Multiple unresolved operations | PARTIAL |
| Malformed persisted payload | SOURCE SAFE/UI BLOCKS |
| Complete application restart scenarios | NOT DIRECTLY TESTED |
| Genuine concurrent reservation | NOT TESTED |
| Native crypto/bridge behavior | NOT TESTED |

## Verification results

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- Suites: `4 passed`
- Tests: `51 passed`

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- Suites: `56 passed`
- Tests: `1193 passed`
- Failed: `0`

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 diagnostics
- Changed-file diagnostics: `0`

No changed-file TypeScript diagnostic is attributed to Phase 2E.1.7.2.5.7.

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- Missing ESLint 9 flat configuration.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Native/runtime limitations

- React Native availability of `crypto.randomUUID`/`crypto.getRandomValues` is unverified.
- Native `@op-engineering/op-sqlite` commit/rollback/bridge semantics are unverified.
- No emulator or physical device was used.
- Genuine concurrent reservation was not tested.

These are limitations, not substitutes for source-level defects.

## Comparison against the three previous blockers

### 1. Weak operation-ID entropy fallback

Source: **SOURCE-CLOSED**, with a remaining malformed-output validation defect.

The weak fallback is removed and secure APIs fail closed. However, invalid non-empty
`randomUUID` output is accepted, so this blocker is not fully resolved.

### 2. Committed operations undiscoverable after interruption

**RESOLVED AT SOURCE/TEST LEVEL** for pending and committed/unacknowledged operations.

Pending and committed-unacknowledged records are persistent and creator-scoped.
UI recovery handles a single operation and blocks multiple recoverable operations.
The complete process-restart UI test is absent, but repository state/listing is direct
and the source does not use React-only state as authority.

### 3. False replay through absent operation identity

**RESOLVED**

The false-reference/payload/creator fallback is removed.
Explicit operation-ID creation exists and exact retries are bound to operation ID.
The compatibility wrapper creates fresh IDs for genuinely new calls.

## Final repository status

HEAD, tree and lockfile remain at the expected values.
The working tree retains the implementation and prior report changes.
No audit modification was made beyond this report.

## Final decision

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**
