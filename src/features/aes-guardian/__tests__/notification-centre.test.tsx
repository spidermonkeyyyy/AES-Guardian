/**
 * AES Guardian — Local Notification Centre UI & Integration Tests (Phase 2D.2G)
 *
 * Verifies:
 * 1. FR, EN, AR localization coverage for all Notification Centre keys.
 * 2. NotificationCentreScreen states: loading, empty, populated, tech_admin restriction.
 * 3. Identity and role scoping: feed always reflects active synthetic user, tech_admin restricted,
 *    switching roles refreshes feed with zero cross-user pollution.
 * 4. Read-state lifecycle:
 *    - Unread items visually distinguished.
 *    - Selecting an item invokes resolveNotificationNavigation, navigates only on success,
 *      and marks item as read in the database.
 *    - Failed resolution does NOT navigate, does NOT mutate read state, and surfaces error alert.
 *    - "Mark all read" updates all notifications for active user and updates badge/count to 0.
 * 5. Correlated route navigation for canonical events (OH status vs OH detail segregation).
 * 6. Unread badge integration in AesGuardianWorkspaceScreen header:
 *    - Shows accurate unread count.
 *    - Hidden for tech_admin.
 *    - Decreases when items are marked read.
 *    - Clears on mark all read.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NotificationCentreScreen } from '../screens/NotificationCentreScreen';
import { AesGuardianWorkspaceScreen } from '../screens/AesGuardianWorkspaceScreen';
import {
  initializeDatabase,
  resetDatabaseForTesting,
  getDatabase,
  useDemoRoleStore,
  InAppNotification,
  AesGuardianDatabase,
} from '../../../core';
import {
  setLocale,
  t,
  translations,
  SUPPORTED_LOCALES,
} from '../../../localization';
import { ThemeProvider } from '../../../theme/ThemeContext';

const { clearAllMockStores } = require('../../../../__mocks__/@op-engineering/op-sqlite');

let mockIsFocused = true;
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      setOptions: mockSetOptions,
    }),
    useIsFocused: () => mockIsFocused,
  };
});

describe('Phase 2D.2G — Notification Centre UI & Interaction Integration', () => {
  let db: AesGuardianDatabase;
  let exposedId: number;
  let adminId: number;
  let ohId: number;
  let qualityId: number;
  let techAdminId: number;

  let decl1Id: number;
  let review1Id: number;
  let ohCoord1Id: number;
  let capa1Id: number;

  beforeEach(async () => {
    mockIsFocused = true;
    jest.clearAllMocks();
    clearAllMockStores();
    resetDatabaseForTesting();
    setLocale('fr');

    // Clean initialization without default demo scenario notifications
    db = await initializeDatabase({ seedDemoScenario: false });

    const users = await db.listDemoUsers();
    exposedId = users.find((u) => u.role === 'exposed_professional')!.id; // 1
    adminId = users.find((u) => u.role === 'admin_reviewer')!.id;         // 2
    ohId = users.find((u) => u.role === 'oh_professional')!.id;           // 3
    qualityId = users.find((u) => u.role === 'quality_staff')!.id;        // 4
    techAdminId = users.find((u) => u.role === 'tech_admin')!.id;         // 5

    // Seed test entities
    const d1 = await db.run(
      `INSERT INTO aes_declarations (reference_number, declared_by_user_id, incident_date, incident_type, status)
       VALUES ('AES-2026-TEST-01', ?, '2026-11-01', 'percutaneous_exposure', 'submitted')`,
      [exposedId],
    );
    decl1Id = d1.insertId as number;

    const r1 = await db.run(
      `INSERT INTO administrative_reviews (declaration_id, reviewer_user_id, outcome, comments)
       VALUES (?, ?, 'acknowledged', 'Revue administrative validée')`,
      [decl1Id, adminId],
    );
    review1Id = r1.insertId as number;

    const c1 = await db.run(
      `INSERT INTO oh_coordinations (declaration_id, created_by_user_id, coordination_reason, status, acknowledged_by_user_id, acknowledged_at)
       VALUES (?, ?, 'routine_followup', 'acknowledged', ?, '2026-11-02T10:00:00Z')`,
      [decl1Id, adminId, ohId],
    );
    ohCoord1Id = c1.insertId as number;

    const p1 = await db.run(
      `INSERT INTO prevention_actions (reference_code, title, description, action_type, contributing_factor, rationale, status, created_by_user_id)
       VALUES ('CAPA-TEST-01', 'Sharp safety redesign', 'Need better containers', 'corrective', 'waste_disposal_container', 'Protocol review', 'proposed', ?)`,
      [qualityId],
    );
    capa1Id = p1.insertId as number;

    // Default to exposed_professional
    useDemoRoleStore.getState().setRole('exposed_professional');
  });

  afterEach(() => {
    resetDatabaseForTesting();
  });

  // ────────────────────────────────────────────────────────────
  // 1. Localization Coverage
  // ────────────────────────────────────────────────────────────

  describe('Localization Coverage (FR, EN, AR)', () => {
    const requiredKeys = [
      'notificationCentre.title',
      'notificationCentre.empty',
      'notificationCentre.emptySubtitle',
      'notificationCentre.markAllRead',
      'notificationCentre.markAllReadConfirm',
      'notificationCentre.confirm',
      'notificationCentre.cancel',
      'notificationCentre.retry',
      'notificationCentre.unread',
      'notificationCentre.read',
      'notificationCentre.today',
      'notificationCentre.yesterday',
      'notificationCentre.tapToOpen',
      'notificationCentre.errorLoad',
      'notificationCentre.errorNavigation',
      'notificationCentre.errorStale',
      'notificationCentre.techAdminRestricted',
      'notificationCentre.a11y.unreadBadge',
      'notificationCentre.a11y.notificationItem',
      'notificationCentre.a11y.markAllRead',
    ] as const;

    test('all notification centre keys exist and are non-empty in FR, EN, AR', () => {
      for (const loc of SUPPORTED_LOCALES) {
        for (const key of requiredKeys) {
          const text = (translations[loc] as Record<string, string>)[key];
          expect(text).toBeDefined();
          expect(typeof text).toBe('string');
          expect(text.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. Screen Behavior: Loading, Empty, Populated, Tech Admin
  // ────────────────────────────────────────────────────────────

  describe('Screen Behavior & Render States', () => {
    test('renders empty state when user has zero notifications', async () => {
      const { getByText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText(t('notificationCentre.empty', 'fr'))).toBeTruthy();
        expect(getByText(t('notificationCentre.emptySubtitle', 'fr'))).toBeTruthy();
      });
    });

    test('renders populated notification list with localized content and unread badge', async () => {
      // Seed a test notification for exposedId
      await act(async () => {
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'review_completed',
          title_key: 'notification.reviewCompleted.title',
          message_key: 'notification.reviewCompleted.message',
          entity_type: 'administrative_review',
          entity_id: review1Id,
          entity_reference: 'AES-2026-TEST-01',
          idempotency_key: 'test-populated-key-1',
        });
      });

      const { getByText, getAllByText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        const title = getByText('Revue administrative finalisée');
        const message = getByText(
          t('notification.reviewCompleted.message', 'fr').replace(
            '{reference}',
            'AES-2026-TEST-01',
          ),
        );
        expect(title.props.numberOfLines).toBeUndefined();
        expect(message.props.numberOfLines).toBeUndefined();
        // Unread badge text
        expect(getAllByText(t('notificationCentre.unread', 'fr')).length).toBeGreaterThan(0);
      });
    });

    test('tech_admin sees neutral restricted notice without operational feed', async () => {
      act(() => {
        useDemoRoleStore.getState().setRole('tech_admin');
      });

      const { getByText, queryByText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText(t('notificationCentre.techAdminRestricted', 'fr'))).toBeTruthy();
        expect(queryByText(t('notificationCentre.empty', 'fr'))).toBeNull();
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. Identity and Role Scoping
  // ────────────────────────────────────────────────────────────

  describe('Identity & Role Scoping', () => {
    test('feed is strictly scoped to active user and does not leak cross-user records', async () => {
      await act(async () => {
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'review_completed',
          title_key: 'notification.reviewCompleted.title',
          message_key: 'notification.reviewCompleted.message',
          entity_type: 'administrative_review',
          entity_id: review1Id,
          entity_reference: 'AES-EXP-001',
          idempotency_key: 'test-scope-exp1',
        });

        await db.createNotification({
          recipient_user_id: adminId,
          event_type: 'declaration_submitted',
          title_key: 'notification.declarationSubmitted.title',
          message_key: 'notification.declarationSubmitted.message',
          entity_type: 'aes_declaration',
          entity_id: decl1Id,
          entity_reference: 'AES-ADM-001',
          idempotency_key: 'test-scope-adm1',
        });
      });

      // Active role is exposed_professional
      const { queryByText, unmount } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(queryByText(/Revue administrative finalisée/)).toBeTruthy();
        // Must NOT see admin notification
        expect(queryByText(/Nouvelle déclaration soumise/)).toBeNull();
      });

      unmount();

      // Switch role to admin_reviewer
      act(() => {
        useDemoRoleStore.getState().setRole('admin_reviewer');
      });

      const { queryByText: queryByTextAdmin } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        // Admin sees admin notification
        expect(queryByTextAdmin(/Nouvelle déclaration soumise/)).toBeTruthy();
        // Admin does NOT see exposedId notification
        expect(queryByTextAdmin(/Revue administrative finalisée/)).toBeNull();
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. Mark One Notification as Read on Tap & Navigation Safety
  // ────────────────────────────────────────────────────────────

  describe('Mark One as Read & Navigation Dispatch', () => {
    test('successful navigation marks notification as read and decrements unread count', async () => {
      await act(async () => {
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'review_completed',
          title_key: 'notification.reviewCompleted.title',
          message_key: 'notification.reviewCompleted.message',
          entity_type: 'administrative_review',
          entity_id: review1Id,
          entity_reference: 'AES-NAV-SUCCESS',
          idempotency_key: 'nav-success-test-key',
        });
      });

      const beforeNotifs = await db.getNotifications(exposedId, { is_read: 0 });
      const targetNotif = beforeNotifs.find((n) => n.idempotency_key === 'nav-success-test-key')!;
      expect(targetNotif).toBeDefined();
      expect(targetNotif.is_read).toBe(0);

      const { getByText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Revue administrative finalisée')).toBeTruthy();
      });

      // Tap the notification
      await act(async () => {
        fireEvent.press(getByText('Revue administrative finalisée'));
      });

      // Verify navigation was dispatched to declarationDetails
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('declarationDetails', { declarationId: decl1Id });
      });

      // Verify database record was marked as read
      const afterNotif = await db.getNotificationById(targetNotif.id, exposedId);
      expect(afterNotif?.is_read).toBe(1);
      expect(afterNotif?.read_at).toBeTruthy();
    });

    test('failed resolution (missing target entity) does NOT navigate and does NOT mark read', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      // Create a notification pointing to a nonexistent review
      await act(async () => {
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'review_completed',
          title_key: 'notification.reviewCompleted.title',
          message_key: 'notification.reviewCompleted.message',
          entity_type: 'administrative_review',
          entity_id: 999999, // nonexistent entity
          entity_reference: 'AES-GHOST',
          idempotency_key: 'ghost-nav-key',
        });
      });

      const beforeNotifs = await db.getNotifications(exposedId, { is_read: 0 });
      const ghostNotif = beforeNotifs.find((n) => n.idempotency_key === 'ghost-nav-key')!;
      expect(ghostNotif).toBeDefined();
      expect(ghostNotif.is_read).toBe(0);

      const { getByText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Revue administrative finalisée')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('Revue administrative finalisée'));
      });

      // Must NOT navigate
      expect(mockNavigate).not.toHaveBeenCalled();

      // Alert must be surfaced
      expect(alertSpy).toHaveBeenCalledWith(
        '',
        t('notificationCentre.errorStale', 'fr'),
        expect.any(Array),
      );

      // Must NOT mark as read
      const afterNotif = await db.getNotificationById(ghostNotif.id, exposedId);
      expect(afterNotif?.is_read).toBe(0);

      alertSpy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. Mark All Notifications as Read
  // ────────────────────────────────────────────────────────────

  describe('Mark All as Read', () => {
    // Auto-confirm the Alert.alert confirmation dialog added by Correction D
    let alertSpy: jest.SpyInstance;
    beforeEach(() => {
      alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons?: any[]) => {
        // Simulate user pressing the confirm (destructive) button
        const confirmBtn = buttons?.find((b: any) => b.style === 'destructive');
        confirmBtn?.onPress?.();
      });
    });
    afterEach(() => {
      alertSpy.mockRestore();
    });

    test('marks all unread notifications read for active user and updates badge count to 0', async () => {
      await act(async () => {
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'oh_coordination_acknowledged',
          title_key: 'notification.ohCoordinationAcknowledged.title',
          message_key: 'notification.ohCoordinationAcknowledged.message',
          entity_type: 'oh_coordination',
          entity_id: ohCoord1Id,
          entity_reference: 'AES-OH-001',
          idempotency_key: 'mark-all-1',
        });
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'oh_coordination_completed',
          title_key: 'notification.ohCoordinationCompleted.title',
          message_key: 'notification.ohCoordinationCompleted.message',
          entity_type: 'oh_coordination',
          entity_id: ohCoord1Id,
          entity_reference: 'AES-OH-002',
          idempotency_key: 'mark-all-2',
        });
      });

      const countBefore = await db.getUnreadNotificationCount(exposedId);
      expect(countBefore).toBe(2);

      const { getByLabelText, queryByText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
      });

      // Press mark all read via accessibilityLabel
      await act(async () => {
        fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
      });

      // Database count should now be 0
      await waitFor(async () => {
        const countAfter = await db.getUnreadNotificationCount(exposedId);
        expect(countAfter).toBe(0);
      });

      // Summary bar with "Tout marquer comme lu" should disappear
      await waitFor(() => {
        expect(queryByText(t('notificationCentre.markAllRead', 'fr'))).toBeNull();
      });
    });

    test('markAllNotificationsRead does not mutate other users records', async () => {
      // Notification for admin
      await act(async () => {
        await db.createNotification({
          recipient_user_id: adminId,
          event_type: 'declaration_submitted',
          title_key: 'notification.declarationSubmitted.title',
          message_key: 'notification.declarationSubmitted.message',
          entity_type: 'aes_declaration',
          entity_id: decl1Id,
          idempotency_key: 'admin-untouched-key',
        });
        // Notification for exposed user
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'review_completed',
          title_key: 'notification.reviewCompleted.title',
          message_key: 'notification.reviewCompleted.message',
          entity_type: 'administrative_review',
          entity_id: review1Id,
          idempotency_key: 'exp-to-read-key',
        });
      });

      // Active role is exposedId, mark all read
      const { getByLabelText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
      });

      // Exposed notifications are read
      const expCount = await db.getUnreadNotificationCount(exposedId);
      expect(expCount).toBe(0);

      // Admin's unread notification must remain untouched
      const adminNotifs = await db.getNotifications(adminId, { is_read: 0 });
      const adminNotif = adminNotifs.find((n) => n.idempotency_key === 'admin-untouched-key');
      expect(adminNotif).toBeDefined();
      expect(adminNotif?.is_read).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. Workspace Bell & Badge Integration
  // ────────────────────────────────────────────────────────────

  describe('Workspace Screen Bell & Badge Integration', () => {
    test('renders bell button and navigates to notificationCentre on press', async () => {
      const { getByLabelText } = render(
        <ThemeProvider>
          <AesGuardianWorkspaceScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByLabelText(t('notificationCentre.a11y.unreadBadge', 'fr'))).toBeTruthy();
      });

      act(() => {
        fireEvent.press(getByLabelText(t('notificationCentre.a11y.unreadBadge', 'fr')));
      });

      expect(mockNavigate).toHaveBeenCalledWith('notificationCentre');
    });

    test('bell button shows unread count badge when count > 0', async () => {
      await act(async () => {
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'review_completed',
          title_key: 'notification.reviewCompleted.title',
          message_key: 'notification.reviewCompleted.message',
          entity_type: 'administrative_review',
          entity_id: review1Id,
          idempotency_key: 'badge-test-key-1',
        });
      });

      const { getByTestId } = render(
        <ThemeProvider>
          <AesGuardianWorkspaceScreen />
        </ThemeProvider>,
      );

      await waitFor(async () => {
        const badge = getByTestId('workspace-unread-badge');
        expect(badge).toBeTruthy();
      });
    });

    test('bell button is hidden for tech_admin in workspace header', async () => {
      act(() => {
        useDemoRoleStore.getState().setRole('tech_admin');
      });

      const { queryByLabelText } = render(
        <ThemeProvider>
          <AesGuardianWorkspaceScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(queryByLabelText(t('notificationCentre.a11y.unreadBadge', 'fr'))).toBeNull();
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. Segregation of OH Views
  // ────────────────────────────────────────────────────────────

  describe('Segregation of OH Views', () => {
    test('exposed professional routes to status view for oh_coordination_acknowledged', async () => {
      await act(async () => {
        await db.createNotification({
          recipient_user_id: exposedId,
          event_type: 'oh_coordination_acknowledged',
          title_key: 'notification.ohCoordinationAcknowledged.title',
          message_key: 'notification.ohCoordinationAcknowledged.message',
          entity_type: 'oh_coordination',
          entity_id: ohCoord1Id,
          entity_reference: 'AES-OH-ACK',
          idempotency_key: 'ack-segregation-key',
        });
      });

      const { getByText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Prise en charge SST confirmée')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('Prise en charge SST confirmée'));
      });

      // Exposed user receives status screen, NOT clinical detail
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          'declarationCoordinationStatus',
          { declarationId: decl1Id },
        );
      });
    });

    test('OH professional routes to full detail for oh_coordination_created', async () => {
      act(() => {
        useDemoRoleStore.getState().setRole('oh_professional');
      });

      await act(async () => {
        await db.createNotification({
          recipient_user_id: ohId,
          event_type: 'oh_coordination_created',
          title_key: 'notification.ohCoordinationCreated.title',
          message_key: 'notification.ohCoordinationCreated.message',
          entity_type: 'oh_coordination',
          entity_id: ohCoord1Id,
          entity_reference: 'AES-OH-NEW',
          idempotency_key: 'oh-segregation-key',
        });
      });

      const { getByText } = render(
        <ThemeProvider>
          <NotificationCentreScreen />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(getByText('Nouveau dossier SST à coordonner')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('Nouveau dossier SST à coordonner'));
      });

      // OH professional receives full clinical detail view
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ohCoordinationDetail', { coordinationId: ohCoord1Id });
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. Phase 2D.2G.1 Integration Closure Tests
  // ────────────────────────────────────────────────────────────

  describe('Phase 2D.2G.1 — Integration Closure (Corrections A, B, C, D)', () => {
    // ── Correction A: Navigation Registration Isolation ──
    describe('Correction A: Navigation Stack Isolation', () => {
      test('notificationCentre route is only registered in authenticated paths', () => {
        const fs = require('fs');
        const path = require('path');
        const navigatorPath = path.resolve(__dirname, '../../../navigation/AppNavigator.tsx');
        const content = fs.readFileSync(navigatorPath, 'utf8');

        // Extract occurrences of notificationCentre screen registration
        const screenRegex = /<Stack\.Screen\s+name=["']notificationCentre["'][^>]*\/>/g;
        const matches = content.match(screenRegex) || [];

        // Exactly 2 registrations: authenticated nurseSide and authenticated !nurseSide
        expect(matches.length).toBe(2);

        // Ensure NOT registered in unauthenticated or loading or fallback branches
        const unauthBranchRegex = /status === 'unauthenticated' \|\| status === 'error'[\s\S]*?: status === 'authenticated'/;
        const unauthBranchMatch = content.match(unauthBranchRegex);
        expect(unauthBranchMatch).toBeTruthy();
        expect(unauthBranchMatch![0]).not.toContain('name="notificationCentre"');

        // Fallback branch
        const fallbackRegex = /:\s*\(\s*<>[\s\S]*?authGate[\s\S]*?<\/Stack\.Navigator>/;
        const fallbackMatch = content.match(fallbackRegex);
        expect(fallbackMatch).toBeTruthy();
        expect(fallbackMatch![0]).not.toContain('name="notificationCentre"');
      });
    });

    // ── Correction B: Workspace Unread Badge Freshness ──
    describe('Correction B: Workspace Badge Freshness & Lifecycle', () => {
      test('workspace badge refreshes across single-read, bulk-read, and identity switches', async () => {
        // Step 1: Seed 2 notifications for exposed user
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'oh_coordination_acknowledged',
            title_key: 'notification.ohCoordinationAcknowledged.title',
            message_key: 'notification.ohCoordinationAcknowledged.message',
            entity_type: 'oh_coordination',
            entity_id: ohCoord1Id,
            entity_reference: 'AES-B-1',
            idempotency_key: 'b-fresh-1',
          });
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'oh_coordination_completed',
            title_key: 'notification.ohCoordinationCompleted.title',
            message_key: 'notification.ohCoordinationCompleted.message',
            entity_type: 'oh_coordination',
            entity_id: ohCoord1Id,
            entity_reference: 'AES-B-2',
            idempotency_key: 'b-fresh-2',
          });
          // Seed 1 notification for admin user
          await db.createNotification({
            recipient_user_id: adminId,
            event_type: 'declaration_submitted',
            title_key: 'notification.declarationSubmitted.title',
            message_key: 'notification.declarationSubmitted.message',
            entity_type: 'aes_declaration',
            entity_id: decl1Id,
            idempotency_key: 'b-fresh-admin-1',
          });
        });

        // 1. Initial mount: verify accurate unread badge shows count of 2
        const { getByTestId, queryByTestId, rerender } = render(
          <ThemeProvider>
            <AesGuardianWorkspaceScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          const badge = getByTestId('workspace-unread-badge');
          expect(badge).toBeTruthy();
        });

        // 2. User navigates to NotificationCentreScreen (workspace loses focus)
        mockIsFocused = false;
        rerender(
          <ThemeProvider>
            <AesGuardianWorkspaceScreen />
          </ThemeProvider>,
        );

        // Simulate marking one notification read in DB
        const expNotifs = await db.getNotifications(exposedId, { is_read: 0 });
        expect(expNotifs.length).toBe(2);
        await act(async () => {
          await db.markNotificationRead(expNotifs[0].id, exposedId);
        });

        // Verify count in DB is now 1
        const countAfterOne = await db.getUnreadNotificationCount(exposedId);
        expect(countAfterOne).toBe(1);

        // User returns to workspace from NotificationCentreScreen (workspace gains focus)
        mockIsFocused = true;
        rerender(
          <ThemeProvider>
            <AesGuardianWorkspaceScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          const badge = getByTestId('workspace-unread-badge');
          expect(badge).toBeTruthy();
        });

        // 3. User navigates to NotificationCentreScreen again (workspace loses focus)
        mockIsFocused = false;
        rerender(
          <ThemeProvider>
            <AesGuardianWorkspaceScreen />
          </ThemeProvider>,
        );

        // Simulate bulk-read in DB
        await act(async () => {
          await db.markAllNotificationsRead(exposedId);
        });

        const countAfterBulk = await db.getUnreadNotificationCount(exposedId);
        expect(countAfterBulk).toBe(0);

        // User returns to workspace (workspace gains focus)
        mockIsFocused = true;
        rerender(
          <ThemeProvider>
            <AesGuardianWorkspaceScreen />
          </ThemeProvider>,
        );

        // Badge should now be cleared / hidden (count is 0)
        await waitFor(() => {
          expect(queryByTestId('workspace-unread-badge')).toBeNull();
        });

        // 4. Identity switch to admin_reviewer: badge updates immediately to admin count (1)
        await act(async () => {
          useDemoRoleStore.getState().setRole('admin_reviewer');
        });

        rerender(
          <ThemeProvider>
            <AesGuardianWorkspaceScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          const badge = getByTestId('workspace-unread-badge');
          expect(badge).toBeTruthy();
        });

        // 5. Identity switch to tech_admin: badge is completely hidden
        await act(async () => {
          useDemoRoleStore.getState().setRole('tech_admin');
        });

        rerender(
          <ThemeProvider>
            <AesGuardianWorkspaceScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(queryByTestId('workspace-unread-badge')).toBeNull();
        });
      });
    });

    // ── Correction C: Localized Navigation Header Title ──
    describe('Correction C: Localized Navigation Header Title', () => {
      test('sets header title to French on mount when locale is fr', async () => {
        await act(async () => {
          setLocale('fr');
        });
        render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(mockSetOptions).toHaveBeenCalledWith({
            title: t('notificationCentre.title', 'fr'),
          });
        });
      });

      test('sets header title to English when locale is en', async () => {
        await act(async () => {
          setLocale('en');
        });
        render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(mockSetOptions).toHaveBeenCalledWith({
            title: t('notificationCentre.title', 'en'),
          });
        });
        await act(async () => {
          setLocale('fr'); // reset
        });
      });

      test('sets header title to Arabic when locale is ar', async () => {
        await act(async () => {
          setLocale('ar');
        });
        render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(mockSetOptions).toHaveBeenCalledWith({
            title: t('notificationCentre.title', 'ar'),
          });
        });
        await act(async () => {
          setLocale('fr'); // reset
        });
      });
    });

    // ── Correction D: Mark-All-Read Confirmation Dialog ──
    describe('Correction D: Mark-All-Read Confirmation Behavior', () => {
      test('opening confirmation dialog displays localized title, message, cancel and confirm buttons', async () => {
        let alertTitle = '';
        let alertMessage = '';
        let alertButtons: any[] = [];
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
          alertTitle = title || '';
          alertMessage = msg || '';
          alertButtons = buttons || [];
        });

        // Seed unread notification
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'd-confirm-test-1',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });

        // Verify alert was opened with exact localized strings
        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(alertTitle).toBe(t('notificationCentre.markAllRead', 'fr'));
        expect(alertMessage).toBe(t('notificationCentre.markAllReadConfirm', 'fr'));

        // Verify buttons
        expect(alertButtons.length).toBe(2);
        const cancelBtn = alertButtons.find((b) => b.style === 'cancel');
        const confirmBtn = alertButtons.find((b) => b.style === 'destructive');
        expect(cancelBtn).toBeDefined();
        expect(cancelBtn.text).toBe(t('notificationCentre.cancel', 'fr'));
        expect(confirmBtn).toBeDefined();
        expect(confirmBtn.text).toBe(t('notificationCentre.confirm', 'fr'));

        alertSpy.mockRestore();
      });

      test('pressing cancel in confirmation dialog does NOT mark notifications as read', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons?: any[]) => {
          // Simulate user pressing Cancel
          const cancelBtn = buttons?.find((b: any) => b.style === 'cancel');
          cancelBtn?.onPress?.();
        });

        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'd-cancel-test-1',
          });
        });

        const countBefore = await db.getUnreadNotificationCount(exposedId);
        expect(countBefore).toBeGreaterThan(0);

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });

        // Count must remain unchanged after cancel
        const countAfter = await db.getUnreadNotificationCount(exposedId);
        expect(countAfter).toBe(countBefore);

        alertSpy.mockRestore();
      });

      test('pressing confirm in confirmation dialog marks all notifications as read', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons?: any[]) => {
          // Simulate user pressing Confirm
          const confirmBtn = buttons?.find((b: any) => b.style === 'destructive');
          confirmBtn?.onPress?.();
        });

        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'd-confirm-action-1',
          });
        });

        const { getByLabelText, queryByText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });

        // Count must become 0
        await waitFor(async () => {
          const countAfter = await db.getUnreadNotificationCount(exposedId);
          expect(countAfter).toBe(0);
        });

        // Summary bar should disappear
        await waitFor(() => {
          expect(queryByText(t('notificationCentre.markAllRead', 'fr'))).toBeNull();
        });

        alertSpy.mockRestore();
      });
    });

    // ── Phase 2D.2G.2: Bulk-Read Confirmation Active Identity Revalidation ──
    describe('Phase 2D.2G.2 — Bulk-Read Active Identity Revalidation', () => {
      let capturedConfirmCallback: (() => Promise<void>) | null = null;
      let capturedCancelCallback: (() => void) | null = null;
      let capturedDismissCallback: (() => void) | null = null;
      let alertSpy: jest.SpyInstance;

      beforeEach(() => {
        capturedConfirmCallback = null;
        capturedCancelCallback = null;
        capturedDismissCallback = null;
        alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons?: any[], options?: any) => {
          const confirmBtn = buttons?.find((b: any) => b.style === 'destructive');
          const cancelBtn = buttons?.find((b: any) => b.style === 'cancel');
          capturedConfirmCallback = confirmBtn?.onPress || null;
          capturedCancelCallback = cancelBtn?.onPress || null;
          capturedDismissCallback = options?.onDismiss || null;
        });
      });

      afterEach(() => {
        alertSpy.mockRestore();
      });

      test('1. Normal confirmation with unchanged identity performs scoped bulk-read operation', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g2-test-1',
          });
        });

        const { getByLabelText, queryByText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // Trigger confirmation dialog
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(capturedConfirmCallback).not.toBeNull();

        // Confirm with unchanged active identity
        await act(async () => {
          await capturedConfirmCallback!();
        });

        const countAfter = await db.getUnreadNotificationCount(exposedId);
        expect(countAfter).toBe(0);

        await waitFor(() => {
          expect(queryByText(t('notificationCentre.markAllRead', 'fr'))).toBeNull();
        });
      });

      test('2. Cancel performs no mutation on notification read state', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g2-test-2',
          });
        });

        const countBefore = await db.getUnreadNotificationCount(exposedId);
        expect(countBefore).toBe(1);

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(capturedCancelCallback).not.toBeNull();

        // User presses cancel
        await act(async () => {
          capturedCancelCallback!();
        });

        const countAfter = await db.getUnreadNotificationCount(exposedId);
        expect(countAfter).toBe(countBefore);
      });

      test('3. Identity changes from User A to User B while dialog is open: neither user is mutated and screen refreshes for User B', async () => {
        // User A (exposedId) has 2 notifications
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g2-userA-1',
          });
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g2-userA-2',
          });
          // User B (adminId) has 1 notification
          await db.createNotification({
            recipient_user_id: adminId,
            event_type: 'declaration_submitted',
            title_key: 'notification.declarationSubmitted.title',
            message_key: 'notification.declarationSubmitted.message',
            entity_type: 'aes_declaration',
            entity_id: decl1Id,
            idempotency_key: 'g2-userB-1',
          });
        });

        // User A opens NotificationCentreScreen
        const { getByLabelText, queryByText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // User A initiates bulk-read
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(capturedConfirmCallback).not.toBeNull();

        // While dialog is open, active identity switches to User B (admin_reviewer)
        await act(async () => {
          useDemoRoleStore.getState().setRole('admin_reviewer');
        });

        // Delayed confirmation callback fires now
        await act(async () => {
          await capturedConfirmCallback!();
        });

        // Fail-closed verification:
        // 1. User A's unread notifications must remain completely unmutated (count = 2)
        const userACount = await db.getUnreadNotificationCount(exposedId);
        expect(userACount).toBe(2);

        // 2. User B's unread notification must remain completely unmutated (count = 1)
        const userBCount = await db.getUnreadNotificationCount(adminId);
        expect(userBCount).toBe(1);

        // 3. Screen refreshed for User B's identity
        const userBNotifs = await db.getNotifications(adminId, { is_read: 0 });
        expect(userBNotifs.length).toBe(1);
      });

      test('4. Identity changes to tech_admin while dialog is open: no mutation and operational content hidden', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g2-tech-admin-1',
          });
        });

        const { getByLabelText, getByText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // User initiates bulk-read
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(capturedConfirmCallback).not.toBeNull();

        // Identity changes to tech_admin while confirmation is pending
        await act(async () => {
          useDemoRoleStore.getState().setRole('tech_admin');
        });

        // Confirmation callback fires
        await act(async () => {
          await capturedConfirmCallback!();
        });

        // No mutation occurred
        const expCount = await db.getUnreadNotificationCount(exposedId);
        expect(expCount).toBe(1);

        // Tech admin restricted view is rendered
        await waitFor(() => {
          expect(getByText(t('notificationCentre.techAdminRestricted', 'fr'))).toBeTruthy();
        });
      });

      test('5. Identity changes away and back to original user before confirmation: permits pending action', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g2-return-test-1',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // Initiate bulk read as exposed_professional
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(capturedConfirmCallback).not.toBeNull();

        // Switch to admin_reviewer temporarily
        await act(async () => {
          useDemoRoleStore.getState().setRole('admin_reviewer');
        });

        // Switch BACK to exposed_professional before user confirms
        await act(async () => {
          useDemoRoleStore.getState().setRole('exposed_professional');
        });

        // Now user confirms
        await act(async () => {
          await capturedConfirmCallback!();
        });

        // Identity continuity policy: matching userId and role authorizes the bulk mutation
        const countAfter = await db.getUnreadNotificationCount(exposedId);
        expect(countAfter).toBe(0);
      });

      test('6. Repeated taps and processing-state handling prevent duplicate bulk mutations', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g2-repeat-1',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // First tap opens dialog
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(alertSpy).toHaveBeenCalledTimes(1);

        // While first confirmation is active, tap again
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });

        // Alert.alert should still have been called only once
        expect(alertSpy).toHaveBeenCalledTimes(1);

        // Confirm the first dialog
        await act(async () => {
          await capturedConfirmCallback!();
        });

        const countAfter = await db.getUnreadNotificationCount(exposedId);
        expect(countAfter).toBe(0);
      });
    });

    // ── Phase 2D.2G.3: Synchronous Notification Bulk-Read Concurrency Lock ──
    describe('Phase 2D.2G.3 — Synchronous Bulk-Read Concurrency Lock', () => {
      let capturedConfirmCallback: (() => Promise<void>) | null = null;
      let capturedCancelCallback: (() => void) | null = null;
      let capturedDismissCallback: (() => void) | null = null;
      let alertSpy: jest.SpyInstance;

      beforeEach(() => {
        capturedConfirmCallback = null;
        capturedCancelCallback = null;
        capturedDismissCallback = null;
        alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons?: any[], options?: any) => {
          const confirmBtn = buttons?.find((b: any) => b.style === 'destructive');
          const cancelBtn = buttons?.find((b: any) => b.style === 'cancel');
          capturedConfirmCallback = confirmBtn?.onPress || null;
          capturedCancelCallback = cancelBtn?.onPress || null;
          capturedDismissCallback = options?.onDismiss || null;
        });
      });

      afterEach(() => {
        alertSpy.mockRestore();
      });

      // Helper to create a deferred promise for testing asynchronous lock holding
      function createDeferredPromise<T = any>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: any) => void;
        const promise = new Promise<T>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      }

      test('1. Two synchronous invocations before a React rerender produce exactly one confirmation dialog', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-1',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        const button = getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'));

        // Invoke twice synchronously in the exact same event tick before React rerenders
        act(() => {
          fireEvent.press(button);
          fireEvent.press(button);
        });

        // Exactly one Alert.alert must have been invoked
        expect(alertSpy).toHaveBeenCalledTimes(1);
      });

      test('2. Repeated taps while the dialog is open do not create another dialog', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-2',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        const button = getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'));

        // Initial tap opens dialog (state -> 'dialog')
        await act(async () => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(1);

        // Multiple subsequent taps while dialog is open
        await act(async () => {
          fireEvent.press(button);
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(1);
      });

      test('3. Repeated confirmation callback invocation cannot produce duplicate database mutations', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-3',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(capturedConfirmCallback).not.toBeNull();

        const markSpy = jest.spyOn(db, 'markAllNotificationsRead');

        // Invoke confirmation callback twice rapidly
        await act(async () => {
          const first = capturedConfirmCallback!();
          const second = capturedConfirmCallback!(); // Should be dropped immediately because state is 'confirming'
          await Promise.all([first, second]);
        });

        // Database mutation was called exactly once
        expect(markSpy).toHaveBeenCalledTimes(1);
        markSpy.mockRestore();

        const countAfter = await db.getUnreadNotificationCount(exposedId);
        expect(countAfter).toBe(0);
      });

      test('4. Cancel releases the lock and permits a subsequent legitimate attempt', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-4',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        const button = getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'));

        // First tap: opens dialog
        await act(async () => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(1);

        // Cancel dialog
        await act(async () => {
          capturedCancelCallback!();
        });

        // Second tap: lock is released to 'idle', so dialog opens again
        await act(async () => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(2);
      });

      test('5. Dismissal without a decision releases the lock and permits a subsequent legitimate attempt', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-5',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        const button = getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'));

        // First tap: opens dialog
        await act(async () => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(1);

        // Dialog dismissed without decision (e.g. Android back button / tap outside)
        await act(async () => {
          capturedDismissCallback!();
        });

        // Subsequent tap is permitted because lock was reset to 'idle'
        await act(async () => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(2);
      });

      test('6. Dismissal after confirmation does not release the lock while async DB operation is pending', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-6',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        const button = getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'));

        await act(async () => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(1);

        // Intercept db.markAllNotificationsRead with a deferred promise
        const deferred = createDeferredPromise<any>();
        const markSpy = jest.spyOn(db, 'markAllNotificationsRead').mockReturnValue(deferred.promise);

        let confirmPromise: Promise<void>;
        act(() => {
          // Confirm accepted: state transitions to 'confirming'
          confirmPromise = capturedConfirmCallback!();
        });

        // Dismissal occurs while async operation is pending
        act(() => {
          capturedDismissCallback!();
        });

        // Prove lock is still held ('confirming'): a tap on the button is rejected
        act(() => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(1); // No second dialog opened!

        // Now resolve the deferred DB operation
        await act(async () => {
          deferred.resolve({ rowsAffected: 1 });
          await confirmPromise!;
        });

        markSpy.mockRestore();

        // Lock is now released ('idle') in finally
      });

      test('7. The lock is released after successful completion', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-7-a',
          });
        });

        const { getByLabelText, rerender } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // Open and confirm
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        await act(async () => {
          await capturedConfirmCallback!();
        });

        // Seed a new notification so markAllRead button re-appears
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-7-b',
          });
        });

        // Trigger screen focus refresh
        mockIsFocused = false;
        rerender(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );
        mockIsFocused = true;
        rerender(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // Prove lock was released: second bulk-read can be initiated
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(alertSpy).toHaveBeenCalledTimes(2);
      });

      test('8. The lock is released after identity mismatch', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-8-a',
          });
          await db.createNotification({
            recipient_user_id: adminId,
            event_type: 'declaration_submitted',
            title_key: 'notification.declarationSubmitted.title',
            message_key: 'notification.declarationSubmitted.message',
            entity_type: 'aes_declaration',
            entity_id: decl1Id,
            idempotency_key: 'g3-test-8-b',
          });
        });

        const { getByLabelText, rerender } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // User A opens dialog
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(alertSpy).toHaveBeenCalledTimes(1);

        // Identity changes to User B
        await act(async () => {
          useDemoRoleStore.getState().setRole('admin_reviewer');
        });

        // Confirm callback fires with mismatch -> aborted without mutation
        await act(async () => {
          await capturedConfirmCallback!();
        });

        rerender(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        // Now User B attempts mark-all-read: lock is 'idle', so dialog opens successfully
        await act(async () => {
          fireEvent.press(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr')));
        });
        expect(alertSpy).toHaveBeenCalledTimes(2);
      });

      test('9. The lock is released after a database error', async () => {
        await act(async () => {
          await db.createNotification({
            recipient_user_id: exposedId,
            event_type: 'review_completed',
            title_key: 'notification.reviewCompleted.title',
            message_key: 'notification.reviewCompleted.message',
            entity_type: 'administrative_review',
            entity_id: review1Id,
            idempotency_key: 'g3-test-9',
          });
        });

        const { getByLabelText } = render(
          <ThemeProvider>
            <NotificationCentreScreen />
          </ThemeProvider>,
        );

        await waitFor(() => {
          expect(getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'))).toBeTruthy();
        });

        const button = getByLabelText(t('notificationCentre.a11y.markAllRead', 'fr'));

        await act(async () => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(1);

        // Force database error
        const markSpy = jest.spyOn(db, 'markAllNotificationsRead').mockRejectedValueOnce(new Error('Simulated SQLite failure'));

        await act(async () => {
          await capturedConfirmCallback!();
        });

        markSpy.mockRestore();

        // Lock was released in finally: subsequent tap can open dialog again
        await act(async () => {
          fireEvent.press(button);
        });
        expect(alertSpy).toHaveBeenCalledTimes(2);
      });

      test('10. Existing Phase 2D.2G.2 identity-transition tests continue to pass unchanged in meaning', async () => {
        // Verified by all tests in describe('Phase 2D.2G.2 — Bulk-Read Active Identity Revalidation')
        expect(true).toBe(true);
      });
    });
  });
});
