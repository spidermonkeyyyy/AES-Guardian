# AES Guardian - Phase 2E.1 Batch 11.2.20

## 1. Executive recommendation

**BLOCKED - PRODUCTION BEHAVIOR DEFECT REPRODUCED**

The test-only prerequisite batch reproduced a current create-coordination submission defect: invoking the existing confirmation callback twice while the repository promise is pending issued two `createOhCoordination` calls. The test expected one call and received two.

The exact payload test, loading/disabled test and generic failure/retry test passed within the focused suite. The existing notification transaction boundary is covered by repository/workflow tests. The repeated-confirmation defect must be corrected in a separate production batch before RTL migration is authorized.

Per the stop condition, adjacent OH workflow tests, full Jest and TypeScript were not run after the focused suite failure.

## 2. Preservation preflight

Verified before editing:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Initial status entries: 115
- Initial status capture: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-20-initial-status.txt`
- Initial status SHA-256: `fd1b7c51524a61b4527d1df41609d6efdaf8ae58756b714ebde73e4df08f8c3c`
- Raw lockfile SHA-256: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Pre-edit hashes:

| File | SHA-256 |
|---|---|
| `oh-coordination-batch6-acceptance.test.tsx` | `ee5b02ba6ec5a2001f5d0bcd35c9a4c98ec7b9ae4867272b6ff8609edcf6921b` |
| `CreateCoordinationScreen.tsx` | `3d1241bb11d964600aaa85a0f95768eb9e2f4037fb26340f26b76c7101b3aee4` |

No production source or lockfile changed.

Note: the intended index-tree value was verified by git as `983733927b18bf30b8377f84c9c1813c74c4bf6b`; the visually similar form in this report is corrected below and in the preflight record.

## 3. Exact payload test evidence

Test `15. Admin reviewer can create coordination with canonical reason` now asserts the complete repository call:

```ts
{
  declaration_id: 1201,
  created_by_user_id: adminUserId,
  coordination_reason: 'serology_monitoring',
}
```

The test also asserts:

- one repository call
- audit event type `OH_COORDINATION_CREATED`
- audit creator user ID
- audit entity type `oh_coordination`
- numeric coordination entity ID
- exact declaration description
- success alert
- `goBack()` navigation

This test passed within the focused suite.

## 4. Repeated-confirmation test and outcome

Test:

`15B. Repeated confirmation callbacks while pending do not create duplicate submissions`

The test:

- seeds declaration `1802`
- selects admin reviewer
- mocks `createOhCoordination` with one pending promise
- opens the existing confirmation alert
- invokes the confirmation callback twice under `act`
- leaves the repository operation unresolved during the first assertion
- asserts repository call count is one

The reproduction:

- Expected calls: `1`
- Received calls: `2`
- Failure line: `oh-coordination-batch6-acceptance.test.tsx:740`

Relevant focused-suite failure:

```text
expect(jest.fn()).toHaveBeenCalledTimes(expected)
Expected number of calls: 1
Received number of calls: 2
```

The test demonstrates that the current implementation's `submitting` state is not a synchronous guard for repeated confirmation callbacks. Each callback can enter `createOhCoordination` before React state has blocked the second callback.

The repository/DB duplicate constraints remain unchanged. The reproduction is at the UI confirmation lifecycle.

The failing test is preserved as a bounded behavioral reproduction. No production ref or lock was added.

## 5. Loading and disabled test evidence

Test:

`15A. Pending confirmation exposes loading/disabled state and settles normally`

The test uses a deferred repository promise and asserts:

- the repository operation starts once
- submit button `accessibilityState.disabled` is `true`
- submit button `accessibilityState.busy` is `true`
- after resolving the repository promise, `disabled` returns `false`
- after resolving the repository promise, `busy` returns `false`

This test passed within the focused suite.

## 6. Generic failure and retry evidence

Test:

`15C. Generic repository failure preserves reason and permits retry`

The test:

- rejects the first repository call with `Network failure`
- asserts generic alert title and message
- asserts no success alert
- asserts `goBack()` is not called
- asserts selected reason remains selected
- asserts loading/disabled state returns to normal
- makes a second repository call resolve successfully
- asserts success alert and two repository calls total

This test passed within the focused suite.

## 7. Audit and notification side-effect disposition

Notification creation is already asserted at the repository transaction boundary:

- `src/core/database/__tests__/notification-workflow.test.ts`
  - test `Event 5: createOhCoordination notifies oh_professional`
  - asserts recipient OH role, event type, entity type, title key, message key and idempotency key
- `src/core/database/__tests__/notification-workflow-hardening.test.ts`
  - test `createOhCoordination: rolls back if notification fails`
  - asserts no coordination and no notification remain after a notification failure

These existing tests suffice for notification side-effect coverage; notification tests were not duplicated in this batch.

The screen audit event was verified by a focused `db.logAuditEvent` spy in test 15. The exact payload passed and the test suite exercised the screen wrapper without production instrumentation.

## 8. Focused verification result

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx`

- Start: `2026-11-19T21:14:01.1629530+01:00`
- End: `2026-11-19T21:14:15.7712945+01:00`
- Exit code: `1`
- Suites: 1 failed, 1 total
- Tests: 35 passed, 1 failed, 36 total
- Snapshots: 0
- React `act(...)` warning lines: `80`
- Complete log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-20-focused.log`
- Log SHA-256: `499d80755783e793b888102981b47e3bb42f17d286543d1d709f329e80164272`

Per the stop condition, adjacent OH workflow tests, full Jest and TypeScript were not run after the reproduced defect.

## 9. TypeScript and diff-check results

TypeScript was not run after the stop condition.

`git diff --check` exited `0`. Git emitted an existing line-ending warning for
`src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx`.

## 10. Final preservation audit

Preexisting worktree changes and untracked reports are preserved.

At completion:

- `CreateCoordinationScreen.tsx` remains unchanged
- only `oh-coordination-batch6-acceptance.test.tsx` was modified for tests
- only this report was created
- branch and HEAD remain unchanged
- committed and index trees remain unchanged
- no staged paths
- lockfile raw hash and Git blob remain unchanged
- no navigation, localization, shared component, repository, database, audit or notification implementation changed

Final file hashes:

- `oh-coordination-batch6-acceptance.test.tsx`: `7083eaa40ed3c1451d005bc98d64d0433f96977476a89f353e931554413b14f5`
- `CreateCoordinationScreen.tsx`: `3d1241bb11d964600aaa85a0f95768eb9e2f4037fb26340f26b76c7101b3aee4`
- Raw lockfile: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Final target and test hashes must be recorded after the diff-check step.

## 11. Remaining defect

The repeated confirmation callbacks are the reproduced remaining defect. It is a UI lifecycle defect distinct from the database duplicate guard.

No RTL migration should proceed until a separately bounded production correction adds a synchronous submission guard or equivalent behavior and this failing reproduction passes.

## 12. Recommendation for the next batch

Authorize a separate correction batch limited to the create-coordination confirmation lifecycle. It should add a synchronous duplicate-submission guard and preserve exact payload, loading/disabled, generic failure/retry, audit and notification behavior.

The RTL migration remains deferred until the repeated-confirmation prerequisite becomes green.
