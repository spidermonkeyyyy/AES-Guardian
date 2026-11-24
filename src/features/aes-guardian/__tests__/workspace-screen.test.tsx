import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  DEMO_ROLE_DEFINITIONS,
  initializeDatabase,
  resetDatabaseForTesting,
  useDemoRoleStore,
} from '../../../core';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { setLocale, t } from '../../../localization';
import { AesGuardianWorkspaceScreen } from '../screens/AesGuardianWorkspaceScreen';

const { clearAllMockStores } = require('@op-engineering/op-sqlite');
const mockNavigate = jest.fn();

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
    useDemoRoleStore.getState().setRole('exposed_professional');
  });

  afterEach(() => {
    clearAllMockStores();
    resetDatabaseForTesting();
    useDemoRoleStore.getState().setRole('exposed_professional');
  });

  it('exposes every role switch using its localized label', async () => {
    const { findByLabelText } = render(
      <ThemeProvider>
        <AesGuardianWorkspaceScreen />
      </ThemeProvider>
    );

    for (const role of DEMO_ROLE_DEFINITIONS) {
      expect(await findByLabelText(t(role.labelKey as any))).toBeTruthy();
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
        t(DEMO_ROLE_DEFINITIONS.find((role) => role.role === 'tech_admin')!.labelKey as any)
      )
    );

    expect(await findByText('op-sqlite')).toBeTruthy();
    expect(await findByText(/^v\d+$/)).toBeTruthy();
    expect(queryByText(/expo-sqlite/)).toBeNull();
  });
});
