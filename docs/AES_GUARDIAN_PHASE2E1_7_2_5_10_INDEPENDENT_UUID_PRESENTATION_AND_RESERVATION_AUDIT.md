# AES Guardian — Phase 2E.1.7.2.5.10
## Independent UUID, Presentation Acknowledgement and Reservation Audit

## Executive recommendation

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**

Phase 2E.1.7.2.5.9 improves UUID validation, presentation acknowledgement and reference
collision classification. It does not satisfy the insert-race invariant:

> A genuinely new logical operation must never inherit or reconcile an existing
> operation after a primary-key collision.

The primary blocker is that reservation and creation API paths allow a new operation
to use `reservationIntent = 'retry'`, and an insert-time primary-key collision can
fall through reconciliation as an existing operation.

## Repository preservation

- Root: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

The audit made no source, test, migration or configuration changes.

No remote operation, commit, staging, reset, branch change or dependency change was
performed.

## Exact changed-file inventory

The 2E.1.7.2.5.9 implementation changes include:

- `src/core/database/capa-operation-utils.ts`
- `src/core/database/AesGuardianDatabase.ts`
- `src/core/database/types.ts`
- `src/core/database/index.ts`
- `src/core/index.ts`
- `src/core/database/__tests__/capa-operation-entropy.test.ts`
- `src/core/database/__tests__/capa-operation-idempotency.test.ts`
- `src/core/database/__tests__/migration9.test.ts`
- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `src/localization/index.ts`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_9_PRESENTATION_ACKNOWLEDGEMENT_AND_UUID_CORRECTION_REPORT.md`

Earlier tracked and untracked CAPA changes/reports remain preserved.

## Finding 1 — BLOCKER: insert-race false replay

**Source:** `AesGuardianDatabase.ts`

Relevant paths:

- `reserveCapaCreationOperation(...)`
- `createPreventionActionForOperation(...)`
- Stage A insert catch

The initial existence check distinguishes an existing operation from a new ID:

- `reservationIntent === 'new'`: throws `CapaOperationIdCollisionError`;
- `reservationIntent === 'retry'`: validates creator/payload and reconciles.

However, the Stage A insert catch does this after an insert error:

```text
query exact operation ID
if exactly one row exists:
    call reserveCapaCreationOperation(..., exactOperationId, ...)
```

The recursive call does not explicitly carry the original `reservationIntent`.
It uses the default `reservationIntent = 'retry'`.

Therefore, a pre-insert existence check can pass, another operation insert the same ID,
and the first insert then observe that existing row. The catch classifies it through
retry semantics instead of treating the first genuinely new operation as a collision.

If creator and payload match, the existing operation can be returned and reconciled.
This is false replay after an insert-race collision.

**Minimum corrective scope:**

1. Preserve `reservationIntent` through all Stage A retries and recursive calls.
2. If a `new` reservation loses a primary-key insert to an existing operation, throw
   `CapaOperationIdCollisionError` immediately.
3. Only `retry` may query and reconcile an existing exact operation.
4. Add a controlled two-state insert-race test that forces:
   - precheck absence;
   - another row inserted before this reservation insert;
   - the first call must reject collision.

## Finding 2 — BLOCKER: API defaults new production calls to retry

**Source:** `AesGuardianDatabase.ts`,
`createPreventionActionForOperation(...)`

`createPreventionActionForOperation()` declares:

```text
reservationIntent: 'new' | 'retry' = 'retry'
```

The Create screen calls it without an explicit intent.
It can therefore create or retry an operation without the API enforcing which
logical-operation contract the caller intended.

The compatibility wrapper has `_legacyOperationId` and accepts a fourth operation ID
as a retry selector. A caller can pass an existing ID into this wrapper.

**Minimum corrective scope:**

1. Remove `reservationIntent = 'retry'` as an implicit default.
2. Require explicit intent for each call.
3. The Create screen must pass `'new'` for initial submission and `'retry'` only for
   an already retained original operation ID.
4. Remove operation-ID retry semantics from the legacy wrapper or keep it behind a
   separate, explicitly named retry API.

## Finding 3 — MAJOR: legacy Create-screen fallback remains

**Source:** `PreventionActionCreateScreen.tsx`

The screen branches into `createPreventionAction(...)` if
`createPreventionActionForOperation` is unavailable.

The fallback does not give the screen a guaranteed explicit operation ID and no
guaranteed `reservationIntent`.
It can hide the explicit contract from a runtime/mocked old database implementation.

Production database currently exposes the explicit API, but the fallback is an
alternate bypass.

**Minimum corrective scope:** Remove the legacy fallback from the production Create
screen. The screen should require and use `createPreventionActionForOperation`.

## Finding 4 — MAJOR: reconciliation does not protect insert-race catch

**Source:** Stage B catch in `createPreventionActionForOperation()`

Stage B reattempt logic recognizes reference uniqueness and retries with the same
operation ID. This is source-supported for reference conflicts.

The insert-race concern belongs in Stage A. Stage A currently loses intent in the
ambiguous after-insert lookup. Fixing it in Stage B alone is insufficient.

## UUID audit

**PASS** for format and weak-fallback removal.

Source evidence:

- strict UUID-v4 regex;
- exact 36-character shape;
- version 4 and RFC variant;
- `randomUUID()` validated;
- `getRandomValues()` checked;
- all-zero output rejected;
- no `Math.random()` or counter fallback;
- repository boundary validates explicit IDs.

Tests cover unavailable crypto, throwing APIs, malformed values and valid UUID v4.

Native React Native crypto availability remains unverified.

The valid-looking repeated-ID test proves only a pre-insert existing operation with
`new` intent. It does not cover insert-time race recovery.

## Presentation acknowledgement audit

**PASS** for explicit UI contract.

Source evidence:

- normal success stores confirmed action and presents a result card;
- recovery reconciles and presents the same result card;
- mount/render/effect does not call acknowledgement;
- explicit button calls acknowledgement;
- button is disabled while acknowledgement is in flight;
- failed acknowledgement keeps the card and operation recoverable;
- successful acknowledgement navigates away;
- navigation alone does not acknowledge;
- already acknowledged operations are not listed.

UI tests cover no mount acknowledgement, explicit confirmation, recovery, failure
and retry. Database acknowledgement persistence is covered separately.

## Localization and accessibility

New FR/EN/AR keys exist for:

- result title;
- recovery context;
- confirmation action;
- in-progress state;
- acknowledgement failure.

The confirmation button has an accessibility label and disabled/loading state.

No unsupported clinical instructions or hardcoded FR/EN/AR result strings were found
in the new card.

## Migration 10 audit

**PASS** for fixture authenticity, with one limitation.

The test initializes to version 9, inserts pending and committed operation rows,
inserts an existing CAPA and a legacy CAPA, and initializes to version 10.

It verifies:

- pending status and null acknowledgement;
- committed link/status and null acknowledgement;
- legacy CAPA preservation;
- acknowledgement index.

This is materially stronger than a fresh 1-through-10-only test.

Rollback/failure injection for migration 10 was not implemented and remains a
reported limitation.

## Stage A and Stage B uniqueness audit

### Stage A

The test and source do not directly prove an insert-time primary-key collision for
`reservationIntent = 'new'`.

The catch that sees an existing operation after insert is unsafe because it can switch
to retry semantics.

Pending-per-creator and reference unique conflicts are distinguished in the source,
but primary-key conflict handling is missing.

### Stage B

Stage B treats recognizable reference unique names specifically. It propagates:

- primary-key errors;
- operation-link uniqueness;
- pending-per-creator conflicts;
- unrelated database errors.

No Stage B test injects a primary-key or operation-link conflict.

Source shape is acceptable for those known constraint names if the adapter preserves
the constraint string. Native/adapters without enough metadata should fail closed,
which the current code generally does for unrecognized names.

## Reservation retry test quality

Existing coverage includes:

- pre-insert reference uniqueness setup;
- bounded setup;
- exact operation/canonical replay;
- pending rollback;
- missing evidence.

Missing direct coverage:

- real insert-time primary-key collision;
- `reservationIntent = 'new'` at the insert boundary;
- primary-key collision not reconciling;
- reference retry exhaustion;
- non-reference uniqueness injection at reservation insertion;
- genuine concurrent two-connection test.

Sequential setup is not concurrency proof.

## Transaction and reconciliation audit

Stage B includes:

- exact pending operation reload;
- creator/payload/status validation;
- CAPA insertion;
- positive safe insert ID;
- creation audit;
- creation notification;
- operation link;
- committed status;
- commit.

Reconciliation validates exact operation, creator, payload/hash, status, linked CAPA,
reference, audit and notification.

Missing evidence is uncertain or integrity-failing.

Node SQLite tests do not prove native bridge behavior.

## Verification

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- 4 suites passed;
- 56 tests passed.

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- 56 suites passed;
- 1198 tests passed;
- 0 failed.

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`;
- 769 diagnostics;
- 0 changed-file diagnostics.

### Lint

Exact command:

`npm run lint`

- Exit: `2`;
- ESLint flat configuration is missing.

### Diff

Exact command:

`git diff --check`

- Exit: `0`.

## Native limitations

- Native React Native crypto availability is unverified.
- Native `@op-engineering/op-sqlite` behavior is unverified.
- Genuine multi-connection concurrency was not tested.
- Migration failure injection was not separately tested.

## Comparison against Phase 2E.1.7.2.5.8 findings

1. Invalid UUID output: **resolved** by strict regex and validator.
2. Effect-based acknowledgement: **resolved** by explicit user confirmation.
3. Normal success navigation: **resolved** by result-card confirmation.
4. Migration 10 coverage: **substantially improved** but rollback injection remains.
5. Broad Stage B uniqueness: **source improved** for known constraint names.
6. Insert-race false replay: **NOT RESOLVED**.
7. Reservation intent default: **NOT RESOLVED**.

## Final repository status

HEAD, tree and lockfile remain at the expected values.
Existing working-tree changes and reports remain preserved.
The audit created no implementation or test changes.

## Final decision

**BLOCKED — CORRECTIVE IMPLEMENTATION REQUIRED**
