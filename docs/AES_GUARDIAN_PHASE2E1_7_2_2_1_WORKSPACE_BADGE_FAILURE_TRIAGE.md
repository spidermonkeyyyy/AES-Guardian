# AES Guardian — Phase 2E.1.7.2.2.1
## Notification Workspace Unread-Badge Failure — Read-Only Triage

### Summary

**UNRESOLVED.** The reported full-suite failure did not reproduce in this triage: the target test passed three isolated runs, the complete Notification Centre file passed twice, and the full Jest suite passed twice. A prior full-suite run had reported the badge test as its sole failure (49/50 suites; 1,105/1,106 tests).

Repository scoping is correct in source: unread counts and read mutations use the passed user ID, and the database query filters by recipient. A stale asynchronous workspace refresh is **PLAUSIBLE — NOT PROVEN**: overlapping refreshes can write an older count after a newer one because the screen does not validate request generation, active identity, or focus at the time it stores the result. The current runs did not capture such an overlap. No correction is justified by the present evidence; this remains a non-reproducible, unresolved intermittent failure.

### Repository identity and status

- Requested checkout: `C:\Users\User\Desktop\sure\sanad-rn-migration`
- Canonical Junction: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Verified repository root: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Branch: `migration/aes-guardian`
- HEAD: `d79b01ef51646509170996f8c77517f95470f217`

The initial `git status --short --untracked-files=all` contained 163 entries: 38 modified and 125 untracked. The final status contains 164 entries: the same 38 modified and 125 pre-existing untracked entries, plus this new report. No source, test, configuration, or other repository file was modified during triage. The already-dirty `AesGuardianWorkspaceScreen.tsx`, `AesGuardianDatabase.ts`, and untracked Notification Centre screen/test were preserved. No Git staging or history operation was performed.

### Reproduction matrix

Commands were run serially from the verified repository root using the existing `npm test` script and `--runInBand`. No cache-clearing or manual cache operation was performed.

| Scope | Exact command | Runs and result | Jest time / command wall time |
|---|---|---|---|
| Exact test, isolated | `npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx -t "workspace badge refreshes across single-read, bulk-read, and identity switches"` | 3 runs; each exit 0, 1 passed, 37 skipped | Test: 3.208s, 3.143s, 3.032s; command: 9.803s, 9.056s, 9.305s |
| Complete Notification Centre file | `npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx` | 2 runs; each exit 0, 1/1 suite and 38/38 tests passed | Jest: 9.043s, 9.258s; command: 12.032s, 11.975s |
| Full Jest suite | `npm test -- --runInBand` | 2 runs; each exit 0, 50/50 suites and 1,106/1,106 tests passed | Jest: 92.356s, 89.898s; command: 95.396s, 92.704s |
| Previously reported full-suite run | `npm test -- --runInBand` (Phase 2E.1.7.2.2 verification) | Exit 1; 49/50 suites, 1,105/1,106 tests; the workspace unread-badge case was reported as the sole failure | Historical failure summary reported the badge remained rendered; its original Jest trace and displayed badge count were not retained in the available evidence |

The current full-suite outputs passed `notification-centre.test.tsx`, as well as all other suites. React Native `act(...)` console warnings appeared during Notification Centre/full-file execution, but did not fail these runs.

### Test assertion and rendered state

**VERIFIED IN SOURCE:** In `notification-centre.test.tsx`, the target test contains two disappearance assertions:

- After marking all exposed-user notifications read, `queryByTestId('workspace-unread-badge')` is expected to be `null` (line 814 in the inspected checkout).
- After switching to `tech_admin`, the same test expects the badge to be `null` (line 845).

The reported historical symptom is that `workspace-unread-badge` remained rendered when absence was expected. The available historical summary does not identify which of these two assertions failed, provide the failure line, or preserve the badge's displayed text/count. It would be unsupported to attribute that historical failure specifically to the bulk-read or tech-admin stage. Both absence assertions passed in every current reproduction run.

### Identity, repository, and read-state trace

**VERIFIED IN SOURCE**

- `useDemoRoleStore.setRole` selects the corresponding synthetic context. The exposed and admin contexts use user IDs 1 and 2; tech admin uses ID 5. The test obtains `exposedId` and `adminId` from `listDemoUsers()` and seeds notifications for those exact IDs.
- The target test seeds two notifications for the exposed user and one for the admin. It starts the workspace as `exposed_professional`.
- Single-read stage: the test fetches the exposed user's unread notifications, asserts there are two, calls `db.markNotificationRead(notificationId, exposedId)` inside awaited `act`, then awaits `getUnreadNotificationCount(exposedId)` and asserts the database count is one.
- Bulk-read stage: the test calls `db.markAllNotificationsRead(exposedId)` inside awaited `act`, awaits the exposed user's count, and asserts it is zero before returning focus to the workspace.
- Identity stage: `setRole('admin_reviewer')` and later `setRole('tech_admin')` are wrapped in awaited `act`; rerendering while the workspace is focused triggers its refresh effect.
- `getUnreadNotificationCount(userId)` checks the demo user and executes `COUNT(*) ... WHERE recipient_user_id = ? AND is_read = 0`. `markNotificationRead` additionally guards notification ID, recipient ID, and unread state. `markAllNotificationsRead` filters by recipient ID and unread state. This is user-scoped at the repository boundary.

The test calls database read methods directly; it does not render `NotificationCentreScreen` or exercise its single-read/bulk-read UI handlers. It verifies database effects and the workspace's focus/identity refresh behavior, not end-to-end notification-screen actions.

### Refresh and React-state observations

**VERIFIED IN SOURCE**

- `AesGuardianWorkspaceScreen` calls `loadRoleStats` when focused. Its callback depends on `activeRole` and `activeContext.userId`, so focus changes and identity changes trigger a refresh.
- For non-tech-admin users, it awaits role-specific statistics before calling `getUnreadNotificationCount(activeContext.userId)`, then stores the result with `setUnreadNotificationCount(count)`. The badge is rendered only when the stored value is greater than zero. Tech admin sets the count to zero.
- The callback does not re-check the active user, focus, or request generation after awaiting repository calls. An earlier refresh can therefore still write a count after a later focus/identity refresh. The catch path also leaves the previous count in state.
- The test awaits the database mutation and direct count query. After bulk-read, its `waitFor` checks for the badge's disappearance, which observes a React render. However, after single-read it checks only that a badge exists, not that its displayed count changed to one; after switching to admin it also checks only presence, not that the count is exactly one. Those assertions can pass on stale positive badge state.

### Harness and alternative explanations

**VERIFIED IN SOURCE**

- The test uses the real application database API over the existing `@op-engineering/op-sqlite` Jest mock. It directly mocks React Navigation hooks; it does not mock the unread-count repository method.
- Its `beforeEach` resets focus, clears Jest mocks and SQLite mock stores, resets and initializes the database without demo-scenario notifications, resolves role IDs, seeds entities/notifications, and selects the exposed role. `afterEach` resets the database.
- The test explicitly wraps the direct DB mutations and role changes in `act`; it uses `waitFor` for badge state. It does not configure fake timers or arbitrary sleeps. `jest.config.js` has no project `setupFilesAfterEnv`, `clearMocks`, or fake-timer configuration.
- The test changes the mocked focus value and rerenders the workspace; it does not perform real navigation between screens. Thus, it isolates the workspace focus effect but not native navigation timing.

The repeated isolated/file/full-suite passes make cleanup, a deterministic repository authorization/data error, and a consistent missing refresh less likely. They do not rule out an intermittent timing race, especially in the presence of asynchronous refreshes and React Native scheduling. No deterministic trace captured an out-of-order repository response or stale-state commit, so actual application behavior remains unverified as the cause.

### Root-cause classification

- **VERIFIED:** The count query and read mutations are scoped to the passed user ID; current role contexts and test-seeded IDs align for exposed, admin, and tech-admin stages.
- **VERIFIED BY TEST:** The target passes 3/3 isolated runs, 2/2 full Notification Centre-file runs, and the full suite passes 2/2 in this triage.
- **PLAUSIBLE — NOT PROVEN:** Overlapping workspace refreshes may let an older user/focus result overwrite a newer count. The unguarded async state write and incomplete positive-count assertions support this as a candidate, but no run reproduced it or recorded the required out-of-order completion.
- **UNRESOLVED:** Why the single historical full-suite run failed; which of the two null assertions failed; the badge text/count at that point; and whether a stale completion, ordinary scheduling variation, or another transient caused it.

### Relationship to the quarantined empty-state failure

**UNRESOLVED; no shared cause established.** The empty-state case exercises `NotificationCentreScreen`'s notification-list/unread-count load and empty rendering. This badge test exercises `AesGuardianWorkspaceScreen`'s separate unread-count refresh and conditional header badge; it simulates reads directly in the database. The components share the database and test harness, but the distinct state paths and absence of a reproduced common trace provide no evidence that the failures share a root cause. Their common asynchronous test environment alone is not proof of linkage.

### Correction decision

No narrow correction is justified by this triage: the failure did not reproduce across seven current executions at three scopes, and no causal stale-result trace was observed. If the failure recurs, capture each workspace refresh's requested user ID, completion order, count, focus/role at completion, and corresponding React commit, and strengthen the test to assert exact counts after single-read and identity switch. Do not treat the plausible stale-result race as verified until such evidence exists.

No application/test changes were made. Stop condition satisfied; no next CAPA phase was started.
