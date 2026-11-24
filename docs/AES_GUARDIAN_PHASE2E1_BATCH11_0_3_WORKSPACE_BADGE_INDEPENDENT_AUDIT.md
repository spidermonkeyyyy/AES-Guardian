# AES Guardian — Phase 2E.1 Batch 11.0.3
## Independent Workspace Unread Badge Race Correction Audit

## Final recommendation

**CONDITIONALLY ACCEPTED — SOURCE-LEVEL CORRECTION VERIFIED**

The stale unread-count guard in
`AesGuardianWorkspaceScreen.loadRoleStats()` prevents obsolete requests from
publishing role/user/focus mismatched badge counts.

The correction is source-correct for:

- older success resolving after newer success;
- identity switch;
- role switch;
- tech-admin transition;
- focus loss/regain;
- stale failure state, as supported by the guard;
- normal positive/zero counts.

The remaining test gap is an independent stale-failure scenario: the suite does
not directly assert that an older rejected unread-count request cannot disturb
newer successful state.

## Repository state

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No source/test/migration/configuration change was made by this audit.

## Source audit

### Request identity

`loadRoleStats()` now creates:

- monotonically increasing `unreadRefreshVersion`;
- initiating role;
- initiating user ID;
- initiating focus state.

The unread-count branch publishes only if:

- request version is still current;
- initiating focus is still true;
- active role matches initiating role;
- active user ID matches initiating user ID.

The effect increments the request version before focus effects run.

### Role/user/focus invalidation

`activeRole`, `activeContext.userId`, and `isFocused` are captured or compared.
An identity or role switch invalidates the old request.
A focus loss invalidates the old request even before focus returns.

### Failure state

On rejection, the code only preserves state when the request remains current and
context/focus still match. An older failure has no publication branch.
This also blocks stale failures from disturbing newer successful state.

### Repository unread count

`getUnreadNotificationCount()` performs recipient-scoped SQL:

`WHERE recipient_user_id = ? AND is_read = 0`

It returns zero for missing/tech-admin users.

## Test evidence

The focused suite now contains:

- older success resolves last;
- identity switch;
- tech-admin switch;
- focus loss/regain;
- failed current request.

The same suite also contains an existing full lifecycle test for single-read,
bulk-read and identity switches.

No dedicated stale-failure test was found.

## Scenario verdict

| Scenario | Verdict |
|---|---|
| Older success resolves last | PASS |
| Identity switch | PASS |
| Role switch | PASS |
| Tech-admin transition | PASS |
| Focus loss/regain | PASS |
| Current failure | PASS |
| Stale failure after newer success | TEST GAP |
| Normal zero/positive count | PASS |
| Single/bulk read behavior | PASS |

## Verification

### Focused suite

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`

- Exit: `0`
- 43 tests passed

### Full suite

`npm test -- --runInBand`

- Exit: `0`
- 56 suites passed
- 1,211 tests passed

### Diff

`git diff --check`

- Exit: `0`

## Native limitations

No native bridge, process-restart or genuine multi-connection concurrency evidence
was produced.

## Findings

### MINOR — stale-failure test gap

The stale-failure scenario is source-guarded but not independently tested.

### INFORMATIONAL — native validation gap

Native focus, role, or SQLite timing behavior remains unverified.

## Final repository state

HEAD, committed tree and lockfile remain unchanged.

No source/test modification was made by this audit.

## Final decision

**CONDITIONALLY ACCEPTED — BOUNDED TEST GAP**

The stale-response guard is source-correct and directly verified across success,
identity, role, focus and current-failure scenarios. A stale-failure test should
be added before unconditional acceptance.
