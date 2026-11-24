# SANAD — CAPA Recovery Gate B Export Report

**Export time:** 2026-11-23T21:54:55.424Z  
**Scope:** Gate B only; seven explicitly approved source-map modules exported unchanged. No integration, adaptation, builds, tests, migrations, formatter, device operation, or repository write was performed.

## Source evidence

- Source map: `C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Phase2E10-20261122-1519\isolated-build\_app\generated\sourcemaps\react\debug\index.android.bundle.map`
- Input size: 7978892 bytes
- Input SHA-256: `E608BB0744CE48570BDDF3B9EBD99F695C581995887AA13E9B82041B329B435F`
- Post-export source-map SHA-256: `E608BB0744CE48570BDDF3B9EBD99F695C581995887AA13E9B82041B329B435F`
- Source-map JSON parsed as UTF-8; each selected `sourcesContent` string was matched by its exact `src/...` suffix and source index.

## Export and verification manifest

| # | Recovered path | Source index and path | Mapped-text SHA-256 | Output SHA-256 | Bytes | Encoding / line endings | Exact match |
|---:|---|---|---|---|---:|---|---|
| 1 | `recovered-source/src/core/database/AesGuardianDatabase.ts` | 916: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\core\database\AesGuardianDatabase.ts` | `D0B35ED6CE56C3F621D3240D2F77AB5CE73EF5EE4AEA4E8583761A981B957D9C` | `D0B35ED6CE56C3F621D3240D2F77AB5CE73EF5EE4AEA4E8583761A981B957D9C` | 186686 | UTF-8 no BOM; CRLF 4612, LF 0, CR 0; final newline true | PASS |
| 2 | `recovered-source/src/core/database/capa-operation-utils.ts` | 917: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\core\database\capa-operation-utils.ts` | `21732DA9BC4126DBB3D3EBB83ED07572488ABF420C505EF3F5655863862EC90E` | `21732DA9BC4126DBB3D3EBB83ED07572488ABF420C505EF3F5655863862EC90E` | 6620 | UTF-8 no BOM; CRLF 194, LF 0, CR 0; final newline true | PASS |
| 3 | `recovered-source/src/core/database/types.ts` | 915: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\core\database\types.ts` | `570B4810750B2DA5B8E56C0D25A8CAEFDB18A05F0F569D504944BBD5A5BC19C8` | `570B4810750B2DA5B8E56C0D25A8CAEFDB18A05F0F569D504944BBD5A5BC19C8` | 25668 | UTF-8 no BOM; CRLF 779, LF 0, CR 0; final newline true | PASS |
| 4 | `recovered-source/src/features/aes-guardian/screens/PreventionActionCreateScreen.tsx` | 1091: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\features\aes-guardian\screens\PreventionActionCreateScreen.tsx` | `90C2777C5D93DA6D9B94C70C6559267B8F48F8E89006596569F26B2FF2CEE717` | `90C2777C5D93DA6D9B94C70C6559267B8F48F8E89006596569F26B2FF2CEE717` | 25795 | UTF-8 no BOM; CRLF 670, LF 2, CR 0; final newline true | PASS |
| 5 | `recovered-source/src/features/aes-guardian/screens/PreventionActionRegisterScreen.tsx` | 1094: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\features\aes-guardian\screens\PreventionActionRegisterScreen.tsx` | `AF2399DCCF1069AEAC39A5E8B28E198D171649146ADB7376CCA724DF390C27B4` | `AF2399DCCF1069AEAC39A5E8B28E198D171649146ADB7376CCA724DF390C27B4` | 16685 | UTF-8 no BOM; CRLF 528, LF 1, CR 0; final newline true | PASS |
| 6 | `recovered-source/src/features/aes-guardian/screens/PreventionOverviewScreen.tsx` | 1095: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\features\aes-guardian\screens\PreventionOverviewScreen.tsx` | `FA5BD6A5BB9DAA392A61A4691136554ADD760BB627398387955924087771B639` | `FA5BD6A5BB9DAA392A61A4691136554ADD760BB627398387955924087771B639` | 12759 | UTF-8 no BOM; CRLF 376, LF 1, CR 0; final newline true | PASS |
| 7 | `recovered-source/src/features/aes-guardian/screens/PreventionActionDetailScreen.tsx` | 1092: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\src\features\aes-guardian\screens\PreventionActionDetailScreen.tsx` | `A177F52926EFB9E65CC1EC9BB2EB8C8447D7BBD57363EADB33E1B8984A5DA441` | `A177F52926EFB9E65CC1EC9BB2EB8C8447D7BBD57363EADB33E1B8984A5DA441` | 25627 | UTF-8 no BOM; CRLF 691, LF 2, CR 0; final newline true | PASS |

For every file, verification read the written bytes, decoded them as UTF-8, compared the decoded string strictly with the parsed `sourcesContent`, and compared SHA-256 of UTF-8 output bytes with SHA-256 of the UTF-8 mapped string. No line-ending conversion or final newline was added. Full per-file provenance is in `provenance-manifest.json`.

## Project and Git state

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- HEAD before/after: `fbbc94136652bd4f8efe1b8d1fa85e14932692ca` / `fbbc94136652bd4f8efe1b8d1fa85e14932692ca`
- `git status --porcelain=v1 -z` SHA-256 before/after: `24900DC882B7CC8532133CB4AE448FD624C11D62E39886816DBF59C41C116678` / `24900DC882B7CC8532133CB4AE448FD624C11D62E39886816DBF59C41C116678`
- `git status --short` entry count before/after: 159 / 159
- Git state comparison: UNCHANGED. No Git write/remote command was used.
- Desktop project, worktrees, Git refs/index, APK, bundle, source map, historical reports, and other evidence were not modified by the Gate B export.

## Errors and disposition

- Errors: none.
- Seven of seven approved modules exported; seven of seven exact parsed-string checks passed.
- Gate B complete. No Gate C comparison or other follow-on action performed. Awaiting separate user authorization.
