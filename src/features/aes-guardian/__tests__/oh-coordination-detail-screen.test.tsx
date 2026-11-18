/**
 * AES Guardian Phase 2D.2C.3.4: OH Coordination Detail Screen Runtime-Consumption Verification
 *
 * Verifies that OhCoordinationDetailScreen safely consumes role-dependent return types:
 * 1. oh_professional receives and renders OH-only fields (coordinator, acknowledgedBy, completedBy, events, actions)
 * 2. admin_reviewer renders limited AdminOhCoordinationSummary without OH-only properties
 * 3. exposed_professional renders only the status projection (no reason, no OH staff, no actions)
 * 4. quality_staff and tech_admin are completely denied access to the screen
 * 5. unauthenticated / missing identity is rejected
 * 6. optional declaration_reference behavior conforms to interface (shows reference when present, fallback when absent)
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { OhCoordinationDetailScreen } from '../screens/OhCoordinationDetailScreen';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
  UNAUTHENTICATED_CONTEXT,
} from '../../../core';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { t } from '../../../localization';

const mockNavigate = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
    useIsFocused: () => true,
  };
});

describe('Phase 2D.2C.3.4: OhCoordinationDetailScreen Runtime-Consumption Tests', () => {
  let coordId: number;
  let declId: number;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRouteParams = {};
    resetDatabaseForTesting();
    await initializeDatabase();
    const db = getDatabase();

    // Create a submitted declaration for exposed professional (user 1)
    declId = await db.createDraft({
      declared_by_user_id: 1,
      incident_date: '2026-03-01',
      incident_type: 'percutaneous_exposure',
    });
    await db.submitDeclaration(declId);

    // Create and advance an OH coordination (user 2 is admin_reviewer, user 3 is oh_professional)
    coordId = await db.createOhCoordination({
      declaration_id: declId,
      created_by_user_id: 2,
      coordination_reason: 'routine_followup',
    });
    await db.acknowledgeOhCoordination(coordId, 3);
    await db.completeOhCoordination(coordId, 3);

    mockRouteParams = { coordinationId: coordId };
  });

  afterEach(() => {
    useDemoRoleStore.getState().setRole('exposed_professional');
    resetDatabaseForTesting();
  });

  test('1. oh_professional receives and renders full OH coordination details including OH-only fields', async () => {
    useDemoRoleStore.getState().setRole('oh_professional');

    const component = render(
      <ThemeProvider>
        <OhCoordinationDetailScreen />
      </ThemeProvider>,
    );

    // Wait for screen to load coordination data
    await waitFor(() => {
      expect(component.getByText(t('oh.status.completed'))).toBeTruthy();
    });

    // Reason is rendered
    expect(component.getByText(t('oh.detail.reason'))).toBeTruthy();
    expect(component.getByText(t('oh.reason.routine_followup'))).toBeTruthy();

    // OH-only fields: acknowledged by, completed by, events section
    expect(component.getByText(t('oh.detail.acknowledgedBy'))).toBeTruthy();
    expect(component.getByText(t('oh.detail.completedBy'))).toBeTruthy();
    // Phase 2E.1.6.1: numeric User #ID fallback removed — uses neutral status or display name
    expect(component.getByText(t('oh.detail.acknowledgedStatus'))).toBeTruthy();
    expect(component.queryByText('User #3')).toBeNull();
    expect(component.getByText(t('oh.detail.events'))).toBeTruthy();
  });

  test('2. admin_reviewer renders limited AdminOhCoordinationSummary without OH-only properties', async () => {
    useDemoRoleStore.getState().setRole('admin_reviewer');

    const component = render(
      <ThemeProvider>
        <OhCoordinationDetailScreen />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(component.getByText(t('oh.status.completed'))).toBeTruthy();
    });

    // Reason and status are authorized for admin_reviewer
    expect(component.getByText(t('oh.detail.reason'))).toBeTruthy();
    expect(component.getByText(t('oh.reason.routine_followup'))).toBeTruthy();

    // OH-only fields must NOT be rendered for admin_reviewer
    expect(component.queryByText(t('oh.detail.coordinator'))).toBeNull();
    expect(component.queryByText(t('oh.detail.acknowledgedBy'))).toBeNull();
    expect(component.queryByText(t('oh.detail.completedBy'))).toBeNull();
    expect(component.queryByText(t('oh.detail.events'))).toBeNull();
    expect(component.queryByText(t('oh.detail.acknowledge'))).toBeNull();
    expect(component.queryByText(t('oh.detail.complete'))).toBeNull();
  });

  test('3. exposed_professional renders only the status projection for their own declaration', async () => {
    useDemoRoleStore.getState().setRole('exposed_professional');

    const component = render(
      <ThemeProvider>
        <OhCoordinationDetailScreen />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(component.getByText(t('oh.status.completed'))).toBeTruthy();
    });

    // Reason must NOT be rendered for exposed_professional
    expect(component.queryByText(t('oh.detail.reason'))).toBeNull();
    expect(component.queryByText(t('oh.reason.routine_followup'))).toBeNull();

    // OH-only fields must NOT be rendered
    expect(component.queryByText(t('oh.detail.coordinator'))).toBeNull();
    expect(component.queryByText(t('oh.detail.acknowledgedBy'))).toBeNull();
    expect(component.queryByText(t('oh.detail.completedBy'))).toBeNull();
    expect(component.queryByText(t('oh.detail.events'))).toBeNull();
    expect(component.queryByText(t('oh.detail.acknowledge'))).toBeNull();
    expect(component.queryByText(t('oh.detail.complete'))).toBeNull();
  });

  test('4. quality_staff is blocked upfront and cannot access the detail screen', async () => {
    useDemoRoleStore.getState().setRole('quality_staff');

    const component = render(
      <ThemeProvider>
        <OhCoordinationDetailScreen />
      </ThemeProvider>,
    );

    expect(component.getByText(t('oh.error.unauthorized'))).toBeTruthy();
    expect(component.queryByText(t('oh.status.completed'))).toBeNull();
    expect(component.queryByText(t('oh.detail.reason'))).toBeNull();
    expect(component.queryByText(t('oh.detail.coordinator'))).toBeNull();
  });

  test('5. tech_admin is blocked upfront and cannot access the detail screen', async () => {
    useDemoRoleStore.getState().setRole('tech_admin');

    const component = render(
      <ThemeProvider>
        <OhCoordinationDetailScreen />
      </ThemeProvider>,
    );

    expect(component.getByText(t('oh.error.unauthorized'))).toBeTruthy();
    expect(component.queryByText(t('oh.status.completed'))).toBeNull();
    expect(component.queryByText(t('oh.detail.reason'))).toBeNull();
    expect(component.queryByText(t('oh.detail.coordinator'))).toBeNull();
  });

  test('6. unauthenticated session is blocked upfront', async () => {
    useDemoRoleStore.setState({
      activeRole: 'unauthenticated' as any,
      activeContext: UNAUTHENTICATED_CONTEXT,
      canDeclare: false,
      canReview: false,
      canRespondToCorrection: false,
      canCoordinate: false,
      canFollowUp: false,
      canViewSurveillance: false,
      canViewPrevention: false,
      canManagePrevention: false,
    });

    const component = render(
      <ThemeProvider>
        <OhCoordinationDetailScreen />
      </ThemeProvider>,
    );

    expect(component.getByText(t('oh.error.unauthorized'))).toBeTruthy();
    expect(component.queryByText(t('oh.status.completed'))).toBeNull();
  });

  test('7. handles optional declaration_reference: displays reference when present, fallback when absent', async () => {
    useDemoRoleStore.getState().setRole('admin_reviewer');

    // Test with reference present
    const comp1 = render(
      <ThemeProvider>
        <OhCoordinationDetailScreen />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(comp1.getByText(t('oh.status.completed'))).toBeTruthy();
    });
    // Reference number format AES-YYYY-XXXX is rendered
    expect(comp1.getByText(/^AES-\d{4}-\d+/)).toBeTruthy();

    // Now test with an unlinked/absent declaration_reference
    const db = getDatabase();
    const unlinkedDeclId = await db.createDraft({
      declared_by_user_id: 1,
      incident_date: '2026-04-01',
      incident_type: 'sexual_assault',
    });
    const unlinkedCoordId = await db.createOhCoordination({
      declaration_id: unlinkedDeclId,
      created_by_user_id: 2,
      coordination_reason: 'specialized_evaluation',
    });
    // Clear the reference number
    await (db as any).db.execute("UPDATE aes_declarations SET reference_number = '' WHERE id = ?", [unlinkedDeclId]);

    mockRouteParams = { coordinationId: unlinkedCoordId };

    const comp2 = render(
      <ThemeProvider>
        <OhCoordinationDetailScreen />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(comp2.getByText(t('oh.status.pending_acknowledgement'))).toBeTruthy();
    });
    // Fallback `Décl. #${declaration_id}` is rendered when declaration_reference is absent
    expect(comp2.getByText(`Décl. #${unlinkedDeclId}`)).toBeTruthy();
  });
});
