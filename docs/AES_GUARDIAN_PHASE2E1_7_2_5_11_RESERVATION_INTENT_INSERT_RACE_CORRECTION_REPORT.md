# AES Guardian — Phase 2E.1.7.2.5.11
## Reservation Intent and Insert-Race Correction Report

## Final status

**IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT RE-AUDIT**

This report does not claim independent acceptance or CAPA cross-screen closure.

## Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No GitHub operation, commit, staging, branch change, reset, dependency change or
lockfile change occurred.

Existing Phase 2E.1.7.2.5.2–2E.1.7.2.5.10 reports and working-tree changes were
preserved.

## Reservation intent contract

`reservationIntent` is now required for both:

- `reserveCapaCreationOperation(...)`
- `createPreventionActionForOperation(...)`

Allowed values:

- `new`: a genuinely new operation using a newly generated secure ID;
- `retry`: exact retry of the original retained operation ID.

There is no implicit default for these APIs.
The repository rejects runtime calls whose intent is missing or invalid.

The compatibility wrapper `createPreventionAction(...)` now always generates a fresh
secure operation ID and passes `new`. It no longer accepts an optional old operation
ID as a retry selector.

## Stage A intent preservation

The Create screen generates one secure operation ID for a new submission and calls:

1. `reserveCapaCreationOperation(..., operationId, ..., 'new')`
2. `createPreventionActionForOperation(..., operationId, ..., 'retry')`

The explicit method preserves `reservationIntent` through:

- existing-row reconciliation;
- Stage A insertion;
- Stage A insert-catch classification;
- recursive reservation recovery;
- Stage B reference-collision retry;
- recursive Stage B creation.

It cannot silently convert a `new` request into `retry`.

## Insert-race correction

For a `new` reservation:

1. An initial exact-ID lookup establishes that no operation exists.
2. A competing operation may insert the same ID first.
3. The original insert observes that an exact operation row now exists.
4. The Stage A catch rejects with `CapaOperationIdCollisionError`.
5. The competing operation is not returned or reconciled.

For a `retry`:

1. Exact operation-ID lookup remains permitted.
2. Creator and canonical payload/hash are verified.
3. Only the original matching operation is reconciled.
4. Changed creator/payload remains integrity/conflict failure.

The insertion catch now handles new intent before any recursive retry call.

## Stage B reference retry

Stage B reference uniqueness retry still preserves:

- the original operation ID;
- canonical payload/hash;
- the same logical operation;
- a bounded retry count.

Stage B primary-key and operation-link uniqueness failures are propagated rather than
classified as reference retries.

## Create-screen correction

`PreventionActionCreateScreen.tsx` no longer falls back to
`createPreventionAction(...)`.

The screen now:

- requires `createPreventionActionForOperation`;
- generates one secure ID for a genuinely new submission;
- passes `new` during initial Stage A reservation;
- passes `retry` for the same retained operation ID;
- does not replace an operation ID after uncertain outcomes;
- preserves the explicit result-card/acknowledge workflow.

## Compatibility API

`createPreventionAction(...)` remains source-compatible for two- or
three-argument ordinary calls and:

- always generates a fresh secure operation ID;
- passes `new`;
- never treats an old caller-supplied ID as retry semantics.

Existing callers that need retry behavior must use
`createPreventionActionForOperation(...)` with explicit intent.

## Regression tests

### Insert race

`capa-operation-idempotency.test.ts`

The race test injects a competing operation during the actual adapter reservation
insert boundary. It verifies:

- initial operation ID can be controlled;
- competitor row is inserted before the original insert;
- original `new` call throws `CapaOperationIdCollisionError`;
- competitor is not returned;
- one competing row remains.

This is deterministic adapter fault injection, not genuine multi-connection
concurrency.

### Intent contract

Tests verify:

- missing intent fails at runtime;
- `new` existing-ID collision fails;
- `new` insert-race collision fails;
- `retry` exact operation succeeds;
- changed payload/creator rejects;
- compatibility wrapper ignores optional old-ID arguments and creates fresh identities.

### Existing protection

Existing focused tests retain:

- UUID entropy and malformed output;
- Migration 9/10;
- exact reconciliation;
- missing audit/notification evidence;
- Stage B rollback;
- Create result card and acknowledgement;
- acknowledgement failure/retry.

## Verification

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- Suites: `4 passed`
- Tests: exact focused aggregate is recorded by the focused command in the verification
  session. The race-specific suite was run separately: 1 suite, 21 tests passed.

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- Suites: `56 passed`
- Tests: `1201 passed`
- Failed: `0`
- Skipped: `0`

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 inherited SANAD diagnostics
- 0 changed-file diagnostics

The project is not TypeScript-clean.

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 stopped because no flat ESLint config exists.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Limitations

- Genuine two-connection concurrency was not tested.
- Native React Native crypto availability remains unverified.
- Native `@op-engineering/op-sqlite` bridge/transaction semantics remain unverified.
- No emulator or physical-device run was performed.

## Final repository state

Final HEAD and tree remain:

- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
