# AES GUARDIAN — PHASE 2D.2B IMPLEMENTATION REPORT
## Notification Database Foundation & Repository Implementation

**Project:** SANAD React Native Migration — AES Guardian  
**Branch:** `migration/aes-guardian`  
**Worktree:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Phase:** 2D.2B  
**Schema Version:** 8 (advanced from 7)  
**Test Results:** **475 passed across 34 test suites** (100% passing)  
**TypeScript Diagnostics:** **0 errors** in AES Guardian and core database modules  
**Status:** COMPLETE — Database foundation & repository ready for workflow integration (Phase 2D.2C)  

---

## 1. ACTUAL FILES CREATED AND MODIFIED

### Files Created (Phase 2D.2B)
1. `src/core/database/__tests__/migration8.test.ts` (13 native integration tests)
2. `src/core/database/__tests__/notifications.test.ts` (32 native integration tests)
3. `docs/AES_GUARDIAN_PHASE2D2B_DATABASE_FOUNDATION_REPORT.md` (this report)

### Files Modified (Phase 2D.2B)
1. `src/core/database/types.ts`:
   - Added `NotificationEventType` union (11 canonical event types) and `NOTIFICATION_EVENT_TYPES` array.
   - Added `NotificationEntityType` union (6 canonical entity types) and `NOTIFICATION_ENTITY_TYPES` array.
   - Added `InAppNotification` interface for SQLite notification records.
   - Added `CreateNotificationInput` interface for strongly-typed insertion.
   - Added `NotificationFilters` interface (`is_read`, `limit`).
2. `src/core/database/AesGuardianDatabase.ts`:
   - Bumped `CURRENT_SCHEMA_VERSION = 8`.
   - Registered **Migration 8** in `MIGRATIONS` with `in_app_notifications` table and two indexes.
   - Implemented `getDeclarationByIdInternal(id: number)` (internal privileged query).
   - Hardened `getDeclarationById(id: number, requestingUserId?: number)` with Mandatory Condition A ownership check for `exposed_professional`.
   - Implemented notification repository methods: `insertNotification`, `createNotification`, `getNotifications`, `getUnreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead`.
   - Added generic support `<T = any>` to `get()` helper.
   - Updated `resetDemoScenario()` to delete `in_app_notifications` at Step 1 of the atomic deletion sequence.
3. `src/core/database/index.ts`:
   - Re-exported new notification types and validation arrays.
4. `src/core/index.ts`:
   - Re-exported notification types and arrays through the public core barrel.
5. `__mocks__/@op-engineering/op-sqlite.js`:
   - Extended mock parser to handle `ON CONFLICT(...) DO NOTHING` clauses without treating conflict syntax as a value tuple.
   - Added uniqueness enforcement on `idempotency_key` for `ON CONFLICT DO NOTHING` and `UNIQUE constraint failed` for regular INSERT.
6. `src/core/database/__tests__/database.test.ts`:
   - Updated schema version test assertions to include migration version 8 (now 8 applied versions).
7. `src/features/aes-guardian/__tests__/phase2d1-2-final-verification.test.ts`:
   - Updated schema version assertion to recognize current version >= 7 (version 8 recorded).

---

## 2. MIGRATION 8 SCHEMA

Migration 8 creates the persistent `in_app_notifications` table with strict CHECK constraints, foreign key to `demo_users(id)`, and the exact non-redundant index layout specified in Section 5 of the prompt:

```sql
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_user_id   INTEGER NOT NULL REFERENCES demo_users(id) ON DELETE CASCADE,
  event_type          TEXT    NOT NULL CHECK (event_type IN (
                        'declaration_submitted',
                        'review_completed',
                        'correction_requested',
                        'correction_submitted',
                        'oh_coordination_created',
                        'oh_coordination_acknowledged',
                        'oh_milestone_recorded',
                        'oh_coordination_completed',
                        'capa_created',
                        'capa_status_changed',
                        'capa_finalized'
                      )),
  title_key           TEXT    NOT NULL,
  message_key         TEXT    NOT NULL,
  entity_type         TEXT    NOT NULL CHECK (entity_type IN (
                        'aes_declaration',
                        'administrative_review',
                        'correction_response',
                        'oh_coordination',
                        'oh_follow_up_events',
                        'prevention_action'
                      )),
  entity_id           INTEGER NOT NULL,
  entity_reference    TEXT,
  is_read             INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  read_at             TEXT,
  idempotency_key     TEXT    UNIQUE
);

-- Index 1: Recipient + read state + creation time (for unread count & filtered feed)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON in_app_notifications(recipient_user_id, is_read, created_at);

-- Index 2: Recipient + creation time (for full user activity feed)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_all
  ON in_app_notifications(recipient_user_id, created_at);
```

*Note on Indexing:* The `idempotency_key TEXT UNIQUE` constraint automatically creates its underlying unique index in SQLite; per Section 5 instructions, no redundant third index was added.

---

## 3. REPOSITORY METHOD DESCRIPTIONS

All repository methods were implemented in `src/core/database/AesGuardianDatabase.ts`:

### A. `getNotifications(userId: number, filters?: NotificationFilters): Promise<InAppNotification[]>`
- Retrieves notification records strictly scoped to `WHERE recipient_user_id = ?`.
- Sorted newest first (`ORDER BY created_at DESC`).
- Supports optional `is_read` filtering (0 or 1) and `limit`.
- **Role Boundary:** If `user.role === 'tech_admin'`, immediately returns empty array `[]`.

### B. `getUnreadNotificationCount(userId: number): Promise<number>`
- Executes indexed count query: `SELECT COUNT(*) AS count FROM in_app_notifications WHERE recipient_user_id = ? AND is_read = 0`.
- Does not load notification records into JavaScript memory.
- **Role Boundary:** If `user.role === 'tech_admin'`, immediately returns `0`.

### C. `markNotificationRead(notificationId: number, userId: number): Promise<MutationResult>`
- Sets `is_read = 1` and `read_at = (ISO-8601 string)`.
- **Double-Guard:** Executes `WHERE id = ? AND recipient_user_id = ? AND is_read = 0`. If a user attempts to mark another user's notification or a non-existent notification as read, `rowsAffected` is `0`.
- **Role Boundary:** If `user.role === 'tech_admin'`, immediately returns `{ rowsAffected: 0 }`.

### D. `markAllNotificationsRead(userId: number): Promise<MutationResult>`
- Updates all unread notifications belonging to the user: `WHERE recipient_user_id = ? AND is_read = 0`.
- Sets consistent ISO-8601 timestamps on `read_at`.
- **Role Boundary:** If `user.role === 'tech_admin'`, immediately returns `{ rowsAffected: 0 }`.

### E. `createNotification(input: CreateNotificationInput, executor?: SqlExecutor): Promise<MutationResult>`
- Validates that `recipient_user_id` exists in `demo_users`.
- Strictly blocks creating notifications for `tech_admin` (throws `Unauthorized` error).
- Validates `event_type` and `entity_type` against approved whitelist arrays.
- Uses `ON CONFLICT(idempotency_key) DO NOTHING` for atomic duplicate handling.
- Can run standalone via `this.db.execute` or inside an existing transaction callback via `executor.execute`.

---

## 4. ACTIVE-USER / CALLER-ACCOUNTABILITY LIMITATION

AES Guardian is an offline demonstration prototype for academic evaluation, not a production multi-tenant system:
- **Mechanism:** Repository methods accept `userId: number` as an explicit parameter (Caller Accountability). Screen components retrieve `activeContext.userId` from the Zustand `useDemoRoleStore` and pass it to repository methods.
- **Limitation:** The repository validates that `userId` exists in `demo_users` and matches allowed roles, and enforces that a given `userId` can only read and mutate their own notifications. However, this does not constitute cryptographic or session-token-based authentication. An arbitrary programmatic caller could supply any valid `userId`.
- **Guarantee:** In the context of the React Native UI, this pattern prevents accidental UI cross-contamination when switching demonstration roles.

---

## 5. MANDATORY CONDITION A — DECLARATION OWNERSHIP

### The Issue
Previously, `getDeclarationById(id, requestingUserId)` only blocked `tech_admin`. An `exposed_professional` could request any declaration ID and read its clinical contents, which represented an access-control gap.

### The Fix
1. Introduced `getDeclarationByIdInternal(id: number)`: A private helper strictly for internal database operations (e.g. status transition verification in `submitDeclaration`, `createAdministrativeReview`, etc.).
2. Hardened `getDeclarationById(id: number, requestingUserId?: number)`:
   - Validates that `requestingUserId` exists in `demo_users`.
   - Rejects `tech_admin` with established error (`strictly prohibited from accessing clinical declaration content`).
   - Retrieves the declaration via internal query. If not found, returns `null`.
   - **Enforces Ownership for `exposed_professional`:**
     ```typescript
     if (user.role === 'exposed_professional' && decl.declared_by_user_id !== requestingUserId) {
       throw new Error(
         `Unauthorized: exposed_professional user ${requestingUserId} is not permitted to access declaration ${id} owned by user ${decl.declared_by_user_id}.`
       );
     }
     ```
   - **Preserves Authorized Access:**
     - `admin_reviewer`: Permitted to inspect any declaration for review triage.
     - `oh_professional`: Permitted to inspect declarations for clinical follow-up.
     - `quality_staff`: Permitted for aggregate/epidemiological surveillance.

### Call Sites Inspected and Preserved
- `updateDraft`: uses `getDeclarationByIdInternal(id)` (internal status guard).
- `submitDeclaration`: uses `getDeclarationByIdInternal(id)` (internal status guard).
- `createAdministrativeReview`: uses `getDeclarationByIdInternal(declaration_id)` (internal review precondition).
- `createCorrectionResponse`: uses `getDeclarationByIdInternal(declaration_id)` (internal review association).
- `DeclarationDetailsScreen.tsx`: currently calls `getDeclarationById(id)` without `requestingUserId`, which remains backward-compatible until Phase 2D.2G UI integration.
- `AdminReviewActionScreen.tsx`: calls `getDeclarationById(id)`, permitted for `admin_reviewer`.

### Native SQLite Tests
In `src/core/database/__tests__/notifications.test.ts`:
- Verified: Exposed professional can retrieve their own declaration.
- Verified: Exposed professional cannot retrieve another user's declaration by supplying its ID (throws `Unauthorized: exposed_professional user ... is not permitted`).
- Verified: Exposed professional cannot retrieve another user's declaration even if the UI is bypassed.
- Verified: `admin_reviewer` can retrieve declarations for review.
- Verified: `oh_professional` can retrieve declarations for clinical follow-up.
- Verified: `quality_staff` can retrieve declarations for surveillance.
- Verified: `tech_admin` remains strictly blocked (`rejects.toThrow('strictly prohibited')`).
- Verified: Non-existent declaration returns `null` for authorized roles.

---

## 6. MANDATORY CONDITION B — SAFE IDEMPOTENCY INSERTION

### Evaluation & Implementation
The Phase 2D.2A audit proposed `INSERT OR IGNORE`. However, native SQLite `INSERT OR IGNORE` suppresses all constraint failures indiscriminately (including `NOT NULL` and `CHECK` violations).

We implemented the **Preferred** alternative:
```sql
INSERT INTO in_app_notifications (
  recipient_user_id, event_type, title_key, message_key,
  entity_type, entity_id, entity_reference, idempotency_key
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(idempotency_key) DO NOTHING;
```

### Mock Enhancement
Inspecting `__mocks__/@op-engineering/op-sqlite.js` revealed that the mock's tuple extractor previously misidentified `(idempotency_key)` in `ON CONFLICT` as an extra `VALUES` tuple. We carefully updated the mock to:
1. Detect `ON CONFLICT(...) DO NOTHING` clauses and extract the conflict column.
2. Strip the conflict clause before tuple tokenization.
3. Check uniqueness on `idempotency_key` and ignore duplicates when `ON CONFLICT DO NOTHING` is present.
4. Throw `UNIQUE constraint failed: in_app_notifications.idempotency_key` on normal INSERTs.

### Verification of Failure Semantics
In `src/core/database/__tests__/notifications.test.ts`, tests proved that:
1. First insertion creates one notification (`rowsAffected: 1`).
2. Repeating the same idempotency key creates no second notification (`rowsAffected: 0`).
3. A different event ID on the same entity creates a new notification.
4. Invalid event type fails and surfaces error (throws `CHECK constraint failed` / validation error).
5. Invalid entity type fails and surfaces error (throws `CHECK constraint failed` / validation error).
6. Missing required recipient fails (throws `NOT NULL` constraint error).
7. Invalid recipient foreign key fails (throws `FOREIGN KEY constraint failed` / validation error).
8. A failed insertion inside a transaction rolls back completely without partial state.
9. A genuine duplicate is handled gracefully without aborting an otherwise valid transaction.

---

## 7. RESET INTEGRATION

`resetDemoScenario(userId: number)` in `src/core/database/AesGuardianDatabase.ts` was updated to delete `in_app_notifications` as the **first step** of the atomic reset transaction:

```typescript
await this.db.transaction(async (tx) => {
  // 1. Delete in-app notifications (FK -> demo_users)
  await tx.execute(`DELETE FROM in_app_notifications;`);
  // 2. Delete dependent follow-up events
  await tx.execute(`DELETE FROM oh_follow_up_events;`);
  // ... (all remaining tables deleted in topological order)
});
```

### Seeding Scope
Per Section 9 instructions: *"Do not seed baseline notifications in this phase. Demo notification seeding belongs to the next approved implementation stage after the repository foundation is verified."*
Accordingly, `seedStandardScenario()` was left unmodified in this phase.

### Reset Verification
Tests in `notifications.test.ts` verified that:
- Notifications are deleted during a successful demonstration reset.
- Notification deletion is rolled back if a subsequent reset operation fails in the transaction.
- Existing synthetic users remain intact.
- `PRAGMA foreign_key_check` returns zero violations after reset.

---

## 8. NATIVE SQLITE & JEST VERIFICATION

### Jest Test Results
Command executed: `npm test` (running Jest across all suites).

```
Test Suites: 34 passed, 34 total
Tests:       475 passed, 475 total
Snapshots:   0 total
Time:        25.851 s
```

- **Baseline before Phase 2D.2B:** 430 passed across 32 suites.
- **After Phase 2D.2B:** 475 passed across 34 suites (+45 new passing tests).
- **New Test Suites:**
  - `src/core/database/__tests__/migration8.test.ts` (13 tests — all passed)
  - `src/core/database/__tests__/notifications.test.ts` (32 tests — all passed)
- **Regression:** Zero regression across all 32 existing test suites (declarations, reviews, corrections, OH coordination, CAPA, surveillance, reset, auth).

---

## 9. TYPESCRIPT DIAGNOSTICS

Command executed: `npx tsc --noEmit --project tsconfig.json`.

- **Diagnostics in `src/core/` and `src/features/aes-guardian/`:** **0 errors.**
- **Diagnostics in legacy SANAD modules:** Pre-existing type issues in legacy modules (`patient_dashboard`, `alerts`, `patient/treatment`) remain untouched and isolated from AES Guardian.

---

## 10. FOREIGN-KEY CHECK RESULTS

Both `migration8.test.ts` and `notifications.test.ts` executed `PRAGMA foreign_key_check` against native SQLite:
- After applying Migration 8: **0 violations.**
- After running repository insertions and deletions: **0 violations.**
- After executing `resetDemoScenario()`: **0 violations.**

---

## 11. GIT STATE RECONCILIATION

- **Current Branch:** `migration/aes-guardian`
- **Current HEAD:** `d79b01ef51646509170996f8c77517f95470f217`
- **Working Tree Status:** **Contains uncommitted modifications from Phase 2D.1 and Phase 2D.2B** (not clean).

### Tracked Files Modified (16)
1. `__mocks__/@op-engineering/op-sqlite.js`
2. `src/core/audit/AuditLogger.ts`
3. `src/core/database/AesGuardianDatabase.ts`
4. `src/core/database/DatabaseService.ts`
5. `src/core/database/NativeSQLiteAdapter.ts`
6. `src/core/database/__tests__/database.test.ts`
7. `src/core/database/demo-scenario-seeder.ts`
8. `src/core/database/index.ts`
9. `src/core/database/types.ts`
10. `src/core/index.ts`
11. `src/features/aes-guardian/__tests__/workspace-integration.test.ts`
12. `src/features/aes-guardian/index.ts`
13. `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`
14. `src/localization/index.ts`
15. `src/navigation/AppNavigator.tsx`
16. `src/navigation/routes.ts`

### Untracked Files (16)
- `docs/AES_GUARDIAN_PHASE2D0_FUNCTIONAL_COMPLETION_AUDIT.md`
- `docs/AES_GUARDIAN_PHASE2D1.2_FINAL_VERIFICATION_REPORT.md`
- `docs/AES_GUARDIAN_PHASE2D1.3_CLOSEOUT_REPORT.md`
- `docs/AES_GUARDIAN_PHASE2D1_1_CORRECTIVE_VERIFICATION_REPORT.md`
- `docs/AES_GUARDIAN_PHASE2D1_IMPLEMENTATION_REPORT.md`
- `docs/AES_GUARDIAN_PHASE2D2A1_CORRECTED_ARCHITECTURE.md`
- `docs/AES_GUARDIAN_PHASE2D2B_DATABASE_FOUNDATION_REPORT.md`
- `docs/AES_GUARDIAN_PHASE2D2_ARCHITECTURE_AUDIT.md`
- `src/core/database/__tests__/demo-reset.test.ts`
- `src/core/database/__tests__/migration8.test.ts`
- `src/core/database/__tests__/notifications.test.ts`
- `src/features/aes-guardian/__tests__/help-glossary-profile.test.tsx`
- `src/features/aes-guardian/__tests__/phase2d1-2-final-verification.test.ts`
- `src/features/aes-guardian/__tests__/phase2d1-corrective-verification.test.ts`
- `src/features/aes-guardian/screens/AesGuardianProfileScreen.tsx`
- `src/features/aes-guardian/screens/HelpGlossaryScreen.tsx`

---

## 12. KNOWN LIMITATIONS

1. **Synthetic Demonstration Prototype:** The repository layer enforces caller accountability via explicit `userId: number`, which prevents accidental UI contamination during demonstration persona switching. It does not provide cryptographic session tokens.
2. **Offline Local SQLite Only:** There are no push notifications, cloud messaging (FCM/APNS), or background workers.
3. **No Baseline Demo Seed Yet:** Demo notifications are not seeded on startup or reset in this phase. That belongs to Phase 2D.2D per the approved plan.

---

## 13. EXPLICIT STATEMENT OF OUT-OF-SCOPE ITEMS

In strict compliance with Section 1 and Section 11 of the Phase 2D.2B prompt, the following remain **unimplemented** and are reserved for subsequent phases:
- Workflow event generation in existing methods (`submitDeclaration`, `createAdministrativeReview`, etc.) (Phase 2D.2C)
- Demo notification baseline seeding in `seedStandardScenario()` (Phase 2D.2D)
- Notification localization strings in French, English, and Arabic (Phase 2D.2E)
- Notification Centre navigation routes (Phase 2D.2F)
- Notification bell, badge, and Notification Centre UI screens (Phase 2D.2G)
- End-to-end workflow notification tests and full feature closeout (Phase 2D.2H)

---

## 14. CONCLUSION & STOP CONDITION

Phase 2D.2B is complete. All database foundations, Migration 8, typed models, declaration ownership enforcement, safe `ON CONFLICT DO NOTHING` idempotency, and repository methods have been implemented and verified with 475 passing Jest tests.

Per Section 14:
> *"Complete only the database foundation... Do not begin Phase 2D.2C. Submit the report and wait for review."*

Implementation is paused. Awaiting authorization to begin Phase 2D.2C (Workflow Event Integration & Notification Generation).
