# AES Guardian - Phase 2E.1 Batch 11.2.4

## Demo Account Picker RTL Report

**Final recommendation: `ACCEPTED - DEMO PICKER VERIFIED AT SOURCE/JEST LEVEL`**

## Repository and Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- `git diff --check`: passed.
- No staged changes or commits.

## Exact Files Changed

Production:

- `src/features/aes-guardian/screens/DemoAccountPickerScreen.tsx`

Test:

- `src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx`

No shared component, role store, role definitions, authentication, localization, navigation, database, notification or business source was changed.

## Screen-Level Changes

- Replaced screen-specific `isRTL(locale)` use with `useLayoutDirection()`.
- Added shared `getLayoutRowDirection()` and `getLayoutTextAlign()` helpers.
- Header title and subtitle use shared text alignment.
- Synthetic identity banner uses the shared row direction and shared text alignment.
- Replaced `bannerIcon.marginRight` with logical `marginEnd`.
- Role arrays and role IDs remain unchanged.
- `AesOptionCard` remains the canonical role-card implementation; no role array reversal or duplicate indicator logic was added.

No role/store or navigation behavior changed.

## Canonical Role and User-ID Preservation

| Role key | User ID | Demonstration code |
| --- | --- | --- |
| `exposed_professional` | 1 | `NURSE-001` |
| `admin_reviewer` | 2 | `ADMIN-001` |
| `oh_professional` | 3 | `OCC-001` |
| `quality_staff` | 4 | `QUAL-001` |
| `tech_admin` | 5 | `ADMIN-TECH` |

Tests verify:

- The role array contains exactly five canonical keys.
- No alias or deprecated role is present.
- Each evaluator code maps to the expected role key.
- Selecting then entering updates the role store to the exact key.
- The active context role and user ID match the same canonical role.
- Selection does not update the role store before pressing Enter.

## LTR/RTL Assertion Matrix

| Locale | Header alignment | Banner direction | Role-card direction | Indicator/text behavior |
| --- | --- | --- | --- | --- |
| FR | left | row | row | LTR option-card behavior |
| EN | left | row | row | LTR option-card behavior |
| AR | right | row-reverse | row-reverse | RTL option-card behavior |

Direct tests verify the French and English titles align left and the Arabic title aligns right. FR/EN role cards are `row`; AR role cards are `row-reverse`. Existing option-card radio semantics remain intact.

## Workflow and Accessibility Preservation

- The Enter action uses the existing `setRole(selectedRole)` flow.
- First-launch completion remains fail-safe and non-blocking.
- Navigation remains `replace('aesGuardianWorkspace')`.
- Duplicate-enter protection remains in source.
- Role cards retain radio role, selected state, disabled state and accessibility labels.
- No password, PIN or credential field was introduced.

## Verification

Focused demo account picker group:

- Exit code: `0`
- 9 demo-picker tests passed
- 46 unrelated tests skipped

Relevant onboarding/component suite:

- Exit code: `0`
- 1 suite passed
- 55 tests passed

Full Jest suite:

- Exit code: `0`
- 56 suites passed
- 1222 tests passed
- 0 snapshots
- Time: `123.627 s`
- Notification-centre suite passed in this run.

TypeScript:

- Exit code: `2`
- 769 inherited diagnostic lines
- No diagnostic referenced `DemoAccountPickerScreen.tsx` or `onboarding-demo-entry.test.tsx`.

Diff check:

- Exit code: `0`

## Remaining Limitations

Native RTL layout, I18nManager restart behavior, physical-device rendering, TalkBack reading order and 200% font scaling remain unverified.

No notification-centre test or production code was changed. The independent notification badge concern remains open.
