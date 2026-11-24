# AES Guardian — Phase 2E.1.7.2.5.2 CAPA Corrective Re-entry

## Recommendation: READY FOR RE-AUDIT

The six scoped findings below have been corrected and verified by the complete Jest suite. This recommendation is limited to the CAPA corrective re-entry; it is not a claim that the inherited repository-wide TypeScript and lint baselines are clean, nor that native-device RTL or screen-reader behavior was verified.

## Repository and preservation baseline

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- Initial and final HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Initial and final tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- `package-lock.json` SHA-256 before and after: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- At task start, the only untracked files were the pre-existing Phase 0.2 repository review and Phase 0.3 baseline report. Both were preserved unchanged.
- Final status contains 15 modified tracked files, three new files (the date formatter, its test, and this report), and the same two pre-existing untracked reports. No other files were created.
- No tracked files outside the CAPA code, related tests, and localization were changed. No package manifest, lockfile, schema/migration, navigation configuration, theme, ESLint configuration, or master blueprint was changed.
- No staging, commit, branch change, merge, rebase, reset, clean, stash, GitHub fetch, pull, push, or remote synchronization was performed.

## Corrective matrix

| Finding | Original issue | Correction and evidence |
|---|---|---|
| **A — Overview identity** | Overview used a screen-local quality role rather than the shared active identity. | Overview now reads the Zustand role/context, displays the active role using localized role keys, removes its independent role selector, and retains existing view/manage guards. UI tests cover global role changes, read-only roles, and denied roles. Repository authorization remains authoritative. |
| **B — Uncertain creation/retry** | A committed insert followed by failed readback could be blindly submitted again, creating a duplicate. | Create generates one reference code and reuses it on retries. Repository reconciliation queries that exact reference and verifies the persisted payload, creator, creation audit, and notification evidence; it returns the real inserted ID. A typed uncertain outcome disables edits and blind retry until reconciliation confirms an existing complete action or confirms absence. Native-SQLite coverage injects post-commit readback failure and verifies retry/reconciliation does not duplicate records; evidence-removal cases remain uncertain. Existing pre-commit rollback tests remain in place and pass. |
| **C — Overview error/retry/race** | Raw errors/French fallback, no retry, and stale responses could be shown after a role switch. | Overview now renders localized generic failure text, offers retry, and guards async results by request version and active context. Tests verify no raw error leakage, retry, and stale-response rejection. |
| **D — Create accessibility/RTL** | Five inputs lacked programmatic labels; shared option indicators did not follow RTL. | All five inputs now have localized `accessibilityLabel`s. `AesOptionCard` reverses its layout in RTL and uses logical `marginEnd`. Tests cover labels and RTL direction. |
| **E — Detail back arrow** | Detail used the forward arrow while invoking `goBack()`. | `AesRoundArrowButton` now supports explicit forward/back direction; Detail uses back direction while existing forward-navigation callers retain the default. Tests verify LTR-left and RTL-right in Detail and preserve forward direction in Register. |
| **F — Date presentation** | Register target dates and Detail record/audit dates were raw repository strings. | A strict locale formatter now renders French, English, and Arabic dates/timestamps in UTC, avoids date-only timezone shifts, and returns no output for missing or invalid dates. Register and Detail use it for target, created, updated, completed, and audit timestamps. Formatter and screen tests cover locales, timestamps, invalid dates, and date-only values. |

## Verification

| Exact command | Result |
|---|---|
| `npm test -- --runInBand` | **Exit 0.** 53 suites passed; 1,167 tests passed, 0 failed, 0 skipped. The prior Phase 0.3 Notification Centre failure passed in this run; no Notification Centre files were changed, so this run does not establish that the earlier issue is fixed. |
| `npm test -- --runInBand --runTestsByPath src\features\aes-guardian\__tests__\prevention-action-register-ui.test.tsx` | **Exit 0.** 1 suite, 16 tests passed after correcting the test query to account for multiple forward-arrow instances. |
| `npx tsc --noEmit --pretty false` | **Exit 2; 769 diagnostics.** Same count and path classification as Phase 0.3: AES Guardian 0; Core database 0; Shared theme 0; Localization 0; Navigation 0; Inherited SANAD modules 769; Unclassified 0. There are no diagnostics in any file changed for this re-entry. This is not a successful repository-wide typecheck. |
| `npm run lint` | **Exit 2.** ESLint 9.39.5 stopped because no `eslint.config.js`, `.mjs`, or `.cjs` exists. Zero lint rule findings were emitted; this is the unchanged baseline configuration failure, not a clean lint result. |
| `git diff --check` | **Exit 0.** No whitespace errors. Git reported only the existing Windows LF-to-CRLF conversion notice for the rewritten Overview test. |

A preceding focused run initially exited 1 because its Register test used `getByTestId` despite multiple arrow instances. The assertion was corrected, the focused Register suite passed, and the complete suite subsequently passed. React Native Animated/Touchable `act(...)` console warnings remain non-fatal.

## Files changed

**Modified (15):**

- `src/core/database/AesGuardianDatabase.ts`
- `src/core/database/index.ts`
- `src/core/index.ts`
- `src/core/database/__tests__/notification-workflow-hardening.test.ts`
- `src/features/aes-guardian/screens/PreventionOverviewScreen.tsx`
- `src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx`
- `src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx`
- `src/features/aes-guardian/screens/PreventionActionDetailScreen.tsx`
- `src/features/aes-guardian/components/AesOptionCard.tsx`
- `src/features/aes-guardian/components/AesRoundArrowButton.tsx`
- `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-create-ui.test.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-register-ui.test.tsx`
- `src/features/aes-guardian/__tests__/prevention-action-detail-ui.test.tsx`
- `src/localization/index.ts`

**Added:** `src/features/aes-guardian/prevention-date-format.ts`, `src/features/aes-guardian/__tests__/prevention-date-format.test.ts`, and this report.

## Remaining limitations

- The inherited 769 TypeScript diagnostics and missing ESLint 9 configuration remain unchanged and outside this correction scope.
- No emulator/native-device RTL inspection or native screen-reader run was performed. RTL direction is covered by source-level layout assertions and component tests.
- The synthetic role store remains a demo identity mechanism; it is not authentication. Existing repository-level authorization boundaries were preserved.

Stop point reached: this report records the corrective re-entry; no later CAPA work was started.
