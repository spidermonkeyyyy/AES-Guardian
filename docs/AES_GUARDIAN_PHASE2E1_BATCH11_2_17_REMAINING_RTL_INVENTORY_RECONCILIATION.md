# AES Guardian - Phase 2E.1 Batch 11.2.17

## 1. Executive recommendation

**RECONCILIATION ACCEPTED - NEXT SCREEN IDENTIFIED**

The original 26-screen inventory is reconciled against the actual migration reports and current source. Seventeen screens and the shared migration foundation are accepted at source/Jest level. Nine original screen files remain unmigrated or require re-audit.

The recommended next migration candidate is:

**`SubmissionConfirmationScreen.tsx`**

Route: `submissionConfirmation`

Parameter: `{ referenceNumber: string }`

Reason:

- It remains unmigrated under the 11.2.0/11.2.16 reconciliation.
- It already uses `useLocale` and local `isRTL`, making it a bounded partial-migration rather than a greenfield layout.
- It has existing focused coverage in `declaration-workflow.test.tsx`, including route parameter, copy state, navigation and English/Arabic localized copy.
- It does not own clinical mutation, authorization, database, or navigation semantics that need redesign.
- It is small and self-contained, and can be corrected presentation-only with the shared layout APIs and direct rendered FR/EN/AR assertions.

This is a source/Jest recommendation only. Native RTL remains unverified.

## 2. Preservation preflight

Verified before reconciliation:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Raw lockfile SHA-256: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile Git blob: `e397c195e4e22231204add4fdfafb1ba50219736`
- Initial status entries: 111
- Initial status capture: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-17-initial-status.txt`
- Initial status SHA-256: `acec65a01751f75866a1ce303cb436eaf9833b96238ee80007dd9d499a5ed477`

No staged or remote Git operation was performed.

## 3. Evidence sources and limitations

Primary evidence:

- `docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_0_RTL_SCREEN_INVENTORY_AND_MIGRATION_PLAN.md`
- Batch 11.1 shared RTL infrastructure report
- Batch 11.2.1 through 11.2.16 migration reports
- Batch 11.2.16E, 11.2.16F and 11.2.16G post-migration investigations
- Current `src/navigation/AppNavigator.tsx` and `src/navigation/routes.ts`
- Current AES screen and shared-component source
- Existing focused Jest files and RTL assertions

Limitations:

- No emulator or device was launched.
- No native `I18nManager`, Android native-header, TalkBack, text-expansion or physical RTL rendering claim is made.
- Reports establish source/Jest acceptance only, not native equivalence.
- Read-only reconciliation does not execute migration tests.

## 4. Full 26-screen reconciliation table

| # | Exact screen | Route/parameters | Status | Establishing batch/report | Shared APIs/current source | Remaining RTL risks | Focused test/direct rendered RTL coverage | Native gap |
|---|---|---|---|---|---|---|---|---|
| 1 | `SplashScreen.tsx` | `splash: undefined`; also AES `aesSplash: { replay?: boolean } \| undefined` | Accepted at source/Jest level | Batch 11.2.2 | Shared header/arrow conventions; migrated splash forward direction and title/layout | Native stack/header boundary only; verify large-font/physical device | `onboarding-demo-entry.test.tsx`; rendered splash/RTL assertions | Native header/reading order not verified |
| 2 | `LanguageSelectionScreen.tsx` | `aesLanguageSelect: undefined` | Accepted at source/Jest level | Batch 11.2.2 | Shared option/header/direction APIs; local implementation replaced legacy layout as accepted | Native picker row and font expansion | `onboarding-demo-entry.test.tsx`; FR/EN/AR selection assertions | Native selection/touch traversal not verified |
| 3 | `WelcomeCarouselScreen.tsx` | `aesWelcomeCarousel: undefined` | Accepted at source/Jest level | Batch 11.2.3 | Shared direction APIs and round-arrow/row behavior | Pagination and slide controls only native affordance risk | `onboarding-demo-entry.test.tsx`; rendered LTR/RTL carousel assertions | Native back/swipe behavior not verified |
| 4 | `PrototypeDisclaimerScreen.tsx` | `aesDisclaimer: undefined` | Accepted at source/Jest level | Batch 11.2.3 | Shared header/direction infrastructure | Confirm Arabic expansion and notice/action wrapping | `onboarding-demo-entry.test.tsx`; FR/EN/AR and action assertions | Native text expansion not verified |
| 5 | `DemoAccountPickerScreen.tsx` | `aesDemoPicker: undefined` | Accepted at source/Jest level | Batch 11.2.4 | `AesOptionCard`, shared direction APIs | Physical/native option-card ordering | `onboarding-demo-entry.test.tsx`; role/card rendered assertions | Native card traversal not verified |
| 6 | `AesGuardianWorkspaceScreen.tsx` | `aesGuardianWorkspace: undefined` | Accepted at source/Jest level; stale-focus correction separately accepted | Batches 11.2.5 and 11.2.16F/16G | `useLayoutDirection`, `getLayoutRowDirection`, `getLayoutTextAlign`, logical badge/row styles | Historical badge-removal concern bounded by 16G; native badge/header placement | `notification-centre.test.tsx`; workspace RTL and badge regression assertions | Native header/badge and app-level RTL not verified |
| 7 | `DeclarationListScreen.tsx` | `declarations: undefined` | Accepted at source/Jest level | Batch 11.2.9 | Shared header/card/direction helpers; logical card spacing | Horizontal filter/chip overflow and reference/status row at native scale | `declaration-list-details-batch4.test.tsx`; direct row/text assertions | Native horizontal scroll and text expansion not verified |
| 8 | `DeclarationFormScreen.tsx` | `newDeclaration: { declarationId?: number } \| undefined` | Accepted at source/Jest level | Batch 11.2.8 | Shared header/option/round controls; shared layout APIs | Wizard semantics, input adornments, date fields and footer wrapping | `declaration-workflow.test.tsx`; direct FR/EN/AR wizard assertions | Native keyboard/date input and touch order not verified |
| 9 | `DeclarationDetailsScreen.tsx` | `declarationDetails: { declarationId: number }` | Accepted at source/Jest level | Batch 11.2.10 | Shared header/status/card and direction APIs | Review history, tabs and long references at native width | `declaration-list-details-batch4.test.tsx`; direct header/tab/detail RTL assertions | Native tab/long-text behavior not verified |
| 10 | `SubmissionConfirmationScreen.tsx` | `submissionConfirmation: { referenceNumber: string }` | **Partially migrated** | 11.2.0 inventory; no accepted 11.2 screen report | `useLocale`, legacy `isRTL`; `AesScreenContainer`, `AesCard`, `AesButton` | Replace legacy direction branching; add row/text assertions for reference, copy, notice and bottom action | `declaration-workflow.test.tsx`; localization and copy/navigation behavior, but no direct RTL layout matrix | Native copy/reference wrapping not verified |
| 11 | `AdminReviewQueueScreen.tsx` | `adminReviewQueue: undefined` | Accepted at source/Jest level | Batch 11.2.13 | Shared direction APIs/header/card patterns | Long filter/status rows and native overflow | `admin-review-batch5-acceptance.test.tsx`; direct FR/EN/AR queue assertions | Native filter and list order not verified |
| 12 | `AdminReviewActionScreen.tsx` | `adminReviewAction: { declarationId: number }` | Accepted at source/Jest level | Batch 11.2.14 | Shared direction APIs/header/card patterns | Outcome/comment/action row expansion and native wrapping | `admin-review-batch5-acceptance.test.tsx`; direct rendered assertions | Native keyboard/action placement not verified |
| 13 | `CorrectionResponseScreen.tsx` | `correctionResponse: { declarationId: number; reviewId: number }` | Accepted at source/Jest level | Batch 11.2.15 | `useLayoutDirection`, `getLayoutRowDirection`, `getLayoutTextAlign` | Input cursor direction, long count row and logical border behavior | `correction-workflow.test.tsx`; direct FR/EN/AR assertions | Native text input and border behavior not verified |
| 14 | `OhCoordinationQueueScreen.tsx` | `ohCoordinationQueue: undefined` | Accepted at source/Jest level | Batch 11.2.11 | Shared header/card/direction APIs | Long coordination metadata and horizontal tab overflow | `oh-coordination-batch6-acceptance.test.tsx`; direct row/card/tab RTL assertions | Native scroll/list/reading order not verified |
| 15 | `OhCoordinationDetailScreen.tsx` | `ohCoordinationDetail: { coordinationId: number }` | Accepted at source/Jest level | Batch 11.2.12 | Shared header/card/direction APIs | Event chronology, note rows and follow-up action expansion | `oh-coordination-detail-screen.test.tsx`; direct FR/EN/AR detail/event assertions | Native chronology and screen-reader traversal not verified |
| 16 | `CreateCoordinationScreen.tsx` | `createCoordination: { declarationId: number }` | **Not migrated** | 11.2.0 inventory; no accepted 11.2 migration report | Shared `AesScreenHeader` and `AesOptionCard` are migrated, but screen itself has no layout-direction hook | Screen-owned reason label/options, disclaimer, clinical notice and submit row need direct RTL audit | `oh-coordination-batch6-acceptance.test.tsx`; workflow/authorization coverage, no direct RTL-layout matrix | Native option/action traversal not verified |
| 17 | `OhFollowUpEventScreen.tsx` | `recordFollowUpEvent: { coordinationId: number }` | **Not migrated** | 11.2.0 inventory; no accepted 11.2 migration report | Shared header/option/button cover some internals; screen has no layout-direction hook | Date input, note counter/label, category cards and submit row need direct RTL audit | `oh-coordination-batch6-acceptance.test.tsx`; focused workflow/character-counter tests, no direct RTL-layout matrix | Native date input, keyboard, counter and text expansion not verified |
| 18 | `DeclarationCoordinationStatusScreen.tsx` | `declarationCoordinationStatus: { declarationId: number }` | **Not migrated** | 11.2.0 inventory; no accepted 11.2 migration report | No shared layout hook; legacy theme primitives and fixed centered content | Status badge, title, retry and clinical disclaimer text alignment | No dedicated RTL/layout test located; declaration detail/status-adjacent tests exist | Native status badge/reading order not verified |
| 19 | `SurveillanceDashboardScreen.tsx` | `surveillanceDashboard: undefined` | **Requires re-audit / partially migrated** | 11.2.0 inventory; no accepted source/Jest migration batch | Legacy `useLocale`/`isRTL`, physical `marginLeft`, `marginRight`, `borderLeft` and row branches | Consolidate manual branches; filter/date/status/KPI row ordering and border sides | `surveillance-dashboard-ui.test.tsx`; direct RTL-oriented UI coverage exists, but not shared-hook migration evidence | Native chart/filter/date layout not verified |
| 20 | `PreventionOverviewScreen.tsx` | `preventionOverview: undefined` | **Requires re-audit / partially migrated** | 11.2.0 inventory; no accepted source/Jest migration batch | Legacy `useLocale`/`isRTL`; physical `borderLeft`; fixed action rows | Logicalize warning border, KPI/action rows and text alignment | `prevention-overview-ui.test.tsx`; UI coverage, no complete shared-hook/RTL layout matrix found | Native KPI/action wrapping not verified |
| 21 | `PreventionActionRegisterScreen.tsx` | `preventionRegister: undefined` | **Requires re-audit / partially migrated** | 11.2.0 inventory; no accepted source/Jest migration batch | Legacy `useLocale`/`isRTL`; screen-specific `row`/`row-reverse` branches | Consolidate screen-specific branches; filter/action/detail row and create affordance | `prevention-action-register-ui.test.tsx`; behavior coverage, incomplete direct RTL matrix | Native filter/action overflow not verified |
| 22 | `PreventionActionCreateScreen.tsx` | `preventionCreate: undefined` | **Requires re-audit / partially migrated** | 11.2.0 inventory; no accepted source/Jest migration batch | Legacy `useLocale`/`isRTL`; shared header/options; fixed own styles | Labels, inputs, date/uncertain-state actions and logical spacing | `prevention-action-create-ui.test.tsx`; French/English/Arabic copy coverage, no complete rendered RTL matrix | Native input/date/error traversal not verified |
| 23 | `PreventionActionDetailScreen.tsx` | `preventionActionDetail: { actionId: number }` | **Requires re-audit / partially migrated** | 11.2.0 inventory; no accepted source/Jest migration batch | Legacy `useLocale`/`isRTL`; shared header/arrow | Audit timeline/evidence/reference/action rows and logical spacing | `prevention-action-detail-ui.test.tsx`; behavior/locale coverage, no complete shared-hook/RTL layout matrix | Native timeline/touch order not verified |
| 24 | `HelpGlossaryScreen.tsx` | `helpGlossary: { initialSection?: 'help' \| 'glossary' } \| undefined` | Accepted at source/Jest level | Batch 11.2.7 | Shared direction APIs and logical tab/content layouts | Long tab labels and native horizontal scrolling | `help-glossary-profile.test.tsx`; direct RTL tab/content assertions | Native tab/scroll order not verified |
| 25 | `AesGuardianProfileScreen.tsx` | `aesGuardianProfile: undefined` | Accepted at source/Jest level | Batch 11.2.6 | Shared direction APIs/header/card patterns | Capability/link list and language controls at native scale | `help-glossary-profile.test.tsx`; direct profile RTL assertions | Native settings/list traversal not verified |
| 26 | `NotificationCentreScreen.tsx` | `notificationCentre: undefined` | Accepted at source/Jest level; bounded badge intermittency evidence | Batch 11.2.16 plus 16G | `useLayoutDirection`, `getLayoutRowDirection`, `getLayoutTextAlign`, logical padding/borders | Historical badge lifecycle remains separately unresolved; native notification header/rows | `notification-centre.test.tsx`; FR/EN/AR rendered row and badge coverage; 16G passed 10 focused/full checks | Native header, reading order and badge placement not verified |

## 5. Shared component reconciliation

| Shared component | Current status | Remaining dependency |
|---|---|---|
| `AesButton` | Migrated source-wise by Batch 11.2.1: icon spacing uses `marginEnd`/`marginStart`, and the base/content rows are fixed-row for button semantics | No app-direction hook is needed if `iconPosition` remains a caller-selected semantic; direct button icon LTR/RTL matrix should be retained before next screen |
| `AesStatusBadge` | Not consolidated with the shared direction hook | Compact badge has no screen row assumptions, but embedded Arabic text and caller text alignment remain screen-owned; no migration-blocking dependency |
| `AesCard` | Container not direction-specific; child layout remains caller responsibility | Screen row migration can proceed; card chrome needs no broad redesign |
| `AesScreenContainer` | Container/scroll shell remains direction-neutral | Safe; horizontal scroll behavior remains caller responsibility |
| `AesScreenHeader` | Accepted shared RTL component | Existing back/title/overline behavior can be reused; native React Navigation header remains separate |
| `AesRoundArrowButton` | Accepted shared RTL component | Reuse semantics; native hit area/back affordance remains device validation |
| `AesOptionCard` | Accepted shared RTL component | Reuse; direct press/disabled behavior and native row margin remain existing bounded coverage gaps |

No shared component is an immediate blocker for `SubmissionConfirmationScreen.tsx`.

## 6. Remaining RTL risk clusters

1. **Onboarding partial residue:** `SubmissionConfirmationScreen` remains the only original onboarding/workflow confirmation screen without a completed shared-hook migration.
2. **OH remaining forms:** Create coordination and follow-up event have shared header/option primitives but screen-owned labels, date/notes and action placement remain un-audited.
3. **Legacy status screen:** `DeclarationCoordinationStatusScreen` does not use the shared layout infrastructure or an existing dedicated rendered RTL test.
4. **Surveillance/CAPA legacy branches:** surveillance and prevention screens retain manual `isRTL`, physical margins/borders or screen-specific `row-reverse` logic and need re-audit rather than assuming migration acceptance.
5. **Native boundary:** every accepted screen remains source/Jest-only for native RTL behavior.

## 7. Recommended next screen and exact implementation/test scope

**Recommended next: `SubmissionConfirmationScreen.tsx`**

Exact implementation scope:

- Replace legacy `isRTL(locale)` branching with `useLayoutDirection()` plus `getLayoutRowDirection()` / `getLayoutTextAlign()` where needed.
- Direction-aware reference/copy row, title/subtitle, confirmation notice, disclaimer and bottom action as presentation only.
- Preserve the reference fallback, copy timeout, copied state and `navigation.navigate('declarations')`.
- Do not change route parameters or declaration submission behavior.

Exact test scope:

- Add direct FR/EN/AR assertions to `declaration-workflow.test.tsx`.
- Assert `row`/`row-reverse`, text alignment, copy-button layout, reference rendering and back-action behavior.
- Preserve route parameter, navigation and copy-state assertions already in the file.

Why it precedes others:

- Its code is small and no business or authorization logic is coupled to the layout.
- Existing shared primitives and locale subscriptions are already established.
- It has a suitable existing focused suite.
- It has fewer unresolved dependencies than Create/Follow-up, which are tied to more complex OH workflows.
- It precedes the larger surveillance/CAPA cluster, which carries higher visual and test risk.

## 8. Deferred candidates and reasons

1. `CreateCoordinationScreen`: defer because authorization, repository submission, duplicate guard and alert behavior add verification scope beyond a bounded presentation migration.
2. `OhFollowUpEventScreen`: defer because date validation, 300-character state, repository submission and duplicate-submission locking are coupled to a riskier form.
3. `DeclarationCoordinationStatusScreen`: defer until it has a dedicated focused test and current status/authorization boundary is re-established.
4. Surveillance and prevention screens: defer for the existing manual-RTL re-audit; they contain the highest remaining branch/KPI/filter complexity.
5. All accepted 16 screens: no migration implementation remains for them; only bounded native validation remains.

## 9. Native/device validation backlog

Native validation is not complete for any migrated screen. Deferred backlog includes:

- Android `I18nManager.allowRTL` / native layout behavior and app restart.
- Native stack headers and React Navigation back affordances.
- Logical margin/padding on physical devices.
- Horizontal ScrollView initial position and order.
- Text input cursor/keyboard direction.
- Arabic expansion and 200% font scaling.
- TalkBack reading order.
- Native clipping and touch-target behavior.

No emulator or physical-device test is authorized in this batch.

## 10. Final preservation audit

Before report creation:

- Initial and pre-report working-tree status were unchanged.
- 111 status entries remained in the initial and pre-report status.
- No staged path existed.
- Branch, HEAD, committed tree and index tree remained unchanged.
- Raw lockfile and normalized Git blob remained canonical.
- No source or test file was changed.

Create only:

`docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_17_REMAINING_RTL_INVENTORY_RECONCILIATION.md`
