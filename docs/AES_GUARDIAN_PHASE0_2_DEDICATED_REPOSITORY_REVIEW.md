# AES Guardian Phase 0.2 — Dedicated Repository Review

**Review date:** 2026-11-18  
**Scope:** Establish a separate AES Guardian clone and inspect publication/history risks. No dependencies were installed; no source, test, configuration, or published file was changed. No push or history rewrite was performed.

Evidence labels:

- **VERIFIED BY GIT** — repository identity, commit/tree/ref, file status, or Git history evidence.
- **VERIFIED IN SOURCE** — imports, package/configuration, or tracked source inspection.
- **VERIFIED BY INSPECTION** — direct review of image, XML, text, archive, or binary metadata content.
- **UNVERIFIED** — not established by available evidence or by a complete review.
- **RISK IDENTIFIED** — content or repository state needs owner review.

## 1. Dedicated checkout and Git identity

**VERIFIED BY GIT** — Dedicated clone path: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`.

**VERIFIED BY GIT** — `origin` fetch and push URLs both point to `https://github.com/spidermonkeyyyy/AES-Guardian.git`. The checked-out branch is `migration/aes-guardian`; HEAD is `c81a50c98e4e7330fad479a51a48a2fea7f912a1`; tree is `983733927b18bf30b8377f84c9c1813c74c4bf6b`.

**VERIFIED BY GIT** — The local branch and `origin/migration/aes-guardian` resolve to the same commit and tree. `git rev-list --left-right --count HEAD...origin/migration/aes-guardian` returned `0 0`; the clone’s working tree is clean. This is the requested published baseline.

**VERIFIED BY GIT** — A pre-existing registered AES-Guardian directory was inspected and found to have an unrelated empty-tree initial commit, not the expected published commit. It was left untouched. The new clone above was created at a distinct, previously absent path. The earlier SANAD checkout was not changed during this task.

## 2. Divergent history review

**VERIFIED BY GIT** — The local migration sequence and published sequence have no common ancestor and four distinct commits on each side. Their corresponding post-initialization trees are identical:

| Local migration commit | Published commit | Evidence and classification |
|---|---|---|
| `efeb5d6add2f4a48c166c404aaefba8ffb89e38d` | `481b8ebf73f3c2705c092ee971b3d04dc55cfc24` | Repository initialization from the SANAD React Native app. Initial trees differ by exactly one file: the local migration root includes a 173,403,084-byte debug APK; the published AES root does not. |
| `5129fa8269a089049c8b85f24237941c71489065` | `0b8fdabe347ddd3f4d7e4aaf53c8aedc6fb295b5` | Build-artifact removal. Resulting tree IDs are identical (`48f9281b2c1d1fc65999115968ac66de11961f7b`). |
| `d79b01ef51646509170996f8c77517f95470f217` | `a58472ce863ed301c63e78d041be8e8bdb07cfec` | Phase 2C.7 implementation (122 files; 20,735 insertions, 85 deletions). Resulting tree IDs are identical (`8bcf1b7d97cb51070c2785c95fcb959acfdd13ab`). |
| `3b5757639dcb4fd3404641a9548f3b5b5ef1e34e` | `c81a50c98e4e7330fad479a51a48a2fea7f912a1` | Phase 2D–2E implementation (170 files; 56,464 insertions, 4,515 deletions). Resulting tree IDs are identical (`983733927b18bf30b8377f84c9c1813c74c4bf6b`). |

**VERIFIED BY GIT** — The exact local commit IDs `d79b01ef` and `3b57576` are not ancestors of the published branch. However, the corresponding published commits have the same trees at both implementation milestones, and the initial-tree difference is limited to the debug APK. The evidence therefore indicates no AES implementation snapshot is missing from the published sequence; implementation history is represented by equivalent commits with different IDs and independent roots. The published branch remains the provisional baseline. No merge or history rewriting was performed.

**RISK IDENTIFIED** — The local migration history retains the 173 MB debug APK in its initial commit, even though the artifact-removal commit removes it from the resulting tree. The published AES Guardian history does not contain that APK.

## 3. Inherited artifacts and publication risks

| Item | Classification | Inspection findings |
|---|---|---|
| `emulator_screen.png` | Generated/reproducible; unnecessary inherited SANAD evidence | **VERIFIED BY INSPECTION** — Shows a generic, mostly empty patient landing screen. No person, patient value, account identifier, or machine path is visible. Not AES Guardian UI. |
| `dump.xml` | Generated emulator evidence; potentially sensitive; owner decision | **VERIFIED BY INSPECTION** — The captured SANAD profile view contains a healthcare-worker display name and email with a role. No patient clinical record is visible in this dump. Whether this is synthetic is **UNVERIFIED**; identifying staff data should not be assumed safe to publish. No values are repeated here. |
| `docs/dump.xml` | Useful development evidence; generated; owner decision | **VERIFIED BY INSPECTION** — Shows a generic sign-in screen, placeholder account field, masked password field, and demo-account choices. No clear credential or individual identity is visible. |
| `src/types/auth.ts.bak` | Unnecessary/stale inherited backup; owner decision | **VERIFIED BY INSPECTION** — Contains only an older authentication/user type contract, including fields for identity/contact details; no actual user values or credentials. It differs from the current `src/types/auth.ts`. |
| `android/compat/build/` | Generated/reproducible build output and cache; owner decision | **VERIFIED BY INSPECTION** — 109 files (379,247 bytes): compiled `.class`/`.dex`, jars/AAR, Gradle/Kotlin caches, merged manifests, and reports. The generated `BuildConfig` contains only debug/package metadata. Path-shaped local filesystem references occur in several tracked build metadata files; values are omitted. No email or credential assignment was found by the heuristic scan. |
| `android/app/src/main/assets/index.android.bundle` | Generated/reproducible; potentially sensitive; owner decision | **VERIFIED BY INSPECTION** — 1,960,659-byte compiled bundle. It is Sanad-branded and did not contain the AES Guardian product label checked, so it may be a stale build artifact. Redacted pattern scan found seven email-shaped strings and eleven patient-name field literals; it found no private-key marker, obvious credential assignment, or absolute home-directory path. Whether the embedded values are synthetic is **UNVERIFIED**. |
| `test-repo.js` | Unnecessary inherited test/debug script; potentially unsafe to publish; owner decision | **VERIFIED BY INSPECTION** — Ad hoc alert-repository script contains a patient-like name linked to a respiratory diagnosis, a dated alert, and a staff identifier; it has no explicit synthetic-data notice. Treat as potential personal health data until an owner confirms otherwise. Values are not reproduced here. |
| `.kilo/agents/data.md` | Tool-specific development configuration; unrelated to app runtime; owner decision | **VERIFIED BY INSPECTION** — Kilo data-agent instructions, not application source. No credential or person values found in the inspected text. |
| `references/source-audit-verification-pattern.md` | Useful reference at most; unrelated inherited document; owner decision | **VERIFIED BY INSPECTION** — Audit guidance for a separate migration/tooling context, not AES application source. It includes local-path examples/references; no secret values are included in this report. |

**VERIFIED BY INSPECTION** — Representative documentation screenshots reviewed (including populated surveillance and action-detail screens) are explicitly labeled as synthetic demonstration data and show aggregate/demo content without visible individual identifiers. This was a representative review, not a manual inspection of every screenshot in `docs/`.

**RISK IDENTIFIED** — Ten tracked launcher PNGs (five under each of `android/app/` and `android/android/app/`) are byte-identical (SHA-256 `E2CFCF0CA4F5D9A13082E2B7B34887778BF6DF13846C16B3173FBEAA0433041A`), each 3,303 × 3,303 pixels and 7,274,282 bytes. The same oversized image is repeated across launcher-density paths in both Android trees. Whether both trees are required, and whether density-specific icons should repeat the full-size image, requires an owner decision.

**VERIFIED BY INSPECTION** — `src/assets/images/logo/sanad_icon.png` is a Sanad logo and is used by the shared authentication UI; it contains no personal data. Other large logo variants and bundled icon-font assets are not directly referenced by the AES feature in source. Source references use Feather icons; the presence of the 1.15 MB Material Community Icons font is not justified by a direct source import found in this review.

**VERIFIED BY INSPECTION / RISK IDENTIFIED** — The local-only historical APK is a generated debug package (173,403,084 bytes; 911 archive entries; 186,074,091 uncompressed bytes), with DEX, native libraries, resources, and an embedded app bundle. Archive inspection found no database or signing/certificate entries, no private-key markers, and no obvious credential assignments. Redacted content scans found email-shaped strings, patient-name field literals, and absolute-path markers in compiled payloads. Treat the APK as an unnecessary historical artifact with potential embedded demo/personal and machine metadata; it is absent from the published AES Guardian history.

**VERIFIED BY INSPECTION / RISK IDENTIFIED** — A heuristic scan of tracked text in the published tree found 14 email-shaped strings across nine files and path-shaped Windows/Unix home references in 183 places across 88 files, including historical reports and build metadata. These scans include possible examples and demo fixtures; they do not prove that the values are real or synthetic. No private-key markers or obvious credential assignments were found. No secret values or path values are reproduced here. Whether any patient/staff data is real remains **UNVERIFIED**.

## 4. Inherited module inventory

**VERIFIED IN SOURCE** — The 62 files under `src/features/aes-guardian/` import their own feature, `src/core`, localization, navigation, and theme. No direct import into the inherited patient, nurse, monitoring, alerts, communication, design-preview, patient-dashboard, services, or clinical-utility modules was found.

**VERIFIED IN SOURCE** — `AppNavigator.tsx` statically imports and registers SANAD patient, nurse, monitoring, communication, and design-preview screens alongside AES Guardian screens. Those legacy screens are consequently part of the current combined app’s module graph/build even though the AES Guardian feature itself does not directly import them.

| Inherited module | AES feature dependency | Required by current combined app | Intentionality |
|---|---|---|---|
| `features/authentication/` and shared `components/` | AES entry is exposed through the shared auth gate; auth state and shared controls support the app shell. | Yes; imported by the root navigator and app entry. `SanadLogo` is used by the shared login/auth UI. | The integrated entry is evident in source; retaining the full legacy auth experience in a dedicated repository still requires owner confirmation. |
| `features/patient/` | No direct AES feature import. | Yes; patient screens are imported and routed by `AppNavigator`. | Requires owner decision. |
| `features/nurse/` | No direct AES feature import. | Yes; nurse dashboard, patient, alert, profile, and rule screens are imported/routed. | Requires owner decision. |
| `features/monitoring/` | No direct AES feature import. | Yes; monitoring screens are imported into patient navigation. | Requires owner decision. |
| `features/communication/` | No direct AES feature import. | Yes; patient/nurse messaging screens are imported into navigation. | Requires owner decision. |
| `features/design_preview/` | No direct AES feature import. | Yes; `DesignSystemScreen` is imported and registered. | Requires owner decision. |
| `features/alerts/` | No direct AES feature import. | No application import from the app navigator or other app source was found; references are limited to the module’s tests and documentation. | Appears unused by the current runtime graph; owner decision. |
| `features/patient_dashboard/` | No direct AES feature import. | No application import or route was found. | Appears unused; owner decision. |
| `services/` | No direct AES feature import. | Indirectly required by authentication, monitoring, and nurse workflows that are in the app graph. | Requires owner decision as inherited SANAD infrastructure. |
| `utils/clinical/` | No direct AES feature import. | Indirectly required by monitoring/rule workflows in the app graph. | Requires owner decision as inherited clinical functionality. |

**RISK IDENTIFIED** — The package metadata still names the app `sanad-rn`; source and navigation continue to expose SANAD patient/nurse workflows. The source makes integration visible, but does not establish that all inherited modules are intended to remain in the dedicated AES Guardian repository.

## 5. Package and verification readiness

**VERIFIED IN SOURCE** — This is an npm project: `package-lock.json` is present with lockfile version 3; no Yarn, pnpm, or Bun lockfile exists. The project root has no `engines`, `packageManager`, `.nvmrc`, or `.node-version` declaration.

**VERIFIED BY GIT** — Available runtime is Node `v24.18.1` and npm `12.0.1`. Locked package versions include React Native `0.76.9` (Node `>=18`), Jest `29.7.0` (Node `>=18`), and TypeScript `5.9.3` (Node `>=14.17`). The installed Node satisfies the declared React Native engine range; no project-pinned/tested Node version was found.

**VERIFIED IN SOURCE** — `jest.config.js` uses the React Native preset, maps `@/` to `src/`, and excludes Android/iOS trees from test discovery. Package scripts are `test: jest`, `typecheck: tsc --noEmit`, and `lint: eslint . --ext .ts,.tsx`.

**VERIFIED BY GIT** — `node_modules` is absent. Dependencies were not installed and tests/type-check/lint were not run in this review. Use the lockfile-matched project toolchain, not an arbitrary global TypeScript compiler.

**VERIFIED IN SOURCE** — Exact supported commands for a subsequent authorized verification run:

```text
npm ci
npm test -- --runInBand
npm run typecheck
npm run lint
```

`npm ci` is the lockfile-based installation command. TypeScript `5.9.3` is selected by the lockfile; after installation, `npx tsc --noEmit --pretty false` also resolves the project-local compiler.

## 6. Outstanding owner decisions

**RISK IDENTIFIED** — Confirm whether the patient-like values in `test-repo.js`, staff identity in `dump.xml`, and email/patient-field literals in the bundle/APK are entirely synthetic and approved for publication. The repository evidence alone cannot establish this.

**RISK IDENTIFIED** — Decide whether to retain inherited SANAD patient, nurse, monitoring, communication, design-preview, alert, and patient-dashboard modules; the `sanad-rn` package identity; Kilo/reference artifacts; emulator screenshots/dumps; compiled bundle/build outputs; and oversized/duplicated icon assets.

**UNVERIFIED** — The path-shaped values in historical reports/build metadata have not been adjudicated as examples versus actual machine-specific paths. A complete owner-approved privacy review is still needed before treating publication as risk-free.

## 7. Recommended next action

**VERIFIED BY GIT** — Keep `spidermonkeyyyy/AES-Guardian` at `migration/aes-guardian` / `c81a50c98e4e7330fad479a51a48a2fea7f912a1` as the provisional source baseline; the local clone is synchronized and the implementation milestone trees match the local migration snapshots.

Before any cleanup or implementation, obtain owner decisions on the potential personal/demo data and inherited modules/artifacts above. After approval, use the commands in Section 5 with the lockfile-matched dependencies and local TypeScript version. No cleanup or implementation was performed in this review.

## Post-review update — 2026-11-18

**VERIFIED BY GIT** — After the review, the dedicated clone was moved at the user's request from `C:\Users\User\.copilot\repos\AES-Guardian-phase0.2` to `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`. The old location no longer exists. The destination did not exist before the move.

**VERIFIED BY GIT** — After relocation, `origin` remained `https://github.com/spidermonkeyyyy/AES-Guardian.git`, branch remained `migration/aes-guardian`, HEAD remained `c81a50c98e4e7330fad479a51a48a2fea7f912a1`, and the tree remained `983733927b18bf30b8377f84c9c1813c74c4bf6b`. The local branch and `origin/migration/aes-guardian` remain synchronized (`0 0` ahead/behind). The working tree contains only this untracked report; no tracked source or configuration changed.

**VERIFIED BY INSPECTION** — The report's checkout path was updated to the relocated path. A copy of this Phase 0.2 report is also present in the session worktree's `docs` directory; the post-migration audit report was already there. Those copies are documentation only. No dependencies were installed, tests were not run, and no commits, pushes, or history changes were made. Future AES Guardian reports for this clone will be placed in its `docs` directory.
