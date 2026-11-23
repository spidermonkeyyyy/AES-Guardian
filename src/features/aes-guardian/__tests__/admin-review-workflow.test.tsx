/**
 * AES Guardian Phase 2C.3: Admin Review Workflow UI Tests
 *
 * Covers:
 * - AdminReviewQueueScreen (queue rendering, filtering, reviewer badge, navigation)
 * - AdminReviewActionScreen (declaration summary, review outcome selection, correction reason requirement, submission, audit event logging)
 * - Access control enforcement
 */

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AdminReviewQueueScreen } from '../screens/AdminReviewQueueScreen';
import { AdminReviewActionScreen } from '../screens/AdminReviewActionScreen';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
} from '../../../core';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { setLocale } from '../../../localization';

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

describe('Phase 2C.3: Administrative Review Workflow Screens', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRouteParams = {};
    setLocale('fr');
    resetDatabaseForTesting();
    await initializeDatabase();
    useDemoRoleStore.getState().setRole('admin_reviewer');
  });

  afterEach(() => {
    useDemoRoleStore.getState().setRole('exposed_professional');
    resetDatabaseForTesting();
  });

  describe('AdminReviewQueueScreen', () => {
    it('renders reviewer session banner and empty queue initially', async () => {
      const component = render(
        <ThemeProvider>
          <AdminReviewQueueScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Session de révision administrative')).toBeTruthy();
      });

      expect(component.getByText(/Administrateur RH \(Démo\)/)).toBeTruthy();
      expect(component.getByText('Aucune déclaration en attente')).toBeTruthy();
      expect(component.getByText('Toutes')).toBeTruthy();
      expect(component.getByText('Soumises')).toBeTruthy();
      expect(component.getByText("En cours d'examen")).toBeTruthy();
    });

    it('renders submitted declaration in the review queue and allows navigation to review action', async () => {
      const db = getDatabase();
      const declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-05-15',
        incident_type: 'percutaneous_exposure',
        department_code: 'URG-01',
        circumstances: 'Piqûre lors d un prélèvement',
      });
      await db.submitDeclaration(declId);

      const component = render(
        <ThemeProvider>
          <AdminReviewQueueScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('15/05/2024')).toBeTruthy();
      });

      expect(component.getByText('URG-01')).toBeTruthy();
      expect(component.getByText('Soumise')).toBeTruthy();

      const card = component.getByLabelText(/Examiner la déclaration/);
      fireEvent.press(card);

      expect(mockNavigate).toHaveBeenCalledWith('adminReviewAction', {
        declarationId: declId,
      });
    });
  });

  describe('AdminReviewActionScreen', () => {
    let declId: number;

    beforeEach(async () => {
      const db = getDatabase();
      declId = await db.createDraft({
        declared_by_user_id: 1,
        incident_date: '2024-05-15',
        incident_type: 'percutaneous_exposure',
        department_code: 'MED-TRAV',
        circumstances: 'Accident exposant au sang lors du recapuchonnage',
        exposure_description: 'Piqûre aiguille creuse 21G index gauche',
      });
      await db.submitDeclaration(declId);
      mockRouteParams = { declarationId: declId };
    });

    it('renders read-only declaration summary and review outcomes', async () => {
      const component = render(
        <ThemeProvider>
          <AdminReviewActionScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Traitement administratif')).toBeTruthy();
      });

      expect(component.getByText('Résumé de la déclaration (Lecture seule)')).toBeTruthy();
      expect(component.getByText('15/05/2024')).toBeTruthy();
      expect(component.getByText('Accident percutané (piqûre / coupure)')).toBeTruthy();
      expect(component.queryByText('percutaneous_exposure')).toBeNull();
      expect(component.getByText('MED-TRAV')).toBeTruthy();
      expect(component.getByText('Déclaration accusée de réception')).toBeTruthy();
      expect(component.getByText('Transmission hiérarchique vérifiée')).toBeTruthy();
      expect(component.getByText('Demande de correction / complément')).toBeTruthy();
    });

    it('requires correction reason when correction_requested is selected', async () => {
      const component = render(
        <ThemeProvider>
          <AdminReviewActionScreen />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Demande de correction / complément')).toBeTruthy();
      });

      // Select correction_requested
      fireEvent.press(component.getByText('Demande de correction / complément'));

      // Check that the mandatory correction reason input appears
      expect(
        component.getByPlaceholderText('Précisez les éléments manquants ou à corriger par le déclarant…')
      ).toBeTruthy();

      // Attempt to submit without reason
      const submitBtn = component.getByText('Enregistrer la décision');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      expect(
        component.getByText('Le motif de correction est obligatoire lorsque vous demandez une correction.')
      ).toBeTruthy();
    });

    it('records acknowledged review, updates status to under_review, and logs audit event', async () => {
      // Spy Alert.alert to auto-confirm
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
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(component.getByText('Enregistrer la décision')).toBeTruthy();
      });

      // Select acknowledged outcome (default) and press submit
      const submitBtn = component.getByText('Enregistrer la décision');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      // Verify database state updated
      await waitFor(async () => {
        const db = getDatabase();
        const updated = await db.getDeclarationById(declId, 2);
        expect(updated!.status).toBe('under_review');

        const history = await db.getDeclarationReviewHistory(declId, 2);
        expect(history.length).toBe(1);
        expect(history[0].outcome).toBe('acknowledged');

        const auditEvents = await db.listAuditEvents(5);
        const reviewEvent = auditEvents.find(e => e.event_type === 'ADMIN_REVIEW_RECORDED');
        expect(reviewEvent).toBeDefined();
      });

      alertSpy.mockRestore();
    });

    it('renders unauthorized view when activeContext is not admin_reviewer', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { declarationId: 1 };

      const component = render(
        <ThemeProvider>
          <AdminReviewActionScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(
          component.getByText('Accès réservé exclusivement au rôle réviseur administratif.'),
        ).toBeTruthy();
      });
    });
  });
});
