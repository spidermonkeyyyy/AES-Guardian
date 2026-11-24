# AES Guardian - Phase 2E.1 Batch 11.2.8

## Declaration Form RTL Migration Report

**Final recommendation: `ACCEPTED - DECLARATION FORM VERIFIED AT SOURCE/JEST LEVEL`**

## Repository and Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- `git diff --check`: passed
- No staged changes or commits

## Exact Target and Workflow

Production:

- `src/features/aes-guardian/screens/DeclarationFormScreen.tsx`

Route:

- `newDeclaration`
- Optional parameter: `declarationId`

Focused tests:

- `src/features/aes-guardian/__tests__/declaration-workflow.test.tsx`

The primary declaration workflow is a single 5-step `DeclarationFormScreen`:

1. General information
2. Exposure characteristics
3. Circumstances and exposure nature
4. Protective measures
5. Summary and honor attestation

## RTL Implementation

The screen now uses:

- `useLayoutDirection()`
- `getLayoutRowDirection()`
- `getLayoutTextAlign()`

Presentation changes include:

- Wizard header top row follows shared direction.
- 5-segment progress bar follows shared direction.
- Section titles/subtitles use shared text alignment.
- Step field labels use shared row direction.
- Free-text fields use Arabic/English/French text alignment where appropriate.
- Incident date and department code inputs remain LTR because they are code/date direction-neutral fields.
- AesOptionCard rows continue to use their shared direction behavior.
- Free-text advisory row uses shared row direction.
- Footer back/save/next/submit row uses shared row direction.
- The notice icon uses `marginEnd`.

The existing back chevron is derived from shared direction:

- LTR: `chevron-left`
- RTL: `chevron-right`

No step logic or persistence code was changed.

## Workflow Preservation

Preserved:

- Step count and order
- Field names and input types
- Incident date default behavior
- Draft create/update persistence
- Auto-save behavior
- Save Draft behavior
- Required-field validation
- Attestation requirement
- Forward/back transitions
- Submit Declaration path
- Audit event behavior
- Submission confirmation navigation

Existing tests continue to cover validation, forward/back navigation, draft persistence/failure, submission failure, submission success, locale rendering and free-text advisory neutral wording.

## FR/EN/AR Assertion Matrix

| Element | FR | EN | AR |
| --- | --- | --- | --- |
| Header row | row | row | row-reverse |
| Progress bar | row | row | row-reverse |
| Section title/subtitle | left | left | right |
| Field label rows | shared row | shared row | row-reverse |
| Date and department code | left | left | left |
| Free-text fields | left/right by locale | left/right by locale | shared text alignment |
| Free-text notice | row | row | row-reverse |
| Footer actions | row | row | row-reverse |
| Back chevron | left | left | right |

The direct test advances through all five steps in RTL and verifies the same step IDs and next-step sequence.

## Verification

Focused declaration workflow suite:

- Exit code: `0`
- 24 tests passed

Declaration list/details plus onboarding shared suites:

- Exit code: `0`
- 2 suites passed
- 88 tests passed

Full Jest suite:

- Exit code: `0`
- 56 suites passed
- 1226 tests passed
- 0 snapshots
- Time: `124.281 s`
- Notification-centre suite passed in this run.

TypeScript:

- Exit code: `2`
- 769 inherited diagnostic lines
- No diagnostic referenced `DeclarationFormScreen.tsx` or `declaration-workflow.test.tsx`.

Diff check:

- Exit code: `0`

## Preservation and Limitations

No database, schema, notification, audit, role, authorization, dependency or lockfile behavior was changed.

No physical device, emulator or native I18nManager validation was performed.

Date and department code fields remain left-aligned to preserve direction-neutral code/date input semantics.
