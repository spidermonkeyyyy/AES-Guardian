# AES Guardian — Phase 2E.1.7.2.5.9
## UUID, Presentation Acknowledgement and Reservation Integrity Correction Report

## Final status

**IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT RE-AUDIT**

This status does not claim independent acceptance or cross-screen closure.

## Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- `package-lock.json` SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No commit, staging, branch change, reset, remote operation or dependency change.
- Existing Phase 2E.1.7.2.5.2–2E.1.7.2.5.8 work and reports were preserved.

## Correction A — UUID validation

`src/core/database/capa-operation-utils.ts`

### Generator behavior

- `crypto.randomUUID()` is preferred.
- `crypto.getRandomValues()` is the supported fallback and creates a UUID-v4 shape.
- No `Math.random()`, timestamp, counter or static identifier fallback remains.
- Secure APIs throwing or returning unusable output throw
  `CapaOperationEntropyUnavailableError`.

### Canonical validation

The shared `isValidCapaOperationId()` validator requires:

- exact 36-character UUID shape;
- hexadecimal characters;
- UUID version `4`;
- RFC variant nibble `8`, `9`, `a`, or `b`.

The same validator is used by:

- `createCapaOperationId()`;
- repository explicit-ID reservation;
- `createPreventionActionForOperation()`.

Malformed, empty, oversized or wrong-version/variant IDs are rejected before
reservation or persistence.

All-zero `getRandomValues()` output is rejected as unusable.

### Collision behavior

The operation table is queried after UUID validation.

- `reservationIntent = 'new'` rejects an existing primary-key operation with
  `CapaOperationIdCollisionError`.
- `reservationIntent = 'retry'` permits exact payload/creator reconciliation.
- The compatibility wrapper generates a genuinely fresh ID for a genuinely new call
  and does not adopt an existing operation.

Valid-looking deterministic collisions are covered by a focused test.

## Correction B — explicit result confirmation

`src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`

### Normal success

After exact CAPA reconciliation, the screen now:

- stores the confirmed action in presentation state;
- displays a localized result card;
- does not immediately call `navigation.goBack()`;
- does not call acknowledgement on mount or render.

### Recovered success

A committed unacknowledged operation is reconciled on return/remount and displayed
through the same result card.

The existing recovery card now includes recovery context.

### Explicit confirmation

The card provides:

- localized title;
- recovery context when applicable;
- CAPA reference;
- localized "I have seen this result" action;
- accessible label;
- in-progress state;
- acknowledgement-specific failure text;
- retry action.

Pressing confirmation calls:

`acknowledgeCapaCreationOperation(userId, operationId)`

Navigation occurs only after acknowledgement returns successfully.

### Failure behavior

Acknowledgement failure:

- keeps the result card visible;
- keeps `acknowledged_at` null;
- keeps the operation discoverable;
- displays an acknowledgement-specific error;
- allows retry;
- does not create another CAPA;
- retains the original operation ID.

## Localization

`src/localization/index.ts` now includes FR/EN/AR keys for:

- result card title;
- recovery explanation;
- explicit confirmation action;
- acknowledgement in-progress;
- acknowledgement failure.

Existing success/reference keys remain available.

## Migration 10

Migration 10 remains additive:

- adds nullable `acknowledged_at TEXT`;
- adds `idx_capa_operation_unacknowledged`
  on `(created_by_user_id, status, acknowledged_at)`.

Existing operation rows receive null acknowledgement.
Existing legacy CAPAs remain without operation identity.

The Migration 9 test file now contains:

- v8-to-current migration preservation;
- v9 pending and committed fixture setup;
- v10 application;
- pending status/payload-preservation assertion;
- committed link/status assertion;
- null acknowledgement assertion;
- legacy CAPA preservation;
- unacknowledged index verification.

The test helper applies migrations sequentially inside the existing migration runner.

## Stage B and Stage A uniqueness classification

Reservation insertion now distinguishes:

- pending-operation-per-creator unique conflict;
- CAPA/operation reference unique conflict;
- all unrelated database errors.

Reference conflicts are bounded to five reservation attempts.
Every retry retains the operation ID and canonical payload.

The Stage B transaction catch retries only:

- `UNIQUE constraint failed: prevention_actions.reference_code`;
- `UNIQUE constraint failed: capa_creation_operations.reference_code`;
- `idx_capa_operation_reference`;

Primary-key, operation-link, pending-per-creator and unrelated uniqueness conflicts
are propagated without a reference retry.

If the adapter does not expose a recognizable constraint name, the catch fails closed
and propagates the database error.

## Transaction integrity

Stage B remains atomic:

- pending operation reload;
- creator/payload/status validation;
- CAPA insert;
- positive safe insert-ID validation;
- creation audit insert;
- creation notification insert;
- operation-to-CAPA link;
- operation committed status;
- SQLite commit.

Pre-commit rollback leaves the pending operation.
No operation is marked committed outside the transaction.

## New and updated tests

### Entropy

`src/core/database/__tests__/capa-operation-entropy.test.ts`

- unavailable crypto;
- throwing `randomUUID`;
- throwing `getRandomValues`;
- all-zero unusable entropy;
- malformed/empty/non-v4 IDs;
- valid UUID v4.

### Migration

`src/core/database/__tests__/migration9.test.ts`

- v8-to-v10 preservation;
- v9 pending and committed fixtures;
- null acknowledgement;
- linked committed operation;
- legacy CAPA preservation;
- acknowledgement index.

### Operation identity

`src/core/database/__tests__/capa-operation-idempotency.test.ts`

- valid-looking repeated ID collision;
- exact retry;
- changed payload;
- changed creator;
- distinct IDs with identical payload;
- pending rollback;
- missing CAPA/audit/notification evidence;
- committed recovery and acknowledgement;
- pending acknowledgement rejection;
- repeated acknowledgement.

### Create screen

`src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- normal success result card;
- no acknowledgement before explicit confirmation;
- recovered result card;
- acknowledgement failure/retry;
- no duplicate creation on retry;
- navigation only after successful acknowledgement.

## Verification

### Focused tests

Exact command:

`npm test -- --runInBand src/core/database/__tests__/capa-operation-entropy.test.ts src/core/database/__tests__/migration9.test.ts src/core/database/__tests__/capa-operation-idempotency.test.ts src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

- Exit: `0`
- Suites: `4 passed`
- Tests: `56 passed`

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `0`
- Suites: `56 passed`
- Tests: `1198 passed`
- Failed: `0`
- Skipped: `0`

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- Diagnostics: `769`
- Changed-file diagnostics: `0`
- Remaining diagnostics are inherited SANAD diagnostics.

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 stopped because no flat config exists.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Remaining limitations

- React Native availability of secure crypto APIs remains unverified without a native build.
- Native `@op-engineering/op-sqlite` commit/rollback/bridge behavior remains unverified.
- No emulator or physical-device test was launched.
- Genuine multi-connection concurrency was not exercised.
- Migration rollback/failure injection beyond existing migration infrastructure was not
  separately claimed.

## Files changed for Phase 2E.1.7.2.5.9

- `src/core/database/capa-operation-utils.ts`
- `src/core/database/AesGuardianDatabase.ts`
- `src/core/database/index.ts`
- `src/core/index.ts`
- `src/localization/index.ts`
- `src/core/database/__tests__/capa-operation-entropy.test.ts`
- `src/core/database/__tests__/capa-operation-idempotency.test.ts`
- `src/core/database/__tests__/migration9.test.ts`
- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `docs/AES_GUARDIAN_PHASE2E1_7_2_5_9_PRESENTATION_ACKNOWLEDGEMENT_AND_UUID_CORRECTION_REPORT.md`
