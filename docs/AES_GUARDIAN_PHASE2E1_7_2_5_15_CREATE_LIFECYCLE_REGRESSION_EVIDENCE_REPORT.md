# AES Guardian — Phase 2E.1.7.2.5.15
## Create Lifecycle Regression Evidence Report

## Result

**TEST EVIDENCE BLOCKED — PRODUCTION DEFECT EXPOSED**

The three requested evidence areas are covered in source and test code, but the
new-submission-after-acknowledgement regression test fails and exposes a production
lifecycle defect.

No production code was changed.

## Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No commit, staging, reset, branch change, remote operation or lockfile change occurred.

## Changed-file inventory

The test-only changed file for this phase is:

- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

No production source, migration, localization, configuration or dependency file was
changed for this phase.

## Required test coverage

### 1. Stage A / Stage B payload and intent identity

`prevention-action-create-ui.test.tsx`
contains a direct test named:

- `initial Stage A and Stage B use new with the same operation ID`

It asserts:

- Stage A `reservationIntent` is `new`;
- Stage B `reservationIntent` is `new`;
- Stage A and Stage B receive the same operation ID;
- Stage A and Stage B receive semantically equal canonical payload values;
- the secure ID generator is called exactly once;
- no replacement ID is generated between Stage A and Stage B.

### 2. Uncertain retry ID and intent preservation

The existing retry test now asserts:

- the first call uses intent `new`;
- the retry call uses intent `retry`;
- both calls use the same operation ID;
- the secure ID generator is called exactly once.

The uncertain reconciliation test also verifies the original operation ID is used
for reconciliation and that blind retry is blocked until reconciliation is resolved.

### 3. New submission after acknowledgement

The test suite contains:

- `acknowledged operation is not reused for a genuine new submission`

It performs:

1. first submission;
2. explicit acknowledgement;
3. reset/second submission attempt;
4. assertions for a second operation ID, `new` Stage A/Stage B intent, and no reuse.

The test currently fails because the screen does not reset the acknowledged operation
identity and intent before the second submission.

## Exposed production defect

**Defect location:** `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`

After successful acknowledgement:

- `operationId` is not reset;
- `creationReference` is not reset;
- `operationIntent` is not reset;
- `activeOperationId` therefore remains the acknowledged ID.

On a subsequent submission, the screen can reuse that old operation as the active ID
and may call Stage B with retry semantics instead of generating a genuinely new
operation and calling Stage A/B with `new`.

**Evidence:**

The failing test received zero reserve calls for the second submission.
It expected Stage A to reserve a second ID but the screen retained the first ID state.

The defect is a production lifecycle bug, not a test-only mock artifact.

## Why implementation was not changed

This phase was test-only and explicitly required stopping for assessment if a
genuine production defect is exposed.

No production code was changed.
The failing test remains in the suite as evidence.

## Focused-test discrepancy reconciliation

Earlier implementation reports:

- Phase 2E.1.7.2.5.13 reported 62 focused tests.
- Phase 2E.1.7.2.5.14 reported 60 focused tests.

The current direct focused run is authoritative:

- 4 suites;
- 63 test cases;
- 62 passed;
- 1 failed.

The discrepancy is a reporting inconsistency in prior summaries, not evidence of
current source/test removals established by this session.
The current suite was counted by the Jest result directly.

## Verification results

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `1`
- 4 suites: 1 failed, 3 passed
- Tests: 63 total
- Passed: 62
- Failed: 1
- Failed test:
  `acknowledged operation is not reused for a genuine new submission`

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `1`
- 56 suites: 55 passed, 1 failed
- Tests: 1205 total
- Passed: 1204
- Failed: 1

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 inherited SANAD diagnostics
- No changed-file TypeScript diagnostic was identified for this test-only phase.

The project-wide compiler result is not clean.

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 reports missing flat configuration.

### Diff check

Exact command:

`git diff --check`

- Exit: `0`

## Final Git status

HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`

Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`

Lockfile SHA-256:
`59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

Production files were unchanged.
The only Phase 2E.1.7.2.5.15 source/test change is the UI test file containing
the failing regression evidence.

No production fix was applied.
No prohibited Git or remote operation occurred.

## Completion status

**TEST EVIDENCE BLOCKED — PRODUCTION DEFECT EXPOSED**

The three evidence areas are present, but the acknowledged-next-submission test
fails. This phase therefore does not meet its completion criterion.
