/**
 * AES Guardian Database Types
 *
 * Core type definitions for the local SQLite database layer.
 * This module defines the structural contracts for database operations.
 *
 * NOTE: This local audit history is NOT legally immutable or tamper-proof.
 * It is a local record suitable for demonstration and coordination purposes only.
 *
 * CHANGELOG:
 *   v2 (Phase 2C.2): Corrected role model to approved AES Guardian roles.
 *                    Extended AesDeclaration with approved declaration fields.
 *   v4 (Phase 2C.3): Added Administrative Review entities & outcomes.
 *                    Flagged unverified incident types (sexual_assault).
 */

/** A row result from a raw SQL query */
export type QueryRow = any;

/** Result of an INSERT/UPDATE/DELETE statement */
export interface MutationResult {
  rowsAffected: number;
  insertId?: number;
}

/** Result of a SELECT statement */
export interface QueryResult<T = QueryRow> {
  rows: T[];
}

/** Database schema version record */
export interface SchemaVersion {
  version: number;
  applied_at: string;
  description: string;
}

// ─── Transaction Context Contract (Phase 2D.2D.6) ───────────────────────────

/** Helper predicate for safe unknown narrowing without any casts */
function isRecord(value: unknown): value is Record<string | symbol, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Core query and mutation execution interface */
export interface SqlQueryExecutor {
  execute(sql: string, params?: unknown[]): Promise<MutationResult>;
  query<T = QueryRow>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

/**
 * Transaction-scoped executor interface.
 * Represents an active execution context within an atomic database transaction.
 * Enforces single-use lifetime; cannot be reused after commit or rollback.
 */
export interface TransactionExecutor extends SqlQueryExecutor {
  readonly isCompleted: () => boolean;
}

/**
 * Database instance capable of initiating atomic transactions.
 */
export interface TransactionalDatabase extends SqlQueryExecutor {
  transaction<T>(fn: (tx: TransactionExecutor) => Promise<T>): Promise<T>;
}

/** Result of scenario seeding */
export interface SeedResult {
  seeded: boolean;
  declarationsCount: number;
  preventionActionsCount: number;
}

/**
 * Type guard verifying if an executor has the structural shape of a transaction-scoped executor.
 * Strictly verifies method signatures with zero `any` casts.
 */
export function isTransactionExecutor(executor: unknown): executor is TransactionExecutor {
  if (!isRecord(executor)) {
    return false;
  }
  return (
    typeof executor.execute === 'function' &&
    typeof executor.query === 'function' &&
    typeof executor.isCompleted === 'function'
  );
}

/**
 * Type guard verifying if an executor is a transactional database capable of initiating transactions.
 * Strictly verifies capability signatures with zero `any` casts.
 */
export function isTransactionalDatabase(executor: unknown): executor is TransactionalDatabase {
  if (!isRecord(executor)) {
    return false;
  }
  return (
    typeof executor.transaction === 'function' &&
    typeof executor.execute === 'function' &&
    typeof executor.query === 'function'
  );
}

// ─── Approved AES Guardian roles ─────────────────────────────────────────────
//
// Role semantics:
//   exposed_professional — may declare, view own declarations
//   admin_reviewer       — may retrieve submitted declarations, perform administrative reviews
//   oh_professional      — occupational health professional; distinct clinical follow-up responsibilities
//   quality_staff        — quality management access; surveillance/CAPA
//   tech_admin           — technical administration only; strictly no clinical or review access
//
// UI-layer role checks are NOT a substitute for real authorization.
// ─────────────────────────────────────────────────────────────────────────────

export type AesGuardianRole =
  | 'exposed_professional'
  | 'admin_reviewer'
  | 'oh_professional'
  | 'quality_staff'
  | 'tech_admin';

/** Valid AES Guardian roles as an array for validation */
export const AES_GUARDIAN_ROLES: AesGuardianRole[] = [
  'exposed_professional',
  'admin_reviewer',
  'oh_professional',
  'quality_staff',
  'tech_admin',
];

/** Synthetic demonstration user record */
export interface DemoUser {
  id: number;
  username: string;
  display_name: string;
  role: AesGuardianRole;
  created_at: string;
  updated_at: string;
}

// ─── Declaration status lifecycle ─────────────────────────────────────────────
// draft → submitted → under_review / correction_requested → resubmitted → under_review → closed
// Status transitions are enforced at the domain layer.
// ─────────────────────────────────────────────────────────────────────────────

export type DeclarationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'correction_requested'
  | 'resubmitted'
  | 'closed';

/** Valid status values for validation */
export const DECLARATION_STATUSES: DeclarationStatus[] = [
  'draft',
  'submitted',
  'under_review',
  'correction_requested',
  'resubmitted',
  'closed',
];

/**
 * AES declaration record — full domain model.
 *
 * No real patient or healthcare-worker identifying information should be stored.
 */
export interface AesDeclaration {
  id: number;
  /** Human-readable reference number e.g. AES-2024-001 */
  reference_number: string;
  /** FK → demo_users.id — the declaring professional */
  declared_by_user_id: number;
  /** Date/time of the adverse exposure incident (ISO 8601) */
  incident_date: string;
  /** Declaration creation timestamp (ISO 8601) */
  created_at: string;
  /** Last modification timestamp (ISO 8601) */
  updated_at: string;
  /** Submission timestamp — null until submitted (ISO 8601 | null) */
  submitted_at: string | null;
  /** Lifecycle status */
  status: DeclarationStatus;
  /**
   * Type of AES incident.
   * NOTE (Phase 2C.3): Validated against Tunisian university hospital thesis corpus:
   * Needlestick / sharp injury (piqûre/coupure), cutaneous / mucous projection
   * (projection muqueuse / cutanée), or other.
   * 'sexual_assault' is NOT an occupational AES category in hospital literature
   * and is marked unverified/retained only for backwards compatibility with test fixtures.
   */
  incident_type: AesIncidentType;
  /**
   * Description of the circumstances of the incident.
   * Free text; must not contain patient identifiers.
   */
  circumstances: string | null;
  /**
   * Description of the nature of the exposure.
   * Must not contain diagnostic conclusions or clinical recommendations.
   */
  exposure_description: string | null;
  /**
   * Protective measures already taken at time of declaration.
   * Informational only — not a clinical recommendation.
   */
  protective_measures_taken: string | null;
  /**
   * Facility or department code — anonymized/synthetic.
   */
  department_code: string | null;
  /**
   * Optional additional notes.
   */
  notes: string | null;
}

/**
 * AES incident type classification.
 */
export type AesIncidentType =
  | 'percutaneous_exposure'      // Piqûre / coupure — percutaneous injury (Source-verified)
  | 'mucocutaneous_exposure'     // Projection muqueuse ou cutanée (Source-verified)
  | 'sexual_assault'             // UNVERIFIED: Retained for migration compatibility only
  | 'other';                     // Autre — requires free-text description

export const AES_INCIDENT_TYPES: AesIncidentType[] = [
  'percutaneous_exposure',
  'mucocutaneous_exposure',
  'sexual_assault',
  'other',
];

// ─── Phase 2C.3: Administrative Review Entities ───────────────────────────────

/**
 * Valid Administrative Review outcomes.
 *
 * Source documentation alignment:
 * - acknowledged: Administrative acknowledgment of the declaration.
 * - transmission_verified: Transmission to administrative/occupational health verified.
 * - correction_requested: Administrative reviewer notes clarification/correction required.
 */
export type ReviewOutcome =
  | 'acknowledged'
  | 'transmission_verified'
  | 'correction_requested';

export const REVIEW_OUTCOMES: ReviewOutcome[] = [
  'acknowledged',
  'transmission_verified',
  'correction_requested',
];

/**
 * Administrative review record.
 * Kept strictly separate from the original declaration entity.
 */
export interface AdministrativeReview {
  id: number;
  /** FK → aes_declarations.id */
  declaration_id: number;
  /** FK → demo_users.id (must have admin_reviewer role) */
  reviewer_user_id: number;
  /** Review outcome */
  outcome: ReviewOutcome;
  /** Administrative reviewer comments/instructions */
  comments: string | null;
  /** Specific reason if correction is requested */
  correction_reason: string | null;
  /** Timestamp when the review was recorded (ISO 8601) */
  reviewed_at: string;
  created_at: string;
  /** Associated declaring professional response if outcome is correction_requested */
  response?: CorrectionResponse | null;
}

/**
 * Phase 2C.3.1: Correction response record.
 * Submitted by the declaring professional in response to a correction_requested review.
 * Stored as a separate, timestamped entity without altering original declaration fields.
 */
export interface CorrectionResponse {
  id: number;
  /** FK → aes_declarations.id */
  declaration_id: number;
  /** FK → administrative_reviews.id (the review that requested correction) */
  review_id: number;
  /** FK → demo_users.id (must be the declaring professional) */
  responding_user_id: number;
  /** Professional's clarification or correction response */
  response_text: string;
  /** Timestamp when the response was submitted (ISO 8601) */
  responded_at: string;
  created_at: string;
}

// ─── Phase 2C.4: Occupational-Health Referral Coordination Entities ─────────

/**
 * Coordination status lifecycle for occupational-health follow-up.
 * pending_acknowledgement → acknowledged → completed (or cancelled)
 */
export type OhCoordinationStatus =
  | 'pending_acknowledgement'
  | 'acknowledged'
  | 'completed'
  | 'cancelled';

export const OH_COORDINATION_STATUSES: OhCoordinationStatus[] = [
  'pending_acknowledgement',
  'acknowledged',
  'completed',
  'cancelled',
];

/**
 * Neutral, controlled coordination reason categories.
 * Strictly non-clinical; avoids diagnostic conclusions or risk scoring.
 */
export type OhCoordinationReason =
  | 'routine_followup'
  | 'serology_monitoring'
  | 'specialized_evaluation'
  | 'other_coordination';

export const OH_COORDINATION_REASONS: OhCoordinationReason[] = [
  'routine_followup',
  'serology_monitoring',
  'specialized_evaluation',
  'other_coordination',
];

/**
 * Controlled taxonomy for occupational-health follow-up events.
 * Neutral milestones recorded by the authorized occupational-health professional.
 */
export type OhFollowUpEventCategory =
  | 'contact_attempt_recorded'
  | 'contact_established'
  | 'appointment_coordinated'
  | 'consultation_recorded'
  | 'follow_up_continued'
  | 'follow_up_completed';

export const OH_FOLLOW_UP_EVENT_CATEGORIES: OhFollowUpEventCategory[] = [
  'contact_attempt_recorded',
  'contact_established',
  'appointment_coordinated',
  'consultation_recorded',
  'follow_up_continued',
  'follow_up_completed',
];

/**
 * Occupational-Health Coordination Record.
 * Represents an administrative referral coordination linking an AES declaration
 * to occupational-health follow-up milestones in this demonstration prototype.
 */
export interface OhCoordination {
  id: number;
  /** FK → aes_declarations.id */
  declaration_id: number;
  /** FK → demo_users.id (must have admin_reviewer role) */
  created_by_user_id: number;
  /** Neutral coordination reason category */
  coordination_reason: OhCoordinationReason;
  /** Lifecycle status */
  status: OhCoordinationStatus;
  /** FK → demo_users.id (occupational health professional who acknowledged receipt) */
  acknowledged_by_user_id: number | null;
  /** Timestamp when receipt was acknowledged (ISO 8601) */
  acknowledged_at: string | null;
  /** FK → demo_users.id (occupational health professional who marked follow-up complete) */
  completed_by_user_id: number | null;
  /** Timestamp when follow-up was marked complete (ISO 8601) */
  completed_at: string | null;
  /** Creation timestamp (ISO 8601) */
  created_at: string;
  /** Last update timestamp (ISO 8601) */
  updated_at: string;
  // Enriched display fields (populated on join)
  declaration_reference?: string;
  declarant_name?: string;
  declarant_user_id?: number;
  incident_date?: string;
  incident_type?: string;
  creator_name?: string;
  acknowledger_name?: string;
  completer_name?: string;
  events?: OhFollowUpEvent[];
}

/**
 * Optional filter options for listOhCoordinationsQueue.
 *
 * Default (no options): returns pending_acknowledgement and acknowledged records only.
 * includeCompleted: true  → also includes completed records (for the blueprint Tab 3
 *   "Suivi terminé" view). cancelled records remain excluded in all modes.
 *
 * Phase 2E.1.6.0.2 — backward-compatible extension.
 */
export interface OhQueueFilterOptions {
  /**
   * When true, completed coordinations are included alongside active records.
   * cancelled records remain excluded regardless of this flag.
   */
  includeCompleted?: boolean;
}

/**
 * Minimal status-only OH coordination projection for exposed professionals.
 * Strictly shields internal assignment, personnel IDs, milestone timestamps, and reasons.
 * Contains only identifiers, status, and system timestamps.
 */
export interface ExposedOhCoordinationSummary {
  id: number;
  declaration_id: number;
  status: OhCoordinationStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Approved minimal administrative OH coordination projection for admin reviewers.
 * Contains oversight milestones, administrative ownership (created_by_user_id), and
 * coordination reason category for protocol tracking, while completely omitting
 * internal OH personnel IDs, private clinical notes, and follow-up events.
 */
export interface AdminOhCoordinationSummary {
  id: number;
  declaration_id: number;
  /** Admin reviewer who initiated the coordination (for administrative handoff and creator scoping) */
  created_by_user_id: number;
  /** Neutral reason category (for protocol tracking without clinical disclosures) */
  coordination_reason: OhCoordinationReason;
  status: OhCoordinationStatus;
  acknowledged_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  declaration_reference?: string;
}

/**
 * Occupational-Health Follow-Up Event.
 * Minimum-metadata milestone recorded by the occupational-health professional.
 * Does not store clinical narratives, lab values, PEP decisions, or diagnoses.
 */
export interface OhFollowUpEvent {
  id: number;
  /** FK → oh_coordinations.id */
  coordination_id: number;
  /** Controlled event category */
  event_category: OhFollowUpEventCategory;
  /** Date/time of the event (ISO 8601) */
  event_date: string;
  /** FK → demo_users.id (must have oh_professional role) */
  recorded_by_user_id: number;
  /** Short non-clinical administrative note if required */
  administrative_note: string | null;
  /** Creation timestamp (ISO 8601) */
  created_at: string;
  // Enriched display fields
  recorder_name?: string;
}

/** Audit event record */
export interface AuditEvent {
  id: number;
  event_type: string;
  user_id: number | null;
  entity_type: string | null;
  entity_id: number | null;
  description: string;
  occurred_at: string;
}

/**
 * Filter parameters for aggregate surveillance queries.
 */
export interface SurveillanceFilters {
  startDate?: string;
  endDate?: string;
  status?: DeclarationStatus;
  incidentType?: AesIncidentType;
}

/**
 * Aggregate summary for the surveillance dashboard.
 * Contains only de-identified metrics and counts; no personal or clinical details.
 */
export interface SurveillanceDashboardMetrics {
  overview: {
    totalDeclarations: number;
    draftDeclarations: number;
    submittedDeclarations: number;
    underReviewDeclarations: number;
    correctionRequestedDeclarations: number;
    resubmittedDeclarations: number;
    closedDeclarations: number;
    activeOhCoordinations: number;
    completedOhCoordinations: number;
  };
  temporalDistribution: Array<{
    month: string; // 'YYYY-MM'
    count: number;
  }>;
  exposureDistribution: Array<{
    incidentType: AesIncidentType | string;
    count: number;
  }>;
  statusDistribution: Array<{
    status: DeclarationStatus | string;
    count: number;
  }>;
  administrativeReview: {
    totalReviews: number;
    outcomes: Array<{
      outcome: ReviewOutcome | string;
      count: number;
    }>;
    correctionRequests: number;
    correctionResponses: number;
  };
  occupationalHealth: {
    statusDistribution: Array<{
      status: OhCoordinationStatus | string;
      count: number;
    }>;
    eventCategories: Array<{
      category: OhFollowUpEventCategory | string;
      count: number;
    }>;
  };
  filterSummary?: {
    totalRecords: number;
    matchingDeclarations: number;
    hasActiveFilters: boolean;
  };
}

// ─── Phase 2C.6: Prevention & Corrective-Action Management (CAPA) ─────────────

/**
 * Prevention Action Lifecycle Status
 * proposed → in_progress → completed | cancelled
 */
export type PreventionActionStatus =
  | 'proposed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export const PREVENTION_ACTION_STATUSES: PreventionActionStatus[] = [
  'proposed',
  'in_progress',
  'completed',
  'cancelled',
];

/** Type of preventive or corrective measure */
export type PreventionActionType = 'corrective' | 'preventive';

export const PREVENTION_ACTION_TYPES: PreventionActionType[] = [
  'corrective',
  'preventive',
];

/**
 * Provisional demonstration categories of contributing factors.
 * NOTE: These are provisional categories for demonstration purposes
 * and require institutional validation before any operational use.
 */
export type ContributingFactorCategory =
  | 'device_safety_design'
  | 'procedure_compliance'
  | 'workload_fatigue'
  | 'waste_disposal_container'
  | 'protective_equipment'
  | 'training_supervision'
  | 'environment_workspace'
  | 'other_factor';

export const CONTRIBUTING_FACTOR_CATEGORIES: ContributingFactorCategory[] = [
  'device_safety_design',
  'procedure_compliance',
  'workload_fatigue',
  'waste_disposal_container',
  'protective_equipment',
  'training_supervision',
  'environment_workspace',
  'other_factor',
];

/** Full Prevention Action record */
export interface PreventionAction {
  id: number;
  reference_code: string;
  title: string;
  description: string;
  action_type: PreventionActionType;
  contributing_factor: ContributingFactorCategory;
  rationale: string;
  surveillance_reference?: string | null;
  status: PreventionActionStatus;
  target_date?: string | null;
  completed_at?: string | null;
  completion_notes?: string | null;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

/** Input for creating a new prevention action */
export interface CreatePreventionActionInput {
  title: string;
  description: string;
  action_type: PreventionActionType;
  contributing_factor: ContributingFactorCategory;
  rationale: string;
  surveillance_reference?: string | null;
  target_date?: string | null;
}

/** Filters for querying the prevention action register */
export interface PreventionActionFilters {
  status?: PreventionActionStatus;
  action_type?: PreventionActionType;
  contributing_factor?: ContributingFactorCategory;
}

/** Aggregate overview of the prevention action register */
export interface PreventionOverview {
  total: number;
  proposed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

/** Prevention action with historical audit events */
export interface PreventionActionDetail extends PreventionAction {
  audit_history: AuditEvent[];
}

/** Result of resetting demonstration scenario */
export interface ResetDemoScenarioResult {
  success: boolean;
  declarationsCount: number;
  preventionActionsCount: number;
  auditEventsCount: number;
  resetAt: string;
}

// ─── Phase 2D.2: In-App Notification System ──────────────────────────────────
//
// Event-driven local notifications for AES Guardian workflow actions.
// Offline-only SQLite persistence; zero remote APIs or background scheduling.
// ─────────────────────────────────────────────────────────────────────────────

/** Supported notification event types (11 canonical workflow events) */
export type NotificationEventType =
  | 'declaration_submitted'
  | 'review_completed'
  | 'correction_requested'
  | 'correction_submitted'
  | 'oh_coordination_created'
  | 'oh_coordination_acknowledged'
  | 'oh_milestone_recorded'
  | 'oh_coordination_completed'
  | 'capa_created'
  | 'capa_status_changed'
  | 'capa_finalized';

export const NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  'declaration_submitted',
  'review_completed',
  'correction_requested',
  'correction_submitted',
  'oh_coordination_created',
  'oh_coordination_acknowledged',
  'oh_milestone_recorded',
  'oh_coordination_completed',
  'capa_created',
  'capa_status_changed',
  'capa_finalized',
];

/** Expected recipient role for each workflow notification event type */
export const EVENT_RECIPIENT_ROLE: Record<NotificationEventType, AesGuardianRole> = {
  declaration_submitted: 'admin_reviewer',
  review_completed: 'exposed_professional',
  correction_requested: 'exposed_professional',
  correction_submitted: 'admin_reviewer',
  oh_coordination_created: 'oh_professional',
  oh_coordination_acknowledged: 'exposed_professional',
  oh_milestone_recorded: 'exposed_professional',
  oh_coordination_completed: 'exposed_professional',
  capa_created: 'quality_staff',
  capa_status_changed: 'quality_staff',
  capa_finalized: 'quality_staff',
};

/** Supported polymorphic entity types referenced by notifications */
export type NotificationEntityType =
  | 'aes_declaration'
  | 'administrative_review'
  | 'correction_response'
  | 'oh_coordination'
  | 'oh_follow_up_events'
  | 'prevention_action';

export const NOTIFICATION_ENTITY_TYPES: NotificationEntityType[] = [
  'aes_declaration',
  'administrative_review',
  'correction_response',
  'oh_coordination',
  'oh_follow_up_events',
  'prevention_action',
];

/** In-app notification record in SQLite */
export interface InAppNotification {
  id: number;
  recipient_user_id: number;
  event_type: NotificationEventType;
  title_key: string;
  message_key: string;
  entity_type: NotificationEntityType;
  entity_id: number;
  entity_reference?: string | null;
  is_read: number; // 0 = unread, 1 = read
  created_at: string;
  read_at?: string | null;
  idempotency_key: string;
}

/** Input for inserting a new notification */
export interface CreateNotificationInput {
  recipient_user_id: number;
  event_type: NotificationEventType;
  title_key: string;
  message_key: string;
  entity_type: NotificationEntityType;
  entity_id: number;
  entity_reference?: string | null;
  idempotency_key: string;
}

/** Query options/filters for retrieving notifications */
export interface NotificationFilters {
  is_read?: number; // 0 | 1
  limit?: number;
}

/** Database initialization options */
export interface DatabaseOptions {
  name: string;
  /** Enable WAL journal mode for better concurrent reads */
  enableWAL?: boolean;
}
