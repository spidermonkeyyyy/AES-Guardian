# SANAD — CAPA Recovery Authorization and Feasibility Report

**Prepared:** 2026-11-23  
**Mode:** Read-only planning; no extraction, recovery, integration, or verification runs authorized.  
**Scope:** Historical durable CAPA implementation reported as conditionally accepted by Phase 2E.1.7.2.5.18, current fbbc fragments, and E10 build evidence.

## 1. Executive conclusion

The historical durable CAPA implementation is **recoverable as mapped source text for its principal production modules**, from the existing E10 React Native source map. Direct read-only inspection found the schema-10 `AesGuardianDatabase.ts`, operation utility, types, and all four CAPA screens (`Create`, `Register`, `Overview`, `Detail`) embedded as `sourcesContent`. The map also embeds some shared dependencies, including `DatabaseService`, localization and AppText/AppTextInput/AppIcon components. This confirms more than report claims; it does not prove runtime correctness.

The E10 map is **not a complete reproducible source snapshot**. It omits several relative project imports used by the screens, including core/theme/navigation/component barrel modules, and does not provide repository metadata, package/build configuration, tests, or the complete build-time working tree. Current tracked files are a mix: the utility, types and DatabaseService match the mapped source-content hashes; Register, Overview and Detail also match; the database and Create screen differ. Current UI/theme/core exports are not all the historical variants. Therefore exact recovery of selected module text is feasible, but exact recovery of the complete `.18` source tree and immediate drop-in compatibility are not established.

**Recommendation:** proceed only through staged gates. First preserve/hash all existing evidence (this report records the available hashes). A later, separate authorization must explicitly permit reading the map’s `sourcesContent` into an isolated recovery workspace outside the Desktop working tree. That authorization must specify approved modules and whether a deterministic export is allowed. At that recovery gate, preserve mapped text unchanged; do not integrate or adapt it. Compatibility analysis and implementation require separate authorization. Native crypto, op-sqlite transactions, actual concurrency, physical restart/recovery, and device UI/accessibility validation remain necessary before acceptance.

No project file, Git ref/index, build artifact, APK, emulator state, or evidence file was changed during this planning investigation. No tests/builds/migrations were run.

## 2. Evidence preservation and hash inventory

Paths below are absolute Windows paths. SHA-256 values were computed by direct local file hashing. “Mapped text hash” is SHA-256 over UTF-8 bytes of the parsed source-map `sourcesContent` string; it is not a hash of an original standalone source file’s historical byte encoding/line endings.

### 2.1 E10 artifact set

| Evidence | Absolute path | Size | SHA-256 | State |
|---|---|---:|---|---|
| E10 APK | `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\isolated-build\_app\outputs\apk\debug\app-debug.apk` | 183,769,733 bytes | `A7C8DCB6428F565F16983D5B340D9E79D77CEF4214C8D5FA1D031A158F02C829` | Present; matches prior forensic report hash. |
| E10 JS bundle | `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\isolated-build\_app\generated\assets\createBundleDebugJsAndAssets\index.android.bundle` | 2,357,228 bytes | `8B5631144A1FA9B7A2F54B8928909602910F06C6E587A68383434931127A2A21` | Present; same hash as `intermediates\assets\debug\mergeDebugAssets\index.android.bundle`. |
| E10 source map | `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\isolated-build\_app\generated\sourcemaps\react\debug\index.android.bundle.map` | 7,978,892 bytes | `E608BB0744CE48570BDDF3B9EBD99F695C581995887AA13E9B82041B329B435F` | Present; matches prior forensic report hash; 1,104 `sources` and 1,104 `sourcesContent` entries. |

APK hash also matches the installed/saved E10 APK SHA-256 recorded in the prior forensic investigation. No device action was taken here. The APK’s identity/signature metadata are documented in the forensic report; this planning report does not repeat APK parsing.

### 2.2 Reports and current source evidence

| Evidence | Path | Size | SHA-256 | Notes |
|---|---|---:|---|---|
| Historical CAPA reconciliation report | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\docs\SANAD_CAPA_HISTORICAL_IMPLEMENTATION_RECONCILIATION_REPORT.md` | 40,293 bytes | `C9AFE8A3D8655A42F23E86E7081EC207AE9877A7F85C259285635B7D00D72510` | Its external session copy has the same size/hash. |
| Forensic source recovery report | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\docs\SANAD_FORENSIC_SOURCE_RECOVERY_REPORT.md` | 91,041 bytes | `03DBA78B8D3D0F40433962807986F8248A9F1F46D1D37D82DCEC20EC482ADDA4` | Its external session copy has the same size/hash. |
| Current fbbc database | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\core\database\AesGuardianDatabase.ts` | 161,484 bytes | `7915ECEA5E72D6826FF5518845448FAFEECA2736CA68412EFBE05A76E62BC469` | Tracked; HEAD `fbbc94136652bd4f8efe1b8d1fa85e14932692ca`; unchanged relative to prior CAPA reconciliation hash. |
| Current DB types | `...\src\core\database\types.ts` | 25,668 bytes | `570B4810750B2DA5B8E56C0D25A8CAEFDB18A05F0F569D504944BBD5A5BC19C8` | Tracked; includes operation types but no production persistence by itself. |
| Current DB exports | `...\src\core\database\index.ts` | 3,299 bytes | `D41BDE12D46F2C4AD57EA59643552CE19C8B76F0C2A52DF8260B728BCA0FBBB2` | Tracked. |
| Current core exports | `...\src\core\index.ts` | 2,700 bytes | `52D06AB191C002E639CA82379BA2045C3F9B66AE1E22EF8D47E09F09F2D942F9` | Tracked. |
| Current operation utility | `...\src\core\database\capa-operation-utils.ts` | 6,620 bytes | `21732DA9BC4126DBB3D3EBB83ED07572488ABF420C505EF3F5655863862EC90E` | Untracked; content hash matches mapped E10 utility. |
| Current idempotency tests | `...\src\core\database\__tests__\capa-operation-idempotency.test.ts` | 17,359 bytes | `410A1A633C8AC766F141D2CFB0BE59F4FB242DD3885B3BE0C30AB1B9C6715AE6` | Untracked; inspected, not run. |
| Current entropy tests | `...\src\core\database\__tests__\capa-operation-entropy.test.ts` | 2,376 bytes | `06DBFFF8084AC54D27DE1C50013B4FBEDFC531F551D6B64EF2C8FFD64682050B` | Untracked; inspected, not run. |
| Current migration tests | `...\src\core\database\__tests__\migration9.test.ts` | 7,247 bytes | `2312EC4DB6197D55FD9E45F3DE62E68A151DDF0DDE6BD772255A9CA2B22520CC` | Untracked; expects v9/v10 behavior absent from fbbc migrations. |
| Current Create screen | `...\src\features\aes-guardian\screens\PreventionActionCreateScreen.tsx` | 25,803 bytes | `1D19FD3F2D7A441EF45EFB667E9E43A47A1EAFB72B0FF92A14EFB667C4F97B1F` | Tracked; differs from E10 mapped text. |
| Current Register screen | `...\src\features\aes-guardian\screens\PreventionActionRegisterScreen.tsx` | 16,685 bytes | `AF2399DCCF1069AEAC39A5E8B28E198D171649146ADB7376CCA724DF390C27B4` | Tracked; mapped text hash matches. |
| Current Overview screen | `...\src\features\aes-guardian\screens\PreventionOverviewScreen.tsx` | 12,759 bytes | `FA5BD6A5BB9DAA392A61A4691136554ADD760BB627398387955924087771B639` | Tracked; mapped text hash matches. |
| Current Detail screen | `...\src\features\aes-guardian\screens\PreventionActionDetailScreen.tsx` | 25,627 bytes | `A177F52926EFB9E65CC1EC9BB2EB8C8447D7BBD57363EADB33E1B8984A5DA441` | Tracked; mapped text hash matches. |
| Current Create UI test | `...\src\features\aes-guardian\__tests__\prevention-action-create-ui.test.tsx` | 28,239 bytes | `DF87753F665D4357CD3BBA1636620969A2D90400713CE2A345C5528E9977AECF` | Tracked in fbbc; historical assertions are not test execution. |

Here `...` in paths in this table means the exact prefix `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`. Other relevant current files `DatabaseService.ts` and `NativeSQLiteAdapter.ts` are tracked with SHA-256 `DA884A93B65D1755150F72EE6872E3346B191C2095EA6189716848784445DEA7` and `5B492E044579DAEB9E9A53D5DB60EF972CBAD9FC2CF89BD335CB8FF45FE4534`, respectively.

### 2.3 Historical CAPA reports .4–.18

All 15 requested report files exist in the Desktop `docs\` directory. Hashes below were checked directly. The original reports were not rewritten in this investigation.

| Report | Bytes | SHA-256 |
|---|---:|---|
| `AES_GUARDIAN_PHASE2E1_7_2_5_4_DURABLE_CAPA_IDEMPOTENCY_DESIGN.md` | 24,016 | `A00BEA391A2EE3510871B26D5C134F572785B96A43ADD1E9A8A7C77BE790BE2F` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_5_DURABLE_CAPA_OPERATION_IMPLEMENTATION_REPORT.md` | 13,796 | `E0DC8D5C711F96DEC966C0E3CCAC2AF46DD2CE78C6C9053F0A7DF881276417D8` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_6_INDEPENDENT_DURABLE_CAPA_IDEMPOTENCY_AUDIT.md` | 21,977 | `81351794A1DE8FD8C1839D01A0FE2AB2083FE42A40D9D34BF03E08375C0AF9B3` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_7_OPERATION_IDENTITY_AND_COMMITTED_RECOVERY_CORRECTION_REPORT.md` | 11,764 | `32D97C0C5DB1323D6900E076C983B60C8581CB042E4642246816549A66BB73D5` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_8_INDEPENDENT_OPERATION_RECOVERY_ACCEPTANCE_AUDIT.md` | 18,990 | `E7ACBB00DDC6575B46078C3F012C56B080F8B99A5FF458CC074696452C5B381D` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_9_PRESENTATION_ACKNOWLEDGEMENT_AND_UUID_CORRECTION_REPORT.md` | 9,130 | `CDCD941A705A2C9251C07822A67823BD6AA8E49BD564A5414298F9E3307B6187` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_10_INDEPENDENT_UUID_PRESENTATION_AND_RESERVATION_AUDIT.md` | 12,198 | `4892E998073B3C18E749452787BE100A088ED24ACF91CAF35005144E37094A6A` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_11_RESERVATION_INTENT_INSERT_RACE_CORRECTION_REPORT.md` | 6,681 | `2ADD3BEFBD684822D4D843CA9E369CD6766DF56EF116650C6E88F4C2F9D6365E` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_12_INDEPENDENT_RESERVATION_INTENT_INSERT_RACE_AUDIT.md` | 13,513 | `0627D023D5091A23367C00749F05101E063855D833EDB4C1C81A5547B2E4C304` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_13_CREATE_INTENT_LIFECYCLE_CORRECTION_REPORT.md` | 5,730 | `E00AD2D07307419EA540BA499B608C81375AAC8E0334EC7BDCBF5BA495ECBCE5` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_14_INDEPENDENT_CREATE_INTENT_LIFECYCLE_AUDIT.md` | 8,747 | `57C0780212A1B623AF2BF57D067136B24528F0DEA4DC5B289A1A7A99822AC9FB` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_15_CREATE_LIFECYCLE_REGRESSION_EVIDENCE_REPORT.md` | 5,950 | `BA626947998C9427134D3E8948948C7BF8C88543F85F4AFDA412B56D5C7C9EE7` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_16_ACKNOWLEDGED_OPERATION_RETIREMENT_CORRECTION_REPORT.md` | 5,208 | `2826ECAB4066579922EDF11F65B63E501F09305D99F568FEC757052E9770A9C4` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_17_INDEPENDENT_ACKNOWLEDGEMENT_RETIREMENT_AUDIT.md` | 7,594 | `A6D1C1ADB4BCBB04BC3D795134966767ECA99FD3711371921468F7C610F220D0` |
| `AES_GUARDIAN_PHASE2E1_7_2_5_18_INDEPENDENT_CAPA_CROSS_SCREEN_ACCEPTANCE_AUDIT.md` | 9,468 | `0BCE8639197157295A8B6EEF8644532DC0630D44E53550F76029A54E9D503887` |

**Availability/change statement:** None of the specifically enumerated E10 artifacts, historical `.4`–`.18` reports, prior reconciliation/recovery reports, or listed current CAPA source/test files were missing at this check. The APK, bundle, source map, selected current CAPA sources, and historical report hashes match the prior investigation wherever a comparable prior hash was recorded. The current Git status snapshot differs from the prior report (details in §4); no complete previous per-path baseline exists to identify exactly which working-tree entries changed. The E10 map does omit some project import barrels and project/build/test context, which are missing *from the map evidence*, not missing local files in the current repository. No E10 source was extracted.

## 3. E10 source-map module inventory

A read-only in-memory parse enumerated source strings and their embedded source contents; no `sourcesContent` was written to disk. The map contains 1,104 source entries with 1,104 content entries. The seven key CAPA modules follow. Hashes are mapped-text hashes (definition in §2), not recovered-file hashes.

| Module | Source-map `sources` path | Embedded characters | Mapped-text SHA-256 | Assessment |
|---|---|---:|---|---|
| `AesGuardianDatabase.ts` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\core\database\AesGuardianDatabase.ts` | 182,334 | `D0B35ED6CE56C3F621D3240D2F77AB5CE73EF5EE4AEA4E8583761A981B957D9C` | Schema 10, migrations 9/10, reservation/retry, exact reconciliation, recovery, acknowledgement and operation-create code present. |
| `capa-operation-utils.ts` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\core\database\capa-operation-utils.ts` | 6,620 | `21732DA9BC4126DBB3D3EBB83ED07572488ABF420C505EF3F5655863862EC90E` | Complete helper module present; its hash matches current untracked utility. |
| `types.ts` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\core\database\types.ts` | 24,681 | `570B4810750B2DA5B8E56C0D25A8CAEFDB18A05F0F569D504944BBD5A5BC19C8` | Includes operation status/record and DB contracts; mapped hash matches current file despite byte-length difference due source-map text normalization/newline representation. |
| `PreventionActionCreateScreen.tsx` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\features\aes-guardian\screens\PreventionActionCreateScreen.tsx` | 25,795 | `90C2777C5D93DA6D9B94C70C6559267B8F48F8E89006596569F26B2FF2CEE717` | Complete embedded screen, but differs from current fbbc screen. |
| `PreventionActionRegisterScreen.tsx` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\features\aes-guardian\screens\PreventionActionRegisterScreen.tsx` | 16,683 | `AF2399DCCF1069AEAC39A5E8B28E198D171649146ADB7376CCA724DF390C27B4` | Embedded text hash matches current file. |
| `PreventionOverviewScreen.tsx` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\features\aes-guardian\screens\PreventionOverviewScreen.tsx` | 12,757 | `FA5BD6A5BB9DAA392A61A4691136554ADD760BB627398387955924087771B639` | Embedded text hash matches current file. |
| `PreventionActionDetailScreen.tsx` | `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\features\aes-guardian\screens\PreventionActionDetailScreen.tsx` | 25,627 | `A177F52926EFB9E65CC1EC9BB2EB8C8447D7BBD57363EADB33E1B8984A5DA441` | Embedded text hash matches current file. |

The database module imports only `./DatabaseService`, `./types`, and `./capa-operation-utils`; all three are present in the map. The Create screen imports AppTextInput, AppText, AppIcon, React Native, `../../../core`, localization, `../../../theme/tokens`, React Navigation, `../../../navigation/routes`, and `../components`. Of these relative project modules, the map includes AppTextInput, AppText, AppIcon and localization, but not the `core`, theme-token, navigation-route, or AES components barrel modules. The other screens also import the missing core/theme/routes/component barrels. Some individual component source files may be present, but the original barrel export lists are not preserved as a complete set. Package files and tests are not in source-map evidence.

**Feasibility:** mapped source text exists for all seven requested principal modules. The DB’s direct production dependencies are present and matching. Screen module text exists, but some imported integration/barrel context and build/test environment does not. This makes source text recovery feasible, full project reconstruction/reproducible build unproven.


## 4. Current surviving-fragment inventory

Paths prefixed `...` below resolve to `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`. Except where noted, files are current fbbc worktree files; repository HEAD is `fbbc94136652bd4f8efe1b8d1fa85e14932692ca`. SHA values are the current files’ whole-file SHA-256, whereas §3’s hashes are mapped-text hashes.

| File/surface | Path/state | Evidence and usefulness | Compatibility concern |
|---|---|---|---|
| Database service and native adapter | `...\src\core\database\DatabaseService.ts` (tracked; 5,610 bytes; `DA884A93B65D1755150F72EE6872E3346B191C2095EA6189716848784445DEA7`); `...\NativeSQLiteAdapter.ts` (tracked; 2,895 bytes; `5B492E044579DAEB9E9A53D5DB60EF972CBAD9FC2CF89BD335CB8FF45FE4534`) | DB service source is present in E10 map and its mapped hash matches current; transaction/query interfaces and native adapter exist. | Matching wrapper source is not proof of actual SQLite atomicity, uniqueness-race behavior, or native adapter semantics. Confirm transaction API/error mapping and native module versions before integration. |
| Operation helper | `...\src\core\database\capa-operation-utils.ts` (untracked; 6,620 bytes; `21732DA9BC4126DBB3D3EBB83ED07572488ABF420C505EF3F5655863862EC90E`) | Exact mapped source hash; supports ID generation, canonicalization/hash and operation-related validation. | Helper does not provide reservation, persistent state transitions, or transactional atomicity. |
| Domain types | `...\src\core\database\types.ts` (tracked; 25,668 bytes; `570B4810750B2DA5B8E56C0D25A8CAEFDB18A05F0F569D504944BBD5A5BC19C8`) | Contains `CapaCreationOperation`, pending/committed statuses and `acknowledged_at`; embedded hash matches. | Types do not prove DB implementation; exported error types and payload shapes must be checked against the exact recovered DB source. |
| DB/core barrel exports | `...\src\core\database\index.ts`, `...\src\core\index.ts` | Current exports are present; the E10 source map contains database index but not `src\core\index.ts`. | Current root barrel may not export every historical type/class/helper; compare named exports with recovered screen imports. |
| Create screen | `...\src\features\aes-guardian\screens\PreventionActionCreateScreen.tsx` (tracked; 25,803 bytes; `1D19FD3F2D7A441EF45EFB667E9E43A47A1EAFB72B0FF92A14EFB667C4F97B1F`) | Current implementation contains the incomplete integration. Embedded E10 Create source hash differs. | It calls missing DB method `createCapaCreationOperationId()`; current UI components/theme exports may also differ from E10. Preserve current file; do not overwrite as a recovery shortcut. |
| Register/Overview/Detail screens | `...\src\features\aes-guardian\screens\PreventionActionRegisterScreen.tsx`, `PreventionOverviewScreen.tsx`, `PreventionActionDetailScreen.tsx` | Current file hashes equal E10 mapped-text hashes; these screens are likely exact source-text matches after newline handling. | Matching these screen modules does not make the feature operational without DB persistence and current API/export compatibility. |
| UI dependencies | `...\src\components\AppText.tsx` (2,024 bytes; `778F5B88F0A1DF65C61FF2957C92671186A2B63D97B9D4415131CB5CFF3EAB58`), `AppTextInput.tsx` (1,622 bytes; `1EF7CA382F21EE91A3FB003649E77069AE5CB6547CDD7AB888534BE5B3774795`), `AppIcon.tsx` (10,132 bytes; `C21F24FFB74185831B9770DF7AF7B8F0684655697998CF62372457EC4DEF5137`) | These files exist in current worktree and corresponding module paths appear in the E10 map. | Other shared component and theme dependencies are not fully inventoried as historical source; the embedded screens may rely on barrel-exported component behavior and styles. |
| Project context | `...\src\theme\tokens\index.ts` (1,437 bytes; `D9D30E7F1BB55017583528A76DA1C708FDC46704EAADEFE7413D6A4EB5DBD062`), `...\src\navigation\routes.ts` (2,405 bytes; `B8535FF49744BCCB4A581E7B3AEA4F7D9046669499DD66D03EA822F7633A7AF1`), `...\src\features\aes-guardian\components\index.ts` (943 bytes; `50200066ECDBBBEF55F06EDC5F3077842AE1B4C87BEF6654F49DC0B62848D141`); `package.json` (1,989 bytes; `2FD945F4501078F059B21C7F5D9FED1722E65C43F0E71D42F65991E457232640`), `tsconfig.json` (587 bytes; `EFF87880F783BF6A8DF51DEBCE3AFCB94DFFA6F3EF18A3F75ACAF72B127C14F9`), `babel.config.js` (123 bytes; `B16E8BB5531408366FCF43E7A9A072C8E23B8E6D99311E446C657EF3ED8B6842`) | Current project/build configuration exists. | These are current fbbc artifacts, not proven E10 build-time versions. E10 map does not preserve the missing barrels or these build manifests. A reproducible historical build cannot be claimed from them. |
| Tests | `...\src\core\database\__tests__\capa-operation-idempotency.test.ts`, `capa-operation-entropy.test.ts`, `migration9.test.ts`; Create UI test under `...\src\features\aes-guardian\__tests__\prevention-action-create-ui.test.tsx` | Preserve useful behavioral expectations and historical correction scenarios. | Untracked tests are not production code, and their mocks may mask absent production methods. No tests were run under the current no-execution authorization. |

**Git-state caution:** the current worktree was already dirty at inspection. `git status --short` showed changes/deletions under `android\.gradle` and `android\compat\build`, plus numerous untracked configuration, evidence, documentation, font, and source/test files. This report does not attribute or alter any such changes. HEAD remained fbbc. The worktree must be preserved exactly; no cleanup/checkout/stash should be attempted as part of recovery. At this check, `git status --short` reported 158 entries: 17 modified tracked files, 6 deleted tracked files, and 135 untracked files (0 added-to-index entries). The prior CAPA reconciliation report records 275 entries (17 modified, 6 deleted, 252 untracked); therefore the worktree status snapshot differs since that observation. The earlier report did not preserve a complete per-path/hash baseline, so the exact paths that disappeared/appeared or whether any unrelated evidence files changed cannot be established from the available comparison. Hashes for the APK, bundle, source map, selected current CAPA files and historical report set match the values recorded in the prior investigation where comparable; the hashes for other current dependencies are newly recorded here. No project edits were made by this planning task.

## 5. Mapping against audit .18

Audit `.18` is a conditional source-level cross-screen acceptance. The mapping below distinguishes source-map presence from runtime evidence and does not upgrade the audit’s conditional status.

| .18 concern/requirement | E10 embedded-source evidence | Classification | Remaining evidence needed |
|---|---|---|---|
| Stable UUID-v4 identity per logical operation; strict validation/fail-closed entropy | Operation helper and DB source are present; helper hash matches current. Historical corrections `.7`/`.9` and audit `.18` describe strict UUID behavior. | **Directly represented in embedded source** | Exercise on target RN runtime, including unavailable/weak entropy and malformed UUID output. |
| Stable ID across same-operation retry; explicit `new` versus `retry` | DB and Create screen source present; explicit lifecycle was corrected in `.11`/`.13`. | **Directly represented in embedded source** | Verify behavior against exact test revision and native UI runtime. |
| Reservation persistence, unique operation/reference constraints, one pending operation per creator | E10 database module includes migration 9 and reservation implementation. | **Directly represented in embedded source** | Apply migrations against existing schema-8 database; verify SQLite indexes and actual write-conflict behavior. |
| Correct handling of operation-ID insert race; a `new` request cannot be adopted as a `retry` | Database code and Create source are embedded; corrected logic is described by `.11`–`.13`. | **Directly represented in embedded source** | True concurrent/two-connection native tests; report-based injected tests are not a substitute. |
| Atomic CAPA + creation audit + notification + operation commit | E10 DB code contains operation creation and transactional writes. | **Directly represented in embedded source** | Native op-sqlite commit/rollback fault tests and consistency verification for all four records. |
| Recovery after failed/ambiguous commit or restart; pending and committed-unacknowledged discovery | E10 DB/list/reconcile code and Create screen recovery paths are embedded. | **Directly represented in embedded source** | Kill/relaunch on device at transaction boundaries; prove operation/capa/audit/notification consistency. |
| Exact reconciliation and idempotent retry; reject creator/payload/evidence mismatch | E10 DB/helper/types and utility source are embedded. | **Directly represented in embedded source** | Re-run exact historical cases in current adapter and native database; establish how persisted corrupt rows fail closed. |
| Explicit result presentation acknowledgement, persistence and retirement; fresh ID only after ack | E10 DB and Create screen include acknowledgement path, and migration 10. `.16`/`.17` address retirement. | **Directly represented in embedded source** | Test actual visible presentation, user action, app termination, acknowledgement failure/retry, and next submit on device. |
| Cross-screen consistency and role boundaries | Four CAPA screen modules and database source are embedded; `.18` claims cross-screen source acceptance. | **Partially represented** | Core/navigation/component barrels and role-store implementations are absent from this map set; UI flows and authorization must be revalidated against current architecture. |
| Migration 9/10 schema and data preservation | Embedded database source has schema 10 and migrations 9/10. | **Directly represented in embedded source** | Native SQLite migration tests with schema-8, schema-9, legacy CAPA rows, pending/committed operation rows, and rollback failure. |
| Audit-event and notification integrity | E10 DB creation transaction contains event/notification writes and operation linkage. | **Directly represented in embedded source** | Verify native transaction and row-level invariants; no runtime validation performed. |
| RTL/accessibility and native UI behavior | Screen source includes layout/label logic by audit/report claim; full surrounding component sources are not all in the map. | **Partially represented; dependent on native/runtime verification** | Device/emulator RTL visual assertions, TalkBack/VoiceOver labels/focus order, screen-reader confirmation/ack flow. |
| Exact equivalence to the `.18` accepted source snapshot | `.18` describes the accepted state; E10 module text has expected schema and lifecycle, but no original source-file hashes or exact source manifest tie it to the audit. | **Impossible to establish from current evidence** | Historical source snapshot/tree hash or audit-attached source hashes and test artifacts. |
| Reproducible E10 build from mapped modules | Map contains mapped source text, but not full source tree, all barrels, package lock, native configs, exact dependency state or build command. | **Dependent on missing source** | Recover missing dependencies/config from authenticated original build input or rebuild under a separately documented, adapted source tree. |

## 6. Recovery feasibility assessment

1. **Can the DB module be recovered as exact source text?** The map contains the complete 182,334-character `AesGuardianDatabase.ts` `sourcesContent`, including its direct DB helper/type imports and schema 10. A deterministic UTF-8 export of that string is feasible if separately authorized. Exact historical original-file bytes (encoding and line-ending form) are not proven by a parsed source-map string alone; the reported hash is explicitly a hash of the source-content string.
2. **Can related CAPA screens/support modules be recovered?** Yes for the four screens, operation utility, types, and some dependencies listed in §3. The map contains source content for these paths. That is module-text availability, not a complete project snapshot.
3. **Which are self-contained?** The utility is comparatively self-contained. DB’s immediate imports (`DatabaseService`, `types`, utility) are in the map. Screen modules are not self-contained: their core exports, navigation types, theme tokens, component barrels, state/role hooks and multiple shared components form dependency chains. Several imported barrel modules are absent from the source map.
4. **Can it be integrated without overwriting unrelated work?** Not proven. It is technically possible to stage recovered files in a separate workspace and design a minimal port. Direct replacement in fbbc is unsafe: the worktree is dirty; historical DB imports, types, UI, schema and current architecture may not line up. No integration can be planned reliably until exact API/export diffs, migration assumptions, tests, and current local edits are reconciled.
5. **Which fragments should be preserved?** Preserve all current tracked and untracked DB, helper, type, screen, test, service, and migration evidence. The helper/types and three non-Create screens match map hashes; tests encode valuable behavior but remain unrun. Do not select or discard files solely by tracked/untracked status.
6. **Compatibility investigations needed:** Compare DB method signatures and `DatabaseService.transaction` contract; database table names/indexes/foreign keys; existing error types; root export surfaces; generated reference-code behavior; database reset order; role/store APIs; localization keys; component props; navigation route names; themes/spacing and RTL helpers; SQLite adapter exception/insert-ID semantics; migration runner versioning and transaction model. Check if migration 9/10 conflicts with any later schema migration in fbbc.
7. **What prevents a reproducible build now?** Missing E10 build-time package manifests/lockfile and native configuration linkage, omitted barrel/dependency source, no exact source tree/commit, no exact historical test sources/artifacts, and no proven build command/environment. Existing current fbbc manifests/config do not establish the E10 build input. An adapted project may build, but it would not be an exact historical recovery.
8. **What proves match to `.18`?** Ideally the complete `.18` source archive or commit/tree; otherwise authenticated per-file hashes plus the exact audit test suite/configuration and run outputs, followed by source diff of every relevant module. The current source map can establish content inclusion and semantic features, but not exact audit-to-build correspondence.
9. **Native/runtime work still required:** execute migrations 8→9→10 on representative DBs; verify operation uniqueness and insert-race handling on native SQLite; transaction rollback/commit ambiguity across CAPA/audit/notification/operation rows; entropy/UUID generation on RN; process death/restart before and after commit and before/after acknowledgement; retry and duplicate prevention; cross-screen navigation; authorization; accessibility/RTL on actual platform; fresh install/upgrade regression and backup/restore expectations. Historical Jest/Node-adapter results do not cover these.

**Overall feasibility:** high for preserving/exporting selected mapped source strings after approval; moderate for a minimal compatibility port after a dedicated comparison; low for reconstructing the exact original project/build; not established for runtime correctness or exact `.18` identity.

## 7. Proposed isolated recovery architecture

If authorized, create a **new, explicitly named recovery workspace outside** `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`, for example `C:\Users\User\.copilot\session-state\a5296a0a-6b0a-4ce3-a007-4f338ec20fed\files\capa-recovery\`. Keep the original E10 APK/map and current repository read-only. Use an evidence input manifest that records source path, input hash, source-map `sources` index/path, mapped-text hash algorithm, extraction script/tool version, output encoding/line endings, output hash and timestamp. Store exported modules under a quarantined `recovered-source\` tree mirroring `src\...`; keep a separate `analysis\` area for diffs/dependency findings. Do not place that tree on the app’s module resolution path and do not point builds at it at Gate B. Gate C creates comparison artifacts outside the repository. Gate D may propose a compatibility branch/worktree only after separate authorization and explicit treatment of the dirty Desktop state; no current file should be overwritten by default.

This layout preserves a distinction between **exact source-map text recovery** and **compatibility adaptation**. A later adapted source file must be labeled as adapted and retain a link/hash to its mapped source ancestor; it must not be presented as exact historical source.

## 8. Non-destructive recovery gates

### Gate A — Evidence preservation

- **Prerequisites:** Identify authorized local evidence paths; user has approved read-only hashes/metadata only. Current task permits this.
- **Permitted:** Read/hash existing APK, bundle, source map, relevant reports and candidate files; record provenance, sizes, timestamps and current Git status; compare against previous hashes when available.
- **Prohibited:** Extract `sourcesContent`; write a manifest into repository; alter any file/Git state; build, test, migrate, install, or decompile.
- **Required evidence:** This report’s inventory; hashes for every selected input; explicit missing/change list; confirmation worktree remains as found.
- **Status:** **Planning evidence recorded.** Universal hash comparison for every dirty worktree path was not available, so claim only the artifact/source hashes directly checked.

### Gate B — Isolated source recovery

- **Prerequisites:** A *separate explicit user authorization* naming the source-map path, approved module paths, recovery destination outside the repository, whether exact parsed `sourcesContent` export is permitted, and whether source-map text can be written as files. This current authorization does not cover extraction.
- **Permitted after approval:** Parse the existing map locally; export only approved module strings unchanged to the isolated recovery directory; record provenance and hashes. Do not load/save via tooling that normalizes line endings without documenting it.
- **Prohibited:** Integration, adaptation, copying into Desktop/repository/worktrees, build/test, regenerating source, or overwriting evidence.
- **Required evidence:** Immutable input hash; module entry path/index; exact source-content hash; extraction procedure/tool version; output hash and encoding/line-ending note; read-only diff or round-trip check showing output text equals parsed `sourcesContent`.

### Gate C — Historical source comparison

- **Prerequisites:** Gate B complete; user authorizes read-only comparison. Preserve recovered files as immutable inputs.
- **Permitted:** Compare recovered text to `.18` requirements, current fragments, DB service/schema/types, and available tests; create external diff/dependency inventory; classify exact match vs semantic match vs adaptation needed.
- **Prohibited:** Editing recovered source, merging it into the app, changing project state, or claiming test/audit acceptance from source inspection alone.
- **Required evidence:** File-level comparison matrix; module/import graph; migration diff; operation state/invariant matrix; unresolved assumptions and precise evidence chain to `.18`.

### Gate D — Compatibility and integration design

- **Prerequisites:** Gate C complete; user separately authorizes design of integration in the current architecture. Any code-writing authorization must be distinct and explicit.
- **Permitted:** Propose smallest integration shape, migration sequencing, API adapters and tests; identify isolated branch/worktree strategy if later approved; account for all current dirty changes without resetting or replacing them.
- **Prohibited during design-only approval:** Editing production source, running migrations/builds/tests, committing, or mutating current Git refs/index.
- **Required evidence:** File-by-file change plan; schema/data migration and rollback plan; preservation plan for unrelated work; compatibility risk sign-off; revised acceptance criteria.

### Gate E — Verification and acceptance

- **Prerequisites:** Separate implementation approval and an agreed isolated implementation location; test execution and, if desired, device installation explicitly authorized.
- **Permitted only to the approved extent:** Targeted unit/integration/migration tests, static checks/build, native device testing and controlled failure injection.
- **Prohibited unless separately authorized:** Installing/replacing current APK, database-destructive tests on real user data, modifying evidence artifacts, or publishing/releasing.
- **Required evidence:** Test code and exact command/version; pass/fail logs; schema upgrade fixtures; native transaction/concurrency/restart evidence; device UI/accessibility results; source-to-`.18` traceability; deviations labeled as adaptation, not historical recovery.
- **Acceptance criteria:** no duplicate CAPA for same operation; distinct operation IDs remain distinct; no false replay on same reference/payload; CAPA/audit/notification/operation linkage atomic; retries recover exact committed result or preserve uncertainty; restart-safe pending/committed recovery; acknowledgement only after explicit visible confirmation; failed acknowledgement preserves retry/recovery; fresh operation ID after successful acknowledgement; migration 8→10 preserves legacy and operation rows; correct role enforcement; UI cross-screen/RTL/accessibility passes on supported native platform.

## 9. Risks and unresolved questions

- The E10 map’s embedded module text may be earlier/later than the exact `.18` accepted source. There are no standalone `.18` source hashes or complete source snapshot to prove identity.
- Source-map mappings may represent transformed/normalized source content; module text is recoverable, but original byte-for-byte file encoding/newlines are not assured.
- Current Git working tree is extensively dirty with unrelated generated artifacts and untracked files. Any later integration must avoid replacement or cleanup and should use an isolated location.
- Some current fragments hash-match the map but still depend on missing historical barrel exports and other dependencies.
- Migration 9/10 might conflict with intervening fbbc schema changes not visible in the historical module; complete migration path needs diffing.
- Historical audit results are report statements, not independently rerun. “Independently audited” means the named report states it performed an independent audit; it is not runtime assurance for current code.
- Native op-sqlite, crypto, concurrency and process death behavior remain unverified.
- Exact .18 test fixture/runner versions and output artifacts were not preserved in the inspected source map.
- A standalone recovered module set could compile only after compatibility changes; such changes would be adaptations and could not be described as exact recovery.

## 10. Required user authorization

**No source extraction or implementation is authorized by the current request.** Before Gate B, the user must explicitly authorize all of the following in a separate instruction:

1. Read the existing E10 map at the exact path in §2.1 as a recovery source.
2. Extract only the named module paths in §3 (or list a narrower approved subset) from `sourcesContent`.
3. Write those unchanged mapped text strings only to an isolated directory outside the Desktop project, specifying or approving `C:\Users\User\.copilot\session-state\a5296a0a-6b0a-4ce3-a007-4f338ec20fed\files\capa-recovery\` as the destination.
4. Permit recording external provenance/hash data and explicitly keep integration, adaptation, builds/tests, repository changes, APK changes and device operations out of scope.

**Exact next action requiring authorization:** authorize Gate B’s isolated export of the listed E10 `sourcesContent` module strings to the external recovery directory, or specify an approved narrower module list/destination. Until that is stated, stop here; do not extract, reconstruct, adapt, copy or integrate source.

## 11. Deliverable disposition

This report is saved outside the project repository at:

`C:\Users\User\.copilot\session-state\a5296a0a-6b0a-4ce3-a007-4f338ec20fed\files\SANAD_CAPA_RECOVERY_AUTHORIZATION_AND_FEASIBILITY_REPORT.md`

The report is external as the explicit task requires; it was not copied into `docs\`. The report document itself is new external planning output, not project evidence. The source-map content, APK, bundle, historical reports, current source, and Git state remain unmodified by this work.