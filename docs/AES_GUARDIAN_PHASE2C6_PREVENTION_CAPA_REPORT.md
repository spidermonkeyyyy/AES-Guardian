# AES GUARDIAN — PHASE 2C.6 IMPLEMENTATION REPORT
## Prevention & Corrective-Action Management (CAPA)

**Date:** 2026-11-12  
**Workspace:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**Phase:** 2C.6 (Prevention & Corrective-Action Management)  
**Status:** COMPLETE & VERIFIED

---

## 1. Executive Summary & Project Boundaries

Phase 2C.6 transitions the AES Guardian prototype from passive, descriptive surveillance into an active **Prevention and Corrective-Action Management (CAPA)** system.

All non-negotiable project boundaries have been preserved:
- **Worktree Isolation:** Work executed exclusively in `C:\Users\User\Desktop\sure\sanad-rn-migration` on `migration/aes-guardian`.
- **Untouched Original Repository:** The original SANAD repository at `C:\Users\User\Desktop\sure\sanad-rn` remains completely untouched.
- **Git Safety:** Zero commits or pushes performed; no destructive git operations.
- **Offline & Single-Device:** Powered entirely by local SQLite persistence via `@op-engineering/op-sqlite`. No cloud, no external network calls, no backend services.
- **Synthetic Data Prototype:** Synthetic demonstration records only. Mandatory persistent disclaimer banners on all prevention screens.
- **Provisional Contributing Factors:** Explicitly identified as provisional demonstration categories requiring institutional validation before any real-world use.
- **No Clinical Analysis:** Zero medical diagnosis, risk scoring, PEP eligibility, or treatment evaluations. Purely operational CAPA coordination.
- **RBAC Enforcement:** Strict multi-layered role-based access control. Authorized roles (`quality_staff`, `admin_reviewer`, `oh_professional`) receive appropriate access; prohibited roles (`exposed_professional`, `tech_admin`) are strictly blocked at both the domain/database and UI layers.

---

## 2. Database Foundation (Migration 7) & Schema Integrity

### 2.1 Table Schema: `prevention_actions`
Migration 7 creates the `prevention_actions` table with comprehensive CHECK constraints and indexes:

```sql
CREATE TABLE IF NOT EXISTS prevention_actions (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_code         TEXT    NOT NULL UNIQUE,
  title                  TEXT    NOT NULL,
  description            TEXT    NOT NULL,
  action_type            TEXT    NOT NULL CHECK (action_type IN ('corrective', 'preventive')),
  contributing_factor    TEXT    NOT NULL CHECK (contributing_factor IN (
                           'device_safety_design',
                           'procedure_compliance',
                           'workload_fatigue',
                           'waste_disposal_container',
                           'protective_equipment',
                           'training_supervision',
                           'environment_workspace',
                           'other_factor'
                         )),
  rationale              TEXT    NOT NULL,
  surveillance_reference TEXT,
  status                 TEXT    NOT NULL DEFAULT 'proposed'
                           CHECK (status IN ('proposed', 'in_progress', 'completed', 'cancelled')),
  target_date            TEXT,
  completed_at           TEXT,
  completion_notes       TEXT,
  created_by_user_id     INTEGER NOT NULL REFERENCES demo_users(id),
  created_at             TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at             TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_prevention_status ON prevention_actions(status);
CREATE INDEX IF NOT EXISTS idx_prevention_action_type ON prevention_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_prevention_factor ON prevention_actions(contributing_factor);
CREATE INDEX IF NOT EXISTS idx_prevention_created_by ON prevention_actions(created_by_user_id);
```

### 2.2 Foreign Key Hardening: Legacy `audit_events` Repair
During runtime testing on the Android emulator, an inherited schema issue from Migration 2 was discovered and permanently fixed:
- In Migration 2, `ALTER TABLE demo_users RENAME TO demo_users_v1` caused SQLite to automatically rewrite `audit_events.user_id` to reference `demo_users_v1`.
- When `demo_users_v1` was subsequently dropped, `audit_events` retained a dangling foreign key constraint that triggered `sqlite query error: no such table: main.demo_users_v1` on any audit event insertion.
- An automatic repair routine was introduced in `AesGuardianDatabase.initialize()` that detects any table referencing `demo_users_v1` and safely migrates `audit_events` to point cleanly to `demo_users(id)` within a transaction.

---

## 3. Strict Lifecycle & Transition Invariants

The prevention module implements an unambiguous lifecycle:
```
  [proposed]
    ├──► [in_progress]
    │      ├──► [completed]  (requires >= 3 char completion note)
    │      └──► [cancelled]
    └──► [cancelled]
```

Terminal states (`completed` and `cancelled`) cannot be reopened or transitioned to any other state.

### Role Permissions:
- `quality_staff`: Can create actions, transition status (`proposed` → `in_progress` → `completed`/`cancelled`), enter completion notes, view overview and register.
- `admin_reviewer`: Read-only access to overview, register, and action details. Cannot create or transition.
- `oh_professional`: Read-only access to overview, register, and action details. Cannot create or transition.
- `exposed_professional`: Strictly prohibited. Blocked by UI boundary guard and throws domain authorization exception on any database attempt.
- `tech_admin`: Strictly prohibited from operational/clinical prevention management. Throws domain authorization exception.

---

## 4. UI Architecture & Screen Delivery

Four responsive, accessible screens were implemented in `src/features/aes-guardian/screens/`:

1. **`PreventionOverviewScreen`**:
   - High-level KPI cards: Total Actions, Proposées, En cours, Clôturées, Annulées.
   - Interactive role-switcher bar allowing instant verification of RBAC boundaries.
   - Quick navigation buttons to "Voir le Registre" and "Nouvelle Action" (visible only for `quality_staff`).
   - Prominent prototype disclaimer banner.

2. **`PreventionActionRegisterScreen`**:
   - Filterable list of prevention actions with Status chips (Tous, Proposée, En cours, Clôturée, Annulée) and Type chips (Tous, Corrective, Préventive).
   - Floating Action Button (+) for creating new actions (quality_staff only).
   - Card layout displaying reference code, title, measure type badge, provisional factor, and target date.

3. **`PreventionActionCreateScreen`**:
   - Form with input validation: Title (min 3 chars), Description (min 5 chars), Type selector, Provisional Factor chips, Rationale (min 5 chars), Target Date (YYYY-MM-DD), optional Surveillance Reference.
   - Mandatory disclaimer: "Catégories provisoires — validation institutionnelle requise avant tout usage officiel."

4. **`PreventionActionDetailScreen`**:
   - Full action view with metadata, status badge, audit timeline history.
   - Status transition buttons (`Démarrer`, `Annuler`, `Clôturer`) shown dynamically based on current state and `canManage` permission.
   - Multiline completion note input prompt when completing an action.

---

## 5. Test Suite Verification

All Jest tests pass with zero failures:
- **Total Test Suites:** 26 passed, 26 total
- **Total Tests:** 354 passed, 354 total
- **Migration 7 Tests:** 9 tests covering table creation, schema version 7, check constraints, indexes, lifecycle transitions.
- **Workflow Tests:** 22 tests covering full creation, validation, filtering, unauthorized role blocking, and terminal state immutability.
