# AES Guardian Phase 2E.2C - Fresh Android Bundle Validation

**Overall status: BLOCKED**

## 1. Executive recommendation

Current workspace JavaScript was freshly bundled and executed on the existing AVD through Metro. The bundle is Hermes bytecode, and its SHA-256 matches both the existing debug asset and the bundle extracted from the pre-existing debug APK. The application rendered the current AuthGate and completed the AES onboarding replay through the workspace.

The batch is nevertheless **BLOCKED** for acceptance: `assembleDebug` failed during D8 dex merging, so no new APK was produced; the installed debug APK is debuggable and requested JavaScript from Metro, so execution of its embedded asset was not demonstrated. In addition, the exact AuthGate onboarding label appears in the generated source map and Metro-rendered UI but was not found as a literal in the HBC disassembly. Do not repair the earlier `colors` exception based on the stale-bundle theory; this run did not reproduce a RedBox, and the stale committed asset was not what the existing APK contained.

## 2. Preservation preflight

Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`

| Item | Preflight evidence |
|---|---|
| Branch | `migration/aes-guardian` |
| HEAD | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` |
| Committed tree | `983733927b18bf30b8377f84c9c1813c74c4bf6b` |
| Index tree | `983733927b18bf30b8377f84c9c1813c74c4bf6b` |
| Porcelain entries | 167 observed (the prior note said 166) |
| Preflight status SHA-256 | `16b8b39bbf10d6033ec1dfbc53b5f7e5747b8feb568c1588eb941b904d6e0dcf` |
| Staged paths | None |
| `package-lock.json` raw SHA-256 | `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667` |
| `package-lock.json` Git blob | `e397c195e4e22231204add4fdfafb1ba50219736` |

The committed `android/app/src/main/assets/index.android.bundle` was 1,960,659 bytes with SHA-256 `594bfbd38933cd8bc48c37bd9f5460fbc74e7fe356dc0770fad26b7f12f20dda`; it is the September 20, 2026 asset (commit `481b8ebf73f3c2705c092ee971b3d04dc55cfc24`). The pre-existing, untracked debug overlay was 2,395,052 bytes with SHA-256 `5872c3720ac60f3955b4ae0732814811454e23b8b44a05dbb5e4c19875832c43`. Neither was overwritten.

## 3. Root-cause confirmation

The stated stale-bundle premise is contradicted for the APK examined here:

- The existing APK's only bundle entry, `assets/index.android.bundle`, has the debug-overlay hash `5872c372...`.
- The committed September bundle has the different hash `594bfbd3...`.
- The fresh HBC generated in this batch also has hash `5872c372...`.

Thus, this APK did **not** contain the older committed main asset; its embedded asset matches the existing debug overlay and the freshly generated HBC. The APK's full hash is `be139755536d8d54a35343662b39a2f3ebec2b99d1d51c8b8ed50568676b32ca`. The earlier RedBox cannot be attributed to the committed stale bundle from this evidence.

## 4. React Native bundle configuration

- React Native: `0.76.9`; Android Gradle Plugin: `8.6.0`.
- React Native Gradle plugin default: `debuggableVariants = ['debug']`; those variants do not generate/copy a JS bundle and depend on Metro.
- `android/gradle.properties`: `hermesEnabled=true`; the configured Hermes compiler is `node_modules\react-native\sdks\hermesc\win64-bin\hermesc.exe`, release `0.12.0`, HBC bytecode version `96`.
- Metro uses `@react-native/metro-config` via `getDefaultConfig(__dirname)` and `mergeConfig`.
- Entry file: root `index.js`.
- The existing debug APK is `com.sanad`, versionCode `1`, versionName `0.1.0`, and is `DEBUGGABLE`.
- The React Native Gradle task's default Hermes flags are `-O` and `-output-source-map`. The task emits HBC with `-emit-binary` and composes the packager and Hermes compiler source maps.

## 5. Fresh bundle generation

No dependency, package, Metro, or permanent Gradle configuration was changed. A temporary init script and isolated project cache were used under the session evidence directory. The script directed the app build output there, disabled debug debuggability for bundle generation, excluded the existing debug overlay from the task's input assets, and set `debuggableVariants=[]` for that invocation only.

Working directory: `android`

```text
gradlew.bat :app:createBundleDebugJsAndAssets --init-script "C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E2C-20261120-165400\phase2e2c.init.gradle" --project-cache-dir "C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E2C-20261120-165400\gradle-project-cache" --no-daemon --console=plain
```

The task completed with exit code 0 (`BUILD SUCCESSFUL in 3m 46s`). It used `index.js`, Android platform settings, `--dev false`, `--reset-cache`, and `--minify false`; it then ran the configured Hermes compiler with optimized HBC and source-map output.

| Generated artifact | Size | SHA-256 |
|---|---:|---|
| `android-app-build\generated\assets\createBundleDebugJsAndAssets\index.android.bundle` | 2,395,052 bytes | `5872c3720ac60f3955b4ae0732814811454e23b8b44a05dbb5e4c19875832c43` |
| `android-app-build\generated\sourcemaps\react\debug\index.android.bundle.map` (composed) | 7,622,182 bytes | `3a88e0a4c1c3f3f9fd64652a33c3b059cc0a502d821bbc5d451d876f7f0eb0d0` |
| `android-app-build\intermediates\sourcemaps\react\debug\index.android.bundle.packager.map` | 10,262,276 bytes | `21fb10ca1d127c74d845f18107d39a4372c6fa41371eb441206843c9ab54dde1` |
| `android-app-build\intermediates\sourcemaps\react\debug\index.android.bundle.compiler.map` | 1,865,561 bytes | `a724fdcb4433e5f40a126e856fd510e0f1a2b8c8e77404755498ca83812753c2` |

The bundle begins with Hermes bytecode magic `c61fbc03`. Hermes disassembly confirms `aesSplash`, `aesGuardianWorkspace`, and `Get Started`. The composed map has 973 sources and 973 `sourcesContent` entries; its `AuthGateScreen.tsx` content includes `aesSplash`, `aesGuardianWorkspace`, and `Découverte & Onboarding AES`. The exact AuthGate label was not found as a literal in the HBC disassembly; the runtime screenshot below shows that label when the Metro-served current workspace bundle is running. This distinction is retained rather than treating source-map content as proof of the HBC string table.

## 6. APK packaging and bundle identity

The attempted packaging command was `:app:assembleDebug` using the same temporary init script and isolated project cache. It failed with exit code 1 during `:app:mergeDexDebug` / D8:

```text
Type com.facebook.react.uimanager.ReactPointerEventsView is defined multiple times
```

The duplicate was reported from `android/compat` and the React Native dex input. No new APK was produced, and no permanent configuration was changed to work around this blocker.

The pre-existing APK at `android\app\build\outputs\apk\debug\app-debug.apk` remains 185,667,129 bytes, SHA-256 `be139755536d8d54a35343662b39a2f3ebec2b99d1d51c8b8ed50568676b32ca`. Metadata: `com.sanad`, versionCode `1`, versionName `0.1.0`, Android Debug signing certificate SHA-256 `129273adc2ac2a82e9e7ac06ad4aca7cb2893a6981ccd5b5b3afe44f67857da5`.

The bundle extracted from that APK and from the pre-install APK pulled from the AVD was 2,395,052 bytes and SHA-256 `5872c3720ac60f3955b4ae0732814811454e23b8b44a05dbb5e4c19875832c43` in both cases. Both match the freshly generated HBC byte-for-byte. The APK contains the bundle but no `.map` entry; source maps remain separate task outputs associated with the bundle-generation task.

## 7. Runtime behavior and screenshots

The APK was update-installed with `adb install -r` only. No uninstall, app-data clear, emulator wipe, or signing change was performed. The installed package reported versionCode `1`, versionName `0.1.0`, and `DEBUGGABLE`; signing compatibility was confirmed by the successful update-install. AVD: `l3andalib_2` (`emulator-5554`).

Because this is the debug variant, runtime JS came from Metro, not the APK's embedded HBC. Metro 0.76.9 logged `BUNDLE ./index.js` and `Running "sanad-rn" with {"rootTag":11}`; `adb reverse tcp:8081 tcp:8081` was active and Metro's status endpoint returned `packager-status:running`. Metro emitted existing unknown-config-option warnings, but served the bundle. This is evidence that current workspace JS executed; it is **not** evidence that the packaged HBC executed.

The first capture showed a temporary Android System UI "isn't responding" prompt over Metro's `Bundling 74.1%...` progress, not a React Native RedBox. After waiting for bundling, the AuthGate rendered. No RedBox or JS/native fatal stack trace was observed in the captured runtime session; therefore no stack was available to map. The original `colors` failure was not reproduced.

After the checks, the Metro process started for this run was stopped and its `tcp:8081` reverse mapping removed. The AVD remains running with the AES workspace in French.

Screenshots are retained under:

```text
C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E2C-20261120-165400
```

| Evidence | Screenshot | SHA-256 |
|---|---|---|
| Initial Android/System UI prompt during bundling | `runtime-initial-screen.png` | `3f58053fa4b4ea0b683371fab803dd5b2398316c4d14161349f92b837d64f40c` |
| AuthGate after Metro completed | `runtime-post-bundle-screen.png` | `031ac181c61f1a28567c61e2fbfa916d1e2f941e31c2841c02941b3cbe37b574` |
| AES splash | `runtime-aes-splash.png` | `93076f7b3dd800d807e573ae970001efa602fde453b4cfecfb0eb364f5ee51ff` |
| French language selection | `runtime-language-select-fr.png` | `cb8abd4689e5985da7aea4be0585e446c47a1d89cd502c86372026381fe60dd1` |
| French carousel | `runtime-carousel-fr.png` | `fbbab912aecc189606a3ffda61b455f9413b8d0ed28747818f11c257ef206362` |
| English language selection | `runtime-language-select-en.png` | `e279efba581f02771c95338b189b87230da1a502862c509b4e1d1bcaadd5f198` |
| English carousel | `runtime-carousel-en.png` | `515a41434d9e504b3ea78526419a50190571974c0404658a72b8434c22a86852` |
| Arabic language selection | `runtime-language-select-ar.png` | `b5b245398a715c849254ba4d854c04fd7233047add118890315756ae14a25b33` |
| Arabic carousel | `runtime-carousel-ar.png` | `549c71de74b84fadafbb155c9129614a68527d6cc1382c0ee048aa7a25e21339` |
| Arabic disclaimer | `runtime-disclaimer-ar.png` | `2e27c08f75fefe28ce2639f97191a91994abe59754a37482e56c235be38a447b` |
| Arabic demo picker | `runtime-demo-picker-ar.png` | `8730c072f1822559454144e2d85a2afbf3b152fe2f24ec9aa238ce3d15bdf715` |
| Final workspace in restored French locale | `runtime-final-workspace-fr.png` | `3503b6d37dac8e96eb3e8d0683c4b6e6137112be7304a7d168242e2af1170acc` |

## 8. AES entry and navigation

On the AuthGate, `Get Started` is the sign-up action; it was not used as the AES entry. The separate `✨ Découverte & Onboarding AES (Visite Guidée)` action opened `aesSplash`. On this already-onboarded app state, proceeding from `aesSplash` went directly to `aesGuardianWorkspace`, as the splash's first-launch check specifies.

The profile's user-accessible onboarding replay action was then used. It opened `aesSplash` with the replay parameter, bypassed the completed-first-launch check, and allowed the complete sequence to be exercised:

```text
aesSplash -> aesLanguageSelect -> aesWelcomeCarousel -> aesDisclaimer -> aesDemoPicker -> aesGuardianWorkspace
```

French, English, and Arabic selections each updated the language-selection screen and advanced to a carousel rendered in that locale. The Arabic screens display Arabic text and mirrored elements, but the profile explicitly says complete RTL layout support is pending. This is only a locale/navigation baseline; **native Arabic RTL acceptance is not claimed**. The locale was returned to French after testing.

## 9. Remaining defects and limitations

- No new APK was built because D8 found the duplicate `ReactPointerEventsView` class.
- The installed debuggable APK executed Metro-served JS; execution of the embedded packaged HBC remains unverified.
- The AuthGate onboarding label is in the generated source map and rendered by Metro but was not found as a literal in the HBC disassembly.
- No RedBox occurred in this run; the earlier `colors` exception was not reproduced or repaired.
- The eight specifically identified source edits, and all other pre-existing source modifications, were left untouched. Their specific behaviors were not covered by this navigation test. Since the existing APK bundle matches the fresh HBC, the claim that these edits were absent from a stale APK is not supported by this run; their behavior remains unverified. `NurseMessagesScreen`'s no-op callback still needs a separate behavior-preservation review. The five patient-dashboard widget conversions were previously reported as not imported by the application and are not treated as startup repairs here.
- No project-wide TypeScript or Jest success is claimed.

## 10. Final preservation verification

- Branch, HEAD, committed tree, and index tree remained unchanged; no paths were staged.
- Final porcelain status: 233 entries, SHA-256 `50ccf36c65b7ac82efeab48c0d68507b3da6b64a0075e2f00d2ac82a62890d8d`. The status count increase from 167 at preflight is 65 Android generated/intermediate entries plus this requested report.
- The package-lock raw hash and Git blob remained unchanged.
- The committed main bundle, pre-existing debug overlay, existing APK, and pre-existing source/build artifacts were not overwritten or cleaned.
- No application source, package manifest, Metro configuration, or permanent Android build configuration was changed.
- The preflight Android status had 26 generated Gradle/cache/intermediate modifications. Gradle execution increased the Android status inventory to 92 entries (65 additional Android generated/intermediate changes, primarily under `android/compat/build`). No cleanup was run. A complete final Android porcelain listing is retained at `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E2C-20261120-165400\android-status-final.txt`.
- Final `git diff --check` exited 0. Git printed existing LF-to-CRLF working-copy warnings only; no whitespace error was reported.
- Temporary bundle, source maps, logs, extracted APK assets, disassembly, and screenshots are retained under the session evidence directory above. No Git metadata operation, staging, commit, reset, restore, stash, or branch change was performed.

**Disposition:** current-workspace execution and AES navigation are demonstrated through Metro; Phase 2E.2C remains **BLOCKED** until a new APK can be assembled and the installed app can be shown to execute the verified packaged HBC.
