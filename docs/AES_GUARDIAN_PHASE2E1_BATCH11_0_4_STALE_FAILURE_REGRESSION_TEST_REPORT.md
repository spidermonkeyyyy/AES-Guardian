# AES Guardian — Phase 2E.1 Batch 11.0.4

## Stale Unread-Count Failure Regression Test Report

**Final recommendation: `TEST GAP CLOSED — READY FOR FINAL RE-AUDIT`**

## Pre-Edit Preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Initial test-file SHA-256:
  `E28BC360B76BAB5F0D0174F729674E1BAD02672691DC9284107223A1B5F69825`
- The authorized test file was already tracked and modified unstaged before this phase.
- Initial test-file diff: 160 insertions and 1 deletion.
- Existing additions preserved included:
  - `createDeferred<T>()`
  - `older unread-count request cannot overwrite a newer resolved count`
  - `identity switch prevents older user result from publishing`
  - `tech_admin switch invalidates older badge request`
  - `focus loss and regain invalidates older request`
  - `failed current request does not publish a fabricated count`
- The existing newer-resolved-count tests rejected success but did not directly reject an older pending request after a newer request had become visible.

## Added Deterministic Regression

Exact test name:

`older unread-count rejection cannot disturb a newer resolved badge`

The test:

1. Sets `exposed_professional` as the active valid non-tech-admin role.
2. Starts request A and leaves its deferred promise pending.
3. Causes focus loss and regain to invalidate A and start request B.
4. Waits until exactly two unread-count calls have occurred.
5. Resolves B with count `4`.
6. Waits for the `workspace-unread-badge` test ID and verifies visible text `4`.
7. Rejects A afterward with a controlled stale-read error.
8. Verifies `4` remains visible.
9. Verifies no additional unread-count call occurs.
10. Verifies no alert or navigation occurs.

This ordering proves that B completed and became visible before A rejected.

## Verification Results

### Focused notification-centre suite

Command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`

Result:

- `1` suite passed
- `45` tests passed
- `0` snapshots
- New stale-failure regression passed

### Full Jest suite

Command:

`npm test -- --runInBand`

Result:

- `56` suites passed
- `1246` tests passed
- `0` snapshots

### Diff validation

Command:

`git diff --check`

Result: exit code `0`; no whitespace errors.

## Preservation and Repository State

- Final test-file SHA-256:
  `292A62E849D7FDB6D5CCDF260F421D295B3D045235734A00B15A89D9B399AAD9`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile:
  `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\package-lock.json`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No production source file was changed by this phase. The workspace implementation and 20 other tracked files were already modified before this phase and remain in the accumulated working tree; this phase added only the one authorized regression test and this report.

## Exact Changed Files for This Phase

- Added to existing file:
  `src/features/aes-guardian/__tests__/notification-centre.test.tsx`
- Added report:
  `docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_4_STALE_FAILURE_REGRESSION_TEST_REPORT.md`

No files were staged or committed. No remote operations, fetches, pulls, pushes, merges, installs, emulator launches, or production-source edits occurred.
