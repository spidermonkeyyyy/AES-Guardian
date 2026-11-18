# AES GUARDIAN — PHASE 2D.2G.2 REPORT
## Bulk-Read Confirmation Active Identity Revalidation

**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**Git HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Schema Version:** Version 8 (Unchanged)  
**Previous Phase:** 2D.2G.1 — Conditionally accepted  
**Execution Timestamp:** 2026-11-15T07:53:00+01:00  

---

## 1. Executive Summary & Objective

Phase 2D.2G.2 closes the identity race condition identified in `NotificationCentreScreen.tsx` during review of Phase 2D.2G.1.

In the prior implementation, `handleMarkAllRead` acquired `currentContext.userId` before displaying the native `Alert.alert` confirmation dialog and relied on that closure variable when the user later confirmed the operation. In an environment where synthetic identities can transition (e.g. via role switching, session events, or background updates), a delayed confirmation could execute under a stale or unauthorized identity, potentially mutating notifications belonging to an identity that is no longer active or executing operational mutations while in a restricted administrative role (`tech_admin`).

The correction enforces strict, authoritative revalidation of the active identity at confirmation callback execution time.

---

## 2. Exact Race Condition & Correction Architecture

### The Race Condition
Prior to Phase 2D.2G.2, `handleMarkAllRead` captured the active user identity at the time the confirmation dialog was opened:
```tsx
// Vulnerable Pre-Phase 2D.2G.2 Sequence:
const handleMarkAllRead = useCallback(async () => {
  const { activeContext: currentContext } = useDemoRoleStore.getState(); // Captured at dialog open
  if (!currentContext.userId || unreadCount === 0 || processing) return;

  Alert.alert(title, msg, [
    { text: cancel, style: 'cancel' },
    {
      text: confirm,
      style: 'destructive',
      onPress: async () => {
        // RACE: currentContext.userId from outer closure used directly!
        await db.markAllNotificationsRead(currentContext.userId!);
        await loadData();
      }
    }
  ]);
});
```

If the active identity transitioned while the native dialog was presented on screen:
- **Scenario A (User A -> User B):** Tapping "Confirm" executed `markAllNotificationsRead` for User A using User A's ID, even though User B was now the active user.
- **Scenario B (User A -> tech_admin):** Tapping "Confirm" mutated User A's operational data from within an active `tech_admin` context where operational data mutation is strictly prohibited.
- **Scenario C (Multiple Taps):** Tapping the mark-all button rapidly could trigger multiple alerts or overlapping operations because `processing` was not locked at initiation.

### Corrective Architecture (Phase 2D.2G.2)
1. **Immediate Processing Lock & Concurrency Guard:**  
   `setProcessing(true)` is locked immediately when `handleMarkAllRead` begins, before opening `Alert.alert`. If `processing || unreadCount === 0`, invocation returns immediately.
2. **Cancellation Release:**  
   Both the `cancel` action (`onPress: () => { setProcessing(false); }`) and the dialog dismiss handler (`onDismiss: () => { setProcessing(false); }`) explicitly release the lock and perform zero mutations.
3. **Initiating Identity Capture:**  
   The initiating identity (`initiatingUserId` and `initiatingRole`) is captured solely as a baseline for comparison.
4. **Authoritative Revalidation at Confirmation Time:**  
   Inside `confirm.onPress`, the confirmation callback queries `useDemoRoleStore.getState()` for `confirmedContext` and `confirmedRole`.
5. **Fail-Closed Comparison & Role Verification:**  
   The callback validates:
   - `confirmedContext.userId` exists and is non-empty.
   - `confirmedContext.isAuthenticated === true`.
   - `confirmedRole !== 'tech_admin'`.
   - `confirmedContext.userId === initiatingUserId`.
   - `confirmedRole === initiatingRole`.
   If any condition fails, the operation immediately aborts without database mutation and calls `await loadData()` to refresh the feed for the current active identity.
6. **Scoped Database Mutation:**  
   Only when all checks pass is `db.markAllNotificationsRead(confirmedContext.userId)` invoked with the verified active identity.

```tsx
// Phase 2D.2G.2 Implemented Logic:
const handleMarkAllRead = useCallback(async () => {
  if (processing || unreadCount === 0) return;
  const { activeContext: initiatingContext, activeRole: initiatingRole } = useDemoRoleStore.getState();
  if (!initiatingContext.userId || !initiatingContext.isAuthenticated || initiatingRole === 'tech_admin') {
    return;
  }
  const initiatingUserId = initiatingContext.userId;

  // Lock processing state immediately to prevent duplicate dialogs or race conditions
  setProcessing(true);

  Alert.alert(
    t('notificationCentre.markAllRead', locale),
    t('notificationCentre.markAllReadConfirm', locale),
    [
      {
        text: t('notificationCentre.cancel', locale),
        style: 'cancel',
        onPress: () => {
          setProcessing(false);
        },
      },
      {
        text: t('notificationCentre.confirm', locale),
        style: 'destructive',
        onPress: async () => {
          try {
            // Re-acquire active identity at confirmation callback execution time
            const { activeContext: confirmedContext, activeRole: confirmedRole } = useDemoRoleStore.getState();

            // Revalidation: Active identity must be authenticated, eligible, non-tech_admin,
            // and strictly match the identity that initiated the confirmation dialog.
            if (
              !confirmedContext.userId ||
              !confirmedContext.isAuthenticated ||
              confirmedRole === 'tech_admin' ||
              confirmedContext.userId !== initiatingUserId ||
              confirmedRole !== initiatingRole
            ) {
              // Identity switched or became ineligible while confirmation was pending.
              // Fail closed: do NOT perform bulk mutation for either initiating or confirmed user.
              // Refresh state so screen and badge immediately reflect the currently active identity.
              await loadData();
              return;
            }

            const db = getDatabase();
            await db.markAllNotificationsRead(confirmedContext.userId);
            await loadData();
          } catch {
            // silent — loadData will show any persistent error
          } finally {
            setProcessing(false);
          }
        },
      },
    ],
    {
      cancelable: true,
      onDismiss: () => {
        setProcessing(false);
      },
    },
  );
}, [unreadCount, processing, loadData, locale]);
```

---

## 3. Identity Transition Policy

When the synthetic identity changes while a confirmation dialog is pending, the system adheres to the following explicit policies:

| Transition Scenario | Confirmation Outcome | Notification Read State Mutation | UI Result |
| :--- | :--- | :--- | :--- |
| **User A -> User B** | Rejected (Fail-closed) | **Zero mutations.** Neither User A nor User B notifications are marked read. | Feed refreshes to display User B's notifications and unread badge. |
| **User A -> tech_admin** | Rejected (Fail-closed) | **Zero mutations.** User A notifications remain unread. | Screen transitions to `techAdminRestricted` notice with zero operational data. |
| **User A -> User B -> User A** | Authorized | **Executed for User A.** | Matching active `userId` and `role` re-establishes identity continuity. User A notifications marked read. |
| **User cancels dialog** | Cancelled | **Zero mutations.** | Processing unlocked, count unchanged. |
| **Rapid repeated taps** | Blocked | Only single dialog displayed; processing locked. | Concurrency preserved. |

---

## 4. Focused Automated Test Suite Results

The dedicated test block `Phase 2D.2G.2 — Bulk-Read Active Identity Revalidation` was added to `src/features/aes-guardian/__tests__/notification-centre.test.tsx` using deterministic, controllable callbacks:

```
Phase 2D.2G.2 — Bulk-Read Active Identity Revalidation
  √ 1. Normal confirmation with unchanged identity performs scoped bulk-read operation (80 ms)
  √ 2. Cancel performs no mutation on notification read state (76 ms)
  √ 3. Identity changes from User A to User B while dialog is open: neither user is mutated and screen refreshes for User B (89 ms)
  √ 4. Identity changes to tech_admin while dialog is open: no mutation and operational content hidden (73 ms)
  √ 5. Identity changes away and back to original user before confirmation: permits pending action (84 ms)
  √ 6. Repeated taps and processing-state handling prevent duplicate bulk mutations (77 ms)
```

### Detailed Scenario Breakdown

1. **Test 1 (Normal Confirmation):**
   - Active user `exposed_professional` has 1 unread notification.
   - User triggers mark-all-read dialog and confirms.
   - Active identity matches; `db.markAllNotificationsRead(exposedId)` executes.
   - Unread count transitions to 0.

2. **Test 2 (Cancellation):**
   - Active user has 1 unread notification.
   - User triggers dialog and presses cancel.
   - `setProcessing(false)` executes; zero database queries or mutations occur; unread count remains 1.

3. **Test 3 (User A -> User B Transition):**
   - User A (`exposedId`) has 2 unread notifications; User B (`adminId`) has 1 unread notification.
   - User A opens dialog; confirmation callback is held open.
   - Identity changes to User B via `useDemoRoleStore.getState().setRole('admin_reviewer')`.
   - Delayed confirmation callback executes.
   - Verification: User A unread count = 2 (unmutated); User B unread count = 1 (unmutated); feed refreshes under User B.

4. **Test 4 (User A -> tech_admin Transition):**
   - User A opens dialog.
   - Identity switches to `tech_admin`.
   - Confirmation callback executes.
   - Verification: User A unread count remains 1; `tech_admin` restricted screen displays; zero operational notifications shown.

5. **Test 5 (Identity Bounce User A -> User B -> User A):**
   - User A opens dialog.
   - Identity switches to User B, then returns to User A before confirmation.
   - Confirmation callback executes.
   - Verification: Active `userId` and `role` match the initiating identity; operation is authorized; User A notifications marked read (count = 0).

6. **Test 6 (Duplicate / Rapid Tap Prevention):**
   - User taps mark-all-read button.
   - While confirmation is active, user attempts to tap again.
   - `processing` guard prevents duplicate `Alert.alert` invocations (`alertSpy` called exactly once).
   - Operation completes cleanly without duplicate database transactions.

---

## 5. Comprehensive Regression Results

### Notification Centre Test Suite
- `src/features/aes-guardian/__tests__/notification-centre.test.tsx`:
  - **28 passed out of 28 total tests** (including all 22 Phase 2D.2G/2D.2G.1 tests and all 6 Phase 2D.2G.2 tests).

### Database Notification & Navigation Suites
- `migration8.test.ts`: PASSED (13/13 tests, schema v8 verified)
- `notifications.test.ts`: PASSED
- `notification-workflow.test.ts`: PASSED
- `notification-workflow-hardening.test.ts`: PASSED
- `demo-notification-seeding.test.ts`: PASSED
- `notification-navigation.test.ts`: PASSED
- **Total: 208/208 tests passed across 6 suites.**

### AES Guardian Feature Suites
- `src/features/aes-guardian/__tests__/`:
  - **14 passed out of 14 test suites.**
  - **300 passed out of 300 tests total.**

### Complete Project Regression Suite
- **41 test suites passed out of 41 total.**
- **732 tests passed out of 732 total.**
- **Zero test failures, zero regressions across the codebase.**

---

## 6. TypeScript Validation

Execution of `npx tsc --noEmit` filtered for `src/features/aes-guardian|src/core/database|src/localization|src/navigation`:
- **0 errors reported.**
- All types, callbacks, and store references strictly compile.

---

## 7. Schema & Database Invariance

- **SQLite Schema Version:** Version 8 (Confirmed via `PRAGMA user_version = 8`).
- **Table Constraints:** Unchanged (`in_app_notifications` table structure, indexes, and constraints preserved).
- **Foreign Keys:** `PRAGMA foreign_key_check` passes with zero violations.
- **Migrations:** No new migration files created; Migration 8 remains authoritative.

---

## 8. Exact Files Modified in Phase 2D.2G.2

| File | Nature of Changes |
| :--- | :--- |
| `src/features/aes-guardian/screens/NotificationCentreScreen.tsx` | Added immediate processing locking, cancel/dismiss lock release, and authoritative active identity and role revalidation inside `handleMarkAllRead` confirmation callback. |
| `src/features/aes-guardian/__tests__/notification-centre.test.tsx` | Added dedicated describe block `Phase 2D.2G.2 — Bulk-Read Active Identity Revalidation` with 6 deterministic tests covering unchanged confirmation, cancellation, identity switches, tech_admin transitions, identity bounce, and concurrency. Total tests increased from 22 to 28. |

---

## 9. Git Repository Integrity

- **Branch:** `migration/aes-guardian`
- **HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217` (Strictly maintained; no git commits, stashes, resets, or discards).
- **Working Tree:** Modifications staged cleanly within authorized phase boundaries.

---

## 10. Conclusion & Stop Condition

Phase 2D.2G.2 successfully resolves the active identity race condition on bulk-read operations. The Notification Centre now guarantees complete fail-closed identity isolation under any asynchronous or delayed confirmation timing.

All constraints and stop conditions are satisfied:
- **Phase 2D.2G.2 is complete.**
- **Phase 2D.2H has NOT been started.**
- Awaiting user review and authorization.
