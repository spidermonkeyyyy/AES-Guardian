# SANAD Dashboard Design-System Audit and Native Integration Blueprint

**Audit date:** 2026-11-25  
**Scope:** Read-only source, repository, theme, navigation, role, and data-layer audit. This report is an implementation blueprint only.

## 1. Executive recommendation

Use the supplied dashboard as a reference for information hierarchy, compact summaries, grouped panels, filters, and readable chart labeling—not as a theme, component library, data model, or screen map. The original is a browser-only ATLAS commerce demo with hard-coded sample data, web-specific styling and interactions, and a remote background image. None of its labels, records, metrics, export behavior, visual palette, or route structure belongs in SANAD.

Build on SANAD's existing navigation, `ThemeContext`, `AppText`, `AppIcon`, `AesCard`, `AesScreenHeader`, `AesStatusBadge`, SQLite repository methods, and role guards. Start with role-specific summaries in the existing `aesGuardianWorkspace`, then refine the existing `surveillanceDashboard` and `preventionOverview`. Keep the present routes and role boundaries. Use static, accessible, Views-based aggregate bars initially; do not add a chart, blur, or animation dependency. Keep glass treatment subtle and limited to summary surfaces.

The supplied light and dark palette values exactly match the live `src/theme/tokens/colors.ts` theme. However, AES-specific `aesColors` is a second, static palette with materially different light colors, and active screens use it directly. The workspace also contains two hard-coded badge colors. Theme-token reconciliation—especially dark mode on surveillance and prevention—is the clearest prerequisite for a consistent dashboard.

**No dashboard or application source implementation was started.** No build, test suite, APK installation, dependency operation, Git staging, commit, branch operation, or remote operation was performed. This report is the only file created by this audit.

## 2. Fresh repository baseline and preservation record

Baseline was captured before investigation using `git status --short --branch --untracked-files=all`, `git branch --show-current`, `git rev-parse HEAD`, and `git rev-parse --abbrev-ref --symbolic-full-name '@{u}'`.

| Item | Initial value |
|---|---|
| Branch | `migration/aes-guardian` |
| HEAD | `7817d7428467ddcfc5cf8718116d8fda15181e84` |
| Upstream | `origin/migration/aes-guardian` |
| Index | No staged paths |
| Working tree | Already contained tracked modifications/deletions and untracked user work |

Pre-existing tracked paths included:

- Generated Android/Gradle state: `android/.gradle/8.11.1/{executionHistory/executionHistory.bin,executionHistory/executionHistory.lock,fileHashes/fileHashes.bin,fileHashes/fileHashes.lock,fileHashes/resourceHashesCache.bin}`, `android/.gradle/buildOutputCleanup/{buildOutputCleanup.lock,outputFiles.bin}`, and `android/.gradle/file-system.probe`.
- Generated `android/compat/build/` artifacts, including modified class/JAR/AAR/merge outputs and build logs, plus deletions of generated `ReactPointerEventsView` and Kotlin metadata/class outputs.
- Existing source/test work: `src/features/aes-guardian/__tests__/declaration-list-migration.test.tsx`, `src/features/aes-guardian/__tests__/workspace-screen.test.tsx`, `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`, `src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx`, `src/features/aes-guardian/screens/DeclarationListScreen.tsx`, `src/localization/index.ts`, and `src/navigation/AppNavigator.tsx`.

Pre-existing untracked paths included:

- `android/compat-pointer-events/build/`
- `docs/SANAD_ARABIC_RTL_REMEDIATION_AND_GLOBAL_DEVICE_VERIFICATION_REPORT.md`
- `docs/SANAD_LIQUID_GLASS_NAVIGATION_INTEGRATION_REPORT.md`
- `docs/screenshots/SANAD_ARABIC_RTL_REMEDIATION/`
- `docs/screenshots/SANAD_LIQUID_GLASS_NAVIGATION_INTEGRATION/`
- `src/localization/demoNarratives.ts`
- `src/navigation/AesGuardianTabNavigator.tsx`
- `src/navigation/LiquidGlassNavigation.tsx`
- `src/navigation/__tests__/AesGuardianTabNavigator.test.tsx`
- `src/navigation/__tests__/LiquidGlassNavigation.test.tsx`

These are preserved as existing work; this audit did not stage, revert, clean, regenerate, or otherwise alter them. The initial `docs` inventory did not contain the requested blueprint filename, so the exact requested report path was available without overwriting an existing report.

Repository structure inspected included the React Native entry point (`App.tsx`), `src/components`, `src/core`, `src/features/aes-guardian`, `src/localization`, `src/navigation`, `src/services`, and `src/theme`, plus the existing `docs` inventory. The current native navigation files and relevant application screens were read directly from the worktree.

## 3. Supplied dashboard source analysis

The complete `C:\Users\User\Downloads\GlassyDashboard.tsx` source was inspected: **74,061 bytes, 1,352 lines**. The complete `C:\Users\User\Downloads\demo.tsx` was inspected: **43 lines**. A Downloads filename search found one dashboard source file; dashboard styles, data, charts, navigation, dialogs, and interactions are embedded in that file rather than supplied as separate dashboard modules.

### Transferable design ideas

- **Command-center hierarchy:** a clear page title and supporting description, a compact summary area, then larger task or analytics panels. Important work is visually grouped instead of presented as one undifferentiated feed.
- **Metric cards:** concise label, prominent value, optional context, and restrained icon. The card hierarchy is reusable; the commerce values and trend-change semantics are not.
- **Charts with legends and labels:** chart color is paired with textual labels and values. Data points expose a selected readout rather than relying solely on color.
- **Operational organization:** filters precede the filtered content; empty results have an explicit message; status is written as well as color-coded.
- **Responsive composition:** desktop changes from a side dock and multi-column content to a bottom dock and stacked content at narrower breakpoints.
- **Interaction discipline:** an active navigation item is explicit, controls have selected states, dialogs have titles and close actions, and reduced-motion behavior is provided.
- **Surface layering:** a restrained border/rim, highlight, and elevation distinguish groups. This can be translated to native themed surfaces without copying web blur.

### Reference-specific content and technical mechanisms to reject

- **Commerce/business demo:** “ATLAS”, revenue, USD, orders, subscribers, traffic/device mix, refunds, automation capacity, Shopify/Stripe/HubSpot, fictional staff/owners, and the supplied sample work/activity records are hard-coded. They are not SANAD metrics and must not enter production or demo screens.
- **Four reference views:** Command Center, Trends, Metrics, and Premium Operations are not SANAD routes. They must not be added as competing navigation destinations.
- **Fictional data operations:** status changes, CSV exports, local notification/read state, work-item dialogs, and trend-period controls act on in-memory sample data. They are not backed by a SANAD repository or authorization flow.
- **Web-only runtime:** the component uses React DOM elements, CSS-in-JS text and media queries, browser `window`/`location`/history/hash events, `ResizeObserver`, `HTMLDialogElement`, DOM queries and measurements, browser focus/hover behavior, `Blob`, `URL.createObjectURL`, browser downloads, inline web SVG, CSS `backdrop-filter`, and GSAP/`@gsap/react`. These are not importable into the React Native screens.
- **Reference styling:** the source defines its own warm brown/coral/teal/ochre palette, dark brown palette, remote Unsplash photo, gradient background, and a purple/cyan orb. That appearance is not the SANAD palette. Montserrat/Merriweather are not used in the dashboard source itself; it imports Manrope Variable. None of these fonts should replace the app's font architecture.

The source includes four view definitions, a responsive side/bottom dock, a local-theme toggle, a notifications dialog, a view-search dialog, an operational detail dialog, a searchable/filterable activity table, static metrics, line/stack/donut SVG charts, a work board, and CSV creation. Its spring-like dock is a CSS size/transform transition, not the previous Liquid Glass navbar's spring. GSAP sequences view fading/blur, entrance transitions, chart drawing, bar/ring reveal, progress fill, and animated counters. The reduced-motion preference disables/reduces motion; reduced transparency/high contrast/forced-colors remove some visual effects.

### Native translation

| Reference concept | SANAD-native mapping |
|---|---|
| Glass panel, card rim and highlight | Use `AesCard` with SANAD theme surfaces, border and existing elevation. If an opt-in dashboard treatment is approved, make it an `AesCard` variant or a thin wrapper over it; do not create an independent surface/theme system. No true backdrop blur is currently installed. |
| Multi-column dashboard and mobile stacking | React Native `View`/`ScrollView` layouts measured with `useWindowDimensions`; use flexible columns/wrapping and stack on compact width. Preserve existing screen safe-area and nested tab behavior. |
| SVG line/bar/donut charts | Prefer existing accessible native `View` bars for the current aggregate metrics. `react-native-svg` is installed if a future plot genuinely needs SVG; no chart package exists. Supply text labels, values, and an accessible equivalent. |
| GSAP timelines/counters | Reanimated is already present and used by the native navigation. Any future transition should be finite, restrained, and reduced-motion aware. Static numbers are preferred for clinical/operational counts. |
| Browser menus, docks, dialogs, search | Keep SANAD's React Navigation routes, native controls, `FlatList`, and existing notification/navigation flows. Do not introduce web-style hash routing or competing dashboard navigation. |
| Remote scene image | Do not use it. It is an unnecessary network dependency and conflicts with SANAD's offline-first, clinical visual tone. |

## 4. Verified SANAD theme, tokens, and design-system architecture

### Canonical theme mapping

`src/theme/tokens/colors.ts` is the live source of the supplied semantic palette. Every listed background/card/foreground, primary, secondary, muted, accent, border/input, destructive, sidebar, and chart color matches the user-provided light and dark values exactly. `lightTheme.radius` is `8`; `shapes.card` is also `8`, matching a base radius of `0.5rem` at a 16 px CSS root.

`ThemeProvider` uses Android's `useColorScheme()` when in `system` mode and supplies `colors`, `theme`, `isDark`, and mode setters through `ThemeContext`. `App.tsx` wraps the application in `ThemeProvider` and `SanadUiKittenProvider`; the latter maps the same live colors into Eva/UI Kitten. The shown theme mode is in-memory and defaults to `system`; it is not persisted by `ThemeContext`. Dashboard code should consume that provider rather than add the reference's separate local theme toggle.

### Verified discrepancies requiring reconciliation

| Area | Worktree evidence | Blueprint implication |
|---|---|---|
| Second AES palette | `src/theme/tokens/aesColors.ts` defines a separate, static palette: canvas `#F8F9FA`, surface `#FFFFFF`, subdued surface `#F1F3F4`, text `#212121`/`#616161`, black primary action `#121212`, plus separate banner and status colors. Those values do not match the canonical ivory/brown/green theme. | Do not introduce more static colors. New dashboards must use `useTheme().colors`; reconcile existing AES palette usage within the separately approved scope. Keep semantic status colors distinct from brand colors. |
| Existing dashboard screens | `SurveillanceDashboardScreen` imports `aesColors` throughout its cards, chart bars, filters, labels and `StatusBar`; it destructures `themeColors` from `useTheme` but the screen styling shown uses the static palette and forces `dark-content`. `PreventionOverviewScreen` likewise uses static `aesColors` in its banners, metrics, cards and status text. | Both priority analytics screens need explicit light/dark verification and theme-token migration before they can be described as fully dark-mode aware. This is existing source behavior, not a change made during the audit. |
| Workspace badges | The existing role-specific workspace module uses `#6366F1` and `#10B981` badge colors. | Replace neither with reference colors; future approved dashboard styling should route these through existing SANAD semantic tokens. |
| Corner radii | Global `shapes.card` is `8`; AES `aesRadii.card` and `aesRadii.container` are `16`. The reusable `AesCard` uses `aesRadii.card`. | Preserve the adopted AES card geometry where it already exists; do not globally restyle all cards to force the CSS reference's base radius. Decide whether the 8 px base token is for controls while cards remain 16 px. |
| Status colors in dark mode | `AesStatusBadge` uses the static AES status maps in light mode and theme-derived semantic colors in dark mode. | Reuse the existing status component; do not add a duplicate badge. Verify contrast and semantic distinction on both modes when theme reconciliation is approved. |

### Shared components, typography, and icons

- `AppText` resolves foreground tone with `ThemeContext`, selects typography by locale, and supports variants/roles. `AppTextInput` similarly uses the live theme and locale-aware body font. Existing AES screens use these shared components extensively.
- The app font architecture is IBM Plex Sans for French/English interface text, IBM Plex Sans Arabic for Arabic, and Readex Pro for section/card/subheadings. `fontFamilies.ts`, `aesTypography.ts`, and the UI Kitten mapping encode this. The reference's Manrope import and any CSS Montserrat/Merriweather proposal do not apply.
- `AppIcon` is the shared Hugeicons-backed registry, supports semantic names, common sizes, accessibility labels, theme colors and directional icon resolution. Dashboard visuals must use it; do not import Lucide or inline SVG icons.
- `AppCard` is a general theme-aware card; feature screens use `AesCard`, which has theme-aware card fill/border and shared AES radii/shadows. `AesScreenContainer`, `AesScreenHeader`, `AesButton`, and `AesStatusBadge` already cover screen framing, title hierarchy, actions, and statuses.
- `aesTheme`/`aesColors` are separate AES-specific token exports. Although some comments call this foundation isolated, current screens consume it alongside `ThemeContext`; it is not safe to treat it as the sole live theme.

## 5. Current navigation, localization, and data architecture

### Navigation and permissions

`AppNavigator` is a native stack with onboarding/access screens outside the workspace. It retains secondary workflow routes for declarations, review, correction, OH coordination, prevention, help, profile and notifications. The workspace route hosts `AesGuardianTabNavigator`; the role-filtered `LiquidGlassNavigation` remains the real bottom tab bar. Dashboard work should not add another navigator or replace that stack.

Current primary route mapping, from `getPrimaryDestinations` and `src/core/auth/boundaries.ts`:

| Role | Home | Declare | Follow-up | Prevention | Profile |
|---|---|---|---|---|---|
| `exposed_professional` | Workspace | Declaration form | Own declarations | Not available | Profile |
| `admin_reviewer` | Workspace | Not available | Administrative review queue | Read-only prevention register | Profile |
| `oh_professional` | Workspace | Not available | OH coordination queue | Read-only prevention register | Profile |
| `quality_staff` | Workspace | Not available | Aggregate surveillance dashboard | Prevention overview | Profile |
| `tech_admin` | Workspace | Not available | Not available | Not available | Profile |

The role store is an in-memory synthetic demonstration store. Its UI checks are not a substitute for repository authorization; database methods enforce their own role checks. Future dashboard queries must use the active global `useDemoRoleStore` context and repository guards, not local role substitutes or dashboard-only permissions.

### Localization, RTL, and accessibility

`src/localization/index.ts` supports French, English, and Arabic, exposes locale/translation/layout-direction helpers, and is initialized by `App.tsx`. `AppText`, `AppIcon`, current navigation, and AES screen components already provide locale-aware fonts, directional icons, row direction and text alignment. New dashboard labels, date descriptions, chart summaries, no-data/loading/error states, filters, and accessibility labels must be translated in all three locales. Arabic charts must preserve readable numeric axes while mirroring visual sequence and labels correctly; nondirectional icons remain unmirrored.

`spacing.minTouchTarget` is 48 dp. Existing controls use `accessibilityRole`, labels and selected/disabled states. The native tab bar already uses Reanimated's `useReducedMotion`, `useWindowDimensions`, and safe-area insets. Keep values and chart descriptions available to screen readers; do not communicate status only through color or animation. Dashboard content must scroll within the current navigation/safe-area layout and must not cover the bottom bar, forms, keyboard, or focus targets.

### Data flow and offline behavior

`App.tsx` initializes the local SQLite database. Screens obtain the existing `AesGuardianDatabase` through `getDatabase()` and generally load with local `useEffect`/`useCallback` state, focus listeners, pull-to-refresh, and explicit loading/error/empty states. The `@tanstack/react-query` package is installed, but these audited dashboard/queue screens use the repository directly rather than query hooks. No new dashboard network call is justified. Keep reads local and offline-first, clear/replace stale role data when identity changes, and surface repository failures rather than showing fabricated or success-shaped values.

## 6. Reusable component recommendations

Recommendations are intentionally limited to primitives that serve more than one of the three high-priority screens. Do not create a component for every visual in the web demo.

### Theme-aware dashboard surface

- **Purpose/reuse:** group dashboard summaries and analytic sections consistently on workspace, surveillance and prevention overview.
- **Existing capability/action:** `AesCard` already provides a theme-aware fill, border, elevation, press state and selected treatment. Reuse it first; if a restrained glass variant proves necessary, extend it as an opt-in treatment or wrap it once. Do not create `GlassPanel` and `GlassCard` as separate overlapping primitives.
- **Native approach/tokens:** use `colors.card`, `colors.border`, `colors.accent` or `colors.secondary`, and existing `aesRadii`/`aesShadows`. A faint highlight/rim may be derived from live tokens. Keep the principal text area opaque enough to remain readable. No backdrop blur is available.
- **Localization/accessibility:** surface has no hard-coded content; children use localized `AppText`/`AppIcon`. A surface is not itself a button unless a real action exists; preserve logical screen-reader grouping.
- **Data/performance:** presentation-only. Avoid repeated alpha gradients, large shadows, and nested translucent layers on scrollable lists.

### Dashboard section heading

- **Purpose/reuse:** introduce sections such as current status, trends, or next steps with an optional action.
- **Existing capability/action:** `AesScreenHeader` already handles page-level titles, overlines, subtitles, back navigation and actions. Reuse it for page titles. A small `SectionHeader` is a candidate only if its pattern is repeated across the three dashboards; otherwise compose `AppText` locally.
- **Native approach/tokens:** `View` plus `AppText` title/subtitle and optional existing button, using Readex Pro heading roles, theme foreground/muted text, and spacing tokens.
- **Localization/accessibility:** all text/actions localized; RTL-aware alignment/order; retain a clear heading hierarchy and accessible action name.
- **Data/performance:** no data dependency; no animation required.

### Dashboard metric card

- **Purpose/reuse:** display one truthful count with its localized description and optional existing semantic icon; suitable for workspace summary and aggregate dashboards.
- **Existing capability/action:** the screens have bespoke metric-card layouts but no shared metric card. Create one small typed presentation component only after data contracts below are confirmed; build on `AesCard`, `AppText`, and `AppIcon`.
- **Native approach/tokens:** use `colors.card`, `colors.foreground`, `colors.mutedForeground`, existing semantic status tokens, AES spacing and radii. Do not invent a bright success gradient or a new metric palette.
- **Localization/accessibility:** locale-aware label/date/value formatting; label and number form one understandable accessibility element or a clearly grouped pair. Do not suppress font scaling or animate the number.
- **Data/performance:** input is a scalar with an explicit source/meaning/loading/error state. The component must not compute clinical or role-sensitive metrics.

### Responsive dashboard layout

- **Purpose/reuse:** keep cards legible across compact and large Android widths without horizontal clipping.
- **Existing capability/action:** no common dashboard grid is present. Use `useWindowDimensions` and simple flex-wrap/column styles initially; extract a `DashboardGrid` only if actual screen reuse warrants it.
- **Native approach/tokens:** choose one, two, or wider columns by available width and content; stack on narrow widths; use existing spacing tokens. The existing workspace and analytics screens already scroll.
- **Localization/accessibility:** widths must tolerate Arabic strings, large font scaling and RTL. Preserve visual and screen-reader reading order.
- **Data/performance:** presentation-only; avoid measuring every card or storing a second copy of navigation state.

### Aggregate distribution bars and legend

- **Purpose/reuse:** show existing monthly/category/status aggregates with a label and numeric value.
- **Existing capability/action:** `SurveillanceDashboardScreen` already renders monthly, exposure and status distributions with native `View` tracks and values. Reuse/refactor this pattern rather than importing a chart framework. A small shared `DistributionBars`/legend is optional if workspace or prevention has a real second use.
- **Native approach/tokens:** native rows/`View` fills based on the provided denominator and existing chart/status semantic colors. `react-native-svg` is installed for a future genuine line plot, but is unnecessary for current horizontal bars.
- **Localization/accessibility:** label each series and point; expose value and category, not just colored width. Provide a text/table equivalent for screen readers. RTL reverses layout while preserving the meaning/order of time values.
- **Data/performance:** only aggregate arrays from `getSurveillanceDashboardMetrics` or approved prevention aggregates. Show an explicit no-data message; do not render fabricated zeros as records. Avoid SVG nodes, animated loops, and expensive shadows for every point.

### Status badge

- **Purpose/reuse:** show existing declaration, OH, or CAPA workflow status.
- **Existing capability/action:** `AesStatusBadge` is the established domain-aware badge; reuse it and reconcile its colors to the canonical theme as an approved token task. Do not introduce `StatusBadge` as a parallel implementation.
- **Native approach/tokens:** use its domain semantics and themed dark behavior, with text labels and borders; never repurpose chart colors as statuses.
- **Localization/accessibility:** existing status translations and accessible text label should remain; verify Arabic and contrast in both themes.
- **Data/performance:** status is from persisted enum values. No derived risk/severity or “overdue” badge without a validated domain rule.

### Filters and period controls

- **Purpose/reuse:** narrow authorized aggregates in surveillance and existing CAPA list filters.
- **Existing capability/action:** surveillance already has status, incident-type, start-date and end-date controls; prevention register already has status/type/contributing-factor filters. Reuse and theme-align these controls. Do not add a generic `PeriodSelector` until a second screen has a supported date-range query.
- **Native approach/tokens:** existing `Pressable`/`ScrollView` chips and `AppTextInput`; any date presets must map to actual repository `startDate`/`endDate` semantics.
- **Localization/accessibility:** translated control names, selected state, RTL order and 48 dp touch target; date fields should remain directionally readable.
- **Data/performance:** surveillance dates filter `incident_date`; CAPA currently has no date filter. A UI period toggle without query support is misleading.

### Empty, loading and error states

- **Purpose/reuse:** make offline/no-result/failure states clear on every dashboard section.
- **Existing capability/action:** existing screens already have `ActivityIndicator`, explicit retry/error states, and no-data messages. Reuse and normalize their behavior; defer a new `EmptyState` component unless cross-screen repetition remains after implementation.
- **Native approach/tokens:** existing `AppText`, `AppIcon`, `AesCard` and retry `AesButton`; distinguish no records from unavailable/error data.
- **Localization/accessibility:** translated title, body and retry labels; use a live/status announcement for asynchronous completion where appropriate.
- **Data/performance:** clear old role data before reload and never substitute sample values or silently turn repository errors into zero.

### Patterns not recommended for initial integration

- **AnimatedCounter:** no operational need; animation can make numeric values feel unstable and complicate reduced-motion/accessibility. Use a static count.
- **ActivityTimeline/ActivityFeed/NotificationPanel:** no generic feed source exists. Reuse the current authorized queue or recipient-scoped `NotificationCentreScreen`; do not combine events from unrelated role domains.
- **DetailSheet/confirmation dialog:** keep secondary details and workflow actions on their existing root-stack screens and confirmation patterns. A new bottom-sheet dependency is unjustified.
- **LoadingSkeleton:** current loading states exist; do not add a skeleton system without evidence that loading time and layout stability warrant it.
- **CSV export:** not recommended. There is no dashboard export contract, and the reference export is hard-coded commerce data. Any future export needs explicit role, field, privacy, locale, offline/file-storage, and audit approval.

## 7. Screen-by-screen integration matrix

| Screen | Reference patterns worth using | Keep unchanged | Glass level and workflow reason |
|---|---|---|---|
| `aesGuardianWorkspace` | Role-specific metric cards, one clear “next action” group, compact notification/count summaries, responsive sections. | SANAD identity, prototype disclaimer, existing role selector, role-specific module routes, help/profile/notification actions, role boundaries and existing DB reads. Do not create another navigation model. | **Moderate, limited to summary cards.** Makes the role's next authorized task scannable while preserving this screen as the existing hub. |
| `surveillanceDashboard` | Existing aggregate KPI hierarchy, date/status/type filters, monthly/category bars, textual labels/values and clear empty states. | Aggregate-only contract, current authorized roles, filter meaning, retry/error behavior, status and incident terminology, no identifiers/narratives. | **Moderate, most visible on analytics panels only.** Improves comparison without weakening clinical-data separation. |
| `preventionOverview` | Total/status summary cards, simple category grouping and clear routes to register/create. | Current status counts, disclaimer, empty/retry states, read-only roles, create action only for quality staff. | **Moderate, restrained.** Makes status distribution and next permitted action easier to scan; no new risk score or date trend. |
| `declarations` | Filter-bar clarity, status badge/value hierarchy, explicit empty state. | Owner-only results for exposed professionals, admin-only all-declaration list, persisted statuses, existing queue shortcut. | **Minimal.** A list and task route, not a metrics dashboard; identifiable declarations must remain readable. |
| `adminReviewQueue` | Compact status summary and clear filters above the queue. | Admin-only authorization, allowed review states, privacy/data-minimization rules, current item-to-action navigation. | **Minimal.** Keep review records and action controls direct, neutral and readable. |
| `ohCoordinationQueue` | Status-grouped counts and filter state, if derived from the currently authorized queue. | OH-only access, allowed coordination states and data-minimized queue projection; do not add staff-performance or overdue signals. | **Minimal.** Operational queue clarity matters more than decoration. |
| `preventionRegister` | Existing status/type/factor filter groups, status badges and action-list hierarchy. | Role read/write distinction, create button only for quality staff, action details and CAPA lifecycle. | **Restrained.** Reuse clean surfaces, not analytics chrome on every row. |
| `notificationCentre` | Unread grouping, clear timestamp/title hierarchy, explicit empty state. | Recipient-only data, verified notification navigation, mark-read sequencing, tech-admin restriction. | **Minimal.** Keep notifications actionable and free of cross-role aggregation. |
| `helpGlossary` | Search/filter controls and collapsible sections are already present. | Offline localized guide/glossary, academic disclaimer, FR/EN/AR content. | **Minimal / none.** Educational text benefits from a calm opaque reading surface. |
| `declarationDetails` | Clear summary hierarchy and workflow-status grouping only. | Five existing tabs, scoped projections, review history and clinical detail visibility. | **Minimal.** Clinical data and labels need maximum contrast and predictable reading order. |
| `adminReviewAction` | Small status/context header only. | Admin-only review decision, correction-reason validation, audit and lifecycle behavior. | **None/minimal.** Action-first form; avoid visual effects near consequential decisions. |
| `correctionResponse` | A concise status/context heading only. | Owner-only correction response, existing free-text form, submission/validation semantics. | **None.** Form clarity and trust take precedence. |
| `ohCoordinationDetail` | Status heading and existing history grouping. | OH authorization, detail projection, record/acknowledgement transitions and clinical handling. | **None/minimal.** Avoid glass behind potentially sensitive workflow information. |
| `createCoordination` | Group related form fields with ordinary themed cards if already used. | Admin-only initiation, required declaration link, existing data contract. | **None.** Preserve direct form completion. |
| `recordFollowUpEvent` | Clear step/status context only. | OH-only event capture, allowed event categories, date/note semantics and resulting lifecycle transition. | **None.** No added charts or “progress” interpretation. |
| `declarationCoordinationStatus` | Readable summary and status badge. | Current scoped status projection and authorization. | **Minimal.** A status view, not a dashboard. |
| `preventionActionDetail` | Existing status summary and audit-history chronology. | CAPA permission, audit history, transition confirmation and lifecycle rules. | **Minimal.** Use normal theme cards; never animate or obscure status history. |
| `preventionCreate` | Grouped inputs and existing validation/error presentation. | Quality-only creation, required fields and workflow semantics. | **None.** Maintain readable form controls and keyboard behavior. |
| `newDeclaration` | Existing step progress and concise recap in its final step. | Five-step AES workflow, auto-save, attestation, validation, privacy and offline persistence. | **None.** This is a clinical declaration form; no glass treatment or analytics embellishment. |
| `submissionConfirmation` | A clear completion summary and one obvious next action. | Existing submitted reference and navigation behavior. | **Minimal.** Static confirmation, not a gamified celebration. |
| `aesGuardianProfile` | Grouped settings/capability sections. | Synthetic identity disclaimer, role switching, language selection, capability restrictions and gated two-step demo reset. | **Restrained ordinary cards only.** Do not add dashboards or duplicate theme toggles. |

## 8. Role-specific dashboard design and information boundaries

| Role | Appropriate dashboard content using current data | Strict exclusions and implementation guard |
|---|---|---|
| `exposed_professional` | Their own declaration count/status and correction-needed next step; their own unread notification count. Existing `getDeclarations` is owner-scoped. | No aggregate surveillance, other professionals' records, reviewer queue, CAPA register, or shared counts. `getDeclarations` defaults to 100 rows, so the current workspace-derived total is not an exact unbounded count. |
| `admin_reviewer` | Pending review queue summary; aggregate surveillance indicators; authorized workflow actions can remain linked to the existing review queue/details. | Do not place clinical narratives or identifiable rows in a cross-role summary. `getReviewQueue` defaults to 100, so its list-derived count can be capped. Keep actual identifiable review content behind existing admin routes/guards. |
| `oh_professional` | Authorized coordination status counts/milestones and permitted aggregate OH/surveillance summary. `listOhCoordinationsQueue` validates the role and supports current active/completed modes. | No administrative review actions, declaration-wide identity list, new event/clinical content on an overview, or staff performance/overdue inference. The current queue SQL returns reference and creator fields; dashboard summaries should consume counts, not display those fields. |
| `quality_staff` | De-identified surveillance metrics and prevention status totals; existing prevention-management route remains available. | No declaration identifiers, names, references, narratives, clinical details, or reviewer/OH actions. Do not make a chart that decomposes sensitive groups beyond existing aggregates without approval. |
| `tech_admin` | Technical configuration/schema version and, only if approved and implemented, non-clinical local-system diagnostics. Current workspace reads the maximum SQLite schema version. | No clinical, declaration, surveillance, review, OH or CAPA data. No clinical-authority actions. Current code does not provide a general system-health dashboard query; do not invent one. |

Use the global active context on entry and every role change. Clear the previous role's counts before a new asynchronous load; ignore late responses from the previous identity. Keep repository authorization in place even when a dashboard hides a control.

## 9. Data and analytics feasibility matrix

| Metric or chart candidate | Existing source and availability | Role/privacy and filters | Empty state and query requirement |
|---|---|---|---|
| Exposed professional: own declarations and correction-needed count | Workspace calls `getDeclarations({ userId, requestingUserId })` and counts statuses in memory. | Repository enforces owner scoping. No date filter on this method. | Zero is a valid no-record state. Default `limit` is 100; exact totals beyond 100 require a new role-checked `COUNT`/aggregate query or an explicit cap treatment. |
| Admin: review queue count by workflow status | `getReviewQueue` provides reviewable records and optional single-status filter. Workspace and queue currently request the default limit. | `admin_reviewer` only. No date-range parameter. | Empty queue is valid. Default limit is 100, so list length is not guaranteed to be an exact count; add a role-checked count query if an unbounded total is required. |
| OH: active/completed coordination counts | `listOhCoordinationsQueue` is OH-only; it can include completed states. Queue records are returned, not a dedicated aggregate. | `oh_professional` only. Current API has no date range or user-assignment filter. | Empty state is valid. Count in memory from the already authorized list for small current datasets; SQL aggregation is a future query if scale or exactness requires it. Do not expose its reference/creator fields in a dashboard card. |
| Surveillance totals/status/exposure/temporal distributions | `getSurveillanceDashboardMetrics` already returns de-identified declaration counts, monthly distributions, exposure and status breakdowns, review outcomes, correction counts/responses, OH statuses/events and filter summary. | Repository permits `quality_staff`, `admin_reviewer`, and `oh_professional`; rejects exposed and tech roles. Filters support status, incident type, start date and end date; date axis is based on `incident_date`. | Existing zero/empty arrays should remain explicit. No new query is needed for these existing shapes. Current implementation selects compact raw columns and performs filtering/grouping/linking in JavaScript over all matched tables, rather than issuing SQL aggregate queries; assess this only against expected scale, preserving the existing output/privacy contract. |
| Prevention total/status distribution | `getPreventionOverview` calls authorized `listPreventionActions` and counts proposed/in-progress/completed/cancelled. | Quality, admin reviewer and OH may read; quality alone may manage. Existing list filters are status, action type and contributing factor, but the overview itself is all-time. | Zero total is an explicit current state. No new query for current totals; a date-based trend/period control needs a new, authorized data-layer contract. |
| Prevention distributions by type/factor | `listPreventionActions` can filter by type/factor but returns action records. | Same three authorized roles; quality manages actions. | Do not use full action rows as an unreviewed chart source. A new aggregate query is preferable if this chart is approved; define data minimization and small-cell policy first. |
| Unread notification count | `getUnreadNotificationCount(userId)` is an indexed recipient-specific `COUNT`; current workspace reads it. | Non-tech recipient only; DB method returns zero for tech admin. | Exact zero is supported. No new query. Keep notification details in the existing centre and resolve navigation through its verified resolver. |
| Technical database/schema status | Workspace queries `MAX(version)` from `schema_versions` for `tech_admin`. | Technical-only, no clinical payload. | Missing schema result should remain an explicit unavailable state. There is no current general health/uptime/performance metrics API; additional diagnostics require separate approval. |

Do not copy the reference's revenue, volume, device, throughput, growth, SLA, or margin metrics. Do not invent incidence rates per employee/unit, response-time percentiles, overdue counts, clinical risk scores, prevalence, or trend deltas; current denominators, validated definitions, or date semantics may not exist. A rate or percentage needs a documented denominator and cohort definition. Exact small counts filtered by rare incident/date categories can still be identifying; no minimum-cell suppression policy was found in the inspected code, so do not increase granularity without institutional/privacy approval.

## 10. Native feasibility, performance, and quality

| Concern | Current verified state | Blueprint |
|---|---|---|
| React Native stack | React Native `0.76.9`, React `18.3.1`, React Navigation bottom-tabs `6.6.1`, native-stack `6.11.0`, UI Kitten `6.2.1`, Hugeicons React Native `1.0.17` / free icons `4.4.0`. | Use existing APIs and app patterns. No second design system or browser wrapper. |
| Animation | Reanimated `3.19.5` is installed and used by `LiquidGlassNavigation` and an existing breathing animation; the navigation uses `useReducedMotion`, shared values, and finite spring movement. | Static-first dashboard. If a data transition is necessary, use a short finite Reanimated transition and static fallback; no ambient loop, counter animation, GSAP or timer. |
| Charts | `react-native-svg` `15.12.1` is installed; no Victory/Chart Kit/other chart library or existing SVG chart component was found. `SurveillanceDashboardScreen` already uses native View-based bars. | Use Views for existing aggregate rows first. SVG is technically available for a future plotted series, but would need explicit selection, screen-reader, RTL and low-end device tests. Do not add a dependency in this phase. |
| Glass/blur | No `BlurView`, Expo blur package, or native blur integration was found. The reference uses CSS backdrop blur/saturation, gradients, and a remote photographic backdrop. | Approximate with modest theme-aware fill/rim/highlight/elevation on selected cards. Avoid large translucent overlays over clinical text. Do not add blur dependencies without separate approval and Android performance testing. |
| Layout and safe area | `LiquidGlassNavigation` uses `useWindowDimensions` and `useSafeAreaInsets`; app navigation is nested and hides the tab bar for the keyboard. `AesScreenContainer` uses React Native `SafeAreaView` and scrollable content. | Keep dashboard content inside current screen/scroll container; do not position another bottom dock. Test compact widths, keyboard, font scale and RTL before expanding. |
| Offline/data access | Local SQLite is initialized at app startup; audited screens use `getDatabase()` and local async loads. | Keep render driven by repository results and explicit loading/error/empty states. No URL image, remote analytics, sample value or CSV Blob. |
| Performance | Surveillance aggregation currently loads compact rows and groups them in JavaScript; prevention overview loads the full prevention action list then counts it. | For current demo scale, preserve these contracts. If data volume warrants SQL aggregation, separately scope and test a role-checked query; do not add loops/animations or expensive per-card blur. |
| Accessibility | Existing shared text/icon and 48 dp target tokens; existing dashboard filters/status controls provide translated selected states. | Preserve screen-reader labels/state/value, adequate contrast, text scaling, visible numeric labels, reduced-motion behavior and touch area. Charts cannot encode meaning by color alone. |

## 11. Localization, RTL, accessibility, offline-first, and dark mode requirements

1. Put every new dashboard label, status description, period/filter value, date range, empty/loading/error message, and accessibility phrase in the existing FR/EN/AR localization system.
2. Use `AppText`, locale-aware `AppTextInput`, and `AppIcon` with Hugeicons. Do not add Lucide icons, custom SVG icon components, or a web-font dependency.
3. Use current `useLayoutDirection`/`getLayoutRowDirection`/`getLayoutTextAlign` helpers. Mirror chart row composition and chronological display intentionally; keep numbers, dates, and nondirectional icons readable.
4. Bind every surface/text/border/icon to `ThemeContext` semantic colors. Do not use literal CSS colors or a separate theme toggle. Validate both actual app palettes, especially existing static AES palette paths.
5. Keep static status fully visible when reduced motion is enabled. Do not animate counts, charts or navigation continuously.
6. Expose chart name, series, category and value to accessibility services; provide text equivalents. Use `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, and `accessibilityValue` where semantically correct.
7. Respect `allowFontScaling`, narrow screens and long Arabic strings. Avoid hidden default labels and clipped metrics.
8. Use local repository data only; preserve SQLite/offline behavior, query errors, refresh semantics, user scoping, and existing workflow routes.

## 12. Proposed implementation phases — not started

1. **Theme/data contract gate:** confirm the canonical palette source, resolve the `aesColors`/global-token scope, choose exact count behavior for capped own/review lists, and agree whether low cell counts need suppression. No new visual feature should mask these semantics.
2. **Shared summary primitives:** implement only an opt-in themed dashboard surface (if `AesCard` is insufficient), a typed metric card, and a responsive layout helper only where at least two screens benefit. Reuse existing `AppText`, `AppIcon`, status badge and screen header.
3. **Workspace first:** add role-specific summaries and next permitted action to existing `aesGuardianWorkspace`; use only the authorized current data-source rows above. Keep existing role selector, disclaimer, role modules, secondary navigation and notification routing.
4. **Surveillance refinement:** theme-align existing cards/filters/bars, retain the current aggregate return type and privacy boundary, expose truthful date semantics, and add accessible chart labels. Consider SQL aggregation only in a separately authorized data-layer change if scale requires it.
5. **Prevention overview refinement:** theme-align existing status totals, empty/error states and actions. Add no time trend, new CAPA dimensions, or role capability.
6. **Selective operational polish:** consider shared surface/heading use in queue/register/notification pages only after the priority screens are accepted; keep form, detail and review screens minimal.
7. **Acceptance validation:** run role/source tests, translation/RTL and theme tests, offline/error/empty tests, typecheck/lint and targeted Android verification only after implementation is separately approved. Validate no workflow or persisted-data changes.

## 13. Future implementation acceptance criteria

- The existing navigation graph, routes, role guards and secondary workflow relationships remain intact.
- Every displayed number has an identified existing repository source, correct role authorization, valid unit/date semantics, correct empty/error behavior, and no silent cap ambiguity.
- Exposed professionals see only their own data; quality sees de-identified aggregates and prevention content only; technical administration sees technical data only; OH/admin access remains within current boundaries.
- No name, reference, narrative, or raw clinical row is moved into an aggregate dashboard card or chart. No sample reference metric is used.
- All three locales render without clipping; Arabic RTL ordering and readable dates/numbers are verified.
- The light and dark theme use current theme context colors and fonts. No new hard-coded palette, external font, local theme state or unapproved visual token system is introduced.
- Hugeicons render through `AppIcon`; text scaling, 48 dp controls, screen-reader chart equivalents and selected states work.
- Reduced-motion mode retains a complete static view; no continuous animation, WebGL, DOM, WebView or expensive blur is introduced.
- Compact and large Android widths, safe area, scroll, bottom navigation, keyboard, and back navigation remain usable.
- The app remains offline-first and all errors, loading, zero-data and filtered-empty results are distinguishable.
- No schema, workflow lifecycle, auth/permission, notification, CAPA, audit or business data is changed as a side effect of visual work.

## 14. Risks, unknowns, and approval decisions

- **Theme source of truth:** the supplied colors match `colors.ts`, while many AES screens consume the divergent `aesColors`. Decide whether dashboard implementation should migrate only the three priority screens or whether broader AES theme reconciliation is a distinct task.
- **Exact totals:** current exposed and admin list-derived workspace counts use repository methods with default 100-row limits. Decide whether to show a deliberate capped label or authorize a role-checked aggregate-count query before presenting them as totals.
- **Analytics scale:** surveillance and CAPA summaries group/list records in JavaScript. Expected record volume and whether SQL aggregation is needed are unknown; changing query shape is a separate data-layer decision.
- **Small-cell privacy:** current surveillance returns aggregate categories but no suppression threshold was found. Date/status/incident filters can create narrow cohorts; confirm institutional minimum-cell policy before increasing displayed detail.
- **Dashboard scope:** recommendation is to enhance existing workspace/surveillance/prevention routes, not add four new ATLAS-style views, routes, tabs or workflow steps. Confirm this when authorizing implementation.
- **Glass level:** no native blur exists. Confirm whether the restrained token-based surface approximation is acceptable; adding a blur dependency requires separate approval and low-end Android validation.
- **Theme preference persistence:** current theme defaults to system and manual mode is in-memory. If durable user preference is required, it is outside this dashboard-only blueprint.
- **Technical dashboard:** current tech-admin data is limited to schema version and existing maintenance controls. Any broader system-health dashboard requires a separately defined non-clinical diagnostics source.
- **Verification environment:** this audit ran no tests, builds, emulator interactions, accessibility service or performance profile, by design. None is claimed as verified here.

## 15. Audit boundary and final preservation status

This phase ended after source inspection and creation of this blueprint. The reference files were read only. Application source, navigation, permissions, theme, database, dependencies, lockfiles, generated Android files, demo data, screenshots, and all pre-existing work were not edited or discarded. No staging, commit, branch switch, remote change, build, install, test run, or data operation occurred.

The only audit-produced path is:

`docs/SANAD_DASHBOARD_DESIGN_SYSTEM_AUDIT_AND_INTEGRATION_BLUEPRINT.md`

Implementation remains unstarted and requires separate explicit authorization.
