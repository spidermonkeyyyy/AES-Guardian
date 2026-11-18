# AES Guardian — Phase 2E.1.7.2.1.5

## Notification Centre Test-Harness Root-Cause Audit

### Scope and checkout identity

This was a read-only audit apart from creating this report. No CAPA transformation was started.

- Requested repository path: `C:\Users\User\Desktop\sure\sanad-rn-migration`
- Session's canonical workspace path and Git root: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Path-resolution evidence: `Get-Item` identifies the requested path as a directory reparse point of type `Junction`, with its `Target` set to the canonical workspace path above. This directly verifies the host path mapping; matching project IDs were not used as proof.
- Branch: `migration/aes-guardian`
- HEAD: `d79b01ef51646509170996f8c77517f95470f217`

### Test, screen, and data lifecycle

The failing test is `renders empty state when user has zero notifications` in `src/features/aes-guardian/__tests__/notification-centre.test.tsx`. It renders the real `NotificationCentreScreen` inside the real `ThemeProvider`, with the test module's navigation mock returning `useIsFocused() === true`. It uses the real database facade backed by the repository's manual in-memory `@op-engineering/op-sqlite` mock; it does not mock the screen or notification methods.

The test setup before each test clears Jest mock call state and the SQLite mock stores, resets the database singleton, sets French locale, awaits database initialization with demo-scenario seeding disabled, inserts fixture records, and selects the exposed-professional role. The per-file `afterEach` resets the database singleton. The UI test then renders and uses RNTL `waitFor` to look for the empty-state title and subtitle.

The screen initializes `loading` to `true`. Its focused `useEffect` sets loading true and calls `loadData`. For the active non-admin user, `loadData` gets the database and awaits `getNotifications(userId)` plus `getUnreadNotificationCount(userId)` in `Promise.all`; on success it sets both data states, and its `finally` sets loading false. The empty-state list is rendered only after the loading branch is left. The current isolated reproduction fails with the renderer tree still containing only `<View><ActivityIndicator /></View>` and cannot find `Aucune notification`.

The prior Phase 2E.1.7.2.1.3 diagnostic report, also inspected, records a temporary runtime trace in which focus was true, both repository calls returned an empty list/zero count, `finally` ran while the component was mounted, and the final queried tree nevertheless remained the loading branch. Those diagnostic edits were reported reverted in the subsequent Phase 2E.1.7.2.1.4 report. I did not repeat instrumentation because this pass was restricted to read-only diagnosis.

### Harness and shared-state findings

- `jest.config.js` selects the `react-native` preset and defines no project-specific `setupFilesAfterEnv`. The preset supplies React Native's Jest setup and test environment.
- `@testing-library/react-native` 12.9.0 automatically flushes microtasks and cleans rendered trees after each test when Jest's `afterEach` is available. The Notification Centre test also has its explicit database reset hook.
- The target test is the first UI-rendering test in the file; the earlier localization test does not render. The failing test also fails when selected alone, so a preceding rendered test in that file is not required to reproduce it. Jest gives each test file its own environment, so another suite's in-memory module state is not shared with this isolated run.
- Each test sets the locale to French, resets the database facade and SQLite mock stores, and sets the role to `exposed_professional`; `mockIsFocused` is reset to true. This reduces the likelihood that stale locale, database, role, or focus state from an earlier test explains the isolated failure. The evidence does not rule out every interaction in the test setup.
- The shared SQLite mock uses in-memory stores and exposes `clearAllMockStores`, which this test calls before initialization. The database facade's `resetDatabaseForTesting` resets the service singleton and clears its database reference.

### Installed React / RNTL behavior

The installed versions verified with `npm ls --depth=0` are React 18.3.1, React Native 0.76.9, React Test Renderer 18.3.1, RNTL 12.9.0, and Jest 29.7.0. RNTL's installed peer ranges accept these React, React Native, React Test Renderer, and Jest versions.

In the installed RNTL build, `waitFor` uses a real-timer interval of 50 ms and the configured async utility timeout (default 1,000 ms); it retries the expectation and flushes pending microtasks before restoring the React act environment. RNTL's React 18 `act` wrapper uses `react-test-renderer`'s `act`. The React Native preset sets `IS_REACT_ACT_ENVIRONMENT` and mocks React Native host components including `ActivityIndicator`. No project-level `configure({ asyncUtilTimeout: ... })` call was found.

These are supported versions and the same installed stack passes the comparison tests below. This rules out neither a specific RNTL/component interaction nor a state-observation problem in this test.

### Async-loading comparison tests

Both passing comparisons use the same installed React/RNTL/Jest stack and await post-load screen content:

1. `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx`, `quality staff renders aggregate metrics`: passed (1 passed, 18 skipped). This test uses a resolved database mock and waits for the aggregate overview to render.
2. `src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx`, `renders AesScreenContainer as root wrapper`: passed (1 passed, 79 skipped) with command-line `--testTimeout=15000`. It uses a resolved metrics mock and waits for the loaded dashboard. The test's measured runtime exceeded Jest's default 5-second test timeout in this environment; the override was command-local and did not change repository configuration.

The Prevention Overview test also declares a 15-second Jest timeout in its file. The comparison results show that basic async state updates and RNTL queries work in this stack, but the comparisons use different screens and mocked data sources; they do not prove that the Notification Centre's real-repository setup has no test-harness issue.

### Reproduction

Command:

```text
.\node_modules\.bin\jest.cmd --testPathPattern='notification-centre' -t 'renders empty state when user has zero notifications' --runInBand --no-cache
```

Result: 1 failed, 37 skipped. The assertion timed out with `Unable to find an element with text: Aucune notification`; the last rendered tree contained only a `View` and `ActivityIndicator`. No test, source, setup, dependency, or Git state was changed by the reproduction. The two comparison commands passed as described above.

### Root-cause assessment

**Verified:** The isolated Notification Centre test fails while its observed render is still the loading branch. The screen's source contains a normal focused async load path and a `finally` that sets loading false. The installed RNTL uses a retrying `waitFor`; the test is not relying on a one-shot query. The same React/RNTL stack can render async-loaded content in the two comparison tests.

**Plausible, not verified:** A test-specific state-observation/act-boundary problem, or an interaction between the real database path, the navigation/focus mock, and React state updates. These remain explanations rather than established causes.

**Unresolved:** Why the state transition is not observed in the Notification Centre render; whether the remaining fault lies in this test's harness/lifecycle or a screen-specific behavior; and whether a different verified test-only async strategy would pass both in isolation and in the full file. The prior 2E.1.7.2.1.4 report records that direct-spy, resolved-mock-plus-act, and deferred-promise experiments did not provide a reliable persistent correction; the deferred strategy passed only in isolation and failed in the complete file.

No root cause is verified. Do not change production code, increase shared/global timeouts, or adopt an unverified test workaround based on this evidence.

### Recommendation

Keep the Notification Centre empty-state test as an **open acceptance blocker** pending a separately approved test-infrastructure investigation. Any proposed test-only correction must be demonstrated to pass both in isolation and in the complete Notification Centre test file without concealing the real screen/repository lifecycle.

### Files and behavior inspected

- `src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- `src/features/aes-guardian/screens/NotificationCentreScreen.tsx`
- `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx`
- `src/features/aes-guardian/screens/PreventionOverviewScreen.tsx`
- `src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx`
- `src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx`
- `__mocks__/@op-engineering/op-sqlite.js`
- `jest.config.js`, `package.json`, `package-lock.json`
- `src/core/database/index.ts`
- `src/core/database/AesGuardianDatabase.ts` (notification retrieval/count methods)
- `src/localization/index.ts`
- `src/theme/ThemeContext.tsx`
- Installed RNTL `package.json`, `build/index.js`, `build/config.js`, `build/wait-for.js`, `build/act.js`, and `build/helpers/wrap-async.js`
- Installed React Native `jest-preset.js` and `jest/setup.js`
- Prior reports `AES_GUARDIAN_PHASE2E1_7_2_1_3_NOTIFICATION_RENDERER_DIAGNOSTIC_REPORT.md` and `AES_GUARDIAN_PHASE2E1_7_2_1_4_NOTIFICATION_TEST_ONLY_CORRECTION_REPORT.md`

### Git status preservation

The complete pre-audit `git status --short --untracked-files=all` was:

```text
 M __mocks__/@op-engineering/op-sqlite.js
 M src/core/audit/AuditLogger.ts
 M src/core/database/AesGuardianDatabase.ts
 M src/core/database/DatabaseService.ts
 M src/core/database/NativeSQLiteAdapter.ts
 M src/core/database/__tests__/database.test.ts
 M src/core/database/demo-scenario-seeder.ts
 M src/core/database/index.ts
 M src/core/database/types.ts
 M src/core/index.ts
 M src/features/aes-guardian/__tests__/admin-review-workflow.test.tsx
 M src/features/aes-guardian/__tests__/correction-workflow.test.tsx
 M src/features/aes-guardian/__tests__/declaration-workflow.test.tsx
 M src/features/aes-guardian/__tests__/oh-coordination-workflow.test.ts
 M src/features/aes-guardian/__tests__/workspace-integration.test.ts
 M src/features/aes-guardian/index.ts
 M src/features/aes-guardian/screens/AdminReviewActionScreen.tsx
 M src/features/aes-guardian/screens/AdminReviewQueueScreen.tsx
 M src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx
 M src/features/aes-guardian/screens/CorrectionResponseScreen.tsx
 M src/features/aes-guardian/screens/CreateCoordinationScreen.tsx
 M src/features/aes-guardian/screens/DeclarationCoordinationStatusScreen.tsx
 M src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx
 M src/features/aes-guardian/screens/DeclarationFormScreen.tsx
 M src/features/aes-guardian/screens/DeclarationListScreen.tsx
 M src/features/aes-guardian/screens/OhCoordinationDetailScreen.tsx
 M src/features/aes-guardian/screens/OhCoordinationQueueScreen.tsx
 M src/features/aes-guardian/screens/OhFollowUpEventScreen.tsx
 M src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx
 M src/features/aes-guardian/screens/PreventionOverviewScreen.tsx
 M src/features/aes-guardian/screens/SubmissionConfirmationScreen.tsx
 M src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx
 M src/features/authentication/screens/AuthGateScreen.tsx
 M src/localization/index.ts
 M src/navigation/AppNavigator.tsx
 M src/navigation/routes.ts
 M src/theme/tokens/index.ts
?? docs/AES_GUARDIAN_PHASE2D0_FUNCTIONAL_COMPLETION_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2D1.2_FINAL_VERIFICATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D1.3_CLOSEOUT_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D1_1_CORRECTIVE_VERIFICATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D1_IMPLEMENTATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2A1_CORRECTED_ARCHITECTURE.md
?? docs/AES_GUARDIAN_PHASE2D2B_DATABASE_FOUNDATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2C1_HARDENING_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2C2_FINAL_AUTHORIZATION_VERIFICATION.md
?? docs/AES_GUARDIAN_PHASE2D2C3_1_OH_COORDINATION_DATA_MINIMIZATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2C3_2_EXPOSED_PROJECTION_AND_ADMIN_LIST_AUTH_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2C3_3_ADMIN_PROJECTION_CLOSURE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2C3_4_RUNTIME_PROJECTION_VERIFICATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2C3_FAIL_CLOSED_AUTHORIZATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2C_WORKFLOW_EVENT_INTEGRATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2D1_TRANSACTIONAL_FAILURE_VERIFICATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2D2_RECIPIENT_AND_TRANSACTION_BOUNDARY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2D3_TRANSACTION_CONTEXT_HARDENING_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2D4_RUNTIME_TRANSACTION_AUTHENTICITY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2D5_SEEDER_API_BOUNDARY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2D6_INTERNAL_API_ENCAPSULATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2D_DEMO_NOTIFICATION_SEEDING_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2E_NOTIFICATION_LOCALIZATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2F1_1_NOTIFICATION_PRIVACY_AND_IDENTITY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2F1_NOTIFICATION_OWNERSHIP_AND_TYPE_SAFETY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2F_NOTIFICATION_NAVIGATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2G1_NOTIFICATION_CENTRE_INTEGRATION_CLOSURE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2G2_BULK_READ_IDENTITY_REVALIDATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2G3_SYNCHRONOUS_BULK_READ_LOCK_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2G_NOTIFICATION_CENTRE_UI_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2H_END_TO_END_NOTIFICATION_ACCEPTANCE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2D2_ARCHITECTURE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E0_1_BLUEPRINT_RECONCILIATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E0_2_1_RECONCILIATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E0_2_FINAL_INTEGRITY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E0_3_PREFLIGHT_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_1_1_CORRECTIVE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_1_THEME_FOUNDATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_2_1_BATCH2_ACCEPTANCE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_2_2_ROLE_INTEGRITY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_2_BATCH2_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_3_1_BATCH3_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_3_BATCH3_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_4_0_BATCH4_READINESS_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_4_1_SECURITY_SCOPE_RECONCILIATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_4_2A_OH_AUTHORIZATION_HARDENING_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_4_3_1_BATCH4_ACCEPTANCE_AUDIT_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_4_3_2_STATUS_BADGE_CONTRAST_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_4_3_BATCH4_DECLARATION_LIST_DETAILS_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_5_0_BATCH5_SCOPE_DISCOVERY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_5_1_1_BATCH5_FINAL_ACCEPTANCE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_5_1_2_TYPESCRIPT_EVIDENCE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_5_1_BATCH5_IMPLEMENTATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_6_0_1_OH_QUEUE_STATUS_RETRIEVAL_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_6_0_2_1_EVIDENCE_RECONCILIATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_6_0_2_OH_QUEUE_REPOSITORY_ENHANCEMENT_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_6_0_BATCH6_SCOPE_DISCOVERY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_6_1_1_BATCH6_RECONCILIATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_6_1_2_OH_TAXONOMY_AND_WORKTREE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_6_1_BATCH6_OH_COORDINATION_UI_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_0_1_SURVEILLANCE_ARCHITECTURE_RECONCILIATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_0_2_SURVEILLANCE_CONTRACT_AND_COMPONENT_VERIFICATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_0_BATCH7_SCOPE_DISCOVERY_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_1_1_BATCH7_ACCEPTANCE_EVIDENCE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_1_2_BATCH7_RTL_TOUCH_TARGET_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_1_3_BATCH7_FINAL_RTL_TOUCH_TARGET_CLOSURE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_1_4_BATCH7_EXPOSURE_FILTER_AND_EVIDENCE_RECONCILIATION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_1_5_BATCH7_FINAL_BEHAVIORAL_AND_TYPESCRIPT_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_1_BATCH7_SURVEILLANCE_DASHBOARD_UI_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_0_2_ACTIVE_WORKTREE_ALIGNMENT_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_0_PREVENTION_CAPA_UI_SCOPE_DISCOVERY.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_1_BATCH1_TEST_FAILURE_TRIAGE_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_2_NOTIFICATION_EMPTY_STATE_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_3_NOTIFICATION_RENDERER_DIAGNOSTIC_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_4_NOTIFICATION_TEST_ONLY_CORRECTION_REPORT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_PREVENTION_OVERVIEW_UI_REPORT.md
?? docs/AES_GUARDIAN_UI_IMPLEMENTATION_BLUEPRINT.md
?? src/core/database/__tests__/demo-notification-seeding.test.ts
?? src/core/database/__tests__/demo-reset.test.ts
?? src/core/database/__tests__/migration8.test.ts
?? src/core/database/__tests__/notification-workflow-hardening.test.ts
?? src/core/database/__tests__/notification-workflow.test.ts
?? src/core/database/__tests__/notifications.test.ts
?? src/features/aes-guardian/__tests__/admin-review-batch5-acceptance.test.tsx
?? src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx
?? src/features/aes-guardian/__tests__/help-glossary-profile.test.tsx
?? src/features/aes-guardian/__tests__/notification-centre.test.tsx
?? src/features/aes-guardian/__tests__/notification-e2e-journeys.test.ts
?? src/features/aes-guardian/__tests__/notification-localization.test.ts
?? src/features/aes-guardian/__tests__/notification-navigation.test.ts
?? src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx
?? src/features/aes-guardian/__tests__/oh-coordination-detail-screen.test.tsx
?? src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx
?? src/features/aes-guardian/__tests__/phase2d1-2-final-verification.test.ts
?? src/features/aes-guardian/__tests__/phase2d1-corrective-verification.test.ts
?? src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx
?? src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx
?? src/features/aes-guardian/__tests__/theme-foundation.test.ts
?? src/features/aes-guardian/components/AesButton.tsx
?? src/features/aes-guardian/components/AesCard.tsx
?? src/features/aes-guardian/components/AesOptionCard.tsx
?? src/features/aes-guardian/components/AesRoundArrowButton.tsx
?? src/features/aes-guardian/components/AesScreenContainer.tsx
?? src/features/aes-guardian/components/AesScreenHeader.tsx
?? src/features/aes-guardian/components/AesStatusBadge.tsx
?? src/features/aes-guardian/components/index.ts
?? src/features/aes-guardian/navigation/notification-navigation-resolver.ts
?? src/features/aes-guardian/screens/AesGuardianProfileScreen.tsx
?? src/features/aes-guardian/screens/DemoAccountPickerScreen.tsx
?? src/features/aes-guardian/screens/HelpGlossaryScreen.tsx
?? src/features/aes-guardian/screens/LanguageSelectionScreen.tsx
?? src/features/aes-guardian/screens/NotificationCentreScreen.tsx
?? src/features/aes-guardian/screens/PrototypeDisclaimerScreen.tsx
?? src/features/aes-guardian/screens/SplashScreen.tsx
?? src/features/aes-guardian/screens/WelcomeCarouselScreen.tsx
?? src/features/aes-guardian/utils/onboardingStorage.ts
?? src/theme/tokens/aesColors.ts
?? src/theme/tokens/aesTheme.ts
?? src/theme/tokens/aesTypography.ts
```

After creating this report, the verified post-audit status is exactly the pre-audit listing above plus the single new untracked entry:

```text
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_5_NOTIFICATION_TEST_HARNESS_ROOT_CAUSE_AUDIT.md
```

No pre-existing modified or untracked file was changed, staged, or removed. No commit, push, branch change, or other Git mutation was made. This report is the only repository change from this audit.
