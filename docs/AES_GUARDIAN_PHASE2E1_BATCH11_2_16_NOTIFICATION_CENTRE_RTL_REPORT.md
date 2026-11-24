# AES Guardian — Phase 2E.1 Batch 11.2.16

## Final recommendation

**CONDITIONALLY ACCEPTED — BOUNDED EVIDENCE GAP**

The source migration and rendered assertions pass. The final focused and full Jest runs pass, but an earlier full Jest run after the fixture correction failed only the Notification Centre suite; its individual failing assertion was not retained by the filtered output. That failure and all subsequent reruns are recorded below rather than treated as erased by a later pass.

## Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree before and after the batch: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- The pre-existing worktree was not clean. Its complete pre-edit status is recorded in the appendix. No pre-existing changes were reverted or overwritten.
- No files were staged or committed.

## Lockfile provenance

- Raw working-tree `package-lock.json` SHA-256 before and after: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- Path-normalized Git blob before and after: `e397c195e4e22231204add4fdfafb1ba50219736`
- Raw CRLF hash and normalized LF blob were verified independently. The lockfile was not edited or normalized.

## Screen, route, parameters and callers

- Screen: `src/features/aes-guardian/screens/NotificationCentreScreen.tsx`
- Exported component: `NotificationCentreScreen`
- Route: `notificationCentre`
- Parameter contract: `undefined` (no route parameters), per `src/navigation/routes.ts`
- Registered in two authenticated navigator branches in `src/navigation/AppNavigator.tsx`; unauthenticated/fallback route isolation remains covered by the existing focused tests.
- Navigation caller: the notification bell in `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`, which navigates to `notificationCentre` without parameters.
- The screen continues to set its native navigation-header title from the active locale. Navigation registration and native header configuration were not changed.
- Focused test: `src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- Related coverage: `notification-navigation.test.ts`, `notification-e2e-journeys.test.ts`, `notification-localization.test.ts`, `notifications.test.ts`, `notification-workflow.test.ts`, and `notification-workflow-hardening.test.ts`.

## Pre-existing target changes and final changed files

Before this batch, the production screen was unmodified and the focused test file already contained accumulated changes, including workspace RTL checks and the accepted stale unread-count tests.

- Pre-edit screen SHA-256: `DBCF2E1B3AC7A93F521D1B19EE53DCED143542479063C62A91C097C5384D363E`
- Pre-edit focused-test SHA-256: `292A62E849D7FDB6D5CCDF260F421D295B3D045235734A00B15A89D9B399AAD9`
- Final screen SHA-256: `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a`
- Final focused-test SHA-256: `e719c69f5f910ceebdfa304ae32ef4fb7a659c6419952ac19c53261186efe006`

Only these files were changed for this batch:

- `src/features/aes-guardian/screens/NotificationCentreScreen.tsx`
- `src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- `docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16_NOTIFICATION_CENTRE_RTL_REPORT.md`

The focused test file's existing changes were preserved; this batch added only direct rendered RTL/locale assertions and the `StyleSheet` import needed by them.

## RTL implementation

The existing shared direction infrastructure is used; no second RTL abstraction was added:

- `useLayoutDirection()`
- `getLayoutRowDirection(direction)`
- `getLayoutTextAlign(direction)`
- Existing `LayoutDirection` type for notification row props

Changes are presentation-only:

- Notification card, title/metadata, unread marker, content and chevron order follow the current locale direction.
- Notification prose and summary/action labels align with the locale.
- The directional chevron mirrors between `›` for LTR and `‹` for RTL.
- Timestamp text keeps LTR writing order while its position follows the card layout.
- Notification card and summary spacing use `paddingStart`/`paddingEnd`; separator indentation uses `marginStart`.
- The existing empty bell, restricted lock, error symbol, unread/read indicators and other fixed semantic/decorative marks are not mirrored.
- Existing empty, loading, restricted and error presentation remains centered. Retry text alignment follows the active locale; its existing label remains unchanged.
- The native stack back affordance remains owned by React Navigation. This screen-level change does not modify navigator configuration.

## FR/EN/AR rendered assertions and locale switching

The added rendered test seeds one existing synthetic notification and directly checks:

- French title and body, LTR rows and left-aligned prose.
- English title and body, LTR rows and left-aligned prose.
- Arabic title and body, `row-reverse`, right-aligned prose and mirrored chevron.
- Timestamp remains LTR-written and correctly positioned in each locale.
- Summary direction, unread label and notification identity remain present across locale changes.
- Locale sequence is FR → EN → AR → FR without losing notification content or unread state.

Existing focused coverage continues to verify notification selection/navigation, read-after-success behavior, failed-resolution behavior, unread counts, mark-one-read, mark-all-read, role scoping, tech-admin restriction, empty/loading/error states, refresh and localized native header titles.

## Authorization, privacy and behavior preservation

- The screen still uses the active synthetic identity and recipient-scoped `getNotifications(userId)` / `getUnreadNotificationCount(userId)` calls.
- The existing `tech_admin` restricted view remains in place and performs no operational feed load.
- No new notification fields, previews, personal data or clinical information were introduced.
- Navigation still goes through `resolveNotificationNavigation`; successful navigation remains before `markNotificationRead(notification.id, currentContext.userId)`.
- Failed or inaccessible navigation still does not navigate or mark the item read, and retains existing localized feedback and refresh behavior.
- `markAllNotificationsRead` remains protected by its existing synchronous lock and role/identity revalidation. Confirmation, cancellation, dismissal, refresh and error recovery were not redesigned.
- Notification ordering, date formatting logic, repository inputs, role visibility, recipient restrictions, action behavior and notification/audit side effects are unchanged.
- No repository, database, migration, producer, consumer, authorization, navigation or shared-infrastructure logic was changed.

## Stale unread-count guard preservation

`src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx` and its guard were not modified by this batch. The pre-existing workspace diff still contains the accepted `unreadRefreshVersion` request invalidation; the file remains a pre-existing worktree modification (final SHA-256 `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0`).

The focused test's five pre-existing workspace race cases remain present and unchanged in meaning:

- `older unread-count request cannot overwrite a newer resolved count`
- `older unread-count rejection cannot disturb a newer resolved badge`
- `identity switch prevents older user result from publishing`
- `tech_admin switch invalidates older badge request`
- `focus loss and regain invalidates older request`

## Verification commands and results

### Focused Notification Centre suite

Command: `npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`

- Final exit code: `0`
- 1 suite passed; 46 tests passed; 0 snapshots.

### Related notification, navigation and workflow coverage

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx src/features/aes-guardian/__tests__/notification-navigation.test.ts src/features/aes-guardian/__tests__/notification-e2e-journeys.test.ts src/features/aes-guardian/__tests__/notification-localization.test.ts src/core/database/__tests__/notifications.test.ts src/core/database/__tests__/notification-workflow.test.ts src/core/database/__tests__/notification-workflow-hardening.test.ts`

- Exit code: `0`
- 7 suites passed; 282 tests passed; 0 snapshots.

### Full Jest

Command: `npm test -- --runInBand`

Observed sequence:

1. The first new focused run failed because the test read `MutationResult.id`; the fixture was corrected to require/use `insertId`.
2. The focused suite then passed: 1 suite, 46 tests.
3. The related seven-suite run passed: 7 suites, 282 tests.
4. The first full run after the fixture correction exited `1`: 55/56 suites passed, 1247 tests passed and 1 failed; the only failed suite reported was `notification-centre.test.tsx`. The console output was filtered to suite summaries, so the exact failing test/assertion was not retained.
5. An isolated Notification Centre rerun passed: 1 suite, 46 tests.
6. A full rerun passed: 56 suites, 1248 tests.
7. After the final presentation-only adjustment, the focused suite passed again: 1 suite, 46 tests.
8. The final full run passed: 56 suites, 1248 tests; exit code `0`.

The unexplained single full-run failure is the bounded evidence gap behind the conditional recommendation. It is not omitted or represented as a passing-only history.

### TypeScript

Command: `npx tsc --noEmit --pretty false`

- Exit code: `2`
- Diagnostics: `769`, matching the inherited baseline.
- Diagnostics referencing changed source/test files: none.
- The project does not pass TypeScript as a whole.

### Diff validation

Command: `git diff --check`

- Exit code: `0`
- No whitespace errors.
- Git emitted an unrelated existing LF-to-CRLF warning for `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx`.

## Native/device validation limitations

No emulator or device was launched. Source/Jest-rendered tests do not establish native RTL mirroring, physical native-header icon placement, Android text rendering, TalkBack reading order, large-font behavior or native touch-target behavior. These remain for consolidated native validation.

## Operation exclusions

No remote operation, fetch, pull, push, merge, stage, commit, branch change, reset, clean, restore, checkout, Git metadata modification, dependency installation, package/lockfile modification or emulator/device launch occurred.

## Appendix: complete pre-edit `git status --short`

The following is the complete status captured before this batch's edits. The Notification Centre screen was not modified at that point; the focused test file was already modified. All entries below were pre-existing.

```text
 M src/core/database/AesGuardianDatabase.ts
 M src/core/database/__tests__/database.test.ts
 M src/core/database/__tests__/migration8.test.ts
 M src/core/database/__tests__/notification-workflow-hardening.test.ts
 M src/core/database/index.ts
 M src/core/database/types.ts
 M src/core/index.ts
 M src/features/aes-guardian/__tests__/admin-review-batch5-acceptance.test.tsx
 M src/features/aes-guardian/__tests__/correction-workflow.test.tsx
 M src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx
 M src/features/aes-guardian/__tests__/declaration-workflow.test.tsx
 M src/features/aes-guardian/__tests__/help-glossary-profile.test.tsx
 M src/features/aes-guardian/__tests__/notification-centre.test.tsx
 M src/features/aes-guardian/__tests__/notification-e2e-journeys.test.ts
 M src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx
 M src/features/aes-guardian/__tests__/oh-coordination-detail-screen.test.tsx
 M src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx
 M src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx
 M src/features/aes-guardian/__tests__/prevention-action-detail-ui.test.tsx
 M src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx
 M src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx
 M src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx
 M src/features/aes-guardian/components/AesButton.tsx
 M src/features/aes-guardian/components/AesOptionCard.tsx
 M src/features/aes-guardian/components/AesRoundArrowButton.tsx
 M src/features/aes-guardian/components/AesScreenHeader.tsx
 M src/features/aes-guardian/screens/AdminReviewActionScreen.tsx
 M src/features/aes-guardian/screens/AdminReviewQueueScreen.tsx
 M src/features/aes-guardian/screens/AesGuardianProfileScreen.tsx
 M src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx
 M src/features/aes-guardian/screens/CorrectionResponseScreen.tsx
 M src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx
 M src/features/aes-guardian/screens/DeclarationFormScreen.tsx
 M src/features/aes-guardian/screens/DeclarationListScreen.tsx
 M src/features/aes-guardian/screens/DemoAccountPickerScreen.tsx
 M src/features/aes-guardian/screens/HelpGlossaryScreen.tsx
 M src/features/aes-guardian/screens/LanguageSelectionScreen.tsx
 M src/features/aes-guardian/screens/OhCoordinationDetailScreen.tsx
 M src/features/aes-guardian/screens/OhCoordinationQueueScreen.tsx
 M src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx
 M src/features/aes-guardian/screens/PreventionActionDetailScreen.tsx
 M src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx
 M src/features/aes-guardian/screens/PreventionOverviewScreen.tsx
 M src/features/aes-guardian/screens/PrototypeDisclaimerScreen.tsx
 M src/features/aes-guardian/screens/SplashScreen.tsx
 M src/features/aes-guardian/screens/WelcomeCarouselScreen.tsx
 M src/localization/index.ts
?? docs/AES_GUARDIAN_PHASE0_2_DEDICATED_REPOSITORY_REVIEW.md
?? docs/AES_GUARDIAN_PHASE0_3_LOCAL_BASELINE_VERIFICATION.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_10_INDEPENDENT_UUID_PRESENTATION_AND_RESERVATION_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_11_RESERVATION_INTENT_INSERT_RACE_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_12_INDEPENDENT_RESERVATION_INTENT_INSERT_RACE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_13_CREATE_INTENT_LIFECYCLE_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_14_INDEPENDENT_CREATE_INTENT_LIFECYCLE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_15_CREATE_LIFECYCLE_REGRESSION_EVIDENCE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_16_ACKNOWLEDGED_OPERATION_RETIREMENT_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_17_INDEPENDENT_ACKNOWLEDGEMENT_RETIREMENT_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_18_INDEPENDENT_CAPA_CROSS_SCREEN_ACCEPTANCE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_2_CAPA_CORRECTIVE_REENTRY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_3_CAPA_CROSS_SCREEN_REAUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_4_DURABLE_CAPA_IDEMPOTENCY_DESIGN.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_5_DURABLE_CAPA_OPERATION_IMPLEMENTATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_6_INDEPENDENT_DURABLE_CAPA_IDEMPOTENCY_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_7_OPERATION_IDENTITY_AND_COMMITTED_RECOVERY_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_8_INDEPENDENT_OPERATION_RECOVERY_ACCEPTANCE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_5_9_PRESENTATION_ACKNOWLEDGEMENT_AND_UUID_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_6_REMAINING_SCOPE_AND_ROADMAP_DISCOVERY.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_1_NOTIFICATION_BADGE_FAILURE_DIAGNOSTIC.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_2_WORKSPACE_UNREAD_BADGE_RACE_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_3_WORKSPACE_BADGE_INDEPENDENT_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_4_STALE_FAILURE_REGRESSION_TEST_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_5_FINAL_WORKSPACE_BADGE_ACCEPTANCE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_READINESS_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_1_SHARED_RTL_INDEPENDENT_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_2B_LOCKFILE_HASH_PROVENANCE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_2C_RTL_TEST_COMPLETION_AND_SUITE_DIAGNOSTIC.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_2_RTL_TEST_COMPLETION_AND_SUITE_DIAGNOSTIC.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_SHARED_RTL_LAYOUT_DIRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_0_RTL_SCREEN_INVENTORY_AND_MIGRATION_PLAN.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_10_DECLARATION_DETAILS_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_11A_LOCKFILE_PROVENANCE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_11B_GIT_INDEX_FORENSICS_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_11_OH_QUEUE_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_12_OH_DETAIL_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_13_ADMIN_REVIEW_QUEUE_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_14_ADMIN_REVIEW_ACTION_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_15_CORRECTION_RESPONSE_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_1_AES_BUTTON_RTL_MIGRATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_2_SPLASH_LANGUAGE_SELECTION_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_3_WELCOME_DISCLAIMER_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_4_DEMO_PICKER_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_5_WORKSPACE_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_6_PROFILE_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_7_HELP_GLOSSARY_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_8_DECLARATION_FORM_RTL_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_9_DECLARATION_LIST_RTL_REPORT.md
?? src/core/database/__tests__/capa-operation-entropy.test.ts
?? src/core/database/__tests__/capa-operation-idempotency.test.ts
?? src/core/database/__tests__/migration9.test.ts
?? src/core/database/capa-operation-utils.ts
?? src/features/aes-guardian/__tests__/prevention-date-format.test.ts
?? src/features/aes-guardian/prevention-date-format.ts
```
