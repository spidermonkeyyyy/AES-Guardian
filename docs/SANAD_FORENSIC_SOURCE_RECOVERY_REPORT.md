# SANAD Forensic Source Recovery Report

**Investigation snapshot:** 2026-11-23 local evidence (timestamps are labeled with their source timezone where available)  
**Scope:** Strictly read-only reconciliation of the Phase 2E.10 APK, source snapshots, Git history/worktrees, reports, and workflow preservation.  
**Report location:** `C:\Users\User\.copilot\session-state\a5296a0a-6b0a-4ce3-a007-4f338ec20fed\files\SANAD_FORENSIC_SOURCE_RECOVERY_REPORT.md` — outside all project repositories/worktrees.

## Evidence labels

- **VERIFIED** — directly inspected, counted, or cryptographically compared in this investigation.
- **REPORTED** — asserted in an existing project report or saved build evidence, not independently re-performed here.
- **INFERRED** — reasoned from the verified/reported evidence, not directly proved.
- **NOT FOUND** — searched within the inspected local scope and not located.
- **BLOCKED** — could not establish due to missing or inaccessible evidence.

## 1. Executive summary

- **VERIFIED:** The APK at `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\isolated-build\_app\outputs\apk\debug\app-debug.apk` is 183,769,733 bytes and has SHA-256 `A7C8DCB6428F565F16983D5B340D9E79D77CEF4214C8D5FA1D031A158F02C829`. Its hash exactly matches the Phase 2E.11 report and the `com.sanad` base APK currently installed on AVD `l3andalib_2` (ADB serial `emulator-5554`).
- **REPORTED + VERIFIED:** Phase 2E.10/2E.11 reports identify the build's Git base as Desktop `c81a50c98e4e7330fad479a51a48a2fea7f912a1`, but also record a 345-path dirty working tree. The E10 build's source map resolves to the Desktop project and embeds source text for 111 project modules. The exact full working-tree snapshot used by Gradle is **not** identified as a complete Git tree or a surviving directory.
- **VERIFIED:** E10 source-map content and current files are exact byte matches for several important untracked files: `AccessScreen.tsx`, `fontFamilies.ts`, and `SanadUiKittenProvider.tsx`. All eight IBM Plex Sans/Arabic font files and Readex Pro in the current Desktop tree match the corresponding E10 APK font bytes exactly. Conversely, source-map contents for the E10 `App.tsx`, `AppNavigator.tsx`, `AuthGateScreen.tsx`, `WelcomeCarouselScreen.tsx`, `AppIcon.tsx`, `AppText.tsx`, `AppTextInput.tsx`, and `AesGuardianDatabase.ts` differ from the current Desktop files.
- **VERIFIED:** The current Desktop repository is at `fbbc94136652bd4f8efe1b8d1fa85e14932692ca`, a direct child of c81. The UI redesign commit `c0ab7019fb160e3557975601d819fd305b315889` is a *sibling* of fbbc, also a direct child of c81. No reset/rebase sequence is evidenced by the branch reflog; it records the c81 clone followed by the fbbc commit. There are 61 local Copilot checkpoint refs, no stashes, and the checked `git fsck --full --no-reflogs --unreachable` found zero unreachable objects.
- **VERIFIED:** The Desktop status is not the previously reported 156-entry collapsed view when expanded. `git status --porcelain=v2 --untracked-files=all` yields 274 paths: 17 modified tracked generated Android/Gradle files, 6 deleted tracked generated Android/Gradle files, and 251 untracked files; zero staged, renamed, or conflicted paths. There are no modified tracked application source files in that status, but many untracked source, asset, test, report, and build-compatibility files.
- **VERIFIED:** Most AES workflows remain in the current source as UI/database paths (declarations, review, OH coordination/follow-up, surveillance, notifications, audit, role restrictions, synthetic demo data, and local SQLite). The CAPA creation screen, however, cannot complete its current submit path: it calls `db.createCapaCreationOperationId()` at `PreventionActionCreateScreen.tsx:245`, a method not defined on the `AesGuardianDatabase` instance returned by `getDatabase()`. The call is caught and the UI shows an error before creating an action. Separately, the current source does **not** implement the durable CAPA operation persistence claimed by the fbbc commit title: schema version is 8, migrations stop at 8, and the operation methods are stubs. Untracked tests expect migrations 9/10 and a `capa_creation_operations` table. No tracked commit containing that migration was found in the searched refs. This is a genuine functional gap in the current snapshot, not merely a visual difference.
- **Conclusion:** The verified APK's exact *complete source snapshot* is not identified. Evidence supports recovery of source fragments from the c81 baseline, the c0ab/fbbc branches, dirty worktrees/untracked files, checkpoint refs, and E10's source map. The original full E10 project state has not been recovered or reconstructed.

## 2. Scope and preservation statement

**VERIFIED:** Investigation actions were read-only: Git metadata/status/history queries, local file reads and hashes, APK metadata/signature/hash inspection, and read-only ADB package/device queries. No project file was edited, copied, created, removed, renamed, or overwritten; no Git index/ref/reflog/worktree operation was performed; no build/test was run; and no install/uninstall/input action was performed on the emulator. The only authorized write is this report, outside the repositories. No APK decompilation or automatic source reconstruction was performed.

Commands/evidence classes used included `git worktree list --porcelain`, `git status --porcelain=v2 --untracked-files=all`, `git show`, `git rev-parse`, `git reflog show`, `git log --all`, `git fsck --full --no-reflogs --unreachable`, `adb devices -l`, `adb shell pm path`, `adb shell dumpsys package`, Android `aapt dump badging`, `apksigner verify --print-certs`, and direct SHA-256 calculations. Git status inspection used `GIT_OPTIONAL_LOCKS=0`.

## 3. Repository and worktree inventory

### AES-Guardian shared Git repository

**VERIFIED:** Every AES and `sanad-rn` path listed below was registered by `git worktree list` and resolved successfully with `git rev-parse`, so each is a valid Git working tree. `respiracare-backup` is also a valid independent Git root; `respiracare-rn` is not. All nine AES rows below use common Git directory `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git`. The `.git/worktrees\...` Git directories are linked worktrees sharing the same object store; they are not independent repository copies. Status counts are expanded file counts; all listed rows have 0 staged, renamed, or conflicted entries.

| Path | Branch / HEAD | Exact HEAD / subject | Status M/D/U | Clean? | Git directory relationship |
|---|---|---|---:|---|---|
| `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2` | `migration/aes-guardian` | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` — `feat(aes-guardian): complete theme migration, RTL/multilingual localization, and durable CAPA workflow` | 17/6/251 | No | Common Git dir/root |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\copilot-prewarm-crispy-dollop` | detached | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` — same fbbc subject | 0/2/0 | No | Linked worktree; shared objects |
| `...\marammejri-ship-it-fantastic-spoon` | `marammejri-ship-it-implement-requested-changes` | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` — `feat(aes-guardian): land phase 2D-2E workflows, UI, and verification` | 0/2/14 | No | Linked worktree; shared objects |
| `...\marammejri-ship-it-fantastic-system` | `marammejri-ship-it-fantastic-system` | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` — same c81 subject | 2/2/0 | No | Linked worktree; shared objects |
| `...\marammejri-ship-it-literate-bassoon` | `marammejri-ship-it-offline-debug-apk` | `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` — fbbc subject | 5/2/8 | No | Linked worktree; shared objects |
| `...\marammejri-ship-it-miniature-waffle` | `marammejri-ship-it-pushed-changes-review` | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` — c81 subject | 0/2/0 | No | Linked worktree; shared objects |
| `...\marammejri-ship-it-musical-spork` | `marammejri-ship-it-musical-spork` | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` — c81 subject | 2/2/0 | No | Linked worktree; shared objects |
| `...\marammejri-ship-it-vigilant-doodle` | `marammejri-ship-it-build-install-debug-apk` | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` — c81 subject | 27/2/0 | No | Linked worktree; shared objects |
| `...\selsabilellabou-tech-legendary-goggles` | `selsabilellabou-tech-add-gluestack-ui-v5-skill` | `c0ab7019fb160e3557975601d819fd305b315889` — `Complete SANAD UI redesign and lint setup` | 0/0/0 | Yes | Linked worktree; shared objects |

Ellipses in the path column above are under the common prefix `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\`. Exact paths for those worktrees are in the Git worktree registrations and can be preserved by a later authorized inventory export.

**VERIFIED:** Desktop HEAD commit date is 2026-11-23 16:05:17 +01:00; c81 is 2026-11-18 16:28:54 +01:00; c0ab is 2026-11-23 11:34:12 +01:00. c81 is the last commit date for c81 worktrees; c0ab and fbbc are the last commit dates for their respective rows. The last commit date on the fbbc row is 2026-11-23 16:05:17 +01:00.

### Independent `sanad-rn` Git repository and worktrees

**VERIFIED:** `C:\Users\User\Desktop\sure\sanad-rn` has its own common Git directory and object store, separate from AES-Guardian despite an AES-named remote-tracking ref. Its linked worktrees share objects only with this `sanad-rn` repo. `aes-guardian/migration/aes-guardian` in this repository points to the exact c81 commit object, but does not make this repository share storage with AES-Guardian. No c0ab/fbbc candidate was found in this repo's refs.

| Path | Branch / HEAD | Exact HEAD / subject | Status M/D/U | Clean? |
|---|---|---|---:|---|
| `C:\Users\User\Desktop\sure\sanad-rn` | `migration/sanad-orthopedic-trauma` | `5129fa8269a089049c8b85f24237941c71489065` — `Remove build artifacts from tracking` | 39/99/386 | No |
| `C:\c\Users\User\Desktop\sure\sanad-rn-migration` | `migration/aes-guardian` | `3b5757639dcb4fd3404641a9548f3b5b5ef1e34e` — AES workflow subject; parent `d79b01ef...` | 7/0/2 | No |
| `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\marammejri-ship-it-musical-waddle` | detached | `0d294462ab5f1f25c59a74176d37a5b0cc6d02fe` — `Remove audit and test artifacts from version control` | 0/0/0 | Yes |
| `...\mohamedaminehlel98-svg-expert-journey` | `mohamedaminehlel98-svg-expert-journey` | `0d294462ab5f1f25c59a74176d37a5b0cc6d02fe` — same subject | 0/0/0 | Yes |
| `...\mohamedaminehlel98-svg-musical-disco` | `mohamedaminehlel98-svg-capa-final-acceptance-audit` | `d154a8694a9eedd3110a3e1c9db385ed6c4faae4` — `docs: add CAPA final acceptance audit` | 0/0/0 | Yes |
| `...\mohamedaminehlel98-svg-refactored-happiness` | `mohamedaminehlel98-svg-aes-guardian-repository-audit` | `0d294462ab5f1f25c59a74176d37a5b0cc6d02fe` — same subject | 0/0/2 | No |
| `...\selsabilellabou-tech-turbo-guide` | `selsabilellabou-tech-21st-dev-mcp-setup` | `0d294462ab5f1f25c59a74176d37a5b0cc6d02fe` — same subject | 1/0/0 | No |
| `...\spidermonkeyyyy-redesigned-garbanzo` | `spidermonkeyyyy-aes-guardian-alignment-audit` | `d79b01ef51646509170996f8c77517f95470f217` — `feat(aes-guardian): complete Phase 2C.7 workflow integration and demonstration readiness` | 0/2/0 | No |
| `...\spidermonkeyyyy-solid-fishstick` | `spidermonkeyyyy-resolve-pasted-task` | `0d294462ab5f1f25c59a74176d37a5b0cc6d02fe` — `Remove audit and test artifacts from version control` | 0/0/1 | No |
| `C:\Users\User\.local\share\kilo\worktree-pool\sanad-rn-1d99c77ef0d3\intermediate-kite` | detached | `0d294462ab5f1f25c59a74176d37a5b0cc6d02fe` — same subject | 0/0/0 | Yes |

Paths prefixed `...` share `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\`. All sanad-rn rows have zero staged, renamed, and conflicted paths. Their last commit dates are the commit dates shown by the selected hashes: root 2026-09-20; c81-derived migration worktree 2026-11-18; d154 2026-11-18; d79b 2026-11-13; 0d294 2026-09-20.

### Other nearby local copy

- **VERIFIED:** `C:\Users\User\Desktop\sure\respiracare-backup` is an independent Flutter Git repository, branch `master`, HEAD `336fe8d8cb074eda5708850a72708a4ab93f301e`, subject `docs: prep the 13.7 final human run — protocol matches current UI`, date 2026-08-22 15:38:14 +01:00; status M147/D8/U116 (271 paths), not clean, with 0 staged, renamed, or conflicted paths. `git worktree list` reports only this root. It is not the Phase 2E React Native source. Its `sanad_icon.png` is byte-identical to Desktop `src/assets/images/logo/sanad_icon.png`, SHA-256 `700852C879D7B403C3A91ACF91EA0D4490359016E47E53A6724648A43FF2F007`.
- **VERIFIED:** `C:\Users\User\Desktop\sure\respiracare-rn` exists but no valid Git root/project tree was found there; it appeared empty in the inspected scope.

### Exact absolute worktree paths, Git directories, common directories, and application coverage

The summary tables above shorten repeated prefixes only. This table supplies every exact path and Git directory. `Common directory` identifies the shared object store. AES rows contain the React Native AES-Guardian/SANAD app and Phase 2E source tree for their respective commits; none is an exact complete E10 tree. `sanad-rn` rows contain a separate older React Native app/history, not the E10 dirty source snapshot. `respiracare-backup` contains a Flutter app/logo asset, not the Phase 2E React Native app. `respiracare-rn` has no Git directory or project files in the inspected scope.

| Absolute worktree path | Exact Git directory | Common directory | App / Phase 2E coverage |
|---|---|---|---|
| `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; fbbc current |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\copilot-prewarm-crispy-dollop` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git\worktrees\copilot-prewarm-crispy-dollop` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; fbbc |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\marammejri-ship-it-fantastic-spoon` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git\worktrees\marammejri-ship-it-fantastic-spoon` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; c81 |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\marammejri-ship-it-fantastic-system` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git\worktrees\marammejri-ship-it-fantastic-system` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; c81 |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\marammejri-ship-it-literate-bassoon` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git\worktrees\marammejri-ship-it-literate-bassoon` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; fbbc |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\marammejri-ship-it-miniature-waffle` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git\worktrees\marammejri-ship-it-miniature-waffle` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; c81 |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\marammejri-ship-it-musical-spork` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git\worktrees\marammejri-ship-it-musical-spork` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; c81 |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\marammejri-ship-it-vigilant-doodle` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git\worktrees\marammejri-ship-it-vigilant-doodle` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; c81 |
| `C:\Users\User\.copilot\repos\copilot-worktrees\AES-Guardian-phase0.2\selsabilellabou-tech-legendary-goggles` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git\worktrees\selsabilellabou-tech-legendary-goggles` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\.git` | React Native app; c0ab redesign |
| `C:\Users\User\Desktop\sure\sanad-rn` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Separate React Native app/history; no E10 dirty tree |
| `C:\c\Users\User\Desktop\sure\sanad-rn-migration` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\sanad-rn-migration` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Separate React Native worktree; schema 8 at inspected version, not E10 |
| `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\marammejri-ship-it-musical-waddle` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\marammejri-ship-it-musical-waddle` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Older separate React Native worktree |
| `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\mohamedaminehlel98-svg-expert-journey` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\mohamedaminehlel98-svg-expert-journey` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Older separate React Native worktree |
| `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\mohamedaminehlel98-svg-musical-disco` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\mohamedaminehlel98-svg-musical-disco` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Older separate React Native worktree |
| `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\mohamedaminehlel98-svg-refactored-happiness` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\mohamedaminehlel98-svg-refactored-happiness` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Older separate React Native worktree |
| `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\selsabilellabou-tech-turbo-guide` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\selsabilellabou-tech-turbo-guide` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Older separate React Native worktree |
| `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\spidermonkeyyyy-redesigned-garbanzo` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\spidermonkeyyyy-redesigned-garbanzo` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Older AES Phase 2C.7 app/workflow snapshot |
| `C:\Users\User\.copilot\repos\copilot-worktrees\sanad-rn-migration\spidermonkeyyyy-solid-fishstick` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\spidermonkeyyyy-solid-fishstick` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Older separate React Native worktree |
| `C:\Users\User\.local\share\kilo\worktree-pool\sanad-rn-1d99c77ef0d3\intermediate-kite` | `C:\Users\User\Desktop\sure\sanad-rn\.git\worktrees\intermediate-kite` | `C:\Users\User\Desktop\sure\sanad-rn\.git` | Older separate React Native worktree |
| `C:\Users\User\Desktop\sure\respiracare-backup` | `C:\Users\User\Desktop\sure\respiracare-backup\.git` | `C:\Users\User\Desktop\sure\respiracare-backup\.git` | Flutter app; SANAD logo asset only relevant |
| `C:\Users\User\Desktop\sure\respiracare-rn` | None | None | No valid Git tree/app found in inspected scope |

## 4. Git history, refs, and ancestry

| Commit | Parent(s) | Author / date | Ref/worktree | Reachability and relevant changes |
|---|---|---|---|---|
| `c81a50c98e4e7330fad479a51a48a2fea7f912a1` | `a58472ce863ed301c63e78d041be8e8bdb07cfec` | `spidermonkeyyyy`, 2026-11-18 16:28:54 +01:00 | `marammejri-ship-it-*` worktrees; copied as remote-tracking ref in independent sanad-rn | **VERIFIED:** Branch/tag-reachable baseline, message `feat(aes-guardian): land phase 2D-2E workflows, UI, and verification`; contains the earlier AES workflows, not the dirty E10 tree by itself. |
| `c0ab7019fb160e3557975601d819fd305b315889` | c81 | `spidermonkeyyyy`, 2026-11-23 11:34:12 +01:00 | Local branch `selsabilellabou-tech-add-gluestack-ui-v5-skill`, clean linked worktree | **VERIFIED:** Local branch-reachable UI redesign commit, message `Complete SANAD UI redesign and lint setup`. Direct sibling of fbbc. Not exact E10 source: no IBM/Readex `fontFamilies.ts`/font assets in its tree, and its tracked `AppIcon.tsx` is a 463-byte stub variant. |
| `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` | c81 | `spidermonkeyyyy`, 2026-11-23 16:05:17 +01:00 | Desktop `migration/aes-guardian`, `origin/migration/aes-guardian`, and linked fbbc worktrees | **VERIFIED:** Current branch tip and direct c81 child; message claims theme/RTL/multilingual and “durable CAPA workflow.” Changed the DB and CAPA-create screen, but the committed DB contains CAPA-operation stubs rather than durable persistence (see §9). |
| `bcdfd8819a05f79f87a6ebe238c02b26013cc160` | c81 | `Copilot`, 2026-11-22 21:49:41 +01:00 | `refs/copilot/checkpoints/...` | **VERIFIED:** Copilot checkpoint ref, not a branch/tag. Snapshots an AppIcon/AppText/AppTextInput variant and related theme files; it predates the c0ab/fbbc branches and is not an exact match for E10 source-map hashes checked here. |
| `9ead72a25e5d7a7465025a5e2a3800915481f596` | c81 | `Copilot`, 2026-11-22 21:50:55 +01:00 | `refs/copilot/checkpoints/...` | **VERIFIED:** Another checkpoint, not a branch/tag. Contains shared-component and theme snapshots, but not the E10 IBM/Readex assets or complete E10 tree. |
| `f4b39f33d7ea09956de7b7e947d647954d818531` | fbbc | `Copilot`, 2026-11-23 19:17:45 +01:00 | `refs/copilot/checkpoints/...` | **VERIFIED:** Checkpoint snapshots later source variants, including a short `capa-operation-utils.ts`, `fontFamilies.ts`, and `AccessScreen.tsx`; those versions are not the current E10 full variants or complete project snapshot. |

**VERIFIED:** c81 is an ancestor of both c0ab and fbbc; c0ab and fbbc are siblings, not ancestor/descendant. The local branch reflog records the original clone at c81 (2026-11-18 18:52:50 +01:00) and then a commit moving `migration/aes-guardian` to fbbc (2026-11-23 16:05:17 +01:00). The current remote-tracking branch and `origin/HEAD` also point to fbbc. This establishes that the current branch advanced through a new commit from c81; it does not show that the E10 dirty source was committed.

**VERIFIED:** 61 `refs/copilot/checkpoints` are registered. They are local recovery refs and are not ordinary branches/tags. There are no stashes. `git fsck --full --no-reflogs --unreachable` reported zero unreachable objects in the AES common object store. No tag list entries were found. No ref/reflog evidence of a reset, rebase, or destructive cleanup explaining E10 disappearance was found in the inspected logs.

**NOT FOUND:** Commit `c0ab7019fb160e3557975601d819fd305b315889` was not found in the separate `sanad-rn` object store. c81 exists there through `refs/remotes/aes-guardian/migration/aes-guardian`, but c0ab/fbbc do not.

## 5. APK identity and verification

### Installed E10 binary

| Property | Result |
|---|---|
| Preserved APK | `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\isolated-build\_app\outputs\apk\debug\app-debug.apk` |
| Size / SHA-256 | 183,769,733 bytes / `A7C8DCB6428F565F16983D5B340D9E79D77CEF4214C8D5FA1D031A158F02C829` |
| Package / label | `com.sanad` / Sanad |
| Version | `0.1.0`, version code `1` |
| Build | Debug, Android compile SDK 35, min SDK 24, target SDK 35 |
| ABIs | `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` |
| Signing certificate | Android Debug; SHA-256 `129273adc2ac2a82e9e7ac06ad4aca7cb2893a6981ccd5b5b3afe44f67857da5` |
| APK filesystem timestamp | 2026-11-22 15:17:00 UTC; this is a file timestamp, not proof of build start time |

**VERIFIED:** `adb devices -l` showed `emulator-5554`; `adb emu avd name` and `ro.boot.qemu.avd_name` returned `l3andalib_2`. Device reports Android 16/API 36 and x86_64. `pm path com.sanad` returned `/data/app/~~l1lELXiqDe2HNmzMZ_CoGA==/com.sanad-kRFW8QijXDNdevfLf8kblg==/base.apk`; package metadata reports version code 1, version name 0.1.0, primary ABI x86_64, first install 2026-11-12 23:35:57 and last update 2026-11-23 20:52:50. A read-only in-memory hash of the installed base APK equals the preserved E10 APK hash exactly. No APK was pulled to disk and the install was not changed.

**VERIFIED:** The E10 report and E11 report both give the exact SHA-256 above. The E11 native walk-through used the separate `phase2e11-sanad-api361` AVD according to that report, not `l3andalib_2`; its reported observations are evidence about the same binary but are not direct screenshots/acceptance performed on the target AVD during this investigation.

### E10 embedded bundle and fonts

- Bundle size: 2,357,228 bytes; SHA-256 `8B5631144A1FA9B7A2F54B8928909602910F06C6E587A68383434931127A2A21` (**VERIFIED** in APK/build evidence and **REPORTED** by E11).
- The nine E10 font files below are embedded in the E10 APK and each APK-entry SHA-256 matches the current Desktop file exactly (**VERIFIED**). The current Desktop font files are untracked, so they are not preserved by fbbc's committed tree.

| Font | SHA-256 |
|---|---|
| `IBMPlexSans-Bold.ttf` | `22F59D358E8B9B9FB38AC6EE26A7EA7263FFA1C89A9056C101ACFF5ADD91F5D6` |
| `IBMPlexSans-Medium.ttf` | `A494D5A69FA094F7071A9FFBC98E86C85337D1A29F3FC1FF7C2E1C46161DDF27` |
| `IBMPlexSans-Regular.ttf` | `B47EBD72B5CE53B60F909033FF84D6FC12358CC147E2981F8C321AD3F36246B6` |
| `IBMPlexSans-SemiBold.ttf` | `C51119B25F4A296DA2B66EDF3201B9AA1735091ED7EFC1FCA0313346F3851A4D` |
| `IBMPlexSansArabic-Bold.ttf` | `B74F809DEAD12442ED56E02A12C3BCC02076C9AD4E32F17D0A9CA6FC1AAFC89E` |
| `IBMPlexSansArabic-Medium.ttf` | `EEF162792CF2A6BA5AF7943AF9F86843B1286AB67AAF615C18C07FD8E97A4A90` |
| `IBMPlexSansArabic-Regular.ttf` | `8E0F1046C736BF939D4939EE3AE0116ACF61CBCD6592DEAE7656761627080981` |
| `IBMPlexSansArabic-SemiBold.ttf` | `1D4AB8B6EBADBB9D85F2ECDCB7CB0BB672420A8FF3388AB4F69D7B98056562AA` |
| `ReadexPro-Variable.ttf` | `268BBA7E1E8F3B14D798B3FB0E40EBAA3FC39308C9AC0020E2FAF6DF181CC30E` |

### Other located APKs

**VERIFIED:** These are other preserved build artifacts, not copies of the E10 APK. Only the E10-named APK above was located in the E10 evidence directory; the installed APK matches it. The two E4 paths are byte-identical to one another. The hash list prevents confusing adjacent phases with the verified E10 binary.

| Artifact path | Size | SHA-256 |
|---|---:|---|
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E4-EntryRedesign\app-debug-presentation.apk` | 182,985,507 | `774994AFFD5ECC243BA68711C107E775E5A27393727364476C335CAE4B794F0C` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E4-EntryRedesign\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 182,985,507 | same E4 hash |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E5-20261121\isolated-build-final\_app\outputs\apk\debug\app-debug.apk` | 183,451,047 | `1FE1717AE767AB79FF722A479BF30FD2CD4D690812995459E34E75D23E8156B2` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E6-20261121-2234\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 183,451,031 | `5178C8473BC50A0A864CCBBEB084B2BEF8FB2052D7AB8656232ACCF57545E729` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E7B-20261122-0825\phase2e7b-production-debug.apk` | 183,599,275 | `FE0F3E7731A0F8A0BE3EDFECFC7D57061248627DF053C3137D332CEF09B71822` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E7B-20261122-0825\phase2e7b-ui-kitten-native-smoke.apk` | 183,599,275 | `9E753BD070F182009AA2E3C17E654CE1B2C10526E2F988EA6D12B895AE68A4E1` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E7B-20261122-0825\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 183,599,275 | same E7B smoke hash |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E9-20261122-1215\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 184,786,009 | `48417B2316900352779337DAFC2B65BC3FCC4DB80F33EABE09B7E4A8FA4A143C` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Native26-20261120-1948\installed-base.apk` | 183,178,335 | `7C796FFEB80066E37E5F5314F1F8B3F696AAB2372D13B5A5E9EC72D6E196D6FC` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E2C-20261120-165400\installed-base-before.apk` | 185,667,129 | `BE139755536D8D54A35343662B39A2F3EBEC2B99D1D51C8B8ED50568676B32CA` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E2D-20261120-1836\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 183,178,335 | same hash as Native26 artifact |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3A-20261120-2010\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 185,125,583 | `7FCB1CA12BBE7A94E8A6FB9079FBE6D037C829CE7A30C36B9457931859E176C0` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3B-20261120-2110\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 185,125,755 | `FA6031A71159129DE875050918721720D027677DB078B32CBD5B905040B011BB` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3B-20261120-2125\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 185,125,751 | `970B16A3E9605877DD9AED4F0373195ACAB95E6A07723DB17ABA2E7930F9351F` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3B-20261120-2135\evidence\pre-role-localization\app-debug.apk` | 185,125,751 | `59C518B7B49FFB7C31EC6F4FA9E5466E6E61983E7E10C8C82A77694A22BA12AE` |
| `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E3B-20261120-2135\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 186,281,467 | `9BECE13537DB6D800BA96659D14CED23A70AEB8BF9F201FFAD1470B5B983931A` |

The `...` prefix in this table is `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\`.

**VERIFIED from saved Desktop build output:** Current Desktop `android\app\build\outputs\apk\debug\app-debug.apk` is 184,001,437 bytes, SHA-256 `D27143F27C3784BF677DE4FF8482EF6808DEAAC9625C62C0EE1C17EF0DCA394A`; it is not E10. Its debug signing certificate matches E10's certificate fingerprint. A separately located older `sanad-rn` APK is 82,241,589 bytes, SHA-256 `83E9E1C167F9A518BD7938AC6F5012C09F9257B91524E12BD0C11B645C9D19AE`; it is not E10.

## 6. E10 build provenance and exact source snapshot

### Direct evidence

- **REPORTED:** E10 and E11 report the source repository path as `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`, branch `migration/aes-guardian`, HEAD c81, index tree `983733927b18bf30b8377f84c9c1813c74c4bf6b`, and 345 final status paths. The reports say no staged files.
- **REPORTED:** E10 `final-status.txt` lists 345 paths and marks `App.tsx`, `src/navigation/AppNavigator.tsx`, `src/features/authentication/screens/AuthGateScreen.tsx`, and `src/features/aes-guardian/screens/WelcomeCarouselScreen.tsx` as modified, alongside untracked shared UI/provider/font assets. That is evidence of a dirty source state at build time, not an exact content manifest for every file.
- **VERIFIED:** `assemble-debug.log` records `:app:createBundleDebugJsAndAssets`, `:app:assembleDebug`, and success in 9m55s. It does not record the exact shell command, complete environment variables, or a full source tree hash. The APK filesystem timestamp is not an exact build invocation record.
- **VERIFIED:** E10 source map: `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\isolated-build\_app\generated\sourcemaps\react\debug\index.android.bundle.map`, size 7,978,892 bytes, SHA-256 `E608BB0744CE48570BDDF3B9EBD99F695C581995887AA13E9B82041B329B435F`. It contains 1,104 source entries, including 111 project source modules outside `node_modules`; all 111 have `sourcesContent`. Their embedded paths point at the Desktop root. The map mtime is 2026-11-22 15:09:03 UTC.
- **VERIFIED:** A byte-hash comparison found 53/111 E10 project `sourcesContent` modules match the current Desktop files. `AccessScreen.tsx`, `fontFamilies.ts`, and `SanadUiKittenProvider.tsx` match exactly. The nine packaged fonts also match exactly. The E10 map and current Desktop differ for `App.tsx`, `AppNavigator.tsx`, `AuthGateScreen.tsx`, `WelcomeCarouselScreen.tsx`, `AppIcon.tsx`, `AppText.tsx`, `AppTextInput.tsx`, and `AesGuardianDatabase.ts`.

Selected E10 source-map/current-source UTF-8 SHA-256 comparisons:

| Module | E10 map content SHA-256 | Current Desktop file SHA-256 | Result |
|---|---|---|---|
| `App.tsx` | `09D69822A73A321F8A319DB4DE1B215A67710A26AD01B8762A2059674D93A5D0` | `DD88491412DF68B291CB5138C38BE7D0B894D8CAB48E9A206DDADBF977BDE67D` | Different |
| `src/navigation/AppNavigator.tsx` | `A58C0180308083D958AA52B5333F529AD18D6478DBF17561E90F08B5EA78ACDD` | `2BB3EC831A3114053B15F2E3DCB6F13FB478821E58A96C24CB13FD2F664780CB` | Different |
| `src/features/authentication/screens/AuthGateScreen.tsx` | `3F592450A6E20464A90B7CC5CF3116C03905D899C46C215E64AA0544D937AC76` | `B7004B4E8BEFC6ED2E4603509906D296F18DFFE0986F4942BAA167F1994FCAE2` | Different |
| `src/features/aes-guardian/screens/WelcomeCarouselScreen.tsx` | `7D55095631B9B34ABD0D389F33F7BE33D374E07659C4535313F01172C5D47A80` | `1E830304D6A2B6D1E24F5074D406942FCB93C5162E9B7459D96716D80674E295` | Different |
| `src/components/AppIcon.tsx` | `C1DD36019171A76FE4ABEFBBB2EC40DACB3DADBFFC84EE642D6C38497B4A28BD` | `C21F24FFB74185831B9770DF7AF7B8F0684655697998CF62372457EC4DEF5137` | Different |
| `src/components/AppText.tsx` | `B2553CF949B2158ED0CC4C246FDB3C97711504C8A6ABFD65C9095027DDB84BB` | `778F5B88F0A1DF65C61FF2957C92671186A2B63D97B9D4415131CB5CFF3EAB58` | Different |
| `src/components/AppTextInput.tsx` | `3D82D3936145B760F856414FB44166AA4612CF44C93842391AC5F5C100C763C7` | `1EF7CA382F21EE91A3FB003649E77069AE5CB6547CDD7AB888534BE5B3774795` | Different |
| `src/features/authentication/screens/AccessScreen.tsx` | `9E12F1D0DEC1004AE29DCBB25D8837D939DACD26218D113F22BB955206CE32C3` | same | Exact |
| `src/theme/tokens/fontFamilies.ts` | `5EDF8780A957BE1AD577AC85DB9B0C0A8E5C43AB3DF3102EF00219EA758C67FC` | same | Exact |
| `src/theme/SanadUiKittenProvider.tsx` | `9E50B073F95AFADE24FB5E233F7D22E10F857FD77C7A79EEBBAD063AC9506CCA` | same | Exact |
| `src/core/database/AesGuardianDatabase.ts` | `D0B35ED6CE56C3F621D3240D2F77AB5CE73EF5EE4AEA4E8583761A981B957D9C` | `7915ECEA5E72D6826FF5518845448FAFEECA2736CA68412EFBE05A76E62BC469` | Different |

**INFERRED:** The most likely build origin is a Desktop source directory based on c81 with a large, uncommitted E10 working-tree layer; this is strongly supported by the report metadata, absolute source-map paths, and matching fonts/current files. The exact file contents of the modified entry screens and other differing modules cannot be attributed to an intact Git commit. The source map is existing build evidence and possible future recovery material, but is not a complete project directory. Its source text was not written out as files or used to reconstruct a tree.

**NOT FOUND:** The exact E10 shell command, complete environment, full pre-build source manifest with content hashes, and an exact complete source snapshot (branch/worktree/archive) were not located. The build could have read the Desktop working tree; no evidence establishes a different source root, but an undocumented copy cannot be ruled out absolutely.

## 7. Desktop changed/untracked inventory

**VERIFIED:** Expanded current Desktop status is 274 paths, not the previously quoted 156. The discrepancy is the status display mode: 156 is consistent with collapsing untracked directories; `--untracked-files=all` lists each file.

| Status category | Count | Scope |
|---|---:|---|
| Modified tracked | 17 | Generated Android/Gradle build/cache artifacts under `android/.gradle` and `android/compat/build` |
| Deleted tracked | 6 | Generated Android/compat build artifacts under `android/compat/build` |
| Untracked | 251 | `.agents` 8, `.claude` 8, `android` 110, `docs` 88, `src` 33, root/evidence 4 |
| Staged | 0 | None |
| Renamed | 0 | None |
| Conflicted | 0 | None |
| Total expanded paths | 274 | 17 + 6 + 251 |

All 23 tracked changes are generated/build outputs; no tracked application source file is modified in the current status. Untracked content includes both useful source/evidence and generated output. No untracked item was treated as disposable. The full machine-generated `git status --porcelain=v2 --untracked-files=all` manifest is appended in Appendix A.

### High-priority untracked preservation candidates

The following are explicitly **not** disposable. Whether a file is the only copy is scoped to the inspected repositories/worktrees; the E10 source map/APK may embed content or bytes even where no ordinary source-tree copy was found.

| Path(s) | Why preserve |
|---|---|
| `src/components/AppIcon.tsx`, `AppText.tsx`, `AppTextInput.tsx`, related tests | Untracked shared UI versions; current contents differ from the E10 map and from checked checkpoint variants. E10 map preserves different module content. |
| `src/features/authentication/screens/AccessScreen.tsx` | Untracked; exact content match to E10 source map. |
| `src/theme/tokens/fontFamilies.ts`, `src/theme/SanadUiKittenProvider.tsx` | Untracked; exact content match to E10 map. `fontFamilies.ts` and provider are absent from fbbc tracked tree. |
| Eight IBM Plex Sans/Arabic TTFs, `ReadexPro-Variable.ttf`, their license files | Untracked; TTF bytes match the verified E10 APK exactly. Current tree also contains older OpenSans, Urbanist, Young Serif, and Instrument Sans assets. |
| `src/core/database/capa-operation-utils.ts`, `src/core/database/__tests__/migration9.test.ts`, `capa-operation-idempotency.test.ts`, `capa-operation-entropy.test.ts` | Untracked CAPA recovery design/tests. They describe the expected migration 9/10 table and behavior missing from current DB code. Preserve as evidence, not as proof of implemented behavior. |
| `src/features/authentication/__tests__`, AES workflow/UI tests, typography/provider tests, `DirectionalStackBackButton.tsx` and tests, `prevention-date-format.ts` and tests | Untracked test/support source not in the fbbc commit. Do not equate test existence with passing tests. |
| `docs/SANAD_PHASE2E*`, `SANAD_COMPLETE_UI_UX_IMPLEMENTATION.md`, `SANAD_46_SCREEN_REDESIGN_TRACKER.md`, all `AES_GUARDIAN_PHASE2E1_*` and audit reports | 88 untracked docs/evidence files. They are historical claims with differing scopes, but preserve audit trail and phase context. |
| `android/compat-pointer-events/build.gradle`, `android/compat-pointer-events/src/main/kotlin/com/facebook/react/uimanager/ReactPointerEventsView.kt` and generated compatibility artifacts | The E10 report refers to an established Android compatibility build procedure; the untracked source/build module may be necessary for repeatable builds. Generated artifacts are not substitutes for source. |
| E10 `index.android.bundle.map`, `assemble-debug.log`, `final-status.txt`, `preflight-status.txt`, font hash list, bundle, and APK | Outside the repository under the E10 session evidence directory. Preserve byte-for-byte; source map is a build artifact, not a complete source tree. |

### Related current source observations

- **VERIFIED:** Current `AppText.tsx` has `typographyRole?: string`, but the rendered variants use `typography.fontFamily.urbanist` for display/title/section and `openSans` for body/label/caption; `typographyRole` is destructured but not used to select a family/weight. Current AppText therefore does not implement the E10 report's claimed locale-aware semantic typography integration.
- **VERIFIED:** Current `AppIcon.tsx` imports `@hugeicons/react-native` and the Hugeicons core-free registry. However, 16 source files still import `react-native-vector-icons/Feather`: `PatientMessagesScreen.tsx`, `NurseMessagesScreen.tsx`, `NurseProfileScreen.tsx`, `NursePatientsScreen.tsx`, `NurseDashboardScreen.tsx`, `NurseAlertsScreen.tsx`, `MonitoringIntroScreen.tsx`, `PatientTreatmentScreen.tsx`, `PatientProfileScreen.tsx`, `PatientHomeScreen.tsx`, `LoginScreen.tsx`, `DemoAccountPickerScreen.tsx`, `LanguageSelectionScreen.tsx`, `DeclarationFormScreen.tsx`, `SubmissionConfirmationScreen.tsx`, and `WelcomeCarouselScreen.tsx`.
- **VERIFIED:** Current `AppNavigator.tsx` starts with legacy application `SplashScreen`, then `AuthGateScreen`; AES language/welcome/disclaimer/demo routes are also registered. The E10 map's versions of AppNavigator/AuthGate/Welcome differ from current source. Registration alone does not establish that the intended E10 entry route is wired in the current app.

## 8. Candidate source snapshot comparison

| Candidate | Entry/welcome | Typography/assets | Icons | AES workflows / technical base | Assessment |
|---|---|---|---|---|---|
| c81 committed tree | Baseline screens and AES routes; not the dirty E10 version | Does not itself contain E10's untracked IBM/Readex assets/shared typography files | Earlier icon implementation | Committed Phase 2D–2E workflows and SQLite base | **PRESENT BUT PARTIAL** for E10; useful baseline, not complete E10 snapshot |
| E10 dirty Desktop source as documented | Modified `App.tsx`, `AppNavigator`, AuthGate and welcome at build time per saved status | E10 report says IBM Plex Sans/Arabic + Readex; actual APK fonts and map verify | E10 map embeds shared icon module | Based on c81 plus dirty source; reports/build log evidence | **PRESENT ONLY IN APK/BUILD ARTIFACT** for some exact module versions; no complete live directory/hash manifest |
| c0ab redesign commit/worktree | Redesigned AuthGate/welcome-related source exists; committed tree is clean | No IBM/Readex `fontFamilies.ts`/font assets in its committed tree | Its `AppIcon.tsx` is a small stub variant, not current full registry | c81 workflows remain, plus UI/lint changes | **PRESENT ONLY IN ANOTHER SNAPSHOT**, not E10 exact |
| fbbc current Desktop | Legacy splash/AuthGate launch path plus registered AES onboarding routes; different from E10 map | Assets/resolver/provider are untracked and partly match E10; AppText wiring remains OpenSans/Urbanist | Current untracked Hugeicons implementation, with 16 Feather imports remaining | AES workflows largely present; durable CAPA operation subsystem is stubbed | **PRESENT BUT PARTIAL**; current committed tree is not E10 |
| E10 source map | Embeds exact source text for 111 project modules used by the bundle | Includes E10 font resolver/provider modules; font binaries are in APK and Desktop | Embeds the E10 AppIcon module text | Bundled runtime source only; not tests, unused files, build scripts, or full Git worktree | **PRESENT ONLY IN APK/BUILD ARTIFACT** for source versions not found in current tree |
| Other AES linked worktrees | c81/fbbc/c0ab bases; differing dirty files | No one inspected clean worktree is the complete E10 set | Several untracked/checkpoint variants differ | Same shared AES object store; not independent backups | **PRESENT BUT PARTIAL** |
| `sanad-rn` repo/worktrees | Older/separate SANAD history; c81 object mirrored, not E10 dirty tree | Not E10 source; one worktree DB is schema 7 | Not evidence of E10 Hugeicons source | Older workflow ancestry; independent Git object store | **PRESENT BUT PARTIAL** |
| `respiracare-backup` | Flutter source, not RN E10 | Original SANAD icon file hash matches Desktop asset | Not RN icon registry | Not a Phase 2E source candidate | **PRESENT ONLY IN ANOTHER SNAPSHOT** for that logo asset |

**Important limitation:** c81, c0ab, and fbbc are complete Git trees for their own commits. None is the exact complete tree claimed to have built E10. The E10 source map provides source content for bundled modules, but cannot establish non-bundled repository files, complete build configuration, or all untracked state.

## 9. Feature and workflow preservation matrix

Classifications below describe source presence, not successful runtime or test execution. No tests were run for this investigation.

| Workflow/feature | Current Desktop fbbc source | Other candidate / APK evidence | Files and evidence |
|---|---|---|---|
| Declaration create, draft/edit, validation, submit | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in c81 tree; APK embeds runtime screens | `DeclarationFormScreen.tsx`; DB `createDraft` line 738, `updateDraft` 778, `submitDeclaration` 837, declaration queries 901+; declaration workflow tests exist. |
| Administrative review/status transitions and correction requests | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in c81 and APK runtime | `AdminReviewQueueScreen.tsx`, `AdminReviewActionScreen.tsx`, `CorrectionResponseScreen.tsx`; DB `getReviewQueue` 1053, `createAdministrativeReview` 1101, `createCorrectionResponse` 1223, review history 1411; acceptance/workflow tests exist. |
| OH coordination, acknowledgement, follow-up events | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in c81 and APK runtime | Queue/detail/create/follow-up screens; DB methods `createOhCoordination` 1514, `acknowledgeOhCoordination` 1595, `createOhFollowUpEvent` 2088, history 2196; tests and report evidence exist. |
| Surveillance aggregation/dashboard | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in c81 and APK runtime | `SurveillanceDashboardScreen.tsx`; `getSurveillanceDashboardMetrics` at DB line 2242; focused tests are present/reported. |
| Contributing-factor classification | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in schema and source candidates | `CONTRIBUTING_FACTOR_CATEGORIES`, prevention form/register/detail; migration 7 creates `prevention_actions` with factor constraints. |
| CAPA create and lifecycle | **PRESENT BUT PARTIAL; current UI submit path is broken** | Basic prevention action/schema and status transitions exist in c81/fbbc; APK contains runtime CAPA screens. Durable identity recovery **NOT FOUND** in a complete candidate | DB `createPreventionAction` 2470, `createPreventionActionForOperation` 2603, `updatePreventionActionStatus` 2730, migration 7. `PreventionActionCreateScreen.tsx:245` calls undefined `db.createCapaCreationOperationId()` before the creation call; the caught error prevents screen submission. |
| Durable CAPA create-operation reservation, idempotency, crash/restart reconciliation, acknowledgement | **NOT FOUND / PRESENT ONLY AS STUBS** in current DB | Untracked migration9/idempotency tests specify intended schema versions 9/10 and `capa_creation_operations`; no tracked migration implementation found by `git log --all -S`. E10 map differs from current DB but was not parsed for recovery. | `AesGuardianDatabase.ts:85` sets schema 8; `MIGRATIONS` ends at 8; lines 2700–2723 return a constant `reserved`, `null`, or empty arrays. `src/core/database/capa-operation-utils.ts` is untracked and is not wired into the production DB. The UI also calls undefined `db.createCapaCreationOperationId()` at screen line 245. **This gap is genuine in the current source.** |
| Notification creation, persistence, unread counts, acknowledgement/read state | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in c81/fbbc; APK bundles notification UI | Migration 8 creates `in_app_notifications`; DB methods `createNotification` 3079, queries 3092+, `markNotificationRead` 3173, `markAllNotificationsRead` 3196; notification centre is routed. |
| Audit/history events | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in c81/fbbc; APK cannot prove current source | `audit_events` migration 1; `listAuditEvents` 1498; declaration/review/OH/prevention mutations insert audit records; review history 1411. |
| Local/offline persistence | **PRESENT BUT PARTIAL** (local SQLite implementation; not a live synchronization service) | **PRESENT** in c81/fbbc; APK packages the runtime | `NativeSQLiteAdapter.ts`, `DatabaseService`, `AesGuardianDatabase.ts`; local persistent SQLite tables/migrations. Source inspection does not prove every restart edge case. |
| Role permissions | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in c81 and APK runtime | `src/core/auth/boundaries.ts`, `useDemoRoleStore`, screen gates, and DB role checks such as `quality_staff` enforcement in CAPA create. |
| Synthetic demo users/data | **PRESENT AND VERIFIED IN SOURCE** | **PRESENT** in c81/fbbc; APK uses demo workflow | `demo-scenario-seeder.ts`, DB `demo_users` and `listDemoUsers`, five role picker/workspace flows. The reports characterize data as synthetic/local-only. |
| Welcome, IBM/Readex typography, Hugeicons | **PRESENT BUT PARTIAL** in current Desktop | Exact variants **PRESENT ONLY IN APK/BUILD ARTIFACT** through E10 map/APK | See §§7 and 10; the entry/welcome and shared components differ by hash; fonts match exactly. |

**Test evidence distinction:** Existing test files are inspected as files only. E10/E11/consolidated reports contain historical test claims with different source states and counts; those claims are not evidence that tests pass against current fbbc. No test command was run in this investigation.

## 10. Report reconciliation and contradiction register

| Topic | Earlier evidence | Later/conflicting evidence | Reconciliation / confidence |
|---|---|---|---|
| Typography names | E5 report (file timestamp 2026-11-21 21:26:47Z) says Young Serif for Latin display, Instrument Sans for Latin body, system Arabic fallback. E10 report (2026-11-22 15:20:11Z) says IBM Plex Sans + IBM Plex Sans Arabic + Readex Pro, all with bundled assets. | Consolidated report (2026-11-23 09:50:30Z) says OpenSans/Urbanist remain available and IBM/Readex were not introduced. Current Desktop contains all these older font families *and* IBM/Readex; current shared AppText uses OpenSans/Urbanist. | **VERIFIED:** E10 APK includes the nine IBM/Readex TTFs with exact hashes matching current assets. **INFERRED:** Reports describe different working-tree/source states, not one consistent final tree. E10 claims are true of its binary; the consolidated report is not an accurate description of current Desktop assets nor of E10 APK. |
| Shared typography wiring | E10 report says AppText/AppTextInput resolve locale-aware semantic families and roles; provider maps Eva families. | Current AppText uses Urbanist/OpenSans and leaves `typographyRole` unused; current input was previously inspected as fixed OpenSans. `fontFamilies.ts` and provider are present untracked and match E10 map. | **VERIFIED:** Assets/resolver/provider survive, but the current AppText implementation does not wire them. The full E10 component source is present in the map, not the current file. |
| Hugeicons completion | E5 report says Hugeicons is the shared icon system for active application UI; E8 says AES screens route through AppIcon/Hugeicons. | **VERIFIED:** Current source still has 16 Feather imports, including AES welcome, language, demo, declaration-form, and submission-confirmation screens. c0ab's tracked AppIcon is only a stub; current untracked AppIcon is a distinct fuller registry. | Claims are scope-dependent: shared Hugeicons infrastructure exists, but full repository migration is incomplete. “Completed migration” should not be read as zero legacy imports. |
| “TESTED” for 46 screens | Tracker timestamp 2026-11-23 08:28:02Z marks all 46 rows `TESTED`. | Tracker's own legend says the status records source review/focused tests and does not mean every screen passed device visual acceptance. E11 covers selected declaration/typography paths, not all 46 screens. | No direct contradiction if the legend is followed. The label is easy to overread as full native acceptance; no 46-screen device pass is evidenced. |
| E10 native rendering status | E10 report calls typography partially accepted; native rendering initially unverified due unavailable emulator. | E11 (2026-11-22 19:33:42Z) reports native rendering acceptance after recovering a separate API 36.1 emulator and using the same APK hash. | Chronologically compatible: later native evidence supersedes the earlier “pending” state for the limited routes/conditions it tested. It does not prove every screen or variable-font axis. |
| Report source/HEAD/status | E5/E8/E10/E11 reports cite branch `migration/aes-guardian`, HEAD c81, same index tree; E10/E11 report 345 status paths. | Desktop now has HEAD fbbc, status 274 expanded paths, plus clean c0ab sibling branch and checkpoints. | Reports document different dates and dirty working-tree snapshots. Same HEAD does not mean same files: untracked/modified working tree was the primary source layer. Current status count cannot be compared directly to E10 without the historic complete file-content manifest. |
| CAPA durability | fbbc commit subject claims “durable CAPA workflow”; untracked tests/report files describe a CAPA operation identity/reservation/recovery lifecycle. | Current DB has schema 8, no migration 9/10, and placeholder operation methods; tests expect a table not created by the DB. | **VERIFIED:** The feature is incomplete in current source despite commit subject/tests. Historical claims/tests do not establish an integrated implementation. No tracked implementation found in searched refs. |
| Historical path counts | E5 reports preflight 264/final 319; E8 preflight 325; E10/E11 final 345. | Current expanded status 274. | Each was a timestamped working-tree inventory and may count files/directories differently. They are not evidence of identical trees or of source loss by themselves. |

Report timestamps above come from local file metadata; report statements remain **REPORTED** unless explicitly compared to current source or binary in this investigation.

## 11. Recovery options — analysis only

| Option | Evidence / feasibility | Risk and missing evidence | Confidence |
|---|---|---|---|
| Recover exact complete E10 tree from a normal commit | c81 is the reported base; c0ab and fbbc are known descendants/siblings; source map records E10 module contents. | No complete Git commit matching E10 source hashes was identified; exact dirty file set/content and build command are absent. | Low for exact commit recovery. |
| Recover from a different registered worktree | Many linked worktrees preserve c81, c0ab, and fbbc states; some have untracked design files. | None inspected is a complete exact E10 tree. They share the same AES object store and are not independent backups. | Medium for recovering specific fragments; low for exact snapshot. |
| Recover from local backup/archive | `respiracare-backup` and independent `sanad-rn` exist; E10 evidence exists in session storage. | No complete React Native E10 project archive/backup found in inspected paths. Flutter backup is not a code source candidate. | Low to medium; external uninspected backups remain unknown. |
| Reconstruct by comparing c81, c0ab/fbbc, untracked source, checkpoint refs, and E10 map | E10 map has embedded source for 111 project modules; 53 match present Desktop files; exact fonts and some untracked modules survive. | Not a single source tree; map omits unbundled/test/build files, other versions conflict, and some exact E10 module sources exist only inside map evidence. Reconciliation risks mixing incompatible versions. | Medium that a useful reconstruction can be assembled after approval; low that exact whole tree can be asserted without more evidence. |
| Use verified APK as behavioral/asset reference | Exact APK is available and installed; font hashes, package metadata, ABI, signature, and bundle are verifiable. | APK is not original source. No decompilation/reconstruction was attempted. Binary behavior cannot establish unbundled source/config/tests. | High for binary/asset reference, low for recovering original project source by itself. |
| Create isolated recovery copy/branch after authorization | Git objects/worktrees and external E10 artifacts are present; an isolated copy can preserve candidates without overwriting them. | Requires explicit authorization and a verified preservation manifest. Must not reuse or mutate current Desktop worktree as the recovery scratch area. | High as safest next operational approach. |

### Recommended strategy

**INFERRED recommendation:** First preserve, without changing, the complete Desktop status manifest and all untracked source/docs/assets; preserve the AES common Git directory including all refs/checkpoints; preserve the exact E10 APK, source map, bundle, logs, status snapshots, and font hashes. After explicit user approval, create an isolated recovery copy outside the current worktree, then compare c81 + E10 map content + c0ab/fbbc/checkpoint variants file-by-file. Keep each candidate immutable and record hashes before any synthesis. Treat the current CAPA durable-operation tests as expectations, not proof; handle that functional gap separately after source recovery is complete.

## 12. High-priority facts still unknown

1. **BLOCKED/NOT FOUND:** Exact complete source snapshot, Git tree hash, and file-content manifest used by the E10 Gradle build.
2. **NOT FOUND:** Exact Gradle shell command, build environment variables, toolchain environment snapshot, and exact source checkout/worktree identity beyond the reported Desktop path/c81 base.
3. **BLOCKED:** Source files outside the 111 modules included in the Metro source map (tests, unused screens, scripts, build configuration, and any unbundled assets) cannot be proven to match the E10 build without a complete preserved snapshot.
4. **NOT FOUND:** A complete E10 source archive in another registered repository/worktree. This does not exclude backups outside the searched local scope.
5. **NOT FOUND:** A committed migration 9/10 implementation for durable CAPA operation records in the searched Git refs. The current untracked tests specify expectations, but production integration is absent in inspected source.
6. **BLOCKED:** No tests/builds were run, by instruction. Historical report claims cannot substitute for current validation.
7. **BLOCKED:** No screenshot walkthrough was performed on `l3andalib_2` during this read-only investigation; only installed package identity/hash/device metadata were queried.

## 13. Exact next steps requiring user authorization

No recovery has been executed. A safe next phase would require explicit authorization for each scope: (1) create a separate preservation copy of the Desktop working tree and relevant evidence; (2) export/compare the E10 source-map embedded module contents against candidate source files, without writing into existing candidates; (3) create a separate recovery branch or isolated worktree/copy; (4) only after source selection, reconcile missing source and separately address the CAPA durable-operation gap; (5) validate builds/tests only when authorized. Until then, preserve every untracked file and Git checkpoint/ref. Do not run `git clean`, reset, checkout/switch, restore, stash, rebase, merge, or branch mutations; do not delete “generated” files; do not overwrite any candidate; do not rebuild/reinstall; and do not treat APK-derived content as a recovered repository.

## 14. Direct answers to the twelve required questions

1. **Do we know the exact source commit or snapshot that produced the installed Phase 2E.10 APK?** No. The APK hash is exact; its source commit/snapshot is not. Reports cite c81 as the base and 345 dirty paths, and the source map points to Desktop.
2. **If yes, where is it, and is it still complete?** Not applicable. No exact complete snapshot was identified.
3. **If not, what is the closest surviving candidate?** The c81 Desktop baseline plus the E10 source-map evidence, current untracked E10-matching files/assets, and the E10 report's dirty-tree record. c0ab and fbbc are separate later source candidates, not substitutes for E10.
4. **Does the full redesigned SANAD source exist in any currently accessible repository or worktree?** No single complete exact E10 tree was found. A committed UI redesign exists at c0ab; current source is fbbc plus untracked fragments; E10 source-map content preserves 111 bundled project modules.
5. **Are the newer welcome, typography, and Hugeicons implementations recoverable?** Partially. The E10 APK/map contains source content and the APK contains the exact fonts; `AccessScreen`, resolver, provider, and fonts match current files. E10 entry/welcome/shared component versions differ from current source and must be preserved from the map for later authorized recovery. Hugeicons source exists, but 16 Feather imports remain.
6. **Are the AES workflow implementations still present in the current source or another candidate?** Declaration, review, OH coordination/follow-up, surveillance, notifications, audit, local SQLite, role boundaries, and synthetic demo flows are present in current source and/or c81. CAPA schema/create/status methods are present, but the current create screen calls a missing database method and cannot complete submission; durable CAPA operation identity/reservation/restart recovery is also absent from the current DB source (stubs plus untracked tests only).
7. **Which files are at risk because they exist only as untracked local files?** High priority: the IBM/Readex fonts/licenses; AppIcon/AppText/AppTextInput; AccessScreen; fontFamilies; SanadUiKittenProvider; CAPA utilities/tests and numerous workflow/design tests; Android compatibility module; 88 docs/evidence files. See §7 and Appendix A. Some exact current files are also preserved in source-map content or checkpoint variants, but not necessarily byte-identically.
8. **Has Git history recorded any commits or branch movements that explain the discrepancy?** Yes. c81 is the base; c0ab and fbbc are sibling commits from c81; the branch reflog moves from c81 to fbbc by a new commit. Copilot checkpoint refs preserve additional variants. No reset/rebase/destructive movement is evidenced.
9. **Is any work genuinely missing, or is it more accurate to say the source is fragmented across snapshots?** Both: most visual/workflow source is fragmented across commits, worktrees, untracked files, and E10 map; the current CAPA create screen also calls a database method that does not exist, and durable operation persistence is genuinely missing from the inspected current production source.
10. **What is the safest way to recover the complete application without losing newer changes?** Preserve the current tree and Git object store, then work only in a new isolated recovery copy after authorization; compare each candidate by file hashes and never merge into the live Desktop checkout during discovery.
11. **What should we preserve first?** E10 APK/source map/bundle/log/status/font evidence; all Desktop untracked files and complete status; all linked worktrees and 61 checkpoint refs; c81/c0ab/fbbc commits; and Android compatibility source/build artifacts.
12. **What must we absolutely NOT do until recovery is complete?** Do not clean/reset/restore/stash/switch/rebase/merge/commit, delete or overwrite untracked files, prune Git history/objects, rebuild or reinstall the APK, or treat decompiled/APK-extracted code as the original source.

## Final decision

# **RECOVERABLE — SOURCE FRAGMENTED ACROSS KNOWN SNAPSHOTS**

This decision means there are concrete, located source fragments and the verified binary/source-map evidence needed for a later isolated recovery attempt. It does **not** mean the exact complete E10 Git source snapshot has been found, that recovery has been performed, or that all source is proven present. No implementation or repair was performed; stop here pending explicit authorization.

## Appendix A — Complete expanded Desktop status manifest

The next appendix is generated directly from the Desktop repository's read-only `git status --porcelain=v2 --untracked-files=all`. Raw Git path separators are preserved as emitted on this Windows host. It includes every modified, deleted, and untracked path; there are no staged, renamed, or conflicted records.

```text
1 .M N... 100644 100644 100644 7a2f90df93df3050e9b622bf9bf32e1830adb30d 7a2f90df93df3050e9b622bf9bf32e1830adb30d android/.gradle/8.11.1/executionHistory/executionHistory.bin
1 .M N... 100644 100644 100644 fabbd51ffeb012554fc90b545634baac27698902 fabbd51ffeb012554fc90b545634baac27698902 android/.gradle/8.11.1/executionHistory/executionHistory.lock
1 .M N... 100644 100644 100644 7161696ae047b732f8c161a5ed24ae4138998af3 7161696ae047b732f8c161a5ed24ae4138998af3 android/.gradle/8.11.1/fileHashes/fileHashes.bin
1 .M N... 100644 100644 100644 a288daa6a1c676c073a0a96beae5ef8163d1f027 a288daa6a1c676c073a0a96beae5ef8163d1f027 android/.gradle/8.11.1/fileHashes/fileHashes.lock
1 .M N... 100644 100644 100644 a6e04bcfb8ba8d04cfdff06e29ef805cc3147991 a6e04bcfb8ba8d04cfdff06e29ef805cc3147991 android/.gradle/8.11.1/fileHashes/resourceHashesCache.bin
1 .M N... 100644 100644 100644 b842a3136218436a177150242b95ef37cd399931 b842a3136218436a177150242b95ef37cd399931 android/.gradle/buildOutputCleanup/buildOutputCleanup.lock
1 .M N... 100644 100644 100644 284c775e1c063d507ff7bf72f665e3571422cfa4 284c775e1c063d507ff7bf72f665e3571422cfa4 android/.gradle/buildOutputCleanup/outputFiles.bin
1 .M N... 100644 100644 100644 5db72533edad03d4ec6c34bb0a0f4ac0f4be9a5f 5db72533edad03d4ec6c34bb0a0f4ac0f4be9a5f android/.gradle/file-system.probe
1 .M N... 100644 100644 100644 6df79aeac792d095bdf34ba760449dfa3aa464eb 6df79aeac792d095bdf34ba760449dfa3aa464eb android/compat/build/.transforms/9bc5c0576752baf13c4091f3f41586c3/transformed/classes/classes_dex/classes.dex
1 .D N... 100644 100644 000000 67180b7cfd0d46b90a880c205b461a01a0bc966e 67180b7cfd0d46b90a880c205b461a01a0bc966e android/compat/build/.transforms/f60866945425cf8151f5c39319cd56e8/transformed/bundleLibRuntimeToDirDebug/bundleLibRuntimeToDirDebug_dex/com/facebook/react/uimanager/ReactPointerEventsView.dex
1 .M N... 100644 100644 100644 2e6b1dd29403c08fa71a8baef5a9fd41856e06bb 2e6b1dd29403c08fa71a8baef5a9fd41856e06bb android/compat/build/intermediates/aar_main_jar/debug/syncDebugLibJars/classes.jar
1 .M N... 100644 100644 100644 850f2f25ee37d9deeb3d3ca42fba4e727ad304a3 850f2f25ee37d9deeb3d3ca42fba4e727ad304a3 android/compat/build/intermediates/compile_library_classes_jar/debug/bundleLibCompileToJarDebug/classes.jar
1 .M N... 100644 100644 100644 22b2957df36474e2487ecd042dbbc2a31e5beca5 22b2957df36474e2487ecd042dbbc2a31e5beca5 android/compat/build/intermediates/incremental/debug-mergeJavaRes/merge-state
1 .M N... 100644 100644 100644 c89c19f2b7d8ce065164b30b0ab6e8505b2b5993 c89c19f2b7d8ce065164b30b0ab6e8505b2b5993 android/compat/build/intermediates/incremental/debug/packageDebugResources/compile-file-map.properties
1 .D N... 100644 100644 000000 1e9f2ca4d180a083a06174d407c30581ce729120 1e9f2ca4d180a083a06174d407c30581ce729120 android/compat/build/intermediates/java_res/debug/processDebugJavaRes/out/META-INF/compat_debug.kotlin_module
1 .M N... 100644 100644 100644 094fd8ffd2005f15c785fb2698be6b5ef4c66100 094fd8ffd2005f15c785fb2698be6b5ef4c66100 android/compat/build/intermediates/merged_java_res/debug/mergeDebugJavaResource/feature-compat.jar
1 .D N... 100644 100644 000000 1e9f2ca4d180a083a06174d407c30581ce729120 1e9f2ca4d180a083a06174d407c30581ce729120 android/compat/build/intermediates/runtime_library_classes_dir/debug/bundleLibRuntimeToDirDebug/META-INF/compat_debug.kotlin_module
1 .D N... 100644 100644 000000 7bf1f55c76b44aaaaf56b0cb33d9325772af564c 7bf1f55c76b44aaaaf56b0cb33d9325772af564c android/compat/build/intermediates/runtime_library_classes_dir/debug/bundleLibRuntimeToDirDebug/com/facebook/react/uimanager/ReactPointerEventsView.class
1 .M N... 100644 100644 100644 c208b91e38451777a8d8bd6d17b3e775b0bdf569 c208b91e38451777a8d8bd6d17b3e775b0bdf569 android/compat/build/intermediates/runtime_library_classes_jar/debug/bundleLibRuntimeToJarDebug/classes.jar
1 .M N... 100644 100644 100644 a450009cb07e58ba1a054eed10ee833c3a63338f a450009cb07e58ba1a054eed10ee833c3a63338f android/compat/build/outputs/aar/compat-debug.aar
1 .M N... 100644 100644 100644 35e8f4d01cf17f676b8679451a9624c019b6d986 35e8f4d01cf17f676b8679451a9624c019b6d986 android/compat/build/outputs/logs/manifest-merger-debug-report.txt
1 .D N... 100644 100644 000000 1e9f2ca4d180a083a06174d407c30581ce729120 1e9f2ca4d180a083a06174d407c30581ce729120 android/compat/build/tmp/kotlin-classes/debug/META-INF/compat_debug.kotlin_module
1 .D N... 100644 100644 000000 7bf1f55c76b44aaaaf56b0cb33d9325772af564c 7bf1f55c76b44aaaaf56b0cb33d9325772af564c android/compat/build/tmp/kotlin-classes/debug/com/facebook/react/uimanager/ReactPointerEventsView.class
? .agents/skills/gluestack-ui-v5/SKILL.md
? .agents/skills/gluestack-ui-v5/components/SKILL.md
? .agents/skills/gluestack-ui-v5/creating-components/SKILL.md
? .agents/skills/gluestack-ui-v5/performance/SKILL.md
? .agents/skills/gluestack-ui-v5/setup/SKILL.md
? .agents/skills/gluestack-ui-v5/styling/SKILL.md
? .agents/skills/gluestack-ui-v5/validation/SKILL.md
? .agents/skills/gluestack-ui-v5/variants/SKILL.md
? .claude/skills/gluestack-ui-v5/SKILL.md
? .claude/skills/gluestack-ui-v5/components/SKILL.md
? .claude/skills/gluestack-ui-v5/creating-components/SKILL.md
? .claude/skills/gluestack-ui-v5/performance/SKILL.md
? .claude/skills/gluestack-ui-v5/setup/SKILL.md
? .claude/skills/gluestack-ui-v5/styling/SKILL.md
? .claude/skills/gluestack-ui-v5/validation/SKILL.md
? .claude/skills/gluestack-ui-v5/variants/SKILL.md
? android/app/src/debug/assets/index.android.bundle
? android/app/src/main/assets/fonts/IBMPlexSans-Bold.ttf
? android/app/src/main/assets/fonts/IBMPlexSans-Medium.ttf
? android/app/src/main/assets/fonts/IBMPlexSans-Regular.ttf
? android/app/src/main/assets/fonts/IBMPlexSans-SemiBold.ttf
? android/app/src/main/assets/fonts/IBMPlexSansArabic-Bold.ttf
? android/app/src/main/assets/fonts/IBMPlexSansArabic-Medium.ttf
? android/app/src/main/assets/fonts/IBMPlexSansArabic-Regular.ttf
? android/app/src/main/assets/fonts/IBMPlexSansArabic-SemiBold.ttf
? android/app/src/main/assets/fonts/LICENSE-IBMPlexSans.txt
? android/app/src/main/assets/fonts/LICENSE-IBMPlexSansArabic.txt
? android/app/src/main/assets/fonts/OFL-ReadexPro.txt
? android/app/src/main/assets/fonts/ReadexPro-Variable.ttf
? android/compat-pointer-events/build.gradle
? android/compat-pointer-events/build/generated/source/buildConfig/debug/com/sanad/compat/pointerevents/BuildConfig.java
? android/compat-pointer-events/build/intermediates/aapt_friendly_merged_manifests/debug/processDebugManifest/aapt/AndroidManifest.xml
? android/compat-pointer-events/build/intermediates/aapt_friendly_merged_manifests/debug/processDebugManifest/aapt/output-metadata.json
? android/compat-pointer-events/build/intermediates/aar_main_jar/debug/syncDebugLibJars/classes.jar
? android/compat-pointer-events/build/intermediates/aar_metadata/debug/writeDebugAarMetadata/aar-metadata.properties
? android/compat-pointer-events/build/intermediates/annotation_processor_list/debug/javaPreCompileDebug/annotationProcessors.json
? android/compat-pointer-events/build/intermediates/annotations_typedef_file/debug/extractDebugAnnotations/typedefs.txt
? android/compat-pointer-events/build/intermediates/compile_library_classes_jar/debug/bundleLibCompileToJarDebug/classes.jar
? android/compat-pointer-events/build/intermediates/compile_r_class_jar/debug/generateDebugRFile/R.jar
? android/compat-pointer-events/build/intermediates/compile_symbol_list/debug/generateDebugRFile/R.txt
? android/compat-pointer-events/build/intermediates/incremental/debug-mergeJavaRes/merge-state
? android/compat-pointer-events/build/intermediates/incremental/debug/packageDebugResources/compile-file-map.properties
? android/compat-pointer-events/build/intermediates/incremental/debug/packageDebugResources/merger.xml
? android/compat-pointer-events/build/intermediates/incremental/mergeDebugJniLibFolders/merger.xml
? android/compat-pointer-events/build/intermediates/incremental/mergeDebugShaders/merger.xml
? android/compat-pointer-events/build/intermediates/incremental/packageDebugAssets/merger.xml
? android/compat-pointer-events/build/intermediates/java_res/debug/processDebugJavaRes/out/META-INF/compat-pointer-events_debug.kotlin_module
? android/compat-pointer-events/build/intermediates/javac/debug/compileDebugJavaWithJavac/classes/com/sanad/compat/pointerevents/BuildConfig.class
? android/compat-pointer-events/build/intermediates/local_only_symbol_list/debug/parseDebugLocalResources/R-def.txt
? android/compat-pointer-events/build/intermediates/manifest_merge_blame_file/debug/processDebugManifest/manifest-merger-blame-debug-report.txt
? android/compat-pointer-events/build/intermediates/merged_java_res/debug/mergeDebugJavaResource/feature-compat-pointer-events.jar
? android/compat-pointer-events/build/intermediates/merged_manifest/debug/processDebugManifest/AndroidManifest.xml
? android/compat-pointer-events/build/intermediates/nested_resources_validation_report/debug/generateDebugResources/nestedResourcesValidationReport.txt
? android/compat-pointer-events/build/intermediates/symbol_list_with_package_name/debug/generateDebugRFile/package-aware-r.txt
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/inputs/source-to-output.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/inputs/source-to-output.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/inputs/source-to-output.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/inputs/source-to-output.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/inputs/source-to-output.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/inputs/source-to-output.tab_i
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/inputs/source-to-output.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-attributes.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-attributes.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-attributes.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-attributes.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-attributes.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-attributes.tab_i
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-attributes.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-fq-name-to-source.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-fq-name-to-source.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-fq-name-to-source.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-fq-name-to-source.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-fq-name-to-source.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-fq-name-to-source.tab_i
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/class-fq-name-to-source.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/internal-name-to-source.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/internal-name-to-source.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/internal-name-to-source.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/internal-name-to-source.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/internal-name-to-source.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/internal-name-to-source.tab_i
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/internal-name-to-source.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/proto.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/proto.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/proto.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/proto.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/proto.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/proto.tab_i
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/proto.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/source-to-classes.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/source-to-classes.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/source-to-classes.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/source-to-classes.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/source-to-classes.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/source-to-classes.tab_i
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/jvm/kotlin/source-to-classes.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/counters.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/file-to-id.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/file-to-id.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/file-to-id.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/file-to-id.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/file-to-id.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/file-to-id.tab_i
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/file-to-id.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/id-to-file.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/id-to-file.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/id-to-file.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/id-to-file.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/id-to-file.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/id-to-file.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/lookups.tab
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/lookups.tab.keystream
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/lookups.tab.keystream.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/lookups.tab.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/lookups.tab.values.at
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/lookups.tab_i
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/caches-jvm/lookups/lookups.tab_i.len
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/cacheable/last-build.bin
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/classpath-snapshot/shrunk-classpath-snapshot.bin
? android/compat-pointer-events/build/kotlin/compileDebugKotlin/local-state/build-history.bin
? android/compat-pointer-events/build/outputs/aar/compat-pointer-events-debug.aar
? android/compat-pointer-events/build/outputs/logs/manifest-merger-debug-report.txt
? android/compat-pointer-events/build/tmp/compileDebugJavaWithJavac/previous-compilation-data.bin
? android/compat-pointer-events/build/tmp/kotlin-classes/debug/META-INF/compat-pointer-events_debug.kotlin_module
? android/compat-pointer-events/build/tmp/kotlin-classes/debug/com/facebook/react/uimanager/ReactPointerEventsView.class
? android/compat-pointer-events/src/main/kotlin/com/facebook/react/uimanager/ReactPointerEventsView.kt
? docs/AES_GUARDIAN_PHASE0_2_DEDICATED_REPOSITORY_REVIEW.md
? docs/AES_GUARDIAN_PHASE0_3_LOCAL_BASELINE_VERIFICATION.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_10_INDEPENDENT_UUID_PRESENTATION_AND_RESERVATION_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_11_RESERVATION_INTENT_INSERT_RACE_CORRECTION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_12_INDEPENDENT_RESERVATION_INTENT_INSERT_RACE_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_13_CREATE_INTENT_LIFECYCLE_CORRECTION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_14_INDEPENDENT_CREATE_INTENT_LIFECYCLE_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_15_CREATE_LIFECYCLE_REGRESSION_EVIDENCE_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_16_ACKNOWLEDGED_OPERATION_RETIREMENT_CORRECTION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_17_INDEPENDENT_ACKNOWLEDGEMENT_RETIREMENT_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_18_INDEPENDENT_CAPA_CROSS_SCREEN_ACCEPTANCE_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_2_CAPA_CORRECTIVE_REENTRY_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_3_CAPA_CROSS_SCREEN_REAUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_4_DURABLE_CAPA_IDEMPOTENCY_DESIGN.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_5_DURABLE_CAPA_OPERATION_IMPLEMENTATION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_6_INDEPENDENT_DURABLE_CAPA_IDEMPOTENCY_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_7_OPERATION_IDENTITY_AND_COMMITTED_RECOVERY_CORRECTION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_8_INDEPENDENT_OPERATION_RECOVERY_ACCEPTANCE_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_5_9_PRESENTATION_ACKNOWLEDGEMENT_AND_UUID_CORRECTION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_7_2_6_REMAINING_SCOPE_AND_ROADMAP_DISCOVERY.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_1_NOTIFICATION_BADGE_FAILURE_DIAGNOSTIC.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_2_WORKSPACE_UNREAD_BADGE_RACE_CORRECTION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_3_WORKSPACE_BADGE_INDEPENDENT_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_4_STALE_FAILURE_REGRESSION_TEST_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_5_FINAL_WORKSPACE_BADGE_ACCEPTANCE_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_READINESS_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_1_SHARED_RTL_INDEPENDENT_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_2B_LOCKFILE_HASH_PROVENANCE_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_2C_RTL_TEST_COMPLETION_AND_SUITE_DIAGNOSTIC.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_2_RTL_TEST_COMPLETION_AND_SUITE_DIAGNOSTIC.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_SHARED_RTL_LAYOUT_DIRECTION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_0_RTL_SCREEN_INVENTORY_AND_MIGRATION_PLAN.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_10_DECLARATION_DETAILS_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_11A_LOCKFILE_PROVENANCE_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_11B_GIT_INDEX_FORENSICS_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_11_OH_QUEUE_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_12_OH_DETAIL_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_13_ADMIN_REVIEW_QUEUE_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_14_ADMIN_REVIEW_ACTION_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_15_CORRECTION_RESPONSE_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16A_NOTIFICATION_CENTRE_VERIFICATION_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16B_NOTIFICATION_BADGE_ROOT_CAUSE_INVESTIGATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16C_INSTRUMENTED_BADGE_DIAGNOSIS.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16D_EXTENDED_TIMEOUT_DIAGNOSIS.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16E_BLURRED_IDENTITY_REFOCUS_REGRESSION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16F_STALE_FOCUS_PRODUCTION_CORRECTION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16G_POST_CORRECTION_BADGE_INTERMITTENCY_VERIFICATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16_NOTIFICATION_CENTRE_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_17_REMAINING_RTL_INVENTORY_RECONCILIATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_18_SUBMISSION_CONFIRMATION_RTL_MIGRATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_19_CREATE_COORDINATION_RTL_READINESS_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_1_AES_BUTTON_RTL_MIGRATION_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_20_CREATE_COORDINATION_TEST_PREREQUISITES.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_21_CREATE_COORDINATION_SYNCHRONOUS_SUBMISSION_GUARD.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_22_CREATE_COORDINATION_RTL_MIGRATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_23_RTL_INVENTORY_RECONCILIATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_24_OH_FOLLOWUP_EVENT_RTL_READINESS_AUDIT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_25_OH_FOLLOWUP_EVENT_TEST_HARDENING.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_26_OH_FOLLOWUP_EVENT_RTL_MIGRATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_27_DECLARATION_COORDINATION_STATUS_RTL.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_28_SURVEILLANCE_PREVENTION_RTL_IMPLEMENTATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_29_SHARED_RTL_RECONCILIATION.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_2_SPLASH_LANGUAGE_SELECTION_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_3_WELCOME_DISCLAIMER_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_4_DEMO_PICKER_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_5_WORKSPACE_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_6_PROFILE_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_7_HELP_GLOSSARY_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_8_DECLARATION_FORM_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_9_DECLARATION_LIST_RTL_REPORT.md
? docs/AES_GUARDIAN_PHASE2E2B_CURRENT_BUILD_NAVIGATION_BASELINE.md
? docs/AES_GUARDIAN_PHASE2E2C_FRESH_ANDROID_BUNDLE_VALIDATION.md
? docs/AES_GUARDIAN_PHASE2E2D_ANDROID_DEX_DUPLICATE_REPAIR.md
? docs/AES_GUARDIAN_PHASE2E2_NATIVE_26_SCREEN_RTL_VALIDATION.md
? docs/AES_GUARDIAN_PHASE2E2_NATIVE_ANDROID_RTL_VALIDATION.md
? docs/AES_GUARDIAN_PHASE2E3A_RTL_DASHBOARD_REPAIR.md
? docs/AES_GUARDIAN_PHASE2E3B_NATIVE_HEADER_DASHBOARD_RECOVERY.md
? docs/SANAD_46_SCREEN_REDESIGN_TRACKER.md
? docs/SANAD_COMPLETE_UI_UX_IMPLEMENTATION.md
? docs/SANAD_PHASE2E10_BILINGUAL_TYPOGRAPHY_FOUNDATION.md
? docs/SANAD_PHASE2E11_NATIVE_ACCEPTANCE.md
? docs/SANAD_PHASE2E4_GLOBAL_TYPOGRAPHY_WELCOME_ENTRY_REDESIGN.md
? docs/SANAD_PHASE2E5_GLOBAL_TYPOGRAPHY_HUGHEICONS_MIGRATION.md
? docs/SANAD_PHASE2E6_NATIVE_STABILIZATION_UI_KITTEN_VERIFICATION.md
? docs/SANAD_PHASE2E7A_UI_KITTEN_RECONCILIATION.md
? docs/SANAD_PHASE2E7B_UI_KITTEN_PROVIDER_FOUNDATION.md
? docs/SANAD_PHASE2E8_UI_UX_AUDIT_AND_MIGRATION_BLUEPRINT.md
? docs/SANAD_PHASE2E9_DECLARATION_LIST_MIGRATION.md
? eslint.config.js
? evidence/native-visual-20261123T105645+0100/01_initial.png
? jest.setup.js
? skills-lock.json
? src/components/AppIcon.tsx
? src/components/AppText.tsx
? src/components/AppTextInput.tsx
? src/components/__tests__/AppIcon.test.tsx
? src/core/database/__tests__/capa-operation-entropy.test.ts
? src/core/database/__tests__/capa-operation-idempotency.test.ts
? src/core/database/__tests__/migration9.test.ts
? src/core/database/capa-operation-utils.ts
? src/features/aes-guardian/__tests__/declaration-coordination-status.test.tsx
? src/features/aes-guardian/__tests__/declaration-list-migration.test.tsx
? src/features/aes-guardian/__tests__/prevention-date-format.test.ts
? src/features/aes-guardian/__tests__/theme-aware-components.test.tsx
? src/features/aes-guardian/__tests__/workspace-screen.test.tsx
? src/features/aes-guardian/prevention-date-format.ts
? src/features/authentication/__tests__/entry-experience.test.tsx
? src/features/authentication/screens/AccessScreen.tsx
? src/features/authentication/screens/__tests__/AuthGateScreen.test.tsx
? src/features/authentication/screens/__tests__/AuthScreens.test.tsx
? src/features/monitoring/__tests__/monitoring-intro.test.tsx
? src/features/nurse/__tests__/nurse-alerts.test.tsx
? src/features/nurse/__tests__/nurse-dashboard-screen.test.tsx
? src/features/nurse/__tests__/nurse-messages-patient-detail.test.tsx
? src/features/nurse/__tests__/nurse-patients-screen.test.tsx
? src/features/nurse/__tests__/nurse-profile-screen.test.tsx
? src/features/nurse/__tests__/nurse-rules.test.tsx
? src/features/patient/__tests__/patient-profile-messages.test.tsx
? src/features/patient/__tests__/patient-screens.test.tsx
? src/navigation/DirectionalStackBackButton.tsx
? src/navigation/__tests__/DirectionalStackBackButton.test.tsx
? src/theme/SanadUiKittenProvider.tsx
? src/theme/__tests__/SanadUiKittenProvider.test.tsx
? src/theme/__tests__/bilingual-typography.test.tsx
? src/theme/tokens/fontFamilies.ts
```

