# SANAD Phase 3C - Isolated Android Debug Build Report

**Date:** 2026-11-25
**Repository:** `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
**Branch:** `migration/aes-guardian`

## 1. Decision

**Build succeeded.** A new debug APK was produced from a hash-verified copy of the exact current working tree at `C:\Users\User\A`, using the dedicated Gradle home `C:\Users\User\G`. All observed Android, Gradle, native CMake, and Ninja outputs were under those disposable paths. No APK was installed and no runtime/device acceptance was attempted.

One incidental external effect was observed: the Android SDK metadata file `C:\Users\User\AppData\Local\Android\Sdk\.knownPackages` has a last-write time during the build. Its pre-build hash/time was not captured, so whether it was created or updated cannot be determined. It was not restored or modified after discovery. This is SDK metadata, not a build output; the SDK installation therefore was not completely read-only.

## 2. Initial and final repository state

Before creating workspaces:

- Branch: `migration/aes-guardian`.
- HEAD: `86bc6b7e3392893418ec5ed24e604e03032dfa06`.
- Staged paths: 0.
- Expanded Git status: 310 paths — 38 modified, 6 deleted, 266 untracked.
- The complete initial porcelain-v2 and short-status snapshots are retained in the session evidence directory listed below.

The original repository was checked during and after the build. Before this report was added, its porcelain status exactly matched the initial snapshot, HEAD and branch were unchanged, and there were no staged paths. No original Android files or `node_modules` files had a write time during the build interval. The existing debug APK and the three protected ignored CMake/Ninja files retained their recorded hashes.

After adding this report, the expanded Git status contains 311 paths: the same 38 modified and 6 deleted paths, the same 266 pre-existing untracked paths, and this one new untracked report. An order-independent comparison with the initial snapshot confirms the report is the only status delta; staged paths remain 0. All pre-existing modifications, deletions, and untracked files remain present. No application source, tests, manifests, lockfiles, or Android configuration in the original checkout were changed. No Git refs or index were changed.

## 3. Workspace copy and manifest

Both proposed paths were absent before work began and were created as fresh directories:

- Workspace: `C:\Users\User\A`
- Gradle user home: `C:\Users\User\G`

The copied tree included **632 files / 56,100,983 bytes**. Every included file was SHA256-hashed at the source and destination; all hashes matched. After the build, all 632 workspace files were rechecked against both the source repository and the recorded hashes; all still matched.

The complete per-file manifest (relative path, length, source SHA256, workspace SHA256, verification result) is:

`C:\Users\User\.copilot\session-state\983300da-2336-4fab-bb03-aeaee029fc82\files\phase3c-copy-manifest.csv`

Manifest SHA256: `2D0BDDF4CF61A28149193B595D3B9AD0A5B54A4D15010BC9E90074788D47701A`.

The excluded-path manifest is `C:\Users\User\.copilot\session-state\983300da-2336-4fab-bb03-aeaee029fc82\files\phase3c-excluded-paths.csv`, SHA256 `8DDD02AAB012EF131B3658E81C1C3BC1F275120F2AD02A6988FBAE57F57D41B4`. It records:

| Excluded path | Reason |
|---|---|
| `.git` | Git metadata and refs |
| `node_modules` | Reinstalled from the copied lockfile |
| `android\.gradle` | Existing Gradle project cache/output |
| `android\app\build` | Existing Android app outputs and APKs |
| `android\build` | Generated Android output, including stale autolinking metadata |
| `android\compat\build` | Existing module outputs |
| `android\compat-pointer-events\build` | Existing module outputs |
| `.idea\caches` | IDE-generated cache |
| `.claude\skills\gluestack-ui-v5` | A repository reparse-point link; skipped to avoid following an external path or creating a link |

No application source, test, localization, asset, or required untracked application file was excluded. The known build-output directories above were enumerated before copying; `android\build` was not copied, so no old autolinking JSON, CMake/Ninja caches, or Gradle transforms were reused.

`npm ci` subsequently exposed a package-bundled `node_modules\react-native-svg\android\.gradle` cache whose `config.properties` pointed to a macOS Android Studio Java path. It contained no original-checkout path. That specific stale cache was removed only from the new disposable workspace before the build. No original dependency or cache was changed.

## 4. Dependency installation and source identity

Dependency installation ran only in `C:\Users\User\A`:

```text
npm ci --no-audit --no-fund
```

It succeeded, adding 976 packages. Tool versions were Node.js `v24.18.1` and npm `12.0.1`. The copied lockfile SHA256 was unchanged before and after installation:

`DFC9C90CCBB3486AB724E3CFAD215760159E44F873570B34BDA3E23461BF7FA5`

Build toolchain observed: React Native `0.76.9`, Gradle wrapper `8.11.1`, Android Gradle Plugin `8.6.0`, Kotlin `1.9.25`, Java 17, Android platform/build-tools 35, NDK `26.1.10909125`, and CMake/Ninja `3.22.1`. The existing SDK was used at `C:\Users\User\AppData\Local\Android\Sdk`; it was not moved.

The source identity is HEAD `86bc6b7e3392893418ec5ed24e604e03032dfa06` plus the original working-tree state represented by the per-file copy manifest. The APK must not be identified by HEAD alone: it includes the preserved working-tree modifications and untracked source inputs.

## 5. Isolation and path-length verification

Before Gradle ran, `npx react-native config` generated configuration from the fresh workspace. Its root was `C:\Users\User\A`, its React Native path and Gradle plugin were under `C:\Users\User\A\node_modules`, and all seven autolinked Android packages resolved under that same new `node_modules`:

- `@op-engineering/op-sqlite`
- `@react-native-async-storage/async-storage`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-safe-area-context`
- `react-native-screens`
- `react-native-svg`

Neither the CLI-generated configuration nor the Gradle-generated `C:\Users\User\A\android\build\generated\autolinking\autolinking.json` referenced the original checkout. The generated Gradle metadata also reported `C:\Users\User\A` as root. The React Native Gradle plugin resolved from `C:\Users\User\A\node_modules\@react-native\gradle-plugin`.

The build used `GRADLE_USER_HOME=C:\Users\User\G`. Android project outputs were created under `C:\Users\User\A\android`; Gradle transformed artifacts were created under `C:\Users\User\G\caches`. React Native native outputs and `.cxx` caches were created under the corresponding package `android` directories in `C:\Users\User\A\node_modules`.

After the build, 12 CMake caches and 12 Ninja logs were found in the copied dependencies. Their paths were under `C:\Users\User\A`; no inspected CMake cache or Ninja log referenced the original repository. Observed CMake configuration used the existing SDK NDK and Ninja paths. No CMake/Ninja outputs were found in the original repository during the build.

Representative path lengths:

| Path | Estimated length |
|---|---:|
| Previous Gradle transformed `react-android-0.76.9-debug` arm64 artifact | 261 characters |
| Previous Gradle transformed `react-android-0.76.9-debug` armeabi-v7a artifact | 263 characters |
| Same Gradle transformed paths using `C:\Users\User\G` | 180 / 182 characters |
| New Reanimated CMake output directory ending in `arm64-v8a` | 90 characters |
| Representative `build.ninja` path in that CMake directory | 102 characters |
| Representative deep CMake object path | 220 characters |

The Windows `LongPathsEnabled` value was already `1`; no registry, policy, symlink, junction, or drive mapping was changed or created.

## 6. Build result

The only build command was run from `C:\Users\User\A\android`, with the dedicated Gradle user home set:

```text
gradlew.bat :app:assembleDebug --no-daemon --console=plain
```

**Result:** `BUILD SUCCESSFUL in 17m 22s`; 256 actionable tasks executed. There were no Ninja errors or `Filename longer than 260 characters` errors. The full console log is retained at:

`C:\Users\User\.copilot\session-state\983300da-2336-4fab-bb03-aeaee029fc82\files\phase3c-gradle-build-console.log`

Log SHA256: `3507C74B7FB6726F8A6CB8641D8590475DFF75991F53C0A0F31D308A29F2BC43`.

Metro reported four warnings about unknown configuration options; native compilation emitted C++ warnings. Neither prevented the build.

## 7. APK identity

- Path: `C:\Users\User\A\android\app\build\outputs\apk\debug\app-debug.apk`
- Size: 148,145,659 bytes
- Last write: `2026-11-25T16:24:14.8640097+01:00`
- SHA256: `F321C32BE62B24A71F3C22CB6D9879E38A195E4A9F6BD8B3BC1BA9AE22E85757`
- Package: `com.sanad`
- Version: `0.1.0`, versionCode `1`
- Minimum SDK: 24; target SDK: 35
- Manifest `android:debuggable=true`
- APK signature verified; signer is Android Debug, certificate SHA256 `129273adc2ac2a82e9e7ac06ad4aca7cb2893a6981ccd5b5b3afe44f67857da5`

The APK remains in the isolated workspace and was not copied over the existing repository APK.

## 8. Integrity checks, incidental effects, and limitations

- The initial and final original Git snapshots matched exactly before this report was created; the original checkout's existing debug APK hash remained `840DB12C2B044E6A275DEEB74BC4D5AAB0BDDE90EEB6FCBE287C8E279C146349`.
- The three ignored original CMake/Ninja files retained their Phase 3B hashes. A timestamp scan found no original `node_modules` or Android files written during the build; the default `C:\Users\User\.gradle` also had no recent writes.
- A scan found `C:\Users\User\AppData\Local\Android\Sdk\.knownPackages` with a last-write time of `2026-11-25T16:18:17.6375308+01:00`, during the build. It is a 16-byte SDK metadata file, SHA256 `9B6B694EF310466F9DDC279091A5FEA3467AB9B8022E257FAC651F733BCA949`. Its pre-build state was not snapshotted. It was left as observed; no attempt was made to restore or delete it.
- The retained Phase 3 temporary workspace was not reused, modified, or cleaned. The two new workspaces and session evidence/log files were left in place for traceability.
- No Android device was queried or interacted with in this phase. The app was not launched, installed, updated, uninstalled, or cleared. This report establishes a successful isolated debug build only, not device acceptance.

## 9. Final confirmation

The isolated debug APK was successfully produced and verified. The original source, tests, manifests, lockfiles, and existing repository build outputs remain unchanged. The only intended original-repository addition is this report. No staging, commit, push, fetch, pull, branch switch, reset, clean, stash, or Git-ref operation occurred.
