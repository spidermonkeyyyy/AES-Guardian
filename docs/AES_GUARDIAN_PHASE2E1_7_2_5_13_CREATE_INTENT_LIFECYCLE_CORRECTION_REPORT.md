# AES Guardian — Phase 2E.1.7.2.5.13
## Create-Screen Operation Intent Lifecycle Correction Report

## Final status

**IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT RE-AUDIT**

This report does not claim independent acceptance or cross-screen closure.

## Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No GitHub operation, commit, staging, reset, branch change or dependency change
occurred.

## Implementation changes

### Create screen lifecycle

`src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`

Added explicit screen-level operation intent state:

- `new`
- `retry`

The screen also tracks the resolved operation ID and reference.

Initial submission:

1. Generate one secure operation ID.
2. Set lifecycle intent to `new`.
3. Reserve Stage A with `new`.
4. Continue Stage B with `new`.
5. Never generate a replacement ID between the stages.

Restored or uncertain operations:

- restore the exact persisted operation ID;
- set lifecycle intent to `retry`;
- reserve/resume and continue Stage B with `retry`;
- do not create a second operation.

Generic repository failures and uncertain outcomes retain the existing operation
reference and set retry intent for subsequent execution.

### Removed legacy fallback

The Create screen no longer falls through to the compatibility
`createPreventionAction(...)` API.
It requires `createPreventionActionForOperation(...)`.

### Exact method arguments

The screen now calls:

- `reserveCapaCreationOperation(userId, input, operationId, undefined, intent)`
- `createPreventionActionForOperation(userId, input, operationId, reference, intent)`

There are no duplicate or extraneous intent arguments.

The database APIs remain mandatory:

- `reserveCapaCreationOperation(...)` requires `reservationIntent`;
- `createPreventionActionForOperation(...)` requires `reservationIntent`.

## UI test evidence

Updated:

- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

Focused UI coverage now verifies:

- initial Stage A call receives `new`;
- initial Stage B call receives `new`;
- initial Stage A/B receive the same operation ID;
- restored pending operation uses `retry`;
- no restored retry generates a new operation ID;
- uncertain/generic retry retains the original operation;
- presentation acknowledgement is not invoked on mount/render;
- explicit confirmation invokes acknowledgement;
- acknowledgement failure preserves the result and permits retry;
- navigation is withheld until acknowledgement succeeds.

## Database reconstruction evidence

Updated:

- `src/core/database/__tests__/capa-operation-idempotency.test.ts`

The repository reconstruction test now:

- reserves a real pending operation;
- constructs a new `AesGuardianDatabase` against the existing supported test adapter;
- lists the pending operation by exact ID;
- resumes it with `retry`;
- completes it exactly once;
- verifies replay returns the same CAPA ID.

The test uses repository reconstruction over the supported Node SQLite test adapter.
It does not claim native process restart or a physically closed native database.

## Preserved safeguards

The correction preserves:

- strict UUID-v4 validation;
- secure entropy fail-closed behaviour;
- insert-race `CapaOperationIdCollisionError`;
- exact operation-ID retry;
- Stage A/B creator/payload validation;
- atomic CAPA/audit/notification/operation commit;
- committed-but-unacknowledged recovery;
- explicit presentation acknowledgement;
- Migration 9/10 behaviour;
- FR/EN/AR localization;
- existing role boundaries.

## Verification

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- 4 suites passed
- 62 tests passed

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- 56 suites passed
- 1204 tests passed
- 0 failed

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 inherited SANAD diagnostics
- 0 changed-file diagnostics

The project-wide TypeScript check is not clean.

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 reports that no flat `eslint.config.*` file exists.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Limitations

- No native React Native crypto availability test was performed.
- No native `@op-engineering/op-sqlite` bridge test was performed.
- No emulator or physical-device process restart was performed.
- Reconstruction uses the supported test adapter and is not a native process-restart test.

## Changed files

- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `src/core/database/__tests__/capa-operation-idempotency.test.ts`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_13_CREATE_INTENT_LIFECYCLE_CORRECTION_REPORT.md`

## Final repository state

HEAD and tree remain unchanged from the expected baseline.
Lockfile SHA-256 remains unchanged.
No GitHub operation, commit, staging, reset or branch change occurred.
