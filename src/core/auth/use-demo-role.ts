/**
 * AES Guardian Demonstration Role Store
 *
 * In-memory Zustand store managing the active synthetic demonstration role.
 *
 * DISCLAIMER:
 * This store manages synthetic in-memory demonstration contexts only.
 * It does NOT implement real authentication, session persistence, or credentials.
 * Authorization is independently enforced by domain and database methods.
 */

import { create } from 'zustand';
import {
  AesGuardianRole,
  AuthContext,
  SYNTHETIC_DEMO_CONTEXT,
  SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
  SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
  SYNTHETIC_QUALITY_STAFF_CONTEXT,
  SYNTHETIC_TECH_ADMIN_CONTEXT,
  canDeclare,
  canReview,
  canRespondToCorrection,
  canCoordinate,
  canFollowUp,
  canViewSurveillanceDashboard,
  canViewPreventionActions,
  canManagePreventionActions,
} from './boundaries';

export interface DemoRoleDefinition {
  role: AesGuardianRole;
  labelKey: string;
  defaultLabel: string;
  context: AuthContext;
  descriptionKey: string;
  defaultDescription: string;
}

export const DEMO_ROLE_DEFINITIONS: DemoRoleDefinition[] = [
  {
    role: 'exposed_professional',
    labelKey: 'role.exposed_professional',
    defaultLabel: 'Professionnel Exposé',
    context: SYNTHETIC_DEMO_CONTEXT,
    descriptionKey: 'workspace.roleDesc.exposed',
    defaultDescription:
      'Déclaration immédiate d’un AES, consultation de ses déclarations, réponse aux demandes de correction administrative.',
  },
  {
    role: 'admin_reviewer',
    labelKey: 'role.admin_reviewer',
    defaultLabel: 'Administrateur RH / Cadre',
    context: SYNTHETIC_ADMIN_REVIEWER_CONTEXT,
    descriptionKey: 'workspace.roleDesc.admin',
    defaultDescription:
      'Examen administratif, demande de correction, initiation de la coordination Santé au Travail, consultation CAPA.',
  },
  {
    role: 'oh_professional',
    labelKey: 'role.oh_professional',
    defaultLabel: 'Santé au Travail (SST)',
    context: SYNTHETIC_OH_PROFESSIONAL_CONTEXT,
    descriptionKey: 'workspace.roleDesc.oh',
    defaultDescription:
      'Prise en charge médico-professionnelle, suivi sérologique (VIH/VHB/VHC), événements de suivi, clôture SST.',
  },
  {
    role: 'quality_staff',
    labelKey: 'role.quality_staff',
    defaultLabel: 'Responsable Qualité',
    context: SYNTHETIC_QUALITY_STAFF_CONTEXT,
    descriptionKey: 'workspace.roleDesc.quality',
    defaultDescription:
      'Surveillance épidémiologique dé-identifiée, consultation des indicateurs agrégés, pilotage du plan d’actions CAPA.',
  },
  {
    role: 'tech_admin',
    labelKey: 'role.tech_admin',
    defaultLabel: 'Administrateur Technique',
    context: SYNTHETIC_TECH_ADMIN_CONTEXT,
    descriptionKey: 'workspace.roleDesc.tech',
    defaultDescription:
      'Maintenance système, vérification du schéma SQLite et intégrité locale. Accès clinique et personnel strictement interdit.',
  },
];

export interface DemoRoleState {
  activeRole: AesGuardianRole;
  activeContext: AuthContext;
  setRole: (role: AesGuardianRole) => void;
  // Derived permissions
  canDeclare: boolean;
  canReview: boolean;
  canRespondToCorrection: boolean;
  canCoordinate: boolean;
  canFollowUp: boolean;
  canViewSurveillance: boolean;
  canViewPrevention: boolean;
  canManagePrevention: boolean;
}

function derivePermissions(context: AuthContext) {
  return {
    canDeclare: canDeclare(context),
    canReview: canReview(context),
    canRespondToCorrection: canRespondToCorrection(context),
    canCoordinate: canCoordinate(context),
    canFollowUp: canFollowUp(context),
    canViewSurveillance: canViewSurveillanceDashboard(context),
    canViewPrevention: canViewPreventionActions(context),
    canManagePrevention: canManagePreventionActions(context),
  };
}

export const useDemoRoleStore = create<DemoRoleState>((set) => ({
  activeRole: 'exposed_professional',
  activeContext: SYNTHETIC_DEMO_CONTEXT,
  ...derivePermissions(SYNTHETIC_DEMO_CONTEXT),
  setRole: (role: AesGuardianRole) => {
    const def = DEMO_ROLE_DEFINITIONS.find((d) => d.role === role) ?? DEMO_ROLE_DEFINITIONS[0];
    set({
      activeRole: def.role,
      activeContext: def.context,
      ...derivePermissions(def.context),
    });
  },
}));
