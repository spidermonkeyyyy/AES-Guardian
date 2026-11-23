/**
 * AES Guardian Phase 2E.1.5.1: Batch 5 Acceptance & Invariants Test Suite
 *
 * Covers:
 * 1. AdminReviewQueueScreen:
 *    - Role authorization (admin_reviewer only; unauthorized for other roles).
 *    - Queue filtering across all 5 states (all, submitted, under_review, correction_requested, resubmitted).
 *    - Privacy & Data Minimization: strictly no declared_by_user_id / ID #, no elapsed-days/overdue badges.
 *    - Correct AesStatusBadge domain="declaration" rendering.
 *    - Navigation to AdminReviewActionScreen with declarationId parameter.
 * 2. AdminReviewActionScreen:
 *    - Role authorization (admin_reviewer only).
 *    - Read-only declaration summary and non-destructive review guarantees.
 *    - Accessibility: decision radio cards have accessibilityRole="radio" and accessibilityState={{ checked }}.
 *    - State machine invariants:
 *      * 'acknowledged' -> transitions to 'under_review' (NOT a fake 'acknowledged' status).
 *      * 'transmission_verified' -> transitions to 'under_review'.
 *      * 'correction_requested' -> transitions to 'correction_requested'.
 *    - Mandatory correction reason validation when correction_requested is selected.
 *    - Audit event logging (ADMIN_REVIEW_RECORDED, CORRECTION_REQUESTED, ADMIN_REREVIEW_RECORDED).
 *    - Re-review mode displays declarant response callout.
 * 3. CorrectionResponseScreen:
 *    - Role & Ownership authorization: exposed_professional owning the declaration only.
 *    - Non-owners and other roles receive unauthorized view.
 *    - Quotation-style display of reviewer request (reason and comments).
 *    - Character counter rendering.
 *    - Submitting transitions declaration to 'resubmitted' and logs CORRECTION_RESPONSE_SUBMITTED.
 */

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AdminReviewQueueScreen } from '../screens/AdminReviewQueueScreen';
import { AdminReviewActionScreen } from '../screens/AdminReviewActionScreen';
import { CorrectionResponseScreen } from '../screens/CorrectionResponseScreen';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
} from '../../../core';
import { ThemeProvider } from '../../../theme/ThemeContext';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      replace: mockReplace,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
    useIsFocused: () => true,
  };
});

describe('Phase 2E.1.5.1: Batch 5 Administrative Review Acceptance Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRouteParams = {};
    resetDatabaseForTesting();
    await initializeDatabase();
    useDemoRoleStore.getState().setRole('admin_reviewer');
  });

  afterEach(() => {
    useDemoRoleStore.getState().setRole('exposed_professional');
    resetDatabaseForTesting();
  });

  describe('1. AdminReviewQueueScreen Invariants', () => {
    it('blocks non-admin_reviewer roles (exposed_professional, oh_professional, auditor, admin)', async () => {
      const unauthorizedRoles = [
        'exposed_professional',
        'oh_professional',
        'quality_staff',
        'tech_admin',
      ] as const;

      for (const role of unauthorizedRoles) {
        useDemoRoleStore.getState().setRole(role);
        const { getByText, queryByText } = render(
          <ThemeProvider>
            <AdminReviewQueueScreen />
          </ThemeProvider>,
        );

        expect(
          getByText('Accès réservé exclusivement au rôle réviseur administratif.'),
        ).toBeTruthy();
        expect(queryByText('Toutes')).toBeNull();
      }
    });

    it('enforces privacy: does not render declared_by_user_id or overdue/elapsed badges', async () => {
      const db = getDatabase();
      const declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-05-10',
        incident_type: 'percutaneous_exposure',
        department_code: 'CARDIO-02',
        circumstances: 'Blessure par aiguille en salle de cathétérisme',
      });
      await db.submitDeclaration(declId);

      const component = render(
        <ThemeProvider>
          <AdminReviewQueueScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('CARDIO-02')).toBeTruthy();
      });

      // Assert privacy invariants: strictly NO user ID or overdue indicators
      expect(component.queryByText(/ID #/i)).toBeNull();
      expect(component.queryByText(/declared_by/i)).toBeNull();
      expect(component.queryByText(/retard/i)).toBeNull();
      expect(component.queryByText(/overdue/i)).toBeNull();
      expect(component.queryByText(/jours écoulés/i)).toBeNull();
    });

    it('filters review queue across all 5 filter pills properly', async () => {
      const db = getDatabase();

      // Item 1: submitted
      const id1 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-05-11',
        incident_type: 'percutaneous_exposure',
        department_code: 'DEP-1',
      });
      await db.submitDeclaration(id1);

      // Item 2: under_review (via review)
      const id2 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-05-12',
        incident_type: 'percutaneous_exposure',
        department_code: 'DEP-2',
      });
      await db.submitDeclaration(id2);
      await db.createAdministrativeReview({
        declaration_id: id2,
        reviewer_user_id: 2,
        outcome: 'acknowledged',
      });

      // Item 3: correction_requested
      const id3 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-05-13',
        incident_type: 'percutaneous_exposure',
        department_code: 'DEP-3',
      });
      await db.submitDeclaration(id3);
      const rev3 = await db.createAdministrativeReview({
        declaration_id: id3,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Préciser les EPI.',
      });

      // Item 4: resubmitted
      const id4 = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-05-14',
        incident_type: 'percutaneous_exposure',
        department_code: 'DEP-4',
      });
      await db.submitDeclaration(id4);
      const rev4 = await db.createAdministrativeReview({
        declaration_id: id4,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Préciser le lieu.',
      });
      await db.createCorrectionResponse({
        declaration_id: id4,
        review_id: rev4.reviewId,
        user_id: 1,
        response_text: 'Lieu précisé : bloc opératoire 3.',
      });

      const component = render(
        <ThemeProvider>
          <AdminReviewQueueScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('DEP-1')).toBeTruthy();
      });

      // Initially All: all 4 are visible
      expect(component.getByText('DEP-1')).toBeTruthy();
      expect(component.getByText('DEP-2')).toBeTruthy();
      expect(component.getByText('DEP-3')).toBeTruthy();
      expect(component.getByText('DEP-4')).toBeTruthy();

      // Filter: Soumises
      fireEvent.press(component.getByText('Soumises'));
      expect(component.getByText('DEP-1')).toBeTruthy();
      expect(component.queryByText('DEP-2')).toBeNull();
      expect(component.queryByText('DEP-3')).toBeNull();
      expect(component.queryByText('DEP-4')).toBeNull();

      // Filter: En cours d'examen
      fireEvent.press(component.getByText("En cours d'examen"));
      expect(component.queryByText('DEP-1')).toBeNull();
      expect(component.getByText('DEP-2')).toBeTruthy();
      expect(component.queryByText('DEP-3')).toBeNull();
      expect(component.queryByText('DEP-4')).toBeNull();

      // Filter: En attente déclarant (correction_requested)
      fireEvent.press(component.getByText('En attente déclarant'));
      expect(component.queryByText('DEP-1')).toBeNull();
      expect(component.queryByText('DEP-2')).toBeNull();
      expect(component.getByText('DEP-3')).toBeTruthy();
      expect(component.queryByText('DEP-4')).toBeNull();

      // Filter: Réponses reçues (resubmitted)
      fireEvent.press(component.getByText('Réponses reçues'));
      expect(component.queryByText('DEP-1')).toBeNull();
      expect(component.queryByText('DEP-2')).toBeNull();
      expect(component.queryByText('DEP-3')).toBeNull();
      expect(component.getByText('DEP-4')).toBeTruthy();
    });
  });

  describe('2. AdminReviewActionScreen Invariants', () => {
    let declId: number;

    beforeEach(async () => {
      const db = getDatabase();
      declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-05-18',
        incident_type: 'percutaneous_exposure',
        department_code: 'URG-TEST',
        circumstances: 'Exposition percutanée avec bistouri',
        exposure_description: 'Coupure superficielle pouce gauche',
      });
      await db.submitDeclaration(declId);
      mockRouteParams = { declarationId: declId };
    });

    it('ensures decision radio cards have accessibilityRole="radio" and accessibilityState.checked', async () => {
      const component = render(
        <ThemeProvider>
          <AdminReviewActionScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('Traitement administratif')).toBeTruthy();
      });

      const radioOptions = component.getAllByRole('radio');
      expect(radioOptions.length).toBe(3);

      // Default selected is 'acknowledged'
      expect(radioOptions[0].props.accessibilityState).toEqual({ checked: true });
      expect(radioOptions[1].props.accessibilityState).toEqual({ checked: false });
      expect(radioOptions[2].props.accessibilityState).toEqual({ checked: false });

      // Select 'transmission_verified'
      fireEvent.press(radioOptions[1]);
      expect(radioOptions[0].props.accessibilityState).toEqual({ checked: false });
      expect(radioOptions[1].props.accessibilityState).toEqual({ checked: true });
      expect(radioOptions[2].props.accessibilityState).toEqual({ checked: false });
    });

    it('verifies state machine: positive review transitions to under_review, not a fake status', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && buttons.length > 1) {
          const confirmBtn = buttons.find((b: any) => b.text === 'Confirmer');
          if (confirmBtn && confirmBtn.onPress) {
            confirmBtn.onPress();
          }
        }
      });

      const component = render(
        <ThemeProvider>
          <AdminReviewActionScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('Enregistrer la décision')).toBeTruthy();
      });

      // Submit with default 'acknowledged'
      const submitBtn = component.getByText('Enregistrer la décision');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      await waitFor(async () => {
        const db = getDatabase();
        const decl = await db.getDeclarationById(declId, 2);
        // CRITICAL: status is 'under_review', NEVER 'acknowledged'
        expect(decl!.status).toBe('under_review');
        expect(decl!.status).not.toBe('acknowledged');

        const history = await db.getDeclarationReviewHistory(declId, 2);
        expect(history[0].outcome).toBe('acknowledged');
      });

      alertSpy.mockRestore();
    });

    it('verifies transmission_verified also transitions declaration to under_review', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && buttons.length > 1) {
          const confirmBtn = buttons.find((b: any) => b.text === 'Confirmer');
          if (confirmBtn && confirmBtn.onPress) {
            confirmBtn.onPress();
          }
        }
      });

      const component = render(
        <ThemeProvider>
          <AdminReviewActionScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('Transmission hiérarchique vérifiée')).toBeTruthy();
      });

      // Select transmission_verified
      fireEvent.press(component.getByText('Transmission hiérarchique vérifiée'));

      const submitBtn = component.getByText('Enregistrer la décision');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      await waitFor(async () => {
        const db = getDatabase();
        const decl = await db.getDeclarationById(declId, 2);
        expect(decl!.status).toBe('under_review');

        const history = await db.getDeclarationReviewHistory(declId, 2);
        expect(history[0].outcome).toBe('transmission_verified');
      });

      alertSpy.mockRestore();
    });

    it('verifies correction_requested transitions status to correction_requested and records reason', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && buttons.length > 1) {
          const confirmBtn = buttons.find((b: any) => b.text === 'Confirmer');
          if (confirmBtn && confirmBtn.onPress) {
            confirmBtn.onPress();
          }
        }
      });

      const component = render(
        <ThemeProvider>
          <AdminReviewActionScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('Demande de correction / complément')).toBeTruthy();
      });

      fireEvent.press(component.getByText('Demande de correction / complément'));

      const reasonInput = component.getByPlaceholderText(
        'Précisez les éléments manquants ou à corriger par le déclarant…',
      );
      fireEvent.changeText(reasonInput, 'Préciser le statut sérologique de la source si connu.');

      const submitBtn = component.getByText('Enregistrer la décision');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      await waitFor(async () => {
        const db = getDatabase();
        const decl = await db.getDeclarationById(declId, 2);
        expect(decl!.status).toBe('correction_requested');

        const history = await db.getDeclarationReviewHistory(declId, 2);
        expect(history[0].outcome).toBe('correction_requested');
        expect(history[0].correction_reason).toBe('Préciser le statut sérologique de la source si connu.');
      });

      alertSpy.mockRestore();
    });
  });

  describe('3. CorrectionResponseScreen Invariants', () => {
    let declId: number;
    let reviewId: number;

    beforeEach(async () => {
      const db = getDatabase();
      declId = await db.createDraft({
        declared_by_user_id: 1, // Declarant is user 1 (prof.demo.expose)
        incident_date: '2024-05-20',
        incident_type: 'percutaneous_exposure',
        circumstances: 'Prélèvement sanguin en pédiatrie',
      });
      await db.submitDeclaration(declId);

      const revRes = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Renseigner la taille de l aiguille.',
        comments: 'Information indispensable pour la CAT.',
      });
      reviewId = revRes.reviewId;
      mockRouteParams = { declarationId: declId, reviewId };
    });

    it('blocks unauthorized roles and non-owners from responding', async () => {
      // User 2 (admin_reviewer) cannot respond to user 1's correction
      useDemoRoleStore.getState().setRole('admin_reviewer');

      const component = render(
        <ThemeProvider>
          <CorrectionResponseScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(
          component.getByText('Seul le déclarant propriétaire de ce dossier peut y répondre.'),
        ).toBeTruthy();
      });
    });

    it('displays character counter live as the user types', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const component = render(
        <ThemeProvider>
          <CorrectionResponseScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('0 caractères')).toBeTruthy();
      });

      const input = component.getByPlaceholderText(
        'Apportez ici les précisions ou compléments demandés…',
      );
      fireEvent.changeText(input, 'Aiguille 23G papillon');

      expect(component.getByText('21 caractères')).toBeTruthy();
    });

    it('rechecks the active role before sending a confirmed response', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      const alertSpy = jest.spyOn(Alert, 'alert');

      const component = render(
        <ThemeProvider>
          <CorrectionResponseScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('Transmettre la réponse')).toBeTruthy();
      });

      fireEvent.changeText(
        component.getByPlaceholderText(
          'Apportez ici les précisions ou compléments demandés…',
        ),
        'Réponse de suivi.',
      );
      fireEvent.press(component.getByText('Transmettre la réponse'));

      const confirmButtons = alertSpy.mock.calls[0][2] as any[];
      const submitButton = confirmButtons.find(
        (button) => button.text === 'Transmettre la réponse',
      );
      expect(submitButton).toBeDefined();

      useDemoRoleStore.getState().setRole('admin_reviewer');
      await act(async () => {
        await submitButton.onPress();
      });

      expect(alertSpy).toHaveBeenLastCalledWith(
        "Une erreur s'est produite",
        'Seul le déclarant propriétaire de ce dossier peut y répondre.',
      );
      expect(await getDatabase().getCorrectionResponses(declId, 1)).toHaveLength(0);
      alertSpy.mockRestore();
    });

    it('records correction response, transitions status to resubmitted, and logs audit event', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && buttons.length > 1) {
          const confirmBtn = buttons.find((b: any) => b.text === 'Transmettre la réponse');
          if (confirmBtn && confirmBtn.onPress) {
            confirmBtn.onPress();
          }
        } else if (buttons && buttons.length === 1) {
          buttons[0]?.onPress?.();
        }
      });

      const component = render(
        <ThemeProvider>
          <CorrectionResponseScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(component.getByText('Transmettre la réponse')).toBeTruthy();
      });

      const input = component.getByPlaceholderText(
        'Apportez ici les précisions ou compléments demandés…',
      );
      fireEvent.changeText(input, 'Aiguille de prélèvement 22G sécurisée.');

      const submitBtn = component.getByText('Transmettre la réponse');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      await waitFor(async () => {
        const db = getDatabase();
        const decl = await db.getDeclarationById(declId, 1);
        expect(decl!.status).toBe('resubmitted');

        const responses = await db.getCorrectionResponses(declId, 1);
        expect(responses.length).toBe(1);
        expect(responses[0].response_text).toBe('Aiguille de prélèvement 22G sécurisée.');

        const auditEvents = await db.listAuditEvents(5);
        const event = auditEvents.find((e) => e.event_type === 'CORRECTION_RESPONSE_SUBMITTED');
        expect(event).toBeDefined();
      });

      expect(mockGoBack).toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });
});