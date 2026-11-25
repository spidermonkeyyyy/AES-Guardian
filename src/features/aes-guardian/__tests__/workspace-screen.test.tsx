import React from 'react';
import { StyleSheet } from 'react-native';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import {
  DEMO_ROLE_DEFINITIONS,
  getDatabase,
  initializeDatabase,
  resetDatabaseForTesting,
  useDemoRoleStore,
} from '../../../core';
import { ThemeProvider, useTheme } from '../../../theme/ThemeContext';
import { spacing } from '../../../theme/tokens';
import { setLocale, t, type TranslationKey } from '../../../localization';
import { AesGuardianWorkspaceScreen } from '../screens/AesGuardianWorkspaceScreen';
import { resolveDemoNarrative } from '../../../localization/demoNarratives';

const { clearAllMockStores } = require('@op-engineering/op-sqlite');
const mockNavigate = jest.fn();

const SetThemeMode: React.FC<{ mode: 'light' | 'dark' }> = ({ mode }) => {
  const { setThemeMode } = useTheme();
  React.useEffect(() => setThemeMode(mode), [mode, setThemeMode]);
  return null;
};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate }),
    useIsFocused: () => true,
  };
});

describe('AesGuardianWorkspaceScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    setLocale('en');
    clearAllMockStores();
    resetDatabaseForTesting();
    await initializeDatabase();
    act(() => useDemoRoleStore.getState().setRole('exposed_professional'));
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    clearAllMockStores();
    resetDatabaseForTesting();
    act(() => useDemoRoleStore.getState().setRole('exposed_professional'));
  });

  it('exposes every role switch using its localized label', async () => {
    const { findByLabelText, findByTestId } = render(
      <ThemeProvider>
        <AesGuardianWorkspaceScreen />
      </ThemeProvider>
    );

    for (const role of DEMO_ROLE_DEFINITIONS) {
      expect(await findByLabelText(t(role.labelKey as TranslationKey))).toBeTruthy();
    }
    expect(await findByTestId('workspace-metric-own-declarations')).toBeTruthy();
  });

  it('exposes selected role state and provides minimum-height role and header targets', async () => {
    const { findByTestId, findByLabelText } = render(
      <ThemeProvider>
        <AesGuardianWorkspaceScreen />
      </ThemeProvider>
    );
    const safeArea = await findByTestId('workspace-safe-area');
    expect(safeArea.props.edges).toEqual({
      top: 'additive',
      right: 'additive',
      bottom: 'off',
      left: 'additive',
    });
    const exposedRole = await findByTestId('workspace-role-exposed_professional');
    expect(exposedRole.props.accessibilityLabel).toBe(
      t(DEMO_ROLE_DEFINITIONS[0].labelKey as TranslationKey),
    );
    expect(exposedRole.props.accessibilityState).toEqual({ selected: true });
    expect(StyleSheet.flatten(exposedRole.props.style).minHeight).toBe(spacing.minTouchTarget);

    const reviewerRole = await findByLabelText(
      t(DEMO_ROLE_DEFINITIONS.find((role) => role.role === 'admin_reviewer')!.labelKey as TranslationKey)
    );
    fireEvent.press(reviewerRole);
    await waitFor(async () => expect(
      (await findByTestId('workspace-role-admin_reviewer')).props.accessibilityState,
    ).toEqual({ selected: true }));

    const headerActions = await findByTestId('workspace-header-actions');
    expect(StyleSheet.flatten(headerActions.props.style).flexDirection).toBe('row');
    expect(StyleSheet.flatten(headerActions.props.style).gap).toBe(spacing.xs);
    for (const testID of [
      'workspace-header-notifications',
      'workspace-header-help',
      'workspace-header-profile',
    ]) {
      const target = await findByTestId(testID);
      expect(StyleSheet.flatten(target.props.style)).toMatchObject({
        width: spacing.minTouchTarget,
        height: spacing.minTouchTarget,
      });
      expect(target.props.accessibilityRole).toBe('button');
      expect(target.props.accessibilityLabel).toBeTruthy();
    }
  });

  it('shows concise, current SQLite diagnostics for technical administration', async () => {
    const { findByLabelText, findByText, queryByText } = render(
      <ThemeProvider>
        <AesGuardianWorkspaceScreen />
      </ThemeProvider>
    );

    fireEvent.press(
      await findByLabelText(
        t(DEMO_ROLE_DEFINITIONS.find((role) => role.role === 'tech_admin')!.labelKey as TranslationKey)
      )
    );

    expect(await findByText('op-sqlite')).toBeTruthy();
    expect(await findByText(/^v\d+$/)).toBeTruthy();
    expect(queryByText(/expo-sqlite/)).toBeNull();
  });

  it('renders only the active role dashboard metrics and qualifies capped lists', async () => {
    const { findByLabelText, findByTestId, queryByTestId } = render(
      <ThemeProvider>
        <AesGuardianWorkspaceScreen />
      </ThemeProvider>
    );

    const roleMetric = {
      exposed_professional: 'workspace-metric-own-declarations',
      admin_reviewer: 'workspace-metric-review-items',
      oh_professional: 'workspace-metric-active-coordinations',
      quality_staff: 'workspace-metric-surveillance',
      tech_admin: 'workspace-metric-schema-version',
    } as const;
    const nextRoute = {
      exposed_professional: 'declarations',
      admin_reviewer: 'adminReviewQueue',
      oh_professional: 'ohCoordinationQueue',
      quality_staff: 'surveillanceDashboard',
    } as const;

    await findByTestId('workspace-metric-own-declarations');
    for (const role of DEMO_ROLE_DEFINITIONS) {
      await act(async () => {
        fireEvent.press(await findByLabelText(t(role.labelKey as TranslationKey)));
        await findByTestId(roleMetric[role.role]);
      });
      const activeMetric = await findByTestId(roleMetric[role.role]);
      expect(activeMetric).toBeTruthy();

      if (role.role === 'exposed_professional' || role.role === 'admin_reviewer') {
        expect(activeMetric.props.accessibilityLabel).toContain(
          t('workspace.dashboard.loadedLimit'),
        );
      }

      for (const [otherRole, testID] of Object.entries(roleMetric)) {
        if (otherRole !== role.role) {
          expect(queryByTestId(testID)).toBeNull();
        }
      }

      if (role.role === 'admin_reviewer') {
        expect(await findByTestId('workspace-metric-review-items')).toBeTruthy();
      }
      if (role.role === 'quality_staff') {
        expect(await findByTestId('workspace-metric-prevention-actions')).toBeTruthy();
        expect(queryByTestId('workspace-metric-own-declarations')).toBeNull();
      }
      if (role.role === 'tech_admin') {
        expect(queryByTestId('workspace-metric-review-items')).toBeNull();
        expect(queryByTestId('workspace-metric-surveillance')).toBeNull();
        expect(queryByTestId('workspace-metric-prevention-actions')).toBeNull();
        expect(queryByTestId('workspace-dashboard-next-action')).toBeNull();
      } else {
        fireEvent.press(await findByTestId('workspace-dashboard-next-action'));
        expect(mockNavigate).toHaveBeenLastCalledWith(nextRoute[role.role]);
      }
    }
  });

  it('shows a repository error distinctly and retries without showing stale role data', async () => {
    const database = getDatabase();
    const reviewQueue = jest
      .spyOn(database, 'getReviewQueue')
      .mockRejectedValueOnce(new Error('simulated read failure'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { findByLabelText, findByText, findByTestId, queryByTestId } = render(
      <ThemeProvider>
        <AesGuardianWorkspaceScreen />
      </ThemeProvider>
    );

    fireEvent.press(
      await findByLabelText(
        t(DEMO_ROLE_DEFINITIONS.find((role) => role.role === 'admin_reviewer')!.labelKey as TranslationKey)
      )
    );

    expect(await findByText(t('workspace.dashboard.error'))).toBeTruthy();
    expect(queryByTestId('workspace-metric-own-declarations')).toBeNull();
    fireEvent.press(await findByTestId('workspace-dashboard-retry'));

    expect(await findByTestId('workspace-metric-review-items')).toBeTruthy();
    expect(reviewQueue).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, requestingUserId: expect.any(Number) }),
    );
    reviewQueue.mockRestore();
  });

  it('renders dashboard labels in French, English, and Arabic', async () => {
    for (const locale of ['fr', 'en', 'ar'] as const) {
      setLocale(locale);
      const { findByText, findByTestId, unmount } = render(
        <ThemeProvider>
          <AesGuardianWorkspaceScreen />
        </ThemeProvider>
      );

      expect(await findByText(t('workspace.dashboard.title', locale))).toBeTruthy();
      const declarationLabel = await findByText(
        t('workspace.dashboard.ownDeclarations', locale),
      );
      expect(StyleSheet.flatten(declarationLabel.props.style).textAlign)
        .toBe(locale === 'ar' ? 'right' : 'left');
      const metricGrid = await findByTestId('workspace-dashboard-metric-grid');
      expect(StyleSheet.flatten(metricGrid.props.style).flexWrap).toBe('wrap');
      expect(StyleSheet.flatten(metricGrid.props.style).flexDirection)
        .toBe(locale === 'ar' ? 'row-reverse' : 'row');
      unmount();
    }
  });

  it('uses the active light and dark theme tokens for metric surfaces', async () => {
    for (const mode of ['light', 'dark'] as const) {
      const { findByTestId, unmount } = render(
        <ThemeProvider>
          <SetThemeMode mode={mode} />
          <AesGuardianWorkspaceScreen />
        </ThemeProvider>
      );

      const surface = await findByTestId('workspace-metric-own-declarations-surface');
      await waitFor(() => {
        const style = StyleSheet.flatten(surface.props.style);
        expect(style.backgroundColor).toBe(mode === 'dark' ? '#2d3a2e' : '#f8f5f0');
        expect(style.borderColor).toBe(mode === 'dark' ? '#3e4a3d' : '#e0d6c9');
      });
      unmount();
    }
  });

  it('uses semantic RTL row direction and preserves exact seed narrative provenance', async () => {
    setLocale('ar');
    const { findByTestId, getByTestId } = render(
      <ThemeProvider>
        <AesGuardianWorkspaceScreen />
      </ThemeProvider>
    );
    expect(await findByTestId('workspace-metric-own-declarations')).toBeTruthy();

    const roleSelector = getByTestId('workspace-role-selector');
    expect(roleSelector.props.contentContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flexDirection: 'row-reverse' }),
      ]),
    );
    expect(StyleSheet.flatten(getByTestId('workspace-header-actions').props.style).flexDirection)
      .toBe('row-reverse');

    expect(resolveDemoNarrative(
      'AES-2026-DEMO-01',
      'circumstances',
      "Piqûre accidentelle lors du recapuchonnage d'une aiguille usagée après prélèvement veineux.",
      'ar',
    )).toContain('إصابة');

    expect(resolveDemoNarrative(
      'AES-2026-DEMO-01',
      'circumstances',
      'This text was entered by a user',
      'ar',
    )).toBe('This text was entered by a user');

    expect(resolveDemoNarrative(
      'AES-2026-DEMO-02',
      'correction_reason',
      'Veuillez préciser le délai effectif du rinçage oculaire immédiat au sérum physiologique et les mesures prises sur place.',
      'ar',
    )).toContain('يرجى');
  });
});
