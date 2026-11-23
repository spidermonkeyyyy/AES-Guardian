/**
 * AES Guardian — Help Centre, Glossary & Demonstrator Profile Test Suite (Phase 2D.1)
 *
 * Verifies:
 * - HelpGlossaryScreen rendering and tab navigation
 * - Accordion section expansion / collapse
 * - Real-time glossary search and category filtering
 * - Empty search state handling
 * - AesGuardianProfileScreen role and account rendering
 * - Authorized and restricted capabilities matrix per role
 * - In-memory role switching from profile screen
 * - Runtime multilingual language switching (FR, EN, AR)
 * - tech_admin data reset action visibility and 2-step confirmation dialog
 * - Non-tech_admin reset action restriction
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HelpGlossaryScreen } from '../screens/HelpGlossaryScreen';
import { AesGuardianProfileScreen } from '../screens/AesGuardianProfileScreen';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
} from '../../../core';
import {
  setLocale,
  getLocale,
  t,
  translations,
  SUPPORTED_LOCALES,
} from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
    useIsFocused: () => true,
  };
});

describe('Phase 2D.1 — Help Centre, Glossary & Demonstrator Profile', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRouteParams = {};
    setLocale('fr');
    useDemoRoleStore.getState().setRole('exposed_professional');
    resetDatabaseForTesting();
    await initializeDatabase({ seedDemoScenario: true });
  });

  afterEach(() => {
    resetDatabaseForTesting();
  });

  // ─── 1. Localization Completeness ──────────────────────────────

  describe('Localization Coverage & Multi-language Support', () => {
    test('all new Phase 2D.1 keys are translated across FR, EN, AR without missing fallbacks', () => {
      const keysToCheck = [
        'helpGlossary.title',
        'helpGlossary.disclaimer',
        'helpGlossary.clearSearch',
        'help.section1.title',
        'help.section1.content',
        'help.section8.title',
        'help.section8.content',
        'glossary.term1.term',
        'glossary.term1.definition',
        'glossary.term14.term',
        'glossary.term14.definition',
        'profile.title',
        'profile.accountSection',
        'profile.authorizedCapabilities',
        'profile.restrictedCapabilities',
        'profile.guidedTourLink',
        'profile.error.techAdminOnly',
        'profile.error.userIdMissing',
        'correction.demoContext',
        'correction.characterCount',
        'review.notReviewable',
        'reset.sectionTitle',
        'reset.dialog1Title',
        'reset.dialog2Title',
        'reset.buttonLabel',
      ] as const;

      for (const loc of SUPPORTED_LOCALES) {
        for (const k of keysToCheck) {
          const val = (translations[loc] as Record<string, string>)[k];
          expect(val).toBeDefined();
          expect(typeof val).toBe('string');
          expect(val.length).toBeGreaterThan(0);
        }
      }
    });

    test('setLocale dynamically changes runtime translations', () => {
      setLocale('fr');
      expect(t('helpGlossary.title')).toBe("Centre d'Aide & Glossaire");

      setLocale('en');
      expect(t('helpGlossary.title')).toBe('Help Centre & Glossary');

      setLocale('ar');
      expect(t('helpGlossary.title')).toBe('مركز المساعدة والمسرد');

      // Reset back to fr
      setLocale('fr');
      expect(getLocale()).toBe('fr');
    });
  });

  // ─── 2. Help Centre & Glossary Screen ─────────────────────────

  describe('HelpGlossaryScreen', () => {
    test('renders help centre tabs and persistent disclaimer', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <HelpGlossaryScreen />
        </ThemeProvider>,
      );

      expect(getByText("Centre d'Aide & Glossaire")).toBeTruthy();
      expect(
        getByText(/Cette application est un prototype de démonstration académique/i),
      ).toBeTruthy();
      expect(getByText(/1\. Présentation d'AES Guardian/i)).toBeTruthy();
    });

    test('expands and collapses help section on header press', async () => {
      const { getByText, queryByText } = render(
        <ThemeProvider>
          <HelpGlossaryScreen />
        </ThemeProvider>,
      );

      // Section 2 is initially collapsed
      expect(getByText(/2\. Comprendre le parcours de déclaration/i)).toBeTruthy();
      expect(queryByText(/Le soignant victime d'une exposition/i)).toBeNull();

      // Tap Section 2 header to expand
      fireEvent.press(getByText(/2\. Comprendre le parcours de déclaration/i));
      expect(getByText(/Le soignant victime d'une exposition/i)).toBeTruthy();

      // Tap again to collapse
      fireEvent.press(getByText(/2\. Comprendre le parcours de déclaration/i));
      expect(queryByText(/Le soignant victime d'une exposition/i)).toBeNull();
    });

    test('switches to glossary tab and filters terms by search text', async () => {
      const { getByText, getByPlaceholderText, getByTestId, queryByText } = render(
        <ThemeProvider>
          <HelpGlossaryScreen />
        </ThemeProvider>,
      );

      // Switch to Glossary tab
      act(() => {
        fireEvent.press(getByTestId('tab-glossary'));
      });

      // Check that glossary terms appear
      expect(getByText("AES (Accident d'Exposition au Sang)")).toBeTruthy();
      expect(getByText('Exposition percutanée')).toBeTruthy();
      expect(queryByText(/Lésion pénétrante causée/)).toBeNull();

      // Type search query
      const searchInput = getByPlaceholderText('Rechercher un terme ou une définition…');
      act(() => {
        fireEvent.changeText(searchInput, 'bistouri');
      });

      // 'Exposition percutanée' mentions bistouri in its definition
      expect(getByText('Exposition percutanée')).toBeTruthy();
      // Other non-matching terms should be filtered out
      expect(queryByText('Exposition muqueuse')).toBeNull();

      // Search non-existent term
      act(() => {
        fireEvent.changeText(searchInput, 'terme_inexistant_xyz');
      });
      expect(getByText('Aucun terme correspondant à votre recherche.')).toBeTruthy();
    });

    test('starts glossary definitions collapsed and supports accent-insensitive search', () => {
      const { getByTestId, getByPlaceholderText, getByText, queryByText } = render(
        <ThemeProvider>
          <HelpGlossaryScreen />
        </ThemeProvider>,
      );

      fireEvent.press(getByTestId('tab-glossary'));
      expect(queryByText(/Examens de biologie médicale/)).toBeNull();

      const searchInput = getByPlaceholderText('Rechercher un terme ou une définition…');
      fireEvent.changeText(searchInput, 'serologie');
      expect(getByText('Sérologie')).toBeTruthy();
      expect(queryByText("AES (Accident d'Exposition au Sang)")).toBeNull();

      fireEvent.press(getByTestId('glossary-t8'));
      expect(getByText(/Examens de biologie médicale/)).toBeTruthy();
    });

    test('filters glossary by category chip', async () => {
      const { getByText, getByTestId, queryByText } = render(
        <ThemeProvider>
          <HelpGlossaryScreen />
        </ThemeProvider>,
      );

      // Switch to Glossary tab
      act(() => {
        fireEvent.press(getByTestId('tab-glossary'));
      });

      // Filter by 'Santé au Travail' using chip testID
      act(() => {
        fireEvent.press(getByTestId('chip-oh'));
      });

      expect(getByText('Coordination de Santé au Travail')).toBeTruthy();
      expect(getByText('Sérologie')).toBeTruthy();
      expect(getByText('Événement de suivi')).toBeTruthy();

      // Terms in 'Exposition' should be hidden
      expect(queryByText('Exposition percutanée')).toBeNull();
    });

    test('navigates back to workspace when back button is pressed', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <HelpGlossaryScreen />
        </ThemeProvider>,
      );

      fireEvent.press(getByText(/Retour à l'espace/i));
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });

  // ─── 3. Demonstrator Profile & Settings Screen ────────────────

  describe('AesGuardianProfileScreen', () => {
    test('renders account info and capabilities for exposed_professional', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const { getByText, queryByText } = render(
        <ThemeProvider>
          <AesGuardianProfileScreen />
        </ThemeProvider>,
      );

      expect(getByText('Profil & Réglages Démonstrateur')).toBeTruthy();
      expect(getByText('Professionnel Démo (Synthétique)')).toBeTruthy();
      expect(queryByText(/ID #/)).toBeNull();
      expect(getByText(/Déclarer un nouvel AES/i)).toBeTruthy();
      expect(getByText(/Accès interdit au tableau de bord épidémiologique/i)).toBeTruthy();
    });

    test('switching role to quality_staff dynamically updates permissions', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <AesGuardianProfileScreen />
        </ThemeProvider>,
      );

      // Initially exposed_professional cannot see surveillance
      expect(getByText(/Accès interdit au tableau de bord épidémiologique/i)).toBeTruthy();

      // Tap 'Personnel qualité' role pill
      act(() => {
        fireEvent.press(getByText('Personnel qualité'));
      });

      // Role updated
      expect(useDemoRoleStore.getState().activeRole).toBe('quality_staff');
      expect(getByText('Responsable Qualité (Démo)')).toBeTruthy();
      expect(getByText(/Consulter les indicateurs épidémiologiques dé-identifiés/i)).toBeTruthy();
      expect(getByText(/Accès aux identités individuelles des soignants refusé/i)).toBeTruthy();
    });

    test('language switcher applies new locale immediately', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <AesGuardianProfileScreen />
        </ThemeProvider>,
      );

      // Tap English button
      fireEvent.press(getByText(/English/i));
      expect(getLocale()).toBe('en');

      // Header is now in English
      expect(getByText('Demonstrator Profile & Settings')).toBeTruthy();
      expect(getByText('Guided tour and introduction')).toBeTruthy();

      // Tap Arabic button
      fireEvent.press(getByText(/العربية/i));
      expect(getLocale()).toBe('ar');
      expect(getByText('ملف وإعدادات العارض')).toBeTruthy();
      expect(getByText('جولة تعريفية')).toBeTruthy();

      // Switch back to French
      fireEvent.press(getByText(/Français/i));
      expect(getLocale()).toBe('fr');
      expect(getByText('Profil & Réglages Démonstrateur')).toBeTruthy();
      expect(getByText('Visite guidée et découverte')).toBeTruthy();
    });

    test('hides technical data reset card for non-tech_admin roles', async () => {
      useDemoRoleStore.getState().setRole('exposed_professional');

      const { queryByText } = render(
        <ThemeProvider>
          <AesGuardianProfileScreen />
        </ThemeProvider>,
      );

      expect(queryByText(/Réinitialisation des Données de Démonstration/i)).toBeNull();
    });

    test('shows technical reset card and triggers 2-step confirmation alert for tech_admin', async () => {
      useDemoRoleStore.getState().setRole('tech_admin');
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByText } = render(
        <ThemeProvider>
          <AesGuardianProfileScreen />
        </ThemeProvider>,
      );

      expect(getByText(/Réinitialisation des Données de Démonstration/i)).toBeTruthy();

      // Tap Reset button
      const resetBtn = getByText(/Réinitialiser les données de démonstration/i);
      fireEvent.press(resetBtn);

      // Step 1 confirmation Alert should be called
      expect(alertSpy).toHaveBeenCalledWith(
        'Réinitialiser les données ?',
        expect.stringContaining('Cette opération supprimera l\'ensemble des déclarations'),
        expect.any(Array),
        expect.any(Object),
      );

      // Simulate clicking "Continuer…" in Step 1
      const step1Buttons = alertSpy.mock.calls[0][2] as any[];
      const continueBtn = step1Buttons.find((b: any) => b.text === 'Continuer…');
      expect(continueBtn).toBeDefined();

      act(() => {
        continueBtn.onPress();
      });

      // Step 2 confirmation Alert should be called
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmation Définitive',
        expect.stringContaining('Êtes-vous absolument certain'),
        expect.any(Array),
        expect.any(Object),
      );

      // Simulate clicking "Confirmer la réinitialisation" in Step 2
      const step2Buttons = alertSpy.mock.calls[1][2] as any[];
      const confirmBtn = step2Buttons.find((b: any) => b.text === 'Confirmer la réinitialisation');
      expect(confirmBtn).toBeDefined();

      await act(async () => {
        await confirmBtn.onPress();
      });

      // Success alert is shown
      expect(alertSpy).toHaveBeenCalledWith(
        'Réinitialisation Réussie',
        'Le scénario de démonstration a été restauré.',
      );

      alertSpy.mockRestore();
    });
  });
});
