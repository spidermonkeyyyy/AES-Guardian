# AES GUARDIAN — PHASE 2D.2F
## Notification Navigation & Record-Level Authorization Report

**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217`  
**Schema Version:** Version 8  
**Previous Phase:** 2D.2E (Notification Localization) — ACCEPTED & CLOSED  
**Current Phase:** 2D.2F (Notification Navigation & Record-Level Authorization) — COMPLETE

---

## 1. Executive Summary

Phase 2D.2F implements the centralized, type-safe navigation resolver that connects in-app notification records to existing AES Guardian screens and workflows.

### Architectural Core Principles
1. **Notification is a Reference, Never a Credential:** An in-app notification record merely indicates an event occurred. It is never treated as authorization to view or act upon that record.
2. **Identity Solely from Active AuthContext:** The resolver strictly derives the user's ID and role from the authenticated `AuthContext`. It never reads or trusts the notification's internal `recipient_user_id` or any role assertions in the payload.
3. **Fail-Closed, Discriminated Union Result:** The resolver never throws exceptions to UI callers. All outcomes are modeled as a discriminated union: `success`, `unauthorized`, `not_found`, or `invalid_event`.
4. **Strict Segregation of Occupational Health Views:** Declaring exposed professionals navigating from OH notifications (`oh_coordination_acknowledged`, `oh_milestone_recorded`, `oh_coordination_completed`) route exclusively to `declarationCoordinationStatus` (shielded summary), and never to `ohCoordinationDetail` (reserved exclusively for `oh_professional`).
5. **Read-State Invariance:** Navigational resolution is a pure, idempotent read operation. It does not mutate the notification's `is_read` or `read_at` fields in the database. Callers retain explicit control over marking notifications read only upon verified navigation success.
6. **Zero UI Scope Boundary:** As mandated, no notification-centre screen, notification list card, unread badge UI, or push notification infrastructure was implemented in this phase.

---

## 2. Canonical Route Mapping Inventory

All 11 canonical event types map deterministically to typed routes in `RootStackParamList`:

| # | Event Type | Entity Type | Target Route | Required Params | Authorized Role | DB Resolution Method | Unauthorized / Not Found Behavior |
|---|------------|-------------|--------------|-----------------|-----------------|----------------------|-----------------------------------|
| 1 | `declaration_submitted` | `aes_declaration` | `adminReviewAction` | `{ declarationId: entity_id }` | `admin_reviewer` | `getDeclarationById(id, userId)` | Rejects wrong role with `unauthorized`; missing declaration yields `not_found`. |
| 2 | `review_completed` | `administrative_review` | `declarationDetails` | `{ declarationId: review.declaration_id }` | `exposed_professional` | `getAdministrativeReviewById(id, userId)` | Rejects non-owners with `not_found`; wrong role with `unauthorized`. |
| 3 | `correction_requested` | `administrative_review` | `correctionResponse` | `{ declarationId: review.declaration_id, reviewId: entity_id }` | `exposed_professional` | `getAdministrativeReviewById(id, userId)` | Rejects non-owners with `not_found`; wrong role with `unauthorized`. |
| 4 | `correction_submitted` | `correction_response` | `adminReviewAction` | `{ declarationId: response.declaration_id }` | `admin_reviewer` | `getCorrectionResponseById(id, userId)` | Rejects wrong role with `unauthorized`; missing response yields `not_found`. |
| 5 | `oh_coordination_created` | `oh_coordination` | `ohCoordinationDetail` | `{ coordinationId: entity_id }` | `oh_professional` | `getOhCoordinationById(id, userId)` | Rejects non-OH roles with `unauthorized`; missing coordination yields `not_found`. |
| 6 | `oh_coordination_acknowledged` | `oh_coordination` | `declarationCoordinationStatus` | `{ declarationId: coord.declaration_id }` | `exposed_professional` | `getOhCoordinationById(id, userId)` | Returns minimal summary; non-owners yield `not_found`; wrong role `unauthorized`. |
| 7 | `oh_milestone_recorded` | `oh_follow_up_events` | `declarationCoordinationStatus` | `{ declarationId: event.declaration_id }` | `exposed_professional` | `getOhFollowUpEventById(id, userId)` | Joins coordination to declaration; verifies ownership; non-owners yield `not_found`. |
| 8 | `oh_coordination_completed` | `oh_coordination` | `declarationCoordinationStatus` | `{ declarationId: coord.declaration_id }` | `exposed_professional` | `getOhCoordinationById(id, userId)` | Returns minimal summary; non-owners yield `not_found`; wrong role `unauthorized`. |
| 9 | `capa_created` | `prevention_action` | `preventionActionDetail` | `{ actionId: entity_id }` | `quality_staff` | `getPreventionActionById(userId, id)` | Rejects non-quality roles with `unauthorized`; missing action yields `not_found`. |
| 10 | `capa_status_changed` | `prevention_action` | `preventionActionDetail` | `{ actionId: entity_id }` | `quality_staff` | `getPreventionActionById(userId, id)` | Rejects non-quality roles with `unauthorized`; missing action yields `not_found`. |
| 11 | `capa_finalized` | `prevention_action` | `preventionActionDetail` | `{ actionId: entity_id }` | `quality_staff` | `getPreventionActionById(userId, id)` | Rejects non-quality roles with `unauthorized`; missing action yields `not_found`. |

---

## 3. Resolver Architecture & Design

The resolver is located at:
`src/features/aes-guardian/navigation/notification-navigation-resolver.ts`

### Return Type: Discriminated Union
```typescript
export type NotificationNavigationResult =
  | NotificationNavigationSuccess
  | NotificationNavigationUnauthorized
  | NotificationNavigationNotFound
  | NotificationNavigationInvalidEvent;

export interface NotificationNavigationSuccess {
  status: 'success';
  route: keyof RootStackParamList;
  params: RootStackParamList[keyof RootStackParamList];
}

export interface NotificationNavigationUnauthorized {
  status: 'unauthorized';
  reason: string;
}

export interface NotificationNavigationNotFound {
  status: 'not_found';
  reason: string;
}

export interface NotificationNavigationInvalidEvent {
  status: 'invalid_event';
  reason: string;
}
```

### Authorization Gates (in sequence)
1. **Authentication Check:** If `!authContext.isAuthenticated || authContext.userId === null`, returns `{ status: 'unauthorized', reason: 'User is not authenticated.' }`.
2. **Blanket `tech_admin` Prohibition:** If `authContext.role === 'tech_admin'`, immediately returns `{ status: 'unauthorized', reason: 'tech_admin role is prohibited from notification navigation.' }`.
3. **Structural Validation:** Validates `entity_id` (> 0) and non-empty `entity_type`. Mismatches or missing values return `{ status: 'invalid_event' }`.
4. **Role Boundary Check:** Compares `authContext.role` against `AUTHORIZED_ROLE_FOR_EVENT[event_type]`. Any mismatch returns `{ status: 'unauthorized' }`.
5. **Database-Level Entity Access:** Calls repository lookup with `authContext.userId`. If the record does not exist or access is denied by row-level rules, returns `{ status: 'not_found' }` or `{ status: 'unauthorized' }`.

---

## 4. Database Layer Hardening & Methods Added

To support record-level authorization during navigation resolution, three specific query methods were introduced to `AesGuardianDatabase`:

### 1. `getAdministrativeReviewById(reviewId: number, requestingUserId: number)`
- **Role Enforcement:** Prohibits `tech_admin`, `quality_staff`, and `oh_professional`.
- **Ownership Verification:** If caller is `exposed_professional`, resolves the parent declaration and ensures `decl.declared_by_user_id === requestingUserId`. If not owned, returns `null` (preventing identity enumeration).
- **Association:** Attaches the corresponding `CorrectionResponse` if outcome is `correction_requested`.

### 2. `getCorrectionResponseById(responseId: number, requestingUserId: number)`
- **Role Enforcement:** Prohibits `tech_admin`, `quality_staff`, and `oh_professional`.
- **Ownership Verification:** If caller is `exposed_professional`, verifies ownership of the underlying declaration.

### 3. `getOhFollowUpEventById(eventId: number, requestingUserId: number)`
- **Role Enforcement:** Prohibits `tech_admin`, `quality_staff`, and `admin_reviewer`.
- **Relational Traversal:** Executes a SQL JOIN across `oh_follow_up_events` and `oh_coordinations` to obtain `declaration_id`.
- **Ownership Verification:** If caller is `exposed_professional`, verifies declaration ownership before returning navigation identifiers.

### 4. Robust SQLite Parameter Binding
- Hardened `AesGuardianDatabase.insertNotification` to bind `input.idempotency_key ?? null`.
- Hardened `AesGuardianDatabase.getNotifications` to normalize boolean/numeric `filters.is_read` parameter values.

---

## 5. Occupational Health Data Minimization & View Segregation

In strict adherence to Phase 2C.4 and Phase 2D.2C.3 specifications:
- **`oh_coordination_created`** (Recipient: `oh_professional`):
  Routes to `ohCoordinationDetail` with `{ coordinationId: entity_id }`.
- **`oh_coordination_acknowledged` / `oh_milestone_recorded` / `oh_coordination_completed`** (Recipient: `exposed_professional`):
  Routes to `declarationCoordinationStatus` with `{ declarationId }`.
  Declaring professionals **never** receive routing to `ohCoordinationDetail` or `OhFollowUpEventScreen`.

---

## 6. Read-State Invariance Contract

- `resolveNotificationNavigation` is strictly a lookup function.
- It performs zero write operations against `in_app_notifications`.
- In all 45 automated navigation tests, notifications retain `is_read = 0` throughout resolution.
- Marking notifications as read is performed explicitly via `db.markNotificationRead(notificationId, userId)` by the calling controller after successful route dispatch.
- Failed navigations (`unauthorized`, `not_found`, `invalid_event`) preserve unread state.

---

## 7. Verification & Test Matrix

### 1. Dedicated Navigation Suite (`src/features/aes-guardian/__tests__/notification-navigation.test.ts`)
- **45 tests, 45 passed (100%):**
  - All 11 Canonical Event Destinations (11 tests)
  - Strict Role Matrix Enforcement (5 tests)
  - tech_admin Blanket Denial across all 11 events (11 tests)
  - Unauthenticated & Malformed Context Denial (2 tests)
  - Structural & Entity-Type Mismatch Validation (5 tests)
  - Record Not Found & Missing Entity Handling (4 tests)
  - Cross-User Declaration & Review Isolation (3 tests)
  - Segregation of OH Views (2 tests)
  - Read-State Invariance & Controller-Driven Read Updates (2 tests)

### 2. Full AES Guardian Feature Suite
```
Test Suites: 13 passed, 13 total
Tests:       259 passed, 259 total
Snapshots:   0 total
Time:        14.142 s
```
All 13 suites pass with 0 errors:
- `notification-navigation.test.ts` (45 tests)
- `notification-localization.test.ts` (48 tests)
- `phase2d1-2-final-verification.test.ts`
- `phase2d1-corrective-verification.test.ts`
- `oh-coordination-workflow.test.ts`
- `workspace-integration.test.ts`
- `surveillance-dashboard.test.ts`
- `prevention-action-workflow.test.ts`
- `oh-coordination-detail-screen.test.tsx`
- `admin-review-workflow.test.tsx`
- `declaration-workflow.test.tsx`
- `help-glossary-profile.test.tsx`
- `correction-workflow.test.tsx`

### 3. Database & Notification Suite
```
PASS src/core/database/__tests__/notifications.test.ts (32 passed)
PASS src/features/aes-guardian/__tests__/notification-localization.test.ts (48 passed)
```

---

## 8. Git Status & Artifact Ledger

- **Branch:** `migration/aes-guardian`
- **HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217`
- **Files Modified:**
  - `src/core/database/AesGuardianDatabase.ts` (restored + 3 navigation query methods + SQLite param hardening)
  - `src/features/aes-guardian/index.ts` (exported `resolveNotificationNavigation` and result types)
- **Files Added:**
  - `src/features/aes-guardian/navigation/notification-navigation-resolver.ts`
  - `src/features/aes-guardian/__tests__/notification-navigation.test.ts`
  - `docs/AES_GUARDIAN_PHASE2D2F_NOTIFICATION_NAVIGATION_REPORT.md`

---

## 9. Explicit Confirmation of Prohibitions

1. **NO notification-centre screen or UI** was created (reserved for Phase 2D.2G).
2. **NO unread notification badge** or notification bell UI was created.
3. **NO push or background notifications** were implemented.
4. **NO schema migrations or database schema changes** were added (Version 8 preserved).
5. **NO new clinical roles or role definitions** were created.
6. **NO git commits, pushes, stashes, or resets** were executed.
