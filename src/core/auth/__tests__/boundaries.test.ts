/**
 * AES Guardian Authentication Boundaries Unit Tests
 *
 * Verifies role checks and operational boundaries:
 * - canReview() allows admin_reviewer ONLY.
 * - canDeclare() allows exposed_professional ONLY.
 * - tech_admin, quality_staff, oh_professional are strictly rejected from review.
 * - Unauthenticated contexts are rejected.
 */

import {
  canReview,
  canDeclare,
  canRespondToCorrection,
  hasRole,
  UNAUTHENTICATED_CONTEXT,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  AuthContext,
} from '../boundaries';

describe('Auth Boundaries (Phase 2C.3)', () => {
  describe('canReview', () => {
    it('allows SYNTHETIC_ADMIN_REVIEWER_CONTEXT', () => {
      expect(canReview(SYNTHETIC_ADMIN_REVIEWER_CONTEXT)).toBe(true);
    });

    it('rejects exposed_professional', () => {
      expect(canReview(SYNTHETIC_DEMO_CONTEXT)).toBe(false);
    });

    it('rejects oh_professional', () => {
      const ohContext: AuthContext = {
        isAuthenticated: true,
        role: 'oh_professional',
        displayName: 'Médecin Travail',
        userId: 3,
      };
      expect(canReview(ohContext)).toBe(false);
    });

    it('rejects quality_staff', () => {
      const qsContext: AuthContext = {
        isAuthenticated: true,
        role: 'quality_staff',
        displayName: 'Qualité Hygiène',
        userId: 4,
      };
      expect(canReview(qsContext)).toBe(false);
    });

    it('rejects tech_admin', () => {
      const taContext: AuthContext = {
        isAuthenticated: true,
        role: 'tech_admin',
        displayName: 'Admin Système',
        userId: 5,
      };
      expect(canReview(taContext)).toBe(false);
    });

    it('rejects unauthenticated context', () => {
      expect(canReview(UNAUTHENTICATED_CONTEXT)).toBe(false);
    });
  });

  describe('canDeclare', () => {
    it('allows exposed_professional', () => {
      expect(canDeclare(SYNTHETIC_DEMO_CONTEXT)).toBe(true);
    });

    it('rejects admin_reviewer', () => {
      expect(canDeclare(SYNTHETIC_ADMIN_REVIEWER_CONTEXT)).toBe(false);
    });
  });

  describe('canRespondToCorrection (Phase 2C.3.1)', () => {
    it('allows exposed_professional (SYNTHETIC_DEMO_CONTEXT)', () => {
      expect(canRespondToCorrection(SYNTHETIC_DEMO_CONTEXT)).toBe(true);
    });

    it('rejects admin_reviewer', () => {
      expect(canRespondToCorrection(SYNTHETIC_ADMIN_REVIEWER_CONTEXT)).toBe(false);
    });

    it('rejects oh_professional', () => {
      const ohContext: AuthContext = {
        isAuthenticated: true,
        role: 'oh_professional',
        displayName: 'Médecin Travail',
        userId: 3,
      };
      expect(canRespondToCorrection(ohContext)).toBe(false);
    });

    it('rejects quality_staff', () => {
      const qsContext: AuthContext = {
        isAuthenticated: true,
        role: 'quality_staff',
        displayName: 'Qualité Hygiène',
        userId: 4,
      };
      expect(canRespondToCorrection(qsContext)).toBe(false);
    });

    it('rejects tech_admin', () => {
      const taContext: AuthContext = {
        isAuthenticated: true,
        role: 'tech_admin',
        displayName: 'Admin Système',
        userId: 5,
      };
      expect(canRespondToCorrection(taContext)).toBe(false);
    });

    it('rejects unauthenticated context', () => {
      expect(canRespondToCorrection(UNAUTHENTICATED_CONTEXT)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('matches allowed roles correctly', () => {
      expect(hasRole(SYNTHETIC_ADMIN_REVIEWER_CONTEXT, ['admin_reviewer'])).toBe(true);
      expect(hasRole(SYNTHETIC_ADMIN_REVIEWER_CONTEXT, ['exposed_professional'])).toBe(false);
      expect(hasRole(UNAUTHENTICATED_CONTEXT, ['unauthenticated'])).toBe(false); // not authenticated
    });
  });
});
