# SANAD Phase 2E.4 - Global Typography and Welcome / Entry Redesign

**Status: PARTIALLY ACCEPTED.** Implementation and focused verification are complete, with final native presentation evidence limited by an emulator System UI ANR during startup and a release-variant native build blocker.

## 1. Preservation preflight

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- HEAD/index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Preflight porcelain entries: 245; zero staged paths.
- Preflight evidence: `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\SANAD-Phase2E4-preflight-20261121`
- Final status entries: 263; staged paths: 0.
- Exact final path comparison: 0 preflight paths missing; 18 phase-added paths identified. Final status count increased because Android build and test-generated outputs plus implementation/test/report paths appeared.
- `git diff --check`: completed with only existing/generated line-ending warnings and no whitespace errors.

Protected hashes:

| Artifact | Result |
|---|---|
| `package-lock.json` | unchanged, SHA-256 `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667` |
| `android/compat-pointer-events/build.gradle` | unchanged |
| `android/compat-pointer-events/src/main/kotlin/com/facebook/react/uimanager/ReactPointerEventsView.kt` | unchanged |

No preflight path was lost. No staging, commit, branch change, reset, clean, restore, checkout, stash, remote operation, lockfile edit, dependency edit, database migration or clinical logic change was performed.

## 2. Typography and font license

Centralized locale-aware font tokens were added in `src/theme/tokens/fontFamilies.ts` and exported through `src/theme/tokens/index.ts`.

- Young Serif: approved display name, asset unavailable.
- Instrument Sans: approved body name, asset unavailable.
- Ramis Arabic: supplied trial OTF inspected at 137,924 bytes, SHA-256 `ED0CFEED62EAAFE5A8306B098D0E98FBA6D19346F5229AF4C15087029656DACC`.
- Ramis metadata identifies `Ramis Arabic TRIAL Medium`, weight 500. It contains the archive-only TRIAL label and no explicit license grant. It was not embedded or distributed.
- Arabic shaping metadata includes GSUB/GPOS and representative Arabic, punctuation and numeral coverage, but no legal font use or device glyph acceptance is claimed.
- Latin display uses platform serif fallback; Latin body uses platform sans fallback; Arabic uses platform Arabic-capable sans fallback.
- The locale-aware `getAppFontFamily()` helper returns the Arabic fallback for Arabic without global `I18nManager` changes.

## 3. Welcome and access implementation

`AuthGateScreen` now presents:

- Upper-right FR/EN/AR selector
- Original `src/assets/images/logo/sanad_icon.png`
- SANAD name
- French default catchphrase and AES description
- One bottom `Commencer` action

`AccessScreen` is separate and provides prototype sign-in and demonstration access. Sign-in shows a localized honest prototype notice rather than fake credentials or production authentication. Demonstration access opens the existing `aesDemoPicker`.

Localization remains centralized in `src/localization/index.ts`, persisted through AsyncStorage, and restored by `initializeLocale()` before normal app rendering.

## 4. Role and navigation preservation

The existing picker retains exactly:

- `exposed_professional`
- `admin_reviewer`
- `oh_professional`
- `quality_staff`
- `tech_admin`

The first four are grouped as primary journeys. `tech_admin` remains visible in a separate technical-access subsection with unchanged permissions. Native screenshots confirm the five-card Arabic picker, including `ADMIN-TECH`.

Existing routes, role boundaries, AES workflows, native header logic, dashboard behavior and database contracts were preserved.

## 5. Respiracare removal

Removed active RespiraCare branding from shared SANAD logo, authentication splash, legacy profile versions and mock profile credentials. Legacy patient/nurse URLs and UI text were replaced with SANAD/synthesized SANAD examples. No legitimate historical respiratory clinical content or unrelated documentation was removed.

## 6. Debugger warning

The exact warning string was not found in project source. `MainApplication.getUseDeveloperSupport()` remains `BuildConfig.DEBUG`, preserving debug support in debug builds. The presentation APK manifest has no `android:debuggable` attribute; the presentation build used the established isolated compatibility method with the app variant temporarily non-debuggable.

Native startup logged `Running "sanad-rn"` with no React Native fatal or RedBox. The emulator briefly showed a system-level “System UI isn't responding” dialog, which was visually dismissed using the dialog's Wait action. This was not treated as a legitimate application fatal or globally suppressed.

The release variant also remains blocked by a separate stale Reanimated/CMake native output path: `mkdir(...ReanimatedRuntime...)`/Ninja failed during `:app:assembleRelease`. This is documented rather than treated as a successful release build.

## 7. Automated tests

Entry/onboarding/navigation/role command result:

```text
4 suites passed
93 tests passed
0 failed
npm test -- --runInBand src/features/authentication/__tests__/entry-experience.test.tsx src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx src/navigation/__tests__/DirectionalStackBackButton.test.tsx src/core/auth/__tests__/boundaries.test.ts
```

Preserved AES workflow command result:

```text
5 suites passed
218 tests passed
0 failed
npm test -- --runInBand src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx src/features/aes-guardian/__tests__/admin-review-batch5-acceptance.test.tsx src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx src/features/aes-guardian/__tests__/notification-centre.test.tsx src/features/aes-guardian/__tests__/declaration-workflow.test.tsx
```

The project-wide typecheck:

```text
npm run typecheck -- --pretty false
exit 2
694 project diagnostics
0 diagnostics in Phase 2E.4 touched files
```

Therefore the inherited project is not TypeScript-clean.

## 8. Android artifact and native evidence

Evidence root:

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E4-EntryRedesign`

Presentation APK:

- Application ID: `com.sanad`
- Version code/name: `1` / `0.1.0`
- APK SHA-256: `774994AFFD5ECC243BA68711C107E775E5A27393727364476C335CAE4B794F0C`
- Generated and embedded bundle SHA-256: `8B50A257D5689650112A7F6970DFE31BFBCAFD742DBBF84B665311E36750499E`
- Exactly one DEX class definition: `com.facebook.react.uimanager.ReactPointerEventsView`
- Update-install: `adb install -r` succeeded.
- No uninstall or app-data clearing.
- Metro unavailable after reverse removal.
- Embedded Hermes startup: `Running "sanad-rn"`.

Native screenshots:

| Case | Screenshot | Verdict |
|---|---|---|
| French first launch / clean UI | `welcome-fr-clean.png` | PASS |
| English switch | `welcome-en.png` | PASS |
| Arabic switch and RTL | `welcome-ar.png` | PASS |
| Arabic access choices | `access-fr.png` / native access capture | PASS / RTL layout PASS |
| Prototype sign-in notice | `signin-alert-ar.png` | PASS |
| Demo picker all primary and technical roles | `demo-picker-ar.png` | PASS |
| Exposed-professional Arabic workspace | `workspace-exposed-ar.png` | PASS |

The native run tested FR → EN → AR and entered the existing Arabic demo workspace. Persistence after restart is substantively covered by the localization tests and AsyncStorage implementation; a clean native restart after ANR dismissal retained the app process and loaded embedded JS, but separate EN/AR relaunch screenshots were not required as a claim beyond the cases shown.

## 9. Files changed

- `src/features/authentication/screens/AuthGateScreen.tsx`: minimal welcome.
- `src/features/authentication/screens/AccessScreen.tsx`: sign-in and demo access.
- `src/theme/tokens/fontFamilies.ts`: approved names and license-aware fallbacks.
- `src/theme/tokens/typography.ts`, `aesTypography.ts`, `index.ts`, `colors.ts`: centralized adoption.
- `App.tsx` and `src/localization/index.ts`: locale hydration and persistence.
- `src/navigation/routes.ts`, `AppNavigator.tsx`, `DirectionalStackBackButton.tsx`: access route and localized native header integration.
- `src/features/aes-guardian/screens/DemoAccountPickerScreen.tsx`: four primary categories plus technical access.
- Authentication, profile and shared-logo files: active SANAD branding cleanup.
- `src/features/authentication/__tests__/entry-experience.test.tsx`, onboarding test updates: focused entry, typography and role tests.
- `android/app/build.gradle`: verified presentation manifest behavior; restored normal debug support.
- `jest.config.js` and `jest.setup.js`: AsyncStorage test setup.

## 10. Remaining limitations

- Young Serif and Instrument Sans assets were not supplied and are not embedded.
- Ramis Arabic trial font is not embedded pending legal permission.
- Full release/production readiness is not claimed.
- Release APK assembly remains blocked by a Reanimated/Ninja stale native path.
- Native verification is focused rather than full 26-screen acceptance.
- Full accessibility acceptance is not claimed.
- The emulator showed a transient system UI ANR dialog; it was dismissed and not reproduced as an app fatal. Native startup was healthy after dismissal.
