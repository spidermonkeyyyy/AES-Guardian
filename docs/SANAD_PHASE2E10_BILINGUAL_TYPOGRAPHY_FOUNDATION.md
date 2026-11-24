# SANAD Phase 2E.10 - Bilingual Typography Foundation

**Verdict: PARTIALLY ACCEPTED**

The centralized bilingual typography foundation is implemented and passed source/Jest verification. Native glyph rendering remains separately unverified because no healthy Android environment was available; the APK build is also pending final completion.

## Preflight and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `D26A8FB77DB757189E26A38D784C4148DA599EB7E0A80EFCD081CA282483151B`
- Preflight status inventory: 328 paths
- Staged files: zero
- No dependencies or lockfile changes were made.
- No repository branch, commit, reset, clean, restore, remote, or metadata operation was performed.

## Approved typography

### Latin interface and reading text

IBM Plex Sans static files are bundled for:

- Regular / 400
- Medium / 500
- SemiBold / 600
- Bold / 700

### Arabic interface and reading text

IBM Plex Sans Arabic static files are bundled for:

- Regular / 400
- Medium / 500
- SemiBold / 600
- Bold / 700

### Selected headings

Readex Pro is bundled as its official variable TTF from Google Fonts. Weight resolution is available at 500 and 600 through variable-font weight data. Native variable-weight rendering on React Native 0.76.9 Android could not be visually confirmed in this pass.

## Semantic architecture

`src/theme/tokens/fontFamilies.ts` now exposes:

- Weight-specific IBM Plex Sans Latin and Arabic families
- Readex Pro as the heading family
- `TypographyRole`
- `TypographyRoleTokens`
- `getTypographyRoleTokens`
- `getAppFontFamily`
- `getAppFontWeight`

The initial role scale includes hero 36/44/700, page title 28/36/700, secondary page title 24/32/700, section heading 20/28/600, card heading 18/26/600, subheading 16/24/500, body 15/24/400, secondary body 14/22/400, button 15/22/500, form label 14/20/500, caption 12/18/400, and metadata 12/18/400.

`aesTypography` was migrated to the new centralized scale. Arabic line heights remain the same initial tokens pending native optical verification.

## Shared component integration

`AppText` and `AppTextInput` now:

- Resolve locale-aware semantic families
- Apply semantic weights when callers do not explicitly provide a weight
- Preserve intentional explicit custom font families
- Replace legacy Young Serif, Instrument Sans, Ramis, Open Sans, and Urbanist family strings with the active bilingual semantic selection

`SanadUiKittenProvider` now maps Eva body, subtitle, caption, and label families and weights to SANAD typography while retaining the existing `ThemeProvider > SanadUiKittenProvider > MainApp` nesting.

The declaration list uses:

- IBM Plex for metadata and circumstances
- Readex Pro for the declaration reference card heading
- IBM Plex for status and filter/action interface text
- Arabic IBM Plex for Arabic text
- Existing RTL and row layout remain unchanged

## Font assets

Bundled under `android/app/src/main/assets/fonts`:

- `IBMPlexSans-Regular.ttf`
- `IBMPlexSans-Medium.ttf`
- `IBMPlexSans-SemiBold.ttf`
- `IBMPlexSans-Bold.ttf`
- `IBMPlexSansArabic-Regular.ttf`
- `IBMPlexSansArabic-Medium.ttf`
- `IBMPlexSansArabic-SemiBold.ttf`
- `IBMPlexSansArabic-Bold.ttf`
- `ReadexPro-Variable.ttf`
- `LICENSE-IBMPlexSans.txt`
- `LICENSE-IBMPlexSansArabic.txt`
- `OFL-ReadexPro.txt`

The exact asset SHA-256 inventory is saved in:

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\font-hashes.txt`

The fonts were downloaded from:

- IBM Plex official repository
- Google Fonts official Readex Pro distribution

The licenses are bundled with the font assets. No unverified third-party font source or font-loading dependency was used.

## Old typography retirement

The active shared typography no longer names Young Serif or Instrument Sans. The Android text assets for Young Serif, Instrument Sans, Open Sans, and Urbanist were removed. Legacy names remain only as compatibility migration guards and historical tests; they do not resolve to active assets.

Icon fonts and their assets were not removed.

## Automated verification

### Focused typography

- 4 suites passed
- 23 tests passed

### Focused declaration

- 3 suites passed
- 67 tests passed

### Full Jest

- 63 suites passed
- 1,314 tests passed

### TypeScript

- 684 diagnostics, unchanged from the historical baseline
- No changed Phase 2E.10 source file diagnostic was returned

### ESLint

The repository remains blocked by the missing ESLint 9 `eslint.config.*` configuration.

### Android build

A fresh isolated Android debug build completed successfully using the established compatibility procedure:

- APK size: `183769733` bytes
- APK SHA-256: `A7C8DCB6428F565F16983D5B340D9E79D77CEF4214C8D5FA1D031A158F02C829`
- Embedded bundle size: `2357228` bytes
- Embedded bundle SHA-256: `8B5631144A1FA9B7A2F54B8928909602910F06C6E587A68383434931127A2A21`

Native execution was not performed. The bundle/build prove packaging, not glyph rendering.

## Native limitations

No healthy Android environment is available for typography visual acceptance. The AVD used by earlier native verification remained blocked by `com.android.systemui` ANRs, and no second AVD or physical device was available. Source tests distinguish:

- Font-family resolution
- Weight resolution
- LTR/RTL independence
- Mixed-script text configuration
- Accented and diacritic text configuration

They do not prove native glyph shaping or variable-font rendering.

## Remaining checks

The following require a healthy Android environment:

- Native IBM Plex and Readex glyph rendering
- Arabic diacritic shaping
- Large accessibility font scaling
- French/English/Arabic declaration list overflow
- Filter/action clipping
- Input placeholder and entered-text visibility
- Readex variable 500/600 rendering

## Final preservation audit

- Preflight status: 328 paths
- Final status: 345 paths
- Staged files: zero
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `D26A8FB77DB757189E26A38D784C4148DA599EB7E0A80EFCD081CA282483151B`
- `git diff --check`: passed
- No dependency manifest or lockfile change was made.

## Files changed

- `src/theme/tokens/fontFamilies.ts`
- `src/theme/tokens/aesTypography.ts`
- `src/theme/tokens/index.ts`
- `src/components/AppText.tsx`
- `src/components/AppTextInput.tsx`
- `src/theme/SanadUiKittenProvider.tsx`
- `src/features/aes-guardian/components/AesScreenHeader.tsx`
- `src/features/aes-guardian/screens/DeclarationListScreen.tsx`
- `src/theme/__tests__/bilingual-typography.test.tsx`
- `src/theme/__tests__/SanadUiKittenProvider.test.tsx`
- `src/components/__tests__/AppIcon.test.tsx`
- `src/features/authentication/__tests__/entry-experience.test.tsx`
- `src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx`
- `src/features/aes-guardian/__tests__/declaration-list-migration.test.tsx`
- Android font assets and license files
- `docs/SANAD_PHASE2E10_BILINGUAL_TYPOGRAPHY_FOUNDATION.md`
