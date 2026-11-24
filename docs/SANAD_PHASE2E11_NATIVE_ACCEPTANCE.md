# SANAD Phase 2E.11 - Android Native Verification Environment Recovery and Acceptance

## Verdict

- **Phase 2E.9 Declaration List:** ACCEPTED
- **Phase 2E.10 Typography Foundation:** PARTIALLY ACCEPTED
- **Environment recovery:** ACCEPTED

The separate API 36.1 emulator recovered and remained healthy long enough to complete the Phase 2E.9 and bilingual typography native walkthrough.

## Repository preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Lockfile SHA-256: `D26A8FB77DB757189E26A38D784C4148DA599EB7E0A80EFCD081CA282483151B`
- Preflight status: 345 paths
- Final status: 345 paths
- Staged files: zero
- `git diff --check`: passed
- No source, dependency, lockfile, branch, commit, or Git metadata change was made during this phase.

## Environment recovery

### Recovered device

- AVD: `phase2e11-sanad-api361`
- Device: `sdk_gphone64_x86_64`
- Android: 16
- API: 36
- ABI: x86_64
- Emulator: Android Emulator 37.2.12.0
- RAM: 4 GB
- Profile: 1080 x 2400 portrait
- GPU: software/SWIFTSHADER

The earlier `l3andalib_2` API 36 page-size image was not reused as the primary verification environment. The replacement is an already-installed API 36.1 Google APIs image.

The original emulator environment was left intact.

The fresh emulator briefly displayed an Android System UI ANR dialog. A process-only `am force-stop com.android.systemui` and recovery dialog-close action allowed it to return to SANAD. The SANAD process then launched successfully:

- `mCurrentFocus=com.sanad/com.sanad.MainActivity`
- Logcat confirmed `Running "sanad-rn"`

## Installation

The existing Phase 2E.10 APK was verified and installed:

- APK size: `183769733` bytes
- APK SHA-256: `A7C8DCB6428F565F16983D5B340D9E79D77CEF4214C8D5FA1D031A158F02C829`
- Installation result: fresh install
- Package: `com.sanad`
- Version: `0.1.0`
- First install time: `2026-11-22 16:51:12`
- App data was not cleared.

Embedded bundle evidence from the existing Phase 2E.10 build:

- Bundle size: `2357228` bytes
- Bundle SHA-256: `8B5631144A1FA9B7A2F54B8928909602910F06C6E587A68383434931127A2A21`

## Phase 2E.10 native typography

### Latin

Native rendering was verified in French and English.

- IBM Plex Sans Regular appeared in body and metadata.
- IBM Plex Sans Medium appeared in buttons and important interface text.
- IBM Plex Sans Bold appeared in page and welcome titles.
- French accented characters rendered without clipping.
- Mixed numerals and Latin text rendered correctly.
- Body wrapping remained readable in welcome, access, demo, workspace, declaration, and form screens.

### Arabic

Native rendering was verified in Arabic.

- IBM Plex Sans Arabic appears to render Regular, Medium, and Bold roles correctly.
- Arabic joining and diacritic-heavy labels were readable.
- RTL alignment, baseline placement, and line height were visually acceptable.
- Mixed Arabic/Latin references and numerals remained distinct and readable.
- Free-text French circumstances remain untranslated and readable, preserving the existing locale behavior.
- Arabic declaration filters, references, status, date, type, and circumstances did not overlap or displace content.

### Readex Pro

Native Readex rendering was observed for selected section/card headings, including:

- `Mode démonstration`
- `My Declarations`
- `Mode démonstration`
- `Mes déclarations`
- `تصريحاتي`
- Admin and review page headings

The variable font file is packaged and the weight 500/600 style values are configured. Native screenshot evidence is consistent with both heading weights being applied. It is not possible to prove the variable font axis internally via screenshots alone, so this remains separately limited rather than fully instrumented.

### Accessibility font scaling

Android system font scale was changed from `1.0` to `1.30` and back to `1.0`.

Observed:

- Welcome text wrapped into additional lines without clipping.
- Declaration/admin review list text remained readable and usable.
- Filter labels remained visible where horizontally scrollable.
- Arabic/Latin baseline and wrapping did not produce severe overlap.
- No global font-scaling disable was introduced.

The exact declaration-list 130% capture was not retained as confidently due to route and process state changes. Administrative review queue text at 130% was captured directly and showed clean wrapping.

## Phase 2E.9 native declaration acceptance

### Exposed professional - French

PASS:

- Localized title and explanatory text
- Five visible filter controls
- All, draft, submitted, under-review, and closed filters
- Draft filter produced no records
- Submitted, under-review, and closed filters produced the expected rows
- Reference/status/date/type/circumstances hierarchy
- Detail navigation
- Back navigation
- New-declaration form navigation
- No new declaration was submitted or persisted

### Exposed professional - English

PASS:

- Localized title and explanatory text
- All five filter controls
- Filter targets measured approximately 126 px = 48 dp at 420 dpi
- All = four records
- Submitted = one record
- Under review = one record
- Closed = one record
- Draft = no records
- Detail navigation opened the correct declaration
- Back navigation returned to the list
- New declaration form opened correctly

### Exposed professional - Arabic

PASS:

- RTL filter order: closed, under review, submitted, draft, all
- RTL row alignment
- Complete status/reference/date/type/circumstances hierarchy
- All five filters
- Submitted, under-review, and closed records
- Detail navigation
- Back navigation
- New-declaration form navigation
- No overlap or displaced content

### Admin reviewer - Arabic

PASS:

- Admin-specific subtitle
- Review-queue shortcut
- Permitted declaration rows
- No new-declaration action
- Admin declaration list filters
- Admin queue opened
- Queue review detail opened
- Existing role boundaries remained visible

### Admin reviewer - English

PASS:

- Global Declaration Register opened
- Admin-specific subtitle and Review Queue shortcut
- Permitted declarations rendered
- No new-declaration action
- Arabic/English mixed demo data remained domain-owned
- Existing role boundaries remained visible

## Theme acceptance

PASS:

- Android system light mode was restored and captured
- Android system dark mode was enabled and declaration rows remained readable
- Dark canvas, row surfaces, primary text, filters, status colors, and borders remained coherent
- Light mode was restored after verification

`ThemeContext` remained the source of the system light/dark state.

No second theme state or global theme architecture change was introduced.

## Accessibility

Observed:

- Filter and action controls have meaningful labels
- Filter selected-state attributes are present
- Buttons are visually distinguishable
- 48 dp declaration filter targets were rendered
- Screen hierarchy is coherent
- 130% font scaling remains readable on welcome, review queue, and list-adjacent UI
- English, French, and Arabic controls were keyboard/touch accessible

A complete TalkBack traversal was not claimed.

## Automated regression

Typography focused:

- 4 suites passed
- 23 tests passed

Declaration focused:

- 3 suites passed
- 67 tests passed

Full Jest baseline from Phase 2E.10:

- 63 suites passed
- 1,314 tests passed

TypeScript remains at the historical 684 diagnostic baseline.

ESLint remains blocked by the missing ESLint 9 flat configuration.

## Native evidence

Evidence folder:

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E11-20261122-1627`

Important evidence includes:

- `12-declarations-en.png`
- `13-detail-en.png`
- `14-detail-en.png`
- `16-new-form-en.png`
- `21-declarations-fr.png`
- `fr-detail.png`
- `fr-new-form.png`
- `ar-declarations2.png`
- `ar-detail.png`
- `ar-new-form.png`
- `ar-admin-workspace.png`
- `ar-admin-queue.png`
- `ar-admin-detail.png`
- `ar-admin-list.png`
- `en-admin-list2.png`
- `dark-admin-list.png`
- `light-admin-list.png`
- `fontscale-130-admin-list.png`
- `exact-130-declaration-list.png`

## Defects

No application defect was found in the native acceptance paths.

The System UI ANR occurred in `com.android.systemui` and was not reproducible as a SANAD process crash. It was resolved by process recovery and closing the ANR dialog.

Readex variable 500/600 axis instrumentation remains unverified internally. This is a remaining acceptance limitation, not evidence of a font substitution.

## Final preservation audit

- Preflight and final status count: 345 paths
- Branch unchanged
- HEAD unchanged
- Index tree unchanged
- Lockfile unchanged
- Staged files: zero
- No dependency or source correction was made
- `git diff --check`: passed

The emulator is left running.
