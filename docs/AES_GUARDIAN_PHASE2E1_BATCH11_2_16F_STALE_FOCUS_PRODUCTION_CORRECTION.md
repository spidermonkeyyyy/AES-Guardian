# AES Guardian - Phase 2E.1 Batch 11.2.16F

## 1. Executive recommendation

**ACCEPTED - STALE-FOCUS CORRECTION VERIFIED**

Batch 11.2.16E reproduced a stale-focus publication defect in `AesGuardianWorkspaceScreen.tsx`: an identity change while blurred recreated `loadRoleStats` with a captured `isFocused === false`, and refocus could invoke that stale callback so a valid count was rejected. The minimal correction is to include `isFocused` in the `loadRoleStats` callback dependencies.

After the change:

- The preserved blurred identity/refocus regression passed.
- All five existing stale-request regressions passed.
- The complete Notification Centre suite passed all 47 tests.
- The full Jest suite passed all 56 suites and 1249 tests.
- The only production file changed was `AesGuardianWorkspaceScreen.tsx`.

This result verifies the stale-focus defect corrected in this batch. It does not claim closure of the separate historical Batch 11.2.16A-D badge-removal intermittency.

## 2. Preflight preservation evidence

Verified before editing:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths.
- Complete initial status: 109 entries.
- Initial status capture: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16f-initial-status.txt`
- Initial status SHA-256: `612a79b265fafa6a0c9fe25ca7b21a0212d4463e9c160f7a5c51b8741aa792d0`
- Raw lockfile SHA-256: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile Git blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Protected preflight hashes:

| File | SHA-256 |
|---|---|
| `AesGuardianWorkspaceScreen.tsx` | `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0` |
| `NotificationCentreScreen.tsx` | `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a` |
| `notification-centre.test.tsx` | `96f9634334a38acd6699c464c705d4c732d73d32ead2d877197b917d6ff4cf2e` |
| Batch 11.2.16E report | `5a2d6bca30cbbf9517574348ddcd1dfc9315d9baa8575834341b373e7ccd8359` |

The test file was already modified and preserved byte-for-byte. It retains all prior RTL changes, all five stale-request regressions, and the Batch 11.2.16E characterization.

## 3. Root cause and callback/effect lifecycle

`AesGuardianWorkspaceScreen.tsx` defines `loadRoleStats` with `useCallback`. Before correction, its dependency list was:

`[activeRole, activeContext.userId]`

The callback nevertheless captures `isFocused` from `useIsFocused()` into `isRequestFocused`. The existing focus effect is:

`[isFocused, loadRoleStats]`

The sequence that reproduced stale focus was:

1. Workspace mounted while focused.
2. Identity changed while blurred.
3. The callback was recreated for the new role/user while `isFocused === false`.
4. Refocus changed `isFocused` but did not recreate the callback, because focus was absent from the callback dependency list.
5. The focus effect invoked the stale callback.
6. A valid unread count was queried, but the stale `isRequestFocused === false` guard rejected publication.
7. The badge retained the previous identity's count.

Including `isFocused` in the callback dependencies recreates `loadRoleStats` whenever focus changes. The refocus invocation now captures the current focused state, so a request started after refocus is eligible to publish while all existing version, role, and user guards remain enforced.

## 4. Exact production change

Only `AesGuardianWorkspaceScreen.tsx` was changed:

- Previous dependency list:
  `[activeRole, activeContext.userId]`
- Corrected dependency list:
  `[activeRole, activeContext.userId, isFocused]`

No guard condition was removed or weakened. No role/user check, monotonic `unreadRefreshVersion`, request error handling, tech-admin behavior, state setter, database query, repository, navigation, or badge rendering condition was changed.

## 5. Duplicate-query and stale-request safety

The correction follows the existing effect graph rather than redesigning it:

- Blur increments `unreadRefreshVersion` through the focus effect and does not call `loadRoleStats` while false.
- Identity change while blurred recreates the callback for the new role/user, but the callback is not invoked while blurred.
- Refocus recreates the callback with current focus and reruns the existing focus effect, which increments the version and invokes the callback once.
- Manual refresh still invokes the current callback directly.
- The callback still invalidates stale requests via the monotonic version.
- The captured role and user checks remain in the publication path.
- The same focus guard remains, but it now captures the focus state that existed when the callback was created for the refocused request.

The focused suite's 47 passing tests and all five stale-request tests provide evidence that this dependency correction does not introduce a duplicate or stale publication regression in the exercised lifecycle.

## 6. New regression test result

Command:

`npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "refocus publishes unread count after identity changes while blurred"`

- Start: `2026-11-19T20:18:11.9228067+01:00`
- End: `2026-11-19T20:18:23.1777325+01:00`
- Exit code: `0`
- Jest: 1 suite passed
- Tests: 1 passed, 46 skipped
- Snapshots: 0
- Target test time: 1990 ms
- React `act(...)` warnings: 0
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16f-regression.log`
- Log SHA-256: `30caa27b2646b489743e7a6ca316ef773a67957a2b1f41d743369f2de2dc6124`

The regression verifies that:

- Exposed user `1` initially publishes count `2`.
- The workspace remains mounted while blurred.
- Admin user `2` is selected while blurred.
- No admin unread query starts while blurred.
- Refocus starts the admin unread query.
- The deferred admin query resolves to `5`.
- The badge publishes exactly `5` instead of retaining `2`.

## 7. Existing stale-request regression results

Command:

`npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "older unread-count request|older unread-count rejection|identity switch prevents older user result|tech_admin switch invalidates older badge request|focus loss and regain invalidates older request"`

- Start: `2026-11-19T20:18:30.1016651+01:00`
- End: `2026-11-19T20:18:39.6060970+01:00`
- Exit code: `0`
- Jest: 1 suite passed
- Tests: 5 passed, 42 skipped
- Snapshots: 0
- React `act(...)` warnings: 0
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16f-stale-regressions.log`
- Log SHA-256: `ae8c700fbc2a0255a77e088c741227c58c84f4be6559876c69d6b13636d16679`

All five preserved tests passed.

## 8. Complete Notification Centre suite

Command:

`npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`

- Start: `2026-11-19T20:18:54.5947593+01:00`
- End: `2026-11-19T20:19:09.3251768+01:00`
- Exit code: `0`
- Suite count: 1 passed, 1 total
- Test count: 47 passed, 47 total
- Snapshots: 0
- Jest time: `11.531 s`
- React `act(...)` warning lines: `27`
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16f-focused.log`
- Log SHA-256: `660967676922c51a90c7a7c14ac9a24d6619ff8b10a1b7634429d53a5f9ea621`

## 9. Full Jest suite

Command:

`npm.cmd test -- --runInBand`

- Start: `2026-11-19T20:19:16.0323380+01:00`
- End: `2026-11-19T20:21:17.3833492+01:00`
- Exit code: `0`
- Suite count: 56 passed, 56 total
- Test count: 1249 passed, 1249 total
- Snapshots: 0
- Jest time: `118.058 s`
- React `act(...)` warning count: `339` warning lines
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16f-full-jest.log`
- Log SHA-256: `c701fb78749f4ba1dda5cbae098f635f8e63bb88757fd6136bf689c08488c0af`

The full run passed; warning output remains present in the inherited test suite set.

## 10. TypeScript result

Command:

`npx.cmd tsc --noEmit --pretty false`

- Start: `2026-11-19T20:21:28.0017571+01:00`
- End: `2026-11-19T20:21:51.4896565+01:00`
- Exit code: `2`
- Total inherited baseline diagnostics: `769`
- Diagnostics referencing `AesGuardianWorkspaceScreen.tsx`: `0`
- Diagnostics referencing `notification-centre.test.tsx`: `0`
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16f-tsc.log`
- Log SHA-256: `8025da9ddbce219789e8f2a17c795900633d46652d25e1b10c4f94397a9586d6`

The project-wide TypeScript check is not passing. It has the established 769 inherited diagnostics and no diagnostic in either changed relevant file.

## 11. Diff validation

Command: `git diff --check`

- Exit code: `0`
- No whitespace errors.
- Git emitted a line-ending warning for the pre-existing `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx` working copy.

## 12. Final hashes and preservation audit

Final protected hashes:

| File | Final SHA-256 |
|---|---|
| `AesGuardianWorkspaceScreen.tsx` | `13b58312fd19814367ce63d2430f17753c3195fd2ee2e70fde648a27c0bd9868` |
| `NotificationCentreScreen.tsx` | `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a` |
| `notification-centre.test.tsx` | `96f9634334a38acd6699c464c705d4c732d73d32ead2d877197b917d6ff4cf2e` |
| Raw `package-lock.json` | `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667` |
| Batch 11.2.16E report | `5a2d6bca30cbbf9517574348ddcd1dfc9315d9baa8575834341b373e7ccd8359` |

Normalized lockfile Git blob: `e397c195e4e22231204add4fdfafb1ba50219736`

At final:

- Branch remains `migration/aes-guardian`.
- HEAD remains `c81a50c98e4e7330fad479a51a48a2fea7f912a1`.
- Committed tree remains `983733927b18bf30b8377f84c9c1813c74c4bf6b`.
- Index tree remains `983733927b18bf30b8377f84c9c1813c74c4bf6b`.
- No paths are staged.
- The Notification Centre screen is byte-identical.
- The test file is unchanged from its preflight hash.
- The lockfile is unchanged.
- The Batch 11.2.16E report is unchanged.

The complete initial status contained 109 entries and had `AesGuardianWorkspaceScreen.tsx` already modified. After this batch, final status remains 109 entries plus the untracked Batch 11.2.16F report. The report is the only additional repository path attributable to this batch. The workspace source change is the only production change attributable to this batch.

No dependencies, manifests, configuration, navigation, database, repository, or unrelated production file were changed. No staging, commit, branch change, remote access, reset, restore, emulator, or device operation occurred.

## 13. Remaining limitations and next recommended action

This batch proves the stale-focus callback defect is corrected for the exact blurred identity-change/refocus ordering and preserves the existing stale-request protections.

It does not independently test or explain the separate intermittent badge-removal assertion from Batches 11.2.16A-D. That historical concern remains unresolved and must be investigated under its own authorization.

No next implementation should begin without review. The next decision is whether to retain this correction and authorize Batch 11.2.17 or another independent audit.
