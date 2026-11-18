# AES Guardian — Phase 2E.1.6.0.1
# OH Queue Completed-Status Retrieval Capability Audit

**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**Expected HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Actual HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Database Schema:** Version 8  
**Phase Type:** READ-ONLY TARGETED REPOSITORY AUDIT  
**Date:** 2026-11-15  

---

## 1. Executive Summary

This targeted repository audit resolves whether the existing occupational-health (OH) coordination queue can safely display `completed` coordination records, as required by the Master UI Implementation Blueprint (Section 7.1), without weakening repository authorization, violating medical confidentiality, or miscounting active records in downstream components.

### Core Conclusions
1. **Current Behavior (`VERIFIED IN SOURCE`):** `listOhCoordinationsQueue` hardcodes `WHERE c.status IN ('pending_acknowledgement', 'acknowledged')`. Completed (`completed`) and cancelled (`cancelled`) records are structurally excluded from the returned query result.
2. **Authorization & Security (`VERIFIED BY TEST`):** An `oh_professional` is already fully authorized to retrieve completed coordination records and their complete follow-up event history via `getOhCoordinationById` and `getOhFollowUpEvents` (`src/features/aes-guardian/__tests__/oh-coordination-workflow.test.ts:577-587`). Exposing completed records in the OH queue creates **zero** privilege escalation or confidentiality risk.
3. **Data Minimization (`VERIFIED IN SOURCE`):** The projection returned by `listOhCoordinationsQueue` contains only coordination metadata (`id`, `declaration_id`, `status`, timestamps, and referencing IDs) plus joined `declaration_reference` and `creator_name`. It contains no clinical diagnosis, medical notes, or patient identifiers.
4. **Downstream Invariant (`VERIFIED IN SOURCE`):** `AesGuardianWorkspaceScreen.tsx` (line 157) calls `db.listOhCoordinationsQueue(activeContext.userId)` to display the badge `${stats.ohQueueCount} ${t('workspace.badgeActive')}`. Unconditionally returning completed records would corrupt this active count.
5. **Recommended Decision (`PROPOSED`):** Implement **Option B** (extend `listOhCoordinationsQueue` with an optional, backward-compatible filter parameter defaulting to active-only) via a dedicated, narrowly scoped repository enhancement phase (`Phase 2E.1.6.0.2`) prior to UI Batch 6 implementation.

---

## 2. Preflight & Working Tree Verification

- **Repository Path:** `C:\Users\User\Desktop\sure\sanad-rn-migration` (`VERIFIED IN SOURCE`)
- **Git Branch:** `migration/aes-guardian` (`VERIFIED IN SOURCE`)
- **Git Commit (HEAD):** `d79b01ef51646509170996f8c77517f95470f217` (`VERIFIED IN SOURCE`)
- **Database Schema Version:** Version 8 (`VERIFIED IN SOURCE: src/core/database/types.ts`)
- **Original SANAD Repository:** Untouched at `C:\Users\User\Desktop\sure\sanad` (`VERIFIED IN SOURCE`)
- **Pre-existing Working Tree State:** Exactly 47 modified and untracked files preserved without alteration (`VERIFIED IN SOURCE`).

---

## 3. Inspection of `listOhCoordinationsQueue`

### 3.1 Implementation Details (`VERIFIED IN SOURCE`)
- **File:** `src/core/database/AesGuardianDatabase.ts` (lines 1946–1977)
- **Signature:**
  ```typescript
  async listOhCoordinationsQueue(
    requesting_user_id: number | null | undefined,
  ): Promise<OhCoordination[]>
  ```
- **Persisted-User & Role Validation:**
  ```typescript
  if (requesting_user_id === null || requesting_user_id === undefined) {
    throw new Error('User context required to view OH coordination queue');
  }

  const userRes = await this.db.execute(
    'SELECT id, role, is_active FROM demo_users WHERE id = ?;',
    [requesting_user_id]
  );
  if (userRes.rows.length === 0) {
    throw new Error(`User not found: ${requesting_user_id}`);
  }

  const user = userRes.rows[0];
  if (user.role !== 'oh_professional') {
    throw new Error(`Unauthorized: User with role '${user.role}' cannot view OH coordination queue`);
  }
  ```
  The method enforces strict fail-closed authorization:
  - Fails if `requesting_user_id` is `null` or `undefined`.
  - Fails if user does not exist in `demo_users`.
  - Fails if `user.role !== 'oh_professional'`. All other roles (`admin_reviewer`, `exposed_professional`, `quality_staff`, `tech_admin`) are strictly rejected.

- **Executed SQL Query:**
  ```sql
  SELECT c.*, d.reference_number AS declaration_reference,
         u.display_name AS creator_name
  FROM oh_coordinations c
  LEFT JOIN aes_declarations d ON d.id = c.declaration_id
  LEFT JOIN demo_users u ON u.id = c.created_by_user_id
  WHERE c.status IN ('pending_acknowledgement', 'acknowledged')
  ORDER BY c.created_at ASC;
  ```

### 3.2 Returned Projection Analysis (`VERIFIED IN SOURCE`)
The query returns `OhCoordination` entities augmented with two non-sensitive fields:
- `c.*`:
  - `id`: number (primary key)
  - `declaration_id`: number (foreign key to `aes_declarations`)
  - `created_by_user_id`: number (foreign key to `demo_users`)
  - `coordination_reason`: `OhCoordinationReason` (`'routine_followup'`, `'serology_monitoring'`, `'specialized_evaluation'`, `'other_coordination'`)
  - `status`: `OhCoordinationStatus`
  - `acknowledged_by_user_id`: number | null
  - `acknowledged_at`: string | null
  - `completed_by_user_id`: number | null
  - `completed_at`: string | null
  - `created_at`: string
  - `updated_at`: string
- `declaration_reference`: string (e.g. `'AES-2025-00108'`)
- `creator_name`: string (e.g. `'Fatima Zahra El Amrani'`)

**Data Minimization Assessment (`VERIFIED IN SOURCE`):**  
The projected row contains **zero** clinical notes, medical descriptions, exposure severity indicators, patient names, or medical diagnoses. It contains only administrative and routing metadata sufficient to populate queue summary cards.

---

## 4. Status Behavior & Blueprint Requirements

### 4.1 Current Status Filtering (`VERIFIED IN SOURCE`)
- Supported statuses returned: strictly `'pending_acknowledgement'` and `'acknowledged'`.
- Excluded statuses: `'completed'` and `'cancelled'`.
- Supported parameters: none (only `requesting_user_id`).

### 4.2 Exclusion Rationale (`DOCUMENTED DESIGN DECISION`)
1. **Operational Inbox Concept (Phase 2C.4):** When implemented in Phase 2C.4, `listOhCoordinationsQueue` was designed as an active task inbox ("pending and acknowledged coordination records awaiting action").
2. **Database Partial Index (`VERIFIED IN SOURCE: src/core/database/AesGuardianDatabase.ts:329`):**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_oh_coord_active_per_decl
     ON oh_coordinations(declaration_id)
     WHERE status IN ('pending_acknowledgement', 'acknowledged');
   ```
   The database schema explicitly defines "active" coordinations as records where `status IN ('pending_acknowledgement', 'acknowledged')`. Once a coordination transitions to `'completed'`, it becomes historical/closed.
3. **Demo Scenario Seeding (`VERIFIED IN SOURCE: src/core/database/AesGuardianDatabase.ts:3439-3466`):**
   The database seeder seeds `AES-2026-DEMO-04` as a closed incident with a `'completed'` OH coordination record (`serology_monitoring`) and follow-up events. Under the current query, this seeded record is **never returned** by `listOhCoordinationsQueue`.

### 4.3 Blueprint Scope Requirement (`DOCUMENTED DESIGN DECISION`)
Master UI Implementation Blueprint Section 7.1 (`docs/AES_GUARDIAN_UI_IMPLEMENTATION_BLUEPRINT.md:580-589`):
- Screen: `OhCoordinationQueueScreen.tsx`
- Layout: Three status tabs:
  - Tab 1: `[En attente de prise en charge]` (`pending_acknowledgement`)
  - Tab 2: `[Suivi en cours]` (`acknowledged`)
  - Tab 3: `[Suivi terminé]` (`completed`)
- Acceptance Criteria: Sub-100ms tab filtering, atomic acknowledgement.

Under the current repository implementation, Tab 3 (`[Suivi terminé]`) would permanently display an empty state because `listOhCoordinationsQueue` does not return completed records.

---

## 5. Downstream Caller Impact & Invariants

Inspection of all callers of `listOhCoordinationsQueue` reveals two direct screen consumers and four test suites:

### 5.1 Callers in Application Source (`VERIFIED IN SOURCE`)
1. **`OhCoordinationQueueScreen.tsx` (line 53):**
   ```typescript
   const queue = await db.listOhCoordinationsQueue(authContext.userId);
   setCoordinations(queue);
   ```
   Currently receives only active records and renders an un-tabbed flat list.

2. **`AesGuardianWorkspaceScreen.tsx` (lines 157 & 428):**
   ```typescript
   const ohQueue = await db.listOhCoordinationsQueue(activeContext.userId);
   ohQueueCount = ohQueue.length;
   // ...
   badge: `${stats.ohQueueCount} ${t('workspace.badgeActive')}`,
   ```
   **Critical Invariant (`VERIFIED IN SOURCE`):**  
   The workspace screen displays `stats.ohQueueCount` with the badge label `"actif"` / `"active"`. If `listOhCoordinationsQueue` unconditionally returns completed records, this badge count will increment with completed records, violating the "active" semantic badge.

### 5.2 Callers in Test Suites (`VERIFIED BY TEST`)
- `src/features/aes-guardian/__tests__/oh-coordination-workflow.test.ts`:
  - Line 431: Rejection of non-`oh_professional` roles (`admin_reviewer`, `exposed_professional`, `tech_admin`).
  - Line 785: Rejection of `null` and `undefined` user IDs.
  - Line 878: Verification of queue retrieval for `oh_professional`.
- `src/features/aes-guardian/__tests__/workspace-integration.test.ts`:
  - Line 323: Integration test verifying OH queue retrieval on workspace load.

---

## 6. Authorization & Security Boundary Evaluation

| Security / Privacy Dimension | Finding | Assessment |
| :--- | :--- | :--- |
| **OH Professional Authorization** | `oh_professional` is authorized to view completed records via `getOhCoordinationById(id, userId)` | **Zero risk (`VERIFIED BY TEST`)** |
| **Clinical Confidentiality** | `listOhCoordinationsQueue` projects only metadata; no clinical notes or patient PII | **Compliant (`VERIFIED IN SOURCE`)** |
| **Assignee Scope** | Schema v8 has no `assigned_to_user_id` column; all OH professionals share institutional queue | **Compliant (`VERIFIED IN SOURCE`)** |
| **Role-Based Access Control** | Strictly requires `user.role === 'oh_professional'`; fails closed for all other roles | **Enforced (`VERIFIED IN SOURCE`)** |
| **Cross-Tenant / Multi-Facility** | Single-tenant local/hospital SQLite store; no cross-facility leakage possible | **Compliant (`VERIFIED IN SOURCE`)** |
| **Privilege Escalation** | `oh_professional` already holds full clinical authority for OH coordination module | **No escalation (`VERIFIED IN SOURCE`)** |

---

## 7. Comparative Evaluation of Implementation Options

### Option A: Retain Active-Only Queue (No Repository Changes)
- **Mechanism:** Maintain `WHERE c.status IN ('pending_acknowledgement', 'acknowledged')`. In `OhCoordinationQueueScreen`, either omit Tab 3 (`[Suivi terminé]`) or display an empty state indicating historical records are accessible only from declaration details.
- **SQL Changes:** None.
- **Authorization Impact:** Unchanged.
- **Data Exposure:** None.
- **Backward Compatibility:** 100% compatible.
- **Risks & Drawbacks:** Direct deviation from Master UI Implementation Blueprint Section 7.1. Evaluators and occupational health doctors cannot review historical completed follow-ups from the queue. Seeded demo record `AES-2026-DEMO-04` remains invisible.

### Option B: Extend `listOhCoordinationsQueue` with Optional Filter (`RECOMMENDED`)
- **Mechanism:** Extend the method signature with an optional options argument:
  ```typescript
  export interface OhQueueFilterOptions {
    includeCompleted?: boolean;
    status?: OhCoordinationStatus | OhCoordinationStatus[];
  }

  async listOhCoordinationsQueue(
    requesting_user_id: number | null | undefined,
    options?: OhQueueFilterOptions,
  ): Promise<OhCoordination[]>
  ```
- **SQL Logic:**
  - If `options` is omitted (default):
    ```sql
    WHERE c.status IN ('pending_acknowledgement', 'acknowledged')
    ```
  - If `options.includeCompleted === true`:
    ```sql
    WHERE c.status IN ('pending_acknowledgement', 'acknowledged', 'completed')
    ```
  - If `options.status` is provided:
    ```sql
    WHERE c.status IN (...)
    ```
- **Terminal Status Handling:** `'cancelled'` remains excluded unless explicitly requested.
- **Caller Compatibility:**
  - `AesGuardianWorkspaceScreen.tsx` calls `db.listOhCoordinationsQueue(userId)` without options: returns active records only. Workspace badge count remains 100% accurate.
  - Existing tests pass with zero modification.
  - `OhCoordinationQueueScreen.tsx` calls `db.listOhCoordinationsQueue(userId, { includeCompleted: true })` and performs sub-100ms in-memory tab switching across the three tabs.
- **Risks & Mitigation:** Requires a narrowly scoped repository update prior to Batch 6 UI transformation.

### Option C: Add Dedicated Method `listCompletedOhCoordinations`
- **Mechanism:** Leave `listOhCoordinationsQueue` untouched and introduce a new repository method:
  ```typescript
  async listCompletedOhCoordinations(
    requesting_user_id: number | null | undefined,
  ): Promise<OhCoordination[]>
  ```
- **SQL Logic:**
  ```sql
  SELECT c.*, d.reference_number AS declaration_reference,
         u.display_name AS creator_name
  FROM oh_coordinations c
  LEFT JOIN aes_declarations d ON d.id = c.declaration_id
  LEFT JOIN demo_users u ON u.id = c.created_by_user_id
  WHERE c.status = 'completed'
  ORDER BY c.completed_at DESC;
  ```
- **Risks & Drawbacks:** Introduces duplicate SQL query structure, duplicate role validation routines, and forces `OhCoordinationQueueScreen` to orchestrate two parallel asynchronous network/database calls rather than a single unified dataset for tab filtering.

---

## 8. Comparative Matrix

| Criteria | Option A (Active Only) | Option B (Optional Filter) | Option C (Separate Method) |
| :--- | :--- | :--- | :--- |
| **Blueprint Tab 3 Fulfilled** | ❌ No (Tab 3 omitted/empty) | ✅ Yes | ✅ Yes |
| **Workspace Active Badge Preserved** | ✅ Yes | ✅ Yes (default parameter) | ✅ Yes |
| **Existing Tests Backward Compatible** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Single-Query Tab Filtering (<100ms)** | ❌ N/A | ✅ Yes | ❌ Requires 2 queries |
| **Code Duplication** | ✅ Zero | ✅ Zero (unified query) | ❌ High (duplicate SQL) |
| **Repository Modification Required** | ✅ No | ⚠️ Yes (Phase 2E.1.6.0.2) | ⚠️ Yes (Phase 2E.1.6.0.2) |
| **Security & Privacy Risk** | Zero | Zero | Zero |

---

## 9. Recommended Phasing & Implementation Plan

### Recommendation: Option B via Phase 2E.1.6.0.2
Because Phase 2E.1.6.0 and Phase 2E.1.6.0.1 are strictly **READ-ONLY AUDITS**, modifying `AesGuardianDatabase.ts` during this turn would violate the phase mandate.

The recommended sequential progression is:

```
[Phase 2E.1.6.0.1] (Current: Completed Read-Only Audit)
       │
       ▼
[Phase 2E.1.6.0.2] (Repository Enhancement: listOhCoordinationsQueue Filter Parameter & Tests)
       │
       ▼
[Phase 2E.1.6.1]   (Batch 6 UI Implementation: 4 Screens including 3-Tab OhCoordinationQueueScreen)
```

### Scope for Phase 2E.1.6.0.2 (`PROPOSED`):
1. **Repository Enhancement:**
   - Define `OhQueueFilterOptions` interface in `src/core/database/types.ts` and `AesGuardianDatabase.ts`.
   - Update `listOhCoordinationsQueue(requesting_user_id, options?: OhQueueFilterOptions)` to support `{ includeCompleted?: boolean }` and `{ status?: OhCoordinationStatus[] }`, defaulting to `['pending_acknowledgement', 'acknowledged']`.
2. **Dedicated Unit Tests (`oh-coordination-workflow.test.ts`):**
   - Verify default invocation returns only active records (`pending_acknowledgement`, `acknowledged`).
   - Verify `includeCompleted: true` returns active and completed records.
   - Verify non-`oh_professional` roles are still rejected.
   - Verify `cancelled` records remain excluded unless explicitly specified.
3. **Run Regression Suites:**
   - Run `oh-coordination-workflow.test.ts`, `workspace-integration.test.ts`, and core database tests.

---

## 10. Audit Sign-Off & Verification Evidence

- [x] Preflight checks verified (branch, HEAD, schema v8, git status).
- [x] All 47 pre-existing modified/untracked files preserved.
- [x] Original SANAD repository untouched.
- [x] `listOhCoordinationsQueue` source inspected.
- [x] Caller impact analyzed (`AesGuardianWorkspaceScreen` badge invariant identified).
- [x] Security and clinical confidentiality boundaries verified.
- [x] Options A, B, and C evaluated with trade-off matrix.
- [x] Phased roadmap established.
- [x] Zero application code, test, schema, navigation, localization, or theme changes introduced.

---
*Report compiled autonomously under Phase 2E.1.6.0.1 specifications.*
