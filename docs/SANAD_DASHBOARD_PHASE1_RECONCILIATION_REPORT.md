# SANAD Dashboard — Phase 1 Reconciliation Audit

**Audit date:** 2026-11-25  
**Mode:** Read-only source reconciliation; no build, install, database operation, or runtime/device acceptance performed.

## 1. Executive verdict

The supplied `C:\Users\User\Downloads\files dashboard.zip` was accessible. It contains `SanadWorkspaceDashboard.tsx`, `sampleWorkspaceFixtures.ts`, and `SANAD_PORT_MAP.md` at the ZIP root. The comparison used these exact files, not another repository copy.

The current SANAD Phase 1 workspace already implements its core role-specific summary cards, qualified values, localized loading/error/retry states, stale-request protection, and role-specific route actions. The ZIP component is a generic presentation reference, not a missing production workspace implementation; importing it would duplicate Phase 1 and introduce a parallel component, palette, and workflow surface.

The strongest follow-up opportunity is a focused visual/accessibility reconciliation of the existing surveillance and prevention screens: migrate their static `aesColors` styling to the canonical live `ThemeContext` tokens, remove the surveillance screen's fixed light status bar override, and preserve the existing SQLite aggregates, authorization boundaries, filters, and routes. The ZIP's chart, queue, search, and modal primitives should not be imported wholesale.

## 2. Phase 1 baseline

### Role content and next actions

`src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx:164–247, 449–605` loads the active role's data and conditionally renders its summary and next action:

| Role | Current Phase 1 workspace summary | Existing next action / boundary |
|---|---|---|
| `exposed_professional` | Own declarations and correction-request count from the latest loaded declaration list; recipient-scoped unread notifications | Opens the existing declarations workflow and changes the label to correction requests when such items are present. No other professionals' records are shown. |
| `admin_reviewer` | Loaded review queue item count and recipient-scoped unread notifications | Opens the existing review queue; no record details or clinical narratives are placed in summary cards. |
| `oh_professional` | Active coordination queue count and recipient-scoped unread notifications | Opens the existing OH coordination queue; no creator/reference, overdue, performance, or risk inference is added. |
| `quality_staff` | Authorized de-identified surveillance total, prevention-action total, and recipient-scoped unread notifications | Opens the existing aggregate surveillance route. The summary contains no identifiable declaration data. |
| `tech_admin` | Existing SQLite engine and schema version only | No clinical or operational summary/action is shown. |

`getDeclarations` and `getReviewQueue` are explicitly called with `limit: 100`; their counts are localized as loaded/recent records, not global totals (`src/localization/index.ts:1308–1331, 2097–2120, 2888–2911`). The quality and technical values use existing local database sources; no new query, schema, or aggregate was added in Phase 1.

### Presentation, request handling, localization, and navigation

- `DashboardMetricCard.tsx:12–87` is already the typed metric primitive: it uses `AesCard`, `AppText`, `AppIcon`, `useTheme()`, `useLocale()`, `useLayoutDirection()`, theme colors, locale-aware number formatting, RTL alignment, and a combined accessibility label. The workspace reuses it across role metrics.
- The workspace shows localized loading, repository-error/retry, and success states (`AesGuardianWorkspaceScreen.tsx:449–484`). Its request counter invalidates older requests on role/user changes and screen blur, and the rendered data is guarded by an identity key (`:164–275`).
- FR/EN/AR dashboard labels are present. The workspace's layout helper currently derives RTL with `locale === 'ar'` (`:821–826`); the metric card uses the shared layout-direction hook.
- The workspace keeps its existing SANAD name/brand, disclaimer, role selector, module routes, scenario roadmap, and notification/help/profile actions. It uses a scrollable surface and pull-to-refresh (`:310–325`); this screen itself does not wrap its root in `AesScreenContainer`/`SafeAreaView`. The existing Liquid Glass bottom navigation is a separate navigation layer and was not changed.
- A source-level accessibility follow-up remains: workspace role pills have a visual selected style but no `accessibilityState.selected`, and their style does not set a 48 dp minimum height (`:400–420, 957–975`). Header action buttons are 36×36 (`:859–869`). These are code observations, not device accessibility findings.
- The ZIP's generic summary card accessibility-label pattern is already represented by `DashboardMetricCard`; it does not justify a duplicate metric component.

## 3. Translated dashboard comparison

The supplied `SanadWorkspaceDashboard.tsx` is prop-driven and presentation-only by its own contract (`:1–160`), but it is not wired to SANAD repositories or translations. Its port map explicitly marks values as fixtures/reference-only and documents that the caller must supply real data (`SANAD_PORT_MAP.md`, especially its fixture, revenue, automation-capacity, and work-queue entries). The fixture file is commerce-oriented demonstration data, not a SANAD source (`sampleWorkspaceFixtures.ts:1–end`).

| Feature | Classification | Evidence and reconciliation |
|---|---|---|
| Header and summary composition | **Already implemented** | The reference composes brand, optional search/theme/notification controls, title, and a summary grid (`SanadWorkspaceDashboard.tsx:469–580`). SANAD already has its branded header, persistent prototype notice, role selector, notification/help/profile actions, and role-aware summaries (`AesGuardianWorkspaceScreen.tsx:328–605`). Retain SANAD's version; do not add another theme toggle, search header, or notification surface. |
| Metric cards and qualifiers | **Already implemented** | Reference `SummaryCard` supports caption, truthful scope qualifier, and a combined accessibility label (`:194–207`). `DashboardMetricCard` already provides the equivalent themed, localized, RTL-aware SANAD primitive; workspace localization discloses the 100-item cap. Retain and use the existing component. |
| Stacked bars | **Reusable improvement, narrowly** | Reference `StackedBars` provides a compact chart composition and accessible per-bar label (`:224–248`). Surveillance already has real temporal and category distributions rendered as single-series horizontal bars (`SurveillanceDashboardScreen.tsx:586–633`). The current repository does not return a month-by-status cross-tab, so a temporal stacked chart cannot be truthfully derived from existing output. Keep current data shape; only adapt a chart presentation if a supported aggregate warrants it. |
| Filters | **Already implemented in domain screens; not applicable to workspace** | Reference chips filter only the in-memory props passed to it (`:252–267, 300–315, 345–367`). Surveillance has repository-backed status, incident-type, start-date, and end-date filters (`SurveillanceDashboardScreen.tsx:120–147, 387–550`; database types `:484–489`). The prevention register supports status, action type, and contributing-factor filters (`PreventionActionRegisterScreen.tsx:121–143`; repository `AesGuardianDatabase.ts:3521–3560`). Do not add a duplicate filter workflow to the workspace or overview. |
| Grouped work queues | **Not applicable to the workspace; preserve existing workflows** | Reference `WorkQueue` groups caller-provided items by its generic status vocabulary and filters locally (`SanadWorkspaceDashboard.tsx:300–343`). SANAD already routes each role to its dedicated review, OH, or prevention workflow. Generic queue fields include title, description, source, owner, and ID (`:58–76`); they are not safe to populate casually with clinical or identifiable records. Do not duplicate queues or infer a new status mapping. |
| Search and activity | **Missing from this component, but not a Phase 1 gap** | Reference activity search normalizes accents and filters only caller-provided items (`:345–385`); its search sheet searches only supplied view descriptors (`:390–415`). The workspace already has a notification destination and existing module routes. The reference does not supply an authorized SANAD event-search source; do not import sample activity or build a duplicate feed/search surface. |
| Notifications | **Already implemented; reference behavior is not equivalent** | Reference notifications are derived from queue items with status `needsReview` (`:504–507, 573–578`), not SANAD's recipient-scoped unread notification count. The current workspace already reads the real scoped count. Keep the SANAD source and notification route; do not substitute the reference count/sheet. |
| Modals and detail interactions | **Not applicable / reject** | Reference uses generic work-item detail, source/owner/reference fields, and a modal action (`:441–467`). SANAD has authorized detail screens and workflow routes; detail data belongs there, not in generic summary modals. The port map also records that the original "mark reviewed" behavior was local-only and needed replacing with a real route. |
| Loading and empty states | **Already implemented in SANAD; reference is incomplete for data loading** | The reference has empty queue/activity/chart messages (`:227, 317, 381, 410, 434`) but no repository loading/error/request lifecycle. Phase 1 already has loading, error/retry, empty-versus-error data behavior, and stale-request protection. Retain the current implementation. |
| Safe area, scrolling, keyboard | **Reusable caution, not a direct improvement** | Reference uses one `ScrollView` with bottom padding (`:510–565, 583–585`) and modal sheets, but no `SafeAreaView` wrapper or explicit keyboard-avoidance behavior in the source. It should not replace SANAD screen containers or be represented as device-verified. |
| Accessibility and touch targets | **Reusable detail; adapt to SANAD standards** | Reference exposes summary labels, selected chip state, queue/bar labels, and modal semantics (`:194–207, 236, 252–267, 390–467`). But its primary buttons, chips/search inputs, and modal close control use 44 dp dimensions (`:596, 621, 631, 640`), below SANAD's requested 48 dp minimum; it also uses native `Text`/`TextInput`, not `AppText`/`AppTextInput`. Adapt semantics only where a current SANAD control needs them, with existing shared components and at least 48 dp targets. |
| RTL, localization, typography | **Reusable only as a typed data-shape idea; do not import as-is** | Reference accepts labels and colors as props and comments that native layout handles RTL (`:1–17, 119–160`), but does not use SANAD's localization hooks, `AppText`, IBM Plex Sans/Arabic, or Readex Pro. Some row layouts are fixed `row`; no Arabic runtime evidence is supplied. Continue using the current SANAD localization/direction and typography architecture. |
| Period selector, export, background image, animations | **Not applicable / reject** | Periods and export are callback props, not backed by a SANAD query or export implementation (`:127–143, 523–540`). A background-image prop conflicts with the need to keep bundled, offline assets and preserve the SANAD surface. No new animation is needed. The port map itself rejects commerce, hardcoded, web-only, and unsupported figures. |

**Do not import:** `sampleWorkspaceFixtures.ts` values or generated status mappings; revenue, costs, orders, subscribers, traffic/device splits, churn, capacity, open-ticket, or automation figures; generic queue owner/source/reference details; the component's parallel `DashboardColors` palette/inline styles; standalone native typography; theme toggle; search/notifications/detail modals; export/period controls; remote/image-background treatment; web-only routing, GSAP, or animation code. The reference's reusable ideas are presentation details only, not a replacement screen or new workflow.

## 4. Surveillance dashboard gap analysis

### Current authorized aggregate source

`getSurveillanceDashboardMetrics` is the actual source (`src/core/database/AesGuardianDatabase.ts:2305–2534`; result contract `src/core/database/types.ts:484–540`). It rejects `tech_admin` and `exposed_professional` and authorizes `quality_staff`, `admin_reviewer`, and `oh_professional`. Its returned shape contains only aggregate values:

- Declaration total and counts by lifecycle status.
- Monthly declaration counts, incident-type counts, and status distribution.
- Active/completed OH coordination counts.
- Administrative review total, outcome distribution, correction-request and correction-response counts.
- OH coordination status and follow-up event-category distributions.
- Filter total/matching declaration counts.

The repository queries local SQLite rows, applies optional status, incident-type, and date bounds to the declaration set, then derives linked review/OH aggregates from that set. There is no 100-row cap in this aggregate path. Internal IDs are used to link data; the returned result contains counts/distributions, not identifiers, names, references, narratives, or clinical fields. No extra metric, trend, rate, target, risk score, or overdue/performance value is supported by this source.

### Current screen and gaps

`SurveillanceDashboardScreen.tsx:120–165, 387–550` exposes the repository-backed filters: declaration status, incident type, start date, and end date. Date inputs are passed only when their trimmed length is 10; the screen does not visibly validate calendar format or ensure start precedes end. Existing filter semantics and local query source should be retained; do not invent period presets or cross-tab chart values.

The screen already presents exact overview counts, horizontal temporal/category bars, status distributions, and administrative/OH distributions (`:558–705`). It uses localization and shared RTL helpers (`:83–108, 321–329`), `AppText`, `AppTextInput`, `AppIcon`, `AesCard`, `AesButton`, and `AesStatusBadge`. Filter pills expose labels/selected state and have 48 dp minimum height (`:387–515, 723–875`); date fields have labels and 48 dp height (`:520–548, 866–875`). Category labels and numeric values are text, so color is not the only signal. Source-level opportunities are stronger screen-reader summaries for the distribution/chart rows and explicit selected-state semantics for any other interactive controls; no TalkBack or font-scale conclusion is made.

**Theme defect:** the screen calls `useTheme()` at `:83` but does not use the resulting `themeColors`; visual styles throughout use `aesColors` (`:43, 210–242, 256–331, 343–705, 723–988`). The static token set is divergent from the canonical live theme: for example `aesColors.canvas` is `#F8F9FA`, `surfaceSubdued` is `#F1F3F4`, and `primaryAction` is `#121212` (`src/theme/tokens/aesColors.ts:47–58, 102`), rather than the SANAD warm background/green primary in `src/theme/tokens/colors.ts`. The screen also mounts fixed `StatusBar` elements with `dark-content` and the static canvas color in unauthorized, loading, error, and success branches (`SurveillanceDashboardScreen.tsx:254–256, 280–282, 293–295, 329–331`), overriding the live light/dark behavior already provided by `AesScreenContainer`. This is a source-level theme inconsistency; device appearance has not been tested.

The filter section and KPI grid use horizontal scroll/wrapping and the page is inside `AesScreenContainer`, which provides safe-area, scroll, and theme-aware status-bar behavior. Fixed KPI/card widths and Arabic text at compact widths still need visual testing.

## 5. Prevention dashboard gap analysis

`PreventionOverviewScreen.tsx:70–120, 206–291` uses `canViewPreventionActions`/`canManagePreventionActions`, fetches the overview and an authorized aggregate declaration total, and only exposes the create-action route when `canManage` permits it. The prevention repository prohibits `exposed_professional` and `tech_admin`, and permits `quality_staff`, `admin_reviewer`, and `oh_professional` (`AesGuardianDatabase.ts:3515–3544, 3627–3650`). The overview displays total actions and counts in the existing `proposed`, `in_progress`, `completed`, and `cancelled` statuses (`PreventionOverviewScreen.tsx:206–270`). It does not show names, references, descriptions, rationale, or completion notes.

`getPreventionOverview` calls `listPreventionActions(userId)` without filters and counts the complete returned local register; the repository query has no limit (`AesGuardianDatabase.ts:3521–3560, 3633–3650`). The overview therefore reflects actual current register counts, not a capped list estimate. The register itself supports status, action type, and contributing-factor filters in both its screen and repository (`PreventionActionRegisterScreen.tsx:121–143`; repository `:3546–3560`). `PreventionOverview` has no action-type/factor breakdown, and the overview screen itself exposes no filters. Retain the existing register as the place to filter rather than duplicating its workflow in the overview.

The overview also calls `getSurveillanceDashboardMetrics` to display total declarations (`PreventionOverviewScreen.tsx:98–108, 233–239`). This is a supported authorized aggregate, but it couples prevention loading/success to a second surveillance query and the declaration KPI is not a prevention-action count; any future scope change should treat this as a product/content decision, not silently remove or relabel it.

The screen uses localization and RTL helpers, `AesScreenContainer`, shared `AesScreenHeader`, `AesCard`, `AesStatusBadge`, and `AesButton`; the container already sets status-bar style from live theme. However, the screen's own status values, labels, warnings, error states, and borders are styled through static `aesColors` (`:18–25, 151–191, 206–270, 310–390`). The status badge and card internals use shared theme-aware components, but the surrounding static text/accent colors can disagree with the canonical dark palette. Migrate only those styles to live theme tokens; do not extend the static palette. The view and create buttons use the shared 48 dp `AesButton`; the action row wraps. Source inspection cannot establish compact-width clipping or Arabic visual quality.

Loading, error/retry, successful empty state, request-version invalidation, and role-context checks already exist (`:76–120, 140–203`). The screen does not require new business statuses or invented CAPA indicators.

## 6. Reuse / integration decision matrix

| Candidate | Existing SANAD equivalent | Recommendation | Reason |
|---|---|---|---|
| Metric cards | `DashboardMetricCard` and role-specific workspace metrics | **Retain / reuse** | Already theme-aware, localized, RTL-aware, accessible, and scope-qualified. Do not add the ZIP's duplicate `SummaryCard`. |
| Stacked bars | Surveillance's monthly, exposure, and status aggregates rendered as horizontal bars | **Adapt only if data supports it** | Existing data supports single-series distributions; it does not support a month-by-status stack or trend. No new aggregate in this audit. |
| Filters | Surveillance status/exposure/date filters; prevention register status/type/factor filters | **Retain** | Both are backed by existing local repository contracts. Keep them on their existing screens; do not add period presets or duplicate overview filters. |
| Grouped queues | Existing admin review, OH coordination, and prevention register screens/routes | **Reject for workspace** | Prevents workflow duplication and accidental exposure of identifiers, owners, references, or narratives. |
| Search/activity | Existing notification center and module destinations | **Defer / do not import** | ZIP patterns search only caller-supplied preview data; there is no equivalent authorized activity/search source wired into the component. |
| Modals/details | Existing authorized detail and workflow routes | **Reject** | Generic detail modals duplicate workflow surfaces and expose generic owner/source/reference fields. |
| Header / notifications | SANAD brand, role context, existing notification count and routes | **Retain** | Existing notification count is recipient-scoped and semantically different from the ZIP's count of `needsReview` queue items. |
| Loading/empty/retry | Workspace and domain screens' current state handling | **Retain / refine only for identified issues** | Phase 1 already handles loading/error/retry and stale requests; ZIP's generic view has no repository lifecycle. |
| Accessibility patterns | `AppText`, `AppIcon`, shared buttons/badges, existing accessible metric card | **Adapt selectively** | Preserve accessible labels/state semantics, but use SANAD components and at least 48 dp controls; reference controls are 44 dp. |
| Color, typography, and theme props | Canonical `ThemeContext`, `colors.ts`, IBM Plex Sans/Arabic, Readex Pro | **Reject parallel system; migrate existing screens** | ZIP's arbitrary color prop and native `Text` styling are not the live SANAD theme/typography architecture. |
| Background image, period/export, animation | None required for current offline-first data/workflows | **Reject** | No supported period/export source in this scope; remote/commerce visuals, web APIs, and animation add risk without a SANAD need. |

## 7. Recommended next implementation phase

After explicit authorization, make the next phase a **bounded surveillance/prevention theme and accessibility reconciliation**, not a generic dashboard import:

1. Replace static `aesColors` screen-level styling in `SurveillanceDashboardScreen` and `PreventionOverviewScreen` with the existing live `useTheme()` tokens and existing shared components. Keep the canonical palette and typography; add no palette, dependency, or provider.
2. Remove the surveillance screen's redundant fixed `StatusBar` overrides and rely on `AesScreenContainer`'s existing light/dark-aware behavior.
3. Keep all existing SQLite query results, role authorization, data minimization, status definitions, filters, and destinations unchanged. Use prevention filters only in the existing register; do not add unsupported dashboard breakdowns or synthetic metrics.
4. Add focused source-level tests for theme values, authorized/unauthorized rendering, accessibility labels/state, and current filter/empty/error behavior; perform device checks only if specifically authorized and safe.

No Phase 2 source work has been started.

## 8. Limitations and unverified items

- This is a source and ZIP-content audit. No Jest tests were run, and no build, install, database query, emulator interaction, or manual screen inspection was performed.
- Existing test source was inspected as coverage evidence only: `workspace-screen.test.tsx` covers role-scoped metrics, capped-list qualification, errors/retry, FR/EN/AR, light/dark tokens, and RTL; `surveillance-dashboard.test.ts` covers aggregate calculations, supported filters, authorization, and absence of identifying/free-text result fields; `prevention-action-register-ui.test.tsx` covers status rendering, filter parameters, role access, FR/EN/AR, RTL, and 48 dp controls. These observations are not test-run results.
- Light/dark runtime rendering, FR/EN/AR visual wrapping, RTL row order, compact/large widths, keyboard overlap, TalkBack, font scaling, and actual touch behavior remain unverified.
- The ZIP code and port map are reference artifacts; the port map describes original-source elements, but the original `GlassyDashboard.tsx` was not needed for this reconciliation and was not substituted for the three requested ZIP files.
- The audit does not claim that generic search, activity, period selection, export, or chart cross-tabs have a valid SANAD source. Such behavior must not be inferred from `sampleWorkspaceFixtures.ts`.

## 9. Git state before and after

| State | Before inspection | After report creation |
|---|---|---|
| Branch / HEAD | `migration/aes-guardian` / `493037e` | Unchanged |
| Staged paths | 0 | 0 |
| Modified/deleted tracked status entries | 36 | 36 |
| Untracked status entries (`git status --short`, directories collapsed) | 13 | 14 |
| Total short-status entries | 49 | 50 |
| Exact reconciliation report path | Absent | Added as untracked: `docs/SANAD_DASHBOARD_PHASE1_RECONCILIATION_REPORT.md` |

Before the audit, modified tracked paths included 27 generated Android/Gradle outputs and nine source/test paths: `src/features/aes-guardian/__tests__/declaration-list-migration.test.tsx`, `workspace-screen.test.tsx`, `components/index.ts`, `src/features/aes-guardian/index.ts`, `screens/AesGuardianWorkspaceScreen.tsx`, `screens/DeclarationDetailsScreen.tsx`, `screens/DeclarationListScreen.tsx`, `src/localization/index.ts`, and `src/navigation/AppNavigator.tsx`. Existing untracked work included the Android compatibility build output, three prior reports plus the Phase 1 report, two screenshot directories, `DashboardMetricCard.tsx`, and five other localization/navigation files. All were preserved. `SurveillanceDashboardScreen.tsx`, `PreventionOverviewScreen.tsx`, theme tokens, and the new metric card were not edited during this audit.

## 10. Read-only confirmation

No application/source/test/configuration file was modified. No user file, generated output, screenshot, prior report, fixture, or ZIP entry was overwritten or deleted. The only repository file created by this audit is this report. No files were staged; no commit, push, fetch, pull, branch switch, reset, clean, stash, ref change, build, install, or database operation occurred.
