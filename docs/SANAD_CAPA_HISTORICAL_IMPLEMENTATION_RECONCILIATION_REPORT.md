# SANAD — Post-Forensic CAPA Historical Implementation Reconciliation

**Investigation date:** 2026-11-23  
**Scope:** Read-only reconciliation of CAPA durable-operation reports, source candidates, tests, and E10 build evidence.  
**Disposition:** No application, repository, Git, build, test, or emulator state was changed. This report is stored outside the repository because this investigation explicitly prohibited creating project files.

## 1. Executive conclusion

**Durable CAPA operation handling was implemented in a historical dirty source snapshot and its production module source survives inside the E10 React Native bundle source map. The complete implementation does not survive in any inspected Git commit or checked-out source worktree.** The E10 source map directly contains an `AesGuardianDatabase.ts` module with schema version 10, migrations 9 and 10, operation-ID generation, reservation, explicit new/retry intent handling, exact reconciliation, committed/unacknowledged recovery, and acknowledgement. It also contains the associated Create screen and supporting `types.ts` / `capa-operation-utils.ts` modules. This is strong evidence that the implementation was bundled, not merely described in reports.

The current Desktop `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` checkout is **not just missing one screen integration**. It is an incomplete production integration: the database is schema 8; its migration list ends at 8; its create-operation APIs are stubs; its `createPreventionActionForOperation()` accepts an operation ID and intent but does not persist or reconcile them; and `PreventionActionCreateScreen.tsx` calls a database method `createCapaCreationOperationId()` that the current database class does not implement. The current untracked utility, types, exports, UI, and tests are useful fragments, but they do not supply durable database behavior.

The last historical independent acceptance is report **2E.1.7.2.5.18**, which says the cross-screen source workflow was conditionally accepted, with native/runtime validation still open. Its test results are historical report claims; no tests were run for this investigation. The best-preserved implementation evidence is the E10 source map, not a complete checkout. Because this task forbids reconstructing production source from source maps, no recovery was attempted.

**Bottom line:** historical production implementation existed; current fbbc is incomplete; the strongest source evidence is the E10 embedded module; an exact full source tree/commit remains unavailable. Safest course is to preserve E10 artifacts, all worktrees, current untracked CAPA files, and reports untouched until a separate recovery authorization explicitly resolves whether source-map extraction is allowed.

## 2. Evidence labels and scope

- **SOURCE VERIFIED:** directly inspected source text, source-map embedded source text, path, or hash; the claim is limited to that material.
- **TEST VERIFIED:** directly inspected an existing test's assertions, not a successful execution in this investigation.
- **REPORT CLAIM:** stated by an historical implementation or audit report; not independently rerun.
- **INDEPENDENTLY AUDITED:** stated by an audit report; that report's scope and limitations are retained.
- **FRAGMENT ONLY:** implementation pieces survive, but the complete active production feature is absent.
- **NOT FOUND:** absent in the searched candidates/refs, not proof of global nonexistence.
- **BLOCKED:** evidence cannot establish the claim.

The requested Phase 2E.1.7.2.5.4 through .18 documents and the Phase 2E.1.7.2.6 roadmap were present and read, as were the directly relevant .2 corrective re-entry, .3 cross-screen re-audit, and initial CAPA final-acceptance audit. No test/build/formatter was run. No APK was rebuilt, decompiled, installed, or reinstalled. The E10 map was inspected as existing source-map evidence; no code was extracted to a source file or reconstructed.

## 3. Historical document chronology

Local document timestamps (Windows `LastWriteTime`) establish the sequence below. They are metadata, not proof of when each code edit occurred.

| Time, 2026-11-18/19 | Document | Documented result and significance |
|---|---|---|
| 18:52 | `AES_GUARDIAN_PHASE2E1_7_2_5_CAPA_FINAL_ACCEPTANCE_AUDIT.md` | **REPORT CLAIM / audit:** BLOCKED. Found unsafe uncertain-create retry, role/accessibility/RTL/date issues; no durable operation ID. This is the initial cross-screen failure baseline. |
| 20:14 | `..._2_CAPA_CORRECTIVE_REENTRY_REPORT.md` | **REPORT CLAIM:** six earlier UI/workflow findings corrected; stable-reference retries and reconciliation claimed. Not a durable operation-ID implementation. |
| 20:27 | `..._3_CAPA_CROSS_SCREEN_REAUDIT.md` | **INDEPENDENTLY AUDITED:** BLOCKED because reference + creator + payload + audit/notification evidence do not identify a logical operation across collision/remount/restart. |
| 20:33 | `..._4_DURABLE_CAPA_IDEMPOTENCY_DESIGN.md` | Design only; explicitly says no code/schema/test change. Recommends a dedicated persisted operation table and unique opaque operation ID. |
| 20:57 | `..._5_DURABLE_CAPA_OPERATION_IMPLEMENTATION_REPORT.md` | First report claiming production implementation: migration 9, `capa_creation_operations`, reservation before Stage B, operation-bound atomic CAPA/audit/notification commit, exact reconciliation, pending recovery. Still reported weak `Math.random()` fallback and no committed-recovery lifecycle. |
| 21:18 | `..._6_INDEPENDENT_DURABLE_CAPA_IDEMPOTENCY_AUDIT.md` | **INDEPENDENTLY AUDITED: BLOCKED.** Identified weak entropy fallback, undiscoverable committed ambiguous operations after restart, and reference/creator/payload false replay. |
| 21:42 | `..._7_OPERATION_IDENTITY_AND_COMMITTED_RECOVERY_CORRECTION_REPORT.md` | Claims secure fail-closed IDs, migration 10 acknowledgement state, pending + unacknowledged-committed recovery, exact operation APIs, removal of reference fallback, bounded collision handling. |
| 21:50 | `..._8_INDEPENDENT_OPERATION_RECOVERY_ACCEPTANCE_AUDIT.md` | **INDEPENDENTLY AUDITED: BLOCKED.** Invalid UUID output was accepted; React-effect acknowledgement might precede visible presentation; migration 9-to-10 fixture coverage was incomplete. |
| 22:06 | `..._9_PRESENTATION_ACKNOWLEDGEMENT_AND_UUID_CORRECTION_REPORT.md` | Claims strict UUID-v4 validation, explicit user confirmation before acknowledgement, better migration-10 fixture, uniqueness classification. |
| 22:14 | `..._10_INDEPENDENT_UUID_PRESENTATION_AND_RESERVATION_AUDIT.md` | **INDEPENDENTLY AUDITED: BLOCKED.** New-ID insert-race could be reinterpreted as retry; implicit retry defaults and a legacy Create fallback weakened the contract. |
| 22:33 | `..._11_RESERVATION_INTENT_INSERT_RACE_CORRECTION_REPORT.md` | Claims mandatory `new`/`retry` intent, insert-race collision rejection, no legacy Create fallback, deterministic adapter fault-injection test. |
| 23:04 | `..._12_INDEPENDENT_RESERVATION_INTENT_INSERT_RACE_AUDIT.md` | **INDEPENDENTLY AUDITED: BLOCKED.** Database race logic improved, but Create screen passed `retry` for initial Stage B and supplied duplicate/extraneous arguments. |
| 23:26 | `..._13_CREATE_INTENT_LIFECYCLE_CORRECTION_REPORT.md` | Claims matching `new` intent through initial Stage A/B, `retry` only for retained operations, corrected call signatures, repository-reconstruction test. |
| 23:36 | `..._14_INDEPENDENT_CREATE_INTENT_LIFECYCLE_AUDIT.md` | **INDEPENDENTLY AUDITED: CONDITIONALLY ACCEPTED** at source level; native crypto/SQLite and real process restart remain unverified. It identified test gaps for payload identity and next submission after acknowledgement. |
| 23:45 | `..._15_CREATE_LIFECYCLE_REGRESSION_EVIDENCE_REPORT.md` | Test-only investigation reports one failing regression: after acknowledgement, the screen retained the old operation ID and could reuse it for a genuine new submit. No production fix in this phase. |
| 23:53 | `..._16_ACKNOWLEDGED_OPERATION_RETIREMENT_CORRECTION_REPORT.md` | Claims active operation state is cleared only after persisted acknowledgement; next submit generates a fresh ID; acknowledgement interaction lock added. |
| 23:59 | `..._17_INDEPENDENT_ACKNOWLEDGEMENT_RETIREMENT_AUDIT.md` | **INDEPENDENTLY AUDITED: CONDITIONALLY ACCEPTED** acknowledgement lifecycle; same bounded native/runtime limitations. |
| 00:17, 2026-11-19 | `..._18_INDEPENDENT_CAPA_CROSS_SCREEN_ACCEPTANCE_AUDIT.md` | **Last documented acceptance:** CONDITIONALLY ACCEPTED across Overview/Register/Create/Detail. It reports no source-level authorization, lifecycle, integrity, or cross-screen blocker; native crypto, op-sqlite, concurrency, RTL/accessibility, and process restart remain conditional. |
| 00:34, 2026-11-19 | `AES_GUARDIAN_PHASE2E1_7_2_6_REMAINING_SCOPE_AND_ROADMAP_DISCOVERY.md` | Records CAPA/migrations 9–10 as implemented and .18 as conditional acceptance; recommends Batch 11/native validation. This is a roadmap report, not a new CAPA implementation audit. |

### 3.1 Which reports supersede which

The correction reports .7, .9, .11, .13, and .16 supersede earlier implementation behavior only to the extent they describe changed code; each explicitly awaited re-audit. The independent audits .6, .8, .10, and .12 reject the then-current state despite preceding “implementation complete” language. Report .15 then provides a concrete regression counterexample to .14's conditional source closure; .16 addresses it; .17 audits that correction; .18 is the broadest and latest CAPA acceptance. None of these reports establishes native runtime behavior. The final state is not accurately described by either the original design alone or every intermediate blocker: .18 is the latest documented source-level disposition, with explicitly conditional native evidence.

## 4. Historical contract reconstructed from the chronology

The governing invariant is: **one logical submit/retry sequence must create at most one CAPA, and a retry may only return the exact CAPA committed by that same operation ID.** Creator, payload, timestamp, visible reference, audit text, notification, and row ID are supporting evidence, not substitutes for operation identity.

1. **Identity and payload binding.** Generate one opaque UUID-v4 once for a logical operation. Normalize the CAPA fields into deterministic canonical JSON and persist both the canonical payload and its SHA-256. A repeated exact operation ID may retry only with the same creator and canonical payload; mismatches are integrity/conflict failures. Two distinct operation IDs with identical payloads remain distinct legitimate operations. Visible `CAPA-YYYY-NNNNN` reference and SQLite row ID are separate identifiers.
2. **Stage A reservation.** Before CAPA creation, persist a `pending` operation row with creator, operation ID, canonical payload/hash, and visible reference. Enforce unique operation ID, unique operation reference, and at most one pending operation per creator (partial unique index). On reference collisions allocate a replacement for the same operation; never adopt a different operation by reference/payload. A `new` insert that loses an operation-ID primary-key race must fail as collision. Only explicit `retry` may look up/reconcile the exact retained ID.
3. **Stage B atomic commit.** In one SQLite transaction, reload and validate the pending operation and creator/payload; insert CAPA; validate inserted ID; insert creation audit event and notification; link the CAPA and mark the operation `committed`. A pre-commit failure rolls back CAPA/audit/notification/link but leaves the separately reserved pending operation retryable. Commit/readback ambiguity is resolved by exact operation ID, never by reference heuristics.
4. **Restart and navigation recovery.** Pending operations are durable and restored by exact creator/operation ID. Later design adds committed-but-unacknowledged recovery. Pending and committed results are not silently selected when multiple candidates exist; malformed persisted payload or inconsistent evidence blocks recovery. Native process restart was never directly established by the reported Node SQLite/repository reconstruction tests.
5. **Reconciliation and retry.** Exact ID + creator + canonical payload/hash + status + exact linked CAPA + matching business fields/reference + creation audit + creation notification are checked. Missing/inconsistent evidence remains uncertain or integrity-failing, not success. Retry retains the same operation ID. No new ID is generated until the prior operation is acknowledged or a known-safe new operation begins.
6. **Presentation acknowledgement and retirement.** Migration 10 adds nullable `acknowledged_at`. A committed result remains recoverable until explicit “I have seen this result” confirmation. Acknowledgement revalidates exact operation/CAPA/evidence and is idempotent. Failure preserves the result, operation ID, and retry path. Success clears screen-local active operation state only after persistence, so the next genuine submit gets a fresh UUID.
7. **Authorization, audit, reset.** Only `quality_staff` can create/manage; repository authorization is separate from UI visibility. CAPA, creation audit and notification are transactionally tied to operation commit. Demo reset deletes operation rows before linked CAPAs in a transaction. Legacy CAPAs remain without fabricated operation IDs.
8. **Migration contract.** Migration 9 creates operation persistence; migration 10 adds acknowledgement timestamp/index. Existing schema-8 CAPAs remain unchanged; migration-9 pending/committed records should survive migration 10 with null acknowledgement.

## 5. Candidate/source inventory

| Candidate | CAPA source state | Evidence / conclusion |
|---|---|---|
| Desktop `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`, HEAD `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` | Schema 8; no operation table/migrations 9–10; placeholder operation methods; partial `createPreventionActionForOperation`. | **SOURCE VERIFIED / FRAGMENT ONLY.** `AesGuardianDatabase.ts` SHA-256 `7915ECEA5E72D6826FF5518845448FAFEECA2736CA68412EFBE05A76E62BC469`. |
| c81 baseline `c81a50c98e4e7330fad479a51a48a2fea7f912a1` | Schema 8 and reference-based CAPA only; no durable-operation methods. | **SOURCE VERIFIED.** Five registered c81 worktrees have the same database SHA-256 `08A02BE7482ACAFEA673F5012B48CEA713065A86ADD4A6BA282E0860DC7C784F`. |
| c0ab redesign `c0ab7019fb160e3557975601d819fd305b315889` | Schema 8; no durable-operation implementation. | **SOURCE VERIFIED.** Database SHA-256 `74CD28D8DA205EF818D547BF3A27C066ED42D6D6C74EF14B1A5EE96BDF374AF0`. |
| Other AES linked worktrees | fbbc and c81 variants; no full database implementation outside the E10 map. | **SOURCE VERIFIED.** All nine registered AES roots share the Desktop Git object store. `copilot-prewarm-crispy-dollop` uses the fbbc database blob; `marammejri-ship-it-literate-bassoon` also has fbbc DB stubs plus a distinct untracked helper/UI variant. c81 and c0ab rows are as above. They are not independent Git backups. |
| E10 source map, `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\isolated-build\_app\generated\sourcemaps\react\debug\index.android.bundle.map` | Contains the actual embedded `AesGuardianDatabase.ts` module (182,334 chars), `PreventionActionCreateScreen.tsx`, detail/register/overview screens, `types.ts`, and `capa-operation-utils.ts`. Embedded DB says schema version 10 and includes migrations 9/10 and all major durable-operation methods. | **SOURCE VERIFIED AS BUNDLE-MAPPED SOURCE; not a checkout.** Map size 7,978,892 bytes, SHA-256 `E608BB0744CE48570BDDF3B9EBD99F695C581995887AA13E9B82041B329B435F`. Embedded DB text hash `D0B35ED6CE56C3F621D3240D2F77AB5CE73EF5EE4AEA4E8583761A981B957D9C`; embedded Create screen text hash `90C2777C5D93DA6D9B94C70C6559267B8F48F8E89006596569F26B2FF2CEE717`. These are hashes of `sourcesContent`, not standalone recovered files. |
| Separate `sanad-rn` repo/worktrees | Older distinct repository and history; no matching durable-operation identifiers found in the inspected source scope. | **NOT FOUND in inspected scope.** Prior forensic inventory confirms it does not contain the E10 dirty source snapshot and uses a separate object store. |

The map contains 1,104 `sources` and 1,104 `sourcesContent` entries. The map’s DB source path points to the Desktop repository path, which supports the build-root relationship but does not identify an exact Git HEAD or complete source tree. No matching durable implementation was found in the reachable tracked database blobs (four distinct DB blobs were enumerated; schemas 7/8, with the fbbc blob containing only stubs). Prior forensic work also recorded no unreachable AES objects in the checked object store. These findings do not rule out an uninspected external backup.

## 6. File-by-file comparison

| File / surface | Current fbbc evidence | Historical/E10 evidence | Assessment |
|---|---|---|---|
| `src/core/database/AesGuardianDatabase.ts` | Tracked. `CURRENT_SCHEMA_VERSION = 8` (line 85); migrations only 1–8 (lines 98–395). `reserveCapaCreationOperation()` returns `{ operation_id: 'reserved' }` (2700–2702); reconciliation returns `null` (2704–2706); pending and unacknowledged lists return `[]` (2708–2714); acknowledgement/get return `null` (2716–2722). Its operation-named create method (2603+) inserts CAPA/audit/notification but does not reserve/link a durable operation. File hash above. | E10 embedded 182,334-character module; schema 10; migration 9 table and migration 10 acknowledgement; exact reservation, recovery, reconcile, ack, and operation create methods. | **CONTRADICTED:** fbbc production source does not implement the historical operation contract. The method names alone are not implementation evidence. |
| `src/core/database/capa-operation-utils.ts` | Untracked; SHA-256 `21732DA9BC4126DBB3D3EBB83ED07572488ABF420C505EF3F5655863862EC90E`. Provides canonical JSON, SHA-256, strict UUID-v4 checks/generation, entropy and collision errors. It has no database persistence or transactional code. | Embedded E10 utility content hash is the same `21732...` value. | **SOURCE VERIFIED, FRAGMENT ONLY:** exact helper survives; not the missing database implementation. The separate literate-bassoon worktree helper is a different file hash `F20814010A49170DA431A6C233BACFB41C3725C6D7813DE4D0742048C5553D36`. |
| `src/core/database/types.ts` and exports | Tracked operation status/interface, including `acknowledged_at`, exist at `types.ts:628–637`; conflict/integrity error classes and exports also exist (`AesGuardianDatabase.ts:476–486`, `database/index.ts`, `core/index.ts`). | E10 map contains corresponding types and implementation imports. | **SOURCE VERIFIED, FRAGMENT ONLY:** domain types/errors survived but are not wired to real fbbc DB operations. |
| `PreventionActionCreateScreen.tsx` | Tracked fbbc source calls reservation and operation APIs; line 245 calls `db.createCapaCreationOperationId()`. The current DB class has no such method. It then expects a real reservation reference/operation and uses stub methods. | E10 map includes a Create-screen source module wired to strict operation ID generation, reservation, explicit intent, recovery, result presentation and acknowledgement. Embedded hash above differs from fbbc screen. | **CONTRADICTED / integration failure:** fbbc screen assumes the implementation that its DB does not provide. With the current `as any` call path, absent method invocation throws at runtime before successful CAPA submission. |
| `PreventionActionDetailScreen.tsx`, Register, Overview | Current screens and CAPA lifecycle/display source survive. They do not implement operation reservation/recovery. | E10 map includes corresponding modules. | **PRESENT BUT PARTIAL:** ordinary CAPA lifecycle UI survives, not durable create identity. |
| Migration 9/10 | No `capa_creation_operations` table or CAPA-operation migration in fbbc. Existing occurrences of `acknowledged_at` elsewhere concern OH coordination, not CAPA operation state. | E10 database module includes migration 9 operation table and migration 10 `acknowledged_at`/recovery index. | **CONTRADICTED:** current schema constant is 8, not 10. |
| CAPA DB operation tests | `capa-operation-idempotency.test.ts` is untracked, SHA-256 `410A1A633C8AC766F141D2CFB0BE59F4FB242DD3885B3BE0C30AB1B9C6715AE6`; test source covers exact IDs, collisions, recovery, transaction/evidence and acknowledgement. | Historical reports describe earlier test revisions; E10 map does not contain test files. | **TEST VERIFIED as specification only.** Not executed here and cannot establish production implementation. |
| Migration test | `migration9.test.ts` is untracked, SHA-256 `2312EC4DB6197D55FD9E45F3DE62E68A151DDF0DDE6BD772255A9CA2B22520CC`; asserts schema 9/10, operation table, pending/committed/acknowledged compatibility. | The .10–.18 audit reports describe improved genuine v9-to-v10 fixture coverage. | **FRAGMENT ONLY.** Test expects migrations that current fbbc does not contain; no tests were run. |
| Create UI tests | `prevention-action-create-ui.test.tsx` is untracked. Test names cover same ID/new intent for Stage A/B, retry, remount recovery, explicit acknowledgement, and fresh ID after ack. | .15 documented a failing fresh-submit-after-ack regression; .16 claims a fix; .17/.18 report acceptance. | **TEST VERIFIED as present assertions only.** Not run; test mocks do not make current DB stubs functional. |

### 6.1 Current fbbc failure path

**SOURCE VERIFIED:** `PreventionActionCreateScreen.tsx:244–248` checks that the stub `reserveCapaCreationOperation` exists (it does), then calls `db.createCapaCreationOperationId()` at line 245. The current database class does not define that method. Although `capa-operation-utils.ts` exports `createCapaOperationId()`, that is a different method on a different module and the screen does not call it directly. The resulting undefined-method call is caught by the submit failure path; reservation stub output also lacks a `reference_code`, and the remaining DB recovery/ack APIs return placeholder values. Therefore current failure is both a **missing integration contract** and **missing production persistence implementation**, not just the previously reported operation-ID call mismatch.

## 7. Schema and migration reconciliation

- **Current fbbc:** schema version 8. `MIGRATIONS` lists versions 1–8. The CAPA table has ordinary action/reference/status fields; no `capa_creation_operations` table, operation foreign key, operation indexes, or durable acknowledgement migration are present.
- **Historical .5 implementation claim:** migration 9 adds `capa_creation_operations` with `operation_id` primary key, creator FK, canonical payload/hash, reference, pending/committed status, unique linked prevention action, unique reference and one-pending-per-creator index. It deliberately leaves legacy CAPA rows unchanged and does not fabricate operation IDs.
- **Historical .7 onward:** migration 10 adds nullable `acknowledged_at` plus an unacknowledged-recovery index. The `.10` audit specifically notes a real version-9 fixture with pending and committed rows migrated to version 10. `.17/.18` state the resulting data/recovery contract is accepted at source level.
- **E10 source-map evidence:** the embedded database explicitly reports schema version 10, describes migration 9 as durable CAPA operation storage, migration 10 as durable acknowledgement, and contains the corresponding methods. This independently corroborates the report chronology at the source-module level.

**Conclusion:** the schema contract was implemented in the historical module and E10 bundle, but is absent from current fbbc. Migration test files are not migration code.

## 8. Test and independent-audit evidence

The .5–.18 documents record repeated test runs, but this investigation did **not** run them. The chronology matters: implementation “complete” was not equivalent to acceptance. .6 blocked on three defects; .8 blocked on UUID validation and acknowledgement semantics; .10 blocked on new-vs-retry insert-race behavior; .12 blocked on initial UI intent and duplicate arguments; .14 conditionally accepted source lifecycle; .15 then reported a real failing regression after acknowledgement; .16 reported its correction; .17 and .18 conditionally accepted source behavior.

| Evidence item | What it establishes | What it does not establish |
|---|---|---|
| Existing untracked `capa-operation-idempotency.test.ts` | **TEST VERIFIED:** file contains tests for same-ID replay, payload/creator conflicts, distinct IDs with identical payload, deterministic insert-race injection, reservation/recovery, missing evidence, acknowledgement and operation retirement. | Does not establish that the current database implementation passes or even provides the schema/methods; no run performed. |
| Existing untracked `migration9.test.ts` | **TEST VERIFIED:** file contains schema-8-to-10, migration-9-to-10 fixture, pending/committed/legacy preservation, acknowledgement index assertions. | Does not prove migrations exist in current fbbc; current migration list ends at 8. |
| Existing untracked Create UI test | **TEST VERIFIED:** test names assert same ID/new intent for initial Stage A/B, retry retention, remount recovery, explicit acknowledgement, and fresh ID after ack. | Does not establish current DB integration. Current operations are placeholders; tests may mock them. No run performed. |
| Report .15 | **REPORT CLAIM:** one of 63 focused test cases failed, exposing retained acknowledged identity; full suite had one failure. | Not a current test result; later .16 says fixed. |
| Report .16 | **REPORT CLAIM:** focused 64/64 and full 1206 tests passed after clearing identity. | Not independently rerun. |
| Report .18 | **REPORT CLAIM / INDEPENDENTLY AUDITED:** focused CAPA suite 122 tests and full suite 1206 tests passed, with no source-level CAPA blocker. | Does not prove the currently checked-out fbbc source passes; does not establish native `op-sqlite`, native crypto, real two-connection races, physical restart, TalkBack/VoiceOver, or native RTL. |
| E10 source map | **SOURCE VERIFIED:** actual embedded production-module text contains v10 schema and operation methods. | Does not contain unit tests, prove exact Git HEAD/complete source tree, or prove native failure-mode coverage. |

### 8.1 Do current tests align with the historical design?

**Mostly yes as a specification; no as evidence of current production behavior.** The current untracked tests encode the later explicit identity, intent, recovery, migration, and acknowledgement requirements. The UI test includes assertions for initial `new` on both stages and a new ID after acknowledgement, matching corrections .13/.16 and audit .18. The DB tests include the insert-race and exact operation semantics described by .11–.18. However, the production database currently has no corresponding persistent migration or implementation. Treat these tests as a valuable preserved behavioral specification, not as passing proof. This report did not execute them.

## 9. Contradiction register

| Apparent contradiction | Reconciliation |
|---|---|
| .5 says “implementation complete,” while .6 rejects it. | .5 is an implementation report about an uncommitted dirty source state; .6 is an independent audit and identifies three blockers. The audit controls acceptance for that state. |
| .7/.9/.11/.13/.16 each say implementation is complete, while .8/.10/.12 and .15 identify defects. | Each correction report awaits re-audit; later independent audits found remaining issues. The issue sequence is iterative, not simultaneous final truth. The most recent issue (.15) was fixed according to .16 and audited in .17/.18. |
| .14 conditionally accepts, but .15 reports a failing test and source bug. | .15 is later evidence, so it supersedes .14 for the newly tested next-submission path; .16 reports the fix and .17 audits it. |
| .18 says source-level CAPA is conditionally accepted, while current fbbc has stubs. | The reports describe a historical dirty source snapshot (HEAD repeatedly recorded as c81) and E10 build state, not the current fbbc tree. The E10 source map confirms full module text; current source is a later, different state. |
| Current helper, types, exports, tests, and UI mention CAPA operations, but DB behavior is absent. | These are surviving fragments. Current operation-named DB methods return placeholder values, and the screen calls a missing generator method. Identifier/type/test presence is not durable production implementation. |
| Prior forensic report said durable implementation was not found in a complete candidate. | This investigation directly inspected the previously unparsed E10 map and found the complete CAPA database module embedded there. This refines, not negates, the earlier conclusion: no complete source checkout was found, but implementation source text survives inside the build artifact. |
| E10 map source path points to Desktop, but current Desktop differs. | Source-map `sources` preserve build-time module content and paths; they do not prove current file contents or exact build HEAD. Embedded hashes differ from fbbc database and Create screen hashes. |

## 10. Current fbbc defect classification

**Conclusion: source fragmentation + incomplete implementation + integration break.**

- **Source fragmentation:** the full operation implementation is absent from the currently available Git trees and source worktrees, but its module text survives in the E10 map. Historical reports describe implementation in the dirty c81 worktree; they do not show a commit containing it.
- **Incomplete implementation in fbbc:** schema/migrations 9–10 and operation transaction/reconciliation logic are absent; several API methods are placeholder stubs. `createPreventionActionForOperation()` inserts an action with audit and notification but does not bind it to a persisted operation ID or enforce new/retry intent.
- **Integration break:** the current Create screen calls `db.createCapaCreationOperationId()` but the current DB class lacks that method. The available utility's `createCapaOperationId()` is not wired to the database class. The screen also expects real reservation, listing, reconciliation, and acknowledgement behavior that current stubs do not provide.

It would be unsupported to say precisely when or why the full production source disappeared or that any one commit intentionally removed it. Git evidence shows the implementation is not present in the reachable tracked database blobs; it does not establish the human/process cause.

## 11. Answers to required questions

| Question | Historical evidence | Surviving source evidence | Conclusion | Confidence |
|---|---|---|---|---|
| 1. Was durable CAPA operation handling implemented historically? | .5–.18 sequence; .18 conditionally accepts. | E10 map embeds schema-10 DB source and operation lifecycle methods. | **Yes**, it was implemented and bundled; historical reports alone are not the only evidence. | High |
| 2. Which report documents the first production implementation? | `..._5_DURABLE_CAPA_OPERATION_IMPLEMENTATION_REPORT.md`. | E10 code corroborates that an implementation existed. | .4 is design-only; **.5 is first implementation report**. | High |
| 3. Which corrections changed the design/implementation? | .7 identity/committed recovery; .9 UUID/presentation/migration; .11 race intent; .13 Create lifecycle; .16 retirement after acknowledgement. | E10 map reflects schema 10 and methods for these behaviors. | Those corrections successively refined rather than replaced the core operation-table model. | High |
| 4. Which independent audits accepted/rejected which parts? | .6, .8, .10, .12 blocked; .14 conditionally accepted lifecycle; .17 conditionally accepted retirement; .18 conditionally accepted cross-screen. | E10 code corroborates source semantics but not audit execution. | .18 is the last acceptance, conditional on native/runtime/device validation. | High as chronology; report-based for test outcomes |
| 5. Last documented accepted CAPA state? | .18, 2026-11-19 00:17, conditional acceptance; .6–.17 findings resolved in their reported order. | E10 map has v10 operation/ack implementation. | **2E.1.7.2.5.18 source-level cross-screen conditional acceptance.** | High |
| 6. Does the accepted implementation survive in a current candidate? | Previous forensic report found no complete source checkout. | E10 source map contains full embedded DB and relevant screens/types/helper; current trees do not. | **Survives in embedded E10 module text, not as a complete source-tree candidate.** | High for map content; medium for exact .18 equivalence |
| 7. Is there a complete production implementation outside fbbc? | Reports and source map show historical implementation. | E10 bundle map embeds complete CAPA DB module and integrated screens; no other inspected source tree does. | **Yes as bundled source-map module evidence; no as a checked-out, reproducible project snapshot.** | High / scope-limited |
| 8. Does E10 map preserve relevant modules? | Earlier forensic evidence records E10 artifact and installed APK hash match. | Direct inspection: 1,104 source/content entries; database, Create/detail/register/overview, types, and helper modules present. | **Yes.** It preserves exact build-mapped module text, not tests or full project history. | High |
| 9. What is missing from current fbbc? | Historical contract .4–.18. | Direct source: schema 9/10, operation table/indexes, ID-generation DB method, real reservation/recovery/reconcile/ack/get APIs, operation-bound atomic create, explicit intent validation/binding are absent or stubbed. | The exact production gap is primarily `AesGuardianDatabase.ts` plus the missing DB-to-screen integration contract; see §6. | High |
| 10. Are current untracked tests consistent with the historical design? | Later reports describe corresponding test scenarios. | Direct test-file inspection shows these assertions are present. | **Generally yes as a specification.** They do not prove current implementation or passing behavior. | High |
| 11. Is fbbc defect regression, fragmentation, or incomplete work? | Dirty-source implementation claimed under c81; current fbbc is later. | Stubs, schema 8, missing generator method and source-map content show separate states. | **Combination** of source fragmentation, incomplete production implementation, and runtime integration break. Exact cause/time is unknown. | High for current defect; low for causal history |
| 12. Safest evidence-based CAPA recovery candidate? | .18 is last accepted report. | E10 source map is the strongest surviving implementation evidence; current helper/tests are fragments. | Preserve E10 map as primary reference. No direct recovery is authorized, and source-map reconstruction is expressly prohibited in this task. | High |
| 13. What remains impossible to establish? | Reports lack an exact source manifest/build command. | Source map cannot supply a full repository/test/config/history snapshot; no commit contains the full module. | Exact Git HEAD, complete dirty tree, build command, exact equality to .18 source, runtime test validity, and cause of source loss remain unestablished. | High |

## 12. Recovery recommendation and remaining unknowns

### Safest evidence-based course

1. Preserve the E10 APK, source map, logs and related evidence exactly as found; preserve current fbbc, c81/c0ab worktrees, all untracked CAPA helper/tests, and every Phase 2E report. Do not treat any as disposable.
2. Do not patch fbbc or copy pieces into it in this phase. The E10 source map is the primary surviving evidence for the missing CAPA database module; the untracked utility and tests are secondary supporting fragments/specification.
3. If recovery is authorized later, first establish a separate, non-destructive recovery workspace and record hashes of every input. The authorization must explicitly state whether source-map extraction is permitted, because this investigation explicitly prohibited reconstructing production source from it. Compare any authorized recovered modules against the E10 bundle source, .18 acceptance contract, and current fbbc before integration.
4. Keep native/runtime validation separate: historical Jest/Node-SQLite claims do not replace native crypto, op-sqlite, concurrency, restart, or accessibility verification.

### Unknowns

- Exact Git commit/tree and complete working-tree manifest used to produce the verified E10 APK.
- Whether the E10 module bytes are exactly the .18 audited files or a later/earlier source variant. The E10 module contains the expected v10/intent/ack behavior, but there is no standalone .18 implementation file/hash for byte comparison.
- Exact build command, build-time branch/HEAD, and whether every project module/config/test at build time still exists.
- Whether the historical test runs described in reports are reproducible; tests were not run here.
- Native React Native crypto availability, op-sqlite commit/rollback behavior, genuine concurrent reservation behavior, and physical process-restart behavior.
- Whether another uninspected backup/archive exists outside the searched repositories, worktrees, and identified E10 evidence.
- The cause and exact point at which the full database module ceased to exist in the source checkout.

## 13. Preservation state and exact next authorization

**Read-only verification:** Desktop HEAD remains `fbbc94136652bd4f8efe1b8d1fa85e14932692ca`; its expanded status remains 275 paths: 17 modified tracked generated artifacts, 6 deleted tracked generated artifacts, 252 untracked, 0 staged, 0 renamed, 0 conflicted. The previously requested `docs\SANAD_FORENSIC_SOURCE_RECOVERY_REPORT.md` accounts for the additional untracked path relative to the earlier 274-entry forensic inventory. The CAPA investigation itself changed no repository file, Git ref/index, build artifact, or emulator state. The new report is outside the project at:

`C:\Users\User\.copilot\session-state\a5296a0a-6b0a-4ce3-a007-4f338ec20fed\files\SANAD_CAPA_HISTORICAL_IMPLEMENTATION_RECONCILIATION_REPORT.md`

**Exact next action requiring user authorization:** authorize a separately scoped CAPA recovery phase and explicitly decide whether the E10 source map may be used as a source-recovery input. Until then, do not extract, copy, reconstruct, merge, or implement any CAPA code; do not modify reports or worktrees; and do not treat current tests or the APK as proof that fbbc contains the implementation.

## 14. Final answers in brief

1. **Yes:** durable CAPA operations were implemented historically and bundled.
2. First implementation report: **Phase 2E.1.7.2.5.5**.
3. Corrections: **.7, .9, .11, .13, .16**; .15 exposed the post-acknowledgement regression.
4. Audits: **.6/.8/.10/.12 blocked; .14/.17/.18 conditionally accepted**; .18 is last.
5. Last accepted state: **.18 conditional source-level cross-screen acceptance**, not native acceptance.
6. It survives as embedded source-map module text, not as a complete source checkout.
7. Complete source tree outside fbbc: **not found**; complete CAPA production module content in E10 map: **found**.
8. E10 map preserves the DB, operation utility, types, and relevant CAPA screens.
9. Current fbbc lacks migrations 9/10 and real reserve/list/reconcile/acknowledge/get/create-operation implementation; generator bridge is absent.
10. Current untracked tests match the historical contract broadly, but are unrun and cannot prove implementation.
11. Current defect is **source fragmentation + incomplete production implementation + integration break**.
12. Preserve the E10 map and all candidate source/tests; do not reconstruct until explicitly authorized.
13. Exact build snapshot, exact source equality with .18, native correctness, and loss cause remain unknown.

**Final disposition: HISTORICAL CAPA IMPLEMENTATION FOUND IN E10 SOURCE-MAP EVIDENCE; COMPLETE RECOVERABLE SOURCE TREE NOT FOUND.**