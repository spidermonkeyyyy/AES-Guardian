# AES GUARDIAN — PHASE 2E.1.4.2A
## OH Declaration Retrieval Authorization Hardening Report

**Project:** AES Guardian  
**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217`  
**Database Schema Version:** Version 8 (strictly preserved, zero migrations added)  
**Phase:** Phase 2E.1.4.2A — Narrow Repository Authorization Correction  
**Date:** 2026-11-15  

---

## 1. Executive Summary

Phase 2E.1.4.2A has successfully resolved the verified unrestricted OH declaration retrieval vulnerability identified during the Phase 2E.1.4.0 audit and Phase 2E.1.4.1 security reconciliation.

### The Vulnerability Closed
Prior to this phase:
1. `AesGuardianDatabase.getDeclarations()` allowed an `oh_professional` to query hospital-wide declaration lists without restriction.
2. `AesGuardianDatabase.getDeclarationsByStatus()` allowed an `oh_professional` to query declarations filtered by status across the facility.
3. `AesGuardianDatabase.getDeclarationById()` permitted an `oh_professional` to retrieve any arbitrary declaration by ID without proving an active or authorized OH coordination relationship.

### The Corrected Architecture
1. **General-Purpose Retrieval Prohibited:** `getDeclarations()`, `getDeclarationsByStatus()`, and `getDeclarationById()` now strictly reject callers with role `oh_professional` with a descriptive, fail-closed `Unauthorized: ...` error.
2. **Authorized OH Workflow Preserved:** Occupational Health professionals access incident records solely through their dedicated, authorized coordination workflow:
   - `listOhCoordinationsQueue(ohUserId)`: Retrieves active coordination records with joined declaration references.
   - `getOhCoordinationById(coordId, ohUserId)`: Retrieves full coordination record and milestones with authorization validation.
   - `getOhFollowUpEvents(coordId, ohUserId)`: Retrieves chronological clinical follow-up events.
   - `getDeclarationForCoordinationInternal(coordId, ohUserId)`: Provides an internal, coordination-scoped declaration retrieval pathway that strictly verifies that the coordination exists, is authorized, and the caller is an authenticated `oh_professional`.
3. **No Schema Changes:** SQLite schema remains strictly at Version 8. Zero database migrations were introduced.
4. **Zero Regressions:** All 44 Jest test suites in the repository passed (909 passed, 0 failed), and TypeScript typechecks in `src/features/aes-guardian/` and `src/core/database/` confirm zero errors.

---

## 2. Before & After Authorization Matrix

The table below details access permissions across all five approved AES Guardian roles before and after Phase 2E.1.4.2A hardening:

| Repository Method | Role: `exposed_professional` | Role: `admin_reviewer` | Role: `oh_professional` (BEFORE) | Role: `oh_professional` (AFTER) | Role: `quality_staff` | Role: `tech_admin` |
|---|---|---|---|---|---|---|
| `getDeclarations(opts)` | Own declarations only (`declared_by_user_id === user.id`) | Full hospital-wide declarations | **VULNERABLE:** Full hospital-wide declarations | **REJECTED (FAIL-CLOSED)** (`Unauthorized`) | **REJECTED** (`Unauthorized`) | **REJECTED** (`Unauthorized`) |
| `getDeclarationsByStatus(status)` | N/A (unauthorized unless filtered by owner) | Full matching declarations | **VULNERABLE:** Full matching declarations | **REJECTED (FAIL-CLOSED)** (`Unauthorized`) | **REJECTED** (`Unauthorized`) | **REJECTED** (`Unauthorized`) |
| `getDeclarationById(id)` | Own declaration only (`declared_by_user_id === user.id`) | Full declaration retrieval | **VULNERABLE:** Arbitrary declaration retrieval | **REJECTED (FAIL-CLOSED)** (`Unauthorized`) | **REJECTED** (`Unauthorized`) | **REJECTED** (`Unauthorized`) |
| `listOhCoordinationsQueue(userId)` | **REJECTED** | **REJECTED** | Full active queue | Full active queue | **REJECTED** | **REJECTED** |
| `listOhCoordinationsForAdmin(userId)` | **REJECTED** | Administrative projection (staff IDs shielded) | **REJECTED** | **REJECTED** | **REJECTED** | **REJECTED** |
| `getOhCoordinationById(coordId, userId)` | Minimal status projection (own declaration only) | Administrative summary (staff IDs shielded) | Full coordination record | Full coordination record | **REJECTED** | **REJECTED** |
| `getDeclarationForCoordinationInternal(coordId, userId)` | **REJECTED** | **REJECTED** | *Did not exist* | **AUTHORIZED** (scoped strictly to valid coordination) | **REJECTED** | **REJECTED** |

---

## 3. Data Flow & Call Graph Verification

### Trace of Callsites
A comprehensive callsite audit was conducted across the codebase:

1. **`OhCoordinationDetailScreen.tsx`:**
   - **Data Path:**
     ```text
     OhCoordinationDetailScreen.loadCoordinationData()
       ├── AesGuardianDatabase.getOhCoordinationById(coordId, activeUserId)
       │     └── SQL: SELECT c.*, d.reference_number AS declaration_reference FROM oh_coordinations ...
       └── AesGuardianDatabase.getOhFollowUpEvents(coordId, activeUserId)
             └── SQL: SELECT * FROM oh_follow_up_events WHERE coordination_id = ? ...
     ```
   - **Finding:** `OhCoordinationDetailScreen` **never** called `getDeclarationById()` or `getDeclarations()`. It relies on the reference joined within `getOhCoordinationById()` and event entries. Therefore, hardening `getDeclarationById` did not disrupt the OH coordination UI screen.

2. **Internal Coordination Declaration Retrieval Path:**
   - For components requiring declaration clinical details in an OH context, `getDeclarationForCoordinationInternal(coordId, requestingUserId)` provides a verified, non-bypassable method:
     ```text
     getDeclarationForCoordinationInternal(coordId, requestingUserId)
       ├── Check requestingUserId != null (fail-closed)
       ├── Check user exists and user.role === 'oh_professional'
       ├── getOhCoordinationById(coordId, requestingUserId)
       │     └── Validates coordination exists and caller has authorized OH access
       └── getDeclarationByIdInternal(coord.declaration_id)
             └── Retrieves the specific declaration bound to that coordination
     ```

---

## 4. Exact Source Modifications

### 1. `src/core/database/AesGuardianDatabase.ts`
- **Lines 889–893 (`getDeclarationById`):**
  Added explicit fail-closed rejection for `oh_professional`:
  ```typescript
  if (user.role === 'oh_professional') {
    throw new Error(
      `Unauthorized: oh_professional user ${requestingUserId} is strictly prohibited from direct declaration retrieval. Access incident records via authorized OH coordination.`,
    );
  }
  ```
- **Lines 927–931 (`getDeclarations`):**
  Added explicit fail-closed rejection for `oh_professional`:
  ```typescript
  if (user.role === 'oh_professional') {
    throw new Error(
      `Unauthorized: oh_professional user ${requestingUserId} is not permitted to query general-purpose declaration lists. Access incident records via the OH coordination workflow.`,
    );
  }
  ```
- **Lines 988–992 (`getDeclarationsByStatus`):**
  Added explicit fail-closed rejection for `oh_professional`:
  ```typescript
  if (user.role === 'oh_professional') {
    throw new Error(
      `Unauthorized: oh_professional user ${requestingUserId} is not permitted to query declarations by status. Access incident records via the OH coordination workflow.`,
    );
  }
  ```
- **Lines 1828–1849 (`getDeclarationForCoordinationInternal`):**
  Implemented safe coordination-scoped declaration retriever:
  ```typescript
  async getDeclarationForCoordinationInternal(
    coordination_id: number,
    requesting_user_id: number | null | undefined,
  ): Promise<AesDeclaration | null> {
    if (requesting_user_id === undefined || requesting_user_id === null) {
      throw new Error('Unauthorized: requesting user ID is required to access declaration via coordination.');
    }
    const user = await this.getDemoUser(requesting_user_id);
    if (!user) {
      throw new Error(`getDeclarationForCoordinationInternal: requesting user ${requesting_user_id} not found`);
    }
    if (user.role !== 'oh_professional') {
      throw new Error(
        `Unauthorized: role ${user.role} is not permitted to access declaration via OH coordination internal path.`,
      );
    }
    const coord = (await this.getOhCoordinationById(coordination_id, requesting_user_id)) as OhCoordination | null;
    if (!coord) {
      return null;
    }
    return this.getDeclarationByIdInternal(coord.declaration_id);
  }
  ```

### 2. `src/features/aes-guardian/__tests__/oh-coordination-workflow.test.ts`
- Added a dedicated 10-property test suite:
  `describe('Phase 2E.1.4.2A: OH Declaration Retrieval Authorization Hardening', ...)`
  exercising all authorization constraints and fail-closed behaviors.

### 3. `src/core/database/__tests__/notifications.test.ts`
- Updated legacy test expecting unrestricted OH `getDeclarationById` access to assert that `oh_professional` is rejected from direct declaration retrieval and must access records via coordination.

### 4. `src/core/database/__tests__/notification-workflow-hardening.test.ts`
- Updated legacy test expecting unrestricted OH `getDeclarationById` access to assert that `oh_professional` is rejected from direct declaration retrieval and must access records via coordination.

---

## 5. Verification & Test Evidence

### 1. Ten Required Authorization Properties
All 10 properties mandated by the Phase 2E.1.4.2A specification were explicitly implemented and passed:

1. **Property 1:** `oh_professional` cannot call `getDeclarations()` or `getDeclarationsByStatus()` (rejects with `Unauthorized`).
2. **Property 2:** `oh_professional` cannot retrieve an arbitrary declaration through `getDeclarationById()` (rejects with `Unauthorized`).
3. **Property 3:** `exposed_professional` still retrieves only their own declarations (both in list and detail).
4. **Property 4:** `admin_reviewer` retains authorized hospital-wide declaration retrieval (list, detail, byStatus).
5. **Property 5:** `quality_staff` remains denied across `getDeclarations()`, `getDeclarationsByStatus()`, and `getDeclarationById()`.
6. **Property 6:** `tech_admin` remains denied across `getDeclarations()`, `getDeclarationsByStatus()`, and `getDeclarationById()`.
7. **Property 7:** The authorized OH coordination queue (`listOhCoordinationsQueue`) remains fully functional for `oh_professional`.
8. **Property 8:** An OH professional can retrieve the declaration associated with an authorized coordination via `getDeclarationForCoordinationInternal(coordId, ohUserId)`.
9. **Property 9:** An OH professional cannot use `getDeclarationForCoordinationInternal` to retrieve an unrelated declaration or pass an invalid/non-existent coordination ID.
10. **Property 10:** Missing, null, or invalid identities fail closed across all retrieval methods.

### 2. Test Execution Results
- **OH Coordination Workflow Suite:**
  ```text
  PASS src/features/aes-guardian/__tests__/oh-coordination-workflow.test.ts
  Test Suites: 1 passed, 1 total
  Tests:       50 passed, 50 total
  Time:        4.94 s
  ```
- **Notification & Hardening Suites:**
  ```text
  PASS src/core/database/__tests__/notifications.test.ts
  PASS src/core/database/__tests__/notification-workflow-hardening.test.ts
  Test Suites: 2 passed, 2 total
  Tests:       82 passed, 82 total
  Time:        6.631 s
  ```
- **Entire Repository Jest Suite:**
  ```text
  Test Suites: 44 passed, 44 total
  Tests:       909 passed, 909 total
  Snapshots:   0 total
  Time:        24.542 s
  ```

### 3. TypeScript Compilation
A project-wide `tsc --noEmit` audit filtered for `src/features/aes-guardian` and `src/core/database` returned:
```text
Relevant errors count: 0
Zero relevant errors in aes-guardian and database!
```

---

## 6. Git Integrity Check

- **Working Tree:**
  - Branch: `migration/aes-guardian`
  - Current HEAD: `d79b01ef51646509170996f8c77517f95470f217`
  - No commits, resets, stashes, or branches created.
  - All existing untracked files and pre-existing modifications preserved intact.

---

## 7. Status & Readiness for Batch 4 UI Implementation

With the completion of Phase 2E.1.4.2A:
1. The OH professional declaration access vulnerability is closed.
2. The repository authorization model aligns with the core architectural requirements.
3. Batch 4 UI implementation has **not** been started and remains blocked until explicit user authorization.
