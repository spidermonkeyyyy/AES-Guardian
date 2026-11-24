# AES Guardian Phase 2E.3B — Native Header and Dashboard Recovery

**Technical result: RTL-01 and VIS-01 closed by focused tests and visually inspected native evidence. Overall phase: PARTIALLY ACCEPTED.** The final worktree has no staged paths and its protected hashes match, but the available preservation records show 244 status entries at preflight and 243 before this report was created; the complete preflight path list was not retained, so exact path-by-path preservation cannot be certified.

This is not full 26-screen RTL acceptance, accessibility acceptance, complete workflow acceptance, release readiness, or production readiness.

## 1. Preservation preflight and final state

Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`

| Check | Preflight | Final |
|---|---|---|
| Branch | `migration/aes-guardian` | `migration/aes-guardian` |
| HEAD | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` | unchanged |
| HEAD/index tree | `983733927b18bf30b8377f84c9c1813c74c4bf6b` | unchanged |
| Staged paths | 0 | 0 |
| Porcelain status entries | 244 | 243 before this report; 244 after adding it |
| `package-lock.json` SHA-256 | `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667` | unchanged |

The count fell from 244 at preflight to 243 before this report was created, then returned to 244 when the report was added. Whether the intermediate count difference represents a path change cannot be determined because the full Phase 2E.3B preflight path listing was not retained. The final worktree remains intentionally dirty and includes substantial pre-existing changes; no clean-worktree claim is made. Comparison against the older Phase 2E.3A record found no previously listed paths missing, but that is not a substitute for the missing Phase 2E.3B manifest.

The Phase 2E.2D compatibility repair remains present and unchanged:

- `android/compat-pointer-events/build.gradle`: SHA-256 `8D27ACAFC5E8A521CC5F01947C93A399F0EF02301EF90FD56985A47FE66600AF`
- `android/compat-pointer-events/src/main/kotlin/com/facebook/react/uimanager/ReactPointerEventsView.kt`: SHA-256 `DD70743F9EB2FD58045168C7023D300B7296858AD5B02746DF5BD18B14FC60AE`

`git diff --check` exited 0. Git emitted line-ending conversion warnings for existing working-copy files; no whitespace errors were reported. No staging, commit, branch change, reset, cleanup, stash, dependency installation, lockfile modification, or destructive operation was performed. Previous Phase 2E.2D/2E.3A APKs and evidence were preserved. Android build-generated and other pre-existing dirty paths were not reverted because their preflight ownership could not be established safely.

## 2. RTL-01 — root cause and implementation

The navigator declared French titles directly in screen options. Those strings could remain French after a runtime locale change even when screen content followed the current locale. The native-stack default back control also did not follow the app's locale-derived layout direction. A fixed-width native title could compete with that control on narrow screens.

The installed `@react-navigation/native-stack` 6.10.x types support `headerLeft`, `headerRight`, `headerBackVisible`, and centered title alignment, but do not expose a custom `header` option. The repair stays within those supported APIs: stack options read the current locale, route names map to translated title keys, the default back control is hidden, and the shared directional back button is mounted on the locale-appropriate side. The button points in the correct direction, calls `navigation.goBack()`, and uses the localized `navigation.back` accessibility label. The title is centered, shrinkable, single-line, and gets locale-aware text alignment/writing direction. No global `I18nManager` changes or Arabic-only dimensions were added.

### Native header evidence

All images below are from the final installed APK under:

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3B-20261120-2135\evidence\final`

| Case | Screenshot | Visual result |
|---|---|---|
| Workspace / FR | `workspace-fr.png` | PASS — French title centered; back control at left |
| Workspace / EN | `workspace-en.png` | PASS — English title centered; back control at left |
| Workspace / AR | `workspace-ar.png` | PASS — Arabic title visible; back control at right with right-pointing arrow |
| Profile / AR | `profile-ar.png` | PASS — Arabic title visible; back control at right and correctly oriented |
| Declarations / FR | `declarations-fr.png` | PASS — localized native-stack title and usable left-side back control |
| Dashboard / FR, EN, AR | `dashboard-fr-quality-staff-top.png`, `dashboard-en-quality-staff-top.png`, `dashboard-ar-quality-staff-top.png` | PASS — each title follows the active locale; LTR controls on left, Arabic control on right |

The three workspace, profile-AR, declarations-FR, and dashboard screenshots were visually inspected. These are focused cases, not a claim that every route or every locale combination has been natively validated.

## 3. VIS-01 — reproduction, root cause, and implementation

The prior failure showed only part of the role switcher and a blank dashboard area, without a fatal exception. The dashboard placed its horizontal, content-sized role switcher inside `AesScreenHeader.rightElement`. That slot shares the header row with title content; the unbounded horizontal scroll content could consume or expand the row and constrain/clip the dashboard content on Android.

The role switcher is now a bounded, full-width sibling immediately below the shared screen header, within the dashboard's scrollable screen container. This preserves the role-switching behavior and leaves metrics sourced from `getSurveillanceDashboardMetrics`; no synthetic values, metric meanings, schema, or database contract were changed. Role names and the filtered-record noun use locale translations. Exposure labels have sufficient width and line allowance. Existing loading and visible error/retry states are retained, and temporal, exposure, and status sections show explicit translated empty messages rather than disappearing.

### Native dashboard evidence

Evidence root is the same `evidence\final` directory above. All screenshots were visually inspected from the installed APK with Metro unavailable.

| Case | Screenshot(s) | Result |
|---|---|---|
| Populated / FR / quality staff | `dashboard-fr-quality-staff-top.png`, `dashboard-fr-quality-staff-lower.png` | PASS — translated heading/role context, nonzero metric cards, temporal/exposure/status distributions, scrollable content |
| Populated / EN / quality staff | `dashboard-en-quality-staff-top.png`, `dashboard-en-quality-staff-lower.png` | PASS — translated heading/role context, nonzero metric cards, readable distributions and labels, scrollable content |
| Populated / AR / quality staff | `dashboard-ar-quality-staff-top.png`, `dashboard-ar-quality-staff-lower.png` | PASS — Arabic labels and direction; metrics and charts render; numeric chart values remain legible |
| Empty synthetic result / FR | `dashboard-fr-empty-top.png`, `dashboard-fr-empty-lower.png` | PASS — selected 2099-01-01 through 2099-12-31 without editing persisted data; 0/4 matching summary, zero-valued cards, and explicit empty temporal, exposure, and status messages |

The empty case uses the ordinary date filters over the existing four synthetic records; it does not fabricate or delete data. Dashboard loading, populated, empty, error, role-switcher bounds, status distributions, localization, and section visibility are also covered by focused component tests. This native run did not force a database-loading failure on device; the visible failure state is verified by its test, not claimed as a native screenshot PASS.

## 4. Phase 2E.3A integration failure investigation

The prior report retained only an aggregate follow-up result of 97 passed / 12 failed, and broad categories (French label/accessibility expectations and missing queue fixtures); it did not retain all 12 individual failing test names and messages. Therefore the original failures cannot all be classified individually or proven inherited.

The stale French back-label expectation was updated to use the localized translation. OH-coordination tests reset locale state. The previously problematic `OH professional can load the queue successfully` case with fixture `AES-2025-00101` passed in isolation and in the final combined run. No queue production behavior was changed. The final combined suites—including administrative-review and OH coordination—now pass. This establishes current suite health but does not retroactively classify every unrecorded historical failure.

## 5. Files changed in Phase 2E.3B

- `src/navigation/AppNavigator.tsx` — consume active locale in native-stack header options.
- `src/navigation/DirectionalStackBackButton.tsx` — route-title translations, directional back control, accessibility label, and shrinkable title.
- `src/localization/index.ts` — workspace and filtered declaration-count translations.
- `src/features/aes-guardian/screens/SurveillanceDashboardScreen.tsx` — bound role-switcher placement, translated role/filter labels, and readable exposure labels.
- `src/navigation/__tests__/DirectionalStackBackButton.test.tsx` — FR/EN/AR titles and control direction, locale changes, localized accessibility label, and contradictory-layout coverage.
- `src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx` — loading, populated, empty, error, status distribution, FR/EN/AR labels/direction, bounded switcher, and visible sections.
- `src/features/aes-guardian/__tests__/admin-review-batch5-acceptance.test.tsx` — align relevant accessibility expectation with localized back label.
- `src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx` — isolate locale in tests and keep queue fixture behavior meaningful.
- `docs/AES_GUARDIAN_PHASE2E3B_NATIVE_HEADER_DASHBOARD_RECOVERY.md` — this evidence and decision report.

No unrelated workflow, authorization, clinical, database, or dependency changes were made as part of this phase.

## 6. Automated test results

Final combined command:

```text
npm test -- --runInBand src/navigation/__tests__/DirectionalStackBackButton.test.tsx src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx src/features/aes-guardian/__tests__/admin-review-batch5-acceptance.test.tsx src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx src/features/aes-guardian/__tests__/notification-centre.test.tsx
```

Result: **5 suites passed, 210 tests passed, 0 failed, 0 skipped; 0 snapshots.**

Focused dashboard command:

```text
npm test -- --runInBand src/features/aes-guardian/__tests__/surveillance-dashboard-ui.test.tsx
```

Result recorded for the final dashboard suite: **1 suite, 85 tests passed**.

## 7. TypeScript and lint

- `npm run typecheck -- --pretty false` — exit 2, **759 project diagnostics**. A diagnostic-path check found **0 diagnostics in the eight Phase 2E.3B source/test files**. The project-wide typecheck is not clean.
- `npm run lint` — exit 2. ESLint 9.39.5 could not find `eslint.config.js`, `.mjs`, or `.cjs`; no dependency or lint configuration changes were made to bypass this limitation.

## 8. Android build, APK, DEX, bundle, and runtime

The final debug build succeeded using the established Phase 2E.2D compatibility init script and isolated build/cache paths. Gradle reused the existing dependency cache after an initial isolated-empty-cache attempt could not resolve the already-required Foojay resolver plugin offline. The successful final build log is:

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3B-20261120-2135\assemble-debug-final.log`

- APK: `...\isolated-build\_app\outputs\apk\debug\app-debug.apk`
- Manifest identity: application ID `com.sanad`, version code `1`, version name `0.1.0`.
- APK size: `186,281,467` bytes.
- APK SHA-256: `9BECE13537DB6D800BA96659D14CED23A70AEB8BF9F201FFAD1470B5B983931A`.
- Generated and embedded `assets/index.android.bundle`: `2,398,036` bytes, both SHA-256 `5A7F299E11F09CCB0963CD6FCFFAA423E1295165E00D6D0BBC2CFC8DA03086C1`.
- DEX inspection covered 16 DEX files and found exactly one `ReactPointerEventsView` definition, in `classes.dex`.
- Installed by update with `adb install -r`; no uninstall or app-data clearing was performed. The earlier APK, bundle, and evidence were retained under `...\evidence\pre-role-localization`.
- Device: `emulator-5554`, AVD `l3andalib_2`. No ADB reverse mapping or host listener on port 8081 was present during runtime checks. The final startup log is `evidence\final\startup-logcat.txt`; it contains `Running "sanad-rn"` and no fatal exception or RedBox.

## 9. Native evidence index and verdicts

Evidence is retained outside the repository at:

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3B-20261120-2135\evidence\final`

The header and populated/empty dashboard cases listed above were visually inspected before receiving PASS. The dashboard's upper and lower screenshots demonstrate that content is present beyond the initial viewport and can be scrolled. The role switcher is horizontally scrollable and bounded vertically; long role choices may require horizontal scrolling by design.

## 10. Final preservation verification and limitations

Branch, HEAD, HEAD/index tree, lockfile hash, and both compatibility-file hashes match preflight. There are no staged paths. `git diff --check` exits successfully. The final compact status has 244 entries, the same count as the 244-entry preflight; immediately before this report it had 243. Because the full initial path list is unavailable, matching counts do not prove that the final path set matches preflight. This is the remaining preservation limitation and the reason the overall phase is not marked ACCEPTED.

**RTL-01: CLOSED for the required FR/EN/AR native header cases shown above.**

**VIS-01: CLOSED for FR/EN/AR populated native dashboards and the FR empty-data case shown above.**

**Overall Phase 2E.3B: PARTIALLY ACCEPTED.** Focused defects meet their visual and test criteria, but the unreconciled preservation status count prevents certifying every preservation criterion. No claim is made for complete RTL/accessibility/workflow validation or release/production readiness.
