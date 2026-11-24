# AES Guardian — Phase 2E.1.7.2.6
## Remaining Scope and Roadmap Discovery

## Recommendation

**NEXT MILESTONE IDENTIFIED**

The next documented milestone is **Phase 2E.1 Batch 11: RTL Mirroring, Accessibility &
Consolidated Validation**.

It is The last numbered milestone in the authoritative
`AES_GUARDIAN_UI_IMPLEMENTATION_BLUEPRINT.md` 11-batch sequence.
Batches 1–10 have implementation/evidence reports or directly verified implementation;
no implementation report identifies Batch 11 completion.

Recommended next scope:

1. implement full layout-level Arabic RTL mirroring;
2. implement and verify 200% dynamic font scaling;
3. validate rendered contrast ratios on native displays;
4. run one consolidated native validation gate for crypto, op-sqlite, restart,
   concurrency and TalkBack/VoiceOver/RTL behavior;
5. reconcile any native findings without reopening already accepted source contracts.

Do not start 2B.0 backend work, PDF export, feedback/problem tooling or unrelated
legacy cleanup unless separately authorized.

## Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- `package-lock.json` SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`

No source, test, migration, dependency or configuration file was modified.
No remote or Git history operation was performed.

The current full Jest baseline was re-run and passed:

- 56 suites
- 1,206 tests
- 0 failures

## Verified implementation inventory

### Core onboarding and workspace

- Splash and first-launch screens
- Language selection
- Welcome carousel
- Prototype disclaimer
- Synthetic demo account picker
- Workspace screen
- Active role store and role-boundary helpers
- Profile/settings, help/glossary and data reset

### Declaration workflow

- Declaration form/create/edit
- Declaration list
- Declaration detail
- Submission confirmation
- Administrative review queue/action
- Correction response

### Occupational-health workflow

- OH coordination queue
- OH coordination detail
- Coordination creation
- Follow-up event recording
- Non-clinical declaration coordination status

### Surveillance

- Surveillance dashboard
- Aggregate metrics and filtering
- De-identified presentation

### CAPA/Prevention

- Overview
- Register
- Create
- Detail
- State transitions
- Durable operation identity
- Migration 9 operation table
- Migration 10 acknowledgement state

The four CAPA screens received a recent source-level conditional cross-screen
acceptance result: `CONDITIONALLY ACCEPTED` under Phase 2E.1.7.2.5.18.

### Notifications

- Migration 8 `in_app_notifications` table
- 11 canonical notification event types
- recipient resolution
- read/unread state
- Notification Centre
- bulk and single-read interactions
- localized notification presentation

### Infrastructure

- SQLite migrations 1–10
- Native/test SQLite adapters
- audit events
- demo scenario seeder/reset
- Zustand synthetic role state
- FR/EN/AR localization
- shared AES presentation components
- offline-only architecture

## Remaining scope from original functional audit

The earlier Phase 2D.0 inventory identified:

### Completed

- Synthetic account/role management
- Demonstration guide/workspace
- Secure demo reset
- Help and glossary
- Profile/settings
- In-app notifications
- CAPA
- Contextual declaration/OH/CAPA actions

### Deferred or unimplemented

- Native PDF/export/reporting
- Feedback/evaluation storage
- Technical problem reporting
- Full layout-level Arabic RTL mirroring
- Native 200% font-scaling verification
- Native physical contrast verification
- 2B.0 backend and production synchronization

The repository evidence now supports treating the remaining scope as Batch 11/native
validation plus deferred features outside the current PFE prototype sequence.

## Original 11-batch roadmap completion

| Batch | Documented objective | Current evidence |
|---|---|---|
| 1 | Design tokens/shared components | Implemented; theme foundation reports exist |
| 2 | Workspace/role switcher | Implemented |
| 3 | Declaration wizard | Implemented |
| 4 | Declaration list/details | Implemented |
| 5 | Administrative review | Implemented |
| 6 | OH coordination | Implemented |
| 7 | Surveillance dashboard | Implemented |
| 8 | CAPA | Implemented and source-level cross-screen accepted |
| 9 | Notification Centre | Implemented and end-to-end accepted |
| 10 | Profile/help/reset | Implemented |
| 11 | RTL, accessibility and consolidated validation | **NOT COMPLETED** |

## Candidate milestones and ranking

### 1. Phase 2E.1 Batch 11 — consolidated native validation

**Evidence:** Explicit authoritative blueprint sequence and explicit Batch 11 criteria.

**Scope:**

- full Arabic layout mirroring;
- 200% dynamic font scaling;
- native contrast rendering;
- TalkBack/VoiceOver;
- native crypto availability;
- native op-sqlite transaction/bridge behavior;
- genuine concurrency;
- physical process restart/recovery;
- consolidated emulator/device sign-off.

**Why first:** It is the only remaining numbered batch and specifically closes the
conditional native limitations already identified across CAPA and earlier UI work.

### 2. Quality audit cleanup

**Evidence:** `PHASE_2D_8_QUALITY_AUDIT_SUGGESTIONS.md` lists debug leftovers, large
files and TODO candidates.

**Why lower:** It is a document-only quality backlog, not an authoritative milestone.
It should follow or accompany Batch 11 if maintainability work is explicitly approved.

### 3. PDF/CSV/export reporting

**Evidence:** Phase 2D.0 explicitly lists export as missing and recommends deferral
or a printable view.

**Why lower:** Requires native or dependency decisions and is not part of the
authoritative 11-batch UI sequence.

### 4. Feedback/problem reporting

**Evidence:** Phase 2D.0 identifies both as missing.

**Why lower:** No documented implementation sequence, schema design or UI batch
assigns these features a priority.

### 5. 2B.0 backend integration

**Evidence:** A final quality review explicitly marks 2B.0 BLOCKED; current README
and architecture reports defer cloud/backend integration.

**Why deferred:** It violates the present PFE boundary and is explicitly outside
the current offline/synthetic prototype scope.

## Native validation backlog

One consolidated validation gate should cover:

- React Native crypto availability;
- `crypto.randomUUID()` or `getRandomValues()` fallback behavior;
- production `@op-engineering/op-sqlite` commit/rollback and connection reopening;
- genuine two-connection or transaction concurrency;
- process termination/restart recovery;
- TalkBack/VoiceOver;
- native Arabic RTL layout;
- 200% font scaling;
- physical contrast rendering.

The project’s existing blueprint explicitly reserves Android emulator/native
execution for Batch 11 rather than repeating it per earlier batch.

## Recommended next phase

Authorize **Phase 2E.1 Batch 11 — RTL Mirroring, Accessibility & Consolidated Native
Validation**.

The phase should begin with source/readiness discovery only, then:

1. implement or reconcile RTL layout behavior;
2. add 200% font scaling coverage;
3. run the consolidated native validation matrix;
4. report no implementation outside these gates;
5. avoid backend/PDF/feedback scope.

## Items not to start yet

- 2B.0 backend or Supabase synchronization;
- native PDF/export unless separately authorized;
- feedback/evaluation persistence;
- technical problem reporting;
- clinical milestone prescription or risk scoring;
- new unrelated hospital-management features;
- reopening accepted CAPA source without a documented defect;
- reopening accepted notification source without a documented defect.

## Final decision

**NEXT MILESTONE IDENTIFIED**

The existing roadmap clearly identifies Batch 11 as the remaining final UI milestone.
