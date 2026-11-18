# AES Guardian Phase 2E.1.7.0 — Batch 7 Scope Discovery Report

**Batch:** 7 — Surveillance Dashboard Analytics  
**Phase:** 2E.1 (Post-Batch 6 OH Coordination)  
**Status:** READ-ONLY DISCOVERY COMPLETE — NO IMPLEMENTATION  
**Branch:** `migration/aes-guardian`  
**HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Date:** 2026-11-17

---

## 1. Executive Summary

Batch 7 targets the **Surveillance Dashboard Analytics** — the aggregate monitoring and analytics surface for AES Guardian. This batch completes the analytical layer atop the declaration, administrative review, occupational-health coordination, and prevention action domains established in Phases 2C.2–2C.6.

The primary artifact is **`SurveillanceDashboardScreen.tsx`** (route: `surveillanceDashboard`), which consumes the existing repository method `getSurveillanceDashboardMetrics(userId, filters?)` from `AesGuardianDatabase.ts`. All underlying data contracts, authorization boundaries, localization keys, and test coverage are already in place. This discovery confirms **zero new database methods, types, or navigation routes are required** — Batch 7 is a pure UI transformation task using existing synthetic-data-only infrastructure.

---

## 2. Primary Candidate Screen

| Property | Value |
|----------|-------|
| **File** | `src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx` |
| **Route Key** | `surveillanceDashboard` (registered in `src/navigation/routes.ts` as `undefined`) |
| **Navigation Import** | `AppNavigator.tsx` imports `SurveillanceDashboardScreen` |
| **Component Type** | Functional React Native component (class-based, to be migrated to standalone/signal pattern) |
| **Primary Data Hook** | `useSurveillanceDashboardMetrics` (calls `db.getSurveillanceDashboardMetrics`) |
| **Filter Controls** | Date range (startDate/endDate), Status dropdown, Incident Type dropdown |
| **Visualization Sections** | Overview KPIs, Temporal Distribution (bar/line), Exposure Category (pie/donut), Status Distribution, Administrative Review Metrics, Occupational Health Metrics |

### Screen Responsibilities (from source)

- Fetch aggregate metrics via `getSurveillanceDashboardMetrics(userId, filters)`
- Render filter bar with controlled inputs (date pickers, select menus)
- Display 6 metric sections with de-identified counts only
- Handle loading, empty, and error states
- Enforce role-based visibility at UI layer (mirroring repository enforcement)
- Support FR/EN/AR localization via `t()` keys

---

## 3. Database Repository Methods

### `getSurveillanceDashboardMetrics` — `src/core/database/AesGuardianDatabase.ts`

```typescript
async getSurveillanceDashboardMetrics(
  userId: number,
  filters?: SurveillanceFilters
): Promise<SurveillanceDashboardMetrics>
```

**Location:** Lines ~1800–2100 (exact line range to be confirmed during implementation)

**Authorization Boundary (enforced in repository):**
- **PERMITTED:** `quality_staff`, `admin_reviewer`, `oh_professional`
- **FORBIDDEN:** `exposed_professional`, `tech_admin` → throws `UnauthorizedError`

**Query Logic Summary:**
1. Validates requesting user exists and role is permitted
2. Builds base declaration query with optional filters:
   - `status` (DeclarationStatus)
   - `incidentType` (AesIncidentType)
   - `startDate` / `endDate` (ISO 8601)
3. Executes aggregated queries for:
   - Overview counts by declaration status + OH coordination status
   - Temporal distribution by month (`YYYY-MM` format, `unknown` bucket for invalid dates)
   - Exposure category distribution by `AesIncidentType`
   - Status distribution (all declaration statuses)
   - Administrative review metrics (total, outcomes breakdown, correction requests/responses)
   - Occupational health metrics (coordination status distribution, follow-up event categories)
4. Applies filter synchronization: reviews, responses, coordinations, events scoped to filtered declarations only
5. Returns `SurveillanceDashboardMetrics` with optional `filterSummary`

**Key Implementation Details:**
- Uses CTEs to avoid cartesian product inflation (validated in tests)
- Invalid incident dates grouped into `unknown` temporal bucket
- Inverted date ranges handled gracefully (returns empty results)
- All results strictly de-identified — zero personal/clinical fields

---

## 4. Domain Type Contracts

All types defined in `src/core/database/types.ts`:

### `SurveillanceFilters` (lines 484–489)
```typescript
export interface SurveillanceFilters {
  startDate?: string;      // ISO 8601
  endDate?: string;        // ISO 8601
  status?: DeclarationStatus;
  incidentType?: AesIncidentType;
}
```

### `SurveillanceDashboardMetrics` (lines 495–543)
```typescript
export interface SurveillanceDashboardMetrics {
  overview: {
    totalDeclarations: number;
    draftDeclarations: number;
    submittedDeclarations: number;
    underReviewDeclarations: number;
    correctionRequestedDeclarations: number;
    resubmittedDeclarations: number;
    closedDeclarations: number;
    activeOhCoordinations: number;     // pending_acknowledgement + acknowledged
    completedOhCoordinations: number;  // completed
  };
  temporalDistribution: Array<{ month: string; count: number }>;  // 'YYYY-MM' or 'unknown'
  exposureDistribution: Array<{ incidentType: AesIncidentType | string; count: number }>;
  statusDistribution: Array<{ status: DeclarationStatus | string; count: number }>;
  administrativeReview: {
    totalReviews: number;
    outcomes: Array<{ outcome: ReviewOutcome | string; count: number }>;
    correctionRequests: number;
    correctionResponses: number;
  };
  occupationalHealth: {
    statusDistribution: Array<{ status: OhCoordinationStatus | string; count: number }>;
    eventCategories: Array<{ category: OhFollowUpEventCategory | string; count: number }>;
  };
  filterSummary?: {
    totalRecords: number;
    matchingDeclarations: number;
    hasActiveFilters: boolean;
  };
}
```

### Supporting Enums (already defined, no changes needed)
- `DeclarationStatus` (lines 147–163): `draft | submitted | under_review | correction_requested | resubmitted | closed`
- `AesIncidentType` (lines 223–234): `percutaneous_exposure | mucocutaneous_exposure | sexual_assault | other`
- `ReviewOutcome` (lines 246–255): `acknowledged | transmission_verified | correction_requested`
- `OhCoordinationStatus` (lines 306–317): `pending_acknowledgement | acknowledged | completed | cancelled`
- `OhFollowUpEventCategory` (lines 340–355): `contact_attempt_recorded | contact_established | appointment_coordinated | consultation_recorded | follow_up_continued | follow_up_completed`

---

## 5. Navigation & Routing

| File | Key Finding |
|------|-------------|
| `src/navigation/routes.ts` | Route key `surveillanceDashboard: undefined` registered in `AesGuardianRoutes` |
| `src/navigation/AppNavigator.tsx` | Imports `SurveillanceDashboardScreen`; renders under AES Guardian stack |
| **Route Params** | None required (screen derives userId from auth context) |

**Navigation Entry Point:** Accessible via AES Guardian workspace module navigation (see localization key `workspace.module.surveillanceDashboard`)

---

## 6. Authorization Matrix

### Repository Layer (`AesGuardianDatabase.ts`)
| Role | `getSurveillanceDashboardMetrics` |
|------|-----------------------------------|
| `quality_staff` | ✅ PERMITTED |
| `admin_reviewer` | ✅ PERMITTED |
| `oh_professional` | ✅ PERMITTED |
| `exposed_professional` | ❌ FORBIDDEN — throws `UnauthorizedError: role 'exposed_professional' is strictly prohibited...` |
| `tech_admin` | ❌ FORBIDDEN — throws `UnauthorizedError: role 'tech_admin' is strictly prohibited...` |

### UI Layer (`src/core/auth/boundaries.ts` — `canViewSurveillanceDashboard`)
```typescript
export function canViewSurveillanceDashboard(context: AuthContext): boolean {
  if (!context.isAuthenticated) return false;
  return (
    context.role === 'quality_staff' ||
    context.role === 'admin_reviewer' ||
    context.role === 'oh_professional'
  );
}
```

### Synthetic Context Mapping (for testing/demo)
| Synthetic Context | Role | User ID | Dashboard Access |
|-------------------|------|---------|------------------|
| `SYNTHETIC_DEMO_CONTEXT` | `exposed_professional` | 1 | ❌ FORBIDDEN |
| `SYNTHETIC_ADMIN_REVIEWER_CONTEXT` | `admin_reviewer` | 2 | ✅ PERMITTED |
| `SYNTHETIC_OH_PROFESSIONAL_CONTEXT` | `oh_professional` | 3 | ✅ PERMITTED |
| `SYNTHETIC_QUALITY_STAFF_CONTEXT` | `quality_staff` | 4 | ✅ PERMITTED |
| `SYNTHETIC_TECH_ADMIN_CONTEXT` | `tech_admin` | 5 | ❌ FORBIDDEN |

**Constraint:** UI-layer checks are NOT a substitute for repository enforcement. Both layers must align.

---

## 7. Localization Coverage

**File:** `src/localization/index.ts`  
**Languages:** FR (default), EN, AR (RTL)

### Confirmed Keys for Batch 7

| Category | Keys (sample) |
|----------|---------------|
| **Workspace Module** | `workspace.module.surveillanceDashboard`, `workspace.module.surveillanceDashboardDesc` |
| **Dashboard Sections** | `dashboard.overview`, `dashboard.temporalDistribution`, `dashboard.exposureDistribution`, `dashboard.statusDistribution`, `dashboard.administrativeReview`, `dashboard.occupationalHealth` |
| **Filter Controls** | `filter.startDate`, `filter.endDate`, `filter.status`, `filter.incidentType`, `filter.apply`, `filter.reset`, `filter.activeFilters`, `filter.totalRecords`, `filter.matchingDeclarations` |
| **Metrics Labels** | `metrics.totalDeclarations`, `metrics.activeOhCoordinations`, `metrics.completedOhCoordinations`, `metrics.totalReviews`, `metrics.correctionRequests`, `metrics.correctionResponses` |
| **Status Labels** | `status.draft`, `status.submitted`, `status.under_review`, `status.correction_requested`, `status.resubmitted`, `status.closed` |
| **Incident Types** | `incidentType.percutaneous_exposure`, `incidentType.mucocutaneous_exposure`, `incidentType.sexual_assault`, `incidentType.other` |
| **OH Status** | `ohCoordinationStatus.pending_acknowledgement`, `ohCoordinationStatus.acknowledged`, `ohCoordinationStatus.completed`, `ohCoordinationStatus.cancelled` |
| **Review Outcomes** | `reviewOutcome.acknowledged`, `reviewOutcome.transmission_verified`, `reviewOutcome.correction_requested` |
| **Event Categories** | `ohEventCategory.contact_attempt_recorded`, `ohEventCategory.contact_established`, `ohEventCategory.appointment_coordinated`, `ohEventCategory.consultation_recorded`, `ohEventCategory.follow_up_continued`, `ohEventCategory.follow_up_completed` |

**Gap Assessment:** All required keys present for FR/EN/AR. No new keys needed.

---

## 8. Shared Component Dependencies

`SurveillanceDashboardScreen.tsx` imports and uses:

| Component | Source | Purpose |
|-----------|--------|---------|
| `ScreenContainer` | `src/components/common/ScreenContainer` | Layout wrapper with safe area |
| `SectionHeader` | `src/components/common/SectionHeader` | Section titles with optional actions |
| `KPICard` | `src/components/common/KPICard` | Overview metric cards |
| `FilterBar` | `src/components/common/FilterBar` | Date pickers, selects, apply/reset |
| `BarChart` / `LineChart` | `src/components/charts/` | Temporal distribution |
| `DonutChart` / `PieChart` | `src/components/charts/` | Exposure category distribution |
| `DataTable` | `src/components/common/DataTable` | Tabular metric breakdowns |
| `EmptyState` | `src/components/common/EmptyState` | No-data / filtered-empty states |
| `LoadingSkeleton` | `src/components/common/LoadingSkeleton` | Loading placeholders |
| `ErrorDisplay` | `src/components/common/ErrorDisplay` | Error boundary / retry |

**Note:** All shared components exist and are used by previously transformed screens (Batch 1–6). No new shared components required.

---

## 9. Test Coverage Analysis

**File:** `src/features/aes-guardian/__tests__/surveillance-dashboard.test.ts` (491 lines)

### Coverage Summary

| Test Suite | Tests | Key Assertions |
|------------|-------|----------------|
| **Aggregate Correctness** | 5 | Overview counts, temporal chronological order, exposure distribution, admin review metrics (no duplicate inflation), OH coordination/event distributions |
| **Filter Application** | 7 | Status filter, incident type filter, date range filter, combined filters, cross-domain synchronization, empty results, inverted date range, unknown date bucket |
| **Authorization Matrix & Privacy** | 7 | quality_staff ✅, admin_reviewer ✅, oh_professional ✅, exposed_professional ❌, tech_admin ❌, non-existent user ❌, zero identifying fields in response |
| **Synthetic Context Boundaries** | 2 | Context ID mapping validation, `canViewSurveillanceDashboard` matrix across all 5 roles + unauthenticated |

### Coverage Gaps (for implementation awareness)
- No visual regression / snapshot tests for chart rendering
- No integration test for filter bar → metrics update flow
- No performance test for large synthetic datasets (>1000 declarations)
- RTL (AR) layout verification not explicitly tested

---

## 10. Batch 7 Scope Definition

### IN SCOPE (Transformation Tasks)
1. **Migrate `SurveillanceDashboardScreen.tsx`** to Angular-style standalone component pattern with signal-based inputs/outputs, `OnPush` change detection, host bindings
2. **Apply design system tokens** (colors, spacing, typography) per `theme-factory` / `design-system` skills
3. **Implement filter bar** with controlled date pickers, selects, apply/reset using shared `FilterBar`
4. **Wire chart components** (`BarChart`, `DonutChart`, `DataTable`) to metrics data
5. **Enforce UI authorization guard** using `canViewSurveillanceDashboard` (redirect/forbidden UI for prohibited roles)
6. **Connect localization keys** for FR/EN/AR with RTL support
7. **Add loading / empty / error states** using shared components
8. **Verify test parity** — existing tests must pass post-migration

### OUT OF SCOPE (No Work Required)
- ❌ New database methods or schema changes
- ❌ New domain types or enums
- ❌ New navigation routes or route parameters
- ❌ New localization keys
- ❌ New shared components
- ❌ Authorization logic changes (repository + UI already aligned)
- ❌ Test additions (existing coverage sufficient for transformation verification)
- ❌ Synthetic data seeding modifications
- ❌ Prevention/CAPA screens (already transformed in Batch 6 / Phase 2C.6)

### Dependency Chain
- **Prerequisite:** Batch 6 (OH Coordination) complete ✅
- **Prerequisite:** Phase 2C.6 (Prevention/CAPA) complete ✅
- **Blocks:** None — Batch 7 is a leaf in the analytical layer

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Chart library API mismatch during migration | Low | Medium | Use existing chart component wrappers; verify props in `src/components/charts/` |
| Filter state management complexity | Medium | Low | Leverage existing `FilterBar` pattern from `PreventionOverviewScreen` |
| RTL layout breakage for AR charts | Low | Medium | Test with `I18nManager.forceRTL(true)` in dev; chart components already RTL-aware |
| Authorization double-check bypass | Very Low | High | Repository enforcement is source of truth; UI guard is defense-in-depth |

---

## 12. Sign-Off

**Discovery Complete:** ✅ All 10 required sections populated with evidence from source files.

**Ready for Implementation:** Yes — Batch 7 scope is fully bounded, all contracts exist, no blockers identified.

**Next Action:** Begin implementation per Phase 2E.1.7.1+ tasks (UI transformation only).

---

*Report generated by read-only discovery agent. No code modifications performed.*