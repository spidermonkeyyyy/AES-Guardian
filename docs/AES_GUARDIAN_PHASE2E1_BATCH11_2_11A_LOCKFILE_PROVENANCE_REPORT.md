# AES Guardian - Phase 2E.1 Batch 11.2.11A

## Read-Only Lockfile Hash Provenance Confirmation

**Recommendation: `BLOCKED — ACTUAL LOCKFILE DIFFERENCE`**

## Repository Identity

Commands and outputs:

```text
git rev-parse --show-toplevel
C:/Users/User/Desktop/sure/AES-Guardian-phase0.2

git branch --show-current
migration/aes-guardian

git rev-parse HEAD
c81a50c98e4e7330fad479a51a48a2fea7f912a1

git rev-parse 'HEAD^{tree}'
983733927b18bf30b8377f84c9c1813c74c4bf6b

git write-tree
983733927b18bf30b8377f84c9c1813c74c4bf6b
```

The branch, HEAD, committed tree, and index tree match the expected repository identity.

## Independent Byte and SHA-256 Results

The working file was read as bytes. The committed blob was captured from `git cat-file blob HEAD:package-lock.json`, and the index blob was captured from its object ID. Node's built-in `crypto` module hashed all byte buffers in memory; no extraction file or temporary file was created.

Exact hashing command:

```powershell
node -e "const fs=require('fs'),c=require('crypto'),cp=require('child_process'); const git=(...a)=>cp.execFileSync('git',a); const h=b=>c.createHash('sha256').update(b).digest('hex').toUpperCase(); const w=fs.readFileSync('package-lock.json'), head=git('cat-file','blob','HEAD:package-lock.json'), oid=git('rev-parse',':package-lock.json').toString().trim(), idx=git('cat-file','blob',oid); console.log(JSON.stringify({worktree:{bytes:w.length,hash:h(w),blob:git('hash-object','--no-filters','package-lock.json').toString().trim()},head:{bytes:head.length,hash:h(head)},index:{oid,bytes:idx.length,hash:h(idx)},equal:{worktreeHead:w.equals(head),worktreeIndex:w.equals(idx),headIndex:head.equals(idx)}}));"
```

```text
{"worktree":{"bytes":500045,"hash":"59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667","blob":"0f59eeefa229c4dc3995a7ec5ac38502ed07e725"},"head":{"bytes":487307,"hash":"3435E772F246EC829E59102346F6A02A88C003C9A62290EBEF1846589F3F9044"},"index":{"oid":"e397c195e4e22231204add4fdfafb1ba50219736","bytes":487307,"hash":"3435E772F246EC829E59102346F6A02A88C003C9A62290EBEF1846589F3F9044"},"equal":{"worktreeHead":false,"worktreeIndex":false,"headIndex":true}}

Get-FileHash -Algorithm SHA256 package-lock.json (before Node calculation)
59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667

Get-FileHash -Algorithm SHA256 package-lock.json (after Node calculation)
59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667
```

All three SHA-256 strings are 64 hexadecimal characters. The blob IDs are Git object IDs; the reported SHA-256 values are computed over the raw file/blob bytes.

## Canonical and Prior-Report Comparison

Canonical value established in `docs/AES_GUARDIAN_PHASE0_3_LOCAL_BASELINE_VERIFICATION.md`:

`59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

The Phase 0.3 report records this value before and after `npm ci`. It matches the current working-tree lockfile, but not the committed/index blob.

The Batch 11.2.11 OH Queue report records:

`59DA2C875354DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

That value is a transcription omission of `6` from the established working-tree digest. It does not match the current on-disk file.

The earlier Batch 11.1.2B provenance report associates the canonical digest and 500045-byte length with HEAD blob `e397c195e4e22231204add4fdfafb1ba50219736`. Directly recalculating that same committed/index blob yields 487307 bytes and SHA-256 `3435E772F246EC829E59102346F6A02A88C003C9A62290EBEF1846589F3F9044`; therefore, that earlier committed-blob claim is inconsistent with the immutable Git object contents.

## Git Status and Difference

Read-only checks produced:

```text
git status --short -- package-lock.json
(no output)

git status --porcelain=v2 -- package-lock.json
(no output)

git diff --no-ext-diff --name-status -- package-lock.json
(no output)

git diff-index --name-status HEAD -- package-lock.json
(no output)

git ls-files -v -- package-lock.json
H package-lock.json

git ls-files --debug -- package-lock.json
size: 500045
flags: 0
```

`git hash-object --no-filters package-lock.json` returns `0f59eeefa229c4dc3995a7ec5ac38502ed07e725`, whereas the index/HEAD object ID is `e397c195e4e22231204add4fdfafb1ba50219736`. The byte buffers also compare unequal. Thus the absence of a status/diff entry does not establish content equality. The index entry has no assume-unchanged or skip-worktree flags (`H`, `flags: 0`); the lockfile's cached stat data reports the working size, while the indexed Git blob contains different bytes.

## Conclusion

- HEAD and index lockfile contents are identical to each other.
- The working-tree lockfile differs in bytes, length, Git blob ID, and SHA-256 from both HEAD and index.
- The working-tree digest matches the Phase 0.3 canonical value.
- The Batch 11.2.11 report has a transcription omission; its hash does not match the current working-tree digest.
- The committed/index digest is distinct from the Phase 0.3 canonical value.
- The historical point at which the working-tree bytes diverged is not established by the available local evidence.
- The working-tree lockfile was not modified during this diagnostic; its hash was equal before and after the in-memory comparison.

The report contains a transcription error, and there is also an actual working-tree-versus-committed/index lockfile difference. Therefore the issue cannot be classified as transcription-only. Do not repair or reconcile it under this read-only authorization.

## Preservation and Local-Only Confirmation

No source, test, lockfile, index, ref, or other Git state was changed. The only created file is this expressly authorized report. No remote access, fetch, pull, push, merge, synchronization, dependency installation, emulator launch, or destructive Git operation occurred.
