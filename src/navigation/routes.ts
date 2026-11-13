export type RootStackParamList = {
  splash: undefined;
  authGate: undefined;
  signIn: undefined;
  signUp: undefined;
  forgotPassword: undefined;
  patientTabs: undefined;
  nurseTabs: undefined;
  rules: undefined;
  ruleDetail: { ruleId: string };
  ruleBuilder: { ruleId?: string };
  designSystem: undefined;

  // AES Guardian routes
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
};

export type PatientTabParamList = {
  patientHome: undefined;
  monitor: undefined;
  monitorQuestion: undefined;
  monitorReview: undefined;
  monitorResult: undefined;
  monitorHistory: undefined;
  messages: undefined;
  treatment: undefined;
  profile: undefined;
};

export type NurseTabParamList = {
  nurseDashboard: undefined;
  patients: undefined;
  patientDetail: { patientId: string };
  alerts: undefined;
  messages: undefined;
  profile: undefined;
  rules: undefined;
  ruleDetail: { ruleId: string };
  ruleBuilder: { ruleId?: string };
};
