# AES Guardian — Phase 2D.2C.3: Fail-Closed Repository Authorization Audit & Notification Engine Closure Report

**Project:** AES Guardian — Blood Exposure Incident Management  
**Branch:** `migration/aes-guardian`  
**Base Commit (HEAD):** `d79b01ef51646509170996f8c77517f95470f217`  
**Phase:** 2D.2C.3 — Final Authorization Audit & Engine Closure  
**Date:** November 13, 2026  
**Execution Policy:** Code-first; no emulator; zero git commits/pushes/resets; original SANAD repository untouched.

---

## 1. Executive Summary

Phase 2D.2C.3 completes the rigorous security hardening and fail-closed repository authorization audit for the AES Guardian subsystem. Following the Quality Staff confidentiality remediation in Phase 2D.2C.2, this phase audited all database retrieval methods returning role-restricted operational data.

Prior to this phase, several repository methods accepted optional requesting-user parameters (`requestingUserId?: number`), creating an authorization bypass if callers omitted identity context. Under Phase 2D.2C.3, **all nine role-restricted repository retrieval methods enforce strict, fail-closed access controls**. Any call made with missing (`undefined`), null (`null`), or invalid requesting identity is rejected with an explicit `Unauthorized` or `not found` error prior to query execution.

Furthermore, this phase established the **Private Clinical Notes Barrier**: `getOhFollowUpEvents` is strictly restricted to `oh_professional`. In accordance with the canonical role matrix, `admin_reviewer`, `quality_staff`, `tech_admin`, and `exposed_professional` are barred from accessing private occupational-health clinical event details.

### Verification Milestone Summary
- **Native SQLite Hardening Suite:** 42 passed, 42 total tests (0 failures).
- **Full Test Suite:** 36 passed, 36 total suites; 533 passed, 533 total tests (0 failures, 100% pass rate).
- **TypeScript Compilation:** Zero errors across `src/core` and `src/features/aes-guardian`.
- **Git Invariants:** Working tree strictly preserved on `migration/aes-guardian`; original SANAD repository (`C:\Users\User\Desktop\sure\sanad-rn`) untouched.

---

## 2. Canonical Role Boundary Matrix

The AES Guardian security architecture enforces the five canonical roles across all public repository endpoints:

| Role | Identifiable Declarations | OH Private Follow-Up Details | Aggregate Surveillance | CAPA Management |
| :--- | :---: | :---: | :---: | :---: |
| `exposed_professional` | **Own records only** | **No** (status-only view) | **No** | **No** |
| `admin_reviewer` | **Yes** (review & triage) | **No** (Private clinical notes barred) | **Yes** (de-identified) | Read-only |
| `oh_professional` | **Yes** (referred cases) | **Yes** (Authorized clinical notes) | **Yes** (de-identified) | Read-only |
| `quality_staff` | **No** (Strictly prohibited) | **No** (Strictly prohibited) | **Yes** (de-identified metrics) | **Create & Manage** |
| `tech_admin` | **No** (Zero operational access) | **No** (Zero operational access) | **No** | **No** |

---

## 3. Inventory of Role-Restricted Retrieval Methods & Fail-Closed Remediation

All 9 public repository retrieval methods were audited, updated, and validated:

### 1. `getDeclarationById(id: number, requestingUserId?: number | null)`
- **Behavior:** Fails closed immediately if `requestingUserId` is `undefined` or `null`. Validates requesting user identity.
- **Rules:**
  - `tech_admin`: Prohibited (`Unauthorized: tech_admin user ... is strictly prohibited from accessing clinical declaration content.`).
  - `quality_staff`: Prohibited (`Unauthorized: quality_staff user ... is strictly prohibited from accessing identifiable declaration content.`).
  - `exposed_professional`: Allowed **only** if `declared_by_user_id === requestingUserId`.
  - `admin_reviewer` & `oh_professional`: Allowed for operational processing.

### 2. `getDeclarations(options: { userId?: number | null; limit?: number; requestingUserId?: number | null })`
- **Behavior:** Fails closed if `options.requestingUserId` is omitted or `null`.
- **Rules:**
  - `tech_admin` & `quality_staff`: Prohibited.
  - `exposed_professional`: Constrained to return only records where `declared_by_user_id = requestingUserId`. Throws if caller attempts to specify a different `userId`.
  - `admin_reviewer` & `oh_professional`: Allowed to view declarations or filter by user.

### 3. `getDeclarationsByStatus(status: DeclarationStatus, requestingUserId?: number | null)`
- **Behavior:** Fails closed if `requestingUserId` is omitted or `null`.
- **Rules:**
  - `tech_admin` & `quality_staff`: Prohibited.
  - `exposed_professional`: Query strictly scopes results with `AND declared_by_user_id = ?`, preventing data leakage across declarants.
  - `admin_reviewer` & `oh_professional`: Allowed to query queue by status.

### 4. `getReviewQueue(options: { status?: DeclarationStatus; limit?: number; requestingUserId?: number | null })`
- **Behavior:** Fails closed if `options.requestingUserId` is omitted or `null`.
- **Rules:**
  - Strictly requires `user.role === 'admin_reviewer'`. All other roles (`quality_staff`, `oh_professional`, `exposed_professional`, `tech_admin`) are rejected.

### 5. `getCorrectionResponses(declarationId: number, requestingUserId?: number | null)`
- **Behavior:** Fails closed if `requestingUserId` is omitted or `null`.
- **Rules:**
  - `tech_admin` & `quality_staff`: Prohibited.
  - `exposed_professional`: Allowed **only** if they authored the associated declaration (`declared_by_user_id === requestingUserId`).
  - `admin_reviewer` & `oh_professional`: Allowed.

### 6. `getDeclarationReviewHistory(declarationId: number, optionsOrUserId?: ...)`
- **Behavior:** Fails closed if `requestingUserId` is omitted or `null` in either overloaded parameter form.
- **Rules:**
  - `tech_admin` & `quality_staff`: Prohibited.
  - `exposed_professional`: Allowed **only** for declarations they authored.
  - `admin_reviewer` & `oh_professional`: Allowed.

### 7. `getOhCoordinationById(coordination_id: number, requesting_user_id: number | null)`
- **Behavior:** Fails closed if `requesting_user_id` is omitted or `null`.
- **Rules:**
  - `tech_admin` & `quality_staff`: Prohibited.
  - `exposed_professional`: Allowed only for their own declaration; returns a stripped, status-only projection (hiding internal OH assignment dates and reviewer identities).
  - `admin_reviewer` & `oh_professional`: Full coordination record.

### 8. `getOhCoordinationByDeclaration(declaration_id: number, requesting_user_id: number | null)`
- **Behavior:** Fails closed if `requesting_user_id` is omitted or `null`.
- **Rules:**
  - Same boundary as `getOhCoordinationById`: `tech_admin` and `quality_staff` prohibited; `exposed_professional` receives status-only projection for own incident.

### 9. `getOhFollowUpEvents(coordination_id: number, requesting_user_id: number | null)`
- **Behavior:** Fails closed if `requesting_user_id` is omitted or `null`.
- **Rules (Private Clinical Notes Barrier):**
  - **Strictly `oh_professional` only.**
  - `admin_reviewer`: **Prohibited** (`getOhFollowUpEvents: role admin_reviewer is not authorized to read follow-up events`).
  - `quality_staff`: **Prohibited**.
  - `tech_admin`: **Prohibited**.
  - `exposed_professional`: **Prohibited**.

---

## 4. Internal Workflow Isolation

To prevent circumventing public repository authorization while maintaining atomic, multi-step transaction integrity, internal database methods are strictly demarcated:

- `getDeclarationByIdInternal(id: number)`: Private helper inside `AesGuardianDatabase`.
- **Restricted Call Sites:** Used solely inside already-authorized transactional methods:
  - `submitDeclaration(id)` (declarant action)
  - `updateAesDeclaration(id, input)` (draft author update)
  - `createAdministrativeReview(input)` (administrative review transaction)
  - `createCorrectionResponse(input)` (correction response transaction)
  - `acknowledgeOhCoordination(id, userId)` (OH workflow transaction)
  - `completeOhCoordination(id, userId)` (OH workflow transaction)
  - `createOhFollowUpEvent(input)` (OH clinical event transaction)
- Neither UI screens nor external service consumers can invoke `getDeclarationByIdInternal`.

---

## 5. UI Screen Call Site Remediation

Every UI screen call site was updated to derive user context from the synthetic session/boundary configuration and pass `userId` explicitly:

1. **`AdminReviewActionScreen.tsx`**:
   - `getDeclarationById(declarationId, reviewerContext.userId)`
   - `getDeclarationReviewHistory(declarationId, reviewerContext.userId)`
   - `getCorrectionResponses(declarationId, reviewerContext.userId)`
2. **`AdminReviewQueueScreen.tsx`**:
   - `getReviewQueue({ limit: 100, requestingUserId: reviewerContext.userId })`
3. **`AesGuardianWorkspaceScreen.tsx`**:
   - `getDeclarations({ userId: activeContext.userId, requestingUserId: activeContext.userId })`
   - `getReviewQueue({ requestingUserId: activeContext.userId })`
4. **`CorrectionResponseScreen.tsx`**:
   - `getDeclarationReviewHistory(declarationId, userContext.userId!)`
5. **`DeclarationDetailsScreen.tsx`**:
   - `getDeclarationById(declarationId, SYNTHETIC_DEMO_CONTEXT.userId)`
   - `getDeclarationReviewHistory(declarationId, SYNTHETIC_DEMO_CONTEXT.userId)`
6. **`DeclarationFormScreen.tsx`**:
   - `getDeclarationById(editId, SYNTHETIC_DEMO_CONTEXT.userId)`
   - `getDeclarationById(targetId, SYNTHETIC_DEMO_CONTEXT.userId)`
7. **`DeclarationListScreen.tsx`**:
   - `getDeclarations({ userId: SYNTHETIC_DEMO_CONTEXT.userId, requestingUserId: SYNTHETIC_DEMO_CONTEXT.userId })`

---

## 6. Verification and Test Results

### 1. Hardening & Verification Suite (`notification-workflow-hardening.test.ts`)
A dedicated suite (`Phase 2D.2C.3: Fail-Closed Repository Authorization Audit`) containing 12 comprehensive security tests was added:
1. `getDeclarationById`: missing identity throws fail-closed Unauthorized.
2. `getDeclarations`: missing identity throws fail-closed Unauthorized.
3. `getDeclarationsByStatus`: missing identity throws fail-closed Unauthorized.
4. `getReviewQueue`: missing identity throws fail-closed Unauthorized.
5. `getCorrectionResponses`: missing identity throws fail-closed Unauthorized.
6. `getDeclarationReviewHistory`: missing identity throws fail-closed Unauthorized.
7. `getOhCoordinationById` and `getOhCoordinationByDeclaration`: missing identity throws fail-closed Unauthorized.
8. `getOhFollowUpEvents`: missing identity throws fail-closed Unauthorized.
9. Invalid/non-existent user ID fails closed with `not found` error.
10. **Private Clinical Notes Barrier**: `getOhFollowUpEvents` strictly permits `oh_professional` and rejects `admin_reviewer`, `quality_staff`, `tech_admin`, and `exposed_professional`.
11. `exposed_professional` `getDeclarationsByStatus` is strictly scoped to own records.
12. Unauthorized and missing-identity calls never mutate records, produce foreign-key violations, or emit notifications.

**Result:** `42 passed, 42 total` (100% pass rate).

### 2. Full Regression Baseline Execution
Full Jest test suite execution across the entire repository:
```
Test Suites: 36 passed, 36 total
Tests:       533 passed, 533 total
Snapshots:   0 total
Time:        24.635 s
```

### 3. Static Type Analysis
- Executed `npx tsc --noEmit`.
- **0 errors** in `src/core` and `src/features/aes-guardian`.

---

## 7. Phase 2D.2C Milestone Acceptance & Closure

With the completion of Phase 2D.2C.3:
1. All 11 notification event types are integrated with transactional atomicity.
2. Recipient resolution is fail-closed, transaction-scoped, and rejects fallback/`tech_admin`.
3. Quality Staff confidentiality boundaries are strictly enforced (zero identifiable declaration/OH access; aggregate surveillance and CAPA CRUD preserved).
4. Repository retrieval endpoints are completely fail-closed against omitted or invalid user contexts.
5. The Occupational Health clinical notes boundary strictly protects confidential follow-up notes against Administrative Reviewers.

**Milestone Status:** Phase 2D.2C is formally **CLOSED**. The repository foundation is verified and ready for Phase 2D.2D (Notification Demo Seeding & Reset Alignment).
