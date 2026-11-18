# AES GUARDIAN — PHASE 2E.1.5.0
## Batch 5 Scope Discovery & Implementation Readiness Audit Report

**Project:** AES Guardian  
**Repository:** `C:\Users\User\Desktop\sure\sanad-rn-migration`  
**Branch:** `migration/aes-guardian`  
**HEAD Commit:** `d79b01ef51646509170996f8c77517f95470f217`  
**Database Schema:** Version 8 (strictly unmodified, 0 migrations)  
**Execution Date:** November 15, 2026  
**Phase:** 2E.1.5.0 — Batch 5 Scope Discovery & Readiness Audit  
**Phase Type:** READ-ONLY INSPECTION — NO IMPLEMENTATION  

---

## 1. Executive Summary & Readiness Verdict

This discovery and readiness audit formally evaluates **Batch 5** of the AES Guardian UI Implementation Blueprint (`docs/AES_GUARDIAN_UI_IMPLEMENTATION_BLUEPRINT.md`) following the closure of Batch 4.

### Readiness Verdict: `READY WITH CONDITIONS`

**Rationale:**
1. **Database & Workflow Readiness:** The underlying database tables (`administrative_reviews`, `correction_responses`, `aes_declarations`), repository methods (`getReviewQueue`, `createAdministrativeReview`, `getDeclarationReviewHistory`, `createCorrectionResponse`), and notification integrations are already fully implemented, tested, and schema-verified in Schema Version 8. Zero database migrations or schema adjustments are required.
2. **Existing Implementation Baseline:** All three screens comprising this batch (`AdminReviewQueueScreen.tsx`, `AdminReviewActionScreen.tsx`, `CorrectionResponseScreen.tsx`) were initially constructed during Phase 2C.3 / 2C.3.1 and possess functional logic and Jest test suites.
3. **Conditions Required Before Implementation Authorization:**
   - **Condition 1 (Theme Token Migration):** Both review screens and the correction response screen currently consume legacy `useTheme()` tokens (`colors.background`, `colors.primary`, `colors.muted`, etc.). They must be completely migrated to the approved Batch 1 tokens (`aesColors.ts`, `aesTypography.ts`, `aesTheme.ts`) and shared containers (`AesScreenContainer`, `AesScreenHeader`, `AesCard`, `AesButton`).
   - **Condition 2 (Badge Component Reuse):** `AdminReviewQueueScreen` currently uses an ad-hoc local badge function with arbitrary colors (`#f59e0b`, `#8b5cf6`). It must be replaced with the authoritative `AesStatusBadge` component, preserving the mathematically verified WCAG 2.1 AA contrast tokens from Phase 2E.1.4.3.2.
   - **Condition 3 (Strict State Transition Semantics):** The UI must strictly respect the state machine invariant: review outcome `'acknowledged'` or `'transmission_verified'` transitions the declaration status to **`'under_review'`** (NOT `'acknowledged'`). `'acknowledged'` is a `ReviewOutcome` value stored in `administrative_reviews`, never a valid `DeclarationStatus`.
   - **Condition 4 (Role Boundaries):** `AdminReviewQueueScreen` and `AdminReviewActionScreen` must be strictly restricted to `admin_reviewer` using standardized unauthorized states. `CorrectionResponseScreen` must be strictly restricted to `exposed_professional` who owns the declaration.
   - **Condition 5 (Localization Hardening):** Hardcoded French strings must be replaced with canonical keys across French, English, and Arabic dictionaries.

---

## 2. Preflight & Working Tree State

```text
Branch: migration/aes-guardian
HEAD:   d79b01ef51646509170996f8c77517f95470f217
Schema: Version 8 (strictly unmodified)
```

### Git Status Summary (`git status --short`)
Pre-existing modified and untracked files were strictly preserved throughout this read-only phase. No files were added, deleted, staged, committed, or altered:
- Modified files: `src/core/database/AesGuardianDatabase.ts`, `src/features/aes-guardian/components/AesStatusBadge.tsx`, `src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx`, `src/features/aes-guardian/screens/DeclarationListScreen.tsx`, `src/localization/index.ts`, `src/theme/tokens/aesColors.ts`, `src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx`, `__mocks__/@op-engineering/op-sqlite.js`.
- Untracked reports: All prior phase reports in `docs/` and test suites in `src/`.
- Working tree status: Verified intact. Original SANAD repository: untouched.

---

## 3. Authoritative Blueprint Identification

The master UI implementation blueprint (`docs/AES_GUARDIAN_UI_IMPLEMENTATION_BLUEPRINT.md`) defines the next batch following Batch 4:

### 3.1 Batch Identity
- **Batch Number:** **Batch 5** (`DOCUMENTED DESIGN DECISION`: Section 12, lines 883, 902)
- **Batch Title:** **Administrative Review Queue & Actions**
- **Flowchart Placement:**
  ```mermaid
  flowchart LR
      Batch4["Batch 4: Declaration List & Details Tabs (CLOSED)"] --> Batch5["Batch 5: Administrative Review Queue & Actions"]
      Batch5 --> Batch6["Batch 6: OH Coordination"]
  ```

### 3.2 Authoritative Blueprint References
1. **Section 12 (Flowchart & Batch Criteria, lines 883, 902):**
   - Line 883: `Batch4 --> Batch5["Batch 5: Administrative Review Queue & Actions"]`
   - Line 902: *"Batch 5: Admin review: positive review (`acknowledged`/`transmission_verified` outcome) transitions declaration to `under_review` — UI must reflect this accurately; mandatory remarks on correction."*
2. **Section 3 (Master Screen Inventory Table, lines 99–101):**
   - Row 6: `AdminReviewQueueScreen` (`src/features/aes-guardian/screens/AdminReviewQueueScreen.tsx`), route `adminReviewQueue`, role `admin_reviewer`, classification `EXISTING — REDESIGN`.
   - Row 7: `AdminReviewActionScreen` (`src/features/aes-guardian/screens/AdminReviewActionScreen.tsx`), route `adminReviewAction`, role `admin_reviewer`, classification `EXISTING — REDESIGN`.
   - Row 8: `CorrectionResponseScreen` (`src/features/aes-guardian/screens/CorrectionResponseScreen.tsx`), route `correctionResponse`, role `exposed_professional`, classification `EXISTING — MINOR REFINEMENT`.
3. **Section 4 (Screen & Element Specification — Group 5, lines 522–575):**
   - Group 5: *"Administrative Review & Correction Workflow (Spec Section 6)"*
   - Screen 6.1: Administrative Review Queue (`AdminReviewQueueScreen.tsx`)
   - Screen 6.2: Review Action Screen (`AdminReviewActionScreen.tsx`)
   - Screen 6.3: Correction Response Screen (`CorrectionResponseScreen.tsx`)
4. **Section 3.2 (Curated Reference Screenshot Mapping, lines 158–160):**
   - `AdminReviewQueueScreen`: `Reddit iOS Queues 3.png`
   - `AdminReviewActionScreen`: `talabat iOS Reporting an issue 9.png`, `Reddit Accept a request 1.png`
   - `CorrectionResponseScreen`: `Hinge iOS Adding a match note 1.png`

---

## 4. Screen, Component & Feature Inventory

| Screen / Component | File Path | Route Key | Target Role | Visual Blueprint Ref | Classification |
|---|---|---|---|---|:---:|
| **Administrative Review Queue** | `src/features/aes-guardian/screens/AdminReviewQueueScreen.tsx` | `adminReviewQueue` | `admin_reviewer` | `Reddit iOS Queues 3.png` | `EXISTING — REQUIRES REDESIGN` |
| **Review Action Screen** | `src/features/aes-guardian/screens/AdminReviewActionScreen.tsx` | `adminReviewAction` | `admin_reviewer` | `talabat iOS Reporting an issue 9.png`, `Reddit Accept a request 1.png` | `EXISTING — REQUIRES REDESIGN` |
| **Correction Response Screen** | `src/features/aes-guardian/screens/CorrectionResponseScreen.tsx` | `correctionResponse` | `exposed_professional` | `Hinge iOS Adding a match note 1.png` | `EXISTING — REQUIRES REDESIGN` |

---

## 5. Implementation Readiness & Source Inspection

### 5.1 Screen 6.1: `AdminReviewQueueScreen.tsx`
- **Current State:** (`VERIFIED IN SOURCE`: `AdminReviewQueueScreen.tsx` lines 1–493)
  - Role Guard: Evaluates `canReview(activeContext)`.
  - Queue Retrieval: Calls `db.getReviewQueue({ limit: 100, requestingUserId: activeContext.userId })`.
  - Filter Tabs: All, Submitted, Under Review, Correction Requested, Resubmitted.
  - Card Content: Reference code, incident date, elapsed time, department code, declared by user ID, response indicator for resubmitted cases.
- **Deficiencies Requiring Redesign:**
  1. *Theme Coupling:* Consumes legacy `useTheme()` (`colors.background`, `colors.primary`, `colors.card`, etc.) instead of Batch 1 tokens (`aesColors`, `aesTypography`, `aesSpacing`).
  2. *Status Badge Duplication:* Implements an ad-hoc local function `getStatusBadge()` with arbitrary colors (`#f59e0b`, `#8b5cf6`, `colors.primary`) rather than reusing `AesStatusBadge`.
  3. *Layout Shell:* Does not use `AesScreenContainer` or `AesScreenHeader`.
  4. *Visual Card Presentation:* Cards lack the modern editorial styling specified by `Reddit iOS Queues 3.png`.
  5. *Hardcoded Strings:* Contains hardcoded French error message on line 91: *"Cette interface est réservée exclusivement aux réviseurs administratifs (admin_reviewer)."*

### 5.2 Screen 6.2: `AdminReviewActionScreen.tsx`
- **Current State:** (`VERIFIED IN SOURCE`: `AdminReviewActionScreen.tsx` lines 1–665)
  - Role Guard: Evaluates `canReview(activeContext)`.
  - Data Retrieval: Calls `db.getDeclarationById()`, `db.getDeclarationReviewHistory()`, and `db.getCorrectionResponses()`.
  - Triage Outcomes: Three radio choices (`acknowledged`, `transmission_verified`, `correction_requested`).
  - Validation: Requires non-empty `correction_reason` when outcome is `correction_requested`.
  - Submission: Calls `db.createAdministrativeReview()` within atomic transaction and logs audit events (`ADMIN_REVIEW_RECORDED`, `CORRECTION_REQUESTED`, `ADMIN_REREVIEW_RECORDED`).
- **Deficiencies Requiring Redesign:**
  1. *Theme Coupling:* Consumes legacy `useTheme()` tokens and hardcoded colors (`#6d28d9`, `#f5f3ff`, `#8b5cf6`, `#1e293b`).
  2. *Layout Shell:* Does not use `AesScreenContainer`, `AesScreenHeader`, or `AesButton`.
  3. *Radio Decision Cards:* Visual appearance relies on simple bordered views rather than the structured decision cards mapped to `talabat iOS Reporting an issue 9.png` and `Reddit Accept a request 1.png`.
  4. *Hardcoded Text:* Contains hardcoded French section headers (e.g. line 252 *"Résumé de la déclaration (Lecture seule)"*, line 334 *"Motif :"*, line 340 *"Notes :"*).
  5. *Review Outcome Status Clarity:* Blueprint specifically requires visual clarity that positive review outcomes transition the declaration to `under_review`, not `acknowledged`.

### 5.3 Screen 6.3: `CorrectionResponseScreen.tsx`
- **Current State:** (`VERIFIED IN SOURCE`: `CorrectionResponseScreen.tsx` lines 1–349)
  - Role Guard: Evaluates `canRespondToCorrection(activeContext)` and ownership (`decl.declared_by_user_id === userContext.userId`).
  - Data Retrieval: Calls `db.getLatestPendingCorrectionRequest()` or review history.
  - Form: Displays reviewer's requested correction reason and comments; provides response text area.
  - Submission: Calls `db.createCorrectionResponse()`, which transitions declaration to `resubmitted`, logs audit event `CORRECTION_RESPONSE_SUBMITTED`, and emits in-app notification.
- **Deficiencies Requiring Redesign:**
  1. *Theme Coupling:* Consumes legacy `useTheme()` tokens.
  2. *Layout Shell:* Does not use `AesScreenContainer` or `AesScreenHeader`.
  3. *Ad-Hoc Demo Banner:* Uses an unstyled, custom yellow banner on line 171 (`"⚠ DEMO — Contexte synthétique :"`) rather than standardized presentation.
  4. *Character Counter:* Blueprint specifies a live character counter container per `Hinge iOS Adding a match note 1.png`.
  5. *Hardcoded Elements:* Needs alignment with centralized localization keys.

---

## 6. Technical & Architectural Dependencies

### 6.1 Database Schema & Repository Methods (`VERIFIED IN SOURCE`)
- **Schema Version:** Version 8 (`src/core/database/DatabaseService.ts`). Zero migrations needed.
- **Tables Involved:**
  - `aes_declarations` (`status`, `updated_at`)
  - `administrative_reviews` (`id`, `declaration_id`, `reviewer_user_id`, `outcome`, `comments`, `correction_reason`, `reviewed_at`, `created_at`)
  - `correction_responses` (`id`, `declaration_id`, `review_id`, `user_id`, `response_text`, `responded_at`, `created_at`)
- **Repository Methods in `AesGuardianDatabase.ts`:**
  - `getReviewQueue(options)` (lines 1023–1057) — strictly requires `admin_reviewer`
  - `createAdministrativeReview(input)` (lines 1071–1191) — atomic transaction, updates status to `under_review` or `correction_requested`
  - `getDeclarationReviewHistory(declarationId, requestingUserId)` (lines 1152–1191)
  - `getCorrectionResponses(declarationId, requestingUserId)` (lines 1276–1300)
  - `getLatestPendingCorrectionRequest(declarationId, requestingUserId)` (lines 1358–1385)
  - `createCorrectionResponse(input)` (lines 1193–1274) — atomic transaction, updates status to `resubmitted`

### 6.2 Navigation Route Definitions (`VERIFIED IN SOURCE`)
Defined in `src/navigation/routes.ts` (lines 26–28):
```typescript
adminReviewQueue: undefined;
adminReviewAction: { declarationId: number };
correctionResponse: { declarationId: number; reviewId: number };
```
All three routes are already mounted in `src/navigation/AppNavigator.tsx` (lines 316–318, 349–351, 380–382, 410–412).

### 6.3 Existing Test Suites (`VERIFIED BY TEST`)
- `src/features/aes-guardian/__tests__/admin-review-workflow.test.tsx` (Phase 2C.3 test suite — currently passing)
- `src/features/aes-guardian/__tests__/correction-workflow.test.tsx` (Phase 2C.3.1 test suite — currently passing)
- Baseline: Both suites currently pass 100% against the existing logic.

---

## 7. Localization & Accessibility Readiness

### 7.1 Localization Dictionaries (`VERIFIED IN SOURCE`)
Inspection of `src/localization/index.ts` confirms that translation keys for all three screens are already defined across French, English, and Arabic:
- `reviewQueue.*` (13 keys): `title`, `empty`, `emptySubtitle`, `filterAll`, `filterSubmitted`, `filterUnderReview`, `filterCorrectionRequested`, `filterResubmitted`, `reviewerBadge`, `submittedAt`, `declaredBy`, `openReview`, `refresh`.
- `review.*` (28 keys): `title`, `declarationRef`, `selectOutcome`, `outcome.acknowledged`, `outcome.acknowledgedDesc`, `outcome.transmission_verified`, `outcome.transmission_verifiedDesc`, `outcome.correction_requested`, `outcome.correction_requestedDesc`, `comments`, `commentsPlaceholder`, `correctionReason`, `correctionReasonPlaceholder`, `submitButton`, `submitting`, `success`, `confirmTitle`, `confirmMessage`, `confirmButton`, `cancelButton`, `historyTitle`, `noHistory`, `unauthorized`, `correctionReasonRequired`, `readOnlyNotice`, `declarantResponseHeader`, `rereviewButton`.
- `correction.*` (14 keys): `screenTitle`, `requestHeader`, `reasonLabel`, `commentsLabel`, `inputLabel`, `inputPlaceholder`, `submitButton`, `submitting`, `confirmTitle`, `confirmMessage`, `successTitle`, `successMessage`, `unauthorized`, `errorRequired`.

*Readiness Action:* During implementation, any remaining hardcoded strings in the three screens must be bound to these existing keys.

### 7.2 Accessibility & Contrast Requirements
- **Status Badges:** All queue cards must render `AesStatusBadge` using domain `'declaration'`, which was mathematically verified in Phase 2E.1.4.3.2 to pass WCAG 2.1 AA ($\ge 4.5:1$) for normal text (`fontSize: 11`, `fontWeight: '600'`).
- **Radio Cards & Selection Targets:** Radio selection options on `AdminReviewActionScreen` must have touch targets $\ge 48\times 48\text{ dp}$ and accessibility roles (`accessibilityRole="radio"`, `accessibilityState={{ checked: isSelected }}`).
- **Buttons:** Submit buttons must use `AesButton` or `primaryAction` token (`#121212` background, `#FFFFFF` text), providing 18.73:1 contrast.

---

## 8. Role Boundaries & Architectural Invariants

| Invariant | Enforcement Mechanism | Batch 5 Impact |
|---|---|---|
| **5 Canonical Roles** | `AesGuardianRole` type | `admin_reviewer` owns queue and action screens; `exposed_professional` owns correction response. |
| **Exposed Professional** | `decl.declared_by_user_id === user.id` | Can access `correctionResponse` only for their own declarations. |
| **Admin Reviewer** | `canReview(context)` | Possesses facility-wide queue visibility; records review outcomes. |
| **OH Professional Barrier** | Phase 2E.1.4.2A DB blocks | `oh_professional` is blocked from accessing review queue or review actions. |
| **Quality Staff / Tech Admin Barrier** | Role authorization | Blocked from accessing review queue or review actions. |
| **Review Outcome vs Declaration Status** | `AesGuardianDatabase.createAdministrativeReview` | Outcome `acknowledged`/`transmission_verified` $\rightarrow$ status `under_review`. Outcome `correction_requested` $\rightarrow$ status `correction_requested`. |
| **Correction Transition** | `AesGuardianDatabase.createCorrectionResponse` | Transitions declaration to status `resubmitted`. |
| **Zero Deletion** | Design constraint | No delete buttons or discard options. |
| **No Invented Clinical Data** | Design constraint | No clinical advice, PEP guidance, or medical protocols. |

---

## 9. Reference Screenshot Mapping & Visual Intent

### 9.1 `AdminReviewQueueScreen.tsx` $\rightarrow$ `Reddit iOS Queues 3.png`
- **Visual Pattern:** High-density queue workstation for administrative triage.
- **Elements:**
  - Subtle top session badge indicating active administrative reviewer context.
  - Horizontal scrolling filter chips (`Toutes`, `Soumises`, `En révision`, `Corrections demandées`, `Réponses reçues`).
  - Queue cards displaying reference code, incident date, elapsed days badge, department code, and arrow chevron.
  - Clean empty state with icon and muted institutional messaging.

### 9.2 `AdminReviewActionScreen.tsx` $\rightarrow$ `talabat iOS Reporting an issue 9.png`, `Reddit Accept a request 1.png`
- **Visual Pattern:** Structured administrative decision form with unambiguous outcome cards.
- **Elements:**
  - Administrative privacy notice banner at top.
  - Compact declaration summary card (read-only narrative).
  - Review history timeline/accordion showing prior reviews.
  - Declarant response callout (when declaration is `resubmitted`).
  - Large selectable radio cards for review outcomes (`Valider la déclaration` vs `Demander une correction`).
  - Expandable/mandatory correction justification text area.
  - Prominent bottom confirmation button.

### 9.3 `CorrectionResponseScreen.tsx` $\rightarrow$ `Hinge iOS Adding a match note 1.png`
- **Visual Pattern:** Focused dialogue box for clarifying deficiency without altering original narrative.
- **Elements:**
  - Quotation card showing reviewer's requested correction reason in amber border.
  - Clean multiline text input area with live character counter.
  - Submit button with double-tap protection.

---

## 10. Proposed Narrow Implementation Scope for Batch 5

When authorized, Batch 5 implementation should be strictly scoped to the following 3 screens and their targeted test suite:

1. **Redesign `AdminReviewQueueScreen.tsx`:**
   - Migrate to `AesScreenContainer`, `AesScreenHeader`, and `AesStatusBadge`.
   - Apply `Reddit iOS Queues 3.png` card layout using `aesColors` and `aesTypography`.
   - Connect filter chips to status filters (`submitted`, `under_review`, `correction_requested`, `resubmitted`).
   - Standardize unauthorized view for non-admin roles.
2. **Redesign `AdminReviewActionScreen.tsx`:**
   - Migrate to `AesScreenContainer` and `AesScreenHeader`.
   - Implement radio decision cards per `talabat` / `Reddit` reference.
   - Display declarant response callout when reviewing `resubmitted` declarations.
   - Enforce mandatory correction reason (minimum 5 chars) on `correction_requested`.
   - Emphasize that positive review transitions status to `under_review`.
3. **Refine `CorrectionResponseScreen.tsx`:**
   - Migrate to `AesScreenContainer` and `AesScreenHeader`.
   - Implement quotation card for reviewer remarks and live character counter text area.
   - Enforce ownership and non-empty response validation.
4. **Targeted Test Suite:**
   - Create or update comprehensive Batch 5 workflow test suite verifying all triage flows, transitions (`submitted` $\rightarrow$ `under_review`, `submitted` $\rightarrow$ `correction_requested` $\rightarrow$ `resubmitted` $\rightarrow$ `under_review`), role guards, and localization.

---

## 11. Explicit Scope Exclusions & Deferred Items

The following items must remain strictly deferred to subsequent batches:
- **Batch 6 (OH Coordination):** `OhCoordinationQueueScreen.tsx`, `OhCoordinationDetailScreen.tsx`, `CreateCoordinationScreen.tsx`, `OhFollowUpEventScreen.tsx`.
- **Batch 7 (Surveillance Dashboard Analytics):** `SurveillanceDashboardScreen.tsx`.
- **Batch 8 (Contributing Factors & CAPA):** `PreventionActionListScreen.tsx`, `PreventionActionCreateScreen.tsx`, `PreventionActionDetailScreen.tsx`.
- **Batch 9 (Notification Centre UI Refinement):** `NotificationCentreScreen.tsx`.
- **Batch 10 (Profile, Settings, Help & Demo Reset):** `AesGuardianProfileScreen.tsx`, `HelpGlossaryScreen.tsx`.
- **Database Migrations:** Schema Version 8 must remain unmodified.
- **Deletion Functionality:** No declaration or review deletion.

---

## 12. Conclusion & Next Steps

Batch 5 is clearly defined in the authoritative blueprint and has all necessary backend database infrastructure, repository methods, and routing already in place. The implementation scope is well-bounded to the redesign of three existing screens.

**Status:** `READY WITH CONDITIONS`  
**Recommendation:** Await review of this audit report and explicit user authorization before initiating Batch 5 implementation.
