# AES GUARDIAN — PHASE 2D.2F.1
## Notification Ownership Verification & Type-Safe Navigation Closure Report

**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217`  
**Schema Version:** Version 8  
**Previous Phase:** 2D.2F — CONDITIONALLY ACCEPTED  
**Current Phase:** 2D.2F.1 — COMPLETE

---

## 1. Executive Summary

Phase 2D.2F.1 closes the two targeted findings identified during review of Phase 2D.2F:
1. **Correction A — Notification Ownership Verification:** The resolver no longer trusts caller-supplied notification objects or in-memory `recipient_user_id` values. It explicitly looks up the notification in the database constrained by both the notification ID and the active identity ID (`WHERE id = ? AND recipient_user_id = ?`). Stale notifications presented after identity switching or with forged recipient IDs fail closed without revealing destination routes or records, and without causing read-state mutations.
2. **Correction B — Correlated Route and Parameter Types:** The independently typed `route: keyof RootStackParamList` and `params: RootStackParamList[keyof RootStackParamList]` properties have been replaced with a strictly correlated discriminated union (`NotificationNavigationSuccess`). Each destination route is statically bound to its exact parameter type from `RootStackParamList`, with compile-time rejection of mismatched parameter structures.

All 11 canonical event mappings, role matrix boundaries, occupational health data minimization, read-state invariance, and database schema Version 8 have been strictly preserved.

---

## 2. Correction A — Notification Ownership Verification

### Design & Implementation
In `resolveNotificationNavigation` (`src/features/aes-guardian/navigation/notification-navigation-resolver.ts`):
1. **Active Identity Acquisition:** The active synthetic identity (`userId`, `role`) is extracted directly from the provided `AuthContext` (from `useDemoRoleStore` / established identity boundary).
2. **Pre-flight Identifier Check:** Validates that `notification.id` is a valid positive number. Missing or non-positive IDs immediately return `{ status: 'invalid_event' }`.
3. **Database Recipient Scoping:** Executes `db.getNotificationById(notification.id, userId)` which runs:
   ```sql
   SELECT * FROM in_app_notifications WHERE id = ? AND recipient_user_id = ? LIMIT 1
   ```
4. **Fail-Closed Differentiated Failure:**
   - If no record matches the combined `(id, userId)` check, an existence query is evaluated:
     - If the notification exists in the database but under another recipient: returns `{ status: 'unauthorized', reason: 'Notification ... belongs to another user ...' }`.
     - If the notification does not exist in the database at all: returns `{ status: 'not_found', reason: 'Notification ... was not found.' }`.
   - In both cases, the resolver halts immediately: no destination route or parameter is returned (`route` and `params` are undefined), and no read-state mutation occurs.
5. **Source of Truth:** Once verified, all subsequent event validation and destination resolution uses the database-persisted row (`verifiedRecord`) rather than untrusted caller payload fields.

### Repository Method
A new dedicated query method was introduced to `AesGuardianDatabase`:
```typescript
/**
 * Retrieves a single in-app notification by ID, strictly scoped to the requesting user.
 *
 * RECIPIENT DOUBLE-GUARD:
 * Enforces WHERE id = ? AND recipient_user_id = ?.
 * If the notification does not exist or belongs to another user, returns null.
 *
 * STRICT BOUNDARY:
 * tech_admin returns null.
 */
async getNotificationById(
  notificationId: number,
  userId: number,
): Promise<InAppNotification | null> {
  const user = await this.getDemoUser(userId);
  if (!user || user.role === 'tech_admin') {
    return null;
  }

  const result = await this.db.query<InAppNotification>(
    `SELECT * FROM in_app_notifications WHERE id = ? AND recipient_user_id = ? LIMIT 1`,
    [notificationId, userId],
  );
  return result.rows[0] ?? null;
}
```

### Identity-Switch Verification Sequence
An automated test verifies the exact multi-user identity-switch lifecycle:
- User A (`exposed1`) retrieves notification record #2 (`review_completed`).
- The application identity switches to User B (`exposed2`).
- User B submits the previously retrieved notification object for navigation resolution.
- `resolveNotificationNavigation` queries the database with `(id = 2, userId = exposed2.id)`.
- The database returns `null` because notification #2 is addressed to `exposed1`.
- The resolver returns `{ status: 'unauthorized' }`.
- No destination information is revealed (`route` is undefined).
- User A's notification remains completely unread (`is_read = 0`) in the database.

---

## 3. Correction B — Correlated Route and Parameter Types

### Type Architecture
The `NotificationNavigationSuccess` type was refactored into a correlated discriminated union:
```typescript
export type NotificationDestinationRoute =
  | 'adminReviewAction'
  | 'declarationDetails'
  | 'correctionResponse'
  | 'ohCoordinationDetail'
  | 'declarationCoordinationStatus'
  | 'preventionActionDetail';

export type NotificationNavigationSuccess =
  | {
      status: 'success';
      route: 'adminReviewAction';
      params: RootStackParamList['adminReviewAction'];
    }
  | {
      status: 'success';
      route: 'declarationDetails';
      params: RootStackParamList['declarationDetails'];
    }
  | {
      status: 'success';
      route: 'correctionResponse';
      params: RootStackParamList['correctionResponse'];
    }
  | {
      status: 'success';
      route: 'ohCoordinationDetail';
      params: RootStackParamList['ohCoordinationDetail'];
    }
  | {
      status: 'success';
      route: 'declarationCoordinationStatus';
      params: RootStackParamList['declarationCoordinationStatus'];
    }
  | {
      status: 'success';
      route: 'preventionActionDetail';
      params: RootStackParamList['preventionActionDetail'];
    };
```

### Type-Safety Guarantees
1. **Type Narrowing:** Checking `result.route === 'correctionResponse'` automatically narrows `result.params` to `{ declarationId: number; reviewId: number }`.
2. **Negative Proofs:**
   - A declaration route cannot receive CAPA parameters:
     `Extract<NotificationNavigationSuccess, { route: 'declarationDetails' }>['params']` does not accept `{ actionId: number }`.
   - A CAPA route cannot receive declaration parameters:
     `Extract<NotificationNavigationSuccess, { route: 'preventionActionDetail' }>['params']` does not accept `{ declarationId: number }`.
   - Required parameters cannot be omitted:
     `correctionResponse` parameters require both `declarationId` and `reviewId`.
   - Invalid route names are rejected at compile time.

---

## 4. Retained Canonical Event Mappings

All 11 canonical event mappings remain active and verified:

| # | Event Type | Entity Type | Target Route | Correlated Parameters | Authorized Role |
|---|------------|-------------|--------------|-----------------------|-----------------|
| 1 | `declaration_submitted` | `aes_declaration` | `adminReviewAction` | `{ declarationId: number }` | `admin_reviewer` |
| 2 | `review_completed` | `administrative_review` | `declarationDetails` | `{ declarationId: number }` | `exposed_professional` |
| 3 | `correction_requested` | `administrative_review` | `correctionResponse` | `{ declarationId: number; reviewId: number }` | `exposed_professional` |
| 4 | `correction_submitted` | `correction_response` | `adminReviewAction` | `{ declarationId: number }` | `admin_reviewer` |
| 5 | `oh_coordination_created` | `oh_coordination` | `ohCoordinationDetail` | `{ coordinationId: number }` | `oh_professional` |
| 6 | `oh_coordination_acknowledged` | `oh_coordination` | `declarationCoordinationStatus` | `{ declarationId: number }` | `exposed_professional` |
| 7 | `oh_milestone_recorded` | `oh_follow_up_events` | `declarationCoordinationStatus` | `{ declarationId: number }` | `exposed_professional` |
| 8 | `oh_coordination_completed` | `oh_coordination` | `declarationCoordinationStatus` | `{ declarationId: number }` | `exposed_professional` |
| 9 | `capa_created` | `prevention_action` | `preventionActionDetail` | `{ actionId: number }` | `quality_staff` |
| 10 | `capa_status_changed` | `prevention_action` | `preventionActionDetail` | `{ actionId: number }` | `quality_staff` |
| 11 | `capa_finalized` | `prevention_action` | `preventionActionDetail` | `{ actionId: number }` | `quality_staff` |

---

## 5. Verification & Test Suite Results

### 1. Dedicated Notification Navigation Suite
`src/features/aes-guardian/__tests__/notification-navigation.test.ts`
- **54 passed out of 54 tests (100%)**
  - Canonical Event Destinations: 11 tests
  - Correction A (Ownership Verification, Identity Switch, Forged ID, Recipient Scoping): 7 tests
  - Correction B (Correlated Route & Parameter Compile-time & Runtime): 3 tests
  - Strict Role Matrix Enforcement: 5 tests
  - tech_admin Blanket Denial: 11 tests
  - Unauthenticated Caller Denial: 2 tests
  - Structural & Mismatch Validation: 4 tests
  - Record Not Found Handling: 4 tests
  - Cross-User Record Isolation: 3 tests
  - Segregation of OH Views: 2 tests
  - Read-State Invariance: 2 tests

### 2. Full AES Guardian Feature Regression Suite
```
Test Suites: 13 passed, 13 total
Tests:       268 passed, 268 total
Snapshots:   0 total
Time:        12.509 s
```
All 13 test suites pass with zero errors:
- `notification-navigation.test.ts` (54 passed)
- `notification-localization.test.ts` (48 passed)
- `phase2d1-2-final-verification.test.ts`
- `phase2d1-corrective-verification.test.ts`
- `workspace-integration.test.ts`
- `oh-coordination-workflow.test.ts`
- `surveillance-dashboard.test.ts`
- `prevention-action-workflow.test.ts`
- `oh-coordination-detail-screen.test.tsx`
- `admin-review-workflow.test.tsx`
- `declaration-workflow.test.tsx`
- `help-glossary-profile.test.tsx`
- `correction-workflow.test.tsx`

### 3. Database Layer Regression Suite
- `src/core/database/__tests__/notifications.test.ts`: **32/32 tests passed**.

### 4. TypeScript Compilation
- `npx tsc --noEmit`: **0 errors** in `src/features/aes-guardian/` and `src/core/database/`.

---

## 6. Files Changed & Git Ledger

- **Branch:** `migration/aes-guardian`
- **HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217`
- **Working Tree State:** Working-tree modifications only, no Git commits or destructive operations performed.
- **Files Modified:**
  - `src/core/database/AesGuardianDatabase.ts` (added `getNotificationById` with double-guard recipient scoping)
  - `src/features/aes-guardian/index.ts` (exported `NotificationDestinationRoute`)
  - `src/features/aes-guardian/navigation/notification-navigation-resolver.ts` (ownership verification + correlated types)
  - `src/features/aes-guardian/__tests__/notification-navigation.test.ts` (54 tests covering Corrections A and B)
- **Deliverable Reports:**
  - `docs/AES_GUARDIAN_PHASE2D2F1_NOTIFICATION_OWNERSHIP_AND_TYPE_SAFETY_REPORT.md`

---

## 7. Scope Confirmation

1. **NO notification-centre screen or UI** was implemented.
2. **NO notification list card or unread badge UI** was implemented.
3. **NO push or background notifications** were implemented.
4. **NO schema migrations** were added (Version 8 strictly preserved).
5. **NO new clinical roles or authentication mechanisms** were introduced.
6. **NO git commits, pushes, stashes, or resets** were executed.
