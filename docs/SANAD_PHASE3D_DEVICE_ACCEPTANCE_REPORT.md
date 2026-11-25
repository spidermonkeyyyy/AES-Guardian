# SANAD Phase 3D - APK Installation and Runtime Device Acceptance

**Date:** 2026-11-25  
**Repository:** `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`  
**Branch:** `migration/aes-guardian`  
**Overall disposition:** **PARTIAL**

## 1. Decision

The exact Phase 3C debug APK was verified, installed with replacement semantics on the requested `emulator-5554`, and launched. The synthetic role workspaces, their authorized destinations, the quality surveillance and prevention views, and French/English/Arabic presentation were exercised. No fatal application crash or database error was observed, and existing visible synthetic counts remained present.

Acceptance is **partial**, not complete. A valid or reversed date range could not be exercised because the emulator opened Gboard's handwriting overlay for the date text fields; only an invalid/incomplete ISO date and retention of the last valid result were verified. TalkBack, reduced motion, dark-mode dashboard rendering, rotation, compact-device layout, and some role/locale combinations were not tested. No source, test, configuration, manifest, dependency, or lockfile changes were made.

## 2. APK identity and verification

All APK checks were completed before device enumeration:

| Property | Verified result |
|---|---|
| APK path | `C:\Users\User\A\android\app\build\outputs\apk\debug\app-debug.apk` |
| SHA256 | `F321C32BE62B24A71F3C22CB6D9879E38A195E4A9F6BD8B3BC1BA9AE22E85757` — matches the required hash |
| Signature | `apksigner verify --verbose --print-certs` succeeded; APK Signature Scheme v2 verified |
| Signer certificate SHA256 | `129273adc2ac2a82e9e7ac06ad4aca7cb2893a6981ccd5b5b3afe44f67857da5` |
| Package / version | `com.sanad`, `0.1.0`, versionCode `1` |
| SDK / debuggable | minSdk 24, targetSdk 35, `android:debuggable=true` |

The pre-install installed APK was pulled to the evidence directory and its signer certificate matched the new APK exactly. After installation, the installed base APK was pulled and its SHA256 matched the required Phase 3C APK SHA256 exactly.

## 3. Device and installation

- Device serial: `emulator-5554`; model/product: `sdk_gphone16k_x86_64`.
- Android 16 / API 36; physical resolution 1220 x 2712; density 480 dpi.
- Before and after testing: font scale `1.0`, system night mode `no`, accessibility enabled `0`, enabled accessibility services `null`.
- Before installation, `com.sanad` was installed at `/data/app/~~QH_SaEEJarJOcjhGr-43YA==/com.sanad-T5e4MYoSFWY_FGh-7mcv2Q==/base.apk`, version `0.1.0` / code `1`; firstInstallTime was `2026-11-12 23:35:57`, lastUpdateTime `2026-11-25 12:44:01`.
- Installed using exactly `adb -s emulator-5554 install -r C:\Users\User\A\android\app\build\outputs\apk\debug\app-debug.apk`; result: `Success`.
- After installation, firstInstallTime remained `2026-11-12 23:35:57`; lastUpdateTime became `2026-11-25 17:47:14`. The package remained version `0.1.0` / code `1`, debuggable, with the same signer.
- No uninstall, downgrade flag, data-clear operation, or real worker/patient/clinical information was used. No declaration or CAPA record was created, edited, submitted, or deleted.

## 4. Launch and baseline

The app launched to the SANAD welcome screen, proceeded through the access and synthetic demo-account picker, and loaded the selected workspace. The first captured launch image caught the splash transition; the subsequent welcome, picker, and workspace captures show rendered UI. No blank screen, red error screen, frozen loading state, or fatal crash was observed.

The exposed-professional workspace showed 5 recent declarations, 1 correction indicator, and 1 unread notification. The declaration card explicitly says it is a recent loaded list (up to 100), not an overall total. The unread count remained 1 after viewing the notification list; no notification was marked read.

## 5. Runtime acceptance matrix

`PASS` means the specified behavior was directly observed on the emulator. `PARTIAL` means only a subset was verified. `NOT TESTED` means no runtime claim is made.

| Test ID | Role / locale | Expected behavior | Actual behavior and result | Evidence |
|---|---|---|---|---|
| ROLE-EX | Exposed professional; French and English | Own summary, correction state, scoped notification, declaration action | **PASS.** Recent-list count 5 and correction count 1 were visible with capped-list wording. One unread synthetic correction notification was visible. The Report tab opened the declaration form; it was left without input or submission. | `exposed-workspace.png`, `exposed-workspace-english.png`, `exposed-declaration-action.png`, `exposed-notification-centre.png` |
| ROLE-ADMIN | Admin reviewer; French | Review summary and correct destination | **PASS.** Workspace review metric was 3 loaded items. Follow-up opened the administrative review queue, showing synthetic queue cards and statuses. | `admin-reviewer-workspace.png`, `admin-review-queue.png` |
| ROLE-OH | Occupational-health professional; French | Coordination summary and correct follow-up destination | **PASS.** Workspace showed 1 active coordination. Follow-up opened the OH coordination queue: pending 0, in progress 1, completed 1; the empty pending state was visible. | `oh-professional-workspace.png`, `oh-coordination-queue.png` |
| ROLE-QUALITY | Quality staff; French, English, Arabic | De-identified summaries and authorized dashboard destinations | **PASS for observed screens.** Workspace showed aggregate declaration and prevention counts, not individual records. Surveillance showed aggregate KPIs/distributions; prevention showed its own action totals and all four statuses. | `quality-staff-workspace.png`, `quality-staff-workspace-english-02.png`, `quality-staff-workspace-arabic.png`, `surveillance-dashboard-fr.png`, `surveillance-indicators-and-charts.png`, `surveillance-distributions-bottom.png`, `surveillance-oh-summary.png`, `prevention-overview-fr.png`, `prevention-overview-arabic.png` |
| ROLE-TECH | Technical administrator; French and Arabic | Technical/schema information only; no clinical metrics or notifications | **PASS for workspace/profile.** Workspace showed `op-sqlite` and schema `v10`; no clinical metric cards or notification bell were present, and only Home/Profile tabs were available. The profile explicitly lists clinical and personal access as prohibited. | `tech-admin-workspace.png`, `tech-admin-profile-settings.png`, `tech-admin-profile-arabic.png` |
| AUTH-SURV | Technical administrator selected in surveillance role switcher; Arabic | Deny access to the quality surveillance dashboard | **PASS.** The screen displayed the localized unauthorized message and no metrics or distributions. | `surveillance-tech-unauthorized-ar.png` |
| NAV | All five roles; French, English, Arabic samples | Correct role tabs, destinations, selected state, labels/icons, safe Back behavior | **PASS for observed paths.** Role-specific tab sets matched the observed permissions: exposed Home/Report/Follow-up/Profile; reviewer and OH Home/Follow-up/Prevention/Profile; quality Home/Follow-up/Prevention/Profile; technical Home/Profile. Accessibility-tree selected states matched the visually selected Liquid Glass tab. Android Back from the notification centre returned to the exposed workspace in a controlled reproduction; Home/foreground returned to the same workspace. | Role workspace/queue captures; `after-android-back-from-notifications.png`, `background-foreground-state.png` |
| SURV-FILTER | Quality staff; French and English | Supported filters work; invalid dates/ranges rejected without replacing last valid results | **PARTIAL.** Selecting Submitted produced `1 / 5` and selected-state feedback. Entering an incomplete ISO date showed localized validation text stating that results still use the last valid filter; the `1 / 5` result remained. Valid date ranges, invalid calendar dates, and reversed ranges were not verified: focusing the emulator text input invoked Gboard handwriting mode, and text entry was not reliably committed. The overlay was cancelled; the filter was reset afterward. | `surveillance-status-filtered.xml`, `surveillance-invalid-filter-visible.png`, `surveillance-start-date-entered.xml`, `surveillance-reset-confirmed.xml` |
| SURV-AGG | Quality staff; English/French | Aggregate indicators, distributions, readable text equivalents, privacy | **PASS for inspected content.** Text labels and accessibility descriptions exposed aggregate monthly, incident-type, status, administrative, and OH counts. No names, individual identifiers, narratives, or declaration records appeared in the inspected surveillance views. | `surveillance-indicators-and-charts.xml`, `surveillance-distributions-bottom.xml`, `surveillance-oh-summary.xml` |
| PREV | Quality staff; French and Arabic | Action totals, four visible statuses including zero, separate declaration aggregate, correct register | **PASS.** Declarations were labelled separately from prevention actions. Actions totaled 5: proposed 0, in progress 2, completed 2, cancelled 1. The read-only “View Register” action opened the prevention register and its filters. No action was created. | `prevention-overview-fr.png`, `prevention-overview-arabic.png`, `prevention-register-quality.png` |
| LOCALE | French, English, Arabic | Localized labels and actual RTL layout | **PASS for captured screens; not exhaustive.** French, English, and Arabic workspace/dashboard/profile labels rendered. Arabic screenshots showed right-aligned text, reordered role and navigation rows, visible selected state, and legible numbers/dates on inspected screens. Horizontally scrollable role/filter chips can be partially clipped at the viewport edge until scrolled. | French, English, and Arabic captures listed above |
| THEME | System light mode | Light/dark presentation where supported | **PARTIAL.** Main dashboard screens were visually inspected in the light system mode. The inspected profile UI had no theme selector; system night mode was not changed. Dark-mode dashboard acceptance is therefore not tested. The welcome screen uses the app's dark theme by design; it is not evidence of dark dashboard acceptance. | `welcome-fr.png`, workspace and dashboard captures |
| A11Y | Normal scale 1.0; enlarged scale 1.3 | Labels, selected state, large-font layout, TalkBack/reduced motion | **PARTIAL.** At 1.3, workspace text wrapped and remained legible; bottom navigation labels remained visible, while dashboard content continued below the viewport in the scrollable area. Font scale was restored to 1.0. UIAutomator exposed button labels/roles and selected states. TalkBack, reduced motion, touch-target usability, and compact-screen behavior were not tested. | `exposed-workspace-large-font-1.3-02.png`, role XML captures |
| STABILITY | Exposed synthetic role | Repeated navigation and background/foreground | **PASS for exercised paths.** Repeated role switches and workspace/dashboard navigation rendered; a background-to-foreground transition returned to the workspace with the visible synthetic counts intact. Rotation was not tested. | `background-foreground-state.png`, final logs |

### Surveillance and prevention values observed

The quality surveillance dashboard displayed total declarations `5`, submitted `1`, under review `1`, correction requested `1`, active OH coordinations `1`, and completed OH follow-ups `1`. Its accessible chart summaries included monthly counts `2026-10: 1` and `2026-11: 4`, exposure counts `1` mucocutaneous and `4` percutaneous, and five status rows with count `1` each. These are demo aggregates, not validated institutional statistics.

The prevention overview displayed total declarations `5` separately from total actions `5`, with proposed `0`, in progress `2`, completed `2`, and cancelled `1`. No unsupported rate, risk score, overdue metric, or performance claim was observed.

## 6. Logs and unresolved observations

The final app-process log is `docs/screenshots/SANAD_PHASE3D_DEVICE_ACCEPTANCE/logcat-runtime-final.txt` (captured for PID `7606`). At capture time it contained **0** fatal-exception/fatal-signal matches, **0** ReactNativeJS error/warning/unhandled/invariant matches, and **0** SQLite/database error matches. It did contain **291** repeated `ReactNativeJNI` attempts to connect to the unavailable emulator Metro endpoint `10.0.2.2:8081`. The UI continued to render; the repeated debug-server retries remain a recorded debug-runtime warning, not silently dismissed as a crash.

Date entry is the main unresolved functional acceptance gap. Gboard displayed a “Try out your stylus” handwriting overlay over the surveillance screen. The incomplete date input was rejected in French and the UI explicitly preserved the last valid `1 / 5` result. The overlay was cancelled without clearing application data; only the surveillance filters were reset. No conclusion is made about valid date filtering or reversed-range handling.

## 7. Evidence inventory

Screenshots, UIAutomator XML captures, logs, and pulled APKs are in:

`docs/screenshots/SANAD_PHASE3D_DEVICE_ACCEPTANCE/`

Relevant log files:

- `logcat-prelaunch.txt`
- `logcat-after-launch.txt`
- `logcat-runtime-final.txt`

The directory also contains `installed-com.sanad-before-install.apk` and `installed-com.sanad-after-install.apk` pulled from the emulator for signature/hash comparison. They are evidence copies, not replacements for the Phase 3C APK.

## 8. Final repository and device state

- Branch remains `migration/aes-guardian`; HEAD remains `86bc6b7e3392893418ec5ed24e604e03032dfa06`.
- No staged paths. An order-independent comparison confirms all 310 paths in the pre-Phase-3C repository status snapshot remain unchanged; the existing Phase 3C report remains present. Phase 3D additions are this report and the requested evidence directory.
- No original application source, tests, configuration, manifests, dependencies, lockfiles, Android build outputs, or repository APK were changed. No Git refs or index were changed.
- The installed package remains `com.sanad` version `0.1.0` / code `1`, signed by the verified Android Debug certificate. The exact installed APK hash matches Phase 3C.
- Application locale was exercised in French, English, and Arabic and restored to French. Android font scale was temporarily set to 1.3 and restored to 1.0. System night mode and accessibility settings were left unchanged.
- SANAD is left in the foreground on the French exposed-professional synthetic workspace. The unread notification count remained 1. No install-data clear, uninstall, declaration/CAPA mutation, or device acceptance action outside this scope occurred.

**Final disposition: PARTIAL.** The exact Phase 3C APK was installed and launched, and the principal role-specific workspace, surveillance, prevention, navigation, and localization paths were exercised. Date-range filtering and the explicitly listed accessibility/theme/rotation scenarios remain unverified; this is not full device acceptance.
