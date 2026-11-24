/**
 * AES Guardian Phase 2C.3.1: Correction Response Workflow Tests
 *
 * Covers:
 * - CorrectionResponseScreen (request rendering, text input, empty response rejection, submission)
 * - DeclarationDetailsScreen (correction request banner, response in history, re-review access)
 * - AdminReviewQueueScreen (filter pills, resubmitted declaration rendering and badges)
 * - AdminReviewActionScreen (re-review mode, declarant response panel, submit re-review)
 */

import React from 'react';

// Extend timeout for async UI rendering
jest.setTimeout(20000);
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CorrectionResponseScreen } from '../screens/CorrectionResponseScreen';
import { DeclarationDetailsScreen } from '../screens/DeclarationDetailsScreen';
import { AdminReviewQueueScreen } from '../screens/AdminReviewQueueScreen';
import { AdminReviewActionScreen } from '../screens/AdminReviewActionScreen';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
} from '../../../core';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { AppIcon } from '../../../components/AppIcon';

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

describe('Phase 2C.3.1: Correction Response Workflow', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRouteParams = {};
    resetDatabaseForTesting();
    await initializeDatabase();
  });

  afterEach(() => {
    resetDatabaseForTesting();
  });

  describe('CorrectionResponseScreen', () => {
    let declId: number;
    let reviewId: number;

    beforeEach(async () => {
      const db = getDatabase();
      // User 1 is prof.demo.expose (exposed_professional)
      declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-06-01',
        incident_type: 'percutaneous_exposure',
        exposure_description: 'Piqûre index droit',
        circumstances: 'Prélèvement sanguin aux urgences',
      });
      await db.submitDeclaration(declId);

      // User 2 is admin.demo.review (admin_reviewer)
      const reviewRes = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Préciser le calibre de l aiguille et le port de gants.',
        comments: 'Données indispensables pour l évaluation du risque.',
      });
      reviewId = reviewRes.reviewId;
      mockRouteParams = { declarationId: declId, reviewId };
    });

    it('renders correction request details and input form', async () => {
      const component = render(
        <ThemeProvider>
          <CorrectionResponseScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Réponse à la correction')).toBeTruthy();
      });

      expect(component.getByText('Demande du réviseur administratif')).toBeTruthy();
      expect(
        component.getByText('Préciser le calibre de l aiguille et le port de gants.')
      ).toBeTruthy();
      expect(
        component.getByText('Données indispensables pour l évaluation du risque.')
      ).toBeTruthy();
      expect(component.getByText(/Données de démonstration synthétiques uniquement/)).toBeTruthy();
      expect(component.queryByText(/exposed_professional/)).toBeNull();
      expect(
        component.getByPlaceholderText(
          'Apportez ici les précisions ou compléments demandés…'
        )
      ).toBeTruthy();
      expect(component.getByText('Transmettre la réponse')).toBeTruthy();
    });

    it('rejects submission with empty response text and shows alert', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      const component = render(
        <ThemeProvider>
          <CorrectionResponseScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Transmettre la réponse')).toBeTruthy();
      });

      const submitBtn = component.getByText('Transmettre la réponse');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith(
        "Une erreur s'est produite",
        'Veuillez saisir votre réponse avant de transmettre.'
      );
      alertSpy.mockRestore();
    });

    it('submits response successfully, updates status to resubmitted, and navigates back', async () => {
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
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Transmettre la réponse')).toBeTruthy();
      });

      const input = component.getByPlaceholderText(
        'Apportez ici les précisions ou compléments demandés…'
      );
      fireEvent.changeText(
        input,
        'Aiguille à prélèvement 21G, deux paires de gants latex portées.'
      );

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
        expect(responses[0].response_text).toContain('Aiguille à prélèvement 21G');
      });

      expect(mockGoBack).toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('DeclarationDetailsScreen — Correction workflow', () => {
    let declId: number;

    it('renders correction banner when status is correction_requested', async () => {
      const db = getDatabase();
      declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-06-03',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Renseigner le service d affectation.',
      });

      mockRouteParams = { declarationId: declId };

      const component = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Demande de correction reçue')).toBeTruthy();
      });

      expect(component.getByText('Renseigner le service d affectation.')).toBeTruthy();
      expect(component.getByText('Répondre à la demande de correction')).toBeTruthy();

      // Press respond button
      const respondBtn = component.getByText('Répondre à la demande de correction');
      fireEvent.press(respondBtn);

      expect(mockNavigate).toHaveBeenCalledWith('correctionResponse', {
        declarationId: declId,
        reviewId: expect.any(Number),
      });
    });

    it('does not render correction banner when status is submitted', async () => {
      const db = getDatabase();
      declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-06-04',
        incident_type: 'mucocutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      mockRouteParams = { declarationId: declId };

      const component = render(
        <ThemeProvider>
          <DeclarationDetailsScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Soumise')).toBeTruthy();
      });

      expect(component.queryByText('Demande de correction reçue')).toBeNull();
    });
  });

  describe('AdminReviewQueueScreen — Correction tabs & badges', () => {
    beforeEach(() => {
      useDemoRoleStore.getState().setRole('admin_reviewer');
    });

    afterEach(() => {
      useDemoRoleStore.getState().setRole('exposed_professional');
    });

    it('shows filter pills for correction_requested and resubmitted', async () => {
      const component = render(
        <ThemeProvider>
          <AdminReviewQueueScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('En attente déclarant')).toBeTruthy();
        expect(component.getByText('Réponses reçues')).toBeTruthy();
      });
    });

    it('highlights resubmitted declaration with response indicator badge', async () => {
      const db = getDatabase();
      const declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-06-05',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      const revRes = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Motif test',
      });
      await db.createCorrectionResponse({
        declaration_id: declId,
        review_id: revRes.reviewId,
        user_id: 1,
        response_text: 'Réponse test pour affichage badge.',
      });

      const component = render(
        <ThemeProvider>
          <AdminReviewQueueScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getAllByText('Réponse transmise').length).toBeGreaterThan(0);
      });

      expect(component.getAllByText(/Réponses reçues — Dernière réponse du déclarant/).length).toBeGreaterThan(0);
      expect(component.getAllByText('Enregistrer le réexamen').length).toBeGreaterThan(0);
      expect(
        component.UNSAFE_getAllByType(AppIcon).some((icon) => icon.props.name === 'forward'),
      ).toBe(true);
    });
  });

  describe('AdminReviewActionScreen — Re-reviewing resubmitted declarations', () => {
    beforeEach(() => {
      useDemoRoleStore.getState().setRole('admin_reviewer');
    });

    afterEach(() => {
      useDemoRoleStore.getState().setRole('exposed_professional');
    });

    it('displays declarant response panel and re-review button', async () => {
      const db = getDatabase();
      const declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-06-06',
        incident_type: 'percutaneous_exposure',
      });
      await db.submitDeclaration(declId);
      const revRes = await db.createAdministrativeReview({
        declaration_id: declId,
        reviewer_user_id: 2,
        outcome: 'correction_requested',
        correction_reason: 'Préciser la procédure.',
      });
      await db.createCorrectionResponse({
        declaration_id: declId,
        review_id: revRes.reviewId,
        user_id: 1,
        response_text: 'Protocole de sécurité suivi à la lettre.',
      });

      mockRouteParams = { declarationId: declId };

      const component = render(
        <ThemeProvider>
          <AdminReviewActionScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText(/Dernière réponse du déclarant/i)).toBeTruthy();
      });

      expect(component.getByText('Protocole de sécurité suivi à la lettre.')).toBeTruthy();
      expect(component.getByText('Enregistrer le réexamen')).toBeTruthy();
    });
  });
});
