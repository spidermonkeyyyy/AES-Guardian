# AES Guardian — Phase 2D.2D Deliverable Report
## Deterministic Demo Notification Seeding & Transactional Reset Alignment

**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**Base HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Schema Version:** Version 8 (`in_app_notifications` table, 11 canonical event types)  
**Date:** 2026-11-14  

---

## 1. Executive Summary

Phase 2D.2D successfully extends the deterministic AES Guardian demonstration dataset with exactly **four baseline notification records** and aligns notification lifecycle handling with the existing transactional reset workflow.

Key achievements:
- **Exact Baseline Records**: Seeding produces exactly 4 canonical in-app notifications covering four key operational roles (`admin_reviewer`, `exposed_professional`, `oh_professional`, `quality_staff`).
- **Dynamic Recipient Resolution**: Recipients are queried dynamically by role from `demo_users` (`WHERE role = ?`). No user IDs are hardcoded.
- **Dynamic Entity Resolution**: Entity primary keys are resolved dynamically from seeded records via stable references (`AES-2026-DEMO-01`, `AES-2026-DEMO-02`, `AES-2026-DEMO-03`, `CAPA-2026-00001`).
- **Idempotency Guarantee**: Idempotency keys follow the canonical pattern `notif:<event_type>:<entity_type>:<entity_id>:<recipient_user_id>` with SQLite `ON CONFLICT(idempotency_key) DO NOTHING`. Multiple seeder executions produce zero duplicate records.
- **Transactional Reset Integrity**: `resetDemoScenario(techAdminId)` deletes `in_app_notifications` as Step 1 of the atomic transaction before clearing referenced records (`oh_follow_up_events`, `oh_coordinations`, `correction_responses`, `administrative_reviews`, `aes_declarations`, `prevention_actions`, `audit_events`), followed by deterministic re-seeding and `DEMO_DATA_RESET` audit logging.
- **Referential Integrity**: Verified with `PRAGMA foreign_key_check` yielding 0 violations after seeding and after repeated resets.
- **Full Test Validation**:
  - `demo-notification-seeding.test.ts`: **16/16 tests passing** (exceeds the 15 required).
  - All 5 notification/reset suites: **125/125 tests passing**.
  - Repository-wide test suite: **38 suites, 574 tests passing (0 failures)**.
  - TypeScript type check (`tsc --noEmit`): **0 errors, exit 0**.

---

## 2. Baseline Demonstration Notifications

The 4 deterministic baseline notification records inserted by `seedStandardScenario` are configured as follows:

| # | Event Type | Recipient Role | Target Record | Entity Type & Reference | Read State | `read_at` Timestamp | Idempotency Key Pattern |
|---|---|---|---|---|---|---|---|
| **1** | `declaration_submitted` | `admin_reviewer` | Declaration #1 (`AES-2026-DEMO-01`) | `aes_declaration` (`AES-2026-DEMO-01`) | **Unread** (`is_read = 0`) | `NULL` | `notif:declaration_submitted:aes_declaration:<decl1Id>:<adminUserId>` |
| **2** | `correction_requested` | `exposed_professional` | Review on Declaration #2 (`AES-2026-DEMO-02`) | `administrative_review` (`AES-2026-DEMO-02`) | **Unread** (`is_read = 0`) | `NULL` | `notif:correction_requested:administrative_review:<rev2Id>:<exposedUserId>` |
| **3** | `oh_coordination_created` | `oh_professional` | Coordination on Declaration #3 (`AES-2026-DEMO-03`) | `oh_coordination` (`AES-2026-DEMO-03`) | **Read** (`is_read = 1`) | `2026-11-05T10:30:00Z` | `notif:oh_coordination_created:oh_coordination:<coord3Id>:<ohUserId>` |
| **4** | `capa_created` | `quality_staff` | Prevention Action (`CAPA-2026-00001`) | `prevention_action` (`CAPA-2026-00001`) | **Read** (`is_read = 1`) | `2026-11-12T20:00:00Z` | `notif:capa_created:prevention_action:<capa1Id>:<qualityUserId>` |

### Title and Message Translation Keys
- Notification 1: `title_key = 'notification.declarationSubmitted.title'`, `message_key = 'notification.declarationSubmitted.message'`
- Notification 2: `title_key = 'notification.correctionRequested.title'`, `message_key = 'notification.correctionRequested.message'`
- Notification 3: `title_key = 'notification.ohCoordinationCreated.title'`, `message_key = 'notification.ohCoordinationCreated.message'`
- Notification 4: `title_key = 'notification.capaCreated.title'`, `message_key = 'notification.capaCreated.message'`

---

## 3. Dynamic Resolution Implementation Details

In `src/core/database/demo-scenario-seeder.ts`:

### 3.1 Recipient Resolution
```typescript
const userRows = await executor.query<{ id: number; role: string }>(
  `SELECT id, role FROM demo_users WHERE role IN ('exposed_professional','admin_reviewer','oh_professional','quality_staff')`,
);
let exposedUserId: number | null = null;
let adminUserId: number | null = null;
let ohUserId: number | null = null;
let qualityUserId: number | null = null;
for (const u of userRows.rows) {
  if (u.role === 'exposed_professional' && exposedUserId === null) exposedUserId = u.id;
  else if (u.role === 'admin_reviewer' && adminUserId === null) adminUserId = u.id;
  else if (u.role === 'oh_professional' && ohUserId === null) ohUserId = u.id;
  else if (u.role === 'quality_staff' && qualityUserId === null) qualityUserId = u.id;
}
```

### 3.2 Entity ID Resolution
- `decl1Id`: queried by `reference_number = 'AES-2026-DEMO-01'`
- `review2Id`: queried from `administrative_reviews` via join or declaration ID on `AES-2026-DEMO-02` where `outcome = 'correction_requested'`
- `coord3Id`: queried from `oh_coordinations` where `declaration_id` belongs to `AES-2026-DEMO-03`
- `capa1Id`: queried from `prevention_actions` where `reference_code = 'CAPA-2026-00001'`

---

## 4. Reset Alignment & Foreign Key Ordering

In `src/core/database/AesGuardianDatabase.ts`, `resetDemoScenario(userId: number)` executes within an atomic SQLite transaction:

```typescript
await this.db.transaction(async (tx) => {
  // 1. Delete in-app notifications (FK -> demo_users)
  await tx.execute(`DELETE FROM in_app_notifications;`);
  // 2. Delete dependent follow-up events (FK -> oh_coordinations)
  await tx.execute(`DELETE FROM oh_follow_up_events;`);
  // 3. Delete coordinations (FK -> aes_declarations)
  await tx.execute(`DELETE FROM oh_coordinations;`);
  // 4. Delete correction responses (FK -> administrative_reviews, aes_declarations)
  await tx.execute(`DELETE FROM correction_responses;`);
  // 5. Delete administrative reviews (FK -> aes_declarations)
  await tx.execute(`DELETE FROM administrative_reviews;`);
  // 6. Delete declarations
  await tx.execute(`DELETE FROM aes_declarations;`);
  // 7. Delete prevention actions (FK -> demo_users)
  await tx.execute(`DELETE FROM prevention_actions;`);
  // 8. Delete audit events
  await tx.execute(`DELETE FROM audit_events;`);

  // 9. Reseed standard demonstration dataset within this transaction
  await seedStandardScenario(tx);

  // 10. Record the demonstration reset audit event
  await tx.execute(
    `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description, occurred_at)
     VALUES ('DEMO_DATA_RESET', ?, 'system', NULL, ?, ?)`,
    [userId, "...", resetTimestamp],
  );
});
```

Because `in_app_notifications` is cleared before `aes_declarations`, `administrative_reviews`, and `oh_coordinations`, all foreign key constraints remain strictly satisfied throughout the reset without needing to disable `PRAGMA foreign_keys`.

---

## 5. Verification Test Suite

A dedicated native SQLite test suite was authored at `src/core/database/__tests__/demo-notification-seeding.test.ts`.

### 16 Test Cases Implemented and Verified:

1. **Baseline notification count**: `seedStandardScenario` produces exactly 4 baseline notifications.
2. **Notification 1 correctness**: `admin_reviewer` receives `declaration_submitted` for `AES-2026-DEMO-01`.
3. **Notification 2 correctness**: `exposed_professional` receives `correction_requested` for `AES-2026-DEMO-02`.
4. **Notification 3 correctness**: `oh_professional` receives `oh_coordination_created` for `AES-2026-DEMO-03`.
5. **Notification 4 correctness**: `quality_staff` receives `capa_created` for `CAPA-2026-00001`.
6. **Read states**: notifications 1 and 2 unread (`is_read = 0`, `read_at = NULL`), 3 and 4 read (`is_read = 1`, `read_at != NULL`).
7. **Payload integrity**: all 4 notifications have non-empty `title_key`, `message_key`, and valid `notif:` idempotency key.
8. **Dynamic recipient resolution**: recipient user IDs verified to map to the exact expected roles directly in `demo_users`.
9. **Dynamic entity ID resolution**: `entity_id` values match primary keys generated during that specific seed cycle.
10. **Seed idempotency**: calling `seedStandardScenario` twice still produces exactly 4 notifications.
11. **Idempotency key uniqueness**: all 4 idempotency keys are unique across the dataset.
12. **Reset FK constraint order**: `resetDemoScenario` safely deletes and reseeds without FK violations.
13. **Seed failure atomicity**: failure injected mid-seed leaves no dangling notification rows.
14. **Reset rollback on failure**: unauthorized reset attempt throws and leaves all 4 notifications intact.
15. **Multiple reset/reseed cycles**: consecutive reset/reseed cycles produce identical, clean 4-notification states with identical references.
16. **Referential integrity**: `PRAGMA foreign_key_check` returns 0 violations after seeding and after reset.

---

## 6. Full Test Execution Summary

### 6.1 Focused Seeding & Reset Suites
```
PASS src/core/database/__tests__/demo-notification-seeding.test.ts (16 tests)
PASS src/core/database/__tests__/demo-reset.test.ts (12 tests)
PASS src/core/database/__tests__/notifications.test.ts (32 tests)
PASS src/core/database/__tests__/notification-workflow.test.ts (15 tests)
PASS src/core/database/__tests__/notification-workflow-hardening.test.ts (50 tests)

Test Suites: 5 passed, 5 total
Tests:       125 passed, 125 total
Time:        9.539 s
```

### 6.2 Full Repository Jest Test Suite
```
Test Suites: 38 passed, 38 total
Tests:       574 passed, 574 total
Snapshots:   0 total
Time:        27.711 s
```
*Comparison with Phase 2D.2C.3.4 baseline:* 37 suites / 558 tests → **38 suites / 574 tests (+1 suite, +16 tests)**. Zero failures.

### 6.3 TypeScript Type Check
```powershell
Set-Location "C:\Users\User\Desktop\sure\sanad-rn-migration"; $files = Get-ChildItem -Path src/core, src/features/aes-guardian -Recurse -Include *.ts,*.tsx | ForEach-Object { $_.FullName }; npx tsc --noEmit --skipLibCheck --jsx react-jsx --esModuleInterop @files
```
**Exit code: 0** (0 errors).

---

## 7. Execution Policy Compliance

- **No commits or pushes**: `git status` shows uncommitted working directory changes only; HEAD remains at `d79b01ef51646509170996f8c77517f95470f217`.
- **No destructive operations**: No git reset, checkout, clean, or stash executed.
- **Original repository untouched**: Confirmed `C:\Users\User\Desktop\sure\sanad-rn` has not been modified.
- **No schema modifications**: Migration version remains at 8; no changes made to `in_app_notifications` table definition.
- **No UI changes**: Scope strictly confined to demo seeder, test suite, and reset alignment.
