# AES Guardian - Phase 2E.1 Batch 11.2.11B

## Read-Only Git Index and Lockfile Metadata Forensics

**Final recommendation: `CAUSE ESTABLISHED — PRESERVATION BASELINE EXPLAINED`**

## Scope and Repository Identity

All commands were read-only. Git status checks used `--no-optional-locks`; no index refresh or Git metadata write was requested.

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

Repository identity matches the expected values.

## Working-Tree Filesystem Metadata

Commands:

```powershell
Get-Item package-lock.json | Format-List FullName,Length,CreationTimeUtc,LastWriteTimeUtc,Attributes
fsutil.exe file queryfileid C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\package-lock.json
node -e "const fs=require('fs'),s=fs.statSync('package-lock.json',{bigint:true}); console.log(JSON.stringify({size:s.size.toString(),dev:s.dev.toString(),ino:s.ino.toString(),mode:s.mode.toString(8),ctimeNs:s.ctimeNs.toString(),mtimeNs:s.mtimeNs.toString(),birthtimeNs:s.birthtimeNs.toString()}));"
```

Relevant outputs:

```text
FullName         : C:\Users\User\Desktop\sure\AES-Guardian-phase0.2\package-lock.json
Length           : 500045
CreationTimeUtc  : 18/11/2026 17:52:51
LastWriteTimeUtc : 18/11/2026 17:52:51
Attributes       : Archive

File ID is 0x000000000000000000010000003a3617

{"size":"500045","dev":"514062289","ino":"281474980525591","mode":"100666","ctimeNs":"1795024371988651100","mtimeNs":"1795024371988651100","birthtimeNs":"1795024371986626000"}
```

The reported file ID and Node device/inode values are the available filesystem identity evidence. No file was opened for writing.

## Index Entry and Cached Stat

Commands:

```text
git ls-files --stage -- package-lock.json
git ls-files --debug -- package-lock.json
git ls-files -v -- package-lock.json
git rev-parse --shared-index-path
```

Outputs:

```text
100644 e397c195e4e22231204add4fdfafb1ba50219736 0    package-lock.json

package-lock.json
  ctime: 1795024371:986626000
  mtime: 1795024371:988651100
  dev: 0    ino: 0
  uid: 0 gid: 0
  size: 500045 flags: 0

H package-lock.json
(git rev-parse --shared-index-path: empty)
```

The index has one stage-0 entry, mode `100644`, object ID `e397c195e4e22231204add4fdfafb1ba50219736`, and no extended flags. The uppercase `H` is the normal tracked-file indicator; the entry is not marked assume-unchanged or skip-worktree. No shared index path was returned.

Comparing the cached stat to Node's filesystem stat:

- Cached size `500045` equals the worktree file size.
- Cached mtime `1795024371:988651100` equals Node's `mtimeNs`.
- Cached ctime `1795024371:986626000` equals Node's `birthtimeNs`.
- The index records `dev`/`ino` as zero, while Node reports `dev=514062289`, `ino=281474980525591`.

The cached stat describes the worktree-sized file, not the indexed blob's byte length. It therefore agrees with the current filesystem stat even though the object ID in the index points to a shorter blob.

## Git Configuration and Environment

Configuration was read, not changed. `git config --show-origin --get <key>` results:

| Setting | Effective result |
| --- | --- |
| `core.filemode` | `false` from `.git/config` |
| `core.trustctime` | unset |
| `core.checkStat` | unset |
| `core.fsmonitor` | `false`, command-line override |
| `core.untrackedCache` | unset |
| `core.splitIndex` | unset |
| `core.autocrlf` | `true` from `C:/Users/User/AppData/Local/github-copilot-git-2.56.1-ed288e8bd0f6c2e5457ed05af4539e7a89ddc665f1099f69fb1db652f442b5c7/etc/gitconfig` |
| `core.eol` | unset |
| `core.safecrlf` | unset |

`git check-attr text eol filter -- package-lock.json` reports each as `unspecified`; no path-specific text, EOL, or filter attribute is set.

Environment inspection:

```text
GIT_CONFIG_COUNT=3
GIT_CONFIG_KEY_0=safe.bareRepository; GIT_CONFIG_VALUE_0=explicit
GIT_CONFIG_KEY_1=credential.interactive; GIT_CONFIG_VALUE_1=never
GIT_CONFIG_KEY_2=core.fsmonitor; GIT_CONFIG_VALUE_2=false
GIT_OPTIONAL_LOCKS=0
GIT_INDEX_FILE, GIT_WORK_TREE, GIT_DIR, GIT_COMMON_DIR,
GIT_CONFIG, GIT_CONFIG_SYSTEM, GIT_CONFIG_GLOBAL,
GIT_CONFIG_NOSYSTEM, GIT_TRACE, GIT_TRACE_SETUP,
GIT_TRACE_FSMONITOR: unset
```

The environment disables optional Git locks for these commands and disables fsmonitor through `core.fsmonitor=false`. Other `GIT_CONFIG_COUNT` overrides shown above do not affect lockfile content conversion.

## Raw Byte and JSON Comparison

The worktree and committed/index blobs were loaded into memory with Node and `git cat-file`; no extracted file was written. The comparison reported:

The executed read-only PowerShell/Node script was:

```powershell
@'
const fs = require('fs');
const crypto = require('crypto');
const cp = require('child_process');
const git = (...args) => cp.execFileSync('git', args);
const digest = b => crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
const work = fs.readFileSync('package-lock.json');
const head = git('cat-file', 'blob', 'HEAD:package-lock.json');
const indexOid = git('rev-parse', ':package-lock.json').toString().trim();
const index = git('cat-file', 'blob', indexOid);
function cmp(a,b) {
  let p=0; const lim=Math.min(a.length,b.length);
  while(p<lim && a[p]===b[p]) p++;
  let s=0; while(s<lim-p && a[a.length-1-s]===b[b.length-1-s]) s++;
  return {firstDiffOffset:p,commonPrefixBytes:p,commonSuffixBytes:s,
    workBytes:a.length,otherBytes:b.length};
}
function lines(b) {
  let n=0; for(const x of b) if(x===10)n++;
  return n+(b.length && b[b.length-1]!==10 ? 1:0);
}
const wj=JSON.parse(work.toString('utf8')), hj=JSON.parse(head.toString('utf8'));
const wp=wj.packages||{}, hp=hj.packages||{};
const wkeys=Object.keys(wp), hkeys=Object.keys(hp);
const added=wkeys.filter(k=>!(k in hp)), removed=hkeys.filter(k=>!(k in wp));
const changed=wkeys.filter(k=>k in hp && JSON.stringify(wp[k])!==JSON.stringify(hp[k]));
const topValueDiffs=Object.keys(wj).filter(k=>k!=='packages' &&
  JSON.stringify(wj[k])!==JSON.stringify(hj[k]));
const normalized=Buffer.from(work.toString('utf8').replace(/\r\n/g,'\n'),'utf8');
const eol=b=>{let crlf=0,lfOnly=0,crOnly=0;
  for(let i=0;i<b.length;i++){if(b[i]===13){if(b[i+1]===10){crlf++;i++}else crOnly++}
  else if(b[i]===10)lfOnly++}
  return {crlf,lfOnly,crOnly};};
console.log(JSON.stringify({
  work:{bytes:work.length,sha256:digest(work),blob:git('hash-object','--no-filters',
    'package-lock.json').toString().trim(),lines:lines(work),eol:eol(work)},
  head:{bytes:head.length,sha256:digest(head),blob:git('rev-parse',
    'HEAD:package-lock.json').toString().trim(),lines:lines(head),eol:eol(head)},
  index:{bytes:index.length,sha256:digest(index),blob:indexOid,lines:lines(index)},
  equal:{workHead:work.equals(head),workIndex:work.equals(index),headIndex:head.equals(index)},
  workVsHead:cmp(work,head),normalizedWorkEqualsHead:normalized.equals(head),
  json:{workTopLevelKeys:Object.keys(wj),headTopLevelKeys:Object.keys(hj),
    workPackageEntries:wkeys.length,headPackageEntries:hkeys.length,
    added:added.length,removed:removed.length,changed:changed.length,
    topLevelValueDiffs}
}));
'@ | node -
```

```text
WORKTREE: 500045 bytes
  SHA-256 59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667
  raw Git blob hash 0f59eeefa229c4dc3995a7ec5ac38502ed07e725

HEAD: 487307 bytes
  SHA-256 3435E772F246EC829E59102346F6A02A88C003C9A62290EBEF1846589F3F9044
  Git blob e397c195e4e22231204add4fdfafb1ba50219736

INDEX: 487307 bytes
  SHA-256 3435E772F246EC829E59102346F6A02A88C003C9A62290EBEF1846589F3F9044
  Git blob e397c195e4e22231204add4fdfafb1ba50219736

worktree == HEAD: false
worktree == index: false
HEAD == index: true

worktree vs HEAD: first differing byte offset 1; common prefix 1 byte; common suffix 1 byte
worktree vs index: first differing byte offset 1; common prefix 1 byte; common suffix 1 byte
line counts: worktree 12738; HEAD/index 12738
```

The exact raw difference is line endings:

```text
WORKTREE: 12738 CRLF, 0 LF-only, 0 CR-only
HEAD:     0 CRLF, 12738 LF-only, 0 CR-only
```

Replacing CRLF with LF in the worktree buffer removes exactly `12738` bytes and makes the resulting byte buffer exactly equal to the HEAD/index blob. The size delta is therefore one carriage-return byte per line; it is not a package-content difference.

Both files parse as JSON. Structural comparison:

- Top-level keys match: `name`, `version`, `lockfileVersion`, `requires`, `packages`.
- Top-level values excluding `packages`: no differences.
- Package entries: 966 in each.
- Added entries: 0.
- Removed entries: 0.
- Changed common entries: 0.

No package entry or lockfile data changed; only the raw line terminators differ.

## Why Git Status and Diff Are Clean

Relevant path-aware conversion check:

```text
git hash-object --no-filters package-lock.json
0f59eeefa229c4dc3995a7ec5ac38502ed07e725

git hash-object --path=package-lock.json package-lock.json
e397c195e4e22231204add4fdfafb1ba50219736

git rev-parse :package-lock.json
e397c195e4e22231204add4fdfafb1ba50219736
```

With the effective `core.autocrlf=true`, Git normalizes the worktree's CRLF line endings to LF for its path-aware comparison. The normalized worktree content hashes to the exact index/HEAD blob ID. This is direct evidence explaining why Git considers the path clean despite different raw byte lengths.

The index's cached size and timestamps also match the working file metadata. Those fields can let Git use its stat cache as an optimization; this inspection does not establish whether an individual status invocation skipped content hashing. `core.filemode=false` also explains why the worktree's Windows mode display (`100666`) does not cause a mode-only status change against index mode `100644`. The decisive content explanation is the exact `--path` hash match after CRLF normalization.

Read-only status outputs with optional locks disabled:

```text
git --no-optional-locks status --porcelain=v2 -- package-lock.json
(no output)

git --no-optional-locks diff --no-ext-diff --name-status -- package-lock.json
(no output)

git --no-optional-locks diff-index --name-status HEAD -- package-lock.json
(no output)
```

The clean status is expected under this line-ending configuration, rather than evidence that the raw worktree bytes equal the blob.

## Prior Evidence and Timeline

`docs/AES_GUARDIAN_PHASE0_3_LOCAL_BASELINE_VERIFICATION.md` records the canonical working-tree SHA-256 `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667` before and after `npm ci`, and states the lockfile was unchanged by that install. This supports that the CRLF worktree representation existed at that recorded baseline. It does not claim that the raw worktree bytes matched the LF Git blob.

The earlier Batch 11.2.11A investigation established the raw worktree/HEAD byte difference but lacked the line-ending/config evidence. The Batch 11.2.11 report's `...354DB...` value is a one-character transcription omission; the independently verified worktree value is `...3546DB...`.

The current mechanism is established: system-level `core.autocrlf=true` accounts for the CRLF worktree representation and Git's clean path-aware comparison. The exact event, time, or actor that produced the current file is not established by these local artifacts. The Phase 0.3 report establishes that its recorded raw hash remained unchanged across `npm ci`, not who originally wrote the file.

## Preservation and Local-Only Confirmation

The repository root, branch, HEAD, committed tree, and index tree remain as listed above. The working file metadata and SHA-256 remained unchanged across the checks. No file or Git metadata was modified; this report is the only file created for the task. No remote access, fetch, pull, push, merge, synchronization, dependency installation, emulator launch, or destructive Git operation occurred.
