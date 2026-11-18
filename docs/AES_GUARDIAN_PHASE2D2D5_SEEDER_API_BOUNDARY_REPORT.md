# AES Guardian — Phase 2D.2D.5
## Transaction Registration Capability Removal & Seeder API Boundary Report

**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Current Schema:** Version 8 (`in_app_notifications` with 11 canonical event types)  
**Preceding Phase:** 2D.2D.4 — Runtime Transaction Executor Authenticity & Type-Guard Cleanup  
**Status:** ✅ CLOSED

---

## 1. Executive Summary & Objective

Phase 2D.2D.5 resolves the transaction-authenticity vulnerability identified in Phase 2D.2D.4:
- In Phase 2D.2D.4, while the `WeakSet` registry was module-private to `types.ts`, the exported registration function `registerTransactionExecutor()` allowed any importing module to grant authenticity to arbitrary objects.
- Furthermore, the public `seedStandardScenario(executor: SeederExecutor)` union accepted a `TransactionExecutor` directly, allowing external callers to bypass transaction creation.

In Phase 2D.2D.5, the architecture was refactored:
1. **Removed the Public Registration Capability**: `registerTransactionExecutor` and `ACTIVE_TRANSACTION_EXECUTORS` were moved to an internal module (`src/core/database/transaction-registry.ts`) that is **never exported** through any public barrel (`index.ts` or `src/core/index.ts`).
2. **Hardened the Public Seeder API**: `seedStandardScenario(db: TransactionalDatabase)` now strictly accepts only a `TransactionalDatabase`. It unconditionally opens exactly one transaction and delegates execution to the internal seeder within the transaction callback.
3. **Encapsulated Internal Reseed Path**: `AesGuardianDatabase.resetDemoScenario()` invokes `seedStandardScenarioInTransaction(tx)` inside its own outer transaction. This function is not exported in public barrel files.
4. **Verification**: 41/41 targeted tests pass in `demo-notification-seeding.test.ts`, all 263 database tests pass, all 599 workspace tests pass across 38 suites, and scoped TypeScript compilation exits with code 0.

---

## 2. Architecture & API Boundary Refactor

### 2.1 Public vs Internal Seeder API Signatures

```typescript
// ─── Public API (src/core/database/index.ts & src/core/index.ts) ─────────────
/**
 * Public standalone seeding entry point.
 * Accepts only a TransactionalDatabase instance.
 * Unconditionally initiates exactly one atomic transaction.
 */
export async function seedStandardScenario(db: TransactionalDatabase): Promise<SeedResult>;

// ─── Internal Package API (src/core/database/demo-scenario-seeder.ts) ────────
/**
 * Internal within-transaction seed entry point.
 * NOT exported through public barrels.
 * Used exclusively by AesGuardianDatabase.resetDemoScenario().
 */
export async function seedStandardScenarioInTransaction(tx: TransactionExecutor): Promise<SeedResult>;
```

### 2.2 Reset/Reseed Transaction Ownership

`AesGuardianDatabase.resetDemoScenario(userId: number)` maintains strict single-transaction atomicity:
1. Validates that `userId` has role `tech_admin`.
2. Initiates an outer transaction: `await this.db.transaction(async (tx) => { ... })`.
3. Performs destructive deletions across 8 tables (`in_app_notifications`, `oh_follow_up_events`, `oh_coordinations`, `correction_responses`, `administrative_reviews`, `aes_declarations`, `prevention_actions`, `audit_events`).
4. Invokes `seedStandardScenarioInTransaction(tx)` passing the genuine, adapter-constructed `TransactionExecutor`. No nested transaction is opened.
5. Inserts the `DEMO_DATA_RESET` audit event within the same transaction.
6. The database adapter commits the outer transaction upon callback completion.

### 2.3 Registration Capability Encapsulation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ src/core/database/transaction-registry.ts (INTERNAL MODULE - NOT IN BARREL) │
│                                                                             │
│   const ACTIVE_TRANSACTION_EXECUTORS = new WeakSet<object>();               │
│   export function registerTransactionExecutor<T>(tx: T): T                  │
│   export function isRegisteredTransactionExecutor(obj: unknown): boolean    │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ (Intra-package imports only)
            ┌─────────────────────────┴────────────────────────┐
            ▼                                                  ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│ DatabaseService.transaction  │              │ NativeSQLiteAdapter.transact │
│ (Registers tx during build)  │              │ (Registers tx during build)  │
└──────────────────────────────┘              └──────────────────────────────┘
```

Neither `registerTransactionExecutor` nor `isRegisteredTransactionExecutor` is accessible via `import from 'src/core'` or `import from 'src/core/database'`.

---

## 3. Public Barrel & Export Inspection

Dynamic runtime inspection of `src/core/database` and `src/core` barrels confirms:

| Export Identifier | In `src/core/database` Barrel? | In `src/core` Barrel? | Status |
|---|---|---|---|
| `registerTransactionExecutor` | ❌ No (`undefined`) | ❌ No (`undefined`) | Fully encapsulated |
| `isRegisteredTransactionExecutor` | ❌ No (`undefined`) | ❌ No (`undefined`) | Fully encapsulated |
| `seedStandardScenarioInTransaction` | ❌ No (`undefined`) | ❌ No (`undefined`) | Internal to package |
| `isTransactionExecutor` | ❌ No (`undefined`) | ❌ No (`undefined`) | Internal type guard |
| `isTransactionalDatabase` | ❌ No (`undefined`) | ❌ No (`undefined`) | Internal type guard |
| `SeederExecutor` | ❌ No (Type erased) | ❌ No (Type erased) | Deprecated & removed |
| `seedStandardScenario` | ✅ Yes (Function) | ✅ Yes (Function) | Accepts `TransactionalDatabase` only |
| `seedDemoScenarioIfEmpty` | ✅ Yes (Function) | ✅ Yes (Function) | Accepts `AesGuardianDatabase` only |

---

## 4. Test Evidence & Regression Results

### 4.1 Target Seeding Suite (`demo-notification-seeding.test.ts`)
41 passed out of 41 tests across 7 comprehensive parts:

- **Part 1:** Baseline notification count & granular specifications (10 tests)
  - Exactly 4 baseline notifications exist after standard scenario seeding.
  - Notification 1: `admin_reviewer` receives `declaration_submitted` for `AES-2026-DEMO-01` (unread).
  - Notification 2: `exposed_professional` receives `correction_requested` for `AES-2026-DEMO-02` (unread).
  - Notification 3: `oh_professional` receives `oh_coordination_created` for `AES-2026-DEMO-03` (read).
  - Notification 4: `quality_staff` receives `capa_created` for `CAPA-2026-00001` (read).
  - Valid translation keys, idempotency keys, and zero FK violations.
- **Part 2:** Reset rollback after destructive operations (3 tests)
  - Full rollback across 8 tables when failure occurs mid-reset.
  - Reset cleans notifications prior to parent entities.
  - Unauthorized reset attempts by non-`tech_admin` roles are rejected with zero database mutation.
- **Part 3:** Complete seed rollback (1 test)
  - Mid-notification seeding failure rolls back both business records and partial notifications.
- **Part 4:** Recipient resolution invariant and hardening (6 tests)
  - Missing required roles (`exposed_professional`, `admin_reviewer`, `oh_professional`, `quality_staff`) abort seeding without partial inserts.
  - Deterministic resolution selects canonical user (`ORDER BY id ASC LIMIT 1`).
  - Scan-order invariant verification.
- **Part 5:** Repeated reset/reseed across at least 3 cycles (2 tests)
  - Dynamic PK resolution and AUTOINCREMENT advancement verified across 3 complete cycles.
  - `PRAGMA foreign_key_check` yields 0 violations.
- **Part 6:** Dynamic recipient invariant & non-canonical user IDs (3 tests)
  - Dynamic resolution functions correctly when IDs are non-sequential (101, 202, 303, 404, 505).
  - Verification that hardcoded IDs (1, 2, 3, 4) would trigger foreign key failures.
  - `tech_admin` strictly barred from receiving operational notifications.
- **Part 7:** Transaction boundary, ownership & nesting verification (16 tests)
  - Standalone `seedStandardScenario(db)` executes in exactly 1 transaction.
  - `resetDemoScenario(techAdminId)` executes in exactly 1 outer transaction with 0 nested transactions.
  - `seedStandardScenarioInTransaction(tx)` executes inside caller-owned transaction with 0 nested transactions.
  - `seedStandardScenario` rejects objects without `.transaction()` (`fakeExecutor`, `{ inTransaction: true }`, plain executors).
  - `seedStandardScenario` rejects genuine `TransactionExecutor` (forces use of `TransactionalDatabase` for public entry point).
  - Public barrels verified free of `registerTransactionExecutor`, `isRegisteredTransactionExecutor`, `seedStandardScenarioInTransaction`, `isTransactionExecutor`, and `isTransactionalDatabase`.
  - Copied/spread objects (`{ ...tx }`, `Object.assign({}, tx)`) and method-only impostors rejected.
  - `DatabaseService.transaction` returns callback result and rolls back on failure.
  - `NativeSQLiteAdapter.transaction` rolls back on failure.
  - Commit failures propagate and reject without false success.
  - Transaction contexts cannot be reused after completion (commit or rollback) and throw `TransactionContextError`.

### 4.2 Full Database Layer Test Suite
```
PASS src/core/database/__tests__/audit-repair.test.ts
PASS src/core/database/__tests__/notification-workflow.test.ts
PASS src/core/database/__tests__/migration5.test.ts
PASS src/core/database/__tests__/migration8.test.ts
PASS src/core/database/__tests__/notifications.test.ts
PASS src/core/database/__tests__/demo-reset.test.ts
PASS src/core/database/__tests__/database.test.ts
PASS src/core/database/__tests__/migration7.test.ts
PASS src/core/database/__tests__/migration6.test.ts
PASS src/core/database/__tests__/demo-notification-seeding.test.ts
PASS src/core/database/__tests__/notification-workflow-hardening.test.ts

Test Suites: 11 passed, 11 total
Tests:       263 passed, 263 total
```

### 4.3 Workspace Full Jest Suite
```
Test Suites: 38 passed, 38 total
Tests:       599 passed, 599 total
Snapshots:   0 total
Time:        24.291 s
```

### 4.4 Scoped TypeScript Compilation Check
```powershell
$files = Get-ChildItem -Path src/core, src/features/aes-guardian -Recurse -Include *.ts,*.tsx | ForEach-Object { $_.FullName }
npx tsc --noEmit --skipLibCheck --jsx react-jsx --esModuleInterop @files
# Exit code: 0
```

---

## 5. Trust Boundary Statement

1. **Application Layer & External Callers**:
   - Cannot construct a valid `TransactionExecutor` because the registration WeakSet and factory functions are completely unexported.
   - Cannot pass an ordinary object or fake executor to `seedStandardScenario` because it validates `typeof db.transaction === 'function'`.
   - Cannot bypass transaction boundaries using `{ inTransaction: true }` because caller-supplied assertion flags are not recognized.
2. **Package Boundary**:
   - `AesGuardianDatabase` owns the transaction lifecycle for composite workflows (such as demo scenario resets). It initiates genuine transactions via its database adapter and passes the authenticated executor to `seedStandardScenarioInTransaction(tx)`.
3. **Execution Runtime Boundary**:
   - JavaScript modules executed within the same Node/Hermes process with unrestricted memory or source access could theoretically inspect module closures, but this implementation satisfies strict API encapsulation and compile-time/runtime boundaries against caller forgery.

---

## 6. Git Status & Repository Invariants

- **Branch:** `migration/aes-guardian`
- **HEAD:** `d79b01ef51646509170996f8c77517f95470f217`
- **Git Invariant:** Clean tree relative to starting state; no unauthorized commits, pushes, stashes, or resets performed.
- **Original Repository:** `sanad-rn` remains untouched.

---

## 7. Next Steps

Phase 2D.2D.5 is fully closed and verified.
Awaiting user instructions before proceeding to Phase 2D.2E (In-App Notification Center UI & Screen Navigation).
