# SANAD Legacy Cleanup — Final Report

## A. Cleanup summary

The active React Native application now starts at the existing AES Guardian splash and onboarding flow. The RespiraCare authentication gate, patient/nurse navigation, respiratory monitoring, nurse dashboards, patient-care features, alert/rule modules, their repositories/types/tests, and obsolete translations were removed after reference checks. Generic authentication contracts remain and now use the approved AES role type.

The README now describes SANAD's AES purpose. The Android label is `SANAD`; its namespace, application ID, manifest package, and React Native component registration remain coherent (`com.sanad` / `sanad-rn`). The existing SANAD logo and alternate SANAD logo assets were preserved. No dependencies were removed because the Hugeicons dependency is already in use and no Feather dependency remained in the package manifest.

Cleanup removed 182 tracked files. No changes were staged or committed. Pre-existing Android build/cache modifications, untracked skills, the Phase 5 report, debug bundle, compatibility build artifacts, and other user files were preserved.

## B. Deletion register

The following is the complete tracked-file deletion register for this cleanup. It excludes pre-existing changes under `android/.gradle` and `android/compat/build`.

- `android/android/.gitignore`
- `android/android/app/build.gradle.kts`
- `android/android/app/src/dark/res/drawable-hdpi/ic_launcher_foreground.png`
- `android/android/app/src/dark/res/drawable-mdpi/ic_launcher_foreground.png`
- `android/android/app/src/dark/res/drawable-xhdpi/ic_launcher_foreground.png`
- `android/android/app/src/dark/res/drawable-xxhdpi/ic_launcher_foreground.png`
- `android/android/app/src/dark/res/drawable-xxxhdpi/ic_launcher_foreground.png`
- `android/android/app/src/dark/res/mipmap-anydpi-v26/ic_launcher_night.xml`
- `android/android/app/src/dark/res/mipmap-hdpi/ic_launcher_night.png`
- `android/android/app/src/dark/res/mipmap-mdpi/ic_launcher_night.png`
- `android/android/app/src/dark/res/mipmap-xhdpi/ic_launcher_night.png`
- `android/android/app/src/dark/res/mipmap-xxhdpi/ic_launcher_night.png`
- `android/android/app/src/dark/res/mipmap-xxxhdpi/ic_launcher_night.png`
- `android/android/app/src/dark/res/values/colors.xml`
- `android/android/app/src/debug/AndroidManifest.xml`
- `android/android/app/src/main/AndroidManifest.xml`
- `android/android/app/src/main/kotlin/com/example/respiracare/MainActivity.kt`
- `android/android/app/src/main/res/drawable-hdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-hdpi/ic_launcher_night_foreground.png`
- `android/android/app/src/main/res/drawable-mdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-mdpi/ic_launcher_night_foreground.png`
- `android/android/app/src/main/res/drawable-night-hdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-night-mdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-night-xhdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-night-xxhdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-night-xxxhdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-v21/launch_background.xml`
- `android/android/app/src/main/res/drawable-xhdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-xhdpi/ic_launcher_night_foreground.png`
- `android/android/app/src/main/res/drawable-xxhdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-xxhdpi/ic_launcher_night_foreground.png`
- `android/android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png`
- `android/android/app/src/main/res/drawable-xxxhdpi/ic_launcher_night_foreground.png`
- `android/android/app/src/main/res/drawable/launch_background.xml`
- `android/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.png`
- `android/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- `android/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_night.xml`
- `android/android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/android/app/src/main/res/mipmap-hdpi/ic_launcher_night.png`
- `android/android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- `android/android/app/src/main/res/mipmap-mdpi/ic_launcher_night.png`
- `android/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/android/app/src/main/res/mipmap-xhdpi/ic_launcher_night.png`
- `android/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_night.png`
- `android/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- `android/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_night.png`
- `android/android/app/src/main/res/values-night/colors.xml`
- `android/android/app/src/main/res/values-night/styles.xml`
- `android/android/app/src/main/res/values/colors.xml`
- `android/android/app/src/main/res/values/styles.xml`
- `android/android/app/src/profile/AndroidManifest.xml`
- `android/android/build.gradle.kts`
- `android/android/build/reports/problems/problems-report.html`
- `android/android/gradle.properties`
- `android/android/gradle/wrapper/gradle-wrapper.properties`
- `android/android/respiracare_android.iml`
- `android/android/settings.gradle.kts`
- `src/features/alerts/__tests__/alert-store.test.ts`
- `src/features/alerts/screens/AlertDetailScreen.tsx`
- `src/features/alerts/screens/AlertsListScreen.tsx`
- `src/features/alerts/state/use-alert-store.ts`
- `src/features/authentication/__tests__/entry-experience.test.tsx`
- `src/features/authentication/screens/AccessScreen.tsx`
- `src/features/authentication/screens/AuthGateScreen.tsx`
- `src/features/authentication/screens/ForgotPasswordScreen.tsx`
- `src/features/authentication/screens/LoginScreen.tsx`
- `src/features/authentication/screens/RegisterScreen.tsx`
- `src/features/authentication/screens/SplashScreen.tsx`
- `src/features/authentication/screens/__tests__/AuthGateScreen.test.tsx`
- `src/features/authentication/screens/__tests__/AuthScreens.test.tsx`
- `src/features/authentication/utils/role-validation.ts`
- `src/features/communication/screens/NurseMessagesScreen.tsx`
- `src/features/communication/screens/PatientMessagesScreen.tsx`
- `src/features/monitoring/__tests__/monitoring-intro.test.tsx`
- `src/features/monitoring/components/MonitoringProgress.tsx`
- `src/features/monitoring/components/QuestionOptionCard.tsx`
- `src/features/monitoring/components/QuestionRenderer.tsx`
- `src/features/monitoring/components/SpO2Input.tsx`
- `src/features/monitoring/data/questions.ts`
- `src/features/monitoring/screens/MonitoringHistoryScreen.tsx`
- `src/features/monitoring/screens/MonitoringIntroScreen.tsx`
- `src/features/monitoring/screens/MonitoringQuestionScreen.tsx`
- `src/features/monitoring/screens/MonitoringResultScreen.tsx`
- `src/features/monitoring/screens/MonitoringReviewScreen.tsx`
- `src/features/monitoring/state/use-monitoring-store.ts`
- `src/features/nurse/__tests__/nurse-alerts.test.tsx`
- `src/features/nurse/__tests__/nurse-dashboard-screen.test.tsx`
- `src/features/nurse/__tests__/nurse-messages-patient-detail.test.tsx`
- `src/features/nurse/__tests__/nurse-patients-screen.test.tsx`
- `src/features/nurse/__tests__/nurse-profile-screen.test.tsx`
- `src/features/nurse/__tests__/nurse-rules.test.tsx`
- `src/features/nurse/dashboard/screens/NurseDashboardScreen.tsx`
- `src/features/nurse/dashboard/state/use-nurse-dashboard-store.ts`
- `src/features/nurse/dashboard/widgets/worklist-filter-bar.tsx`
- `src/features/nurse/dashboard/widgets/worklist-item-card.tsx`
- `src/features/nurse/patients/screens/NursePatientProfileScreen.tsx`
- `src/features/nurse/patients/screens/NursePatientsScreen.tsx`
- `src/features/nurse/patients/state/use-nurse-patients-store.ts`
- `src/features/nurse/rules/screens/RuleBuilderScreen.tsx`
- `src/features/nurse/rules/screens/RuleDetailScreen.tsx`
- `src/features/nurse/rules/screens/RulesScreen.tsx`
- `src/features/nurse/rules/state/use-rule-store.ts`
- `src/features/nurse/screens/NurseAlertsScreen.tsx`
- `src/features/nurse/screens/NurseDashboardScreen.tsx`
- `src/features/nurse/screens/NursePatientsScreen.tsx`
- `src/features/nurse/screens/NurseProfileScreen.tsx`
- `src/features/patient/__tests__/patient-profile-messages.test.tsx`
- `src/features/patient/__tests__/patient-screens.test.tsx`
- `src/features/patient/education/__tests__/education.test.ts`
- `src/features/patient/education/__tests__/educational-content.test.ts`
- `src/features/patient/education/__tests__/rehabilitation.test.ts`
- `src/features/patient/education/__tests__/smoking-cessation.test.ts`
- `src/features/patient/education/repositories/education-repository.mock.ts`
- `src/features/patient/education/repositories/education-repository.ts`
- `src/features/patient/education/screens/EducationScreen.tsx`
- `src/features/patient/education/screens/ExerciseDetailScreen.tsx`
- `src/features/patient/education/screens/ExerciseSessionScreen.tsx`
- `src/features/patient/education/screens/RehabilitationScreen.tsx`
- `src/features/patient/education/screens/SmokingCessationScreen.tsx`
- `src/features/patient/education/screens/SmokingEntryScreen.tsx`
- `src/features/patient/education/screens/SmokingProgressScreen.tsx`
- `src/features/patient/education/state/use-education-store.ts`
- `src/features/patient/education/state/use-smoking-cessation-store.ts`
- `src/features/patient/messaging/__tests__/communication.test.ts`
- `src/features/patient/messaging/repositories/conversation-repository.mock.ts`
- `src/features/patient/messaging/repositories/conversation-repository.ts`
- `src/features/patient/messaging/screens/PatientConversationScreen.tsx`
- `src/features/patient/messaging/screens/PatientMessagesScreen.tsx`
- `src/features/patient/messaging/state/use-patient-messages-store.ts`
- `src/features/patient/screens/PatientHomeScreen.tsx`
- `src/features/patient/screens/PatientProfileScreen.tsx`
- `src/features/patient/screens/PatientTreatmentScreen.tsx`
- `src/features/patient/treatment/__tests__/treatment.test.ts`
- `src/features/patient/treatment/__tests__/video-submission.test.ts`
- `src/features/patient/treatment/repositories/mock_video_upload_repository.ts`
- `src/features/patient/treatment/repositories/treatment-repository.mock.ts`
- `src/features/patient/treatment/repositories/treatment-repository.ts`
- `src/features/patient/treatment/screens/AdherenceHistoryScreen.tsx`
- `src/features/patient/treatment/screens/InhalerEducationScreen.tsx`
- `src/features/patient/treatment/screens/MedicationDetailScreen.tsx`
- `src/features/patient/treatment/screens/TreatmentScreen.tsx`
- `src/features/patient/treatment/state/use-treatment-store.ts`
- `src/features/patient/treatment/state/use-video-submission-store.ts`
- `src/features/patient/treatment/types/inhaler_video.ts`
- `src/features/patient_dashboard/PatientDashboardScreen.tsx`
- `src/features/patient_dashboard/widgets/care_team_card.tsx`
- `src/features/patient_dashboard/widgets/dashboard_header.tsx`
- `src/features/patient_dashboard/widgets/medication_card.tsx`
- `src/features/patient_dashboard/widgets/patient_health_status_card.tsx`
- `src/features/patient_dashboard/widgets/rehabilitation_card.tsx`
- `src/services/repositories/__tests__/monitoring-repository.test.ts`
- `src/services/repositories/__tests__/rule-repository.test.ts`
- `src/services/repositories/alert-repository.mock.ts`
- `src/services/repositories/alert.ts`
- `src/services/repositories/monitoring-repository.mock.ts`
- `src/services/repositories/monitoring.ts`
- `src/services/repositories/nurse-dashboard.mock.ts`
- `src/services/repositories/nurse-dashboard.ts`
- `src/services/repositories/nurse-patient-repository.interface.ts`
- `src/services/repositories/nurse-patient-repository.mock.ts`
- `src/services/repositories/rule-repository.mock.ts`
- `src/services/repositories/rule.ts`
- `src/types/alert.ts`
- `src/types/assessment.ts`
- `src/types/assignment.ts`
- `src/types/auth.ts.bak`
- `src/types/communication.ts`
- `src/types/dashboard.ts`
- `src/types/education.ts`
- `src/types/measurement.ts`
- `src/types/monitoring-question.ts`
- `src/types/monitoring.ts`
- `src/types/patient.ts`
- `src/types/rule.ts`
- `src/types/treatment.ts`
- `src/utils/clinical/__tests__/clinical-invariants.test.ts`
- `src/utils/clinical/__tests__/rule-engine.boundary.test.ts`
- `src/utils/clinical/__tests__/rule-engine.test.ts`
- `src/utils/clinical/rule-engine.ts`
- `src/utils/navigation/__tests__/redirect.test.ts`
- `src/utils/navigation/redirect.ts`

## C. Icon migration

- Source Feather imports/references before and after this cleanup: **0**; the Hugeicons migration was already present.
- Tracked main Android bundle: **3** `Feather` text occurrences before regeneration; **0** afterward. The regenerated bundle also has no old patient/nurse tab names, SpO₂, COPD/BPCO, or RespiraCare strings.
- Feather dependency in `package.json`: **0**.
- A pre-existing untracked debug bundle remains untouched; it contains `RespiraCare` (2), `COPD` (3), `BPCO` (1), `SpO2` (17), `Feather` (2), and `patientTabs`/`nurseTabs` (2 each). See sections H and I.

## D. Branding migration

- `app.json` display name and Android `app_name` now read `SANAD`.
- Android namespace, application ID, and manifest package remain `com.sanad`; the internal React Native component name remains `sanad-rn` and matches `MainActivity`.
- The active source, configuration, and regenerated main bundle contain no RespiraCare, COPD/BPCO, SpO₂, Feather, or former patient/nurse route registrations.
- The obsolete Respiracare demo login UI and its hard-coded demo email addresses were removed.

## E. Android cleanup

- Removed the separate, unreferenced `android/android/` Flutter project: **58 tracked files**. The root Android build is React Native, has no Flutter `pubspec.yaml`, and does not include that nested project; its application ID was `com.example.respiracare`.
- Confirmed the active Android application uses the SANAD launcher icon and `com.sanad` identity.
- Regenerated `android/app/src/main/assets/index.android.bundle` and copied Metro-referenced assets through the React Native bundler.
- Preserved the pre-existing untracked `android/app/src/debug/assets/index.android.bundle`. It contains old routes and respiratory-era strings. It was not overwritten or deleted because it was present before this task.
- The `:app:assembleRelease` Gradle task graph dry-run completed successfully; the actual APK assembly was not run.

## F. Documentation and historical evidence

- Replaced the stale root README with current SANAD AES setup and architecture information.
- Preserved all historical reports and decision records. Existing historical matches were found in:
  - `docs/AES_GUARDIAN_PHASE0_2_DEDICATED_REPOSITORY_REVIEW.md`
  - `docs/AES_GUARDIAN_PHASE2E0_1_BLUEPRINT_RECONCILIATION_REPORT.md`
  - `docs/SANAD_FORENSIC_SOURCE_RECOVERY_REPORT.md`
  - `docs/SANAD_PHASE2E4_GLOBAL_TYPOGRAPHY_WELCOME_ENTRY_REDESIGN.md`
  - `docs/dump.xml` (captured runtime evidence)
- Preserved the pre-existing untracked `docs/SANAD_CAPA_PHASE5_NATIVE_ANDROID_ACCEPTANCE_REPORT.md`.

## G. Validation results

| Check | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm run lint` | Passed with 0 errors and 465 warnings |
| `npm ls --depth=0` | Passed |
| `git diff --check` | Passed; Git reported only line-ending normalization notices |
| React Native production bundle generation | Passed; Metro emitted four existing unknown-config-option warnings |
| Focused navigation/notification tests | Passed: 2 suites, 54 tests |
| Full Jest suite | Failed: 6 suites failed, 45 passed; 18 failed and 1,131 passed out of 1,149 |
| Android `:app:assembleRelease` task-graph dry-run | Passed; application assembly/package tasks were skipped |
| Emulator/runtime acceptance | Not run |

The full-suite failures are in AES UI/database assertions: `surveillance-dashboard-ui.test.tsx` (2), `declaration-list-migration.test.tsx` (4), `onboarding-demo-entry.test.tsx` (5), `declaration-list-details-batch4.test.tsx` (4), `declaration-workflow.test.tsx` (1), and `database.test.ts` (2; the test expects migrations 1–8 while the implementation applies 1–10). They are outside the removed legacy modules; a before/after baseline comparison was not run.

## H. Remaining legacy references and classification

- `android/app/src/debug/assets/index.android.bundle` — **pre-existing, untracked generated artifact**. It contains RespiraCare (2), COPD (3), BPCO (1), SpO₂ (17), Feather (2), and patient/nurse route names (2 each). It was preserved; whether a debug workflow consumes this stale asset has not been verified.
- The five historical documents listed in section F — **historical evidence**, preserved by instruction.
- `src/features/aes-guardian/__tests__/notification-centre.test.tsx` mentions `authGate`, `patientTabs`, and `nurseTabs` only in a negative assertion verifying those routes are absent.
- `src/features/aes-guardian/__tests__/onboarding-demo-entry.test.tsx` and `src/features/aes-guardian/__tests__/phase2d1-corrective-verification.test.ts` mention old role aliases only in tests that assert they are not valid AES roles.
- `src/features/aes-guardian/screens/DemoAccountPickerScreen.tsx` and its localization/tests retain the synthetic demo label `NURSE-001` for the current `exposed_professional` role. This is a demo identifier, not the old respiratory-nurse module.
- Other uses of “patient” describe AES exposure scenarios, synthetic-data disclaimers, or the absence of patient identifiers; they do not implement patient-management functionality.

## I. Unresolved risks

- The stale untracked debug bundle is the remaining generated artifact with active-code-like legacy content. It must be regenerated or removed by its owner after confirming that preservation is no longer required.
- The full Jest suite still has 18 failures in the listed AES UI/database suites.
- A real Android APK build and runtime/device acceptance were not performed. The Gradle task-graph dry-run and Metro bundle generation are not substitutes for that validation.
- Unused alternate SANAD logo variants were preserved because they are SANAD-branded and their future use is uncertain.

## J. Final assessment

The active source navigation, feature tree, current SANAD branding, and regenerated main Android bundle are free of the obsolete RespiraCare modules and generated Feather code. The repository is **not completely free of legacy artifacts** because the pre-existing untracked debug bundle still contains them, and historical evidence intentionally remains unchanged.

## K. Independent verification of the current worktree

This addendum records a separate review of the current modifications on 2026-11-24. No application source or existing deletion was changed during this review.

### Current findings

- The active navigator remains AES-only and starts at `aesSplash`. A source search found no active RespiraCare, COPD/BPCO, respiratory-monitoring, or Feather imports. Hugeicons remains integrated through `src/components/AppIcon.tsx`.
- `src/components/RespiBadge.tsx` remains and is exported from `src/components/index.ts`. Its implementation is a generic status badge, and there are no consumers beyond that barrel export, but its name is residual respiratory-era branding. Classify it as **uncertain/reusable infrastructure with legacy naming**; decide whether to rename it to a neutral name or remove the unused export before claiming complete source cleanup.
- The untracked `android/app/src/debug/assets/index.android.bundle` remains outside the deletion scope. It is generated content and its use by any current debug workflow is still unverified.
- Git currently reports **188 tracked deletions**. The deletion register above accounts for 182 deleted paths; it omits these six tracked generated files under `android/compat/build`:
  - `android/compat/build/.transforms/f60866945425cf8151f5c39319cd56e8/transformed/bundleLibRuntimeToDirDebug/bundleLibRuntimeToDirDebug_dex/com/facebook/react/uimanager/ReactPointerEventsView.dex`
  - `android/compat/build/intermediates/java_res/debug/processDebugJavaRes/out/META-INF/compat_debug.kotlin_module`
  - `android/compat/build/intermediates/runtime_library_classes_dir/debug/bundleLibRuntimeToDirDebug/META-INF/compat_debug.kotlin_module`
  - `android/compat/build/intermediates/runtime_library_classes_dir/debug/bundleLibRuntimeToDirDebug/com/facebook/react/uimanager/ReactPointerEventsView.class`
  - `android/compat/build/tmp/kotlin-classes/debug/META-INF/compat_debug.kotlin_module`
  - `android/compat/build/tmp/kotlin-classes/debug/com/facebook/react/uimanager/ReactPointerEventsView.class`

  These are generated build outputs, but their provenance is not established by the current worktree. They were not restored or deleted during this review; reconcile their status with the owner before treating the deletion register as complete.

### Independently rerun checks

| Check | Result |
|---|---|
| `npm run typecheck` | Passed (exit code 0) |
| `npm run lint` | Passed (exit code 0; warnings were emitted) |
| `npm test -- --runInBand` | Failed: 6 suites failed, 45 passed; 18 failed and 1,131 passed out of 1,149 |
| `npm ls --depth=0` | Passed (exit code 0) |
| `git diff --check` | Passed; only line-ending normalization notices |

The six failing suites cover the surveillance dashboard, declaration list migration/details, onboarding, declaration workflow, and database tests. Since no before/after baseline comparison was run, this review cannot confirm that these failures are unrelated regressions. The prior Android task-graph dry-run and Metro bundle-generation results are documented above but were **not rerun** in this independent review; no production APK build or emulator acceptance was performed.

### Updated assessment

The current navigation and application feature tree no longer expose the removed respiratory/patient-management workflows, and the declared SANAD identity is consistent across the display name and Android label. However, the cleanup is **not verified complete**: the stale generated debug bundle remains, the exported `RespiBadge` name needs classification, the six generated-file deletions are absent from the deletion register, the full test suite fails, and Android runtime acceptance is outstanding. Do not treat this repository as free of all active or residual legacy contamination until these issues are resolved or explicitly accepted.
