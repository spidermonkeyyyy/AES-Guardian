# AES Guardian — Phase 2D.2D.2: Dynamic Recipient Invariant & Transaction Boundary Report

**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**Expected HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Current Schema:** Version 8  
**Verification Date:** 2026-11-14  
**Status:** COMPLETE & VERIFIED (38/38 test suites, 588/588 tests passing, 0 TypeScript errors)

---

## 1. Executive Summary

Phase 2D.2D.2 closes the remaining contract violation in baseline notification seeding and proves transaction atomicity without nested transaction vulnerabilities:
1. **Removed all hardcoded numeric recipient IDs (`CANONICAL_ROLE_IDS`)** from `src/core/database/demo-scenario-seeder.ts` and `src/core/database/AesGuardianDatabase.ts`. All notification recipients, declaration authors, reviewers, coordinators, and CAPA creators are dynamically resolved from `demo_users`.
2. **Deterministic selection rule established and documented:** Since `role` is not unique in `demo_users`, the deterministic selection rule `ORDER BY id ASC LIMIT 1` is applied. In the synthetic identity architecture, the earliest registered user for a role represents the primary operational persona (primary clinician, primary medical reviewer, primary occupational health physician, primary quality lead).
3. **Fail-closed role invariant:** If any required operational role is missing from `demo_users`, `resolveRecipientId` throws `RecipientResolutionError` before any scenario records or notifications are inserted, aborting the transaction.
4. **Non-canonical user ID proof:** Verified with a test fixture using synthetic users with non-sequential primary keys (`101`, `202`, `303`, `404`, `505`). All 4 baseline notifications and all dependent operational entities resolve to these exact IDs; tests verify that hardcoded IDs (`1`, `2`, `3`, `4`) would violate foreign keys and fail assertions.
5. **Type-safe transaction boundaries:** `seedStandardScenario` now checks `executor.inTransaction` and `options.inTransaction`. When called standalone, it opens exactly one transaction; when called inside `resetDemoScenario`, it operates within the existing outer transaction and never opens a nested transaction.
6. **`DatabaseService.transaction` verification:** Verified that callback results are returned unchanged upon commit, caught exceptions trigger `ROLLBACK` and re-throw, and failed transactions cannot return success.

---

## 2. Dynamic Recipient Resolution & Invariant Design

### 2.1 Elimination of Hardcoded Numeric Mappings
The previous implementation defined:
```typescript
// REMOVED IN PHASE 2D.2D.2:
const CANONICAL_ROLE_IDS: Record<string, number> = {
  exposed_professional: 1,
  admin_reviewer: 2,
  oh_professional: 3,
  quality_staff: 4,
};
```
This constant has been completely removed. `resolveRecipientId` in `demo-scenario-seeder.ts` and `getRecipientUserIdByRole` in `AesGuardianDatabase.ts` now execute purely dynamic queries against `demo_users`.

### 2.2 Dynamic Selection Rule & Rationale
In schema migration 2, `demo_users` was created as:
```sql
CREATE TABLE demo_users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT    NOT NULL UNIQUE,
  display_name TEXT    NOT NULL,
  role         TEXT    NOT NULL CHECK (role IN ('exposed_professional', 'admin_reviewer', 'oh_professional', 'quality_staff', 'tech_admin')),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
```
Because `role` does not have a `UNIQUE` constraint, multiple user records with the same role may exist in testing or production environments (e.g., additional clinicians in a hospital department, secondary reviewers).

To guarantee deterministic, repeatable, and scan-order-independent resolution across all database engines and query plans, the following selection rule is enforced:
```sql
SELECT id, role FROM demo_users WHERE role = ? ORDER BY id ASC LIMIT 1
```

**Architectural Rationale:**
- In the synthetic demonstration architecture, synthetic users are provisioned in a deterministic sequence during database setup.
- The earliest inserted user for each role (lowest primary key `id`) represents the primary canonical actor for that operational discipline:
  - `exposed_professional` -> Primary affected clinician (Dr. Claire Dupont)
  - `admin_reviewer` -> Primary medical reviewer (Dr. Alain Martin)
  - `oh_professional` -> Primary occupational health physician (Dr. Sophie Bernard)
  - `quality_staff` -> Primary quality and risk manager (Mme. Isabelle Leroy)
- Subsequent records represent secondary users or test fixtures.
- Sorting by `id ASC LIMIT 1` ensures that neither SQLite B-Tree rebalancing, row storage order, nor unordered `SELECT` scans can ever alter the resolved recipient.

### 2.3 Comprehensive Entity Author Resolution
In `runSeedStandardScenario`, dynamic resolution is executed at the very start:
```typescript
const exposedUserId = await resolveRecipientId(executor, 'exposed_professional');
const adminUserId = await resolveRecipientId(executor, 'admin_reviewer');
const ohUserId = await resolveRecipientId(executor, 'oh_professional');
const qualityUserId = await resolveRecipientId(executor, 'quality_staff');
```
These resolved IDs are applied across every seeded record:
- **Declarations 1–4:** `declared_by_user_id = exposedUserId`
- **Audit events:** `user_id = exposedUserId / adminUserId / ohUserId`
- **Administrative reviews:** `reviewer_user_id = adminUserId`
- **OH coordinations:** `created_by_user_id = adminUserId`, `acknowledged_by_user_id = ohUserId`, `completed_by_user_id = ohUserId`
- **OH follow-up events:** `recorded_by_user_id = ohUserId`
- **Prevention actions (CAPA 1–5):** `created_by_user_id = qualityUserId`
- **Notifications 1–4:**
  - `declaration_submitted` -> `adminUserId`
  - `correction_requested` -> `exposedUserId`
  - `oh_coordination_created` -> `ohUserId`
  - `capa_created` -> `qualityUserId`

If any role is missing, `resolveRecipientId` throws `RecipientResolutionError` before a single `INSERT` statement is issued.

---

## 3. Transaction Boundaries & Nesting Prevention

### 3.1 SQLite Transaction Invariant
In SQLite, executing `BEGIN TRANSACTION` inside an active transaction produces a fatal runtime error:
```
cannot start a transaction within a transaction
```
To preserve absolute atomicity across both operational paths while preventing nested transaction errors, `seedStandardScenario` defines an explicit transaction context contract:

```typescript
export interface SqlExecutor {
  execute: (sql: string, params?: any[]) => Promise<any>;
  query: <T = any>(sql: string, params?: any[]) => Promise<{ rows: T[] }>;
  readonly inTransaction?: boolean;
}

export interface SeedStandardScenarioOptions {
  inTransaction?: boolean;
}

export async function seedStandardScenario(
  executor: SqlExecutor,
  options?: SeedStandardScenarioOptions,
): Promise<SeedResult> {
  const isAlreadyInTransaction =
    executor.inTransaction === true || options?.inTransaction === true;

  if (!isAlreadyInTransaction && typeof (executor as any).transaction === 'function') {
    return (executor as any).transaction(async (tx: SqlExecutor) => {
      const transactionalExecutor: SqlExecutor = {
        execute: (sql, params) => tx.execute(sql, params),
        query: (sql, params) => tx.query(sql, params),
        inTransaction: true,
      };
      return runSeedStandardScenario(transactionalExecutor);
    });
  }

  return runSeedStandardScenario(executor);
}
```

### 3.2 Dual-Path Execution Model
1. **Path A — Standalone Seeding (`seedStandardScenario(database)`):**
   - `isAlreadyInTransaction` is `false`.
   - `executor.transaction(...)` is invoked once.
   - The wrapped callback passes `transactionalExecutor` with `inTransaction: true`.
   - Declarations, reviews, coordinations, follow-ups, CAPAs, and all 4 notifications execute within this single transaction.
   - If any step fails, the entire scenario rolls back atomically.
2. **Path B — Reset and Reseed (`resetDemoScenario(userId)`):**
   - `resetDemoScenario` opens the outer transaction via `this.db.transaction(...)`.
   - Deletions execute across `in_app_notifications`, `oh_follow_up_events`, `oh_coordinations`, `correction_responses`, `administrative_reviews`, `aes_declarations`, `prevention_actions`, and `audit_events`.
   - Seeding is invoked via:
     ```typescript
     await seedStandardScenario(tx, { inTransaction: true });
     ```
   - Because `options.inTransaction === true` (and `tx.inTransaction === true`), `seedStandardScenario` executes `runSeedStandardScenario` directly without invoking `.transaction(...)`.
   - The outer reset transaction remains the sole owner of the entire operation.
   - Audit event `DEMO_DATA_RESET` is recorded.
   - Commit occurs only once at the outer boundary.

---

## 4. `DatabaseService.transaction` Behavior Verification

`DatabaseService.transaction` has been verified for production compliance:
1. **Result Passthrough:** The value returned by `await fn(tx)` is returned unchanged upon successful commit.
2. **Error Rollback:** Caught exceptions immediately issue `ROLLBACK;` and re-throw the original error.
3. **No False Success:** A failed transaction can never return a resolved promise; it always rejects with the error that caused the failure.
4. **Context Flagging:** The transaction context `tx` provided to `fn` carries `inTransaction: true`.

---

## 5. Verification Test Suite & Results

### 5.1 Focused Suite: `demo-notification-seeding.test.ts` (30 Tests)

| Part | Description | Tests | Status |
|---|---|---|---|
| **Part 1** | Baseline notification count & granular specifications | 10 | PASS |
| **Part 2** | Reset rollback after destructive operations | 3 | PASS |
| **Part 3** | Complete seed rollback on partial failure | 1 | PASS |
| **Part 4** | Recipient resolution invariant and missing role fail-closed | 6 | PASS |
| **Part 5** | Repeated reset/reseed across 3 cycles with AUTOINCREMENT | 2 | PASS |
| **Part 6** | Dynamic recipient invariant & non-canonical user IDs (101, 202, 303, 404, 505) | 3 | PASS |
| **Part 7** | Transaction boundary, ownership & nesting verification | 5 | PASS |
| **Total** | | **30** | **PASS** |

### 5.2 Key Verified Behaviors
- **Non-canonical user IDs:**
  When `demo_users` is seeded with IDs `101`, `202`, `303`, `404`, and `505`:
  - `declaration_submitted` resolves to recipient `202` (not 2).
  - `correction_requested` resolves to recipient `101` (not 1).
  - `oh_coordination_created` resolves to recipient `303` (not 3).
  - `capa_created` resolves to recipient `404` (not 4).
  - Declarations reference `declared_by_user_id = 101`.
  - Reviews reference `reviewer_user_id = 202`.
  - Coordinations reference `created_by = 202`, `acknowledged_by = 303`.
  - CAPA actions reference `created_by_user_id = 404`.
  - `PRAGMA foreign_key_check = 0` violations.
- **Fail-closed on missing roles:**
  Removing `admin_reviewer`, `oh_professional`, `exposed_professional`, or `quality_staff` throws `RecipientResolutionError` and leaves 0 declarations and 0 notifications.
- **Single transaction ownership:**
  Spies on `adapter.transaction` prove call count is exactly 1 for standalone `seedStandardScenario(db)` and exactly 1 for `resetDemoScenario(techAdminId)`.
- **Nesting prevention:**
  Mock executors with a throwing `.transaction` method confirm that `inTransaction: true` bypasses `.transaction` calls completely.
- **3-cycle AUTOINCREMENT advancement:**
  Maintained and passing across repeated reset/reseed cycles.

### 5.3 Database Subsystem Test Suite
All 11 database test suites passed (252 tests):
- `migration5.test.ts`
- `migration6.test.ts`
- `migration7.test.ts`
- `migration8.test.ts`
- `audit-repair.test.ts`
- `database.test.ts`
- `notifications.test.ts`
- `notification-workflow.test.ts`
- `notification-workflow-hardening.test.ts`
- `demo-reset.test.ts`
- `demo-notification-seeding.test.ts`

### 5.4 Repository-Wide Regression Suite
- **Suites:** 38 passed, 38 total
- **Tests:** 588 passed, 588 total
- **Failures:** 0

### 5.5 Scoped TypeScript Compilation Check
- **Scope:** `src/core`, `src/features/aes-guardian` (55 files)
- **Exit Code:** 0
- **Errors:** 0

### 5.6 Git Workspace Invariants
- **Branch:** `migration/aes-guardian`
- **Expected HEAD:** `d79b01ef51646509170996f8c77517f95470f217`
- **Actual HEAD:** `d79b01ef51646509170996f8c77517f95470f217`
- **Sanad-rn Original Repository:** Untouched
- **Policy Adherence:** Code-first, no emulator, no git commits, pushes, stashes, or resets.
