/**
 * AES Guardian — Phase 2D.2F.1.1
 * Notification Navigation Resolver
 *
 * Maps an in-app notification to a typed navigation destination by:
 *   1. Validating active identity context (authentication, valid role, not tech_admin).
 *   2. Validating active identity and persisted role consistency (Correction B).
 *   3. Verifying notification ownership via authoritative recipient-scoped database lookup
 *      (WHERE id = ? AND recipient_user_id = ?) without secondary existence disclosure (Correction A).
 *   4. Enforcing strict role boundaries per canonical event type.
 *   5. Resolving the destination entity through authorized database methods.
 *   6. Returning a correlated discriminated-union result — binding each route to its exact parameters.
 *
 * PRIVACY & SECURITY CONTRACTS:
 * - Anti-Enumeration / Privacy: Foreign notification IDs and non-existent IDs return
 *   indistinguishable generic failure results ({ status: 'not_found' }). No existence oracle query is performed.
 * - Identity Integrity: Active context role MUST match the persisted database role. Caller-supplied overrides
 *   or role tampering are strictly rejected.
 * - Invariance: Resolution never mutates notification read state.
 * - tech_admin and unauthenticated callers always receive { status: 'unauthorized' }.
 *
 * SCOPE: This module must NOT implement notification-centre UI, notification
 * list/card components, unread badges, or any new clinical workflows.
 */

import type { AesGuardianDatabase } from '../../../core/database/AesGuardianDatabase';
import type { InAppNotification, NotificationEventType } from '../../../core/database/types';
import type { AuthContext } from '../../../core/auth/boundaries';
import type { RootStackParamList } from '../../../navigation/routes';

// ─── Destination Routes & Correlated Result Types ────────────────────────────

/**
 * All valid route names reachable via in-app notification navigation.
 */
export type NotificationDestinationRoute =
  | 'adminReviewAction'
  | 'declarationDetails'
  | 'correctionResponse'
  | 'ohCoordinationDetail'
  | 'declarationCoordinationStatus'
  | 'preventionActionDetail';

/**
 * Correlated discriminated union for successful navigation.
 * Binds each exact route name to its specific parameter type from RootStackParamList.
 */
export type NotificationNavigationSuccess =
  | {
      status: 'success';
      route: 'adminReviewAction';
      params: RootStackParamList['adminReviewAction'];
    }
  | {
      status: 'success';
      route: 'declarationDetails';
      params: RootStackParamList['declarationDetails'];
    }
  | {
      status: 'success';
      route: 'correctionResponse';
      params: RootStackParamList['correctionResponse'];
    }
  | {
      status: 'success';
      route: 'ohCoordinationDetail';
      params: RootStackParamList['ohCoordinationDetail'];
    }
  | {
      status: 'success';
      route: 'declarationCoordinationStatus';
      params: RootStackParamList['declarationCoordinationStatus'];
    }
  | {
      status: 'success';
      route: 'preventionActionDetail';
      params: RootStackParamList['preventionActionDetail'];
    };

/**
 * The caller is not authenticated, role is inconsistent with database,
 * role is prohibited, or role does not match event requirement.
 */
export interface NotificationNavigationUnauthorized {
  status: 'unauthorized';
  reason: string;
}

/**
 * The notification or target entity does not exist or is not accessible to the caller.
 * Used uniformly for foreign notification IDs and non-existent IDs to prevent disclosure.
 */
export interface NotificationNavigationNotFound {
  status: 'not_found';
  reason: string;
}

/**
 * The notification's event_type or entity_type combination is unrecognised,
 * or required structural fields are absent.
 */
export interface NotificationNavigationInvalidEvent {
  status: 'invalid_event';
  reason: string;
}

export type NotificationNavigationResult =
  | NotificationNavigationSuccess
  | NotificationNavigationUnauthorized
  | NotificationNavigationNotFound
  | NotificationNavigationInvalidEvent;

// ─── Role-to-Event Authorization Matrix ──────────────────────────────────────

/**
 * Canonical set of roles that may receive each event type.
 * Enforced at resolution time independently of whatever role the notification
 * was originally routed to at creation time.
 */
const AUTHORIZED_ROLE_FOR_EVENT: Record<NotificationEventType, string> = {
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

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function unauthorized(reason: string): NotificationNavigationUnauthorized {
  return { status: 'unauthorized', reason };
}

function notFound(reason: string): NotificationNavigationNotFound {
  return { status: 'not_found', reason };
}

function invalidEvent(reason: string): NotificationNavigationInvalidEvent {
  return { status: 'invalid_event', reason };
}

function success<R extends NotificationDestinationRoute>(
  route: R,
  params: RootStackParamList[R],
): NotificationNavigationSuccess {
  return { status: 'success', route, params } as NotificationNavigationSuccess;
}

// ─── Main Resolver ────────────────────────────────────────────────────────────

/**
 * Resolves a notification to its navigation destination after verifying:
 *   - Active identity authentication and non-tech_admin status
 *   - Consistency between active context role and database-persisted role (Correction B)
 *   - Notification ownership via single recipient-scoped database query without existence disclosure (Correction A)
 *   - Event-level and entity-level authorization
 *
 * @param notification - The in-app notification to resolve. Must provide a valid numeric id.
 * @param authContext  - The current authenticated identity. Must NOT come from
 *                       the notification itself.
 * @param db           - The AES Guardian database instance for identity, ownership and entity resolution.
 *
 * @returns A correlated discriminated union: success | unauthorized | not_found | invalid_event.
 *          Never throws — all errors are encoded in the return value.
 */
export async function resolveNotificationNavigation(
  notification: InAppNotification,
  authContext: AuthContext,
  db: AesGuardianDatabase,
): Promise<NotificationNavigationResult> {
  // ── 1. Authentication & Context Validation ─────────────────────────────────
  if (!authContext || !authContext.isAuthenticated || typeof authContext.userId !== 'number' || authContext.userId <= 0) {
    return unauthorized('User is not authenticated.');
  }

  if (!authContext.role || authContext.role === 'unauthenticated') {
    return unauthorized('Active identity role is missing or unauthenticated.');
  }

  if (authContext.role === 'tech_admin') {
    return unauthorized('tech_admin role is prohibited from notification navigation.');
  }

  const userId = authContext.userId;

  // ── 2. Persisted Identity & Role Consistency Validation (Correction B) ──────
  // Verify that the user exists in demo_users and that their persisted role matches authContext.role
  const persistedUser = await db.getDemoUser(userId);
  if (!persistedUser) {
    return unauthorized(`Active user ${userId} was not found in database.`);
  }

  if (persistedUser.role === 'tech_admin') {
    return unauthorized('tech_admin role is prohibited from notification navigation.');
  }

  if (persistedUser.role !== authContext.role) {
    return unauthorized(
      `Active identity role '${authContext.role}' does not match persisted role '${persistedUser.role}' for user ${userId}.`,
    );
  }

  // ── 3. Notification identifier validation ─────────────────────────────────
  // Fails before database access if ID is invalid
  if (!notification || typeof notification.id !== 'number' || notification.id <= 0) {
    return invalidEvent('Notification must provide a valid numeric identifier.');
  }

  // ── 4. Authoritative Recipient-Scoped Notification Lookup (Correction A) ───
  // Strictly query with WHERE id = ? AND recipient_user_id = ?.
  // No secondary query is executed: non-existent notification IDs and foreign notification IDs
  // return the exact same generic failure result ({ status: 'not_found' }).
  const verifiedRecord = await db.getNotificationById(notification.id, userId);
  if (!verifiedRecord) {
    return notFound(`Notification ${notification.id} was not found.`);
  }

  // Use the verified, database-persisted record as the single source of truth
  const { event_type, entity_type, entity_id } = verifiedRecord;

  // ── 5. Basic structural validation ────────────────────────────────────────
  if (!entity_id) {
    return invalidEvent(
      `Notification ${verifiedRecord.id} is missing entity_id (event: ${event_type}).`,
    );
  }
  if (!entity_type) {
    return invalidEvent(
      `Notification ${verifiedRecord.id} is missing entity_type (event: ${event_type}).`,
    );
  }

  // ── 6. Role authorisation per event type ──────────────────────────────────
  const requiredRole = AUTHORIZED_ROLE_FOR_EVENT[event_type];
  if (!requiredRole) {
    return invalidEvent(`Unknown notification event type: '${event_type}'.`);
  }
  if (authContext.role !== requiredRole) {
    return unauthorized(
      `Role '${authContext.role}' is not authorized to navigate to event type '${event_type}'. ` +
        `Required role: '${requiredRole}'.`,
    );
  }

  // ── 7. Entity-scoped resolution ───────────────────────────────────────────
  try {
    switch (event_type) {
      // ── declaration_submitted ─────────────────────────────────────────────
      // Recipient: admin_reviewer
      // Destination: adminReviewAction { declarationId: entity_id }
      case 'declaration_submitted': {
        if (entity_type !== 'aes_declaration') {
          return invalidEvent(
            `Event 'declaration_submitted' expects entity_type 'aes_declaration', got '${entity_type}'.`,
          );
        }
        const decl = await db.getDeclarationById(entity_id, userId);
        if (!decl) {
          return notFound(
            `Declaration ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('adminReviewAction', { declarationId: entity_id });
      }

      // ── review_completed ──────────────────────────────────────────────────
      // Recipient: exposed_professional
      // Destination: declarationDetails { declarationId: review.declaration_id }
      case 'review_completed': {
        if (entity_type !== 'administrative_review') {
          return invalidEvent(
            `Event 'review_completed' expects entity_type 'administrative_review', got '${entity_type}'.`,
          );
        }
        const review = await db.getAdministrativeReviewById(entity_id, userId);
        if (!review) {
          return notFound(
            `Administrative review ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('declarationDetails', { declarationId: review.declaration_id });
      }

      // ── correction_requested ──────────────────────────────────────────────
      // Recipient: exposed_professional
      // Destination: correctionResponse { declarationId, reviewId: entity_id }
      case 'correction_requested': {
        if (entity_type !== 'administrative_review') {
          return invalidEvent(
            `Event 'correction_requested' expects entity_type 'administrative_review', got '${entity_type}'.`,
          );
        }
        const review = await db.getAdministrativeReviewById(entity_id, userId);
        if (!review) {
          return notFound(
            `Administrative review ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('correctionResponse', {
          declarationId: review.declaration_id,
          reviewId: entity_id,
        });
      }

      // ── correction_submitted ──────────────────────────────────────────────
      // Recipient: admin_reviewer
      // Destination: adminReviewAction { declarationId: response.declaration_id }
      case 'correction_submitted': {
        if (entity_type !== 'correction_response') {
          return invalidEvent(
            `Event 'correction_submitted' expects entity_type 'correction_response', got '${entity_type}'.`,
          );
        }
        const response = await db.getCorrectionResponseById(entity_id, userId);
        if (!response) {
          return notFound(
            `Correction response ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('adminReviewAction', { declarationId: response.declaration_id });
      }

      // ── oh_coordination_created ───────────────────────────────────────────
      // Recipient: oh_professional
      // Destination: ohCoordinationDetail { coordinationId: entity_id }
      case 'oh_coordination_created': {
        if (entity_type !== 'oh_coordination') {
          return invalidEvent(
            `Event 'oh_coordination_created' expects entity_type 'oh_coordination', got '${entity_type}'.`,
          );
        }
        const coord = await db.getOhCoordinationById(entity_id, userId);
        if (!coord) {
          return notFound(
            `OH coordination ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('ohCoordinationDetail', { coordinationId: entity_id });
      }

      // ── oh_coordination_acknowledged ──────────────────────────────────────
      // Recipient: exposed_professional
      // Destination: declarationCoordinationStatus { declarationId }
      case 'oh_coordination_acknowledged': {
        if (entity_type !== 'oh_coordination') {
          return invalidEvent(
            `Event 'oh_coordination_acknowledged' expects entity_type 'oh_coordination', got '${entity_type}'.`,
          );
        }
        const coord = await db.getOhCoordinationById(entity_id, userId);
        if (!coord) {
          return notFound(
            `OH coordination ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('declarationCoordinationStatus', {
          declarationId: coord.declaration_id,
        });
      }

      // ── oh_milestone_recorded ─────────────────────────────────────────────
      // Recipient: exposed_professional
      // Destination: declarationCoordinationStatus { declarationId }
      // Chain: follow-up event → coordination → declaration
      case 'oh_milestone_recorded': {
        if (entity_type !== 'oh_follow_up_events') {
          return invalidEvent(
            `Event 'oh_milestone_recorded' expects entity_type 'oh_follow_up_events', got '${entity_type}'.`,
          );
        }
        const event = await db.getOhFollowUpEventById(entity_id, userId);
        if (!event) {
          return notFound(
            `OH follow-up event ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('declarationCoordinationStatus', {
          declarationId: event.declaration_id,
        });
      }

      // ── oh_coordination_completed ─────────────────────────────────────────
      // Recipient: exposed_professional
      // Destination: declarationCoordinationStatus { declarationId }
      case 'oh_coordination_completed': {
        if (entity_type !== 'oh_coordination') {
          return invalidEvent(
            `Event 'oh_coordination_completed' expects entity_type 'oh_coordination', got '${entity_type}'.`,
          );
        }
        const coord = await db.getOhCoordinationById(entity_id, userId);
        if (!coord) {
          return notFound(
            `OH coordination ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('declarationCoordinationStatus', {
          declarationId: coord.declaration_id,
        });
      }

      // ── capa_created / capa_status_changed / capa_finalized ───────────────
      // Recipient: quality_staff
      // Destination: preventionActionDetail { actionId: entity_id }
      case 'capa_created':
      case 'capa_status_changed':
      case 'capa_finalized': {
        if (entity_type !== 'prevention_action') {
          return invalidEvent(
            `Event '${event_type}' expects entity_type 'prevention_action', got '${entity_type}'.`,
          );
        }
        const action = await db.getPreventionActionById(userId, entity_id);
        if (!action) {
          return notFound(
            `Prevention action ${entity_id} referenced by notification ${verifiedRecord.id} was not found or is not accessible.`,
          );
        }
        return success('preventionActionDetail', { actionId: entity_id });
      }

      default: {
        // TypeScript exhaustiveness guard
        const _exhaustive: never = event_type;
        return invalidEvent(`Unhandled notification event type: '${String(_exhaustive)}'.`);
      }
    }
  } catch (err: unknown) {
    // ── 8. Authorization errors from DB (role prohibited, ownership mismatch)
    const message = err instanceof Error ? err.message : String(err);
    if (/unauthorized/i.test(message) || /prohibited/i.test(message)) {
      return unauthorized(
        `Database authorization denied access for user ${userId} on event '${event_type}': ${message}`,
      );
    }
    // ── 9. Unexpected errors — surface as not_found to avoid leaking details
    return notFound(
      `Unexpected error resolving navigation for notification ${verifiedRecord.id}: ${message}`,
    );
  }
}
