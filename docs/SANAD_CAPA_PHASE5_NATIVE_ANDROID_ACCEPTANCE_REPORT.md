# SANAD CAPA Phase 5 - Native Android Runtime and Persistence Acceptance

## 1. Final disposition

**Blocked.**

A debug APK built successfully, the original `l3andalib_2` Android emulator profile was used, the app launched on Android 16/API 36, and native `@op-engineering/op-sqlite` persistence was confirmed. Native process-death/relaunch and offline relaunch behavior passed for existing synthetic/demonstration database state.

Native CAPA creation, Stage A/Stage B, failure/retry, recovery, acknowledgement, status mutation, and quality-staff role execution were not verified on the actual Android runtime. The native app remained on an exposed-professional demo role in the inspected flow, and no native fault-injection or quality-staff UI route was completed. The visible welcome/auth gate also regressed to the Respiracare-style screen instead of the agreed SANAD “Déclarer. Suivre. Prévenir.” welcome. Those outcomes do not establish completion of the full acceptance criteria.

## 2. Initial repository and Git baseline

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `e1f83ebd14d20e9407eab9d85ad42923a8f1df1b`
- Remote tracking branch: `origin/migration/aes-guardian`, with HEAD 1 commit ahead.
- Initial index state: no staged changes.
- Initial worktree: the `e1f83eb` local commit was followed by tracked Android Gradle/build modifications/deletions, plus `.agents/`, `.claude/`, `android/app/src/debug/`, `android/compat-pointer-events/build/`, and `skills-lock.json` untracked entries.
- No staging, commit, reset, clean, stash, checkout, branch/ref, or destructive Git operation was performed during Phase 5.

The phase 3, 3.1, 4, and 4.1 reports were inspected before execution.

## 3. Android environment and build

- Emulator used: original `l3andalib_2` AVD
- AVD configuration: Android 16/API 36, x86_64 16 KiB profile, Google APIs
- Emulator model: `sdk_gphone16k_x86_64`
- Android release: 16
- Android SDK: 36
- App package: `com.sanad`
- App version: `0.1.0`, version code `1`
- Existing install preserved with `adb install -r`; package was not uninstalled and app data was not cleared.
- First installation: 2026-11-12; package last updated before Phase 5 at 2026-11-23 20:52:50.
- Java: OpenJDK 17.0.3
- ADB: 1.0.41 / 37.0.3
- Installed SDK platforms: 34, 35, 36, 37.0
- Build tools: 34.0.0, 35.0.0, 36.0.0
- Gradle wrapper: 8.11.1
- Android Gradle plugin: 8.6.0
- Build variant: `debug`
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- APK size: 184001437 bytes

Exact build command:

```text
cd C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\android
.\gradlew.bat assembleDebug --console=plain
```

Build result: `BUILD SUCCESSFUL`, 386 actionable tasks, 35 executed and 351 up-to-date.

## 4. Runtime adapter and database identification

- Production database facade: `src/core/database/index.ts`
- App startup path: `App.tsx` calls `initializeDatabase()` and then logs `APP_STARTED`.
- Database service: `src/core/database/DatabaseService.ts`
- Native package: `@op-engineering/op-sqlite` 11.4.9
- Database name: `aes_guardian.db`
- Native package data location: `/data/user/0/com.sanad/databases/aes_guardian.db`
- WAL files present: `aes_guardian.db-wal` and `aes_guardian.db-shm`
- The service enables WAL and executes `PRAGMA foreign_keys = ON`.
- Node-only or mocked adapters were not used for the native runtime evidence.
- Native copied database checks reported SQLite `3.53.1` and `PRAGMA foreign_keys = 1`.
- Journal mode: WAL.

## 5. Migration and native integrity results

The existing database on `l3andalib_2` was copied read-only and checkpointed only in the session workspace. Native schema versions 1 through 10 were present.

Migration 9 is the durable CAPA operation migration. Migration 10 adds acknowledged operation state.

Required native tables were present:

- `prevention_actions`
- `capa_creation_operations`
- `audit_events`
- `in_app_notifications`
- `demo_users`
- `schema_versions`
- all prior declarations, reviews, corrections, and occupational-health tables

Relevant indexes, including one pending operation per creator, reference, status, and unacknowledged operation indexes, were present.

Baseline/post-update/post-restart native counts:

| Checkpoint | Prevention actions | CAPA operations | Audit events |
|---|---:|---:|---:|
| Existing database before APK update | 5 | 0 | 34 |
| After in-place APK update/relaunch | 5 | 0 | 34 |
| After actual process stop/relaunch | 5 | 0 | 36 |

The 5 existing synthetic CAPA rows and their IDs/references/statuses were unchanged. The audit increase came from normal `APP_STARTED` events. No foreign-key or integrity defect was observed in the read-only native database checkpoints.

Migration idempotency, failed transaction rollback, and foreign-key enforcement in an externally controlled native fault path were not separately executed on Android.

## 6. Native CAPA lifecycle A-E and G

### A - Creation

**Not verified natively.** The existing native database contained 5 prior CAPA records but no operation reservations. The actual Android quality-staff creation UI was not exercised.

### B - Failure and retry

**Not verified natively.** Native fault injection was unavailable; no Stage B partial-write injection or native retry was executed.

### C - Recovery

**Not verified natively.** No pending or committed/unacknowledged native operation existed in the inspected database.

### D - Acknowledgement

**Not verified natively.** No operation records were available to acknowledge.

### E - Status lifecycle

**Not verified natively through UI mutation.** Existing records showed in-progress, completed, and cancelled states, but no native transition, audit, or notification update was performed during Phase 5.

### G - Authorization/integrity

**Partially verified.** The native demo workspace rendered under `Professionnel exposé` and explicitly blocked cross-role CAPA management. This confirms the UI role presentation but does not verify the native quality-staff create/recovery/acknowledge/update boundary. Database role logic remains source/test evidence only.

## 7. Actual process-death/restart

Actual controlled procedure:

```text
adb shell pidof com.sanad
adb shell am force-stop com.sanad
adb shell pidof com.sanad
adb shell monkey -p com.sanad -c android.intent.category.LAUNCHER 1
```

Observed values:

- Before stop: PID `4025`
- After `am force-stop`: `pidof` empty
- After normal relaunch: PID `4323`
- Resumed activity: `com.sanad/.MainActivity`
- Native database reopened at the same package data directory.
- Before relaunch: 5 CAPAs, 34 audit events
- After relaunch: 5 CAPAs, 36 audit events
- CAPA IDs `1` through `5`, references `CAPA-2026-00001` through `CAPA-2026-00005`, and statuses `in_progress`, `in_progress`, `completed`, `completed`, `cancelled` were unchanged.

**Result: Passed** for process-death persistence of existing committed synthetic records.

## 8. Native offline behavior

Procedure:

```text
adb shell svc wifi disable
adb shell svc data disable
adb shell am force-stop com.sanad
adb shell monkey -p com.sanad -c android.intent.category.LAUNCHER 1
```

Observed:

- Network stats reported `not connected`.
- The app relaunched normally as PID `4485`.
- `com.sanad/.MainActivity` was resumed.
- The welcome and workspace UI rendered while Wi-Fi and data were disabled.
- Existing UI navigation to the AES demo workspace succeeded offline.
- Wi-Fi and data were restored after the test.

**Result: Passed** for app launch, UI rendering, and previously persisted state with network denied. Full server-dependent functionality was not tested.

## 9. Native cryptographic and concurrency checks

- Production source uses `globalThis.crypto.randomUUID()` first, then `crypto.getRandomValues()` with UUID-v4 version/variant bits.
- It fails closed if neither secure API is available or a malformed/all-zero result is produced.
- No deterministic test generator or mock was observed in the production native code path.
- Native repeated generation, UUID uniqueness statistics, and native concurrent creation were not executed.
- Native SQLite constraint/concurrency behavior was not fault-injected.

## 10. Exact commands and evidence

Principal commands:

```text
emulator -avd l3andalib_2 -no-snapshot-save
adb devices -l
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk
adb shell pm list packages com.sanad
android\gradlew.bat assembleDebug --console=plain
adb install -r -t android/app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
adb shell monkey -p com.sanad -c android.intent.category.LAUNCHER 1
adb root
adb pull /data/data/com.sanad/databases/aes_guardian.db <session-copy>
adb pull /data/data/com.sanad/databases/aes_guardian.db-wal <session-copy>
adb pull /data/data/com.sanad/databases/aes_guardian.db-shm <session-copy>
adb shell am force-stop com.sanad
adb shell pidof com.sanad
adb shell svc wifi disable
adb shell svc data disable
```

Useful screenshots saved in the session workspace:

- `phase5-original.png`
- `phase5-after-restart.png`
- `phase5-offline.png`
- `phase5-navigation.png`
- `phase5-workspace.png`
- `phase5-workspace-scroll.png`

## 11. Welcome and emulator findings

The original emulator was restored as the active target. A temporary dedicated AVD was started and stopped; it was not used for the final native acceptance evidence.

The screenshot from `l3andalib_2` reproduced a separate UI defect: the entry/auth gate showed the legacy respiratory copy and “Nurse-led respiratory monitoring” instead of the agreed SANAD welcome. Source traces show legacy `authGate.subtitle` values in `src/localization/index.ts`, while `entry-experience.test.tsx` still expects `Déclarer. Suivre. Prévenir.` and `AuthGateScreen.tsx` does not match that tested welcome implementation.

This was not corrected because the change is outside the authorized native CAPA scope and Phase 5 is acceptance-only.

## 12. Changed files and preservation

Phase 5 changed no repository source or test file.

The Android debug build updated existing tracked build artifacts and Gradle caches. It also left generated app/debug and compat build directories visible in the worktree. These are build-side effects, not deliberate source changes.

The only new repository file intended by this phase is:

- `docs/SANAD_CAPA_PHASE5_NATIVE_ANDROID_ACCEPTANCE_REPORT.md`

Session-only database copies and screenshots were saved outside the repository.

No pre-existing repository file was overwritten or reverted. The app’s existing native database was preserved through `install -r`, process stop/restart, and network-denied relaunch.

## 13. Remaining limitations and unresolved defects

- Native quality-staff CAPA creation and Stage A/B execution were not completed.
- Native B rollback/fault injection, pending recovery, uncertain commit recovery, and committed acknowledgement recovery were not executed.
- Native status transitions, Overview/Register/Detail consistency, and unauthorized database calls were not executed during this Android runtime acceptance.
- Native concurrency and repeated operation-ID generation were not exercised.
- The welcome/auth-gate regression is unresolved.
- The final UI/crypto/concurrency evidence gap prevents Complete disposition.
- The existing `l3andalib_2` emulator is intentionally preserved. The extra `phase2e11-sanad-api361` and `sanad-phase5-capa-isolated-20261124` AVD profiles were deleted after the acceptance run.

## 14. Final Git state and before/after comparison

- Branch: `migration/aes-guardian`
- HEAD: `e1f83ebd14d20e9407eab9d85ad42923a8f1df1b`
- Branch remains ahead of `origin/migration/aes-guardian` by 1 commit.
- Initial and final index states remain clean.
- Pre-existing Android Gradle/build modifications and untracked workspace entries remain present.
- No pre-existing source/test change disappeared.
- The report is untracked, as required by the no-stage/no-commit authorization.

Before/after native persistence comparison was successful for 5 existing CAPA records and all 3 expected persisted identification fields checked.

## 15. Recommendation

Do not mark Phase 5 Complete or authorize production/distribution. The next gate should be a quality-staff-native execution gate on `l3andalib_2`, using a dedicated synthetic account/database state and explicit native fault injection if supported. The welcome regression should be corrected and verified in a separate UI gate before final user-acceptance claims.
