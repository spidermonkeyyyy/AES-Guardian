# AES Guardian — Phase 2E.1 Batch 11.2.16C

## Executive recommendation

**INTERMITTENCY REPRODUCED — ROOT CAUSE UNDETERMINED**

The original badge-removal assertion failure remains documented by Batch 11.2.16A. In this instrumented run, the zero-count request returned `0`, all four publication checks passed, and the zero setter was reached. The target test then progressed through its identity-switch steps, but Jest failed the overall test due to its 5-second test timeout while diagnostics were enabled. The original assertion failure was not reproduced in this trace; the cause of the earlier failure remains unknown.

The observed timeout is a meaningful execution problem. No focused-file runs were started after it, following the prompt's stop condition. This report does not claim that diagnostics had no timing effect.

## Scope and temporary instrumentation

This batch used temporary, diagnostic-only instrumentation in `AesGuardianWorkspaceScreen.tsx`. It recorded unique request IDs, trigger labels, request versions, role/user/focus captures, role-statistics completion, unread-query start/result, current version and identity, guard outcomes, and setter calls. Focus-effect invalidations and blurred no-request effects were also logged.

The instrumentation did not add awaits, timers, deferred promises, React state, or dependency changes. It did not change request versions, query arguments, guard conditions, state values, error handling intent, or rendering. It did add synchronous `console.log` calls and diagnostic trigger arguments. Because the run exceeded the test timeout, the logging's possible timing impact cannot be dismissed.

The complete unfiltered stdout/stderr log is outside the repository:

`C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16c-A-exact.log`

SHA-256: `f00452557cfa9987d40cf68f0be6f8e0e5f92b5ccf6c70d4c45f5c3deaa7dd0e`

The log contains 42 `[AES_BADGE_DIAG]` records across five request sequences and the focus-effect events. It contains no React `act(...)` warning lines.

## Preservation preflight

Before instrumentation, verified:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Staged paths: none
- Complete initial status: 106 lines, captured outside the repository at `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16c-initial-status.txt`
- Initial status SHA-256: `13d50cd245e59f4f0262382535b768ea5efd66f286a389356144d56b5d45ced3`

The source was copied byte-for-byte before editing to:

`C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16c-workspace-original.tsx`

Original byte length: `38614`; original SHA-256: `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0`.

All preflight identity, status, staging, and four protected-file hash checks matched the prior audited baseline.

## Instrumentation points

Only the unread-count lifecycle in `AesGuardianWorkspaceScreen.tsx` was temporarily instrumented:

- Request start recorded trigger, generated ID, request version, role, user ID, and focus value.
- The role-statistics phase recorded start, completion, or failure.
- The unread query recorded start and returned count.
- Immediately before publication, logs recorded whether version, captured focus, current role, and current user matched.
- The accepted setter and rejected-guard paths were logged.
- The focus effect recorded its version invalidation and focus/identity values; when blurred, it logged that no new refresh was started.

Effect-trigger labels identify the shared mount/focus/identity effect. The event order and role/focus values distinguish the actual transitions in this test; the instrumentation did not add mutable history solely to label each effect cause.

## Reproduction command and result

The exact target test was run first. The Windows `npm.cmd` shim invoked the same npm script and arguments:

- Command: `npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "workspace badge refreshes across single-read, bulk-read, and identity switches"`
- Start: `2026-11-19T19:22:09.7127891+01:00`
- End: `2026-11-19T19:22:35.4137874+01:00`
- Exit code: `1`
- Jest: 1 suite failed; 1 failed, 45 skipped, 46 total; 0 snapshots.
- Jest time: `18.696 s`; target test reported duration: `5082 ms`.
- Target assertion at line 1165: it did **not** fail in this run. The test advanced to both later identity transitions, as shown by their instrumented refreshes.
- Actual failure: `Exceeded timeout of 5000 ms for a test`; stack points to the `test(...)` declaration at line 1061, not to the badge assertion.
- Target test failed overall: **yes, due to timeout**.
- Complete log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16c-A-exact.log`
- Log SHA-256: `f00452557cfa9987d40cf68f0be6f8e0e5f92b5ccf6c70d4c45f5c3deaa7dd0e`

No focused-file runs followed because this timeout was a meaningful execution problem and the stop condition had been reached. The failure is not counted as reproduction of the original `toBeNull()` assertion failure.

## Reconstructed request timeline

The trace order and IDs below are taken from the complete log. Each successful query was followed by `setter-reached`; the log does not show a rejected request or query error.

| Sequence | Request ID | Trigger/state | Query result | Guard at query completion | Publication |
|---|---|---|---:|---|---|
| Initial | `mwnvnxj9-xvj3kqxap9` | Mount effect; v2; exposed professional, user 1, focused | 2 | Version, focus, role, user all matched | Setter reached with 2 |
| After single read | `mwnvnxoj-4sp6iw7abhx` | Focus return; v5; exposed professional, user 1, focused | 1 | Version, focus, role, user all matched | Setter reached with 1 |
| After bulk read | `mwnvnxrh-skzj4az0n6c` | Focus return; v8; exposed professional, user 1, focused | **0** | **Version, focus, role, user all matched** | **Setter reached with 0** |
| Admin switch | `mwnvnzf2-cgah7vfmje9` | Identity-effect refresh; v10; admin reviewer, user 2, focused | 1 | Version, focus, role, user all matched | Setter reached with 1 |
| Tech-admin switch | `mwnvnzh5-egbi5nw6umt` | Identity-effect refresh; v12; tech admin, user 5, focused | No unread query by design | Focused/current request | Setter reached with 0 |

Focus invalidations were logged at versions `1` (initial mount), `3` (blur), `4` (focus), `6` (blur), `7` (focus), `9` (admin identity), and `11` (tech-admin identity). Both blur events invalidated the previous version and started no request. No unread request was shown completing after a later focus invalidation. All three exposed-user queries completed with their expected database counts.

For the final zero-count request specifically:

1. A focused workspace refresh started after the bulk-read mutation.
2. Its unread-count query executed for synthetic user `1`.
3. The query returned `0`.
4. Request version `8` was still current.
5. Captured focus was true; the immediately preceding focus-effect event also showed focused true, with no transition before completion.
6. Current role was `exposed_professional`; current user ID was `1`; both matched the request.
7. No guard condition rejected the request.
8. `setUnreadNotificationCount(0)` was reached.
9. Later identity requests published the admin count and tech-admin zero.
10. The event sequence therefore does **not** explain the earlier badge remaining rendered. The test's continuation into both identity transitions indicates that its final badge-removal wait resolved before the later timeout.

The setter log proves the setter call was reached, not by itself the React commit. In this run the test proceeded past the badge-removal wait and into later role changes, which is additional evidence that the zero state was rendered.

## Separate `isFocused` dependency assessment

`loadRoleStats` reads `isFocused`, but its `useCallback` dependencies remain `[activeRole, activeContext.userId]`. A callback can therefore retain its captured focus value across focus changes. The focus effect increments the request version on focus changes, but a focus-only transition does not recreate the callback because `isFocused` is omitted from its dependencies.

In the specific ordering that could expose this concern, a role/user change while blurred recreates the callback with focus captured as false; a later focus effect invokes that callback, which can start a request but fail the captured-focus publication check. The diagnostic test path did not exercise that ordering: every logged request started focused and retained a true focus capture. This concern is not connected by the captured evidence to the historical zero-badge failure.

The five existing stale-request tests cover old result/rejection ordering, identity changes while requests are pending, `tech_admin` invalidation, and focus loss/regain without the exact “identity change while blurred, then refocus” sequence. A minimal separate regression should keep the workspace mounted while unfocused, change role/user so the callback is recreated, refocus, resolve the new user's unread-count query, and assert that the new count is published rather than the previous user's count. No such test or correction was added here.

## Root-cause conclusion and confidence

The original intermittent `toBeNull()` failure was previously captured in 11.2.16A. Batch 11.2.16B then passed the exact test independently and the focused file five times. This instrumented run did not reproduce that assertion failure; instead, the test exceeded its 5-second Jest timeout with logging enabled.

The captured final-refresh sequence provides strong evidence that, in this run, mutation visibility, zero query result, version guard, focus capture, role/user identity, and setter invocation all behaved as expected. It does not establish what occurred in the prior failing execution. The synchronous diagnostics may have affected timing, and the run did not complete successfully. Root cause remains undetermined; confidence in any specific explanation is low.

## Restoration and final preservation

After the run, the source was restored with a byte-level file write from the saved copy, not a Git restoration command:

- Restored source bytes: `38614`
- Restored source SHA-256: `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0`
- Backup bytes: `38614`
- Backup SHA-256: `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0`
- Byte-exact match: **yes**
- `[AES_BADGE_DIAG]` remaining in production source: **no**

After restoration, the protected hashes matched their preflight values:

| File | Final SHA-256 |
|---|---|
| `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx` | `87933c4de8bc63f7df886dd0ee9028d322c593cecdf283ad6684f091c99946b0` |
| `src/features/aes-guardian/screens/NotificationCentreScreen.tsx` | `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a` |
| `src/features/aes-guardian/__tests__/notification-centre.test.tsx` | `e719c69f5f910ceebdfa304ae32ef4fb7a659c6419952ac19c53261186efe006` |
| `package-lock.json` raw SHA-256 | `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667` |

The normalized lockfile Git blob remains `e397c195e4e22231204add4fdfafb1ba50219736`. After restoration, the complete status matched the 106-line initial status exactly; no staged paths existed. The final expected repository delta is only this report:

`docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_16C_INSTRUMENTED_BADGE_DIAGNOSIS.md`

The original source backup and all diagnostic logs are outside the repository. No existing report or test was changed.

