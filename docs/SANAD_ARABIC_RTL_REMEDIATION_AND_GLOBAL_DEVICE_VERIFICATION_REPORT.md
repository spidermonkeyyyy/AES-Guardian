# SANAD Arabic RTL Remediation and Global Device Verification Report

**Report date:** 2026-11-25  
**Repository:** `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`  
**Final disposition:** **PARTIAL**

## 1. Executive result

The demonstrated Arabic workspace and declaration defects were remediated in source and verified on the `l3andalib_2` Android emulator with the final installed debug APK.

Completed:
- Arabic workspace and active-role card use RTL row composition.
- Arabic declaration filters, cards, metadata, and narratives use intentional RTL alignment.
- Synthetic French seed narratives for known demo references are translated only in presentation for exact seeded values.
- DEMO-02 administrative correction text is localized in the Arabic detail view.
- Divergent or user-edited narrative text remains unchanged.
- The welcome, language selector, access, demo-role picker, workspace, declaration list, and declaration detail were captured from the installed APK.
- The final generated, merged, and embedded Hermes bundles have the same SHA-256.
- French locale was restored after Arabic inspection.

Not completed:
- All 26 routes were not safely reachable or captured in one device pass.
- Runtime font-face resolution could not be independently introspected beyond packaged assets and React Native runtime configuration.
- Mutation-only routes are not device-tested because the task prohibited all declaration, review, correction, coordination, follow-up, and CAPA mutations.

## 2. Fresh Git and emulator baseline

Initial remediation baseline:
- Branch: `migration/aes-guardian`
- HEAD: `7817d7428467ddcfc5cf8718116d8fda15181e84` at the start of prior committed work
- Index: clean at the start of the latest remediation segment
- Existing generated/build changes and untracked build directories were preserved.

Final inventory:
- Source changes are limited to workspace/list/detail RTL, exact seed presentation localization, and focused tests.
- Generated Android build outputs changed locally.
- Existing `android/compat-pointer-events/build/` remained untracked.
- No files were staged or committed.

The existing emulator AVD `l3andalib_2` was started and reached boot-complete state. Package `com.sanad` was installed in place with `adb install -r`; the app data was not cleared or the app uninstalled.

## 3. Implemented remediation

### Workspace

Changed:
- `src/features/aes-guardian/screens/AesGuardianWorkspaceScreen.tsx`

Corrections:
- Locale-aware row direction.
- RTL role selector ordering and spacing.
- RTL active-role card and badge composition.
- Semantic start-side banners and callout borders.
- Module/card chevron placement and textual alignment.
- RTL technical, scenario, and privacy rows.

### Declaration list

Changed:
- `src/features/aes-guardian/screens/DeclarationListScreen.tsx`

Corrections:
- RTL filter bar and card header.
- Right-aligned Arabic metadata and card narrative.
- Stable declaration references and dates retain their LTR reading direction where appropriate.
- Synthetic circumstances use presentation-only localization.

### Declaration detail

Changed:
- `src/features/aes-guardian/screens/DeclarationDetailsScreen.tsx`

Corrections:
- RTL tab bar and card composition.
- RTL label/value alignment.
- Synthetic narrative, correction reason, and review comment presentation localization.

### Presentation-only synthetic narratives

Added:
- `src/localization/demoNarratives.ts`

Rules:
- Exact reference plus exact known French seed value is required.
- French remains the original value.
- English and Arabic receive locale-specific presentation text.
- User-edited, unknown, or divergent values return unchanged.
- No database, migration, seed, or persisted-record mutation occurs.

## 4. Defect ledger

| Defect | Root cause | Correction | Regression test | Device result |
|---|---|---|---|---|
| Arabic workspace used hardcoded LTR rows | Fixed `flexDirection: 'row'`, left borders, and right margins | Locale-aware row direction, logical borders, and alignment | `workspace-screen.test.tsx` | PASS |
| Arabic declaration cards/filters were inconsistent | Mixed fixed left alignment and partial row reversal | RTL filter/card/metadata composition | `declaration-list-migration.test.tsx` | PASS |
| Seed French circumstances appeared in Arabic cards | Seeded narrative values were rendered directly | Exact-reference/exact-value presentation resolver | `workspace-screen.test.tsx` | PASS |
| DEMO-02 French correction reason appeared in Arabic detail | Administrative review seed value was rendered directly | Exact seed correction reason mapping | `workspace-screen.test.tsx` | PASS |
| DEMO-03 and other seeded review comments could remain French | Direct review comment rendering | Exact seed review comment mapping | Source and workspace tests | PARTIAL |

## 5. Android build and APK evidence

Build:
- `android/gradlew assembleDebug`: **BUILD SUCCESSFUL**

Final APK:
- Path: `android/app/build/outputs/apk/debug/app-debug.apk`
- SHA-256: `66FD751D12B44DBA36572A671E196B3F0CE4D281C825EDB77B93B7438B29F216`

Embedded bundle:
- SHA-256: `443761CE2C7DFB70B17E71C7C9E9D6C165F315731E285ABAB02F2B0481E86D1A`

Generated and merged bundle:
- `android/app/build/generated/assets/createBundleDebugJsAndAssets/index.android.bundle`
- `android/app/build/intermediates/assets/debug/mergeDebugAssets/index.android.bundle`
- Both SHA-256: `443761CE2C7DFB70B17E71C7C9E9D6C165F315731E285ABAB02F2B0481E86D1A`

The embedded APK bundle, generated bundle, and merged bundle match byte-for-byte.

Packaged assets confirmed:
- IBM Plex Sans Regular/Medium/SemiBold/Bold
- IBM Plex Sans Arabic Regular/Medium/SemiBold/Bold
- Readex Pro Variable
- SANAD logo and welcome illustration assets

The installed bundle contains the final workspace role-direction implementation and DEMO-02 correction mapping.

## 6. Device screenshots

Actual captures are under:

`docs/screenshots/SANAD_ARABIC_RTL_REMEDIATION/`

Representative evidence:
- `02_welcome_after_wait_fr.png` — final French welcome with SANAD composition
- `03_welcome_ar.png` — Arabic welcome and RTL language selector
- `04_access_ar.png` — Arabic access screen
- `05_demo_roles_ar.png` — Arabic role names and alignment
- `06_workspace_ar.png` — Arabic workspace, card direction, and module composition
- `07_declaration_list_ar.png` — Arabic filters, cards, and seed narratives
- `08_declaration_detail_ar.png` — Arabic declaration detail (pre-correction capture)
- `09_declaration_detail_ar_corrected.png` — corrected DEMO-02 Arabic correction reason
- `10_welcome_restored_fr.png` — locale restored to French

## 7. Runtime typography and icon verification

Typography:
- Source architecture resolves IBM Plex Sans for Latin, IBM Plex Sans Arabic for Arabic, and Readex Pro for headings.
- `AppText` locale-aware font selection and bilingual typography tests pass.
- Android assets are packaged and present in the final APK.
- Exact runtime font-face resolution could not be independently introspected from the emulator. This remains a documented technical limitation; no successful runtime-font claim is made beyond source/package evidence.

Hugeicons:
- Device captures show the existing `AppIcon`/Hugeicons renders for workspace, role, notification, help, profile, shield, lock, and module controls.
- Central registry tests pass.
- A route-by-route rendered inspection remains incomplete outside the captured routes.

## 8. 26-route Android matrix

| # | Route | French | Arabic | English | Device status | Evidence/limitation |
|---|---|---|---|---|---|---|
| 1 | `aesSplash` | PASS | PASS | PARTIAL | PARTIAL | Welcome French and Arabic captured; English source/previous evidence |
| 2 | `aesAccess` | NOT TESTED | PASS | NOT TESTED | PARTIAL | Arabic access captured |
| 3 | `aesLanguageSelect` | PASS | PASS | PARTIAL | PASS | Accessible language selector captured in welcome |
| 4 | `aesDisclaimer` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Route not safely reached |
| 5 | `aesDemoPicker` | PARTIAL | PASS | PARTIAL | PARTIAL | Arabic role picker captured |
| 6 | `aesGuardianWorkspace` | PARTIAL | PASS | PARTIAL | PASS | Arabic workspace captured |
| 7 | `declarations` | PARTIAL | PASS | PARTIAL | PASS | Arabic list/filter/cards captured |
| 8 | `newDeclaration` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Reaching form is read-only but submission mutation prohibited |
| 9 | `declarationDetails` | PARTIAL | PASS | PARTIAL | PASS | DEMO-02 Arabic detail captured |
| 10 | `submissionConfirmation` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Mutation-only confirmation |
| 11 | `adminReviewQueue` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Requires role/navigation pass not completed |
| 12 | `adminReviewAction` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Mutation-only action |
| 13 | `correctionResponse` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Mutation-only response |
| 14 | `ohCoordinationQueue` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached in final pass |
| 15 | `ohCoordinationDetail` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached in final pass |
| 16 | `createCoordination` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Mutation-only creation |
| 17 | `recordFollowUpEvent` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Mutation-only event |
| 18 | `declarationCoordinationStatus` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached safely |
| 19 | `surveillanceDashboard` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached safely |
| 20 | `preventionOverview` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached safely |
| 21 | `preventionRegister` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached safely |
| 22 | `preventionCreate` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Mutation-only creation |
| 23 | `preventionActionDetail` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached safely |
| 24 | `helpGlossary` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached safely |
| 25 | `aesGuardianProfile` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Not reached safely |
| 26 | `notificationCentre` | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Automated tests pass; no final-device capture |

## 9. Automated validation

| Check | Result |
|---|---|
| Complete Jest suite | 52 suites passed; 1152 tests passed |
| Focused final Jest set | 3 suites passed; 46 tests passed |
| TypeScript typecheck | Passed |
| ESLint | 0 errors; 451 warnings |
| `git diff --check` | Passed |
| Android debug APK build | Passed |
| APK/bundle match | Passed byte-for-byte |

## 10. Preservation and cleanup audit

Added:
- `src/localization/demoNarratives.ts`
- RTL remediation screenshots under `docs/screenshots/SANAD_ARABIC_RTL_REMEDIATION/`
- This report

Modified:
- Workspace RTL implementation
- Declaration list RTL and seed narrative presentation
- Declaration detail RTL and seed/review presentation
- Focused workspace and declaration migration tests

No database schemas, persisted records, CAPA workflows, role permissions, or authorization rules were changed. No declaration, review, correction, coordination, follow-up, or CAPA mutation was performed.

## 11. Remaining blockers

- Complete route-by-route device verification was not finished; 19 routes are explicitly NOT TESTED.
- Exact runtime font resolution is not independently inspectable with the available method; this remains a technical limitation.
- System UI emitted an emulator “not responding” prompt once during the booted pass and was handled with Wait.
- English route device coverage remains incomplete outside the welcome and source/localization tests.
- Mutation-only confirmation and creation/action routes cannot be tested under the no-mutation constraint.

## 12. Final disposition

**PARTIAL** — demonstrated Arabic workspace, declaration-list, and declaration-detail defects are fixed and captured on the final APK, and automated regressions pass. Global acceptance remains blocked until the route inventory, remaining mutation-free route passes, and independent runtime font verification are completed.
