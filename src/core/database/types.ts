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

/** Database initialization options */
export interface DatabaseOptions {
  name: string;
  /** Enable WAL journal mode for better concurrent reads */
  enableWAL?: boolean;
}
