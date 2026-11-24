# SANAD Phase 2E.8 — UI/UX Audit and Migration Blueprint

**Verdict: ACCEPTED for the audit/blueprint scope.** This is a source-verified inventory and representative native audit, not application-wide visual acceptance. No production screen, dependency, navigation, or business-logic implementation was changed.

## Repository preservation

Preflight verified the authoritative checkout at `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`:

| Check | Result |
|---|---|
| Branch | `migration/aes-guardian` |
| HEAD | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` |
| HEAD tree / unstaged index tree | `983733927b18bf30b8377f84c9c1813c74c4bf6b` |
| `package-lock.json` SHA-256 | `D26A8FB77DB757189E26A38D784C4148DA599EB7E0A80EFCD081CA282483151B` |
| Pre-existing status paths | 325; exact status snapshot saved before inspection |
| Staged paths | 0 |

`@ui-kitten/components@6.2.1` and `@ui-kitten/eva@6.2.1` are installed; `react-native-svg@15.12.1` is unchanged. The Phase 2E.7B provider is present as `ThemeProvider > SanadUiKittenProvider > MainApp`. No other worktree or remote was accessed. The only Phase 2E.8 repository addition is this report; all 325 pre-existing status entries are preserved.

## Phase 2E.7B native notification regression

Used the already installed production debug APK on `emulator-5554` (package `com.sanad`, version `0.1.0`); this phase did not rebuild or install a different APK. The verified APK is 183,599,275 bytes, SHA-256 `FE0F3E7731A0F8A0BE3EDFECFC7D57061248627DF053C3137D332CEF09B71822`; its embedded bundle is 2,354,320 bytes, SHA-256 `2F371B0647912D557E65DFAF6E4DE7F9F4EC40EB62EA1FE3D7814DB16303818A`. The existing install's first-install time remained `2026-11-12 23:35:57`; app data was not cleared or uninstalled.

**Passed:** the exposed-professional demo path opened the populated notification centre and returned to the workspace in Arabic and English. The screen showed its localized title/content and one unread item; the directional back control returned to the workspace in both locales. A French view was also captured. No notification was opened or marked read. Arabic was restored in Profile & Settings and the app was left in the Arabic workspace. The demo remains synthetic and local.

Evidence folder (screenshots and corresponding UI hierarchy XML):

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E8-20261122-1105`

Relevant files: `notification-ar.png`, `notification-ar-back.png`, `notification-en.png`, `notification-en-back.png`, `notification-fr.png`, `workspace-ar-restored-final.png`, and `workspace-en.png`. The installed APK was previously verified to launch its embedded bundle without Metro; this regression confirms native navigation only, not every screen or role.

## Verified screen inventory

`AppNavigator.tsx` contains **46 registered product screen components**, plus three navigator shells (patient tabs, nurse tabs, and the nested nurse-patient stack). The separately registered `DesignSystemScreen` is a preview route and is not counted as production. The AES routes are included in each root auth/role branch; registration does not imply that every demo role is authorized to use each route. Role enforcement remains in the domain/repository layer as well as screen-level restricted states.

All AES screens use `AppText` for visible text and the existing SANAD/AES typography tokens; icons are routed through `AppIcon`/the Hugeicons registry. Localization uses the AES translation helpers, with row direction/text alignment applied where implemented. The table's state notes are source-level; only the routes called out in the visual-evidence section were inspected on the emulator.

In the AES tables, abbreviated `.../` source paths resolve under `src/features/aes-guardian/screens/`.

### AES Guardian entry and workspace

| Route / screen | Source | User / objective | Main action and important states / navigation |
|---|---|---|---|
| `aesSplash` — AES splash | `src/features/aes-guardian/screens/SplashScreen.tsx` | All demo users; enter or resume the AES prototype | Routes first-launch users to language selection and returning users to workspace; startup/first-launch state. |
| `aesLanguageSelect` — language selection | `.../LanguageSelectionScreen.tsx` | All users; choose FR, EN, or AR | Sets runtime locale, then opens welcome; selected-language state. |
| `aesWelcomeCarousel` — welcome | `.../WelcomeCarouselScreen.tsx` | Prospective demo user; understand the product | Advances/continues to disclaimer; page/progress state. |
| `aesDisclaimer` — prototype disclaimer | `.../PrototypeDisclaimerScreen.tsx` | Prospective demo user; understand synthetic-data boundaries | Continues to role picker; informational/read-only state. |
| `aesDemoPicker` — demo role picker | `.../DemoAccountPickerScreen.tsx` | Demo presenter; select one of five synthetic roles | Selects exposed professional, admin reviewer, occupational health, quality, or technical admin, then enters workspace; selected and role-specific description states. |
| `aesGuardianWorkspace` — main workspace | `.../AesGuardianWorkspaceScreen.tsx` | Five synthetic roles; find permitted work and role-specific status | Opens declaration, review, OH, surveillance, prevention, help, profile, or notification routes; role-specific modules/counts, loading/refresh/reset, alert and restricted-boundary content. Technical admin reset is guarded and confirmed. |

### AES declaration and administrative review

| Route / screen | Source | User / objective | Main action and important states / navigation |
|---|---|---|---|
| `declarations` — declaration list | `.../DeclarationListScreen.tsx` | Exposed professional (own declarations) or admin reviewer (reviewable declarations) | Filters five persisted statuses; opens details; exposed professional starts a declaration; admin reviewer has a review-queue shortcut. Loading, populated, filtered-empty, error, and restricted states. |
| `newDeclaration` — declaration form | `.../DeclarationFormScreen.tsx` | Exposed professional; create or edit an AES declaration | Validates and saves/submits, then routes to confirmation; field, validation, submitting, and failure states. |
| `declarationDetails` — declaration details | `.../DeclarationDetailsScreen.tsx` | Authorized workflow roles; inspect a declaration and next permitted action | Opens review action, correction response, coordination, or edit flow as role/status allows; loading/not-found/read-only/actionable states. |
| `submissionConfirmation` — submission confirmation | `.../SubmissionConfirmationScreen.tsx` | Exposed professional after submission | Shows the reference and returns to declarations; successful-submission state. |
| `adminReviewQueue` — administrative review queue | `.../AdminReviewQueueScreen.tsx` | Admin reviewer only | Opens a declaration's review action; loading, populated, empty/error, and restricted states. |
| `adminReviewAction` — review action | `.../AdminReviewActionScreen.tsx` | Admin reviewer only | Records the administrative outcome/correction request; decision and confirmation/error states, then returns to the review workflow. |
| `correctionResponse` — correction response | `.../CorrectionResponseScreen.tsx` | Exposed professional who owns the declaration | Enters and submits requested corrections; validation/submission and error states, linked back to declaration details. |

### Occupational-health coordination, surveillance, and prevention

| Route / screen | Source | User / objective | Main action and important states / navigation |
|---|---|---|---|
| `ohCoordinationQueue` — OH coordination queue | `.../OhCoordinationQueueScreen.tsx` | Occupational-health professional; find assigned coordination | Opens coordination detail; loading, populated, empty/error, and restricted states. |
| `ohCoordinationDetail` — coordination detail | `.../OhCoordinationDetailScreen.tsx` | Occupational-health professional; review referral and follow-up history | Acknowledge/record follow-up/complete as permitted; detail, history, status, loading/not-found/restricted states. |
| `createCoordination` — create coordination | `.../CreateCoordinationScreen.tsx` | Admin reviewer; initiate OH coordination from a declaration | Validates and creates a linked coordination; form, confirmation, and error states. |
| `recordFollowUpEvent` — follow-up event | `.../OhFollowUpEventScreen.tsx` | Occupational-health professional | Records an event against a coordination; form/validation/submission and error states. |
| `declarationCoordinationStatus` — declaration coordination status | `.../DeclarationCoordinationStatusScreen.tsx` | Authorized declaration workflow roles; check coordination progress | Read-only status/history, loading/error/not-found/restricted states. |
| `surveillanceDashboard` — surveillance dashboard | `.../SurveillanceDashboardScreen.tsx` | Quality, admin-review, and OH roles; view aggregate surveillance | Reads aggregate metrics; loading, populated/empty/error, and restricted states. Exposed professional and technical admin are excluded. |
| `preventionOverview` — prevention overview | `.../PreventionOverviewScreen.tsx` | Quality, admin-review, or OH roles; see prevention summary | Opens register or create action where permitted; aggregate loading/empty/error and restricted states. |
| `preventionRegister` — prevention action register | `.../PreventionActionRegisterScreen.tsx` | Quality staff (manage); admin-review/OH (read-only) | Filters/opens action details; quality staff may create; loading, populated, empty/error, read-only/restricted states. |
| `preventionCreate` — create prevention action | `.../PreventionActionCreateScreen.tsx` | Quality staff only | Validates and saves a CAPA action; form/submission/error and restricted states. |
| `preventionActionDetail` — prevention action detail | `.../PreventionActionDetailScreen.tsx` | Quality staff (manage); authorized aggregate viewers (read-only) | Reviews action and updates permitted status; loading/not-found/read-only/actionable states. |

### Notifications and supporting AES screens

| Route / screen | Source | User / objective | Main action and important states / navigation |
|---|---|---|---|
| `notificationCentre` — notification centre | `.../NotificationCentreScreen.tsx` | All operational demo roles except technical admin | Opens only resolver-authorized destinations; mark one/all read and pull to refresh. Loading, populated, empty, retry/error, processing, and technical-admin restricted states. |
| `aesGuardianProfile` — profile and settings | `.../AesGuardianProfileScreen.tsx` | All five synthetic roles | Switches role/locale, opens help/glossary, replays onboarding; two-step data reset is technical-admin only. Role capability, language, prototype/privacy, and reset states. |
| `helpGlossary` — help and glossary | `.../HelpGlossaryScreen.tsx` | All demo roles | Switches help/glossary sections and follows supporting links; content/read-only state. |

### Shared SANAD host application routes

These are registered in the same navigator but are not part of the AES demo workspace visual sample. Their inventory is source-verified; they were not visually audited in this phase.

Abbreviated `.../` source paths in this table resolve under the corresponding feature directory shown by the full paths (authentication, patient, nurse, or communication).

| Route / screen | Source | User / objective | Main action and important states / navigation |
|---|---|---|---|
| `splash` — host splash | `src/features/authentication/screens/SplashScreen.tsx` | All users; initialize session and route by auth/role | Waits for auth state, then routes to auth gate, patient tabs, or nurse tabs. |
| `authGate` — SANAD access welcome | `.../AuthGateScreen.tsx` | Unauthenticated users | Selects FR/EN/AR; opens access options. Localized and direction-aware. |
| `access` — access choices | `.../AccessScreen.tsx` | Unauthenticated users | Sign-in currently displays an availability notice; demo opens AES role picker. |
| `signIn` — login | `.../LoginScreen.tsx` | Existing account | Validates credentials and submits; validation/loading/auth error states. |
| `signUp` — registration | `.../RegisterScreen.tsx` | New patient account | Validates identity, credentials, terms, and submits; validation/loading/error states. |
| `forgotPassword` — password reset | `.../ForgotPasswordScreen.tsx` | Existing account | Requests reset and shows success/error state. |
| `patientHome` — patient home | `src/features/patient/screens/PatientHomeScreen.tsx` | Patient; view a sample daily health summary and shortcuts | Refreshes sample metrics and marks a medication taken; opens profile/monitoring. |
| `monitor` — daily monitoring | `src/features/monitoring/screens/MonitoringIntroScreen.tsx` | Patient; complete symptom/vital questionnaire | The registered screen itself owns intro, question, and result states and returns to patient home. |
| `messages` (patient) — patient conversation | `src/features/communication/screens/PatientMessagesScreen.tsx` | Patient; review/send a sample care-team message | Adds to an in-memory sample thread; composer/thread state. |
| `treatment` — treatment | `src/features/patient/screens/PatientTreatmentScreen.tsx` | Patient; review sample medicines and rehabilitation | Toggles sample medication taken state and views exercise content. |
| `profile` (patient) — patient profile | `.../PatientProfileScreen.tsx` | Patient; view profile/settings | Selects light/dark/system theme and settings/logout actions. |
| `nurseDashboard` — nurse dashboard | `src/features/nurse/screens/NurseDashboardScreen.tsx` | Nurse; triage worklist | Filters alerts/tasks/monitoring/needs-attention and refreshes; loading/summary/worklist state. |
| `patients` — assigned patients | `.../NursePatientsScreen.tsx` | Nurse; search/filter roster | Searches and filters to-review/followed patients; opens patient detail; loading/empty states. |
| `patientDetail` — nurse patient profile | `src/features/nurse/patients/screens/NursePatientProfileScreen.tsx` | Nurse; review assigned patient and timeline | Loads detail; loading, error/retry, not-found, populated states. |
| `alerts` — nurse alerts | `.../NurseAlertsScreen.tsx` | Nurse; review/acknowledge sample alerts | Filters severity and acknowledges; sample list and state changes. |
| `messages` (nurse) — patient messages | `src/features/communication/screens/NurseMessagesScreen.tsx` | Nurse; view sample conversations | Conversation rows render, but their current `onPress` is a no-op; no conversation route is registered here. |
| `profile` (nurse) — nurse profile | `src/features/nurse/screens/NurseProfileScreen.tsx` | Nurse; view settings | Selects theme and opens rules/design preview; other entries report upcoming availability. |
| `rules` — rule list | `src/features/nurse/rules/screens/RulesScreen.tsx` | Nurse; view/filter alert rules | Filters active rules, opens details; loading/error/empty/populated states. |
| `ruleDetail` — rule detail | `.../RuleDetailScreen.tsx` | Nurse; inspect/toggle a rule | Toggles enabled state and opens builder; not-found state. |
| `ruleBuilder` — rule builder | `.../RuleBuilderScreen.tsx` | Nurse; create/edit monitoring rule | Edits metric/condition/priority/action and saves after validation. |

**Inventory boundary:** `MonitoringQuestionScreen`, `MonitoringReviewScreen`, `MonitoringResultScreen`, and `MonitoringHistoryScreen` are imported by `AppNavigator.tsx` but are not registered as routes there; monitoring's registered tab screen contains its own flow. Other patient education, exercise, smoking, medication-detail, inhaler-education, and conversation files also exist under `src/features` but are not registered by this root navigator. They are not represented as production routes in this inventory. `DesignSystemScreen` is a preview, not a production screen.

## Visual evidence and findings

The production APK was inspected on the Android emulator (1220 × 2712 capture). **Six distinct registered screens** were visually checked: host auth gate, AES demo-role picker, AES workspace, AES profile/settings, AES declaration list, and AES notification centre. Arabic was observed on all six; French and English were also observed on workspace/profile/notification centre. This is representative coverage only; administrative review, declaration forms/details, OH, surveillance, prevention, and the other host-role routes were not visually inspected.

| Screen / evidence | Observed findings |
|---|---|
| Auth gate — `nav-carousel.png` | SANAD wordmark and green identity are recognizable; the Arabic entry screen is intentionally sparse with a large vertical gap. This is not a finding of broken layout, but the first-use path should be checked against smaller-height and text-scaled devices. |
| Demo role picker — `nav-step2.png`, `after-demo-ar.png` | Role descriptions are localized and selected state is clear. Its bright-white/near-black, rounded-card treatment differs from the warmer SANAD workspace; five options plus the bottom action make the view tall. |
| Workspace — `nav-workspace-ar.png`, `workspace-ar-restored-final.png`, `workspace-en.png`, `post-locale-fr-back.png` | Green brand, bilingual product identity, Arabic alignment, and permission boundary are strong. The long prototype warning and five-role horizontal selector precede the first permitted workflow module; the selector shows clipped next-role text without an explicit scroll cue. In Arabic, the synthetic display name remains French (`Professionnel Démo (Synthétique)`). |
| Profile/settings — `profile-ar-restored.png`, `profile-fr.png`, `profile-en-language.png` | Three-language selection and Arabic RTL order work in the captured state. The French screen visibly leaves “Visite guidée & Découverte (Onboarding)” in English. The page is long and composed of multiple outlined panels; keep group cards only where they clarify privacy, role boundaries, or settings. |
| Declaration list — `declarations-ar.png` | Status labels/filters are Arabic and numeric references/dates remain directionally readable. Populated sample circumstances remain French, so Arabic users see mixed-language content. Each row is a large white elevated card; five filters are thin pill targets and the vertically generous cards reduce scan density. |
| Notification centre — `notification-ar.png`, `notification-en.png`, `notification-fr.png` | Localized title/content, unread count, and directional item affordance are clear. A single populated row leaves most of the viewport blank; this is a density opportunity, not a broken empty state (a separate localized empty state exists in source). |

### Prioritized findings and design opportunities

| Priority | Finding | Impact | Effort | Regression risk | Evidence / qualification |
|---|---|---:|---:|---:|---|
| P1 | Incomplete localization: hard-coded role display name appears in Arabic; profile onboarding link is English in French; notification retry label is hard-coded French. Some seeded free-text examples also remain French in Arabic. | High | Low–Medium | Low | First three are source-visible localization defects; seeded free text may be intentionally authored content and needs a product decision, not automatic translation. |
| P1 | Declaration list hierarchy/density and filter target size need refinement. Current filter style is approximately 24 dp high from its text line plus 4 dp vertical padding and border, with no added hit slop. | High | Medium | Medium–High | Core workflow; preserve status semantics, owner scoping, admin shortcut, and route behavior. |
| P1 | AES screen tokens are a parallel static palette (`aesColors`/`aesTheme`) while `ThemeContext` is the canonical SANAD light/dark authority and the UI Kitten provider follows it. Several AES-native containers/buttons/badges still use fixed light tokens. | High / cross-cutting | Medium–High | High | Source-level architecture finding; dark appearance of all AES screens was not visually tested. Do not let a migrated Kitten control disagree with its neighboring SANAD surface. |
| P2 | Workspace puts a long synthetic-data banner and role switcher before the most-used permitted workflow; role selector clipping provides a weak horizontal-scroll affordance. | Medium–High | Medium | High | Actual Arabic/French/English workspace captures; role and permission contracts make this a sensitive redesign. |
| P2 | Visual language varies between AES entry/role-picker, warm workspace, and white list surfaces; repeated cards, rounded pills, and small elevations can make the product feel like several kits. | Medium | Medium | Medium | Consolidate around the existing SANAD green, warm canvas, editorial typography, and selective grouping; do not remove useful status semantics. |
| P3 | A sparse notification feed leaves large unused space with one item. | Low–Medium | Low | Low | Consider a tighter row/summary layout while retaining clear empty/loading/error states and touch affordances. |
| P3 | Host nurse conversation rows have a no-op `onPress`, and several source-only patient/monitoring screens are not registered. | Medium | Separate scope | Medium | Source-level host-app observations, not part of the AES first migration; do not fold into this phase's screen migration. |

### Visual system recommendations

- **Typography:** retain Young Serif for selective Latin display headings and Instrument Sans for interface/body text. Keep `AppText`/`AppTextInput` and the existing Arabic platform fallback; do not adopt UI Kitten default typography. Keep headings proportional rather than globally oversized, and verify long French/Arabic labels and system text scaling.
- **Color:** preserve SANAD's deep green identity (`#1B5E20` in AES tokens), the existing semantic status pairs, and the warm canvas. The token source documents AA-or-better contrast for its defined text/status pairs; this was not a full contrast audit of every rendered control. Use green deliberately for primary action and status, not decorative gradients or random icon color.
- **Spacing/surfaces:** continue the existing 4 dp base grid (4/8/12/16/24/32 dp); reduce repeated elevated cards in long lists and group only content with a meaningful relationship. Avoid adding new large radii/shadows. Keep separators and compact list rows where a card does not add context.
- **RTL/localization:** retain `useLayoutDirection`, row/text alignment helpers, directional `AppIcon` mappings, localized stack titles, and SANAD navigation back behavior. Arabic captures show right-aligned text and directional module/notification chevrons. Mixed hard-coded/demo strings still need correction. French/English LTR behavior was observed on representative routes, not every route.
- **Accessibility:** retain existing accessibility roles/labels and selected/disabled/busy states. Raise declaration filter controls to a reliably operable target (at least the existing 48 dp SANAD target) without changing their horizontal order or selection semantics. The full app was not run through TalkBack, large text, or automated native accessibility audits in this phase.

## Component adoption matrix

UI Kitten 6.2.1 declarations were inspected locally. Its public exports include `ApplicationProvider`, `Button`, `ButtonGroup`, `Input`, `Select`/`SelectItem`, `Card`, `List`/`ListItem`, `Modal`, `Divider`, `Spinner`, `TabView`/`Tab`, and `Text`. Eva 6.2.1 exports `mapping`, `light`, and `dark`; `EvaTheme` is defined by Eva token keys plus string-valued custom tokens. This confirms usable APIs without relying on a different major/minor version.

| Area | Decision | Recommendation |
|---|---|---|
| Buttons | **Wrap and customize** | Use UI Kitten `Button` selectively through a SANAD wrapper for consistent focus/pressed/disabled semantics and mapped green. Preserve `AppButton`/`AesButton` contracts and loading/accessibility behavior until that wrapper is proven; no generic replacement sweep. |
| Inputs and validation | **Wrap and customize** | UI Kitten `Input` offers label/caption/status; retain `AppTextInput` as the font/Arabic/React Native input authority. If adopted in a form, wrap it and test keyboard, validation, accessibility, and RTL before replacing a specific field. |
| Selectors / filters | **Keep or selectively adopt** | There is no dedicated chip export. Keep the existing filter model; a styled UI Kitten `Button` or `RadioGroup` may improve selected/focus states, but preserve horizontal scrolling, filter labels, and >=48 dp targets. |
| Cards and surfaces | **Keep SANAD-native** | `AppCard`, `AesCard`, and the AES status/domain tokens already express the brand. Use UI Kitten `Card` only behind an explicit SANAD style wrapper when it improves interaction/accessibility; do not add more card layers. |
| Lists and rows | **Wrap and customize** | `List` extends React Native `FlatList` props; `ListItem` supports custom children and press feedback. A wrapper is promising for the chosen declaration list, but retain virtualization, `AppText`, `AppIcon`, status badges, data scoping, and custom row hierarchy. |
| Tabs/navigation | **Keep SANAD-native** | React Navigation and `DirectionalStackBackButton` remain authoritative. Do not replace registered stacks or tab navigators with `TabView`/`BottomNavigation`. |
| Modals/confirmation | **Defer** | Preserve native confirmation/alert semantics for destructive workflows. Use UI Kitten `Modal` only if a concrete accessibility/interaction benefit is demonstrated. |
| Status badges | **Keep SANAD-native** | `AesStatusBadge` carries domain-specific declaration/OH/CAPA semantics and accessible labels; do not substitute a generic decorative badge. |
| Loading/empty/dividers | **Keep or wrap selectively** | Preserve existing state-specific empty/error content and `ActivityIndicator` behavior. `Spinner`/`Divider` are available, but adopt only through SANAD color/spacing wrappers and not for uniformity alone. |
| Typography/icons/brand | **Keep SANAD-native** | Keep `AppText`, `AppTextInput`, Young Serif, Instrument Sans, Arabic fallback, `AppIcon` Hugeicons registry, and `SanadLogo`. Do not add direct Hugeicons imports or use UI Kitten `Text` as a replacement. |

## Recommended first production migration

**Choose exactly one screen: `DeclarationListScreen`.**

It is a central AES workflow for exposed professionals and reviewers; it has real persisted data, five status filters, details routing, a create-declaration action, an admin-queue shortcut, empty/error/loading/restricted states, and a meaningful way to test list components. It offers more user and reuse value than migrating only the notification feed, while remaining a bounded single-screen presentation change. The risk is higher than a role-neutral utility because list authorization and data ownership must remain unchanged; that is why the slice is valuable evidence rather than a purely cosmetic demo.

### Controlled migration plan

1. Keep the existing `DeclarationListScreen` data loader, `matchesFilter`, status mapping, `useDemoRoleStore` role gate, repository call, navigation targets, and test IDs as behavior owners. Do not move authorization into component visibility or the UI Kitten layer.
2. Prototype UI Kitten `List`/`ListItem` for the virtualized rows and UI Kitten `Button` only for filter/action controls that benefit from focus/pressed/selected states. There is no chip component; keep a compact horizontal filter bar with explicit selected accessibility state and >=48 dp targets.
3. Keep `AesScreenHeader`, `AppText`, `AppIcon`, `AesStatusBadge`, `AesScreenContainer`/SANAD layout conventions, and role-specific shortcuts. Make UI Kitten content use the existing SANAD semantic theme adapter; do not add a second theme state or let Eva defaults replace brand tokens.
4. Reduce row height and elevation through hierarchy/spacing, not by hiding status/date/type content. Keep reference/date direction predictable in RTL; distinguish user-authored circumstances from translated interface labels.
5. Before acceptance, add focused real-component tests and a native demo walkthrough for exposed-professional and admin-reviewer roles in FR/EN/AR. Prove filter behavior, ownership/role boundaries, read-only/restricted states, navigation/back, loading/error/empty states, accessibility selected labels/targets, text scaling, and unchanged persisted values. Include a same-state screenshot comparison; do not expand to another screen in that phase.
6. Resolve the light/dark token seam for this screen before shipping any mixed UI Kitten/SANAD surface. `ThemeContext` remains the only runtime theme authority. This is a consistency requirement, not authorization for a broad dark-mode redesign.

## Proposed next phase and deferrals

**Next implementation phase: SANAD Phase 2E.9 — Controlled Declaration List Migration.** Scope it to `DeclarationListScreen` and its minimal SANAD wrapper/tests only; obtain a native visual/behavior acceptance for exposed-professional and admin-reviewer paths before selecting another screen.

Defer broad workspace redesign, admin/OH/surveillance/prevention migration, host patient/nurse redesign, navigation restructuring, data/permission changes, new features, icon/font replacement, global dark-mode work, and global localization cleanup. File the observed hard-coded strings and host-route gaps as separate bounded work; do not use the first migration to silently change them.

## Files changed in Phase 2E.8

- Added `docs/SANAD_PHASE2E8_UI_UX_AUDIT_AND_MIGRATION_BLUEPRINT.md` only.
- No production source, tests, package manifests/lockfile, navigation, database, or native files were changed.
- Screenshots and UI hierarchy dumps remain outside the repository in the evidence folder above.
