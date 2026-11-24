# AES Guardian - Phase 2E.1 Batch 11.2.16G

## 1. Executive recommendation

**NOT REPRODUCED IN 10 FOCUSED RUNS - BOUNDED CONFIDENCE**

The historical workspace badge-removal test passed when isolated and in all ten consecutive complete Notification Centre suite executions after the accepted Batch 11.2.16F stale-focus correction. The full Jest suite also passed once. This is bounded evidence of non-recurrence under this exact run configuration; it does not establish that the historical intermittent failure is impossible.

No historical assertion failure was reproduced. Batch 11.2.16G makes no claim that the separate historical failure is explained or root-caused.

## 2. Preflight and preservation evidence

Verified before testing:

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- No staged paths
- Initial status entries: 110
- Initial status capture: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16g-initial-status.txt`
- Initial status SHA-256: `7dc5cbd4c86bbf05cac2744498b76847db411a90ca1f62bb5aa443b76e5518b2`

Preflight hashes:

| File | SHA-256 |
|---|---|
| `AesGuardianWorkspaceScreen.tsx` | `13b58312fd19814367ce63d2430f17753c3195fd2ee2e70fde648a27c0bd9868` |
| `notification-centre.test.tsx` | `96f9634334a38acd6699c464c705d4c732d73d32ead2d877197b917d6ff4cf2e` |
| `NotificationCentreScreen.tsx` | `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a` |
| Raw `package-lock.json` | `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667` |
| Normalized lockfile Git blob | `e397c195e4e22231204add4fdfafb1ba50219736` |
| Batch 11.2.16F report | `593748a0311adca2aece42f106c3c1fa3fef1ccb8bd2bfddeda00db22680dbe4` |

The accepted workspace hash is recorded here as `13b58312fd19814367ce63d2430f17753c3195fd2ee2e70fde648a27c0bd9868` after actual preflight verification.

## 3. Exact historical test identification

The exact source test is present at:

`src/features/aes-guardian/__tests__/notification-centre.test.tsx:1145`

Test name:

`workspace badge refreshes across single-read, bulk-read, and identity switches`

The historical badge-removal assertion is at line 1250:

`expect(queryByTestId('workspace-unread-badge')).toBeNull()`

It is after:

- the exposed user initially had two notifications,
- one notification was marked read,
- the workspace refocused,
- all notifications were marked read in bulk,
- the database unread count reached zero,
- and the workspace refocused again.

This test is separate from the Batch 11.2.16E stale-focus regression at line 930.

## 4. Isolated historical test result

Exact command:

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx --testNamePattern "workspace badge refreshes across single-read, bulk-read, and identity switches"`

- Start: `2026-11-19T20:43:10.7348608+01:00`
- End: `2026-11-19T20:43:21.3740193+01:00`
- Exit code: `0`
- Suite count: 1 passed, 1 total
- Test count: 1 passed, 46 skipped
- Snapshots: 0
- Historical badge-removal test: passed
- React `act(...)` warning lines: 0
- Complete log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16g-isolated.log`
- Log SHA-256: `97d9248e02d991a5f1dd4691f7328dc07188c0a689465e049f8c54ae19a396dc`

## 5. Ten sequential focused-suite results

Exact command for every run:

`npm test -- --runInBand src/features/aes-guardian/__tests__/notification-centre.test.tsx`

| Run | Start | End | Exit | Suites | Tests | Historical test | 16E test | `act(...)` warnings | Log SHA-256 |
|---|---|---|---:|---|---|---|---|---:|---|
| 1 | 20:43:30.6125806+01:00 | 20:43:45.1811919+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 27 | `2165d4ecdaf7b7beb03cc162b694b2c6ad1f8d93cd054ebbd53e40fcddedc90f` |
| 2 | 20:43:45.3135417+01:00 | 20:43:59.7705898+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 25 | `6d951ba927e3464999e98259968006e743f39a32dd6ea2b170fbb7f78d15fec1` |
| 3 | 20:43:59.8297650+01:00 | 20:44:14.4167781+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 21 | `b1e3dd7a2687fe5d42fe127695d01eb103e21a396290a5e4d306bf8e435b5b05` |
| 4 | 20:44:14.4671747+01:00 | 20:44:29.3042686+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 27 | `291ca221e478ec08b33bf3cfb81303ad1655f7579552e48833d8900a25247844` |
| 5 | 20:44:29.3629262+01:00 | 20:44:43.8389913+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 26 | `4eca25cdb7a470d54ab2dbb5d1f2f73718db3967c9d2aefd6488ec7a2aa14791` |
| 6 | 20:44:43.8978076+01:00 | 20:44:58.3223902+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 35 | `ba143ab86b12400288bc98400cb0bcb9ed13c7c87ed8024f77ac32546f49a9b6` |
| 7 | 20:44:58.3858435+01:00 | 20:45:12.7226288+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 29 | `b04c38cc551edae043c2e1c871b1bdb87a86ef411c7acfe4095069edd277adbb` |
| 8 | 20:45:12.7721703+01:00 | 20:45:27.2769222+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 26 | `58a5ab13ee63b86dbf8cd1c8ba7eebccbea6f65b276b162f1bbf09a8a0e09f41` |
| 9 | 20:45:27.3307498+01:00 | 20:45:41.8342714+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 25 | `79044da627aae44a4cdf950c5014f926a806601efc525e39ad73115717032442` |
| 10 | 20:45:41.8967078+01:00 | 20:45:56.3931025+01:00 | 0 | 1/1 | 47/47 | Passed | Passed in suite | 33 | `eeadf2713c4a0644f6b717ef3e517b42adeb75c589455914aaa50456e1c8b1a0` |

Complete log paths:

`C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16g-focused-1.log` through `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16g-focused-10.log`

No run failed. No run stopped early.

## 6. Batch 11.2.16E regression status

The complete focused suite contains 47 tests and passed 47/47 in every run, so the Batch 11.2.16E test, `refocus publishes unread count after identity changes while blurred`, passed in each of the ten focused suites.

It was not isolated in this batch because the 16G mission was to verify the distinct historical badge-removal test. Its presence and pass status are established by the suite's 47/47 result and 47-test suite count.

## 7. Full Jest result

Exact command:

`npm test -- --runInBand`

- Start: `2026-11-19T20:46:09.2206407+01:00`
- End: `2026-11-19T20:48:29.9762906+01:00`
- Exit code: `0`
- Suite count: 56 passed, 56 total
- Test count: 1249 passed, 1249 total
- Snapshots: 0
- Jest time: `137.412 s`
- React `act(...)` warning lines: `334`
- Complete log: `C:\Users\User\AppData\Local\Temp\aes-guardian-11-2-16g-full-jest.log`
- Log SHA-256: `e4acbba8e06cff9dd35acc4bb460db021d594ca8c494d35ebe00fdce6d41cfc5`

The full suite is supplementary evidence only.

## 8. Warning summary

- Isolated historical test: 0 React `act(...)` warning lines.
- Ten focused suites: warning counts ranged from 21 to 35 lines per run.
- Full Jest suite: 334 React `act(...)` warning lines.
- No run had a failed assertion, suite failure, or nonzero exit.

## 9. Final hashes and read-only preservation audit

Final hashes matched the preflight values:

| File | Final SHA-256 |
|---|---|
| `AesGuardianWorkspaceScreen.tsx` | `13b58312fd19814367ce63d2430f17753c3195fd2ee2e70fde648a27c0bd9868` |
| `notification-centre.test.tsx` | `96f9634334a38acd6699c464c705d4c732d73d32ead2d877197b917d6ff4cf2e` |
| `NotificationCentreScreen.tsx` | `0960970c56fab40d9221f7f3386173be2b600d3e529f36109e5a41322144771a` |
| Raw `package-lock.json` | `59da2c8753546db407a9834ca01863ea7b958168c51dcef0e7944e325df53667` |

Normalized lockfile Git blob: `e397c195e4e22231204add4fdfafb1ba50219736`

Final branch, HEAD, committed tree, and index tree remained unchanged. No staged paths existed.

Before report creation, initial and pre-report complete working-tree status were identical: 110 entries and no status delta. Testing changed no repository file. `git diff --check` exited `0`; Git emitted only a pre-existing line-ending warning for `src/features/aes-guardian/__tests__/prevention-overview-ui.test.tsx`.

No source, test, fixture, configuration, dependency, lockfile, navigation, database, repository, or report file was modified by the test executions. The only expected repository addition is this report.

Complete Jest logs and hashes are external to the repository.

## 10. Limitations and recommended next gate

- One exact historical test passed once and in ten complete focused suites.
- One full Jest suite passed once.
- The historical failure was intermittent and its historical assertion was not reproduced.
- This evidence does not prove mathematically or empirically that future runs cannot fail.
- It does not explain the historical intermittent sequence or establish its historical root cause.
- It does not authorize another production fix or the next screen migration.

Recommended gate: retain Batch 11.2.16F, retain the existing regression coverage, and require separate review before considering any historical badge failure closed or starting Batch 11.2.17.
