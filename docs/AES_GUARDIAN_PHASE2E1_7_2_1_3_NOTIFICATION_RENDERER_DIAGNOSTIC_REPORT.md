# AES GUARDIAN — PHASE 2E.1.7.2.1.3

## Notification Centre — React Test Renderer State-Propagation Diagnostic

### 1. Repository identity

- **VERIFIED IN SOURCE** Repository: `C:\Users\User\Desktop\sure\sanad-rn-migration`
- **VERIFIED IN SOURCE** Branch: `migration/aes-guardian`
- **VERIFIED IN SOURCE** HEAD: `d79b01ef51646509170996f8c77517f95470f217`

### 2. Git status

The complete current `git status --short --untracked-files=all` showed the existing modified/untracked Phase 2E work and reports.

No Git mutation was performed.

No project source or test file was modified for this diagnostic.

### 3. Actual dependency versions

Resolved with `npm ls --depth=0`:

- React: `18.3.1`
- React Native: `0.76.9`
- React Native Testing Library: `12.9.0`
- React Test Renderer: `18.3.1`
- Jest: `29.7.0`
- React Native Reanimated: `3.19.5`

The lockfile also resolves Jest Environment Node `29.7.0`.

### 4. Jest environment and transformer

`jest.config.js` uses:

- preset: `react-native`
- `react-native` Jest preset
- `babel-jest` for JS/TS/TSX transformation
- asset transformer
- React Native setup file
- React Native test environment
- custom `moduleFileExtensions`
- custom `moduleNameMapper`

The React Native Jest preset resolves:

- test environment: `react-native/jest/react-native-env.js`
- setup file: `react-native/jest/setup.js`
- custom React Native export conditions

This is a React Test Renderer-backed React Native component test environment, not a browser DOM environment.

### 5. Rendering API

The failing test uses:

- `@testing-library/react-native` `render`
- `waitFor`
- `getByText`
- React Test Renderer internally
- React `18.3.1`

The test mock defines `useIsFocused: () => mockIsFocused`, with `mockIsFocused=true` in `beforeEach`.

There is no `useFocusEffect` in `NotificationCentreScreen.tsx`; this screen uses `useIsFocused()` plus a normal `useEffect`.

The mock is a boolean focus mock, not a real focus-effect callback. It does not model navigation focus lifecycle; it models a single synchronous focused state.

### 6. Failing test reproduction

The isolated command was:

```text
.\node_modules\.bin\jest.cmd ./src/features/aes-guardian/__tests__/notification-centre.test.tsx -t "renders empty state when user has zero notifications" --runInBand --no-cache
```

- Process exit code: `1`
- 1 suite failed
- 1 test failed
- 37 tests skipped
- Duration: approximately `25-31 s`

Failure:

```text
Unable to find an element with text: Aucune notification
<View><ActivityIndicator /></View>
```

### 7. Component state evidence

Temporary read-only runtime tracing established:

```text
loadData { isFocused: true, activeRole: 'exposed_professional', userId: 1 }
loaded { listLength: 0, count: 0 }
finally { isMounted: true }
```

This proves:

- the focus mock returns true;
- the effect invokes `loadData`;
- `getNotifications(1)` resolves with zero records;
- `getUnreadNotificationCount(1)` resolves with zero;
- `loadData` reaches `finally`;
- the mounted reference remains true;
- `setLoading(false)` is reached.

Direct repository calls outside the screen also resolve to `[]` and `0`.

Repository suite evidence independently passes 32 notification database tests.

### 8. Rendered host-tree evidence

The test's final failure tree contains only:

```text
<View>
  <ActivityIndicator />
</View>
```

Thus, the current test observation demonstrates that its query result remains the loading branch after the async repository calls.

However, runtime tracing proves the component's loading cleanup executes. This is evidence of a state-propagation or test-observation mismatch, not evidence that the repository calls or focus branch are unresolved.

No stale `getByText` reference is indicated: `getByText` queries the current render result collection, and `waitFor` retries it.

### 9. `waitFor` and `act` behavior

RNTL `12.9.0` implements `waitFor` through `wrapAsync`.

For React 18:

- `wrapAsync` temporarily disables the React act environment while running `waitFor`;
- it flushes microtasks;
- it polls and re-runs the expectation.

For React 18+, RNTL's local `act` implementation uses React Test Renderer `act`.

This test does not use fake timers, so RNTL's real-timer branch applies: interval polling plus microtask flushing.

The test does not wrap the initial async effect explicitly in `act`, but `waitFor` is intended to handle this for RNTL. The observed stale loading tree indicates the current combination is not surfacing the state transition in this test.

### 10. External React 18 diagnostic

A scratch-only Node diagnostic using React `18.3.1` and React Test Renderer `18.3.1` rendered a component that starts with `loading=true`, schedules `setLoading(false)` in `useEffect`, and is resolved inside async `act`.

Both the post-act snapshot and the subsequent snapshot rendered:

```text
{"type":"View","props":{},"children":["empty"]}
```

Therefore React 18 and React Test Renderer 18.3.1 can propagate this basic async state transition correctly.

This does not prove the RNTL file-specific state transition is compatible, but it does not support a broad React/React Test Renderer incompatibility claim.

### 11. RNTL v12 compatibility conclusion

RNTL `12.9.0` supports React Native `>=0.59` and React Test Renderer `>=16.8.0`.

The installed versions are within declared peer ranges:

- React 18.3.1
- React Native 0.76.9
- React Test Renderer 18.3.1

The package lock marks RNTL 12.9.0 deprecated, but no dependency incompatibility is proven by this diagnostic.

`confirmed renderer/testing-library incompatibility` is **not proven**.

### 12. Strategy assessment

#### `waitFor`

This test already uses `waitFor`, and RNTL polls the render result. It is not proven sufficient to observe this async effect transition; the evidence shows it times out with a stale loading tree.

#### `findByText`

Find-by-text also uses RNTL async waiting infrastructure. No evidence establishes it will bypass the state-propagation mismatch.

#### Asynchronous `act`

A direct post-render async `act` attempt did not pass. A direct test timeout occurred, and the test did not establish a compatible flush sequence.

Wrapping `render()` itself in async `act` was also incompatible with RNTL 12.9.0 in this environment and produced host-component/destroyed-renderer errors.

#### Explicit focus-effect callback invocation

The Notification Centre screen does not use `useFocusEffect`; it uses `useIsFocused` and a normal `useEffect`. The mock only returns focus state. Explicitly invoking a nonexistent focus callback would be the wrong strategy.

#### Repository-mock response

Mocking the response as contract-shaped empty data did not make the test pass and could hide repository timing rather than diagnose it. It is not a proven correction.

#### Existing project helper

No existing project-specific async rendering/helper was identified for this screen test.

### 13. Root-cause assessment

**PROVEN**

- Repository calls settle.
- The loading cleanup executes.
- The mounted reference remains true.
- The test query remains at the loading host tree.
- React 18/React Test Renderer 18.3.1 pass a minimal async state diagnostic.
- RNTL 12.9.0 is deprecated but compatible with the declared React and RTR peer ranges.

**NOT PROVEN**

- A concrete RNTL package incompatibility.
- A stale `getByText` reference.
- A focus mock callback defect.
- A genuine component loading defect.
- A mock promise never settling.

**Most defensible classification**

The result is an **incorrect async state-observation/assertion strategy in the test harness** or an unconfirmed RNTL/React 18 async state-propagation limitation. The evidence does not support claiming a confirmed production component defect.

### 14. Smallest justified correction recommendation

The smallest safe recommendation belongs in the test, not the production component:

1. Preserve the real repository calls and no timeout increase.
2. Expose or await the screen's actual load operation inside the test's `act` boundary, rather than relying only on `waitFor`.
3. Only then assert the empty-state text.

If repository call promise awaiting is not accessible because `loadData` is internal, use a test-only repository mock that returns contract-shaped promises and wrap the mount plus those promises in an `act` sequence that has been verified in this exact RNTL/RN environment.

Do not change:

- `NotificationCentreScreen.tsx`;
- notification repository/database code;
- localization;
- authorization;
- global Jest configuration;
- dependency versions.

The test correction remains unimplemented in this diagnostic task.

### 15. Remaining uncertainties

- Why RNTL's `waitFor` does not observe the post-cleanup host tree in this test.
- Whether async state updates are correctly wrapped by RNTL 12.9.0 in React 18 under this project's React Native preset.
- Whether a repository-mock plus verified `act` sequence is the exact correct test strategy.
- Whether another test-specific setup or first-render warm-up is interacting with the result.
