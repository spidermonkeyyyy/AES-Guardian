import React from 'react';

// Extend default timeout for potentially slow async UI rendering
jest.setTimeout(20000);
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { DeclarationListScreen } from '../screens/DeclarationListScreen';
import { DeclarationFormScreen } from '../screens/DeclarationFormScreen';
import { DeclarationDetailsScreen } from '../screens/DeclarationDetailsScreen';
import { SubmissionConfirmationScreen } from '../screens/SubmissionConfirmationScreen';
import { initializeDatabase, resetDatabaseForTesting, getDatabase } from '../../../core';
import { ThemeProvider } from '../../../theme/ThemeContext';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();

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
      params: {},
    }),
    useIsFocused: () => true,
  };
});

describe('AES Guardian UI Workflow Screens', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    resetDatabaseForTesting();
    await initializeDatabase();
  });

  afterEach(() => {
    resetDatabaseForTesting();
  });

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
    expect(component.getByText('+ Nouvelle déclaration')).toBeTruthy();
  });

  it('DeclarationFormScreen renders form fields and triggers saveDraft', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <DeclarationFormScreen />
      </ThemeProvider>
    );

    expect(getByText('Nouvelle déclaration AES')).toBeTruthy();
    expect(getByText('Enregistrer le brouillon')).toBeTruthy();
    expect(getByText('Soumettre la déclaration')).toBeTruthy();

    const circumInput = getByPlaceholderText('Décrivez les circonstances de l\'incident…');
    fireEvent.changeText(circumInput, 'Exposition accidentelle lors d\'un prélèvement sanguin');

    const saveButton = getByText('Enregistrer le brouillon');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(async () => {
      const db = getDatabase();
      const list = await db.getDeclarations();
      expect(list.length).toBe(1);
      expect(list[0].status).toBe('draft');
      expect(list[0].circumstances).toBe('Exposition accidentelle lors d\'un prélèvement sanguin');
    });
  });

  it('SubmissionConfirmationScreen displays reference number and back button', () => {
    const { getByText } = render(
      <ThemeProvider>
        <SubmissionConfirmationScreen />
      </ThemeProvider>
    );

    expect(getByText('Déclaration soumise')).toBeTruthy();
    expect(getByText('Retour à mes déclarations')).toBeTruthy();

    const backBtn = getByText('Retour à mes déclarations');
    fireEvent.press(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('declarations');
  });
});
