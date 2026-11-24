# AES Guardian - Phase 2E.1 Batch 11.1

## Shared RTL / Layout-Direction Infrastructure Report

## Repository State

- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `59DA2C875354DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No staging or commits occurred.

## Implementation

The existing localization module is the authoritative locale source.

Added typed application-level direction API:

- `LayoutDirection = 'ltr' | 'rtl'`
- `resolveLayoutDirection(locale: unknown): LayoutDirection`
- `getLayoutRowDirection(direction): 'row' | 'row-reverse'`
- `getLayoutTextAlign(direction): 'left' | 'right'`
- `useLayoutDirection(): LayoutDirection`

Resolution behavior:

- `fr` -> `ltr`
- `en` -> `ltr`
- `ar` -> `rtl`
- any unknown or unsupported value -> `ltr`

`useLayoutDirection()` derives from `useLocale()`, so it follows the existing locale subscription and cannot maintain a separate locale/direction source of truth.

Global `I18nManager.forceRTL` and `I18nManager.allowRTL` were not changed.

## Shared Component Migration

Migrated the following reused AES Guardian components:

- `AesScreenHeader`
  - Uses the shared direction hook.
  - Uses logical text alignment and `marginEnd`.
  - Applies direction-aware `row` / `row-reverse` to the top row.
  - Preserves the existing back chevron meaning.
- `AesRoundArrowButton`
  - Uses the shared direction hook.
  - Preserves forward/back navigation meaning.
- `AesOptionCard`
  - Uses the shared direction hook.
  - Uses logical text alignment.
  - Preserves the existing RTL `row-reverse` layout and `marginEnd`.

No business logic, database behavior, notification behavior, or native layout configuration was changed.

## Tests

Focused onboarding/component tests:

- 1 suite passed
- 47 tests passed

Relevant localization and directional screen tests:

- 3 suites passed
- 89 tests passed

Surveillance dashboard RTL suite:

- 1 suite passed
- 80 tests passed

Full Jest suite:

- 56 suites passed
- 1214 tests passed
- 0 snapshots
- Time: `115.589 s`

TypeScript:

- Exit code: `2`
- Diagnostic count: `769`
- Historical inherited SANAD diagnostics remain unchanged.
- No claim is made that the complete project type-checks successfully.

`git diff --check` passed.

## Native Boundary

This batch establishes JavaScript/application-level direction behavior only. It does not establish complete native RTL support. Native `I18nManager` configuration, application restart behavior, native text mirroring, and physical-device RTL rendering remain for later validation.

## Changed Files

The implementation changed:

- `src/localization/index.ts`
- `src/features/aes-guardian/components/AesScreenHeader.tsx`
- `src/features/aes-guardian/components/AesRoundArrowButton.tsx`
- `src/features/aes-guardian/components/AesOptionCard.tsx`
- `src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx`
- `src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx`

Existing accumulated working-tree modifications were preserved. No dependencies or lockfile were changed, and no staging or commits occurred.
