# SANAD Canonical Recovery and Legacy Purge Report

## 1. Executive disposition

The Android application now launches into the canonical SANAD welcome screen:

**SANAD — Déclarer. Suivre. Prévenir.**

The competing welcome carousel was removed. Both Android variants now generate their JavaScript bundles through the React Native Gradle tasks; neither depends on the obsolete source-set bundle. The final debug APK was installed on the existing `l3andalib_2` emulator without uninstalling the app or clearing its data. Its rendered welcome, continuation to the existing workspace, and role selection were verified from that build.

The existing offline-first/database and CAPA implementation were not changed. No real clinical data or external integration was introduced. No files were staged or committed.

## 2. Initial repository baseline

| Item | Baseline |
|---|---|
| Repository | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2` |
| Branch / upstream | `migration/aes-guardian` / `origin/migration/aes-guardian` |
| HEAD | `9bca10b531ba3ca3c22705a03bfbdc32e5d41691` |
| Index | Clean |
| Tracked worktree state | 17 modified and 7 deleted paths, recorded before this work |
| Untracked worktree | 115 expanded paths, including existing `.agents/`, `.claude/`, `skills-lock.json`, reports, and the stale debug bundle |
| Ignored inventory | 64,988 paths recorded in the baseline inventory |

The baseline already contained user changes and generated Android/Gradle outputs. The pre-existing deletion `src/assets/images/logo/sanad_icon.jpeg` was preserved as a deletion and was not restored. Existing tooling directories, historical reports, and unrelated work were retained.

Before removing the stale untracked debug bundle, its original bytes were recorded. SHA-256: `2DE24A205C05AA97055A9EB87CA2623F5E6A670371A0C11B732DD84448CD7640`.

## 3. Source-of-truth map

| Concern | Authoritative implementation | Competing or obsolete implementation |
|---|---|---|
| Android launch | `MainActivity` → `index.js` → `App.tsx` | No alternate active application entry was found |
| App navigation | `src/navigation/AppNavigator.tsx` | The redundant welcome-carousel route was removed |
| Welcome | `src/features/aes-guardian/screens/SplashScreen.tsx`, initial `aesSplash` route | `WelcomeCarouselScreen.tsx` was an obsolete competing welcome |
| Demo/access flow | Splash readiness gate → first-run language/disclaimer/demo selection; returning users proceed to the existing workspace | No legacy respiratory welcome remains on the active path |
| Localization | `src/localization/index.ts` and persisted locale selection | No active welcome fallback to RespiraCare copy |
| Typography | `AppText` and theme font-family tokens | Existing IBM Plex / Readex aliases were retained |
| Icons | Existing `AppIcon` / Hugeicons integration | No Feather or React Native Elements icon migration was needed |
| Android JS bundle | React Native Gradle-generated debug/release bundle under `android/app/build/generated/assets/` | Stale source-set and tracked main-asset bundles were removed |

`RespiBadge` was preserved: it is a generic reusable badge and is not imported by the active application. Historical reports and decision records were preserved rather than purged based on legacy wording.

## 4. Stale debug bundle root cause and resolution

The React Native Gradle plugin normally treats `debug` as a debuggable variant and skips bundling JavaScript for it. Android could therefore package `android/app/src/debug/assets/index.android.bundle`, where an old untracked bundle took precedence over the application source. A tracked stale bundle was also present under `android/app/src/main/assets/`.

`android/app/build.gradle` now sets `debuggableVariants = []`. The Gradle plugin therefore creates bundles for both debug and release, and the APKs use the generated variant bundles. `metro.config.js` excludes the native Android subtree from Metro's filesystem crawl; this avoids the Windows crawl failure while retaining Metro's default blocklist. No manually copied replacement bundle was created.

## 5. Canonical welcome and controlled deletions

The first route displays the existing SANAD logo, the exact French identity and tagline, and a localized Continue action. The logo is presented on a white tile for contrast. The welcome remains visible while SQLite initializes; the action is gated on readiness and surfaces initialization failure instead of silently bypassing it. Locale selection is persisted, and the established demo, role, and authorization flow remains in place.

| Path | Baseline / tracking | Reason and replacement |
|---|---|---|
| `android/app/src/debug/assets/index.android.bundle` | Untracked stale generated bundle; recorded SHA-256 above | Removed so Android cannot select the old debug bundle; Gradle now generates the debug bundle deterministically |
| `android/app/src/main/assets/index.android.bundle` | Tracked stale generated bundle; original SHA-256 `F25D9A07BFA18C35EE9DCEB9BCAAE14D2285AD07157FFA971F1577DAB3E5815D` | Removed; replaced by variant-specific Gradle-generated assets |
| `src/features/aes-guardian/screens/WelcomeCarouselScreen.tsx` | Tracked | Removed as the competing obsolete welcome; its export and route were also removed |
| `docs/screenshots/SANAD_AFTER_WELCOME.xml` | Temporary device UI dump created during verification | Removed after inspection; actual PNG captures are retained |
| `src/assets/images/logo/sanad_icon.jpeg` | Already deleted in the initial baseline | Preserved as the user's pre-existing deletion; not deleted by this operation |

No historical PFE reports, project decisions, CAPA implementation, database infrastructure, or synthetic demo-account data were removed. The cleanup was selective; unrelated respiratory references in historical material were not treated as active application behavior.

## 6. Typography, icons, localization, and RTL

- The APKs contain IBM Plex Sans and IBM Plex Sans Arabic in regular, medium, semibold, and bold weights, Readex Pro variable, and their license files (12 font assets total).
- `AppText` and the existing theme tokens select Arabic typography for Arabic text and preserve the agreed Readex Pro heading usage.
- Hugeicons remains the active icon backend. No Feather or React Native Elements icon dependency was introduced.
- French, English, and Arabic welcome identity/copy are asserted in tests. RTL direction is handled by locale-aware welcome controls, `AesButton`, and `AesScreenHeader`; the option card and header behavior are covered by RTL tests.
- No dependencies were removed.

## 7. Automated validation

| Check | Command / result |
|---|---|
| Focused regression tests | `npm test -- --runInBand App.test.tsx src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx src/navigation/__tests__/DirectionalStackBackButton.test.tsx src/features/aes-guardian/__tests__/help-glossary-profile.test.tsx src/components/__tests__/AppIcon.test.tsx src/theme/__tests__/bilingual-typography.test.tsx` — **6 suites, 93 tests passed** |
| TypeScript | `npm run typecheck` — passed |
| ESLint | `npx eslint src/features/aes-guardian/components/AesButton.tsx src/features/aes-guardian/components/AesScreenHeader.tsx src/features/aes-guardian/screens/SplashScreen.tsx src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx metro.config.js` — 0 errors; 7 warnings for unused variables / `any` in the onboarding test file |
| Android build | `.\android\gradlew.bat -p android :app:assembleDebug :app:assembleRelease --no-daemon --max-workers=1 --console=plain -PreactNativeArchitectures=x86_64` — `BUILD SUCCESSFUL` |

The initial broad test attempt exposed style assertions that did not flatten React Native's nested style arrays. The assertions were updated to inspect the effective flattened `textAlign` values, preserving the expected left/right alignment checks. The final focused run passes all tests.

## 8. APK and bundle evidence

The generated bundle and embedded APK asset were byte-for-byte identical for each variant. Both variants produced the same bundle hash.

| Artifact | Size | SHA-256 |
|---|---:|---|
| Debug APK `android/app/build/outputs/apk/debug/app-debug.apk` | — | `28CA4B3696F352338FAD98C19507D7DF5BDE22955E27BCED658AC98C6FD9A6CC` |
| Release APK `android/app/build/outputs/apk/release/app-release-unsigned.apk` | — | `6ED1CF2AAD820AE1D398C5E67A337392789561724B97B7FA737F707DDDAE87F9` |
| Generated and embedded JS bundle (debug and release) | 2,111,200 bytes | `8FFE8FF0281AEBA58B5A41E0AB0D0F4401DF00BBE2F875D5EB408CC4463C121E` |

The embedded bundles contain `SANAD` and the exact French tagline (the accented tagline is stored as UTF-16LE in Hermes bytecode). They do not contain the checked legacy strings `RespiraCare` or `Nurse-led respiratory monitoring`. The release APK is unsigned.

## 9. Actual Android verification

The final debug APK was installed with `adb -s emulator-5554 install -r ...` on AVD `l3andalib_2` (`sdk_gphone16k_x86_64`). The app was not uninstalled, its data was not cleared, and no emulator reset was performed. After startup completed, the actual installed app displayed the SANAD logo, wordmark, exact French tagline, and Continue action.

The Continue action opened `Espace SANAD` with the existing synthetic demo role and authorized modules. The administrative reviewer role was selected and visibly showed the reviewer-specific profile and module set; the original `Professionnel exposé` role was restored afterward. No CAPA was submitted and no CAPA data was changed. The checked logcat window contained no fatal exception or React Native runtime error.

Fresh first-run language/disclaimer/demo selection was not replayed on the device because the existing app data was deliberately preserved; this path is covered by the focused onboarding tests. Arabic rendering was verified by translation and RTL tests, not by changing the emulator's global locale.

Actual final-APK screenshots:

- `docs/screenshots/SANAD_CANONICAL_WELCOME.png`
- `docs/screenshots/SANAD_AFTER_WELCOME.png`
- `docs/screenshots/SANAD_ROLE_SELECTION.png`

## 10. Final Git and preservation audit

| Item | Initial | Final |
|---|---:|---:|
| Branch / upstream | `migration/aes-guardian` / `origin/migration/aes-guardian` | unchanged |
| HEAD | `9bca10b531ba3ca3c22705a03bfbdc32e5d41691` | unchanged |
| Index | Clean | Clean; nothing staged |
| Tracked modified paths | 17 | 36 |
| Tracked deleted paths | 7 | 9 |
| Expanded untracked paths | 115 | 223 before adding this report |
| Ignored paths observed | 64,988 | 69,288 discoverable paths after builds |

Final tracked source/configuration changes cover `App.tsx`, `README.md`, `android/app/build.gradle`, `metro.config.js`, the navigation/localization/welcome flow, shared RTL components, and their focused tests. `App.test.tsx` is a new untracked regression test. Task-owned deletions are the tracked main bundle and obsolete carousel, plus the untracked debug source-set bundle; the already-deleted logo remains untouched. Existing tracked Gradle/compat build changes and deletions were present in the baseline; the Android build updated generated cache/output files.

Existing untracked `.agents/`, `.claude/`, `skills-lock.json`, and CAPA reports were preserved. New untracked work includes `App.test.tsx`, the three screenshots, this report, and `android/compat-pointer-events/build/` outputs produced by the Gradle build. Ignored build/cache trees (including `android/app/build`, `android/.gradle`, and `node_modules`) were retained; no ignored files were intentionally removed. Git reported Windows path-length warnings while traversing some ignored `node_modules` content, so the final ignored count is the discoverable count rather than a claim that every overlong path was enumerated.

No staging, commit, branch switch, remote change, reset, clean, checkout, or restore operation was performed.

## 11. Remaining caveats

- The release APK is unsigned and is build/bundle evidence only.
- Actual device verification used French. Arabic/English coverage and RTL direction were verified in tests, not by switching the device locale.
- The fresh-install onboarding path was not replayed on-device to avoid clearing or changing the user's existing application data.
