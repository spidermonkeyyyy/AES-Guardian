# SANAD Phase 2E.6 — Native Stabilization and UI Kitten Foundation Verification

## Outcome

| Area | Classification | Result |
|---|---|---|
| Preservation | **ACCEPTED** | Branch, HEAD, index tree, lockfile hash, protected fonts/icons, and Phase 2E.2D compatibility source match preflight. No preflight status paths disappeared. |
| Notification navigation | **ACCEPTED** | Fixed missing notification-centre registration in the unauthenticated/demo stack; verified the real notification screen and back navigation on the update-installed APK in English and Arabic. |
| Arabic native-stack title/back layout | **ACCEPTED** | The reported overlap was not reproduced on the fresh APK. Arabic dashboard and notification-centre titles remained readable and separate from the right-side back control; English/French retain left-side back controls. No speculative layout rewrite was made. |
| Surveillance dashboard | **ACCEPTED** | Populated metrics, distributions, role switching, and RTL layout were verified natively in French, English, and Arabic. Existing automated empty-state coverage passes. No dashboard code rewrite was needed. |
| Existing app theme, typography, and Hugeicons | **ACCEPTED** | The current ThemeProvider, locale-aware typography, and shared AppIcon rendered on the installed APK. |
| UI Kitten 6.2.1 integration | **BLOCKED** | UI Kitten is not present in this checkout: no dependencies in `package.json`/lockfile, no installed packages, no `ApplicationProvider`, Eva theme setup, or UI Kitten imports in source. Dependency changes were explicitly prohibited, so the claimed integration could not be verified or added in this batch. |
| Release readiness / full accessibility / all-screen acceptance | **NOT CLAIMED** | This was a bounded debug stabilization pass, not a release or complete accessibility audit. |

## Preservation record

Preflight was captured before edits at `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E6-20261121-2234\`:

- `preflight-status.txt` contains the complete `git status --porcelain=v1 -uall` output.
- `preflight-metadata.txt` records branch, HEAD, index tree, lock hash, and protected artifact hashes.
- `preflight-staged.txt` records staged paths.

| Check | Preflight | Final |
|---|---|---|
| Branch | `migration/aes-guardian` | unchanged |
| HEAD | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` | unchanged |
| Index tree | `983733927b18bf30b8377f84c9c1813c74c4bf6b` | unchanged |
| Staged paths | 0 | 0 |
| Status paths (`-uall`) | 320 | 321 |
| Path-set delta | — | One added path: this report; zero removed paths |
| `package-lock.json` SHA-256 | `7025E74521BB84E1348ACC87C1D2C7D8BDEC954B988B2CF29D399615D0498313` | unchanged |

The only new status path is this documentation file. The two edited application/test files were already present in the preflight status set. No dependencies or lockfile were changed. Protected hashes remain equal to preflight:

- `android\compat-pointer-events\build.gradle`: `8D27ACAFC5E8A521CC5F01947C93A399F0EF02301EF90FD56985A47FE66600AF`
- `android\compat-pointer-events\src\main\kotlin\com\facebook\react\uimanager\ReactPointerEventsView.kt`: `DD70743F9EB2FD58045168C7023D300B7296858AD5B02746DF5BD18B14FC60AE`
- `src\components\AppIcon.tsx`: `C1DD36019171A76FE4ABEFBBB2EC40DACB3DADBFFC84EE642D6C38497B4A28BD`
- `src\theme\tokens\fontFamilies.ts`: `ED58DB8DAA88BC84C809130DE8B3707D4D74D735C5F4BC9D13E7D6CABD88B97D`
- Young Serif and Instrument Sans asset hashes are recorded in `preflight-metadata.txt` and remain unchanged.

No staging, commits, branch changes, reset, clean, restore, checkout, stash, remote Git operations, dependency changes, uninstall, or app-data clearing were performed. Build outputs and native evidence are outside the repository in the evidence directory above.

## Root cause and repair: notification navigation

`AesGuardianWorkspaceScreen` calls `navigation.navigate('notificationCentre')` for its visible notification action. The route and its `RootStackParamList` entry existed in authenticated branches and the final fallback branch, but not in the `status === 'unauthenticated' || status === 'error'` branch. The synthetic demo workspace is reachable while unauthenticated, so the button was present while its destination was absent from the active native stack. The existing route test incorrectly asserted that this demo branch must not register the route, which masked the defect.

Added `notificationCentre` to the unauthenticated/demo branch and corrected the route test to require registration in all four applicable stack branches. No notification-screen authorization logic, role visibility, notification resolver, navigation parameter type, or role permission was changed.

On the fresh APK, tapping the workspace control opened the real Notification Centre showing the locally persisted synthetic “Prevention Action Created” item. The native back control returned to the workspace. This was verified in English with a left-side back control and Arabic with a right-side back control.

## Native-stack title and RTL verification

The pre-repair installed APK was checked in Arabic on the dashboard: its title was readable and spatially separated from the right-side arrow. The same was confirmed after update-install on both the Arabic surveillance dashboard and Notification Centre. The Notification Centre title `مركز الإشعارات` was centered, with the accessible `رجوع` control on the far right; pressing it returned to the Arabic workspace.

English/French dashboard headers displayed left-side back controls. The English notification route/back sequence was also exercised. Since the previously reported overlap did not reproduce on these representative fresh-APK routes, no native header layout change was introduced. This is not evidence that every route title or accessibility combination has passed review.

## Surveillance dashboard verification

The dashboard was first reproduced on the previously installed APK before editing app code, then checked again on the fresh APK in all requested locales. The authorized synthetic quality journey displayed populated database metrics (5 total declarations, including submitted, under-review, correction-requested, and occupational-health counts). Temporal and exposure distributions rendered with month/category labels and counts; status and occupational-health rows remained visible when scrolling.

- **French:** `dashboard-fr-final.png`, `dashboard-fr-final-scroll.png`
- **English:** `dashboard-en-final.png`, `dashboard-en-final-scroll.png`
- **Arabic:** `dashboard-ar-final.png`, `dashboard-ar-final-scroll.png`

The role selector remained horizontally scrollable and the Arabic dashboard used RTL row ordering and right-aligned translated headings. Cards and labels remained visible; there was no blank dashboard or dominant black chart area. The temporal bars use the existing `primaryAction` color token (`#121212`), while exposure bars use the clinical green token; these compact bars did not obscure the metric chart. Existing `surveillance-dashboard-ui.test.tsx` covers empty distributions and an explicit empty dataset without fabricating chart or metric values; that automated empty-state test passed. The native pass used the persisted synthetic populated dataset, not a database reset.

No dashboard screen, database, metric, role, or clinical logic changes were necessary.

## UI foundation findings

The current root in `App.tsx` renders `ThemeProvider` around `MainApp`; `MainApp` gates navigator rendering on locale and database initialization. The existing custom `ThemeContext`, font token resolver, `AppText`, `AppTextInput`, and `AppIcon` were not changed and rendered through the native bundle.

However, the repository does **not** contain the UI Kitten state described in the request:

- `package.json` and `package-lock.json` contain zero `@ui-kitten/*` or `@eva-design/*` dependencies.
- `node_modules\@ui-kitten` and `node_modules\@eva-design` are absent.
- A source search found no `ApplicationProvider`, Eva theme configuration, or UI Kitten imports.

Consequently, there is no UI Kitten provider placement, Eva theme initialization, or UI Kitten-backed rendering to validate, and no UI Kitten integration tests could run. The existing app ThemeProvider / tokens / typography / Hugeicons coexistence was verified. Installing packages or altering the lockfile would violate this batch's preservation constraints; this discrepancy is explicitly blocked for a subsequent approved phase.

## Files changed in this batch

1. `src\navigation\AppNavigator.tsx` — registered the notification centre in the unauthenticated/demo navigator branch.
2. `src\features\aes-guardian\__tests__\notification-centre.test.tsx` — changed the regression assertion so the demo branch is required to register the visible action's destination.
3. `docs\SANAD_PHASE2E6_NATIVE_STABILIZATION_UI_KITTEN_VERIFICATION.md` — this report.

No files implementing the typography tokens, Hugeicons registry, dashboard, native-stack title renderer, or application theme provider were changed.

## Automated verification

| Check | Result |
|---|---|
| Focused notification, directional-header, and dashboard suites | **Passed: 3 suites, 148 tests** |
| Full Jest suite | **Passed: 60 suites, 1,300 tests** |
| Project TypeScript check | **684 diagnostics overall; 0 in the two repaired files.** This matches the previously recorded Phase 2E.5 project-wide count; the project is not TypeScript-clean. |
| ESLint | **Blocked**: ESLint 9.39.5 cannot find `eslint.config.*`. No configuration or dependency was added. |
| `git diff --check` | Passed; only existing LF-to-CRLF working-copy notices were emitted. |
| UI Kitten provider/theme tests | **Blocked**: no UI Kitten packages/provider/Eva configuration exist in this checkout. |

The full and focused Jest logs, TypeScript output, lint output, and provider inventory are in the external evidence directory.

## Fresh Android build and runtime

The fresh debug APK was built using the established isolated compatibility procedure (`phase2e5.init.gradle`, `PHASE2E2D_BUILD_ROOT` outside the repository, `--max-workers=1`, and Kotlin classpath snapshots disabled). The build completed successfully in 12 minutes 20 seconds.

| Evidence | Result |
|---|---|
| APK | `isolated-build\_app\outputs\apk\debug\app-debug.apk` in the evidence directory |
| APK SHA-256 | `5178C8473BC50A0A864CCBBEB084B2BEF8FB2052D7AB8656232ACCF57545E729` |
| APK size | 183,451,031 bytes; 16 bytes smaller than the preceding Phase 2E.5 APK |
| Application identity | `com.sanad`, label `Sanad`, version `0.1.0` |
| Generated and embedded bundle | Both 2,047,768 bytes; matching SHA-256 `1FA291C3C1588C7A924F42A841FD9C0D5995E06A237FDF8062BDCFCC7A661439` |
| DEX | 17 DEX files; exactly one `ReactPointerEventsView` class definition |
| Update installation | `adb install -r` succeeded. `firstInstallTime` stayed `2026-11-12 23:35:57`; no uninstall or app-data clearing occurred. |
| Metro independence | No `adb reverse` mapping and no local listener on port 8081. The updated debug app cold-started and rendered onboarding and AES screens from its embedded JS bundle. React Native logged repeated failed attempts to connect to `10.0.2.2:8081`; those attempts did not prevent embedded-bundle rendering. |

Build output, APK, extracted bundle/DEX, install timestamps, `adb` logs, screenshots, and matching UI hierarchy XML are stored at:

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E6-20261121-2234\`

Native coverage in this batch is limited to the notification navigation/back sequence, representative Arabic/English stack headers, and populated surveillance dashboards in FR/EN/AR. It is not complete 26-screen acceptance, a full accessibility audit, a release build, or a release-readiness claim.

## Next recommended phase

**SANAD Phase 2E.7 — UI Kitten Integration Reconciliation and Provider Acceptance.** First reconcile the mismatch between the stated completed UI Kitten integration and this checkout, then—only with approval for dependency/lockfile changes—integrate or restore UI Kitten 6.2.1, configure `ApplicationProvider` and the Eva theme alongside the existing SANAD ThemeProvider, and add provider/theme rendering tests. Keep Hugeicons, existing fonts, and screen scope unchanged.
