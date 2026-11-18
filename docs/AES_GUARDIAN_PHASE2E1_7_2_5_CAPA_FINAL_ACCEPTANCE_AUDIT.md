# AES Guardian — Phase 2E.1.7.2.5
## CAPA/Prevention UI — Final Cross-Screen Acceptance Audit

### Overall decision: BLOCKED

The four screens use the shared AES visual components and canonical CAPA domain values, and all requested test runs pass. Acceptance is blocked by the Overview screen's independent role state, an unsafe Create retry after a potentially committed insert, and cross-screen error/accessibility/RTL inconsistencies listed below. This was a read-only audit; no correction is included.

### Repository identity and Git preservation

- Requested checkout: `C:\Users\User\Desktop\sure\sanad-rn-migration`
- Canonical path: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Verified repository root: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Branch: `migration/aes-guardian`
- HEAD: `d79b01ef51646509170996f8c77517f95470f217`

Initial `git status --short --untracked-files=all`: 39 modified entries and 130 untracked entries (169 total). The complete output was captured during preflight in the session transcript. It was not saved as a separate path manifest, so this report does not claim path-by-path equality.

The final status is 39 modified entries and 131 untracked entries (170 total). The sole audit-attributable repository change is this report:

`?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_CAPA_FINAL_ACCEPTANCE_AUDIT.md`

No source or test was modified. All pre-existing work was preserved. No staging, commit, push, stash, reset, clean, branch change, or change to the original SANAD repository occurred.

### Screen-by-screen findings

#### Prevention Overview

- **VERIFIED IN SOURCE — shared design system:** Uses the shared screen container, header, cards, status badge, buttons, and AES color/spacing/typography tokens (`PreventionOverviewScreen.tsx:12-24, 37-48`).
- **VERIFIED IN SOURCE — navigation:** Register and Create actions use the existing typed routes (`PreventionOverviewScreen.tsx:263-276`; `routes.ts:38-41`).
- **VERIFIED IN SOURCE — blocking identity inconsistency:** The screen initializes its own role context to `SYNTHETIC_QUALITY_STAFF_CONTEXT` and changes it through an in-screen selector (`PreventionOverviewScreen.tsx:54-71, 98-126`). It does not read `useDemoRoleStore`; the other three CAPA screens do. The application-wide store defaults to the exposed role (`use-demo-role.ts`, initial state) while this screen locally starts as quality staff. Repository authorization remains independently enforced, but the Overview does not use the active application identity as required.
- **VERIFIED BY TEST — tests encode the local role selector:** Overview tests press `prevention-role-*` controls and assert that the local role's ID is passed to the repository (`prevention-overview-ui.test.tsx:59-105, 135-145`). They do not verify that Overview follows the Zustand active identity.
- **VERIFIED IN SOURCE — localization inconsistency:** `DEMO_ROLES_LOCALIZED` is a memoized reference to the unchanged `DEMO_ROLES` array, and displayed `context.displayName` strings are French demo literals (`PreventionOverviewScreen.tsx:54-67, 100-126`; `boundaries.ts:57,67,144,154,164`). They remain French when the screen language is English or Arabic.
- **VERIFIED IN SOURCE — error and retry inconsistency:** The load catch renders raw `Error.message` (with a French fallback) and the error card has no retry action (`PreventionOverviewScreen.tsx:85-93, 174-189`). Register and Detail instead show localized generic errors with retry. The Overview error test checks only that fabricated metrics are absent and does not test retry (`prevention-overview-ui.test.tsx:167-173`).
- **VERIFIED IN SOURCE — RTL layout:** The role list and status-card header reverse for Arabic, and text alignment is localized. The `column`/`column` conditional at `PreventionOverviewScreen.tsx:289-291` is redundant but has no behavioral consequence.

#### Prevention Action Register

- **VERIFIED IN SOURCE — shared design and canonical data:** Uses the shared AES container/header/card/button/status badge and AES tokens. It obtains the active identity from `useDemoRoleStore`, asks the repository for canonical filters, maps canonical status/type/factor values to translation keys, and displays only supported action fields (`PreventionActionRegisterScreen.tsx:20-47, 100-138, 220-300, 330-375`).
- **VERIFIED IN SOURCE — states and access:** Provides loading, generic error with retry, empty, and unauthorized views. Quality staff alone sees Create; admin and OH are read-only (`PreventionActionRegisterScreen.tsx:183-218, 300-324, 389-397`).
- **VERIFIED IN SOURCE / VERIFIED BY TEST — navigation and targets:** Detail navigation passes `{ actionId: action.id }`; Create uses the existing route (`PreventionActionRegisterScreen.tsx:379-393`). Dedicated tests cover both routes, locale labels, Arabic filter ordering, repository filters, and 48dp controls (`prevention-action-register-ui.test.tsx:153-198, 208-245, 248-303`).
- **VERIFIED IN SOURCE — date rendering:** Target date is rendered as the raw repository date string (`PreventionActionRegisterScreen.tsx:370-375`), unlike a locale-formatted date.

#### Prevention Action Create

- **VERIFIED IN SOURCE — shared design, role, and payload:** Uses AES components/tokens and the Zustand active context. It gates on `canManagePreventionActions`, builds `CreatePreventionActionInput` from canonical fields, and navigates back only after the repository resolves (`PreventionActionCreateScreen.tsx:35-46, 77-110`).
- **VERIFIED IN SOURCE / VERIFIED BY TEST — fields and validation:** Uses the two canonical action types and eight factor values, required text validation, optional `YYYY-MM-DD` target date, and aggregate-only surveillance reference validation. Tests exercise those values and constraints (`PreventionActionCreateScreen.tsx:59-75, 186-218, 239-263`; `prevention-action-create-ui.test.tsx:74-121, 218-236`).
- **VERIFIED IN SOURCE — blocking uncertain-create retry risk:** The repository commits the insert, audit event, and notification in a transaction, then performs a separate `getPreventionActionById` read before returning (`AesGuardianDatabase.ts:2502-2550`). If that post-commit read rejects, the Create screen catches the rejection as a failed submission and its Retry control calls the full submit handler again (`PreventionActionCreateScreen.tsx:77-110, 277-287`). The second call creates a new record; no creation idempotency key is present in this method. Thus an uncertain post-commit read failure can present an error after a successful insert and an explicit retry can create a duplicate.
- **UNVERIFIED — occurrence of the uncertain failure:** No test or run injected a failure specifically after the insert transaction committed but before the readback completed. Existing retry test intentionally verifies a second create invocation (`prevention-action-create-ui.test.tsx:190-200`), but does not model this commit/readback boundary.
- **VERIFIED IN SOURCE — accessibility gap:** Five `TextInput`s have visible adjacent Text labels but no `accessibilityLabel` or equivalent programmatic label association (`PreventionActionCreateScreen.tsx:152-160, 166-174, 223-232, 240-249, 254-263`). The dedicated suite checks sizes and behavior, not input labels (`prevention-action-create-ui.test.tsx:245-263`).
- **VERIFIED IN SOURCE — Arabic option-control alignment gap:** Create reverses the outer action/factor groups, but the shared `AesOptionCard` keeps its internal indicator/title row left-to-right with a right-only indicator margin while only its text alignment follows RTL (`PreventionActionCreateScreen.tsx:185-218`; `AesOptionCard.tsx:74, 120-132, 145, 164-166`). Arabic text is right-aligned, but the option indicator does not move to the RTL-leading side.

#### Prevention Action Detail

- **VERIFIED IN SOURCE — shared design, identity, and repository boundaries:** Uses the shared AES components/tokens and Zustand active context. It checks read/manage capability for display and calls the authorized repository methods with the active user ID (`PreventionActionDetailScreen.tsx:12-50, 77-84, 121-145`). Repository authorization remains authoritative.
- **VERIFIED IN SOURCE / VERIFIED BY TEST — lifecycle:** The UI calls the canonical transition helper and exposes only legal actions. Completion requires a trimmed three-character note; cancellation note is optional; terminal states have no actions. Duplicate submission is guarded synchronously, errors preserve typed notes, and retry refreshes the repository state before another deliberate mutation (`PreventionActionDetailScreen.tsx:121-178, 366-477`; dedicated tests cover these cases).
- **VERIFIED IN SOURCE — transaction boundary:** The repository validates the same transition/note rules and places the state update, audit insert, and notification insert in one transaction (`AesGuardianDatabase.ts:2560-2662`). The UI adds no audit or notification writes.
- **VERIFIED IN SOURCE — back-arrow direction inconsistency:** The Detail screen wires a back action to `AesRoundArrowButton` (`PreventionActionDetailScreen.tsx:239-243`), whose icon points right in LTR and left in RTL (`AesRoundArrowButton.tsx:61`). This is the forward direction in both locales. Create uses a back chevron mirrored for RTL (`PreventionActionCreateScreen.tsx:128-140`).
- **VERIFIED IN SOURCE — raw date/time rendering:** Target, creation, update, and completion fields are rendered directly from repository strings without locale formatting (`PreventionActionDetailScreen.tsx:331-352`). Audit timestamps are also rendered directly (`:489-492`).

### Cross-screen domain and authorization audit

**VERIFIED IN SOURCE**

- `PreventionActionStatus` and `PREVENTION_ACTION_STATUSES` contain only `proposed`, `in_progress`, `completed`, and `cancelled`; the repository transition map allows only `proposed` → `in_progress`/`cancelled`, `in_progress` → `completed`/`cancelled`, with terminal completed/cancelled states (`types.ts:546-562`; `AesGuardianDatabase.ts:462-474`).
- Action types are exactly `corrective` and `preventive`; factor values are the eight canonical values in `types.ts:564-591`. Register/Create consume the exported canonical arrays. Detail maps each canonical factor to an existing localized key.
- No audited screen introduces `declaration_id`, `due_date`, `created_by`, urgency, overdue status, risk score, clinical deadline, or effectiveness metric. Displayed fields map to `PreventionAction`/`PreventionActionDetail` (`types.ts:596-647`).
- Repository authorization is enforced independently: read methods permit quality/admin/OH; create and status mutation permit quality staff only (`AesGuardianDatabase.ts:2441-2460, 2560-2579, 2673-2704, 2730-2755, 2785-2787`). `canViewPreventionActions` and `canManagePreventionActions` are UI guards, not the security boundary (`boundaries.ts:194-215`).
- Register, Create, and Detail use the shared Zustand demo-role identity, and none contains a local selector or fixed user ID. Overview is the explicit exception described above.
- The FR/EN/AR dictionaries contain canonical status, action-type, and factor labels. Overview status cards use plural labels while badges use status labels; the terms are semantically consistent in the reviewed locales (`localization/index.ts:1109-1112, 1129-1130, 1161-1166, 1854-1857, 1874-1875, 1906-1911, 2600-2603, 2620-2621, 2652-2657`).
- All four screens use the shared AES screen/header/card/button components and token set; Overview, Register, and Detail additionally use the shared status badge, while Create is an entry form and has no current status to show. The badge maps all four CAPA statuses to semantic, contrast-documented colors (`AesStatusBadge.tsx:18-68`; `aesColors.ts:148-153`). Shared buttons are 48dp and the round-arrow control is 48×48 (`AesButton.tsx:118-122`; `AesRoundArrowButton.tsx:70-73`). Screen-specific filter, role, form, and transition controls were checked against their styles and dedicated test coverage.

**DOCUMENTED DESIGN DECISION**

- The role contexts and sample data are synthetic demonstration identities, not real authentication. The Zustand role store documentation explicitly says repository/domain authorization is independent (`use-demo-role.ts:1-9`). This does not resolve the Overview screen’s failure to use that store.

**UNVERIFIED**

- No emulator or native screen-reader run was performed. RTL findings above are source-verified layout differences; native-device visual behavior was not independently observed.
- No run reproduced a committed Create followed by a failed detail read. The risk follows the verified transaction/readback/retry code path but its runtime occurrence remains unverified.

### Verification

| Exact command | Result |
|---|---|
| `npm test -- --runInBand src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx src/features/aes-guardian/__tests__/prevention-action-detail-ui.test.tsx` | Exit 0; 4 suites passed, 82/82 tests passed. |
| `npm test -- --runInBand src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts src/core/database/__tests__/database.test.ts src/core/database/__tests__/migration7.test.ts src/core/database/__tests__/notification-workflow.test.ts src/core/database/__tests__/notification-workflow-hardening.test.ts` | Exit 0; 5 suites passed, 167/167 tests passed. |
| `npm test -- --runInBand` | Exit 0; 52 suites passed, 1,153/1,153 tests passed. |
| `npx tsc --noEmit --pretty false` | Exit 2; 769 diagnostics across 30 files. No diagnostics in the four audited screens, their four dedicated UI tests, or localization. |

The Notification Centre suite passed in this single full-suite run. This is a passing-run observation only; it does not demonstrate that either historical intermittent Notification Centre issue is fixed. React Native Animated/Touchable `act(...)` console warnings appeared during UI runs but did not fail the suites. The typecheck is not repository-wide success; the diagnostics are in other `src/features` files, including unresolved identifiers in `src/features/alerts/screens/AlertDetailScreen.tsx`.

### Recommended corrections (not implemented)

1. Make Overview read identity from the shared Zustand store; remove its local role selector and update its tests to assert global identity behavior.
2. Make Create’s retry safe across an uncertain post-commit read failure, for example by reconciling the persisted outcome or using repository-supported idempotency. Do not treat every rejected post-commit read as proof that no action was created.
3. Give Overview a localized generic error and a retry action consistent with Register/Detail; localize the role labels.
4. Add programmatic accessible labels to all Create inputs and mirror the shared option indicator layout for Arabic.
5. Use a back-direction icon for Detail and format displayed date/time values according to the active locale.

### Stop

This report is the only audit-created repository file. No corrections, blueprint changes, additional domain work, or later phase were started.
