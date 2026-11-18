# AES Guardian — Phase 2E.1.7.2.1.8

## Final No-Cache Runtime Performance Profiling

### Executive conclusion

**VERIFIED BY EXPERIMENT:** The uncached Jest process has a real, substantial transformation and module/filesystem cost. In the V8 CPU profile, Babel/Jest transformation accounted for 12.384 s (38.0%) of sampled CPU time uncached, versus 0.332 s (3.5%) cached. The isolated command took 35.709 s wall time uncached versus 10.087 s cached; the target test was reported as 14.530 s versus 2.432 s. The uncached profile also showed more sampled filesystem/module-resolution work and GC activity.

**UNRESOLVED:** This explains a significant portion of the total command-time differential, but does not establish that Babel transformation itself causes the Notification Centre's delayed React commit. Prior lifecycle traces show the delay also within the render-to-commit / waitFor interval, while this CPU profile is process-wide and does not phase-tag Babel samples against those lifecycle events. The test's immediate root cause therefore remains unresolved; keep it as an open acceptance blocker.

**IMPORTANT CACHE LIMITATION:** Inspection of the installed Jest transformer shows that `--no-cache` bypasses transformed-code reads but still unconditionally writes each transformed output through Jest's cache writer. The requested no-cache runs therefore likely refreshed transform-cache entries. This was discovered after profiling; no cache files were manually deleted or edited, and no attempt was made to restore them because that would further violate the no-cache-mutation restriction. Consequently, this investigation cannot claim that the existing Jest cache remained untouched.

### Repository identity and Git state

- **VERIFIED BY EXPERIMENT:** Requested path: `C:\Users\User\Desktop\sure\sanad-rn-migration`
- **VERIFIED BY EXPERIMENT:** The requested path is a Junction to `C:\c\Users\User\Desktop\sure\sanad-rn-migration`.
- **VERIFIED BY EXPERIMENT:** Git root: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- **VERIFIED BY EXPERIMENT:** Branch: `migration/aes-guardian`
- **VERIFIED BY EXPERIMENT:** HEAD: `d79b01ef51646509170996f8c77517f95470f217`

The complete initial `git status --short --untracked-files=all` had 159 entries (37 modified, 122 untracked); it is listed verbatim below. Final Git status is that same list plus only this report. The temporary profiling/harness artifacts were created outside the repository. No production/test/configuration file was edited, staged, committed, pushed, or removed.

### Runtime and configuration

**VERIFIED IN SOURCE:**

- Node.js `v24.18.1`
- Jest `29.7.0`
- `babel-jest` `29.7.0`
- `@babel/core` `7.29.7`
- `@react-native/babel-preset` `0.76.9`
- React Native `0.76.9`
- React `18.3.1`
- React Test Renderer `18.3.1`
- RNTL `12.9.0`

The project uses the React Native Jest preset, Babel-Jest for JS/TS/TSX, the React Native asset transformer, and the project's existing `transformIgnorePatterns` and `@/` mapper. Cache is enabled by default; `jest --showConfig` resolves its directory to `C:\Users\User\AppData\Local\Temp\jest`. No timeout, Jest/Babel configuration, dependency, or package-manifest change was made.

The profiled commands used the installed Node executable and the same installed Jest CLI entry (`node_modules/jest/bin/jest.js`), current working directory, test path/selection, and `--runInBand`. The only functional difference was the cache mode; profile output name/directory necessarily differed.

### CPU profiling experiment

**VERIFIED BY EXPERIMENT:** Captured V8 CPU profiles outside the repository using Node's built-in `--cpu-prof` sampler. Each profile covers the Node process from startup through exit, including Jest initialization, transformation, module loading, and test execution. V8 sample self-time was grouped by the sampled leaf frame's URL/function name; percentages are approximate and mutually exclusive, not inclusive call-tree totals.

Exact commands:

```text
node --cpu-prof --cpu-prof-dir="C:\Users\User\.copilot\session-state\51b62223-7765-4793-b1b2-29d7b79243cf\files\phase-2e1-7-2-1-8-cpu-cache" --cpu-prof-name=cached.cpuprofile node_modules/jest/bin/jest.js src/features/aes-guardian/__tests__/notification-centre.test.tsx -t "renders empty state when user has zero notifications" --runInBand

node --cpu-prof --cpu-prof-dir="C:\Users\User\.copilot\session-state\51b62223-7765-4793-b1b2-29d7b79243cf\files\phase-2e1-7-2-1-8-cpu-nocache" --cpu-prof-name=uncached.cpuprofile node_modules/jest/bin/jest.js src/features/aes-guardian/__tests__/notification-centre.test.tsx -t "renders empty state when user has zero notifications" --runInBand --no-cache
```

| Mode | Exit | Wall time | Jest time | Target test | Profile samples / sampled duration | Profile size |
|---|---:|---:|---:|---:|---:|---:|
| Cached | 0 | 10.087 s | 7.211 s | Passed, 2.432 s | 5,791 / 9.557 s | 5.76 MB |
| `--no-cache` | 1 | 35.709 s | 29.994 s | Failed, 14.530 s | 20,940 / 32.591 s | 52.10 MB |

**VERIFIED BY TEST:** The cached target test passed. The uncached run failed with `Unable to find an element with text: Aucune notification`; the last rendered tree contains `<ActivityIndicator />`. Other tests were skipped due to the isolated test-name selection.

#### Sampled CPU attribution

| Sampled leaf-frame group | Cached | Uncached |
|---|---:|---:|
| Babel/Jest transform | 332 ms (3.5%) | 12,384 ms (38.0%) |
| Node native filesystem/module resolution | 5,712 ms (59.8%) | 11,279 ms (34.6%) |
| Node internal JavaScript | 1,705 ms (17.8%) | 2,537 ms (7.8%) |
| Jest JavaScript | 918 ms (9.6%) | 1,026 ms (3.1%) |
| Other / unknown frames | 512 ms (5.4%) | 3,954 ms (12.1%) |
| React Native | 113 ms (1.2%) | 120 ms (0.4%) |
| React Test Renderer | 59 ms (0.6%) | 53 ms (0.2%) |
| React | 6 ms (0.1%) | 12 ms (<0.1%) |
| Garbage collector | 88 ms (0.9%) | 977 ms (3.0%) |
| Idle | 85 ms (0.9%) | 97 ms (0.3%) |

The largest sampled uncached Babel frames were `@babel/traverse` work including `visitQueue` (869 ms), `visit` (628 ms), `getOrCreateCachedPaths` (451 ms), `visit` (405 ms), `call` (402 ms), `setContext` (384 ms), `visitSingle` (368 ms), and `setScope` (365 ms). These are Babel AST traversal/transformation frames; the profile does not associate each sample with a specific transformed source file.

The largest uncached native/Node frames included `readFileUtf8` (2.049 s), `rename` (1.764 s), `open` (1.551 s), `stat` (1.248 s), `lstat` (1.100 s), `existsSync` (886 ms), `internalModuleStat` (805 ms), and `realpath` (689 ms). Cached profile leaders were filesystem/module-resolution frames as well (`stat`, `readFileUtf8`, `open`, `realpath`, `existsSync`, and `internalModuleStat`).

**Interpretation:** Transform work accounts for about 12.05 s more sampled CPU time in the uncached profile and is a credible, measured contributor to slower total command execution. Node filesystem/module-resolution and unclassified work also increase. React, React Test Renderer, and React Native leaf self-samples remain small in both profiles. These are leaf-frame samples, not inclusive time: low self-time does not prove that React rendering is inexpensive, and the profiles cannot assign sampled work to the precise time at which `render()` or `waitFor` ran.

### Event-loop, GC, and memory telemetry

A separate external Node preload used `monitorEventLoopDelay({ resolution: 10 })`, `process.cpuUsage()`, `process.memoryUsage()`, and a `PerformanceObserver` for GC entries. It ran the same isolated Jest CLI/test commands, with the preload being the only added instrumentation. The values below are process-wide; the timer histogram is coarse and does not identify which phase caused a pause.

| Metric | Cached | `--no-cache` |
|---|---:|---:|
| Process uptime | 8.345 s | 29.918 s |
| User CPU | 3.969 s | 25.375 s |
| System CPU | 3.609 s | 8.250 s |
| Event-loop delay p50 | 13.27 ms | 13.16 ms |
| Event-loop delay mean | 386 ms | 1,563 ms |
| Event-loop delay max / p99 | 6.342 s | 27.783 s |
| GC entries / observed duration | 25 / 67 ms | 64 / 782 ms |
| RSS at exit | 241 MB | 548 MB |
| Heap used at exit | 99 MB | 352 MB |
| External memory at exit | 8.6 MB | 180 MB |

Exit memory values are snapshots, not peak memory. GC duration from the PerformanceObserver and GC self-samples from the CPU profile are distinct measurements and need not be identical.

**VERIFIED BY EXPERIMENT:** The uncached process experienced much larger process-wide event-loop delay and more GC/exit memory use. This supports substantial synchronous work/resource pressure somewhere in the uncached process. It does not show that the long pause occurred inside the React render or that GC caused the empty-state failure. The cached run also had a long maximum event-loop delay, so the metric is not unique to the failing mode.

### Lifecycle timing context

The preceding Phase 2E.1.7.2.1.7 one-clock diagnostic provides phase-level context (separate instrumented runs; not the CPU-profile runs):

- **Uncached:** render began at 25 ms; Profiler mount at 12,401 ms; database methods were invoked at 12,404–12,406 ms and both promises fulfilled at 12,417 ms. `waitFor` began at 12,411 ms. Later Profiler update commits were at 13,861–13,862 ms; the nominal 1,000 ms timer callback ran at 13,865 ms, about 454 ms late; `waitFor` rejected at 13,891 ms, and the immediate same-render query found the empty state at 13,895 ms.
- **Cached:** render began at 25 ms; Profiler mount at 1,922 ms; database methods were invoked at 1,925–1,926 ms and fulfilled at 1,933 ms. `waitFor` began at 1,929 ms; loaded commits occurred at 2,131–2,133 ms, the next poll at 2,134 ms, and `waitFor` resolved at 2,142 ms.
- The prior diagnostic's attempted `useState` wrapper did not capture the component's module-bound `setLoading` call. The Phase 2E.1.7.2.1.6 diagnostic separately observed `setLoading(false)` at 15,247 ms, a later Profiler update at 16,554–16,555 ms, `waitFor` rejection at 16,583 ms, and the post-rejection query seeing empty content at 16,585 ms. That run began waiting at 15,238 ms; its nominal 1,000 ms deadline was 16,238 ms.

These traces confirm that setter invocation and React commit are distinct, and that in the instrumented uncached trace the commit and timeout callback both occurred after the nominal deadline. Their clocks are kept separate; no timestamps from separate runs were merged. Instrumentation may affect scheduling, and these phase timings do not identify the source of the delay.

### Transformation, initialization, rendering, and environmental assessment

- **VERIFIED IN SOURCE:** Jest's installed `ScriptTransformer` uses `config.cache` to decide whether it reads a transformed-code cache file. Once transformation runs, it calls `_buildTransformResult`, which calls `writeCodeCacheFile` / `writeCacheFile` without a corresponding cache-enabled guard. Therefore `--no-cache` bypasses reads but still writes cache outputs. The profile's uncached native `rename`/file-write activity is consistent with that code path, although the sampled native frames alone are not uniquely attributable.
- **VERIFIED BY EXPERIMENT:** Babel transformation is a major contributor to the uncached process's total CPU work, but not the entire difference. Filesystem/module-resolution frames, Node internal work, GC, and unclassified frames also increase.
- **VERIFIED BY EXPERIMENT:** Prior Phase 2E.1.7.2.1.7 inspection compared the actual cached transformed bytes for the target test and `NotificationCentreScreen.tsx` with fresh Babel-Jest output; those two modules were byte-identical. That result does not cover every module in the graph.
- **VERIFIED IN SOURCE:** The target screen/test and notification database path use static imports; no target-path dynamic `import()` was identified. The navigation mock and setup are not conditional on cache mode.
- **UNRESOLVED:** The CPU profile spans the whole process and does not phase-tag transform samples against the component's render-to-commit interval. It cannot establish that Babel runs during React rendering or that Babel is the direct cause of the one-second waitFor miss.
- **PLAUSIBLE — NOT PROVEN:** Uncached transformation, synchronous filesystem/module-resolution work, and increased memory/GC could contribute to system-level scheduling pressure. An additional render-specific or dependency-initialization cost may also be present. The event-loop histogram is process-wide and cannot distinguish those causes.
- **UNRESOLVED:** Which function or dependency accounts for the long uncached render-to-commit interval; whether the delay is primarily synchronous component work, lazy dependency initialization elsewhere in the render tree, OS/filesystem latency, or other environmental pressure; and whether a targeted fix can make the test pass reliably.

### Cache-side-effect limitation and artifact handling

The commands were run with the requested `--no-cache` flag, but this Jest version's source path writes transformed outputs after every cache miss, including when cache reads are disabled. The no-cache runs likely refreshed existing transform entries in `C:\Users\User\AppData\Local\Temp\jest`. No cache deletion or direct/manual cache edit was performed. Because no pre-run cache snapshot existed, the previous exact cache-file timestamps/bytes cannot be reconstructed; no attempt was made to roll back or rewrite cache files.

CPU profiles, logs, event-loop traces, and the temporary preload were kept outside the repository and removed after analysis. The temporary preload did not alter Jest configuration or repository source.

### Root-cause conclusion

1. **VERIFIED BY EXPERIMENT:** Uncached Jest transformation is a major contributor to total process CPU time and runtime in this run.
2. **VERIFIED BY EXPERIMENT:** The uncached process also exhibited substantially more process-wide event-loop delay, GC activity, filesystem/module-resolution samples, and higher memory-at-exit.
3. **UNRESOLVED:** The evidence does not establish that Babel transformation is the direct cause of the Notification Centre's delayed React commit or RNTL timeout. The root cause of the failing empty-state test remains unresolved.
4. Keep the Notification Centre empty-state test as an **open acceptance blocker** pending separately approved investigation and a reliable correction. No correction was implemented and no Phase 2E.1.7.2.2 work was started.

### Exact initial Git status

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
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_5_NOTIFICATION_TEST_HARNESS_ROOT_CAUSE_AUDIT.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_6_ADVANCED_TEST_HARNESS_INVESTIGATION.md
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_7_JEST_TRANSFORM_CACHE_DIFFERENTIAL_AUDIT.md
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

### Exact final Git status

The final status is the initial 159-entry listing above unchanged, plus:

```text
?? docs/AES_GUARDIAN_PHASE2E1_7_2_1_8_RUNTIME_PERFORMANCE_PROFILE_REPORT.md
```

No source or test change was retained. The existing Jest transform cache may have been refreshed by Jest's own no-cache transform writes, as documented above; it was not manually cleared or edited.
