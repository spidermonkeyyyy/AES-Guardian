# AES Guardian - Phase 2E.1 Batch 11.0.5

## Final Independent Workspace Badge Acceptance Audit

**Acceptance decision: `ACCEPTED - WORKSPACE BADGE SOURCE/TEST CORRECTION CLOSED`**

## Repository and Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `59DA2C875354DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No staged changes were present.
- The 11.0.4 report and test-only addition remain present.
- No remote operation or repository publication occurred.

## Accumulated-Change Boundary

Batch 11.0.2 added the workspace request guard in `AesGuardianWorkspaceScreen.tsx`. Batch 11.0.4 added the stale-failure test in the notification-centre test file. The final audit did not attribute unrelated accumulated working-tree modifications to this badge correction.

Relevant accumulated changes:

- `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`
- `src/features/aes-guardian/__tests__/notification-centre.test.tsx`

The workspace diff retains the existing request guard and badge rendering. The test diff retains the deferred-promise helper and five pre-existing race tests.

## Source Audit

The workspace guard allocates a monotonically increasing `unreadRefreshVersion` for each role-stat/load refresh. It captures the initiating role, user ID, and focused state, then validates all four conditions at publication time:

1. request version is still current;
2. the workspace remains focused;
3. active role matches the initiating role;
4. active user ID matches the initiating user ID.

The stale success and stale failure branches do not publish a count. The failure branch is non-critical and preserves the last valid count for the active context. A `tech_admin` transition publishes count zero only after the current request and focus/context checks pass.

Current positive counts publish normally. Current zero counts publish through the tech-admin/non-active branch and existing badge rendering hides the badge for zero. Identity, role, focus-loss, focus-regain, and stale-result tests provide source/test coverage for invalidation.

No notification repository, SQL, migration, event type, recipient, CAPA transaction, or notification API behavior is changed by the workspace guard diff.

## Stale-Failure Regression

Test:

`older unread-count rejection cannot disturb a newer resolved badge`

Confirmed implementation ordering:

1. Request A is created and left pending.
2. Focus loss/regain starts distinct request B.
3. The test waits until the unread-count call count is exactly two.
4. B resolves with count `4`.
5. The test waits for `workspace-unread-badge` and asserts visible text `4`.
6. A rejects only after that visible assertion.
7. The test asserts `4` remains visible.
8. The test asserts the call count remains two.
9. The test asserts no alert and no navigation occurs.

The test would fail if stale rejection cleared or replaced the newer badge, added an unexpected refresh, surfaced an alert, or navigated.

Loading-state reset is not exposed directly by this test, but stale rejection does not enter `handleRefresh` and the source catch path contains no loading or refresh-state mutation. The call-count, badge, alert, and navigation assertions cover observable stale-failure effects.

## Preserved Pre-Existing Tests

The existing deferred-promise helper and these five race tests remain intact:

- `older unread-count request cannot overwrite a newer resolved count`
- `identity switch prevents older user result from publishing`
- `tech_admin switch invalidates older badge request`
- `focus loss and regain invalidates older request`
- `failed current request does not publish a fabricated count`

## Verification

Focused command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`

- Exit code: `0`
- Test suites: `1 passed, 1 total`
- Tests: `44 passed, 44 total`
- Snapshots: `0`
- Time: `11.286 s`
- The stale-failure regression passed in `69 ms`.

Full command:

`npm test -- --runInBand`

- Exit code: `0`
- Test suites: `56 passed, 56 total`
- Tests: `1212 passed, 1212 total`
- Snapshots: `0`
- Time: `120.073 s`

No outcome differed from Batch 11.0.4's reported totals.

Diff command:

`git diff --check`

- Exit code: `0`
- No whitespace errors.

## Acceptance Boundary

The correction is accepted at source and Jest test level. It does not establish native-device behavior, native SQLite bridge behavior, physical process-restart behavior, or genuine multi-connection production concurrency.

No production files were changed during Batch 11.0.5. The workspace implementation and other accumulated work remain existing local working-tree modifications.
