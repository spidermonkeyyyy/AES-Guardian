# SANAD Phantom-Inspired Welcome Implementation Report

## Result

The Android launcher opens the revised SANAD welcome screen on the existing `aesSplash` route. The screen now uses the complete central onboarding artwork from the supplied image—not only the central crest—over SANAD's forest-green theme. The black photo backdrop was removed; the original SANAD logo and wordmark remain separate in the header.

The hero includes the dark-green blob, AES declaration card, protective shield/check, complete crest, calendar, megaphone, arcs, and decorative marks. The extraction is stored locally as `src/assets/images/welcome/sanad-welcome-illustration.png`; it is a 740×700 transparent PNG derived from the supplied 832×969 image. The crop excludes the reference image's top wordmark so the approved logo remains independently rendered.

## Implementation

- `src/features/aes-guardian/screens/SplashScreen.tsx` remains the real first screen. It uses existing `darkTheme` tokens for the forest canvas, card surface, text, border, and SANAD green accent; its responsive hero uses the full local PNG.
- The header continues to use `SanadLogo` with `src/assets/images/logo/sanad_icon.png`, separate from the hero and never mirrored. A subtle theme-surface treatment improves its visibility.
- The language control uses the shared `AppIcon` Hugeicons integration (`globe`). The exact French headline remains **« Déclarer. Suivre. Prévenir. »**; the approved description and English/Arabic translations are localized.
- IBM Plex Sans, IBM Plex Sans Arabic, and Readex Pro are used through the existing font implementation. All nine expected font assets are present in the APK.
- Arabic was exercised on the installed emulator: text and selector direction render RTL while the SANAD logo remains unmirrored. French was restored afterward.
- The existing database-readiness gate, access navigation, sign-in/demo flow, and role-selection workflow were not changed.

## Verification and evidence

- Focused Jest suite: 1 suite passed, 55 tests passed.
- `npm run typecheck`: passed.
- Focused ESLint on the changed screen, localization, and test files: passed.
- Android `:app:assembleDebug`: passed.
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`
  SHA-256: `52970385D84A81E513E558A34435916372C235CC1B636AB1461DA37B4095DCEF`
- Generated and APK-embedded JavaScript bundles are byte-identical. SHA-256: `E9256BF2D55E955D1CDCB6A156ACDD367E439BF81B58050743158372EB0C2924`
- The APK contains the full illustration at `res/drawable-mdpi-v4/src_assets_images_welcome_sanadwelcomeillustration.png`; its SHA-256 matches the source PNG: `A76849CBC361D59E5C0781BAFC57DAF30750F2FC1E0AB14ED6466A51EB2C7E98`. French, English, and Arabic headline strings were found in the embedded bundle.
- The APK was installed in place on `emulator-5554` with `adb install -r`; the app was not uninstalled and its data was not cleared. The installed French welcome screenshot is `docs/screenshots/SANAD_PHANTOM_WELCOME/welcome-installed-debug.png` (SHA-256 `F05D7BA5027A34B7FBBC8F71324FAAA0371DD17BCD3A6E3D97DF6D159FE1835C`).

## Changed files

- Updated `src/features/aes-guardian/screens/SplashScreen.tsx`.
- Updated welcome accessibility translations in `src/localization/index.ts`.
- Updated `src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx`.
- Added `src/assets/images/welcome/sanad-welcome-illustration.png`.
- Added the installed-screen evidence at `docs/screenshots/SANAD_PHANTOM_WELCOME/welcome-installed-debug.png`.
- Removed the interim `src/features/aes-guardian/components/WelcomeHeroIllustration.tsx` SVG and the center-only `src/assets/images/welcome/sanad-center-emblem.png` crop; both were superseded by the full illustration.

## Preservation audit

The worktree was already dirty. Existing unrelated changes—including `src/components/RespiBadge.tsx`, the user-deleted `src/assets/images/logo/sanad_icon.jpeg`, existing reports/screenshots, and Android Gradle/build artifacts—were preserved. The Android build refreshed generated/cache artifacts; none were cleaned up. Branch remained `migration/aes-guardian` at `52e8637ce2fb523d98884f04278e3e1ed0cb1085`; no changes were staged or committed, and no branch, remote, CAPA data, or external clinical data was modified.
