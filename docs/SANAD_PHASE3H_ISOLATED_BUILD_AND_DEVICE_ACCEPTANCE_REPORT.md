# SANAD Phase 3H - Isolated Build and Device Acceptance Report

## Final disposition

**PARTIAL - build/install successful, some device checks incomplete**

The isolated build and `adb install -r` completed successfully. The new APK ran on `emulator-5554`, baseline and compact layouts were exercised, date behavior was observed at runtime, and emulator settings were restored. TalkBack was found installed but full meaningful screen-reader acceptance remained incomplete; reduced-motion acceptance also remains incomplete.

## Build and installation

- Isolated source: `C:\s`
- Dedicated Gradle home: `C:\g`
- Build: `gradlew.bat :app:assembleDebug --no-daemon --console=plain`
- Build result: success, 256 tasks executed
- Build log: `docs/screenshots/SANAD_PHASE3H_DEVICE_ACCEPTANCE/phase3h-gradle-build.log`
- APK: `C:\s\android\app\build\outputs\apk\debug\app-debug.apk`
- Preserved APK: `docs/screenshots/SANAD_PHASE3H_DEVICE_ACCEPTANCE/sanad-phase3h-debug.apk`
- APK size: 148,146,051 bytes
- APK SHA256: `EBA9A77058BBF6F9B3BA67D477E5A68E51E2D4E2A86B78308367E8B581A9A324`
- Package: `com.sanad`
- Version: `0.1.0`
- Version code: `1`
- Min/target SDK: `24/35`
- Debuggable: yes
- APK V2 signature: verified
- Signer certificate SHA256: `129273adc2ac2a82e9e7ac06ad4aca7cb2893a6981ccd5b5b3afe44f67857da5`
- Installed update timestamp: `2026-11-25 20:05:25`
- First install timestamp: `2026-11-12 23:35:57`
- Installed base APK SHA256: exactly matched the isolated build APK
- Startup: `ReactNativeJS: Running "sanad-rn"` with no fatal startup exception
- Debug Metro retries to `10.0.2.2:8081` were observed; the bundled app rendered despite them

The copied source snapshot contained 847 files and matched SHA256 with the original working-tree counterparts. `npm ci` was run only in `C:\s`. Native dependency, CMake, Ninja, project output, and Gradle cache paths resolved inside `C:\s` or `C:\g`; no original checkout native/build path was referenced.

## Source and repository preservation

Initial and final HEAD: `86bc6b7e3392893418ec5ed24e604e03032dfa06`

Initial branch: `migration/aes-guardian`

Initial upstream: `origin/migration/aes-guardian`

Initial staged paths: `0`

Final staged paths: `0`

Final status contains the expected Phase 3H report/evidence additions plus the pre-existing dirty state preserved from baseline.

Final Android-generated preservation check:

- Baseline files: `1,874`
- Hash mismatches: `0`
- Missing files: `0`

The six Phase 3G source/test hashes and the Phase 3G report hash were recomputed after acceptance and remained unchanged from the Phase 3H baseline. The final values are recorded in `phase3h-final-source-hashes.txt` artifact if present in the evidence directory; exact values are also preserved in the tool evidence.

## Emulator restoration

Baseline before Phase 3H:

- Resolution: `1220x2712`
- Density: `480 dpi`
- Font scale: `1.0`
- Night mode: no
- Accelerometer: on
- User rotation: `0`
- TalkBack: disabled
- Touch exploration: `0`
- Window/transition animation scale: `1.0`

Final verified state:

- Resolution: `1220x2712`
- Density: `480 dpi`
- Font scale: `1.0`
- Night mode: no
- User rotation: `0`
- Accelerometer: on
- TalkBack accessibility service: disabled
- Touch exploration: `0`
- Window/transition animation scale: `1.0`
- Animator duration scale: `1.0`

The app was restored to French and the exposed-professional demo role. Final visible counts: declarations `5`, corrections `1`, unread notifications `1`.

## Baseline layout

Passed runtime checks:

- French workspace displayed the expected role, header, overview cards and bottom navigation.
- French surveillance displayed the expected header, role filters, status/type chips and date fields.
- French prevention overview displayed as a readable regression check.
- The status-bar area remained clear and bottom navigation remained in its own inset-owned region.
- Workspace and surveillance were scrollable at the top and bottom positions.

Evidence:

- `post-install-splash-fr.png/.xml`
- `workspace-quality-fr-baseline.png/.xml`
- `surveillance-quality-fr-baseline.png/.xml`
- `surveillance-quality-fr-baseline-bottom.png/.xml`
- `prevention-fr-baseline.png/.xml`

## Compact 300x600 dp layout

The emulator was temporarily set to `900x1800` pixels at `480 dpi`, resulting in a 300x600 dp viewport.

French and Arabic compact captures were readable. At compact width:

- The surveillance date fields stack vertically.
- Both date fields measured `702x144` px in the UI hierarchy, or `234x48` dp, at 300 dp CSS width.
- French and Arabic date labels remained visible.
- ISO date text rendered left-to-right in Arabic and displayed as `2026-10-01`.
- Role chips remained horizontally scrollable rather than converted to a wrapping grid.
- Compact role targets measured `144x144` px in Arabic UI hierarchy, or `48x48` dp.
- Header controls measured `144x144` px, or `48x48` dp.
- The compact workspace header, role selector and bottom navigation did not show overlapping neighboring targets.
- The bottom navigation remained at the same physical bounds and did not gain duplicated bottom padding.

Evidence:

- `workspace-quality-fr-compact.png/.xml`
- `workspace-quality-ar-compact.png/.xml`
- `workspace-quality-ar-compact-scrolled.png/.xml`
- `workspace-quality-ar-compact-role-scroll-left.png/.xml`
- `surveillance-quality-fr-compact.png/.xml`
- `surveillance-quality-ar-compact-top.png/.xml`
- `prevention-quality-fr-compact-top.png/.xml`

## Font scaling

At `1.3`:

- Compact Arabic and French onboarding/workspace/surveillance states were exercised.
- Text remained scrollable and controls remained usable.
- 48 dp target bounds were not reduced by font scaling.

At `1.5`:

- Compact French/Arabic screens were exercised.
- The high text scale required additional vertical scrolling and was reachable through scrollable surfaces.
- The quality account remained reachable in the demo-role list.
- Font-scaling acceptance is judged incomplete for full browser-like text-clipping coverage, but no reproducible content loss was observed in the captured screens.

Evidence:

- `workspace-fr-compact-font-1_3-accepted.*`
- `surveillance-fr-compact-font-1_3-accepted.*`
- `workspace-ar-compact-font-1_3-accepted.*`
- `surveillance-ar-compact-font-1_3-accepted.*`
- `workspace-fr-compact-font-1_5-accepted.*`
- `surveillance-fr-compact-font-1_5-accepted.*`
- `workspace-ar-compact-font-1_5-accepted.*`
- `surveillance-ar-compact-font-1_5-accepted.*`

## Theme

Android dark mode was temporarily enabled.

Passed runtime checks:

- Workspace dark surfaces, text and status colors remained readable.
- Surveillance and prevention dark surfaces remained readable.
- Liquid Glass bottom navigation remained distinct and readable.
- Status-bar and bottom-navigation clearance remained intact.

Evidence:

- `workspace-fr-dark-baseline.png/.xml`
- `surveillance-fr-dark-baseline.png/.xml`
- `prevention-fr-dark-baseline.png/.xml`

## Landscape and safe areas

The emulator was rotated to landscape and workspace, surveillance and prevention were inspected.

Observed:

- Content expanded to the landscape viewport.
- Left/right system-bar clearance was present.
- Bottom navigation remained at the bottom and did not receive duplicated padding.
- No reproducible landcape clip was observed in the captured hierarchy.

Evidence:

- `workspace-fr-dark-landscape.png/.xml`
- `surveillance-fr-dark-landscape.png/.xml`
- `prevention-fr-dark-landscape.png/.xml`

## Date interactions

Runtime observations:

- Valid range `2026-10-01` to `2026-11-30`: `5 / 5` declarations, with monthly entries `2026-10: 1` and `2026-11: 4`.
- Valid empty range `2025-01-01` to `2025-12-30`: `0 / 5` declarations.
- Invalid calendar date `2026-02-30`: explicit validation feedback was shown and the last valid `5 / 5` result set remained visible.
- Incomplete date `2026-1`: explicit format feedback was shown and the last valid `5 / 5` result set remained visible.
- Reversed range `2026-11-30` to `2026-10-01`: zero result behavior was observed for that range; a separate reverse trial `2026-10-01` to `2026-09-30` showed the exact reversed-range message and retained `5 / 5`.
- Filter reset restored `5 / 5` declarations and cleared date inputs.
- Dismissing the keyboard restored the surveillance layout.

Evidence:

- `date-valid-range-fr.png/.xml`
- `date-valid-empty-range-fr.png/.xml`
- `date-invalid-calendar-retention-fr.png/.xml`
- `date-incomplete-retention-fr.png/.xml`
- `date-reversed-retention-fr.png/.xml`
- `date-reversed-retention-fr-verified.png/.xml`
- `date-filter-reset-current.xml`
- `date-reset-after-invalid-fr.png/.xml`

## Header, role and keyboard checks

- Role selector targets remained 48 dp high at compact width.
- Header notification/help/profile controls remained 48x48 dp and had no detected adjacent target overlap.
- The role horizontal scroller was usable in the opposite physical direction under Arabic RTL.
- The date keyboard opened and remained active while focused. The second date field and surrounding controls remained scrollable.
- After keyboard dismissal, the surveillance layout and reset control remained usable.
- Manual edge-tap near every header target was not fully automated; the hierarchy confirms no overlap, but physical edge-tap acceptance remains incomplete.

## TalkBack

TalkBack was installed and available. Android displayed full-control consent. It was enabled temporarily, SANAD was reopened, and accessibility hierarchy data was captured.

Observed:

- Role, filter, date and bottom-navigation elements expose localized names.
- Selected role/filter/navigation nodes report selected state.
- Date fields expose their localized labels.
- Full spoken-focus traversal and announcement validation was not completed.

TalkBack was disabled afterward and the final accessibility settings were restored to disabled.

Evidence:

- `accessibility-settings.xml`
- `talkback-detail.xml`
- `talkback-warning.xml`
- `talkback-enabled-state.xml`
- `talkback-app-start.png/.xml`
- `talkback-focus-step1.xml`

## Reduced motion

The emulator exposed no dedicated `accessibility_reduce_motion` setting and no saved system value. Animator duration scale was available but is not proof of `useReducedMotion` behavior. Reduced-motion acceptance is therefore **NOT TESTED**.

## Remaining gaps

- Full TalkBack spoken focus traversal and selected-state announcements.
- Manual physical edge taps on each header control.
- 1.5 font-scale acceptance across every French/Arabic screen, every scroll position and every date-control state.
- Actual TalkBack focus interaction on the workspace and profile.
- Runtime proof of `useReducedMotion` response, not only Android animator duration settings.
- Full real-device acceptance: these checks were executed on the existing emulator only.
