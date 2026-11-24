# AES Guardian - Phase 2E.1 Batch 11.1.2C

## RTL Test Completion and Suite Diagnostic Report

**Recommendation: `ACCEPTED - RTL ASSERTIONS COMPLETE AND REGRESSION EVIDENCE SUFFICIENT`**

## Repository and Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Corrected lockfile SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No staged changes or commits.
- `git diff --check` passed.

No production source, dependency, lockfile, database, schema, notification, CAPA, role, permission, remote, or Git state behavior was changed.

## Test Files Changed

This batch changed one test file:

- `src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx`

The following test files already contained Batch 11.1 or earlier Batch 11.1.2 work and were inspected but not modified again by this batch:

- `src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- `src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx`

The existing production source and all accumulated working-tree modifications were preserved.

## RTL Assertions Added

### AesRoundArrowButton

Direct rendered icon assertions now cover:

| Locale | Action | Expected icon |
| --- | --- | --- |
| LTR | Forward | `arrow-right` |
| LTR | Back | `arrow-left` |
| RTL | Forward | `arrow-left` |
| RTL | Back | `arrow-right` |

The test asserts the actual `Icon.props.name` for each rendered control. Existing callback, disabled, role, and accessibility behavior remains in the same suite.

### AesScreenHeader

Direct assertions now cover:

- LTR top-row direction: `row`
- RTL top-row direction: `row-reverse`
- LTR title alignment: `left`
- RTL title alignment: `right`
- LTR back chevron: `chevron-left`
- RTL back chevron: `chevron-right`

### AesOptionCard

The existing locale-change test now verifies:

- LTR container row direction: `row`
- RTL container row direction: `row-reverse`
- LTR title text alignment: `left`
- RTL title text alignment: `right`
- Press remains dispatchable.

Existing selection, radio/checkbox role, disabled state, and accessibility-state assertions remain covered in the suite.

### Locale Fallback

The fallback test now explicitly verifies:

- `fr`, `en`, and `ar`
- unsupported locale string
- empty string
- `null`
- `undefined`
- malformed object value

Unsupported and malformed values resolve to LTR.

## RTL Coverage Matrix

| Behavior | LTR | RTL | Determination |
| --- | --- | --- | --- |
| Locale resolver | FR/EN -> LTR | AR -> RTL | Direct |
| Unknown fallback | Unsupported -> LTR | N/A | Direct |
| Row direction | `row` | `row-reverse` | Direct |
| Text alignment | `left` | `right` | Direct |
| Arrow forward | `arrow-right` | `arrow-left` | Direct |
| Arrow back | `arrow-left` | `arrow-right` | Direct |
| Header back chevron | `chevron-left` | `chevron-right` | Direct |
| Option-card order | Row | Row-reverse | Direct |
| Option-card text | Left | Right | Direct |

## Notification-Centre Regression Investigation

The previously observed workspace badge failure was:

`workspace badge refreshes across single-read, bulk-read, and identity switches`

Observed assertion:

- Expected `queryByTestId('workspace-unread-badge')` to return null after bulk read and focus regain.
- A badge view remained observable during the failing run.

Reproduction sequence:

1. One complete notification-centre suite run failed with 43/44 tests, including this badge lifecycle test.
2. The notification-centre suite was rerun independently and passed 44/44.
3. The failing badge lifecycle test was rerun alone by name and passed: 1 passed, 43 skipped.
4. The final bounded full-suite rerun passed:
   - 56 suites
   - 1214 tests
   - Notification-centre suite passed
   - No notification badge failure remained

The result is not enough to identify a production defect. The available evidence instead points to suite timing/state sensitivity or asynchronous lifecycle timing in the earlier runs. The test and production guard were not weakened or changed.

No unresolved promise or shared mock leak was proven by source evidence. The test suite uses database reset and role reset in setup/teardown and has mock restore in several nested sections.

## Verification

### Focused onboarding/component suite

- Exit code: `0`
- 1 suite passed
- 47 tests passed
- 0 snapshots

### Relevant localization/directional suites

- Exit code: `0`
- 3 suites passed
- 89 tests passed

### Focused notification-centre suite

- The complete focused rerun initially failed 1/44.
- The lifecycle test passed alone.
- The final bounded full-suite rerun passed the notification-centre suite.

### Full Jest suite

- Exit code: `0`
- 56 suites passed
- 1214 tests passed
- 0 snapshots
- Time: `114.409 s`

### TypeScript

- Exit code: `2`
- 769 diagnostic lines
- No changed-test diagnostic was found for `onboarding-demo-entry.test.tsx`.
- The historical inherited SANAD baseline remains present.

### Diff check

- `git diff --check`: exit code `0`

## Remaining Limitations

Native `I18nManager` behavior, application restart, physical-device RTL layout, TalkBack, and 200% font scaling remain outside this test-only batch.

The notification suite showed non-reproducible timing-sensitive failure evidence across separate runs. The final full run was green, but the earlier isolated/full-suite discrepancy should remain in the regression record for future review.
