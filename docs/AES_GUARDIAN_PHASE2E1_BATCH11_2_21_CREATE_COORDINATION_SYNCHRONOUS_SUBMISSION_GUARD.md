# AES Guardian - Phase 2E.1 Batch 11.2.21

## 1. Executive recommendation

**ACCEPTED - SYNCHRONOUS DUPLICATE-SUBMISSION GUARD VERIFIED**

`CreateCoordinationScreen.tsx` now has a synchronous screen-instance submission lock. It is set at the start of the confirmation callback before repository invocation and released in `finally` on success or failure.

The Batch 11.2.20 repeated-confirmation regression is green: one repository call occurs while pending and no second call occurs after settlement. Exact payload/audit, loading/disabled and generic failure/retry behavior also pass in the focused suite.

No RTL migration was performed.

## 2. Preflight and preservation evidence

Verified before editing:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Initial status entries: 116
- Initial status capture: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-21-initial-status.txt`
- Initial status SHA-256: `cb5e8222f9266db6d0ca39057c5f7034ec82df455d518134fec423c82362f1c`
- Raw lockfile SHA-256: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Pre-edit target hashes:

| File | SHA-256 |
|---|---|
| `CreateCoordinationScreen.tsx` | `3d1241bb11d964600aaa85a0f95768eb9e2f4037fb26340f26b76c7101b3aee4` |
| `oh-coordination-batch6-acceptance.test.tsx` | `7083eaa40ed3c1451d005bc98d64d0433f96977476a89f353e931554413b14f5` |

The test file had the required Batch 11.2.20 final hash and remained unchanged in this batch. Pre-existing worktree and untracked reports were preserved.

Note: the raw lockfile value above matches the repository canonical hash. The 11.2.21 preflight SHA-256 is identical to the established canonical value.

## 3. Root-cause explanation

Batch 11.2.20 established that the existing `submitting` React state is not synchronous. The confirmation callback could be invoked twice before React state was rendered or observed by the closure, allowing two `createOhCoordination` calls.

The repository and database duplicate constraints remain valid independent defenses, but they do not protect against duplicate callback entry before the first operation settles.

## 4. Exact production change and guard lifecycle

Only `CreateCoordinationScreen.tsx` was changed.

Production change:

- Imported `useRef`
- Added a screen-local `submittingRef = useRef(false)`
- Included the synchronous guard in `handleCreate`
- At the start of the confirmation callback:
  - return if `submittingRef.current` is true
  - set `submittingRef.current = true` before repository invocation
- Preserved `setSubmitting(true)` immediately after the synchronous guard
- Preserved the existing repository call, audit call, success/error alerts and navigation
- Released `submittingRef.current = false` in `finally`
- Preserved `setSubmitting(false)` in `finally`

Lifecycle:

1. Initial submit opens the existing confirmation alert.
2. First confirmation callback checks false, sets the ref true synchronously, sets React loading true, and starts the repository call.
3. A repeated confirmation callback checks true and returns without a repository/audit/success/notification action.
4. Repository success or failure enters `finally`.
5. The synchronous ref and React loading state are cleared, allowing a later retry.

The existing `submitting` state remains the visible loading/disabled mechanism.

## 5. Regression test before/after

Before correction:

- Focused suite failed test `15B`
- Repository call count: expected 1, received 2

After correction:

- Test `15B` passes
- First callback starts one repository call
- Repeated callback is ignored while pending
- Call count remains exactly one during and after settlement
- Existing success behavior occurs once

The test was not weakened, skipped or rewritten.

## 6. Exact payload/audit, loading and failure evidence

Exact payload test passed:

- `declaration_id: 1201`
- `created_by_user_id: adminUserId`
- `coordination_reason: 'serology_monitoring'`
- One repository call
- One audit event with the existing entity and description fields
- Success alert and `goBack()` behavior preserved

Loading/disabled test passed:

- Pending state exposes disabled and busy
- Both return to false after settlement

Generic failure/retry test passed:

- First call rejects
- Generic alert appears
- No success alert or goBack
- Selected reason remains available
- Loading/disabled state clears
- Retry succeeds

## 7. Verification commands, exit codes and counts

### 1. Focused suite

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx`

- Start: `2026-11-19T21:24:36.7019111+01:00`
- End: `2026-11-19T21:25:08.9612088+01:00`
- Exit code: `0`
- Suites: 1 passed, 1 total
- Tests: 36 passed, 36 total
- Snapshots: 0
- React `act(...)` warning lines: `80`
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-21-focused.log`
- Log SHA-256: `723f395347a12f3a1a47a041252877cf77e1fc99c5401942c93658ae7da635fa`

### 2. Adjacent UI and declaration suites

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/oh-coordination-detail-screen.test.tsx src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx`

- Start: `2026-11-19T21:25:21.0028208+01:00`
- End: `2026-11-19T21:25:34.2578743+01:00`
- Exit code: `0`
- Suites: 2 passed, 2 total
- Tests: 47 passed, 47 total
- Snapshots: 0
- React `act(...)` warning lines: `39`
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-21-adjacent.log`
- Log SHA-256: `b3a33620fae84b6f8a4a6e5571b36375fe822878116d9e5cab4a055bfc352d46`

The attempted database path `src/core/database/__tests__/oh-coordination-workflow.test.ts` did not exist and was not counted as a suite run.

### 3. Adjacent OH workflow suite

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/oh-coordination-workflow.test.ts`

- Start: `2026-11-19T21:25:44.4585790+01:00`
- End: `2026-11-19T21:25:50.1631339+01:00`
- Exit code: `0`
- Suites: 1 passed, 1 total
- Tests: 60 passed, 60 total
- Snapshots: 0
- React `act(...)` warning lines: `0`
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-21-oh-workflow.log`
- Log SHA-256: `a725f372bec75be9f4d43d263bec3fa5a8de5c6fd56d0f8f8161b0f6a4f32cda`

### 4. Full Jest

Command:

`npm test -- --runInBand`

- Start: `2026-11-19T21:25:59.1418313+01:00`
- End: `2026-11-19T21:28:05.8569435+01:00`
- Exit code: `0`
- Suites: 56 passed, 56 total
- Tests: 1252 passed, 1252 total
- Snapshots: 0
- React `act(...)` warning lines: `328`
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-21-full-jest.log`
- Log SHA-256: `a0bb7142bf822f7032b555a6442df80e37e31619496c281c026eb195c4203860`

### 5. TypeScript

Command:

`npx tsc --noEmit --pretty false`

- Start: `2026-11-19T21:28:21.8485851+01:00`
- End: `2026-11-19T21:28:59.5279623+01:00`
- Exit code: `2`
- Diagnostics: `769`
- Diagnostics in `CreateCoordinationScreen.tsx`: `0`
- Diagnostics in `oh-coordination-batch6-acceptance.test.tsx`: `0`
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-21-tsc.log`
- Log SHA-256: `8025da9ddbce219789e8f2a17c795900633d46652d25e1b10c4f94397a9586d6`

The TypeScript result matches the inherited 769-diagnostic baseline and is not project-wide clean.

### 6. Diff validation

Command: `git diff --check`

- Exit code: `0`
- No whitespace errors
- Existing line-ending warning remains for `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx`

## 8. Final Git/worktree preservation audit

Final repository identity:

- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Raw lockfile unchanged
- Normalized lockfile blob unchanged

The test file was unchanged in this batch and retains the Batch 11.2.20 hash. The only production change is `CreateCoordinationScreen.tsx`. No navigation, localization, shared component, database, repository, audit or notification file was changed.

Pre-existing worktree modifications and untracked reports remain preserved.

## 9. Final changed-file hashes

| File | Final SHA-256 |
|---|---|
| `CreateCoordinationScreen.tsx` | `a4b3973c5770f014872492bac4d997753e024d39bbb2021d048de29e933c2467` |
| `oh-coordination-batch6-acceptance.test.tsx` | `7083eaa40ed3c1451d005bc98d64d0433f96977476a89f353e931554413b14f5` |


## 10. Remaining limitations

- Native/device RTL and alert behavior remain unverified.
- This batch does not migrate Create Coordination RTL presentation.
- Project-wide TypeScript remains non-passing due to inherited diagnostics.

## 11. Recommendation for the next batch

The synchronous duplicate-submission defect is corrected and accepted. The next authorized work can proceed to the separate Create Coordination RTL migration batch, with the existing repeated-confirmation, payload/audit, loading and failure/retry regressions retained.
