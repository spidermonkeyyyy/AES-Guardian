# SANAD Phase 2E.5 — Global Typography and Hugeicons Migration

## Result and limitations

This batch integrates the approved Latin fonts and establishes Hugeicons as the shared icon system for active application UI. Young Serif is used for Latin display text, Instrument Sans for Latin body/interface text, and Arabic continues to use the platform's Arabic-capable system fallback. The supplied Ramis Arabic trial font is not distributed because redistribution permission has not been established.

The Android debug build and the automated Jest suite passed. This is not a release-readiness declaration: the project typecheck still reports diagnostics, lint is blocked by the repository's missing ESLint 9 flat configuration, native visual coverage is partial, full accessibility acceptance was not performed, and the notification button did not navigate on the final installed APK.

## Preservation preflight and final comparison

Preflight was captured before implementation in `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\SANAD-Phase2E5-preflight-20261121\`. It includes a complete `git status --porcelain=v1 -uall` path manifest, expanded untracked paths, staged-path list, branch, HEAD, index tree, lockfile hash, and compatibility-file hashes.

| Check | Preflight | Final before this report | Final with this report |
|---|---:|---:|---:|
| Branch | `migration/aes-guardian` | unchanged | unchanged |
| HEAD | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` | unchanged | unchanged |
| Index tree | `983733927b18bf30b8377f84c9c1813c74c4bf6b` | unchanged | unchanged |
| Staged paths | 0 | 0 | 0 |
| Status paths, including expanded untracked files | 264 | 319 | 320 |
| Lockfile SHA-256 | `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667` | `7025E74521BB84E1348ACC87C1D2C7D8BDEC954B988B2CF29D399615D0498313` | same |

Path-set comparison found 57 paths newly present after preflight and two paths no longer modified: `android\.gradle\8.11.1\checksums\checksums.lock` and `android\.gradle\noVersion\buildLogic.lock`. The new documentation accounts for the 58th newly present path in the final count. The two Gradle cache paths were recorded in the preflight manifest, but their contents were not snapshotted, so byte-for-byte preservation of those generated cache files cannot be claimed. No Git staging, commit, branch change, reset, clean, restore, checkout, stash, or remote operation was performed.

The Phase 2E.2D compatibility files match their saved preflight hashes: `android\compat-pointer-events\build.gradle` SHA-256 `8D27ACAFC5E8A521CC5F01947C93A399F0EF02301EF90FD56985A47FE66600AF`, and `android\compat-pointer-events\src\main\kotlin\com\facebook\react\uimanager\ReactPointerEventsView.kt` SHA-256 `DD70743F9EB2FD58045168C7023D300B7296858AD5B02746DF5BD18B14FC60AE`. The Phase 2E.4 APKs and evidence remain in the session evidence area. Fresh build, screenshots, logs, bundle checks, and DEX extracts are outside the repository at `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E5-20261121\`.

### Post-preflight path inventory

The following paths became newly present in the status path set after preflight; this is a path-set comparison, not a claim that every file is a new untracked file. Existing preflight paths are preserved in the saved manifest.

```text
android\app\src\main\assets\fonts\InstrumentSans_bold.ttf
android\app\src\main\assets\fonts\InstrumentSans.ttf
android\app\src\main\assets\fonts\OFL-InstrumentSans.txt
android\app\src\main\assets\fonts\OFL-YoungSerif.txt
android\app\src\main\assets\fonts\YoungSerif_bold.ttf
android\app\src\main\assets\fonts\YoungSerif.ttf
metro.config.js
package-lock.json
package.json
src\components\__tests__\AppIcon.test.tsx
src\components\AppButton.tsx
src\components\AppHeader.tsx
src\components\AppIcon.tsx
src\components\AppInput.tsx
src\components\RespiBadge.tsx
src\features\aes-guardian\components\AesStatusBadge.tsx
src\features\alerts\screens\AlertsListScreen.tsx
src\features\authentication\screens\ForgotPasswordScreen.tsx
src\features\authentication\screens\RegisterScreen.tsx
src\features\communication\screens\PatientMessagesScreen.tsx
src\features\design_preview\screens\DesignSystemScreen.tsx
src\features\monitoring\components\MonitoringProgress.tsx
src\features\monitoring\components\QuestionOptionCard.tsx
src\features\monitoring\components\QuestionRenderer.tsx
src\features\monitoring\components\SpO2Input.tsx
src\features\monitoring\screens\MonitoringHistoryScreen.tsx
src\features\monitoring\screens\MonitoringIntroScreen.tsx
src\features\monitoring\screens\MonitoringQuestionScreen.tsx
src\features\monitoring\screens\MonitoringResultScreen.tsx
src\features\monitoring\screens\MonitoringReviewScreen.tsx
src\features\nurse\dashboard\screens\NurseDashboardScreen.tsx
src\features\nurse\dashboard\widgets\worklist-filter-bar.tsx
src\features\nurse\dashboard\widgets\worklist-item-card.tsx
src\features\nurse\patients\screens\NursePatientsScreen.tsx
src\features\nurse\rules\screens\RuleBuilderScreen.tsx
src\features\nurse\rules\screens\RuleDetailScreen.tsx
src\features\nurse\rules\screens\RulesScreen.tsx
src\features\nurse\screens\NurseDashboardScreen.tsx
src\features\nurse\screens\NursePatientsScreen.tsx
src\features\patient\education\repositories\education-repository.mock.ts
src\features\patient\education\screens\EducationScreen.tsx
src\features\patient\education\screens\ExerciseDetailScreen.tsx
src\features\patient\education\screens\ExerciseSessionScreen.tsx
src\features\patient\education\screens\RehabilitationScreen.tsx
src\features\patient\education\screens\SmokingCessationScreen.tsx
src\features\patient\education\screens\SmokingEntryScreen.tsx
src\features\patient\education\screens\SmokingProgressScreen.tsx
src\features\patient\messaging\screens\PatientConversationScreen.tsx
src\features\patient\messaging\screens\PatientMessagesScreen.tsx
src\features\patient\screens\PatientHomeScreen.tsx
src\features\patient\screens\PatientTreatmentScreen.tsx
src\features\patient\treatment\screens\AdherenceHistoryScreen.tsx
src\features\patient\treatment\screens\InhalerEducationScreen.tsx
src\features\patient\treatment\screens\MedicationDetailScreen.tsx
src\features\patient\treatment\screens\TreatmentScreen.tsx
docs\SANAD_PHASE2E5_GLOBAL_TYPOGRAPHY_HUGHEICONS_MIGRATION.md
```

The following complete timestamp-derived touched-path inventory is also preserved from `changed-after-preflight.txt`; unlike the 58-path set delta above, it includes paths that were already modified at preflight and generated build/cache files touched during validation. It records paths, not byte-level attribution of each line change.

```text
App.tsx
android\.gradle\8.11.1\executionHistory\executionHistory.bin
android\.gradle\8.11.1\executionHistory\executionHistory.lock
android\.gradle\8.11.1\fileHashes\fileHashes.bin
android\.gradle\8.11.1\fileHashes\fileHashes.lock
android\.gradle\8.11.1\fileHashes\resourceHashesCache.bin
android\.gradle\buildOutputCleanup\buildOutputCleanup.lock
android\.gradle\buildOutputCleanup\outputFiles.bin
android\.gradle\file-system.probe
android\app\build.gradle
android\build.gradle
jest.config.js
metro.config.js
package-lock.json
package.json
src\components\AppButton.tsx
src\components\AppHeader.tsx
src\components\AppInput.tsx
src\components\RespiBadge.tsx
src\components\SanadLogo.tsx
src\features\aes-guardian\__tests__\admin-review-batch5-acceptance.test.tsx
src\features\aes-guardian\__tests__\correction-workflow.test.tsx
src\features\aes-guardian\__tests__\declaration-workflow.test.tsx
src\features\aes-guardian\__tests__\notification-centre.test.tsx
src\features\aes-guardian\__tests__\oh-coordination-batch6-acceptance.test.tsx
src\features\aes-guardian\__tests__\oh-coordination-detail-screen.test.tsx
src\features\aes-guardian\__tests__\onboarding-demo-entry.test.tsx
src\features\aes-guardian\__tests__\prevention-action-create-ui.test.tsx
src\features\aes-guardian\__tests__\prevention-action-detail-ui.test.tsx
src\features\aes-guardian\__tests__\prevention-action-register-ui.test.tsx
src\features\aes-guardian\__tests__\surveillance-dashboard-ui.test.tsx
src\features\aes-guardian\components\AesButton.tsx
src\features\aes-guardian\components\AesOptionCard.tsx
src\features\aes-guardian\components\AesRoundArrowButton.tsx
src\features\aes-guardian\components\AesScreenHeader.tsx
src\features\aes-guardian\components\AesStatusBadge.tsx
src\features\aes-guardian\screens\AdminReviewActionScreen.tsx
src\features\aes-guardian\screens\AdminReviewQueueScreen.tsx
src\features\aes-guardian\screens\AesGuardianProfileScreen.tsx
src\features\aes-guardian\screens\AesGuardianWorkspaceScreen.tsx
src\features\aes-guardian\screens\CorrectionResponseScreen.tsx
src\features\aes-guardian\screens\CreateCoordinationScreen.tsx
src\features\aes-guardian\screens\DeclarationCoordinationStatusScreen.tsx
src\features\aes-guardian\screens\DeclarationDetailsScreen.tsx
src\features\aes-guardian\screens\DeclarationFormScreen.tsx
src\features\aes-guardian\screens\DeclarationListScreen.tsx
src\features\aes-guardian\screens\DemoAccountPickerScreen.tsx
src\features\aes-guardian\screens\HelpGlossaryScreen.tsx
src\features\aes-guardian\screens\LanguageSelectionScreen.tsx
src\features\aes-guardian\screens\NotificationCentreScreen.tsx
src\features\aes-guardian\screens\OhCoordinationDetailScreen.tsx
src\features\aes-guardian\screens\OhCoordinationQueueScreen.tsx
src\features\aes-guardian\screens\OhFollowUpEventScreen.tsx
src\features\aes-guardian\screens\PreventionActionCreateScreen.tsx
src\features\aes-guardian\screens\PreventionActionDetailScreen.tsx
src\features\aes-guardian\screens\PreventionActionRegisterScreen.tsx
src\features\aes-guardian\screens\PreventionOverviewScreen.tsx
src\features\aes-guardian\screens\PrototypeDisclaimerScreen.tsx
src\features\aes-guardian\screens\SplashScreen.tsx
src\features\aes-guardian\screens\SubmissionConfirmationScreen.tsx
src\features\aes-guardian\screens\SurveillanceDashboardScreen.tsx
src\features\aes-guardian\screens\WelcomeCarouselScreen.tsx
src\features\alerts\screens\AlertsListScreen.tsx
src\features\authentication\screens\AuthGateScreen.tsx
src\features\authentication\screens\ForgotPasswordScreen.tsx
src\features\authentication\screens\LoginScreen.tsx
src\features\authentication\screens\RegisterScreen.tsx
src\features\authentication\screens\SplashScreen.tsx
src\features\communication\screens\NurseMessagesScreen.tsx
src\features\communication\screens\PatientMessagesScreen.tsx
src\features\design_preview\screens\DesignSystemScreen.tsx
src\features\monitoring\components\MonitoringProgress.tsx
src\features\monitoring\components\QuestionOptionCard.tsx
src\features\monitoring\components\QuestionRenderer.tsx
src\features\monitoring\components\SpO2Input.tsx
src\features\monitoring\screens\MonitoringHistoryScreen.tsx
src\features\monitoring\screens\MonitoringIntroScreen.tsx
src\features\monitoring\screens\MonitoringQuestionScreen.tsx
src\features\monitoring\screens\MonitoringResultScreen.tsx
src\features\monitoring\screens\MonitoringReviewScreen.tsx
src\features\nurse\dashboard\screens\NurseDashboardScreen.tsx
src\features\nurse\dashboard\widgets\worklist-filter-bar.tsx
src\features\nurse\dashboard\widgets\worklist-item-card.tsx
src\features\nurse\patients\screens\NursePatientProfileScreen.tsx
src\features\nurse\patients\screens\NursePatientsScreen.tsx
src\features\nurse\rules\screens\RuleBuilderScreen.tsx
src\features\nurse\rules\screens\RuleDetailScreen.tsx
src\features\nurse\rules\screens\RulesScreen.tsx
src\features\nurse\screens\NurseAlertsScreen.tsx
src\features\nurse\screens\NurseDashboardScreen.tsx
src\features\nurse\screens\NursePatientsScreen.tsx
src\features\nurse\screens\NurseProfileScreen.tsx
src\features\patient\education\repositories\education-repository.mock.ts
src\features\patient\education\screens\EducationScreen.tsx
src\features\patient\education\screens\ExerciseDetailScreen.tsx
src\features\patient\education\screens\ExerciseSessionScreen.tsx
src\features\patient\education\screens\RehabilitationScreen.tsx
src\features\patient\education\screens\SmokingCessationScreen.tsx
src\features\patient\education\screens\SmokingEntryScreen.tsx
src\features\patient\education\screens\SmokingProgressScreen.tsx
src\features\patient\messaging\screens\PatientConversationScreen.tsx
src\features\patient\messaging\screens\PatientMessagesScreen.tsx
src\features\patient\screens\PatientHomeScreen.tsx
src\features\patient\screens\PatientProfileScreen.tsx
src\features\patient\screens\PatientTreatmentScreen.tsx
src\features\patient\treatment\screens\AdherenceHistoryScreen.tsx
src\features\patient\treatment\screens\InhalerEducationScreen.tsx
src\features\patient\treatment\screens\MedicationDetailScreen.tsx
src\features\patient\treatment\screens\TreatmentScreen.tsx
src\features\patient_dashboard\widgets\care_team_card.tsx
src\features\patient_dashboard\widgets\dashboard_header.tsx
src\features\patient_dashboard\widgets\medication_card.tsx
src\features\patient_dashboard\widgets\patient_health_status_card.tsx
src\features\patient_dashboard\widgets\rehabilitation_card.tsx
src\localization\index.ts
src\navigation\AppNavigator.tsx
src\theme\tokens\aesTypography.ts
android\app\src\main\assets\fonts\InstrumentSans.ttf
android\app\src\main\assets\fonts\InstrumentSans_bold.ttf
android\app\src\main\assets\fonts\OFL-InstrumentSans.txt
android\app\src\main\assets\fonts\OFL-YoungSerif.txt
android\app\src\main\assets\fonts\YoungSerif.ttf
android\app\src\main\assets\fonts\YoungSerif_bold.ttf
jest.setup.js
src\components\AppIcon.tsx
src\components\AppText.tsx
src\components\AppTextInput.tsx
src\components\__tests__\AppIcon.test.tsx
src\features\aes-guardian\__tests__\declaration-coordination-status.test.tsx
src\features\authentication\__tests__\entry-experience.test.tsx
src\features\authentication\screens\AccessScreen.tsx
src\navigation\DirectionalStackBackButton.tsx
src\navigation\__tests__\DirectionalStackBackButton.test.tsx
src\theme\tokens\fontFamilies.ts
```

## Font provenance and licensing

Assets were obtained from the requested official project repositories, not third-party font download sites.

| Typeface | Official source and revision | Version/axes | Distributed files and SHA-256 | License |
|---|---|---|---|---|
| Young Serif | [noirblancrouge/YoungSerif](https://github.com/noirblancrouge/YoungSerif), commit `8a6c3ceeed5e52bd77b0dfad6b76e99096b9fd4b` | Variable font v6.002; weight axis 300–700; required Latin glyph coverage inspected | `YoungSerif.ttf`: `1171A770B099B47FD0AF6848D9901BBD6EFB02A0953B6EA8BA36FACFCBF12700`; `YoungSerif_bold.ttf`: `33896ADCD2563EFBE03FFD256A86B1A3D348AD2CE66E0E694262539F8871058C` | SIL Open Font License 1.1; notice bundled as `OFL-YoungSerif.txt`, SHA-256 `737D8D343B674C6894F373DE71A044B6782C130F2AEBF180933D63DDF7A3DC19` |
| Instrument Sans | [Instrument/instrument-sans](https://github.com/Instrument/instrument-sans), commit `7fa22308a3d0c94ee2b3cd537a1196b65db34a3e` | Variable font v1.000; width axis 75–100 and weight axis 400–700; regular and bold files supplied; required Latin glyph coverage inspected | `InstrumentSans.ttf`: `B24F1812584816958AFCF22E22D08E44318C5E51651E25D2438EFDDE389B33B1`; `InstrumentSans_bold.ttf`: `735BADEB8B2046CEE6F5E1226412AB6C29DB04ACCBCA413AF03D70E991DCE10D` | SIL Open Font License 1.1; notice bundled as `OFL-InstrumentSans.txt`, SHA-256 `9E27A72ED30EB49A08678F6A5D6ED98EC7BA5368F541637EE0683EC9134EF966` |

Font files and license notices are in `android\app\src\main\assets\fonts\`. The app has an Android native target; no iOS project exists in this repository.

The supplied `Ramis Arabic.otf` was identified as `Ramis Arabic TRIAL Medium`, SHA-256 `ED0CFEED62EAAFE5A8306B098D0E98FBA6D19346F5229AF4C15087029656DACC`. It is not embedded or redistributed. To enable it, obtain an explicit license grant covering application embedding and redistribution (including the intended platforms and commercial/non-commercial distribution terms). Until then Arabic uses `Geeza Pro` on iOS and `sans-serif` on Android through the existing platform fallback.

## Typography architecture and adoption

- `src\theme\tokens\fontFamilies.ts` centralizes approved font families, availability, system fallbacks, and locale resolution.
- `src\theme\tokens\aesTypography.ts` centralizes typography styles/tokens.
- `src\components\AppText.tsx` and `src\components\AppTextInput.tsx` apply font tokens to shared text and input surfaces.
- French and English resolve display roles to Young Serif and body/interface roles to Instrument Sans. Arabic resolves all text roles to the Arabic-capable fallback while Ramis remains unavailable.
- Shared components and active screens were updated for headings, navigation titles, metrics, forms, cards, buttons, notifications, history, prevention/CAPA, help, profile, and empty/loading/error UI. Young Serif is reserved for display emphasis rather than body text.
- No global `I18nManager` direction forcing was added. Existing font scaling, accessibility and layout behavior remain governed by the shared components and platform text controls.

## Hugeicons package and shared icon architecture

The installed React Native version is `0.76.9`. The direct dependencies are `@hugeicons/react-native@1.0.17` and `@hugeicons/core-free-icons@4.4.0`. `react-native-svg@15.12.1` is used because the later `15.16.1` tested in this work was incompatible with React Native 0.76. The package changes are limited to Hugeicons and the required SVG compatibility adjustment. Metro package exports are enabled for direct per-icon imports; only icons used by the shared registry are imported, avoiding a wholesale collection import.

`src\components\AppIcon.tsx` is the shared renderer and registry:

- Central sizes: `xs=12`, `sm=16`, `md=20`, `lg=24`, `xl=32`, `display=48`.
- Central stroke widths: `compact=1.5`, `standard=1.75`, `strong=2`.
- Theme foreground is the default color; caller-supplied theme colors remain supported.
- Meaningful icons expose an accessible image label; icons without a label are decorative and hidden from accessibility traversal. `AppIconLabel` pairs a decorative icon with readable text.
- `back`, `forward`, `back-chevron`, and `forward-chevron` resolve using the current layout direction. Medical, clock, notification, status, and other semantic symbols are not mirrored.
- The original SANAD logo and non-icon illustrations are unchanged.

### Active icon inventory and Hugeicons mapping

The registry provides 66 semantic aliases backed by 63 direct free-collection imports. Reused exports are intentional: `sliders`/`settings` use `Settings01Icon`, `chart`/`bar-chart-2` use `Chart02Icon`, and `alert-triangle`/`security-warning` use `SecurityWarningIcon`.

| App alias | Hugeicons free export | App alias | Hugeicons free export |
|---|---|---|---|
| `arrow-left` | `ArrowLeft01Icon` | `arrow-right` | `ArrowRight01Icon` |
| `arrow-up` | `ArrowUp01Icon` | `arrow-down` | `ArrowDown01Icon` |
| `chevron-left` | `ChevronLeftIcon` | `chevron-right` | `ChevronRightIcon` |
| `chevron-up` | `ChevronUpIcon` | `chevron-down` | `ChevronDownIcon` |
| `home` | `Home01Icon` | `activity` | `Activity01Icon` |
| `message-circle` | `MessageCircleIcon` | `message-square` | `MessageSquareIcon` |
| `package` | `Package01Icon` | `user` | `UserIcon` |
| `users` | `UserGroupIcon` | `user-switch` | `UserSwitchIcon` |
| `bell` | `Notification03Icon` | `alert-circle` | `AlertCircleIcon` |
| `alert-triangle` | `SecurityWarningIcon` | `check` | `Tick01Icon` |
| `check-circle` | `CheckmarkCircle01Icon` | `shield-check` | `ShieldCheckIcon` |
| `shield` | `Shield01Icon` | `send` | `MailSend01Icon` |
| `clock` | `Clock01Icon` | `clipboard` | `ClipboardIcon` |
| `clipboard-list` | `ClipboardListIcon` | `moon` | `Moon01Icon` |
| `sun` | `Sun01Icon` | `sliders` | `Settings01Icon` |
| `settings` | `Settings01Icon` | `search` | `Search01Icon` |
| `disc` | `Medicine01Icon` | `heart` | `HeartIcon` |
| `log-out` | `Logout01Icon` | `copy` | `CopyIcon` |
| `info` | `InformationCircleIcon` | `filter` | `FilterIcon` |
| `globe` | `GlobeIcon` | `help-circle` | `HelpCircleIcon` |
| `question` | `QuestionIcon` | `smartphone` | `SmartPhone01Icon` |
| `layout` | `DashboardSquare01Icon` | `mail` | `Mail01Icon` |
| `medical` | `StethoscopeIcon` | `document` | `File01Icon` |
| `document-add` | `FileAddIcon` | `document-edit` | `FileEditIcon` |
| `report` | `DocumentValidationIcon` | `chart` | `Chart02Icon` |
| `bar-chart-2` | `Chart02Icon` | `scale` | `JusticeScale01Icon` |
| `target` | `Target01Icon` | `add` | `Add01Icon` |
| `book` | `Book01Icon` | `book-open` | `BookOpen01Icon` |
| `calendar` | `Calendar01Icon` | `lock` | `LockIcon` |
| `warning` | `Alert01Icon` | `security-warning` | `SecurityWarningIcon` |
| `video` | `Video01Icon` | `delete` | `Delete01Icon` |
| `cancel` | `Cancel01Icon` | `play` | `PlayIcon` |
| `sparkles` | `SparklesIcon` | `task` | `Task01Icon` |

This inventory covers the active source registry; icon uses throughout active shared components and screens route through `AppIcon` rather than independently configured Hugeicons. No active source imports from legacy Lucide/Material icon libraries or emoji-as-icons remain. The pre-existing `react-native-vector-icons` package remains in the dependency tree but is not directly imported by active application source. No free-icon equivalence exception was required in the migrated registry.

## RTL and accessibility behavior

French and English remain LTR; Arabic uses the established RTL localization direction. Back/forward arrows and directional chevrons reverse in Arabic while nondirectional semantic icons retain their orientation. Accessible labels are supplied by meaningful control usages; decorative icons are omitted from the screen-reader tree. Native touch targets and button behavior are retained. The wrapper tests cover direction resolution and decorative/meaningful accessibility states, but this is not a full accessibility audit.

## Automated verification

| Check | Result |
|---|---|
| Full Jest suite after the notification-route test update | **Passed: 60 suites, 1,300 tests** |
| Focused shared icon/typography tests | Included in the passing suite; covers registry, token defaults, color, accessibility, and RTL behavior |
| Project TypeScript check | **684 diagnostics** overall; metadata-based attribution found **567 diagnostics across 21 touched files**. The pre-task baseline was 694 overall, a net reduction of 10, but these pre-existing diagnostics remain and per-diagnostic attribution is unavailable. |
| ESLint | **Blocked**: ESLint 9.39.5 cannot find the required `eslint.config.*` configuration. |
| `git diff --check` | Passed on the final tracked diff; the untracked report was separately checked for trailing whitespace (none). Git emitted only existing LF-to-CRLF working-copy notices. |

## Android build and runtime evidence

The final fresh debug APK was built with the established isolated compatibility build process, using serialized Gradle workers and preserving the `compat-pointer-events` repair. Build logs and the init script are in the evidence directory above.

| Evidence | Result |
|---|---|
| Final APK | `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E5-20261121\isolated-build-final\_app\outputs\apk\debug\app-debug.apk` |
| APK size | 183,451,047 bytes; baseline 182,985,507 bytes; increase 465,540 bytes (~0.25%) |
| APK SHA-256 | `1FE1717AE767AB79FF722A479BF30FD2CD4D690812995459E34E75D23E8156B2` |
| Generated and embedded JS bundle | Both 2,047,692 bytes; matching SHA-256 `8175C50A7CD95FEACA0D2CAB685D9D3ADCA50F45A508E06F717D818D14F16A56` |
| DEX check | Exactly one `ReactPointerEventsView` definition across 17 DEX files |
| App identity | `com.sanad`, label `Sanad`, version `0.1.0` |
| Update installation | `adb install -r` succeeded; `firstInstallTime` remained `2026-11-12 23:35:57`; app data was not cleared |
| Embedded runtime | Metro listener and `adb reverse` mapping were absent during validation; embedded Hermes startup and locale persistence were confirmed. Logs include failed attempts to reach `10.0.2.2:8081`, with no Metro server available. |

The final APK is 465,540 bytes larger than the baseline (~0.25%). Direct per-icon imports and Metro package-export support keep unused Hugeicons out of the application bundle; this modest APK change is consistent with bundling the font files and used icon code, rather than the full icon catalog.

## Native visual evidence and coverage

Screenshots and matching accessibility-window XML files are stored under `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E5-20261121\`. Inspected coverage includes:

- Welcome: French, English, Arabic.
- Access and demo picker: French, English, Arabic.
- Workspace: French, English, Arabic.
- Declaration form: French, Arabic.
- Administrative review queue: French.
- Occupational-health queue, detail, and follow-up: French and Arabic.
- Surveillance dashboard and prevention register: French.
- Profile: French.
- Help: Arabic.

The final visual checks confirmed bundled Latin fonts, shared Hugeicons styling, and RTL arrow placement/orientation on inspected screens. This does not establish that all locales or all 26 screens passed. Declaration list/details, administrative review action, and a real notification-center screen were not accepted as natively verified. In particular, tapping the workspace notification control left the app on the workspace on the final installed APK, even though the demo fallback route registration and route test were updated. The files named `notifications_fr.png` and `notifications_ar.png` show the workspace, not the notification center, and must not be treated as notification-screen evidence. Some English/Arabic workspace role/account labels remain French; that pre-existing localization limitation is outside this typography/icon batch.

## Functional scope and remaining limitations

The intended changes are limited to typography, icon rendering, compatible package/configuration updates, and registration of the notification-center route in the demo fallback branch. No database schema or repository contract change was intended. The original SANAD logo, brand identity, role IDs, permissions, workflows, and offline persistence were not redesigned as part of this batch.

Remaining limitations:

- Ramis Arabic redistribution permission is required before embedding that font.
- Native verification is representative and partial; no full 26-screen or all-locale acceptance is claimed.
- Accessibility was not fully audited.
- The notification control's native navigation remains unresolved.
- Project TypeScript diagnostics remain; lint cannot run until the repository supplies an ESLint 9 flat config.
- No release build or release-readiness claim is made.
