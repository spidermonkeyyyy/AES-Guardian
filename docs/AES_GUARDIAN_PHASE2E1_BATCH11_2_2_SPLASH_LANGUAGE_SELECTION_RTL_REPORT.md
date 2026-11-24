# AES Guardian - Phase 2E.1 Batch 11.2.2

## Splash and Language Selection RTL Migration Report

**Final recommendation: `ACCEPTED - BOTH SCREENS VERIFIED AT SOURCE/JEST LEVEL`**

## Repository and Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Corrected lockfile SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No staged changes or commits.
- `git diff --check`: passed.

The target screens and existing onboarding test were already modified in the accumulated worktree but contained no conflicting Batch 11.2.2 changes. This batch added incremental RTL corrections and tests only.

## Production Files Changed

- `src/features/aes-guardian/screens/SplashScreen.tsx`
- `src/features/aes-guardian/screens/LanguageSelectionScreen.tsx`

No other production file was changed.

## Test File Changed

- `src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx`

No notification-centre test or production file was modified.

## SplashScreen Source Changes

- Added `useLayoutDirection()` from the existing localization infrastructure.
- Replaced the hard-coded `arrow-right` splash forward icon with:
  - `arrow-right` in LTR
  - `arrow-left` in RTL
- Preserved the existing full-screen press callback and duplicate-tap guard.
- Preserved replay, first-launch, returning-launch and storage-failure navigation behavior.
- Preserved centered wordmark and subtitle alignment.
- Added `aes-splash-forward-icon` test ID to make the rendered directional icon observable.

No splash timing or navigation destination changed.

## LanguageSelectionScreen Source Changes

- Replaced component-specific `isRTL(selectedLanguage)` logic with:
  - `useLayoutDirection()`
  - `getLayoutRowDirection()`
  - `getLayoutTextAlign()`
- Header overline, title and subtitle now use shared text alignment.
- Language cards use `row` in LTR and `row-reverse` in RTL.
- Text alignment for native-language labels and subtitles follows the active locale.
- Radio/selection indicator uses `marginEnd` instead of physical `marginLeft`.
- Added `lang-radio-fr`, `lang-radio-en`, and `lang-radio-ar` test IDs.
- Preserved FR, EN and AR locale options, locale `setLocale()` behavior, Continue navigation and accessibility props.

The card text and indicator now move according to the active layout direction without changing card state or locale contract.

## LTR/RTL Assertion Matrix

### Splash

| Locale | Forward icon | Wordmark alignment | Subtitle alignment | Callback |
| --- | --- | --- | --- | --- |
| LTR/FR | `arrow-right` | center | center | Existing splash press callback |
| RTL/AR | `arrow-left` | center | center | Existing splash press callback |

Splash text remains intentionally centered in both directions.

### Language selection

| Locale | Card direction | Title/text alignment | Indicator position/spacing |
| --- | --- | --- | --- |
| FR | `row` | left | Logical end spacing |
| EN | `row` | left | Logical end spacing |
| AR | `row-reverse` | right | Logical end spacing |

The language screen tests verify locale updates, selected state, press behavior and Continue navigation.

## Verification

### Focused onboarding/component suite

- Exit code: `0`
- 1 suite passed
- 51 tests passed
- 0 snapshots

### Target-only splash/language screen groups

- Exit code: `0`
- 1 suite passed
- 13 target tests passed
- 38 unrelated tests skipped

### Full Jest suite

- Exit code: `0`
- 56 suites passed
- 1218 tests passed
- 0 snapshots
- Time: `107.5 s`
- The notification-centre suite passed in this run.

### TypeScript

- Exit code: `2`
- 769 diagnostic lines
- No diagnostic referenced:
  - `SplashScreen.tsx`
  - `LanguageSelectionScreen.tsx`
  - `onboarding-demo-entry.test.tsx`
- Remaining diagnostics are inherited SANAD/project baseline diagnostics.

### Diff check

- Exit code: `0`
- No whitespace errors.

## Preservation

No navigation, localization, native `I18nManager`, database, schema, notification, CAPA, role, permission, dependency or lockfile changes were made.

No branch, commit, stage, remote, emulator or destructive Git operation occurred.

## Remaining Limitations

Source/Jest verification does not establish native Android RTL behavior, application restart behavior, physical-device reading order, TalkBack behavior or 200% text scaling.

The splash and language screen migration is complete only for the two authorized screens.
