# AES GUARDIAN — PHASE 2D.2C.3.2 IMPLEMENTATION & VERIFICATION REPORT
## Exposed OH Projection Minimization & Administrative List Authorization Closure

**Date:** 2026-11-13  
**Project:** AES Guardian  
**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**Base HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Schema Version:** Version 8  
**Execution Policy:** Code-first. No emulator. No commits, staging, pushes, resets, or destructive Git operations. Original SANAD repository remains untouched.

---

## 1. Executive Summary

Phase 2D.2C.3.2 resolves the two remaining repository authorization and data-minimization concerns identified during the Phase 2D.2C.3.1 audit:

1. **Exposed-Professional Projection Minimization:**
   - Previously, the `exposed_professional` projection retained `coordination_reason` and `created_by_user_id`, and nulled `acknowledged_at` and `completed_at`.
   - In Phase 2D.2C.3.2, `getOhCoordinationById` and `getOhCoordinationByDeclaration` have been updated to return a genuinely minimal status-only projection defined by `ExposedOhCoordinationSummary`.
   - The returned object strictly contains **only** `id`, `declaration_id`, `status`, `created_at`, and `updated_at`.
   - Sensitive clinical and administrative fields (`coordination_reason`, `created_by_user_id`, `acknowledged_at`, `completed_at`, `acknowledged_by_user_id`, `completed_by_user_id`, `events`, `notes`, and internal staff identities) are **completely omitted from the object structure**, rather than merely nulled.
   - Strict declaration ownership validation is enforced: an exposed professional can only retrieve coordination records associated with their own declaration; attempts to retrieve other professionals' coordinations fail closed with descriptive authorization errors.

2. **Administrative List Authorization Hardening:**
   - `listOhCoordinationsForAdmin` has been hardened with strict fail-closed identity and role validation.
   - Missing identity (`undefined`), null identity (`null`), and non-existent user IDs (`99999`) immediately throw fail-closed authorization errors.
   - Demanded role `admin_reviewer` is verified against `demo_users`. All other roles (`exposed_professional`, `oh_professional`, `quality_staff`, `tech_admin`) are rejected.
   - Returned coordination items project administrative oversight details (`declaration_reference`, `coordination_reason`, `status`, milestone timestamps) while strictly shielding internal OH personnel IDs (`acknowledged_by_user_id: null`, `completed_by_user_id: null`) and completely omitting private follow-up events and notes.

3. **Coordination Queue Role Hardening:**
   - `listOhCoordinationsQueue` has been hardened with fail-closed identity checks (`undefined`, `null`, non-existent IDs) and strictly enforces the `oh_professional` role.

---

## 2. Canonical Authorization & Data Minimization Matrix

| Role | Identifiable Declarations | OH Coordination Retrieval | Follow-Up Events / Private Clinical Notes | Administrative Coordination List |
|---|---|---|---|---|
| **exposed_professional** | Own declarations only | **Minimal Status-Only Projection** (`ExposedOhCoordinationSummary`: `id`, `declaration_id`, `status`, `created_at`, `updated_at`). All reasons, notes, staff IDs, and milestone timestamps omitted. Strictly ownership-scoped. | **PROHIBITED** (fail-closed exception) | **PROHIBITED** (fail-closed exception) |
| **admin_reviewer** | Authorized review access | **Administrative Oversight Projection** (`AdminOhCoordinationSummary`: reasons, milestone timestamps preserved; staff IDs shielded as `null`; events/notes omitted). | **PROHIBITED** (fail-closed exception) | **PERMITTED** (`listOhCoordinationsForAdmin`: scoped to created coordinations, shielded staff IDs) |
| **oh_professional** | Referred/authorized declarations only | **Full Authorized Coordination** (`OhCoordination`: all fields, internal staff IDs, milestones). | **PERMITTED** (`getOhFollowUpEvents`) | **PROHIBITED** (must use `listOhCoordinationsQueue`) |
| **quality_staff** | **PROHIBITED** (de-identified aggregates only) | **PROHIBITED** (fail-closed exception) | **PROHIBITED** (fail-closed exception) | **PROHIBITED** (fail-closed exception) |
| **tech_admin** | **PROHIBITED** (system maintenance only) | **PROHIBITED** (fail-closed exception) | **PROHIBITED** (fail-closed exception) | **PROHIBITED** (fail-closed exception) |

---

## 3. Detailed Code Modifications

### 3.1 Data Types (`src/core/database/types.ts`, `src/core/database/index.ts`, `src/core/index.ts`)

Added formal interfaces distinguishing minimal exposed projections from administrative oversight projections:

```typescript
/**
 * Minimal status-only coordination projection for exposed professionals.
 * Genuinely omits coordination_reason, created_by_user_id, milestone timestamps,
 * internal OH staff identifiers, notes, and events.
 */
export interface ExposedOhCoordinationSummary {
  id: number;
  declaration_id: number;
  status: OhCoordinationStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Administrative oversight coordination projection for admin reviewers.
 * Preserves milestone timestamps and coordination reason for administrative tracking,
 * but shields internal OH staff identifiers (null) and omits private clinical notes/events.
 */
export interface AdminOhCoordinationSummary {
  id: number;
  declaration_id: number;
  created_by_user_id: number;
  coordination_reason: OhCoordinationReason;
  status: OhCoordinationStatus;
  acknowledged_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  declaration_reference?: string;
  acknowledged_by_user_id?: null;
  completed_by_user_id?: null;
}
```

### 3.2 Repository Hardening (`src/core/database/AesGuardianDatabase.ts`)

#### 3.2.1 `getOhCoordinationById` & `getOhCoordinationByDeclaration`
- Verified fail-closed identity: `undefined` or `null` requesting user IDs throw `'Unauthorized: requesting user ID is required to access coordination data'`.
- Verified user existence in `demo_users`.
- Strictly enforced `exposed_professional` declaration ownership and minimal projection:
```typescript
if (user.role === 'exposed_professional') {
  const declResult = await this.db.query<AesDeclaration>(
    `SELECT * FROM aes_declarations WHERE id = ?`,
    [coord.declaration_id],
  );
  if (declResult.rows.length === 0 || declResult.rows[0].declared_by_user_id !== requesting_user_id) {
    throw new Error(
      'getOhCoordinationById: exposed_professional may only view coordination for their own declaration',
    );
  }
  // Return minimal status-only projection (unauthorized fields completely omitted)
  const exposedSummary: ExposedOhCoordinationSummary = {
    id: coord.id,
    declaration_id: coord.declaration_id,
    status: coord.status,
    created_at: coord.created_at,
    updated_at: coord.updated_at,
  };
  return exposedSummary;
}
```

#### 3.2.2 `listOhCoordinationsForAdmin`
- Added explicit parameter validation and role checks:
```typescript
async listOhCoordinationsForAdmin(
  requesting_user_id: number,
): Promise<AdminOhCoordinationSummary[]> {
  if (requesting_user_id === undefined || requesting_user_id === null) {
    throw new Error('Unauthorized: requesting user ID is required to list coordinations');
  }
  const userResult = await this.db.query<DemoUser>(
    `SELECT * FROM demo_users WHERE id = ?`,
    [requesting_user_id],
  );
  if (userResult.rows.length === 0) {
    throw new Error(`listOhCoordinationsForAdmin: requesting user ${requesting_user_id} not found`);
  }
  const user = userResult.rows[0];
  if (user.role !== 'admin_reviewer') {
    throw new Error(
      `listOhCoordinationsForAdmin: unauthorized — requires admin_reviewer, got ${user.role}`,
    );
  }
  // Query filtered by admin reviewer creator
  const result = await this.db.query<any>(
    `SELECT c.*, d.reference_number AS declaration_reference
     FROM oh_coordinations c
     JOIN aes_declarations d ON d.id = c.declaration_id
     WHERE c.created_by_user_id = ?
     ORDER BY c.created_at DESC`,
    [requesting_user_id],
  );
  // Shield internal OH personnel IDs
  return result.rows.map((row) => ({
    id: row.id,
    declaration_id: row.declaration_id,
    created_by_user_id: row.created_by_user_id,
    coordination_reason: row.coordination_reason,
    status: row.status,
    acknowledged_at: row.acknowledged_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    declaration_reference: row.declaration_reference,
    acknowledged_by_user_id: null,
    completed_by_user_id: null,
  }));
}
```

#### 3.2.3 `listOhCoordinationsQueue`
- Enforces fail-closed identity: `undefined` or `null` requesting user IDs throw `'Unauthorized: requesting user ID is required to list OH queue'`.
- Enforces role `oh_professional`: rejects any other role with `'listOhCoordinationsQueue: unauthorized — requires oh_professional, got ${user.role}'`.

### 3.3 UI Screen Alignment
- `DeclarationCoordinationStatusScreen.tsx`: State typing updated to `OhCoordination | ExposedOhCoordinationSummary | null` to seamlessly consume the minimal status-only projection.
- `OhCoordinationDetailScreen.tsx`: Explicitly typed coordination state to ensure type safety without leaking exposed projection fields to admin reviewers or OH professionals.

---

## 4. Complete Inventory of Coordination Retrieval Paths

| Method | Permitted Roles | Projection Type | Shielded / Omitted Fields | Denied Roles (Fail Closed) | Missing / Null ID Handling |
|---|---|---|---|---|---|
| `getOhCoordinationById(id, requestingUserId)` | `oh_professional`<br>`admin_reviewer`<br>`exposed_professional` (own) | `oh_professional`: `OhCoordination`<br>`admin_reviewer`: `OhCoordination` (shielded IDs)<br>`exposed_professional`: `ExposedOhCoordinationSummary` | For `exposed_professional`: `coordination_reason`, `created_by_user_id`, staff IDs, milestones omitted.<br>For `admin_reviewer`: `acknowledged_by_user_id: null`, `completed_by_user_id: null`. | `quality_staff`<br>`tech_admin`<br>`exposed_professional` (other users' declarations) | Throws `Unauthorized: requesting user ID is required` |
| `getOhCoordinationByDeclaration(declId, requestingUserId)` | `oh_professional`<br>`admin_reviewer`<br>`exposed_professional` (own) | Same as `getOhCoordinationById` | Same as `getOhCoordinationById` | `quality_staff`<br>`tech_admin`<br>`exposed_professional` (other users' declarations) | Throws `Unauthorized: requesting user ID is required` |
| `listOhCoordinationsQueue(requestingUserId)` | `oh_professional` | Queue projection (`declaration_reference`, pending and acknowledged coordinations) | Unreferred/cancelled records filtered | `admin_reviewer`<br>`exposed_professional`<br>`quality_staff`<br>`tech_admin` | Throws `Unauthorized: requesting user ID is required` |
| `listOhCoordinationsForAdmin(requestingUserId)` | `admin_reviewer` | `AdminOhCoordinationSummary[]` | `acknowledged_by_user_id: null`<br>`completed_by_user_id: null`<br>Events & notes omitted | `oh_professional`<br>`exposed_professional`<br>`quality_staff`<br>`tech_admin` | Throws `Unauthorized: requesting user ID is required` |
| `getOhFollowUpEvents(coordId, requestingUserId)` | `oh_professional` | `OhFollowUpEvent[]` (chronological) | N/A | `admin_reviewer`<br>`exposed_professional`<br>`quality_staff`<br>`tech_admin` | Throws `Unauthorized: requesting user ID is required` |

---

## 5. Verification & Test Evidence

### 5.1 Native SQLite Adapter Test Suite (`notification-workflow-hardening.test.ts`)
- **Suite Result:** PASS (49 tests, 0 failures).
- **Remediation F Test Coverage:**
  - `oh_professional` retrieves full coordination details including internal staff IDs.
  - `admin_reviewer` receives data-minimized projection (milestones visible, internal OH staff IDs nulled).
  - `admin_reviewer` in `listOhCoordinationsForAdmin` shields internal OH staff IDs and strictly enforces `admin_reviewer` role.
  - Non-admin roles (`exposed_professional`, `oh_professional`, `quality_staff`, `tech_admin`) rejected by `listOhCoordinationsForAdmin`.
  - Missing identities (`undefined`, `null`, `99999`) fail closed in `listOhCoordinationsForAdmin`.
  - `listOhCoordinationsQueue` strictly enforces `oh_professional` role and fails closed on missing/null/invalid identities.
  - `exposed_professional` retrieves genuinely minimal status-only projection:
    - `Object.keys(coord)` is strictly `['created_at', 'declaration_id', 'id', 'status', 'updated_at']`.
    - `coordination_reason`, `created_by_user_id`, `acknowledged_at`, `completed_at`, `acknowledged_by_user_id`, `completed_by_user_id`, `events`, `notes` are verified absent.
    - Declaration ownership check: other exposed professionals rejected.
  - `getOhCoordinationByDeclaration` applies identical minimal projection and ownership restrictions.
  - `quality_staff` and `tech_admin` completely denied from coordination retrieval.

### 5.2 Domain & Workflow Test Suite (`oh-coordination-workflow.test.ts`)
- **Suite Result:** PASS (39 tests, 0 failures).
- Verified full coordination lifecycle, role blocks, data minimization projections, and fail-closed identity handling in domain unit tests.

### 5.3 Full Repository Test Suite
- **Suites:** 36 passed, 36 total.
- **Tests:** 549 passed, 549 total, 0 failures.
- **Duration:** 25.175 s.

### 5.4 TypeScript Compilation Check
- Executed `npx tsc --noEmit --skipLibCheck --jsx react-jsx --esModuleInterop` on all files in `src/core` and `src/features/aes-guardian`.
- **Result:** Exit code 0, 0 type errors.

---

## 6. Execution Safety & Boundary Compliance

- **No Emulator:** All validations executed via Jest native SQLite tests, mock SQLite tests, and TypeScript compiler checks.
- **No Git Mutations:** No commits, staging, pushes, resets, or cleans were executed. HEAD remains at `d79b01ef51646509170996f8c77517f95470f217`.
- **Original SANAD Repository:** `C:\Users\User\Desktop\sure\sanad-rn` remains completely untouched.
- **Strict Scope:** Phase 2D.2D (demo seeding), notification localization, and UI redesign remain strictly out of scope and unstarted.

---

## 7. Milestone Status

Phase 2D.2C.3.2 is **COMPLETE**.  
The AES Guardian repository authorization architecture and data minimization boundaries are fully fail-closed, robustly tested, and ready for milestone sign-off.
