# SANAD Phase 3F — Accessibility and Compact-Layout Remediation Audit

**Disposition: AUDIT COMPLETE — NO FIXES IMPLEMENTED OR DEVICE-VERIFIED**

The Phase 3E findings resolve into three confirmed source defects: undersized workspace role/header touch targets (and a missing selected state on workspace role controls), Android top-inset handling that does not protect scrollable content from the status bar, and date placeholders that do not fit the two-column compact layout. Horizontal chip clipping is expected from intentionally horizontal scroll views, though its discoverability still needs a gesture check. The prevention status grid’s compact sizing remains a reproduction item; its dimensions do not explain the observed status-bar overlap.

This audit changed no application files and did not interact with the emulator. Proposed source changes below are for approval only.

## 1. Executive decision

| Finding | Classification | Evidence-based conclusion |
|---|---|---|
| Workspace role chips are ~34 dp tall; selected role is not exposed as selected | **Confirmed source defect** | `rolePill` has no 48 dp minimum, unlike surveillance role/filter pills; workspace `TouchableOpacity` omits `accessibilityState.selected`. |
| Workspace header icon controls are 36×36 dp | **Confirmed source defect** | Fixed 36 dp width/height with no larger hit region; the 3E hierarchy measured the same. |
| Prevention/workspace content overlaps Android status-bar icons | **Confirmed source defect with runtime evidence** | Prevention’s shared container imports React Native’s core `SafeAreaView`, which is a plain `View` on Android. Workspace bypasses the shared container and starts its scroll content with only 16 dp padding. Target SDK is 35 and the tested device was API 36. |
| Date placeholders clip at compact width | **Confirmed source defect with runtime evidence** | The two date inputs share a single row equally; at 300 dp compact width each hierarchy bound was about 113×48 dp while the French placeholder is “Du : AAAA-MM-JJ” / “Au : AAAA-MM-JJ”. |
| Role/filter chips clip at the viewport edge until scrolled | **Not a defect / expected behavior** | Their source is an intentional horizontal `ScrollView`; all options are not expected to fit simultaneously. Scroll discoverability and RTL starting edge still need manual verification. |
| Prevention status grid causes compact overflow | **Potential issue requiring reproduction** | `flexWrap`, `flexBasis: '48%'`, and `minWidth: 132` make the grid tight at 300 dp, but current evidence does not establish that the grid overflows. It does not account for content appearing beneath status icons. |
| TalkBack focus/announcements and runtime reduced motion | **Not enough evidence** | UI semantics exist for many controls and the navigation has a reduced-motion branch, but Phase 3E did not complete TalkBack traversal or directly verify the Reanimated system setting. |

### Source-to-APK evidence link

At this audit’s current worktree, all 14 audited app/native source files listed below matched their `SourceSHA256` entries in the Phase 3C copy manifest (`Verified=True`): the workspace, surveillance and prevention screens; `AesScreenContainer`; `LiquidGlassNavigation`, `AesGuardianTabNavigator` and `AppNavigator`; `AppIcon`, `DashboardMetricCard`, `AesButton`, `AesStatusBadge`, `AppTextInput`; Android `AndroidManifest.xml`; and `android/app/build.gradle`. This connects the Phase 3E runtime observations to the relevant current source snapshot without rebuilding or inspecting the APK. The manifest is retained outside the repository at `C:\Users\User\.copilot\session-state\983300da-2336-4fab-bb03-aeaee029fc82\files\phase3c-copy-manifest.csv`.

## 2. Source files and components inspected

- `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx` — workspace root scroll, header actions, role selector, role-state labels, styles.
- `src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx` — role switcher, status/exposure filters, date fields, chart/data accessibility labels, compact styles.
- `src/features/aes-guardian/screens/PreventionOverviewScreen.tsx` — shared screen container, aggregate/status cards, responsive grid styles and RTL row direction.
- `src/features/aes-guardian/components/AesScreenContainer.tsx` — safe area, status bar and vertical `ScrollView`.
- `src/features/aes-guardian/components/AesScreenHeader.tsx`, `AesButton.tsx`, `AesStatusBadge.tsx`, `AesCard.tsx`, `DashboardMetricCard.tsx` — shared semantics and existing target sizing.
- `src/components/AppIcon.tsx`, `src/components/AppTextInput.tsx` — decorative/accessibility icon behavior and input typography/padding.
- `src/navigation/AppNavigator.tsx`, `AesGuardianTabNavigator.tsx`, `LiquidGlassNavigation.tsx` — route/tab accessibility, safe-area use, visual and focus order, reduced motion.
- `src/features/authentication/widgets/BreathingAnimation.tsx` — remaining custom Reanimated loop and whether it is used.
- `src/localization/index.ts` — French, English and Arabic date labels/format placeholders.
- `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/java/com/sanad/MainActivity.java`, `android/app/src/main/res/values/styles.xml` — target SDK, activity and status-bar/window configuration.
- Installed React Native 0.76.9 source at `node_modules/react-native/Libraries/Components/SafeAreaView/SafeAreaView.js` — platform implementation of core `SafeAreaView`.
- Phase 3E report and relevant screenshots/hierarchies in `docs/screenshots/SANAD_PHASE3E_RUNTIME_GAP_CLOSURE/`.

## 3. Phase 3E finding-to-source mapping

### A. Touch targets and role semantics

`AesGuardianWorkspaceScreen.tsx:339-370` renders the notification, help and profile controls as `TouchableOpacity`; `createStyles` fixes `headerActionButton` at 36×36 dp (`:873-884`) and has no `hitSlop`. The Phase 3E hierarchy/report measured approximately 36×36 dp. These controls already have button roles and localized names (`:342-367`), so the gap is their target dimensions, not missing names.

The workspace role selector is a horizontal `ScrollView` (`:389-424`). Each role choice uses `TouchableOpacity` with a localized `accessibilityLabel` and `accessibilityRole="button"` (`:403-412`), but does not publish `accessibilityState={{ selected: isSelected }}`. Its style (`:957-964`) has only horizontal/vertical padding, border and margins; there is no 48 dp minimum. The Phase 3E measurement of about 34 dp height is consistent with that style and the small role-label typography.

This is distinct from the existing navigation and surveillance controls:

- `LiquidGlassNavigation.tsx:147-175, 226-239` uses labeled `tab` roles, selected state, at least 48 dp width and 56 dp height.
- `SurveillanceDashboardScreen.tsx:68, 177-220, 375-492, 760-910` defines a 48 dp target; its role and filter pills use selected state, and date inputs are at least 48 dp high.
- `AesButton.tsx:61-104, 119-135` supplies button role, label, disabled/busy state and 48 dp height.
- `AesScreenHeader.tsx:53-65, 123-145` already uses an 8 dp hit slop around a 40 dp back control. Reusing the same all-sides hit slop on the workspace action cluster is not automatically safe: adjacent controls are separated by only a small gap, so expanded hit rectangles could overlap.
- `AppIcon.tsx:192-225` correctly treats unlabeled icons as decorative; the workspace controls themselves supply accessible names.

**Minimal proposal:** preserve the visible 36 dp header icon surface and pill appearance, but give each control a real, non-overlapping 48×48 dp pressable layout target. Keep the visible icon/button surface centered inside that target; preserve badge anchoring to the visible notification surface. Use the existing `spacing.minTouchTarget` token. For role choices, keep the localized name, add selected state, and use a 48 dp-high pressable row with the current visual pill inset/centered. Do not expand neighboring hit rectangles with broad `hitSlop`. Test three header actions at compact width and both layout directions for wrapping, clipping and overlap.

### B. Safe area and status-bar overlap

`PreventionOverviewScreen.tsx:141-217` uses `AesScreenContainer` for all states, including the reported dashboard. That container imports `SafeAreaView` from `react-native` (`AesScreenContainer.tsx:8-14`) and wraps its scrolling view at `:43-63`. In the installed React Native 0.76.9 implementation, `SafeAreaView.js:29-31` selects the native safe-area component only on iOS and selects ordinary `View` for Android. Thus the apparent safe-area wrapper provides no Android status-bar inset. The 16 dp vertical content padding at `AesScreenContainer.tsx:74-77` is not a substitute for the API 36 status-bar inset.

`AesGuardianWorkspaceScreen.tsx:320-325` creates its own `ScrollView` and content padding (`:826-832`) rather than using `AesScreenContainer` or `react-native-safe-area-context`. This independently leaves the workspace without an explicit top inset. The app’s `android/app/build.gradle:12` targets SDK 35; `MainActivity.java` only calls `super.onCreate(null)` and contains no explicit inset handling; the manifest sets `adjustResize` for the keyboard, not top system-bar insets. The Phase 3E compact French workspace and prevention screenshots visibly show scrolled content behind status-bar icons (`compact-workspace-fr.png`, `compact-prevention-statuses-fr.png`); the verified Arabic workspace starts close to the status region as well (`compact-workspace-ar-verified.png`).

**Classification:** confirmed source defect with corroborating runtime observation. The common cause is missing Android-safe-area inset application, with the workspace’s raw scroll view being a second affected surface. It is not caused by the prevention status grid. Android edge-to-edge/status-bar behavior at target SDK 35 on the API 36 test device makes the missing inset material. No Android theme palette or window-mode change is indicated by the evidence.

**Minimal proposal:** use the already-installed `react-native-safe-area-context` API used by `LiquidGlassNavigation.tsx:14, 50` for the shared screen container and the workspace. Apply top and applicable landscape side insets to the content viewport; keep the screen background behind system bars. Let the navigator own bottom-tab insets so the screen and Liquid Glass dock do not double-apply bottom padding. Prefer correcting the shared container plus the raw workspace root over adding one-off spacing to PreventionOverview. Confirm stack/tab, gesture-navigation, landscape and keyboard behavior before finalizing edge selections.

### C. Compact date fields and horizontal chips

`SurveillanceDashboardScreen.tsx:499-539` places two `AppTextInput`s in one `dateRow`, each inside a `flex: 1` wrapper. `dateRow` (`:899-901`) has no compact breakpoint or wrapping rule. `dateInput` (`:902-910`) enforces the correct 48 dp height but has horizontal padding and single-line placeholder text. The localized placeholders at `localization/index.ts:1175-1176`, `1966-1967`, and `2758-2759` combine a start/end prefix with a 10-character ISO date mask. At the Phase 3E compact width of 300 dp, the French UIAutomator bounds were `[111,805][450,949]` and `[462,805][801,949]` pixels on a 480 dpi display: about 113×48 dp per field. The screenshot `compact-surveillance-fr.png` visibly clips both placeholder suffixes. The same side-by-side structure and long localized strings apply in Arabic; the ISO input text itself is explicitly LTR (`:505-512, 526-529`). This is a width/localization problem, not an RTL-only problem or a nested vertical-scroll issue.

**Classification:** confirmed compact-layout source defect with runtime evidence. Keep the date fields’ 48 dp target and preserve their current accessibility labels/hints (`:519-521, 536-538`).

**Minimal proposal:** at compact available width, stack the start/end inputs or provide separate visible start/end labels with a short date-mask placeholder. Prefer responsive layout based on available width, not device model. If retaining a row, remove the redundant prefix from the placeholder only when a visible label still identifies each field. Keep ISO text LTR while keeping field order/alignment correct in RTL. Reuse existing localization APIs; add or adjust only the minimum French/English/Arabic strings required.

The role and surveillance filter chips are also clipped at the right edge in compact screenshots, but their sources explicitly use horizontal `ScrollView`s (`AesGuardianWorkspaceScreen.tsx:389-398`; `SurveillanceDashboardScreen.tsx:182-191, 377-492`) and hide the native horizontal indicator. A cut-off next pill is normal for this chosen one-row scroll pattern; the evidence says users could reveal further items by scrolling. **Classification: not a defect / expected behavior**, pending a manual swipe/accessibility check in French and Arabic. Do not replace these with wrapping grids without evidence that users cannot discover or reach the options.

### D. Prevention grid

`PreventionOverviewScreen.tsx:256-303` lays out aggregate/status cards in a wrapping row. Styles at `:388-397` use `flexWrap: 'wrap'`, `flexBasis: '48%'`, `flexGrow: 1`, and `minWidth: 132`; RTL uses a reversed row direction at `:256-258` while status labels align right. At 300 dp, a 16 dp screen inset leaves about 268 dp; two 132 dp cards plus the 4 dp gap are at the fit boundary. This makes the two-column layout a plausible large-font/compact-width pressure point, but the Phase 3E status-bar overlap screenshot is not evidence that these cards themselves overlap or exceed their parent. The screen is vertically scrollable, and no card-specific horizontal overflow was established.

**Classification:** potential issue requiring reproduction, not a confirmed grid defect. Test 300 dp and larger text in French and Arabic. Only change the grid breakpoint if measured card bounds or visible text actually collide/clip; do not lower minimum card widths or typography pre-emptively.

## 4. TalkBack readiness

Source semantics already present:

- Workspace header actions and module cards have button roles and localized names.
- Workspace role pills have a role/name, but lack selected state.
- `LiquidGlassNavigation` exposes a labeled tab list and labeled tabs with selected states; order is physically mirrored for RTL (`getPhysicalItems` and `:54-62, 145-175`).
- Surveillance role/filter choices expose names, button roles and selected state; date inputs have localized labels and validation hints; invalid-date feedback has alert role (`SurveillanceDashboardScreen.tsx:177-220, 393-539, 544-548`).
- Workspace `DashboardMetricCard.tsx:24-37` groups label, value and optional detail into a text alternative. Surveillance chart bars and distribution rows expose text equivalents (`SurveillanceDashboardScreen.tsx:555-650, 665-724`). Prevention declaration totals and status cards expose labeled text groups (`PreventionOverviewScreen.tsx:237-303`); `AesStatusBadge.tsx:43-59` exposes its localized label.
- Shared `AesButton` exposes button, label, disabled and busy state. The navigation labels allow scaling up to 1.5 and up to two lines (`LiquidGlassNavigation.tsx:157-174`).

No screen-specific focus handoff or restoration logic was found in the audited workspace/tab/screen code. React Navigation owns route changes; source inspection alone cannot establish Android TalkBack focus behavior. Phase 3E did not complete TalkBack because the service setup produced a permission prompt, and the audit deliberately did not enable the service, grant permissions, or change emulator settings.

**Manual verification still required after authorized remediation:** enable the already-available TalkBack service through an approved test setup; traverse each workspace role chip and confirm localized name, button/selection state and order; activate a role and verify the newly displayed role/metrics are understandable; traverse header actions and bottom tabs in LTR and RTL; verify chart row summaries and prevention status summaries are announced once (not duplicated); enter date fields, trigger invalid/incomplete/reversed feedback, reset filters, and verify error announcement; navigate into surveillance/prevention and back, checking focus returns sensibly; test system Back and keyboard open/close. UIAutomator labels and Jest semantics are not substitutes for these spoken/runtime checks.

## 5. Reduced-motion readiness

`LiquidGlassNavigation.tsx:52-67, 69-78` uses Reanimated `useReducedMotion()`: when enabled it assigns the selected index directly instead of starting `withSpring`, and removes the indicator stretch. `src/navigation/__tests__/LiquidGlassNavigation.test.tsx:107-153` covers that branch using a mocked hook. This is a source implementation that respects the existing mechanism; it is not proof that the Android system setting is wired to the hook at runtime. Phase 3E set Android window/transition animation scales to zero and observed navigation responsiveness, but did not observe the hook value or measure the indicator animation.

`BreathingAnimation.tsx:21-44` has an infinite `withRepeat`/`withSequence` loop and does not consult `useReducedMotion`. A repository search found no caller of `BreathingAnimation`; it is not part of the inspected workspace, surveillance, prevention or Liquid Glass screens. **It is an unguarded dormant component, not a demonstrated active-screen defect.** Do not expand this remediation to replace animation architecture; if it is later mounted on an active route, add the existing reduced-motion guard before claiming compliance.

No other custom Reanimated animation is used by the inspected dashboards. Native `ActivityIndicator`s are system widgets, not app-authored loops. Remaining runtime work is to enable Android’s actual reduced-motion setting on an authorized emulator, observe tab-indicator state transitions, and verify that no continuous/custom animation remains on the tested route. Restore the original setting after that future test.

## 6. Localization, RTL and architecture implications

- Continue to use `t()` and the existing French/English/Arabic dictionaries for all role names, date labels, hints and validation. Never hard-code replacement English labels.
- Keep date entry LTR (`YYYY-MM-DD` / localized equivalent) while testing the surrounding row’s RTL field order and alignment.
- Keep workspace `rowDirection`, the Arabic role-scroll order and Liquid Glass physical tab ordering; test initial scroll edge and gesture direction after changing target wrappers.
- Preserve visible pill/icon dimensions, SANAD canonical theme tokens, IBM Plex Sans / IBM Plex Sans Arabic / Readex Pro, Hugeicons through `AppIcon`, UI Kitten/Eva, `ThemeContext`/`useTheme()`, current role permissions/routes, and Liquid Glass navigation.
- Use the already-installed safe-area-context and existing touch-target spacing token. No new dependency, palette, route, navigator, or duplicate shared component is proposed.
- For the status badge on the workspace notification icon, keep its visual anchor on the 36 dp icon surface and verify its physical side in Arabic; do not let an expanded transparent target relocate the badge.

## 7. Regression risks

1. Safe-area insets can be double-applied if the shared container and tab navigator both add bottom spacing; top/side inset changes must be tested in stack screens, tab screens, landscape and both Android system-navigation modes.
2. A 48 dp transparent target can overlap neighbors if implemented as unrestricted `hitSlop`; use explicit layout boxes and retest the compact header’s brand/tagline width, notification badge anchor, clipping and RTL order.
3. Stacking date fields increases filter-card height; confirm normal-screen density, keyboard visibility, scroll-to-input behavior, date validation, reset, and French/English/Arabic labels.
4. Large fonts can push the status grid from two columns to one or wrap localized labels; preserve full labels and values rather than shrinking text.
5. A role selected-state announcement or live update must not cause role permission changes, additional DB reads, duplicate spoken chart labels, or stale metrics.
6. Horizontal role/filter scrollers must remain horizontally reachable in RTL and must not trap vertical scrolling or TalkBack navigation.

## 8. Proposed implementation and device-acceptance sequence

1. After approval, implement only the three confirmed gaps: shared Android-safe-area handling plus the workspace root inset; 48 dp workspace role/header targets and selected-state semantics; compact date-field labels/layout.
2. Add focused component tests for role selected state/target container dimensions, date labels and compact row-vs-stack layout, and container inset application. Do not infer native pixel bounds from Jest alone.
3. Run targeted workspace, surveillance-dashboard, prevention-overview and Liquid Glass navigation tests, followed by the project’s type check/lint. Keep the current pre-existing dirty files intact.
4. Build only in a dedicated isolated workspace using the Phase 3C short-root approach; verify the source-copy manifest and resulting APK hash/metadata. Do not build through the original repository’s generated Android outputs.
5. Only after APK identity is verified and installation is separately authorized, test on `emulator-5554` at baseline and 300×600 dp, French and Arabic, light/dark as applicable, and font scale 1.0 plus 1.3–1.5. Verify status-bar safe inset at scroll top and after scrolling, all target bounds/no overlaps, date placeholder readability, filter/role swipe reachability, tab safe-area spacing and landscape behavior.
6. Perform a separate authorized TalkBack pass and an actual system reduced-motion pass, capturing spoken/focus outcomes and verifying restoration of all temporary emulator settings. No check is a pass until observed on device.

## 9. Remaining manual checks

- **TalkBack:** service activation under approved conditions; names/roles/selected/disabled states; focus sequence and announcements across workspace, tabs, dialogs/errors, filters and chart equivalents; focus restoration on Back.
- **Reduced motion:** confirm the OS reduced-motion state reaches Reanimated `useReducedMotion()` on device and the Liquid Glass indicator switches without spring/stretch. The Phase 3E animator scale probe did not prove this.
- **Compact layout:** reproduce at 300×600 dp and enlarged font scale in French and Arabic; capture initial and scrolled states for status-bar overlap, chip reachability, date labels and prevention card bounds.
- **Touch target interaction:** verify actual taps on the edges of 48 dp workspaces targets and no adjacent control wins due to overlap. Hierarchy bounds are not a physical usability test.

## 10. Git preservation evidence

Initial audit state on 2026-11-25:

- Branch: `migration/aes-guardian`
- HEAD: `86bc6b7e3392893418ec5ed24e604e03032dfa06`
- Staged paths: 0
- Porcelain-v2 path entries: 522 — 38 tracked modifications, 6 tracked deletions and 478 untracked entries. The existing dirty state includes generated Android outputs, modified source/tests and untracked project/report/evidence files.
- The exact initial status snapshot was saved outside the repository at `C:\Users\User\AppData\Local\Temp\sanad-phase3f-initial-status-20261125.txt`.
- The requested report path did not exist before this audit. No source, test, configuration, manifest, dependency, generated output, emulator setting or app data was changed.

Final audit state after report creation on 2026-11-25:

- Branch: `migration/aes-guardian`
- HEAD: `86bc6b7e3392893418ec5ed24e604e03032dfa06`
- Staged paths: 0
- Porcelain-v2 path entries: 523 — 38 tracked modifications, 6 tracked deletions and 479 untracked entries.
- Excluding the new report entry, the final status contains the same 522 path records as the initial snapshot; the exact comparison found 0 differences.
- The final status snapshot was saved outside the repository at `C:\Users\User\AppData\Local\Temp\sanad-phase3f-final-status-20261125.txt`.
- No emulator interaction or application/device state changes were made. The sole intended repository addition is this audit report; all pre-existing modified, deleted, untracked and generated paths remain untouched.
