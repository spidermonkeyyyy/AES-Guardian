# AES Guardian — Phase 2E.1.7.2.2
## Batch 2: Prevention Action Register UI Transformation

### Outcome

Transformed only the Prevention Action Register screen, added focused UI tests, and added two missing register labels in French, English, and Arabic. The register now uses the app's active demonstration identity, repository-backed authorization, existing CAPA filters, canonical AES presentation components, and the existing detail/create routes.

### Repository identity and preserved state

- Requested checkout: `C:\Users\User\Desktop\sure\sanad-rn-migration`
- Canonical Junction: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Verified Git root: `C:\c\Users\User\Desktop\sure\sanad-rn-migration`
- Branch: `migration/aes-guardian`
- HEAD: `d79b01ef51646509170996f8c77517f95470f217`

Pre-edit status contained 37 modified files and 123 untracked files. Existing user changes were preserved. In particular, `src/localization/index.ts` was already modified before this task; the existing changes were retained while adding only the register retry and detail-access keys to its translation key type and FR/EN/AR maps.

Final status contains 38 modified files and 125 untracked files. Relative to the pre-edit status, the only status additions are the transformed register screen, the new UI test, and this report; the pre-existing localization status entry remains modified. No unrelated status entry was removed or changed. No files were staged, committed, pushed, reset, cleaned, or stashed.

### Inspected source and contract

**VERIFIED IN SOURCE**

- `src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx` — existing register behavior and role handling.
- `src/core/database/AesGuardianDatabase.ts` — `listPreventionActions(userId, filters)` performs role validation from the stored demo user, supports status/action type/contributing factor filters, orders by `created_at DESC, id DESC`, and returns `Promise<PreventionAction[]>`. No pagination is exposed.
- `src/core/database/types.ts` — canonical action fields, statuses, factors, and filter types.
- `src/core/auth/boundaries.ts` and `src/core/auth/use-demo-role.ts` — quality staff can manage; quality staff, admin reviewer, and OH professional can view; exposed professional and tech admin cannot view.
- `src/navigation/routes.ts` and `src/navigation/AppNavigator.tsx` — existing `preventionActionDetail({ actionId })` and `preventionCreate` routes.
- `src/features/aes-guardian/components/` — AES container, header, card, button, round arrow, and status badge APIs.
- `src/localization/index.ts` — typed FR/EN/AR translation architecture and RTL utilities.
- Existing prevention workflow and UI tests — repository authorization, test setup, role-store and navigation conventions.

The previous register screen had a local role switcher with hardcoded labels, used the legacy theme/status styling, did not provide the factor filter despite an existing factor-filter translation, and showed raw repository error text. The database getter is synchronous, though the existing screen awaited it. This implementation uses the app-wide `useDemoRoleStore` context rather than accepting a screen-level role/user parameter; it passes only the active user ID and filters to the repository. UI permission checks control presentation, while `listPreventionActions` independently remains the authorization boundary.

### Changes

1. `src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx`
   - Replaced the local role-switcher with the active role context from the shared demo-role store.
   - Preserved repository filtering and added the supported contributing-factor filter; only canonical status, action-type, and factor values are submitted.
   - Added loading, empty, generic error, and retry states; ignored stale asynchronous responses when role or filters change.
   - Renders reference, title, description, action type, contributing factor, canonical status badge, and optional target date only. No unsupported counts, risk metrics, declaration identifiers, or legacy CAPA fields are introduced.
   - Uses `AesScreenContainer`, `AesScreenHeader`, `AesCard`, `AesButton`, `AesRoundArrowButton`, and `AesStatusBadge`, with existing AES palette/typography tokens.
   - Only quality staff sees the create route action. Admin reviewer and OH professional retain read-only register/detail access. Exposed professional and tech admin receive an access-denied state without a repository request.
   - Applies translated text and RTL alignment/order for Arabic; all filter chips and navigation/create actions have at least 48dp targets.
2. `src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx`
   - Added 16 focused cases covering populated fields, all four statuses, loading/empty/error/retry, quality/admin/OH role behavior, exposed/tech denial, detail/create routes, canonical filters, FR/EN/AR, RTL, and target sizes.
3. `src/localization/index.ts`
   - Added `prevention.register.retry` and `prevention.register.viewDetails` in the typed key union and existing French, English, and Arabic maps.
4. `docs/AES_GUARDIAN_PHASE2E1_7_2_2_PREVENTION_ACTION_REGISTER_UI_REPORT.md`
   - This report.

No repository, schema, lifecycle, transaction, audit, notification, navigation-architecture, theme-token, dependency, configuration, or blueprint changes were made. The Notification Centre source/test was not modified.

### Verification

| Command | Result |
|---|---|
| `npm test -- --runInBand src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx` | Exit 0; 1 suite passed, 16/16 tests passed. |
| `npm test -- --runInBand src/features/aes-guardian/__tests__/prevention-action-workflow.test.ts src/features/aes-guardian/__tests__/phase2d1-2-final-verification.test.ts src/features/aes-guardian/__tests__/phase2d1-corrective-verification.test.ts src/core/database/__tests__/database.test.ts` | Exit 0; 4 suites passed, 123/123 tests passed. |
| `npm test -- --runInBand` | Exit 1; 49/50 suites passed, 1,105/1,106 tests passed. |
| `npm run typecheck -- --pretty false` | Exit 2; 769 TypeScript diagnostics across 30 non-AES Guardian files; zero diagnostics in `src/features/aes-guardian` or `src/localization/index.ts`. |

The full Jest run's sole failure was in the unchanged `src/features/aes-guardian/__tests__/notification-centre.test.tsx`: `workspace badge refreshes across single-read, bulk-read, and identity switches` expected `workspace-unread-badge` to be absent but it remained rendered. This Notification Centre failure is quarantined and was not changed or suppressed. The separately known Notification Centre empty-state harness failure was not the test reported as failing in this full-run output. All other tests, including the new register UI suite, passed.

TypeScript diagnostics were classified by file path: all 769 are outside AES Guardian, across 30 other repository files; none point to the changed screen, UI test, or localization file. This check is not a clean typecheck, and no pre-edit typecheck baseline was taken, so these non-AES diagnostics are reported as outside this task's scope rather than asserted to be newly introduced or newly resolved.

### Stop condition

The authorized Prevention Action Register batch is complete. No Create/Detail/Overview implementation, Notification Centre fix, or Phase 2E.1.7.2.3 work was started.
