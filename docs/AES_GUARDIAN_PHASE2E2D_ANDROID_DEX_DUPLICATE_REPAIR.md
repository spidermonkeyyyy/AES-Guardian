# AES Guardian Phase 2E.2D — Android DEX Duplicate Repair

**Status: ACCEPTED**

The duplicate-class cause was confirmed from both artifacts and the resolved Android dependency graph. A targeted compile-only compatibility module now supplies Gesture Handler's Kotlin compile-time interface without placing a second `ReactPointerEventsView` into the app's runtime DEX inputs. The rebuilt APK contains the verified current Hermes bundle and launched with Metro unavailable.

## Preservation preflight

Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`

| Check | Preflight result |
|---|---|
| Branch | `migration/aes-guardian` |
| HEAD | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` |
| Committed tree / index tree | `983733927b18bf30b8377f84c9c1813c74c4bf6b` / `983733927b18bf30b8377f84c9c1813c74c4bf6b` |
| Porcelain entries / staged paths | 233 / none |
| Android status entries | 92 |
| Saved preflight status snapshot SHA-256 | `50CCF36C65B7AC82EFEAB48C0D68507B3DA6B64A0075E2F00D2AC82A62890D8D` |
| `git diff --check` | Passed |

The complete preflight status and Android inventories are retained in the session evidence directory listed below. All preflight paths remain present in the final status inventory; no preflight changes were staged, reset, cleaned, restored, stashed, or discarded.

Protected artifacts were not overwritten:

| Artifact | SHA-256 |
|---|---|
| Existing committed `android/app/src/main/assets/index.android.bundle` | `594BFBD38933CD8BC48C37BD9F5460FBC74E7FE356DC0770FAD26B7F12F20DDA` |
| Existing debug overlay `android/app/src/debug/assets/index.android.bundle` | `5872C3720AC60F3955B4AE0732814811454E23B8B44A05DBB5E4C19875832C43` |
| Existing debug APK `android/app/build/outputs/apk/debug/app-debug.apk` | `BE139755536D8D54A35343662B39A2F3EBEC2B99D1D51C8B8ED50568676B32CA` |
| `package-lock.json` raw SHA-256 | `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667` |
| `package-lock.json` Git blob | `e397c195e4e22231204add4fdfafb1ba50219736` |

## Duplicate-class diagnosis

`ReactPointerEventsView` was defined in both of the following artifacts:

| Origin | Evidence |
|---|---|
| Project-local `android/compat` debug AAR, packaged through the app's runtime dependency on `:compat` | Pre-repair AAR SHA-256 `f4b4021eda6905cad54d87cf11d93796b9908438ac2bbfdc3a1891f7b5e3fd92`; extracted `compat-debug-classes.jar` SHA-256 `F7CD0807ADBDCED8B571E97DADB0ABC0D2FAA28B9D466C78A7E1D56711FA7F76`. `javap` showed both `getPointerEvents()` and `setPointerEvents(...)`. |
| React Native `com.facebook.react:react-android:0.76.9`, resolved on `debugRuntimeClasspath` and through React Native Android dependencies | Extracted `react-android-0.76.9-classes.jar` SHA-256 `3F2717C111573DADD508DE6015D2649D239B9517F612658F849C6A75FDD1A429`. `javap` showed the official Java interface has only `getPointerEvents()`. The resolved RN artifact version was 0.76.9. |

The saved `debug-runtime-dependencies.log` shows both `project :compat` and `com.facebook.react:react-android:0.76.9` on the debug runtime graph. Gesture Handler and other React Native Android libraries also resolve to RN 0.76.9. Thus both the local compatibility AAR and the official React Native artifact reached D8; the duplicate was not merely inferred from D8's message.

The app still needs `ViewManagerWithGeneratedInterface` from `:compat`. Removing the whole compatibility module or excluding React Native would therefore be incorrect. The precise root cause was a copied pointer-events interface placed in a runtime AAR, despite React Native already providing the canonical interface. The local interface also declared a mutable Kotlin property, unlike the official getter-only Java interface.

## Dependency and toolchain inventory

| Component | Installed/configured version |
|---|---|
| React Native | 0.76.9 |
| React Native Gradle Plugin | 0.76.9 |
| Hermes compiler | 0.12.0; HBC bytecode version 96 |
| `react-native-gesture-handler` | 2.32.0 installed; `^2.20.2` declared |
| `react-native-reanimated` | 3.19.5 installed; `^3.16.1` declared |
| Android Gradle Plugin | 8.6.0 |
| Gradle wrapper | 8.11.1 |
| Kotlin Gradle plugin | 1.9.25 |
| Android compile/target SDK | 35 |
| `:compat` React dependency | `compileOnly com.facebook.react:react-android:0.76.9` |
| New pointer-events shim dependency | `compileOnly com.facebook.react:react-android:0.76.9` |

No dependency version, package manifest, or lockfile was changed; no package was installed. The interface in the APK was verified directly in DEX: `ReactPointerEventsView` is defined once, and its recorded source file is `ReactPointerEventsView.java` (the React Native implementation). The separate Kotlin shim is compile-only and is not included as a second runtime definition.

## Repair and changed files

The original pointer-events interface was removed from the runtime `:compat` source set and moved into a dedicated `:compat-pointer-events` Android library. This shim declares a Kotlin `val`, matching the official getter-only ABI while allowing Gesture Handler's concrete mutable property implementation. It is added to Gesture Handler with `compileOnly`, and its compiled classes are ordered ahead of the official RN class for Kotlin compilation. Explicit task dependencies preserve Gradle task ordering after the Kotlin classpath is assembled.

Final Android source changes:

- `android/build.gradle`
- `android/settings.gradle`
- `android/compat-pointer-events/build.gradle` (new)
- `android/compat-pointer-events/src/main/kotlin/com/facebook/react/uimanager/ReactPointerEventsView.kt` (new)
- `android/compat/src/main/kotlin/com/facebook/react/uimanager/ReactPointerEventsView.kt` (removed)

`android/app/build.gradle` was temporarily set to `debuggable false` for this isolated package build so the APK would load its embedded bundle rather than require Metro. The file was restored to its original `debuggable true` afterward and has no final diff. No application/UI/business-logic source was changed.

## Bundle generation and source-map evidence

The existing React Native Gradle Plugin task `:app:createBundleDebugJsAndAssets` ran as part of the Android build with the project's `index.js` entry, `hermesEnabled=true`, and the configured Hermes compiler. The phase-only init script redirected generated outputs to the session's isolated build directory, excluded the pre-existing debug overlay asset from the input asset source set, and configured the bundle task to run. No permanent Metro, Gradle, or React Native configuration was changed.

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| Fresh Hermes bundle generated by the build | 2,395,052 | `5872C3720AC60F3955B4AE0732814811454E23B8B44A05DBB5E4C19875832C43` |
| Composed source map for that bundle | 7,622,182 | `3A88E0A4C1C3F3F9FD64652A33C3B059CC0A502D821BBC5D451D876F7F0EB0D0` |
| Packager source map | 10,262,276 | `21FB10CA1D127C74D845F18107D39A4372C6FA41371EB441206843C9AB54DDE1` |
| Hermes compiler map | 1,865,562 | `7CF63798FC6B493BDC84D8C8A50262592F04F253E2B5D236829353ED13E772B2` |

The Gradle task emitted the bundle and packager map together; the Hermes compiler map and composed map were emitted in the same isolated build output tree. The composed map identifies workspace sources including `index.js`. These maps remain separate from the APK. The generated HBC has Hermes magic `c61fbc03`, and the configured compiler reports HBC version 96. Current AES identifiers, including `aesSplash` and `aesGuardianWorkspace`, are present in the generated and extracted packaged HBC.

## Gradle validation and APK identity

The focused compile/dex check completed successfully (`targeted-compile-dex.log`; `BUILD SUCCESSFUL in 1m 18s`). The build used `android\gradlew.bat`, the phase-only `phase2e2d.init.gradle` script, `PHASE2E2D_BUILD_ROOT` set to the session's `isolated-build` directory, and task `:app:assembleDebug`. The wrapper build completed successfully in 2m 3s (`assemble-debug.log`); D8 no longer reports duplicate `ReactPointerEventsView`.

| APK property | Verified result |
|---|---|
| Path | `...\AESGuardian-Phase2E2D-20261120-1836\isolated-build\_app\outputs\apk\debug\app-debug.apk` |
| Size | 183,178,335 bytes |
| SHA-256 | `7C796FFEB80066E37E5F5314F1F8B3F696AAB2372D13B5A5E9EC72D6E196D6FC` |
| Application ID | `com.sanad` |
| Version | code 1, name `0.1.0` |
| Signing certificate SHA-256 | `129273adc2ac2a82e9e7ac06ad4aca7cb2893a6981ccd5b5b3afe44f67857da5` |
| `application-debuggable` manifest flag | Absent |
| DEX class definitions | Exactly one `com.facebook.react.uimanager.ReactPointerEventsView`, sourced from the RN Java interface |

`assets/index.android.bundle` was extracted from this new APK to a separate file. Its size is 2,395,052 bytes and its SHA-256 is `5872C3720AC60F3955B4AE0732814811454E23B8B44A05DBB5E4C19875832C43`, exactly matching the intended freshly generated HBC. This differs from the protected September 2026 committed asset (`594BF...`) and proves that the newly built APK packages the current bundle.

## Install and offline runtime verification

The APK was update-installed on AVD `l3andalib_2` (`emulator-5554`) with `adb install -r`; the command returned `Success`. The existing installation was not uninstalled, its data was not cleared, and signing compatibility was maintained.

Metro was stopped, the ADB reverse mapping for port 8081 was absent, and no host listener on 8081 was present during verification. The installed app process (`5789`) loaded `libhermes.so` from the installed APK and logged `ReactNativeJS: Running "sanad-rn"`. The new process had no Metro connection failure, RedBox, fatal exception, or JavaScript startup error in the captured post-start log. Earlier `:8081` connection failures in the combined initial log belong to the old process (`4645`) before the update-install; they are not evidence about the verified APK. The screenshots and post-start log confirm a rendered current UI, not merely an install or cached native screen.

AES onboarding was entered through the separate **“Découverte & Onboarding AES”** discovery action, not the AuthGate **“Get Started”** sign-up action. Verified French navigation:

`aesSplash → aesLanguageSelect → aesWelcomeCarousel → aesDisclaimer → aesDemoPicker → aesGuardianWorkspace`

English language selection and carousel were verified. Arabic selection, carousel, disclaimer, demo picker, and workspace were also exercised as a locale/navigation baseline; this is not native RTL acceptance. The persisted locale was restored to French.

Screenshots and logs are retained (not copied over existing project artifacts) at:

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E2D-20261120-1836`

Representative captures: `runtime-initial-offline.png`, `runtime-aes-entry-offline.png`, `runtime-language-select-fr-offline.png`, `runtime-carousel-fr-offline.png`, `runtime-disclaimer-fr-offline.png`, `runtime-demo-picker-fr-offline.png`, `runtime-workspace-fr-offline.png`, `runtime-language-select-en-offline.png`, `runtime-carousel-en-offline.png`, and the corresponding `-ar-offline.png` locale captures. Runtime logs include `logcat-after-initial-launch.txt`, `logcat-after-workspace-entry.txt`, and the locale-specific captures.

## Remaining limitations and separate work

- Arabic was tested only for locale and navigation; no native RTL acceptance is claimed.
- The eight pre-existing application source edits were left untouched. Their runtime effect was absent from the earlier stale APK and remains unverified. `NurseMessagesScreen`'s no-op callback still needs a separate behavior-preservation review. The five patient-dashboard widget conversions were reported as not imported by the application and are not startup repairs absent contrary evidence.
- No project-wide TypeScript or Jest suite was run. Validation was limited to bundle/Hermes generation, targeted Android compile/dex validation, APK build and identity, offline runtime, screenshots, and `git diff --check`.
- No production deployment or real clinical data was used.

## Final preservation verification

After the report was added, final checks recorded:

- Branch remains `migration/aes-guardian`; HEAD remains `c81a50c98e4e7330fad479a51a48a2fea7f912a1`.
- Committed tree and index tree remain `983733927b18bf30b8377f84c9c1813c74c4bf6b`; staged paths: none.
- All 233 preflight status paths remain present. The final status contains those paths plus the five Android repair paths and this report: 239 porcelain entries total, 97 Android entries, no staged paths, and no missing preflight paths.
- The committed bundle, prior debug overlay, prior APK, and package-lock raw/Git-blob hashes match preflight.
- No package/lockfile, source UI, signing, or permanent app debuggability change was made. Existing generated/cache modifications were retained; generated build outputs for this repair are under the isolated session build root.
- `git diff --check`: passed. Git emitted line-ending normalization warnings for existing modified files, but no whitespace errors.

Final porcelain-v2 status SHA-256: `050c96496849e8c32d3fe2692dcd007ae293b6a9666fd1d5d8bc2f5cb539e228`. Git metadata was not altered, and no files were staged or committed.
