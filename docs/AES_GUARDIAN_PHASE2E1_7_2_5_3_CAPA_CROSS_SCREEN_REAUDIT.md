# AES Guardian — Phase 2E.1.7.2.5.3 CAPA Cross-Screen Acceptance Re-audit

## Final recommendation

**BLOCKED**

The independent re-audit does not accept cross-screen CAPA closure while the creation
reference and reconciliation contract remain vulnerable to reference collision ambiguity.
The implementation passes A, C, D (with native-device limitations), E (with native-device
limitations), and F at source/test level, but B is not sufficiently resolved for closure.

## Audit scope and independence

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- `package-lock.json` SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No remote operation, source edit, test edit, schema edit, commit, branch change, or reset was used for this re-audit.
- No audit defect was corrected.

## Corrective acceptance matrix

| Finding | Result | Independent evidence |
|---|---|---|
| **A — Overview identity and authorization** | **PASS** | Overview uses the global Zustand active role, separates read access from quality-only management, has active-role localization, request-version and active-context guards, generic localized error text, and retry. Five-role UI tests pass; stale-role-result protection passes. Repository methods separately enforce role boundaries. |
| **B — Uncertain creation and idempotent reconciliation** | **BLOCKED** | Stable references improve same-mounted-screen retry, transaction evidence, and reconciliation, but no persisted operation identity proves which request generated a reference. SQLite uniqueness plus a small random reference space and volatile screen state leave a collision/remount bypass. |
| **C — Overview failure and race handling** | **PASS** | Raw database error detail is not rendered, retry is available, request-version checks reject stale responses, and role/context switches invalidate old outcomes. |
| **D — Create accessibility and RTL** | **PARTIAL PASS** | All five Create inputs have localized accessibility labels. `AesOptionCard` uses `row-reverse` and logical `marginEnd` for RTL. Jest assertions cover labels/layout-direction. Native TalkBack/VoiceOver and physical RTL rendering were not exercised. |
| **E — Detail back navigation and arrow** | **PARTIAL PASS** | Detail explicitly uses `direction="back"` and `navigation.goBack()`. Back selects arrow-left in LTR and arrow-right in RTL; forward remains the default for Register and Welcome. Jest verifies icon names and labels. Physical native navigation/accessibility behavior was not exercised. |
| **F — UTC and localized date formatting** | **PASS WITH LIMITATIONS** | Strict calendar/date validation, UTC date-only construction, UTC-qualified timestamp formatting, FR/EN/AR locale maps, and null handling are used for Register and Detail target/record/audit dates. Focused tests passed under both positive and negative process time zones; no near-midnight device-level scenario or native locale configuration was exercised. |

## Finding B: decision evidence

### Transaction and persistence evidence

Migration 7 defines `prevention_actions.reference_code TEXT NOT NULL UNIQUE`.
This is a real SQLite UNIQUE constraint, not only application validation.
The application also accepts and validates only `CAPA-\d{4}-\d{5}`.

CAPA creation:

- generates `CAPA-<localYear>-<fiveDigits>` using
  `Math.floor(Math.random() * 90000) + 10000`;
- permits the Create screen to supply one `useRef`-held reference repeatedly;
- reconciles an exact-reference row before transaction insertion;
- validates the returned `insertId` as a positive safe integer;
- inserts CAPA, creation audit, and creation notification in one transaction;
- verifies persisted readback, creator, payload, creation audit, and notification evidence;
- throws `PreventionActionCreationUncertainError` when exact reconciliation cannot be proven.

The reconciler distinguishes:

- zero rows: confirmed absence, permitting the caller to retry after UI reconciliation;
- one exactly matching row with complete evidence: successful reconciliation;
- multiple rows, payload mismatch, missing audit/notification, or readback ambiguity:
  uncertain outcome.

Database exceptions and unauthorized reconciliation are not consistently rewritten:
query/readback failures from reconciliation are generally uncertain at the UI boundary,
while user absence/role and invalid format are distinct source exceptions.

### Native SQLite test caveat

`notification-workflow-hardening.test.ts` uses real in-memory SQLite through the test-only
`NativeSQLiteAdapter` backed by Node `node:sqlite`, not the production
`DatabaseService` backed by `@op-engineering/op-sqlite`.

Pre-commit audit and notification failures are injected inside real native-SQLite
transactions and verify rollback/count zero.
The post-commit readback test mocks `db.getPreventionActionById` once after a real
transaction has committed. It proves persistence/reconciliation behavior with real SQLite,
but it does not prove the behavior of a failure occurring inside the production native
adapter. It must not be reported as a naturally occurring production adapter readback failure.

### Reference-collision blocker

The generator has only 90,000 values per local year.
It is random and has no persisted uniqueness/operation-token reservation.
The database UNIQUE constraint rejects a second row with the same reference.
Reconciliation currently proves only:

1. exact reference;
2. same creator;
3. same normalized payload;
4. creation-audit evidence;
5. creation-notification evidence.

It does not prove that the existing row belongs to the present user operation.
If an unrelated prior request has the same creator and payload, a newly generated
collision can reconcile to that prior row as if it were the current request.
The prior row may lack or have a distinct original operation identity because no
operation identity is stored or compared. This is a false-success possibility.

A test covering a forced random-reference collision with the same creator/payload
was not found. The present tests use deliberately distinct synthetic references and
verify retry of the same known reference; they do not establish collision safety.

### Eleven required failure-path cases

| Scenario | Independent result |
|---|---|
| Normal create | PASS: real insert ID readback and complete evidence required. |
| Pre-commit audit failure | PASS: native-SQLite transaction rollback tested. |
| Pre-commit notification failure | PASS: native-SQLite transaction rollback tested. |
| Post-commit readback failure | PASS for test adapter flow: committed row reconciles on retry. |
| Reconciliation query exact-match success | PASS: payload, creator, audit, and notification are checked. |
| Reconciliation exact-match payload mismatch | BLOCKED: source throws uncertain, but cannot distinguish operation identity. |
| Missing creation audit | PASS uncertainty result: reconciliation rejects. |
| Missing creation notification | PASS uncertainty result: reconciliation rejects. |
| Duplicate retry with the same reference | PASS for same mounted operation: reconciles and does not duplicate. |
| Screen remount or app restart | BLOCKED: `useRef` state is lost; a fresh submission generates a new reference. |
| Back navigation and uncertain state | BLOCKED: Create back always calls `navigation.goBack()` and is not retained as durable uncertain state. |

There are also no persisted operation tokens, durable request/response state, or
screen-independent retry journal. Reconciliation may permit a remounted/restarted
submission to insert the fresh reference only if no collision exists, while leaving the
previous uncertain committed outcome unresolved. This defeats the intended uncertainty
barrier across process/app lifecycle boundaries.

## A–C screen evidence

### A and C

The Overview screen reads the active global role and context, not a local quality default.
Only quality staff receives manage/create controls; admin and OH retain read access;
exposed and tech roles are denied.
Repository authorization remains independent and is still enforced at database calls.
The stale-response guards test a role switch and reject the older resolution.

### D

The Create screen direct accessibility labels cover title, description, rationale,
target date, and surveillance reference. `AesOptionCard` has logical margin semantics
and row-reverse direction for RTL. The tests do not replace native accessibility-tree,
TalkBack/VoiceOver, or physical RTL interaction evidence.

### E

All relevant call sites were inspected. Detail uses a back-specific arrow and
`navigation.goBack()`. Register and Welcome preserve forward navigation defaults.
The 48×48 target and translated back label remain in source. Native gesture or
screen-reader behavior was not tested on a device.

### F

The formatter validates date-only round trips and calendar dates, uses UTC setters for
date-only values, forces `timeZone: 'UTC'`, and supports locale tags for FR/EN/AR.
Register target dates and Detail target/created/updated/completed/audit timestamps
call the helper.

The focused formatter suite passed 10 tests. It passed again under
`TZ=Pacific/Kiritimati` and `TZ=America/Los_Angeles` for 10 tests each.
This proves positive/negative process-timezone stability for the test cases, but the
suite does not assert near-midnight offset-crossing device scenarios. Native/device
locale rendering remains a limitation.

## Repository baseline verification

### Tests

Exact command: `npm test -- --runInBand`

- Exit code: `0`
- Test suites: 53 passed, 53 total
- Tests: 1,167 passed, 0 failed, 0 skipped
- Snapshots: 0
- Execution time: 106.031 seconds

The full suite passes. There are no failure names in this run.

### TypeScript

Exact command: `npx tsc --noEmit --pretty false`

- Exit code: `2`
- Diagnostic count: `769`
- AES Guardian: `0`
- Core database: `0`
- Shared theme: `0`
- Localization: `0`
- Navigation: `0`
- Inherited SANAD modules: `769`
- Unclassified: `0`

This matches the Phase 0.3 baseline count and classification; no corrected AES Guardian
or changed-CAPA diagnostic is present.

### Lint

Exact command: `npm run lint`

- Exit code: `2`
- Finding count: not emitted because ESLint stopped at configuration discovery
- ESLint 9.39.5 reports that no `eslint.config.js`, `.mjs`, or `.cjs` is present.

This is the unchanged baseline configuration failure, not a clean lint result.

## Repository preservation

Before this re-audit and after test/typecheck/lint execution:

- HEAD unchanged: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Tree unchanged: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Branch unchanged: `migration/aes-guardian`
- Lockfile SHA-256 unchanged: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- Tracked modifications: 15 CAPA/CAPA-test/localization files
- Existing untracked files remain preserved:
  - `docs/AES_GUARDIAN_PHASE0_2_DEDICATED_REPOSITORY_REVIEW.md`
  - `docs/AES_GUARDIAN_PHASE0_3_LOCAL_BASELINE_VERIFICATION.md`
  - `docs/AES_GUARDIAN_PHASE2E1_7_2_5_2_CAPA_CORRECTIVE_REENTRY_REPORT.md`
- Existing new source/test files remain:
  - `src/features/aes-guardian/prevention-date-format.ts`
  - `src/features/aes-guardian/__tests__/prevention-date-format.test.ts`
- This report is the only additional audit file created.

## Acceptance disposition

**BLOCKED**

The cross-screen re-audit is blocked on durable, operation-specific CAPA creation
identity and reference-collision handling. The stable-reference retry within one mounted
screen is not sufficient to close the uncertain-outcome lifecycle across remount,
restart, or navigation dismissal.
