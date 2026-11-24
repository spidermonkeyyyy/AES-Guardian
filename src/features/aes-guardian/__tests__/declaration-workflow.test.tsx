import React from 'react';
import { Alert } from 'react-native';

// Extend default timeout for potentially slow async UI rendering
jest.setTimeout(25000);
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { DeclarationListScreen } from '../screens/DeclarationListScreen';
import { DeclarationFormScreen } from '../screens/DeclarationFormScreen';
import { SubmissionConfirmationScreen } from '../screens/SubmissionConfirmationScreen';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
} from '../../../core';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { setLocale, getLocale, t } from '../../../localization';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: { params?: any } = { params: {} };

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
      params: mockRouteParams.params,
    }),
    useIsFocused: () => true,
  };
});

describe('AES Guardian Phase 2E.1.3: Batch 3 Guided Declaration Workflow', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRouteParams = { params: {} };
    setLocale('fr');
    useDemoRoleStore.getState().setRole('exposed_professional');
    resetDatabaseForTesting();
    await initializeDatabase();
  });

  afterEach(() => {
    setLocale('fr');
    resetDatabaseForTesting();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Existing DeclarationListScreen Regression Verification
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Screen 5.1: DeclarationListScreen Regression', () => {
    it('DeclarationListScreen renders empty state correctly', async () => {
      const component = render(
        <ThemeProvider>
          <DeclarationListScreen />
        </ThemeProvider>
      );

      await waitFor(
        () => {
          expect(component.queryByText('Chargement…')).toBeNull();
        },
        { timeout: 5000 }
      );

      expect(component.getByText('Mes déclarations')).toBeTruthy();
      expect(component.getByText('Aucune déclaration')).toBeTruthy();
      expect(component.getByTestId('new-declaration-button')).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Screen 4.1: DeclarationFormScreen (5-Step Guided Wizard)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Screen 4.1: DeclarationFormScreen (5-Step Wizard)', () => {
    it('initializes at Step 1 with ordered 5-segment progress bar and step counter', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      expect(getByTestId('declaration-step-1')).toBeTruthy();
      expect(getByTestId('declaration-progress-bar')).toBeTruthy();
      expect(getByText('Étape 1 sur 5')).toBeTruthy();
      expect(getByText('Informations Générales')).toBeTruthy();
      expect(getByTestId('declaration-incident-date-input')).toBeTruthy();
      expect(getByTestId('declaration-save-draft-button')).toBeTruthy();
      expect(getByTestId('declaration-next-step-button')).toBeTruthy();
    });

    it('blocks declaration form access for roles without declaration permission', () => {
      useDemoRoleStore.getState().setRole('admin_reviewer');
      const { getByTestId, getByText, queryByTestId } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>,
      );

      expect(getByTestId('declaration-form-unauthorized')).toBeTruthy();
      expect(
        getByText("Cette étape est réservée au professionnel ayant déclaré l'incident."),
      ).toBeTruthy();
      expect(queryByTestId('declaration-step-1')).toBeNull();
    });

    it('validates Step 1 required fields and prevents advancing when incident date is empty', async () => {
      const { getByTestId, queryByTestId, getByText } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Wait for the useEffect to pre-fill incidentDate with today's date before interacting
      await waitFor(() => {
        expect(getByTestId('declaration-incident-date-input').props.value).toBeTruthy();
      });

      // Clear the date in a separate act() so React state settles before pressing Next
      await act(async () => {
        fireEvent.changeText(getByTestId('declaration-incident-date-input'), '');
      });

      // Confirm date is cleared in state before pressing Next
      await waitFor(() => {
        expect(getByTestId('declaration-incident-date-input').props.value).toBe('');
      });

      const nextButton = getByTestId('declaration-next-step-button');
      await act(async () => {
        fireEvent.press(nextButton);
      });

      // Must remain on Step 1 and display validation error
      await waitFor(() => {
        expect(getByTestId('declaration-step-1')).toBeTruthy();
        expect(queryByTestId('declaration-step-2')).toBeNull();
        expect(getByText('La date de l\'incident est obligatoire')).toBeTruthy();
      });
    });

    it('navigates forward through all 5 steps and backward seamlessly', async () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Step 1 -> Step 2
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button'));
      });
      expect(getByTestId('declaration-step-2')).toBeTruthy();
      expect(getByText('Étape 2 sur 5')).toBeTruthy();
      expect(getByText('Caractéristiques de l\'Exposition')).toBeTruthy();

      // Step 2 -> Step 3
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button'));
      });
      expect(getByTestId('declaration-step-3')).toBeTruthy();
      expect(getByText('Étape 3 sur 5')).toBeTruthy();
      expect(getByText('Circonstances de l\'Incident')).toBeTruthy();

      // Step 3 -> Step 4
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button'));
      });
      expect(getByTestId('declaration-step-4')).toBeTruthy();
      expect(getByText('Étape 4 sur 5')).toBeTruthy();
      expect(getByText('Mesures de Protection')).toBeTruthy();

      // Step 4 -> Step 5
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button'));
      });
      expect(getByTestId('declaration-step-5')).toBeTruthy();
      expect(getByText('Étape 5 sur 5')).toBeTruthy();
      expect(getByText('Récapitulatif & Attestation')).toBeTruthy();
      expect(getByTestId('declaration-submit-button')).toBeTruthy();

      // Backward navigation: Step 5 -> Step 4 -> Step 3
      fireEvent.press(getByTestId('declaration-prev-step-button'));
      expect(getByTestId('declaration-step-4')).toBeTruthy();

      fireEvent.press(getByTestId('declaration-prev-step-button'));
      expect(getByTestId('declaration-step-3')).toBeTruthy();
    });

    it('preserves field values when navigating across wizard steps', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Enter department in Step 1
      fireEvent.changeText(getByTestId('declaration-department-code-input'), 'URG-04');

      // Forward to Step 2
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button'));
      });
      expect(getByTestId('declaration-step-2')).toBeTruthy();

      // Select mucocutaneous exposure in Step 2
      fireEvent.press(getByTestId('incident-type-mucocutaneous_exposure'));

      // Forward to Step 3
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button'));
      });
      expect(getByTestId('declaration-step-3')).toBeTruthy();

      // Enter circumstances
      fireEvent.changeText(
        getByTestId('declaration-circumstances-input'),
        'Projection faciale de sang lors d\'une pose de voie veineuse'
      );

      // Back to Step 2
      fireEvent.press(getByTestId('declaration-prev-step-button'));
      expect(getByTestId('declaration-step-2')).toBeTruthy();

      // Back to Step 1
      fireEvent.press(getByTestId('declaration-prev-step-button'));
      expect(getByTestId('declaration-step-1')).toBeTruthy();
      expect(getByTestId('declaration-department-code-input').props.value).toBe('URG-04');
    });

    it('Step 4 strictly satisfies free-text-only boundary: zero clinical scoring or checkboxes', async () => {
      const { getByTestId, queryByPlaceholderText } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Advance to Step 4
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // to 2
      });
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // to 3
      });
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // to 4
      });

      expect(getByTestId('declaration-step-4')).toBeTruthy();
      expect(getByTestId('declaration-protective-measures-input')).toBeTruthy();

      // Verify no automated severity, checklists, or diagnostic inputs exist
      expect(queryByPlaceholderText(/score/i)).toBeNull();
      expect(queryByPlaceholderText(/triage/i)).toBeNull();
      expect(queryByPlaceholderText(/diagnostic/i)).toBeNull();
    });

    it('persists draft to database when pressing Save Draft button', async () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      fireEvent.changeText(getByTestId('declaration-department-code-input'), 'CHIR-01');

      const saveBtn = getByTestId('declaration-save-draft-button');
      await act(async () => {
        fireEvent.press(saveBtn);
      });

      await waitFor(async () => {
        const db = getDatabase();
        const list = await db.getDeclarations({ requestingUserId: 1 });
        expect(list.length).toBeGreaterThanOrEqual(1);
        const draft = list.find((d) => d.department_code === 'CHIR-01');
        expect(draft).toBeDefined();
        expect(draft?.status).toBe('draft');
      });
    });

    it('auto-saves draft to SQLite database on step transition', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      fireEvent.changeText(getByTestId('declaration-department-code-input'), 'PNEUMO-02');

      // Next step triggers auto-save
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button'));
      });

      await waitFor(async () => {
        const db = getDatabase();
        const list = await db.getDeclarations({ requestingUserId: 1 });
        const draft = list.find((d) => d.department_code === 'PNEUMO-02');
        expect(draft).toBeDefined();
        expect(draft?.status).toBe('draft');
      });
    });

    it('requires honor attestation checkbox on Step 5 before submission', async () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Fast forward to Step 5
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // 2
      });
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // 3
      });
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // 4
      });
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // 5
      });

      // Submit without checking attestation
      await act(async () => {
        fireEvent.press(getByTestId('declaration-submit-button'));
      });

      // Must display validation error and not navigate
      expect(getByText('Veuillez attester l\'exactitude des informations pour soumettre.')).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('submits declaration successfully on Step 5 when attested, navigating to confirmation', async () => {
      const { getByTestId } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Fast forward to Step 5
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // 2
      });
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // 3
      });
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // 4
      });
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button')); // 5
      });

      // Check attestation
      fireEvent.press(getByTestId('declaration-attestation-checkbox'));

      // Submit
      await act(async () => {
        fireEvent.press(getByTestId('declaration-submit-button'));
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          'submissionConfirmation',
          expect.objectContaining({
            referenceNumber: expect.stringMatching(/^AES-/),
          })
        );
      });
    });

    it('renders cleanly in English and Arabic without raw localization keys', () => {
      // English
      setLocale('en');
      const enScreen = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );
      expect(enScreen.getByText('Step 1 of 5')).toBeTruthy();
      expect(enScreen.getByText('General Information')).toBeTruthy();
      expect(enScreen.getByText('Continue')).toBeTruthy();
      enScreen.unmount();

      // Arabic
      setLocale('ar');
      const arScreen = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );
      expect(arScreen.getByText('الخطوة 1 من 5')).toBeTruthy();
      expect(arScreen.getByText('معلومات عامة')).toBeTruthy();
      expect(arScreen.getByText('متابعة')).toBeTruthy();
      arScreen.unmount();

      setLocale('fr');
    });

    it('handles failed automatic draft save with localized error indication and keeps form values', async () => {
      const db = getDatabase();
      jest.spyOn(db, 'createDraft').mockRejectedValueOnce(new Error('SQLite write fault'));

      const { getByTestId, queryByTestId, getByText } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Enter department code in Step 1
      fireEvent.changeText(getByTestId('declaration-department-code-input'), 'EMERG-09');

      // Next step triggers auto-save which will fail
      await act(async () => {
        fireEvent.press(getByTestId('declaration-next-step-button'));
      });

      // User still successfully moves to Step 2 without crashing
      await waitFor(() => {
        expect(getByTestId('declaration-step-2')).toBeTruthy();
      });

      // Header indicates save error
      expect(getByTestId('declaration-sync-error')).toBeTruthy();
      expect(getByText('Échec de sauvegarde')).toBeTruthy();

      // Navigate back to Step 1
      fireEvent.press(getByTestId('declaration-prev-step-button'));
      expect(getByTestId('declaration-step-1')).toBeTruthy();

      // Form values are preserved in memory
      expect(getByTestId('declaration-department-code-input').props.value).toBe('EMERG-09');
    });

    it('handles failed explicit Save Draft operation without silently reporting success and preserves values', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const db = getDatabase();
      jest.spyOn(db, 'createDraft').mockRejectedValueOnce(new Error('Disk write failure'));

      const { getByTestId } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      fireEvent.changeText(getByTestId('declaration-department-code-input'), 'ICU-12');

      const saveBtn = getByTestId('declaration-save-draft-button');
      await act(async () => {
        fireEvent.press(saveBtn);
      });

      // Must display error alert, NOT success alert
      expect(alertSpy).toHaveBeenCalledWith(
        'Échec de l\'enregistrement',
        'Impossible d\'enregistrer le brouillon localement. Vos modifications restent conservées à l\'écran.'
      );

      // Must NOT navigate back
      expect(mockGoBack).not.toHaveBeenCalled();

      // Form values preserved in memory
      expect(getByTestId('declaration-step-1')).toBeTruthy();
      expect(getByTestId('declaration-department-code-input').props.value).toBe('ICU-12');
    });

    it('preserves form values and allows successful retry after a failed save operation', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const db = getDatabase();
      // First call fails, second call succeeds
      jest.spyOn(db, 'createDraft').mockRejectedValueOnce(new Error('Transient lock timeout'));

      const { getByTestId } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      fireEvent.changeText(getByTestId('declaration-department-code-input'), 'NEURO-03');

      // Attempt 1: Fails
      await act(async () => {
        fireEvent.press(getByTestId('declaration-save-draft-button'));
      });
      expect(alertSpy).toHaveBeenCalledWith(
        'Échec de l\'enregistrement',
        expect.any(String)
      );

      alertSpy.mockClear();

      // Attempt 2: Retry succeeds
      await act(async () => {
        fireEvent.press(getByTestId('declaration-save-draft-button'));
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Brouillon enregistré',
        '',
        expect.any(Array)
      );

      const list = await db.getDeclarations({ requestingUserId: 1 });
      const draft = list.find((d) => d.department_code === 'NEURO-03');
      expect(draft).toBeDefined();
    });

    it('does not navigate to confirmation screen on submission failure and preserves form values', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const db = getDatabase();
      jest.spyOn(db, 'submitDeclaration').mockRejectedValueOnce(new Error('Integrity constraint failure'));

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Fill in Step 1
      fireEvent.changeText(getByTestId('declaration-department-code-input'), 'TRAUMA-01');

      // Step 1 -> 2 -> 3 -> 4 -> 5
      await act(async () => { fireEvent.press(getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(getByTestId('declaration-next-step-button')); });

      expect(getByTestId('declaration-step-5')).toBeTruthy();

      // Attest
      fireEvent.press(getByTestId('declaration-attestation-checkbox'));

      // Submit
      await act(async () => {
        fireEvent.press(getByTestId('declaration-submit-button'));
      });

      // Must display error alert and NOT navigate
      expect(alertSpy).toHaveBeenCalledWith('Échec de la soumission', expect.any(String));
      expect(mockReplace).not.toHaveBeenCalled();

      // Remains on Step 5 with values intact
      expect(getByTestId('declaration-step-5')).toBeTruthy();
      expect(getByText('TRAUMA-01')).toBeTruthy();
    });

    it('prevents duplicate submissions caused by repeated rapid taps', async () => {
      const db = getDatabase();
      let resolveSubmit: (val: any) => void;
      const submitPromise = new Promise((resolve) => {
        resolveSubmit = resolve;
      });
      const submitSpy = jest.spyOn(db, 'submitDeclaration').mockImplementation(async () => {
        await submitPromise;
        return undefined as any;
      });

      const { getByTestId } = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );

      // Fast forward to Step 5
      await act(async () => { fireEvent.press(getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(getByTestId('declaration-next-step-button')); });

      // Attest
      fireEvent.press(getByTestId('declaration-attestation-checkbox'));

      const submitBtn = getByTestId('declaration-submit-button');

      // Rapidly fire multiple presses
      await act(async () => {
        fireEvent.press(submitBtn);
        fireEvent.press(submitBtn);
        fireEvent.press(submitBtn);
      });

      // Resolve the in-flight submission
      await act(async () => {
        resolveSubmit!(undefined);
      });

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledTimes(1);
      });

      expect(submitSpy).toHaveBeenCalledTimes(1);
    });

    it('renders neutral Step 4 advisory in FR, EN, and AR without prescriptive clinical suggestions', async () => {
      // French
      setLocale('fr');
      const frScreen = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );
      await act(async () => { fireEvent.press(frScreen.getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(frScreen.getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(frScreen.getByTestId('declaration-next-step-button')); });

      const frNotice = frScreen.getByText('Décrivez librement les mesures que vous avez effectivement prises après l’exposition.');
      expect(frNotice).toBeTruthy();
      // Ensure no prescriptive clinical suggestions exist
      expect(frScreen.queryByText(/désinfection/i)).toBeNull();
      expect(frScreen.queryByText(/rinçage/i)).toBeNull();
      expect(frScreen.queryByText(/consultation médicale immédiate/i)).toBeNull();
      frScreen.unmount();

      // English
      setLocale('en');
      const enScreen = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );
      await act(async () => { fireEvent.press(enScreen.getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(enScreen.getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(enScreen.getByTestId('declaration-next-step-button')); });

      expect(enScreen.getByText('Describe freely any measures you actually took following the exposure.')).toBeTruthy();
      expect(enScreen.queryByText(/form\.step4\.advisory/)).toBeNull();
      enScreen.unmount();

      // Arabic
      setLocale('ar');
      const arScreen = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );
      await act(async () => { fireEvent.press(arScreen.getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(arScreen.getByTestId('declaration-next-step-button')); });
      await act(async () => { fireEvent.press(arScreen.getByTestId('declaration-next-step-button')); });

      expect(arScreen.getByText('صِف بحرية التدابير التي اتخذتها فعلياً بعد التعرض.')).toBeTruthy();
      expect(arScreen.queryByText(/form\.step4\.advisory/)).toBeNull();
      arScreen.unmount();

      setLocale('fr');
    });

    it('renders incident type subtitles in FR, EN, and AR without raw localization keys', async () => {
      // French
      setLocale('fr');
      const frScreen = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );
      await act(async () => { fireEvent.press(frScreen.getByTestId('declaration-next-step-button')); }); // Step 2

      expect(frScreen.getByText('Piqûre d\'aiguille, coupure par bistouri ou effraction cutanée souillée')).toBeTruthy();
      expect(frScreen.getByText('Projection de liquide biologique sur muqueuse (œil, bouche) ou peau lésée')).toBeTruthy();
      expect(frScreen.getByText('Autre situation d\'exposition professionnelle accidentelle au sang')).toBeTruthy();
      expect(frScreen.queryByText(/form\.incidentType\..*\.desc/)).toBeNull();
      frScreen.unmount();

      // English
      setLocale('en');
      const enScreen = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );
      await act(async () => { fireEvent.press(enScreen.getByTestId('declaration-next-step-button')); });

      expect(enScreen.getByText('Needlestick injury, surgical blade cut, or contaminated cutaneous puncture')).toBeTruthy();
      expect(enScreen.getByText('Splash of biological fluid onto mucous membrane (eye, mouth) or non-intact skin')).toBeTruthy();
      expect(enScreen.getByText('Other accidental occupational blood or bodily fluid exposure event')).toBeTruthy();
      expect(enScreen.queryByText(/form\.incidentType\..*\.desc/)).toBeNull();
      enScreen.unmount();

      // Arabic
      setLocale('ar');
      const arScreen = render(
        <ThemeProvider>
          <DeclarationFormScreen />
        </ThemeProvider>
      );
      await act(async () => { fireEvent.press(arScreen.getByTestId('declaration-next-step-button')); });

      expect(arScreen.getByText('وخز إبرة، أو جرح بمشرط، أو اختراق جلدي ملوث')).toBeTruthy();
      expect(arScreen.getByText('تناثر سوائل بيولوجية على الأغشية المخاطية (العين، الفم) أو الجلد المصاب')).toBeTruthy();
      expect(arScreen.getByText('حالة أخرى من حالات التعرض المهني العرضي للدم')).toBeTruthy();
      expect(arScreen.queryByText(/form\.incidentType\..*\.desc/)).toBeNull();
      arScreen.unmount();

      setLocale('fr');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Screen 4.2: SubmissionConfirmationScreen
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Screen 4.2: SubmissionConfirmationScreen', () => {
    it('displays the actual reference number passed in route params', () => {
      mockRouteParams = { params: { referenceNumber: 'AES-2026-999' } };

      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <SubmissionConfirmationScreen />
        </ThemeProvider>
      );

      expect(getByTestId('confirmation-hero-circle')).toBeTruthy();
      expect(getByText('AES-2026-999')).toBeTruthy();
      expect(getByText('Déclaration soumise')).toBeTruthy();
      expect(getByText('Votre déclaration a été enregistrée localement.')).toBeTruthy();
      expect(getByText(/Votre déclaration a été soumise pour révision administrative/)).toBeTruthy();
      expect(getByText(/Note : cet enregistrement est local/)).toBeTruthy();
      expect(getByTestId('confirmation-back-button')).toBeTruthy();
    });

    it('does not present a fabricated reference when the route value is missing', () => {
      mockRouteParams = { params: {} };

      const { getByText, getByTestId } = render(
        <ThemeProvider>
          <SubmissionConfirmationScreen />
        </ThemeProvider>
      );

      expect(getByText('Référence indisponible')).toBeTruthy();
      expect(getByTestId('confirmation-reference-number').props.selectable).toBe(false);
    });

    it('navigates to declarations when pressing return action button', () => {
      mockRouteParams = { params: { referenceNumber: 'AES-2026-001' } };

      const { getByTestId } = render(
        <ThemeProvider>
          <SubmissionConfirmationScreen />
        </ThemeProvider>
      );

      fireEvent.press(getByTestId('confirmation-back-button'));
      expect(mockNavigate).toHaveBeenCalledWith('declarations');
    });

    it('allows selecting the actual reference text', () => {
      mockRouteParams = { params: { referenceNumber: 'AES-2026-001' } };

      const { getByTestId } = render(
        <ThemeProvider>
          <SubmissionConfirmationScreen />
        </ThemeProvider>
      );

      expect(getByTestId('confirmation-reference-number').props.selectable).toBe(true);
    });

    it('renders localized confirmation in English and Arabic without raw keys', () => {
      mockRouteParams = { params: { referenceNumber: 'AES-2026-001' } };

      // English
      setLocale('en');
      const enComp = render(
        <ThemeProvider>
          <SubmissionConfirmationScreen />
        </ThemeProvider>
      );
      expect(enComp.getByText('Declaration Submitted')).toBeTruthy();
      expect(enComp.getByText('Back to My Declarations')).toBeTruthy();
      expect(enComp.getByText('Reference:')).toBeTruthy();
      enComp.unmount();

      // Arabic
      setLocale('ar');
      const arComp = render(
        <ThemeProvider>
          <SubmissionConfirmationScreen />
        </ThemeProvider>
      );
      expect(arComp.getByText('تم تقديم التصريح')).toBeTruthy();
      expect(arComp.getByText('العودة إلى تصريحاتي')).toBeTruthy();
      expect(arComp.getByText('المرجع:')).toBeTruthy();
      arComp.unmount();

      setLocale('fr');
    });
  });
});
