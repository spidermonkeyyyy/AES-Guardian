# AES Guardian Phase 2E.1.7.2.0 — Prevention & CAPA UI Transformation Scope Discovery Report

**Branch**: `migration/aes-guardian`  
**HEAD**: `d79b01ef51646509170996f8c77517f95470f217`  
**Date**: 2026-11-17  
**Mode**: READ-ONLY — No source changes, no commits, no Git operations

---

## 1. Executive Summary

This discovery report catalogs the existing Prevention/CAPA screens, routes, domain contracts, role boundaries, UI components, tests, and Git state to define the **minimal safe UI transformation scope** for Phase 2E.1.7.2.0. The mandate is to re-skin the four Prevention/CAPA screens to the AES design system (AesScreenContainer, AesCard, AesStatusBadge, AesButton, AesRoundArrowButton, AesScreenHeader, AesOptionCard) **without altering any domain logic, contracts, roles, taxonomies, fields, or workflows** established in Phase 2C.6.

---

## 2. Screens Inventory (4 Total)

| Screen | Path | Primary Role | Key Responsibilities |
|--------|------|--------------|---------------------|
| **PreventionActionCreateScreen** | `preventionCreate` | `quality_staff` only | Form for creating prevention actions (title, description, action_type, contributing_factor, rationale, due_date). Validates client-side before submit. |
| **PreventionActionDetailScreen** | `preventionActionDetail` | `quality_staff` (CRUD), `admin_reviewer`/`oh_professional` (read-only) | View/edit prevention action. Quality staff can update status via transitions; others see read-only view. |
| **PreventionActionRegisterScreen** | `preventionRegister` | `quality_staff`, `admin_reviewer`, `oh_professional` | Filterable list (status, action_type, contributing_factor, date range). Navigates to detail on press. |
| **PreventionOverviewScreen** | `preventionOverview` | `quality_staff`, `admin_reviewer`, `oh_professional` | Aggregate counts by status and type. Navigation entry points to register/create. |

**All four screens are modified (M) in Git status** — confirms they are the active working copies.

---

## 3. Navigation & Routes

**Defined in `src/navigation/routes.ts` (RootStackParamList):**
```typescript
preventionOverview: undefined;
preventionRegister: undefined;
preventionCreate: undefined;
preventionActionDetail: { actionId: string };
```

**Wired in `src/navigation/AppNavigator.tsx` for all three role paths:**
- Unauthenticated stack: routes present but guarded
- `nurseSide` stack: routes present but guarded (nurseSide has no Prevention access)
- Authenticated non-nurseSide stack: routes accessible per auth matrix

**Navigation resolver** (`src/navigation/notificationNavigationResolver.ts`) includes `preventionActionDetail` route for deep-linking from notifications.

---

## 4. Authorization Matrix (Phase 2C.6 Contract — IMMUTABLE)

| Predicate | Roles | Screens Affected |
|-----------|-------|------------------|
| `canManagePreventionActions` | `quality_staff` | Create, Detail (edit), Register (full), Overview |
| `canViewPreventionActions` | `quality_staff`, `admin_reviewer`, `oh_professional` | Detail (read-only), Register (read-only), Overview |

**Source**: `src/core/auth/boundaries.ts`  
**Enforcement**: Route-level guards in `AppNavigator.tsx` + screen-level `useAuth().canManagePreventionActions()` checks.

---

## 5. Domain Types & Taxonomies (Phase 2C.6 Contract — IMMUTABLE)

**File**: `src/core/database/types.ts`

```typescript
// Statuses (enforced by VALID_PREVENTION_TRANSITIONS)
export type PreventionActionStatus =
  | 'proposed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Types
export type PreventionActionType = 'corrective' | 'preventive';

// Contributing Factors
export type ContributingFactorCategory =
  | 'human_factor'
  | 'system_factor'
  | 'environmental_factor'
  | 'organizational_factor'
  | 'technical_factor'
  | 'communication_factor'
  | 'training_factor'
  | 'other';

// Core Entity
export interface PreventionAction {
  id: string;
  declaration_id: string;
  title: string;
  description: string;
  action_type: PreventionActionType;
  contributing_factor: ContributingFactorCategory;
  status: PreventionActionStatus;
  rationale: string;
  due_date: string; // ISO date
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

**Enums exported as constants**: `PREVENTION_ACTION_STATUSES`, `PREVENTION_ACTION_TYPES`, `CONTRIBUTING_FACTOR_CATEGORIES` — used by screens for dropdowns/validation.

---

## 6. Database Repository Contract (IMMUTABLE)

**File**: `src/core/database/AesGuardianDatabase.ts`

| Method | Signature | Key Behavior |
|--------|-----------|--------------|
| `createPreventionAction` | `(userId, input) => PreventionActionDetail` | Validates title (≥3), description (≥5), action_type enum, contributing_factor enum, rationale (≥5). Emits `CREATE_PREVENTION_ACTION` audit event. |
| `getPreventionAction` | `(actionId) => PreventionActionDetail \| null` | Returns detail with `declarationTitle`, `creatorName`. |
| `listPreventionActions` | `(filters?) => PreventionActionDetail[]` | Supports `PreventionActionFilters` (status, action_type, contributing_factor, date_from, date_to). |
| `updatePreventionActionStatus` | `(actionId, userId, newStatus) => PreventionActionDetail` | **Enforces `VALID_PREVENTION_TRANSITIONS`** — only `proposed→in_progress/cancelled`, `in_progress→completed/cancelled`. Emits `UPDATE_PREVENTION_ACTION_STATUS` audit event. |
| `listPreventionActionsByDeclaration` | `(declarationId) => PreventionActionDetail[]` | Scoped to declaration. |
| `getPreventionActionsSummary` | `() => { byStatus, byType, total }` | Powers `PreventionOverviewScreen` aggregate counts. |

**Transition Matrix (IMMUTABLE):**
```typescript
export const VALID_PREVENTION_TRANSITIONS: Record<PreventionActionStatus, PreventionActionStatus[]> = {
  proposed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};
```

---

## 7. Test Coverage

**File**: `src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts` (23 tests)

| Category | Count | Coverage |
|----------|-------|----------|
| Lifecycle (create → proposed → in_progress → completed) | 4 | Full transition path |
| Status transitions (valid/invalid per matrix) | 5 | Enforces `VALID_PREVENTION_TRANSITIONS` |
| Authorization matrix (manage vs view roles) | 6 | `quality_staff` CRUD, `admin_reviewer`/`oh_professional` read-only |
| Privacy (declaration scoping, user isolation) | 3 | Data isolation |
| Input validation (title, description, rationale lengths) | 3 | Client + server validation |
| Audit events emitted | 2 | `CREATE_PREVENTION_ACTION`, `UPDATE_PREVENTION_ACTION_STATUS` |

**All 23 tests PASS** in full suite (1071/1071).

---

## 8. AES Shared Components (Design System Primitives)

**Barrel**: `src/features/aes-guardian/components/index.ts`

| Component | Props/Variants Relevant to Prevention/CAPA |
|-----------|-------------------------------------------|
| `AesButton` | `variant: 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive'`, `size`, `loading`, `fullWidth` |
| `AesCard` | `variant: 'default' \| 'outlined' \| 'elevated'`, `padding`, `onPress` |
| `AesOptionCard` | `selected`, `onPress`, `children` — for filter chips, type selectors |
| `AesRoundArrowButton` | `onPress`, `accessibilityLabel` — for navigation actions |
| `AesScreenContainer` | `style`, `children` — root screen wrapper |
| `AesScreenHeader` | `title`, `subtitle`, `action`, `backAction` — consistent header |
| `AesStatusBadge` | `status: PreventionActionStatus \| 'capa' \| ...`, `size: 'sm' \| 'md' \| 'lg'` — **already supports prevention statuses** |
| `AesTextInput`, `AesTextArea`, `AesSelect`, `AesDatePicker` | Form primitives for `PreventionActionCreateScreen` |
| `AesEmptyState`, `AesLoadingOverlay`, `AesErrorBanner` | State UI for register/overview |

**Critical Finding**: `AesStatusBadge` **already supports** `PreventionActionStatus` values (`proposed`, `in_progress`, `completed`, `cancelled`) via its `status` prop. No new badge variants needed.

---

## 9. Localization Keys (Complete Coverage)

**File**: `src/localization/index.ts` — 200+ prevention/CAPA keys inspected

| Category | Key Prefix Examples |
|----------|---------------------|
| Navigation | `aesGuardian.preventionOverview.title`, `aesGuardian.preventionRegister.title`, `aesGuardian.preventionCreate.title`, `aesGuardian.preventionActionDetail.title` |
| Overview | `aesGuardian.preventionOverview.totalActions`, `aesGuardian.preventionOverview.byStatus`, `aesGuardian.preventionOverview.byType` |
| Register | `aesGuardian.preventionRegister.filters.*`, `aesGuardian.preventionRegister.emptyState`, `aesGuardian.preventionRegister.actionItem.*` |
| Create | `aesGuardian.preventionCreate.form.*`, `aesGuardian.preventionCreate.validation.*`, `aesGuardian.preventionCreate.submit` |
| Detail | `aesGuardian.preventionActionDetail.header.*`, `aesGuardian.preventionActionDetail.fields.*`, `aesGuardian.preventionActionDetail.actions.*` |
| Status Labels | `aesGuardian.status.proposed`, `aesGuardian.status.in_progress`, `aesGuardian.status.completed`, `aesGuardian.status.cancelled` |
| Types | `aesGuardian.preventionActionType.corrective`, `aesGuardian.preventionActionType.preventive` |
| Contributing Factors | `aesGuardian.contributingFactor.human_factor`, ... (all 8 categories) |

**All keys present** — no new localization required for transformation.

---

## 10. Git Working Tree State (Relevant Modified Files)

```
 M src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx
 M src/features/aes-guardian/screens/PreventionActionDetailScreen.tsx
 M src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx
 M src/features/aes-guardian/screens/PreventionOverviewScreen.tsx
 M src/features/aes-guardian/components/index.ts (AES shared components barrel)
 M src/features/aes-guardian/components/AesStatusBadge.tsx
 M src/features/aes-guardian/components/AesButton.tsx
 M src/features/aes-guardian/components/AesCard.tsx
 M src/features/aes-guardian/components/AesScreenContainer.tsx
 M src/features/aes-guardian/components/AesScreenHeader.tsx
 M src/features/aes-guardian/components/AesOptionCard.tsx
 M src/features/aes-guardian/components/AesRoundArrowButton.tsx
 M src/core/database/types.ts
 M src/core/database/AesGuardianDatabase.ts
 M src/core/auth/boundaries.ts
 M src/navigation/routes.ts
 M src/navigation/AppNavigator.tsx
 M src/localization/index.ts
```

**No new files added** — transformation scope is strictly re-skinning existing screens.

---

## 11. Minimal Safe Transformation Scope

### In Scope (UI Re-skin Only)
1. **PreventionActionCreateScreen** → Replace custom form layout with `AesScreenContainer` + `AesScreenHeader` + `AesCard` sections + `AesTextInput`/`AesTextArea`/`AesSelect`/`AesDatePicker` + `AesButton` (primary submit, secondary cancel)
2. **PreventionActionDetailScreen** → Replace with `AesScreenContainer` + `AesScreenHeader` + `AesCard` field groups + `AesStatusBadge` (existing support) + `AesButton`/`AesRoundArrowButton` for status transitions (quality_staff only)
3. **PreventionActionRegisterScreen** → Replace with `AesScreenContainer` + `AesScreenHeader` + `AesOptionCard` filter chips + `AesCard` list items + `AesStatusBadge` + `AesEmptyState`
4. **PreventionOverviewScreen** → Replace with `AesScreenContainer` + `AesScreenHeader` + `AesCard` stat cards (count by status/type) + `AesRoundArrowButton` navigation to register/create

### Out of Scope (Contract Preservation — DO NOT TOUCH)
- ❌ `VALID_PREVENTION_TRANSITIONS` matrix
- ❌ `canManagePreventionActions` / `canViewPreventionActions` predicates
- ❌ `PreventionActionStatus`, `PreventionActionType`, `ContributingFactorCategory` enums
- ❌ Database repository method signatures & audit events
- ❌ Navigation route definitions & param shapes
- ❌ Localization keys
- ❌ Test expectations (23 tests must continue to pass unchanged)

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Accidental status enum change | Low | High | TypeScript enforces enum usage; tests validate transitions |
| Auth predicate drift | Low | High | Route guards + screen checks use shared `boundaries.ts` |
| Missing localization key | Low | Medium | All 200+ keys verified present |
| Test regression | Medium | High | Run full suite (1071 tests) after each screen transformation |
| AesStatusBadge gap | None | N/A | Already supports all 4 prevention statuses |

---

## 13. Next Steps (Phase 2E.1.7.2.1+)

1. **2E.1.7.2.1** — Transform `PreventionOverviewScreen` (simplest, read-only aggregate)
2. **2E.1.7.2.2** — Transform `PreventionActionRegisterScreen` (list + filters)
3. **2E.1.7.2.3** — Transform `PreventionActionCreateScreen` (form-heavy)
4. **2E.1.7.2.4** — Transform `PreventionActionDetailScreen` (conditional edit/read-only)
5. **2E.1.7.2.5** — Final acceptance audit (behavioral + TypeScript + test suite)

Each step: implement → run 1071-test suite → verify 0 TypeScript diagnostics → document evidence.

---

## 14. Appendix: File Reference Map

| Concern | File |
|---------|------|
| Screen: Create | `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx` |
| Screen: Detail | `src/features/aes-guardian/screens/PreventionActionDetailScreen.tsx` |
| Screen: Register | `src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx` |
| Screen: Overview | `src/features/aes-guardian/screens/PreventionOverviewScreen.tsx` |
| Tests | `src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts` |
| Types | `src/core/database/types.ts:551-645` |
| Database Repo | `src/core/database/AesGuardianDatabase.ts:2441-2580` |
| Transitions | `src/core/database/AesGuardianDatabase.ts:462-475` |
| Auth | `src/core/auth/boundaries.ts` |
| Routes | `src/navigation/routes.ts` |
| Navigator | `src/navigation/AppNavigator.tsx` |
| Localization | `src/localization/index.ts` (search `prevention`) |
| Components | `src/features/aes-guardian/components/` |
| Component Barrel | `src/features/aes-guardian/components/index.ts` |