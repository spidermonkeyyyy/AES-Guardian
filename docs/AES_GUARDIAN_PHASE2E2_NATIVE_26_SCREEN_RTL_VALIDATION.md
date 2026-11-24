# AES Guardian Phase 2E.2 — Native 26-Screen RTL Validation

**Status: BLOCKED — incomplete coverage; native Arabic RTL acceptance not established.**

This was a validation-only walkthrough. No source, dependency, lockfile, Gradle, or Metro configuration was edited. This report separates directly observed evidence from untested or inferred results. Screenshot suffixes from the capture session are historical filenames, not verdicts.

## APK identity and runtime

| Item | Observed result |
|---|---|
| Repository baseline | Branch `migration/aes-guardian`; HEAD `c81a50c98e4e7330fad479a51a48a2fea7f912a1`; committed/index tree `983733927b18bf30b8377f84c9c1813c74c4bf6b` |
| Installed app | `com.sanad`, versionCode `1`, versionName `0.1.0` |
| Provenance | APK pulled from the installed emulator to `...\AESGuardian-Native26-20261120-1948\installed-base.apk`; SHA-256 `7C796FFEB80066E37E5F5314F1F8B3F696AAB2372D13B5A5E9EC72D6E196D6FC`, matching the Phase 2E.2D expected APK |
| Device | AVD `l3andalib_2`, `emulator-5554`; Android 16; 1220 × 2712; density 480 |
| Runtime mode | ADB reverse mapping for 8081 absent; no host 8081 listener observed. Metro remained unavailable during the walkthrough. |
| Fresh startup evidence | A fresh app process loaded `libhermes.so` from the installed package and logged `ReactNativeJS: Running "sanad-rn"`. Captures/logs: `startup.png`, `startup-logcat.txt`, `startup-logcat-complete.txt`, and `walkthrough-logcat.txt`. |
| Startup errors | The current-session log scan found no `FATAL EXCEPTION`, RedBox, or matching JS error around the fresh launch. An earlier apparent RedBox was based on stale `/sdcard/window.xml` after `uiautomator dump` failed; it is not treated as current evidence. |
| Final locale / role | French selected through the in-app locale control; OH professional demo role remained selected. |

Evidence directory (outside the repository):

`C:\Users\User\.copilot\session-state\378e5336-479b-4c64-b579-48880789005e\files\AESGuardian-Native26-20261120-1948`

The APK identity and first launch are independently verified against the expected hash. Metro unavailability is based on the observed empty ADB reverse list and absent host listener; it does not imply that every listed workflow was exercised.

## Screen and locale coverage

`PASS` means visited and visually inspected without a recorded defect on that screen/locale; it is not a full acceptance of all controls. `FAIL` means the screen was visited and a defect was observed. `NOT TESTED` means no visual verdict is claimed. In particular, unvisited combinations are not inferred from another locale.

| # | Screen | FR | EN | AR |
|---:|---|---|---|---|
| 1 | Splash | PASS | NOT TESTED | FAIL |
| 2 | Language Selection | NOT TESTED | NOT TESTED | FAIL |
| 3 | Welcome Carousel | NOT TESTED | NOT TESTED | FAIL |
| 4 | Prototype Disclaimer | NOT TESTED | NOT TESTED | FAIL |
| 5 | Demo Account Picker | NOT TESTED | NOT TESTED | FAIL |
| 6 | Workspace | PASS | NOT TESTED | FAIL |
| 7 | Declaration List | NOT TESTED | NOT TESTED | FAIL |
| 8 | Declaration Form | NOT TESTED | NOT TESTED | FAIL |
| 9 | Declaration Details | NOT TESTED | NOT TESTED | FAIL |
| 10 | Submission Confirmation | NOT TESTED | NOT TESTED | NOT TESTED |
| 11 | Admin Review Queue | NOT TESTED | NOT TESTED | FAIL |
| 12 | Admin Review Action | NOT TESTED | NOT TESTED | FAIL |
| 13 | Correction Response | NOT TESTED | NOT TESTED | FAIL |
| 14 | OH Coordination Queue | NOT TESTED | NOT TESTED | FAIL |
| 15 | OH Coordination Detail | NOT TESTED | NOT TESTED | FAIL |
| 16 | Create Coordination | NOT TESTED | NOT TESTED | NOT TESTED |
| 17 | OH Follow-Up Event | NOT TESTED | NOT TESTED | FAIL |
| 18 | Declaration Coordination Status | NOT TESTED | NOT TESTED | NOT TESTED |
| 19 | Surveillance Dashboard | NOT TESTED | NOT TESTED | FAIL |
| 20 | Prevention Overview | NOT TESTED | NOT TESTED | NOT TESTED |
| 21 | Prevention Action Register | NOT TESTED | NOT TESTED | NOT TESTED |
| 22 | Prevention Action Create | NOT TESTED | NOT TESTED | NOT TESTED |
| 23 | Prevention Action Detail | NOT TESTED | NOT TESTED | NOT TESTED |
| 24 | Help / Glossary | NOT TESTED | NOT TESTED | NOT TESTED |
| 25 | Profile | PASS | NOT TESTED | FAIL |
| 26 | Notification Centre | NOT TESTED | NOT TESTED | NOT TESTED |

The failures in the Arabic column denote observed RTL defects, not a claim that every possible control on those screens was exercised. The visited screens are represented by captures in the evidence directory (for example `splash_ar_onboarding_pass.png`, `language_select_ar_exposed_professional_pass.png`, `welcome_carousel_ar_exposed_professional_pass.png`, `prototype_disclaimer_ar_exposed_professional_pass.png`, `demo_picker_ar_exposed_professional_pass.png`, `workspace_ar_exposed_professional_fail.png`, `declaration_list_ar_exposed_professional_fail.png`, `declaration_form_ar_exposed_professional_pass.png`, `declaration_details_ar_exposed_professional_pass.png`, `admin_review_queue_ar_admin_reviewer_fail.png`, `admin_review_action_ar_admin_reviewer_fail.png`, `correction_response_ar_exposed_professional_pass.png`, `oh_coordination_queue_ar_oh_professional_fail.png`, `oh_coordination_detail_ar_oh_professional_fail.png`, `oh_followup_event_ar_oh_professional_fail.png`, `surveillance_dashboard_ar_oh_professional_fail.png`, and `profile_final_ar_oh_professional_fail.png`). Historical `pass` suffixes do not override the verdict in this matrix.

French visual inspection was limited to the splash, workspace, and profile. English was not exercised in this phase. The connected flow was not traversed end-to-end in all three locales, and most screens in the 26-screen inventory were not reached.

## Walkthrough and role observations

- The distinct AES discovery/onboarding entry was used rather than the AuthGate sign-up action. The prior onboarding replay and Arabic route provided evidence for `aesSplash → aesLanguageSelect → aesWelcomeCarousel → aesDisclaimer → aesDemoPicker → aesGuardianWorkspace`.
- Arabic onboarding, workspace, declaration list/form/details, correction response, administrative review queue/action, OH queue/detail, follow-up event, surveillance dashboard, and profile were reached. Screenshots are retained in the evidence directory.
- Exposed professional, administrative reviewer, and OH professional demo roles were selected. The OH queue's in-progress filter was exercised. The follow-up form was opened but not submitted. No complete submission/coordination/prevention workflow was validated.
- A read-only / role-restricted statement was visible in the profile/workspace, and role-specific modules were exposed in the demo. No systematic access-control matrix was tested; technical administrator access, unauthorized clinical-data access attempts, and all role boundaries remain unverified.
- Only synthetic preloaded demo data was used. No real clinical or professional data was entered.

## Defects

| ID | Severity | Screen / locale / role | Reproduction and expected behavior | Observed behavior and evidence | Reproducibility |
|---|---|---|---|---|---|
| RTL-01 | HIGH | Arabic screens; exposed professional and OH professional | Select Arabic and inspect navigation, card ordering, and directional affordances. Layout and navigation should follow RTL consistently. | The Profile explicitly states full RTL support is deferred. The top-level back arrow remains left-oriented; workspace module-card chevrons remain on the left edge; the OH detail/event title control shows a right-pointing arrow. Arabic content is present, but translated text alone does not establish RTL usability. See `profile_final_ar_oh_professional_fail.png`, `workspace_ar_oh_professional_fail.png`, `oh_coordination_detail_ar_oh_professional_fail.png`, and `oh_followup_event_ar_oh_professional_fail.png`. | Observed on multiple screens; repeatability was not independently retested. |
| VIS-01 | HIGH (provisional) | Surveillance Dashboard / AR / OH professional | Open the Surveillance AES module from the OH workspace and inspect the main dashboard visualization. The chart and data should be legible and fit the viewport. | A dominant black, unlabeled chart-like region fills much of the screen and continues below the visible area; adjacent plot area appears nearly blank. This makes the primary dashboard visualization unreadable in the captured state. See `surveillance_dashboard_ar_oh_professional_fail.png`. | One captured visit; repeatability and data correctness not tested. |

No fix was attempted. Severity for VIS-01 is provisional because the chart's intended rendering and data semantics were not inspected in source or retested.

## Accessibility

No 200% text scaling or TalkBack validation was performed. At capture time, system font scale was `1.0` and `accessibility_enabled` was `0`. Touch-target measurement, TalkBack labels/reading order, focus order, non-color status communication, and Arabic accessibility order are **NOT TESTED**. No accessibility acceptance is claimed.

## Tests and limitations

This was manual emulator navigation and screenshot inspection only. No Jest, TypeScript, or Android build/test suite was run in this validation-only phase. The embedded bundle was exercised at startup without Metro, but there is not sufficient coverage to claim all 26 screens, all 78 locale/screen pairs, or all connected workflows were validated.

The screen inventory is **incomplete**: 3 French screens and 17 Arabic screens were visited; no English screen was visited. No status is inferred for an unvisited screen/locale pair. Arabic RTL acceptance is blocked by observed layout-direction defects. Accessibility checks, technical administrator testing, prevention workflows, notification/help screens, and several declaration/coordination states remain outstanding.

## Preservation verification

No repository source or configuration files were changed for this walkthrough. Existing Phase 2E.2D worktree modifications were preserved; no files were staged, committed, reset, cleaned, restored, stashed, or deleted. The pulled APK, screenshots, and logs were written only to the dedicated session evidence directory above.

Final repository checks recorded after the walkthrough:

- Branch: `migration/aes-guardian`.
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`.
- Committed tree / index tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b` / `983733927b18bf30b8377f84c9c1813c74c4bf6b`.
- Staged paths: none.
- `git diff --check`: passed.
- Porcelain status contained 239 entries at final verification, matching the pre-walkthrough count reported in the session context. No staging occurred; the path-by-path status inventory was not independently compared against a saved validation-phase baseline.
- ADB reverse list was empty and no host listener on port 8081 was observed at final state. The app locale was restored to French through its UI; system font scale remained `1.0`.

**Acceptance decision:** BLOCKED. The required complete 26-screen, FR/EN/AR coverage and accessibility checks were not completed, and Arabic RTL defects remain. This is not a release-readiness determination. Continue with a separate bounded RTL and visualization repair/verification batch, then rerun the missing native coverage; do not treat this partial walkthrough as acceptance for the next gate.
