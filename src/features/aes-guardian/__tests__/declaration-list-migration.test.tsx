import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Button } from '@ui-kitten/components';
import {
  getDatabase,
  initializeDatabase,
  resetDatabaseForTesting,
  useDemoRoleStore,
} from '../../../core';
import { setLocale, t } from '../../../localization';
import { ThemeProvider, useTheme } from '../../../theme/ThemeContext';
import { SanadUiKittenProvider } from '../../../theme/SanadUiKittenProvider';
import { darkTheme, lightTheme } from '../../../theme/tokens/colors';
import { aesTypography } from '../../../theme/tokens/aesTypography';
import { getAppFontFamily } from '../../../theme/tokens/fontFamilies';
import { DeclarationListScreen } from '../screens/DeclarationListScreen';

const { clearAllMockStores } = require('@op-engineering/op-sqlite');
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
    useIsFocused: () => true,
  };
});

function TestProviders({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider>
      <SanadUiKittenProvider>{children}</SanadUiKittenProvider>
    </ThemeProvider>
  );
}

function ThemeControls() {
  const { setThemeMode } = useTheme();
  return (
    <>
      <Button testID="theme-light" onPress={() => setThemeMode('light')}>Light</Button>
      <Button testID="theme-dark" onPress={() => setThemeMode('dark')}>Dark</Button>
    </>
  );
}

describe('DeclarationListScreen controlled UI Kitten migration', () => {
  let declarationIds: {
    draft: number;
    submitted: number;
    underReview: number;
    resubmitted: number;
  };
  let foreignDeclarationId: number;

  beforeEach(async () => {
    jest.clearAllMocks();
    setLocale('fr');
    clearAllMockStores();
    resetDatabaseForTesting();
    await initializeDatabase();
    useDemoRoleStore.getState().setRole('exposed_professional');

    const db = getDatabase();
    const draft = await db.createDraft({
      declared_by_user_id: 1,
      incident_date: '2026-03-01',
      incident_type: 'percutaneous_exposure',
      circumstances: 'Needlestick during suturing',
    });
    const submitted = await db.createDraft({
      declared_by_user_id: 1,
      incident_date: '2026-03-02',
      incident_type: 'mucocutaneous_exposure',
      circumstances: 'Splash during care',
    });
    await db.submitDeclaration(submitted);

    const underReview = await db.createDraft({
      declared_by_user_id: 1,
      incident_date: '2026-03-03',
      incident_type: 'other',
      circumstances: 'Incident under review',
    });
    await db.submitDeclaration(underReview);
    await db.createAdministrativeReview({
      declaration_id: underReview,
      reviewer_user_id: 2,
      outcome: 'acknowledged',
    });

    const resubmitted = await db.createDraft({
      declared_by_user_id: 1,
      incident_date: '2026-03-04',
      incident_type: 'percutaneous_exposure',
      circumstances: 'Corrected incident',
    });
    await db.submitDeclaration(resubmitted);
    const review = await db.createAdministrativeReview({
      declaration_id: resubmitted,
      reviewer_user_id: 2,
      outcome: 'correction_requested',
      correction_reason: 'Clarify protective equipment',
    });
    await db.createCorrectionResponse({
      declaration_id: resubmitted,
      review_id: review.reviewId,
      user_id: 1,
      response_text: 'Protective equipment clarified',
    });

    foreignDeclarationId = await db.createDraft({
      declared_by_user_id: 4,
      incident_date: '2026-03-05',
      incident_type: 'other',
      circumstances: 'Another professional declaration',
    });
    await db.submitDeclaration(foreignDeclarationId);

    declarationIds = { draft, submitted, underReview, resubmitted };
  });

  afterEach(() => {
    useDemoRoleStore.getState().setRole('exposed_professional');
    setLocale('fr');
    clearAllMockStores();
    resetDatabaseForTesting();
  });

  it('renders the native list and controls while preserving all five filter results and stored data', async () => {
    const db = getDatabase();
    const persistedBefore = await db.getDeclarations({ requestingUserId: 1 });
    const view = render(
      <TestProviders>
        <DeclarationListScreen />
      </TestProviders>,
    );

    expect(await screen.findByText('Mes déclarations')).toBeTruthy();
    expect(view.UNSAFE_getByType(FlatList)).toBeTruthy();
    expect(view.UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(6);

    const visibleIds = () =>
      new Set(
        screen
          .queryAllByTestId(/^declaration-card-\d+$/)
          .map((row) => row.props.testID as string),
      );
    const expected = (ids: number[]) =>
      new Set(ids.map((id) => `declaration-card-${id}`));

    await waitFor(() => {
      expect(visibleIds()).toEqual(expected(Object.values(declarationIds)));
    });

    const listItem = screen.getByTestId(`declaration-card-${declarationIds.draft}`);
    const draftDeclaration = persistedBefore.find((item) => item.id === declarationIds.draft);
    expect(React.Children.count(listItem.props.children)).toBeGreaterThan(0);
    expect(within(listItem).getByText(draftDeclaration?.reference_number ?? '')).toBeTruthy();
    expect(within(listItem).getByText('Needlestick during suturing')).toBeTruthy();

    const filters = [
      { key: 'all', ids: Object.values(declarationIds) },
      { key: 'draft', ids: [declarationIds.draft] },
      { key: 'submitted', ids: [declarationIds.submitted] },
      {
        key: 'under_review',
        ids: [declarationIds.underReview, declarationIds.resubmitted],
      },
      { key: 'closed', ids: [] },
    ] as const;

    for (const filter of filters) {
      const control = screen.getByTestId(`filter-chip-${filter.key}`);
      fireEvent.press(control);
      await waitFor(() => {
        expect(visibleIds()).toEqual(expected([...filter.ids]));
        expect(control.props.accessibilityState.selected).toBe(true);
      });
    }

    expect(screen.getByText(t('list.empty'))).toBeTruthy();
    expect(await db.getDeclarations({ requestingUserId: 1 })).toEqual(persistedBefore);
  });

  it('keeps detail and new-declaration navigation targets unchanged', async () => {
    render(
      <TestProviders>
        <DeclarationListScreen />
      </TestProviders>,
    );

    const row = await screen.findByTestId(`declaration-card-${declarationIds.draft}`);
    fireEvent.press(row);
    expect(mockNavigate).toHaveBeenLastCalledWith('declarationDetails', {
      declarationId: declarationIds.draft,
    });

    fireEvent.press(screen.getByTestId('new-declaration-button'));
    expect(mockNavigate).toHaveBeenLastCalledWith('newDeclaration');
  });

  it('keeps admin-reviewer scoping, filter behavior, and queue navigation unchanged', async () => {
    useDemoRoleStore.getState().setRole('admin_reviewer');
    render(
      <TestProviders>
        <DeclarationListScreen />
      </TestProviders>,
    );

    expect(await screen.findByText('Toutes les déclarations')).toBeTruthy();
    expect(await screen.findByTestId(`declaration-card-${foreignDeclarationId}`)).toBeTruthy();
    expect(screen.queryByTestId('new-declaration-button')).toBeNull();

    fireEvent.press(screen.getByTestId('filter-chip-submitted'));
    await waitFor(() => {
      expect(screen.getByTestId(`declaration-card-${declarationIds.submitted}`)).toBeTruthy();
      expect(screen.getByTestId(`declaration-card-${foreignDeclarationId}`)).toBeTruthy();
      expect(screen.queryByTestId(`declaration-card-${declarationIds.draft}`)).toBeNull();
    });

    fireEvent.press(screen.getByTestId(`declaration-card-${foreignDeclarationId}`));
    expect(mockNavigate).toHaveBeenLastCalledWith('declarationDetails', {
      declarationId: foreignDeclarationId,
    });
    fireEvent.press(screen.getByTestId('admin-queue-shortcut'));
    expect(mockNavigate).toHaveBeenLastCalledWith('adminReviewQueue');
  });

  it('keeps every filter operable, selected-state aware, and at least 48 dp high', async () => {
    render(
      <TestProviders>
        <DeclarationListScreen />
      </TestProviders>,
    );
    await screen.findByText('Mes déclarations');

    const filterKeys = ['all', 'draft', 'submitted', 'under_review', 'closed'];
    for (const key of filterKeys) {
      const control = screen.getByTestId(`filter-chip-${key}`);
      expect(control.props.accessibilityRole).toBe('button');
      expect(StyleSheet.flatten(control.props.style).minHeight).toBeGreaterThanOrEqual(48);
      fireEvent.press(control);
      expect(control.props.accessibilityState.selected).toBe(true);
    }

    expect(StyleSheet.flatten(screen.getByTestId('filter-chip-bar').props.contentContainerStyle).flexDirection)
      .toBe('row');
  });

  it('localizes filter labels and keeps list text and order correct in French, English, and Arabic', async () => {
    render(
      <TestProviders>
        <DeclarationListScreen />
      </TestProviders>,
    );
    await screen.findByText('Mes déclarations');

    const filterKeys = [
      'list.filter.all',
      'list.filter.draft',
      'list.filter.submitted',
      'list.filter.under_review',
      'list.filter.closed',
    ] as const;
    const expectLocalizedFilters = (locale: 'fr' | 'en' | 'ar') => {
      for (const key of filterKeys) {
        expect(screen.getByTestId(`filter-chip-${key.replace('list.filter.', '')}`).props.accessibilityLabel)
          .toBe(t(key, locale));
      }
    };

    expectLocalizedFilters('fr');
    act(() => setLocale('en'));
    await waitFor(() => expect(screen.getByText('My Declarations')).toBeTruthy());
    expectLocalizedFilters('en');
    expect(StyleSheet.flatten(screen.getByTestId('filter-chip-bar').props.contentContainerStyle).flexDirection)
      .toBe('row');

    act(() => setLocale('ar'));
    await waitFor(() => expect(screen.getByText('تصريحاتي')).toBeTruthy());
    expectLocalizedFilters('ar');
    expect(StyleSheet.flatten(screen.getByTestId('filter-chip-bar').props.contentContainerStyle).flexDirection)
      .toBe('row-reverse');
    expect(StyleSheet.flatten(screen.getByTestId(`declaration-card-header-${declarationIds.draft}`).props.style).flexDirection)
      .toBe('row-reverse');
    expect(StyleSheet.flatten(screen.getByTestId(`declaration-reference-${declarationIds.draft}`).props.style).fontFamily)
      .toBe(getAppFontFamily('cardHeading', 'ar'));
    expect(StyleSheet.flatten(screen.getByTestId(`declaration-date-${declarationIds.draft}`).props.style).textAlign)
      .toBe('right');

    act(() => setLocale('fr'));
    await waitFor(() => expect(screen.getByText('Mes déclarations')).toBeTruthy());
    expect(StyleSheet.flatten(screen.getByTestId(`declaration-reference-${declarationIds.draft}`).props.style).fontFamily)
      .toBe(aesTypography.heading2.fontFamily);
  });

  it('keeps the SANAD canvas and row surfaces synchronized with light and dark theme changes', async () => {
    render(
      <TestProviders>
        <ThemeControls />
        <DeclarationListScreen />
      </TestProviders>,
    );
    await screen.findByTestId(`declaration-card-${declarationIds.draft}`);

    fireEvent.press(screen.getByTestId('theme-light'));
    expect(StyleSheet.flatten(screen.getByTestId('declaration-list-screen').props.style).backgroundColor)
      .toBe(lightTheme.colors.background);
    expect(StyleSheet.flatten(screen.getByTestId(`declaration-card-${declarationIds.draft}`).props.style).backgroundColor)
      .toBe(lightTheme.colors.card);

    fireEvent.press(screen.getByTestId('theme-dark'));
    await waitFor(() => {
      expect(StyleSheet.flatten(screen.getByTestId('declaration-list-screen').props.style).backgroundColor)
        .toBe(darkTheme.colors.background);
      expect(StyleSheet.flatten(screen.getByTestId(`declaration-card-${declarationIds.draft}`).props.style).backgroundColor)
        .toBe(darkTheme.colors.card);
    });
  });
});
