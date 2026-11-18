# AES Guardian — Phase 2E.1.7.0.1 Surveillance Dashboard Architecture & UI Dependency Reconciliation Report

**Repository:** `sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**HEAD:** `d79b01ef51646509170996f8c77517f95470f217`  
**Working Tree:** 17 modified, 1 untracked (preflight captured)  
**Database Schema Version:** 8  
**Date:** 2026-11-17  
**Classification:** READ-ONLY TECHNICAL RECONCILIATION — NO IMPLEMENTATION

---

## 1. EXECUTIVE SUMMARY

This report presents the findings of a read-only technical reconciliation audit for **Phase 2E.1.7.0.1 (Surveillance Dashboard Architecture & UI Dependency Reconciliation)**. The audit examines the current state of `src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx` against the AES Guardian shared component library, database layer, authorization boundaries, localization system, and test coverage to determine readiness for Batch 7 implementation.

### Key Findings

| Area | Status | Evidence |
|------|--------|----------|
| **Target Screen Architecture** | `VERIFIED IN SOURCE` | Function component using `useState`, `useEffect`, `useCallback`; legacy `useTheme` from `ThemeContext`; inline `StyleSheet`; demo role switcher; filter state; pull-to-refresh |
| **AES Shared Components (7/7)** | `VERIFIED IN SOURCE` | All 7 components exist with documented props, theme token usage, accessibility support |
| **Legacy Common Components (3/3)** | `VERIFIED IN SOURCE` | `AppCard`, `AppHeader`, `AppButton` use legacy `ThemeContext`, not AES tokens |
| **Database Layer** | `VERIFIED IN SOURCE` | `getSurveillanceDashboardMetrics(userId, filters?)` with CTE aggregation; authorization enforcement (3 permitted, 2 forbidden roles) |
| **Authorization Boundaries** | `VERIFIED IN SOURCE` | `canViewSurveillanceDashboard` in `boundaries.ts` aligned with repository enforcement |
| **Type Definitions** | `VERIFIED IN SOURCE` | `SurveillanceDashboardMetrics`, `SurveillanceFilters`, `AesIncidentType` (includes `sexual_assault`), `DeclarationStatus`, `ReviewOutcome`, `OhCoordinationStatus`, `OhFollowUpEventCategory` |
| **Localization (FR/EN/AR)** | `VERIFIED IN SOURCE` | All 47 surveillance keys translated in 3 languages; RTL helper (`isRTL`); `DEFAULT_LOCALE = 'fr'` |
| **Database Tests (21 tests)** | `VERIFIED BY TEST` | Full coverage of aggregates, filters, authorization matrix, privacy, synthetic contexts |
| **UI Tests** | `UNVERIFIED` | No UI-level tests for loading, empty, error states, chart rendering, accessibility, filter interaction, refresh behavior |
| **Chart/Visualization Components** | `UNVERIFIED` | `BarChart`, `LineChart`, `DonutChart`, `PieChart`, `DataTable`, `EmptyState`, `LoadingSkeleton`, `ErrorDisplay`, `KPICard`, `FilterBar`, `SectionHeader` — **NONE EXIST** in codebase |
| **Prevention/CAPA Screens (Phase 2C.6)** | `VERIFIED IN SOURCE` | 4 screens exist (`PreventionOverviewScreen`, `PreventionActionRegisterScreen`, `PreventionActionDetailScreen`, `PreventionActionCreateScreen`); all use legacy `useTheme` + inline `StyleSheet`, **not** AES shared components |
| **CAPA Tests** | `VERIFIED BY TEST` | 20+ tests in `prevention-action-workflow.test.ts` covering creation, lifecycle, filtering, audit, authorization, privacy |

### Authorization Matrix (Verified)

| Role | Surveillance Dashboard | Prevention/CAPA |
|------|------------------------|-----------------|
| `quality_staff` | ✅ PERMITTED | ✅ FULL CRUD |
| `admin_reviewer` | ✅ PERMITTED | 👁️ READ-ONLY |
| `oh_professional` | ✅ PERMITTED | 👁️ READ-ONLY |
| `exposed_professional` | ❌ FORBIDDEN | ❌ FORBIDDEN |
| `tech_admin` | ❌ FORBIDDEN | ❌ FORBIDDEN |

---

## 2. SURVEILLANCE DASHBOARD SCREEN — CURRENT ARCHITECTURE ANALYSIS

### 2.1 Component Structure (`SurveillanceDashboardScreen.tsx`)

```typescript
export const SurveillanceDashboardScreen: React.FC = () => {
  // Theme: Legacy useTheme() from ThemeContext (NOT AES tokens directly)
  // State: 7 useState hooks (activeRoleContext, filters, loading, error, metrics, refreshing)
  // Effects: useEffect for initial load + filter changes
  // Callbacks: useCallback for loadMetrics, filter handlers, refresh
  // Render: ScrollView with RefreshControl
}
```

**Hooks Used:**
- `useState` × 7: `activeRoleContext`, `filterStatus`, `filterExposure`, `filterStartDate`, `filterEndDate`, `loading`, `error`, `metrics`, `refreshing`
- `useEffect` × 2: Initial load + filter change trigger
- `useCallback` × 4: `loadMetrics`, `handleStatusFilter`, `handleExposureFilter`, `handleDateFilter`, `handleClearFilters`, `onRefresh`

**UI Sections (in render order):**
1. **Disclaimer Banner** — Yellow warning box with `t('surveillance.disclaimer')`
2. **Role Switcher** — Horizontal scrollable chips (5 demo roles)
3. **Unauthorized View** — Red box when `!canViewSurveillanceDashboard(activeRoleContext)`
4. **Filters Section** — Status dropdown, Exposure type dropdown, Date range inputs, Clear button
5. **Loading Indicator** — `ActivityIndicator` when `loading && !metrics`
6. **Error Display** — Red box with error message
7. **Overview KPIs** — 8 stat cards in 2-row grid (total, draft, submitted, under_review, correction_requested, resubmitted, closed, activeOh, completedOh)
8. **Temporal Distribution** — Section title + "chart placeholder" text (`t('surveillance.temporal.empty')` or data)
9. **Exposure Distribution** — Section title + "chart placeholder" text
10. **Status Distribution** — Section title + "chart placeholder" text
11. **Administrative Review Indicators** — Section title + 4 stat cards (totalReviews, correctionRequests, correctionResponses, outcomes breakdown)
12. **Occupational Health Indicators** — Section title + status distribution + event categories

### 2.2 Theme & Styling Approach

| Aspect | Current Implementation | AES Standard |
|--------|------------------------|--------------|
| **Color Source** | `useTheme()` → `colors.background`, `colors.primary`, `colors.card`, `colors.border`, `colors.text`, `colors.mutedForeground` | AES tokens via `theme/tokens` (`colors`, `spacing`, `typography`, `shapes`) |
| **Spacing** | Hardcoded numbers (16, 24, 12, 8, 4) + some `spacing.md` | `spacing` token scale (xs, sm, md, lg, xl, 2xl) |
| **Typography** | Hardcoded `fontSize: 14`, `fontWeight: '600'` + some `typography.fontSize.md` | `typography` token scale (fontSize, fontWeight, fontFamily) |
| **Border Radius** | Hardcoded `borderRadius: 8`, `borderRadius: 12` | `shapes` token scale (sm, md, lg, xl, full) |
| **RTL Support** | Not implemented in styles | Required via `isRTL()` from localization |

### 2.3 Data Flow

```
User Interaction (filter change)
    → setFilterState()
    → useEffect (deps: filterStatus, filterExposure, filterStartDate, filterEndDate)
    → loadMetrics() [useCallback]
    → getDatabase()
    → db.getSurveillanceDashboardMetrics(userId, filters)
    → setMetrics(data)
    → setLoading(false)
    → Re-render with new metrics
```

**Filter Types Supported:**
- `status?: DeclarationStatus` (draft, submitted, under_review, correction_requested, resubmitted, closed)
- `incidentType?: AesIncidentType` (percutaneous_exposure, mucocutaneous_exposure, sexual_assault, other)
- `startDate?: string` (YYYY-MM-DD)
- `endDate?: string` (YYYY-MM-DD)

---

## 3. AES GUARDIAN SHARED COMPONENT INVENTORY (7/7 VERIFIED)

All components located in `src/features/aes-guardian/components/`. Each uses AES theme tokens (`colors`, `spacing`, `typography`, `shapes`), supports RTL via `isRTL()`, and includes accessibility props.

| Component | File | Key Props | Theme Tokens Used | Accessibility |
|-----------|------|-----------|-------------------|---------------|
| **AesScreenContainer** | `AesScreenContainer.tsx` | `children`, `style`, `scrollable`, `safeArea`, `backgroundColor` | `colors.background`, `spacing`, `shapes` | `accessible`, `accessibilityRole` |
| **AesScreenHeader** | `AesScreenHeader.tsx` | `title`, `subtitle`, `overline`, `onBack`, `backLabel`, `rightElement`, `badge`, `style` | `colors`, `typography`, `spacing`, `shapes` | `accessibilityRole="header"`, `accessibilityLabel` |
| **AesCard** | `AesCard.tsx` | `children`, `variant` (elevated/flat), `accentBorder`, `onPress`, `selected`, `style` | `colors`, `spacing`, `shapes`, `typography` | `accessibilityRole`, `accessibilityState`, `accessibilityLabel` |
| **AesButton** | `AesButton.tsx` | `title`, `onPress`, `variant` (primary/secondary/outline/ghost/destructive), `size`, `loading`, `disabled`, `leftIcon`, `rightIcon`, `fullWidth`, `style` | `colors`, `spacing`, `typography`, `shapes` (48px height) | `accessibilityRole="button"`, `accessibilityState={disabled}`, `accessibilityLabel` |
| **AesRoundArrowButton** | `AesRoundArrowButton.tsx` | `onPress`, `direction` (left/right), `variant` (black/green), `disabled`, `size`, `accessibilityLabel`, `style` | `colors`, `spacing`, `shapes` (48×48px) | `accessibilityRole="button"`, RTL arrow flip |
| **AesOptionCard** | `AesOptionCard.tsx` | `label`, `code`, `description`, `selected`, `onPress`, `variant` (radio/checkbox), `badge`, `disabled`, `style` | `colors`, `spacing`, `typography`, `shapes` | `accessibilityRole="radio"\|"checkbox"`, `accessibilityState={selected}` |
| **AesStatusBadge** | `AesStatusBadge.tsx` | `status`, `domain` (declaration/prevention/oh), `size`, `style` | `colors`, `typography`, `spacing`, `shapes` | `accessibilityRole="status"`, translation key fallback |

### 3.1 Legacy Common Components (Not AES-Aligned)

| Component | File | Theme System | Notes |
|-----------|------|--------------|-------|
| **AppCard** | `src/components/AppCard.tsx` | Legacy `ThemeContext` (`useTheme()`) | Uses `colors.card`, `colors.border`; no AES tokens |
| **AppHeader** | `src/components/AppHeader.tsx` | Legacy `ThemeContext` | Uses `colors.background`, `colors.text`; no AES tokens |
| **AppButton** | `src/components/AppButton.tsx` | Legacy `ThemeContext` | Uses `colors.primary`, `colors.background`; no AES tokens |

**Recommendation:** Legacy components should **not** be used in new AES Guardian screens. Migration to AES shared components is required for Batch 7.

---

## 4. DATABASE LAYER & TYPE DEFINITIONS

### 4.1 `getSurveillanceDashboardMetrics` Method Signature

```typescript
async getSurveillanceDashboardMetrics(
  userId: number,
  filters?: SurveillanceFilters
): Promise<SurveillanceDashboardMetrics>
```

**Location:** `src/core/database/AesGuardianDatabase.ts:2213`

**Authorization Enforcement (Lines 2222-2242):**
```typescript
// Permitted roles
if (user.role === 'quality_staff' || user.role === 'admin_reviewer' || user.role === 'oh_professional') {
  // proceed
}

// Forbidden roles
if (user.role === 'tech_admin') {
  throw new Error('getSurveillanceDashboardMetrics: tech_admin is strictly prohibited from surveillance metrics');
}
if (user.role === 'exposed_professional') {
  throw new Error('getSurveillanceDashboardMetrics: exposed_professional is strictly prohibited from surveillance metrics');
}
```

**Query Architecture:** CTE-based aggregation with `WITH` clauses for:
- `filtered_declarations` — base filtered dataset
- `overview_cte` — status counts
- `temporal_cte` — monthly grouping
- `exposure_cte` — incident type distribution
- `status_cte` — declaration status distribution
- `admin_cte` — administrative review metrics
- `oh_cte` — OH coordination + follow-up events

### 4.2 Type Definitions (`src/core/database/types.ts`)

```typescript
// Line 495: SurveillanceDashboardMetrics
export interface SurveillanceDashboardMetrics {
  overview: {
    totalDeclarations: number;
    draftDeclarations: number;
    submittedDeclarations: number;
    underReviewDeclarations: number;
    correctionRequestedDeclarations: number;
    resubmittedDeclarations: number;
    closedDeclarations: number;
    activeOhCoordinations: number;
    completedOhCoordinations: number;
  };
  temporalDistribution: Array<{ month: string; count: number }>; // 'YYYY-MM'
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

// Line 512: AesIncidentType (includes sexual_assault)
export type AesIncidentType =
  | 'percutaneous_exposure'
  | 'mucocutaneous_exposure'
  | 'sexual_assault'
  | 'other';

// Line 517: DeclarationStatus
export type DeclarationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'correction_requested'
  | 'resubmitted'
  | 'closed';

// Line 522: ReviewOutcome
export type ReviewOutcome =
  | 'acknowledged'
  | 'correction_requested'
  | 'transmission_verified'
  | 'closed_no_further_action';

// Line 527: OhCoordinationStatus
export type OhCoordinationStatus =
  | 'pending_acknowledgement'
  | 'acknowledged'
  | 'completed'
  | 'cancelled';

// Line 532: OhFollowUpEventCategory
export type OhFollowUpEventCategory =
  | 'contact_attempt_recorded'
  | 'contact_established'
  | 'specialist_consultation_completed'
  | 'serology_control_completed'
  | 'file_closed';
```

### 4.3 Filter Type (`SurveillanceFilters`)

```typescript
export interface SurveillanceFilters {
  status?: DeclarationStatus;
  incidentType?: AesIncidentType;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}
```

---

## 5. AUTHORIZATION BOUNDARIES

### 5.1 `canViewSurveillanceDashboard` (`src/core/auth/boundaries.ts`)

```typescript
export function canViewSurveillanceDashboard(context: AuthContext): boolean {
  const role = context.role;
  return role === 'quality_staff' || role === 'admin_reviewer' || role === 'oh_professional';
}
```

**Synthetic Contexts (for demo/testing):**
- `SYNTHETIC_QUALITY_STAFF_CONTEXT` → userId: 4, role: 'quality_staff' ✅
- `SYNTHETIC_ADMIN_REVIEWER_CONTEXT` → userId: 2, role: 'admin_reviewer' ✅
- `SYNTHETIC_OH_PROFESSIONAL_CONTEXT` → userId: 3, role: 'oh_professional' ✅
- `SYNTHETIC_DEMO_CONTEXT` → userId: 1, role: 'exposed_professional' ❌
- `SYNTHETIC_TECH_ADMIN_CONTEXT` → userId: 5, role: 'tech_admin' ❌
- `UNAUTHENTICATED_CONTEXT` → userId: null, role: 'unauthenticated' ❌

**Alignment:** UI authorization (`canViewSurveillanceDashboard`) **exactly matches** repository enforcement in `AesGuardianDatabase.ts`. `VERIFIED IN SOURCE`.

---

## 6. LOCALIZATION & RTL ASSESSMENT

### 6.1 Translation Coverage (47 Surveillance Keys)

| Category | FR | EN | AR | Status |
|----------|----|----|----|--------|
| Navigation/Title | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Disclaimer | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Unauthorized | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Role Badge | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Filters (6 keys) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Overview (10 keys) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Temporal (2 keys) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Exposure (2 keys) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Status (2 keys) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Admin (5 keys) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| OH (3 keys) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Workspace Module (2 keys) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |
| Profile CAP (1 key) | ✅ | ✅ | ✅ | `VERIFIED IN SOURCE` |

**Total: 47 keys × 3 languages = 141 translations — ALL PRESENT**

### 6.2 Dynamic Enum Label Localization

**Current Gap:** The dashboard receives enum values from the database (`AesIncidentType`, `DeclarationStatus`, `ReviewOutcome`, `OhCoordinationStatus`, `OhFollowUpEventCategory`) but **no localization mapping exists** for these dynamic values in chart labels, legends, axis, or tooltips.

**Required Mapping (PROPOSED):**

```typescript
// Example structure needed for chart localization
const INCIDENT_TYPE_LABELS: Record<AesIncidentType, string> = {
  percutaneous_exposure: t('surveillance.incidentType.percutaneous_exposure'),
  mucocutaneous_exposure: t('surveillance.incidentType.mucocutaneous_exposure'),
  sexual_assault: t('surveillance.incidentType.sexual_assault'),
  other: t('surveillance.incidentType.other'),
};

const DECLARATION_STATUS_LABELS: Record<DeclarationStatus, string> = {
  draft: t('surveillance.status.draft'),
  submitted: t('surveillance.status.submitted'),
  under_review: t('surveillance.status.under_review'),
  correction_requested: t('surveillance.status.correction_requested'),
  resubmitted: t('surveillance.status.resubmitted'),
  closed: t('surveillance.status.closed'),
};
```

**Translation Keys Required (UNVERIFIED — NOT IN LOCALIZATION):**
- `surveillance.incidentType.percutaneous_exposure`
- `surveillance.incidentType.mucocutaneous_exposure`
- `surveillance.incidentType.sexual_assault`
- `surveillance.incidentType.other`
- `surveillance.status.draft` (etc. — 6 statuses)
- `surveillance.reviewOutcome.acknowledged` (etc. — 4 outcomes)
- `surveillance.ohCoordinationStatus.pending_acknowledgement` (etc. — 4 statuses)
- `surveillance.ohFollowUpEventCategory.contact_attempt_recorded` (etc. — 5 categories)

### 6.3 RTL Support

**Infrastructure:** `isRTL()` helper exists in `src/localization/index.ts`; `DEFAULT_LOCALE = 'fr'`.

**Current Screen:** `SurveillanceDashboardScreen.tsx` does **not** use `isRTL()` for layout direction, icon flip, or text alignment.

**AES Shared Components:** All 7 components support RTL via `isRTL()` (icon flip, flex direction).

**Requirement:** Batch 7 must implement RTL-aware layout for:
- Filter bar (flex direction, label/input order)
- Chart legends (LTR→RTL order)
- Date inputs (placeholder alignment)
- KPI card layout (label/value order)

---

## 7. TEST COVERAGE ANALYSIS

### 7.1 Database-Level Tests (21 tests) — `VERIFIED BY TEST`

**File:** `src/features/aes-guardian/__tests__/surveillance-dashboard.test.ts`

| Test Group | Tests | Coverage |
|------------|-------|----------|
| Aggregate Correctness | 4 | Overview, temporal, exposure, admin review, OH metrics |
| Filter Application | 8 | Status, incident type, date range, combined, scoped sync, empty, inverted dates, unknown bucket |
| Authorization Matrix | 7 | quality_staff, admin_reviewer, oh_professional, exposed_professional, tech_admin, non-existent, privacy |
| Synthetic Context Boundaries | 2 | Context ID mapping, permission matrix evaluation |

**All 21 tests pass.** Coverage is comprehensive for database layer.

### 7.2 UI-Level Tests — `UNVERIFIED` (GAP)

**Missing Test Categories:**

| Category | Required Tests | Status |
|----------|----------------|--------|
| Loading States | Initial load, filter change load, refresh loading | ❌ MISSING |
| Empty States | No data for filters, no temporal data, no exposure data | ❌ MISSING |
| Error States | Network error, authorization error, database error | ❌ MISSING |
| Chart Rendering | BarChart, LineChart, DonutChart, PieChart render with data | ❌ MISSING |
| Accessibility | Screen reader labels, focus order, contrast ratios, touch targets | ❌ MISSING |
| Filter Interaction | Status dropdown, exposure dropdown, date inputs, clear button | ❌ MISSING |
| Refresh Behavior | Pull-to-refresh triggers reload, shows loading, updates data | ❌ MISSING |
| Role Switcher | Demo role change triggers re-authorization and reload | ❌ MISSING |
| RTL Layout | Arabic locale renders mirrored layout, RTL icons | ❌ MISSING |
| Localization | All 47 keys render correctly in FR/EN/AR | ❌ MISSING |

### 7.3 Prevention/CAPA Tests (20+ tests) — `VERIFIED BY TEST`

**File:** `src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts`

Covers: Creation validation, lifecycle transitions, register filtering, overview calculation, audit history, authorization matrix (5 roles), privacy (no clinical data), AES-XXXX rejection.

---

## 8. COMPONENT DEPENDENCY MATRIX — PROPOSED REUSE COMPONENTS

The following components are **proposed for reuse/adaptation** in Batch 7. **None currently exist** in the codebase.

| Proposed Component | Purpose | Exists? | Source | Effort | Notes |
|--------------------|---------|---------|--------|--------|-------|
| **ScreenContainer** | Root scrollable container with safe area | ❌ NO | **CREATE NEW** | Medium | Wrap `AesScreenContainer` + `RefreshControl` |
| **SectionHeader** | Section title with consistent typography | ❌ NO | **CREATE NEW** | Low | Use `typography.fontSize.lg`, `fontWeight.bold`, `fontFamily.urbanist` |
| **KPICard** | Stat card with label, value, color accent | ❌ NO | **ADAPT** from `AesCard` | Low | `AesCard` + `AesStatusBadge` pattern; add `trend` prop |
| **FilterBar** | Horizontal filter chips (status, type, date, clear) | ❌ NO | **CREATE NEW** | Medium | Reuse `AesButton` variant="ghost"; date inputs need new component |
| **BarChart** | Temporal distribution (vertical bars) | ❌ NO | **CREATE NEW** | High | No chart lib in deps; consider `react-native-svg` + custom or `victory-native` |
| **LineChart** | Trend lines (alternative to BarChart) | ❌ NO | **CREATE NEW** | High | Same as BarChart |
| **DonutChart** | Exposure/Status distribution (donut) | ❌ NO | **CREATE NEW** | High | Same as BarChart |
| **PieChart** | Alternative to DonutChart | ❌ NO | **CREATE NEW** | High | Same as BarChart |
| **DataTable** | Administrative review outcomes, OH events | ❌ NO | **CREATE NEW** | Medium | FlatList with column headers; reuse `AesCard` for rows |
| **EmptyState** | Illustrative empty state with icon + message | ❌ NO | **CREATE NEW** | Low | `AesCard` + centered illustration + `t('*.empty')` |
| **LoadingSkeleton** | Shimmer placeholder for cards/charts | ❌ NO | **CREATE NEW** | Low | Animated `View` with `AesCard` shape |
| **ErrorDisplay** | Consistent error banner with retry action | ❌ NO | **ADAPT** from screen's inline error box | Low | Extract inline error box to reusable component |

### 8.1 Chart Library Decision (PROPOSED)

**Current Dependencies:** No chart/visualization library in `package.json`.

**Options:**
| Library | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| `victory-native` | React-native native, good API, maintained | Larger bundle, needs `react-native-svg` | **RECOMMENDED** if charts required |
| `react-native-chart-kit` | Simple, lightweight | Limited customization, older | Alternative |
| `react-native-svg-charts` | D3-based, flexible | Complex API, D3 dependency | Not recommended |
| **Custom (react-native-svg)** | Zero deps, full control, minimal bundle | More dev effort | **RECOMMENDED** for simple charts (bar, line, donut) |

**Constraint Check:** `react-native-svg` is **not** in dependencies. Adding it requires `yarn add react-native-svg` + native linking (iOS/Android). **PROPOSED:** Use custom `react-native-svg` implementation for Batch 7 charts to avoid heavy dependencies.

---

## 9. PREVENTION/CAPA UI TRANSFORMATION STATUS (Phase 2C.6 vs 2E)

### 9.1 Current State (Phase 2C.6 — Complete)

All 4 prevention screens exist and are functional:
1. `PreventionOverviewScreen.tsx` — Overview KPIs + register navigation
2. `PreventionActionRegisterScreen.tsx` — Filterable list + FAB create
3. `PreventionActionDetailScreen.tsx` — Detail view + status transitions + audit timeline
4. `PreventionActionCreateScreen.tsx` — Form with validation

### 9.2 Architecture Comparison

| Aspect | Prevention Screens (2C.6) | AES Guardian Standard (2E) | Gap |
|--------|---------------------------|----------------------------|-----|
| **Theme** | Legacy `useTheme()` + inline `StyleSheet` | AES tokens + shared components | **Major** |
| **Container** | `View`/`ScrollView`/`FlatList` inline | `AesScreenContainer` | **Major** |
| **Header** | Inline role bar + section titles | `AesScreenHeader` | **Major** |
| **Cards** | Inline `View` styles | `AesCard` | **Major** |
| **Buttons** | Inline `TouchableOpacity` styles | `AesButton` | **Major** |
| **Badges** | Inline `View` + color map | `AesStatusBadge` | **Major** |
| **Option Selection** | Inline `TouchableOpacity` chips | `AesOptionCard` | **Major** |
| **RTL** | Not implemented | Required via `isRTL()` | **Major** |
| **Accessibility** | Minimal | Required on all interactive | **Major** |
| **Localization** | Complete FR/EN/AR | Complete FR/EN/AR | ✅ OK |

### 9.3 Transformation Required for Phase 2E

**All 4 prevention screens require full migration to AES shared components** before they meet Phase 2E standards. This is **out of scope for Batch 7** (Surveillance Dashboard only) but documented here for planning.

**Estimated Effort per Screen:** 2-3 days each (container, header, cards, buttons, badges, options, RTL, accessibility, testing).

---

## 10. BOUNDED BATCH 7 PROPOSAL

### 10.1 Scope: Surveillance Dashboard Screen Only

**Target File:** `src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx`

**Explicit Exclusions (NOT in Batch 7):**
- ❌ Prevention/CAPA screens migration (Phase 2E separate effort)
- ❌ New database methods or schema changes
- ❌ New authorization roles or boundary changes
- ❌ New navigation routes or stack changes
- ❌ Type definition modifications
- ❌ New chart library evaluation beyond Batch 7 needs

### 10.2 File Scope & Changes

| File | Action | Description |
|------|--------|-------------|
| `SurveillanceDashboardScreen.tsx` | **REPLACE** | Full rewrite using AES shared components |
| `src/features/aes-guardian/components/ScreenContainer.tsx` | **CREATE** | Wrapper: `AesScreenContainer` + `RefreshControl` + role switcher slot |
| `src/features/aes-guardian/components/SectionHeader.tsx` | **CREATE** | Consistent section titles |
| `src/features/aes-guardian/components/KPICard.tsx` | **CREATE** | Stat card (adapt `AesCard` + `AesStatusBadge` pattern) |
| `src/features/aes-guardian/components/FilterBar.tsx` | **CREATE** | Status dropdown, exposure dropdown, date inputs, clear button |
| `src/features/aes-guardian/components/BarChart.tsx` | **CREATE** | Temporal distribution (custom `react-native-svg`) |
| `src/features/aes-guardian/components/DonutChart.tsx` | **CREATE** | Exposure & status distribution (custom `react-native-svg`) |
| `src/features/aes-guardian/components/DataTable.tsx` | **CREATE** | Admin review outcomes, OH event categories |
| `src/features/aes-guardian/components/EmptyState.tsx` | **CREATE** | Reusable empty state (adapt `AesCard`) |
| `src/features/aes-guardian/components/LoadingSkeleton.tsx` | **CREATE** | Shimmer placeholders for cards/charts |
| `src/features/aes-guardian/components/ErrorDisplay.tsx` | **CREATE** | Consistent error banner with retry |
| `src/localization/index.ts` | **EXTEND** | Add 25+ dynamic enum label keys (FR/EN/AR) |
| `src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx` | **CREATE** | UI test suite (loading, empty, error, charts, a11y, filters, refresh, RTL) |

### 10.3 Reuse / Adapter / Replacement Mapping

| Current Pattern | Batch 7 Approach | Component Used |
|-----------------|------------------|----------------|
| `ScrollView` + `RefreshControl` | `ScreenContainer` (wraps `AesScreenContainer`) | **NEW WRAPPER** |
| Inline role switcher chips | `AesScreenHeader` rightElement + custom role selector | `AesScreenHeader` + **NEW** |
| Inline disclaimer banner | `AesCard` variant="flat" with accent border | `AesCard` |
| Inline stat cards (overview) | `KPICard` × 8 | **NEW** (adapt `AesCard`) |
| Inline filter section | `FilterBar` | **NEW** (uses `AesButton` ghost) |
| Loading `ActivityIndicator` | `LoadingSkeleton` per section | **NEW** |
| Error `View` box | `ErrorDisplay` | **NEW** |
| Empty text placeholders | `EmptyState` per section | **NEW** |
| Chart placeholder text | `BarChart` / `DonutChart` | **NEW** (custom SVG) |
| Admin/OH stat cards | `KPICard` + `DataTable` | **NEW** |
| Hardcoded styles | AES tokens (`spacing`, `typography`, `shapes`, `colors`) | **TOKENS** |

### 10.4 Required UI States (All Sections)

| Section | Loading | Empty | Error | Data |
|---------|---------|-------|-------|------|
| Overview KPIs | ✅ Skeleton cards | ✅ Zero-state cards | ✅ ErrorDisplay | ✅ KPICard × 8 |
| Temporal Distribution | ✅ Skeleton chart | ✅ EmptyState | ✅ ErrorDisplay | ✅ BarChart |
| Exposure Distribution | ✅ Skeleton chart | ✅ EmptyState | ✅ ErrorDisplay | ✅ DonutChart |
| Status Distribution | ✅ Skeleton chart | ✅ EmptyState | ✅ ErrorDisplay | ✅ DonutChart |
| Admin Review Indicators | ✅ Skeleton cards/table | ✅ EmptyState | ✅ ErrorDisplay | ✅ KPICard × 3 + DataTable |
| OH Indicators | ✅ Skeleton cards/table | ✅ EmptyState | ✅ ErrorDisplay | ✅ KPICard × 2 + DataTable |

### 10.5 Localization Work (25+ New Keys Required)

| Category | Keys Needed | Locale Coverage |
|----------|-------------|-----------------|
| Incident Types | 4 (`percutaneous_exposure`, `mucocutaneous_exposure`, `sexual_assault`, `other`) | FR/EN/AR |
| Declaration Statuses | 6 (`draft`, `submitted`, `under_review`, `correction_requested`, `resubmitted`, `closed`) | FR/EN/AR |
| Review Outcomes | 4 (`acknowledged`, `correction_requested`, `transmission_verified`, `closed_no_further_action`) | FR/EN/AR |
| OH Coordination Statuses | 4 (`pending_acknowledgement`, `acknowledged`, `completed`, `cancelled`) | FR/EN/AR |
| OH Follow-up Event Categories | 5 (`contact_attempt_recorded`, `contact_established`, `specialist_consultation_completed`, `serology_control_completed`, `file_closed`) | FR/EN/AR |
| Chart/Accessibility | 2 (`chart.loading`, `chart.noData`) | FR/EN/AR |

**Total: 25 new keys × 3 languages = 75 translations to add**

### 10.6 Focused UI Tests (New File: `surveillance-dashboard-ui.test.tsx`)

| Test Category | Test Cases |
|---------------|------------|
| **Loading States** | Initial load shows skeletons; filter change shows skeletons; refresh shows skeleton |
| **Empty States** | No data → EmptyState per section; filtered empty → EmptyState with clear action |
| **Error States** | Network error → ErrorDisplay with retry; auth error → unauthorized view; DB error → ErrorDisplay |
| **Chart Rendering** | BarChart renders with temporal data; DonutChart renders exposure/status; tooltips show localized labels |
| **Accessibility** | All interactive elements have `accessibilityLabel`; focus order logical; contrast ≥ 4.5:1; touch targets ≥ 48×48dp |
| **Filter Interaction** | Status dropdown filters data; exposure dropdown filters data; date range filters data; clear resets all |
| **Refresh Behavior** | Pull-to-refresh triggers loadMetrics; shows loading; updates all sections; maintains filter state |
| **Role Switcher** | Role change updates authorization; forbidden roles show unauthorized view; permitted roles reload data |
| **RTL Layout** | Arabic locale: filter bar mirrored; chart legends RTL; date placeholders RTL; KPI cards RTL |
| **Localization** | All 47 existing + 25 new keys render in FR/EN/AR; dynamic enum labels resolved correctly |

### 10.7 Dependencies to Add (Minimal)

```json
{
  "dependencies": {
    "react-native-svg": "^15.8.0"
  }
}
```

**Rationale:** Required for custom `BarChart`, `LineChart`, `DonutChart`, `PieChart` implementations. No heavy chart library. Native linking required (iOS: `pod install`, Android: auto-linked in RN 0.76+).

---

## 11. RISK ASSESSMENT & MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Chart library adds bundle size | Medium | Low | Use custom `react-native-svg` (minimal) |
| RTL layout bugs in charts | Medium | Medium | Test RTL explicitly in UI test suite |
| Dynamic enum label keys missing in AR | Low | High | Add all 25 keys with AR translations before merge |
| Prevention screens remain legacy | High | Medium | Document as separate Phase 2E effort; not blocking Batch 7 |
| `react-native-svg` native linking fails | Low | High | Verify in CI/CD; provide fallback text-only charts |
| Performance with large datasets | Low | Medium | Virtualize `FlatList` in `DataTable`; memoize chart components |

---

## 12. SIGN-OFF CRITERIA FOR BATCH 7 AUTHORIZATION

Batch 7 implementation may proceed **only after** the following are confirmed:

- [ ] This reconciliation report reviewed and approved by Tech Lead
- [ ] 25 new localization keys added to `index.ts` with FR/EN/AR translations
- [ ] `react-native-svg` added to dependencies and native linking verified
- [ ] All 11 new components created with AES token compliance
- [ ] `SurveillanceDashboardScreen.tsx` rewritten using new components
- [ ] UI test suite (`surveillance-dashboard-ui.test.tsx`) created with 10 test categories
- [ ] RTL verified in FR/EN/AR for all sections
- [ ] Accessibility audit passed (screen reader, contrast, touch targets)
- [ ] No modifications to database, schema, auth, navigation, types, or blueprint
- [ ] No new dependencies beyond `react-native-svg`

---

## 13. APPENDIX: EVIDENCE TAG LEGEND

| Tag | Meaning |
|-----|---------|
| `VERIFIED IN SOURCE` | Confirmed by reading source code in this audit |
| `VERIFIED BY TEST` | Confirmed by existing test coverage |
| `DOCUMENTED DESIGN DECISION` | Explicitly documented in code comments or architecture docs |
| `PROPOSED` | Recommended approach for Batch 7; not yet implemented |
| `UNVERIFIED` | Not confirmed; gap identified requiring action |

---

**Report Prepared By:** Technical Reconciliation Audit (Read-Only)  
**Next Action:** Review by Tech Lead → Authorize Batch 7 Implementation