# AES Guardian — Phase 2E.1 Batch 11.2.16E

## Executive recommendation

**STALE-FOCUS DEFECT REPRODUCED — PRODUCTION CORRECTION PROPOSAL REQUIRED**

The mounted workspace was blurred, switched from exposed user `1` to authorized admin user `2` while still blurred, and refocused. No admin unread query ran while blurred. After refocus, the admin query started and resolved successfully with `5`, but the rendered badge retained the exposed user's prior count `2`. The isolated regression test fails on the expected count assertion. The source guard explains the result: the callback captures `isFocused === false` during the blurred identity change; focus is not a callback dependency, so the subsequent refocus reuses that callback and rejects publication.

This report characterizes the issue only. No production code, guard, dependency array, database behavior, or existing regression test was changed.

## Preservation preflight

Verified before editing:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Staged paths: none
- Complete initial `git status --short`: 108 entries, captured outside the repository at `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16e-initial-status.txt`
- Initial status capture SHA-256: `e7e6f1908a2d235e0230241c8acc4c7df4bb0dbed22924a0e355946eccf9fc1b`

The target test file was already modified at preflight as part of prior work. Its initial SHA-256 was `e719c69f5f910ceebdfa304ae32ef4fb7a659c6419952ac19c53261186efe006`. The new characterization was added without replacing prior changes.

Protected file hashes at preflight:

- `AesGuardianWorkspaceScreen.tsx`: `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0`
- `notification-centre.test.tsx`: `e719c69f5f910ceebdfa304ae32ef4fb7a659c6419952ac19c53261186efe006`
- `NotificationCentreScreen.tsx`: `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a`
- Raw `package-lock.json`: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile Git blob: `e397c195e4e22231204add4fdfafb1ba50219736`
- Existing Batch 11.2.16D report: `a89426516a1d22ad8bccde5c348a278d2bf9925cf0ad45b1d029e912a55f5800`

## Lifecycle scenario and test design

The new test is `refocus publishes unread count after identity changes while blurred` in `src/features/aes-guardian/__tests__/notification-centre.test.tsx`.

1. It explicitly sets mocked focus to true and selects the existing `exposed_professional` demo identity, user `1`.
2. The mounted workspace's mocked unread query returns `2`; the test waits for badge `2`.
3. It sets focus false and rerenders the same mounted workspace inside `act`.
4. While still blurred, it selects `admin_reviewer`, user `2`, rerenders, and waits for the update opportunity. It asserts the role/user changed and that no admin unread query has started.
5. It refocuses and rerenders the same component. It waits for the admin query and asserts the exact query sequence is `[1, 2]`.
6. The test resolves a deferred admin query with `5`, verifies the query returned `5`, then asserts the badge displays `5`.

The test uses existing synthetic identities and a test-local mocked count. The mock rejects any unexpected user ID. `act` and `waitFor` synchronize transitions and query start; no arbitrary sleep or production instrumentation is used. Because the test deliberately expects the correct new count, it is red against the current implementation and will serve as a regression check after a separately authorized correction.

## Callback recreation and publication evidence

`AesGuardianWorkspaceScreen.tsx` still defines `loadRoleStats` with dependencies `[activeRole, activeContext.userId]`. It reads `isFocused` into `isRequestFocused`, then only publishes a returned unread count when the refresh version, captured focus, current role, and current user all match.

The test demonstrates the relevant callback lifecycle behaviorally:

- The role and user change to admin while blurred; the store and rerender confirm the new identity.
- No admin unread query starts during that blurred render.
- Refocus starts exactly one unread query for admin user `2`, proving the updated identity's callback path was used.
- The deferred request resolves normally with `5`; it does not reject or remain pending.
- The badge is still `2`, and the assertion reports `Expected: "5", Received: "2"`.

The test does not introspect a private hook callback identity or log the guard's internal booleans. The source-level dependency and guard inspection accounts for the observed result: identity changes recreate the callback while `isFocused` is false; the refocus-only change does not recreate it because `isFocused` is omitted from its dependencies. The refocus effect invokes that callback, whose captured-focus predicate is false. The version and current identity have no intervening changes in the test, so the captured-focus check is the rejecting condition. The setter is therefore not reached, and the previous badge value remains visible.

No unrelated role data is exposed or queried: the test mock accepts only the initial exposed user and the new admin user, and the observed call list is exactly `[1, 2]`.

## Existing stale-request regressions

The five pre-existing tests remain in the file, unchanged by this batch:

- `older unread-count request cannot overwrite a newer resolved count`
- `older unread-count rejection cannot disturb a newer resolved badge`
- `identity switch prevents older user result from publishing`
- `tech_admin switch invalidates older badge request`
- `focus loss and regain invalidates older request`

Their targeted run passed all five with no React `act(...)` warnings.

## Test execution record

Commands ran from the repository root using the existing dependencies. Times below are local time, `+01:00`. Complete, unfiltered stdout/stderr was captured for every execution. Retained logs are outside the repository. The second exploratory isolated-run log path was overwritten by the final isolated run, so its full output is preserved in the execution record rather than a separate retained file.

### 1. Initial isolated characterization

- Command: `npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "refocus publishes unread count after identity changes while blurred"`
- Start/end: `2026-11-19T19:40:17.8734708+01:00` – `2026-11-19T19:40:29.2749958+01:00`
- Exit code: `1`; 1 suite failed; 1 test failed, 46 skipped; 0 snapshots.
- Failure: expected the admin badge `5`; the query result had resolved, but `queryByText('5')` returned `null`.
- React `act(...)` warnings: 0.
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16e-isolated.log`
- Log SHA-256: `c61ccc78f5370aed989d0a13a8122ff5cd54f8b3cbef46bdf033406b45a9a204`

### 2. Isolated characterization with explicit count comparison

- Command: `npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "refocus publishes unread count after identity changes while blurred"`
- Start/end: `2026-11-19T19:40:50.8523017+01:00` – `2026-11-19T19:41:01.7760564+01:00`
- Exit code: `1`; 1 suite failed; 1 test failed, 46 skipped; 0 snapshots.
- Failure: `Expected: "5"`, `Received: "2"` at the new badge-count assertion.
- React `act(...)` warnings: 0.
- Original log path: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16e-isolated-final.log` (subsequently overwritten by the final isolated run; its output was captured in the execution transcript).
- This run preceded the final explicit initial focus/role setup in the test; the same blurred identity-change and refocus behavior was exercised.

### 3. Focused Notification Centre suite, initial run

- Command: `npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- Start/end: `2026-11-19T19:41:07.5531885+01:00` – `2026-11-19T19:41:22.3238374+01:00`
- Exit code: `1`; 1 suite failed; 1 test failed, 46 passed; 0 snapshots; Jest time `11.778 s`.
- Failure: the new test expected `"5"` and received `"2"`.
- React `act(...)` warning lines: `26`. These warnings appeared in the full file run; the isolated target itself had zero.
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16e-focused.log`
- Log SHA-256: `3e85888045336a5dc431ba1e631ac9a0051381c31a2834525bac1d694cbec42b`

### 4. Five existing stale-request regressions

- Command: `npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "older unread-count request|older unread-count rejection|identity switch prevents older user result|tech_admin switch invalidates older badge request|focus loss and regain invalidates older request"`
- Start/end: `2026-11-19T19:41:46.5575974+01:00` – `2026-11-19T19:41:55.7172997+01:00`
- Exit code: `0`; 1 suite passed; 5 passed, 42 skipped; 0 snapshots.
- React `act(...)` warnings: 0.
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16e-stale-regressions.log`
- Log SHA-256: `9c6bfe840c8cd6b1f2f2b07e058949474c6dbe92abc17833830ae31fc7712bd5`

### 5. Final isolated regression test

- Command: `npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "refocus publishes unread count after identity changes while blurred"`
- Start/end: `2026-11-19T19:43:25.3091276+01:00` – `2026-11-19T19:43:37.0133193+01:00`
- Exit code: `1`; 1 suite failed; 1 test failed, 46 skipped; 0 snapshots.
- Exact failure: `Expected: "5"`, `Received: "2"` at `notification-centre.test.tsx:1008`.
- React `act(...)` warnings: 0.
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16e-isolated-final.log`
- Final log SHA-256: `377a8306232afc9685865ad40e35909a77419c92cebf183418a7160cf43cc703`

### 6. Final focused Notification Centre suite

- Command: `npm.cmd test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- Start/end: `2026-11-19T19:43:44.8224900+01:00` – `2026-11-19T19:44:00.8203836+01:00`
- Exit code: `1`; 1 suite failed; 1 failed, 46 passed, 47 total; 0 snapshots; Jest time `12.586 s`.
- Exact failure: `Expected: "5"`, `Received: "2"` at `notification-centre.test.tsx:1008`.
- React `act(...)` warning lines: `32`, from the whole focused file. The isolated target had none.
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16e-focused-final.log`
- Log SHA-256: `c4f0b8973debf9077be59b282993a53b36a6d61461c134f05b114c3bbb9bb643`

The test was updated between exploratory runs to make initial focus/identity explicit and to report the retained count directly. The final isolated and focused executions use the final test version. No full Jest run was started because the focused suite reproduces the defect.

### TypeScript and diff checks

- Command: `npx.cmd tsc --noEmit --pretty false`
- Final run: `2026-11-19T19:44:14.9542256+01:00` – `2026-11-19T19:44:40.5522842+01:00`; exit code `2`.
- TypeScript diagnostics: `769`; diagnostics in the changed test and protected workspace screen: `0`.
- Complete log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16e-tsc-final.log`
- Log SHA-256: `8025da9ddbce219789e8f2a17c795900633d46652d25e1b10c4f94397a9586d6`
- `git diff --check`: exit code `0`, no whitespace errors. Git emitted an unrelated line-ending warning for the pre-existing `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx` working copy.

## Production and preservation audit

No production file was edited. Final hashes:

- `AesGuardianWorkspaceScreen.tsx`: `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0` (unchanged)
- `NotificationCentreScreen.tsx`: `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a` (unchanged)
- Raw `package-lock.json`: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667` (unchanged)
- Normalized lockfile Git blob: `e397c195e4e22231204add4fdfafb1ba50219736` (unchanged)
- Modified `notification-centre.test.tsx`: `96f9634334a38acd6699c464c705d4c732d73d32ead2d877197b917d6ff4cf2e`

The branch, HEAD, committed tree, and index tree remain the preflight values. There are no staged paths. Before this report was created, the complete working-tree status exactly matched the 108-entry initial status; the target test file was already marked modified at preflight. The only new repository path for this batch is this report:

`docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16E_BLURRED_IDENTITY_REFOCUS_REGRESSION.md`

No prior report, fixture, configuration, dependency, navigation, database, or repository implementation was changed. No emulator or device was launched.

## Recommended next action

Review a separate minimal production correction for the stale-focus capture and then rerun this preserved regression test and the five existing stale-request cases. This batch itself makes no such correction.
