# AES Guardian - Phase 2E.1 Batch 11.2.0

## Screen-Level RTL Coverage Inventory and Migration Plan

**Final recommendation: `CONDITIONALLY READY - INVENTORY COMPLETE WITH BOUNDED GAPS`**

This is a read-only inventory. No application or test file was modified.

## Repository and Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Package-lock SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- Preflight working tree contains accumulated tracked modifications and untracked reports/files. They were preserved.

## Evidence and Commands

Commands used:

- `git rev-parse --show-toplevel`
- `git branch --show-current`
- `git rev-parse HEAD`
- `git rev-parse 'HEAD^{tree}'`
- `git write-tree`
- `Get-FileHash package-lock.json`
- `git status --short`
- `git diff --check`
- File globs for all 26 AES screen files and 7 shared component files
- Static ripgrep searches for `useLayoutDirection`, `resolveLayoutDirection`, `getLayoutRowDirection`, `getLayoutTextAlign`, `isRTL`, `I18nManager`, physical margins/padding, `textAlign`, `flexDirection`, directional icons, and horizontal `ScrollView`
- Navigation inspection in `src/navigation/routes.ts` and `src/navigation/AppNavigator.tsx`

No tests or native-device validation were executed in this inventory phase.

## Existing Direction Infrastructure

The authoritative locale source is `src/localization/index.ts`:

- `currentLocale`
- `setLocale`
- `subscribeLocale`
- `useLocale`
- `useLayoutDirection`

The pure API provides `LayoutDirection`, `resolveLayoutDirection`, `getLayoutRowDirection`, and `getLayoutTextAlign`. French and English resolve LTR; Arabic resolves RTL; unsupported values fall back to LTR.

No `I18nManager.forceRTL` or `allowRTL` call exists in source. Native RTL remains unvalidated.

## Screen Inventory

All 26 AES screen files are reachable through the current root navigator. Reachability is direct or role/context-dependent.

| Screen | Shared/own RTL source | Source-supported behavior | Remaining risk / migration dependency |
|---|---|---|---|
| `SplashScreen.tsx` | No direction hook | AES header area uses mostly row layouts; splash forward icon is hard-coded `arrow-right` | Forward arrow must become direction-aware; verify splash text alignment |
| `LanguageSelectionScreen.tsx` | `useLocale`, `isRTL` | Arabic text alignment and selection layout are handled; card radio remains physical | Replace local `isRTL` use with shared hook/API; logicalize card row and radio spacing |
| `WelcomeCarouselScreen.tsx` | `useLocale`, `isRTL` | Arabic alignment and bullets receive some RTL handling; uses shared round arrow | Verify pagination, slide copy, forward/back arrows, and text expansion |
| `PrototypeDisclaimerScreen.tsx` | `useLocale`, `isRTL` | Text alignment and row handling exist | Review checkbox/action row order and fixed disclaimer spacing |
| `DemoAccountPickerScreen.tsx` | `useLocale`, `isRTL`, `AesOptionCard` | Option cards already use shared direction; screen has `marginRight` and row content | Remove screen-level physical margin assumptions; verify role-card ordering |
| `AesGuardianWorkspaceScreen.tsx` | No `useLayoutDirection`; no `isRTL` in source found | Some row layouts; role pills and badge use physical `marginRight`, `right`, and fixed rows | Shared dashboard-style row migration; logical badge position, role pills, module cards, banner borders |
| `DeclarationListScreen.tsx` | Uses shared header/cards partly | Header and card text; fixed chip bar and `marginRight` remain | Align chips/horizontal scroll, status and card headers; logicalize card reference spacing |
| `DeclarationFormScreen.tsx` | `useLocale`, `isRTL`, shared option/header/round controls | Wizard back chevron is direction-aware; form wizard rows and inputs have RTL handling | Audit wizard header, step indicator, field adornments, option cards, submit/back action placement |
| `DeclarationDetailsScreen.tsx` | Shared header/card/status patterns | Tabs and card rows; `marginRight` and fixed row layouts remain | Logicalize tab/card rows, review history, reference/status row and back control |
| `SubmissionConfirmationScreen.tsx` | `useLocale`, `isRTL` | Text alignment and row actions receive some RTL handling | Verify copy/status row, copy button, action placement and Arabic expansion |
| `AdminReviewQueueScreen.tsx` | Shared header/card patterns, no locale hook found | List/filter rows are fixed `row`; status chips are fixed | Migrate filter and list rows; logicalize status/reference alignment |
| `AdminReviewActionScreen.tsx` | Shared components; no locale hook found | Fixed action and history rows | Audit label/value layout, outcome controls, comments, submit/cancel order |
| `CorrectionResponseScreen.tsx` | Shared header/card/button patterns | Fixed row and text layouts | Audit requested-correction summary, input labels, submit/cancel order |
| `OhCoordinationQueueScreen.tsx` | Shared header/card patterns | Fixed `row` layouts and `marginRight` in queue cards | Logicalize queue card metadata and action placement |
| `OhCoordinationDetailScreen.tsx` | Shared header/card/status patterns | Fixed row layouts and `marginRight` | Logicalize coordination summary, status, dates and event rows |
| `OhFollowUpEventScreen.tsx` | Shared option/header/button patterns | Fixed row layouts | Verify option cards and follow-up event form/action placement |
| `CreateCoordinationScreen.tsx` | Shared option/header/button patterns | Reused components provide partial direction support | Audit form-specific labels and action rows |
| `DeclarationCoordinationStatusScreen.tsx` | Shared/header/card patterns; no locale hook found | Fixed status/timeline-like rows | Determine whether timeline or status list requires direction-aware ordering |
| `SurveillanceDashboardScreen.tsx` | `useLocale`, `isRTL` | Several RTL-aware rows and physical margins already exchanged manually | Consolidate manual `marginLeft/marginRight` branches into logical `marginStart/marginEnd` and shared row helper |
| `PreventionOverviewScreen.tsx` | `useLocale`, `isRTL`, shared header/cards | Card rows and some text alignment receive RTL handling | Review fixed KPI/action rows and list ordering; remove duplicated `isRTL` logic |
| `PreventionActionRegisterScreen.tsx` | `useLocale`, `isRTL`, shared header/arrow | Uses several `row-reverse` branches and directional controls | Replace screen-specific conditionals with shared direction API; audit filters, detail rows and create action |
| `PreventionActionCreateScreen.tsx` | `useLocale`, `isRTL`, shared header/option cards | Back chevron and several text/row branches are direction-aware | Remove remaining physical/duplicated RTL styles; audit labels, inputs, date and uncertain-state actions |
| `PreventionActionDetailScreen.tsx` | `useLocale`, `isRTL`, shared header/arrow | Back and forward controls and action rows are partly direction-aware | Verify audit timeline, evidence rows, acknowledgement controls and fixed labels |
| `HelpGlossaryScreen.tsx` | No shared direction hook found | Horizontal tabs and physical `marginLeft/marginRight`/`paddingLeft` remain | High-priority text/tab/index row migration |
| `AesGuardianProfileScreen.tsx` | No shared direction hook found | Horizontal role row; physical `marginRight/paddingLeft`; capability and link rows | Replace physical spacing and verify language controls, capability list and settings actions |
| `NotificationCentreScreen.tsx` | No shared direction hook found | Fixed notification rows, unread dot/title/date row, `marginLeft` separator indentation | Add direction-aware row reversal/logic; preserve unread semantics and intermittent badge lifecycle concern |

## Shared Component Inventory

### Migrated already

`AesScreenHeader`

- Uses `useLayoutDirection`.
- Direction-aware top row, text alignment and back chevron.
- Remaining gap: `hitSlop` is physical but symmetric and not directionally meaningful; native header integration remains outside this component.

`AesRoundArrowButton`

- Uses `useLayoutDirection`.
- Forward/back action names are semantically correct.
- Callback, touch target, role and accessibility semantics remain intact.

`AesOptionCard`

- Uses `useLayoutDirection`.
- RTL `row-reverse`, logical `marginEnd`, and text alignment.
- Remaining gap: direct tests should cover card LTR/RTL text and press/disabled behavior; native logical margin behavior remains device-validation territory.

### Shared components not yet consolidated

`AesButton`

- No direction API.
- `iconLeft` uses `marginRight`; `iconRight` uses `marginLeft`.
- Risk: icon position is an API contract, not necessarily a directional property. Preserve caller-selected semantics, but logicalize spacing and expose row-direction support if needed.

`AesStatusBadge`

- No explicit direction API.
- A badge itself is intrinsically compact and can remain LTR-independent, but its text alignment should follow Arabic text when embedded in Arabic copies.
- Shared text alignment should come from locale-aware caller context rather than native global state.

`AesCard`

- No direction assumptions in the container itself.
- Child layout remains caller responsibility.
- Risk is low; migrate child screen rows rather than modifying card chrome.

`AesScreenContainer`

- Horizontal safe-area padding is not inherently wrong.
- Scroll container direction and vertical behavior need no change; `scrollView.horizontal` remains screen/caller responsibility.

## Physical and Directional Hotspots

Verified high-confidence hotspots:

- `AesGuardianWorkspaceScreen.tsx`: physical `right`, `marginRight`, fixed row layouts and module cards.
- `AesGuardianProfileScreen.tsx`: `marginRight`, `paddingLeft`, role chips, capability rows and link rows.
- `HelpGlossaryScreen.tsx`: horizontal tabs, physical `marginLeft/marginRight`, segmented content.
- `NotificationCentreScreen.tsx`: unread dot/title/date row and `marginLeft` separator indentation.
- `SurveillanceDashboardScreen.tsx`: manual `marginLeft/marginRight` RTL branches, horizontal filter bars and date row.
- `DeclarationFormScreen.tsx`: wizard header, step controls, physical spacing and text entry/adornments.
- `DeclarationListScreen.tsx`, `DeclarationDetailsScreen.tsx`: card/header row and `marginRight`.
- `OhCoordinationQueueScreen.tsx`, `OhCoordinationDetailScreen.tsx`: queue/detail metadata and physical spacing.
- `PreventionActionRegisterScreen.tsx`: multiple screen-specific `row-reverse` branches.
- `AdminReviewQueueScreen.tsx`, `AdminReviewActionScreen.tsx`, `CorrectionResponseScreen.tsx`: fixed action/metadata rows.
- `AesButton.tsx`: physical icon margins.
- `AesScreenHeader.tsx`: logical title and row behavior are good, but native stack headers remain separate.

## Directly Verified Consumers

Source currently consumes `useLocale` plus `isRTL` or direct `isRTL` in:

- `DeclarationFormScreen`
- `DemoAccountPickerScreen`
- `LanguageSelectionScreen`
- `PreventionActionCreateScreen`
- `PreventionActionDetailScreen`
- `PreventionActionRegisterScreen`
- `PreventionOverviewScreen`
- `PrototypeDisclaimerScreen`
- `SubmissionConfirmationScreen`
- `WelcomeCarouselScreen`
- `SurveillanceDashboardScreen`

Many other screens use shared components but do not consume locale/direction directly. That is acceptable only where the shared component fully contains layout-sensitive behavior; it is not sufficient for screen-owned fixed rows.

## Dependency-Ordered Migration Plan

### Batch 12.1 — Shared primitives

1. Extend `AesButton` icon spacing to `marginStart/marginEnd` and optionally mirror caller/icon meaning only if caller semantics require it.
2. Add locale-aware shared row/text helpers for badge and text content where they are needed.
3. Review `AesScreenContainer` and `AesCard` only for logical child composition; avoid broad design churn.
4. Replace remaining screen-level `isRTL` calls with `useLayoutDirection` or pure helpers.

Exit evidence:
- LTR/RTL button icon spacing.
- Accessibility and disabled behavior unchanged.
- Existing LTR suite passes.

### Batch 12.2 — Navigation and headers

Migrate:

- `AesScreenHeader` call sites already on shared header are mostly ready.
- Native `Stack.Navigator` headers need separate Arabic title/back treatment.
- `DeclarationFormScreen`, `PreventionActionCreateScreen`, and detail/register screens for local back controls.
- Splash, welcome and declaration back/forward controls.

Exit evidence:
- Back/forward icon identity matrix.
- Native navigation title/back affordance test or documented device gap.
- No accidental double reversal.

### Batch 12.3 — Onboarding and workspace

Screens:

- Splash
- Language selection
- Welcome carousel
- Disclaimer
- Demo account picker
- Workspace
- Profile

Rationale: established entry flow and role selection are high visibility and depend on shared option/header/button primitives.

Exit evidence:
- Horizontal role/filter scrolls order as expected in LTR/RTL.
- Workspace/module cards and physical badge position are logical.
- Profile language and capability rows retain touch/accessibility behavior.

### Batch 12.4 — Declarations and reviews

Screens:

- Declaration list
- Declaration form
- Declaration details
- Submission confirmation
- Admin review queue/action
- Correction response

Rationale: shared cards, tabs, form fields and status rows cover the clinical workflow.

Exit evidence:
- Labels/values, date fields, status rows, review history and action placement.
- Wizard progress/previous-next semantics.
- No business workflow or permission changes.

### Batch 12.5 — Occupational health

Screens:

- OH queue
- OH detail
- Create coordination
- Follow-up event
- Declaration coordination status

Rationale: similar metadata/detail/card patterns can be migrated as one coordinated group.

### Batch 12.6 — Surveillance and CAPA

Screens:

- Surveillance dashboard
- Prevention overview
- CAPA register
- CAPA create
- CAPA detail
- Notification centre

Rationale: complex rows, charts/tables, status badges, horizontal filters and navigation affordances have the highest visual and test risk.

Exit evidence:
- Filter/date chip order.
- KPI/bar/status layouts.
- CAPA target dates and uncertain-state actions.
- Notification unread and mark-read behavior.

## Screens Already Adequately Covered or Low-Risk

Directly do not need broad migration without new evidence:

- `AesCard` container itself.
- `AesScreenContainer` vertical scrolling shell.
- `AesOptionCard` after Batch 11.1 behavior assertions are complete.
- `AesRoundArrowButton` after complete icon matrix.
- `AesScreenHeader` after native header boundary is addressed.

Other screens may remain visually stable if they contain only vertically stacked text and already receive alignment through shared primitives, but source evidence is insufficient to label them fully compatible.

## Required Jest Coverage per Migration Batch

Shared primitives:

- Test icon start/end spacing and LTR/RTL backward/forward direction.
- Test no duplicate physical/logical margins.
- Test button accessibility and callback behavior.

Navigation/header:

- Header back chevron LTR/RTL.
- Title/overline/subtitle alignment.
- Native stack title/back only where device test is possible.

Onboarding/workspace:

- Horizontal role scroll order.
- Badge position and count.
- Profile/capability/link row alignment.
- Forward/back icons and first-launch controls.

Clinical workflows:

- Wizard previous/next meaning.
- Declaration and review card row order.
- Label/value alignment.
- Submit/cancel/confirmation placement.

OH:

- Queue/detail row order.
- Status/date/event alignment.

Surveillance/CAPA:

- Filter and date rows LTR/RTL.
- KPI/bar/status row order.
- CAPA target dates and uncertain-state controls.
- Notification unread dot and mark-read behavior.

## Open Notification Regression

The notification-centre badge test intermittently failed in one suite run and passed in isolation/final full-suite runs. This is an independent open regression concern. It must not be classified resolved by the green full run. Reproduction evidence and exact setup are preserved in existing Batch 11.1.2C reporting. No notification test or production code was changed in this inventory.

## Native-Device Validation Required

Essential later checks:

- Android I18nManager/native RTL restart behavior.
- Native stack headers and bottom/back affordances.
- Logical `marginStart/marginEnd` and `paddingStart/paddingEnd`.
- Horizontal ScrollView initial position and pill ordering.
- Arabic text expansion and 200% font scaling.
- TalkBack reading order and semantic traversal.
- Physical device clipping and touch targets.

## Inaccessible or Ambiguous Evidence

- No emulator or physical device was used.
- Native RTL behavior cannot be established from source/Jest.
- Some screen-owned layouts are inferred from StyleSheet/static JSX and should be confirmed at render-time.
- The master UI blueprint was not modified or reinterpreted as a design authority.

## Final Assessment

The shared foundation exists and selected primitives are migrated, but screen-level RTL coverage remains incomplete. The recommended next work is dependency-ordered and should start with shared primitives and navigation, followed by onboarding/workspace, clinical workflows, OH, and finally surveillance/CAPA/notifications.
