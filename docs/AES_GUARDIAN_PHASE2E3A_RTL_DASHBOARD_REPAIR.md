# AES Guardian Phase 2E.3A — RTL and Dashboard Repair

**Decision: BLOCKED.** Source changes and a fresh Android build are complete, but native verification did not close RTL-01 or VIS-01. Arabic native-stack titles overlap the back control, and the post-fix dashboard shows no chart or metrics. This is not full RTL acceptance, accessibility acceptance, or release readiness.

## 1. Preservation preflight

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch / HEAD: `migration/aes-guardian` / `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- HEAD tree and initial index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Initial porcelain status: 239 entries, no staged paths; initial `git diff --check` passed.
- Existing application edits and the Phase 2E.2D `compat-pointer-events` Android duplicate-class repair were retained. No dependency, lockfile, index, or branch changes were made. The verified APK and earlier Phase 2E.2D evidence were not overwritten.
- Full preflight status is retained at `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\phase2e3a-preflight-porcelain.txt`.

The initial status represented pre-existing untracked directories compactly; the final `-uall` status expands those directories into file entries. The index tree remained identical to HEAD.

## 2. Defect reproduction and root causes

### RTL-01

The React Navigation native-stack default back control did not follow the app's locale-based direction APIs. Some screen-level controls also used inline direction checks rather than the shared forward-arrow/chevron helpers. The stack now uses locale-aware back controls; shared screen headers and affected screen rows use the established direction APIs. `AdminReviewQueueScreen`, `OhCoordinationQueueScreen`, and `NotificationCentreScreen` now use `getLayoutForwardArrow` / `getLayoutForwardChevron` rather than inline ternaries. No global `I18nManager` direction forcing was added.

The profile notice now states that Arabic RTL layout is enabled while some views remain to be validated; it does not claim complete RTL support. In the native Arabic profile and workspace captures, content rows and module-card affordances follow RTL, but the native-stack header title remains French and is clipped/overlapped by the right-side back arrow. Therefore the native navigation header repair is incomplete.

### VIS-01

The dashboard uses native React Native views for its bars, not a third-party chart or SVG library. Synthetic aggregate metrics come from the local database's `getSurveillanceDashboardMetrics` method. The earlier French reproduction capture shows a dominant black region. Source inspection found that the dashboard's horizontal role switcher did not constrain its height and could stretch over the dashboard; the switcher now has an explicit 56 dp scroll height. The screen also now localizes status/exposure labels and renders an empty status-distribution state.

After update-installing the repaired APK, opening the Arabic dashboard produced a blank white content area with only part of the role-switcher content visible. The same result persisted after waiting and scrolling; no fatal exception or RedBox appeared in the captured logs. The intended chart, labels, and metric cards could not be visually verified. The cause of this post-fix blank native screen is not established, so VIS-01 remains open.

## 3. Modified files and rationale

- `src/localization/index.ts`: shared direction helpers, back/empty-state translations, and accurate RTL-support wording.
- `src/navigation/AppNavigator.tsx`, `src/navigation/DirectionalStackBackButton.tsx`: locale-aware native-stack controls and title direction.
- `src/features/aes-guardian/components/AesScreenHeader.tsx`: locale-aware row direction and back accessibility label.
- `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`, `AesGuardianProfileScreen.tsx`, `HelpGlossaryScreen.tsx`: directional controls and row ordering.
- `src/features/aes-guardian/screens/AdminReviewQueueScreen.tsx`, `OhCoordinationQueueScreen.tsx`, `NotificationCentreScreen.tsx`: replaced inline arrow checks with shared helpers.
- `src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx`: bounded role-switcher, localized labels, and empty status state.
- `src/navigation/__tests__/DirectionalStackBackButton.test.tsx`, onboarding RTL tests, and `src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx`: focused RTL and dashboard regression coverage.

No chart library, data model, clinical metric, or synthetic data meaning was changed.

## 4. Automated tests and TypeScript

- Focused RTL/navigation/dashboard Jest run before the helper-call-site adjustment: **3 suites, 143 tests passed**.
- Final navigation, dashboard, and notification helper regression run: **3 suites, 135 tests passed**.
- Follow-up helper integration run covering administrative review, OH coordination, and notifications: **1 suite passed, 2 suites failed; 97 passed, 12 failed**. The notification-center suite passed. Failures included legacy test expectations for French labels/accessibility text and missing queue fixtures; they were not suppressed or weakened. Because no pre-change run of those two suites was captured, these failures are not classified as inherited.
- Full `npm run typecheck -- --pretty false`: exit 2 with **759 project diagnostics**. No diagnostics referenced the changed files in the final run. The project-wide diagnostics cannot be classified as inherited because there is no clean-baseline typecheck.
- ESLint was not runnable in the current repository configuration: installed ESLint 9 has no flat config. No config or dependency changes were made.

## 5. Android build, DEX, APK and runtime

- A fresh `:app:assembleDebug` succeeded using the Phase 2E.2D init script and isolated build/cache paths. Log: `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3A-20261120-2010\assemble-debug.log`.
- APK: `...\isolated-build\_app\outputs\apk\debug\app-debug.apk`
- Manifest identity: application ID `com.sanad`, version code `1`, version name `0.1.0`.
- APK SHA-256: `7FCB1CA12BBE7A94E8A6FB9079FBE6D037C829CE7A30C36B9457931859E176C0`
- Embedded `assets/index.android.bundle` size: `2,397,252` bytes; SHA-256: `10AAFEF3D34E603A4357B7384B807B55311533B886A7C3C43B50BA84C054B7F2`. This matches the generated bundle from the isolated build.
- DEX inspection found exactly **one** class definition for `com.facebook.react.uimanager.ReactPointerEventsView` across `classes.dex` through `classes16.dex`.
- The APK was installed with `adb install -r`; package data was not cleared and the app was not uninstalled. `firstInstallTime` remained `2026-11-12 23:35:57`; update time became `2026-11-20 20:37:05`.
- Device: AVD `l3andalib_2`, `emulator-5554`, API 36 / x86_64, 1220×2712 at 480 dpi.
- Metro was unavailable during runtime checks: no ADB reverse mapping for 8081 and no host listener. React Native logged expected failed attempts to contact `10.0.2.2:8081`, then logged `Running "sanad-rn"`; the app's embedded bundle loaded without a fatal exception or RedBox.
- Startup log and screenshots are retained under `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3A-20261120-2010\evidence`.

## 6. Native checks and evidence

| Screen / locale / role | Result | Evidence |
|---|---|---|
| AES Splash / FR / anonymous | PASS | `aes_splash_fr_anonymous_pass.png` |
| Workspace / FR / exposed professional | PASS | `workspace_fr_exposed_professional_pass.png` |
| Profile / FR / exposed professional | PASS | `profile_fr_exposed_professional_pass.png` |
| Workspace / AR / exposed professional | FAIL — native-stack title clipped/overlapped by back control | `workspace_ar_exposed_professional_fail.png` |
| Profile / AR / exposed professional | FAIL — native-stack title clipped/overlapped by back control; Arabic body and updated RTL notice visible | `profile_ar_exposed_professional_fail.png` |
| Workspace / AR / quality staff | FAIL — native-stack title issue remains | `workspace_ar_quality_staff_fail.png` |
| Surveillance Dashboard / FR / quality staff | FAIL — chart and metrics not visible; role label is French | `surveillance_dashboard_fr_quality_staff_fail.png` |
| Surveillance Dashboard / EN / quality staff | FAIL — chart and metrics not visible; navigator title remains French | `surveillance_dashboard_en_quality_staff_fail.png` |
| Surveillance Dashboard / AR / quality staff | FAIL — chart and metrics not visible after waiting/scrolling; navigator title remains French | `surveillance_dashboard_ar_quality_staff_fail.png`, `surveillance_dashboard_ar_quality_staff_later.png`, `surveillance_dashboard_ar_scrolled.png` |

The Arabic workspace capture shows right-to-left content alignment, Arabic role text, and left-facing forward chevrons in module cards. FR captures show left-oriented back navigation and right-facing forward chevrons. These are representative observations only, not full locale or workflow acceptance.

Arabic declaration list/details, OH coordination detail, OH follow-up event, and LTR dashboard screens were not revalidated in this batch. The declaration, OH, and prevention workflows, empty/populated dashboard data cases, accessibility checks, and 26-screen matrix remain untested here. Do not infer a PASS for any unobserved screen or locale.

## 7. Remaining defects and acceptance

- **RTL-01 — OPEN, HIGH:** Arabic native-stack titles are clipped/overlapped by directional back controls. Shared row/card direction improvements are present, but native RTL layout is not fully verified.
- **VIS-01 — OPEN, HIGH:** the chart did not appear on the updated native APK; post-fix Android rendering remains unverified and the blank dashboard is a functional failure.

**Overall Phase 2E.3A: BLOCKED.** The source-level corrections and Android packaging repair are verified, but native evidence does not satisfy either defect-closure criterion. Do not claim full RTL acceptance, accessibility acceptance, release readiness, or completion of the 26-screen validation.

## 8. Final preservation verification

At final verification, branch and HEAD remained unchanged, the index tree remained `983733927b18bf30b8377f84c9c1813c74c4bf6b`, no staged paths were present, and `git diff --check` passed. Existing dirty files and untracked evidence were preserved; no reset, cleanup, stash, commit, or branch change was performed.
