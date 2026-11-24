# AES Guardian - Phase 2E.1 Batch 11.2.24

## 1. Executive recommendation

**CONDITIONALLY READY - BOUNDED TEST PREREQUISITE**

`OhFollowUpEventScreen.tsx` is structurally suitable for a narrowly scoped presentation-only RTL migration, but one test prerequisite should be closed before implementation: direct rendered FR/EN/AR assertions for the form, plus exact payload/audit and pending-duplicate assertions.

The route, role boundary, repository guard and recovery behavior are clear. The screen already uses accepted shared `AesScreenHeader`, `AesOptionCard`, `AesButton` and `AesScreenContainer` components. It also has a synchronous `submittingRef` guard and a React loading state.

The remaining business behavior is sufficiently protected by source and existing tests. The missing prerequisite is not a production defect, but complete evidence for:

- exact repository payload and event date
- audit call
- deferred repeated submission callback
- loading/disabled settlement
- direct rendered Arabic/layout behavior

No application or test file was changed.

## 2. Repository preflight and preservation evidence

Verified before inspection:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Initial status entries: 120
- Initial status capture: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-24-initial-status.txt`
- Initial status SHA-256: `32c4e05024f85cab032084b9d0d37a1e4dc6a1115c3437bad7e8a22c14dd6700`
- Raw lockfile SHA-256: `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667`
- Normalized lockfile blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Protected target hashes:

| File | SHA-256 |
|---|---|
| `OhFollowUpEventScreen.tsx` | `453780d8fdf94537169dd796105b34a712a86d059fa579bd1b44f6702640166f` |
| `oh-coordination-batch6-acceptance.test.tsx` | `4820ac42a46b8c5c465ab66a49ee9947cbe78a3203559c829c8cd97544fbff3c` |

## 3. Route, caller and navigation findings

Route contract:

- Route name: `recordFollowUpEvent`
- Parameter: `{ coordinationId: number }`
- Registered in each authenticated navigator branch in `AppNavigator.tsx`
- No route parameter is constructed elsewhere by notification navigation

Only screen caller found:

- `OhCoordinationDetailScreen.tsx`
- Visible inside the OH-professional active-actions section
- The detail action is rendered only when `isOhProfessional && isActive`
- It navigates on acknowledged status with:

`navigation.navigate('recordFollowUpEvent', { coordinationId })`

No notification, deep-link or shortcut caller was found.

Route-level authorization is absent. The screen checks role on mount/render and renders an unauthorized state for all other roles. Repository methods independently enforce authorization again.

## 4. Role and privacy boundary analysis

The UI predicate is `canFollowUp(authContext)`:

- Requires `isAuthenticated`
- Requires role `oh_professional`

Unauthorized roles are denied before the form is rendered:

- exposed_professional
- admin_reviewer
- quality_staff
- tech_admin

The repository independently verifies:

- recording user exists
- recording user role is `oh_professional`
- coordination exists
- coordination is not completed or cancelled
- linked declaration exists

This is stricter than UI and protects direct calls.

Privacy:

- The screen stores a non-clinical administrative note only.
- Follow-up event reads are separately restricted to OH professionals.
- Exposed-professional status/navigation routes use a declaration-status projection, not event detail.
- The repository notification is to the declarer and contains event/entity metadata, not the free-text administrative note.

## 5. Repository, audit and notification data flow

Repository method:

- `AesGuardianDatabase.createOhFollowUpEvent(input)`

Exact payload:

- `coordination_id`
- `event_category`
- `event_date`
- `recorded_by_user_id`
- `administrative_note?: string`

Canonical categories are imported from `OH_FOLLOW_UP_EVENT_CATEGORIES` and validated against the repository list.

Eligibility:

- Coordination must exist
- Coordination status must not be completed or cancelled
- Pending and acknowledged coordination records are both accepted by the repository currently
- The caller UI is designed to reach the screen only for acknowledged detail state

Transaction behavior:

- Insert follow-up event
- If category is `follow_up_completed`, transition coordination to completed
- Insert a completion or milestone notification
- Return event ID

Notification behavior:

- Intermediate milestone: recipient is the exposed/declarer user
- Event type: `oh_milestone_recorded`
- Entity type: `oh_follow_up_events`
- Idempotency key: `notif:oh_milestone_recorded:oh_follow_up_events:<eventId>:<declarerId>`
- Completed event: recipient is declarer
- Event type: `oh_coordination_completed`
- Entity type: `oh_coordination`
- Idempotency key: `notif:oh_coordination_completed:oh_coordination:<coordinationId>:<declarerId>`

Notification transaction hardening tests verify rollback when notification insertion fails.

Audit behavior:

- The screen calls `logAuditEvent`
- Event type: `OH_FOLLOW_UP_EVENT_RECORDED`
- Payload includes OH user ID, follow-up event entity type/ID and coordination/event description
- Audit failures are caught by `AuditLogger` and do not throw from the audit wrapper
- No direct screen test currently asserts the audit call

## 6. Complete form and validation inventory

| Element | Test ID/accessibility | Current layout | Direction risk | Validation/behavior |
|---|---|---|---|---|
| Header | Shared `AesScreenHeader` | Shared direction-aware header | Header title/subtitle/back affordance should be checked with direct locale assertions | Back calls `navigation.goBack()` |
| Category label | No dedicated test ID | Fixed section text | Screen-owned text alignment | Localized category label |
| Category options | `oh-event-category-*` | Vertical option list; `AesOptionCard` handles RTL row reverse | Option order must remain canonical | Single selected canonical category |
| Date label | No dedicated test ID | Fixed section text | Screen-owned text alignment | Localized label |
| Date input | `oh-event-date-input`, label `oh.event.date` | Fixed text input, 48px minimum, 10-char limit | ISO reference string should remain LTR; prose label should follow locale | Regex `^\d{4}-\d{2}-\d{2}$`; no calendar-range or actual-calendar-date validation; trims before checking |
| Date error | `oh-event-date-error` | Plain error text | Right-align in Arabic | Invalid format only |
| Note label | No dedicated test ID | Fixed section text | Screen-owned text alignment | Localized optional administrative-note label |
| Note counter | `oh-event-char-counter` | Fixed row with label/counter via `justifyContent: space-between` | Row should reverse in RTL; numeric count should remain readable | JavaScript `adminNote.length`; 280 warning threshold; 300 suffix |
| Note description | No dedicated test ID | Plain text | Text alignment in Arabic | 300-character administrative non-clinical description |
| Note input | `oh-event-note-input`, label `oh.event.note` | Multiline 96px minimum, max 300 | Directional prose and cursor need locale handling | trims for repository payload; empty note becomes undefined |
| Clinical notice | `oh-event-clinical-notice` | Plain text card | Screen-owned text alignment | Clinical-neutral disclaimer |
| Submit action | `oh-event-submit-button` | Shared `AesButton`; loading/disabled | Centered text, no icon | `submittingRef` + React state block; success/error/alert callbacks |

Other discovered behavior:

- No confirmation alert before submission; the submit action executes directly
- The date is initialized to the current UTC date string
- The category is initialized to `contact_attempt_recorded`
- Invalid date clears no form fields
- Generic repository failure retains note/category/date
- Success calls `navigation.goBack()` from the OK alert callback

## 7. Submission lifecycle and duplicate protection

Initial submit:

- `handleSubmit` returns if unauthorized, React `submitting` is true, or `submittingRef.current` is true
- Invalid date returns before setting the synchronous guard
- Valid date trims the value
- `submittingRef.current` is set true before repository invocation
- `setSubmitting(true)` exposes loading/disabled state
- Repository call occurs
- Audit call follows
- Success alert is displayed
- `finally` releases the ref and loading state

Repeated UI submit:

- `submittingRef` provides a synchronous in-screen guard
- A second press before React rerender also checks the ref
- Existing test 23 presses the submit button twice and verifies one repository call
- The test does not use a deferred pending promise, so it does not prove the callback remains guarded across the complete async lifetime

Repository duplicate behavior:

- There is no uniqueness constraint for repeated identical follow-up events
- There is no idempotency key in `createOhFollowUpEvent`
- The UI synchronous guard is the only duplicate-submission protection
- Direct repeated repository calls can create repeated event rows
- This is suitable for the screen contract only if the synchronous guard is preserved and directly tested with a pending promise

Failure:

- Repository/audit wrapper errors display the generic alert
- Form state remains mounted and retains category, date and note
- The synchronous ref and React state release in `finally`
- User can retry

## 8. Shared RTL component readiness

Existing shared components:

- `AesScreenHeader`: accepted shared RTL behavior for row, title/subtitle and back chevron
- `AesOptionCard`: accepted shared RTL behavior for card row, indicator position and text align
- `AesButton`: accepted shared base behavior; no icon in this screen
- `AesScreenContainer`: direction-neutral scroll/safe-area shell
- `AesCard`: not used directly on this screen

Screen-owned RTL gaps:

- No `useLayoutDirection`, `getLayoutRowDirection` or `getLayoutTextAlign`
- No locale import beyond `t`
- Fixed `noteHeaderRow` uses `flexDirection: 'row'`
- Section labels, note caption, counter, clinical notice and error text have no directional alignment
- Date input has no explicit text align or LTR writing direction
- Administrative note input has no explicit RTL prose alignment
- Unauthorized title/message remain centered and could be direction-neutral
- Numeric coordination ID in header remains through shared subtitle text alignment

The established shared APIs are sufficient. No shared-component change is needed.

## 9. Existing test coverage matrix

| Area | Existing evidence | Classification |
|---|---|---|
| Authorized OH role access | Tests 19 and 27 render and submit | Direct rendered/UI |
| Unauthorized role denial | Test 20 renders unauthorized state and hides submit | Direct rendered/UI |
| Route parameter | Tests set `coordinationId` and repository spies receive it | Direct route mock/UI |
| Exact repository payload | Test 27 uses partial `objectContaining` and test 19 asserts category/user/note, but no complete exact object including event date | Partial only |
| Canonical category | Test 19 selects `consultation_recorded`; test 27 defaults `contact_attempt_recorded` | Direct/UI and repository spy |
| Date validation | Test 22 rejects `invalid-date` and verifies no repository call | Direct rendered/UI |
| Date calendar validity | No test for invalid leap/calendar date beyond regex | Source/coverage gap |
| 300-character limit | Test 21 verifies counter and rendering; TextInput `maxLength=300` source | Direct/UI plus source |
| Empty note | No direct test that omitted note reaches repository as `undefined` | Not covered |
| Duplicate submit | Test 23 presses twice and asserts one call | Direct/UI, but no deferred pending promise |
| Repeated confirmation callback | No confirmation alert exists for this screen | Not applicable |
| Loading/disabled | Test 23 does not assert pending accessibility state | Not covered |
| Generic failure/retry | Test 24 asserts generic alert and retained note; no retry success | Partial |
| Audit event | No direct screen or repository audit assertion found | Not covered |
| Notification intermediate | Repository workflow test 7 asserts recipient/entity/keys | Repository/database direct |
| Notification completion | Repository workflow test 8 asserts completion and recipient/entity/keys | Repository/database direct |
| Notification rollback | Notification hardening test verifies event/coordination rollback | Repository/database direct |
| Success navigation | Tests 19 and 27 verify goBack from OK callback | Direct rendered/UI |
| FR rendered layout | No direct OH follow-up FR layout test | Not covered |
| EN rendered layout | No direct OH follow-up EN layout test | Not covered |
| AR rendered layout | No direct OH follow-up AR RTL layout test | Not covered |

## 10. RTL source findings

Exact source locations:

- `OhFollowUpEventScreen.tsx:54` — only `t` import; no shared layout direction API
- `OhFollowUpEventScreen.tsx:133-138` — section labels are fixed text styles
- `OhFollowUpEventScreen.tsx:144-165` — date field and input lack RTL text alignment/writing direction
- `OhFollowUpEventScreen.tsx:168-195` — note header is `row`; counter/note label may need explicit RTL ordering
- `OhFollowUpEventScreen.tsx:184-194` — note input lacks locale-aware text alignment
- `OhFollowUpEventScreen.tsx:197-202` — clinical notice is plain text
- `OhFollowUpEventScreen.tsx:205-213` — submit action is centered; no icon, but bottom placement should remain verified
- `OhFollowUpEventScreen.tsx:289-292` — `noteHeaderRow` fixed `row`
- `OhFollowUpEventScreen.tsx:293-312` — counter/section styles lack text alignment
- `OhFollowUpEventScreen.tsx:314-336` — text inputs use physical symmetric horizontal padding and no locale-aware alignment
- `OhFollowUpEventScreen.tsx:337-348` — error and clinical notice lack RTL text alignment
- `OhFollowUpEventScreen.tsx:349-361` — unauthorized prose remains centered

The screen also preserves inherently technical content:

- ISO date `YYYY-MM-DD` should remain LTR-written
- coordination ID and character count should remain readable and not be visually reversed

The options themselves delegate RTL to `AesOptionCard`; no array reversal is needed.

## 11. Readiness classification and rationale

**CONDITIONALLY READY - BOUNDED TEST PREREQUISITE**

Why not blocked:

- Route and caller are verified
- Role and repository authorization are protected independently
- Submission lifecycle has a synchronous ref and React loading state
- Failure retains form state and permits retry
- Repository notification/audit/rollback behavior is understood
- Shared primitives cover the header and option cards
- Presentation-only migration can remain within the screen and existing test file

Why not ready yet:

- No direct FR/EN/AR screen-layout assertions exist
- Exact repository payload and event date are not fully asserted
- Audit call is not asserted directly
- Duplicate test is not a deferred-promise pending-lifetime reproduction
- Loading/disabled state is not asserted for this form
- Actual Arabic date/prose alignment needs direct verification

No unresolved production defect was identified. The missing item is bounded test evidence.

## 12. Exact next-batch proposal

Propose a test-only prerequisite batch before RTL implementation:

Authorized test file:

- `src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx`

Minimum additions:

- Exact repository payload:
  - `coordination_id`
  - canonical `event_category`
  - exact trimmed `event_date`
  - `recorded_by_user_id`
  - trimmed or undefined `administrative_note`
- Deferred-promise repeated submit test:
  - first submit starts one repository call
  - second press/callback while pending starts no second call
  - pending state remains loading/disabled
  - settlement releases loading/disabled
- Direct audit call assertion
- Generic failure/retry assertion
- FR/EN/AR direct rendered layout assertions:
  - header row and back chevron
  - category label/cards/indicator
  - date label/input and LTR ISO date
  - note label/counter/note input
  - clinical notice
  - submit action

After prerequisites pass, authorize a separate presentation-only RTL implementation batch limited to:

- `src/features/aes-guardian/screens/OhFollowUpEventScreen.tsx`
- `src/features/aes-guardian/__tests__/oh-coordination-batch6-acceptance.test.tsx`

No repository, database, audit, notification, shared component or route change.

## 13. Final preservation audit

No application, test, fixture, navigation, localization, shared-component or lockfile file was changed.

Only the required report was created:

`docs/AES_GUARDIAN_PHASE2E1_BATCH11_2_24_OH_FOLLOWUP_EVENT_RTL_READINESS_AUDIT.md`

Repository branch, HEAD, committed tree and index tree remain unchanged. No staged paths or lockfile change was made.
