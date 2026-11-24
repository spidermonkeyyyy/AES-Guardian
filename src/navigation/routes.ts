export type RootStackParamList = {
  aesSplash: { replay?: boolean } | undefined;
  aesAccess: undefined;
  aesLanguageSelect: undefined;
  aesDisclaimer: undefined;
  aesDemoPicker: undefined;
  aesGuardianWorkspace: undefined;
  declarations: undefined;
  newDeclaration: { declarationId?: number } | undefined;
  declarationDetails: { declarationId: number };
  submissionConfirmation: { referenceNumber: string };
  adminReviewQueue: undefined;
  adminReviewAction: { declarationId: number };
  correctionResponse: { declarationId: number; reviewId: number };
  // Phase 2C.4: Occupational-health coordination
  ohCoordinationQueue: undefined;
  ohCoordinationDetail: { coordinationId: number };
  createCoordination: { declarationId: number };
  recordFollowUpEvent: { coordinationId: number };
  declarationCoordinationStatus: { declarationId: number };
  // Phase 2C.5: Surveillance Dashboard
  surveillanceDashboard: undefined;
  // Phase 2C.6: Prevention & Corrective-Action Management
  preventionOverview: undefined;
  preventionRegister: undefined;
  preventionCreate: undefined;
  preventionActionDetail: { actionId: number };
  // Phase 2D.1: Help Centre, Glossary, Profile & Settings
  helpGlossary: { initialSection?: 'help' | 'glossary' } | undefined;
  aesGuardianProfile: undefined;
  // Phase 2D.2G: Notification Centre
  notificationCentre: undefined;
};
