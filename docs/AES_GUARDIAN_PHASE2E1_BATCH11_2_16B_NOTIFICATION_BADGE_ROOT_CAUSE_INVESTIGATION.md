# AES Guardian — Phase 2E.1 Batch 11.2.16B

## Recommendation

**INTERMITTENCY REPRODUCED — ROOT CAUSE UNDETERMINED**

Batch 11.2.16A captured one focused-suite failure at the target assertion. In this investigation, the exact test passed when run alone and passed in five consecutive focused-file runs. The available evidence confirms an intermittent failure occurred, but does not identify why the workspace state remained positive in that one prior run.

## Scope and read-only guarantee

This investigation was limited to source/test inspection and the specified Jest executions. No source, test, fixture, database, configuration, dependency, lockfile, or existing report was modified. Temporary logs and the initial status snapshot are outside the repository. This report is the only expected repository addition.

No staging, commit, branch change, remote access, dependency installation, emulator/device launch, or destructive Git operation occurred.

## Repository and preservation

Verified before and after the investigation:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Staged paths: none

The complete initial `git status --short` (105 lines) was captured outside the repository at:

`C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16b-initial-status.txt`

SHA-256: `2a7750176156df3c5c7599ac933cdba19714601d10d8fcd9772b20b4e8422044`

It includes the previously existing modified/untracked work, including the 11.2.16A report. The status was unchanged after investigation and before this report was created.

## Exact failing test and lifecycle

Test:

`Phase 2D.2G — Notification Centre UI & Interaction Integration › Phase 2D.2G.1 — Integration Closure (Corrections A, B, C, D) › Correction B: Workspace Badge Freshness & Lifecycle › workspace badge refreshes across single-read, bulk-read, and identity switches`

Assertion at `src/features/aes-guardian/__tests__/notification-centre.test.tsx:1165-1167`:

```ts
await waitFor(() => {
  expect(queryByTestId('workspace-unread-badge')).toBeNull();
});
```

In the recorded Batch 11.2.16A A1 failure, the query returned a rendered `View`; the test's wait timed out after about 1.46 seconds. The failure output did not record the workspace component's internal count or the request/response sequence.

The test block's observed sequence is:

1. Seed two notifications for the exposed user and one for the admin user, using the initialized test database.
2. Mount `AesGuardianWorkspaceScreen` focused and wait for the badge to appear.
3. Set the mocked focus state to false and rerender.
4. Read the exposed user's two unread notifications, await `markNotificationRead` inside `act`, then query the database directly and confirm count `1`.
5. Set focus true and rerender. The subsequent `waitFor` only asserts that the badge exists. Since the previous count-2 badge is still mounted, this can pass before the single-read refresh has published count `1`.
6. Set focus false and rerender.
7. Await `markAllNotificationsRead` inside `act`, then query the database directly and confirm count `0`.
8. Set focus true and rerender, then poll for badge removal with the failing `waitFor`.
9. Only after that assertion, switch to `admin_reviewer` and then `tech_admin`, checking badge presence/removal.

The database mutations and direct count reads are awaited. The test does not explicitly observe the workspace unread-count request starting, resolving, or publishing React state. Its final `waitFor` does poll for badge unmount, but the preceding positive badge assertion is not evidence that the earlier refresh completed. This is a test-sequencing weakness, not sufficient evidence that it caused the recorded failure.

The failing assertion occurs before either identity switch. The role is still `exposed_professional`; identity/role transition does not directly explain this failure location.

## Production refresh, mutation, and rendering behavior

`AesGuardianWorkspaceScreen` owns `unreadNotificationCount`, initialized to zero, and `unreadRefreshVersion`.

- `loadRoleStats` runs on mount/focus through an effect, when its role/user callback dependencies change, and on pull-to-refresh.
- The effect increments the request version on focus changes; `loadRoleStats` also increments it and captures role, user ID, and focus state.
- The callback awaits role-specific statistics before querying `getUnreadNotificationCount`.
- It publishes the count only when the captured request version is still current, the captured request was focused, and the store's current role and user ID still match.
- A rejected count request preserves the last published value. For `tech_admin`, the current focused request sets the count to zero.
- For non-`tech_admin` roles, the badge is rendered only when `unreadNotificationCount > 0`. Therefore, if the workspace state is actually set to zero while the role remains exposed, the badge is unmounted; there is no second rendering condition that retains it.

The callback reads `isFocused`, but the `useCallback` dependency list is `[activeRole, activeContext.userId]` and omits `isFocused`. A callback recreated while blurred can therefore retain `isFocused === false` when called after a subsequent focus gain. This is a plausible adjacent focus/identity lifecycle risk, but it does **not** match the failing test's path: the component is mounted focused and the role/user remain unchanged through the failing assertion. It is not established as the cause of the 11.2.16A failure. Any correction or targeted regression test for that separate ordering should be proposed and authorized independently.

`NotificationCentreScreen` refreshes its own list/count when focused or when identity changes. A successful single-item navigation awaits `markNotificationRead` and then `loadData`; the confirmed bulk-read callback awaits `markAllNotificationsRead` and then `loadData`. Those are Notification Centre-local state refreshes. The workspace count is separately refreshed when workspace focus returns.

The failing test does not render or invoke either Notification Centre mutation handler. It directly awaits the database mutation and then directly verifies the count. The database methods scope updates to the requested recipient; unread count is queried as `COUNT(*)` for that recipient with `is_read = 0`. The test's `@op-engineering/op-sqlite` manual mock applies query/execute operations to its in-memory store synchronously; promise wrappers still require awaiting, which the test does. No evidence in this test shows a database mutation/read-visibility ordering defect.

## Test isolation and asynchronous ordering

The test file initializes the database in `beforeEach` with demo-scenario notifications disabled, clears the SQLite mock stores, resets the database service, resets the shared `mockIsFocused` to true, clears Jest mock call state, sets locale to French, seeds the entities, and sets the role to `exposed_professional`. Its `afterEach` resets the database service. The test uses no `jest.spyOn`, deferred promise, fake timer, or mock repository implementation of its own.

The unread-count guard tests earlier in this file use deferred promises to test out-of-order resolutions, rejection, identity changes, and focus loss/regain. Their spies are explicitly restored. No fake-timer setup appears before the target test. The test preset provides the React Native test environment; the failing test's own focus transitions are simulated through the module-level `mockIsFocused` value and component rerenders, not through a real navigator focus lifecycle.

This weighs against fixture, request-mock ordering, and cross-test leakage as explanations, but does not conclusively rule out an intermittent React effect/request ordering issue. Jest logs show asynchronous React `act(...)` warnings in whole-file runs; those warnings were not correlated with the failure and are not proof of causation.

## Possible failure classes

| Class | Evidence and assessment |
|---|---|
| **A. Test synchronization gap** | The count-1 assertion reads the database directly, and the subsequent badge-exists assertion may pass on the old badge. The final `waitFor` does wait for removal, so it is not simply asserting too early; it fails only if the state never becomes zero within the wait. No instrumented request trace exists to distinguish a late refresh from a refresh that did not publish. **Possible contributor; not identified as root cause.** |
| **B. Stale request publication** | The version/focus/identity guard is present and the five existing deferred-request regression tests pass. No request trace was captured during the historical failure, so an uncovered interleaving cannot be ruled out. **Not demonstrated.** |
| **C. Mutation/refresh ordering** | Mutation and count queries are awaited; the in-memory DB mutation is applied before the direct zero-count query. Workspace refresh begins on focus regain after that mutation. The actual Notification Centre UI mutation handlers are not exercised by this test. **No evidence of stale DB reads; end-to-end UI mutation ordering is outside this failing test.** |
| **D. Identity or role transition** | The failing assertion precedes both role switches and runs under the exposed-user identity. **Not supported for this failure.** |
| **E. Component lifecycle/focus** | Focus is mocked and toggled with rerenders. The test does not exercise navigation's real focus/blur lifecycle. The omitted `isFocused` callback dependency is an adjacent risk, but does not match the target's role-stable focused path. **Possible general lifecycle risk; not established as this cause.** |
| **F. Mock or fixture interference** | The test uses a newly initialized in-memory DB, seeds distinct exposed/admin notifications, and has no per-test repository mocks or deferred promises. Setup clears store state and resets the DB. **Evidence weighs against interference; no failure-time state trace to fully exclude it.** |
| **G. Rendering condition** | Rendering is conditional on role eligibility and `unreadNotificationCount > 0`. The direct database count reaching zero does not establish that React state reached zero. **No independent rendering defect found; stale component state remains possible but unexplained.** |

## Controlled reproduction

Each command ran from the repository root in its own sequential Jest process. Captured logs are complete and unfiltered, stored outside the repository, and include stdout, stderr, assertion output, stacks, and Jest summaries.

### 1. Exact target test, independently

- Command: `npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "workspace badge refreshes across single-read, bulk-read, and identity switches"`
- Start: `2026-11-19T19:06:57.0826684+01:00`
- End: `2026-11-19T19:07:10.6373624+01:00`
- Exit code: `0`
- Result: 1 suite passed; 1 passed, 45 skipped, 46 total; 0 snapshots.
- Target test failed: **no**
- Log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16b-independent.log`
- Log SHA-256: `b9735c49ce135433a4b0c7c8b9cc2c30803c0af2c35661a6d563f605b7b2d9de`

### 2. Focused file — five consecutive runs

Each run used `npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`.

| Run | Start (`+01:00`) | End (`+01:00`) | Exit | Jest result | Target failed | Complete log SHA-256 |
|---|---|---|---:|---|---|---|
| Focused 1 | `2026-11-19T19:07:18.4136711` | `2026-11-19T19:07:35.7812192` | 0 | 1 suite passed; 46 passed, 0 failed | No | `0f436a79e0624c85268c74020314cd0599bbc83291aa55deba75c5be2184477a` |
| Focused 2 | `2026-11-19T19:07:35.8446330` | `2026-11-19T19:07:52.7983631` | 0 | 1 suite passed; 46 passed, 0 failed | No | `9b8c1819de5a96c521cb4f4e84cf85525ca6030b0d05cccf24a2edf812354f01` |
| Focused 3 | `2026-11-19T19:07:52.8133945` | `2026-11-19T19:08:09.8532813` | 0 | 1 suite passed; 46 passed, 0 failed | No | `484a3a3d8263b60a7f0ed03876b2928b2d9ba66d18c0743ddbd6bb281b733fde` |
| Focused 4 | `2026-11-19T19:08:09.8715786` | `2026-11-19T19:08:26.7904292` | 0 | 1 suite passed; 46 passed, 0 failed | No | `adda51cf5663e268bd89ddd925a13a896fad8f551415eced1f8ecf5d0d6106cc` |
| Focused 5 | `2026-11-19T19:08:26.8035581` | `2026-11-19T19:08:43.6969229` | 0 | 1 suite passed; 46 passed, 0 failed | No | `039995016110c4a6c874a9198c6dd891cc1a588f2a3426aa93d02021265c492e` |

Full logs, in the same order:

- `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16b-focused-1.log`
- `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16b-focused-2.log`
- `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16b-focused-3.log`
- `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16b-focused-4.log`
- `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16b-focused-5.log`

There was no failure assertion or stack in these six current runs. The independently filtered run emitted no `act(...)` warning lines. The five whole-file runs emitted respectively 33, 26, 35, 25, and 33 React `act(...)` warning lines. The warnings describe updates not wrapped in `act`; they did not cause nonzero exits. No separate warning category was observed in those logs.

### Prior Batch 11.2.16A evidence

The earlier A1 run in the separate 11.2.16A audit exited `1`: 1 suite failed, 45 passed and 1 failed. It failed this same test at `notification-centre.test.tsx:1165:22`; the received value was the still-rendered `View`. Its complete log remains at `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16a-A1.log` (SHA-256 `41b9e9a9c96ad048f55e116ca7ac9e54dced9fe39667eca9dda2cc619deb1443`). The A2 and A3 focused runs and both full-suite runs in 11.2.16A passed. The full A1 output shows all preceding tests, including the five stale-request regressions, passed before the target test failed.

Accordingly, the prior occurrence is real; the exact test passes alone and in five subsequent whole-file runs. A small successful sample does not establish that the failure is resolved or rule out future recurrence. The available runs do not establish whether the historical failure was order-dependent.

## Accepted guard regression coverage

All five existing tests remain present and unchanged in meaning in `src/features/aes-guardian/__tests__/notification-centre.test.tsx`:

- `older unread-count request cannot overwrite a newer resolved count`
- `older unread-count rejection cannot disturb a newer resolved badge`
- `identity switch prevents older user result from publishing`
- `tech_admin switch invalidates older badge request`
- `focus loss and regain invalidates older request`

All five passed in each focused-file run. `AesGuardianWorkspaceScreen.tsx` was not edited during this investigation.

## Preservation hashes and final worktree

Initial and final SHA-256 values for the four requested files:

| File | SHA-256 |
|---|---|
| `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx` | `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0` |
| `src/features/aes-guardian/screens/NotificationCentreScreen.tsx` | `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a` |
| `src/features/aes-guardian/__tests__/notification-centre.test.tsx` | `e719c69f5f910ceebdfa304ae32ef4fb7a659c6419952ac19c53261186efe006` |
| `package-lock.json` raw bytes | `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667` |

The path-normalized Git blob for `package-lock.json` is `e397c195e4e22231204add4fdfafb1ba50219736`. Raw file and normalized blob were verified separately.

The worktree status after all tests exactly matched the 105-line initial status; there were no staged paths. After creation of this report, the only expected status delta is this new untracked report:

`docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16B_NOTIFICATION_BADGE_ROOT_CAUSE_INVESTIGATION.md`

Branch, HEAD, committed tree, index tree, all four file hashes, and the lockfile provenance remain unchanged.

## Root-cause conclusion and recommended next action

**The cause remains undetermined.** Evidence establishes that the test can fail in a focused Jest run, and that it did not fail in one isolated execution or five consecutive focused-file executions during this investigation. The test's database mutations complete and its direct database count reaches zero; the missing evidence is whether the workspace refresh request in the failing execution returned zero and whether that value passed the guard and was committed to React state.

After separate authorization, the next diagnostic should add temporary, non-committed observation of each workspace refresh's captured focus/role/user/version, count-query start/result, guard decision, and state publication, then repeat the exact test and focused file. Separately, the omitted `isFocused` hook dependency should receive a targeted review/test for role changes while blurred; it should not be treated as the proven cause of this failure. No correction is made or authorized by this report.
