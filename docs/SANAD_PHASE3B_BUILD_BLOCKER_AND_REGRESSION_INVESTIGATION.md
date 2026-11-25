# SANAD Phase 3B - Build Blocker and Regression Investigation

**Investigation date:** 2026-11-25  
**Repository:** `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`  
**Branch:** `migration/aes-guardian`

## 1. Decision

- **Notification-centre failure:** **Inconclusive.** The previous Phase 3 report records a full-suite failure and a focused rerun failure. In this investigation the isolated test, the complete notification-centre suite, and the same suite randomized with seed `20261125` all passed. The failure is therefore not currently reproducible, and the evidence does not establish a production defect, fixture defect, ordering race, or localization problem. No source correction is justified on this evidence.
- **Android build:** A viable safe route exists, but the retained temporary copy is **not isolated**. Its generated React Native autolinking data and copied CMake caches point to the original checkout's `node_modules`; its Gradle home also contains transformed paths over 260 characters. Do not retry in that directory.
- **Next step:** After explicit authorization, make a new disposable workspace with a short, user-writable root and a fresh lockfile-based dependency install; direct Gradle and native outputs only into that workspace and a separate short Gradle home. No build or device acceptance was attempted here.

## 2. Initial Git state and preservation

Captured before inspection:

- Branch: `migration/aes-guardian`, tracking `origin/migration/aes-guardian`.
- HEAD: `86bc6b7e3392893418ec5ed24e604e03032dfa06` (`docs: record dashboard phase 3 device acceptance`, committed `2026-11-25T15:33:15+01:00`).
- Staged paths: none.
- `git status --short --branch`: 59 path entries: 38 modified, 6 deleted, and 15 untracked entries (some untracked directories collapse many files).
- `git status --porcelain=v2 --untracked-files=all`: 309 expanded path entries: 38 modified, 6 deleted, and 265 untracked files.

Complete initial short-status path inventory:

```text
 M android/.gradle/8.11.1/executionHistory/executionHistory.bin
 M android/.gradle/8.11.1/executionHistory/executionHistory.lock
 M android/.gradle/8.11.1/fileHashes/fileHashes.bin
 M android/.gradle/8.11.1/fileHashes/fileHashes.lock
 M android/.gradle/8.11.1/resourceHashesCache.bin
 M android/.gradle/buildOutputCleanup/buildOutputCleanup.lock
 M android/.gradle/buildOutputCleanup/outputFiles.bin
 M android/.gradle/file-system.probe
 M android/compat/build/.transforms/9bc5c0576752baf13c4091f3f41586c3/transformed/classes/classes_dex/classes.dex
 D android/compat/build/.transforms/f60866945425cf8151f5c39319cd56e8/transformed/bundleLibRuntimeToDirDebug/bundleLibRuntimeToDirDebug_dex/com/facebook/react/uimanager/ReactPointerEventsView.dex
 M android/compat/build/intermediates/aar_main_jar/debug/syncDebugLibJars/classes.jar
 M android/compat/build/intermediates/compile_library_classes_jar/debug/bundleLibCompileToJarDebug/classes.jar
 M android/compat/build/intermediates/incremental/debug-mergeJavaRes/merge-state
 M android/compat/build/intermediates/incremental/debug/packageDebugResources/compile-file-map.properties
 M android/compat/build/intermediates/incremental/debug/packageDebugResources/merger.xml
 M android/compat/build/intermediates/incremental/mergeDebugJniLibFolders/merger.xml
 M android/compat/build/intermediates/incremental/mergeDebugShaders/merger.xml
 M android/compat/build/intermediates/incremental/packageDebugAssets/merger.xml
 D android/compat/build/intermediates/java_res/debug/processDebugJavaRes/out/META-INF/compat_debug.kotlin_module
 M android/compat/build/intermediates/merged_java_res/debug/mergeDebugJavaResource/feature-compat.jar
 D android/compat/build/intermediates/runtime_library_classes_dir/debug/bundleLibRuntimeToDirDebug/META-INF/compat_debug.kotlin_module
 D android/compat/build/intermediates/runtime_library_classes_dir/debug/bundleLibRuntimeToDirDebug/com/facebook/react/uimanager/ReactPointerEventsView.class
 M android/compat/build/intermediates/runtime_library_classes_jar/debug/bundleLibRuntimeToJarDebug/classes.jar
 M android/compat/build/outputs/aar/compat-debug.aar
 M android/compat/build/outputs/logs/manifest-merger-debug-report.txt
 D android/compat/build/tmp/kotlin-classes/debug/META-INF/compat_debug.kotlin_module
 D android/compat/build/tmp/kotlin-classes/debug/com/facebook/react/uimanager/ReactPointerEventsView.class
 M src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx
 M src/features/aes-guardian/__tests__/declaration-list-migration.test.tsx
 M src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx
 M src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx
 M src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx
 M src/features/aes-guardian/__tests__/theme-aware-components.test.tsx
 M src/features/aes-guardian/__tests__/workspace-screen.test.tsx
 M src/features/aes-guardian/components/AesStatusBadge.tsx
 M src/features/aes-guardian/components/index.ts
 M src/features/aes-guardian/index.ts
 M src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx
 M src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx
 M src/features/aes-guardian/screens/DeclarationListScreen.tsx
 M src/features/aes-guardian/screens/PreventionOverviewScreen.tsx
 M src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx
 M src/localization/index.ts
 M src/navigation/AppNavigator.tsx
?? android/compat-pointer-events/build/
?? docs/SANAD_ARABIC_RTL_REMEDIATION_AND_GLOBAL_DEVICE_VERIFICATION_REPORT.md
?? docs/SANAD_DASHBOARD_PHASE1_RECONCILIATION_REPORT.md
?? docs/SANAD_DASHBOARD_PHASE1_WORKSPACE_IMPLEMENTATION_REPORT.md
?? docs/SANAD_DASHBOARD_PHASE2_SURVEILLANCE_PREVENTION_REPORT.md
?? docs/SANAD_LIQUID_GLASS_NAVIGATION_INTEGRATION_REPORT.md
?? docs/SANAD_REACT_NATIVE_DASHBOARD_TRANSLATION_AUDIT.md
?? docs/screenshots/SANAD_ARABIC_RTL_REMEDIATION/
?? docs/screenshots/SANAD_LIQUID_GLASS_NAVIGATION_INTEGRATION/
?? src/features/aes-guardian/components/DashboardMetricCard.tsx
?? src/localization/demoNarratives.ts
?? src/navigation/AesGuardianTabNavigator.tsx
?? src/navigation/LiquidGlassNavigation.tsx
?? src/navigation/__tests__/AesGuardianTabNavigator.test.tsx
?? src/navigation/__tests__/LiquidGlassNavigation.test.tsx
```

The notification-centre test and screen, database notification methods, Jest config/setup, `package.json`, and `package-lock.json` were not dirty. `src/localization/index.ts` is dirty for dashboard/navigation translations; the notification-centre French strings inspected here are present and unchanged. These pre-existing changes and generated outputs were preserved.

## 3. Notification-centre Jest investigation

### Evidence

The prior `SANAD_DASHBOARD_PHASE3_DEVICE_ACCEPTANCE_REPORT.md` records:

- Full Jest run: 53 suites passed, 1 failed; 1,191 tests passed, 1 failed.
- The failing test was `renders empty state when user has zero notifications`; expected `Aucune notification`, received an `ActivityIndicator`.
- A focused rerun was also reported failing (37 passed, 1 failed). The prior report does not include the raw Jest failure log.

Runs performed in this investigation:

| Command | Result |
|---|---|
| `npx jest --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx -t "renders empty state when user has zero notifications" --verbose` | Passed: 1 selected test; 37 skipped. |
| `npx jest --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --verbose` | Passed: 38/38 tests. |
| `npx jest --runInBand --randomize --seed=20261125 src/features/aes-guardian/__tests__/notification-centre.test.tsx --verbose` | Passed: 38/38 tests; seed `20261125`. |

The complete suite output included React Native `act(...)` warnings, but no test failure. No warning was suppressed.

### Relevant behavior and fixture

- At `NotificationCentreScreen.tsx:172-196`, focused screens call `loadData`; for the active user it awaits `Promise.all([getNotifications(userId), getUnreadNotificationCount(userId)])`, sets the results, and clears `loading` in `finally`. The empty state is rendered only after loading ends and no error exists (`:383-458`).
- The test at `notification-centre.test.tsx:176-185` renders the screen and uses `waitFor` to assert both localized empty-state strings. It does not assert the empty state immediately after render.
- Its `beforeEach` clears the manual SQLite mock store, resets the singleton database, sets locale to French, awaits database initialization with `seedDemoScenario: false`, then selects `exposed_professional`; `afterEach` resets the database. The manual mock uses an in-memory `Map`; the test does not use fake timers.
- The database methods return an empty notification list/count for a clean fixture, and the French translation is `Aucune notification`. The role store starts as `exposed_professional` and its fixture user has a valid user ID.
- The screen has no request cancellation on unmount or stale-response guard. That is a possible general async concern, but the reviewed test and current runs do not establish that it caused the reported spinner. No shared-mock leakage, stale request, or order dependency was reproduced; the randomized run passed.

**Classification: Inconclusive.** The prior failure was reported twice, but three fresh executions here passed, including a full randomized suite. The test already waits for the expected state; there is no evidence to support changing its expectation, adding a delay, or changing production code. Root-cause confidence is low. If the failure recurs, capture whether each repository promise resolves and the exact `waitFor` timeout/failure output before proposing a narrowly targeted correction.

## 4. Windows Android build-path investigation

No Gradle, CMake, Ninja, Metro, or Android build was run during this investigation.

### Retained temporary copy and path evidence

The retained path exists and was left in place:

`C:\Users\User\AppData\Local\Temp\sanad-phase3-4c61ae7be77045af94f5f97aa259032d`

It contains `android`, `node_modules`, an `android/app/build`, `android/.gradle`, and `.gradle-user-home` at `.gradle-user-home`. Its top-level `node_modules` and the inspected native package directories are ordinary directories, not junctions/symlinks. `android/local.properties` was absent. The copy is **not isolated**, for these observed reasons:

1. Its copied `android/build/generated/autolinking/autolinking.json` has `root`, `reactNativePath`, and both `@op-engineering/op-sqlite` and `react-native-reanimated` Android `sourceDir` values rooted at `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`, not the temporary copy.
2. The copied CMake caches under temporary `node_modules` retain original-checkout values for both `CMAKE_CACHEFILE_DIR` and `CMAKE_HOME_DIRECTORY`. For example, the copied op-sqlite cache under `...\Temp\sanad-phase3-...\node_modules\@op-engineering\op-sqlite\android\.cxx\Debug\6k1f46d6\arm64-v8a\CMakeCache.txt` points back to the original `node_modules\@op-engineering\op-sqlite\android`.
3. The copied Reanimated `.ninja_log` also records paths under the original checkout. The previous report says the CMake tasks touched original dependency outputs, consistent with these retained absolute paths.
4. `android/settings.gradle` uses relative `../node_modules/@react-native/gradle-plugin` and `autolinkLibrariesFromCommand()`. `android/app/build.gradle` applies the React plugin and calls `autolinkLibrariesWithApp()`. Those relative settings do not themselves hard-code the original checkout, but copied generated autolinking output and native CMake caches do. `android/build.gradle` wires the native dependency projects/tasks and compatibility modules into the build.

The temporary copy's changed/untracked `src` files (23 paths) and selected `package.json`, `package-lock.json`, Android Gradle files, and notification test SHA256-matched the current checkout. That does not make its copied autolinking/native outputs safe to reuse.

The three original ignored files identified by the Phase 3 report were inspected read-only and remain ignored under `node_modules/`:

| Original file | Size | Last-write time observed | SHA256 |
|---|---:|---|---|
| `node_modules\@op-engineering\op-sqlite\android\.cxx\Debug\6k1f46d6\arm64-v8a\configure_fingerprint.bin` | 3,201 | 2026-11-25 15:11:04 +01:00 | `754433D23C0AAFAA5967367E8A02D0903F8756C7AE38903FA8C8EE891463A30B` |
| `node_modules\react-native-reanimated\android\.cxx\Debug\5s11m1m4\arm64-v8a\configure_fingerprint.bin` | 3,993 | 2026-11-25 15:11:04 +01:00 | `0B9D996F166DAF5F7736453207E3049A6483917E6732EE0A14901A1AE146F1A7` |
| `node_modules\react-native-reanimated\android\.cxx\Debug\5s11m1m4\arm64-v8a\.ninja_log` | 195 | 2026-11-25 15:11:04 +01:00 | `E0C881CBBA264B69E1A5AFA4BC21B25834DE01AA95096A63A5E325E3224497CA` |

No file was restored, overwritten, deleted, cleaned, or deliberately touched for writing. The listed hashes and timestamps are observations, not a claim about their state before the earlier Phase 3 build.

The failed Gradle home was 96 characters long:

`C:\Users\User\AppData\Local\Temp\sanad-phase3-4c61ae7be77045af94f5f97aa259032d\.gradle-user-home`

The retained transformed artifact family includes these existing paths:

```text
C:\Users\User\AppData\Local\Temp\sanad-phase3-4c61ae7be77045af94f5f97aa259032d\.gradle-user-home\caches\8.11.1\transforms\ac77403800736b1fcd156b1b6c7fae86\transformed\react-android-0.76.9-debug\prefab\modules\reactnative\libs\android.arm64-v8a\libreactnative.so
C:\Users\User\AppData\Local\Temp\sanad-phase3-4c61ae7be77045af94f5f97aa259032d\.gradle-user-home\caches\8.11.1\transforms\ac77403800736b1fcd156b1b6c7fae86\transformed\react-android-0.76.9-debug\prefab\modules\reactnative\libs\android.armeabi-v7a\libreactnative.so
```

Their full path lengths are 261 and 263 characters respectively. The prior Phase 3 report records Ninja's `Filename longer than 260 characters` failure in this transformed `react-android-0.76.9-debug` artifact family. Retained Gradle daemon logs also contain `ninja: error: manifest 'build.ninja' still dirty after 100 tries`; the original console log with the precise failing command/path was not retained in the Phase 3 report.

The current checkout root is 48 characters; the failed temporary root is 78. The Android SDK is at `C:\Users\User\AppData\Local\Android\Sdk` (39 characters), with NDK `26.1.10909125` and CMake `3.22.1`. The SDK prefix is not the dominant contributor compared with Gradle's nested transform path. The current machine registry value `HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled` is `1`; no registry or policy change was made.

### Alternative comparison

| Alternative | Exact paths and path reduction | Isolation, versions, privilege, and risks |
|---|---|---|
| Short Windows build root | Proposed `C:\Users\User\A` (15 characters, currently absent) instead of the failed 78-character temp root: about 63 characters shorter for `android\...` and `node_modules\...\android\.cxx\...` paths. | User-writable; no administrator expected. A fresh copy can keep original Android outputs and `node_modules` untouched. By itself it does not shorten Gradle's separate user-home path and cannot repair copied absolute CMake/autolinking paths. |
| Short Gradle user-home | Proposed `C:\Users\User\G` (15 characters, currently absent) instead of the 96-character failed Gradle home: about 81 characters shorter under `caches\8.11.1\transforms\...`. The observed 261/263-character paths would become approximately 180/182 characters if only that prefix changed. | User-writable; no administrator expected. It isolates Gradle caches, but alone does not fix original-checkout autolinking/CMake references or isolate project/native outputs. Gradle may redownload artifacts. Remove only this new cache after preserving build evidence and with authorization. |
| Windows long-path support | No path reduction. `LongPathsEnabled=1` is already set. | No policy change is recommended: the observed Ninja failure occurred despite the current setting, and long-path behavior depends on the executable/toolchain as well as Windows policy. Changing machine-wide policy would generally require elevation and still would not isolate outputs. |
| Fresh isolated dependency install | `C:\Users\User\A\node_modules`, populated by `npm ci` from the exact current `package-lock.json`, not copied from the original `node_modules`. | Does not modify original dependencies. `npm ci` uses the lockfile's package versions/integrities and does not rewrite the lockfile; validate its hash remains unchanged. Native build outputs are then generated in the new dependency tree. Network availability and install scripts are risks; no administrator expected. The path alone is not short enough unless paired with the short root. |
| Dedicated disposable workspace (recommended) | Snapshot current project state to `C:\Users\User\A`; use `C:\Users\User\G` as `GRADLE_USER_HOME`. Android outputs remain under `C:\Users\User\A\android\...`; RN native outputs belong under `C:\Users\User\A\node_modules\<native-package>\android\.cxx\...`; transformed React Android artifacts belong under `C:\Users\User\G\caches\...`. Keep the existing SDK at its current path. | Fresh, verified copy plus fresh `npm ci` avoids original `node_modules`, Gradle, CMake, and Ninja outputs. Preserve current dirty and untracked source inputs and verify hashes; do not copy old `android/build/generated/autolinking`, `.cxx`, or Gradle outputs. No administrator or links/mappings are needed. Network/install and copy-manifest mistakes are the main risks; only the two newly created workspaces would be rollback candidates after evidence/APK retention and explicit authorization. |

Moving/reinstalling the Android SDK is not recommended: its current path is not the principal excess, and moving it would require validating the exact platform, build-tools, NDK, CMake, licenses, and environment configuration. Leave it unchanged.

## 5. Source and APK identity observations

- Current source identity is HEAD `86bc6b7e3392893418ec5ed24e604e03032dfa06` plus the pre-existing working-tree changes listed above. The source changes were not normalized to HEAD or otherwise altered.
- `com.sanad` was already installed on `emulator-5554` (`sdk_gphone16k_x86_64`). Read-only `adb` queries reported versionName `0.1.0`, versionCode `1`, first install `2026-11-12 23:35:57`, and last update `2026-11-25 12:44:01`. No app launch, install, update, uninstall, or data clear was performed.
- Existing debug APK candidate: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\android\app\build\outputs\apk\debug\app-debug.apk`; size 190,412,471 bytes; last write `2026-11-25 12:43:41`; SHA256 `840DB12C2B044E6A275DEEB74BC4D5AAB0BDDE90EEB6FCBE287C8E279C146349`.
- The APK's version and timestamps do not encode or prove the source HEAD plus dirty/untracked working tree. No build manifest, reproducible source hash, or installed-APK hash comparison ties it to the current source. It must not be used as current-source acceptance evidence.

## 6. Safe next-build preconditions and sequence

Proceed only after explicit authorization to create a disposable workspace and attempt the build:

1. Record the then-current branch, HEAD, full porcelain status, and hashes for every source/config/asset input to be included. Preserve all modified and required untracked application files.
2. Confirm `C:\Users\User\A` and `C:\Users\User\G` are still unused. Copy the current working tree into the first path, excluding `.git`, existing `node_modules`, and existing Gradle/CMake/Ninja/Android build outputs. Do not modify or reuse the retained Phase 3 temp directory.
3. Run `npm ci` only in `C:\Users\User\A`, verify package/lockfile identity and that the lockfile is unchanged, then regenerate React Native autolinking in that workspace. Inspect the generated root and native dependency paths; stop if any point to the original checkout.
4. Set `GRADLE_USER_HOME=C:\Users\User\G`. Verify the generated CMake caches and `.cxx`/Ninja output paths point only into `C:\Users\User\A\node_modules`, Gradle project outputs only into `C:\Users\User\A\android`, and dependencies/toolchain resolve to the existing SDK. Do not copy old `.cxx` or generated autolinking files.
5. Only after those checks, run `:app:assembleDebug --no-daemon --console=plain` from the isolated workspace. Keep the APK at its unique workspace output path; record its SHA256 and source manifest, and do not overwrite the existing repository APK.
6. For later device acceptance, first verify APK package/signature compatibility and capture the installed package state. Install only the verified APK with replacement semantics if compatible; do not clear data or uninstall as a workaround. Then launch and perform the planned acceptance matrix, recording device, APK hash, screenshots, and outcomes. Stop on a signature mismatch or any unexpected original-repository output path.

No build, workspace creation, device install, or acceptance step in this sequence was started.

## 7. Files and evidence inspected

- `docs/SANAD_DASHBOARD_PHASE3_DEVICE_ACCEPTANCE_REPORT.md`.
- `src/features/aes-guardian/__tests__/notification-centre.test.tsx`; `src/features/aes-guardian/screens/NotificationCentreScreen.tsx`.
- `src/core/database/AesGuardianDatabase.ts`; `src/core/database/index.ts`; `src/core/auth/use-demo-role.ts`; `__mocks__/@op-engineering/op-sqlite.js`.
- `src/localization/index.ts`; `jest.config.js`; `jest.setup.js`; `package.json`; `package-lock.json`.
- Retained-copy `android/settings.gradle`, `android/build.gradle`, `android/app/build.gradle`, `android/gradle.properties`, `android/build/generated/autolinking/autolinking.json`, CMake caches, `.ninja_log`, and Gradle transform/daemon artifacts.
- The three ignored original fingerprint/Ninja files listed in Section 4, plus the corresponding original and copied `CMakeCache.txt` path variables.
- Existing debug APK metadata/hash; read-only `adb devices`, `dumpsys package com.sanad`, and `pm path com.sanad`; current Windows long-path registry value.

## 8. Incidental effects and final Git state

Jest diagnostic runs may update the normal external Jest transform cache. The PowerShell/test tool captured command output in Windows Temp. No Android build ran, the retained build directory was not cleaned or written by this investigation, and the three original ignored CMake/Ninja files were only read and hashed. The app was not launched or modified.

Final branch and HEAD are unchanged. Final staged paths: none. Final status is the 59 initial short-status entries above plus this report as one new untracked file: 60 short-status entries and 310 expanded porcelain entries (38 modified, 6 deleted, 266 untracked). No pre-existing path changed status during this investigation. **No application source or test source was changed.** The report is the only repository file created by this investigation.
