# AES GUARDIAN — PHASE 2E.1.4.1
# BATCH 4 SECURITY, AUTHORIZATION & SCOPE RECONCILIATION REPORT

**Project:** AES Guardian  
**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**Verified HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Database Schema:** Version 8  
**Phase Status:** Phase 2E.1.4.1 — Security, Authorization & Scope Reconciliation Complete  
**Execution Boundary:** **READ-ONLY INSPECTION & RECONCILIATION — NO IMPLEMENTATION PERFORMED**

---

## 1. Repository Integrity Gate

Prior to beginning this reconciliation audit, the physical Git repository was verified:

- **Branch:** `migration/aes-guardian` [`VERIFIED IN SOURCE`]
- **HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217` [`VERIFIED IN SOURCE`]
- **Working Tree:** All 35 pre-existing modified files and 39 untracked documentation/test artifacts are preserved exactly as found.
- **SANAD Core Repository:** Completely untouched [`VERIFIED IN SOURCE`].
- **Code Modifications:** Exactly zero (0) application code, test, migration, or navigation files were modified during this phase.

```bash
$ git rev-parse --abbrev-ref HEAD
migration/aes-guardian

$ git rev-parse HEAD
d79b01ef51646509170996f8c77517f95470f217
```

---

## 2. Actual Source Paths & Relevant Repository Methods

This audit inspected the actual implementation files governing declaration management, occupational health coordination, audit logging, status color tokens, and navigation:

| Domain | Source File Path | Key Methods / Exports Inspected |
|---|---|---|
| **Declarations** | `src/core/database/AesGuardianDatabase.ts` | `getDeclarations` (lines 901–952), `getDeclarationById` (lines 871–899), `deleteAesDeclaration` (lines 992–997), `submitDeclaration` (lines 805–851) |
| **OH Coordination** | `src/core/database/AesGuardianDatabase.ts` | `getOhCoordinationByDeclaration` (lines 1811–1897), `getOhCoordinationById` (lines 1722–1808), `listOhCoordinationsQueue` (lines 1903–1934), `getOhFollowUpEvents` (lines 2099–2135) |
| **Audit Logging** | `src/core/database/AesGuardianDatabase.ts` | `logAuditEvent` (lines 1436–1451), `listAuditEvents` (lines 1453–1459) |
| **Audit Logger Wrapper** | `src/core/audit/AuditLogger.ts` | `logAuditEvent` (lines 56–66), `listRecentAuditEvents` (lines 68–73) |
| **Declaration Screens** | `src/features/aes-guardian/screens/DeclarationListScreen.tsx`<br>`src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx` | All queries, route parameters, contextual actions, banners, and tab placeholders |
| **Status Tokens** | `src/theme/tokens/aesColors.ts`<br>`src/theme/tokens/aesTheme.ts` | `aesDeclarationStatusColors`, `aesOhCoordinationStatusColors`, `aesCapaStatusColors`, `getAesStatusBadgeColors` |
| **Navigation & Routes** | `src/navigation/AppNavigator.tsx`<br>`src/navigation/routes.ts` | `declarations`, `newDeclaration`, `declarationDetails`, `ohCoordinationQueue`, `ohCoordinationDetail` |

---

## 3. Occupational Health (OH) Professional Declaration Access

### 3.1 Observed Repository Behavior vs. Target Policy

The target authorization policy for declaration access is defined as follows:

| Role | Target Policy | Actual Repository Behavior | Evaluation | Evidence Label |
|---|---|---|---|---|
| `exposed_professional` | Own declarations only (`declared_by_user_id = requestingUserId`) | `AesGuardianDatabase.ts` lines 928–935: Enforces `WHERE declared_by_user_id = ?`. Throws `Unauthorized` if `userId !== requestingUserId`. | **Fully Enforced** | `VERIFIED IN SOURCE`<br>`VERIFIED BY TEST` |
| `admin_reviewer` | Hospital-wide administrative access | `AesGuardianDatabase.ts` lines 947–951: Executes `SELECT * FROM aes_declarations ORDER BY created_at DESC LIMIT ?`. | **Fully Enforced** | `VERIFIED IN SOURCE`<br>`VERIFIED BY TEST` |
| `oh_professional` | **No unrestricted declaration list**; must enter via OH coordination queue and retrieve details only through an authorized coordination path | `getDeclarations()` (lines 947–951): Executes hospital-wide `SELECT * FROM aes_declarations` with **no row-scoping** to coordinations.<br>`getDeclarationById()` (lines 889–898): Returns declaration for **any arbitrary ID** without checking if a coordination exists. | **CRITICAL GAP** — Unrestricted hospital-wide access permitted in code. | `VERIFIED IN SOURCE` |
| `quality_staff` | No identifiable declaration access | `AesGuardianDatabase.ts` line 918: Throws `Unauthorized: quality_staff user ... is strictly prohibited from accessing identifiable declaration content.` | **Fully Enforced** | `VERIFIED IN SOURCE`<br>`VERIFIED BY TEST` |
| `tech_admin` | No operational declaration access | `AesGuardianDatabase.ts` line 913: Throws `Unauthorized: tech_admin user ... is strictly prohibited from accessing clinical declaration content.` | **Fully Enforced** | `VERIFIED IN SOURCE`<br>`VERIFIED BY TEST` |

### 3.2 Analysis of the OH Authorization Defect

1. **Absence of Assignment Column:** Direct inspection of SQLite schema v8 (`types.ts` lines 362–394, `AesGuardianDatabase.ts` lines 309–325) confirms that **no `assigned_to_user_id` column exists in the `oh_coordinations` table**. Columns are strictly: `id`, `declaration_id`, `created_by_user_id`, `coordination_reason`, `status`, `acknowledged_by_user_id`, `acknowledged_at`, `completed_by_user_id`, `completed_at`, `created_at`, `updated_at`.
2. **Declaration List Defect:** In `DeclarationListScreen.tsx` line 43, `userId: activeContext.role === 'exposed_professional' ? activeContext.userId : undefined` is passed. For `oh_professional`, `userId` is `undefined`, triggering lines 947–951 of `AesGuardianDatabase.ts` (`SELECT * FROM aes_declarations`), exposing all hospital incidents.
3. **Declaration Details Defect:** In `getDeclarationById(id, requestingUserId)` lines 869–898, `oh_professional` is granted blanket access:
   ```typescript
   // Lines 889-898:
   const decl = await this.getDeclarationByIdInternal(id);
   if (!decl) return null;
   if (user.role === 'exposed_professional' && decl.declared_by_user_id !== requestingUserId) {
     throw new Error(...);
   }
   return decl; // oh_professional receives ANY declaration, even if not in OH coordination!
   ```
4. **Resolution Rule:** A client-side banner or consultative notice (*"Ce registre présente l'ensemble des déclarations..."*) **does not constitute authorization**. Under zero-trust architecture:
   - **`DeclarationListScreen` access for `oh_professional` MUST BE DEFERRED / BLOCKED.** The route must not be presented to or accessed by `oh_professional`.
   - **`DeclarationDetailsScreen` arbitrary access for `oh_professional` MUST BE DEFERRED.** OH professionals must access clinical cases strictly via `ohCoordinationDetail` (`OhCoordinationDetailScreen.tsx`), where access is keyed to an authorized coordination record via `db.getOhCoordinationById(coordinationId, requestingUserId)`.

---

## 4. Audit Timeline Authorization & Data Minimization

### 4.1 Inspection of `listAuditEvents`

`AesGuardianDatabase.ts` lines 1453–1459 implement audit retrieval:
```typescript
async listAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const result = await this.db.query<AuditEvent>(
    `SELECT * FROM audit_events ORDER BY occurred_at DESC LIMIT ?`,
    [limit],
  );
  return result.rows;
}
```

The persisted columns in `audit_events` (schema lines 124–132) are:
- `id` (INTEGER PK)
- `event_type` (TEXT)
- `user_id` (INTEGER FK demo_users)
- `entity_type` (TEXT)
- `entity_id` (INTEGER)
- `description` (TEXT)
- `occurred_at` (TEXT timestamp)

### 4.2 Security & Data Minimization Audit

1. **No User or Role Validation:** `listAuditEvents()` takes only `limit`. It does not accept `requestingUserId`. It performs zero identity checks and zero role authorization [`VERIFIED IN SOURCE`].
2. **Cross-Tenant & Cross-Declaration Leakage:** Calling `listAuditEvents()` executes an unscoped `SELECT * FROM audit_events`. It returns audit entries across all declarations, all CAPA prevention actions, and all system workflows [`VERIFIED IN SOURCE`].
3. **Sensitive Information Exposure:** The `description` field contains actor roles, reference codes, review decisions, and coordination markers (e.g., `"Declaration AES-2026-0001 submitted from details screen"`, `"Admin review submitted..."`, `"Coordination created..."`).
4. **Failure of Client-Side Filtering:** If `DeclarationDetailsScreen` calls `listAuditEvents()` and filters client-side (`events.filter(e => e.entity_id === declarationId)`), **the entire hospital audit trail has already been transmitted to client memory**. This is a severe data minimization violation.
5. **Role-by-Role Audit Visibility Matrix (Target vs. Actual):**

| Role | Target Policy for Declaration Audit Trail | Actual `listAuditEvents()` Behavior | Safety Status |
|---|---|---|---|
| `exposed_professional` | Audit events for own declaration only; actor roles visible; zero data from other declarations | Receives hospital-wide audit events for all declarations and actions | **UNSAFE — LEAKAGE** |
| `admin_reviewer` | Audit events for declarations eligible for administrative triage | Receives hospital-wide audit events without record scoping | **UNSAFE — UNSCOPED** |
| `oh_professional` | Only coordination milestones linked to active coordination | Receives hospital-wide audit events | **UNSAFE — OVERBROAD** |
| `quality_staff` | Anonymized audit summaries only; no identifiable incident logs | Receives identifiable user IDs and references | **UNSAFE — BLOCKED BY POLICY** |
| `tech_admin` | Schema and operational log access only; no clinical incident audit | Receives clinical declaration audit records | **UNSAFE — BLOCKED BY POLICY** |

6. **Conclusion on Tab Chronologie:** Tab Chronologie (`Screen 12.1`) cannot be safely implemented using the existing `listAuditEvents` method. Tab Chronologie is **`DEFERRED — AUTHORIZATION OR DATA-MINIMIZATION GAP`** until a dedicated, role-authorized repository method (`getDeclarationAuditEvents(declarationId, requestingUserId)`) is implemented and verified by tests. Local audit events must remain strictly separate from OH follow-up events [`DOCUMENTED DESIGN DECISION`].

---

## 5. Draft Deletion Authorization

### 5.1 Inspection of `deleteAesDeclaration`

`AesGuardianDatabase.ts` lines 992–997 implement declaration deletion:
```typescript
async deleteAesDeclaration(id: number): Promise<MutationResult> {
  return this.db.execute(
    `DELETE FROM aes_declarations WHERE id = ?`,
    [id],
  );
}
```

### 5.2 Ownership & Status Enforcement Findings

1. **Unconditional SQL Execution:** `deleteAesDeclaration(id)` executes `DELETE FROM aes_declarations WHERE id = ?` unconditionally [`VERIFIED IN SOURCE`].
2. **No Caller or Ownership Check:** The method does not take `requestingUserId`. It does not inspect `declared_by_user_id` [`VERIFIED IN SOURCE`].
3. **No Persisted-Status Check:** The method does not verify that `status === 'draft'`. If called with the ID of a `submitted`, `under_review`, or `closed` declaration, SQLite will permanently delete it (cascading or breaking foreign keys) [`VERIFIED IN SOURCE`].
4. **Actual Schema Ownership Column:** Direct inspection of SQLite schema v8 Migration 5 (`AesGuardianDatabase.ts` line 243) confirms that the actual persisted column is **`declared_by_user_id`** (REFERENCES `demo_users(id)`) [`VERIFIED IN SOURCE`].
5. **Zero Existing Callsites & Tests:** `deleteAesDeclaration` has zero callsites in `src/` and zero automated tests in `database.test.ts` [`VERIFIED IN SOURCE`].
6. **Required Atomic Repository Enforcement:**
   To safely support draft deletion, the repository must enforce both conditions atomically:
   ```sql
   DELETE FROM aes_declarations
   WHERE id = ? AND declared_by_user_id = ? AND status = 'draft';
   ```
   A screen-only check (`if (item.status === 'draft')`) is unacceptable under project safety standards.
7. **Conclusion on Draft Deletion:** Because `deleteAesDeclaration` lacks atomic ownership and status guards, draft deletion is classified as **`SAFE AFTER NARROW REPOSITORY CORRECTION`**. Swipe-to-delete must not be enabled until the repository method `deleteDraft(declarationId: number, requestingUserId: number)` is implemented and tested.

---

## 6. Status Badge WCAG Contrast Audit

Foreground and background hex pairs for every domain status were extracted from `src/theme/tokens/aesColors.ts` (lines 132–153). Contrast ratios were calculated using the exact piecewise sRGB relative luminance formula:

$$\begin{aligned}
C &= \begin{cases} 
\frac{C_{srgb}}{12.92} & C_{srgb} \le 0.04045 \\
\left(\frac{C_{srgb} + 0.055}{1.055}\right)^{2.4} & C_{srgb} > 0.04045 
\end{cases} \\
L &= 0.2126 R + 0.7152 G + 0.0722 B \\
\text{Ratio} &= \frac{L_{\text{lighter}} + 0.05}{L_{\text{darker}} + 0.05}
\end{aligned}$$

Every combination was audited against the normal-text threshold (**$\ge 4.5:1$**). React Native `fontSize: 14` is **not** treated as large text:

| Domain | Persisted Status | Foreground (Text) | Background | Calculated Ratio | WCAG 2.1 AA (≥ 4.5:1) | WCAG AAA (≥ 7.0:1) | Status |
|---|---|---|---|---|---|---|---|
| **`aesDecl`** | `draft` | `#616161` | `#EEEEEE` | **5.34 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| **`aesDecl`** | `submitted` | `#1565C0` | `#E3F2FD` | **5.03 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| **`aesDecl`** | `under_review` | `#B24100` | `#FFF3E0` | **5.25 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| **`aesDecl`** | `correction_requested` | `#BF360C` | `#FBE9E7` | **4.78 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| **`aesDecl`** | `resubmitted` | `#6A1B9A` | `#F3E5F5` | **7.75 : 1** | ✅ PASS | ✅ PASS | `VERIFIED IN SOURCE` |
| **`aesDecl`** | `closed` | `#1B5E20` | `#E8F5E9` | **7.00 : 1** | ✅ PASS | ✅ PASS | `VERIFIED IN SOURCE` |
| **`ohCoord`** | `pending_acknowledgement` | `#7C4400` | `#FFF8E1` | **7.36 : 1** | ✅ PASS | ✅ PASS | `VERIFIED IN SOURCE` |
| **`ohCoord`** | `acknowledged` | `#B24100` | `#FFF3E0` | **5.25 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| **`ohCoord`** | `completed` | `#1B5E20` | `#E8F5E9` | **7.00 : 1** | ✅ PASS | ✅ PASS | `VERIFIED IN SOURCE` |
| **`ohCoord`** | `cancelled` | `#C62828` | `#FFEBEE` | **4.92 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| **`capa`** | `proposed` | `#7C4400` | `#FFF8E1` | **7.36 : 1** | ✅ PASS | ✅ PASS | `VERIFIED IN SOURCE` |
| **`capa`** | `in_progress` | `#B24100` | `#FFF3E0` | **5.25 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| **`capa`** | `completed` | `#1B5E20` | `#E8F5E9` | **7.00 : 1** | ✅ PASS | ✅ PASS | `VERIFIED IN SOURCE` |
| **`capa`** | `cancelled` | `#C62828` | `#FFEBEE` | **4.92 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| **`fallback`** | *Unknown / unmapped status* | `#616161` | `#EEEEEE` | **5.34 : 1** | ✅ PASS | ❌ FAIL | `VERIFIED IN SOURCE` |
| *Legacy spec* | `under_review` (former `#E65100`) | `#E65100` | `#FFF3E0` | **3.46 : 1** | ❌ **FAIL** | ❌ FAIL | *Superseded in Phase 2E.1.1* |
| *Legacy spec* | `correction_requested` (former `#D84315`) | `#D84315` | `#FBE9E7` | **3.78 : 1** | ❌ **FAIL** | ❌ FAIL | *Superseded in Phase 2E.1.1* |

### Audit Finding
**100% of current active tokens in `aesColors.ts` pass WCAG AA for normal text ($\ge 4.5:1$).**  
The approved darker tokens (`#B24100` and `#BF360C`) resolved the previous contrast deficiency. No token changes are required.

---

## 7. Contextual Action & Navigation Audit (Summary Tab)

Every proposed contextual action on Screen 5.2 Tab 1 (`[Résumé]`) was mapped to its persisted status, required role, repository operation, destination route, and test coverage:

| Contextual Action | Persisted Declaration Status | Required Active Role | Existing Repository Operation | Destination Route | Existing Test Coverage | Workflow Evaluation |
|---|---|---|---|---|---|---|
| **Edit Draft** | `draft` | `exposed_professional` (author) | Reads: `getDeclarationById`<br>Updates: `updateDraft` | `newDeclaration` (`{ declarationId }`) | `declaration-workflow.test.tsx` (lines 76–140) | **Safe** — Reuses existing wizard edit flow [`VERIFIED IN SOURCE`] |
| **Submit Draft** | `draft` | `exposed_professional` (author) | `db.submitDeclaration(id)` + `logAuditEvent` | `submissionConfirmation` (`{ referenceNumber }`) | `declaration-workflow.test.tsx` (lines 142–210)<br>`database.test.ts` (line 320) | **Safe** — Reuses existing submission flow [`VERIFIED IN SOURCE`] |
| **Open Admin Review** | `submitted`, `under_review`, `resubmitted` | `admin_reviewer` | Reads: `getDeclarationById`<br>Mutates: `createAdministrativeReview` | `adminReviewAction` (`{ declarationId }`) | `admin-review-workflow.test.tsx` (lines 1–215) | **Safe** — Reuses existing review queue flow [`VERIFIED IN SOURCE`] |
| **Respond to Correction** | `correction_requested` | `exposed_professional` (author, verified via `canRespondToCorrection`) | Reads: `getDeclarationReviewHistory`<br>Mutates: `createCorrectionResponse` | `correctionResponse` (`{ declarationId, reviewId }`) | `correction-workflow.test.tsx` (lines 191–256) | **Safe** — Reuses existing correction workflow [`VERIFIED IN SOURCE`] |
| **Create Coordination** | `submitted`, `under_review`, `resubmitted` | `admin_reviewer` | `db.createOhCoordination(input)` | `createCoordination` (`{ declarationId }`) | `oh-coordination-workflow.test.ts` (lines 60–120) | **Safe** — Reuses existing admin referral flow [`VERIFIED IN SOURCE`] |

Zero new workflow states, clinical actions, or synthetic status transitions are introduced. All actions strictly reuse established Phase 2C/2D operations.

---

## 8. Revised Batch 4 Feature Classification

Based on actual repository code, authorization boundaries, and schema limitations, the 12 Batch 4 features are classified as follows:

| # | Batch 4 Feature | Classification | Rationale & Prerequisite |
|---|---|---|---|
| **1** | **Declaration list redesign & filters** | `SAFE — EXISTING AUTHORIZED PATH` | Fully authorized for `exposed_professional` (own declarations) and `admin_reviewer` (hospital-wide declarations). Client-side filtering across status chips operates safely on already-authorized result sets. |
| **2** | **OH declaration list presentation** | `DEFERRED — AUTHORIZATION OR DATA-MINIMIZATION GAP` | In schema v8, `oh_professional` receives unscoped hospital-wide declarations. The target policy prohibits an unrestricted declaration list for OH. A UI notice does not constitute authorization. OH navigation must enter strictly via `ohCoordinationQueue`. |
| **3** | **Draft deletion** | `SAFE AFTER NARROW REPOSITORY CORRECTION` | Existing `deleteAesDeclaration(id)` lacks caller, ownership (`declared_by_user_id`), and status (`draft`) checks. Requires adding atomic `deleteDraft(declarationId, requestingUserId)` in `AesGuardianDatabase.ts` before UI activation. |
| **4** | **Declaration details tab layout** | `SAFE — EXISTING AUTHORIZED PATH` | 6-tab container architecture is pure UI/UX state management. Authorized for `exposed_professional` (author) and `admin_reviewer`. OH access deferred. |
| **5** | **Incident and Measures tabs** | `SAFE — EXISTING AUTHORIZED PATH` | Tab 2 (`Incident`) and Tab 3 (`Mesures`) render data already retrieved via authorized `db.getDeclarationById()`. Free-text measures preserve clinical neutrality. |
| **6** | **Administrative Status tab** | `SAFE — EXISTING AUTHORIZED PATH` | Tab 4 (`Statut`) calls `db.getDeclarationReviewHistory()`, which already enforces authorization for declarant and admin reviewer. |
| **7** | **Exposed professional Follow-up projection** | `SAFE — EXISTING AUTHORIZED PATH` | Tab 5 (`Suivi`) calls `db.getOhCoordinationByDeclaration()`, which already enforces a minimal 5-field projection (`id`, `declaration_id`, `status`, `created_at`, `updated_at`). Zero medical note leakage. |
| **8** | **Admin Follow-up projection** | `SAFE — EXISTING AUTHORIZED PATH` | Tab 5 (`Suivi`) calls `db.getOhCoordinationByDeclaration()`, returning administrative referral metadata without clinical notes. |
| **9** | **OH Follow-up details and events** | `DEFERRED — AUTHORIZATION OR DATA-MINIMIZATION GAP` | In `DeclarationDetailsScreen`, `getDeclarationById` permits arbitrary declaration lookup for OH. Full OH follow-up management belongs strictly in `OhCoordinationDetailScreen` accessed via `ohCoordinationQueue`. |
| **10** | **Audit Chronologie tab** | `DEFERRED — AUTHORIZATION OR DATA-MINIMIZATION GAP` | Existing `listAuditEvents()` has zero user/role validation and leaks hospital-wide cross-incident logs. Client-side filtering does not satisfy data minimization. Deferred until a scoped repository method is created. |
| **11** | **`AesStatusBadge` component** | `SAFE — EXISTING AUTHORIZED PATH` | Reusable presentation component. All 10 domain status tokens pass WCAG AA (≥ 4.5:1) for normal text. |
| **12** | **`AesTimelineNode` component** | `SAFE — EXISTING AUTHORIZED PATH` | Pure presentation component; safe to implement as a shared component, though its usage in Screen 5.2 Tab Chronologie is deferred. |

---

## 9. Test & Validation Plan

Before implementation authorization can be granted, the following test plan establishes verified existing properties versus required new tests:

| Test Property | Target Verification | Current Test Coverage | Status / Action Required |
|---|---|---|---|
| **Role-based declaration list retrieval** | `exposed_professional` gets only own declarations; `admin_reviewer` gets all; `quality_staff` & `tech_admin` get `UnauthorizedError` | `database.test.ts` lines 922–945 | **Verified Existing** [`VERIFIED BY TEST`] |
| **OH declaration list denial** | Confirm `DeclarationListScreen` denies or bypasses `oh_professional` | None (currently returns all) | **Missing Test** — Must add test asserting OH is redirected or denied declaration list access. |
| **Exposed professional ownership isolation** | `exposed_professional` cannot read another user's declaration | `database.test.ts` lines 823–835 | **Verified Existing** [`VERIFIED BY TEST`] |
| **Draft deletion atomic authorization** | Deletes only if caller is author AND status is `draft`; fails for other users or other statuses | None | **Missing Test** — Must add suite in `database.test.ts` covering `deleteDraft()` authorization matrix. |
| **Audit timeline scoped query** | `getDeclarationAuditEvents(declId, userId)` returns only events for `declId`, rejects unauthorized callers | None | **Missing Test** — Required when scoped audit method is introduced. |
| **OH follow-up event access restriction** | `getOhFollowUpEvents` throws `Unauthorized` for `exposed_professional` and `admin_reviewer` | `oh-coordination-workflow.test.ts` lines 407–428 | **Verified Existing** [`VERIFIED BY TEST`] |
| **Exposed 5-field projection exactness** | Tab Suivi returns strictly `{ id, declaration_id, status, created_at, updated_at }` for `exposed_professional` | `oh-coordination-workflow.test.ts` lines 720–756 | **Verified Existing** [`VERIFIED BY TEST`] |
| **Admin OH summary field minimization** | Tab Suivi returns administrative metadata without medical notes for `admin_reviewer` | `oh-coordination-workflow.test.ts` lines 590–630 | **Verified Existing** [`VERIFIED BY TEST`] |
| **Status badge contrast** | All 10 domain pairs meet $\ge 4.5:1$ contrast | Verified mathematically in Section 6 | **Verified Existing** [`VERIFIED IN SOURCE`] |
| **Contextual action role/status validation** | Summary tab actions trigger only for authorized role and status combinations | `declaration-workflow.test.tsx`<br>`admin-review-workflow.test.tsx`<br>`correction-workflow.test.tsx` | **Verified Existing** [`VERIFIED BY TEST`] |

---

## 10. Final Recommendation: Smallest Safe Implementation Scope

### 10.1 Recommended Scope for Phase 2E.1.4.2 (Batch 4 Narrow Scope)

To execute Batch 4 with mathematical safety and zero authorization compromises, the implementation should be partitioned into a two-stage approach:

#### Stage 1: Safe Core UI Implementation (Zero Database Changes Required)
1. **Screen 5.1 (`DeclarationListScreen.tsx`):**
   - Implement for `exposed_professional` and `admin_reviewer`.
   - Implement 5-chip filter bar with instant sub-50ms client-side filtering.
   - Implement `AesStatusBadge` on card rows.
   - **Exclude `oh_professional` from the declaration list route.** Guide OH professionals directly to `ohCoordinationQueue`.
   - **Defer swipe-to-delete** until Stage 2 repository method is available, or proceed immediately to Stage 2 narrow repository correction.
2. **Screen 5.2 (`DeclarationDetailsScreen.tsx`):**
   - Implement underlined tab bar with **5 active tabs**:
     - Tab 1: `[Résumé]` with verified contextual actions.
     - Tab 2: `[Incident]` with structured exposure fields.
     - Tab 3: `[Mesures]` with neutral descriptive wording.
     - Tab 4: `[Statut]` with chronological review history.
     - Tab 5: `[Suivi]` with 5-field projection for `exposed_professional` and administrative summary for `admin_reviewer`.
   - **Defer Tab 6 (`[Chronologie]`)** with a clean empty/deferred placeholder until a scoped repository method is created.
3. **Presentation Components:**
   - Create `AesStatusBadge.tsx` supporting `domain="aesDecl" | "ohCoord" | "capa"`.
   - Create `AesTimelineNode.tsx` for shared use.

#### Stage 2: Narrow Repository Corrections (Requires Explicit Authorization)
1. Add `deleteDraft(declarationId: number, requestingUserId: number): Promise<void>` in `AesGuardianDatabase.ts` enforcing `WHERE id = ? AND declared_by_user_id = ? AND status = 'draft'`.
2. Add `getDeclarationAuditEvents(declarationId: number, requestingUserId: number): Promise<AuditEvent[]>` in `AesGuardianDatabase.ts` scoping audit records to the specific declaration and verifying requester authorization.
3. Enable swipe-to-delete in Screen 5.1 and Tab Chronologie in Screen 5.2 once these methods and their unit tests pass.

---

## 11. Verification Summary & Confirmation

Following the completion of this report:
- **Current Branch:** `migration/aes-guardian` [`VERIFIED IN SOURCE`]
- **Current HEAD:** `d79b01ef51646509170996f8c77517f95470f217` [`VERIFIED IN SOURCE`]
- **Code Modifications:** Exactly zero (0) application code or test files were modified.
- **Original SANAD Repository:** Untouched [`VERIFIED IN SOURCE`].

**STOP CONDITION SATISFIED.** Awaiting review of this security and scope reconciliation report and explicit instructions for Phase 2E.1.4.2.
