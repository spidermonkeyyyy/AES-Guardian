# AES GUARDIAN — PHASE 2D.2C.1 HARDENING & REMEDIATION REPORT
## Notification Workflow Hardening, Authorization Remediation & Atomicity Verification

**Date:** 2026-11-13  
**Project:** SANAD React Native Migration — AES Guardian  
**Worktree:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**HEAD at start/finish:** `d79b01ef51646509170996f8c77517f95470f217`  
**Phase:** 2D.2C.1 — Corrective Verification & Hardening  
**Regression Baseline:** 513 tests passing across 36 test suites (0 failures)  
**Execution Policy:** Code-first; zero emulator launches; zero Git commits/pushes/resets.

---

## 1. EXECUTIVE SUMMARY & REPOSITORY VERIFICATION

Phase 2D.2C.1 was undertaken to perform a focused audit and hardening pass on the AES Guardian event-driven notification architecture. Specifically, this phase remediated recipient resolution vulnerabilities, verified exposed-professional record isolation, established exhaustive failure-injection tests across all workflow methods, unified OH coordination completion pathways, and conducted a comprehensive privacy audit of all 11 notification event payloads.

### Repository State Verification

| Metric | Recorded Value | Status |
| :--- | :--- | :--- |
| **Branch** | `migration/aes-guardian` | Verified (`git branch --show-current`) |
| **Commit HEAD** | `d79b01ef51646509170996f8c77517f95470f217` | Exact match (`git rev-parse HEAD`) |
| **Tracked Modifications** | 16 files modified (see manifest below) | Intact and preserved |
| **Original SANAD Repo** | `C:\Users\User\Desktop\sure\sanad-rn` | 100% untouched |
| **Database Migrations** | Migrations 1 through 8 active | Schema Version 8 verified |
| **Total Test Suites** | 36 test suites passing | 0 failing |
| **Total Tests** | 513 tests passing | 0 failing (100% passing) |
| **Core TypeScript Typecheck** | 0 errors in `src/core` and `src/features/aes-guardian` | Clean |

---

## 2. REMEDIATION A: STRICT RECIPIENT RESOLUTION & TWO-TIER ROLE DEFENSE

### 2.1 The Vulnerability in Initial Implementation

The Phase 2D.2C implementation included a fallback pattern:
```typescript
// Previous implementation:
return result.rows[0]?.id ?? defaultId;
```
If no user in `demo_users` had the required role, the method fell back to a hardcoded user ID (`2` or `3`) without validating that the user actually held that role. Furthermore, recipient resolution occurred outside the database transaction in `submitDeclaration`, `createCorrectionResponse`, and `createOhCoordination`, meaning a resolution failure would not cleanly abort before or during transaction execution.

### 2.2 Hardened Implementation

In `src/core/database/AesGuardianDatabase.ts`:
1. **Elimination of `defaultId`:** The method signature was changed to `getRecipientUserIdByRole(role: AesGuardianRole, executor?: TransactionExecutor): Promise<number>`.
2. **Canonical Mapping & Fallback:**
   ```typescript
   const canonicalIds: Record<Exclude<AesGuardianRole, 'tech_admin'>, number> = {
     exposed_professional: 1,
     admin_reviewer: 2,
     oh_professional: 3,
     quality_staff: 4,
   };
   ```
   If the preferred ID holds the expected role, it returns that ID immediately. Otherwise, it queries `demo_users` for the earliest active user with that role (`ORDER BY id ASC LIMIT 1`).
3. **Explicit Error on Missing Role:** If no user with the required role exists, it throws:
   ```typescript
   throw new Error(`RecipientResolutionError: No active user found with required role '${role}'. Cannot deliver workflow notification.`);
   ```
4. **tech_admin Strict Barrier:** Attempting to resolve `tech_admin` throws:
   ```typescript
   throw new Error("Unauthorized: operational notifications cannot be addressed to 'tech_admin'.");
   ```
5. **Transactional Execution:** `getRecipientUserIdByRole(role, tx)` is called *inside* the business transaction (`await this.db.transaction(async tx => { ... })`) for `submitDeclaration`, `createCorrectionResponse`, and `createOhCoordination`. A recipient resolution failure immediately aborts and rolls back any pending mutation.
6. **Two-Tier Role Defense in `insertNotification`:** In addition to resolution, `insertNotification` queries `demo_users` (via `executor.query` inside transaction where available) and verifies:
   ```typescript
   const expectedRole = EVENT_RECIPIENT_ROLE[input.event_type];
   if (user.role !== expectedRole) {
     throw new Error(
       `insertNotification: recipient user ${input.recipient_user_id} has role '${user.role}', but event '${input.event_type}' requires role '${expectedRole}'.`,
     );
   }
   ```

---

## 3. REMEDIATION B: EXPOSED-PROFESSIONAL RECORD OWNERSHIP & CLINICAL ISOLATION

### 3.1 Domain Ownership Rules in `getDeclarationById`

`getDeclarationById(id: number, requestingUserId?: number)` strictly enforces:
- **`exposed_professional` Ownership Guard:** An exposed professional can view declarations if and only if `decl.declared_by_user_id === requestingUserId`. Any attempt to view another user's declaration throws:
  `Unauthorized: exposed_professional user <id> is not permitted to access declaration <declId> owned by user <ownerId>.`
- **`tech_admin` Complete Clinical Exclusion:**
  `Unauthorized: tech_admin user <id> is strictly prohibited from accessing clinical declaration content.`
- **Authorized Processing Roles:** Users with role `admin_reviewer`, `oh_professional`, or `quality_staff` are granted access for triage, coordination, and aggregate surveillance duties.

### 3.2 Verification

The test suite `src/core/database/__tests__/notification-workflow-hardening.test.ts` (Remediation B) proves:
- User 1 (`exposed_professional`) successfully accesses User 1's declaration.
- User 1 (`exposed_professional`) is blocked with `Unauthorized` when requesting User 6's (`exposed_professional`) declaration.
- User 6 (`exposed_professional`) is blocked with `Unauthorized` when requesting User 1's declaration.
- Admin Reviewer (User 2), OH Professional (User 3), and Quality Staff (User 4) successfully access declarations.
- Tech Admin (User 5) is rejected with `Unauthorized` on every clinical declaration lookup.

---

## 4. REMEDIATION C: FAILURE-INJECTION COVERAGE ACROSS ALL WORKFLOWS

To ensure atomicity, failure-injection tests were implemented using the genuine `NativeSQLiteAdapter` with Node.js `DatabaseSync` (`node:sqlite`). Every workflow method was tested against simulated notification or audit write failures.

### Summary of Failure-Injection Rollback Results

| Method | Injected Failure Point | Expected Outcome | Verified State After Rollback | FK Check |
| :--- | :--- | :--- | :--- | :--- |
| `submitDeclaration` | `insertNotification` rejection | Rejects with simulated error | Status remains `'draft'`; 0 notifications | 0 violations |
| `createAdministrativeReview` | `insertNotification` rejection | Rejects with simulated error | Status remains `'submitted'`; 0 reviews; 0 notifications | 0 violations |
| `createCorrectionResponse` | `insertNotification` rejection | Rejects with simulated error | Status remains `'correction_requested'`; 0 response rows; 0 notifications | 0 violations |
| `createOhCoordination` | `insertNotification` rejection | Rejects with simulated error | 0 coordination rows; 0 notifications | 0 violations |
| `acknowledgeOhCoordination` | `insertNotification` rejection | Rejects with simulated error | Status remains `'pending_acknowledgement'`; `acknowledged_at` is `null`; 0 notifications | 0 violations |
| `createOhFollowUpEvent` (Milestone) | `insertNotification` rejection | Rejects with simulated error | 0 follow-up events; status remains `'acknowledged'`; 0 notifications | 0 violations |
| `createOhFollowUpEvent` (Completion) | `insertNotification` rejection | Rejects with simulated error | 0 follow-up events; status remains `'acknowledged'`; `completed_at` is `null`; 0 notifications | 0 violations |
| `completeOhCoordination` | `insertNotification` rejection | Rejects with simulated error | Status remains `'acknowledged'`; `completed_at` is `null`; 0 notifications | 0 violations |
| `createPreventionAction` | `insertNotification` rejection | Rejects with simulated error | 0 prevention actions; 0 audit events; 0 notifications | 0 violations |
| `createPreventionAction` | `INSERT INTO audit_events` rejection | Rejects with simulated error | 0 prevention actions; 0 audit events; 0 notifications | 0 violations |
| `updatePreventionActionStatus` | `insertNotification` rejection | Rejects with simulated error | Status remains `'proposed'`; 0 status audit events; 0 notifications | 0 violations |

In every test, `PRAGMA foreign_key_check;` returned zero rows, verifying that SQLite foreign-key integrity remained completely uncompromised.

---

## 5. REMEDIATION D: COMPLETION PATH CONSISTENCY & IDEMPOTENCY ALIGNMENT

The AES Guardian domain model supports two distinct workflows for concluding occupational health coordination:
1. **Direct Closeout:** `completeOhCoordination(coordinationId, completingUserId)`
2. **Follow-Up Event Closeout:** `createOhFollowUpEvent({ coordination_id, event_category: 'follow_up_completed', ... })`

### Alignment Verification

1. **Terminal State Equivalence:**
   - Both pathways transition `oh_coordinations.status` to `'completed'`.
   - Both record `completed_by_user_id` and `completed_at` timestamps.
2. **Notification Event Equivalence:**
   - Both pathways generate event `oh_coordination_completed`.
   - `createOhFollowUpEvent` suppresses generation of `oh_milestone_recorded` when category is `'follow_up_completed'`.
3. **Idempotency Key Alignment:**
   - Both pathways produce the identical key format:
     `notif:oh_coordination_completed:oh_coordination:${coordinationId}:${declaredByUserId}`
4. **Invalid Duplicate Protection:**
   - Calling `completeOhCoordination` on an already completed coordination throws `invalid transition from completed`.
   - Calling `createOhFollowUpEvent` on an already completed coordination throws `cannot record events on a completed coordination`.
   - If a duplicate event is inserted, SQLite `ON CONFLICT(idempotency_key) DO NOTHING` prevents duplicate notification rows while preserving transaction integrity.

---

## 6. REMEDIATION E: NOTIFICATION PAYLOAD PRIVACY AUDIT

A complete privacy audit was performed on all 11 notification event types. The table below confirms that no patient health information (PHI), clinical narratives, free-text notes, injury details, or sensitive metadata are ever stored in notification records.

| # | Event Type | Recipient Role | Title Translation Key | Message Translation Key | Entity Type | Entity Reference | PHI / Free-Text Prohibited? |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `declaration_submitted` | `admin_reviewer` | `notification.declarationSubmitted.title` | `notification.declarationSubmitted.message` | `aes_declaration` | `decl.reference_number` (e.g. `AES-2026-0001`) | **YES** — Only reference number |
| **2** | `review_completed` | `exposed_professional` | `notification.reviewCompleted.title` | `notification.reviewCompleted.message` | `administrative_review` | `decl.reference_number` | **YES** — No review comments |
| **3** | `correction_requested` | `exposed_professional` | `notification.correctionRequested.title` | `notification.correctionRequested.message` | `administrative_review` | `decl.reference_number` | **YES** — No correction request text |
| **4** | `correction_submitted` | `admin_reviewer` | `notification.correctionSubmitted.title` | `notification.correctionSubmitted.message` | `correction_response` | `decl.reference_number` | **YES** — No response narrative |
| **5** | `oh_coordination_created` | `oh_professional` | `notification.ohCoordinationCreated.title` | `notification.ohCoordinationCreated.message` | `oh_coordination` | `decl.reference_number` | **YES** — No medical coordination reason |
| **6** | `oh_coordination_acknowledged`| `exposed_professional` | `notification.ohCoordinationAcknowledged.title`| `notification.ohCoordinationAcknowledged.message`| `oh_coordination`| `decl.reference_number` | **YES** — Pure status notification |
| **7** | `oh_milestone_recorded` | `exposed_professional` | `notification.ohMilestoneRecorded.title` | `notification.ohMilestoneRecorded.message` | `oh_follow_up_events` | `decl.reference_number` | **YES** — No clinical notes or milestone details |
| **8** | `oh_coordination_completed` | `exposed_professional` | `notification.ohCoordinationCompleted.title` | `notification.ohCoordinationCompleted.message` | `oh_coordination` | `decl.reference_number` | **YES** — Pure status notification |
| **9** | `capa_created` | `quality_staff` | `notification.capaCreated.title` | `notification.capaCreated.message` | `prevention_action` | `reference_code` (e.g. `CAPA-2026-0001`) | **YES** — No title, rationale, or narrative |
| **10**| `capa_status_changed` | `quality_staff` | `notification.capaStatusChanged.title` | `notification.capaStatusChanged.message` | `prevention_action` | `action.reference_code` | **YES** — Only status and reference code |
| **11**| `capa_finalized` | `quality_staff` | `notification.capaFinalized.title` | `notification.capaFinalized.message` | `prevention_action` | `action.reference_code` | **YES** — No completion notes |

---

## 7. VERIFICATION & TEST METRICS

### 7.1 Test Suites Summary

```
Test Suites: 36 passed, 36 total
Tests:       513 passed, 513 total
Snapshots:   0 total
Time:        26.334 s
```

### 7.2 Key Test Suite Breakdown

- `src/core/database/__tests__/notification-workflow-hardening.test.ts`: **23 passed / 23 total**
  - Remediation A: Strict Recipient Resolution (7 tests)
  - Remediation B: Exposed-Professional Record Ownership (4 tests)
  - Remediation C: Failure-Injection Rollback Across All Workflows (9 tests)
  - Remediation D: Completion Path Consistency & Idempotency (2 tests)
  - Remediation E: Notification Payload Privacy Audit (1 test)
- `src/core/database/__tests__/notification-workflow.test.ts`: **15 passed / 15 total**
- `src/core/database/__tests__/notifications.test.ts`: **32 passed / 32 total**
- `src/core/database/__tests__/migration8.test.ts`: **14 passed / 14 total**
- `src/core/database/__tests__/demo-reset.test.ts`: **11 passed / 11 total**
- All other 31 test suites: **418 passed / 418 total**

### 7.3 TypeScript Compilation Check

```powershell
npx tsc --noEmit --project tsconfig.json | Select-String "src/core|src/features/aes-guardian"
# Output: Clean (0 errors)
```

---

## 8. NEXT AUTHORIZED PHASES & STOP CONDITION

With Phase 2D.2C.1 verified and closed:
1. **Phase 2D.2C.1 is complete.**
2. **Subsequent Authorized Phases:**
   - **Phase 2D.2D:** Notification Demo Scenario Seeding & Demo Reset Alignment
   - **Phase 2D.2E:** Notification Localization (`src/localization/index.ts`)
   - **Phase 2D.2F:** Notification Navigation & Routing Integration
   - **Phase 2D.2G:** Notification Centre UI, Badge Counter & Workspace Integration
3. **Execution policy observed:** All changes tested code-first; no emulator launched; no Git commit/push executed.
