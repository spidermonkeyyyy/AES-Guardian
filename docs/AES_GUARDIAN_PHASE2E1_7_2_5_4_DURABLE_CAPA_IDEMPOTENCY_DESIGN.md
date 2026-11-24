# AES Guardian — Phase 2E.1.7.2.5.4
## CAPA Creation: Durable Operation Identity & Idempotency Architecture Assessment

## 1. Executive recommendation

**SCHEMA MIGRATION REQUIRED**

A current-schema-only design cannot satisfy the invariant because no existing field proves
the identity of the logical submit operation. Payload equality, creator identity,
timestamps, audit evidence, notification evidence, row ID, and reference-code equality
are related evidence, but none is a unique operation identity.

The recommended future design is a dedicated persisted operation table plus a unique
opaque `operation_id` stored on each newly created CAPA. The operation and CAPA,
creation audit, and creation notification must be inserted in one SQLite transaction.
The Create screen must persist the operation identity durably, not only in `useRef`,
and reconcile by operation ID before considering the reference code.

No implementation, schema change, migration, or source/test edit is made by this phase.

## 2. Repository identity and preservation

- Repository: `C:\Users\User\Desktop\sure\AES-Guardian-phase0.2`
- Branch: `migration/aes-guardian`
- HEAD: `c81a50c98e4e7330fad479a51a48a2fea7f912a1`
- Committed tree: `983733927b18bf30b8377f84c9c1813c74c4bf6b`
- Schema version constant: `8`
- `package-lock.json` SHA-256:
  `59DA2C8753546DB407A9834CA01863EA7B958168C51DCEF0E7944E325DF53667`
- Remote configuration was read without contact or synchronization.
- Existing 15 tracked CAPA correction modifications and 5 pre-existing/unrelated
  untracked source/report files were preserved.
- No GitHub fetch/pull/push, commit, staging, branch change, merge, rebase, reset,
  clean, stash, dependency change, migration, source edit, test edit, formatting,
  or generated file was performed during this assessment.

## 3. Current create-flow reconstruction

### 3.1 Form and submission state

`PreventionActionCreateScreen.tsx` owns title, description, action type, contributing
factor, rationale, target date, surveillance reference, validation, submission,
reconciliation, and uncertain-result state in React component state and refs.

The submission reference is held in `creationReference = useRef<string | null>(null)`.
It is therefore scoped to the mounted component instance. It is not written to
SQLite or AsyncStorage and is lost on unmount, navigation remount, or process restart.

### 3.2 Reference-code lifetime

`createPreventionActionReferenceCode()` calls
`generateCapaReferenceNumber()` in `AesGuardianDatabase.ts`.
The value is `CAPA-<local year>-<five random digits>`.
The random component is `Math.floor(Math.random() * 90000) + 10000`, so it has
90,000 possible values per local year.

The reference is a user-visible and database-unique identifier. It is not an operation
identifier. SQLite migration 7 defines `prevention_actions.reference_code TEXT NOT NULL UNIQUE`.

### 3.3 Repository validation and preflight

`createPreventionAction(userId, input, referenceCode)`:

1. Verifies the creator exists and has `quality_staff`.
2. Trims and validates title, description, action type, factor, rationale, target date,
   and surveillance reference.
3. Validates the `CAPA-YYYY-NNNNN` reference format.
4. Calls `reconcilePreventionActionCreation()` before inserting.
5. If reconciliation finds an exact matching row, returns it.
6. Otherwise opens a transaction.

Preflight only checks an exact reference. It does not receive a logical operation ID.

### 3.4 Transaction behavior

The transaction inserts:

- `prevention_actions`
- `audit_events`
- `in_app_notifications`

The CAPA insert requires a valid positive safe integer `insertId`.
The creation audit uses `prevention_action_created`, creator user ID, entity type,
entity ID, and the reference/title in description.
The notification uses `capa_created` and an idempotency key derived from entity ID,
recipient user ID, and event/entity strings.

`transactionBodyCompleted` is set only after all transaction-body operations complete,
before the transaction wrapper executes `COMMIT`.
The wrapper's return value is the inserted CAPA ID.

### 3.5 Post-commit readback

After `COMMIT`, the repository reconciles by exact reference and persisted payload,
creator, creation audit, and notification evidence. It requires the readback ID to
equal the transaction-inserted ID.

If reconciliation throws or does not prove the expected row, the method throws
`PreventionActionCreationUncertainError`.

The UI catches that typed uncertain result, retains the reference in `useRef`,
locks form edits, and exposes reconciliation. The reconciliation call retries the
same reference and payload. A result can return to the register or, if reconciliation
confirms zero rows, permit retry.

### 3.6 Navigation and process lifetime

The uncertain state exists only in mounted React state.
Navigation away calls `navigation.goBack()` and does not persist the operation or
uncertain outcome durably.
Remount creates a fresh component state and may generate a new reference.
Process termination/restart loses both the React state and reference.
No existing local operation journal is used.

## 4. SQLite schema and reuse evidence

### 4.1 Migration history

Migration 7 created `prevention_actions` with its unique reference and lifecycle
indexes. Migration 8 created `in_app_notifications` with a unique `idempotency_key`.
Audit events are polymorphic and use `entity_type` plus `entity_id`.
The database has `schema_versions` and can add migrations at version 9 or later.

### 4.2 Prevention actions

Persisted fields include row ID, unique reference, complete payload, creator, status,
dates, and timestamps.

Reuse limitations:

- No operation ID.
- Reference uniqueness identifies the visible reference, not submit identity.
- Timestamp and payload are not unique.
- Creator plus payload can describe multiple legitimate operations.
- Reference plus payload may match a collision or an identical retry.
- The row ID is only assigned after insert and is not known to the submitter before commit.

### 4.3 Audit events

Creation audit evidence is persisted only in the same transaction body and can prove
which row and creator participated. It is not unique: missing uniqueness is replaced
by application reconciliation of event fields.

It could store an operation ID in a new dedicated column or consistent description,
but the audit table has no such column today and free-text descriptions must not carry
operation identity. It is not an operation reservation mechanism.

### 4.4 Notifications

The notification table has a unique `idempotency_key`, and CAPA creation currently
derives it from row ID and creator after the CAPA insert.

Reuse limitations:

- The key depends on a row ID and is not known before insert.
- It cannot identify a logical operation when row ID or readback is unknown.
- Notification semantics differ from operation semantics.
- It has no payload hash or operation payload binding.
- It cannot reserve an operation before the CAPA insert.

### 4.5 Other persisted structures

No existing key/value, metadata, pending-operation, or operation-journal table was found
in source or migrations. AsyncStorage exists for onboarding state, but it is not a
database transaction participant and only a few first-launch helpers use it.
The Zustand role store is explicitly in-memory and not persistent.

## 5. Correctness invariant

One logical CAPA creation operation must produce at most one CAPA record. A retry must:

- return the exact previously committed row;
- confirm that no commit occurred and safely proceed; or
- remain explicitly unresolved.

It must never claim that an unrelated existing row is the result of the current operation.

Concepts must remain distinct:

| Concept | Purpose |
|---|---|
| Logical operation ID | Stable identity of one submit/retry sequence |
| CAPA reference | Human-visible unique record reference |
| Database row ID | SQLite row identity assigned by insert |
| Creator | Authorized quality account |
| Payload | Normalized title, type, factor, rationale, optional dates/reference |
| Transaction | Atomic commit unit |
| Audit/notification evidence | Post-insert integrity evidence, not operation identity |

Payload hashes may support payload mismatch detection, but they are not identity.

## 6. Existing-schema reuse assessment

### 6.1 Option A — Existing-schema-only solution

**Not sufficient.**

A reference-only retry could handle a same-mounted screen, but it cannot distinguish:

- retry of the original operation;
- legitimate second operation with identical creator/payload;
- unrelated operation with a colliding reference.

Creator plus payload can be identical across legitimate operations.
The notification key is row-derived and is evidence of one notification, not operation
identity. Audit event fields are derived evidence and are not unique operations.
Timestamps are not guaranteed unique and do not survive as submit identities.

Could there be a durable solution using the existing reference and payload? No: there
is no independent constraint tying a reference to exactly one operation and no durable
operation state. A reference-space collision can produce false success.
An existing-schema-only design is **not viable** for the stated invariant.

### 6.2 Option B — Dedicated operation identifier

**Recommended viable design.**

Future scope would include:

- A migration adding `operation_id TEXT` and payload fields or hash to
  `prevention_actions`, with a UNIQUE constraint on `operation_id`;
- a dedicated `capa_creation_operations` table, or a stronger operation-first schema
  if the operation table is the reconciliation source;
- an opaque UUID/ULID generated once when the user first submits;
- local durable storage of the operation record/state while pending;
- a repository API accepting operation ID plus normalized payload plus visible reference.

Minimum operation table fields:

- `operation_id TEXT PRIMARY KEY`
- `creator_user_id INTEGER NOT NULL REFERENCES demo_users(id)`
- `payload_hash TEXT NOT NULL`
- `normalized_payload TEXT NOT NULL` or equivalent canonical form
- `reference_code TEXT NOT NULL`
- `status TEXT NOT NULL` with pending/committed/failed/uncertain states
- `prevention_action_id INTEGER UNIQUE REFERENCES prevention_actions(id)`
- `created_at`, `updated_at`

The operation table can also enforce a unique reference reservation. The exact reference
and payload should be immutable after pending state begins. Status transitions are local
metadata and must be transactionally consistent for the committed outcome.

On initial submit:

1. Generate and durably persist operation ID and payload before repository call.
2. Insert or reconcile the operation row.
3. If the operation is already committed, verify its payload and CAPA evidence and
   return the exact row.
4. If failed-before-commit or absent, safely retry the same operation.
5. If uncertain, remain uncertain and reconcile again.

Best atomicity requires `operation_id`, CAPA, creation audit, and creation notification
to commit together. The operation row should be marked committed and linked to the
inserted CAPA in the same transaction. It should not become committed solely due to
an external AsyncStorage flag.

If reference and operation are both unique, a reference-code collision in a new
operation must not insert or reuse the prior row. It should generate a new reference
for the new operation or reject the collision, while an equal operation ID with exact
payload returns the existing row.

### 6.3 Option C — Durable pending-operation journal

A separate journal can add recovery status and UI retry state. It is viable as a
supporting durable state mechanism, but without a database operation ID/unique
constraint it is not sufficient.

Journal-only risks:

- Journal writes can succeed while SQLite does not.
- SQLite commits can succeed while journal state has not updated.
- Cleanup can remove evidence needed for reconciliation.
- Identical payload operations can remain indistinguishable.
- A reference collision can be mistaken for the original operation.
- Journal reset, unmount, backup, or database reset can create divergent state.

A journal can be useful for screens and retry UX, but it must be backed by a
transactionally persisted operation row and a unique operation identity.

### 6.4 Option D — Alternative design

No stronger or simpler alternative is identified. A dedicated operation table with
UUID plus `UNIQUE(operation_id)`, canonical payload hash, and exact linked CAPA/audit/
notification evidence is the simplest implementation of the invariant.

An operation-column-only design is weaker unless the migration backfills all existing
rows and a separate unique operation constraint exists. The dedicated table gives
explicit lifecycle and payload mismatch semantics.

## 7. Architecture collision and failure matrix

The results below apply to the recommended dedicated operation design. The existing
schema-only design is included as rejected.

| Case | Existing schema | Recommended operation design |
|---|---|---|
| Two identical payloads, same creator | Can only treat payload/creator/reference as evidence; ambiguous | Each has distinct operation UUID; same payload hash allowed, no identity collision |
| Two operations generate the same visible reference | SQLite UNIQUE rejects one, and reconciliation can false-match prior payload | Use operation ID first; collision is detected by reference reservation/row uniqueness and rejected or regenerated; never return unrelated row |
| Same operation submitted twice | Same component reference may return reconciliation; restart gets a new reference | One operation ID; exact payload finds/returns linked committed CAPA |
| Commit then readback throws | UI uncertain; may reconcile by payload/reference and false-match | Exact operation ID/payload/evidence reconciliation returns original CAPA or remains uncertain |
| App terminates after commit | Reference lost; remount uncertain | Journal/operation row and SQLite row survive; on restart reconcile committed record |
| App terminates before commit | Existing insert may not exist, but UI state lost | Operation row should remain pending/absent or be reconciled as no commit |
| Retry after app restart | Fresh reference created | Durable operation ID and payload are restored; exact row is queried |
| Operation ID exists but payload differs | No operation ID exists today | Reject mismatch; never alter or return the original row for a different payload |
| CAPA row exists, audit absent | Existing reconciler uncertain | If operation row is committed but required audit absent, uncertain; do not return success |
| CAPA row exists, notification absent | Existing reconciler uncertain | If operation row and CAPA exist but notification evidence absent, uncertain until evidence policy is satisfied |
| Reconciliation query fails | Existing reconciler/UI uncertain | Remains uncertain; no duplicate insert; retry reconciliation later |
| Unique collision with different operation ID | Existing reference collision may reconcile by payload | Reject new operation or allocate a new reference; operation IDs remain distinct |

Additional fail-point rules:

- If a pending operation is found with no CAPA, audit, or notification:
  transaction outcome may be reattempted only by the same operation ID.
- If committed state is found with exact evidence:
  return the linked row.
- If CAPA/audit/notification evidence is incomplete:
  remain uncertain; do not return success.
- If the operation ID row is committed but payload mismatch exists:
  reject as a programmer/request integrity error.
- If database error prevents exact readback:
  remain uncertain rather than infer absence.

## 8. Production SQLite adapter considerations

### 8.1 DatabaseService

`DatabaseService.ts` wraps `@op-engineering/op-sqlite`.
`open({ name: 'aes_guardian.db' })` opens the database.
WAL is enabled and foreign keys are enabled.
The transaction wrapper executes `BEGIN;`, callback operations, `COMMIT;`, and
`ROLLBACK;` on any caught callback/commit error.

The transaction wrapper sets `completed = true` only in `finally`.
It guards transaction queries/execute after callback completion.

### 8.2 Commit reporting

The wrapper reports success only after `COMMIT;` resolves.
It has no explicit callback from SQLite that distinguishes:

- commit resolved successfully;
- commit succeeded but network/bridge promise failed to deliver success;
- commit failed and rollback succeeded;
- connection lost after commit.

An exception during or around `COMMIT;` may therefore be ambiguous. Reconciliation by
operation ID is required to separate persisted state from caller/bridge uncertainty.

Source analysis does not establish an adapter guarantee that every thrown promise
maps to no commit or every returned success maps to commit. That behavior is unverified
and must not be treated as proven without native tests.

### 8.3 Connection closure/reopening

`close()` closes the underlying DB and sets the handle to null.
`open()` reopens the named database.
SQLite/WAL persistence survives reopening.
No process-level operation journal is currently used outside the React ref.

Reconciliation after reopen can query the persisted operation table and CAPA state,
provided the operation row was written or committed transactionally.
No source evidence proves when a native bridge reports commit loss in all device/error
conditions.

### 8.4 Production versus test adapter

The test-only `NativeSQLiteAdapter.ts` uses Node `node:sqlite` in-memory storage.
It begins with `BEGIN TRANSACTION`, commits with `COMMIT`, and rolls back with
`ROLLBACK`.

The existing post-commit readback test mocks `getPreventionActionById` after a
real SQLite transaction. This validates repository reconciliation against Node SQLite.
It does not prove `@op-engineering/op-sqlite` commit/bridge behavior.
Native emulator/device tests are not established by this assessment.

## 9. Migration and scope assessment

A migration is required.

Minimum proposed scope:

- Change schema version constant from `8` to `9`.
- Add migration 9 only; do not edit migrations 1–8.
- Create `capa_creation_operations` with:
  - operation ID primary key/unique key;
  - creator ID;
  - canonical payload hash and canonical payload;
  - visible reference;
  - status;
  - prevention action ID nullable unique;
  - timestamps.
- Add a unique `operation_id` column/index to `prevention_actions` for new writes,
  nullable for compatibility with existing synthetic rows.
- If a dedicated table and CAPA column duplicate operation links, make the CAPA foreign
  key and operation table linkage consistent.
- Backfill existing synthetic CAPA records with non-operational legacy IDs or leave
  `operation_id` null with an explicit legacy marker. A legacy value must not claim to
  represent a real submit operation.
- Preserve existing unique reference behavior.
- Use foreign keys for operation-to-CAPA and operation-to-user relationships.
- Add indexes for operation ID, payload hash, creator, reference, and status as needed.

Repository changes would include:

- repository accepts operation ID and payload;
- all operation/CAPA/audit/notification writes use the same transaction;
- exact operation lookup precedes reference lookup;
- payload mismatch and missing evidence remain explicit errors or uncertain states;
- reference collision handling is explicit.

Create-screen changes would include:

- durable operation ID generation and persistence;
- operation payload state storage;
- restart/remount recovery;
- no blind submit until reconciliation;
- navigation away preserves enough state to continue reconciliation.

Navigation changes may be needed to resume pending operations rather than losing state.

Tests would be required for migration/backfill, UUID uniqueness, identical payload
operations, reference collisions, pre/post-commit uncertainty, app restart, and native
adapter behavior where available.

## 10. Migration compatibility proposal

Existing synthetic CAPAs should not receive fabricated UUIDs that imply real operations.
The migration has two acceptable compatibility choices:

1. mark `operation_id` and operation-table links as `NULL/legacy` and preserve rows;
2. backfill deterministic legacy identifiers explicitly prefixed `legacy-capa-*`,
   non-random and non-client-meaningful.

The first is simpler and avoids misrepresenting history.
Future writes must require a real opaque operation ID.
Reference uniqueness remains the invariant for visible references.
The migration must not rewrite payload descriptions or overload audit text.

## 11. Future test strategy

Add a focused implementation test suite covering:

1. two legitimate identical-payload operations from one creator yield two CAPAs;
2. forced reference collision returns/rejects correctly and never returns unrelated row;
3. repeat of same operation ID returns same CAPA ID;
4. repeat with changed payload rejects;
5. commit followed by readback throw remains uncertain;
6. app process restart resolves pending/committed operation;
7. app termination before commit leaves no CAPA or permits exact reattempt;
8. missing creation audit remains uncertain;
9. missing creation notification remains uncertain;
10. reconciliation query failure remains uncertain;
11. migration/backfill does not alter legacy row count/payload;
12. rollback leaves operation, CAPA, audit, and notification all absent;
13. unique constraints reject duplicate operation IDs and reference collisions;
14. operation/CAPA/audit/notification commit is atomic;
15. native production adapter commit ambiguity is tested on supported device builds.

Tests must not infer native behavior from Node `node:sqlite` alone.

## 12. Unverified assumptions and remaining risks

- Native `@op-engineering/op-sqlite` commit-failure semantics were not established.
- No emulator or physical device was launched.
- AsyncStorage durability and atomicity relative to SQLite were not established as
  a transaction mechanism.
- The exact React Navigation remount stack behavior is source-visible but not tested
  with a process restart.
- The local random UUID implementation available to React Native was not assessed.
- The migration compatibility model for legacy rows must be chosen during implementation.
- Notification insertion policy on uncertainty was not changed.
- No requirement or test currently proves operation payload canonicalization across
  process/locale/code-version boundaries.
- A journal cleanup policy could delete still-needed recovery evidence.

## 13. Final comparison

| Option | At-most-one invariant | Crash recovery | Reference collision | Complexity |
|---|---|---|---|---|
| Existing schema only | No | No | Unsafe | Low, rejected |
| Dedicated operation ID/table | Yes, when uniquely constrained and atomically written | Yes | Safe | Moderate, recommended |
| Journal alone | No | Partial | Unsafe | Moderate, insufficient |
| Operation column only | Possibly, but weaker | Depends on migration/backfill and uniqueness | Depends on linked evidence | Moderate |

## 14. Stop point

**Architecture recommendation: SCHEMA MIGRATION REQUIRED**

The existing schema cannot guarantee durable logical-operation identity.
A dedicated, unique persisted operation identity associated with the CAPA transaction
is required. Implementation authority was not granted.

This phase made no implementation changes.
