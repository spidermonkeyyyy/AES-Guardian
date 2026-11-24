# AES Guardian - Phase 2E.1 Batch 11.2.19

## 1. Executive recommendation

**CONDITIONALLY READY - TEST PREREQUISITE REQUIRED**

`CreateCoordinationScreen.tsx` has sufficiently clear authorization, repository and presentation boundaries for a future presentation-only RTL migration. Shared `AesScreenHeader`, `AesOptionCard` and `AesButton` cover much of the screen. The screen itself has no layout-direction hook, but it has no legacy `isRTL` branch or physical left/right border and only limited screen-owned text/row assumptions.

Readiness is conditional rather than final because the existing create-coordination suite does not directly assert FR/EN/AR layout, loading/disabled behavior, exact payload fields or generic repository failure. It does cover admin access, role denial, duplicate active coordination, success navigation and a repository duplicate error. The minimum RTL prerequisite is direct rendered assertions plus a bounded synchronization assertion for repeated submission and exact payload before a migration is accepted.

No source, test or navigation change was made in this batch.

## 2. Repository preservation evidence

Verified before audit:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Initial status entries: 114
- Initial status capture: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-19-initial-status.txt`
- Initial status SHA-256: `d9d1f44ce30d1700340a095a06e5ac9b0d3b8bdca800c57b92dec9a391b6818b`
- Raw lockfile SHA-256: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile Git blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Target hashes:

| File | SHA-256 |
|---|---|
| `CreateCoordinationScreen.tsx` | `3d1241bb11d964600aaa85a0f95768eb9e2f4037fb26340f26b76c7101b3aee4` |
| `oh-coordination-batch6-acceptance.test.tsx` | `ee5b02ba6ec5a2001f5d0bcd35c9a4c98ec7b9ae4867272b6ff8609edcf6921b` |

No source or test change was made.

## 3. Route and caller map

Route contract:

- Route name: `createCoordination`
- Parameter: `{ declarationId: number }`
- Registration: `src/navigation/AppNavigator.tsx`
- Route is registered in the authenticated/nurse, admin, patient and fallback authenticated stacks with `headerShown: true`; it is not registered in unauthenticated/fallback auth branches.

Callers:

- `DeclarationDetailsScreen.tsx`
- Exact navigation: `navigation.navigate('createCoordination', { declarationId: declaration.id })`
- Visible from the declaration detail admin-reviewer action row only when `canAdminReview` is true.
- The existing `declaration-list-details-batch4.test.tsx` test asserts this exact navigation parameter.

Alternate access:

- No notification caller was found.
- No shortcut, deep-link helper or direct `replace('createCoordination')` caller was found.
- `AppNavigator.tsx` permits route registration under authenticated branches, but the screen itself is the UI authorization boundary.
- Direct navigation while unauthenticated or with the wrong role would route to the screen, which then renders the unauthorized state.

No route-level `canCoordinate` guard is present. Authorization is inside the screen and independently enforced again by `AesGuardianDatabase.createOhCoordination`.

## 4. Screen-owned RTL inventory

| Element | Current implementation | Shared RTL-aware component/API | Direction-sensitive? | Proposed presentation-only correction | Existing coverage |
|---|---|---|---|---|---|
| Header/back affordance | `AesScreenHeader` with title/subtitle and `onBack` | Yes: shared direction hook, row helper, text align and mirrored chevron | Yes | No correction in screen; preserve and test shared header | Header behavior covered elsewhere, but create-screen direct FR/EN/AR header assertions are absent |
| Declaration context | Header subtitle is `Décl. #${declarationId}` | `AesScreenHeader` applies shared text alignment | Yes for Arabic text alignment | Ensure subtitle remains right aligned in Arabic and number remains LTR | Route and declaration ID are rendered; direct locale assertion absent |
| Title | Passed to shared header | `AesScreenHeader` | Yes | No screen-owned correction; shared title behavior | French content only in create tests |
| Prototype disclaimer card | `View` + plain `Text` title/body, no direction hook | Not wrapped in RTL-aware prose component | Yes | Add shared `getLayoutTextAlign` to title/body and logical card spacing if needed | Test ID exists, no locale/layout assertions |
| Reason section label | Plain text with fixed style | No; screen-owned | Yes | Use shared text align | Rendered in French, no RTL assertion |
| Reason options | `AesOptionCard` list in a vertical `View` | Yes: cards use shared layout direction and RTL `row-reverse` | Yes | No card redesign; assert rendered card order/indicator/title alignment | Option test IDs and selection are covered; direct FR/EN/AR card assertions are absent |
| Clinical notice | Plain text in a card | No; screen-owned | Yes | Use shared text align | Test ID exists, no locale/layout assertions |
| Submit/action row | `AesButton`, text-only primary button in a bottom vertical container | Button base/content rows are fixed row, but text is centered and no icon is used | Low for this screen | No correction needed unless button icon or semantic row is later added | Loading/disabled behavior exists in source, with no direct RTL or state assertion |
| Loading state | `AesButton loading={submitting}` and `disabled={submitting}` | Yes, through `AesButton` | Low | Preserve loading/disabled semantics | No loading-state assertion found |
| Failure state | Native `Alert.alert` title/body plus preserved form state | Native alert direction out of scope | Yes for alert/native rendering | Presentation migration should not change alert text or callback | Duplicate repository error covered; generic failure not directly covered |
| Success state | Native success alert and OK callback invokes `navigation.goBack()` | Native alert direction out of scope | Yes for alert/native rendering | Preserve | Success alert and goBack covered |
| Unauthorized state | Shared header plus plain centered title/text in a card | Header is shared; unauthorized text is screen-owned | Yes | Add shared text align if text should follow locale; title/text may remain intentionally centered | Other-role denial covered; direct locale/layout assertion absent |
| Fixed spacing/borders | `paddingHorizontal`, `padding`, `marginBottom`, borderWidth on cards | Symmetric physical spacing, no directional hot spot | Low | No required change except logicalize any future directional spacing | Source-only |
| Icons/arrows | Shared header back chevron; option cards use radio/checkbox indicator components | Yes | Yes | Preserve shared mirrored header/card behavior | No direct create-screen RTL icon assertion |

There is no legacy `isRTL(locale)` use in this screen. The main screen-owned gaps are plain title/label/body text alignment and possible disclaimer/notice borders, not directional flex reversals.

## 5. Shared component/API readiness

Available APIs:

- `useLayoutDirection()`: current locale-derived application direction
- `getLayoutRowDirection(direction)`: `row` / `row-reverse`
- `getLayoutTextAlign(direction)`: `left` / `right`

Available components:

- `AesScreenHeader`: already uses shared direction; mirrors back chevron and aligns title/subtitle
- `AesOptionCard`: already uses shared direction and RTL `row-reverse`
- `AesButton`: text/icon spacing and loading/disabled behavior are reusable
- `AesCard`: no inherent direction assumptions
- `AesScreenContainer`: scroll/safe-area shell, no directional redesign needed

Readiness conclusion: the shared APIs and components are sufficient for a screen-only presentation migration. No shared-component change is required.

## 6. Authorization and protected-read boundaries

Permission predicate:

- Source: `src/core/auth/boundaries.ts`
- `canCoordinate(context)` returns true only when `context.isAuthenticated` and `context.role === 'admin_reviewer'`.

Screen behavior:

- Authorization is checked on every render through `canCoordinate(activeContext)`.
- Unauthorized users receive `create-coordination-unauthorized` before the reason picker or submit button renders.
- The callback returns before confirmation or submission if `isAuthorized` is false.

Protected declaration read:

- The screen does not read declaration data itself.
- `AesGuardianDatabase.createOhCoordination` verifies creator role and declaration existence.
- The repository verifies the creator row is `admin_reviewer`.
- The repository verifies the declaration exists by ID.
- It does not verify declaration ownership for the caller; this route is a synthetic admin operation, and the repository does not expose or read clinical fields beyond ID/reference metadata.

Route/caller state:

- `DeclarationDetailsScreen` exposes the create action only to the admin-reviewer UI branch.
- Route-level restriction is absent, but direct navigation still reaches the screen-level and repository-level fail-closed boundaries.

## 7. Repository submission and duplicate-guard behavior

Submission payload:

- `declaration_id`: route parameter `declarationId`
- `created_by_user_id`: `authContext.userId`
- `coordination_reason`: selected canonical state value

Canonical reasons are supplied by `OH_COORDINATION_REASONS`.

Repository validation:

- Canonical reason validation
- Creator user existence
- Creator role exactly `admin_reviewer`
- Declaration existence
- Existing active coordination check

Duplicate protection:

- Domain check queries active statuses `pending_acknowledgement` and `acknowledged`.
- Database partial unique index enforces one active coordination per declaration:
  `CREATE UNIQUE INDEX idx_oh_coord_active_per_decl ... WHERE status IN ('pending_acknowledgement','acknowledged')`
- The screen does not bypass the repository guard.

UI loading/duplicate behavior:

- Pressing submit opens a native confirmation alert.
- Confirm sets `submitting=true`, calls the repository and audit, shows success or error, then sets `submitting=false`.
- `AesButton` receives `loading={submitting}` and `disabled={submitting}`.
- The confirm callback also checks closure-state `submitting`, but there is no dedicated synchronous ref such as the follow-up event screen. Rapid repeated confirmation callbacks could depend on React render timing; repository and database duplicate guards remain the authoritative protection.

Success behavior:

- Repository returns the coordination ID.
- The screen logs `OH_COORDINATION_CREATED` through `logAuditEvent`.
- The screen shows success and the OK callback calls `navigation.goBack()`.

Audit behavior:

- Audit call is separate after successful repository creation.
- `logAuditEvent` catches audit failures and logs a warning, so audit failure does not crash the screen or reinterpret coordination creation.

Notification behavior:

- `createOhCoordination` inserts one `oh_coordination_created` notification in the same database transaction for the OH professional recipient.
- It uses the declaration reference and coordination ID as notification context.
- This is unchanged by RTL presentation.

Error behavior:

- Duplicate active coordination is translated into `oh.error.alreadyActive` and no success alert/goBack.
- Other repository errors show the generic title plus the returned error/message or `error.saveFailed`.
- No generic repository-failure recovery test exists for this screen.

## 8. Existing test coverage matrix

| Area | Existing coverage | Status |
|---|---|---|
| Authorization/roles | Test 16 renders unauthorized UI for exposed, OH, quality and tech roles | Covered |
| Protected reads | Authorization UI prevents submit; adjacent role tests cover no protected OH reads | Partial |
| Declaration ownership/access | Repository verifies declaration existence; no owner check is required for synthetic admin creation | Covered at repository level elsewhere, create-screen owner assertion missing |
| Input/reason selection | Test 15 selects `serology_monitoring` | Covered |
| Repository submission | Test 15 creates successfully; test 17 spies on repository call count | Partial |
| Exact payload | No exact object assertion for `declaration_id`, `created_by_user_id` and `coordination_reason` | Missing |
| Duplicate active coordination | Test 18 seeds active coordination and checks duplicate alert/no goBack | Covered |
| UI duplicate rapid press | Test 17 checks repository call count once, but not repeated confirmation callbacks or synchronous ref behavior | Missing |
| Loading/disabled | Source passes loading/disabled props to `AesButton`; no create-screen assertion | Missing |
| Generic repository failure | No create-screen network/error test | Missing |
| Success navigation | Test 15 simulates OK and expects goBack | Covered |
| Audit | No direct create-screen audit assertion | Missing |
| Notification | Notification workflow/coordination tests cover repository side effects, but not create-screen audit/notification integration | Adjacent coverage |
| FR/EN/AR localization | Test file has setLocale support and localized assertions elsewhere, but create-screen direct FR/EN/AR coverage is absent | Missing |
| Direct rendered RTL layout | No create-screen row/text alignment assertions | Missing |

The test harness already imports `StyleSheet`, `setLocale` and React Native testing utilities. It can support direct FR/EN/AR rendered assertions without unrelated production changes.

## 9. Missing RTL assertions and test prerequisites

Minimum screen migration assertions:

- Header row direction and back chevron FR/EN/AR
- Header title/subtitle text alignment
- Declaration reference/context number stays rendered and readable
- Disclaimer title/body alignment
- Reason section label alignment
- Option-card title/indicator direction and radio state
- Clinical notice alignment
- Submit button text/disabled/loading behavior
- Unauthorized title/body alignment and submit absence
- Success/error native alert text is not mutated
- Success navigation remains `goBack`

Minimum behavior prerequisite gaps:

1. Assert exact repository payload.
2. Assert rapid repeated confirm does not issue duplicate calls or assert that repository/DB guard rejects as designed.
3. Assert loading/disabled state while confirmation submission is in flight.
4. Assert generic repository failure alert and retained form state.
5. Assert audit and notification side effects at the existing database/workflow boundary.

These are test additions, not production changes, and should be added in a future implementation batch before or alongside the RTL migration if review requires stronger acceptance.

## 10. Migration risk assessment

Layout direction can be migrated presentation-only:

- The route and callback remain unchanged.
- Authorization remains in `canCoordinate`.
- Repository submission remains in `AesGuardianDatabase.createOhCoordination`.
- Duplicate protection remains in repository/domain/DB guards.
- Alert text and callbacks remain unchanged.
- Shared header and option-card components already implement the relevant direction behavior.

Primary risks:

- Plain disclaimer, reason label and clinical notice text currently have no shared text alignment.
- The declaration reference subtitle inherits shared header behavior but needs direct verification.
- Native alert direction is outside the screen source and not established by Jest.
- The UI submitting guard is closure/state-based rather than a synchronous ref; RTL migration must not alter or broaden this logic.

The existing behavior suite is strong on role denial and duplicate repository error but not complete on payload/loading/generic error/direct RTL. It is therefore not ready for an unconditional acceptance claim without bounded test prerequisites.

Safer than the remaining alternatives:

- It is still safer than OH follow-up event and the prevention/surveillance cluster because it has fewer stateful form fields.
- It is less isolated than `DeclarationCoordinationStatusScreen`, which lacks a dedicated test and shared header.
- It should follow submission-confirmation only after test gaps are accepted.

## 11. Final preservation audit

No file was modified by this audit.

Preflight and expected final state:

- Branch remains `migration/aes-guardian`
- HEAD remains `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed and index trees remain `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Lockfile raw hash and normalized blob remain canonical
- Target screen and test hashes remain unchanged
- Pre-existing worktree modifications and untracked reports remain preserved
- Only this report is created

No Jest or TypeScript run was required for the source/read-only audit.

## 12. Recommended next action

Close or accept the listed test gaps for:

- exact payload,
- rapid repeated confirmation,
- loading/disabled state,
- generic repository failure,
- direct FR/EN/AR layout assertions.

Then authorize a separate presentation-only migration batch limited to `CreateCoordinationScreen.tsx` and `oh-coordination-batch6-acceptance.test.tsx`. Do not change shared components or business/database/audit/notification code.
