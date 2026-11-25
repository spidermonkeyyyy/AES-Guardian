# SANAD Phase 3E — Runtime Gap Closure Report

**Disposition: PARTIAL**

Phase 3E exercised the surveillance date filters, inspected system dark mode and compact layouts, checked reversible accessibility/display settings, and investigated Metro retries on the existing installation. The tested date-filter cases behaved as expected and all temporary emulator settings were restored. Full acceptance remains incomplete: TalkBack announcements/focus order were not tested, reduced-motion animation behavior was not measured, and compact-layout clipping was observed.

## Scope and preservation

This was a test-only phase on `emulator-5554`. No source, tests, manifests, configuration, dependencies, lockfiles, or APK were changed; no build or install was performed. No declaration, CAPA, or notification records were created, edited, submitted, or deleted. Application data was not cleared. Existing Phase 3D evidence was not overwritten. Temporary display, theme, animation, and accessibility settings were restored.

## Initial state and APK identity

- Repository branch: `migration/aes-guardian`
- HEAD: `86bc6b7e3392893418ec5ed24e604e03032dfa06`
- Initial staged paths: none. The initial Git snapshot contained 416 porcelain-v2 status records.
- Device: `emulator-5554`, model `sdk_gphone16k_x86_64`, Android 16 / API 36.
- Initial display: 1220×2712 pixels, 480 dpi; font scale 1.0; system night mode off.
- Initial accessibility state: accessibility disabled, no enabled services. Auto-rotate enabled, user rotation 0.
- Installed package remained `com.sanad`, version `0.1.0`, versionCode `1`. No reinstall or package update occurred.
- The installed package APK was pulled to `docs/screenshots/SANAD_PHASE3E_RUNTIME_GAP_CLOSURE/installed-com.sanad-baseline.apk` and hashed. SHA256: `F321C32BE62B24A71F3C22CB6D9879E38A195E4A9F6BD8B3BC1BA9AE22E85757`, matching the expected Phase 3C artifact.
- The current process at the end of testing was PID `12070`.

## SURV-DATE — Date-filter matrix

Tests were performed on the authorized `quality_staff` surveillance dashboard, in French and light mode, at the baseline 1220×2712 / 480 dpi display and font scale 1.0. Date strings were entered with ADB text input after clearing each field; captured UIAutomator hierarchies were used to confirm the values actually displayed. Repository calls were not instrumented, so query invocation is not claimed. A changed aggregate/chart display is evidence that valid filters affected the displayed results; invalid input showed localized validation and explicitly retained the last valid result.

| Test ID | Values shown in fields | Expected behavior | Observed behavior | Last valid results retained? | Result and evidence |
|---|---|---|---|---|---|
| SURV-DATE-VALID-MATCH | `2026-10-01` – `2026-11-30` | Apply a valid range and show matching dashboard data | Dashboard showed 5/5 in its displayed result view; monthly chart showed `2026-10: 1` and `2026-11: 4` | N/A | PASS — `date-valid-range-confirmed.xml`, `date-valid-range.png` |
| SURV-DATE-VALID-EMPTY | `2025-01-01` – `2025-12-30` | Show an empty/zero-result filtered view | Dashboard KPIs and monthly distribution showed zero; no matching result was displayed | N/A | PASS — `date-valid-empty-range.xml`, `date-valid-empty-range.png` |
| SURV-DATE-INVALID-CALENDAR | `2026-02-30` | Reject an invalid calendar date with localized feedback | Validation feedback appeared; the preceding valid 5/5 view remained | Yes | PASS — `date-invalid-calendar-exact.xml`, `date-invalid-calendar-exact.png` |
| SURV-DATE-INCOMPLETE | `2026-1` | Reject an incomplete date with localized feedback | Validation feedback appeared; the preceding valid 5/5 view remained | Yes | PASS — `date-incomplete-iso.xml`, `date-incomplete-iso.png` |
| SURV-DATE-REVERSED | `2026-11-30` – `2026-10-01` | Reject an end date earlier than the start and retain the prior valid view | Localized range feedback appeared; the prior zero-result view remained | Yes | PASS — `date-reversed-range.xml`, `date-reversed-range.png` |
| SURV-DATE-RESET | Both fields cleared | Clear both dates and restore unfiltered results | Both inputs cleared and the unfiltered 5/5 display returned | N/A | PASS — `date-reset.xml` |

The empty-range end date is reported as `2025-12-30`, the value captured in the UI hierarchy; an earlier fast-clear attempt had intended `2025-12-31` but did not leave that value in the field. No expected result count was invented. The dashboard's displayed counts are observations of the current view, not assertions about an uncapped dataset total.

Evidence: `date-valid-range-confirmed.xml`, `date-valid-range.png`, `date-valid-empty-range.xml`, `date-valid-empty-range.png`, `date-invalid-calendar-exact.xml`, `date-invalid-calendar-exact.png`, `date-incomplete-iso.xml`, `date-incomplete-iso.png`, `date-reversed-range.xml`, `date-reversed-range.png`, and `date-reset.xml`.

## THEME-DARK — System dark-mode inspection

The initial system night mode was `no`. It was temporarily set to `yes` and then restored to `no`, which was verified after the test. The app reacted to the system setting; no in-app theme control was present in the inspected profile. Workspace, surveillance filters/KPIs/charts, and prevention/status badges rendered with dark surfaces and readable text/status colors. No major fixed white surface or invisible text was observed in the inspected screens. System status/navigation areas are present in the captures, but no separate contrast measurement was performed. This is a visual inspection of the tested screens, not a contrast-ratio measurement or exhaustive theme audit.

Evidence: `dark-workspace-clean.png`, `dark-surveillance-clean.png`, `dark-surveillance-kpis-charts.png`, and `dark-prevention-clean.png`.

## ACCESSIBILITY — Screen reader, targets, and motion

**TalkBack — NOT TESTED.** The installed TalkBack service was temporarily enabled for availability inspection. Android displayed an Accessibility Suite notification-permission prompt; it was dismissed without granting permission. Accessibility was restored to disabled with no enabled services. The prompt prevented a meaningful focus-order or spoken-announcement pass. UIAutomator labels are not treated as a substitute for TalkBack verification.

**Touch-target bounds — PARTIAL.** UIAutomator hierarchy bounds measured navigation items at approximately 93×56 dp, date fields at 166×48 dp, filter chips at about 48 dp high, role chips at about 34 dp high, and top workspace icon buttons at about 36×36 dp. Role chips and top icon buttons are below the common 48 dp target guideline. Some horizontally scrolling chips are clipped until scrolled. These are hierarchy measurements only; they do not establish tactile usability or actual hit-area size. Manual interaction was used for the exercised workflows but was not a comprehensive target-usability test.

**Reduced motion — PARTIAL.** Android window and transition animation scales were temporarily set to zero; navigation remained responsive and selected states updated. The original settings were restored and verified: window animation 1.0, transition animation 1.0, animator duration setting `null` (system default). No frame-by-frame animation or motion-specific accessibility behavior was measured, so reduced-motion acceptance is not claimed.

Evidence: `talkback-enabled-accessibility-dump.txt`, `talkback-permission-prompt.png`, `talkback-permission-prompt.xml`, `talkback-relevant-logcat.txt`, `reduced-motion-workspace.png`, and `reduced-motion-surveillance.png`.

## Compact layout, RTL, and rotation

The emulator was temporarily set to 900×1800 pixels at 480 dpi (300×600 dp), then restored with `wm size reset`; the original physical display was verified as 1220×2712 at 480 dpi. Compact French workspace, surveillance, prevention, and status grids were inspected. Arabic workspace, surveillance, and prevention/status grids were also inspected at the compact dimensions. Text generally wrapped or remained scrollable, and bottom navigation stayed available. Role/filter chips and some date placeholders were clipped until horizontally scrolled. In the compact prevention capture, scrolled text passed beneath status-bar icons; this is a potential layout issue requiring a focused follow-up, not a diagnosed root cause. The verified compact Arabic workspace evidence is `compact-workspace-ar-verified.png` (not `compact-workspace-ar.png`, which depicts the profile screen).

Rotation was temporarily changed and the app responded in landscape; workspace/prevention and surveillance were inspected. The original auto-rotate and user-rotation settings (enabled and 0) were restored. This verifies the observed rotation response only; it does not assert broad orientation-specific acceptance.

Evidence: `compact-workspace-fr.png`, `compact-surveillance-fr.png`, `compact-prevention-fr.png`, `compact-prevention-statuses-fr.png`, `compact-workspace-ar-verified.png`, `compact-surveillance-ar.png`, `compact-prevention-statuses-ar.png`, `rotation-surveillance-landscape.png`, and `rotation-workspace-landscape.png` (the latter shows Prevention).

## Remaining runtime test matrix

| Test ID | Role / locale / theme | Device conditions | Expected behavior | Actual behavior | Result and evidence |
|---|---|---|---|---|---|
| THEME-DARK-WORKSPACE | Demo role selector/workspace context; French; system dark | 1220×2712, 480 dpi, font 1.0; night mode temporarily on | Workspace surfaces and labels remain readable | Dark surfaces rendered; text remained legible in the inspected screen | PASS — `dark-workspace-clean.png`, `dark-workspace-clean.xml` |
| THEME-DARK-SURVEILLANCE | `quality_staff`; French; system dark | Same baseline display; night mode temporarily on | Filters, KPIs, charts, and summaries remain readable | Dark surfaces and readable labels/status colors observed | PASS — `dark-surveillance-clean.png`, `dark-surveillance-kpis-charts.png` |
| THEME-DARK-PREVENTION | `quality_staff`; French; system dark | Same baseline display; night mode temporarily on | Prevention overview and status badges remain readable | Dark surfaces and readable status labels observed | PASS — `dark-prevention-clean.png`, `dark-prevention-clean.xml` |
| ACCESS-TALKBACK | `quality_staff` dashboard context; French; light | Baseline display; TalkBack service temporarily enabled | Read role labels, tabs, metric values, chart equivalents, controls, and logical focus order | Android permission prompt interrupted setup; no spoken/focus test completed; accessibility returned to disabled | NOT TESTED — `talkback-permission-prompt.png`, `talkback-relevant-logcat.txt` |
| ACCESS-TOUCH-BOUNDS | Role selector and quality dashboard controls; French; light | Baseline display; hierarchy bounds in dp | Important controls have usable minimum touch bounds | Bounds measured; several targets are below 48 dp; actual touch usability not established | PARTIAL — `baseline-hierarchy.xml`, `baseline-home-hierarchy.xml`, `role-selector-visible.xml` |
| ACCESS-REDUCED-MOTION | `quality_staff`; French; light | Baseline display; window/transition animation scales temporarily zero | Reduced animation while preserving usable navigation | Navigation remained responsive; animation behavior itself was not measured; settings restored | PARTIAL — `reduced-motion-workspace.png`, `reduced-motion-surveillance.png` |
| LAYOUT-COMPACT-FR | `quality_staff`; French; light | Temporary 900×1800 at 480 dpi (300×600 dp) | Workspace, filters, charts, and prevention grid fit or scroll without clipping/overlap | Content wrapped/scrolled; chips/placeholders clipped until scrolled; prevention text passed beneath status-bar icons in one capture | PARTIAL — `compact-workspace-fr.png`, `compact-surveillance-fr.png`, `compact-prevention-statuses-fr.png` |
| LAYOUT-COMPACT-AR | `quality_staff`; Arabic; light | Same temporary compact display | RTL alignment and content remain legible without clipping/overlap | RTL screens rendered; content remained scrollable, with clipping/overlap observations as above | PARTIAL — `compact-workspace-ar-verified.png`, `compact-surveillance-ar.png`, `compact-prevention-statuses-ar.png` |
| LAYOUT-ROTATION | `quality_staff`; French; light | Temporary landscape rotation; original setting restored | App responds to supported orientation without losing usable content | App responded; surveillance and prevention/workspace were inspected, not every screen/state | PARTIAL — `rotation-surveillance-landscape.png`, `rotation-workspace-landscape.png` |
| METRO-RETRY | `quality_staff` after welcome/demo picker; French; debug runtime | Baseline display; no Metro server | Packaged JavaScript renders without Metro; retries and user impact recorded | Screens rendered and navigation worked; 203 packager WebSocket retries continued without fatal or React Native JS errors in the captured process log | PASS for rendering; retries documented — `logcat-runtime-final-relevant.txt`, `post-relaunch-welcome-next.xml`, `post-relaunch-demo-picker.xml`, `post-metro-quality-workspace.xml` |
| DATA-STABILITY | `exposed_professional`; French; light | Baseline display; final home workspace | Existing synthetic counts remain unchanged and no records are mutated | Declarations 5, corrections 1, unread notifications 1 matched baseline; no records changed | PASS — `final-exposed-workspace.png`, `final-exposed-workspace.xml` |

## Metro retry investigation

After a data-preserving force-stop/start, the app rendered the welcome screen, demo-role picker, and quality workspace without Metro being started. The packaged JavaScript bundle therefore rendered independently of a running Metro server. Process PID `12070` continued logging `ReactNativeJNI` WebSocket failures to `10.0.2.2:8081`: 203 matching failures between `11-25 18:41:42.887` and `11-25 18:55:22.078`, approximately once every four seconds, plus one packager-status failure. No fatal exception or `ReactNativeJS` error was found for this process in the captured log. The retries did not prevent the observed screens from rendering or navigation from working.

This is consistent with the installed debug runtime attempting to reach its development packager. It is not evidence of a production-build defect; no production APK was tested. No Metro server, networking change, or build-configuration change was introduced. A system-process `SQLiteLog` entry reported a double-quoted string literal `"com.sanad"`; it was not emitted by the SANAD app process and no app-process database error was observed.

Evidence: `logcat-before-clean-relaunch.txt`, `logcat-after-clean-relaunch.txt`, `logcat-runtime-final-relevant.txt`, `post-relaunch-welcome-next.xml`, `post-relaunch-demo-picker.xml`, and `post-metro-quality-workspace.xml`.

## Final app/data and repository state

The app was returned to the French `exposed_professional` Home workspace. The visible synthetic declaration count remained 5, correction count 1, and unread notification count 1, matching baseline. No records were created, edited, submitted, or deleted; no app data was cleared. The app process remained running as PID `12070`.

Temporary settings were restored: night mode `no`, font scale 1.0, accessibility disabled with services `null`, auto-rotate enabled/user rotation 0, physical display 1220×2712 at 480 dpi, and animation scales as listed above. Temporary UIAutomator dumps under `/sdcard/phase3e-*.xml` were not removed; these are system-side evidence files and did not alter app data.

The repository remained on `migration/aes-guardian` at HEAD `86bc6b7e3392893418ec5ed24e604e03032dfa06`; there were no staged paths. The 225 Phase 3C-manifest application/configuration file hashes still matched. Existing modified, deleted, and untracked paths were preserved. The final status snapshot is `docs/screenshots/SANAD_PHASE3E_RUNTIME_GAP_CLOSURE/git-status-final-post-report.txt`; initial and pre-report snapshots are retained in the same evidence directory.

## Disposition and follow-up

**PARTIAL.** The exact installed APK identity was retained, date-filter valid/invalid/reset behavior was exercised, dark-mode behavior was inspected and restored, and the scoped stability/data checks passed. Phase 3E does not close all acceptance gaps because TalkBack announcements and focus order were not tested, reduced-motion animation behavior was not directly measured, and compact role/filter-chip clipping and prevention/status-bar overlap remain visual findings. Proposed correction for approval if reproduced: ensure interactive role/icon controls expose at least 48 dp hit targets and keep scrollable content within the status-bar safe inset; then repeat compact French/Arabic, TalkBack, and reduced-motion checks. No implementation change was made or authorized.
