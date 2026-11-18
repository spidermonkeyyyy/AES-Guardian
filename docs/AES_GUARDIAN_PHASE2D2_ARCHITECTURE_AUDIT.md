# AES GUARDIAN — PHASE 2D.2 ARCHITECTURE AUDIT
## Local Notification Centre & Event-Driven Notification System

**Project:** SANAD React Native Migration — AES Guardian  
**Branch:** `migration/aes-guardian`  
**Phase:** 2D.2A (Architecture & Event-Model Audit)  
**Date:** November 13, 2026  
**Status:** AUDIT COMPLETED — Ready for Implementation

---

## 1. OBJECTIVE & SCOPE OF AUDIT

This audit provides an evidence-based architectural blueprint for Phase 2D.2: an offline-first, persistent, in-app notification system integrated into the existing AES Guardian React Native application.

### Key Constraints & Boundaries:
- **Local In-App Only:** Zero push notifications, zero remote cloud messaging, zero background execution.
- **Role Invariant:** Strictly 5 canonical roles (`exposed_professional`, `admin_reviewer`, `oh_professional`, `quality_staff`, `tech_admin`).
- **Privacy Boundary:** Notifications must contain zero clinical narratives, anatomical locations, injury severities, or serological test results. A notification is not an authorization bypass.
- **Tech Admin Isolation:** `tech_admin` has zero access to operational notifications or notification counters.
- **Transaction Safety:** Notifications are generated atomically within the same SQLite transaction as the underlying workflow mutation wherever possible, backed by idempotency keys to prevent duplicate notification delivery.

---

## 2. EXISTING REPOSITORY & TRANSACTION ARCHITECTURE

An inspection of `AesGuardianDatabase.ts` and `DatabaseService.ts` reveals the following transaction and execution capabilities:

### 2.1 Transaction Execution Pattern
- `DatabaseService.transaction(fn)` executes inside `BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`.
- The callback receives an executor `{ execute: (sql, params) => Promise<MutationResult>, query: (sql, params) => Promise<QueryResult> }`.
- In `NativeSQLiteAdapter.ts` (`node:sqlite`), transaction methods are synchronous underneath and bound to the active transaction.

### 2.2 Existing Migration State
- Schema is currently at **Version 7** (`Migration 7`, added in Phase 2C.6).
- Versioning is tracked in the dedicated table `schema_versions` (highest applied version is 7).
- Adding Phase 2D.2 notifications will require **Migration 8**.

---

## 3. WORKFLOW EVENT MAP & RECIPIENT RESOLUTION

We analyzed all mutation points across the operational lifecycle. The table below maps each workflow action to its source method, transaction boundary, actor, affected entity, canonical recipient, and privacy-safe payload:

| # | Workflow Event | Source Method in `AesGuardianDatabase.ts` | Transaction Boundary | Actor & Role | Affected Entity | Canonical Recipient | Privacy-Safe Notification Payload |
|---|---|---|---|---|---|---|---|
| 1 | **Declaration Submitted** | `submitDeclaration(id)` | Single `UPDATE` $\to$ wrap into `transaction` | User 1 (`exposed_professional`) | `aes_declarations` (`id`, `reference_number`) | `admin_reviewer` (User 2) | Title: New declaration awaiting review.<br>Ref: `reference_number`. |
| 2 | **Administrative Review Acknowledged / Validated** | `createAdministrativeReview(input)` with outcome `acknowledged` or `transmission_verified` | Existing `this.db.transaction` | User 2 (`admin_reviewer`) | `administrative_reviews` (`reviewId`) on declaration | `exposed_professional` (`decl.declared_by_user_id`, User 1) | Title: Declaration reviewed.<br>Message: Review outcome registered. |
| 3 | **Administrative Correction Requested** | `createAdministrativeReview(input)` with outcome `correction_requested` | Existing `this.db.transaction` | User 2 (`admin_reviewer`) | `administrative_reviews` (`reviewId`) on declaration | `exposed_professional` (`decl.declared_by_user_id`, User 1) | Title: Clarification requested.<br>Message: Administrative review requests additional details. |
| 4 | **Correction Response Submitted** | `createCorrectionResponse(input)` | Existing `this.db.transaction` | User 1 (`exposed_professional`) | `correction_responses` (`responseId`) on declaration | `admin_reviewer` (User 2) | Title: Correction response submitted.<br>Message: Declaring professional provided clarifications. |
| 5 | **OH Coordination Created** | `createOhCoordination(input)` | Single `INSERT` $\to$ wrap into `transaction` | User 2 (`admin_reviewer`) | `oh_coordinations` (`coordinationId`) | `oh_professional` (User 3) | Title: New OH coordination item.<br>Message: Intake required for declared exposure. |
| 6 | **OH Coordination Acknowledged** | `acknowledgeOhCoordination(id, userId)` | Single `UPDATE` $\to$ wrap into `transaction` | User 3 (`oh_professional`) | `oh_coordinations` (`id`) | `exposed_professional` (`decl.declared_by_user_id`, User 1) | Title: Coordination in progress.<br>Message: Occupational Health has taken charge of follow-up. |
| 7 | **OH Follow-up Milestone Recorded** | `createOhFollowUpEvent(input)` with category $\neq$ `follow_up_completed` | Single `INSERT` $\to$ wrap into `transaction` | User 3 (`oh_professional`) | `oh_follow_up_events` (`id`) | `exposed_professional` (`decl.declared_by_user_id`, User 1) | Title: Follow-up update.<br>Message: A coordination milestone has been logged. |
| 8 | **OH Coordination Completed** | `createOhFollowUpEvent(input)` with category $=$ `follow_up_completed` | Single `INSERT` + `UPDATE` $\to$ wrap into `transaction` | User 3 (`oh_professional`) | `oh_coordinations` (`coordination_id`) | `exposed_professional` (`decl.declared_by_user_id`, User 1) | Title: Coordination completed.<br>Message: Occupational Health follow-up has concluded. |
| 9 | **CAPA Action Created** | `createPreventionAction(userId, input)` | Single `INSERT` + audit log $\to$ wrap into `transaction` | User 4 (`quality_staff`) | `prevention_actions` (`actionId`, `reference_code`) | `quality_staff` (User 4) / `admin_reviewer` (User 2) | Title: New CAPA action registered.<br>Ref: `reference_code`. |
| 10 | **CAPA Status Transition** | `updatePreventionActionStatus(userId, actionId, newStatus)` with status in-progress | Single `UPDATE` + audit log $\to$ wrap into `transaction` | User 4 (`quality_staff`) | `prevention_actions` (`actionId`) | `quality_staff` (User 4) | Title: CAPA status updated.<br>Ref: `reference_code`. |
| 11 | **CAPA Action Completed or Cancelled** | `updatePreventionActionStatus(userId, actionId, newStatus)` with status completed/cancelled | Single `UPDATE` + audit log $\to$ wrap into `transaction` | User 4 (`quality_staff`) | `prevention_actions` (`actionId`) | `quality_staff` (User 4) | Title: CAPA action finalized.<br>Ref: `reference_code`. |

---

## 4. ROLE-TO-RECIPIENT MAPPING IN SYNTHETIC CONTEXT

The project operates with five canonical synthetic accounts:
1. `User 1` (`prof.demo.expose`): `exposed_professional` — Declaring healthcare professional. Receives reviews, correction requests, and neutral OH coordination milestones.
2. `User 2` (`admin.demo.review`): `admin_reviewer` — Unit supervisor / HR officer. Receives new declaration submissions and correction responses.
3. `User 3` (`medecin.demo.sst`): `oh_professional` — Occupational Health doctor. Receives new coordination referrals.
4. `User 4` (`qualite.demo`): `quality_staff` — Quality and risk manager. Receives CAPA lifecycle notifications.
5. `User 5` (`admin.demo.tech`): `tech_admin` — Technical systems manager. **Zero operational notifications.**

---

## 5. PRIVACY & AUTHORIZATION BOUNDARIES

1. **Repository-Level Recipient Enclosure:**
   A caller cannot query notifications belonging to another `userId`. All repository queries take `userId` and enforce `WHERE recipient_user_id = ?`.
2. **Tech Admin Guard:**
   `getNotifications(userId)` and `getUnreadNotificationCount(userId)` immediately check the requesting user's role. If the role is `tech_admin`, the methods return empty lists / 0 counts and do not expose operational data.
3. **Target Navigation Authorization Check:**
   When a user clicks a notification to navigate:
   - Declarations: re-checks `canDeclare` (for own declarations) or `canReview` (for admin reviews).
   - Coordinations: re-checks `canFollowUp` (for SST) or `canReview`.
   - CAPAs: re-checks `canViewPrevention` or `canManagePrevention`.
   - If authorization fails or the target was deleted, a safe localized alert is shown without leaking target content.

---

## 6. PROPOSED NOTIFICATION DATA MODEL (MIGRATION 8)

### 6.1 Schema Specification
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
                        'prevention_action'
                      )),
  entity_id           INTEGER NOT NULL,
  entity_reference    TEXT,
  is_read             INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  read_at             TEXT,
  idempotency_key     TEXT    UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON in_app_notifications(recipient_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_all
  ON in_app_notifications(recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_idempotency
  ON in_app_notifications(idempotency_key);
```

### 6.2 Idempotency Key Design
To prevent duplicate notifications on retry, each generated notification derives a deterministic key:
`notif:<event_type>:<entity_type>:<entity_id>:<recipient_user_id>:<optional_state_or_timestamp>`
For example:
- `notif:declaration_submitted:aes_declaration:10:2`
- `notif:review_completed:administrative_review:5:1`
- `notif:capa_status_changed:prevention_action:3:4:in_progress`

`INSERT OR IGNORE` ensures absolute idempotency without throwing unique constraint crashes.

---

## 7. MIGRATION & DEMO RESET IMPACT

### 7.1 Migration 8 Registration
- Registered in `MIGRATIONS` array in `AesGuardianDatabase.ts` at `version: 8`.
- Description: `'In-app notifications table, indexes, and idempotency constraints (Phase 2D.2)'`.
- `CURRENT_SCHEMA_VERSION` advances from 7 to **8**.

### 7.2 Synthetic Reset Impact (`resetDemoScenario`)
In `AesGuardianDatabase.resetDemoScenario`:
- `in_app_notifications` must be deleted as part of the topological reset sequence.
- Deletion order update:
  1. `DELETE FROM in_app_notifications;`
  2. `DELETE FROM oh_follow_up_events;`
  ...
- `seedStandardScenario`:
  Will seed a curated, idempotent baseline set of notifications matching the standard demonstration records:
  - 1 unread notification for `admin_reviewer` (Decl 1 awaiting review).
  - 1 unread notification for `exposed_professional` (Decl 2 correction requested).
  - 1 notification for `oh_professional` (Decl 3 coordination referral).
  - 1 notification for `quality_staff` (CAPA-1 in progress).

---

## 8. RISKS & MITIGATION STRATEGY

1. **Risk:** Wrapping single SQL queries (`submitDeclaration`, `createOhCoordination`) in transactions could cause regressions.
   - *Mitigation:* `DatabaseService.transaction()` is proven reliable and non-blocking in SQLite; wrapping these ensures atomic notification + status updates.
2. **Risk:** Performance overhead from unread badge queries on workspace refresh.
   - *Mitigation:* Covered by composite index `idx_notifications_recipient_unread(recipient_user_id, is_read, created_at DESC)` running a lightweight `SELECT COUNT(*) WHERE recipient_user_id = ? AND is_read = 0`.
3. **Risk:** Tech Admin gaining accidental access to clinical notifications.
   - *Mitigation:* Hardcoded role check in notification queries throwing or returning 0/empty if role is `tech_admin`.

---

## 9. CONCLUSION

The architecture audit is complete. The event points, recipient mappings, privacy constraints, migration path, and transaction boundaries have been mapped to actual repository code without gaps. Implementation may proceed directly to Phase 2D.2B.
