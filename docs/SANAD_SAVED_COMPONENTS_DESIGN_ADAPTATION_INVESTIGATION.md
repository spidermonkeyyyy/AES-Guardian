# SANAD Saved Components - Design Adaptation Investigation

## Scope and disposition

This report is diagnostic only. No application source, localization, test, configuration, generated Android, screenshot or previous report was modified.

Concept decisions:

- **Prevention contextual panel: DEFER.** There is a potentially useful interaction, but SANAD already exposes CAPA status and the Help Centre already provides expandable topical guidance. The missing localized prevention topic content is not yet sufficient for a safe implementation.
- **Static AES lifecycle diagram: DEFER for a narrow implementation, not recommend for the workspace.** A static, conditional status summary may help on the declaration detail screen or Help Centre, but it must not imply that every case follows one linear path.

## Git baseline

Initial Git audit:

- Branch: `migration/aes-guardian`
- HEAD: `86bc6b7e3392893418ec5ed24e604e03032dfa06`
- Upstream: `origin/migration/aes-guardian`
- Staged paths: `0`
- Porcelain-v2 status entries: `683` lines

The working tree remained dirty as a result of pre-existing Batch 1-4 and unrelated repository changes. No restoration or cleanup was performed.

## Source inspection

Converted React Native sources inspected:

- `C:\Users\User\Downloads\saved-components-rn\all-components\FeaturesWithPanel.tsx`
- `C:\Users\User\Downloads\saved-components-rn\all-components\InkOrbitFeatures.tsx`
- `C:\Users\User\Downloads\saved-components-rn\all-components\index.ts`

Original archive references inspected:

- `saved-components/features-with-panel.jsx`
- `saved-components/ink-orbit-features.jsx`

The original components match the converted design intent:

- `FeaturesWithPanel` is a remote-media and marketing feature showcase with an active feature list and preview panel.
- `InkOrbitFeatures` is an editorial SaaS/AI showcase with animated team/report/integration/forecast diagrams.

## Existing SANAD screen inspection

### Prevention experience

Relevant screens:

- `PreventionOverviewScreen.tsx`
- `PreventionActionRegisterScreen.tsx`
- `PreventionActionDetailScreen.tsx`
- `PreventionActionCreateScreen.tsx`
- `HelpGlossaryScreen.tsx`

The prevention overview currently contains:

- The prototype disclaimer.
- Aggregate declaration count.
- Total prevention actions.
- Proposed, in-progress, completed and cancelled status counts.
- Existing CircleProgress and AnimatedProgressCard summaries.
- A view-register action.
- A role-authorized create-action action.

The prevention register already provides status filters and horizontal chip navigation. The detail screen exposes the action description, contributing factor, target date, status, completion data and transition controls.

The Help Centre already uses expand/collapse cards and categories for existing guidance. It has an established glossary, category filtering and localized offline content.

### AES lifecycle implementation

Relevant domain model:

- Declaration status: `draft`, `submitted`, `under_review`, `correction_requested`, `resubmitted`, `closed`.
- Valid transition table:
  - `draft -> submitted`
  - `submitted -> under_review | correction_requested`
  - `under_review -> correction_requested | closed`
  - `correction_requested -> resubmitted`
  - `resubmitted -> under_review | correction_requested`
  - `closed -> none`

Occupation-health coordination has a separate lifecycle:

- `pending_acknowledgement -> acknowledged -> completed`
- Cancelled is also possible.

Prevention/CAPA actions have an independent lifecycle:

- `proposed -> in_progress -> completed | cancelled`

These three workflows are related to an AES declaration but are not forced to progress in lockstep.

### Existing lifecycle communication

Lifecycle information is already communicated through:

- `AesStatusBadge` on declaration detail and administration surfaces.
- The exposed-professional correction pending banner.
- Administrative review actions.
- Occupational-health queue/detail status.
- Prevention status cards and action detail transitions.
- The Help Centre's end-to-end workflow sections.

The declaration details summary tab already shows current status, creation and submission timestamps. It has role-specific correction and review actions. Thus, there is already a clear, authoritative location for "where this declaration is now," but no reusable general overview of optional branches.

## Investigation A - Prevention contextual panel

### Concept

The FeaturesWithPanel pattern could be simplified to:

- A compact list of existing prevention topic types.
- A selected panel showing a localized topic description.
- Optional navigation to the existing prevention register/detail screen.
- No remote media, no large heading, no preview card, no external link.

Potential topic sources already present:

- Safe device design
- Procedure compliance
- Sharps disposal container
- Personal protective equipment
- Training/supervision
- Environment/workspace
- Other factor

These are the supported `contributing_factor` categories in the prevention data model and localized in French, English and Arabic.

### Best existing screen

The best potential placement is the `PreventionActionDetailScreen` or a later dedicated prevention guidance section in `PreventionOverviewScreen`, not the workspace.

`PreventionActionDetailScreen` is specific to a single registered action and already knows its `contributing_factor`. A contextual panel could explain the active factor category, but the app currently lacks verified definitions for those categories.

The overview would be a poor placement because it already contains:

- Synthetic-data disclaimer.
- Declaration count.
- Total actions.
- Status counts.
- CAPA ring and progress card.
- Register/create actions.

Adding an exploratory topic panel to the overview would duplicate action-status information and increase density.

### Existing content coverage

Supported:

- `contributing_factor` category labels.
- Action status, action description and action target date.
- Existing localized status and factor labels.
- Existing register filters and detail views.

Missing:

- Verified definitions of each factor category.
- Verified prevention guidance or examples.
- Institutional policies or procedure recommendations.
- Evidence that a factor is a root cause or clinical hazard.

The existing factor taxonomy is a neutral registration field. It is not sufficient by itself to author clinical guidance or claim that a listed factor should be addressed in a specific way.

### Duplication and density risk

A contextual panel would duplicate:

- Factor filters and detail metadata already visible in the register.
- Status cards and progress summaries already visible in the overview.
- Expand/collapse information patterns in the Help Centre.

It would also create a second way to discover prevention content unless all existing navigation was migrated to it.

### Layout and interaction recommendation

If implementation is later authorized, prefer:

- A compact two-column layout only where width permits.
- A vertically stacked list/panel at narrow widths.
- Three to seven existing factor categories, selected one at a time.
- 48 dp minimum interactive height.
- Existing `AesCard`, `AppText`, `AppIcon`, `AesStatusBadge` and theme tokens.
- No remote media.
- No decorative animation; only a restrained static selection change.
- The factor label and an existing, verified explanatory string.
- Optional navigation to register filtered by that factor only if a supported repository filter already exists.

### Decision

**DEFER.**

The interaction pattern is technically compatible, but the current prevention content gap prevents a safe implementation. Existing status and factor information are already discoverable through the register/detail screens and Help Centre.

## Investigation B - Static AES lifecycle diagram

### Concept

A static lifecycle summary could show:

- Declaration
- Administrative review
- Occupational-health follow-up
- Prevention/CAPA

However, it must visually express branches and optional participation rather than a mandatory sequence.

### Where it could help

The best candidate is the `HelpGlossaryScreen`:

- It already explains end-to-end workflows.
- It has a Help tab and Glossary tab.
- It is offline, localized and non-role-specific.
- It already describes administrative, occupational-health and quality categories.

A second possible location is the `DeclarationDetailsScreen` summary tab:

- It could show the current declaration status and applicable follow-up context.
- It must remain case-specific and must not show future stages as mandatory.
- It should not require full lifecycle data that is not yet present for an individual case.

The workspace is not a good default placement:

- It is role-switching and metric-dense.
- It already has role-specific modules and status information.
- A global diagram could confuse exposed, administrative, OH and quality roles.

### Existing data sources

Declaration status:

- `AesDeclaration.status`
- Administrative review history
- Correction responses and resubmission state
- Submitted/created timestamps

Occupational-health status:

- `OhCoordination.status`
- Pending acknowledgement
- Acknowledged
- Completed
- Cancelled
- Separate follow-up events

Prevention status:

- Prevention action status
- Proposed
- In-progress
- Completed
- Cancelled

Role responsibilities:

- Exposed professional declares and may respond to corrections.
- Administrative reviewer receives submissions and records review outcomes.
- Occupational-health professional manages coordination and follow-up.
- Quality staff manages surveillance and CAPA.
- Technical administrator has no operational clinical/review role.

### Conditional-transition requirements

The diagram must not show:

- Every declaration moving automatically through review.
- Administrative review automatically requiring occupational-health follow-up.
- Occupational-health follow-up automatically requiring CAPA.
- Prevention/CAPA as a guaranteed outcome.
- `closed` as proof of clinical resolution.

It should distinguish:

- Core declaration progression.
- Optional correction branch.
- Optional occupational-health coordination.
- Independent prevention/CAPA register.

A suitable static representation could use nodes and explicit labels such as "if requested", "if created", "if applicable" and "independent follow-up."

### Workflow risks

- A linear diagram would misrepresent the valid transition graph.
- A "completed" stage could be mistaken for clinical closure or an outcome guarantee.
- A role-independent diagram could imply unauthorized access or cross-role actions.
- Adding synthetic counts or progress values would be prohibited.
- A diagram in the workspace could compete with role-specific navigation and metrics.
- Static state could become stale unless derived from actual record status.

### Decision

**DEFER.**

The conceptual benefit is real enough to document, but implementation should wait until product review authorizes a narrow, conditional diagram. The Help Centre is the safer first placement. Declaration details is a possible second integration point for the current case only.

Not recommended for the workspace or as an animated, orbit-style component.

## Cross-concept localization and RTL

If either concept is later authorized:

- Use existing localization keys and add only the minimum missing strings.
- Provide French, English and Arabic versions.
- Use logical RTL flex order.
- Keep numeric, status and ISO values readable in LTR where required.
- Use `AppText`, `AppIcon`, `AesCard`, `AesButton`, `AesStatusBadge` and ThemeContext.
- Keep 48 dp minimum touch targets.
- Preserve screen-reader focus order and selected state.
- Do not add continuous animation.
- Use static or one-shot restrained transitions only.
- Use no remote assets or network calls.

## Overall recommendations

1. **Prevention contextual panel: DEFER.** Reuse existing expand/collapse or contextual detail patterns only after localized content and verified factor definitions exist.
2. **Static lifecycle diagram: DEFER.** Use a conditional, static Help Centre view first; do not place it in the workspace.
3. Do not implement either concept during this stop. Both concepts can be reconsidered after content, clinical-safety and UX review.

## Git after inspection

No application file was created or modified in this investigation.

The only deliverable created is this report. A final porcelain-v2 status audit and path comparison should be performed by the repository tools before delivery.
