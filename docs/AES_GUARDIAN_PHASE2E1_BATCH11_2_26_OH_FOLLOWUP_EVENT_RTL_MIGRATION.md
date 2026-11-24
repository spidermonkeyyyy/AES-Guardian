# AES Guardian - Phase 2E.1 Batch 11.2.26

## 1. Executive recommendation

**ACCEPTED - OH FOLLOW-UP EVENT RTL VERIFIED AT SOURCE/JEST LEVEL**

`OhFollowUpEventScreen.tsx` now uses the established shared layout-direction APIs for all screen-owned prose and directional rows.

French and English remain LTR. Arabic uses RTL header/card/label/notice behavior, reverses the note header row, keeps the ISO date and character counter LTR-oriented, and aligns localized prose and validation errors.

The existing submission guard, payload, validation, audit, notification, success and retry behavior remain unchanged.

## 2. Preflight and preservation evidence

Verified before editing:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Initial status entries: 122
- Initial status SHA-256: `a245586f2bc9c99d09ae510a6620ab517484e7bdf84238e8f7252ba03b4ee698`
- Raw lockfile SHA-256: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Starting protected hashes:

| File | SHA-256 |
|---|---|
| `OhFollowUpEventScreen.tsx` | `453780d8fdf94537169dd796105b34a712a86d059fa579bd1b44f6702640166f` |
| `oh-coordination-batch6-acceptance.test.tsx` | `151c52abf2d7be3b490f0c6637ec62956d060e41d76dc6bc22c6d6a609fd2bd8` |

No pre-existing file was reverted or overwritten.

## 3. Exact source changes

Only `OhFollowUpEventScreen.tsx` and `oh-coordination-batch6-acceptance.test.tsx` were modified.

Production presentation changes:

- Added `useLayoutDirection`, `getLayoutRowDirection` and `getLayoutTextAlign`.
- Applied shared text alignment to category, date, note, description, clinical notice and validation error text.
- Added `textAlign`, `writingDirection: 'ltr'` to the ISO date input.
- Applied locale writing direction and text alignment to the administrative-note input.
- Reversed `noteHeaderRow` with the shared row-direction helper.
- Kept character-counter content LTR-written and left-aligned.
- Added stable test IDs for the header, labels, note header, clinical text and action area.
- Kept option cards delegated to `AesOptionCard`.
- Kept submit and shared header behavior delegated to `AesButton` and `AesScreenHeader`.

No business logic, styles outside presentation, route, repository, audit or shared component behavior was changed.

## 4. Shared RTL APIs used

- `useLayoutDirection()` derives FR/EN/AR application direction.
- `getLayoutRowDirection(direction)` resolves `row` or `row-reverse`.
- `getLayoutTextAlign(direction)` resolves `left` or `right`.

The existing shared components remain unchanged.

## 5. FR/EN/AR behavior and rendered assertion matrix

Tests 24E and 24F verify the real screen across:

`FR -> EN -> AR -> FR`

The assertions cover:

- Shared header row direction and title alignment
- Back chevron: left for FR/EN, right for AR
- Category section and all six canonical option cards
- Option card `row` / `row-reverse`
- Date label alignment
- ISO date input with `textAlign: left` and `writingDirection: ltr`
- Administrative-note label and description alignment
- Administrative-note input RTL writing in Arabic
- Note-header row reversal
- Character-counter LTR writing and left alignment
- Clinical notice text alignment
- Validation-error text alignment
- Submit action presence and centered button text
- Locale transitions without resetting category, date or note

Canonical option order remains unchanged.

## 6. Technical ISO date LTR handling

The date input remains `textAlign: 'left'` and `writingDirection: 'ltr'` in all locales.

The ISO string `YYYY-MM-DD` does not reverse, even in Arabic.

The date label follows locale text alignment.

## 7. Note header and counter direction

`noteHeaderRow` uses the shared `rowDirection` helper:

- FR/EN: `row`
- AR: `row-reverse`

The character counter uses LTR writing and left alignment so the numeric count and `300` text remain readable.

The 280-character warning threshold, 300-character limit and existing counter calculation are unchanged.

## 8. Behavioral invariants

Preserved:

- `submittingRef` check/set lifecycle
- `submittingRef` release in `finally`
- React `submitting` loading/disabled state
- `canFollowUp` authorization
- Route and coordination ID
- Default date and category
- ISO regex validation
- 300-character note limit
- 280-character warning
- Repository payload and date/note trimming
- Whitespace-only note `undefined`
- Audit event and payload
- Repository/notification behavior
- Success and failure alerts
- `goBack()` behavior
- Form retention and retry

No repository, database, audit, notification or route file changed.

## 9. Tests 24A-24E and 24F

Existing test 24A:

- Exact repository payload
- Exact audit payload
- Success behavior

Existing test 24B:

- Whitespace note becomes `undefined`

Existing test 24C:

- Deferred repository promise
- One call while pending
- Second submission ignored
- Disabled/busy and settled state
- Success once/navigation once

Existing test 24D:

- Generic failure
- Retained values
- State settlement
- Retry success

Test 24E:

- FR/EN/AR content
- Canonical option order
- Header/card/text/direction assertions

Test 24F:

- Validation error alignment
- Locale transition preserves date, note and category

## 10. Verification results

### RTL focused gate

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx --testNamePattern "24E. Renders French|24F. Validation error"`

- Exit code: `0`
- Suites: 1 passed
- Tests: 1 passed, 42 skipped
- React `act(...)` warnings: `0`
- Log SHA-256: `daadc4dce7f053f174df7f7eca00e9cd818746f038cc6b308127a3546de64922`

The shell pattern selected the RTL-focused match; the complete suite below executed both 24E and 24F.

### Complete OH coordination acceptance suite

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx`

- Exit code: `0`
- Suites: 1 passed
- Tests: `43 passed, 43 total`
- React `act(...)` warning lines: `85`
- Log SHA-256: `58fecc2c723762c8a60d56114e89fa17a7cbf38fcffe2940d8792f3c16abf1cc`

### Adjacent OH and declaration suites

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/oh-coordination-detail-screen.test.tsx src/features/aes-guardian/__tests__/oh-coordination-workflow.test.ts src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx src/features/aes-guardian/__tests__/declaration-workflow.test.tsx`

- Exit code: `0`
- Suites: 4 passed
- Tests: `131 passed, 131 total`
- React `act(...)` warning lines: `61`
- Log SHA-256: `9723f976a122abb199ab3b5666ebcccafddf5ac9a18164aa7d54a2603bba7ba3`

### Full Jest

Command:

`npm test -- --runInBand`

- Exit code: `0`
- Suites: `56 passed`
- Tests: `1259 passed`
- Snapshots: `0`
- React `act(...)` warning lines: `334`
- Log SHA-256: `4c8af44ff3f617cfc16aa2ec68e46d40850ea0660b5b6ad4b099e1d2601760b0`

## 11. TypeScript and diff validation

TypeScript command:

`npx tsc --noEmit --pretty false`

- Exit code: `2`
- Diagnostics: `769`
- Diagnostics in `OhFollowUpEventScreen.tsx`: `0`
- Diagnostics in `oh-coordination-batch6-acceptance.test.tsx`: `0`
- Log SHA-256: `8025da9ddbce219789e8f2a17c795900633d46652d25e1b10c4f94397a9586d6`

The project-wide check remains non-passing at the inherited 769-diagnostic baseline.

`git diff --check` exited `0` with no whitespace errors.

## 12. Final hashes and changed files

Final authorized file hashes:

| File | SHA-256 |
|---|---|
| `OhFollowUpEventScreen.tsx` | `4c51d7ebe85107396c71b5c452dc2bdc24c01a611a493c154f96029f5dd1c9cd` |
| `oh-coordination-batch6-acceptance.test.tsx` | `3e671eadad1fe7905905498e86b9a365d5ac9c004fb981e31db827657825a524` |

Lockfile:

- Raw SHA-256: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized Git blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Changed files:

- `OhFollowUpEventScreen.tsx`
- `oh-coordination-batch6-acceptance.test.tsx`
- This report

## 13. Final preservation audit

Final repository identity:

- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths

No route, localization, shared-component, repository, database, audit, notification, dependency or lockfile file changed.

Pre-existing worktree modifications and untracked reports remain preserved.

## 14. Explicit limitations and next recommendation

Native/device RTL behavior remains unverified. No emulator or physical-device validation was performed.

The next task should begin a separate reconciliation of the remaining unmigrated/re-audit screens, without migrating another screen automatically.
