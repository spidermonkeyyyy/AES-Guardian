# SANAD Liquid Glass Navigation Integration

## Result

Integrated a native, role-aware bottom navigator into the SANAD workspace. It uses the existing React Navigation, Reanimated, Safe Area Context, theme, `AppText`, `AppIcon` and Hugeicons infrastructure. No dependency, route authorization, database, schema, or business workflow was changed.

## Reference study and native mapping

Read the complete supplied `C:\Users\User\Downloads\liquid-glass-navbar.tsx` (581 lines) and `C:\Users\User\Downloads\demo.tsx` (43 lines) before continuing implementation.

The original “Waterline” design uses a floating pill with a translucent, inset-rim glass surface; a WebGL shader for specular highlights, iridescence, distortion and ambient waves; and a two-mass spring indicator whose delayed tail can split into droplets and settle with a ripple. It measures DOM geometry, reacts to browser pointer movement, and optionally runs per-icon CSS scenes and synthesized sound. Its semantic controls retain visible labels, identify the active item, support keyboard navigation and disable motion under the reduced-motion preference. The demo chooses light tone, the first active item and `sound={false}`.

The SANAD implementation preserves the floating rounded surface, layered translucency, restrained rim/reflection and depth, green selected treatment, visible labels, safe-area spacing, and a moving, spring-driven active pill. A small horizontal stretch tied to remaining spring distance supplies a restrained liquid deformation. This uses `withSpring` (damping 20, stiffness 190, mass 0.7), not a continuously running loop. `useReducedMotion` moves directly to the selected position and retains the static highlight.

Browser-specific DOM/CSS, canvas, WebGL, filters, pointer listeners, `requestAnimationFrame`, `ResizeObserver`, browser visibility APIs, browser audio, and SVG icon drawing were not ported. The translucent themed surface and native reflection are the blur/refraction fallback; droplet splitting, ripples and individual icon scenes are intentionally omitted. Sound remains disabled. No WebView or new dependency was introduced.

## Navigation architecture and role mapping

`AppNavigator` now hosts `AesGuardianTabNavigator` at the existing `aesGuardianWorkspace` stack route and hides that route's stack header. The existing root stack routes remain registered, so details, forms, review actions, coordination, CAPA and other secondary workflows continue through their existing navigation relationships. Onboarding and access routes remain outside the tab navigator.

The visual component accepts typed items, an active key and a callback; it contains no route names or business logic. The navigator derives items from the current `AuthContext` using the existing permission guards. An active-role key remounts the tab navigator when permissions change. Selection callbacks navigate only to routes present in the current tab state. If an active key is absent from the provided items, the component exposes no selected tab and hides the indicator.

| Canonical role | Accueil | Déclarer | Suivi | Prévention | Profil |
|---|---|---|---|---|---|
| `exposed_professional` | Existing workspace | Existing declaration form | Own declaration list | Not available | Existing profile |
| `admin_reviewer` | Existing workspace | Not available | Existing administrative review queue | Existing read-only prevention register | Existing profile |
| `oh_professional` | Existing workspace | Not available | Existing occupational-health coordination queue | Existing prevention register | Existing profile |
| `quality_staff` | Existing workspace | Not available | Existing aggregate surveillance dashboard | Existing prevention overview | Existing profile |
| `tech_admin` | Existing workspace | Not available | Not available | Not available | Existing profile |

This keeps declarations and identifiable clinical records out of the quality and technical roles' tabs, and does not grant technical administration clinical authority.

## Visual system, icons and localization

Navigation icons use the shared Hugeicons-backed `AppIcon` registry: `home`, `document-add`, `clipboard-list` / `activity`, `target`, and `user`. No icon set or duplicate icon system was added.

Labels use the existing localization system:

| Locale | Home | Report | Follow-up | Prevention | Profile |
|---|---|---|---|---|---|
| French | Accueil | Déclarer | Suivi | Prévention | Profil |
| English | Home | Report | Follow-up | Prevention | Profile |
| Arabic | الرئيسية | الإبلاغ | المتابعة | الوقاية | الملف الشخصي |

Arabic items are placed in reverse physical order while keeping nondirectional icons unmirrored. The active index is computed from that visual order, so its selected state follows the RTL position.

Each destination is a labelled `tab` with `accessibilityState.selected`; the bar is a labelled `tablist`. Labels remain visible and can scale up to the component's supported multiplier. Targets have a 56 dp minimum height. Safe-area insets are respected, and the tab bar hides while the keyboard is open.

## Source changes

- `src/navigation/LiquidGlassNavigation.tsx` — reusable native glass navigation surface, active indicator, RTL order, accessible tabs, reduced-motion and restricted-item behavior.
- `src/navigation/AesGuardianTabNavigator.tsx` — nested tab navigator and guard-driven mapping to existing screens.
- `src/navigation/AppNavigator.tsx` — integrates the nested navigator at the current workspace route.
- `src/localization/index.ts` — adds the six tab/accessibility translation keys in French, English and Arabic.
- `src/navigation/__tests__/LiquidGlassNavigation.test.tsx` — labels, selected state, callback, RTL ordering, spring/reduced motion, empty and missing-active-key behavior.
- `src/navigation/__tests__/AesGuardianTabNavigator.test.tsx` — all five role maps, locales, role switching, and rendering/navigation to each authorized existing destination.

No package manifest or lockfile changed. No business or authorization rules were modified.

## Validation

- `npm test -- --runInBand --silent` — **54 suites passed, 1,176 tests passed**.
- `npm run typecheck` — passed.
- Targeted ESLint on the changed navigation, localization and test files — passed.
- `git diff --check` — passed.
- `android\gradlew.bat assembleDebug` — **BUILD SUCCESSFUL**.
- Installed the final debug APK in place with `adb install -r`; package `com.sanad` launched successfully. Existing application data was not cleared.
- Emulator: `l3andalib_2`, `sdk_gphone16k_x86_64`; large display 1220×2712 at 480 dpi. Compact display check used 720×1600 at 320 dpi and the emulator was restored to its original size and density.
- Android UI hierarchy exposed each tab's localized accessibility label and selected state. Verified role filtering, RTL ordering, active destination, keyboard-hidden navigation, form actions above the bar, and Android back returning to the workspace. No declaration or other business record was created or submitted.
- Manual TalkBack speech output and non-default system font scaling were not independently exercised. Automated accessibility-state/label tests passed.

## Android build artifact

- APK: `android\app\build\outputs\apk\debug\app-debug.apk`
- Size: 190,412,471 bytes
- SHA-256: `840DB12C2B044E6A275DEEB74BC4D5AAB0BDDE90EEB6FCBE287C8E279C146349`
- Installed on `l3andalib_2` after the final source build.

## Device evidence

Actual emulator captures are in `docs/screenshots/SANAD_LIQUID_GLASS_NAVIGATION_INTEGRATION/`. They include:

- `02-after-welcome.png`, `03-demo-role-picker.png` — onboarding/access flow and demo roles.
- `04-exposed-arabic-home.png`, `05-exposed-arabic-declaration.png`, `06-exposed-arabic-followup.png` — exposed-professional destinations.
- `07-quality-arabic-home.png`, `08-quality-arabic-surveillance.png`, `09-quality-arabic-prevention.png` — quality-role limits and aggregate/prevention screens.
- `10-admin-arabic-home.png`, `11-admin-arabic-review.png`, `12-admin-arabic-prevention.png` — reviewer-role limits and authorized workflows.
- `13-oh-arabic-home.png`, `14-oh-arabic-followup.png` — occupational-health role.
- `15-tech-arabic-home.png`, `16-tech-arabic-profile.png` — technical role's limited navigation and profile restrictions.
- `19-tech-home-fr.png`, `23-tech-profile-en.png`, `24-tech-home-en.png`, `25-exposed-en-home.png`, `26-exposed-en-declaration.png` — live French and English labels.
- `28-small-screen-exposed.png` — compact-width layout at 720×1600.
- `27-android-back.png`, `31-keyboard-open.png` — back behavior and keyboard hiding the tab bar.
- `32-installed-build-arabic-home.png` — final installed build in Arabic.
- `33-followup-selection-loading.png`, `34-followup-destination-settled.png` — selection feedback during destination loading and the settled destination.

Some screens show the application's pre-existing synthetic demo records. They were not created, edited or submitted during this navigation verification.

## Git preservation record

Initial baseline recorded at `2026-11-25 12:13:38 +01:00`:

- Branch `migration/aes-guardian`; HEAD `7817d7428467ddcfc5cf8718116d8fda15181e84`; upstream `origin/migration/aes-guardian`.
- Index was clean; nothing was staged.
- Pre-existing tracked work included generated Gradle/`android/compat/build` outputs and these RTL remediation files: `src/features/aes-guardian/__tests__/declaration-list-migration.test.tsx`, `src/features/aes-guardian/__tests__/workspace-screen.test.tsx`, `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`, `src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx`, and `src/features/aes-guardian/screens/DeclarationListScreen.tsx`.
- Pre-existing untracked paths included `android/compat-pointer-events/build/`, `src/localization/demoNarratives.ts`, `docs/SANAD_ARABIC_RTL_REMEDIATION_AND_GLOBAL_DEVICE_VERIFICATION_REPORT.md`, and `docs/screenshots/SANAD_ARABIC_RTL_REMEDIATION/`.

Final baseline:

- Branch, HEAD and upstream are unchanged; nothing was staged or committed.
- Feature source and tests are the six paths listed under **Source changes**. The report and device screenshots are new task evidence.
- The pre-existing RTL work remains in place. Android generated/cache outputs remain dirty after the required build; they were not reverted or cleaned. The generated `android/compat-pointer-events/build/` tree and the existing RTL report/screenshots were preserved.
- No remote, branch, dependency manifest, database schema or production data was changed.
- Final `git status --short --branch --untracked-files=normal`:

```text
## migration/aes-guardian...origin/migration/aes-guardian
 M android/.gradle/8.11.1/executionHistory/executionHistory.bin
 M android/.gradle/8.11.1/executionHistory/executionHistory.lock
 M android/.gradle/8.11.1/fileHashes/fileHashes.bin
 M android/.gradle/8.11.1/fileHashes/fileHashes.lock
 M android/.gradle/8.11.1/fileHashes/resourceHashesCache.bin
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
 M src/features/aes-guardian/__tests__/declaration-list-migration.test.tsx
 M src/features/aes-guardian/__tests__/workspace-screen.test.tsx
 M src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx
 M src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx
 M src/features/aes-guardian/screens/DeclarationListScreen.tsx
 M src/localization/index.ts
 M src/navigation/AppNavigator.tsx
?? android/compat-pointer-events/build/
?? docs/SANAD_ARABIC_RTL_REMEDIATION_AND_GLOBAL_DEVICE_VERIFICATION_REPORT.md
?? docs/SANAD_LIQUID_GLASS_NAVIGATION_INTEGRATION_REPORT.md
?? docs/screenshots/SANAD_ARABIC_RTL_REMEDIATION/
?? docs/screenshots/SANAD_LIQUID_GLASS_NAVIGATION_INTEGRATION/
?? src/localization/demoNarratives.ts
?? src/navigation/AesGuardianTabNavigator.tsx
?? src/navigation/LiquidGlassNavigation.tsx
?? src/navigation/__tests__/AesGuardianTabNavigator.test.tsx
?? src/navigation/__tests__/LiquidGlassNavigation.test.tsx
```

## Known limitations

The native surface approximates blur/refraction with translucent color and layered highlights; it does not reproduce the original shader's iridescence, droplet splitting or ripple simulation. These omissions avoid browser/WebGL APIs and continuous rendering while retaining the recognizable moving liquid-pill treatment. A release APK was not built; Android verification used the project's debug build.

The spring path and reduced-motion behavior are verified by component tests. Device screenshots document selected states and navigation results, not a frame-by-frame animation recording.
