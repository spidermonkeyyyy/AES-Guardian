# SANAD CAPA Phase 5.1 — Native Quality-Staff CAPA Execution Report

## 1. Final disposition

**Blocked — native CAPA lifecycle not executed.**

The current debug APK was built and installed in place, but the APK packaged the stale, pre-existing, untracked debug JavaScript bundle at `android/app/src/debug/assets/index.android.bundle`. That bundle renders the old Respiracare-style welcome and legacy UI, despite the committed source and tracked main bundle being newer. The app was not a valid runtime representation of the latest source changes, so no CAPA was created, acknowledged, or updated.

The quality-staff role was selected through the app’s supported synthetic role selector and matched the persisted synthetic database user. The CAPA creation form was opened, but no values were entered and no submit action was performed. No authorization bypass, direct database write, app uninstall, or data clear was used.

## 2. Initial repository and preservation baseline

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `9bca10b531ba3ca3c22705a03bfbdc32e5d41691`
- Upstream: `origin/migration/aes-guardian`; initially even with upstream.
- Index: clean; no staged changes.
- Initial worktree included 24 tracked changes (17 modified, 7 deleted) and existing untracked work under `.agents/`, `.claude/`, `android/app/src/debug/`, `android/compat-pointer-events/build/`, `docs/`, and `skills-lock.json`.
- The existing deletion `src/assets/images/logo/sanad_icon.jpeg` was present before this phase and was preserved.
- The Phase 5, Phase 3, Phase 3.1, Phase 4, and Phase 4.1 reports were inspected. Phase 5 explicitly left native quality-staff CAPA execution unverified.
- No Git index or refs were changed. No reset, clean, stash, checkout, branch switch, or commit was performed.

## 3. Emulator and installed application

- AVD: `l3andalib_2`
- Emulator model: `sdk_gphone16k_x86_64`
- Android: 16 / API 36
- Package: `com.sanad`
- Installed app version: `0.1.0`, version code `1`
- Installation was updated in place with `adb install -r -t`; the original first-install time remained `2026-11-12 23:35:57`. The app was not uninstalled, and app data was not cleared.
- Debug build command:

  ```powershell
  Push-Location android
  .\gradlew.bat assembleDebug --console=plain
  Pop-Location
  ```

  Result: `BUILD SUCCESSFUL`; 357 actionable tasks, 56 executed and 301 up-to-date. APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
- In-place install command:

  ```text
  adb -s emulator-5554 install -r -t android/app/build/outputs/apk/debug/app-debug.apk
  ```

  Result: `Success`.

The emulator was initially stopped and was started for inspection. After the run it was no longer connected; no destructive emulator operation was performed.

## 4. Stale debug bundle — blocking cause

The source-set mismatch was confirmed:

- The committed source and tracked `android/app/src/main/assets/index.android.bundle` do not contain the observed legacy welcome text.
- The pre-existing untracked `android/app/src/debug/assets/index.android.bundle` contains the legacy “Nurse-led respiratory monitoring” string.
- The built APK’s `assets/index.android.bundle` also contains that string, establishing that the debug APK packaged stale JavaScript instead of the current application source bundle.
- The untracked debug bundle was already present at baseline and was intentionally not overwritten or deleted. The APK bundle mismatch was not checked before the install; that was an execution mistake.

Thus, building and installing the debug APK did not prove that the Hugeicons, typography, or app-entry changes in the current source were running. No welcome, localization, font, or icon source was changed in this phase.

## 5. Legitimate synthetic quality-staff session

The updated package was launched normally, and the existing synthetic demo workflow was used:

1. Opened “Démo AES Guardian” from the welcome screen.
2. Used the role carousel to select “Personnel qualité.”
3. Verified the workspace displayed “Responsable Qualité (Démo)” and `ID #4`, with the permitted CAPA Overview, Register, and Create modules.
4. The read-only native database snapshot identified persisted user ID `4` as `qualite.demo`, display name `Responsable Qualité (Démo)`, role `quality_staff`.
5. Source inspection confirmed `SYNTHETIC_QUALITY_STAFF_CONTEXT.userId === 4` and that the CAPA database APIs independently read the persisted user role and require `quality_staff`.

This was the supported synthetic demo account, not real authentication. The app displayed identity and persisted identity were consistent. However, because creation was not submitted, a successful Stage A/Stage B database authorization call was not demonstrated natively.

## 6. Native CAPA baseline and creation result

The database was copied read-only with its WAL and SHM files while the app was open. Queries ran only against the copied snapshot using `sqlite3 -readonly`; no SQL was executed against the live database.

Before creating anything, the copied native DB reported:

| Record type | Count |
|---|---:|
| `prevention_actions` | 5 |
| `capa_creation_operations` | 0 |
| `audit_events` | 39 |
| `in_app_notifications` | 4 |

SQLite `PRAGMA integrity_check` returned `ok`. The five original CAPAs were:

| ID | Reference | Status | Creator |
|---:|---|---|---:|
| 1 | `CAPA-2026-00001` | `in_progress` | 4 |
| 2 | `CAPA-2026-00002` | `in_progress` | 4 |
| 3 | `CAPA-2026-00003` | `completed` | 4 |
| 4 | `CAPA-2026-00004` | `completed` | 4 |
| 5 | `CAPA-2026-00005` | `cancelled` | 4 |

The existing CAPA-related audit evidence included one `capa_created` event for `prevention_action` ID 1. No operation rows existed at baseline.

The Create screen was opened in the updated installation, but no fields were filled and no submit action was triggered. Consequently:

- Stage A reservation: **Not verified**
- Stage B consumption, same operation ID/payload, and resulting CAPA: **Not verified**
- New CAPA, operation, audit, or notification: **None intentionally created**
- A post-form native DB snapshot was not captured; no claim is made about a final count beyond the read-only pre-create snapshot.
- Original CAPA records were identical in the pre-install and pre-create snapshots. Since no submission occurred, no intentional CAPA mutation was made.

## 7. Acknowledgement, status, authorization, and recovery

| Scenario | Result |
|---|---|
| Native acknowledgement and persistence | Not verified; no operation was created |
| Native permitted status transition, audit, notification, and cross-screen refresh | Not verified |
| Invalid status transition rejection | Not verified natively |
| Exposed-professional management rejection at UI and database layers | Not exercised in this phase |
| Rejected authorization attempt leaves records unchanged | Not verified natively |
| Native Stage B rollback and exact-ID retry | Not verified |
| Pending and committed-unacknowledged recovery | Not verified |
| Exact-ID reconciliation/no-duplicate recovery | Not verified |
| Native failure injection | Not exercised; no safe native mechanism was established |
| Post-create actual process termination/relaunch | Not verified; no CAPA was created |

Node tests and previous Phase 3/4 reports remain source-level evidence only, not native execution evidence for this phase.

## 8. Process persistence

The package update preserved the app data directory and existing database files. The app was launched as PID `4250` after installation. No controlled process-death/relaunch test was performed after a CAPA lifecycle because no new CAPA was created. Therefore this phase does not establish process-death persistence for a newly created or acknowledged CAPA.

## 9. Evidence and commands

Relevant commands used:

```text
emulator -avd l3andalib_2
adb devices -l
adb -s emulator-5554 shell getprop ro.product.model
adb -s emulator-5554 shell getprop ro.build.version.release
adb -s emulator-5554 shell getprop ro.build.version.sdk
adb -s emulator-5554 shell pm path com.sanad
adb -s emulator-5554 shell dumpsys package com.sanad
adb -s emulator-5554 install -r -t android/app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 shell monkey -p com.sanad -c android.intent.category.LAUNCHER 1
adb -s emulator-5554 shell pidof com.sanad
adb -s emulator-5554 pull /data/user/0/com.sanad/databases/aes_guardian.db <session-copy>
adb -s emulator-5554 pull /data/user/0/com.sanad/databases/aes_guardian.db-wal <session-copy>
adb -s emulator-5554 pull /data/user/0/com.sanad/databases/aes_guardian.db-shm <session-copy>
sqlite3 -readonly <session-copy>\aes_guardian.db "<read-only SELECTs and PRAGMA integrity_check>"
jar tf android/app/build/outputs/apk/debug/app-debug.apk
rg -a -o "Nurse-led respiratory monitoring" <bundle-file>
```

Screenshots and hierarchy/log snapshots were kept in the session workspace, not added to the repository:

- `C:\Users\User\.copilot\session-state\9e1db83f-9dc4-4560-a37c-eb752c51fe30\files\phase5_1_native\updated_app_entry.png`
- `...\updated_demo_workspace.png`
- `...\updated_quality_workspace.png`
- `...\updated_create_form.png`
- `...\before_create\aes_guardian.db` and its matching `-wal`/`-shm` copied files
- `...\apk_bundle\assets\index.android.bundle`

The screenshots show the old welcome and workspace UI from the stale debug bundle; they are evidence of the blocker, not evidence that the latest source UI passed acceptance.

## 10. Changed files and repository preservation

- No application source, tests, configuration, icon, font, or database file was modified by this phase.
- This report is the only intentional new file.
- The APK and build outputs were generated by the authorized Android build. Existing tracked Gradle/build artifacts changed during the build; the pre-existing untracked build/cache trees were preserved and not cleaned.
- The stale untracked debug bundle was not modified.
- The pre-existing uncommitted `src/assets/images/logo/sanad_icon.jpeg` deletion remained untouched.
- No files were staged or committed. The index remained clean.

Final branch/HEAD remained `migration/aes-guardian` / `9bca10b531ba3ca3c22705a03bfbdc32e5d41691`. Existing source and user work was not reverted. The generated APK install changed the installed app in place as authorized; its package and data were preserved.

## 11. Updated Phase 5 disposition and remaining gaps

Phase 5 remains **Blocked** for its original missing native CAPA lifecycle criteria. Phase 5.1 is **Blocked** because the debug build incorporated the stale untracked debug bundle, leaving the app UI inconsistent with the current source. No native CAPA lifecycle evidence was generated.

The separate welcome regression also remains unresolved. The current source was not modified here, in accordance with the Phase 5.1 scope restriction. Do not claim Phase 5 completion or final user-acceptance readiness.

Before a future native CAPA attempt, the debug bundle/source-set selection must be resolved without discarding the pre-existing bundle, then the rebuilt APK must be inspected to confirm that its embedded bundle matches the intended current source before installation and UI testing.
