# AES GUARDIAN — PHASE 2E.1.7.2.1.4

## Notification Centre — Test-Only Async State Observation Correction

### 1. Repository identity

- **VERIFIED IN SOURCE** Repository: `C:\Users\User\Desktop\sure\sanad-rn-migration`
- **VERIFIED IN SOURCE** Branch: `migration/aes-guardian`
- **VERIFIED IN SOURCE** HEAD: `d79b01ef51646509170996f8c77517f95470f217`

### 2. Preflight status

The complete pre-edit status showed the existing modified/untracked Phase 2E work.

No source or test change was retained.

`git diff` for `src/features/aes-guardian/__tests__/notification-centre.test.tsx` is empty after the experiments.

No production source, mock setup, global Jest configuration, dependency, localization, database, repository, navigation, theme, blueprint, or original repository file was changed.

### 3. Minimal test-only diagnostic

Installed stack:

- React `18.3.1`
- React Native `0.76.9`
- RNTL `12.9.0`
- React Test Renderer `18.3.1`
- Jest `29.7.0`

The existing test uses the real `NotificationCentreScreen`, real focus mock (`useIsFocused() => true`), real role store, real repository methods, and RNTL `render`/`waitFor`.

### 4. Experiment 1: await repository spy results inside act

The test was temporarily changed to:

- spy on `db.getNotifications`;
- spy on `db.getUnreadNotificationCount`;
- return contract-shaped resolved values;
- await the spy promise results inside RNTL `act`.

Result:

- Process exit code: `1`
- Test timed out at the Jest 5-second test boundary.
- No verified correction.

### 5. Experiment 2: deferred repository promises

The test was temporarily changed to:

- create explicit deferred promises;
- render the real screen;
- resolve notifications with `[]`;
- resolve unread count with `0`;
- await both promises and one microtask inside RNTL `act`;
- query the real render result immediately.

Isolated result:

- Process exit code: `0`
- 1 test passed
- 37 tests skipped
- 38 tests total
- Suite duration: `28.056 s`

Complete Notification Centre file result with this experiment:

- Process exit code: `1`
- 1 test failed, 37 passed
- The deferred-promise test exceeded 5 seconds and timed out.

The deferred-promise correction is therefore not reliable across isolated/full scope and was reverted.

### 6. Experiment 3: resolved repository mocks plus act/microtask flush

The test was temporarily changed to:

- mock `getNotifications` to resolve `[]`;
- mock `getUnreadNotificationCount` to resolve `0`;
- mount the real screen;
- await a post-render microtask inside RNTL `act`;
- retain `waitFor`.

Result:

- Process exit code: `1`
- Test timed out.
- No verified correction.

### 7. Final exact test-file state

All experimental edits were reverted. The test file is unchanged and uses the original real-repository setup and original `waitFor` assertions.

No Jest timeout increase or global timeout change was introduced.

### 8. Final validation

#### Failing test alone

Command:

```text
.\node_modules\.bin\jest.cmd ./src/features/aes-guardian/__tests__/notification-centre.test.tsx -t "renders empty state when user has zero notifications" --runInBand --no-cache
```

- Process exit code: `1`
- 1 failed
- 37 skipped
- Duration: `34.866 s`

#### Complete Notification Centre file

Command:

```text
.\node_modules\.bin\jest.cmd ./src/features/aes-guardian/__tests__/notification-centre.test.tsx --runInBand --no-cache
```

- Process exit code: `1`
- 1 failed
- 37 passed
- Duration: `40.158 s`

#### Notification-related suites

- Process exit code: `1`
- 6 suites passed
- 1 suite failed
- 270 tests passed
- 1 test failed
- Duration: `46.491 s`

#### Complete Jest suite

```text
.\node_modules\.bin\jest.cmd --runInBand --no-cache
```

- Process exit code: `1`
- 48 suites passed
- 1 suite failed
- 1089 tests passed
- 1 test failed
- Duration: `139.997 s`

The full suite confirms the Surveillance UI suite passes all 80 tests.

### 9. Conclusion

No safe test-only correction could be verified persistently.

The deferred-promise strategy passed only in isolation and failed in the complete file, so it is sequence-dependent and cannot be adopted as a reliable correction.

The resolved-mock and direct-spy strategies did not pass.

The original test file is unchanged.

No production code change was made.

The remaining issue is unresolved and should await a further test-harness investigation or explicit authorization for a different correction scope.
