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
  onboardingDemoEntry: true,   // Phase 2E.1.2: Implemented
} as const;

// Phase 2E.1.2: Batch 2 Onboarding & Synthetic Demo Entry Screens
export { SplashScreen } from './screens/SplashScreen';
export { AccessScreen } from './screens/AccessScreen';
export { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
export { PrototypeDisclaimerScreen } from './screens/PrototypeDisclaimerScreen';
export { DemoAccountPickerScreen } from './screens/DemoAccountPickerScreen';

// Phase 2E.1.2: Reusable Presentation Components
export {
  AesScreenContainer,
  AesScreenHeader,
  AesCard,
  AesButton,
  AesRoundArrowButton,
  AesOptionCard,
  DashboardMetricCard,
} from './components';
export type {
  AesScreenContainerProps,
  AesScreenHeaderProps,
  AesCardProps,
  AesButtonProps,
  AesButtonVariant,
  AesRoundArrowButtonProps,
  AesRoundArrowButtonVariant,
  AesOptionCardProps,
  AesOptionCardVariant,
  DashboardMetricCardProps,
} from './components';

// Phase 2E.1.2: First-launch storage utility
export {
  isFirstLaunchCompleted,
  setFirstLaunchCompleted,
  resetFirstLaunchState,
} from './utils/onboardingStorage';

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
// Phase 2D.1: Help Centre, Glossary, Profile & Settings
export { HelpGlossaryScreen } from './screens/HelpGlossaryScreen';
export { AesGuardianProfileScreen } from './screens/AesGuardianProfileScreen';
// Phase 2D.2F: Notification navigation resolver
export { resolveNotificationNavigation } from './navigation/notification-navigation-resolver';
export type {
  NotificationDestinationRoute,
  NotificationNavigationResult,
  NotificationNavigationSuccess,
  NotificationNavigationUnauthorized,
  NotificationNavigationNotFound,
  NotificationNavigationInvalidEvent,
} from './navigation/notification-navigation-resolver';
// Phase 2D.2G: Notification Centre
export { NotificationCentreScreen } from './screens/NotificationCentreScreen';
