# AES GUARDIAN — PHASE 2D.2A.1
## Notification Architecture Audit Corrections & Implementation Readiness

**Project:** SANAD React Native Migration — AES Guardian  
**Branch:** `migration/aes-guardian`  
**Phase:** 2D.2A.1 (Corrected Architecture Specification)  
**Date:** November 13, 2026  
**Status:** AUDIT & SPECIFICATION COMPLETE — Awaiting Review & Approval  
**Supersedes:** `docs/AES_GUARDIAN_PHASE2D2_ARCHITECTURE_AUDIT.md`  

---

## 1. SUMMARY OF CORRECTIONS

This document resolves the ambiguities, contradictions, and technical gaps identified in the Phase 2D.2A audit through direct code inspection of the `migration/aes-guardian` branch (commit `d79b01ef51646509170996f8c77517f95470f217`).

| # | Topic | Phase 2D.2A Flaw / Ambiguity | Verified Reality & Correction Applied |
|---|---|---|---|
| **C1** | **Active-User Identity Source** | Referenced non-existent file `demo-role-store.ts` and non-existent function `getActiveContext()` | The actual file is `src/core/auth/use-demo-role.ts`. The Zustand store is `useDemoRoleStore`. Components read `activeContext.userId` directly from store state. Repository methods accept `userId` as an explicit parameter (caller accountability). |
| **C2** | **CAPA Recipient Conflict** | Events 9–11 listed both `quality_staff` (User 4) and `admin_reviewer` (User 2) as recipients without justification | `admin_reviewer` has read-only permission (`canViewPreventionActions`) but zero operational responsibility on CAPAs (no approval, no handoff). Notifying them violates the project rule against notifying roles merely for read access. For `quality_staff`, since they are the sole actor, runtime notifications represent self-notifications. This document provides the architectural decision: either treat as an in-app activity feed for `quality_staff` (User 4) or defer runtime generation, while retaining the baseline seeded notification (`CAPA-2026-00001`, `read=1`). |
| **C3** | **Multi-Event Entity Idempotency** | Proposed idempotency keys like `notif:review_completed:aes_declaration:{id}:1` which collide when multiple reviews occur on one declaration | Idempotency keys now use the primary key of the **specific event record** (`reviewId`, `responseId`, `eventId`), plus status suffixes for lifecycle transitions (`actionId:newStatus`). |
| **C4** | **SQL Conflict Handling** | Suggested `ON CONFLICT(idempotency_key) DO NOTHING` as an alternative to `INSERT OR IGNORE` | Inspecting `__mocks__/@op-engineering/op-sqlite.js` revealed regex `/INSERT(?:\s+OR\s+IGNORE)?\s+INTO/i`. The mock has **no parsing or handling for `ON CONFLICT` syntax**. `INSERT OR IGNORE` is strictly required for test compatibility. |
| **C5** | **Transaction Boundaries (`createOhFollowUpEvent`)** | Stated method should be wrapped, but did not note that it currently performs two separate, non-atomic `this.db.execute` calls (INSERT event + conditional UPDATE coordination) | Both statements must be wrapped inside a single `this.db.transaction(async tx => { ... })` and executed via `tx.execute`. |
| **C6** | **Transaction Boundaries (`createPreventionAction` & `updatePreventionActionStatus`)** | Stated methods should be wrapped, but did not address audit logging | Both methods currently call `this.logAuditEvent()`, which executes a separate `this.db.execute` on the main connection. Calling this inside a transaction bypasses transaction atomicity. The audit INSERT must be inlined using `tx.execute`. |
| **C7** | **Entity ID Acquisition in Transactions** | Omitted how notification INSERT receives entity IDs inside transactions | For new entities, `insertId` from the primary `tx.execute` call is captured. For methods needing recipient IDs from related tables (e.g. `declared_by_user_id`), queries are executed **prior to the transaction** using `this.db.query`, and values are closed over. |
| **C8** | **Seed Notification Entity IDs** | Proposed hardcoded IDs (e.g. `1`, `2`) without accounting for SQLite `AUTOINCREMENT` behavior on reset | SQLite `DELETE FROM` does not reset `sqlite_sequence`. Post-reset declaration IDs will exceed 4. The seeder must resolve entity IDs dynamically via `SELECT id FROM aes_declarations WHERE reference_number = ?`. |
| **C9** | **Clinical Privacy in `entity_reference`** | Not explicitly verified | Verified: `reference_number` (`AES-2026-DEMO-01`) and `reference_code` (`CAPA-2026-00001`) are administrative reference strings with zero clinical, anatomical, or lab data. Safe for notification storage. |
| **C10** | **Polymorphic Entity Schema** | Omitted `'oh_follow_up_events'` from `entity_type` CHECK constraint | Added `'oh_follow_up_events'` to the `entity_type` CHECK list in Migration 8 to support milestone notifications referencing event primary keys. |

---

## 2. VERIFIED ACTIVE-USER IDENTITY ARCHITECTURE

### 2.1 Actual Identity Mechanism

The application establishes the active synthetic demonstration user via a Zustand in-memory store defined in:
`src/core/auth/use-demo-role.ts` (`useDemoRoleStore`).

```typescript
// Store shape in use-demo-role.ts
export interface DemoRoleState {
  activeRole: AesGuardianRole;
  activeContext: AuthContext;
  setRole: (role: AesGuardianRole) => void;
  // Derived permission booleans (canDeclare, canReview, canCoordinate, etc.)
}
```

The `AuthContext` interface (from `src/core/auth/boundaries.ts`) defines:
```typescript
export interface AuthContext {
  isAuthenticated: boolean;
  role: AesGuardianRole | 'unauthenticated';
  displayName: string | null;
  userId: number | null; // Canonical reference to demo_users.id
}
```

When a user switches roles in the UI (via the demonstration role selector), `setRole(role)` replaces `activeContext` with one of the predefined constants:
- `SYNTHETIC_DEMO_CONTEXT` (`userId: 1`, role: `exposed_professional`)
- `SYNTHETIC_ADMIN_REVIEWER_CONTEXT` (`userId: 2`, role: `admin_reviewer`)
- `SYNTHETIC_OH_PROFESSIONAL_CONTEXT` (`userId: 3`, role: `oh_professional`)
- `SYNTHETIC_QUALITY_STAFF_CONTEXT` (`userId: 4`, role: `quality_staff`)
- `SYNTHETIC_TECH_ADMIN_CONTEXT` (`userId: 5`, role: `tech_admin`)

**There is no `getActiveContext()` function.** Components retrieve the active identity using the hook:
```typescript
const { activeContext } = useDemoRoleStore();
const userId = activeContext.userId;
```

### 2.2 Canonical Synthetic User Map

| `userId` | `username` | `role` | `displayName` | Operational Notifications Permitted? |
|---|---|---|---|---|
| **1** | `prof.demo.expose` | `exposed_professional` | Professionnel Démo (Synthétique) | **Yes** (declaration reviews, corrections, OH milestones) |
| **2** | `admin.demo.review` | `admin_reviewer` | Administrateur RH (Démo) | **Yes** (declarations submitted, corrections submitted) |
| **3** | `medecin.demo.sst` | `oh_professional` | Médecin du Travail (Démo) | **Yes** (OH coordinations created) |
| **4** | `qualite.demo` | `quality_staff` | Responsable Qualité (Démo) | **Yes** (CAPA activity feed) |
| **5** | `admin.demo.tech` | `tech_admin` | Administrateur Technique (Démo) | **STRICTLY PROHIBITED (0 notifications)** |

### 2.3 Prototype Trust Model & Repository Design

Because AES Guardian is an offline demonstrator for academic evaluation:
1. **Zustand is not a security boundary:** It provides reactive state for UI persona switching.
2. **Repository API design (Caller Accountability):**
   - Repository methods accept `userId: number` as an explicit parameter.
   - Screen components are responsible for reading `activeContext.userId` from `useDemoRoleStore` and passing it.
   - The repository validates that the user exists in `demo_users` and has an appropriate role.
3. **Scoped Retrieval:**
   - `getNotifications(userId)` queries strictly:
     ```sql
     SELECT * FROM in_app_notifications
     WHERE recipient_user_id = ?
     ORDER BY created_at DESC;
     ```
   - Screens cannot supply an arbitrary recipient ID because the UI strictly passes `activeContext.userId`.
4. **Mark-Read Double-Guard:**
   - Both single and bulk mark-read operations enforce recipient ownership:
     ```sql
     UPDATE in_app_notifications
     SET is_read = 1, read_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
     WHERE id = ? AND recipient_user_id = ?;
     ```
   - If a caller supplies a notification ID belonging to another user, `rowsAffected` is 0, completely preventing cross-user mutation.
5. **`tech_admin` Strict Exclusion:**
   - In `getNotifications(userId)` and `getUnreadNotificationCount(userId)`:
     ```typescript
     const user = await this.getDemoUser(userId);
     if (user?.role === 'tech_admin') {
       return []; // count returns 0
     }
     ```
   - No notifications are ever addressed to `userId: 5`. The UI workspace hides the notification bell entirely when `activeRole === 'tech_admin'`.
6. **Limitation Statement:** This mechanism prevents accidental UI cross-contamination during demonstration. It is not cryptographic or multi-tenant production authentication.

---

## 3. RESOLVE THE CAPA RECIPIENT CONFLICT & OPERATIONAL RECIPIENT MATRIX

### 3.1 CAPA Recipient Conflict Analysis

The Phase 2D.2A audit contained conflicting assignments for CAPA notifications (events 9, 10, 11), proposing both `quality_staff` and `admin_reviewer`.

Inspection of `boundaries.ts` and `AesGuardianDatabase.ts` reveals the following facts:
1. **Creation & Lifecycle Ownership:**
   - `createPreventionAction(userId, ...)` enforces:
     `if (user.role !== 'quality_staff') throw new Error('UnauthorizedError: Only quality_staff may create and manage prevention actions.')`
   - `updatePreventionActionStatus(userId, ...)` enforces:
     `if (user.role !== 'quality_staff') throw new Error('UnauthorizedError: Only quality_staff may transition prevention action statuses.')`
   - Therefore, **only `quality_staff` (User 4) is capable of acting on CAPAs**.
2. **Read Access vs Operational Responsibility:**
   - `canViewPreventionActions(context)` allows `quality_staff`, `admin_reviewer`, and `oh_professional` to view the CAPA register.
   - However, `admin_reviewer` and `oh_professional` have **zero workflow obligations, approvals, or handoffs** regarding CAPA items.
   - The project instruction is explicit:
     > *"If `admin_reviewer` can read CAPA information but has no operational responsibility requiring notifications, do not notify that role merely because it has read access."*
   - Therefore, **`admin_reviewer` and `oh_professional` MUST NOT receive CAPA notifications**.
3. **The Self-Notification Dilemma:**
   - Since `quality_staff` is the sole actor for CAPA actions, notifying `quality_staff` of their own action (`createPreventionAction` or `updatePreventionActionStatus`) is technically a self-notification.
   - In operational production systems, self-notifications are typically suppressed as redundant.
   - However, in this 5-role demonstration prototype:
     - The demonstrator needs to showcase the Notification Centre across all four operational roles (`exposed_professional`, `admin_reviewer`, `oh_professional`, and `quality_staff`).
     - The baseline demo seed explicitly includes a seeded CAPA notification for User 4:
       `notif:capa_created:prevention_action:1:4` (`is_read = 1`).
4. **Architectural Resolution:**
   - **For Initial Demo Baseline / Reset:** User 4 (`quality_staff`) receives the seeded demo notification (`CAPA-2026-00001`, `read = 1`) so their notification centre demonstrates historical activity.
   - **For Runtime Execution:** Events 9, 10, 11 are supported with recipient `quality_staff` (User 4) as an **in-app operational activity feed**. Because the actor is User 4, this is documented as an intentional demonstrator feedback mechanism (`actor === recipient`).
   - If strict suppression of self-notifications is preferred by the project lead during evaluation, events 9–11 can be deferred from runtime generation without breaking the schema or baseline seed.

### 3.2 Operational Recipient Matrix

| Event | Triggering Actor | Authorized Recipient | Actor Receives Notification? | Why Recipient Needs It | Can Recipient Open Target? | Safe Destination Screen |
|---|---|---|---|---|---|---|
| `declaration_submitted` | `exposed_professional` (User 1) | `admin_reviewer` (User 2) | **No** (User 1 is actor) | Action required: new incident awaiting administrative triage & compliance check | **Yes** (authorized for review) | `adminReviewQueue` |
| `review_completed` | `admin_reviewer` (User 2) | `exposed_professional` (User 1) | **No** (User 2 is actor) | Informational: declaration acknowledged or transmission verified; formal review complete | **Yes** (owns declaration) | `declarationDetails` |
| `correction_requested` | `admin_reviewer` (User 2) | `exposed_professional` (User 1) | **No** (User 2 is actor) | Action required: administrative reviewer requires incident details to be corrected | **Yes** (owns declaration) | `correctionResponse` |
| `correction_submitted` | `exposed_professional` (User 1) | `admin_reviewer` (User 2) | **No** (User 1 is actor) | Action required: declarer has resubmitted correction; review queue item ready | **Yes** (authorized reviewer) | `adminReviewAction` |
| `oh_coordination_created` | `admin_reviewer` (User 2) | `oh_professional` (User 3) | **No** (User 2 is actor) | Action required: clinical referral initiated; medical assessment required | **Yes** (clinical team) | `ohCoordinationDetail` |
| `oh_coordination_acknowledged` | `oh_professional` (User 3) | `exposed_professional` (User 1) | **No** (User 3 is actor) | Reassurance / status: Occupational Health has acknowledged referral and begun tracking | **Yes** (status-only view) | `declarationCoordinationStatus` |
| `oh_milestone_recorded` | `oh_professional` (User 3) | `exposed_professional` (User 1) | **No** (User 3 is actor) | Status update: follow-up milestone recorded (without disclosing private clinical notes) | **Yes** (status-only view) | `declarationCoordinationStatus` |
| `oh_coordination_completed` | `oh_professional` (User 3) | `exposed_professional` (User 1) | **No** (User 3 is actor) | Formal closeout: Occupational Health follow-up protocol is fully completed | **Yes** (status-only view) | `declarationCoordinationStatus` |
| `capa_created` | `quality_staff` (User 4) | `quality_staff` (User 4) | **Yes** (Self-feed) | Feed record: confirms new prevention measure entered into CAPA register | **Yes** (CAPA manager) | `preventionActionDetail` |
| `capa_status_changed` | `quality_staff` (User 4) | `quality_staff` (User 4) | **Yes** (Self-feed) | Feed record: tracks progression of action item to in-progress | **Yes** (CAPA manager) | `preventionActionDetail` |
| `capa_finalized` | `quality_staff` (User 4) | `quality_staff` (User 4) | **Yes** (Self-feed) | Feed record: confirms closure or cancellation of CAPA measure | **Yes** (CAPA manager) | `preventionActionDetail` |

---

## 4. RECORD-LEVEL AUTHORIZATION & NAVIGATION RULES

When a user taps a notification row, the application must perform record-level authorization before navigating to the target screen. If the target entity no longer exists or the active user is not authorized, the application must show a localized warning and remain in the Notification Centre.

| Destination Route | Target Entity | Guard Method in `AesGuardianDatabase.ts` | Authorized Roles | Ownership / Privacy Check Enforced | Target Missing Handling | Unauthorized Handling |
|---|---|---|---|---|---|---|
| `adminReviewQueue` | None (Queue) | `canReview(context)` | `admin_reviewer` | Role check only | N/A | Redirect to workspace |
| `declarationDetails` | `aes_declaration` | `getDeclarationById(id, userId)` | `exposed_professional`, `admin_reviewer`, `oh_professional`, `quality_staff` | Caller screens for `exposed_professional` filter by `declared_by_user_id === userId` *(see limitation)* | Alert: `declarationNotFound` | Alert: `accessDenied` (blocks `tech_admin`) |
| `adminReviewAction` | `aes_declaration` | `getDeclarationById(id, userId)` | `admin_reviewer` | Requires `canReview` | Alert: `declarationNotFound` | Alert: `accessDenied` |
| `correctionResponse` | `administrative_review` | `getLatestPendingCorrectionRequest(declId, userId)` | `exposed_professional` | **Enforced in DB:** `decl.declared_by_user_id === userId` (throws if not owned) | Alert: `correctionNotFound` | Throws `UnauthorizedError` → Alert: `accessDenied` |
| `ohCoordinationDetail` | `oh_coordination` | `getOhCoordinationById(coordId, userId)` | `oh_professional`, `admin_reviewer` | Full coordination & follow-up events accessible | Alert: `coordinationNotFound` | Throws if `tech_admin` or non-owner `exposed_professional` |
| `declarationCoordinationStatus` | `oh_coordination` | `getOhCoordinationById(coordId, userId)` or `getOhCoordinationByDeclaration(declId, userId)` | `exposed_professional` | **Enforced in DB:** Returns **status-only view** (`status`, `coordination_reason`, `created_at`). Strips clinical IDs and follow-up notes. | Alert: `coordinationNotFound` | Throws if `declared_by_user_id !== userId` |
| `preventionActionDetail` | `prevention_action` | `getPreventionActionById(userId, actionId)` | `quality_staff`, `admin_reviewer`, `oh_professional` | **Enforced in DB:** Throws if role is `exposed_professional` or `tech_admin` | Returns `null` → Alert: `actionNotFound` | Throws `UnauthorizedError` → Alert: `accessDenied` |

### Critical Separation: Clinical Privacy vs Status Visibility
- An `exposed_professional` receiving an OH notification (`oh_milestone_recorded` or `oh_coordination_completed`) **MUST NEVER** be routed to `ohCoordinationDetail` or `recordFollowUpEvent`.
- `getOhFollowUpEvents` explicitly throws an error for `exposed_professional` (`"role exposed_professional is not authorized to read follow-up events"`).
- Routing for `exposed_professional` targets `declarationCoordinationStatus`, which queries `getOhCoordinationByDeclaration` and displays purely non-clinical milestone badges (e.g., "Prise en charge SST initiée", "Protocole SST clôturé").

---

## 5. IDEMPOTENCY DESIGN

### 5.1 Key Structure
Every in-app notification row enforces a unique constraint on `idempotency_key`:
```
notif:<event_type>:<entity_type>:<entity_id>:<recipient_user_id>[:<state_suffix>]
```

- `event_type`: Snake_case string matching one of the 11 valid event types.
- `entity_type`: Snake_case string matching the referenced entity table.
- `entity_id`: Integer primary key of the persisted event/entity.
- `recipient_user_id`: Integer ID of the recipient user (prevents multi-recipient collisions if extended).
- `state_suffix`: Optional discriminator appended when the same entity undergoes multiple distinct state transitions (e.g., CAPA status).

### 5.2 Key Patterns for All 11 Events

| # | Event Type | Entity Type | Primary ID Used | State Suffix | Full Idempotency Key Pattern |
|---|---|---|---|---|---|
| **1** | `declaration_submitted` | `aes_declaration` | `decl.id` | None | `notif:declaration_submitted:aes_declaration:{declId}:2` |
| **2** | `review_completed` | `administrative_review` | `review.id` | None | `notif:review_completed:administrative_review:{reviewId}:{declaredByUserId}` |
| **3** | `correction_requested` | `administrative_review` | `review.id` | None | `notif:correction_requested:administrative_review:{reviewId}:{declaredByUserId}` |
| **4** | `correction_submitted` | `correction_response` | `response.id` | None | `notif:correction_submitted:correction_response:{responseId}:2` |
| **5** | `oh_coordination_created` | `oh_coordination` | `coord.id` | None | `notif:oh_coordination_created:oh_coordination:{coordId}:3` |
| **6** | `oh_coordination_acknowledged` | `oh_coordination` | `coord.id` | None | `notif:oh_coordination_acknowledged:oh_coordination:{coordId}:{declaredByUserId}` |
| **7** | `oh_milestone_recorded` | `oh_follow_up_events` | `event.id` | None | `notif:oh_milestone_recorded:oh_follow_up_events:{eventId}:{declaredByUserId}` |
| **8** | `oh_coordination_completed` | `oh_coordination` | `coord.id` | None | `notif:oh_coordination_completed:oh_coordination:{coordId}:{declaredByUserId}` |
| **9** | `capa_created` | `prevention_action` | `action.id` | None | `notif:capa_created:prevention_action:{actionId}:4` |
| **10** | `capa_status_changed` | `prevention_action` | `action.id` | `newStatus` | `notif:capa_status_changed:prevention_action:{actionId}:4:{newStatus}` |
| **11** | `capa_finalized` | `prevention_action` | `action.id` | `newStatus` | `notif:capa_finalized:prevention_action:{actionId}:4:{newStatus}` |

### 5.3 Multi-Event Entity Disambiguation
- **Declarations:** A single declaration may have multiple administrative reviews over time. By binding events 2 and 3 to `review.id` (not `declaration.id`), each review generates a unique notification.
- **Corrections:** By binding event 4 to `response.id`, resubmissions create distinct notifications.
- **OH Milestones:** By binding event 7 to `event.id` (`oh_follow_up_events.id`), every follow-up visit/event produces its own notification. Event 8 uses `coord.id` but has event type `oh_coordination_completed`, preventing collision.
- **CAPA Transitions:** Events 10 and 11 append the new status (e.g. `:in_progress`, `:completed`, `:cancelled`), allowing separate notifications for distinct stages.

### 5.4 SQL Insertion Strategy
**`INSERT OR IGNORE` is strictly required.**

```sql
INSERT OR IGNORE INTO in_app_notifications (
  recipient_user_id, event_type, title_key, message_key,
  entity_type, entity_id, entity_reference, idempotency_key
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
```

**Technical Verification:**
- Inspecting `__mocks__/@op-engineering/op-sqlite.js` confirmed that the mock tests specifically for `INSERT OR IGNORE` and contains logic to suppress `UNIQUE` constraint errors when that keyword is present.
- The mock does **not** recognize `ON CONFLICT(idempotency_key) DO NOTHING`. Using `ON CONFLICT` would cause mock parsing errors in Jest.
- In both native SQLite (`NativeSQLiteAdapter`) and the mock, `INSERT OR IGNORE` safely ignores duplicate idempotency keys while still bubbling up fatal constraint errors (such as foreign key failures on `recipient_user_id`).

---

## 6. NOTIFICATION RESET & DEMO SEED CONTRACT

### 6.1 Exact Deletion Order in `resetDemoScenario()`
To maintain referential integrity without foreign key violations, `in_app_notifications` is deleted as the **very first step** in the reset transaction:

```
1. DELETE FROM in_app_notifications;   ← Step 1 (FK to demo_users; referenced by none)
2. DELETE FROM oh_follow_up_events;    ← Step 2 (FK to oh_coordinations)
3. DELETE FROM oh_coordinations;       ← Step 3 (FK to aes_declarations)
4. DELETE FROM correction_responses;   ← Step 4 (FK to administrative_reviews)
5. DELETE FROM administrative_reviews; ← Step 5 (FK to aes_declarations)
6. DELETE FROM aes_declarations;       ← Step 6 (FK to demo_users)
7. DELETE FROM prevention_actions;     ← Step 7 (FK to demo_users)
8. DELETE FROM audit_events;          ← Step 8 (Audit log)
```

### 6.2 SQLite AUTOINCREMENT & Dynamic ID Resolution
In SQLite, executing `DELETE FROM <table>` does not reset the internal `sqlite_sequence` counter. Because declarations are inserted with autoincrementing primary keys, post-reset declarations will have IDs greater than 4.

Therefore, the seeder in `seedStandardScenario()` **must not hardcode entity IDs** for notifications. It must resolve entity IDs dynamically by querying known reference codes:

```typescript
// Resolve dynamic IDs inside seedStandardScenario(tx)
const decl1 = (await tx.query<AesDeclaration>(
  `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-01'`,
)).rows[0];

const decl2 = (await tx.query<AesDeclaration>(
  `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-02'`,
)).rows[0];

const review2 = (await tx.query<AdministrativeReview>(
  `SELECT id FROM administrative_reviews WHERE declaration_id = ? AND outcome = 'correction_requested'`,
  [decl2.id],
)).rows[0];

const decl3 = (await tx.query<AesDeclaration>(
  `SELECT id FROM aes_declarations WHERE reference_number = 'AES-2026-DEMO-03'`,
)).rows[0];

const coord3 = (await tx.query<OhCoordination>(
  `SELECT id FROM oh_coordinations WHERE declaration_id = ?`,
  [decl3.id],
)).rows[0];

const capa1 = (await tx.query<PreventionAction>(
  `SELECT id FROM prevention_actions WHERE reference_code = 'CAPA-2026-00001'`,
)).rows[0];
```

### 6.3 Canonical Baseline Seed Notifications (4 Rows)

| # | Recipient Role (User ID) | Event Type | Entity Type | Resolved Entity Ref | `is_read` | Canonical Idempotency Key | Purpose |
|---|---|---|---|---|---|---|---|
| **N1** | `admin_reviewer` (User 2) | `declaration_submitted` | `aes_declaration` | `AES-2026-DEMO-01` (`decl1.id`) | `0` (Unread) | `notif:declaration_submitted:aes_declaration:{decl1.id}:2` | Demonstrates pending review item for RH reviewer |
| **N2** | `exposed_professional` (User 1) | `correction_requested` | `administrative_review` | `AES-2026-DEMO-02` (`review2.id`) | `0` (Unread) | `notif:correction_requested:administrative_review:{review2.id}:1` | Demonstrates pending correction request for declarer |
| **N3** | `oh_professional` (User 3) | `oh_coordination_created` | `oh_coordination` | `AES-2026-DEMO-03` (`coord3.id`) | `1` (Read) | `notif:oh_coordination_created:oh_coordination:{coord3.id}:3` | Demonstrates historical referral for SST clinician |
| **N4** | `quality_staff` (User 4) | `capa_created` | `prevention_action` | `CAPA-2026-00001` (`capa1.id`) | `1` (Read) | `notif:capa_created:prevention_action:{capa1.id}:4` | Demonstrates historical action item for Quality staff |

### 6.4 Reset Atomicity & Cold-Start Contract
- **Atomicity:** The deletion of notifications, reseeding of scenario entities, re-insertion of the 4 demo notifications, and insertion of the `DEMO_DATA_RESET` audit event all execute inside a single `db.transaction()` block. If any notification insert fails, the entire reset rolls back.
- **Cold Start:** On application launch, if the database is newly initialized, `seedStandardScenario` runs once and seeds the 4 baseline notifications.
- **Normal Startup:** Subsequent app starts do not regenerate or duplicate notifications because the idempotency keys exist and `seedStandardScenario` only runs when empty.
- **No Historical Replay:** Historical workflow events are never replayed to populate notifications. Only the 4 canonical baseline rows are seeded.

---

## 7. FINAL PROPOSED SQL SCHEMA (Migration 8)

> **Specification Only:** This SQL will be included in the `MIGRATIONS` array in `src/core/database/AesGuardianDatabase.ts` during Phase 2D.2B.

```sql
-- ============================================================================
-- Migration 8: In-App Notification System (Phase 2D.2)
-- ============================================================================

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

-- Index for fetching unread count and sorting user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON in_app_notifications(recipient_user_id, is_read, created_at);

-- Index for full notification list pagination/sorting
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_all
  ON in_app_notifications(recipient_user_id, created_at);

-- Index for fast idempotency lookups
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency
  ON in_app_notifications(idempotency_key);
```

### Schema Design Evaluation

1. **Polymorphic `entity_id`:** `entity_id` references multiple tables depending on `entity_type`. Using a polymorphic integer ID without a direct SQL `FOREIGN KEY` constraint is the standard, battle-tested pattern for activity feeds and notifications. It avoids complex circular foreign keys.
2. **Handling Deleted / Stale Entities:** Target entity existence is validated in application code when the user taps the notification. If the record was removed (e.g., in testing), a safe localized error is displayed without crashing.
3. **`entity_reference` Privacy:** Only safe administrative codes (`AES-2026-DEMO-01`, `CAPA-2026-00001`) are stored. No personal identifiers, clinical narratives, or anatomical sites are ever written to `in_app_notifications`.
4. **Idempotency Index vs Constraint:** While `idempotency_key TEXT UNIQUE` automatically creates an index in SQLite, the explicit `idx_notifications_idempotency` index statement ensures identical behavior across all SQLite builds and test mocks.
5. **Timestamp Conventions:** Uses `TEXT` with ISO 8601 formatting (`strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`), strictly matching migrations 1 through 7.
6. **`read_at` Consistency:** Maintained in repository methods (`is_read = 1, read_at = now`). No triggers are used, maintaining project convention.
7. **Foreign Key Cascade:** `recipient_user_id REFERENCES demo_users(id) ON DELETE CASCADE` ensures clean teardown if a demo user is ever removed.

---

## 8. AUTHORITATIVE EVENT-TO-NOTIFICATION MATRIX

The following table provides the exhaustive implementation specification for all 11 workflow events:

| Event Type | Source Method in `AesGuardianDatabase.ts` | Transaction Boundary Strategy | Persisted Entity ID | Actor Role | Recipient Role & User ID | Idempotency Key Components | Title Localization Key | Message Localization Key | Entity Type | Authorized Destination Route | Actor Excluded as Recipient? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `declaration_submitted` | `submitDeclaration(id)` | **Wrap in `db.transaction`** | `decl.id` | `exposed_professional` | `admin_reviewer` (User 2) | `declaration_submitted` + `decl.id` + `2` | `notification.declarationSubmitted.title` | `notification.declarationSubmitted.message` | `aes_declaration` | `adminReviewQueue` | **Yes** (Actor is User 1, recipient is User 2) |
| `review_completed` | `createAdministrativeReview(input)` (outcome `acknowledged`/`transmission_verified`) | **Inject into existing transaction** | `reviewId` (`insertId`) | `admin_reviewer` | `exposed_professional` (`decl.declared_by_user_id`) | `review_completed` + `reviewId` + `declaredByUserId` | `notification.reviewCompleted.title` | `notification.reviewCompleted.message` | `administrative_review` | `declarationDetails` | **Yes** (Actor is User 2, recipient is User 1) |
| `correction_requested` | `createAdministrativeReview(input)` (outcome `correction_requested`) | **Inject into existing transaction** | `reviewId` (`insertId`) | `admin_reviewer` | `exposed_professional` (`decl.declared_by_user_id`) | `correction_requested` + `reviewId` + `declaredByUserId` | `notification.correctionRequested.title` | `notification.correctionRequested.message` | `administrative_review` | `correctionResponse` | **Yes** (Actor is User 2, recipient is User 1) |
| `correction_submitted` | `createCorrectionResponse(input)` | **Inject into existing transaction** | `responseId` (`insertId`) | `exposed_professional` | `admin_reviewer` (User 2) | `correction_submitted` + `responseId` + `2` | `notification.correctionSubmitted.title` | `notification.correctionSubmitted.message` | `correction_response` | `adminReviewAction` | **Yes** (Actor is User 1, recipient is User 2) |
| `oh_coordination_created` | `createOhCoordination(input)` | **Wrap in `db.transaction`** | `coordId` (`insertId`) | `admin_reviewer` | `oh_professional` (User 3) | `oh_coordination_created` + `coordId` + `3` | `notification.ohCoordinationCreated.title` | `notification.ohCoordinationCreated.message` | `oh_coordination` | `ohCoordinationDetail` | **Yes** (Actor is User 2, recipient is User 3) |
| `oh_coordination_acknowledged` | `acknowledgeOhCoordination(id, userId)` | **Wrap in `db.transaction`** (pre-fetch decl) | `coordination_id` | `oh_professional` | `exposed_professional` (`decl.declared_by_user_id`) | `oh_coordination_acknowledged` + `coordId` + `declaredByUserId` | `notification.ohCoordinationAcknowledged.title` | `notification.ohCoordinationAcknowledged.message` | `oh_coordination` | `declarationCoordinationStatus` | **Yes** (Actor is User 3, recipient is User 1) |
| `oh_milestone_recorded` | `createOhFollowUpEvent(input)` (category ≠ `follow_up_completed`) | **Wrap in `db.transaction`** (pre-fetch decl) | `eventId` (`insertId`) | `oh_professional` | `exposed_professional` (`decl.declared_by_user_id`) | `oh_milestone_recorded` + `eventId` + `declaredByUserId` | `notification.ohMilestoneRecorded.title` | `notification.ohMilestoneRecorded.message` | `oh_follow_up_events` | `declarationCoordinationStatus` | **Yes** (Actor is User 3, recipient is User 1) |
| `oh_coordination_completed` | `createOhFollowUpEvent(input)` (category = `follow_up_completed`) | **Wrap in `db.transaction`** (pre-fetch decl) | `input.coordination_id` | `oh_professional` | `exposed_professional` (`decl.declared_by_user_id`) | `oh_coordination_completed` + `coordId` + `declaredByUserId` | `notification.ohCoordinationCompleted.title` | `notification.ohCoordinationCompleted.message` | `oh_coordination` | `declarationCoordinationStatus` | **Yes** (Actor is User 3, recipient is User 1) |
| `capa_created` | `createPreventionAction(userId, input)` | **Wrap in `db.transaction`** (inline audit) | `actionId` (`insertId`) | `quality_staff` | `quality_staff` (User 4) | `capa_created` + `actionId` + `4` | `notification.capaCreated.title` | `notification.capaCreated.message` | `prevention_action` | `preventionActionDetail` | **No** (Self-feed in demo; or deferred if suppressed) |
| `capa_status_changed` | `updatePreventionActionStatus(userId, actionId, status)` (status = `in_progress`) | **Wrap in `db.transaction`** (inline audit) | `actionId` | `quality_staff` | `quality_staff` (User 4) | `capa_status_changed` + `actionId` + `4` + `in_progress` | `notification.capaStatusChanged.title` | `notification.capaStatusChanged.message` | `prevention_action` | `preventionActionDetail` | **No** (Self-feed in demo; or deferred if suppressed) |
| `capa_finalized` | `updatePreventionActionStatus(userId, actionId, status)` (status `completed`/`cancelled`) | **Wrap in `db.transaction`** (inline audit) | `actionId` | `quality_staff` | `quality_staff` (User 4) | `capa_finalized` + `actionId` + `4` + `newStatus` | `notification.capaFinalized.title` | `notification.capaFinalized.message` | `prevention_action` | `preventionActionDetail` | **No** (Self-feed in demo; or deferred if suppressed) |

---

## 9. TRANSACTION INTEGRATION PLAN

### 9.1 General Transaction Rules
1. **No Nested Transactions:** SQLite does not support nested `BEGIN TRANSACTION`. If a method is wrapped in `this.db.transaction()`, it must never call another method on `this` that itself initiates a transaction.
2. **Executor Propagation:** All queries and mutations participating in the atomic unit must use the `tx` executor passed into the callback (`tx.execute`, `tx.query`).
3. **Pre-Transaction Lookups:** Any data needed to determine recipients (e.g., joining an OH coordination to a declaration to discover `declared_by_user_id`) should be queried **before** entering `this.db.transaction()`, unless the data is being modified in the transaction.
4. **Audit Logging Atomicity:** Helper methods like `this.logAuditEvent()` call `this.db.execute()` directly on the outer connection. When inside a transaction, audit events must be inserted directly via `tx.execute('INSERT INTO audit_events ...')`.
5. **Rollback on Notification Failure:** Because notification insertion is part of the transaction callback, any fatal error during notification generation triggers an automatic `ROLLBACK`, guaranteeing that orphaned business records are never committed without their notifications.

### 9.2 Method-by-Method Refactoring Plan

#### Method 1: `submitDeclaration(id: number)`
- **Current State:** Single `this.db.execute(UPDATE aes_declarations ...)` outside any transaction.
- **Refactoring:**
  1. Status check and pre-fetch of `reference_number` already exist.
  2. Wrap the UPDATE and notification INSERT in `this.db.transaction(async tx => { ... })`.
  3. Inside `tx`:
     - Execute UPDATE declaration status to `'submitted'`.
     - Execute `INSERT OR IGNORE INTO in_app_notifications` with recipient `2` (`admin_reviewer`), event `declaration_submitted`, entity_id `id`, and reference `decl.reference_number`.

#### Method 2 & 3: `createAdministrativeReview(input: CreateAdministrativeReviewInput)`
- **Current State:** Already wrapped in `this.db.transaction(async tx => { ... })`.
- **Refactoring:**
  1. Captures `reviewId = reviewRes.insertId!`.
  2. The parent declaration (`decl`) is pre-fetched prior to the transaction.
  3. Inside existing `tx` callback, immediately after the review INSERT and declaration UPDATE:
     - Determine event type: `correction_requested` if outcome is `correction_requested`, else `review_completed`.
     - Execute `INSERT OR IGNORE INTO in_app_notifications` with recipient `decl.declared_by_user_id`, entity_type `'administrative_review'`, entity_id `reviewId`.

#### Method 4: `createCorrectionResponse(input: CreateCorrectionResponseInput)`
- **Current State:** Already wrapped in `this.db.transaction(async tx => { ... })`.
- **Refactoring:**
  1. Captures `responseId = respRes.insertId!`.
  2. Inside existing `tx` callback, immediately after the response INSERT and declaration UPDATE:
     - Execute `INSERT OR IGNORE INTO in_app_notifications` with recipient `2` (`admin_reviewer`), event `correction_submitted`, entity_type `'correction_response'`, entity_id `responseId`.

#### Method 5: `createOhCoordination(input: CreateOhCoordinationInput)`
- **Current State:** Single `this.db.execute(INSERT INTO oh_coordinations ...)` outside any transaction.
- **Refactoring:**
  1. Pre-fetch declaration to obtain `reference_number`.
  2. Wrap in `this.db.transaction(async tx => { ... })`.
  3. Inside `tx`:
     - Execute INSERT coordination and capture `coordId = result.insertId!`.
     - Execute `INSERT OR IGNORE INTO in_app_notifications` with recipient `3` (`oh_professional`), event `oh_coordination_created`, entity_type `'oh_coordination'`, entity_id `coordId`.

#### Method 6: `acknowledgeOhCoordination(coordination_id: number, acknowledging_user_id: number)`
- **Current State:** Single `this.db.execute(UPDATE oh_coordinations ...)` outside any transaction.
- **Refactoring:**
  1. Pre-fetch coordination row and join to `aes_declarations` to get `decl.declared_by_user_id` and `decl.reference_number`.
  2. Wrap in `this.db.transaction(async tx => { ... })`.
  3. Inside `tx`:
     - Execute UPDATE coordination status to `'in_progress'`.
     - Execute `INSERT OR IGNORE INTO in_app_notifications` with recipient `decl.declared_by_user_id`, event `oh_coordination_acknowledged`, entity_type `'oh_coordination'`, entity_id `coordination_id`.

#### Method 7 & 8: `createOhFollowUpEvent(input: CreateOhFollowUpEventInput)`
- **Current State:** Two separate `this.db.execute` calls (INSERT into events + conditional UPDATE on coordination) — **not atomic**.
- **Refactoring:**
  1. Pre-fetch coordination and declaration to get `decl.declared_by_user_id` and `decl.reference_number`.
  2. Wrap all operations in `this.db.transaction(async tx => { ... })`.
  3. Inside `tx`:
     - Execute INSERT `oh_follow_up_events` and capture `eventId = evtRes.insertId!`.
     - Execute `INSERT OR IGNORE INTO in_app_notifications` for event 7 (`oh_milestone_recorded`), entity_type `'oh_follow_up_events'`, entity_id `eventId`.
     - If `input.event_category === 'follow_up_completed'`:
       - Execute UPDATE `oh_coordinations` status to `'completed'`.
       - Execute `INSERT OR IGNORE INTO in_app_notifications` for event 8 (`oh_coordination_completed`), entity_type `'oh_coordination'`, entity_id `input.coordination_id`.

#### Methods 9, 10, 11: `createPreventionAction` / `updatePreventionActionStatus`
- **Current State:** Plain `this.db.execute` followed by `this.logAuditEvent()`. Non-atomic.
- **Refactoring:**
  1. Wrap mutations in `this.db.transaction(async tx => { ... })`.
  2. Inside `tx`:
     - Execute primary INSERT or UPDATE on `prevention_actions`.
     - Inlined audit event insertion:
       ```typescript
       await tx.execute(
         `INSERT INTO audit_events (event_type, user_id, entity_type, entity_id, description, created_at)
          VALUES (?, ?, 'prevention_action', ?, ?, ?)`,
         [auditType, userId, actionId, auditDescription, now],
       );
       ```
     - Execute `INSERT OR IGNORE INTO in_app_notifications` for `capa_created`, `capa_status_changed`, or `capa_finalized` with recipient `4` (`quality_staff`).
  3. Post-transaction read via `this.getPreventionActionById(userId, actionId)` remains outside the transaction.

---

## 10. KNOWN LIMITATIONS

1. **Synthetic Persona Coordination Only:** The architecture is built for an offline, local-device demonstration prototype. There are no JSON Web Tokens, session cookies, or backend authorization tokens.
2. **No Background Worker / Push Notifications:** The application does not integrate with Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNS), or Expo Notifications. Notifications are generated purely synchronously in SQLite when an in-app action is committed.
3. **Cross-Persona Notification Visibility:** Because all synthetic users share the same SQLite database file on the Android device, notifications persist across role switching. When a user switches from `exposed_professional` to `admin_reviewer`, they immediately see notifications generated by the prior persona. This is the intended behavior for the demonstration.
4. **`getDeclarationById` Ownership Verification:** `getDeclarationById` blocks `tech_admin`, but does not currently check whether an `exposed_professional` owns the declaration. In this closed prototype, the UI only surfaces own declarations, but a production system will require strict ownership validation inside `getDeclarationById`.
5. **No Follow-Up Event Inspection for Declarers:** `getOhFollowUpEvents` is intentionally restricted to `oh_professional` and `admin_reviewer`. An `exposed_professional` receiving an OH milestone notification can only view the high-level milestone status on `declarationCoordinationStatus`, protecting clinical privacy.
6. **SQLite `AUTOINCREMENT` Sequence Retention:** `DELETE FROM` does not reset SQLite table counters. Seed logic must dynamically resolve foreign keys rather than assuming primary keys reset to 1.

---

## 11. EXPLICIT IMPLEMENTATION SEQUENCE (Phase 2D.2B Onward)

Upon approval of this architecture document, implementation will proceed in the following strict order:

| Step | Phase | Target File | Specific Implementation Action |
|---|---|---|---|
| **1** | **2D.2B** | `src/core/database/types.ts` | Export `InAppNotification`, `NotificationEventType`, `NotificationEntityType`, `CreateNotificationInput`, and query filter interfaces. |
| **2** | **2D.2B** | `src/core/database/AesGuardianDatabase.ts` | Append **Migration 8** (table + 3 indexes) to `MIGRATIONS`. Advance `CURRENT_SCHEMA_VERSION` to `8`. |
| **3** | **2D.2B** | `src/core/database/AesGuardianDatabase.ts` | Implement repository methods: `getNotifications(userId)`, `getUnreadNotificationCount(userId)`, `markNotificationRead(id, userId)`, `markAllNotificationsRead(userId)`. Include `tech_admin` guard. |
| **4** | **2D.2B** | `src/core/database/__tests__/migration8.test.ts` | **New native test:** Verify migration from v7 to v8, table creation, foreign keys, and indexes. `PRAGMA foreign_key_check` = 0. |
| **5** | **2D.2C** | `src/core/database/AesGuardianDatabase.ts` | Wrap `submitDeclaration` in `db.transaction`; inject notification event 1 (`declaration_submitted`). |
| **6** | **2D.2C** | `src/core/database/AesGuardianDatabase.ts` | Inject notification events 2 & 3 (`review_completed`, `correction_requested`) into existing review transaction. |
| **7** | **2D.2C** | `src/core/database/AesGuardianDatabase.ts` | Inject notification event 4 (`correction_submitted`) into existing correction transaction. |
| **8** | **2D.2C** | `src/core/database/AesGuardianDatabase.ts` | Wrap `createOhCoordination` and `acknowledgeOhCoordination` in `db.transaction`; inject events 5 & 6. |
| **9** | **2D.2C** | `src/core/database/AesGuardianDatabase.ts` | Wrap `createOhFollowUpEvent` in `db.transaction`; inject events 7 & 8 (`oh_milestone_recorded`, `oh_coordination_completed`). |
| **10** | **2D.2C** | `src/core/database/AesGuardianDatabase.ts` | Wrap `createPreventionAction` and `updatePreventionActionStatus` in `db.transaction`; inline audit event insert; inject events 9, 10, 11. |
| **11** | **2D.2D** | `src/core/database/AesGuardianDatabase.ts` | Update `resetDemoScenario()` to delete `in_app_notifications` at Step 1 of deletion sequence. |
| **12** | **2D.2D** | `src/core/database/demo-scenario-seeder.ts` | In `seedStandardScenario(tx)`: query dynamic IDs and seed the 4 canonical baseline demo notifications. |
| **13** | **2D.2E** | `src/localization/index.ts` | Add French, English, and Arabic translations for all 11 notification titles and messages, plus centre UI strings. |
| **14** | **2D.2F** | `src/navigation/routes.ts` & `AppNavigator.tsx` | Register `notificationCentre: undefined` route and screen component. |
| **15** | **2D.2G** | `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx` | Add notification bell icon to header actions with unread count badge. Hide badge for `tech_admin`. |
| **16** | **2D.2G** | `src/features/aes-guardian/screens/NotificationCentreScreen.tsx` | **New screen:** Render notification feed, filter unread, tap-to-navigate with record auth check, mark read, mark all read. |
| **17** | **2D.2H** | `src/core/database/__tests__/notifications.test.ts` | **New native test:** Test repository queries, unread counts, mark-read double guard, idempotency, and `tech_admin` exclusion. |
| **18** | **2D.2H** | `src/features/aes-guardian/__tests__/notification-workflow.test.ts` | **New integration test:** Verify end-to-end event generation across all workflow methods, rollback atomicity, and demo reset. |
| **19** | **2D.2H** | Full regression verification | Run full Jest test suite (expecting 430+ passing tests) and `npx tsc --noEmit`. |

---

*Phase 2D.2A.1 architecture correction completed. No application code, database migrations, or test files have been modified. Ready for formal sign-off before Phase 2D.2B implementation begins.*
