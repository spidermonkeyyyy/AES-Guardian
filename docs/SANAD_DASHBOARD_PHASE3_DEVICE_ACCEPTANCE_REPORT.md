# SANAD Dashboard Phase 3 — Device Acceptance Report

## 1. Executive summary and disposition

**Disposition: device acceptance not completed.** Source inspection and automated regression checks were performed, but no current-source APK was produced or installed, so no runtime, visual, or accessibility acceptance is claimed.

An isolated-copy Android build was attempted to avoid the dirty Android outputs in the repository. Native CMake tasks nevertheless resolved to generated directories under the original `node_modules`, and the build failed because Ninja could not stat a Gradle transformed artifact whose path exceeded Windows' 260-character limit. The attempt was stopped; no further build or install was run.

## 2. Initial repository state and pre-existing changes

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `493037e6c9c6521130d0f81a5196fa35b9feaaec`
- Initial staged paths: 0.
- Initial `git status --short`: 59 entries: 38 tracked modifications, 6 tracked deletions, and 15 collapsed untracked entries.
- Initial `git status --short --untracked-files=all`: 309 entries, including 265 untracked files.
- The four requested Phase 1/2 reports were read. The Phase 3 report path did not exist before this report was created.

Pre-existing Android output inventory:

| Location | Initial state |
|---|---|
| `android/.gradle` | 18 files; 8 tracked files modified |
| `android/compat/build` | 99 files; 13 tracked files modified and 6 tracked files deleted |
| `android/compat-pointer-events/build` | 204 untracked generated files |
| `android/app/build` | 1,549 files, approximately 1.03 GB, including existing APK outputs |
| `android/build` | 4 existing generated files |

The 8 tracked `.gradle` modifications were under `android/.gradle/8.11.1/executionHistory`, `android/.gradle/8.11.1/fileHashes`, `android/.gradle/8.11.1/resourceHashesCache`, `android/.gradle/buildOutputCleanup`, and `android/.gradle/file-system.probe`. The exact expanded status for the untracked build files is `android/compat-pointer-events/build/` (204 paths); none were removed.

No source, dashboard, navigation, Android build, or prior report files were intentionally edited in this phase. The only repository file created by this phase is this report.

## 3. Files changed and purpose

- `docs/SANAD_DASHBOARD_PHASE3_DEVICE_ACCEPTANCE_REPORT.md` — records preflight, source inspection, the failed isolated build, regression results, and remaining acceptance gaps.
- No application source changes or screenshots were made.

## 4. Source inspection and role/navigation observations

Current source was inspected for the workspace screen, tab navigator, Liquid Glass navigation, surveillance screen, prevention overview, app navigator, and demonstration-role definitions. The source still wires role-specific destinations through `getPrimaryDestinations`; the workspace loads role-specific summaries and the prevention overview retains its repository checks and navigation actions.

The source-defined destinations are:

| Role | Source-defined workspace/tab behavior | Runtime status |
|---|---|---|
| `exposed_professional` | Home, permitted declaration tab, own-declarations follow-up, profile | NOT TESTED |
| `admin_reviewer` | Home, review follow-up, permitted prevention register, profile | NOT TESTED |
| `oh_professional` | Home, occupational-health follow-up, permitted prevention register, profile | NOT TESTED |
| `quality_staff` | Home, surveillance follow-up, prevention overview, profile | NOT TESTED |
| `tech_admin` | Home and profile; workspace summary reads schema information only | NOT TESTED |

These are source observations, not proof of runtime authorization, displayed content, freshness after role changes, or visual acceptance.

## 5. Acceptance matrix

| Acceptance area | Status | Evidence / limitation |
|---|---|---|
| Five role-specific workspaces and role changes | NOT TESTED | Source routes inspected; no current APK launched |
| Correct navigation and unauthorized tabs/actions | NOT TESTED | Source wiring inspected only |
| Quality/technical roles show no identifying clinical information | NOT TESTED | Source workspace summary branches inspected only |
| Workspace loading, error, retry, and loaded-count qualifications | NOT TESTED | No runtime session |
| Surveillance authorization, aggregates, filters, invalid dates, reset/apply | NOT TESTED | No runtime session |
| Prevention counts, empty state, register navigation, create permission | NOT TESTED | No runtime session |
| Light and dark themes | NOT TESTED | Emulator was observed in light mode; no app rendering checked |
| French, English, Arabic, and RTL | NOT TESTED | No app rendering checked |
| Normal/compact width, scrolling, bottom navigation, keyboard clearance | NOT TESTED | Emulator dimensions were recorded; no app layout checked |
| Default/large font scale | NOT TESTED | Font scale was 1.0; large scaling was not tested |
| TalkBack labels, roles, and selected states | NOT TESTED | Accessibility service was disabled and no TalkBack service was available |
| Physical-device acceptance | NOT TESTED | No physical device used |

## 6. Build strategy, safety findings, and APK

The repository's existing `android/app/build`, `android/.gradle`, and compatibility-module outputs were dirty, so the build was attempted from a new temporary copy at:

`C:\Users\User\AppData\Local\Temp\sanad-phase3-4c61ae7be77045af94f5f97aa259032d`

The command was `:app:assembleDebug --no-daemon --console=plain`, with Gradle user-home set inside that temporary copy. The build did **not** stay isolated: CMake task paths resolved into the original checkout's `node_modules` directories. At 2026-11-25 15:11, these three ignored generated files were touched:

- `node_modules/@op-engineering/op-sqlite/android/.cxx/Debug/6k1f46d6/arm64-v8a/configure_fingerprint.bin`
- `node_modules/react-native-reanimated/android/.cxx/Debug/5s11m1m4/arm64-v8a/configure_fingerprint.bin`
- `node_modules/react-native-reanimated/android/.cxx/Debug/5s11m1m4/arm64-v8a/.ninja_log`

They were not restored, deleted, or cleaned. They are ignored by Git and therefore do not appear in the Git status counts. No other files in these two hashed CMake output directories were observed with modification times in the build window.

The build then failed in `:op-engineering_op-sqlite:buildCMakeDebug[arm64-v8a]` and `:react-native-reanimated:buildCMakeDebug[arm64-v8a][reanimated,worklets]` with `ninja: error: ... Filename longer than 260 characters` while resolving `react-android-0.76.9-debug/.../libreactnative.so` under the temporary Gradle cache path.

**APK:** No current-source APK was completed; no APK path or SHA256 is available. The previously installed `com.sanad` package was observed as version `0.1.0` / versionCode `1`, last updated `2026-11-25 12:44:01`. It was not assumed to contain current source and was not updated, launched, or otherwise exercised. No app data was cleared and the package was not uninstalled.

Because native tasks reached original dependency build caches, no alternate build retry was attempted.

## 7. Emulator, screenshots, and accessibility

The connected emulator was `emulator-5554`, model `sdk_gphone16k_x86_64`, Android 16 / SDK 36, physical display 1220×2712 at 480 dpi. System font scale was 1.0, light mode was active, and accessibility was disabled.

These were environment observations only. No dashboard screen was rendered, no screenshots were captured, and no TalkBack, large-font, compact-width, or navigation checks were performed. There are no screenshot paths to report.

## 8. Data, privacy, and authorization

No app installation, app-data clear, database reset, database migration, or dashboard interaction was performed. No production or external clinical data was accessed. Source inspection found the existing role-specific routes and repository calls still present; runtime authorization and de-identification remain unverified.

## 9. Automated regression results

- Full Jest suite: **53 suites passed, 1 failed; 1,191 tests passed, 1 failed (1,192 total)**.
- The failing unrelated suite was `src/features/aes-guardian/__tests__/notification-centre.test.tsx`, test “renders empty state when user has zero notifications”. It expected `Aucune notification` but rendered only an `ActivityIndicator`.
- A focused rerun reproduced the same failure: 37 passed, 1 failed of 38 tests.
- The Phase 2 report records a prior full-suite pass (54 suites / 1,192 tests). This Phase 3 run did not change notification-centre source; the current failure is outside the authorized dashboard acceptance scope. Its cause is not established here.

## 10. Typecheck, lint, and diff check

- `npm run typecheck`: **passed**.
- Focused ESLint on Phase 2 dashboard, status badge, localization, and related test files: **0 errors, 17 warnings**. Warnings are unused test variables and explicit `any` usages; they are outside this Phase 3 change set.
- `git diff --check`: **passed**. Git emitted line-ending notices for pre-existing generated files and the existing prevention overview test; no whitespace errors were reported.

## 11. Defects, fixes, and remaining limitations

No product-code defect was fixed because no runtime acceptance was possible and no Phase 3 source changes were authorized or made. The reproducible notification-centre Jest failure remains unmodified because it is unrelated to the requested dashboards.

The principal blocker is that the attempted isolated build resolved native CMake outputs into the original `node_modules` and failed on the Windows path-length limit. Device acceptance, APK hashing, role/theme/language matrices, screenshots, and TalkBack/font-scale validation remain pending.

## 12. Final Git state and operations confirmation

Final Git status: branch `migration/aes-guardian`, HEAD `493037e6c9c6521130d0f81a5196fa35b9feaaec`, 60 collapsed entries (38 tracked modifications, 6 tracked deletions, 16 untracked entries), 310 expanded paths (266 untracked files), and 0 staged paths. The only status-count increase from preflight is this report. The generated `node_modules` cache timestamps described above are ignored and are not represented in those counts.

The isolated working copy and its partial Gradle user-home remain at `C:\Users\User\AppData\Local\Temp\sanad-phase3-4c61ae7be77045af94f5f97aa259032d`; they were not cleaned or removed.

No reset, clean, stash, restore, branch switch, ref change, staging, commit, push, fetch, pull, app-data clear, uninstall, or install occurred. **However, the attempted build touched the three original ignored CMake cache files listed above.** They were not cleaned or restored. Therefore, a claim that no pre-existing generated files were touched would be inaccurate; this limitation is explicitly recorded.
