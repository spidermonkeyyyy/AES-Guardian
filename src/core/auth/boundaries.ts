/**
 * AES Guardian Authentication Boundaries
 *
 * ARCHITECTURAL BOUNDARY — NOT an authentication implementation.
 *
 * This module defines the structural contracts for role-based permissions
 * and future authentication integration.
 *
 * IMPORTANT NOTES:
 * - UI-layer role checks are NOT a substitute for real authorization.
 *   Domain and repository layers must perform explicit role validation.
 * - Technical administration (tech_admin) must have strictly zero clinical
 *   or administrative review access.
 *
 * CHANGELOG:
 *   Phase 2C.2: Aligned to approved 5-role model.
 *   Phase 2C.3: Strengthened role boundaries:
 *               Only admin_reviewer may execute administrative review actions.
 *               oh_professional, quality_staff, tech_admin do not inherit review powers.
 */

import type { AesGuardianRole } from '../database/types';
export type { AesGuardianRole } from '../database/types';
export { AES_GUARDIAN_ROLES } from '../database/types';

/**
 * Represents the authenticated identity context within the application.
 * NOT a security boundary — for coordination purposes only.
 */
export interface AuthContext {
  /** Whether a user session is currently active. */
  isAuthenticated: boolean;
  /**
   * The current user's role.
   */
  role: AesGuardianRole | 'unauthenticated';
  /** Display name of the current user (synthetic in prototype). */
  displayName: string | null;
  /** Opaque user identifier (references demo_users.id). */
  userId: number | null;
}

/** The unauthenticated context — default before any session is established. */
export const UNAUTHENTICATED_CONTEXT: AuthContext = {
  isAuthenticated: false,
  role: 'unauthenticated',
  displayName: null,
  userId: null,
};

/**
 * Synthetic demonstration context for exposed professional (declarer).
 */
export const SYNTHETIC_DEMO_CONTEXT: AuthContext = {
  isAuthenticated: true,
  role: 'exposed_professional',
  displayName: 'Professionnel Démo (Synthétique)',
  userId: 1, // References prof.demo.expose
};

/**
 * Synthetic demonstration context for administrative reviewer.
 */
export const SYNTHETIC_ADMIN_REVIEWER_CONTEXT: AuthContext = {
  isAuthenticated: true,
  role: 'admin_reviewer',
  displayName: 'Administrateur RH (Démo)',
  userId: 2, // References admin.demo.review
};

/**
 * Checks whether the given context has one of the allowed roles.
 */
export function hasRole(
  context: AuthContext,
  allowedRoles: Array<AesGuardianRole | 'unauthenticated'>,
): boolean {
  return context.isAuthenticated && allowedRoles.includes(context.role);
}

/**
 * Returns true if the role may create or manage AES declarations.
 * Declaration creation is limited strictly to exposed_professional.
 */
export function canDeclare(context: AuthContext): boolean {
  return context.isAuthenticated && context.role === 'exposed_professional';
}

/**
 * Returns true if the role may access the administrative review queue
 * and record administrative review outcomes.
 *
 * STRICT BOUNDARY (Phase 2C.3):
 * Only `admin_reviewer` is authorized to perform administrative review.
 * - `oh_professional`: occupational health clinician; separate clinical follow-up.
 * - `quality_staff`: surveillance & CAPA tracking; no administrative review power.
 * - `tech_admin`: technical maintenance only; zero clinical/review access.
 */
export function canReview(context: AuthContext): boolean {
  return context.isAuthenticated && context.role === 'admin_reviewer';
}

/**
 * Returns true if the role may respond to administrative correction requests.
 *
 * STRICT BOUNDARY (Phase 2C.3.1):
 * Only `exposed_professional` who owns the declaration may respond.
 * - `admin_reviewer`: receives responses for re-review; cannot author responses.
 * - `oh_professional`: clinical follow-up; no administrative correction powers.
 * - `quality_staff`: surveillance only; no correction response permissions.
 * - `tech_admin`: technical maintenance only; zero clinical/review access.
 */
export function canRespondToCorrection(context: AuthContext): boolean {
  return context.isAuthenticated && context.role === 'exposed_professional';
}

/**
 * Returns true if the role may create an occupational-health coordination record.
 *
 * STRICT BOUNDARY (Phase 2C.4):
 * Only `admin_reviewer` may initiate a coordination record linked to a declaration.
 */
export function canCoordinate(context: AuthContext): boolean {
  return context.isAuthenticated && context.role === 'admin_reviewer';
}

/**
 * Returns true if the role may acknowledge, record events on, or complete
 * an occupational-health coordination record.
 *
 * STRICT BOUNDARY (Phase 2C.4):
 * Only `oh_professional` may perform follow-up workflow actions.
 */
export function canFollowUp(context: AuthContext): boolean {
  return context.isAuthenticated && context.role === 'oh_professional';
}

/**
 * Synthetic demonstration context for quality staff (surveillance/monitoring).
 */
export const SYNTHETIC_QUALITY_STAFF_CONTEXT: AuthContext = {
  isAuthenticated: true,
  role: 'quality_staff',
  displayName: 'Responsable Qualité (Démo)',
  userId: 4, // References qualite.demo
};

/**
 * Synthetic demonstration context for occupational-health professional.
 */
export const SYNTHETIC_OH_PROFESSIONAL_CONTEXT: AuthContext = {
  isAuthenticated: true,
  role: 'oh_professional',
  displayName: 'Médecin du Travail (Démo)',
  userId: 3, // References medecin.demo.sst
};

/**
 * Synthetic demonstration context for technical administrator.
 */
export const SYNTHETIC_TECH_ADMIN_CONTEXT: AuthContext = {
  isAuthenticated: true,
  role: 'tech_admin',
  displayName: 'Administrateur Technique (Démo)',
  userId: 5, // References admin.demo.tech
};

/**
 * Returns true if the role may access the aggregate surveillance dashboard.
 *
 * STRICT BOUNDARY (Phase 2C.5):
 * - `quality_staff`: Authorized for aggregate surveillance metrics.
 * - `admin_reviewer`: Authorized for aggregate administrative metrics.
 * - `oh_professional`: Authorized for aggregate occupational-health metrics.
 * - `exposed_professional`: Strictly prohibited from aggregate surveillance dashboard.
 * - `tech_admin`: Strictly prohibited from clinical/surveillance content.
 */
export function canViewSurveillanceDashboard(context: AuthContext): boolean {
  if (!context.isAuthenticated) return false;
  return (
    context.role === 'quality_staff' ||
    context.role === 'admin_reviewer' ||
    context.role === 'oh_professional'
  );
}

/**
 * Returns true if the role may create, edit, transition, and manage
 * prevention and corrective actions (CAPA).
 *
 * STRICT BOUNDARY (Phase 2C.6):
 * Only `quality_staff` is authorized to manage prevention actions.
 */
export function canManagePreventionActions(context: AuthContext): boolean {
  return context.isAuthenticated && context.role === 'quality_staff';
}

/**
 * Returns true if the role may view the non-identifiable prevention register.
 *
 * STRICT BOUNDARY (Phase 2C.6):
 * - `quality_staff`: Full read/write management.
 * - `admin_reviewer`: Read-only view of aggregate/prevention register.
 * - `oh_professional`: Read-only view of aggregate/prevention register.
 * - `exposed_professional`: Strictly prohibited from internal CAPA register.
 * - `tech_admin`: Strictly prohibited from prevention management content.
 */
export function canViewPreventionActions(context: AuthContext): boolean {
  if (!context.isAuthenticated) return false;
  return (
    context.role === 'quality_staff' ||
    context.role === 'admin_reviewer' ||
    context.role === 'oh_professional'
  );
}
