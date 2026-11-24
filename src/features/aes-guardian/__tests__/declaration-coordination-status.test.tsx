import React from 'react';
import { render } from '@testing-library/react-native';
import {
  getDatabase,
  initializeDatabase,
  resetDatabaseForTesting,
  useDemoRoleStore,
} from '../../../core';
import { setLocale, t } from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { DeclarationCoordinationStatusScreen } from '../screens/DeclarationCoordinationStatusScreen';

const { clearAllMockStores } = require('@op-engineering/op-sqlite');
let mockRouteParams = { declarationId: 1 };

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useRoute: () => ({ params: mockRouteParams }),
  };
});

describe('DeclarationCoordinationStatusScreen', () => {
  beforeEach(async () => {
    clearAllMockStores();
    resetDatabaseForTesting();
    setLocale('fr');
    await initializeDatabase({ seedDemoScenario: false });
    useDemoRoleStore.getState().setRole('exposed_professional');
  });

  afterEach(() => {
    clearAllMockStores();
    resetDatabaseForTesting();
    useDemoRoleStore.getState().setRole('exposed_professional');
  });

  it('shows only status and the clinical disclaimer for the exposed professional', async () => {
    const db = getDatabase();
    const declarationId = await db.createDraft({
      declared_by_user_id: 1,
      incident_date: '2026-03-01',
      incident_type: 'percutaneous_exposure',
    });
    const coordinationId = await db.createOhCoordination({
      declaration_id: declarationId,
      created_by_user_id: 2,
      coordination_reason: 'routine_followup',
    });
    await db.acknowledgeOhCoordination(coordinationId, 3);
    await db.createOhFollowUpEvent({
      coordination_id: coordinationId,
      event_category: 'contact_established',
      event_date: '2026-03-02',
      recorded_by_user_id: 3,
      administrative_note: 'Private follow-up note',
    });
    mockRouteParams = { declarationId };

    const { findByText, queryByText } = render(
      <ThemeProvider>
        <DeclarationCoordinationStatusScreen />
      </ThemeProvider>
    );

    expect(await findByText(t('oh.status.acknowledged', 'fr'))).toBeTruthy();
    expect(queryByText(t('oh.reason.routine_followup', 'fr'))).toBeNull();
    expect(queryByText('Private follow-up note')).toBeNull();
  });

  it('denies non-declarant roles before querying coordination data', async () => {
    useDemoRoleStore.getState().setRole('oh_professional');
    const db = getDatabase();
    const getCoordinationSpy = jest.spyOn(db, 'getOhCoordinationByDeclaration');
    mockRouteParams = { declarationId: 1 };

    const { findByText } = render(
      <ThemeProvider>
        <DeclarationCoordinationStatusScreen />
      </ThemeProvider>
    );

    expect(await findByText(t('oh.error.unauthorized', 'fr'))).toBeTruthy();
    expect(getCoordinationSpy).not.toHaveBeenCalled();
    getCoordinationSpy.mockRestore();
  });
});
