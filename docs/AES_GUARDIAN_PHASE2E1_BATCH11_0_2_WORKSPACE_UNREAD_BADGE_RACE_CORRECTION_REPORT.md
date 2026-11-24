# AES Guardian — Phase 2E.1 Batch 11.0.2
## Workspace Unread Badge Stale-Refresh Race Correction

## Final status

**IMPLEMENTATION COMPLETE — READY FOR INDEPENDENT RE-AUDIT**

## Repository identity

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- `package-lock.json` SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No commit, staging, reset, remote operation or lockfile change occurred.

## Root cause

`AesGuardianWorkspaceScreen.loadRoleStats()` performed an unread-count query and
published `setUnreadNotificationCount(count)` without invalidating stale responses.

Consequences:

- focus regain could publish a count from an older refresh;
- role/user switch could publish a result for the initiating context;
- tech-admin switch could leave a stale positive badge;
- an older failure or older success could disturb the newest badge state.

Notification repository semantics were not defective:

- unread count uses recipient-scoped SQL;
- single-read and bulk-read mutate only the authorized recipient;
- tech_admin returns zero.

## Production correction

`src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`

Added:

- `unreadRefreshVersion` ref;
- request identity capture for role and user ID;
- request identity capture for focus state;
- monotonic request invalidation in effect/focus transitions;
- stale-result guard before badge publication;
- tech-admin count reset guard.

The unread-count path now publishes only when:

1. the request version is still current;
2. the workspace is still focused;
3. active role matches the initiating role;
4. active user ID matches the initiating user ID.

Other role-stat refreshes remain unchanged.

## Deterministic regression tests

Added in:

`src/features/aes-guardian/__tests__/notification-centre.test.tsx`

Covered scenarios:

- older unread-count request resolves after a newer count;
- user identity switch rejects an older user result;
- tech-admin switch invalidates an older badge request;
- focus loss/regain invalidates an older request;
- current request failure does not publish a fabricated count.

The tests use deferred promises and repository spies rather than timing-only waits.

## Full verification

Focused suite:

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`

- Exit: `0`
- 1 suite passed
- 43 tests passed

Complete Jest suite:

`npm test -- --runInBand`

- Exit: `0`
- 56 suites passed
- 1,211 tests passed

TypeScript:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- 769 inherited SANAD diagnostics
- 0 changed-file diagnostics

Lint:

`npm run lint`

- Exit: `2`
- missing ESLint flat configuration

Diff:

`git diff --check`

- Exit: `0`

## Scope preservation

No change was made to:

- notification SQL;
- notification event types;
- recipient rules;
- mark-read APIs;
- bulk-read APIs;
- notification schema;
- CAPA transactions;
- role permissions.

Native runtime behavior was not tested.

## Final repository state

Changed source/test files:

- `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`
- `src/features/aes-guardian/__tests__/notification-centre.test.tsx`

Pre-existing work and reports remain unchanged.
