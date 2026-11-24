# AES Guardian — Phase 2E.1 Batch 11.0
## RTL, Accessibility and Native Validation Readiness Audit

## Executive recommendation

**CONDITIONALLY READY**

The source and blueprint define a sufficiently clear Batch 11.1 scope:

- full Arabic layout mirroring;
- 200% dynamic font scaling;
- source-level accessibility corrections;
- runtime contrast verification;
- consolidated native crypto, SQLite, concurrency, restart and UI validation.

Batch 11.1 can be scoped, but implementation readiness is conditional on resolving:

1. the current full-suite Notification Centre badge freshness failure;
2. the absence of a native RTL/crypto/SQLite validation gate;
3. incomplete 200% font-scaling and screen-reader evidence.

## Repository identity

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- `package-lock.json` SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

Working tree contains pre-existing tracked modifications and untracked reports/source
files. This phase created no source or test change and added only this report.

## Authoritative Batch 11 requirements

The blueprint sequence defines Batch 11 as:

- RTL mirroring;
- accessibility;
- consolidated native validation.

The detailed criterion requires:

- a clean project-wide TypeScript result;
- the current full test baseline;
- a clean watermark audit;
- RTL and 200% font scaling implemented and runtime-validated;
- contrast ratios validated in-app.

The blueprint also documents:

- full RTL as proposed/not implemented;
- 200% font scaling as proposed/not implemented;
- contrast ratios as calculated and runtime-pending;
- emulator execution reserved for one consolidated validation gate.

## Directionality source audit

### Existing runtime support

`src/localization/index.ts` provides:

- locale switching for FR/EN/AR;
- `isRTL(locale)` returning true for Arabic;
- an explicit comment that `I18nManager.forceRTL(true)` plus app restart is required.

No `I18nManager`, `forceRTL`, or `allowRTL` call exists in application source.
Locale switching therefore changes strings and component-local `isRTL` styling, but
it does not establish full React Native layout direction.

### Already RTL-aware implementation

Positive examples include:

- `AesOptionCard.containerRtl` uses `row-reverse`;
- `AesOptionCard` uses `marginEnd`;
- `AesRoundArrowButton` swaps arrow icons and back/forward direction;
- `AesScreenHeader` aligns overline/title/subtitle text with `rtl`;
- several forms, lists and screens use conditional text alignment;
- some screen rows use conditional `row-reverse`.

### Full mirroring gaps

The repository still contains numerous hardcoded row layouts and directional
properties that do not consistently follow `isRTL`.

Representative high-impact locations:

- `AesButton.tsx`
  - fixed `flexDirection: 'row'`;
  - `marginLeft`/`marginRight` icon spacing.
- `AesScreenHeader.tsx`
  - fixed header `topRow` row layout;
  - `marginLeft` on badge slot;
  - back/right slots do not use a single logical-direction abstraction.
- `AesGuardianWorkspaceScreen.tsx`
  - many fixed `row` layouts;
  - absolute/status marker positioning;
  - hardcoded margins and fixed badge dimensions.
- `AesGuardianProfileScreen.tsx`
  - fixed rows;
  - `marginRight`, `paddingLeft`, and hardcoded avatar/action sizes.
- `SurveillanceDashboardScreen.tsx`
  - mixed RTL-aware and hardcoded row layouts;
  - charts, bar labels and table-like rows require native direction verification.
- `DeclarationFormScreen.tsx`
  - wizard/header/action rows;
  - hardcoded left/right margins;
  - fixed text-input/minimum heights.
- `NotificationCentreScreen.tsx`
  - fixed icon/content row layout;
  - hardcoded indentation and absolute unread indicators.
- `AdminReviewQueueScreen.tsx`, `AdminReviewActionScreen.tsx`
  - fixed row layouts and directional action groups.
- `OhCoordinationQueueScreen.tsx`, `OhCoordinationDetailScreen.tsx`
  - fixed margins and content rows.
- `PreventionActionRegisterScreen.tsx`, `PreventionActionDetailScreen.tsx`,
  `PreventionActionCreateScreen.tsx`
  - some logical styles are present, but multiple fixed rows and labels remain.
- `HelpGlossaryScreen.tsx`
  - accordion, search and category rows use fixed left/right spacing.

Conclusion:

Text-level Arabic support is implemented, but full app layout mirroring is not.

## Dynamic font scaling audit

No application-wide `allowFontScaling` or `maxFontSizeMultiplier` policy was found.

Existing shared fixed-height constraints include:

- `AesButton`: fixed 48px height;
- `AesRoundArrowButton`: fixed 48x48px;
- `AesScreenHeader`: 40px spacer/back slot and 40px back button;
- `AesOptionCard`: fixed indicator dimensions;
- `AesStatusBadge`: no fixed height but 11px text.

Representative screens also contain fixed-height, fixed-width or number-of-line
constraints:

- workspace KPI and action cards;
- declaration form fields and multiline inputs;
- admin/OH queues;
- notification feed;
- prevention create/register/detail;
- surveillance chart labels;
- profile/avatar elements;
- language/welcome/disclaimer controls.

Risk:

- 200% text scaling can clip text inside fixed-height buttons/cards;
- labels or validation messages can overlap;
- RTL text expansion can increase two-column row height;
- `numberOfLines` can truncate essential labels;
- fixed-width controls can overflow or become inaccessible.

The highest-impact correction order is:

1. remove fixed height from primary/secondary buttons;
2. enforce text wrapping and minimum, rather than fixed, touch heights;
3. audit `AesScreenHeader`, `AesStatusBadge` and `AesOptionCard`;
4. replace fixed-width/icon rows with logical flexible rows;
5. audit all `numberOfLines` occurrences;
6. run 200% scaling on every implemented AES screen.

## Contrast audit

Source-calculated ratios include:

| Pair | Ratio | Assessment |
|---|---:|---|
| Primary text / white | 16.10:1 | AAA |
| Secondary text / white | 6.19:1 | AA |
| Tertiary text / white | 5.57:1 | AA |
| Primary text / canvas | 15.28:1 | AAA |
| White / primary black action | 18.73:1 | AAA |
| Error text / error banner | 5.75:1 | AA |
| Warning text / warning banner | 7.36:1 | AAA |
| Declaration submitted text/banner | 5.03:1 | AA |
| Under-review text/banner | 5.25:1 | AA |
| Correction-requested text/banner | 4.78:1 | AA |
| CAPA proposed text/banner | 7.36:1 | AAA |
| CAPA in-progress text/banner | 5.25:1 | AA |
| CAPA completed text/banner | 7.00:1 | AAA |
| CAPA cancelled text/banner | 4.92:1 | AA |

The source palette is internally more complete than the original static documentation
suggested. `textPlaceholder` is also `#686868`, so placeholder readability is source-AA.

Remaining work:

- validate actual rendered contrast on native displays;
- audit disabled button text/background combinations;
- audit borders and icons against white/surface backgrounds;
- verify status meaning is not conveyed by color alone;
- verify badges remain 14px bold for their warning variants if text is large-text
  constrained;
- inspect system font rendering differences on Android.

## Native accessibility readiness

Existing positive evidence:

- buttons have `accessibilityRole="button"` and labels;
- option cards expose role and selected state;
- status badges expose text role/label;
- Create inputs have localized labels;
- acknowledgement has disabled/busy state;
- round arrow buttons expose role/label.

Evidence gaps:

- no global `allowFontScaling/maxFontSizeMultiplier` policy;
- no centralized accessibility hints;
- no single focus-order audit;
- some icon-only controls are labelled by screen context rather than a shared
  localized accessible label;
- status meaning is often visual color plus text, but native semantics should be
  tested for repeated/stacked announcements;
- fixed-height controls can conflict with 200% font scaling;
- no native TalkBack/VoiceOver test record exists.

## Consolidated native validation matrix

### A. React Native crypto

Prerequisites:

- Android build with actual React Native/Hermes runtime;
- no emulator-only or mocked crypto override.

Actions:

1. call `createCapaOperationId()`;
2. confirm crypto source;
3. disable/override APIs in a controlled native test build;
4. verify fail-close.

Evidence:

- generated UUID v4;
- typed entropy error;
- no operation-row insert.

### B. Production op-sqlite

Prerequisites:

- one native app build;
- migration 1–10 initialized;
- SQLite file known.

Actions:

1. reserve pending operation;
2. insert CAPA/audit/notification/operation link;
3. force rollback in each stage;
4. reopen database connection;
5. close/reopen app.

Pass/fail:

- atomic commit;
- pending stays pending after precommit failure;
- committed/unacknowledged recovery after ambiguity;
- no orphan evidence.

### C. Concurrency

Actions:

1. start two reservation calls for the same valid ID;
2. race a visible reference collision;
3. retry exact operation;
4. verify only one pending/committed operation.

Evidence:

- operation count;
- no false adoption;
- no duplicate CAPA.

### D. Physical process restart

Actions:

1. reserve pending operation, terminate process;
2. commit, terminate before readback;
3. recover unacknowledged result;
4. acknowledge, terminate before navigation;
5. reopen and confirm acknowledged operation excluded.

### E. Native UI

Actions:

- select Arabic;
- restart/reload if required;
- exercise root navigation and every AES form/list/detail screen;
- enable 200% font scaling;
- use TalkBack/VoiceOver;
- verify contrast on real display;
- verify touch targets and overflow.

## Prioritized implementation plan

### 1. Shared infrastructure

Proposed files:

- `src/localization/index.ts`
- app entry/root direction initialization
- a small shared direction utility or theme hook

Work:

- decide whether to call `I18nManager.forceRTL(true)` once;
- document/implement restart behavior;
- set root direction consistently;
- preserve technical identifiers in LTR where required.

### 2. Shared components

Proposed files:

- `AesButton.tsx`
- `AesScreenHeader.tsx`
- `AesRoundArrowButton.tsx`
- `AesOptionCard.tsx`
- `AesStatusBadge.tsx`
- `AesCard.tsx`
- `AesScreenContainer.tsx`

Work:

- replace fixed text-height assumptions;
- use logical margin/padding;
- preserve 48dp controls;
- reduce hardcoded `marginLeft/marginRight`;
- add RTL-aware icon/content order;
- add font scaling policy.

### 3. Screen-level RTL

High priority:

- workspace/profile
- declaration form/list/details
- admin review queue/action
- OH queue/detail/event
- notification centre
- surveillance dashboard
- prevention overview/register/create/detail

Work:

- add conditional `row-reverse`;
- flip indicators/chevrons;
- audit absolute markers;
- ensure text alignment;
- mirror chart/table controls cautiously.

### 4. Font scaling

Priority:

- fixed 48px buttons;
- fixed 40/48/52/64px headers/icons;
- fixed card heights;
- `numberOfLines={1}` reference/status labels;
- tab/filter rows;
- notification cards;
- long Arabic text.

Acceptance:

- no clipped text;
- no hidden actions;
- no horizontal overflow;
- scrollable long content;
- touch targets remain usable.

### 5. Static contrast

Correct only after native contrast evidence:

- disabled control combinations;
- border/indicator 3:1 non-text requirements;
- status badge text at 11px if it remains below large-text threshold;
- placeholder text;
- icon-only controls.

### 6. Accessibility source corrections

Priority:

- shared focus/label/hint policy;
- card and badge semantics;
- status and progress announcements;
- confirmation dialog buttons;
- form error association;
- 200% font behavior.

### 7. Native validation

Native validation should run once as a consolidated release gate rather than
in each UI batch.

## Items already satisfactory

- strict UUID-v4 validation source;
- fail-closed entropy source;
- exact operation-ID reconciliation;
- shared status badge/option/arrow component foundations;
- text-level Arabic translation coverage;
- 48dp round arrow and most action controls;
- logical `marginEnd` in option cards;
- source-level contrast tokens mostly WCAG-AA.

## Explicit out of scope

- backend/cloud integration;
- real clinical data;
- clinical decision/risk scoring;
- CAPA/repository redesign;
- notification repository redesign;
- unrelated patient/nurse legacy screens;
- PDF/export implementation;
- blueprint redesign.

## Verification performed

### Full Jest suite

Exact command:

`npm test -- --runInBand`

- Exit: `1`
- 55 suites passed, 1 suite failed
- 1,205 tests passed, 1 test failed
- The failure is `notification-centre.test.tsx`, workspace badge refresh across
  single-read, bulk-read and identity switches. The observed badge remains visible
  after the assertion expects it hidden.

### TypeScript

Exact command:

`npx tsc --noEmit --pretty false`

- Exit: `2`
- Diagnostic count: `769`
- Changed-file diagnostic count in Batch 11-relevant source: `0`

### Lint

Exact command:

`npm run lint`

- Exit: `2`
- ESLint 9.39.5 stopped because no flat ESLint configuration exists.

### Diff

Exact command:

`git diff --check`

- Exit: `0`

## Satisfactory implementation sequence

1. Shared direction and root configuration.
2. Shared components.
3. high-use workspace/navigation screens.
4. declaration/admin/OH workflows.
5. surveillance/notification/CAPA screens.
6. dynamic font scaling pass.
7. static contrast/native display pass.
8. consolidated native validation.

## Final recommendation

**CONDITIONALLY READY**
