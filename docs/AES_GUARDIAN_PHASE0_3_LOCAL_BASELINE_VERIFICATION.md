# AES Guardian Phase 0.3 — Local Baseline Verification

**Date:** 2026-11-18  
**Scope:** Local-only baseline; no GitHub contact or synchronization. No source, test, schema, localization, navigation, theme, or configuration changes were made.

## Repository identity and initial state

- Git root: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- Initial HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1` (matches expected)
- Initial tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b` (matches expected)
- Initial `git status --short --untracked-files=all`: `?? docs/AES_GUARDIAN_PHASE0_2_DEDICATED_REPOSITORY_REVIEW.md`. This existing Phase 0.2 report was preserved.
- Local remote configuration (`git config --local`, no remote contact): `origin.url=https://github.com/spidermonkeyyyy/AES-Guardian.git`; `origin.fetch=+refs/heads/migration/aes-guardian:refs/remotes/origin/migration/aes-guardian`.
- `package-lock.json` SHA-256 before install: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`.
- Runtime: Node `v24.18.1`; npm `12.0.1`.

## Dependency installation

- Inspected `package.json` scripts before install: no root install/lifecycle hooks (`preinstall`, `install`, `postinstall`, `prepare`, or related hooks). `package-lock.json` identifies one install-script-bearing dependency (`node_modules/fsevents`).
- Exact command: `npm ci` — **exit code 0**. Installed 964 packages; npm reported 23 dependency vulnerabilities (4 low, 6 moderate, 12 high, 1 critical). No audit fix was run.
- No package manifest, lockfile, or configuration was changed.

## Test baseline

- Exact command: `npm test -- --runInBand` — **exit code 1**.
- Jest: **52 suites** (51 passed, 1 failed); **1,153 tests** (1,152 passed, 1 failed, 0 skipped); 0 snapshots.
- Failing test: `src/features/aes-guardian/__tests__/notification-centre.test.tsx` — “renders empty state when user has zero notifications”. It expected the localized empty state but rendered an activity indicator instead. This is an AES Guardian failure; no inherited SANAD test suite failed.

## TypeScript baseline

- Exact command: `npx tsc --noEmit --pretty false` — **exit code 2**, **769 diagnostics** (confirmed in two runs).
- Path-based classification: AES Guardian 0; Core database 0; Shared theme 0; Localization 0; Navigation 0; Inherited SANAD modules 769; Unclassified 0.
- Representative diagnostic: `src/features/alerts/screens/AlertDetailScreen.tsx` reports TS2304 unresolved names including `spacing` and `typography`; diagnostics are in inherited SANAD module paths. The command was not piped or treated as successful compilation.

## Lint baseline

- Exact command: `npm run lint` — **exit code 2**.
- ESLint stopped before analyzing files because ESLint 9 could not find an `eslint.config.js`, `.mjs`, or `.cjs` configuration. **0 lint rule findings were emitted; this is a configuration failure, not a clean lint result.** No lint fixes were made.

## Sensitive-content provenance review

Read-only review only. Values are intentionally omitted. Exact-string checks compared extracted UI strings/literals against explicit repository seed/demo sources; a match is not proof of synthetic origin, and a non-match is not proof that data is real.

| File | Classification | Evidence |
|---|---|---|
| `dump.xml` | **POTENTIALLY REAL PERSONAL DATA** | 15 unique UI strings; 3 matched selected explicit seed/demo sources. The prior review found staff-identifying content; the identifying values did not have verified synthetic provenance. |
| `test-repo.js` | **POTENTIALLY REAL PERSONAL DATA** | 10 string literals; 4 matched selected seed/demo sources. The ad hoc test script contains patient-linked clinical context and lacks an explicit synthetic-data declaration; synthetic provenance is unverified. |
| `android/app/src/main/assets/index.android.bundle` | **POTENTIALLY REAL PERSONAL DATA** | 4 unique email-shaped literals; none matched the selected explicit seed/demo sources. Similar literals occur in seven other tracked files, including UI captures and inherited account screens; that does not establish synthetic provenance. |
| `docs/dump.xml` | **LIKELY SYNTHETIC — NOT PROVEN** | 17 unique UI strings; 1 matched selected seed/demo sources. The capture shows a generic sign-in view with placeholder/masked fields and demo-account choices, without a clear identity or credential. |
| `src/types/auth.ts.bak` | **UNKNOWN** | Contains an older authentication/user type contract and identity/contact field declarations, but no actual user values to attribute. |

These classifications do not establish that publication is safe. No flagged files were modified or deleted.

## Repository preservation

- Final HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`; final tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`.
- `package-lock.json` SHA-256 after install: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667` (unchanged).
- Final `git status --short --untracked-files=all` is expected to contain only the preserved Phase 0.2 report and this new Phase 0.3 report; no tracked files changed. `npm ci` populated ignored `node_modules`.
- No commits, branch changes, merges, rebases, resets, cleans, stashes, or remote operations were performed.
