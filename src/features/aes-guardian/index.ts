/**
 * AES Guardian Feature Boundary
 *
 * Entry point for the aes-guardian feature module.
 *
 * Status in Phase 2C.2:
 * - Declarations workflow: IMPLEMENTED (List, Form, Details, Confirmation)
 * - Admin review: NOT IMPLEMENTED (Phase 2C.3+)
 * - Referrals: NOT IMPLEMENTED (Phase 2C.4+)
 * - Follow-up plans: NOT IMPLEMENTED (Phase 2C.5+)
 */

export const AES_GUARDIAN_VERSION = '0.7.0-integrated';

export const AES_GUARDIAN_FEATURES = {
  declarations: true,          // Phase 2C.2: Implemented
  adminReview: true,           // Phase 2C.3: Implemented
  correctionWorkflow: true,    // Phase 2C.3.1: Implemented
  ohCoordination: true,        // Phase 2C.4: Implemented
  surveillanceDashboard: true, // Phase 2C.5: Implemented
  preventionCapa: true,        // Phase 2C.6: Implemented
  workspaceIntegration: true,  // Phase 2C.7: Implemented
} as const;

// Phase 2C.7: Central demonstration workspace
export { AesGuardianWorkspaceScreen } from './screens/AesGuardianWorkspaceScreen';

export { DeclarationListScreen } from './screens/DeclarationListScreen';
export { DeclarationFormScreen } from './screens/DeclarationFormScreen';
export { DeclarationDetailsScreen } from './screens/DeclarationDetailsScreen';
export { SubmissionConfirmationScreen } from './screens/SubmissionConfirmationScreen';
export { AdminReviewQueueScreen } from './screens/AdminReviewQueueScreen';
export { AdminReviewActionScreen } from './screens/AdminReviewActionScreen';
export { CorrectionResponseScreen } from './screens/CorrectionResponseScreen';
// Phase 2C.4: Occupational-health coordination
export { OhCoordinationQueueScreen } from './screens/OhCoordinationQueueScreen';
export { OhCoordinationDetailScreen } from './screens/OhCoordinationDetailScreen';
export { OhFollowUpEventScreen } from './screens/OhFollowUpEventScreen';
export { CreateCoordinationScreen } from './screens/CreateCoordinationScreen';
export { DeclarationCoordinationStatusScreen } from './screens/DeclarationCoordinationStatusScreen';
// Phase 2C.5: Surveillance Dashboard
export { SurveillanceDashboardScreen } from './screens/SurveillanceDashboardScreen';
// Phase 2C.6: Prevention & Corrective-Action Management
export { PreventionOverviewScreen } from './screens/PreventionOverviewScreen';
export { PreventionActionRegisterScreen } from './screens/PreventionActionRegisterScreen';
export { PreventionActionCreateScreen } from './screens/PreventionActionCreateScreen';
export { PreventionActionDetailScreen } from './screens/PreventionActionDetailScreen';
