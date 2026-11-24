# AES Guardian - Phase 2E.1 Batch 11.2.10

## Declaration Details RTL Migration Report

**Final recommendation: `ACCEPTED — DECLARATION DETAILS VERIFIED AT SOURCE/JEST LEVEL`**

## Repository and Preservation

- Repository root: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- `package-lock.json` SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- No staged changes or commits
- `git diff --check`: exit code `0`

The production target had no pre-existing diff at preflight. The existing `declaration-list-details-batch4.test.tsx` already contained 56 added lines from Batch 11.2.9. Those additions were preserved; this batch added the Declaration Details RTL and restricted-query tests incrementally.

## Exact Route, Production Screen, and Tests

- Route: `declarationDetails`
- Parameter: `{ declarationId: number }`
- Production: `src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx`
- Focused suite: `src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx`
- Related correction-flow suite: `src/features/aes-guardian/__tests__/correction-workflow.test.tsx`

Navigation callers include Declaration List card presses and the existing notification navigation resolver. Those callers and their route parameters were not changed.

## Existing Screen Behavior Inspected and Preserved

The screen loads the declaration by `declarationId` and active `userId`, then loads administrative review history and the applicable OH coordination summary. Existing loading, restricted, missing/unauthorized, and error handling remains unchanged.

The existing five tabs and order remain:

1. Summary
2. Incident
3. Measures
4. Status
5. Follow-up

There is no audit timeline tab. Status review history continues to render the existing repository result in its original array order; no sort, projection, or event processing was added or changed.

Draft editing, correction response, administrative review, and coordination actions retain their original conditions, routes, parameters, and callbacks. Status badge semantics and lifecycle values are unchanged.

## Role and Privacy Findings

The screen’s existing `PERMITTED_ROLES` remains `exposed_professional` and `admin_reviewer`. The repository independently enforces ownership and role authorization; the UI restriction is not treated as an authorization boundary.

- **Exposed professional:** repository lookup remains scoped to the requesting user. The follow-up tab continues to expose only the existing safe coordination fields and excludes reason, staff IDs, events, and clinical information.
- **Admin reviewer:** existing administrative projection remains limited to status, coordination reason, and dates; staff IDs and follow-up event details remain excluded.
- **OH professional:** direct declaration retrieval is explicitly prohibited by `getDeclarationById`; the domain error directs access through authorized OH coordination. The separate OH coordination routes/screens remain unchanged.
- **Quality staff:** direct identifiable declaration retrieval is prohibited by the repository and this screen remains restricted.
- **Technical admin:** direct clinical declaration retrieval is prohibited by the repository and this screen remains restricted.

The existing tests cover exposed-owner visibility, admin presentation, restricted roles, missing/foreign records, minimized follow-up projections, and role-specific actions. A new test confirms OH, quality, and technical roles do not trigger declaration, review-history, or coordination data requests from this screen.

## RTL Changes

The screen uses the existing shared `useLayoutDirection()`, `getLayoutRowDirection()`, and `getLayoutTextAlign()` APIs. The existing `AesScreenHeader`, `AesStatusBadge`, `AesCard`, and navigation components remain in use.

- Header back navigation and title layout continue to use the shared `AesScreenHeader`.
- The five-tab horizontal strip follows shared row direction without changing `TAB_KEYS` order or tab identity.
- Summary reference/status row, current-status rows, review date/status rows, and follow-up status rows mirror with shared row direction.
- Labels, prose values, correction banners, and review comments use shared text alignment.
- Reference, department code, and date values remain LTR-aligned where appropriate.
- Reference spacing changed from physical `marginRight` to logical `marginEnd`.
- Centered restricted, loading, missing, and empty states remain centered.
- No new directional icons or controls were introduced.

## FR/EN/AR Test Evidence

| Element | FR | EN | AR |
| --- | --- | --- | --- |
| Shared header row | row | row | row-reverse |
| Tab strip | row | row | row-reverse |
| Summary reference/status row | row | row | row-reverse |
| Status label/badge row | row | row | row-reverse |
| Header alignment | LTR | LTR | RTL |
| Prose values and labels | left | left | right |
| Reference/date/department code values | left-aligned | left-aligned | left-aligned |

The new locale-switching test confirms the same declaration remains rendered, the selected tab remains selected across FR/EN/AR changes, status state remains stable, and the same actions/data remain available. Existing tests continue to verify all five tabs, no timeline tab, declaration ID lookup, missing/foreign record handling, correction/review navigation, and role-specific content.

## Verification Results

Focused Declaration Details suite:

- Command: `npm test -- --runInBand src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx`
- Final exit code: `0`
- 1 suite passed; 36 tests passed
- The first focused run exposed a test-query ambiguity: the restricted label appears in both the shared header and state body. The test now accepts both existing render locations; no application assertion or production behavior was weakened. The rerun passed.

Declaration and correction workflow suites:

- Command: `npm test -- --runInBand src/features/aes-guardian/__tests__/declaration-workflow.test.tsx src/features/aes-guardian/__tests__/correction-workflow.test.tsx`
- Exit code: `0`
- 2 suites passed; 32 tests passed

Full Jest suite:

- Command: `npm test -- --runInBand`
- Exit code: `0`
- 56 suites passed; 1229 tests passed; 0 snapshots
- Time: `115.874 s`
- The notification-centre suite passed in this run; that does not independently resolve its historically reported intermittent concern.

TypeScript:

- Command: `npx tsc --noEmit --pretty false`
- Exit code: `2`
- 769 diagnostics, matching the inherited SANAD baseline
- No diagnostic referenced `DeclarationDetailsScreen.tsx` or `declaration-list-details-batch4.test.tsx`.

Diff validation:

- Command: `git diff --check`
- Exit code: `0`

## Changed Files and Local-Only Compliance

Changed by this batch:

- `src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx`
- `src/features/aes-guardian/__tests__/declaration-list-details-batch4.test.tsx`
- `docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_10_DECLARATION_DETAILS_RTL_REPORT.md`

No query, role projection, permission, navigation, workflow, audit, notification, database, schema, dependency, lockfile, or native configuration was changed. No remote operation, staging, commit, branch change, destructive Git operation, dependency installation, emulator, or physical-device action occurred.

## Source-Level and Native Limitations

The assertions establish JavaScript/source-level RTL direction and workflow preservation. They do not establish native Android horizontal-scroll initial positioning, physical-device rendering, TalkBack traversal, or large-font behavior. Those remain for a later native validation phase.
