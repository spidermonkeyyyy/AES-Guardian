# AES Guardian — Phase 2E.1.7.2.3
## Batch 3: Prevention Action Create UI Transformation

### Outcome

Transformed only the Prevention Action Create screen, added one dedicated UI test file, and added direct FR/EN/AR localization entries required by the screen. The screen is quality-staff-only, uses the canonical CAPA creation contract, prevents duplicate submissions, preserves the form after recoverable failure, and navigates only after the repository call resolves successfully.

### Repository identity and status

- Requested checkout: `C:\Users\User\Desktop\sure\sanad-rn-migration`
- Canonical Junction: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Verified repository root: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Branch: `migration/aes-guardian`
- HEAD: `d79b01ef51646509170996f8c77517f95470f217`

Initial status contained 38 modified files and 126 untracked files: 164 status entries. Final status contains 38 modified files and 128 untracked files: 166 status entries. The two new untracked entries added by this batch are the dedicated create test and this report. The create screen and localization file were already dirty and remain modified. No pre-existing file was removed or discarded.

No staging, commit, push, stash, reset, clean, branch change, or cache operation was performed.

### Changed files

1. `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
   - Replaced the legacy form presentation and hardcoded user-facing copy.
   - Uses `AesScreenContainer`, `AesScreenHeader`, `AesCard`, `AesButton`, and `AesOptionCard`.
   - Uses existing AES theme/tokens and FR/EN/AR localization.
   - Fails closed for every role except quality staff.
   - Uses a synchronous submission lock plus React loading state to prevent rapid duplicate submissions.
   - Preserves entered values after repository failure and provides a localized retry.
   - Navigates back only after `createPreventionAction` resolves.

2. `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
   - Added 22 focused UI tests covering authorization, options, validation, submission, failure/retry, navigation, localization, RTL, and touch targets.

3. `src/localization/index.ts`
   - Added only direct create-screen subtitle, placeholders, denial/error/retry text, and validation keys in FR/EN/AR, plus the existing `app.back` label.

4. `docs/AES_GUARDIAN_PHASE2E1_7_2_3_PREVENTION_ACTION_CREATE_UI_REPORT.md`
   - This report.

No database, repository, transaction, lifecycle, audit, notification, navigation, theme foundation, shared-component, shared-mock, Jest configuration, dependency, package, blueprint, Overview, Register, Detail, or Notification Centre file was changed.

### Source-verified API and domain contract

**VERIFIED IN SOURCE**

- `AesGuardianDatabase.createPreventionAction(userId, input): Promise<PreventionActionDetail>` is the active creation method.
- Only a stored `quality_staff` demo user may create.
- `CreatePreventionActionInput` contains exactly:
  - `title`
  - `description`
  - `action_type`
  - `contributing_factor`
  - `rationale`
  - `surveillance_reference?`
  - `target_date?`
- The repository validates title >= 3 characters, description >= 5 characters, rationale >= 5 characters, canonical action type, canonical contributing factor, optional `YYYY-MM-DD` target date, and aggregate-only surveillance reference.
- Individual declaration references matching `AES-<digits>-<digits>` are rejected.
- A new record inserts `status = 'proposed'`.
- Creation is performed inside the existing database transaction with:
  1. prevention action insert,
  2. audit event insert,
  3. `capa_created` notification insert.

The UI uses the existing Zustand synthetic identity. The UI role check controls presentation, while `createPreventionAction` independently enforces repository authorization.

### Field, option, and validation mapping

- Required title: trimmed, minimum 3 characters.
- Required description: trimmed, minimum 5 characters.
- Required rationale: trimmed, minimum 5 characters.
- Action types:
  - `corrective`
  - `preventive`
- Contributing factors:
  - `device_safety_design`
  - `procedure_compliance`
  - `workload_fatigue`
  - `waste_disposal_container`
  - `protective_equipment`
  - `training_supervision`
  - `environment_workspace`
  - `other_factor`
- Optional target date: existing `YYYY-MM-DD` representation.
- Optional surveillance reference: aggregate observation text; individual `AES-` references are rejected.
- No declaration identifier, due date, created-by alias, urgency, risk score, approval state, or extra lifecycle status is introduced.

### Role and submission behavior

- Quality staff: form rendered and repository-backed submission enabled.
- Admin reviewer: denied state and no submit control.
- OH professional: denied state and no submit control.
- Exposed professional: denied state and no submit control.
- Tech admin: denied state and no submit control.
- Rapid repeated taps are blocked synchronously before the first asynchronous repository call completes.
- Repository failure shows a localized, non-sensitive error and preserves title, description, rationale, action type, factor, target date, and surveillance reference.
- Retry deliberately invokes the same submission with the preserved values.
- Success navigation occurs only after the repository promise resolves.
- The repository transaction remains unchanged; no UI claim is made that an uncertain retry is a duplicate or that failure establishes rollback beyond the source implementation.

### Localization and RTL

French, English, and Arabic copy is sourced through the existing localization map. Arabic text uses `textAlign='right'`, RTL-aware form direction, and mirrored chevron direction. The implementation does not claim application-wide RTL completion.

### Verification commands and results

| Command | Result |
|---|---|
| `npm test -- --runInBand src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx` | Exit 0; 1 suite passed, 22/22 tests passed. |
| `npm test -- --runInBand src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx src/core/database/__tests__/database.test.ts` | Exit 0; 4 suites passed, 128/128 tests passed. |
| `npm test -- --runInBand` | Exit 0; 51/51 suites passed, 1,128/1,128 tests passed. |
| `npx tsc --noEmit --pretty false` | Exit 2; 769 diagnostics. No diagnostic in `PreventionActionCreateScreen.tsx`, the dedicated create test, or create-screen localization entries. |

The full suite includes the unchanged Notification Centre file and passed it in this run. The historical empty-state and workspace unread-badge observations remain separately documented; they are not described as fixed or caused by this batch.

The direct TypeScript result is not repository-wide success. The 769 diagnostics are in legacy/non-AES or other unrelated files, including 2 diagnostics in `src/features/alerts/screens/AlertDetailScreen.tsx` where `spacing` and `typography` are unresolved. No direct create-screen diagnostic remained after the final token corrections.

### Deviations and unresolved items

- The dedicated create suite produced React Native `act(...)` console warnings from existing Animated/Touchable timing in the test environment, but all 22 tests passed.
- The create screen contains no emulator-only or manual-run verification dependency.
- No Detail screen, next CAPA batch, master blueprint update, or source/test change to Notification Centre was made.

### Stop condition

Phase 2E.1.7.2.3 implementation and reporting are complete. The result is ready for review; no further CAPA batch was started.
