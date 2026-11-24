# AES Guardian — Phase 2E.1.7.2.5.16
## Acknowledged Operation Retirement Correction Report

## Final status

**IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT RE-AUDIT**

No cross-screen acceptance is claimed.

## Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No remote operation, commit, staging, reset, branch change or lockfile change occurred.

## Root cause

The Create screen retained the acknowledged operation identity after successful
acknowledgement:

- `operationId` remained set;
- `creationReference` remained set;
- `operationIntent` remained `retry`;
- `presentedAction` was cleared, but active submission state was not reset.

Consequently, a subsequent genuine submission could reuse the acknowledged operation
ID instead of generating a fresh ID and using `new`.

## Correction

`src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`

After the repository acknowledgement promise succeeds:

- `presentedAction` is cleared;
- `recoveredCommittedAction` is cleared;
- `operationId` is cleared;
- `operationIntent` is cleared;
- `creationReference.current` is cleared.

Acknowledgement state is not retired until persistence succeeds.
Acknowledgement failure retains:

- operation ID;
- creation reference;
- presented result;
- retryable acknowledgement state.

An acknowledgement interaction lock prevents repeated confirmation taps from issuing
concurrent acknowledgement calls.

## New-submission behavior

After successful acknowledgement:

1. the previous operation remains acknowledged in SQLite;
2. the screen active identity is cleared;
3. the next submit generates a fresh secure operation ID;
4. Stage A receives `new`;
5. Stage B receives `new`;
6. the previous operation is not reopened or adopted.

## Restored, uncertain and failure behaviour

Restored pending operations keep `operationIntent = 'retry'`.

Uncertain outcomes set retry intent and retain the original operation ID/reference.
They do not generate a replacement ID.

Acknowledgement failure does not clear active identity or reference and the result
card remains visible.

## Test evidence

### Updated test

`src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

The new test:

- acknowledges operation A;
- verifies operation A acknowledgement;
- starts another submission;
- verifies operation B receives a different generated ID;
- verifies Stage A and Stage B receive `new`;
- verifies operation A is not reused.

The test suite also verifies:

- repeated confirmation invokes acknowledgement once;
- failure keeps the result and allows retry;
- retry uses the same operation ID;
- restored pending operations use `retry`;
- initial submissions use `new`;
- no acknowledgement occurs before explicit confirmation.

## Verification

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- 4 suites passed
- 64 tests passed

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- 56 suites passed
- 1206 tests passed
- 0 failed

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 inherited SANAD diagnostics
- 0 changed-file diagnostics

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 stopped because no flat ESLint configuration exists.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Focused count reconciliation

The prior report counts of 62 and 60 were summary inconsistencies.
The direct current run for the four focused suites is authoritative:

- 4 suites
- 64 tests
- 64 passed

The current UI test suite also has 33 tests.

## Changed files

- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_16_ACKNOWLEDGED_OPERATION_RETIREMENT_CORRECTION_REPORT.md`

No production repository migration or database schema change was required.

## Native limitations

- Native React crypto availability is unverified.
- Native `@op-engineering/op-sqlite` commit/rollback behavior is unverified.
- Genuine multi-connection concurrency was not tested.
- No emulator or physical-device process restart was performed.

## Final repository state

- HEAD remains `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree remains `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256 remains
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No prohibited Git or remote operation was performed.
