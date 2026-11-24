# AES Guardian — Phase 2E.1.7.2.5.17
## Independent Acknowledgement Retirement Audit

## Executive recommendation

**CONDITIONALLY ACCEPTED — SOURCE-LEVEL CLOSURE WITH EXPLICIT NATIVE VALIDATION LIMITATIONS**

The source-level acknowledgement lifecycle is corrected:

- successful acknowledgement clears active operation state;
- failed acknowledgement preserves active operation state;
- repeated acknowledgement is guarded synchronously;
- a second genuine submission generates a fresh ID;
- Stage A and Stage B receive `new`;
- the previous operation remains acknowledged and is not reopened.

The remaining conditions are native/runtime verification limitations: React Native
crypto availability, production `@op-engineering/op-sqlite` behavior, genuine
multi-connection concurrency, and physical process-restart behavior.

## Repository identity and read-only state

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No source/test/migration modification was made by this audit.
No GitHub operation, commit, staging, reset or branch change was performed.

## Acknowledgement retirement ordering

`handleConfirmPresentation()` in
`src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`:

1. verifies presented action, operation ID, creator authorization and acknowledgement lock;
2. sets a synchronous `acknowledgementLock.current = true`;
3. sets React in-progress state;
4. awaits `acknowledgeCapaCreationOperation(userId, operationId)`;
5. only after success clears:
   - `presentedAction`;
   - `recoveredCommittedAction`;
   - `operationId`;
   - `operationIntent`;
   - `creationReference.current`;
6. only then calls `navigation.goBack()`.

Failure leaves all active state and the result card intact and keeps the operation
durably unacknowledged. It sets only acknowledgement-error UI state.

## Exact operation identity

Acknowledgement uses the exact `operationId` currently displayed in the result state.
It does not infer identity from reference, creator or payload.

The repository method also verifies exact creator, committed status, linked CAPA,
payload, audit and notification evidence before writing `acknowledged_at`.

## Double-interaction protection

The acknowledgement lock is a synchronous `useRef` guard in front of React state.
Two rapid presses cannot pass it concurrently.

Submission is also guarded by `submissionLock.current`.
The submit button is disabled while the result is shown or acknowledgement is in
progress.

## Fresh submission after acknowledgement

After successful acknowledgement:

- `operationId` becomes `null`;
- `operationIntent` becomes `null`;
- `creationReference.current` becomes `null`;
- `presentedAction` becomes `null`.

The next submission sees no active ID and:

1. generates a new secure operation ID;
2. Stage A uses `new`;
3. Stage B uses `new`;
4. does not reuse or reopen the acknowledged operation.

The UI test
`acknowledged operation is not reused for a genuine new submission`
verifies that the second ID differs and Stage A/Stage B use `new`.

## Navigation independence

State retirement occurs before `navigation.goBack()`. It does not depend on the
component unmounting. If navigation is delayed or mocked, active state is already
retired after persisted acknowledgement.

## Acknowledgement failure

Failure does not execute retirement:

- operation ID remains;
- creation reference remains;
- presented result remains;
- lifecycle remains retry/recovered;
- acknowledge lock is released;
- retry acknowledgement uses the same ID.

The test
`failed acknowledgement keeps the result and allows retry without recreation`
asserts the result remains, acknowledgement is retried, and no second CAPA is
created.

## UI test audit

`src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`

The suite directly asserts:

- no acknowledgement before explicit confirmation;
- explicit confirmation calls acknowledgement with exact operation ID;
- failure keeps result card and allows retry;
- repeated confirmation invokes acknowledgement once;
- fresh submission generates a second ID and uses `new`;
- restored pending operation uses `retry`;
- reconciled result waits for explicit confirmation.

The first-submission test verifies Stage A and Stage B receive the same ID and
payload with `new`.

## Database/recovery audit

`acknowledgeCapaCreationOperation()`:

- rejects missing operations;
- rejects pending operations;
- rejects missing linked CAPA;
- reconciles exact payload and evidence;
- sets `acknowledged_at` only for exact committed linked operations;
- is idempotent on repeat acknowledgement;
- removes the operation from unacknowledged recovery because
  `acknowledged_at IS NULL` filtering is no longer satisfied.

The existing database test verifies repeated acknowledgement and pending rejection.

No schema change is needed.

## Migration 10

Migration 10 remains additive:

- nullable `acknowledged_at`;
- unacknowledged recovery index;
- existing operation rows remain null;
- no legacy operation IDs fabricated.

The migration test verifies pending, committed and legacy preservation.

## Previous safeguards

Still verified:

- UUID-v4 validation;
- secure entropy fail-close;
- insert-race collision handling;
- exact retry semantics;
- Stage B atomicity;
- audit/notification evidence;
- committed-unacknowledged recovery;
- legacy compatibility;
- role boundaries.

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
- ESLint flat configuration missing

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Native limitations

Not verified:

- React Native crypto runtime availability;
- production `@op-engineering/op-sqlite` bridge behavior;
- genuine two-connection concurrency;
- physical process restart;
- native UI presentation timing.

## Findings

### MINOR — native/runtime validation gap

No native-device or native-adapter evidence is available.

This is an environmental verification limitation, not a source correctness blocker.

## Repository preservation

HEAD, committed tree and lockfile remain unchanged.
No source/test/migration/configuration file was modified by this audit.
Pre-existing work remains in the working tree.

## Final decision

**CONDITIONALLY ACCEPTED — SOURCE-LEVEL CLOSURE WITH EXPLICIT NATIVE VALIDATION LIMITATIONS**

The acknowledged retirement lifecycle is source-correct and directly tested.
Native and physical-process validation remains the bounded condition.
