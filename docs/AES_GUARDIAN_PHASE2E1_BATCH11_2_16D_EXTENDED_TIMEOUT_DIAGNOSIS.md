# AES Guardian — Phase 2E.1 Batch 11.2.16D

## Executive recommendation

**NOT REPRODUCED — EVIDENCE INSUFFICIENT**

With `--testTimeout=15000`, the exact target test and three sequential focused-file runs all completed successfully. In every target sequence, the post-bulk unread query returned zero, every publication guard matched, the zero setter was reached, and the badge-removal assertion passed. This does not resolve or explain the historical Batch 11.2.16A assertion failure.

The extended-timeout results support the view that the Batch 11.2.16C test-level timeout was truncating an otherwise successful instrumented run: that run reported 5082 ms against Jest's default 5000 ms, while the exact 11.2.16D instrumented test completed in 5386 ms under the 15000 ms limit. This explains the 11.2.16C timeout, not the earlier badge-removal failure.

## Scope and diagnostic instrumentation

Only temporary lifecycle diagnostics were added to `AesGuardianWorkspaceScreen.tsx`, following the 11.2.16C event set: request start/ID/trigger, captured version and identity/focus, role-statistics start/completion/failure, unread-query start/result/error, guard inputs/outcomes, setter calls, and focus invalidations.

No behavior, query argument, state value, guard condition, dependency array, rendering condition, test, fixture, configuration, or dependency was changed. The instrumentation added synchronous `console.log` calls and diagnostic trigger arguments. Synchronous logging may affect timing; the longer Jest timeout does not eliminate that limitation.

All complete, unfiltered stdout/stderr logs are outside the repository:

- Exact run: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16d-A-exact.log`
- Focused run 1: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16d-B-focused-1.log`
- Focused run 2: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16d-C-focused-2.log`
- Focused run 3: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16d-D-focused-3.log`

## Preservation preflight

Verified before editing:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Staged paths: none
- Complete initial `git status --short`: 107 lines, captured outside the repository at `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16d-initial-status.txt`
- Initial status SHA-256: `14101207728c3b9c6adeca47b9cfa443d7d3282fb5e94e96cd479d9bda713c34`

The 11.2.16A, 11.2.16B, and 11.2.16C reports were present and their preflight SHA-256 values were respectively:

- 11.2.16A: `d4cd1f3c9dde3e7a4e759312602045922ead73cd122e4675a0745599bb7c3dd5`
- 11.2.16B: `d39f228d859e65dd33f7092db12ed018b490e093718f73a2789f9d8086957ee6`
- 11.2.16C: `433462a42341cd0c3d886bb655376cff5448895fc4ff51cf6e65458444435cd6`

Before editing, `AesGuardianWorkspaceScreen.tsx` was backed up byte-for-byte outside the repository to:

`C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16d-workspace-original.tsx`

Original size: `38614` bytes. Original SHA-256: `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0`.

The other protected file hashes at preflight were:

- `NotificationCentreScreen.tsx`: `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a`
- `notification-centre.test.tsx`: `e719c69f5f910ceebdfa304ae32ef4fb7a659c6419952ac19c53261186efe006`
- Raw `package-lock.json`: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile Git blob: `e397c195e4e22231204add4fdfafb1ba50219736`

## Execution results

Runs were sequential. On Windows, `npm.cmd` was used to invoke the repository's normal `npm test` script. The Jest timeout was set only on the command line with `--testTimeout=15000`; no timeout configuration or test declaration was edited.

### A — Exact target test

- Command: `npm test -- --runInBand --testTimeout=15000 src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "workspace badge refreshes across single-read, bulk-read, and identity switches"`
- Start: `2026-11-19T19:32:01.9542740+01:00`
- End: `2026-11-19T19:32:14.6476578+01:00`
- Exit code: `0`
- Jest: 1 suite passed; 1 passed, 45 skipped, 46 total; 0 snapshots.
- Target test duration: `5386 ms`; Jest time: `9.59 s`.
- Diagnostic records: `42`; React `act(...)` warning lines: `0`.
- Target assertion: passed; no assertion failure or stack.
- Log SHA-256: `df6ecd2d9a234479a8fd0d5543473972260c6e17efa351db491d303ad470dd7e`

Target zero-count request: `mwnw0dgo-pmkcowcnbbg`, request version `8`. It queried user `1`, returned `0`, and logged `guardVersion=true`, `guardFocus=true`, `guardRole=true`, and `guardUser=true`. The setter was reached with `0`. Subsequent admin and tech-admin refreshes occurred after the badge-removal assertion.

### B — Focused file, run 1

- Command: `npm test -- --runInBand --testTimeout=15000 src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- Start: `2026-11-19T19:32:42.4979655+01:00`
- End: `2026-11-19T19:32:57.6521466+01:00`
- Exit code: `0`
- Jest: 1 suite passed; 46 passed, 0 failed; 0 snapshots. Jest time: `11.792 s`.
- Target duration: `1765 ms`; assertion passed.
- Diagnostic records: `194`; React `act(...)` warning lines: `27`.
- Target zero-count request: `mwnw19z8-mh40zprow9b`, version `8`; count `0`; version, focus, role, and user checks all true; setter reached with `0`.
- Log SHA-256: `a825c44f8c488140fd6fd9a084c173d912a07e2adcc387925fc1a2637f1dda65`

### C — Focused file, run 2

- Command: `npm test -- --runInBand --testTimeout=15000 src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- Start: `2026-11-19T19:32:57.9668327+01:00`
- End: `2026-11-19T19:33:11.4885852+01:00`
- Exit code: `0`
- Jest: 1 suite passed; 46 passed, 0 failed; 0 snapshots. Jest time: `10.79 s`.
- Target duration: `777 ms`; assertion passed.
- Diagnostic records: `194`; React `act(...)` warning lines: `19`.
- Target zero-count request: `mwnw1lm5-ohgw9s9pz0s`, version `8`; count `0`; version, focus, role, and user checks all true; setter reached with `0`.
- Log SHA-256: `b9c056a649cc1ed10d43e5204645ff5c21d28cf3f067a6746a6020b9ce9bb89f`

### D — Focused file, run 3

- Command: `npm test -- --runInBand --testTimeout=15000 src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- Start: `2026-11-19T19:33:11.5491587+01:00`
- End: `2026-11-19T19:33:26.6109732+01:00`
- Exit code: `0`
- Jest: 1 suite passed; 46 passed, 0 failed; 0 snapshots. Jest time: `12.824 s`.
- Target duration: `2299 ms`; assertion passed.
- Diagnostic records: `194`; React `act(...)` warning lines: `39`.
- Target zero-count request: `mwnw1vt7-o7ecbibzgtb`, version `8`; count `0`; version, focus, role, and user checks all true; setter reached with `0`.
- Log SHA-256: `2c9ee9d50cd61c4a4a1653dda08c3ee2ad92af9f51bb3f7d2ce2a9972eb1f31f`

The focused-file logs contain other requests from the existing deferred-request regression tests; their guard rejections and simulated query failures are expected coverage. None of those was a failure of the target test. The diagnostic events for each target's final zero request show a current version and matching focused exposed-user identity. No target query error, stale rejection, or later positive count preceded the badge-removal assertion.

## Comparison with Batch 11.2.16C

In 11.2.16C, the final zero query passed the guard and reached the setter, but the test was reported as exceeding Jest's 5-second default at `5082 ms`. The 11.2.16D exact run recorded the same sequence and completed the target test in `5386 ms` with the explicit 15-second Jest timeout. This is evidence that the earlier **instrumented test timeout** was caused by the default deadline being too short for the diagnostic run.

All four 11.2.16D target runs passed the badge-removal assertion. They do not establish that the 11.2.16A historical assertion failure is fixed or impossible to recur. Its failure-time request/state sequence remains unavailable, so its root cause remains unresolved.

## Separate `isFocused` dependency issue

The original callback still reads `isFocused` while its dependency list remains `[activeRole, activeContext.userId]`. A callback recreated by a role/user change while blurred can retain `isFocused === false`; a later focus effect invokes that callback without recreating it solely for focus, and the captured-focus guard can reject publication. The diagnostic target requests all began focused and passed their guards, so this separate concern is not connected by these traces to the historical badge failure.

The existing five stale-request tests cover old result/rejection order, identity changes during pending requests, tech-admin invalidation, and focus loss/regain without the exact identity-change-while-blurred-then-refocus sequence. A minimal separate regression would keep the workspace mounted while unfocused, switch role/user so the callback is recreated while blurred, refocus, resolve the new user's count request, and assert that the new count publishes. No dependency or test change was made here.

## Restoration and final repository audit

After all permitted runs, `AesGuardianWorkspaceScreen.tsx` was restored by writing the saved backup bytes back to the file, not by using Git:

- Restored byte length: `38614`
- Restored SHA-256: `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0`
- Backup byte length: `38614`
- Backup SHA-256: `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0`
- Byte-for-byte equality: **verified**
- Diagnostic prefix remaining in source: **no**

After restoration, the workspace screen, Notification Centre screen, test, lockfile, and three prior reports matched their preflight hashes. The lockfile raw hash and normalized blob remained `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667` and `e397c195e4e22231204add4fdfafb1ba50219736`, respectively.

Branch, HEAD, committed tree, and index tree were unchanged; there were no staged paths. The complete post-restoration status exactly matched the 107-line preflight status. The only expected repository addition after creating this report is:

`docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16D_EXTENDED_TIMEOUT_DIAGNOSIS.md`

The source backup and all four complete run logs are outside the repository. No existing report, test, configuration, or other source file was modified.
