# AES Guardian - Phase 2E.1 Batch 11.2.9

## Declaration List RTL Migration Report

**Final recommendation: `ACCEPTED - DECLARATION LIST VERIFIED AT SOURCE/JEST LEVEL`**

## Repository and Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- `git diff --check`: passed
- No staged changes or commits

## Exact Target and Tests

Production:

- `src/features/aes-guardian/screens/DeclarationListScreen.tsx`

Focused tests:

- `src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx`
- Related declaration workflow regression suite: `src/features/aes-guardian/__tests__/declaration-workflow.test.tsx`

Navigation:

- Route: `declarations`
- Cards navigate to `declarationDetails` with `{ declarationId }`.
- Exposed-professional footer action navigates to `newDeclaration`.
- Admin-reviewer shortcut navigates to `adminReviewQueue`.

## Data Visibility and Existing Behavior

Source and existing acceptance tests confirm:

- `exposed_professional` is permitted and the query passes its `requestingUserId`, limiting results to its own declarations.
- `admin_reviewer` is permitted to see facility-wide declarations and gets the review-queue shortcut.
- `oh_professional`, `quality_staff`, and `tech_admin` render restricted state and do not call the declaration query.
- Repository/domain authorization remains authoritative; UI role checks are an additional barrier only.

The screen has five status filter chips (`all`, `draft`, `submitted`, `under_review`, `closed`). There is no search input, pagination control, or screen-level sort implementation. The screen continues to preserve the array order returned by the existing database query; no data array or query was changed.

Existing tests cover ownership visibility, admin visibility, blocked roles, `under_review` including `resubmitted`, empty state, query error, role changes and card navigation.

## RTL Implementation

The screen now uses:

- `useLayoutDirection()`
- `getLayoutRowDirection()`
- `getLayoutTextAlign()`

Presentation changes:

- The existing `AesScreenHeader` continues to provide shared title alignment and handles the admin queue action slot.
- Filter chip content row uses shared direction without changing the filter-chip array or filter identities.
- Declaration header row places the status badge according to reading direction.
- Incident type and circumstances text use shared text alignment.
- Reference numbers and incident dates remain left-aligned so identifiers and ISO dates retain stable LTR readability.
- Replaced reference spacing `marginRight` with logical `marginEnd`.
- Empty, loading, error and restricted states remain centered; their centered alignment is intentionally direction-neutral.
- No directional arrow or search control exists on this screen.

## FR/EN/AR Assertions

| Element | FR | EN | AR |
| --- | --- | --- | --- |
| Header title | left | left | right |
| Filter chip row | row | row | row-reverse |
| Selected filter | same selected chip | same selected chip | same selected chip |
| Card header/status arrangement | row | row | row-reverse |
| Reference/date | left-aligned | left-aligned | left-aligned |
| Incident type/circumstances | locale alignment | locale alignment | right |

The added direct rendering test changes locale while a submitted-status filter is active and confirms:

- rendered row direction changes as expected;
- the same filter remains selected;
- the same filtered declaration remains visible;
- its accessible translated status label changes locale;
- the visible declaration order does not change;
- unrelated records remain filtered out.

## Verification

Focused Declaration List suite:

- Command: `npm test -- --runInBand src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx`
- Exit code: `0`
- 1 suite passed
- 34 tests passed

Declaration workflow suite:

- Command: `npm test -- --runInBand src/features/aes-guardian/__tests__/declaration-workflow.test.tsx`
- Exit code: `0`
- 1 suite passed
- 24 tests passed

Full Jest suite:

- Command: `npm test -- --runInBand`
- Exit code: `0`
- 56 suites passed
- 1227 tests passed
- 0 snapshots
- Time: `121.457 s`
- Notification-centre suite passed during this run. The previously documented intermittent concern remains separate and is not declared resolved by this run.

TypeScript:

- Command: `npx tsc --noEmit --pretty false`
- Exit code: `2`
- 769 inherited diagnostics
- No diagnostic referenced `DeclarationListScreen.tsx` or `declaration-list-details-batch4.test.tsx`.

Diff check:

- Command: `git diff --check`
- Exit code: `0`

## Scope and Limitations

Only the Declaration List screen, its focused test file, and this report were changed by this batch.

No repository query, role visibility, ownership, filtering predicate, result order, navigation, status lifecycle, audit, notification, database, schema, dependency, lockfile, or native configuration was changed.

No emulator or physical-device validation was performed. Native RTL scroll start behavior, TalkBack traversal and large-font rendering remain for the later device-validation phase.

All work remained local. No remote operation, staging, commit, branch change, destructive Git operation, dependency installation or native launch occurred.
