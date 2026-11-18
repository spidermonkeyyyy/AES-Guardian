# AES GUARDIAN — PHASE 2D.2C.3.1 IMPLEMENTATION REPORT
## OH Coordination Data Minimization & Active Identity Call-Site Audit

**Project:** AES Guardian (SANAD React Native Migration)  
**Worktree:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**Base HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Phase:** 2D.2C.3.1 — Corrective Hardening & Data Minimization  
**Schema Version:** Version 8  
**Test Suite Status:** 36 suites / 547 tests passing (100% green)  
**TypeScript Status:** 0 errors (`npx tsc --noEmit` clean)  
**Execution Policy:** Code-first; no emulator; no git commits/pushes/resets; original repository untouched.

---

## 1. Executive Summary

Phase 2D.2C.3.1 resolves the remaining authorization, confidentiality, and data-minimization issues identified in the Phase 2D.2C.3 review:

1. **OH Coordination Data Minimization:** Implemented strict role-based projections at the database repository boundary (`AesGuardianDatabase.ts`) for `getOhCoordinationById`, `getOhCoordinationByDeclaration`, and `listOhCoordinationsForAdmin`.
   - `admin_reviewer` now receives an administrative oversight projection containing only status, reason, timestamps, and declaration reference. Internal Occupational Health (OH) personnel identities (`acknowledged_by_user_id`, `completed_by_user_id`) are shielded and nulled.
   - `oh_professional` receives the full authorized record.
   - `exposed_professional` receives a status-only projection strictly scoped to their own declarations (milestones and staff IDs nulled).
   - `quality_staff` and `tech_admin` are completely denied.
   - Private follow-up events (`getOhFollowUpEvents`) remain strictly restricted to `oh_professional`.
2. **Active Synthetic Identity Call-Site Audit:** Audited all 11 operational UI screens in `src/features/aes-guardian/screens/`. Migrated all call sites from hardcoded fixed synthetic demo contexts (`SYNTHETIC_DEMO_CONTEXT.userId`, `SYNTHETIC_ADMIN_REVIEWER_CONTEXT`, `SYNTHETIC_OH_PROFESSIONAL_CONTEXT`) to dynamic subscription via `useDemoRoleStore().activeContext`.
   - Verified that changing the active demonstration role dynamically updates UI screen capabilities and fails closed with unauthorized notices when an unauthorized role accesses a restricted screen.
   - Verified `AesGuardianWorkspaceScreen.tsx` executes role-isolated queries without cross-role pollution.

All 36 Jest test suites (547 tests) pass cleanly, TypeScript compiles with zero errors, and zero git commits/destructive operations were performed.

---

## 2. Baseline & Environment Verification

| Parameter | Expected | Actual | Status |
|---|---|---|---|
| **Branch** | `migration/aes-guardian` | `migration/aes-guardian` | Verified |
| **Base HEAD** | `d79b01ef51646509170996f8c77517f95470f217` | `d79b01ef51646509170996f8c77517f95470f217` | Verified |
| **Original Repo** | `C:\Users\User\Desktop\sure\sanad-rn` | Untouched | Verified |
| **Emulator** | No routine launch | 0 launches | Compliant |
| **Git Operations** | No commits / pushes / resets | 0 destructive actions | Compliant |

---

## 3. OH Coordination Data Minimization Implementation

### 3.1 Role-Specific Projection Specifications

The repository methods `getOhCoordinationById`, `getOhCoordinationByDeclaration`, and `listOhCoordinationsForAdmin` in `src/core/database/AesGuardianDatabase.ts` enforce the following role-specific field projections:

| Field | `oh_professional` | `admin_reviewer` | `exposed_professional` | `quality_staff` / `tech_admin` |
|---|---|---|---|---|
| `id` | Preserved | Preserved | Preserved | Access Denied (Error) |
| `declaration_id` | Preserved | Preserved | Preserved | Access Denied (Error) |
| `created_by_user_id` | Preserved | Preserved | Preserved | Access Denied (Error) |
| `coordination_reason` | Preserved | Preserved | Preserved | Access Denied (Error) |
| `status` | Preserved | Preserved | Preserved | Access Denied (Error) |
| `acknowledged_at` | Preserved | **Preserved (Oversight)** | `null` (Status-only) | Access Denied (Error) |
| `completed_at` | Preserved | **Preserved (Oversight)** | `null` (Status-only) | Access Denied (Error) |
| `acknowledged_by_user_id` | **Preserved** | **`null` (Shielded)** | `null` (Shielded) | Access Denied (Error) |
| `completed_by_user_id` | **Preserved** | **`null` (Shielded)** | `null` (Shielded) | Access Denied (Error) |
| `created_at` / `updated_at` | Preserved | Preserved | Preserved | Access Denied (Error) |
| Ownership Constraint | Assigned records | Created records | **Own declarations only** | N/A |

### 3.2 Code Implementation in `AesGuardianDatabase.ts`

```typescript
// In getOhCoordinationById and getOhCoordinationByDeclaration:
if (user.role === 'tech_admin') {
  throw new Error('getOhCoordinationById: tech_admin is not authorized to access coordination data');
}
if (user.role === 'quality_staff') {
  throw new Error('getOhCoordinationById: quality_staff is not authorized to access coordination data');
}
if (user.role !== 'oh_professional' && user.role !== 'admin_reviewer' && user.role !== 'exposed_professional') {
  throw new Error(`getOhCoordinationById: role ${user.role} is not authorized to access coordination data`);
}

// exposed_professional: status-only view, own declarations only
if (user.role === 'exposed_professional') {
  const declResult = await this.db.query<AesDeclaration>(
    `SELECT * FROM aes_declarations WHERE id = ?`,
    [coord.declaration_id],
  );
  if (declResult.rows.length === 0 || declResult.rows[0].declared_by_user_id !== requesting_user_id) {
    throw new Error('getOhCoordinationById: exposed_professional may only view coordination for their own declaration');
  }
  return {
    id: coord.id,
    declaration_id: coord.declaration_id,
    created_by_user_id: coord.created_by_user_id,
    coordination_reason: coord.coordination_reason,
    status: coord.status,
    acknowledged_by_user_id: null,
    acknowledged_at: null,
    completed_by_user_id: null,
    completed_at: null,
    created_at: coord.created_at,
    updated_at: coord.updated_at,
  };
}

// admin_reviewer: limited administrative projection (milestones visible, internal OH staff IDs nulled)
if (user.role === 'admin_reviewer') {
  return {
    id: coord.id,
    declaration_id: coord.declaration_id,
    created_by_user_id: coord.created_by_user_id,
    coordination_reason: coord.coordination_reason,
    status: coord.status,
    acknowledged_by_user_id: null,
    acknowledged_at: coord.acknowledged_at,
    completed_by_user_id: null,
    completed_at: coord.completed_at,
    created_at: coord.created_at,
    updated_at: coord.updated_at,
  };
}

return coord; // Full record for oh_professional
```

### 3.3 Administrative List Projection

In `listOhCoordinationsForAdmin(requesting_user_id: number)`:
```typescript
const result = await this.db.query<OhCoordination>(
  `SELECT c.*, d.reference_number AS declaration_reference
   FROM oh_coordinations c
   LEFT JOIN aes_declarations d ON d.id = c.declaration_id
   WHERE c.created_by_user_id = ?
   ORDER BY c.created_at DESC`,
  [requesting_user_id],
);
return result.rows.map(row => ({
  ...row,
  acknowledged_by_user_id: null,
  completed_by_user_id: null,
}));
```

---

## 4. Active Identity Call-Site Audit & Migration

All operational screens were updated to subscribe to `useDemoRoleStore().activeContext` rather than importing fixed constants:

| Screen File | Previous Context Source | Updated Context Source | Fail-Closed / Auth Check Added |
|---|---|---|---|
| `AdminReviewActionScreen.tsx` | `SYNTHETIC_ADMIN_REVIEWER_CONTEXT` | `useDemoRoleStore().activeContext` | Evaluates `canReview(activeContext)`. Renders unauthorized banner if active role is not `admin_reviewer`. |
| `AdminReviewQueueScreen.tsx` | `SYNTHETIC_ADMIN_REVIEWER_CONTEXT` | `useDemoRoleStore().activeContext` | Evaluates `canReview(activeContext)`. Guards `getReviewQueue({ requestingUserId })`. |
| `CreateCoordinationScreen.tsx` | `SYNTHETIC_ADMIN_REVIEWER_CONTEXT` | `useDemoRoleStore().activeContext` | Evaluates `canCoordinate(activeContext)`. Passes `activeContext.userId` to `createOhCoordination`. |
| `DeclarationCoordinationStatusScreen.tsx` | `SYNTHETIC_DEMO_CONTEXT` | `useDemoRoleStore().activeContext` | Passes `activeContext.userId` to `getOhCoordinationByDeclaration`. Scoped to own record. |
| `OhCoordinationDetailScreen.tsx` | `SYNTHETIC_OH_PROFESSIONAL_CONTEXT` | `useDemoRoleStore().activeContext` | Evaluates `canFollowUp(activeContext)` and `canCoordinate(activeContext)`. Only loads `getOhFollowUpEvents` if `isOhProfessional`. |
| `OhCoordinationQueueScreen.tsx` | `SYNTHETIC_OH_PROFESSIONAL_CONTEXT` | `useDemoRoleStore().activeContext` | Evaluates `canFollowUp(activeContext)`. Guards `listOhCoordinationsQueue`. |
| `OhFollowUpEventScreen.tsx` | `SYNTHETIC_OH_PROFESSIONAL_CONTEXT` | `useDemoRoleStore().activeContext` | Evaluates `canFollowUp(activeContext)`. Passes `activeContext.userId` to `createOhFollowUpEvent`. |
| `DeclarationDetailsScreen.tsx` | `SYNTHETIC_DEMO_CONTEXT.userId` | `useDemoRoleStore().activeContext.userId` | Passes active `userId` to `getDeclarationById` and `getDeclarationReviewHistory`. Uses `canRespondToCorrection(activeContext)`. |
| `DeclarationFormScreen.tsx` | `SYNTHETIC_DEMO_CONTEXT.userId` | `useDemoRoleStore().activeContext.userId` | Draft creation, updates, submission, and audit logs use active `userId`. |
| `DeclarationListScreen.tsx` | `SYNTHETIC_DEMO_CONTEXT.userId` | `useDemoRoleStore().activeContext.userId` | Passes `activeContext.userId` as `userId` and `requestingUserId`. Scoped to active role. |
| `CorrectionResponseScreen.tsx` | `SYNTHETIC_DEMO_CONTEXT` | `useDemoRoleStore().activeContext` | Evaluates `canRespondToCorrection(activeContext)`. Passes active `userId` to `createCorrectionResponse`. |
| `PreventionActionCreateScreen.tsx` | `SYNTHETIC_QUALITY_STAFF_CONTEXT.userId` | `useDemoRoleStore().activeContext.userId` | Evaluates `canManagePreventionActions(activeContext)`; rejects non-quality roles. |

### 4.1 Workspace Screen Dynamic Role Switching

`AesGuardianWorkspaceScreen.tsx` already observes `activeRole` and `activeContext.userId`. When switched:
- `exposed_professional`: loads `getDeclarations` and counts user's own declarations.
- `admin_reviewer`: loads `getReviewQueue` for admin triage.
- `oh_professional`: loads `listOhCoordinationsQueue` for occupational health queue.
- `quality_staff`: loads de-identified aggregate surveillance metrics and CAPA overview.
- `tech_admin`: queries schema versions without querying operational data.

---

## 5. Verification & Test Results

### 5.1 Native SQLite Tests (`notification-workflow-hardening.test.ts`)

Added **Remediation F: OH Coordination Data Minimization Verification** (6 tests):
1. `oh_professional` retrieves full coordination details including internal staff IDs.
2. `admin_reviewer` receives data-minimized projection (milestones visible, internal OH staff IDs nulled).
3. `admin_reviewer` `listOhCoordinationsForAdmin` shields internal OH staff IDs.
4. `exposed_professional` retrieves status-only view with both timestamps and staff IDs nulled.
5. `getOhCoordinationByDeclaration` applies identical data minimization to `admin_reviewer`.
6. `quality_staff` and `tech_admin` are completely denied from OH coordination retrieval.

*Result:* 48/48 tests passing in `notification-workflow-hardening.test.ts`.

### 5.2 Mock SQLite Workflow Tests (`oh-coordination-workflow.test.ts`)

Added **OH Coordination Data Minimization Projections** (7 tests):
1. `oh_professional` receives full authorized record with staff IDs and milestones.
2. `admin_reviewer` receives oversight projection (milestones preserved, internal OH staff IDs nulled).
3. `admin_reviewer` in `listOhCoordinationsForAdmin` shields internal OH staff IDs.
4. `exposed_professional` receives status-only view for own declaration (milestones and staff IDs nulled).
5. `getOhCoordinationByDeclaration` applies same role projections.
6. `quality_staff` and `tech_admin` are completely denied from `getOhCoordinationById` and `getOhCoordinationByDeclaration`.
7. missing or null `requesting_user_id` fails closed with Unauthorized.

*Result:* 38/38 tests passing in `oh-coordination-workflow.test.ts`.

### 5.3 UI Workflow Tests

Verified that changing the role store in test suites (`useDemoRoleStore.getState().setRole(...)`) correctly drives UI screen authorization:
- `admin-review-workflow.test.tsx`: 6/6 tests passing (including explicit unauthorized access control verification).
- `correction-workflow.test.tsx`: 11/11 tests passing.
- `declaration-workflow.test.tsx`: 11/11 tests passing.
- `workspace-integration.test.ts`: 3/3 tests passing.

### 5.4 Full Jest Test Suite Run

```text
Test Suites: 36 passed, 36 total
Tests:       547 passed, 547 total
Snapshots:   0 total
Time:        23.844 s
Ran all test suites.
```

### 5.5 TypeScript Compiler Verification

```text
npx tsc --noEmit --skipLibCheck --jsx react-jsx --esModuleInterop ...
Command exited with code 0.
```
Zero compilation errors across all core and AES Guardian feature files.

---

## 6. Scope Boundaries & Next Phase Readiness

- **Strict Scope Discipline:** Phase 2D.2D (Notification Demo Seeding & Reset Alignment) was **NOT** initiated.
- **Code-First Invariant:** No emulator was launched.
- **Git Invariant:** Zero commits, pushes, staging, or resets performed.
- **Readiness:** The authorization boundary and data minimization foundation are now robust, fail-closed, and ready for authorization to proceed to Phase 2D.2D.
