# AES Guardian - Phase 2E.1 Batch 11.1.1

## Independent Shared RTL / Layout-Direction Audit

**Verdict: `CONDITIONALLY ACCEPTED - BOUNDED EVIDENCE GAP`**

## Repository and Preservation

- Repository root: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No staged changes or commits were present.
- `git diff --check` passed.
- No remote, fetch, pull, push, merge, dependency, emulator, branch, reset, restore, or destructive operation was performed.

## Actual Batch 11.1 Diff

Only the six implementation/test/report files reported for Batch 11.1 were associated with this audit:

- `src/localization/index.ts`
- `src/features/aes-guardian/components/AesScreenHeader.tsx`
- `src/features/aes-guardian/components/AesRoundArrowButton.tsx`
- `src/features/aes-guardian/components/AesOptionCard.tsx`
- `src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx`
- `src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx`

The report file `docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_SHARED_RTL_LAYOUT_DIRECTION_REPORT.md` is untracked implementation evidence.

The accumulated working tree was not clean; other prior modifications remained untouched. Batch 11.1 did not change notification repositories, SQL, schemas, migrations, event types, CAPA transactions, role or permission boundaries, themes, package manifests, or lockfiles.

No `I18nManager.forceRTL` or `I18nManager.allowRTL` call was found.

## Locale and Direction Findings

`SupportedLocale` is exactly `fr | en | ar`, and `SUPPORTED_LOCALES` contains only those three identifiers.

`resolveLayoutDirection(locale: unknown)` is deterministic:

- `ar` resolves `rtl`
- `fr`, `en`, and every non-`ar`/unknown value resolve `ltr`
- null, empty, malformed, and unsupported values safely fall back to `ltr`

This fallback means unsupported identifiers cannot activate RTL. Regional variants are not supported by the application's actual locale type or `setLocale`; `ar-TN`, `fr-TN`, and `en-US` would be outside the locale contract rather than validated regional variants.

`getLayoutRowDirection` maps `rtl` to `row-reverse` and `ltr` to `row`. `getLayoutTextAlign` maps `rtl` to `right` and `ltr` to `left`.

`useLayoutDirection()` calls `useLocale()`. The existing `useLocale()` hook initializes from `currentLocale` and subscribes to `setLocale()` notifications, so locale changes rerender subscribed components through the established mechanism. There is no separate direction store or independent stale direction state. The implementation introduces no circular dependency.

Existing localization exports remain compatible. `isRTL()` now delegates to the pure resolver.

## Component Findings

### AesScreenHeader

- Derives direction through `useLayoutDirection()`.
- Applies `row-reverse` to the top row and logical text alignment to overline, title, and subtitle.
- Uses `marginEnd` for the badge slot.
- Back icon remains navigation-direction aware: right chevron in RTL and left chevron in LTR.
- The new top-row test ID is additive and does not affect existing interactions or accessibility.
- No global layout mirroring or native configuration was added.

The top-row mirroring and left/right chevron meaning are coherent. The header back accessibility label remains existing French text and was not broadened by this batch.

### AesRoundArrowButton

- Derives direction from the shared hook.
- The forward/back meanings are implemented as navigation semantics:
  - Forward = left arrow in RTL and right arrow in LTR.
  - Back = right arrow in RTL and left arrow in LTR.
- Callback, role, disabled state, touch target, test ID, and accessibility label remain intact.
- Non-directional icons are not mirroring through this component.

### AesOptionCard

- Derives direction from the shared hook.
- Uses `row-reverse` in RTL and `row` in LTR.
- Applies logical text alignment and `marginEnd`.
- Press, radio/checkbox role, selection state, disabled state, test ID, and accessibility label behavior remain intact.
- The prior physical `marginRight` was replaced with `marginEnd`; no duplicate physical/logical margin remains.

## Test Quality and Gaps

The onboarding suite directly verifies:

- FR/EN/AR resolver behavior.
- Unknown and undefined fallback.
- Row direction helpers.
- Text alignment helpers.
- Locale changes propagate to header and option-card layout.
- Existing button/card interactions.

The RTL round-arrow test only verifies that the component renders under Arabic. It does not directly assert the forward or back icon in both locales.

The header test verifies Arabic rendering and locale-driven top-row direction, but not the exact back chevron name or text alignment in both directions.

The option-card test verifies RTL row reversal after locale change but not a direct RTL text-alignment assertion.

The surveillance dashboard suite verifies RTL mock layout and shared-header rendering, but it does not exercise the real locale hook or real resolver.

Null and empty strings are safe in source but are not named explicit test cases. This is a bounded test assertion gap, not a source defect.

## Verification

Focused onboarding/component suite:

- Exit code `0`
- 1 suite passed
- 47 tests passed

Relevant localization/directional suites:

- Exit code `0`
- 3 suites passed
- 89 tests passed

Surveillance dashboard RTL suite:

- Exit code `0`
- 1 suite passed
- 80 tests passed

Full Jest suite rerun:

- Exit code `1`
- 55 suites passed
- 1 notification-centre suite failed
- 1213 tests passed
- 1 test failed
- 0 snapshots
- Failure: existing workspace badge test expected no `workspace-unread-badge` after bulk-read/identity switch, but received a remaining badge view.
- The notification-centre suite passed independently afterward: 44/44 tests passed.
- The isolated pass indicates a suite-order or timing-related full-run failure, not a Batch 11.1 RTL source failure. The full-suite result is not accepted as a clean 56-suite pass in this audit.

Full Jest had previously passed 56 suites/1214 tests in a separate run, but this independent rerun produced the notification-centre failure described above. The reported 56-suite pass is therefore not reproducible on every rerun.

TypeScript:

- Exit code `2`
- 769 diagnostic lines
- No diagnostic attributable to `src/localization/index.ts`, the three migrated components, or the two added/updated RTL test areas.
- Diagnostics are in inherited non-Batch-11.1 files.

`git diff --check`: passed.

## Acceptance Boundary and Defects

No source defect was found in the shared resolver, hook, or migrated components.

The bounded evidence gaps are:

1. The round-arrow test does not explicitly assert forward/back arrow names in LTR and RTL.
2. The option-card test does not directly assert text alignment.
3. The header test does not directly assert back-chevron meaning and text alignment in both directions.
4. The implementation report's full-suite pass is not independently stable across reruns because one notification-centre test failed in the full run and passed in isolation.
5. Native RTL behavior, TalkBack, 200% font scaling, and physical-device rendering remain untested.

Acceptance is limited to the application-level JavaScript direction foundation and the three migrated shared components.
