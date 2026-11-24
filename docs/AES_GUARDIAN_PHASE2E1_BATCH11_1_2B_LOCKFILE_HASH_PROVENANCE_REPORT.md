# AES Guardian - Phase 2E.1 Batch 11.1.2B

## Lockfile Hash Provenance Report

**Recommendation: `RESOLVED - CANONICAL HASH WAS MISRECORDED`**

## Repository Identity

- Repository root: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Package-lock status: clean and unchanged

The repository identity is confirmed. The index-tree string in this report body was corrected independently against Git output.

## Committed Lockfile

The committed version was extracted from `HEAD:c81a50c98e4e7330fad479a51a48a2fea7f912a1` using `git archive` and hashed outside the repository.

- Source commit: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Source blob: `e397c195e4e22231204add4fdfafb1ba50219736`
- Committed SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- Length: 64 characters
- Hexadecimal-only: Yes
- Committed byte length: 500045 bytes

## Working-Tree Lockfile

- Working-tree SHA-256: `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- Length: 64 characters
- Hexadecimal-only: Yes
- Working-tree byte length: 500045 bytes

## Byte and Git Comparison

- Committed bytes match working-tree bytes: Yes
- Git reports `package-lock.json` modified: No
- Git working blob: `e397c195e4e22231204add4fdfafb1ba50219736`
- HEAD blob: `e397c195e4e22231204add4fdfafb1ba50219736`
- Blob identities match: Yes
- Committed SHA-256 matches working-tree SHA-256: Yes
- Historical canonical SHA-256: `59DA2C875354DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- Canonical SHA-256 matches either committed or working value: No

## Historical Provenance

The earliest local evidence found for the independently verified hash is the Phase 0.3 baseline report:

- `docs/AES_GUARDIAN_PHASE0_3_LOCAL_BASELINE_VERIFICATION.md`
- Date: 2026-11-18
- It reports `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667` before and after `npm ci`.
- The report also states that no lockfile or manifest changed.

The earliest local evidence found for the misrecorded canonical hash is later project evidence:

- `docs/AES_GUARDIAN_PHASE2E1_BATCH11_0_5_FINAL_WORKSPACE_BADGE_ACCEPTANCE_AUDIT.md`
- `docs/AES_GUARDIAN_PHASE2E1_BATCH11_1_SHARED_RTL_LAYOUT_DIRECTION_REPORT.md`

Those later reports omit the `6` after `354` and repeat the incorrect value.

Earlier 11.0 reports and many subsequent reports consistently use the independently verified `...3546DB...` value. The canonical ledger is therefore not supported by the committed file, working file, or earliest available Phase 0.3 evidence.

## Discrepancy Explanation

The canonical hash `59DA2C875354DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667` is a transcription omission of `6`: the verified digest is `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`.

The lockfile itself was not modified by any investigated phase. It is byte-for-byte identical between HEAD and the working tree and remains clean relative to Git.

## Ledger Correction

The historical project ledger should be corrected to:

`59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

This correction is supported by:

1. An independent SHA-256 of the on-disk file.
2. SHA-256 of an external archive extraction of `HEAD:package-lock.json`.
3. Matching Git blob identities.
4. Phase 0.3 evidence recorded before and after `npm ci`.

## Preservation

No source, test, report, lockfile, dependency, configuration, ref, index, or Git state was changed during this provenance investigation.
