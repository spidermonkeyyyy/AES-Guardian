# SANAD — CAPA Gate C Implementation Readiness

**Date:** 2026-11-23  
**Scope:** Read-only comparison of the seven Gate B recovered modules against current fbbc source, database service, screens, and CAPA tests.  
**Disposition:** No application source was changed; no tests, builds, migrations, formatters, or device operations were run.

## 1. Executive recommendation

**Recommend Option 2 — selectively port the durable-operation lifecycle into the current database architecture.** The current `DatabaseService` and transaction executor match the recovered database’s direct API; current `types.ts` and `capa-operation-utils.ts` are byte-for-byte identical to their recovered UTF-8 text, and Register, Overview, and Detail screen files are identical. The Create screen already contains the historical workflow, differing from the recovered screen only in a null-safe assignment. This is a focused integration gap, not a need to replace the application or redesign CAPA.

The smallest safe route is to append migrations 9 and 10; port the operation persistence, reservation, exact reconciliation, recovery, acknowledgement and operation-bound create methods into the existing current database file; add operation-row deletion before CAPA deletion during demo reset; then connect the existing Create screen through typed database methods. Keep the current Create screen’s `caught.referenceCode ?? null` guard. Do not copy the full recovered database over the current file: the exact `.18` source identity is unproven and the current working tree is preservation-sensitive.

No missing screen dependency prevents starting implementation. Three items require explicit targeted coverage before acceptance: reset ordering with the new foreign key, SQLite/native transaction and constraint-error semantics, and a current-role authorization check for acknowledgement/recovery operations. These are implementation/verification tasks, not reasons to restart broad forensic research.

## 2. Database API and migration compatibility

| Surface | Recovered implementation | Current fbbc | Compatibility / required action |
|---|---|---|---|
| Database constructor and query/transaction contract | Uses `TransactionalDatabase`; operation implementation calls `query`, `execute`, and `transaction`/transaction-scoped `query` and `execute`. | `AesGuardianDatabase` uses the same service contract. `DatabaseService` exposes those methods and rolls back/rethrows transaction-body/commit errors (rollback failure is suppressed). | **Compatible as-is.** No interface redesign needed. Native op-sqlite behavior still needs verification. |
| Schema version / migration runner | Schema 10; sequential append-only migrations 9 and 10; each migration’s SQL and schema-version record run inside `transaction`. | Schema 8; migrations 1–8; runner executes later migrations sequentially in a transaction. | **Compatible additive upgrade.** Append 9/10; do not alter old migration definitions or version-8 data. |
| Migration 9 operation table | `capa_creation_operations`: operation ID primary key; creator FK; canonical payload/hash; reference; pending/committed check; unique linked CAPA FK; timestamps. Unique reference index, partial unique pending-per-creator index, status/update index. | No operation table or these indexes. Existing `prevention_actions.reference_code` is unique. | **Requires additive migration.** Cross-table reference collisions must continue to be handled in code because SQL uniqueness is per table. |
| Migration 10 acknowledgement | Adds nullable `acknowledged_at`; index by creator/status/acknowledgement. | No CAPA acknowledgement column or index. | **Requires additive migration 10** after 9. SQLite `ALTER TABLE ADD COLUMN` is compatible in principle; confirm native SQLite version and migration rollback behavior. |
| Existing CAPA data | Migrations create the operation table and add a column only to it; they do not backfill operation IDs or rewrite CAPA rows. | Legacy CAPA rows remain in `prevention_actions`. | **Preserved by the migration SQL.** Keep legacy rows operation-less. Add a migration fixture asserting row identity and field preservation. |
| Stage A and reservation | Typed `reserveCapaCreationOperation(userId,input,operationId,preferredReference,intent)`; canonical payload/hash; UUID validation; explicit `new`/`retry`; collision/reference handling and race checks. | A placeholder returns `{operation_id: 'reserved'}`; no persistence; no generator method on the class. | **Missing production implementation.** Port method with typed result and preserve explicit intent. |
| Stage B create | `createPreventionActionForOperation(...)` re-reserves/verifies, then transactionally inserts CAPA, audit, notification, and commits the linked operation. | Method inserts CAPA/audit/notification but ignores durable identity and intent. | **Replace only the CAPA create implementation with the operation-bound version.** Retain ordinary validation and notification conventions; do not leave a second non-idempotent path reachable from the Create screen. |
| Reconciliation/recovery | Exact operation/creator/payload/hash/status/CAPA/audit/notification checks; pending and committed-unacknowledged lists. | Reconcile is reference-based; operation reconcile returns null; both recovery lists return `[]`. | **Missing production implementation.** Port exact operation-ID recovery; legacy reference reconciliation must remain clearly isolated and must never establish operation identity. |
| Acknowledgement/get | Persists acknowledgement only for a reconciled committed operation; operation lookup checks owner. | Both methods return null. | **Missing implementation.** Add a quality-staff role check at the data boundary for acknowledgement and recovery. The recovered lookup checks owner but does not independently check the user’s current DB role; tighten that small authorization edge and cover it. |
| Error handling / insert races | Distinguishes operation-ID collisions, reference collisions, integrity conflicts and uncertain post-commit outcomes. Constraint handling currently inspects SQLite error-message text. | Existing service rethrows the adapter error; operation stubs have no classification. | **Small adapter risk.** Preserve original errors; test actual `op-sqlite` error shapes. Do not silently classify unknown constraint errors as retries. |
| Demo reset / seed | Deletes `capa_creation_operations` before `prevention_actions`, then reseeds in the same reset transaction. | Reset deletes CAPAs without an operation-table delete. | **Required coupled change.** The migration-9 operation FK has default NO ACTION; a committed linked operation will prevent current reset from deleting CAPAs. Add operation deletion before CAPAs. Seed does not need to fabricate operation records. |
| Public API / errors | Class methods plus operation types/errors and utility functions. | Types and conflict/integrity errors are present/exported; helper and entropy/collision errors are exported; class lacks generator and real methods. | **Mostly compatible.** Add precise method signatures/return types and keep exports consistent; helper/types themselves need no port. |

### Method/API compatibility matrix

| API | Current state | Recovered contract | Decision |
|---|---|---|---|
| `createCapaCreationOperationId()` | Missing from current DB class; Create calls it through `as any`. | Delegates to secure `createCapaOperationId()` and fails closed. | Add class bridge; avoid exposing a second generator path from UI. |
| `reserveCapaCreationOperation(userId,input,id,preferredReference,intent)` | Stub with `any[]`; returns placeholder. | Persists/reuses only the exact explicit retry; rejects reused ID for `new`. | Port with explicit `'new' | 'retry'` and `Promise<CapaCreationOperation>`. |
| `createPreventionActionForOperation(userId,input,id,reference,intent)` | Ordinary write; operation ID/intent are not persisted or checked. | Reservation + one transaction for CAPA/audit/notification/link/commit; exact reconciliation after write. | Port operation semantics; preserve a documented compatibility wrapper for existing callers. |
| `reconcileCapaCreationOperation(userId,id,input)` | Stub returning null. | Exact operation-bound reconstruction or explicit uncertainty/integrity error. | Port. |
| `listPendingCapaCreationOperations(userId)` | Stub returning `[]`. | Role-authorized pending operations for restart recovery. | Port. |
| `listUnacknowledgedCommittedCapaCreationOperations(userId)` | Stub returning `[]`. | Role-authorized committed results awaiting presentation acknowledgement. | Port. |
| `getCapaCreationOperation(userId,id)` | Stub returning null. | Owner-scoped operation lookup. | Port; include role policy consistently. |
| `acknowledgeCapaCreationOperation(userId,id)` | Stub returning null. | Reconcile committed result, persist acknowledgement, verify readback. | Port; enforce current `quality_staff` role before write. |
| `reconcilePreventionActionCreation(userId,input,reference)` | Legacy reference-only lookup. | Operation-aware reconciliation is authoritative; legacy data has no fabricated IDs. | Keep only for legacy compatibility; Create’s durable path must use operation ID. |

The current notification table already permits `event_type='capa_created'`, entity type `prevention_action`, and unique `idempotency_key`; the recovered insert shape matches those fields. The current prevention-action schema also has the fields and unique reference constraint expected by the recovered create transaction.

## 3. CAPA screen dependency compatibility

The four recovered screens were compared directly with current files. Register, Overview, and Detail are exact UTF-8 text matches. Create differs at one line: recovered code assigns `caught.referenceCode`, while current code uses `caught.referenceCode ?? null`; keep the current null-safe form.

| Screen / dependency | Current compatibility | Decision |
|---|---|---|
| Create DB calls | Calls generator, reserve, create-for-operation, reconcile, recovery-list, and acknowledgement APIs. Current DB has stubs and lacks the generator. `getDatabase() as any` masks the missing type contract. | **Requires database implementation and small typing cleanup.** Existing screen workflow is already wired; preserve it rather than rewrite. Remove `as any` only after method signatures are defined. |
| Create identity/recovery/ack flow | Recovered screen uses one ID, explicit intent, presents result before acknowledgement, and clears state after acknowledgement; current screen is the same flow except the null-safe error reference assignment. | **Compatible after DB methods are implemented.** Keep current null guard and validate UI mocks against the real operation API. |
| Register DB/routes | Uses current `listPreventionActions`, existing `preventionActionDetail({actionId})`, and `preventionCreate` routes. | **Compatible as-is.** Current screen text is identical. |
| Overview DB/routes | Uses current `getPreventionOverview`, `preventionRegister`, and `preventionCreate`. | **Compatible as-is.** Current screen text is identical. |
| Detail DB/routes | Uses current `getPreventionActionById`, `updatePreventionActionStatus`, and `preventionActionDetail({actionId})`; reads existing audit history. | **Compatible as-is.** Current screen text is identical. |
| Core hooks/permissions/types | Current core exports `getDatabase`, role-store hook, `canManagePreventionActions`, `canViewPreventionActions`, CAPA domain types, and operation error classes. | **Compatible as-is**, subject to typed method restoration. |
| Localization / RTL | Current localization exports `t`, locale/layout hooks, row direction and text alignment helpers; screen translation keys are already used by the identical current screens and tests cover FR/EN/AR. | **Compatible as-is.** Keep existing translation keys and RTL behavior. |
| Theme / shared UI components | Current theme exports colors/spacing/radii/typography; current component barrel exports all screen components used by the recovered screens. `AppText`, `AppTextInput`, and `AppIcon` exist. | **Compatible as-is.** No component or theme migration needed for CAPA recovery. |
| Navigation types | Existing routes include `preventionOverview`, `preventionRegister`, `preventionCreate`, and `preventionActionDetail: {actionId:number}`. | **Compatible as-is.** |
| Date formatting | Current `prevention-date-format.ts` is imported by Register/Detail and has a focused date-format test. | **Compatible as current dependency.** Keep it; no recovered copy required. |
| Role / accessible UI | Screens use the global active context and existing permission helpers; Create inputs/results have localized labels, and layout uses RTL helpers. `.18` reports source acceptance, not current native acceptance. | **Compatible as-is at source level.** Retain screen tests and add device validation later; do not redesign. |

## 4. Audit `.18` invariant traceability

Source line numbers below refer to the unchanged Gate B recovered files. “Current” distinguishes actual current production behavior from matching type/screen fragments.

| Invariant | Recovered source evidence | Current fbbc | Remaining verification |
|---|---|---|---|
| UUID-v4 identity, fail-closed entropy | Utility `createCapaOperationId()` / `isValidCapaOperationId()` at `capa-operation-utils.ts:139-193`; DB bridge at `AesGuardianDatabase.ts:2624`. | Utility matches exactly; DB bridge missing. | Run entropy tests on supported RN runtime; test invalid generator output. |
| Explicit `new`/`retry` intent | Reservation validation and exact ID handling at `AesGuardianDatabase.ts:2851-2948`; Create Stage A/B at `PreventionActionCreateScreen.tsx:219-272`. | Screen passes explicit intent; DB stub accepts arbitrary args. | Exercise same-ID retry, new-ID collision, remount recovery and changed-payload rejection. |
| Durable reservation | Migration 9 at `AesGuardianDatabase.ts:446-469`; reserve at `2851-3050`. | Absent; schema remains 8. | Upgrade schema-8 fixture and inspect constraints/indexes on Node SQLite and native SQLite. |
| Insert-race rejection | Reservation insert/catch/lookup at `AesGuardianDatabase.ts:2990-3045`; `new` collision is not adopted as retry. | Absent. | Keep fault-injected unit case; add genuine two-connection native race. |
| Atomic CAPA/audit/notification/operation transaction | Stage B at `AesGuardianDatabase.ts:3071-3288`; transaction inserts CAPA/audit/notification then links and commits operation. | Current create writes CAPA/audit/notification but has no operation row/link or atomic replay. | Verify rollback and commit-ambiguity behavior against actual op-sqlite. |
| Exact reconciliation | `reconcileCapaCreationOperation()` at `AesGuardianDatabase.ts:2513-2618` verifies payload, linked CAPA and audit/notification. | Stub returns null; legacy method uses reference only. | Missing-evidence and tampered-link tests, plus native readback after simulated commit failure. |
| Pending and committed-unacknowledged recovery | List methods at `AesGuardianDatabase.ts:2726-2776`; Create hydration/reconciliation at screen `:100-160` and `:289-320`. | List methods return empty arrays. | Repository reconstruction tests are useful but do not simulate OS process death; add device restart acceptance. |
| Explicit presentation acknowledgement | DB acknowledgement at `AesGuardianDatabase.ts:2797-2848`; UI confirmation at Create screen `:180-217` and result actions around `:510-540`. | DB acknowledgement stub; current UI flow already exists. | Test only acknowledges after visible confirmation; failed acknowledgement must retain operation. |
| Retirement / fresh next ID | Create screen clears the acknowledged operation before a new submit (`:180-217`, `:219-272`); audit `.18` covers cross-screen flow claim. | Current Create flow matches; DB ack is not persisted. | Reuse fresh-ID-after-ack UI test with operation-aware mock; verify persisted ack/restart behavior. |
| Cross-screen consistency | Register/Overview/Detail recovered sources match current exactly; current detail/register read canonical DB actions. | Existing non-create screens are present and wired to current methods. | Re-run role/navigation/data consistency tests after database implementation. |
| Data-access role authorization | Reserve/list methods enforce quality-staff at `AesGuardianDatabase.ts:2851-2878`, `2726-2776`; create and status paths enforce role. | Current existing CAPA APIs enforce role, but durable stubs do not implement it. | Add explicit role checks and tests for `get`/ack/recovery; in recovered code, `getCapaCreationOperation` checks owner, but not current DB role itself. |
| Migration 9/10 preservation | Migration 9 creates operation table without touching CAPA rows; migration 10 adds acknowledgement at `:446-480`; reset deletes operation rows before CAPAs at `:4571-4574`. | Migrations absent; reset deletes CAPAs without deleting operations. | Verify old CAPAs unchanged; test reset order and FK enforcement; ensure migration rollback is atomic. |

This is a source comparison against the `.18` contract, not proof that the recovered modules are the exact files audited by `.18`, nor proof of native correctness. `.18` reports 122 focused and 1,206 full Jest tests passing for its historical source snapshot; those results were not rerun here.

## 5. Existing test reuse assessment

| Test | Reuse decision |
|---|---|
| `src/core/database/__tests__/capa-operation-entropy.test.ts` | Reuse directly for the unchanged utility; it does not prove React Native crypto availability. |
| `src/core/database/__tests__/migration9.test.ts` | Reuse after adding migrations 9/10. It already checks schema 8→10, legacy CAPA preservation, unique indexes, pending/committed rows, and acknowledgement. Add reset-FK coverage. |
| `src/core/database/__tests__/capa-operation-idempotency.test.ts` | Reuse as the main behavioral specification after restoring methods. It covers replay, payload/creator conflicts, operation-ID and reference races, reconstruction, rollback, exact evidence, and acknowledgement. Keep injected race tests, but add true multi-connection native coverage. |
| `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx` | Reuse most assertions for explicit intent, recovery, acknowledgement, retirement, roles, RTL and labels. Correct its mock: `mockCreateForOperation` currently delegates to `mockCreatePreventionAction`, so success assertions can pass through the legacy path and do not demonstrate durable persistence. Keep operation-call assertions and make the mock return an operation-bound result without implying the legacy API performed Stage B. |
| `prevention-action-register-ui.test.tsx`, `prevention-overview-ui.test.tsx`, `prevention-action-detail-ui.test.tsx` | Reuse directly; current screens equal recovered screens and DB read/status APIs already exist. These are mocked UI tests, not DB integration tests. |
| `prevention-action-workflow.test.ts`, `prevention-date-format.test.ts` | Reuse for CAPA lifecycle/data regression and date behavior. Add no unrelated UI tests. |
| Historical `.18` test claims | Use as traceability only; do not treat as current results. |

`NativeSQLiteAdapter` exercises real SQLite in-memory constraints and transaction code but is a single Node connection, not the native op-sqlite bridge. Mocked UI tests cannot prove schema, transaction atomicity, uniqueness races, app-process death/restart, or native crypto. No tests were run in Gate C.

## 6. Implementation route evaluation

| Route | Historical behavior | Current SANAD risk | Change size | Migration/data risk | Testability | Time |
|---|---|---|---|---|---|---|
| **Option 1: replace current DB with recovered file** | Closest to mapped module text, but not proven byte-identical to `.18`. | High: replaces a large current file and risks dropping current changes/behavior in a dirty worktree. Also leaves reset/integration details to reconcile. | Large replacement. | Additive schema is understandable, but whole-file merge risk is high. | Tests available, yet compatibility failures likely. | Not the shortest safe path. |
| **Option 2: selective port into current architecture (recommended)** | Restores the same durable identity/state/transaction invariants while preserving current non-CAPA source. | Lowest: small focused database and Create API changes; retains current screens and service. | Moderate, limited to CAPA DB logic, reset ordering, typed Create calls and tests. | Clear schema-8→9→10 additive upgrade; no CAPA backfill; one reset FK-order fix. | Strong existing focused tests plus explicit native gaps. | Best balance and fastest safe implementation. |
| **Option 3: new operation repository/service layer** | Could encode the same contract. | Adds new abstractions and wiring without evidence that existing DB class is inadequate. | Larger. | Same migrations plus new interfaces. | More mocks and integration surfaces. | Slower with no demonstrated safety advantage. |

**Decision:** Option 2. Keep the current `AesGuardianDatabase`/`DatabaseService`, port only the operation lifecycle and necessary migration/reset changes, then use the existing Create flow with typed signatures. Preserve all unrelated dirty files and the seven recovered sources unchanged. The recovered modules are reference material; do not copy them wholesale into production.

## 7. Ordered implementation plan

### Phase 1 — Restore durable database lifecycle

- **Objective:** Add schema 9/10 and implement identity-bound reservation, create, reconcile, recovery and acknowledgement.
- **Likely files:** `src/core/database/AesGuardianDatabase.ts`; if needed, `src/core/database/index.ts` and `src/core/index.ts`; tests `src/core/database/__tests__/capa-operation-idempotency.test.ts`, `migration9.test.ts`, `capa-operation-entropy.test.ts`, plus a reset-order assertion in the closest database test.
- **Expected behavior:** Exact UUID/payload identity; explicit intent; pending/committed recovery; atomic CAPA/audit/notification/link; acknowledgement; existing schema-8 CAPAs preserved.
- **Targeted tests:** Three DB suites; add quality-role rejection for reservation/list/get/ack, reset with a linked operation, migration legacy-data preservation, rollback across each Stage B insert, and native-style constraint errors.
- **Acceptance:** No duplicate CAPA for an operation; same-ID exact retry returns the linked row; mismatch/race fails closed; all four commit records are atomic; migration 8→10 is additive; reset deletes operation rows before linked CAPAs.
- **Dependency/blocker:** None in project interfaces. Confirm native error-message mapping during tests; unknown SQLite errors must propagate, not be treated as collisions.

### Phase 2 — Connect Create to typed operation APIs

- **Objective:** Remove the untyped gap while retaining current Create UX and null-safe error handling.
- **Likely files:** `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`; `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`; possibly core exports only if a restored public method/type is not already exported.
- **Expected behavior:** Existing UI’s Stage A/B, retry, remount recovery, result presentation, acknowledgement and fresh-ID lifecycle use real database methods.
- **Targeted tests:** Create UI test with corrected operation mocks; DB-backed operation tests cover actual persistence.
- **Acceptance:** Initial Stage A/B use one ID and `new`; retry reuses exact ID/payload with `retry`; no blind retry after uncertainty; ack only after confirmation; failed ack retains recovery; next submit generates a fresh ID.
- **Dependency/blocker:** Phase 1 method signatures. Keep current `caught.referenceCode ?? null`; do not adopt the recovered screen wholesale.

### Phase 3 — Protect cross-screen and notification behavior

- **Objective:** Verify existing Register/Overview/Detail and CAPA notification behavior against the restored records; avoid screen rewrites.
- **Likely files:** Existing `prevention-action-register-ui.test.tsx`, `prevention-overview-ui.test.tsx`, `prevention-action-detail-ui.test.tsx`, `prevention-action-workflow.test.ts`; add or extend a focused DB notification assertion if absent. Production screen files should not need changes.
- **Expected behavior:** Same persisted action appears consistently in Overview/Register/Detail; status/audit data remain canonical; exactly one `capa_created` notification accompanies the operation commit.
- **Targeted tests:** Four screen/workflow tests plus operation DB notification assertions.
- **Acceptance:** Existing roles, route parameters, filters, status transitions, FR/EN/AR strings, RTL and accessibility assertions continue to hold; notification idempotency key/event/entity match the existing schema.
- **Dependency/blocker:** Phase 1 and 2. Current screens/components/routes/localization are compatible as-is.

### Phase 4 — Native acceptance (release gate, not a coding prerequisite)

- **Objective:** Close `.18`’s bounded runtime limitations.
- **Likely files:** `src/core/database/DatabaseService.ts` only if native transaction/error evidence requires a compatibility change; native test/evidence files only after separately authorized. No broad UI changes anticipated.
- **Expected behavior:** Native crypto, op-sqlite transaction and actual process-restart behavior match tested source invariants.
- **Targeted verification:** Real-device/emulator schema upgrade; failures at insert/audit/notification/link/commit; concurrent reservations using separate connections; kill/relaunch before and after commit and before/after acknowledgement; TalkBack/VoiceOver and Arabic RTL.
- **Acceptance:** No duplicate or false replay, durable exact recovery, correct rollback/uncertain-state handling, accessible cross-screen presentation. Avoid real clinical data; use synthetic fixtures.
- **Dependency/blocker:** Requires separately approved device/runtime work. It does not block implementing or unit-testing Phase 1–3.

## 8. True blockers vs implementation tasks

**Before implementation:** the only authorization blocker is a separate explicit user instruction to implement. Gate C itself authorizes analysis only. Exact identity with the `.18` audited source remains impossible to prove from current evidence, but is not a blocker to implementing and testing its documented invariants in fbbc.

**Implementation tasks, not blockers:** append migrations; port typed methods; update reset ordering; remove or narrow the Create screen’s `as any`; correct the misleading legacy-delegating test mock; test DB role checks; verify actual op-sqlite error/transaction behavior. No missing core, theme, localization, route, or UI component import was found.

**Release/acceptance limitation:** genuine native concurrency, process restart, native crypto, and accessibility/RTL device checks remain necessary for full acceptance. They can follow the focused source/unit implementation and should use synthetic data.

## 9. Exact files inspected

**Recovered Gate B sources (all seven; unchanged):**

- `C:\Users\User\.copilot\session-state\a5296a0a-6b0a-4ce3-a007-4f338ec20fed\files\capa-recovery\recovered-source\src\core\database\AesGuardianDatabase.ts`
- `...\recovered-source\src\core\database\capa-operation-utils.ts`
- `...\recovered-source\src\core\database\types.ts`
- `...\recovered-source\src\features\aes-guardian\screens\PreventionActionCreateScreen.tsx`
- `...\recovered-source\src\features\aes-guardian\screens\PreventionActionRegisterScreen.tsx`
- `...\recovered-source\src\features\aes-guardian\screens\PreventionOverviewScreen.tsx`
- `...\recovered-source\src\features\aes-guardian\screens\PreventionActionDetailScreen.tsx`

**Current project source/config inspected:**

- `src/core/database/AesGuardianDatabase.ts`
- `src/core/database/DatabaseService.ts`
- `src/core/database/NativeSQLiteAdapter.ts`
- `src/core/database/types.ts`
- `src/core/database/index.ts`
- `src/core/index.ts`
- `src/core/auth/boundaries.ts`
- `src/core/auth/use-demo-role.ts`
- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx`
- `src/features/aes-guardian/screens/PreventionOverviewScreen.tsx`
- `src/features/aes-guardian/screens/PreventionActionDetailScreen.tsx`
- `src/features/aes-guardian/components/index.ts`
- `src/components/AppText.tsx`, `AppTextInput.tsx`, `AppIcon.tsx`
- `src/theme/tokens/index.ts`
- `src/localization/index.ts`
- `src/navigation/routes.ts`
- `src/features/aes-guardian/prevention-date-format.ts`

**Tests/reports inspected:**

- `src/core/database/__tests__/capa-operation-idempotency.test.ts`
- `src/core/database/__tests__/capa-operation-entropy.test.ts`
- `src/core/database/__tests__/migration9.test.ts`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx`
- `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-detail-ui.test.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts`
- `src/features/aes-guardian/__tests__/prevention-date-format.test.ts`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_18_INDEPENDENT_CAPA_CROSS_SCREEN_ACCEPTANCE_AUDIT.md`
- Gate B `provenance-manifest.json` and `SANAD_CAPA_RECOVERY_GATE_B_REPORT.md`

The source map, APK, bundle, other reports, unrelated worktrees, and unrelated application modules were not re-investigated in Gate C.

## 10. Preservation and Git state

Before creating this report, the repository was at HEAD `fbbc94136652bd4f8efe1b8d1fa85e14932692ca`; `git status --porcelain=v1 -z` SHA-256 was `4F3F8B03629D908E5EC9FA9467FB1C116FF6D23C4FDFEBF451EE134167E3EB23` with 160 status entries. The required report path did not exist before creation. Gate C used read-only inspection only; no source, recovered file, evidence, Git ref or index was modified. The only intended project addition is this report in `docs`. After writing, verify HEAD remains the expected commit and that the prior dirty status is unchanged apart from this new report.

## Decision and next authorization

**Recommended next phase:** authorize Phase 1 implementation—selectively restoring migrations 9/10 and the durable database lifecycle in the current `AesGuardianDatabase.ts`, including reset ordering and targeted DB tests, without replacing the file or touching unrelated changes.

**Exact authorization required:** explicitly authorize those scoped Phase 1 source/test edits in the Desktop repository. No such implementation has started under this Gate C instruction. After Phase 1, review its diff/results before authorizing Phase 2 Create-screen integration; native/device validation remains a later, separately scoped acceptance step.
