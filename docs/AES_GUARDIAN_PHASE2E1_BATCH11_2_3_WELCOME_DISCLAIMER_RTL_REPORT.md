# AES Guardian - Phase 2E.1 Batch 11.2.3

## Welcome Carousel and Prototype Disclaimer RTL Report

**Final recommendation: `ACCEPTED — BOTH SCREENS VERIFIED AT SOURCE/JEST LEVEL`**

## Repository and Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Corrected lockfile SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- `git diff --check`: passed.
- No staged changes or commits.

## Exact Files Changed

Production:

- `src/features/aes-guardian/screens/WelcomeCarouselScreen.tsx`
- `src/features/aes-guardian/screens/PrototypeDisclaimerScreen.tsx`

Test:

- `src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx`

No shared component, localization contract, navigation, database, notification, CAPA, role, permission or blueprint file was changed.

## WelcomeCarouselScreen Changes

- Replaced screen-specific `isRTL(locale)` use with `useLayoutDirection()`.
- Added shared `getLayoutRowDirection()` and `getLayoutTextAlign()` helpers.
- Slide title and description now use the shared text alignment.
- Bullet rows use the shared row direction.
- Bullet text uses shared text alignment.
- Preserved slide sequence `1 -> 2 -> 3`.
- Preserved forward action semantics through `AesRoundArrowButton`.
- Preserved Skip and final Start navigation to `aesDisclaimer`.
- Preserved pagination semantics and dot rendering.
- No translation or slide content changes.

## PrototypeDisclaimerScreen Changes

- Replaced screen-specific `isRTL(locale)` use with `useLayoutDirection()`.
- Added shared row-direction and text-alignment helpers.
- Header title uses shared text alignment.
- Clause and emergency text use shared text alignment.
- Checkbox and label use shared row direction.
- The emergency clause border changed from `borderLeft*` to logical `borderStart*`.
- Preserved checkbox state, `!acknowledged` disabled behavior and demo-picker navigation.
- Preserved accessibility role, checked state and label.
- No disclaimer wording or legal/clinical text changed.

## LTR/RTL Assertion Matrix

### Welcome carousel

| Locale | Slide text alignment | Bullet direction | Forward icon |
| --- | --- | --- | --- |
| LTR/FR/EN | left | row | right |
| RTL/AR | right | row-reverse | left |

Tests verify:

- Initial slide order remains the first slide.
- Next advances to the second slide and then third slide.
- RTL forward action remains logically forward.
- Text alignment follows active locale.
- Skip navigates to `aesDisclaimer`.
- Final Start navigates to `aesDisclaimer`.

### Prototype disclaimer

| Locale | Header/clause alignment | Checkbox/label direction | Indicator |
| --- | --- | --- | --- |
| LTR/FR/EN | left | row | left of label |
| RTL/AR | right | row-reverse | right of label |

Tests verify:

- Checked state toggles from false to true.
- Accept remains disabled until acknowledged.
- Checked acknowledgement enables accept.
- Disabled accept does not navigate.
- Valid acknowledgement navigates to `aesDemoPicker`.
- Checkbox accessibility role/state remains intact.

## Verification

### Focused onboarding suite

- Exit code: `0`
- 1 suite passed
- 53 tests passed
- 0 snapshots
- Time: `11.551 s`

### Target carousel/disclaimer groups

- Exit code: `0`
- 9 target tests passed
- 44 unrelated tests skipped
- 0 snapshots

### Full Jest suite

- Exit code: `0`
- 56 suites passed
- 1220 tests passed
- 0 snapshots
- Time: `121.771 s`
- Notification-centre suite passed in this run.

### TypeScript

- Exit code: `2`
- 769 inherited diagnostic lines
- No diagnostic referenced:
  - `WelcomeCarouselScreen.tsx`
  - `PrototypeDisclaimerScreen.tsx`
  - `onboarding-demo-entry.test.tsx`

### Diff check

- Exit code: `0`

## Remaining Limitations

Native application RTL behavior, I18nManager restart behavior, physical-device rendering, TalkBack reading order and 200% font scaling remain unverified.

The notification-centre intermittent badge concern remains independent and was not modified in this batch.
