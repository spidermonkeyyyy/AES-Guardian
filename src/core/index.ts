/**
 * AES Guardian Core — Public API
 */

// Database layer
export {
  initializeDatabase,
  getDatabase,
  resetDatabaseForTesting,
  DatabaseService,
  AesGuardianDatabase,
  PreventionActionCreationUncertainError,
  CapaCreationOperationConflictError,
  CapaCreationOperationIntegrityError,
  CapaOperationEntropyUnavailableError,
  CapaOperationIdCollisionError,
  isValidTransition,
  isValidPreventionTransition,
  seedDemoScenarioIfEmpty,
  seedStandardScenario,
} from './database';

export type { SeedResult, ResetDemoScenarioResult } from './database';

export type {
  DatabaseOptions,
  MutationResult,
  QueryResult,
  QueryRow,
  SchemaVersion,
  DemoUser,
  AesDeclaration,
  AesIncidentType,
  AesGuardianRole,
  DeclarationStatus,
  AuditEvent,
  ReviewOutcome,
  AdministrativeReview,
  CorrectionResponse,
  OhCoordination,
  ExposedOhCoordinationSummary,
  AdminOhCoordinationSummary,
  OhCoordinationReason,
  OhCoordinationStatus,
  OhFollowUpEvent,
  OhFollowUpEventCategory,
  SurveillanceDashboardMetrics,
  SurveillanceFilters,
  PreventionAction,
  PreventionActionStatus,
  PreventionActionType,
  ContributingFactorCategory,
  CreatePreventionActionInput,
  PreventionActionFilters,
  PreventionOverview,
  PreventionActionDetail,
  NotificationEventType,
  NotificationEntityType,
  InAppNotification,
  CreateNotificationInput,
  NotificationFilters,
  CapaCreationOperation,
  CapaCreationOperationStatus,
} from './database';

export {
  AES_GUARDIAN_ROLES,
  AES_INCIDENT_TYPES,
  DECLARATION_STATUSES,
  REVIEW_OUTCOMES,
  OH_COORDINATION_REASONS,
  OH_COORDINATION_STATUSES,
  OH_FOLLOW_UP_EVENT_CATEGORIES,
  PREVENTION_ACTION_STATUSES,
  PREVENTION_ACTION_TYPES,
  CONTRIBUTING_FACTOR_CATEGORIES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_ENTITY_TYPES,
  EVENT_RECIPIENT_ROLE,
} from './database';

// Authentication boundaries & demonstration role store
export {
  UNAUTHENTICATED_CONTEXT,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  hasRole,
  canDeclare,
  canReview,
  canRespondToCorrection,
  canCoordinate,
  canFollowUp,
  canViewSurveillanceDashboard,
  canManagePreventionActions,
  canViewPreventionActions,
  useDemoRoleStore,
  DEMO_ROLE_DEFINITIONS,
} from './auth';

export type { AuthContext, DemoRoleDefinition, DemoRoleState } from './auth';

// Audit logger
export { logAuditEvent, listRecentAuditEvents } from './audit/AuditLogger';
export type { AuditEventType, AuditLogEntry } from './audit/AuditLogger';
