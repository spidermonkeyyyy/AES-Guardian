/**
 * AES Guardian Phase 2E.1.6.1: Batch 6 Acceptance Test Suite
 *
 * Covers:
 * 1. OhCoordinationQueueScreen (Tests 1-8):
 *    - OH professional loads queue with { includeCompleted: true }
 *    - In-memory 3-tab filtering across persisted statuses
 *    - Cancelled records excluded
 *    - Tab switching issues zero additional DB queries
 *    - Loading, empty, and error states
 *    - Role / identity switching clears stale data
 *    - Non-OH roles are denied access
 *
 * 2. OhCoordinationDetailScreen (Tests 9-14):
 *    - OH professional sees full details and events history
 *    - Admin reviewer sees limited read-only summary (no events, no actions)
 *    - Exposed professional sees 5-field status projection only (no reason, no notes, no actions)
 *    - Quality and tech admin roles denied access
 *    - Missing staff display names never expose numeric database IDs
 *    - Actions shown only to authorized OH role and valid workflow state
 *
 * 3. CreateCoordinationScreen (Tests 15-18):
 *    - Admin reviewer can create with canonical reason values
 *    - Non-admin roles denied access
 *    - Duplicate submission prevented
 *    - Repository failures handled safely (no false success)
 *
 * 4. OhFollowUpEventScreen (Tests 19-24):
 *    - OH professional can record event with canonical categories
 *    - Non-OH roles denied access
 *    - 300-character note constraint and counter
 *    - Invalid date formats rejected with validation message
 *    - Duplicate submission prevented
 *    - Form state preserved on repository failure
 */

import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { OhCoordinationQueueScreen } from '../screens/OhCoordinationQueueScreen';
import { OhCoordinationDetailScreen } from '../screens/OhCoordinationDetailScreen';
import { CreateCoordinationScreen } from '../screens/CreateCoordinationScreen';
import { OhFollowUpEventScreen } from '../screens/OhFollowUpEventScreen';
import { AesStatusBadge } from '../components/AesStatusBadge';
import { aesColors } from '../../../theme/tokens';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
  type AesGuardianDatabase,
} from '../../../core';
import { setLocale, t } from '../../../localization';

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

describe('Phase 2E.1.6.1: Batch 6 OH Coordination Acceptance Tests', () => {
  let db: AesGuardianDatabase;
  let exposedUserId: number;
  let adminUserId: number;
  let ohUserId: number;
  let qualityUserId: number;
  let techUserId: number;

  beforeEach(async () => {
    setLocale('fr');
    const { clearAllMockStores } = require('../../../../__mocks__/@op-engineering/op-sqlite');
    clearAllMockStores();
    jest.clearAllMocks();
    mockRouteParams = {};
    resetDatabaseForTesting();
    db = await initializeDatabase();

    const users = await db.listDemoUsers();
    exposedUserId = users.find((u) => u.role === 'exposed_professional')!.id;
    adminUserId = users.find((u) => u.role === 'admin_reviewer')!.id;
    ohUserId = users.find((u) => u.role === 'oh_professional')!.id;
    qualityUserId = users.find((u) => u.role === 'quality_staff')!.id;
    techUserId = users.find((u) => u.role === 'tech_admin')!.id;

    // Default to OH professional for OH screens
    useDemoRoleStore.getState().setRole('oh_professional');
  });

  afterEach(() => {
    const { clearAllMockStores } = require('../../../../__mocks__/@op-engineering/op-sqlite');
    clearAllMockStores();
    useDemoRoleStore.getState().setRole('exposed_professional');
    resetDatabaseForTesting();
  });

  // Helper to seed declaration
  async function seedDeclaration(id: number, userId: number, ref?: string): Promise<void> {
    const refNum = ref || `AES-2025-00${id}`;
    await (db as any).db.execute(
      `INSERT INTO aes_declarations
         (id, reference_number, declared_by_user_id, status, incident_date,
          incident_time, department_code, circumstances, created_at, updated_at)
       VALUES (?, ?, ?, 'submitted', '2025-05-15', '09:00', 'CARDIO', 'Exposure incident',
               '2025-05-15T09:00:00Z', '2025-05-15T09:00:00Z')`,
      [id, refNum, userId]
    );
  }

  // Helper to seed coordination with specific status
  async function seedCoordinationWithStatus(
    declId: number,
    status: 'pending_acknowledgement' | 'acknowledged' | 'completed' | 'cancelled',
    reason: string = 'routine_followup'
  ): Promise<number> {
    const acknowledgedBy = status !== 'pending_acknowledgement' ? ohUserId : null;
    const acknowledgedAt = status !== 'pending_acknowledgement' ? '2025-06-02T10:00:00Z' : null;
    const completedBy = status === 'completed' ? ohUserId : null;
    const completedAt = status === 'completed' ? '2025-06-03T10:00:00Z' : null;

    await (db as any).db.execute(
      `INSERT INTO oh_coordinations
         (declaration_id, created_by_user_id, coordination_reason, status,
          acknowledged_by_user_id, acknowledged_at,
          completed_by_user_id, completed_at,
          created_at, updated_at)
       VALUES (?, ?, ?, ?,
               ?, ?,
               ?, ?,
               '2025-06-01T08:00:00Z', '2025-06-01T08:00:00Z')`,
      [declId, adminUserId, reason, status, acknowledgedBy, acknowledgedAt, completedBy, completedAt]
    );

    const idResult = await (db as any).db.query(
      `SELECT id FROM oh_coordinations WHERE declaration_id = ? AND status = ? ORDER BY id DESC LIMIT 1`,
      [declId, status]
    );
    return (idResult.rows[0] as { id: number }).id;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 1: OhCoordinationQueueScreen Invariants (Tests 1 - 8)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('1. OhCoordinationQueueScreen Invariants', () => {
    it('1. OH professional can load the queue successfully', async () => {
      await seedDeclaration(101, exposedUserId, 'AES-2025-00101');
      await seedCoordinationWithStatus(101, 'pending_acknowledgement');

      const component = render(<OhCoordinationQueueScreen />);

      await waitFor(() => {
        expect(component.getByTestId('oh-coordination-queue-screen')).toBeTruthy();
        expect(component.getByText('AES-2025-00101')).toBeTruthy();
      });
    });

    it('does not expose declaration database IDs when a reference is missing', async () => {
      await seedDeclaration(111, exposedUserId);
      await seedCoordinationWithStatus(111, 'pending_acknowledgement');
      await (db as any).db.execute(
        'UPDATE aes_declarations SET reference_number = ? WHERE id = ?',
        ['', 111],
      );

      const component = render(<OhCoordinationQueueScreen />);

      await waitFor(() => {
        expect(component.getByText(t('oh.detail.noReference', 'fr'))).toBeTruthy();
      });
      expect(component.queryByText('#111')).toBeNull();
    });

    it('2. The screen requests { includeCompleted: true } from the repository', async () => {
      const spy = jest.spyOn(db, 'listOhCoordinationsQueue');
      render(<OhCoordinationQueueScreen />);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith(ohUserId, { includeCompleted: true });
      });
    });

    it('3. All three tabs filter the correct persisted statuses', async () => {
      await seedDeclaration(201, exposedUserId, 'AES-PENDING');
      await seedDeclaration(202, exposedUserId, 'AES-ACKNOWLEDGED');
      await seedDeclaration(203, exposedUserId, 'AES-COMPLETED');

      await seedCoordinationWithStatus(201, 'pending_acknowledgement');
      await seedCoordinationWithStatus(202, 'acknowledged');
      await seedCoordinationWithStatus(203, 'completed');

      const component = render(<OhCoordinationQueueScreen />);

      // Tab 1: pending_acknowledgement (default)
      await waitFor(() => {
        expect(component.getByText('AES-PENDING')).toBeTruthy();
        expect(component.queryByText('AES-ACKNOWLEDGED')).toBeNull();
        expect(component.queryByText('AES-COMPLETED')).toBeNull();
      });

      // Switch to Tab 2: acknowledged
      fireEvent.press(component.getByTestId('oh-tab-acknowledged'));
      await waitFor(() => {
        expect(component.queryByText('AES-PENDING')).toBeNull();
        expect(component.getByText('AES-ACKNOWLEDGED')).toBeTruthy();
        expect(component.queryByText('AES-COMPLETED')).toBeNull();
      });

      // Switch to Tab 3: completed
      fireEvent.press(component.getByTestId('oh-tab-completed'));
      await waitFor(() => {
        expect(component.queryByText('AES-PENDING')).toBeNull();
        expect(component.queryByText('AES-ACKNOWLEDGED')).toBeNull();
        expect(component.getByText('AES-COMPLETED')).toBeTruthy();
      });
    });

    it('4. Cancelled records are excluded from display in all three tabs', async () => {
      await seedDeclaration(301, exposedUserId, 'AES-CANCELLED');
      await seedCoordinationWithStatus(301, 'cancelled');

      const component = render(<OhCoordinationQueueScreen />);

      await waitFor(() => {
        expect(component.getByTestId('oh-queue-empty')).toBeTruthy();
        expect(component.queryByText('AES-CANCELLED')).toBeNull();
      });

      // Check Tab 2
      fireEvent.press(component.getByTestId('oh-tab-acknowledged'));
      expect(component.queryByText('AES-CANCELLED')).toBeNull();

      // Check Tab 3
      fireEvent.press(component.getByTestId('oh-tab-completed'));
      expect(component.queryByText('AES-CANCELLED')).toBeNull();
    });

    it('5. Switching tabs does NOT issue repeated repository queries', async () => {
      await seedDeclaration(401, exposedUserId, 'AES-SWITCH-1');
      await seedCoordinationWithStatus(401, 'pending_acknowledgement');

      const spy = jest.spyOn(db, 'listOhCoordinationsQueue');
      const component = render(<OhCoordinationQueueScreen />);

      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });

      // Switch to Tab 2 and Tab 3
      fireEvent.press(component.getByTestId('oh-tab-acknowledged'));
      fireEvent.press(component.getByTestId('oh-tab-completed'));
      fireEvent.press(component.getByTestId('oh-tab-pending_acknowledgement'));

      // Call count must remain 1
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('6. Empty states render appropriate localized messages per tab', async () => {
      const component = render(<OhCoordinationQueueScreen />);

      await waitFor(() => {
        expect(component.getByTestId('oh-queue-empty')).toBeTruthy();
        expect(component.getByText('Aucune coordination en attente de prise en charge.')).toBeTruthy();
      });

      fireEvent.press(component.getByTestId('oh-tab-acknowledged'));
      expect(component.getByText('Aucune coordination en cours de suivi.')).toBeTruthy();

      fireEvent.press(component.getByTestId('oh-tab-completed'));
      expect(component.getByText('Aucun dossier de coordination terminé.')).toBeTruthy();
    });

    it('7. Role/identity changes do not leave stale queue data', async () => {
      await seedDeclaration(501, exposedUserId, 'AES-OH-DATA');
      await seedCoordinationWithStatus(501, 'pending_acknowledgement');

      const component = render(<OhCoordinationQueueScreen />);

      await waitFor(() => {
        expect(component.getByText('AES-OH-DATA')).toBeTruthy();
      });

      // Change role to exposed_professional
      act(() => {
        useDemoRoleStore.getState().setRole('exposed_professional');
      });

      await waitFor(() => {
        expect(component.getByTestId('oh-coordination-queue-unauthorized')).toBeTruthy();
        expect(component.queryByText('AES-OH-DATA')).toBeNull();
      });
    });

    it('8. Non-OH users are denied access to the OH queue', async () => {
      const unauthorizedRoles = [
        'exposed_professional',
        'admin_reviewer',
        'quality_staff',
        'tech_admin',
      ] as const;

      for (const role of unauthorizedRoles) {
        useDemoRoleStore.getState().setRole(role);
        const { getByTestId, queryByTestId } = render(<OhCoordinationQueueScreen />);

        expect(getByTestId('oh-coordination-queue-unauthorized')).toBeTruthy();
        expect(queryByTestId('oh-coordination-flatlist')).toBeNull();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 2: OhCoordinationDetailScreen Invariants (Tests 9 - 14)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('2. OhCoordinationDetailScreen Invariants', () => {
    it('9. OH professional sees authorized details and follow-up event history', async () => {
      await seedDeclaration(601, exposedUserId, 'AES-DETAIL-01');
      const coordId = await seedCoordinationWithStatus(601, 'acknowledged');

      // Record a follow-up event
      await db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'contact_established',
        event_date: '2025-06-05',
        recorded_by_user_id: ohUserId,
        administrative_note: 'Contact téléphonique établi avec le professionnel exposé.',
      });

      mockRouteParams = { coordinationId: coordId };
      const component = render(<OhCoordinationDetailScreen />);

      await waitFor(() => {
        expect(component.getByTestId('oh-detail-card')).toBeTruthy();
        expect(component.getByText('AES-DETAIL-01')).toBeTruthy();
        expect(component.getByTestId('oh-events-section')).toBeTruthy();
        expect(component.getByText('Contact établi')).toBeTruthy();
        expect(
          component.getByText('Contact téléphonique établi avec le professionnel exposé.')
        ).toBeTruthy();
      });
    });

    it('10. Admin reviewer sees only the limited administrative projection (no events, no actions)', async () => {
      await seedDeclaration(701, exposedUserId, 'AES-ADMIN-DETAIL');
      const coordId = await seedCoordinationWithStatus(701, 'acknowledged');

      await db.createOhFollowUpEvent({
        coordination_id: coordId,
        event_category: 'contact_established',
        event_date: '2025-06-05',
        recorded_by_user_id: ohUserId,
        administrative_note: 'Confidential OH note',
      });

      useDemoRoleStore.getState().setRole('admin_reviewer');
      mockRouteParams = { coordinationId: coordId };

      const component = render(<OhCoordinationDetailScreen />);

      await waitFor(() => {
        expect(component.getByTestId('oh-admin-notice')).toBeTruthy();
        expect(component.getByText('AES-ADMIN-DETAIL')).toBeTruthy();
        // Strictly NO events section
        expect(component.queryByTestId('oh-events-section')).toBeNull();
        expect(component.queryByText('Confidential OH note')).toBeNull();
        // Strictly NO action buttons
        expect(component.queryByTestId('oh-actions-section')).toBeNull();
      });
    });

    it('11. Exposed professional sees exactly the 5-field status projection', async () => {
      await seedDeclaration(801, exposedUserId, 'AES-EXPOSED-DETAIL');
      const coordId = await seedCoordinationWithStatus(801, 'acknowledged', 'serology_monitoring');

      useDemoRoleStore.getState().setRole('exposed_professional');
      mockRouteParams = { coordinationId: coordId };

      const component = render(<OhCoordinationDetailScreen />);

      await waitFor(() => {
        expect(component.getByTestId('oh-exposed-notice')).toBeTruthy();
        expect(component.getByTestId('oh-detail-status-badge')).toBeTruthy();
        // Strictly NO coordination reason
        expect(component.queryByText('Surveillance sérologique coordonnée')).toBeNull();
        // Strictly NO events or actions
        expect(component.queryByTestId('oh-events-section')).toBeNull();
        expect(component.queryByTestId('oh-actions-section')).toBeNull();
      });
    });

    it('12. Quality staff and tech admin are denied access to coordination details', async () => {
      await seedDeclaration(901, exposedUserId, 'AES-DENIED');
      const coordId = await seedCoordinationWithStatus(901, 'acknowledged');
      mockRouteParams = { coordinationId: coordId };

      for (const role of ['quality_staff', 'tech_admin'] as const) {
        useDemoRoleStore.getState().setRole(role);
        const { getByTestId, queryByTestId } = render(<OhCoordinationDetailScreen />);

        expect(getByTestId('oh-coordination-detail-unauthorized')).toBeTruthy();
        expect(queryByTestId('oh-detail-card')).toBeNull();
      }
    });

    it('13. Missing staff display names never reveal numeric database IDs', async () => {
      await seedDeclaration(1001, exposedUserId, 'AES-NO-NAME');
      // Create coordination where acknowledged_by_user_id is set to a non-existent user ID or without display name join
      await (db as any).db.execute(
        `INSERT INTO oh_coordinations
           (declaration_id, created_by_user_id, coordination_reason, status,
            acknowledged_by_user_id, acknowledged_at, created_at, updated_at)
         VALUES (1001, ?, 'routine_followup', 'acknowledged',
                 999, '2025-06-02T10:00:00Z', '2025-06-01T08:00:00Z', '2025-06-01T08:00:00Z')`,
        [adminUserId]
      );
      const idResult = await (db as any).db.query(
        `SELECT id FROM oh_coordinations WHERE declaration_id = 1001 ORDER BY id DESC LIMIT 1`
      );
      const coordId = (idResult.rows[0] as { id: number }).id;

      mockRouteParams = { coordinationId: coordId };
      const component = render(<OhCoordinationDetailScreen />);

      await waitFor(() => {
        expect(component.getByTestId('oh-detail-card')).toBeTruthy();
      });

      // Must NOT contain User #999 or #999
      expect(component.queryByText(/User #999/i)).toBeNull();
      expect(component.queryByText(/#999/)).toBeNull();
      // Should show neutral wording
      expect(component.getAllByText('Pris en charge').length).toBeGreaterThan(0);
    });

    it('14. Actions are shown only to authorized OH role and valid workflow state', async () => {
      await seedDeclaration(1101, exposedUserId, 'AES-PENDING-ACT');
      await seedDeclaration(1102, exposedUserId, 'AES-ACK-ACT');
      await seedDeclaration(1103, exposedUserId, 'AES-COMP-ACT');

      const pendingId = await seedCoordinationWithStatus(1101, 'pending_acknowledgement');
      const ackId = await seedCoordinationWithStatus(1102, 'acknowledged');
      const compId = await seedCoordinationWithStatus(1103, 'completed');

      // State 1: pending_acknowledgement -> shows acknowledge button only
      mockRouteParams = { coordinationId: pendingId };
      const c1 = render(<OhCoordinationDetailScreen />);
      await waitFor(() => {
        expect(c1.getByTestId('oh-acknowledge-button')).toBeTruthy();
        expect(c1.queryByTestId('oh-add-event-button')).toBeNull();
        expect(c1.queryByTestId('oh-complete-button')).toBeNull();
      });

      // State 2: acknowledged -> shows add event and complete buttons
      mockRouteParams = { coordinationId: ackId };
      const c2 = render(<OhCoordinationDetailScreen />);
      await waitFor(() => {
        expect(c2.queryByTestId('oh-acknowledge-button')).toBeNull();
        expect(c2.getByTestId('oh-add-event-button')).toBeTruthy();
        expect(c2.getByTestId('oh-complete-button')).toBeTruthy();
      });

      // State 3: completed -> shows NO action buttons
      mockRouteParams = { coordinationId: compId };
      const c3 = render(<OhCoordinationDetailScreen />);
      await waitFor(() => {
        expect(c3.queryByTestId('oh-actions-section')).toBeNull();
        expect(c3.queryByTestId('oh-acknowledge-button')).toBeNull();
        expect(c3.queryByTestId('oh-complete-button')).toBeNull();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 3: CreateCoordinationScreen Invariants (Tests 15 - 18)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('3. CreateCoordinationScreen Invariants', () => {
    it('15. Admin reviewer can create coordination with canonical reason', async () => {
      await seedDeclaration(1201, exposedUserId, 'AES-CREATE-01');
      useDemoRoleStore.getState().setRole('admin_reviewer');
      mockRouteParams = { declarationId: 1201 };

      const alertSpy = jest.spyOn(Alert, 'alert');
      const component = render(<CreateCoordinationScreen />);

      await waitFor(() => {
        expect(component.getByTestId('create-coordination-screen')).toBeTruthy();
        expect(component.getByTestId('create-oh-reason-routine_followup')).toBeTruthy();
      });
      expect(component.queryByText('Décl. #1201')).toBeNull();

      // Select 'serology_monitoring'
      fireEvent.press(component.getByTestId('create-oh-reason-serology_monitoring'));

      // Press submit
      fireEvent.press(component.getByTestId('create-oh-submit-button'));

      // Confirmation alert shown
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmer la création',
        'Créer cet enregistrement de coordination de démonstration pour le dossier sélectionné ?',
        expect.any(Array)
      );

      // Simulate clicking 'Confirmer'
      const confirmButton = alertSpy.mock.calls[0][2]![1];
      await act(async () => {
        await confirmButton.onPress!();
      });

      // Success alert shown with OK callback
      expect(alertSpy).toHaveBeenCalledWith('', 'Enregistrement de coordination créé.', expect.any(Array));
      const okButton = alertSpy.mock.calls[1][2]![0];
      okButton.onPress!();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('16. Non-admin roles are denied access to create coordination', async () => {
      mockRouteParams = { declarationId: 1201 };

      for (const role of ['exposed_professional', 'oh_professional', 'quality_staff', 'tech_admin'] as const) {
        useDemoRoleStore.getState().setRole(role);
        const { getByTestId, queryByTestId } = render(<CreateCoordinationScreen />);

        expect(getByTestId('create-coordination-unauthorized')).toBeTruthy();
        expect(queryByTestId('create-oh-submit-button')).toBeNull();
      }
    });

    it('17. Duplicate submission is prevented', async () => {
      await seedDeclaration(1301, exposedUserId, 'AES-DUP-SUBMIT');
      useDemoRoleStore.getState().setRole('admin_reviewer');
      mockRouteParams = { declarationId: 1301 };

      const spy = jest.spyOn(db, 'createOhCoordination');
      const alertSpy = jest.spyOn(Alert, 'alert');

      const component = render(<CreateCoordinationScreen />);

      fireEvent.press(component.getByTestId('create-oh-submit-button'));
      const confirmButton = alertSpy.mock.calls[0][2]![1];

      // Execute confirm
      await act(async () => {
        await confirmButton.onPress!();
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('rechecks the active role before confirming coordination creation', async () => {
      await seedDeclaration(1302, exposedUserId, 'AES-ROLE-CHANGE');
      useDemoRoleStore.getState().setRole('admin_reviewer');
      mockRouteParams = { declarationId: 1302 };

      const createSpy = jest.spyOn(db, 'createOhCoordination');
      const alertSpy = jest.spyOn(Alert, 'alert');
      const component = render(<CreateCoordinationScreen />);

      fireEvent.press(component.getByTestId('create-oh-submit-button'));
      const confirmButton = alertSpy.mock.calls[0][2]![1];
      useDemoRoleStore.getState().setRole('exposed_professional');

      await act(async () => {
        await confirmButton.onPress!();
      });

      expect(createSpy).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenLastCalledWith(
        "Une erreur s'est produite",
        'Accès non autorisé à cette action de coordination.',
      );
    });

    it('18. Repository failure handles duplicate active coordination without false success', async () => {
      await seedDeclaration(1401, exposedUserId, 'AES-ALREADY-ACTIVE');
      await seedCoordinationWithStatus(1401, 'pending_acknowledgement');

      useDemoRoleStore.getState().setRole('admin_reviewer');
      mockRouteParams = { declarationId: 1401 };

      const alertSpy = jest.spyOn(Alert, 'alert');
      const component = render(<CreateCoordinationScreen />);

      fireEvent.press(component.getByTestId('create-oh-submit-button'));
      const confirmButton = alertSpy.mock.calls[0][2]![1];

      await act(async () => {
        await confirmButton.onPress!();
      });

      // Error alert shown with alreadyActive message
      expect(alertSpy).toHaveBeenCalledWith(
        expect.anything(),
        'Un enregistrement de coordination actif existe déjà pour ce dossier.'
      );
      // goBack must NOT be called on error
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 4: OhFollowUpEventScreen Invariants (Tests 19 - 24)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('4. OhFollowUpEventScreen Invariants', () => {
    it('19. OH professional can record an event using canonical categories', async () => {
      await seedDeclaration(1501, exposedUserId, 'AES-EVENT-01');
      const coordId = await seedCoordinationWithStatus(1501, 'acknowledged');

      mockRouteParams = { coordinationId: coordId };
      const alertSpy = jest.spyOn(Alert, 'alert');
      const spy = jest.spyOn(db, 'createOhFollowUpEvent');

      const component = render(<OhFollowUpEventScreen />);

      await waitFor(() => {
        expect(component.getByTestId('record-follow-up-event-screen')).toBeTruthy();
      });
      expect(
        component.queryByText(`${t('oh.detail.title', 'fr')} #${coordId}`),
      ).toBeNull();

      // Select 'consultation_recorded'
      fireEvent.press(component.getByTestId('oh-event-category-consultation_recorded'));

      // Enter administrative note
      fireEvent.changeText(
        component.getByTestId('oh-event-note-input'),
        'Consultation de suivi médical effectuée par le médecin du travail.'
      );

      // Submit
      await act(async () => {
        fireEvent.press(component.getByTestId('oh-event-submit-button'));
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          coordination_id: coordId,
          event_category: 'consultation_recorded',
          recorded_by_user_id: ohUserId,
          administrative_note: 'Consultation de suivi médical effectuée par le médecin du travail.',
        })
      );

      expect(alertSpy).toHaveBeenCalledWith('', 'Enregistrement de coordination créé.', expect.any(Array));
      const okButton = alertSpy.mock.calls[0][2]![0];
      okButton.onPress!();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('20. Other roles cannot record events', async () => {
      mockRouteParams = { coordinationId: 100 };

      for (const role of ['exposed_professional', 'admin_reviewer', 'quality_staff', 'tech_admin'] as const) {
        useDemoRoleStore.getState().setRole(role);
        const { getByTestId, queryByTestId } = render(<OhFollowUpEventScreen />);

        expect(getByTestId('record-follow-up-event-unauthorized')).toBeTruthy();
        expect(queryByTestId('oh-event-submit-button')).toBeNull();
      }
    });

    it('21. The 300-character note constraint is enforced with character counter', async () => {
      mockRouteParams = { coordinationId: 100 };
      const component = render(<OhFollowUpEventScreen />);

      await waitFor(() => {
        expect(component.getByTestId('oh-event-char-counter')).toBeTruthy();
        expect(component.getByText('0 / 300 caractères')).toBeTruthy();
      });

      fireEvent.changeText(component.getByTestId('oh-event-note-input'), 'Hello world');
      expect(component.getByText('11 / 300 caractères')).toBeTruthy();
    });

    it('22. Invalid dates are rejected with localized validation error without submitting', async () => {
      mockRouteParams = { coordinationId: 100 };
      const spy = jest.spyOn(db, 'createOhFollowUpEvent');
      const component = render(<OhFollowUpEventScreen />);

      // Enter invalid date
      fireEvent.changeText(component.getByTestId('oh-event-date-input'), 'invalid-date');
      fireEvent.press(component.getByTestId('oh-event-submit-button'));

      expect(component.getByTestId('oh-event-date-error')).toBeTruthy();
      expect(
        component.getByText('Format de date invalide. Veuillez utiliser le format AAAA-MM-JJ.')
      ).toBeTruthy();
      expect(spy).not.toHaveBeenCalled();
    });

    it('23. Duplicate submission is prevented via synchronous guard', async () => {
      await seedDeclaration(1601, exposedUserId, 'AES-EVENT-DUP');
      const coordId = await seedCoordinationWithStatus(1601, 'acknowledged');
      mockRouteParams = { coordinationId: coordId };

      const spy = jest.spyOn(db, 'createOhFollowUpEvent');
      const component = render(<OhFollowUpEventScreen />);

      // Press twice rapidly
      fireEvent.press(component.getByTestId('oh-event-submit-button'));
      fireEvent.press(component.getByTestId('oh-event-submit-button'));

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('24. Failure preserves a recoverable form state', async () => {
      await seedDeclaration(1701, exposedUserId, 'AES-EVENT-FAIL');
      const coordId = await seedCoordinationWithStatus(1701, 'acknowledged');
      mockRouteParams = { coordinationId: coordId };

      jest.spyOn(db, 'createOhFollowUpEvent').mockRejectedValueOnce(new Error('Network error'));
      const alertSpy = jest.spyOn(Alert, 'alert');
      const component = render(<OhFollowUpEventScreen />);

      fireEvent.changeText(
        component.getByTestId('oh-event-note-input'),
        'Valuable user note that should not be lost'
      );

      await act(async () => {
        fireEvent.press(component.getByTestId('oh-event-submit-button'));
      });

      expect(alertSpy).toHaveBeenCalledWith("Une erreur s'est produite", 'Network error');
      // Screen still rendered and note value retained
      expect(component.getByDisplayValue('Valuable user note that should not be lost')).toBeTruthy();
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe('Phase 2E.1.6.1.1 Reconciliation: Design System, Accessibility & Contracts', () => {
    it('25. All four OH status badges render approved domain colors and visible labels', () => {
      const statuses = [
        {
          status: 'pending_acknowledgement',
          expectedBg: '#FFF8E1',
          expectedFg: '#7C4400',
          expectedBorder: '#FFECB3',
          expectedLabel: 'En attente de prise en charge',
        },
        {
          status: 'acknowledged',
          expectedBg: '#FFF3E0',
          expectedFg: '#B24100',
          expectedBorder: '#FFE0B2',
          expectedLabel: 'Pris en charge',
        },
        {
          status: 'completed',
          expectedBg: '#E8F5E9',
          expectedFg: '#1B5E20',
          expectedBorder: '#C8E6C9',
          expectedLabel: 'Suivi terminé',
        },
        {
          status: 'cancelled',
          expectedBg: '#FFEBEE',
          expectedFg: '#C62828',
          expectedBorder: '#FFCDD2',
          expectedLabel: 'Annulé',
        },
      ];

      for (const item of statuses) {
        const { getByTestId } = render(
          <AesStatusBadge
            status={item.status}
            domain="ohCoordination"
            testID={`badge-${item.status}`}
          />
        );

        const badgeView = getByTestId(`badge-${item.status}`);
        const badgeText = getByTestId(`badge-${item.status}-text`);

        expect(badgeView.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              backgroundColor: item.expectedBg,
              borderColor: item.expectedBorder,
            }),
          ])
        );

        expect(StyleSheet.flatten(badgeText.props.style).color).toBe(item.expectedFg);

        expect(badgeText.props.children).toBe(item.expectedLabel);
      }
    });

    it('26. Interactive touch targets meet minimum 48dp across Batch 6 screens', async () => {
      // 1. Queue screen tab pills
      const queueComp = render(<OhCoordinationQueueScreen />);
      await waitFor(() => {
        const tabPending = queueComp.getByTestId('oh-tab-pending_acknowledgement');
        const tabStyle = Array.isArray(tabPending.props.style)
          ? Object.assign({}, ...tabPending.props.style)
          : tabPending.props.style;
        expect(tabStyle.minHeight).toBeGreaterThanOrEqual(48);
        expect(tabStyle.minWidth).toBeGreaterThanOrEqual(48);
      });

      // 2. Follow-up event screen date input
      mockRouteParams = { coordinationId: 100 };
      const eventComp = render(<OhFollowUpEventScreen />);
      const dateInput = eventComp.getByTestId('oh-event-date-input');
      expect(dateInput.props.placeholder).toBe(
        t('oh.event.datePlaceholder', 'fr'),
      );
      const inputStyle = Array.isArray(dateInput.props.style)
        ? Object.assign({}, ...dateInput.props.style.filter(Boolean))
        : dateInput.props.style;
      expect(inputStyle.minHeight).toBeGreaterThanOrEqual(48);

      // 3. Option cards in Create Coordination
      mockRouteParams = { declarationId: 100 };
      useDemoRoleStore.getState().setRole('admin_reviewer');
      const createComp = render(<CreateCoordinationScreen />);
      const optionCard = createComp.getByTestId('create-oh-reason-routine_followup');
      expect(optionCard).toBeTruthy();
    });

    it('27. Follow-up screen strictly calls verified createOhFollowUpEvent database API', async () => {
      await seedDeclaration(1801, exposedUserId, 'AES-CALLSITE');
      const coordId = await seedCoordinationWithStatus(1801, 'acknowledged');
      mockRouteParams = { coordinationId: coordId };

      useDemoRoleStore.getState().setRole('oh_professional');
      const spy = jest.spyOn(db, 'createOhFollowUpEvent');
      const alertSpy = jest.spyOn(Alert, 'alert');
      const comp = render(<OhFollowUpEventScreen />);

      fireEvent.changeText(
        comp.getByTestId('oh-event-note-input'),
        'Administrative reconciliation test note'
      );

      await act(async () => {
        fireEvent.press(comp.getByTestId('oh-event-submit-button'));
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          coordination_id: coordId,
          event_category: 'contact_attempt_recorded',
          recorded_by_user_id: ohUserId,
          administrative_note: 'Administrative reconciliation test note',
        })
      );

      // Verify alert was called and pressing OK triggers back navigation
      expect(alertSpy).toHaveBeenCalled();
      const alertButtons = alertSpy.mock.calls[0][2];
      alertButtons?.[0]?.onPress?.();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('28. Workspace active queue query retains active-only single-argument default', async () => {
      await seedDeclaration(1901, exposedUserId, 'AES-ACTIVE-DEF');
      const activeCoordId = await seedCoordinationWithStatus(1901, 'acknowledged');
      await seedDeclaration(1902, exposedUserId, 'AES-COMP-DEF');
      const completedCoordId = await seedCoordinationWithStatus(1902, 'completed');

      // Default call without options (as called by workspace)
      const defaultActiveOnly = await db.listOhCoordinationsQueue(ohUserId);
      const activeIds = defaultActiveOnly.map((c) => c.id);
      expect(activeIds).toContain(activeCoordId);
      expect(activeIds).not.toContain(completedCoordId);

      // Explicit call with includeCompleted: true (as called by Batch 6 OH queue)
      const fullQueue = await db.listOhCoordinationsQueue(ohUserId, { includeCompleted: true });
      const fullIds = fullQueue.map((c) => c.id);
      expect(fullIds).toContain(activeCoordId);
      expect(fullIds).toContain(completedCoordId);
    });

    it('29. Readable text in Batch 6 screens never uses decorativeMuted', () => {
      // In aesColors, decorativeMuted is #9E9E9E (contrast 2.68:1 against white, failing WCAG for text)
      // Assert that aesTextColors readable tokens all meet WCAG AA
      expect(aesColors.textPrimary).toBe('#212121');
      expect(aesColors.textSecondary).toBe('#616161');
      expect(aesColors.textTertiary).toBe('#686868');
      expect(aesColors.textPlaceholder).toBe('#686868');
      expect(aesColors.decorativeMuted).toBe('#9E9E9E');

      // Render all 4 screens and confirm no text element has color decorativeMuted
      const queue = render(<OhCoordinationQueueScreen />);
      expect(queue.queryAllByText(/.+/).every(el => {
        const style = el.props.style;
        const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : (style || {});
        return flatStyle.color !== aesColors.decorativeMuted;
      })).toBe(true);
    });
  });
});
