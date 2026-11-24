# AES Guardian — Phase 2E.1 Batch 11.0.1
## Notification Badge Failure Diagnostic

## Final decision

**ROOT CAUSE IDENTIFIED — CORRECTION CAN BE SCOPED**

The failure is not in notification single-read or bulk-read database mutations:
both repository queries and mutation methods return the correct unread count in
source-level and test observations.

The defect is a stale workspace badge refresh race. `AesGuardianWorkspaceScreen`
does not guard unread-count refreshes against focus, role, or identity changes.
The test can observe the badge while an earlier or otherwise stale async unread-count
query/result is still controlling state.

## Reproduction

Exact isolated test command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern="workspace badge refreshes across single-read, bulk-read, and identity switches"`

Three isolated runs:

- Run 1: PASS
- Run 2: PASS
- Run 3: PASS

Exact full test file:

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`

- Exit: `0`
- 38 tests passed

Complete suite runs:

- Run 1: 56 suites passed, 1,206 tests passed
- Run 2: 56 suites passed, 1,206 tests passed

An earlier full-suite run returned one failure in this test:

- Suite: `notification-centre.test.tsx`
- Test:
  `workspace badge refreshes across single-read, bulk-read, and identity switches`
- Assertion: `workspace-unread-badge` is expected to be null after bulk read
- Actual: badge remains present

The exact failure was not reproduced in isolated runs or the two later full-suite runs.
The evidence indicates an intermittent timing/state-refresh failure rather than a
deterministic repository mutation defect.

## Source flow

`AesGuardianWorkspaceScreen`:

1. reads `activeRole` and `activeContext`;
2. calls `loadRoleStats()` on focus;
3. computes role-specific stats;
4. calls `getUnreadNotificationCount(activeContext.userId)`;
5. calls `setUnreadNotificationCount(count)` without request/context invalidation;
6. renders the bell badge from the state value.

The screen refresh callback has no stale-response guard:

- no request version;
- no active-role context comparison;
- no active-user comparison after asynchronous count resolution;
- no ref that invalidates older reads.

This is the stale-read race.

## Notification mutations

`AesGuardianDatabase.getUnreadNotificationCount()` directly executes:

`SELECT COUNT(*) FROM in_app_notifications WHERE recipient_user_id = ? AND is_read = 0`

`markNotificationRead()` and `markAllNotificationsRead()` correctly update
`is_read = 1` and scoped recipient/user conditions.

They return mutation results and do not leave a repository count inconsistency.

## Notification Centre screen

`NotificationCentreScreen.loadData()` loads notification list and unread count in a
`Promise.all` and sets both states together.

Single-read:

1. navigates first;
2. calls `markNotificationRead`;
3. calls `loadData`.

Bulk-read:

1. synchronously enters confirming state;
2. revalidates active identity;
3. calls `markAllNotificationsRead`;
4. calls `loadData`.

The Notification Centre state flow is coherent.

## Workspace refresh flow

The Workspace refresh depends on `useIsFocused()` and `loadRoleStats`.

The test switches `mockIsFocused` false/true and rerenders. The workspace effect
calls `loadRoleStats()` when focus becomes true.

The failure window is:

1. workspace load begins for exposed-professional count;
2. bulk read happens;
3. workspace gains focus;
4. one unread-count promise resolves after or from stale context;
5. `setUnreadNotificationCount` renders an old count.

The test has no direct event or invalidation signal from the database mutation.
It relies on focus rerender and an asynchronous repository query.

## Root cause classification

**Primary root cause: production stale-count race risk**

The workspace refresh path lacks a stale-response guard and should not update a
badge from a result belonging to an older focus or identity context.

**Secondary factor: test timing sensitivity**

The failing test changes focus and DB state synchronously across a rerender.
It waits for visible badge state but does not control or await the workspace's
async `loadRoleStats` promise separately.

**Not caused by notification repository mutation**

Database reads show the correct post-bulk unread count of zero.

**Not caused by Notification Centre read methods**

Single-read and bulk-read implementations are recipient-scoped and update persisted
state directly.

**Not caused by deterministic shared test state**

`beforeEach` resets database and role state.
Full suite isolation was sufficient in two complete runs.

## Corrective scope

If correction is authorized, make a narrow change only:

- add a workspace unread-count request/version ref;
- capture `activeRole` and `activeContext.userId` at load start;
- ignore unread-count results unless role/user and latest request still match;
- clear unread count immediately on role/user switch or tech-admin context;
- make workspace refresh await and publish unread count atomically;
- optionally expose a repository refresh event after bulk/single read.

Do not change notification storage, event types, recipient semantics or read APIs.

## Test scope

Before implementation, update the test to:

- explicitly await workspace unread-count refresh;
- separate DOM assertion from database mutation completion;
- assert count from the same active user/context;
- avoid relying only on rerender timing;
- optionally verify stale identity switch no longer overwrites badge.

No weakening of the failing assertion is required.

## Batch 11 impact

The observed defect is not RTL, scaling or contrast.

It affects workspace badge freshness and could appear in Batch 11 native validation
as intermittent role/focus updates.

The narrow stale-response guard is worth implementing before consolidated native
validation, but it is independent of layout/RTL work.

## Final decision

**ROOT CAUSE IDENTIFIED — CORRECTION CAN BE SCOPED**

The evidence indicates a workspace unread-count stale-refresh race, exposed under
focus/role/bulk-read timing. Repository mutations and Notification Centre read
logic are internally consistent.
